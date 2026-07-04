import { RecruiterState, HiringDecisionState, HiringRecommendation } from './recruiterState';
import { EvidenceEngine } from './evidenceEngine';

export class HiringDecisionEngine {
  /**
   * Generates a comprehensive, highly transparent hiring recommendation based on the collected evidence.
   */
  public static generateDecision(state: RecruiterState): HiringDecisionState {
    const competencies = Object.values(state.competencies);
    const averageCoverage = competencies.reduce((acc, curr) => acc + curr.coverage, 0) / competencies.length;
    const averageConfidence = competencies.reduce((acc, curr) => acc + curr.confidence, 0) / competencies.length;
    const totalEvidence = state.evidence.length;
    const strongEvidence = state.evidence.filter(e => e.evidenceStrength === 'Strong');
    const unresolvedContradictions = state.contradictions.filter(c => !c.resolved);

    let recommendation: HiringRecommendation = 'Neutral';
    let reasoning = '';
    const missingInformation: string[] = [];
    let suggestedNextStage = 'Experience Validation';

    // 1. Identify missing information gaps
    competencies.forEach(comp => {
      if (comp.coverage < 30) {
        missingInformation.push(`Missing solid evidence for "${comp.name}" (coverage currently ${comp.coverage}%)`);
      }
    });

    // Determine the next suggested interview stage based on unfinished stages in strategy
    const completedStages = state.strategy.completedStages;
    const skippedStages = state.strategy.skippedStages;
    const allStages: string[] = [
      'Experience Validation',
      'Competency Discovery',
      'Leadership Assessment',
      'Problem Solving',
      'Behavioral Assessment',
      'Decision Making',
      'Motivation',
      'Candidate Questions',
      'Closing'
    ];
    const nextStage = allStages.find(st => !completedStages.includes(st as any) && !skippedStages.includes(st as any));
    if (nextStage) {
      suggestedNextStage = nextStage;
    } else {
      suggestedNextStage = 'Final Panel Review';
    }

    // 2. Compute hiring recommendation grade
    if (totalEvidence === 0) {
      recommendation = 'Neutral';
      reasoning = 'The evaluation is in its early stages. Initial screening questions are being administered, and no conclusive evidence has been registered yet.';
    } else if (unresolvedContradictions.length >= 2) {
      recommendation = 'Leaning No Hire';
      reasoning = `The candidate has presented ${unresolvedContradictions.length} significant semantic inconsistencies in their responses. Key areas of concern involve statements around ${unresolvedContradictions.map(c => c.competencyId).join(' and ')}. A detailed reference check is strongly advised.`;
    } else if (averageCoverage >= 70 && strongEvidence.length >= 3 && unresolvedContradictions.length === 0) {
      recommendation = 'Strong Hire';
      reasoning = `Outstanding performance. The candidate demonstrated exceptionally high competency alignment, backed by ${strongEvidence.length} distinct high-impact direct experiences (Strong quality evidence). Communication was structured, with zero contradictions detected.`;
    } else if (averageCoverage >= 55 && totalEvidence >= 4 && unresolvedContradictions.length === 0) {
      recommendation = 'Hire';
      reasoning = 'Solid fit. The candidate possesses verifiable competency depth across critical tracks. High correlation was shown between previous role accomplishments and targeted requirements, demonstrating safe domain ownership.';
    } else if (averageCoverage >= 45 && totalEvidence >= 2) {
      recommendation = 'Leaning Hire';
      reasoning = 'Promising potential. The candidate exhibits healthy foundational attributes, though some specialized technical or leadership tracks require closer inspection. Additional peer review is recommended.';
    } else if (averageCoverage < 25 && totalEvidence >= 3) {
      recommendation = 'No Hire';
      reasoning = 'Substantial competency gaps identified. Despite multiple probing loops, the candidate struggled to provide concrete, metric-driven examples of past accomplishments, resorting to purely hypothetical phrasing.';
    } else if (averageCoverage < 15 && totalEvidence >= 5) {
      recommendation = 'Strong No Hire';
      reasoning = 'Critical misalignment. The assessment indicates severe competency deficits across leadership, technical skills, and collaboration tracks, combined with poor communication clarity and unverified experience claims.';
    } else {
      recommendation = 'Neutral';
      reasoning = 'Balanced profile. Collected evidence shows a mix of strengths and developmental areas. The candidate performs well in basic scenarios but requires further technical or situational testing to make a definitive decision.';
    }

    const decision: HiringDecisionState = {
      recommendation,
      reasoning,
      evidenceSummary: EvidenceEngine.getEvidenceSummary(state).slice(0, 5),
      confidence: Math.round((averageCoverage + averageConfidence) / 2),
      missingInformation,
      suggestedNextStage
    };

    state.decision = decision;
    return decision;
  }
}
