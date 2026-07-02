import fs from 'fs';
import path from 'path';
import { SecretEncryptionService } from '../../services/secrets/SecretEncryptionService';

export interface VaultKey {
  id: string;
  providerId: string;
  name: string;
  encryptedValue: string;
  status: 'active' | 'paused' | 'expired' | 'revoked' | 'error';
  environment: 'development' | 'production';
  lastUpdated: string;
  isDeleted: boolean;
  version: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'rotate' | 'disable' | 'pause' | 'resume' | 'delete' | 'access';
  keyId: string;
  providerId: string;
  actor: string;
  details?: string;
}

export interface AdminAlert {
  id: string;
  timestamp: string;
  type: 'missing_key' | 'invalid_key' | 'expired_credentials' | 'failure';
  providerId: string;
  message: string;
  resolved: boolean;
}

const STORAGE_FILE = path.join(process.cwd(), 'keys-vault-storage.json');

export class IntegrationKeyManager {
  private static keys: VaultKey[] = [];
  private static auditLogs: AuditLogEntry[] = [];
  private static alerts: AdminAlert[] = [];
  private static isInitialized = false;

  private static init() {
    if (this.isInitialized) return;
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const fileContent = fs.readFileSync(STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.keys = parsed.keys || [];
        this.auditLogs = parsed.auditLogs || [];
        this.alerts = parsed.alerts || [];
      } else {
        // Seed default keys with empty states or read from process.env to bridge gracefully
        this.keys = [];
        this.auditLogs = [];
        this.alerts = [];
        this.save();
      }
    } catch (err) {
      console.error('[IntegrationKeyManager] Initialization failed:', err);
    } finally {
      this.isInitialized = true;
      this.ensureAlerts();
    }
  }

  private static save() {
    try {
      const data = {
        keys: this.keys,
        auditLogs: this.auditLogs,
        alerts: this.alerts
      };
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[IntegrationKeyManager] Saving failed:', err);
    }
  }

  private static ensureAlerts() {
    // Generate alerts dynamically if core keys are missing or paused
    const stripeKey = this.keys.find(k => k.providerId === 'stripe' && !k.isDeleted);
    const hasStripe = stripeKey && stripeKey.status === 'active';
    
    // Check Stripe key alert
    const stripeAlertIndex = this.alerts.findIndex(a => a.providerId === 'stripe' && a.type === 'missing_key');
    if (!hasStripe) {
      if (stripeAlertIndex === -1) {
        this.alerts.push({
          id: 'alert_' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          type: 'missing_key',
          providerId: 'stripe',
          message: 'Critical: Stripe payment integration key is missing or disabled in the key vault.',
          resolved: false
        });
      }
    } else {
      if (stripeAlertIndex !== -1) {
        this.alerts.splice(stripeAlertIndex, 1);
      }
    }

    // Check OpenAI key alert
    const openAIKey = this.keys.find(k => k.providerId === 'openai' && !k.isDeleted);
    const hasOpenAI = openAIKey && openAIKey.status === 'active';
    const openAIAlertIndex = this.alerts.findIndex(a => a.providerId === 'openai' && a.type === 'invalid_key');
    
    if (!hasOpenAI) {
      if (openAIAlertIndex === -1) {
        this.alerts.push({
          id: 'alert_' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          type: 'invalid_key',
          providerId: 'openai',
          message: 'Warning: OpenAI key is not fully configured, Shana will use Gemini as fallback.',
          resolved: false
        });
      }
    } else {
      if (openAIAlertIndex !== -1) {
        this.alerts.splice(openAIAlertIndex, 1);
      }
    }
  }

  static getRawKeysInternal(): VaultKey[] {
    this.init();
    return this.keys;
  }

  static getKeys(): Omit<VaultKey, 'encryptedValue'>[] {
    this.init();
    return this.keys.map(k => {
      const { encryptedValue, ...rest } = k;
      return rest;
    });
  }

  static getAuditLogs(): AuditLogEntry[] {
    this.init();
    return this.auditLogs;
  }

  static getAlerts(): AdminAlert[] {
    this.init();
    return this.alerts;
  }

  static addKey(providerId: string, name: string, rawValue: string, environment: 'development' | 'production', actor: string): VaultKey {
    this.init();
    const existing = this.keys.find(k => k.providerId === providerId && k.environment === environment && !k.isDeleted);
    if (existing) {
      throw new Error(`A key for provider '${providerId}' in environment '${environment}' already exists. Use rotate or update instead.`);
    }

    const encrypted = SecretEncryptionService.encrypt(rawValue);
    const newKey: VaultKey = {
      id: 'key_' + Math.random().toString(36).substr(2, 9),
      providerId,
      name,
      encryptedValue: encrypted,
      status: 'active',
      environment,
      lastUpdated: new Date().toISOString(),
      isDeleted: false,
      version: 1
    };

    this.keys.push(newKey);
    this.logAudit('create', newKey.id, providerId, actor, `Created key named "${name}"`);
    this.ensureAlerts();
    this.save();
    return newKey;
  }

  static updateKey(keyId: string, name: string, rawValue: string | undefined, environment: 'development' | 'production', actor: string): VaultKey {
    this.init();
    const key = this.keys.find(k => k.id === keyId && !k.isDeleted);
    if (!key) {
      throw new Error(`Key not found or deleted.`);
    }

    key.name = name;
    key.environment = environment;
    if (rawValue) {
      key.encryptedValue = SecretEncryptionService.encrypt(rawValue);
      key.version += 1;
      this.logAudit('update', key.id, key.providerId, actor, `Updated key value and config for "${name}"`);
    } else {
      this.logAudit('update', key.id, key.providerId, actor, `Updated configuration settings for "${name}"`);
    }
    
    key.lastUpdated = new Date().toISOString();
    this.ensureAlerts();
    this.save();
    return key;
  }

  static rotateKey(keyId: string, newRawValue: string, actor: string): VaultKey {
    this.init();
    const key = this.keys.find(k => k.id === keyId && !k.isDeleted);
    if (!key) {
      throw new Error(`Key not found or deleted.`);
    }

    key.encryptedValue = SecretEncryptionService.encrypt(newRawValue);
    key.version += 1;
    key.lastUpdated = new Date().toISOString();
    key.status = 'active'; // Reset status to active upon rotation

    this.logAudit('rotate', key.id, key.providerId, actor, `Rotated secret key to version ${key.version}`);
    this.ensureAlerts();
    this.save();
    return key;
  }

  static pauseKey(keyId: string, actor: string): VaultKey {
    this.init();
    const key = this.keys.find(k => k.id === keyId && !k.isDeleted);
    if (!key) {
      throw new Error(`Key not found.`);
    }

    key.status = 'paused';
    key.lastUpdated = new Date().toISOString();
    this.logAudit('pause', key.id, key.providerId, actor, `Paused key usage`);
    this.ensureAlerts();
    this.save();
    return key;
  }

  static resumeKey(keyId: string, actor: string): VaultKey {
    this.init();
    const key = this.keys.find(k => k.id === keyId && !k.isDeleted);
    if (!key) {
      throw new Error(`Key not found.`);
    }

    key.status = 'active';
    key.lastUpdated = new Date().toISOString();
    this.logAudit('resume', key.id, key.providerId, actor, `Resumed key usage`);
    this.ensureAlerts();
    this.save();
    return key;
  }

  static disableKey(keyId: string, actor: string): VaultKey {
    this.init();
    const key = this.keys.find(k => k.id === keyId && !k.isDeleted);
    if (!key) {
      throw new Error(`Key not found.`);
    }

    key.status = 'revoked';
    key.lastUpdated = new Date().toISOString();
    this.logAudit('disable', key.id, key.providerId, actor, `Disabled/revoked key usage`);
    this.ensureAlerts();
    this.save();
    return key;
  }

  static deleteKey(keyId: string, actor: string): void {
    this.init();
    const key = this.keys.find(k => k.id === keyId && !k.isDeleted);
    if (!key) {
      throw new Error(`Key not found.`);
    }

    key.isDeleted = true;
    key.lastUpdated = new Date().toISOString();
    this.logAudit('delete', key.id, key.providerId, actor, `Soft deleted key`);
    this.ensureAlerts();
    this.save();
  }

  static logAccess(providerId: string, success: boolean, details?: string) {
    // Only logged in memory for access auditing to keep audit storage light
    this.init();
    this.auditLogs.push({
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action: 'access',
      keyId: 'system',
      providerId,
      actor: 'system_runtime',
      details: success ? 'Access successful' : `Access failed: ${details}`
    });
    // Keep logs size bounded
    if (this.auditLogs.length > 200) {
      this.auditLogs.shift();
    }
  }

  private static logAudit(action: AuditLogEntry['action'], keyId: string, providerId: string, actor: string, details?: string) {
    this.auditLogs.push({
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action,
      keyId,
      providerId,
      actor,
      details
    });
  }
}
