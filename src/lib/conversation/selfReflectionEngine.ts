import { ConversationState, SelfReflectionState } from './conversationState';

export class SelfReflectionEngine {
  /**
   * Evaluates the conversational state and performance turn-by-turn.
   * Generates feedback and returns specific corrective prompt instructions.
   */
  static evaluatePerformance(state: ConversationState, userInput: string, language: string = 'English'): {
    selfReflection: SelfReflectionState;
    directivesEN: string;
    directivesFR: string;
  } {
    const isEng = language === 'English' || language === 'EN' || language === 'en';
    const reflection: SelfReflectionState = {
      ignoredKeyPointsCount: 0,
      repetitivenessWarning: false,
      temperatureAdjustment: 'maintain'
    };

    const evaluationNotes: string[] = [];
    const directEN: string[] = [];
    const directFR: string[] = [];

    // 1. Analyze Temperature (Warmth vs. Professionalism)
    // Check candidate emotional states like high stress, low confidence, or high frustration
    if (state.emotionState.stress > 65 || state.emotionState.confidence < 45 || state.emotionState.frustration > 50) {
      reflection.temperatureAdjustment = 'warm_up';
      evaluationNotes.push("Candidate shows stress or hesitation. I need to display high empathy and raise conversational warmth.");
      
      directEN.push("CRITICAL DIRECTIVE - INCREASE WARMTH: The candidate appears slightly stressed or less confident. Adjust your tone to be highly encouraging, warm, and supportive. Validate their effort gently before moving to your next question.");
      directFR.push("DIRECTIVE CRITIQUE - AUGMENTER LA CHALEUR : Le candidat semble stressé ou moins confiant. Adoptez un ton particulièrement chaleureux, encourageant et bienveillant. Valorisez brièvement son propos avant de relancer.");
    } else if (state.emotionState.frustration < 20 && state.emotionState.confidence > 80 && state.pressureLevel === 'Supportive') {
      reflection.temperatureAdjustment = 'cool_down';
      evaluationNotes.push("Candidate is highly confident and comfortable. I should transition to a more objective, professional recruiter stance.");
      
      directEN.push("DIRECTIVE - INCREASE PROFESSIONAL GRAVITAS: The candidate is highly comfortable and fluent. Transition your tone to be more structured, objective, and professionally poised.");
      directFR.push("DIRECTIVE - GRAVITÉ PROFESSIONNELLE : Le candidat est très à l'aise et fluide. Adoptez une posture plus structurée, objective et formelle.");
    }

    // 2. Check for Repetitiveness / Over-probing
    // If we've had multiple consecutive turns in the same mode, or topics already discussed are piling up
    if (state.contextMemory.topicsAlreadyDiscussed.length > 3) {
      reflection.repetitivenessWarning = true;
      evaluationNotes.push("Many follow-ups have been executed. I must ensure I do not lock into repetitive questioning patterns.");
      
      directEN.push("DIRECTIVE - COMPASS COHERENCE: You have conducted several deep-dives. Keep your next turn highly fresh, dynamically phrased, and introduce a pivot or a transition to a new topic to maintain natural conversational momentum.");
      directFR.push("DIRECTIVE - VIVACITÉ DU DIALOGUE : Vous avez déjà fait plusieurs relances approfondies. Veillez à ce que votre prochaine intervention soit dynamique et introduise une transition fluide vers un nouveau sujet.");
    }

    // 3. Check for Ignored Key Points
    // If candidate mentioned major companies or leadership examples but current turn is high
    const totalMemories = (state.contextMemory.companiesMentioned.length || 0) + 
                          (state.contextMemory.leadershipExamples.length || 0) +
                          (state.contextMemory.projects.length || 0);
    
    if (userInput.length > 80 && totalMemories > 0 && state.currentTurn > 2) {
      // Heuristic check: if they gave a lot of information, remind the AI to refer back to it
      evaluationNotes.push("Candidate shared rich experience details. Must reference back to prove deep active listening.");
      
      directEN.push("DIRECTIVE - ACTIVE LISTENING: The candidate just shared a rich piece of experience. Acknowledge a specific detail they mentioned (e.g., their leadership role or a company they worked at) before asking your next follow-up.");
      directFR.push("DIRECTIVE - ÉCOUTE ACTIVE : Le candidat vient de partager une expérience riche. Faites explicitement référence à un détail précis qu'il a mentionné (ex : son rôle de leader ou son entreprise) avant de relancer.");
    }

    reflection.lastEvaluation = evaluationNotes.join(" | ") || "Conversational alignment is optimal.";

    return {
      selfReflection: reflection,
      directivesEN: directEN.join("\n"),
      directivesFR: directFR.join("\n")
    };
  }
}
