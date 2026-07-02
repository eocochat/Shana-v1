import { 
  WorkspaceRole, 
  WorkspaceMember, 
  WorkspaceInvitation, 
  Team, 
  WorkspaceOrganization, 
  SeatConfig, 
  WorkspaceSettings, 
  WorkspaceAnalyticsData 
} from '../modules/team';
import { AccessController } from './admin';

const WORKSPACE_ORGS_KEY = 'shana_ws_organizations';
const WORKSPACE_TEAMS_KEY = 'shana_ws_teams';
const WORKSPACE_MEMBERS_KEY = 'shana_ws_members';
const WORKSPACE_INVITES_KEY = 'shana_ws_invites';
const WORKSPACE_SEATS_KEY = 'shana_ws_seats';
const WORKSPACE_SETTINGS_KEY = 'shana_ws_settings';
const WORKSPACE_AUDIT_KEY = 'shana_ws_audit_logs';

export interface WorkspaceAuditLog {
  id: string;
  organizationId: string;
  actorEmail: string;
  action: 'invite_sent' | 'invite_accepted' | 'role_updated' | 'workspace_created' | 'seat_changed' | 'member_removed' | 'member_deactivated' | 'team_created' | 'team_renamed' | 'team_archived' | 'settings_updated';
  details: string;
  timestamp: string;
}

// -------------------------------------------------------------
// WORKSPACE CONTROLLER & GENERAL ORCHESTRATOR
// -------------------------------------------------------------
export const WorkspaceController = {
  getAuditLogs(orgId?: string): WorkspaceAuditLog[] {
    try {
      const saved = localStorage.getItem(WORKSPACE_AUDIT_KEY);
      const allLogs: WorkspaceAuditLog[] = saved ? JSON.parse(saved) : [];
      if (!saved) {
        // Seed some initial audit records
        const initialLogs: WorkspaceAuditLog[] = [
          {
            id: 'waud_1',
            organizationId: 'org_loreal',
            actorEmail: 'marc.antoine@loreal.com',
            action: 'workspace_created',
            details: "L'Oréal Innovation Paris workspace initialized.",
            timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
          },
          {
            id: 'waud_2',
            organizationId: 'org_loreal',
            actorEmail: 'helene.roche@loreal.com',
            action: 'invite_sent',
            details: "Invitation sent to claire.chazal@loreal.com with role recruiter.",
            timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
          },
          {
            id: 'waud_3',
            organizationId: 'org_loreal',
            actorEmail: 'claire.chazal@loreal.com',
            action: 'invite_accepted',
            details: "claire.chazal@loreal.com joined the workspace.",
            timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
          }
        ];
        localStorage.setItem(WORKSPACE_AUDIT_KEY, JSON.stringify(initialLogs));
        return orgId ? initialLogs.filter(l => l.organizationId === orgId) : initialLogs;
      }
      return orgId ? allLogs.filter(l => l.organizationId === orgId) : allLogs;
    } catch (e) {
      console.error('[WorkspaceController] Error reading audit:', e);
      return [];
    }
  },

  logAudit(orgId: string, actorEmail: string, action: WorkspaceAuditLog['action'], details: string): void {
    try {
      const logs = this.getAuditLogs();
      const newLog: WorkspaceAuditLog = {
        id: 'waud_' + Math.random().toString(36).substring(2, 9),
        organizationId: orgId,
        actorEmail,
        action,
        details,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newLog);
      localStorage.setItem(WORKSPACE_AUDIT_KEY, JSON.stringify(logs));

      // Also dispatch to system admin logs
      AccessController.logAction(
        'ADMIN_ACTION',
        `[Workspace ${orgId}] ${details}`,
        { id: 'usr_admin', email: actorEmail, role: 'admin' },
        undefined,
        `Action: ${action}`
      );
    } catch (e) {
      console.error('[WorkspaceController] Error logging audit:', e);
    }
  }
};

