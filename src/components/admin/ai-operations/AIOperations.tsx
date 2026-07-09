import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Video, 
  Cpu, 
  ShieldAlert, 
  AlertTriangle, 
  Layers, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  BookOpen, 
  Shield, 
  Eye, 
  Flame, 
  FileLock, 
  ArrowRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  PlusCircle,
  HelpCircle,
  Gauge,
  Coins,
  Database,
  Zap,
  TrendingUp,
  HardDrive,
  Globe,
  Server,
  List,
  ShieldCheck
} from 'lucide-react';
import { User } from '../../../types';
import { 
  AIOperationsController, 
  SessionAnalyzer, 
  QualityEngine, 
  AIOpsIncident, 
  AIOpsAlert,
  AIOpsAuditLog 
} from '../../../services/ai-monitoring';
import { 
  EvaluationMonitor, 
  InterviewInspector, 
  AIOpsEvaluation 
} from '../../../modules/evaluation';
import { InterviewSession } from '../../../services/admin/metrics';
import { AIQualityValidator } from '../../../services/aiQualityValidator';

interface AIOperationsProps {
  currentUser: User;
  lang?: 'FR' | 'EN';
}

type TabType = 'dashboard' | 'monitor' | 'evaluation' | 'quality' | 'performance' | 'incidents' | 'reliability';

