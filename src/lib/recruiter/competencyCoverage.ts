import { RecruiterState } from './recruiterState';

export class CompetencyCoverageEngine {
  /**
   * Calculates overall metrics and updates state coverage scores.
   */
  public static updateOverallCoverage(state: RecruiterState): {
    averageCoverage: number;
    averageConfidence: number;
    totalEvidenceCount: number;
  } {
    const competencies = Object.values(state.competencies);
    if (competencies.length === 0) {
      return { averageCoverage: 0, averageConfidence: 0, totalEvidenceCount: 0 };
    }

    let sumCoverage = 0;
    let sumConfidence = 0;
    let totalEvidenceCount = 0;

    competencies.forEach(comp => {
      // Calculate evidence counts for this competency
      const compEvidence = state.evidence.filter(ev => ev.competencyId === comp.id);
      comp.evidenceCount = compEvidence.length;

      // Dynamically calculate score & confidence based on evidence count & strength
      if (comp.evidenceCount > 0) {
        // Base coverage increases with each evidence point (e.g., 40% for 1st, +25% for 2nd, +20% for 3rd, max 100%)
        let calcCoverage = 0;
        let weightedConfidenceSum = 0;

        compEvidence.forEach((ev, index) => {
          const strengthBonus = ev.evidenceStrength === 'Strong' ? 40 : ev.evidenceStrength === 'Medium' ? 25 : 15;
          calcCoverage += strengthBonus;
          weightedConfidenceSum += ev.confidence;
        });

        comp.coverage = Math.min(100, calcCoverage);
        comp.confidence = Math.min(100, Math.round(weightedConfidenceSum / comp.evidenceCount));
      } else {
        comp.coverage = Math.max(0, comp.coverage); // Preserve initial or propagated values
        comp.confidence = Math.max(0, comp.confidence);
      }

      sumCoverage += comp.coverage;
      sumConfidence += comp.confidence;
      totalEvidenceCount += comp.evidenceCount;

      // Update corresponding scorecard item
      const scorecardItem = state.scorecard[comp.id];
      if (scorecardItem) {
        scorecardItem.coverage = comp.coverage;
        scorecardItem.confidence = comp.confidence;
        scorecardItem.evidenceCount = comp.evidenceCount;
        
        // Determine status
        if (comp.coverage >= 80) {
          scorecardItem.decisionStatus = 'Exceeds';
        } else if (comp.coverage >= 50) {
          scorecardItem.decisionStatus = 'Verified';
        } else if (comp.coverage > 0) {
          scorecardItem.decisionStatus = 'Developing';
        } else {
          scorecardItem.decisionStatus = 'Unverified';
        }
      }
    });

    const averageCoverage = Math.round(sumCoverage / competencies.length);
    const averageConfidence = Math.round(sumConfidence / competencies.length);

    // Update state confidence counters
    state.confidence.competencyCoverage = averageCoverage;
    state.confidence.evidenceStrength = Math.min(
      100,
      Math.round((totalEvidenceCount * 12) + (averageConfidence * 0.4))
    );

    return {
      averageCoverage,
      averageConfidence,
      totalEvidenceCount
    };
  }

  /**
   * Retrieves the lowest covered high-priority or standard competency to ask about next.
   */
  public static getLowestCoveredCompetencies(state: RecruiterState, limit = 3): string[] {
    return Object.values(state.scorecard)
      .sort((a, b) => {
        // Sort by priority (High first), then by lowest coverage
        const priorityScoreA = a.priority === 'High' ? 2 : a.priority === 'Medium' ? 1 : 0;
        const priorityScoreB = b.priority === 'High' ? 2 : b.priority === 'Medium' ? 1 : 0;
        
        if (priorityScoreA !== priorityScoreB) {
          return priorityScoreB - priorityScoreA;
        }
        return a.coverage - b.coverage;
      })
      .slice(0, limit)
      .map(item => item.competencyId);
  }

  /**
   * Determines if the interview has sufficient coverage to safely wrap up.
   */
  public static hasSufficientCoverage(state: RecruiterState): boolean {
    const highPriorityItems = Object.values(state.scorecard).filter(item => item.priority === 'High');
    const allItems = Object.values(state.scorecard);

    // We want at least some coverage in all high-priority items, and average overall coverage >= 45%
    const averageOverallCoverage = allItems.reduce((acc, curr) => acc + curr.coverage, 0) / allItems.length;
    const highPriorityCovered = highPriorityItems.every(item => item.coverage >= 30);

    return averageOverallCoverage >= 45 && highPriorityCovered;
  }
}
