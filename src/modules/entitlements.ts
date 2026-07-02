export type EntitlementFeature = 
  | 'voice_access' 
  | 'mirror_access' 
  | 'training_access' 
  | 'admin_access' 
  | 'advanced_reporting' 
  | 'analytics_export'
  | 'custom_branding';

export interface PlanModel {
  planId: string;
  name: string;
  status: 'active' | 'archived' | 'draft';
  features: EntitlementFeature[];
  limits: {
    interviewsPerMonth: number;
    storageLimitGB: number;
    aiRequestLimit: number;
    teamSizeLimit: number;
  };
  createdAt: string;
  updatedAt: string;
  priceMonthlyUSD: number;
}

export type SubscriptionStatus = 'draft' | 'active' | 'expired' | 'cancelled' | 'trial';

export interface Subscription {
  id: string;
  orgId: string;
  orgName: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  startedAt: string;
  endsAt: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
  gracePeriodEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  paymentMethodId?: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  orgId: string;
  amountUSD: number;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  dueDate: string;
  createdAt: string;
  pdfPlaceholderUrl?: string;
}

export interface PaymentMethod {
  id: string;
  orgId: string;
  type: 'card' | 'sepa_debit' | 'bank_transfer' | 'none';
  last4?: string;
  brand?: string;
  expiryDate?: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  invoiceId: string;
  orgId: string;
  amountUSD: number;
  status: 'success' | 'failed' | 'pending';
  createdAt: string;
  failureMessage?: string;
}

export const MONETIZATION_FEATURES_INFO: Record<EntitlementFeature, { nameFR: string; nameEN: string; descriptionFR: string; descriptionEN: string }> = {
  voice_access: {
    nameFR: 'Accès Vocal Avancé',
    nameEN: 'Advanced Vocal Access',
    descriptionFR: 'Active les entretiens vocaux interactifs et les transcriptions.',
    descriptionEN: 'Unlocks interactive vocal assessments and audio biometric logging.'
  },
  mirror_access: {
    nameFR: 'Module Miroir (Double Écran)',
    nameEN: 'Mirror Assessment Mode',
    descriptionFR: 'Permet le double flux vidéo synchrone pour les évaluateurs.',
    descriptionEN: 'Allows dual-stream camera verification and monitoring during sessions.'
  },
  training_access: {
    nameFR: 'Espace d\'Entraînement',
    nameEN: 'Candidate Training Center',
    descriptionFR: 'Accès des candidats aux simulateurs d\'entraînement autonomes.',
    descriptionEN: 'Enables candidate sandboxes and autonomous practice sessions.'
  },
  admin_access: {
    nameFR: 'Console Administrateur',
    nameEN: 'Operations Console Access',
    descriptionFR: 'Droit d\'accès aux tableaux de bord de gestion et de configuration.',
    descriptionEN: 'Provides direct access to administrative and tenant dashboards.'
  },
  advanced_reporting: {
    nameFR: 'Analyses Avancées',
    nameEN: 'Advanced Analytics',
    descriptionFR: 'Génération de métriques comportementales complexes et de graphiques.',
    descriptionEN: 'Enables advanced behavioral performance and telemetry metrics.'
  },
  analytics_export: {
    nameFR: 'Export de Données (CSV/JSON)',
    nameEN: 'Data & Telemetry Export',
    descriptionFR: 'Possibilité d\'exporter des rapports d\'évaluation ou des registres d\'audit.',
    descriptionEN: 'Enables direct downloads of candidate results, evaluations and audit logs.'
  },
  custom_branding: {
    nameFR: 'Marque Blanche / Logo Personnalisé',
    nameEN: 'White Labeling & Custom Branding',
    descriptionFR: 'Permet de masquer le logo SHANA et d\'utiliser des chartes personnalisées.',
    descriptionEN: 'Enables white-label UI configs, customized portals, and company branding.'
  }
};
