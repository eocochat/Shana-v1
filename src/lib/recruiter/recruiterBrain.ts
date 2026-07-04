import { 
  RecruiterState, 
  createDefaultRecruiterState, 
  CompetencyState 
} from './recruiterState';
import { RecruiterMemoryEngine } from './recruiterMemory';
import { CompetencyCoverageEngine } from './competencyCoverage';
import { EvidenceEngine } from './evidenceEngine';
import { ContradictionEngine } from './contradictionEngine';
import { ObjectivePlanner } from './objectivePlanner';
import { InterviewStrategyEngine } from './interviewStrategy';
import { RecruiterReasoningEngine } from './recruiterReasoning';
import { ConfidenceEngine } from './confidenceEngine';
import { HiringDecisionEngine } from './hiringDecision';
import { RecommendationEngine } from './recommendationEngine';
import { RecruiterAnalyticsService } from './recruiterAnalytics';

export class RecruiterBrain {
  private static STORAGE_PREFIX = 'shana_recruiter_state_';

  /**
   * Loads or initializes the RecruiterState for the given session.
   */
  public static getOrInitState(sessionId: string): RecruiterState {
    try {
      const data = localStorage.getItem(`${this.STORAGE_PREFIX}${sessionId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load recruiter state:', e);
    }

    const state = createDefaultRecruiterState(sessionId);
    this.saveState(state);
    return state;
  }

  /**
   * Saves the state to localStorage.
   */
  public static saveState(state: RecruiterState): void {
    try {
      localStorage.setItem(`${this.STORAGE_PREFIX}${state.sessionId}`, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save recruiter state:', e);
    }
  }

  /**
   * Master processing cycle executed after every candidate answer.
   */
  public static processCandidateResponse(
    sessionId: string,
    question: string,
    answer: string,
    candidateHistoryCount: number
  ): RecruiterState {
    const state = this.getOrInitState(sessionId);
    const lowercaseAnswer = answer.toLowerCase();

    // 1. Measure Transcript Quality
    ConfidenceEngine.assessTranscriptQuality(state, answer);

    // 2. Extract Memory Behaviors
    this.extractMemoryBits(state, answer);

    // 3. Cognitive analysis: "What did I just learn? Which competency did I verify?"
    const mappedCompId = this.detectCompetency(lowercaseAnswer);
    
    if (mappedCompId) {
      const comp = state.competencies[mappedCompId];
      if (comp) {
        // Extract a key supporting phrase
        const sentences = answer.split(/[.!?]+/);
        const supportingSentence = sentences.find(s => 
          s.toLowerCase().includes('lead') || 
          s.toLowerCase().includes('manage') ||
          s.toLowerCase().includes('solv') ||
          s.toLowerCase().includes('creat') ||
          s.toLowerCase().includes('respons') ||
          s.toLowerCase().includes('team') ||
          s.toLowerCase().includes('custom') ||
          s.length > 20
        ) || sentences[0] || answer;

        const strength = answer.length > 120 ? 'Strong' : answer.length > 50 ? 'Medium' : 'Weak';
        const confidenceScore = strength === 'Strong' ? 92 : strength === 'Medium' ? 75 : 50;

        EvidenceEngine.addEvidence(
          state,
          mappedCompId,
          `Candidate explained their experience regarding ${comp.name}.`,
          supportingSentence.trim(),
          question,
          confidenceScore,
          strength
        );

        // Add to memory
        if (strength === 'Strong') {
          RecruiterMemoryEngine.addStrongExample(state, supportingSentence.trim());
        } else {
          RecruiterMemoryEngine.addWeakExample(state, supportingSentence.trim());
        }
      }
    }

    // 4. Inconsistency and Contradiction Scanning
    this.scanForContradictions(state, lowercaseAnswer);

    // 5. Evaluate Interview Strategy Progression
    InterviewStrategyEngine.evaluateStrategy(state, candidateHistoryCount);

    // 6. Update Core Recruitment Objectives
    ObjectivePlanner.updateObjectives(state);

    // 7. Dynamic Evaluation Confidence Recalculation
    ConfidenceEngine.recalculateConfidence(state);

    // 8. Generate explainable AI recruitment recommendation
    HiringDecisionEngine.generateDecision(state);

    // 9. Save state & dispatch asynchronous anonymous tracking
    this.saveState(state);
    
    // Asynchronous simulation via immediate execution
    setTimeout(() => {
      RecruiterAnalyticsService.trackSession(state);
    }, 10);

    return state;
  }

  /**
   * Cognitive heuristic mapping keyword combinations to exact competencies.
   */
  private static detectCompetency(answer: string): string | null {
    if (answer.includes('lead') || answer.includes('managed') || answer.includes('guided') || answer.includes('directed') || answer.includes('mentor')) {
      return 'leadership';
    }
    if (answer.includes('ownership') || answer.includes('responsible') || answer.includes('deadline') || answer.includes('delivered') || answer.includes('accountable')) {
      return 'ownership';
    }
    if (answer.includes('code') || answer.includes('system') || answer.includes('architecture') || answer.includes('technical') || answer.includes('database') || answer.includes('api')) {
      return 'technical_skills';
    }
    if (answer.includes('solve') || answer.includes('debugged') || answer.includes('fixed') || answer.includes('analyze') || answer.includes('root cause') || answer.includes('figured')) {
      return 'problem_solving';
    }
    if (answer.includes('conflict') || answer.includes('disagree') || answer.includes('argument') || answer.includes('misunderstanding') || answer.includes('persuaded')) {
      return 'conflict_resolution';
    }
    if (answer.includes('adapt') || answer.includes('pivot') || answer.includes('change') || answer.includes('flexible') || answer.includes('dynamic')) {
      return 'adaptability';
    }
    if (answer.includes('team') || answer.includes('collaborat') || answer.includes('jointly') || answer.includes('together') || answer.includes('peer')) {
      return 'teamwork';
    }
    if (answer.includes('customer') || answer.includes('client') || answer.includes('user') || answer.includes('feedback') || answer.includes('consumer')) {
      return 'customer_focus';
    }
    if (answer.includes('learn') || answer.includes('study') || answer.includes('upskill') || answer.includes('curious') || answer.includes('course')) {
      return 'learning_ability';
    }
    if (answer.includes('decide') || answer.includes('chose') || answer.includes('decision') || answer.includes('selection') || answer.includes('judgment')) {
      return 'decision_making';
    }
    if (answer.includes('communicat') || answer.includes('speak') || answer.includes('present') || answer.includes('report') || answer.includes('write')) {
      return 'communication';
    }

    return null;
  }

  /**
   * Scans for inconsistencies based on specific contradicting statement patterns.
   */
  private static scanForContradictions(state: RecruiterState, answer: string): void {
    // If we have an existing resolved contradiction loop, try to check if the candidate has now resolved it
    const activeContradiction = state.contradictions.find(c => !c.resolved);
    if (activeContradiction) {
      if (answer.includes('clarify') || answer.includes('mean') || answer.includes('indeed') || answer.includes('reason') || answer.length > 60) {
        ContradictionEngine.resolveContradiction(state, activeContradiction.id, answer);
        return;
      }
    }

    // Heuristics for new contradiction detection
    const hasSoloSentiment = answer.includes('prefer working alone') || answer.includes('always work solo') || answer.includes('dislike teamwork') || answer.includes('by myself');
    const hasTeamSentiment = answer.includes('love teamwork') || answer.includes('enjoy collaboration') || answer.includes('prefer team environments');

    if (hasSoloSentiment) {
      // Look back through memory/evidence to see if teamwork was previously highly rated
      const previousTeamworkEvidence = state.evidence.some(ev => ev.competencyId === 'teamwork');
      if (previousTeamworkEvidence) {
        ContradictionEngine.detectAndRegisterContradiction(
          state,
          'teamwork',
          'Supported team environment and collaboration dynamics earlier',
          'Noted standard preference to work completely alone or avoiding team interfaces',
          'Medium'
        );
      }
    }

    if (hasTeamSentiment) {
      const previousSoloEvidence = state.evidence.some(ev => ev.evidence.toLowerCase().includes('alone') || ev.evidence.toLowerCase().includes('solo'));
      if (previousSoloEvidence) {
        ContradictionEngine.detectAndRegisterContradiction(
          state,
          'teamwork',
          'Indicated strong focus on working alone/isolated systems',
          'Claimed to highly prize collaborative team environments',
          'Low'
        );
      }
    }
  }

  /**
   * Extracts minor behaviors and communication attributes to update memory.
   */
  private static extractMemoryBits(state: RecruiterState, answer: string): void {
    if (answer.includes('metrics') || answer.includes('percent') || answer.includes('%') || /\d+/.test(answer)) {
      RecruiterMemoryEngine.updateBehavior(state, 'Metric-oriented candidate');
    }
    if (answer.trim().split(/\s+/).length > 80) {
      RecruiterMemoryEngine.updateBehavior(state, 'Very articulate / verbose style');
      RecruiterMemoryEngine.updateCommunicationStyle(state, 'Highly verbal, detailed structured delivery');
    } else {
      RecruiterMemoryEngine.updateCommunicationStyle(state, 'Direct, compact phrasing style');
    }

    RecruiterMemoryEngine.updateCandidateEvolution(state, `Candidate transitioned through ${state.strategy.currentStage}`);
  }
}
