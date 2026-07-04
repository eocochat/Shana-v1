import { GraphNode, GraphEdge } from './graphTypes';
import { GraphStateManager } from './graphState';

export const CompetencyGraph = {
  getCompetencies(): GraphNode[] {
    const state = GraphStateManager.getGraphState();
    return Object.values(state.nodes).filter(node => node.type === 'competency');
  },

  getCompetency(id: string): GraphNode | null {
    const state = GraphStateManager.getGraphState();
    const node = state.nodes[id];
    return node && node.type === 'competency' ? node : null;
  },

  getRelatedCompetencies(competencyId: string): { node: GraphNode; edgeWeight: number }[] {
    const state = GraphStateManager.getGraphState();
    const related: { node: GraphNode; edgeWeight: number }[] = [];

    state.edges.forEach(edge => {
      if (edge.type === 'related_to') {
        if (edge.source === competencyId && state.nodes[edge.target]) {
          related.push({ node: state.nodes[edge.target], edgeWeight: edge.weight });
        } else if (edge.target === competencyId && state.nodes[edge.source]) {
          related.push({ node: state.nodes[edge.source], edgeWeight: edge.weight });
        }
      }
    });

    return related.sort((a, b) => b.edgeWeight - a.edgeWeight);
  },

  addOrUpdateCompetency(id: string, label: string, description: string, extraData: Record<string, any> = {}): void {
    const node: GraphNode = {
      id,
      type: 'competency',
      label,
      data: {
        description,
        ...extraData
      },
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateNode(node);
  },

  connectCompetencies(sourceId: string, targetId: string, weight: number): void {
    const edge: GraphEdge = {
      id: `edge_${sourceId}_related_to_${targetId}`,
      source: sourceId,
      target: targetId,
      type: 'related_to',
      weight,
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateEdge(edge);
  }
};
