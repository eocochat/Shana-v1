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
      totalTurns: 0,
      
      // Initialize human listening analytics
      averageResponseLatency: 1.6,
      naturalSilenceRatio: 0.18,
      recoverySpeedScore: 85,
      interruptionNecessityScore: 95,
      listeningQualityScore: 94,
      conversationPatienceScore: 96,
      candidateReflectionQuality: 88,
      turnTakingAccuracy: 99,
      thinkingPausesCount: 0,
      reflectionPausesCount: 0,

      // Initialize recruiter empathy analytics
      averageEmpathyScore: 95.8,
      supportInterventionsCount: 0,
      pressureAdaptationsCount: 0,
      confidenceRecoveryRate: 85,
      candidateEngagementScore: 78,
      encouragementFrequency: 0,
      empathyConsistency: 98,
      recruiterAdaptationQuality: 96,
      interviewComfortTrend: [75]
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
    turnSeconds: number,
    silenceType?: string,
    listeningState?: string,
    empathyMetrics?: any,
    hasDifficult?: boolean,
    encouragementEarned?: boolean
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

    // --- Human Listening Metrics Calculation ---
    analytics.thinkingPausesCount = previousAnalytics.thinkingPausesCount || 0;
    analytics.reflectionPausesCount = previousAnalytics.reflectionPausesCount || 0;

    if (silenceType === 'Thinking' || silenceType === 'SearchingForWords' || silenceType === 'MemoryRecall') {
      analytics.thinkingPausesCount += 1;
    }
    if (listeningState === 'reflecting' || silenceType === 'EmotionalPause') {
      analytics.reflectionPausesCount += 1;
    }

    // Calculate latency simulation based on pause type
    let turnLatency = 1.2;
    if (silenceType === 'MemoryRecall') turnLatency = 2.4;
    else if (silenceType === 'Thinking') turnLatency = 1.8;
    else if (silenceType === 'LongSilence') turnLatency = 3.5;
    else if (silenceType === 'MicroHesitation') turnLatency = 0.5;

    const prevLatency = previousAnalytics.averageResponseLatency || 1.6;
    analytics.averageResponseLatency = parseFloat(((prevLatency * (analytics.totalTurns - 1) + turnLatency) / analytics.totalTurns).toFixed(2));

    // Listening Quality Score (deduct for poor/unjustified interruptions)
    let currentListeningQuality = previousAnalytics.listeningQualityScore || 94;
    if (isInterrupted) {
      if (listeningState === 'reflecting' || listeningState === 'hesitating') {
        currentListeningQuality = Math.max(60, currentListeningQuality - 15); // BAD interruption
      } else {
        currentListeningQuality = Math.min(100, currentListeningQuality + 2); // GOOD interruption
      }
    } else {
      currentListeningQuality = Math.min(100, currentListeningQuality + 1); // good silent listening
    }
    analytics.listeningQualityScore = currentListeningQuality;

    // Patience score
    let currentPatience = previousAnalytics.conversationPatienceScore || 96;
    if (isInterrupted) {
      currentPatience = Math.max(50, currentPatience - 8);
    } else {
      currentPatience = Math.min(100, currentPatience + 1);
    }
    analytics.conversationPatienceScore = currentPatience;

    // Natural Silence Ratio
    const totalPauses = analytics.thinkingPausesCount + analytics.reflectionPausesCount;
    analytics.naturalSilenceRatio = parseFloat(Math.min(0.4, 0.1 + (totalPauses * 0.03)).toFixed(2));

    // Recovery Speed
    let currentRecovery = previousAnalytics.recoverySpeedScore || 85;
    if (silenceType === 'MemoryRecall' || silenceType === 'SearchingForWords') {
      currentRecovery = Math.min(100, currentRecovery + 4);
    }
    analytics.recoverySpeedScore = currentRecovery;

    // Interruption Necessity
    let currentNecessity = previousAnalytics.interruptionNecessityScore || 95;
    if (isInterrupted) {
      if (listeningState === 'rambling' || listeningState === 'repeating') {
        currentNecessity = Math.min(100, currentNecessity + 2);
      } else {
        currentNecessity = Math.max(40, currentNecessity - 12);
      }
    }
    analytics.interruptionNecessityScore = currentNecessity;

    // Candidate Reflection Quality
    let reflectionQuality = previousAnalytics.candidateReflectionQuality || 88;
    if (silenceType === 'MemoryRecall') {
      reflectionQuality = Math.min(100, reflectionQuality + 3);
    } else if (listeningState === 'rambling') {
      reflectionQuality = Math.max(50, reflectionQuality - 5);
    }
    analytics.candidateReflectionQuality = reflectionQuality;

    // Turn-taking accuracy
    let ttAcc = previousAnalytics.turnTakingAccuracy || 99;
    if (isInterrupted && (listeningState === 'reflecting' || silenceType === 'MemoryRecall')) {
      ttAcc = Math.max(70, ttAcc - 10);
    }
    analytics.turnTakingAccuracy = ttAcc;

    // --- Recruiter Empathy Metrics Calculation ---
    if (empathyMetrics) {
      analytics.supportInterventionsCount = (previousAnalytics.supportInterventionsCount || 0) + (hasDifficult ? 1 : 0);
      analytics.encouragementFrequency = (previousAnalytics.encouragementFrequency || 0) + (encouragementEarned ? 1 : 0);
      
      // Adaptation Count increments when pressure changes based on stress/workload
      let pressureAdapted = false;
      if (previousAnalytics.pressureEvolution && previousAnalytics.pressureEvolution.length > 0) {
        const lastPres = previousAnalytics.pressureEvolution[previousAnalytics.pressureEvolution.length - 1];
        if (lastPres !== activePressure) {
          pressureAdapted = true;
        }
      }
      analytics.pressureAdaptationsCount = (previousAnalytics.pressureAdaptationsCount || 0) + (pressureAdapted ? 1 : 0);

      analytics.confidenceRecoveryRate = empathyMetrics.recoveryRate;
      analytics.candidateEngagementScore = Math.round((analytics.candidateEngagementScore || 78) * 0.7 + empathyMetrics.engagementScore * 0.3);

      const comfort = empathyMetrics.comfortScore;
      const trend = [...(previousAnalytics.interviewComfortTrend || [75]), comfort];
      analytics.interviewComfortTrend = trend;

      // Empathy score averages comfort, recovery, and listeningQuality
      const avgScore = Math.round((comfort + empathyMetrics.recoveryRate + (analytics.listeningQualityScore || 94)) / 3);
      analytics.averageEmpathyScore = parseFloat(((previousAnalytics.averageEmpathyScore || 95.8) * 0.8 + avgScore * 0.2).toFixed(1));

      // Empathy Consistency: how close comfort scores are to ideal 80+
      const consistency = Math.max(60, 100 - Math.round(Math.abs(85 - comfort) * 0.5));
      analytics.empathyConsistency = Math.round(((previousAnalytics.empathyConsistency || 98) * 0.8 + consistency * 0.2));

      // Recruiter adaptation quality improves if they lower pressure when workload is high, or raise challenge when comfort is high
      let adaptationQuality = previousAnalytics.recruiterAdaptationQuality || 96;
      if (empathyMetrics.workloadScore > 60 && activePressure === 'Supportive') {
        adaptationQuality = Math.min(100, adaptationQuality + 2);
      } else if (empathyMetrics.comfortScore > 80 && activePressure === 'Demanding') {
        adaptationQuality = Math.min(100, adaptationQuality + 2);
      } else if (empathyMetrics.workloadScore > 70 && activePressure === 'Stress') {
        adaptationQuality = Math.max(50, adaptationQuality - 5); // too high pressure for overloaded candidate
      }
      analytics.recruiterAdaptationQuality = adaptationQuality;
    }

    return analytics;
  }
}
