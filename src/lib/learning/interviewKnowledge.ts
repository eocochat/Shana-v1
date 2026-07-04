export interface GlobalKnowledgeInsight {
  id: string;
  category: 'technical' | 'behavioral' | 'general' | 'role-specific';
  role: string;
  insightEN: string;
  insightFR: string;
  successCorellationScore: number; // 0 to 100
  observedCount: number;
}

export class InterviewKnowledgeBase {
  private static insights: GlobalKnowledgeInsight[] = [
    {
      id: 'swe-tradeoffs',
      category: 'technical',
      role: 'Software Engineer',
      insightEN: 'Software Engineers frequently succeed when explaining architectural trade-offs explicitly.',
      insightFR: 'Les ingénieurs logiciels réussissent fréquemment lorsqu’ils expliquent explicitement les compromis d’architecture.',
      successCorellationScore: 88,
      observedCount: 154
    },
    {
      id: 'recruiter-leadership',
      category: 'behavioral',
      role: 'All Roles',
      insightEN: 'Recruiters most frequently trigger investigative follow-up questions after deep-dive leadership examples.',
      insightFR: 'Les recruteurs déclenchent le plus fréquemment des questions d’approfondissement après des exemples de leadership détaillés.',
      successCorellationScore: 92,
      observedCount: 210
    },
    {
      id: 'quantified-metrics',
      category: 'general',
      role: 'All Roles',
      insightEN: 'Candidates who provide quantified achievements score 35% higher on STAR structure correctness metrics.',
      insightFR: 'Les candidats qui fournissent des réalisations chiffrées obtiennent un score 35% plus élevé sur les indicateurs STAR.',
      successCorellationScore: 95,
      observedCount: 420
    },
    {
      id: 'behavioral-length',
      category: 'behavioral',
      role: 'Product Manager',
      insightEN: 'Product management interviews with 4–6 follow-up turns yield the most complete assessment maps.',
      insightFR: 'Les entretiens de gestion de produit comprenant 4 à 6 relances produisent les cartographies d’évaluation les plus complètes.',
      successCorellationScore: 84,
      observedCount: 180
    }
  ];

  /**
   * Retrieves anonymized insights relevant to a particular candidate role
   */
  static getInsightsForRole(role: string): GlobalKnowledgeInsight[] {
    const matched = this.insights.filter(ins => 
      ins.role.toLowerCase() === 'all roles' || 
      role.toLowerCase().includes(ins.role.toLowerCase()) ||
      ins.role.toLowerCase().includes(role.toLowerCase())
    );
    return matched.sort((a, b) => b.successCorellationScore - a.successCorellationScore);
  }

  /**
   * Safe registration of aggregated global learning stats. No personal details.
   */
  static recordAggregatedInsight(insight: Omit<GlobalKnowledgeInsight, 'id'>): void {
    const existing = this.insights.find(i => i.insightEN === insight.insightEN);
    if (existing) {
      existing.observedCount += 1;
      // Recalculate average correlation score dynamically
      existing.successCorellationScore = Math.min(
        100,
        Math.round((existing.successCorellationScore * 9 + insight.successCorellationScore) / 10)
      );
    } else {
      const newId = `insight_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      this.insights.push({
        ...insight,
        id: newId
      });
    }
  }

  /**
   * Returns all anonymous global knowledge records for admin tools
   */
  static getAllInsights(): GlobalKnowledgeInsight[] {
    return [...this.insights];
  }
}
