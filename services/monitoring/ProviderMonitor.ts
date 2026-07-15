import fs from 'fs';
import path from 'path';

export interface StripeEvent {
  id: string;
  timestamp: string;
  type: 'checkout_session_created' | 'payment_intent_succeeded' | 'payment_intent_failed' | 'customer_subscription_created' | 'webhook_received' | 'webhook_failed';
  amount?: number;
  currency?: string;
  status: 'succeeded' | 'failed' | 'pending';
  metadata: {
    userId?: string;
    productName?: string;
    gatewayId?: string;
    deliveryTimeMs?: number;
    failureReason?: string;
  };
}

export interface OpenAIEvent {
  id: string;
  timestamp: string;
  model: string;
  endpoint: string;
  tokensEstimated: number;
  durationMs: number;
  success: boolean;
  costEstimated: number;
  metadata: {
    feature?: string;
    responseLength?: number;
    failureReason?: string;
    promptTokens?: number;
    completionTokens?: number;
    retryCount?: number;
    fallbackUsage?: boolean;
    fallbackModel?: string;
    traceId?: string;
  };
}

const STORAGE_FILE = path.join(process.cwd(), 'observability-storage.json');

export class ProviderMonitor {
  private static stripeEvents: StripeEvent[] = [];
  private static openaiEvents: OpenAIEvent[] = [];
  private static isInitialized = false;

