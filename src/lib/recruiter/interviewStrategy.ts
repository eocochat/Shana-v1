import { RecruiterState, InterviewStage } from './recruiterState';
import { CompetencyCoverageEngine } from './competencyCoverage';

export class InterviewStrategyEngine {
  private static stageSequence: InterviewStage[] = [
    'Introduction',
    'Experience Validation',
    'Competency Discovery',
    'Leadership Assessment',
    'Problem Solving',
    'Behavioral Assessment',
    'Decision Making',
    'Motivation',
    'Candidate Questions',
    'Closing'
  ];

  /**
   * Evaluates if we should transition the stage, or dynamically skip any unnecessary stages.
   */
  public static evaluateStrategy(state: RecruiterState, answerCount: number): void {
    const strategy = state.strategy;
    const currentStage = strategy.currentStage;
    
    // Check if we can skip 'Leadership Assessment' or 'Problem Solving' if we already have strong evidence
    const hasLeadershipEvidence = state.competencies['leadership']?.coverage >= 60;
    const hasProblemSolvingEvidence = state.competencies['problem_solving']?.coverage >= 60;

    // Run dynamic skip logic
    if (currentStage === 'Competency Discovery') {
      if (hasLeadershipEvidence && !strategy.completedStages.includes('Leadership Assessment')) {
        strategy.skippedStages.push('Leadership Assessment');
        state.reasoningLog.push('Strategy: Dynamically SKIPPED "Leadership Assessment" stage because strong leadership evidence already exists.');
      }
      if (hasProblemSolvingEvidence && !strategy.completedStages.includes('Problem Solving')) {
        strategy.skippedStages.push('Problem Solving');
        state.reasoningLog.push('Strategy: Dynamically SKIPPED "Problem Solving" stage because strong problem solving evidence already exists.');
      }
    }

    // Determine progress on current stage based on answer count and coverage
    let progress = Math.min(100, (strategy.stageProgress[currentStage] || 0) + 34);
    strategy.stageProgress[currentStage] = progress;

    // Transition conditions
    const shouldTransition = progress >= 100 || CompetencyCoverageEngine.hasSufficientCoverage(state);

    if (shouldTransition) {
      if (!strategy.completedStages.includes(currentStage)) {
        strategy.completedStages.push(currentStage);
      }

      // Find next stage in sequence that has not been completed or skipped
      const currentIndex = this.stageSequence.indexOf(currentStage);
      let nextIndex = currentIndex + 1;

      while (nextIndex < this.stageSequence.length) {
        const potentialNext = this.stageSequence[nextIndex];
        if (!strategy.skippedStages.includes(potentialNext) && !strategy.completedStages.includes(potentialNext)) {
          strategy.currentStage = potentialNext;
          state.reasoningLog.push(`Strategy: Transitioned interview stage from "${currentStage}" to "${potentialNext}"`);
          break;
        }
        nextIndex++;
      }
    }

    // Update completion percentage inside confidence engine
    const completedOrSkipped = strategy.completedStages.length + strategy.skippedStages.length;
    state.confidence.interviewCompletion = Math.min(100, Math.round((completedOrSkipped / this.stageSequence.length) * 100));
  }

  public static getNextStage(currentStage: InterviewStage): InterviewStage | null {
    const idx = this.stageSequence.indexOf(currentStage);
    if (idx !== -1 && idx < this.stageSequence.length - 1) {
      return this.stageSequence[idx + 1];
    }
    return null;
  }
}
