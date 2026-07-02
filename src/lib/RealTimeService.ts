import { useEffect, useState } from "react";

export type ConnectionState = 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'AUTHENTICATED' 
  | 'ACTIVE' 
  | 'RECONNECTING' 
  | 'DISCONNECTED';

export interface SynchronizedSessionState {
  currentQuestion?: string;
  timerSecondsRemaining: number;
  interviewState: 'not_started' | 'intro' | 'answering' | 'evaluating' | 'completed';
  evaluationProgress: number;
  adaptationStatus: string;
}

export interface StreamEvent {
  streamId: string;
  streamType: 'question' | 'feedback' | 'summary';
  chunk?: string;
  accumulatedText?: string;
  isFinal?: boolean;
}

type MessageCallback = (msg: any) => void;
type StateCallback = (state: ConnectionState) => void;

class RealTimeClient {
  private socket: WebSocket | null = null;
  private state: ConnectionState = 'DISCONNECTED';
  private connectionId: string | null = null;
  private reconnectToken: string | null = null;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private latencyMs = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: any = null;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private stateCallbacks: Set<StateCallback> = new Set();
  private syncState: SynchronizedSessionState | null = null;
  private activeStream: {
    streamId: string;
    streamType: string;
    accumulatedText: string;
  } | null = null;

  constructor() {
    // Attempt to recover previous session identifiers
    this.reconnectToken = localStorage.getItem("shana_rt_reconnect_token");
    this.connectionId = localStorage.getItem("shana_rt_connection_id");
  }

  public connect(userId: string) {
    if (this.userId === userId && this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return; // Already connecting or connected
    }

    this.userId = userId;
    this.transitionState('CONNECTING');
    this.reconnectAttempts = 0;
    this.establishSocket();
  }

  private establishSocket() {
    if (this.socket) {
      this.socket.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/realtime`;

    console.log(`[RealTimeClient] Initiating connection to ${wsUrl}...`);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log(`[RealTimeClient] Socket opened.`);
        // If we have a reconnect token, try to reclaim session, otherwise standard auth
        if (this.reconnectToken && this.userId) {
          this.transitionState('RECONNECTING');
          this.send({
            type: "reconnect",
            reconnectToken: this.reconnectToken,
            userId: this.userId,
            sessionId: this.sessionId || undefined
          });
        } else {
          this.transitionState('CONNECTED');
          this.authenticate();
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (err) {
          console.error("[RealTimeClient] Failed to parse message:", err);
        }
      };

      this.socket.onclose = (event) => {
        console.warn(`[RealTimeClient] Connection closed: code=${event.code}, reason=${event.reason}`);
        this.handleDisconnect();
      };

      this.socket.onerror = (err) => {
        console.error("[RealTimeClient] WebSocket error:", err);
      };

    } catch (err) {
      console.error("[RealTimeClient] Failed to construct WebSocket:", err);
      this.handleDisconnect();
    }
  }

  private authenticate() {
    if (!this.userId || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    
    console.log(`[RealTimeClient] Authenticating user: ${this.userId}`);
    this.send({
      type: "auth",
      userId: this.userId
    });
  }

  public joinSession(sessionId: string) {
    this.sessionId = sessionId;
    if (this.state === 'AUTHENTICATED' || this.state === 'ACTIVE') {
      this.send({
        type: "join_session",
        sessionId
      });
    }
  }

  public updateSessionState(updates: Partial<SynchronizedSessionState>) {
    if (this.sessionId && this.state === 'ACTIVE') {
      this.send({
        type: "sync_update",
        sessionId: this.sessionId,
        updates
      });
    }
  }

  public startVoiceSession() {
    if (this.sessionId && this.state === 'ACTIVE') {
      this.send({ type: "voice_start", sessionId: this.sessionId });
    }
  }

  public endVoiceSession() {
    if (this.sessionId && this.state === 'ACTIVE') {
      this.send({ type: "voice_end", sessionId: this.sessionId });
    }
  }

  private handleServerMessage(msg: any) {
    // Increment telemetry
    switch (msg.type) {
      case "welcome":
        this.connectionId = msg.connectionId;
        this.reconnectToken = msg.reconnectToken;
        localStorage.setItem("shana_rt_connection_id", msg.connectionId);
        localStorage.setItem("shana_rt_reconnect_token", msg.reconnectToken);
        break;

      case "authenticated":
        this.transitionState('AUTHENTICATED');
        if (this.sessionId) {
          this.joinSession(this.sessionId);
        }
        break;

      case "reconnect_success":
        this.connectionId = msg.connectionId;
        if (msg.sessionId) {
          this.sessionId = msg.sessionId;
          this.transitionState('ACTIVE');
        } else {
          this.transitionState('AUTHENTICATED');
        }
        this.reconnectAttempts = 0;
        if (msg.synchronizedState) {
          this.syncState = msg.synchronizedState;
        }
        break;

      case "reconnect_failed":
        console.warn("[RealTimeClient] Reconnection failed. Proceeding with standard authentication.");
        this.reconnectToken = null;
        this.connectionId = null;
        localStorage.removeItem("shana_rt_reconnect_token");
        localStorage.removeItem("shana_rt_connection_id");
        this.transitionState('CONNECTED');
        this.authenticate();
        break;

      case "session_joined":
      case "session_state_updated":
        this.transitionState('ACTIVE');
        this.syncState = msg.synchronizedState;
        break;

      case "ping":
        // Server heartbeat check - reply with ack and timestamp
        this.send({
          type: "heartbeat",
          clientTimestamp: msg.serverTimestamp
        });
        break;

      case "heartbeat_ack":
        this.latencyMs = msg.latencyMs;
        break;

      case "stream_started":
        this.activeStream = {
          streamId: msg.streamId,
          streamType: msg.streamType,
          accumulatedText: ""
        };
        break;

      case "stream_chunk":
        if (this.activeStream && this.activeStream.streamId === msg.streamId) {
          this.activeStream.accumulatedText = msg.accumulatedText;
        }
        break;

      case "stream_completed":
        // Clear stream buffer
        this.activeStream = null;
        break;
    }

    // Distribute to listeners
    this.messageCallbacks.forEach(cb => cb(msg));
  }

  private handleDisconnect() {
    if (this.state === 'DISCONNECTED') return;

    this.transitionState('DISCONNECTED');

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(10000, 1000 * Math.pow(2, this.reconnectAttempts - 1)); // exponential backoff
      console.log(`[RealTimeClient] Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = setTimeout(() => {
        this.establishSocket();
      }, delay);
    } else {
      console.error("[RealTimeClient] Maximum reconnection attempts reached. Idle.");
    }
  }

