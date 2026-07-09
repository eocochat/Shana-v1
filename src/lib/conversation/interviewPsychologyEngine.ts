import { ConversationState, RecruiterPersonality } from './conversationState';

export interface PsychologyAssessment {
  confidence: number;            // 0-100
  authenticity: number;          // 0-100
  selfAwareness: number;         // 0-100
  communicationMaturity: number; // 0-100
  adaptability: number;          // 0-100
  ownershipMindset: number;      // 0-100
  growthMindset: number;         // 0-100
  emotionalControl: number;      // 0-100
  professionalPresence: number;  // 0-100
  cognitiveLoadLevel: number;    // 0-100 (high = overthinking/losing structure)
  
  decisionMakingStyle: 'Analytical' | 'Intuitive' | 'Pragmatic' | 'Risk-Averse' | 'Collaborative' | 'Unstructured';
  leadershipBehavior: 'Visionary' | 'Directive' | 'Democratic' | 'Coaching' | 'Affiliative' | 'Pacesetting' | 'Individual Contributor';
  problemSolvingApproach: 'Structured' | 'Heuristic' | 'Root-Cause' | 'Reactive' | 'Theoretical';
  stressResponse: 'Poised' | 'Anxious' | 'Defensive' | 'Rushed' | 'Compensated';
}

export interface BehavioralSignals {
  answerStructure: 'STAR' | 'Linear' | 'Rambling' | 'Unstructured' | 'Concise';
  ownershipRatio: number; // ratio of "I" versus "we"
  quantifiedResultsCount: number;
  failureReflectionQuality: 'High' | 'Medium' | 'Low' | 'None';
  admittedMistakes: boolean;
  challengedAssumptions: boolean;
  handledUncertainty: 'Proactive' | 'Passive' | 'Defensive';
  defendedDecisions: 'Reasoned' | 'Rigid' | 'Apologetic';
}

export interface AuthenticitySignals {
  memorizedAnswerProbability: number; // 0-100
  genericResponseProbability: number;   // 0-100
  personalExampleQuality: 'Rich' | 'Generic' | 'Absent';
  exaggeratedClaimsProbability: number; // 0-100
  storytellingNaturalness: number;      // 0-100
}

export interface RecruiterStrategyReasoning {
  followUpReason: 'Need Evidence' | 'Need Clarification' | 'Detected Missing Competency' | 'Want Deeper Understanding' | 'Test Consistency' | 'Move Forward';
  recommendedIntervention: 'Support' | 'Challenge' | 'Probe Deeper' | 'Move Forward';
  internalThought: string;
}

export interface PsychologicalInsight {
  type: 'strength' | 'improvement_area' | 'coaching_tip';
  textEN: string;
  textFR: string;
}