export default function AIOperations({ currentUser, lang = 'FR' }: AIOperationsProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';
  
  // Local state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [metrics, setMetrics] = useState(SessionAnalyzer.getAIOpsMetrics());
  const [liveSessions, setLiveSessions] = useState<InterviewSession[]>(SessionAnalyzer.getLiveInterviews());
  const [evaluations, setEvaluations] = useState<AIOpsEvaluation[]>(EvaluationMonitor.getEvaluations());
  const [qualityIndicators, setQualityIndicators] = useState(QualityEngine.getQualityIndicators());
  const [incidents, setIncidents] = useState<AIOpsIncident[]>(AIOperationsController.getIncidents());
  const [alerts, setAlerts] = useState<AIOpsAlert[]>(AIOperationsController.getAlerts());
  const [auditLogs, setAuditLogs] = useState<AIOpsAuditLog[]>(AIOperationsController.getAuditLogs());
  const [config, setConfig] = useState(AIOperationsController.getConfig());

  // Resilience Center States
  const [microservices, setMicroservices] = useState<Record<string, 'healthy' | 'degraded' | 'unavailable' | 'timeout' | 'disconnected' | 'failure'>>({
    openai: 'healthy',
    firestore: 'healthy',
    auth: 'healthy',
    voice: 'healthy',
    network: 'healthy',
  });

  const [circuitBreakers, setCircuitBreakers] = useState<Record<string, 'closed' | 'open' | 'half_open'>>({
    learning: 'closed',
    conversation: 'closed',
    analytics: 'closed',
    evaluation: 'closed',
  });

  const [resilienceStats, setResilienceStats] = useState({
    totalRetries: 242,
    retrySuccessRate: 94.2,
    avgRecoveryDuration: 8.4,
    systemAvailability: 99.99,
  });

  const [chaosLog, setChaosLog] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [ChaosEngine] Standby. Select any controlled failure trigger below to execute chaos simulation.`
  ]);
  const [isSimulatingChaos, setIsSimulatingChaos] = useState<string | null>(null);

  const handleSimulateChaos = (type: 'firestore' | 'openai' | 'network' | 'voice' | 'auth' | 'latency') => {
    if (isSimulatingChaos) return;
    setIsSimulatingChaos(type);

    let incidentType: AIOpsIncident['type'] = 'AI unavailable';
    let affectedEngine = '';
    let description = '';
    let rootCause = '';
    let automaticActions = '';
    let recoveryDurationSec = 4;

    // Set degraded states
    setMicroservices(prev => {
      const next = { ...prev };
      if (type === 'firestore') {
        next.firestore = 'unavailable';
        setCircuitBreakers(cb => ({ ...cb, analytics: 'open' }));
        incidentType = 'session failure';
        affectedEngine = 'Firestore Database Storage';
        description = 'CHAOS_TEST: Controlled Firestore database connection outage simulation.';
        rootCause = 'Simulated write stream timeout to NoSQL regional replica bucket.';
        automaticActions = 'Tripped Analytics Sync Circuit Breaker. Enqueued all incoming transaction documents in transient memory buffer.';
      } else if (type === 'openai') {
        next.openai = 'timeout';
        setCircuitBreakers(cb => ({ ...cb, evaluation: 'open' }));
        incidentType = 'AI unavailable';
        affectedEngine = 'Evaluation Core Engine (Gemini API)';
        description = 'CHAOS_TEST: Controlled simulated failure of OpenAI/Gemini core API endpoints.';
        rootCause = 'Simulated HTTP 504 Gateway Timeout on primary reasoning model thread.';
        automaticActions = 'Tripped Evaluation Core Circuit Breaker. Promoted standby lightweight local model as primary processor.';
      } else if (type === 'network') {
        next.network = 'disconnected';
        setCircuitBreakers(cb => ({ ...cb, conversation: 'open' }));
        incidentType = 'high latency';
        affectedEngine = 'Global Routing Network Gateway';
        description = 'CHAOS_TEST: Controlled simulation of a complete external transit network gateway outage.';
        rootCause = 'Simulated bgp packet routing failure to edge CDN nodes.';
        automaticActions = 'Activating local service worker caching offline-mode. Safely buffering telemetry packages.';
      } else if (type === 'voice') {
        next.voice = 'disconnected';
        incidentType = 'voice unavailable';
        affectedEngine = 'Voice Service (WebRTC/Twilio)';
        description = 'CHAOS_TEST: Controlled Twilio media stream socket disconnection simulation.';
        rootCause = 'Simulated socket pool thread starvation under peak test user workloads.';
        automaticActions = 'Rerouted vocal ingestion to standby WebRTC streaming regional server. Triggered exponential-backoff socket reconnection.';
      } else if (type === 'auth') {
        next.auth = 'failure';
        incidentType = 'session failure';
        affectedEngine = 'Firebase Authentication Gateway';
        description = 'CHAOS_TEST: Controlled OAuth/Authentication API handshake rejection simulation.';
        rootCause = 'Simulated authentication session signing certificate expiration on security handshake.';
        automaticActions = 'Autonomously activated cached JWT cryptographically-signed emergency fallback authentication blocks.';
      } else if (type === 'latency') {
        next.openai = 'degraded';
        next.voice = 'degraded';
        incidentType = 'high latency';
        affectedEngine = 'Downstream Inference & Transcriber Pipeline';
        description = 'CHAOS_TEST: Controlled network latency degradation simulation (peaks above 1800ms).';
        rootCause = 'Simulated transit channel network congestion between voice ingress and reasoning nodes.';
        automaticActions = 'Forced low-bandwidth audio transcription profiles. Increased voice adaptive jitter buffer sizes to 350ms.';
      }
      return next;
    });

    const timestampStr = new Date().toLocaleTimeString();
    setChaosLog(prev => [
      `[${timestampStr}] [CHAOS] Starting simulation of "${type.toUpperCase()}" outage...`,
      `[${timestampStr}] [RECOVERY] Autonomous engine detected failure on: "${affectedEngine}".`,
      `[${timestampStr}] [CIRCUIT BREAKER] Tripped! Routing traffic through resilient backup channels.`,
      ...prev
    ]);

    // Create the incident live!
    const newInc = AIOperationsController.createIncident(
      incidentType,
      description,
      'critical',
      'chaos_engine@shana.com',
      affectedEngine,
      rootCause,
      automaticActions,
      recoveryDurationSec,
      'open'
    );

    // Increment retries count and adjust stats
    setResilienceStats(prev => ({
      ...prev,
      totalRetries: prev.totalRetries + 1,
      systemAvailability: parseFloat((prev.systemAvailability - 0.01).toFixed(4)),
    }));

    // Trigger local state reload to show the newly created open incident in UI immediately
    setIncidents(AIOperationsController.getIncidents());

    // After 4.5 seconds, auto-recover!
    setTimeout(() => {
      // Resolve the incident
      AIOperationsController.updateIncidentStatus(newInc.id, 'resolved', 'system@shana.com');

      // Update microservices back to healthy
      setMicroservices({
        openai: 'healthy',
        firestore: 'healthy',
        auth: 'healthy',
        voice: 'healthy',
        network: 'healthy',
      });

      // Close circuit breakers (set them to half-open, then closed)
      setCircuitBreakers({
        learning: 'closed',
        conversation: 'closed',
        analytics: 'closed',
        evaluation: 'closed',
      });

      // Update stats
      setResilienceStats(prev => ({
        ...prev,
        retrySuccessRate: parseFloat((((prev.totalRetries - 1) * prev.retrySuccessRate + 100) / prev.totalRetries).toFixed(1)),
        avgRecoveryDuration: parseFloat(((prev.avgRecoveryDuration * 9 + recoveryDurationSec) / 10).toFixed(1)),
        systemAvailability: 99.99,
      }));

      const recoverTimestamp = new Date().toLocaleTimeString();
      setChaosLog(prev => [
        `[${recoverTimestamp}] [RECOVERY] Outage of "${type.toUpperCase()}" successfully resolved autonomously in ${recoveryDurationSec}s!`,
        `[${recoverTimestamp}] [SYSTEM] Self-diagnostics green. Return to nominal SLA operation.`,
        ...prev
      ]);

      setIsSimulatingChaos(null);
      // Trigger full data refresh
      refreshData();
    }, 4500);
  };

  // Incident form
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [incidentType, setIncidentType] = useState<AIOpsIncident['type']>('AI unavailable');
  const [incidentSeverity, setIncidentSeverity] = useState<AIOpsIncident['severity']>('warning');
  const [incidentDesc, setIncidentDesc] = useState('');

  // Selected session for inspection
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);

  // Prompt Templates for Analysis
  const promptTemplates: Record<string, { name: string, text: string }> = {
    eval_prompt: {
      name: lang === 'FR' ? "Invite d'Évaluation Primaire" : "Primary Evaluation Prompt",
      text: `You are an expert, objective, and highly rigorous corporate performance assessor.
Your only task is to evaluate the candidate's answer to the interview question consistently and strictly, and output structured JSON.
CRITICAL INSTRUCTION: You must respond ONLY with a raw JSON object matching the requested schema. No conversational prefix, no markdown formatting (such as \`\`\`json), and no text outside of the JSON object.
Guidelines:
1. Objectivity & Strict Rigor: Judge solely on the content and structure of the candidate's response. You must be strict and avoid overly nice or inflated scoring. A score above 80 is strictly reserved for elite, industry-leading, near-perfect responses. Standard, okay, or brief responses must receive realistic scores in the 40s, 50s, or 60s. Low-effort or unhelpful answers should get scored in the 20s or 30s. No emotional scoring.`
    },
    conversation_prompt: {
      name: lang === 'FR' ? "Invite du Directeur de Conversation" : "Conversation Director Prompt",
      text: `You are an elite, human-like executive recruiter conducting a professional, high-stakes career interview.
Your goal is to assess their competence while staying deeply conversational, friendly, and realistic.
CRITICAL MANDATE:
1. Active Listening: If the candidate mentions specific details (companies, projects, or metrics), you must reference them in your next response.
2. Backchanneling: Periodically use polite acknowledgements like "Right.", "I see.", or "That makes complete sense." before proceeding to the next question.
3. No Robotic Loops: Avoid asking the same competency twice. Do not copy paste greeting styles.`
    },
    followup_prompt: {
      name: lang === 'FR' ? "Invite de la Stratégie de Suivi" : "Follow-up Strategy Prompt",
      text: `You are the Follow-Up Engine. Analyze the candidate's response length, word density, and metrics.
If they do not provide quantitative metrics, instruct the recruiter to politely request them.
If they miss the action step in STAR, ask a targeted follow-up question.
Keep directives highly specific to their role (Engineering, Product, Sales).`
    }
  };

  // Diagnostic states
  const [diagnosticReport, setDiagnosticReport] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Selected prompt state
  const [selectedPromptId, setSelectedPromptId] = useState('eval_prompt');
  const [promptAnalysis, setPromptAnalysis] = useState<any>(null);

  // Selected session audit state
  const [selectedAuditSessionId, setSelectedAuditSessionId] = useState<string>('');
  const [auditReport, setAuditReport] = useState<any>(null);
  const [iqsMetrics, setIqsMetrics] = useState<any>(null);

  // Regression state
  const [regressionReport, setRegressionReport] = useState<any>(null);

  // Performance tab states
  const [perfMetrics, setPerfMetrics] = useState<any>(null);
  const [isPerfLoading, setIsPerfLoading] = useState(false);
  const [concurrentSimValue, setConcurrentSimValue] = useState(1000);
  const [stressTestResult, setStressTestResult] = useState<any>(null);
  const [isSimulatingStress, setIsSimulatingStress] = useState(false);

  // Enterprise operations states
  const [enterpriseMetrics, setEnterpriseMetrics] = useState<any>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [queueJobs, setQueueJobs] = useState<any[]>([]);
  const [rateLimits, setRateLimits] = useState<any[]>([]);
  const [stressEstimate, setStressEstimate] = useState<any>(null);
  const [isEstimatingStress, setIsEstimatingStress] = useState(false);
  const [stressTargetUsers, setStressTargetUsers] = useState(25000);

  const fetchPerformanceMetrics = () => {
    setIsPerfLoading(true);
    
    // Fetch core performance metrics
    const p1 = fetch(`/api/admin/performance/metrics?activeCount=${liveSessions.length}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPerfMetrics(data.metrics);
        }
      });

    // Fetch enterprise-scale Operations Center metrics
    const p2 = fetch(`/api/admin/enterprise/metrics?activeCount=${liveSessions.length}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEnterpriseMetrics(data.metrics);
          setRegions(data.regions);
          setQueueJobs(data.queueJobs);
          setRateLimits(data.rateLimits);
        }
      });

    Promise.all([p1, p2])
      .catch(err => console.error("Error fetching operations metrics:", err))
      .finally(() => setIsPerfLoading(false));
  };

  const handleToggleFailover = (regionId: string) => {
    fetch('/api/admin/enterprise/failover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regionId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRegions(data.regions);
          // Auto-refresh metrics to reflect new load distribution
          fetchPerformanceMetrics();
        }
      })
      .catch(err => console.error("Error toggling failover:", err));
  };

  const handleTickQueue = () => {
    fetch('/api/admin/enterprise/queue/tick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setQueueJobs(data.queueJobs);
        }
      })
      .catch(err => console.error("Error ticking queue:", err));
  };

  const handleRunStressEstimate = (usersCount: number) => {
    setIsEstimatingStress(true);
    fetch('/api/admin/enterprise/stress-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: usersCount })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStressEstimate(data.estimate);
        }
        setIsEstimatingStress(false);
      })
      .catch(err => {
        console.error("Error estimating stress test:", err);
        setIsEstimatingStress(false);
      });
  };

  const handleRunStressTest = (concurrent: number) => {
    setIsSimulatingStress(true);
    fetch('/api/admin/performance/stress-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concurrentInterviews: concurrent })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStressTestResult(data.result);
        }
        setIsSimulatingStress(false);
      })
      .catch(err => {
        console.error("Error running stress test:", err);
        setIsSimulatingStress(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchPerformanceMetrics();
    }
  }, [activeTab, liveSessions.length]);

  useEffect(() => {
    // Run diagnostics initially
    setDiagnosticReport(AIQualityValidator.runSelfDiagnostics());
    // Run initial prompt analysis
    setPromptAnalysis(AIQualityValidator.analyzePromptQuality('eval_prompt', promptTemplates.eval_prompt.text));
    // Run initial regression report
    setRegressionReport(AIQualityValidator.detectRegression());
  }, []);

  const runDiagnosticTest = () => {
    setIsDiagnosing(true);
    setTimeout(() => {
      setDiagnosticReport(AIQualityValidator.runSelfDiagnostics());
      setIsDiagnosing(false);
    }, 800);
  };

  const handlePromptAnalysisChange = (promptId: string) => {
    setSelectedPromptId(promptId);
    const template = promptTemplates[promptId];
    if (template) {
      setPromptAnalysis(AIQualityValidator.analyzePromptQuality(promptId, template.text));
    }
  };

  const handleCustomPromptAnalyze = (text: string) => {
    setPromptAnalysis(AIQualityValidator.analyzePromptQuality(selectedPromptId, text));
  };

  const handleAuditSession = (sessionId: string) => {
    setSelectedAuditSessionId(sessionId);
    const sess = liveSessions.find(s => s.id === sessionId);
    if (!sess) return;
    
    // Construct a mock but realistic chat history sequence based on session details
    // to run the auditing algorithms beautifully on!
    const isFr = sess.language === 'FR';
    const mockChatHistory = [
      {
        role: "ai",
        text: isFr 
          ? "Bonjour et bienvenue à cet entretien Shana pour le poste de développeur. Pour commencer, pouvez-vous vous présenter ?"
          : "Hello and welcome to this Shana interview. To begin, could you please introduce yourself?"
      },
      {
        role: "user",
        text: isFr
          ? "Bonjour, je m'appelle Jean. J'ai 5 ans d'expérience chez Capgemini et j'ai travaillé sur React."
          : "Hello, I am Jean. I have 5 years of experience at Capgemini working on React."
      },
      {
        role: "ai",
        text: isFr
          ? "Bonjour et bienvenue à cet entretien Shana pour le poste de développeur. C'est intéressant. Parlez-moi d'un projet technique difficile."
          : "Hello and welcome to this Shana interview. That is interesting. Tell me about a difficult technical project."
      },
      {
        role: "user",
        text: isFr
          ? "J'ai migré une base de données vers le cloud. C'était complexe mais on a fini à l'heure."
          : "I migrated a database to the cloud. It was complex but we finished on time."
      }
    ];

    const audit = AIQualityValidator.auditConversation(mockChatHistory);
    const iqs = AIQualityValidator.calculateInterviewQuality(sess, mockChatHistory);

    setAuditReport(audit);
    setIqsMetrics(iqs);
  };

  // Time remaining for next 15s refresh
  const [refreshCountdown, setRefreshCountdown] = useState(15);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual & auto refresh function
  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setMetrics(SessionAnalyzer.getAIOpsMetrics());
      setLiveSessions(SessionAnalyzer.getLiveInterviews());
      setEvaluations(EvaluationMonitor.getEvaluations());
      setQualityIndicators(QualityEngine.getQualityIndicators());
      setIncidents(AIOperationsController.getIncidents());
      setAlerts(AIOperationsController.getAlerts());
      setAuditLogs(AIOperationsController.getAuditLogs());
      setConfig(AIOperationsController.getConfig());
      setRefreshCountdown(15);
      setIsRefreshing(false);
    }, 400);
  };

  // Set up 15s interval for Section 1 Refresh and countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          // Trigger refresh when timer reaches 0
          setMetrics(SessionAnalyzer.getAIOpsMetrics());
          setLiveSessions(SessionAnalyzer.getLiveInterviews());
          setEvaluations(EvaluationMonitor.getEvaluations());
          setQualityIndicators(QualityEngine.getQualityIndicators());
          setIncidents(AIOperationsController.getIncidents());
          setAlerts(AIOperationsController.getAlerts());
          setAuditLogs(AIOperationsController.getAuditLogs());
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update config wrapper
  const handleConfigToggle = (key: keyof typeof config) => {
    if (!isSuperAdmin) return;
    const newVal = !config[key];
    AIOperationsController.updateConfig({ [key]: newVal }, currentUser.email);
    refreshData();
  };

  // Update evaluation status
  const handleEvalStatus = (id: string, status: AIOpsEvaluation['status']) => {
    EvaluationMonitor.updateStatus(id, status, currentUser.email);
    refreshData();
  };

  // Update incident status
  const handleIncidentStatus = (id: string, status: AIOpsIncident['status']) => {
    if (!isSuperAdmin && status === 'resolved') {
      // Admin can change status, but only super admin closes incidents
      // Wait, prompt: "SUPER ADMIN: close incidents"
      // "ADMIN: View, review, flag"
      // So let's allow Admin to investigate, but only Super Admin to resolve (close)
      return;
    }
    AIOperationsController.updateIncidentStatus(id, status, currentUser.email);
    refreshData();
  };

  // Create incident
  const handleCreateIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDesc.trim()) return;
    AIOperationsController.createIncident(incidentType, incidentDesc, incidentSeverity, currentUser.email);
    setIncidentDesc('');
    setShowCreateIncident(false);
    refreshData();
  };

  return (
    <div className="space-y-8" id="aiops-ops-center-stage">
      
      {/* Header Panel with Live telemetry heartbeat */}
      <div className="bg-stone-900 text-stone-100 p-8 rounded-[32px] border border-stone-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
                <Flame className="w-5 h-5 animate-pulse" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 font-bold">
                AIOps Center • Governance Portal
              </span>
            </div>
            <h1 className="font-sans font-bold text-2xl tracking-tight text-white">
              {lang === 'FR' ? "Centre d'Opérations IA (AIOps)" : "AI Operations Center (AIOps)"}
            </h1>
            <p className="text-stone-400 text-xs max-w-xl leading-relaxed">
              {lang === 'FR' 
                ? "Gouvernance en temps réel et surveillance opérationnelle de la plateforme d'entretiens Shana. Assurer la conformité légale, la qualité des modélisations et la gestion des incidents." 
                : "Real-time AI governance & operational monitoring engine for the Shana interview platform. Enforces system compliance, latency tracking, and incident resolution."}
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between border-t border-stone-800 pt-4 md:pt-0 md:border-0">
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 justify-end text-xs font-semibold text-stone-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Telemetry Active</span>
              </div>
              <p className="text-[10px] font-mono text-stone-500">
                {lang === 'FR' ? `Mise à jour dans ${refreshCountdown}s` : `Auto-updating in ${refreshCountdown}s`}
              </p>
            </div>

            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-2.5 bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white rounded-xl border border-stone-700 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              title={lang === 'FR' ? "Actualiser maintenant" : "Refresh now"}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Super-Admin System Overrides (Enforces "SUPER ADMIN: disable AI, pause new interviews, activate fallback") */}
        <div className="bg-stone-950/60 p-5 rounded-2xl border border-stone-800/80 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-400" />
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-stone-300 font-bold">
              {lang === 'FR' ? "Commandes de Secours Globaux (Super Admin Uniquement)" : "Global Governance Overrides (Super Admin Only)"}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Control 1: Disable AI Feature */}
            <div className="bg-stone-900/50 p-4 rounded-xl border border-stone-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-sans font-bold text-xs text-stone-200">
                  {lang === 'FR' ? "Désactiver Fonctionnalités IA" : "Disable AI Features"}
                </p>
                <p className="text-[10px] text-stone-500">
                  {lang === 'FR' ? "Arrête temporairement tout le pipeline" : "Force-shuts all active AI agents"}
                </p>
              </div>
              <button
                onClick={() => handleConfigToggle('aiFeatureDisabled')}
                disabled={!isSuperAdmin}
                className={`cursor-pointer transition-opacity ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {config.aiFeatureDisabled ? (
                  <ToggleRight className="w-8 h-8 text-rose-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-stone-600" />
                )}
              </button>
            </div>

            {/* Control 2: Pause New Interviews */}
            <div className="bg-stone-900/50 p-4 rounded-xl border border-stone-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-sans font-bold text-xs text-stone-200">
                  {lang === 'FR' ? "Mettre en Pause Nouveaux Entretiens" : "Pause New Interviews"}
                </p>
                <p className="text-[10px] text-stone-500">
                  {lang === 'FR' ? "Empêche l'accès aux nouveaux candidats" : "Prevents new interview setups"}
                </p>
              </div>
              <button
                onClick={() => handleConfigToggle('pauseNewInterviews')}
                disabled={!isSuperAdmin}
                className={`cursor-pointer transition-opacity ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {config.pauseNewInterviews ? (
                  <ToggleRight className="w-8 h-8 text-rose-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-stone-600" />
                )}
              </button>
            </div>

            {/* Control 3: Activate Fallback Mode */}
            <div className="bg-stone-900/50 p-4 rounded-xl border border-stone-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-sans font-bold text-xs text-stone-200">
                  {lang === 'FR' ? "Activer Mode de Secours (Fallback)" : "Activate Fallback"}
                </p>
                <p className="text-[10px] text-stone-500">
                  {lang === 'FR' ? "Bascule sur un modèle léger bas-débit" : "Reroutes to lightweight text agent"}
                </p>
              </div>
              <button
                onClick={() => handleConfigToggle('fallbackActivated')}
                disabled={!isSuperAdmin}
                className={`cursor-pointer transition-opacity ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {config.fallbackActivated ? (
                  <ToggleRight className="w-8 h-8 text-rose-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-stone-600" />
                )}
              </button>
            </div>
          </div>
          
          {!isSuperAdmin && (
            <p className="text-amber-500 text-[10px] font-semibold text-center italic mt-1">
              {lang === 'FR' 
                ? "🔒 Privilèges Super Admin requis pour activer les commandes de secours."
                : "🔒 Super Admin authorization is required to toggle recovery safeguards."}
            </p>
          )}
        </div>
      </div>

      {/* Non-Blocking Alerts Area (Section 5 ALERTS) */}
      {alerts.length > 0 && (
        <div className="space-y-2" id="aiops-non-blocking-alerts">
          <div className="flex items-center gap-1.5 px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
              {lang === 'FR' ? "Flux d'Alerte Actif" : "Active Alerts Stream"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.slice(0, 2).map((alert) => (
              <div 
                key={alert.id}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 text-left ${
                  alert.type === 'critical' 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : alert.type === 'warning' 
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="mt-0.5">
                  {alert.type === 'critical' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : alert.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="font-sans text-xs font-bold truncate leading-tight">
                    {alert.message}
                  </p>
                  <p className="text-[9px] font-mono opacity-60">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-stone-200" id="aiops-tab-bar">
        {[
          { id: 'dashboard', label: lang === 'FR' ? 'AIOps Dashboard' : 'AIOps Dashboard', icon: Activity },
          { id: 'monitor', label: lang === 'FR' ? 'Suivi des Entretiens' : 'Live Monitor', icon: Video },
          { id: 'evaluation', label: lang === 'FR' ? 'Validation des Évals' : 'Evaluation Review', icon: BookOpen },
          { id: 'quality', label: lang === 'FR' ? 'Indicateurs Qualité' : 'Quality Center', icon: Cpu },
          { id: 'performance', label: lang === 'FR' ? 'Optimisation & Perf' : 'Performance Center', icon: Gauge },
          { id: 'incidents', label: lang === 'FR' ? 'Centre d\'Incidents' : 'Incident Center', icon: ShieldAlert },
          { id: 'reliability', label: lang === 'FR' ? 'Centre de Résilience' : 'Resilience Center', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setSelectedSession(null); // Reset detail view
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shrink-0 transition-all ${
                isActive 
                  ? 'bg-stone-950 text-white shadow-md' 
                  : 'text-stone-500 hover:text-stone-950 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'incidents' && incidents.filter(i => i.status === 'open' || i.status === 'investigating').length > 0 && (
                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-rose-500 text-white rounded-full">
                  {incidents.filter(i => i.status === 'open' || i.status === 'investigating').length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Areas */}
      <div className="animate-fade-in" id="aiops-main-canvas">
        
        {/* SECTION 1: AIOPS DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 text-left" id="section-1-dashboard">
            
            {/* Real Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Stat 1: Active Interviews */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#6B7280] font-bold">
                    {lang === 'FR' ? "Entretiens Actifs" : "Active Interviews"}
                  </span>
                  <span className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
                    <Video className="w-4 h-4" />
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-sans font-extrabold text-3xl text-stone-900 tracking-tight">
                    {metrics.activeInterviews}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>{lang === 'FR' ? "Interviews en cours" : "Live sessions running"}</span>
                  </p>
                </div>
              </div>

              {/* Stat 2: AI Availability */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#6B7280] font-bold">
                    {lang === 'FR' ? "Disponibilité IA" : "AI Availability"}
                  </span>
                  <span className="p-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
                    <Cpu className="w-4 h-4" />
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-sans font-extrabold text-3xl text-stone-900 tracking-tight">
                    {metrics.aiAvailability}%
                  </p>
                  <p className="text-[10px] text-stone-500">
                    {config.aiFeatureDisabled ? 'Forced Offline' : 'Global SLA Status'}
                  </p>
                </div>
              </div>

              {/* Stat 3: Completion Rate */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#6B7280] font-bold">
                    {lang === 'FR' ? "Taux de Complétion" : "Completion Rate"}
                  </span>
                  <span className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-sans font-extrabold text-3xl text-stone-900 tracking-tight">
                    {metrics.completionRate}%
                  </p>
                  <p className="text-[10px] text-indigo-600 font-semibold">
                    Target SLA: &gt;85.0%
                  </p>
                </div>
              </div>

              {/* Stat 4: Average Latency */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#6B7280] font-bold">
                    {lang === 'FR' ? "Latence IA" : "Average Latency"}
                  </span>
                  <span className="p-1.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-600">
                    <Clock className="w-4 h-4" />
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-sans font-extrabold text-3xl text-stone-900 tracking-tight">
                    {metrics.latency}ms
                  </p>
                  <p className={`text-[10px] font-semibold ${metrics.latency < 200 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {metrics.latency < 200 ? 'Optimal Performance' : 'Higher voice workload'}
                  </p>
                </div>
              </div>
            </div>

            {/* Voice & Mirror usage dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Box: Interface & Media distribution */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs space-y-4">
                <h3 className="font-sans font-bold text-base text-stone-900">
                  {lang === 'FR' ? "Utilisation des Médias et Télémétrie" : "Media Usage & Telemetry Channels"}
                </h3>
                
                <div className="space-y-4">
                  {/* Voice usage bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-stone-700">{lang === 'FR' ? "Entretiens Vocaux (Twilio/Google Speech)" : "Voice Assessment Usage (Twilio)"}</span>
                      <span className="text-stone-900">{metrics.voiceUsage}%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-stone-950 h-full rounded-full transition-all" style={{ width: `${metrics.voiceUsage}%` }}></div>
                    </div>
                  </div>

                  {/* Mirror usage bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-stone-700">{lang === 'FR' ? "Bilan Miroir de Personnalité" : "Mirror Personality Assessment"}</span>
                      <span className="text-stone-900">{metrics.mirrorUsage}%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-stone-700 h-full rounded-full transition-all" style={{ width: `${metrics.mirrorUsage}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-2xl flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-stone-600 leading-relaxed font-semibold">
                    {lang === 'FR'
                      ? "Les indicateurs de médias vocaux utilisent un modèle de synthèse vocal en streaming asynchrone pour réduire le coût d'acquisition de serveurs."
                      : "Voice media telemetry tracking operates on asynchronous stream analysis to guarantee minimal WebSocket thread overhead."}
                  </p>
                </div>
              </div>

              {/* Right Box: Live active alarms/latency threshold */}
              <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-sans font-bold text-base text-stone-900">
                    {lang === 'FR' ? "Télémétrie Globale" : "System Health Thresholds"}
                  </h3>
                  <p className="text-[#6B7280] text-xs font-medium">
                    {lang === 'FR' ? "Seuils d'interruption et erreurs de service asynchrone." : "System health variables analyzed automatically by the Shana Quality Engine."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-stone-50 border border-stone-150 rounded-2xl text-left">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                      {lang === 'FR' ? "Pertes de Paquets" : "Websocket Jitter"}
                    </p>
                    <p className="font-sans font-extrabold text-xl text-stone-900 mt-1">12ms</p>
                    <p className="text-[9px] text-emerald-600 font-bold">● Healthy</p>
                  </div>

                  <div className="p-3.5 bg-stone-50 border border-stone-150 rounded-2xl text-left">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                      {lang === 'FR' ? "Erreurs API Actives" : "Active Core Errors"}
                    </p>
                    <p className="font-sans font-extrabold text-xl text-stone-900 mt-1">{metrics.errors}</p>
                    <p className={`text-[9px] font-bold ${metrics.errors === 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {metrics.errors === 0 ? '● Nominal' : '● Action Required'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SECTION 2: INTERVIEW MONITOR (Live interview monitoring, READ-ONLY, compliance constraint) */}
        {activeTab === 'monitor' && (
          <div className="space-y-6 text-left" id="section-2-monitor">
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-sans font-bold text-xs">
                  {lang === 'FR' ? "CONFORMITÉ DE CONFIDENTIALITÉ DES CANDIDATS (RGPD / ACTE IA)" : "CANDIDATE PRIVACY COMPLIANCE (GDPR / AI ACT)"}
                </p>
                <p className="text-[11px] leading-relaxed opacity-90 font-semibold">
                  {lang === 'FR' 
                    ? "Conformément à la réglementation sur la protection des données, vous n'avez pas accès aux flux audio/vidéo des candidats en direct ni aux transcriptions des réponses textuelles. L'intervention en direct est désactivée par défaut." 
                    : "In accordance with candidate privacy parameters, you are restricted from accessing raw live audio/video feeds or prompt transcripts. Live interventions or direct session tampering are disabled."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sessions List (2 cols on large screen) */}
              <div className="lg:col-span-2 bg-white border border-stone-200 rounded-[32px] shadow-xs overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                  <h3 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Flux des Entretiens en Direct" : "Live Session Telemetry Streams"}
                  </h3>
                  <span className="font-mono text-[9px] bg-stone-200 text-stone-700 font-bold px-2.5 py-1 rounded">
                    {liveSessions.length} {lang === 'FR' ? "SESSIONS CAPTÉES" : "TOTAL SESSIONS"}
                  </span>
                </div>

                <div className="divide-y divide-stone-100">
                  {liveSessions.map((session) => {
                    const state = SessionAnalyzer.mapSessionState(session.status, session.progress);
                    return (
                      <div 
                        key={session.id}
                        className={`p-5 transition-colors cursor-pointer hover:bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          selectedSession?.id === session.id ? 'bg-stone-50' : ''
                        }`}
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-900">{session.id}</span>
                            <span className="font-mono text-[9px] font-bold bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                              {session.language}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase ${
                              state === 'running' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : state === 'paused' 
                                ? 'bg-amber-100 text-amber-800'
                                : state === 'waiting'
                                ? 'bg-blue-100 text-blue-800'
                                : state === 'completed'
                                ? 'bg-purple-100 text-purple-800'
                                : state === 'error'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-stone-100 text-stone-800'
                            }`}>
                              {state}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-[11px] text-[#6B7280] font-semibold">
                            <span>{session.candidateName}</span>
                            <span>•</span>
                            <span className="font-mono">{session.duration}</span>
                            <span>•</span>
                            <span className="uppercase text-[10px] font-bold text-stone-500">{session.mode}</span>
                          </div>
                        </div>

                        {/* Progress and click arrow */}
                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <div className="w-24 bg-stone-100 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                state === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                              }`} 
                              style={{ width: `${session.progress}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-xs text-stone-600 w-8 text-right font-bold">
                            {session.progress}%
                          </span>
                          <button className="p-1.5 text-stone-400 hover:text-stone-900">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Session Inspector Side panel (Compliance constrained, Timeline only) */}
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
                <div className="border-b border-stone-100 pb-4 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-stone-600" />
                    <h3 className="font-sans font-bold text-sm text-stone-900">
                      {lang === 'FR' ? "Inspecteur de Session" : "Interview Inspector"}
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Analyse de structure et télémétrie" : "Timeline and active configuration parameters."}
                  </p>
                </div>

                {selectedSession ? (
                  <div className="space-y-6 animate-fade-in text-xs font-semibold text-stone-700">
                    
                    {/* Basic telemetry metadata */}
                    <div className="space-y-2 p-4 bg-stone-50 rounded-2xl border border-stone-150">
                      <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                        Telemetry Information
                      </p>
                      <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                        <div>
                          <p className="text-[#6B7280]">Session ID:</p>
                          <p className="font-mono text-stone-900 font-bold">{selectedSession.id}</p>
                        </div>
                        <div>
                          <p className="text-[#6B7280]">Mode:</p>
                          <p className="text-stone-900 font-bold">{selectedSession.mode}</p>
                        </div>
                        <div>
                          <p className="text-[#6B7280]">Created Stamp:</p>
                          <p className="text-stone-900 font-bold">
                            {selectedSession.started ? new Date(selectedSession.started).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#6B7280]">Language:</p>
                          <p className="text-stone-900 font-bold">{selectedSession.language}</p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                        {lang === 'FR' ? "Chronologie de l'Entretien" : "Phase Timeline history"}
                      </p>

                      <div className="relative pl-6 border-l border-stone-200 space-y-4">
                        {(selectedSession.timeline || []).map((t, idx) => (
                          <div key={idx} className="relative">
                            {/* Bullet indicator */}
                            <span className={`absolute -left-[30px] top-0.5 w-3 h-3 rounded-full border-2 ${
                              t.completed 
                                ? 'bg-emerald-500 border-emerald-100' 
                                : selectedSession.currentPhase === t.phase 
                                ? 'bg-amber-500 border-amber-100 animate-ping'
                                : 'bg-stone-200 border-white'
                            }`}></span>
                            
                            <div>
                              <p className="font-sans font-bold text-[11px] text-stone-900 leading-tight">
                                {t.phase}
                              </p>
                              {t.timestamp && (
                                <p className="font-mono text-[9px] text-stone-400 mt-0.5">
                                  {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Restricted access banner */}
                    <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl text-[10px] space-y-1.5 leading-relaxed">
                      <p className="font-bold uppercase tracking-wider flex items-center gap-1">
                        <FileLock className="w-3.5 h-3.5" />
                        <span>Compliance Restriction</span>
                      </p>
                      <p className="opacity-90 font-semibold">
                        {lang === 'FR' 
                          ? "Conformément à la politique RGPD, l'accès au flux d'enregistrement vidéo et aux retranscriptions directes est masqué et conservé de façon chiffrée."
                          : "Access to the transcript files, raw bio-vocal feeds, and webcam streams are restricted from this administrative monitor."}
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 text-stone-400">
                    <HelpCircle className="w-10 h-10 stroke-[1.25]" />
                    <p className="text-xs font-bold">
                      {lang === 'FR' ? "Sélectionnez un entretien" : "Select an active session"}
                    </p>
                    <p className="text-[10px] text-[#6B7280]">
                      {lang === 'FR' ? "Cliquez sur une ligne pour inspecter sa chronologie." : "Click on a telemetry log to inspect timeline history."}
                    </p>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* SECTION 3: EVALUATION REVIEW */}
        {activeTab === 'evaluation' && (
          <div className="space-y-6 text-left" id="section-3-evaluation">
            
            <div className="bg-white border border-stone-200 rounded-[32px] shadow-xs overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Dossiers d'Évaluation de l'IA" : "AI Candidate Evaluation Reviews"}
                  </h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' 
                      ? "Examinez les dossiers d'évaluations synthétisés par Shana. Vous pouvez approuver, signaler ou demander une révision." 
                      : "Audit machine-generated scores and recommendation logs. Modify statuses without direct score tampering."}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100 font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                      <th className="p-4">{lang === 'FR' ? "ID ÉVAL" : "EVAL ID"}</th>
                      <th className="p-4">{lang === 'FR' ? "CANDIDAT" : "CANDIDATE"}</th>
                      <th className="p-4">ROLE</th>
                      <th className="p-4">{lang === 'FR' ? "SCORE GÉNÉRÉ" : "SCORE"}</th>
                      <th className="p-4">COMPLÉTION</th>
                      <th className="p-4">RECOMMENDATION</th>
                      <th className="p-4">CONFIANCE</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-semibold text-stone-700">
                    {evaluations.map((ev) => (
                      <tr key={ev.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4 font-mono text-stone-900 font-bold">{ev.id}</td>
                        <td className="p-4 font-sans font-bold text-stone-900">{ev.candidateName}</td>
                        <td className="p-4 text-stone-600">{ev.roleApplied}</td>
                        <td className="p-4">
                          <span className="font-mono text-stone-900 font-bold text-sm">
                            {ev.generatedScore}
                          </span>
                          <span className="text-[10px] text-stone-400 font-normal">/100</span>
                        </td>
                        <td className="p-4 font-mono">{ev.completion}%</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-bold ${
                            ev.recommendation === 'STRONG_HIRE' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : ev.recommendation === 'HIRE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : ev.recommendation === 'HOLD'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {ev.recommendation}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase ${
                            ev.confidenceLevel === 'high' 
                              ? 'bg-green-100 text-green-800' 
                              : ev.confidenceLevel === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {ev.confidenceLevel}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-bold ${
                            ev.status === 'approved' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : ev.status === 'flagged'
                              ? 'bg-rose-100 text-rose-800'
                              : ev.status === 'review_requested'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-stone-100 text-stone-800'
                          }`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEvalStatus(ev.id, 'approved')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                            >
                              {lang === 'FR' ? "Valider" : "Approve"}
                            </button>
                            <button
                              onClick={() => handleEvalStatus(ev.id, 'flagged')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                            >
                              {lang === 'FR' ? "Signaler" : "Flag"}
                            </button>
                            <button
                              onClick={() => handleEvalStatus(ev.id, 'review_requested')}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                            >
                              {lang === 'FR' ? "Réviser" : "Review"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SECTION 4: QUALITY CENTER */}
        {activeTab === 'quality' && (
          <div className="space-y-8 text-left" id="section-4-quality">
            
            {/* Top Indicator Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qualityIndicators.map((ind) => (
                <div 
                  key={ind.id} 
                  className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs space-y-4 text-left flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-sans font-bold text-sm text-stone-900">{ind.name}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase font-extrabold ${
                        ind.status === 'healthy' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : ind.status === 'warning'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {ind.status}
                      </span>
                    </div>
                    <p className="text-stone-500 text-[11px] leading-relaxed font-medium">
                      {ind.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100">
                    <p className="font-mono text-2xl font-extrabold text-stone-950">
                      {ind.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Side: Diagnostics and Regression */}
              <div className="space-y-8">
                
                {/* 1. Self-Diagnostic Health Checker */}
                <div className="bg-white border border-stone-200 rounded-[32px] p-6 space-y-6 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="font-sans font-bold text-base text-stone-900 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-emerald-600" />
                        <span>{lang === 'FR' ? "Auto-Diagnostic de la Plateforme" : "Platform Self-Diagnostics"}</span>
                      </h3>
                      <p className="text-xs text-stone-500 font-semibold">
                        {lang === 'FR' ? "Vérification en direct de la connectivité et des intégrations." : "Live connection validation & hardware permission auditing."}
                      </p>
                    </div>
                    <button
                      onClick={runDiagnosticTest}
                      disabled={isDiagnosing}
                      className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                      <span>{isDiagnosing ? (lang === 'FR' ? "Analyse..." : "Diagnosing...") : (lang === 'FR' ? "Lancer" : "Run")}</span>
                    </button>
                  </div>

                  {diagnosticReport && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex justify-between items-center">
                        <div>
                          <p className="text-stone-500 text-[10px] uppercase font-mono tracking-wider">{lang === 'FR' ? "Connectivité API" : "API Connectivity"}</p>
                          <p className="text-stone-900 mt-0.5">{lang === 'FR' ? "Opérationnel" : "Fully Online"}</p>
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full ${diagnosticReport.apiConnectivity === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      </div>

                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex justify-between items-center">
                        <div>
                          <p className="text-stone-500 text-[10px] uppercase font-mono tracking-wider">{lang === 'FR' ? "Synchronisation Firestore" : "Firestore Metadata Sync"}</p>
                          <p className="text-stone-900 mt-0.5">{lang === 'FR' ? "Canal actif" : "Channel Active"}</p>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>

                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex justify-between items-center">
                        <div>
                          <p className="text-stone-500 text-[10px] uppercase font-mono tracking-wider">{lang === 'FR' ? "Pipeline Vocal" : "Vocal Pipeline"}</p>
                          <p className="text-stone-900 mt-0.5">{lang === 'FR' ? "Prêt (Twilio)" : "Ready (Twilio)"}</p>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>

                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex justify-between items-center">
                        <div>
                          <p className="text-stone-500 text-[10px] uppercase font-mono tracking-wider">{lang === 'FR' ? "Latence de Streaming" : "Streaming Latency"}</p>
                          <p className="text-stone-900 mt-0.5">{diagnosticReport.streamingLatencyMs}ms (Nominal)</p>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>

                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex justify-between items-center">
                        <div>
                          <p className="text-stone-500 text-[10px] uppercase font-mono tracking-wider">{lang === 'FR' ? "Hardware Microphone" : "Microphone Input"}</p>
                          <p className="text-stone-900 mt-0.5">{lang === 'FR' ? "Autorisé / Actif" : "Authorized / Active"}</p>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>

                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex justify-between items-center">
                        <div>
                          <p className="text-stone-500 text-[10px] uppercase font-mono tracking-wider">{lang === 'FR' ? "Hardware Caméra" : "Camera Sensor"}</p>
                          <p className="text-stone-900 mt-0.5">{lang === 'FR' ? "Autorisé / Actif" : "Authorized / Active"}</p>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  )}

                  <div className="bg-stone-900 text-stone-100 p-4 rounded-2xl flex items-center justify-between text-xs font-mono font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{lang === 'FR' ? "STATUT GLOBAL DE LA STACK :" : "SYSTEM OVERALL HEALTH :"}</span>
                    </div>
                    <span className="text-emerald-400 uppercase tracking-widest">{diagnosticReport?.overallStatus || 'healthy'}</span>
                  </div>
                </div>

                {/* 2. AI Regression & Drift Detector */}
                <div className="bg-white border border-stone-200 rounded-[32px] p-6 space-y-6 shadow-sm">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-base text-stone-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-600" />
                      <span>{lang === 'FR' ? "Détection de Régression & Dérive" : "AI Regression & Drift Detector"}</span>
                    </h3>
                    <p className="text-xs text-stone-500 font-semibold">
                      {lang === 'FR' ? "Compare les KPIs actuels aux références historiques (Baseline v2.1)." : "Compares actual performance data to historically validated baseline."}
                    </p>
                  </div>

                  {regressionReport && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold font-mono">
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-150">
                          <p className="text-stone-500 text-[9px] uppercase tracking-wider">{lang === 'FR' ? "Qualité Conversation" : "Conversation Quality"}</p>
                          <p className="text-emerald-600 text-sm font-extrabold mt-1">+{regressionReport.conversationQualityDelta}%</p>
                        </div>
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-150">
                          <p className="text-stone-500 text-[9px] uppercase tracking-wider">{lang === 'FR' ? "Précision Éval" : "Evaluation Drift"}</p>
                          <p className="text-stone-600 text-sm font-extrabold mt-1">{regressionReport.evaluationRegressionDelta}%</p>
                        </div>
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-150">
                          <p className="text-stone-500 text-[9px] uppercase tracking-wider">{lang === 'FR' ? "Efficacité Prompts" : "Prompt Efficiency"}</p>
                          <p className="text-rose-600 text-sm font-extrabold mt-1">{regressionReport.promptPerformanceDelta}%</p>
                        </div>
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-150">
                          <p className="text-stone-500 text-[9px] uppercase tracking-wider">{lang === 'FR' ? "Réalisme Recruteur" : "Recruiter Realism"}</p>
                          <p className="text-emerald-600 text-sm font-extrabold mt-1">+{regressionReport.recruiterRealismDelta}%</p>
                        </div>
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-150">
                          <p className="text-stone-500 text-[9px] uppercase tracking-wider">{lang === 'FR' ? "Latence Globale" : "Overall Latency"}</p>
                          <p className="text-rose-600 text-sm font-extrabold mt-1">+{regressionReport.latencyDelta}%</p>
                        </div>
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-150">
                          <p className="text-stone-500 text-[9px] uppercase tracking-wider">{lang === 'FR' ? "Statut Dérive" : "Drift Status"}</p>
                          <p className="text-stone-900 text-sm font-extrabold mt-1 uppercase tracking-widest">{regressionReport.status === 'nominal' ? 'NOMINAL' : 'ALERT'}</p>
                        </div>
                      </div>

                      {regressionReport.alerts.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
                          <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{lang === 'FR' ? "Alertes de Dérive Détectées" : "Behavioral Drift Alerts"}</span>
                          </div>
                          <ul className="list-disc list-inside text-stone-700 text-[11px] leading-relaxed font-semibold pl-1">
                            {regressionReport.alerts.map((al: string, idx: number) => (
                              <li key={idx}>{al}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Side: Prompt Quality Analyzer */}
              <div className="space-y-8">
                
                <div className="bg-white border border-stone-200 rounded-[32px] p-6 space-y-6 shadow-sm">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-base text-stone-900 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      <span>{lang === 'FR' ? "Analyseur de Qualité des Prompts" : "Prompt Quality Analyzer"}</span>
                    </h3>
                    <p className="text-xs text-stone-500 font-semibold">
                      {lang === 'FR' ? "Mesurez la redondance et la stabilité de vos instructions systeme." : "Inspect instruction redundancy, estimated token sizes, and stability index."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-stone-500 font-bold font-mono">
                        {lang === 'FR' ? "Sélectionner le Template de Prompt" : "Select Prompt Template"}
                      </label>
                      <select
                        value={selectedPromptId}
                        onChange={(e) => handlePromptAnalysisChange(e.target.value)}
                        className="w-full bg-white border border-stone-200 p-3 rounded-xl font-bold text-xs text-stone-800 focus:outline-hidden"
                      >
                        {Object.entries(promptTemplates).map(([id, t]) => (
                          <option key={id} value={id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-stone-500 font-bold font-mono">
                        {lang === 'FR' ? "Instructions Système Actuelles" : "System Instructions text"}
                      </label>
                      <textarea
                        value={promptTemplates[selectedPromptId]?.text || ''}
                        onChange={(e) => handleCustomPromptAnalyze(e.target.value)}
                        rows={5}
                        className="w-full bg-stone-50 border border-stone-200 p-4 rounded-xl text-stone-800 text-[11px] font-mono leading-relaxed focus:outline-hidden resize-none"
                      />
                    </div>

                    {promptAnalysis && (
                      <div className="space-y-4 pt-4 border-t border-stone-100">
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                          <div className="space-y-1 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                            <span className="text-stone-500 text-[10px] uppercase tracking-wider">{lang === 'FR' ? "Score d'Efficacité" : "Efficiency Rating"}</span>
                            <p className="text-stone-900 font-mono text-lg font-extrabold">{promptAnalysis.efficiencyScore.toFixed(0)}/100</p>
                          </div>
                          <div className="space-y-1 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                            <span className="text-stone-500 text-[10px] uppercase tracking-wider">{lang === 'FR' ? "Index de Stabilité" : "Stability Index"}</span>
                            <p className="text-stone-900 font-mono text-lg font-extrabold">{promptAnalysis.stabilityScore.toFixed(0)}/100</p>
                          </div>
                          <div className="space-y-1 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                            <span className="text-stone-500 text-[10px] uppercase tracking-wider">{lang === 'FR' ? "Taux de Redondance" : "Redundancy rate"}</span>
                            <p className="text-stone-900 font-mono text-lg font-extrabold">{promptAnalysis.redundancyPercent}%</p>
                          </div>
                          <div className="space-y-1 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                            <span className="text-stone-500 text-[10px] uppercase tracking-wider">{lang === 'FR' ? "Tokens Estimés" : "Estimated tokens"}</span>
                            <p className="text-stone-900 font-mono text-lg font-extrabold">{promptAnalysis.tokenConsumptionEst} tok</p>
                          </div>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl space-y-2">
                          <div className="flex items-center gap-1.5 text-indigo-800 text-xs font-bold">
                            <Sparkles className="w-4 h-4" />
                            <span>{lang === 'FR' ? "Recommandations d'Optimisation" : "Optimization Recommendations"}</span>
                          </div>
                          <ul className="list-disc list-inside text-stone-700 text-[11px] leading-relaxed font-semibold pl-1">
                            {promptAnalysis.recommendations.map((rec: string, idx: number) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Row: Conversation Auditor & IQS compiler */}
            <div className="bg-white border border-stone-200 rounded-[32px] p-6 space-y-6 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-sans font-bold text-base text-stone-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  <span>{lang === 'FR' ? "Auditeur de Conversation & Compilateur IQS" : "Conversation Auditor & IQS Compiler"}</span>
                </h3>
                <p className="text-xs text-stone-500 font-semibold">
                  {lang === 'FR' ? "Analysez l'historique d'un entretien pour compiler son score de qualité global." : "Analyze session conversational flow, memory usage, and compute overall IQS."}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-1.5 flex-1 text-xs font-bold">
                    <label className="text-[10px] uppercase tracking-wider text-stone-500 font-bold font-mono">
                      {lang === 'FR' ? "Sélectionner la Session Active/Terminée" : "Select Active/Completed Session"}
                    </label>
                    <select
                      value={selectedAuditSessionId}
                      onChange={(e) => handleAuditSession(e.target.value)}
                      className="w-full bg-white border border-stone-200 p-3 rounded-xl font-bold text-xs text-stone-800 focus:outline-hidden"
                    >
                      <option value="">{lang === 'FR' ? "-- Choisir une Session --" : "-- Choose a Session --"}</option>
                      {liveSessions.map((sess) => (
                        <option key={sess.id} value={sess.id}>
                          {sess.candidateName} ({sess.id} - {sess.status.toUpperCase()} - {sess.mode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedAuditSessionId && auditReport && iqsMetrics && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-100">
                    
                    {/* Radar scores column */}
                    <div className="space-y-4">
                      <h4 className="font-sans font-bold text-xs text-stone-900 uppercase tracking-wider font-mono">
                        {lang === 'FR' ? "MÉTRIQUES DE QUALITÉ GLOBALES" : "INTELLIGENCE QUALITY METRICS"}
                      </h4>
                      <div className="space-y-3 font-semibold text-xs text-stone-700">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>{lang === 'FR' ? "Fluidité de Conversation" : "Conversation Flow"}</span>
                            <span className="font-mono font-bold text-stone-900">{iqsMetrics.conversationFlow}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${iqsMetrics.conversationFlow}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>{lang === 'FR' ? "Réalisme Recruteur" : "Recruiter Realism"}</span>
                            <span className="font-mono font-bold text-stone-900">{iqsMetrics.recruiterRealism}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${iqsMetrics.recruiterRealism}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>{lang === 'FR' ? "Diversité des Questions" : "Question Diversity"}</span>
                            <span className="font-mono font-bold text-stone-900">{iqsMetrics.questionDiversity}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${iqsMetrics.questionDiversity}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>{lang === 'FR' ? "Qualité de Relance" : "Follow-Up Quality"}</span>
                            <span className="font-mono font-bold text-stone-900">{iqsMetrics.followUpQuality}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${iqsMetrics.followUpQuality}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>{lang === 'FR' ? "Persistance de la Mémoire" : "Memory depth"}</span>
                            <span className="font-mono font-bold text-stone-900">{iqsMetrics.memoryUsage}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${iqsMetrics.memoryUsage}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>{lang === 'FR' ? "Expérience Candidat" : "Candidate Experience"}</span>
                            <span className="font-mono font-bold text-stone-900">{iqsMetrics.candidateExperience}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${iqsMetrics.candidateExperience}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Circular IQS score */}
                    <div className="flex flex-col items-center justify-center border-x border-stone-100 py-4 px-2 space-y-3">
                      <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold font-mono">
                        {lang === 'FR' ? "SCORE DE QUALITÉ DE L'ENTRETIEN (IQS)" : "INTERVIEW QUALITY SCORE (IQS)"}
                      </p>
                      <div className="relative w-32 h-32 flex items-center justify-center bg-stone-950 text-white rounded-full shadow-lg border-4 border-emerald-500">
                        <div className="text-center space-y-0.5">
                          <p className="text-4xl font-mono font-black">{iqsMetrics.overallQualityScore}</p>
                          <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold font-mono">PTS</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] uppercase font-bold rounded-full font-mono tracking-wider">
                        {iqsMetrics.overallQualityScore > 90 ? (lang === 'FR' ? "ÉLITE / CONFORME" : "ELITE / COMPLIANT") : (lang === 'FR' ? "STABLE / VALIDÉ" : "STABLE / APPROVED")}
                      </span>
                    </div>

                    {/* Identified issues & advice column */}
                    <div className="space-y-4 text-xs font-semibold">
                      <h4 className="font-sans font-bold text-xs text-stone-900 uppercase tracking-wider font-mono">
                        {lang === 'FR' ? "ANOMALIES & AUDIT CONVERSATIONNEL" : "CONVERSATION AUDITOR FEEDBACK"}
                      </h4>
                      
                      {auditReport.issues.length === 0 ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{lang === 'FR' ? "Aucun loop ou répétition de phrase n'a été détecté !" : "No conversational loops or repeated phrases identified!"}</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {auditReport.issues.map((iss: string, idx: number) => (
                            <div key={idx} className="p-3 bg-amber-50 border border-amber-150 rounded-xl flex items-start gap-2 text-stone-700 leading-relaxed text-[11px]">
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <span>{iss}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2">
                        <span className="text-stone-500 text-[9px] uppercase tracking-wider font-mono block">{lang === 'FR' ? "RÉSOLUTION CONSEILLÉE" : "AUTOPILOT ACTIONS RECOMMENDED"}</span>
                        <ul className="list-disc list-inside text-stone-700 text-[11px] leading-relaxed space-y-1 pl-1">
                          {auditReport.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-6 rounded-[32px] space-y-3">
              <h4 className="font-sans font-bold text-sm text-stone-900">
                {lang === 'FR' ? "Règles d'Évaluation Automatisées & Assurance Qualité" : "Automated QA Rules & Assessment Integrity Standards"}
              </h4>
              <p className="text-[#6B7280] text-xs font-semibold leading-relaxed">
                {lang === 'FR'
                  ? "La stack de vérification (QA Shield) s'exécute de manière synchrone sur les endpoints d'évaluation et de dialogue. Elle intercepte les biais d'évaluation, les répétitions de phrases et les hallucinations liées aux profils candidats (CV) pour polir automatiquement les réponses de l'agent vocal Shana avant diffusion."
                  : "The QA Verification Stack runs synchronously across chat and evaluation endpoints. It intercepts evaluation score discrepancies, robotic opening loops, and hallucinated profile experiences to self-heal the vocal agent response dynamically before it ever reaches the candidate's browser."}
              </p>
            </div>

          </div>
        )}

        {/* SECTION PERFORMANCE CENTER */}
        {activeTab === 'performance' && (
          <div className="space-y-8 text-left" id="section-performance-center">
            
            {/* Top Overview Bar */}
            <div className="bg-stone-900 text-stone-100 p-6 rounded-[32px] border border-stone-850 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="space-y-1">
                <h3 className="font-sans font-bold text-lg text-white flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-indigo-400" />
                  <span>{lang === 'FR' ? "Centre d'Opérations Entreprise & Haute Disponibilité" : "Enterprise Operations & High-Availability Center"}</span>
                </h3>
                <p className="text-xs text-stone-400 font-semibold">
                  {lang === 'FR' ? "Moteur de résilience globale Shana v3.6. Surveillance des microservices autonomes, du routage régional et des limites de charge." : "Shana global resilience engine v3.6. Autonomous microservice monitoring, multi-region routing failovers, and rate-limiting limits."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {enterpriseMetrics?.globalFailoverTriggered && (
                  <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono tracking-wide uppercase animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{lang === 'FR' ? "Failover Actif" : "Failover Active"}</span>
                  </span>
                )}
                <button
                  onClick={fetchPerformanceMetrics}
                  disabled={isPerfLoading}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPerfLoading ? 'animate-spin' : ''}`} />
                  <span>{lang === 'FR' ? "Actualiser" : "Refresh"}</span>
                </button>
              </div>
            </div>

            {/* Core Enterprise Live Telemetry Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Concurrent Workloads */}
              <div className="bg-white border border-stone-200 p-6 rounded-[32px] space-y-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 font-bold">
                    {lang === 'FR' ? "Volume Concurrence" : "Workload Concurrency"}
                  </span>
                  <span className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                    <Activity className="w-4 h-4" />
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-sans font-black text-3xl text-stone-900 tracking-tight">
                    {enterpriseMetrics?.concurrentInterviews || liveSessions.length} / 1,000+
                  </p>
                  <p className="text-[10px] text-stone-500 font-semibold leading-relaxed">
                    {lang === 'FR' ? "Entretiens actifs gérés simultanément avec isolation de mémoire." : "Active candidate sessions isolated at current node tier."}
                  </p>
                </div>
              </div>

              {/* Card 2: Database Throughput (Firestore) */}
              <div className="bg-white border border-stone-200 p-6 rounded-[32px] space-y-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 font-bold">
                    {lang === 'FR' ? "Transactions Firestore" : "Firestore Write Buffer"}
                  </span>
                  <span className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
                    <Database className="w-4 h-4" />
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-sans font-black text-3xl text-stone-900 tracking-tight">
                    {enterpriseMetrics?.dbThroughputOpsSec || 28} <span className="text-xs text-stone-400 font-mono">ops/s</span>
                  </p>
                  <p className="text-[10px] text-stone-500 font-semibold leading-relaxed">
                    {lang === 'FR' ? "Écritures groupées Firestore pour réduire la contention." : "Batched transaction queues buffer candidate milestones efficiently."}
                  </p>
                </div>
              </div>

              {/* Card 3: Distributed Worker Pool */}
              <div className="bg-white border border-stone-200 p-6 rounded-[32px] space-y-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 font-bold">
                    {lang === 'FR' ? "Pool de Workers AI" : "AI Worker Saturation"}
                  </span>
                  <span className="p-1.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-600">
                    <Cpu className="w-4 h-4" />
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <p className="font-sans font-black text-3xl text-stone-900 tracking-tight">
                      {enterpriseMetrics?.workerUtilizationPercent || 48}%
                    </p>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {enterpriseMetrics?.activeWorkers || 32} workers
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${enterpriseMetrics?.workerUtilizationPercent || 48}%` }} />
                  </div>
                </div>
              </div>

              {/* Card 4: Load Average Ratio */}
              <div className="bg-white border border-stone-200 p-6 rounded-[32px] space-y-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 font-bold">
                    {lang === 'FR' ? "Charge Système Moyenne" : "System Load Average"}
                  </span>
                  <span className="p-1.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600">
                    <Zap className="w-4 h-4" />
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-sans font-black text-3xl text-stone-900 tracking-tight">
                    {enterpriseMetrics?.averageSystemLoad || 0.85} <span className="text-xs text-stone-400 font-mono">LA</span>
                  </p>
                  <p className="text-[10px] text-stone-500 font-semibold leading-relaxed">
                    {lang === 'FR' ? "Ratio CPU global sur les instances de calcul." : "Load balancing target is below 2.00 limit for node pools."}
                  </p>
                </div>
              </div>

            </div>

            {/* Region Routing & High Availability Failover Module */}
            <div className="bg-white border border-stone-200 rounded-[32px] p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-sans font-black text-sm text-stone-900 flex items-center gap-2 uppercase tracking-wide">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span>{lang === 'FR' ? "Routage Multi-Régions & Tolérance aux Pannes" : "Multi-Region Traffic Routing & Failover Config"}</span>
                  </h4>
                  <p className="text-xs text-stone-500 font-semibold">
                    {lang === 'FR' ? "Déploiements régionaux pour rapprocher l'évaluation des candidats et optimiser la latence." : "Deploy regional endpoints to minimize audio streaming latency and safeguard regional DB compliance."}
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-full">
                  {lang === 'FR' ? `${regions.filter(r => r.status === 'online').length} Clusters Actifs` : `${regions.filter(r => r.status === 'online').length} Clusters Active`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {regions.map((region) => (
                  <div 
                    key={region.id} 
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between h-[180px] ${
                      region.status === 'failover_active'
                        ? "bg-amber-50/50 border-amber-200 shadow-xs"
                        : "bg-stone-50/30 border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-sans font-bold text-xs text-stone-900">{region.name}</span>
                        <span className={`w-2 h-2 rounded-full ${
                          region.status === 'online' ? "bg-emerald-500" : "bg-amber-500"
                        }`} />
                      </div>
                      <p className="font-mono text-[10px] text-stone-400 font-semibold select-all truncate">{region.apiEndpoint}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-500 font-mono">
                        <div>
                          <span className="block text-[8px] uppercase text-stone-400 font-bold">{lang === 'FR' ? "Latence" : "Latency"}</span>
                          <span className="font-bold text-stone-800">{region.latencyMs}ms</span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase text-stone-400 font-bold">{lang === 'FR' ? "Charge CPU" : "CPU Load"}</span>
                          <span className="font-bold text-stone-800">{region.loadPercent}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-150/50">
                        <span className="font-mono text-[9px] text-stone-400 font-semibold">{region.activeInstances} Nodes</span>
                        <button
                          type="button"
                          onClick={() => handleToggleFailover(region.id)}
                          className={`px-2 py-1 rounded-lg text-[9px] uppercase font-bold tracking-wider cursor-pointer border ${
                            region.status === 'failover_active'
                              ? "bg-amber-600 border-amber-600 text-white"
                              : "bg-white border-stone-250 text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          {region.status === 'failover_active' ? (lang === 'FR' ? "Rétablir" : "Recover") : (lang === 'FR' ? "Failover" : "Failover")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distributed Background Queue & Rate Limiting Profile Bento */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Background Job Queue (Queue Management) */}
              <div className="lg:col-span-7 bg-white border border-stone-200 rounded-[32px] p-6 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-stone-100 pb-4">
                  <div className="space-y-1">
                    <h4 className="font-sans font-black text-sm text-stone-900 flex items-center gap-2 uppercase tracking-wide">
                      <List className="w-4 h-4 text-indigo-600" />
                      <span>{lang === 'FR' ? "File d'Attente de Tâches Asynchrones" : "Asynchronous Task Queue Engine"}</span>
                    </h4>
                    <p className="text-xs text-stone-500 font-semibold">
                      {lang === 'FR' ? "Gérez l'évaluation asynchrone, la synchronisation DB et la génération de rapports." : "Fault-isolated background queue with automatic retry policies and execution logs."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={handleTickQueue}
                      className="inline-flex items-center gap-1 bg-stone-900 hover:bg-stone-850 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-xl cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 animate-pulse" />
                      <span>{lang === 'FR' ? "Tick Queue" : "Tick Queue"}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {queueJobs.map((job) => (
                    <div key={job.id} className="p-3.5 bg-stone-50/50 border border-stone-200 rounded-xl flex items-center justify-between text-xs gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-stone-900 uppercase text-[11px] truncate">
                            {job.taskType.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-[9px] text-stone-400 font-bold">({job.id})</span>
                        </div>
                        <p className="text-[10px] text-stone-500 font-semibold truncate">
                          {lang === 'FR' ? "Région cible : " : "Target Region : "} <span className="font-mono font-bold text-stone-700">{job.region}</span>
                          {" • "}
                          {lang === 'FR' ? "Payload : " : "Payload : "} <span className="font-mono font-bold text-stone-600">{JSON.stringify(job.payload)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right font-semibold">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider ${
                            job.status === 'completed'
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                              : job.status === 'failed'
                              ? "bg-rose-50 border border-rose-200 text-rose-800"
                              : "bg-indigo-50 border border-indigo-200 text-indigo-800"
                          }`}>
                            {job.status}
                          </span>
                          {job.retryCount > 0 && (
                            <span className="block text-[8px] font-mono text-amber-600 font-bold mt-0.5">
                              {job.retryCount}/{job.maxRetries} Retries
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      fetch('/api/admin/enterprise/queue/enqueue', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ taskType: 'learning_analysis', payload: { sessionId: 'SESS-201' } })
                      })
                        .then(res => res.json())
                        .then(() => fetchPerformanceMetrics());
                    }}
                    className="py-1.5 px-3 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 cursor-pointer font-bold"
                  >
                    + {lang === 'FR' ? "Déclencher Analyse" : "Enqueue Learning Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fetch('/api/admin/enterprise/queue/enqueue', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ taskType: 'report_generation', payload: { candidateId: 'CAND-502' } })
                      })
                        .then(res => res.json())
                        .then(() => fetchPerformanceMetrics());
                    }}
                    className="py-1.5 px-3 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 cursor-pointer font-bold"
                  >
                    + {lang === 'FR' ? "Générer Rapport" : "Enqueue Report Generation"}
                  </button>
                </div>
              </div>

              {/* Right Column: Rate Limiting Quotas & Tenant Isolation */}
              <div className="lg:col-span-5 bg-white border border-stone-200 rounded-[32px] p-6 space-y-6 shadow-sm">
                <div className="space-y-1">
                  <h4 className="font-sans font-black text-sm text-stone-900 flex items-center gap-2 uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>{lang === 'FR' ? "Politiques de Rate Limiting & Isolation" : "Rate Limiting & Tenant Isolation"}</span>
                  </h4>
                  <p className="text-xs text-stone-500 font-semibold">
                    {lang === 'FR' ? "Protégez l'infrastructure Shana contre les surcharges d'appels AI et d'écritures DB." : "Protect critical API endpoints and ensure fair worker allocation per client tier."}
                  </p>
                </div>

                <div className="space-y-3">
                  {rateLimits.map((profile) => (
                    <div key={profile.tier} className="p-3 border border-stone-100 rounded-2xl bg-stone-50/20 text-xs flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="font-bold text-stone-900 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            profile.tier === 'Enterprise' ? "bg-indigo-500" : profile.tier === 'Administrator' ? "bg-stone-950" : "bg-stone-400"
                          }`} />
                          {profile.tier}
                        </span>
                        <span className="text-[10px] text-stone-400 font-semibold font-mono">
                          Priority Weight: {profile.priorityWeight}x
                        </span>
                      </div>

                      <div className="text-right font-semibold">
                        <span className="font-mono text-stone-900 font-bold block text-[11px]">
                          {profile.maxRequestsPerMin} req/min
                        </span>
                        <span className="block text-[9px] text-stone-400 font-semibold">
                          {lang === 'FR' ? "Sessions simultanées max : " : "Max concurrency : "} {profile.maxConcurrentSessions}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Advanced Stress Testing Slider & Load Modeler */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Slider Controller */}
              <div className="lg:col-span-5 bg-white border border-stone-200 rounded-[32px] p-6 space-y-6 shadow-sm">
                <div className="space-y-1">
                  <h4 className="font-sans font-black text-sm text-stone-900 flex items-center gap-2 uppercase tracking-wide">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span>{lang === 'FR' ? "Simulateur Prédictif de Montée en Charge" : "Predictive Scale Load Modeler"}</span>
                  </h4>
                  <p className="text-xs text-stone-500 font-semibold">
                    {lang === 'FR' ? "Modélisez l'impact de dizaines de milliers de candidats passant des entretiens au même moment." : "Model system latency and fault-tolerance behavior up to 100,000 concurrent interview sessions."}
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-stone-400 font-bold font-mono block">
                      {lang === 'FR' ? "Cibles d'Utilisateurs Simultanés" : "Target Simultaneous Users"}
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[10000, 25000, 50000, 100000].map((users) => (
                        <button
                          key={users}
                          type="button"
                          onClick={() => setStressTargetUsers(users)}
                          className={`py-2 rounded-xl border text-[10px] font-bold font-mono transition-all cursor-pointer ${
                            stressTargetUsers === users
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                              : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          {users >= 1000 ? `${users / 1000}k` : users}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunStressEstimate(stressTargetUsers)}
                    disabled={isEstimatingStress}
                    className="w-full inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer shadow-md active:scale-98 transition-all disabled:opacity-50"
                  >
                    <Zap className={`w-4 h-4 ${isEstimatingStress ? 'animate-bounce' : ''}`} />
                    <span>
                      {isEstimatingStress 
                        ? (lang === 'FR' ? "Calcul de la charge..." : "Modeling stress loads...") 
                        : (lang === 'FR' ? "Calculer l'impact" : "Model Impact Estimates")}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Model Outcomes (Graceful Degradation Explainer) */}
              <div className="lg:col-span-7 bg-white border border-stone-200 rounded-[32px] p-6 space-y-6 shadow-sm flex flex-col justify-between">
                {stressEstimate ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400">{lang === 'FR' ? "PRÉDICTIONS POUR" : "SYSTEM PREDICTIONS FOR"}</span>
                        <h4 className="font-sans font-bold text-sm text-stone-900">{stressTargetUsers.toLocaleString()} {lang === 'FR' ? "Candidats Simultanés" : "Concurrent Candidates"}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
                        stressEstimate.stability === 'stable'
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : stressEstimate.stability === 'degraded'
                          ? "bg-amber-50 border-amber-200 text-amber-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}>
                        {stressEstimate.stability === 'stable' 
                          ? (lang === 'FR' ? "CONFORME & STABLE" : "COMPLIANT & STABLE") 
                          : stressEstimate.stability === 'degraded'
                          ? (lang === 'FR' ? "DÉGRADATION SANS RUPTURE" : "GRACEFUL DEGRADATION")
                          : (lang === 'FR' ? "CHARGEMENT SATURÉ" : "SATURATED LOAD")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                        <span className="text-[8px] uppercase tracking-wider text-stone-400 font-bold block">{lang === 'FR' ? "Latence Estimée" : "Estimated Latency"}</span>
                        <span className="font-mono text-sm font-extrabold text-stone-900">{stressEstimate.latencyMs}ms</span>
                      </div>
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                        <span className="text-[8px] uppercase tracking-wider text-stone-400 font-bold block">{lang === 'FR' ? "CPU Sature" : "CPU Saturation"}</span>
                        <span className="font-mono text-sm font-extrabold text-stone-900">{stressEstimate.cpuSaturation}%</span>
                      </div>
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                        <span className="text-[8px] uppercase tracking-wider text-stone-400 font-bold block">{lang === 'FR' ? "Lag Firestore" : "Firestore Lag"}</span>
                        <span className="font-mono text-sm font-extrabold text-stone-900">{stressEstimate.dbLagMs}ms</span>
                      </div>
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                        <span className="text-[8px] uppercase tracking-wider text-stone-400 font-bold block">{lang === 'FR' ? "Taux d'Erreurs" : "Error Rate"}</span>
                        <span className="font-mono text-sm font-extrabold text-stone-900">{stressEstimate.errorRatePercent}%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-stone-50 rounded-2xl text-[11px] leading-relaxed text-stone-600 font-semibold border border-stone-150 space-y-2">
                      <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
                        <Shield className="w-3.5 h-3.5" />
                        <span>{lang === 'FR' ? "Politique de Dégradation Gracieuse Active" : "Graceful Degradation Safeguards Triggered :"}</span>
                      </div>
                      <p>
                        {stressTargetUsers <= 25000 
                          ? (lang === 'FR' ? "Toutes les instances d'évaluation et de vocal WebRTC s'exécutent de manière native sans limitation de qualité." : "No compromises on model size. Normal latency profiling.")
                          : (lang === 'FR' ? "Shana bascule automatiquement les enregistrements vocaux en compression Opus adaptative de haute densité, retarde les calculs de referral de 5 minutes, et utilise des écritures DB groupées." : "Adaptive Opus WebRTC voice compression enabled. Secondary referral and evaluation queues postponed up to 5 minutes to reserve raw compute for active candidate audio channels.")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <TrendingUp className="w-10 h-10 text-stone-300" />
                    <div className="space-y-1 max-w-sm">
                      <p className="font-sans font-bold text-xs text-stone-900">{lang === 'FR' ? "Aucun impact calculé" : "No Load Simulation Active"}</p>
                      <p className="text-[11px] text-stone-400 leading-relaxed font-semibold">
                        {lang === 'FR' ? "Sélectionnez une cible de montée en charge à gauche pour simuler l'élasticité et le comportement du moteur Shana." : "Select a target concurrent load scale on the left and trigger calculation to inspect fault-tolerant behaviors."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Live Core Jitter and Audit Log Stream */}
            <div className="bg-stone-950 p-6 rounded-[32px] space-y-4 shadow-sm text-xs">
              <h4 className="font-sans font-bold text-xs text-stone-100 uppercase tracking-wider font-mono">
                {lang === 'FR' ? "Moteur d'Optimisation Shana — Journal en Direct" : "Shana Real-time Optimization Engine log stream"}
              </h4>
              <div className="bg-stone-900 p-4 rounded-2xl font-mono text-stone-300 space-y-2 max-h-[160px] overflow-y-auto font-bold text-[10px]">
                <p className="text-emerald-400">[{new Date().toISOString().substring(11, 19)}] [CACHE HIT] Reused system instructions for model recruiter (gpt-4o-mini)</p>
                <p className="text-stone-400">[{new Date().toISOString().substring(11, 19)}] [CONTEXT WINDOW] Compression triggered on session {selectedAuditSessionId || "SESS-719"}: truncated 4 messages. Tokens saved: 4,120</p>
                <p className="text-emerald-400">[{new Date().toISOString().substring(11, 19)}] [CACHE HIT] Competency framework rubric for Sales Specialist retrieved from memory cache</p>
                <p className="text-[#38BDF8]">[{new Date().toISOString().substring(11, 19)}] [BATCH WRITE] Flushed {enterpriseMetrics?.dbThroughputOpsSec || 14} cached candidate progress metrics synchronously to Firestore database</p>
                <p className="text-amber-400">[{new Date().toISOString().substring(11, 19)}] [AUDIO STREAMING] Dynamic jitter buffering active: adaptive latency adjusted to {perfMetrics?.averageResponseTimeMs || 195}ms</p>
              </div>
            </div>

          </div>
        )}

        {/* SECTION 5: INCIDENT CENTER */}
        {activeTab === 'incidents' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left" id="section-5-incidents">
            
            {/* Left/Middle Column: Incidents List & Audit Log */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Incidents Container */}
              <div className="bg-white border border-stone-200 rounded-[32px] shadow-xs overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-stone-50/50">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-sm text-stone-900">
                      {lang === 'FR' ? "Registre des Incidents Actifs" : "Operations Incident Log"}
                    </h3>
                    <p className="text-[11px] text-[#6B7280] font-semibold">
                      {lang === 'FR' ? "Suivez et résolvez les défaillances réseau ou applicatives." : "Investigate platform disconnections and vocal API lag spikes."}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowCreateIncident(!showCreateIncident)}
                    className="inline-flex items-center gap-1.5 bg-stone-950 hover:bg-stone-850 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all self-start sm:self-auto"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{lang === 'FR' ? "Déclarer Incident" : "File Incident"}</span>
                  </button>
                </div>

                {/* Create Incident Inline Form */}
                {showCreateIncident && (
                  <form onSubmit={handleCreateIncidentSubmit} className="p-6 bg-stone-50 border-b border-stone-100 space-y-4 animate-fade-in text-xs font-semibold text-stone-700">
                    <h4 className="font-sans font-bold text-sm text-stone-900">
                      {lang === 'FR' ? "Déclarer un Nouvel Incident" : "Declare New Incident Trigger"}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-stone-600 block">{lang === 'FR' ? "Type de Panne" : "Incident Type"}</label>
                        <select
                          value={incidentType}
                          onChange={(e) => setIncidentType(e.target.value as any)}
                          className="w-full bg-white border border-stone-250 p-2.5 rounded-xl text-stone-800"
                        >
                          <option value="AI unavailable">AI unavailable</option>
                          <option value="high latency">high latency</option>
                          <option value="evaluation failure">evaluation failure</option>
                          <option value="session failure">session failure</option>
                          <option value="voice unavailable">voice unavailable</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-stone-600 block">Sévérité</label>
                        <select
                          value={incidentSeverity}
                          onChange={(e) => setIncidentSeverity(e.target.value as any)}
                          className="w-full bg-white border border-stone-250 p-2.5 rounded-xl text-stone-800"
                        >
                          <option value="warning">Warning (Avertissement)</option>
                          <option value="critical">Critical (Critique)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-stone-600 block">Description</label>
                      <textarea
                        value={incidentDesc}
                        onChange={(e) => setIncidentDesc(e.target.value)}
                        placeholder="Précisez la nature de l'anomalie réseau, les serveurs concernés..."
                        rows={3}
                        className="w-full bg-white border border-stone-250 p-2.5 rounded-xl text-stone-800"
                        required
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowCreateIncident(false)}
                        className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-xl cursor-pointer text-stone-800 text-xs font-bold uppercase tracking-wider"
                      >
                        {lang === 'FR' ? "Annuler" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 rounded-xl cursor-pointer text-white text-xs font-bold uppercase tracking-wider"
                      >
                        {lang === 'FR' ? "Soumettre" : "Submit"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="divide-y divide-stone-100">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-stone-900">{inc.id}</span>
                            <span className="font-sans font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded uppercase text-[10px]">
                              {inc.type}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase ${
                              inc.severity === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {inc.severity}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-bold uppercase ${
                              inc.status === 'resolved' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : inc.status === 'investigating'
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : 'bg-stone-100 text-stone-800'
                            }`}>
                              {inc.status}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-stone-400">
                            {new Date(inc.timestamp).toLocaleString()}
                          </p>
                        </div>

                        {/* Admin status overrides */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <button
                            onClick={() => handleIncidentStatus(inc.id, 'investigating')}
                            disabled={inc.status === 'resolved'}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-800 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Investigate
                          </button>
                          
                          {isSuperAdmin ? (
                            <button
                              onClick={() => handleIncidentStatus(inc.id, 'resolved')}
                              disabled={inc.status === 'resolved'}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-100 text-white disabled:text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                            >
                              {lang === 'FR' ? "Résoudre" : "Resolve"}
                            </button>
                          ) : (
                            <span className="text-[10px] text-stone-400 italic font-semibold px-2">
                              🔒 Super Admin to Close
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-stone-600 text-xs leading-relaxed font-semibold">
                        {inc.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION Audit Logs: Tracker of actions */}
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-4">
                <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileLock className="w-4 h-4 text-stone-600" />
                    <h3 className="font-sans font-bold text-sm text-stone-900">
                      {lang === 'FR' ? "Journal d'Audit AIOps" : "AIOps Security Audit Trail"}
                    </h3>
                  </div>
                  <span className="font-mono text-[9px] text-stone-400">READ-ONLY RECORDIAL</span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto divide-y divide-stone-100 pr-1 text-xs font-semibold text-stone-700">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded uppercase font-bold">
                            {log.category}
                          </span>
                          <span className="text-stone-500 font-normal">by</span>
                          <span className="font-mono text-[10px] text-stone-900 font-bold">{log.user}</span>
                        </div>
                        <p className="font-sans text-xs text-stone-800 leading-relaxed font-semibold">
                          {log.details}
                        </p>
                      </div>
                      <span className="font-mono text-[9px] text-stone-400 shrink-0 self-end sm:self-auto">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: AI Model Allocation & Fallback overview */}
            <div className="space-y-6">
              
              <div className="bg-white border border-stone-200 p-6 rounded-[32px] shadow-xs space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <h4 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Capacité des Modèles IA" : "Active AI Resource Mapping"}
                  </h4>
                </div>

                <div className="space-y-3 text-xs font-semibold text-stone-700">
                  <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl space-y-1">
                    <p className="text-stone-500 text-[10px] font-mono uppercase tracking-wider">Primary Model</p>
                    <p className="text-stone-900 font-bold text-sm">gemini-3.5-flash</p>
                    <div className="flex justify-between items-center text-[10px] text-stone-400">
                      <span>Status: {config.aiFeatureDisabled ? 'Forced Offline' : 'Nominal'}</span>
                      <span>Confidence: High</span>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl space-y-1">
                    <p className="text-stone-500 text-[10px] font-mono uppercase tracking-wider">Voice Speech Ingestion</p>
                    <p className="text-stone-900 font-bold text-sm">Twilio Media Channel</p>
                    <div className="flex justify-between items-center text-[10px] text-stone-400">
                      <span>Status: Live Ingress</span>
                      <span>SLA: 99.8%</span>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl space-y-1">
                    <p className="text-stone-500 text-[10px] font-mono uppercase tracking-wider">Fallback Processor</p>
                    <p className="text-stone-900 font-bold text-sm">gemini-1.5-flash (Low-bandwidth)</p>
                    <div className="flex justify-between items-center text-[10px] text-stone-400">
                      <span>Status: {config.fallbackActivated ? 'ACTIVE' : 'Standby'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance & Policy constraints note */}
              <div className="bg-stone-900 text-stone-300 p-6 rounded-[32px] border border-stone-850 shadow-xs space-y-3">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-stone-400" />
                  <h4 className="font-sans font-bold text-sm text-white">
                    {lang === 'FR' ? "Directive Audit Act IA" : "AI Act Compliance Core"}
                  </h4>
                </div>
                <p className="text-stone-400 text-[11px] leading-relaxed font-semibold">
                  {lang === 'FR'
                    ? "Toutes les interventions d'urgence de Super Admin (arrêt, activation du mode de secours, dérogation aux incidents) sont soumises à la création d'enregistrements d'audit immuables pour garantir la transparence opérationnelle exigée par l'UE."
                    : "All emergency administrative triggers (AI shut down, fallback activation, custom incidents) generate unmodifiable, cryptographically-hashed logs to conform strictly to European Union AI Act regulations."}
                </p>
              </div>

            </div>

          </div>
        )}

        {/* SECTION 6: RESILIENCE & CHAOS CENTER */}
        {activeTab === 'reliability' && (
          <div className="space-y-8 text-left animate-fade-in" id="section-6-reliability">
            
            {/* Top Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs font-semibold text-stone-700">
              <div className="bg-white border border-stone-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-stone-400 font-mono text-[9px] uppercase tracking-wider">{lang === 'FR' ? "DISPONIBILITÉ SYSTÈME" : "SYSTEM AVAILABILITY"}</p>
                  <p className="text-xl font-bold font-sans text-stone-900 mt-1">{resilienceStats.systemAvailability}%</p>
                  <p className="text-[9px] text-emerald-600 mt-0.5 font-bold">● {lang === 'FR' ? "SLA Garanti (99.99%)" : "Guaranteed SLA (99.99%)"}</p>
                </div>
                <span className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                  <Activity className="w-5 h-5" />
                </span>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-stone-400 font-mono text-[9px] uppercase tracking-wider">{lang === 'FR' ? "TAUX DE SUCCÈS RETRY" : "RETRY SUCCESS RATE"}</p>
                  <p className="text-xl font-bold font-sans text-stone-900 mt-1">{resilienceStats.retrySuccessRate}%</p>
                  <p className="text-[9px] text-stone-500 mt-0.5">{lang === 'FR' ? "Boucle d'attente exponentielle" : "Exponential backoff loop"}</p>
                </div>
                <span className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                  <RefreshCw className="w-5 h-5" />
                </span>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-stone-400 font-mono text-[9px] uppercase tracking-wider">{lang === 'FR' ? "DURÉE MOYENNE DU RETOUR (MTTR)" : "MEAN TIME TO RECOVER (MTTR)"}</p>
                  <p className="text-xl font-bold font-sans text-stone-900 mt-1">{resilienceStats.avgRecoveryDuration}s</p>
                  <p className="text-[9px] text-stone-500 mt-0.5">{lang === 'FR' ? "Auto-guérison et failover" : "Auto-healing & failover delay"}</p>
                </div>
                <span className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                  <Clock className="w-5 h-5" />
                </span>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-stone-400 font-mono text-[9px] uppercase tracking-wider">{lang === 'FR' ? "RÉSILIENCE HORS-LIGNE" : "OFFLINE RESILIENCE"}</p>
                  <p className="text-xl font-bold font-sans text-stone-900 mt-1">{lang === 'FR' ? "Activée" : "Active"}</p>
                  <p className="text-[9px] text-emerald-600 mt-0.5 font-bold">● LocalStorage Sync</p>
                </div>
                <span className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                  <Database className="w-5 h-5" />
                </span>
              </div>
            </div>

            {/* Microservices SLA Monitor and Circuit Breakers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Box: Microservices SLA & Health Indicators */}
              <div className="lg:col-span-2 bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
                <div className="border-b border-stone-100 pb-4 space-y-1">
                  <h3 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Statut de Disponibilité des Microservices" : "Microservices Availability SLA Status"}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-semibold">
                    {lang === 'FR' ? "Surveillance active des dépendances API externes et internes de Shana." : "Active telemetry checks on Shana downstream external and internal API gateways."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-stone-700">
                  
                  {/* OpenAI/Gemini */}
                  <div className="p-4 bg-stone-50 border border-stone-150 rounded-2xl space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-bold text-stone-900">OpenAI & Gemini API</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        microservices.openai === 'healthy' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : microservices.openai === 'degraded'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}>
                        {microservices.openai}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-stone-400 mt-2">
                      <span>{lang === 'FR' ? "SLA Contractuel : 99.9%" : "Contracted SLA: 99.9%"}</span>
                      <span className="font-mono text-stone-700 font-bold">99.94%</span>
                    </div>
                  </div>

                  {/* Firestore */}
                  <div className="p-4 bg-stone-50 border border-stone-150 rounded-2xl space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-bold text-stone-900">Firestore Cloud DB</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        microservices.firestore === 'healthy' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : microservices.firestore === 'degraded'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}>
                        {microservices.firestore}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-stone-400 mt-2">
                      <span>{lang === 'FR' ? "SLA Contractuel : 99.99%" : "Contracted SLA: 99.99%"}</span>
                      <span className="font-mono text-stone-700 font-bold">99.99%</span>
                    </div>
                  </div>

                  {/* Auth */}
                  <div className="p-4 bg-stone-50 border border-stone-150 rounded-2xl space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-bold text-stone-900">Firebase Auth Engine</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        microservices.auth === 'healthy' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : microservices.auth === 'degraded'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}>
                        {microservices.auth}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-stone-400 mt-2">
                      <span>{lang === 'FR' ? "SLA Contractuel : 100.0%" : "Contracted SLA: 100.0%"}</span>
                      <span className="font-mono text-stone-700 font-bold">100.00%</span>
                    </div>
                  </div>

                  {/* Voice */}
                  <div className="p-4 bg-stone-50 border border-stone-150 rounded-2xl space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-bold text-stone-900">Twilio WebRTC Voice</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        microservices.voice === 'healthy' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : microservices.voice === 'degraded'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}>
                        {microservices.voice}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-stone-400 mt-2">
                      <span>{lang === 'FR' ? "SLA Contractuel : 99.8%" : "Contracted SLA: 99.8%"}</span>
                      <span className="font-mono text-stone-700 font-bold">99.88%</span>
                    </div>
                  </div>

                </div>

                {/* Resilience policy note */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-150 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-sans font-bold text-emerald-900">
                      {lang === 'FR' ? "Politique d'Isolation Totale des Défaillances" : "Active Fault Isolation Strategy"}
                    </p>
                    <p className="text-emerald-800 leading-relaxed opacity-90 font-medium text-[11px]">
                      {lang === 'FR'
                        ? "Chaque microservice Shana est isolé au sein d'un sandbox d'exécution. Si une dépendance API externe échoue, Shana utilise un cache immuable local (IndexedDB) et des invites de secours alternatives sans perturber le parcours candidat."
                        : "Each Shana subsystem is protected by execution sandbox guards. If any external API gateway suffers a connection drop, the platform transparently activates local persistence queues (IndexedDB caches) and standby reasoning models without candidate disruption."}
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Box: Circuit Breakers Monitor */}
              <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h3 className="font-sans font-bold text-sm text-stone-900">
                      {lang === 'FR' ? "Disjoncteurs de Secours" : "Active Circuit Breakers"}
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-500 font-semibold">
                    {lang === 'FR' ? "Vérifiez l'isolation automatique des flux d'erreurs." : "Check automatic routing barriers on faulty thread lines."}
                  </p>
                </div>

                <div className="space-y-4 font-semibold text-stone-700">
                  {/* Learning Engine */}
                  <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-150 rounded-xl text-xs">
                    <span className="text-stone-800 font-sans">{lang === 'FR' ? "Moteur d'Apprentissage" : "Learning Analyzer"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      circuitBreakers.learning === 'closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}>
                      {circuitBreakers.learning === 'closed' ? 'Closed' : 'Open (Tripped)'}
                    </span>
                  </div>

                  {/* Conversation Engine */}
                  <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-150 rounded-xl text-xs">
                    <span className="text-stone-800 font-sans">{lang === 'FR' ? "Directeur de Dialogue" : "Dialogue Director"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      circuitBreakers.conversation === 'closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}>
                      {circuitBreakers.conversation === 'closed' ? 'Closed' : 'Open (Tripped)'}
                    </span>
                  </div>

                  {/* Analytics Buffer */}
                  <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-150 rounded-xl text-xs">
                    <span className="text-stone-800 font-sans">{lang === 'FR' ? "Tampon de Synchronisation" : "Analytics Sync Buffer"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      circuitBreakers.analytics === 'closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}>
                      {circuitBreakers.analytics === 'closed' ? 'Closed' : 'Open (Tripped)'}
                    </span>
                  </div>

                  {/* Evaluation Core */}
                  <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-150 rounded-xl text-xs">
                    <span className="text-stone-800 font-sans">{lang === 'FR' ? "Noyau d'Évaluation" : "Evaluation Core Engine"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      circuitBreakers.evaluation === 'closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}>
                      {circuitBreakers.evaluation === 'closed' ? 'Closed' : 'Open (Tripped)'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl text-[10px] text-stone-500 font-medium leading-relaxed">
                  {lang === 'FR'
                    ? "Les disjoncteurs s'ouvrent après 3 échecs consécutifs et basculent instantanément vers les pools de repli (Half-Open après 30s de stabilisation)."
                    : "Circuit breakers trip autonomously after 3 sequential socket/endpoint failures, immediately routing calls to local cache (resets to Closed after successful probe checks)."}
                </div>
              </div>

            </div>

            {/* Controlled Chaos Testing Panel */}
            <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-sm text-stone-900">
                    {lang === 'FR' ? "Console de Test de Chaos Contrôlé" : "Controlled Chaos Testing & Injection Console"}
                  </h3>
                  <p className="text-[11px] text-[#6B7280] font-semibold">
                    {lang === 'FR' ? "Provoquez des pannes contrôlées pour éprouver la robustesse de Shana en temps réel." : "Simulate live cluster outages to witness Shana's autonomous recovery, circuit-tripping, and backup routing."}
                  </p>
                </div>
                <span className="font-mono text-[9px] bg-stone-100 border border-stone-200 text-stone-700 font-bold px-2.5 py-1 rounded">
                  {lang === 'FR' ? "MOTEUR DE CHAOS PRÊT" : "CHAOS ENGINE ARMED"}
                </span>
              </div>

              {/* Chaos Trigger Buttons Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 font-bold text-[10px] uppercase tracking-wider text-center">
                
                <button
                  onClick={() => handleSimulateChaos('openai')}
                  disabled={isSimulatingChaos !== null}
                  className="p-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 rounded-2xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <Cpu className="w-5 h-5 mx-auto mb-2 text-rose-600" />
                  <span>OpenAI Timeout</span>
                </button>

                <button
                  onClick={() => handleSimulateChaos('firestore')}
                  disabled={isSimulatingChaos !== null}
                  className="p-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 rounded-2xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <Database className="w-5 h-5 mx-auto mb-2 text-rose-600" />
                  <span>Firestore Drop</span>
                </button>

                <button
                  onClick={() => handleSimulateChaos('network')}
                  disabled={isSimulatingChaos !== null}
                  className="p-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 rounded-2xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <Globe className="w-5 h-5 mx-auto mb-2 text-rose-600" />
                  <span>Transit Loss</span>
                </button>

                <button
                  onClick={() => handleSimulateChaos('voice')}
                  disabled={isSimulatingChaos !== null}
                  className="p-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 rounded-2xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <Video className="w-5 h-5 mx-auto mb-2 text-rose-600" />
                  <span>Voice Disconnect</span>
                </button>

                <button
                  onClick={() => handleSimulateChaos('auth')}
                  disabled={isSimulatingChaos !== null}
                  className="p-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 rounded-2xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <ShieldAlert className="w-5 h-5 mx-auto mb-2 text-rose-600" />
                  <span>Auth Failure</span>
                </button>

                <button
                  onClick={() => handleSimulateChaos('latency')}
                  disabled={isSimulatingChaos !== null}
                  className="p-4 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-150 rounded-2xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <Gauge className="w-5 h-5 mx-auto mb-2 text-amber-600" />
                  <span>Latency Spike</span>
                </button>

              </div>

              {/* Chaos Live Log Stream Terminal */}
              <div className="bg-stone-950 p-6 rounded-2xl space-y-3 shadow-md text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-sans font-bold text-xs text-stone-100 uppercase tracking-wider font-mono">
                    {lang === 'FR' ? "Terminal d'Événements et d'Auto-Guérison" : "Chaos Event Stream & Self-Healing Execution Log"}
                  </h4>
                  {isSimulatingChaos && (
                    <span className="flex items-center gap-1.5 text-[9px] font-mono text-amber-400 font-bold animate-pulse">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      <span>{lang === 'FR' ? "RÉSOLUTION AUTONOME EN COURS" : "SELF-HEALING CYCLE ACTIVE"}</span>
                    </span>
                  )}
                </div>
                <div className="bg-stone-900 p-4 rounded-xl font-mono text-stone-300 space-y-2 max-h-[180px] overflow-y-auto font-bold text-[10px]">
                  {chaosLog.map((line, idx) => {
                    let color = 'text-stone-400';
                    if (line.includes('[CHAOS]')) color = 'text-rose-400 font-bold';
                    if (line.includes('[RECOVERY]')) color = 'text-emerald-400 font-bold';
                    if (line.includes('[CIRCUIT BREAKER]')) color = 'text-amber-400 font-bold';
                    if (line.includes('[SYSTEM]')) color = 'text-sky-400 font-semibold';
                    return <p key={idx} className={color}>{line}</p>;
                  })}
                </div>
              </div>
            </div>

            {/* Structured Incident Registry displaying extended properties */}
            <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <h3 className="font-sans font-bold text-sm text-stone-900">
                  {lang === 'FR' ? "Historique des Incidents de SRE" : "Resilience Incident Audit Ledger"}
                </h3>
                <p className="text-[11px] text-stone-500 font-semibold">
                  {lang === 'FR' ? "Registre d'audit détaillé exigé par la réglementation européenne AI Act." : "Immutable, structured incident registers supporting post-mortem investigations and regulatory auditing."}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100 font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold">
                      <th className="p-4">{lang === 'FR' ? "DATE & ID" : "DATE & ID"}</th>
                      <th className="p-4">{lang === 'FR' ? "ENGINE CONCERNÉ" : "AFFECTED ENGINE"}</th>
                      <th className="p-4">SEVERITY</th>
                      <th className="p-4">{lang === 'FR' ? "CAUSE RACINE" : "ROOT CAUSE"}</th>
                      <th className="p-4">{lang === 'FR' ? "ACTIONS AUTONOMES" : "AUTOMATED REMEDIATION"}</th>
                      <th className="p-4">RECOVERY</th>
                      <th className="p-4">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs font-semibold text-stone-700">
                    {incidents.map((inc) => (
                      <tr key={inc.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4 space-y-1">
                          <p className="font-mono text-stone-900 font-bold">{inc.id}</p>
                          <p className="text-[9px] font-mono text-stone-400">{new Date(inc.timestamp).toLocaleTimeString()}</p>
                        </td>
                        <td className="p-4">
                          <span className="font-sans font-bold text-stone-900 block">{inc.affectedEngine || 'General System Platform'}</span>
                          <span className="text-[9px] font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 uppercase font-bold">{inc.type}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase ${
                            inc.severity === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inc.severity}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs text-stone-600 leading-normal font-semibold">
                          {inc.rootCause || inc.description}
                        </td>
                        <td className="p-4 max-w-xs text-emerald-800 font-semibold leading-normal bg-emerald-50/25">
                          {inc.automaticActions || (lang === 'FR' ? "Aucun disjoncteur déclenché; action manuelle." : "No circuit breaker triggered; manual governance overrides active.")}
                        </td>
                        <td className="p-4 font-mono font-bold text-stone-900">
                          {inc.recoveryDurationSec ? `${inc.recoveryDurationSec}s` : 'N/A'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-bold uppercase ${
                            inc.status === 'resolved' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : inc.status === 'investigating'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : 'bg-stone-100 text-stone-800'
                          }`}>
                            {inc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
