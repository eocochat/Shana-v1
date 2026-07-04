import { ConversationAnalyticsState, PressureLevel } from './conversationState';

export class ConversationAnalyticsManager {
  static createInitialAnalytics(): ConversationAnalyticsState {
    return {
      averageResponseDurationSeconds: 0,
      followUpCount: 0,
      interruptionCount: 0,
      pressureEvolution: ['Neutral'],
      candidateSpeakingRatio: 0.5,
      aiSpeakingRatio: 0.5,
      engagementScore: 50,
      totalCandidateWords: 0,
      totalAIWords: 0,
      totalTurns: 0
    };
  }

  /**
   * Updates conversation metrics based on a completed turn cycle
   */
  static updateAnalytics(
    previousAnalytics: ConversationAnalyticsState,
    candidateText: string,
    aiText: string,
    isFollowUp: boolean,
    isInterrupted: boolean,
    activePressure: PressureLevel,
    turnSeconds: number
  ): ConversationAnalyticsState {
    const analytics = { ...previousAnalytics };

    const candidateWords = candidateText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const aiWords = aiText.trim().split(/\s+/).filter(w => w.length > 0).length;

    analytics.totalTurns += 1;
    analytics.totalCandidateWords += candidateWords;
    analytics.totalAIWords += aiWords;

    if (isFollowUp) analytics.followUpCount += 1;
    if (isInterrupted) analytics.interruptionCount += 1;

    analytics.pressureEvolution = [...analytics.pressureEvolution, activePressure];

    // Compute average candidate response duration
    if (turnSeconds > 0) {
      const prevTotalSeconds = analytics.averageResponseDurationSeconds * (analytics.totalTurns - 1);
      analytics.averageResponseDurationSeconds = Math.round((prevTotalSeconds + turnSeconds) / analytics.totalTurns);
    } else {
      // safe fallback assumption
      const prevTotalSeconds = analytics.averageResponseDurationSeconds * (analytics.totalTurns - 1);
      const estimatedSeconds = Math.round(candidateWords / 2.2); // assuming 130 words per minute average
      analytics.averageResponseDurationSeconds = Math.round((prevTotalSeconds + estimatedSeconds) / analytics.totalTurns);
    }

    // Compute balance ratios
    const totalCombinedWords = analytics.totalCandidateWords + analytics.totalAIWords;
    if (totalCombinedWords > 0) {
      analytics.candidateSpeakingRatio = parseFloat((analytics.totalCandidateWords / totalCombinedWords).toFixed(2));
      analytics.aiSpeakingRatio = parseFloat((analytics.totalAIWords / totalCombinedWords).toFixed(2));
    }

    // Engagement score heuristic
    // Engagement increases with healthy candidate speaking length and moderate conversational back-and-forth
    let computedEngagement = 50;
    if (candidateWords > 20 && candidateWords < 150) {
      computedEngagement += 20; // healthy length
    } else if (candidateWords >= 150) {
      computedEngagement += 10; // slightly wordy
    } else {
      computedEngagement -= 10; // too brief
    }

    if (analytics.followUpCount > 0) {
      computedEngagement += 15;
    }

    analytics.engagementScore = Math.min(100, Math.max(10, computedEngagement));

    return analytics;
  }
}
