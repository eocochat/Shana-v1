import {
  Connector,
  ConnectorState,
  ConnectorCategory,
  ApiKey,
  WebhookSubscription,
  WebhookDeliveryLog,
  WebhookEvent,
  MarketplaceExtension,
  AutomationWorkflow,
  IntegrationAuditLog,
  IntegrationStats
} from '../modules/connectors';
import { AccessController } from './admin';

// Storage keys
const CONNECTORS_KEY = 'shana_integrations_connectors';
const API_KEYS_KEY = 'shana_integrations_api_keys';
const WEBHOOKS_KEY = 'shana_integrations_webhooks';
const WEBHOOK_LOGS_KEY = 'shana_integrations_webhook_logs';
const MARKETPLACE_KEY = 'shana_integrations_marketplace';
const AUTOMATIONS_KEY = 'shana_integrations_automations';
const INTEGRATION_AUDIT_KEY = 'shana_integrations_audit';

// -------------------------------------------------------------
// SEED DATA
// -------------------------------------------------------------
const DEFAULT_CONNECTORS: Connector[] = [
  {
    connectorId: 'conn_workday',
    name: 'Workday ATS Sync',
    status: 'connected',
    category: 'ATS',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    config: { apiUrl: 'https://api.workday.com/v1', clientId: 'wd_shana_oauth' },
    syncCount: 342,
    errorCount: 2
  },
  {
    connectorId: 'conn_greenhouse',
    name: 'Greenhouse ATS Feed',
    status: 'draft',
    category: 'ATS',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    lastSync: '-',
    config: { apiKey: '', boardId: '' },
    syncCount: 0,
    errorCount: 0
  },
  {
    connectorId: 'conn_gcal',
    name: 'Google Calendar API',
    status: 'connected',
    category: 'calendar',
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    config: { calendarId: 'primary', scopes: 'calendar.events' },
    syncCount: 1204,
    errorCount: 1
  },
  {
    connectorId: 'conn_hubspot',
    name: 'HubSpot Talent CRM',
    status: 'disabled',
    category: 'CRM',
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    lastSync: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    config: { portalId: '984124' },
    syncCount: 89,
    errorCount: 0
  },
  {
    connectorId: 'conn_s3',
    name: 'AWS S3 Compliance Vault',
    status: 'error',
    category: 'storage',
    createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
    lastSync: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    config: { bucket: 'shana-confidential-interviews', region: 'eu-west-3' },
    syncCount: 200,
    errorCount: 18
  },
  {
    connectorId: 'conn_slack',
    name: 'Slack Alerts Hook',
    status: 'connected',
    category: 'communication',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    lastSync: new Date(Date.now() - 45 * 1000).toISOString(),
    config: { channel: '#shana-interviews-feed' },
    syncCount: 450,
    errorCount: 0
  },
  {
    connectorId: 'conn_teams',
    name: 'Microsoft Teams Bot',
    status: 'draft',
    category: 'communication',
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    lastSync: '-',
    config: {},
    syncCount: 0,
    errorCount: 0
  }
];

const DEFAULT_API_KEYS: ApiKey[] = [
  {
    apiKeyId: 'apikey_workday_prod',
    name: 'Workday Production Key',
    secretMasked: 'shana_live_6f4b7a••••••••••••89ab',
    environment: 'production',
    permissions: 'write',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'active',
    usageCount: 1250
  },
  {
    apiKeyId: 'apikey_sandbox_dev',
    name: 'Dev Testing Sandbox Key',
    secretMasked: 'shana_test_5a1c2d••••••••••••56fe',
    environment: 'sandbox',
    permissions: 'admin',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - 10 * 1000).toISOString(),
    status: 'active',
    usageCount: 420
  }
];

const DEFAULT_WEBHOOKS: WebhookSubscription[] = [
  {
    id: 'webhk_workday_complete',
    event: 'interview.completed',
    destination: 'https://api.workday.com/shana/webhook-receiver',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    secretToken: 'whsec_9a8b7c6d5e4f3g2h1i0j',
    attempts: 120,
    successRate: 98.3
  },
  {
    id: 'webhk_slack_workspace',
    event: 'workspace.created',
    destination: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    secretToken: 'whsec_slack_shana_token_secret',
    attempts: 45,
    successRate: 100.0
  }
];

