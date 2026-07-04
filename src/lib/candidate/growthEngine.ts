import { CandidateState } from './candidateState';

export class GrowthEngine {
  /**
   * Calculates overall growth metrics based on historical digital twin observations.
   */
  public static calculateGrowthRate(state: CandidateState): { growthRate: number; retentionRate: number; level: string } {
    const competencies = Object.values(state.digitalTwin);
    let totalInitial = 0;
    let totalCurrent = 0;
    let counted = 0;

    competencies.forEach(comp => {
      if (comp.history.length > 0) {
        totalInitial += comp.history[0].score;
        totalCurrent += comp.score;
        counted++;
      }
    });

    const avgInitial = counted > 0 ? totalInitial / counted : 50;
    const avgCurrent = counted > 0 ? totalCurrent / counted : 50;

    const diff = avgCurrent - avgInitial;
    // Growth rate as percentage of baseline
    const growthRate = avgInitial > 0 ? Math.round((diff / avgInitial) * 100) : 0;

    // Retention score is proportional to motivation streak and active badges
    const retentionRate = Math.min(100, 40 + (state.motivation.streakCount * 12) + (state.motivation.unlockedMilestones.length * 8));

    let level = 'Beginner';
    if (avgCurrent > 85) level = 'Expert Leader';
    else if (avgCurrent > 70) level = 'Intermediate Practitioner';
    else if (avgCurrent > 55) level = 'Competent Explorer';

    return {
      growthRate,
      retentionRate,
      level
    };
  }
}
