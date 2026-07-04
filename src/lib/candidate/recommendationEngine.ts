import { CandidateState } from './candidateState';

export class RecommendationEngine {
  /**
   * Refreshes recommendation nodes dynamically based on active gap priority.
   */
  public static updateRecommendations(state: CandidateState): void {
    const digitalTwin = state.digitalTwin;
    const sortedComps = Object.values(digitalTwin).sort((a, b) => a.score - b.score);
    const primaryGap = sortedComps[0]?.id || 'communication';

    const recs = state.recommendations;

    // 1. Assign interview difficulty level based on overall competence average
    const totalScore = Object.values(digitalTwin).reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = totalScore / Object.keys(digitalTwin).length;

    if (avgScore > 85) {
      recs.interviewDifficulty = 'Elite';
    } else if (avgScore > 70) {
      recs.interviewDifficulty = 'Advanced';
    } else if (avgScore > 50) {
      recs.interviewDifficulty = 'Intermediate';
    } else {
      recs.interviewDifficulty = 'Entry';
    }

    // 2. Map recommendations based on lowest competency gap
    if (primaryGap === 'communication') {
      recs.practiceSessions = [
        'Concisely framing answers: 90-second mock challenge',
        'Direct answering: Avoiding preambles and background descriptions'
      ];
      recs.learningPlans = [
        'Dynamic Speech Pace Tuning',
        'Elevating Vocal Confidence Markers'
      ];
      recs.companySimulations = [
        'Amazon Leadership and Communication Panel Prep',
        'Stripe Executive Summary Simulation'
      ];
      recs.dailyExercises = [
        'Explain what you ate for breakfast today under 30 seconds with no filler words',
        'Record yourself explaining a simple task with exactly three structural stages'
      ];
    } else if (primaryGap === 'technical_skills' || primaryGap === 'problem_solving') {
      recs.practiceSessions = [
        'Technical trade-offs analysis simulation',
        'Explaining slow databases to senior executives'
      ];
      recs.learningPlans = [
        'System Scalability and Microservices Mastery',
        'Dynamic Algorithmic Walkthrough Structure'
      ];
      recs.companySimulations = [
        'Google System Design Panel Prep',
        'Meta Software Engineer Tech Session'
      ];
      recs.dailyExercises = [
        'Compare database replication options out loud in 60 seconds',
        'Sketch a diagram of a load-balanced payment system'
      ];
    } else {
      recs.practiceSessions = [
        `Mastering key stories: ${primaryGap.replace('_', ' ')} situational drills`,
        'Active STAR technique outline validation'
      ];
      recs.learningPlans = [
        'Comprehensive Behavioral Interview Mastery',
        'High-Impact Delegation Framing'
      ];
      recs.companySimulations = [
        'Netflix high-autonomy situational test',
        'Apple executive alignment mock panel'
      ];
      recs.dailyExercises = [
        `Formulate one clean STAR headline for an example of ${primaryGap.replace('_', ' ')}`,
        'Name three measurable metrics from your last team contribution'
      ];
    }

    // Assign static recommended courses and career path items
    recs.careerPaths = ['Staff Engineer', 'VP of Engineering', 'Solutions Architect'];
    recs.courses = [
      'Mastering High-Scale Distributed Infrastructures',
      'Effective Speech Delivery for Corporate Directors'
    ];
  }
}
