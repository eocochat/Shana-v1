import { ConversationState, EmotionState, RecruiterPersonality } from './conversationState';

export interface EmpathyMetrics {
  comfortScore: number;       // scale of 0-100
  workloadScore: number;      // scale of 0-100
  motivationScore: number;    // scale of 0-100
  recoveryRate: number;       // scale of 0-100
  engagementScore: number;    // scale of 0-100
  supportInterventions: number;
  encouragementCount: number;
}

export interface EmpathyEvaluation {
  metrics: EmpathyMetrics;
  hasDifficultMoment: boolean;
  difficultMomentReason: string;
  encouragementEarned: boolean;
  encouragementReason: string;
  activeEmpathyDirective: string;
  empathyInsight: string;
}

export class RecruiterEmpathyEngine {
  /**
   * Main empathy assessment called on candidate turn
   */
  static evaluateEmpathyTurn(
    state: ConversationState,
    text: string,
    language: string
  ): EmpathyEvaluation {
    const isEng = language === 'English' || language === 'EN' || language === 'en';
    const emotion = state.emotionState || {
      confidence: 50,
      stress: 30,
      hesitation: 20,
      enthusiasm: 50,
      certainty: 50,
      frustration: 10,
      engagement: 70,
      composure: 70,
      cognitiveLoad: 30,
      defensiveness: 10,
      flowStateRating: 50,
      primaryVibe: 'neutral'
    };

    const prevMetrics = state.empathyMetrics || {
      comfortScore: 70,
      workloadScore: 30,
      motivationScore: 70,
      recoveryRate: 80,
      engagementScore: 70,
      supportInterventions: 0,
      encouragementCount: 0
    };

    // 1. Calculate Realtime Comfort Score
    const comfortScore = Math.max(0, Math.min(100, Math.round(
      ( (emotion.composure || 70) * 0.4 ) + 
      ( (100 - emotion.stress) * 0.3 ) + 
      ( emotion.confidence * 0.3 )
    )));

    // 2. Calculate Workload Score (Cognitive Load)
    const workloadScore = Math.max(0, Math.min(100, Math.round(
      ( (emotion.cognitiveLoad || 30) * 0.5 ) + 
      ( emotion.hesitation * 0.3 ) + 
      ( emotion.frustration * 0.2 )
    )));

    // 3. Calculate Motivation Score
    const motivationScore = Math.max(0, Math.min(100, Math.round(
      ( emotion.enthusiasm * 0.5 ) + 
      ( emotion.engagement * 0.5 )
    )));

    // 4. Calculate Recovery Rate (Resilience Trend)
    let recoveryRate = prevMetrics.recoveryRate || 80;
    const confidenceTrend = state.coachingData?.confidenceTrend || [];
    if (confidenceTrend.length >= 2) {
      const currentConf = confidenceTrend[confidenceTrend.length - 1];
      const prevConf = confidenceTrend[confidenceTrend.length - 2];
      const diff = currentConf - prevConf;
      if (diff > 0) {
        recoveryRate = Math.min(100, recoveryRate + (diff * 2));
      } else if (diff < 0) {
        recoveryRate = Math.max(20, recoveryRate + (diff * 1.5));
      }
    }

    // 5. Calculate Engagement Score
    const engagementScore = emotion.engagement || 70;

    // 6. Detect Difficult Moments (Freezing, Memory blank, Repeated apologies, frustration)
    let hasDifficultMoment = false;
    let difficultMomentReason = 'none';

    const lowerText = text.toLowerCase();
    const isApologizing = ['sorry', 'apologize', 'excuse', 'pardon', 'désolé', 'm\'excuse', 'je m\'excuse'].some(w => lowerText.includes(w));
    const cannotRemember = ['forget', 'forgot', 'cannot remember', 'don\'t remember', 'oubli', 'rappelle plus', 'me rappelle pas', 'sais plus'].some(w => lowerText.includes(w));

    if (emotion.stress > 65 || emotion.hesitation > 70 || (emotion.cognitiveLoad && emotion.cognitiveLoad > 70)) {
      hasDifficultMoment = true;
      difficultMomentReason = 'cognitive_pressure';
    } else if (isApologizing) {
      hasDifficultMoment = true;
      difficultMomentReason = 'candidate_apology';
    } else if (cannotRemember) {
      hasDifficultMoment = true;
      difficultMomentReason = 'memory_blank';
    } else if (state.silenceType === 'LongSilence' || state.silenceType === 'EmotionalPause') {
      hasDifficultMoment = true;
      difficultMomentReason = 'conversational_freeze';
    }

    // 7. Evaluate if Encouragement is Earned (No cheap flattery!)
    let encouragementEarned = false;
    let encouragementReason = 'none';

    const starTrend = state.coachingData?.starCompletenessTrend || [];
    const lastStarScore = starTrend[starTrend.length - 1] || 0;

    if (emotion.confidence > 75 && lastStarScore >= 75 && emotion.composure && emotion.composure > 75) {
      encouragementEarned = true;
      encouragementReason = 'excellence';
    } else if (confidenceTrend.length >= 2 && (confidenceTrend[confidenceTrend.length - 1] - confidenceTrend[confidenceTrend.length - 2] >= 15)) {
      encouragementEarned = true;
      encouragementReason = 'significant_recovery';
    }

    // Increments counter for metrics
    let supportInterventions = prevMetrics.supportInterventions;
    let encouragementCount = prevMetrics.encouragementCount;
    if (hasDifficultMoment) supportInterventions += 1;
    if (encouragementEarned) encouragementCount += 1;

    const metrics: EmpathyMetrics = {
      comfortScore,
      workloadScore,
      motivationScore,
      recoveryRate,
      engagementScore,
      supportInterventions,
      encouragementCount
    };

    // 8. Generate Personality-Specific Empathy Directives
    const activeEmpathyDirective = this.generatePersonalityDirectives(
      state.personality,
      metrics,
      hasDifficultMoment,
      difficultMomentReason,
      encouragementEarned,
      encouragementReason,
      state.currentTurn,
      state,
      language
    );

    // 9. Generate Empathy Insight Note
    const empathyInsight = this.generateEmpathyInsight(
      state.currentTurn,
      metrics,
      hasDifficultMoment,
      difficultMomentReason,
      encouragementEarned,
      encouragementReason,
      isEng
    );

    return {
      metrics,
      hasDifficultMoment,
      difficultMomentReason,
      encouragementEarned,
      encouragementReason,
      activeEmpathyDirective,
      empathyInsight
    };
  }

