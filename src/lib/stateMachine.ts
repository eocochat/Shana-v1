import { ShanaEventTracker } from './events';

export type ShanaState =
  | 'IDLE'
  | 'INTERVIEW_STARTING'
  | 'QUESTION_ACTIVE'
  | 'WAITING_ANSWER'
  | 'PROCESSING'
  | 'FEEDBACK_GENERATION'
  | 'COMPLETED'
  | 'FAILED';

export interface TransitionResult {
  success: boolean;
  message?: string;
  newState: ShanaState;
}

// Strict transitions conforming to Phase 3 design rules
const VALID_TRANSITIONS: Record<ShanaState, ShanaState[]> = {
  IDLE: ['INTERVIEW_STARTING'],
  INTERVIEW_STARTING: ['QUESTION_ACTIVE', 'FAILED', 'IDLE'],
  QUESTION_ACTIVE: ['WAITING_ANSWER', 'FAILED', 'IDLE'],
  WAITING_ANSWER: ['PROCESSING', 'FAILED', 'IDLE'],
  PROCESSING: ['QUESTION_ACTIVE', 'FEEDBACK_GENERATION', 'FAILED', 'IDLE'],
  FEEDBACK_GENERATION: ['COMPLETED', 'FAILED', 'IDLE'],
  COMPLETED: ['IDLE'],
  FAILED: ['IDLE', 'INTERVIEW_STARTING']
};

export class SessionStateMachine {
  private userId: string;
  private sessionId: string;
  private currentState: ShanaState;

  constructor(userId: string, sessionId: string, initialState: ShanaState = 'IDLE') {
    this.userId = userId || 'usr_guest';
    this.sessionId = sessionId || 'sess_temp';
    this.currentState = initialState;

    // Failsafe recovery system: recover the latest active state of this session
    if (this.sessionId !== 'sess_temp') {
      const persisted = localStorage.getItem(`shana_active_session_state_${this.sessionId}`);
      if (persisted) {
        this.currentState = persisted as ShanaState;
        console.log(`[SHANA SESSION ENGINE] Restored state "${this.currentState}" from localStorage for session ${this.sessionId}`);
      } else {
        this.currentState = this.recoverFromLogs();
        localStorage.setItem(`shana_active_session_state_${this.sessionId}`, this.currentState);
      }
    }
  }

  /**
   * Gets the current state
   */
  public getState(): ShanaState {
    return this.currentState;
  }

  /**
   * Set state directly (only for internal sync or emergency recovery)
   */
  public forceState(state: ShanaState): void {
    const oldState = this.currentState;
    this.currentState = state;
    localStorage.setItem(`shana_active_session_state_${this.sessionId}`, state);
    this.logTransition(oldState, state, { reason: 'Force/Sync transition' });
  }

  /**
   * Validates and transitions to a new state atomically
   */
  public transitionTo(nextState: ShanaState, metadata: Record<string, any> = {}): TransitionResult {
    // Escape hatch: Transition to IDLE is always allowed to prevent getting stuck
    if (nextState === 'IDLE') {
      const oldState = this.currentState;
      this.currentState = 'IDLE';
      localStorage.setItem(`shana_active_session_state_${this.sessionId}`, 'IDLE');
      this.logTransition(oldState, 'IDLE', { reason: 'Reset to IDLE', ...metadata });
      return { success: true, newState: 'IDLE' };
    }

    // Wildcard: Transition to FAILED is always allowed (emergency failure/interruption)
    if (nextState === 'FAILED') {
      const oldState = this.currentState;
      this.currentState = 'FAILED';
      localStorage.setItem(`shana_active_session_state_${this.sessionId}`, 'FAILED');
      this.logTransition(oldState, 'FAILED', { reason: 'Emergency transition to FAILED', ...metadata });
      return { success: true, newState: 'FAILED' };
    }

    const allowed = VALID_TRANSITIONS[this.currentState] || [];
    if (!allowed.includes(nextState)) {
      const errorMsg = `Invalid state transition: Cannot transition from "${this.currentState}" to "${nextState}".`;
      console.warn(`[SHANA SESSION ENGINE] ${errorMsg}`);
      return { success: false, message: errorMsg, newState: this.currentState };
    }

    const previousState = this.currentState;
    this.currentState = nextState;
    localStorage.setItem(`shana_active_session_state_${this.sessionId}`, nextState);
    this.logTransition(previousState, nextState, metadata);

    return { success: true, newState: nextState };
  }

  /**
   * Locking helper: returns true if current execution state is locked
   */
  public isLocked(): boolean {
    return this.currentState === 'PROCESSING';
  }

  /**
   * Action guard: can submit an answer
   */
  public canSubmitAnswer(): boolean {
    return this.currentState === 'WAITING_ANSWER' && !this.isLocked();
  }

