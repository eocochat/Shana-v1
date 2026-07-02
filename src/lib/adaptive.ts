import { StorageService } from './storage';
import { SessionHistoryItem } from '../types';
import { SerendipityService } from './serendipity';
import { LearningValidationLoop } from './learningLoop';

export type InterviewPath = 'Confidence' | 'Communication' | 'Leadership' | 'Memory' | 'Balanced';
export type AdaptedDifficulty = 'Easy' | 'Normal' | 'Challenging' | 'Stretch';
export type AdaptationStatus = 'accepted' | 'skipped' | 'disabled';

export interface SmartChallengeConfig {
  type: 'thirty_second_limit' | 'silent_recruiter' | 'unexpected_trick';
  descriptionEN: string;
  descriptionFR: string;
  phaseIndex: number; // 0-indexed phase where the challenge is injected
}

export interface AdaptationSessionConfig {
  path: InterviewPath;
  difficulty: AdaptedDifficulty;
  struggleFlags: {
    lack_structure: boolean;
    excels_under_pressure: boolean;
    too_long: boolean;
  };
  recoveryMode: boolean;
  smartChallenge?: SmartChallengeConfig;
  explanationEN: string;
  explanationFR: string;
  workedAdaptations: string[];
  failedAdaptations: string[];
}

export const AdaptiveEngine = {
  // --- SETTINGS (FEATURE 8 / ACCEPT, SKIP, DISABLE) ---
  getSettings(userId: string): { status: AdaptationStatus } {
    const key = `shana_adaptive_settings_${userId}`;
    const defaultSettings = { status: 'accepted' as AdaptationStatus };
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
      return defaultSettings;
    } catch {
      return defaultSettings;
    }
  },

  saveSettings(userId: string, settings: { status: AdaptationStatus }): void {
    const key = `shana_adaptive_settings_${userId}`;
    localStorage.setItem(key, JSON.stringify(settings));
    window.dispatchEvent(new Event('shana_adaptive_update'));
  },

  // --- PROGRESS MEMORY (FEATURE 9) ---
  getAdaptationHistory(userId: string): { worked: string[]; failed: string[] } {
    const key = `shana_adaptive_history_${userId}`;
    const defaultHistory = { worked: [] as string[], failed: [] as string[] };
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
      return defaultHistory;
    } catch {
      return defaultHistory;
    }
  },

  saveAdaptationHistory(userId: string, history: { worked: string[]; failed: string[] }): void {
    const key = `shana_adaptive_history_${userId}`;
    localStorage.setItem(key, JSON.stringify(history));
  },

  // --- LEARNING LOOP EVALUATION (FEATURE 4) ---
  evaluateSession(userId: string, session: SessionHistoryItem, previousHistory: SessionHistoryItem[]): void {
    // Sync with unified Shana Learning Validation Loop
    try {
      const pendingLogs = LearningValidationLoop.getLogs(userId);
      const activePending = pendingLogs.find(l => l.afterMetrics === null);
      const afterMetrics = {
        ips: session.score,
        clarity: session.communicationScore || session.score,
        structure: Math.round(((session.resumeScore || session.score) + (session.behavioralScore || session.score)) / 2),
        confidence: session.confidenceScore || session.communicationScore || session.score,
        relevance: 80,
        conciseness: 85
      };
      if (activePending) {
        LearningValidationLoop.logActionAfter(userId, activePending.actionId, afterMetrics);
      } else {
        LearningValidationLoop.autoResolvePendingActions(userId, {
          ips: session.score,
          breakdown: {
            clarity: afterMetrics.clarity,
            structure: afterMetrics.structure,
            confidence: afterMetrics.confidence,
            relevance: 80,
            conciseness: 85
          },
          explanation: { strength: "", improvement: "", tip: "" }
        });
      }
    } catch (err) {
      console.warn("Unified learning validation update skipped or failed:", err);
    }

    const settings = this.getSettings(userId);
    if (settings.status === 'disabled' || settings.status === 'skipped') {
      // Skipped is a one-off skip; we restore 'accepted' for the next run
      if (settings.status === 'skipped') {
        this.saveSettings(userId, { status: 'accepted' });
      }
      return;
    }

    const currentScore = session.score;
    if (previousHistory.length === 0) return;

    const previousSession = previousHistory[0];
    const previousScore = previousSession.score || 75;

    // Get active adaptations that were evaluated
    const activeAdaptations = this.getActiveAdaptationNames(userId, previousHistory);
    const adaptationHistory = this.getAdaptationHistory(userId);

    const scoreDiff = currentScore - previousScore;
    
    const newWorked = [...adaptationHistory.worked];
    const newFailed = [...adaptationHistory.failed];

    activeAdaptations.forEach(adaptation => {
      // Score improved, remained high, or is excellent: Success
      if (scoreDiff >= 0 || currentScore >= 78) {
        if (!newWorked.includes(adaptation)) {
          newWorked.push(adaptation);
        }
        // Remove from failed if it succeeded now
        const failedIdx = newFailed.indexOf(adaptation);
        if (failedIdx !== -1) {
          newFailed.splice(failedIdx, 1);
        }
      } else if (scoreDiff < -4 && currentScore < 75) {
        // Failed adaptation (score dropped noticeably and is mediocre)
        if (!newFailed.includes(adaptation)) {
          newFailed.push(adaptation);
        }
        // Remove from worked if it failed now (rollback)
        const workedIdx = newWorked.indexOf(adaptation);
        if (workedIdx !== -1) {
          workedIdx !== -1 && newWorked.splice(workedIdx, 1);
        }
      }
    });

    this.saveAdaptationHistory(userId, { worked: newWorked, failed: newFailed });
  },

  getActiveAdaptationNames(userId: string, history: SessionHistoryItem[]): string[] {
    const config = this.calculateAdaptation(userId, history);
    const list: string[] = [];
    if (config.path !== 'Balanced') {
      list.push(`${config.path} Path`);
    }
    if (config.difficulty !== 'Normal') {
      list.push(`${config.difficulty} Difficulty`);
    }
    if (config.struggleFlags.lack_structure) {
      list.push('Structure-Probe Exercise');
    }
    if (config.struggleFlags.excels_under_pressure) {
      list.push('Realistic Pressure Challenge');
    }
    if (config.struggleFlags.too_long) {
      list.push('Concise-Answer Exercise');
    }
    if (config.recoveryMode) {
      list.push('Confidence Recovery Mode');
    }
    if (config.smartChallenge) {
      list.push(`Smart Challenge: ${config.smartChallenge.type}`);
    }
    return list;
  },

  // --- MAIN CALCULATION (FEATURE 1, 2, 5, 6, 7, 8, 9) ---
  calculateAdaptation(userId: string, history: SessionHistoryItem[]): AdaptationSessionConfig {
    const discoveries = SerendipityService.getDiscoveries(userId);
    const adaptationHistory = this.getAdaptationHistory(userId);

    // Default configuration
    let path: InterviewPath = 'Balanced';
    let difficulty: AdaptedDifficulty = 'Normal';
    let struggleFlags = {
      lack_structure: false,
      excels_under_pressure: false,
      too_long: false,
    };
    let recoveryMode = false;
    let smartChallenge: SmartChallengeConfig | undefined = undefined;

    // Help: has an adaptation failed? (Avoid repeating ineffective patterns - Feature 9)
    const isFailed = (adaptationName: string) => adaptationHistory.failed.includes(adaptationName);

    const totalSessions = history.length;
    const scores = history.map(h => h.score).filter(s => typeof s === 'number');
    const latestScore = scores.length > 0 ? scores[0] : 80;

    // 1. Recovery Mode (Feature 7)
    // Drops if latest score is poor (< 65) or dropped by >= 15 points
    if (totalSessions >= 2 && scores.length >= 2) {
      const prevScore = scores[1];
      if (latestScore < 65 || (prevScore - latestScore) >= 15) {
        if (!isFailed('Confidence Recovery Mode')) {
          recoveryMode = true;
        }
      }
    } else if (latestScore < 65) {
      if (!isFailed('Confidence Recovery Mode')) {
        recoveryMode = true;
      }
    }

    // 2. Dynamic Difficulty (Feature 2)
    if (recoveryMode) {
      difficulty = 'Easy';
    } else if (scores.length >= 2) {
      const diff = scores[0] - scores[scores.length - 1];
      if (diff >= 5 && latestScore >= 80) {
        // Improving trend
        if (!isFailed('Stretch Difficulty') && latestScore >= 88) {
          difficulty = 'Stretch';
        } else if (!isFailed('Challenging Difficulty')) {
          difficulty = 'Challenging';
        }
      } else if (latestScore >= 84) {
        if (!isFailed('Challenging Difficulty')) {
          difficulty = 'Challenging';
        }
      } else if (latestScore < 70) {
        difficulty = 'Easy';
      }
    }

    // 3. Struggle Flags (Feature 1)
    const patternMetrics = SerendipityService.getPatternMetrics(userId, history);

    // Structure struggles check
    const hasStructureWeakness = history.some(h => 
      h.weakness?.toLowerCase().includes('structure') || 
      h.recommendation?.toLowerCase().includes('structure') || 
      h.recommendation?.toLowerCase().includes('star method')
    ) || discoveries.some(d => d.text.toLowerCase().includes('structure') && d.category === 'pattern');

    if (hasStructureWeakness && !isFailed('Structure-Probe Exercise')) {
      struggleFlags.lack_structure = true;
    }

    // Excels under pressure
    const hasPressureStrength = discoveries.some(d => d.text.toLowerCase().includes('pressure') && d.category === 'strength') ||
      history.some(h => (h.adaptabilityScore || 0) >= 83);

    if (hasPressureStrength && !recoveryMode && !isFailed('Realistic Pressure Challenge')) {
      struggleFlags.excels_under_pressure = true;
    }

    // Answers too long
    const hasConciseWeakness = patternMetrics.avgAnswerLength > 175 || discoveries.some(d => d.text.toLowerCase().includes('concise') || d.text.toLowerCase().includes('shorter'));
    if (hasConciseWeakness && !isFailed('Concise-Answer Exercise')) {
      struggleFlags.too_long = true;
    }

    // 4. Invisible Path Selection (Feature 5)
    if (recoveryMode || latestScore < 68 || patternMetrics.confidenceTrend === 'declining') {
      path = 'Confidence';
    } else if (struggleFlags.too_long || patternMetrics.speakingSpeed > 150) {
      path = 'Communication';
    } else if (struggleFlags.lack_structure || discoveries.some(d => d.text.toLowerCase().includes('star'))) {
      path = 'Memory';
    } else if (latestScore >= 80 && history.length >= 2) {
      path = 'Leadership';
    }

    // 5. Smart Challenge Moments (Feature 6)
    // Max 1/session, only in non-recovery states
    if (!recoveryMode && totalSessions >= 1) {
      if (path === 'Communication' && !isFailed('Smart Challenge: thirty_second_limit')) {
        smartChallenge = {
          type: 'thirty_second_limit',
          descriptionEN: '30-Second Limit: Compress your answer to the absolute essentials under a strict countdown timer.',
          descriptionFR: 'Limite de 30 secondes : Donnez une réponse ultra-concise limitée à 30 secondes chrono.',
          phaseIndex: 2, // Injected in phase index 2 (e.g. Phase 3)
        };
      } else if (path === 'Leadership' && !isFailed('Smart Challenge: silent_recruiter')) {
        smartChallenge = {
          type: 'silent_recruiter',
          descriptionEN: 'Silent Recruiter: The interviewer will show zero emotion and probe your decisions with poker-face scrutiny.',
          descriptionFR: 'Recruteur Silencieux : L\'interrogateur restera de marbre pour tester votre sang-froid et assurance.',
          phaseIndex: 3, // Phase 4
        };
      } else if (path === 'Memory' && !isFailed('Smart Challenge: unexpected_trick')) {
        smartChallenge = {
          type: 'unexpected_trick',
          descriptionEN: 'Unexpected Trick: An aggressive stakeholder objection to test your agility under pushback.',
          descriptionFR: 'Objection Surprise : Une critique agressive d\'un membre de direction pour tester votre adaptabilité immédiate.',
          phaseIndex: 4, // Phase 5
        };
      }
    }

    // 6. Explanations (Feature 8)
    let explanationEN = '';
    let explanationFR = '';

    if (recoveryMode) {
      explanationEN = 'We activated Confidence Recovery Mode. Time constraints have been relaxed, and questions will focus on warming up your core communication and building momentum.';
      explanationFR = 'Nous avons activé le Mode Récupération de Confiance. Les minuteurs sont assouplis et les questions se concentrent sur la fluidité et le confort de parole.';
    } else {
      const activeChanges: string[] = [];
      const activeChangesFR: string[] = [];

      if (path !== 'Balanced') {
        activeChanges.push(`routed you to the ${path} Path`);
        activeChangesFR.push(`redirigé vers le parcours ${path === 'Confidence' ? 'Confiance' : path === 'Communication' ? 'Communication' : path === 'Memory' ? 'Mémoire' : 'Leadership'}`);
      }
      if (difficulty !== 'Normal') {
        activeChanges.push(`set difficulty to ${difficulty}`);
        activeChangesFR.push(`ajusté la difficulté sur ${difficulty === 'Easy' ? 'Facile' : difficulty === 'Challenging' ? 'Défi' : 'Intense (Stretch)'}`);
      }
      if (struggleFlags.too_long) {
        activeChanges.push(`injected concise training exercises`);
        activeChangesFR.push(`intégré des exercices de concision`);
      }
      if (struggleFlags.lack_structure) {
        activeChanges.push(`increased structured answer probing`);
        activeChangesFR.push(`accentué la vérification de vos structures de réponse (méthode STAR)`);
      }
      if (smartChallenge) {
        const cName = smartChallenge.type === 'thirty_second_limit' ? '30-second limit' : smartChallenge.type === 'silent_recruiter' ? 'silent recruiter' : 'unexpected objection';
        const cNameFR = smartChallenge.type === 'thirty_second_limit' ? 'limite 30s' : smartChallenge.type === 'silent_recruiter' ? 'recruteur silencieux' : 'objection surprise';
        activeChanges.push(`and queued a '${cName}' challenge`);
        activeChangesFR.push(`et programmé un défi '${cNameFR}'`);
      }

      if (activeChanges.length > 0) {
        explanationEN = `Adaptive Engine analysis: Based on your recent performance patterns, we have ${activeChanges.join(', ')} for this session.`;
        explanationFR = `Analyse du Moteur Adaptatif : En fonction de vos dernières performances, nous avons ${activeChangesFR.join(', ')} pour cette session.`;
      } else {
        explanationEN = 'Adaptive Engine active: Perfect baseline. We are conducting a balanced, standard professional diagnostic sequence.';
        explanationFR = 'Moteur Adaptatif Actif : Profil équilibré. Nous menons une séquence standard de diagnostic professionnel.';
      }
    }

    return {
      path,
      difficulty,
      struggleFlags,
      recoveryMode,
      smartChallenge,
      explanationEN,
      explanationFR,
      workedAdaptations: adaptationHistory.worked,
      failedAdaptations: adaptationHistory.failed,
    };
  }
};
