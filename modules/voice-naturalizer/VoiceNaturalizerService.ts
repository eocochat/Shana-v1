import { SpeechFormatter } from "./SpeechFormatter";
import { ResponseShortener } from "./ResponseShortener";
import { ConversationToneController } from "./ConversationToneController";
import { PauseInjector } from "./PauseInjector";

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
  public static naturalize(text: string, language: string = "English"): string {
    if (!text || !text.trim()) return "";

    // Automatic language detection (French vs English) if language parameter is not specific
    let isFrench = language?.toLowerCase().includes("fren") || language?.toLowerCase() === "fr";
    if (!isFrench && text) {
      const frenchIndicators = [" le ", " la ", " les ", " de ", " et ", " en ", " pour ", " votre ", " vous ", " dans ", " avec ", " parlez ", " question ", " est ", " une ", "é", "à", "è", "ô", "î", "û"];
      isFrench = frenchIndicators.some(indicator => text.toLowerCase().includes(indicator)) || text.toLowerCase().includes("d'accord") || text.toLowerCase().includes("entendu");
    }

    try {
      // Step 1: Limit spoken output size (Never long paragraphs, short questions & feedback)
      let step1 = ResponseShortener.shorten(text, isFrench);

      // Step 2: Transform formal/robotic expressions into speech equivalents
      let step2 = SpeechFormatter.formatToSpeech(step1, isFrench);

      // Step 3: Enforce a professional, calm, slightly formal recruiter tone
      let step3 = ConversationToneController.adjustTone(step2, isFrench);

      // Step 4: Inject natural pacing micro-pauses "..."
      let step4 = PauseInjector.inject(step3, isFrench);

      // Final visual sanity cleanups
      let result = step4.trim();
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
