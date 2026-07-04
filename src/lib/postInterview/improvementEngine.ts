import { SessionHistoryItem } from '../../types';
import { ImprovedAnswerState } from './reviewState';

class ImprovementEngine {
  public getImprovement(session: SessionHistoryItem, questionIndex: number, isFR: boolean): ImprovedAnswerState {
    const feedbackItems = session.questionsFeedback || [];
    const questionItem = feedbackItems[questionIndex];
    const qText = questionItem ? questionItem.questionText : (isFR ? "Question d'entretien" : "Interview Question");
    
    const originalAnswer = questionItem?.pace === 'silent' || questionItem?.score === 0
      ? (isFR ? "[Aucune réponse vocale enregistrée]" : "[No voice answer captured]")
      : (isFR 
          ? "Euh, oui, j'ai géré un calendrier en retard en travaillant tard le soir avec l'équipe pour finir le projet à temps."
          : "Yes, I managed a delayed project by working late with the team and doing extra hours to deliver the software.");

    const weaknesses = isFR 
      ? [
          "Manque cruel de détails contextuels chiffrés sur l'importance du projet ou l'impact du retard.",
          "Absence de structure logique (Situation, Tâche, Action, Résultat).",
          "Recours à des solutions de contournement non soutenables (le 'travail tardif') au lieu d'une planification managériale."
        ]
      : [
          "Complete lack of quantifiable context about the project size, SLA impact, or cost of delay.",
          "Fails to follow the logical STAR architecture, making it hard to follow.",
          "Leans on unsustainable practices ('working late') rather than showing systematic risk mitigation and resource planning."
        ];

    const rewrittenAnswer = isFR
      ? `**[Situation]** Lors de la livraison de l'application logistique du groupe, un retard de 2 semaines menaçait de pénaliser financièrement le client à hauteur de 15 000€ par jour de retard.\n` +
        `**[Tâche]** Mon objectif était de résorber ce retard en 7 jours ouvrés tout en préservant la qualité du code.\n` +
        `**[Action]** J'ai mis en place un plan d'urgence : 1) Découpage du backlog en livrables critiques, 2) Gel des fonctionnalités secondaires après accord du Product Owner, 3) Intégration de tests de non-régression automatisés pour éliminer les retours de bugs.\n` +
        `**[Résultat]** Nous avons livré le projet avec 2 jours d'avance, évitant ainsi les pénalités financières et sécurisant une note de satisfaction client de 4.8/5.`
      : `**[Situation]** During the release of our flagship fintech API, a major integration bottleneck pushed our schedule out by 10 days, risking a critical SLA penalty of $12,000 per day.\n` +
        `**[Task]** I had to compress the remaining delivery timeline to 5 working days without sacrificing code coverage or security audits.\n` +
        `**[Action]** I orchestrated a strict recovery roadmap: 1) Triaged backlog to prioritize core payment flows, 2) Postponed secondary nice-to-have features in alignment with the VP of Product, and 3) Established paired development sessions to eliminate deployment rollbacks.\n` +
        `**[Result]** We delivered the core API 1 day ahead of the SLA target, successfully avoided all financial penalties, and secured a 100% platform uptime post-deployment.`;

    const whyRewriteStronger = isFR
      ? "Cette version réécrite applique rigoureusement la structure STAR. Elle utilise des métriques d'impact tangibles (15 000€ de pénalités évitées, livraison 2 jours en avance) et remplace une approche passive de crise par un leadership managérial structuré."
      : "This rewrite rigorously implements the STAR architecture. It replaces passive emergency reactions with high-value structural leadership choices, utilizing hard quantitative metrics ($12k SLA, 10 days recovery, 100% uptime) that immediately prove business competency.";

    const cacheKey = `shana_rewrite_attempts_${session.id || 'sess_temp'}_${questionIndex}`;
    const savedAttempts = localStorage.getItem(cacheKey);
    const attempts = savedAttempts ? JSON.parse(savedAttempts) : [];

    return {
      questionIndex,
      originalAnswer,
      weaknesses,
      rewrittenAnswer,
      whyRewriteStronger,
      attempts
    };
  }

  public saveAttempt(sessionId: string, questionIndex: number, attemptText: string): string[] {
    const cacheKey = `shana_rewrite_attempts_${sessionId}_${questionIndex}`;
    const savedAttempts = localStorage.getItem(cacheKey);
    const attempts: string[] = savedAttempts ? JSON.parse(savedAttempts) : [];
    
    attempts.unshift(attemptText); // Put newest attempt first
    localStorage.setItem(cacheKey, JSON.stringify(attempts));
    return attempts;
  }
}

export const improvementEngine = new ImprovementEngine();
