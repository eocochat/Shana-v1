import { GraphNode } from './graphTypes';
import { GraphStateManager } from './graphState';

export const CandidateKnowledge = {
  getCandidateProgressNodes(): GraphNode[] {
    const state = GraphStateManager.getGraphState();
    return Object.values(state.nodes).filter(node => node.type === 'candidate_progress');
  },

  logAnonymousProgress(
    id: string,
    initialAverage: number,
    finalAverage: number,
    improvementDelta: number,
    totalPracticeSessions: number
  ): void {
    const node: GraphNode = {
      id,
      type: 'candidate_progress',
      label: `Candidate Progress Delta: +${improvementDelta}%`,
      data: {
        initialAverage,
        finalAverage,
        improvementDelta,
        totalPracticeSessions,
        anonymizedAt: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateNode(node);
  }
};
