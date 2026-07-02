import fs from 'fs';
import path from 'path';

export interface ErrorEvent {
  id: string;
  type: 'frontend' | 'backend' | 'api' | 'payment' | 'ai';
  message: string;
  frequency: number;
  firstOccurrence: string;
  lastOccurrence: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  stack?: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'observability-storage.json');

export class ErrorTracker {
  private static errors: ErrorEvent[] = [];
  private static isInitialized = false;

  private static init() {
    if (this.isInitialized) return;
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const fileContent = fs.readFileSync(STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.errors = parsed.errors || [];
      } else {
        this.errors = this.getSeedErrors();
        this.save();
      }
    } catch (err) {
      console.error('[ErrorTracker] Initialization failed:', err);
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
      currentData.errors = this.errors;
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(currentData, null, 2), 'utf8');
    } catch (err) {
      console.error('[ErrorTracker] Saving failed:', err);
    }
  }

  public static track(
    type: ErrorEvent['type'],
    message: string,
    impactLevel: ErrorEvent['impactLevel'] = 'medium',
    stack?: string
  ): ErrorEvent {
    this.init();

    // Check for duplicates within the same type and message to increment frequency
    const existing = this.errors.find(e => e.type === type && e.message === message && e.status !== 'resolved');

    if (existing) {
      existing.frequency += 1;
      existing.lastOccurrence = new Date().toISOString();
      if (stack) existing.stack = stack;
      this.save();
      return existing;
    }

    const newError: ErrorEvent = {
      id: 'err_' + Math.random().toString(36).substring(2, 11),
      type,
      message,
      frequency: 1,
      firstOccurrence: new Date().toISOString(),
      lastOccurrence: new Date().toISOString(),
      impactLevel,
      status: 'open',
      stack
    };

    this.errors.unshift(newError);
    this.save();
    return newError;
  }

  public static getErrors(): ErrorEvent[] {
    this.init();
    return [...this.errors];
  }

  public static updateStatus(id: string, status: ErrorEvent['status'], impactLevel?: ErrorEvent['impactLevel']): ErrorEvent | null {
    this.init();
    const err = this.errors.find(e => e.id === id);
    if (!err) return null;

    err.status = status;
    if (impactLevel) {
      err.impactLevel = impactLevel;
    }
    this.save();
    return err;
  }

  public static deleteError(id: string): boolean {
    this.init();
    const index = this.errors.findIndex(e => e.id === id);
    if (index === -1) return false;

    this.errors.splice(index, 1);
    this.save();
    return true;
  }

  public static clearAll(): void {
    this.init();
    this.errors = [];
    this.save();
  }

  private static getSeedErrors(): ErrorEvent[] {
    const now = new Date();
    return [
      {
        id: 'err_seed_1',
        type: 'ai',
        message: 'OpenAI API rate limit exceeded (429 Too Many Requests). Transitioned to backup client.',
        frequency: 12,
        firstOccurrence: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
        lastOccurrence: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        impactLevel: 'high',
        status: 'open',
        stack: 'Error: Rate limit exceeded\n    at OpenAIClient.createCompletion (node_modules/openai/index.js:42:15)\n    at Object.generateResponse (server.ts:805:22)'
      },
      {
        id: 'err_seed_2',
        type: 'payment',
        message: 'Stripe Webhook signature verification failed. Possible network transmission drift.',
        frequency: 2,
        firstOccurrence: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
        lastOccurrence: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
        impactLevel: 'medium',
        status: 'investigating',
        stack: 'Error: No signatures found matching the expected signature for payload\n    at Stripe.webhooks.constructEvent (node_modules/stripe/lib/Webhooks.js:51:15)'
      },
      {
        id: 'err_seed_3',
        type: 'api',
        message: 'Failed to dispatch notification email: Connection timeout with SMTP gateway.',
        frequency: 5,
        firstOccurrence: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
        lastOccurrence: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
        impactLevel: 'medium',
        status: 'open',
        stack: 'Error: connect ETIMEDOUT 192.168.1.100:587\n    at TCPConnectWrap.afterConnect (node:net:1157:16)'
      },
      {
        id: 'err_seed_4',
        type: 'backend',
        message: 'User synchronization error: Database primary index collision during candidate onboarding.',
        frequency: 1,
        firstOccurrence: new Date(now.getTime() - 8 * 3600 * 1000).toISOString(),
        lastOccurrence: new Date(now.getTime() - 8 * 3600 * 1000).toISOString(),
        impactLevel: 'low',
        status: 'resolved'
      },
      {
        id: 'err_seed_5',
        type: 'frontend',
        message: 'TypeError: Cannot read properties of undefined (reading \'audioAnalysis\')',
        frequency: 24,
        firstOccurrence: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
        lastOccurrence: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
        impactLevel: 'high',
        status: 'open',
        stack: 'TypeError: Cannot read properties of undefined (reading \'audioAnalysis\')\n    at PerformanceRadar (src/components/PerformanceRadar.tsx:42:15)\n    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:15486:18)'
      }
    ];
  }
}
