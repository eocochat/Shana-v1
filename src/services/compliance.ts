import { AccessController } from './admin';
import { CandidateConsent, LifecyclePolicy, PrivacyControlConfig } from '../modules/privacy';

export interface ComplianceAuditEvent {
  id: string;
  actor: string;
  role: 'candidate' | 'admin' | 'super_admin' | 'system';
  feature: 'privacy' | 'consent' | 'evaluation' | 'retention' | 'access';
  action: string;
  event: string;
  time: string;
  origin: string; // e.g. "Paris, FR", "Web Portal", "System Worker"
  result: 'success' | 'warning' | 'failure' | 'pending_review';
  status: string;
}

export interface ComplianceAlert {
  id: string;
  type: 'expired consent' | 'policy mismatch' | 'retention failure' | 'governance issue';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

const COMPLIANCE_AUDIT_KEY = 'shana_compliance_audit_logs';
const COMPLIANCE_ALERTS_KEY = 'shana_compliance_alerts';
const DRAFT_POLICY_KEY = 'shana_compliance_draft_policy';
const DRAFT_PRIVACY_KEY = 'shana_compliance_draft_privacy';

export const AuditExplorer = {
  getEvents(): ComplianceAuditEvent[] {
    try {
      const saved = localStorage.getItem(COMPLIANCE_AUDIT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    // Seed compliance events
    const seeded: ComplianceAuditEvent[] = [
      {
        id: 'comp_aud_1',
        actor: 'superadmin@shana.com',
        role: 'super_admin',
        feature: 'privacy',
        action: 'publish_policy',
        event: 'Published global webcam stream constraints and audio biometric storage policies.',
        time: new Date(Date.now() - 3600 * 1000).toISOString(),
        origin: 'FR-Paris (IP: 194.25.10.15)',
        result: 'success',
        status: 'success'
      },
      {
        id: 'comp_aud_2',
        actor: 'jean.candidat@shana.com',
        role: 'candidate',
        feature: 'consent',
        action: 'accept_consent',
        event: 'Accepted camera, microphone, and audio transcript consent form v2.1.',
        time: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        origin: 'FR-Lyon (IP: 85.12.33.45)',
        result: 'success',
        status: 'success'
      },
      {
        id: 'comp_aud_3',
        actor: 'admin@shana.com',
        role: 'admin',
        feature: 'evaluation',
        action: 'flag_evaluation',
        event: 'Flagged evaluation eval_03 due to unexpected model response output patterns.',
        time: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        origin: 'EN-London (IP: 62.4.195.12)',
        result: 'warning',
        status: 'success'
      },
      {
        id: 'comp_aud_4',
        actor: 'system_worker_retention',
        role: 'system',
        feature: 'retention',
        action: 'purge_logs',
        event: 'Executed scheduled data retention policy to archive expired voice session audio recordings.',
        time: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        origin: 'Google Cloud Run (System Cron)',
        result: 'success',
        status: 'success'
      },
      {
        id: 'comp_aud_5',
        actor: 'admin@shana.com',
        role: 'admin',
        feature: 'privacy',
        action: 'edit_draft',
        event: 'Initiated draft review for microphone transcription policy modifications.',
        time: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        origin: 'FR-Paris (IP: 194.25.10.16)',
        result: 'pending_review',
        status: 'pending_review'
      }
    ];

    this.saveEvents(seeded);
    return seeded;
  },

  saveEvents(events: ComplianceAuditEvent[]): void {
    localStorage.setItem(COMPLIANCE_AUDIT_KEY, JSON.stringify(events));
  },

  logEvent(
    actor: string,
    role: ComplianceAuditEvent['role'],
    feature: ComplianceAuditEvent['feature'],
    action: string,
    event: string,
    origin: string,
    result: ComplianceAuditEvent['result']
  ): void {
    const events = this.getEvents();
    const newEvent: ComplianceAuditEvent = {
      id: 'comp_aud_' + Math.random().toString(36).substring(2, 9),
      actor,
      role,
      feature,
      action,
      event,
      time: new Date().toISOString(),
      origin,
      result,
      status: result
    };
    events.unshift(newEvent);
    this.saveEvents(events);

    // Also link back to main AccessController log for centralized security
    AccessController.logAction(
      'ADMIN_ACTION',
      `[Compliance Center] ${event}`,
      { id: 'usr_admin', email: actor, role },
      undefined,
      `Compliance auditing event: ${action}`
    );
  },

  exportToCSV(filteredEvents: ComplianceAuditEvent[]): string {
    const headers = ['ID', 'Actor', 'Role', 'Feature', 'Action', 'Event', 'Time', 'Origin', 'Result'];
    const rows = filteredEvents.map(e => [
      e.id,
      e.actor,
      e.role,
      e.feature,
      e.action,
      `"${e.event.replace(/"/g, '""')}"`,
      e.time,
      e.origin,
      e.result
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csvContent;
  }
};

export const TrustController = {
  getAlerts(): ComplianceAlert[] {
    try {
      const saved = localStorage.getItem(COMPLIANCE_ALERTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    // Seed initial compliance alerts reflecting the requirements: "expired consent, policy mismatch, retention failure, governance issue"
    const seeded: ComplianceAlert[] = [
      {
        id: 'comp_al_1',
        type: 'expired consent',
        severity: 'warning',
        message: 'Consent expired for Arthur Pendragon (acceptedAt exceeds 90-day compliance window for v1.0).',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        resolved: false
      },
      {
        id: 'comp_al_2',
        type: 'policy mismatch',
        severity: 'critical',
        message: 'Policy mismatch: Camera Policy is configured as stream_only but webcam consent has been refused by candidate Emma Watson.',
        timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        resolved: false
      },
      {
        id: 'comp_al_3',
        type: 'retention failure',
        severity: 'critical',
        message: 'Retention failure: Found 12 orphan voice transcription files that exceeded the 30-day media metadata limit but remain un-archived.',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        resolved: false
      },
      {
        id: 'comp_al_4',
        type: 'governance issue',
        severity: 'warning',
        message: 'Governance issue: Draft Privacy Control Configuration has been sitting in Review state for over 48 hours without approval.',
        timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        resolved: false
      }
    ];

    this.saveAlerts(seeded);
    return seeded;
  },

  saveAlerts(alerts: ComplianceAlert[]): void {
    localStorage.setItem(COMPLIANCE_ALERTS_KEY, JSON.stringify(alerts));
  },

  createAlert(type: ComplianceAlert['type'], message: string, severity: ComplianceAlert['severity']): ComplianceAlert {
    const alerts = this.getAlerts();
    const newAlert: ComplianceAlert = {
      id: 'comp_al_' + Math.random().toString(36).substring(2, 9),
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    alerts.unshift(newAlert);
    this.saveAlerts(alerts);
    return newAlert;
  },

  resolveAlert(id: string, userEmail: string): void {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      alert.resolved = true;
      this.saveAlerts(alerts);
      AuditExplorer.logEvent(
        userEmail,
        'super_admin',
        'privacy',
        'resolve_alert',
        `Resolved compliance alert: ${alert.message}`,
        'Compliance Console',
        'success'
      );
    }
  },

  getDraftPolicy(): LifecyclePolicy | null {
    try {
      const saved = localStorage.getItem(DRAFT_POLICY_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  },

  saveDraftPolicy(policy: LifecyclePolicy | null): void {
    if (policy) {
      localStorage.setItem(DRAFT_POLICY_KEY, JSON.stringify(policy));
    } else {
      localStorage.removeItem(DRAFT_POLICY_KEY);
    }
  },

  getDraftPrivacy(): PrivacyControlConfig | null {
    try {
      const saved = localStorage.getItem(DRAFT_PRIVACY_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  },

  saveDraftPrivacy(config: PrivacyControlConfig | null): void {
    if (config) {
      localStorage.setItem(DRAFT_PRIVACY_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(DRAFT_PRIVACY_KEY);
    }
  }
};