  /**
   * Generates dynamic system instructions injecting empathy rules tailored to the active recruiter archetype
   */
  private static generatePersonalityDirectives(
    personality: RecruiterPersonality,
    metrics: EmpathyMetrics,
    hasDifficult,
    difficultReason,
    encouragementEarned,
    encouragementReason,
    turn: number,
    state: ConversationState,
    language: string
  ): string {
    const isEng = language === 'English' || language === 'EN' || language === 'en';
    const isSupportivePersonality = ['friendly', 'university', 'prod_dir', 'customer_support', 'hospital_mgr', 'hotel_gm'].includes(personality.id);
    const isDemandingPersonality = ['senior_eng', 'founder', 'banker', 'amazon_br', 'tech_lead', 'military'].includes(personality.id);
    const isExecutivePersonality = ['corporate', 'executive', 'mckinsey_pt', 'cto', 'eng_dir', 'civil_service', 'silent', 'google_hm'].includes(personality.id);

    let interactionPacing = isEng 
      ? `Maintain a steady, patient pace. Ensure pauses are natural.`
      : `Maintenez un rythme posé et patient. Assurez des pauses naturelles.`;

    if (metrics.comfortScore < 45) {
      interactionPacing = isEng
        ? `SLow down your speech speed. Candidate comfort is low (${metrics.comfortScore}%). Soften transitions.`
        : `Ralentissez votre débit de parole. Le confort du candidat est faible (${metrics.comfortScore}%). Adoucissez les transitions.`;
    } else if (metrics.comfortScore > 80 && isDemandingPersonality) {
      interactionPacing = isEng
        ? `Increase your pacing and intensity. The candidate is highly comfortable (${metrics.comfortScore}%). Probe with higher-level questions.`
        : `Accélérez le rythme et l'intensité. Le candidat est très à l'aise (${metrics.comfortScore}%). Relancez avec des questions plus ardues.`;
    }

    let empathyResponseEN = "";
    let empathyResponseFR = "";

    // A. DIFFICULT MOMENTS HANDLERS
    if (hasDifficult) {
      if (isSupportivePersonality) {
        empathyResponseEN = `The candidate is struggling due to: [${difficultReason}]. 
- Proactively lower pressure. Use comforting words: "Take your time," "This is a challenging topic," "We're in no rush."
- Offer reassurance before proceeding. Normalize their situation. Do not push for advanced metrics immediately.`;

        empathyResponseFR = `Le candidat est en difficulté : [${difficultReason}]. 
- Diminuez immédiatement la pression. Rassurez avec bienveillance : "Prenez tout votre temps," "C'est une question difficile," "Rien ne presse."
- Validez l'effort avant de relancer. Normalisez sa situation.`;
      } 
      else if (isDemandingPersonality) {
        empathyResponseEN = `The candidate is experiencing: [${difficultReason}].
- Remain analytical and demanding, but show professional respect. Do not offer easy exits or help them answer, but allow them space.
- Say: "It is a complex challenge, let's look at it from a different angle," or "Understood. Let's trace how you'd handle..."
- Maintain standards without sounding aggressive.`;

        empathyResponseFR = `Le candidat est en difficulté : [${difficultReason}].
- Restez exigeant et rigoureux, mais montrez un profond respect professionnel. Ne lui donnez pas la réponse, mais donnez-lui du temps.
- Dites : "C'est un défi complexe, essayons de l'aborder sous un autre angle," ou "Compris. Regardons plutôt comment vous géreriez..."
- Maintenez les standards sans paraître agressif.`;
      } 
      else if (isExecutivePersonality) {
        empathyResponseEN = `The candidate is under strain: [${difficultReason}].
- Maintain impeccable executive composure. Reframe failure as an operational learning.
- Say: "These kinds of friction points are typical in high-stakes environments. How would you pivot?"
- Be diplomat, warm but highly structured.`;

        empathyResponseFR = `Le candidat est en difficulté : [${difficultReason}].
- Conservez une posture de haut dirigeant, digne et posée. Présentez la difficulté comme une opportunité d'apprentissage.
- Dites : "Ce genre de point de friction est classique dans les environnements à fort enjeu. Comment réagiriez-vous ?"
- Soyez diplomate, chaleureux mais très structuré.`;
      }
    } 
    // B. ENCOURAGEMENT SYSTEM (MUST BE EARNED)
    else if (encouragementEarned) {
      if (isSupportivePersonality) {
        empathyResponseEN = `The candidate has earned genuine progress: [${encouragementReason}].
- Warmly reward their growth! Highlight specific clarity or structure: "That's a beautifully structured response," "I really appreciate how clearly you mapped out that decision."
- Elevate their confidence, keeping the conversation warm.`;

        empathyResponseFR = `Le candidat a mérité un encouragement : [${encouragementReason}].
- Félicitez chaleureusement ses progrès ! Saluez la structure de sa réponse : "C'est une réponse magnifiquement structurée," "J'apprécie beaucoup la clarté avec laquelle vous avez décrit cette décision."`;
      } 
      else if (isDemandingPersonality) {
        empathyResponseEN = `The candidate has earned progress: [${encouragementReason}].
- Keep standards high, but acknowledge the precision: "That's a very solid breakdown. Let's take that standard and push it to the next limit."
- Transition to a deeper architectural challenge immediately.`;

        empathyResponseFR = `Le candidat a fait ses preuves : [${encouragementReason}].
- Gardez des exigences élevées, tout en saluant la précision : "C'est une analyse très solide. Partons de là pour aller un cran plus loin."
- Enchaînez immédiatement sur un défi technique ou opérationnel plus poussé.`;
      } 
      else if (isExecutivePersonality) {
        empathyResponseEN = `The candidate has demonstrated executive quality: [${encouragementReason}].
- Acknowledge with sophisticated, diplomatic praise: "Your strategic framing is highly clear. It shows high maturity."
- Transition naturally to organizational or vision-oriented themes.`;

        empathyResponseFR = `Le candidat a démontré une stature de leader : [${encouragementReason}].
- Saluez son propos avec une élégance diplomatique : "Votre cadrage stratégique est particulièrement mûr. Cela démontre une belle hauteur de vue."
- Passez naturellement à des thèmes organisationnels ou de vision long terme.`;
      }
    } 
    // C. GENERAL EMPATHETIC PRESENCE
    else {
      empathyResponseEN = `The candidate is in a stable state. Maintain a balanced, human interaction. Ensure you actively listen. If they mention past achievements or failures, respect and acknowledge them briefly before moving to the next item.`;
      empathyResponseFR = `Le candidat est dans un état stable. Maintenez une interaction équilibrée et humaine. Restez à l'écoute active. S'il mentionne des succès ou des échecs passés, saluez-les brièvement avant de relancer.`;
    }

    // D. LONG-TERM INTERVIEW JOURNEY RECOLLECTION
    let memoryRecallBonus = "";
    if (state.contextMemory?.experiences && state.contextMemory.experiences.length > 0 && turn > 4) {
      memoryRecallBonus = isEng 
        ? `\n- Long-term recollection check: Since we are past Turn 4, if relevant, subtly recognize the candidate's journey (e.g. "You seem much more confident discussing structural failures now than at the start of our talk").`
        : `\n- Rappel du parcours long terme : Puisque nous avons dépassé le tour 4, si pertinent, soulignez subtilement sa progression (ex : "Vous semblez bien plus à l'aise pour aborder les échecs structurels qu'au tout début de notre entretien").`;
    }

    return isEng ? `
====================================================
RECRUITER EMPATHY ENGINE ASSESSMENT (PHASE 6)
====================================================
- Candidate Comfort Score: ${metrics.comfortScore}%
- Candidate Cognitive Workload: ${metrics.workloadScore}%
- Candidate Motivation Level: ${metrics.motivationScore}%
- Candidate Recovery Resilience Rate: ${metrics.recoveryRate}%

EMPATHETIC DIRECTIVES:
- Pacing: ${interactionPacing}
- Behavioral Adaptation:
${empathyResponseEN}${memoryRecallBonus}
` : `
====================================================
ÉVALUATION DU MOTEUR D'EMPATHIE DU RECRUTEUR (PHASE 6)
====================================================
- Score de Confort du Candidat : ${metrics.comfortScore}%
- Surcharge Cognitive : ${metrics.workloadScore}%
- Niveau de Motivation : ${metrics.motivationScore}%
- Taux de Résilience & Récupération : ${metrics.recoveryRate}%

DIRECTIVES D'EMPATHIE :
- Rythme : ${interactionPacing}
- Adaptation du Comportement :
${empathyResponseFR}${memoryRecallBonus}
`;
  }

