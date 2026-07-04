export interface RecruiterCompanyProfile {
  companyId: string;
  name: string;
  competencies: string[];
  styleDirectivesEN: string[];
  styleDirectivesFR: string[];
  observedWeight: number; // Popularity ranking based on mock/simulated interview count
}

export class RecruiterKnowledgeBase {
  private static companyProfiles: Record<string, RecruiterCompanyProfile> = {
    amazon: {
      companyId: 'amazon',
      name: 'Amazon',
      competencies: ['Ownership', 'Dive Deep', 'Customer Obsession', 'Bias for Action', 'Deliver Results'],
      styleDirectivesEN: [
        'Insist heavily on the candidate explaining specific personal responsibility ("What did YOU do, not the team?").',
        'Inquire about deep technical specifics and ask for raw numbers or metrics.',
        'Adopt a highly professional, metric-driven, and highly analytical posture.'
      ],
      styleDirectivesFR: [
        'Insistez fortement sur la responsabilité personnelle du candidat ("Qu\'avez-vous fait VOUS, pas l\'équipe ?").',
        'Posez des questions sur des détails techniques profonds et demandez des chiffres précis.',
        'Adoptez une posture hautement professionnelle, axée sur les indicateurs.'
      ],
      observedWeight: 95
    },
    google: {
      companyId: 'google',
      name: 'Google',
      competencies: ['Problem Solving', 'Googliness', 'Leadership', 'Collaboration', 'Ambiguity Resilience'],
      styleDirectivesEN: [
        'Challenge candidates with highly open-ended architectural and problem-solving puzzles.',
        'Inquire about collaboration under pressure and managing team diversity.',
        'Maintain a collaborative, intellectual, yet highly rigorous tone.'
      ],
      styleDirectivesFR: [
        'Défiez les candidats avec des énigmes d’architecture et de résolution de problèmes très ouvertes.',
        'Posez des questions sur la collaboration sous pression et la gestion de la diversité des équipes.',
        'Maintenez un ton collaboratif, intellectuel mais rigoureux.'
      ],
      observedWeight: 92
    },
    microsoft: {
      companyId: 'microsoft',
      name: 'Microsoft',
      competencies: ['Growth Mindset', 'Customer Focus', 'Cross-functional Collaboration', 'Drive for Results'],
      styleDirectivesEN: [
        'Inquire about how the candidate handled an engineering failure or feedback.',
        'Focus on empathy and how products resolve end-user problems.',
        'Value long-term technical quality and collaboration across remote boundaries.'
      ],
      styleDirectivesFR: [
        'Demandez comment le candidat a géré un échec d\'ingénierie ou un retour critique.',
        'Concentrez-vous sur l\'empathie et la façon dont les produits résolvent les problèmes des utilisateurs finaux.',
        'Valorisez la qualité technique à long terme et la collaboration à distance.'
      ],
      observedWeight: 84
    },
    meta: {
      companyId: 'meta',
      name: 'Meta',
      competencies: ['Impact', 'Move Fast', 'Be Bold', 'Ownership', 'Build Awesome Things'],
      styleDirectivesEN: [
        'Inquire about speed, rapid feature iteration, and pushing code quickly under deadlines.',
        'Focus heavily on direct user impact and business-level scale.',
        'Adopt a fast-paced, highly direct, and result-oriented conversational tone.'
      ],
      styleDirectivesFR: [
        'Posez des questions sur la rapidité, l\'itération rapide des fonctionnalités et le déploiement sous délais serrés.',
        'Concentrez-vous fortement sur l\'impact direct sur l\'utilisateur et l\'échelle de l\'entreprise.',
        'Adoptez un ton conversationnel rapide, direct et orienté vers les résultats.'
      ],
      observedWeight: 89
    }
  };

  /**
   * Retrieves profile for a specific company or returns a generic standard profile
   */
  static getProfile(companyName: string): RecruiterCompanyProfile {
    const key = companyName.toLowerCase();
    if (this.companyProfiles[key]) {
      return this.companyProfiles[key];
    }

    // Try finding by partial match
    for (const [k, prof] of Object.entries(this.companyProfiles)) {
      if (key.includes(k) || k.includes(key)) {
        return prof;
      }
    }

    // Generic fallback standard company profile
    return {
      companyId: 'generic',
      name: companyName || 'Standard Corporate',
      competencies: ['Professionalism', 'Technical Competence', 'Clarity', 'Collaboration'],
      styleDirectivesEN: [
        'Maintain a balanced, objective, and realistic job interview structure.',
        'Seek clear definitions of goals, methods, and outcomes.'
      ],
      styleDirectivesFR: [
        'Maintenez une structure d\'entretien d\'embauche équilibrée, objective et réaliste.',
        'Recherchez des définitions claires des objectifs, des méthodes et des résultats.'
      ],
      observedWeight: 50
    };
  }

  /**
   * Safe updates company weights based on popularity
   */
  static incrementWeight(companyName: string): void {
    const key = companyName.toLowerCase();
    if (this.companyProfiles[key]) {
      this.companyProfiles[key].observedWeight += 1;
    }
  }

  /**
   * Returns list of all known company profiles
   */
  static getAllProfiles(): RecruiterCompanyProfile[] {
    return Object.values(this.companyProfiles);
  }
}
