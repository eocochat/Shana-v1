import { ConversationState, RecruiterBrainTurn } from './conversationState';

export class RecruiterBrainEngine {
  /**
   * Initializes the recruiter brain turn history list if not present
   */
  static getOrInitializeTurns(state: ConversationState): RecruiterBrainTurn[] {
    return state.recruiterBrainTurns || [];
  }

  /**
   * Evaluates the candidate response from a pure recruiter reasoning perspective
   */
  static processTurn(state: ConversationState, userInput: string, targetRole: string): RecruiterBrainTurn {
    const text = userInput.trim().toLowerCase();
    
    // 1. Analyze what we learned
    let learnedSummary = "Candidate explained their general background and experience.";
    if (text.includes("team") || text.includes("led") || text.includes("manage")) {
      learnedSummary = "Learned about candidate's team coordination and scope of responsibility.";
    } else if (text.includes("fix") || text.includes("solved") || text.includes("incident") || text.includes("bug")) {
      learnedSummary = "Learned about candidate's hands-on problem solving capabilities and technical resilience.";
    } else if (text.includes("designed") || text.includes("architecture") || text.includes("built")) {
      learnedSummary = "Learned about candidate's design decisions and technical leadership.";
    } else if (text.length > 200) {
      learnedSummary = "Learned detailed behavioral context about a specific project execution.";
    }

    // 2. Assess Credibility (Do I believe this answer?)
    // Recruiters look for specific metrics, numbers, and STAR structure completeness
    const starScore = state.coachingData.starCompletenessTrend[state.coachingData.starCompletenessTrend.length - 1] || 50;
    const hasNumbers = /\d+/.test(userInput);
    
    let credibilityScore = 60; // baseline
    if (starScore > 75) credibilityScore += 15;
    if (hasNumbers) credibilityScore += 15;
    if (state.emotionState.certainty > 70) credibilityScore += 10;
    if (userInput.length < 50) credibilityScore -= 20; // vague/too short answers lose credibility
    credibilityScore = Math.max(10, Math.min(100, credibilityScore));

    // 3. What competency was verified?
    let competencyVerified = "Communication";
    if (text.includes("led") || text.includes("mentor") || text.includes("manage") || text.includes("guided")) {
      competencyVerified = "Leadership";
    } else if (text.includes("chose") || text.includes("decided") || text.includes("reason") || text.includes("because")) {
      competencyVerified = "Decision Making";
    } else if (text.includes("code") || text.includes("tech") || text.includes("system") || text.includes("react") || text.includes("api") || text.includes("database")) {
      competencyVerified = "Technical";
    } else if (text.includes("pressure") || text.includes("deadline") || text.includes("stress") || text.includes("difficult")) {
      competencyVerified = "Stress Resistance";
    } else if (userInput.length > 150 && starScore > 60) {
      competencyVerified = "Storytelling";
    }

    // 4. Which competency is missing?
    // Determine missing based on turn and what has been verified
    const turns = state.recruiterBrainTurns || [];
    const verifiedSoFar = turns.map(t => t.competencyVerified);
    
    let competencyMissing = "Technical";
    if (!verifiedSoFar.includes("Leadership")) {
      competencyMissing = "Leadership";
    } else if (!verifiedSoFar.includes("Decision Making")) {
      competencyMissing = "Decision Making";
    } else if (!verifiedSoFar.includes("Stress Resistance")) {
      competencyMissing = "Stress Resistance";
    } else if (!verifiedSoFar.includes("Communication")) {
      competencyMissing = "Communication";
    }

    // 5. Decide stance: challenge, support, or move on
    let stance: 'challenge' | 'support' | 'move_on' = 'support';
    if (credibilityScore < 55 || starScore < 45) {
      stance = 'challenge'; // Probe deeper because details are weak or missing
    } else if (credibilityScore > 80 && starScore > 75) {
      stance = 'move_on'; // Sufficient proof, proceed to next topic
    } else {
      stance = 'support'; // Steady, encourage more detail
    }

    // 6. Do we have enough evidence?
    const evidenceSufficient = credibilityScore >= 70 && starScore >= 65 && userInput.length > 100;

    return {
      learnedSummary,
      credibilityScore,
      competencyVerified,
      competencyMissing,
      stance,
      evidenceSufficient
    };
  }
}
