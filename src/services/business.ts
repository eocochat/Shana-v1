import { 
  Organization, 
  PlanType, 
  PlanConfig, 
  QuotaRule, 
  DEFAULT_PLANS, 
  OrgMember, 
  OrgUsage, 
  OrgActivity 
} from '../modules/organization';
import { AccessController } from './admin';

const ORGS_STORAGE_KEY = 'shana_business_organizations';
const QUOTA_RULES_STORAGE_KEY = 'shana_business_quota_rules';
const USAGE_STATS_STORAGE_KEY = 'shana_business_usage_stats';
const BUSINESS_AUDIT_KEY = 'shana_business_audit_logs';
const BUSINESS_ALERTS_KEY = 'shana_business_alerts';

export interface BusinessAuditLog {
  id: string;
  actor: string;
  role: 'admin' | 'super_admin' | 'system';
  actionType: 'plan_update' | 'org_action' | 'quota_change' | 'access_change';
  description: string;
  timestamp: string;
  targetId?: string;
}

export interface BusinessAlert {
  id: string;
  type: 'quota exceeded' | 'high usage' | 'organization inactive' | 'plan mismatch';
  severity: 'warning' | 'critical';
  orgName: string;
  orgId: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

// -------------------------------------------------------------
// ORGANIZATIONS MANAGER
// -------------------------------------------------------------
export const OrganizationManager = {
  getOrganizations(): Organization[] {
    try {
      const saved = localStorage.getItem(ORGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[OrganizationManager] Error parsing organizations:', e);
    }

    const seeded: Organization[] = [
      {
        id: 'org_sorbonne',
        name: 'Sorbonne Tech Lab',
        createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(), // 60 days ago
        status: 'enabled',
        plan: 'Standard',
        memberCount: 8,
        language: 'FR',
        members: [
          { id: 'mem_1', name: 'Prof. Jean-Pierre', email: 'jp.sorbonne@univ-paris.fr', role: 'owner', joinedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(), language: 'FR' },
          { id: 'mem_2', name: 'Alice Bertrand', email: 'alice.bertrand@univ-paris.fr', role: 'admin', joinedAt: new Date(Date.now() - 55 * 24 * 3600 * 1000).toISOString(), language: 'FR' },
          { id: 'mem_3', name: 'Bob Dupont', email: 'bob.dupont@univ-paris.fr', role: 'member', joinedAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(), language: 'EN' },
        ],
        usage: {
          sessionsStarted: 124,
          sessionsCompleted: 118,
          averageDurationMinutes: 18.5,
          voiceUsageHours: 12.4,
          mirrorUsageHours: 22.1,
          trainingUsageHours: 45.6,
          storageUsedGB: 12.4,
          aiRequestsCount: 450
        },
        activity: [
          { id: 'act_1', actor: 'jp.sorbonne@univ-paris.fr', action: 'Organization Initialized', timestamp: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(), details: 'Standard plan activated.' },
          { id: 'act_2', actor: 'alice.bertrand@univ-paris.fr', action: 'Member Invited', timestamp: new Date(Date.now() - 55 * 24 * 3600 * 1000).toISOString(), details: 'Bob Dupont was added.' },
          { id: 'act_3', actor: 'system', action: 'Daily Sync', timestamp: new Date(Date.now() - 3600 * 1000).toISOString(), details: 'Usage parameters aggregated.' }
        ]
      },
      {
        id: 'org_loreal',
        name: 'L\'Oréal Innovation Paris',
        createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(), // 120 days ago
        status: 'enabled',
        plan: 'Premium',
        memberCount: 42,
        language: 'FR',
        members: [
          { id: 'mem_l1', name: 'Marc-Antoine', email: 'marc.antoine@loreal.com', role: 'owner', joinedAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(), language: 'FR' },
          { id: 'mem_l2', name: 'Hélène Roche', email: 'helene.roche@loreal.com', role: 'admin', joinedAt: new Date(Date.now() - 110 * 24 * 3600 * 1000).toISOString(), language: 'FR' },
          { id: 'mem_l3', name: 'Claire Chazal', email: 'claire.chazal@loreal.com', role: 'member', joinedAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(), language: 'EN' }
        ],
        usage: {
          sessionsStarted: 642,
          sessionsCompleted: 610,
          averageDurationMinutes: 22.1,
          voiceUsageHours: 98.6,
          mirrorUsageHours: 142.3,
          trainingUsageHours: 230.1,
          storageUsedGB: 184.2,
          aiRequestsCount: 3940
        },
        activity: [
          { id: 'act_l1', actor: 'helene.roche@loreal.com', action: 'Security Overhaul', timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), details: 'Double authentication required.' },
          { id: 'act_l2', actor: 'system', action: 'Daily Sync', timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), details: 'Usage bounds checked.' }
        ]
      },
      {
        id: 'org_renault',
        name: 'Renault Digital',
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        status: 'disabled',
        plan: 'Starter',
        memberCount: 3,
        language: 'FR',
        members: [
          { id: 'mem_r1', name: 'Alain Prost', email: 'alain.prost@renault.com', role: 'owner', joinedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), language: 'FR' }
        ],
        usage: {
          sessionsStarted: 12,
          sessionsCompleted: 8,
          averageDurationMinutes: 14.2,
          voiceUsageHours: 0,
          mirrorUsageHours: 1.2,
          trainingUsageHours: 8.5,
          storageUsedGB: 0.8,
          aiRequestsCount: 45
        },
        activity: [
          { id: 'act_r1', actor: 'superadmin@shana.com', action: 'Account Disabled', timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), details: 'Temporarily paused pending administrative validation.' }
        ]
      },
      {
        id: 'org_google_fr',
        name: 'Google Cloud France',
        createdAt: new Date(Date.now() - 150 * 24 * 3600 * 1000).toISOString(),
        status: 'enabled',
        plan: 'Enterprise',
        memberCount: 156,
        language: 'EN',
        members: [
          { id: 'mem_g1', name: 'Sundar Pichai', email: 'sundar@google.com', role: 'owner', joinedAt: new Date(Date.now() - 150 * 24 * 3600 * 1000).toISOString(), language: 'EN' },
          { id: 'mem_g2', name: 'Jean-Luc Picard', email: 'picard@google.com', role: 'admin', joinedAt: new Date(Date.now() - 140 * 24 * 3600 * 1000).toISOString(), language: 'FR' }
        ],
        usage: {
          sessionsStarted: 1842,
          sessionsCompleted: 1798,
          averageDurationMinutes: 24.8,
          voiceUsageHours: 412.5,
          mirrorUsageHours: 618.9,
          trainingUsageHours: 980.4,
          storageUsedGB: 1045.2,
          aiRequestsCount: 45910
        },
        activity: [
          { id: 'act_g1', actor: 'picard@google.com', action: 'SSO Configured', timestamp: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(), details: 'SAML integration successful.' }
        ]
      }
    ];

    this.saveOrganizations(seeded);
    return seeded;
  },

  saveOrganizations(orgs: Organization[]): void {
    localStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(orgs));
  },

  createOrganization(name: string, plan: PlanType, language: 'FR' | 'EN', creatorEmail: string): Organization {
    const orgs = this.getOrganizations();
    const id = 'org_' + Math.random().toString(36).substring(2, 9);
    
    // Configure default quotas based on selected plan limits
    const planConfig = DEFAULT_PLANS[plan];
    
    const newOrg: Organization = {
      id,
      name,
      createdAt: new Date().toISOString(),
      status: 'enabled',
      plan,
      memberCount: 1,
      language,
      members: [
        {
          id: 'mem_' + Math.random().toString(36).substring(2, 9),
          name: creatorEmail.split('@')[0],
          email: creatorEmail,
          role: 'owner',
          joinedAt: new Date().toISOString(),
          language
        }
      ],
      usage: {
        sessionsStarted: 0,
        sessionsCompleted: 0,
        averageDurationMinutes: 0,
        voiceUsageHours: 0,
        mirrorUsageHours: 0,
        trainingUsageHours: 0,
        storageUsedGB: 0,
        aiRequestsCount: 0
      },
      activity: [
        {
          id: 'act_' + Math.random().toString(36).substring(2, 9),
          actor: creatorEmail,
          action: 'Organization Created',
          timestamp: new Date().toISOString(),
          details: `Provisioned with ${plan} plan.`
        }
      ]
    };

    orgs.push(newOrg);
    this.saveOrganizations(orgs);

    // Audit trace
    BusinessController.logAudit(
      creatorEmail,
      'super_admin',
      'org_action',
      `Created new organization: ${name} with ${plan} plan.`,
      id
    );

    // CENTRALIZED SYSTEM TRACE
    AccessController.logAction(
      'ADMIN_ACTION',
      `[Business Ops] Organization '${name}' created.`,
      { id: 'usr_admin', email: creatorEmail, role: 'super_admin' },
      undefined,
      `Plan: ${plan}`
    );

    return newOrg;
  },

  updateOrganizationStatus(id: string, status: 'enabled' | 'disabled', actorEmail: string): void {
    const orgs = this.getOrganizations();
    const org = orgs.find(o => o.id === id);
    if (org) {
      org.status = status;
      const actId = 'act_' + Math.random().toString(36).substring(2, 9);
      org.activity.unshift({
        id: actId,
        actor: actorEmail,
        action: status === 'enabled' ? 'Organization Enabled' : 'Organization Disabled',
        timestamp: new Date().toISOString(),
        details: `Updated by system admin.`
      });
      this.saveOrganizations(orgs);

      BusinessController.logAudit(
        actorEmail,
        'super_admin',
        'org_action',
        `Changed organization status of '${org.name}' to ${status}.`,
        id
      );

      // CENTRALIZED SECURITY AUDIT
      AccessController.logAction(
        'ADMIN_ACTION',
        `[Business Ops] Org status updated to ${status.toUpperCase()} for '${org.name}'`,
        { id: 'usr_admin', email: actorEmail, role: 'super_admin' },
        undefined,
        `Status set to ${status}`
      );
    }
  },

  updateOrganizationPlan(id: string, newPlan: PlanType, actorEmail: string): void {
    const orgs = this.getOrganizations();
    const org = orgs.find(o => o.id === id);
    if (org) {
      const oldPlan = org.plan;
      org.plan = newPlan;
      const actId = 'act_' + Math.random().toString(36).substring(2, 9);
      org.activity.unshift({
        id: actId,
        actor: actorEmail,
        action: 'Plan Upgraded/Downgraded',
        timestamp: new Date().toISOString(),
        details: `Transitioned from ${oldPlan} to ${newPlan}.`
      });
      this.saveOrganizations(orgs);

      BusinessController.logAudit(
        actorEmail,
        'super_admin',
        'plan_update',
        `Updated organization '${org.name}' plan from ${oldPlan} to ${newPlan}.`,
        id
      );

      // CENTRALIZED SECURITY AUDIT
      AccessController.logAction(
        'ADMIN_ACTION',
        `[Business Ops] Plan upgraded/downgraded for '${org.name}'`,
        { id: 'usr_admin', email: actorEmail, role: 'super_admin' },
        undefined,
        `From ${oldPlan} to ${newPlan}`
      );
    }
  },

  addMember(id: string, name: string, email: string, role: OrgMember['role'], actorEmail: string): void {
    const orgs = this.getOrganizations();
    const org = orgs.find(o => o.id === id);
    if (org) {
      const newMember: OrgMember = {
        id: 'mem_' + Math.random().toString(36).substring(2, 9),
        name,
        email,
        role,
        joinedAt: new Date().toISOString(),
        language: org.language
      };
      org.members.push(newMember);
      org.memberCount = org.members.length;

      const actId = 'act_' + Math.random().toString(36).substring(2, 9);
      org.activity.unshift({
        id: actId,
        actor: actorEmail,
        action: 'Member Joined',
        timestamp: new Date().toISOString(),
        details: `Added ${name} (${email}) as ${role}.`
      });
      this.saveOrganizations(orgs);

      BusinessController.logAudit(
        actorEmail,
        'super_admin',
        'org_action',
        `Added member ${name} (${email}) to organization '${org.name}'.`,
        id
      );
    }
  }
};

