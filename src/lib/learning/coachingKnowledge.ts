export interface CoachingAdvice {
  id: string;
  category: 'STAR' | 'Pacing' | 'Language' | 'Confidence';
  adviceEN: string;
  adviceFR: string;
  observedImpactScore: number; // 0 to 100 representing user performance improvement
  popularityWeight: number; // Number of times successfully chosen
}

export class CoachingKnowledgeBase {
  private static adviceList: CoachingAdvice[] = [
    {
      id: 'coach-star-ex',
      category: 'STAR',
      adviceEN: 'Providing concrete, role-specific STAR examples rather than abstract rules.',
      adviceFR: 'Fournir des exemples STAR concrets et adaptés au poste plutôt que des règles abstraites.',
      observedImpactScore: 92,
      popularityWeight: 145
    },
    {
      id: 'coach-pos-reinforce',
      category: 'Confidence',
      adviceEN: 'Opening evaluations with high-contrast positive reinforcement of soft skills.',
      adviceFR: 'Commencer les évaluations par un renforcement positif marqué des compétences relationnelles.',
      observedImpactScore: 88,
      popularityWeight: 112
    },
    {
      id: 'coach-concise',
      category: 'Pacing',
      adviceEN: 'Suggesting micro-pauses (2-second silence before answering complex algorithmic steps).',
      adviceFR: 'Suggérer des micro-pauses (2 secondes de silence avant de répondre à des étapes algorithmiques complexes).',
      observedImpactScore: 84,
      popularityWeight: 98
    },
    {
      id: 'coach-anti-clutter',
      category: 'General' as any,
      adviceEN: 'Limiting total coaching points to 2 high-impact items to avoid cognitive overload.',
      adviceFR: 'Limiter le coaching à 2 points clés à fort impact pour éviter la surcharge cognitive.',
      observedImpactScore: 95,
      popularityWeight: 180
    }
  ];

  /**
   * Retrieves recommended advice ranked by impact score
   */
  static getRecommendedAdvice(category: CoachingAdvice['category']): CoachingAdvice[] {
    return this.adviceList
      .filter(a => a.category === category)
      .sort((a, b) => b.observedImpactScore - a.observedImpactScore);
  }

  /**
   * Records empirical user improvement metrics following advice delivery
   */
  static recordCoachingEffectiveness(adviceId: string, actualImprovementDelta: number): void {
    const advice = this.adviceList.find(a => a.id === adviceId);
    if (advice) {
      advice.popularityWeight += 1;
      // Calculate weighted running average of impact score
      const newImpact = Math.min(
        100,
        Math.max(0, Math.round((advice.observedImpactScore * 9 + actualImprovementDelta) / 10))
      );
      advice.observedImpactScore = newImpact;
    }
  }

  /**
   * Dynamically appends newly drafted tips from the coaching engine
   */
  static learnNewAdvice(newAdvice: Omit<CoachingAdvice, 'id' | 'observedImpactScore' | 'popularityWeight'>): void {
    const id = `coach-learned-${Date.now()}`;
    this.adviceList.push({
      ...newAdvice,
      id,
      observedImpactScore: 75, // initial conservative score
      popularityWeight: 1
    });
  }

  /**
   * Returns all coaching knowledge list items
   */
  static getAllAdvice(): CoachingAdvice[] {
    return [...this.adviceList];
  }
}
