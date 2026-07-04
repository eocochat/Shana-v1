export interface EvidenceItem {
  id: string;
  competencyId: string;
  evidence: string;
  confidence: number; // 0 - 100
  supportingQuote: string;
  questionSource: string;
  timestamp: string;
  evidenceStrength: 'Strong' | 'Medium' | 'Weak';
}

export interface CompetencyState {
  id: string;
  name: string;
  coverage: number; // 0 - 100
  confidence: number; // 0 - 100
  evidenceCount: number;
}

export interface ContradictionItem {
  id: string;
  competencyId: string;
  earlierStatement: string;
  laterStatement: string;
  resolved: boolean;
  resolutionText?: string;
  timestamp: string;
  gravity: 'High' | 'Medium' | 'Low';
}

export type InterviewStage = 
  | 'Introduction'
  | 'Experience Validation'
  | 'Competency Discovery'
  | 'Leadership Assessment'
  | 'Problem Solving'
  | 'Behavioral Assessment'
  | 'Decision Making'
  | 'Motivation'
  | 'Candidate Questions'
  | 'Closing';

export interface InterviewStrategyState {
  currentStage: InterviewStage;
  completedStages: InterviewStage[];
  skippedStages: InterviewStage[];
  stageProgress: Record<InterviewStage, number>; // 0 - 100
}

export interface RecruiterMemoryState {
  strongExamples: string[];
  weakExamples: string[];
  repeatedBehaviors: string[];
  communicationStyle: string;
  leadershipHistory: string[];
  candidateEvolution: string;
}

export interface RecruiterScorecardItem {
  competencyId: string;
  name: string;
  coverage: number;
  evidenceCount: number;
  confidence: number;
  decisionStatus: 'Unverified' | 'Developing' | 'Verified' | 'Exceeds';
  priority: 'High' | 'Medium' | 'Low';
  explanation: string;
}

export type HiringRecommendation =
  | 'Strong Hire'
  | 'Hire'
  | 'Leaning Hire'
  | 'Neutral'
  | 'Leaning No Hire'
  | 'No Hire'
  | 'Strong No Hire';

export interface HiringDecisionState {
  recommendation: HiringRecommendation;
  reasoning: string;
  evidenceSummary: string[];
  confidence: number; // 0 - 100
  missingInformation: string[];
  suggestedNextStage: string;
}

export interface RecruiterConfidenceState {
  transcriptQuality: number; // 0 - 100
  competencyCoverage: number; // 0 - 100
  evidenceStrength: number; // 0 - 100
  contradictionsPenalty: number; // 0 - 100
  interviewCompletion: number; // 0 - 100
  overallConfidence: number; // 0 - 100
}

export interface RecruiterState {
  sessionId: string;
  competencies: Record<string, CompetencyState>;
  evidence: EvidenceItem[];
  contradictions: ContradictionItem[];
  strategy: InterviewStrategyState;
  memory: RecruiterMemoryState;
  scorecard: Record<string, RecruiterScorecardItem>;
  confidence: RecruiterConfidenceState;
  decision: HiringDecisionState;
  reasoningLog: string[];
  currentObjectives: string[];
}

export function createDefaultRecruiterState(sessionId: string): RecruiterState {
  const competencyIds = [
    'communication',
    'leadership',
    'ownership',
    'technical_skills',
    'problem_solving',
    'conflict_resolution',
    'adaptability',
    'teamwork',
    'customer_focus',
    'learning_ability',
    'decision_making'
  ];

  const competencies: Record<string, CompetencyState> = {};
  const scorecard: Record<string, RecruiterScorecardItem> = {};

  competencyIds.forEach(id => {
    const readableName = id
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    competencies[id] = {
      id,
      name: readableName,
      coverage: 0,
      confidence: 0,
      evidenceCount: 0
    };

    scorecard[id] = {
      competencyId: id,
      name: readableName,
      coverage: 0,
      evidenceCount: 0,
      confidence: 0,
      decisionStatus: 'Unverified',
      priority: id === 'communication' || id === 'problem_solving' || id === 'technical_skills' ? 'High' : 'Medium',
      explanation: 'No evidence collected yet.'
    };
  });

  return {
    sessionId,
    competencies,
    evidence: [],
    contradictions: [],
    strategy: {
      currentStage: 'Introduction',
      completedStages: [],
      skippedStages: [],
      stageProgress: {
        'Introduction': 0,
        'Experience Validation': 0,
        'Competency Discovery': 0,
        'Leadership Assessment': 0,
        'Problem Solving': 0,
        'Behavioral Assessment': 0,
        'Decision Making': 0,
        'Motivation': 0,
        'Candidate Questions': 0,
        'Closing': 0
      }
    },
    memory: {
      strongExamples: [],
      weakExamples: [],
      repeatedBehaviors: [],
      communicationStyle: 'Evaluating...',
      leadershipHistory: [],
      candidateEvolution: 'Evaluating baseline...'
    },
    scorecard,
    confidence: {
      transcriptQuality: 100,
      competencyCoverage: 0,
      evidenceStrength: 0,
      contradictionsPenalty: 0,
      interviewCompletion: 0,
      overallConfidence: 50
    },
    decision: {
      recommendation: 'Neutral',
      reasoning: 'Evaluation in progress.',
      evidenceSummary: [],
      confidence: 0,
      missingInformation: ['Requires initial competency screening across key parameters.'],
      suggestedNextStage: 'Experience Validation'
    },
    reasoningLog: ['Initialized Recruiter Intelligence Engine.'],
    currentObjectives: ['Validate candidate core background', 'Measure initial voice confidence and poise']
  };
}
