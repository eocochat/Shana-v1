import { RecruiterState, EvidenceItem } from './recruiterState';
import { CompetencyCoverageEngine } from './competencyCoverage';
import { CompetencyGraph } from './competencyGraph';

export class EvidenceEngine {
  /**
   * Registers a brand-new piece of evidence for a specific competency.
   */
  public static addEvidence(
    state: RecruiterState,
    competencyId: string,
    evidenceText: string,
    supportingQuote: string,
    questionSource: string,
    confidence: number = 85,
    strength: 'Strong' | 'Medium' | 'Weak' = 'Medium'
  ): void {
    const competency = state.competencies[competencyId];
    if (!competency) {
      state.reasoningLog.push(`Evidence: Attempted to add evidence for unknown competency "${competencyId}"`);
      return;
    }

    const previousCoverage = competency.coverage;
    const previousConfidence = competency.confidence;

    const newEvidence: EvidenceItem = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      competencyId,
      evidence: evidenceText,
      confidence: Math.max(0, Math.min(100, confidence)),
      supportingQuote,
      questionSource,
      timestamp: new Date().toISOString(),
      evidenceStrength: strength
    };

    state.evidence.push(newEvidence);

    // 1. Recalculate competency coverage/confidence
    const metrics = CompetencyCoverageEngine.updateOverallCoverage(state);

    // 2. Fetch the newly computed values for propagation
    const postCoverage = state.competencies[competencyId].coverage;
    const postConfidence = state.competencies[competencyId].confidence;

    const deltaCoverage = Math.max(0, postCoverage - previousCoverage);
    const deltaConfidence = Math.max(0, postConfidence - previousConfidence);

    // 3. Propagate updates to related competencies
    if (deltaCoverage > 0 || deltaConfidence > 0) {
      CompetencyGraph.propagateUpdates(state, competencyId, deltaCoverage, deltaConfidence);
    }

    // 4. Update scorecard explanation with latest evidence
    const scorecardItem = state.scorecard[competencyId];
    if (scorecardItem) {
      scorecardItem.explanation = `Verified via evidence: "${evidenceText}". Quote: "${supportingQuote}" (Confidence: ${confidence}%)`;
    }

    state.reasoningLog.push(
      `Evidence: Added [${strength}] evidence for "${competency.name}". Coverage increased to ${postCoverage}%`
    );
  }

  /**
   * Summarizes all current evidence into readable items for hiring recommendations.
   */
  public static getEvidenceSummary(state: RecruiterState): string[] {
    return state.evidence.map(ev => {
      const compName = state.competencies[ev.competencyId]?.name || ev.competencyId;
      return `[${compName} - ${ev.evidenceStrength}] ${ev.evidence} (Source: ${ev.questionSource})`;
    });
  }
}
