export class PauseInjector {
  /**
   * Injects conversational pauses "..." at natural points:
   * - After initial short confirmations like "Alright", "Understood", "Good", "D'accord", "Entendu", "Très bien"
   * - Between segments of longer sentences, sparingly.
   */
  public static inject(text: string, isFrench: boolean = false): string {
    if (!text || !text.trim()) return "";

    let processed = text;

    // 1. Inject after initial confirmation words
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

    // 2. Add natural micro-pauses inside questions sparingly
    // e.g. "Tell me about yourself... in 60 seconds." or "Tell me about a time..."
    // Let's target specific structures
    if (isFrench) {
      processed = processed
        .replace(/(parlez-moi de vous|présentez-vous)([\s,]+)/gi, "$1... ")
        .replace(/(posez-vous la question)([\s,]+)/gi, "$1... ");
    } else {
      processed = processed
        .replace(/(tell me about yourself|describe your experience)([\s,]+)/gi, "$1... ")
        .replace(/(next question)([\s,]+)/gi, "$1... ");
    }

    // Clean up any double spaces or triple dots created accidentally
    processed = processed
      .replace(/\s+/g, " ")
      .replace(/\.{4,}/g, "...")
      .trim();

    return processed;
  }
}
