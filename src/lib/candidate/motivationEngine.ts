import { CandidateState } from './candidateState';

export class MotivationEngine {
  /**
   * Tracks and increments daily streak counts and consistency scores.
   */
  public static recordDailyPractice(state: CandidateState): void {
    const motivation = state.motivation;
    const todayStr = new Date().toDateString();

    if (motivation.lastPracticeDate) {
      const lastDate = new Date(motivation.lastPracticeDate);
      const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(lastDate.toDateString()).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Continued streak
        motivation.streakCount += 1;
      } else if (diffDays > 1) {
        // Broken streak
        motivation.streakCount = 1;
      }
      // Same day does nothing to streak count
    } else {
      motivation.streakCount = 1;
    }

    motivation.lastPracticeDate = new Date().toISOString();

    // Re-evaluate consistency score
    motivation.consistencyScore = Math.min(100, 60 + (motivation.streakCount * 8));
  }
}
