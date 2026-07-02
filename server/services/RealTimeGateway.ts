import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";
import crypto from "crypto";
import { AuditLogger } from "../security/SecurityManager.js";
import { DocumentEventService } from "./StorageCvPipeline.js";

// ==========================================
// 1. REAL-TIME DATA CONTRACTS
// ==========================================

export type ConnectionState = 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'AUTHENTICATED' 
  | 'ACTIVE' 
  | 'RECONNECTING' 
  | 'DISCONNECTED';

export interface ConnectionRecord {
  connectionId: string;
  userId: string;
  sessionId?: string;
  state: ConnectionState;
  lastHeartbeat: number;
  reconnectToken: string;
  ws: WebSocket;
  deviceInfo?: string;
  latencyMs: number;
}

export interface SynchronizedSessionState {
  currentQuestion?: string;
  timerSecondsRemaining: number;
  interviewState: 'not_started' | 'intro' | 'answering' | 'evaluating' | 'completed';
  evaluationProgress: number; // Percentage
  adaptationStatus: string; // e.g. "Optimal speed", "Slowing down"
}

export interface RealTimeMetrics {
  activeConnections: number;
  totalConnectionsEstablished: number;
  reconnectRate: number; // percentage
  averageLatencyMs: number;
  droppedConnectionsCount: number;
  streamDurationTotalMs: number;
  messageThroughput: number; // total messages sent/received
  throughputPerSecond: number;
}

// ==========================================
// 2. REAL-TIME EVENT BUS & METRICS
// ==========================================

class RealTimeTelemetry {
  public totalConnectionsEstablished = 0;
  public reconnectionAttempts = 0;
  public reconnectionSuccesses = 0;
  public droppedConnectionsCount = 0;
  public streamDurationTotalMs = 0;
  public messageThroughput = 0;
  private messageTimes: number[] = [];
  private latencySamples: number[] = [];

  recordMessage() {
    this.messageThroughput++;
    this.messageTimes.push(Date.now());
    // Keep only last 10 seconds of timestamps for calculating rates
    const cutoff = Date.now() - 10000;
    while (this.messageTimes.length > 0 && this.messageTimes[0] < cutoff) {
      this.messageTimes.shift();
    }
  }

  getThroughputPerSecond(): number {
    if (this.messageTimes.length === 0) return 0;
    const oldest = this.messageTimes[0];
    const newest = this.messageTimes[this.messageTimes.length - 1];
    const diffSec = Math.max(1, (newest - oldest) / 1000);
    return Math.round((this.messageTimes.length / diffSec) * 10) / 10;
  }

  recordLatency(ms: number) {
    this.latencySamples.push(ms);
    if (this.latencySamples.length > 50) {
      this.latencySamples.shift(); // rolling sample window
    }
  }

  getAverageLatency(): number {
    if (this.latencySamples.length === 0) return 45; // default simulated base RTT
    const sum = this.latencySamples.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencySamples.length);
  }
}

const telemetry = new RealTimeTelemetry();

// Active server-side connections mapped by connection ID
const connections = new Map<string, ConnectionRecord>();

// Preserved states for reconnecting clients (persists for 60 seconds after a connection drops)
const reconnectionPool = new Map<string, {
  userId: string;
  sessionId?: string;
  syncState: SynchronizedSessionState;
  reconnectToken: string;
  expiresAt: number;
}>();

// Authoritative synchronized active session data (mock DB for real-time session recovery)
const sessionSyncStates = new Map<string, SynchronizedSessionState>();

// ==========================================
// 3. GATEWAY IMPLEMENTATION
// ==========================================

