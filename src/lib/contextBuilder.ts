import { Profile, CVAnalysis, SessionHistoryItem, Language } from '../types';
import { StorageService } from './storage';
import { ShanaEventTracker, ShanaEvent } from './events';
import { AdaptiveEngine } from './adaptive';
import { InterviewDirector } from './director';

export interface ContextPack {
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
  interview_context: {
    current_objective: string;
    interview_style: string;
    active_difficulty: string;
    pacing_mode: string;
  };
  recent_events: {
    eventType: string;
    timestamp: string;
    payload: any;
  }[];
  ips_history: {
    previous_ips: number;
    trend: 'improving' | 'declining' | 'stagnant' | 'stable' | 'unknown';
    recent_strengths: string[];
    recent_weaknesses: string[];
  };
  director_state: {
    selected_mode: string;
    adaptation_permission: boolean;
    insight_permission: boolean;
  };
  adaptation_state: {
    active_adaptation: string;
    adaptation_confidence: number;
    cooldown: number;
  };
  question_context: {
    current_question: string;
    expected_competency: string;
    previous_answer_summary: string;
  };
  constraints: {
    max_response_size: string;
    no_score_generation: boolean;
    no_memory_creation: boolean;
    follow_output_schema: boolean;
  };
}

export const ShanaContextBuilder = {
  /**
   * Centralized builder to compile a secure, minimal, token-controlled Context Pack
   * for the AI engine (OpenAI or Gemini), preventing AI memory/direct database leakage.
   */
  buildContextPack(
    userId: string,
    sessionId: string,
    currentQuestionText: string = '',
    expectedCompetency: string = '',
    previousAnswer: string = ''
  ): ContextPack {
    try {
      const actualUserId = userId || 'usr_guest';
      const actualSessionId = sessionId || 'sess_default';

      // --- 1. USER PROFILE ---
      const profile = StorageService.getProfile(actualUserId);
      const cvAnalysis = StorageService.getAnalysis(actualUserId);

      const target_role = profile?.targetRole || cvAnalysis?.role || 'Candidate';
      const experience_level = String(profile?.experienceYears || cvAnalysis?.experienceYears || 'some');
      const language = profile?.language || 'English';
      const onboarding_summary = `Target Role is ${target_role} with ${experience_level} years of experience in ${profile?.industry || 'Unknown Industry'} speaking ${language}.`;
      const cv_summary = cvAnalysis?.summary || 'No CV analysis found.';

      // --- 2. SESSION STATE ---
      // Read current state from local session engine
      const sessionStateKey = `shana_active_session_state_${actualSessionId}`;
      const current_state = localStorage.getItem(sessionStateKey) || 'IDLE';

      // Sourced from latest history items or events to determine progress
      const sessionEvents = ShanaEventTracker.getSessionEvents(actualUserId, actualSessionId);
      const questionEvents = sessionEvents.filter(e => e.eventType === 'question_displayed' || e.eventType === 'question_asked');
      const question_index = questionEvents.length;
      
      const maxQuestions = 5; // standard target length
      const progress = Math.min(1.0, question_index / maxQuestions);
      const interview_mode = actualSessionId.startsWith('sess_assess_') ? 'ASSESS' : 'TRAIN';

      // --- 3. INTERVIEW CONTEXT ---
      // Retrieve orchestrated decisions for current design
      const history = StorageService.getHistory(actualUserId);
      const directorResult = InterviewDirector.orchestrateSession(actualUserId, history, experience_level);
      
      let interview_style = directorResult.design.questionStyle;
      let active_difficulty = directorResult.design.difficulty;
      let pacing_mode = directorResult.design.pacing;

      // Determine interview objective dynamically based on the current phase
      let current_objective = 'Baseline introduction and assessment of profile.';
      if (question_index >= 1 && question_index <= 3) {
        current_objective = 'Deep dive behavioral questions targeting key competency metrics using STAR method.';
      } else if (question_index > 3) {
        current_objective = 'High intensity probing of stated experience edge-cases and final wrap-up.';
      }

      // --- 4. RECENT EVENTS ---
      // Limit to last 5-10 relevant events to control tokens and prevent full history accumulation
      const relevantTypes = ['question_displayed', 'question_asked', 'answer_submitted', 'state_transition', 'state_changed'];
      const filteredEvents = sessionEvents
        .filter(e => relevantTypes.includes(e.eventType))
        .map(e => ({
          eventType: e.eventType,
          timestamp: e.timestamp,
          payload: {
            questionIndex: e.payload?.questionIndex,
            text: e.payload?.text || e.payload?.questionText || undefined,
            fromState: e.payload?.fromState,
            toState: e.payload?.toState
          }
        }))
        .slice(-8); // Strict limit of 8 events

      // --- 5. IPS HISTORY ---
      let previous_ips = 0;
      let trend: 'improving' | 'declining' | 'stagnant' | 'stable' | 'unknown' = 'unknown';
      let recent_strengths: string[] = [];
      let recent_weaknesses: string[] = [];

      if (history && history.length > 0) {
        previous_ips = history[0].score || 0;
        
        // Determine trends across last 3 sessions
        const scores = history.map(h => h.score).filter(s => typeof s === 'number');
        if (scores.length >= 3) {
          const s0 = scores[0];
          const s1 = scores[1];
          const s2 = scores[2];
          const diff1 = s0 - s1;
          const diff2 = s1 - s2;
          
          if (diff1 > 2 && diff2 > 2) trend = 'improving';
          else if (diff1 < -2 && diff2 < -2) trend = 'declining';
          else if (Math.abs(diff1) <= 2 && Math.abs(diff2) <= 2) trend = 'stagnant';
          else trend = 'stable';
        } else if (scores.length === 2) {
          trend = scores[0] > scores[1] ? 'improving' : scores[0] < scores[1] ? 'declining' : 'stable';
        } else {
          trend = 'stable';
        }

        // Collect documented strengths and weaknesses for adaptive alignment
        history.slice(0, 3).forEach((item: any) => {
          if (item.strengths && Array.isArray(item.strengths)) {
            recent_strengths.push(...item.strengths);
          } else if (item.recommendation) {
            recent_strengths.push(item.recommendation);
          }

          if (item.weakness) {
            recent_weaknesses.push(item.weakness);
          }
        });

        // Unique values only
        recent_strengths = Array.from(new Set(recent_strengths)).slice(0, 3);
        recent_weaknesses = Array.from(new Set(recent_weaknesses)).slice(0, 3);
      }

      // --- 6. DIRECTOR STATE ---
      const directorSettings = InterviewDirector.getSettings(actualUserId);
      const selected_mode = directorSettings.status || 'active';
      const adaptation_permission = AdaptiveEngine.getSettings(actualUserId).status === 'accepted';
      const insight_permission = true; // Sourced from engine configuration

      // --- 7. ADAPTATION STATE ---
      const adaptationConfig = AdaptiveEngine.calculateAdaptation(actualUserId, history);
      const active_adaptation = adaptationConfig.path || 'Balanced';
      const adaptation_confidence = 85; // Deterministic standard score
      const cooldown = 0; // Cooldown state tracking

      // --- 8. QUESTION CONTEXT ---
      // Summarize the previous answer to avoid full transcript accumulation
      let summarizedPreviousAnswer = '';
      if (previousAnswer) {
        const words = previousAnswer.trim().split(/\s+/);
        if (words.length > 25) {
          summarizedPreviousAnswer = words.slice(0, 20).join(' ') + '... [summarized to control tokens]';
        } else {
          summarizedPreviousAnswer = previousAnswer;
        }
      }

      const question_context = {
        current_question: currentQuestionText || 'No active question text.',
        expected_competency: expectedCompetency || 'general_performance',
        previous_answer_summary: summarizedPreviousAnswer || 'No previous answer recorded.'
      };

      // --- 9. CONSTRAINTS ---
      const constraints = {
        max_response_size: 'Exactly ONE clear interview question. Response under 100 words.',
        no_score_generation: true,
        no_memory_creation: true,
        follow_output_schema: true
      };

      return {
        user_profile: {
          target_role,
          experience_level,
          language,
          onboarding_summary,
          cv_summary
        },
        session_state: {
          session_id: actualSessionId,
          current_state,
          interview_mode,
          question_index,
          progress
        },
        interview_context: {
          current_objective,
          interview_style,
          active_difficulty,
          pacing_mode
        },
        recent_events: filteredEvents,
        ips_history: {
          previous_ips,
          trend,
          recent_strengths,
          recent_weaknesses
        },
        director_state: {
          selected_mode,
          adaptation_permission,
          insight_permission
        },
        adaptation_state: {
          active_adaptation,
          adaptation_confidence,
          cooldown
        },
        question_context,
        constraints
      };
    } catch (err: any) {
      // --- FAILSAFE RULES ---
      // If context fails, log failure event, reduce to minimal context, and continue session without stopping.
      console.error('[SHANA CONTEXT BUILDER] Execution failed, triggering failsafe fallback context pack:', err);

      try {
        ShanaEventTracker.logEvent(userId || 'usr_guest', sessionId || 'sess_default', 'session_failed', {
          error_phase: 'context_building_failed',
          errorMessage: err?.message || String(err)
        });
      } catch (logErr) {
        console.error('[SHANA CONTEXT BUILDER] Failed to log failure event:', logErr);
      }

      // Provide guaranteed minimal context pack
      return {
        user_profile: {
          target_role: 'Candidate',
          experience_level: 'Mid',
          language: 'English',
          onboarding_summary: 'Minimal fallback onboarding info.',
          cv_summary: 'Minimal fallback CV summary.'
        },
        session_state: {
          session_id: sessionId || 'sess_fallback',
          current_state: 'FAILED',
          interview_mode: 'TRAIN',
          question_index: 0,
          progress: 0.0
        },
        interview_context: {
          current_objective: 'Maintain active session and recover communication.',
          interview_style: 'structured',
          active_difficulty: 'Normal',
          pacing_mode: 'Standard (45s)'
        },
        recent_events: [],
        ips_history: {
          previous_ips: 0,
          trend: 'unknown',
          recent_strengths: [],
          recent_weaknesses: []
        },
        director_state: {
          selected_mode: 'failsafe',
          adaptation_permission: false,
          insight_permission: false
        },
        adaptation_state: {
          active_adaptation: 'None',
          adaptation_confidence: 0,
          cooldown: 0
        },
        question_context: {
          current_question: currentQuestionText || 'Welcome! How are you doing today?',
          expected_competency: 'general_performance',
          previous_answer_summary: previousAnswer || ''
        },
        constraints: {
          max_response_size: 'Exactly ONE clear interview question. Response under 100 words.',
          no_score_generation: true,
          no_memory_creation: true,
          follow_output_schema: true
        }
      };
    }
  }
};
