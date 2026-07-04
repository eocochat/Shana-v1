import { PostInterviewState, createDefaultPostInterviewState } from './reviewState';
import { SessionHistoryItem } from '../../types';
import { replayEngine } from './replayEngine';
import { explanationEngine } from './explanationEngine';
import { improvementEngine } from './improvementEngine';
import { practiceEngine } from './practiceEngine';
import { progressEngine } from './progressEngine';
import { feedbackEngine } from './feedbackEngine';
import { referralEngine } from './referralEngine';
import { celebrationEngine } from './celebrationEngine';
import { recommendationEngine } from './recommendationEngine';
import { analyticsEngine } from './analyticsEngine';

class ReviewDirector {
  private activeState: Record<string, PostInterviewState> = {};

  public initialize(sessionId: string): PostInterviewState {
    const cached = localStorage.getItem(`shana_post_interview_${sessionId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        this.activeState[sessionId] = parsed;
        return parsed;
      } catch (e) {
        console.warn("Failed parsing cached post interview state, resetting.", e);
      }
    }

    const newState = createDefaultPostInterviewState(sessionId);
    this.saveState(sessionId, newState);
    return newState;
  }

  public getState(sessionId: string): PostInterviewState {
    return this.activeState[sessionId] || this.initialize(sessionId);
  }

  public updateState(sessionId: string, updater: (state: PostInterviewState) => void): PostInterviewState {
    const currentState = this.getState(sessionId);
    updater(currentState);
    this.saveState(sessionId, currentState);
    return currentState;
  }

  private saveState(sessionId: string, state: PostInterviewState) {
    this.activeState[sessionId] = state;
    localStorage.setItem(`shana_post_interview_${sessionId}`, JSON.stringify(state));
  }

  // Delegate calls to specific Engines for clean architecture
  public getReplayTimeline(session: SessionHistoryItem, isFR: boolean) {
    return replayEngine.generateTimeline(session, isFR);
  }

  public getBehindTheDecision(session: SessionHistoryItem, isFR: boolean) {
    return explanationEngine.getCompetencyBreakdown(session, isFR);
  }

  public getAnswerImprovement(session: SessionHistoryItem, questionIndex: number, isFR: boolean) {
    return improvementEngine.getImprovement(session, questionIndex, isFR);
  }

  public getPracticeSessions(session: SessionHistoryItem, isFR: boolean) {
    return practiceEngine.getPracticeSessions(session, isFR);
  }

  public getProgressComparison(session: SessionHistoryItem, history: SessionHistoryItem[], isFR: boolean) {
    return progressEngine.calculateProgress(session, history, isFR);
  }

  public getJourneyProgress(session: SessionHistoryItem, history: SessionHistoryItem[], isFR: boolean) {
    return progressEngine.getJourneyStages(session, history, isFR);
  }

  public getCelebrationMilestones(session: SessionHistoryItem, history: SessionHistoryItem[], isFR: boolean) {
    return celebrationEngine.checkMilestones(session, history, isFR);
  }

  public getNextActionRecommendations(session: SessionHistoryItem, isFR: boolean) {
    return recommendationEngine.getRecommendations(session, isFR);
  }

  public trackEngagementMetric(sessionId: string, action: string, metadata: any) {
    analyticsEngine.track(sessionId, action, metadata);
  }
}

export const reviewDirector = new ReviewDirector();
export { replayEngine, explanationEngine, improvementEngine, practiceEngine, progressEngine, feedbackEngine, referralEngine, celebrationEngine, recommendationEngine, analyticsEngine };
