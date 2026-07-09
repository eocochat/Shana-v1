import { CandidateState } from './candidateState';
import { CandidateProfileService } from './candidateProfile';
import { DigitalTwinEngine } from './digitalTwin';
import { CommunicationEngine } from './communicationEngine';
import { ConfidenceEngine } from './confidenceEngine';
import { StressEngine } from './stressEngine';
import { LearningEngine } from './learningEngine';
import { BehavioralProfileEngine } from './behavioralProfile';
import { PersonalityProfileEngine } from './personalityProfile';
import { SkillEvolutionEngine } from './skillEvolution';
import { ReadinessEngine } from './readinessEngine';
import { CoachingStrategyEngine } from './coachingStrategy';
import { ImprovementPlannerEngine } from './improvementPlanner';
import { CandidateMemoryEngine } from './candidateMemory';
import { MotivationEngine } from './motivationEngine';
import { MilestoneEngine } from './milestoneEngine';
import { RecommendationEngine } from './recommendationEngine';

export class CandidateBrain {
  /**
   * Processes a candidate response inside an interview session and updates their long-term learner profile.
   */
  public static processInterviewAnswer(
    userId: string,
    questionText: string,
    answerText: string,
    isTechnical: boolean,
    isUnderPressure: boolean,
    stepIndex: number
  ): void {
    if (!userId || !answerText || answerText.trim().length < 5) return;

    // Retrieve active state
    const state = CandidateProfileService.getCandidateState(userId);

    // 1. Core analytics
    CommunicationEngine.analyzeResponse(state, answerText);
    ConfidenceEngine.evaluateResponseConfidence(state, answerText, isTechnical, isUnderPressure);
    StressEngine.evaluateStressImpact(state, answerText);
    BehavioralProfileEngine.updateBehavioralTraits(state, answerText);
    PersonalityProfileEngine.inferPersonalityTraits(state, answerText);

    // Map answer text features to digital twin updates
    const scoreVal = state.communication.answerClarity;
    const flowVal = state.communication.conversationFlow;

    // Update Digital Twin Competencies
    if (isTechnical) {
      DigitalTwinEngine.updateCompetency(state, 'technical_skills', scoreVal + 10, 85);
      DigitalTwinEngine.updateCompetency(state, 'problem_solving', flowVal + 5, 80);
    } else {
      DigitalTwinEngine.updateCompetency(state, 'communication', scoreVal, 90);
      DigitalTwinEngine.updateCompetency(state, 'teamwork', flowVal, 75);
    }

    if (answerText.toLowerCase().includes('lead') || answerText.toLowerCase().includes('manage')) {
      DigitalTwinEngine.updateCompetency(state, 'leadership', scoreVal + 8, 80);
    }
    if (answerText.toLowerCase().includes('responsible') || answerText.toLowerCase().includes('own')) {
      DigitalTwinEngine.updateCompetency(state, 'ownership', scoreVal + 12, 85);
    }

    // 2. Learning state
    LearningEngine.assessLearningStyle(state);

    // 3. Skill evolution timelines
    SkillEvolutionEngine.recordSessionSkillScores(state, stepIndex);

    // 4. Readiness Engine recalculation
    ReadinessEngine.recalculateReadiness(state);

    // 5. Coaching schedules
    CoachingStrategyEngine.adaptCoachingStrategy(state);

    // 6. Objectives and Improvement Planners
    ImprovementPlannerEngine.updateImprovementPlan(state);

    // 7. Track Memory and achievements
    const inferredStrengths = [];
    const inferredWeaknesses = [];

    if (state.communication.fillerWordFrequency > 3) inferredWeaknesses.push('High filler word frequency');
    else inferredStrengths.push('Clean verbal concision');

    if (state.communication.answerClarity > 75) inferredStrengths.push('Excellent answers structure');

    CandidateMemoryEngine.commitToMemory(state, inferredStrengths, inferredWeaknesses);

    // 8. Motivation, milestone and recommendation adjustments
    MotivationEngine.recordDailyPractice(state);
    MilestoneEngine.evaluateMilestones(state);
    RecommendationEngine.updateRecommendations(state);

    // 9. Persist back
    CandidateProfileService.saveCandidateState(userId, state);
  }

  /**
   * Finalizes the interview session and seals the learning iteration.
   */
  public static async finalizeSession(userId: string, overallScore: number): Promise<void> {
    const state = CandidateProfileService.getCandidateState(userId);

    // Boost overall competencies slightly if the candidate score is high
    Object.keys(state.digitalTwin).forEach(id => {
      const current = state.digitalTwin[id].score;
      const boost = Math.round((overallScore - current) * 0.15);
      if (boost > 0) {
        DigitalTwinEngine.updateCompetency(state, id, current + boost, 90);
      }
    });

    // Run evaluations
    ReadinessEngine.recalculateReadiness(state);
    CoachingStrategyEngine.adaptCoachingStrategy(state);
    ImprovementPlannerEngine.updateImprovementPlan(state);
    MilestoneEngine.evaluateMilestones(state);
    RecommendationEngine.updateRecommendations(state);

    // Save baseline state
    CandidateProfileService.saveCandidateState(userId, state);

    try {
      // Fetch user performance data dynamically from Firestore to update coaching with evidence-based insights
      await CoachingStrategyEngine.updateCoachingWithFirestoreData(userId, state);
      CandidateProfileService.saveCandidateState(userId, state);
    } catch (err) {
      console.warn('[SHANA CandidateBrain] Async Firestore coaching finalization bypassed:', err);
    }
  }
}
