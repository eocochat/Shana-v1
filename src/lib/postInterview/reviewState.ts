import { SessionHistoryItem, QuestionFeedbackItem } from '../../types';

export interface CompetencyBehindTheDecision {
  id: string;
  name: string;
  score: number;
  evidenceCollected: string[];
  evidenceMissing: string[];
  whyThisScore: string;
  calculationMethod: string;
  oneActionToIncrease: string;
}

export interface ReplayQuestionTimeline {
  questionIndex: number;
  phaseLabel: string;
  questionText: string;
  candidateAnswer: string;
  recruiterThoughts: string;
  competenciesEvaluated: string[];
  whyFollowUpAsked: string;
  strengthsIdentified: string[];
  weaknessesIdentified: string[];
  confidenceEvolution: number; // e.g. 75 to 88
  recommendedImprovedAnswer: string;
}

export interface ImprovedAnswerState {
  questionIndex: number;
  originalAnswer: string;
  weaknesses: string[];
  rewrittenAnswer: string;
  whyRewriteStronger: string;
  attempts: string[];
}

export interface PracticeSession {
  id: string;
  title: string;
  description: string;
  category: 'Leadership' | 'Technical' | 'Behavioral' | 'Conflict' | 'Communication' | 'Salary';
  estimatedDurationMins: number;
  questions: string[];
}

export interface ProgressComparison {
  metricName: string;
  changePercent: number; // e.g. 12 for +12%
  celebrationText: string;
}

export interface JourneyStage {
  id: string;
  title: string;
  status: 'completed' | 'current' | 'locked';
  description: string;
  milestoneBonus: string;
}

export interface ExperienceRating {
  rating: number; // 1-5
  mostHelpfulCategory: string; // e.g. 'Recruiter Replay'
  feedbackText?: string;
  timestamp: string;
}

export interface ReferralState {
  invitesSent: number;
  conversionsCount: number;
  rewardsUnlocked: string[];
  referralCode: string;
}

export interface PostInterviewChatSession {
  messages: {
    sender: 'user' | 'shana';
    text: string;
    timestamp: string;
  }[];
}

export interface PostInterviewState {
  sessionId: string;
  currentStep: 'loading' | 'overview' | 'decision' | 'replay' | 'improve' | 'practice' | 'journey' | 'chat';
  selectedCompetencyId: string | null;
  selectedReplayIndex: number;
  ratings: ExperienceRating | null;
  referrals: ReferralState;
  practiceSessionsStarted: string[];
  chat: PostInterviewChatSession;
  analyticsLogged: boolean;
}

// Default states and initializers
export function createDefaultPostInterviewState(sessionId: string): PostInterviewState {
  return {
    sessionId,
    currentStep: 'overview',
    selectedCompetencyId: 'leadership',
    selectedReplayIndex: 0,
    ratings: null,
    referrals: {
      invitesSent: 0,
      conversionsCount: 0,
      rewardsUnlocked: [],
      referralCode: `SHANA-REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    },
    practiceSessionsStarted: [],
    chat: {
      messages: [
        {
          sender: 'shana',
          text: "I am ready to unpack your interview results with you. Ask me anything—such as 'Why did I lose points?', 'How would Google evaluate this?', or 'Show me a stronger answer'. Where should we start?",
          timestamp: new Date().toISOString()
        }
      ]
    },
    analyticsLogged: false
  };
}