  /**
   * Generates a concrete, evidence-backed empathy insight
   */
  private static generateEmpathyInsight(
    turn: number,
    metrics: EmpathyMetrics,
    hasDifficult: boolean,
    difficultReason: string,
    encouragementEarned: boolean,
    encouragementReason: string,
    isEng: boolean
  ): string {
    if (hasDifficult) {
      if (difficultReason === 'cognitive_pressure') {
        return isEng
          ? `Turn ${turn}: Supportive adaptation triggered due to high mental workload (${metrics.workloadScore}%) and elevated anxiety.`
          : `Tour ${turn} : Ajustement bienveillant déclenché en raison d'une forte surcharge cognitive (${metrics.workloadScore}%) et de stress.`;
      }
      if (difficultReason === 'candidate_apology') {
        return isEng
          ? `Turn ${turn}: Gentle re-focus provided after candidate apologized, restoring conversational comfort.`
          : `Tour ${turn} : Recadrage rassurant apporté après des excuses du candidat, restaurant la sécurité émotionnelle.`;
      }
      if (difficultReason === 'memory_blank') {
        return isEng
          ? `Turn ${turn}: Patience protocol activated after memory blank, allowing candidate comfortable retrieval space.`
          : `Tour ${turn} : Protocole de patience activé après un oubli de mémoire, laissant au candidat un temps d'accès confortable.`;
      }
      return isEng
        ? `Turn ${turn}: Comfort coaching invoked to manage sudden conversational freeze.`
        : `Tour ${turn} : Soutien conversationnel déployé suite à un gel soudain du dialogue.`;
    }

    if (encouragementEarned) {
      if (encouragementReason === 'excellence') {
        return isEng
          ? `Turn ${turn}: Strategic reinforcement earned after candidate provided exceptionally structured STAR evidence.`
          : `Tour ${turn} : Renforcement stratégique mérité après une réponse STAR exceptionnellement bien structurée.`;
      }
      return isEng
        ? `Turn ${turn}: Active progress validation rewarded as candidate demonstrated rapid confidence recovery (+15%).`
        : `Tour ${turn} : Validation de progression accordée alors que le candidat montre un fort rétablissement de confiance (+15%).`;
    }

    return isEng
      ? `Turn ${turn}: Composed empathetic presence maintained. Comfort level remains optimal (${metrics.comfortScore}%).`
      : `Tour ${turn} : Présence empathique stable maintenue. Le niveau de confort reste optimal (${metrics.comfortScore}%).`;
  }
}