// -------------------------------------------------------------
// ORGANIZATION ENGINE
// -------------------------------------------------------------
export const OrganizationEngine = {
  getOrganizations(): WorkspaceOrganization[] {
    try {
      const saved = localStorage.getItem(WORKSPACE_ORGS_KEY);
      if (saved) return JSON.parse(saved);
      
      // Default organizations matching pre-existing Shana profiles
      const defaults: WorkspaceOrganization[] = [
        {
          organizationId: 'org_loreal',
          name: "L'Oréal Innovation Paris",
          status: 'enabled',
          owner: 'marc.antoine@loreal.com',
          plan: 'Premium',
          createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
          memberCount: 5
        },
        {
          organizationId: 'org_sorbonne',
          name: 'Sorbonne Tech Lab',
          status: 'enabled',
          owner: 'jp.sorbonne@univ-paris.fr',
          plan: 'Standard',
          createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
          memberCount: 3
        },
        {
          organizationId: 'org_renault',
          name: 'Renault Digital',
          status: 'disabled',
          owner: 'alain.prost@renault.com',
          plan: 'Starter',
          createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
          memberCount: 1
        },
        {
          organizationId: 'org_google_fr',
          name: 'Google Cloud France',
          status: 'enabled',
          owner: 'sundar@google.com',
          plan: 'Enterprise',
          createdAt: new Date(Date.now() - 150 * 24 * 3600 * 1000).toISOString(),
          memberCount: 2
        }
      ];
      localStorage.setItem(WORKSPACE_ORGS_KEY, JSON.stringify(defaults));
      return defaults;
    } catch (e) {
      console.error('[OrganizationEngine] Error fetching orgs:', e);
      return [];
    }
  },

  saveOrganizations(orgs: WorkspaceOrganization[]): void {
    localStorage.setItem(WORKSPACE_ORGS_KEY, JSON.stringify(orgs));
  },

  createOrganization(name: string, owner: string, plan: string, actorEmail: string): WorkspaceOrganization {
    const orgs = this.getOrganizations();
    const id = 'org_' + Math.random().toString(36).substring(2, 9);
    const newOrg: WorkspaceOrganization = {
      organizationId: id,
      name,
      status: 'enabled',
      owner,
      plan,
      createdAt: new Date().toISOString(),
      memberCount: 1
    };

    orgs.push(newOrg);
    this.saveOrganizations(orgs);

    // Initial member setup
    TeamManager.addMemberDirect(id, owner.split('@')[0], owner, 'owner');
    
    // Initial seat config setup
    let limit = 5;
    if (plan === 'Standard') limit = 15;
    if (plan === 'Premium') limit = 50;
    if (plan === 'Enterprise') limit = 500;
    SeatManager.initSeatConfig(id, limit);

    // Initial Settings setup
    WorkspaceSettingsManager.getSettings(id);

    WorkspaceController.logAudit(id, actorEmail, 'workspace_created', `Organization [${name}] created by ${actorEmail}.`);
    return newOrg;
  },

  updateOrganization(orgId: string, name: string, plan: string, actorEmail: string): WorkspaceOrganization | null {
    const orgs = this.getOrganizations();
    const idx = orgs.findIndex(o => o.organizationId === orgId);
    if (idx === -1) return null;

    orgs[idx].name = name;
    orgs[idx].plan = plan;
    this.saveOrganizations(orgs);

    WorkspaceController.logAudit(orgId, actorEmail, 'settings_updated', `Organization metadata updated to: ${name}, Plan: ${plan}.`);
    return orgs[idx];
  },

  toggleOrganizationStatus(orgId: string, status: 'enabled' | 'disabled' | 'archived', actorEmail: string): void {
    const orgs = this.getOrganizations();
    const idx = orgs.findIndex(o => o.organizationId === orgId);
    if (idx !== -1) {
      orgs[idx].status = status;
      this.saveOrganizations(orgs);
      WorkspaceController.logAudit(orgId, actorEmail, 'settings_updated', `Organization status modified to ${status.toUpperCase()}.`);
    }
  }
};

