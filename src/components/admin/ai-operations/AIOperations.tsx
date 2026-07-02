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
  HelpCircle
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

interface AIOperationsProps {
  currentUser: User;
  lang?: 'FR' | 'EN';
}

type TabType = 'dashboard' | 'monitor' | 'evaluation' | 'quality' | 'incidents';

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

  // Incident form
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [incidentType, setIncidentType] = useState<AIOpsIncident['type']>('AI unavailable');
  const [incidentSeverity, setIncidentSeverity] = useState<AIOpsIncident['severity']>('warning');
  const [incidentDesc, setIncidentDesc] = useState('');

  // Selected session for inspection
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);

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
          { id: 'incidents', label: lang === 'FR' ? 'Centre d\'Incidents' : 'Incident Center', icon: ShieldAlert }
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
          <div className="space-y-6 text-left" id="section-4-quality">
            
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

            <div className="bg-stone-50 border border-stone-200 p-6 rounded-[32px] space-y-3">
              <h4 className="font-sans font-bold text-sm text-stone-900">
                {lang === 'FR' ? "Règles d'Évaluation Automatisées" : "Evaluation Quality Standards"}
              </h4>
              <p className="text-[#6B7280] text-xs font-semibold leading-relaxed">
                {lang === 'FR'
                  ? "Le moteur de qualité analyse continuellement la perte de paquets WebSocket de l'audio candidat, les coupures inattendues de caméra, et la latence moyenne de l'inférence. Si les indicateurs passent à l'état CRITICAL, une alerte est transmise au système d'incident."
                  : "The Shana engine continuously watches packet delivery across candidate audio/video channels, and prompt completion times. Critical health markers auto-populate the incident center for fast super-admin override triggers."}
              </p>
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

      </div>

    </div>
  );
}
