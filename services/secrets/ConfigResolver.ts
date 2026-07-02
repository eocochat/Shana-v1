import { KeyVaultService } from '../../modules/key-vault/KeyVaultService';
import OpenAI from 'openai';

export class ConfigResolver {
  /**
   * Returns the resolved active OpenAI API key from the KeyVault,
   * falling back to the process.env.OPENAI_API_KEY environment variable.
   */
  static getOpenAIKey(): string | null {
    const key = KeyVaultService.resolveKey('openai');
    return key || process.env.OPENAI_API_KEY || null;
  }

  /**
   * Resolves the OpenAI client with the correct key.
   */
  static getOpenAIClient(): OpenAI | null {
    const apiKey = this.getOpenAIKey();
    if (!apiKey) {
      console.warn('[ConfigResolver] OpenAI API key is missing. OpenAI features are disabled.');
      return null;
    }
    return new OpenAI({ apiKey });
  }

  /**
   * Returns the resolved active Stripe secret key from the KeyVault,
   * falling back to process.env.STRIPE_SECRET_KEY.
   */
  static getStripeKey(): string | null {
    const key = KeyVaultService.resolveKey('stripe');
    return key || process.env.STRIPE_SECRET_KEY || null;
  }

  /**
   * Return whether a service is active or disabled based on key presence.
   */
  static isServiceEnabled(providerId: string): boolean {
    if (providerId === 'openai') {
      return !!this.getOpenAIKey();
    }
    if (providerId === 'stripe') {
      return !!this.getStripeKey();
    }
    return KeyVaultService.hasActiveKey(providerId);
  }
}