const DEFAULT_MARKETPLACE: MarketplaceExtension[] = [
  {
    id: 'ext_workday',
    integration: 'Workday ATS',
    category: 'ATS',
    status: 'installed',
    version: '2.1.4',
    description: 'Synchronise assessment results, audio scoring analysis, and feedback sheets straight into candidate profiles in Workday.',
    author: 'SHANA Partner Ecosystem',
  },
  {
    id: 'ext_greenhouse',
    integration: 'Greenhouse',
    category: 'ATS',
    status: 'available',
    version: '1.8.0',
    description: 'Automatically invite candidates to SHANA mirror evaluations and ingest full reports inside greenhouse milestones.',
    author: 'Greenhouse Dev Labs',
  },
  {
    id: 'ext_gcal',
    integration: 'Google Calendar Sync',
    category: 'calendar',
    status: 'installed',
    version: '3.0.2',
    description: 'Schedule automated mock interviews on Google Meet, automatically reserving assessment tokens and sending details to calendars.',
    author: 'SHANA Core Team',
  },
  {
    id: 'ext_salesforce',
    integration: 'Salesforce Talent CRM',
    category: 'CRM',
    status: 'available',
    version: '1.0.5',
    description: 'Track candidate acquisition, executive practices, and billing volumes directly in your company Salesforce instances.',
    author: 'Salesforce Partner',
  },
  {
    id: 'ext_slack',
    integration: 'Slack Notifications',
    category: 'communication',
    status: 'installed',
    version: '2.0.1',
    description: 'Broadcast instant real-time live-monitoring alert digests inside Slack channels on interview activity, success levels, or system locks.',
    author: 'SHANA Core Team',
  },
  {
    id: 'ext_teams',
    integration: 'Microsoft Teams',
    category: 'communication',
    status: 'available',
    version: '1.1.0',
    description: 'Establish live telemetry bots that relay video assessments and instant feedback inside corporate Teams workspaces.',
    author: 'Microsoft Certified Developer',
  }
];

const DEFAULT_AUTOMATIONS: AutomationWorkflow[] = [
  {
    id: 'auto_workday_push',
    name: 'Sync Completed Interview to Workday ATS',
    trigger: 'interview.completed',
    condition: 'score >= 80',
    action: 'Generate report & push ATS candidate',
    active: true,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    lastExecuted: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    executionCount: 88
  },
  {
    id: 'auto_slack_new_workspace',
    name: 'Notify HR on Workspace Creation',
    trigger: 'workspace.created',
    condition: 'always',
    action: 'Send notification to Slack',
    active: true,
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    lastExecuted: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    executionCount: 12
  },
  {
    id: 'auto_quota_on_signup',
    name: 'Initialize defaults on user signup',
    trigger: 'user.updated',
    condition: 'role == candidate',
    action: 'Initialize default quotas & send welcome pack',
    active: false,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    lastExecuted: '-',
    executionCount: 0
  }
];

const DEFAULT_WEBHOOK_LOGS: WebhookDeliveryLog[] = [
  {
    id: 'wlog_1',
    webhookId: 'webhk_workday_complete',
    event: 'interview.completed',
    destination: 'https://api.workday.com/shana/webhook-receiver',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    payload: JSON.stringify({ event: 'interview.completed', candidateId: 'usr_cand_12', score: 85, durationSeconds: 1120 }),
    responseStatus: 200,
    responseBody: JSON.stringify({ status: 'success', syncedId: 'wd-cand-shana-998' }),
    attempts: 1,
    success: true
  },
  {
    id: 'wlog_2',
    webhookId: 'webhk_workday_complete',
    event: 'interview.completed',
    destination: 'https://api.workday.com/shana/webhook-receiver',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    payload: JSON.stringify({ event: 'interview.completed', candidateId: 'usr_cand_8', score: 92, durationSeconds: 1540 }),
    responseStatus: 503,
    responseBody: 'Service Unavailable',
    attempts: 3,
    success: false
  }
];

