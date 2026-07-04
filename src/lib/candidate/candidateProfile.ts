import { CandidateState, createDefaultCandidateState } from './candidateState';

export class CandidateProfileService {
  private static readonly STATE_PREFIX = 'shana_candidate_state_';

  /**
   * Retrieves or lazy-initializes a CandidateState for a specific user.
   */
  public static getCandidateState(userId: string | null): CandidateState {
    if (!userId) {
      return createDefaultCandidateState('usr_anonymous');
    }

    const key = `${this.STATE_PREFIX}${userId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse candidate state for userId:', userId, e);
    }

    // Lazy seed
    const defaultState = createDefaultCandidateState(userId);
    this.saveCandidateState(userId, defaultState);
    return defaultState;
  }

  /**
   * Persists the active CandidateState back to storage.
   */
  public static saveCandidateState(userId: string, state: CandidateState): void {
    const key = `${this.STATE_PREFIX}${userId}`;
    state.lastUpdated = new Date().toISOString();
    try {
      localStorage.setItem(key, JSON.stringify(state));
      // Broadcast update across listening views
      window.dispatchEvent(new Event('shana_progress_update'));
      window.dispatchEvent(new Event('shana_candidate_state_update'));
    } catch (e) {
      console.error('Failed to save candidate state for userId:', userId, e);
    }
  }

  /**
   * Safe check if a profile exists.
   */
  public static hasProfile(userId: string): boolean {
    const key = `${this.STATE_PREFIX}${userId}`;
    return localStorage.getItem(key) !== null;
  }
}
