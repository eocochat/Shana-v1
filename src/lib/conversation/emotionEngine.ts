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
      engagement: 60,
      composure: 60,
      cognitiveLoad: 30,
      defensiveness: 10,
      imposterIndex: 20,
      flowStateRating: 50,
      primaryVibe: 'neutral',
      mentalFatigue: 15,
      comfortLevel: 65,
      motivationLevel: 70,
      recoveryAbility: 75,
      emotionalStability: 80,
      previousPrimaryVibe: 'neutral'
    };
  }

  /**
   * Analyzes candidate's language patterns to estimate conversational emotional parameters
   * hardened and evolved with rich behavioral, syntactic, and psychological indicators.
   */
  static analyzeText(text: string, previousState: EmotionState): EmotionState {
    const state = { ...previousState };
    const lower = text.toLowerCase();
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

    // --- 1. LINGUISTIC STYLE & SYNTACTIC ANALYSIS ---

    // Defensive/Dogmatic markers (represent high guard or intellectual defense)
    const defensiveWords = [
      'obviously', 'always', 'never', 'of course', 'no way', 'evidently', 'cliché', 'clearly',
      'évidemment', 'bien sûr', 'toujours', 'jamais', 'clairement', 'forcément', 'naturellement'
    ];
    let defensiveHits = 0;
    defensiveWords.forEach(w => { if (lower.includes(w)) defensiveHits++; });

    // Imposter/Self-minimizing markers (represent low confidence or insecurity)
    const imposterWords = [
      'just', 'only', 'basically', 'simply', 'kind of', 'sort of', 'maybe', 'probably', 'perhaps',
      'juste', 'seulement', 'simplement', 'un peu', 'petit', 'petite', 'peut-être', 'suppose'
    ];
    let imposterHits = 0;
    imposterWords.forEach(w => { if (lower.includes(w)) imposterHits++; });

    // Apologetic words (represent low posture or high pressure strain)
    const apologeticWords = [
      'sorry', 'excuse', 'apologize', 'pardon', 'my bad',
      'désolé', 'excusez', 'pardon', 'erreur de ma part'
    ];
    let apologeticHits = 0;
    apologeticWords.forEach(w => { if (lower.includes(w)) apologeticHits++; });

    // Fragmented phrasing / interrupted clauses (indicates search for words or speech anxiety)
    const fragmentationCount = (lower.split('-').length - 1) + (lower.split('—').length - 1) + (lower.split('...').length - 1);

    // --- 2. BASELINE EMOTION STATE CALCULATIONS (REFINED WITH BALLISTIC INERTIA) ---

    // Stress markers
    const stressWords = [
      'stressed', 'nervous', 'anxious', 'scared', 'difficult', 'panic', 'overwhelmed',
      'hard to say', 'not sure', 'confused', 'uncomfortable', 'stressé', 'anxieux',
      'panique', 'dur à dire', 'pas sûr', 'confus', 'perdu'
    ];
    let stressHits = 0;
    stressWords.forEach(w => { if (lower.includes(w)) stressHits++; });
    
    let observedStress = previousState.stress;
    if (stressHits > 0) {
      observedStress = Math.min(100, observedStress + stressHits * 12 + apologeticHits * 10);
    } else {
      observedStress = Math.max(10, observedStress - 4); // steady decay of stress
    }
    if (fragmentationCount > 2) {
      observedStress = Math.min(100, observedStress + fragmentationCount * 4);
    }

    // Hesitation markers
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
    
    let observedHesitation = previousState.hesitation;
    if (hesitationHits > 0) {
      observedHesitation = Math.min(100, observedHesitation + hesitationHits * 10 + imposterHits * 3);
    } else {
      observedHesitation = Math.max(10, observedHesitation - 5);
    }

    // Confidence & Certainty markers
    const confidenceWords = [
      'absolutely', 'definitely', 'successfully', 'solved', 'delivered', 'expert', 'confident',
      'clearly', 'strong', 'managed', 'led', 'certainly', 'absolument', 'clairement', 'résolu',
      'parfaitement', 'dirigé', 'géré', 'expert', 'confiant'
    ];
    let confidenceHits = 0;
    confidenceWords.forEach(w => { if (lower.includes(w)) confidenceHits++; });

    let observedConfidence = previousState.confidence;
    let observedCertainty = previousState.certainty;
    if (confidenceHits > 0) {
      observedConfidence = Math.min(100, observedConfidence + confidenceHits * 10 - apologeticHits * 8);
      observedCertainty = Math.min(100, observedCertainty + confidenceHits * 8 - imposterHits * 4);
    }
    // Length adjustments: extremely brief answers decay confidence; well-structured long answers boost it
    if (wordCount > 0 && wordCount < 15) {
      observedConfidence = Math.max(15, observedConfidence - 12);
      observedCertainty = Math.max(15, observedCertainty - 10);
    } else if (wordCount > 120) {
      observedConfidence = Math.min(100, observedConfidence + 5);
    }

    // Enthusiasm & Engagement
    const enthusiasmWords = [
      'excited', 'love', 'passionate', 'glad', 'great', 'awesome', 'interest', 'happy',
      'passionné', 'ravi', 'génial', 'super', 'intéressant', 'plaisir', 'adore'
    ];
    let enthusiasmHits = 0;
    enthusiasmWords.forEach(w => { if (lower.includes(w)) enthusiasmHits++; });

    let observedEnthusiasm = previousState.enthusiasm;
    if (enthusiasmHits > 0) {
      observedEnthusiasm = Math.min(100, observedEnthusiasm + enthusiasmHits * 12);
    } else {
      observedEnthusiasm = Math.max(15, observedEnthusiasm - 3);
    }

    // Frustration markers
    const frustrationWords = [
      'annoyed', 'frustrated', 'stupid', 'ridiculous', 'hate', 'wrong', 'bother', 'pointless',
      'frustré', 'énervé', 'ridicule', 'marre', 'faux', 'inutile'
    ];
    let frustrationHits = 0;
    frustrationWords.forEach(w => { if (lower.includes(w)) frustrationHits++; });

    let observedFrustration = previousState.frustration;
    if (frustrationHits > 0) {
      observedFrustration = Math.min(100, observedFrustration + frustrationHits * 18 + defensiveHits * 5);
    } else {
      observedFrustration = Math.max(0, observedFrustration - 6);
    }

    // Smooth emotion transitions (emotional ballistic damping)
    state.confidence = Math.round(previousState.confidence * 0.75 + observedConfidence * 0.25);
    state.stress = Math.round(previousState.stress * 0.75 + observedStress * 0.25);
    state.hesitation = Math.round(previousState.hesitation * 0.7 + observedHesitation * 0.3);
    state.enthusiasm = Math.round(previousState.enthusiasm * 0.8 + observedEnthusiasm * 0.2);
    state.certainty = Math.round(previousState.certainty * 0.75 + observedCertainty * 0.25);
    state.frustration = Math.round(previousState.frustration * 0.75 + observedFrustration * 0.25);
    
    // Engagement naturally correlates with composure and enthusiasm
    state.engagement = Math.round(Math.min(100, Math.max(10, (state.confidence + state.enthusiasm) / 2)));

    // --- 3. PSYCHOLOGICAL PROFILE / COMPOUND EMOTIONS ---

    // Composure: high confidence, high certainty, low stress, low hesitation
    const computedComposure = Math.round(
      (state.confidence * 0.35) + 
      (state.certainty * 0.35) + 
      ((100 - state.stress) * 0.15) + 
      ((100 - state.hesitation) * 0.15)
    );
    state.composure = Math.max(10, Math.min(100, computedComposure));

    // Cognitive Load: hesitation, stress, sentence fragmentation, extreme brevity/wordiness
    let computedCognitiveLoad = Math.round(
      (state.hesitation * 0.4) + 
      (state.stress * 0.3) + 
      (Math.min(30, fragmentationCount * 10) * 0.3)
    );
    if (wordCount > 0 && wordCount < 15) computedCognitiveLoad = Math.min(100, computedCognitiveLoad + 15);
    state.cognitiveLoad = Math.max(10, Math.min(100, computedCognitiveLoad));

    // Defensiveness: derived from frustration, stress, and dogmatic words
    const computedDefensiveness = Math.round(
      (state.frustration * 0.5) + 
      (state.stress * 0.2) + 
      (Math.min(4, defensiveHits) * 7.5)
    );
    state.defensiveness = Math.max(0, Math.min(100, computedDefensiveness));

    // Imposter Index (Self-Minimizing Strain): low confidence, high hesitation, and qualifying/minimizing words
    const computedImposterIndex = Math.round(
      ((100 - state.confidence) * 0.4) + 
      (state.hesitation * 0.3) + 
      (Math.min(5, imposterHits) * 6)
    );
    state.imposterIndex = Math.max(0, Math.min(100, computedImposterIndex));

    // Flow State Rating: high composure, high engagement, high enthusiasm, low stress
    const computedFlowState = Math.round(
      (state.composure * 0.4) + 
      (state.engagement * 0.3) + 
      (state.enthusiasm * 0.2) + 
      ((100 - state.stress) * 0.1)
    );
    state.flowStateRating = Math.max(10, Math.min(100, computedFlowState));

    // --- 4. PRIMARY EMOTIONAL VIBE DETERMINATION ---

    let maxVal = 0;
    let vibe = 'neutral';

    if (state.flowStateRating && state.flowStateRating > 72) {
      maxVal = state.flowStateRating;
      vibe = 'flow';
    }
    if (state.cognitiveLoad && state.cognitiveLoad > 65 && state.cognitiveLoad > maxVal) {
      maxVal = state.cognitiveLoad;
      vibe = 'cognitive_overload';
    }
    if (state.defensiveness && state.defensiveness > 50 && state.defensiveness > maxVal) {
      maxVal = state.defensiveness;
      vibe = 'defensive';
    }
    if (state.imposterIndex && state.imposterIndex > 58 && state.imposterIndex > maxVal) {
      maxVal = state.imposterIndex;
      vibe = 'imposter';
    }
    if (state.stress > 65 && state.stress > maxVal) {
      vibe = 'anxious';
    }

    state.primaryVibe = vibe;
    state.previousPrimaryVibe = previousState.primaryVibe || 'neutral';

    // Calculate mental fatigue (grows with turns, heavy hesitation/stress)
    const currentFatigue = (previousState.mentalFatigue || 15) + 3;
    const loadFactor = (state.cognitiveLoad || 30) > 60 ? 4 : 0;
    state.mentalFatigue = Math.min(100, Math.max(0, Math.round(currentFatigue + loadFactor)));

    // Comfort level is inversely correlated with stress, hesitation, defensiveness
    const comfort = Math.round(
      ((100 - state.stress) * 0.4) + 
      (state.confidence * 0.3) + 
      ((100 - state.frustration) * 0.3)
    );
    state.comfortLevel = Math.min(100, Math.max(10, comfort));

    // Motivation level from engagement and enthusiasm
    const motivation = Math.round(
      (state.engagement * 0.5) + 
      (state.enthusiasm * 0.5)
    );
    state.motivationLevel = Math.min(100, Math.max(10, motivation));

    // Recovery ability tracks how resilient candidate is to composure drops or stress hikes
    const stressReduced = Math.max(0, (previousState.stress || 40) - state.stress);
    const confidenceRegained = Math.max(0, state.confidence - (previousState.confidence || 50));
    const recoveryScore = 50 + (stressReduced * 2) + (confidenceRegained * 2);
    const prevRecovery = previousState.recoveryAbility || 75;
    state.recoveryAbility = Math.round(prevRecovery * 0.8 + Math.min(100, recoveryScore) * 0.2);

    // Emotional stability checks variation and volatility between turns
    const swing = Math.abs(state.confidence - previousState.confidence) + 
                  Math.abs(state.stress - previousState.stress);
    const stabilityScore = Math.max(30, 100 - (swing * 1.8));
    const prevStability = previousState.emotionalStability || 80;
    state.emotionalStability = Math.round(prevStability * 0.85 + stabilityScore * 0.15);

    return state;
  }
}
