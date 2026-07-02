import { SessionHistoryItem, Language } from '../types';
import { InterviewDirector, DirectorSessionDesign, DirectorState } from './director';
import { AdaptiveEngine, AdaptationSessionConfig } from './adaptive';
import { SerendipityService } from './serendipity';
import { ShanaEventTracker } from './events';

export type DecisionAuthority = 'safety' | 'director' | 'adaptive' | 'serendipity';

export interface OrchestratedSessionDecision {
  authority: DecisionAuthority;
  interviewType: string;
  difficulty: 'Easy' | 'Normal' | 'Challenging' | 'Stretch';
  questionStyle: 'structured' | 'direct' | 'unpredictable' | 'analytical';
  pacingSeconds: number;
  interruptionLevel: 'Low' | 'Medium' | 'High';
  feedbackIntensity: 'Full Supportive' | 'Analytical' | 'Direct & Cold';
  serendipityTriggered: boolean;
  explanation: string;
  conflicts: OrchestrationConflict[];
}

export interface OrchestrationConflict {
  system: string;
  attemptedValue: string;
  overridingSystem: string;
  resolvedValue: string;
  reason: string;
}

export const ShanaOrchestrator = {
  /**
   * Orchestrates the entire session parameters, resolving any conflicts between
   * the Interview Director, Adaptive Engine, Serendipity Engine, and Safety Layer.
   */
  orchestrateSession(
    userId: string,
    history: SessionHistoryItem[],
    experienceLevel: string = 'Mid',
    lang: Language = 'EN',
    sessionId: string = 'sess_default'
  ): OrchestratedSessionDecision {
    const conflicts: OrchestrationConflict[] = [];
    let authority: DecisionAuthority = 'director';

    // 1. SAFETY & USER CONTROL (Priority #1)
    // Custom settings defined by the user always act as the supreme authority.
    const directorSettings = InterviewDirector.getSettings(userId);
    const adaptiveSettings = AdaptiveEngine.getSettings(userId);
    const serendipitySettings = SerendipityService.getSettings(userId);

    // Initial output values sourced from Interview Director (Priority #2)
    const directorResult = InterviewDirector.orchestrateSession(userId, history, experienceLevel);
    let finalType = directorResult.design.interviewType;
    let finalDifficulty = directorResult.design.difficulty;
    let finalStyle = directorResult.design.questionStyle;
    let finalPacingSec = directorResult.design.pacingSeconds;
    let finalInterruption = directorResult.design.interruptionLevel;
    let finalIntensity = directorResult.design.feedbackIntensity;
    let finalSerendipity = directorResult.design.serendipityTriggered;

    let explanation = lang === 'EN' 
      ? 'Director Mode Active: Conducting baseline standardized professional evaluation.' 
      : 'Mode Directeur Actif : Conduite d\'une évaluation professionnelle standardisée de référence.';

    // 2. FAILSAFE TRIGGER FOR LOW SYSTEM CONFIDENCE
    const isFailsafe = directorResult.state.failsafeActive || !userId;

    if (isFailsafe) {
      authority = 'director';
      explanation = lang === 'EN'
        ? 'Failsafe Mode Active: Defaulting to Director baseline due to low confidence scores.'
        : 'Mode de Sécurité Actif : Retour aux paramètres de référence du Directeur suite à un indice de confiance faible.';

      const decision: OrchestratedSessionDecision = {
        authority,
        interviewType: 'Standard Interview',
        difficulty: 'Normal',
        questionStyle: 'structured',
        pacingSeconds: 45,
        interruptionLevel: 'Low',
        feedbackIntensity: 'Full Supportive',
        serendipityTriggered: false,
        explanation,
        conflicts: [{
          system: 'all',
          attemptedValue: 'complex',
          overridingSystem: 'safety',
          resolvedValue: 'baseline',
          reason: 'Failsafe mode active: forced fallback to baseline standard parameters.'
        }]
      };

      // Log Failsafe conflict resolution event
      ShanaEventTracker.logEvent(userId || 'usr_guest', sessionId, 'state_transition', {
        type: 'failsafe_activated',
        reason: 'Low system confidence or invalid user ID',
        decision
      });

      return decision;
    }

    // 3. ADAPTIVE ENGINE ADJUSTMENTS (Priority #3)
    const adaptiveConfig = AdaptiveEngine.calculateAdaptation(userId, history);

    // ADAPTIVE OVERRIDE CRITERIA
    // Adaptive can ONLY override Director parameters if:
    // - User is stuck (declining confidence trend + poor latest score)
    // - Performance drops significantly (score dropped by >= 15 points)
    // - Engagement risk is high (detected drop-off / fatigue)
    const isStuck = directorResult.state.engagementRisk === 'High' || directorResult.design.overrideApplied;
    const canAdaptiveOverride = isStuck && adaptiveSettings.status === 'accepted';

    if (canAdaptiveOverride) {
      authority = 'adaptive';
      explanation = lang === 'EN' ? adaptiveConfig.explanationEN : adaptiveConfig.explanationFR;

      // Conflict checks and resolution
      if (finalDifficulty !== adaptiveConfig.difficulty) {
        conflicts.push({
          system: 'Adaptive Engine',
          attemptedValue: `difficulty:${adaptiveConfig.difficulty}`,
          overridingSystem: 'Adaptive Override',
          resolvedValue: `difficulty:${adaptiveConfig.difficulty}`,
          reason: `User is struggling or engagement risk is detected. Sourced from: ${directorResult.design.overrideReason || 'Engagement check'}`
        });
        finalDifficulty = adaptiveConfig.difficulty;
      }

      if (adaptiveConfig.recoveryMode && finalType !== 'Confidence Builder') {
        conflicts.push({
          system: 'Interview Director',
          attemptedValue: `interviewType:${finalType}`,
          overridingSystem: 'Adaptive Engine',
          resolvedValue: 'Confidence Builder',
          reason: 'Recovery Mode triggered: Forced warm, supportive Confidence Builder format to restore momentum.'
        });
        finalType = 'Confidence Builder';
        finalStyle = 'structured';
        finalPacingSec = 120;
        finalInterruption = 'Low';
        finalIntensity = 'Full Supportive';
      }
    } else {
      // Suggestion mode only: Adaptive wants to modify but does not have override authority.
      // Filter out lower-priority contradictory changes and preserve director baseline.
      if (finalDifficulty !== adaptiveConfig.difficulty && adaptiveSettings.status === 'accepted') {
        conflicts.push({
          system: 'Adaptive Engine',
          attemptedValue: `difficulty:${adaptiveConfig.difficulty}`,
          overridingSystem: 'Interview Director',
          resolvedValue: `difficulty:${finalDifficulty}`,
          reason: 'Director baseline has final decision authority. Adaptive change reduced to recommendation.'
        });
      }
    }

    // 4. SERENDIPITY ENGINE TRIGGER (Priority #4)
    // Serendipity can ONLY trigger if:
    // - session ends OR
    // - strong pattern detected OR
    // - Director explicitly allows discovery mode (serendipityTriggered is true in director design)
    const canSerendipityTrigger = 
      finalSerendipity && 
      serendipitySettings.enabled && 
      serendipitySettings.frequency !== 'off' &&
      !adaptiveConfig.recoveryMode; // Forbidden to interrupt during critical recovery

    if (finalSerendipity && !canSerendipityTrigger) {
      conflicts.push({
        system: 'Serendipity Engine',
        attemptedValue: 'serendipityTriggered:true',
        overridingSystem: isStuck ? 'Adaptive Engine (Recovery/Stuck)' : 'Serendipity Settings (Disabled)',
        resolvedValue: 'serendipityTriggered:false',
        reason: isStuck 
          ? 'Discovery mode suspended during active recovery to maintain a low-friction stable flow.'
          : 'Serendipity features are disabled in user preferences.'
      });
      finalSerendipity = false;
    }

    // 5. SAFETY & USER CONTROL RESOLUTION (Supremacy rule)
    if (directorSettings.status === 'custom') {
      authority = 'safety';
      explanation = lang === 'EN' 
        ? 'Custom Settings Active: Enforcing user-defined configurations.' 
        : 'Paramètres Personnalisés Actifs : Application forcée des configurations de l\'utilisateur.';

      if (directorSettings.customType && finalType !== directorSettings.customType) {
        conflicts.push({
          system: 'Interview Director / Adaptive',
          attemptedValue: `interviewType:${finalType}`,
          overridingSystem: 'User Custom Setting',
          resolvedValue: `interviewType:${directorSettings.customType}`,
          reason: 'User explicitly requested customized interview format.'
        });
        finalType = directorSettings.customType;
      }

      if (directorSettings.customDifficulty && finalDifficulty !== directorSettings.customDifficulty) {
        conflicts.push({
          system: 'Interview Director / Adaptive',
          attemptedValue: `difficulty:${finalDifficulty}`,
          overridingSystem: 'User Custom Setting',
          resolvedValue: `difficulty:${directorSettings.customDifficulty}`,
          reason: 'User explicitly requested customized difficulty level.'
        });
        finalDifficulty = directorSettings.customDifficulty;
      }
    }

    const decision: OrchestratedSessionDecision = {
      authority,
      interviewType: finalType,
      difficulty: finalDifficulty,
      questionStyle: finalStyle,
      pacingSeconds: finalPacingSec,
      interruptionLevel: finalInterruption,
      feedbackIntensity: finalIntensity,
      serendipityTriggered: finalSerendipity,
      explanation,
      conflicts
    };

    // 6. LOG CONFLICT EVENTS VIA PHASE 1 EVENT SYSTEM
    if (conflicts.length > 0) {
      ShanaEventTracker.logEvent(userId, sessionId, 'state_transition', {
        type: 'orchestration_conflict_resolved',
        conflicts: conflicts,
        decisionSummary: {
          authority,
          interviewType: finalType,
          difficulty: finalDifficulty,
          serendipityTriggered: finalSerendipity
        }
      });
    }

    return decision;
  }
};
