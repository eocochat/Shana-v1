export interface MinedPattern {
  id: string;
  patternType: 'mistake' | 'strength' | 'recruiter_reaction' | 'coaching_effectiveness';
  descriptionEN: string;
  descriptionFR: string;
  frequencyPercentage: number;
  confidenceInterval: number; // 0 to 1
}

export class PatternMiner {
  private static minedPatterns: MinedPattern[] = [
    {
      id: 'pat-circular',
      patternType: 'mistake',
      descriptionEN: 'Circular reasoning when explaining architectural blockages without citing technical resolutions.',
      descriptionFR: 'Raisonnement circulaire lors de l’explication des blocages d’architecture sans citer de résolutions techniques.',
      frequencyPercentage: 24.5,
      confidenceInterval: 0.92
    },
    {
      id: 'pat-pacing-drop',
      patternType: 'mistake',
      descriptionEN: 'Sudden pacing drops (WPM decreasing below 70) during structural STAR behavioral challenges.',
      descriptionFR: 'Baisse soudaine du rythme (WPM inférieur à 70) lors de questions comportementales STAR.',
      frequencyPercentage: 18.2,
      confidenceInterval: 0.88
    },
    {
      id: 'pat-quantifiable-star',
      patternType: 'strength',
      descriptionEN: 'Explicitly mentioning percentages or dollar figures leads to a 42% higher completion rating.',
      descriptionFR: 'Le fait de mentionner explicitement des pourcentages ou des montants augmente le taux de réussite de 42%.',
      frequencyPercentage: 38.9,
      confidenceInterval: 0.95
    },
    {
      id: 'pat-reactive-followup',
      patternType: 'recruiter_reaction',
      descriptionEN: 'Follow-ups asking for quantitative validation of leadership scopes are triggered in 70% of senior roles.',
      descriptionFR: 'Des questions de relance demandant une validation chiffrée du leadership sont déclenchées dans 70% des postes seniors.',
      frequencyPercentage: 70.1,
      confidenceInterval: 0.91
    }
  ];

  /**
   * Processes an anonymous transcript turn or session metrics and extracts pattern indications
   */
  static mineSessionState(
    userInput: string,
    starScore: number,
    wpm: number
  ): Omit<MinedPattern, 'id' | 'frequencyPercentage' | 'confidenceInterval'>[] {
    const extracted: Omit<MinedPattern, 'id' | 'frequencyPercentage' | 'confidenceInterval'>[] = [];

    if (wpm < 70 && wpm > 0) {
      extracted.push({
        patternType: 'mistake',
        descriptionEN: 'Spoken tempo dropped significantly below conversational speeds during technical explanations.',
        descriptionFR: 'Le rythme d’élocution a chuté de manière significative sous les vitesses conversationnelles lors des explications.'
      });
    }

    if (starScore > 85) {
      extracted.push({
        patternType: 'strength',
        descriptionEN: 'Excellent structural clarity matching all core parameters of the STAR framework.',
        descriptionFR: 'Excellente clarté structurelle répondant à tous les paramètres de la méthode STAR.'
      });
    }

    // Heuristically look for metrics
    const containsNumber = /\b\d+(?:%|\s*percent|\s*k|\s*m|\s*million)?\b/i.test(userInput);
    if (containsNumber && starScore > 60) {
      extracted.push({
        patternType: 'strength',
        descriptionEN: 'Successful integration of quantitative metrics with contextual project achievements.',
        descriptionFR: 'Intégration réussie de données chiffrées avec des réalisations de projets contextuels.'
      });
    }

    return extracted;
  }

  /**
   * Return all mined global patterns
   */
  static getMinedPatterns(): MinedPattern[] {
    return [...this.minedPatterns];
  }

  /**
   * Appends a new mined pattern to the local statistical storage
   */
  static registerPattern(pattern: MinedPattern): void {
    const existing = this.minedPatterns.find(p => p.id === pattern.id);
    if (existing) {
      existing.frequencyPercentage = parseFloat(((existing.frequencyPercentage * 4 + pattern.frequencyPercentage) / 5).toFixed(2));
    } else {
      this.minedPatterns.push(pattern);
    }
  }
}
