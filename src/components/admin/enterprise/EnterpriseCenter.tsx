import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  Layers, 
  Activity, 
  RefreshCw, 
  Plus, 
  Search, 
  Sliders, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Settings, 
  UserPlus, 
  FolderArchive, 
  Languages, 
  Palette, 
  Bell, 
  Key, 
  Sparkles, 
  Clock, 
  ArrowUpRight, 
  Check, 
  Trash2, 
  Info,
  Calendar,
  Lock,
  Compass,
  PieChart,
  Edit3,
  HelpCircle,
  Eye,
  Briefcase
} from 'lucide-react';
import { User } from '../../../types';
import { 
  WorkspaceRole, 
  WorkspaceMember, 
  WorkspaceInvitation, 
  Team, 
  WorkspaceOrganization, 
  SeatConfig, 
  WorkspaceSettings, 
  WorkspaceAnalyticsData 
} from '../../../modules/team';
import { 
  WorkspaceController, 
  OrganizationEngine, 
  TeamManager, 
  SeatManager, 
  PermissionResolver, 
  WorkspaceAnalytics, 
  WorkspaceSettingsManager,
  WorkspaceAuditLog
} from '../../../services/workspace';

interface EnterpriseCenterProps {
  currentUser: User;
  lang?: 'FR' | 'EN';
}

type EnterpriseTab = 'dashboard' | 'organizations' | 'teams' | 'members' | 'seats' | 'analytics' | 'settings' | 'ats' | 'frameworks';

