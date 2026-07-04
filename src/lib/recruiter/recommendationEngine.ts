import { RecruiterState } from './recruiterState';

export interface ActionableRecommendations {
  candidate: string[];
  recruiter: string[];
  coach: string[];
}

export class RecommendationEngine {
  /**
   * Dynamically generates actionable, context-rich recommendations for Candidate, Recruiter, and Coach.
   */
  public static generateRecommendations(state: RecruiterState): ActionableRecommendations {
    const candidate: string[] = [];
    const recruiter: string[] = [];
    const coach: string[] = [];

    const competencies = Object.values(state.competencies);
    const lowCoverageComp = competencies.find(c => c.coverage > 0 && c.coverage < 45);
    const highCoverageComp = competencies.find(c => c.coverage >= 65);
    const unresolvedContra = state.contradictions.find(c => !c.resolved);

    // 1. Candidate Feedback
    if (state.confidence.transcriptQuality < 70) {
      candidate.push('Elaborate further in your responses. Try to provide concrete examples from past roles rather than brief summaries.');
    } else {
      candidate.push('Continue utilizing structured narrative techniques (STAR model) to keep answers highly coherent under pressure.');
    }
    
    if (lowCoverageComp) {
      candidate.push(`Be prepared to give more specific, metric-backed details when asked about your experience in "${lowCoverageComp.name}".`);
    } else {
      candidate.push('Incorporate more quantifiable business outcomes and KPIs to strengthen the perceived impact of your achievements.');
    }

    if (unresolvedContra) {
      candidate.push('Ensure complete transparency and alignment in your answers; inconsistencies regarding teamwork or execution preference can affect evaluation confidence.');
    }

    // 2. Recruiter Recommendations
    if (unresolvedContra) {
      recruiter.push(`Clarify the detected discrepancy: Earlier, the candidate said "${unresolvedContra.earlierStatement}", but later stated "${unresolvedContra.laterStatement}". Ask a reconciling question.`);
    }

    const unverifiedComp = competencies.find(c => c.coverage === 0);
    if (unverifiedComp) {
      recruiter.push(`Initiate a probing question targeting the unverified "${unverifiedComp.name}" competency.`);
    } else if (lowCoverageComp) {
      recruiter.push(`Ask one more drill-down question regarding "${lowCoverageComp.name}" to solidify evidence quality.`);
    }

    if (state.confidence.overallConfidence < 50) {
      recruiter.push('Decrease difficulty slightly to help the candidate rebuild speech momentum and flow.');
    } else {
      recruiter.push('Introduce a challenging, high-pressure situational question to test the upper bounds of candidate problem solving.');
    }

    // 3. Coach Recommendations
    if (highCoverageComp) {
      coach.push(`In future coaching sessions, reinforce the candidate's strong foundation in "${highCoverageComp.name}" as a core differentiator.`);
    }
    
    if (lowCoverageComp) {
      coach.push(`Focus the next practical exercise session on building structured behavior answers for "${lowCoverageComp.name}".`);
    } else {
      coach.push('Guide the candidate through simulated leadership challenge scenarios to refine their verbal executive presence.');
    }

    if (state.confidence.transcriptQuality < 65) {
      coach.push('Practice active pause techniques and structural framing to avoid brief, rapid-fire responses.');
    }

    return {
      candidate,
      recruiter,
      coach
    };
  }
}
