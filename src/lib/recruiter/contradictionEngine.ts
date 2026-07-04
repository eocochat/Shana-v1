import { RecruiterState, ContradictionItem } from './recruiterState';

export class ContradictionEngine {
  /**
   * Scans candidate answers to detect semantic contradictions.
   * Can also be triggered explicitly by the RecruiterBrain when semantic mismatch is analyzed.
   */
  public static detectAndRegisterContradiction(
    state: RecruiterState,
    competencyId: string,
    earlierStatement: string,
    laterStatement: string,
    gravity: 'High' | 'Medium' | 'Low' = 'Medium'
  ): ContradictionItem {
    const contradiction: ContradictionItem = {
      id: `contra_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      competencyId,
      earlierStatement,
      laterStatement,
      resolved: false,
      timestamp: new Date().toISOString(),
      gravity
    };

    state.contradictions.push(contradiction);

    // Penalize Shana's confidence metrics for contradictions
    const penaltyAmount = gravity === 'High' ? 15 : gravity === 'Medium' ? 8 : 4;
    state.confidence.contradictionsPenalty = Math.min(60, state.confidence.contradictionsPenalty + penaltyAmount);

    state.reasoningLog.push(
      `Contradiction: Mismatch found in "${competencyId}". Earlier: "${earlierStatement}" vs Later: "${laterStatement}". Penalty: -${penaltyAmount}% confidence`
    );

    return contradiction;
  }

  /**
   * Marks a specific contradiction as resolved when the candidate clarifies.
   */
  public static resolveContradiction(state: RecruiterState, contradictionId: string, resolutionText: string): void {
    const contra = state.contradictions.find(c => c.id === contradictionId);
    if (contra) {
      contra.resolved = true;
      contra.resolutionText = resolutionText;

      // Lower the penalty of contradictions since it's resolved
      const refund = contra.gravity === 'High' ? 10 : contra.gravity === 'Medium' ? 5 : 2;
      state.confidence.contradictionsPenalty = Math.max(0, state.confidence.contradictionsPenalty - refund);

      state.reasoningLog.push(
        `Contradiction: Resolved inconsistency for "${contra.competencyId}" via clarification: "${resolutionText}". Refunded +${refund}% confidence`
      );
    }
  }

  /**
   * Checks if there are any active unresolved contradictions and returns a polite question suggestion.
   */
  public static getUnresolvedContradictionChallenge(state: RecruiterState): { challengeText: string; id: string } | null {
    const unresolved = state.contradictions.find(c => !c.resolved);
    if (!unresolved) return null;

    const compName = state.competencies[unresolved.competencyId]?.name || unresolved.competencyId;
    
    return {
      challengeText: `Earlier you mentioned: "${unresolved.earlierStatement}". However, you recently noted: "${unresolved.laterStatement}". To help me understand your true style in ${compName}, could you expand on how these two approaches fit together?`,
      id: unresolved.id
    };
  }
}