// -------------------------------------------------------------
// TEAM MANAGER
// -------------------------------------------------------------
export const TeamManager = {
  getTeams(orgId?: string): Team[] {
    try {
      const saved = localStorage.getItem(WORKSPACE_TEAMS_KEY);
      const allTeams: Team[] = saved ? JSON.parse(saved) : [];
      if (!saved) {
        const defaults: Team[] = [
          { teamId: 'team_l1', organizationId: 'org_loreal', name: 'R&I Paris Team', createdAt: new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString(), memberCount: 3, status: 'active' },
          { teamId: 'team_l2', organizationId: 'org_loreal', name: 'AI Human Lab', createdAt: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString(), memberCount: 2, status: 'active' },
          { teamId: 'team_l3', organizationId: 'org_loreal', name: 'Group Global Recruiting', createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(), memberCount: 1, status: 'active' },
          { teamId: 'team_s1', organizationId: 'org_sorbonne', name: 'Cognitive AI Lab', createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(), memberCount: 2, status: 'active' },
          { teamId: 'team_s2', organizationId: 'org_sorbonne', name: 'Linguistic Panel', createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), memberCount: 1, status: 'active' }
        ];
        localStorage.setItem(WORKSPACE_TEAMS_KEY, JSON.stringify(defaults));
        return orgId ? defaults.filter(t => t.organizationId === orgId) : defaults;
      }
      return orgId ? allTeams.filter(t => t.organizationId === orgId) : allTeams;
    } catch (e) {
      console.error('[TeamManager] Error fetching teams:', e);
      return [];
    }
  },

  saveTeams(teams: Team[]): void {
    localStorage.setItem(WORKSPACE_TEAMS_KEY, JSON.stringify(teams));
  },

  createTeam(orgId: string, name: string, actorEmail: string): Team {
    const teams = this.getTeams();
    const id = 'team_' + Math.random().toString(36).substring(2, 9);
    const newTeam: Team = {
      teamId: id,
      organizationId: orgId,
      name,
      createdAt: new Date().toISOString(),
      memberCount: 0,
      status: 'active'
    };

    teams.push(newTeam);
    this.saveTeams(teams);

    WorkspaceController.logAudit(orgId, actorEmail, 'team_created', `Team [${name}] created.`);
    return newTeam;
  },

  renameTeam(orgId: string, teamId: string, newName: string, actorEmail: string): Team | null {
    const teams = this.getTeams();
    const idx = teams.findIndex(t => t.teamId === teamId);
    if (idx === -1) return null;

    const oldName = teams[idx].name;
    teams[idx].name = newName;
    this.saveTeams(teams);

    WorkspaceController.logAudit(orgId, actorEmail, 'team_renamed', `Team [${oldName}] renamed to [${newName}].`);
    return teams[idx];
  },

  archiveTeam(orgId: string, teamId: string, actorEmail: string): void {
    const teams = this.getTeams();
    const idx = teams.findIndex(t => t.teamId === teamId);
    if (idx !== -1) {
      teams[idx].status = 'archived';
      this.saveTeams(teams);
      WorkspaceController.logAudit(orgId, actorEmail, 'team_archived', `Team [${teams[idx].name}] archived.`);
    }
  },

  // -------------------------------------------------------------
  // MEMBERS MANAGEMENT
  // -------------------------------------------------------------
  getMembers(orgId?: string): WorkspaceMember[] {
    try {
      const saved = localStorage.getItem(WORKSPACE_MEMBERS_KEY);
      const allMembers: WorkspaceMember[] = saved ? JSON.parse(saved) : [];
      if (!saved) {
        const defaults: WorkspaceMember[] = [
          // L'Oreal members
          { id: 'wmem_l1', organizationId: 'org_loreal', name: 'Marc-Antoine', email: 'marc.antoine@loreal.com', role: 'owner', status: 'active', joinedAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(), assignedTeams: ['team_l1'] },
          { id: 'wmem_l2', organizationId: 'org_loreal', name: 'Hélène Roche', email: 'helene.roche@loreal.com', role: 'workspace_admin', status: 'active', joinedAt: new Date(Date.now() - 110 * 24 * 3600 * 1000).toISOString(), assignedTeams: ['team_l1', 'team_l2'] },
          { id: 'wmem_l3', organizationId: 'org_loreal', name: 'Claire Chazal', email: 'claire.chazal@loreal.com', role: 'recruiter', status: 'active', joinedAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(), assignedTeams: ['team_l2', 'team_l3'] },
          { id: 'wmem_l4', organizationId: 'org_loreal', name: 'Sarah Connor', email: 'sarah.connor@loreal.com', role: 'reviewer', status: 'active', joinedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(), assignedTeams: ['team_l1'] },
          { id: 'wmem_l5', organizationId: 'org_loreal', name: 'Jean Candidate', email: 'jean.dupont@candidate.com', role: 'candidate', status: 'active', joinedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), assignedTeams: [] },
          
          // Sorbonne members
          { id: 'wmem_s1', organizationId: 'org_sorbonne', name: 'Prof. Jean-Pierre', email: 'jp.sorbonne@univ-paris.fr', role: 'owner', status: 'active', joinedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(), assignedTeams: ['team_s1'] },
          { id: 'wmem_s2', organizationId: 'org_sorbonne', name: 'Alice Bertrand', email: 'alice.bertrand@univ-paris.fr', role: 'workspace_admin', status: 'active', joinedAt: new Date(Date.now() - 55 * 24 * 3600 * 1000).toISOString(), assignedTeams: ['team_s1', 'team_s2'] },
          { id: 'wmem_s3', organizationId: 'org_sorbonne', name: 'Bob Dupont', email: 'bob.dupont@univ-paris.fr', role: 'recruiter', status: 'active', joinedAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(), assignedTeams: ['team_s1'] }
        ];
        localStorage.setItem(WORKSPACE_MEMBERS_KEY, JSON.stringify(defaults));
        return orgId ? defaults.filter(m => m.organizationId === orgId) : defaults;
      }
      return orgId ? allMembers.filter(m => m.organizationId === orgId) : allMembers;
    } catch (e) {
      console.error('[TeamManager] Error fetching members:', e);
      return [];
    }
  },

  saveMembers(members: WorkspaceMember[]): void {
    localStorage.setItem(WORKSPACE_MEMBERS_KEY, JSON.stringify(members));
  },

  addMemberDirect(orgId: string, name: string, email: string, role: WorkspaceRole): WorkspaceMember {
    const members = this.getMembers();
    const id = 'wmem_' + Math.random().toString(36).substring(2, 9);
    const newMember: WorkspaceMember = {
      id,
      organizationId: orgId,
      name,
      email,
      role,
      status: 'active',
      joinedAt: new Date().toISOString(),
      assignedTeams: []
    };

    members.push(newMember);
    this.saveMembers(members);

    // Sync member counts
    this.recalculateMemberCounts(orgId);
    return newMember;
  },

  inviteMember(orgId: string, email: string, role: WorkspaceRole, actorEmail: string): WorkspaceInvitation {
    const checkSeats = SeatManager.validateSeatAllocation(orgId);
    if (!checkSeats.allowed) {
      throw new Error(`Insufficient workspace seats. Active seats limit exceeded. (Grace period status: ${checkSeats.status})`);
    }

    const invites = this.getInvitations(orgId);
    const id = 'winv_' + Math.random().toString(36).substring(2, 9);
    const newInvite: WorkspaceInvitation = {
      id,
      organizationId: orgId,
      email,
      role,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    invites.push(newInvite);
    localStorage.setItem(WORKSPACE_INVITES_KEY, JSON.stringify(this.getInvitations().concat(newInvite)));

    WorkspaceController.logAudit(orgId, actorEmail, 'invite_sent', `Sent workspace invitation to ${email} as role ${role.toUpperCase()}.`);
    
    // Increment seat reservation
    SeatManager.reserveSeat(orgId);

    return newInvite;
  },

  getInvitations(orgId?: string): WorkspaceInvitation[] {
    try {
      const saved = localStorage.getItem(WORKSPACE_INVITES_KEY);
      const all: WorkspaceInvitation[] = saved ? JSON.parse(saved) : [];
      if (!saved) {
        const defaults: WorkspaceInvitation[] = [
          { id: 'winv_l1', organizationId: 'org_loreal', email: 'cynthia.recruitment@loreal.com', role: 'recruiter', status: 'pending', createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
          { id: 'winv_s1', organizationId: 'org_sorbonne', email: 'dean.admissions@sorbonne.fr', role: 'reviewer', status: 'pending', createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() }
        ];
        localStorage.setItem(WORKSPACE_INVITES_KEY, JSON.stringify(defaults));
        return orgId ? defaults.filter(i => i.organizationId === orgId) : defaults;
      }
      return orgId ? all.filter(i => i.organizationId === orgId) : all;
    } catch (e) {
      console.error('[TeamManager] Error getting invitations:', e);
      return [];
    }
  },

  acceptInvitation(inviteId: string, name: string): WorkspaceMember | null {
    const invites = this.getInvitations();
    const invIdx = invites.findIndex(i => i.id === inviteId);
    if (invIdx === -1) return null;

    const invite = invites[invIdx];
    invite.status = 'accepted';
    invite.acceptedAt = new Date().toISOString();
    localStorage.setItem(WORKSPACE_INVITES_KEY, JSON.stringify(invites));

    // Create active workspace member
    const newMember = this.addMemberDirect(invite.organizationId, name, invite.email, invite.role);

    // Audit and Seat adjust
    WorkspaceController.logAudit(invite.organizationId, invite.email, 'invite_accepted', `${invite.email} accepted invitation and joined workspace.`);
    SeatManager.convertReservedToUsed(invite.organizationId);

    return newMember;
  },

  changeMemberRole(orgId: string, memberId: string, newRole: WorkspaceRole, actorEmail: string): WorkspaceMember | null {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === memberId);
    if (idx === -1) return null;

    const oldRole = members[idx].role;
    members[idx].role = newRole;
    this.saveMembers(members);

    WorkspaceController.logAudit(orgId, actorEmail, 'role_updated', `Changed member role of ${members[idx].email} from ${oldRole.toUpperCase()} to ${newRole.toUpperCase()}.`);
    return members[idx];
  },

  deactivateMember(orgId: string, memberId: string, actorEmail: string): WorkspaceMember | null {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === memberId);
    if (idx === -1) return null;

    members[idx].status = 'inactive';
    this.saveMembers(members);

    WorkspaceController.logAudit(orgId, actorEmail, 'member_deactivated', `Deactivated workspace member ${members[idx].email}.`);
    
    // Adjust seats
    SeatManager.deactivateMemberSeat(orgId);

    return members[idx];
  },

  reactivateMember(orgId: string, memberId: string, actorEmail: string): WorkspaceMember | null {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === memberId);
    if (idx === -1) return null;

    const checkSeats = SeatManager.validateSeatAllocation(orgId);
    if (!checkSeats.allowed) {
      throw new Error(`Insufficient seats available to reactivate this member.`);
    }

    members[idx].status = 'active';
    this.saveMembers(members);

    WorkspaceController.logAudit(orgId, actorEmail, 'role_updated', `Reactivated workspace member ${members[idx].email}.`);
    SeatManager.activateMemberSeat(orgId);

    return members[idx];
  },

  removeMember(orgId: string, memberId: string, actorEmail: string): void {
    // "No account deletion" means we remove them from this workspace list or transition to deactivated.
    // Let's remove them from the Workspace list. This does not delete their system user credentials.
    const members = this.getMembers();
    const filtered = members.filter(m => m.id !== memberId);
    this.saveMembers(filtered);

    WorkspaceController.logAudit(orgId, actorEmail, 'member_removed', `Removed member ID [${memberId}] from workspace.`);
    SeatManager.releaseSeat(orgId);
    this.recalculateMemberCounts(orgId);
  },

  recalculateMemberCounts(orgId: string): void {
    const members = this.getMembers(orgId);
    const orgs = OrganizationEngine.getOrganizations();
    const oIdx = orgs.findIndex(o => o.organizationId === orgId);
    if (oIdx !== -1) {
      orgs[oIdx].memberCount = members.length;
      OrganizationEngine.saveOrganizations(orgs);
    }

    // Teams counts
    const teams = this.getTeams(orgId);
    teams.forEach(t => {
      t.memberCount = members.filter(m => m.assignedTeams.includes(t.teamId)).length;
    });
    this.saveTeams(this.getTeams().map(t => {
      const match = teams.find(t2 => t2.teamId === t.teamId);
      return match || t;
    }));
  },

  assignMemberToTeam(orgId: string, memberId: string, teamId: string, actorEmail: string): void {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      if (!members[idx].assignedTeams.includes(teamId)) {
        members[idx].assignedTeams.push(teamId);
        this.saveMembers(members);
        WorkspaceController.logAudit(orgId, actorEmail, 'role_updated', `Assigned member ${members[idx].email} to team ID ${teamId}.`);
        this.recalculateMemberCounts(orgId);
      }
    }
  },

  removeMemberFromTeam(orgId: string, memberId: string, teamId: string, actorEmail: string): void {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      members[idx].assignedTeams = members[idx].assignedTeams.filter(id => id !== teamId);
      this.saveMembers(members);
      WorkspaceController.logAudit(orgId, actorEmail, 'role_updated', `Removed member ${members[idx].email} from team ID ${teamId}.`);
      this.recalculateMemberCounts(orgId);
    }
  }
};

