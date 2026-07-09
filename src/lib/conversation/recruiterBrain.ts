import { ConversationState, RecruiterBrainTurn } from './conversationState';

export class RecruiterBrainEngine {
  /**
   * Initializes the recruiter brain turn history list if not present
   */
  static getOrInitializeTurns(state: ConversationState): RecruiterBrainTurn[] {
    return state.recruiterBrainTurns || [];
  }

  /**
   * Evaluates the candidate response from a pure recruiter reasoning perspective
   */
  static processTurn(state: ConversationState, userInput: string, targetRole: string, language?: string): RecruiterBrainTurn {
    const text = userInput.trim();
    const lowerText = text.toLowerCase();
    
    // Determine language: detect French
    const isFR = (language && (language.toLowerCase() === 'french' || language.toLowerCase() === 'fr')) || 
                 /\b(je|suis|et|est|pour|avec|dans|une|les|des|du|en|le|la)\b/i.test(lowerText) ||
                 /[éèàùçêâôîû]/i.test(userInput);

    // 1. Analyze what we learned
    let learnedSummary = isFR 
      ? "Le candidat a partagé son parcours et ses compétences générales."
      : "Candidate explained their general background and experience.";

    if (lowerText.includes("team") || lowerText.includes("led") || lowerText.includes("manage") || lowerText.includes("équipe") || lowerText.includes("géré") || lowerText.includes("dirigé")) {
      learnedSummary = isFR
        ? "Appris sur la coordination d'équipe et la portée des responsabilités du candidat."
        : "Learned about candidate's team coordination and scope of responsibility.";
    } else if (lowerText.includes("fix") || lowerText.includes("solve") || lowerText.includes("incident") || lowerText.includes("bug") || lowerText.includes("résolu") || lowerText.includes("panne")) {
      learnedSummary = isFR
        ? "Appris sur la résolution de problèmes techniques et la résilience opérationnelle."
        : "Learned about candidate's hands-on problem solving capabilities and technical resilience.";
    } else if (lowerText.includes("designed") || lowerText.includes("architecture") || lowerText.includes("built") || lowerText.includes("conçu") || lowerText.includes("développé")) {
      learnedSummary = isFR
        ? "Appris sur les décisions de conception d'architecture et le leadership technique."
        : "Learned about candidate's design decisions and technical leadership.";
    } else if (text.length > 200) {
      learnedSummary = isFR
        ? "Appris des détails comportementaux riches concernant l'exécution d'un projet."
        : "Learned detailed behavioral context about a specific project execution.";
    }

    // 2. Compute STAR Completeness
    // Find markers of Situation, Task, Action, Result
    const hasSituation = lowerText.includes("when") || lowerText.includes("during") || lowerText.includes("project") || lowerText.includes("role") || lowerText.includes("context") ||
                         lowerText.includes("lorsque") || lowerText.includes("pendant") || lowerText.includes("projet") || lowerText.includes("contexte");
    const hasTask = lowerText.includes("task") || lowerText.includes("responsible") || lowerText.includes("goal") || lowerText.includes("objective") || lowerText.includes("target") ||
                    lowerText.includes("mission") || lowerText.includes("chargé") || lowerText.includes("but") || lowerText.includes("objectif");
    const hasAction = lowerText.includes("i did") || lowerText.includes("designed") || lowerText.includes("built") || lowerText.includes("implemented") || lowerText.includes("coordinated") || lowerText.includes("created") ||
                      lowerText.includes("conçu") || lowerText.includes("fait") || lowerText.includes("créé") || lowerText.includes("développé") || lowerText.includes("mis en place");
    const hasResult = lowerText.includes("result") || lowerText.includes("percent") || lowerText.includes("%") || lowerText.includes("metrics") || lowerText.includes("saved") || lowerText.includes("improved") ||
                      lowerText.includes("résultat") || lowerText.includes("permis de") || lowerText.includes("gagné") || lowerText.includes("amélioré");

    let starCompleteness = 35; // baseline
    if (hasSituation) starCompleteness += 15;
    if (hasTask) starCompleteness += 15;
    if (hasAction) starCompleteness += 20;
    if (hasResult) starCompleteness += 15;
    if (text.length > 150) starCompleteness += 10;
    if (text.length > 300) starCompleteness += 5;
    starCompleteness = Math.min(100, Math.max(15, starCompleteness));

    // 3. Compute Credibility
    const hasNumbers = /\d+/.test(text);
    let credibility = 60; // baseline
    if (starCompleteness > 70) credibility += 15;
    if (hasNumbers) credibility += 15;
    if (state.emotionState && state.emotionState.certainty > 70) credibility += 10;
    if (text.length < 50) credibility -= 25; // short loses credibility
    credibility = Math.max(15, Math.min(100, credibility));
    const credibilityScore = credibility; // back-compat

    // 4. Specificity
    let specificity = 40;
    if (text.length > 250) specificity += 20;
    if (hasNumbers) specificity += 15;
    const techWordsCount = (lowerText.match(/(api|database|react|typescript|node|docker|kubernetes|aws|cloud|design|architecture|system|git|ci\/cd|pipeline)/g) || []).length;
    specificity += Math.min(25, techWordsCount * 5);
    specificity = Math.min(100, Math.max(10, specificity));

    // 5. Ownership
    const iWords = (lowerText.match(/\b(i|my|myself|me|je|mon|ma|mes|moi)\b/g) || []).length;
    const weWords = (lowerText.match(/\b(we|our|us|nous|notre|nos)\b/g) || []).length;
    let ownership = 60;
    if (iWords > weWords) {
      ownership += Math.min(25, (iWords - weWords) * 4);
    } else if (weWords > iWords) {
      ownership -= Math.min(20, (weWords - iWords) * 4);
    }
    if (lowerText.includes("i was responsible") || lowerText.includes("j'étais responsable") || lowerText.includes("my role") || lowerText.includes("mon rôle")) {
      ownership += 15;
    }
    ownership = Math.min(100, Math.max(20, ownership));

    // 6. Leadership
    let leadership = 50;
    const leadWords = ['led', 'guided', 'mentored', 'coached', 'delegated', 'aligned', 'decided', 'championed', 'géré', 'dirigé', 'coordonné', 'décidé', 'accompagné', 'formé'];
    leadWords.forEach(w => {
      if (lowerText.includes(w)) leadership += 8;
    });
    if (lowerText.includes("team") || lowerText.includes("équipe")) leadership += 5;
    leadership = Math.min(100, Math.max(15, leadership));

    // 7. Business Impact
    let businessImpact = 45;
    if (hasNumbers || lowerText.includes("percent") || lowerText.includes("%")) businessImpact += 15;
    const impactWords = ['saved', 'revenue', 'cost', 'optimized', 'accelerated', 'customer', 'conversion', 'churn', 'scale', 'uptime', 'sla', 'impact', 'coût', 'économie', 'client', 'gagné', 'croissance', 'performance'];
    impactWords.forEach(w => {
      if (lowerText.includes(w)) businessImpact += 5;
    });
    businessImpact = Math.min(100, Math.max(10, businessImpact));

    // 8. Authenticity
    let authenticity = 70;
    const genuineWords = ['learned', 'mistake', 'failed', 'challenge', 'difficult', 'struggle', 'error', 'compromise', 'trade-off', 'appris', 'erreur', 'difficile', 'échoué', 'compromis', 'défi'];
    genuineWords.forEach(w => {
      if (lowerText.includes(w)) authenticity += 5;
    });
    if (text.length < 60) authenticity -= 15;
    // penalty for canned answers if we detect cliché words
    if (lowerText.includes("perfectionist") || lowerText.includes("work too hard") || lowerText.includes("perfectionniste") || lowerText.includes("trop travailleur")) {
      authenticity -= 20;
    }
    authenticity = Math.min(100, Math.max(20, authenticity));

    // 9. Risk Level
    let riskLevel = 30; // low risk default
    if (text.length < 60) riskLevel += 30;
    if (credibility < 60) riskLevel += 15;
    if (authenticity < 60) riskLevel += 10;
    if (starCompleteness < 40) riskLevel += 15;
    if (state.emotionState && state.emotionState.stress > 65) riskLevel += 10;
    riskLevel = Math.min(95, Math.max(10, riskLevel));

    // 10. Confidence Evolution (Hiring Confidence trend)
    // Compute cumulative confidence from past turns, adjusting based on current turn performance
    const previousTurns = state.recruiterBrainTurns || [];
    let prevConfidence = 50; // starting baseline
    if (previousTurns.length > 0) {
      const lastTurn = previousTurns[previousTurns.length - 1];
      prevConfidence = lastTurn.confidenceEvolution || lastTurn.credibilityScore || 50;
    }
    
    // adjust based on performance on this answer
    const currentPerformance = (credibility + specificity + ownership + (starCompleteness * 0.8) + (100 - riskLevel)) / 4.8;
    const confidenceEvolution = Math.round(prevConfidence * 0.7 + currentPerformance * 0.3);

    // 11. Decide competency verified
    let competencyVerified = isFR ? "Communication" : "Communication";
    if (lowerText.includes("led") || lowerText.includes("mentor") || lowerText.includes("manage") || lowerText.includes("guided") || lowerText.includes("dirigé") || lowerText.includes("géré")) {
      competencyVerified = isFR ? "Leadership" : "Leadership";
    } else if (lowerText.includes("chose") || lowerText.includes("decided") || lowerText.includes("reason") || lowerText.includes("because") || lowerText.includes("décidé") || lowerText.includes("choisi")) {
      competencyVerified = isFR ? "Prise de Décision" : "Decision Making";
    } else if (lowerText.includes("code") || lowerText.includes("tech") || lowerText.includes("system") || lowerText.includes("react") || lowerText.includes("api") || lowerText.includes("database") || lowerText.includes("serveur") || lowerText.includes("données")) {
      competencyVerified = isFR ? "Technique" : "Technical";
    } else if (lowerText.includes("pressure") || lowerText.includes("deadline") || lowerText.includes("stress") || lowerText.includes("difficult") || lowerText.includes("pression") || lowerText.includes("urgence")) {
      competencyVerified = isFR ? "Résistance au Stress" : "Stress Resistance";
    } else if (text.length > 150 && starCompleteness > 60) {
      competencyVerified = isFR ? "Structure Storytelling" : "Storytelling";
    }

    // 12. Determine missing competency
    const verifiedSoFar = previousTurns.map(t => t.competencyVerified);
    let competencyMissing = isFR ? "Technique" : "Technical";
    if (!verifiedSoFar.includes(isFR ? "Leadership" : "Leadership")) {
      competencyMissing = isFR ? "Leadership" : "Leadership";
    } else if (!verifiedSoFar.includes(isFR ? "Prise de Décision" : "Decision Making")) {
      competencyMissing = isFR ? "Prise de Décision" : "Decision Making";
    } else if (!verifiedSoFar.includes(isFR ? "Résistance au Stress" : "Stress Resistance")) {
      competencyMissing = isFR ? "Résistance au Stress" : "Stress Resistance";
    } else if (!verifiedSoFar.includes(isFR ? "Communication" : "Communication")) {
      competencyMissing = isFR ? "Communication" : "Communication";
    }

    // 13. Decide stance: challenge, support, or move on
    let stance: 'challenge' | 'support' | 'move_on' = 'support';
    if (credibility < 55 || starCompleteness < 45) {
      stance = 'challenge'; // Probe deeper because details are weak or missing
    } else if (credibility > 80 && starCompleteness > 75) {
      stance = 'move_on'; // Sufficient proof, proceed to next topic
    } else {
      stance = 'support'; // Steady, encourage more detail
    }

    // 14. Do we have enough evidence?
    const evidenceSufficient = credibility >= 70 && starCompleteness >= 65 && text.length > 100;

    // 15. Generate Silent Internal Recruiter Thoughts
    let thoughtWhatDidILearn = "";
    let thoughtWhatIsMissing = "";
    let thoughtDoIBelieveThis = "";
    let thoughtWhatToAskNext = "";
    let thoughtWhatCompetencyValidating = "";
    let thoughtHiringConfidence = "";

    if (isFR) {
      thoughtWhatDidILearn = `J'ai appris que le candidat ${learnedSummary.charAt(0).toLowerCase() + learnedSummary.slice(1).replace(/\.$/, "")}. Sa réponse fait preuve d'une spécificité de ${specificity}% et d'un sens de la propriété mesuré à ${ownership}%.`;
      
      if (starCompleteness < 55) {
        thoughtWhatIsMissing = "Il manque une structure STAR claire. Les actions personnelles prises ne sont pas assez isolées de l'équipe générale (le 'A' de STAR) et j'attends de vrais résultats.";
      } else if (!hasNumbers) {
        thoughtWhatIsMissing = "Des indicateurs clés de performance (KPI) chiffrés ou des métriques financières/techniques d'impact font encore défaut pour valider pleinement l'accomplissement.";
      } else {
        thoughtWhatIsMissing = "La réponse est de bonne facture, mais je pourrais approfondir les compromis ou arbitrages techniques réalisés sous contrainte temporelle.";
      }

      if (credibility > 75) {
        thoughtDoIBelieveThis = "Oui, le niveau de détail apporté sur les contraintes techniques réelles et les rôles respectifs rend le récit tout à fait crédible et authentique.";
      } else if (credibility < 55) {
        thoughtDoIBelieveThis = "Je reste sceptique. L'explication manque de profondeur concrète, le ton semblait hésitant ou trop générique (sans noms de techno, contraintes ou metrics).";
      } else {
        thoughtDoIBelieveThis = "Le récit est plausible, mais le manque de précisions chiffrées invite à une vérification plus approfondie lors du prochain tour.";
      }

      thoughtWhatCompetencyValidating = `Je valide activement la compétence : ${competencyVerified} (Indicateur clé évalué à ${Math.round((credibility + specificity) / 2)}%).`;

      if (stance === 'challenge') {
        thoughtWhatToAskNext = `Je vais pousser le candidat dans ses retranchements sur ${competencyVerified} pour obtenir des preuves solides et clarifier sa valeur ajoutée personnelle.`;
      } else if (stance === 'move_on') {
        thoughtWhatToAskNext = "Je dispose d'assez d'éléments de preuve. Je vais maintenant ouvrir un nouveau sujet pour cartographier le reste de son profil.";
      } else {
        thoughtWhatToAskNext = "Je vais poser une relance ciblée de soutien pour l'inviter à quantifier les résultats obtenus et asseoir son autorité sur ce projet.";
      }

      thoughtHiringConfidence = `Ma confiance d'embauche s'élève à ${confidenceEvolution}%. ${
        confidenceEvolution >= 75 ? "Le profil est solide et aligné sur les exigences de direction." :
        confidenceEvolution >= 55 ? "Profil intéressant mais des zones d'ombre de légitimité restent à lever." :
        "Le niveau de risque est élevé à ce stade de l'entretien."
      }`;
    } else {
      thoughtWhatDidILearn = `I learned that the candidate ${learnedSummary.charAt(0).toLowerCase() + learnedSummary.slice(1).replace(/\.$/, "")}. Their communication specificity is ${specificity}% with a solid individual ownership profile of ${ownership}%.`;

      if (starCompleteness < 55) {
        thoughtWhatIsMissing = "A rigorous STAR formulation is missing. The candidate failed to distinguish their individual contribution from the collective effort (the 'Actions' block).";
      } else if (!hasNumbers) {
        thoughtWhatIsMissing = "Hard quantifiable metrics or business impact indicators are missing. I need to know the scale of success to believe their statements.";
      } else {
        thoughtWhatIsMissing = "The behavioral structure is solid. I will need to explore how they handled the stakeholder trade-offs or technical friction in this scenario.";
      }

      if (credibility > 75) {
        thoughtDoIBelieveThis = "Yes, the granular description of technology trade-offs, system parameters, and constraints signals deep, authentic expertise.";
      } else if (credibility < 55) {
        thoughtDoIBelieveThis = "I am highly skeptical. The answer feels memorized or overly generic, without specific timelines or concrete ownership context.";
      } else {
        thoughtDoIBelieveThis = "It's plausible, but I will need to verify if they are exaggerating their individual authority or the true scale of the impact.";
      }

      thoughtWhatCompetencyValidating = `I am actively validating the candidate's proficiency in: ${competencyVerified} (Current capability metric: ${Math.round((credibility + specificity) / 2)}%).`;

      if (stance === 'challenge') {
        thoughtWhatToAskNext = `I will deliver a challenge follow-up on their ${competencyVerified} answer to pressure-test their claims and verify true technical ownership.`;
      } else if (stance === 'move_on') {
        thoughtWhatToAskNext = "The evidence for this competency is sufficient. I will transition smoothly to cover a new behavioral dimension.";
      } else {
        thoughtWhatToAskNext = "I'll ask a supportive guiding question to help them clarify the exact metrics or SLA impacts of their actions.";
      }

      thoughtHiringConfidence = `My current hiring confidence is at ${confidenceEvolution}%. ${
        confidenceEvolution >= 75 ? "The candidate exhibits strong leadership potential and high technical credibility." :
        confidenceEvolution >= 55 ? "A candidate with clear potential but notable outstanding risk factors regarding senior-level ownership." :
        "The risk profile is elevated; candidate is struggling to articulate concrete outcomes."
      }`;
    }

    // 16. Implement Internal Recruiter Memory updates
    // Push extracted details into contextMemory to persist them and avoid duplicate queries
    if (state.contextMemory) {
      // Avoid duplicates
      if (!state.contextMemory.topicsAlreadyDiscussed.includes(competencyVerified)) {
        state.contextMemory.topicsAlreadyDiscussed.push(competencyVerified);
      }
      
      // Heuristic extraction for memory
      const companies = ['amazon', 'google', 'microsoft', 'apple', 'netflix', 'meta', 'stripe', 'uber', 'airbnb', 'spotify'];
      companies.forEach(c => {
        if (lowerText.includes(c) && !state.contextMemory.companiesMentioned.includes(c)) {
          const cap = c.charAt(0).toUpperCase() + c.slice(1);
          state.contextMemory.companiesMentioned.push(cap);
        }
      });
    }

    return {
      learnedSummary,
      credibilityScore,
      competencyVerified,
      competencyMissing,
      stance,
      evidenceSufficient,
      
      // V2 fields
      confidenceEvolution,
      credibility,
      specificity,
      ownership,
      leadership,
      businessImpact,
      starCompleteness,
      riskLevel,
      authenticity,

      // Silent Thoughts
      thoughtWhatDidILearn,
      thoughtWhatIsMissing,
      thoughtDoIBelieveThis,
      thoughtWhatToAskNext,
      thoughtWhatCompetencyValidating,
      thoughtHiringConfidence
    };
  }
}
