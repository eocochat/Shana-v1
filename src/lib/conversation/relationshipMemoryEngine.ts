import { ConversationState } from './conversationState';

export interface MemoryPrefs {
  enabled: boolean;
  viewedMemoriesCount: number;
}

export interface MultimodalMemoryMock {
  voiceEvolution: string;
  facialConfidence: string;
  eyeContact: string;
  posture: string;
  speakingRhythm: string;
}

export interface RelationshipAnalytics {
  averageUserRetentionRate: number;
  interviewProgressionRate: number;
  memoryUtilizationRate: number;
  coachingContinuityScore: number;
  candidateGrowthAverage: number;
  longTermConfidenceEvolution: number[];
  relationshipEngagementIndex: number;
  returningUserPerformanceBoost: number;
  mentorshipDurationDays: number;
}

export class RelationshipMemoryEngine {
  /**
   * Retrieves or initializes privacy preferences for Relationship Memory
   */
  static getPrefs(userId: string): MemoryPrefs {
    const defaultPrefs: MemoryPrefs = { enabled: true, viewedMemoriesCount: 0 };
    if (typeof window === 'undefined') return defaultPrefs;
    try {
      const saved = localStorage.getItem(`shana_relationship_memory_prefs_${userId}`);
      return saved ? JSON.parse(saved) : defaultPrefs;
    } catch {
      return defaultPrefs;
    }
  }

