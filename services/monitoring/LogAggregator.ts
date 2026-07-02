import fs from 'fs';
import path from 'path';

export interface SystemLog {
  id: string;
  timestamp: string;
  service: 'auth' | 'openai' | 'stripe' | 'database' | 'system' | 'admin' | 'interview' | 'telemetry' | string;
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical' | 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  feature: string; // matches operation/feature
  message: string;
  sessionId?: string;
  requestId?: string;
  userId?: string;
  operation?: string;
  executionTime?: number;
  status?: string;
  metadata?: any;
}

const STORAGE_FILE = path.join(process.cwd(), 'observability-storage.json');

export class LogAggregator {
  private static logs: SystemLog[] = [];
  private static isInitialized = false;

  private static init() {
    if (this.isInitialized) return;
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const fileContent = fs.readFileSync(STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.logs = parsed.logs || [];
      } else {
        this.logs = this.getSeedLogs();
        this.save();
      }
    } catch (err) {
      console.error('[LogAggregator] Initialization failed:', err);
    } finally {
      this.isInitialized = true;
    }
  }

  public static save() {
    try {
      let currentData: any = {};
      if (fs.existsSync(STORAGE_FILE)) {
        try {
          currentData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
        } catch {
          currentData = {};
        }
      }
      currentData.logs = this.logs;
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(currentData, null, 2), 'utf8');
    } catch (err) {
      console.error('[LogAggregator] Saving failed:', err);
    }
  }

  /**
   * Safe masking of sensitive user data: emails, credit cards, auth tokens, passwords
   */
  public static maskSensitiveData(text: string): string {
    if (!text) return text;
    let masked = text;

    // Mask Emails: test@example.com -> t***@example.com
    masked = masked.replace(/([\w.-]+)@([\w.-]+\.[\w.]+)/g, (match, p1, p2) => {
      if (p1.length <= 2) return `***@${p2}`;
      return `${p1.charAt(0)}***${p1.charAt(p1.length - 1)}@${p2}`;
    });

    // Mask Credit Cards
    masked = masked.replace(/\b(?:\d[ -]*?){13,16}\b/g, '****-****-****-****');

    // Mask API Keys (like sk-...) or authorization headers
    masked = masked.replace(/(sk-[a-zA-Z0-9]{20,})/g, 'sk-********************');
    masked = masked.replace(/(key_vault_[a-zA-Z0-9]{12,})/g, 'key_vault_************');
    masked = masked.replace(/(Authorization:\s*Bearer\s+)[a-zA-Z0-9-_./+]{15,}/gi, '$1[REDACTED_BEARER_TOKEN]');

    // Mask passwords or secret values in general key-value strings
    masked = masked.replace(/("password"|"secret"|"rawValue"|"token"|"cvContent")\s*:\s*"[^"]*"/gi, (match, p1) => {
      return `${p1}: "[REDACTED_SENSITIVE_VALUE]"`;
    });

    return masked;
  }

  public static log(
    service: SystemLog['service'],
    severity: SystemLog['severity'],
    feature: string,
    message: string,
    sessionId?: string,
    metadata?: any,
    requestId?: string,
    userId?: string,
    executionTime?: number,
    status?: string
  ): SystemLog {
    this.init();

    const maskedMessage = this.maskSensitiveData(message);
    let maskedMetadata = metadata;
    if (metadata) {
      try {
        const metaStr = JSON.stringify(metadata);
        const maskedMetaStr = this.maskSensitiveData(metaStr);
        maskedMetadata = JSON.parse(maskedMetaStr);
      } catch {
        maskedMetadata = { error: 'Metadata masking failed' };
      }
    }

    // Automatically resolve trace elements if passed in metadata object
    const finalRequestId = requestId || metadata?.requestId || metadata?.traceId;
    const finalUserId = userId || metadata?.userId;
    const finalExecutionTime = executionTime || metadata?.executionTime || metadata?.durationMs;
    const finalStatus = status || metadata?.status || (metadata?.success !== undefined ? (metadata.success ? 'success' : 'failed') : undefined);
    const finalOperation = metadata?.operation || feature;

    const newLog: SystemLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      service,
      severity,
      feature,
      message: maskedMessage,
      sessionId,
      requestId: finalRequestId,
      userId: finalUserId,
      operation: finalOperation,
      executionTime: finalExecutionTime,
      status: finalStatus,
      metadata: maskedMetadata
    };

    this.logs.unshift(newLog);

    // CENTRAL RETENTION POLICY: Keep application logs capped at 2000 entries max.
    // Older records are automatically pruned (archived from active search pool).
    const RETENTION_LIMIT = 2000;
    if (this.logs.length > RETENTION_LIMIT) {
      this.logs = this.logs.slice(0, RETENTION_LIMIT);
    }

    this.save();
    return newLog;
  }

  public static getLogs(filters?: {
    startDate?: string;
    endDate?: string;
    service?: string;
    severity?: string;
    feature?: string;
    sessionId?: string;
    search?: string;
  }): SystemLog[] {
    this.init();
    let result = [...this.logs];

    if (filters) {
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        result = result.filter(l => new Date(l.timestamp).getTime() >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime();
        result = result.filter(l => new Date(l.timestamp).getTime() <= end);
      }
      if (filters.service && filters.service !== 'all') {
        result = result.filter(l => l.service === filters.service);
      }
      if (filters.severity && filters.severity !== 'all') {
        result = result.filter(l => l.severity === filters.severity);
      }
      if (filters.feature && filters.feature !== 'all') {
        result = result.filter(l => l.feature.toLowerCase().includes((filters.feature || '').toLowerCase()));
      }
      if (filters.sessionId) {
        result = result.filter(l => l.sessionId === filters.sessionId);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(l => 
          l.message.toLowerCase().includes(searchLower) ||
          l.feature.toLowerCase().includes(searchLower) ||
          (l.sessionId && l.sessionId.toLowerCase().includes(searchLower))
        );
      }
    }

    return result;
  }

  public static clearLogs(): void {
    this.init();
    this.logs = [];
    this.save();
  }

  private static getSeedLogs(): SystemLog[] {
    const services: SystemLog['service'][] = ['auth', 'openai', 'stripe', 'database', 'system', 'admin', 'interview'];
    const severities: SystemLog['severity'][] = ['info', 'warning'];
    const featuresMap: Record<string, string[]> = {
      auth: ['session-validation', 'jwt-generation', 'admin-login'],
      openai: ['text-to-speech', 'gpt-interview-coach', 'cv-parsing'],
      stripe: ['checkout-session-creation', 'webhook-validation', 'subscription-sync'],
      database: ['sqlite-query', 'user-sync', 'audit-write'],
      system: ['server-boot', 'health-ping', 'scheduler-cron'],
      admin: ['key-vault-update', 'user-role-promotion', 'audit-fetch'],
      interview: ['speak-stream', 'audio-analysis', 'history-save']
    };

    const seed: SystemLog[] = [];
    const now = new Date();

    // Create 45 interesting historical seed logs over the last 24 hours
    for (let i = 0; i < 45; i++) {
      const service = services[i % services.length];
      const severity = i % 15 === 0 ? 'warning' : 'info';
      const features = featuresMap[service];
      const feature = features[i % features.length];
      const timeOffset = i * 20 * 60 * 1000; // staggered minutes
      const timestamp = new Date(now.getTime() - timeOffset).toISOString();

      let message = `Successfully completed task for ${feature} in ${service}`;
      if (severity === 'warning') {
        message = `Latency warning detected in ${service} of ${240 + (i * 12)}ms for ${feature}`;
      }

      seed.push({
        id: `seed_log_${i}`,
        timestamp,
        service,
        severity,
        feature,
        message,
        sessionId: i % 3 === 0 ? `sess_${10000 + i}` : undefined
      });
    }

    return seed;
  }
}
