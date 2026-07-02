export type SubscriptionState = 'trial' | 'active' | 'grace_period' | 'expired' | 'cancelled';

export interface SubscriptionBillingConfig {
  id: string;
  orgId: string;
  orgName: string;
  planName: string;
  status: SubscriptionState;
  startedAt: string;
  endsAt: string;
  gracePeriodEndsAt?: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd: boolean;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'failed' | 'cancelled';

export interface CommerceInvoice {
  invoiceId: string;
  accountId: string; // matches orgId or account identifier
  plan: string;
  status: InvoiceStatus;
  currency: 'USD' | 'EUR';
  amount: number;
  createdAt: string;
  paidAt?: string;
}

export interface CommerceTransaction {
  transactionId: string;
  source: 'card' | 'mobile_payment' | 'invoice' | 'wallet';
  status: 'success' | 'failed' | 'pending';
  amount: number;
  createdAt: string;
}

export interface OrganizationBillingProfile {
  orgId: string;
  orgName: string;
  ownerEmail: string;
  billingContactEmail: string;
  seatCount: number;
  subscriptionPlan: string;
  usageSummary: {
    interviewsUsed: number;
    interviewsLimit: number;
    storageUsedGB: number;
    storageLimitGB: number;
  };
}

export interface WalletAdjustment {
  id: string;
  amount: number; // can be positive or negative
  reason: string;
  timestamp: string;
}

export interface CommerceWallet {
  walletId: string;
  orgId: string;
  balance: number;
  credits: number;
  adjustments: WalletAdjustment[];
}

export type PaymentProviderType = 'card' | 'mobile_payment' | 'invoice' | 'wallet';

export interface PaymentProviderAdapter {
  id: PaymentProviderType;
  name: string;
  enabled: boolean;
  isReady: boolean;
  descriptionFR: string;
  descriptionEN: string;
}
