import { ShanaEventTracker } from './events';

export interface AdaptationInput {
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
  recent_events: {
    eventType: string;
    timestamp: string;
    payload: any;
  }[];
  current_difficulty: string;
  current_interview_mode: string;
  recent_feedback?: {
    clarity?: number;
    structure?: number;
    confidence?: number;
    relevance?: number;
    conciseness?: number;
    strength?: string;
    improvement_area?: string;
    action_tip?: string;
    flags?: string[];
  };
  adaptation_history: {
    worked: string[];
    failed: string[];
  };
  constraints: {
    max_response_size: string;
    no_score_generation: boolean;
    no_memory_creation: boolean;
    follow_output_schema: boolean;
  };
}

export interface AdaptationResponse {
  recommended_action: string;
  reason: string;
  confidence: number;
  expected_outcome: string;
  priority: 'low' | 'medium' | 'high';
  cooldown: number;
  explanation: string;
  reduced_confidence?: boolean;
}

export const BASELINE_ADAPTATION: AdaptationResponse = {
  recommended_action: "maintain difficulty",
  reason: "Baseline performance patterns are within normal thresholds. No immediate adjustment required.",
  confidence: 90,
  expected_outcome: "Maintain structured diagnostic pacing to ensure consistent candidate calibration.",
  priority: "low",
  cooldown: 1,
  explanation: "We are keeping the current interview settings to gather more data points on your professional background."
};

