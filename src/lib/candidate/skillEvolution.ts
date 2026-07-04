import { CandidateState, SkillEvolutionNode } from './candidateState';

export class SkillEvolutionEngine {
  /**
   * Appends an interview score observation to the skill evolution node history.
   */
  public static recordSessionSkillScores(state: CandidateState, stepIndex: number): void {
    const digitalTwin = state.digitalTwin;
    const skillEvol = state.skillEvolution;

    // We assume the current interview session step corresponds to some week or iteration
    const weekNumber = Math.max(1, Math.min(12, stepIndex));

    Object.entries(digitalTwin).forEach(([compId, comp]) => {
      let node: SkillEvolutionNode = skillEvol[compId];

      if (!node) {
        node = {
          competencyId: compId,
          timeline: []
        };
        skillEvol[compId] = node;
      }

      // Check if this week already exists, if so overwrite, else push
      const existingIdx = node.timeline.findIndex(t => t.week === weekNumber);
      if (existingIdx !== -1) {
        node.timeline[existingIdx].score = comp.score;
      } else {
        node.timeline.push({ week: weekNumber, score: comp.score });
      }

      // Keep timeline sorted by week
      node.timeline.sort((a, b) => a.week - b.week);
    });
  }

  /**
   * Identifies the single most improved competency.
   */
  public static getMostImprovedCompetency(state: CandidateState): { name: string; improvement: number } | null {
    let bestComp: string | null = null;
    let maxDiff = 0;

    Object.entries(state.skillEvolution).forEach(([compId, node]) => {
      if (node.timeline.length >= 2) {
        const first = node.timeline[0].score;
        const last = node.timeline[node.timeline.length - 1].score;
        const diff = last - first;
        if (diff > maxDiff) {
          maxDiff = diff;
          bestComp = compId;
        }
      }
    });

    if (bestComp) {
      const name = state.digitalTwin[bestComp]?.name || bestComp;
      return { name, improvement: maxDiff };
    }

    return null;
  }
}
