import { ConversationState } from './conversationState';

export interface AdaptiveParameters {
  struggling: boolean;
  performingWell: boolean;
  performanceScore: number;
  questionComplexity: string;
  followUpDepth: string;
  pace: 'slow' | 'normal' | 'rapid';
  silenceDuration: 'none' | 'brief' | 'deliberate' | 'poker-face';
  interruptionFrequency: 'none' | 'rare' | 'polite' | 'frequent';
  technicalVocabulary: string;
  confidenceExpectations: string;
}

export class AdaptiveIntelligenceEngine {
  /**
   * Evaluates candidate performance on the last few turns and calculates the adapted interview parameters.
   */
  static evaluateAdaptationState(state: ConversationState): AdaptiveParameters {
    const turns = state.recruiterBrainTurns || [];
    
    // Baseline defaults
    let performanceScore = 75;
    let struggling = false;
    let performingWell = false;

    if (turns.length > 0) {
      // Analyze performance based on the last 1 or 2 turns for high-frequency continuous adaptivity
      const lastTurns = turns.slice(-2);
      const scores = lastTurns.map(t => {
        const credibility = t.credibility ?? t.credibilityScore ?? 70;
        const specificity = t.specificity ?? 60;
        const star = t.starCompleteness ?? 50;
        const ownership = t.ownership ?? 60;
        return (credibility * 0.3) + (specificity * 0.25) + (star * 0.25) + (ownership * 0.2);
      });
      performanceScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    // Emotion state also influences struggling indicator
    const emotion = state.emotionState;
    const stressLevel = emotion ? emotion.stress : 50;
    const confidenceLevel = emotion ? emotion.confidence : 50;

    // Classification boundaries
    if (performanceScore < 62 || (stressLevel > 75 && confidenceLevel < 40)) {
      struggling = true;
    } else if (performanceScore >= 82 && confidenceLevel >= 70) {
      performingWell = true;
    }

    // 1. Question Complexity
    let questionComplexity = "Standard, structured professional inquiry. Avoid excessive theoretical depth while maintaining professional relevance.";
    if (struggling) {
      questionComplexity = "Extremely clear, supportive, and accessible questions. Stick to core concepts and basic scenarios. Avoid compound queries or academic traps.";
    } else if (performingWell) {
      questionComplexity = "Highly sophisticated, multi-layered problem scenarios. Ask about architectural design trade-offs, scalability, edge-case failure modes, and advanced system trade-offs.";
    }

    // 2. Follow-up Depth
    let followUpDepth = "Moderate follow-up depth. Probe logical gray areas when they arise.";
    if (struggling) {
      followUpDepth = "Gentle guiding inquiries. Avoid grilling or aggressive drilling. Help the candidate transition to adjacent topics where they can rebuild their momentum.";
    } else if (performingWell) {
      followUpDepth = "Deep, rigorous, multi-level drill-downs. Poke at logical gaps, ask for concrete metrics, question their specific technical ownership, and demand trade-off analysis.";
    }

    // 3. Pace
    let pace: 'slow' | 'normal' | 'rapid' = 'normal';
    if (struggling) {
      pace = 'slow';
    } else if (performingWell) {
      pace = 'rapid';
    }

    // 4. Silence Duration
    let silenceDuration: 'none' | 'brief' | 'deliberate' | 'poker-face' = 'brief';
    if (struggling) {
      silenceDuration = 'none';
    } else if (performingWell) {
      silenceDuration = 'poker-face';
    }

    // 5. Interruption Frequency
    let interruptionFrequency: 'none' | 'rare' | 'polite' | 'frequent' = 'polite';
    if (struggling) {
      interruptionFrequency = 'none';
    } else if (performingWell) {
      interruptionFrequency = 'frequent';
    }

    // 6. Technical Vocabulary
    let technicalVocabulary = "Standard, industry-appropriate professional vocabulary.";
    if (struggling) {
      technicalVocabulary = "Clear, standard, clean language. Minimize dense engineering jargon or confusing administrative acronyms.";
    } else if (performingWell) {
      technicalVocabulary = "Highly specialized technical terms, design patterns, microservices architectures, latency structures, cloud orchestrators, or rigorous leadership methodologies.";
    }

    // 7. Confidence Expectations
    let confidenceExpectations = "Standard professional confidence. Expect reasonable verbal structure and solid composure.";
    if (struggling) {
      confidenceExpectations = "Supportive, low-pressure standards. Be highly tolerant of minor verbal pauses, hesitations, or structural gaps. Offer reassuring pauses.";
    } else if (performingWell) {
      confidenceExpectations = "Exacting, executive-level standards. Expect total composure, concise and structured STAR delivery, zero filler words, and absolute poise under direct pushback.";
    }

    return {
      struggling,
      performingWell,
      performanceScore,
      questionComplexity,
      followUpDepth,
      pace,
      silenceDuration,
      interruptionFrequency,
      technicalVocabulary,
      confidenceExpectations
    };
  }

  /**
   * Generates continuous adaptation prompt directives to integrate into the response planner
   */
  static generateAdaptiveDirectives(state: ConversationState, language: string): string {
    const isEng = language === 'English' || language === 'EN' || language === 'en';
    const params = this.evaluateAdaptationState(state);

    return isEng ? `
====================================================
ADAPTIVE INTERVIEW INTELLIGENCE (PHASE 29)
====================================================
The system is continuously and dynamically monitoring candidate performance to calibrate the interview rigor.

CURRENT STATE: Candidate is ${params.struggling ? "STRUGGLING (Activating supportive coaching safeguards)" : params.performingWell ? "PERFORMING EXCELLENTLY (Activating maximum intellectual challenge)" : "PERFORMING STABLY"}
- Performance Metric Tracker: ${params.performanceScore}/100

DYNAMIC ADAPTATION TARGET PARAMETERS:
1. **Question Complexity**: ${params.questionComplexity}
2. **Follow-Up Depth**: ${params.followUpDepth}
3. **Pacing**: Speak at a ${params.pace} cadence to match their cognitive state.
4. **Silence Duration**: [Silence Mode: ${params.silenceDuration}] ${
      params.silenceDuration === 'none' 
        ? "Respond promptly and warmly without leaving any awkward pauses." 
        : "Introduce a deliberate, evaluating pause before starting your sentence to test their composure."
    }
5. **Interruption Frequency**: [Interruption Mode: ${params.interruptionFrequency}] ${
      params.interruptionFrequency === 'none' 
        ? "Do NOT interrupt. Let them finish fully." 
        : "If the candidate rambles or avoids specific metrics, interrupt them politely but firmly to request concrete numbers."
    }
6. **Technical Vocabulary**: ${params.technicalVocabulary}
7. **Confidence Expectations**: ${params.confidenceExpectations}
` : `
====================================================
INTELLIGENCE D'ENTRETIEN ADAPTATIVE (PHASE 29)
====================================================
Le système surveille en continu et de manière dynamique les performances du candidat pour calibrer la rigueur.

ÉTAT ACTUEL : Le candidat est ${params.struggling ? "EN DIFFICULTÉ (Activation des mesures de soutien bienveillantes)" : params.performingWell ? "TRÈS PERFORMANT (Activation du défi intellectuel maximum)" : "STABLE"}
- Score d'Analyse de Performance : ${params.performanceScore}/100

PARAMÈTRES D'ADAPTATION DYNAMIQUES :
1. **Complexité des Questions** : ${params.questionComplexity}
2. **Profondeur des Relances** : ${params.followUpDepth}
3. **Rythme de Parole** : Parlez à un rythme ${params.pace === 'slow' ? 'lent et posé' : params.pace === 'rapid' ? 'rapide et percutant' : 'standard'} pour vous adapter à leur état cognitif.
4. **Gestion des Silences** : [Mode Silence : ${params.silenceDuration}] ${
      params.silenceDuration === 'none' 
        ? "Répondez rapidement et chaleureusement sans laisser de blancs gênants." 
        : "Marquez une pause délibérée d'évaluation (1-2 secondes) avant d'entamer votre phrase pour tester leur aplomb."
    }
5. **Fréquence d'Interruption** : [Mode Interruption : ${params.interruptionFrequency}] ${
      params.interruptionFrequency === 'none' 
        ? "N'interrompez PAS le candidat. Laissez-le s'exprimer pleinement." 
        : "Si le candidat s'égare ou reste évasif, interrompez-le poliment mais fermement pour lui demander des chiffres ou des détails STAR précis."
    }
6. **Vocabulaire Technique** : ${params.technicalVocabulary}
7. **Attentes de Confiance** : ${params.confidenceExpectations}
`;
  }
}