const DEFAULT_AUDIT_LOGS: IntegrationAuditLog[] = [
  {
    id: 'iaud_1',
    actor: 'superadmin@shana.com',
    role: 'super_admin',
    actionType: 'integration_created',
    description: 'Created production API Key: "Workday Production Key"',
    timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'iaud_2',
    actor: 'admin@shana.com',
    role: 'admin',
    actionType: 'connector_changed',
    description: 'Updated connection parameters for Google Calendar API',
    timestamp: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'iaud_3',
    actor: 'superadmin@shana.com',
    role: 'super_admin',
    actionType: 'marketplace_installed',
    description: 'Installed extension "Google Calendar Sync" version 3.0.2',
    timestamp: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  }
];

// -------------------------------------------------------------
// INTEGRATION REGISTRY (DATA HOLDER)
// -------------------------------------------------------------
export const IntegrationRegistry = {
  getConnectors(): Connector[] {
    const saved = localStorage.getItem(CONNECTORS_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(CONNECTORS_KEY, JSON.stringify(DEFAULT_CONNECTORS));
    return DEFAULT_CONNECTORS;
  },

  saveConnectors(conns: Connector[]): void {
    localStorage.setItem(CONNECTORS_KEY, JSON.stringify(conns));
  },

  getApiKeys(): ApiKey[] {
    const saved = localStorage.getItem(API_KEYS_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(API_KEYS_KEY, JSON.stringify(DEFAULT_API_KEYS));
    return DEFAULT_API_KEYS;
  },

  saveApiKeys(keys: ApiKey[]): void {
    localStorage.setItem(API_KEYS_KEY, JSON.stringify(keys));
  },

  getWebhooks(): WebhookSubscription[] {
    const saved = localStorage.getItem(WEBHOOKS_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(DEFAULT_WEBHOOKS));
    return DEFAULT_WEBHOOKS;
  },

  saveWebhooks(hooks: WebhookSubscription[]): void {
    localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(hooks));
  },

  getWebhookLogs(): WebhookDeliveryLog[] {
    const saved = localStorage.getItem(WEBHOOK_LOGS_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(WEBHOOK_LOGS_KEY, JSON.stringify(DEFAULT_WEBHOOK_LOGS));
    return DEFAULT_WEBHOOK_LOGS;
  },

  saveWebhookLogs(logs: WebhookDeliveryLog[]): void {
    localStorage.setItem(WEBHOOK_LOGS_KEY, JSON.stringify(logs));
  },

  getMarketplace(): MarketplaceExtension[] {
    const saved = localStorage.getItem(MARKETPLACE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(DEFAULT_MARKETPLACE));
    return DEFAULT_MARKETPLACE;
  },

  saveMarketplace(exts: MarketplaceExtension[]): void {
    localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(exts));
  },

  getAutomations(): AutomationWorkflow[] {
    const saved = localStorage.getItem(AUTOMATIONS_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(AUTOMATIONS_KEY, JSON.stringify(DEFAULT_AUTOMATIONS));
    return DEFAULT_AUTOMATIONS;
  },

  saveAutomations(workflows: AutomationWorkflow[]): void {
    localStorage.setItem(AUTOMATIONS_KEY, JSON.stringify(workflows));
  },

  getAuditLogs(): IntegrationAuditLog[] {
    const saved = localStorage.getItem(INTEGRATION_AUDIT_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(INTEGRATION_AUDIT_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
    return DEFAULT_AUDIT_LOGS;
  },

  saveAuditLogs(logs: IntegrationAuditLog[]): void {
    localStorage.setItem(INTEGRATION_AUDIT_KEY, JSON.stringify(logs));
  },

  logAction(actorEmail: string, role: 'admin' | 'super_admin' | 'system', actionType: IntegrationAuditLog['actionType'], description: string, targetId?: string): void {
    const logs = this.getAuditLogs();
    const newLog: IntegrationAuditLog = {
      id: 'iaud_' + Math.random().toString(36).substring(2, 9),
      actor: actorEmail,
      role,
      actionType,
      description,
      timestamp: new Date().toISOString(),
      targetId
    };
    logs.unshift(newLog);
    this.saveAuditLogs(logs);

    // Feed main dashboard admin audit logs as well
    AccessController.logAction(
      'ADMIN_ACTION',
      `[Integration Layer] ${description}`,
      { id: 'usr_admin', email: actorEmail, role },
      targetId,
      `Action: ${actionType}`
    );
  }
};

// -------------------------------------------------------------
// CONNECTOR MANAGER
// -------------------------------------------------------------
export const ConnectorManager = {
  getConnectors(): Connector[] {
    return IntegrationRegistry.getConnectors();
  },

  connect(connectorId: string, config: Record<string, string>, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const conns = IntegrationRegistry.getConnectors();
    const conn = conns.find(c => c.connectorId === connectorId);
    if (conn) {
      conn.status = 'connected';
      conn.config = { ...conn.config, ...config };
      conn.lastSync = new Date().toISOString();
      IntegrationRegistry.saveConnectors(conns);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'connector_changed',
        `Connected and initialized connector "${conn.name}"`,
        connectorId
      );
    }
  },

  disconnect(connectorId: string, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const conns = IntegrationRegistry.getConnectors();
    const conn = conns.find(c => c.connectorId === connectorId);
    if (conn) {
      conn.status = 'draft';
      conn.lastSync = '-';
      IntegrationRegistry.saveConnectors(conns);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'connector_changed',
        `Disconnected connector "${conn.name}" (reverted to draft)`,
        connectorId
      );
    }
  },

  pause(connectorId: string, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const conns = IntegrationRegistry.getConnectors();
    const conn = conns.find(c => c.connectorId === connectorId);
    if (conn) {
      conn.status = 'disabled';
      IntegrationRegistry.saveConnectors(conns);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'connector_changed',
        `Paused connector "${conn.name}" (disabled)`,
        connectorId
      );
    }
  },

  resume(connectorId: string, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const conns = IntegrationRegistry.getConnectors();
    const conn = conns.find(c => c.connectorId === connectorId);
    if (conn) {
      conn.status = 'connected';
      conn.lastSync = new Date().toISOString();
      IntegrationRegistry.saveConnectors(conns);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'connector_changed',
        `Resumed connector "${conn.name}" (re-established connection)`,
        connectorId
      );
    }
  }
};

