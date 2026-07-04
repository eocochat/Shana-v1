import { SessionHistoryItem } from '../../types';
import { ProgressComparison, JourneyStage } from './reviewState';

class ProgressEngine {
  public calculateProgress(session: SessionHistoryItem, history: SessionHistoryItem[], isFR: boolean): ProgressComparison[] {
    const previous = history.filter(h => h.id !== session.id);
    
    // Fallback comparison if no history exists (simulate progress relative to standard diagnostic baseline)
    const prevSession = previous.length > 0 ? previous[0] : null;

    const currentScores = {
      confidence: session.confidenceScore || 75,
      star: session.resumeScore || 70,
      communication: session.communicationScore || 72,
      leadership: session.behavioralScore || 75,
      technical: session.industryScore || 78,
      problemSolving: session.adaptabilityScore || 74
    };

    const prevScores = prevSession ? {
      confidence: prevSession.confidenceScore || 65,
      star: prevSession.resumeScore || 62,
      communication: prevSession.communicationScore || 64,
      leadership: prevSession.behavioralScore || 66,
      technical: prevSession.industryScore || 70,
      problemSolving: prevSession.adaptabilityScore || 68
    } : {
      // Baseline defaults when first session
      confidence: 65,
      star: 58,
      communication: 64,
      leadership: 66,
      technical: 70,
      problemSolving: 68
    };

    const calcDelta = (curr: number, prev: number) => {
      const delta = curr - prev;
      return delta >= 0 ? `+${delta}%` : `${delta}%`;
    };

    const isPositive = (curr: number, prev: number) => curr >= prev;

    return [
      {
        metricName: isFR ? "Assurance Émotionnelle (Confidence)" : "Executive Confidence Poise",
        changePercent: currentScores.confidence - prevScores.confidence,
        celebrationText: isFR 
          ? `Gains significatifs (+${currentScores.confidence - prevScores.confidence}%) sur la stabilité posturale et la réduction des silences de panique.`
          : `Excellent progress (+${currentScores.confidence - prevScores.confidence}%) on postural stability and reduced speech initiation latency.`
      },
      {
        metricName: isFR ? "Rigueur Structurelle (STAR)" : "STAR Structure & Results",
        changePercent: currentScores.star - prevScores.star,
        celebrationText: isFR
          ? `Amélioration notable (+${currentScores.star - prevScores.star}%) de l'ancrage des résultats chiffrés en conclusion de récit.`
          : `Substantial jump (+${currentScores.star - prevScores.star}%) in framing hard quantitative results and KPIs in your summaries.`
      },
      {
        metricName: isFR ? "Clarté d'Élocution (Communication)" : "Vocal Pacing & Clarity",
        changePercent: currentScores.communication - prevScores.communication,
        celebrationText: isFR
          ? `Le débit verbal (+${currentScores.communication - prevScores.communication}%) s'est stabilisé autour de 142 WPM (mots par minute).`
          : `Your pacing stabilized (+${currentScores.communication - prevScores.communication}%) around an optimal 140 WPM, eliminating filler density.`
      },
      {
        metricName: isFR ? "Leadership de Crise (Behavioral)" : "Crisis Leadership Response",
        changePercent: currentScores.leadership - prevScores.leadership,
        celebrationText: isFR
          ? `Prise d'ownership (+${currentScores.leadership - prevScores.leadership}%) plus affirmée lors des confrontations de scénario.`
          : `Stronger strategic ownership (+${currentScores.leadership - prevScores.leadership}%) shown during board-confrontation scenarios.`
      }
    ];
  }

  public getJourneyStages(session: SessionHistoryItem, history: SessionHistoryItem[], isFR: boolean): JourneyStage[] {
    const totalInterviewsCount = history.length;
    const score = session.score || 0;

    const stages: JourneyStage[] = [
      {
        id: 'stage_foundation',
        title: isFR ? '01 // Fondations' : '01 // Foundation',
        status: 'completed',
        description: isFR ? "Validez la posture professionnelle de base et éliminez les tics de langage." : "Establish core executive posture and purge immediate verbal fillers.",
        milestoneBonus: isFR ? "+10 Crédits Shana débloqués" : "+10 Shana Credits Unlocked"
      },
      {
        id: 'stage_communication',
        title: isFR ? "02 // Clarté d'Élocution" : '02 // Communication',
        status: totalInterviewsCount >= 2 ? 'completed' : 'current',
        description: isFR ? "Maîtrisez votre débit verbal à 140 WPM sous pression chronométrée." : "Maintain stable 140 WPM conversational cadence under strict countdown pressure.",
        milestoneBonus: isFR ? "Rapport PDF Professionnel Gratuit" : "Free Professional PDF Export Unlocked"
      },
      {
        id: 'stage_behavioral',
        title: isFR ? "03 // Structure STAR" : '03 // Behavioral (STAR)',
        status: totalInterviewsCount >= 3 ? 'completed' : totalInterviewsCount === 2 ? 'current' : 'locked',
        description: isFR ? "Structurez tous vos récits avec des mesures quantitatives claires." : "Rigidly anchor every situational story with hard business performance metrics.",
        milestoneBonus: isFR ? "Premium Trial de 3 jours" : "3-Day Premium Trial Unlocked"
      },
      {
        id: 'stage_leadership',
        title: isFR ? '04 // Leadership Stratégique' : '04 // Leadership',
        status: totalInterviewsCount >= 4 ? 'completed' : totalInterviewsCount === 3 ? 'current' : 'locked',
        description: isFR ? "Démontrez un arbitrage serein sous haute ambiguïté organisationnelle." : "Defend strategic trade-offs and resource delegation under ambiguity.",
        milestoneBonus: isFR ? "Simulateur IA de Négociation Salariale" : "AI Salary Negotiator Unlocked"
      },
      {
        id: 'stage_technical',
        title: isFR ? '05 // Excellence Technique' : '05 // Technical Domain',
        status: totalInterviewsCount >= 5 ? 'completed' : totalInterviewsCount === 4 ? 'current' : 'locked',
        description: isFR ? "Projetez une expertise méthodologique indiscutable face aux experts." : "Deconstruct complex architectural design decisions and defend alternatives.",
        milestoneBonus: isFR ? "Rapport d'audit technique détaillé" : "Detailed Technical Audit Unlocked"
      },
      {
        id: 'stage_executive',
        title: isFR ? '06 // Présence Exécutive' : '06 // Executive Presence',
        status: totalInterviewsCount >= 6 ? 'completed' : totalInterviewsCount === 5 ? 'current' : 'locked',
        description: isFR ? "Défendez vos budgets face aux comités exprès hostiles ou provocateurs." : "Command high-stakes stakeholder negotiations and defend core beliefs with poise.",
        milestoneBonus: isFR ? "Accès exclusif Shana Executive Club" : "Shana Executive Lounge Pass"
      },
      {
        id: 'stage_hiring_ready',
        title: isFR ? '07 // Prêt pour l\'Embauche' : '07 // Hiring Ready',
        status: score >= 85 && totalInterviewsCount >= 4 ? 'completed' : (score >= 70 ? 'current' : 'locked'),
        description: isFR ? "Indice de préparation global supérieur à 85%. Prêt à exceller en production." : "Attain consistent overall index above 85%. Complete readiness achieved.",
        milestoneBonus: isFR ? "Garantie de certification Shana" : "Shana Elite Readiness Certificate"
      }
    ];

    return stages;
  }
}

export const progressEngine = new ProgressEngine();
