export class ResumeController {
  /**
   * Decides whether we should resume speaking the interrupted sentence.
   * If the interruption happened near the end of the sentence (>80% of the text),
   * or if the user provided a full early answer, we should NOT resume.
   * If it was interrupted right at the beginning (<40%), we can resume.
   */
  public shouldResume(
    interruptedText: string,
    charIndexPosition: number,
    interruptionCount: number,
    isEarlyAnswer: boolean
  ): boolean {
    if (!interruptedText) return false;
    if (isEarlyAnswer) return false;

    // If the user is interrupting repeatedly (e.g. 3+ times), don't resume to avoid loops
    if (interruptionCount > 2) {
      console.log(`[ResumeController] Too many interruptions (${interruptionCount}). Skipping resume.`);
      return false;
    }

    const totalLen = interruptedText.length;
    if (totalLen === 0) return false;

    const progressRatio = charIndexPosition / totalLen;

    // If we finished more than 75% of the sentence, do not resume
    if (progressRatio > 0.75) {
      console.log(`[ResumeController] Spoke ${Math.round(progressRatio * 100)}% of the sentence. Skipping resume.`);
      return false;
    }

    // If we spoke less than 10% of the sentence, it's basically the beginning, resume is perfect
    console.log(`[ResumeController] Decided to resume. Spoke ${Math.round(progressRatio * 100)}% of the sentence.`);
    return true;
  }

  /**
   * Builds a natural transition phrase for resuming the interview, prefixing the remaining text.
   */
  public getResumeText(
    interruptedText: string,
    charIndexPosition: number,
    isFrench: boolean = false
  ): string {
    if (!interruptedText) return "";

    // Extract the remaining unspoken text
    const remainingText = interruptedText.substring(charIndexPosition).trim();
    if (!remainingText) return "";

    // Prefixes to make it sound human and conversational
    const prefixes = isFrench
      ? [
          "Pour continuer...",
          "Comme je le disais...",
          "Je disais donc...",
          "Bref...",
        ]
      : [
          "As I was saying...",
          "To continue...",
          "So...",
          "Anyway...",
        ];

    // Select a prefix based on string length or pseudo-randomly
    const prefix = prefixes[remainingText.length % prefixes.length];

    return `${prefix} ${remainingText}`;
  }
}