  private send(payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      console.warn("[RealTimeClient] Cannot send message, WebSocket is not open:", payload);
    }
  }

  private transitionState(newState: ConnectionState) {
    if (this.state !== newState) {
      console.log(`[RealTimeClient] Connection state: ${this.state} -> ${newState}`);
      this.state = newState;
      this.stateCallbacks.forEach(cb => cb(newState));
    }
  }

  public addMessageListener(cb: MessageCallback) {
    this.messageCallbacks.add(cb);
  }

  public removeMessageListener(cb: MessageCallback) {
    this.messageCallbacks.delete(cb);
  }

  public addStateListener(cb: StateCallback) {
    this.stateCallbacks.add(cb);
  }

  public removeStateListener(cb: StateCallback) {
    this.stateCallbacks.delete(cb);
  }

  public getClientState() {
    return {
      state: this.state,
      connectionId: this.connectionId,
      latencyMs: this.latencyMs,
      syncState: this.syncState,
      activeStream: this.activeStream
    };
  }

  public disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    this.transitionState('DISCONNECTED');
    this.userId = null;
    this.sessionId = null;
  }
}

// Global Singleton instance for client session persistence across route tree
export const clientInstance = new RealTimeClient();

// React hook wrapper
export function useRealTime(userId?: string, sessionId?: string) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [latency, setLatency] = useState(0);
  const [syncState, setSyncState] = useState<SynchronizedSessionState | null>(null);
  const [streamData, setStreamData] = useState<{
    streamId: string;
    streamType: string;
    accumulatedText: string;
    isFinal: boolean;
  } | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Connect Client
    clientInstance.connect(userId);
    if (sessionId) {
      clientInstance.joinSession(sessionId);
    }

    // Set initial values
    const current = clientInstance.getClientState();
    setConnectionState(current.state);
    setLatency(current.latencyMs);
    setSyncState(current.syncState);

    // Bind listeners
    const handleState = (state: ConnectionState) => {
      setConnectionState(state);
    };

    const handleMessage = (msg: any) => {
      switch (msg.type) {
        case "heartbeat_ack":
          setLatency(msg.latencyMs);
          break;
        case "session_joined":
        case "session_state_updated":
          setSyncState(msg.synchronizedState);
          break;
        case "reconnect_success":
          if (msg.synchronizedState) {
            setSyncState(msg.synchronizedState);
          }
          break;
        case "stream_started":
          setStreamData({
            streamId: msg.streamId,
            streamType: msg.streamType,
            accumulatedText: "",
            isFinal: false
          });
          break;
        case "stream_chunk":
          setStreamData(prev => {
            if (prev && prev.streamId === msg.streamId) {
              return {
                ...prev,
                accumulatedText: msg.accumulatedText,
                isFinal: msg.isFinal || false
              };
            }
            return prev;
          });
          break;
        case "stream_completed":
          setStreamData(prev => prev ? { ...prev, isFinal: true } : null);
          break;
        case "announcement":
          setAnnouncements(prev => [...prev, msg]);
          break;
      }
    };

    clientInstance.addStateListener(handleState);
    clientInstance.addMessageListener(handleMessage);

    return () => {
      clientInstance.removeStateListener(handleState);
      clientInstance.removeMessageListener(handleMessage);
    };
  }, [userId, sessionId]);

  const updateState = (updates: Partial<SynchronizedSessionState>) => {
    clientInstance.updateSessionState(updates);
  };

  const startVoice = () => {
    clientInstance.startVoiceSession();
  };

  const endVoice = () => {
    clientInstance.endVoiceSession();
  };

  return {
    connectionState,
    latency,
    syncState,
    streamData,
    announcements,
    updateState,
    startVoice,
    endVoice
  };
}
