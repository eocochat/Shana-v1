import { CandidateState } from './candidateState';

export class MilestoneEngine {
  /**
   * Scans candidate state and achievements to unlock milestones dynamically.
   */
  public static evaluateMilestones(state: CandidateState): string[] {
    const unlockedList: string[] = [];
    const motivation = state.motivation;
    const twin = state.digitalTwin;
    const readiness = state.readiness;
    const comm = state.communication;

    motivation.milestones.forEach(m => {
      // If already unlocked, skip
      if (m.unlockedAt) return;

      let meetsCriteria = false;

      switch (m.id) {
        case 'first_interview':
          if (state.memory.pastInterviewsCount > 0) meetsCriteria = true;
          break;

        case 'high_score_80':
          meetsCriteria = Object.values(twin).some(c => c.score >= 80);
          break;

        case 'communication_master':
          if (comm.answerClarity >= 80 && comm.fillerWordFrequency <= 1.5) meetsCriteria = true;
          break;

        case 'leadership_builder':
          if ((twin['leadership']?.score || 50) >= 80 || (twin['ownership']?.score || 50) >= 80) meetsCriteria = true;
          break;

        case 'star_expert':
          if ((twin['problem_solving']?.score || 50) >= 80 && (twin['decision_making']?.score || 50) >= 80) meetsCriteria = true;
          break;

        case 'technical_specialist':
          if ((twin['technical_skills']?.score || 50) >= 80) meetsCriteria = true;
          break;

        case 'hiring_ready':
          if (readiness.overallHiringReadiness.score >= 85) meetsCriteria = true;
          break;
      }

      if (meetsCriteria) {
        m.unlockedAt = new Date().toISOString();
        if (!motivation.unlockedMilestones.includes(m.id)) {
          motivation.unlockedMilestones.push(m.id);
        }
        unlockedList.push(m.title);
      }
    });

    return unlockedList;
  }
}
