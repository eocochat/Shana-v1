export interface ReadinessPrediction {
  userId: string;
  interviewReadinessScore: number; // 0 to 100
  confidenceTrend: 'Increasing' | 'Stable' | 'Decreasing';
  improvementRatePercentage: number;
  estimatedInterviewSuccessScore: number; // 0 to 100
  skillGaps: Array<{ skill: string; gapLevel: 'High' | 'Medium' | 'Low' }>;
  weaknessPriorities: string[];
  disclaimer: string;
}

export class PredictionEngine {
  /**
   * Evaluates historical stats of a user and returns structured advisory readiness metrics.
   */
  static estimateReadiness(
    userId: string,
    starHistory: number[],
    confidenceHistory: number[],
    weaknesses: string[]
  ): ReadinessPrediction {
    const defaultDisclaimer = 'Advisory only. Shana predictions are calculated based on simulated metrics and do not guarantee actual employment outcomes or interview results with external employers.';
    
    if (starHistory.length === 0) {
      return {
        userId,
        interviewReadinessScore: 50,
        confidenceTrend: 'Stable',
        improvementRatePercentage: 0,
        estimatedInterviewSuccessScore: 50,
        skillGaps: [{ skill: 'Initial Baseline Assessment', gapLevel: 'Medium' }],
        weaknessPriorities: weaknesses.length > 0 ? weaknesses : ['Structuring Answers (STAR)'],
        disclaimer: defaultDisclaimer
      };
    }

    // Calculate averages
    const avgStar = starHistory.reduce((a, b) => a + b, 0) / starHistory.length;
    const avgConfidence = confidenceHistory.reduce((a, b) => a + b, 0) / confidenceHistory.length;

    // Determine trend
    let trend: 'Increasing' | 'Stable' | 'Decreasing' = 'Stable';
    if (confidenceHistory.length > 1) {
      const first = confidenceHistory[0];
      const last = confidenceHistory[confidenceHistory.length - 1];
      if (last > first + 10) trend = 'Increasing';
      else if (last < first - 10) trend = 'Decreasing';
    }

    // Determine improvement rate
    let improvementRate = 0;
    if (starHistory.length > 1) {
      const firstStar = starHistory[0];
      const lastStar = starHistory[starHistory.length - 1];
      improvementRate = lastStar - firstStar;
    }

    // Dynamic readiness scoring
    const readiness = Math.round((avgStar * 0.6) + (avgConfidence * 0.4));
    const estimatedSuccess = Math.round(readiness * 0.9); // Conservative discount

    // Skill gaps mapping
    const skillGaps: Array<{ skill: string; gapLevel: 'High' | 'Medium' | 'Low' }> = [];
    if (avgStar < 60) {
      skillGaps.push({ skill: 'STAR Answer Formatting', gapLevel: 'High' });
    } else if (avgStar < 80) {
      skillGaps.push({ skill: 'STAR Answer Formatting', gapLevel: 'Medium' });
    } else {
      skillGaps.push({ skill: 'STAR Answer Formatting', gapLevel: 'Low' });
    }

    if (avgConfidence < 50) {
      skillGaps.push({ skill: 'Speaking Confidence & Tempo', gapLevel: 'High' });
    } else {
      skillGaps.push({ skill: 'Speaking Confidence & Tempo', gapLevel: 'Low' });
    }

    // Prioritized list of focus points
    const priorities = [...weaknesses];
    if (avgStar < 70 && !priorities.includes('Quantitative Metrics')) {
      priorities.push('Quantified Business Impact metrics');
    }
    if (avgConfidence < 60 && !priorities.includes('Pacing')) {
      priorities.push('Nervous speaking speed or stuttering');
    }

    return {
      userId,
      interviewReadinessScore: Math.max(10, Math.min(100, readiness)),
      confidenceTrend: trend,
      improvementRatePercentage: Math.round(improvementRate),
      estimatedInterviewSuccessScore: Math.max(10, Math.min(100, estimatedSuccess)),
      skillGaps,
      weaknessPriorities: priorities.slice(0, 3),
      disclaimer: defaultDisclaimer
    };
  }
}