// -------------------------------------------------------------
// USAGE MONITORING MANAGER
// -------------------------------------------------------------
export interface UsageLogEntry {
  date: string; // YYYY-MM-DD
  sessionsStarted: number;
  sessionsCompleted: number;
  voiceUsageHours: number;
  mirrorUsageHours: number;
  trainingUsageHours: number;
}

export const UsageManager = {
  getUsageStats(): UsageLogEntry[] {
    try {
      const saved = localStorage.getItem(USAGE_STATS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[UsageManager] Error parsing usage stats:', e);
    }

    // Seed 14 days of realistic timeline usage data for displaying weekly/daily/monthly charts
    const stats: UsageLogEntry[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Sunday drop
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const multiplier = isWeekend ? 0.3 : 1.0;

      stats.push({
        date: dateStr,
        sessionsStarted: Math.floor((40 + Math.random() * 25) * multiplier),
        sessionsCompleted: Math.floor((36 + Math.random() * 22) * multiplier),
        voiceUsageHours: parseFloat(((10 + Math.random() * 8) * multiplier).toFixed(1)),
        mirrorUsageHours: parseFloat(((15 + Math.random() * 12) * multiplier).toFixed(1)),
        trainingUsageHours: parseFloat(((22 + Math.random() * 15) * multiplier).toFixed(1)),
      });
    }

    this.saveUsageStats(stats);
    return stats;
  },

  saveUsageStats(stats: UsageLogEntry[]): void {
    localStorage.setItem(USAGE_STATS_STORAGE_KEY, JSON.stringify(stats));
  },

  recordUsage(started: boolean, completed: boolean, voiceHours: number, mirrorHours: number, trainingHours: number): void {
    const stats = this.getUsageStats();
    const todayStr = new Date().toISOString().split('T')[0];
    let todayEntry = stats.find(s => s.date === todayStr);

    if (!todayEntry) {
      todayEntry = {
        date: todayStr,
        sessionsStarted: 0,
        sessionsCompleted: 0,
        voiceUsageHours: 0,
        mirrorUsageHours: 0,
        trainingUsageHours: 0
      };
      stats.push(todayEntry);
    }

    if (started) todayEntry.sessionsStarted += 1;
    if (completed) todayEntry.sessionsCompleted += 1;
    todayEntry.voiceUsageHours = parseFloat((todayEntry.voiceUsageHours + voiceHours).toFixed(1));
    todayEntry.mirrorUsageHours = parseFloat((todayEntry.mirrorUsageHours + mirrorHours).toFixed(1));
    todayEntry.trainingUsageHours = parseFloat((todayEntry.trainingUsageHours + trainingHours).toFixed(1));

    // Keep last 30 days
    if (stats.length > 30) {
      stats.shift();
    }

    this.saveUsageStats(stats);
  }
};

// -------------------------------------------------------------
// QUOTAS ENGINE
// -------------------------------------------------------------
export const QuotaEngine = {
  getRules(): QuotaRule[] {
    try {
      const saved = localStorage.getItem(QUOTA_RULES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[QuotaEngine] Error parsing rules:', e);
    }

    const defaultRules: QuotaRule[] = [
      {
        id: 'qt_1',
        category: 'interviews',
        type: 'warning',
        thresholdPercentage: 80,
        messageFR: 'Attention : L\'organisation a utilisé 80% de son quota mensuel d\'entretiens.',
        messageEN: 'Warning: Organization has consumed 80% of its monthly interview quota limit.',
        active: true
      },
      {
        id: 'qt_2',
        category: 'interviews',
        type: 'hard limit',
        thresholdPercentage: 100,
        messageFR: 'Erreur : Quota maximum d\'entretiens atteint. Activation bloquée.',
        messageEN: 'Critical: Interview quota limit reached. Active sessions blocked.',
        active: true
      },
      {
        id: 'qt_3',
        category: 'storage',
        type: 'soft limit',
        thresholdPercentage: 90,
        gracePeriodDays: 7,
        messageFR: 'Alerte stockage (90%) : période de grâce de 7 jours initiée avant restriction.',
        messageEN: 'Storage notice (90%): 7-day grace period initiated prior to resource restriction.',
        active: true
      },
      {
        id: 'qt_4',
        category: 'AI requests',
        type: 'hard limit',
        thresholdPercentage: 100,
        messageFR: 'Erreur : Limite de requêtes IA atteinte pour le cycle en cours.',
        messageEN: 'Critical: AI prompt requests quota exhausted for current calendar cycle.',
        active: true
      }
    ];

    this.saveRules(defaultRules);
    return defaultRules;
  },

  saveRules(rules: QuotaRule[]): void {
    localStorage.setItem(QUOTA_RULES_STORAGE_KEY, JSON.stringify(rules));
  },

  updateRule(id: string, threshold: number, active: boolean, actorEmail: string): void {
    const rules = this.getRules();
    const rule = rules.find(r => r.id === id);
    if (rule) {
      const oldTh = rule.thresholdPercentage;
      const oldAc = rule.active;
      rule.thresholdPercentage = threshold;
      rule.active = active;
      this.saveRules(rules);

      BusinessController.logAudit(
        actorEmail,
        'super_admin',
        'quota_change',
        `Modified quota rule [${rule.category.toUpperCase()}] type ${rule.type}: threshold ${oldTh}%->${threshold}%, active ${oldAc}->${active}.`,
        id
      );

      // CENTRALIZED SECURITY AUDIT
      AccessController.logAction(
        'ADMIN_ACTION',
        `[QuotaEngine] Rule updated for category ${rule.category}`,
        { id: 'usr_admin', email: actorEmail, role: 'super_admin' },
        undefined,
        `Threshold: ${threshold}%`
      );
    }
  },

  checkQuotasForOrg(org: Organization): { exceeded: boolean; severity: 'warning' | 'critical' | 'none'; messages: string[]; triggeredRule?: QuotaRule } {
    const rules = this.getRules();
    const planConfig = DEFAULT_PLANS[org.plan];
    const messages: string[] = [];
    let overallSeverity: 'warning' | 'critical' | 'none' = 'none';
    let hasExceeded = false;
    let triggeredRule: QuotaRule | undefined;

    for (const rule of rules) {
      if (!rule.active) continue;

      let currentVal = 0;
      let limitVal = 0;

      if (rule.category === 'interviews') {
        currentVal = org.usage.sessionsStarted;
        limitVal = planConfig.interviewLimit;
      } else if (rule.category === 'storage') {
        currentVal = org.usage.storageUsedGB;
        limitVal = planConfig.storageLimitGB;
      } else if (rule.category === 'AI requests') {
        currentVal = org.usage.aiRequestsCount;
        limitVal = planConfig.aiRequestLimit;
      }

      if (limitVal <= 0) continue; // Unlimited/Not configured

      const usagePct = (currentVal / limitVal) * 100;
      if (usagePct >= rule.thresholdPercentage) {
        triggeredRule = rule;
        hasExceeded = usagePct >= 100;
        
        const isCritical = rule.type === 'hard limit' || (rule.type === 'soft limit' && usagePct >= 110);
        const severityStr = isCritical ? 'critical' : 'warning';

        if (severityStr === 'critical' && overallSeverity !== 'critical') {
          overallSeverity = 'critical';
        } else if (severityStr === 'warning' && overallSeverity === 'none') {
          overallSeverity = 'warning';
        }

        const msg = org.language === 'FR' ? rule.messageFR : rule.messageEN;
        const details = `(${currentVal}/${limitVal} units, ${Math.floor(usagePct)}%)`;
        messages.push(`${msg} ${details}`);
      }
    }

    return {
      exceeded: hasExceeded,
      severity: overallSeverity,
      messages,
      triggeredRule
    };
  }
};

// -------------------------------------------------------------
// ANALYTICS AGGREGATOR
// -------------------------------------------------------------
export const AnalyticsAggregator = {
  aggregateDashboard(): {
    totalAccounts: number;
    activeUsers: number;
    organizationsCount: number;
    activeInterviews: number;
    usageGrowthPct: number;
    languageDistribution: { FR: number; EN: number };
    conversionRates: { signupsToAssessmentPct: number; standardToPremiumPct: number };
  } {
    const orgs = OrganizationManager.getOrganizations();
    
    let totalMembers = 0;
    let activeInterviews = 0;
    let totalFR = 0;
    let totalEN = 0;

    orgs.forEach(org => {
      totalMembers += org.members.length;
      activeInterviews += org.usage.sessionsStarted;
      if (org.language === 'FR') totalFR++;
      else totalEN++;
    });

    return {
      totalAccounts: totalMembers + 15, // Include some default sandbox/freemium accounts
      activeUsers: Math.floor(totalMembers * 0.72) + 8,
      organizationsCount: orgs.length,
      activeInterviews: activeInterviews,
      usageGrowthPct: 18.4, // Static Operations metrics showing usage expansion
      languageDistribution: {
        FR: totalFR,
        EN: totalEN
      },
      conversionRates: {
        signupsToAssessmentPct: 34.5,
        standardToPremiumPct: 12.8
      }
    };
  }
};

// -------------------------------------------------------------
// BUSINESS CONTROLLER
// -------------------------------------------------------------
export const BusinessController = {
  getAuditLogs(): BusinessAuditLog[] {
    try {
      const saved = localStorage.getItem(BUSINESS_AUDIT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[BusinessController] Error parsing audit:', e);
    }

    const seeded: BusinessAuditLog[] = [
      {
        id: 'baud_1',
        actor: 'superadmin@shana.com',
        role: 'super_admin',
        actionType: 'plan_update',
        description: 'Upgraded L\'Oréal Innovation Paris to Premium Plan.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        targetId: 'org_loreal'
      },
      {
        id: 'baud_2',
        actor: 'system',
        role: 'system',
        actionType: 'quota_change',
        description: 'System triggered storage soft quota warning limit on Sorbonne Tech Lab.',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        targetId: 'org_sorbonne'
      },
      {
        id: 'baud_3',
        actor: 'admin@shana.com',
        role: 'admin',
        actionType: 'org_action',
        description: 'Disabled Renault Digital organization due to license expiration.',
        timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        targetId: 'org_renault'
      },
      {
        id: 'baud_4',
        actor: 'superadmin@shana.com',
        role: 'super_admin',
        actionType: 'access_change',
        description: 'Modified Starter plan access criteria (blocked Vocal features by default).',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      }
    ];

    this.saveAuditLogs(seeded);
    return seeded;
  },

  saveAuditLogs(logs: BusinessAuditLog[]): void {
    localStorage.setItem(BUSINESS_AUDIT_KEY, JSON.stringify(logs));
  },

  logAudit(actor: string, role: 'admin' | 'super_admin' | 'system', actionType: BusinessAuditLog['actionType'], description: string, targetId?: string): void {
    const logs = this.getAuditLogs();
    const newLog: BusinessAuditLog = {
      id: 'baud_' + Math.random().toString(36).substring(2, 9),
      actor,
      role,
      actionType,
      description,
      timestamp: new Date().toISOString(),
      targetId
    };
    logs.unshift(newLog);
    this.saveAuditLogs(logs);
  },

  getAlerts(): BusinessAlert[] {
    try {
      const saved = localStorage.getItem(BUSINESS_ALERTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('[BusinessController] Error parsing alerts:', e);
    }

    // Seed realistic administrative operations notifications (quota exceeded, high usage, organization inactive, plan mismatch)
    const seeded: BusinessAlert[] = [
      {
        id: 'balt_1',
        type: 'quota exceeded',
        severity: 'critical',
        orgName: 'Sorbonne Tech Lab',
        orgId: 'org_sorbonne',
        message: 'Sorbonne Tech Lab is currently at 124% of its Starter plan interview limits.',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        resolved: false
      },
      {
        id: 'balt_2',
        type: 'high usage',
        severity: 'warning',
        orgName: 'L\'Oréal Innovation Paris',
        orgId: 'org_loreal',
        message: 'L\'Oréal Innovation Paris has initiated 42 AI-ops interview prompts within the last 10 minutes.',
        timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        resolved: false
      },
      {
        id: 'balt_3',
        type: 'organization inactive',
        severity: 'warning',
        orgName: 'Renault Digital',
        orgId: 'org_renault',
        message: 'Renault Digital remains disabled. Consider contacting the account owner Alain Prost.',
        timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        resolved: false
      },
      {
        id: 'balt_4',
        type: 'plan_mismatch' as any, // "plan mismatch"
        severity: 'critical',
        orgName: 'Google Cloud France',
        orgId: 'org_google_fr',
        message: 'Plan mismatch: Configured with Enterprise parameters but the billing reference points to Premium.',
        timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        resolved: false
      }
    ];

    this.saveAlerts(seeded);
    return seeded;
  },

  saveAlerts(alerts: BusinessAlert[]): void {
    localStorage.setItem(BUSINESS_ALERTS_KEY, JSON.stringify(alerts));
  },

  resolveAlert(id: string, resolverEmail: string): void {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      alert.resolved = true;
      this.saveAlerts(alerts);

      this.logAudit(
        resolverEmail,
        'super_admin',
        'org_action',
        `Resolved business alert: ${alert.message}`,
        alert.orgId
      );

      // CENTRALIZED SECURITY AUDIT
      AccessController.logAction(
        'ADMIN_ACTION',
        `[Business Ops] Resolved business operations warning for org: ${alert.orgName}`,
        { id: 'usr_admin', email: resolverEmail, role: 'super_admin' },
        undefined,
        `Resolved message: ${alert.message}`
      );
    }
  },

  triggerQuotaAlertIfAny(org: Organization, actorEmail: string): void {
    const check = QuotaEngine.checkQuotasForOrg(org);
    if (check.severity !== 'none') {
      const alerts = this.getAlerts();
      const message = check.messages[0] || `Quota warning reached for ${org.name}.`;
      
      const newAlert: BusinessAlert = {
        id: 'balt_' + Math.random().toString(36).substring(2, 9),
        type: 'quota exceeded',
        severity: check.severity === 'critical' ? 'critical' : 'warning',
        orgName: org.name,
        orgId: org.id,
        message,
        timestamp: new Date().toISOString(),
        resolved: false
      };

      alerts.unshift(newAlert);
      this.saveAlerts(alerts);
    }
  }
};
