import { RecruiterState } from './recruiterState';

export class RecruiterReasoningEngine {
  /**
   * Adds a detailed, transparent thought block to the recruiter's internal log.
   */
  public static logReasoning(
    state: RecruiterState,
    objective: string,
    evidenceStrength: 'Strong' | 'Medium' | 'Weak' | 'None',
    decision: string,
    reasonText: string
  ): void {
    const timestamp = new Date().toLocaleTimeString();
    const logItem = `[${timestamp}] Objective: "${objective}" | Evidence: [${evidenceStrength}] | Action Decision: "${decision}" | Reason: ${reasonText}`;
    
    state.reasoningLog.push(logItem);
    
    // Maintain a max log size to avoid memory leaks or state bloat
    if (state.reasoningLog.length > 50) {
      state.reasoningLog.shift();
    }
  }

  /**
   * Retrieves all explainable AI recruiter reasoning items.
   */
  public static getExplainableReasoning(state: RecruiterState): string[] {
    return [...state.reasoningLog];
  }

  /**
   * Generates a high-level real-time summary of the recruiter's cognitive process.
   */
  public static getCognitiveStatusSummary(state: RecruiterState): string {
    const stage = state.strategy.currentStage;
    const pendingContradictions = state.contradictions.filter(c => !c.resolved).length;
    const evidenceCount = state.evidence.length;

    return `Recruiter Brain is currently evaluating [Stage: ${stage}]. ` +
      `Analyzing ${evidenceCount} registered evidence points. ` +
      `Flagged ${pendingContradictions} active contradictions. ` +
      `Active target focus is on resolving competency gaps.`;
  }
}
