import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  TrendingUp, 
  Users, 
  Settings, 
  Sliders, 
  HelpCircle, 
  Activity, 
  Lock, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Plus, 
  RefreshCw, 
  FileLock, 
  Sparkles, 
  AlertTriangle,
  Zap, 
  PieChart, 
  CreditCard, 
  FileText, 
  ArrowUpRight, 
  Database,
  Search,
  Check,
  ChevronRight,
  MapPin,
  Calendar,
  Globe,
  Clock,
  Briefcase
} from 'lucide-react';
import { User } from '../../../types';
import { 
  DEFAULT_PLANS, 
  Organization, 
  PlanType, 
  PlanConfig, 
  QuotaRule, 
  OrgMember 
} from '../../../modules/organization';
import { 
  OrganizationManager, 
  UsageManager, 
  QuotaEngine, 
  AnalyticsAggregator, 
  BusinessController, 
  BusinessAuditLog, 
  BusinessAlert, 
  UsageLogEntry 
} from '../../../services/business';

interface BusinessCenterProps {
  currentUser: User;
  lang?: 'FR' | 'EN';
}

type TabType = 'dashboard' | 'organizations' | 'plans' | 'usage' | 'quotas' | 'revenue';

export default function BusinessCenter({ currentUser, lang = 'FR' }: BusinessCenterProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdmin = currentUser.role === 'admin';

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Operational State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [analytics, setAnalytics] = useState<ReturnType<typeof AnalyticsAggregator.aggregateDashboard> | null>(null);
  const [usageStats, setUsageStats] = useState<UsageLogEntry[]>([]);
  const [quotaRules, setQuotaRules] = useState<QuotaRule[]>([]);
  const [alerts, setAlerts] = useState<BusinessAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<BusinessAuditLog[]>([]);

  // Timeframes for usage monitoring
  const [usageTimeframe, setUsageTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Search/Filter states
  const [orgSearch, setOrgSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState<'all' | 'plan_update' | 'org_action' | 'quota_change' | 'access_change'>('all');

  // Create organization state
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState<PlanType>('Standard');
  const [newOrgLang, setNewOrgLang] = useState<'FR' | 'EN'>('FR');
  const [newOrgOwnerEmail, setNewOrgOwnerEmail] = useState('');

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');

  // Quota rule editing
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleThreshold, setRuleThreshold] = useState<number>(80);
  const [ruleActive, setRuleActive] = useState<boolean>(true);

  // Plan modification state (live configurator)
  const [livePlans, setLivePlans] = useState<Record<PlanType, PlanConfig>>(DEFAULT_PLANS);
  const [editingPlanType, setEditingPlanType] = useState<PlanType | null>(null);
  const [planForm, setPlanForm] = useState<Partial<PlanConfig>>({});

  // Auto-refresh timer
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState<number>(30);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadAllData = () => {
    const orgs = OrganizationManager.getOrganizations();
    setOrganizations(orgs);
    setAnalytics(AnalyticsAggregator.aggregateDashboard());
    setUsageStats(UsageManager.getUsageStats());
    setQuotaRules(QuotaEngine.getRules());
    setAlerts(BusinessController.getAlerts());
    setAuditLogs(BusinessController.getAuditLogs());
    setLastRefreshed(new Date());
    setCountdown(30);

    // Keep active selected organization details in sync
    if (selectedOrg) {
      const refreshedSelected = orgs.find(o => o.id === selectedOrg.id);
      if (refreshedSelected) setSelectedOrg(refreshedSelected);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 30 Seconds Auto Refresh system
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadAllData();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedOrg]);

  // Actions
  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showFeedback(lang === 'FR' ? 'Accès refusé : Seul le Super Admin peut créer des organisations.' : 'Access Denied: Only Super Admins can create organizations.', 'error');
      return;
    }
    if (!newOrgName.trim() || !newOrgOwnerEmail.trim()) {
      showFeedback(lang === 'FR' ? 'Veuillez remplir tous les champs.' : 'Please fill all required fields.', 'error');
      return;
    }

    try {
      OrganizationManager.createOrganization(newOrgName, newOrgPlan, newOrgLang, newOrgOwnerEmail);
      loadAllData();
      setShowCreateOrg(false);
      setNewOrgName('');
      setNewOrgOwnerEmail('');
      showFeedback(lang === 'FR' ? 'Organisation créée avec succès !' : 'Organization created successfully!');
    } catch (e) {
      showFeedback(lang === 'FR' ? 'Erreur lors de la création.' : 'Error during creation.', 'error');
    }
  };

  const handleToggleOrgStatus = (id: string, currentStatus: 'enabled' | 'disabled') => {
    if (!isSuperAdmin) {
      showFeedback(lang === 'FR' ? 'Contrôle réservé au Super Admin.' : 'Control reserved for Super Admins.', 'error');
      return;
    }
    const nextStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
    OrganizationManager.updateOrganizationStatus(id, nextStatus, currentUser.email);
    
    // Check if this triggers a high priority business alert
    if (nextStatus === 'disabled') {
      const org = OrganizationManager.getOrganizations().find(o => o.id === id);
      if (org) {
        BusinessController.triggerQuotaAlertIfAny(org, currentUser.email);
      }
    }

    loadAllData();
    showFeedback(
      lang === 'FR'
        ? `Organisation ${nextStatus === 'enabled' ? 'activée' : 'désactivée'} !`
        : `Organization successfully ${nextStatus === 'enabled' ? 'enabled' : 'disabled'}!`
    );
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showFeedback(lang === 'FR' ? 'Contrôle réservé au Super Admin.' : 'Control reserved for Super Admins.', 'error');
      return;
    }
    if (!selectedOrg) return;
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      showFeedback(lang === 'FR' ? 'Veuillez renseigner le nom et l\'email.' : 'Please enter name and email.', 'error');
      return;
    }

    OrganizationManager.addMember(selectedOrg.id, newMemberName, newMemberEmail, newMemberRole, currentUser.email);
    loadAllData();
    setShowAddMember(false);
    setNewMemberName('');
    setNewMemberEmail('');
    showFeedback(lang === 'FR' ? 'Membre ajouté avec succès !' : 'Member added successfully!');
  };

  const handleUpdateQuotaRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showFeedback(lang === 'FR' ? 'Seul le Super Admin peut modifier les quotas.' : 'Only Super Admins can update quota configurations.', 'error');
      return;
    }
    if (!editingRuleId) return;

    QuotaEngine.updateRule(editingRuleId, ruleThreshold, ruleActive, currentUser.email);
    loadAllData();
    setEditingRuleId(null);
    showFeedback(lang === 'FR' ? 'Règle de quota mise à jour !' : 'Quota rule updated successfully!');
  };

  const handleEditPlan = (plan: PlanType) => {
    if (!isSuperAdmin) {
      showFeedback(lang === 'FR' ? 'Seul le Super Admin peut reconfigurer les plans.' : 'Only Super Admins can configure pricing tiers.', 'error');
      return;
    }
    setEditingPlanType(plan);
    setPlanForm(livePlans[plan]);
  };

  const handleSavePlanConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !editingPlanType) return;

    const updated = {
      ...livePlans,
      [editingPlanType]: {
        ...livePlans[editingPlanType],
        ...planForm
      }
    };

    setLivePlans(updated);
    setEditingPlanType(null);

    // Add audit trail for plan changes
    BusinessController.logAudit(
      currentUser.email,
      'super_admin',
      'plan_update',
      `Modified global characteristics for plan tier [${editingPlanType}]. Limits: ${planForm.interviewLimit} sessions.`,
      editingPlanType
    );

    showFeedback(
      lang === 'FR'
        ? `Le forfait ${editingPlanType} a été reconfiguré avec succès !`
        : `Pricing plan tier ${editingPlanType} updated successfully!`
    );
  };

  const handleResolveAlert = (id: string) => {
    if (!isSuperAdmin) {
      showFeedback(lang === 'FR' ? 'Seul le Super Admin peut clore les alertes.' : 'Only Super Admins can resolve alerts.', 'error');
      return;
    }
    BusinessController.resolveAlert(id, currentUser.email);
    loadAllData();
    showFeedback(lang === 'FR' ? 'Alerte opérationnelle clôturée.' : 'Operational warning ticket closed.');
  };

  // Filter organizations
  const filteredOrgs = organizations.filter(org => {
    if (!orgSearch.trim()) return true;
    return (
      org.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
      org.plan.toLowerCase().includes(orgSearch.toLowerCase()) ||
      org.id.toLowerCase().includes(orgSearch.toLowerCase())
    );
  });

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditFilter === 'all') return true;
    return log.actionType === auditFilter;
  });

  // Render SVG usage metrics graph helper
  const renderUsageSVG = () => {
    if (usageStats.length === 0) return null;

    const maxVal = Math.max(...usageStats.map(s => s.sessionsStarted), 40);
    const width = 500;
    const height = 150;
    const padding = 30;

    const points = usageStats.map((stat, idx) => {
      const x = padding + (idx * (width - padding * 2)) / (usageStats.length - 1);
      const y = height - padding - (stat.sessionsStarted * (height - padding * 2)) / maxVal;
      return { x, y, ...stat };
    });

    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
        {/* Background Grid Lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#E7E5E4" strokeDasharray="3,3" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#E7E5E4" strokeDasharray="3,3" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#D6D3D1" />

        {/* Shaded Area */}
        <path
          d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
          fill="url(#usage-gradient)"
          opacity="0.15"
        />

        {/* Data Line */}
        <path d={pathD} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Tooltip Indicators & Circles */}
        {points.map((p, idx) => (
          <g key={idx} className="group/dot cursor-pointer">
            <circle cx={p.x} cy={p.y} r="4" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx={p.x} cy={p.y} r="8" fill="#6366F1" opacity="0" className="hover:opacity-20 transition-opacity" />
            <title>{`${p.date}: ${p.sessionsStarted} sessions started`}</title>
          </g>
        ))}

        {/* Axes Labels */}
        <text x={padding} y={height - 10} className="text-[9px] font-mono fill-stone-400 font-bold">
          {points[0]?.date}
        </text>
        <text x={width - padding} y={height - 10} textAnchor="end" className="text-[9px] font-mono fill-stone-400 font-bold">
          {points[points.length - 1]?.date}
        </text>

        <defs>
          <linearGradient id="usage-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className="space-y-8" id="business-ops-center-stage">
      
      {/* Upper Status Panel */}
      <div className="bg-stone-900 text-stone-100 p-8 rounded-[32px] border border-stone-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg">
                <Building2 className="w-5 h-5" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-violet-400 font-bold">
                BUSINESS & OPERATIONS EXECUTIVE CENTER
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border ${
                isSuperAdmin 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {isSuperAdmin ? (lang === 'FR' ? 'Super Admin - Contrôle Total' : 'Super Admin - Full Control') : (lang === 'FR' ? 'Admin - Vue Uniquement' : 'Admin - Read Only')}
              </span>
            </div>
            <h1 className="font-sans font-bold text-2xl tracking-tight text-white">
              {lang === 'FR' ? "Console Commerciale & d'Opérations" : "Business & Operations Center"}
            </h1>
            <p className="text-stone-400 text-xs max-w-xl leading-relaxed font-medium">
              {lang === 'FR' 
                ? "Gérez les forfaits entreprise, surveillez l'utilisation des ressources à l'échelle globale, ajustez les quotas et vérifiez la conformité commerciale." 
                : "Manage tenant organizations, configure subscription models, enforce quotas, and view advanced operational telemetry and statistics."}
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between border-t border-stone-800 pt-4 md:pt-0 md:border-0">
            <div className="text-right space-y-1 font-mono">
              <div className="flex items-center gap-2 justify-end text-xs font-semibold text-stone-300">
                <RefreshCw className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                <span>Sync Auto : {countdown}s</span>
              </div>
              <p className="text-[10px] text-stone-500">
                {lang === 'FR' ? "Dernière sync :" : "Last synced :"} {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
            <button
              onClick={loadAllData}
              className="p-2.5 bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white rounded-xl border border-stone-700 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Alert Bar */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-center text-xs font-bold transition-all shadow-md ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Operations Alerts Container */}
      {alerts.filter(a => !a.resolved).length > 0 && (
        <div className="space-y-3" id="operational-alerts-container">
          <div className="flex items-center gap-2 px-1">
            <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" />
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-amber-700 font-extrabold">
              {lang === 'FR' ? "Incidents & Alertes de Quota Actifs" : "Active Business Operations Warnings"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.filter(a => !a.resolved).map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-3xl border flex gap-4 text-left ${
                  alert.severity === 'critical' 
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <div className="mt-0.5">
                  <AlertTriangle className={`w-5 h-5 shrink-0 ${alert.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'}`} />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0 font-medium">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold opacity-70">
                      {alert.type} • {alert.orgName}
                    </span>
                    <span className="text-[9px] font-mono text-stone-400">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">{alert.message}</p>
                  
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-3 py-1 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 text-stone-800 text-[9px] font-mono uppercase tracking-widest font-extrabold rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      {lang === 'FR' ? "Clôturer le Ticket" : "Resolve / Close Ticket"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200" id="business-nav-tab-bar">
        {[
          { id: 'dashboard', label: lang === 'FR' ? '1. Tableau de Bord' : '1. Business Dashboard', icon: TrendingUp },
          { id: 'organizations', label: lang === 'FR' ? '2. Organisations' : '2. Organizations', icon: Building2 },
          { id: 'plans', label: lang === 'FR' ? '3. Plans & Accès' : '3. Plans & Access', icon: Layers },
          { id: 'usage', label: lang === 'FR' ? '4. Utilisation' : '4. Usage Monitoring', icon: Activity },
          { id: 'quotas', label: lang === 'FR' ? '5. Quotas' : '5. Quotas Engine', icon: Sliders },
          { id: 'revenue', label: lang === 'FR' ? '6. Finance & Factures' : '6. Revenue Readiness', icon: CreditCard }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
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

      {/* Canvas panels */}
      <div className="animate-fade-in" id="business-tab-panels">

        {/* SECTION 1: BUSINESS DASHBOARD */}
        {activeTab === 'dashboard' && analytics && (
          <div className="space-y-8 text-left" id="panel-dashboard">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "COMPTES ENREGISTRÉS" : "TOTAL ENTERPRISE ACCOUNTS"}
                  </span>
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-2xl text-stone-900">{analytics.totalAccounts}</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Utilisateurs intégrés" : "Active individual members"}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "UTILISATEURS ACTIFS (7J)" : "WEEKLY ACTIVE USERS"}
                  </span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-2xl text-stone-900">{analytics.activeUsers}</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold flex items-center gap-1">
                    <span className="text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> +12%</span>
                    <span>vs la semaine dernière</span>
                  </p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "SOCIÉTÉS ET LABS" : "ACTIVE ORGANIZATIONS"}
                  </span>
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-2xl text-stone-900">{analytics.organizationsCount}</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Entités multi-locataires" : "Managed corporate tenants"}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "ENTRETIENS INITIÉS" : "TOTAL SESSIONS INITIATED"}
                  </span>
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-2xl text-stone-900">{analytics.activeInterviews}</h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold flex items-center gap-1">
                    <span className="text-emerald-600 font-bold">+{analytics.usageGrowthPct}%</span>
                    <span>{lang === 'FR' ? "croissance mensuelle" : "monthly expansion"}</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Visual Indicators & Language Distribution Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* SVG Usage Trends Graph */}
              <div className="lg:col-span-2 bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <div>
                    <h4 className="font-sans font-bold text-sm text-stone-900">
                      {lang === 'FR' ? "Évolution des Sessions d'Entretiens" : "Vocal & Web Evaluation Velocity"}
                    </h4>
                    <p className="text-[10px] text-stone-400 font-mono">
                      GLOBAL VOLUME SCALE OVER 14-DAY ROTATION
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-[10px] font-mono text-stone-600 uppercase tracking-wider font-extrabold">
                    {lang === 'FR' ? "Mise à jour en direct" : "Real-time stream"}
                  </span>
                </div>
                <div className="h-44 w-full flex items-center justify-center bg-stone-50/50 rounded-2xl p-2 border border-stone-100">
                  {renderUsageSVG()}
                </div>
              </div>

              {/* Conversion Placeholders & Language Distributions */}
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
                <div>
                  <h4 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Répartition Opérationnelle" : "Language & Conversion Telemetry"}
                  </h4>
                  <p className="text-[11px] text-stone-400 font-mono">
                    GLOBAL RESOURCE DISTRIBUTIONS
                  </p>
                </div>

                <div className="space-y-4 text-xs font-semibold text-stone-700">
                  {/* Lang Distribution */}
                  <div className="space-y-2">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                      {lang === 'FR' ? "Langue par Défaut de l'Organisation" : "Primary Tenant Languages"}
                    </p>
                    <div className="flex h-3.5 rounded-full overflow-hidden bg-stone-100 border border-stone-200">
                      <div 
                        className="bg-indigo-600 transition-all duration-500" 
                        style={{ width: `${(analytics.languageDistribution.FR / (analytics.languageDistribution.FR + analytics.languageDistribution.EN)) * 100}%` }}
                        title={`French: ${analytics.languageDistribution.FR}`}
                      />
                      <div 
                        className="bg-amber-400 transition-all duration-500" 
                        style={{ width: `${(analytics.languageDistribution.EN / (analytics.languageDistribution.FR + analytics.languageDistribution.EN)) * 100}%` }}
                        title={`English: ${analytics.languageDistribution.EN}`}
                      />
                    </div>
                    <div className="flex justify-between font-mono text-[9px] text-[#6B7280]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        French ({analytics.languageDistribution.FR})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        English ({analytics.languageDistribution.EN})
                      </span>
                    </div>
                  </div>

                  {/* Conversion Placeholders */}
                  <div className="space-y-3 pt-3 border-t border-stone-100">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                      {lang === 'FR' ? "Indicateurs de Conversion Opérationnelle" : "Aesthetic Conversion Indices"}
                    </p>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#6B7280]">Inscriptions → Évaluations</span>
                      <span className="font-mono text-stone-900 font-extrabold">{analytics.conversionRates.signupsToAssessmentPct}%</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#6B7280]">Starter → Standard & Premium</span>
                      <span className="font-mono text-stone-900 font-extrabold">{analytics.conversionRates.standardToPremiumPct}%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SECTION 2: ORGANIZATIONS */}
        {activeTab === 'organizations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left" id="panel-organizations">
            
            {/* Organizations Directory (2 cols) */}
            <div className="lg:col-span-2 bg-white border border-stone-200 rounded-[32px] shadow-xs overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-stone-50/50">
                <div>
                  <h3 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Registre des Entreprises & Labs" : "Corporate Tenants Registry"}
                  </h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Supervision des environnements client multi-locataires." : "Provision accounts, track employee counts, and monitor tier allocations."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      value={orgSearch}
                      onChange={(e) => setOrgSearch(e.target.value)}
                      placeholder={lang === 'FR' ? "Rechercher..." : "Search corporate..."}
                      className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-stone-400 w-44"
                    />
                  </div>

                  {isSuperAdmin && (
                    <button
                      onClick={() => setShowCreateOrg(true)}
                      className="p-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                      title={lang === 'FR' ? "Ajouter Société" : "Add Tenant Organization"}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Form to Create Org */}
              {showCreateOrg && (
                <form onSubmit={handleCreateOrg} className="p-6 bg-stone-50 border-b border-stone-200 space-y-4 animate-fade-in text-xs font-semibold text-stone-700">
                  <h4 className="font-sans font-bold text-xs text-stone-900 uppercase tracking-wide">
                    {lang === 'FR' ? "Créer une Nouvelle Organisation" : "Register New Corporate Tenant"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-500">{lang === 'FR' ? "Nom de l'entité" : "Organization Name"}</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TotalEnergies Lab"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-500">{lang === 'FR' ? "Email du Propriétaire" : "Owner Administrator Email"}</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. director@total.com"
                        value={newOrgOwnerEmail}
                        onChange={(e) => setNewOrgOwnerEmail(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-500">Plan Tier</label>
                      <select
                        value={newOrgPlan}
                        onChange={(e) => setNewOrgPlan(e.target.value as PlanType)}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2"
                      >
                        <option value="Starter">Starter</option>
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-500">Language Default</label>
                      <select
                        value={newOrgLang}
                        onChange={(e) => setNewOrgLang(e.target.value as 'FR' | 'EN')}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2"
                      >
                        <option value="FR">French (FR)</option>
                        <option value="EN">English (EN)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCreateOrg(false)}
                      className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-xl text-stone-800 transition-all cursor-pointer"
                    >
                      {lang === 'FR' ? "Annuler" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all cursor-pointer"
                    >
                      {lang === 'FR' ? "Enregistrer" : "Register Tenant"}
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-stone-150">
                {filteredOrgs.map((org) => (
                  <div 
                    key={org.id}
                    onClick={() => {
                      setSelectedOrg(org);
                      setShowAddMember(false);
                    }}
                    className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer hover:bg-stone-50/50 ${
                      selectedOrg?.id === org.id ? 'bg-stone-50' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-xs text-stone-900">{org.name}</span>
                        <span className="font-mono text-[9px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                          {org.id}
                        </span>
                        <span className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded-full uppercase ${
                          org.plan === 'Enterprise' 
                            ? 'bg-violet-100 text-violet-800 border border-violet-200' 
                            : org.plan === 'Premium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-stone-100 text-stone-800'
                        }`}>
                          {org.plan}
                        </span>
                        <span className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded-full uppercase ${
                          org.status === 'enabled' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {org.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] font-semibold">
                        {lang === 'FR' ? "Créée le :" : "Registered :"} {new Date(org.createdAt).toLocaleDateString()} • {org.memberCount} {org.memberCount > 1 ? 'membres' : 'membre'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {isSuperAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleOrgStatus(org.id, org.status);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all ${
                            org.status === 'enabled' 
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {org.status === 'enabled' ? (lang === 'FR' ? 'Désactiver' : 'Disable') : (lang === 'FR' ? 'Activer' : 'Enable')}
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                ))}

                {filteredOrgs.length === 0 && (
                  <div className="p-8 text-center text-stone-400 text-xs font-semibold">
                    {lang === 'FR' ? "Aucune organisation trouvée." : "No organizations matched criteria."}
                  </div>
                )}
              </div>
            </div>

            {/* Organization Detail Panel */}
            <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-violet-600" />
                  <h3 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Détails d'Organisation" : "Corporate Inspector"}
                  </h3>
                </div>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Audit complet et ressources du locataire sélectionné." : "View nested employee credentials, activities, and quotas."}
                </p>
              </div>

              {selectedOrg ? (
                <div className="space-y-6 animate-fade-in text-xs font-semibold text-stone-700">
                  <div className="space-y-1.5 p-4 bg-stone-50 rounded-2xl border border-stone-150">
                    <p className="text-[9px] font-mono text-stone-400 uppercase tracking-wider">Corporate Identity</p>
                    <p className="font-bold text-sm text-stone-950">{selectedOrg.name}</p>
                    <p className="text-[#6B7280] font-mono text-[11px] flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-stone-400" /> Language preference: {selectedOrg.language}
                    </p>
                  </div>

                  {/* Members list */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-mono text-stone-400 uppercase tracking-wider">Members Directory</p>
                      {isSuperAdmin && (
                        <button
                          onClick={() => setShowAddMember(!showAddMember)}
                          className="text-violet-600 hover:text-violet-800 text-[10px] font-bold uppercase flex items-center gap-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> {lang === 'FR' ? "Inviter" : "Invite"}
                        </button>
                      )}
                    </div>

                    {showAddMember && (
                      <form onSubmit={handleAddMember} className="p-3 bg-stone-50 rounded-xl border border-stone-150 space-y-2 text-[10px]">
                        <input
                          type="text"
                          required
                          placeholder="Employee Name"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          className="w-full p-1.5 bg-white border border-stone-200 rounded"
                        />
                        <input
                          type="email"
                          required
                          placeholder="corporate@domain.com"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          className="w-full p-1.5 bg-white border border-stone-200 rounded"
                        />
                        <div className="flex justify-between items-center">
                          <select
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value as any)}
                            className="bg-white border border-stone-200 rounded p-1"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setShowAddMember(false)}
                              className="px-2 py-1 bg-stone-200 rounded font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-2 py-1 bg-violet-600 text-white rounded font-bold"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {selectedOrg.members.map((m) => (
                        <div key={m.id} className="p-2 border border-stone-100 rounded-lg flex justify-between items-center bg-stone-50/50">
                          <div>
                            <p className="font-bold text-stone-900 text-[11px]">{m.name}</p>
                            <p className="text-[10px] text-[#6B7280] font-mono">{m.email}</p>
                          </div>
                          <span className="font-mono text-[9px] uppercase bg-stone-100 px-1 py-0.5 rounded text-stone-500 font-extrabold">
                            {m.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Usage telemetry */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-mono text-stone-400 uppercase tracking-wider">Accumulated Usage Telemetry</p>
                    <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                        <span className="text-[#6B7280]">Sessions Completed</span>
                        <p className="text-stone-950 font-bold text-xs mt-0.5">{selectedOrg.usage.sessionsCompleted} / {selectedOrg.usage.sessionsStarted}</p>
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                        <span className="text-[#6B7280]">Voice Usage</span>
                        <p className="text-stone-950 font-bold text-xs mt-0.5">{selectedOrg.usage.voiceUsageHours} hrs</p>
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                        <span className="text-[#6B7280]">Training Usage</span>
                        <p className="text-stone-950 font-bold text-xs mt-0.5">{selectedOrg.usage.trainingUsageHours} hrs</p>
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                        <span className="text-[#6B7280]">AI Prompts Count</span>
                        <p className="text-stone-950 font-bold text-xs mt-0.5">{selectedOrg.usage.aiRequestsCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Activity log */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-mono text-stone-400 uppercase tracking-wider">Audit Log & Actions</p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto text-[10px]">
                      {selectedOrg.activity.map((act) => (
                        <div key={act.id} className="p-2 border-l-2 border-stone-300 pl-3 space-y-0.5">
                          <div className="flex justify-between items-center text-[#6B7280]">
                            <span className="font-bold text-stone-800">{act.action}</span>
                            <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-stone-500">{act.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 text-stone-400">
                  <HelpCircle className="w-10 h-10 stroke-[1.25]" />
                  <p className="text-xs font-bold">
                    {lang === 'FR' ? "Sélectionnez une organisation" : "Select an organization"}
                  </p>
                  <p className="text-[10px] text-[#6B7280]">
                    {lang === 'FR' ? "Cliquez sur une entité pour afficher son audit et ses quotas." : "Click on any record in the directory to inspect its parameters."}
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* SECTION 3: PLANS & ACCESS */}
        {activeTab === 'plans' && (
          <div className="space-y-6 text-left" id="panel-plans">
            <div className="bg-stone-50 border border-stone-200 p-6 rounded-[32px] space-y-3">
              <h4 className="font-sans font-bold text-sm text-stone-900">
                {lang === 'FR' ? "Caractéristiques de Forfaits & Matrice d'Accès" : "Pricing Plans & Capability Entitlement Matrix"}
              </h4>
              <p className="text-[#6B7280] text-xs font-semibold leading-relaxed">
                {lang === 'FR'
                  ? "Configurez les autorisations d'intégration de l'IA vocale, de l'audio-miroir, du module d'entraînement et d'administration pour chacun des quatre paliers de souscription standard."
                  : "Review and configure system feature privileges, monthly interview limits, AI vocal streams, audio mirror simulations, training logs, and access permissions per subscription tier."}
              </p>
            </div>

            {editingPlanType && (
              <form onSubmit={handleSavePlanConfig} className="bg-white border border-stone-200 p-6 rounded-[32px] space-y-4 animate-fade-in text-xs font-semibold text-stone-700">
                <h4 className="font-sans font-bold text-xs text-stone-950 uppercase tracking-wide">
                  {lang === 'FR' ? `Reconfigurer le plan [ ${editingPlanType} ]` : `Reconfigure Pricing Plan [ ${editingPlanType} ]`}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-500">Interview Sessions Limit</label>
                    <input
                      type="number"
                      required
                      value={planForm.interviewLimit || 0}
                      onChange={(e) => setPlanForm({ ...planForm, interviewLimit: parseInt(e.target.value) })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-500">Storage Limit (GB)</label>
                    <input
                      type="number"
                      required
                      value={planForm.storageLimitGB || 0}
                      onChange={(e) => setPlanForm({ ...planForm, storageLimitGB: parseInt(e.target.value) })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-stone-500">AI Request Cycle Limit</label>
                    <input
                      type="number"
                      required
                      value={planForm.aiRequestLimit || 0}
                      onChange={(e) => setPlanForm({ ...planForm, aiRequestLimit: parseInt(e.target.value) })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex gap-6 py-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.voiceAccess || false}
                      onChange={(e) => setPlanForm({ ...planForm, voiceAccess: e.target.checked })}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span>Vocal Stream Access</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.mirrorAccess || false}
                      onChange={(e) => setPlanForm({ ...planForm, mirrorAccess: e.target.checked })}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span>Mirror Feedback Simulation</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.trainingAccess || false}
                      onChange={(e) => setPlanForm({ ...planForm, trainingAccess: e.target.checked })}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span>Training Mode Access</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.adminAccess || false}
                      onChange={(e) => setPlanForm({ ...planForm, adminAccess: e.target.checked })}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span>Admin Operations Console</span>
                  </label>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingPlanType(null)}
                    className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-xl text-stone-800 transition-all"
                  >
                    {lang === 'FR' ? "Annuler" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all"
                  >
                    {lang === 'FR' ? "Sauvegarder" : "Publish Configuration"}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {(Object.keys(livePlans) as PlanType[]).map((planName) => {
                const config = livePlans[planName];
                return (
                  <div 
                    key={planName}
                    className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                        <h4 className="font-sans font-bold text-base text-stone-950">{planName}</h4>
                        <span className="p-1.5 bg-stone-50 rounded-lg text-[9px] font-mono text-stone-500">
                          {planName === 'Enterprise' ? 'SLA GUARANTEED' : 'STANDARD'}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs font-semibold text-stone-700">
                        <div className="flex justify-between border-b border-stone-50 pb-1.5">
                          <span className="text-[#6B7280]">Interviews Limit</span>
                          <span className="font-mono text-stone-900 font-extrabold">
                            {config.interviewLimit > 50000 ? 'Unlimited' : `${config.interviewLimit} / mo`}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-stone-50 pb-1.5">
                          <span className="text-[#6B7280]">Storage Allocated</span>
                          <span className="font-mono text-stone-900 font-extrabold">{config.storageLimitGB} GB</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-50 pb-1.5">
                          <span className="text-[#6B7280]">AI Prompt Cycles</span>
                          <span className="font-mono text-stone-900 font-extrabold">{config.aiRequestLimit} req</span>
                        </div>

                        {/* Entitlement matrix indicators */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-500">Voice Transcripts</span>
                            {config.voiceAccess ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-stone-300" />}
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-500">Audio Mirror Playback</span>
                            {config.mirrorAccess ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-stone-300" />}
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-500">Interactive Training</span>
                            {config.trainingAccess ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-stone-300" />}
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-500">Admin Panel Control</span>
                            {config.adminAccess ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-stone-300" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <button
                        onClick={() => handleEditPlan(planName)}
                        className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 hover:text-stone-950 border border-stone-200 hover:border-stone-300 rounded-xl font-mono uppercase text-[9px] tracking-widest font-extrabold transition-all cursor-pointer active:scale-95"
                      >
                        {lang === 'FR' ? "Configurer" : "Edit Plan Limits"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: USAGE MONITORING */}
        {activeTab === 'usage' && (
          <div className="space-y-6 text-left" id="panel-usage">
            <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-stone-100 pb-4">
                <div>
                  <h3 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Suivi Analytique de Consommation" : "Global Usage & Resource Streams"}
                  </h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Chronologie de consommation des serveurs par tranches horaires." : "Check started vs completed interview sessions, total voice hours and prompt processing weights."}
                  </p>
                </div>

                <div className="flex bg-stone-100 p-1.5 rounded-xl border border-stone-200 gap-1 text-[10px] font-bold">
                  {[
                    { id: 'daily', label: lang === 'FR' ? 'Quotidien' : 'Daily' },
                    { id: 'weekly', label: lang === 'FR' ? 'Hebdomadaire' : 'Weekly' },
                    { id: 'monthly', label: lang === 'FR' ? 'Mensuel' : 'Monthly' }
                  ].map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => setUsageTimeframe(tf.id as any)}
                      className={`px-3 py-1.5 rounded-lg cursor-pointer uppercase transition-all ${
                        usageTimeframe === tf.id 
                          ? 'bg-violet-950 text-white shadow-xs' 
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe aggregated table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100 font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                      <th className="p-4">{lang === 'FR' ? "DATE / PÉRIODE" : "PERIOD DATE"}</th>
                      <th className="p-4">{lang === 'FR' ? "SESSIONS COMMENCÉES" : "SESSIONS STARTED"}</th>
                      <th className="p-4">{lang === 'FR' ? "SESSIONS TERMINÉES" : "SESSIONS COMPLETED"}</th>
                      <th className="p-4">{lang === 'FR' ? "TRAIN MODE" : "TRAINING MODE HOURS"}</th>
                      <th className="p-4">{lang === 'FR' ? "RETOUR MIROIR" : "MIRROR SIMULATOR HOURS"}</th>
                      <th className="p-4">{lang === 'FR' ? "TRANCRIPTION VOCALE" : "VOCAL TRANSCRIPT HOURS"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-semibold text-stone-700 font-mono">
                    {usageStats.map((u, index) => {
                      // Adjust based on daily vs weekly vs monthly mock multipliers
                      const factor = usageTimeframe === 'weekly' ? 7.2 : usageTimeframe === 'monthly' ? 28.5 : 1.0;
                      return (
                        <tr key={index} className="hover:bg-stone-50/50 transition-colors">
                          <td className="p-4 font-bold text-stone-900">
                            {usageTimeframe === 'daily' ? u.date : `${lang === 'FR' ? 'Semaine' : 'Week'} ${index + 1}`}
                          </td>
                          <td className="p-4 text-violet-700">{Math.floor(u.sessionsStarted * factor)}</td>
                          <td className="p-4 text-emerald-700">{Math.floor(u.sessionsCompleted * factor)}</td>
                          <td className="p-4 text-stone-800">{parseFloat((u.trainingUsageHours * factor).toFixed(1))} hrs</td>
                          <td className="p-4 text-stone-800">{parseFloat((u.mirrorUsageHours * factor).toFixed(1))} hrs</td>
                          <td className="p-4 text-stone-800">{parseFloat((u.voiceUsageHours * factor).toFixed(1))} hrs</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* SECTION 5: QUOTAS */}
        {activeTab === 'quotas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left" id="panel-quotas">
            
            {/* Quota Rules List (2 cols) */}
            <div className="lg:col-span-2 bg-white border border-stone-200 rounded-[32px] shadow-xs overflow-hidden">
              <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                <h3 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Règles d'Exécution & Quotas Système" : "Resource Allocation Quotas Engine"}
                </h3>
                <p className="text-[11px] text-[#6B7280] font-semibold mt-1">
                  {lang === 'FR' ? "Configurez les seuils d'avertissement et de restriction forte par ressource." : "Establish warnings, soft boundaries, or hard enforcement blocks on multi-tenant integrations."}
                </p>
              </div>

              {editingRuleId && (
                <form onSubmit={handleUpdateQuotaRule} className="p-6 bg-stone-50 border-b border-stone-200 space-y-4 animate-fade-in text-xs font-semibold text-stone-700">
                  <h4 className="font-sans font-bold text-xs text-stone-900 uppercase tracking-wide">
                    {lang === 'FR' ? "Modifier le Seuil de Quota" : "Adjust Quota Enforcer threshold"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-stone-500">Seuil Limite (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={ruleThreshold}
                        onChange={(e) => setRuleThreshold(parseInt(e.target.value))}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1 flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer pb-3.5">
                        <input
                          type="checkbox"
                          checked={ruleActive}
                          onChange={(e) => setRuleActive(e.target.checked)}
                          className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                        />
                        <span>Enforcer Rule Active</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingRuleId(null)}
                      className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-xl text-stone-800 transition-all"
                    >
                      {lang === 'FR' ? "Annuler" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all"
                    >
                      {lang === 'FR' ? "Confirmer" : "Apply Restriction"}
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-stone-100 text-xs font-semibold text-stone-700">
                {quotaRules.map((rule) => (
                  <div key={rule.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-extrabold text-stone-900 uppercase">
                          {rule.category}
                        </span>
                        <span className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded-full uppercase ${
                          rule.type === 'hard limit' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : rule.type === 'soft limit'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-stone-100 text-stone-800'
                        }`}>
                          {rule.type}
                        </span>
                        {!rule.active && (
                          <span className="px-2 py-0.5 font-mono text-[9px] font-bold rounded-full bg-stone-200 text-stone-600">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500">
                        {lang === 'FR' ? rule.messageFR : rule.messageEN}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-stone-400">THRESHOLD</span>
                        <p className="font-mono text-stone-950 font-extrabold text-sm">{rule.thresholdPercentage}%</p>
                      </div>

                      {isSuperAdmin && (
                        <button
                          onClick={() => {
                            setEditingRuleId(rule.id);
                            setRuleThreshold(rule.thresholdPercentage);
                            setRuleActive(rule.active);
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                        >
                          {lang === 'FR' ? "Ajuster" : "Edit Threshold"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Audit Logs List */}
            <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4 space-y-1">
                <div className="flex items-center gap-1.5">
                  <FileLock className="w-4 h-4 text-violet-600" />
                  <h3 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Historique d'Audit Commercial" : "Ops & Billing Audit Log"}
                  </h3>
                </div>
                <p className="text-[11px] text-[#6B7280] font-semibold">
                  {lang === 'FR' ? "Modifications de forfaits et attributions de quotas." : "Immutable trace of billing tiers and quota enforcements."}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">Log category filter</label>
                <select
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-semibold"
                >
                  <option value="all">{lang === 'FR' ? "Toutes les actions" : "All Action categories"}</option>
                  <option value="plan_update">Plan Upgrades</option>
                  <option value="org_action">Organization Edits</option>
                  <option value="quota_change">Quota Tweaks</option>
                  <option value="access_change">Matrix Changes</option>
                </select>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-[11px]">
                {filteredAuditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 border border-stone-100 rounded-xl space-y-1 bg-stone-50/50">
                    <div className="flex justify-between items-center text-stone-400 font-mono text-[9px]">
                      <span className="font-bold text-stone-700">{log.actionType.toUpperCase()}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="font-sans font-bold text-stone-950 leading-relaxed">{log.description}</p>
                    <p className="font-mono text-[9px] text-[#6B7280]">By: {log.actor} ({log.role})</p>
                  </div>
                ))}

                {filteredAuditLogs.length === 0 && (
                  <div className="text-center text-stone-400 font-semibold py-8">
                    No logs matched filter criteria.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* SECTION 6: REVENUE READINESS */}
        {activeTab === 'revenue' && (
          <div className="space-y-6 text-left animate-fade-in" id="panel-revenue">
            <div className="bg-stone-900 text-stone-100 p-8 rounded-[32px] border border-stone-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 font-bold">
                  COMMERCIAL REVENUE READINESS ARCHITECTURE
                </span>
              </div>
              <h3 className="font-sans font-bold text-lg text-white">
                {lang === 'FR' ? "Souveraineté des Flux Financiers" : "Billing & Corporate Subscription Management"}
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed max-w-xl font-medium">
                {lang === 'FR'
                  ? "Gérez les abonnements d'entreprise actifs, les renouvellements de contrats et les cycles de facturation directement depuis ce tableau de bord sécurisé."
                  : "Manage active enterprise subscriptions, contract renewals, and invoicing cycles directly from this secure administration control board."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "ABONNEMENTS ENTREPRISE" : "SUBSCRIPTIONS PLATFORM"}
                  </span>
                  <p className="text-xs text-stone-600 font-semibold leading-relaxed">
                    Corporate contract cycles. Ready to synchronize with Stripe Customer Objects upon licensing release.
                  </p>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-100 rounded-2xl text-[11px] font-mono font-bold text-stone-500 text-center">
                  STATUS: WAITING_STRIPE_SECRET
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "RENOUVELLEMENTS ANNUELS" : "CONTRACT RENEWAL TRIGGERS"}
                  </span>
                  <p className="text-xs text-stone-600 font-semibold leading-relaxed">
                    Automated email reminders triggers configured at T-30, T-15, and T-3 days prior to expiration.
                  </p>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-100 rounded-2xl text-[11px] font-mono font-bold text-stone-500 text-center">
                  STATUS: DRY_RUN_ACTIVE
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "GÉNÉRATEUR DE FACTURES" : "INVOICING SCHEMAS"}
                  </span>
                  <p className="text-xs text-stone-600 font-semibold leading-relaxed">
                    Standard PDF rendering engines mapped with enterprise customer billing parameters.
                  </p>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-100 rounded-2xl text-[11px] font-mono font-bold text-stone-500 text-center">
                  STATUS: TEMPLATE_COMPILED
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    {lang === 'FR' ? "PASSERELLE DE PRODUCTION" : "PRODUCTION GATEWAY"}
                  </span>
                  <p className="text-xs text-stone-600 font-semibold leading-relaxed">
                    Bypasses real charging algorithms while returning validated payment response logs.
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] font-mono font-bold text-emerald-700 text-center">
                  GATEWAY READY
                </div>
              </div>

            </div>

            {/* Sample Invoices and Mock Billing UI */}
            <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-4">
              <h4 className="font-sans font-bold text-sm text-stone-900 border-b border-stone-100 pb-3">
                {lang === 'FR' ? "Simulateur de Facturation d'Entreprise" : "Corporate Billing & Sample Invoice Inspec"}
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs font-semibold text-stone-700">
                <div className="space-y-4">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                    Sample active contract references
                  </p>
                  
                  <div className="space-y-2">
                    <div className="p-3 border border-stone-100 rounded-xl flex justify-between items-center bg-stone-50/50">
                      <div>
                        <p className="font-bold text-stone-950">Sorbonne Tech Lab</p>
                        <p className="text-[10px] text-stone-400 font-mono">Invoice Reference: SHA-2026-0042</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-stone-900 font-mono">299.00 EUR</p>
                        <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase">PAID</span>
                      </div>
                    </div>
                    
                    <div className="p-3 border border-stone-100 rounded-xl flex justify-between items-center bg-stone-50/50">
                      <div>
                        <p className="font-bold text-stone-950">L'Oréal Innovation Paris</p>
                        <p className="text-[10px] text-stone-400 font-mono">Invoice Reference: SHA-2026-0089</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-stone-900 font-mono">1,499.00 EUR</p>
                        <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase">PAID</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 space-y-4 font-mono text-[11px] text-stone-600">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                    <span className="font-bold text-stone-900">SHANA BILLING RECEIPT</span>
                    <span className="text-stone-400">#SHA-2026-0089</span>
                  </div>
                  <div className="space-y-1">
                    <p>Billed To: L'Oréal Innovation Paris</p>
                    <p>Date: June 27, 2026</p>
                    <p>Plan: Premium Tier License</p>
                  </div>
                  <div className="border-t border-b border-stone-200 py-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Premium Subscription Fee</span>
                      <span>1,499.00 EUR</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-400">
                      <span>Includes: 500 session limit, Vocal streams, AI Prompts</span>
                      <span>--</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>TOTAL COMPLIANCE DUE</span>
                    <span>1,499.00 EUR</span>
                  </div>
                  <div className="text-[9px] text-stone-400 text-center pt-2">
                    NO REAL PAYMENT PROCESSED • FOR EVALUATION PURPOSES ONLY
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
