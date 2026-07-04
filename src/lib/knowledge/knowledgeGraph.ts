import { GraphStateManager } from './graphState';
import { CompetencyGraph } from './competencyGraph';
import { CompanyGraph } from './companyGraph';
import { IndustryGraph } from './industryGraph';
import { RoleGraph } from './roleGraph';
import { QuestionGraph } from './questionGraph';
import { EvidenceGraph } from './evidenceGraph';
import { RecruiterKnowledge } from './recruiterKnowledge';
import { CandidateKnowledge } from './candidateKnowledge';
import { LearningGraph } from './learningGraph';
import { RecommendationGraph } from './recommendationGraph';
import { SemanticSearch } from './semanticSearch';
import { RagEngine } from './ragEngine';
import { GraphUpdater } from './graphUpdater';
import { GraphAnalytics } from './graphAnalytics';
import { GraphExplorer } from './graphExplorer';
import { InterviewGenome } from './interviewGenome';

export const KnowledgeGraph = {
  // Core state retrieval
  getState() {
    return GraphStateManager.getGraphState();
  },

  // Facades to modular graph components
  Competency: CompetencyGraph,
  Company: CompanyGraph,
  Industry: IndustryGraph,
  Role: RoleGraph,
  Question: QuestionGraph,
  Evidence: EvidenceGraph,
  Recruiter: RecruiterKnowledge,
  Candidate: CandidateKnowledge,
  Learning: LearningGraph,
  Recommendation: RecommendationGraph,
  Genome: InterviewGenome,

  // Semantic query capabilities
  search(query: string, limit: number = 5) {
    return SemanticSearch.search(query, limit);
  },

  // Hybrid RAG compilation
  getRagContext(params: {
    roleIdOrName?: string;
    companyIdOrName?: string;
    industryIdOrName?: string;
    generalQuery?: string;
  }) {
    return RagEngine.getKnowledgeContext(params);
  },

  // Manual or automatic session processing
  updateFromSession(
    userId: string,
    sessionId: string,
    data: Parameters<typeof GraphUpdater.updateGraphFromSession>[2]
  ) {
    GraphUpdater.updateGraphFromSession(userId, sessionId, data);
  },

  // Analytical performance summaries
  getAnalytics() {
    return GraphAnalytics.getAnalyticsSummary();
  },

  // Structural exploration diagnostics
  Explorer: GraphExplorer
};
export default KnowledgeGraph;
