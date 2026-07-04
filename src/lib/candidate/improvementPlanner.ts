import { CandidateState } from './candidateState';

export class ImprovementPlannerEngine {
  /**
   * Regenerates objectives and suggests dynamic learning/practice structures.
   */
  public static updateImprovementPlan(state: CandidateState): void {
    const digitalTwin = state.digitalTwin;
    const sortedComps = Object.values(digitalTwin).sort((a, b) => a.score - b.score);

    const lowest = sortedComps[0]?.id || 'communication';
    const nextLowest = sortedComps[1]?.id || 'ownership';

    const planner = state.improvementPlanner;

    // Clear and rebuild priorities
    planner.priorityCompetencies = [lowest, nextLowest];

    // Build resources dynamically
    planner.learningResources = [
      {
        title: `Ultimate Practice Module: Mastering ${state.digitalTwin[lowest]?.name || lowest}`,
        url: '#',
        category: 'Skill Improvement'
      },
      {
        title: `Conquering Gaps in ${state.digitalTwin[nextLowest]?.name || nextLowest}`,
        url: '#',
        category: 'Supplementary Course'
      }
    ];

    // Dynamic suggestions
    if (lowest === 'communication') {
      planner.immediateImprovements = [
        'Pause for 2 full seconds before answering to structure thoughts',
        'Eliminate conversational filler triggers like "like", "um", "you know"',
        'Focus on short, high-level structural delivery'
      ];
      planner.weeklyObjectives = [
        'Complete 3 guided audio drills with zero verbal pauses',
        'Integrate exact revenue or time metrics into your core introduction'
      ];
      planner.monthlyObjectives = [
        'Sustain an answer clarity index greater than 80%',
        'Deliver a continuous 3-minute executive pitch with fluent phrasing'
      ];
      planner.suggestedPracticeSessions = ['Concision Bootcamp', 'Speed Delivery Drill'];
    } else if (lowest === 'technical_skills' || lowest === 'problem_solving') {
      planner.immediateImprovements = [
        'State your core algorithmic/system choice before explaining minor code logic',
        'Frame system decisions using concrete design trade-offs (e.g., latency vs consistency)',
        'Check edge cases explicitly'
      ];
      planner.weeklyObjectives = [
        'Map out two full backend design schemas including database layers',
        'Analyze a performance failure scenario and explain the resolution'
      ];
      planner.monthlyObjectives = [
        'Establish reliable, high-signal technical readiness scores',
        'Develop a portfolio of 3 complex technical story drafts'
      ];
      planner.suggestedPracticeSessions = ['System Architecture Panel', 'Technical Deep-Dive Warmup'];
    } else if (lowest === 'leadership' || lowest === 'ownership') {
      planner.immediateImprovements = [
        'Emphasize your personal contribution rather than saying "we"',
        'Explain how you delegated tasks and held your team accountable',
        'Highlight the long-term project ROI values'
      ];
      planner.weeklyObjectives = [
        'Draft a comprehensive resolution story covering conflict with an engineering lead',
        'Practice a 1-minute brief suitable for executive-level management'
      ];
      planner.monthlyObjectives = [
        'Elevate behavioral delegation confidence score to 80%',
        'Define a clear metric-focused product vision statement'
      ];
      planner.suggestedPracticeSessions = ['VP Mock Presentation', 'Accountability Drill'];
    } else {
      planner.immediateImprovements = [
        `Focus heavily on detailing Situation and Task boundaries for ${lowest.replace('_', ' ')}`,
        'Incorporate measurable results into every mock answer'
      ];
      planner.weeklyObjectives = [
        `Complete a specialized mock scenario covering ${lowest.replace('_', ' ')}`,
        `Outline 2 project examples showcasing ${nextLowest.replace('_', ' ')}`
      ];
      planner.monthlyObjectives = [
        `Improve average score for ${lowest.replace('_', ' ')} by 15 points`,
        'Engage in a full behavioral diagnostic test session'
      ];
      planner.suggestedPracticeSessions = ['Situational Masterclass', 'Behavioral Diagnostic Run'];
    }
  }
}
