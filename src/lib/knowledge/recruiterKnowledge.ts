import { GraphNode, GraphEdge } from './graphTypes';
import { GraphStateManager } from './graphState';

export const RecruiterKnowledge = {
  getRecruiterDecisions(): GraphNode[] {
    const state = GraphStateManager.getGraphState();
    return Object.values(state.nodes).filter(node => node.type === 'recruiter_decision');
  },

  addOrUpdateDecision(
    id: string,
    decisionType: 'hire' | 'consider' | 'reject',
    notes: string,
    confidenceScore: number,
    userId: string
  ): void {
    const node: GraphNode = {
      id,
      type: 'recruiter_decision',
      label: `Recruiter Choice: ${decisionType.toUpperCase()}`,
      data: {
        decisionType,
        notes,
        confidenceScore,
        userId
      },
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateNode(node);
  },

  linkDecisionToEvidence(decisionId: string, evidenceId: string, weight: number = 0.9): void {
    const edge: GraphEdge = {
      id: `edge_${evidenceId}_leads_to_${decisionId}`,
      source: evidenceId,
      target: decisionId,
      type: 'leads_to',
      weight,
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateEdge(edge);
  }
};
