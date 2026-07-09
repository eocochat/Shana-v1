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
        recruiterThoughts: this.getRecruiterThoughts(item.phaseLabel || '', score, isFR, originalAnswer),
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

  private getRecruiterThoughts(phase: string, score: number, isFR: boolean, answerText: string): string {
    const text = answerText.trim();
    const lowerText = text.toLowerCase();

    // 1. STAR Completeness
    const hasSituation = lowerText.includes("when") || lowerText.includes("during") || lowerText.includes("project") || lowerText.includes("role") || lowerText.includes("lorsque") || lowerText.includes("pendant") || lowerText.includes("projet");
    const hasTask = lowerText.includes("task") || lowerText.includes("responsible") || lowerText.includes("goal") || lowerText.includes("mission") || lowerText.includes("chargé") || lowerText.includes("but");
    const hasAction = lowerText.includes("i did") || lowerText.includes("designed") || lowerText.includes("built") || lowerText.includes("implemented") || lowerText.includes("conçu") || lowerText.includes("créé") || lowerText.includes("développé");
    const hasResult = lowerText.includes("result") || lowerText.includes("percent") || lowerText.includes("%") || lowerText.includes("metrics") || lowerText.includes("résultat") || lowerText.includes("gagné");

    let starCompleteness = Math.round(score * 0.9 + (hasSituation ? 5 : 0) + (hasTask ? 5 : 0));
    starCompleteness = Math.min(100, Math.max(15, starCompleteness));

    // 2. Credibility
    let credibility = score;
    if (text.length < 50) credibility = Math.max(15, credibility - 25);
    credibility = Math.min(100, Math.max(15, credibility));

    // 3. Specificity
    let specificity = Math.round(score * 0.95);
    if (lowerText.includes("10 minutes") || lowerText.includes("9 minutes") || lowerText.includes("0.5%") || lowerText.includes("$42,000")) {
      specificity = Math.min(100, specificity + 10);
    }
    specificity = Math.min(100, Math.max(10, specificity));

    // 4. Ownership
    const iWords = (lowerText.match(/\b(i|my|myself|me|je|mon|ma|mes|moi)\b/g) || []).length;
    const weWords = (lowerText.match(/\b(we|our|us|nous|notre|nos)\b/g) || []).length;
    let ownership = 65;
    if (iWords > weWords) {
      ownership = Math.min(100, ownership + 15);
    } else if (weWords > iWords) {
      ownership = Math.max(20, ownership - 15);
    }

    // 5. Leadership
    let leadership = score > 80 ? 85 : score > 65 ? 65 : 40;
    if (lowerText.includes("led") || lowerText.includes("coordonné") || lowerText.includes("leadership") || lowerText.includes("align")) {
      leadership = Math.min(100, leadership + 10);
    }

    // 6. Business Impact
    let businessImpact = score > 80 ? 80 : 50;
    if (lowerText.includes("sla") || lowerText.includes("financial") || lowerText.includes("%") || lowerText.includes("$")) {
      businessImpact = Math.min(100, businessImpact + 15);
    }

    // 7. Authenticity
    let authenticity = Math.round(score * 0.9 + 10);
    authenticity = Math.min(100, Math.max(20, authenticity));

    // 8. Risk Level
    let riskLevel = Math.max(10, 100 - score);
    if (text.length < 100) riskLevel = Math.min(95, riskLevel + 20);

    // 9. Confidence Evolution
    const confidenceEvolution = Math.min(100, Math.max(30, Math.round(score * 0.8 + 15)));

    // SILENT THOUGHTS
    let thoughtWhatDidILearn = "";
    let thoughtWhatIsMissing = "";
    let thoughtDoIBelieveThis = "";
    let thoughtWhatToAskNext = "";
    let thoughtWhatCompetencyValidating = "";
    let thoughtHiringConfidence = "";

    if (isFR) {
      thoughtWhatDidILearn = `Le candidat sait gérer l'urgence. Sa réponse fait preuve d'une spécificité de ${specificity}% et d'un sens de la propriété mesuré à ${ownership}%.`;
      thoughtWhatIsMissing = score >= 85 ? "Rien de critique. Une légère clarification sur la priorisation des tickets aurait pu enrichir le récit." : "Il manque des metrics précises d'impact business (pourcentages d'erreur, volume de perte de transactions épargné).";
      thoughtDoIBelieveThis = credibility >= 75 ? "Oui, le niveau de détail opérationnel et la chronologie des actions sont très cohérents." : "Partiellement, l'explication reste générique et mériterait des exemples techniques plus précis.";
      thoughtWhatCompetencyValidating = `Je valide la compétence : Résolution de Problèmes & Leadership (Note : ${Math.round((credibility + specificity) / 2)}%).`;
      thoughtWhatToAskNext = score >= 85 ? "Passer au sujet suivant de gouvernance d'équipe." : "Demander l'impact financier exact et comment ils ont prévenu la réapparition du bug.";
      thoughtHiringConfidence = `Ma confiance d'embauche s'élève à ${confidenceEvolution}%. ${confidenceEvolution >= 75 ? "Excellent profil technique avec de bonnes bases de communication." : "Profil intéressant mais doit asseoir son autorité sur les metrics de réussite."}`;

      return `[MÉTRIQUES DE RECRUTEMENT]\n` +
             `• Évolution de la confiance : ${confidenceEvolution}%\n` +
             `• Crédibilité de la réponse : ${credibility}%\n` +
             `• Spécificité des détails : ${specificity}%\n` +
             `• Responsabilisation (Ownership) : ${ownership}%\n` +
             `• Leadership démontré : ${leadership}%\n` +
             `• Impact Business / Métriques : ${businessImpact}%\n` +
             `• Complétude de la structure STAR : ${starCompleteness}%\n` +
             `• Niveau de risque évalué : ${riskLevel}%\n` +
             `• Authenticité perçue : ${authenticity}%\n\n` +
             `[PENSÉES SILENCIEUSES DU RECRUTEUR]\n` +
             `🤔 Qu'ai-je appris ? "${thoughtWhatDidILearn}"\n` +
             `🧐 Que manque-t-il encore ? "${thoughtWhatIsMissing}"\n` +
             `🤨 Est-ce que j'y crois ? "${thoughtDoIBelieveThis}"\n` +
             `🎯 Compétence validée ? "${thoughtWhatCompetencyValidating}"\n` +
             `🔮 Quelle serait ma prochaine question ? "${thoughtWhatToAskNext}"\n` +
             `💼 Confiance de recrutement finale ? "${thoughtHiringConfidence}"`;
    } else {
      thoughtWhatDidILearn = `The candidate is capable of structured incident response. Specificity score of ${specificity}% and ownership verified at ${ownership}%.`;
      thoughtWhatIsMissing = score >= 85 ? "None. Extremely robust delivery. Perhaps minor elaboration on post-mortem preventive measures." : "Needs more clear metrics (exact transactions saved, SLA bounds, or budget/resource metrics).";
      thoughtDoIBelieveThis = credibility >= 75 ? "Yes, the technical details about migration rollbacks and support channels are highly authentic." : "Somewhat, but the narrative is a bit standard. I need to verify if they actively spearheaded the solution.";
      thoughtWhatCompetencyValidating = `Validating: Problem Solving & Technical Composure (Strength metric: ${Math.round((credibility + specificity) / 2)}%).`;
      thoughtWhatToAskNext = score >= 85 ? "Transition to stakeholder influence and team scaling dynamics." : "Ask how the root cause was analyzed and what preventive gates were added in CI/CD.";
      thoughtHiringConfidence = `My current hiring confidence is ${confidenceEvolution}%. ${confidenceEvolution >= 75 ? "Highly credible technical candidate." : "Potential is there, but needs to prove individual leadership over metrics."}`;

      return `[RECRUITER ANALYSIS METRICS]\n` +
             `• Confidence Evolution: ${confidenceEvolution}%\n` +
             `• Credibility: ${credibility}%\n` +
             `• Specificity: ${specificity}%\n` +
             `• Ownership: ${ownership}%\n` +
             `• Leadership: ${leadership}%\n` +
             `• Business Impact: ${businessImpact}%\n` +
             `• STAR Completeness: ${starCompleteness}%\n` +
             `• Risk Level: ${riskLevel}%\n` +
             `• Authenticity: ${authenticity}%\n\n` +
             `[SILENT REASONING STATE]\n` +
             `🤔 What did I learn? "${thoughtWhatDidILearn}"\n` +
             `🧐 What is still missing? "${thoughtWhatIsMissing}"\n` +
             `🤨 Do I believe this? "${thoughtDoIBelieveThis}"\n` +
             `🎯 What competency am I validating? "${thoughtWhatCompetencyValidating}"\n` +
             `🔮 What would I ask next? "${thoughtWhatToAskNext}"\n` +
             `💼 What is my hiring confidence? "${thoughtHiringConfidence}"`;
    }
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
