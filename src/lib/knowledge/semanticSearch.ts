import { GraphNode, KnowledgeGraphState } from './graphTypes';
import { GraphStateManager } from './graphState';

// Concept expansions for semantic mapping
const synonymMap: Record<string, string[]> = {
  leadership: ['lead', 'leader', 'manage', 'team', 'ownership', 'manager', 'guide', 'direction'],
  problem_solving: ['analytical', 'solve', 'analyze', 'bug', 'complex', 'architecture', 'think', 'design'],
  communication: ['talk', 'write', 'present', 'listen', 'speak', 'pitch', 'articulate', 'star'],
  conflict_resolution: ['conflict', 'disagree', 'argument', 'fight', 'negotiate', 'alignment', 'trade-off'],
  ownership: ['own', 'responsible', 'proactive', 'remediate', 'failed', 'accountability', 'initiative'],
  technical_skills: ['code', 'system', 'programming', 'architecture', 'backend', 'frontend', 'scalability', 'algorithm'],
  confidence: ['stress', 'pressure', 'calm', 'recovery', 'speaking pace', 'composure', 'presence'],
  google: ['googlyness', 'alphabet', 'larry page', 'mountain view'],
  amazon: ['customer obsession', 'principles', 'bezos', 'seattle']
};

export interface SemanticSearchResult {
  node: GraphNode;
  score: number; // Relevance score (0.0 to 1.0+)
  matchExplanation: string;
}

export const SemanticSearch = {
  search(query: string, limit: number = 5): SemanticSearchResult[] {
    const state = GraphStateManager.getGraphState();
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return [];

    const queryTokens = cleanQuery.split(/[\s,.\-!?_]+/);
    const results: SemanticSearchResult[] = [];

    // 1. Calculate lexical and synonym-expanded match score for each node
    Object.values(state.nodes).forEach(node => {
      let score = 0;
      let reasons: string[] = [];

      const labelLower = node.label.toLowerCase();
      const typeLower = node.type.toLowerCase();
      
      // Match label directly
      if (labelLower.includes(cleanQuery)) {
        score += 0.6;
        reasons.push(`Direct label match with '${cleanQuery}'`);
      }

      // Match node type
      if (typeLower.includes(cleanQuery)) {
        score += 0.3;
        reasons.push(`Node type match`);
      }

      // Match properties in data
      const dataString = JSON.stringify(node.data).toLowerCase();
      if (dataString.includes(cleanQuery)) {
        score += 0.25;
        reasons.push(`Data property matches query text`);
      }

      // Token-level synonym overlaps
      queryTokens.forEach(token => {
        if (token.length < 3) return;

        // Check if token matches label
        if (labelLower.includes(token)) {
          score += 0.15;
          reasons.push(`Token match: '${token}'`);
        }

        // Expand synonyms
        Object.entries(synonymMap).forEach(([concept, syns]) => {
          if (concept.includes(token) || syns.some(s => s.includes(token))) {
            // Found a semantic concept overlap!
            if (node.id.toLowerCase().includes(concept) || labelLower.includes(concept)) {
              score += 0.35;
              reasons.push(`Semantic mapping to concept '${concept}' via token '${token}'`);
            }
          }
        });
      });

      if (score > 0) {
        results.push({
          node,
          score,
          matchExplanation: reasons.join(', ')
        });
      }
    });

    // 2. Graph-Hop Boosting: If we matched a node, boost other nodes connected to it!
    // This leverages the knowledge graph edges for true semantic semantic expansion.
    const directResultsMap = new Map(results.map(r => [r.node.id, r]));
    
    state.edges.forEach(edge => {
      const srcResult = directResultsMap.get(edge.source);
      const tgtResult = directResultsMap.get(edge.target);

      if (srcResult && !tgtResult) {
        // Source node has a match, target doesn't. Add target with boosted score.
        const targetNode = state.nodes[edge.target];
        if (targetNode) {
          const boostScore = srcResult.score * edge.weight * 0.4;
          const explanation = `Graph relational boost from '${srcResult.node.label}' via connection: '${edge.type}'`;
          results.push({
            node: targetNode,
            score: boostScore,
            matchExplanation: explanation
          });
          // Update local map to avoid double additions
          directResultsMap.set(edge.target, { node: targetNode, score: boostScore, matchExplanation: explanation });
        }
      } else if (tgtResult && !srcResult) {
        // Target node has a match, source doesn't. Add source with boosted score.
        const sourceNode = state.nodes[edge.source];
        if (sourceNode) {
          const boostScore = tgtResult.score * edge.weight * 0.4;
          const explanation = `Graph relational boost from '${tgtResult.node.label}' via connection: '${edge.type}'`;
          results.push({
            node: sourceNode,
            score: boostScore,
            matchExplanation: explanation
          });
          directResultsMap.set(edge.source, { node: sourceNode, score: boostScore, matchExplanation: explanation });
        }
      }
    });

    // Sort by descending score
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
};
