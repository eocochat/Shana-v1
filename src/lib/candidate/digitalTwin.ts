import { CandidateState, DigitalTwinCompetency } from './candidateState';

export class DigitalTwinEngine {
  /**
   * Updates a specific digital twin competency with a new observation.
   */
  public static updateCompetency(
    state: CandidateState,
    competencyId: string,
    observedScore: number,
    observedConfidence: number
  ): void {
    let twinComp = state.digitalTwin[competencyId];

    if (!twinComp) {
      // Lazy initialize if not present in default configuration
      const readableName = competencyId
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      twinComp = {
        id: competencyId,
        name: readableName,
        score: 50,
        confidence: 50,
        history: []
      };
      state.digitalTwin[competencyId] = twinComp;
    }

    const timestamp = new Date().toISOString();
    
    // Smooth transition from previous score (e.g., exponential moving average)
    const originalScore = twinComp.score;
    
    // Dynamic Adaptive Learning Rate:
    // To keep SHANA fair, encourage growth, and prevent early interview performance or outdated assumptions 
    // from biasing future coaching and evaluations, the engine detects consistent improvements and weights new evidence more heavily.
    let scoreWeight = 0.4; // Default learning rate (40% weight on new observed score)
    
    if (observedScore > originalScore) {
      // Candidate is showing active growth/improvement. Accelerate growth to shake off outdated assumptions.
      const growthGap = observedScore - originalScore;
      scoreWeight = Math.min(0.85, 0.4 + (growthGap / 100));
    }
    
    // Check history for a consistent trajectory of improvement
    if (twinComp.history && twinComp.history.length >= 2) {
      const historyScores = twinComp.history.map(h => h.score);
      const lastScore = historyScores[historyScores.length - 1];
      const prevScore = historyScores[historyScores.length - 2];
      
      if (observedScore > lastScore && lastScore >= prevScore) {
        // Consistent positive trajectory verified! Boost the weight of the latest evidence even further
        scoreWeight = Math.min(0.9, scoreWeight + 0.15);
      }
    }

    const newScore = Math.round((originalScore * (1 - scoreWeight)) + (observedScore * scoreWeight));

    // Dynamic confidence adjustment
    let confidenceWeight = 0.5;
    if (observedConfidence > twinComp.confidence) {
      const gap = observedConfidence - twinComp.confidence;
      confidenceWeight = Math.min(0.85, 0.5 + (gap / 100));
    }
    const newConfidence = Math.round((twinComp.confidence * (1 - confidenceWeight)) + (observedConfidence * confidenceWeight));

    twinComp.score = Math.max(0, Math.min(100, newScore));
    twinComp.confidence = Math.max(0, Math.min(100, newConfidence));
    twinComp.history.push({ timestamp, score: twinComp.score });

    // Keep history trimmed to avoid huge payloads
    if (twinComp.history.length > 20) {
      twinComp.history.shift();
    }
  }

  /**
   * Retrieves all digital twin competencies for mapping or visualization.
   */
  public static getTwinCompetencies(state: CandidateState): DigitalTwinCompetency[] {
    return Object.values(state.digitalTwin);
  }

  /**
   * Formulates a friendly breakdown of the Digital Twin profile.
   */
  public static getDigitalTwinStatus(state: CandidateState): string {
    const comps = Object.values(state.digitalTwin);
    const topComps = [...comps].sort((a, b) => b.score - a.score).slice(0, 2);
    const lowComps = [...comps].sort((a, b) => a.score - b.score).slice(0, 1);

    if (topComps.length > 0 && lowComps.length > 0) {
      return `Digital Twin active. Elite traits: ${topComps.map(c => c.name).join(', ')}. Target development area: ${lowComps[0].name}.`;
    }
    return 'Digital Twin calibrating initial behavioral features.';
  }
}
