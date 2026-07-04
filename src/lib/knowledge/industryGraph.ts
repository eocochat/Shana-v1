import { GraphNode } from './graphTypes';
import { GraphStateManager } from './graphState';

export const IndustryGraph = {
  getIndustries(): GraphNode[] {
    const state = GraphStateManager.getGraphState();
    return Object.values(state.nodes).filter(node => node.type === 'industry');
  },

  getIndustry(id: string): GraphNode | null {
    const state = GraphStateManager.getGraphState();
    const node = state.nodes[id];
    return node && node.type === 'industry' ? node : null;
  },

  addOrUpdateIndustry(
    id: string,
    name: string,
    behaviorExpectation: string,
    technicalExpectation: string
  ): void {
    const node: GraphNode = {
      id,
      type: 'industry',
      label: name,
      data: {
        behaviorExpectation,
        technicalExpectation
      },
      lastUpdated: new Date().toISOString()
    };
    GraphStateManager.updateNode(node);
  }
};
