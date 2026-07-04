import { SessionHistoryItem } from '../../types';

export interface NextRecommendedStep {
  id: string;
  actionTitle: string;
  actionDescription: string;
  badge: string;
  targetTab: 'train' | 'assessment' | 'history' | 'profile';
  targetPracticeId?: string;
  buttonLabel: string;
}

class RecommendationEngine {
  public getRecommendations(session: SessionHistoryItem, isFR: boolean): NextRecommendedStep[] {
    const scores = {
      resume: session.resumeScore || 100,
      industry: session.industryScore || 100,
      communication: session.communicationScore || 100,
      confidence: session.confidenceScore || 100,
      adaptability: session.adaptabilityScore || 100,
      behavioral: session.behavioralScore || 100
    };

    // Find the lowest score
    let lowestKey = 'resume';
    let lowestVal = 100;
    for (const [key, val] of Object.entries(scores)) {
      if (val < lowestVal) {
        lowestVal = val;
        lowestKey = key;
      }
    }

    const recs: NextRecommendedStep[] = [];

    // Primary Recommendation based on lowest score
    if (lowestKey === 'communication' || lowestKey === 'confidence') {
      recs.push({
        id: 'rec_comm',
        actionTitle: isFR ? "Entraînement Séquençage Vocal" : "Vocal Pacing Training",
        actionDescription: isFR 
          ? "Travaillez votre rythme verbal sous minuteur serré pour éliminer définitivement les tics de langage."
          : "Work on verbal pacing and gaze retention under strict clock settings to build ultimate composure.",
        badge: "🎤",
        targetTab: 'train',
        targetPracticeId: 'prac_communication',
        buttonLabel: isFR ? "Démarrer l'entraînement élocution" : "Start Pacing Session"
      });
    } else if (lowestKey === 'behavioral' || lowestKey === 'resume') {
      recs.push({
        id: 'rec_star',
        actionTitle: isFR ? "Rigueur de la Méthode STAR" : "STAR Structure & Metrics",
        actionDescription: isFR
          ? "Apprenez à ancrer tous vos récits professionnels avec des métriques d'impact et des leçons d'apprentissage."
          : "Enforce rigid STAR guidelines, with a specialized focus on structuring solid quantitative results and KPIs.",
        badge: "📊",
        targetTab: 'train',
        targetPracticeId: 'prac_behavioral',
        buttonLabel: isFR ? "Maîtriser la méthode STAR" : "Practice STAR Method"
      });
    } else if (lowestKey === 'industry' || lowestKey === 'adaptability') {
      recs.push({
        id: 'rec_tech',
        actionTitle: isFR ? "Maîtrise des Questions Pièges Techniques" : "Technical Deep Dive & Triage",
        actionDescription: isFR
          ? "Affinez vos choix de conception de système et défendez vos arbitrages face aux experts."
          : "Master technical trade-off decisions, architectural scaling justifications, and failure triage under pressure.",
        badge: "⚙️",
        targetTab: 'train',
        targetPracticeId: 'prac_technical',
        buttonLabel: isFR ? "Lancer la session technique" : "Start Technical Session"
      });
    } else {
      recs.push({
        id: 'rec_lead',
        actionTitle: isFR ? "Leadership de Crise" : "Executive Crisis Leadership",
        actionDescription: isFR
          ? "Défendez vos décisions sous haute contrainte et justifiez vos plans face à des comités hostiles."
          : "Defend high-stakes decisions and guide team workflows through complex organizational conflict.",
        badge: "👑",
        targetTab: 'train',
        targetPracticeId: 'prac_leadership',
        buttonLabel: isFR ? "Pratiquer le Leadership" : "Practice Leadership"
      });
    }

    // Secondary Recommendations (Next natural steps in hiring journey)
    recs.push({
      id: 'rec_salary',
      actionTitle: isFR ? "Simulateur IA de Négociation de Rémunération" : "High-Stakes Salary Negotiator",
      actionDescription: isFR
        ? "Apprenez à formuler vos contre-propositions et défendez votre valeur marchande avec calme."
        : "Navigate tricky compensation questions, frame counter-offers, and maintain strategic leverage.",
      badge: "💰",
      targetTab: 'train',
      targetPracticeId: 'prac_salary',
      buttonLabel: isFR ? "S'entraîner à la négociation" : "Practice Negotiation"
    });

    recs.push({
      id: 'rec_full_assess',
      actionTitle: isFR ? "Évaluation Globale Standard" : "Standard Adaptive Assessment",
      actionDescription: isFR
        ? "Lancez un entretien blanc complet de 45 minutes pour mesurer votre niveau global."
        : "Boot up a complete, 45-minute multi-dimensional mock interview under real evaluation rules.",
      badge: "🛡️",
      targetTab: 'assessment',
      buttonLabel: isFR ? "Nouvel Entretien Blanc" : "Start New Assessment"
    });

    return recs;
  }
}

export const recommendationEngine = new RecommendationEngine();
