import { ConversationState } from './conversationState';
import { TimingEngine, TimingDecision } from './timingEngine';

export class TurnManager {
  /**
   * Evaluates the active turn transition based on user inputs and silence parameters
   */
  static evaluateTurnTransition(
    text: string,
    silenceMs: number,
    isManualSubmit: boolean
  ): { shouldTransition: boolean; decision: TimingDecision } {
    if (isManualSubmit) {
      return { shouldTransition: true, decision: 'FinishedSpeaking' };
    }

    const decision = TimingEngine.evaluateTurnTiming(text, silenceMs);
    const shouldTransition = (decision === 'FinishedSpeaking');

    return { shouldTransition, decision };
  }

  /**
   * Safely updates conversation state for a turn transition
   */
  static transitionToAI(state: ConversationState): ConversationState {
    return {
      ...state,
      isCandidateSpeaking: false,
      isThinking: true,
      currentTurn: state.currentTurn + 1
    };
  }

  static transitionToCandidate(state: ConversationState): ConversationState {
    return {
      ...state,
      isCandidateSpeaking: true,
      isThinking: false,
      lastAnswerTimestamp: Date.now()
    };
  }
}
