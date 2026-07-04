export interface PersonalCoachingMemory {
  userId: string;
  strengths: string[];
  weaknesses: string[];
  preferredLanguage: string;
  speechSpeedTrend: number[]; // speaking WPM trend
  confidenceEvolution: number[]; // confidence ratings
  starPerformanceScores: number[]; // STAR completeness scores
  technicalStrengths: string[];
  leadershipExamples: string[];
  recurringMistakes: string[];
  favoriteInterviewModes: string[];
  improvementHistory: Array<{
    date: string;
    focusArea: string;
    scoreDiff: number;
    description: string;
  }>;
}

export class PersonalMemoryManager {
  private static STORAGE_KEY_PREFIX = 'shana_personal_memory_';

  /**
   * Create a new empty personal memory state
   */
  static createInitialMemory(userId: string): PersonalCoachingMemory {
    return {
      userId,
      strengths: [],
      weaknesses: [],
      preferredLanguage: 'English',
      speechSpeedTrend: [],
      confidenceEvolution: [],
      starPerformanceScores: [],
      technicalStrengths: [],
      leadershipExamples: [],
      recurringMistakes: [],
      favoriteInterviewModes: [],
      improvementHistory: []
    };
  }

  /**
   * Load personal memory from local storage (or mock/in-memory DB fallback)
   */
  static loadMemory(userId: string): PersonalCoachingMemory {
    try {
      const data = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${userId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('[PERSONAL MEMORY] Local storage read error or disabled', e);
    }
    return this.createInitialMemory(userId);
  }

  /**
   * Save personal memory to local storage
   */
  static saveMemory(memory: PersonalCoachingMemory): void {
    try {
      localStorage.setItem(`${this.STORAGE_KEY_PREFIX}${memory.userId}`, JSON.stringify(memory));
    } catch (e) {
      console.warn('[PERSONAL MEMORY] Local storage write error or full', e);
    }
  }

  /**
   * Evaluates the latest turn data and updates the personal memory vector
   */
  static updateMemoryWithLatestTurn(
    userId: string,
    userInput: string,
    confidence: number,
    starScore: number,
    wpm: number
  ): PersonalCoachingMemory {
    const memory = this.loadMemory(userId);

    // Update trend arrays, cap length at last 10 records for privacy and storage size
    memory.confidenceEvolution.push(confidence);
    if (memory.confidenceEvolution.length > 10) memory.confidenceEvolution.shift();

    memory.starPerformanceScores.push(starScore);
    if (memory.starPerformanceScores.length > 10) memory.starPerformanceScores.shift();

    if (wpm > 0) {
      memory.speechSpeedTrend.push(wpm);
      if (memory.speechSpeedTrend.length > 10) memory.speechSpeedTrend.shift();
    }

    // Basic heuristic indicators for mistakes / strengths
    const textLower = userInput.toLowerCase();
    if (textLower.includes('actually') || textLower.includes('maybe') || textLower.includes('probably')) {
      if (!memory.recurringMistakes.includes('hesitation-words')) {
        memory.recurringMistakes.push('hesitation-words');
      }
    }

    if (textLower.includes('led') || textLower.includes('managed') || textLower.includes('ownership')) {
      if (!memory.leadershipExamples.includes('active-team-leadership')) {
        memory.leadershipExamples.push('active-team-leadership');
      }
    }

    this.saveMemory(memory);
    return memory;
  }

  /**
   * Generates a conversational custom greeting/preface prompt directive
   * based on previous session memories to reinforce training progress.
   */
  static getPersonalizedDirective(userId: string, language: string = 'English'): string {
    const memory = this.loadMemory(userId);
    const isEng = language === 'English' || language === 'EN' || language === 'en';

    // Heuristically look at weaknesses or trends
    if (memory.speechSpeedTrend.length > 0) {
      const avgSpeed = memory.speechSpeedTrend.reduce((a, b) => a + b, 0) / memory.speechSpeedTrend.length;
      if (avgSpeed > 150) {
        return isEng
          ? `[PERSONALIZATION DIRECTIVE]: Address the candidate mentioning pacing first, e.g., "I'll pay special attention to your pacing today."`
          : `[PERSONALIZATION DIRECTIVE]: Recommandez poliment au candidat de ralentir, par exemple, "Je prêterai une attention particulière à votre rythme aujourd'hui."`;
      }
    }

    if (memory.starPerformanceScores.length > 0) {
      const lastScore = memory.starPerformanceScores[memory.starPerformanceScores.length - 1];
      if (lastScore < 40) {
        return isEng
          ? `[PERSONALIZATION DIRECTIVE]: Encourage the candidate to focus on the structure of their answer today, specifically STAR methodology metrics.`
          : `[PERSONALIZATION DIRECTIVE]: Encouragez le candidat à structurer ses réponses aujourd'hui, notamment avec la méthodologie STAR.`;
      }
    }

    return "";
  }
}