// -------------------------------------------------------------
// OAUTH MANAGER
// -------------------------------------------------------------
export const OAuthManager = {
  simulateOAuthFlow(connectorId: string, actorEmail: string, role: 'admin' | 'super_admin'): Promise<{ success: boolean; token?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const token = 'oauth_tk_' + Math.random().toString(36).substring(2, 15);
        ConnectorManager.connect(connectorId, { oauthToken: token, oauthExpires: new Date(Date.now() + 3600 * 1000).toISOString() }, actorEmail, role);
        resolve({ success: true, token });
      }, 1000);
    });
  }
};

// -------------------------------------------------------------
// API ACCESS MANAGER
// -------------------------------------------------------------
export const ApiAccessManager = {
  getApiKeys(): ApiKey[] {
    return IntegrationRegistry.getApiKeys();
  },

  createKey(name: string, environment: 'production' | 'sandbox', permissions: 'read' | 'write' | 'admin', actorEmail: string, role: 'admin' | 'super_admin'): ApiKey {
    const keys = IntegrationRegistry.getApiKeys();
    const keyId = 'apikey_' + Math.random().toString(36).substring(2, 9);
    
    // Generate simulated raw API secret
    const rawSecret = `shana_${environment === 'production' ? 'live' : 'test'}_` + 
      Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    const maskedSecret = rawSecret.substring(0, 15) + '••••••••' + rawSecret.substring(rawSecret.length - 4);

    const newKey: ApiKey = {
      apiKeyId: keyId,
      name,
      secretMasked: maskedSecret,
      secretRaw: rawSecret, // Pass once so front-end can display copyable credentials
      environment,
      permissions,
      createdAt: new Date().toISOString(),
      lastUsed: '-',
      status: 'active',
      usageCount: 0
    };

    keys.unshift(newKey);
    IntegrationRegistry.saveApiKeys(keys);

    IntegrationRegistry.logAction(
      actorEmail,
      role,
      'api_generated',
      `Provisioned new ${environment.toUpperCase()} API Key: "${name}"`,
      keyId
    );

    return newKey;
  },

  disableKey(apiKeyId: string, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const keys = IntegrationRegistry.getApiKeys();
    const key = keys.find(k => k.apiKeyId === apiKeyId);
    if (key) {
      key.status = 'revoked';
      IntegrationRegistry.saveApiKeys(keys);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'api_generated',
        `Revoked and disabled API Key: "${key.name}"`,
        apiKeyId
      );
    }
  },

  rotateKey(apiKeyId: string, actorEmail: string, role: 'admin' | 'super_admin'): ApiKey | null {
    const keys = IntegrationRegistry.getApiKeys();
    const keyIndex = keys.findIndex(k => k.apiKeyId === apiKeyId);
    if (keyIndex !== -1) {
      const oldKey = keys[keyIndex];
      
      // Generate new simulated raw API secret
      const rawSecret = `shana_${oldKey.environment === 'production' ? 'live' : 'test'}_` + 
        Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      const maskedSecret = rawSecret.substring(0, 15) + '••••••••' + rawSecret.substring(rawSecret.length - 4);

      const rotated: ApiKey = {
        ...oldKey,
        secretMasked: maskedSecret,
        secretRaw: rawSecret,
        createdAt: new Date().toISOString(),
        lastUsed: '-',
        usageCount: 0,
        status: 'active'
      };

      keys[keyIndex] = rotated;
      IntegrationRegistry.saveApiKeys(keys);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'api_generated',
        `Rotated secrets and re-activated API Key: "${oldKey.name}"`,
        apiKeyId
      );

      return rotated;
    }
    return null;
  }
};

