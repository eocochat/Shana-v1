import { ShanaEventTracker } from './events';

export interface InsightInput {
  user_profile: {
    target_role: string;
    experience_level: string;
    language: string;
    onboarding_summary: string;
    cv_summary: string;
  };
  session_state: {
    session_id: string;
    current_state: string;
    interview_mode: string;
    question_index: number;
    progress: number;
  };
  ips_history: {
    previous_ips: number;
    trend: 'improving' | 'declining' | 'stagnant' | 'stable' | 'unknown';
    recent_strengths: string[];
    recent_weaknesses: string[];
  };
  recent_sessions_summary: {
    sessionId: string;
    score: number;
    date: string;
  }[];
  behavioral_patterns: {
    fillerWordsCount: number;
    answerDuration: number;
    pacingSpeedWpm: number;
  };
  adaptation_history: {
    worked: string[];
    failed: string[];
  };
  evaluation_history: {
    clarity: number;
    structure: number;
    confidence: number;
    relevance: number;
    conciseness: number;
  }[];
  constraints: {
    max_response_size: string;
    no_score_generation: boolean;
    no_memory_creation: boolean;
    follow_output_schema: boolean;
  };
}

export type InsightCategory = 
  | 'Strength'
  | 'Weakness'
  | 'Communication Pattern'
  | 'Confidence Pattern'
  | 'Interview Strategy'
  | 'Learning Trend'
  | 'Behavioral Pattern'
  | 'Improvement Opportunity'
  | 'NO_NEW_INSIGHT';

export interface InsightResponse {
  insight_category: InsightCategory;
  title?: string;
  insight?: string;
  supporting_evidence?: string;
  confidence_score?: number; // 0.00 to 1.00
  recommended_focus?: string;
  priority?: 'low' | 'medium' | 'high';
}

export const NO_NEW_INSIGHT_RESPONSE: InsightResponse = {
  insight_category: 'NO_NEW_INSIGHT'
};

