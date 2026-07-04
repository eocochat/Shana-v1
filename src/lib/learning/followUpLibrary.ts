export interface FollowUpTemplate {
  id: string;
  triggerPhrase: string; // The phrase in the response that triggers this follow-up
  questionEN: string;
  questionFR: string;
  qualityScore: number; // 0 to 100, dynamic score based on outcomes
  usageCount: number;
  helpfulCount: number;
}

export class FollowUpLibrary {
  private static templates: FollowUpTemplate[] = [
    {
      id: 'f-cust-sat',
      triggerPhrase: 'customer satisfaction',
      questionEN: 'Could you explain exactly how you measured that increase in customer satisfaction, and what baseline metrics you started with?',
      questionFR: 'Pourriez-vous expliquer exactement comment vous avez mesuré cette augmentation de la satisfaction client, et avec quelles métriques de référence vous avez commencé ?',
      qualityScore: 94,
      usageCount: 82,
      helpfulCount: 78
    },
    {
      id: 'f-scalability',
      triggerPhrase: 'scalability',
      questionEN: 'When you redesigned for scalability, what specific load thresholds did you test, and where did the bottlenecks shift to?',
      questionFR: 'Lorsque vous avez repensé le système pour l\'évolutivité, quels seuils de charge spécifiques avez-vous testés, et vers où les goulots d\'étranglement se sont-ils déplacés ?',
      qualityScore: 92,
      usageCount: 65,
      helpfulCount: 60
    },
    {
      id: 'f-reduced-cost',
      triggerPhrase: 'reduced cost',
      questionEN: 'Can you break down the financial savings? Was it server optimization, third-party licenses, or structural workflow changes?',
      questionFR: 'Pouvez-vous détailler les économies financières ? S’agissait-il d’optimisation de serveurs, de licences tierces ou de changements de workflow structurels ?',
      qualityScore: 89,
      usageCount: 45,
      helpfulCount: 40
    },
    {
      id: 'f-team-conflict',
      triggerPhrase: 'disagreement',
      questionEN: 'How did you resolve that professional disagreement? Walk me through the exact compromise or consensus-building technique you utilized.',
      questionFR: 'Comment avez-vous résolu ce désaccord professionnel ? Expliquez-moi le compromis exact ou la technique de consensus que vous avez utilisée.',
      qualityScore: 87,
      usageCount: 38,
      helpfulCount: 33
    },
    {
      id: 'f-legacy-weak',
      triggerPhrase: 'legacy',
      questionEN: 'Was the legacy database old?',
      questionFR: 'La base de données était-elle ancienne ?',
      qualityScore: 32, // Weak question, candidate for retirement
      usageCount: 15,
      helpfulCount: 3
    }
  ];

  /**
   * Matches candidate response to best-suited follow-up template.
   */
  static matchFollowUp(candidateResponse: string): FollowUpTemplate | null {
    const textLower = candidateResponse.toLowerCase();
    
    // Sort templates by qualityScore descending to prioritize the strongest templates first
    const activeTemplates = this.templates
      .filter(t => t.qualityScore >= 40) // Retire templates below 40 score
      .sort((a, b) => b.qualityScore - a.qualityScore);

    for (const t of activeTemplates) {
      if (textLower.includes(t.triggerPhrase.toLowerCase())) {
        return t;
      }
    }
    return null;
  }

  /**
   * Updates quality metrics based on feedback / effectiveness
   */
  static recordFeedback(templateId: string, wasHelpful: boolean): void {
    const temp = this.templates.find(t => t.id === templateId);
    if (temp) {
      temp.usageCount += 1;
      if (wasHelpful) {
        temp.helpfulCount += 1;
      }
      
      // Recalculate dynamic quality score
      const ratio = (temp.helpfulCount / temp.usageCount) * 100;
      temp.qualityScore = Math.round((temp.qualityScore * 4 + ratio) / 5);
      
      console.log(`[FOLLOW-UP LIBRARY] Updated follow-up ${templateId} qualityScore: ${temp.qualityScore}%`);
    }
  }

  /**
   * Dynamically adds newly generated high-quality follow-ups
   */
  static addTemplate(newTemplate: Omit<FollowUpTemplate, 'id' | 'usageCount' | 'helpfulCount' | 'qualityScore'>): void {
    const id = `f-gen-${Date.now()}`;
    this.templates.push({
      ...newTemplate,
      id,
      qualityScore: 80, // initial benchmark score
      usageCount: 0,
      helpfulCount: 0
    });
  }

  /**
   * Returns complete list of templates
   */
  static getAllTemplates(): FollowUpTemplate[] {
    return [...this.templates];
  }
}