  /**
   * Saves privacy preferences for Relationship Memory
   */
  static savePrefs(userId: string, prefs: MemoryPrefs): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`shana_relationship_memory_prefs_${userId}`, JSON.stringify(prefs));
    } catch (e) {
      console.error("Failed to save memory prefs:", e);
    }
  }

  /**
   * Verifies and generates structured validated relationship memories from history
   */
  static extractRelationshipMemories(userId: string, history: any[], profile: any): {
    careerMem: string[];
    communicationMem: string[];
    behavioralMem: string[];
    technicalMem: string[];
    learningMem: string[];
    growthCurve: { session: string; score: number }[];
  } {
    const careerMem: string[] = [];
    const communicationMem: string[] = [];
    const behavioralMem: string[] = [];
    const technicalMem: string[] = [];
    const learningMem: string[] = [];
    const growthCurve: { session: string; score: number }[] = [];

    // Profile career properties
    if (profile) {
      if (profile.targetRole) careerMem.push(`Target Position: ${profile.targetRole}`);
      if (profile.industry) careerMem.push(`Target Industry: ${profile.industry}`);
      if (profile.experienceYears) careerMem.push(`Years of Experience: ${profile.experienceYears}`);
    }

    if (!history || history.length === 0) {
      return { careerMem, communicationMem, behavioralMem, technicalMem, learningMem, growthCurve };
    }

    const validHistory = [...history].reverse(); // oldest first to build a timeline

    validHistory.forEach((session, idx) => {
      const sessionLabel = session.date || `Session ${idx + 1}`;
      const score = session.score || 70;
      growthCurve.push({ session: sessionLabel, score });

      // Learning Memory — Tracking what coaching has been provided
      if (session.recommendation) {
        learningMem.push(`Coached on ${sessionLabel}: "${session.recommendation}"`);
      }

      // Technical Memory
      if (session.weakness) {
        technicalMem.push(`Identified area for growth on ${sessionLabel}: "${session.weakness}"`);
      }

      // Strengths & Behavioral Memory
      if (session.strengths && Array.isArray(session.strengths)) {
        session.strengths.forEach((str: string) => {
          if (str.toLowerCase().includes('lead') || str.toLowerCase().includes('manage') || str.toLowerCase().includes('team') || str.toLowerCase().includes('posture')) {
            behavioralMem.push(`Validated capability: "${str}" (${sessionLabel})`);
          } else {
            communicationMem.push(`Validated communication asset: "${str}" (${sessionLabel})`);
          }
        });
      }
    });

    return {
      careerMem: Array.from(new Set(careerMem)),
      communicationMem: Array.from(new Set(communicationMem)).slice(-5),
      behavioralMem: Array.from(new Set(behavioralMem)).slice(-5),
      technicalMem: Array.from(new Set(technicalMem)).slice(-5),
      learningMem: Array.from(new Set(learningMem)).slice(-5),
      growthCurve
    };
  }

  /**
   * Smartly retrieves relevant memories depending on the current competency / topic
   */
  static retrieveContextualMemory(
    history: any[],
    profile: any,
    expectedCompetency: string,
    isFR: boolean = false
  ): string {
    if (!history || history.length === 0) return '';

    const { careerMem, communicationMem, behavioralMem, technicalMem, learningMem } = 
      this.extractRelationshipMemories('user', history, profile);

    let output = isFR 
      ? "\n====================================================\nMÉMOIRE DE RELATION ET SUIVI DE PROGRÈS :\n====================================================\n" 
      : "\n====================================================\nLONG-TERM RELATIONSHIP & PROGRESS MEMORY:\n====================================================\n";

    // 1. Initial Greeting / Continuity context (First turn)
    const prevCount = history.length;
    if (prevCount > 0) {
      output += isFR
        ? `- C'est le retour du candidat pour sa ${prevCount + 1}ème session. Accueillez-le chaleureusement en mentionnant qu'il est agréable de le revoir pour poursuivre son parcours professionnel.\n`
        : `- This is the candidate returning for their session #${prevCount + 1}. Greet them warmly and indicate it's great to see them again to continue their professional journey.\n`;
    }

    // 2. Filter / retrieve memory based on competency
    const comp = expectedCompetency.toLowerCase();
    if (comp.includes('lead') || comp.includes('behavioral') || comp.includes('people')) {
      if (behavioralMem.length > 0) {
        output += isFR
          ? `[HISTORIQUE COMPORTEMENTAL ET DE LEADERSHIP TOURS PRÉCÉDENTS] :\n${behavioralMem.map(m => `  * ${m}`).join('\n')}\n`
          : `[HISTORIC BEHAVIORAL & LEADERSHIP VALIDATED MEMORIES]:\n${behavioralMem.map(m => `  * ${m}`).join('\n')}\n`;
      }
    } else if (comp.includes('tech') || comp.includes('system') || comp.includes('skill')) {
      if (technicalMem.length > 0) {
        output += isFR
          ? `[HISTORIQUE TECHNIQUE ET POINTS D'AMÉLIORATION TOURS PRÉCÉDENTS] :\n${technicalMem.map(m => `  * ${m}`).join('\n')}\n`
          : `[HISTORIC TECHNICAL EXPERTISE & CHALLENGE AREAS]:\n${technicalMem.map(m => `  * ${m}`).join('\n')}\n`;
      }
    } else {
      // General communication and progress trend
      if (communicationMem.length > 0) {
        output += isFR
          ? `[SOUVENIRS SUR LA QUALITÉ DE L'EXPRESSION ET DE LA COMMUNICATION] :\n${communicationMem.map(m => `  * ${m}`).join('\n')}\n`
          : `[HISTORIC COMMUNICATION & PACING OBSERVATIONS]:\n${communicationMem.map(m => `  * ${m}`).join('\n')}\n`;
      }
    }

    // 3. Learning / Coaching alignment
    if (learningMem.length > 0) {
      output += isFR
        ? `[HISTORIQUE DU COACHING DISPENSÉ - NE PAS RÉPÉTER DIRECTEMENT LES MÊMES CONSEILS] :\n${learningMem.map(m => `  * ${m}`).join('\n')}\n`
        : `[PREVIOUS COACHING RECEIVED - BUILD ON TOP OF THESE; DO NOT REPEAT IDENTICAL ADVICE]:\n${learningMem.map(m => `  * ${m}`).join('\n')}\n`;
    }

    // 4. Progress comparison metrics
    if (history.length >= 2) {
      const latestScore = history[0].score || 70;
      const initialScore = history[history.length - 1].score || 60;
      const progressDiff = latestScore - initialScore;

      if (progressDiff > 0) {
        output += isFR
          ? `\nDIRECTIVE RELATIONNELLE : Le candidat a progressé de +${progressDiff} points depuis sa première évaluation. Soulignez positivement sa progression globale et célébrez son évolution plutôt que des notes brutes.\n`
          : `\nRELATIONSHIP DIRECTIVE: The candidate has improved by +${progressDiff} points since their very first evaluation. Positively highlight their overall growth curve and celebrate improvements rather than raw scores.\n`;
      } else {
        output += isFR
          ? `\nDIRECTIVE RELATIONNELLE : Rappelez au candidat le chemin parcouru et restez extrêmement encourageant pour stabiliser sa confiance.\n`
          : `\nRELATIONSHIP DIRECTIVE: Remind the candidate of how invested we are in their journey. Keep encouragement extremely high to stabilize their confidence.\n`;
      }
    }

    output += isFR
      ? `\nCONSIGNE DU MOTEUR D'EMPATHIE RELATIONNELLE : Référencez de manière fluide et naturelle (sans excès) ces éléments passés (ex : "La dernière fois, nous avions parlé de...", "Je remarque une belle progression sur...") pour forger une relation de confiance de mentor à mentoré.`
      : `\nRELATIONSHIP MEMORY DIRECTIVE: Seamlessly and naturally (never excessively) weave in these past elements (e.g., "I remember last time we discussed...", "You have noticeably improved in...") to cultivate a continuous mentor-to-mentee relationship.`;

    return output;
  }

  /**
   * Return mock relationship analytics for the admin dashboard
   */
  static getAdminAnalytics(): RelationshipAnalytics {
    return {
      averageUserRetentionRate: 94.6,
      interviewProgressionRate: 82.3,
      memoryUtilizationRate: 89.1,
      coachingContinuityScore: 91.5,
      candidateGrowthAverage: 14.8,
      longTermConfidenceEvolution: [62, 68, 71, 75, 78, 83, 89],
      relationshipEngagementIndex: 96.2,
      returningUserPerformanceBoost: 18.4,
      mentorshipDurationDays: 145
    };
  }

  /**
   * Helper mock for future multimodal features
   */
  static getMultimodalMemoryMock(isFR: boolean = false): MultimodalMemoryMock {
    return {
      voiceEvolution: isFR 
        ? "Réduction du rythme de parole de 155 à 128 mots/minute. Meilleure gestion des pauses respiratoires."
        : "Speaking pace reduced from 155 to 128 WPM. Significant breathing pause control observed.",
      facialConfidence: isFR
        ? "Sourires d'introduction validés, réduction du micro-stress labial sous pression de 40%."
        : "Greeting smiles validated, reduction of lip micro-tension under pressure by 40%.",
      eyeContact: isFR
        ? "Maintien du regard caméra stable à 82% lors des réponses argumentées (cible: >75%)."
        : "Maintained steady on-camera focus at 82% during STAR narrative delivery (target: >75%).",
      posture: isFR
        ? "Posture professionnelle stabilisée. Réduction des mouvements latéraux parasites de l'épaule."
        : "Professional posture stabilized. Reduced lateral shoulder shifting by 50%.",
      speakingRhythm: isFR
        ? "Transitions conversationnelles fluides. Disparition progressive des tics d'hésitation vocaux."
        : "Fluid turn-taking cues. Near total disappearance of repetitive vocal fillers."
    };
  }
}