export default function EnterpriseCenter({ currentUser, lang = 'FR' }: EnterpriseCenterProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  const [activeTab, setActiveTab] = useState<EnterpriseTab>('dashboard');

  // Multi-tenant Org Context
  const [selectedOrgId, setSelectedOrgId] = useState<string>('org_loreal');

  // State collections
  const [organizations, setOrganizations] = useState<WorkspaceOrganization[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allMembers, setAllMembers] = useState<WorkspaceMember[]>([]);
  const [allInvites, setAllInvites] = useState<WorkspaceInvitation[]>([]);
  const [activeOrgSeats, setActiveOrgSeats] = useState<SeatConfig | null>(null);
  const [activeOrgSettings, setActiveOrgSettings] = useState<WorkspaceSettings | null>(null);
  const [activeOrgAnalytics, setActiveOrgAnalytics] = useState<WorkspaceAnalyticsData | null>(null);
  const [auditLogs, setAuditLogs] = useState<WorkspaceAuditLog[]>([]);

  // Interactive Form States
  // Org create/edit
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<WorkspaceOrganization | null>(null);
  const [orgForm, setOrgForm] = useState({ name: '', owner: '', plan: 'Standard' });

  // Team create/rename
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamFormName, setTeamFormName] = useState('');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Member invite
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('recruiter');

  // Dynamic Simulators for Invitation Accept Flow
  const [simJoinName, setSimJoinName] = useState('');

  // 30 Seconds Live Timer Ticker for Refresh
  const [secondsToRefresh, setSecondsToRefresh] = useState(30);

  // Notification feedback banner
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const triggerFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ATS Integration State
  const [atsConnections, setAtsConnections] = useState([
    { id: 'greenhouse', name: 'Greenhouse', logo: '🟢', status: 'connected', apiKey: 'gh_live_••••••••9a2b', subdomain: 'loreal-luxe', lastSynced: '2026-07-04 03:30', jobCount: 14 },
    { id: 'lever', name: 'Lever', logo: '🔵', status: 'disconnected', apiKey: '', subdomain: '', lastSynced: 'Never', jobCount: 0 },
    { id: 'workday', name: 'Workday ERP', logo: '🟠', status: 'disconnected', apiKey: '', subdomain: '', lastSynced: 'Never', jobCount: 0 },
    { id: 'ashby', name: 'Ashby', logo: '🟣', status: 'disconnected', apiKey: '', subdomain: '', lastSynced: 'Never', jobCount: 0 }
  ]);
  const [selectedAts, setSelectedAts] = useState('greenhouse');
  const [isSyncingAts, setIsSyncingAts] = useState(false);
  const [atsLogs, setAtsLogs] = useState([
    { id: 'l1', time: '2026-07-04 03:30:22', type: 'success', msg: lang === 'FR' ? 'Synchronisation complète effectuée avec GREENHOUSE' : 'Bidirectional schema sync completed with GREENHOUSE' },
    { id: 'l2', time: '2026-07-04 02:15:10', type: 'success', msg: lang === 'FR' ? 'Candidat "Arianne" exporté vers l\'étape Greenhouse: "Entretien Technique" (Score: 89/100)' : 'Candidate "Arianne" exported to Greenhouse stage: "Technical Screen" (Score: 89/100)' },
    { id: 'l3', time: '2026-07-03 18:44:02', type: 'warning', msg: lang === 'FR' ? 'Synchro ATS: Offre expirée ignorée "Stagiaire Marketing"' : 'ATS Sync Notice: Skipped deprecated job post "Marketing Associate - Intern"' }
  ]);
  const [atsForm, setAtsForm] = useState({
    apiKey: 'gh_live_••••••••9a2b',
    subdomain: 'loreal-luxe',
    webhookSecret: 'whsec_8fb4a1a9e223'
  });

  // Company-Specific Interview Frameworks State
  const [frameworks, setFrameworks] = useState([
    {
      id: 'fw_luxury_retail',
      name: lang === 'FR' ? "Référentiel Cognitif L'Oréal Luxe" : "L'Oréal Luxury Retail Cognitive Framework",
      targetRole: lang === 'FR' ? "Responsable de Boutique & Conseiller Luxe" : "Store Manager & Luxury Consultant",
      creator: "michele.h@loreal.com",
      skills: [
        { name: lang === 'FR' ? "Adhésion Culturelle & Ambassadeur de Marque" : "Cultural Fit & Brand Ambassadorship", weight: 30 },
        { name: lang === 'FR' ? "Intelligence Émotionnelle (EQ)" : "Emotional Intelligence (EQ)", weight: 25 },
        { name: lang === 'FR' ? "Résolution de Problèmes en Vente" : "Problem Solving under Retail Pressure", weight: 25 },
        { name: lang === 'FR' ? "Éloquence et Vocabulaire Premium" : "Luxury Hospitality Lexicon Accuracy", weight: 20 }
      ],
      aiDirectives: lang === 'FR' 
        ? "Évaluez l'utilisation par le candidat d'un vocabulaire haut de gamme. Posez des questions de mise en situation sur la gestion de clients exigeants." 
        : "Assess the candidate's use of vocabulary related to high-end hospitality. Structure scenario questions about demanding retail customers.",
      questions: [
        lang === 'FR' 
          ? "Comment réagissez-vous face à un client qui exprime une insatisfaction subtile quant à l'ambiance de la boutique ?" 
          : "How do you handle a client who expresses subtle dissatisfaction with the ambient experience of our luxury boutique?",
        lang === 'FR'
          ? "Décrivez une expérience où vous avez transformé une interaction de vente simple en un moment mémorable de marque."
          : "Describe a time you transformed a regular client interaction into an exceptional brand experience."
      ],
      isActive: true
    },
    {
      id: 'fw_tech_lead',
      name: lang === 'FR' ? "Rubrique Architecture Cloud & IA" : "Enterprise Cognitive Engineering Rubric",
      targetRole: lang === 'FR' ? "Architecte Solutions Cloud Senior" : "Senior Cloud Architect",
      creator: "tech-talent@loreal.com",
      skills: [
        { name: "Distributed Systems Troubleshooting", weight: 40 },
        { name: "Strategic Architectural Scaling", weight: 30 },
        { name: "Technical Team Mentorship Capability", weight: 30 }
      ],
      aiDirectives: "Enforce high-density architectural questions. Present failure scenarios regarding state-consistency across active-active geographic zones.",
      questions: [
        "Explain how you would handle write-heavy synchronization conflicts across multiple cloud regions under network partition.",
        "How do you manage mentoring mid-level engineers who resist adopting strict architectural standards?"
      ],
      isActive: false
    }
  ]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState('fw_luxury_retail');
  const [showFrameworkForm, setShowFrameworkForm] = useState(false);
  const [frameworkForm, setFrameworkForm] = useState({
    name: '',
    targetRole: '',
    aiDirectives: '',
    skill1: 'Cultural Alignment', weight1: 30,
    skill2: 'Technical Aptitude', weight2: 30,
    skill3: 'Communication Clarity', weight3: 40,
    question1: '',
    question2: ''
  });

  // LOAD DATA FROM SERVICES
  const reloadData = () => {
    const orgList = OrganizationEngine.getOrganizations();
    setOrganizations(orgList);

    // Verify if our active organization context still exists, otherwise default
    let activeOrg = selectedOrgId;
    if (!orgList.some(o => o.organizationId === selectedOrgId)) {
      activeOrg = orgList[0]?.organizationId || 'org_loreal';
      setSelectedOrgId(activeOrg);
    }

    setAllTeams(TeamManager.getTeams());
    setAllMembers(TeamManager.getMembers());
    setAllInvites(TeamManager.getInvitations());
    setActiveOrgSeats(SeatManager.getSeatConfig(activeOrg));
    setActiveOrgSettings(WorkspaceSettingsManager.getSettings(activeOrg));
    setActiveOrgAnalytics(WorkspaceAnalytics.getAnalytics(activeOrg));
    setAuditLogs(WorkspaceController.getAuditLogs(activeOrg));
  };

  useEffect(() => {
    reloadData();
  }, [selectedOrgId]);

  // Handle 30s auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsToRefresh((prev) => {
        if (prev <= 1) {
          reloadData();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedOrgId]);

  const forceManualRefresh = () => {
    reloadData();
    setSecondsToRefresh(30);
    triggerFeedback(
      lang === 'FR' 
        ? "Registres actualisés avec succès." 
        : "Workspaces ledger synchronized successfully."
    );
  };

  // ACTIONS: ORGANIZATIONS
  const handleOpenCreateOrg = () => {
    setEditingOrg(null);
    setOrgForm({ name: '', owner: '', plan: 'Standard' });
    setShowOrgModal(true);
  };

  const handleOpenEditOrg = (org: WorkspaceOrganization) => {
    setEditingOrg(org);
    setOrgForm({ name: org.name, owner: org.owner, plan: org.plan });
    setShowOrgModal(true);
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgForm.name || !orgForm.owner) {
      triggerFeedback(lang === 'FR' ? "Tous les champs sont requis." : "All fields are required.", "error");
      return;
    }

    if (editingOrg) {
      OrganizationEngine.updateOrganization(editingOrg.organizationId, orgForm.name, orgForm.plan, currentUser.email);
      triggerFeedback(lang === 'FR' ? "Organisation mise à jour !" : "Organization updated successfully!");
    } else {
      const newOrg = OrganizationEngine.createOrganization(orgForm.name, orgForm.owner, orgForm.plan, currentUser.email);
      setSelectedOrgId(newOrg.organizationId);
      triggerFeedback(lang === 'FR' ? `Organisation ${orgForm.name} créée !` : `Organization ${orgForm.name} created!`);
    }
    setShowOrgModal(false);
    reloadData();
  };

  const handleToggleOrgStatus = (orgId: string, status: 'enabled' | 'disabled' | 'archived') => {
    OrganizationEngine.toggleOrganizationStatus(orgId, status, currentUser.email);
    triggerFeedback(
      lang === 'FR' 
        ? `Statut de l'organisation mis à jour : ${status}` 
        : `Organization status set to: ${status}`
    );
    reloadData();
  };

  // ACTIONS: TEAMS
  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamFormName.trim()) return;

    TeamManager.createTeam(selectedOrgId, teamFormName, currentUser.email);
    setTeamFormName('');
    setShowTeamForm(false);
    triggerFeedback(lang === 'FR' ? "Équipe créée avec succès !" : "Team created successfully!");
    reloadData();
  };

  const handleRenameTeam = (team: Team) => {
    const nextName = prompt(lang === 'FR' ? "Nouveau nom de l'équipe:" : "Enter new team name:", team.name);
    if (nextName && nextName.trim()) {
      TeamManager.renameTeam(selectedOrgId, team.teamId, nextName, currentUser.email);
      triggerFeedback(lang === 'FR' ? "Équipe renommée." : "Team renamed successfully.");
      reloadData();
    }
  };

  const handleArchiveTeam = (teamId: string) => {
    if (confirm(lang === 'FR' ? "Êtes-vous sûr d'archiver cette équipe ?" : "Are you sure you want to archive this team?")) {
      TeamManager.archiveTeam(selectedOrgId, teamId, currentUser.email);
      triggerFeedback(lang === 'FR' ? "Équipe archivée." : "Team moved to archive.");
      reloadData();
    }
  };

  // ACTIONS: MEMBERS & INVITES
  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      TeamManager.inviteMember(selectedOrgId, inviteEmail, inviteRole, currentUser.email);
      setInviteEmail('');
      setShowInviteForm(false);
      triggerFeedback(
        lang === 'FR' 
          ? "Invitation envoyée ! Place réservée." 
          : "Invitation sent! Workspace seat reserved."
      );
      reloadData();
    } catch (err: any) {
      triggerFeedback(err.message || "Failed to invite member", "error");
    }
  };

  const handleAcceptInviteSimulated = (inviteId: string) => {
    const name = prompt(lang === 'FR' ? "Entrez le nom du membre:" : "Enter candidate/member name:", "Arianne");
    if (!name) return;

    const res = TeamManager.acceptInvitation(inviteId, name);
    if (res) {
      triggerFeedback(
        lang === 'FR' 
          ? `Invitation acceptée par ${name}. Rôle ${res.role} activé.` 
          : `Invitation accepted by ${name}. Role ${res.role} assigned.`
      );
      reloadData();
    }
  };

  const handleChangeMemberRole = (memberId: string, role: WorkspaceRole) => {
    TeamManager.changeMemberRole(selectedOrgId, memberId, role, currentUser.email);
    triggerFeedback(lang === 'FR' ? "Rôle mis à jour." : "Member workspace role updated.");
    reloadData();
  };

  const handleToggleMemberStatus = (member: WorkspaceMember) => {
    try {
      if (member.status === 'active') {
        TeamManager.deactivateMember(selectedOrgId, member.id, currentUser.email);
        triggerFeedback(lang === 'FR' ? "Membre désactivé. Place libérée." : "Member deactivated. Seat released.");
      } else {
        TeamManager.reactivateMember(selectedOrgId, member.id, currentUser.email);
        triggerFeedback(lang === 'FR' ? "Membre réactivé. Place occupée." : "Member reactivated. Seat assigned.");
      }
      reloadData();
    } catch (err: any) {
      triggerFeedback(err.message, "error");
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm(lang === 'FR' ? "Retirer ce membre du workspace ?" : "Remove this member from workspace?")) {
      TeamManager.removeMember(selectedOrgId, memberId, currentUser.email);
      triggerFeedback(lang === 'FR' ? "Membre retiré." : "Member removed successfully.");
      reloadData();
    }
  };

  // ACTIONS: SEATS ADJUSTMENT
  const handleReassignSeatSimulated = (fromId: string) => {
    const availableTargets = allMembers.filter(m => m.organizationId === selectedOrgId && m.id !== fromId);
    if (availableTargets.length === 0) {
      triggerFeedback(lang === 'FR' ? "Aucun autre membre disponible." : "No other member available in workspace.", "error");
      return;
    }

    const toId = availableTargets[0].id;
    SeatManager.reassignSeat(selectedOrgId, fromId, toId, currentUser.email);
    triggerFeedback(
      lang === 'FR' 
        ? "Réaffectation de licence simulée avec succès !" 
        : "Mock license seat reassignment executed!"
    );
    reloadData();
  };

  // ACTIONS: WORKSPACE SETTINGS SAVE
  const handleSaveWorkspaceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgSettings) return;

    WorkspaceSettingsManager.saveSettings(selectedOrgId, activeOrgSettings);
    triggerFeedback(
      lang === 'FR' 
        ? "Paramètres d'administration enregistrés." 
        : "Workspace administrative preferences saved."
    );
    reloadData();
  };

  // GET AGGREGATE SUMMARY COUNTS
  const activeOrgObj = organizations.find(o => o.organizationId === selectedOrgId);
  const activeOrgMembers = allMembers.filter(m => m.organizationId === selectedOrgId);
  const activeOrgTeams = allTeams.filter(t => t.organizationId === selectedOrgId && t.status === 'active');
  const activeRecruitersCount = activeOrgMembers.filter(m => m.role === 'recruiter' && m.status === 'active').length;
  const activeCandidatesCount = activeOrgMembers.filter(m => m.role === 'candidate' && m.status === 'active').length;

  return (
    <div className="space-y-8" id="enterprise-workspace-console-root">

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-center text-xs font-bold transition-all shadow-md animate-bounce ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* CORE HERO CONSOLE HEADER */}
      <div className="bg-stone-900 text-stone-100 p-8 rounded-[32px] border border-stone-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg">
                <Building className="w-5 h-5" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-violet-400 font-bold">
                ENTERPRISE CONSOLE
              </span>
              <span className="px-2 py-0.5 bg-violet-500/10 text-violet-300 rounded-full text-[9px] font-mono border border-violet-500/20 uppercase font-bold">
                PHASE 29 — ENTERPRISE RECRUITER PLATFORM
              </span>
            </div>
            <h1 className="font-sans font-bold text-2xl tracking-tight text-white">
              {lang === 'FR' ? "Espace Entreprise & Multi-Locataires" : "Enterprise Workspace Administration"}
            </h1>
            <p className="text-stone-400 text-xs max-w-xl leading-relaxed font-medium">
              {lang === 'FR' 
                ? "Gérez l'écosystème organisationnel : pilotez les équipes, surveillez les places de licence, auditez les recrutements et configurez la conformité multi-tenant." 
                : "Orchestrate multi-tenant operations, allocate seat licenses, create cross-functional recruiter teams, audit activities, and access high-fidelity shared analytics."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* MULTI-TENANT SWITCHER */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-mono text-stone-400 font-bold block">
                {lang === 'FR' ? "ORGANISATION ACTIVE" : "ACTIVE TENANT CONTEXT"}
              </span>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="bg-stone-800 border border-stone-700 text-stone-100 px-4 py-2 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {organizations.map(org => (
                  <option key={org.organizationId} value={org.organizationId}>
                    {org.name} ({org.plan})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={forceManualRefresh}
              className="p-3 bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white rounded-xl border border-stone-700 transition-all flex items-center gap-2 self-end cursor-pointer active:scale-95"
              title="Force Refresh Ledgers"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="font-mono text-[10px] text-stone-400 font-bold">
                {secondsToRefresh}s
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTIONS TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200" id="enterprise-tabs-nav">
        {[
          { id: 'dashboard', label: lang === 'FR' ? "Tableau de Bord" : "Dashboard Monitor", icon: Activity },
          { id: 'organizations', label: lang === 'FR' ? "Organisations" : "Tenant Orgs", icon: Building },
          { id: 'teams', label: lang === 'FR' ? "Équipes" : "Teams Ledger", icon: Layers },
          { id: 'members', label: lang === 'FR' ? "Membres & Invites" : "Members Flow", icon: Users },
          { id: 'seats', label: lang === 'FR' ? "Licences & Sièges" : "Seat Management", icon: Shield },
          { id: 'ats', label: lang === 'FR' ? "Intégration ATS" : "ATS Connectors", icon: RefreshCw },
          { id: 'frameworks', label: lang === 'FR' ? "Modèles d'Entretien" : "Interview Frameworks", icon: Sliders },
          { id: 'analytics', label: lang === 'FR' ? "Analyses Partagées" : "Shared Analytics", icon: PieChart },
          { id: 'settings', label: lang === 'FR' ? "Paramètres" : "Workspace Settings", icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as EnterpriseTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shrink-0 transition-all ${
                isActive 
                  ? 'bg-violet-950 text-white shadow-md' 
                  : 'text-stone-500 hover:text-stone-950 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB VIEWS RENDERER */}
      <div className="animate-fade-in text-left">

        {/* SECTION 1: ENTERPRISE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8" id="enterprise-view-dashboard">
            
            {/* AGGREGATES PANELS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              
              <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-stone-400">
                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold">ORGANIZATIONS</span>
                  <Building className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-stone-900">{organizations.length}</h3>
                  <p className="text-[10px] text-stone-500 font-semibold">{lang === 'FR' ? "Comptes d'entreprise" : "Tenant instances"}</p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-stone-400">
                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold">ACTIVE TEAMS</span>
                  <Layers className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-stone-900">{activeOrgTeams.length}</h3>
                  <p className="text-[10px] text-stone-500 font-semibold">{lang === 'FR' ? "Équipes actives" : "Active corporate squads"}</p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-stone-400">
                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold">RECRUITERS</span>
                  <Users className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-stone-900">{activeRecruitersCount}</h3>
                  <p className="text-[10px] text-stone-500 font-semibold">{lang === 'FR' ? "Recruteurs actifs" : "Active recruiters"}</p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-stone-400">
                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold">CANDIDATES</span>
                  <UserPlus className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-stone-900">{activeCandidatesCount}</h3>
                  <p className="text-[10px] text-stone-500 font-semibold">{lang === 'FR' ? "Candidats reliés" : "Active candidates"}</p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-stone-400">
                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold">SEAT CAPACITY</span>
                  <Shield className="w-4 h-4 text-teal-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-stone-900">
                    {activeOrgSeats ? `${activeOrgSeats.used}/${activeOrgSeats.used + activeOrgSeats.available}` : 'N/A'}
                  </h3>
                  <p className="text-[10px] text-stone-500 font-semibold">{lang === 'FR' ? "Licences allouées" : "Active seat license ratios"}</p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-stone-400">
                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold">STATUS</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 text-center truncate uppercase">
                    {activeOrgObj?.status || 'ENABLED'}
                  </h3>
                  <p className="text-[10px] text-stone-500 font-semibold mt-1">{lang === 'FR' ? "État opérationnel" : "Operational state"}</p>
                </div>
              </div>

            </div>

            {/* LIVE ACTIVITY FEED & AUDIT LOGS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* CURRENT ACTIVE ORGANIZATION SNAPSHOT */}
              <div className="bg-white border border-stone-200 p-6 rounded-[24px] space-y-4 lg:col-span-1 shadow-2xs">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-stone-900">{lang === 'FR' ? "Fiche Diagnostic Locataire" : "Tenant Profile Summary"}</h4>
                  <p className="text-[11px] text-stone-500 font-semibold">{lang === 'FR' ? "Vue consolidée du compte client actif." : "Consolidated diagnostics of currently active organizational scope."}</p>
                </div>

                <div className="divide-y divide-stone-100 text-xs font-semibold text-stone-700">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-450">ID</span>
                    <span className="font-mono font-bold text-stone-900">{activeOrgObj?.organizationId}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-450">{lang === 'FR' ? "Propriétaire" : "Owner"}</span>
                    <span className="text-stone-900 font-bold truncate max-w-[180px]">{activeOrgObj?.owner}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-450">{lang === 'FR' ? "Forfait" : "SaaS Plan"}</span>
                    <span className="text-stone-900 font-black text-violet-700 uppercase">{activeOrgObj?.plan}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-450">{lang === 'FR' ? "Date de création" : "Initialized At"}</span>
                    <span className="font-mono text-stone-500">{activeOrgObj ? new Date(activeOrgObj.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-450">{lang === 'FR' ? "Langue Locale" : "Workspace Locale"}</span>
                    <span className="font-bold flex items-center gap-1">
                      <Languages className="w-3 h-3 text-stone-400" />
                      {activeOrgSettings?.workspaceLanguage || 'FR'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 bg-stone-50 rounded-xl p-4 text-xs space-y-1">
                  <span className="text-[9px] uppercase font-mono font-bold text-stone-450">{lang === 'FR' ? "RECRUTEURS RATTACHÉS" : "ORGANIZATIONAL RECRUITERS"}</span>
                  <div className="flex -space-x-2 overflow-hidden py-1">
                    {activeOrgMembers.filter(m => m.role === 'recruiter').slice(0, 5).map(m => (
                      <div 
                        key={m.id} 
                        className="w-8 h-8 rounded-full bg-violet-600 border-2 border-white text-white flex items-center justify-center font-bold text-[10px]"
                        title={m.email}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {activeRecruitersCount === 0 && (
                      <span className="text-stone-450 text-[11px] font-medium italic">{lang === 'FR' ? "Aucun recruteur" : "No active recruiter accounts"}</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 bg-stone-50 rounded-xl p-4 text-xs space-y-2">
                  <span className="text-[9px] uppercase font-mono font-bold text-stone-450">{lang === 'FR' ? "INTEGRATIONS ET MODELES" : "INTEGRATIONS & COGNITIVE MODEL"}</span>
                  <div className="space-y-1.5 font-semibold text-stone-700 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Active ATS:</span>
                      <span className="text-stone-900 flex items-center gap-1 font-bold">
                        🟢 Greenhouse (Luxe)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">{lang === 'FR' ? "Rubrique:" : "Active Rubric:"}</span>
                      <span className="text-stone-900 truncate max-w-[120px] font-bold" title={frameworks.find(f => f.isActive)?.name}>
                        {frameworks.find(f => f.isActive)?.name || 'Default Shana Rubric'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* AUDIT LOGS FOR THIS WORKSPACE */}
              <div className="bg-white border border-stone-200 p-6 rounded-[24px] space-y-4 lg:col-span-2 shadow-2xs">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="font-sans font-bold text-sm text-stone-900">{lang === 'FR' ? "Journal d'Audit du Workspace" : "Workspace Audit Trail"}</h4>
                    <p className="text-[11px] text-stone-500 font-semibold">{lang === 'FR' ? "Historique complet des actions : invitations, sièges, deatulations." : "Central register tracking actions, role changes, and member invitations."}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-stone-100 rounded text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">
                    SECURED
                  </span>
                </div>

                <div className="divide-y divide-stone-150 max-h-72 overflow-y-auto pr-1">
                  {auditLogs.map(log => (
                    <div key={log.id} className="py-3 flex justify-between gap-3 text-xs">
                      <div className="space-y-0.5 max-w-[70%]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 truncate max-w-[140px]" title={log.actorEmail}>
                            {log.actorEmail.split('@')[0]}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold border ${
                            log.action.includes('invite') 
                              ? 'bg-blue-50 text-blue-700 border-blue-100' 
                              : log.action.includes('seat')
                              ? 'bg-teal-50 text-teal-700 border-teal-100'
                              : log.action.includes('role')
                              ? 'bg-purple-50 text-purple-700 border-purple-100'
                              : 'bg-stone-50 text-stone-700 border-stone-200'
                          }`}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-stone-500 text-[11px] leading-relaxed">{log.details}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono text-[10px] text-stone-400 font-medium">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="font-mono text-[9px] text-stone-400 font-bold uppercase">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="py-6 text-center text-stone-400 italic text-xs">
                      {lang === 'FR' ? "Aucune activité enregistrée." : "No workspace actions recorded yet."}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SECTION 2: ORGANIZATIONS */}
        {activeTab === 'organizations' && (
          <div className="bg-white border border-stone-200 p-6 rounded-[24px] shadow-2xs space-y-6" id="enterprise-view-organizations">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-sm text-stone-900">{lang === 'FR' ? "Registre des Organisations" : "Tenant Organizations Ledger"}</h4>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Gérez l'ensemble des instances d'entreprises clientes. Les actions d'effacement physique sont bloquées." : "Administrate client companies and workspaces. Hard-deletes are restricted for analytical integrity."}
                </p>
              </div>

              {isSuperAdmin && (
                <button
                  onClick={handleOpenCreateOrg}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'FR' ? "Créer une Organisation" : "Initialize Tenant Org"}</span>
                </button>
              )}
            </div>

            <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-150">
              <div className="grid grid-cols-1 md:grid-cols-6 p-4 bg-stone-50 font-mono text-[9px] text-stone-500 font-extrabold uppercase tracking-wider">
                <span className="md:col-span-2">Organization Name & ID</span>
                <span>Owner</span>
                <span>Plan</span>
                <span>Members & Seats</span>
                <span className="text-right">Actions</span>
              </div>

              {organizations.map(org => {
                const isCurrentContext = org.organizationId === selectedOrgId;
                return (
                  <div 
                    key={org.organizationId} 
                    className={`grid grid-cols-1 md:grid-cols-6 p-4 items-center gap-2 text-xs font-semibold text-stone-700 ${
                      isCurrentContext ? 'bg-violet-50/20' : 'hover:bg-stone-50/40'
                    }`}
                  >
                    <div className="md:col-span-2 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-extrabold text-stone-950 text-xs">{org.name}</span>
                        {isCurrentContext && (
                          <span className="px-1.5 py-0.5 bg-violet-100 text-violet-800 text-[9px] font-mono font-bold rounded-sm uppercase tracking-wider">
                            {lang === 'FR' ? "ACTIF" : "ACTIVE CONTEXT"}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] text-stone-400">ID: {org.organizationId}</p>
                    </div>

                    <div className="truncate pr-2 text-stone-800 font-medium" title={org.owner}>
                      {org.owner}
                    </div>

                    <div className="font-mono">
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-850 text-[10px] font-bold rounded">
                        {org.plan}
                      </span>
                    </div>

                    <div className="space-y-0.5 font-mono text-[11px]">
                      <p className="text-stone-900 font-bold">{org.memberCount} {org.memberCount > 1 ? 'members' : 'member'}</p>
                      <p className="text-stone-405 text-[10px]">
                        Created: {new Date(org.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 text-right">
                      <button
                        onClick={() => setSelectedOrgId(org.organizationId)}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                          isCurrentContext 
                            ? 'bg-violet-200 text-violet-950 cursor-default' 
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer'
                        }`}
                        disabled={isCurrentContext}
                      >
                        {isCurrentContext ? (lang === 'FR' ? 'Sélectionné' : 'Selected') : (lang === 'FR' ? 'Sélectionner' : 'Select')}
                      </button>

                      {isSuperAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEditOrg(org)}
                            className="p-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded transition-all cursor-pointer"
                            title="Edit metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {org.status === 'enabled' ? (
                            <button
                              onClick={() => handleToggleOrgStatus(org.organizationId, 'disabled')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer"
                              title="Deactivate Organization"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleOrgStatus(org.organizationId, 'enabled')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer"
                              title="Activate Organization"
                            >
                              Enable
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleOrgStatus(org.organizationId, 'archived')}
                            className="p-1 bg-stone-100 hover:bg-stone-200 text-amber-700 rounded transition-all cursor-pointer"
                            title="Archive Workspace Organization"
                          >
                            <FolderArchive className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BLOCK ARCHIVE WARNING NOTE */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  {lang === 'FR' ? "Règles administratives d'immuabilité" : "Immutable Administration Guidelines"}
                </p>
                <p className="text-[11px] leading-relaxed text-amber-850">
                  {lang === 'FR' 
                    ? "Conformément aux normes d'audit et de conformité Shana Enterprise, l'effacement direct de comptes ou d'organisations est verrouillé. Les comptes clients inactifs doivent être désactivés ou archivés."
                    : "In alignment with strict multi-tenant data auditing standards, hard-deletions of organization accounts are disabled. Deprecating operations require transitioning profiles to disabled or archived status."}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* SECTION 3: TEAMS */}
        {activeTab === 'teams' && (
          <div className="bg-white border border-stone-200 p-6 rounded-[24px] shadow-2xs space-y-6" id="enterprise-view-teams">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? `Équipes de Recrutement — ${activeOrgObj?.name}` : `Recruitment Teams Ledger — ${activeOrgObj?.name}`}
                </h4>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Structurez vos recruteurs en entités opérationnelles pour affecter des campagnes d'entretiens spécifiques." : "Group collaborative recruiters and reviewers into functional units to isolate candidate evaluation fields."}
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setShowTeamForm(!showTeamForm)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'FR' ? "Créer une Équipe" : "Create Team"}</span>
                </button>
              )}
            </div>

            {/* CREATE TEAM INLINE FORM */}
            {showTeamForm && (
              <form onSubmit={handleCreateTeam} className="bg-stone-50 border border-stone-200 p-4 rounded-2xl flex items-end gap-4 max-w-xl animate-fade-in text-xs font-semibold">
                <div className="space-y-1 w-full">
                  <label className="text-[10px] uppercase font-mono text-stone-400 font-bold block">{lang === 'FR' ? "Nom de l'Équipe" : "Team Name"}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cognitive Tech Lab"
                    value={teamFormName}
                    onChange={(e) => setTeamFormName(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-800"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold cursor-pointer transition-all active:scale-95 shrink-0"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowTeamForm(false)}
                  className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition-all shrink-0 cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}

            <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-150">
              <div className="grid grid-cols-5 p-4 bg-stone-50 font-mono text-[9px] text-stone-500 font-extrabold uppercase tracking-wider">
                <span className="col-span-2">Team Name & ID</span>
                <span>Member Count</span>
                <span>Created At</span>
                <span className="text-right">Actions</span>
              </div>

              {activeOrgTeams.map(team => (
                <div key={team.teamId} className="grid grid-cols-5 p-4 items-center text-xs font-semibold text-stone-700 hover:bg-stone-50/40">
                  <div className="col-span-2 space-y-0.5">
                    <p className="font-sans font-bold text-stone-950">{team.name}</p>
                    <p className="font-mono text-[10px] text-stone-400">ID: {team.teamId}</p>
                  </div>

                  <div className="font-mono text-stone-900 font-bold">
                    {team.memberCount} {team.memberCount > 1 ? 'members' : 'member'}
                  </div>

                  <div className="font-mono text-stone-450">
                    {new Date(team.createdAt).toLocaleDateString()}
                  </div>

                  <div className="text-right flex items-center justify-end gap-1.5">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleRenameTeam(team)}
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[10px] font-bold uppercase transition-all cursor-pointer"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => handleArchiveTeam(team.teamId)}
                          className="p-1 bg-stone-100 hover:bg-stone-200 text-amber-700 rounded transition-all cursor-pointer"
                          title="Archive Team"
                        >
                          <FolderArchive className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {activeOrgTeams.length === 0 && (
                <div className="p-8 text-center text-stone-400 italic text-xs">
                  {lang === 'FR' ? "Aucune équipe active créée." : "No active teams configured yet."}
                </div>
              )}
            </div>

          </div>
        )}

        {/* SECTION 4: MEMBERS */}
        {activeTab === 'members' && (
          <div className="space-y-8" id="enterprise-view-members">
            
            {/* WORKSPACE MEMBERS LIST */}
            <div className="bg-white border border-stone-200 p-6 rounded-[24px] shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? `Membres Collaborateurs — ${activeOrgObj?.name}` : `Workspace Members — ${activeOrgObj?.name}`}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Assignez des rôles précis pour contrôler l'accès aux tableaux de bord et aux paramètres de sécurité." : "Invite organizational colleagues, set roles, and manage active system status."}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'FR' ? "Inviter un Collaborateur" : "Invite Member"}</span>
                  </button>
                )}
              </div>

              {/* INVITE FORM INLINE */}
              {showInviteForm && (
                <form onSubmit={handleInviteMember} className="bg-stone-50 border border-stone-200 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in text-xs font-semibold text-stone-700">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold block">{lang === 'FR' ? "Adresse e-mail" : "Email Address"}</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-400 font-bold block">{lang === 'FR' ? "Rôle" : "Workspace Role"}</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-800 font-bold"
                    >
                      <option value="recruiter">Recruiter (Assigned workspace)</option>
                      <option value="reviewer">Reviewer (Assessment scoring)</option>
                      <option value="viewer">Viewer (View-only audits)</option>
                      <option value="workspace_admin">Workspace Admin (Settings controls)</option>
                      <option value="owner">Owner (Direct corporate holder)</option>
                      <option value="candidate">Candidate (Personal space only)</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold cursor-pointer transition-all active:scale-95"
                    >
                      Send Invitation
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInviteForm(false)}
                      className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* LIST TABLE */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-150">
                <div className="grid grid-cols-1 md:grid-cols-6 p-4 bg-stone-50 font-mono text-[9px] text-stone-500 font-extrabold uppercase tracking-wider">
                  <span className="md:col-span-2">Member Name & Email</span>
                  <span>Workspace Role</span>
                  <span>Status</span>
                  <span>Assigned Teams</span>
                  <span className="text-right">Actions</span>
                </div>

                {activeOrgMembers.map(member => (
                  <div key={member.id} className="grid grid-cols-1 md:grid-cols-6 p-4 items-center gap-2 text-xs font-semibold text-stone-700 hover:bg-stone-50/40">
                    <div className="md:col-span-2 space-y-0.5">
                      <p className="font-sans font-bold text-stone-950">{member.name}</p>
                      <p className="font-mono text-[10px] text-stone-400">{member.email}</p>
                    </div>

                    <div>
                      {isAdmin ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleChangeMemberRole(member.id, e.target.value as WorkspaceRole)}
                          className="bg-stone-100 border border-stone-200 px-2 py-1 rounded font-bold text-[11px] text-stone-850"
                        >
                          <option value="owner">Owner</option>
                          <option value="workspace_admin">Admin</option>
                          <option value="recruiter">Recruiter</option>
                          <option value="reviewer">Reviewer</option>
                          <option value="viewer">Viewer</option>
                          <option value="candidate">Candidate</option>
                        </select>
                      ) : (
                        <span className="font-sans font-bold text-stone-800 capitalize bg-stone-50 border border-stone-200 px-2 py-0.5 rounded text-[11px]">
                          {member.role.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${
                        member.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-150' 
                          : 'bg-rose-50 text-rose-800 border-rose-150'
                      }`}>
                        {member.status}
                      </span>
                    </div>

                    <div className="font-mono text-[11px] truncate max-w-[140px] text-stone-450" title={member.assignedTeams.join(', ')}>
                      {member.assignedTeams.length > 0 ? (
                        member.assignedTeams.map(tId => allTeams.find(t => t.teamId === tId)?.name || tId).join(', ')
                      ) : (
                        <span className="italic text-stone-400">None</span>
                      )}
                    </div>

                    <div className="text-right flex items-center justify-end gap-1.5">
                      {isAdmin && member.role !== 'owner' ? (
                        <>
                          <button
                            onClick={() => handleToggleMemberStatus(member)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all shrink-0 ${
                              member.status === 'active' 
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100'
                            }`}
                          >
                            {member.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </button>

                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1 text-stone-450 hover:text-stone-900 hover:bg-stone-100 rounded transition-all cursor-pointer"
                            title="Remove Member from workspace"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-stone-400 font-mono italic">Locked</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DYNAMIC SIMULATOR FOR INVITATION FLOW (Invite -> Accept -> Join -> Assign role -> Audit) */}
            <div className="bg-stone-50 border border-stone-200 p-6 rounded-[24px] space-y-6">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-xs text-stone-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  {lang === 'FR' ? "Simulation Virtuelle : Flux d'Acceptation d'Invitation" : "Fidelity Simulator: Invitation Validation Flow"}
                </h4>
                <p className="text-[11px] text-stone-500 font-semibold">
                  {lang === 'FR' ? "Testez l'acceptation d'une invitation en attente pour valider le processus de prélèvement de sièges." : "Model a recipient accepting an outstanding workspace invite. Accept, join, assign role, and audit changes."}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* List of pending invites */}
                <div className="bg-white border border-stone-200 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] uppercase font-mono text-stone-450 font-bold">
                    {lang === 'FR' ? "INVITATIONS EN ATTENTE D'ACCEPTATION" : "PENDING RECIPIENTS OUTBOX"}
                  </span>

                  <div className="divide-y divide-stone-100">
                    {allInvites.filter(i => i.organizationId === selectedOrgId && i.status === 'pending').map(invite => (
                      <div key={invite.id} className="py-2.5 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <p className="font-sans font-bold text-stone-950">{invite.email}</p>
                          <p className="font-mono text-[10px] text-stone-400">Role: <span className="font-bold text-stone-600 uppercase">{invite.role}</span></p>
                        </div>

                        <button
                          onClick={() => handleAcceptInviteSimulated(invite.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[9px] font-bold uppercase rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept & Join</span>
                        </button>
                      </div>
                    ))}
                    {allInvites.filter(i => i.organizationId === selectedOrgId && i.status === 'pending').length === 0 && (
                      <p className="py-4 text-center text-stone-400 italic text-xs">
                        {lang === 'FR' ? "Aucune invitation en suspens." : "No pending invitations found."}
                      </p>
                    )}
                  </div>
                </div>

                {/* FLOW EXPLANATORY CHART */}
                <div className="bg-stone-100/50 p-4 rounded-xl text-xs text-stone-700 font-semibold space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-stone-400 uppercase font-bold tracking-wider">
                      WORKSPACE ACCESS PIPELINE RULES
                    </span>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 text-[11px] text-[#4B5563] font-medium leading-relaxed">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono font-bold">1. Invite</span>
                      <span className="text-stone-300">→</span>
                      <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded font-mono font-bold">2. Accept</span>
                      <span className="text-stone-300">→</span>
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded font-mono font-bold">3. Join</span>
                      <span className="text-stone-300">→</span>
                      <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded font-mono font-bold">4. Audit</span>
                    </div>
                  </div>
                  
                  <p className="text-[11px] leading-relaxed text-[#6B7280]">
                    {lang === 'FR'
                      ? "Lorsqu'une invitation est émise, une licence de siège disponible est immédiatement réservée. Si le membre refuse ou si l'invitation est annulée, le siège retourne au quota disponible."
                      : "When an invite is initialized, a seat license is reserved. Once accepted, the member joins, the seat transfers from reserved to used, and an audit trail is securely recorded."}
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* SECTION 5: SEATS */}
        {activeTab === 'seats' && (
          <div className="space-y-6" id="enterprise-view-seats">
            
            <div className="bg-white border border-stone-200 p-6 rounded-[24px] shadow-2xs space-y-6">
              
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? `Régulateur de Sièges et Licences — ${activeOrgObj?.name}` : `Seat Allocation Control — ${activeOrgObj?.name}`}
                </h4>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Suivez la répartition des licences actives, réservées et inactives pour optimiser les coûts de facturation." : "Track active seat distribution, model reassignments, and monitor overdraft periods prior to license restrictions."}
                </p>
              </div>

              {/* BAR METRICS GRAPHS */}
              {activeOrgSeats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    <div className="p-4 bg-stone-50 rounded-2xl space-y-1 border border-stone-150">
                      <span className="text-[10px] uppercase font-mono text-stone-500 font-bold">{lang === 'FR' ? "Utilisés" : "Active Members (Used)"}</span>
                      <h5 className="font-sans font-black text-2xl text-stone-900">{activeOrgSeats.used}</h5>
                    </div>

                    <div className="p-4 bg-stone-50 rounded-2xl space-y-1 border border-stone-150">
                      <span className="text-[10px] uppercase font-mono text-stone-500 font-bold">{lang === 'FR' ? "Disponibles" : "Available Seats"}</span>
                      <h5 className="font-sans font-black text-2xl text-emerald-600">{activeOrgSeats.available}</h5>
                    </div>

                    <div className="p-4 bg-stone-50 rounded-2xl space-y-1 border border-stone-150">
                      <span className="text-[10px] uppercase font-mono text-stone-500 font-bold">{lang === 'FR' ? "Réservés (Invites)" : "Reserved (Pending)"}</span>
                      <h5 className="font-sans font-black text-2xl text-blue-600">{activeOrgSeats.reserved}</h5>
                    </div>

                    <div className="p-4 bg-stone-50 rounded-2xl space-y-1 border border-stone-150">
                      <span className="text-[10px] uppercase font-mono text-stone-500 font-bold">{lang === 'FR' ? "Inactifs (Verrouillés)" : "Inactive Members"}</span>
                      <h5 className="font-sans font-black text-2xl text-stone-400">{activeOrgSeats.inactive}</h5>
                    </div>

                  </div>

                  {/* VISUAL RATIO PROGRESS BAR */}
                  <div className="space-y-1 font-mono text-[10px] font-bold text-stone-400">
                    <div className="flex justify-between">
                      <span>{lang === 'FR' ? "UTILISATION DE CAPACITÉ" : "WORKSPACE CAPACITY UTILIZATION"}</span>
                      <span>
                        {Math.floor((activeOrgSeats.used / (activeOrgSeats.used + activeOrgSeats.available)) * 100)}%
                      </span>
                    </div>

                    <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden flex">
                      <div 
                        className="bg-violet-600 h-full" 
                        style={{ width: `${(activeOrgSeats.used / (activeOrgSeats.used + activeOrgSeats.available + activeOrgSeats.reserved)) * 100}%` }} 
                        title="Used Seats"
                      />
                      <div 
                        className="bg-blue-400 h-full" 
                        style={{ width: `${(activeOrgSeats.reserved / (activeOrgSeats.used + activeOrgSeats.available + activeOrgSeats.reserved)) * 100}%` }} 
                        title="Reserved Seats"
                      />
                    </div>
                  </div>

                  {/* GRACE PERIOD STATUS NOTICE */}
                  {activeOrgSeats.gracePeriodEndsAt ? (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">{lang === 'FR' ? "Surcapacité — Période de grâce active" : "Seat Overdraft - Grace Period Active"}</p>
                        <p className="text-[11px] leading-relaxed text-amber-850 mt-1">
                          {lang === 'FR'
                            ? `L'organisation a dépassé sa limite de places allouées. Période de transition se terminant le : ${new Date(activeOrgSeats.gracePeriodEndsAt).toLocaleDateString()}`
                            : `Organization seat limit exceeded. Access restrictions are suspended during the grace period. Ends on: ${new Date(activeOrgSeats.gracePeriodEndsAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">{lang === 'FR' ? "Validation des sièges conforme" : "Workspace Seat Compliance OK"}</p>
                        <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                          {lang === 'FR' 
                            ? "Tous les membres actifs et invitations en suspens entrent dans le quota de sièges." 
                            : "Workspace seat allocation is perfectly compliant within subscription bounds."}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              ) : null}

            </div>

            {/* SEAT REASSIGNMENT INTERACTIVE EXERCISE */}
            <div className="bg-stone-50 border border-stone-200 p-6 rounded-[24px] space-y-4">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-xs text-stone-950">
                  {lang === 'FR' ? "Réaffectation de Siège & Remplacement de Recruteur" : "Workspace License Seat Reassignment"}
                </h4>
                <p className="text-[11px] text-stone-500 font-semibold">
                  {lang === 'FR' ? "Sélectionnez un membre pour simuler le transfert d'une licence d'utilisation vers un autre collègue." : "Transfer license allocations without registering new billing profiles."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrgMembers.filter(m => m.status === 'active' && m.role !== 'owner').map(member => (
                  <div key={member.id} className="bg-white border border-stone-200 p-4 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-sans font-bold text-stone-950">{member.name}</p>
                      <p className="font-mono text-[10px] text-stone-400 capitalize">{member.role}</p>
                    </div>

                    <button
                      onClick={() => handleReassignSeatSimulated(member.id)}
                      className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[10px] font-bold uppercase rounded-lg border border-violet-150 transition-all cursor-pointer"
                    >
                      Reassign Seat
                    </button>
                  </div>
                ))}
                {activeOrgMembers.filter(m => m.status === 'active' && m.role !== 'owner').length === 0 && (
                  <p className="col-span-2 text-center text-stone-400 italic text-xs py-4">
                    {lang === 'FR' ? "Aucun membre disponible pour réaffectation." : "No workspace members available to reassign seats."}
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* SECTION 6: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6" id="enterprise-view-analytics">
            
            <div className="bg-white border border-stone-200 p-6 rounded-[24px] shadow-2xs space-y-6">
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? `Analyses Partagées de l'Organisation — ${activeOrgObj?.name}` : `Shared Organizational Analytics — ${activeOrgObj?.name}`}
                </h4>
                <p className="text-[11px] text-stone-500 font-semibold">
                  {lang === 'FR' ? "Mesurez l'efficience globale des entretiens par équipe sans comparaison de performance individuelle." : "Consolidated evaluation metrics for collaborative teams. No individual candidate score benchmarks are tracked."}
                </p>
              </div>

              {activeOrgAnalytics ? (
                <div className="space-y-8">
                  
                  {/* COMPLETION RATE RATING */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    <div className="p-5 border border-stone-150 rounded-2xl bg-stone-50/50 space-y-2">
                      <span className="font-mono text-[9px] uppercase text-stone-400 font-bold">{lang === 'FR' ? "COMPLÉTION DES ENTRETIENS" : "CONSOLIDATED COMPLETION RATE"}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-sans font-black text-3xl text-stone-900">{activeOrgAnalytics.completionRate}%</span>
                        <span className="text-emerald-600 font-bold text-xs">▲ +1.8%</span>
                      </div>
                      <p className="text-[10px] text-stone-500 font-semibold">{lang === 'FR' ? "Candidats ayant complété l'entretien." : "Ratio of completed over assigned candidate tests."}</p>
                    </div>

                    <div className="p-5 border border-stone-150 rounded-2xl bg-stone-50/50 space-y-2">
                      <span className="font-mono text-[9px] uppercase text-stone-400 font-bold">{lang === 'FR' ? "RÉPARTITION PAR LANGUES" : "INTERVIEW LANGUAGE PREFERENCES"}</span>
                      <div className="flex items-center gap-4 text-xs font-mono font-bold text-stone-800">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-violet-600 rounded-sm" />
                          <span>FR: {activeOrgAnalytics.languageSplit.FR}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-teal-400 rounded-sm" />
                          <span>EN: {activeOrgAnalytics.languageSplit.EN}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-500 font-semibold mt-1">{lang === 'FR' ? "Langue choisie par le candidat." : "Locales preferred during live screening loops."}</p>
                    </div>

                    <div className="p-5 border border-stone-150 rounded-2xl bg-stone-50/50 space-y-2">
                      <span className="font-mono text-[9px] uppercase text-stone-400 font-bold">{lang === 'FR' ? "VOLUMÉTRIE GLOBALE" : "CONSOLIDATED INTERVIEW VOLUME"}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-sans font-black text-3xl text-stone-900">
                          {activeOrgAnalytics.teamInterviews.reduce((acc, curr) => acc + curr.count, 0)}
                        </span>
                        <span className="text-stone-400 text-xs font-bold uppercase font-mono">Sessions</span>
                      </div>
                      <p className="text-[10px] text-stone-500 font-semibold">{lang === 'FR' ? "Total des sessions initiées par l'organisation." : "Total evaluation routines dispatched."}</p>
                    </div>

                  </div>

                  {/* TEAMS RECRUITMENT SPLIT GRAPH/TABLE */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-mono text-stone-450 font-bold block">
                        {lang === 'FR' ? "ACTIVITÉ D'ENTRETIENS PAR ÉQUIPE" : "INTERVIEW PIPELINE BY COLLABORATIVE TEAM"}
                      </span>

                      <div className="space-y-4">
                        {activeOrgAnalytics.teamInterviews.map((team, idx) => {
                          const total = activeOrgAnalytics.teamInterviews.reduce((acc, curr) => acc + curr.count, 0);
                          const percentage = Math.floor((team.count / total) * 100);
                          return (
                            <div key={idx} className="space-y-1 font-semibold text-xs text-stone-700">
                              <div className="flex justify-between text-[11px]">
                                <span className="font-sans font-bold text-stone-900">{team.name}</span>
                                <span className="font-mono font-bold text-stone-500">{team.count} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-stone-100 rounded-full h-2">
                                <div 
                                  className="bg-violet-600 h-full rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* PERFORMANCE TRENDS */}
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-mono text-stone-450 font-bold block">
                        {lang === 'FR' ? "HISTORIQUE D'ÉVOLUTION DE MOYENNE GLOBAL" : "HISTORICAL AVERAGE SCREENING RATING"}
                      </span>

                      <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 font-semibold text-xs">
                        <div className="grid grid-cols-3 p-3 bg-stone-50 font-mono text-[9px] text-stone-450 font-bold uppercase">
                          <span>Period</span>
                          <span>Candidates Evaluated</span>
                          <span className="text-right">Average Score</span>
                        </div>

                        {activeOrgAnalytics.performanceTrends.map((trend, idx) => (
                          <div key={idx} className="grid grid-cols-3 p-3 text-stone-700">
                            <span className="font-mono text-stone-900 font-bold">{trend.period}</span>
                            <span className="text-stone-500 font-bold">{trend.candidateCount}</span>
                            <span className="text-right font-mono font-black text-violet-700">{trend.avgScore}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              ) : null}

            </div>

          </div>
        )}

        {/* SECTION 7: WORKSPACE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-stone-200 p-6 rounded-[24px] shadow-2xs space-y-6" id="enterprise-view-settings">
            
            <div className="space-y-1">
              <h4 className="font-sans font-bold text-sm text-stone-900">
                {lang === 'FR' ? `Politiques administratives du Workspace — ${activeOrgObj?.name}` : `Workspace Policies & Branding — ${activeOrgObj?.name}`}
              </h4>
              <p className="text-[11px] text-[#6B7280] font-semibold">
                {lang === 'FR' ? "Gérez la politique d'identification unique (SSO), déterminez la langue par défaut et configurez l'identité visuelle de votre entreprise." : "Establish tenant domains access rules, enforce single sign-on constraints, and customize branding assets."}
              </p>
            </div>

            {activeOrgSettings ? (
              <form onSubmit={handleSaveWorkspaceSettings} className="space-y-6 text-xs font-semibold text-stone-700">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* LOCALIZATION & BRANDING */}
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-mono text-stone-450 font-bold block pb-1.5 border-b border-stone-100">
                      {lang === 'FR' ? "IDENTITÉ ET BRANDE" : "TENANT BRANDING & LOCALE"}
                    </span>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-stone-450">{lang === 'FR' ? "Langue par défaut" : "Default Workspace Language"}</label>
                        <select
                          value={activeOrgSettings.workspaceLanguage}
                          onChange={(e) => setActiveOrgSettings({ ...activeOrgSettings, workspaceLanguage: e.target.value as 'FR' | 'EN' })}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold"
                        >
                          <option value="FR">Français (French)</option>
                          <option value="EN">English (English)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-stone-450">{lang === 'FR' ? "Couleur de Marque (Hex)" : "Primary Brand Color"}</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={activeOrgSettings.branding.primaryColor}
                            onChange={(e) => setActiveOrgSettings({
                              ...activeOrgSettings,
                              branding: { ...activeOrgSettings.branding, primaryColor: e.target.value }
                            })}
                            className="w-10 h-10 border border-stone-200 rounded-xl cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeOrgSettings.branding.primaryColor}
                            onChange={(e) => setActiveOrgSettings({
                              ...activeOrgSettings,
                              branding: { ...activeOrgSettings.branding, primaryColor: e.target.value }
                            })}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECURITY & SINGLE SIGN-ON */}
                  <div className="space-y-4">
                    <span className="text-[10px] uppercase font-mono text-stone-450 font-bold block pb-1.5 border-b border-stone-100">
                      {lang === 'FR' ? "SÉCURITÉ ET CONFORMITÉ" : "SECURITY & DOMAINS RESTRICTIONS"}
                    </span>

                    <div className="space-y-4">
                      
                      <div className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-150">
                        <div className="space-y-0.5">
                          <p className="font-sans font-bold text-stone-900">Enforce Single Sign-On (SSO)</p>
                          <p className="text-[10px] text-stone-450 leading-relaxed font-semibold">Block credential login, forcing SAML identification routing.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={activeOrgSettings.accessPolicies.ssoRequired}
                          onChange={(e) => setActiveOrgSettings({
                            ...activeOrgSettings,
                            accessPolicies: { ...activeOrgSettings.accessPolicies, ssoRequired: e.target.checked }
                          })}
                          className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-stone-450">{lang === 'FR' ? "Domaines e-mails autorisés" : "Allowed E-mail Domains"}</label>
                        <input
                          type="text"
                          placeholder="e.g. company.com, subsidiary.fr"
                          value={activeOrgSettings.accessPolicies.allowedDomains.join(', ')}
                          onChange={(e) => setActiveOrgSettings({
                            ...activeOrgSettings,
                            accessPolicies: { 
                              ...activeOrgSettings.accessPolicies, 
                              allowedDomains: e.target.value.split(',').map(d => d.trim()).filter(Boolean) 
                            }
                          })}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-mono text-stone-800"
                        />
                      </div>

                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-stone-150 flex justify-end gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
                  >
                    {lang === 'FR' ? "Enregistrer les Politiques" : "Apply Administrative Policies"}
                  </button>
                </div>

              </form>
            ) : null}

          </div>
        )}

        {/* SECTION ATS INTEGRATION */}
        {activeTab === 'ats' && (
          <div className="space-y-6 animate-fade-in text-left" id="enterprise-view-ats">
            <div className="bg-white border border-stone-200 p-6 rounded-[24px] shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? `Connecteurs & Synchronisation ATS — ${activeOrgObj?.name}` : `ATS Integration & Auto-Sync — ${activeOrgObj?.name}`}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Connectez votre outil de suivi des candidatures (Applicant Tracking System) pour importer les offres et exporter les scores des entretiens Shana." : "Synchronize active positions from your corporate Applicant Tracking System and automatically export candidate interview scoring reports."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsSyncingAts(true);
                    triggerFeedback(lang === 'FR' ? "Lancement de la synchronisation bidirectionnelle..." : "Initiating bidirectional synchronization pipeline...");
                    setTimeout(() => {
                      setIsSyncingAts(false);
                      const now = new Date();
                      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                      setAtsConnections(prev => prev.map(c => c.id === selectedAts ? { ...c, status: 'connected', lastSynced: timeStr, jobCount: 14 } : c));
                      setAtsLogs(prev => [
                        { id: 'l_new_' + Math.random(), time: timeStr, type: 'success', msg: lang === 'FR' ? `Mise à jour réussie : Synchronisation complète effectuée avec ${selectedAts.toUpperCase()}` : `Sync verified: Bidirectional schema sync completed with ${selectedAts.toUpperCase()}` },
                        ...prev
                      ]);
                      triggerFeedback(lang === 'FR' ? "Synchronisation ATS terminée !" : "ATS Synchronization completed successfully!");
                    }, 1500);
                  }}
                  disabled={isSyncingAts}
                  className={`px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${isSyncingAts ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingAts ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAts ? (lang === 'FR' ? "Synchronisation..." : "Syncing Ledgers...") : (lang === 'FR' ? "Synchroniser Maintenant" : "Trigger Sync Now")}</span>
                </button>
              </div>

              {/* ATS Selector & Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Left side list of systems */}
                <div className="lg:col-span-1 space-y-3">
                  <span className="text-[10px] uppercase font-mono text-stone-450 font-bold block">
                    {lang === 'FR' ? "SYSTEMES COMPATIBLES" : "AVAILABLE PROVIDERS"}
                  </span>
                  
                  <div className="space-y-2">
                    {atsConnections.map(c => {
                      const isSelected = c.id === selectedAts;
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => {
                            setSelectedAts(c.id);
                            if (c.status === 'connected') {
                              setAtsForm({
                                apiKey: 'gh_live_••••••••9a2b',
                                subdomain: c.subdomain || 'loreal-luxe',
                                webhookSecret: 'whsec_8fb4a1a9e223'
                              });
                            } else {
                              setAtsForm({ apiKey: '', subdomain: '', webhookSecret: '' });
                            }
                          }}
                          className={`w-full p-3.5 rounded-xl border text-left transition-all flex justify-between items-center cursor-pointer ${
                            isSelected 
                              ? 'bg-violet-50/40 border-violet-200 text-stone-900 shadow-2xs' 
                              : 'bg-stone-50/50 border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-stone-600'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{c.logo}</span>
                            <div>
                              <p className="font-sans font-bold text-xs text-stone-900">{c.name}</p>
                              <p className="font-mono text-[9px] text-stone-400">
                                {c.status === 'connected' ? `Jobs: ${c.jobCount}` : 'Not configured'}
                              </p>
                            </div>
                          </div>

                          <span className={`w-2 h-2 rounded-full ${c.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Center Settings config */}
                <div className="lg:col-span-3 border border-stone-200 rounded-2xl p-6 space-y-6 text-left">
                  
                  {/* Provider Header details */}
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{atsConnections.find(c => c.id === selectedAts)?.logo}</span>
                      <div>
                        <h5 className="font-sans font-extrabold text-stone-900 text-sm">
                          {lang === 'FR' ? `Configuration d'Intégration ${atsConnections.find(c => c.id === selectedAts)?.name}` : `${atsConnections.find(c => c.id === selectedAts)?.name} Connection Settings`}
                        </h5>
                        <p className="text-[11px] text-stone-500 font-medium">
                          {lang === 'FR' ? "Définissez les clés d'API et règles de mapping de statut pour ce connecteur." : "Define secure developer credentials, subdomain endpoints, and stage transition mapping rules."}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {atsConnections.find(c => c.id === selectedAts)?.status === 'connected' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAtsConnections(prev => prev.map(c => c.id === selectedAts ? { ...c, status: 'disconnected', apiKey: '', subdomain: '', lastSynced: 'Never', jobCount: 0 } : c));
                            triggerFeedback(lang === 'FR' ? "Connecteur déconnecté" : "ATS connector disconnected");
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold uppercase rounded-lg border border-rose-150 cursor-pointer transition-all"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 bg-stone-100 text-stone-500 text-[10px] font-bold uppercase rounded-lg border border-stone-200">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!atsForm.apiKey || !atsForm.subdomain) {
                      triggerFeedback(lang === 'FR' ? "Tous les champs de connexion sont requis." : "All connection fields are required.", 'error');
                      return;
                    }
                    setAtsConnections(prev => prev.map(c => c.id === selectedAts ? { ...c, status: 'connected', apiKey: atsForm.apiKey, subdomain: atsForm.subdomain, jobCount: 14 } : c));
                    triggerFeedback(lang === 'FR' ? "Configuration enregistrée et validée !" : "Credentials saved and validated successfully!");
                  }} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold text-stone-700">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-450 block">{lang === 'FR' ? "Clé d'API Shana-ATS" : "ATS API Write Token"}</label>
                      <input
                        type="password"
                        required
                        placeholder="e.g. gh_live_secret..."
                        value={atsForm.apiKey}
                        onChange={(e) => setAtsForm({ ...atsForm, apiKey: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-mono text-stone-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-450 block">{lang === 'FR' ? "Sous-Domaine d'Entreprise" : "Tenant Subdomain Prefix"}</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          required
                          placeholder="company-name"
                          value={atsForm.subdomain}
                          onChange={(e) => setAtsForm({ ...atsForm, subdomain: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800"
                        />
                        <span className="font-mono text-stone-400 text-[10px] shrink-0">.greenhouse.io</span>
                      </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] uppercase font-mono text-stone-450 block">{lang === 'FR' ? "Secret pour Webhooks (Signature verification)" : "Webhook Secret Key"}</label>
                      <input
                        type="text"
                        placeholder="e.g. whsec_secret..."
                        value={atsForm.webhookSecret}
                        onChange={(e) => setAtsForm({ ...atsForm, webhookSecret: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-mono text-stone-800"
                      />
                    </div>

                    {/* Stage transition mappings */}
                    <div className="space-y-4 md:col-span-2 pt-3 border-t border-stone-100">
                      <span className="text-[10px] uppercase font-mono text-stone-450 font-bold block">
                        {lang === 'FR' ? "MAPPING DES ETAPES D'ENTRETIEN Shana ↔ ATS" : "INTERVIEW STAGE CORRELATION MAPPINGS"}
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                          <p className="font-sans font-bold text-stone-900 text-[11px]">{lang === 'FR' ? "Trigger d'importation" : "Inbound Trigger"}</p>
                          <div className="flex items-center justify-between text-[11px] text-stone-600">
                            <span>When candidate moves to ATS stage:</span>
                            <select className="bg-white border border-stone-200 rounded px-1.5 py-0.5 font-bold" defaultValue="Cognitive Assessment">
                              <option>Phone Screen</option>
                              <option value="Cognitive Assessment">Cognitive Assessment</option>
                              <option>HR Interview</option>
                            </select>
                          </div>
                          <p className="text-[10px] text-stone-400 leading-normal italic font-medium">Shana will automatically dispatch a personalized invitation with chosen language preferences.</p>
                        </div>

                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                          <p className="font-sans font-bold text-stone-900 text-[11px]">{lang === 'FR' ? "Trigger d'exportation" : "Outbound Export"}</p>
                          <div className="flex items-center justify-between text-[11px] text-stone-600">
                            <span>When Shana assessment completes:</span>
                            <select className="bg-white border border-stone-200 rounded px-1.5 py-0.5 font-bold" defaultValue="Move to 'Assessment Pass'">
                              <option value="Move to 'Assessment Pass'">Move to "Assessment Pass"</option>
                              <option>Update Candidate Fields</option>
                              <option>Reject and Archive</option>
                            </select>
                          </div>
                          <p className="text-[10px] text-stone-400 leading-normal italic font-medium">Export raw transcript, behavioral insights, and average score directly into applicant folder.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        {lang === 'FR' ? "Valider & Enregistrer" : "Validate & Save Credentials"}
                      </button>
                    </div>

                  </form>

                </div>

              </div>

              {/* Sync Audit Trail */}
              <div className="bg-stone-900 text-stone-100 p-6 rounded-[24px] border border-stone-800 space-y-4">
                <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                  <div className="space-y-0.5 text-left">
                    <h5 className="font-sans font-bold text-xs text-white">
                      {lang === 'FR' ? "Journal de Synchronisation ATS Temps-Réel" : "Real-Time ATS Sync Telemetry Logs"}
                    </h5>
                    <p className="text-[10px] text-stone-400 font-semibold">
                      {lang === 'FR' ? "Auditez les évènements de requêtes HTTP et transferts de données candidats." : "Detailed audit logs tracking outgoing webhook payload dispatches and candidate profile updates."}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded text-[9px] font-mono border border-violet-500/20 font-bold uppercase tracking-wider">
                    SECURED WEBHOOK DISPATCHER
                  </span>
                </div>

                <div className="divide-y divide-stone-800 font-mono text-[10px] max-h-48 overflow-y-auto space-y-2.5 text-left">
                  {atsLogs.map(log => (
                    <div key={log.id} className="pt-2.5 flex items-start gap-4">
                      <span className="text-stone-500 shrink-0 font-bold">{log.time}</span>
                      <span className={`px-1.5 py-0.2 rounded shrink-0 font-extrabold ${
                        log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                      <span className="text-stone-300 leading-normal font-medium">{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SECTION 8: COMPANY SPECIFIC INTERVIEW FRAMEWORKS */}
        {activeTab === 'frameworks' && (
          <div className="space-y-6 animate-fade-in text-left" id="enterprise-view-frameworks">
            <div className="bg-white border border-stone-200 p-6 rounded-[24px] shadow-2xs space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-100 pb-5">
                <div className="space-y-1 text-left">
                  <h4 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? `Modèles d'Entretien & Rubriques Métiers — ${activeOrgObj?.name}` : `Bespoke Interview Frameworks & Skill Rubrics — ${activeOrgObj?.name}`}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Définissez des critères d'évaluation uniques par rôle, incluez des questions comportementales imposées et configurez les directives de l'IA Shana." : "Build tailored evaluation blueprints, mandate specific question trees, and program custom AI directives for the virtual interviewer."}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowFrameworkForm(!showFrameworkForm)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showFrameworkForm ? (lang === 'FR' ? "Fermer le Panel" : "Close Blueprint Builder") : (lang === 'FR' ? "Créer un Modèle" : "Create Interview Blueprint")}</span>
                  </button>
                )}
              </div>

              {/* CREATE FRAMEWORK FORM */}
              {showFrameworkForm && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!frameworkForm.name || !frameworkForm.targetRole) {
                    triggerFeedback(lang === 'FR' ? "Le nom et le rôle ciblé sont requis." : "Blueprint Name and Target Role are required.", "error");
                    return;
                  }

                  const newFw = {
                    id: 'fw_' + Math.random(),
                    name: frameworkForm.name,
                    targetRole: frameworkForm.targetRole,
                    creator: currentUser.email,
                    skills: [
                      { name: frameworkForm.skill1, weight: Number(frameworkForm.weight1) },
                      { name: frameworkForm.skill2, weight: Number(frameworkForm.weight2) },
                      { name: frameworkForm.skill3, weight: Number(frameworkForm.weight3) }
                    ],
                    aiDirectives: frameworkForm.aiDirectives || "Enforce core role alignment assessment.",
                    questions: [frameworkForm.question1, frameworkForm.question2].filter(Boolean),
                    isActive: false
                  };

                  setFrameworks(prev => [...prev, newFw]);
                  setFrameworkForm({
                    name: '',
                    targetRole: '',
                    aiDirectives: '',
                    skill1: 'Cultural Alignment', weight1: 30,
                    skill2: 'Technical Aptitude', weight2: 30,
                    skill3: 'Communication Clarity', weight3: 40,
                    question1: '',
                    question2: ''
                  });
                  setShowFrameworkForm(false);
                  triggerFeedback(lang === 'FR' ? "Modèle d'entretien créé avec succès !" : "Interview blueprint created successfully!");
                }} className="bg-stone-50 border border-stone-200 p-6 rounded-[24px] space-y-5 animate-fade-in text-xs font-semibold text-stone-700 text-left">
                  <h5 className="font-sans font-extrabold text-stone-900 text-xs">
                    {lang === 'FR' ? "Concepteur de Modèle d'Entretien" : "Bespoke Framework Blueprint Constructor"}
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-450 block">{lang === 'FR' ? "Nom du Modèle" : "Framework Blueprint Name"}</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Cognitive Engineering Senior Rubric"
                        value={frameworkForm.name}
                        onChange={(e) => setFrameworkForm({ ...frameworkForm, name: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-850"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-450 block">{lang === 'FR' ? "Poste / Rôle Cible" : "Target Job Role"}</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Cloud Lead Architect"
                        value={frameworkForm.targetRole}
                        onChange={(e) => setFrameworkForm({ ...frameworkForm, targetRole: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-855"
                      />
                    </div>

                    {/* Skill grid weight */}
                    <div className="md:col-span-2 space-y-2 pt-2 border-t border-stone-100">
                      <label className="text-[10px] uppercase font-mono text-stone-450 block">
                        {lang === 'FR' ? "Pondération des compétences (La somme doit être égale à 100)" : "Skill Evaluation Matrix & Weight Assignment (Sum must equal 100%)"}
                      </label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3.5 border border-stone-200 rounded-xl space-y-2">
                          <input
                            type="text"
                            value={frameworkForm.skill1}
                            onChange={(e) => setFrameworkForm({ ...frameworkForm, skill1: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-150 rounded px-2 py-1"
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-stone-400">Weight:</span>
                            <input
                              type="number"
                              min="0" max="100"
                              value={frameworkForm.weight1}
                              onChange={(e) => setFrameworkForm({ ...frameworkForm, weight1: Number(e.target.value) })}
                              className="w-14 bg-stone-50 border border-stone-150 rounded px-1 py-0.5 text-right font-mono"
                            />
                          </div>
                        </div>

                        <div className="bg-white p-3.5 border border-stone-200 rounded-xl space-y-2">
                          <input
                            type="text"
                            value={frameworkForm.skill2}
                            onChange={(e) => setFrameworkForm({ ...frameworkForm, skill2: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-150 rounded px-2 py-1"
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-stone-400">Weight:</span>
                            <input
                              type="number"
                              min="0" max="100"
                              value={frameworkForm.weight2}
                              onChange={(e) => setFrameworkForm({ ...frameworkForm, weight2: Number(e.target.value) })}
                              className="w-14 bg-stone-50 border border-stone-150 rounded px-1 py-0.5 text-right font-mono"
                            />
                          </div>
                        </div>

                        <div className="bg-white p-3.5 border border-stone-200 rounded-xl space-y-2">
                          <input
                            type="text"
                            value={frameworkForm.skill3}
                            onChange={(e) => setFrameworkForm({ ...frameworkForm, skill3: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-150 rounded px-2 py-1"
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-stone-400">Weight:</span>
                            <input
                              type="number"
                              min="0" max="100"
                              value={frameworkForm.weight3}
                              onChange={(e) => setFrameworkForm({ ...frameworkForm, weight3: Number(e.target.value) })}
                              className="w-14 bg-stone-50 border border-stone-150 rounded px-1 py-0.5 text-right font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Prompt Directives */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-450 block">
                        {lang === 'FR' ? "Directives de Personnalisation de l'IA (Instructions pour Shana)" : "Virtual AI Recruiter Directives (Core Prompt Overrides)"}
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Enforce high-density architectural questions. Present failure scenarios regarding state-consistency across active-active geographic zones..."
                        value={frameworkForm.aiDirectives}
                        onChange={(e) => setFrameworkForm({ ...frameworkForm, aiDirectives: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-800 leading-relaxed font-sans font-medium text-[11px]"
                      />
                    </div>

                    {/* Mandatory Questions */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] uppercase font-mono text-stone-450 block">{lang === 'FR' ? "Questions obligatoires à poser par l'IA" : "Mandated Interview Behavioral Questions"}</label>
                      <input
                        type="text"
                        placeholder="Question 1 (e.g. Explain how you handle synchronization conflicts...)"
                        value={frameworkForm.question1}
                        onChange={(e) => setFrameworkForm({ ...frameworkForm, question1: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-850"
                      />
                      <input
                        type="text"
                        placeholder="Question 2 (e.g. How do you manage mentoring engineers who resist standards?)"
                        value={frameworkForm.question2}
                        onChange={(e) => setFrameworkForm({ ...frameworkForm, question2: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-850"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3.5 pt-3 border-t border-stone-150">
                    <button
                      type="button"
                      onClick={() => setShowFrameworkForm(false)}
                      className="px-4 py-2 bg-stone-150 hover:bg-stone-200 text-stone-700 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl active:scale-95 transition-all"
                    >
                      Initialize Framework
                    </button>
                  </div>
                </form>
              )}

              {/* LIST FRAMEWORKS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                
                {/* Framework list sidebar */}
                <div className="lg:col-span-1 space-y-3">
                  <span className="text-[10px] uppercase font-mono text-stone-450 font-bold block">
                    {lang === 'FR' ? "RUBRIQUES CONFIGUREES" : "CONFIGURED BLUEPRINTS"}
                  </span>

                  <div className="space-y-2.5">
                    {frameworks.map(fw => {
                      const isSelected = fw.id === selectedFrameworkId;
                      return (
                        <div
                          key={fw.id}
                          className={`p-4 rounded-xl border text-left transition-all space-y-2 relative ${
                            isSelected
                              ? 'bg-violet-50/20 border-violet-200 shadow-2xs'
                              : 'bg-stone-50/50 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedFrameworkId(fw.id)}
                              className="text-left font-sans font-black text-stone-900 text-xs hover:underline cursor-pointer block font-extrabold"
                            >
                              {fw.name}
                            </button>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${fw.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                          </div>

                          <p className="text-[10px] text-stone-500 font-semibold">{fw.targetRole}</p>

                          <div className="flex items-center justify-between pt-1 text-[10px] font-bold">
                            <span className="font-mono text-stone-400">ID: {fw.id.substring(0, 8)}</span>
                            {fw.isActive ? (
                              <span className="text-emerald-700 uppercase font-bold text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                {lang === 'FR' ? "ACTIF" : "ACTIVE BLUEPRINT"}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setFrameworks(prev => prev.map(f => f.id === fw.id ? { ...f, isActive: true } : { ...f, isActive: false }));
                                  triggerFeedback(lang === 'FR' ? "Modèle d'entretien défini comme modèle actif !" : "Interview blueprint set as primary active template!");
                                }}
                                className="text-violet-700 hover:underline cursor-pointer"
                              >
                                {lang === 'FR' ? "Activer" : "Set Active"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Framework details view */}
                <div className="lg:col-span-2 border border-stone-200 rounded-2xl p-6 space-y-6 text-xs text-stone-700 font-semibold text-left">
                  {(() => {
                    const fw = frameworks.find(f => f.id === selectedFrameworkId);
                    if (!fw) return <p className="text-stone-450 italic">Select a framework blueprint to inspect.</p>;
                    return (
                      <div className="space-y-6">
                        <div className="flex justify-between items-start border-b border-stone-100 pb-4">
                          <div className="space-y-0.5 text-left">
                            <h5 className="font-sans font-extrabold text-stone-950 text-sm">
                              {fw.name}
                            </h5>
                            <p className="text-[11px] text-stone-500">
                              {lang === 'FR' ? `Rôle ciblé : ${fw.targetRole}` : `Target recruitment role profile: ${fw.targetRole}`}
                            </p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(lang === 'FR' ? "Supprimer cette rubrique ?" : "Permanently remove this evaluation blueprint?")) {
                                setFrameworks(prev => prev.filter(f => f.id !== fw.id));
                                setSelectedFrameworkId(frameworks[0]?.id || '');
                                triggerFeedback(lang === 'FR' ? "Rubrique effacée" : "Interview blueprint removed.");
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-100 rounded-lg cursor-pointer transition-all"
                            title="Delete framework blueprint"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* SKILLS CHIPS AND WEIGHT DISTRIBUTION */}
                        <div className="space-y-3">
                          <span className="text-[10px] uppercase font-mono text-stone-450 font-bold block">
                            {lang === 'FR' ? "MATRICE DES CRITERES DE EVALUATION" : "COMPETENCY EVALUATION MATRIX"}
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fw.skills.map((s, idx) => (
                              <div key={idx} className="bg-stone-50 p-3.5 rounded-xl border border-stone-150 space-y-1.5">
                                <div className="flex justify-between text-[11px]">
                                  <span className="font-sans font-bold text-stone-900">{s.name}</span>
                                  <span className="font-mono font-black text-violet-700">{s.weight}%</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-violet-600 h-full rounded-full" style={{ width: `${s.weight}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* AI Instructions */}
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-mono text-stone-450 font-bold block">
                            {lang === 'FR' ? "CONSIGNES DU VIRTUAL INTERVIEWER Shana" : "SHANA COGNITIVE INTERVIEW PROMPT DIRECTIVES"}
                          </span>
                          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 leading-relaxed font-sans font-medium text-[11px]">
                            {fw.aiDirectives}
                          </div>
                        </div>

                        {/* Questions */}
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-mono text-stone-450 font-bold block">
                            {lang === 'FR' ? "QUESTIONS COMPORTEMENTALES OBLIGATOIRES" : "MANDATED BEHAVIORAL QUESTIONS"}
                          </span>
                          <div className="space-y-2 text-left">
                            {fw.questions.map((q, idx) => (
                              <div key={idx} className="bg-violet-50/15 border border-violet-100 p-3.5 rounded-xl flex items-start gap-2.5">
                                <span className="p-1 bg-violet-600/10 text-violet-700 rounded text-[10px] font-mono font-bold">
                                  Q{idx+1}
                                </span>
                                <p className="text-stone-900 leading-normal text-[11px] font-medium">{q}</p>
                              </div>
                            ))}
                            {fw.questions.length === 0 && (
                              <p className="text-stone-400 italic text-[11px]">{lang === 'FR' ? "Aucune question comportementale imposée." : "No explicit mandated questions added yet."}</p>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL WINDOW: CREATE OR EDIT WORKSPACE ORGANIZATION (SUPER ADMIN LEVEL) */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 p-6 rounded-[28px] max-w-md w-full shadow-2xl animate-fade-in text-xs font-semibold text-stone-700 text-left space-y-4">
            
            <div className="space-y-1">
              <h4 className="font-sans font-bold text-sm text-stone-950 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-violet-600" />
                <span>
                  {editingOrg 
                    ? (lang === 'FR' ? "Modifier l'Organisation" : "Modify Organization") 
                    : (lang === 'FR' ? "Initialiser une Organisation" : "Initialize Workspace Organization")}
                </span>
              </h4>
              <p className="text-[10px] text-stone-500 font-semibold">
                {lang === 'FR' ? "Définissez les paramètres de licence initiaux de l'entreprise." : "Set the structural core boundaries for client tenants."}
              </p>
            </div>

            <form onSubmit={handleSaveOrg} className="space-y-4 text-stone-700">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-stone-450">{lang === 'FR' ? "Nom de l'Organisation" : "Corporate Identity Name"}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. L'Oréal Division Luxe"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800"
                />
              </div>

              {!editingOrg && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-stone-450">{lang === 'FR' ? "E-mail du Propriétaire initial" : "Owner Email Address"}</label>
                  <input
                    type="email"
                    required
                    placeholder="owner@domain.com"
                    value={orgForm.owner}
                    onChange={(e) => setOrgForm({ ...orgForm, owner: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-stone-450">{lang === 'FR' ? "Forfait SaaS commercial" : "Assigned Tier Limit"}</label>
                <select
                  value={orgForm.plan}
                  onChange={(e) => setOrgForm({ ...orgForm, plan: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold"
                >
                  <option value="Starter">Starter (15 Seats Limit)</option>
                  <option value="Standard">Standard (100 Seats Limit)</option>
                  <option value="Premium">Premium (500 Seats Limit)</option>
                  <option value="Enterprise">Enterprise (999,999 Seats)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-stone-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold cursor-pointer transition-all active:scale-95"
                >
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
