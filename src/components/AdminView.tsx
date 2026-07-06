import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Video, 
  Activity, 
  Settings, 
  ShieldAlert, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Shield, 
  ShieldCheck,
  UserCheck, 
  UserMinus, 
  Clock, 
  FileLock, 
  Layers, 
  RefreshCw,
  Sliders,
  Globe2,
  Lock,
  LockKeyholeOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  BookOpen,
  AlertTriangle,
  Cpu,
  Tv,
  Eye,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { User, Profile, CVAnalysis } from '../types';
import { StorageService } from '../lib/storage';
import { AccessController, AuditLog } from '../services/admin';
import { StatsRepository, MetricsService, DashboardAggregator, InterviewSession } from '../services/admin/metrics';
import ControlCenter from './admin/control-center/ControlCenter';
import AIOperations from './admin/ai-operations/AIOperations';
import TrustCenter from './admin/trust/TrustCenter';
import BusinessCenter from './admin/business/BusinessCenter';
import MonetizationCenter from './admin/monetization/MonetizationCenter';
import PaymentsCenter from './admin/payments/PaymentsCenter';
import EnterpriseCenter from './admin/enterprise/EnterpriseCenter';
import IntegrationsCenter from './admin/integrations/IntegrationsCenter';
import ObservabilityCenter from '../../admin/observability/index';
import { Briefcase, Coins, CreditCard, TrendingUp, Mail } from 'lucide-react';
const SaaSAnalyticsDashboard = React.lazy(() => import('./SaaSAnalyticsDashboard'));
import EmailSimulator from './EmailSimulator';
import { RecruiterAnalyticsService } from '../lib/recruiter/recruiterAnalytics';
import { CandidateAnalyticsService } from '../lib/candidate/analytics';
import { KnowledgeGraph } from '../lib/knowledge/knowledgeGraph';
import KnowledgeIntelligencePanel from './admin/KnowledgeIntelligencePanel';

interface AdminViewProps {
  currentUser: User;
  lang?: 'FR' | 'EN';
  onNavigateTab: (tab: any) => void;
}

type AdminSubTab = 'dashboard' | 'users' | 'interviews' | 'settings' | 'audit' | 'control-center' | 'ai-operations' | 'trust' | 'business' | 'monetization' | 'payments' | 'enterprise' | 'integrations' | 'observability' | 'saas-metrics' | 'recruiter-intelligence' | 'candidate-intelligence' | 'knowledge-intelligence' | 'smtp-simulation';

