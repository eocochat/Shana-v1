import { ShanaEventTracker } from './events';

export interface EvaluationInput {
  question: string;
  answer: string;
  question_context: {
    current_question: string;
    expected_competency: string;
    previous_answer_summary: string;
  };
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
  constraints: {
    max_response_size: string;
    no_score_generation: boolean;
    no_memory_creation: boolean;
    follow_output_schema: boolean;
  };
}

export interface EvaluationResponse {
  clarity: number;
  structure: number;
  confidence: number;
  relevance: number;
  conciseness: number;
  strength: string;
  improvement_area: string;
  action_tip: string;
  flags: ('too_long' | 'off_topic' | 'unclear' | 'strong_answer' | 'needs_follow_up')[];
  ips_total?: number;
  reduced_confidence?: boolean;
}

export const BASELINE_EVALUATION: EvaluationResponse = {
  clarity: 70,
  structure: 70,
  confidence: 70,
  relevance: 70,
  conciseness: 70,
  strength: "Your response is professionally structured and covers the main points of the question.",
  improvement_area: "We recommend adding more specific metrics or direct action details to make the example more concrete.",
  action_tip: "Try utilizing the STAR framework (Situation, Task, Action, Result) to organize your response step-by-step.",
  flags: [],
  ips_total: 70,
  reduced_confidence: false
};

export const ShanaEvaluationEngine = {
  /**
   * Central evaluation coordinator. Coordinates the normalized prompt and LLM call,
   * calculates IPS total on the backend, applies calibration rules, and posts logging events.
   */
  async evaluateResponse(input: EvaluationInput): Promise<EvaluationResponse> {
    const userId = input.session_state.session_id.split('_')[0] || 'usr_candidate';
    const sessionId = input.session_state.session_id;

    // 1. Emit evaluation_started event
    ShanaEventTracker.logEvent(userId, sessionId, 'evaluation_started', {
      timestamp: new Date().toISOString(),
      questionIndex: input.session_state.question_index,
      expected_competency: input.question_context.expected_competency
    });

    try {
      console.log(`[SHANA EVALUATION ENGINE] Submitting response for evaluation in session ${sessionId}...`);
      const response = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.evaluation) {
          const rawEval: EvaluationResponse = data.evaluation;
          
          // Step 4: Backend computed IPS
          const ipsTotal = rawEval.ips_total || Math.round(
            (rawEval.clarity * 0.25) +
            (rawEval.structure * 0.25) +
            (rawEval.confidence * 0.20) +
            (rawEval.relevance * 0.20) +
            (rawEval.conciseness * 0.10)
          );

          // Step 5: Calibration Check
          let reducedConfidence = false;
          let calibrationEventName: string | null = null;

          const averageScore = (rawEval.clarity + rawEval.structure + rawEval.confidence + rawEval.relevance + rawEval.conciseness) / 5;
          
          if (averageScore > 98) {
            calibrationEventName = 'calibration_excessive_generous';
          } else if (averageScore < 30) {
            calibrationEventName = 'calibration_excessive_harsh';
          }

          // Check volatility against previous evaluations within the current session
          const sessionEvents = ShanaEventTracker.getSessionEvents(userId, sessionId);
          const previousEvaluations = sessionEvents.filter(e => e.eventType === 'ips_generated');
          
          if (previousEvaluations.length > 0) {
            const lastEvalPayload = previousEvaluations[previousEvaluations.length - 1].payload;
            const lastScore = lastEvalPayload?.ips_total || lastEvalPayload?.ips_score;
            if (lastScore && Math.abs(ipsTotal - lastScore) > 40) {
              calibrationEventName = 'calibration_unstable';
              reducedConfidence = true;
            }
          }

          if (calibrationEventName) {
            console.warn(`[SHANA EVALUATION ENGINE] Calibration event triggered: ${calibrationEventName}`);
            ShanaEventTracker.logEvent(userId, sessionId, 'error_detected', {
              calibration_anomaly: calibrationEventName,
              ips_score: ipsTotal,
              average_score: averageScore,
              reduced_confidence: reducedConfidence
            });
          }

          const finalizedEval: EvaluationResponse = {
            ...rawEval,
            ips_total: ipsTotal,
            reduced_confidence: reducedConfidence
          };

          // 2. Emit ips_generated event
          ShanaEventTracker.logEvent(userId, sessionId, 'ips_generated', {
            ips_total: ipsTotal,
            clarity: finalizedEval.clarity,
            structure: finalizedEval.structure,
            confidence: finalizedEval.confidence,
            relevance: finalizedEval.relevance,
            conciseness: finalizedEval.conciseness,
            flags: finalizedEval.flags
          });

          // 3. Emit feedback_generated event
          ShanaEventTracker.logEvent(userId, sessionId, 'feedback_generated', {
            strength: finalizedEval.strength,
            improvement_area: finalizedEval.improvement_area,
            action_tip: finalizedEval.action_tip,
            flags: finalizedEval.flags
          });

          // 4. Emit evaluation_completed event
          ShanaEventTracker.logEvent(userId, sessionId, 'evaluation_completed', {
            ips_total: ipsTotal,
            reduced_confidence: reducedConfidence,
            has_flags: finalizedEval.flags.length > 0
          });

          return finalizedEval;
        }
      }
      throw new Error('Invalid or un-parsable response received from evaluation endpoint.');
    } catch (err: any) {
      console.warn(`[SHANA EVALUATION ENGINE] Evaluation process failed, deploying failsafe baseline profile:`, err);

      // Deploy standard baseline scoring profile (Failsafe Rule)
      const fallbackEval = { ...BASELINE_EVALUATION };

      // Log failsafe recovery event
      ShanaEventTracker.logEvent(userId, sessionId, 'error_detected', {
        errorMessage: err?.message || String(err),
        action_taken: 'failsafe_baseline_scoring_activated'
      });

      // Emit required tracking events for fallback progression
      ShanaEventTracker.logEvent(userId, sessionId, 'ips_generated', {
        ips_total: fallbackEval.ips_total,
        clarity: fallbackEval.clarity,
        structure: fallbackEval.structure,
        confidence: fallbackEval.confidence,
        relevance: fallbackEval.relevance,
        conciseness: fallbackEval.conciseness,
        flags: fallbackEval.flags
      });

      ShanaEventTracker.logEvent(userId, sessionId, 'feedback_generated', {
        strength: fallbackEval.strength,
        improvement_area: fallbackEval.improvement_area,
        action_tip: fallbackEval.action_tip,
        flags: fallbackEval.flags
      });

      ShanaEventTracker.logEvent(userId, sessionId, 'evaluation_completed', {
        ips_total: fallbackEval.ips_total,
        reduced_confidence: false,
        is_failsafe_fallback: true
      });

      return fallbackEval;
    }
  }
};
