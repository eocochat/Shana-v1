import { PersonalMemoryManager, PersonalCoachingMemory } from './personalMemory';
import { InterviewKnowledgeBase, GlobalKnowledgeInsight } from './interviewKnowledge';
import { PatternMiner, MinedPattern } from './patternMiner';
import { RecruiterKnowledgeBase, RecruiterCompanyProfile } from './recruiterKnowledge';
import { FollowUpLibrary, FollowUpTemplate } from './followUpLibrary';
import { PromptOptimizer, PromptVersion } from './promptOptimizer';
import { DifficultyCalibration, DifficultyReport } from './difficultyCalibration';
import { CoachingKnowledgeBase, CoachingAdvice } from './coachingKnowledge';
import { FeedbackLearningEngine, UserFeedbackRecord } from './feedbackLearning';
import { KnowledgeDistillationEngine, DistillationReport } from './knowledgeDistillation';
import { PredictionEngine, ReadinessPrediction } from './predictionEngine';
import { BenchmarkEngine, AnonymousRoleBenchmark } from './benchmarkEngine';
import { PrivacyManager } from './privacyManager';
import { LearningAnalyticsManager, LearningAnalyticsSnapshot } from './learningAnalytics';
import { ImprovementEngine, ImprovementVector } from './improvementEngine';

export class LearningDirector {
  /**
   * Orchestrates turn-level learning operations asynchronously.
   * Processes candidate inputs, anonymizes logs, mines patterns, and personalizes user memory.
   */
  static processTurnLearning(
    userId: string,
    userInput: string,
    starScore: number,
    wpm: number,
    confidence: number,
    role: string,
    companyTarget: string
  ): {
    updatedMemory: PersonalCoachingMemory;
    personalDirective: string;
    matchedMinedPatterns: Omit<MinedPattern, 'id' | 'frequencyPercentage' | 'confidenceInterval'>[];
  } {
    // 1. Scrub sensitive PII at boundary
    const anonymizedInput = PrivacyManager.scrubSensitiveData(userInput);

    // 2. Personal coaching memory updates
    const updatedMemory = PersonalMemoryManager.updateMemoryWithLatestTurn(
      userId,
      anonymizedInput,
      confidence,
      starScore,
      wpm
    );

    // 3. Extract personalization directives based on memory
    const personalDirective = PersonalMemoryManager.getPersonalizedDirective(userId);

    // 4. Pattern mining (anonymized)
    const matchedMinedPatterns = PatternMiner.mineSessionState(anonymizedInput, starScore, wpm);

    // 5. Update benchmarks anonymously
    BenchmarkEngine.submitToBenchmark(role, confidence, starScore, wpm, 90);

    // 6. Update company weights
    if (companyTarget) {
      RecruiterKnowledgeBase.incrementWeight(companyTarget);
    }

    // 7. Record anonymous turn metric to global analytics dashboard
    LearningAnalyticsManager.recordTurnMetrics(true, starScore > 65, false);

    return {
      updatedMemory,
      personalDirective,
      matchedMinedPatterns
    };
  }

  /**
   * Collects final interview outcome to run deep calibrations
   */
  static finalizeSessionLearning(
    userId: string,
    industry: string,
    starHistory: number[],
    confidenceHistory: number[],
    feedbackRating: number,
    feedbackTags: string[]
  ): void {
    // Calibrate difficulty reports asynchronously
    DifficultyCalibration.evaluateDifficultyNeeds(industry, starHistory, confidenceHistory);

    // Log feedback
    FeedbackLearningEngine.submitFeedback({
      sessionId: `sess_fin_${Date.now()}`,
      ratingScore: feedbackRating,
      tags: feedbackTags
    });

    // Update coaching effectiveness values based on final improvements
    if (starHistory.length > 1) {
      const delta = starHistory[starHistory.length - 1] - starHistory[0];
      CoachingKnowledgeBase.recordCoachingEffectiveness('coach-star-ex', delta);
    }
  }

  /**
   * Schedule nightly distillation job to analyze learnings across sessions
   */
  static triggerNightlyLearningJob(): DistillationReport {
    const report = KnowledgeDistillationEngine.runNightlyDistillation();
    LearningAnalyticsManager.logKnowledgeFactLearned();
    return report;
  }

  /**
   * GDPR-compliant helper to purge all history for user
   */
  static purgeUserData(userId: string): void {
    PrivacyManager.clearLocalHistory(userId);
  }

  /**
   * Safe access proxies to maintain strict boundary constraints.
   * Direct database modifications from other parts of code are forbidden.
   */
  static getReadinessPrediction(userId: string, role: string): ReadinessPrediction {
    const memory = PersonalMemoryManager.loadMemory(userId);
    return PredictionEngine.estimateReadiness(
      userId,
      memory.starPerformanceScores,
      memory.confidenceEvolution,
      memory.weaknesses
    );
  }

  static getImprovementVector(userId: string): ImprovementVector {
    const memory = PersonalMemoryManager.loadMemory(userId);
    return ImprovementEngine.analyzeImprovement(userId, memory.starPerformanceScores);
  }

  static getBenchmarkComparison(
    userId: string,
    role: string
  ): {
    confidenceDelta: number;
    starDelta: number;
    wpmDelta: number;
    benchmarkRef: AnonymousRoleBenchmark;
  } {
    const memory = PersonalMemoryManager.loadMemory(userId);
    const avgConfidence = memory.confidenceEvolution.reduce((a, b) => a + b, 0) / (memory.confidenceEvolution.length || 1);
    const avgStar = memory.starPerformanceScores.reduce((a, b) => a + b, 0) / (memory.starPerformanceScores.length || 1);
    const avgWpm = memory.speechSpeedTrend.reduce((a, b) => a + b, 0) / (memory.speechSpeedTrend.length || 1);

    return BenchmarkEngine.compareToBenchmark(role, Math.round(avgConfidence), Math.round(avgStar), Math.round(avgWpm));
  }

  static getCompanyProfile(companyName: string): RecruiterCompanyProfile {
    return RecruiterKnowledgeBase.getProfile(companyName);
  }

  static matchFollowUpQuestion(candidateResponse: string): FollowUpTemplate | null {
    return FollowUpLibrary.matchFollowUp(candidateResponse);
  }

  static getActiveInterviewerPrompt(language: string = 'English'): string {
    return PromptOptimizer.getActivePrompt(language);
  }

  static getAnalyticsDashboard(): LearningAnalyticsSnapshot {
    return LearningAnalyticsManager.getAnalyticsSnapshot();
  }
}
