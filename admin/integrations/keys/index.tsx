import React, { useState, useEffect } from 'react';
import {
  Key,
  RefreshCw,
  Plus,
  Pause,
  Play,
  Trash,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Server,
  Activity,
  PlusCircle,
  Calendar,
  Layers,
  Settings,
  HelpCircle,
  Clock,
  Shield,
  Search,
  Filter,
  AlertTriangle,
  CreditCard
} from 'lucide-react';

interface KeysManagementProps {
  currentUser: {
    id: string;
    email: string;
    role: 'candidate' | 'admin' | 'super_admin';
    firstName: string;
    lastName: string;
  };
  lang?: 'FR' | 'EN';
}

export interface VaultKey {
  id: string;
  providerId: string;
  name: string;
  status: 'active' | 'paused' | 'expired' | 'revoked' | 'error';
  environment: 'development' | 'production';
  lastUpdated: string;
  isDeleted: boolean;
  version: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'rotate' | 'disable' | 'pause' | 'resume' | 'delete' | 'access';
  keyId: string;
  providerId: string;
  actor: string;
  details?: string;
}

export interface AdminAlert {
  id: string;
  timestamp: string;
  type: 'missing_key' | 'invalid_key' | 'expired_credentials' | 'failure';
  providerId: string;
  message: string;
  resolved: boolean;
}

export interface ProviderMetadata {
  id: string;
  name: string;
  category: 'payment' | 'ai' | 'email' | 'analytics' | 'sms' | 'other';
  description: string;
  keyPlaceholder: string;
}

