export type TimingDecision = 'Thinking' | 'FinishedSpeaking' | 'BriefPause';

export class TimingEngine {
  /**
   * Analyzes textual response cues and temporal gaps to decide if the user is finished speaking
   */
  static evaluateTurnTiming(
    text: string,
    silenceDurationMs: number,
    averageWordPaceWPM: number = 130
  ): TimingDecision {
    const trimmed = text.trim();
    if (trimmed.length === 0) return 'Thinking';

    // 1. Grammatical completion signals
    // Trailing punctuation usually means completed sentences
    const trailingPunctuation = /[.!?]$/.test(trimmed);
    
    // Trailing hesitation keywords / conjunctions (meaning they are still thinking)
    const trailingHesitations = /(?:and|but|or|so|because|like|with|euh|donc|mais|car|parce que|et|ou|alors|en fait)$/i.test(trimmed);

    // 2. Short answer special checks
    const words = trimmed.split(/\s+/);
    const wordCount = words.length;

    // If silence is very brief, keep listening
    if (silenceDurationMs < 800) {
      return 'BriefPause';
    }

    // If silence is medium (800ms - 2000ms):
    if (silenceDurationMs >= 800 && silenceDurationMs < 2000) {
      if (trailingHesitations) {
        return 'Thinking'; // Still thinking
      }
      if (trailingPunctuation || wordCount > 25) {
        return 'FinishedSpeaking'; // Sentences look complete
      }
      return 'Thinking'; // Default to let them continue
    }

    // If silence is long (> 2000ms):
    if (silenceDurationMs >= 2000) {
      if (trailingHesitations && silenceDurationMs < 3500) {
        return 'Thinking'; // Wait a bit longer for hesitation
      }
      return 'FinishedSpeaking'; // Assume they finished or got stuck
    }

    return 'FinishedSpeaking';
  }
}
