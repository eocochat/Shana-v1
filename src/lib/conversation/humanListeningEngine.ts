import { ConversationState, EmotionState } from './conversationState';

export type SilenceType = 
  | 'Thinking' 
  | 'MemoryRecall' 
  | 'EmotionalPause' 
  | 'SearchingForWords' 
  | 'NaturalBreathing' 
  | 'ConversationEnding' 
  | 'MicroHesitation' 
  | 'TechnicalMicrophoneSilence' 
  | 'LongSilence';

export type ListeningState = 
  | 'explaining' 
  | 'reflecting' 
  | 'hesitating' 
  | 'emotional' 
  | 'confident' 
  | 'rambling' 
  | 'repeating' 
  | 'completed' 
  | 'continue_seeking' 
  | 'asking_implicit_question';

export type AvatarListeningEvent = 
  | 'Listening' 
  | 'Thinking' 
  | 'Waiting' 
  | 'Nodding' 
  | 'Preparing response' 
  | 'Reviewing notes' 
  | 'Maintaining eye contact';

export interface FlowPrediction {
  probabilityContinuation: number; // 0 - 100
  probabilityCompletion: number; // 0 - 100
  probabilityClarification: number; // 0 - 100
  probabilityAddExample: number; // 0 - 100
}

export interface ListeningObservation {
  timestamp: number;
  turn: number;
  silenceType: SilenceType;
  listeningState: ListeningState;
  prediction: FlowPrediction;
  insight: string;
}

export class HumanListeningEngine {
  /**
   * Main analyzer method called during candidate active turn or silence evaluation
   */
  static analyzeListeningTurn(
    text: string,
    silenceMs: number,
    emotion: EmotionState,
    turnNumber: number,
    recruiterId: string = 'corporate'
  ): {
    silenceType: SilenceType;
    listeningState: ListeningState;
    prediction: FlowPrediction;
    activeAvatarEvent: AvatarListeningEvent;
    listeningInsight: string;
  } {
    const silenceType = this.classifySilence(text, silenceMs, emotion);
    const listeningState = this.estimateListeningState(text, emotion, silenceMs);
    const prediction = this.predictFlow(text, emotion, silenceMs, silenceType);
    const activeAvatarEvent = this.determineAvatarEvent(listeningState, silenceType, recruiterId);
    const listeningInsight = this.generateListeningInsight(text, silenceType, listeningState, turnNumber);

    return {
      silenceType,
      listeningState,
      prediction,
      activeAvatarEvent,
      listeningInsight
    };
  }

  /**
   * Classify types of silences based on text context and temporal parameters
   */
  static classifySilence(text: string, silenceMs: number, emotion: EmotionState): SilenceType {
    const trimmed = text.trim().toLowerCase();
    
    if (silenceMs === 0) return 'MicroHesitation';
    if (silenceMs < 500) return 'MicroHesitation';
    if (silenceMs < 1200) {
      if (/(?:and|but|or|so|because|like|with|euh|donc|mais|car|parce que|et|ou|alors|en fait)$/i.test(trimmed)) {
        return 'SearchingForWords';
      }
      return 'NaturalBreathing';
    }

    // Memory recall cues
    const memoryRecallIndicators = [
      'let me think', 'hmm', 'uh', 'um', 'let\'s see', 'good question', 'how should i put this',
      'voyons', 'euh', 'bonne question', 'comment dire', 'je cherche mes mots', 'je me souviens'
    ];
    const hasMemoryRecallCues = memoryRecallIndicators.some(indicator => trimmed.endsWith(indicator) || trimmed.includes(indicator));

    // Emotional pause indicators
    if (emotion.stress > 65 || emotion.frustration > 55 || emotion.defensiveness && emotion.defensiveness > 50) {
      if (silenceMs > 1500) return 'EmotionalPause';
    }

    if (hasMemoryRecallCues) {
      return 'MemoryRecall';
    }

    if (silenceMs >= 3500) {
      return 'LongSilence';
    }

    if (silenceMs >= 2000) {
      if (trimmed.length > 5 && /[.!?]$/.test(trimmed)) {
        return 'ConversationEnding';
      }
      return 'Thinking';
    }

    // Default fallback
    if (silenceMs > 1500 && trimmed.length === 0) {
      return 'TechnicalMicrophoneSilence';
    }

    return 'Thinking';
  }

