import { ConversationState, DigitalTwinState } from './conversationState';

export class DigitalTwinEngine {
  /**
   * Initializes a fresh, balanced Digital Twin profile
   */
  static createInitialTwin(): DigitalTwinState {
    return {
      communication: 70,
      leadership: 65,
      confidence: 70,
      decisionMaking: 65,
      star: 60,
      technical: 70,
      stressResistance: 65,
      storytelling: 60
    };
  }

  /**
   * Turn-by-turn evolutionary updates of the Candidate's Digital Twin
   */
  static updateTwin(state: ConversationState, userInput: string): DigitalTwinState {
    const twin = state.digitalTwin || this.createInitialTwin();
    const text = userInput.toLowerCase();
    
    // Create copy for safe updates
    const nextTwin = { ...twin };

    // 1. STAR Structuring Update (0.8x weight on state coaching STAR completeness)
    const currentStar = state.coachingData.starCompletenessTrend[state.coachingData.starCompletenessTrend.length - 1] || 60;
    nextTwin.star = Math.round(nextTwin.star * 0.7 + currentStar * 0.3);

    // 2. Confidence Update (aligned with emotional confidence state)
    const currentConfidence = state.emotionState.confidence;
    nextTwin.confidence = Math.round(nextTwin.confidence * 0.7 + currentConfidence * 0.3);

    // 3. Communication Update (Fluency, filler words deduction, sentence depth)
    const hasFillers = Object.values(state.coachingData.fillerWordsUsedCount).reduce((a, b) => a + b, 0) > 2;
    let turnCommScore = 75;
    if (userInput.length < 40) turnCommScore = 45; // too short
    if (hasFillers) turnCommScore -= 15;
    if (state.emotionState.hesitation > 50) turnCommScore -= 10;
    nextTwin.communication = Math.round(nextTwin.communication * 0.8 + Math.min(100, Math.max(20, turnCommScore)) * 0.2);

    // 4. Leadership Incrementor
    if (text.includes("led") || text.includes("mentor") || text.includes("manage") || text.includes("coordinate") || text.includes("responsibility")) {
      nextTwin.leadership = Math.min(100, nextTwin.leadership + 4);
    } else if (text.includes("helped") || text.includes("assisted")) {
      nextTwin.leadership = Math.min(100, nextTwin.leadership + 1);
    }

    // 5. Decision Making
    if (text.includes("chose") || text.includes("decided") || text.includes("architected") || text.includes("resolved") || text.includes("trade-off")) {
      nextTwin.decisionMaking = Math.min(100, nextTwin.decisionMaking + 5);
    }

    // 6. Technical Depth
    if (text.includes("code") || text.includes("react") || text.includes("database") || text.includes("api") || text.includes("system") || text.includes("pipeline") || text.includes("production")) {
      nextTwin.technical = Math.min(100, nextTwin.technical + 3);
    }

    // 7. Stress Resistance
    // High pressure state + low emotional stress = High stress resistance
    const pressureMultiplier = state.pressureLevel === 'Stress' ? 3 : state.pressureLevel === 'Demanding' ? 2 : 1;
    const isCalm = state.emotionState.stress < 45;
    if (isCalm && pressureMultiplier > 1) {
      nextTwin.stressResistance = Math.min(100, nextTwin.stressResistance + (2 * pressureMultiplier));
    } else if (!isCalm) {
      nextTwin.stressResistance = Math.max(10, nextTwin.stressResistance - 2);
    }

    // 8. Storytelling (Narrative richness and flow)
    if (userInput.length > 250 && nextTwin.star > 65) {
      nextTwin.storytelling = Math.min(100, nextTwin.storytelling + 4);
    } else if (userInput.length < 60) {
      nextTwin.storytelling = Math.max(10, nextTwin.storytelling - 3);
    }

    // Ensure values are within normal bounds [10, 100]
    for (const key of Object.keys(nextTwin) as Array<keyof DigitalTwinState>) {
      nextTwin[key] = Math.max(10, Math.min(100, nextTwin[key]));
    }

    return nextTwin;
  }
}
