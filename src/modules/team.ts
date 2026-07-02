export type WorkspaceRole = 'owner' | 'workspace_admin' | 'recruiter' | 'reviewer' | 'viewer' | 'candidate';

export type WorkspaceMemberStatus = 'active' | 'inactive';

export interface WorkspaceMember {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  joinedAt: string;
  assignedTeams: string[]; // Team IDs
}

export interface WorkspaceInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: WorkspaceRole;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  acceptedAt?: string;
}

export interface Team {
  teamId: string;
  organizationId: string;
  name: string;
  createdAt: string;
  memberCount: number;
  status: 'active' | 'archived';
}

export interface WorkspaceOrganization {
  organizationId: string; // Map to Organization.id
  name: string;
  status: 'enabled' | 'disabled' | 'archived';
  owner: string; // Owner email
  plan: string;
  createdAt: string;
  memberCount: number;
}

export interface SeatConfig {
  organizationId: string;
  used: number;
  available: number;
  reserved: number;
  inactive: number;
  gracePeriodDays: number;
  gracePeriodEndsAt?: string;
}

export interface WorkspaceSettings {
  organizationId: string;
  workspaceLanguage: 'FR' | 'EN';
  branding: {
    logoUrl?: string;
    primaryColor: string; // e.g. hex or tailwind name
    companyName?: string;
  };
  interviewDefaults: {
    durationLimitMinutes: number;
    allowVocal: boolean;
    autoArchiveDays: number;
  };
  accessPolicies: {
    ssoRequired: boolean;
    allowedDomains: string[]; // e.g. university.edu, company.com
  };
  notificationPreferences: {
    emailOnInvite: boolean;
    emailOnWeeklyReport: boolean;
    slackAlerts: boolean;
  };
}

export interface WorkspaceAnalyticsData {
  organizationId: string;
  teamInterviews: { teamName: string; count: number }[];
  completionRate: number; // percentage
  usageTrend: { date: string; interviews: number; duration: number }[]; // historical timeline
  languageSplit: { FR: number; EN: number }; // counts
  performanceTrends: { period: string; avgScore: number; candidateCount: number }[];
}
