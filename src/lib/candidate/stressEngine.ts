import { CandidateState } from './candidateState';

export class StressEngine {
  /**
   * Tracks and evaluates speaking stress factors dynamically.
   */
  public static evaluateStressImpact(state: CandidateState, answer: string): void {
    const wordCount = answer.trim().split(/\s+/).length;
    if (wordCount < 5) return;

    // Detect hesitation keywords representing stuttering or pauses
    const lower = answer.toLowerCase();
    const hesitationsList = ['...', 'uh', 'um', 'er', 'ah', 'actually', 'you know'];
    let hesitationCount = 0;
    hesitationsList.forEach(h => {
      const parts = lower.split(h);
      hesitationCount += (parts.length - 1);
    });

    // Speech interruptions / fragmented structures
    let interruptionCount = 0;
    const interruptionChars = ['-', ';', '—'];
    interruptionChars.forEach(c => {
      const parts = lower.split(c);
      interruptionCount += (parts.length - 1);
    });

    // Simulate long pauses and rapid speech bursts
    const longPauses = hesitationCount > 3 ? 2 : 0;
    const rapidSpeech = wordCount > 200 ? 1 : 0;

    // Emotional recovery & pressure tolerance
    let observedPressureTolerance = 70;
    if (hesitationCount > 4 || interruptionCount > 3) {
      observedPressureTolerance -= 25;
    } else if (hesitationCount < 2) {
      observedPressureTolerance += 15;
    }

    observedPressureTolerance = Math.max(10, Math.min(100, observedPressureTolerance));

    // Smooth state updates
    const stress = state.stress;
    stress.hesitations = parseFloat(((stress.hesitations * 0.7) + (hesitationCount * 0.3)).toFixed(1));
    stress.speechInterruptions = Math.round((stress.speechInterruptions * 0.7) + (interruptionCount * 0.3));
    stress.longPauses = Math.round((stress.longPauses * 0.8) + (longPauses * 0.2));
    stress.rapidSpeechInstances = Math.round((stress.rapidSpeechInstances * 0.8) + (rapidSpeech * 0.2));
    stress.pressureTolerance = Math.round((stress.pressureTolerance * 0.8) + (observedPressureTolerance * 0.2));

    // Calculate Stress Resilience Index (0 - 100, where 100 is highly resilient)
    // Decreased by high filler frequency, long pauses, hesitations, etc.
    const penalty = (stress.hesitations * 4) + (stress.speechInterruptions * 5) + (stress.longPauses * 10);
    const index = Math.max(15, Math.min(100, Math.round(95 - penalty + (stress.pressureTolerance * 0.15))));
    
    stress.stressResilienceIndex = index;
    stress.emotionalRecovery = Math.round((stress.emotionalRecovery * 0.85) + (index * 0.15));
  }
}
