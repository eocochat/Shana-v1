export interface DifficultyReport {
  industry: string;
  averageStarScore: number;
  averageUserConfidence: number;
  unbalancedFlowRatio: number; // Ratio of extreme changes in performance
  currentDifficultySetting: 'Easy' | 'Mid' | 'Hard';
  recommendation: 'Increase Difficulty' | 'Maintain' | 'Decrease Difficulty';
  suggestedDirectivesEN: string[];
  suggestedDirectivesFR: string[];
  isApprovedByAdmin: boolean;
}

export class DifficultyCalibration {
  private static reports: DifficultyReport[] = [
    {
      industry: 'Finance',
      averageStarScore: 78.5,
      averageUserConfidence: 85.0,
      unbalancedFlowRatio: 0.12,
      currentDifficultySetting: 'Mid',
      recommendation: 'Increase Difficulty',
      suggestedDirectivesEN: [
        'Push harder follow-ups concerning risk management matrices.',
        'Challenge candidates directly on regulatory compliance parameters.'
      ],
      suggestedDirectivesFR: [
        'Proposez des relances plus rudes concernant les matrices de gestion des risques.',
        'Défiez directement les candidats sur les paramètres de conformité réglementaire.'
      ],
      isApprovedByAdmin: false // Needs Feature Flag / admin approval
    },
    {
      industry: 'Technology',
      averageStarScore: 45.2,
      averageUserConfidence: 41.5,
      unbalancedFlowRatio: 0.35,
      currentDifficultySetting: 'Hard',
      recommendation: 'Decrease Difficulty',
      suggestedDirectivesEN: [
        'Offer slightly simpler technical scaling context questions.',
        'Sequence architectural puzzles with introductory warmup questions first.'
      ],
      suggestedDirectivesFR: [
        'Proposez des questions de mise à l\'échelle technique légèrement plus simples.',
        'Séquencez les énigmes architecturales en commençant par des questions d\'introduction.'
      ],
      isApprovedByAdmin: false
    }
  ];

  /**
   * Evaluates the active stats of a completed session and creates or updates a difficulty calibration report
   */
  static evaluateDifficultyNeeds(
    industry: string,
    starScores: number[],
    confidenceScores: number[]
  ): DifficultyReport {
    const avgStar = starScores.length > 0 ? starScores.reduce((a, b) => a + b, 0) / starScores.length : 60;
    const avgConfidence = confidenceScores.length > 0 ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length : 60;

    let rec: 'Increase Difficulty' | 'Maintain' | 'Decrease Difficulty' = 'Maintain';
    const suggestedEN: string[] = [];
    const suggestedFR: string[] = [];

    if (avgStar > 85 && avgConfidence > 80) {
      rec = 'Increase Difficulty';
      suggestedEN.push('Inject stricter STAR verification constraints on quantitative metric timelines.');
      suggestedFR.push('Injectez des contraintes de vérification STAR plus strictes sur les délais des métriques.');
    } else if (avgStar < 50 && avgConfidence < 45) {
      rec = 'Decrease Difficulty';
      suggestedEN.push('Transition to supportive, clarifying follow-ups with concrete hints.');
      suggestedFR.push('Passez à des relances de soutien avec des indices concrets pour guider le candidat.');
    } else {
      suggestedEN.push('Maintain balanced sequencing directives.');
      suggestedFR.push('Maintenez des directives d\'enchaînement équilibrées.');
    }

    const report: DifficultyReport = {
      industry,
      averageStarScore: Math.round(avgStar),
      averageUserConfidence: Math.round(avgConfidence),
      unbalancedFlowRatio: avgStar < 40 ? 0.3 : 0.1,
      currentDifficultySetting: avgStar > 75 ? 'Easy' : (avgStar < 45 ? 'Hard' : 'Mid'),
      recommendation: rec,
      suggestedDirectivesEN: suggestedEN,
      suggestedDirectivesFR: suggestedFR,
      isApprovedByAdmin: false // Kept safe under admin review flag
    };

    // Update or insert report
    const idx = this.reports.findIndex(r => r.industry === industry);
    if (idx >= 0) {
      // Preserve approval flag if existing
      report.isApprovedByAdmin = this.reports[idx].isApprovedByAdmin;
      this.reports[idx] = report;
    } else {
      this.reports.push(report);
    }

    return report;
  }

  /**
   * Admin-approved Feature Flag toggling to implement the suggested harder/easier directives safely
   */
  static approveCalibration(industry: string): boolean {
    const report = this.reports.find(r => r.industry === industry);
    if (report) {
      report.isApprovedByAdmin = true;
      console.log(`[DIFFICULTY CALIBRATION] Difficulty calibrated adjustments approved for industry: ${industry}`);
      return true;
    }
    return false;
  }

  /**
   * Retrieves active, approved difficulty directives to feed into response planner
   */
  static getApprovedDirectives(industry: string, language: string = 'English'): string[] {
    const report = this.reports.find(r => r.industry === industry && r.isApprovedByAdmin);
    if (!report) return [];
    
    const isEng = language === 'English' || language === 'EN' || language === 'en';
    return isEng ? report.suggestedDirectivesEN : report.suggestedDirectivesFR;
  }

  /**
   * Returns all calibration reports
   */
  static getAllReports(): DifficultyReport[] {
    return [...this.reports];
  }
}
