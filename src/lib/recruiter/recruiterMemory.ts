import { RecruiterState, RecruiterMemoryState } from './recruiterState';

export class RecruiterMemoryEngine {
  public static addStrongExample(state: RecruiterState, example: string): void {
    if (!state.memory.strongExamples.includes(example)) {
      state.memory.strongExamples.push(example);
      state.reasoningLog.push(`Memory: Registered new strong candidate example: "${example}"`);
    }
  }

  public static addWeakExample(state: RecruiterState, example: string): void {
    if (!state.memory.weakExamples.includes(example)) {
      state.memory.weakExamples.push(example);
      state.reasoningLog.push(`Memory: Highlighted potential weak point/gap: "${example}"`);
    }
  }

  public static updateBehavior(state: RecruiterState, behavior: string): void {
    if (!state.memory.repeatedBehaviors.includes(behavior)) {
      state.memory.repeatedBehaviors.push(behavior);
    }
  }

  public static updateCommunicationStyle(state: RecruiterState, style: string): void {
    state.memory.communicationStyle = style;
  }

  public static updateCandidateEvolution(state: RecruiterState, currentStageText: string): void {
    state.memory.candidateEvolution = currentStageText;
  }

  public static generateFollowUpAngle(state: RecruiterState): string {
    const memory = state.memory;
    if (memory.weakExamples.length > 0) {
      return `Target and drill down on previous ambiguity: "${memory.weakExamples[0]}". Seek specific metrics or resolution.`;
    }
    if (memory.strongExamples.length > 0) {
      return `Bridge on top of strong example: "${memory.strongExamples[0]}" to test scale or structural ownership at a higher level.`;
    }
    return `Probe standard professional delivery patterns and assess core ownership details.`;
  }
}
