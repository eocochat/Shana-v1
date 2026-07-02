import { 
  SubscriptionState, 
  SubscriptionBillingConfig, 
  CommerceInvoice, 
  CommerceTransaction, 
  OrganizationBillingProfile, 
  CommerceWallet, 
  WalletAdjustment, 
  PaymentProviderAdapter, 
  PaymentProviderType,
  InvoiceStatus
} from '../modules/commerce';
import { BusinessController } from './business';
import { AccessController } from './admin';

const COMMERCE_SUBS_KEY = 'shana_commerce_subscriptions';
const COMMERCE_INVOICES_KEY = 'shana_commerce_invoices';
const COMMERCE_TRANSACTIONS_KEY = 'shana_commerce_transactions';
const COMMERCE_PROFILES_KEY = 'shana_commerce_billing_profiles';
const COMMERCE_WALLETS_KEY = 'shana_commerce_wallets';
const COMMERCE_PROVIDERS_KEY = 'shana_commerce_providers';

// -------------------------------------------------------------
// PAYMENT CONTROLLER (Adapters Configuration)
// -------------------------------------------------------------
export const PaymentController = {
  getProviders(): PaymentProviderAdapter[] {
    try {
      const saved = localStorage.getItem(COMMERCE_PROVIDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[PaymentController] Error reading providers:', e);
    }

    const defaults: PaymentProviderAdapter[] = [
      {
        id: 'card',
        name: 'Credit & Debit Card',
        enabled: true,
        isReady: true,
        descriptionFR: 'Paiements sécurisés par Visa, Mastercard et Amex.',
        descriptionEN: 'Secure global cards processing via mock sandbox gate.'
      },
      {
        id: 'mobile_payment',
        name: 'Mobile Payments',
        enabled: true,
        isReady: true,
        descriptionFR: 'Apple Pay et Google Pay intégrés de manière transparente.',
        descriptionEN: 'Seamless virtual Apple Pay & Google Pay checkout.'
      },
      {
        id: 'invoice',
        name: 'Corporate Invoicing (Net 30)',
        enabled: true,
        isReady: true,
        descriptionFR: 'Facturation différée pour les grands comptes et universités.',
        descriptionEN: 'Deferred commercial billing with standard PO support.'
      },
      {
        id: 'wallet',
        name: 'Simulated Credits Wallet',
        enabled: true,
        isReady: true,
        descriptionFR: 'Utilisez vos crédits prépayés et subventions système.',
        descriptionEN: 'Deduct from corporate credit allocations and grants.'
      }
    ];

    this.saveProviders(defaults);
    return defaults;
  },

  saveProviders(providers: PaymentProviderAdapter[]): void {
    localStorage.setItem(COMMERCE_PROVIDERS_KEY, JSON.stringify(providers));
  },

  toggleProvider(providerId: PaymentProviderType, enabled: boolean, actorEmail: string): PaymentProviderAdapter[] {
    const list = this.getProviders();
    const item = list.find(p => p.id === providerId);
    if (item) {
      item.enabled = enabled;
      this.saveProviders(list);

      BusinessController.logAudit(
        actorEmail,
        'super_admin',
        'access_change',
        `Toggled payment adapter [${item.name}] state to ${enabled ? 'ENABLED' : 'DISABLED'}.`
      );

      AccessController.logAction(
        'ADMIN_ACTION',
        `[Commerce] Payment Adapter '${item.name}' toggled.`,
        { id: 'usr_admin', email: actorEmail, role: 'super_admin' },
        undefined,
        `Enabled: ${enabled}`
      );
    }
    return list;
  }
};

// -------------------------------------------------------------
// TRANSACTION MANAGER
// -------------------------------------------------------------
export const TransactionManager = {
  getTransactions(): CommerceTransaction[] {
    try {
      const saved = localStorage.getItem(COMMERCE_TRANSACTIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[TransactionManager] Error reading transactions:', e);
    }

    const defaults: CommerceTransaction[] = [
      {
        transactionId: 'ctx_901',
        source: 'card',
        status: 'success',
        amount: 499,
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      },
      {
        transactionId: 'ctx_902',
        source: 'invoice',
        status: 'pending',
        amount: 199,
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      },
      {
        transactionId: 'ctx_903',
        source: 'mobile_payment',
        status: 'failed',
        amount: 49,
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      }
    ];

    this.saveTransactions(defaults);
    return defaults;
  },

  saveTransactions(txs: CommerceTransaction[]): void {
    localStorage.setItem(COMMERCE_TRANSACTIONS_KEY, JSON.stringify(txs));
  },

  logTransaction(source: PaymentProviderType, status: 'success' | 'failed' | 'pending', amount: number): CommerceTransaction {
    const txs = this.getTransactions();
    const newTx: CommerceTransaction = {
      transactionId: 'ctx_' + Math.random().toString(36).substring(2, 9),
      source,
      status,
      amount,
      createdAt: new Date().toISOString()
    };
    txs.unshift(newTx);
    this.saveTransactions(txs);
    return newTx;
  }
};

// -------------------------------------------------------------
// INVOICE MANAGER
// -------------------------------------------------------------
export const InvoiceManager = {
  getInvoices(): CommerceInvoice[] {
    try {
      const saved = localStorage.getItem(COMMERCE_INVOICES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[InvoiceManager] Error reading invoices:', e);
    }

    const defaults: CommerceInvoice[] = [
      {
        invoiceId: 'cinv_2001',
        accountId: 'org_loreal',
        plan: 'Premium',
        status: 'paid',
        currency: 'USD',
        amount: 499,
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      },
      {
        invoiceId: 'cinv_2002',
        accountId: 'org_sorbonne',
        plan: 'Standard',
        status: 'issued',
        currency: 'USD',
        amount: 199,
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      },
      {
        invoiceId: 'cinv_2003',
        accountId: 'org_renault',
        plan: 'Starter',
        status: 'failed',
        currency: 'USD',
        amount: 49,
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      }
    ];

    this.saveInvoices(defaults);
    return defaults;
  },

  saveInvoices(invoices: CommerceInvoice[]): void {
    localStorage.setItem(COMMERCE_INVOICES_KEY, JSON.stringify(invoices));
  },

  createInvoice(accountId: string, plan: string, amount: number, status: InvoiceStatus = 'draft'): CommerceInvoice {
    const invoices = this.getInvoices();
    const newInv: CommerceInvoice = {
      invoiceId: 'cinv_' + Math.random().toString(36).substring(2, 9),
      accountId,
      plan,
      status,
      currency: 'USD',
      amount,
      createdAt: new Date().toISOString()
    };
    invoices.unshift(newInv);
    this.saveInvoices(invoices);

    // Track in audit
    BusinessController.logAudit(
      'system',
      'system',
      'org_action',
      `Invoice [${newInv.invoiceId}] generated for ${accountId} in amount of $${amount}.`
    );

    return newInv;
  },

  updateInvoiceStatus(invoiceId: string, status: InvoiceStatus, actorEmail: string): CommerceInvoice | null {
    const invoices = this.getInvoices();
    const item = invoices.find(i => i.invoiceId === invoiceId);
    if (!item) return null;

    item.status = status;
    if (status === 'paid') {
      item.paidAt = new Date().toISOString();
    }
    this.saveInvoices(invoices);

    BusinessController.logAudit(
      actorEmail,
      'admin',
      'org_action',
      `Invoice [${invoiceId}] status modified to ${status}.`
    );

    return item;
  }
};

// -------------------------------------------------------------
// SUBSCRIPTION BILLING (Lifecycle Manager)
// -------------------------------------------------------------
export const SubscriptionBilling = {
  getSubscriptions(): SubscriptionBillingConfig[] {
    try {
      const saved = localStorage.getItem(COMMERCE_SUBS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[SubscriptionBilling] Error reading subscription billing config:', e);
    }

    const defaults: SubscriptionBillingConfig[] = [
      {
        id: 'csub_sorbonne',
        orgId: 'org_sorbonne',
        orgName: 'Sorbonne Tech Lab',
        planName: 'Standard',
        status: 'active',
        startedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
        cancelAtPeriodEnd: false
      },
      {
        id: 'csub_loreal',
        orgId: 'org_loreal',
        orgName: 'L\'Oréal Innovation Paris',
        planName: 'Premium',
        status: 'active',
        startedAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
        cancelAtPeriodEnd: false
      },
      {
        id: 'csub_renault',
        orgId: 'org_renault',
        orgName: 'Renault Digital',
        planName: 'Starter',
        status: 'grace_period',
        startedAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), // expired 10 days ago
        gracePeriodEndsAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(), // still inside grace period
        cancelAtPeriodEnd: true
      },
      {
        id: 'csub_google',
        orgId: 'org_google_fr',
        orgName: 'Google Cloud France',
        planName: 'Enterprise',
        status: 'active',
        startedAt: new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 265 * 24 * 3600 * 1000).toISOString(),
        cancelAtPeriodEnd: false
      }
    ];

    this.saveSubscriptions(defaults);
    return defaults;
  },

  saveSubscriptions(subs: SubscriptionBillingConfig[]): void {
    localStorage.setItem(COMMERCE_SUBS_KEY, JSON.stringify(subs));
  },

  createSubscription(orgId: string, orgName: string, planName: string, status: SubscriptionState, isTrial = false): SubscriptionBillingConfig {
    const subs = this.getSubscriptions();
    
    // Deactivate previous active/grace configs for this tenant
    subs.forEach(s => {
      if (s.orgId === orgId && s.status !== 'cancelled') {
        s.status = 'cancelled';
      }
    });

    const now = new Date();
    const ends = new Date();
    ends.setDate(now.getDate() + (isTrial ? 30 : 365));

    const newSub: SubscriptionBillingConfig = {
      id: 'csub_' + Math.random().toString(36).substring(2, 9),
      orgId,
      orgName,
      planName,
      status: isTrial ? 'trial' : status,
      startedAt: now.toISOString(),
      endsAt: ends.toISOString(),
      trialEndsAt: isTrial ? ends.toISOString() : undefined,
      cancelAtPeriodEnd: false
    };

    subs.unshift(newSub);
    this.saveSubscriptions(subs);

    BusinessController.logAudit(
      'system',
      'system',
      'plan_update',
      `Registered commerce subscription [${newSub.id}] for ${orgName} on ${planName} tier.`
    );

    return newSub;
  },

  updateSubscriptionState(id: string, status: SubscriptionState, actorEmail: string): SubscriptionBillingConfig | null {
    const subs = this.getSubscriptions();
    const item = subs.find(s => s.id === id);
    if (!item) return null;

    const oldStatus = item.status;
    item.status = status;
    
    if (status === 'grace_period') {
      const graceEnds = new Date();
      graceEnds.setDate(graceEnds.getDate() + 15); // 15 days grace period
      item.gracePeriodEndsAt = graceEnds.toISOString();
    }
    
    this.saveSubscriptions(subs);

    BusinessController.logAudit(
      actorEmail,
      'admin',
      'plan_update',
      `Subscription [${id}] status changed from ${oldStatus} to ${status}.`
    );

    return item;
  }
};

// -------------------------------------------------------------
// ORGANIZATIONS BILLING PROFILE
// -------------------------------------------------------------
export const OrganizationBilling = {
  getProfiles(): OrganizationBillingProfile[] {
    try {
      const saved = localStorage.getItem(COMMERCE_PROFILES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[OrganizationBilling] Error reading profiles:', e);
    }

    const defaults: OrganizationBillingProfile[] = [
      {
        orgId: 'org_loreal',
        orgName: 'L\'Oréal Innovation Paris',
        ownerEmail: 'innovation-billing@loreal.fr',
        billingContactEmail: 'compta-fournisseurs@loreal.fr',
        seatCount: 45,
        subscriptionPlan: 'Premium',
        usageSummary: {
          interviewsUsed: 124,
          interviewsLimit: 500,
          storageUsedGB: 48,
          storageLimitGB: 250
        }
      },
      {
        orgId: 'org_sorbonne',
        orgName: 'Sorbonne Tech Lab',
        ownerEmail: 'recherche-sciences@sorbonne.fr',
        billingContactEmail: 'facturation-publique@sorbonne.fr',
        seatCount: 12,
        subscriptionPlan: 'Standard',
        usageSummary: {
          interviewsUsed: 89,
          interviewsLimit: 100,
          storageUsedGB: 32,
          storageLimitGB: 50
        }
      },
      {
        orgId: 'org_renault',
        orgName: 'Renault Digital',
        ownerEmail: 'renault-ops@renault.com',
        billingContactEmail: 'renault-compta@renault.com',
        seatCount: 5,
        subscriptionPlan: 'Starter',
        usageSummary: {
          interviewsUsed: 14,
          interviewsLimit: 15,
          storageUsedGB: 4.8,
          storageLimitGB: 5
        }
      }
    ];

    this.saveProfiles(defaults);
    return defaults;
  },

  saveProfiles(profiles: OrganizationBillingProfile[]): void {
    localStorage.setItem(COMMERCE_PROFILES_KEY, JSON.stringify(profiles));
  },

  updateProfile(orgId: string, updates: Partial<OrganizationBillingProfile>, actorEmail: string): OrganizationBillingProfile | null {
    const list = this.getProfiles();
    const idx = list.findIndex(p => p.orgId === orgId);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...updates
    };
    this.saveProfiles(list);

    BusinessController.logAudit(
      actorEmail,
      'admin',
      'org_action',
      `Modified billing contacts/seat structure for [${list[idx].orgName}].`
    );

    return list[idx];
  }
};

// -------------------------------------------------------------
// WALLET ORCHESTRATOR
// -------------------------------------------------------------
export const WalletOrchestrator = {
  getWallets(): CommerceWallet[] {
    try {
      const saved = localStorage.getItem(COMMERCE_WALLETS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[WalletOrchestrator] Error reading wallets:', e);
    }

    const defaults: CommerceWallet[] = [
      {
        walletId: 'wal_loreal',
        orgId: 'org_loreal',
        balance: 1500, // $1500 equivalent credits
        credits: 1500,
        adjustments: [
          {
            id: 'adj_1',
            amount: 1500,
            reason: 'System initial sign-on credit allowance',
            timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
          }
        ]
      },
      {
        walletId: 'wal_sorbonne',
        orgId: 'org_sorbonne',
        balance: 500,
        credits: 500,
        adjustments: [
          {
            id: 'adj_2',
            amount: 500,
            reason: 'Sorbonne research partnership grant',
            timestamp: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
          }
        ]
      },
      {
        walletId: 'wal_renault',
        orgId: 'org_renault',
        balance: 0,
        credits: 0,
        adjustments: []
      }
    ];

    this.saveWallets(defaults);
    return defaults;
  },

  saveWallets(wallets: CommerceWallet[]): void {
    localStorage.setItem(COMMERCE_WALLETS_KEY, JSON.stringify(wallets));
  },

  adjustWalletBalance(orgId: string, amount: number, reason: string, actorEmail: string): CommerceWallet | null {
    const list = this.getWallets();
    const wallet = list.find(w => w.orgId === orgId);
    if (!wallet) return null;

    const newAdjustment: WalletAdjustment = {
      id: 'adj_' + Math.random().toString(36).substring(2, 9),
      amount,
      reason,
      timestamp: new Date().toISOString()
    };

    wallet.balance += amount;
    wallet.credits += amount;
    wallet.adjustments.unshift(newAdjustment);
    this.saveWallets(list);

    BusinessController.logAudit(
      actorEmail,
      'super_admin',
      'access_change',
      `Adjusted [${orgId}] credits by ${amount > 0 ? '+' : ''}${amount}. Reason: ${reason}`
    );

    return wallet;
  }
};

// -------------------------------------------------------------
// CHECKOUT MANAGER (Virtual mock flows)
// -------------------------------------------------------------
export const CheckoutManager = {
  processMockPayment(orgId: string, amount: number, source: PaymentProviderType, actorEmail: string): { success: boolean; transactionId?: string; message: string } {
    // 1. Check if payment provider is enabled
    const providers = PaymentController.getProviders();
    const prov = providers.find(p => p.id === source);
    if (!prov || !prov.enabled) {
      return {
        success: false,
        message: `Payment method ${source} is disabled or unavailable.`
      };
    }

    // 2. Wallet payment logic
    if (source === 'wallet') {
      const wallets = WalletOrchestrator.getWallets();
      const wallet = wallets.find(w => w.orgId === orgId);
      if (!wallet || wallet.balance < amount) {
        TransactionManager.logTransaction('wallet', 'failed', amount);
        return {
          success: false,
          message: 'Insufficient virtual credits wallet balance.'
        };
      }
      
      // Deduct
      WalletOrchestrator.adjustWalletBalance(orgId, -amount, `Virtual debit checkout subscription payment`, actorEmail);
      const tx = TransactionManager.logTransaction('wallet', 'success', amount);
      return {
        success: true,
        transactionId: tx.transactionId,
        message: 'Subscription paid successfully using system credits.'
      };
    }

    // 3. Card / Mobile / Invoice payment logic
    const isSuccess = Math.random() > 0.15; // 85% success rate for simulation realism
    const txStatus = isSuccess ? 'success' : 'failed';
    const tx = TransactionManager.logTransaction(source, txStatus, amount);

    if (isSuccess) {
      return {
        success: true,
        transactionId: tx.transactionId,
        message: `Successfully processed mock checkout of $${amount} via ${source}.`
      };
    } else {
      return {
        success: false,
        message: `Mock transaction declined by sandbox banking processor via ${source}.`
      };
    }
  }
};