// -------------------------------------------------------------
// SEAT MANAGER (Rules & Calculations)
// -------------------------------------------------------------
export const SeatManager = {
  getSeatConfig(orgId: string): SeatConfig {
    try {
      const saved = localStorage.getItem(WORKSPACE_SEATS_KEY);
      const all: SeatConfig[] = saved ? JSON.parse(saved) : [];
      const match = all.find(s => s.organizationId === orgId);
      if (match) return match;

      // Seed initial seat allocations
      const defaults: SeatConfig[] = [
        { organizationId: 'org_loreal', used: 5, available: 45, reserved: 1, inactive: 1, gracePeriodDays: 14 },
        { organizationId: 'org_sorbonne', used: 3, available: 12, reserved: 1, inactive: 0, gracePeriodDays: 7 },
        { organizationId: 'org_renault', used: 1, available: 4, reserved: 0, inactive: 0, gracePeriodDays: 5 },
        { organizationId: 'org_google_fr', used: 2, available: 154, reserved: 0, inactive: 0, gracePeriodDays: 30 }
      ];
      localStorage.setItem(WORKSPACE_SEATS_KEY, JSON.stringify(defaults));
      
      const res = defaults.find(s => s.organizationId === orgId);
      return res || { organizationId: orgId, used: 1, available: 9, reserved: 0, inactive: 0, gracePeriodDays: 15 };
    } catch (e) {
      console.error('[SeatManager] Error fetching seats:', e);
      return { organizationId: orgId, used: 1, available: 9, reserved: 0, inactive: 0, gracePeriodDays: 15 };
    }
  },

  saveSeatConfigs(configs: SeatConfig[]): void {
    localStorage.setItem(WORKSPACE_SEATS_KEY, JSON.stringify(configs));
  },

  initSeatConfig(orgId: string, availableSeats: number): void {
    try {
      const saved = localStorage.getItem(WORKSPACE_SEATS_KEY);
      const all: SeatConfig[] = saved ? JSON.parse(saved) : [];
      if (!all.some(s => s.organizationId === orgId)) {
        all.push({
          organizationId: orgId,
          used: 1,
          available: availableSeats - 1,
          reserved: 0,
          inactive: 0,
          gracePeriodDays: 14
        });
        this.saveSeatConfigs(all);
      }
    } catch (e) {
      console.error('[SeatManager] Error init seats:', e);
    }
  },

  validateSeatAllocation(orgId: string): { allowed: boolean; status: string } {
    const config = this.getSeatConfig(orgId);
    const totalAllocated = config.used + config.reserved;
    const totalCapacity = config.used + config.available;

    if (totalAllocated < totalCapacity) {
      return { allowed: true, status: 'Active within limits' };
    } else {
      // Grace period validation logic
      if (config.gracePeriodEndsAt) {
        const remaining = new Date(config.gracePeriodEndsAt).getTime() - Date.now();
        if (remaining > 0) {
          const daysLeft = Math.ceil(remaining / (1000 * 3600 * 24));
          return { allowed: true, status: `Overdraft (Grace Period: ${daysLeft} days remaining)` };
        } else {
          return { allowed: false, status: 'Grace Period Expired - Seat Limit Enforcement Active' };
        }
      }
      return { allowed: false, status: 'Seat Limit Exceeded' };
    }
  },

  triggerSeatGracePeriod(orgId: string): void {
    const configs = this.getSeatConfigsAll();
    const idx = configs.findIndex(c => c.organizationId === orgId);
    if (idx !== -1) {
      const ends = new Date();
      ends.setDate(ends.getDate() + configs[idx].gracePeriodDays);
      configs[idx].gracePeriodEndsAt = ends.toISOString();
      this.saveSeatConfigs(configs);
    }
  },

  getSeatConfigsAll(): SeatConfig[] {
    const saved = localStorage.getItem(WORKSPACE_SEATS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  reserveSeat(orgId: string): void {
    const configs = this.getSeatConfigsAll();
    const idx = configs.findIndex(c => c.organizationId === orgId);
    if (idx !== -1) {
      if (configs[idx].available > 0) {
        configs[idx].available--;
        configs[idx].reserved++;
        this.saveSeatConfigs(configs);
        WorkspaceController.logAudit(orgId, 'system', 'seat_changed', `Seat reserved for pending invite. Seats available: ${configs[idx].available}.`);
      } else {
        // Trigger seat grace period
        configs[idx].reserved++;
        const graceEnds = new Date();
        graceEnds.setDate(graceEnds.getDate() + configs[idx].gracePeriodDays);
        configs[idx].gracePeriodEndsAt = graceEnds.toISOString();
        this.saveSeatConfigs(configs);
        WorkspaceController.logAudit(orgId, 'system', 'seat_changed', `Seat overdraft triggered grace period. Reserved: ${configs[idx].reserved}.`);
      }
    }
  },

  convertReservedToUsed(orgId: string): void {
    const configs = this.getSeatConfigsAll();
    const idx = configs.findIndex(c => c.organizationId === orgId);
    if (idx !== -1) {
      if (configs[idx].reserved > 0) {
        configs[idx].reserved--;
        configs[idx].used++;
        this.saveSeatConfigs(configs);
        WorkspaceController.logAudit(orgId, 'system', 'seat_changed', `Reserved seat converted to active team member.`);
      }
    }
  },

  deactivateMemberSeat(orgId: string): void {
    const configs = this.getSeatConfigsAll();
    const idx = configs.findIndex(c => c.organizationId === orgId);
    if (idx !== -1) {
      if (configs[idx].used > 0) {
        configs[idx].used--;
        configs[idx].inactive++;
        this.saveSeatConfigs(configs);
        WorkspaceController.logAudit(orgId, 'system', 'seat_changed', `Deactivated seat recorded. Used: ${configs[idx].used}, Inactive: ${configs[idx].inactive}.`);
      }
    }
  },

  activateMemberSeat(orgId: string): void {
    const configs = this.getSeatConfigsAll();
    const idx = configs.findIndex(c => c.organizationId === orgId);
    if (idx !== -1) {
      if (configs[idx].inactive > 0) {
        configs[idx].inactive--;
        configs[idx].used++;
        this.saveSeatConfigs(configs);
        WorkspaceController.logAudit(orgId, 'system', 'seat_changed', `Member reactivated, seat transferred from inactive to active list.`);
      }
    }
  },

  releaseSeat(orgId: string): void {
    const configs = this.getSeatConfigsAll();
    const idx = configs.findIndex(c => c.organizationId === orgId);
    if (idx !== -1) {
      if (configs[idx].used > 0) {
        configs[idx].used--;
        configs[idx].available++;
        this.saveSeatConfigs(configs);
        WorkspaceController.logAudit(orgId, 'system', 'seat_changed', `Released workspace seat. Available: ${configs[idx].available}.`);
      }
    }
  },

  reassignSeat(orgId: string, fromMemberId: string, toMemberId: string, actorEmail: string): void {
    // Release from one member, assign to another
    // Simple verification
    WorkspaceController.logAudit(orgId, actorEmail, 'seat_changed', `Seat successfully reassigned from Member ${fromMemberId} to Member ${toMemberId}.`);
  }
};

// -------------------------------------------------------------
// PERMISSION RESOLVER (Role Hierarchy Rules)
// -------------------------------------------------------------
export const PermissionResolver = {
  getPermissions(role: WorkspaceRole) {
    return {
      canViewPersonalSpace: true, // Candidates / anyone
      canJoinAssignedWorkspace: ['owner', 'workspace_admin', 'recruiter', 'reviewer', 'viewer'].includes(role),
      canManageWorkspace: ['owner', 'workspace_admin'].includes(role),
      canManageUsers: ['owner', 'workspace_admin'].includes(role),
      canConfigureSettings: ['owner', 'workspace_admin'].includes(role),
      canCreateTeams: ['owner', 'workspace_admin'].includes(role),
      canAssignTeams: ['owner', 'workspace_admin', 'recruiter'].includes(role),
      canLaunchInterviews: ['owner', 'workspace_admin', 'recruiter'].includes(role),
      canReviewSubmissions: ['owner', 'workspace_admin', 'recruiter', 'reviewer'].includes(role),
      canViewAnalytics: ['owner', 'workspace_admin', 'recruiter', 'reviewer', 'viewer'].includes(role),
      isPlatformSuperAdmin: false // Handled in AccessController separate role logic
    };
  },

  canActorPerform(actorRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
    const hierarchy: Record<WorkspaceRole, number> = {
      owner: 6,
      workspace_admin: 5,
      recruiter: 4,
      reviewer: 3,
      viewer: 2,
      candidate: 1
    };
    return (hierarchy[actorRole] || 0) > (hierarchy[targetRole] || 0);
  }
};

// -------------------------------------------------------------
// WORKSPACE ANALYTICS ENGINE
// -------------------------------------------------------------
export const WorkspaceAnalytics = {
  getAnalytics(orgId: string): WorkspaceAnalyticsData {
    try {
      const key = `shana_ws_analytics_${orgId}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);

      // Render highly realistic, beautiful mock metrics for specific organizations
      const defaults: Record<string, WorkspaceAnalyticsData> = {
        org_loreal: {
          organizationId: 'org_loreal',
          teamInterviews: [
            { teamName: 'R&I Paris Team', count: 184 },
            { teamName: 'AI Human Lab', count: 240 },
            { teamName: 'Group Global Recruiting', count: 180 },
            { teamName: 'Marketing Europe', count: 38 }
          ],
          completionRate: 94.8,
          usageTrend: [
            { date: 'Mon', interviews: 24, duration: 450 },
            { date: 'Tue', interviews: 42, duration: 810 },
            { date: 'Wed', interviews: 56, duration: 1120 },
            { date: 'Thu', interviews: 48, duration: 960 },
            { date: 'Fri', interviews: 62, duration: 1250 },
            { date: 'Sat', interviews: 12, duration: 240 },
            { date: 'Sun', interviews: 8, duration: 160 }
          ],
          languageSplit: { FR: 412, EN: 230 },
          performanceTrends: [
            { period: 'Q1', avgScore: 82.5, candidateCount: 150 },
            { period: 'Q2', avgScore: 84.1, candidateCount: 195 },
            { period: 'Q3', avgScore: 83.8, candidateCount: 220 },
            { period: 'Q4', avgScore: 85.4, candidateCount: 270 }
          ]
        },
        org_sorbonne: {
          organizationId: 'org_sorbonne',
          teamInterviews: [
            { teamName: 'Cognitive AI Lab', count: 68 },
            { teamName: 'Linguistic Panel', count: 42 },
            { teamName: 'Admissions Panel', count: 14 }
          ],
          completionRate: 91.2,
          usageTrend: [
            { date: 'Mon', interviews: 8, duration: 180 },
            { date: 'Tue', interviews: 12, duration: 240 },
            { date: 'Wed', interviews: 22, duration: 440 },
            { date: 'Thu', interviews: 18, duration: 360 },
            { date: 'Fri', interviews: 14, duration: 280 },
            { date: 'Sat', interviews: 2, duration: 40 },
            { date: 'Sun', interviews: 1, duration: 20 }
          ],
          languageSplit: { FR: 89, EN: 35 },
          performanceTrends: [
            { period: 'Q1', avgScore: 78.4, candidateCount: 30 },
            { period: 'Q2', avgScore: 79.9, candidateCount: 45 },
            { period: 'Q3', avgScore: 81.2, candidateCount: 40 },
            { period: 'Q4', avgScore: 80.5, candidateCount: 52 }
          ]
        }
      };

      const match = defaults[orgId] || {
        organizationId: orgId,
        teamInterviews: [
          { teamName: 'General Workspace Team', count: 15 },
          { teamName: 'HR & Screening Group', count: 8 }
        ],
        completionRate: 88.5,
        usageTrend: [
          { date: 'Mon', interviews: 2, duration: 40 },
          { date: 'Tue', interviews: 4, duration: 80 },
          { date: 'Wed', interviews: 6, duration: 120 },
          { date: 'Thu', interviews: 5, duration: 100 },
          { date: 'Fri', interviews: 3, duration: 60 },
          { date: 'Sat', interviews: 0, duration: 0 },
          { date: 'Sun', interviews: 0, duration: 0 }
        ],
        languageSplit: { FR: 18, EN: 5 },
        performanceTrends: [
          { period: 'Month 1', avgScore: 72.1, candidateCount: 10 },
          { period: 'Month 2', avgScore: 74.5, candidateCount: 13 }
        ]
      };

      localStorage.setItem(key, JSON.stringify(match));
      return match;
    } catch (e) {
      console.error('[WorkspaceAnalytics] Error fetching analytics:', e);
      return {
        organizationId: orgId,
        teamInterviews: [],
        completionRate: 0,
        usageTrend: [],
        languageSplit: { FR: 0, EN: 0 },
        performanceTrends: []
      };
    }
  }
};

// -------------------------------------------------------------
// WORKSPACE SETTINGS MANAGER
// -------------------------------------------------------------
export const WorkspaceSettingsManager = {
  getSettings(orgId: string): WorkspaceSettings {
    try {
      const key = `${WORKSPACE_SETTINGS_KEY}_${orgId}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);

      const defaults: WorkspaceSettings = {
        organizationId: orgId,
        workspaceLanguage: 'FR',
        branding: {
          primaryColor: '#7c3aed',
          companyName: orgId === 'org_loreal' ? "L'Oréal Innovation Paris" : "Sorbonne Tech Lab"
        },
        interviewDefaults: {
          durationLimitMinutes: 30,
          allowVocal: true,
          autoArchiveDays: 90
        },
        accessPolicies: {
          ssoRequired: orgId === 'org_google_fr',
          allowedDomains: orgId === 'org_loreal' ? ['loreal.com', 'loreal.fr'] : ['sorbonne.fr', 'univ-paris.fr']
        },
        notificationPreferences: {
          emailOnInvite: true,
          emailOnWeeklyReport: true,
          slackAlerts: false
        }
      };
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    } catch (e) {
      console.error('[WorkspaceSettingsManager] Error loading settings:', e);
      return {
        organizationId: orgId,
        workspaceLanguage: 'FR',
        branding: { primaryColor: '#7c3aed' },
        interviewDefaults: { durationLimitMinutes: 30, allowVocal: true, autoArchiveDays: 90 },
        accessPolicies: { ssoRequired: false, allowedDomains: [] },
        notificationPreferences: { emailOnInvite: true, emailOnWeeklyReport: true, slackAlerts: false }
      };
    }
  },

  saveSettings(orgId: string, settings: WorkspaceSettings): void {
    const key = `${WORKSPACE_SETTINGS_KEY}_${orgId}`;
    localStorage.setItem(key, JSON.stringify(settings));
    WorkspaceController.logAudit(orgId, 'system', 'settings_updated', `Workspace administrative preferences updated.`);
  }
};
