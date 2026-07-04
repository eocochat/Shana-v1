import { GraphNode, GraphEdge } from './graphTypes';
import { GraphStateManager } from './graphState';

export const EvidenceGraph = {
  getEvidenceNodes(): GraphNode[] {
    const state = GraphStateManager.getGraphState();
    return Object.values(state.nodes).filter(node => node.type === 'evidence');
  },

  getEvidence(id: string): GraphNode | null {
    const state = GraphStateManager.getGraphState();
    const node = state.nodes[id];
    return node && node.type === 'evidence' ? node : null;
  },

  addOrUpdateEvidence(
    id: string,
    situationAction: string,
    metricImpact: string,
    recruiterConfidenceGain: number,
    additionalMetadata: Record<string, any> = {}
  ): void {
    const node: GraphNode = {
      id,
      type: 'evidence',
      label: situationAction.substring(0, 45) + '...',
      data: {
        situationAction,
        metricImpact,
        recruiterConfidenceGain,
        ...additionalMetadata
      },
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateNode(node);
  },

  linkEvidenceToCompetency(evidenceId: string, competencyId: string, weight: number): void {
    const edge: GraphEdge = {
      id: `edge_${evidenceId}_evidences_${competencyId}`,
      source: evidenceId,
      target: competencyId,
      type: 'evidences',
      weight,
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateEdge(edge);
  },

  getEvidenceForCompetency(competencyId: string): GraphNode[] {
    const state = GraphStateManager.getGraphState();
    const evidenceNodes: GraphNode[] = [];

    state.edges.forEach(edge => {
      if (edge.type === 'evidences' && edge.target === competencyId) {
        const node = state.nodes[edge.source];
        if (node && node.type === 'evidence') {
          evidenceNodes.push(node);
        }
      }
    });

    return evidenceNodes;
  }
};
