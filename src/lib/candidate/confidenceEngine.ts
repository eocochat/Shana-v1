import { CandidateState } from './candidateState';

export class ConfidenceEngine {
  /**
   * Tracks and evaluates confidence markers from interview responses.
   */
  public static evaluateResponseConfidence(
    state: CandidateState,
    answer: string,
    isTechnical: boolean,
    isUnderPressure: boolean
  ): void {
    const wordCount = answer.trim().split(/\s+/).length;
    let computedConfidence = 60;

    // Direct, assertive statements boost confidence indicators
    const strongIndicators = ['definitely', 'absolutely', 'responsible', 'led', 'delivered', 'achieved', 'metrics'];
    const weakIndicators = ['maybe', 'i think', 'sort of', 'probably', 'maybe', 'not sure', 'i guess'];

    strongIndicators.forEach(word => {
      if (answer.toLowerCase().includes(word)) computedConfidence += 6;
    });

    weakIndicators.forEach(word => {
      if (answer.toLowerCase().includes(word)) computedConfidence -= 8;
    });

    // Length-based scoring
    if (wordCount > 80) computedConfidence += 15;
    if (wordCount < 12) computedConfidence -= 25;

    computedConfidence = Math.max(10, Math.min(100, computedConfidence));

    const conf = state.confidence;

    // Apply indicators to pressure / technical scores with adaptive learning weight for growth
    if (isTechnical) {
      let weight = 0.3;
      if (computedConfidence > conf.confidenceDuringTechnical) {
        weight = Math.min(0.8, 0.3 + ((computedConfidence - conf.confidenceDuringTechnical) / 100));
      }
      conf.confidenceDuringTechnical = Math.round((conf.confidenceDuringTechnical * (1 - weight)) + (computedConfidence * weight));
    }
    if (isUnderPressure) {
      let weight = 0.3;
      if (computedConfidence > conf.confidenceUnderPressure) {
        weight = Math.min(0.8, 0.3 + ((computedConfidence - conf.confidenceUnderPressure) / 100));
      }
      conf.confidenceUnderPressure = Math.round((conf.confidenceUnderPressure * (1 - weight)) + (computedConfidence * weight));
    }

    // Capture peaks and initial states
    if (conf.trend.length === 0) {
      conf.beginningConfidence = computedConfidence;
    }

    if (computedConfidence > conf.peakConfidence) {
      conf.peakConfidence = computedConfidence;
    }

    // Evaluate Recovery: How fast does the user bounce back after a dip
    const previousScoreNode = conf.trend[conf.trend.length - 1];
    if (previousScoreNode && previousScoreNode.overallConfidence < 50 && computedConfidence >= 65) {
      conf.confidenceRecovery = Math.min(100, conf.confidenceRecovery + 12);
    }

    // Append to trend timeline
    conf.trend.push({
      timestamp: new Date().toISOString(),
      overallConfidence: computedConfidence
    });

    if (conf.trend.length > 20) {
      conf.trend.shift();
    }
  }

  /**
   * Detects whether long-term user confidence has improved or regressed.
   */
  public static detectConfidenceTrendLabel(state: CandidateState): { trend: 'Improving' | 'Stable' | 'Regressing'; description: string } {
    const trend = state.confidence.trend;
    if (trend.length < 3) {
      return { trend: 'Stable', description: 'Establishing baseline confidence telemetry.' };
    }

    const firstHalf = trend.slice(0, Math.floor(trend.length / 2));
    const secondHalf = trend.slice(Math.floor(trend.length / 2));

    const avgFirst = firstHalf.reduce((acc, curr) => acc + curr.overallConfidence, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((acc, curr) => acc + curr.overallConfidence, 0) / secondHalf.length;

    const diff = avgSecond - avgFirst;

    if (diff > 8) {
      return { trend: 'Improving', description: 'Strong upward trajectory! Clear evidence of verbal self-assurance and executive presence.' };
    } else if (diff < -8) {
      return { trend: 'Regressing', description: 'Downward trend detected. Suggest practice runs focusing on steady pacing and assertive delivery.' };
    } else {
      return { trend: 'Stable', description: 'Consistent confidence performance across sessions. Foundational voice projection is safe.' };
    }
  }
}