  /**
   * Action guard: can request next question
   */
  public canNextQuestion(): boolean {
    return this.currentState === 'QUESTION_ACTIVE' && !this.isLocked();
  }

  /**
   * Action guard: can start a new interview session
   */
  public canStartNewInterview(): boolean {
    return (this.currentState === 'IDLE' || this.currentState === 'COMPLETED' || this.currentState === 'FAILED') && !this.isLocked();
  }

  /**
   * Handles timeout when in WAITING_ANSWER state
   */
  public handleTimeout(action: 'continue' | 'pause' = 'continue'): TransitionResult {
    if (this.currentState !== 'WAITING_ANSWER') {
      return { success: false, message: 'Timeout can only be processed when WAITING_ANSWER.', newState: this.currentState };
    }

    // Log timeout_detected event
    ShanaEventTracker.logEvent(this.userId, this.sessionId, 'answer_timeout', {
      timestamp: new Date().toISOString(),
      action: action,
      context: {
        currentState: this.currentState,
        sessionId: this.sessionId
      }
    });

    if (action === 'continue') {
      return this.transitionTo('PROCESSING', { reason: 'Timeout auto-continue triggered' });
    } else {
      ShanaEventTracker.logEvent(this.userId, this.sessionId, 'interview_paused', {
        reason: 'Timeout auto-pause triggered'
      });
      return { success: true, newState: this.currentState, message: 'Session paused on timeout.' };
    }
  }

  /**
   * Helper to write transition events
   */
  private logTransition(from: ShanaState, to: ShanaState, metadata: Record<string, any>): void {
    // Log the unified state_changed event required by Phase 3
    ShanaEventTracker.logEvent(this.userId, this.sessionId, 'state_changed', {
      fromState: from,
      toState: to,
      ...metadata
    });

    // Log general state_transition for compatibility with logs parser
    ShanaEventTracker.logEvent(this.userId, this.sessionId, 'state_transition', {
      fromState: from,
      toState: to,
      ...metadata
    });

    // Specific lifecycle events triggering according to transition
    if (to === 'INTERVIEW_STARTING') {
      ShanaEventTracker.logEvent(this.userId, this.sessionId, 'session_started', {
        ...metadata
      });
    } else if (to === 'PROCESSING') {
      ShanaEventTracker.logEvent(this.userId, this.sessionId, 'answer_processing_started', {
        ...metadata
      });
    } else if (to === 'FEEDBACK_GENERATION') {
      ShanaEventTracker.logEvent(this.userId, this.sessionId, 'feedback_generated', {
        ...metadata
      });
    } else if (to === 'COMPLETED') {
      ShanaEventTracker.logEvent(this.userId, this.sessionId, 'session_completed', {
        ...metadata
      });
    } else if (to === 'FAILED') {
      ShanaEventTracker.logEvent(this.userId, this.sessionId, 'session_failed', {
        ...metadata
      });
    }
  }

  /**
   * Failsafe recovery system. Reconstructs current state from append-only events list in localStorage.
   */
  public recoverFromLogs(): ShanaState {
    try {
      const events = ShanaEventTracker.getSessionEvents(this.userId, this.sessionId);
      if (events.length === 0) return 'IDLE';

      // Find the last transition/change event
      const transitions = events.filter(e => e.eventType === 'state_transition' || e.eventType === 'state_changed');
      if (transitions.length > 0) {
        const lastTransition = transitions[transitions.length - 1];
        if (lastTransition.payload && lastTransition.payload.toState) {
          const recovered = lastTransition.payload.toState as ShanaState;
          console.log(`[SHANA SESSION ENGINE] Recovered state "${recovered}" for session ${this.sessionId} from transition logs.`);
          return recovered;
        }
      }

      // Semantic fallback if no explicit transitions are logged yet
      const eventTypes = events.map(e => e.eventType);
      if (eventTypes.includes('interview_completed') || eventTypes.includes('session_completed')) return 'COMPLETED';
      if (eventTypes.includes('session_failed')) return 'FAILED';
      if (eventTypes.includes('insight_generated') || eventTypes.includes('score_generated') || eventTypes.includes('feedback_generated')) {
        return 'FEEDBACK_GENERATION';
      }
      if (eventTypes.includes('answer_submitted') || eventTypes.includes('answer_processing_started')) return 'PROCESSING';
      if (eventTypes.includes('question_asked') || eventTypes.includes('question_displayed')) return 'WAITING_ANSWER';
      if (eventTypes.includes('adaptation_triggered') || eventTypes.includes('adaptation_applied')) return 'QUESTION_ACTIVE';
      if (eventTypes.includes('interview_started') || eventTypes.includes('session_started')) return 'INTERVIEW_STARTING';

      return 'IDLE';
    } catch (e) {
      console.error('[SHANA SESSION ENGINE] Recovery failed, defaulting to IDLE:', e);
      return 'IDLE';
    }
  }
}