export default function AdminView({ currentUser, lang = 'FR', onNavigateTab }: AdminViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  
  // Last sync timestamp
  const [lastSynced, setLastSynced] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User tab filtering states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'candidate' | 'admin' | 'super_admin'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [userLangFilter, setUserLangFilter] = useState<'all' | 'French' | 'English'>('all');
  const [userDateFilter, setUserDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  
  // User pagination
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 5;

  // Selected details targets
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserNotes, setSelectedUserNotes] = useState<any[]>([]);
  const [newUserNote, setNewUserNote] = useState('');
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [newSessionNote, setNewSessionNote] = useState('');

  // Interview subtab states
  const [interviewSearch, setInterviewSearch] = useState('');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState<'all' | 'active' | 'paused' | 'completed' | 'cancelled'>('all');

  // Super Admin toggle state placeholders
  const [autoEvaluation, setAutoEvaluation] = useState(true);
  const [voiceStream, setVoiceStream] = useState(true);
  const [platformLimit, setPlatformLimit] = useState(100);

  // Settings Category Tab
  const [settingsCategory, setSettingsCategory] = useState<'general' | 'interview' | 'languages' | 'security'>('general');

  // Load Admin Data on mount/refresh
  const loadData = () => {
    setIsRefreshing(true);
    try {
      const listUsers = StorageService.getUsers();
      setUsers(listUsers);

      const listAudit = AccessController.getAuditLogs();
      setAuditLogs(listAudit);

      const listSessions = StatsRepository.getSessions();
      setSessions(listSessions);

      const computedMetrics = DashboardAggregator.getDashboardData();
      setMetrics(computedMetrics);

      const now = new Date();
      setLastSynced(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error("Failed loading administrative metrics dashboard:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Setup periodic metrics refresh (every 30 seconds) and live session observer (every 10 seconds)
  useEffect(() => {
    loadData();

    // 30 seconds auto-refresh
    const metricsInterval = setInterval(() => {
      loadData();
    }, 30000);

    // 10 seconds active session fetch to capture live simulator progress
    const liveInterval = setInterval(() => {
      try {
        const freshSessions = StatsRepository.getSessions();
        setSessions(freshSessions);
        // If a session is currently being inspected, update its state dynamically
        setSelectedSession(prev => {
          if (!prev) return null;
          const updated = freshSessions.find(s => s.id === prev.id);
          return updated || prev;
        });
      } catch (e) {}
    }, 10000);

    // Listen to custom update events for immediate redraw
    const handleImmediateUpdate = () => {
      try {
        setSessions(StatsRepository.getSessions());
        const computedMetrics = DashboardAggregator.getDashboardData();
        setMetrics(computedMetrics);
      } catch (e) {}
    };
    window.addEventListener('shana_sessions_updated', handleImmediateUpdate);

    // Audit Login if not already logged in this sub-session
    const sessionLoggedKey = `shana_admin_logged_${currentUser.id}`;
    if (!sessionStorage.getItem(sessionLoggedKey)) {
      AccessController.logAction(
        'LOGIN',
        `Admin logged in successfully to backoffice (${currentUser.role}).`,
        { id: currentUser.id, email: currentUser.email, role: currentUser.role || 'admin' }
      );
      sessionStorage.setItem(sessionLoggedKey, 'true');
    }

    return () => {
      clearInterval(metricsInterval);
      clearInterval(liveInterval);
      window.removeEventListener('shana_sessions_updated', handleImmediateUpdate);
    };
  }, [currentUser]);

  // Load notes for user when user selection changes
  useEffect(() => {
    if (selectedUser) {
      const savedUserNotes = localStorage.getItem(`shana_user_notes_${selectedUser.id}`);
      setSelectedUserNotes(savedUserNotes ? JSON.parse(savedUserNotes) : []);
    } else {
      setSelectedUserNotes([]);
    }
  }, [selectedUser]);

  // Handle User Status toggling (Enabled/Disabled)
  const handleToggleUserStatus = (targetUser: User) => {
    if (targetUser.id === currentUser.id) {
      alert(lang === 'FR' ? "Vous ne pouvez pas désactiver votre propre compte !" : "You cannot disable your own admin account!");
      return;
    }

    const newStatus = targetUser.status === 'disabled' ? 'enabled' : 'disabled';
    const updated: User = { ...targetUser, status: newStatus };
    StorageService.saveUser(updated);

    AccessController.logAction(
      'ADMIN_ACTION',
      `${newStatus === 'enabled' ? 'Activated' : 'Suspended'} user account ${targetUser.email}.`,
      { id: currentUser.id, email: currentUser.email, role: currentUser.role || 'admin' },
      targetUser.id,
      `Changed status from ${targetUser.status} to ${newStatus}`
    );

    // If selected target is open in modal, update state
    if (selectedUser && selectedUser.id === targetUser.id) {
      setSelectedUser(updated);
    }

    loadData();
  };

  // Handle User Role Promotion / Demotion (SUPER ADMIN ONLY)
  const handleChangeUserRole = (targetUser: User, newRole: 'candidate' | 'admin' | 'super_admin') => {
    if (!AccessController.hasRole(currentUser.role, 'super_admin')) {
      alert(lang === 'FR' ? "Action réservée aux Super Administrateurs !" : "This action requires Super Admin privileges!");
      return;
    }

    if (targetUser.id === currentUser.id) {
      alert(lang === 'FR' ? "Vous ne pouvez pas modifier votre propre rôle !" : "You cannot modify your own administrative role!");
      return;
    }

    const updated: User = { ...targetUser, role: newRole };
    StorageService.saveUser(updated);

    AccessController.logAction(
      'ROLE_UPDATE',
      `Modified role of user ${targetUser.email} to ${newRole.toUpperCase()}.`,
      { id: currentUser.id, email: currentUser.email, role: currentUser.role || 'super_admin' },
      targetUser.id,
      `Promoted/Demoted from ${targetUser.role} to ${newRole}`
    );

    if (selectedUser && selectedUser.id === targetUser.id) {
      setSelectedUser(updated);
    }

    loadData();
  };

  // Add internal user-level note (Invisible to candidates)
  const handleAddUserNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newUserNote.trim()) return;

    const authorName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
    const newNoteObj = {
      id: 'unote_' + Math.random().toString(36).substring(2, 11),
      text: newUserNote.trim(),
      timestamp: new Date().toISOString(),
      author: authorName
    };

    const updatedNotes = [newNoteObj, ...selectedUserNotes];
    localStorage.setItem(`shana_user_notes_${selectedUser.id}`, JSON.stringify(updatedNotes));
    setSelectedUserNotes(updatedNotes);

    AccessController.logAction(
      'ADMIN_ACTION',
      `Added internal administrative note on user profile ${selectedUser.email}.`,
      { id: currentUser.id, email: currentUser.email, role: currentUser.role || 'admin' },
      selectedUser.id,
      `Note text: ${newUserNote.trim()}`
    );

    setNewUserNote('');
  };

  // Add internal session-level note (Invisible to candidates)
  const handleAddSessionNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !newSessionNote.trim()) return;

    const authorName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
    StatsRepository.addNoteToUserOrSession(selectedSession.id, newSessionNote.trim(), authorName);

    AccessController.logAction(
      'ADMIN_ACTION',
      `Added internal admin note on session ${selectedSession.id}.`,
      { id: currentUser.id, email: currentUser.email, role: currentUser.role || 'admin' },
      selectedSession.candidateId,
      `Session Note: ${newSessionNote.trim()}`
    );

    // Refresh selected session from storage
    const freshSessions = StatsRepository.getSessions();
    const updatedSess = freshSessions.find(s => s.id === selectedSession.id);
    if (updatedSess) {
      setSelectedSession(updatedSess);
    }
    setSessions(freshSessions);
    setNewSessionNote('');
  };

  // Open detailed user profile modal (Triggers Audit Action: View Sensitive Page)
  const handleOpenUserProfile = (user: User) => {
    setSelectedUser(user);
    AccessController.logAction(
      'ADMIN_ACTION',
      `Viewed sensitive detailed profile for user ${user.email}.`,
      { id: currentUser.id, email: currentUser.email, role: currentUser.role || 'admin' },
      user.id
    );
  };

  // Open detailed session modal (Triggers Audit Action: View Sensitive Page)
  const handleOpenSessionDetails = (session: InterviewSession) => {
    setSelectedSession(session);
    AccessController.logAction(
      'ADMIN_ACTION',
      `Viewed sensitive live monitoring detailed timeline for session ${session.id}.`,
      { id: currentUser.id, email: currentUser.email, role: currentUser.role || 'admin' },
      session.candidateId
    );
  };

  // Profiles Map for language matching
  const profiles = StorageService.getProfiles();
  const profileMap = new Map<string, Profile>(profiles.map(p => [p.userId, p]));

  // Filtering users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    
    const uProfile = profileMap.get(u.id);
    const matchesLanguage = userLangFilter === 'all' || (uProfile?.language === userLangFilter);

    // Date created filter
    let matchesDate = true;
    if (userDateFilter !== 'all') {
      const createdDate = new Date(u.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - createdDate.getTime();
      if (userDateFilter === '24h') {
        matchesDate = diffMs <= 24 * 60 * 60 * 1000;
      } else if (userDateFilter === '7d') {
        matchesDate = diffMs <= 7 * 24 * 60 * 60 * 1000;
      } else if (userDateFilter === '30d') {
        matchesDate = diffMs <= 30 * 24 * 60 * 60 * 1000;
      }
    }

    return matchesSearch && matchesRole && matchesStatus && matchesLanguage && matchesDate;
  });

  // User Paginated Slice
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const indexOfLastUser = userPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const paginatedUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Reset page when filters modify
  useEffect(() => {
    setUserPage(1);
  }, [userSearch, userRoleFilter, userStatusFilter, userLangFilter, userDateFilter]);

  // Filtering Sessions for monitoring
  const filteredSessions = sessions.filter(s => {
    const matchesSearch = 
      s.id.toLowerCase().includes(interviewSearch.toLowerCase()) ||
      s.candidateName.toLowerCase().includes(interviewSearch.toLowerCase()) ||
      s.candidateEmail.toLowerCase().includes(interviewSearch.toLowerCase());

    const matchesStatus = interviewStatusFilter === 'all' || s.status === interviewStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const isSuperAdmin = AccessController.hasRole(currentUser.role, 'super_admin');

  // Format Helper for timestamps
  const formatDateTimeStr = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString(lang === 'FR' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div id="admin-view-root" className="space-y-8 selection:bg-stone-900 selection:text-white">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-stone-200 p-6 rounded-3xl shadow-xs">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
              isSuperAdmin 
                ? 'bg-amber-100 border border-amber-200 text-amber-800' 
                : 'bg-indigo-150 border border-indigo-200 text-indigo-800'
            }`}>
              {isSuperAdmin ? '👑 Super Admin' : '🛡️ Admin Portal'}
            </span>
            <span className="font-mono text-[9px] text-stone-400">SESSIONID: {currentUser.id}</span>
            <span className="inline-flex items-center gap-1.5 text-[9.5px] text-stone-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {lang === 'FR' ? `Dernière synchro: ${lastSynced}` : `Synced: ${lastSynced}`}
            </span>
          </div>
          <h1 className="font-sans font-black text-2xl text-stone-900 tracking-tight">
            {lang === 'FR' ? "Console d'Administration" : "Administration Workspace"}
          </h1>
          <p className="text-[#6B7280] text-xs font-medium">
            {lang === 'FR' 
              ? "Pilotez la plateforme, auditez les activités et suivez les entretiens en temps réel." 
              : "Manage core platform components, moderate candidate statuses, and track interviews live."}
          </p>
        </div>

        {/* Quick Back to App Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title={lang === 'FR' ? "Actualiser" : "Manual sync"}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => onNavigateTab('home')}
            className="px-4 py-2 bg-stone-950 hover:bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wide cursor-pointer flex items-center gap-2 transition-all shadow-xs"
          >
            <span>{lang === 'FR' ? "Retour candidat" : "Switch to Candidate View"}</span>
          </button>
        </div>
      </div>

      {/* Admin Tab bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-stone-200">
        {[
          { id: 'dashboard', label: lang === 'FR' ? 'Tableau de bord' : 'Dashboard', icon: Layers },
          { id: 'users', label: lang === 'FR' ? 'Utilisateurs' : 'Users', icon: Users },
          { id: 'interviews', label: lang === 'FR' ? 'Entretiens (Live)' : 'Live Monitoring', icon: Video },
          { id: 'ai-operations', label: lang === 'FR' ? 'AIOps Center' : 'AIOps Center', icon: Activity },
          { id: 'trust', label: lang === 'FR' ? 'Espace Confiance (GDPR)' : 'Trust & Compliance', icon: Shield },
          { id: 'business', label: lang === 'FR' ? 'Business & Ops' : 'Business & Ops', icon: Briefcase },
          { id: 'monetization', label: lang === 'FR' ? 'Monétisation' : 'Monetization', icon: Coins },
          { id: 'payments', label: lang === 'FR' ? 'Paiements & Commerce' : 'Payments & Commerce', icon: CreditCard },
          { id: 'enterprise', label: lang === 'FR' ? 'Enterprise Workspace' : 'Enterprise Workspace', icon: Users },
          { id: 'integrations', label: lang === 'FR' ? 'Intégrations & API' : 'Integrations & API', icon: Globe2 },
          { id: 'observability', label: lang === 'FR' ? 'Supervision & Logs' : 'Observability Center', icon: Activity },
          { id: 'saas-metrics', label: lang === 'FR' ? 'Analyses SaaS & ROI' : 'SaaS Metrics & ROI', icon: TrendingUp },
          { id: 'recruiter-intelligence', label: lang === 'FR' ? 'Recruteur IA Brain' : 'Recruiter Brain', icon: Cpu },
          { id: 'candidate-intelligence', label: lang === 'FR' ? 'Dossier Apprenant IA' : 'Learner Intelligence', icon: BookOpen },
          { id: 'knowledge-intelligence', label: lang === 'FR' ? 'Interview Genome & Graphe' : 'Interview Genome & Graph', icon: Globe2 },
          { id: 'control-center', label: lang === 'FR' ? 'Platform Control Center' : 'Platform Control Center', icon: Sliders },
          { id: 'smtp-simulation', label: lang === 'FR' ? 'Canal d\'Envoi E-mail' : 'Email Dispatch Console', icon: Mail },
          { id: 'settings', label: lang === 'FR' ? 'Paramètres' : 'Settings', icon: Settings },
          { id: 'audit', label: lang === 'FR' ? 'Audit Logs' : 'Audit Logs', icon: FileLock }
        ].map(sub => {
          const Icon = sub.icon;
          const isActive = activeSubTab === sub.id;

          // Restrict Audit Log tab to Super Admins only based on requirement
          if (sub.id === 'audit' && !isSuperAdmin) {
            return null; // Audit tab is invisible for simple admin
          }

          return (
            <button
              key={sub.id}
              onClick={() => {
                setActiveSubTab(sub.id as any);
                // Track sensitive action view
                if (sub.id === 'audit') {
                  AccessController.logAction(
                    'ADMIN_ACTION',
                    `Super admin viewed sensitive system audit log stream.`,
                    { id: currentUser.id, email: currentUser.email, role: currentUser.role || 'super_admin' }
                  );
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shrink-0 transition-all ${
                isActive 
                  ? 'bg-stone-950 text-white shadow-md' 
                  : 'text-stone-500 hover:text-stone-950 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{sub.label}</span>
              {sub.id === 'interviews' && sessions.filter(s => s.status === 'active').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="animate-fade-in">
        
        {/* TAB 1: DASHBOARD (Display real metric analytics & lightweight CSS chart) */}
        {activeSubTab === 'dashboard' && metrics && (
          <div className="space-y-6">
            
            {/* Real Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Users */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs text-left space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">
                    {lang === 'FR' ? "TOTAL UTILISATEURS" : "TOTAL USERS"}
                  </span>
                  <div className="p-2 bg-stone-100 rounded-xl text-stone-800">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-sans font-black text-3.5xl text-stone-900">{metrics.totalUsers}</h3>
                  <div className="flex items-center gap-2 text-stone-500 text-[10.5px] font-medium leading-normal">
                    <span>{metrics.activeUsers} {lang === 'FR' ? 'actifs' : 'actives'}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">+{metrics.newUsers} {lang === 'FR' ? 'récents' : 'new'}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Active Interviews */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs text-left space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">
                    {lang === 'FR' ? "SUIVI EN DIRECT" : "LIVE SESSIONS"}
                  </span>
                  <div className="relative p-2 bg-red-50 text-red-650 rounded-xl">
                    <Video className="w-4 h-4" />
                    {metrics.activeInterviews > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                    )}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-sans font-black text-3.5xl text-stone-900">{metrics.activeInterviews}</h3>
                  <p className="text-[#6B7280] text-[10.5px] font-medium leading-normal">
                    {lang === 'FR' ? "Entretiens actifs actuellement" : "Candidates online training now"}
                  </p>
                </div>
              </div>

              {/* Card 3: Completion Metric */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs text-left space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">
                    {lang === 'FR' ? "TAUX DE COMPLÉTION" : "COMPLETION RATE"}
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-650 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-1">
                    <h3 className="font-sans font-black text-3.5xl text-stone-900">{metrics.completionRate}%</h3>
                    <span className="text-[11px] font-mono text-stone-400">({metrics.completedInterviews} {lang === 'FR' ? "finis" : "done"})</span>
                  </div>
                  
                  {/* Miniature beautiful progress line */}
                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${metrics.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Avg Duration */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs text-left space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">
                    {lang === 'FR' ? "DURÉE MOYENNE" : "AVG DURATION"}
                  </span>
                  <div className="p-2 bg-amber-50 text-amber-655 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-sans font-black text-3.5xl text-stone-900">{metrics.averageDuration}</h3>
                  <p className="text-[#6B7280] text-[10.5px] font-medium leading-normal">
                    {lang === 'FR' ? "Minutes par entretien" : "Minutes per simulated session"}
                  </p>
                </div>
              </div>

            </div>

            {/* Visual Bento Analytics & Localization Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Activity Lightweight Custom SVG/HTML Chart */}
              <div className="lg:col-span-2 bg-white border border-stone-200 p-6 rounded-3xl shadow-xs text-left space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-sans font-black text-base text-stone-900">
                      {lang === 'FR' ? "Activité Quotidienne" : "Daily Flow Metrics"}
                    </h3>
                    <p className="text-stone-400 text-xs font-semibold">
                      {lang === 'FR' ? "Indice d'utilisation des 5 derniers jours" : "Log counts over past 5 active periods"}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-stone-900 rounded-xs"></span>
                      <span>{lang === 'FR' ? "Utilisateurs" : "Users"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-xs"></span>
                      <span>{lang === 'FR' ? "Entretiens" : "Started"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs"></span>
                      <span>{lang === 'FR' ? "Complétés" : "Completed"}</span>
                    </div>
                  </div>
                </div>

                {/* Grid Visual Columns */}
                <div className="relative h-64 border-b border-stone-200 mt-6 flex items-end justify-between px-6 pb-2">
                  
                  {metrics.dailyActivity.map((day: any, i: number) => {
                    const maxVal = Math.max(5, ...metrics.dailyActivity.map((d: any) => Math.max(d.usersCount, d.interviewsCount)));
                    
                    const usersHeight = `${Math.min(100, Math.max(10, (day.usersCount / maxVal) * 100))}%`;
                    const interviewsHeight = `${Math.min(100, Math.max(10, (day.interviewsCount / maxVal) * 100))}%`;
                    const completionHeight = `${Math.min(100, Math.max(10, (day.completionCount / maxVal) * 100))}%`;

                    return (
                      <div key={i} className="flex flex-col items-center gap-2 w-1/5 group">
                        
                        {/* Stacked columns wrapper */}
                        <div className="flex items-end justify-center gap-1.5 w-full h-44 relative">
                          
                          {/* Users Bar */}
                          <div 
                            className="w-3 bg-stone-950 rounded-t-sm transition-all duration-700 ease-out cursor-pointer relative"
                            style={{ height: usersHeight }}
                            title={`${day.usersCount} users`}
                          />

                          {/* Interviews Bar */}
                          <div 
                            className="w-3 bg-indigo-500 rounded-t-sm transition-all duration-700 ease-out cursor-pointer relative"
                            style={{ height: interviewsHeight }}
                            title={`${day.interviewsCount} sessions`}
                          />

                          {/* Completion Bar */}
                          <div 
                            className="w-3 bg-emerald-500 rounded-t-sm transition-all duration-700 ease-out cursor-pointer relative"
                            style={{ height: completionHeight }}
                            title={`${day.completionCount} completed`}
                          />

                        </div>

                        {/* Label Date */}
                        <span className="font-mono text-[10px] font-black text-stone-500 tracking-tight">
                          {day.date}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Language distribution & Super Admin Toggles Side Bento */}
              <div className="space-y-6">
                
                {/* Language Distribution */}
                <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs text-left space-y-4">
                  <div className="space-y-0.5">
                    <h3 className="font-sans font-black text-base text-stone-900">
                      {lang === 'FR' ? "Distribution des Langues" : "Language Preferences"}
                    </h3>
                    <p className="text-stone-400 text-xs font-semibold">
                      {lang === 'FR' ? "Répartition linguistique des profils" : "Profiles distribution ratio"}
                    </p>
                  </div>

                  {/* Ratio bar visualizer */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-stone-900 rounded-full"></span>
                        FR: {metrics.languageDistribution.FR}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-stone-300 rounded-full"></span>
                        EN: {metrics.languageDistribution.EN}
                      </span>
                    </div>

                    <div className="w-full bg-stone-100 h-4 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-stone-950 h-full"
                        style={{ width: `${(metrics.languageDistribution.FR / (metrics.languageDistribution.FR + metrics.languageDistribution.EN)) * 100}%` }}
                      />
                      <div 
                        className="bg-stone-300 h-full"
                        style={{ width: `${(metrics.languageDistribution.EN / (metrics.languageDistribution.FR + metrics.languageDistribution.EN)) * 100}%` }}
                      />
                    </div>

                    <p className="text-[10.5px] font-medium text-stone-400 text-center italic">
                      {lang === 'FR' 
                        ? "La majorité des candidats préfèrent le parcours par défaut (Français)."
                        : "Localization ratio favors English for international engineering roles."}
                    </p>
                  </div>
                </div>

                {/* Super Admin Special Bento Controls (Unlocked for Super Admins) */}
                {isSuperAdmin && (
                  <div className="bg-stone-950 text-stone-200 border border-stone-900 p-6 rounded-3xl shadow-md text-left space-y-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      <h4 className="font-sans font-black text-[11px] uppercase tracking-wider text-stone-200">
                        {lang === 'FR' ? "CONTRÔLES SUPER ADMIN" : "SUPER ADMIN LIVE TUNING"}
                      </h4>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Toggle 1: Auto Evaluation */}
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-stone-300">{lang === 'FR' ? "Auto-Évaluation" : "Auto Scoring"}</span>
                        <button 
                          onClick={() => setAutoEvaluation(!autoEvaluation)}
                          className={`w-10 h-5.5 rounded-full transition-all border p-0.5 ${autoEvaluation ? 'bg-emerald-500 border-emerald-600 flex justify-end' : 'bg-stone-850 border-stone-750 flex justify-start'}`}
                        >
                          <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
                        </button>
                      </div>

                      {/* Toggle 2: Voice API Stream */}
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-stone-300">{lang === 'FR' ? "Moteur vocal TTS" : "Voice Engine"}</span>
                        <button 
                          onClick={() => setVoiceStream(!voiceStream)}
                          className={`w-10 h-5.5 rounded-full transition-all border p-0.5 ${voiceStream ? 'bg-emerald-500 border-emerald-600 flex justify-end' : 'bg-stone-850 border-stone-750 flex justify-start'}`}
                        >
                          <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
                        </button>
                      </div>

                      {/* Input 3: Platform Limit */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-medium text-stone-300">{lang === 'FR' ? "Seuil sessions max" : "Session cap limit"}</span>
                        <input 
                          type="number"
                          value={platformLimit}
                          onChange={(e) => setPlatformLimit(Number(e.target.value))}
                          className="w-16 bg-stone-900 text-stone-100 text-center font-mono font-bold text-xs border border-stone-800 rounded px-1 py-0.5"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Quick overview of security warnings */}
            <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl flex items-start gap-4 text-left">
              <ShieldAlert className="w-5 h-5 text-amber-650 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wide">
                  {lang === 'FR' ? "VÉRIFICATION DE SÉCURITÉ DE LA PLATEFORME" : "PLATFORM COMPLIANCE SECURITY WATCH"}
                </h4>
                <p className="text-amber-800 text-xs leading-relaxed">
                  {lang === 'FR'
                    ? "Toutes les actions d'administration (activation/désactivation, changement de rôle) sont enregistrées de façon immuable dans l'audit de sécurité local de SHANA."
                    : "All actions triggered within this workspace are logged in real-time under compliant backoffice rules."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT (With real pagination, search, complete filters, profile view drawer) */}
        {activeSubTab === 'users' && (
          <div className="space-y-6">
            
            {/* Extended Filter Bar */}
            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs flex flex-col xl:flex-row gap-4 items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative w-full xl:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={lang === 'FR' ? "Rechercher par nom ou email..." : "Search by name or email..."}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-stone-200 bg-stone-50 hover:bg-stone-100/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all font-sans"
                />
              </div>

              {/* Extended Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
                
                {/* Filter: Role */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono font-bold text-stone-400 uppercase">Role</span>
                  <select
                    value={userRoleFilter}
                    onChange={(e: any) => setUserRoleFilter(e.target.value)}
                    className="border border-stone-200 rounded-xl text-xs px-2.5 py-1.5 bg-white font-semibold font-sans focus:outline-none"
                  >
                    <option value="all">{lang === 'FR' ? "Tous" : "All"}</option>
                    <option value="candidate">{lang === 'FR' ? "Candidat" : "Candidate"}</option>
                    <option value="admin">{lang === 'FR' ? "Admin" : "Admin"}</option>
                    <option value="super_admin">{lang === 'FR' ? "Super Admin" : "Super Admin"}</option>
                  </select>
                </div>

                {/* Filter: Status */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono font-bold text-stone-400 uppercase">Status</span>
                  <select
                    value={userStatusFilter}
                    onChange={(e: any) => setUserStatusFilter(e.target.value)}
                    className="border border-stone-200 rounded-xl text-xs px-2.5 py-1.5 bg-white font-semibold font-sans focus:outline-none"
                  >
                    <option value="all">{lang === 'FR' ? "Tous" : "All"}</option>
                    <option value="enabled">{lang === 'FR' ? "Actif" : "Active"}</option>
                    <option value="disabled">{lang === 'FR' ? "Désactivé" : "Disabled"}</option>
                  </select>
                </div>

                {/* Filter: Language (French / English) */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono font-bold text-stone-400 uppercase">Lang</span>
                  <select
                    value={userLangFilter}
                    onChange={(e: any) => setUserLangFilter(e.target.value)}
                    className="border border-stone-200 rounded-xl text-xs px-2.5 py-1.5 bg-white font-semibold font-sans focus:outline-none"
                  >
                    <option value="all">{lang === 'FR' ? "Toutes" : "All"}</option>
                    <option value="French">{lang === 'FR' ? "Français" : "French"}</option>
                    <option value="English">{lang === 'FR' ? "Anglais" : "English"}</option>
                  </select>
                </div>

                {/* Filter: Date Created */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono font-bold text-stone-400 uppercase">Date</span>
                  <select
                    value={userDateFilter}
                    onChange={(e: any) => setUserDateFilter(e.target.value)}
                    className="border border-stone-200 rounded-xl text-xs px-2.5 py-1.5 bg-white font-semibold font-sans focus:outline-none"
                  >
                    <option value="all">{lang === 'FR' ? "Tous temps" : "All Time"}</option>
                    <option value="24h">{lang === 'FR' ? "Dernières 24h" : "Last 24 Hours"}</option>
                    <option value="7d">{lang === 'FR' ? "7 derniers jours" : "Last 7 Days"}</option>
                    <option value="30d">{lang === 'FR' ? "30 derniers jours" : "Last 30 Days"}</option>
                  </select>
                </div>

              </div>

            </div>

            {/* List View Table with Pagination */}
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-400 font-mono text-[9px] uppercase tracking-widest font-bold">
                      <th className="px-6 py-4">{lang === 'FR' ? "Utilisateur" : "User"}</th>
                      <th className="px-6 py-4">{lang === 'FR' ? "Rôle" : "Role"}</th>
                      <th className="px-6 py-4">{lang === 'FR' ? "Statut" : "Status"}</th>
                      <th className="px-6 py-4">{lang === 'FR' ? "Langue" : "Language"}</th>
                      <th className="px-6 py-4">{lang === 'FR' ? "Créé le" : "Created At"}</th>
                      <th className="px-6 py-4 text-right">{lang === 'FR' ? "Action" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-sans">
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-stone-400 italic">
                          {lang === 'FR' ? "Aucun utilisateur ne correspond aux critères de filtrage." : "No candidates found for current filter settings."}
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map(user => {
                        const isSelf = user.id === currentUser.id;
                        const uProfile = profileMap.get(user.id);
                        const userLang = uProfile?.language || 'French';
                        
                        return (
                          <tr key={user.id} className="hover:bg-stone-50/30 transition-colors">
                            
                            {/* User details */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-950 flex items-center justify-center text-white font-black text-xs">
                                  {user.firstName[0]}
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-stone-900">
                                    {user.firstName} {user.lastName} {isSelf && <span className="text-stone-400 text-[10px] font-normal italic">({lang === 'FR' ? "moi" : "you"})</span>}
                                  </p>
                                  <p className="text-stone-400 text-[11px] font-mono">{user.email}</p>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="px-6 py-4 font-semibold">
                              {isSuperAdmin ? (
                                <select
                                  disabled={isSelf}
                                  value={user.role || 'candidate'}
                                  onChange={(e) => handleChangeUserRole(user, e.target.value as any)}
                                  className="border border-stone-200 rounded-lg px-2 py-1 text-xs bg-stone-50 font-bold focus:outline-none focus:ring-1 focus:ring-stone-400"
                                >
                                  <option value="candidate">{lang === 'FR' ? "Candidat" : "Candidate"}</option>
                                  <option value="admin">{lang === 'FR' ? "Admin" : "Admin"}</option>
                                  <option value="super_admin">{lang === 'FR' ? "Super Admin" : "Super Admin"}</option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                                  user.role === 'super_admin'
                                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                                    : user.role === 'admin'
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                                    : 'bg-stone-100 border-stone-200 text-stone-600'
                                }`}>
                                  {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Candidate'}
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide border ${
                                user.status === 'disabled'
                                  ? 'bg-red-50 border-red-100 text-red-700'
                                  : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              }`}>
                                {user.status === 'disabled' ? (
                                  <>
                                    <XCircle className="w-3 h-3 text-red-500" />
                                    <span>{lang === 'FR' ? "Désactivé" : "Disabled"}</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                                    <span>{lang === 'FR' ? "Actif" : "Active"}</span>
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Language */}
                            <td className="px-6 py-4">
                              <span className="font-bold text-stone-700 font-mono text-[10.5px]">
                                {userLang === 'French' ? 'FR' : 'EN'}
                              </span>
                            </td>

                            {/* Created Date */}
                            <td className="px-6 py-4 text-stone-500 font-mono text-[11px]">
                              {new Date(user.createdAt).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>

                            {/* Manage Details Drawer button */}
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleOpenUserProfile(user)}
                                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-850 font-semibold rounded-lg text-[10.5px] uppercase tracking-wide border border-stone-200 transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{lang === 'FR' ? "Inspecter" : "Inspect"}</span>
                              </button>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {filteredUsers.length > 0 && (
                <div className="bg-stone-50 border-t border-stone-200 px-6 py-4 flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-semibold">
                    {lang === 'FR' 
                      ? `Affichage ${indexOfFirstUser + 1} - ${Math.min(indexOfLastUser, filteredUsers.length)} sur ${filteredUsers.length} utilisateurs`
                      : `Showing ${indexOfFirstUser + 1} - ${Math.min(indexOfLastUser, filteredUsers.length)} of ${filteredUsers.length} profiles`}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUserPage(p => Math.max(1, p - 1))}
                      disabled={userPage === 1}
                      className="p-1.5 bg-white border border-stone-200 rounded-lg text-stone-600 disabled:opacity-40 enabled:hover:bg-stone-100 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="font-bold text-stone-800">
                      Page {userPage} / {totalUserPages}
                    </span>

                    <button
                      onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                      disabled={userPage === totalUserPages}
                      className="p-1.5 bg-white border border-stone-200 rounded-lg text-stone-600 disabled:opacity-40 enabled:hover:bg-stone-100 transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        )}

        {/* TAB 3: INTERVIEW MONITORING (Dynamic tracker board + active red pulses + detailed timeline timeline notes) */}
        {activeSubTab === 'interviews' && (
          <div className="space-y-6">
            
            {/* Monitoring Stats bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-stone-200 p-5 rounded-2xl text-left">
                <p className="text-stone-400 font-mono text-[9px] uppercase tracking-widest font-black">ACTIVE SIMULATIONS</p>
                <div className="flex items-center gap-2 mt-1">
                  <h4 className="text-2xl font-black text-stone-900">{sessions.filter(s => s.status === 'active').length}</h4>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                </div>
              </div>
              <div className="bg-white border border-stone-200 p-5 rounded-2xl text-left">
                <p className="text-stone-400 font-mono text-[9px] uppercase tracking-widest font-black">COMPLETED TIMELINES</p>
                <h4 className="text-2xl font-black text-stone-900 mt-1">{sessions.filter(s => s.status === 'completed').length}</h4>
              </div>
              <div className="bg-white border border-stone-200 p-5 rounded-2xl text-left">
                <p className="text-stone-400 font-mono text-[9px] uppercase tracking-widest font-black">PAUSED/CANCELLED</p>
                <h4 className="text-2xl font-black text-stone-900 mt-1">
                  {sessions.filter(s => s.status === 'paused' || s.status === 'cancelled').length}
                </h4>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={interviewSearch}
                  onChange={(e) => setInterviewSearch(e.target.value)}
                  placeholder={lang === 'FR' ? "Rechercher une session par candidat, email, id..." : "Search session by candidate, email, id..."}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-stone-200 bg-stone-50 hover:bg-stone-100/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all font-sans"
                />
              </div>

              {/* State Select */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={interviewStatusFilter}
                  onChange={(e: any) => setInterviewStatusFilter(e.target.value)}
                  className="border border-stone-200 rounded-xl text-xs px-3 py-1.5 bg-white font-semibold font-sans focus:outline-none"
                >
                  <option value="all">{lang === 'FR' ? "Tous les Statuts" : "All Session States"}</option>
                  <option value="active">{lang === 'FR' ? "🔴 En direct" : "🔴 Live Active"}</option>
                  <option value="paused">{lang === 'FR' ? "⏸ Suspendus" : "⏸ Paused"}</option>
                  <option value="completed">{lang === 'FR' ? "✓ Complétés" : "✓ Completed"}</option>
                  <option value="cancelled">{lang === 'FR' ? "✗ Annulés" : "✗ Cancelled"}</option>
                </select>
              </div>

            </div>

            {/* Monitoring Table */}
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-400 font-mono text-[9px] uppercase tracking-widest font-bold">
                      <th className="px-6 py-4">{lang === 'FR' ? "ID Session" : "Session ID"}</th>
                      <th className="px-6 py-4">{lang === 'FR' ? "Candidat" : "Candidate"}</th>
                      <th className="px-6 py-4">{lang === 'FR' ? "Mode" : "Mode"}</th>
                      <th className="px-6 py-4">{lang === 'FR' ? "Phase Actuelle" : "Current Phase"}</th>
                      <th className="px-6 py-4">{lang === 'FR' ? "Durée" : "Duration"}</th>
                      <th className="px-6 py-4">{lang === 'FR' ? "Progression" : "Progress"}</th>
                      <th className="px-6 py-4">{lang === 'FR' ? "Statut" : "Status"}</th>
                      <th className="px-6 py-4 text-right">{lang === 'FR' ? "Action" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-sans">
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-stone-400 italic">
                          {lang === 'FR' ? "Aucun entretien ne correspond." : "No monitoring sessions active or matching filters."}
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map(sess => {
                        const isActive = sess.status === 'active';
                        return (
                          <tr key={sess.id} className="hover:bg-stone-50/20 transition-all">
                            
                            {/* Session ID */}
                            <td className="px-6 py-4 font-mono text-stone-400 text-[10px] font-bold">
                              {sess.id}
                            </td>

                            {/* Candidate */}
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-stone-900">{sess.candidateName}</p>
                                <p className="text-stone-400 text-[11px] font-mono">{sess.candidateEmail}</p>
                              </div>
                            </td>

                            {/* Mode & Lang */}
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider border px-2 py-0.5 rounded ${
                                sess.mode === 'ASSESSMENT' 
                                  ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                              }`}>
                                {sess.mode} ({sess.language})
                              </span>
                            </td>

                            {/* Current Phase */}
                            <td className="px-6 py-4 font-bold text-stone-750">
                              {sess.currentPhase || 'Setup'}
                            </td>

                            {/* Duration */}
                            <td className="px-6 py-4 font-mono text-stone-500 font-bold">
                              {sess.duration || '00:00'}
                            </td>

                            {/* Progression */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-black text-stone-700">{sess.progress}%</span>
                                <div className="w-20 bg-stone-100 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      sess.status === 'completed' 
                                        ? 'bg-emerald-500' 
                                        : sess.status === 'cancelled' 
                                        ? 'bg-stone-400' 
                                        : 'bg-indigo-500'
                                    }`}
                                    style={{ width: `${sess.progress}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                                  LIVE
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide border ${
                                  sess.status === 'completed'
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                    : sess.status === 'paused'
                                    ? 'bg-amber-50 border-amber-100 text-amber-700'
                                    : 'bg-stone-100 border-stone-200 text-stone-500'
                                }`}>
                                  {sess.status === 'completed' ? '✓ DONE' : sess.status === 'paused' ? '⏸ PAUSED' : '✗ CANCELLED'}
                                </span>
                              )}
                            </td>

                            {/* Actions Inspect Timeline */}
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleOpenSessionDetails(sess)}
                                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-stone-50 font-semibold rounded-lg text-[10.5px] uppercase tracking-wide transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                              >
                                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{lang === 'FR' ? "Suivre" : "Monitor"}</span>
                              </button>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: PARAMÈTRES (Sleek slate interface preferences) */}
        {activeSubTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Categories sidebar */}
            <div className="bg-white border border-stone-200 p-4 rounded-3xl space-y-1.5 text-left h-fit">
              {[
                { id: 'general', label: lang === 'FR' ? 'Général' : 'General' },
                { id: 'interview', label: lang === 'FR' ? 'Entretiens (IA)' : 'Interviews (AI)' },
                { id: 'languages', label: lang === 'FR' ? 'Langues' : 'Languages' },
                { id: 'security', label: lang === 'FR' ? 'Sécurité' : 'Security' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSettingsCategory(cat.id as any)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                    settingsCategory === cat.id
                      ? 'bg-stone-100 text-stone-950 border border-stone-200 shadow-inner'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Category Workspace */}
            <div className="md:col-span-3 bg-white border border-stone-200 p-6 rounded-3xl text-left space-y-6">
              
              {settingsCategory === 'general' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2 uppercase tracking-wide">
                    {lang === 'FR' ? "Paramètres Généraux de la Plateforme" : "General Platform Preferences"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium space-y-1 sm:space-y-0">
                    <div className="space-y-1">
                      <label className="text-stone-400 font-semibold">{lang === 'FR' ? "Nom de l'application" : "Application Name"}</label>
                      <input type="text" readOnly value="SHANA SYSTEM" className="w-full border border-stone-200 rounded-xl px-3 py-2 bg-stone-50 text-stone-500 focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-400 font-semibold">{lang === 'FR' ? "Version logicielle" : "Software Build"}</label>
                      <input type="text" readOnly value="v2.2.0-prod" className="w-full border border-stone-200 rounded-xl px-3 py-2 bg-stone-50 text-stone-500 focus:outline-none" />
                    </div>
                  </div>
                  <p className="text-stone-400 text-[10.5px] leading-relaxed">
                    {lang === 'FR' ? "Note : La configuration générale est initialisée par fichier de blueprint et figée pour le preview." : "Note: General build configurations are pinned and immutable in this backoffice foundation."}
                  </p>
                </div>
              )}

              {settingsCategory === 'interview' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2 uppercase tracking-wide">
                    {lang === 'FR' ? "Contrôles de l'Intelligence Artificielle" : "AI Simulation Configuration"}
                  </h4>
                  <div className="space-y-3 font-medium text-xs">
                    <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-150 rounded-xl">
                      <div className="space-y-0.5">
                        <p className="font-bold text-stone-800">{lang === 'FR' ? "Moteur d'évaluation principal" : "Primary AI Engine"}</p>
                        <p className="text-stone-400 text-[10px]">{lang === 'FR' ? "Utilisé pour la génération de questions et analyses" : "Used for structured pipeline reasoning"}</p>
                      </div>
                      <span className="font-mono text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                        OPENAI GPT-4o
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-150 rounded-xl">
                      <div className="space-y-0.5">
                        <p className="font-bold text-stone-800">{lang === 'FR' ? "Synthèse vocale (TTS)" : "Text-to-Speech (TTS)"}</p>
                        <p className="text-stone-400 text-[10px]">{lang === 'FR' ? "Génère l'audio de l'intervieweur virtuel" : "Generates simulated interviewer spoken dialog"}</p>
                      </div>
                      <span className="font-mono text-[9px] bg-stone-100 text-stone-700 border border-stone-200 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                        Edge Speech SDK
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {settingsCategory === 'languages' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2 uppercase tracking-wide">
                    {lang === 'FR' ? "Régionalisation" : "Localization Rules"}
                  </h4>
                  <div className="space-y-2 text-xs font-semibold">
                    <p className="text-stone-700">{lang === 'FR' ? "Langues actives de l'interface :" : "Activated interface systems:"}</p>
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-black uppercase">
                        FR (Défaut)
                      </span>
                      <span className="px-2.5 py-1 bg-stone-100 text-stone-600 border border-stone-200 rounded-lg text-[10px] font-black uppercase">
                        EN (Complémentaire)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {settingsCategory === 'security' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2 uppercase tracking-wide">
                    {lang === 'FR' ? "Gouvernance & Sécurité" : "Backoffice Governance Security"}
                  </h4>
                  <div className="space-y-3 text-xs font-semibold text-stone-700">
                    <div className="flex items-center gap-2 p-3 bg-red-50/50 border border-red-100 text-red-800 rounded-xl">
                      <Lock className="w-4 h-4 text-red-550 shrink-0" />
                      <p className="text-[11px]">
                        {lang === 'FR'
                          ? "Protection des rôles : Seul un Super Administrateur peut accorder des droits d'accès à la console."
                          : "Governance warning: Only accounts verified as Super Admin can distribute administrative tokens."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS (Immutable Chronology Trace - SUPER ADMIN ONLY) */}
        {activeSubTab === 'audit' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 p-6 rounded-3xl text-left space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-base text-stone-900">
                    {lang === 'FR' ? "Journal d'Audit Système Immuable" : "Security Activity Audit Logs"}
                  </h3>
                  <p className="text-[#6B7280] text-xs font-semibold mt-1">
                    {lang === 'FR' 
                      ? "Trame chronologique sécurisée des connexions d'administration, modifications de rôle et notes."
                      : "Strict timestamped trace of administrative credentials and state modifications."}
                  </p>
                </div>
                <span className="font-mono text-[9px] bg-red-100 border border-red-200 text-red-700 px-2 py-0.5 rounded font-black">
                  SECURE_AUDIT
                </span>
              </div>

              {/* Audit logs listing */}
              <div className="space-y-3 mt-4 max-h-[480px] overflow-y-auto pr-2">
                {auditLogs.map((log) => {
                  const isRole = log.type === 'ROLE_UPDATE';
                  const isLogin = log.type === 'LOGIN';

                  return (
                    <div 
                      key={log.id} 
                      className="p-4 border border-stone-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left bg-stone-50/30 hover:bg-stone-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wide border ${
                            isRole 
                              ? 'bg-amber-50 border-amber-200 text-amber-850' 
                              : isLogin 
                              ? 'bg-emerald-50 border-emerald-255 text-emerald-850'
                              : 'bg-stone-100 border-stone-250 text-stone-700'
                          }`}>
                            {log.type}
                          </span>
                          <span className="text-stone-900 font-bold text-xs">{log.action}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-stone-400 font-medium text-[10.5px]">
                          <span>
                            {lang === 'FR' ? "Par :" : "Triggered by :"} <strong className="text-stone-750 font-black">{log.performedBy.email}</strong> ({log.performedBy.role})
                          </span>
                          {log.targetUserId && (
                            <span>• {lang === 'FR' ? "Cible ID :" : "Target ID :"} <strong className="text-stone-600 font-mono text-[10px]">{log.targetUserId}</strong></span>
                          )}
                        </div>

                        {log.details && (
                          <p className="text-stone-500 font-mono text-[10px] bg-stone-100/50 p-2 rounded-lg border border-stone-150 mt-1.5 leading-relaxed">
                            {log.details}
                          </p>
                        )}
                      </div>

                      <div className="text-stone-400 font-mono text-[10.5px] whitespace-nowrap flex items-center gap-1 shrink-0 self-end sm:self-center">
                        <Clock className="w-3.5 h-3.5 text-stone-300" />
                        <span>{new Date(log.timestamp).toLocaleTimeString(lang === 'FR' ? 'fr-FR' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Super Admin Controls */}
            <div className="bg-stone-950 text-stone-300 border border-stone-800 p-6 rounded-3xl text-left space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className="font-sans font-black text-sm text-stone-50 uppercase tracking-widest">
                  {lang === 'FR' ? "Console des Pouvoirs Super Administrateur" : "Super Admin Special Credentials Console"}
                </h3>
              </div>
              <p className="text-stone-400 text-xs leading-relaxed max-w-3xl">
                {lang === 'FR'
                  ? "Vous disposez du contrôle total sur la plateforme. Vous pouvez nommer des modérateurs administrateurs, modifier les rôles fondamentaux de sécurité, visualiser l'historique d'audit et re-calibrer le moteur d'IA."
                  : "Additional super-user controls unlocked: govern administration credentials, override active limits, read encrypted auditing, and optimize neural networks."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <button 
                  onClick={() => alert(lang === 'FR' ? "La liste d'administration est synchronisée avec la table des utilisateurs." : "Admins are governed directly inside the Users list.")}
                  className="p-3 bg-stone-900 border border-stone-800 rounded-xl hover:bg-stone-850 hover:border-stone-750 transition-all text-left text-xs font-semibold text-stone-200 cursor-pointer space-y-1.5"
                >
                  <span className="font-mono text-[8.5px] font-bold text-amber-400 uppercase block tracking-wider">SECURE_CREDENTIALS</span>
                  <span>{lang === 'FR' ? "Gérer les Admins" : "Govern Admins"}</span>
                </button>

                <button 
                  onClick={() => alert(lang === 'FR' ? "Les rôles d'utilisateurs sont éditables à la volée depuis l'onglet Utilisateurs." : "Roles can be configured inline on the Users table.")}
                  className="p-3 bg-stone-900 border border-stone-800 rounded-xl hover:bg-stone-850 hover:border-stone-750 transition-all text-left text-xs font-semibold text-stone-200 cursor-pointer space-y-1.5"
                >
                  <span className="font-mono text-[8.5px] font-bold text-indigo-400 uppercase block tracking-wider">SYSTEM_SECURITY</span>
                  <span>{lang === 'FR' ? "Ajuster les Rôles" : "Configure Roles"}</span>
                </button>

                <button 
                  onClick={() => alert(lang === 'FR' ? "Journal d'audit en direct décrypté." : "Audit log is decrypted above.")}
                  className="p-3 bg-stone-900 border border-stone-800 rounded-xl hover:bg-stone-850 hover:border-stone-750 transition-all text-left text-xs font-semibold text-stone-200 cursor-pointer space-y-1.5"
                >
                  <span className="font-mono text-[8.5px] font-bold text-emerald-400 uppercase block tracking-wider">IMMUTABLE_LOGS</span>
                  <span>{lang === 'FR' ? "Tracer l'Audit de Sécurité" : "Inspect Security Audits"}</span>
                </button>

                <button 
                  onClick={() => alert(lang === 'FR' ? "Le moteur IA Shana fonctionne de façon optimale." : "AI core networks are running smoothly.")}
                  className="p-3 bg-stone-900 border border-stone-800 rounded-xl hover:bg-stone-850 hover:border-stone-750 transition-all text-left text-xs font-semibold text-stone-200 cursor-pointer space-y-1.5"
                >
                  <span className="font-mono text-[8.5px] font-bold text-red-400 uppercase block tracking-wider">PLATFORM_RESOURCES</span>
                  <span>{lang === 'FR' ? "Piloter la Plateforme" : "Optimize Platform"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PLATFORM CONTROL CENTER */}
        {activeSubTab === 'control-center' && (
          <ControlCenter currentUser={currentUser} lang={lang} />
        )}

        {/* TAB 7: AI OPERATIONS CENTER (AIOps) */}
        {activeSubTab === 'ai-operations' && (
          <AIOperations currentUser={currentUser} lang={lang} />
        )}

        {/* TAB 8: TRUST & COMPLIANCE CENTER */}
        {activeSubTab === 'trust' && (
          <TrustCenter currentUser={currentUser} lang={lang} />
        )}

        {/* TAB 9: BUSINESS & OPERATIONS CENTER */}
        {activeSubTab === 'business' && (
          <BusinessCenter currentUser={currentUser} lang={lang} />
        )}

        {/* TAB 10: MONETIZATION & ENTITLEMENTS CENTER */}
        {activeSubTab === 'monetization' && (
          <MonetizationCenter currentUser={currentUser} lang={lang} />
        )}

        {/* TAB 11: PAYMENTS & COMMERCE CENTER */}
        {activeSubTab === 'payments' && (
          <PaymentsCenter currentUser={currentUser} lang={lang} />
        )}

        {/* TAB 12: ENTERPRISE & TEAM WORKSPACE */}
        {activeSubTab === 'enterprise' && (
          <EnterpriseCenter currentUser={currentUser} lang={lang} />
        )}

        {/* TAB 13: INTEGRATIONS & WEBHOOK SYSTEMS */}
        {activeSubTab === 'integrations' && (
          <IntegrationsCenter currentUser={currentUser} lang={lang} />
        )}

        {/* TAB 13.5: OBSERVABILITY & SYSTEM MONITORING */}
        {activeSubTab === 'observability' && (
          <ObservabilityCenter currentUser={currentUser as any} lang={lang} />
        )}

        {/* TAB 13.6: SAAS METRICS & ROI ANALYTICS */}
        {activeSubTab === 'saas-metrics' && (
          <React.Suspense fallback={<div className="p-8 text-center text-sm font-mono text-stone-500 bg-stone-50 border border-dashed border-stone-200 rounded-2xl">Loading SaaS metrics & analytics dashboard...</div>}>
            <SaaSAnalyticsDashboard currentUserId={currentUser.id} lang={lang === 'FR' ? 'FR' : 'EN'} />
          </React.Suspense>
        )}

        {/* TAB 13.7: RECRUITER INTELLIGENCE DASHBOARD PANEL */}
        {activeSubTab === 'recruiter-intelligence' && (() => {
          const stats = RecruiterAnalyticsService.getAggregatedAnalytics();
          return (
            <div className="space-y-8 p-6 bg-white rounded-2xl border border-stone-200 shadow-xs text-left">
              {/* Header section */}
              <div className="border-b border-stone-100 pb-5">
                <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#18633F] font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#18633F] animate-pulse" />
                  {lang === 'FR' ? "MOTEUR PROPRIÉTAIRE DECISIONNEL" : "PROPRIETARY RECRUITER ENGINE"}
                </span>
                <h2 className="text-2xl font-sans font-black text-stone-900 tracking-tight">
                  {lang === 'FR' ? "Panneau de Décision & Télémétrie Recruteur" : "Recruiter Decision & Telemetry Intelligence"}
                </h2>
                <p className="text-xs text-[#6B7280] font-medium">
                  {lang === 'FR'
                    ? "Statistiques d'analyse anonymisées du moteur de décision Shana, couverture des compétences, force des preuves et indices de contradiction."
                    : "Anonymized analytical telemetry of Shana's recruiter decision engine, competency coverage, evidence quality ratios, and cognitive tracking."}
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                    {lang === 'FR' ? "Couverture Compétences Moyenne" : "Average Competency Coverage"}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-mono font-black text-stone-900">{stats.averageCompetencyCoverage}%</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#18633F] h-full rounded-full" style={{ width: `${stats.averageCompetencyCoverage}%` }} />
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                    {lang === 'FR' ? "Indice de Confiance Moyen" : "Average Evaluation Confidence"}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-mono font-black text-stone-900">{stats.averageEvaluationConfidence}%</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${stats.averageEvaluationConfidence}%` }} />
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                    {lang === 'FR' ? "Preuves Collectées par Session" : "Avg Evidence Collected"}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-mono font-black text-stone-900">{stats.averageEvidenceCollected}</span>
                    <span className="text-xs text-stone-400 font-bold">points</span>
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium">
                    {lang === 'FR' ? "Preuves réelles extraites du dialogue" : "Verifiable past achievements recorded"}
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                    {lang === 'FR' ? "Taux de Contradictions Moyen" : "Contradiction Frequency"}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-mono font-black text-rose-600">{stats.averageContradictionsCount}</span>
                    <span className="text-xs text-stone-400 font-bold">per session</span>
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium">
                    {lang === 'FR' ? "Incohérences sémantiques soulevées" : "Semantic mismatches challenged"}
                  </p>
                </div>
              </div>

              {/* Advanced Analytics Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Hiring Recommendation Distribution */}
                <div className="space-y-4">
                  <h3 className="text-sm font-sans font-black text-stone-900 uppercase tracking-wider">
                    {lang === 'FR' ? "Distribution des Décisions de Recrutement" : "Hiring Recommendation Distribution"}
                  </h3>
                  <div className="space-y-3 bg-stone-50 p-5 rounded-2xl border border-stone-150">
                    {Object.entries(stats.recommendationDistribution).map(([rec, count]) => {
                      const total = Object.values(stats.recommendationDistribution).reduce((a, b) => a + b, 0) || 1;
                      const percentage = Math.round((count / total) * 100);
                      const isPositive = rec.includes('Hire') && !rec.includes('No');
                      const isNegative = rec.includes('No');

                      return (
                        <div key={rec} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-stone-700">
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-stone-400'}`} />
                              {rec}
                            </span>
                            <span>{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-stone-400'}`} 
                              style={{ width: `${percentage || 1}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Evidence Quality & Explanations */}
                <div className="space-y-4">
                  <h3 className="text-sm font-sans font-black text-stone-900 uppercase tracking-wider">
                    {lang === 'FR' ? "Qualité des Preuves & Raisonnement IA" : "Evidence Quality & AI Reasoning"}
                  </h3>
                  <div className="bg-stone-50 p-5 rounded-2xl border border-stone-150 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                        <span className="text-xs font-bold text-stone-500">{lang === 'FR' ? "Type de preuve sémantique" : "Semantic Evidence Type"}</span>
                        <span className="text-xs font-bold text-stone-500">{lang === 'FR' ? "Niveau de Confiance" : "Assigned Confidence"}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                          {lang === 'FR' ? "Expérience Directe (Strong)" : "Direct Professional Experience (Strong)"}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-700">&gt; 90%</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800">
                          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                          {lang === 'FR' ? "Connaissance Pratique (Medium)" : "Practical Domain Knowledge (Medium)"}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-700">75% - 85%</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800">
                          <span className="w-2.5 h-2.5 rounded-sm bg-stone-400" />
                          {lang === 'FR' ? "Réponse Hypothétique (Weak)" : "Hypothetical Scenario (Weak)"}
                        </span>
                        <span className="text-xs font-mono font-bold text-stone-500">30% - 50%</span>
                      </div>
                    </div>

                    <div className="border-t border-stone-200 pt-3 space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                        {lang === 'FR' ? "Exemple de Raisonnement Cognitif Actif" : "Active Recruiter Reasoning Logic"}
                      </span>
                      <div className="bg-stone-900 text-stone-200 p-3 rounded-lg font-mono text-[10px] leading-relaxed border border-stone-800">
                        <p className="text-[#10B981]">{"// Shana Recruiter Brain Core State Loop"}</p>
                        <p>{"[02:44:12 PM] Checking lowest covered competencies..."}</p>
                        <p className="text-yellow-400">{"[02:44:12 PM] Gap found: 'conflict_resolution' (coverage 0%)"}</p>
                        <p>{"[02:44:12 PM] Next Objective set: Need conflict example"}</p>
                        <p className="text-blue-400">{"[02:44:12 PM] Action: Move interview stage to Behavioral Assessment"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explaining dynamic strategy */}
              <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-[#18633F]">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider">
                    {lang === 'FR' ? "Pas de script figé — Évaluation Dynamique" : "Zero Fixed Scripting — Dynamic Strategy Evaluation"}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {lang === 'FR'
                      ? "Chaque réponse modifie l'arbre de décision en temps réel. Si un candidat fournit d'emblée d'excellentes preuves sur un sujet, l'IA saute les étapes d'évaluation redondantes pour optimiser la durée de la session et maximiser l'expérience utilisateur."
                      : "Unlike basic scripted chatbots, Shana continuously adjusts its strategy. If rich competency evidence is gathered early, unnecessary assessment sections are dynamically bypassed, reducing fatigue and focusing entirely on high-signal inquiries."}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 13.8: CANDIDATE INTELLIGENCE DASHBOARD PANEL */}
        {activeSubTab === 'candidate-intelligence' && (() => {
          const stats = CandidateAnalyticsService.getAggregatedAnalytics();
          return (
            <div className="space-y-8 p-6 bg-white rounded-2xl border border-stone-200 shadow-xs text-left">
              {/* Header section */}
              <div className="border-b border-stone-100 pb-5">
                <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                  {lang === 'FR' ? "MOTEUR PROPRIÉTAIRE D'APPRENTISSAGE CONTINU" : "PROPRIETARY CONTINUOUS LEARNING ENGINE"}
                </span>
                <h2 className="text-2xl font-sans font-black text-stone-900 tracking-tight">
                  {lang === 'FR' ? "Panneau de Supervision Dossier Apprenant IA" : "Candidate Learner Intelligence Panel"}
                </h2>
                <p className="text-xs text-[#6B7280] font-medium">
                  {lang === 'FR'
                    ? "Télémétrie anonymisée du taux de progression, de l'engagement, de la rétention et de l'acquisition des compétences sur le long terme."
                    : "Anonymized telemetry tracking long-term career readiness, milestone achievements, skill growth rates, and retention loops."}
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                    {lang === 'FR' ? "Taux de Progression Moyen" : "Average Growth Rate"}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-mono font-black text-emerald-600">+{stats.averageGrowthRate}%</span>
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium">
                    {lang === 'FR' ? "Amélioration moyenne d'une session à l'autre" : "Average cross-session skill evolution"}
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                    {lang === 'FR' ? "Indice de Rétention" : "Retention Index"}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-mono font-black text-indigo-600">{stats.averageRetentionRate}%</span>
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium">
                    {lang === 'FR' ? "Régularité de pratique des candidats" : "Candidate cohort return & practice consistency"}
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                    {lang === 'FR' ? "Séances d'Entretien Complétées" : "Sessions Completed"}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-mono font-black text-stone-900">{stats.totalInterviewsCompleted}</span>
                    <span className="text-xs text-stone-400 font-bold">runs</span>
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium">
                    {lang === 'FR' ? "Diagnostics d'évaluation lancés" : "Total mock assessment iterations logs"}
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                    {lang === 'FR' ? "Succès des Objectifs" : "Milestones Unlocked"}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-mono font-black text-amber-600">{stats.milestonesUnlockedRatio}%</span>
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium">
                    {lang === 'FR' ? "Proportion de badges débloqués" : "Percentage of career achievements unlocked"}
                  </p>
                </div>
              </div>

              {/* Bento Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Readiness & Progression distribution */}
                <div className="space-y-4">
                  <h3 className="text-sm font-sans font-black text-stone-900 uppercase tracking-wider">
                    {lang === 'FR' ? "Distribution de la Préparabilité" : "Hiring Readiness Distribution"}
                  </h3>
                  <div className="bg-stone-50 p-5 rounded-2xl border border-stone-150 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {lang === 'FR' ? "Prêt pour Recrutement (>80%)" : "Hiring Ready (>80%)"}
                        </span>
                        <span className="text-xs font-mono font-bold text-stone-900">{stats.readinessDistribution.ready} {lang === 'FR' ? "candidats" : "candidates"}</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(stats.readinessDistribution.ready / (stats.readinessDistribution.ready + stats.readinessDistribution.growing + stats.readinessDistribution.beginning || 1)) * 100}%` }} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {lang === 'FR' ? "En cours d'acquisition (50-80%)" : "Progressing (50-80%)"}
                        </span>
                        <span className="text-xs font-mono font-bold text-stone-900">{stats.readinessDistribution.growing} {lang === 'FR' ? "candidats" : "candidates"}</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(stats.readinessDistribution.growing / (stats.readinessDistribution.ready + stats.readinessDistribution.growing + stats.readinessDistribution.beginning || 1)) * 100}%` }} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          {lang === 'FR' ? "Bases à consolider (<50%)" : "Beginning Gaps (<50%)"}
                        </span>
                        <span className="text-xs font-mono font-bold text-stone-900">{stats.readinessDistribution.beginning} {lang === 'FR' ? "candidats" : "candidates"}</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(stats.readinessDistribution.beginning / (stats.readinessDistribution.ready + stats.readinessDistribution.growing + stats.readinessDistribution.beginning || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Most improved & Learning trends */}
                <div className="space-y-4">
                  <h3 className="text-sm font-sans font-black text-stone-900 uppercase tracking-wider">
                    {lang === 'FR' ? "Tendances d'Apprentissage & Axes Clés" : "Learning Trends & Core Axes"}
                  </h3>
                  <div className="bg-stone-50 p-5 rounded-2xl border border-stone-150 space-y-4">
                    <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                      <span className="text-xs font-bold text-stone-500">{lang === 'FR' ? "Compétence la plus travaillée" : "Most Targeted Competency"}</span>
                      <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{stats.mostImprovedCompetency}</span>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                        {lang === 'FR' ? "Comportement du Moteur Prédictif" : "Predictive Engine Diagnostics"}
                      </span>
                      <div className="bg-stone-900 text-stone-200 p-4 rounded-xl font-mono text-[10px] leading-relaxed border border-stone-800">
                        <p className="text-indigo-400">{"// Shana Candidate Brain Engine"}</p>
                        <p>{"[SYSTEM] Core Learner profile update triggers active."}</p>
                        <p className="text-emerald-400">{"[SYSTEM] Average speaking fluency index: 82%"}</p>
                        <p>{"[SYSTEM] Suggestion strategy adjusted: personalized coaching track adapted."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 13.9: KNOWLEDGE INTELLIGENCE GRAPH PANEL */}
        {activeSubTab === 'knowledge-intelligence' && (
          <KnowledgeIntelligencePanel lang={lang} />
        )}

        {/* TAB 13.10: SMTP & EMAIL DISPATCH CONSOLE */}
        {activeSubTab === 'smtp-simulation' && (
          <div className="space-y-6 text-left">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6">
              <div className="border-b border-stone-100 pb-5 mb-6">
                <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/50 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {lang === 'FR' ? "CONTRÔLE D'ENVOI EMAIL & SMTP RÉEL" : "REAL SMTP & EMAIL DISPATCH CONSOLE"}
                </span>
                <h2 className="text-2xl font-sans font-black text-stone-900 tracking-tight">
                  {lang === 'FR' ? "Console d'Envoi E-mail & Resend" : "Email Dispatch & Resend Console"}
                </h2>
                <p className="text-xs text-[#6B7280] font-medium">
                  {lang === 'FR'
                    ? "Console d'administration pour tester, tracer et superviser l'envoi réel de vos courriels transactionnels via le service Resend et les serveurs SMTP configurés."
                    : "Administrative control console to test, trace, and monitor real outbound transactional emails dispatched via Resend API and custom SMTP servers."}
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <EmailSimulator inline={true} userEmail={currentUser.email} userName={currentUser.firstName} />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL / DRAWER 1: USER DETAILED PROFILE VIEW */}
      {selectedUser && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-end z-50 animate-fade-in">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col text-left overflow-hidden border-l border-stone-200">
            
            {/* Drawer Header */}
            <div className="bg-stone-50 border-b border-stone-200 p-6 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-black uppercase">
                    {lang === 'FR' ? "PROFIL CANDIDAT" : "CANDIDATE DOSSIER"}
                  </span>
                  <span className="font-mono text-[10px] text-stone-400">ID: {selectedUser.id}</span>
                </div>
                <h3 className="font-sans font-black text-xl text-stone-900 tracking-tight">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
              </div>
              
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 rounded-full transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Profile Details Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Email, status */}
                <div className="bg-stone-50 border border-stone-150 p-4 rounded-xl space-y-3">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-mono font-bold text-stone-400 uppercase">{lang === 'FR' ? "COORDONNÉES" : "CONTACTS"}</p>
                    <p className="font-bold text-stone-900 text-xs">{selectedUser.email}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-mono font-bold text-stone-400 uppercase">{lang === 'FR' ? "STATUT DU COMPTE" : "ACCOUNT SYSTEM STATUS"}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleToggleUserStatus(selectedUser)}
                        disabled={selectedUser.id === currentUser.id}
                        className={`px-3 py-1 bg-white border rounded-lg text-[10.5px] font-black uppercase tracking-wide cursor-pointer flex items-center gap-1.5 transition-all ${
                          selectedUser.status === 'disabled'
                            ? 'border-red-200 text-red-700 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {selectedUser.status === 'disabled' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        <span>{selectedUser.status === 'disabled' ? (lang === 'FR' ? "Compte suspendu" : "Suspended") : (lang === 'FR' ? "Compte activé" : "Active")}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role, lang */}
                <div className="bg-stone-50 border border-stone-150 p-4 rounded-xl space-y-3">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-mono font-bold text-stone-400 uppercase">{lang === 'FR' ? "GOUVERNANCE DES ACCÈS" : "ADMIN ROLE GOVERNANCE"}</p>
                    {isSuperAdmin && selectedUser.id !== currentUser.id ? (
                      <select
                        value={selectedUser.role || 'candidate'}
                        onChange={(e) => handleChangeUserRole(selectedUser, e.target.value as any)}
                        className="border border-stone-200 rounded-lg px-2 py-1 text-xs bg-white font-bold focus:outline-none focus:ring-1 focus:ring-stone-400 mt-1"
                      >
                        <option value="candidate">{lang === 'FR' ? "Candidat" : "Candidate"}</option>
                        <option value="admin">{lang === 'FR' ? "Admin" : "Admin"}</option>
                        <option value="super_admin">{lang === 'FR' ? "Super Admin" : "Super Admin"}</option>
                      </select>
                    ) : (
                      <p className="font-bold text-stone-900 text-xs uppercase pt-1">{selectedUser.role || 'candidate'}</p>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-mono font-bold text-stone-400 uppercase">{lang === 'FR' ? "LANGUE & PREVIEW" : "LOCALIZATION SETUP"}</p>
                    <p className="font-bold text-stone-900 text-xs pt-1">
                      {profileMap.get(selectedUser.id)?.language === 'French' ? 'Français (FR)' : 'English (EN)'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Professional Profile details if onboarded */}
              {profileMap.get(selectedUser.id) ? (
                <div className="bg-stone-50 border border-stone-150 p-5 rounded-2xl text-left space-y-3">
                  <h4 className="font-mono text-[10px] font-black uppercase text-stone-400 tracking-wider">
                    {lang === 'FR' ? "FICHE PROFESSIONNELLE" : "ONBOARDING PROFILE DOSSIER"}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-stone-800">
                    <div>
                      <p className="text-stone-400 font-bold">{lang === 'FR' ? "Rôle visé" : "Target Role"}</p>
                      <p className="text-stone-900">{profileMap.get(selectedUser.id)?.targetRole}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 font-bold">{lang === 'FR' ? "Secteur d'activité" : "Industry"}</p>
                      <p className="text-stone-900">{profileMap.get(selectedUser.id)?.industry}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 font-bold">{lang === 'FR' ? "Années d'expérience" : "Experience Level"}</p>
                      <p className="text-stone-900">{profileMap.get(selectedUser.id)?.experienceYears} {lang === 'FR' ? 'ans' : 'years'}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 font-bold">{lang === 'FR' ? "Onboarding" : "Onboarding status"}</p>
                      <span className="text-emerald-700 text-[10.5px]">✓ {lang === 'FR' ? "Complété" : "Completed"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-stone-200 border-dashed rounded-xl text-center text-stone-400 italic text-xs">
                  {lang === 'FR' ? "Onboarding non encore initié par le candidat." : "Candidate hasn't completed onboarding steps yet."}
                </div>
              )}

              {/* Sessions History */}
              <div className="space-y-3">
                <h4 className="font-mono text-[10px] font-black uppercase text-stone-400 tracking-wider">
                  {lang === 'FR' ? "HISTORIQUE D'ÉVALUATION SUR LA CONSOLE" : "CANDIDATE ATTEMPTS & SESSIONS"}
                </h4>

                <div className="border border-stone-150 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-150 text-stone-400 font-mono text-[8px] uppercase tracking-wider font-bold">
                        <th className="px-4 py-2">ID</th>
                        <th className="px-4 py-2">{lang === 'FR' ? "Date" : "Date"}</th>
                        <th className="px-4 py-2">{lang === 'FR' ? "Durée" : "Duration"}</th>
                        <th className="px-4 py-2">{lang === 'FR' ? "Score" : "Score"}</th>
                        <th className="px-4 py-2">{lang === 'FR' ? "Statut" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {sessions.filter(s => s.candidateId === selectedUser.id).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-stone-400 italic">
                            {lang === 'FR' ? "Aucun entretien enregistré." : "No simulator recordings recorded."}
                          </td>
                        </tr>
                      ) : (
                        sessions.filter(s => s.candidateId === selectedUser.id).map(sess => (
                          <tr key={sess.id} className="hover:bg-stone-50/50">
                            <td className="px-4 py-2.5 font-mono text-[10.5px] text-stone-500 font-bold">{sess.id}</td>
                            <td className="px-4 py-2.5 text-[11px] font-medium text-stone-600">{formatDateTimeStr(sess.started)}</td>
                            <td className="px-4 py-2.5 font-mono text-[11px] text-stone-500">{sess.duration}</td>
                            <td className="px-4 py-2.5 font-bold text-stone-800">{sess.progress === 100 ? `${sess.progress}%` : `incomplet`}</td>
                            <td className="px-4 py-2.5 uppercase">
                              <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black border ${
                                sess.status === 'completed'
                                  ? 'bg-emerald-50 border-emerald-150 text-emerald-700'
                                  : sess.status === 'active'
                                  ? 'bg-red-50 border-red-150 text-red-700'
                                  : 'bg-stone-100 border-stone-200 text-stone-500'
                              }`}>
                                {sess.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Admin Internal Notes Center */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-stone-500" />
                  <h4 className="font-mono text-[10px] font-black uppercase text-stone-900 tracking-wider">
                    {lang === 'FR' ? "NOTES INTERNES D'ADMINISTRATION" : "ADMINISTRATIVE INTERNAL MEMOS"}
                  </h4>
                  <span className="text-[9.5px] font-mono text-stone-400">({lang === 'FR' ? "Invisibles aux candidats" : "Completely confidential"})</span>
                </div>

                {/* Form */}
                <form onSubmit={handleAddUserNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newUserNote}
                    onChange={(e) => setNewUserNote(e.target.value)}
                    placeholder={lang === 'FR' ? "Ajouter un mémo confidentiel sur ce candidat..." : "Write a private administrative note..."}
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 bg-stone-50 hover:bg-stone-100/50 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-stone-50 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'FR' ? "Ajouter" : "Save"}</span>
                  </button>
                </form>

                {/* Note logs list */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedUserNotes.length === 0 ? (
                    <p className="text-stone-400 italic text-[11px] text-center py-4 border border-stone-100 rounded-xl bg-stone-50/20">
                      {lang === 'FR' ? "Aucun mémo interne disponible pour ce candidat." : "No internal memos logged for this dossier yet."}
                    </p>
                  ) : (
                    selectedUserNotes.map(note => (
                      <div key={note.id} className="p-3 bg-stone-50 border border-stone-150 rounded-xl space-y-1.5">
                        <p className="text-stone-800 text-xs font-medium leading-relaxed">
                          {note.text}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-stone-400 pt-1 border-t border-stone-150/50">
                          <span>{lang === 'FR' ? "Par :" : "By :"} <strong className="text-stone-600">{note.author}</strong></span>
                          <span>{formatDateTimeStr(note.timestamp)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-stone-50 border-t border-stone-200 p-6 shrink-0 text-right">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-stone-50 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                {lang === 'FR' ? "Fermer le dossier" : "Close Dossier"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL / DRAWER 2: INTERVIEW SESSION TIMELINE VIEW */}
      {selectedSession && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col text-left overflow-hidden border border-stone-200 max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-stone-50 border-b border-stone-200 p-6 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                    selectedSession.status === 'active'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-stone-100 border-stone-200 text-stone-600'
                  }`}>
                    {selectedSession.status === 'active' ? '🔴 LIVE MONITORING' : '✓ PAST TIMELINE'}
                  </span>
                  <span className="font-mono text-[9px] text-stone-400">ID: {selectedSession.id}</span>
                </div>
                <h3 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                  {selectedSession.candidateName}
                </h3>
              </div>
              
              <button 
                onClick={() => setSelectedSession(null)}
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 rounded-full transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Session Core info */}
              <div className="bg-stone-50 border border-stone-150 p-4 rounded-xl grid grid-cols-2 gap-4 text-xs font-semibold text-stone-800">
                <div>
                  <p className="text-stone-400 font-bold">{lang === 'FR' ? "Mode de simulation" : "Simulation mode"}</p>
                  <p className="text-stone-900">{selectedSession.mode} ({selectedSession.language})</p>
                </div>
                <div>
                  <p className="text-stone-400 font-bold">{lang === 'FR' ? "Durée écoulée" : "Elapsed time"}</p>
                  <p className="font-mono text-stone-900 font-bold">{selectedSession.duration}</p>
                </div>
                <div>
                  <p className="text-stone-400 font-bold">{lang === 'FR' ? "Heure de début" : "Started"}</p>
                  <p className="text-stone-900 font-mono text-[10.5px]">{formatDateTimeStr(selectedSession.started)}</p>
                </div>
                {selectedSession.completedAt && (
                  <div>
                    <p className="text-stone-400 font-bold">{lang === 'FR' ? "Heure de fin" : "Completed"}</p>
                    <p className="text-emerald-700 font-mono text-[10.5px]">{formatDateTimeStr(selectedSession.completedAt)}</p>
                  </div>
                )}
              </div>

              {/* Progress and Current Phase */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-stone-500 uppercase">{lang === 'FR' ? "PHASE EN COURS" : "CURRENT PHASE"} : <strong className="text-stone-800">{selectedSession.currentPhase || 'Setup'}</strong></span>
                  <span className="text-indigo-650">{selectedSession.progress}%</span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      selectedSession.status === 'completed' 
                        ? 'bg-emerald-500' 
                        : selectedSession.status === 'cancelled' 
                        ? 'bg-stone-400' 
                        : 'bg-indigo-500 animate-pulse'
                    }`}
                    style={{ width: `${selectedSession.progress}%` }}
                  />
                </div>
              </div>

              {/* Step Timeline */}
              <div className="space-y-3">
                <h4 className="font-mono text-[10px] font-black uppercase text-stone-400 tracking-wider">
                  {lang === 'FR' ? "DÉROULEMENT DES PHASES D'ENTRETIEN" : "PIPELINE PHASES SEQUENCE"}
                </h4>

                <div className="space-y-3 border-l-2 border-stone-200 ml-3 pl-4 relative">
                  {selectedSession.timeline.map((step, idx) => {
                    return (
                      <div key={idx} className="relative space-y-1 text-left">
                        
                        {/* Bullet point anchor indicator */}
                        <div className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 bg-white ${
                          step.completed 
                            ? 'border-emerald-500 bg-emerald-500' 
                            : selectedSession.currentPhase === step.phase && selectedSession.status === 'active'
                            ? 'border-indigo-500 animate-pulse bg-indigo-500'
                            : 'border-stone-300'
                        }`} />

                        <div className="flex items-center justify-between text-xs">
                          <p className={`font-bold ${step.completed ? 'text-stone-850' : 'text-stone-500'}`}>
                            {step.phase}
                          </p>
                          {step.completed && (
                            <span className="text-[10px] font-mono text-stone-400">
                              {step.timestamp ? new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes for this Session specifically */}
              <div className="space-y-4 pt-2 border-t border-stone-100">
                <div className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-stone-500" />
                  <h4 className="font-mono text-[10px] font-black uppercase text-stone-900 tracking-wider">
                    {lang === 'FR' ? "NOTES DE SESSION CONFIDENTIELLES" : "SESSION CONFIDENTIAL REMARKS"}
                  </h4>
                </div>

                {/* Form */}
                <form onSubmit={handleAddSessionNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newSessionNote}
                    onChange={(e) => setNewSessionNote(e.target.value)}
                    placeholder={lang === 'FR' ? "Ajouter une note d'entretien..." : "Add private interviewer remark..."}
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 bg-stone-50 hover:bg-stone-100/50 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-stone-50 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                  >
                    <span>{lang === 'FR' ? "Noter" : "Save"}</span>
                  </button>
                </form>

                {/* Listing */}
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {(!selectedSession.notes || selectedSession.notes.length === 0) ? (
                    <p className="text-stone-400 italic text-[11px] text-center py-4 bg-stone-50/20 border border-stone-100 rounded-xl">
                      {lang === 'FR' ? "Aucun commentaire pour cette session." : "No session specific notes logged."}
                    </p>
                  ) : (
                    selectedSession.notes.map(note => (
                      <div key={note.id} className="p-3 bg-stone-50 border border-stone-150 rounded-xl space-y-1.5">
                        <p className="text-stone-800 text-xs font-medium leading-relaxed">
                          {note.text}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-stone-400 pt-1 border-t border-stone-150/50">
                          <span>{lang === 'FR' ? "Par :" : "By :"} <strong className="text-stone-600">{note.author}</strong></span>
                          <span>{formatDateTimeStr(note.timestamp)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-stone-50 border-t border-stone-200 p-6 shrink-0 text-right flex justify-between items-center">
              <span className="text-[10px] text-stone-400 font-mono font-bold uppercase">{lang === 'FR' ? "ACCÈS LECTURE SEULE" : "READ ONLY TRACK"}</span>
              <button
                onClick={() => setSelectedSession(null)}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-stone-50 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                {lang === 'FR' ? "Fermer l'inspecteur" : "Close monitor"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
