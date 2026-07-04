import { CandidateState } from './candidateState';

export class CoachingStrategyEngine {
  /**
   * Builds an adaptive coaching strategy based on candidate needs and current performance.
   */
  public static adaptCoachingStrategy(state: CandidateState): void {
    const digitalTwin = state.digitalTwin;
    const learning = state.learning;

    // Find lowest scoring competencies to make them coaching priorities
    const sortedComps = Object.values(digitalTwin).sort((a, b) => a.score - b.score);
    const primaryGap = sortedComps[0]?.id || 'communication';
    const secondaryGap = sortedComps[1]?.id || 'ownership';

    const coaching = state.coachingStrategy;

    // Adapt track based on gaps
    if (primaryGap === 'communication') {
      coaching.activeTrack = 'Verbal Brilliance & Concision';
      coaching.focusTarget = 'Filler Word Elimination & Metric Integration';
      coaching.weeklyPlan = [
        'Complete two conciseness drills under pressure',
        'Record structured STAR outlines focusing on hard metrics',
        'Analyze rapid speaking triggers and practice strategic pauses'
      ];
    } else if (primaryGap === 'technical_skills' || primaryGap === 'problem_solving') {
      coaching.activeTrack = 'Technical Systems & Depth';
      coaching.focusTarget = 'Architectural Design Decisions';
      coaching.weeklyPlan = [
        'Explain complex database replication trade-offs',
        'Practice structured troubleshooting in a simulated panel',
        'Incorporate security and cost boundaries into technical answers'
      ];
    } else if (primaryGap === 'leadership' || primaryGap === 'ownership') {
      coaching.activeTrack = 'Executive Ownership & Impact';
      coaching.focusTarget = 'High-Agency Leadership Stories';
      coaching.weeklyPlan = [
        'Establish clear accountability boundaries in team failure stories',
        'Incorporate project ROI and stakeholder management metrics',
        'Formulate a 1-minute high-impact summary for VP review'
      ];
    } else {
      coaching.activeTrack = 'Adaptive Behavioral Mastery';
      coaching.focusTarget = 'Situational Versatility & Cadence';
      coaching.weeklyPlan = [
        `Focus heavily on developing stories around ${primaryGap.replace('_', ' ')}`,
        `Practice high-signal STAR responses targeting ${secondaryGap.replace('_', ' ')}`,
        'Engage in an audio-only mock run to test pacing and recovery'
      ];
    }

    // Tweak objectives based on learning style
    if (learning.style === 'Needs Confidence Building') {
      coaching.weeklyPlan.unshift('Warmup with a simple 2-minute mock introduction to establish baseline comfort');
    } else if (learning.style === 'Fast Learner') {
      coaching.weeklyPlan.push('Take on an Elite-level pressure simulation to challenge rapid recovery');
    }
  }
}
