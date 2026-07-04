import { GraphNode, GraphEdge } from './graphTypes';
import { GraphStateManager } from './graphState';

export const RecommendationGraph = {
  getRecommendations(): GraphNode[] {
    const state = GraphStateManager.getGraphState();
    return Object.values(state.nodes).filter(node => node.type === 'coaching_strategy');
  },

  addCoachingStrategy(
    id: string,
    title: string,
    description: string,
    suggestedExercises: string[],
    targetCompetencyId: string
  ): void {
    const node: GraphNode = {
      id,
      type: 'coaching_strategy',
      label: title,
      data: {
        description,
        suggestedExercises,
        targetCompetencyId
      },
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateNode(node);

    // Link strategy back to the target competency
    const edge: GraphEdge = {
      id: `edge_${id}_recommends_${targetCompetencyId}`,
      source: id,
      target: targetCompetencyId,
      type: 'recommends',
      weight: 0.9,
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateEdge(edge);
  },

  getCoachingStrategyForCompetency(competencyId: string): GraphNode | null {
    const state = GraphStateManager.getGraphState();
    let strategyNode: GraphNode | null = null;

    state.edges.forEach(edge => {
      if (edge.type === 'recommends' && edge.target === competencyId) {
        const node = state.nodes[edge.source];
        if (node && node.type === 'coaching_strategy') {
          strategyNode = node;
        }
      }
    });

    return strategyNode;
  }
};
