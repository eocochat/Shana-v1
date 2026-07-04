import { CandidateState } from './candidateState';

export class BehavioralProfileEngine {
  /**
   * Refines the candidate's behavioral markers after evaluating their responses.
   */
  public static updateBehavioralTraits(state: CandidateState, answer: string): void {
    const lower = answer.toLowerCase();
    const behav = state.behavioral;

    // 1. Leadership Style analysis
    let leadsCount = 0;
    const directiveWords = ['commanded', 'delegated', 'enforced', 'instructed', 'assigned', 'ordered'];
    const collaborativeWords = ['facilitated', 'coached', 'empowered', 'consulted', 'brainstormed', 'together'];

    directiveWords.forEach(w => { if (lower.includes(w)) leadsCount++; });
    collaborativeWords.forEach(w => { if (lower.includes(w)) leadsCount--; });

    if (leadsCount > 1) {
      behav.leadershipStyle = 'Directive Orchestrator';
    } else if (leadsCount < -1) {
      behav.leadershipStyle = 'Empathetic Facilitator';
    } else {
      behav.leadershipStyle = 'Adaptive Coordinator';
    }

    // 2. Ownership Index (taking responsibility vs shifting blame)
    let ownershipDelta = 55;
    if (lower.includes('my mistake') || lower.includes('i was responsible') || lower.includes('i owned') || lower.includes('accountable')) {
      ownershipDelta = 88;
    } else if (lower.includes('they did') || lower.includes('management decided') || lower.includes('not my job') || lower.includes('someone else')) {
      ownershipDelta = 35;
    }
    behav.ownershipIndex = Math.round((behav.ownershipIndex * 0.7) + (ownershipDelta * 0.3));

    // 3. Conflict Management Style
    let conflictPoints = 0; // Negative for avoider, positive for collaborator
    const activeWords = ['resolved', 'confronted', 'discussed', 'mediated', 'listened', 'aligned'];
    const passiveWords = ['ignored', 'avoided', 'waited', 'escalated', 'stepped back'];

    activeWords.forEach(w => { if (lower.includes(w)) conflictPoints++; });
    passiveWords.forEach(w => { if (lower.includes(w)) conflictPoints--; });

    if (conflictPoints > 1) {
      behav.conflictManagementStyle = 'Collaborative Solver';
    } else if (conflictPoints < -1) {
      behav.conflictManagementStyle = 'Passive Avoider';
    } else {
      behav.conflictManagementStyle = 'Compromising Negotiator';
    }

    // 4. Decision Making Style
    let decisionScore = 0; // Positive for analytical, negative for intuitive
    const analyticalWords = ['data', 'metrics', 'analyzed', 'compared', 'experiments', 'researched'];
    const intuitiveWords = ['felt', 'instinct', 'gut', 'thought', 'seemed', 'guessed'];

    analyticalWords.forEach(w => { if (lower.includes(w)) decisionScore++; });
    intuitiveWords.forEach(w => { if (lower.includes(w)) decisionScore--; });

    if (decisionScore > 1) {
      behav.decisionMakingStyle = 'Data-Driven Analytical';
    } else if (decisionScore < -1) {
      behav.decisionMakingStyle = 'Intuitive Pragmatist';
    } else {
      behav.decisionMakingStyle = 'Balanced / Practical';
    }

    // 5. General Behavioral Indexes (collaboration, initiative, curiosity, professionalMaturity)
    let collabDelta = 50;
    if (lower.includes('team') || lower.includes('we worked') || lower.includes('collaborated')) collabDelta += 25;
    behav.collaborationIndex = Math.round((behav.collaborationIndex * 0.7) + (collabDelta * 0.3));

    let initDelta = 50;
    if (lower.includes('initiated') || lower.includes('i started') || lower.includes('proactively') || lower.includes('proposed')) initDelta += 35;
    behav.initiativeIndex = Math.round((behav.initiativeIndex * 0.7) + (initDelta * 0.3));

    let curDelta = 50;
    if (lower.includes('learned') || lower.includes('explored') || lower.includes('curious') || lower.includes('researched')) curDelta += 35;
    behav.curiosityIndex = Math.round((behav.curiosityIndex * 0.7) + (curDelta * 0.3));

    let maturityDelta = 50;
    if (lower.includes('impact') || lower.includes('revenue') || lower.includes('business') || lower.includes('long-term')) maturityDelta += 30;
    behav.professionalMaturity = Math.round((behav.professionalMaturity * 0.7) + (maturityDelta * 0.3));
  }
}
