import { StorageService } from './storage';
import { SessionHistoryItem } from '../types';
import { AdaptiveEngine, AdaptationSessionConfig, SmartChallengeConfig } from './adaptive';
import { SerendipityService } from './serendipity';

export type InterviewType = 
  | 'Standard Interview'
  | 'Pressure Interview'
  | 'Technical Deep Dive'
  | 'Behavioral Focus'
  | 'Confidence Builder'
  | 'Silent Recruiter'
  | 'Rapid Fire Interview';

export type UserJourneyStage = 
  | 'Explorer' 
  | 'Learner' 
  | 'Adapter' 
  | 'Interview Ready' 
  | 'Expert';

export interface DirectorSessionDesign {
  interviewType: InterviewType;
  difficulty: 'Easy' | 'Normal' | 'Challenging' | 'Stretch';
  questionStyle: 'structured' | 'direct' | 'unpredictable' | 'analytical';
  pacing: 'Standard (45s)' | 'Relaxed (120s)' | 'Rapid Fire (30s)';
  interruptionLevel: 'Low' | 'Medium' | 'High';
  feedbackIntensity: 'Full Supportive' | 'Analytical' | 'Direct & Cold';
  serendipityTriggered: boolean;
  overrideApplied: boolean;
  overrideReason?: string;
  pacingSeconds: number;
}

export interface DirectorState {
  currentStage: UserJourneyStage;
  bestPerformingType?: InterviewType;
  worstPerformingType?: InterviewType;
  preferredDifficulty: 'Easy' | 'Normal' | 'Challenging' | 'Stretch';
  engagementRisk: 'Low' | 'Medium' | 'High';
  failsafeActive: boolean;
  confidenceScore: number; // Director's confidence in this design
}

export interface DirectorSettings {
  status: 'active' | 'custom' | 'disabled';
  customType?: InterviewType;
  customDifficulty?: 'Easy' | 'Normal' | 'Challenging' | 'Stretch';
}