  private static init() {
    if (this.isInitialized) return;
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const fileContent = fs.readFileSync(STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.stripeEvents = parsed.stripeEvents || [];
        this.openaiEvents = parsed.openaiEvents || [];
      } else {
        this.stripeEvents = this.getSeedStripeEvents();
        this.openaiEvents = this.getSeedOpenAIEvents();
        this.save();
      }
    } catch (err) {
      console.error('[ProviderMonitor] Initialization failed:', err);
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
      currentData.stripeEvents = this.stripeEvents;
      currentData.openaiEvents = this.openaiEvents;
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(currentData, null, 2), 'utf8');
    } catch (err) {
      console.error('[ProviderMonitor] Saving failed:', err);
    }
  }

  // --- STRIPE PAYMENTS MONITORING ---
  public static trackStripeEvent(
    type: StripeEvent['type'],
    status: StripeEvent['status'],
    amount?: number,
    metadata?: StripeEvent['metadata']
  ): StripeEvent {
    this.init();

    const newEvent: StripeEvent = {
      id: 'stripe_evt_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      type,
      amount,
      currency: amount ? 'USD' : undefined,
      status,
      metadata: metadata || {}
    };

    this.stripeEvents.unshift(newEvent);

    // Limit array size
    if (this.stripeEvents.length > 1000) {
      this.stripeEvents = this.stripeEvents.slice(0, 1000);
    }

    this.save();
    return newEvent;
  }

  public static getStripeEvents(): StripeEvent[] {
    this.init();
    return [...this.stripeEvents];
  }

  // --- OPENAI / GEMINI AI MONITORING ---
  public static trackOpenAIEvent(
    endpoint: string,
    model: string,
    tokens: number,
    durationMs: number,
    success: boolean,
    metadata?: OpenAIEvent['metadata']
  ): OpenAIEvent {
    this.init();

    // Cost calculation based on specific models
    let blendedRate = 0.000002; // default
    const mLower = model.toLowerCase();
    if (mLower.includes('gpt-5.5-mini')) {
      blendedRate = 0.0000003; // $0.30 per 1M tokens for GPT-5.5 mini
    } else if (mLower.includes('gpt-5.5')) {
      blendedRate = 0.000005; // $5.00 per 1M tokens for GPT-5.5 standard
    } else if (mLower.includes('gpt-4o-mini') || mLower.includes('gemini-3.5-flash') || mLower.includes('gemini-3.1-flash-lite')) {
      blendedRate = 0.0000002; // $0.20 per 1M tokens
    } else if (mLower.includes('gpt-4o') || mLower.includes('gemini-1.5-pro')) {
      blendedRate = 0.000005; // $5.00 per 1M tokens
    } else if (mLower.includes('tts') || mLower.includes('whisper')) {
      blendedRate = 0.000015; // audio model pricing proxy
    }

    const costEstimated = tokens * blendedRate;

    const newEvent: OpenAIEvent = {
      id: 'openai_evt_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      model,
      endpoint,
      tokensEstimated: tokens,
      durationMs,
      success,
      costEstimated: parseFloat(costEstimated.toFixed(6)),
      metadata: metadata || {}
    };

    this.openaiEvents.unshift(newEvent);

    // Retention: limit OpenAI metrics to 1000 items
    const RETENTION_LIMIT = 1000;
    if (this.openaiEvents.length > RETENTION_LIMIT) {
      this.openaiEvents = this.openaiEvents.slice(0, RETENTION_LIMIT);
    }

    this.save();
    return newEvent;
  }

  /**
   * Generates daily and monthly usage summaries for the AI monitoring layer
   */
  public static getAISummaries() {
    this.init();
    const events = [...this.openaiEvents];

    const dailyMap = new Map<string, { requests: number, tokens: number, cost: number, latencySum: number, successCount: number }>();
    const monthlyMap = new Map<string, { requests: number, tokens: number, cost: number, latencySum: number, successCount: number }>();

    for (const evt of events) {
      const dateStr = evt.timestamp.substring(0, 10); // YYYY-MM-DD
      const monthStr = evt.timestamp.substring(0, 7); // YYYY-MM

      // Daily grouping
      const dCurr = dailyMap.get(dateStr) || { requests: 0, tokens: 0, cost: 0, latencySum: 0, successCount: 0 };
      dCurr.requests += 1;
      dCurr.tokens += evt.tokensEstimated;
      dCurr.cost += evt.costEstimated;
      dCurr.latencySum += evt.durationMs;
      if (evt.success) dCurr.successCount += 1;
      dailyMap.set(dateStr, dCurr);

      // Monthly grouping
      const mCurr = monthlyMap.get(monthStr) || { requests: 0, tokens: 0, cost: 0, latencySum: 0, successCount: 0 };
      mCurr.requests += 1;
      mCurr.tokens += evt.tokensEstimated;
      mCurr.cost += evt.costEstimated;
      mCurr.latencySum += evt.durationMs;
      if (evt.success) mCurr.successCount += 1;
      monthlyMap.set(monthStr, mCurr);
    }

    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      requests: data.requests,
      totalTokens: data.tokens,
      totalCost: parseFloat(data.cost.toFixed(5)),
      avgLatency: Math.round(data.latencySum / data.requests),
      successRate: parseFloat(((data.successCount / data.requests) * 100).toFixed(1))
    })).sort((a, b) => b.date.localeCompare(a.date));

    const monthly = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      requests: data.requests,
      totalTokens: data.tokens,
      totalCost: parseFloat(data.cost.toFixed(5)),
      avgLatency: Math.round(data.latencySum / data.requests),
      successRate: parseFloat(((data.successCount / data.requests) * 100).toFixed(1))
    })).sort((a, b) => b.month.localeCompare(a.month));

    return { daily, monthly };
  }

  public static getOpenAIEvents(): OpenAIEvent[] {
    this.init();
    return [...this.openaiEvents];
  }

  public static clearAll(): void {
    this.init();
    this.stripeEvents = [];
    this.openaiEvents = [];
    this.save();
  }

  private static getSeedStripeEvents(): StripeEvent[] {
    const now = new Date();
    const mockProducts = ['Starter Kit', 'Elite Coaching Subscription', 'Professional Bundle', 'Resume Diagnostic Plan'];
    const events: StripeEvent[] = [];

    // Create 30 historical payment entries
    for (let i = 0; i < 30; i++) {
      const isSuccess = i % 14 !== 0; // occasional failure
      const productName = mockProducts[i % mockProducts.length];
      const amount = i % 3 === 0 ? 99.00 : (i % 2 === 0 ? 49.00 : 29.00);
      const timeOffset = i * 4 * 3600 * 1000; // staggered by 4 hours
      const timestamp = new Date(now.getTime() - timeOffset).toISOString();

      if (i % 3 === 0) {
        events.push({
          id: `seed_stripe_${i}_1`,
          timestamp,
          type: 'checkout_session_created',
          amount,
          currency: 'USD',
          status: 'pending',
          metadata: { productName, userId: `candidate_${1000 + i}` }
        });
      }

      events.push({
        id: `seed_stripe_${i}_2`,
        timestamp: new Date(new Date(timestamp).getTime() + 120000).toISOString(), // 2 minutes later
        type: isSuccess ? 'payment_intent_succeeded' : 'payment_intent_failed',
        amount,
        currency: 'USD',
        status: isSuccess ? 'succeeded' : 'failed',
        metadata: { 
          productName, 
          userId: `candidate_${1000 + i}`,
          failureReason: isSuccess ? undefined : 'Card declined - Insufficient funds',
          gatewayId: `ch_stripe_${Math.random().toString(36).substring(2, 10)}`
        }
      });

      if (isSuccess && i % 4 === 0) {
        events.push({
          id: `seed_stripe_${i}_3`,
          timestamp: new Date(new Date(timestamp).getTime() + 180000).toISOString(),
          type: 'customer_subscription_created',
          amount,
          currency: 'USD',
          status: 'succeeded',
          metadata: { productName, userId: `candidate_${1000 + i}` }
        });
      }

      // Webhook record
      events.push({
        id: `seed_stripe_${i}_4`,
        timestamp: new Date(new Date(timestamp).getTime() + 1000).toISOString(),
        type: isSuccess ? 'webhook_received' : 'webhook_failed',
        status: isSuccess ? 'succeeded' : 'failed',
        metadata: { 
          deliveryTimeMs: 140, 
          failureReason: isSuccess ? undefined : 'Signature verification drift or payload mismatch' 
        }
      });
    }

    return events;
  }

  private static getSeedOpenAIEvents(): OpenAIEvent[] {
    const now = new Date();
    const events: OpenAIEvent[] = [];
    const endpoints = ['/api/interview/speak', '/api/analyze-audio', '/api/train/chat', '/api/analyze'];
    const features = ['text-to-speech', 'speech-to-text', 'chat-feedback', 'profile-matching'];
    const models = ['tts-1', 'gpt-4o-mini', 'gpt-4o'];

    // Create 50 historical AI completions
    for (let i = 0; i < 50; i++) {
      const success = i % 31 !== 0; // occasional rate limits/failures
      const timeOffset = i * 90 * 60 * 1000; // staggered by 90 minutes
      const timestamp = new Date(now.getTime() - timeOffset).toISOString();
      const endpoint = endpoints[i % endpoints.length];
      const feature = features[i % features.length];
      const model = endpoint.includes('speak') ? 'tts-1' : (i % 3 === 0 ? 'gpt-4o' : 'gpt-4o-mini');

      const tokens = endpoint.includes('speak') ? 220 : (model === 'gpt-4o' ? 1200 : 650);
      const durationMs = success ? (model === 'gpt-4o' ? 1200 + (i % 5) * 200 : 350 + (i % 4) * 80) : 150;

      events.push({
        id: `seed_openai_${i}`,
        timestamp,
        model,
        endpoint,
        tokensEstimated: tokens,
        durationMs,
        success,
        costEstimated: parseFloat((tokens * 0.000002).toFixed(6)),
        metadata: {
          feature,
          responseLength: success ? (tokens * 3) : undefined,
          failureReason: success ? undefined : 'OpenAI API Overloaded (503 Service Unavailable)'
        }
      });
    }

    return events;
  }
}
