import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Layers,
  Globe,
  Webhook,
  Key,
  RefreshCw,
  Sliders,
  Briefcase,
  Calendar,
  Database,
  Inbox,
  MessageSquare,
  Check,
  X,
  Lock,
  Unlock,
  Settings,
  Plus,
  Trash,
  Play,
  Pause,
  ShieldAlert,
  Copy,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Cpu,
  Zap,
  Sparkles,
  Share2,
  Compass,
  FileText,
  CheckCircle2,
  RotateCw,
  Search,
  Filter,
  UserCheck
} from 'lucide-react';

import { User } from '../../../types';
import KeysManagement from '../../../../admin/integrations/keys/index';

import {
  Connector,
  ConnectorState,
  ConnectorCategory,
  ApiKey,
  WebhookSubscription,
  WebhookDeliveryLog,
  WebhookEvent,
  MarketplaceExtension,
  AutomationWorkflow,
  IntegrationAuditLog,
  IntegrationStats
} from '../../../modules/connectors';
import {
  IntegrationRegistry,
  ConnectorManager,
  ApiAccessManager,
  WebhookEngine,
  MarketplaceManager,
  AutomationEngine,
  IntegrationController,
  OAuthManager
} from '../../../services/integrations';
import { AccessController } from '../../../services/admin';

interface IntegrationsCenterProps {
  currentUser: User;
  lang: 'FR' | 'EN';
}

