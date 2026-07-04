export interface ContextMemoryState {
  experiences: string[];
  companiesMentioned: string[];
  projects: string[];
  skills: string[];
  leadershipExamples: string[];
  mistakes: string[];
  strengths: string[];
  weaknesses: string[];
  previousPromises: string[];
  topicsAlreadyDiscussed: string[];
}

export type PressureLevel = 'Supportive' | 'Neutral' | 'Professional' | 'Demanding' | 'Stress';

export interface RecruiterPersonality {
  id: string;
  nameEN: string;
  nameFR: string;
  tone: string;
  speechSpeed: 'slow' | 'normal' | 'rapid';
  followUpFrequency: 'high' | 'moderate' | 'low';
  interruptionBehavior: 'frequent' | 'polite' | 'rare' | 'none';
  empathy: 'high' | 'professional' | 'low';
  vocabularyStyle: string;
  responseLength: 'concise' | 'balanced' | 'elaborate' | 'sharp';
  bodyLanguagePrompt: string;
}

export interface RecruiterNote {
  category: 'strength' | 'weakness' | 'neutral' | 'observation';
  textEN: string;
  textFR: string;
  timestamp: string;
}

export interface CoachingData {
  speechSpeedWordsPerMinute: number[];
  interruptionsTriggeredCount: number;
  hesitationsDetectedCount: number;
  fillerWordsUsedCount: { [key: string]: number };
  confidenceTrend: number[]; // scale of 0-100 over turns
  starCompletenessTrend: number[]; // scale of 0-100 over turns
}

export interface ConversationAnalyticsState {
  averageResponseDurationSeconds: number;
  followUpCount: number;
  interruptionCount: number;
  pressureEvolution: PressureLevel[];
  candidateSpeakingRatio: number; // e.g., 0.65
  aiSpeakingRatio: number; // e.g., 0.35
  engagementScore: number; // 0-100
  totalCandidateWords: number;
  totalAIWords: number;
  totalTurns: number;
}

export interface EmotionState {
  confidence: number; // 0-100
  stress: number; // 0-100
  hesitation: number; // 0-100
  enthusiasm: number; // 0-100
  certainty: number; // 0-100
  frustration: number; // 0-100
  engagement: number; // 0-100
}

export interface SelfReflectionState {
  lastEvaluation?: string;
  repetitivenessWarning?: boolean;
  ignoredKeyPointsCount?: number;
  temperatureAdjustment?: 'warm_up' | 'cool_down' | 'maintain';
}

export interface RecruiterBrainTurn {
  learnedSummary: string;
  credibilityScore: number; // 0-100
  competencyVerified: string;
  competencyMissing: string;
  stance: 'challenge' | 'support' | 'move_on';
  evidenceSufficient: boolean;
}

export interface DigitalTwinState {
  communication: number; // 0-100
  leadership: number;
  confidence: number;
  decisionMaking: number;
  star: number;
  technical: number;
  stressResistance: number;
  storytelling: number;
}

export interface EvidenceRecord {
  competency: string;
  description: string;
  confidence: number; // 0.0 to 1.0
}

export interface CompetencyStatus {
  competency: string;
  evidenceCount: number;
  isSufficient: boolean;
}

export interface RecruiterDecision {
  wouldHire: 'Yes' | 'Probably Yes' | 'No' | 'Probably No';
  confidence: number; // 0-100
  reasons: string[];
  weaknesses: string[];
  recommendation: string;
}

export interface GenomeSegment {
  turn: number;
  question: string;
  competency: string;
  evidence: string[];
  confidence: number;
  behavior: string;
  outcome: string;
}

export interface ConversationState {
  sessionId: string;
  isInitialized: boolean;
  currentTurn: number;
  contextMemory: ContextMemoryState;
  pressureLevel: PressureLevel;
  personality: RecruiterPersonality;
  recruiterNotes: RecruiterNote[];
  coachingData: CoachingData;
  analytics: ConversationAnalyticsState;
  emotionState: EmotionState;
  isCandidateSpeaking: boolean;
  isThinking: boolean;
  lastAnswerTimestamp?: number;
  selfReflection?: SelfReflectionState;
  recruiterBrainTurns?: RecruiterBrainTurn[];
  digitalTwin?: DigitalTwinState;
  evidenceRecords?: EvidenceRecord[];
  competenciesStatus?: CompetencyStatus[];
  recruiterDecision?: RecruiterDecision;
  interviewGenome?: GenomeSegment[];
}
