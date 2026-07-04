import { CoachingData, ContextMemoryState } from './conversationState';

export class CoachingEngine {
  static createInitialData(): CoachingData {
    return {
      speechSpeedWordsPerMinute: [],
      interruptionsTriggeredCount: 0,
      hesitationsDetectedCount: 0,
      fillerWordsUsedCount: {},
      confidenceTrend: [],
      starCompletenessTrend: []
    };
  }

  /**
   * Evaluates the candidate's answer for live coaching indicators
   */
  static evaluateTurn(
    text: string,
    confidenceScore: number,
    isInterrupted: boolean,
    previousData: CoachingData
  ): CoachingData {
    const data = {
      speechSpeedWordsPerMinute: [...previousData.speechSpeedWordsPerMinute],
      interruptionsTriggeredCount: previousData.interruptionsTriggeredCount,
      hesitationsDetectedCount: previousData.hesitationsDetectedCount,
      fillerWordsUsedCount: { ...previousData.fillerWordsUsedCount },
      confidenceTrend: [...previousData.confidenceTrend],
      starCompletenessTrend: [...previousData.starCompletenessTrend]
    };

    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // 1. Calculate Speech Speed (assuming a typical response takes about 35 seconds if not explicitly timed)
    // We add word counts or log simulated duration or assume normal pacing of 130 words per minute
    const estimatedDurationSeconds = Math.max(5, Math.min(180, wordCount / 2.2)); // safe heuristic
    const wpm = Math.round((wordCount / estimatedDurationSeconds) * 60) || 120;
    data.speechSpeedWordsPerMinute.push(wpm);

    // 2. Log interruptions
    if (isInterrupted) {
      data.interruptionsTriggeredCount += 1;
    }

    // 3. Filler word tracking
    const fillers = [
      'um', 'uh', 'er', 'ah', 'like', 'you know', 'actually', 'basically', 'so yeah',
      'euh', 'ben', 'genre', 'du coup', 'en fait', 'en gros', 'voilà'
    ];

    let turnHesitations = 0;
    fillers.forEach(f => {
      const regex = new RegExp(`\\b${f}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        const count = matches.length;
        data.fillerWordsUsedCount[f] = (data.fillerWordsUsedCount[f] || 0) + count;
        turnHesitations += count;
      }
    });

    data.hesitationsDetectedCount += turnHesitations;

    // 4. Log confidence trend
    data.confidenceTrend.push(confidenceScore);

    // 5. Evaluate STAR completeness
    const starScore = this.calculateStarCompleteness(text);
    data.starCompletenessTrend.push(starScore);

    return data;
  }

  /**
   * Helper to analyze conversational text for STAR pattern completeness (Situation, Task, Action, Result)
   */
  private static calculateStarCompleteness(text: string): number {
    const lower = text.toLowerCase();
    let score = 0;

    // Situation cues
    const situationIndicators = ['when I was', 'at my previous', 'the problem was', 'project where', 'context', 'dans mon ancien', 'lorsque j\'étais', 'le problème était'];
    if (situationIndicators.some(w => lower.includes(w))) score += 25;

    // Task cues
    const taskIndicators = ['my job was', 'tasked with', 'responsible for', 'goal was', 'objective', 'mission était', 'objectif était', 'chargé de'];
    if (taskIndicators.some(w => lower.includes(w))) score += 25;

    // Action cues
    const actionIndicators = ['I created', 'I developed', 'I designed', 'we built', 'implemented', 'refactored', 'j\'ai créé', 'j\'ai développé', 'j\'ai implémenté', 'conçu'];
    if (actionIndicators.some(w => lower.includes(w))) score += 25;

    // Result cues
    const resultIndicators = ['consequently', 'resulted in', 'improved by', 'decreased by', 'saved', 'grew', 'par conséquent', 'amélioré de', 'économisé', 'abouti à'];
    const hasNumbers = /\b\d+(?:%|\s*percent|k|m|b)?\b/.test(lower);
    if (resultIndicators.some(w => lower.includes(w)) || hasNumbers) score += 25;

    // Length-based structure padding
    if (text.length < 50) {
      score = Math.max(10, score - 30); // penalize too short answers
    }

    return score;
  }
}
