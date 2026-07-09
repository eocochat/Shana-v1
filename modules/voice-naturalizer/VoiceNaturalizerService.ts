import { SpeechFormatter } from "./SpeechFormatter";
import { ResponseShortener } from "./ResponseShortener";
import { ConversationToneController } from "./ConversationToneController";
import { PauseInjector } from "./PauseInjector";

export interface NaturalizeOptions {
  recruiterId?: string;
  stage?: string; // welcome, core, challenging, closing, coach_transition
  candidateMood?: string; // nervous, confident, imposter, defensive, overload, flow
}

export class VoiceNaturalizerService {
  /**
   * Main entry point to naturalize AI response text into highly spoken, conversational recruiter format.
   * Runs the Speech Director pipeline:
   * 
   * Raw GPT-4o mini Output
   *        ↓
   *   ResponseShortener
   *        ↓
   *   SpeechFormatter
   *        ↓
   *   ConversationToneController
   *        ↓
   *   PauseInjector
   *        ↓
   * Spoken Recruiter Text
   */
  public static naturalize(
    text: string, 
    language: string = "English", 
    options?: NaturalizeOptions
  ): string {
    if (!text || !text.trim()) return "";

    const recruiterId = options?.recruiterId || "corporate";
    const stage = options?.stage || "core";
    const candidateMood = options?.candidateMood || "neutral";

    // Automatic language detection (French vs English) if language parameter is not specific
    let isFrench = language?.toLowerCase().includes("fren") || language?.toLowerCase() === "fr";
    if (!isFrench && text) {
      const frenchIndicators = [" le ", " la ", " les ", " de ", " et ", " en ", " pour ", " votre ", " vous ", " dans ", " avec ", " parlez ", " question ", " est ", " une ", "é", "à", "è", "ô", "î", "û"];
      isFrench = frenchIndicators.some(indicator => text.toLowerCase().includes(indicator)) || text.toLowerCase().includes("d'accord") || text.toLowerCase().includes("entendu");
    }

    try {
      // Shift gears completely for Coach Transitions
      const isCoachTransition = stage === 'coach_transition' || text.toLowerCase().includes("coaching") || text.toLowerCase().includes("session d'entraînement");
      
      let stepText = text;
      
      // Inject Contextual Micro-Conversational Behaviors (Human Interjections)
      const hasPrefix = isFrench 
        ? /^(hum|eh bien|alors|d'accord|je vois|ah|très bien)/i.test(stepText.trim())
        : /^(hmm|well|alright|i see|ah|right|ok|good)/i.test(stepText.trim());

      if (!hasPrefix && stage !== 'welcome' && !isCoachTransition) {
        let interjection = "";
        if (isFrench) {
          if (candidateMood === 'nervous' || candidateMood === 'imposter' || candidateMood === 'overload') {
            interjection = "Je comprends... Pas de soucis. ";
          } else if (candidateMood === 'flow') {
            interjection = "Excellent ! ";
          } else if (recruiterId === 'friendly') {
            const fillers = ["Ah, d'accord ! ", "Hum, je vois... ", "Très bien ! ", "Parfait... "];
            interjection = fillers[Math.abs(text.length) % fillers.length];
          } else if (recruiterId === 'founder') {
            const fillers = ["Super ! ", "Génial ! ", "Top ! ", "Entendu ! "];
            interjection = fillers[Math.abs(text.length) % fillers.length];
          } else if (recruiterId === 'executive') {
            interjection = "En effet... ";
          } else if (recruiterId === 'senior_eng' || recruiterId === 'tech_lead') {
            interjection = "Hum, d'accord... ";
          } else {
            interjection = "Très bien... ";
          }
        } else {
          if (candidateMood === 'nervous' || candidateMood === 'imposter' || candidateMood === 'overload') {
            interjection = "I understand... Take your time. ";
          } else if (candidateMood === 'flow') {
            interjection = "Excellent! ";
          } else if (recruiterId === 'friendly') {
            const fillers = ["Ah, got it! ", "Hmm, I see... ", "Alright, wonderful! ", "Great... "];
            interjection = fillers[Math.abs(text.length) % fillers.length];
          } else if (recruiterId === 'founder') {
            const fillers = ["Awesome! ", "Right, cool! ", "Great! ", "Got it! "];
            interjection = fillers[Math.abs(text.length) % fillers.length];
          } else if (recruiterId === 'executive') {
            interjection = "Indeed... ";
          } else if (recruiterId === 'senior_eng' || recruiterId === 'tech_lead') {
            interjection = "Hmm, right... ";
          } else {
            interjection = "Understood... ";
          }
        }
        stepText = interjection + stepText;
      }

      // Contextual Voice Adaptation
      if (candidateMood === 'nervous' || candidateMood === 'overload') {
        if (isFrench) {
          stepText = stepText.replace(/^(Je comprends\.\.\.)/i, "$1 Prenez une grande inspiration... ");
        } else {
          stepText = stepText.replace(/^(I understand\.\.\.)/i, "$1 Deep breath... ");
        }
      }

      // Step 1: Limit spoken output size (Never long paragraphs, short questions & feedback)
      let step1 = ResponseShortener.shorten(stepText, isFrench);

      // Step 2: Transform formal/robotic expressions into speech equivalents
      let step2 = SpeechFormatter.formatToSpeech(step1, isFrench);

      // Step 3: Enforce a professional, calm, or encouraging recruiter tone
      let step3 = ConversationToneController.adjustTone(step2, isFrench, recruiterId, stage);

      // Step 4: Inject natural pacing micro-pauses "..."
      let step4 = PauseInjector.inject(step3, isFrench, recruiterId, stage, candidateMood);

      // Final visual sanity cleanups
      let result = step4.trim();
      
      // Handle beautiful coach transition greetings if applicable
      if (isCoachTransition) {
        if (isFrench) {
          if (!result.includes("conclut") && !result.includes("coaching")) {
            result = "Voilà... Cela conclut notre entretien formel. Passons maintenant au coaching. " + result;
          }
        } else {
          if (!result.includes("concludes") && !result.includes("coaching")) {
            result = "Alright... That concludes our formal interview. Let's step into the coaching room. " + result;
          }
        }
      }

      if (!result) {
        throw new Error("Speech naturalization returned an empty string");
      }

      console.log(`[VoiceNaturalizer] Naturalized output successfully. Original length: ${text.length} chars, Naturalized: "${result}"`);
      return result;

    } catch (error) {
      console.error("[VoiceNaturalizer] Failed to naturalize text. Engaging failsafe short sentence mode.", error);
      return this.failsafeFallback(text);
    }
  }

  /**
   * Failsafe fallback: Truncates response strictly to a short sentence mode.
   */
  private static failsafeFallback(text: string): string {
    if (!text) return "";
    const cleanText = text.replace(/\s+/g, " ").trim();
    const sentenceRegex = /[^.!?]+[.!?]+(\s|$)/g;
    const sentences = cleanText.match(sentenceRegex)?.map(s => s.trim()) || [cleanText];

    // Pick at most 2 sentences to avoid robotic overload
    const selected = sentences.slice(0, 2);
    return selected.join(" ");
  }
}
export default VoiceNaturalizerService;

