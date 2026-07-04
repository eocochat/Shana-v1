import { CandidateState, LearningStyle } from './candidateState';

export class LearningEngine {
  /**
   * Evaluates historical candidate performance and practice consistency to classify their active learning style.
   */
  public static assessLearningStyle(state: CandidateState): void {
    const memory = state.memory;
    const motivation = state.motivation;
    const confidence = state.confidence;

    const totalPractices = motivation.unlockedMilestones.length + (motivation.streakCount * 2);
    const avgConfidence = confidence.beginningConfidence;

    let style: LearningStyle = 'Practice Oriented';

    if (totalPractices > 8 && avgConfidence > 75) {
      style = 'Fast Learner';
    } else if (avgConfidence < 50) {
      style = 'Needs Confidence Building';
    } else if (totalPractices > 4) {
      style = 'Visual/Structured';
    } else {
      style = 'Practice Oriented';
    }

    const learn = state.learning;
    learn.style = style;

    // Dynamically tweak adaptability metrics
    let adaptability = 60;
    if (style === 'Fast Learner') {
      adaptability = 88;
      learn.repetitionRequirement = 1;
    } else if (style === 'Needs Confidence Building') {
      adaptability = 45;
      learn.repetitionRequirement = 4;
    } else if (style === 'Practice Oriented') {
      adaptability = 70;
      learn.repetitionRequirement = 2;
    } else {
      adaptability = 75;
      learn.repetitionRequirement = 3;
    }

    learn.adaptabilityRate = Math.round((learn.adaptabilityRate * 0.7) + (adaptability * 0.3));
    learn.coachingReceptivity = Math.round((learn.coachingReceptivity * 0.9) + (75 + Math.random() * 20));
  }
}
