import { CandidateState } from './candidateState';

export class PersonalityProfileEngine {
  /**
   * Infers candidate personality style based on dialogue metrics.
   * This is used purely to personalize the conversational tone of the AI coach.
   */
  public static inferPersonalityTraits(state: CandidateState, answer: string): void {
    const lower = answer.toLowerCase();
    const pers = state.personality;

    // Reserved vs Assertive
    let assertivePoints = 50;
    const assertiveKeywords = ['led', 'directed', 'confronted', 'must', 'absolutely', 'asserted', 'drove'];
    const reservedKeywords = ['maybe', 'listened', 'quietly', 'observed', 'behind', 'supported'];

    assertiveKeywords.forEach(w => { if (lower.includes(w)) assertivePoints += 10; });
    reservedKeywords.forEach(w => { if (lower.includes(w)) assertivePoints -= 8; });

    pers.assertive = Math.round((pers.assertive * 0.7) + (Math.max(10, Math.min(100, assertivePoints)) * 0.3));
    pers.reserved = Math.round(100 - pers.assertive);

    // Analytical vs Reflective
    let analyticalPoints = 50;
    const analyticalKeywords = ['data', 'metric', 'code', 'database', 'system', 'measured', 'structure'];
    const reflectiveKeywords = ['felt', 'learned', 'mistake', 'grew', 'understood', 'empathy', 'values'];

    analyticalKeywords.forEach(w => { if (lower.includes(w)) analyticalPoints += 10; });
    reflectiveKeywords.forEach(w => { if (lower.includes(w)) analyticalPoints -= 10; });

    pers.analytical = Math.round((pers.analytical * 0.7) + (Math.max(10, Math.min(100, analyticalPoints)) * 0.3));
    pers.reflective = Math.round((pers.reflective * 0.7) + (Math.max(10, Math.min(100, 100 - analyticalPoints)) * 0.3));

    // Collaborative vs Confident
    let collaborativePoints = 50;
    if (lower.includes('team') || lower.includes('we') || lower.includes('partner') || lower.includes('share')) {
      collaborativePoints += 25;
    }
    pers.collaborative = Math.round((pers.collaborative * 0.7) + (Math.max(10, Math.min(100, collaborativePoints)) * 0.3));

    let confidentPoints = 50;
    if (lower.includes('expert') || lower.includes('achieved') || lower.includes('delivered') || lower.includes('strength')) {
      confidentPoints += 25;
    }
    pers.confident = Math.round((pers.confident * 0.7) + (Math.max(10, Math.min(100, confidentPoints)) * 0.3));

    // Adaptive trait
    let adaptivePoints = 50;
    if (lower.includes('changed') || lower.includes('pivoted') || lower.includes('adapted') || lower.includes('learned')) {
      adaptivePoints += 30;
    }
    pers.adaptive = Math.round((pers.adaptive * 0.7) + (Math.max(10, Math.min(100, adaptivePoints)) * 0.3));
  }
}