export const InterviewDirector = {
  // --- SETTINGS STORAGE ---
  getSettings(userId: string): DirectorSettings {
    const key = `shana_director_settings_${userId}`;
    const defaultSettings: DirectorSettings = { status: 'active' };
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  },

  saveSettings(userId: string, settings: DirectorSettings): void {
    const key = `shana_director_settings_${userId}`;
    localStorage.setItem(key, JSON.stringify(settings));
    window.dispatchEvent(new Event('shana_director_update'));
  },

  // --- FEATURE 6: PROGRESSION LOGIC ---
  getUserJourneyStage(history: SessionHistoryItem[]): UserJourneyStage {
    const completedCount = history.length;
    if (completedCount <= 1) return 'Explorer';
    if (completedCount <= 3) return 'Learner';
    if (completedCount <= 5) return 'Adapter';
    if (completedCount <= 8) return 'Interview Ready';
    return 'Expert';
  },

  // --- FEATURE 5: ENGAGEMENT CONTROL ---
  calculateEngagementRisk(userId: string, history: SessionHistoryItem[]): 'Low' | 'Medium' | 'High' {
    if (history.length === 0) return 'Low';

    // Check last 3 sessions completion rate or scores
    const last3 = history.slice(0, 3);
    const lowScores = last3.filter(s => (s.score || 0) < 60).length;
    
    // Frustration/Hesitation signals from pattern metrics
    const patternMetrics = SerendipityService.getPatternMetrics(userId, history);
    
    // High hesitations or constant high retry counts might mean fatigue/stagnation
    const highFrustration = patternMetrics.retryCount >= 3 || patternMetrics.completionRate < 75;

    if (lowScores >= 2 || (lowScores >= 1 && highFrustration)) {
      return 'High';
    }
    if (lowScores === 1 || highFrustration) {
      return 'Medium';
    }
    return 'Low';
  },

  // --- MAIN ORCHESTRATION ---
  orchestrateSession(
    userId: string,
    history: SessionHistoryItem[],
    experienceLevel: string = 'Mid'
  ): { design: DirectorSessionDesign; state: DirectorState } {
    const settings = this.getSettings(userId);
    const journeyStage = this.getUserJourneyStage(history);
    const engagementRisk = this.calculateEngagementRisk(userId, history);
    const patternMetrics = SerendipityService.getPatternMetrics(userId, history);
    
    // Initialize Failsafe mode if there's an error or weird state (Feature 9)
    let failsafeActive = false;
    let confidenceScore = 95;

    if (userId === '' || !userId) {
      failsafeActive = true;
      confidenceScore = 30;
    }

    // Context Memory analysis (Feature 7)
    const typePerformance: Record<InterviewType, { totalScore: number; count: number }> = {} as any;
    
    // Default fallback scores for analyzing
    const interviewTypes: InterviewType[] = [
      'Standard Interview',
      'Pressure Interview',
      'Technical Deep Dive',
      'Behavioral Focus',
      'Confidence Builder',
      'Silent Recruiter',
      'Rapid Fire Interview'
    ];
    
    interviewTypes.forEach(t => {
      typePerformance[t] = { totalScore: 0, count: 0 };
    });

    history.forEach((session) => {
      const type = (session as any).interviewType as InterviewType || 'Standard Interview';
      if (typePerformance[type] && session.score) {
        typePerformance[type].totalScore += session.score;
        typePerformance[type].count += 1;
      }
    });

    let bestPerformingType: InterviewType | undefined = undefined;
    let worstPerformingType: InterviewType | undefined = undefined;
    let maxAvg = -1;
    let minAvg = 999;

    interviewTypes.forEach((t) => {
      const perf = typePerformance[t];
      if (perf.count > 0) {
        const avg = perf.totalScore / perf.count;
        if (avg > maxAvg) {
          maxAvg = avg;
          bestPerformingType = t;
        }
        if (avg < minAvg) {
          minAvg = avg;
          worstPerformingType = t;
        }
      }
    });

    // Preferred difficulty (based on most frequent successful session)
    let preferredDifficulty: 'Easy' | 'Normal' | 'Challenging' | 'Stretch' = 'Normal';
    const difficultyCounts = { Easy: 0, Normal: 0, Challenging: 0, Stretch: 0 };
    history.forEach((s) => {
      const diff = (s as any).difficulty as any || 'Normal';
      if (difficultyCounts[diff as keyof typeof difficultyCounts] !== undefined && s.score && s.score >= 70) {
        difficultyCounts[diff as keyof typeof difficultyCounts]++;
      }
    });

    let maxDiffCount = -1;
    (Object.keys(difficultyCounts) as Array<keyof typeof difficultyCounts>).forEach((diff) => {
      if (difficultyCounts[diff] > maxDiffCount) {
        maxDiffCount = difficultyCounts[diff];
        preferredDifficulty = diff;
      }
    });

    // -------------------------------------------------------------------------
    // 1. CHOOSE INTERVIEW FORMAT (Feature 1)
    // -------------------------------------------------------------------------
    let interviewType: InterviewType = 'Standard Interview';
    const isJunior = experienceLevel.toLowerCase() === 'junior';
    const isSenior = experienceLevel.toLowerCase() === 'senior' || experienceLevel.toLowerCase() === 'lead' || experienceLevel.toLowerCase() === 'executive';

    const latestSession = history[0];
    const latestScore = latestSession?.score || 75;

    if (failsafeActive) {
      interviewType = 'Standard Interview';
    } else if (isJunior || history.length <= 1 || latestScore < 65) {
      // Beginner state: standard or confidence builder
      interviewType = latestScore < 60 ? 'Confidence Builder' : 'Standard Interview';
    } else if (latestScore >= 80 && history.length >= 2 && !isJunior) {
      // Strong candidates: Pressure / Rapid Fire / Technical Deep Dive
      // Avoid repeating worst performing format
      const strongFormats: InterviewType[] = ['Pressure Interview', 'Rapid Fire Interview', 'Technical Deep Dive'];
      const filtered = strongFormats.filter(f => f !== worstPerformingType);
      interviewType = filtered[Math.floor(Math.random() * filtered.length)] || 'Pressure Interview';
    } else {
      // Improving: Mix Standard + Behavioral Focus + Silent Recruiter
      const moderateFormats: InterviewType[] = ['Standard Interview', 'Behavioral Focus', 'Silent Recruiter'];
      const filtered = moderateFormats.filter(f => f !== worstPerformingType);
      interviewType = filtered[Math.floor(Math.random() * filtered.length)] || 'Behavioral Focus';
    }

    // -------------------------------------------------------------------------
    // 2. ADAPTIVE OVERRIDE SYSTEM & ENGAGEMENT SHIELD (Feature 4, 5)
    // -------------------------------------------------------------------------
    const adaptiveConfig = AdaptiveEngine.calculateAdaptation(userId, history);
    let difficulty = adaptiveConfig.difficulty;
    let overrideApplied = false;
    let overrideReason = '';

    if (engagementRisk === 'High') {
      // Engagement drop-off risk (Feature 5) override
      difficulty = 'Easy';
      interviewType = 'Confidence Builder';
      overrideApplied = true;
      overrideReason = 'ENGAGEMENT_SHIELD: Drop-off or high fatigue risk detected. Lowering pressure level.';
      confidenceScore = 98;
    } else if (patternMetrics.confidenceTrend === 'declining' && latestScore < 65) {
      // User is stuck / learning stagnates override (Feature 4)
      difficulty = 'Easy';
      interviewType = 'Confidence Builder';
      overrideApplied = true;
      overrideReason = 'STUCK_OVERRIDE: Recent performance shows stagnation or fatigue. Rebuilding confidence baseline.';
      confidenceScore = 95;
    }

    // Respect Custom Mode settings if user configured specific parameters
    if (settings.status === 'custom') {
      if (settings.customType) {
        interviewType = settings.customType;
      }
      if (settings.customDifficulty) {
        difficulty = settings.customDifficulty;
      }
    }

    // -------------------------------------------------------------------------
    // 3. DYNAMIC PARAMETER DESIGN & 30% LIMIT VARIATION (Feature 2)
    // -------------------------------------------------------------------------
    let questionStyle: 'structured' | 'direct' | 'unpredictable' | 'analytical' = 'structured';
    let pacing: 'Standard (45s)' | 'Relaxed (120s)' | 'Rapid Fire (30s)' = 'Standard (45s)';
    let interruptionLevel: 'Low' | 'Medium' | 'High' = 'Low';
    let feedbackIntensity: 'Full Supportive' | 'Analytical' | 'Direct & Cold' = 'Analytical';

    // Apply specific parameters based on format
    switch (interviewType) {
      case 'Confidence Builder':
        questionStyle = 'structured';
        pacing = 'Relaxed (120s)';
        interruptionLevel = 'Low';
        feedbackIntensity = 'Full Supportive';
        break;
      case 'Standard Interview':
        questionStyle = 'structured';
        pacing = 'Standard (45s)';
        interruptionLevel = 'Low';
        feedbackIntensity = 'Analytical';
        break;
      case 'Behavioral Focus':
        questionStyle = 'structured';
        pacing = 'Standard (45s)';
        interruptionLevel = 'Medium';
        feedbackIntensity = 'Analytical';
        break;
      case 'Technical Deep Dive':
        questionStyle = 'analytical';
        pacing = 'Standard (45s)';
        interruptionLevel = 'Medium';
        feedbackIntensity = 'Analytical';
        break;
      case 'Pressure Interview':
        questionStyle = 'unpredictable';
        pacing = 'Standard (45s)';
        interruptionLevel = 'High';
        feedbackIntensity = 'Direct & Cold';
        break;
      case 'Rapid Fire Interview':
        questionStyle = 'direct';
        pacing = 'Rapid Fire (30s)';
        interruptionLevel = 'High';
        feedbackIntensity = 'Direct & Cold';
        break;
      case 'Silent Recruiter':
        questionStyle = 'direct';
        pacing = 'Standard (45s)';
        interruptionLevel = 'Low';
        feedbackIntensity = 'Direct & Cold';
        break;
    }

    // Apply variation smoothing (Feature 2: max 30% variation from previous session)
    // If previous session was Relaxed, we shouldn't jump instantly to Rapid Fire unless it's a requested override
    if (history.length > 0) {
      const prevSession = history[0] as any;
      const prevPacing = prevSession?.pacing || 'Standard (45s)';
      
      if (prevPacing === 'Relaxed (120s)' && pacing === 'Rapid Fire (30s)' && !overrideApplied) {
        pacing = 'Standard (45s)'; // smooth step-up
      }
      if (prevPacing === 'Rapid Fire (30s)' && pacing === 'Relaxed (120s)' && !overrideApplied) {
        pacing = 'Standard (45s)'; // smooth step-down
      }
    }

    // Derive pacing duration
    let pacingSeconds = 45;
    if (pacing === 'Relaxed (120s)') pacingSeconds = 120;
    if (pacing === 'Rapid Fire (30s)') pacingSeconds = 30;

    // -------------------------------------------------------------------------
    // 4. SERENDIPITY INJECTION DECISION (Feature 3)
    // -------------------------------------------------------------------------
    // Trigger serendipity if strong improvement, stagnation, repeated patterns, behavioral change. Do NOT trigger every session. Max 1.
    let serendipityTriggered = false;
    
    if (history.length >= 1 && !failsafeActive && interviewType !== 'Confidence Builder') {
      const scores = history.map(h => h.score).filter(s => typeof s === 'number');
      const hasImprovement = scores.length >= 2 && (scores[0] - scores[1]) >= 10;
      
      const hasStagnation = scores.length >= 3 && 
        Math.abs(scores[0] - scores[1]) <= 3 && 
        Math.abs(scores[1] - scores[2]) <= 3;
      
      const speechSpeedShift = patternMetrics.speakingSpeed > 150 || patternMetrics.speakingSpeed < 110;

      if (hasImprovement || hasStagnation || speechSpeedShift || patternMetrics.retryCount >= 3) {
        // Run check to see if we can trigger (handles daily/weekly anti-spam rules)
        serendipityTriggered = SerendipityService.allowNewDiscovery(userId);
      }
    }

    // -------------------------------------------------------------------------
    // 5. PROGRESSION LEVEL ADJUSTMENT (Feature 6)
    // -------------------------------------------------------------------------
    // Director adjusts question complexity, realism, pressure level, and ambiguity based on UserJourneyStage
    if (journeyStage === 'Explorer') {
      // Friendly, low complexity, high guidance
      if (difficulty === 'Normal') difficulty = 'Easy';
      interruptionLevel = 'Low';
      feedbackIntensity = 'Full Supportive';
    } else if (journeyStage === 'Expert' && !overrideApplied && settings.status !== 'custom') {
      // Extreme scale, strict realism, maximum pressure, vague prompts
      if (difficulty === 'Normal') difficulty = 'Stretch';
      if (pacing === 'Standard (45s)') pacing = 'Rapid Fire (30s)';
    }

    // Failsafe Mode fallback override if anything went wrong
    if (failsafeActive) {
      interviewType = 'Standard Interview';
      difficulty = 'Normal';
      questionStyle = 'structured';
      pacing = 'Standard (45s)';
      interruptionLevel = 'Low';
      feedbackIntensity = 'Full Supportive';
      pacingSeconds = 45;
      serendipityTriggered = false;
    }

    const design: DirectorSessionDesign = {
      interviewType,
      difficulty,
      questionStyle,
      pacing,
      interruptionLevel,
      feedbackIntensity,
      serendipityTriggered,
      overrideApplied,
      overrideReason: overrideApplied ? overrideReason : undefined,
      pacingSeconds
    };

    const state: DirectorState = {
      currentStage: journeyStage,
      bestPerformingType,
      worstPerformingType,
      preferredDifficulty,
      engagementRisk,
      failsafeActive,
      confidenceScore
    };

    return { design, state };
  },

  /**
   * Decides if the Insight Engine is authorized to execute and generate a new pattern insight.
   * Ensures the engine never interrupts the active interview flow, delays during extreme stress levels,
   * or hides insights if performance is highly volatile.
   */
  shouldRunInsightEngine(
    userId: string,
    history: SessionHistoryItem[],
    currentSessionActive: boolean
  ): { authorized: boolean; delayReason?: string; hideInsight?: boolean } {
    // 1. Never interrupt the active interview flow
    if (currentSessionActive) {
      return { authorized: false, delayReason: 'INTERVIEW_IN_PROGRESS' };
    }

    // 2. Delay when learning/performance trend is extremely volatile (variance > 25)
    if (history.length >= 3) {
      const lastScores = history.slice(0, 3).map(h => h.score || 70);
      const maxScore = Math.max(...lastScores);
      const minScore = Math.min(...lastScores);
      if (maxScore - minScore > 25) {
        return { authorized: false, delayReason: 'HIGH_PERFORMANCE_VOLATILITY' };
      }
    }

    // 3. Hide insight or delay if user has critical performance drop (score < 45)
    const latestSession = history[0];
    if (latestSession && (latestSession.score || 0) < 45) {
      return { authorized: false, delayReason: 'CRITICAL_PERFORMANCE_RECOVERY', hideInsight: true };
    }

    return { authorized: true };
  }
};
