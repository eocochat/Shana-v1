import { RecruiterState, RecruiterScorecardItem } from './recruiterState';

export class RecruiterScorecardEngine {
  /**
   * Retrieves the live scorecard items sorted by priority and coverage.
   */
  public static getScorecardItems(state: RecruiterState): RecruiterScorecardItem[] {
    return Object.values(state.scorecard).sort((a, b) => {
      const priorityDiff = 
        (b.priority === 'High' ? 2 : b.priority === 'Medium' ? 1 : 0) -
        (a.priority === 'High' ? 2 : a.priority === 'Medium' ? 1 : 0);
      
      if (priorityDiff !== 0) return priorityDiff;
      return b.coverage - a.coverage;
    });
  }

  /**
   * Sets manual priority for a competency if the recruiter/admin wants to override it.
   */
  public static setCompetencyPriority(state: RecruiterState, competencyId: string, priority: 'High' | 'Medium' | 'Low'): void {
    const item = state.scorecard[competencyId];
    if (item) {
      item.priority = priority;
      state.reasoningLog.push(`Scorecard: Updated competency priority for "${item.name}" to "${priority}"`);
    }
  }

  /**
   * Generates a rapid text breakdown of the live scorecard.
   */
  public static getScorecardSummary(state: RecruiterState): string {
    const items = this.getScorecardItems(state);
    const verifiedCount = items.filter(i => i.decisionStatus === 'Verified' || i.decisionStatus === 'Exceeds').length;
    return `Scorecard Status: ${verifiedCount} / ${items.length} competencies fully verified.`;
  }
}
