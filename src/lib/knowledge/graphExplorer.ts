import { GraphNode, GraphEdge } from './graphTypes';
import { GraphStateManager } from './graphState';

export interface AdjacencyItem {
  node: GraphNode;
  edge: GraphEdge;
}

export const GraphExplorer = {
  /**
   * Retrieves full details and list of neighbor nodes for a specific graph node.
   */
  exploreNode(nodeId: string): { node: GraphNode; incoming: AdjacencyItem[]; outgoing: AdjacencyItem[] } | null {
    const state = GraphStateManager.getGraphState();
    const node = state.nodes[nodeId];
    if (!node) return null;

    const incoming: AdjacencyItem[] = [];
    const outgoing: AdjacencyItem[] = [];

    state.edges.forEach(edge => {
      if (edge.source === nodeId && state.nodes[edge.target]) {
        outgoing.push({
          node: state.nodes[edge.target],
          edge
        });
      } else if (edge.target === nodeId && state.nodes[edge.source]) {
        incoming.push({
          node: state.nodes[edge.source],
          edge
        });
      }
    });

    return {
      node,
      incoming,
      outgoing
    };
  },

  /**
   * Finds any available pathway of connected edges between a source node and target node.
   * Useful to explain recommendation chains.
   */
  findPath(sourceId: string, targetId: string, visited: Set<string> = new Set()): GraphNode[] | null {
    const state = GraphStateManager.getGraphState();
    if (sourceId === targetId) {
      return [state.nodes[sourceId]];
    }

    visited.add(sourceId);
    const adjacentEdges = state.edges.filter(e => e.source === sourceId);

    for (const edge of adjacentEdges) {
      if (!visited.has(edge.target)) {
        const path = this.findPath(edge.target, targetId, visited);
        if (path) {
          return [state.nodes[sourceId], ...path];
        }
      }
    }

    return null;
  },

  getAllNodes(): GraphNode[] {
    const state = GraphStateManager.getGraphState();
    return Object.values(state.nodes);
  },

  getAllEdges(): GraphEdge[] {
    const state = GraphStateManager.getGraphState();
    return state.edges;
  }
};
