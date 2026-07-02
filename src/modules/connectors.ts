// Connectors & Integrations types for SHANA Integration Layer (Phase 10)

export type ConnectorState = 'draft' | 'connected' | 'disabled' | 'error';

export type ConnectorCategory = 
  | 'ATS'
  | 'calendar'
  | 'CRM'
  | 'storage'
  | 'productivity'
  | 'identity'
  | 'communication';

export interface Connector {
  connectorId: string;
  name: string;
  status: ConnectorState;
  category: ConnectorCategory;
  createdAt: string;
  lastSync: string;
  config: Record<string, string>;
  syncCount: number;
  errorCount: number;
}

export interface ApiKey {
  apiKeyId: string;
  name: string;
  secretMasked: string;
  secretRaw?: string; // Only shown once during creation
  environment: 'production' | 'sandbox';
  permissions: 'read' | 'write' | 'admin';
  createdAt: string;
  lastUsed: string;
  status: 'active' | 'revoked';
  usageCount: number;
}

export type WebhookEvent =
  | 'interview.started'
  | 'interview.completed'
  | 'subscription.updated'
  | 'workspace.created'
  | 'user.updated';

export interface WebhookSubscription {
  id: string;
  event: WebhookEvent;
  destination: string;
  status: 'active' | 'paused';
  createdAt: string;
  secretToken: string;
  attempts: number;
  successRate: number;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  destination: string;
  timestamp: string;
  payload: string;
  responseStatus: number;
  responseBody: string;
  attempts: number;
  success: boolean;
}

export interface MarketplaceExtension {
  id: string;
  integration: string;
  category: ConnectorCategory;
  status: 'installed' | 'available' | 'disabled';
  version: string;
  description: string;
  author: string;
  logoUrl?: string;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  active: boolean;
  createdAt: string;
  lastExecuted: string;
  executionCount: number;
}

export interface IntegrationAuditLog {
  id: string;
  actor: string;
  role: 'admin' | 'super_admin' | 'system';
  actionType: 'integration_created' | 'connector_changed' | 'api_generated' | 'webhook_executed' | 'automation_executed' | 'marketplace_installed';
  description: string;
  timestamp: string;
  targetId?: string;
}

export interface IntegrationStats {
  connectedSystems: number;
  healthyIntegrations: number;
  failedSyncs: number;
  apiActivityCount: number;
  webhookActivityCount: number;
  connectorUsagePct: number;
}
