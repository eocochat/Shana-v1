import { IntegrationKeyManager } from './IntegrationKeyManager';
import { SecretEncryptionService } from '../../services/secrets/SecretEncryptionService';

export class KeyVaultService {
  /**
   * Resolves the active decrypted key for a given provider and environment.
   */
  static resolveKey(providerId: string, environment: 'development' | 'production' = 'production'): string | null {
    const keys = IntegrationKeyManager.getRawKeysInternal();
    const activeKey = keys.find(
      k => k.providerId === providerId && 
      k.environment === environment && 
      k.status === 'active' && 
      !k.isDeleted
    );

    if (!activeKey) {
      IntegrationKeyManager.logAccess(providerId, false, `No active key for provider ${providerId} in environment ${environment}`);
      return null;
    }

    try {
      const decrypted = SecretEncryptionService.decrypt(activeKey.encryptedValue);
      if (!decrypted) {
        IntegrationKeyManager.logAccess(providerId, false, `Decrypted string was empty or invalid`);
        return null;
      }
      IntegrationKeyManager.logAccess(providerId, true);
      return decrypted;
    } catch (err: any) {
      IntegrationKeyManager.logAccess(providerId, false, `Decryption error: ${err.message}`);
      return null;
    }
  }

  /**
   * Safe check to verify if an active key exists.
   */
  static hasActiveKey(providerId: string, environment: 'development' | 'production' = 'production'): boolean {
    const keys = IntegrationKeyManager.getRawKeysInternal();
    return keys.some(
      k => k.providerId === providerId && 
      k.environment === environment && 
      k.status === 'active' && 
      !k.isDeleted
    );
  }
}
