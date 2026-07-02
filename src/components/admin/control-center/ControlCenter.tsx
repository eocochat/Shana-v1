import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Layers, 
  Settings, 
  Activity, 
  FileLock, 
  RefreshCw, 
  Sliders, 
  FlaskConical,
  Plus,
  Trash2,
  Users,
  TrendingUp,
  Percent,
  Globe2, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Timer, 
  Check, 
  RotateCcw, 
  Edit3, 
  Eye, 
  FileText, 
  Tv, 
  AlertOctagon, 
  UserCheck, 
  History, 
  Send,
  HelpCircle,
  Video,
  Mic,
  ShieldCheck,
  Languages,
  ChevronRight,
  Cloud,
  Server,
  Database,
  Network,
  Gauge,
  Terminal,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Zap,
  HardDrive
} from 'lucide-react';
import { User } from '../../../types';
import { 
  PlatformController, 
  FeatureManager, 
  ConfigurationService, 
  EnvironmentManager 
} from '../../../services/platform';
import { 
  PlatformConfig, 
  ConfigHistoryEntry, 
  AIProvider, 
  ResponseMode, 
  AIDifficulty, 
  LanguageAvailability, 
  DefaultLanguage, 
  PausePolicy,
  FeatureFlags,
  DEFAULT_PLATFORM_CONFIG
} from '../../../modules/admin-config';
import { AccessController } from '../../../services/admin';

interface ControlCenterProps {
  currentUser: User;
  lang?: 'FR' | 'EN';
}

type ControlTab = 'overview' | 'features' | 'ai' | 'interview' | 'content' | 'maintenance' | 'history' | 'deployment' | 'experimentation';