// -------------------------------------------------------------
// WEBHOOK ENGINE
// -------------------------------------------------------------
export const WebhookEngine = {
  getSubscriptions(): WebhookSubscription[] {
    return IntegrationRegistry.getWebhooks();
  },

  createSubscription(event: WebhookEvent, destination: string, actorEmail: string, role: 'admin' | 'super_admin'): WebhookSubscription {
    const hooks = IntegrationRegistry.getWebhooks();
    const id = 'webhk_' + Math.random().toString(36).substring(2, 9);
    
    // Generate signature token secret for endpoint validation
    const secretToken = 'whsec_' + Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newHook: WebhookSubscription = {
      id,
      event,
      destination,
      status: 'active',
      createdAt: new Date().toISOString(),
      secretToken,
      attempts: 0,
      successRate: 100.0
    };

    hooks.unshift(newHook);
    IntegrationRegistry.saveWebhooks(hooks);

    IntegrationRegistry.logAction(
      actorEmail,
      role,
      'integration_created',
      `Registered webhook subscriber for event ${event} sending to ${destination}`,
      id
    );

    return newHook;
  },

  pauseSubscription(id: string, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const hooks = IntegrationRegistry.getWebhooks();
    const hook = hooks.find(h => h.id === id);
    if (hook) {
      hook.status = 'paused';
      IntegrationRegistry.saveWebhooks(hooks);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'connector_changed',
        `Paused webhook delivery for subscriber ${id}`,
        id
      );
    }
  },

  resumeSubscription(id: string, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const hooks = IntegrationRegistry.getWebhooks();
    const hook = hooks.find(h => h.id === id);
    if (hook) {
      hook.status = 'active';
      IntegrationRegistry.saveWebhooks(hooks);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'connector_changed',
        `Resumed webhook delivery for subscriber ${id}`,
        id
      );
    }
  },

  deleteSubscription(id: string, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const hooks = IntegrationRegistry.getWebhooks();
    const hook = hooks.find(h => h.id === id);
    if (hook) {
      const updated = hooks.filter(h => h.id !== id);
      IntegrationRegistry.saveWebhooks(updated);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'connector_changed',
        `Removed webhook subscription for event ${hook.event} targeting ${hook.destination}`,
        id
      );
    }
  },

  // Trigger outbound event transmission (with retry logging & simulated signature verification header calculation)
  dispatchWebhookEvent(event: WebhookEvent, payload: Record<string, any>): void {
    const hooks = IntegrationRegistry.getWebhooks();
    const activeSubscribers = hooks.filter(h => h.event === event && h.status === 'active');
    
    if (activeSubscribers.length === 0) return;

    const logs = IntegrationRegistry.getWebhookLogs();

    activeSubscribers.forEach(sub => {
      sub.attempts += 1;
      
      // Simulate endpoint responses
      const isFailedSample = sub.destination.includes('failed') || Math.random() < 0.05;
      const status = isFailedSample ? 503 : 200;
      const responseBody = isFailedSample ? 'Gateway Timeout' : JSON.stringify({ received: true, eventId: 'evt_' + Math.random().toString(36).substring(2, 9) });

      // Generate signature validation string that webhook receivers would use to verify authenticity
      // SHA-256 validation simulation: sha256_hmac_signature(payload_string, secretToken)
      const simulatedSignature = `t=${Math.floor(Date.now()/1000)},v1=${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      const deliveryLog: WebhookDeliveryLog = {
        id: 'wlog_' + Math.random().toString(36).substring(2, 9),
        webhookId: sub.id,
        event,
        destination: sub.destination,
        timestamp: new Date().toISOString(),
        payload: JSON.stringify(payload),
        responseStatus: status,
        responseBody,
        attempts: 1,
        success: status === 200
      };

      logs.unshift(deliveryLog);

      // Simple success rate calculation: success logs for this webhook subscription / total attempts
      const allWebSubLogs = logs.filter(l => l.webhookId === sub.id);
      const successCount = allWebSubLogs.filter(l => l.success).length;
      sub.successRate = parseFloat(((successCount / allWebSubSubmissionsCount(allWebSubLogs.length)) * 100).toFixed(1));

      // Trigger Audit Logs on system dispatch
      IntegrationRegistry.logAction(
        'system',
        'system',
        'webhook_executed',
        `Outbound webhook dispatched for event [${event}]. Delivery Status: ${status} ${status === 200 ? 'OK' : 'ERR'}. Signature Hash: ${simulatedSignature.substring(0, 30)}...`,
        sub.id
      );
    });

    IntegrationRegistry.saveWebhooks(hooks);
    IntegrationRegistry.saveWebhookLogs(logs);
  }
};

function allWebSubSubmissionsCount(length: number): number {
  return length === 0 ? 1 : length;
}

// -------------------------------------------------------------
// MARKETPLACE MANAGER
// -------------------------------------------------------------
export const MarketplaceManager = {
  getExtensions(): MarketplaceExtension[] {
    return IntegrationRegistry.getMarketplace();
  },

  installExtension(id: string, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const exts = IntegrationRegistry.getMarketplace();
    const ext = exts.find(e => e.id === id);
    if (ext) {
      ext.status = 'installed';
      IntegrationRegistry.saveMarketplace(exts);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'marketplace_installed',
        `Installed marketplace integration plugin: "${ext.integration}" version ${ext.version}`,
        id
      );
    }
  },

  uninstallExtension(id: string, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const exts = IntegrationRegistry.getMarketplace();
    const ext = exts.find(e => e.id === id);
    if (ext) {
      ext.status = 'available';
      IntegrationRegistry.saveMarketplace(exts);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'marketplace_installed',
        `Uninstalled marketplace integration plugin: "${ext.integration}"`,
        id
      );
    }
  },

  enableExtension(id: string, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const exts = IntegrationRegistry.getMarketplace();
    const ext = exts.find(e => e.id === id);
    if (ext) {
      ext.status = 'installed';
      IntegrationRegistry.saveMarketplace(exts);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'connector_changed',
        `Enabled marketplace integration: "${ext.integration}"`,
        id
      );
    }
  },

  disableExtension(id: string, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const exts = IntegrationRegistry.getMarketplace();
    const ext = exts.find(e => e.id === id);
    if (ext) {
      ext.status = 'disabled';
      IntegrationRegistry.saveMarketplace(exts);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'connector_changed',
        `Disabled marketplace integration: "${ext.integration}"`,
        id
      );
    }
  }
};

// -------------------------------------------------------------
// AUTOMATION WORKFLOW ENGINE
// -------------------------------------------------------------
export const AutomationEngine = {
  getWorkflows(): AutomationWorkflow[] {
    return IntegrationRegistry.getAutomations();
  },

  saveWorkflows(workflows: AutomationWorkflow[]): void {
    IntegrationRegistry.saveAutomations(workflows);
  },

  createWorkflow(name: string, trigger: string, condition: string, action: string, actorEmail: string, role: 'admin' | 'super_admin'): AutomationWorkflow {
    const workflows = IntegrationRegistry.getAutomations();
    const id = 'auto_' + Math.random().toString(36).substring(2, 9);

    const newWorkflow: AutomationWorkflow = {
      id,
      name,
      trigger,
      condition,
      action,
      active: true,
      createdAt: new Date().toISOString(),
      lastExecuted: '-',
      executionCount: 0
    };

    workflows.unshift(newWorkflow);
    IntegrationRegistry.saveAutomations(workflows);

    IntegrationRegistry.logAction(
      actorEmail,
      role,
      'integration_created',
      `Configured automation rule: "${name}". Trigger: ${trigger} -> Action: ${action}`,
      id
    );

    return newWorkflow;
  },

  toggleWorkflow(id: string, active: boolean, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const workflows = IntegrationRegistry.getAutomations();
    const wf = workflows.find(w => w.id === id);
    if (wf) {
      wf.active = active;
      IntegrationRegistry.saveAutomations(workflows);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'connector_changed',
        `${active ? 'Activated' : 'Deactivated'} automation rule: "${wf.name}"`,
        id
      );
    }
  },

  deleteWorkflow(id: string, actorEmail: string, role: 'admin' | 'super_admin'): void {
    const workflows = IntegrationRegistry.getAutomations();
    const wf = workflows.find(w => w.id === id);
    if (wf) {
      const updated = workflows.filter(w => w.id !== id);
      IntegrationRegistry.saveAutomations(updated);

      IntegrationRegistry.logAction(
        actorEmail,
        role,
        'connector_changed',
        `Deleted automation rule: "${wf.name}"`,
        id
      );
    }
  },

  // Evaluate and execute triggered rules based on events
  executeTriggeredWorkflows(triggerEvent: string, eventContext: Record<string, any>): void {
    const workflows = IntegrationRegistry.getAutomations();
    const activeWorkflows = workflows.filter(w => w.trigger === triggerEvent && w.active);

    if (activeWorkflows.length === 0) return;

    activeWorkflows.forEach(wf => {
      // Evaluate basic condition simulators
      let conditionMet = true;
      if (wf.condition.includes('score')) {
        const scoreVal = eventContext.score || 0;
        if (wf.condition === 'score >= 80' && scoreVal < 80) conditionMet = false;
        if (wf.condition === 'score >= 90' && scoreVal < 90) conditionMet = false;
      } else if (wf.condition.includes('role')) {
        const roleVal = eventContext.role || '';
        if (wf.condition === 'role == candidate' && roleVal !== 'candidate') conditionMet = false;
      }

      if (conditionMet) {
        wf.executionCount += 1;
        wf.lastExecuted = new Date().toISOString();

        // Log automation execution
        IntegrationRegistry.logAction(
          'system',
          'system',
          'automation_executed',
          `Automated workflow [${wf.name}] successfully executed. Performed: ${wf.action}`,
          wf.id
        );
      }
    });

    IntegrationRegistry.saveAutomations(workflows);
  }
};

// -------------------------------------------------------------
// INTEGRATION CONTROLLER (CENTRAL HUB)
// -------------------------------------------------------------
export const IntegrationController = {
  getDashboardStats(): IntegrationStats {
    const connectors = ConnectorManager.getConnectors();
    const keys = ApiAccessManager.getApiKeys();
    const webhooks = WebhookEngine.getSubscriptions();
    const logs = IntegrationRegistry.getWebhookLogs();

    const connectedSystems = connectors.filter(c => c.status === 'connected').length;
    const healthyIntegrations = connectors.filter(c => c.status === 'connected' && c.errorCount === 0).length + 
      keys.filter(k => k.status === 'active').length + 
      webhooks.filter(w => w.status === 'active' && w.successRate > 90).length;

    const failedSyncs = connectors.reduce((sum, c) => sum + c.errorCount, 0) + 
      logs.filter(l => !l.success).length;

    const apiActivityCount = keys.reduce((sum, k) => sum + k.usageCount, 0) + 
      Math.floor(Math.random() * 5); // Add dynamic ping

    const webhookActivityCount = logs.length + webhooks.reduce((sum, w) => sum + w.attempts, 0);
    const connectorUsagePct = Math.round((connectedSystems / connectors.length) * 100) || 0;

    return {
      connectedSystems,
      healthyIntegrations,
      failedSyncs,
      apiActivityCount,
      webhookActivityCount,
      connectorUsagePct
    };
  },

  // Central hook triggered by core platform events to execute webhooks and automations
  handlePlatformEvent(event: WebhookEvent, context: Record<string, any>): void {
    // 1. Dispatch outbound Webhooks
    WebhookEngine.dispatchWebhookEvent(event, context);

    // 2. Evaluate and fire Automation rules
    AutomationEngine.executeTriggeredWorkflows(event, context);
  }
};