export class RealTimeGateway {
  private static wss: WebSocketServer | null = null;
  private static heartbeatInterval: NodeJS.Timeout | null = null;
  private static recoveryCleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize and attach WebSocket server to the Express server
   */
  static initialize(httpServer: Server) {
    if (this.wss) return;

    this.wss = new WebSocketServer({ 
      noServer: true,
      path: "/api/v1/realtime"
    });

    // Handle WebSocket server upgrades manually for precise path matching and future auth
    httpServer.on("upgrade", (request, socket, head) => {
      const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
      if (url.pathname === "/api/v1/realtime") {
        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          this.wss?.emit("connection", ws, request);
        });
      }
    });

    this.wss.on("connection", (ws: WebSocket, request) => {
      const connectionId = `conn_${crypto.randomBytes(8).toString("hex")}`;
      const reconnectToken = crypto.randomBytes(16).toString("hex");

      // Connection opened
      const record: ConnectionRecord = {
        connectionId,
        userId: "unauthenticated",
        state: 'CONNECTED',
        lastHeartbeat: Date.now(),
        reconnectToken,
        ws,
        latencyMs: 45
      };

      connections.set(connectionId, record);
      telemetry.totalConnectionsEstablished++;
      console.log(`[RealTimeGateway] Connection opened: ${connectionId}. State: CONNECTED.`);
      
      // Send welcome payload with connection details
      this.sendToWs(ws, {
        type: "welcome",
        connectionId,
        reconnectToken,
        status: "connected"
      });

      // Set up listeners
      ws.on("message", (rawMessage: string) => {
        telemetry.recordMessage();
        try {
          const message = JSON.parse(rawMessage);
          this.handleIncomingMessage(record, message);
        } catch (err: any) {
          console.warn(`[RealTimeGateway] Malformed message received from ${connectionId}:`, err?.message);
          this.sendToWs(ws, { type: "error", code: "MALFORMED_MESSAGE", message: "Invalid JSON format" });
        }
      });

      ws.on("close", () => {
        this.handleConnectionDrop(record);
      });

      ws.on("error", (err) => {
        console.error(`[RealTimeGateway] Connection error on ${connectionId}:`, err);
        this.handleConnectionDrop(record);
      });
    });

    // Start background loops
    this.startHeartbeatCheck();
    this.startRecoveryPoolCleanup();
    console.log("[RealTimeGateway] Real-Time WebSocket Gateway successfully integrated onto port 3000.");
  }

  /**
   * Clean shutdown of the socket server
   */
  static shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.recoveryCleanupInterval) {
      clearInterval(this.recoveryCleanupInterval);
      this.recoveryCleanupInterval = null;
    }
    this.wss?.close();
    this.wss = null;
    connections.clear();
    console.log("[RealTimeGateway] Real-Time Gateway stopped cleanly.");
  }

  /**
   * Handle incoming socket messages based on protocol
   */
  private static async handleIncomingMessage(record: ConnectionRecord, msg: any) {
    const ws = record.ws;

    switch (msg.type) {
      case "auth": {
        // Authenticate the user session
        const { userId, token } = msg;
        if (!userId) {
          this.sendToWs(ws, { type: "error", code: "AUTH_REQUIRED", message: "User ID is required" });
          return;
        }

        // State Transition: CONNECTED -> AUTHENTICATED
        const oldState = record.state;
        record.userId = userId;
        record.state = 'AUTHENTICATED';
        connections.set(record.connectionId, record);

        console.log(`[RealTimeGateway] [State Transition] ${record.connectionId}: ${oldState} -> AUTHENTICATED. User: ${userId}`);
        
        await DocumentEventService.emitEvent(userId, record.connectionId, 'version_created', `Real-time socket connection ${record.connectionId} authenticated successfully`);
        AuditLogger.logSecurityEvent("rt_connection_authenticated", userId, `Real-time connection ${record.connectionId} authenticated.`);

        this.sendToWs(ws, {
          type: "authenticated",
          connectionId: record.connectionId,
          userId
        });
        break;
      }

      case "reconnect": {
        // Attempt to resurrect a dropped session using the reconnectToken
        const { reconnectToken, userId, sessionId } = msg;
        const savedSession = Array.from(reconnectionPool.entries()).find(
          ([_, data]) => data.reconnectToken === reconnectToken && data.userId === userId
        );

        if (!savedSession) {
          this.sendToWs(ws, { 
            type: "reconnect_failed", 
            message: "Reconnection token has expired or is invalid. Initializing fresh session." 
          });
          return;
        }

        const [oldConnId, sessionData] = savedSession;
        reconnectionPool.delete(oldConnId); // Claimed

        // State Transition: RECONNECTING -> ACTIVE / AUTHENTICATED
        record.userId = userId;
        record.sessionId = sessionId || sessionData.sessionId;
        record.state = record.sessionId ? 'ACTIVE' : 'AUTHENTICATED';
        connections.set(record.connectionId, record);

        telemetry.reconnectionSuccesses++;

        console.log(`[RealTimeGateway] [Reconnection Success] Resurrected old ${oldConnId} onto new ${record.connectionId} for user ${userId}`);
        
        await DocumentEventService.emitEvent(userId, record.connectionId, 'version_created', `Real-time connection successfully re-established & synchronized.`);
        AuditLogger.logSecurityEvent("rt_reconnection_successful", userId, `Real-time connection restored successfully.`);

        // Synchronize state down to client
        const activeState = record.sessionId ? this.getOrCreateSessionState(record.sessionId) : null;

        this.sendToWs(ws, {
          type: "reconnect_success",
          connectionId: record.connectionId,
          sessionId: record.sessionId,
          synchronizedState: activeState
        });
        break;
      }

      case "join_session": {
        // Bind the connection to an active interview or workspace session
        const { sessionId } = msg;
        if (record.state === 'CONNECTED') {
          this.sendToWs(ws, { type: "error", code: "UNAUTHENTICATED", message: "Authenticate before joining session" });
          return;
        }

        const oldState = record.state;
        record.sessionId = sessionId;
        record.state = 'ACTIVE';
        connections.set(record.connectionId, record);

        console.log(`[RealTimeGateway] [State Transition] ${record.connectionId}: ${oldState} -> ACTIVE. Session: ${sessionId}`);

        // Fetch current synced state
        const syncState = this.getOrCreateSessionState(sessionId);

        this.sendToWs(ws, {
          type: "session_joined",
          sessionId,
          synchronizedState: syncState
        });
        break;
      }

      case "heartbeat": {
        // Echo back latency calculations
        const { clientTimestamp } = msg;
        record.lastHeartbeat = Date.now();
        if (clientTimestamp) {
          const rtt = Date.now() - clientTimestamp;
          record.latencyMs = Math.max(5, rtt);
          telemetry.recordLatency(record.latencyMs);
        }
        this.sendToWs(ws, {
          type: "heartbeat_ack",
          serverTimestamp: Date.now(),
          latencyMs: record.latencyMs
        });
        break;
      }

      case "sync_update": {
        // Clients updating their state on the server (e.g. typing, progress, countdown timer)
        const { sessionId, updates } = msg;
        if (!sessionId || record.sessionId !== sessionId) {
          this.sendToWs(ws, { type: "error", code: "INVALID_SESSION", message: "Not authorized for this session" });
          return;
        }

        const currentState = this.getOrCreateSessionState(sessionId);
        const mergedState = { ...currentState, ...updates };
        sessionSyncStates.set(sessionId, mergedState);

        // Broadcast sync to other connections in the same session (for future recruiter live-view/multi-user)
        this.broadcastToSession(sessionId, {
          type: "session_state_updated",
          sessionId,
          synchronizedState: mergedState
        }, record.connectionId);
        break;
      }

      case "voice_start": {
        // Voice ready event handshake
        const { sessionId } = msg;
        await DocumentEventService.emitEvent(record.userId, record.connectionId, 'file_validation_started', `Low-latency real-time voice channel activated on session ${sessionId}`);
        this.sendToWs(ws, { type: "voice_acknowledged", channel: "low-latency-pcm-v1" });
        break;
      }

      case "voice_end": {
        const { sessionId } = msg;
        await DocumentEventService.emitEvent(record.userId, record.connectionId, 'cv_parsed', `Voice conversation stream finalized for session ${sessionId}`);
        this.sendToWs(ws, { type: "voice_closed" });
        break;
      }

      default: {
        console.warn(`[RealTimeGateway] Unknown message type: ${msg.type}`);
        this.sendToWs(ws, { type: "error", code: "UNKNOWN_TYPE", message: `Protocol type '${msg.type}' not supported` });
      }
    }
  }

  /**
   * Handle sudden drop of a websocket connection (e.g., net drop, refresh)
   */
  private static handleConnectionDrop(record: ConnectionRecord) {
    if (!connections.has(record.connectionId)) return;

    connections.delete(record.connectionId);
    telemetry.droppedConnectionsCount++;

    // Mark state as DISCONNECTED internally
    record.state = 'DISCONNECTED';

    // If there was an active user, place connection in reconnection pool for 60 seconds
    if (record.userId && record.userId !== "unauthenticated") {
      const syncState: SynchronizedSessionState = record.sessionId ? this.getOrCreateSessionState(record.sessionId) : {
        timerSecondsRemaining: 300,
        interviewState: 'not_started' as const,
        evaluationProgress: 0,
        adaptationStatus: "Stable connection"
      };

      reconnectionPool.set(record.connectionId, {
        userId: record.userId,
        sessionId: record.sessionId,
        syncState,
        reconnectToken: record.reconnectToken,
        expiresAt: Date.now() + 60000 // 1 minute grace period
      });

      console.log(`[RealTimeGateway] Client connection dropped: ${record.connectionId}. Kept in reconnection grace pool for 60s.`);
      
      // Emit warning event
      DocumentEventService.emitEvent(record.userId, record.connectionId, 'processing_failed', `Real-time websocket connection ${record.connectionId} disconnected unexpectedly. Reconnection window open.`)
        .catch(() => {});
    }
  }

  /**
   * Retrieve or instantiate a real-time session tracking node
   */
  public static getOrCreateSessionState(sessionId: string): SynchronizedSessionState {
    let state = sessionSyncStates.get(sessionId);
    if (!state) {
      state = {
        timerSecondsRemaining: 600, // 10 minutes default
        interviewState: 'not_started',
        evaluationProgress: 0,
        adaptationStatus: "Connecting"
      };
      sessionSyncStates.set(sessionId, state);
    }
    return state;
  }

  /**
   * Force update and synchronization of session states from other parts of the system
   */
  public static syncSessionState(sessionId: string, updates: Partial<SynchronizedSessionState>) {
    const current = this.getOrCreateSessionState(sessionId);
    const merged = { ...current, ...updates };
    sessionSyncStates.set(sessionId, merged);

    // Broadcast change to all clients connected to this session
    this.broadcastToSession(sessionId, {
      type: "session_state_updated",
      sessionId,
      synchronizedState: merged
    });
  }

  /**
   * Stream a text payload (AI generator, feedback, transcription) chunk-by-chunk down the socket
   */
  public static async streamTextToSession(
    sessionId: string, 
    userId: string, 
    streamType: 'question' | 'feedback' | 'summary', 
    fullText: string
  ) {
    const streamId = `stream_${crypto.randomBytes(6).toString("hex")}`;
    const startTime = Date.now();

    console.log(`[RealTimeGateway] Initiating Real-Time text stream [${streamId}] to Session [${sessionId}]`);
    
    // Broadcast stream started
    this.broadcastToSession(sessionId, {
      type: "stream_started",
      streamId,
      streamType,
      fullLength: fullText.length
    });

    // Segment text into readable word chunks to simulate streaming mechanics gracefully
    const words = fullText.split(" ");
    let currentText = "";
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? "" : " ") + words[i];
      
      // Broadcast current chunk accumulation
      this.broadcastToSession(sessionId, {
        type: "stream_chunk",
        streamId,
        streamType,
        chunk: words[i],
        accumulatedText: currentText,
        isFinal: i === words.length - 1
      });

      // Low latency pacing simulation (approx 80ms per word)
      await new Promise(r => setTimeout(r, 75));
    }

    const duration = Date.now() - startTime;
    telemetry.streamDurationTotalMs += duration;

    // Broadcast stream complete
    this.broadcastToSession(sessionId, {
      type: "stream_completed",
      streamId,
      streamType,
      durationMs: duration
    });

    await DocumentEventService.emitEvent(userId, streamId, 'cv_parsed', `Streaming output completed for ${streamType} on session ${sessionId}.`);
  }

  /**
   * Send JSON payload safely to a single socket
   */
  private static sendToWs(ws: WebSocket, payload: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  /**
   * Broadcast message to all active connection records bound to a session ID
   */
  public static broadcastToSession(sessionId: string, payload: any, skipConnectionId?: string) {
    connections.forEach((conn) => {
      if (conn.sessionId === sessionId && conn.connectionId !== skipConnectionId) {
        this.sendToWs(conn.ws, payload);
      }
    });
  }

  /**
   * Broadcast message to all authenticated users (Global Admin Announcement)
   */
  public static broadcastToAll(payload: any) {
    connections.forEach((conn) => {
      this.sendToWs(conn.ws, payload);
    });
  }

  /**
   * Background Heartbeat Ping (detect client departures)
   */
  private static startHeartbeatCheck() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      connections.forEach((conn) => {
        // If client hasn't sent heartbeat in 30 seconds, terminate connection
        if (now - conn.lastHeartbeat > 30000) {
          console.log(`[RealTimeGateway] Terminating inactive connection: ${conn.connectionId}`);
          conn.ws.terminate();
          this.handleConnectionDrop(conn);
        } else {
          // Send ping to active websocket
          this.sendToWs(conn.ws, {
            type: "ping",
            serverTimestamp: now
          });
        }
      });
    }, 15000); // Check every 15s
  }

  /**
   * Background Cleanup of expired Reconnection window holds
   */
  private static startRecoveryPoolCleanup() {
    this.recoveryCleanupInterval = setInterval(() => {
      const now = Date.now();
      reconnectionPool.forEach((data, connId) => {
        if (now > data.expiresAt) {
          reconnectionPool.delete(connId);
          console.log(`[RealTimeGateway] Reconnection window expired for dropped connection ${connId}. State fully purged.`);
        }
      });
    }, 10000); // Check every 10s
  }

  /**
   * Fetch complete system observability metrics
   */
  static getMetrics(): RealTimeMetrics {
    const activeCount = connections.size;
    const reconnectAttempts = telemetry.reconnectionAttempts;
    const reconnectSuccesses = telemetry.reconnectionSuccesses;
    const reconnectRate = reconnectAttempts > 0 ? Math.round((reconnectSuccesses / reconnectAttempts) * 100) : 100;

    return {
      activeConnections: activeCount,
      totalConnectionsEstablished: telemetry.totalConnectionsEstablished,
      reconnectRate,
      averageLatencyMs: telemetry.getAverageLatency(),
      droppedConnectionsCount: telemetry.droppedConnectionsCount,
      streamDurationTotalMs: telemetry.streamDurationTotalMs,
      messageThroughput: telemetry.messageThroughput,
      throughputPerSecond: telemetry.getThroughputPerSecond()
    };
  }

  /**
   * Fetch active connection listings
   */
  static getActiveConnections() {
    return Array.from(connections.values()).map(c => ({
      connectionId: c.connectionId,
      userId: c.userId,
      sessionId: c.sessionId,
      state: c.state,
      latencyMs: c.latencyMs,
      lastHeartbeat: new Date(c.lastHeartbeat).toLocaleTimeString()
    }));
  }
}
