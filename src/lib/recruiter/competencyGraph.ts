import { RecruiterState } from './recruiterState';

export interface GraphEdge {
  from: string;
  to: string;
  weight: number; // Influence factor (e.g., 0.3 means 30% of from's gains propagate to to)
}

export class CompetencyGraph {
  private static edges: GraphEdge[] = [
    { from: 'leadership', to: 'ownership', weight: 0.4 },
    { from: 'leadership', to: 'decision_making', weight: 0.3 },
    { from: 'leadership', to: 'conflict_resolution', weight: 0.3 },
    { from: 'problem_solving', to: 'technical_skills', weight: 0.3 },
    { from: 'problem_solving', to: 'adaptability', weight: 0.4 },
    { from: 'teamwork', to: 'communication', weight: 0.3 },
    { from: 'teamwork', to: 'conflict_resolution', weight: 0.4 },
    { from: 'ownership', to: 'decision_making', weight: 0.3 },
    { from: 'adaptability', to: 'learning_ability', weight: 0.4 }
  ];

  /**
   * Propagates competency updates down the graph.
   * If a target competency score changes, related competencies get a small delta bump.
   */
  public static propagateUpdates(state: RecruiterState, updatedCompetencyId: string, deltaCoverage: number, deltaConfidence: number): void {
    if (deltaCoverage <= 0 && deltaConfidence <= 0) return;

    const affected: string[] = [];

    this.edges.forEach(edge => {
      if (edge.from === updatedCompetencyId) {
        const targetComp = state.competencies[edge.to];
        if (targetComp) {
          const coverageBump = Math.round(deltaCoverage * edge.weight);
          const confidenceBump = Math.round(deltaConfidence * edge.weight);

          if (coverageBump > 0 || confidenceBump > 0) {
            targetComp.coverage = Math.min(100, targetComp.coverage + coverageBump);
            targetComp.confidence = Math.min(100, targetComp.confidence + confidenceBump);
            affected.push(`${edge.to} (+${coverageBump}% cov, +${confidenceBump}% conf)`);

            // Also update live scorecard reference
            const scorecardItem = state.scorecard[edge.to];
            if (scorecardItem) {
              scorecardItem.coverage = targetComp.coverage;
              scorecardItem.confidence = targetComp.confidence;
            }
          }
        }
      }
    });

    if (affected.length > 0) {
      state.reasoningLog.push(
        `Competency Graph: Propagated influence from "${updatedCompetencyId}" to: ${affected.join(', ')}`
      );
    }
  }

  public static getRelatedCompetencies(competencyId: string): { to: string; weight: number }[] {
    return this.edges
      .filter(e => e.from === competencyId)
      .map(e => ({ to: e.to, weight: e.weight }));
  }
}
