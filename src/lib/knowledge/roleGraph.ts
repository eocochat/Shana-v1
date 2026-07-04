import { GraphNode, GraphEdge } from './graphTypes';
import { GraphStateManager } from './graphState';

export const RoleGraph = {
  getRoles(): GraphNode[] {
    const state = GraphStateManager.getGraphState();
    return Object.values(state.nodes).filter(node => node.type === 'role');
  },

  getRole(id: string): GraphNode | null {
    const state = GraphStateManager.getGraphState();
    const node = state.nodes[id];
    return node && node.type === 'role' ? node : null;
  },

  addOrUpdateRole(
    id: string,
    name: string,
    style: string,
    difficulty: 'easy' | 'medium' | 'hard',
    commonMistakes: string[]
  ): void {
    const node: GraphNode = {
      id,
      type: 'role',
      label: name,
      data: {
        style,
        difficulty,
        commonMistakes
      },
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateNode(node);
  },

  linkRoleToCompetency(roleId: string, competencyId: string, weight: number): void {
    const edge: GraphEdge = {
      id: `edge_${roleId}_requires_${competencyId}`,
      source: roleId,
      target: competencyId,
      type: 'requires',
      weight,
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateEdge(edge);
  },

  getExpectedCompetencies(roleId: string): { node: GraphNode; weight: number }[] {
    const state = GraphStateManager.getGraphState();
    const expectations: { node: GraphNode; weight: number }[] = [];

    state.edges.forEach(edge => {
      if (edge.type === 'requires' && edge.source === roleId) {
        const competencyNode = state.nodes[edge.target];
        if (competencyNode && competencyNode.type === 'competency') {
          expectations.push({ node: competencyNode, weight: edge.weight });
        }
      }
    });

    return expectations;
  }
};
