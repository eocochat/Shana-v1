import { StatsRepository, InterviewSession } from './admin/metrics';
import { AccessController } from './admin';

export interface AIOpsIncident {
  id: string;
  type: 'AI unavailable' | 'high latency' | 'evaluation failure' | 'session failure' | 'voice unavailable';
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  timestamp: string;
  severity: 'warning' | 'critical';
}

export interface AIOpsConfig {
  aiFeatureDisabled: boolean;
  pauseNewInterviews: boolean;
  fallbackActivated: boolean;
}

export interface AIOpsAuditLog {
  id: string;
  action: string;
  category: 'incident_creation' | 'review_action' | 'configuration_action' | 'system';
  details: string;
  timestamp: string;
  user: string;
}

export interface AIOpsAlert {
  id: string;
  type: 'warning' | 'critical' | 'resolution';
  message: string;
  timestamp: string;
}

const CONFIG_KEY = 'shana_aiops_config';
const INCIDENTS_KEY = 'shana_aiops_incidents';
const AUDIT_KEY = 'shana_aiops_audit';
const ALERTS_KEY = 'shana_aiops_alerts';

export const AIOperationsController = {
  getConfig(): AIOpsConfig {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const defaults: AIOpsConfig = {
      aiFeatureDisabled: false,
      pauseNewInterviews: false,
      fallbackActivated: false,
    };
    this.saveConfig(defaults);
    return defaults;
  },

  saveConfig(config: AIOpsConfig): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  updateConfig(config: Partial<AIOpsConfig>, userEmail: string): void {
    const current = this.getConfig();
    const updated = { ...current, ...config };
    this.saveConfig(updated);

    // Audit Configuration Action
    const changes = Object.entries(config)
      .map(([k, v]) => `${k} -> ${v}`)
      .join(', ');
    this.logAudit('configuration_action', `Updated AIOps Config: ${changes}`, userEmail);

    // Sync back to general AccessController logs
    AccessController.logAction(
      'SYSTEM',
      `AIOps Config updated: ${changes}`,
      { id: 'usr_admin', email: userEmail, role: 'super_admin' },
      undefined,
      'AIOps Center configuration update'
    );
  },

  getIncidents(): AIOpsIncident[] {
    try {
      const saved = localStorage.getItem(INCIDENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const seeded: AIOpsIncident[] = [
      {
        id: 'inc_1',
        type: 'high latency',
        description: 'Vocal synthesizers in Europe region experiencing latency peaks above 950ms during high concurrency.',
        status: 'investigating',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        severity: 'warning'
      },
      {
        id: 'inc_2',
        type: 'evaluation failure',
        description: 'Gemini structured JSON responses for FR language failed validation parser sporadically on phase 3.',
        status: 'resolved',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        severity: 'critical'
      },
      {
        id: 'inc_3',
        type: 'voice unavailable',
        description: 'Twilio media stream channel disconnection detected in multiple sessions.',
        status: 'open',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        severity: 'critical'
      }
    ];
    this.saveIncidents(seeded);
    return seeded;
  },

  saveIncidents(incidents: AIOpsIncident[]): void {
    localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
  },

  createIncident(type: AIOpsIncident['type'], description: string, severity: AIOpsIncident['severity'], userEmail: string): AIOpsIncident {
    const incidents = this.getIncidents();
    const newIncident: AIOpsIncident = {
      id: 'inc_' + Math.random().toString(36).substring(2, 9),
      type,
      description,
      status: 'open',
      timestamp: new Date().toISOString(),
      severity
    };
    incidents.unshift(newIncident);
    this.saveIncidents(incidents);

    // Audit Incident Creation
    this.logAudit('incident_creation', `Created Incident ${newIncident.id} (${type}): ${description}`, userEmail);

    // Generate non-blocking Alert
    this.createAlert(severity === 'critical' ? 'critical' : 'warning', `New Incident [${type.toUpperCase()}]: ${description}`);

    return newIncident;
  },

  updateIncidentStatus(id: string, status: AIOpsIncident['status'], userEmail: string): void {
    const incidents = this.getIncidents();
    const inc = incidents.find(i => i.id === id);
    if (inc) {
      const oldStatus = inc.status;
      inc.status = status;
      this.saveIncidents(incidents);

      // Audit status update
      this.logAudit('incident_creation', `Updated Incident ${id} status from ${oldStatus} to ${status}`, userEmail);

      // If resolved, create a resolution alert
      if (status === 'resolved') {
        this.createAlert('resolution', `Incident [${inc.type.toUpperCase()}] (${id}) has been successfully resolved.`);
      } else if (status === 'investigating') {
        this.createAlert('warning', `Incident [${inc.type.toUpperCase()}] (${id}) is now being actively investigated.`);
      }
    }
  },

  getAlerts(): AIOpsAlert[] {
    try {
      const saved = localStorage.getItem(ALERTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Seed initial alerts
    const defaults: AIOpsAlert[] = [
      {
        id: 'al_1',
        type: 'critical',
        message: 'Critical error: Voice transcription failed for session sess_active_1, fallback audio active.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 'al_2',
        type: 'warning',
        message: 'Response latency spike detected in model gemini-1.5-flash.',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      }
    ];
    this.saveAlerts(defaults);
    return defaults;
  },

  saveAlerts(alerts: AIOpsAlert[]): void {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  },

  createAlert(type: AIOpsAlert['type'], message: string): void {
    const alerts = this.getAlerts();
    const newAlert: AIOpsAlert = {
      id: 'al_' + Math.random().toString(36).substring(2, 9),
      type,
      message,
      timestamp: new Date().toISOString()
    };
    alerts.unshift(newAlert);
    // Keep max 15 alerts
    if (alerts.length > 15) {
      alerts.pop();
    }
    this.saveAlerts(alerts);
  },

  getAuditLogs(): AIOpsAuditLog[] {
    try {
      const saved = localStorage.getItem(AUDIT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const defaults: AIOpsAuditLog[] = [
      {
        id: 'aud_1',
        action: 'incident_creation',
        category: 'incident_creation',
        details: 'System auto-generated incident: high latency detected in voice pipelines',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        user: 'system@shana.com'
      },
      {
        id: 'aud_2',
        action: 'configuration_action',
        category: 'configuration_action',
        details: 'Super Admin activated Voice Fallback feature in Control Center',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        user: 'superadmin@shana.com'
      }
    ];
    this.saveAuditLogs(defaults);
    return defaults;
  },

  saveAuditLogs(logs: AIOpsAuditLog[]): void {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
  },

  logAudit(category: AIOpsAuditLog['category'], details: string, userEmail: string): void {
    const logs = this.getAuditLogs();
    const newLog: AIOpsAuditLog = {
      id: 'aud_' + Math.random().toString(36).substring(2, 9),
      action: category,
      category,
      details,
      timestamp: new Date().toISOString(),
      user: userEmail
    };
    logs.unshift(newLog);
    this.saveAuditLogs(logs);
  }
};

export const SessionAnalyzer = {
  getLiveInterviews(): InterviewSession[] {
    const originalSessions = StatsRepository.getSessions();
    // Map them to ensure we respect "No intervention" & "No transcript/video"
    const parsedSessions = originalSessions.map(sess => {
      return {
        ...sess,
        // Make sure we have mapped state matching "waiting | running | paused | completed | cancelled | error"
        mappedState: this.mapSessionState(sess.status, sess.progress)
      };
    });

    return parsedSessions;
  },

  mapSessionState(status: string, progress: number): 'waiting' | 'running' | 'paused' | 'completed' | 'cancelled' | 'error' {
    if (status === 'paused') return 'paused';
    if (status === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    if (status === 'active' || status === 'running') {
      if (progress === 0) return 'waiting';
      return 'running';
    }
    // Custom seed or boundary fallback
    if (status === 'error') return 'error';
    return 'running';
  },

  getAIOpsMetrics() {
    const live = this.getLiveInterviews();
    const config = AIOperationsController.getConfig();

    const activeInterviews = live.filter(s => s.status === 'active' || s.status === 'paused').length;
    const errorsCount = live.filter(s => s.status === 'error' || s.mappedState === 'error').length + AIOperationsController.getIncidents().filter(i => i.status === 'open' && i.severity === 'critical').length;

    // Simulate fluctuation slightly around static parameters for Test 1 (Dashboard updates)
    const randomLatencyFluct = Math.floor(Math.sin(Date.now() / 15000) * 15);
    const avgLatency = config.fallbackActivated ? 120 + randomLatencyFluct : 245 + randomLatencyFluct;
    const aiAvailability = config.aiFeatureDisabled ? 0.0 : (config.fallbackActivated ? 99.95 : 98.78);

    return {
      activeInterviews,
      aiAvailability,
      averageDuration: '14:24',
      completionRate: 88.5,
      voiceUsage: 74,
      mirrorUsage: 62,
      errors: errorsCount,
      latency: avgLatency
    };
  }
};

export const QualityEngine = {
  getQualityIndicators() {
    const config = AIOperationsController.getConfig();
    const incidents = AIOperationsController.getIncidents();

    const activeCritical = incidents.filter(i => i.status === 'open' && i.severity === 'critical').length;
    const activeWarning = incidents.filter(i => i.status === 'open' && i.severity === 'warning').length;

    // Evaluate Drop Rate: simulated 6.5% standard
    let dropRateVal = 6.5;
    if (config.pauseNewInterviews) {
      dropRateVal = 0.5;
    }
    const dropRateStatus: 'healthy' | 'warning' | 'critical' = dropRateVal < 5 ? 'healthy' : (dropRateVal < 10 ? 'warning' : 'critical');

    // Evaluate Completion Quality: simulated 91%
    let completionQualityVal = config.aiFeatureDisabled ? 0 : 91;
    const completionQualityStatus: 'healthy' | 'warning' | 'critical' = completionQualityVal > 85 ? 'healthy' : (completionQualityVal > 70 ? 'warning' : 'critical');

    // Evaluate Latency: base 245ms
    let latencyVal = config.fallbackActivated ? 120 : 245;
    const latencyStatus: 'healthy' | 'warning' | 'critical' = latencyVal < 200 ? 'healthy' : (latencyVal < 350 ? 'warning' : 'critical');

    // Unexpected Exits: e.g. 2 exits
    const unexpectedExitsVal: number = activeCritical > 0 ? 4 : 1;
    const unexpectedExitsStatus: 'healthy' | 'warning' | 'critical' = unexpectedExitsVal === 0 ? 'healthy' : (unexpectedExitsVal < 3 ? 'warning' : 'critical');

    // Language Balance: French 62%, English 38%
    const languageBalanceStr = 'FR: 62% | EN: 38%';
    const languageBalanceStatus: 'healthy' | 'warning' | 'critical' = 'healthy'; // naturally balanced

    return [
      {
        id: 'drop_rate',
        name: 'Drop Rate (Taux d\'abandon)',
        value: `${dropRateVal}%`,
        status: dropRateStatus,
        description: 'Taux de sessions annulées ou quittées de manière imprévue par les candidats.'
      },
      {
        id: 'completion_quality',
        name: 'Completion Quality (Qualité de complétion)',
        value: `${completionQualityVal}%`,
        status: completionQualityStatus,
        description: 'Score moyen d\'intégrité des données d\'entretien et de l\'évaluation générée.'
      },
      {
        id: 'response_latency',
        name: 'Response Latency (Latence IA)',
        value: `${latencyVal}ms`,
        status: latencyStatus,
        description: 'Délai moyen de réponse de l\'agent vocal et textuel Shana.'
      },
      {
        id: 'unexpected_exits',
        name: 'Unexpected Exits (Exits Imprévus)',
        value: `${unexpectedExitsVal} sessions`,
        status: unexpectedExitsStatus,
        description: 'Déconnections anormales détectées côté websocket candidat.'
      },
      {
        id: 'language_balance',
        name: 'Language Balance (Équilibre linguistique)',
        value: languageBalanceStr,
        status: languageBalanceStatus,
        description: 'Répartition de la charge opérationnelle entre le français et l\'anglais.'
      }
    ];
  }
};
