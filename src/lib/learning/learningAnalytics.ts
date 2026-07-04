export interface LearningAnalyticsSnapshot {
  dailyInterviewsCount: number;
  weeklyImprovementsAverage: number; // Avg star score increase week-over-week
  coachingEffectivenessRate: number; // % of users improving
  promptQualityIndex: number; // 0 to 100
  followUpSuccessRate: number; // helpful follow-ups ratio
  difficultyBalancedRatio: number; // % of balanced ratings
  knowledgeGrowthCount: number; // Number of unique facts learned
  companyProfileCoveragePercentage: number;
}

export class LearningAnalyticsManager {
  private static mockDatabase: LearningAnalyticsSnapshot = {
    dailyInterviewsCount: 45,
    weeklyImprovementsAverage: 12.4,
    coachingEffectivenessRate: 84.5,
    promptQualityIndex: 89.1,
    followUpSuccessRate: 91.5,
    difficultyBalancedRatio: 88.0,
    knowledgeGrowthCount: 154,
    companyProfileCoveragePercentage: 75.0
  };

  /**
   * Generates or increments global anonymous statistics
   */
  static recordTurnMetrics(
    wasHelpful: boolean,
    hasImproved: boolean,
    didComplete: boolean
  ): LearningAnalyticsSnapshot {
    const stats = this.mockDatabase;

    stats.dailyInterviewsCount += 1;
    if (wasHelpful) {
      stats.followUpSuccessRate = parseFloat(((stats.followUpSuccessRate * 49 + 100) / 50).toFixed(1));
    } else {
      stats.followUpSuccessRate = parseFloat(((stats.followUpSuccessRate * 49 + 0) / 50).toFixed(1));
    }

    if (hasImproved) {
      stats.coachingEffectivenessRate = parseFloat(((stats.coachingEffectivenessRate * 49 + 100) / 50).toFixed(1));
    }

    if (didComplete) {
      stats.promptQualityIndex = parseFloat(((stats.promptQualityIndex * 99 + 100) / 100).toFixed(1));
    }

    return { ...stats };
  }

  /**
   * Increments knowledge expansion counter
   */
  static logKnowledgeFactLearned(): void {
    this.mockDatabase.knowledgeGrowthCount += 1;
  }

  /**
   * Retrieves complete dashboard metrics
   */
  static getAnalyticsSnapshot(): LearningAnalyticsSnapshot {
    return { ...this.mockDatabase };
  }
}
