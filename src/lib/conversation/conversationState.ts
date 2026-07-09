import { PsychologyAssessment, BehavioralSignals, AuthenticitySignals, RecruiterStrategyReasoning, PsychologicalInsight } from './interviewPsychologyEngine';

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
  
  // Recruiter DNA Extensions (HIU Phase 3)
  communicationStyle?: string;
  energyLevel?: 'low' | 'moderate' | 'high' | 'intense';
  patience?: 'low' | 'moderate' | 'high';
  professionalism?: 'casual' | 'balanced' | 'formal' | 'impeccable';
  assertiveness?: 'low' | 'moderate' | 'high' | 'extreme';
  curiosity?: 'low' | 'moderate' | 'high' | 'insatiable';
  listeningStyle?: string;
  challengeLevel?: 'low' | 'moderate' | 'high' | 'extreme';
  humorLevel?: 'none' | 'subtle' | 'playful';
  interruptFrequency?: 'none' | 'rare' | 'moderate' | 'frequent';
  decisionStyle?: string;
  conversationRhythm?: string;
  questionDepth?: 'surface' | 'moderate' | 'deep' | 'exhaustive';
  reactionStyle?: string;
  voiceCadence?: string;
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
  conversationalInsights?: string[];
  listeningInsights?: string[];
  thinkingPausesCount?: number;
  reflectionPausesCount?: number;
  empathyInsights?: string[];
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
  
  // Human Listening Analytics Extensions (HIU Phase 5)
  averageResponseLatency?: number;
  naturalSilenceRatio?: number;
  recoverySpeedScore?: number;
  interruptionNecessityScore?: number;
  listeningQualityScore?: number;
  conversationPatienceScore?: number;
  candidateReflectionQuality?: number;
  turnTakingAccuracy?: number;
  thinkingPausesCount?: number;
  reflectionPausesCount?: number;

  // Recruiter Empathy Analytics Extensions (HIU Phase 6)
  averageEmpathyScore?: number;
  supportInterventionsCount?: number;
  pressureAdaptationsCount?: number;
  confidenceRecoveryRate?: number;
  candidateEngagementScore?: number;
  encouragementFrequency?: number;
  empathyConsistency?: number;
  recruiterAdaptationQuality?: number;
  interviewComfortTrend?: number[];
}

export interface EmotionState {
  confidence: number; // 0-100
  stress: number; // 0-100
  hesitation: number; // 0-100
  enthusiasm: number; // 0-100
  certainty: number; // 0-100
  frustration: number; // 0-100
  engagement: number; // 0-100
  composure?: number; // 0-100
  cognitiveLoad?: number; // 0-100
  defensiveness?: number; // 0-100
  imposterIndex?: number; // 0-100
  flowStateRating?: number; // 0-100
  primaryVibe?: string; // e.g. "flow", "cognitive_overload", "defensive", "imposter", "neutral"
  
  // Real-Time Emotional State Model extensions (HIU Phase 10)
  mentalFatigue?: number; // 0-100
  comfortLevel?: number; // 0-100
  motivationLevel?: number; // 0-100
  recoveryAbility?: number; // 0-100
  emotionalStability?: number; // 0-100
  previousPrimaryVibe?: string; // for emotional transition tracking
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

  // Recruiter Brain V2 continuous metrics
  confidenceEvolution?: number; // 0-100
  credibility?: number; // 0-100
  specificity?: number; // 0-100
  ownership?: number; // 0-100
  leadership?: number; // 0-100
  businessImpact?: number; // 0-100
  starCompleteness?: number; // 0-100
  riskLevel?: number; // 0-100
  authenticity?: number; // 0-100

  // Recruiter Brain V2 internal thoughts (confidential during interview, visible in final report)
  thoughtWhatDidILearn?: string;
  thoughtWhatIsMissing?: string;
  thoughtDoIBelieveThis?: string;
  thoughtWhatToAskNext?: string;
  thoughtWhatCompetencyValidating?: string;
  thoughtHiringConfidence?: string;
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
  
  // Human Listening State tracking properties (HIU Phase 5)
  listeningState?: string;
  silenceType?: string;
  flowPrediction?: {
    probabilityContinuation: number;
    probabilityCompletion: number;
    probabilityClarification: number;
    probabilityAddExample: number;
  };
  avatarListeningEvent?: string;
  listeningObservations?: string[];

  // Recruiter Empathy State tracking properties (HIU Phase 6)
  empathyObservations?: string[];
  empathyMetrics?: {
    comfortScore: number;       // scale of 0-100
    workloadScore: number;      // scale of 0-100
    motivationScore: number;    // scale of 0-100
    recoveryRate: number;       // scale of 0-100
    engagementScore: number;    // scale of 0-100
    supportInterventions: number;
    encouragementCount: number;
  };

  // Interview Psychology State Tracking (HIU Phase 8)
  psychologyAssessment?: PsychologyAssessment;
  behavioralSignals?: BehavioralSignals;
  authenticitySignals?: AuthenticitySignals;
  recruiterStrategyReasoning?: RecruiterStrategyReasoning;
  psychologicalInsightsHistory?: PsychologicalInsight[];
}
