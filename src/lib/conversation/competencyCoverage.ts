import { ConversationState, CompetencyStatus, EvidenceRecord } from './conversationState';

export class CompetencyCoverageEngine {
  private static KEY_COMPETencies = [
    "Leadership",
    "Communication",
    "Decision Making",
    "Technical",
    "Stress Resistance"
  ];

  /**
   * Evaluates the current evidence records against key required competencies
   */
  static evaluateCoverage(evidence: EvidenceRecord[]): CompetencyStatus[] {
    const statusMap = this.KEY_COMPETencies.map(comp => {
      const records = evidence.filter(r => r.competency === comp);
      const evidenceCount = records.length;
      
      // Determine sufficiency based on count & confidence
      const totalConfidence = records.reduce((sum, r) => sum + r.confidence, 0);
      const isSufficient = evidenceCount >= 1 && totalConfidence >= 0.75;

      return {
        competency: comp,
        evidenceCount,
        isSufficient
      };
    });

    return statusMap;
  }

  /**
   * Generates dynamic recruiter instructions/scenarios if a key competency is lacking
   */
  static getDirectivesForMissingCompetencies(status: CompetencyStatus[], language: string = 'English'): {
    instructionEN: string;
    instructionFR: string;
  } {
    const isEng = language === 'English' || language === 'EN' || language === 'en';
    
    // Find first insufficient competency
    const lacking = status.find(s => !s.isSufficient);
    if (!lacking) {
      return {
        instructionEN: "All core competencies have sufficient evidence. You can proceed with standard behavioral questions or conclude the interview.",
        instructionFR: "Toutes les compétences clés disposent de suffisamment de preuves. Vous pouvez poursuivre ou conclure l'entretien."
      };
    }

    let instructionEN = "";
    let instructionFR = "";

    switch (lacking.competency) {
      case "Leadership":
        instructionEN = "COMPETENCY GAP: Leadership. Challenge the candidate with a dynamic scenario where they had to align a team that disagreed with a strategic decision, or ask how they mentor others.";
        instructionFR = "MANQUE DE PREUVE : Leadership. Mettez au défi le candidat en lui demandant comment il a aligné une équipe en désaccord sur un choix stratégique, ou comment il accompagne la montée en compétences.";
        break;
      case "Decision Making":
        instructionEN = "COMPETENCY GAP: Decision Making. Introduce a conflict scenario: ask about a hard trade-off they had to make under tight deadlines where they didn't have all the data.";
        instructionFR = "MANQUE DE PREUVE : Prise de décision (Decision Making). Introduisez un scénario de choix difficile : demandez-lui d'expliquer un arbitrage complexe réalisé sous pression avec des données incomplètes.";
        break;
      case "Stress Resistance":
        instructionEN = "COMPETENCY GAP: Stress Resistance. Prompt the candidate on how they handle critical production outages, unexpected project delays, or high-pressure communication with demanding clients.";
        instructionFR = "MANQUE DE PREUVE : Résistance au stress. Interrogez le candidat sur sa gestion d'une crise de production, d'un retard projet imprévu, ou d'une communication difficile sous pression.";
        break;
      case "Technical":
        instructionEN = "COMPETENCY GAP: Technical competence. Pivot and ask the candidate to describe a highly complex piece of technical design, system integration, or codebase optimization they led.";
        instructionFR = "MANQUE DE PREUVE : Compétence technique. Pivotez et demandez au candidat de décrire une architecture complexe, une intégration de système ou une optimisation technique majeure.";
        break;
      case "Communication":
      default:
        instructionEN = "COMPETENCY GAP: Communication clarity. Ask them to explain a highly complex, technical concept as if they were explaining it to a non-technical stakeholder to verify adaptability.";
        instructionFR = "MANQUE DE PREUVE : Clarté de communication. Demandez-lui de vulgariser un sujet technique complexe pour un interlocuteur non technique afin d'évaluer sa clarté.";
        break;
    }

    return {
      instructionEN,
      instructionFR
    };
  }
}
