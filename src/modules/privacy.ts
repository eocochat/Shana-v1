export interface CandidateConsent {
  id: string;
  candidateName: string;
  candidateEmail: string;
  cameraConsent: boolean;
  microphoneConsent: boolean;
  interviewConsent: boolean;
  analyticsConsent: boolean;
  language: 'FR' | 'EN';
  acceptedAt: string;
  version: string;
  status: 'active' | 'revoked' | 'expired';
}

export interface LifecyclePolicy {
  id: string;
  category: 'sessions' | 'evaluations' | 'logs' | 'media metadata';
  rule: 'active' | 'scheduled archive' | 'scheduled deletion' | 'expired';
  durationDays: number;
  status: 'draft' | 'review' | 'approved' | 'published';
  updatedAt: string;
  updatedBy: string;
}

export interface PrivacyControlConfig {
  id: string;
  dataVisibility: 'restricted' | 'internal' | 'public';
  consentRequirement: 'mandatory' | 'optional' | 'disabled';
  cameraPolicy: 'record' | 'stream_only' | 'disabled';
  microphonePolicy: 'record_transcribe' | 'stream_transcribe' | 'disabled';
  retentionPolicyId: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  updatedAt: string;
  updatedBy: string;
}

const CONSENTS_KEY = 'shana_compliance_consents';
const POLICIES_KEY = 'shana_compliance_policies';
const PRIVACY_CONFIG_KEY = 'shana_compliance_privacy_config';

export const ConsentManager = {
  getConsents(): CandidateConsent[] {
    try {
      const saved = localStorage.getItem(CONSENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    const seeded: CandidateConsent[] = [
      {
        id: 'con_01',
        candidateName: 'Jean Candidat',
        candidateEmail: 'jean.candidat@shana.com',
        cameraConsent: true,
        microphoneConsent: true,
        interviewConsent: true,
        analyticsConsent: true,
        language: 'FR',
        acceptedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        version: 'v2.1',
        status: 'active'
      },
      {
        id: 'con_02',
        candidateName: 'Clara Dubois',
        candidateEmail: 'clara.dubois@shana.com',
        cameraConsent: true,
        microphoneConsent: true,
        interviewConsent: true,
        analyticsConsent: false,
        language: 'FR',
        acceptedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        version: 'v2.1',
        status: 'active'
      },
      {
        id: 'con_03',
        candidateName: 'Arthur Pendragon',
        candidateEmail: 'arthur.pendragon@shana.com',
        cameraConsent: true,
        microphoneConsent: true,
        interviewConsent: true,
        analyticsConsent: true,
        language: 'EN',
        acceptedAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
        version: 'v1.0',
        status: 'expired' // Expired consent for Section 5 Alerts
      },
      {
        id: 'con_04',
        candidateName: 'Emma Watson',
        candidateEmail: 'emma.watson@shana.com',
        cameraConsent: false,
        microphoneConsent: true,
        interviewConsent: true,
        analyticsConsent: false,
        language: 'EN',
        acceptedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        version: 'v2.1',
        status: 'active'
      },
      {
        id: 'con_05',
        candidateName: 'Sophie Bernard',
        candidateEmail: 'sophie.bernard@outlook.fr',
        cameraConsent: true,
        microphoneConsent: true,
        interviewConsent: false, // Consent mismatch alert trigger
        analyticsConsent: true,
        language: 'FR',
        acceptedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        version: 'v2.0',
        status: 'active'
      }
    ];
    this.saveConsents(seeded);
    return seeded;
  },

  saveConsents(consents: CandidateConsent[]): void {
    localStorage.setItem(CONSENTS_KEY, JSON.stringify(consents));
  },

  revokeConsent(id: string, userEmail: string): void {
    const consents = this.getConsents();
    const target = consents.find(c => c.id === id);
    if (target) {
      target.status = 'revoked';
      target.cameraConsent = false;
      target.microphoneConsent = false;
      target.interviewConsent = false;
      target.analyticsConsent = false;
      this.saveConsents(consents);
    }
  }
};

export const RetentionManager = {
  getPolicies(): LifecyclePolicy[] {
    try {
      const saved = localStorage.getItem(POLICIES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    const seeded: LifecyclePolicy[] = [
      {
        id: 'pol_sessions',
        category: 'sessions',
        rule: 'scheduled archive',
        durationDays: 180,
        status: 'published',
        updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        updatedBy: 'superadmin@shana.com'
      },
      {
        id: 'pol_evaluations',
        category: 'evaluations',
        rule: 'active',
        durationDays: 365,
        status: 'published',
        updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        updatedBy: 'superadmin@shana.com'
      },
      {
        id: 'pol_logs',
        category: 'logs',
        rule: 'scheduled deletion',
        durationDays: 90,
        status: 'published',
        updatedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        updatedBy: 'superadmin@shana.com'
      },
      {
        id: 'pol_media',
        category: 'media metadata',
        rule: 'expired',
        durationDays: 30,
        status: 'published',
        updatedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        updatedBy: 'superadmin@shana.com'
      }
    ];
    this.savePolicies(seeded);
    return seeded;
  },

  savePolicies(policies: LifecyclePolicy[]): void {
    localStorage.setItem(POLICIES_KEY, JSON.stringify(policies));
  },

  savePolicy(policy: LifecyclePolicy): void {
    const policies = this.getPolicies();
    const idx = policies.findIndex(p => p.id === policy.id);
    if (idx !== -1) {
      policies[idx] = policy;
    } else {
      policies.push(policy);
    }
    this.savePolicies(policies);
  }
};

export const PolicyEngine = {
  getPrivacyConfig(): PrivacyControlConfig {
    try {
      const saved = localStorage.getItem(PRIVACY_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    const defaults: PrivacyControlConfig = {
      id: 'priv_cfg_current',
      dataVisibility: 'restricted',
      consentRequirement: 'mandatory',
      cameraPolicy: 'stream_only',
      microphonePolicy: 'stream_transcribe',
      retentionPolicyId: 'pol_sessions',
      status: 'published',
      updatedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
      updatedBy: 'superadmin@shana.com'
    };
    this.savePrivacyConfig(defaults);
    return defaults;
  },

  savePrivacyConfig(config: PrivacyControlConfig): void {
    localStorage.setItem(PRIVACY_CONFIG_KEY, JSON.stringify(config));
  }
};
