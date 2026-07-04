import { EmotionState } from './conversationState';

export class EmotionEngine {
  static createInitialState(): EmotionState {
    return {
      confidence: 50,
      stress: 40,
      hesitation: 30,
      enthusiasm: 50,
      certainty: 50,
      frustration: 10,
      engagement: 60
    };
  }

  /**
   * Analyzes candidate's language patterns to estimate conversational emotional parameters
   */
  static analyzeText(text: string, previousState: EmotionState): EmotionState {
    const state = { ...previousState };
    const lower = text.toLowerCase();

    // 1. Stress markers
    const stressWords = [
      'stressed', 'nervous', 'anxious', 'scared', 'difficult', 'panic', 'overwhelmed',
      'hard to say', 'not sure', 'confused', 'uncomfortable', 'stressé', 'anxieux',
      'panique', 'dur à dire', 'pas sûr', 'confus', 'perdu'
    ];
    let stressHits = 0;
    stressWords.forEach(w => { if (lower.includes(w)) stressHits++; });
    if (stressHits > 0) {
      state.stress = Math.min(100, state.stress + stressHits * 15);
      state.confidence = Math.max(10, state.confidence - stressHits * 10);
    } else {
      state.stress = Math.max(10, state.stress - 3); // natural decay of stress over safe turns
    }

    // 2. Hesitation markers (disfluencies, trailing thoughts, filler triggers)
    const hesitationWords = [
      'um', 'uh', 'er', 'ah', 'like', 'i guess', 'maybe', 'sort of', 'kind of', 'euh', 'ben',
      'genre', 'du coup', 'je suppose', 'peut-être', 'je ne sais pas', 'un peu'
    ];
    let hesitationHits = 0;
    hesitationWords.forEach(w => {
      const regex = new RegExp(`\\b${w}\\b`, 'g');
      const matches = lower.match(regex);
      if (matches) hesitationHits += matches.length;
    });
    if (hesitationHits > 0) {
      state.hesitation = Math.min(100, state.hesitation + hesitationHits * 12);
      state.certainty = Math.max(10, state.certainty - hesitationHits * 8);
    } else {
      state.hesitation = Math.max(10, state.hesitation - 5);
    }

    // 3. Confidence & Certainty markers
    const confidenceWords = [
      'absolutely', 'definitely', 'successfully', 'solved', 'delivered', 'expert', 'confident',
      'clearly', 'strong', 'managed', 'led', 'certainly', 'absolument', 'clairement', 'résolu',
      'parfaitement', 'dirigé', 'géré', 'expert', 'confiant'
    ];
    let confidenceHits = 0;
    confidenceWords.forEach(w => { if (lower.includes(w)) confidenceHits++; });
    if (confidenceHits > 0) {
      state.confidence = Math.min(100, state.confidence + confidenceHits * 12);
      state.certainty = Math.min(100, state.certainty + confidenceHits * 10);
      state.stress = Math.max(10, state.stress - confidenceHits * 8);
    }

    // 4. Enthusiasm & Engagement
    const enthusiasmWords = [
      'excited', 'love', 'passionate', 'glad', 'great', 'awesome', 'interest', 'happy',
      'passionné', 'ravi', 'génial', 'super', 'intéressant', 'plaisir', 'adore'
    ];
    let enthusiasmHits = 0;
    enthusiasmWords.forEach(w => { if (lower.includes(w)) enthusiasmHits++; });
    if (enthusiasmHits > 0) {
      state.enthusiasm = Math.min(100, state.enthusiasm + enthusiasmHits * 15);
      state.engagement = Math.min(100, state.engagement + enthusiasmHits * 10);
    }

    // 5. Frustration markers
    const frustrationWords = [
      'annoyed', 'frustrated', 'stupid', 'ridiculous', 'hate', 'wrong', 'bother', 'pointless',
      'frustré', 'énervé', 'ridicule', 'marre', 'faux', 'inutile'
    ];
    let frustrationHits = 0;
    frustrationWords.forEach(w => { if (lower.includes(w)) frustrationHits++; });
    if (frustrationHits > 0) {
      state.frustration = Math.min(100, state.frustration + frustrationHits * 20);
      state.engagement = Math.max(10, state.engagement - frustrationHits * 5);
    } else {
      state.frustration = Math.max(0, state.frustration - 8);
    }

    // Ensure engagement naturally correlates with confidence and enthusiasm
    state.engagement = Math.min(100, Math.max(10, (state.confidence + state.enthusiasm) / 2));

    return state;
  }
}