export default function ControlCenter({ currentUser, lang = 'FR' }: ControlCenterProps) {
  const [activeTab, setActiveTab] = useState<ControlTab>('overview');
  const [telemetry, setTelemetry] = useState(EnvironmentManager.getStats());
  const [draftConfig, setDraftConfig] = useState<PlatformConfig>(PlatformController.getDraftConfig());
  const [activeConfig, setActiveConfig] = useState<PlatformConfig>(ConfigurationService.getActiveConfig());
  const [history, setHistory] = useState<ConfigHistoryEntry[]>(PlatformController.getHistory());
  
  // Publish flow UI states: 'edit' | 'preview' | 'validate' | 'publish'
  const [publishStep, setPublishStep] = useState<'edit' | 'preview' | 'validate'>('edit');
  const [publishComment, setPublishComment] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Preview Lang State for Content Management
  const [previewLang, setPreviewLang] = useState<'FR' | 'EN'>('FR');

  // --- DEPLOYMENT & SCALING STATES (PHASE 18) ---
  const [deployDashboard, setDeployDashboard] = useState<any>(null);
  const [deployLoading, setDeployLoading] = useState(false);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [activePipelineTask, setActivePipelineTask] = useState<any>(null);
  
  // Pipeline submission inputs
  const [deployEnv, setDeployEnv] = useState<'development' | 'staging' | 'production'>('staging');
  const [deployStrategy, setDeployStrategy] = useState<'blue-green' | 'rolling'>('blue-green');
  const [deployVersion, setDeployVersion] = useState('1.18.0');
  const [deployCommit, setDeployCommit] = useState('c7b8a9d');
  const [deploySchema, setDeploySchema] = useState('v42');
  const [deployPrompt, setDeployPrompt] = useState('q_v1.3_eval_v2.0');
  const [deployFlags, setDeployFlags] = useState<Record<string, boolean>>({
    enableVoiceNaturalizer: true,
    enableAdaptiveScoring: true,
    enableAIExtendedInsights: true
  });

  // DB Migration inputs
  const [migrationName, setMigrationName] = useState('');
  const [migrationCompatible, setMigrationCompatible] = useState(true);

  // Auto-scaling inputs
  const [scalingCPU, setScalingCPU] = useState(75);
  const [scalingMemory, setScalingMemory] = useState(80);
  const [scalingLatency, setScalingLatency] = useState(200);
  const [scalingMinNodes, setScalingMinNodes] = useState(2);
  const [scalingMaxNodes, setScalingMaxNodes] = useState(10);
  const [scalingEnabled, setScalingEnabled] = useState(true);

  // --- FEATURE FLAGS & EXPERIMENTATION STATES (PHASE 19) ---
  const [prodFlags, setProdFlags] = useState<any[]>([]);
  const [prodFlagsLoading, setProdFlagsLoading] = useState(false);
  const [experimentSummary, setExperimentSummary] = useState<any>(null);
  const [experimentSummaryLoading, setExperimentSummaryLoading] = useState(false);
  const [rollbackLogs, setRollbackLogs] = useState<any[]>([]);
  const [selectedFlagIdForExperiment, setSelectedFlagIdForExperiment] = useState<string>('');
  
  // Create / Edit modal states
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<any>(null); // null means "Create mode"
  
  // Flag form states
  const [formFlagId, setFormFlagId] = useState('');
  const [formFlagDesc, setFormFlagDesc] = useState('');
  const [formFlagStatus, setFormFlagStatus] = useState<'ON' | 'OFF' | 'CONTROLLED'>('CONTROLLED');
  const [formFlagEnv, setFormFlagEnv] = useState<'development' | 'staging' | 'production' | 'all'>('all');
  const [formFlagRollout, setFormFlagRollout] = useState(0);
  const [formFlagUsers, setFormFlagUsers] = useState(''); // comma-separated
  const [formFlagVersion, setFormFlagVersion] = useState('1.0.0');
  const [formFlagIsExperiment, setFormFlagIsExperiment] = useState(false);
  
  // A/B configs state
  const [formGroupAConfig, setFormGroupAConfig] = useState('{\n  "promptVersion": "eval_v2.0_resonance",\n  "modelName": "gemini-1.5-flash"\n}');
  const [formGroupBConfig, setFormGroupBConfig] = useState('{\n  "promptVersion": "eval_v2.1_behavioral",\n  "modelName": "gemini-2.5-flash"\n}');
  const [formControlConfig, setFormControlConfig] = useState('{\n  "promptVersion": "eval_legacy_baseline",\n  "modelName": "gemini-1.5-flash"\n}');
  const [formMetricKeys, setFormMetricKeys] = useState('ips_improvement, interview_completed, latency_ms, user_satisfaction');

  // Rollback with mandatory reason state
  const [isRollbackReasonModalOpen, setIsRollbackReasonModalOpen] = useState(false);
  const [rollbackFlagId, setRollbackFlagId] = useState('');
  const [rollbackReasonText, setRollbackReasonText] = useState('');

  const fetchProdFlags = async () => {
    setProdFlagsLoading(true);
    try {
      const res = await fetch('/api/admin/experimentation/flags');
      const body = await res.json();
      if (res.ok && body && body.success) {
        setProdFlags(body.data);
        const firstExperiment = body.data.find((f: any) => f.isExperiment);
        if (firstExperiment && !selectedFlagIdForExperiment) {
          setSelectedFlagIdForExperiment(firstExperiment.id);
          fetchExperimentSummary(firstExperiment.id);
        }
      }
    } catch (err: any) {
      console.error("Failed fetching feature flags:", err);
    } finally {
      setProdFlagsLoading(false);
    }
  };

  const fetchRollbackLogs = async () => {
    try {
      const res = await fetch('/api/admin/experimentation/rollbacks');
      const body = await res.json();
      if (res.ok && body && body.success) {
        setRollbackLogs(body.data);
      }
    } catch (err: any) {
      console.error("Failed fetching rollback logs:", err);
    }
  };

  const fetchExperimentSummary = async (flagId: string) => {
    if (!flagId) return;
    setExperimentSummaryLoading(true);
    try {
      const res = await fetch(`/api/admin/experimentation/summary/${flagId}`);
      const body = await res.json();
      if (res.ok && body && body.success) {
        setExperimentSummary(body.data);
      } else {
        setExperimentSummary(null);
      }
    } catch (err: any) {
      console.error("Failed fetching experiment summary:", err);
      setExperimentSummary(null);
    } finally {
      setExperimentSummaryLoading(false);
    }
  };

  const handleSaveFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFlagId.trim()) {
      setErrorMessage(lang === 'FR' ? "L'identifiant du flag est obligatoire." : "Flag identifier is required.");
      return;
    }

    let parsedGroupA = {};
    let parsedGroupB = {};
    let parsedControl = {};
    try {
      if (formFlagIsExperiment) {
        parsedGroupA = JSON.parse(formGroupAConfig);
        parsedGroupB = JSON.parse(formGroupBConfig);
        parsedControl = JSON.parse(formControlConfig);
      }
    } catch (err: any) {
      setErrorMessage(lang === 'FR' ? `JSON d'A/B Config invalide : ${err.message}` : `Invalid A/B Config JSON: ${err.message}`);
      return;
    }

    const payload = {
      id: formFlagId.trim().toLowerCase().replace(/\s+/g, '_'),
      feature_name: formFlagId.trim().toLowerCase().replace(/\s+/g, '_'),
      description: formFlagDesc,
      status: formFlagStatus,
      target_users: formFlagUsers.split(',').map(u => u.trim()).filter(Boolean),
      rollout_percentage: Number(formFlagRollout),
      environment: formFlagEnv,
      version: formFlagVersion,
      isExperiment: formFlagIsExperiment,
      experimentConfig: formFlagIsExperiment ? {
        groupAConfig: parsedGroupA,
        groupBConfig: parsedGroupB,
        controlConfig: parsedControl,
        metricKeys: formMetricKeys.split(',').map(k => k.trim()).filter(Boolean)
      } : undefined
    };

    try {
      const res = await fetch('/api/admin/experimentation/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setSuccessMessage(lang === 'FR' ? "Drapeau enregistré avec succès !" : "Feature flag successfully persisted!");
        setIsFlagModalOpen(false);
        fetchProdFlags();
        fetchRollbackLogs();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(body.error || 'Failed to save feature flag');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleToggleProdFlagStatus = async (flagId: string, currentStatus: 'ON' | 'OFF' | 'CONTROLLED', nextStatus: 'ON' | 'OFF' | 'CONTROLLED') => {
    if (nextStatus === 'OFF') {
      setRollbackFlagId(flagId);
      setRollbackReasonText('');
      setIsRollbackReasonModalOpen(true);
    } else {
      try {
        const res = await fetch(`/api/admin/experimentation/flags/${flagId}/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus, rollbackReason: '' })
        });
        const body = await res.json();
        if (res.ok && body && body.success) {
          setSuccessMessage(lang === 'FR' ? "Statut du drapeau mis à jour !" : "Feature flag status updated!");
          fetchProdFlags();
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setErrorMessage(body.error || 'Failed to toggle status');
        }
      } catch (err: any) {
        setErrorMessage(err.message);
      }
    }
  };

  const handleRollbackSubmit = async () => {
    if (!rollbackReasonText.trim()) {
      alert(lang === 'FR' ? "Raison obligatoire pour la désactivation." : "Describing rollback reason is mandatory.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/experimentation/flags/${rollbackFlagId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OFF', rollbackReason: rollbackReasonText })
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setSuccessMessage(lang === 'FR' ? `Flag '${rollbackFlagId}' désactivé instantanément.` : `Flag '${rollbackFlagId}' instantly rolled back to OFF.`);
        setIsRollbackReasonModalOpen(false);
        fetchProdFlags();
        fetchRollbackLogs();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(body.error || 'Failed to execute rollback');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteProdFlag = async (flagId: string) => {
    if (!window.confirm(lang === 'FR' ? `Êtes-vous sûr de vouloir supprimer définitivement le flag ${flagId} ?` : `Are you sure you want to permanently delete flag ${flagId}?`)) return;
    try {
      const res = await fetch(`/api/admin/experimentation/flags/${flagId}`, {
        method: 'DELETE'
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setSuccessMessage(lang === 'FR' ? "Flag supprimé." : "Feature flag deleted.");
        fetchProdFlags();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(body.error || 'Failed to delete flag');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const openEditFlagModal = (flag: any) => {
    setEditingFlag(flag);
    setFormFlagId(flag.id);
    setFormFlagDesc(flag.description || '');
    setFormFlagStatus(flag.status);
    setFormFlagEnv(flag.environment || 'all');
    setFormFlagRollout(flag.rollout_percentage);
    setFormFlagUsers(flag.target_users ? flag.target_users.join(', ') : '');
    setFormFlagVersion(flag.version || '1.0.0');
    setFormFlagIsExperiment(flag.isExperiment || false);

    if (flag.isExperiment && flag.experimentConfig) {
      setFormGroupAConfig(JSON.stringify(flag.experimentConfig.groupAConfig, null, 2));
      setFormGroupBConfig(JSON.stringify(flag.experimentConfig.groupBConfig, null, 2));
      setFormControlConfig(JSON.stringify(flag.experimentConfig.controlConfig, null, 2));
      setFormMetricKeys(flag.experimentConfig.metricKeys ? flag.experimentConfig.metricKeys.join(', ') : '');
    } else {
      setFormGroupAConfig('{\n  "promptVersion": "eval_v2.0_resonance",\n  "modelName": "gemini-1.5-flash"\n}');
      setFormGroupBConfig('{\n  "promptVersion": "eval_v2.1_behavioral",\n  "modelName": "gemini-2.5-flash"\n}');
      setFormControlConfig('{\n  "promptVersion": "eval_legacy_baseline",\n  "modelName": "gemini-1.5-flash"\n}');
      setFormMetricKeys('ips_improvement, interview_completed, latency_ms, user_satisfaction');
    }
    setIsFlagModalOpen(true);
  };

  const openCreateFlagModal = () => {
    setEditingFlag(null);
    setFormFlagId('');
    setFormFlagDesc('');
    setFormFlagStatus('CONTROLLED');
    setFormFlagEnv('all');
    setFormFlagRollout(0);
    setFormFlagUsers('');
    setFormFlagVersion('1.0.0');
    setFormFlagIsExperiment(false);
    setFormGroupAConfig('{\n  "promptVersion": "eval_v2.0_resonance",\n  "modelName": "gemini-1.5-flash"\n}');
    setFormGroupBConfig('{\n  "promptVersion": "eval_v2.1_behavioral",\n  "modelName": "gemini-2.5-flash"\n}');
    setFormControlConfig('{\n  "promptVersion": "eval_legacy_baseline",\n  "modelName": "gemini-1.5-flash"\n}');
    setFormMetricKeys('ips_improvement, interview_completed, latency_ms, user_satisfaction');
    setIsFlagModalOpen(true);
  };

  const fetchDeployDashboard = async () => {
    setDeployLoading(true);
    try {
      const res = await fetch('/api/admin/deployment/dashboard');
      const body = await res.json();
      if (res.ok && body && body.success) {
        setDeployDashboard(body.data);
        // Sync scaling values on load
        if (body.data.autoScalingConfig) {
          setScalingCPU(body.data.autoScalingConfig.cpuScaleUpPct);
          setScalingMemory(body.data.autoScalingConfig.memoryScaleUpPct);
          setScalingLatency(body.data.autoScalingConfig.latencyScaleUpMs);
          setScalingMinNodes(body.data.autoScalingConfig.minNodes);
          setScalingMaxNodes(body.data.autoScalingConfig.maxNodes);
          setScalingEnabled(body.data.autoScalingConfig.autoScalingEnabled);
        }
      }
    } catch (err: any) {
      console.error("Failed fetching deployment dashboard:", err);
    } finally {
      setDeployLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'deployment') {
      fetchDeployDashboard();
    }
    if (activeTab === 'experimentation') {
      fetchProdFlags();
      fetchRollbackLogs();
    }
  }, [activeTab]);

  // Periodic refresh when deployment tab is active
  useEffect(() => {
    let timer: any = null;
    if (activeTab === 'deployment') {
      timer = setInterval(() => {
        fetch('/api/admin/deployment/dashboard')
          .then(res => res.json())
          .then(body => {
            if (body && body.success) {
              setDeployDashboard(body.data);
              if (body.data.currentTask) {
                setActivePipelineTask(body.data.currentTask);
                setPipelineRunning(true);
              } else if (pipelineRunning) {
                setPipelineRunning(false);
                setSuccessMessage(lang === 'FR' ? "Déploiement terminé avec succès !" : "Deployment completed successfully!");
                setActivePipelineTask(null);
                setTimeout(() => setSuccessMessage(''), 4000);
              }
            }
          })
          .catch(err => console.error("Auto refresh deploy error:", err));
      }, 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeTab, pipelineRunning]);

  const handlePurgeCache = async (cacheName: string) => {
    try {
      const res = await fetch('/api/admin/deployment/purge-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cacheName })
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setSuccessMessage(lang === 'FR' ? `Cache '${cacheName}' purgé avec succès !` : `Cache layer '${cacheName}' purged!`);
        fetchDeployDashboard();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(body.error || 'Failed to purge cache');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleUpdateAutoscaling = async () => {
    try {
      const res = await fetch('/api/admin/deployment/update-autoscaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpuScaleUpPct: scalingCPU,
          memoryScaleUpPct: scalingMemory,
          latencyScaleUpMs: scalingLatency,
          minNodes: scalingMinNodes,
          maxNodes: scalingMaxNodes,
          autoScalingEnabled: scalingEnabled
        })
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setSuccessMessage(lang === 'FR' ? "Configuration d'Auto-scaling mise à jour !" : "Auto-scaling parameters successfully persisted!");
        fetchDeployDashboard();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(body.error || 'Failed to update scaling parameters');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleTriggerFailover = async (env: string, active: boolean) => {
    try {
      const res = await fetch('/api/admin/deployment/failover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: env, active })
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setSuccessMessage(lang === 'FR' ? `État de failover mis à jour pour ${env}` : `Failover routing state updated for ${env}`);
        fetchDeployDashboard();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(body.error || 'Failed to trigger failover');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleApplyMigration = async () => {
    if (!migrationName.trim()) return;
    try {
      const res = await fetch('/api/admin/deployment/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: migrationName, isBackwardCompatible: migrationCompatible })
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setSuccessMessage(lang === 'FR' ? `Migration '${migrationName}' appliquée en direct !` : `Migration '${migrationName}' hot-applied!`);
        setMigrationName('');
        fetchDeployDashboard();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(body.error || 'Failed to apply migration');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleRollbackMigration = async (migrationId: string) => {
    if (!window.confirm(lang === 'FR' ? `Êtes-vous sûr de vouloir annuler la migration ${migrationId} ?` : `Are you sure you want to rollback migration ${migrationId}?`)) return;
    try {
      const res = await fetch('/api/admin/deployment/rollback-migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ migrationId })
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setSuccessMessage(lang === 'FR' ? "Migration annulée avec succès !" : "Migration successfully rolled back!");
        fetchDeployDashboard();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(body.error || 'Failed to rollback migration');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleCreateBackup = async (type: 'incremental' | 'full') => {
    try {
      const res = await fetch('/api/admin/deployment/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setSuccessMessage(lang === 'FR' ? "Instantané PITR généré avec succès !" : "PITR Database Snapshot successfully completed!");
        fetchDeployDashboard();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(body.error || 'Backup creation failed');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleRestoreBackup = async (snapshotId: string) => {
    if (!window.confirm(lang === 'FR' ? `ATTENTION: Vous allez écraser la base de données avec l'instantané ${snapshotId}. Continuer ?` : `CRITICAL WARNING: This will restore snapshot ${snapshotId}, overwriting current database states. Proceed?`)) return;
    try {
      const res = await fetch('/api/admin/deployment/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId })
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setSuccessMessage(lang === 'FR' ? "Restauration PITR initiée. La base est en cours de récupération." : "PITR Disaster Recovery initiated. Database is rebuilding.");
        fetchDeployDashboard();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(body.error || 'Failed to restore snapshot');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleRollbackRelease = async (env: string, targetVersion: string) => {
    if (!window.confirm(lang === 'FR' ? `Déclencher un rollback immédiat de ${env} vers la version ${targetVersion} ?` : `Trigger instant rollback of ${env} to version ${targetVersion}?`)) return;
    try {
      const res = await fetch('/api/admin/deployment/rollback-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: env, targetVersion })
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setSuccessMessage(lang === 'FR' ? `Rollback initié ! ${env} revient vers la version ${targetVersion}` : `Rollback initiated! ${env} is reverting to version ${targetVersion}`);
        fetchDeployDashboard();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(body.error || 'Rollback action failed');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleInitiateDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setPipelineRunning(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/admin/deployment/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: deployEnv,
          strategy: deployStrategy,
          version: deployVersion,
          commitHash: deployCommit,
          schemaVersion: deploySchema,
          promptVersion: deployPrompt,
          featureFlagsSnapshot: deployFlags
        })
      });
      const body = await res.json();
      if (res.ok && body && body.success) {
        setActivePipelineTask(body.data);
        setSuccessMessage(lang === 'FR' ? "Pipeline de déploiement démarré !" : "Automated deployment pipeline initiated!");
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setPipelineRunning(false);
        setErrorMessage(body.error || 'Failed to start pipeline');
      }
    } catch (err: any) {
      setPipelineRunning(false);
      setErrorMessage(err.message);
    }
  };

  const isSuperAdmin = AccessController.hasRole(currentUser.role, 'super_admin');

  // Load telemetry & configs
  const reloadAll = () => {
    setTelemetry(EnvironmentManager.getStats());
    const draft = PlatformController.getDraftConfig();
    setDraftConfig(draft);
    setActiveConfig(ConfigurationService.getActiveConfig());
    setHistory(PlatformController.getHistory());
  };

  useEffect(() => {
    reloadAll();
    
    // Auto refresh telemetry every 5 seconds
    const interval = setInterval(() => {
      setTelemetry(EnvironmentManager.getStats());
    }, 5000);

    // Listen to configuration updates from anywhere
    const handleUpdate = () => {
      setActiveConfig(ConfigurationService.getActiveConfig());
      setHistory(PlatformController.getHistory());
    };
    window.addEventListener('shana_config_updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('shana_config_updated', handleUpdate);
    };
  }, []);

  // Sync draft edits to localStorage immediately so they aren't lost
  const updateDraft = (newDraft: PlatformConfig) => {
    setDraftConfig(newDraft);
    PlatformController.saveDraftConfig(newDraft);
  };

  // Immediate Toggle Feature Flag (Auto-Persists Active immediately, and supports Rollback)
  const handleFeatureToggle = (flagKey: keyof FeatureFlags) => {
    if (!isSuperAdmin) {
      setErrorMessage(lang === 'FR' ? "Action refusée : Seuls les Super Admins peuvent modifier les fonctionnalités." : "Action Denied: Only Super Admins can alter feature flags.");
      return;
    }

    const flagKeyTyped = flagKey as keyof FeatureFlags;
    const currentVal = draftConfig.featureFlags[flagKeyTyped];
    const newVal = !currentVal;

    // 1. Update draft
    const updatedFlags = { ...draftConfig.featureFlags, [flagKeyTyped]: newVal };
    const updatedDraft = { ...draftConfig, featureFlags: updatedFlags };
    updateDraft(updatedDraft);

    // 2. Persist immediately to active config
    FeatureManager.setFlag(flagKeyTyped, newVal);

    const flagKeyStr = String(flagKey);

    // 3. Log Audit
    AccessController.logAction(
      'SYSTEM',
      `Toggled Feature Flag: ${flagKeyStr} is now ${newVal ? 'ENABLED' : 'DISABLED'}`,
      { id: currentUser.id, email: currentUser.email, role: currentUser.role || 'super_admin' },
      undefined,
      `Immediate toggle performed on live system.`
    );

    // 4. Record History log entry for rollbacks
    const before = activeConfig;
    const after = ConfigurationService.getActiveConfig();
    const historyEntry: ConfigHistoryEntry = {
      id: 'cfg_hist_tgl_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      performedBy: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role || 'super_admin'
      },
      description: `Immediate toggle of feature flag: ${flagKeyStr} to ${newVal ? 'ON' : 'OFF'}`,
      before,
      after,
      canRollback: true
    };
    const updatedHistory = [historyEntry, ...PlatformController.getHistory()];
    localStorage.setItem('shana_config_history', JSON.stringify(updatedHistory));

    setHistory(updatedHistory);
    setActiveConfig(after);

    setSuccessMessage(lang === 'FR' ? `Fonctionnalité '${flagKeyStr}' mise à jour immédiatement !` : `Feature '${flagKeyStr}' updated instantly!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Start publishing process: Validate draft and move to preview
  const handleStartPublishFlow = () => {
    if (!isSuperAdmin) {
      setErrorMessage(lang === 'FR' ? "Seuls les Super Administrateurs peuvent publier." : "Only Super Administrators can publish changes.");
      return;
    }
    
    // Clear alerts
    setErrorMessage('');
    setSuccessMessage('');

    // Step 1: Preview
    setPublishStep('preview');
  };

  const handleValidateDraft = () => {
    const errors = PlatformController.validateConfig(draftConfig);
    setValidationErrors(errors);
    setPublishStep('validate');
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    const res = PlatformController.publishConfig(currentUser, publishComment || 'Manual configuration publish via Control Center.');
    if (res.success) {
      setSuccessMessage(lang === 'FR' ? "Configuration publiée avec succès !" : "Platform configuration published successfully!");
      setPublishComment('');
      setPublishStep('edit');
      reloadAll();
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setErrorMessage(res.errors ? res.errors.join(' | ') : 'Publish failed.');
    }
  };

  const handleDiscardDraft = () => {
    if (confirm(lang === 'FR' ? "Voulez-vous vraiment annuler le brouillon en cours ?" : "Are you sure you want to discard current draft edits?")) {
      const restored = PlatformController.discardDraft();
      setDraftConfig(restored);
      setPublishStep('edit');
      setSuccessMessage(lang === 'FR' ? "Brouillon réinitialisé au statut actif." : "Draft reset to current active settings.");
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleRollback = (entryId: string) => {
    if (!isSuperAdmin) {
      setErrorMessage(lang === 'FR' ? "Seuls les Super Admins peuvent effectuer des rollbacks." : "Only Super Admins can perform rollbacks.");
      return;
    }

    if (confirm(lang === 'FR' ? "Voulez-vous restaurer cette version de la plateforme ?" : "Are you sure you want to rollback to this configuration state?")) {
      const res = PlatformController.rollback(currentUser, entryId);
      if (res.success) {
        setSuccessMessage(lang === 'FR' ? "Restauration effectuée avec succès !" : "Rollback completed successfully!");
        reloadAll();
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(res.error || 'Rollback failed.');
      }
    }
  };

  return (
    <div id="platform-control-center-root" className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-left selection:bg-stone-950 selection:text-white">
      
      {/* Alert Notifications */}
      {successMessage && (
        <div className="lg:col-span-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-xs font-semibold text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="lg:col-span-4 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-xs font-semibold text-xs">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sidebar navigation */}
      <div className="lg:col-span-1 space-y-2">
        <div className="bg-white border border-stone-200 p-4 rounded-3xl space-y-1.5 shadow-xs">
          <div className="px-3.5 py-2">
            <span className="font-mono text-[9px] font-black text-stone-400 uppercase tracking-widest">
              {lang === 'FR' ? 'MENU DE PILOTAGE' : 'CONTROL MODULES'}
            </span>
          </div>

          {[
            { id: 'overview', label: lang === 'FR' ? 'Aperçu Plateforme' : 'Platform Overview', icon: Cpu },
            { id: 'features', label: lang === 'FR' ? 'Flags Configuration' : 'Config Flags', icon: Sliders },
            { id: 'experimentation', label: lang === 'FR' ? 'Expérimentation & A/B' : 'Live Flags & A/B', icon: FlaskConical },
            { id: 'ai', label: lang === 'FR' ? 'Configuration IA' : 'AI Settings', icon: Settings },
            { id: 'interview', label: lang === 'FR' ? 'Config Entretiens' : 'Interview Settings', icon: FileText },
            { id: 'content', label: lang === 'FR' ? 'Gestion des Contenus' : 'Content Management', icon: Globe2 },
            { id: 'maintenance', label: lang === 'FR' ? 'Maintenance' : 'Maintenance Mode', icon: Lock },
            { id: 'history', label: lang === 'FR' ? 'Historique & Rollbacks' : 'Publish History', icon: History },
            { id: 'deployment', label: lang === 'FR' ? 'Déploiement & Scaling' : 'Deployment & Scaling', icon: Cloud }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as ControlTab);
                  setErrorMessage('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-stone-950 text-white shadow-md' 
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Current Active Mode / State Quick Card */}
        <div className="bg-stone-50 border border-stone-200 p-5 rounded-3xl space-y-3">
          <h4 className="font-mono text-[9px] font-bold text-stone-400 uppercase tracking-wider">
            {lang === 'FR' ? 'STATUT EN DIRECT' : 'LIVE CONTEXT'}
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-500 font-semibold">{lang === 'FR' ? 'Maintenance :' : 'Maintenance :'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${
                activeConfig.maintenanceMode === 'normal' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {activeConfig.maintenanceMode.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 font-semibold">{lang === 'FR' ? 'Version active :' : 'Active Rev :'}</span>
              <span className="font-mono font-bold text-stone-800">{activeConfig.version}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 font-semibold">{lang === 'FR' ? 'Rôle requis :' : 'Role Enforced :'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${
                isSuperAdmin 
                  ? 'bg-amber-100 border-amber-200 text-amber-850' 
                  : 'bg-indigo-50 border-indigo-200 text-indigo-850'
              }`}>
                {isSuperAdmin ? 'SUPER ADMIN' : 'READ-ONLY ADMIN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="lg:col-span-3 space-y-6">

        {/* SECTION 1: PLATFORM OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                  {lang === 'FR' ? 'Aperçu Systémique' : 'System Overview'}
                </h2>
                <p className="text-xs text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Indicateurs clés du runtime Cloud Run et telemetry' : 'Real-time telemetry and running state logs (Read-only)'}
                </p>
              </div>
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700">
                <Cpu className="w-5 h-5" />
              </div>
            </div>

            {/* Metrics Telemetry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: lang === 'FR' ? 'Statut Général' : 'Platform Status', value: telemetry.platformStatus, desc: lang === 'FR' ? 'État global du backend' : 'Global API orchestration state', ok: telemetry.platformStatus === 'HEALTHY' },
                { label: lang === 'FR' ? 'Uptime' : 'System Uptime', value: telemetry.uptime, desc: lang === 'FR' ? 'Temps depuis le dernier boot' : 'Continuous operational running time' },
                { label: lang === 'FR' ? 'Environnement' : 'Target Env', value: telemetry.environment.toUpperCase(), desc: lang === 'FR' ? 'Runtime de l’application' : 'Current active infrastructure sandbox' },
                { label: lang === 'FR' ? 'Version Plateforme' : 'Build Rev', value: telemetry.version, desc: lang === 'FR' ? 'Tag git ou révision de build' : 'Deploy artifact identification tag' },
                { label: lang === 'FR' ? 'Utilisateurs Actifs' : 'Active Users', value: `${telemetry.activeUsers} Profils`, desc: lang === 'FR' ? 'Comptes activés en base' : 'Validated non-disabled users' },
                { label: lang === 'FR' ? 'Entretiens Simultanés' : 'Live Training sessions', value: telemetry.activeInterviews, desc: lang === 'FR' ? 'Simulateurs actifs en cours' : 'Candidates undergoing evaluation now' },
                { label: lang === 'FR' ? 'Serveur Central' : 'Core Node Container', value: telemetry.serverStatus, desc: telemetry.hostName, ok: telemetry.serverStatus === 'ONLINE' },
                { label: lang === 'FR' ? 'Latence API' : 'Mean API Latency', value: telemetry.responseTime, desc: lang === 'FR' ? 'Temps de réponse moyen' : 'Database query ping time' }
              ].map((stat, i) => (
                <div key={i} className="bg-stone-50 border border-stone-150 p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[9px] font-black uppercase text-stone-400 tracking-wider">
                      {stat.label}
                    </span>
                    <h4 className="font-sans font-black text-lg text-stone-900 mt-1">
                      {stat.value}
                    </h4>
                  </div>
                  <p className="text-stone-400 text-[10.5px] mt-1.5 font-semibold">
                    {stat.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-amber-800 text-xs font-semibold leading-relaxed">
                {lang === 'FR' 
                  ? 'Ces mesures sont en lecture seule. Aucune modification d’infrastructure physique ne peut être effectuée sans nouveau déploiement Git.' 
                  : 'Telemetry metrics are query-only. Container scale factors require custom infrastructure manifests.'}
              </p>
            </div>
          </div>
        )}

        {/* SECTION 2: FEATURE FLAGS */}
        {activeTab === 'features' && (
          <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                  {lang === 'FR' ? 'Drapeaux de Fonctionnalités' : 'Feature Flag Control'}
                </h2>
                <p className="text-xs text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Basculez des pans entiers de l’application instantanément' : 'Toggle dynamic modules instantly without releasing new source code'}
                </p>
              </div>
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700">
                <Sliders className="w-5 h-5" />
              </div>
            </div>

            {/* Flags Grid */}
            <div className="space-y-4">
              {[
                { key: 'interviewEngine', label: lang === 'FR' ? 'Moteur d’entretien' : 'Interview Engine', desc: lang === 'FR' ? 'Active ou désactive la possibilité de lancer de nouvelles sessions d’entretien.' : 'Enables or completely disables starting new simulator sessions.' },
                { key: 'mirrorRoom', label: lang === 'FR' ? 'Mirror Room (IA interactive)' : 'Mirror Room (Interactive AI)', desc: lang === 'FR' ? 'Active l’interaction vocale immersive et visuelle.' : 'Toggles visual feedback loops during live session training.' },
                { key: 'trainingSystem', label: lang === 'FR' ? 'Parcours d’Entraînement' : 'Training Path', desc: lang === 'FR' ? 'Donne accès au bac à sable d’entraînement illimité.' : 'Allows candidates access to unlimited sandbox training questions.' },
                { key: 'voiceMode', label: lang === 'FR' ? 'Flux Vocal (TTS/STT)' : 'Voice Mode (TTS/STT)', desc: lang === 'FR' ? 'Autorise l’enregistrement vocal et l’audio de l’examinateur.' : 'Controls whether audio synthesis is activated for questions.' },
                { key: 'videoMode', label: lang === 'FR' ? 'Analyse Vidéo Caméra' : 'Video Camera Feed', desc: lang === 'FR' ? 'Active le flux vidéo de l’examinateur virtuel de SHANA.' : 'Toggles canvas render frames for user video feeds.' },
                { key: 'assessmentPlan', label: lang === 'FR' ? 'Mode Évaluation Certifiante' : 'Certified Assessment Plan', desc: lang === 'FR' ? 'Contrôle l’accès au protocole d’évaluation professionnelle chronométré.' : 'Enables official corporate evaluation protocol modules.' },
                { key: 'adminDashboard', label: lang === 'FR' ? 'Accès Console Admin' : 'Admin Backoffice Access', desc: lang === 'FR' ? 'Drapeau de sécurité global pour l’accès administrateur.' : 'Master administrative security flag protecting the portal.' },
                { key: 'betaFeatures', label: lang === 'FR' ? 'Modules Expérimentaux (Beta)' : 'Experimental Sandbox (Beta)', desc: lang === 'FR' ? 'Débloque des prototypes de notation comportementale précoce.' : 'Enables early testing builds for cognitive state charts.' }
              ].map(flag => {
                const isEnabled = draftConfig.featureFlags[flag.key as keyof typeof draftConfig.featureFlags];
                return (
                  <div key={flag.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 bg-stone-50 border border-stone-150 rounded-2xl gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                        {flag.label}
                      </h4>
                      <p className="text-[11px] text-stone-400 font-semibold leading-relaxed">
                        {flag.desc}
                      </p>
                      <span className="font-mono text-[9px] text-stone-400 font-black">FLAG_KEY: {flag.key}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded ${
                        isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {isEnabled ? 'ON' : 'OFF'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleFeatureToggle(flag.key as any)}
                        disabled={!isSuperAdmin}
                        className={`w-12 h-6.5 rounded-full p-1 transition-all flex border cursor-pointer ${
                          isEnabled 
                            ? 'bg-emerald-500 border-emerald-600 justify-end' 
                            : 'bg-stone-300 border-stone-400 justify-start'
                        } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="w-4.5 h-4.5 bg-white rounded-full shadow-sm"></span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: AI CONFIGURATION */}
        {activeTab === 'ai' && (
          <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                  {lang === 'FR' ? 'Configuration de l’Intelligence Artificielle' : 'AI Engine Configuration'}
                </h2>
                <p className="text-xs text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Pilotez les paramètres linguistiques et comportementaux de l’IA' : 'Fine-tune scoring behaviors, model weights, and prompt difficulty'}
                </p>
              </div>
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700">
                <Settings className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Toggle Enable AI */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                    {lang === 'FR' ? 'Moteur de notation IA' : 'AI Evaluation Engine'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      updateDraft({
                        ...draftConfig,
                        aiConfig: { ...draftConfig.aiConfig, enableAI: !draftConfig.aiConfig.enableAI }
                      });
                    }}
                    disabled={!isSuperAdmin}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all flex border cursor-pointer ${
                      draftConfig.aiConfig.enableAI 
                        ? 'bg-emerald-500 border-emerald-600 justify-end' 
                        : 'bg-stone-300 border-stone-400 justify-start'
                    } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="w-4.5 h-4.5 bg-white rounded-full shadow-sm"></span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-400 font-semibold leading-relaxed">
                  {lang === 'FR' ? 'Si désactivé, SHANA utilisera des grilles d’évaluation statiques déterministes.' : 'If disabled, the platform defaults to high-accuracy deterministic grids.'}
                </p>
              </div>

              {/* Provider Selection */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-3 text-left">
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                  {lang === 'FR' ? 'Fournisseur d’API Actif' : 'Active Provider'}
                </h4>
                <select
                  value={draftConfig.aiConfig.activeProvider}
                  onChange={(e) => {
                    updateDraft({
                      ...draftConfig,
                      aiConfig: { ...draftConfig.aiConfig, activeProvider: e.target.value as AIProvider }
                    });
                  }}
                  disabled={!isSuperAdmin}
                  className="w-full bg-white border border-stone-200 rounded-xl text-xs px-3 py-2 font-semibold text-stone-800 focus:outline-none"
                >
                  <option value="gemini">Google Gemini API (Default)</option>
                  <option value="openai">OpenAI GPT-4o (Backup)</option>
                  <option value="mock">Local Deterministic Solver (Fallback)</option>
                </select>
                <p className="text-[10px] text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Les clés d’API privées sont sécurisées côté serveur et jamais exposées.' : 'API credentials remain securely encrypted server-side.'}
                </p>
              </div>

              {/* Interview response Mode */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                  {lang === 'FR' ? 'Mode de l’examinateur' : 'Vibe & Interview Mode'}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {(['friendly', 'neutral', 'strict', 'stress', 'executive'] as ResponseMode[]).map(mode => {
                    const isSel = draftConfig.aiConfig.responseMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          updateDraft({
                            ...draftConfig,
                            aiConfig: { ...draftConfig.aiConfig, responseMode: mode }
                          });
                        }}
                        disabled={!isSuperAdmin}
                        className={`px-3 py-2 rounded-xl text-left border text-[10.5px] font-bold uppercase transition-all flex items-center justify-between cursor-pointer ${
                          isSel 
                            ? 'bg-stone-950 text-white border-stone-950' 
                            : 'bg-white text-stone-600 hover:bg-stone-100 border-stone-200'
                        } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span>{mode}</span>
                        {isSel && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10.5px] text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Contrôle le niveau d’agressivité et de relance de l’agent virtuel.' : 'Governs conversational prompt triggers & evaluation strictness level.'}
                </p>
              </div>

              {/* AI Difficulty */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                  {lang === 'FR' ? 'Niveau de Complexité' : 'AI Behavioral Tier'}
                </h4>
                <div className="flex gap-1.5 flex-wrap">
                  {(['Junior', 'Mid', 'Senior', 'Executive'] as AIDifficulty[]).map(diff => {
                    const isSel = draftConfig.aiConfig.difficulty === diff;
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => {
                          updateDraft({
                            ...draftConfig,
                            aiConfig: { ...draftConfig.aiConfig, difficulty: diff }
                          });
                        }}
                        disabled={!isSuperAdmin}
                        className={`px-3 py-2 rounded-xl border text-[10.5px] font-bold uppercase transition-all cursor-pointer ${
                          isSel 
                            ? 'bg-stone-950 text-white border-stone-950' 
                            : 'bg-white text-stone-600 hover:bg-stone-100 border-stone-200'
                        } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {diff}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10.5px] text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Ajuste la profondeur technique des relances comportementales.' : 'Sets the vocabulary complexity & technical precision demands.'}
                </p>
              </div>

              {/* Silence Timeout */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-3 col-span-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                    {lang === 'FR' ? 'Timeout de Silence de l’Examinateur (secondes)' : 'Silence Detection Timeout (seconds)'}
                  </h4>
                  <span className="font-mono font-bold text-stone-800 text-xs bg-stone-200 px-2.5 py-0.5 rounded-lg">
                    {draftConfig.aiConfig.timeout}s
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={draftConfig.aiConfig.timeout}
                  onChange={(e) => {
                    updateDraft({
                      ...draftConfig,
                      aiConfig: { ...draftConfig.aiConfig, timeout: parseInt(e.target.value, 10) }
                    });
                  }}
                  disabled={!isSuperAdmin}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-950 disabled:opacity-50"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>10s</span>
                  <span>60s (Default)</span>
                  <span>120s</span>
                </div>
              </div>

            </div>

            {/* Quick Publish banner */}
            {isSuperAdmin && (
              <div className="border-t border-stone-100 pt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-50 cursor-pointer"
                >
                  {lang === 'FR' ? 'Annuler' : 'Discard Draft'}
                </button>
                <button
                  type="button"
                  onClick={handleStartPublishFlow}
                  className="px-5 py-2 bg-stone-950 hover:bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>{lang === 'FR' ? 'Aperçu & Publier' : 'Preview & Publish'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: INTERVIEW CONFIGURATION */}
        {activeTab === 'interview' && (
          <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                  {lang === 'FR' ? 'Paramètres des Sessions' : 'Interview Session Rules'}
                </h2>
                <p className="text-xs text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Régulez le format, la durée, le volume de questions et les restrictions techniques' : 'Enforce browser permissions, language matrix, and maximum durations'}
                </p>
              </div>
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              
              {/* Max Duration slider */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                    {lang === 'FR' ? 'Durée Maximale de Session' : 'Max Session Duration'}
                  </h4>
                  <span className="font-mono font-bold text-stone-800 text-xs bg-stone-200 px-2 py-0.5 rounded">
                    {draftConfig.interviewConfig.maxDuration} mins
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={draftConfig.interviewConfig.maxDuration}
                  onChange={(e) => {
                    updateDraft({
                      ...draftConfig,
                      interviewConfig: { ...draftConfig.interviewConfig, maxDuration: parseInt(e.target.value, 10) }
                    });
                  }}
                  disabled={!isSuperAdmin}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-950 disabled:opacity-50"
                />
                <p className="text-[11px] text-stone-400 font-semibold leading-relaxed">
                  {lang === 'FR' ? 'Temps limite au-delà duquel l’entretien est automatiquement complété.' : 'Hard stop timer limit protecting cloud GPU processing budgets.'}
                </p>
              </div>

              {/* Question count */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                    {lang === 'FR' ? 'Nombre de Questions' : 'Total Question Count'}
                  </h4>
                  <span className="font-mono font-bold text-stone-800 text-xs bg-stone-200 px-2 py-0.5 rounded">
                    {draftConfig.interviewConfig.questionCount} {lang === 'FR' ? 'questions' : 'items'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={draftConfig.interviewConfig.questionCount}
                  onChange={(e) => {
                    updateDraft({
                      ...draftConfig,
                      interviewConfig: { ...draftConfig.interviewConfig, questionCount: parseInt(e.target.value, 10) }
                    });
                  }}
                  disabled={!isSuperAdmin}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-950 disabled:opacity-50"
                />
                <p className="text-[11px] text-stone-400 font-semibold leading-relaxed">
                  {lang === 'FR' ? 'Nombre maximal de questions par session d’évaluation.' : 'Total behavioral evaluation nodes structured for the candidate.'}
                </p>
              </div>

              {/* Language Availability */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                  {lang === 'FR' ? 'Langues Disponibles' : 'Language Matrix availability'}
                </h4>
                <select
                  value={draftConfig.interviewConfig.languageAvailability}
                  onChange={(e) => {
                    updateDraft({
                      ...draftConfig,
                      interviewConfig: { ...draftConfig.interviewConfig, languageAvailability: e.target.value as LanguageAvailability }
                    });
                  }}
                  disabled={!isSuperAdmin}
                  className="w-full bg-white border border-stone-200 rounded-xl text-xs px-3 py-2 font-semibold text-stone-800 focus:outline-none"
                >
                  <option value="both">Français & English (All available)</option>
                  <option value="french_only">Français uniquement (Restricted)</option>
                  <option value="english_only">English only (Restricted)</option>
                </select>
                <p className="text-[10.5px] text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Restreint les options de langues sur la page de profil candidat.' : 'Restricts active translations inside onboarding flows.'}
                </p>
              </div>

              {/* Default Language */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                  {lang === 'FR' ? 'Langue par Défaut' : 'Default Language'}
                </h4>
                <div className="flex gap-2">
                  {(['FR', 'EN'] as DefaultLanguage[]).map(dl => {
                    const isSel = draftConfig.interviewConfig.defaultLanguage === dl;
                    return (
                      <button
                        key={dl}
                        type="button"
                        onClick={() => {
                          updateDraft({
                            ...draftConfig,
                            interviewConfig: { ...draftConfig.interviewConfig, defaultLanguage: dl }
                          });
                        }}
                        disabled={!isSuperAdmin}
                        className={`flex-1 px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSel 
                            ? 'bg-stone-950 text-white border-stone-950' 
                            : 'bg-white text-stone-600 hover:bg-stone-50 border-stone-200'
                        } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {dl === 'FR' ? 'FR (Français)' : 'EN (English)'}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10.5px] text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Langue appliquée automatiquement aux nouveaux profils.' : 'Default language applied on fast guest creations.'}
                </p>
              </div>

              {/* Pause Policy */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                  {lang === 'FR' ? 'Autorisation des Pauses' : 'Pause Policy'}
                </h4>
                <div className="flex gap-2">
                  {(['allowed', 'forbidden'] as PausePolicy[]).map(policy => {
                    const isSel = draftConfig.interviewConfig.pausePolicy === policy;
                    return (
                      <button
                        key={policy}
                        type="button"
                        onClick={() => {
                          updateDraft({
                            ...draftConfig,
                            interviewConfig: { ...draftConfig.interviewConfig, pausePolicy: policy }
                          });
                        }}
                        disabled={!isSuperAdmin}
                        className={`flex-1 px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSel 
                            ? 'bg-stone-950 text-white border-stone-950' 
                            : 'bg-white text-stone-600 hover:bg-stone-50 border-stone-200'
                        } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {policy === 'allowed' 
                          ? (lang === 'FR' ? 'Autorisées' : 'Allowed') 
                          : (lang === 'FR' ? 'Interdites' : 'Forbidden')}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10.5px] text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Si interdit, le bouton de pause est désactivé pendant l’entretien.' : 'Disables the interactive pausing button to increase realism pressure.'}
                </p>
              </div>

              {/* Camera & Microphone Required */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                  {lang === 'FR' ? 'Matériel Requis' : 'Hardware Enforcement'}
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftConfig.interviewConfig.cameraRequired}
                      disabled={!isSuperAdmin}
                      onChange={(e) => {
                        updateDraft({
                          ...draftConfig,
                          interviewConfig: { ...draftConfig.interviewConfig, cameraRequired: e.target.checked }
                        });
                      }}
                      className="w-4 h-4 rounded text-stone-950 focus:ring-stone-950 accent-stone-950 disabled:opacity-50"
                    />
                    <Video className="w-4 h-4 text-stone-500" />
                    <span>{lang === 'FR' ? 'Caméra Vidéo Obligatoire' : 'Camera stream required'}</span>
                  </label>
                  
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftConfig.interviewConfig.microphoneRequired}
                      disabled={!isSuperAdmin}
                      onChange={(e) => {
                        updateDraft({
                          ...draftConfig,
                          interviewConfig: { ...draftConfig.interviewConfig, microphoneRequired: e.target.checked }
                        });
                      }}
                      className="w-4 h-4 rounded text-stone-950 focus:ring-stone-950 accent-stone-950 disabled:opacity-50"
                    />
                    <Mic className="w-4 h-4 text-stone-500" />
                    <span>{lang === 'FR' ? 'Microphone Obligatoire' : 'Microphone stream required'}</span>
                  </label>
                </div>
                <p className="text-[10px] text-stone-400 font-semibold pt-1">
                  {lang === 'FR' ? 'Bloque le début de l’entretien si les permissions matérielles manquent.' : 'Prevents launch triggers if client blocks browser permissions.'}
                </p>
              </div>

            </div>

            {/* Quick Publish banner */}
            {isSuperAdmin && (
              <div className="border-t border-stone-100 pt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-50 cursor-pointer"
                >
                  {lang === 'FR' ? 'Annuler' : 'Discard Draft'}
                </button>
                <button
                  type="button"
                  onClick={handleStartPublishFlow}
                  className="px-5 py-2 bg-stone-950 hover:bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>{lang === 'FR' ? 'Aperçu & Publier' : 'Preview & Publish'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 5: CONTENT MANAGEMENT & PREVIEW */}
        {activeTab === 'content' && (
          <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                  {lang === 'FR' ? 'Gestion des Textes & Contenus' : 'Multilingual Content Manager'}
                </h2>
                <p className="text-xs text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Éditez les titres, messages d’accueil et bannières système' : 'Edit system labels, banners, and empty screen templates instantly'}
                </p>
              </div>
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700">
                <Globe2 className="w-5 h-5" />
              </div>
            </div>

            {/* Editing Inputs Side by Side */}
            <div className="space-y-6">
              
              {/* Home Texts */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                    {lang === 'FR' ? '1. Écran d’accueil' : '1. Onboarding Home Texts'}
                  </h3>
                  <span className="text-[10px] font-mono text-stone-400">CATEGORY: homeTexts</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* FR */}
                  <div className="space-y-3 text-left">
                    <span className="font-bold text-[10px] text-stone-500 uppercase tracking-wide block">Français (FR)</span>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={draftConfig.content.homeTexts.FR.title}
                        onChange={(e) => {
                          const updated = { ...draftConfig.content.homeTexts };
                          updated.FR.title = e.target.value;
                          updateDraft({ ...draftConfig, content: { ...draftConfig.content, homeTexts: updated } });
                        }}
                        disabled={!isSuperAdmin}
                        placeholder="Titre en Français"
                        className="w-full bg-white border border-stone-250 rounded-lg text-xs px-3 py-2 focus:outline-none"
                      />
                      <textarea
                        value={draftConfig.content.homeTexts.FR.subtitle}
                        onChange={(e) => {
                          const updated = { ...draftConfig.content.homeTexts };
                          updated.FR.subtitle = e.target.value;
                          updateDraft({ ...draftConfig, content: { ...draftConfig.content, homeTexts: updated } });
                        }}
                        disabled={!isSuperAdmin}
                        rows={2}
                        placeholder="Sous-titre en Français"
                        className="w-full bg-white border border-stone-250 rounded-lg text-xs px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* EN */}
                  <div className="space-y-3 text-left">
                    <span className="font-bold text-[10px] text-stone-500 uppercase tracking-wide block">English (EN)</span>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={draftConfig.content.homeTexts.EN.title}
                        onChange={(e) => {
                          const updated = { ...draftConfig.content.homeTexts };
                          updated.EN.title = e.target.value;
                          updateDraft({ ...draftConfig, content: { ...draftConfig.content, homeTexts: updated } });
                        }}
                        disabled={!isSuperAdmin}
                        placeholder="Title in English"
                        className="w-full bg-white border border-stone-250 rounded-lg text-xs px-3 py-2 focus:outline-none"
                      />
                      <textarea
                        value={draftConfig.content.homeTexts.EN.subtitle}
                        onChange={(e) => {
                          const updated = { ...draftConfig.content.homeTexts };
                          updated.EN.subtitle = e.target.value;
                          updateDraft({ ...draftConfig, content: { ...draftConfig.content, homeTexts: updated } });
                        }}
                        disabled={!isSuperAdmin}
                        rows={2}
                        placeholder="Subtitle in English"
                        className="w-full bg-white border border-stone-250 rounded-lg text-xs px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Interview Greeting Messages */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                    {lang === 'FR' ? '2. Messages de l’Examinateur Virtuel' : '2. Virtual Examiner Greeting Messages'}
                  </h3>
                  <span className="text-[10px] font-mono text-stone-400">CATEGORY: interviewMessages</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* FR */}
                  <div className="space-y-3 text-left">
                    <span className="font-bold text-[10px] text-stone-500 uppercase tracking-wide block">Français (FR)</span>
                    <div className="space-y-2">
                      <textarea
                        value={draftConfig.content.interviewMessages.FR.welcome}
                        onChange={(e) => {
                          const updated = { ...draftConfig.content.interviewMessages };
                          updated.FR.welcome = e.target.value;
                          updateDraft({ ...draftConfig, content: { ...draftConfig.content, interviewMessages: updated } });
                        }}
                        disabled={!isSuperAdmin}
                        rows={2}
                        placeholder="Message d'accueil"
                        className="w-full bg-white border border-stone-250 rounded-lg text-xs px-3 py-2 focus:outline-none"
                      />
                      <textarea
                        value={draftConfig.content.interviewMessages.FR.closing}
                        onChange={(e) => {
                          const updated = { ...draftConfig.content.interviewMessages };
                          updated.FR.closing = e.target.value;
                          updateDraft({ ...draftConfig, content: { ...draftConfig.content, interviewMessages: updated } });
                        }}
                        disabled={!isSuperAdmin}
                        rows={2}
                        placeholder="Message de clôture"
                        className="w-full bg-white border border-stone-250 rounded-lg text-xs px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* EN */}
                  <div className="space-y-3 text-left">
                    <span className="font-bold text-[10px] text-stone-500 uppercase tracking-wide block">English (EN)</span>
                    <div className="space-y-2">
                      <textarea
                        value={draftConfig.content.interviewMessages.EN.welcome}
                        onChange={(e) => {
                          const updated = { ...draftConfig.content.interviewMessages };
                          updated.EN.welcome = e.target.value;
                          updateDraft({ ...draftConfig, content: { ...draftConfig.content, interviewMessages: updated } });
                        }}
                        disabled={!isSuperAdmin}
                        rows={2}
                        placeholder="Welcome greeting message"
                        className="w-full bg-white border border-stone-250 rounded-lg text-xs px-3 py-2 focus:outline-none"
                      />
                      <textarea
                        value={draftConfig.content.interviewMessages.EN.closing}
                        onChange={(e) => {
                          const updated = { ...draftConfig.content.interviewMessages };
                          updated.EN.closing = e.target.value;
                          updateDraft({ ...draftConfig, content: { ...draftConfig.content, interviewMessages: updated } });
                        }}
                        disabled={!isSuperAdmin}
                        rows={2}
                        placeholder="Closing closing message"
                        className="w-full bg-white border border-stone-250 rounded-lg text-xs px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* System Broadcast Banners */}
              <div className="bg-stone-50 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                    {lang === 'FR' ? '3. Bannière d’alerte système' : '3. Broadcast Alert Banner'}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-stone-400">
                      {draftConfig.content.systemBanners.enabled ? 'BANNIÈRE ACTIVE' : 'BANNIÈRE OFF'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...draftConfig.content.systemBanners, enabled: !draftConfig.content.systemBanners.enabled };
                        updateDraft({ ...draftConfig, content: { ...draftConfig.content, systemBanners: updated } });
                      }}
                      disabled={!isSuperAdmin}
                      className={`w-9 h-5 rounded-full p-0.5 transition-all flex border cursor-pointer ${
                        draftConfig.content.systemBanners.enabled 
                          ? 'bg-amber-500 border-amber-600 justify-end' 
                          : 'bg-stone-300 border-stone-400 justify-start'
                      } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"></span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <span className="font-bold text-[10px] text-stone-500 uppercase">Message Français</span>
                    <input
                      type="text"
                      value={draftConfig.content.systemBanners.FR}
                      onChange={(e) => {
                        const updated = { ...draftConfig.content.systemBanners, FR: e.target.value };
                        updateDraft({ ...draftConfig, content: { ...draftConfig.content, systemBanners: updated } });
                      }}
                      disabled={!isSuperAdmin}
                      className="w-full bg-white border border-stone-250 rounded-lg text-xs px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <span className="font-bold text-[10px] text-stone-500 uppercase">English Translation</span>
                    <input
                      type="text"
                      value={draftConfig.content.systemBanners.EN}
                      onChange={(e) => {
                        const updated = { ...draftConfig.content.systemBanners, EN: e.target.value };
                        updateDraft({ ...draftConfig, content: { ...draftConfig.content, systemBanners: updated } });
                      }}
                      disabled={!isSuperAdmin}
                      className="w-full bg-white border border-stone-250 rounded-lg text-xs px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic WYSIWYG Live Preview Stage */}
              <div className="bg-stone-950 text-stone-100 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-850 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-stone-200">
                      {lang === 'FR' ? 'Aperçu du Rendu Candidat (Brouillon)' : 'Candidate Live UI Render Preview (Draft)'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewLang('FR')}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${previewLang === 'FR' ? 'bg-white text-stone-900' : 'bg-stone-850 text-stone-400'}`}
                    >
                      FR (FRANÇAIS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLang('EN')}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${previewLang === 'EN' ? 'bg-white text-stone-900' : 'bg-stone-850 text-stone-400'}`}
                    >
                      EN (ENGLISH)
                    </button>
                  </div>
                </div>

                {/* Simulated rendering frame */}
                <div className="bg-[#FAF7F2] text-stone-900 p-6 rounded-2xl space-y-4 border border-stone-800 text-center select-none relative overflow-hidden">
                  
                  {/* Banner */}
                  {draftConfig.content.systemBanners.enabled && (
                    <div className="absolute top-0 left-0 right-0 bg-amber-500 text-stone-950 py-1.5 text-[10.5px] font-extrabold flex items-center justify-center gap-1.5 shadow-sm animate-pulse">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>{draftConfig.content.systemBanners[previewLang]}</span>
                    </div>
                  )}

                  <div className={`space-y-2 text-left pt-6`}>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-extrabold text-stone-400">
                      <span>SHANA AI PREVIEW STAGE</span>
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                    </div>
                    <h2 className="font-sans font-black text-xl text-stone-900 leading-tight">
                      {draftConfig.content.homeTexts[previewLang].title}
                    </h2>
                    <p className="text-[#6B7280] text-xs font-medium">
                      {draftConfig.content.homeTexts[previewLang].subtitle}
                    </p>
                  </div>

                  {/* Button labels preview */}
                  <div className="flex items-center gap-2 pt-4 justify-start">
                    <button type="button" className="px-4 py-2 bg-stone-950 text-white rounded-xl text-xs font-bold shadow-sm pointer-events-none">
                      {draftConfig.content.buttonLabels[previewLang].start}
                    </button>
                    <button type="button" className="px-4 py-2 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold pointer-events-none">
                      {draftConfig.content.buttonLabels[previewLang].cancel}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Publish banner */}
            {isSuperAdmin && (
              <div className="border-t border-stone-100 pt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-50 cursor-pointer"
                >
                  {lang === 'FR' ? 'Annuler' : 'Discard Draft'}
                </button>
                <button
                  type="button"
                  onClick={handleStartPublishFlow}
                  className="px-5 py-2 bg-stone-950 hover:bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>{lang === 'FR' ? 'Aperçu & Publier' : 'Preview & Publish'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 6: MAINTENANCE MODES */}
        {activeTab === 'maintenance' && (
          <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                  {lang === 'FR' ? 'Maintenance de la Plateforme' : 'Platform Maintenance & Access'}
                </h2>
                <p className="text-xs text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Contrôlez les restrictions de connexions et d’enregistrement' : 'Toggle emergency lockdowns or read-only states for database integrity'}
                </p>
              </div>
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  id: 'normal', 
                  title: lang === 'FR' ? 'Mode Normal' : 'Normal State', 
                  desc: lang === 'FR' ? 'Toutes les fonctionnalités sont opérationnelles. Accès complet pour les candidats.' : 'Full read-write database operations and real-time GPU engine queries.',
                  color: 'border-emerald-500 bg-emerald-50/20 text-emerald-900'
                },
                { 
                  id: 'read-only', 
                  title: lang === 'FR' ? 'Lecture Seule' : 'Read-Only Mode', 
                  desc: lang === 'FR' ? 'Les candidats peuvent naviguer mais pas lancer ni enregistrer de nouvelles sessions.' : 'Enforces audit logs only. Retains history view but pauses writing states.',
                  color: 'border-amber-500 bg-amber-50/20 text-amber-900'
                },
                { 
                  id: 'maintenance', 
                  title: lang === 'FR' ? 'Maintenance Critique' : 'Maintenance Lockdown', 
                  desc: lang === 'FR' ? 'Accès refusé pour les candidats. Seuls les comptes d’administration accèdent au backoffice.' : 'Full lock. Shuts off new assessment startups entirely. Active user sessions are kept intact.',
                  color: 'border-red-500 bg-red-50/20 text-red-900'
                }
              ].map(opt => {
                const isSel = draftConfig.maintenanceMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      updateDraft({
                        ...draftConfig,
                        maintenanceMode: opt.id as any
                      });
                    }}
                    disabled={!isSuperAdmin}
                    className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-44 cursor-pointer relative ${
                      isSel 
                        ? opt.color
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-850'
                    } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wide">{opt.title}</span>
                        {isSel && <CheckCircle2 className="w-4 h-4 text-stone-900" />}
                      </div>
                      <p className="text-[11px] text-stone-400 font-semibold leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>

                    <span className="font-mono text-[9px] text-stone-400 font-black">CODE: {opt.id.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>

            <div className="bg-red-50/40 border border-red-200 p-5 rounded-2xl flex items-start gap-4 text-left">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-xs text-red-900 font-semibold">
                <h4 className="font-bold text-xs text-red-950 uppercase tracking-wide">
                  {lang === 'FR' ? 'RÈGLE DE SÉCURITÉ CONCERNANT LA MAINTENANCE' : 'MAINTENANCE SHUTDOWN CRITERIA'}
                </h4>
                <ul className="list-disc pl-4 space-y-1 font-medium text-red-800 leading-normal">
                  <li>
                    {lang === 'FR' 
                      ? 'Les entretiens déjà en cours ne sont pas interrompus abruptement afin d’éviter des pertes de données candidat.' 
                      : 'Existing live candidate training sessions will complete uninterrupted to secure response profiles.'}
                  </li>
                  <li>
                    {lang === 'FR' 
                      ? 'Les candidats tentant de se connecter ou de lancer un entretien recevront un écran de maintenance poli.' 
                      : 'Candidates trying to initiate fresh evaluation blueprints are gracefully blocked via maintenance alerts.'}
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Publish banner */}
            {isSuperAdmin && (
              <div className="border-t border-stone-100 pt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-50 cursor-pointer"
                >
                  {lang === 'FR' ? 'Annuler' : 'Discard Draft'}
                </button>
                <button
                  type="button"
                  onClick={handleStartPublishFlow}
                  className="px-5 py-2 bg-stone-950 hover:bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>{lang === 'FR' ? 'Aperçu & Publier' : 'Preview & Publish'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 7: PUBLISH HISTORY & ROLLBACK */}
        {activeTab === 'history' && (
          <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6 shadow-xs animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                  {lang === 'FR' ? 'Historique des Modifications & Rollbacks' : 'Publish History & Rollbacks'}
                </h2>
                <p className="text-xs text-stone-400 font-semibold">
                  {lang === 'FR' ? 'Consultez la piste d’audit et restaurez n’importe quelle révision antérieure d’un clic' : 'Track who altered the platform variables and execute instant rollbacks if needed'}
                </p>
              </div>
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700">
                <History className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="p-12 text-center text-stone-400 italic bg-stone-50 rounded-2xl border border-stone-200 text-xs">
                  {lang === 'FR' 
                    ? 'Aucune modification de configuration publiée pour le moment. Votre système tourne sur les paramètres d’usine par défaut.' 
                    : 'No custom config publishes found. Platform is executing default static config values.'}
                </div>
              ) : (
                history.map((entry) => {
                  const changedBySelf = entry.performedBy.id === currentUser.id;
                  return (
                    <div key={entry.id} className="bg-stone-50 border border-stone-150 p-5 rounded-2xl space-y-3 relative overflow-hidden text-xs">
                      
                      {/* Top identity */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200/50 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-black uppercase text-stone-400">ID: {entry.id}</span>
                          <span className="text-stone-300">•</span>
                          <span className="text-stone-500 font-bold">
                            {new Date(entry.timestamp).toLocaleString(lang === 'FR' ? 'fr-FR' : 'en-US')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-600">
                            {entry.performedBy.email} ({entry.performedBy.role.toUpperCase()})
                          </span>
                          {changedBySelf && (
                            <span className="bg-stone-200 text-stone-800 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                              {lang === 'FR' ? 'Moi' : 'Me'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Comment description */}
                      <div className="space-y-1">
                        <span className="font-bold text-[10px] text-stone-400 uppercase tracking-wider block">
                          {lang === 'FR' ? 'RÉSUMÉ DU CHANGEMENT' : 'REVISION CHANGE LOG'}
                        </span>
                        <p className="font-bold text-stone-900 font-sans text-sm">
                          {entry.description}
                        </p>
                      </div>

                      {/* Before / After detail parameters badges list */}
                      <div className="grid grid-cols-2 gap-4 bg-white/50 border border-stone-200/40 p-3 rounded-xl font-mono text-[10.5px]">
                        <div>
                          <span className="text-stone-400 uppercase text-[8.5px] block font-black">
                            {lang === 'FR' ? 'État Précédent (Avant)' : 'PREVIOUS STATE (BEFORE)'}
                          </span>
                          <p className="font-bold text-stone-500 mt-0.5">
                            Rev: {entry.before.version} • Maintenance: {entry.before.maintenanceMode} • Timeout: {entry.before.aiConfig.timeout}s
                          </p>
                        </div>
                        <div>
                          <span className="text-emerald-500 uppercase text-[8.5px] block font-black">
                            {lang === 'FR' ? 'État Appliqué (Après)' : 'APPLIED STATE (AFTER)'}
                          </span>
                          <p className="font-bold text-emerald-800 mt-0.5">
                            Rev: {entry.after.version} • Maintenance: {entry.after.maintenanceMode} • Timeout: {entry.after.aiConfig.timeout}s
                          </p>
                        </div>
                      </div>

                      {/* Rollback button */}
                      {isSuperAdmin && entry.canRollback && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleRollback(entry.id)}
                            className="px-3.5 py-1.5 bg-stone-950 hover:bg-stone-900 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{lang === 'FR' ? 'Restaurer cette version' : 'Rollback to this revision'}</span>
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* SECTION 8: DEPLOYMENT & SCALING SYSTEM (PHASE 18) */}
        {activeTab === 'deployment' && (
          <div className="space-y-6 text-left animate-fade-in">
            {/* Header with quick system metrics */}
            <div className="bg-white border border-stone-200 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <h2 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                    {lang === 'FR' ? 'Déploiement Continu & Scaling' : 'Continuous Deployment & Scaling'}
                  </h2>
                </div>
                <p className="text-xs text-stone-400 font-semibold mt-1">
                  {lang === 'FR' 
                    ? 'Supervisez les pipelines de livraison, l\'auto-scaling horizontal et la résilience multi-région de SHANA.' 
                    : 'Govern delivery pipelines, horizontal auto-scaling, and multi-region resilience.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[10px] font-bold text-stone-500">
                  {lang === 'FR' ? 'REFRESH EN DIRECT' : 'LIVE CONSOLE STREAM'}
                </span>
                <button
                  type="button"
                  onClick={fetchDeployDashboard}
                  className="p-1.5 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-600 cursor-pointer"
                  title="Force Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            {deployDashboard && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-stone-400 font-mono text-[9px] font-black uppercase tracking-wider block">
                    {lang === 'FR' ? 'NŒUDS CLUSTER' : 'ACTIVE CLUSTER NODES'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-stone-900 font-mono">
                      {deployDashboard.environments?.production?.nodes?.length || 0}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400">/ 10 max</span>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>{lang === 'FR' ? 'Équilibré par LB' : 'Balanced by LB'}</span>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-stone-400 font-mono text-[9px] font-black uppercase tracking-wider block">
                    {lang === 'FR' ? 'HIT-RATE CACHE' : 'GLOBAL CACHE HIT-RATE'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-indigo-600 font-mono">
                      {deployDashboard.cacheMetrics?.avgHitRatePct || 0}%
                    </span>
                    <span className="text-[10px] font-bold text-stone-400">
                      {deployDashboard.cacheMetrics?.totalEntries || 0} keys
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-stone-500">
                    RAM: {deployDashboard.cacheMetrics?.allocatedMemoryMb || 0} MB
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-stone-400 font-mono text-[9px] font-black uppercase tracking-wider block">
                    {lang === 'FR' ? 'MIGRATIONS APPLIQUÉES' : 'DATABASE MIGRATIONS'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-stone-900 font-mono">
                      {deployDashboard.migrations?.length || 0}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 font-mono">
                      {deployDashboard.environments?.production?.schemaVersion || 'v1'}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600">
                    {lang === 'FR' ? 'Schéma sain' : 'Schema fully consistent'}
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-stone-400 font-mono text-[9px] font-black uppercase tracking-wider block">
                    {lang === 'FR' ? 'RPO SLA RÉGIONAL' : 'DISASTER RECOVERY RPO'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-rose-600 font-mono">
                      &lt;5s
                    </span>
                    <span className="text-[10px] font-bold text-stone-400">PITR</span>
                  </div>
                  <div className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>{lang === 'FR' ? 'Restauration <30s' : 'RTO Recovery <30s'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Environments Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {['development', 'staging', 'production'].map((envKey) => {
                const env = deployDashboard?.environments?.[envKey];
                if (!env) return null;

                const statusColor = env.status === 'healthy' 
                  ? 'bg-emerald-500' 
                  : env.status === 'degraded' 
                    ? 'bg-amber-500 animate-pulse' 
                    : 'bg-rose-500';

                const statusText = env.status === 'healthy' 
                  ? (lang === 'FR' ? 'OPÉRATIONNEL' : 'HEALTHY')
                  : env.status === 'degraded'
                    ? (lang === 'FR' ? 'FAILOVER ACTIF' : 'DEGRADED / BYPASS')
                    : (lang === 'FR' ? 'HORS LIGNE' : 'DEPLOYING / OUTAGE');

                return (
                  <div key={envKey} className="bg-white border border-stone-200 p-5 rounded-3xl space-y-4 shadow-xs relative overflow-hidden">
                    {/* Header border representing active state */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${env.status === 'healthy' ? 'bg-emerald-500' : env.status === 'degraded' ? 'bg-amber-500' : 'bg-stone-300'}`} />

                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black uppercase tracking-widest text-stone-400">
                        {envKey}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                        <span className="font-mono text-[9px] font-black tracking-wider text-stone-700">
                          {statusText}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Coordinates */}
                    <div className="bg-stone-50 border border-stone-150 p-3 rounded-2xl font-mono text-[10.5px] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-stone-400">VERSION:</span>
                        <span className="font-bold text-stone-800">{env.runningVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">COMMIT:</span>
                        <span className="font-bold text-stone-800">{env.commitHash}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">SCHEMA_DB:</span>
                        <span className="font-bold text-stone-800">{env.schemaVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">PROMPT_AI:</span>
                        <span className="font-bold text-stone-800">{env.promptVersion}</span>
                      </div>
                    </div>

                    {/* Node Clusters */}
                    <div className="space-y-1.5 text-xs">
                      <span className="font-mono text-[9px] font-black text-stone-400 uppercase tracking-widest block">
                        {lang === 'FR' ? 'REPRÉSENTATION DU CLUSTER' : 'CLUSTER TOPOLOGY MAP'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {env.nodes?.map((node: any) => (
                          <div 
                            key={node.id} 
                            className={`px-2 py-1 rounded-md border font-mono text-[9px] flex items-center gap-1.5 ${
                              node.healthy 
                                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}
                            title={`CPU: ${node.cpuUsage}%, RAM: ${node.memoryUsage}%`}
                          >
                            <Server className="w-3 h-3 text-stone-400" />
                            <span>{node.id}</span>
                            <span className="text-[8px] opacity-75">{node.cpuUsage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Active Telemetry Line stats */}
                    <div className="grid grid-cols-2 gap-3 text-center border-t border-stone-100 pt-3">
                      <div>
                        <span className="text-stone-400 text-[8.5px] font-mono block">CPU UTIL.</span>
                        <span className="text-xs font-black text-stone-800 font-mono">
                          {Math.round(env.nodes?.reduce((acc: number, n: any) => acc + n.cpuUsage, 0) / (env.nodes?.length || 1))}%
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[8.5px] font-mono block">MEMORY</span>
                        <span className="text-xs font-black text-stone-800 font-mono">
                          {Math.round(env.nodes?.reduce((acc: number, n: any) => acc + n.memoryUsage, 0) / (env.nodes?.length || 1))}%
                        </span>
                      </div>
                    </div>

                    {/* Failover / Bypass Toggle & Rollback */}
                    <div className="border-t border-stone-100 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-700">
                          {lang === 'FR' ? 'Bypass / Failover Manuel' : 'Bypass Failover Router'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTriggerFailover(envKey, env.status === 'healthy')}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                            env.status === 'degraded'
                              ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                              : 'bg-stone-50 border-stone-250 text-stone-600'
                          }`}
                        >
                          {env.status === 'degraded' ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </div>

                      {/* Version Revert Rollback drop option */}
                      <div className="flex gap-1.5">
                        <select
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg text-[10px] px-2 py-1 font-semibold focus:outline-none"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleRollbackRelease(envKey, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">-- {lang === 'FR' ? 'Rollback instantané vers...' : 'Revert to stable version...'} --</option>
                          <option value="1.17.4">v1.17.4-stable (Prev)</option>
                          <option value="1.17.0">v1.17.0-LTS</option>
                          <option value="1.16.8">v1.16.8-hotfix</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pipeline Trigger console */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Propose Release form */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4 shadow-xs text-left">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Terminal className="w-5 h-5 text-stone-700" />
                  <h3 className="font-sans font-black text-sm text-stone-900 tracking-tight uppercase">
                    {lang === 'FR' ? 'Déclencher un Pipeline de Release' : 'Initiate Automated Release Pipeline'}
                  </h3>
                </div>

                <form onSubmit={handleInitiateDeploy} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-stone-500 uppercase font-bold text-[10px] block">
                        {lang === 'FR' ? 'Environnement Cible' : 'Target Environment'}
                      </label>
                      <select
                        value={deployEnv}
                        onChange={(e: any) => setDeployEnv(e.target.value)}
                        className="w-full bg-white border border-stone-250 rounded-xl text-xs px-3 py-2 focus:outline-none font-bold"
                      >
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                        <option value="development">Development</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-stone-500 uppercase font-bold text-[10px] block">
                        {lang === 'FR' ? 'Stratégie de Livraison' : 'Deployment Strategy'}
                      </label>
                      <select
                        value={deployStrategy}
                        onChange={(e: any) => setDeployStrategy(e.target.value)}
                        className="w-full bg-white border border-stone-250 rounded-xl text-xs px-3 py-2 focus:outline-none font-bold"
                      >
                        <option value="blue-green">Blue-Green (Zero-Downtime)</option>
                        <option value="rolling">Rolling Upgrade</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-stone-500 uppercase font-bold text-[10px] block">
                        {lang === 'FR' ? 'Numéro de Version' : 'Semantic Version'}
                      </label>
                      <input
                        type="text"
                        required
                        value={deployVersion}
                        onChange={(e) => setDeployVersion(e.target.value)}
                        placeholder="e.g., 1.18.0"
                        className="w-full bg-white border border-stone-250 rounded-xl text-xs px-3.5 py-2 focus:outline-none font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-stone-500 uppercase font-bold text-[10px] block">
                        {lang === 'FR' ? 'Git Commit SHA' : 'Git Commit SHA'}
                      </label>
                      <input
                        type="text"
                        required
                        value={deployCommit}
                        onChange={(e) => setDeployCommit(e.target.value)}
                        placeholder="e.g., c7b8a9d"
                        className="w-full bg-white border border-stone-250 rounded-xl text-xs px-3.5 py-2 focus:outline-none font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-stone-500 uppercase font-bold text-[10px] block">
                        {lang === 'FR' ? 'Schéma Database Exigé' : 'Database Schema Version'}
                      </label>
                      <input
                        type="text"
                        required
                        value={deploySchema}
                        onChange={(e) => setDeploySchema(e.target.value)}
                        placeholder="e.g., v42"
                        className="w-full bg-white border border-stone-250 rounded-xl text-xs px-3.5 py-2 focus:outline-none font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-stone-500 uppercase font-bold text-[10px] block">
                        {lang === 'FR' ? 'Version Prompts IA' : 'AI Prompt Catalog Version'}
                      </label>
                      <input
                        type="text"
                        required
                        value={deployPrompt}
                        onChange={(e) => setDeployPrompt(e.target.value)}
                        placeholder="e.g., q_v1.3_eval_v2.0"
                        className="w-full bg-white border border-stone-250 rounded-xl text-xs px-3.5 py-2 focus:outline-none font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Pre-flight Feature flags snapshots */}
                  <div className="space-y-2 border-t border-stone-100 pt-3">
                    <span className="text-stone-500 uppercase font-bold text-[10px] block">
                      {lang === 'FR' ? 'Instantané des feature flags pré-déploiement' : 'Pre-flight Feature Flags Snapshots'}
                    </span>
                    <div className="grid grid-cols-3 gap-2 font-mono text-[9px] text-stone-700">
                      {Object.keys(deployFlags).map((flag) => (
                        <label key={flag} className="flex items-center gap-1.5 p-1.5 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deployFlags[flag]}
                            onChange={(e) => setDeployFlags({ ...deployFlags, [flag]: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-0"
                          />
                          <span className="truncate">{flag}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={pipelineRunning}
                      className="w-full py-2.5 bg-stone-950 hover:bg-stone-900 disabled:bg-stone-300 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>
                        {pipelineRunning 
                          ? (lang === 'FR' ? 'Pipeline en cours...' : 'Pipeline actively running...') 
                          : (lang === 'FR' ? 'Lancer le déploiement sécurisé' : 'Trigger secure deployment')}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Live Pipeline Monitor */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-sans font-black text-sm text-stone-900 tracking-tight uppercase">
                        {lang === 'FR' ? 'Moniteur de Pipeline de CI/CD' : 'CI/CD Live Pipeline Monitor'}
                      </h3>
                    </div>
                    {activePipelineTask && (
                      <span className="font-mono text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800">
                        {activePipelineTask.status === 'completed' ? 'SUCCESS' : activePipelineTask.status === 'failed' ? 'FAILED' : 'RUNNING'}
                      </span>
                    )}
                  </div>

                  {activePipelineTask ? (
                    <div className="space-y-4 mt-4">
                      {/* Status timeline pipeline visualizer */}
                      <div className="space-y-2.5">
                        {activePipelineTask.steps?.map((step: any, idx: number) => {
                          const isDone = step.status === 'passed';
                          const isFailed = step.status === 'failed';
                          const isCurrent = step.status === 'running';

                          return (
                            <div key={idx} className="flex items-center justify-between font-mono text-[11px] border-b border-stone-50 pb-1.5">
                              <div className="flex items-center gap-2">
                                {isDone && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                                {isFailed && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                                {isCurrent && <RefreshCw className="w-4 h-4 text-amber-500 animate-spin shrink-0" />}
                                {!isDone && !isFailed && !isCurrent && <div className="w-4 h-4 border-2 border-stone-200 rounded-full shrink-0" />}
                                <span className={`font-bold ${isCurrent ? 'text-stone-900 font-extrabold' : 'text-stone-600'}`}>{step.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-stone-400">
                                <span>{step.durationMs ? `${(step.durationMs / 1000).toFixed(1)}s` : '--'}</span>
                                <span className={`font-bold ${isDone ? 'text-emerald-600' : isFailed ? 'text-rose-600' : isCurrent ? 'text-amber-500' : 'text-stone-300'}`}>
                                  {step.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Raw console outputs */}
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] font-black text-stone-400 uppercase tracking-widest block">
                          {lang === 'FR' ? 'LOGS DU COMPILATEUR ET DES TESTS' : 'COMPILER LOGS & TEST CONSOLE OUTPUT'}
                        </span>
                        <div className="bg-stone-950 text-stone-300 p-3 rounded-2xl font-mono text-[9.5px] h-36 overflow-y-auto space-y-1 border border-stone-850 leading-relaxed">
                          {activePipelineTask.logs?.map((log: string, idx: number) => (
                            <div key={idx} className={log.includes('[ERROR]') ? 'text-rose-400' : log.includes('[SUCCESS]') ? 'text-emerald-400' : 'text-stone-300'}>
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-stone-400 italic bg-stone-50 rounded-2xl border border-stone-200 text-xs my-auto">
                      {lang === 'FR' 
                        ? 'Aucun pipeline en cours d\'exécution. Déclenchez une release via le formulaire à gauche.' 
                        : 'No active pipeline running. Initiate a release configuration using the left form.'}
                    </div>
                  )}
                </div>

                {activePipelineTask && activePipelineTask.status === 'running' && (
                  <div className="w-full bg-stone-100 rounded-full h-1.5 mt-4">
                    <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse" style={{ width: '70%' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Auto-Scaling & Database Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Horizontal Auto-scaling parameters */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4 shadow-xs text-left">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-stone-700" />
                    <h3 className="font-sans font-black text-sm text-stone-900 tracking-tight uppercase">
                      {lang === 'FR' ? "Régulation d'Auto-Scaling Horizontal" : 'Horizontal Auto-Scaling Governor'}
                    </h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={scalingEnabled} 
                      onChange={(e) => setScalingEnabled(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-stone-500 uppercase font-bold">{lang === 'FR' ? 'Seuil CPU Scale-Up' : 'CPU Scale-Up Limit'}</span>
                        <span className="text-stone-800 font-extrabold">{scalingCPU}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        value={scalingCPU}
                        onChange={(e) => setScalingCPU(Number(e.target.value))}
                        className="w-full accent-stone-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-stone-500 uppercase font-bold">{lang === 'FR' ? 'Seuil RAM Scale-Up' : 'RAM Scale-Up Limit'}</span>
                        <span className="text-stone-800 font-extrabold">{scalingMemory}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        value={scalingMemory}
                        onChange={(e) => setScalingMemory(Number(e.target.value))}
                        className="w-full accent-stone-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-stone-500 uppercase font-bold text-[9px] block">
                        {lang === 'FR' ? 'Déclencheur Latence' : 'Latency Trigger'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={scalingLatency}
                          onChange={(e) => setScalingLatency(Number(e.target.value))}
                          className="w-full bg-stone-50 border border-stone-250 rounded-xl px-3 py-1.5 focus:outline-none text-xs font-bold font-mono"
                        />
                        <span className="absolute right-3 top-2 text-[9px] text-stone-400 font-bold">MS</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-stone-500 uppercase font-bold text-[9px] block">
                        {lang === 'FR' ? 'Min Nodes' : 'Min Nodes'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={scalingMinNodes}
                        onChange={(e) => setScalingMinNodes(Number(e.target.value))}
                        className="w-full bg-stone-50 border border-stone-250 rounded-xl px-3 py-1.5 focus:outline-none text-xs font-bold font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-stone-500 uppercase font-bold text-[9px] block">
                        {lang === 'FR' ? 'Max Nodes' : 'Max Nodes'}
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="20"
                        value={scalingMaxNodes}
                        onChange={(e) => setScalingMaxNodes(Number(e.target.value))}
                        className="w-full bg-stone-50 border border-stone-250 rounded-xl px-3 py-1.5 focus:outline-none text-xs font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleUpdateAutoscaling}
                      className="w-full py-2 bg-stone-100 hover:bg-stone-200 border border-stone-250 text-stone-700 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      {lang === 'FR' ? "Enregistrer les seuils d'auto-scaling" : 'Apply Scaling Configurations'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Schema Migrations & History */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4 shadow-xs text-left">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Database className="w-5 h-5 text-stone-700" />
                  <h3 className="font-sans font-black text-sm text-stone-900 tracking-tight uppercase">
                    {lang === 'FR' ? 'Schémas DB & Migrations à Chaud' : 'Database Schema Migrations'}
                  </h3>
                </div>

                {/* Apply hot migration form */}
                <div className="space-y-3">
                  <div className="flex gap-2 text-xs font-semibold">
                    <input
                      type="text"
                      value={migrationName}
                      onChange={(e) => setMigrationName(e.target.value)}
                      placeholder={lang === 'FR' ? "Nom de la migration (ex: create_org_billing_idx)" : "Migration name (ex: add_cv_hash)"}
                      className="w-full bg-white border border-stone-250 rounded-xl px-3.5 py-2 focus:outline-none text-xs font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleApplyMigration}
                      disabled={!migrationName.trim()}
                      className="px-4 py-2 bg-stone-950 hover:bg-stone-900 disabled:bg-stone-300 text-white rounded-xl text-xs font-black uppercase shrink-0 cursor-pointer"
                    >
                      {lang === 'FR' ? 'Appliquer' : 'Apply'}
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-[10px] text-stone-500 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={migrationCompatible}
                      onChange={(e) => setMigrationCompatible(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>{lang === 'FR' ? 'Garantir la rétrocompatibilité (Zéro downtime)' : 'Enforce backward compatibility (Guarantees zero-downtime rolling)'}</span>
                  </label>
                </div>

                {/* Migrations applied list */}
                <div className="space-y-2 border-t border-stone-100 pt-3">
                  <span className="font-mono text-[9px] font-black text-stone-400 uppercase tracking-widest block">
                    {lang === 'FR' ? 'MIGRATIONS ENREGISTRÉES' : 'REGISTERED SCHEMA HISTORY'}
                  </span>
                  <div className="space-y-1.5 h-24 overflow-y-auto">
                    {deployDashboard?.migrations?.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-2 bg-stone-50 border border-stone-150 rounded-xl text-[10.5px] font-mono leading-none">
                        <div className="space-y-0.5">
                          <span className="font-bold text-stone-800 block truncate max-w-xs">{m.name}</span>
                          <span className="text-[9px] text-stone-400">{new Date(m.appliedAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md ${m.status === 'applied' ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' : 'bg-stone-100 text-stone-500'}`}>
                            {m.status.toUpperCase()}
                          </span>
                          {m.status === 'applied' && (
                            <button
                              type="button"
                              onClick={() => handleRollbackMigration(m.id)}
                              className="text-rose-600 hover:text-rose-800 text-[9px] font-bold uppercase hover:underline"
                            >
                              Rollback
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cache Layer & PITR Disaster Recovery */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Cache Purge cluster console */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4 shadow-xs text-left">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-stone-700" />
                    <h3 className="font-sans font-black text-sm text-stone-900 tracking-tight uppercase">
                      {lang === 'FR' ? 'Gestion des Couches de Cache Cluster' : 'Caching Cluster Management'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePurgeCache('all')}
                    className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    {lang === 'FR' ? 'PURGER TOUT' : 'PURGE ALL LAYERS'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'api_responses', label: 'API Responses Gateway', hits: '94%', size: '3.4 MB', count: 142 },
                    { id: 'ai_selective_cache', label: 'AI Selective Context Cache', hits: '88%', size: '18.2 MB', count: 48 },
                    { id: 'user_sessions', label: 'Client User Session Store', hits: '99%', size: '0.8 MB', count: 280 },
                    { id: 'candidate_cv_meta', label: 'Candidate Profile Index Cache', hits: '91%', size: '5.1 MB', count: 115 }
                  ].map((cache) => (
                    <div key={cache.id} className="p-3.5 bg-stone-50 border border-stone-150 rounded-2xl flex flex-col justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-bold text-stone-800 text-[11px] block leading-snug">{cache.label}</span>
                        <div className="flex justify-between font-mono text-[9px] text-stone-400 font-semibold">
                          <span>HITS: {cache.hits}</span>
                          <span>{cache.count} keys</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-[10px] font-semibold">
                        <span className="text-stone-400 font-mono text-[9px]">{cache.size}</span>
                        <button
                          type="button"
                          onClick={() => handlePurgeCache(cache.id)}
                          className="text-stone-600 hover:text-stone-950 font-bold uppercase text-[9px] tracking-wide"
                        >
                          Purge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: PITR Snapshots & Backup */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4 shadow-xs text-left">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-stone-700" />
                    <h3 className="font-sans font-black text-sm text-stone-900 tracking-tight uppercase">
                      {lang === 'FR' ? 'Sauvegarde & Reprise après Sinistre' : 'PITR & Disaster Recovery'}
                    </h3>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCreateBackup('incremental')}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-250 text-stone-700 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      {lang === 'FR' ? 'Incremental' : 'Incr Backup'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateBackup('full')}
                      className="px-2.5 py-1 bg-stone-950 hover:bg-stone-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer shadow-xs"
                    >
                      {lang === 'FR' ? 'Full Back' : 'Full Backup'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-[9px] font-black text-stone-400 uppercase tracking-widest block">
                    {lang === 'FR' ? 'INSTANTANÉS DE BASE PITR DISPONIBLES' : 'PITR SNAPSHOT ARCHIVES'}
                  </span>
                  <div className="space-y-1.5 h-36 overflow-y-auto">
                    {deployDashboard?.backups?.map((b: any) => (
                      <div key={b.id} className="p-2.5 bg-stone-50 border border-stone-150 rounded-xl font-mono text-[10px] space-y-1.5 leading-snug">
                        <div className="flex justify-between font-bold">
                          <span className="text-stone-800">{b.id}</span>
                          <span className="text-stone-400 uppercase text-[8.5px]">{b.type}</span>
                        </div>
                        <div className="text-[9px] text-stone-500 flex justify-between">
                          <span>SIZE: {b.size}</span>
                          <span>{new Date(b.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-[8.5px] text-stone-400 truncate flex justify-between gap-4">
                          <span>SHA-256: {b.checksum}</span>
                          <button
                            type="button"
                            onClick={() => handleRestoreBackup(b.id)}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold uppercase text-[9px] tracking-wide shrink-0 font-sans"
                          >
                            Restore Snapshot
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {isSuperAdmin && publishStep !== 'edit' && (
          <div className="bg-stone-50 border-2 border-stone-900 p-6 rounded-3xl space-y-6 shadow-md animate-fade-in">
            <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h3 className="font-sans font-black text-base text-stone-900 tracking-tight">
                {lang === 'FR' ? 'PROTOCOLE DE PUBLICATION DE LA PLATEFORME' : 'PLATFORM RELEASE SECURITY FLOW'}
              </h3>
            </div>

            {/* Steps Progress Visualizer */}
            <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wide border-b border-stone-150 pb-4">
              <div className={`flex items-center gap-2 ${publishStep === 'preview' ? 'text-stone-950' : 'text-stone-400'}`}>
                <span className="w-5 h-5 rounded-full bg-stone-950 text-white flex items-center justify-center text-[10px]">1</span>
                <span>{lang === 'FR' ? 'Validation' : 'Validation Check'}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-350" />
              <div className={`flex items-center gap-2 ${publishStep === 'validate' ? 'text-stone-950' : 'text-stone-400'}`}>
                <span className="w-5 h-5 rounded-full bg-stone-950 text-white flex items-center justify-center text-[10px]">2</span>
                <span>{lang === 'FR' ? 'Approbation' : 'Approve & Release'}</span>
              </div>
            </div>

            {/* STEP 1: PREVIEW & INITIATE VALIDATION */}
            {publishStep === 'preview' && (
              <div className="space-y-4">
                <p className="text-xs text-stone-600 leading-normal">
                  {lang === 'FR' 
                    ? 'Vous vous apprêtez à générer une nouvelle révision globale de la configuration de SHANA. Veuillez confirmer la validité technique de votre brouillon avant publication.' 
                    : 'You are submitting a live platform release build. Press Continue to initiate compliance checks on your draft edits.'}
                </p>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPublishStep('edit')}
                    className="px-4 py-2 border border-stone-250 text-stone-600 rounded-xl text-xs font-bold uppercase hover:bg-stone-100 cursor-pointer"
                  >
                    {lang === 'FR' ? 'Retour aux éditeurs' : 'Go back'}
                  </button>
                  <button
                    type="button"
                    onClick={handleValidateDraft}
                    className="px-5 py-2 bg-stone-950 hover:bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wide cursor-pointer flex items-center gap-2"
                  >
                    <span>{lang === 'FR' ? 'Lancer les tests de conformité' : 'Run validation tests'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SHOW VALIDATION ERRORS & AUDIT INPUT */}
            {publishStep === 'validate' && (
              <form onSubmit={handlePublishSubmit} className="space-y-4">
                
                {/* Result check block */}
                {validationErrors.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-emerald-950 uppercase">{lang === 'FR' ? 'CONFORMITÉ VALIDÉE' : 'COMPLIANCE CHECKS PASSED'}</h4>
                      <p className="text-[11px] text-emerald-700 leading-relaxed mt-1">
                        {lang === 'FR' 
                          ? 'Tous les variables de configurations respectent les seuils de tolérance imposés par le backend de SHANA.' 
                          : 'Platform configurations are compliant with target boundary thresholds.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-red-950">
                      <AlertOctagon className="w-5 h-5" />
                      <h4 className="font-bold text-xs uppercase">{lang === 'FR' ? 'ERREURS DE SÉCURITÉ CONSTATÉES' : 'VALIDATION ERRORS DETECTED'}</h4>
                    </div>
                    <ul className="list-disc pl-4 text-[11px] text-red-700 space-y-1">
                      {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                {/* Audit comments field */}
                {validationErrors.length === 0 && (
                  <div className="space-y-2">
                    <label className="font-bold text-xs text-stone-700 uppercase tracking-wide block">
                      {lang === 'FR' ? 'Motif de modification de la production (Obligatoire)' : 'Change Management Justification Comment'}
                    </label>
                    <textarea
                      required
                      value={publishComment}
                      onChange={(e) => setPublishComment(e.target.value)}
                      rows={3}
                      placeholder={lang === 'FR' ? "Décrivez brièvement pourquoi vous modifiez la configuration en direct..." : "Describe why you are pushing this production revision..."}
                      className="w-full bg-white border border-stone-250 rounded-xl text-xs px-3.5 py-2.5 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPublishStep('edit')}
                    className="px-4 py-2 border border-stone-250 text-stone-600 rounded-xl text-xs font-bold uppercase hover:bg-stone-100 cursor-pointer"
                  >
                    {lang === 'FR' ? 'Annuler' : 'Discard Release'}
                  </button>
                  
                  {validationErrors.length === 0 && (
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wide cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      <span>{lang === 'FR' ? 'Signer et Publier en Direct' : 'Sign & Deploy to Production'}</span>
                    </button>
                  )}
                </div>
              </form>
            )}

          </div>
        )}

        {/* SECTION 9: FEATURE FLAGS & EXPERIMENTATION SYSTEM (PHASE 19) */}
        {activeTab === 'experimentation' && (
          <div className="space-y-6 text-left animate-fade-in">
            {/* Header section with live summaries */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-stone-200 p-6 rounded-3xl shadow-xs">
              <div>
                <h2 className="font-sans font-black text-xl text-stone-900 tracking-tight flex items-center gap-2">
                  <FlaskConical className="w-6 h-6 text-indigo-600 animate-pulse" />
                  <span>{lang === 'FR' ? 'Expérimentations de Production & Flags' : 'Production Experiments & Live Flags'}</span>
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  {lang === 'FR' 
                    ? 'Déployez des fonctionnalités à l’aide de rollouts progressifs et comparez l’efficacité des prompts ou modèles d’IA.' 
                    : 'Safely rollout system behaviors with targeted user constraints, and monitor real-time A/B analytics.'}
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateFlagModal}
                disabled={!isSuperAdmin}
                className="px-4 py-2.5 bg-stone-950 hover:bg-stone-850 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'FR' ? 'Créer un Nouveau Flag' : 'Create Live Flag'}</span>
              </button>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Live Feature Flags (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-stone-200 p-5 rounded-3xl space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h3 className="font-bold text-xs uppercase text-stone-500 tracking-wider">
                      {lang === 'FR' ? 'Drapeaux Actifs' : 'Registered Live Flags'}
                    </h3>
                    <span className="font-mono text-[10px] font-black bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                      {prodFlags.length}
                    </span>
                  </div>

                  {prodFlagsLoading ? (
                    <div className="py-12 text-center text-xs text-stone-400 font-semibold flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-stone-300" />
                      <span>{lang === 'FR' ? 'Chargement de la production...' : 'Fetching live flag registry...'}</span>
                    </div>
                  ) : prodFlags.length === 0 ? (
                    <div className="py-12 text-center text-xs text-stone-400 font-medium border-2 border-dashed border-stone-100 rounded-2xl">
                      {lang === 'FR' ? 'Aucun drapeau dynamique enregistré.' : 'No production feature flags registered.'}
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                      {prodFlags.map((flag: any) => {
                        const isSelected = selectedFlagIdForExperiment === flag.id;
                        return (
                          <div 
                            key={flag.id} 
                            className={`p-4 border rounded-2xl transition-all space-y-3.5 relative ${
                              isSelected 
                                ? 'bg-indigo-50/40 border-indigo-200 shadow-xs' 
                                : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-black text-xs text-stone-900 tracking-tight">
                                    {flag.feature_name}
                                  </span>
                                  {flag.isExperiment && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[9px] font-black uppercase rounded-sm font-mono">
                                      <FlaskConical className="w-2.5 h-2.5" />
                                      EXP
                                    </span>
                                  )}
                                  <span className="text-[10px] bg-stone-200 px-1.5 py-0.2 font-mono text-stone-600 rounded">
                                    v{flag.version}
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone-500 font-medium leading-relaxed pr-8">
                                  {flag.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditFlagModal(flag)}
                                  disabled={!isSuperAdmin}
                                  className="p-1.5 text-stone-400 hover:text-stone-700 bg-white border border-stone-200 rounded-lg shadow-2xs hover:bg-stone-50 transition-colors cursor-pointer animate-fade-in"
                                  title="Edit properties"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProdFlag(flag.id)}
                                  disabled={!isSuperAdmin}
                                  className="p-1.5 text-stone-400 hover:text-red-600 bg-white border border-stone-200 rounded-lg shadow-2xs hover:bg-red-50 transition-colors cursor-pointer animate-fade-in"
                                  title="Delete flag"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Rollout slider indicator */}
                            {flag.status === 'CONTROLLED' && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 font-mono">
                                  <span>{lang === 'FR' ? 'ROLLOUT DE PRODUCTION' : 'PRODUCTION ROLLOUT'}</span>
                                  <span className="text-stone-600 font-black">{flag.rollout_percentage}%</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${flag.rollout_percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Metadata row */}
                            <div className="flex items-center justify-between pt-1 flex-wrap gap-2 text-[10px] font-bold text-stone-400 font-mono border-t border-stone-100/60">
                              <div className="flex items-center gap-1.5">
                                <span>ENV:</span>
                                <span className={`uppercase font-black px-1 py-0.2 rounded-xs ${
                                  flag.environment === 'production' 
                                    ? 'bg-red-50 text-red-700 border border-red-100' 
                                    : flag.environment === 'staging'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : flag.environment === 'development'
                                    ? 'bg-sky-50 text-sky-700 border border-sky-100'
                                    : 'bg-stone-100 text-stone-700'
                                }`}>
                                  {flag.environment}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <span>STATUS:</span>
                                <div className="flex items-center border border-stone-250 bg-white rounded-lg overflow-hidden shrink-0">
                                  {['ON', 'OFF', 'CONTROLLED'].map((st: any) => (
                                    <button
                                      key={st}
                                      type="button"
                                      disabled={!isSuperAdmin}
                                      onClick={() => handleToggleProdFlagStatus(flag.id, flag.status, st)}
                                      className={`px-1.5 py-0.5 text-[8px] font-black tracking-tight transition-colors cursor-pointer ${
                                        flag.status === st 
                                          ? st === 'ON'
                                            ? 'bg-emerald-500 text-white'
                                            : st === 'OFF'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-indigo-600 text-white'
                                          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Analyze button for experiments */}
                            {flag.isExperiment && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFlagIdForExperiment(flag.id);
                                  fetchExperimentSummary(flag.id);
                                }}
                                className={`w-full py-2 border rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                  isSelected 
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' 
                                    : 'bg-white hover:bg-stone-100 text-indigo-600 border-indigo-200'
                                }`}
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>{lang === 'FR' ? 'Analyser les Métriques A/B' : 'Analyze A/B Metrics'}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Experiment Metrics & Real-Time summary (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6 shadow-xs min-h-[400px]">
                  
                  {!selectedFlagIdForExperiment ? (
                    <div className="h-[350px] flex flex-col items-center justify-center text-center text-stone-400 space-y-2">
                      <FlaskConical className="w-12 h-12 text-stone-300 stroke-[1.5]" />
                      <h4 className="font-bold text-xs text-stone-700 uppercase tracking-wide">
                        {lang === 'FR' ? 'Aucune Expérimentation Sélectionnée' : 'No Experiment Selected'}
                      </h4>
                      <p className="text-[11px] text-stone-400 font-semibold max-w-sm">
                        {lang === 'FR' 
                          ? 'Sélectionnez un test A/B dans la colonne de gauche pour analyser ses indicateurs d’engagement, de rétention et de latence.' 
                          : 'Select an active experiment flag on the left to review telemetry stats, sample sizes, and response rates.'}
                      </p>
                    </div>
                  ) : experimentSummaryLoading ? (
                    <div className="h-[350px] flex flex-col items-center justify-center text-center text-stone-400 space-y-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-stone-300" />
                      <span className="text-xs font-semibold">{lang === 'FR' ? 'Calcul des indicateurs statistiques...' : 'Compiling analytical aggregates...'}</span>
                    </div>
                  ) : !experimentSummary ? (
                    <div className="h-[350px] flex flex-col items-center justify-center text-center text-stone-400 space-y-2">
                      <Activity className="w-12 h-12 text-stone-300 stroke-[1.5]" />
                      <h4 className="font-bold text-xs text-stone-700 uppercase tracking-wide">
                        {lang === 'FR' ? 'Données Télémétriques Manquantes' : 'Telemetry Data Empty'}
                      </h4>
                      <p className="text-[11px] text-stone-400 font-semibold max-w-sm">
                        {lang === 'FR' 
                          ? `Le test A/B '${selectedFlagIdForExperiment}' n'a pas encore recueilli de logs d'utilisation. Lancez une simulation pour peupler les charts.` 
                          : `The experiment flag '${selectedFlagIdForExperiment}' has not captured active sessions yet. Perform interview actions to seed results.`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      {/* Active monitoring header */}
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <div>
                          <h3 className="font-black text-sm text-stone-900 tracking-tight uppercase">
                            {lang === 'FR' ? 'Analyse A/B :' : 'A/B Experimentation :'} {selectedFlagIdForExperiment}
                          </h3>
                          <span className="text-[10px] font-mono text-stone-400 font-black">
                            ACTIVE ENGINE REVISION: v{experimentSummary.version}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-black bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                          {experimentSummary.totalLogs} {lang === 'FR' ? 'échantillons' : 'sessions logged'}
                        </span>
                      </div>

                      {/* Group Splitting Bento Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Group A */}
                        <div className="p-4 bg-indigo-50/20 border border-indigo-100 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-indigo-600 text-white rounded">GROUP A</span>
                            <span className="text-xs font-bold text-stone-700">N={experimentSummary.groups.A?.count || 0}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-stone-400 uppercase font-mono block">CONFIG PRESET:</span>
                            <pre className="font-mono text-[9px] text-stone-600 bg-white/70 border border-indigo-50 p-1.5 rounded overflow-x-auto max-h-[80px]">
                              {JSON.stringify(prodFlags.find(f => f.id === selectedFlagIdForExperiment)?.experimentConfig?.groupAConfig || {}, null, 1)}
                            </pre>
                          </div>
                        </div>

                        {/* Group B */}
                        <div className="p-4 bg-purple-50/20 border border-purple-100 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-purple-600 text-white rounded">GROUP B</span>
                            <span className="text-xs font-bold text-stone-700">N={experimentSummary.groups.B?.count || 0}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-stone-400 uppercase font-mono block">CONFIG PRESET:</span>
                            <pre className="font-mono text-[9px] text-stone-600 bg-white/70 border border-purple-50 p-1.5 rounded overflow-x-auto max-h-[80px]">
                              {JSON.stringify(prodFlags.find(f => f.id === selectedFlagIdForExperiment)?.experimentConfig?.groupBConfig || {}, null, 1)}
                            </pre>
                          </div>
                        </div>

                        {/* Control */}
                        <div className="p-4 bg-stone-100/40 border border-stone-200 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-stone-700 text-white rounded">CONTROL</span>
                            <span className="text-xs font-bold text-stone-700">N={experimentSummary.groups.control?.count || 0}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-stone-400 uppercase font-mono block">CONFIG PRESET:</span>
                            <pre className="font-mono text-[9px] text-stone-600 bg-white/70 border border-stone-150 p-1.5 rounded overflow-x-auto max-h-[80px]">
                              {JSON.stringify(prodFlags.find(f => f.id === selectedFlagIdForExperiment)?.experimentConfig?.controlConfig || {}, null, 1)}
                            </pre>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Metrics Comparison Chart (HTML progress bars) */}
                      <div className="space-y-5 bg-stone-50 border border-stone-200 p-5 rounded-2xl">
                        <h4 className="font-bold text-xs uppercase text-stone-600 tracking-wider">
                          {lang === 'FR' ? 'Comparatifs de Performance en Temps Réel' : 'Real-Time Impact Metrics'}
                        </h4>
                        
                        <div className="space-y-4">
                          {prodFlags.find(f => f.id === selectedFlagIdForExperiment)?.experimentConfig?.metricKeys.map((metricKey: string) => {
                            const valA = experimentSummary.groups.A?.metrics?.[metricKey]?.avg || 0;
                            const valB = experimentSummary.groups.B?.metrics?.[metricKey]?.avg || 0;
                            const valControl = experimentSummary.groups.control?.metrics?.[metricKey]?.avg || 0;

                            // Calculate maximum value to scale the bars proportionally
                            const maxVal = Math.max(valA, valB, valControl, 1);
                            const getPct = (val: number) => Math.min((val / maxVal) * 100, 100);

                            return (
                              <div key={metricKey} className="space-y-2 border-b border-stone-200/50 pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between font-mono text-[10px] font-black text-stone-700">
                                  <span>{metricKey.toUpperCase()}</span>
                                  <span className="text-indigo-600">MAX: {maxVal.toFixed(1)}</span>
                                </div>

                                <div className="space-y-1.5 text-[10px] font-bold text-stone-600">
                                  {/* Group A Row */}
                                  <div className="flex items-center gap-3">
                                    <span className="w-16 font-mono text-stone-400 text-left">GROUP A</span>
                                    <div className="flex-1 bg-white border border-stone-200 h-4.5 rounded-md overflow-hidden relative flex items-center">
                                      <div 
                                        className="bg-indigo-600 h-full transition-all duration-500" 
                                        style={{ width: `${getPct(valA)}%` }}
                                      />
                                      <span className="absolute left-2 text-[9px] text-stone-900 font-extrabold font-mono">
                                        {valA.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Group B Row */}
                                  <div className="flex items-center gap-3">
                                    <span className="w-16 font-mono text-stone-400 text-left">GROUP B</span>
                                    <div className="flex-1 bg-white border border-stone-200 h-4.5 rounded-md overflow-hidden relative flex items-center">
                                      <div 
                                        className="bg-purple-600 h-full transition-all duration-500" 
                                        style={{ width: `${getPct(valB)}%` }}
                                      />
                                      <span className="absolute left-2 text-[9px] text-stone-900 font-extrabold font-mono">
                                        {valB.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Control Row */}
                                  <div className="flex items-center gap-3">
                                    <span className="w-16 font-mono text-stone-400 text-left">CONTROL</span>
                                    <div className="flex-1 bg-white border border-stone-200 h-4.5 rounded-md overflow-hidden relative flex items-center">
                                      <div 
                                        className="bg-stone-500 h-full transition-all duration-500" 
                                        style={{ width: `${getPct(valControl)}%` }}
                                      />
                                      <span className="absolute left-2 text-[9px] text-stone-900 font-extrabold font-mono">
                                        {valControl.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Rollback Failure Reasons & Safety Logs Card */}
                <div className="bg-white border border-stone-200 p-5 rounded-3xl space-y-4 shadow-xs text-left">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h3 className="font-bold text-xs uppercase text-stone-500 tracking-wider">
                      {lang === 'FR' ? 'Journal des Désactivations & Rollbacks' : 'Safety Rollback logs'}
                    </h3>
                    <span className="font-mono text-[9px] font-bold text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded border border-red-100">
                      {lang === 'FR' ? 'Actif' : 'Secure Vault'}
                    </span>
                  </div>

                  {rollbackLogs.length === 0 ? (
                    <p className="text-[11px] text-stone-400 font-medium text-center py-4">
                      {lang === 'FR' ? "Aucun rollback d'urgence enregistré." : "No emergency features rollbacks on record."}
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                      {rollbackLogs.map((log: any) => (
                        <div key={log.id} className="p-3 bg-red-50/30 border border-red-100 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center justify-between font-mono text-[10px] font-black">
                            <span className="text-red-900 uppercase font-mono">FLAG_OFF: {log.flagId}</span>
                            <span className="text-stone-400">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-[11px] text-stone-700 font-semibold italic leading-relaxed">
                            "{log.reason}"
                          </p>
                          <div className="text-[9px] font-bold text-stone-400 font-mono flex items-center justify-between">
                            <span>BY: {log.performedBy}</span>
                            <span>ID: {log.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* MODAL 1: CREATE / EDIT LIVE FEATURE FLAG */}
        {isFlagModalOpen && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
            <div className="bg-white border border-stone-250 w-full max-w-2xl rounded-3xl shadow-xl p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto my-8">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-sans font-black text-base text-stone-900 tracking-tight flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <span>{editingFlag ? (lang === 'FR' ? 'Modifier le Drapeau' : 'Edit Live Flag') : (lang === 'FR' ? 'Créer un Drapeau Dynamique' : 'Register New Live Flag')}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFlagModalOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFlagSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-xs text-stone-700 uppercase tracking-wide block">
                      {lang === 'FR' ? 'Identifiant du Flag (Clé unique)' : 'Flag Key / Feature Name'}
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingFlag}
                      placeholder="e.g. enhanced_voice_mode"
                      value={formFlagId}
                      onChange={(e) => setFormFlagId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl text-xs px-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-stone-400 disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-xs text-stone-700 uppercase tracking-wide block">
                      {lang === 'FR' ? 'Version de Fonctionnalité' : 'Feature Semantic Version'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1.0.0"
                      value={formFlagVersion}
                      onChange={(e) => setFormFlagVersion(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl text-xs px-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-stone-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-xs text-stone-700 uppercase tracking-wide block">
                    {lang === 'FR' ? 'Description d’utilisation' : 'Operational Description'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'FR' ? "Quel module ce flag protège-t-il ?" : "What structural module does this flag gate?"}
                    value={formFlagDesc}
                    onChange={(e) => setFormFlagDesc(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl text-xs px-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-stone-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-xs text-stone-700 uppercase tracking-wide block">
                      {lang === 'FR' ? 'Statut du Flag' : 'Operational Status'}
                    </label>
                    <select
                      value={formFlagStatus}
                      onChange={(e: any) => setFormFlagStatus(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:bg-white focus:border-stone-400 cursor-pointer"
                    >
                      <option value="ON">ON (Enabled Globally)</option>
                      <option value="OFF">OFF (Disabled Globally)</option>
                      <option value="CONTROLLED">CONTROLLED (Targeted Rollout)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-xs text-stone-700 uppercase tracking-wide block">
                      {lang === 'FR' ? 'Environnement requis' : 'Target Environment'}
                    </label>
                    <select
                      value={formFlagEnv}
                      onChange={(e: any) => setFormFlagEnv(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:bg-white focus:border-stone-400 cursor-pointer"
                    >
                      <option value="all">All Environments</option>
                      <option value="production">Production Only</option>
                      <option value="staging">Staging Only</option>
                      <option value="development">Development Only</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-xs text-stone-700 uppercase tracking-wide block">
                      {lang === 'FR' ? 'Pourcentage de Rollout' : 'Rollout Percentage'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        disabled={formFlagStatus !== 'CONTROLLED'}
                        value={formFlagRollout}
                        onChange={(e) => setFormFlagRollout(Number(e.target.value))}
                        className="flex-1 h-2 bg-stone-150 rounded-lg appearance-none cursor-pointer disabled:opacity-40"
                      />
                      <span className="font-mono text-xs font-black shrink-0 w-8 text-right">{formFlagRollout}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-xs text-stone-700 uppercase tracking-wide block flex items-center justify-between">
                    <span>{lang === 'FR' ? 'Utilisateurs ciblés d’exception (Séquence séparée par virgule)' : 'Targeted Allowlist Users (Comma-separated emails)'}</span>
                    <span className="text-[10px] text-stone-400 normal-case">{lang === 'FR' ? 'Bypasse le pourcentage de rollout' : 'Bypasses the percentage threshold'}</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. eocochat@gmail.com, candidate@shana.ai"
                    value={formFlagUsers}
                    onChange={(e) => setFormFlagUsers(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl text-xs px-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-stone-400"
                  />
                </div>

                {/* Experimentation checkbox */}
                <div className="p-4 bg-indigo-50/25 border border-indigo-100 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs text-indigo-950 uppercase">{lang === 'FR' ? 'Activer le test A/B (Expérimentation)' : 'Enable A/B Testing Experiment'}</h4>
                    <p className="text-[10px] text-indigo-600 font-semibold leading-relaxed">
                      {lang === 'FR' ? 'Distribue aléatoirement les utilisateurs éligibles entre le Groupe A, Groupe B et le Contrôle.' : 'Assigns eligible sessions into distinct buckets to compare prompt or model architectures.'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formFlagIsExperiment}
                    onChange={(e) => setFormFlagIsExperiment(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Advanced Experimentation Configurations */}
                {formFlagIsExperiment && (
                  <div className="space-y-4 border-t border-stone-150 pt-4 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="font-bold text-xs text-stone-700 uppercase tracking-wide block">
                        {lang === 'FR' ? 'Clés de métriques à collecter (séparées par virgule)' : 'Metric keys to aggregate (comma-separated)'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ips_improvement, latency_ms, completion_rate"
                        value={formMetricKeys}
                        onChange={(e) => setFormMetricKeys(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl text-xs px-3.5 py-2.5 focus:outline-none focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] font-black text-indigo-800 uppercase block">GROUP A CONFIG (JSON)</span>
                        <textarea
                          rows={6}
                          value={formGroupAConfig}
                          onChange={(e) => setFormGroupAConfig(e.target.value)}
                          className="w-full font-mono text-[10px] bg-stone-50 border border-stone-200 p-2 rounded-xl focus:outline-none focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="font-mono text-[9px] font-black text-purple-800 uppercase block">GROUP B CONFIG (JSON)</span>
                        <textarea
                          rows={6}
                          value={formGroupBConfig}
                          onChange={(e) => setFormGroupBConfig(e.target.value)}
                          className="w-full font-mono text-[10px] bg-stone-50 border border-stone-200 p-2 rounded-xl focus:outline-none focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="font-mono text-[9px] font-black text-stone-800 uppercase block">CONTROL GROUP CONFIG (JSON)</span>
                        <textarea
                          rows={6}
                          value={formControlConfig}
                          onChange={(e) => setFormControlConfig(e.target.value)}
                          className="w-full font-mono text-[10px] bg-stone-50 border border-stone-200 p-2 rounded-xl focus:outline-none focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsFlagModalOpen(false)}
                    className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-500 uppercase hover:bg-stone-50 cursor-pointer"
                  >
                    {lang === 'FR' ? 'Fermer' : 'Discard'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                  >
                    {lang === 'FR' ? 'Enregistrer en Direct' : 'Persist Flag Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: ROLLBACK REASON MODAL (MANDATORY ON DEACTIVATION) */}
        {isRollbackReasonModalOpen && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-stone-250 w-full max-w-md rounded-3xl shadow-xl p-6 space-y-4 text-left">
              <div className="flex items-center gap-2 text-red-700">
                <AlertOctagon className="w-6 h-6 shrink-0" />
                <h3 className="font-sans font-black text-base tracking-tight text-stone-900 uppercase">
                  {lang === 'FR' ? 'Désactivation d’urgence déclenchée' : 'Emergency Rollback Triggered'}
                </h3>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                  {lang === 'FR' 
                    ? `Vous vous apprêtez à désactiver instantanément le flag '${rollbackFlagId}' pour tous les utilisateurs. Un justificatif technique est obligatoire.` 
                    : `You are pulling the master plug on flag '${rollbackFlagId}'. A clear, descriptive operational failure reason must be logged.`}
                </p>

                <textarea
                  required
                  rows={4}
                  value={rollbackReasonText}
                  onChange={(e) => setRollbackReasonText(e.target.value)}
                  placeholder={lang === 'FR' ? "e.g. Pic de latence de +3s constaté en production ou échec d'évaluation sur Gemini" : "e.g. Critical 429 quota exhaustion detected on Gemini Flash fallback path"}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl text-xs p-3 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRollbackReasonModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-500 uppercase hover:bg-stone-50 cursor-pointer"
                >
                  {lang === 'FR' ? 'Annuler' : 'Abort'}
                </button>
                <button
                  type="button"
                  onClick={handleRollbackSubmit}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  {lang === 'FR' ? 'Couper le Flux (OFF)' : 'Force Kill Feature (OFF)'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
