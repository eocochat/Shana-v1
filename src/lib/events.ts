import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { OperationType, handleFirestoreError } from './dbSync';

function isPermissionError(err: unknown): boolean {
  const str = err instanceof Error ? err.message : String(err);
  return str.toLowerCase().includes('permission') || str.toLowerCase().includes('insufficient');
}

export type ShanaEventType =
  // Interview Lifecycle
  | 'interview_started'
  | 'interview_paused'
  | 'interview_resumed'
  | 'interview_completed'
  // Question Flow
  | 'question_generated'
  | 'question_displayed'
  | 'question_skipped'
  // User Actions
  | 'answer_submitted'
  | 'answer_edited'
  | 'answer_timeout'
  // Evaluation
  | 'answer_analyzed'
  | 'score_generated'
  // Adaptation
  | 'adaptation_requested'
  | 'adaptation_recommended'
  | 'adaptation_approved'
  | 'adaptation_rejected'
  | 'adaptation_applied'
  // Discovery
  | 'insight_requested'
  | 'insight_generated'
  | 'insight_validated'
  | 'insight_rejected'
  | 'insight_displayed'
  | 'insight_dismissed'
  | 'insight_viewed'
  // System
  | 'error_detected'
  | 'recovery_triggered'
  // System transitions and compatibility
  | 'state_transition'
  | 'question_asked'
  | 'adaptation_triggered'
  | 'session_started'
  | 'state_changed'
  | 'answer_processing_started'
  | 'feedback_generated'
  | 'session_completed'
  | 'session_failed'
  | 'question_generation_requested'
  | 'evaluation_started'
  | 'evaluation_completed'
  | 'ips_generated';

export interface ShanaEvent {
  userId: string;
  sessionId: string;
  timestamp: string;
  eventType: ShanaEventType;
  payload: any;
}

// Generate RFC4122 compliant UUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const QUEUE_KEY = 'shana_unsynced_events';
let isFlushing = false;

