import { RecruiterState } from './recruiterState';

export class ConfidenceEngine {
  /**
   * Evaluates the candidate answer transcript length and word quality to adjust transcript quality metrics.
   */
  public static assessTranscriptQuality(state: RecruiterState, candidateAnswer: string): void {
    const wordCount = candidateAnswer.trim().split(/\s+/).length;
    
    let qualityScore = 100;
    if (wordCount < 5) {
      qualityScore = 30; // extremely sparse
    } else if (wordCount < 15) {
      qualityScore = 65; // somewhat sparse
    } else if (wordCount > 100) {
      qualityScore = 100; // rich, descriptive
    } else {
      qualityScore = 85;
    }

    // Smooth average with previous transcript quality
    const prev = state.confidence.transcriptQuality;
    state.confidence.transcriptQuality = Math.round((prev * 0.7) + (qualityScore * 0.3));
  }

  /**
   * Recalculates Shana's overall evaluation confidence dynamically based on current evidence, coverage, and contradictions.
   */
  public static recalculateConfidence(state: RecruiterState): number {
    const conf = state.confidence;
    
    // 1. Coverage Contribution (up to 30%)
    const coverageContrib = (conf.competencyCoverage / 100) * 30;

    // 2. Completion Contribution (up to 30%)
    const completionContrib = (conf.interviewCompletion / 100) * 30;

    // 3. Evidence Strength Contribution (up to 30%)
    const evidenceCount = state.evidence.length;
    const strongEvidenceCount = state.evidence.filter(e => e.evidenceStrength === 'Strong').length;
    let evidenceScore = Math.min(100, (evidenceCount * 12) + (strongEvidenceCount * 10));
    conf.evidenceStrength = evidenceScore;
    const evidenceContrib = (evidenceScore / 100) * 30;

    // 4. Transcript Quality Contribution (up to 10%)
    const transcriptContrib = (conf.transcriptQuality / 100) * 10;

    // 5. Contradiction Penalty deduction
    const contradictionPenalty = conf.contradictionsPenalty;

    // Sum and clamp
    const rawOverall = Math.round(coverageContrib + completionContrib + evidenceContrib + transcriptContrib - contradictionPenalty);
    
    // Start with a small baseline of 40 so the user doesn't see a scary 0% on question 1
    const finalOverall = Math.max(15, Math.min(100, rawOverall + 25));
    conf.overallConfidence = finalOverall;

    // If confidence is below threshold, insert an objective to get more details
    if (finalOverall < 45 && !state.currentObjectives.some(o => o.includes('bolster evaluation confidence'))) {
      state.currentObjectives.push('Ask additional detailed follow-up questions to bolster evaluation confidence');
    }

    return finalOverall;
  }
}
