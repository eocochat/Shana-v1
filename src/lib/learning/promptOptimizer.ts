export interface PromptVersion {
  version: string;
  templateName: string;
  instructionsEN: string;
  instructionsFR: string;
  metrics: {
    completionRate: number; // 0 to 100
    userSatisfaction: number; // 0 to 5
    evaluationQualityScore: number; // 0 to 100
    conversationDepth: number; // Avg turns per interview
  };
  isActive: boolean;
}

export class PromptOptimizer {
  private static promptRegistry: PromptVersion[] = [
    {
      version: 'v1.0.0',
      templateName: 'shana-standard-interviewer',
      instructionsEN: 'You are a strict, professional AI Job Interviewer. Ask exactly ONE clear interview question at a time. Do not compile lists. Dig deeper into previous answers.',
      instructionsFR: 'Vous êtes un recruteur professionnel strict par IA. Posez exactement UNE question à la fois. N\'accumulez pas les listes. Creusez les réponses précédentes.',
      metrics: {
        completionRate: 85.4,
        userSatisfaction: 4.1,
        evaluationQualityScore: 82.0,
        conversationDepth: 5.2
      },
      isActive: false
    },
    {
      version: 'v1.1.0',
      templateName: 'shana-standard-interviewer',
      isActive: true,
      instructionsEN: `You are a strict, professional AI Job Interviewer. 
- Ask exactly ONE clear interview question at a time.
- Probe specifically for STAR methodology metrics (Situation, Task, Action, Result).
- Ensure a natural dialog flow from intro to technical deep-dive, then wrap up.`,
      instructionsFR: `Vous êtes un recruteur professionnel strict par IA.
- Posez exactement UNE question claire à la fois.
- Enquérez-vous spécifiquement de la méthodologie STAR (Situation, Tâche, Action, Résultat).
- Assurez un déroulement naturel de l’introduction à la partie technique, puis concluez.`,
      metrics: {
        completionRate: 91.2,
        userSatisfaction: 4.4,
        evaluationQualityScore: 89.5,
        conversationDepth: 5.8
      }
    }
  ];

  /**
   * Retrieves the current active system prompt instructions
   */
  static getActivePrompt(language: string = 'English'): string {
    const active = this.promptRegistry.find(p => p.isActive);
    if (!active) {
      return 'You are a professional AI Job Interviewer.';
    }
    const isEng = language === 'English' || language === 'EN' || language === 'en';
    return isEng ? active.instructionsEN : active.instructionsFR;
  }

  /**
   * Optimize the prompt template dynamically by tweaking based on latest metrics.
   * Versioning and versioning history is tracked here.
   */
  static optimizePromptTemplate(newMetrics: Partial<PromptVersion['metrics']>): void {
    const active = this.promptRegistry.find(p => p.isActive);
    if (active) {
      active.metrics = {
        ...active.metrics,
        ...newMetrics
      };
      console.log(`[PROMPT OPTIMIZER] Updated prompt metrics for version ${active.version}`);
    }
  }

  /**
   * Rolls back the prompt to a previous version
   */
  static rollbackToVersion(targetVersion: string): boolean {
    const target = this.promptRegistry.find(p => p.version === targetVersion);
    if (!target) {
      return false;
    }

    this.promptRegistry.forEach(p => p.isActive = false);
    target.isActive = true;
    console.log(`[PROMPT OPTIMIZER] Rollback executed successfully. Active version is now ${targetVersion}.`);
    return true;
  }

  /**
   * Registers a brand-new experimental prompt template version
   */
  static registerNewVersion(newVer: PromptVersion): void {
    // Ensure uniqueness
    this.promptRegistry = this.promptRegistry.filter(p => p.version !== newVer.version);
    this.promptRegistry.push(newVer);
    console.log(`[PROMPT OPTIMIZER] New prompt version ${newVer.version} registered.`);
  }

  /**
   * Returns all registered prompt versions
   */
  static getAllVersions(): PromptVersion[] {
    return [...this.promptRegistry];
  }
}