export const ShanaEventTracker = {
  /**
   * Logs a new event into the append-only persistent log locally, normalizes the payload,
   * adds it to the resilient synchronization queue, and triggers asynchronous replication to Firestore.
   */
  logEvent(
    userId: string, 
    sessionId: string, 
    eventType: ShanaEventType, 
    payload: Record<string, any>
  ): string {
    const eventId = generateUUID();
    const actualUserId = userId || 'usr_candidate';
    const actualSessionId = sessionId || 'sess_default';
    const timestamp = new Date().toISOString();

    // Canonical event type mapping for Phase 2 compliance
    let mappedType: ShanaEventType = eventType;
    if (eventType === 'question_asked') {
      mappedType = 'question_displayed';
    } else if (eventType === 'adaptation_triggered') {
      mappedType = 'adaptation_applied';
    }

    // Build compliant Event Payload structure
    const context = {
      ...payload.context,
      ...Object.keys(payload).reduce((acc, key) => {
        if (!['userId', 'sessionId', 'timestamp', 'source', 'context', 'metadata'].includes(key)) {
          acc[key] = payload[key];
        }
        return acc;
      }, {} as Record<string, any>)
    };

    const structuredPayload = {
      ...payload,
      userId: actualUserId,
      sessionId: actualSessionId,
      timestamp: payload.timestamp || timestamp,
      source: payload.source || 'SHANA_APPLICATION_CLIENT',
      context: context,
      metadata: payload.metadata || {
        platform: 'web',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        version: '1.0.0-phase2'
      }
    };

    const event: ShanaEvent = {
      userId: actualUserId,
      sessionId: actualSessionId,
      timestamp: timestamp,
      eventType: mappedType,
      payload: structuredPayload
    };

    // 1. Append locally (Operational Memory Layer)
    try {
      const historyKey = `shana_events_${actualUserId}`;
      const events: ShanaEvent[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
      events.push(event);
      localStorage.setItem(historyKey, JSON.stringify(events));

      // Dispatch event for real-time reactive updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shana_event_logged', { detail: event }));
      }
      console.log(`[SHANA EVENT] Logged locally: ${mappedType}`, event);
    } catch (e) {
      console.error('[SHANA EVENT] Failed to append event locally:', e);
    }

    // 2. Queue for asynchronous remote replication (Firestore Truth Layer)
    try {
      const queue: any[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      queue.push({ id: eventId, event });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('[SHANA EVENT] Failed to enqueue event for cloud sync:', e);
    }

    // 3. Fire-and-forget sync replication
    this.flushQueue();

    // Secondary automatic flow tracking (e.g. answer_timeout or question_generated)
    if (mappedType === 'answer_submitted' && payload.isTimeout) {
      this.logEvent(actualUserId, actualSessionId, 'answer_timeout', {
        questionIndex: payload.questionIndex,
        phaseLabel: payload.phaseLabel
      });
    }

    return eventId;
  },

  /**
   * Automatically flushes queued actions to Firestore. Ensures complete append-only reliability.
   */
  async flushQueue(): Promise<void> {
    if (isFlushing) return;
    isFlushing = true;

    try {
      const queue: { id: string; event: ShanaEvent }[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      if (queue.length === 0) {
        isFlushing = false;
        return;
      }

      console.log(`[SHANA CLOUD SYNC] Synchronizing ${queue.length} events to Firestore...`);
      const remaining: { id: string; event: ShanaEvent }[] = [];

      for (const item of queue) {
        try {
          const docRef = doc(db, 'events', item.id);
          await setDoc(docRef, {
            id: item.id,
            user_id: item.event.userId,
            session_id: item.event.sessionId,
            event_type: item.event.eventType,
            payload: item.event.payload,
            created_at: item.event.timestamp
          });
        } catch (err) {
          if (isPermissionError(err)) {
            handleFirestoreError(err, OperationType.WRITE, `events/${item.id}`);
          }
          console.warn(`[SHANA CLOUD SYNC] Sync failed for event: ${item.event.eventType}. Leaving in queue.`, err);
          remaining.push(item);
        }
      }

      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.error('[SHANA CLOUD SYNC] Error in background flush:', e);
    } finally {
      isFlushing = false;
    }
  },

  /**
   * Local read-only retrieval of events.
   */
  getEvents(userId: string): ShanaEvent[] {
    if (!userId) return [];
    try {
      const key = `shana_events_${userId}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      console.error('[SHANA EVENT] Failed to retrieve events for user:', userId, e);
      return [];
    }
  },

  /**
   * Local read-only retrieval of session events.
   */
  getSessionEvents(userId: string, sessionId: string): ShanaEvent[] {
    return this.getEvents(userId).filter(e => e.sessionId === sessionId);
  },

  // ================================================
  // QUERY REQUIREMENTS (Supports offline hybrid)
  // ================================================

  /**
   * Fetches full timeline of events for a given session.
   */
  async fetchSessionTimeline(sessionId: string): Promise<ShanaEvent[]> {
    if (!sessionId) return [];
    try {
      // Query Firestore collection
      const eventsColl = collection(db, 'events');
      const q = query(eventsColl, where('session_id', '==', sessionId));
      let snap;
      try {
        snap = await getDocs(q);
      } catch (err) {
        if (isPermissionError(err)) {
          handleFirestoreError(err, OperationType.GET, 'events');
        }
        throw err;
      }

      if (!snap.empty) {
        const eventsList: ShanaEvent[] = snap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            userId: data.user_id,
            sessionId: data.session_id,
            timestamp: data.created_at,
            eventType: data.event_type as ShanaEventType,
            payload: data.payload as any
          };
        });
        // Sort ascending by timestamp for proper replay reconstruction
        return eventsList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
    } catch (err) {
      console.warn('[SHANA QUERY] Failed to fetch session timeline from cloud, falling back to local storage:', err);
    }

    // Hybrid fallback
    const local = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    const localEvents = local.map((l: any) => l.event).filter((e: ShanaEvent) => e.sessionId === sessionId);
    
    // Check main event histories
    const keys = Object.keys(localStorage);
    const timelineEvents: ShanaEvent[] = [...localEvents];
    for (const key of keys) {
      if (key.startsWith('shana_events_')) {
        const evs: ShanaEvent[] = JSON.parse(localStorage.getItem(key) || '[]');
        evs.forEach(e => {
          if (e.sessionId === sessionId && !timelineEvents.some(te => te.timestamp === e.timestamp && te.eventType === e.eventType)) {
            timelineEvents.push(e);
          }
        });
      }
    }

    return timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  /**
   * Fetches all events associated with a specific user.
   */
  async fetchUserHistory(userId: string): Promise<ShanaEvent[]> {
    if (!userId) return [];
    try {
      const eventsColl = collection(db, 'events');
      const q = query(eventsColl, where('user_id', '==', userId));
      let snap;
      try {
        snap = await getDocs(q);
      } catch (err) {
        if (isPermissionError(err)) {
          handleFirestoreError(err, OperationType.GET, 'events');
        }
        throw err;
      }

      if (!snap.empty) {
        const list: ShanaEvent[] = snap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            userId: data.user_id,
            sessionId: data.session_id,
            timestamp: data.created_at,
            eventType: data.event_type as ShanaEventType,
            payload: data.payload as any
          };
        });
        return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    } catch (err) {
      console.warn('[SHANA QUERY] Failed to fetch user history from cloud, falling back to local:', err);
    }

    return this.getEvents(userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  /**
   * Fetches system decisions like adaptation paths and state transitions.
   */
  async fetchSystemDecisions(userId: string): Promise<ShanaEvent[]> {
    const history = await this.fetchUserHistory(userId);
    const decisionTypes: ShanaEventType[] = [
      'adaptation_applied',
      'adaptation_requested',
      'recovery_triggered',
      'error_detected',
      'state_transition'
    ];
    return history.filter(e => decisionTypes.includes(e.eventType));
  },

  /**
   * Fetches all adaptation-related events.
   */
  async fetchAdaptationHistory(userId: string): Promise<ShanaEvent[]> {
    const history = await this.fetchUserHistory(userId);
    const adaptationTypes: ShanaEventType[] = ['adaptation_applied', 'adaptation_requested', 'adaptation_triggered'];
    return history.filter(e => adaptationTypes.includes(e.eventType));
  },

  /**
   * Fetches scoring and evaluation histories.
   */
  async fetchScoringHistory(userId: string): Promise<ShanaEvent[]> {
    const history = await this.fetchUserHistory(userId);
    const scoringTypes: ShanaEventType[] = ['score_generated', 'answer_analyzed'];
    return history.filter(e => scoringTypes.includes(e.eventType));
  },

  // ================================================
  // REPLAY REQUIREMENT
  // ================================================

  /**
   * Reconstructs the complete lifecycle of a session by replaying its sequential timeline events.
   */
  async reconstructSession(sessionId: string): Promise<{
    sessionId: string;
    userId: string;
    isCompleted: boolean;
    currentState: string;
    totalEvents: number;
    timeline: { eventType: string; timestamp: string; details: any }[];
    reconstructionSummary: string;
  }> {
    const events = await this.fetchSessionTimeline(sessionId);
    const timeline = events.map(e => ({
      eventType: e.eventType,
      timestamp: e.timestamp,
      details: e.payload
    }));

    let isCompleted = false;
    let currentState = 'IDLE';

    events.forEach(e => {
      if (e.eventType === 'interview_completed') {
        isCompleted = true;
      }
      if (e.eventType === 'state_transition' && e.payload?.context?.toState) {
        currentState = e.payload.context.toState;
      }
    });

    // Build human-readable audit summary
    const sequence = timeline.map(t => t.eventType).join(' ➔ ');
    const reconstructionSummary = `Session reconstructed successfully with ${timeline.length} sequential event nodes: [${sequence || 'No event sequence recorded'}]. Status: ${isCompleted ? 'COMPLETED' : 'IN_PROGRESS'}. Final State: ${currentState}.`;

    return {
      sessionId,
      userId: events[0]?.userId || 'unknown',
      isCompleted,
      currentState,
      totalEvents: timeline.length,
      timeline,
      reconstructionSummary
    };
  }
};

// Automatic listener to trigger queue flush upon browser connection recovery
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SHANA CONNECTION] Online status detected. Initiating immediate events queue flush...');
    ShanaEventTracker.flushQueue();
  });
  
  // Also perform periodic check to guarantee no event lost in offline/sandbox states
  setInterval(() => {
    ShanaEventTracker.flushQueue();
  }, 15000);
}