export default function KeysManagement({ currentUser, lang = 'EN' }: KeysManagementProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';

  // State Management
  const [keys, setKeys] = useState<VaultKey[]>([]);
  const [providers, setProviders] = useState<ProviderMetadata[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState<'all' | 'development' | 'production'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | VaultKey['status']>('all');

  // Modals / Forms State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [selectedKeyForRotation, setSelectedKeyForRotation] = useState<VaultKey | null>(null);

  // Form Fields
  const [newKeyProviderId, setNewKeyProviderId] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRawValue, setNewKeyRawValue] = useState('');
  const [newKeyEnvironment, setNewKeyEnvironment] = useState<'development' | 'production'>('development');
  const [rotateRawValue, setRotateRawValue] = useState('');

  // Toast / Status Info
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Translations
  const t = {
    EN: {
      title: 'Secure Key Vault Management',
      subtitle: 'Centralized administration for external API credentials. All keys are encrypted at rest and never exposed client-side.',
      loading: 'Loading integration credentials...',
      alertsTitle: 'System Diagnostic Alerts',
      auditTitle: 'Key Vault Audit Activity',
      addBtn: 'Add Integration Key',
      provider: 'Provider',
      name: 'Key Label / Identifier',
      env: 'Environment',
      status: 'Status',
      version: 'Version',
      lastUpdated: 'Last updated',
      actions: 'Actions',
      noKeys: 'No keys configured in this environment.',
      rotate: 'Rotate Secret',
      pause: 'Pause',
      resume: 'Resume',
      disable: 'Revoke',
      delete: 'Soft Delete',
      searchPl: 'Search keys...',
      dev: 'Development',
      prod: 'Production',
      allEnvs: 'All Environments',
      allStatuses: 'All Statuses',
      active: 'Active',
      paused: 'Paused',
      expired: 'Expired',
      revoked: 'Revoked',
      errorState: 'Error',
      superAdminOnly: 'Super Admin clearance is required to rotate production secrets or perform deletions.',
      cancel: 'Cancel',
      save: 'Save Securely',
      addTitle: 'Register New Credentials',
      rotateTitle: 'Rotate Secret Value',
      confirmRotate: 'Rotate Key',
      keySecretLabel: 'Credential Key / Secret Token',
      successCreated: 'Key registered and encrypted successfully.',
      successRotated: 'Key rotated seamlessly without downtime.',
      successPaused: 'Key paused successfully.',
      successResumed: 'Key activated successfully.',
      successDeleted: 'Key archived/soft-deleted successfully.',
      placeholderSelect: 'Select a third-party provider...',
      auditTable: {
        time: 'Time',
        event: 'Event / Action',
        actor: 'Authorized Actor',
        details: 'Metadata / Trace'
      }
    },
    FR: {
      title: 'Gestion SÉCURISÉE du Key Vault',
      subtitle: 'Administration centralisée des clés d’API tierces. Toutes les clés sont cryptées au repos et inaccessibles au client.',
      loading: 'Chargement des identifiants d’intégration...',
      alertsTitle: 'Alertes de Diagnostics Système',
      auditTitle: 'Activité d’Audit du Key Vault',
      addBtn: 'Ajouter une Clé',
      provider: 'Fournisseur',
      name: 'Libellé de Clé',
      env: 'Environnement',
      status: 'Statut',
      version: 'Version',
      lastUpdated: 'Dernière mise à jour',
      actions: 'Actions',
      noKeys: 'Aucune clé configurée dans cet environnement.',
      rotate: 'Pivoter le Secret',
      pause: 'Suspendre',
      resume: 'Activer',
      disable: 'Révoquer',
      delete: 'Supprimer (soft)',
      searchPl: 'Rechercher des clés...',
      dev: 'Développement',
      prod: 'Production',
      allEnvs: 'Tous les Environnements',
      allStatuses: 'Tous les Statuts',
      active: 'Actif',
      paused: 'En pause',
      expired: 'Expiré',
      revoked: 'Révoqué',
      errorState: 'Erreur',
      superAdminOnly: 'Les droits de Super Administrateur sont requis pour modifier les clés de production ou supprimer.',
      cancel: 'Annuler',
      save: 'Sauvegarder Securisé',
      addTitle: 'Enregistrer de Nouveaux Identifiants',
      rotateTitle: 'Rotation du Jeton Secret',
      confirmRotate: 'Pivoter la Clé',
      keySecretLabel: 'Valeur Secrète du Jeton',
      successCreated: 'Clé enregistrée et chiffrée avec succès.',
      successRotated: 'Clé pivotée sans aucune interruption de service.',
      successPaused: 'Clé suspendue avec succès.',
      successResumed: 'Clé activée avec succès.',
      successDeleted: 'Clé archivée avec succès.',
      placeholderSelect: 'Sélectionner un fournisseur...',
      auditTable: {
        time: 'Horodatage',
        event: 'Événement',
        actor: 'Acteur Autorisé',
        details: 'Détails / Trace'
      }
    }
  }[lang];

  // Fetch Data on mount
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/integrations/keys');
      const data = await res.json();
      if (res.ok) {
        setKeys(data.keys || []);
        setAuditLogs(data.auditLogs || []);
        setAlerts(data.alerts || []);
        setProviders(data.providers || []);
      } else {
        setError(data.error || 'Failed to fetch vault configurations.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while contacting key vault.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (msg: string, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  // Add Key Action
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyProviderId || !newKeyName || !newKeyRawValue) {
      triggerToast('Please fill in all required fields.', true);
      return;
    }

    if (newKeyEnvironment === 'production' && !isSuperAdmin) {
      triggerToast(t.superAdminOnly, true);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/integrations/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: newKeyProviderId,
          name: newKeyName,
          rawValue: newKeyRawValue,
          environment: newKeyEnvironment
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast(t.successCreated);
        setShowAddModal(false);
        // Clear fields
        setNewKeyProviderId('');
        setNewKeyName('');
        setNewKeyRawValue('');
        fetchData();
      } else {
        triggerToast(data.error || 'Failed to register key.', true);
      }
    } catch (err: any) {
      triggerToast(err.message || 'API connection failed.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rotate Key Action
  const handleRotateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeyForRotation || !rotateRawValue) {
      triggerToast('Secret value is required for rotation.', true);
      return;
    }

    if (selectedKeyForRotation.environment === 'production' && !isSuperAdmin) {
      triggerToast(t.superAdminOnly, true);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/admin/integrations/keys/${selectedKeyForRotation.id}/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawValue: rotateRawValue })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast(t.successRotated);
        setShowRotateModal(false);
        setRotateRawValue('');
        setSelectedKeyForRotation(null);
        fetchData();
      } else {
        triggerToast(data.error || 'Rotation failed.', true);
      }
    } catch (err: any) {
      triggerToast(err.message || 'API connection failed.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Pause/Resume
  const handleTogglePause = async (key: VaultKey) => {
    const action = key.status === 'paused' ? 'resume' : 'pause';
    try {
      const res = await fetch(`/api/admin/integrations/keys/${key.id}/${action}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(action === 'resume' ? t.successResumed : t.successPaused);
        fetchData();
      } else {
        triggerToast(data.error || 'Operation failed.', true);
      }
    } catch (err: any) {
      triggerToast(err.message || 'API connection failed.', true);
    }
  };

  // Revoke Key Action
  const handleDisableKey = async (key: VaultKey) => {
    try {
      const res = await fetch(`/api/admin/integrations/keys/${key.id}/disable`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(t.disable);
        fetchData();
      } else {
        triggerToast(data.error || 'Operation failed.', true);
      }
    } catch (err: any) {
      triggerToast(err.message || 'API connection failed.', true);
    }
  };

  // Delete Key Action
  const handleDeleteKey = async (key: VaultKey) => {
    if (!isSuperAdmin) {
      triggerToast(t.superAdminOnly, true);
      return;
    }

    if (!window.confirm(lang === 'FR' ? 'Êtes-vous sûr de vouloir supprimer définitivement cette clé de l\'écosystème ?' : 'Are you sure you want to soft delete this key?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/integrations/keys/${key.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(t.successDeleted);
        fetchData();
      } else {
        triggerToast(data.error || 'Failed to soft delete.', true);
      }
    } catch (err: any) {
      triggerToast(err.message || 'API connection failed.', true);
    }
  };

  // Helper colors
  const getStatusBadge = (status: VaultKey['status']) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          {t.active}
        </span>;
      case 'paused':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {t.paused}
        </span>;
      case 'revoked':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          {t.revoked}
        </span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
          {status}
        </span>;
    }
  };

  const getEnvBadge = (env: VaultKey['environment']) => {
    if (env === 'production') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
        Prod
      </span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide">
      Dev
    </span>;
  };

  // Filtering
  const filteredKeys = keys.filter(k => {
    const matchesSearch = k.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          k.providerId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = envFilter === 'all' || k.environment === envFilter;
    const matchesStatus = statusFilter === 'all' || k.status === statusFilter;
    return matchesSearch && matchesEnv && matchesStatus;
  });

  const activeStripeKeys = keys.filter(k => k.providerId === 'stripe' && k.status === 'active');
  const isStripeConnected = activeStripeKeys.length > 0;

  const stripeStatusText = {
    EN: {
      title: 'Stripe Gateway Status',
      connected: 'Connected',
      missing: 'Configuration Missing',
      connectedDesc: 'The Stripe payment gateway is active. Real-time client subscription upgrades are operational.',
      missingDesc: 'Stripe key is missing or disabled in the vault. Payments will fall back to simulated credentials.',
      registerKey: 'Register Stripe Key',
      activeKeys: 'Active Keys',
    },
    FR: {
      title: 'Statut de la Passerelle Stripe',
      connected: 'Connecté',
      missing: 'Configuration Manquante',
      connectedDesc: "La passerelle de paiement Stripe est active. Les mises à niveau d'abonnement des candidats en temps réel sont opérationnelles.",
      missingDesc: "Clé Stripe manquante ou désactivée dans le coffre. Les paiements utiliseront des identifiants simulés par défaut.",
      registerKey: 'Enregistrer une clé Stripe',
      activeKeys: 'Clés Actives',
    }
  }[lang === 'FR' ? 'FR' : 'EN'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-stone-500 font-mono">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="key-vault-root-container">
      {/* Header Panel */}
      <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-600">
              <Key className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-stone-950 font-sans tracking-tight">{t.title}</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed max-w-2xl font-semibold">
            {t.subtitle}
          </p>
        </div>

        <div>
          <button
            type="button"
            id="add-key-vault-btn"
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addBtn}</span>
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {actionSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-green-800 leading-relaxed">{actionSuccess}</p>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-red-800 leading-relaxed">{actionError}</p>
        </div>
      )}

      {/* Dynamic Diagnostic Alerts Row */}
      {alerts.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5" id="admin-alerts-vault-panel">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>{t.alertsTitle}</span>
          </h3>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className="bg-white border border-amber-100 rounded-xl p-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <span className="p-1.5 bg-amber-50 rounded-lg text-amber-600 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 font-sans uppercase tracking-wide">{a.providerId} Integration</h4>
                    <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed font-semibold">{a.message}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-stone-400 font-bold">
                  {new Date(a.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stripe Gateway Connection Status Widget */}
      <div 
        className={`border rounded-2xl p-5 shadow-xs transition-all ${
          isStripeConnected 
            ? 'bg-emerald-50/20 border-emerald-150' 
            : 'bg-amber-50/20 border-amber-200/50'
        }`}
        id="stripe-gateway-status-panel"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className={`p-2.5 rounded-xl border shrink-0 ${
              isStripeConnected 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}>
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-950 font-sans tracking-tight">
                  {stripeStatusText.title}
                </h3>
                {isStripeConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {stripeStatusText.connected}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {stripeStatusText.missing}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 font-semibold mt-1 max-w-2xl leading-relaxed">
                {isStripeConnected ? stripeStatusText.connectedDesc : stripeStatusText.missingDesc}
              </p>
            </div>
          </div>

          {!isStripeConnected && (
            <div className="shrink-0">
              <button
                type="button"
                id="stripe-register-action-btn"
                onClick={() => {
                  setNewKeyProviderId('stripe');
                  setNewKeyName('Stripe Secret Key');
                  setShowAddModal(true);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{stripeStatusText.registerKey}</span>
              </button>
            </div>
          )}
        </div>

        {isStripeConnected && (
          <div className="mt-4 pt-4 border-t border-emerald-100/60 flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-mono">
              {stripeStatusText.activeKeys}:
            </span>
            {activeStripeKeys.map(k => (
              <span 
                key={k.id} 
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100/50 text-emerald-850 text-[10px] font-mono font-bold border border-emerald-200/50"
              >
                {k.name} ({k.environment === 'production' ? 'Prod' : 'Dev'})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Primary Key Grid & Filters */}
      <div className="bg-white border border-stone-100 rounded-2xl shadow-xs overflow-hidden">
        {/* Filters bar */}
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row gap-3 bg-stone-50/50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t.searchPl}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={envFilter}
              onChange={e => setEnvFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
            >
              <option value="all">{t.allEnvs}</option>
              <option value="development">{t.dev}</option>
              <option value="production">{t.prod}</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="active">{t.active}</option>
              <option value="paused">{t.paused}</option>
              <option value="revoked">{t.revoked}</option>
            </select>
          </div>
        </div>

        {/* Keys Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-[11px] font-bold text-stone-500 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">{t.provider}</th>
                <th className="py-3 px-4">{t.name}</th>
                <th className="py-3 px-4">{t.env}</th>
                <th className="py-3 px-4">{t.status}</th>
                <th className="py-3 px-4">{t.version}</th>
                <th className="py-3 px-4">{t.lastUpdated}</th>
                <th className="py-3 px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs font-semibold text-stone-400">
                    {t.noKeys}
                  </td>
                </tr>
              ) : (
                filteredKeys.map(k => {
                  const prov = providers.find(p => p.id === k.providerId);
                  return (
                    <tr key={k.id} className="hover:bg-stone-50/40 transition-colors text-xs font-semibold text-stone-700">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-stone-100 rounded-lg text-stone-600 border border-stone-200/50">
                            {k.providerId === 'stripe' ? (
                              <Server className="w-3.5 h-3.5 text-indigo-500" />
                            ) : k.providerId === 'openai' ? (
                              <Activity className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Key className="w-3.5 h-3.5 text-stone-500" />
                            )}
                          </span>
                          <div>
                            <p className="font-bold text-stone-900 font-sans capitalize">{k.providerId}</p>
                            <p className="text-[10px] text-stone-400 font-semibold">{prov?.category || 'API'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-stone-900">
                        {k.name}
                      </td>
                      <td className="py-3.5 px-4">
                        {getEnvBadge(k.environment)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(k.status)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px]">
                        v{k.version}
                      </td>
                      <td className="py-3.5 px-4 text-[10px] text-stone-500 font-mono">
                        {new Date(k.lastUpdated).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pause / Resume Button */}
                          <button
                            type="button"
                            title={k.status === 'paused' ? t.resume : t.pause}
                            onClick={() => handleTogglePause(k)}
                            className="p-1.5 hover:bg-stone-100 text-stone-600 rounded-lg transition-colors cursor-pointer"
                          >
                            {k.status === 'paused' ? (
                              <Play className="w-3.5 h-3.5" />
                            ) : (
                              <Pause className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Rotate button */}
                          <button
                            type="button"
                            title={t.rotate}
                            onClick={() => {
                              setSelectedKeyForRotation(k);
                              setShowRotateModal(true);
                            }}
                            className="p-1.5 hover:bg-stone-100 text-stone-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Soft Delete */}
                          <button
                            type="button"
                            title={t.delete}
                            disabled={k.environment === 'production' && !isSuperAdmin}
                            onClick={() => handleDeleteKey(k)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:text-stone-300 cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
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

      {/* Audit Logs activities timeline */}
      <div className="bg-white border border-stone-100 rounded-2xl shadow-xs p-6" id="audit-activities-vault-panel">
        <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-indigo-500" />
          <span>{t.auditTitle}</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">
                <th className="py-2.5 px-3">{t.auditTable.time}</th>
                <th className="py-2.5 px-3">{t.auditTable.event}</th>
                <th className="py-2.5 px-3">{t.auditTable.actor}</th>
                <th className="py-2.5 px-3">{t.auditTable.details}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-600">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-400 italic">
                    No active integration activities audit log recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.slice(0, 15).map(l => (
                  <tr key={l.id} className="hover:bg-stone-50/30">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-stone-400">
                      {new Date(l.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        l.action === 'create' ? 'bg-green-50 text-green-700' :
                        l.action === 'rotate' ? 'bg-sky-50 text-sky-700' :
                        l.action === 'pause' ? 'bg-amber-50 text-amber-700' :
                        l.action === 'delete' ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-stone-900">
                      {l.actor}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-stone-500">
                      {l.details || `Key ID: ${l.keyId} (${l.providerId})`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD KEY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-stone-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h2 className="text-sm font-bold text-stone-950 font-sans flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <span>{t.addTitle}</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKey} className="space-y-4">
              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">{t.provider}</label>
                <select
                  required
                  value={newKeyProviderId}
                  onChange={e => {
                    setNewKeyProviderId(e.target.value);
                    // Autofill label suggestion
                    const selected = providers.find(p => p.id === e.target.value);
                    if (selected) {
                      setNewKeyName(`${selected.name} credentials`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800"
                >
                  <option value="">{t.placeholderSelect}</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Label Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">{t.name}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenAI Primary Production API"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-800"
                />
              </div>

              {/* Raw Value */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">{t.keySecretLabel}</label>
                <input
                  type="password"
                  required
                  placeholder={
                    providers.find(p => p.id === newKeyProviderId)?.keyPlaceholder || 'Paste secret key...'
                  }
                  value={newKeyRawValue}
                  onChange={e => setNewKeyRawValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-800"
                />
              </div>

              {/* Environment Choice */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">{t.env}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="env"
                      checked={newKeyEnvironment === 'development'}
                      onChange={() => setNewKeyEnvironment('development')}
                      className="accent-indigo-600"
                    />
                    <span>{t.dev} (Sandbox)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="env"
                      disabled={!isSuperAdmin}
                      checked={newKeyEnvironment === 'production'}
                      onChange={() => setNewKeyEnvironment('production')}
                      className="accent-indigo-600 disabled:opacity-50"
                    />
                    <span className={!isSuperAdmin ? 'text-stone-400 font-semibold flex items-center gap-1' : ''}>
                      {t.prod}
                      {!isSuperAdmin && <Shield className="w-3 h-3" />}
                    </span>
                  </label>
                </div>
              </div>

              {newKeyEnvironment === 'production' && !isSuperAdmin && (
                <p className="text-[10px] font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                  ⚠️ {t.superAdminOnly}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (newKeyEnvironment === 'production' && !isSuperAdmin)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-100 disabled:text-stone-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Shield className="w-3.5 h-3.5" />
                  )}
                  <span>{t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROTATE KEY MODAL */}
      {showRotateModal && selectedKeyForRotation && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-stone-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h2 className="text-sm font-bold text-stone-950 font-sans flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>{t.rotateTitle}</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowRotateModal(false);
                  setSelectedKeyForRotation(null);
                }}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider font-mono">
                Target: {selectedKeyForRotation.providerId.toUpperCase()} ({selectedKeyForRotation.name})
              </p>
              <p className="text-[11px] text-indigo-700 mt-1 leading-relaxed font-semibold">
                Rotation will immediately swap the key value in the vault. Features relying on {selectedKeyForRotation.providerId} will transition seamlessly with no downtime.
              </p>
            </div>

            <form onSubmit={handleRotateKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">{t.keySecretLabel}</label>
                <input
                  type="password"
                  required
                  placeholder={
                    providers.find(p => p.id === selectedKeyForRotation.providerId)?.keyPlaceholder || 'Paste new secret...'
                  }
                  value={rotateRawValue}
                  onChange={e => setRotateRawValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-800"
                />
              </div>

              {selectedKeyForRotation.environment === 'production' && !isSuperAdmin && (
                <p className="text-[10px] font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                  ⚠️ {t.superAdminOnly}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowRotateModal(false);
                    setSelectedKeyForRotation(null);
                  }}
                  className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (selectedKeyForRotation.environment === 'production' && !isSuperAdmin)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-100 disabled:text-stone-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>{t.confirmRotate}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
