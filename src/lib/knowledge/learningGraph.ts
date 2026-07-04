import { GraphNode, GraphEdge } from './graphTypes';
import { GraphStateManager } from './graphState';

export const LearningGraph = {
  getLearningOutcomes(): GraphNode[] {
    const state = GraphStateManager.getGraphState();
    return Object.values(state.nodes).filter(node => node.type === 'learning_outcome');
  },

  addCoachingPathway(
    id: string,
    topic: string,
    method: 'workshop' | 'quiz' | 'roleplay' | 'warmup',
    beforeScore: number,
    afterScore: number,
    confidenceGain: number
  ): void {
    const delta = afterScore - beforeScore;
    const node: GraphNode = {
      id,
      type: 'learning_outcome',
      label: `Coaching: ${topic} (${method})`,
      data: {
        topic,
        method,
        beforeScore,
        afterScore,
        delta,
        confidenceGain,
        isHighlyEffective: delta > 15
      },
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateNode(node);
  },

  linkOutcomeToCompetency(outcomeId: string, competencyId: string, weight: number = 0.85): void {
    const edge: GraphEdge = {
      id: `edge_${outcomeId}_improves_${competencyId}`,
      source: outcomeId,
      target: competencyId,
      type: 'improves',
      weight,
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateEdge(edge);
  }
};
