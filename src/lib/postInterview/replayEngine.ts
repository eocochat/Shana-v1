import { SessionHistoryItem, QuestionFeedbackItem } from '../../types';
import { ReplayQuestionTimeline } from './reviewState';

class ReplayEngine {
  public generateTimeline(session: SessionHistoryItem, isFR: boolean): ReplayQuestionTimeline[] {
    const feedbackItems = session.questionsFeedback || [];
    
    return feedbackItems.map((item, idx) => {
      const score = item.score || 0;
      const originalAnswer = item.pace === 'silent' || item.score === 0
        ? (isFR ? "[Aucun flux vocal enregistré]" : "[No voice stream captured]")
        : (isFR 
            ? "En tant que leader technique, j'ai pris en main la situation de crise. J'ai réuni les équipes clés sous 10 minutes, identifié le point de défaillance critique, puis orchestré le plan de remédiation en informant le client régulièrement. Le système a été stabilisé à temps."
            : "As a technology lead, I took charge during this timeline pressure. I aligned key stakeholder teams within 10 minutes, established the immediate triage path, worked alongside development to patch the regression, and maintained proactive hourly updates with the clients. This preserved trust.");

      // Calculate confidence evolution
      const baseConfidence = Math.max(40, Math.min(95, (session.confidenceScore || 75) - 10 + (idx * 3)));
      const endConfidence = Math.min(100, baseConfidence + (score > 80 ? 8 : 2));

      // Competencies evaluated
      const comps = this.getCompetenciesForPhase(item.phaseLabel || '', isFR);

      return {
        questionIndex: idx,
        phaseLabel: item.phaseLabel || `Phase ${idx + 1}`,
        questionText: item.questionText,
        candidateAnswer: originalAnswer,
        recruiterThoughts: this.getRecruiterThoughts(item.phaseLabel || '', score, isFR),
        competenciesEvaluated: comps,
        whyFollowUpAsked: this.getWhyFollowUpAsked(item.phaseLabel || '', score, isFR),
        strengthsIdentified: [
          item.keyPositive || (isFR ? "Bonne réactivité émotionnelle" : "Solid professional baseline"),
          isFR ? "Clarté d'élocution et contrôle de la respiration" : "Clear tone and articulation pacing"
        ],
        weaknessesIdentified: score < 80 ? [
          item.improvementTip || (isFR ? "Manque de mesures quantifiables" : "Needs stronger quantitative impact metrics"),
          isFR ? "Structure chronologique perfectible" : "Structure could be more rigid under the STAR pattern"
        ] : [],
        confidenceEvolution: endConfidence,
        recommendedImprovedAnswer: this.getRecommendedImprovedAnswer(item.phaseLabel || '', item.questionText, comps, isFR)
      };
    });
  }

  private getCompetenciesForPhase(phase: string, isFR: boolean): string[] {
    const uPhase = phase.toUpperCase();
    if (uPhase.includes('RESUME') || uPhase.includes('MILESTONE') || uPhase.includes('CV')) {
      return isFR ? ['Défense de CV', 'Communication'] : ['Resume Alignment', 'Communication'];
    }
    if (uPhase.includes('TECHNICAL') || uPhase.includes('ARCHITECTURE') || uPhase.includes('DESIGN')) {
      return isFR ? ['Architecture Technique', 'Résolution de Problèmes'] : ['Technical Architecture', 'Problem Solving'];
    }
    if (uPhase.includes('BEHAVIORAL') || uPhase.includes('PRESSURE') || uPhase.includes('TIMELINE')) {
      return isFR ? ['Structure STAR', 'Leadership', 'Gestion du Stress'] : ['STAR Structure', 'Leadership', 'Stress Tolerance'];
    }
    if (uPhase.includes('STAKEHOLDER') || uPhase.includes('INTEGRITY') || uPhase.includes('CONFRONTATION')) {
      return isFR ? ['Négociation', 'Leadership', 'Communication'] : ['Influence', 'Leadership', 'Communication'];
    }
    return isFR ? ['Communication', 'Résolution de Problèmes'] : ['Communication', 'Problem Solving'];
  }

  private getRecruiterThoughts(phase: string, score: number, isFR: boolean): string {
    if (score >= 85) {
      return isFR 
        ? "Excellente présence. Le candidat maîtrise son sujet, pose une structure STAR rigoureuse immédiatement et ne montre aucun tic de langage. Très rassurant pour un poste clé."
        : "Impeccable structural composure. Candidate answers directly, shows immediate ownership, uses strong active verbs, and keeps an optimal conversational pace.";
    }
    if (score >= 70) {
      return isFR
        ? "Bonne réponse technique, mais j'aurais aimé avoir des résultats chiffrés plus précis. Le ton est professionnel mais un peu hésitant au début."
        : "Good technical foundations, but lacking hard quantitative indicators. Decent structural flow, though eye level drifted slightly when describing the outcome.";
    }
    return isFR
      ? "Le candidat semble déstabilisé par la question ou par le temps limité. La réponse reste superficielle et manque d'exemples précis ou de structure."
      : "Candidate displays noticeable stress response. Delivery is fragmented with high initial latency and generic platitudes instead of a detailed case study.";
  }

  private getWhyFollowUpAsked(phase: string, score: number, isFR: boolean): string {
    if (score >= 85) {
      return isFR
        ? "Pour tester les limites de son leadership et voir comment il réagit lorsqu'on remet en cause l'échelle de sa réussite."
        : "To probe the exact scope of their decision-making authority and check for executive alignment under pressure.";
    }
    return isFR
      ? "Pour l'aider à restructurer sa pensée et l'inciter à détailler les actions concrètes prises personnellement (le 'A' de la méthode STAR)."
      : "To push the candidate into articulating their personal role ('I' vs. 'We') and guide them toward a measurable outcome.";
  }

  private getRecommendedImprovedAnswer(phase: string, question: string, comps: string[], isFR: boolean): string {
    if (isFR) {
      return `**[Situation]** Lors de mon précédent poste, un bug critique a bloqué notre API de paiement à 2 heures du déploiement général.\n` +
             `**[Tâche]** Ma mission était d'endiguer la perte de transactions et de stabiliser le service sous 30 minutes.\n` +
             `**[Action]** J'ai initié un protocole de crise : 1) Isoler le commit fautif, 2) Déployer un hotfix d'urgence en production, 3) Envoyer un rapport transparent aux équipes commerciales.\n` +
             `**[Résultat]** Le service a été rétabli en 12 minutes, réduisant l'impact financier à moins de 0.5% du volume journalier.`;
    } else {
      return `**[Situation]** In my previous role as Technical Lead, a critical production rollback occurred during our major v2.0 deployment.\n` +
             `**[Task]** I was tasked with restoring checkout operations for over 15,000 active sessions within a 15-minute SLA.\n` +
             `**[Action]** I initiated a rapid triage response: isolated the faulty database migration, automated a safe schema rollback, and unified dev and support channels with automated status pages.\n` +
             `**[Result]** checkout operations were fully restored in 9 minutes, meeting SLA targets and saving an estimated $42,000 in potential transaction drop-offs.`;
    }
  }
}

export const replayEngine = new ReplayEngine();
