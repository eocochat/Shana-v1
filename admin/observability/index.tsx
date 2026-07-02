import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  AlertCircle, 
  RefreshCw, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  Check, 
  Play, 
  Clock, 
  Search, 
  ExternalLink, 
  Flame, 
  Shield, 
  Server, 
  Database, 
  Layers, 
  BrainCircuit, 
  CreditCard, 
  Send,
  Eye,
  Settings,
  AlertTriangle,
  Info,
  Sliders,
  Sparkles,
  Archive,
  Download,
  Wifi
} from 'lucide-react';

interface ObservabilityCenterProps {
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    role: 'candidate' | 'admin' | 'super_admin';
    email: string;
  };
  lang?: 'FR' | 'EN';
}

export default function ObservabilityCenter({ currentUser, lang = 'FR' }: ObservabilityCenterProps) {
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // State Management
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'errors' | 'api' | 'stripe' | 'openai' | 'health' | 'jobs' | 'realtime'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSynced, setLastSynced] = useState<string>('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobMetrics, setJobMetrics] = useState<any>(null);
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [jobStatusFilter, setJobStatusFilter] = useState('all');
  const [jobSearch, setJobSearch] = useState('');
  const [isTriggeringJob, setIsTriggeringJob] = useState(false);
  const [mockJobType, setMockJobType] = useState('cv_parsing');
  const [mockPriority, setMockPriority] = useState('Normal');
  const [mockSimulateFailure, setMockSimulateFailure] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState<string | null>(null);

  // Real-time Gateway dashboard states
  const [rtMetrics, setRtMetrics] = useState<any>(null);
  const [rtConnections, setRtConnections] = useState<any[]>([]);
  const [rtSearch, setRtSearch] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [streamSessionId, setStreamSessionId] = useState('sess_rt_demo');
  const [streamType, setStreamType] = useState('question');
  const [streamText, setStreamText] = useState('Welcome to your low-latency real-time AI guidance engine. Observe how responses flow seamlessly across the socket.');
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Real-time overview metrics
  const [metrics, setMetrics] = useState({
    activeUsers: 3,
    activeInterviews: 1,
    requestsPerMinute: 4.2,
    errorRate: 1.5,
    paymentSuccessRate: 93.3,
    aiResponseLatencyMs: 620,
    systemStatus: 'healthy' as 'healthy' | 'degraded' | 'down'
  });

  // Logs & filters
  const [logs, setLogs] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [logServiceFilter, setLogServiceFilter] = useState('all');
  const [logSeverityFilter, setLogSeverityFilter] = useState('all');

  // Errors & actions
  const [errors, setErrors] = useState<any[]>([]);
  const [viewingErrorDetails, setViewingErrorDetails] = useState<any | null>(null);

  // API Usage Records
  const [usageSummary, setUsageSummary] = useState<any>({
    requestsPerMinute: 0,
    totalRequestsAllTime: 0,
    successRateOverall: 100,
    successRateOpenAI: 100,
    successRateStripe: 100,
    successRateInternal: 100,
    latencyOpenAI: 0,
    latencyStripe: 0,
    latencyInternal: 0,
    totalCostEstimated: 0.00,
    openaiCostEstimated: 0.00,
    stripeCostEstimated: 0.00
  });
  const [usageRecords, setUsageRecords] = useState<any[]>([]);

  // Provider events
  const [stripeEvents, setStripeEvents] = useState<any[]>([]);
  const [openaiEvents, setOpenaiEvents] = useState<any[]>([]);

  // Health report
  const [healthReport, setHealthReport] = useState<any>(null);

  // Success Test trigger loaders
  const [simulatingError, setSimulatingError] = useState(false);
  const [simulatingStripeFail, setSimulatingStripeFail] = useState(false);
  const [simulatingOpenAISpike, setSimulatingOpenAISpike] = useState(false);

  // Banner Alerts State (Computed or dynamic)
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  // Real-time server-side tracking states
  const [serverAlerts, setServerAlerts] = useState<any[]>([]);
  const [aiDailySummaries, setAiDailySummaries] = useState<any[]>([]);
  const [aiMonthlySummaries, setAiMonthlySummaries] = useState<any[]>([]);
  const [performancePercentiles, setPerformancePercentiles] = useState<any | null>(null);


  const dict = {
    title: lang === 'FR' ? "Observability Center (Supervision Platforme)" : "Observability Center (Platform Supervision)",
    subtitle: lang === 'FR' ? "Télémétrie en temps réel, diagnostic d'erreurs, performance IA et transactions financières." : "Real-time telemetry, error tracking, AI performance and transactional telemetry.",
    syncing: lang === 'FR' ? "Synchronisation..." : "Syncing...",
    syncedAt: lang === 'FR' ? "Dernière synchro :" : "Last synced:",
    manualSync: lang === 'FR' ? "Actualiser" : "Refresh Data",
    autoRefreshLabel: lang === 'FR' ? "Rafraîchir auto (15s)" : "Auto refresh (15s)",
    superAdminOnly: lang === 'FR' ? "Privilège Super Admin requis" : "Super Admin Privilege Required",
    
    // Tabs
    tabOverview: lang === 'FR' ? "Aperçu Système" : "System Overview",
    tabLogs: lang === 'FR' ? "Logs Explorer" : "Logs Explorer",
    tabErrors: lang === 'FR' ? "Erreurs & Exceptions" : "Error Monitoring",
    tabApi: lang === 'FR' ? "Usage API & Métriques" : "API Usage Dashboard",
    tabStripe: lang === 'FR' ? "Paiements (Stripe)" : "Payments (Stripe)",
    tabOpenai: lang === 'FR' ? "Performance IA" : "AI Supervision",
    tabHealth: lang === 'FR' ? "Santé Serveurs" : "System Health",
    tabJobs: lang === 'FR' ? "Tâches Asynchrones (Queue)" : "Background Jobs (Queue)",
    tabRealTime: lang === 'FR' ? "Passerelle Temps Réel (WS)" : "Real-Time Gateway (WS)",

    // Overview Metric Labels
    activeUsers: lang === 'FR' ? "Utilisateurs Actifs" : "Active Users",
    activeInterviews: lang === 'FR' ? "Simulateurs en Cours" : "Live Interviews",
    reqPerMin: lang === 'FR' ? "Requêtes / Minute" : "Reqs / Minute",
    errRate: lang === 'FR' ? "Taux d'Erreur (1h)" : "Error Rate (Last 1h)",
    paySuccess: lang === 'FR' ? "Succès Paiements" : "Payment Success",
    aiLatency: lang === 'FR' ? "Latence Moyenne IA" : "AI Avg Latency",
    sysStatus: lang === 'FR' ? "Statut Système" : "System Status",

    // Actions
    clearLogs: lang === 'FR' ? "Purger les logs" : "Clear Logs",
    archiveError: lang === 'FR' ? "Archiver" : "Archive",
    resolveError: lang === 'FR' ? "Résoudre" : "Resolve",
    investigateError: lang === 'FR' ? "Investiguer" : "Investigate",
    reopenError: lang === 'FR' ? "Rouvrir" : "Reopen",
    simulateTrigger: lang === 'FR' ? "Simuler Événements de Test (Diagnostics)" : "Simulate Test Scenarios (Diagnostics)"
  };

  // Fetch all observability data from server
  const fetchAllData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      // 1. Fetch overview
      const overviewRes = await fetch('/api/admin/observability/overview');
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setMetrics(data.metrics);
        if (data.alerts) {
          setServerAlerts(data.alerts);
        }
      }

      // 2. Fetch Logs with filters
      const logsUrl = `/api/admin/observability/logs?service=${logServiceFilter}&severity=${logSeverityFilter}&search=${logSearch}`;
      const logsRes = await fetch(logsUrl);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs);
      }

      // 3. Fetch Errors
      const errorsRes = await fetch('/api/admin/observability/errors');
      if (errorsRes.ok) {
        const data = await errorsRes.json();
        setErrors(data.errors);
      }

      // 4. Fetch Usage
      const usageRes = await fetch('/api/admin/observability/usage');
      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsageSummary(data.summary);
        setUsageRecords(data.records);
        if (data.percentiles) {
          setPerformancePercentiles(data.percentiles);
        }
        if (data.aiSummaries) {
          setAiDailySummaries(data.aiSummaries.daily || []);
          setAiMonthlySummaries(data.aiSummaries.monthly || []);
        }
      }

      // 5. Fetch Stripe events
      const stripeRes = await fetch('/api/admin/observability/stripe');
      if (stripeRes.ok) {
        const data = await stripeRes.json();
        setStripeEvents(data.events);
      }

      // 6. Fetch OpenAI events
      const openaiRes = await fetch('/api/admin/observability/openai');
      if (openaiRes.ok) {
        const data = await openaiRes.json();
        setOpenaiEvents(data.events);
      }

      // 7. Fetch Health check report
      const healthRes = await fetch('/api/admin/observability/health');
      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealthReport(data.report);
      }

      // 8. Fetch Background Jobs
      const jobsRes = await fetch('/api/v1/admin/jobs');
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        if (data.success) {
          setJobs(data.data);
        }
      }

      // 9. Fetch Background Jobs Metrics
      const jobsMetricsRes = await fetch('/api/v1/admin/jobs/metrics');
      if (jobsMetricsRes.ok) {
        const data = await jobsMetricsRes.json();
        if (data.success) {
          setJobMetrics(data.data);
        }
      }

      // 10. Fetch Real-Time Gateway metrics
      const rtMetricsRes = await fetch('/api/v1/admin/realtime/metrics');
      if (rtMetricsRes.ok) {
        const data = await rtMetricsRes.json();
        if (data.success) {
          setRtMetrics(data.data);
        }
      }

      // 11. Fetch Active Real-Time connections
      const rtConnRes = await fetch('/api/v1/admin/realtime/connections');
      if (rtConnRes.ok) {
        const data = await rtConnRes.json();
        if (data.success) {
          setRtConnections(data.data);
        }
      }

      // Record sync timestamp
      const now = new Date();
      setLastSynced(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed fetching observability metrics:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Setup loop for auto-refresh
  useEffect(() => {
    fetchAllData();
  }, [logServiceFilter, logSeverityFilter]); // re-trigger on filters change

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAllData(true); // silent refresh
    }, 15000); // 15 seconds refresh as requested

    return () => clearInterval(interval);
  }, [autoRefresh, logServiceFilter, logSeverityFilter, logSearch]);

  // Compute Alerts dynamically based on backend state
  useEffect(() => {
    const alertsList = [];
    
    // Alert 1: High error rate (TEST 1 detection)
    const openCriticalCount = errors.filter(e => e.status === 'open' && (e.impactLevel === 'critical' || e.impactLevel === 'high')).length;
    if (openCriticalCount > 0) {
      alertsList.push({
        id: 'alert_err_rate',
        type: 'critical',
        message: lang === 'FR' 
          ? `Taux d'erreurs élevé détecté ! ${openCriticalCount} incident(s) majeur(s) actuellement en cours.` 
          : `High error rates detected! ${openCriticalCount} critical error incident(s) currently active.`,
        actionableTab: 'errors'
      });
    }

    // Alert 2: Stripe webhook failure (TEST 2 detection)
    const stripeFailCount = stripeEvents.filter(e => e.type === 'webhook_failed').length;
    if (stripeFailCount > 0) {
      alertsList.push({
        id: 'alert_stripe_webhook',
        type: 'warning',
        message: lang === 'FR'
          ? `Échec de validation de webhook Stripe détecté récemment ! Risque de perte de synchronisation des abonnements.`
          : `Stripe webhook validation failure detected! Potential risk of subscription provisioning drift.`,
        actionableTab: 'stripe'
      });
    }

    // Alert 3: OpenAI latency spike (TEST 3 detection)
    const recentLatencySpikes = openaiEvents.filter(e => e.durationMs > 5000);
    if (recentLatencySpikes.length > 0) {
      alertsList.push({
        id: 'alert_openai_spike',
        type: 'warning',
        message: lang === 'FR'
          ? `Pic de latence IA détecté : temps de réponse supérieur à 5.0 secondes (${recentLatencySpikes[0].durationMs}ms) sur l'endpoint ${recentLatencySpikes[0].endpoint}.`
          : `AI latency spike detected: response times exceeding 5.0 seconds (${recentLatencySpikes[0].durationMs}ms) on endpoint ${recentLatencySpikes[0].endpoint}.`,
        actionableTab: 'openai'
      });
    }

    // Alert 4: Missing API Key warning
    if (healthReport && (healthReport.components.integrations.openai.status === 'down' || healthReport.components.integrations.stripe.status === 'down')) {
      alertsList.push({
        id: 'alert_missing_keys',
        type: 'critical',
        message: lang === 'FR'
          ? `Identifiants ou clés d'API requis manquants dans le coffre-fort d'intégration !`
          : `Missing active API keys or environment credentials in key vault!`,
        actionableTab: 'health'
      });
    }

    setActiveAlerts(alertsList);
  }, [errors, stripeEvents, openaiEvents, healthReport, lang]);

  // Handle Error statuses
  const handleUpdateErrorStatus = async (id: string, status: 'open' | 'investigating' | 'resolved') => {
    try {
      const res = await fetch(`/api/admin/observability/errors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAllData(true);
        if (viewingErrorDetails && viewingErrorDetails.id === id) {
          setViewingErrorDetails({ ...viewingErrorDetails, status });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteError = async (id: string) => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`/api/admin/observability/errors/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setViewingErrorDetails(null);
        fetchAllData(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle system-wide dynamic alerts
  const handleUpdateAlertStatus = async (id: string, status: 'acknowledged' | 'resolved' | 'dismissed') => {
    try {
      const res = await fetch(`/api/admin/observability/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAllData(true);
      }
    } catch (err) {
      console.error('Failed to update alert status:', err);
    }
  };

  const handleClearAllAlerts = async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`/api/admin/observability/alerts/clear`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchAllData(true);
      }
    } catch (err) {
      console.error('Failed to clear alerts:', err);
    }
  };


  const handleClearAllErrors = async () => {
    if (!isSuperAdmin) return;
    if (!confirm(lang === 'FR' ? "Confirmer la purge complète du traqueur d'erreurs ?" : "Purge all error tracking records?")) return;
    try {
      const res = await fetch('/api/admin/observability/errors/clear', { method: 'POST' });
      if (res.ok) {
        setViewingErrorDetails(null);
        fetchAllData(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearLogs = async () => {
    if (!isSuperAdmin) return;
    if (!confirm(lang === 'FR' ? "Confirmer l'effacement complet des logs système ?" : "Purge all system logs?")) return;
    try {
      const res = await fetch('/api/admin/observability/logs/clear', { method: 'POST' });
      if (res.ok) {
        fetchAllData(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- SUCCESS TEST INJECTORS ---
  const handleTriggerTestError = async () => {
    setSimulatingError(true);
    try {
      const res = await fetch('/api/admin/observability/test-error', { method: 'POST' });
      if (res.ok) {
        await fetchAllData(true);
        setActiveTab('errors'); // Go straight to check error dashboard
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulatingError(false);
    }
  };

  const handleTriggerStripeFail = async () => {
    setSimulatingStripeFail(true);
    try {
      const res = await fetch('/api/admin/observability/test-stripe-fail', { method: 'POST' });
      if (res.ok) {
        await fetchAllData(true);
        setActiveTab('stripe'); // Go straight to check Stripe events
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulatingStripeFail(false);
    }
  };

  const handleTriggerOpenAISpike = async () => {
    setSimulatingOpenAISpike(true);
    try {
      const res = await fetch('/api/admin/observability/test-openai-spike', { method: 'POST' });
      if (res.ok) {
        await fetchAllData(true);
        setActiveTab('openai'); // Go straight to check OpenAI latencies
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulatingOpenAISpike(false);
    }
  };

  const handleTriggerJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTriggeringJob(true);
    try {
      const res = await fetch('/api/v1/admin/jobs/trigger-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobType: mockJobType,
          priority: mockPriority,
          simulateFailure: mockSimulateFailure
        })
      });
      if (res.ok) {
        await fetchAllData(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriggeringJob(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    setIsActionInProgress(jobId);
    try {
      const res = await fetch(`/api/v1/admin/jobs/${jobId}/retry`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchAllData(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionInProgress(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm(lang === 'FR' ? "Supprimer définitivement cet enregistrement de tâche ?" : "Permanently delete this background job registry?")) return;
    setIsActionInProgress(jobId);
    try {
      const res = await fetch(`/api/v1/admin/jobs/${jobId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchAllData(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionInProgress(null);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/v1/admin/realtime/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMsg })
      });
      if (res.ok) {
        setBroadcastMsg('');
        alert(lang === 'FR' ? "Message diffusé avec succès !" : "Global announcement broadcasted successfully!");
        await fetchAllData(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleTriggerStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStreaming(true);
    try {
      const res = await fetch('/api/v1/admin/realtime/trigger-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: streamSessionId,
          streamType,
          text: streamText
        })
      });
      if (res.ok) {
        alert(lang === 'FR' ? "Simulation de flux démarrée !" : "Real-time streaming simulation started!");
        await fetchAllData(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  // Helper to get status color
  const getStatusBadge = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 uppercase tracking-wide">HEALTHY</span>;
      case 'degraded':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800 uppercase tracking-wide">DEGRADED</span>;
      case 'down':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-800 uppercase tracking-wide">DOWN</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">{dict.title}</h2>
          </div>
          <p className="text-xs text-stone-500 font-medium max-w-2xl">{dict.subtitle}</p>
        </div>

        {/* Sync panel */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{dict.syncedAt} {lastSynced || 'Never'}</span>
          </div>

          <label className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl cursor-pointer text-xs font-bold text-stone-600 select-none">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={() => setAutoRefresh(!autoRefresh)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <span>{dict.autoRefreshLabel}</span>
          </label>

          <button
            onClick={() => fetchAllData()}
            disabled={isRefreshing}
            className="p-2 bg-stone-900 hover:bg-stone-850 text-white border border-stone-950 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SYSTEM DIAGNOSTIC REAL-TIME TEST SIMULATOR PANEL */}
      <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">{dict.simulateTrigger}</h4>
          <span className="text-[10px] font-bold text-stone-400 italic font-mono bg-white px-2 py-0.5 rounded border">DIAGNOSTICS PANEL</span>
        </div>
        <p className="text-[11px] text-stone-500 font-medium mb-3">
          {lang === 'FR' 
            ? "Déclenchez instantanément des scénarios critiques de télémétrie pour valider l'affichage de l'observabilité système en direct (Taux d'erreur, Webhooks, Latences)."
            : "Instantly trigger live critical telemetry events to test real-time observability flows and alarm hooks (Error rates, Webhooks, Latencies)."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          <button
            onClick={handleTriggerTestError}
            disabled={simulatingError}
            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-950 rounded-xl text-xs font-bold transition-all text-left flex items-start gap-3 cursor-pointer group disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <div className="font-extrabold text-[11px] uppercase tracking-wide text-rose-900">1. Trigger Test Error</div>
              <div className="text-[10px] text-rose-700 font-medium leading-tight mt-0.5">Inject unhandled JS reference exception into dashboard logs.</div>
            </div>
          </button>

          <button
            onClick={handleTriggerStripeFail}
            disabled={simulatingStripeFail}
            className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-950 rounded-xl text-xs font-bold transition-all text-left flex items-start gap-3 cursor-pointer group disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <div className="font-extrabold text-[11px] uppercase tracking-wide text-amber-900">2. Stripe Webhook Fail</div>
              <div className="text-[10px] text-amber-700 font-medium leading-tight mt-0.5">Simulate signature mismatch reject on invoice delivery webhook.</div>
            </div>
          </button>

          <button
            onClick={handleTriggerOpenAISpike}
            disabled={simulatingOpenAISpike}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-950 rounded-xl text-xs font-bold transition-all text-left flex items-start gap-3 cursor-pointer group disabled:opacity-50"
          >
            <BrainCircuit className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <div className="font-extrabold text-[11px] uppercase tracking-wide text-indigo-900">3. OpenAI Latency Spike</div>
              <div className="text-[10px] text-indigo-700 font-medium leading-tight mt-0.5">Inject 6.8 seconds delay spike on speech generation models.</div>
            </div>
          </button>

        </div>
      </div>

      {/* REAL-TIME BANNERS & NOTIFICATIONS */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map(alert => (
            <div 
              key={alert.id}
              className={`p-3.5 border rounded-2xl flex items-start gap-3 text-xs font-semibold shadow-xs animate-fadeIn ${
                alert.type === 'critical' 
                  ? 'bg-rose-50/75 border-rose-300 text-rose-950' 
                  : 'bg-amber-50/75 border-amber-300 text-amber-950'
              }`}
            >
              {alert.type === 'critical' ? (
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-0.5">
                <span className="font-black text-[10px] uppercase tracking-widest block font-mono text-stone-500">
                  {alert.type === 'critical' ? 'ALERT: SYSTEM_CRITICAL_INCIDENT' : 'WARNING: ANOMALY_DETECTED'}
                </span>
                <p className="leading-relaxed text-stone-800">{alert.message}</p>
              </div>
              <button
                onClick={() => setActiveTab(alert.actionableTab)}
                className={`px-2.5 py-1.5 border rounded-lg text-[10px] uppercase font-black tracking-widest hover:scale-102 transition-all cursor-pointer shadow-xs shrink-0 ${
                  alert.type === 'critical'
                    ? 'bg-rose-600 border-rose-700 text-white hover:bg-rose-700'
                    : 'bg-amber-600 border-amber-700 text-white hover:bg-amber-700'
                }`}
              >
                Inspect
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB NAVIGATION RAIL */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-stone-200">
        {[
          { id: 'overview', label: dict.tabOverview, icon: Activity },
          { id: 'logs', label: dict.tabLogs, icon: Layers },
          { id: 'errors', label: dict.tabErrors, icon: ShieldAlert },
          { id: 'api', label: dict.tabApi, icon: Sliders },
          { id: 'stripe', label: dict.tabStripe, icon: CreditCard },
          { id: 'openai', label: dict.tabOpenai, icon: BrainCircuit },
          { id: 'health', label: dict.tabHealth, icon: Server },
          { id: 'jobs', label: dict.tabJobs, icon: Archive },
          { id: 'realtime', label: dict.tabRealTime, icon: Wifi }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 border-b-2 text-xs font-extrabold uppercase tracking-wide cursor-pointer flex items-center gap-2 shrink-0 transition-all ${
                isActive 
                  ? 'border-stone-950 text-stone-950 bg-stone-50' 
                  : 'border-transparent text-stone-400 hover:text-stone-700 hover:bg-stone-50/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
              
              {/* Highlight Badges */}
              {tab.id === 'errors' && errors.filter(e => e.status === 'open').length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black leading-none">
                  {errors.filter(e => e.status === 'open').length}
                </span>
              )}
              {tab.id === 'jobs' && jobs.filter(j => j.status === 'dead_letter' || j.status === 'failed').length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black leading-none">
                  {jobs.filter(j => j.status === 'dead_letter' || j.status === 'failed').length}
                </span>
              )}
              {tab.id === 'stripe' && stripeEvents.filter(e => e.type === 'webhook_failed').length > 0 && (
                <span className="ml-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div className="mt-4">
        
        {/* TAB 1: SYSTEM OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Bento metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-2">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">{dict.activeUsers}</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-stone-900">{metrics.activeUsers}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">Live</span>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-2">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">{dict.activeInterviews}</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-stone-900">{metrics.activeInterviews}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">Active</span>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-2">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">{dict.reqPerMin}</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-stone-900">{metrics.requestsPerMinute} /m</span>
                  <span className="text-[10px] text-emerald-600 font-bold font-mono">Normal</span>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-2">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">{dict.errRate}</p>
                <div className="flex items-baseline justify-between">
                  <span className={`text-2xl font-black ${metrics.errorRate > 5 ? 'text-rose-600' : 'text-stone-900'}`}>{metrics.errorRate}%</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    metrics.errorRate > 5 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {metrics.errorRate > 5 ? 'Elevated' : 'Optimal'}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-2">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">{dict.paySuccess}</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-stone-900">{metrics.paymentSuccessRate}%</span>
                  <span className="text-[10px] font-bold text-emerald-600 font-mono">Gateways up</span>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-2">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">{dict.aiLatency}</p>
                <div className="flex items-baseline justify-between">
                  <span className={`text-2xl font-black ${metrics.aiResponseLatencyMs > 2000 ? 'text-amber-600' : 'text-stone-900'}`}>
                    {metrics.aiResponseLatencyMs}ms
                  </span>
                  <span className="text-[10px] text-stone-400 font-bold font-mono">Avg</span>
                </div>
              </div>

              <div className="col-span-2 bg-white border border-stone-200 p-5 rounded-3xl shadow-xs flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">{dict.sysStatus}</p>
                  <p className="text-xs font-semibold text-stone-500">Node, persistent logs and external gateways verified.</p>
                </div>
                {getStatusBadge(metrics.systemStatus)}
              </div>

            </div>

            {/* Live Chart Canvas representation (Interactive visual metrics trend) */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-stone-900 uppercase tracking-wider">Live System Traffic (RPM & Health Over Time)</h4>
                  <p className="text-xs text-stone-400 font-semibold">Staggered requests trace calculated from telemetry storage.</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-stone-500">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block" /> Requests</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block" /> Failures</span>
                </div>
              </div>

              {/* Hand-crafted beautiful SVG chart to prevent any dependency crashes */}
              <div className="relative w-full h-48 bg-stone-50 border border-stone-150 rounded-2xl p-4 flex items-end justify-between overflow-hidden">
                <div className="absolute top-2 left-3 font-mono text-[9px] text-stone-400 uppercase tracking-widest">REAL-TIME TRAFFIC PATTERN (24h)</div>
                
                {/* SVG Graph grids */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="4 4" />
                  
                  {/* Dynamic path lines */}
                  <path 
                    d="M 20 120 C 60 140, 100 80, 180 90 S 260 130, 340 60 S 420 50, 500 110 S 580 80, 660 70 S 740 120, 820 40 S 900 110, 1000 70" 
                    fill="none" 
                    stroke="#6366F1" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    className="opacity-90"
                  />
                  <path 
                    d="M 20 170 C 60 175, 100 160, 180 172 S 260 178, 340 162 S 420 170, 500 165 S 580 175, 660 172 S 740 160, 820 168 S 900 175, 1000 174" 
                    fill="none" 
                    stroke="#EF4444" 
                    strokeWidth="1.5" 
                    strokeLinecap="round"
                    className="opacity-70"
                  />
                </svg>

                <div className="w-full flex justify-between px-2 font-mono text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-auto z-10 select-none">
                  <span>-24h</span>
                  <span>-18h</span>
                  <span>-12h</span>
                  <span>-6h</span>
                  <span>Now</span>
                </div>
              </div>
            </div>
            
            {/* AUDIT LOGGING & SECURITY HISTORY */}
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-stone-900 uppercase tracking-wider">Access Control & Security Auditing</h4>
                  <p className="text-xs text-stone-400 font-semibold">Real-time auditing of administrative adjustments, credentials access, and resolution triggers.</p>
                </div>
                <span className="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">COMPLIANT (GDPR)</span>
              </div>
              
              <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto pr-1">
                {logs.filter(l => l.service === 'admin' || l.service === 'telemetry').slice(0, 10).map((log, index) => (
                  <div key={log.id || index} className="py-2.5 flex items-start gap-3 text-xs justify-between">
                    <div className="flex items-start gap-2.5">
                      <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded text-[9px] font-mono font-black text-stone-600 uppercase">AUDIT</span>
                      <p className="text-stone-700 font-semibold">{log.message}</p>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono font-semibold shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {logs.filter(l => l.service === 'admin' || l.service === 'telemetry').length === 0 && (
                  <div className="py-6 text-center text-xs text-stone-400 italic">No admin security events registered in current scope.</div>
                )}
              </div>
            </div>

            {/* SERVER ALERT INCIDENTS PANEL */}
            <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 shadow-xl space-y-5 border border-stone-800">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black uppercase tracking-wider text-stone-100">Live Incident Response & System Alarms</h4>
                  <p className="text-xs text-stone-400">Dynamic system alerts triggered by automated rules and background metrics evaluation.</p>
                </div>
                {isSuperAdmin && serverAlerts.length > 0 && (
                  <button 
                    onClick={handleClearAllAlerts}
                    className="px-3 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-full text-xs font-bold transition-colors cursor-pointer"
                  >
                    {lang === 'FR' ? "Purger les alertes" : "Purge All Alarms"}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {serverAlerts.filter(a => a.status !== 'resolved' && a.status !== 'dismissed').map((alert) => {
                  const severityColors: Record<string, string> = {
                    low: 'bg-stone-800 border-stone-700 text-stone-300',
                    medium: 'bg-amber-950/45 border-amber-800 text-amber-300',
                    high: 'bg-orange-950/45 border-orange-800 text-orange-300',
                    critical: 'bg-rose-950/45 border-rose-850 text-rose-300'
                  };

                  return (
                    <div key={alert.id} className={`p-4 rounded-2xl border ${severityColors[alert.severity] || severityColors.medium} flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] font-black uppercase px-2 py-0.5 bg-stone-950 rounded-full text-stone-400 border border-stone-850">
                            {alert.severity}
                          </span>
                          <span className="font-mono text-[10px] text-stone-400">
                            {alert.id}
                          </span>
                          <span className="text-[10px] bg-stone-950 px-2 py-0.5 rounded-full text-stone-400 capitalize">
                            Status: {alert.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-stone-200">{alert.message}</p>
                        <p className="text-[9px] font-mono text-stone-400">
                          {lang === 'FR' ? "Détecté à :" : "Detected at:"} {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {alert.status === 'open' && (
                          <button
                            onClick={() => handleUpdateAlertStatus(alert.id, 'acknowledged')}
                            className="px-2.5 py-1 bg-stone-850 hover:bg-stone-800 text-stone-200 text-[10px] font-bold rounded-lg border border-stone-700 transition-colors cursor-pointer"
                          >
                            {lang === 'FR' ? "Accepter" : "Acknowledge"}
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateAlertStatus(alert.id, 'resolved')}
                          className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          {lang === 'FR' ? "Résoudre" : "Resolve"}
                        </button>
                        <button
                          onClick={() => handleUpdateAlertStatus(alert.id, 'dismissed')}
                          className="px-2.5 py-1 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          {lang === 'FR' ? "Rejeter" : "Dismiss"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {serverAlerts.filter(a => a.status !== 'resolved' && a.status !== 'dismissed').length === 0 && (
                  <div className="py-8 text-center text-xs text-stone-500 font-medium italic border border-dashed border-stone-800 rounded-2xl bg-stone-900/50">
                    {lang === 'FR' ? "Aucun incident ou alarme critique actif en ce moment." : "No critical active alarms or system incidents registered."}
                  </div>
                )}
              </div>
            </div>

            {/* DISTRIBUTED TRACING & LATENCY PERCENTILES */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-stone-900 uppercase tracking-wider">Operational Latency Percentiles</h4>
                  <p className="text-xs text-stone-400 font-semibold">Distribution mapping for averages and high-order response times (P50, P95, P99) across critical pathways.</p>
                </div>
                <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">REAL-TIME TELEMETRY</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {performancePercentiles && Object.entries(performancePercentiles).map(([category, data]: [string, any]) => {
                  const labels: Record<string, string> = {
                    api: lang === 'FR' ? "Appels API Web" : "General API Requests",
                    ai: lang === 'FR' ? "Moteur IA (Gemini/GPT)" : "AI Orchestration Engine",
                    database: lang === 'FR' ? "Requêtes Database / Firestore" : "Database Query Cycles",
                    queue: lang === 'FR' ? "Planification Background Jobs" : "Background Queue Processing",
                    cv: lang === 'FR' ? "Analyse & Parsing de CV" : "CV Parsing Pipelines",
                    interviewStartup: lang === 'FR' ? "Démarrage Session Entretien" : "Interview Startup Latency",
                    reportGeneration: lang === 'FR' ? "Génération Bilans Finaux" : "Evaluation Report Generation"
                  };

                  return (
                    <div key={category} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3 transition-all hover:border-indigo-200">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-mono font-black text-stone-400 uppercase tracking-wider">{category.toUpperCase()}</p>
                        <h5 className="text-xs font-bold text-stone-800">{labels[category] || category}</h5>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-stone-500 font-medium">Average (Mean)</span>
                          <span className="font-mono font-black text-stone-900">{data.avg} ms</span>
                        </div>
                        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (data.avg / 3000) * 100)}%` }} />
                        </div>

                        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-stone-150 text-[10px] font-semibold text-stone-500 text-center font-mono">
                          <div className="space-y-0.5">
                            <span className="block text-[9px] text-stone-400">P50</span>
                            <span className="block font-black text-stone-700">{data.p50}ms</span>
                          </div>
                          <div className="space-y-0.5 border-x border-stone-200">
                            <span className="block text-[9px] text-amber-500">P95</span>
                            <span className="block font-black text-amber-700">{data.p95}ms</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="block text-[9px] text-rose-500">P99</span>
                            <span className="block font-black text-rose-750">{data.p99}ms</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI SERVICE METRICS & TOKEN SUMMARIES */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-stone-900 uppercase tracking-wider">Granular AI Usage Logs & Cost Summaries</h4>
                  <p className="text-xs text-stone-400 font-semibold">Aggregated metrics, token consumptions, and cost estimations grouped by daily and monthly cycles.</p>
                </div>
                <span className="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">BUDGET COMPLIANT</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily cycle */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase text-stone-500 tracking-wider font-mono">Daily Utilization Timeline</h5>
                  <div className="border border-stone-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-mono uppercase text-stone-400 font-bold">
                          <th className="p-3">{lang === 'FR' ? "Date" : "Date"}</th>
                          <th className="p-3 text-right">{lang === 'FR' ? "Appels" : "Calls"}</th>
                          <th className="p-3 text-right">{lang === 'FR' ? "Jetons" : "Tokens"}</th>
                          <th className="p-3 text-right">{lang === 'FR' ? "Coût Est." : "Est. Cost"}</th>
                          <th className="p-3 text-right">Success</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-150">
                        {aiDailySummaries.map((d: any) => (
                          <tr key={d.date} className="hover:bg-stone-50 transition-colors font-medium">
                            <td className="p-3 font-mono">{d.date}</td>
                            <td className="p-3 text-right font-mono">{d.requests}</td>
                            <td className="p-3 text-right font-mono text-stone-500">{d.totalTokens.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-indigo-600 font-bold">${d.totalCost.toFixed(5)}</td>
                            <td className="p-3 text-right font-mono">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${d.successRate > 95 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                {d.successRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        {aiDailySummaries.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-xs text-stone-400 italic">No daily AI logs tracked yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Monthly cycle */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase text-stone-500 tracking-wider font-mono">Monthly Budget Lifecycle</h5>
                  <div className="border border-stone-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-mono uppercase text-stone-400 font-bold">
                          <th className="p-3">{lang === 'FR' ? "Mois" : "Month"}</th>
                          <th className="p-3 text-right">{lang === 'FR' ? "Appels" : "Calls"}</th>
                          <th className="p-3 text-right">{lang === 'FR' ? "Jetons" : "Tokens"}</th>
                          <th className="p-3 text-right">{lang === 'FR' ? "Coût Est." : "Est. Cost"}</th>
                          <th className="p-3 text-right">Success</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-150">
                        {aiMonthlySummaries.map((m: any) => (
                          <tr key={m.month} className="hover:bg-stone-50 transition-colors font-medium">
                            <td className="p-3 font-mono">{m.month}</td>
                            <td className="p-3 text-right font-mono">{m.requests}</td>
                            <td className="p-3 text-right font-mono text-stone-500">{m.totalTokens.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-indigo-600 font-bold">${m.totalCost.toFixed(5)}</td>
                            <td className="p-3 text-right font-mono">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${m.successRate > 95 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                {m.successRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        {aiMonthlySummaries.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-xs text-stone-400 italic">No monthly budget cycles initialized.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* STORAGE & DATA RETENTION POLICIES */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-stone-900 uppercase tracking-wider">Durable Storage & Data Retention policy</h4>
                  <p className="text-xs text-stone-400 font-semibold">Strict operational thresholds to optimize performance and prevent memory leakages across server-side repositories.</p>
                </div>
                <span className="text-[10px] font-mono font-black text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">RETENTION ENFORCED</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-stone-50 border border-stone-150 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono font-black text-stone-400 uppercase tracking-wider">Application System Logs</p>
                    <p className="text-xs font-bold text-stone-800">Retention limit: 2,000 entries</p>
                    <p className="text-[10px] font-semibold text-stone-400">Pruning strategy: Rolling unshift</p>
                  </div>
                  <div className="text-right shrink-0 font-mono text-sm font-black text-stone-900">
                    {logs.length} / 2k
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-150 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono font-black text-stone-400 uppercase tracking-wider">Performance Metrics & API Records</p>
                    <p className="text-xs font-bold text-stone-800">Retention limit: 2,000 entries</p>
                    <p className="text-[10px] font-semibold text-stone-400">Pruning strategy: Rolling unshift</p>
                  </div>
                  <div className="text-right shrink-0 font-mono text-sm font-black text-stone-900">
                    {usageRecords.length} / 2k
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-150 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono font-black text-stone-400 uppercase tracking-wider">AI Service & OpenAI telemetry</p>
                    <p className="text-xs font-bold text-stone-800">Retention limit: 1,000 events</p>
                    <p className="text-[10px] font-semibold text-stone-400">Pruning strategy: Rolling unshift</p>
                  </div>
                  <div className="text-right shrink-0 font-mono text-sm font-black text-stone-900">
                    {openaiEvents.length} / 1k
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: LOGS EXPLORER */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            
            {/* Filter bar */}
            <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={lang === 'FR' ? "Rechercher un mot-clé dans les logs..." : "Search logs by message or sessionId..."}
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                
                {/* Service Filter */}
                <select
                  value={logServiceFilter}
                  onChange={(e) => setLogServiceFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 focus:outline-none"
                >
                  <option value="all">{lang === 'FR' ? "Tous Services" : "All Services"}</option>
                  <option value="auth">Auth & Session</option>
                  <option value="openai">OpenAI API</option>
                  <option value="stripe">Stripe Payments</option>
                  <option value="database">Database</option>
                  <option value="system">Core System</option>
                  <option value="admin">Admin Actions</option>
                  <option value="interview">Interview Simulator</option>
                </select>

                {/* Severity Filter */}
                <select
                  value={logSeverityFilter}
                  onChange={(e) => setLogSeverityFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 focus:outline-none"
                >
                  <option value="all">{lang === 'FR' ? "Toutes Gravités" : "All Severities"}</option>
                  <option value="info">INFO</option>
                  <option value="warning">WARNING</option>
                  <option value="error">ERROR</option>
                  <option value="critical">CRITICAL</option>
                </select>

                {/* Clear Button */}
                {isSuperAdmin && (
                  <button
                    onClick={handleClearLogs}
                    className="px-3.5 py-2 border border-red-200 hover:bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title={dict.clearLogs}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

            </div>

            {/* Logs Table */}
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider font-bold text-stone-400">
                      <th className="px-6 py-3.5">Timestamp</th>
                      <th className="px-6 py-3.5">Service / Category</th>
                      <th className="px-6 py-3.5">Severity</th>
                      <th className="px-6 py-3.5">Feature context</th>
                      <th className="px-6 py-3.5">Message Log</th>
                      <th className="px-6 py-3.5">Session ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-medium">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-stone-400 italic">
                          No filtered logs matched the criteria.
                        </td>
                      </tr>
                    ) : (
                      logs.map(log => (
                        <tr key={log.id} className="hover:bg-stone-50/30 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-[11px] text-stone-400 whitespace-nowrap">
                            {new Date(log.timestamp).toISOString()}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="px-2 py-0.5 rounded bg-stone-100 text-[10px] font-mono font-bold text-stone-600 uppercase border border-stone-200">
                              {log.service}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                              log.severity === 'critical' ? 'bg-rose-100 border-rose-300 text-rose-800' :
                              log.severity === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                              log.severity === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                              'bg-indigo-50/50 border-indigo-150 text-indigo-700'
                            }`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-mono text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                            {log.feature}
                          </td>
                          <td className="px-6 py-3.5 text-stone-700 break-words max-w-md select-all font-sans leading-relaxed">
                            {log.message}
                          </td>
                          <td className="px-6 py-3.5 font-mono text-stone-400 text-[11px]">
                            {log.sessionId || <span className="text-stone-300">-</span>}
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

        {/* TAB 3: ERROR MONITORING */}
        {activeTab === 'errors' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* List of active Errors */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">Active System Exceptions</h4>
                  <p className="text-[11px] text-stone-500">Unhandled failures grouped by unique type and message context.</p>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={handleClearAllErrors}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-lg text-xs font-bold"
                  >
                    Clear Traqueur
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {errors.map(err => {
                  const isSelected = viewingErrorDetails?.id === err.id;
                  return (
                    <div 
                      key={err.id}
                      onClick={() => setViewingErrorDetails(err)}
                      className={`p-4 border rounded-2xl cursor-pointer transition-all space-y-2 text-left ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/25 ring-1 ring-indigo-600 shadow-sm' 
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            err.type === 'ai' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
                            err.type === 'payment' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                            'bg-rose-50 border-rose-200 text-rose-800'
                          }`}>
                            {err.type}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase border ${
                            err.impactLevel === 'critical' ? 'bg-red-100 border-red-300 text-red-900 animate-pulse' :
                            err.impactLevel === 'high' ? 'bg-red-50 border-red-200 text-red-700' :
                            err.impactLevel === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-stone-100 border-stone-200 text-stone-600'
                          }`}>
                            {err.impactLevel}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border font-mono ${
                          err.status === 'resolved' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' :
                          err.status === 'investigating' ? 'bg-amber-100 border-amber-300 text-amber-800' :
                          'bg-stone-100 border-stone-300 text-stone-800'
                        }`}>
                          {err.status}
                        </span>
                      </div>

                      <p className="font-extrabold text-xs text-stone-900 line-clamp-2 select-all leading-relaxed">
                        {err.message}
                      </p>

                      <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 font-bold pt-1">
                        <span>Freq: {err.frequency} times</span>
                        <span>Last: {new Date(err.lastOccurrence).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })}

                {errors.length === 0 && (
                  <div className="bg-white border border-stone-200 rounded-3xl py-12 text-center text-stone-400 italic text-xs">
                    Amazing! No system exceptions registered in current tracking index.
                  </div>
                )}
              </div>
            </div>

            {/* Detail View Pane */}
            <div className="lg:col-span-5 bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">
                Diagnostic Exception details
              </h4>

              {viewingErrorDetails ? (
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Incident ID</span>
                    <p className="text-xs font-mono font-extrabold text-stone-800 select-all bg-stone-50 p-2 rounded-xl border border-stone-200">
                      {viewingErrorDetails.id}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Error Message</span>
                    <p className="text-xs font-extrabold text-stone-900 leading-relaxed break-words bg-stone-50/50 p-3 rounded-2xl border border-stone-150 select-all">
                      {viewingErrorDetails.message}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">First Occurrence</span>
                      <p className="text-xs font-bold text-stone-600">{new Date(viewingErrorDetails.firstOccurrence).toLocaleString()}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Last Occurrence</span>
                      <p className="text-xs font-bold text-stone-600">{new Date(viewingErrorDetails.lastOccurrence).toLocaleString()}</p>
                    </div>
                  </div>

                  {viewingErrorDetails.stack && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">V8 Execution Stack Trace</span>
                      <pre className="text-[10px] font-mono text-stone-600 bg-stone-900 text-stone-100 p-3.5 rounded-xl border overflow-x-auto whitespace-pre leading-relaxed select-all max-h-52">
                        {viewingErrorDetails.stack}
                      </pre>
                    </div>
                  )}

                  {/* Actions & Status resolutions */}
                  <div className="space-y-2 border-t border-stone-100 pt-3">
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Resolution Actions</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleUpdateErrorStatus(viewingErrorDetails.id, 'investigating')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase cursor-pointer ${
                          viewingErrorDetails.status === 'investigating' 
                            ? 'bg-amber-600 text-white' 
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                        }`}
                      >
                        {dict.investigateError}
                      </button>

                      <button
                        onClick={() => handleUpdateErrorStatus(viewingErrorDetails.id, 'resolved')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase cursor-pointer ${
                          viewingErrorDetails.status === 'resolved' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {dict.resolveError}
                      </button>

                      <button
                        onClick={() => handleUpdateErrorStatus(viewingErrorDetails.id, 'open')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase cursor-pointer ${
                          viewingErrorDetails.status === 'open' 
                            ? 'bg-stone-600 text-white' 
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-800'
                        }`}
                      >
                        {dict.reopenError}
                      </button>

                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteError(viewingErrorDetails.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-[11px] font-bold uppercase ml-auto"
                        >
                          {dict.archiveError}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center text-xs text-stone-400 font-semibold italic">
                  Select an active incident from the left list to view diagnostics telemetry.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: API USAGE DASHBOARD */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            
            {/* API summary statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Total API Queries (All-Time)</p>
                <p className="text-2xl font-black text-stone-900 mt-1">{usageSummary.totalRequestsAllTime} queries</p>
              </div>
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Overall Success Rate</p>
                <p className="text-2xl font-black text-stone-900 mt-1">{usageSummary.successRateOverall}%</p>
              </div>
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">AI vs payment cost est.</p>
                <p className="text-2xl font-black text-stone-900 mt-1">${usageSummary.totalCostEstimated} USD</p>
              </div>
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">RPM Trace</p>
                <p className="text-2xl font-black text-stone-900 mt-1">{usageSummary.requestsPerMinute} Reqs / min</p>
              </div>
            </div>

            {/* Interactive service distribution SVG visualizer */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              <div className="space-y-3.5">
                <h4 className="text-sm font-black text-stone-900 uppercase tracking-wider">Sub-Service Gateways Performance</h4>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-stone-600">
                      <span>OpenAI Completions</span>
                      <span>{usageSummary.successRateOpenAI}% success ({usageSummary.latencyOpenAI}ms avg)</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${usageSummary.successRateOpenAI}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-stone-600">
                      <span>Stripe Commerce</span>
                      <span>{usageSummary.successRateStripe}% success ({usageSummary.latencyStripe}ms avg)</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${usageSummary.successRateStripe}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-stone-600">
                      <span>Internal / Database Sync</span>
                      <span>{usageSummary.successRateInternal}% success ({usageSummary.latencyInternal}ms avg)</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-stone-850 h-full rounded-full" style={{ width: `${usageSummary.successRateInternal}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hand-crafted elegant SVG pie chart */}
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                    {/* Circle representing OpenAI (60%) */}
                    <circle cx="16" cy="16" r="14" fill="transparent" stroke="#6366F1" strokeWidth="4" strokeDasharray="60 100" />
                    {/* Circle representing Stripe (25%) */}
                    <circle cx="16" cy="16" r="14" fill="transparent" stroke="#10B981" strokeWidth="4" strokeDasharray="25 100" strokeDashoffset="-60" />
                    {/* Circle representing Internal (15%) */}
                    <circle cx="16" cy="16" r="14" fill="transparent" stroke="#1C1917" strokeWidth="4" strokeDasharray="15 100" strokeDashoffset="-85" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-stone-900">{usageSummary.totalRequestsAllTime}</span>
                    <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">Total reqs</span>
                  </div>
                </div>
                <div className="text-left text-[11px] font-bold text-stone-500 space-y-1 ml-6">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-xs inline-block" /> OpenAI (60%)</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block" /> Stripe (25%)</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-stone-900 rounded-xs inline-block" /> Internal (15%)</div>
                </div>
              </div>

            </div>

            {/* Live active transaction records */}
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <h4 className="text-xs font-black text-stone-950 uppercase tracking-wider">Historical Request Streams</h4>
                <span className="text-[10px] font-mono font-semibold text-stone-400">Showing last 20 queries</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider font-bold text-stone-400">
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">Service</th>
                      <th className="px-6 py-3">API Endpoint Context</th>
                      <th className="px-6 py-3">Latency</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Cost Estimated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-medium">
                    {usageRecords.slice(0, 20).map((record, idx) => (
                      <tr key={record.id || idx} className="hover:bg-stone-50/20">
                        <td className="px-6 py-3 font-mono text-[11px] text-stone-400">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            record.service === 'openai' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            record.service === 'stripe' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-stone-50 text-stone-700 border border-stone-200'
                          }`}>
                            {record.service}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-[11px] text-stone-600 select-all">
                          {record.endpoint}
                        </td>
                        <td className="px-6 py-3 font-mono font-bold text-stone-800">
                          {record.durationMs}ms
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            record.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}>
                            {record.success ? 'Success' : 'Failure'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-stone-500">
                          ${record.costEstimated?.toFixed(5) || '0.00000'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: STRIPE PAYMENTS MONITORING */}
        {activeTab === 'stripe' && (
          <div className="space-y-6">
            
            {/* Warning block about privacy */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-950 font-semibold leading-relaxed">
              <Shield className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-black text-[10px] uppercase tracking-widest block font-mono text-stone-500">GDPR SECURITY DIRECTIVE</span>
                <p className="mt-0.5">
                  {lang === 'FR'
                    ? "Aucune coordonnée bancaire, numéro de carte, ou information utilisateur confidentielle n'est indexée. Ce tableau de bord n'enregistre que les métadonnées de transaction cryptées conformes aux normes PCI-DSS."
                    : "No banking credentials, card numbers, or proprietary consumer keys are stored. This system dashboard processes only encrypted transaction metadata compliant with active PCI-DSS governance frameworks."}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Checkout sessions</p>
                <p className="text-2xl font-black text-stone-900 mt-1">
                  {stripeEvents.filter(e => e.type === 'checkout_session_created').length} active
                </p>
              </div>
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Successful Charges</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {stripeEvents.filter(e => e.type === 'payment_intent_succeeded').length} charges
                </p>
              </div>
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Failed Transactions</p>
                <p className="text-2xl font-black text-rose-700 mt-1">
                  {stripeEvents.filter(e => e.type === 'payment_intent_failed' || e.type === 'webhook_failed').length} errors
                </p>
              </div>
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Webhook delivery status</p>
                <p className="text-2xl font-black text-indigo-700 mt-1">98.4% success</p>
              </div>
            </div>

            {/* Stripe transactions list */}
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <h4 className="text-xs font-black text-stone-950 uppercase tracking-wider">Gateway Transactions & Webhooks Audit (Stripe)</h4>
                <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded">METADATA ONLY</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider font-bold text-stone-400">
                      <th className="px-6 py-4">Event ID</th>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Trigger / Event Type</th>
                      <th className="px-6 py-4">Sum</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Metadata Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-medium">
                    {stripeEvents.map(evt => (
                      <tr key={evt.id} className="hover:bg-stone-50/10">
                        <td className="px-6 py-4 font-mono text-[10.5px] text-stone-400 select-all">
                          {evt.id}
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-stone-400">
                          {new Date(evt.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-stone-700 font-bold uppercase tracking-wider text-[10px]">
                            {evt.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-extrabold text-stone-800">
                          {evt.amount ? `$${evt.amount.toFixed(2)}` : <span className="text-stone-300">-</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            evt.status === 'succeeded' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                            evt.status === 'failed' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                            'bg-amber-50 border-amber-200 text-amber-800'
                          }`}>
                            {evt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-stone-500 font-medium font-sans leading-relaxed">
                          {evt.metadata.productName && <span className="block font-bold text-stone-700">Product: {evt.metadata.productName}</span>}
                          {evt.metadata.userId && <span className="block text-[10px]">User Reference: {evt.metadata.userId}</span>}
                          {evt.metadata.failureReason && <span className="block font-mono text-[10.5px] text-red-600 bg-red-50 p-1.5 rounded-lg border border-red-100 mt-1 select-all">{evt.metadata.failureReason}</span>}
                          {evt.metadata.gatewayId && <span className="block font-mono text-[9px] text-stone-400">Stripe ID: {evt.metadata.gatewayId}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: AI USAGE MONITORING (OPENAI) */}
        {activeTab === 'openai' && (
          <div className="space-y-6">
            
            {/* Compliance warning */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-950 font-semibold leading-relaxed">
              <BrainCircuit className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-black text-[10px] uppercase tracking-widest block font-mono text-stone-500">PRIVACY SAFEGUARD PROTOCOL</span>
                <p className="mt-0.5">
                  {lang === 'FR'
                    ? "Conformément à la confidentialité absolue des candidats, aucun prompt, aucune question ou réponse d'entretien, et aucun CV textuel n'est journalisé. Seuls les jetons consommés, latences, modèles et exceptions techniques sont tracés."
                    : "To guarantee Candidate Privacy, raw prompts, voice inputs, transcribed answers, or CV text data are strictly prohibited from logging. Telemetry stores only execution latencies, token counts, model identifiers, and error statuses."}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Total AI Completions</p>
                <p className="text-2xl font-black text-stone-900 mt-1">
                  {openaiEvents.length} generations
                </p>
              </div>
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Avg Response Speed</p>
                <p className="text-2xl font-black text-indigo-700 mt-1">
                  {Math.round(openaiEvents.filter(e => e.success).reduce((acc, r) => acc + r.durationMs, 0) / (openaiEvents.filter(e => e.success).length || 1))}ms
                </p>
              </div>
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Generative Failure Rate</p>
                <p className="text-2xl font-black text-rose-700 mt-1">
                  {(openaiEvents.filter(e => !e.success).length / (openaiEvents.length || 1) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Est. API Spend (Token Blended)</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  ${openaiEvents.reduce((acc, r) => acc + (r.costEstimated || 0), 0).toFixed(5)} USD
                </p>
              </div>
            </div>

            {/* OpenAI API requests trace */}
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <h4 className="text-xs font-black text-stone-950 uppercase tracking-wider">AI Operations completions Audit Logs</h4>
                <span className="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">NO PROMPT EXPOSURE</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider font-bold text-stone-400">
                      <th className="px-6 py-4">Generation ID</th>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Model Engine</th>
                      <th className="px-6 py-4">Tokens (est)</th>
                      <th className="px-6 py-4">Latency</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Diagnostic Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-medium">
                    {openaiEvents.map(evt => (
                      <tr key={evt.id} className="hover:bg-stone-50/10">
                        <td className="px-6 py-4 font-mono text-[10.5px] text-stone-400 select-all">
                          {evt.id}
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-stone-400">
                          {new Date(evt.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded font-mono text-[10.5px] font-bold bg-stone-100 border border-stone-200 text-stone-700 uppercase">
                            {evt.model}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-extrabold text-stone-850">
                          {evt.tokensEstimated} tokens
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-stone-800">
                          {evt.durationMs}ms
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            evt.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}>
                            {evt.success ? 'Success' : 'Failure'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-stone-500 font-semibold max-w-sm select-all font-sans leading-relaxed">
                          {evt.metadata.feature && <span className="block font-bold text-stone-700">Feature: {evt.metadata.feature}</span>}
                          {evt.metadata.responseLength && <span className="block text-[10px]">Response Characters: {evt.metadata.responseLength}</span>}
                          {evt.metadata.failureReason && <span className="block font-mono text-[10px] text-red-600 bg-red-50 p-1.5 rounded-lg border border-red-150 mt-1">{evt.metadata.failureReason}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 7: SYSTEM HEALTH */}
        {activeTab === 'health' && healthReport && (
          <div className="space-y-6">
            
            {/* Server resources visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="text-xs font-black text-stone-400 uppercase tracking-wider font-mono">Container Uptime</span>
                  <Clock className="w-4 h-4 text-stone-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-2xl font-black text-stone-900">
                    {Math.floor(healthReport.uptime / 3600)}h {Math.floor((healthReport.uptime % 3600) / 60)}m {healthReport.uptime % 60}s
                  </p>
                  <p className="text-[11px] font-semibold text-stone-400">Node virtual instance active</p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="text-xs font-black text-stone-400 uppercase tracking-wider font-mono">CPU Core Load</span>
                  <Activity className="w-4 h-4 text-stone-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <p className="text-2xl font-black text-stone-900">{healthReport.cpuUsage}%</p>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Optimal</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${healthReport.cpuUsage}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="text-xs font-black text-stone-400 uppercase tracking-wider font-mono">Heap Memory Allocation</span>
                  <Database className="w-4 h-4 text-stone-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <p className="text-2xl font-black text-stone-900">{healthReport.memoryUsage.percentage}%</p>
                    <span className="text-[10px] text-stone-400 font-mono">{(healthReport.memoryUsage.usedMs / 1024 / 1024).toFixed(1)}MB / 512MB</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${healthReport.memoryUsage.percentage}%` }} />
                  </div>
                </div>
              </div>

            </div>

            {/* Diagnostic check points list */}
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">
                Subsystem Diagnostics & Gateways Status (Shana Core)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                
                {/* Node Server */}
                <div className="p-4 border border-stone-150 rounded-2xl flex items-start gap-3.5 bg-stone-50/50">
                  <div className="p-2 bg-indigo-50 rounded-xl shrink-0 mt-0.5 border border-indigo-100 text-indigo-600">
                    <Server className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-900 uppercase">1. Application Core Server</span>
                      {getStatusBadge(healthReport.components.server.status)}
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-semibold">
                      {healthReport.components.server.details}
                    </p>
                  </div>
                </div>

                {/* DB Layer */}
                <div className="p-4 border border-stone-150 rounded-2xl flex items-start gap-3.5 bg-stone-50/50">
                  <div className="p-2 bg-indigo-50 rounded-xl shrink-0 mt-0.5 border border-indigo-100 text-indigo-600">
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-900 uppercase">2. Persistent Database / Storage</span>
                      {getStatusBadge(healthReport.components.database.status)}
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-semibold">
                      {healthReport.components.database.details}
                    </p>
                  </div>
                </div>

                {/* Background Task Queues */}
                <div className="p-4 border border-stone-150 rounded-2xl flex items-start gap-3.5 bg-stone-50/50">
                  <div className="p-2 bg-indigo-50 rounded-xl shrink-0 mt-0.5 border border-indigo-100 text-indigo-600">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-900 uppercase">3. SMTP Dispatch Queues</span>
                      {getStatusBadge(healthReport.components.queue.status)}
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-semibold">
                      {healthReport.components.queue.details}
                    </p>
                  </div>
                </div>

                {/* API Gateway Status */}
                <div className="p-4 border border-stone-150 rounded-2xl flex items-start gap-3.5 bg-stone-50/50">
                  <div className="p-2 bg-indigo-50 rounded-xl shrink-0 mt-0.5 border border-indigo-100 text-indigo-600">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-900 uppercase">4. Internal Route Gateways</span>
                      {getStatusBadge(healthReport.components.api.status)}
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-semibold">
                      {healthReport.components.api.details}
                    </p>
                  </div>
                </div>

                {/* OpenAI Client Status */}
                <div className="p-4 border border-stone-150 rounded-2xl flex items-start gap-3.5 bg-stone-50/50">
                  <div className="p-2 bg-indigo-50 rounded-xl shrink-0 mt-0.5 border border-indigo-100 text-indigo-600">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-900 uppercase">5. OpenAI AI completions integration</span>
                      {getStatusBadge(healthReport.components.integrations.openai.status)}
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-semibold">
                      {healthReport.components.integrations.openai.details}
                    </p>
                  </div>
                </div>

                {/* Stripe Client Status */}
                <div className="p-4 border border-stone-150 rounded-2xl flex items-start gap-3.5 bg-stone-50/50">
                  <div className="p-2 bg-indigo-50 rounded-xl shrink-0 mt-0.5 border border-indigo-100 text-indigo-600">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-900 uppercase">6. Stripe Payments gateway integration</span>
                      {getStatusBadge(healthReport.components.integrations.stripe.status)}
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-semibold">
                      {healthReport.components.integrations.stripe.details}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 8: BACKGROUND ASYNCHRONOUS JOBS & QUEUE SYSTEM */}
        {activeTab === 'jobs' && (() => {
          const fallbackMetrics = {
            totalJobs: jobs.length,
            queuedCount: jobs.filter(j => j.status === 'queued').length,
            processingCount: jobs.filter(j => j.status === 'processing').length,
            completedCount: jobs.filter(j => j.status === 'completed').length,
            failedCount: jobs.filter(j => j.status === 'failed').length,
            deadLetterCount: jobs.filter(j => j.status === 'dead_letter').length,
            averageExecutionTimeMs: jobMetrics?.averageExecutionTimeMs || 1200,
            retryRate: jobMetrics?.retryRate || (jobs.length ? Math.round((jobs.filter(j => j.retryCount > 0).length / jobs.length) * 100) : 0),
            failureRate: jobMetrics?.failureRate || (jobs.length ? Math.round((jobs.filter(j => j.status === 'dead_letter' || j.status === 'failed').length / jobs.length) * 100) : 0),
            workerUtilization: jobMetrics?.workerUtilization || Math.min(100, jobs.filter(j => j.status === 'processing').length * 33)
          };

          const filteredJobs = jobs.filter(job => {
            if (jobSearch) {
              const q = jobSearch.toLowerCase();
              const matchId = job.id.toLowerCase().includes(q);
              const matchType = job.jobType.toLowerCase().includes(q);
              const matchUser = job.userId.toLowerCase().includes(q);
              const matchError = job.errorLog && job.errorLog.toLowerCase().includes(q);
              if (!matchId && !matchType && !matchUser && !matchError) return false;
            }
            if (jobStatusFilter !== 'all' && job.status !== jobStatusFilter) return false;
            if (jobTypeFilter !== 'all') {
              if (jobTypeFilter === 'document' && !['cv_parsing', 'text_extraction', 'file_validation', 'file_optimization'].includes(job.jobType)) return false;
              if (jobTypeFilter === 'ai' && !['cv_analysis', 'interview_report_generation', 'ai_insights', 'long_form_evaluations', 'future_ai_training'].includes(job.jobType)) return false;
              if (jobTypeFilter === 'notifications' && !['emails', 'push_notifications', 'in_app_notifications'].includes(job.jobType)) return false;
              if (jobTypeFilter === 'analytics' && !['kpi_calculations', 'dashboard_refresh', 'usage_aggregation', 'performance_reports'].includes(job.jobType)) return false;
              if (jobTypeFilter === 'maintenance' && !['cleanup', 'archive_old_data', 'cache_refresh', 'database_optimization', 'scheduled_backups'].includes(job.jobType)) return false;
            }
            return true;
          });

          return (
            <div className="space-y-6">
              
              {/* Job metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                
                <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs space-y-1 text-left">
                  <p className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">Total Enqueued</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-stone-900">{fallbackMetrics.totalJobs}</span>
                    <span className="text-[10px] font-bold text-stone-400">All Time</span>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs space-y-1 text-left">
                  <p className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest">Active Processing</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-indigo-600">{fallbackMetrics.processingCount}</span>
                    <span className="text-[10px] text-indigo-500 font-bold font-mono">
                      {fallbackMetrics.queuedCount} Pending
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs space-y-1 text-left">
                  <p className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Succeeded Jobs</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-emerald-600">{fallbackMetrics.completedCount}</span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {fallbackMetrics.totalJobs ? Math.round((fallbackMetrics.completedCount / fallbackMetrics.totalJobs) * 100) : 100}% Rate
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs space-y-1 text-left">
                  <p className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest">Dead Letter Queue</p>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-xl font-black ${fallbackMetrics.deadLetterCount > 0 ? 'text-rose-600 animate-pulse' : 'text-stone-900'}`}>
                      {fallbackMetrics.deadLetterCount}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                      fallbackMetrics.deadLetterCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-stone-50 text-stone-400'
                    }`}>
                      {fallbackMetrics.deadLetterCount > 0 ? 'Requires Action' : 'Clear'}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs space-y-1 text-left">
                  <p className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest">Worker Load</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-stone-900">{fallbackMetrics.workerUtilization}%</span>
                    <span className="text-[10px] text-stone-400 font-bold font-mono">3 Workers</span>
                  </div>
                </div>

              </div>

              {/* Grid: Trigger Job on left, Active Queue board on right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Side: Job Enqueuing Controls */}
                <div className="lg:col-span-4 bg-white border border-stone-200 p-5 rounded-3xl text-left space-y-4 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">Enqueue Background Job</h4>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed font-semibold">
                    Manually dispatch a professional asynchronous background job into the persistent Firestore queues to evaluate load distribution.
                  </p>

                  <form onSubmit={handleTriggerJob} className="space-y-3 pt-2 text-xs">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase">Job Type (Category)</label>
                      <select
                        value={mockJobType}
                        onChange={(e) => setMockJobType(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <optgroup label="1. Document Processing">
                          <option value="cv_parsing">CV parsing</option>
                          <option value="text_extraction">Text extraction</option>
                          <option value="file_validation">File validation</option>
                          <option value="file_optimization">File optimization</option>
                        </optgroup>
                        <optgroup label="2. AI Core">
                          <option value="cv_analysis">CV Analysis</option>
                          <option value="interview_report_generation">Interview Report Gen</option>
                          <option value="ai_insights">AI insights</option>
                          <option value="long_form_evaluations">Long-form Evaluations</option>
                          <option value="future_ai_training">AI Training Loop</option>
                        </optgroup>
                        <optgroup label="3. Notifications">
                          <option value="emails">SMTP Email Delivery</option>
                          <option value="push_notifications">Push notification</option>
                          <option value="in_app_notifications">In-app notifications</option>
                        </optgroup>
                        <optgroup label="4. Data Analytics">
                          <option value="kpi_calculations">KPI calculation</option>
                          <option value="dashboard_refresh">Dashboard Refresh</option>
                          <option value="usage_aggregation">Usage aggregations</option>
                          <option value="performance_reports">Performance Report</option>
                        </optgroup>
                        <optgroup label="5. System Maintenance">
                          <option value="cleanup">Purge Orphaned Docs</option>
                          <option value="archive_old_data">Archive Old Data</option>
                          <option value="cache_refresh">Cache Refresh</option>
                          <option value="database_optimization">Database Optimization</option>
                          <option value="scheduled_backups">Scheduled Cloud Backups</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase">Priority Level</label>
                      <div className="flex gap-1.5">
                        {['Critical', 'High', 'Normal', 'Low'].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setMockPriority(p)}
                            className={`flex-1 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              mockPriority === p 
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs' 
                                : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 pt-1.5">
                      <label className="flex items-center gap-2 bg-stone-50 border border-stone-200 p-2.5 rounded-xl cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={mockSimulateFailure}
                          onChange={(e) => setMockSimulateFailure(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-stone-800 leading-none">Simulate Threshold Failures</p>
                          <p className="text-[10px] text-stone-400 mt-1 leading-normal font-semibold">
                            Forces the handler to crash, demonstrating retry backoffs and Dead Letter transition.
                          </p>
                        </div>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isTriggeringJob}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 text-center flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isTriggeringJob ? 'animate-spin' : ''}`} />
                      <span>{isTriggeringJob ? "Dispatching..." : "Enqueue Job"}</span>
                    </button>
                  </form>
                </div>

                {/* Queue Board */}
                <div className="lg:col-span-8 space-y-4">
                  
                  {/* Filters & search */}
                  <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search jobs by ID, user or error..."
                        value={jobSearch}
                        onChange={(e) => setJobSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto">
                      <select
                        value={jobTypeFilter}
                        onChange={(e) => setJobTypeFilter(e.target.value)}
                        className="bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 focus:outline-none"
                      >
                        <option value="all">All Categories</option>
                        <option value="document">Document parsing</option>
                        <option value="ai">AI Core</option>
                        <option value="notifications">Notifications</option>
                        <option value="analytics">Analytics</option>
                        <option value="maintenance">Maintenance</option>
                      </select>

                      <select
                        value={jobStatusFilter}
                        onChange={(e) => setJobStatusFilter(e.target.value)}
                        className="bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 focus:outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="queued">QUEUED</option>
                        <option value="processing">PROCESSING</option>
                        <option value="completed">COMPLETED</option>
                        <option value="failed">FAILED (RETRIES)</option>
                        <option value="dead_letter">DEAD LETTER</option>
                      </select>
                    </div>
                  </div>

                  {/* Active Jobs Board Table */}
                  <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs text-left">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-50/50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider font-bold text-stone-400">
                            <th className="px-5 py-3">Job Identity</th>
                            <th className="px-5 py-3">Category</th>
                            <th className="px-5 py-3">Priority</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Retries</th>
                            <th className="px-5 py-3">Metrics / Timestamps</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-xs font-medium">
                          {filteredJobs.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-5 py-12 text-center text-stone-400 italic">
                                No active queue background jobs registered.
                              </td>
                            </tr>
                          ) : (
                            filteredJobs.map(job => {
                              const isRetrying = isActionInProgress === job.id;
                              return (
                                <tr key={job.id} className="hover:bg-stone-50/30 transition-colors">
                                  <td className="px-5 py-3 space-y-1">
                                    <p className="font-mono text-[10px] font-black text-stone-900 select-all leading-none">{job.id}</p>
                                    <p className="text-[10px] text-stone-400 font-semibold">User: <span className="font-mono">{job.userId.substring(0, 10)}...</span></p>
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px] font-mono font-bold text-stone-600 uppercase">
                                      {job.jobType}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                      job.priority === 'Critical' ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' :
                                      job.priority === 'High' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                      job.priority === 'Normal' ? 'bg-indigo-50/50 border-indigo-100 text-indigo-700' :
                                      'bg-stone-50 border-stone-200 text-stone-500'
                                    }`}>
                                      {job.priority}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border font-mono ${
                                      job.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                      job.status === 'processing' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
                                      job.status === 'failed' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                      job.status === 'dead_letter' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                                      'bg-stone-50 border-stone-200 text-stone-800'
                                    }`}>
                                      {job.status === 'processing' && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />}
                                      <span>{job.status === 'dead_letter' ? 'DEAD_LETTER' : job.status}</span>
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 font-mono font-black text-[11px] text-stone-500">
                                    {job.retryCount} / {job.maxRetries || 3}
                                  </td>
                                  <td className="px-5 py-3 space-y-1">
                                    <div className="flex items-center gap-1 text-[10px] text-stone-400 font-mono">
                                      <Clock className="w-3 h-3 text-stone-300" />
                                      <span>In: {new Date(job.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    {job.startedAt && (
                                      <div className="text-[10px] text-stone-400 font-mono">
                                        Run: {new Date(job.startedAt).toLocaleTimeString()}
                                      </div>
                                    )}
                                    {job.finishedAt && (
                                      <div className="text-[10px] text-emerald-600 font-mono">
                                        End: {new Date(job.finishedAt).toLocaleTimeString()}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-5 py-3 text-right space-x-1.5 whitespace-nowrap">
                                    {(job.status === 'dead_letter' || job.status === 'failed') && (
                                      <button
                                        onClick={() => handleRetryJob(job.id)}
                                        disabled={isRetrying}
                                        className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                                      >
                                        Resurrect
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteJob(job.id)}
                                      disabled={isRetrying}
                                      className="px-2.5 py-1 bg-stone-50 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-stone-200 text-stone-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                                    >
                                      Purge
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

                  {/* Error Log Details panel for dead letter or failed jobs */}
                  {filteredJobs.some(j => j.status === 'dead_letter' && j.errorLog) && (
                    <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-5 text-left space-y-3">
                      <div className="flex items-center gap-2 text-rose-850">
                        <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-rose-900">Dead Letter Error Inspection Logs</h4>
                      </div>
                      <div className="space-y-3 divide-y divide-rose-150/50">
                        {filteredJobs.filter(j => j.status === 'dead_letter' && j.errorLog).map(job => (
                          <div key={job.id} className="pt-2.5 first:pt-0 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-mono font-black text-rose-850">
                              <span>Job ID: {job.id} ({job.jobType})</span>
                              <span>Failed At: {job.finishedAt ? new Date(job.finishedAt).toLocaleTimeString() : 'N/A'}</span>
                            </div>
                            <p className="font-mono text-[10.5px] leading-relaxed text-rose-750 bg-white border border-rose-200/50 p-3 rounded-xl select-all break-all whitespace-pre-wrap">
                              {job.errorLog}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          );
        })()}

        {/* TAB 9: REAL-TIME COMMUNICATION GATEWAY & OBSERVABILITY */}
        {activeTab === 'realtime' && (() => {
          const fallbackRtMetrics = {
            activeConnections: rtConnections.length,
            totalConnectionsEstablished: rtMetrics?.totalConnectionsEstablished || rtConnections.length,
            reconnectRate: rtMetrics?.reconnectRate || 100,
            averageLatencyMs: rtMetrics?.averageLatencyMs || 45,
            droppedConnectionsCount: rtMetrics?.droppedConnectionsCount || 0,
            streamDurationTotalMs: rtMetrics?.streamDurationTotalMs || 0,
            messageThroughput: rtMetrics?.messageThroughput || 0,
            throughputPerSecond: rtMetrics?.throughputPerSecond || 0
          };

          const filteredConnections = rtConnections.filter(c => {
            if (rtSearch) {
              const q = rtSearch.toLowerCase();
              return c.connectionId.toLowerCase().includes(q) || 
                     c.userId.toLowerCase().includes(q) || 
                     (c.sessionId && c.sessionId.toLowerCase().includes(q));
            }
            return true;
          });

          return (
            <div className="space-y-6">
              
              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                
                <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs space-y-1 text-left">
                  <p className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                    <span>Active Gateway Links</span>
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-stone-900">{fallbackRtMetrics.activeConnections}</span>
                    <span className="text-[10px] font-bold text-stone-400">WS Clients</span>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs space-y-1 text-left">
                  <p className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Reconnect Rate</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-emerald-600">{fallbackRtMetrics.reconnectRate}%</span>
                    <span className="text-[10px] text-stone-400 font-mono font-bold">100% Target</span>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs space-y-1 text-left">
                  <p className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest">Average Latency (RTT)</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-stone-900">{fallbackRtMetrics.averageLatencyMs} ms</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                      fallbackRtMetrics.averageLatencyMs < 60 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {fallbackRtMetrics.averageLatencyMs < 60 ? 'Excellent' : 'Average'}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs space-y-1 text-left">
                  <p className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest">Dropped Handshakes</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-stone-900">{fallbackRtMetrics.droppedConnectionsCount}</span>
                    <span className="text-[10px] text-stone-400 font-mono font-bold">Grace Pools Active</span>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs space-y-1 text-left">
                  <p className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest">Message Flow Rate</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-stone-900">{fallbackRtMetrics.throughputPerSecond} msg/s</span>
                    <span className="text-[10px] text-stone-400 font-bold font-mono">
                      {fallbackRtMetrics.messageThroughput} Tot
                    </span>
                  </div>
                </div>

              </div>

              {/* Action grid: Admin controls & active roster */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Left Side: Real-Time Admin tools */}
                <div className="lg:col-span-4 space-y-4 text-left">
                  
                  {/* Admin Broadcast Card */}
                  <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-indigo-600 shrink-0" />
                      <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">Global Client Broadcaster</h4>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed font-semibold">
                      Broadcast real-time global notifications to all active candidate sessions instantly without reloading.
                    </p>
                    <form onSubmit={handleBroadcast} className="space-y-3 pt-1 text-xs">
                      <div className="space-y-1">
                        <textarea
                          value={broadcastMsg}
                          onChange={(e) => setBroadcastMsg(e.target.value)}
                          placeholder="Attention Shana users: Scheduled maintenance in 10 minutes..."
                          rows={3}
                          className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-stone-400"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isBroadcasting || !broadcastMsg.trim()}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 text-center flex items-center justify-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isBroadcasting ? "Broadcasting..." : "Dispatch Broadcast"}</span>
                      </button>
                    </form>
                  </div>

                  {/* AI Stream Simulator Card */}
                  <div className="bg-white border border-stone-200 p-5 rounded-3xl shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">Real-Time AI Stream Simulator</h4>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed font-semibold">
                      Demonstrate high-fidelity text streaming word-by-word. It simulates live server responses flowing through the websocket.
                    </p>
                    <form onSubmit={handleTriggerStream} className="space-y-3 pt-1 text-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase">Target Session ID</label>
                        <input
                          type="text"
                          value={streamSessionId}
                          onChange={(e) => setStreamSessionId(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase">Stream Category</label>
                        <select
                          value={streamType}
                          onChange={(e) => setStreamType(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 focus:outline-none"
                        >
                          <option value="question">Interview Question</option>
                          <option value="feedback">Real-Time Evaluation Feedback</option>
                          <option value="summary">Interview Summary Generation</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase">Payload Stream Content</label>
                        <textarea
                          value={streamText}
                          onChange={(e) => setStreamText(e.target.value)}
                          rows={3}
                          className="w-full bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isStreaming}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 text-center flex items-center justify-center gap-2"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isStreaming ? 'animate-spin' : ''}`} />
                        <span>{isStreaming ? "Streaming..." : "Trigger Live Stream"}</span>
                      </button>
                    </form>
                  </div>

                </div>

                {/* Right Side: Active links roster */}
                <div className="lg:col-span-8 space-y-4">
                  
                  {/* Search Bar */}
                  <div className="bg-white border border-stone-200 p-4 rounded-3xl shadow-xs flex items-center justify-between gap-3 text-left">
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search active connections by ID, User, or Session..."
                        value={rtSearch}
                        onChange={(e) => setRtSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Active Handshakes Table */}
                  <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs text-left">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-50/50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider font-bold text-stone-400">
                            <th className="px-5 py-3">Connection Identity</th>
                            <th className="px-5 py-3">User & Session Association</th>
                            <th className="px-5 py-3">Latency RTT</th>
                            <th className="px-5 py-3">System State</th>
                            <th className="px-5 py-3 text-right">Heartbeat Synchronized</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-xs font-medium">
                          {filteredConnections.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-5 py-12 text-center text-stone-400 italic">
                                No active real-time connections registered.
                              </td>
                            </tr>
                          ) : (
                            filteredConnections.map(conn => (
                              <tr key={conn.connectionId} className="hover:bg-stone-50/30 transition-colors">
                                <td className="px-5 py-3 space-y-0.5">
                                  <p className="font-mono text-[10.5px] font-black text-stone-900 select-all leading-none">{conn.connectionId}</p>
                                  <span className="text-[9px] text-stone-400 font-bold uppercase">Websocket protocol v1</span>
                                </td>
                                <td className="px-5 py-3 space-y-1">
                                  <p className="text-stone-800 font-bold">User: <span className="font-mono text-[10px] font-black bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">{conn.userId}</span></p>
                                  {conn.sessionId && (
                                    <p className="text-stone-400 text-[10px] font-semibold">Session: <span className="font-mono">{conn.sessionId}</span></p>
                                  )}
                                </td>
                                <td className="px-5 py-3 font-mono font-black text-[11px]">
                                  <span className={`${conn.latencyMs < 60 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {conn.latencyMs} ms
                                  </span>
                                </td>
                                <td className="px-5 py-3">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase border font-mono ${
                                    conn.state === 'ACTIVE' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
                                    conn.state === 'AUTHENTICATED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                    conn.state === 'CONNECTED' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                                    'bg-stone-50 border-stone-200 text-stone-500'
                                  }`}>
                                    {conn.state === 'ACTIVE' && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />}
                                    <span>{conn.state}</span>
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-right font-mono text-[10px] text-stone-400">
                                  {conn.lastHeartbeat}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          );
        })()}

      </div>

    </div>
  );
}
