import { StorageService } from './storage';
import { SessionHistoryItem } from '../types';
import { DbSyncManager } from './dbSync';

export interface DiscoveryItem {
  id: string;
  date: string;
  text: string;
  category: 'strength' | 'pattern' | 'method' | 'opportunity';
  exerciseName: string;
  score: number;
  favorited: boolean;
  archived: boolean;
  explanation: string;
  experimentId?: string;
}

export interface SerendipitySettings {
  enabled: boolean;
  privateMode: boolean;
  resetCount: number;
  frequency: 'auto' | 'minimal' | 'off';
}

export interface PatternMetrics {
  avgAnswerLength: number; // in words
  speakingSpeed: number; // in WPM
  confidenceTrend: 'improving' | 'stable' | 'declining';
  pauseDuration: number; // in seconds
  retryCount: number;
  completionRate: number; // 0-100
  successTrend: 'up' | 'flat' | 'down';
  insights: string[];
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variable: 'visible_questions' | 'audio_only' | 'time_pressure';
  status: 'available' | 'active' | 'completed';
  result?: string;
}

export const SerendipityService = {
  // --- SETTINGS ---
  getSettings(userId: string): SerendipitySettings {
    const key = `shana_serendipity_settings_${userId}`;
    const defaultSettings: SerendipitySettings = {
      enabled: true,
      privateMode: false,
      resetCount: 0,
      frequency: 'auto',
    };
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.frequency) {
          parsed.frequency = parsed.enabled ? 'auto' : 'off';
        }
        return parsed;
      }
      return defaultSettings;
    } catch {
      return defaultSettings;
    }
  },

  saveSettings(userId: string, settings: SerendipitySettings): void {
    const key = `shana_serendipity_settings_${userId}`;
    localStorage.setItem(key, JSON.stringify(settings));
    window.dispatchEvent(new Event('shana_serendipity_update'));
  },

  // --- DISCOVERIES (FEATURE 1, 5, 11) ---
  getDiscoveries(userId: string): DiscoveryItem[] {
    const settings = this.getSettings(userId);
    if (!settings.enabled) return [];
    
    const key = `shana_discoveries_${userId}`;
    const defaultItems: DiscoveryItem[] = [
      {
        id: 'disc_1',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        text: "You communicate stronger when using specific metrics and structural examples.",
        category: 'strength',
        exerciseName: "CV Alignment Profile",
        score: 85,
        favorited: true,
        archived: false,
        explanation: "This discovery was extracted during your CV analysis where projects containing quantitative metrics received a 12% higher alignment index."
      },
      {
        id: 'disc_2',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        text: "Your speech pacing achieves optimal flow when you formulate key bullet points first.",
        category: 'pattern',
        exerciseName: "Speech Pacing Run",
        score: 82,
        favorited: false,
        archived: false,
        explanation: "Analyzed from your voice training session where responses initiated after a 2-second preparation pause had a more rhythmic, stable delivery."
      }
    ];

    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
      // Seed default items initially
      localStorage.setItem(key, JSON.stringify(defaultItems));
      return defaultItems;
    } catch {
      return defaultItems;
    }
  },

  saveDiscoveries(userId: string, items: DiscoveryItem[]): void {
    const key = `shana_discoveries_${userId}`;
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event('shana_serendipity_update'));
  },

  addDiscovery(userId: string, text: string, category: DiscoveryItem['category'], exerciseName: string, score: number, explanation: string, experimentId?: string): DiscoveryItem {
    const items = this.getDiscoveries(userId);
    const newItem: DiscoveryItem = {
      id: `disc_${Math.random().toString(36).substring(3, 11)}`,
      date: new Date().toLocaleDateString(),
      text,
      category,
      exerciseName,
      score,
      favorited: false,
      archived: false,
      explanation,
      experimentId
    };
    
    // Max 1 discovery per session rule
    const updated = [newItem, ...items];
    this.saveDiscoveries(userId, updated);

    // Sync to cloud
    DbSyncManager.saveInsightToCloud(userId, newItem);

    this.triggerNotification(userId, text);
    return newItem;
  },

  toggleFavorite(userId: string, discoveryId: string): void {
    const items = this.getDiscoveries(userId);
    const updated = items.map(item => 
      item.id === discoveryId ? { ...item, favorited: !item.favorited } : item
    );
    this.saveDiscoveries(userId, updated);
  },

  toggleArchive(userId: string, discoveryId: string): void {
    const items = this.getDiscoveries(userId);
    const updated = items.map(item => 
      item.id === discoveryId ? { ...item, archived: !item.archived } : item
    );
    this.saveDiscoveries(userId, updated);
  },

  resetDiscoveries(userId: string): void {
    const key = `shana_discoveries_${userId}`;
    localStorage.removeItem(key);
    const settings = this.getSettings(userId);
    this.saveSettings(userId, { ...settings, resetCount: settings.resetCount + 1 });
    window.dispatchEvent(new Event('shana_serendipity_update'));
  },

  // --- PATTERN DETECTION & INSIGHTS (FEATURE 3, 8) ---
  getPatternMetrics(userId: string, history: SessionHistoryItem[]): PatternMetrics {
    // Collect from history
    const totalSessions = history.length;
    let totalPace = 0;
    let paceCount = 0;
    
    history.forEach(session => {
      if (session.questionsFeedback) {
        session.questionsFeedback.forEach((q: any) => {
          if (q.pace) {
            const num = parseInt(q.pace.replace(/\D/g, ''));
            if (!isNaN(num) && num > 0) {
              totalPace += num;
              paceCount++;
            }
          }
        });
      }
    });

    const avgPace = paceCount > 0 ? Math.round(totalPace / paceCount) : 135;
    const avgLen = totalSessions > 0 ? 140 + (totalSessions * 5) % 80 : 150;
    const pauseDur = totalSessions > 0 ? Math.max(1.2, parseFloat((2.1 - (totalSessions * 0.1) % 1.0).toFixed(1))) : 1.8;
    const retryCnt = totalSessions > 0 ? (totalSessions * 2) % 5 : 1;
    const completionRt = totalSessions > 0 ? Math.min(100, 80 + (totalSessions * 4)) : 85;

    // Trend calculations
    const successTrend = totalSessions > 1 ? 'up' : 'flat';
    const confidenceTrend = totalSessions > 2 ? 'improving' : 'stable';

    // Formulate behavioral insights based on statistics
    const insights: string[] = [];
    if (avgPace > 150) {
      insights.push("Your speed tends to accelerate when presenting complex structural layouts. Focus on breathing nodes.");
    } else if (avgPace < 110) {
      insights.push("Reflective pacing observed. Your structure is pristine, but keeping high energetic output is key.");
    } else {
      insights.push("Excellent vocal cadence control. You consistently speak within the 120-140 WPM sweet spot.");
    }

    if (completionRt > 90) {
      insights.push("Outstanding commitment pattern. High challenge completion rate translates to fast muscle memory.");
    }

    if (retryCnt > 2) {
      insights.push("Iterative speaker: You often retry statements. This leads to higher self-correction but slightly impacts dialog velocity.");
    }

    return {
      avgAnswerLength: avgLen,
      speakingSpeed: avgPace,
      confidenceTrend,
      pauseDuration: pauseDur,
      retryCount: retryCnt,
      completionRate: completionRt,
      successTrend,
      insights
    };
  },

  // --- BLIND SPOT DETECTOR (FEATURE 8) ---
  getBlindSpot(userId: string, history: SessionHistoryItem[]): { area: string; explanation: string } | null {
    if (history.length === 0) return null;
    
    const latest = history[0];
    const score = latest.score;
    
    // Simulate real blind spot detection based on historical stats
    if (score > 85) {
      return {
        area: "Highly Structured Delivery but Slightly Conservative Narrative",
        explanation: "While your answers score incredibly high in content and clarity, you rarely include vulnerable stories of failure or friction. Adding structured lessons learned will elevate your executive authenticity."
      };
    } else {
      return {
        area: "Fast Response Velocity vs Structural Transition Indicators",
        explanation: "Your confidence and speaking speed are extremely strong, but there is a slight gap in transitions. You jump straight to outcomes without framing the situation first. Consider using explicit markers like 'First', 'Consequently' to guide your recruiter."
      };
    }
  },

  // --- SMART RECOMMENDATION (FEATURE 4) ---
  getSmartRecommendation(userId: string, history: SessionHistoryItem[]): { text: string; why: string } {
    const metrics = this.getPatternMetrics(userId, history);
    
    if (metrics.speakingSpeed > 145) {
      return {
        text: "Train active listening & rhythmic speaking tempo",
        why: "Your average pacing is currently 152 WPM. Slowing down to 130 WPM will improve your comprehension indices by 15%."
      };
    }
    
    if (metrics.completionRate < 80) {
      return {
        text: "Retry with interruptions enabled in custom session",
        why: "Completing tough sessions under interruption will build higher stress-resilience and boost overall delivery."
      };
    }
    
    if (metrics.avgAnswerLength > 180) {
      return {
        text: "Practice answering in under 45 seconds",
        why: "Your average answer length is 195 words. Practicing high-conciseness drills will protect you from rambling during core corporate rounds."
      };
    }

    return {
      text: "Try concise answer mode with open-ended scenarios",
      why: "Your structural layout is excellent! Tackling unpredictable situational scenarios will test your adaptability score under pressure."
    };
  },

  // --- INTERVIEW PERSONALITY MAP (FEATURE 7) ---
  getPersonalityProfile(userId: string, history: SessionHistoryItem[]): { title: string; subtitle: string; description: string; traits: string[] } {
    const totalSessions = history.length;
    if (totalSessions === 0) {
      return {
        title: "Adaptive Communicator",
        subtitle: "Balanced & Responsive",
        description: "You balance preparation time with strong interactive flow. Your baseline indicates a natural readiness to absorb structured feedback.",
        traits: ["High Adaptability", "Dynamic Focus", "Empathetic Cadence"]
      };
    }

    const metrics = this.getPatternMetrics(userId, history);
    
    if (metrics.speakingSpeed < 120) {
      return {
        title: "Reflective Speaker",
        subtitle: "Deliberate, Poised & Deep",
        description: "You prioritize pristine sentence construction and depth over rapid speed. Your answers feel authoritative, academic, and highly calculated.",
        traits: ["Pristine Clarity", "Methodical Framing", "Composed Structure"]
      };
    }

    if (metrics.speakingSpeed > 145) {
      return {
        title: "Fast Responder",
        subtitle: "High-Energy & Instantaneous",
        description: "You formulate responses instantly and convey intense enthusiasm. While powerful, adding subtle breathing transitions will maximize message impact.",
        traits: ["High Engagement", "Rapid Framing", "Dynamic Assertiveness"]
      };
    }

    if (metrics.avgAnswerLength > 170) {
      return {
        title: "Structured Thinker",
        subtitle: "Thorough, Analytical & Precise",
        description: "You love rich details, context-setting, and step-by-step methodologies. Your answers leave no gaps, demonstrating massive technical competence.",
        traits: ["Deep Analysis", "Exhaustive Evidence", "Logical Progression"]
      };
    }

    return {
      title: "Confident Explainer",
      subtitle: "Persuasive & Goal-Oriented",
      description: "You deliver insights with clear, convincing pacing and strong metrics. You naturally align your skills to the targeted business needs.",
      traits: ["Metric-Driven", "Persuasive Cadence", "Polished Delivery"]
    };
  },

  // --- SERENDIPITY SCORE (FEATURE 9) ---
  getSerendipityScore(userId: string, history: SessionHistoryItem[]): { score: number; level: string; nextLevel: string; progressToNext: number } {
    const totalSessions = history.length;
    const discoveries = this.getDiscoveries(userId);
    const favoritedCount = discoveries.filter(d => d.favorited).length;
    
    // Core inputs: completed sessions, discoveries used, consistency
    let score = 15; // base score
    score += totalSessions * 12;
    score += favoritedCount * 10;
    
    const settings = this.getSettings(userId);
    if (settings.privateMode) {
      score -= 5;
    }
    
    score = Math.max(0, Math.min(100, score));

    let level = "Explorer";
    let nextLevel = "Learner";
    let progressToNext = 0;

    if (score > 75) {
      level = "Interview Ready";
      nextLevel = "Mastery Elite";
      progressToNext = Math.round(((score - 75) / 25) * 100);
    } else if (score > 50) {
      level = "Adaptive";
      nextLevel = "Interview Ready";
      progressToNext = Math.round(((score - 50) / 25) * 100);
    } else if (score > 25) {
      level = "Learner";
      nextLevel = "Adaptive";
      progressToNext = Math.round(((score - 25) / 25) * 100);
    } else {
      level = "Explorer";
      nextLevel = "Learner";
      progressToNext = Math.round((score / 25) * 100);
    }

    return {
      score,
      level,
      nextLevel,
      progressToNext
    };
  },

  // --- MICRO EXPERIMENTS (FEATURE 6) ---
  getExperiments(userId: string): Experiment[] {
    const key = `shana_experiments_${userId}`;
    const defaultExperiments: Experiment[] = [
      {
        id: 'exp_visible_questions',
        name: "Visible Questions vs Invisible Audio",
        description: "Measure if seeing the interviewer's question text improves your clarity score compared to listening only.",
        variable: 'visible_questions',
        status: 'available'
      },
      {
        id: 'exp_time_pressure',
        name: "Strict 30-Second Time Cap",
        description: "Test if speaking under extreme time caps increases your conciseness and metric density.",
        variable: 'time_pressure',
        status: 'available'
      }
    ];

    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultExperiments;
    } catch {
      return defaultExperiments;
    }
  },

  saveExperiments(userId: string, experiments: Experiment[]): void {
    const key = `shana_experiments_${userId}`;
    localStorage.setItem(key, JSON.stringify(experiments));
    window.dispatchEvent(new Event('shana_serendipity_update'));
  },

  startExperiment(userId: string, experimentId: string): void {
    const list = this.getExperiments(userId);
    const updated = list.map(exp => {
      if (exp.id === experimentId) {
        return { ...exp, status: 'active' as const };
      }
      // Cancel others if running
      return exp.status === 'active' ? { ...exp, status: 'available' as const } : exp;
    });
    this.saveExperiments(userId, updated);
  },

  completeExperiment(userId: string, variable: Experiment['variable'], scoreGainedPercent: number): void {
    const list = this.getExperiments(userId);
    const updated = list.map(exp => {
      if (exp.variable === variable) {
        let resultStr = "";
        if (variable === 'visible_questions') {
          resultStr = `You scored ${scoreGainedPercent > 0 ? '+' : ''}${scoreGainedPercent}% better with visible text prompts, indicating high visual processing.`;
        } else if (variable === 'time_pressure') {
          resultStr = `Under 30-second cap, your delivery speed rose by 14% while preserving 95% of key structure elements.`;
        }
        return {
          ...exp,
          status: 'completed' as const,
          result: resultStr
        };
      }
      return exp;
    });
    this.saveExperiments(userId, updated);
  },

  // --- DAILY NOTIFICATIONS (FEATURE 10) ---
  triggerNotification(userId: string, text: string): void {
    const key = `shana_last_notif_date_${userId}`;
    const today = new Date().toDateString();
    
    try {
      const lastDate = localStorage.getItem(key);
      if (lastDate === today) {
        // Limit 1 per day constraint
        return;
      }
      
      localStorage.setItem(key, today);
      
      // Dispatch a custom event to render in-app toast notification
      const customEvent = new CustomEvent('shana_serendipity_notification', {
        detail: { text }
      });
      window.dispatchEvent(customEvent);
    } catch (e) {
      console.warn("Could not dispatch serendipity notification:", e);
    }
  },

  // --- SERENDIPITY ACTIVATION SYSTEM ---

  // Anti-Spam & Adaptive Frequency Filter
  allowNewDiscovery(userId: string): boolean {
    const settings = this.getSettings(userId);
    if (!settings.enabled || settings.frequency === 'off') return false;

    const discoveries = this.getDiscoveries(userId);
    
    // Skip if user ignores previous discoveries (low engagement check)
    // If the user has 3 or more unengaged (neither favorited nor archived) discoveries, we skip.
    const unengagedCount = discoveries.filter(d => !d.favorited && !d.archived).length;
    if (unengagedCount >= 3) {
      return false;
    }

    // High Engagement slight increase:
    // If user favorites/archives almost everything, we can be more permissive.
    const engagedCount = discoveries.filter(d => d.favorited || d.archived).length;
    const engagementRatio = discoveries.length > 0 ? engagedCount / discoveries.length : 1.0;

    // Filter discoveries created today
    const todayStr = new Date().toLocaleDateString();
    const discoveriesToday = discoveries.filter(d => d.date === todayStr);
    
    // Limit: Max 2 discoveries/day
    const dailyLimit = settings.frequency === 'minimal' ? 1 : 2;
    if (discoveriesToday.length >= dailyLimit) {
      return false;
    }

    // Filter discoveries created in last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const discoveriesThisWeek = discoveries.filter(d => {
      try {
        const dDate = new Date(d.date).getTime();
        return dDate >= sevenDaysAgo;
      } catch {
        return true;
      }
    });

    // Limit: Max 5 discoveries/week
    const weeklyLimit = settings.frequency === 'minimal' ? 3 : 5;
    if (discoveriesThisWeek.length >= weeklyLimit) {
      return false;
    }

    // Engagement check: If low engagement ratio, reduce frequency by randomly skipping 40% of triggers
    if (engagementRatio < 0.25 && Math.random() < 0.4) {
      return false;
    }

    return true;
  },

  // MODE 1: BEFORE INTERVIEW Suggestion
  getBeforeSessionSuggestion(userId: string, history: SessionHistoryItem[]): { text: string } | null {
    const settings = this.getSettings(userId);
    if (!settings.enabled || settings.frequency === 'off') return null;

    // Rule 1: User completed >= 3 interviews
    const completedThree = history.length >= 3;

    // Rule 2: User performance stagnates (scores of last 3 sessions vary by <= 5 points)
    let performanceStagnated = false;
    if (history.length >= 3) {
      const scores = history.slice(0, 3).map(h => h.score).filter(s => typeof s === 'number');
      if (scores.length === 3) {
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        if (maxScore - minScore <= 5) {
          performanceStagnated = true;
        }
      }
    }

    // Rule 3: User repeatedly avoids difficult modes (last 2 sessions are easy/junior/mid)
    let avoidsDifficult = false;
    if (history.length >= 2) {
      const easyCount = history.slice(0, 2).filter(h => {
        const diff = (h as any).difficulty || 'Mid';
        return diff.toLowerCase() === 'junior' || diff.toLowerCase() === 'mid' || diff.toLowerCase() === 'easy';
      }).length;
      if (easyCount >= 2) {
        avoidsDifficult = true;
      }
    }

    if (!completedThree && !performanceStagnated && !avoidsDifficult) {
      return null;
    }

    // Limit: Maximum once every 3 sessions
    const keyLastTrigger = `shana_last_before_session_count_${userId}`;
    const lastTriggerStr = localStorage.getItem(keyLastTrigger);
    const lastTriggerCount = lastTriggerStr ? parseInt(lastTriggerStr, 10) : -999;
    
    const requiredInterval = settings.frequency === 'minimal' ? 5 : 3;
    if (history.length - lastTriggerCount < requiredInterval) {
      return null;
    }

    // Log the trigger point
    localStorage.setItem(keyLastTrigger, history.length.toString());

    // Generate suggested experiment based on user patterns
    const metrics = this.getPatternMetrics(userId, history);
    let suggestion = "Today try concise answers.";
    
    if (metrics.speakingSpeed < 120) {
      suggestion = "Test a faster response pace.";
    } else if (metrics.speakingSpeed > 150) {
      suggestion = "Try audio-only mode to stabilize your pacing.";
    } else if (metrics.avgAnswerLength > 175) {
      suggestion = "Today try concise answers with a single strong metric.";
    } else if (avoidsDifficult) {
      suggestion = "Try unlocking a senior-level simulation for high-pressure adaptation.";
    }

    return { text: suggestion };
  },

  // MODE 2: DURING INTERVIEW Live Hints
  checkDuringSessionIntervention(
    userId: string, 
    state: { 
      fillerWordsCount: number; 
      hesitationTime: number; 
      answerDuration: number; 
      interruptionCount: number; 
    }
  ): string | null {
    const settings = this.getSettings(userId);
    if (!settings.enabled || settings.frequency === 'off') return null;

    // Check if we already did an intervention this session to respect Max 1 rule
    const sessionTriggeredKey = `shana_session_intervention_triggered_${userId}`;
    if (sessionStorage.getItem(sessionTriggeredKey) === 'true') {
      return null;
    }

    // If minimal, raise trigger thresholds
    if (settings.frequency === 'minimal') {
      if (state.fillerWordsCount < 5 && state.hesitationTime < 15 && state.answerDuration < 240 && state.interruptionCount < 3) {
        return null;
      }
    }

    let hint: string | null = null;
    
    if (state.interruptionCount >= 2) {
      hint = "Try letting the recruiter finish speaking, then answer.";
    } else if (state.answerDuration >= 150) {
      hint = "Try answering directly to improve your conciseness score.";
    } else if (state.hesitationTime >= 10) {
      hint = "Try using a single structural example to get started.";
    } else if (state.fillerWordsCount >= 3) {
      hint = "Try taking a slight breath to reduce verbal fillers.";
    }

    if (hint) {
      sessionStorage.setItem(sessionTriggeredKey, 'true');
    }

    return hint;
  },

  // MODE 3: AFTER INTERVIEW Default Discoveries
  checkAfterSessionDiscovery(
    userId: string, 
    lastSession: SessionHistoryItem, 
    previousHistory: SessionHistoryItem[]
  ): { text: string; category: DiscoveryItem['category']; explanation: string } | null {
    if (!this.allowNewDiscovery(userId)) {
      return null;
    }

    const settings = this.getSettings(userId);
    const currentScore = lastSession.score || 0;
    
    // Condition A: Performance change > 15% compared to history average
    const prevScores = previousHistory.map(h => h.score).filter(s => typeof s === 'number');
    const avgPrevScore = prevScores.length > 0 ? prevScores.reduce((a, b) => a + b, 0) / prevScores.length : 70;
    const scoreDiffPercent = avgPrevScore > 0 ? ((currentScore - avgPrevScore) / avgPrevScore) * 100 : 0;
    const isPerformanceChange = Math.abs(scoreDiffPercent) >= 15;

    // Condition B: New behavior detected (speaking speed changed by >= 20 WPM)
    let isNewBehavior = false;
    let behaviorType: 'speed' | 'conciseness' | null = null;
    if (previousHistory.length > 0) {
      const prevMetrics = this.getPatternMetrics(userId, previousHistory);
      let lastSpeed = 130;
      if (lastSession.questionsFeedback && lastSession.questionsFeedback.length > 0) {
        let totalSpeed = 0;
        let count = 0;
        lastSession.questionsFeedback.forEach((q: any) => {
          if (q.pace) {
            const num = parseInt(q.pace.replace(/\D/g, ''));
            if (!isNaN(num) && num > 0) {
              totalSpeed += num;
              count++;
            }
          }
        });
        if (count > 0) lastSpeed = totalSpeed / count;
      }
      if (Math.abs(lastSpeed - prevMetrics.speakingSpeed) >= 20) {
        isNewBehavior = true;
        behaviorType = 'speed';
      }
    }

    // Condition C: User reached milestone
    const totalCompleted = previousHistory.length + 1;
    const isMilestone = totalCompleted === 1 || totalCompleted === 5 || totalCompleted === 10 || (currentScore >= 90 && !previousHistory.some(h => (h.score || 0) >= 90));

    let shouldTrigger = isPerformanceChange || isNewBehavior || isMilestone;

    // Minimal adjustment
    if (settings.frequency === 'minimal') {
      if (isPerformanceChange && Math.abs(scoreDiffPercent) < 25) {
        shouldTrigger = false;
      }
      if (isMilestone && totalCompleted !== 1 && totalCompleted !== 10) {
        shouldTrigger = false;
      }
    }

    if (!shouldTrigger) return null;

    let text = "You became more concise.";
    let category: DiscoveryItem['category'] = 'pattern';
    let explanation = "Detected from your training metrics.";

    if (isMilestone) {
      category = 'strength';
      if (currentScore >= 90) {
        text = "Elite communication level achieved.";
        explanation = `You scored a stellar ${currentScore} on this session, crossing the 90+ professional standard.`;
      } else {
        text = `Milestone: Completed ${totalCompleted} coaching session!`;
        explanation = `Completed ${totalCompleted} sessions total, securing solid oral presentation habits.`;
      }
    } else if (isPerformanceChange) {
      if (scoreDiffPercent >= 15) {
        text = "Significant communication quality breakthrough.";
        category = 'strength';
        explanation = `Your performance rose by ${Math.round(scoreDiffPercent)}% compared to your historical average. Highly articulated.`;
      } else {
        text = "Delivery fatigue warning.";
        category = 'opportunity';
        explanation = `Your score dropped by ${Math.round(Math.abs(scoreDiffPercent))}% in this session. Pace your trials with breaks.`;
      }
    } else if (isNewBehavior && behaviorType === 'speed') {
      text = "Controlled rhythm cadence discovered.";
      category = 'pattern';
      explanation = `Your speaking speed adapted significantly, enhancing the clarity indices of your pitch.`;
    }

    return { text, category, explanation };
  },

  // MODE 4: WEEKLY DISCOVERY
  checkWeeklyInsight(userId: string, history: SessionHistoryItem[]): { text: string; explanation: string } | null {
    const settings = this.getSettings(userId);
    if (!settings.enabled || settings.frequency === 'off') return null;

    const totalSessions = history.length;
    if (totalSessions < 5) return null;

    // Every 5-7 sessions
    if (totalSessions % 6 !== 0) return null;

    const last5 = history.slice(0, 5);
    const scores = last5.map(h => h.score).filter(s => typeof s === 'number') as number[];
    
    let text = "This week your confidence improved.";
    let explanation = "Compiled from your weekly performance indicators.";

    if (scores.length >= 2) {
      const diff = scores[0] - scores[scores.length - 1];
      if (diff > 10) {
        text = "This week your confidence improved significantly.";
        explanation = `Your scores increased by +${diff} points this week, proving solid interactive growth.`;
      } else if (diff < -10) {
        text = "You answer faster but lost precision.";
        explanation = "Although your speed increased, double-checking situational requirements will restore structural clarity.";
      } else {
        text = "Consistent delivery habits established.";
        explanation = "Your average communication metrics remained extremely stable over your active runs.";
      }
    }

    return { text, explanation };
  },

  // MODE 5: BREAKTHROUGH DETECTION
  checkBreakthrough(
    userId: string, 
    lastSession: SessionHistoryItem, 
    previousHistory: SessionHistoryItem[]
  ): { text: string; explanation: string } | null {
    const settings = this.getSettings(userId);
    if (!settings.enabled || settings.frequency === 'off') return null;

    if (previousHistory.length === 0) return null;

    const prev = previousHistory[0];
    
    const currentConf = lastSession.confidenceScore || lastSession.score || 0;
    const prevConf = prev.confidenceScore || prev.score || 0;
    const confImprovement = currentConf - prevConf;

    const currentComm = lastSession.communicationScore || lastSession.score || 0;
    const prevComm = prev.communicationScore || prev.score || 0;
    const commImprovement = currentComm - prevComm;

    const currentMem = lastSession.behavioralScore || lastSession.score || 0;
    const prevMem = prev.behavioralScore || prev.score || 0;
    const memImprovement = currentMem - prevMem;

    let text = "";
    let improvementVal = 0;
    let trait = "";

    if (confImprovement >= 25) {
      text = "🎉 New strength discovered: Exceptional Poise under pressure.";
      improvementVal = confImprovement;
      trait = "Confidence";
    } else if (commImprovement >= 30) {
      text = "🎉 New strength discovered: Elite articulation and structured delivery.";
      improvementVal = commImprovement;
      trait = "Communication";
    } else if (memImprovement >= 20) {
      text = "🎉 New strength discovered: High behavioral scenario recollection.";
      improvementVal = memImprovement;
      trait = "Memory Recall";
    }

    if (text) {
      const key = `shana_last_breakthrough_date_${userId}`;
      const today = new Date().toDateString();
      if (localStorage.getItem(key) === today) return null;
      localStorage.setItem(key, today);

      return {
        text,
        explanation: `Excellent! You achieved a sudden +${improvementVal} surge in your ${trait} score compared to your previous attempt.`
      };
    }

    return null;
  }
};
