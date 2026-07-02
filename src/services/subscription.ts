import { 
  PlanModel, 
  Subscription, 
  Invoice, 
  PaymentMethod, 
  Transaction, 
  SubscriptionStatus, 
  EntitlementFeature 
} from '../modules/entitlements';
import { BusinessController } from './business';
import { AccessController } from './admin';

const PLANS_STORAGE_KEY = 'shana_monetization_plans';
const SUBS_STORAGE_KEY = 'shana_monetization_subscriptions';
const INVOICES_STORAGE_KEY = 'shana_monetization_invoices';
const PAYMENTS_STORAGE_KEY = 'shana_monetization_payment_methods';
const TRANSACTIONS_STORAGE_KEY = 'shana_monetization_transactions';

// -------------------------------------------------------------
// PLAN MANAGER
// -------------------------------------------------------------
export const PlanManager = {
  getPlans(): PlanModel[] {
    try {
      const saved = localStorage.getItem(PLANS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[PlanManager] Error parsing plans:', e);
    }

    const defaultPlans: PlanModel[] = [
      {
        planId: 'plan_starter',
        name: 'Starter',
        status: 'active',
        features: ['training_access'],
        limits: {
          interviewsPerMonth: 15,
          storageLimitGB: 5,
          aiRequestLimit: 100,
          teamSizeLimit: 3
        },
        priceMonthlyUSD: 49,
        createdAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString()
      },
      {
        planId: 'plan_standard',
        name: 'Standard',
        status: 'active',
        features: ['training_access', 'voice_access', 'mirror_access', 'admin_access'],
        limits: {
          interviewsPerMonth: 100,
          storageLimitGB: 50,
          aiRequestLimit: 1000,
          teamSizeLimit: 15
        },
        priceMonthlyUSD: 199,
        createdAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString()
      },
      {
        planId: 'plan_premium',
        name: 'Premium',
        status: 'active',
        features: ['training_access', 'voice_access', 'mirror_access', 'admin_access', 'advanced_reporting', 'analytics_export'],
        limits: {
          interviewsPerMonth: 500,
          storageLimitGB: 250,
          aiRequestLimit: 5000,
          teamSizeLimit: 50
        },
        priceMonthlyUSD: 499,
        createdAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString()
      },
      {
        planId: 'plan_enterprise',
        name: 'Enterprise',
        status: 'active',
        features: ['training_access', 'voice_access', 'mirror_access', 'admin_access', 'advanced_reporting', 'analytics_export', 'custom_branding'],
        limits: {
          interviewsPerMonth: 10000,
          storageLimitGB: 2000,
          aiRequestLimit: 100000,
          teamSizeLimit: 500
        },
        priceMonthlyUSD: 1499,
        createdAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString()
      }
    ];

    this.savePlans(defaultPlans);
    return defaultPlans;
  },

  savePlans(plans: PlanModel[]): void {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  },

  updatePlan(planId: string, updates: Partial<PlanModel>, actorEmail: string): PlanModel | null {
    const plans = this.getPlans();
    const idx = plans.findIndex(p => p.planId === planId);
    if (idx === -1) return null;

    plans[idx] = {
      ...plans[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.savePlans(plans);

    // Audit logs
    BusinessController.logAudit(
      actorEmail,
      'super_admin',
      'plan_update',
      `Modified capabilities/pricing for plan [${plans[idx].name}].`,
      planId
    );

    AccessController.logAction(
      'ADMIN_ACTION',
      `[Monetization] Subscription Plan Model '${plans[idx].name}' updated.`,
      { id: 'usr_admin', email: actorEmail, role: 'super_admin' },
      undefined,
      `Plan ID: ${planId}`
    );

    return plans[idx];
  },

  createPlan(name: string, priceMonthlyUSD: number, features: EntitlementFeature[], limits: PlanModel['limits'], actorEmail: string): PlanModel {
    const plans = this.getPlans();
    const planId = 'plan_' + Math.random().toString(36).substring(2, 9);
    const newPlan: PlanModel = {
      planId,
      name,
      status: 'active',
      features,
      limits,
      priceMonthlyUSD,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    plans.push(newPlan);
    this.savePlans(plans);

    // Audit logs
    BusinessController.logAudit(
      actorEmail,
      'super_admin',
      'plan_update',
      `Published new pricing tier [${name}] priced at $${priceMonthlyUSD}/month.`,
      planId
    );

    return newPlan;
  }
};

// -------------------------------------------------------------
// SUBSCRIPTION CONTROLLER
// -------------------------------------------------------------
export const SubscriptionController = {
  getSubscriptions(): Subscription[] {
    try {
      const saved = localStorage.getItem(SUBS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[SubscriptionController] Error parsing subscriptions:', e);
    }

    const seeded: Subscription[] = [
      {
        id: 'sub_sorbonne',
        orgId: 'org_sorbonne',
        orgName: 'Sorbonne Tech Lab',
        planId: 'plan_standard',
        planName: 'Standard',
        status: 'active',
        startedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        cancelAtPeriodEnd: false
      },
      {
        id: 'sub_loreal',
        orgId: 'org_loreal',
        orgName: 'L\'Oréal Innovation Paris',
        planId: 'plan_premium',
        planName: 'Premium',
        status: 'active',
        startedAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        paymentMethodId: 'pm_loreal_1'
      },
      {
        id: 'sub_renault',
        orgId: 'org_renault',
        orgName: 'Renault Digital',
        planId: 'plan_starter',
        planName: 'Starter',
        status: 'trial',
        startedAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        trialStartedAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
        trialEndsAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        cancelAtPeriodEnd: true
      },
      {
        id: 'sub_google',
        orgId: 'org_google_fr',
        orgName: 'Google Cloud France',
        planId: 'plan_enterprise',
        planName: 'Enterprise',
        status: 'active',
        startedAt: new Date(Date.now() - 150 * 24 * 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString(),
        cancelAtPeriodEnd: false
      }
    ];

    this.saveSubscriptions(seeded);
    return seeded;
  },

  saveSubscriptions(subs: Subscription[]): void {
    localStorage.setItem(SUBS_STORAGE_KEY, JSON.stringify(subs));
  },

  assignSubscription(orgId: string, orgName: string, planId: string, status: SubscriptionStatus, actorEmail: string, isTrial = false): Subscription {
    const subs = this.getSubscriptions();
    const plans = PlanManager.getPlans();
    const plan = plans.find(p => p.planId === planId) || plans[0];

    // Cancel old subscription if any
    const existingIdx = subs.findIndex(s => s.orgId === orgId);
    if (existingIdx !== -1) {
      subs[existingIdx].status = 'cancelled';
    }

    const durationDays = isTrial ? 30 : 365;
    const now = new Date();
    const ends = new Date();
    ends.setDate(now.getDate() + durationDays);

    const subId = 'sub_' + Math.random().toString(36).substring(2, 9);
    const newSub: Subscription = {
      id: subId,
      orgId,
      orgName,
      planId,
      planName: plan.name,
      status: isTrial ? 'trial' : status,
      startedAt: now.toISOString(),
      endsAt: ends.toISOString(),
      trialStartedAt: isTrial ? now.toISOString() : undefined,
      trialEndsAt: isTrial ? ends.toISOString() : undefined,
      cancelAtPeriodEnd: false
    };

    subs.push(newSub);
    this.saveSubscriptions(subs);

    // Seed Invoice
    BillingOrchestrator.generateInvoice(newSub, plan.priceMonthlyUSD, actorEmail);

    BusinessController.logAudit(
      actorEmail,
      'super_admin',
      'plan_update',
      `Assigned ${plan.name} plan subscription to ${orgName} (Status: ${newSub.status}).`,
      orgId
    );

    return newSub;
  },

  overrideSubscription(subId: string, updates: Partial<Subscription>, actorEmail: string): Subscription | null {
    const subs = this.getSubscriptions();
    const idx = subs.findIndex(s => s.id === subId);
    if (idx === -1) return null;

    subs[idx] = {
      ...subs[idx],
      ...updates
    };
    this.saveSubscriptions(subs);

    BusinessController.logAudit(
      actorEmail,
      'super_admin',
      'plan_update',
      `Overrode subscription settings for [${subs[idx].orgName}]. Status set to ${subs[idx].status}.`,
      subs[idx].orgId
    );

    return subs[idx];
  }
};

// -------------------------------------------------------------
// ENTITLEMENT ENGINE
// -------------------------------------------------------------
export const EntitlementEngine = {
  getEntitlementsForOrg(orgId: string): { features: EntitlementFeature[]; limits: PlanModel['limits']; activePlanName: string; status: SubscriptionStatus } {
    const subs = SubscriptionController.getSubscriptions();
    const activeSub = subs.find(s => s.orgId === orgId && (s.status === 'active' || s.status === 'trial'));
    const plans = PlanManager.getPlans();

    if (!activeSub) {
      // Fallback to Starter plan defaults with expired or inactive status
      const starterPlan = plans.find(p => p.planId === 'plan_starter') || plans[0];
      return {
        features: starterPlan.features,
        limits: starterPlan.limits,
        activePlanName: 'None / Starter Fallback',
        status: 'expired'
      };
    }

    const plan = plans.find(p => p.planId === activeSub.planId) || plans[0];
    return {
      features: plan.features,
      limits: plan.limits,
      activePlanName: plan.name,
      status: activeSub.status
    };
  },

  checkFeatureAccess(orgId: string, feature: EntitlementFeature): boolean {
    const entitlements = this.getEntitlementsForOrg(orgId);
    if (entitlements.status === 'expired') {
      return false; // Subscription expired
    }
    return entitlements.features.includes(feature);
  }
};

// -------------------------------------------------------------
// ACCESS RESOLVER (GATEKEEPER)
// -------------------------------------------------------------
export const AccessResolver = {
  resolveFeatureAccess(orgId: string, feature: EntitlementFeature, lang: 'FR' | 'EN' = 'FR'): { allowed: boolean; message?: string } {
    const hasAccess = EntitlementEngine.checkFeatureAccess(orgId, feature);
    if (hasAccess) {
      return { allowed: true };
    }

    const entitlements = EntitlementEngine.getEntitlementsForOrg(orgId);
    const planName = entitlements.activePlanName;

    const messages = {
      FR: `Cette fonctionnalité requiert un abonnement supérieur. Votre forfait actuel est : ${planName}. Vos données d'évaluation restent préservées.`,
      EN: `This feature is locked under your current tier: ${planName}. Please upgrade your subscription to unlock this tool. All historical assessment data remains safely preserved.`
    };

    return {
      allowed: false,
      message: lang === 'FR' ? messages.FR : messages.EN
    };
  }
};

// -------------------------------------------------------------
// BILLING ORCHESTRATOR
// -------------------------------------------------------------
export const BillingOrchestrator = {
  getInvoices(): Invoice[] {
    try {
      const saved = localStorage.getItem(INVOICES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[BillingOrchestrator] Error parsing invoices:', e);
    }

    // Default seeded invoices
    const seeded: Invoice[] = [
      {
        id: 'inv_1001',
        subscriptionId: 'sub_loreal',
        orgId: 'org_loreal',
        amountUSD: 499,
        status: 'paid',
        dueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        pdfPlaceholderUrl: '#'
      },
      {
        id: 'inv_1002',
        subscriptionId: 'sub_sorbonne',
        orgId: 'org_sorbonne',
        amountUSD: 199,
        status: 'open',
        dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        pdfPlaceholderUrl: '#'
      }
    ];

    this.saveInvoices(seeded);
    return seeded;
  },

  saveInvoices(invoices: Invoice[]): void {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
  },

  getPaymentMethods(): PaymentMethod[] {
    try {
      const saved = localStorage.getItem(PAYMENTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[BillingOrchestrator] Error parsing payment methods:', e);
    }

    const seeded: PaymentMethod[] = [
      {
        id: 'pm_loreal_1',
        orgId: 'org_loreal',
        type: 'card',
        last4: '4242',
        brand: 'Visa',
        expiryDate: '12/28',
        isDefault: true
      },
      {
        id: 'pm_sorbonne_1',
        orgId: 'org_sorbonne',
        type: 'bank_transfer',
        isDefault: true
      }
    ];

    this.savePaymentMethods(seeded);
    return seeded;
  },

  savePaymentMethods(methods: PaymentMethod[]): void {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(methods));
  },

  getTransactions(): Transaction[] {
    try {
      const saved = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[BillingOrchestrator] Error parsing transactions:', e);
    }

    const seeded: Transaction[] = [
      {
        id: 'tx_101',
        invoiceId: 'inv_1001',
        orgId: 'org_loreal',
        amountUSD: 499,
        status: 'success',
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'tx_102',
        invoiceId: 'inv_1002',
        orgId: 'org_sorbonne',
        amountUSD: 199,
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      }
    ];

    this.saveTransactions(seeded);
    return seeded;
  },

  saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  },

  generateInvoice(sub: Subscription, amount: number, actorEmail: string): Invoice {
    const invoices = this.getInvoices();
    const invId = 'inv_' + Math.random().toString(36).substring(2, 9);
    
    const now = new Date();
    const due = new Date();
    due.setDate(now.getDate() + 30);

    const newInv: Invoice = {
      id: invId,
      subscriptionId: sub.id,
      orgId: sub.orgId,
      amountUSD: amount,
      status: 'open',
      dueDate: due.toISOString(),
      createdAt: now.toISOString(),
      pdfPlaceholderUrl: '#'
    };

    invoices.unshift(newInv);
    this.saveInvoices(invoices);

    // Log transaction
    this.logTransaction(newInv.id, sub.orgId, amount, 'success');

    return newInv;
  },

  logTransaction(invoiceId: string, orgId: string, amount: number, status: Transaction['status']): Transaction {
    const transactions = this.getTransactions();
    const txId = 'tx_' + Math.random().toString(36).substring(2, 9);
    const newTx: Transaction = {
      id: txId,
      invoiceId,
      orgId,
      amountUSD: amount,
      status,
      createdAt: new Date().toISOString()
    };
    transactions.unshift(newTx);
    this.saveTransactions(transactions);
    return newTx;
  },

  updatePaymentMethod(orgId: string, type: PaymentMethod['type'], last4?: string, brand?: string, expiryDate?: string): PaymentMethod {
    const methods = this.getPaymentMethods();
    const pmId = 'pm_' + Math.random().toString(36).substring(2, 9);
    
    // De-flag existing default
    methods.forEach(m => {
      if (m.orgId === orgId) m.isDefault = false;
    });

    const newPm: PaymentMethod = {
      id: pmId,
      orgId,
      type,
      last4,
      brand,
      expiryDate,
      isDefault: true
    };

    methods.push(newPm);
    this.savePaymentMethods(methods);
    return newPm;
  }
};