  /**
   * Estimate the current human listening state of the candidate
   */
  static estimateListeningState(text: string, emotion: EmotionState, silenceMs: number): ListeningState {
    const trimmed = text.trim().toLowerCase();
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // 1. Implicit question detection
    if (/(?:what do you think\??|does that make sense\??|right\??|don\'t you think\??|est-ce que ça fait sens\??|qu\'en pensez-vous\??|n\'est-ce pas\??)$/i.test(trimmed)) {
      return 'asking_implicit_question';
    }

    // 2. Completed answer state
    const trailingPunctuation = /[.!?]$/.test(trimmed);
    if (trailingPunctuation && silenceMs > 1500 && wordCount > 10) {
      return 'completed';
    }

    // 3. Rambling vs Repeating state
    if (wordCount > 180) {
      // Check redundancy/repetition score
      const uniqueWords = new Set(words);
      const uniqueRatio = uniqueWords.size / wordCount;
      if (uniqueRatio < 0.4) {
        return 'repeating';
      }
      return 'rambling';
    }

    // 4. Emotional state
    if (emotion.stress > 70 || emotion.primaryVibe === 'anxious') {
      return 'emotional';
    }

    // 5. Confident state
    if (emotion.confidence > 75 && emotion.primaryVibe === 'flow') {
      return 'confident';
    }

    // 6. Hesitating vs Reflecting
    if (emotion.hesitation > 60 || /(?:um|uh|euh|like|genre|du coup|actually|en fait)$/i.test(trimmed)) {
      return 'hesitating';
    }

    if (silenceMs > 1500 || emotion.cognitiveLoad && emotion.cognitiveLoad > 60) {
      return 'reflecting';
    }

    // 7. Explaining (Active Flow)
    if (wordCount > 15 && silenceMs < 1000) {
      return 'explaining';
    }

    return 'continue_seeking';
  }

  /**
   * Predict flow continuation and completed probabilities
   */
  static predictFlow(
    text: string,
    emotion: EmotionState,
    silenceMs: number,
    silenceType: SilenceType
  ): FlowPrediction {
    const trimmed = text.trim().toLowerCase();
    const trailingHesitations = /(?:and|but|or|so|because|like|with|euh|donc|mais|car|parce que|et|ou|alors|en fait)$/i.test(trimmed);
    const trailingPunctuation = /[.!?]$/.test(trimmed);

    let probabilityContinuation = 50;
    let probabilityCompletion = 50;
    let probabilityClarification = 10;
    let probabilityAddExample = 10;

    if (trailingHesitations) {
      probabilityContinuation = 85;
      probabilityCompletion = 15;
    } else if (trailingPunctuation) {
      probabilityContinuation = 20;
      probabilityCompletion = 80;
    }

    if (silenceType === 'MemoryRecall' || silenceType === 'SearchingForWords') {
      probabilityContinuation += 20;
      probabilityCompletion -= 20;
      probabilityAddExample += 30;
    }

    if (silenceType === 'LongSilence' || silenceType === 'ConversationEnding') {
      probabilityContinuation = 5;
      probabilityCompletion = 95;
    }

    if (emotion.hesitation > 65) {
      probabilityClarification += 40;
    }

    if (text.length > 250) {
      probabilityAddExample += 25;
    }

    // Keep values bounded between 0 and 100
    return {
      probabilityContinuation: Math.max(0, Math.min(100, probabilityContinuation)),
      probabilityCompletion: Math.max(0, Math.min(100, probabilityCompletion)),
      probabilityClarification: Math.max(0, Math.min(100, probabilityClarification)),
      probabilityAddExample: Math.max(0, Math.min(100, probabilityAddExample))
    };
  }

  /**
   * Expose avatar state events for visual rendering
   */
  static determineAvatarEvent(
    listeningState: ListeningState,
    silenceType: SilenceType,
    recruiterId: string
  ): AvatarListeningEvent {
    if (listeningState === 'completed') {
      return 'Preparing response';
    }
    if (listeningState === 'reflecting' || silenceType === 'MemoryRecall') {
      return 'Waiting';
    }
    if (listeningState === 'confident' || listeningState === 'explaining') {
      return 'Nodding';
    }
    if (silenceType === 'EmotionalPause') {
      return 'Maintaining eye contact';
    }
    if (listeningState === 'repeating' || listeningState === 'rambling') {
      return 'Reviewing notes';
    }
    if (silenceType === 'Thinking') {
      return 'Thinking';
    }
    return 'Listening';
  }

  /**
   * Generate listening insights to pass to notes and coaches
   */
  static generateListeningInsight(
    text: string,
    silenceType: SilenceType,
    listeningState: ListeningState,
    turn: number
  ): string {
    const trimmed = text.trim();
    if (trimmed.length === 0) return "Candidate began turn with thoughtful pause.";

    if (silenceType === 'MemoryRecall') {
      return `Turn ${turn}: Candidate engaged memory recall cues, indicating search for structured evidence.`;
    }
    if (silenceType === 'EmotionalPause') {
      return `Turn ${turn}: Candidate took an emotional pause to gather composure under pressure.`;
    }
    if (listeningState === 'rambling') {
      return `Turn ${turn}: Candidate showed rambling patterns with very long sentence structures.`;
    }
    if (listeningState === 'repeating') {
      return `Turn ${turn}: Candidate repeated previously established concepts, indicating circular answers.`;
    }
    if (listeningState === 'asking_implicit_question') {
      return `Turn ${turn}: Candidate sought immediate conversational alignment with an implicit question.`;
    }
    if (listeningState === 'confident') {
      return `Turn ${turn}: Candidate maintained high conversational fluid flow with confident pace.`;
    }
    
    return `Turn ${turn}: Dynamic human speaking pacing and natural conversational pauses observed.`;
  }

  /**
   * Generates dynamic directives for the LLM based on current listening analysis (HIU Phase 5)
   */
  static generateListeningDirectives(state: ConversationState, language: string): string {
    const isEng = language === 'English' || language === 'EN' || language === 'en';
    const lState = state.listeningState || 'completed';
    const sType = state.silenceType || 'Thinking';
    const pred = state.flowPrediction || {
      probabilityContinuation: 10,
      probabilityCompletion: 90,
      probabilityClarification: 10,
      probabilityAddExample: 10
    };

    if (isEng) {
      return `
====================================================
HUMAN LISTENING ENGINE ASSESSMENT (PHASE 5):
====================================================
- Current Silence Mode: [${sType}]
- Candidate Listening State: [${lState}]
- Continuation Intention Predictions:
  * Prob of continuation: ${pred.probabilityContinuation}%
  * Prob of completion: ${pred.probabilityCompletion}%
  * Prob of seeking clarification: ${pred.probabilityClarification}%
  * Prob of adding an example: ${pred.probabilityAddExample}%

INTERACTION ADAPTATIONS:
${
  sType === 'MemoryRecall' 
    ? '1. Candidate is visibly searching their memory. Acknowledge the depth of their thought process gently (e.g. "Take all the time you need," "I appreciate you digging deep for that example") and do not rush them.'
    : sType === 'EmotionalPause'
    ? '1. Candidate took an emotional breathing pause to steady themselves. Open with deep empathy and warmth, and lower the pressure. Allow positive reinforcement.'
    : sType === 'SearchingForWords'
    ? '1. Candidate was searching for words or phrasing. Be extremely encouraging, patient, and match their tempo to make them feel comfortable.'
    : '1. Respect their silence. Respond with conversational patience, avoiding any rushed, abrupt, or aggressive transition.'
}
${
  lState === 'rambling'
    ? '2. Candidate is beginning to ramble. Gently and politely guide them back on track (e.g., "That is a fascinating angle. Let\'s zoom into your specific role in that situation...") without sounding dismissive.'
    : lState === 'repeating'
    ? '2. Candidate is repeating themselves. Help them break the loop with a supportive, focused question (e.g., "I see how X was a core theme. How did that translate into the final outcome?").'
    : lState === 'asking_implicit_question'
    ? '2. Candidate asked a direct or implicit alignment question (e.g. "Does that make sense?"). Address it directly first! (e.g. "Yes, that makes perfect sense, especially the X part.") before moving forward.'
    : '2. Support their conversational style. Keep your pace well-aligned with their speaking flow.'
}
`;
    } else {
      return `
====================================================
ÉVALUATION DU MOTEUR D'ÉCOUTE HUMAINE (PHASE 5) :
====================================================
- Mode de silence actuel : [${sType}]
- État d'écoute du candidat : [${lState}]
- Prédictions de flux de continuation :
  * Probabilité de continuation : ${pred.probabilityContinuation}%
  * Probabilité de complétion : ${pred.probabilityCompletion}%
  * Probabilité de besoin de clarification : ${pred.probabilityClarification}%
  * Probabilité d'ajout d'exemple : ${pred.probabilityAddExample}%

ADAPTATIONS DU COMPORTEMENT :
${
  sType === 'MemoryRecall' 
    ? "1. Le candidat fait appel à sa mémoire. Saluez gentiment la profondeur de sa réflexion (ex : \"Prenez tout votre temps\", \"C'est une excellente chose de creuser cet exemple\") et ne le pressez pas."
    : sType === 'EmotionalPause'
    ? "1. Le candidat a pris une pause respiratoire ou émotionnelle pour se concentrer. Ouvrez avec beaucoup de bienveillance, de l'empathie et réduisez la pression."
    : sType === 'SearchingForWords'
    ? "1. Le candidat cherchait ses mots. Soyez encourageant, patient et alignez votre tempo sur le sien pour le mettre en confiance."
    : "1. Respectez son silence. Répondez avec une grande patience conversationnelle, en évitant toute transition brusque ou agressive."
}
${
  lState === 'rambling'
    ? "2. Le candidat a tendance à se perdre dans les détails. Recadrez-le gentiment et poliment (ex : \"C'est un angle passionnant. Si on se focalise un instant sur votre rôle précis dans cette situation...\") sans paraître dédaigneux."
    : lState === 'repeating'
    ? "2. Le candidat tourne en boucle. Aidez-le à sortir de cette répétition avec une question ciblée (ex : \"Je vois bien que X était un fil conducteur. Comment cela s'est-il traduit concrètement sur le résultat final ?\")."
    : lState === 'asking_implicit_question'
    ? "2. Le candidat a posé une question implicite d'alignement (ex: \"Est-ce que c'est clair ?\"). Répondez-y d'abord chaleureusement ! (ex : \"Oui, c'est parfaitement clair, surtout la partie sur X.\") avant de relancer."
    : "2. Soutenez son style d'expression. Conservez un rythme d'élocution adapté à sa dynamique de parole."
}
`;
    }
  }
}