export class InterviewPsychologyEngine {
  /**
   * Evaluates the psychological traits and behavioral signals of a candidate's response
   */
  static analyzeTurn(
    answer: string,
    question: string,
    state: ConversationState,
    lang: string = 'EN'
  ): {
    assessment: PsychologyAssessment;
    behavioral: BehavioralSignals;
    authenticity: AuthenticitySignals;
    strategy: RecruiterStrategyReasoning;
    insights: PsychologicalInsight[];
  } {
    const isFR = lang === 'FR' || lang === 'fr' || lang === 'French';
    const lowerAnswer = answer.toLowerCase();
    const lowerQuestion = question.toLowerCase();
    
    // --- 1. Word and Token Analysis ---
    const words = lowerAnswer.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Pronoun analysis ("I" vs "We" / "Je" vs "Nous")
    let iCount = 0;
    let weCount = 0;
    if (isFR) {
      const iMatches = lowerAnswer.match(/\b(je|moi|mon|ma|mes)\b/g);
      const weMatches = lowerAnswer.match(/\b(nous|notre|nos)\b/g);
      iCount = iMatches ? iMatches.length : 0;
      weCount = weMatches ? weMatches.length : 0;
    } else {
      const iMatches = lowerAnswer.match(/\b(i|me|my|mine|myself)\b/g);
      const weMatches = lowerAnswer.match(/\b(we|us|our|ours|ourselves)\b/g);
      iCount = iMatches ? iMatches.length : 0;
      weCount = weMatches ? weMatches.length : 0;
    }
    const ownershipRatio = (iCount + weCount) > 0 ? iCount / (iCount + weCount) : 0.5;

    // Detect numeric / quantified results
    const numbers = lowerAnswer.match(/\b\d+(%|\b)/g);
    const quantifiedResultsCount = numbers ? numbers.length : 0;

    // Detect structure markers
    const starMarkersEN = ["situation", "task", "action", "result", "goal", "metric", "outcome", "consequently"];
    const starMarkersFR = ["situation", "tâche", "action", "résultat", "objectif", "impact", "conséquence"];
    const targetMarkers = isFR ? starMarkersFR : starMarkersEN;
    let structureMarkerCount = 0;
    targetMarkers.forEach(m => {
      if (lowerAnswer.includes(m)) structureMarkerCount++;
    });

    let answerStructure: 'STAR' | 'Linear' | 'Rambling' | 'Unstructured' | 'Concise' = 'Unstructured';
    if (structureMarkerCount >= 3) {
      answerStructure = 'STAR';
    } else if (wordCount > 180) {
      answerStructure = 'Rambling';
    } else if (wordCount < 30 && wordCount > 0) {
      answerStructure = 'Concise';
    } else if (lowerAnswer.includes("then") || lowerAnswer.includes("after") || lowerAnswer.includes("puis") || lowerAnswer.includes("ensuite")) {
      answerStructure = 'Linear';
    }

    // Admitted mistakes/failures check
    const mistakeWordsEN = ["mistake", "failed", "failure", "error", "wrong", "learned from", "misunderstood"];
    const mistakeWordsFR = ["erreur", "échoué", "échec", "trompé", "malentendu", "appris de"];
    const targetMistakes = isFR ? mistakeWordsFR : mistakeWordsEN;
    const admittedMistakes = targetMistakes.some(m => lowerAnswer.includes(m));

    // Challenged assumptions check
    const assumptionWordsEN = ["assumed", "assumption", "questioned", "challenged", "instead of", "alternative", "realized"];
    const assumptionWordsFR = ["supposé", "hypothèse", "remis en question", "contesté", "plutôt que", "alternative"];
    const targetAssumptions = isFR ? assumptionWordsFR : assumptionWordsEN;
    const challengedAssumptions = targetAssumptions.some(a => lowerAnswer.includes(a));

    // Defended decisions
    let defendedDecisions: 'Reasoned' | 'Rigid' | 'Apologetic' = 'Reasoned';
    if (lowerAnswer.includes("sorry") || lowerAnswer.includes("désolé") || lowerAnswer.includes("excuse")) {
      defendedDecisions = 'Apologetic';
    } else if (lowerAnswer.includes("must") || lowerAnswer.includes("had to") || lowerAnswer.includes("devoir") || lowerAnswer.includes("absolument")) {
      defendedDecisions = 'Rigid';
    }

    // Handled uncertainty
    let handledUncertainty: 'Proactive' | 'Passive' | 'Defensive' = 'Passive';
    const uncertaintyWordsEN = ["unclear", "uncertain", "not sure", "ambiguous", "risk", "mitigate", "verify", "explore"];
    const uncertaintyWordsFR = ["incertain", "pas sûr", "ambigu", "risque", "atténuer", "vérifier", "explorer"];
    const targetUncertainty = isFR ? uncertaintyWordsFR : uncertaintyWordsEN;
    const mentionsUncertainty = targetUncertainty.some(u => lowerAnswer.includes(u));
    if (mentionsUncertainty) {
      if (lowerAnswer.includes("verify") || lowerAnswer.includes("explore") || lowerAnswer.includes("vérifier") || lowerAnswer.includes("atténuer") || lowerAnswer.includes("mitigate")) {
        handledUncertainty = 'Proactive';
      } else if (lowerAnswer.includes("defend") || lowerAnswer.includes("avoid") || lowerAnswer.includes("éviter")) {
        handledUncertainty = 'Defensive';
      }
    }

    // Failure reflection quality
    let failureReflectionQuality: 'High' | 'Medium' | 'Low' | 'None' = 'None';
    if (admittedMistakes) {
      if (lowerAnswer.includes("learned") || lowerAnswer.includes("retrospective") || lowerAnswer.includes("appris") || lowerAnswer.includes("leçon") || lowerAnswer.includes("lesson")) {
        failureReflectionQuality = 'High';
      } else {
        failureReflectionQuality = 'Medium';
      }
    }

    const behavioral: BehavioralSignals = {
      answerStructure,
      ownershipRatio,
      quantifiedResultsCount,
      failureReflectionQuality,
      admittedMistakes,
      challengedAssumptions,
      handledUncertainty,
      defendedDecisions
    };

    // --- 2. Authenticity Analysis ---
    // Detect overly polished, repetitive corporate clichés or template phrases
    const clichésEN = ["synergy", "paradigm shift", "dynamic team player", "think outside the box", "go the extra mile", "hard worker", "results-oriented"];
    const clichésFR = ["synergie", "force de proposition", "dynamique", "penser hors cadre", "aller plus loin", "axé résultats"];
    const targetClichés = isFR ? clichésFR : clichésEN;
    let clichéCount = 0;
    targetClichés.forEach(c => {
      if (lowerAnswer.includes(c)) clichéCount++;
    });

    const hasSpecificNameOrCompany = /\b(at|in|with|chez|pour)\s+[A-Z][a-z]+/g.test(answer) || lowerAnswer.includes("google") || lowerAnswer.includes("amazon") || lowerAnswer.includes("startup") || lowerAnswer.includes("project");
    
    let memorizedAnswerProbability = Math.min(95, Math.max(10, clichéCount * 15 + (wordCount < 30 ? 25 : 0)));
    let genericResponseProbability = Math.min(98, Math.max(15, clichéCount * 20 + (hasSpecificNameOrCompany ? -25 : 15)));
    let personalExampleQuality: 'Rich' | 'Generic' | 'Absent' = 'Absent';

    if (wordCount > 60) {
      personalExampleQuality = hasSpecificNameOrCompany ? 'Rich' : 'Generic';
    }

    const exaggeratedClaimsProbability = Math.min(90, Math.max(5, quantifiedResultsCount > 4 ? 45 : (lowerAnswer.includes("best") || lowerAnswer.includes("million") || lowerAnswer.includes("perfect") ? 30 : 10)));
    const storytellingNaturalness = Math.max(15, Math.min(95, 100 - memorizedAnswerProbability - exaggeratedClaimsProbability / 2));

    const authenticity: AuthenticitySignals = {
      memorizedAnswerProbability,
      genericResponseProbability,
      personalExampleQuality,
      exaggeratedClaimsProbability,
      storytellingNaturalness
    };

    // --- 3. Psychological Attributes Model ---
    // Extract base confidence & stress from state or derive
    const baseConfidence = state.emotionState?.confidence ?? 70;
    const baseStress = state.emotionState?.stress ?? 30;

    // Self-awareness scoring
    let selfAwareness = 60;
    if (admittedMistakes) selfAwareness += 15;
    if (failureReflectionQuality === 'High') selfAwareness += 10;
    if (clichéCount > 2) selfAwareness -= 10;
    selfAwareness = Math.max(10, Math.min(98, selfAwareness));

    // Communication Maturity
    let communicationMaturity = 65;
    if (answerStructure === 'STAR') communicationMaturity += 15;
    if (answerStructure === 'Rambling') communicationMaturity -= 15;
    if (ownershipRatio > 0.3 && ownershipRatio < 0.8) communicationMaturity += 10; // balanced use of I vs We
    communicationMaturity = Math.max(10, Math.min(98, communicationMaturity));

    // Adaptability
    let adaptability = 60;
    if (challengedAssumptions) adaptability += 15;
    if (handledUncertainty === 'Proactive') adaptability += 15;
    if (defendedDecisions === 'Rigid') adaptability -= 15;
    adaptability = Math.max(10, Math.min(98, adaptability));

    // Ownership mindset
    let ownershipMindset = Math.max(10, Math.min(98, Math.round(ownershipRatio * 100)));

    // Growth Mindset
    let growthMindset = 55;
    if (failureReflectionQuality === 'High') growthMindset += 25;
    else if (failureReflectionQuality === 'Medium') growthMindset += 15;
    if (lowerAnswer.includes("learn") || lowerAnswer.includes("course") || lowerAnswer.includes("grow") || lowerAnswer.includes("appris") || lowerAnswer.includes("grandir")) growthMindset += 10;
    growthMindset = Math.max(10, Math.min(98, growthMindset));

    // Emotional Control
    let emotionalControl = Math.max(10, Math.min(98, 100 - baseStress));

    // Professional Presence
    let professionalPresence = Math.max(15, Math.min(98, Math.round((baseConfidence * 0.4) + (communicationMaturity * 0.4) + (100 - baseStress) * 0.2)));

    // Cognitive load levels
    let cognitiveLoadLevel = baseStress;
    if (answerStructure === 'Rambling') cognitiveLoadLevel += 20;
    if (wordCount > 250) cognitiveLoadLevel += 15;
    cognitiveLoadLevel = Math.max(5, Math.min(95, cognitiveLoadLevel));

    // Stylistic tags
    let decisionMakingStyle: 'Analytical' | 'Intuitive' | 'Pragmatic' | 'Risk-Averse' | 'Collaborative' | 'Unstructured' = 'Pragmatic';
    if (lowerAnswer.includes("data") || lowerAnswer.includes("analyze") || lowerAnswer.includes("données") || lowerAnswer.includes("analyse")) {
      decisionMakingStyle = 'Analytical';
    } else if (lowerAnswer.includes("team") || lowerAnswer.includes("stakeholder") || lowerAnswer.includes("collègue") || lowerAnswer.includes("équipe")) {
      decisionMakingStyle = 'Collaborative';
    } else if (lowerAnswer.includes("gut") || lowerAnswer.includes("instinct") || lowerAnswer.includes("feeling") || lowerAnswer.includes("immédiatement")) {
      decisionMakingStyle = 'Intuitive';
    } else if (lowerAnswer.includes("safe") || lowerAnswer.includes("avoid risk") || lowerAnswer.includes("sécurité") || lowerAnswer.includes("éviter le risque")) {
      decisionMakingStyle = 'Risk-Averse';
    } else if (answerStructure === 'Unstructured') {
      decisionMakingStyle = 'Unstructured';
    }

    let leadershipBehavior: 'Visionary' | 'Directive' | 'Democratic' | 'Coaching' | 'Affiliative' | 'Pacesetting' | 'Individual Contributor' = 'Individual Contributor';
    if (lowerAnswer.includes("led") || lowerAnswer.includes("directed") || lowerAnswer.includes("manager") || lowerAnswer.includes("dirigé")) {
      if (lowerAnswer.includes("vision") || lowerAnswer.includes("inspire") || lowerAnswer.includes("avenir")) {
        leadershipBehavior = 'Visionary';
      } else if (lowerAnswer.includes("coach") || lowerAnswer.includes("mentor") || lowerAnswer.includes("grandir")) {
        leadershipBehavior = 'Coaching';
      } else if (lowerAnswer.includes("delegate") || lowerAnswer.includes("empower") || lowerAnswer.includes("déléguer")) {
        leadershipBehavior = 'Democratic';
      } else {
        leadershipBehavior = 'Directive';
      }
    }

    let problemSolvingApproach: 'Structured' | 'Heuristic' | 'Root-Cause' | 'Reactive' | 'Theoretical' = 'Structured';
    if (lowerAnswer.includes("why") || lowerAnswer.includes("root") || lowerAnswer.includes("cause") || lowerAnswer.includes("pourquoi") || lowerAnswer.includes("racine")) {
      problemSolvingApproach = 'Root-Cause';
    } else if (lowerAnswer.includes("quick") || lowerAnswer.includes("fix") || lowerAnswer.includes("rapidement") || lowerAnswer.includes("improviser")) {
      problemSolvingApproach = 'Reactive';
    } else if (lowerAnswer.includes("theory") || lowerAnswer.includes("framework") || lowerAnswer.includes("modèle") || lowerAnswer.includes("théorie")) {
      problemSolvingApproach = 'Theoretical';
    } else if (answerStructure === 'Unstructured') {
      problemSolvingApproach = 'Heuristic';
    }

    let stressResponse: 'Poised' | 'Anxious' | 'Defensive' | 'Rushed' | 'Compensated' = 'Poised';
    if (baseStress > 60) {
      if (lowerAnswer.includes("sorry") || lowerAnswer.includes("excuse")) {
        stressResponse = 'Anxious';
      } else if (lowerAnswer.includes("but") || lowerAnswer.includes("mais") || lowerAnswer.includes("car") || lowerAnswer.includes("because")) {
        stressResponse = 'Defensive';
      } else if (wordCount > 200) {
        stressResponse = 'Rushed';
      } else {
        stressResponse = 'Compensated';
      }
    }

    const assessment: PsychologyAssessment = {
      confidence: baseConfidence,
      authenticity: Math.round(storytellingNaturalness),
      selfAwareness,
      communicationMaturity,
      adaptability,
      ownershipMindset,
      growthMindset,
      emotionalControl,
      professionalPresence,
      cognitiveLoadLevel,
      decisionMakingStyle,
      leadershipBehavior,
      problemSolvingApproach,
      stressResponse
    };

    // --- 4. Recruiter Strategy Engine ---
    let followUpReason: 'Need Evidence' | 'Need Clarification' | 'Detected Missing Competency' | 'Want Deeper Understanding' | 'Test Consistency' | 'Move Forward' = 'Move Forward';
    let recommendedIntervention: 'Support' | 'Challenge' | 'Probe Deeper' | 'Move Forward' = 'Move Forward';
    let internalThought = "";

    if (personalExampleQuality === 'Absent') {
      followUpReason = 'Need Evidence';
      recommendedIntervention = 'Probe Deeper';
      internalThought = isFR
        ? "Le candidat a donné une réponse théorique sans exemple concret. Je dois sonder sa réelle expérience."
        : "The candidate gave a theoretical response without a concrete example. I need to probe for real evidence.";
    } else if (genericResponseProbability > 65) {
      followUpReason = 'Need Clarification';
      recommendedIntervention = 'Challenge';
      internalThought = isFR
        ? "La réponse semble apprise ou très générique. Je dois creuser un détail pour vérifier l'authenticité."
        : "The response sounds rehearsed or generic. I should push on a specific detail to test for real authenticity.";
    } else if (cognitiveLoadLevel > 70) {
      followUpReason = 'Need Clarification';
      recommendedIntervention = 'Support';
      internalThought = isFR
        ? "Le niveau de stress et de charge cognitive est élevé. Je devrais reformuler avec un ton de soutien."
        : "The candidate is showing high stress and cognitive load. I should support them and ease them forward.";
    } else if (quantifiedResultsCount === 0 && wordCount > 80) {
      followUpReason = 'Detected Missing Competency';
      recommendedIntervention = 'Probe Deeper';
      internalThought = isFR
        ? "La narration est bonne, mais l'impact mesurable manque. Je vais demander des métriques précises."
        : "The storytelling is fine, but measurable impact is missing. I will probe for clear success metrics.";
    } else if (state.currentTurn < 4) {
      followUpReason = 'Want Deeper Understanding';
      recommendedIntervention = 'Challenge';
      internalThought = isFR
        ? "Excellentes bases. Je vais tester sa solidité en remettant en cause une de ses décisions."
        : "Strong foundation. I will test their resolve by challenging one of their core decisions.";
    }

    const strategy: RecruiterStrategyReasoning = {
      followUpReason,
      recommendedIntervention,
      internalThought
    };

    // --- 5. Psychological Feedback Engine ---
    const insights: PsychologicalInsight[] = [];

    // Authenticity insights
    if (genericResponseProbability > 65) {
      insights.push({
        type: 'improvement_area',
        textEN: "Your answer sounded generic. Adding a concrete personal experience would make your claims significantly more credible.",
        textFR: "Votre réponse semblait générique. L'ajout d'une expérience personnelle concrète rendrait vos affirmations bien plus crédibles."
      });
    } else if (storytellingNaturalness > 80) {
      insights.push({
        type: 'strength',
        textEN: "You showcase stellar authenticity and natural storytelling, immediately establishing professional credibility.",
        textFR: "Vous faites preuve d'une excellente authenticité et d'un art naturel du récit, établissant immédiatement votre crédibilité."
      });
    }

    // STAR Structure
    if (answerStructure === 'STAR') {
      insights.push({
        type: 'strength',
        textEN: "You exhibit strong STAR structural rigor, making complex decision paths easy to comprehend.",
        textFR: "Vous structurez vos réponses selon la méthodologie STAR, rendant limpides des choix décisionnels pourtant complexes."
      });
    } else if (answerStructure === 'Rambling') {
      insights.push({
        type: 'improvement_area',
        textEN: "You tend to provide too much narrative detail under pressure, which slightly dilutes the core message.",
        textFR: "Vous tendez à fournir trop de détails narratifs sous la pression, ce qui dilue légèrement votre message principal."
      });
    }

    // Growth Mindset / Failure Reflection
    if (failureReflectionQuality === 'High') {
      insights.push({
        type: 'strength',
        textEN: "You demonstrate remarkable self-awareness and growth mindset when recounting professional failures.",
        textFR: "Vous démontrez une conscience de soi remarquable et un esprit de croissance élevé en relatant vos erreurs passées."
      });
    }

    // Quantified impact
    if (quantifiedResultsCount > 0) {
      insights.push({
        type: 'strength',
        textEN: "You excel at quantifying your achievements, backed up by solid measurable outcomes.",
        textFR: "Vous excellez à quantifier vos réalisations, en les appuyant par des indicateurs de performance concrets."
      });
    } else if (wordCount > 80) {
      insights.push({
        type: 'coaching_tip',
        textEN: "Try to always specify the business metrics or team impacts to solidify your leadership contribution.",
        textFR: "Essayez de toujours spécifier l'impact financier, temporel ou humain pour matérialiser l'ampleur de votre contribution."
      });
    }

    return {
      assessment,
      behavioral,
      authenticity,
      strategy,
      insights
    };
  }

