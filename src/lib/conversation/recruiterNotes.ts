import { RecruiterNote, ContextMemoryState } from './conversationState';

export class RecruiterNotesManager {
  /**
   * Generates continuous professional recruiter notes for a specific conversation turn
   */
  static generateTurnNotes(
    text: string,
    turnNumber: number,
    starScore: number,
    fillerCount: number
  ): RecruiterNote[] {
    const notes: RecruiterNote[] = [];
    const lower = text.toLowerCase();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // First turn observation
    if (turnNumber === 1) {
      notes.push({
        category: 'observation',
        textEN: "Candidate initiated the conversation. Analyzing communication baseline and poise.",
        textFR: "Le candidat a entamé la discussion. Analyse de l'aisance initiale.",
        timestamp
      });
    }

    // STAR structure notes
    if (starScore >= 75) {
      notes.push({
        category: 'strength',
        textEN: "Demonstrates highly disciplined, logical structural execution (clean STAR format).",
        textFR: "Fait preuve d'une excellente structure de réponse (format STAR parfaitement respecté).",
        timestamp
      });
    } else if (text.length > 150 && starScore <= 25) {
      notes.push({
        category: 'weakness',
        textEN: "Answer lacks clear milestones (missing situation or outcome parameters). High structural noise.",
        textFR: "La réponse manque de jalons clairs (absence de mise en contexte ou de résultat concret).",
        timestamp
      });
    }

    // Quantitative metrics checklist
    const hasNumbers = /\b\d+(?:%|\s*percent|k|m|b)?\b/.test(lower) || lower.includes('pourcent') || lower.includes('million');
    if (text.length > 80 && !hasNumbers) {
      notes.push({
        category: 'weakness',
        textEN: "Recruiter Alert: Avoids sharing measurable results. The achievements are described too abstractly.",
        textFR: "Alerte Recruteur : Évite de partager des résultats chiffrés. Les réalisations sont trop abstraites.",
        timestamp
      });
    } else if (hasNumbers && text.length > 80) {
      notes.push({
        category: 'strength',
        textEN: "Successfully anchors achievements in precise, measurable engineering or business metrics.",
        textFR: "Ancre avec succès ses accomplissements dans des métriques précises et quantifiables.",
        timestamp
      });
    }

    // Leadership checks
    const leadershipWords = ['team', 'led', 'managed', 'delegate', 'coached', 'stakeholder', 'équipe', 'géré', 'dirigé', 'coordonné'];
    if (leadershipWords.some(w => lower.includes(w))) {
      notes.push({
        category: 'strength',
        textEN: "Conveys highly convincing ownership, collaborative leadership, or stakeholder empathy.",
        textFR: "Témoigne d'un leadership collaboratif convaincant et d'une bonne écoute des parties prenantes.",
        timestamp
      });
    }

    // Filler words checks
    if (fillerCount > 5) {
      notes.push({
        category: 'weakness',
        textEN: "Frequent vocal hesitation and filler words (noticeable verbal dilution). Needs more confidence.",
        textFR: "Hésitations vocales fréquentes et mots de remplissage. Manque de fluidité verbale.",
        timestamp
      });
    }

    // Technical depth checklist
    const techWords = ['architecture', 'scalability', 'consistency', 'refactor', 'bottleneck', 'trade-off', 'downtime', 'schema', 'compromis', 'cohérence', 'infrastructure'];
    if (techWords.some(w => lower.includes(w))) {
      notes.push({
        category: 'strength',
        textEN: "Displays deep, concrete professional insight into system trade-offs and architectural bottlenecks.",
        textFR: "Montre une excellente compréhension technique des compromis d'architecture et des goulots d'étranglement.",
        timestamp
      });
    }

    return notes;
  }
}
