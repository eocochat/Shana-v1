import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Activity, 
  ShieldCheck, 
  TrendingDown, 
  Cpu, 
  Zap, 
  AlertCircle, 
  ChevronRight, 
  CreditCard, 
  Coins, 
  Sparkles, 
  Compass, 
  MousePointerClick,
  HelpCircle,
  Database,
  UserCheck,
  CheckCircle,
  BarChart2,
  Lock,
  RefreshCw,
  Sliders,
  FlaskConical,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  Play,
  RotateCcw,
  FileText,
  Check,
  XCircle,
  UserX,
  UserPlus,
  Edit3,
  Server,
  Key,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Legend
} from 'recharts';
import { Language } from '../types';
import { ShanaEventTracker, ShanaEvent } from '../lib/events';
import { StorageService } from '../lib/storage';

interface SaaSAnalyticsDashboardProps {
  currentUserId: string;
  lang: Language;
}

// Immutable Audit Log interface
interface AuditLog {
  id: string;
  timestamp: string;
  adminUser: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

// Job interface for support
interface SupportJob {
  id: string;
  name: string;
  status: 'Success' | 'Failed' | 'Pending';
  attempts: number;
  created: string;
  duration?: string;
}

// Past prompt log for request replay
interface AIRequestLog {
  id: string;
  engine: string;
  user: string;
  prompt: string;
  response: string;
  tokens: number;
  cost: number;
}

export default function SaaSAnalyticsDashboard({ currentUserId, lang }: SaaSAnalyticsDashboardProps) {
  // Global Filters & Settings
  const [activeTab, setActiveTab] = useState<'users' | 'ai' | 'revenue' | 'system' | 'flags' | 'experiments' | 'security' | 'support'>('users');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [userSegment, setUserSegment] = useState<'all' | 'free' | 'pro' | 'enterprise'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');
  
  // Real-time Update States
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  // 1. User Management State Extensions
  const [userStatusMap, setUserStatusMap] = useState<Record<string, 'Active' | 'Suspended' | 'Banned'>>({
    'usr_sarah': 'Active',
    'usr_alex': 'Active',
    'usr_mei': 'Active',
    'usr_marcus': 'Suspended',
    'usr_elena': 'Active',
    'usr_candidate': 'Active'
  });

  const [userRolesMap, setUserRolesMap] = useState<Record<string, string>>({
    'usr_sarah': 'Interviewer',
    'usr_alex': 'Admin',
    'usr_mei': 'Candidate',
    'usr_marcus': 'Candidate',
    'usr_elena': 'Candidate',
    'usr_candidate': 'Super Admin'
  });

  const [userEngagementScores, setUserEngagementScores] = useState<Record<string, number>>({
    'usr_sarah': 92,
    'usr_alex': 88,
    'usr_mei': 96,
    'usr_marcus': 34,
    'usr_elena': 95,
    'usr_candidate': 100
  });

  const [selectedUserForDetail, setSelectedUserForDetail] = useState<string | null>(null);
  const [resetConfirmUserId, setResetConfirmUserId] = useState<string | null>(null);
  
  // 5. Feature Flags State Extensions (Phase 19 Integration)
  const [flags, setFlags] = useState([
    { key: 'voice_pacing_coaching', name: 'Voice Pacing & Spoken Coaching', enabled: true, rollout: 100, target: 'all', env: 'production' },
    { key: 'pressure_interview_mode', name: 'Interrogative Pressure Engine', enabled: true, rollout: 50, target: 'pro', env: 'production' },
    { key: 'advanced_ips_insights', name: 'Predictive IPS Learning Curves', enabled: true, rollout: 100, target: 'pro', env: 'production' },
    { key: 'mock_resume_generation', name: 'SaaS Instant Resume Re-Builder', enabled: false, rollout: 0, target: 'enterprise', env: 'staging' }
  ]);
  const [rollbackFlagKey, setRollbackFlagKey] = useState<string | null>(null);
  const [rollbackReason, setRollbackReason] = useState<string>('');

  // 7. Security & Immutable Audit Ledger
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 'aud_01', timestamp: '2026-07-01T04:32:10Z', adminUser: 'eocochat@gmail.com', action: 'ADMIN_LOGIN', module: 'AUTH', details: 'Successful administrative login', ipAddress: '192.168.1.105', status: 'SUCCESS' },
    { id: 'aud_02', timestamp: '2026-07-01T03:15:45Z', adminUser: 'eocochat@gmail.com', action: 'TOGGLE_FEATURE_FLAG', module: 'CONFIG_FLAGS', details: 'Enabled voice_pacing_coaching globally', ipAddress: '192.168.1.105', status: 'SUCCESS' },
    { id: 'aud_03', timestamp: '2026-06-30T22:11:04Z', adminUser: 'SYSTEM', action: 'DATABASE_BACKUP', module: 'STORAGE', details: 'Automated Firestore cluster backup successful', ipAddress: '127.0.0.1', status: 'SUCCESS' },
    { id: 'aud_04', timestamp: '2026-06-30T18:44:12Z', adminUser: 'eocochat@gmail.com', action: 'MEMBER_ROLE_UPGRADE', module: 'USERS', details: 'Promoted usr_alex to Admin', ipAddress: '192.168.1.105', status: 'SUCCESS' },
    { id: 'aud_05', timestamp: '2026-06-30T14:02:18Z', adminUser: 'SECURITY_DAEMON', action: 'RATE_LIMIT_HIT', module: 'SECURITY', details: 'API abuse warning triggered on IP 185.44.20.12', ipAddress: '185.44.20.12', status: 'WARNING' }
  ]);

  const addAuditLog = (action: string, module: string, details: string, status: 'SUCCESS' | 'WARNING' | 'FAILED' = 'SUCCESS') => {
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminUser: 'eocochat@gmail.com', // Currently signed in Super Admin
      action,
      module,
      details,
      ipAddress: '192.168.1.105',
      status
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // 8. Support & Operations State Extensions
  const [jobQueue, setJobQueue] = useState<SupportJob[]>([
    { id: 'job_01', name: 'process_resume_score_vectors', status: 'Success', attempts: 1, created: '2m ago', duration: '142ms' },
    { id: 'job_02', name: 'generate_evaluator_insights_pdf', status: 'Failed', attempts: 3, created: '10m ago' },
    { id: 'job_03', name: 'recalculate_segment_profitability_matrix', status: 'Pending', attempts: 0, created: '1m ago' },
    { id: 'job_04', name: 'broadcast_feature_rollout_notification', status: 'Success', attempts: 1, created: '25m ago', duration: '2.4s' }
  ]);

  const [aiRequestLogs] = useState<AIRequestLog[]>([
    { id: 'req_01', engine: 'Question Engine', user: 'Sarah Connor', prompt: 'Formulate an elegant Socratic challenge based on DevOps containerization and Kubernetes routing constraints under standard pacing.', response: 'Can you describe how an ingress controller routes high-volume traffic during a blue-green rollout, and where bottlenecks occur?', tokens: 412, cost: 0.00062 },
    { id: 'req_02', engine: 'Evaluation Engine', user: 'Alex Rivera', prompt: 'Perform immediate semantic evaluation of candidate communication and technical correctness for response on state machines.', response: 'Correctness: 94%. Clarity: 89%. Recommended feedback: Candidate explained the difference between Mealy and Moore structures with excellent technical density.', tokens: 1024, cost: 0.00154 },
    { id: 'req_03', engine: 'Adaptation Engine', user: 'Mei Lin', prompt: 'Detect pacing degradation. Candidate is speaking too fast (185 words/min) with signs of cognitive fatigue.', response: 'Approved Action: SLOW_PACING. Switch question modality to clarifying questions to reduce cognitive payload.', tokens: 520, cost: 0.00078 },
    { id: 'req_04', engine: 'Insight Engine', user: 'Elena Rostova', prompt: 'Extract deep behavioral leadership indicators based on response event tracks over the last 3 sessions.', response: 'Identified traits: High grit, exceptional situational command. Actionable insight: Candidate excels in unstructured problem-solving.', tokens: 840, cost: 0.00126 }
  ]);

  const [selectedAIRequestToReplay, setSelectedAIRequestToReplay] = useState<string>('req_01');
  const [aiReplayPromptText, setAiReplayPromptText] = useState<string>(aiRequestLogs[0].prompt);
  const [isReplayingAI, setIsReplayingAI] = useState<boolean>(false);
  const [aiReplayResult, setAiReplayResult] = useState<string>('');

  // Update prompt text when selecting a different request to replay
  useEffect(() => {
    const found = aiRequestLogs.find(r => r.id === selectedAIRequestToReplay);
    if (found) {
      setAiReplayPromptText(found.prompt);
      setAiReplayResult('');
    }
  }, [selectedAIRequestToReplay]);

  // Handle simulated AI Request replay
  const handleReplayAIRequest = () => {
    setIsReplayingAI(true);
    setAiReplayResult('');
    
    setTimeout(() => {
      setIsReplayingAI(false);
      setAiReplayResult(lang === 'EN' 
        ? `[SIMULATED GEMINI RESPONSE - REPLAY OK]\nGenerated insights based on custom parameters:\n1. Execution latency: 1.12s\n2. Token count: 712 tokens ($0.00106)\n3. Model Output: "The requested parameters align with our Socratic model criteria. The adaptation layer successfully mapped cognitive stress levels to a pacing rate of 120 words per minute."`
        : `[RÉPONSE GEMINI SIMULÉE - REPLAY OK]\nAnalyses générées selon vos critères personnalisés :\n1. Latence d'exécution : 1.12s\n2. Tokens consommés : 712 tokens ($0.00106)\n3. Sortie du modèle : "Les paramètres requis correspondent aux critères de notre modèle Socratique. La couche adaptative a réussi à lier la fatigue cognitive à un rythme de 120 mots par minute."`
      );
      addAuditLog('AI_REQUEST_REPLAY', 'SUPPORT', `Replayed AI execution for template ${selectedAIRequestToReplay}`, 'SUCCESS');
    }, 1500);
  };

  // Handle Manual Job Retry
  const handleRetryJob = (jobId: string) => {
    setJobQueue(prev => prev.map(job => {
      if (job.id === jobId) {
        return { ...job, status: 'Pending', attempts: job.attempts + 1 };
      }
      return job;
    }));

    setTimeout(() => {
      setJobQueue(prev => prev.map(job => {
        if (job.id === jobId) {
          return { ...job, status: 'Success', duration: '412ms' };
        }
        return job;
      }));
      addAuditLog('SUPPORT_JOB_RETRY', 'SUPPORT', `Manually triggered retry for job ${jobId}`, 'SUCCESS');
    }, 1200);
  };

  // Exportable reports simulator
  const triggerExport = () => {
    setIsExporting(true);
    setExportMessage('');
    setTimeout(() => {
      setIsExporting(false);
      setExportMessage(lang === 'EN' 
        ? "Report exported successfully in encrypted CSV format! (Downloaded as shana_bi_report.csv)" 
        : "Rapport exporté avec succès au format CSV chiffré ! (Téléchargé : shana_bi_report.csv)"
      );
      addAuditLog('DATA_EXPORT', 'REPORTING', `Exported SaaS and user analytics reports for range: ${dateRange}`, 'SUCCESS');
      setTimeout(() => setExportMessage(''), 5000);
    }, 1500);
  };

  // Real-time refresh action
  const handleForceRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(new Date().toLocaleTimeString());
      addAuditLog('SYSTEM_REFRESH', 'MONITORING', 'Forced manual telemetry and cache invalidation', 'SUCCESS');
    }, 800);
  };

  // Load all events from localStorage. Detect registered user IDs.
  const allEvents: Record<string, ShanaEvent[]> = useMemo(() => {
    const eventsMap: Record<string, ShanaEvent[]> = {};
    const userIds = new Set<string>();
    
    if (currentUserId) userIds.add(currentUserId);
    userIds.add('usr_candidate');

    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('shana_events_')) {
          const uId = key.replace('shana_events_', '');
          if (uId) userIds.add(uId);
        }
      });
    } catch (e) {
      console.warn("Could not inspect localStorage for keys:", e);
    }

    userIds.forEach(uId => {
      const evs = ShanaEventTracker.getEvents(uId);
      if (evs && evs.length > 0) {
        eventsMap[uId] = evs;
      }
    });

    // Baseline Seeded Users for SaaS compliance
    const simulatedUsers = [
      { id: 'usr_sarah', name: 'Sarah Connor (DevOps)' },
      { id: 'usr_alex', name: 'Alex Rivera (Staff Engineer)' },
      { id: 'usr_mei', name: 'Mei Lin (Product Manager)' },
      { id: 'usr_marcus', name: 'Marcus Vance (ML Architect)' },
      { id: 'usr_elena', name: 'Elena Rostova (Frontend Lead)' }
    ];

    simulatedUsers.forEach((sim, idx) => {
      if (!eventsMap[sim.id] || eventsMap[sim.id].length === 0) {
        const generatedEvents: ShanaEvent[] = [];
        const baseDaysAgo = [35, 28, 14, 8, 2][idx];
        const sessionCount = idx === 0 ? 5 : idx === 1 ? 4 : idx === 2 ? 3 : idx === 3 ? 1 : 2;
        
        for (let s = 0; s < sessionCount; s++) {
          const sessId = `sess_sim_${sim.id}_${s}`;
          const sessionDate = new Date();
          sessionDate.setDate(sessionDate.getDate() - baseDaysAgo + (s * 3));
          
          generatedEvents.push({
            userId: sim.id,
            sessionId: sessId,
            timestamp: sessionDate.toISOString(),
            eventType: 'interview_started',
            payload: {
              interviewType: s % 2 === 0 ? 'Technical Core' : 'Behavioral Leadership',
              experienceLevel: s === 0 ? 'Senior' : 'Mid',
              mode: s % 2 === 0 ? 'pressure' : 'standard',
              isPaidSession: s > 0
            }
          });

          generatedEvents.push({
            userId: sim.id,
            sessionId: sessId,
            timestamp: new Date(sessionDate.getTime() + 120000).toISOString(),
            eventType: 'adaptation_triggered',
            payload: {
              trigger: 'user_pacing_hurried',
              adaptation: 'slowing down spoken pacing',
              authority: s % 3 === 0 ? 'adaptive' : s % 3 === 1 ? 'serendipity' : 'director',
              questionStyle: s % 2 === 0 ? 'socratic' : 'interrogative',
              difficulty: s === 0 ? 'Junior' : s === 1 ? 'Mid' : 'Senior'
            }
          });

          let scoreTrend = 68 + (s * 4) + (idx * 2);
          if (scoreTrend > 95) scoreTrend = 94;

          generatedEvents.push({
            userId: sim.id,
            sessionId: sessId,
            timestamp: new Date(sessionDate.getTime() + 400000).toISOString(),
            eventType: 'answer_analyzed',
            payload: {
              questionIndex: 0,
              score: scoreTrend - 2,
              clarity: scoreTrend - 1,
              relevance: scoreTrend - 2,
              conciseness: scoreTrend - 3
            }
          });

          generatedEvents.push({
            userId: sim.id,
            sessionId: sessId,
            timestamp: new Date(sessionDate.getTime() + 800000).toISOString(),
            eventType: 'answer_analyzed',
            payload: {
              questionIndex: 1,
              score: scoreTrend + 1,
              clarity: scoreTrend + 2,
              relevance: scoreTrend,
              conciseness: scoreTrend + 1
            }
          });

          generatedEvents.push({
            userId: sim.id,
            sessionId: sessId,
            timestamp: new Date(sessionDate.getTime() + 1100000).toISOString(),
            eventType: 'score_generated',
            payload: {
              finalScore: scoreTrend,
              resumeScore: scoreTrend - 2,
              communicationScore: scoreTrend + 1,
              behavioralScore: scoreTrend - 1,
              adaptabilityScore: scoreTrend + 2
            }
          });

          generatedEvents.push({
            userId: sim.id,
            sessionId: sessId,
            timestamp: new Date(sessionDate.getTime() + 1200000).toISOString(),
            eventType: 'interview_completed',
            payload: {
              sessionId: sessId,
              score: scoreTrend,
              duration: "20:00",
              totalQuestions: 2,
              isPaidSession: s > 0
            }
          });
        }
        eventsMap[sim.id] = generatedEvents;
      }
    });

    return eventsMap;
  }, [currentUserId]);

  // Compile User Profiles List (Search, Filters, status mapping applied)
  const userList = useMemo(() => {
    const list = [
      { id: 'usr_candidate', name: lang === 'EN' ? 'Active Candidate (You)' : 'Candidat Actif (Vous)', email: 'eocochat@gmail.com' },
      { id: 'usr_sarah', name: 'Sarah Connor', email: 'sarah.c@skyline.org' },
      { id: 'usr_alex', name: 'Alex Rivera', email: 'arivera@prism.tech' },
      { id: 'usr_mei', name: 'Mei Lin', email: 'mlin@dynasty.net' },
      { id: 'usr_marcus', name: 'Marcus Vance', email: 'mvance@neon.ml' },
      { id: 'usr_elena', name: 'Elena Rostova', email: 'erostova@mir.io' }
    ];

    return list.filter(u => {
      // Search query filtering
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            u.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Segment filtering
      let matchesSegment = true;
      const role = userRolesMap[u.id] || 'Candidate';
      if (userSegment === 'pro') {
        matchesSegment = u.id === 'usr_sarah' || u.id === 'usr_elena';
      } else if (userSegment === 'enterprise') {
        matchesSegment = u.id === 'usr_alex' || u.id === 'usr_candidate';
      } else if (userSegment === 'free') {
        matchesSegment = u.id === 'usr_mei' || u.id === 'usr_marcus';
      }

      return matchesSearch && matchesSegment;
    });
  }, [searchQuery, userSegment, userRolesMap, lang]);

  // Aggregate stats based on active Filters
  const metricsModifier = useMemo(() => {
    let scaleFactor = 1.0;
    if (dateRange === '24h') scaleFactor = 0.12;
    else if (dateRange === '7d') scaleFactor = 1.0;
    else if (dateRange === '30d') scaleFactor = 4.2;
    else scaleFactor = 12.8;

    let segmentMultiplier = 1.0;
    if (userSegment === 'free') segmentMultiplier = 0.35;
    else if (userSegment === 'pro') segmentMultiplier = 0.85;
    else if (userSegment === 'enterprise') segmentMultiplier = 1.45;

    return scaleFactor * segmentMultiplier;
  }, [dateRange, userSegment]);

  // 1. User Management Actions
  const handleUpdateRole = (uId: string, newRole: string) => {
    setUserRolesMap(prev => ({ ...prev, [uId]: newRole }));
    addAuditLog('ROLE_MODIFICATION', 'USERS', `Changed role of user ${uId} to ${newRole}`, 'SUCCESS');
  };

  const handleToggleStatus = (uId: string) => {
    const currentStatus = userStatusMap[uId] || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : currentStatus === 'Suspended' ? 'Banned' : 'Active';
    setUserStatusMap(prev => ({ ...prev, [uId]: nextStatus }));
    addAuditLog('USER_STATUS_CHANGE', 'USERS', `Modified user state of ${uId} to ${nextStatus}`, nextStatus === 'Active' ? 'SUCCESS' : 'WARNING');
  };

  const triggerResetUserData = (uId: string) => {
    setResetConfirmUserId(uId);
  };

  const confirmResetUserData = () => {
    if (resetConfirmUserId) {
      // Simulate purging user's local events and progress score
      setUserEngagementScores(prev => ({ ...prev, [resetConfirmUserId]: 0 }));
      addAuditLog('USER_DATA_RESET', 'USERS', `Hard purged progression and event ledger for ${resetConfirmUserId}`, 'WARNING');
      setResetConfirmUserId(null);
    }
  };

  // 5. Feature Flags Actions with Instant Rollback
  const handleToggleFlag = (key: string) => {
    const flag = flags.find(f => f.key === key);
    if (!flag) return;

    if (flag.enabled) {
      // Trigger rollback flow, requiring confirmation/reason
      setRollbackFlagKey(key);
      setRollbackReason('');
    } else {
      // Normal enable
      setFlags(prev => prev.map(f => {
        if (f.key === key) {
          return { ...f, enabled: true, rollout: 100 };
        }
        return f;
      }));
      addAuditLog('FEATURE_FLAG_ENABLED', 'CONFIG_FLAGS', `Enabled feature flag: ${key} (100% rollout)`, 'SUCCESS');
    }
  };

  const submitRollback = () => {
    if (rollbackFlagKey) {
      setFlags(prev => prev.map(f => {
        if (f.key === rollbackFlagKey) {
          return { ...f, enabled: false, rollout: 0 };
        }
        return f;
      }));
      addAuditLog('FEATURE_FLAG_ROLLBACK', 'CONFIG_FLAGS', `Rolled back feature flag: ${rollbackFlagKey}. Reason: "${rollbackReason || 'Not specified'}"`, 'WARNING');
      setRollbackFlagKey(null);
      setRollbackReason('');
    }
  };

  const handleUpdateRollout = (key: string, value: number) => {
    setFlags(prev => prev.map(f => {
      if (f.key === key) {
        return { ...f, rollout: value, enabled: value > 0 };
      }
      return f;
    }));
    addAuditLog('FEATURE_FLAG_ROLLOUT_ADJUST', 'CONFIG_FLAGS', `Adjusted ${key} rollout targeting to ${value}%`, 'SUCCESS');
  };

  // Pre-calculated data metrics with multipliers
  const revenueTotalValue = useMemo(() => Math.round(28450 * metricsModifier), [metricsModifier]);
  const conversionRateValue = useMemo(() => {
    if (userSegment === 'free') return 0;
    if (userSegment === 'pro') return 12.4;
    if (userSegment === 'enterprise') return 24.8;
    return 6.8;
  }, [userSegment]);

  const activeSubscriptionsValue = useMemo(() => Math.round(142 * metricsModifier / 7.0), [metricsModifier]);

  const aiRequestsData = useMemo(() => {
    const val = Math.round(24195 * metricsModifier);
    return {
      total: val,
      engines: [
        { name: 'Question Engine', value: Math.round(val * 0.28) },
        { name: 'Evaluation Engine', value: Math.round(val * 0.25) },
        { name: 'Adaptation Engine', value: Math.round(val * 0.35) },
        { name: 'Insight Engine', value: Math.round(val * 0.12) }
      ],
      cost: Number((val * 0.0012).toFixed(2)),
      tokens: Number((val * 1.4).toFixed(1))
    };
  }, [metricsModifier]);

  const systemHealth = {
    uptime: "99.98%",
    dbResponse: "4.2ms",
    dbConnectionStatus: "Healthy",
    queueBacklog: jobQueue.filter(j => j.status === 'Pending').length,
    activeWorkers: "4/4 Active",
    websocketCount: Math.round(142 * (userSegment === 'all' ? 1.0 : 0.4)),
    geminiStatus: "100%",
    fallbackStatus: "Standby"
  };

  // Recharts Revenue Area Chart Data
  const revenueTrendData = useMemo(() => {
    const base = [
      { date: 'Jun 26', revenue: 24200, users: 310, pvalue: 0.045 },
      { date: 'Jun 27', revenue: 25100, users: 340, pvalue: 0.038 },
      { date: 'Jun 28', revenue: 26800, users: 382, pvalue: 0.024 },
      { date: 'Jun 29', revenue: 27900, users: 410, pvalue: 0.015 },
      { date: 'Jun 30', revenue: 28450, users: 454, pvalue: 0.012 }
    ];

    return base.map(item => ({
      ...item,
      revenue: Math.round(item.revenue * metricsModifier / 7.0),
      users: Math.round(item.users * metricsModifier / 7.0)
    }));
  }, [metricsModifier]);

  return (
    <div id="saas-analytics-root" className="bg-stone-50 border border-stone-200 rounded-[32px] p-6 shadow-xs space-y-6 text-left selection:bg-stone-900 selection:text-white">
      
      {/* -------------------------------------------------------------
          TOP BAR: CONTROL PANEL WITH GLOBAL FILTERS
          ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] font-black bg-stone-950 text-white px-2 py-0.5 rounded-sm uppercase tracking-wider">
              {lang === 'EN' ? "PHASE 20 COMPLIANT" : "CONFORME PHASE 20"}
            </span>
            <span className="text-xs font-mono font-bold text-stone-400">
              Live System Telemetry
            </span>
          </div>
          <h2 className="font-sans font-black text-2xl text-stone-900 tracking-tight mt-1">
            {lang === 'EN' ? "Business Intelligence & Admin Platform" : "Plateforme d'Operations & Business Intelligence"}
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            {lang === 'EN' ? "Authorized Personnel Only. Absolute audit logging enforced." : "Accès Restreint. Journalisation immuable de toutes les actions."}
          </p>
        </div>

        {/* Dynamic Telemetry Status */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-stone-200/80 shadow-xs self-stretch lg:self-auto justify-between">
          <div className="space-y-0.5">
            <span className="text-[8px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
              {lang === 'EN' ? "TELEMETRY CACHE STATUS" : "STATUT DU CACHE TELEMETRIE"}
            </span>
            <span className="text-[11px] font-mono font-black text-stone-800 block">
              {lang === 'EN' ? `Refreshed at ${lastRefreshed}` : `Actualisé à ${lastRefreshed}`}
            </span>
          </div>
          <button 
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 transition-all cursor-pointer disabled:opacity-50"
            title="Force Cache Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          FILTERS DOCK
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={lang === 'EN' ? "Search users by name/ID..." : "Rechercher utilisateur..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-1.5 pl-9 pr-3 text-xs text-stone-800 placeholder-stone-400 font-bold focus:outline-none focus:ring-1 focus:ring-stone-400 font-mono"
          />
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-black text-stone-400 uppercase tracking-wider shrink-0">
            {lang === 'EN' ? "Range:" : "Période:"}
          </span>
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value as any);
              addAuditLog('UPDATE_FILTER_DATE', 'REPORTING', `Adjusted date filter to ${e.target.value}`, 'SUCCESS');
            }}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-1.5 px-3 text-xs font-black text-stone-800 focus:outline-none"
          >
            <option value="24h">{lang === 'EN' ? "Last 24 Hours" : "Dernières 24 Heures"}</option>
            <option value="7d">{lang === 'EN' ? "Last 7 Days" : "Derniers 7 Jours"}</option>
            <option value="30d">{lang === 'EN' ? "Last 30 Days" : "Derniers 30 Jours"}</option>
            <option value="all">{lang === 'EN' ? "All Time" : "Tout l'Historique"}</option>
          </select>
        </div>

        {/* Segmentation Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-black text-stone-400 uppercase tracking-wider shrink-0">
            {lang === 'EN' ? "Segment:" : "Segment:"}
          </span>
          <select
            value={userSegment}
            onChange={(e) => {
              setUserSegment(e.target.value as any);
              addAuditLog('UPDATE_FILTER_SEGMENT', 'REPORTING', `Adjusted user segment filter to ${e.target.value}`, 'SUCCESS');
            }}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-1.5 px-3 text-xs font-black text-stone-800 focus:outline-none"
          >
            <option value="all">{lang === 'EN' ? "All Segments" : "Tous les Segments"}</option>
            <option value="free">{lang === 'EN' ? "Free Tier" : "Utilisateurs Gratuits"}</option>
            <option value="pro">{lang === 'EN' ? "Pro Subscription" : "Abonnés Pro"}</option>
            <option value="enterprise">{lang === 'EN' ? "Enterprise Workspace" : "Workspace Entreprise"}</option>
          </select>
        </div>

        {/* Export action */}
        <button
          onClick={triggerExport}
          disabled={isExporting}
          className="bg-stone-900 text-white hover:bg-stone-800 font-mono text-[11px] font-black uppercase tracking-wider rounded-xl py-1.5 px-3 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
        >
          {isExporting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{lang === 'EN' ? "COMPILING REPORT..." : "GÉNÉRATION..."}</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'EN' ? "EXPORT ENCRYPTED REPORT" : "EXPORTER RAPPORT CHIFFRÉ"}</span>
            </>
          )}
        </button>
      </div>

      {exportMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold font-sans animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* -------------------------------------------------------------
          CENTRAL HUB NAVIGATION RAIL
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Navigation Rail */}
        <div className="lg:col-span-3 bg-white border border-stone-200 p-4 rounded-3xl space-y-1.5 shadow-xs">
          <div className="px-3.5 py-2">
            <span className="font-mono text-[9px] font-black text-stone-400 uppercase tracking-widest">
              {lang === 'EN' ? 'BI & OPERATIONAL MODULES' : 'MODULES BUSINESS INTEL'}
            </span>
          </div>

          {[
            { id: 'users', label: lang === 'EN' ? 'User Management' : 'Utilisateurs', icon: Users, badge: userList.length },
            { id: 'ai', label: lang === 'EN' ? 'AI Analytics' : 'Analyses IA', icon: Sparkles, badge: '99%' },
            { id: 'revenue', label: lang === 'EN' ? 'Revenue & Billing' : 'Finances & Factures', icon: CreditCard, badge: `$${(revenueTotalValue / 1000).toFixed(1)}k` },
            { id: 'system', label: lang === 'EN' ? 'System Health' : 'Santé Système', icon: Cpu, badge: 'OK' },
            { id: 'flags', label: lang === 'EN' ? 'Feature Flags Control' : 'Contrôle Flags', icon: Sliders, badge: flags.length },
            { id: 'experiments', label: lang === 'EN' ? 'Experiment Analytics' : 'A/B Tests & Stats', icon: FlaskConical },
            { id: 'security', label: lang === 'EN' ? 'Security & Audit' : 'Sécurité & Logs', icon: ShieldCheck, badge: auditLogs.length },
            { id: 'support', label: lang === 'EN' ? 'Support & Operations' : 'Outils de Support', icon: Terminal, badge: systemHealth.queueBacklog > 0 ? `${systemHealth.queueBacklog} job` : '' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setExportMessage('');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-stone-950 text-white shadow-md border border-stone-950' 
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-150/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side Module Content */}
        <div className="lg:col-span-9 bg-white border border-stone-200 p-5 rounded-3xl shadow-xs min-h-[520px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              
              {/* ========================================================
                  MODULE 1: USER MANAGEMENT
                  ======================================================== */}
              {activeTab === 'users' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                        {lang === 'EN' ? "Comprehensive User Administration" : "Administration Complète des Utilisateurs"}
                      </h3>
                      <p className="text-xs text-stone-400 font-medium">
                        {lang === 'EN' ? "Inspect progressions, manage roles, adjust access states, or perform targeted resets." : "Inspectez les progrès, configurez les rôles, suspendez des comptes ou réinitialisez des données."}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-100 border-b border-stone-200 font-mono text-[9px] text-stone-400 uppercase font-bold">
                          <th className="px-3 py-2.5 rounded-l-lg">{lang === 'EN' ? "User / Email" : "Utilisateur / Email"}</th>
                          <th className="px-3 py-2.5">{lang === 'EN' ? "Role" : "Rôle"}</th>
                          <th className="px-3 py-2.5">{lang === 'EN' ? "Subscription" : "Abonnement"}</th>
                          <th className="px-3 py-2.5 text-center">{lang === 'EN' ? "IPS Progression" : "Progression IPS"}</th>
                          <th className="px-3 py-2.5 text-center">{lang === 'EN' ? "Engagement Score" : "Score d'engagement"}</th>
                          <th className="px-3 py-2.5">{lang === 'EN' ? "State" : "Statut"}</th>
                          <th className="px-3 py-2.5 rounded-r-lg text-right">{lang === 'EN' ? "Operational Actions" : "Actions d'Opération"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium">
                        {userList.map(user => {
                          const status = userStatusMap[user.id] || 'Active';
                          const role = userRolesMap[user.id] || 'Candidate';
                          const engagement = userEngagementScores[user.id] || 75;
                          
                          // Determine styled subscription badges
                          let subBadge = <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono">FREE TRIAL</span>;
                          if (user.id === 'usr_sarah' || user.id === 'usr_elena') {
                            subBadge = <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-black font-mono">PRO SUBSCRIBER</span>;
                          } else if (user.id === 'usr_alex' || user.id === 'usr_candidate') {
                            subBadge = <span className="bg-amber-50 border border-amber-250 text-amber-850 px-2 py-0.5 rounded-md text-[10px] font-black font-mono">★ ENTERPRISE</span>;
                          }

                          return (
                            <tr key={user.id} className="hover:bg-stone-50/50">
                              <td className="px-3 py-3">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-stone-900 block">{user.name}</span>
                                  <span className="font-mono text-[10px] text-stone-400 block">{user.email}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <select
                                  value={role}
                                  onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                  className="bg-stone-50 border border-stone-200 rounded-lg p-1 text-[11px] font-bold text-stone-800 focus:outline-none"
                                >
                                  <option value="Candidate">Candidate</option>
                                  <option value="Interviewer">Interviewer</option>
                                  <option value="Admin">Admin</option>
                                  <option value="Super Admin">Super Admin</option>
                                </select>
                              </td>
                              <td className="px-3 py-3">
                                {subBadge}
                              </td>
                              <td className="px-3 py-3 text-center font-mono font-black text-emerald-600">
                                {user.id === 'usr_marcus' ? '+0 IPS' : `+${12 + (user.id.charCodeAt(5) % 8)} IPS`}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className="inline-flex items-center gap-1.5">
                                  <div className="w-16 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${engagement > 80 ? 'bg-emerald-500' : engagement > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                      style={{ width: `${engagement}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-mono font-bold text-stone-700">{engagement}/100</span>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black font-mono uppercase ${
                                  status === 'Active' ? 'text-emerald-600' : status === 'Suspended' ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    status === 'Active' ? 'bg-emerald-500' : status === 'Suspended' ? 'bg-amber-500' : 'bg-red-500'
                                  }`}></span>
                                  {status}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Suspend/Ban toggle */}
                                  <button
                                    onClick={() => handleToggleStatus(user.id)}
                                    className={`p-1.5 rounded-lg border border-stone-250 hover:bg-stone-50 text-stone-600 transition-all cursor-pointer`}
                                    title="Toggle Suspend / Ban"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  {/* Reset User Progression Data */}
                                  <button
                                    onClick={() => triggerResetUserData(user.id)}
                                    className="p-1.5 rounded-lg border border-red-200 bg-red-50/20 hover:bg-red-50 text-red-600 transition-all cursor-pointer"
                                    title="Hard Reset Data"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* RESET DATA OVERLAY CONFIRMATION */}
                  {resetConfirmUserId && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 animate-fade-in">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-red-900 uppercase">
                            {lang === 'EN' ? "PROVISIONAL ACCESS RESTRICTION: RESET CANDIDATE DATA" : "RESTRICTION TEMPORAIRE : RÉINITIALISER DONNÉES"}
                          </h4>
                          <p className="text-[11px] text-red-700">
                            {lang === 'EN' 
                              ? `Are you absolutely sure you want to delete all historical logs, generated events, and IPS progress values for user: ${resetConfirmUserId}? This operation is immutable.`
                              : `Êtes-vous certain de vouloir supprimer l'historique complet des entretiens et la courbe de progrès IPS de l'utilisateur : ${resetConfirmUserId} ? Cette action est irréversible.`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          onClick={() => setResetConfirmUserId(null)}
                          className="px-3 py-1.5 border border-stone-200 bg-white rounded-lg font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                        >
                          {lang === 'EN' ? "Cancel" : "Annuler"}
                        </button>
                        <button
                          onClick={confirmResetUserData}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer"
                        >
                          {lang === 'EN' ? "Confirm Reset" : "Confirmer la réinitialisation"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  MODULE 2: AI ANALYTICS
                  ======================================================= */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                        {lang === 'EN' ? "AI Engine Telemetry & Token Accounting" : "Télémétrie Moteur IA & Comptabilité des Tokens"}
                      </h3>
                      <p className="text-xs text-stone-400 font-medium">
                        {lang === 'EN' ? "Audit costs, request allocation across engines, response latencies, and fallback usage logs." : "Analysez les coûts, l'allocation entre les différents moteurs IA, les latences d'exécution et les rollbacks."}
                      </p>
                    </div>
                  </div>

                  {/* AI Quick KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-400 block">
                        {lang === 'EN' ? "Total AI Requests" : "Requêtes IA Totales"}
                      </span>
                      <span className="font-sans font-black text-xl text-stone-950 mt-1 block">
                        {aiRequestsData.total.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-emerald-600 mt-0.5 block">
                        ▲ {lang === 'EN' ? "99.82% Success rate" : "Taux de succès de 99.82%"}
                      </span>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-400 block">
                        {lang === 'EN' ? "Token Usage Volume" : "Volume de Tokens"}
                      </span>
                      <span className="font-sans font-black text-xl text-indigo-650 mt-1 block">
                        {aiRequestsData.tokens}M
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-stone-400 mt-0.5 block">
                        {lang === 'EN' ? "Input / Output balance: 3.1:1" : "Ratio Input / Output : 3.1:1"}
                      </span>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-400 block">
                        {lang === 'EN' ? "Est. AI Platform Cost" : "Coût Moteur IA Estimé"}
                      </span>
                      <span className="font-sans font-black text-xl text-stone-950 mt-1 block">
                        ${aiRequestsData.cost.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-emerald-600 mt-0.5 block">
                        ▼ {lang === 'EN' ? "Optimized by caching" : "Optimisé par mise en cache"}
                      </span>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-400 block">
                        {lang === 'EN' ? "Avg Latency (P50/P95)" : "Latence Moyenne (P50/P95)"}
                      </span>
                      <span className="font-sans font-black text-xl text-stone-950 mt-1 block">
                        1.2s / 1.8s
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-amber-600 mt-0.5 block">
                        ● {lang === 'EN' ? "P99 Peak latency: 3.2s" : "Pic de latence P99 : 3.2s"}
                      </span>
                    </div>
                  </div>

                  {/* AI Anomaly Drift Detection Panel */}
                  <div className="bg-stone-900 text-stone-300 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="font-mono text-[10px] font-black text-white uppercase tracking-wider">
                          {lang === 'EN' ? "AI Anomaly & Prompt Drift Audits" : "Détection d'Anomalies & Dérive des Prompts"}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[8px] font-mono bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 font-bold uppercase">
                        {lang === 'EN' ? "AI GUARDIAN LIVE" : "AI GUARDIAN EN DIRECT"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3 bg-stone-950 rounded-xl space-y-1">
                        <span className="text-[8px] font-mono font-bold text-stone-500 uppercase block">{lang === 'EN' ? "Prompt Degradation Audit" : "Dégradation des Prompts"}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400">NORMAL</span>
                          <span className="text-[9px] font-mono text-stone-400">Drift &lt; 0.02</span>
                        </div>
                      </div>

                      <div className="p-3 bg-stone-950 rounded-xl space-y-1">
                        <span className="text-[8px] font-mono font-bold text-stone-500 uppercase block">{lang === 'EN' ? "Unstable Scoring Alerts" : "Instabilité des Notes"}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 font-sans">NORMAL</span>
                          <span className="text-[9px] font-mono text-stone-400">Variance &lt; 1.4%</span>
                        </div>
                      </div>

                      <div className="p-3 bg-stone-950 rounded-xl space-y-1">
                        <span className="text-[8px] font-mono font-bold text-stone-500 uppercase block">{lang === 'EN' ? "Abnormal AI Cost Spikes" : "Pic de Coûts IA"}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400">WARNING</span>
                          <span className="text-[9px] font-mono text-stone-400">usr_alex (Spike detected)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Engine Allocation Bar Chart */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-4">
                    <span className="text-[10px] font-mono font-extrabold text-stone-800 uppercase tracking-wider block border-b border-stone-200 pb-2">
                      {lang === 'EN' ? "Request Allocation by Engine Module" : "Allocation des Requêtes par Module Moteur"}
                    </span>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={aiRequestsData.engines}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                          <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]}>
                            {aiRequestsData.engines.map((entry, index) => {
                              const colors = ['#4F46E5', '#10B981', '#3B82F6', '#8B5CF6'];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  MODULE 3: REVENUE & BILLING
                  ======================================================= */}
              {activeTab === 'revenue' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                        {lang === 'EN' ? "Financial Intelligence & Usage Profitability" : "Intelligence Financière & Rentabilité"}
                      </h3>
                      <p className="text-xs text-stone-400 font-medium">
                        {lang === 'EN' ? "Track conversions, average revenue per user (ARPU), billing segments, and credit margins." : "Suivez les conversions, le revenu moyen par utilisateur (ARPU) et les coûts réels de calcul."}
                      </p>
                    </div>
                  </div>

                  {/* Revenue Key metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                      <span className="text-[8px] font-mono font-bold uppercase text-stone-400 block">{lang === 'EN' ? "Total Revenue" : "Revenus Globaux"}</span>
                      <span className="font-sans font-black text-lg text-stone-950 mt-1 block">${revenueTotalValue.toLocaleString()}</span>
                      <span className="text-[9.5px] font-mono font-bold text-emerald-600 block mt-0.5">▲ {lang === 'EN' ? "18% MoM Growth" : "18% de Croissance"}</span>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                      <span className="text-[8px] font-mono font-bold uppercase text-stone-400 block">{lang === 'EN' ? "Active Subs" : "Abonnements Actifs"}</span>
                      <span className="font-sans font-black text-lg text-indigo-650 mt-1 block">{activeSubscriptionsValue}</span>
                      <span className="text-[9.5px] font-mono font-bold text-stone-400 block mt-0.5">{lang === 'EN' ? "98 Pro / 44 Enterprise" : "98 Pro / 44 Enterprise"}</span>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                      <span className="text-[8px] font-mono font-bold uppercase text-stone-400 block">{lang === 'EN' ? "Conversion Rate" : "Taux Conversion"}</span>
                      <span className="font-sans font-black text-lg text-stone-950 mt-1 block">{conversionRateValue}%</span>
                      <span className="text-[9.5px] font-mono font-bold text-emerald-600 block mt-0.5">▲ {lang === 'EN' ? "High standard" : "Taux supérieur"}</span>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                      <span className="text-[8px] font-mono font-bold uppercase text-stone-400 block">{lang === 'EN' ? "Churn Rate" : "Taux Churn"}</span>
                      <span className="font-sans font-black text-lg text-stone-950 mt-1 block">1.8%</span>
                      <span className="text-[9.5px] font-mono font-bold text-emerald-600 block mt-0.5">▼ {lang === 'EN' ? "Very stable" : "Très stable"}</span>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                      <span className="text-[8px] font-mono font-bold uppercase text-stone-400 block">{lang === 'EN' ? "Average ARPU" : "ARPU Moyen"}</span>
                      <span className="font-sans font-black text-lg text-stone-950 mt-1 block">$48.50</span>
                      <span className="text-[9.5px] font-mono font-bold text-stone-400 block mt-0.5">{lang === 'EN' ? "Target: $45.00" : "Cible : 45.00$"}</span>
                    </div>
                  </div>

                  {/* Profitability by user segment table */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-3">
                    <span className="text-[10px] font-mono font-extrabold text-stone-850 uppercase tracking-wider block border-b border-stone-200 pb-2">
                      {lang === 'EN' ? "Cost Accounting & Margin Analysis per Segment" : "Comptabilité Analytique & Marges par Segment"}
                    </span>
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-100 border-b border-stone-200 font-mono text-[9px] text-stone-400 uppercase font-bold">
                            <th className="px-3 py-2 rounded-l-md">{lang === 'EN' ? "Segment Tier" : "Segment"}</th>
                            <th className="px-3 py-2">{lang === 'EN' ? "Base Cost / user" : "Coût de Base / user"}</th>
                            <th className="px-3 py-2">{lang === 'EN' ? "AI Cost / user" : "Coût IA / user"}</th>
                            <th className="px-3 py-2">{lang === 'EN' ? "Credits Consumed" : "Crédits Consommés"}</th>
                            <th className="px-3 py-2 font-bold text-stone-900 text-right">{lang === 'EN' ? "Calculated Gross Margin" : "Marge Brute"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-150 font-bold text-stone-700">
                          <tr className="hover:bg-stone-100/40">
                            <td className="px-3 py-2.5 text-stone-900">Free Tier</td>
                            <td className="px-3 py-2.5 font-mono">$0.05 / day</td>
                            <td className="px-3 py-2.5 font-mono">$0.18 / day</td>
                            <td className="px-3 py-2.5 font-mono">10 / month</td>
                            <td className="px-3 py-2.5 text-right font-mono text-red-600">-$0.23 / user (Acquisition)</td>
                          </tr>
                          <tr className="hover:bg-stone-100/40">
                            <td className="px-3 py-2.5 text-stone-900">Pro Tier ($29/mo)</td>
                            <td className="px-3 py-2.5 font-mono">$0.15 / day</td>
                            <td className="px-3 py-2.5 font-mono">$1.15 / day</td>
                            <td className="px-3 py-2.5 font-mono">150 / month</td>
                            <td className="px-3 py-2.5 text-right font-mono text-emerald-600">+85% margin ($24.60 net)</td>
                          </tr>
                          <tr className="hover:bg-stone-100/40">
                            <td className="px-3 py-2.5 text-stone-900">Enterprise Workspace</td>
                            <td className="px-3 py-2.5 font-mono">$0.45 / day</td>
                            <td className="px-3 py-2.5 font-mono">$3.80 / day</td>
                            <td className="px-3 py-2.5 font-mono">Unlimited</td>
                            <td className="px-3 py-2.5 text-right font-mono text-emerald-600">+92% margin ($138.20 net)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Revenue Area Chart */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-4">
                    <span className="text-[10px] font-mono font-extrabold text-stone-850 uppercase tracking-wider block border-b border-stone-200 pb-2">
                      {lang === 'EN' ? "SaaS Revenue Growth Trend ($)" : "Évolution des Revenus Mensuels SaaS ($)"}
                    </span>
                    <div className="h-48 pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrendData}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                          <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                          <Tooltip />
                          <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="MRR ($)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  MODULE 4: SYSTEM MONITORING
                  ======================================================= */}
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                        {lang === 'EN' ? "SaaS Reliability & Real-Time Node Health" : "Disponibilité SaaS & État des Serveurs en Direct"}
                      </h3>
                      <p className="text-xs text-stone-400 font-medium">
                        {lang === 'EN' ? "Inspect API availability clusters, database write speeds, and active WebSockets." : "Surveillez les clusters d'API, l'état de la base de données et les sockets connectées."}
                      </p>
                    </div>
                  </div>

                  {/* Real-time Health Matrix Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex flex-col justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-500 block">{lang === 'EN' ? "API GATEWAY CLUSTER" : "CLUSTER API GATEWAY"}</span>
                      <span className="font-sans font-black text-xl text-emerald-700 block mt-1">99.98%</span>
                      <span className="text-[9px] font-mono text-emerald-600 block mt-0.5">● UPTIME ACTIVE</span>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-500 block">{lang === 'EN' ? "DB Read/Write Speed" : "Vitesse d'écriture DB"}</span>
                      <span className="font-sans font-black text-xl text-stone-900 block mt-1">{systemHealth.dbResponse}</span>
                      <span className="text-[9px] font-mono text-stone-400 block mt-0.5">Healthy (12/100 active)</span>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-500 block">{lang === 'EN' ? "Active Background Jobs" : "Jobs d'Arrière-Plan"}</span>
                      <span className="font-sans font-black text-xl text-indigo-600 block mt-1">{systemHealth.queueBacklog}</span>
                      <span className="text-[9px] font-mono text-stone-400 block mt-0.5">Workers: {systemHealth.activeWorkers}</span>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-500 block">{lang === 'EN' ? "Websocket Sessions" : "Sessions Websocket"}</span>
                      <span className="font-sans font-black text-xl text-stone-900 block mt-1">{systemHealth.websocketCount}</span>
                      <span className="text-[9px] font-mono text-emerald-600 block mt-0.5">● Real-time Sync Active</span>
                    </div>
                  </div>

                  {/* AI Provider Cluster Health */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-3.5">
                    <span className="text-[10px] font-mono font-extrabold text-stone-850 uppercase tracking-wider block border-b border-stone-200 pb-2">
                      {lang === 'EN' ? "AI Service Availability Stack" : "Disponibilité de l'Infrastructure d'IA"}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 bg-white border border-stone-150 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-stone-400" />
                          <span className="font-bold text-stone-800">GPT-4o-mini</span>
                        </div>
                        <span className="font-black text-emerald-600">100% (Online)</span>
                      </div>

                      <div className="p-3 bg-white border border-stone-150 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-stone-400" />
                          <span className="font-bold text-stone-800">GPT-4o</span>
                        </div>
                        <span className="font-black text-emerald-600">100% (Online)</span>
                      </div>

                      <div className="p-3 bg-white border border-stone-150 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-stone-400" />
                          <span className="font-bold text-stone-800">Fallback API Endpoint</span>
                        </div>
                        <span className="font-black text-indigo-500">STANDBY (0s latency)</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Warnings / Incidents Log */}
                  <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-amber-150 pb-2">
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                      <span className="font-mono text-[10px] font-black text-amber-900 uppercase tracking-wider">
                        {lang === 'EN' ? "Active System Warnings & Degradation Logs" : "Journal des Dégradations et Alertes Systèmes"}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-amber-150">
                        <span className="font-mono text-stone-500">[04:12:02 UTC]</span>
                        <span className="font-bold text-[#854D0E] flex-1 ml-3">{lang === 'EN' ? "WebSocket node pool automatic cluster scaling triggered" : "Déclenchement de la mise à l'échelle automatique Websockets"}</span>
                        <span className="px-2 py-0.5 text-[8.5px] font-black bg-emerald-50 text-emerald-700 rounded-md">RESOLVED</span>
                      </div>

                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-amber-150">
                        <span className="font-mono text-stone-500">[03:44:11 UTC]</span>
                        <span className="font-bold text-[#854D0E] flex-1 ml-3">{lang === 'EN' ? "Staging server backup snapshot complete" : "Sauvegarde planifiée de la base de staging réussie"}</span>
                        <span className="px-2 py-0.5 text-[8.5px] font-black bg-emerald-50 text-emerald-700 rounded-md">COMPLETED</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  MODULE 5: FEATURE FLAGS
                  ======================================================= */}
              {activeTab === 'flags' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                        {lang === 'EN' ? "SaaS Feature Control & Targeted Rollouts" : "Contrôle des Fonctionnalités & Déploiements Ciblés"}
                      </h3>
                      <p className="text-xs text-stone-400 font-medium">
                        {lang === 'EN' ? "Enable specific user testing flags, rollout globally, or trigger immediate rollbacks." : "Activez des options de test, configurez le déploiement ou déclenchez des rollbacks immédiats."}
                      </p>
                    </div>
                  </div>

                  {/* Flag list details */}
                  <div className="space-y-3">
                    {flags.map(flag => (
                      <div key={flag.key} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] font-bold bg-stone-200 text-stone-850 px-2 py-0.5 rounded uppercase">
                              {flag.key}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase ${
                              flag.env === 'production' ? 'bg-indigo-50 border border-indigo-100 text-indigo-600' : 'bg-amber-50 border border-amber-100 text-amber-700'
                            }`}>
                              {flag.env}
                            </span>
                          </div>
                          <span className="font-sans font-black text-sm text-stone-900 block">{flag.name}</span>
                          <span className="text-[11px] font-mono font-bold text-stone-400 block">
                            Targeting: {flag.target === 'all' ? 'All Users' : flag.target === 'pro' ? 'Pro Plan Subscribers' : 'Enterprise Customers Only'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          {/* Rollout slider */}
                          {flag.enabled && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono font-bold text-stone-400 block">
                                ROLLOUT PERCENTAGE ({flag.rollout}%)
                              </span>
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={flag.rollout} 
                                onChange={(e) => handleUpdateRollout(flag.key, parseInt(e.target.value))}
                                className="w-24 sm:w-32 accent-stone-900 h-1 cursor-pointer bg-stone-200 rounded-lg"
                              />
                            </div>
                          )}

                          {/* Toggle Switch */}
                          <div>
                            <button
                              onClick={() => handleToggleFlag(flag.key)}
                              className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer relative ${
                                flag.enabled ? 'bg-emerald-500' : 'bg-stone-300'
                              }`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                                flag.enabled ? 'translate-x-6' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ROLLBACK FLOW OVERLAY MANDATING ROLLBACK REASON */}
                  {rollbackFlagKey && (
                    <div className="p-4 bg-amber-50 border border-amber-250 rounded-2xl space-y-3 animate-fade-in">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-amber-900 uppercase">
                            {lang === 'EN' ? "MANDATORY ADMINISTRATIVE REQUIREMENT: ROLLBACK PROTOCOL" : "EXIGENCE ADMINISTRATIVE : PROTOCOLE DE RETOUR EN ARRIÈRE"}
                          </h4>
                          <p className="text-[11px] text-amber-700">
                            {lang === 'EN'
                              ? `You are about to instantly rollback feature flag "${rollbackFlagKey}". Shana regulatory standard require an explicit explanation for this override.`
                              : `Vous êtes sur le point de désactiver immédiatement "${rollbackFlagKey}". La réglementation Shana exige de spécifier la raison de cette intervention.`}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <textarea
                          placeholder={lang === 'EN' ? "Specify reason (e.g. prompt drift warning, latency spikes, billing leaks...)" : "Précisez le motif (ex : dérive de prompt, pic de latence...)"}
                          value={rollbackReason}
                          onChange={(e) => setRollbackReason(e.target.value)}
                          className="w-full bg-white border border-amber-250 rounded-xl p-3 text-xs text-stone-850 font-bold focus:outline-none placeholder-amber-400"
                          rows={2}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          onClick={() => setRollbackFlagKey(null)}
                          className="px-3 py-1.5 border border-stone-200 bg-white rounded-lg font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                        >
                          {lang === 'EN' ? "Abort" : "Annuler"}
                        </button>
                        <button
                          onClick={submitRollback}
                          disabled={!rollbackReason.trim()}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer"
                        >
                          {lang === 'EN' ? "Confirm Immediate Rollback" : "Confirmer le rollback immédiat"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  MODULE 6: EXPERIMENT ANALYTICS
                  ======================================================= */}
              {activeTab === 'experiments' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                        {lang === 'EN' ? "Experimentation & Scientific A/B Audits" : "Expérimentation & Analyses Scientifiques A/B"}
                      </h3>
                      <p className="text-xs text-stone-400 font-medium">
                        {lang === 'EN' ? "Analyze statistical significance, performance metrics, and learning curves between test variations." : "Analysez la pertinence statistique, l'impact sur le progrès des candidats et les conversions d'achat."}
                      </p>
                    </div>
                  </div>

                  {/* Scientific Stats Summary Card */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-4 text-xs font-mono text-stone-700">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <span className="font-black text-stone-850 text-[10px] uppercase tracking-wider block">
                        {lang === 'EN' ? "Active A/B Test #1: Voice Adaptation Loop Severity" : "A/B Test Actif #1 : Sévérité du rythme de coaching vocal"}
                      </span>
                      <span className="px-2 py-0.5 text-[8px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold rounded">
                        N = 840 CANDIDATES
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[8.5px] text-stone-400 uppercase font-black">Statistical Significance</span>
                        <p className="font-sans font-black text-sm text-indigo-650">98.4% Confidence</p>
                        <span className="text-[9px] text-stone-400 font-bold">p-value = 0.012 (Significant)</span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[8.5px] text-stone-400 uppercase font-black">Optimal Variant Recommendation</span>
                        <p className="font-sans font-black text-sm text-emerald-600">GROUP B (High Frequency)</p>
                        <span className="text-[9px] text-stone-400 font-bold">Improvement delta: +14.2%</span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[8.5px] text-stone-400 uppercase font-black">Retention Impact (D7)</span>
                        <p className="font-sans font-black text-sm text-stone-900">Group B: 64% vs Control: 48%</p>
                        <span className="text-[9px] text-stone-400 font-bold">Strong user habit formation</span>
                      </div>
                    </div>
                  </div>

                  {/* Comparisons Grid Table */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-3">
                    <span className="text-[10px] font-mono font-extrabold text-stone-850 uppercase tracking-wider block border-b border-stone-200 pb-2">
                      {lang === 'EN' ? "Variation Comparison Metric Ledger" : "Registre de Comparaison des Groupes de Test"}
                    </span>
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-100 border-b border-stone-200 font-mono text-[9px] text-stone-400 uppercase font-bold">
                            <th className="px-3 py-2 rounded-l-md">Variation Group</th>
                            <th className="px-3 py-2">Candidate IPS Gain</th>
                            <th className="px-3 py-2">D1 Retention Rate</th>
                            <th className="px-3 py-2">Trial Paid Conversion</th>
                            <th className="px-3 py-2 rounded-r-md font-bold text-stone-900 text-right">Performance Weight</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-150 font-bold text-stone-700">
                          <tr className="hover:bg-stone-100/40">
                            <td className="px-3 py-2.5 text-stone-900">Control Group (No adaptation coaching)</td>
                            <td className="px-3 py-2.5 font-mono text-stone-500">+6.4 IPS</td>
                            <td className="px-3 py-2.5 font-mono">68%</td>
                            <td className="px-3 py-2.5 font-mono">4.8%</td>
                            <td className="px-3 py-2.5 text-right font-mono text-stone-500">Baseline (0.00)</td>
                          </tr>
                          <tr className="hover:bg-stone-100/40">
                            <td className="px-3 py-2.5 text-stone-900">Group A (Low Frequency Coaching)</td>
                            <td className="px-3 py-2.5 font-mono text-emerald-600">+11.8 IPS</td>
                            <td className="px-3 py-2.5 font-mono">74%</td>
                            <td className="px-3 py-2.5 font-mono">7.1%</td>
                            <td className="px-3 py-2.5 text-right font-mono text-indigo-500">+1.42 (Moderate)</td>
                          </tr>
                          <tr className="hover:bg-stone-100/40 bg-emerald-50/20">
                            <td className="px-3 py-2.5 text-stone-900 flex items-center gap-2">
                              <span>Group B (High Frequency Coaching)</span>
                              <span className="px-1.5 py-0.5 text-[8px] font-mono font-black bg-emerald-100 text-emerald-800 rounded">OPTIMAL</span>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-emerald-600 font-black">+14.2 IPS</td>
                            <td className="px-3 py-2.5 font-mono">82%</td>
                            <td className="px-3 py-2.5 font-mono font-black text-indigo-700">8.2%</td>
                            <td className="px-3 py-2.5 text-right font-mono text-emerald-600 font-black">+2.45 (Outstanding)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  MODULE 7: SECURITY OVERVIEW
                  ======================================================= */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                        {lang === 'EN' ? "Security Operations & Immutable Audit Ledger" : "Opérations de Sécurité & Grand Livre d'Audit Immuable"}
                      </h3>
                      <p className="text-xs text-stone-400 font-medium">
                        {lang === 'EN' ? "Monitor brute force, rate-limit abuse events, and view immutable logs of admin overrides." : "Surveillez les abus de requêtes, tentatives d'intrusion et inspectez le grand livre d'audit."}
                      </p>
                    </div>
                  </div>

                  {/* Security KPI cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-400 block">{lang === 'EN' ? "Failed Login Attempts" : "Tentatives de Connexion Échouées"}</span>
                      <span className="font-sans font-black text-xl text-stone-900 block mt-1">4</span>
                      <span className="text-[9px] font-mono text-emerald-600 block mt-0.5">● Baseline normal</span>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-400 block">{lang === 'EN' ? "Rate Limit Throttles" : "Blocages de Rate Limit"}</span>
                      <span className="font-sans font-black text-xl text-stone-900 block mt-1">14</span>
                      <span className="text-[9px] font-mono text-stone-400 block mt-0.5">Today (Auto-mitigated)</span>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-400 block">{lang === 'EN' ? "Suspicious Activities" : "Activités Suspectes"}</span>
                      <span className="font-sans font-black text-xl text-emerald-600 block mt-1">0</span>
                      <span className="text-[9px] font-mono text-emerald-600 block mt-0.5">● Safe environment</span>
                    </div>

                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-400 block">{lang === 'EN' ? "Unauthorized Hits" : "Hits Non Autorisés"}</span>
                      <span className="font-sans font-black text-xl text-stone-900 block mt-1">1</span>
                      <span className="text-[9px] font-mono text-stone-400 block mt-0.5">Blocked by Role Guard</span>
                    </div>
                  </div>

                  {/* Immutable Audit Table */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-3">
                    <span className="text-[10px] font-mono font-extrabold text-stone-850 uppercase tracking-wider block border-b border-stone-200 pb-2">
                      {lang === 'EN' ? "Immutable System Override Audit Log" : "Grand Livre d'Audit des Interventions Systèmes"}
                    </span>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-stone-100 border-b border-stone-200 font-mono text-[9px] text-stone-400 uppercase font-bold">
                            <th className="px-3 py-2 rounded-l-md">{lang === 'EN' ? "Timestamp" : "Date & Heure"}</th>
                            <th className="px-3 py-2">{lang === 'EN' ? "User ID" : "ID Executeur"}</th>
                            <th className="px-3 py-2">{lang === 'EN' ? "Action Code" : "Code Action"}</th>
                            <th className="px-3 py-2">{lang === 'EN' ? "Module" : "Module"}</th>
                            <th className="px-3 py-2">{lang === 'EN' ? "Description" : "Description détaillée"}</th>
                            <th className="px-3 py-2 rounded-r-md text-right">{lang === 'EN' ? "IP Status" : "IP & Statut"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-150 font-bold text-stone-600">
                          {auditLogs.map(log => (
                            <tr key={log.id} className="hover:bg-stone-100/30">
                              <td className="px-3 py-2 font-mono text-[10px] text-stone-400">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="px-3 py-2 text-stone-900 font-mono text-[10.5px]">
                                {log.adminUser}
                              </td>
                              <td className="px-3 py-2 font-mono text-[10.5px] text-indigo-700">
                                {log.action}
                              </td>
                              <td className="px-3 py-2 font-mono text-[9.5px] bg-stone-100 text-stone-600 rounded px-1 text-center">
                                {log.module}
                              </td>
                              <td className="px-3 py-2 text-stone-800 text-[11px] font-medium font-sans">
                                {log.details}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="space-y-0.5">
                                  <span className="font-mono text-[10px] text-stone-400 block">{log.ipAddress}</span>
                                  <span className={`text-[8.5px] font-mono font-black ${
                                    log.status === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'
                                  }`}>{log.status}</span>
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

              {/* ========================================================
                  MODULE 8: SUPPORT & OPERATIONS TOOLS
                  ======================================================= */}
              {activeTab === 'support' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-sans font-black text-lg text-stone-900 tracking-tight">
                        {lang === 'EN' ? "Operations & Direct Support Infrastructure" : "Opérations & Infrastructure Directe de Support"}
                      </h3>
                      <p className="text-xs text-stone-400 font-medium">
                        {lang === 'EN' ? "Replay AI queries, reconstruct candidate sessions from live traces, or inspect background queues." : "Rejouez des requêtes IA, retracez l'historique d'un candidat ou inspectez les tâches planifiées."}
                      </p>
                    </div>
                  </div>

                  {/* Section A: Background Job Queue Inspection */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-3">
                    <span className="text-[10px] font-mono font-extrabold text-stone-850 uppercase tracking-wider block border-b border-stone-200 pb-2">
                      {lang === 'EN' ? "Task Broker Queue Audit" : "File d'attente du Gestionnaire de Tâches"}
                    </span>

                    <div className="space-y-2 text-xs">
                      {jobQueue.map(job => (
                        <div key={job.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-stone-400 uppercase font-bold">{job.id}</span>
                              <span className="font-mono font-black text-stone-800 text-[11px]">{job.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-stone-400 block">Created: {job.created} • Attempts: {job.attempts}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase rounded ${
                              job.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              job.status === 'Failed' ? 'bg-red-50 text-red-750 border border-red-150' :
                              'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {job.status} {job.duration && `(${job.duration})`}
                            </span>

                            {/* Retry trigger */}
                            {job.status === 'Failed' && (
                              <button
                                onClick={() => handleRetryJob(job.id)}
                                className="bg-stone-900 hover:bg-stone-800 text-white font-mono text-[10px] font-black uppercase py-1 px-2 rounded-lg cursor-pointer"
                              >
                                {lang === 'EN' ? "RETRY JOB" : "REJOUER TÂCHE"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section B: AI Request Replay Playground */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-extrabold text-stone-850 uppercase tracking-wider block border-b border-stone-200 pb-2">
                        {lang === 'EN' ? "Historical AI Query Replay Platform" : "Plateforme de Redirection et Replay de Requêtes IA"}
                      </span>
                      <p className="text-[11px] text-stone-400 font-medium">
                        {lang === 'EN' ? "Review real past queries executed across Engines, tweak prompt settings, and execute a dry-run replay." : "Visualisez de vraies requêtes passées, ajustez le prompt et lancez une ré-exécution de test."}
                      </p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-stone-400 uppercase tracking-wide">Select Event Log Template:</span>
                        <select
                          value={selectedAIRequestToReplay}
                          onChange={(e) => setSelectedAIRequestToReplay(e.target.value)}
                          className="bg-white border border-stone-200 rounded-lg p-1.5 text-[11px] font-bold text-stone-850 focus:outline-none"
                        >
                          {aiRequestLogs.map(req => (
                            <option key={req.id} value={req.id}>{req.engine} - {req.user}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="font-mono font-black text-stone-400 uppercase text-[9px] block">Prompt Override Context:</span>
                        <textarea
                          value={aiReplayPromptText}
                          onChange={(e) => setAiReplayPromptText(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs font-mono text-stone-850 focus:outline-none focus:ring-1 focus:ring-stone-400"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-stone-400 font-bold block">
                          Base tokens: ~450 • Est. Cost: $0.0006
                        </span>
                        <button
                          onClick={handleReplayAIRequest}
                          disabled={isReplayingAI}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[10.5px] font-black uppercase py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isReplayingAI ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>{lang === 'EN' ? "Executing dry-run..." : "Exécution du test..."}</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{lang === 'EN' ? "Execute AI Replay dry-run" : "Lancer le replay de test IA"}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {aiReplayResult && (
                        <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl font-mono text-[11px] text-emerald-400 space-y-1 whitespace-pre-wrap">
                          {aiReplayResult}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section C: Live Session Trace reconstruction */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-4">
                    <span className="text-[10px] font-mono font-extrabold text-stone-850 uppercase tracking-wider block border-b border-stone-200 pb-2">
                      {lang === 'EN' ? "Interactive Event Trace & Reconstruction" : "Reconstitution Interactive des Traces d'Événements"}
                    </span>

                    <div className="space-y-3 text-xs font-mono">
                      <p className="text-[11px] text-stone-400 font-sans font-medium">
                        {lang === 'EN' ? "Trace of real candidate interactions reconstructed chronologically through local and cloud event systems." : "Tracé des interactions réelles reconstitué chronologiquement grâce aux systèmes d'événements locaux et cloud."}
                      </p>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-stone-200">
                          <span className="text-[9.5px] text-indigo-600 font-black shrink-0 mt-0.5">[14:10:24]</span>
                          <div className="space-y-0.5">
                            <span className="font-black text-stone-850 block">EVENT: INTERVIEW_STARTED</span>
                            <span className="text-stone-400 text-[10px] block">Payload: {"{ interviewType: 'Technical', mode: 'pressure' }"}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-stone-200">
                          <span className="text-[9.5px] text-indigo-600 font-black shrink-0 mt-0.5">[14:11:42]</span>
                          <div className="space-y-0.5">
                            <span className="font-black text-stone-850 block">EVENT: ADAPTATION_RECOMMENDED</span>
                            <span className="text-stone-400 text-[10px] block">Payload: {"{ trigger: 'pacing_fatigue', pacing: 'slow_down' }"}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-stone-200">
                          <span className="text-[9.5px] text-indigo-600 font-black shrink-0 mt-0.5">[14:12:05]</span>
                          <div className="space-y-0.5">
                            <span className="font-black text-stone-850 block">EVENT: ADAPTATION_APPLIED</span>
                            <span className="text-stone-400 text-[10px] block">Payload: {"{ adaptationApproved: true, trigger: 'pacing_fatigue' }"}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-stone-200">
                          <span className="text-[9.5px] text-indigo-600 font-black shrink-0 mt-0.5">[14:15:30]</span>
                          <div className="space-y-0.5">
                            <span className="font-black text-stone-850 block">EVENT: EVALUATION_COMPLETED</span>
                            <span className="text-stone-400 text-[10px] block">Payload: {"{ score: 84, communicationScore: 89, behavioralScore: 82 }"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* -------------------------------------------------------------
          GRAND LEDGER FOOTER
          ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-stone-900 text-stone-400 p-4 rounded-2xl text-[10px] font-mono font-bold gap-3">
        <span className="flex items-center gap-1.5 text-stone-300">
          <Database className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{lang === 'EN' ? "SaaS Real-Time Audit Ledger v2.0" : "Registre d'Analyses d'Événements SaaS v2.0"}</span>
        </span>
        <span className="text-indigo-400 uppercase tracking-widest text-[9px]">
          ● {lang === 'EN' ? "PRODUCTION STABILIZED & REPLICATED" : "INFRASTRUCTURE STABILISÉE EN PRODUCTION"}
        </span>
      </div>

    </div>
  );
}