export const ShanaInsightEngine = {
  /**
   * Evaluates the session performance context and generates an evidence-based behavioral insight
   * using the OpenAI-powered server API. Strictly implements anti-spam, discovery criteria, validation,
   * and cooldown safeguards.
   */
  async generateInsight(input: InsightInput): Promise<InsightResponse> {
    const userId = input.session_state.session_id.split('_')[0] || 'usr_candidate';
    const sessionId = input.session_state.session_id;

    // 1. Emit insight_requested event
    ShanaEventTracker.logEvent(userId, sessionId, 'insight_requested', {
      timestamp: new Date().toISOString(),
      questionIndex: input.session_state.question_index,
      ips_trend: input.ips_history.trend
    });

    // 2. Anti-Spam / Cooldown Check: 1 insight per interview maximum, 3 insights per week
    const sessionEvents = ShanaEventTracker.getSessionEvents(userId, sessionId);
    const insightsInSession = sessionEvents.filter(e => e.eventType === 'insight_generated');
    
    if (insightsInSession.length > 0) {
      console.log(`[SHANA INSIGHT ENGINE] Cooldown: Already generated an insight in this interview session.`);
      ShanaEventTracker.logEvent(userId, sessionId, 'insight_rejected', {
        reason: 'cooldown_session_limit_reached'
      });
      return NO_NEW_INSIGHT_RESPONSE;
    }

    // Weekly limits / overall frequency limit
    const allUserEvents = ShanaEventTracker.getEvents(userId);
    const weeklyInsights = allUserEvents.filter(e => {
      if (e.eventType !== 'insight_generated') return false;
      try {
        const eventTime = new Date(e.timestamp).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return eventTime >= sevenDaysAgo;
      } catch {
        return false;
      }
    });

    if (weeklyInsights.length >= 3) {
      console.log(`[SHANA INSIGHT ENGINE] Anti-Spam: Weekly limit of 3 insights has been reached.`);
      ShanaEventTracker.logEvent(userId, sessionId, 'insight_rejected', {
        reason: 'weekly_limit_reached',
        weekly_count: weeklyInsights.length
      });
      return NO_NEW_INSIGHT_RESPONSE;
    }

    // 3. Discovery Conditions Check (Prerequisites for attempting AI analysis)
    // Needs repeated behavior, significant changes, or consistent history patterns.
    const totalSessionsCompleted = input.recent_sessions_summary?.length || 0;
    const hasEnoughHistory = totalSessionsCompleted >= 1 || input.evaluation_history?.length >= 3;
    const hasInterestingMetrics = 
      input.behavioral_patterns.fillerWordsCount > 4 ||
      input.behavioral_patterns.answerDuration > 140 ||
      input.behavioral_patterns.pacingSpeedWpm > 155 ||
      input.behavioral_patterns.pacingSpeedWpm < 105;

    if (!hasEnoughHistory && !hasInterestingMetrics) {
      console.log(`[SHANA INSIGHT ENGINE] Discovery Conditions Not Met: Stable early-stage performance with insufficient history patterns.`);
      ShanaEventTracker.logEvent(userId, sessionId, 'insight_rejected', {
        reason: 'insufficient_discovery_signals'
      });
      return NO_NEW_INSIGHT_RESPONSE;
    }

    try {
      console.log(`[SHANA INSIGHT ENGINE] Calling backend AI Insight Generator...`);
      const response = await fetch('/api/interview/insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.insightPack) {
          const rawInsight: InsightResponse = data.insightPack;

          // 4. Validate Insight Integrity
          if (rawInsight.insight_category === 'NO_NEW_INSIGHT' || !rawInsight.insight) {
            console.log(`[SHANA INSIGHT ENGINE] No new meaningful or reliable pattern detected.`);
            ShanaEventTracker.logEvent(userId, sessionId, 'insight_rejected', {
              reason: 'no_meaningful_pattern_detected'
            });
            return NO_NEW_INSIGHT_RESPONSE;
          }

          // Validation Checklist Rules:
          // - Confidence score must be >= 0.70 to display.
          // - Ensure title and supporting evidence exist.
          const confidence = rawInsight.confidence_score !== undefined ? rawInsight.confidence_score : 1.0;
          
          if (confidence < 0.70) {
            console.warn(`[SHANA INSIGHT ENGINE] Insight failed validation: low confidence score (${confidence})`);
            ShanaEventTracker.logEvent(userId, sessionId, 'insight_rejected', {
              reason: 'validation_failed_low_confidence',
              confidence_score: confidence
            });
            return NO_NEW_INSIGHT_RESPONSE;
          }

          if (!rawInsight.title || !rawInsight.supporting_evidence) {
            console.warn(`[SHANA INSIGHT ENGINE] Insight failed validation: missing mandatory fields.`);
            ShanaEventTracker.logEvent(userId, sessionId, 'insight_rejected', {
              reason: 'validation_failed_missing_required_fields'
            });
            return NO_NEW_INSIGHT_RESPONSE;
          }

          // Verify with Anti-Duplication Rule: Check previous titles or texts to avoid repeating identical insight
          const previousInsights = allUserEvents.filter(e => e.eventType === 'insight_generated');
          const isDuplicate = previousInsights.some(e => {
            const prevTitle = e.payload?.title || '';
            const prevText = e.payload?.insight || '';
            return (
              prevTitle.toLowerCase() === rawInsight.title?.toLowerCase() ||
              prevText.toLowerCase() === rawInsight.insight?.toLowerCase()
            );
          });

          if (isDuplicate) {
            console.warn(`[SHANA INSIGHT ENGINE] Insight failed validation: duplicate insight pattern detected.`);
            ShanaEventTracker.logEvent(userId, sessionId, 'insight_rejected', {
              reason: 'validation_failed_duplicate_pattern'
            });
            return NO_NEW_INSIGHT_RESPONSE;
          }

          // Insight fully validated!
          ShanaEventTracker.logEvent(userId, sessionId, 'insight_validated', {
            insight_category: rawInsight.insight_category,
            title: rawInsight.title,
            confidence_score: confidence
          });

          ShanaEventTracker.logEvent(userId, sessionId, 'insight_generated', {
            insight_category: rawInsight.insight_category,
            title: rawInsight.title,
            insight: rawInsight.insight,
            supporting_evidence: rawInsight.supporting_evidence,
            confidence_score: confidence,
            recommended_focus: rawInsight.recommended_focus,
            priority: rawInsight.priority
          });

          return rawInsight;
        }
      }
      throw new Error('Invalid or un-parsable response received from insight API endpoint.');
    } catch (err: any) {
      console.warn(`[SHANA INSIGHT ENGINE] Insight Engine Exception. Fallback to NO_NEW_INSIGHT failsafe:`, err);
      ShanaEventTracker.logEvent(userId, sessionId, 'error_detected', {
        errorMessage: err?.message || String(err),
        action_taken: 'failsafe_no_insight_triggered'
      });
      return NO_NEW_INSIGHT_RESPONSE;
    }
  },

  /**
   * Tracks user UI interaction with the insight cards
   */
  logInsightDisplayed(userId: string, sessionId: string, title: string): void {
    ShanaEventTracker.logEvent(userId, sessionId, 'insight_displayed', {
      title,
      timestamp: new Date().toISOString()
    });
  },

  logInsightDismissed(userId: string, sessionId: string, title: string): void {
    ShanaEventTracker.logEvent(userId, sessionId, 'insight_dismissed', {
      title,
      timestamp: new Date().toISOString()
    });
  }
};
