import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase.js";

export interface AISessionState {
  sessionId: string;
  userId: string;
  conversationState: 'idle' | 'introduction' | 'questioning' | 'followup' | 'coaching' | 'completed';
  activeModel: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  estimatedCost: number;
  currentRecruiterPersona: {
    name: string;
    personality: string;
    tone: string;
  } | null;
  difficulty: 'easy' | 'medium' | 'hard';
  interviewProgress: number; // percentage or step count
  sessionAnalytics: {
    latencyAverageMs: number;
    responseCount: number;
    totalDurationMs: number;
    errorsCount: number;
  };
  candidateCv?: string;
  jobDescription?: string;
  companyInfo?: string;
  interviewObjectives?: string;
}

export class AISessionManager {
  private static sessions = new Map<string, AISessionState>();

  /**
   * Initialize or retrieve a session from memory or Firestore
   */
  static async getOrCreateSession(sessionId: string, userId: string): Promise<AISessionState> {
    if (!sessionId) {
      throw new Error("sessionId is required");
    }

    // Check memory first
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    // Fallback to Firestore
    try {
      const sessionRef = doc(db, "ai_sessions", sessionId);
      const snap = await getDoc(sessionRef);
      if (snap.exists()) {
        const state = snap.data() as AISessionState;
        this.sessions.set(sessionId, state);
        return state;
      }
    } catch (e) {
      console.error("[AISessionManager] Error reading session from Firestore:", e);
    }

    // Create a new default session state
    const newState: AISessionState = {
      sessionId,
      userId,
      conversationState: 'introduction',
      activeModel: 'gpt-5.5-mini',
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      estimatedCost: 0.0,
      currentRecruiterPersona: null,
      difficulty: 'medium',
      interviewProgress: 0,
      sessionAnalytics: {
        latencyAverageMs: 0,
        responseCount: 0,
        totalDurationMs: 0,
        errorsCount: 0
      }
    };

    this.sessions.set(sessionId, newState);
    await this.persistSession(sessionId);
    return newState;
  }

  /**
   * Persist session state to memory and Firestore
   */
  static async persistSession(sessionId: string): Promise<void> {
    const state = this.sessions.get(sessionId);
    if (!state) return;

    try {
      const sessionRef = doc(db, "ai_sessions", sessionId);
      await setDoc(sessionRef, state, { merge: true });
    } catch (e) {
      console.error("[AISessionManager] Error persisting session to Firestore:", e);
    }
  }

  /**
   * Update session state fields
   */
  static async updateSession(sessionId: string, updates: Partial<AISessionState>): Promise<AISessionState> {
    if (!sessionId) {
      throw new Error("sessionId is required to update session");
    }
    const session = await this.getOrCreateSession(sessionId, updates.userId || "anonymous");
    const updated = {
      ...session,
      ...updates,
      tokenUsage: {
        ...session.tokenUsage,
        ...(updates.tokenUsage || {})
      },
      sessionAnalytics: {
        ...session.sessionAnalytics,
        ...(updates.sessionAnalytics || {})
      }
    };

    this.sessions.set(sessionId, updated);
    await this.persistSession(sessionId);
    return updated;
  }

  /**
   * Track token and cost usage for a session
   */
  static async recordUsage(sessionId: string, promptTokens: number, completionTokens: number, cost: number, latencyMs: number, hasError = false): Promise<AISessionState> {
    const session = await this.getOrCreateSession(sessionId, "anonymous");
    
    const newPromptTokens = (session.tokenUsage?.promptTokens || 0) + promptTokens;
    const newCompletionTokens = (session.tokenUsage?.completionTokens || 0) + completionTokens;
    const newTotalTokens = newPromptTokens + newCompletionTokens;

    const currentAnalytics = session.sessionAnalytics || {
      latencyAverageMs: 0,
      responseCount: 0,
      totalDurationMs: 0,
      errorsCount: 0
    };

    const newResponseCount = currentAnalytics.responseCount + 1;
    const newTotalDuration = currentAnalytics.totalDurationMs + latencyMs;
    const newLatencyAvg = Math.round(newTotalDuration / newResponseCount);
    const newErrorsCount = currentAnalytics.errorsCount + (hasError ? 1 : 0);

    const updated = await this.updateSession(sessionId, {
      tokenUsage: {
        promptTokens: newPromptTokens,
        completionTokens: newCompletionTokens,
        totalTokens: newTotalTokens
      },
      estimatedCost: (session.estimatedCost || 0.0) + cost,
      sessionAnalytics: {
        latencyAverageMs: newLatencyAvg,
        responseCount: newResponseCount,
        totalDurationMs: newTotalDuration,
        errorsCount: newErrorsCount
      }
    });

    return updated;
  }
}
