import { GraphNode, GraphEdge } from './graphTypes';
import { GraphStateManager } from './graphState';

export const QuestionGraph = {
  getQuestions(): GraphNode[] {
    const state = GraphStateManager.getGraphState();
    return Object.values(state.nodes).filter(node => node.type === 'question');
  },

  getQuestion(id: string): GraphNode | null {
    const state = GraphStateManager.getGraphState();
    const node = state.nodes[id];
    return node && node.type === 'question' ? node : null;
  },

  addOrUpdateQuestion(
    id: string,
    text: string,
    difficulty: 'easy' | 'medium' | 'hard',
    successRate: number = 50,
    effectivenessRating: number = 50
  ): void {
    const node: GraphNode = {
      id,
      type: 'question',
      label: text.substring(0, 45) + '...',
      data: {
        fullText: text,
        difficulty,
        successRate,
        effectivenessRating
      },
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateNode(node);
  },

  linkQuestionToCompetency(questionId: string, competencyId: string, weight: number = 0.95): void {
    const edge: GraphEdge = {
      id: `edge_${questionId}_assesses_${competencyId}`,
      source: questionId,
      target: competencyId,
      type: 'assesses',
      weight,
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateEdge(edge);
  },

  linkQuestionToRole(questionId: string, roleId: string, weight: number = 0.8): void {
    const edge: GraphEdge = {
      id: `edge_${questionId}_tests_role_${roleId}`,
      source: questionId,
      target: roleId,
      type: 'tests_role',
      weight,
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateEdge(edge);
  }
};
