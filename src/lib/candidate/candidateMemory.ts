import { CandidateState } from './candidateState';

export class CandidateMemoryEngine {
  /**
   * Appends relevant memories of strengths and weaknesses after evaluates.
   */
  public static commitToMemory(
    state: CandidateState,
    observedStrengths: string[],
    observedWeaknesses: string[]
  ): void {
    const mem = state.memory;
    mem.pastInterviewsCount += 1;

    // Track repeated weaknesses (add only if unique)
    observedWeaknesses.forEach(w => {
      const clean = w.trim();
      if (clean && !mem.repeatedWeaknesses.includes(clean)) {
        mem.repeatedWeaknesses.push(clean);
      }
    });

    // Track recurring strengths
    observedStrengths.forEach(s => {
      const clean = s.trim();
      if (clean && !mem.recurringStrengths.includes(clean)) {
        mem.recurringStrengths.push(clean);
      }
    });

    // Keep memory lists trimmed to important points
    if (mem.repeatedWeaknesses.length > 5) {
      mem.repeatedWeaknesses.shift();
    }
    if (mem.recurringStrengths.length > 5) {
      mem.recurringStrengths.shift();
    }

    mem.learningHistory.push(`Interview session #${mem.pastInterviewsCount} processed on ${new Date().toLocaleDateString()}`);
  }

  /**
   * Sets custom goals or target industries.
   */
  public static updateCareerFocus(
    state: CandidateState,
    careerGoals: string,
    targetCompanies: string[],
    preferredIndustries: string[]
  ): void {
    const mem = state.memory;
    if (careerGoals) mem.careerGoals = careerGoals;
    if (targetCompanies.length > 0) mem.targetCompanies = targetCompanies;
    if (preferredIndustries.length > 0) mem.preferredIndustries = preferredIndustries;
  }
}