export default function IntegrationsCenter({ currentUser, lang }: IntegrationsCenterProps) {
  const isSuperAdmin = AccessController.hasRole(currentUser.role, 'super_admin');
  const actorEmail = currentUser.email || 'admin@shana.com';
  const role = isSuperAdmin ? 'super_admin' : 'admin';

  // Language Dictionary
  const dict = {
    EN: {
      title: 'Integrations & External API Ecosystem',
      subtitle: 'Manage secure webhooks, API keys, third-party connectors, automated workflows, and partner integrations.',
      refresh: 'Autosync (30s) active',
      syncNow: 'Sync Now',
      dashboard: 'Dashboard',
      connectors: 'Connectors',
      apiAccess: 'API Keys',
      webhooks: 'Webhooks',
      marketplace: 'Marketplace',
      automation: 'Automations',
      securityAudit: 'Audit Logs',
      sandbox: 'Simulation Sandbox',
      connectedSystems: 'Connected Systems',
      healthyIntegrations: 'Healthy Integrations',
      failedSyncs: 'Failed Syncs',
      apiActivity: 'API Activity',
      webhookActivity: 'Webhook Activity',
      connectorUsage: 'Connector Utilization',
      status: 'Status',
      actions: 'Actions',
      category: 'Category',
      createdAt: 'Created At',
      lastSync: 'Last Sync',
      syncCount: 'Syncs',
      errorCount: 'Errors',
      draft: 'Draft',
      connected: 'Connected',
      disabled: 'Paused',
      error: 'Error',
      connect: 'Connect',
      disconnect: 'Disconnect',
      pause: 'Pause',
      resume: 'Resume',
      configure: 'Configure',
      createKey: 'Create API Key',
      keyName: 'Key Name',
      environment: 'Environment',
      permissions: 'Permissions',
      secretKey: 'Secret Token',
      neverUsed: 'Never Used',
      rotate: 'Rotate',
      revoke: 'Revoke',
      usage: 'Usage',
      active: 'Active',
      revoked: 'Revoked',
      registerWebhook: 'Register Webhook',
      destination: 'Destination URL',
      attempts: 'Attempts',
      successRate: 'Success Rate',
      event: 'Event',
      trigger: 'Trigger',
      condition: 'Condition',
      action: 'Action',
      activeRules: 'Active Rules',
      executions: 'Executions',
      createWorkflow: 'Create Automation Workflow',
      search: 'Search...',
      install: 'Install',
      uninstall: 'Uninstall',
      enable: 'Enable',
      disable: 'Disable',
      available: 'Available',
      installed: 'Installed',
      noCustomCode: 'No custom scripting allowed on server.',
      onlyAdmin: 'Admin permission required to modify configuration.',
      onlySuperAdmin: 'Super Admin permission required to publish or override global settings.',
      save: 'Save Config',
      cancel: 'Cancel',
      copySuccess: 'Copied to clipboard!',
      keyWarning: 'Make sure to copy your API key now. You will not be able to see it again!',
      testDispatch: 'Trigger Test Platform Event',
      dispatchDesc: 'Trigger a mock system event to instantly see Webhook Engines and matching Automation rules execute in real-time below.',
      selectEvent: 'Select Event to Mock',
      mockResult: 'Execution results logged immediately.'
    },
    FR: {
      title: 'Intégrations & Écosystème API Externe',
      subtitle: 'Pilotez les webhooks sécurisés, clés API, connecteurs tiers, flux d\'automatisation et catalogue de partenaires.',
      refresh: 'Autosync (30s) actif',
      syncNow: 'Synchroniser',
      dashboard: 'Tableau de bord',
      connectors: 'Connecteurs',
      apiAccess: 'Clés API',
      webhooks: 'Webhooks',
      marketplace: 'Marketplace',
      automation: 'Automations',
      securityAudit: 'Logs d\'audit',
      sandbox: 'Bac à sable (Simulateur)',
      connectedSystems: 'Systèmes Connectés',
      healthyIntegrations: 'Flux Sains',
      failedSyncs: 'Erreurs de Sync',
      apiActivity: 'Activité API',
      webhookActivity: 'Activité Webhook',
      connectorUsage: 'Utilisation Connecteurs',
      status: 'Statut',
      actions: 'Actions',
      category: 'Catégorie',
      createdAt: 'Créé le',
      lastSync: 'Dernier Sync',
      syncCount: 'Syncs',
      errorCount: 'Erreurs',
      draft: 'Brouillon',
      connected: 'Connecté',
      disabled: 'En pause',
      error: 'Erreur',
      connect: 'Connecter',
      disconnect: 'Déconnecter',
      pause: 'Suspendre',
      resume: 'Reprendre',
      configure: 'Configurer',
      createKey: 'Créer une Clé API',
      keyName: 'Nom de la clé',
      environment: 'Environnement',
      permissions: 'Permissions',
      secretKey: 'Jeton Secret',
      neverUsed: 'Jamais utilisé',
      rotate: 'Pivoter',
      revoke: 'Révoquer',
      usage: 'Usage',
      active: 'Actif',
      revoked: 'Révoqué',
      registerWebhook: 'Enregistrer Webhook',
      destination: 'URL de Destination',
      attempts: 'Tentatives',
      successRate: 'Taux de succès',
      event: 'Événement',
      trigger: 'Déclencheur',
      condition: 'Condition',
      action: 'Action',
      activeRules: 'Règles Actives',
      executions: 'Exécutions',
      createWorkflow: 'Créer une Règle d\'Automatisation',
      search: 'Rechercher...',
      install: 'Installer',
      uninstall: 'Désinstaller',
      enable: 'Activer',
      disable: 'Désactiver',
      available: 'Disponible',
      installed: 'Installé',
      noCustomCode: 'Exécution de scripts personnalisés non autorisée sur le serveur.',
      onlyAdmin: 'Permissions Administrateur requises pour modifier les connecteurs.',
      onlySuperAdmin: 'Permissions Super Administrateur requises pour approuver ou publier des extensions.',
      save: 'Sauvegarder',
      cancel: 'Annuler',
      copySuccess: 'Copié dans le presse-papiers !',
      keyWarning: 'Copiez bien votre clé API maintenant. Vous ne pourrez plus la consulter ultérieurement !',
      testDispatch: 'Déclencher Événement Plateforme Mock',
      dispatchDesc: 'Simulez instantanément un événement système pour voir le moteur de Webhook et l\'automatisation s\'exécuter en temps réel ci-dessous.',
      selectEvent: 'Sélectionner l\'événement',
      mockResult: 'Résultats d\'exécution consignés immédiatement.'
    }
  }[lang];

  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'connectors' | 'api' | 'webhooks' | 'marketplace' | 'automation' | 'audit' | 'sandbox'>('dashboard');

  // Core States
  const [stats, setStats] = useState<IntegrationStats>(() => IntegrationController.getDashboardStats());
  const [connectors, setConnectors] = useState<Connector[]>(() => ConnectorManager.getConnectors());
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => ApiAccessManager.getApiKeys());
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>(() => WebhookEngine.getSubscriptions());
  const [webhookLogs, setWebhookLogs] = useState<WebhookDeliveryLog[]>(() => IntegrationRegistry.getWebhookLogs());
  const [marketplace, setMarketplace] = useState<MarketplaceExtension[]>(() => MarketplaceManager.getExtensions());
  const [automations, setAutomations] = useState<AutomationWorkflow[]>(() => AutomationEngine.getWorkflows());
  const [auditLogs, setAuditLogs] = useState<IntegrationAuditLog[]>(() => IntegrationRegistry.getAuditLogs());

  // Search & Filter state variables
  const [connSearch, setConnSearch] = useState('');
  const [connCategoryFilter, setConnCategoryFilter] = useState<'all' | ConnectorCategory>('all');
  const [marketSearch, setMarketSearch] = useState('');
  const [marketCategoryFilter, setMarketCategoryFilter] = useState<'all' | ConnectorCategory>('all');

  // UI Flow modals/drawers
  const [selectedConnectorToConfig, setSelectedConnectorToConfig] = useState<Connector | null>(null);
  const [configFields, setConfigFields] = useState<Record<string, string>>({});
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<ApiKey | null>(null);
  const [newKeyForm, setNewKeyForm] = useState({ name: '', environment: 'sandbox' as ApiKey['environment'], permissions: 'read' as ApiKey['permissions'] });
  
  const [newWebhookOpen, setNewWebhookOpen] = useState(false);
  const [newWebhookForm, setNewWebhookForm] = useState({ event: 'interview.completed' as WebhookEvent, destination: '' });

  const [newWorkflowOpen, setNewWorkflowOpen] = useState(false);
  const [newWorkflowForm, setNewWorkflowForm] = useState({ name: '', trigger: 'interview.completed', condition: 'score >= 80', action: 'Generate report & push ATS candidate' });

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [oauthConnectingId, setOauthConnectingId] = useState<string | null>(null);

  // Auto-refresh hook (runs every 30 seconds to fetch health stats & trigger dynamic counters)
  useEffect(() => {
    const interval = setInterval(() => {
      syncData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Real Google OAuth event listener for popup message
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { connectorId, token } = event.data;
        if (connectorId === 'conn_gcal') {
          ConnectorManager.connect('conn_gcal', { oauthToken: token, oauthExpires: new Date(Date.now() + 3600 * 1000).toISOString() }, actorEmail, role);
          setOauthConnectingId(null);
          syncData();
        }
      }
    };
    
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [actorEmail, role]);

  const syncData = () => {
    setStats(IntegrationController.getDashboardStats());
    setConnectors(ConnectorManager.getConnectors());
    setApiKeys(ApiAccessManager.getApiKeys());
    setWebhooks(WebhookEngine.getSubscriptions());
    setWebhookLogs(IntegrationRegistry.getWebhookLogs());
    setMarketplace(MarketplaceManager.getExtensions());
    setAutomations(AutomationEngine.getWorkflows());
    setAuditLogs(IntegrationRegistry.getAuditLogs());
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Connect / Pause / Disconnect connectors handlers
  const handleConnectConnector = (conn: Connector) => {
    if (conn.connectorId === 'conn_gcal') {
      setOauthConnectingId('conn_gcal');
      const currentOrigin = window.location.origin;
      fetch(`/api/auth/google/url?origin=${encodeURIComponent(currentOrigin)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.url) {
            const authWindow = window.open(
              data.url,
              'google_oauth_popup',
              'width=600,height=700,status=yes,resizable=yes'
            );
            if (!authWindow) {
              alert("Le bloqueur de popups a bloqué l'écran de connexion Google. Veuillez autoriser les popups pour ce site.");
              setOauthConnectingId(null);
            }
          } else {
            throw new Error("Invalid URL returned by OAuth endpoint.");
          }
        })
        .catch(err => {
          console.error("Google OAuth initiation error:", err);
          alert("Could not start Google OAuth flow: " + err.message);
          setOauthConnectingId(null);
        });
    } else if (conn.connectorId === 'conn_workday') {
      setOauthConnectingId(conn.connectorId);
      OAuthManager.simulateOAuthFlow(conn.connectorId, actorEmail, role)
        .then(() => {
          setOauthConnectingId(null);
          syncData();
        });
    } else {
      setSelectedConnectorToConfig(conn);
      setConfigFields(conn.config || {});
    }
  };

  const handleSaveConnectorConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedConnectorToConfig) {
      ConnectorManager.connect(selectedConnectorToConfig.connectorId, configFields, actorEmail, role);
      setSelectedConnectorToConfig(null);
      syncData();
    }
  };

  const handlePauseConnector = (id: string) => {
    ConnectorManager.pause(id, actorEmail, role);
    syncData();
  };

  const handleResumeConnector = (id: string) => {
    ConnectorManager.resume(id, actorEmail, role);
    syncData();
  };

  const handleDisconnectConnector = (id: string) => {
    ConnectorManager.disconnect(id, actorEmail, role);
    syncData();
  };

  // API Key handlers
  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyForm.name.trim()) return;

    const created = ApiAccessManager.createKey(
      newKeyForm.name.trim(),
      newKeyForm.environment,
      newKeyForm.permissions,
      actorEmail,
      role
    );
    setGeneratedKey(created);
    setNewKeyForm({ name: '', environment: 'sandbox', permissions: 'read' });
    syncData();
  };

  const handleDisableApiKey = (id: string) => {
    ApiAccessManager.disableKey(id, actorEmail, role);
    syncData();
  };

  const handleRotateApiKey = (id: string) => {
    const rotated = ApiAccessManager.rotateKey(id, actorEmail, role);
    if (rotated) {
      setGeneratedKey(rotated);
    }
    syncData();
  };

  // Webhook handlers
  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookForm.destination.trim()) return;

    WebhookEngine.createSubscription(
      newWebhookForm.event,
      newWebhookForm.destination.trim(),
      actorEmail,
      role
    );
    setNewWebhookOpen(false);
    setNewWebhookForm({ event: 'interview.completed', destination: '' });
    syncData();
  };

  const handlePauseWebhook = (id: string) => {
    WebhookEngine.pauseSubscription(id, actorEmail, role);
    syncData();
  };

  const handleResumeWebhook = (id: string) => {
    WebhookEngine.resumeSubscription(id, actorEmail, role);
    syncData();
  };

  const handleDeleteWebhook = (id: string) => {
    WebhookEngine.deleteSubscription(id, actorEmail, role);
    syncData();
  };

  // Marketplace handlers (Super Admin publishes/approves/disables, Admin installs)
  const handleInstallExtension = (id: string) => {
    MarketplaceManager.installExtension(id, actorEmail, role);
    syncData();
  };

  const handleUninstallExtension = (id: string) => {
    MarketplaceManager.uninstallExtension(id, actorEmail, role);
    syncData();
  };

  const handleEnableExtension = (id: string) => {
    MarketplaceManager.enableExtension(id, actorEmail, role);
    syncData();
  };

  const handleDisableExtension = (id: string) => {
    if (!isSuperAdmin) {
      alert(dict.onlySuperAdmin);
      return;
    }
    MarketplaceManager.disableExtension(id, actorEmail, role);
    syncData();
  };

  // Automation handlers
  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowForm.name.trim()) return;

    AutomationEngine.createWorkflow(
      newWorkflowForm.name.trim(),
      newWorkflowForm.trigger,
      newWorkflowForm.condition,
      newWorkflowForm.action,
      actorEmail,
      role
    );
    setNewWorkflowOpen(false);
    setNewWorkflowForm({ name: '', trigger: 'interview.completed', condition: 'score >= 80', action: 'Generate report & push ATS candidate' });
    syncData();
  };

  const handleToggleWorkflow = (id: string, active: boolean) => {
    AutomationEngine.toggleWorkflow(id, active, actorEmail, role);
    syncData();
  };

  const handleDeleteWorkflow = (id: string) => {
    AutomationEngine.deleteWorkflow(id, actorEmail, role);
    syncData();
  };

  // Simulation Sandbox: mocks triggering a platform event (e.g., candidate completes high score)
  const handleSimulateEvent = (eventName: WebhookEvent) => {
    let mockContext = {};
    if (eventName === 'interview.completed') {
      mockContext = { candidateId: 'usr_cand_' + Math.floor(Math.random() * 50), score: 85, durationSeconds: 1200 };
    } else if (eventName === 'interview.started') {
      mockContext = { candidateId: 'usr_cand_' + Math.floor(Math.random() * 50), interviewId: 'int_' + Math.random().toString(36).substring(2, 9) };
    } else if (eventName === 'subscription.updated') {
      mockContext = { orgId: 'org_sorbonne', plan: 'Enterprise', seats: 200 };
    } else if (eventName === 'workspace.created') {
      mockContext = { orgId: 'org_' + Math.random().toString(36).substring(2, 9), owner: actorEmail };
    } else if (eventName === 'user.updated') {
      mockContext = { userId: 'usr_candidate', role: 'candidate', hasCV: true };
    }

    IntegrationController.handlePlatformEvent(eventName, mockContext);
    syncData();
  };

  // Connector Filters
  const filteredConnectors = connectors.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(connSearch.toLowerCase()) || c.connectorId.toLowerCase().includes(connSearch.toLowerCase());
    const matchesCategory = connCategoryFilter === 'all' || c.category === connCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Marketplace Filters
  const filteredExtensions = marketplace.filter(e => {
    const matchesSearch = e.integration.toLowerCase().includes(marketSearch.toLowerCase()) || e.description.toLowerCase().includes(marketSearch.toLowerCase());
    const matchesCategory = marketCategoryFilter === 'all' || e.category === marketCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6" id="integrations-center-root">
      
      {/* Ecosystem Header */}
      <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-700 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
              <Globe className="w-3.5 h-3.5" />
              INTEGRATION LAYER — PHASE 10
            </span>
            <span className="text-[10px] text-stone-400 font-mono">ROLE: {role.toUpperCase()}</span>
          </div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight">{dict.title}</h2>
          <p className="text-[#6B7280] text-xs font-semibold leading-relaxed max-w-3xl">
            {dict.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-stone-500 font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {dict.refresh}
          </span>
          <button
            onClick={syncData}
            className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded-xl transition-all cursor-pointer flex items-center justify-center"
            title={dict.syncNow}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation bar tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-stone-200">
        {[
          { id: 'dashboard', label: dict.dashboard, icon: Layers },
          { id: 'connectors', label: dict.connectors, icon: Sliders },
          { id: 'api', label: dict.apiAccess, icon: Key },
          { id: 'webhooks', label: dict.webhooks, icon: Webhook },
          { id: 'marketplace', label: dict.marketplace, icon: Compass },
          { id: 'automation', label: dict.automation, icon: Zap },
          { id: 'audit', label: dict.securityAudit, icon: FileText },
          { id: 'sandbox', label: dict.sandbox, icon: Cpu },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shrink-0 transition-all ${
                isActive
                  ? 'bg-stone-950 text-white shadow-md shadow-stone-950/10'
                  : 'text-stone-500 hover:text-stone-950 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'sandbox' && (
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Renderers */}
      <div className="animate-fade-in text-left">
        
        {/* SECTION 1: INTEGRATION DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Connected Systems */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">{dict.connectedSystems}</span>
                  <div className="p-2 bg-violet-50 text-violet-700 border border-violet-100 rounded-xl">
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-sans font-black text-3.5xl text-stone-900">{stats.connectedSystems}</h3>
                  <p className="text-stone-500 text-[11px] font-semibold">{dict.connectorUsage}: {stats.connectorUsagePct}%</p>
                </div>
              </div>

              {/* Healthy Integrations */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">{dict.healthyIntegrations}</span>
                  <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-sans font-black text-3.5xl text-stone-900">{stats.healthyIntegrations}</h3>
                  <p className="text-stone-500 text-[11px] font-semibold">Active credentials or webhooks verified sane.</p>
                </div>
              </div>

              {/* Failed Syncs */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">{dict.failedSyncs}</span>
                  <div className="p-2 bg-red-50 text-red-700 border border-red-100 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-sans font-black text-3.5xl text-stone-900">{stats.failedSyncs}</h3>
                  <p className="text-stone-500 text-[11px] font-semibold">Transmission/connection faults registered.</p>
                </div>
              </div>

              {/* API Activity */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">{dict.apiActivity}</span>
                  <div className="p-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl">
                    <Key className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-sans font-black text-3.5xl text-stone-900">{stats.apiActivityCount} <span className="text-xs font-mono text-stone-400">Hits</span></h3>
                  <p className="text-stone-500 text-[11px] font-semibold">Keys hit counts parsed over current hour.</p>
                </div>
              </div>

              {/* Webhook Activity */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">{dict.webhookActivity}</span>
                  <div className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl">
                    <Webhook className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-sans font-black text-3.5xl text-stone-900">{stats.webhookActivityCount} <span className="text-xs font-mono text-stone-400">Dispatches</span></h3>
                  <p className="text-stone-500 text-[11px] font-semibold">Completed outbound dispatch triggers.</p>
                </div>
              </div>

              {/* Sandbox Quick Access Panel */}
              <div className="bg-stone-950 border border-stone-900 p-6 rounded-3xl shadow-md space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <h4 className="font-mono text-[10px] font-black uppercase tracking-wider text-stone-200">
                      Sandbox Simulation Engine
                    </h4>
                  </div>
                  <p className="text-stone-400 text-[11.5px] leading-relaxed mt-2.5 font-medium">
                    Test integrations in real-time. Trigger simulated interview events and trace transmission routes immediately.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('sandbox')}
                  className="w-full py-2 bg-white hover:bg-stone-100 text-stone-950 font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer text-center flex items-center justify-center gap-1 transition-all"
                >
                  <Play className="w-3 h-3 fill-stone-950" />
                  Launch Sandbox
                </button>
              </div>

            </div>

            {/* Quick Audit Warnings */}
            <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-4.5 h-4.5 text-amber-650 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">Ecosystem Security & Sandboxing Constraints</h4>
                <p className="text-amber-800 text-xs leading-relaxed font-semibold">
                  {dict.noCustomCode} Sandboxing isolates connectors so third-party credentials reside in cryptographically masked buffers.
                </p>
              </div>
            </div>

            {/* Recent Webhook Output Feed */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">Live Webhook Log Feed</h3>
                  <p className="text-xs text-stone-400 font-semibold">Outbound integrations transmission logs</p>
                </div>
                <button
                  onClick={() => setActiveTab('webhooks')}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10.5px] font-bold text-stone-700 cursor-pointer"
                >
                  Manage Webhooks
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {webhookLogs.length === 0 ? (
                  <p className="text-stone-400 text-xs font-semibold italic py-4">No webhook transmissions logged yet.</p>
                ) : (
                  webhookLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="border border-stone-150 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                            log.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
                          }`}>
                            {log.responseStatus} {log.success ? 'OK' : 'FAIL'}
                          </span>
                          <span className="font-mono text-stone-800 font-bold text-[10.5px]">{log.event}</span>
                          <span className="text-[10px] text-stone-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[11.5px] text-stone-500 font-mono select-all truncate max-w-lg md:max-w-2xl">{log.destination}</p>
                      </div>
                      <div className="shrink-0 text-right font-mono text-[10px] text-stone-400">
                        {log.attempts} delivery attempt{log.attempts > 1 ? 's' : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: CONNECTORS */}
        {activeTab === 'connectors' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-82">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={connSearch}
                  onChange={(e) => setConnSearch(e.target.value)}
                  placeholder={dict.search}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-stone-200 bg-stone-50 hover:bg-stone-100/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all font-sans"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase">{dict.category}</span>
                <select
                  value={connCategoryFilter}
                  onChange={(e: any) => setConnCategoryFilter(e.target.value)}
                  className="border border-stone-200 rounded-xl text-xs px-2.5 py-1.5 bg-white font-semibold font-sans focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="ATS">ATS</option>
                  <option value="calendar">Calendar</option>
                  <option value="CRM">CRM</option>
                  <option value="storage">Storage</option>
                  <option value="productivity">Productivity</option>
                  <option value="identity">Identity</option>
                  <option value="communication">Communication</option>
                </select>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-400 font-mono text-[9px] uppercase tracking-widest font-bold">
                      <th className="px-6 py-4">Connector</th>
                      <th className="px-6 py-4">{dict.category}</th>
                      <th className="px-6 py-4">{dict.status}</th>
                      <th className="px-6 py-4">{dict.lastSync}</th>
                      <th className="px-6 py-4 text-center">{dict.syncCount}</th>
                      <th className="px-6 py-4 text-center">{dict.errorCount}</th>
                      <th className="px-6 py-4 text-right">{dict.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-sans">
                    {filteredConnectors.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-stone-400 italic">
                          No connectors found matching parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredConnectors.map(conn => {
                        const isOauth = conn.connectorId === 'conn_gcal' || conn.connectorId === 'conn_workday';
                        
                        return (
                          <tr key={conn.connectorId} className="hover:bg-stone-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-black">
                                  {conn.category[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-stone-900">{conn.name}</p>
                                  <p className="text-stone-400 text-[10px] font-mono">{conn.connectorId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono bg-stone-100 px-2 py-0.5 rounded font-semibold text-[10.5px] uppercase">
                                {conn.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded border uppercase ${
                                {
                                  connected: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                                  draft: 'bg-stone-50 border-stone-200 text-stone-600',
                                  disabled: 'bg-amber-50 border-amber-200 text-amber-800',
                                  error: 'bg-red-50 border-red-200 text-red-800'
                                }[conn.status]
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  {
                                    connected: 'bg-emerald-500',
                                    draft: 'bg-stone-400',
                                    disabled: 'bg-amber-500',
                                    error: 'bg-red-500 animate-pulse'
                                  }[conn.status]
                                }`}></span>
                                {dict[conn.status]}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-stone-500 text-[11px]">
                              {conn.lastSync !== '-' ? new Date(conn.lastSync).toLocaleTimeString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-center font-mono font-bold text-stone-800">
                              {conn.syncCount}
                            </td>
                            <td className="px-6 py-4 text-center font-mono font-bold text-red-650">
                              {conn.errorCount}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {conn.status === 'draft' || conn.status === 'error' ? (
                                  <button
                                    onClick={() => handleConnectConnector(conn)}
                                    disabled={oauthConnectingId === conn.connectorId}
                                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white rounded-lg text-[10.5px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all"
                                  >
                                    {oauthConnectingId === conn.connectorId ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        <span>OAuth...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3" />
                                        <span>{isOauth ? 'OAuth Connect' : dict.connect}</span>
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <>
                                    {conn.status === 'connected' ? (
                                      <button
                                        onClick={() => handlePauseConnector(conn.connectorId)}
                                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg cursor-pointer"
                                        title={dict.pause}
                                      >
                                        <Pause className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleResumeConnector(conn.connectorId)}
                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg cursor-pointer"
                                        title={dict.resume}
                                      >
                                        <Play className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDisconnectConnector(conn.connectorId)}
                                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg text-[10.5px] font-bold uppercase tracking-wider cursor-pointer"
                                      title={dict.disconnect}
                                    >
                                      {dict.disconnect}
                                    </button>
                                  </>
                                )}
                              </div>
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

        {/* SECTION 3: API ACCESS */}
        {activeTab === 'api' && (
          <KeysManagement currentUser={currentUser as any} lang={lang} />
        )}

        {/* SECTION 4: WEBHOOKS */}
        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">Outbound Webhooks Engine</h3>
                <p className="text-xs text-stone-400 font-semibold">Subscribe external systems to real-time interview assessment state transitions.</p>
              </div>
              <button
                onClick={() => setNewWebhookOpen(true)}
                className="px-4 py-2.5 bg-stone-950 hover:bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                {dict.registerWebhook}
              </button>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-400 font-mono text-[9px] uppercase tracking-widest font-bold">
                      <th className="px-6 py-4">Webhook ID / Event</th>
                      <th className="px-6 py-4">{dict.destination}</th>
                      <th className="px-6 py-4">Secret Signing Token</th>
                      <th className="px-6 py-4 text-center">{dict.attempts}</th>
                      <th className="px-6 py-4 text-center">{dict.successRate}</th>
                      <th className="px-6 py-4">{dict.status}</th>
                      <th className="px-6 py-4 text-right">{dict.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-sans">
                    {webhooks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-stone-400 italic">
                          No webhook endpoints registered yet.
                        </td>
                      </tr>
                    ) : (
                      webhooks.map(hook => (
                        <tr key={hook.id} className="hover:bg-stone-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-mono font-bold text-stone-900">{hook.event}</p>
                              <p className="text-stone-400 text-[10px] font-mono">{hook.id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-[11.5px] text-stone-600 select-all truncate max-w-sm">
                            {hook.destination}
                          </td>
                          <td className="px-6 py-4 font-mono text-[11.5px] text-stone-400 select-all">
                            {hook.secretToken}
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-bold text-stone-700">
                            {hook.attempts}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-mono font-bold ${
                              hook.successRate >= 95 ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              {hook.successRate}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded border uppercase ${
                              hook.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-600'
                            }`}>
                              {hook.status === 'active' ? dict.active : dict.disabled}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {hook.status === 'active' ? (
                                <button
                                  onClick={() => handlePauseWebhook(hook.id)}
                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg cursor-pointer"
                                  title={dict.pause}
                                >
                                  <Pause className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleResumeWebhook(hook.id)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg cursor-pointer"
                                  title={dict.resume}
                                >
                                  <Play className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteWebhook(hook.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg cursor-pointer"
                                title="Remove Subscriber"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: MARKETPLACE */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-82">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                  placeholder={dict.search}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-stone-200 bg-stone-50 hover:bg-stone-100/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all font-sans"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase">{dict.category}</span>
                <select
                  value={marketCategoryFilter}
                  onChange={(e: any) => setMarketCategoryFilter(e.target.value)}
                  className="border border-stone-200 rounded-xl text-xs px-2.5 py-1.5 bg-white font-semibold font-sans focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="ATS">ATS</option>
                  <option value="calendar">Calendar</option>
                  <option value="CRM">CRM</option>
                  <option value="storage">Storage</option>
                  <option value="productivity">Productivity</option>
                  <option value="identity">Identity</option>
                  <option value="communication">Communication</option>
                </select>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredExtensions.length === 0 ? (
                <div className="col-span-full bg-white border border-stone-200 p-12 rounded-3xl text-center text-stone-400 italic">
                  No marketplace extensions found.
                </div>
              ) : (
                filteredExtensions.map(ext => (
                  <div key={ext.id} className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-2 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 shrink-0 font-black text-sm">
                          {ext.category[0]}
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[9px] font-bold text-stone-400 font-mono">v{ext.version}</span>
                          <span className={`inline-flex items-center gap-1 text-[8.5px] font-black px-2 py-0.5 rounded border uppercase mt-1 ${
                            ext.status === 'installed'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : ext.status === 'disabled'
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-stone-50 border-stone-200 text-stone-600'
                          }`}>
                            {ext.status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-stone-900">{ext.integration}</h4>
                        <span className="inline-block font-mono bg-stone-100 px-2 py-0.5 rounded font-bold text-[9px] text-stone-500 uppercase">
                          {ext.category}
                        </span>
                      </div>

                      <p className="text-xs text-[#6B7280] font-medium leading-relaxed">
                        {ext.description}
                      </p>
                      
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider pt-1.5">
                        By {ext.author}
                      </p>
                    </div>

                    <div className="border-t border-stone-100 pt-3 flex items-center justify-between gap-2 shrink-0">
                      {ext.status === 'available' ? (
                        <button
                          onClick={() => handleInstallExtension(ext.id)}
                          className="w-full py-2 bg-stone-950 hover:bg-stone-900 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer text-center"
                        >
                          {dict.install}
                        </button>
                      ) : (
                        <div className="w-full flex gap-2">
                          {ext.status === 'installed' ? (
                            <button
                              onClick={() => handleDisableExtension(ext.id)}
                              className="w-1/2 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer text-center"
                            >
                              {dict.disable}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnableExtension(ext.id)}
                              className="w-1/2 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer text-center"
                            >
                              {dict.enable}
                            </button>
                          )}
                          <button
                            onClick={() => handleUninstallExtension(ext.id)}
                            className="w-1/2 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer text-center"
                          >
                            {dict.uninstall}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION 6: AUTOMATION */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">Automated Workflows (Trigger-Condition-Action)</h3>
                <p className="text-xs text-stone-400 font-semibold">Integrate evaluation results instantly. Set up triggers that cascade to external pipelines.</p>
              </div>
              <button
                onClick={() => setNewWorkflowOpen(true)}
                className="px-4 py-2.5 bg-stone-950 hover:bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                {dict.createWorkflow}
              </button>
            </div>

            {/* Workflow List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {automations.length === 0 ? (
                <div className="col-span-full bg-white border border-stone-200 p-12 rounded-3xl text-center text-stone-400 italic">
                  No automated workflows defined yet.
                </div>
              ) : (
                automations.map(wf => (
                  <div key={wf.id} className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm leading-snug">{wf.name}</h4>
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">Workflow ID: {wf.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleWorkflow(wf.id, !wf.active)}
                          className={`w-9 h-5 rounded-full transition-all border p-0.5 ${wf.active ? 'bg-emerald-500 border-emerald-600 flex justify-end' : 'bg-stone-100 border-stone-200 flex justify-start'}`}
                        >
                          <span className="w-3.5 h-3.5 bg-white rounded-full shadow-xs"></span>
                        </button>
                        <button
                          onClick={() => handleDeleteWorkflow(wf.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg cursor-pointer"
                          title="Delete Workflow"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Automation Visual Tree */}
                    <div className="bg-stone-50 border border-stone-150 rounded-2xl p-4 space-y-2 text-xs font-mono text-left">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 text-[10px] font-bold">TRIGGER</span>
                        <span className="text-stone-700 font-bold">{wf.trigger}</span>
                      </div>
                      <div className="w-4 h-3.5 border-l border-dashed border-stone-400 ml-4"></div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">CONDITION</span>
                        <span className="text-stone-700 font-semibold">{wf.condition}</span>
                      </div>
                      <div className="w-4 h-3.5 border-l border-dashed border-stone-400 ml-4"></div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">ACTION</span>
                        <span className="text-stone-700 font-semibold">{wf.action}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500 font-semibold">
                      <span>Executions: <strong className="font-mono text-stone-900 font-black">{wf.executionCount}</strong></span>
                      <span>Last: <strong className="font-mono text-stone-900 font-semibold">{wf.lastExecuted !== '-' ? new Date(wf.lastExecuted).toLocaleTimeString() : '-'}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION 7: SECURITY & AUDIT */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">Ecosystem Audit Logs</h3>
                <p className="text-xs text-stone-400 font-semibold">Immutable administrative trace logs logging credential creation, rotations, connector status overrides and dispatches.</p>
              </div>

              <div className="space-y-3.5">
                {auditLogs.map(log => (
                  <div key={log.id} className="border border-stone-150 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-sans">
                    <div className="space-y-1.5 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-stone-400 font-mono">{log.id}</span>
                        <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                          {
                            integration_created: 'bg-violet-50 text-violet-800 border border-violet-200',
                            connector_changed: 'bg-blue-50 text-blue-800 border border-blue-200',
                            api_generated: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
                            webhook_executed: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
                            automation_executed: 'bg-amber-50 text-amber-800 border border-amber-200',
                            marketplace_installed: 'bg-pink-50 text-pink-800 border border-pink-200',
                          }[log.actionType]
                        }`}>
                          {log.actionType.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-stone-850">{log.description}</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-400 text-[10px] font-bold">
                        <span>ACTOR: {log.actor} ({log.role.toUpperCase()})</span>
                        {log.targetId && (
                          <>
                            <span>•</span>
                            <span className="font-mono">TARGET: {log.targetId}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right font-mono text-[10px] text-stone-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8: SIMULATION SANDBOX */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-6">
              <div className="space-y-1.5 text-left">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">{dict.sandbox}</h3>
                </div>
                <p className="text-xs text-[#6B7280] font-semibold leading-relaxed">
                  {dict.dispatchDesc}
                </p>
              </div>

              {/* Event Mock buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[
                  { id: 'interview.started', label: 'Interview Started', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800' },
                  { id: 'interview.completed', label: 'Interview Completed (Score 85%)', color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800' },
                  { id: 'subscription.updated', label: 'Subscription Updated', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800' },
                  { id: 'workspace.created', label: 'Workspace Created', color: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-800' },
                  { id: 'user.updated', label: 'User Profile Updated', color: 'bg-pink-50 border-pink-200 hover:bg-pink-100 text-pink-800' },
                ].map(evt => (
                  <button
                    key={evt.id}
                    onClick={() => handleSimulateEvent(evt.id as WebhookEvent)}
                    className={`p-4 rounded-2xl border flex flex-col justify-between items-start gap-3 transition-all text-left shadow-xs cursor-pointer ${evt.color}`}
                  >
                    <div>
                      <span className="font-mono text-[8.5px] uppercase tracking-widest font-black opacity-60">Event trigger</span>
                      <p className="font-bold text-xs mt-1 leading-snug">{evt.label}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold leading-normal pt-1 shrink-0">
                      Trigger Event
                      <Play className="w-2.5 h-2.5 fill-current" />
                    </span>
                  </button>
                ))}
              </div>

              {/* Realtime Terminal output trace logs */}
              <div className="bg-stone-950 border border-stone-900 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs text-stone-450 border-b border-stone-850 pb-3">
                  <span className="font-mono text-stone-200 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Live Integration Transmission Pipeline
                  </span>
                  <span className="font-mono text-[10px] font-bold text-stone-400">LOGSTREAM: ACTIVE</span>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 font-mono text-[11.5px] leading-relaxed text-[#D1D5DB]">
                  {auditLogs.filter(l => l.actionType === 'webhook_executed' || l.actionType === 'automation_executed').length === 0 ? (
                    <div className="text-stone-500 italic py-6 text-center text-xs">
                      [Pipeline waiting for telemetry triggers...] Click any of the platform events above to execute outbound integrations.
                    </div>
                  ) : (
                    auditLogs
                      .filter(l => l.actionType === 'webhook_executed' || l.actionType === 'automation_executed')
                      .slice(0, 15)
                      .map(log => (
                        <div key={log.id} className="text-left border-l-2 border-stone-800 pl-3 py-0.5 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-stone-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className={`text-[10px] font-bold ${
                              log.actionType === 'webhook_executed' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              [{log.actionType.toUpperCase()}]
                            </span>
                          </div>
                          <p className="text-stone-300">{log.description}</p>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODALS AND DRAWERS FOR CONFIGURATION */}
      
      {/* Connector Config Modal */}
      {selectedConnectorToConfig && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-3xl shadow-2xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="font-sans font-black text-sm text-stone-900 uppercase tracking-wide">
                Configure {selectedConnectorToConfig.name}
              </h4>
              <button
                onClick={() => setSelectedConnectorToConfig(null)}
                className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-900 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConnectorConfig} className="space-y-4 text-xs font-sans">
              <p className="text-[#6B7280] font-semibold leading-relaxed">
                Configure isolated API targets. These values are encrypted inside secure browser local partitions.
              </p>

              {Object.keys(selectedConnectorToConfig.config || {}).length === 0 ? (
                <div className="bg-stone-50 border border-stone-150 p-4 rounded-xl text-stone-400 italic text-center">
                  No configurable parameters for this connector.
                </div>
              ) : (
                Object.keys(selectedConnectorToConfig.config || {}).map(fieldKey => (
                  <div key={fieldKey} className="space-y-1.5">
                    <label className="font-bold text-stone-700 capitalize">{fieldKey.replace(/([A-Z])/g, ' $1')}</label>
                    <input
                      type="text"
                      value={configFields[fieldKey] || ''}
                      onChange={(e) => setConfigFields({ ...configFields, [fieldKey]: e.target.value })}
                      placeholder={`Enter ${fieldKey}`}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all text-xs"
                      required
                    />
                  </div>
                ))
              )}

              <div className="flex items-center gap-2 pt-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedConnectorToConfig(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl font-bold font-sans text-[11px] uppercase tracking-wide cursor-pointer"
                >
                  {dict.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-950 hover:bg-stone-900 text-white rounded-xl font-bold font-sans text-[11px] uppercase tracking-wide cursor-pointer"
                >
                  {dict.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create API Key Modal */}
      {newKeyModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-3xl shadow-2xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="font-sans font-black text-sm text-stone-900 uppercase tracking-wide">
                {dict.createKey}
              </h4>
              <button
                onClick={() => setNewKeyModalOpen(false)}
                className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-900 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { handleCreateApiKey(e); setNewKeyModalOpen(false); }} className="space-y-4 text-xs font-sans">
              
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">{dict.keyName}</label>
                <input
                  type="text"
                  value={newKeyForm.name}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.target.value })}
                  placeholder="e.g. Talent Integration Feed"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">{dict.environment}</label>
                  <select
                    value={newKeyForm.environment}
                    onChange={(e: any) => setNewKeyForm({ ...newKeyForm, environment: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl text-xs px-3.5 py-2 bg-white font-semibold font-sans focus:outline-none"
                  >
                    <option value="sandbox">Sandbox</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">{dict.permissions}</label>
                  <select
                    value={newKeyForm.permissions}
                    onChange={(e: any) => setNewKeyForm({ ...newKeyForm, permissions: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl text-xs px-3.5 py-2 bg-white font-semibold font-sans focus:outline-none"
                  >
                    <option value="read">Read Only</option>
                    <option value="write">Read / Write</option>
                    <option value="admin">Full Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setNewKeyModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl font-bold font-sans text-[11px] uppercase tracking-wide cursor-pointer"
                >
                  {dict.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-950 hover:bg-stone-900 text-white rounded-xl font-bold font-sans text-[11px] uppercase tracking-wide cursor-pointer"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Webhook Modal */}
      {newWebhookOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-3xl shadow-2xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="font-sans font-black text-sm text-stone-900 uppercase tracking-wide">
                {dict.registerWebhook}
              </h4>
              <button
                onClick={() => setNewWebhookOpen(false)}
                className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-900 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4 text-xs font-sans">
              
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">{dict.event}</label>
                <select
                  value={newWebhookForm.event}
                  onChange={(e: any) => setNewWebhookForm({ ...newWebhookForm, event: e.target.value })}
                  className="w-full border border-stone-200 rounded-xl text-xs px-3.5 py-2 bg-white font-semibold font-sans focus:outline-none"
                >
                  <option value="interview.started">interview.started</option>
                  <option value="interview.completed">interview.completed</option>
                  <option value="subscription.updated">subscription.updated</option>
                  <option value="workspace.created">workspace.created</option>
                  <option value="user.updated">user.updated</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">{dict.destination}</label>
                <input
                  type="url"
                  value={newWebhookForm.destination}
                  onChange={(e) => setNewWebhookForm({ ...newWebhookForm, destination: e.target.value })}
                  placeholder="https://api.yourcompany.com/webhooks"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all text-xs"
                  required
                />
              </div>

              <p className="text-[10px] text-stone-400 font-bold leading-relaxed bg-stone-50 p-2.5 border border-stone-150 rounded-xl font-mono">
                Outbound payloads are signed with a unique Webhook Signing Secret (`whsec_...`) dispatched in the `X-Shana-Signature` header for cryptographically secure endpoint validation.
              </p>

              <div className="flex items-center gap-2 pt-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setNewWebhookOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl font-bold font-sans text-[11px] uppercase tracking-wide cursor-pointer"
                >
                  {dict.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-950 hover:bg-stone-900 text-white rounded-xl font-bold font-sans text-[11px] uppercase tracking-wide cursor-pointer"
                >
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Automation Workflow Modal */}
      {newWorkflowOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-3xl shadow-2xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="font-sans font-black text-sm text-stone-900 uppercase tracking-wide">
                {dict.createWorkflow}
              </h4>
              <button
                onClick={() => setNewWorkflowOpen(false)}
                className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-900 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="space-y-4 text-xs font-sans">
              
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">Workflow Name</label>
                <input
                  type="text"
                  value={newWorkflowForm.name}
                  onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, name: e.target.value })}
                  placeholder="e.g. Sync High Score Candidates"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">1. Trigger Event</label>
                <select
                  value={newWorkflowForm.trigger}
                  onChange={(e: any) => setNewWorkflowForm({ ...newWorkflowForm, trigger: e.target.value })}
                  className="w-full border border-stone-200 rounded-xl text-xs px-3.5 py-2 bg-white font-semibold font-sans focus:outline-none"
                >
                  <option value="interview.started">Interview Simulator Started</option>
                  <option value="interview.completed">Interview Simulator Completed</option>
                  <option value="subscription.updated">Subscription Tier Updated</option>
                  <option value="workspace.created">Enterprise Workspace Created</option>
                  <option value="user.updated">User Profile Registered</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">2. Evaluation Condition</label>
                <select
                  value={newWorkflowForm.condition}
                  onChange={(e: any) => setNewWorkflowForm({ ...newWorkflowForm, condition: e.target.value })}
                  className="w-full border border-stone-200 rounded-xl text-xs px-3.5 py-2 bg-white font-semibold font-sans focus:outline-none"
                >
                  <option value="always">Always run without filters</option>
                  <option value="score >= 80">Simulator final score is greater than 80%</option>
                  <option value="score >= 90">Simulator final score is greater than 90%</option>
                  <option value="role == candidate">Target User belongs to Candidate track</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">3. Outbound Target Action</label>
                <select
                  value={newWorkflowForm.action}
                  onChange={(e: any) => setNewWorkflowForm({ ...newWorkflowForm, action: e.target.value })}
                  className="w-full border border-stone-200 rounded-xl text-xs px-3.5 py-2 bg-white font-semibold font-sans focus:outline-none"
                >
                  <option value="Generate report & push ATS candidate">Generate report & push ATS candidate</option>
                  <option value="Send notification to Slack">Broadcast message to connected Slack</option>
                  <option value="Initialize default quotas & send welcome pack">Initialize organization quotas & welcome emails</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setNewWorkflowOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl font-bold font-sans text-[11px] uppercase tracking-wide cursor-pointer"
                >
                  {dict.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-950 hover:bg-stone-900 text-white rounded-xl font-bold font-sans text-[11px] uppercase tracking-wide cursor-pointer"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
