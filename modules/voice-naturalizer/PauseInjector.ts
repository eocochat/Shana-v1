export class PauseInjector {
  /**
   * Injects conversational pauses "..." at natural points:
   * - After initial short confirmations like "Alright", "Understood", "Good", "D'accord", "Entendu", "Très bien"
   * - Between segments of longer sentences, sparingly.
   */
  public static inject(
    text: string, 
    isFrench: boolean = false,
    recruiterId: string = "corporate",
    stage: string = "core",
    candidateMood: string = "neutral"
  ): string {
    if (!text || !text.trim()) return "";

    let processed = text;

    // Fast-tempo personalities (Founder, Investment Banker) speak with minimal pauses
    const isFastPaced = ["founder", "banker"].includes(recruiterId);
    // Slow, intimidating poker-face personality uses heavy strategic silence
    const isSilentType = recruiterId === "silent";
    // Anxious candidates get slower, highly empathetic, reassuring speech pacing
    const isCandidateNervous = ["nervous", "imposter", "overload"].includes(candidateMood);

    // 1. Power of Silence: Inject a thinking pause at the absolute beginning of the turn
    if (isSilentType) {
      processed = "... [pause] ... " + processed;
    } else if (stage === "challenging") {
      // Challenging recruiter takes a moment of tactical thinking before starting
      processed = isFrench ? "Hum... [pause] " + processed : "Hmm... [pause] " + processed;
    }

    // 2. Inject after initial confirmation words
    if (isFrench) {
      processed = processed
        .replace(/^D'accord\b[\s.,!]+/i, "D'accord... ")
        .replace(/^Entendu\b[\s.,!]+/i, "Entendu... ")
        .replace(/^Très bien\b[\s.,!]+/i, "Très bien... ")
        .replace(/^Bien\b[\s.,!]+/i, "Bien... ");
    } else {
      processed = processed
        .replace(/^Alright\b[\s.,!]+/i, "Alright... ")
        .replace(/^Understood\b[\s.,!]+/i, "Understood... ")
        .replace(/^Good\b[\s.,!]+/i, "Good... ")
        .replace(/^Okay\b[\s.,!]+/i, "Okay... ")
        .replace(/^Got it\b[\s.,!]+/i, "Got it... ");
    }

    // 3. Add natural micro-pauses inside questions sparingly
    if (isFrench) {
      processed = processed
        .replace(/(parlez-moi de vous|présentez-vous)([\s,]+)/gi, isCandidateNervous ? "$1... [pause] ... " : "$1... ")
        .replace(/(posez-vous la question)([\s,]+)/gi, "$1... ");
    } else {
      processed = processed
        .replace(/(tell me about yourself|describe your experience)([\s,]+)/gi, isCandidateNervous ? "$1... [pause] ... " : "$1... ")
        .replace(/(next question)([\s,]+)/gi, "$1... ");
    }

    // 4. Inject breathing markers inside long sentences (at logical conjunctions) for non-fast-paced recruiters
    if (!isFastPaced) {
      if (isFrench) {
        processed = processed
          .replace(/, mais\b/g, isCandidateNervous ? ", ... [pause] ... mais" : ", ... mais")
          .replace(/, car\b/g, isCandidateNervous ? ", ... [pause] ... car" : ", ... car")
          .replace(/, donc\b/g, isCandidateNervous ? ", ... [pause] ... donc" : ", ... donc");
      } else {
        processed = processed
          .replace(/, but\b/g, isCandidateNervous ? ", ... [pause] ... but" : ", ... but")
          .replace(/, because\b/g, isCandidateNervous ? ", ... [pause] ... because" : ", ... because")
          .replace(/, so\b/g, isCandidateNervous ? ", ... [pause] ... so" : ", ... so");
      }
    }

    // Clean up any double spaces or triple dots created accidentally
    processed = processed
      .replace(/\s+/g, " ")
      .replace(/\.{4,}/g, "...")
      .trim();

    return processed;
  }
}
