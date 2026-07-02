import fs from 'fs';
import path from 'path';

export interface AlertIncident {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: 'api_latency' | 'ai_failure_rate' | 'database_unavailable' | 'queue_backlog' | 'worker_crash' | 'storage_unavailable' | 'excessive_login_failures' | 'abnormal_token_usage' | 'critical_service_offline';
  message: string;
  status: 'active' | 'resolved' | 'dismissed';
  resolvedAt?: string;
  acknowledgedBy?: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'observability-storage.json');

export class AlertManager {
  private static alerts: AlertIncident[] = [];
  private static isInitialized = false;

  private static init() {
    if (this.isInitialized) return;
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const fileContent = fs.readFileSync(STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.alerts = parsed.alerts || [];
      } else {
        this.alerts = this.getSeedAlerts();
        this.save();
      }
    } catch (err) {
      console.error('[AlertManager] Initialization failed:', err);
    } finally {
      this.isInitialized = true;
    }
  }

  private static save() {
    try {
      let currentData: any = {};
      if (fs.existsSync(STORAGE_FILE)) {
        try {
          currentData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
        } catch {
          currentData = {};
        }
      }
      currentData.alerts = this.alerts;
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(currentData, null, 2), 'utf8');
    } catch (err) {
      console.error('[AlertManager] Saving failed:', err);
    }
  }

  public static getAlerts(): AlertIncident[] {
    this.init();
    return [...this.alerts];
  }

  public static triggerAlert(
    metric: AlertIncident['metric'],
    severity: AlertIncident['severity'],
    message: string
  ): AlertIncident {
    this.init();

    // Group or avoid duplicates of same active alert within last 5 minutes
    const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
    const existing = this.alerts.find(
      a => a.metric === metric && a.status === 'active' && new Date(a.timestamp).getTime() > fiveMinsAgo
    );

    if (existing) {
      existing.message = message;
      this.save();
      return existing;
    }

    const newAlert: AlertIncident = {
      id: 'alert_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      severity,
      metric,
      message,
      status: 'active'
    };

    this.alerts.unshift(newAlert);
    
    // Cap alerts to prevent memory leak
    if (this.alerts.length > 500) {
      this.alerts = this.alerts.slice(0, 500);
    }

    this.save();
    return newAlert;
  }

  public static updateStatus(id: string, status: AlertIncident['status'], adminName = 'Admin'): AlertIncident | null {
    this.init();
    const alert = this.alerts.find(a => a.id === id);
    if (!alert) return null;

    alert.status = status;
    if (status === 'resolved') {
      alert.resolvedAt = new Date().toISOString();
    }
    alert.acknowledgedBy = adminName;
    this.save();
    return alert;
  }

  public static clearAllAlerts(): void {
    this.init();
    this.alerts = [];
    this.save();
  }

  /**
   * Evaluates system metrics to automatically trigger alerts.
   * Typically called inside background monitoring checks or on request cycles.
   */
  public static evaluateAlertRules(metrics: {
    avgApiLatency?: number;
    aiFailureRate?: number;
    queueBacklog?: number;
    workerAlive?: boolean;
    storageAvailable?: boolean;
    consecutiveLoginFailures?: number;
    abnormalTokenUsage?: boolean;
  }) {
    if (metrics.avgApiLatency !== undefined && metrics.avgApiLatency > 500) {
      this.triggerAlert(
        'api_latency',
        metrics.avgApiLatency > 1500 ? 'high' : 'medium',
        `API latency exceeds acceptable threshold: Average response duration is ${metrics.avgApiLatency}ms.`
      );
    }

    if (metrics.aiFailureRate !== undefined && metrics.aiFailureRate > 15) {
      this.triggerAlert(
        'ai_failure_rate',
        metrics.aiFailureRate > 30 ? 'critical' : 'high',
        `Generative AI failure rate is elevated: Current error threshold is at ${metrics.aiFailureRate.toFixed(1)}%.`
      );
    }

    if (metrics.queueBacklog !== undefined && metrics.queueBacklog > 100) {
      this.triggerAlert(
        'queue_backlog',
        metrics.queueBacklog > 250 ? 'high' : 'medium',
        `Task dispatch queue backlog is too large: ${metrics.queueBacklog} items are currently waiting for execution.`
      );
    }

    if (metrics.workerAlive === false) {
      this.triggerAlert(
        'worker_crash',
        'critical',
        `Critical Alert: Background Worker System went offline or crashed. Heartbeats ceased.`
      );
    }

    if (metrics.storageAvailable === false) {
      this.triggerAlert(
        'storage_unavailable',
        'critical',
        `Durable cloud storage mount or local persistence file is unavailable for write locks.`
      );
    }

    if (metrics.consecutiveLoginFailures !== undefined && metrics.consecutiveLoginFailures > 10) {
      this.triggerAlert(
        'excessive_login_failures',
        'high',
        `Excessive login failures detected from uniform ranges. Possible credential stuffing or brute force threat.`
      );
    }

    if (metrics.abnormalTokenUsage === true) {
      this.triggerAlert(
        'abnormal_token_usage',
        'high',
        `Abnormal OpenAI/Gemini token volume consumed in short window. Intercepted possible account scraping.`
      );
    }
  }

  private static getSeedAlerts(): AlertIncident[] {
    const now = new Date();
    return [
      {
        id: 'alert_seed_1',
        timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        severity: 'critical',
        metric: 'critical_service_offline',
        message: 'SMTP Email Gateway offline. All transaction notifications and verification codes failed delivery.',
        status: 'active'
      },
      {
        id: 'alert_seed_2',
        timestamp: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
        severity: 'high',
        metric: 'ai_failure_rate',
        message: 'OpenAI rate limits reached. Automated transition to secondary Gemini model completed with degraded speed.',
        status: 'resolved',
        resolvedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
        acknowledgedBy: 'SystemAuto'
      },
      {
        id: 'alert_seed_3',
        timestamp: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
        severity: 'medium',
        metric: 'api_latency',
        message: 'Average API latency peaked at 890ms during interview report generations.',
        status: 'dismissed',
        acknowledgedBy: 'SuperAdmin'
      }
    ];
  }
}
