export interface ImprovementVector {
  userId: string;
  focusArea: string;
  previousAverageScore: number;
  currentAverageScore: number;
  deltaPercentage: number;
  isStatisticallySignificant: boolean;
  recommendationEN: string;
  recommendationFR: string;
}

export class ImprovementEngine {
  /**
   * Evaluates historical STAR and pacing trends to form a statistical improvement map
   */
  static analyzeImprovement(
    userId: string,
    history: number[],
    focusArea: string = 'STAR Formatting'
  ): ImprovementVector {
    if (history.length < 2) {
      return {
        userId,
        focusArea,
        previousAverageScore: 50,
        currentAverageScore: 50,
        deltaPercentage: 0,
        isStatisticallySignificant: false,
        recommendationEN: 'Continue practicing to gather more comparative interview data.',
        recommendationFR: 'Continuez à vous entraîner pour recueillir plus de données comparatives.'
      };
    }

    const midPoint = Math.floor(history.length / 2);
    const firstHalf = history.slice(0, midPoint);
    const secondHalf = history.slice(midPoint);

    const prevAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const currAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const delta = currAvg - prevAvg;
    const isSignificant = Math.abs(delta) >= 8;

    let recEN = '';
    let recFR = '';

    if (delta > 0) {
      recEN = `Keep doing what you are doing! Your structured delivery in ${focusArea} shows upward momentum.`;
      recFR = `Continuez ainsi ! Votre structure d’élocution dans le domaine (${focusArea}) montre une dynamique positive.`;
    } else if (delta < 0) {
      recEN = `Take a brief pause before speaking. Focus on structuring responses with clear situation context metrics first.`;
      recFR = `Faites une courte pause avant de parler. Concentrez-vous d’abord sur la structuration des réponses avec des données contextuelles claires.`;
    } else {
      recEN = 'Your response structure is stable. To push your score higher, inject more quantified business-impact metrics.';
      recFR = 'Votre structure de réponse est stable. Pour augmenter votre score, intégrez davantage d’indicateurs d’impact commercial chiffrés.';
    }

    return {
      userId,
      focusArea,
      previousAverageScore: Math.round(prevAvg),
      currentAverageScore: Math.round(currAvg),
      deltaPercentage: Math.round((delta / (prevAvg || 1)) * 100),
      isStatisticallySignificant: isSignificant,
      recommendationEN: recEN,
      recommendationFR: recFR
    };
  }
}
