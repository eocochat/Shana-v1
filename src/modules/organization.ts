export type PlanType = 'Starter' | 'Standard' | 'Premium' | 'Enterprise';

export interface PlanConfig {
  name: PlanType;
  interviewLimit: number; // e.g. 10, 100, 500, -1 for unlimited
  voiceAccess: boolean;
  mirrorAccess: boolean;
  trainingAccess: boolean;
  adminAccess: boolean;
  storageLimitGB: number;
  aiRequestLimit: number;
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  language: 'FR' | 'EN';
}

export interface OrgUsage {
  sessionsStarted: number;
  sessionsCompleted: number;
  averageDurationMinutes: number;
  voiceUsageHours: number;
  mirrorUsageHours: number;
  trainingUsageHours: number;
  storageUsedGB: number;
  aiRequestsCount: number;
}

export interface OrgActivity {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  status: 'enabled' | 'disabled';
  plan: PlanType;
  memberCount: number;
  members: OrgMember[];
  usage: OrgUsage;
  activity: OrgActivity[];
  language: 'FR' | 'EN';
}

export interface QuotaRule {
  id: string;
  category: 'interviews' | 'storage' | 'AI requests' | 'organizations';
  type: 'warning' | 'soft limit' | 'hard limit' | 'grace period';
  thresholdPercentage: number; // e.g. 80, 100, 120
  gracePeriodDays?: number;
  messageFR: string;
  messageEN: string;
  active: boolean;
}

export const DEFAULT_PLANS: Record<PlanType, PlanConfig> = {
  Starter: {
    name: 'Starter',
    interviewLimit: 15,
    voiceAccess: false,
    mirrorAccess: false,
    trainingAccess: true,
    adminAccess: false,
    storageLimitGB: 5,
    aiRequestLimit: 100,
  },
  Standard: {
    name: 'Standard',
    interviewLimit: 100,
    voiceAccess: true,
    mirrorAccess: true,
    trainingAccess: true,
    adminAccess: true,
    storageLimitGB: 50,
    aiRequestLimit: 1000,
  },
  Premium: {
    name: 'Premium',
    interviewLimit: 500,
    voiceAccess: true,
    mirrorAccess: true,
    trainingAccess: true,
    adminAccess: true,
    storageLimitGB: 250,
    aiRequestLimit: 5000,
  },
  Enterprise: {
    name: 'Enterprise',
    interviewLimit: 999999, // Uncapped/virtually unlimited
    voiceAccess: true,
    mirrorAccess: true,
    trainingAccess: true,
    adminAccess: true,
    storageLimitGB: 2000,
    aiRequestLimit: 100000,
  },
};