export const ShanaAdaptationEngine = {
  /**
   * Recommends the next interview adaptation based on the candidate's recent performance.
   * Leverages the OpenAI-powered backend API, applies calibration and cooldown rules,
   * integrates with Shana Events, and returns the approved adaptation recomendation.
   */
  async recommendAdaptation(input: AdaptationInput): Promise<AdaptationResponse> {
    const userId = input.session_state.session_id.split('_')[0] || 'usr_candidate';
    const sessionId = input.session_state.session_id;

    // 1. Log adaptation_requested event
    ShanaEventTracker.logEvent(userId, sessionId, 'adaptation_requested', {
      timestamp: new Date().toISOString(),
      questionIndex: input.session_state.question_index,
      current_difficulty: input.current_difficulty,
      ips_trend: input.ips_history.trend
    });

    // 2. Cooldown check: Avoid repeating the same adaptation continuously
    const sessionEvents = ShanaEventTracker.getSessionEvents(userId, sessionId);
    const prevRecommendations = sessionEvents.filter(e => e.eventType === 'adaptation_recommended');
    
    if (prevRecommendations.length > 0) {
      const lastRec = prevRecommendations[prevRecommendations.length - 1];
      const cooldownTurns = Number(lastRec.payload?.cooldown) || 1;
      const lastRecIndex = Number(lastRec.payload?.questionIndex) || 0;
      const currentIndex = input.session_state.question_index;

      if (currentIndex - lastRecIndex < cooldownTurns) {
        console.log(`[SHANA ADAPTATION ENGINE] Adaptation on cooldown. Forcing maintain_current_state.`);
        const cooldownResponse: AdaptationResponse = {
          recommended_action: "maintain difficulty",
          reason: "Prior adaptation recommendation is still within its active cooldown period.",
          confidence: 95,
          expected_outcome: "Allow candidate to adjust to prior modification before introducing new changes.",
          priority: "low",
          cooldown: 1,
          explanation: "Maintaining current difficulty state to allow stable candidate performance calibration."
        };

        // Log events for approved adaptation
        ShanaEventTracker.logEvent(userId, sessionId, 'adaptation_recommended', {
          ...cooldownResponse,
          questionIndex: currentIndex
        });

        ShanaEventTracker.logEvent(userId, sessionId, 'adaptation_approved', {
          recommended_action: cooldownResponse.recommended_action,
          reason: "Approved by director under active cooldown limits."
        });

        ShanaEventTracker.logEvent(userId, sessionId, 'adaptation_applied', {
          recommended_action: cooldownResponse.recommended_action,
          timestamp: new Date().toISOString()
        });

        return cooldownResponse;
      }
    }

    try {
      console.log(`[SHANA ADAPTATION ENGINE] Submitting context for adaptation recommendations...`);
      const response = await fetch('/api/interview/adapt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.adaptation) {
          let rec: AdaptationResponse = data.adaptation;
          let reducedConfidence = false;

          // 3. Calibration Rules
          // Detect unstable evaluations or recommendations
          const averageScore = input.recent_feedback 
            ? ((input.recent_feedback.clarity || 70) + 
               (input.recent_feedback.structure || 70) + 
               (input.recent_feedback.confidence || 70) + 
               (input.recent_feedback.relevance || 70) + 
               (input.recent_feedback.conciseness || 70)) / 5
            : 70;

          // Overly harsh or overly generous indicators can log anomalies
          if (averageScore > 98) {
            ShanaEventTracker.logEvent(userId, sessionId, 'error_detected', {
              calibration_anomaly: 'adaptation_input_excessive_generous',
              ips_average: averageScore
            });
          } else if (averageScore < 30) {
            ShanaEventTracker.logEvent(userId, sessionId, 'error_detected', {
              calibration_anomaly: 'adaptation_input_excessive_harsh',
              ips_average: averageScore
            });
          }

          // Check for instability in recommended actions back-to-back
          if (prevRecommendations.length > 0) {
            const lastRecAction = prevRecommendations[prevRecommendations.length - 1].payload?.recommended_action;
            const newRecAction = rec.recommended_action;

            // Opposing adaptation actions back-to-back indicate recommendation instability
            const isOpposing = 
              (lastRecAction === 'increase difficulty' && newRecAction === 'decrease difficulty') ||
              (lastRecAction === 'decrease difficulty' && newRecAction === 'increase difficulty') ||
              (lastRecAction === 'encourage more detail' && newRecAction === 'request more concise answers') ||
              (lastRecAction === 'request more concise answers' && newRecAction === 'encourage more detail');

            if (isOpposing) {
              console.warn(`[SHANA ADAPTATION ENGINE] Recommendation volatility detected. Reducing confidence.`);
              reducedConfidence = true;
              rec.confidence = Math.max(10, rec.confidence - 35);

              ShanaEventTracker.logEvent(userId, sessionId, 'error_detected', {
                calibration_anomaly: 'calibration_unstable',
                last_recommendation: lastRecAction,
                new_recommendation: newRecAction,
                reduced_confidence: true
              });
            }
          }

          // Learning Rules check: If confidence is low, recommend maintain_current_state
          if (rec.confidence < 50) {
            console.log(`[SHANA ADAPTATION ENGINE] Low confidence recommendation overridden to maintain_current_state.`);
            rec = {
              ...rec,
              recommended_action: "maintain difficulty",
              reason: "Low confidence rating or performance instability detected. Reverted to stable baseline.",
              confidence: 50,
              explanation: "Maintaining current settings to stabilize and accurately measure performance.",
              reduced_confidence: reducedConfidence
            };
          }

          // Log recommended event
          ShanaEventTracker.logEvent(userId, sessionId, 'adaptation_recommended', {
            ...rec,
            questionIndex: input.session_state.question_index
          });

          // Director Authority: Simulated approve or modify based on settings and limits
          // For this demo context, we assume Director approves the recommendation.
          ShanaEventTracker.logEvent(userId, sessionId, 'adaptation_approved', {
            recommended_action: rec.recommended_action,
            reason: rec.reason
          });

          // Log applied event
          ShanaEventTracker.logEvent(userId, sessionId, 'adaptation_applied', {
            recommended_action: rec.recommended_action,
            timestamp: new Date().toISOString()
          });

          return rec;
        }
      }
      throw new Error('Invalid response received from adaptation API endpoint.');
    } catch (err: any) {
      console.warn(`[SHANA ADAPTATION ENGINE] Adaptation recommendation failed, employing baseline failsafe:`, err);

      // Log recovery event
      ShanaEventTracker.logEvent(userId, sessionId, 'error_detected', {
        errorMessage: err?.message || String(err),
        action_taken: 'failsafe_baseline_adaptation_activated'
      });

      const fallback = { ...BASELINE_ADAPTATION };

      ShanaEventTracker.logEvent(userId, sessionId, 'adaptation_recommended', {
        ...fallback,
        questionIndex: input.session_state.question_index,
        is_failsafe_fallback: true
      });

      ShanaEventTracker.logEvent(userId, sessionId, 'adaptation_approved', {
        recommended_action: fallback.recommended_action,
        reason: "Director auto-approved failsafe adaptation backup."
      });

      ShanaEventTracker.logEvent(userId, sessionId, 'adaptation_applied', {
        recommended_action: fallback.recommended_action,
        timestamp: new Date().toISOString()
      });

      return fallback;
    }
  }
};
