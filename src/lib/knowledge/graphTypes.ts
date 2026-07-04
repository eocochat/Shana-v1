export type GraphNodeType =
  | 'competency'
  | 'role'
  | 'industry'
  | 'company'
  | 'question'
  | 'evidence'
  | 'recruiter_decision'
  | 'candidate_progress'
  | 'learning_outcome'
  | 'coaching_strategy'
  | 'recommendation';

export type GraphEdgeType =
  | 'related_to'        // e.g. Leadership -> Communication
  | 'requires'          // e.g. Backend Engineer -> Problem Solving
  | 'belongs_to'        // e.g. Stripe -> Technology (Company -> Industry)
  | 'assesses'          // e.g. Question -> Competency
  | 'evidences'         // e.g. Evidence -> Competency
  | 'leads_to'          // e.g. Evidence -> Recruiter Decision
  | 'improves'          // e.g. Learning Outcome -> Competency
  | 'recommends'        // e.g. Competency Gaps -> Coaching Strategy
  | 'supports_decision' // e.g. Recruiter Decision -> Hiring expectation
  | 'tests_role';       // e.g. Question -> Role

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  data: Record<string, any>;
  lastUpdated: string;
  connectionsCount?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  weight: number; // 0.0 to 1.0 representing strength of connection/confidence
  lastUpdated: string;
}

export interface KnowledgeGraphState {
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
  version: string;
  lastUpdated: string;
  data?: {
    genomes?: any[];
    updatesLog?: any[];
  };
}

export interface InterviewGenomeRecord {
  sessionId: string;
  userId: string;
  roleId: string;
  industryId: string;
  companyId?: string;
  timestamp: string;
  questions: {
    questionId: string;
    questionText: string;
    competencies: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    answerLength: number;
    clarityScore: number;
    relevanceScore: number;
    evidenceText?: string;
    feedbackScore: number; // overall calculated score
  }[];
  overallReadiness: number;
  recruiterRecommendation: 'hire' | 'consider' | 'reject';
  learningAcquisitions: {
    competencyId: string;
    beforeScore: number;
    afterScore: number;
    improvement: number;
  }[];
}