  /**
   * Translates current psychology assessment into a specialized prompt directive block for SHANA
   */
  static generatePsychologyDirective(
    assessment: PsychologyAssessment,
    strategy: RecruiterStrategyReasoning,
    lang: string = 'EN'
  ): string {
    const isFR = lang === 'FR' || lang === 'fr' || lang === 'French';
    
    let prompt = isFR
      ? `
====================================================
DIRECTIVES COMPORTEMENTALES & PSYCHOLOGIQUES DU RECRUTEUR (PHASE 8) :
====================================================
L'évaluation psychologique en temps réel révèle :
- Niveau de Confiance : ${assessment.confidence}/100
- Niveau d'Authenticité : ${assessment.authenticity}/100
- Charge Cognitive : ${assessment.cognitiveLoadLevel}/100
- Style Décisionnel Détecté : ${assessment.decisionMakingStyle}
- Style de Leadership : ${assessment.leadershipBehavior}
- Réponse au Stress : ${assessment.stressResponse}

RAISONNEMENT STRATÉGIQUE INTERNE DU RECRUTEUR :
- Objectif Actuel : ${strategy.followUpReason}
- Mode d'Intervention Recommandé : ${strategy.recommendedIntervention}
- Pensée Interne : "${strategy.internalThought}"

INSTRUCTIONS POUR LE TON DE VOTRE PROCHAINE RÉPONSE :`
      : `
====================================================
RECRUITER INTERVIEW PSYCHOLOGY DIRECTIVES (PHASE 8):
====================================================
Real-time candidate psychological evaluation profile:
- Confidence Level: ${assessment.confidence}/100
- Authenticity Rating: ${assessment.authenticity}/100
- Cognitive Load Level: ${assessment.cognitiveLoadLevel}/100
- Decision-Making Style: ${assessment.decisionMakingStyle}
- Leadership Behavior: ${assessment.leadershipBehavior}
- Stress Response Category: ${assessment.stressResponse}

INTERNAL RECRUITER STRATEGIC REASONING:
- Recruiter Subgoal: ${strategy.followUpReason}
- Suggested Intervention Tone: ${strategy.recommendedIntervention}
- Internal Recruiter Thought: "${strategy.internalThought}"

GUIDELINES FOR YOUR NEXT TURN VERBAL DELIVERY:`;

    // Tone instructions based on intervention
    if (strategy.recommendedIntervention === 'Challenge') {
      prompt += isFR
        ? `\n- Adoptez une posture de recruteur exigeante et rigoureuse. Posez une relance précise pour remettre en question une décision prise, ou tester la cohérence de l'authenticité du candidat.\n- Exemples de pivots : "D'accord, mais avec le recul, n'était-ce pas un risque démesuré ?", "C'est un classique, mais concrètement comment avez-vous..."`
        : `\n- Challenge the candidate's core assertion. Push them with a rigorous, high-standard follow-up questioning the risks or trade-offs of their decisions.\n- Pivot Examples: "I see, but looking back, wasn't that an incredibly risky call?", "That's a textbook answer, but what did *you* personally implement?"`;
    } else if (strategy.recommendedIntervention === 'Support') {
      prompt += isFR
        ? `\n- Le candidat montre des signes d'overthinking ou de stress élevé. Réduisez immédiatement la pression. Offrez un renforcement positif sincère pour le stabiliser, puis posez une relance plus ouverte.\n- Exemples : "C'est une situation difficile que beaucoup connaissent. Ne vous inquiétez pas. Si l'on regarde..."`
        : `\n- The candidate exhibits high cognitive overload or speech anxiety. Lower the pressure immediately. Provide genuine warm reassurance and follow up with a soft, open, structured question.\n- Pivot Examples: "That is a highly complex scenario, and honestly, a lot of leaders stumble there. It's perfectly fine. If we look at..."`;
    } else if (strategy.recommendedIntervention === 'Probe Deeper') {
      prompt += isFR
        ? `\n- Le candidat évite les détails ou fournit des réponses trop courtes/théoriques. Demandez explicitement un exemple réel et les résultats chiffrés obtenus.\n- Exemples : "Pouvez-vous me situer cela dans un projet précis ?", "Et quel a été l'impact mesurable, par exemple en termes de chiffres ou de retour utilisateur ?"`
        : `\n- The candidate's answer is overly theoretical or brief. Explicitly probe for a specific real-world example, business outcome, or measurable metric.\n- Pivot Examples: "Could you walk me through a specific time where you applied this?", "And what was the exact measurable metric or outcome of that decision?"`;
    } else {
      prompt += isFR
        ? `\n- Progressez naturellement dans l'entretien en introduisant une nouvelle thématique de manière fluide.`
        : `\n- Progress naturally into the next interview phase or target competency with a smooth conversational glide.`;
    }

    return prompt;
  }
}
