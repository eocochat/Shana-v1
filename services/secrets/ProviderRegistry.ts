export interface ProviderMetadata {
  id: string;
  name: string;
  category: 'payment' | 'ai' | 'email' | 'analytics' | 'sms' | 'other';
  description: string;
  keyPlaceholder: string;
}

export const SUPPORTED_PROVIDERS: ProviderMetadata[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payment',
    description: 'Payment integration for processing subscription up-grades and oral feedback sessions.',
    keyPlaceholder: 'sk_live_...'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'ai',
    description: 'AI model service provider used for secondary analysis, advanced review, and speech synthesis.',
    keyPlaceholder: 'sk-proj-...'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    category: 'ai',
    description: 'Next-generation AI provider for conversational interviews (future integration).',
    keyPlaceholder: 'sk-ant-...'
  },
  {
    id: 'sendgrid',
    name: 'SendGrid Email',
    category: 'email',
    description: 'SMTP or direct API provider for dispatching progress reports and alerts.',
    keyPlaceholder: 'SG._...'
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel Analytics',
    category: 'analytics',
    description: 'Product-level tracking for engagement metrics and funnel analysis.',
    keyPlaceholder: 'mixpanel_token_...'
  },
  {
    id: 'twilio',
    name: 'Twilio SMS',
    category: 'sms',
    description: 'Optional verification code delivery via SMS (future integration).',
    keyPlaceholder: 'AC_...'
  }
];

export class ProviderRegistry {
  static getProviders(): ProviderMetadata[] {
    return SUPPORTED_PROVIDERS;
  }

  static getProvider(id: string): ProviderMetadata | undefined {
    return SUPPORTED_PROVIDERS.find(p => p.id === id);
  }
}
