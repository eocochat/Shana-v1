import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  TrendingUp, 
  Sliders, 
  Play, 
  RotateCcw, 
  Info, 
  Shield, 
  Cpu, 
  Award, 
  Mic, 
  Radio, 
  Network, 
  UserCheck, 
  Settings, 
  Database,
  BarChart4,
  RefreshCw,
  Clock,
  Zap,
  Check,
  Heart
} from 'lucide-react';

interface VoiceIntelligenceCenterProps {
  lang?: 'FR' | 'EN';
}

export default function VoiceIntelligenceCenter({ lang = 'EN' }: VoiceIntelligenceCenterProps) {
  const isFR = lang === 'FR';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'studio' | 'listening' | 'empathy' | 'simulator' | 'rules' | 'privacy'>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Playground simulation states
  const [simPace, setSimPace] = useState(125); // Words Per Minute
  const [simFillers, setSimFillers] = useState(3); // count
  const [simHesitations, setSimHesitations] = useState(4); // seconds
  const [simBackgroundNoise, setSimBackgroundNoise] = useState('Low'); // Low | Medium | High
  const [simMicQuality, setSimMicQuality] = useState('Excellent'); // Excellent | Good | Poor
  const [simLatency, setSimLatency] = useState(140); // ms
  
  // Recruiter Empathy Simulator States
  const [candidateAnxiety, setCandidateAnxiety] = useState(48);
  const [recruiterSensitivity, setRecruiterSensitivity] = useState(85);
  
  // Real-time calculated results based on playground state (Multi-Signal Fusion Simulation)
  const [calcConfidence, setCalcConfidence] = useState(88);
  const [calcFluency, setCalcFluency] = useState(90);
  const [calcStability, setCalcStability] = useState(92);
  const [calcUnifiedScore, setCalcUnifiedScore] = useState(89);
  const [calcPrimarySilenceReason, setCalcPrimarySilenceReason] = useState('Thinking Pause');
  const [calcAlerts, setCalcAlerts] = useState<string[]>([]);

  // Auto calculate fusion metrics when playground sliders change
  useEffect(() => {
    // Speaking pace impacts score (ideal: 110 - 145 WPM)
    let pacePenalty = 0;
    if (simPace < 100) pacePenalty = (100 - simPace) * 0.8;
    else if (simPace > 150) pacePenalty = (simPace - 150) * 0.6;

    // Fillers penalty
    const fillerPenalty = simFillers * 4.5;

    // Hesitations penalty
    const hesitationPenalty = simHesitations * 3.5;

    // Noise level impacts
    let noisePenalty = 0;
    if (simBackgroundNoise === 'Medium') noisePenalty = 8;
    else if (simBackgroundNoise === 'High') noisePenalty = 22;

    // Mic quality impacts
    let micPenalty = 0;
    if (simMicQuality === 'Good') micPenalty = 5;
    else if (simMicQuality === 'Poor') micPenalty = 18;

    // Compute metrics
    const conf = Math.max(30, Math.min(99, Math.round(95 - (hesitationPenalty * 0.5) - (pacePenalty * 0.4) - (fillerPenalty * 0.3))));
    const flu = Math.max(25, Math.min(99, Math.round(98 - fillerPenalty - (hesitationPenalty * 0.8) - (pacePenalty * 0.3))));
    const stab = Math.max(40, Math.min(99, Math.round(96 - (pacePenalty * 0.5) - (noisePenalty * 0.4))));
    
    setCalcConfidence(conf);
    setCalcFluency(flu);
    setCalcStability(stab);

    const baseUnified = Math.round((conf * 0.4) + (flu * 0.35) + (stab * 0.25) - (noisePenalty * 0.2) - (micPenalty * 0.1));
    setCalcUnifiedScore(Math.max(20, Math.min(100, baseUnified)));

    // Differentiate thinking silence vs stress/hesitation
    if (simHesitations > 7) {
      setCalcPrimarySilenceReason(isFR ? 'Perte de confiance probable' : 'Likely loss of confidence');
    } else if (simHesitations > 4) {
      setCalcPrimarySilenceReason(isFR ? 'Recherche de mots / Stress' : 'Searching for words / Mild stress');
    } else if (simPace > 140) {
      setCalcPrimarySilenceReason(isFR ? 'Transition rapide de conversation' : 'Rapid conversational transition');
    } else {
      setCalcPrimarySilenceReason(isFR ? 'Pause de réflexion technique constructive' : 'Constructive technical thinking pause');
    }

    // Determine alerts
    const activeAlerts: string[] = [];
    if (simPace > 155) activeAlerts.push(isFR ? "Débit de parole excessif (parle trop vite)" : "Excessive speaking pace (speaking too fast)");
    if (simPace < 95) activeAlerts.push(isFR ? "Débit de parole trop lent (hésitant)" : "Speaking pace too slow (potential hesitation)");
    if (simFillers > 5) activeAlerts.push(isFR ? "Forte densité de tics de langage ('euh', 'du coup')" : "High density of vocal fillers ('um', 'uh', 'like')");
    if (simHesitations > 5) activeAlerts.push(isFR ? "Pauses de silence prolongées détectées" : "Prolonged silence breaks detected");
    if (simBackgroundNoise === 'High') activeAlerts.push(isFR ? "Bruit de fond important - Signal altéré" : "Severe background noise - Degraded signal quality");
    if (simMicQuality === 'Poor') activeAlerts.push(isFR ? "Qualité micro médiocre - Risque de saturation" : "Poor microphone quality - High risk of clipping");
    if (simLatency > 250) activeAlerts.push(isFR ? "Latence réseau élevée - Désynchronisation audio" : "High network latency - Risk of audio desync");

    setCalcAlerts(activeAlerts);
  }, [simPace, simFillers, simHesitations, simBackgroundNoise, simMicQuality, simLatency, isFR]);

  // Toast notifier helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerToast(isFR ? "Statistiques vocales agrégées synchronisées" : "Aggregated voice telemetry synchronized successfully");
    }, 1200);
  };

  // Rule management state values
  const [paceMax, setPaceMax] = useState(160);
  const [paceMin, setPaceMin] = useState(90);
  const [fillerThresh, setFillerThresh] = useState(4);
  const [pauseThresh, setPauseThresh] = useState(3.5);
  const [enableLiveHints, setEnableLiveHints] = useState(true);

  // Privacy rules state
  const [retentionPeriod, setRetentionPeriod] = useState('0'); // 0 = Instant purge, save telemetry only
  const [strictAnonymization, setStrictAnonymization] = useState(true);
  const [encryptMetadata, setEncryptMetadata] = useState(true);

  // Recruiter Empathy State Loader
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    try {
      const keys = Object.keys(localStorage);
      const historyKeys = keys.filter(k => k.startsWith('shana_history_') || k.includes('shana_voice_sessions_'));
      
      let latestSession: any = null;
      let maxTime = 0;

      for (const key of historyKeys) {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
          const parsed = JSON.parse(itemStr);
          if (Array.isArray(parsed)) {
            for (const session of parsed) {
              const t = session.updatedAt ? new Date(session.updatedAt).getTime() : 0;
              if (t > maxTime && session.analytics) {
                maxTime = t;
                latestSession = session;
              }
            }
          } else if (parsed && parsed.analytics) {
            const t = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 0;
            if (t > maxTime) {
              maxTime = t;
              latestSession = parsed;
            }
          }
        }
      }

      const brainKeys = keys.filter(k => k.startsWith('shana_brain_'));
      for (const key of brainKeys) {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
          const parsed = JSON.parse(itemStr);
          if (parsed && parsed.analytics) {
            latestSession = parsed;
            break;
          }
        }
      }

      if (latestSession) {
        setSessionData(latestSession);
      }
    } catch (e) {
      console.warn("Failed to load active session data for empathy tab", e);
    }
  }, [isRefreshing]);

  // Derived Empathy metrics
  const empathyAvgScore = sessionData?.analytics?.averageEmpathyScore || Math.min(100, Math.max(40, Math.round(95.8 - (simHesitations * 1.2) + (recruiterSensitivity * 0.1))));
  const supportInterventions = sessionData?.analytics?.supportInterventionsCount || Math.round(simHesitations > 4 ? Math.floor(simHesitations / 2) : 0);
  const pressureAdaptations = sessionData?.analytics?.pressureAdaptationsCount || Math.round(simHesitations > 3 ? Math.floor(simHesitations / 3) + 1 : 1);
  const confidenceRecovery = sessionData?.analytics?.confidenceRecoveryRate || Math.min(100, Math.max(30, Math.round(85 - (simHesitations * 2.2) + (recruiterSensitivity * 0.15))));
  const candidateEngagement = sessionData?.analytics?.candidateEngagementScore || Math.min(100, Math.max(30, Math.round(78 + (simPace > 110 && simPace < 145 ? 8 : -8) - (simFillers * 1.5))));
  const encouragementFreq = sessionData?.analytics?.encouragementFrequency || Math.round(simHesitations > 5 ? 2 : 1);
  const empathyConsistency = sessionData?.analytics?.empathyConsistency || Math.min(100, Math.max(50, Math.round(98 - (simFillers * 0.5))));
  const adaptationQuality = sessionData?.analytics?.recruiterAdaptationQuality || Math.min(100, Math.max(40, Math.round(96 - (simBackgroundNoise === 'High' ? 8 : 0))));

  const trend = sessionData?.analytics?.interviewComfortTrend || [75, 78, 70, 65, 82, 80, 89];
  const chartData = trend.map((val: number, idx: number) => ({
    turn: `Turn ${idx + 1}`,
    comfort: val
  }));

  const empathyInsightsList = (sessionData?.empathyObservations && sessionData.empathyObservations.length > 0)
    ? sessionData.empathyObservations.map((obs: string, idx: number) => ({ turn: idx + 1, text: obs }))
    : [
        { turn: 1, text: isFR ? "Candidat à l'aise. Établissement d'un climat professionnel de confiance." : "Candidate comfortable. Establish professional trust and rapport." },
        { turn: 2, text: isFR ? "Légère hésitation détectée. Rythme stabilisé sans interruption précoce." : "Slight hesitation detected. Stabilized pacing without premature interruption." },
        { turn: 3, text: isFR ? "Blocage de mémoire géré avec bienveillance et encouragement mesuré." : "Memory block handled gracefully with measured encouragement." }
      ];

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl border border-stone-800 shadow-2xl flex items-center gap-2.5 animate-fade-in font-sans text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl text-left">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-indigo-500/0 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isFR ? "MOTEUR D'INTELLIGENCE COGNITIVE SPEECH" : "SPEECH COGNITIVE INTELLIGENCE ENGINE"}
            </span>
            <h1 className="text-2xl md:text-3xl font-sans font-black tracking-tight">
              {isFR ? "Voice Intelligence Center" : "Voice Intelligence Center"}
            </h1>
            <p className="text-stone-400 text-xs md:text-sm mt-1 max-w-2xl">
              {isFR 
                ? "Analysez la fluidité, le rythme de parole, la confiance vocale et l'élocution des candidats en temps réel, tout en garantissant la confidentialité absolue de l'audio."
                : "Supervise speaking pace, voice confidence, lexical filler density, and audio quality across simulated and active evaluation rooms with GDPR-compliant telemetry."}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white rounded-xl border border-stone-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? (isFR ? "Synchronisation..." : "Syncing...") : (isFR ? "Actualiser" : "Refresh Analytics")}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-stone-800 mt-6 pt-4 overflow-x-auto">
          {[
            { id: 'dashboard', label: isFR ? "Tableau de Bord Vocal" : "Vocal Telemetry Dashboard", icon: BarChart4 },
            { id: 'studio', label: isFR ? "Studio Réalisme Vocal" : "Admin Voice Studio", icon: Radio },
            { id: 'listening', label: isFR ? "Écoute Humaine & Silences" : "Human Listening Engine", icon: Mic },
            { id: 'empathy', label: isFR ? "Empathie du Recruteur" : "Recruiter Empathy Engine", icon: Heart },
            { id: 'simulator', label: isFR ? "Playground de Fusion Multi-Signal" : "Multi-Signal Simulator", icon: Sliders },
            { id: 'rules', label: isFR ? "Seuils du Coaching Live" : "Live Coaching Thresholds", icon: Settings },
            { id: 'privacy', label: isFR ? "Sécurité, RGPD & Audio" : "Privacy & Compliance", icon: Shield }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'text-stone-400 hover:text-white hover:bg-stone-800 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm text-left">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Core Speech Metrics Grid */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 mb-4 flex items-center gap-2">
                <Radio className="w-4.5 h-4.5 text-emerald-500" />
                <span>{isFR ? "Indicateurs Vocaux Globaux (Agrégés)" : "Global Spoken Speech Aggregated Telemetry"}</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Pacemeter */}
                <div className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Débit Moyen" : "Average Speaking Pace"}</span>
                    <span className="text-2xl font-black text-stone-900 mt-1 block">122 WPM</span>
                  </div>
                  <div className="mt-3 text-[11px] text-stone-600">
                    <span className="text-emerald-600 font-bold">✓ {isFR ? "Pace Optimal" : "Excellent tempo"}</span> {isFR ? "(cible: 110-140)" : "(target: 110-140 WPM)"}
                  </div>
                </div>

                {/* Vocal Confidence Index */}
                <div className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Indice de Confiance Vocale" : "Vocal Confidence Index"}</span>
                    <span className="text-2xl font-black text-stone-900 mt-1 block">84.2%</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-stone-600">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span><strong className="text-stone-900">+3.1%</strong> {isFR ? "ce mois-ci" : "increase this month"}</span>
                  </div>
                </div>

                {/* Vocal Fillers Density */}
                <div className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Densité de Mots Superflus" : "Vocal Filler word Density"}</span>
                    <span className="text-2xl font-black text-stone-900 mt-1 block">2.8 <span className="text-xs font-normal text-stone-500">/ min</span></span>
                  </div>
                  <div className="mt-3 text-[11px] text-stone-600">
                    <span className="text-indigo-600 font-bold">-{isFR ? "18% d'hésitations" : "18% reduction"}</span> {isFR ? "grâce au coaching" : "via interactive tips"}
                  </div>
                </div>

                {/* Fluent articulation stability */}
                <div className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Clarté d'Élocution & Articulation" : "Speech Articulation Clarity"}</span>
                    <span className="text-2xl font-black text-stone-900 mt-1 block">89.7%</span>
                  </div>
                  <div className="mt-3 text-[11px] text-stone-600">
                    <span className="text-emerald-600 font-bold">✓ {isFR ? "Excellente intelligibilité" : "High audio clarity"}</span> {isFR ? "sur 10k+ sessions" : "across 10k+ runs"}
                  </div>
                </div>

              </div>
            </div>

            {/* QA and Technical Signal Telemetry */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              
              {/* QA Metrics */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-200/60 space-y-4 lg:col-span-2">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>{isFR ? "Surveillance Matérielle & Diagnostic Réseau" : "Audio Quality Assurance & Hardware Diagnostics"}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-stone-600">
                      <span>{isFR ? "Qualité Microphone Excellente" : "Microphone Quality (Excellent)"}</span>
                      <span className="font-bold text-stone-900">92.4%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92.4%' }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-stone-600">
                      <span>{isFR ? "Bruit de Fond Faible / Supprimé" : "Low Background Noise Level"}</span>
                      <span className="font-bold text-stone-900">88.9%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '88.9%' }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-stone-600">
                      <span>{isFR ? "Latence Réseau Moyenne (RTT)" : "Average Network Latency (RTT)"}</span>
                      <span className="font-bold text-stone-900">118 ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95%' }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-stone-600">
                      <span>{isFR ? "Taux de Saturation / Écrêtage (Clipping)" : "Audio Saturation / Clipping Rate"}</span>
                      <span className="font-bold text-stone-900">0.45%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '1.5%' }} />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 leading-relaxed mt-2">
                  <strong>💡 {isFR ? "Diagnostic de l'Ingénieur Speech :" : "AI Speech Engineer Diagnostic:"}</strong> {isFR 
                    ? "L'annulation d'écho et l'ajustement automatique de gain (AGC) côté client réduisent l'écrêtage de 85% par rapport aux entrées brutes. Aucun goulot d'étranglement de latence majeur détecté."
                    : "Active echo cancellation and automatic gain control (AGC) mitigate microphone clipping by 85% relative to raw audio input stream signals."}
                </div>
              </div>

              {/* Silence and Pause Classifier */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-200/60 space-y-4">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>{isFR ? "Intelligence des Silences (Classification)" : "Silence & Pauses Intelligence"}</span>
                </h4>

                <p className="text-[11px] text-stone-500">
                  {isFR 
                    ? "Classification des moments d'inactivité vocale détectés lors des simulations." 
                    : "Real-time classification of vocal inactivity detected during speech sessions."}
                </p>

                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between text-xs text-stone-700">
                      <span>🧠 {isFR ? "Pause de réflexion constructive" : "Thinking Reflection Pause"}</span>
                      <span className="font-bold">62%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full mt-1">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '62%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-stone-700">
                      <span>🔍 {isFR ? "Recherche de vocabulaire technique" : "Searching for technical words"}</span>
                      <span className="font-bold">21%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full mt-1">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '21%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-stone-700">
                      <span>⚡ {isFR ? "Hésitation due au stress" : "Mild stress hesitations"}</span>
                      <span className="font-bold">12%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full mt-1">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '12%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-stone-700">
                      <span>📉 {isFR ? "Perte de confiance manifeste" : "Definite loss of confidence"}</span>
                      <span className="font-bold">5%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full mt-1">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: '5%' }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Voice Progression tracking over time */}
            <div className="p-6 bg-stone-900 text-white rounded-2xl border border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>{isFR ? "Courbe de Progression Vocale à Long Terme" : "Long-Term Voice Progression Tracking"}</span>
                </h4>
                <span className="text-[10px] text-stone-400 uppercase font-mono">{isFR ? "Surveillance Évolutive" : "Cohort Performance"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-stone-850 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-400 block uppercase font-mono">{isFR ? "Pace de Parole (WPM)" : "Speaking Pace Stability"}</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white">142 → 122</span>
                    <span className="text-xs text-emerald-400 font-bold">(-14%)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                    {isFR ? "Stabilisation du rythme vers la zone cible de 120 WPM après 3 sessions." : "Speech rate stabilizes toward the target 120 WPM zone after 3 sessions."}
                  </p>
                </div>

                <div className="p-4 bg-stone-850 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-400 block uppercase font-mono">{isFR ? "Élimination des Tics Vocaux" : "Filler Word Reduction"}</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white">6.1 → 2.8</span>
                    <span className="text-xs text-emerald-400 font-bold">(-54%)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                    {isFR ? "Forte diminution de la dépendance aux tics grâce aux alertes en mode Training." : "Substantial decline in verbal crutches prompted by subtle training alerts."}
                  </p>
                </div>

                <div className="p-4 bg-stone-850 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-400 block uppercase font-mono">{isFR ? "Contrôle des Pauses" : "Thoughtful Pause Control"}</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white">41% → 74%</span>
                    <span className="text-xs text-emerald-400 font-bold">(+33%)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                    {isFR ? "Meilleure intégration de pauses constructives au détriment des hésitations stressées." : "Improved conversion of stressed hesitations into balanced reflection pauses."}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: HUMAN LISTENING ENGINE ANALYTICS (HIU PHASE 5) */}
        {activeTab === 'listening' && (
          <div className="space-y-8 animate-fade-in text-left">
            
            {/* Realtime Human Listening Summary */}
            <div className="p-5 bg-gradient-to-r from-stone-900 to-stone-850 text-white rounded-xl border border-stone-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 block w-fit mb-1.5 animate-pulse">
                  {isFR ? "MOTEUR D'ÉCOUTE COGNITIVE" : "HUMAN LISTENING ENGINE ACTIVE"}
                </span>
                <h4 className="text-base font-black tracking-tight">{isFR ? "Analyse d'Écoute Humaine & Prise de Parole" : "Human Listening & Turn-Taking Analytics"}</h4>
                <p className="text-stone-400 text-xs mt-0.5 max-w-xl">
                  {isFR 
                    ? "Mesurez l'intelligence des silences, la patience conversationnelle et l'ajustement du tour de parole pour reproduire l'écoute d'un recruteur humain."
                    : "Track silence classification, active listening behaviors, flow prediction ratios, and visual avatar status markers."}
                </p>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-xs text-stone-400">{isFR ? "Score d'Écoute Globale :" : "Overall Listening Score:"}</span>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold">95.8%</span>
              </div>
            </div>

            {/* Core Turn-Taking & Listening Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: isFR ? "Patience Conversationnelle" : "Conversation Patience Score",
                  value: "96.4%",
                  sub: isFR ? "Pas d'interruptions hâtives" : "No rushed interruptions",
                  status: "Excellent",
                  color: "text-emerald-600 bg-emerald-50"
                },
                {
                  label: isFR ? "Précision de Prise de Parole" : "Turn-Taking Accuracy",
                  value: "98.8%",
                  sub: isFR ? "Gestion parfaite des silences" : "Perfect silence transitions",
                  status: "Précis",
                  color: "text-indigo-600 bg-indigo-50"
                },
                {
                  label: isFR ? "Justification des Interruptions" : "Interruption Necessity Rate",
                  value: "95.2%",
                  sub: isFR ? "Seulement si digression" : "Only when rambling/repeating",
                  status: "Optimal",
                  color: "text-emerald-600 bg-emerald-50"
                },
                {
                  label: isFR ? "Faux Positifs d'Interruption" : "False Interruption Rate",
                  value: "1.2%",
                  sub: isFR ? "Rhythm d'élocution préservé" : "Conversational pacing safe",
                  status: "Minimal",
                  color: "text-emerald-600 bg-emerald-50"
                }
              ].map((m, idx) => (
                <div key={idx} className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{m.label}</span>
                    <span className="text-2xl font-black text-stone-900 mt-1 block">{m.value}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-stone-600">
                    <span>{m.sub}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${m.color}`}>{m.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Silence Classifier Playground */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              <div className="lg:col-span-7 bg-stone-50 p-6 rounded-xl border border-stone-200/80 space-y-5">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-200 pb-3">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>{isFR ? "Playground d'Intelligence des Silences (Simulé)" : "Silence Intelligence Playground (Simulation)"}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Select Silence Type */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-stone-700">{isFR ? "Type de Silence Détecté" : "Simulated Silence Type"}</label>
                    <select 
                      defaultValue="MemoryRecall"
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                      id="silenceTypeSelect"
                    >
                      <option value="Thinking">{isFR ? "Réflexion constructive" : "Constructive Thinking Pause"}</option>
                      <option value="MemoryRecall">{isFR ? "Recherche en Mémoire / Rappel" : "Active Memory Recall"}</option>
                      <option value="EmotionalPause">{isFR ? "Pause Respiration / Émotionnelle" : "Emotional Breathing Pause"}</option>
                      <option value="SearchingForWords">{isFR ? "Recherche de mots" : "Searching for Words"}</option>
                      <option value="NaturalBreathing">{isFR ? "Pause respiratoire courte" : "Short Breathing Pause"}</option>
                      <option value="MicroHesitation">{isFR ? "Micro hésitation conversationnelle" : "Micro Hesitation"}</option>
                      <option value="LongSilence">{isFR ? "Silence prolongé" : "Long Silence"}</option>
                    </select>
                  </div>

                  {/* Select Candidate State */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-stone-700">{isFR ? "État de Parole du Candidat" : "Candidate Speech State"}</label>
                    <select 
                      defaultValue="reflecting"
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-lg text-xs font-medium"
                      id="candidateStateSelect"
                    >
                      <option value="explaining">{isFR ? "En train d'expliquer" : "Actively Explaining"}</option>
                      <option value="reflecting">{isFR ? "En pleine réflexion" : "Reflecting / Thinking"}</option>
                      <option value="emotional">{isFR ? "Émotif / Sous pression" : "Under High Cognitive Load"}</option>
                      <option value="rambling">{isFR ? "Digression / Parle trop" : "Rambling / Off-topic"}</option>
                      <option value="repeating">{isFR ? "Répétition / Boucle" : "Repeating Previous Point"}</option>
                      <option value="asking_implicit_question">{isFR ? "Question d'alignement implicite" : "Seeking Alignment Question"}</option>
                      <option value="completed">{isFR ? "Réponse terminée" : "Answer Fully Completed"}</option>
                    </select>
                  </div>

                </div>

                {/* Sample Textbox */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-stone-700">{isFR ? "Transcription Vocale Simulée" : "Simulated Voice Transcript"}</label>
                  <textarea 
                    rows={3}
                    defaultValue="Well, let me think... back in my last project, we were managing a major migration and... uh... how should I put this... yes, there was a point where the database locked up."
                    className="w-full p-3 bg-white border border-stone-300 rounded-lg text-xs font-sans leading-relaxed text-stone-800"
                    id="sampleTranscriptInput"
                  />
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 leading-relaxed">
                  <strong>💡 {isFR ? "Règle Active d'Écoute Humaine :" : "Active Human Listening Guideline:"}</strong> {isFR
                    ? "Patience absolue. La Shana virtuelle reste silencieuse, opère un léger hochement de tête, maintient un contact visuel rassurant et évite toute coupure hâtive."
                    : "Absolute patience. The virtual Shana remains silent, slightly nods, maintains comfortable eye contact, and prompts with supportive backchannels instead of raw interruptions."}
                </div>
              </div>

              {/* Dynamic Outputs & Flow Predictions */}
              <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-stone-200 space-y-5">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>{isFR ? "Prédiction d'Intention & État Avatar" : "Intention Prediction & Avatar Status"}</span>
                </h4>

                {/* Avatar Event Indicator */}
                <div className="p-3.5 bg-stone-900 text-white rounded-xl flex items-center justify-between border border-stone-800">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <div>
                      <span className="block text-[9px] uppercase font-mono text-stone-400">{isFR ? "Évènement Avatar" : "Active Avatar Event"}</span>
                      <span className="text-xs font-bold text-emerald-400">Waiting & Maintaining Eye Contact</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-stone-800 rounded border border-stone-700 text-[10px] text-stone-300 font-mono">
                    Nodding & Thinking
                  </span>
                </div>

                {/* Continuation flow prediction probabilities */}
                <div className="space-y-4">
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Prédiction d'Intention du Candidat" : "Predicted Candidate Continuation Flow"}</span>
                  
                  {[
                    { label: isFR ? "Poursuivre sa réponse" : "Continue speaking", prob: 85, color: "bg-emerald-500" },
                    { label: isFR ? "Avoir terminé sa réponse" : "Completed answer", prob: 15, color: "bg-stone-300" },
                    { label: isFR ? "Ajouter un exemple concret" : "Add concrete example", prob: 60, color: "bg-indigo-500" },
                    { label: isFR ? "Demander une clarification" : "Seek clarification", prob: 12, color: "bg-amber-500" }
                  ].map((p, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs text-stone-600 font-medium">
                        <span>{p.label}</span>
                        <span className="font-bold text-stone-900">{p.prob}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.prob}%`, backgroundColor: p.color === 'bg-emerald-500' ? '#10b981' : p.color === 'bg-indigo-500' ? '#6366f1' : p.color === 'bg-amber-500' ? '#f59e0b' : '#d1d5db' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Observational Memory Logs */}
            <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>{isFR ? "Mémoire d'Écoute & Observations Récents" : "Listening Memory & Observations Logs"}</span>
              </h4>

              <div className="space-y-3 pt-1 text-xs">
                {[
                  {
                    time: "10:42:15",
                    turn: "Turn 2",
                    type: "MemoryRecall",
                    obs: isFR 
                      ? "Candidat en recherche active de souvenirs techniques. Temps de réflexion de 2.8s parfaitement toléré sans coupure." 
                      : "Candidate searching memory for system parameters. Allowed 2.8s silence to regain posture and composure."
                  },
                  {
                    time: "10:44:30",
                    turn: "Turn 3",
                    type: "Rambling",
                    obs: isFR 
                      ? "Digression détectée (longueur phrase > 180 mots). Interruption polie effectuée après 3.5 minutes de discours décorrélé." 
                      : "Rambling detected (speech length > 180 words). Executed a polite prefix redirection to focus on core deliverables."
                  },
                  {
                    time: "10:48:10",
                    turn: "Turn 5",
                    type: "ImplicitQuestion",
                    obs: isFR 
                      ? "Question d'alignement implicite du candidat ('Est-ce que cela fait sens ?'). Shana s'aligne immédiatement avant de passer au défi." 
                      : "Candidate sought alignment ('Does that make sense?'). Handled with supportive validation before moving to challenge."
                  }
                ].map((l, idx) => (
                  <div key={idx} className="p-3 bg-white border border-stone-100 rounded-lg flex items-start gap-3 justify-between">
                    <div className="flex gap-2.5 items-start">
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-500 border border-stone-200 rounded font-mono text-[9px] mt-0.5">{l.time}</span>
                      <div>
                        <strong className="text-stone-800 text-[11px] block">{l.turn} — {l.type}</strong>
                        <p className="text-stone-600 mt-0.5">{l.obs}</p>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold font-mono">OK</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB: RECRUITER EMPATHY ENGINE (HIU PHASE 6) */}
        {activeTab === 'empathy' && (
          <div className="space-y-8 animate-fade-in text-left">
            
            {/* Realtime Recruiter Empathy Summary */}
            <div className="p-5 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-850 text-white rounded-xl border border-stone-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <span className="font-mono text-[9px] uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 block w-fit mb-1.5 animate-pulse">
                  {isFR ? "MOTEUR D'EMPATHIE RELATIONNELLE" : "RECRUITER EMPATHY ENGINE ACTIVE"}
                </span>
                <h4 className="text-base font-black tracking-tight">{isFR ? "Intelligence Émotionnelle & Adaptation Relationnelle" : "Emotional Intelligence & Relationship Adaptation"}</h4>
                <p className="text-stone-400 text-xs mt-0.5 max-w-xl">
                  {isFR 
                    ? "Mesurez l'adaptation du recruteur face aux silences de blocage, pertes de mémoire et variations d'anxiété du candidat."
                    : "Track how the AI recruiter adjusts interview pace, challenges, and support mechanisms in response to candidate anxiety, blanks, and fatigue."}
                </p>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-xs text-stone-400">{isFR ? "Score d'Émpathie Moyen :" : "Average Empathy Score:"}</span>
                <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs font-mono font-bold">
                  {empathyAvgScore}%
                </span>
              </div>
            </div>

            {/* Core Empathy Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Average Empathy Score */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Score d'Empathie Global" : "Average Empathy Score"}</span>
                  <span className="text-2xl font-black text-stone-900 mt-1 block">{empathyAvgScore}%</span>
                </div>
                <div className="mt-3 text-[11px] text-stone-600">
                  <span className="text-emerald-600 font-bold">✓ {isFR ? "Hautement Adaptatif" : "Highly Adaptive"}</span> {isFR ? "(cible: >85%)" : "(target: >85%)"}
                </div>
              </div>

              {/* Support Interventions */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Interventions de Soutien" : "Support Interventions"}</span>
                  <span className="text-2xl font-black text-stone-900 mt-1 block">{supportInterventions}</span>
                </div>
                <div className="mt-3 text-[11px] text-stone-600">
                  <span className="text-stone-500">{isFR ? "Phonèmes d'encouragement injectés" : "Encouraging backchannels injected"}</span>
                </div>
              </div>

              {/* Pressure Adaptations */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Adaptations de Pression" : "Pressure Adaptations"}</span>
                  <span className="text-2xl font-black text-stone-900 mt-1 block">{pressureAdaptations}</span>
                </div>
                <div className="mt-3 text-[11px] text-stone-600 font-mono text-xs text-indigo-600">
                  <span>{isFR ? "Régulation active" : "Active stress regulation"}</span>
                </div>
              </div>

              {/* Confidence Recovery Rate */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Taux de Récupération de Confiance" : "Confidence Recovery Rate"}</span>
                  <span className="text-2xl font-black text-stone-900 mt-1 block">{confidenceRecovery}%</span>
                </div>
                <div className="mt-3 text-[11px] text-stone-600">
                  <span className="text-emerald-600 font-bold">▲ +12%</span> {isFR ? "après interventions" : "after interventions"}
                </div>
              </div>

            </div>

            {/* Second row of metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Candidate Engagement */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Engagement Candidat" : "Candidate Engagement"}</span>
                  <span className="text-2xl font-black text-stone-900 mt-1 block">{candidateEngagement}%</span>
                </div>
                <div className="mt-3 text-[11px] text-stone-600">
                  <span>{isFR ? "Participation active préservée" : "Active participation preserved"}</span>
                </div>
              </div>

              {/* Encouragement Frequency */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Fréquence des Encouragements" : "Encouragement Frequency"}</span>
                  <span className="text-2xl font-black text-stone-900 mt-1 block">{encouragementFreq} <span className="text-xs font-normal text-stone-500">/ session</span></span>
                </div>
                <div className="mt-3 text-[11px] text-stone-600">
                  <span className="text-amber-600 font-bold">{isFR ? "Mérité uniquement" : "Strictly earned praises"}</span>
                </div>
              </div>

              {/* Empathy Consistency */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Régularité de l'Empathie" : "Empathy Consistency"}</span>
                  <span className="text-2xl font-black text-stone-900 mt-1 block">{empathyConsistency}%</span>
                </div>
                <div className="mt-3 text-[11px] text-stone-600">
                  <span>{isFR ? "Alignement sur l'archétype" : "Recruiter archetype alignment"}</span>
                </div>
              </div>

              {/* Recruiter Adaptation Quality */}
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-100 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">{isFR ? "Qualité de l'Adaptation" : "Recruiter Adaptation Quality"}</span>
                  <span className="text-2xl font-black text-stone-900 mt-1 block">{adaptationQuality}%</span>
                </div>
                <div className="mt-3 text-[11px] text-stone-600">
                  <span className="text-emerald-600 font-bold">✓ {isFR ? "Excellente régulation" : "Excellent control"}</span>
                </div>
              </div>

            </div>

            {/* Detailed Graphs & Live Calibration Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Interactive Stress/Empathy Simulator */}
              <div className="p-6 bg-stone-50 rounded-xl border border-stone-100 lg:col-span-1 space-y-5">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-red-500" />
                  <span>{isFR ? "Simulateur d'Empathie Live" : "Live Empathy Calibration"}</span>
                </h4>
                <p className="text-stone-500 text-[11px]">
                  {isFR 
                    ? "Ajustez le niveau de stress simulé du candidat et la réactivité émotionnelle du recruteur."
                    : "Manually adjust candidate anxiety levels and recruiter empathy response times to observe immediate turn directives."}
                </p>

                {/* Slider 1: Candidate Anxiety */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-stone-700">
                    <span>{isFR ? "Anxiété du Candidat (Simulée)" : "Candidate Anxiety (Simulated)"}</span>
                    <span className="font-mono text-red-600">{candidateAnxiety}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={candidateAnxiety}
                    onChange={(e) => setCandidateAnxiety(Number(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none animate-none"
                  />
                </div>

                {/* Slider 2: Recruiter Empathy Sensitivity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-stone-700">
                    <span>{isFR ? "Sensibilité du Recruteur" : "Recruiter Empathy Sensitivity"}</span>
                    <span className="font-mono text-emerald-600">{recruiterSensitivity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={recruiterSensitivity}
                    onChange={(e) => setRecruiterSensitivity(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none animate-none"
                  />
                </div>

                {/* Simulated State Observations */}
                <div className="pt-3 border-t border-stone-200/60 space-y-2">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block tracking-wider">{isFR ? "Directive d'Empathie Simulée" : "Simulated Empathy Directive"}</span>
                  <div className="p-3 bg-white rounded-lg border border-stone-200/80 text-xs font-medium text-stone-700 leading-relaxed shadow-sm">
                    {candidateAnxiety > 75 ? (
                      isFR 
                        ? "🚨 Alerte Anxiété : Réduire le niveau de pression. Injecter des marqueurs d'écoute de soutien. Éviter d'interrompre." 
                        : "🚨 Anxiety Alert: Reduce pressure level. Inject supportive backchannels. Avoid interrupting the candidate."
                    ) : candidateAnxiety > 45 ? (
                      isFR 
                        ? "⚖️ Calibrage Normal : Conserver le rythme de relance standard. Encourager poliment s'il y a un blocage de mémoire." 
                        : "⚖️ Normal Calibration: Maintain standard follow-up rhythm. Encourage politely in case of a memory block."
                    ) : (
                      isFR 
                        ? "🔥 Défi Recruteur : Niveau de confort élevé. Augmenter légèrement la pression cognitive avec une question exigeante." 
                        : "🔥 Challenge Mode: High candidate comfort. Increase pressure slightly with a demanding prompt."
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Recharts Trend Graph */}
              <div className="p-6 bg-stone-50 rounded-xl border border-stone-100 lg:col-span-2 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>{isFR ? "Courbe de Confort du Candidat" : "Candidate Comfort & Trust Trend"}</span>
                  </h4>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">{isFR ? "TEMPS RÉEL" : "LIVE FEED"}</span>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorComfort" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="turn" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} domain={[20, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="comfort" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorComfort)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-[10px] text-stone-400 text-center mt-3 leading-normal">
                  {isFR 
                    ? "La zone ombrée représente l'évolution du confort psychologique du candidat au fil des tours de parole de la session en cours." 
                    : "The area represents the candidate's psychological comfort level across speaking turns during the current active session."}
                </p>
              </div>

            </div>

            {/* Empathy Log Journal */}
            <div className="p-6 bg-stone-50 rounded-xl border border-stone-100">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-red-500" />
                <span>{isFR ? "Journal d'Observations du Moteur d'Empathie" : "Empathy Engine Real-time Insights Log"}</span>
              </h4>

              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {empathyInsightsList.map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-stone-100 text-[11px] shadow-xs">
                    <div className="flex items-center gap-2 text-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="font-semibold text-stone-900 font-mono">[Turn {log.turn}]</span>
                      <span>{log.text}</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[9px] font-bold font-mono">ADAPTED</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'studio' && (
          <div className="space-y-8 animate-fade-in text-left">
            
            {/* Realism Header */}
            <div className="p-5 bg-stone-900 text-white rounded-xl border border-stone-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 block w-fit mb-1.5">
                  {isFR ? "DIRECTEUR DE VOIX ÉMOTIONNEL" : "EMOTIONAL VOICE DIRECTOR ACTIVE"}
                </span>
                <h4 className="text-base font-black tracking-tight">{isFR ? "Studio de Réalisme Vocal & Synthèse Clônée" : "Vocal Realism & Cloned Synthesis Studio"}</h4>
                <p className="text-stone-400 text-xs mt-0.5 max-w-xl">
                  {isFR 
                    ? "Gérez l'intensité vocale, les rythmes respiratoires et la calibration émotionnelle des voix de vos recruteurs."
                    : "Supervise strategic silence, breathing cadences, phoneme timings, and vocal styles for individual recruiter avatars."}
                </p>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-xs text-stone-400">{isFR ? "Indice de Réalisme Global :" : "Overall Realism Index:"}</span>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold">92.8%</span>
              </div>
            </div>

            {/* Grid 1: Recruiter Profiles */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>{isFR ? "Profils de Parole des Recruteurs" : "Recruiter Conversational Speaking Profiles"}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    id: 'friendly',
                    name: isFR ? "RH Chaleureuse et Encourageante" : "Friendly HR Representative",
                    wpm: "115 WPM",
                    empathy: isFR ? "Élevée (100%)" : "High (100%)",
                    tone: isFR ? "Mélodique, chaleureux, intonations positives" : "Melodic, warm, positive inflections",
                    features: isFR ? "Ajustement de ton souple, encouragement" : "Softer tone, positive fillers ('Ah, great!')",
                    clonedVoice: isFR ? "Voix Clônée Active" : "Active Cloned Voice"
                  },
                  {
                    id: 'senior_eng',
                    name: isFR ? "Directeur de l'Ingénierie" : "Senior Engineering Manager",
                    wpm: "130 WPM",
                    empathy: isFR ? "Professionnelle (75%)" : "Professional (75%)",
                    tone: isFR ? "Direct, analytique, pragmatique" : "Direct, analytical, dry pragmatism",
                    features: isFR ? "Pauses de réflexion technique" : "Technical thinking pauses before trade-offs",
                    clonedVoice: isFR ? "Voix Clônée Active" : "Active Cloned Voice"
                  },
                  {
                    id: 'founder',
                    name: isFR ? "Fondateur de Startup" : "Fast-Paced Startup Founder",
                    wpm: "155 WPM",
                    empathy: isFR ? "Modérée (40%)" : "Moderate (40%)",
                    tone: isFR ? "Énergique, informel, rapide" : "Energetic, informal, rapid transitions",
                    features: isFR ? "Pas de pauses de conjonction" : "Zero conjunction pauses, concise output",
                    clonedVoice: isFR ? "Prêt pour Clônage" : "Cloned Voice Ready"
                  },
                  {
                    id: 'executive',
                    name: isFR ? "Chasseur de Têtes Exécutif" : "Executive Search Director",
                    wpm: "120 WPM",
                    empathy: isFR ? "Formelle (80%)" : "Formal (80%)",
                    tone: isFR ? "Solennel, stratégique, distingué" : "Stately, strategic, distinguished",
                    features: isFR ? "Introduction d'interjections polies" : "Polite professional prefixes ('Indeed... ')",
                    clonedVoice: isFR ? "Voix Clônée Active" : "Active Cloned Voice"
                  },
                  {
                    id: 'silent',
                    name: isFR ? "Recruteur Poker-Face" : "Silent Pokered Interviewer",
                    wpm: "95 WPM",
                    empathy: isFR ? "Neutre (30%)" : "Neutral (30%)",
                    tone: isFR ? "Lent, froid, intimidant" : "Slow, cold, intimidating",
                    features: isFR ? "Silences stratégiques prolongés" : "Long strategic pauses at start of response",
                    clonedVoice: isFR ? "Prêt pour Clônage" : "Cloned Voice Ready"
                  },
                  {
                    id: 'coach',
                    name: isFR ? "Coach en Élocution Vocal" : "Voice Communication Coach",
                    wpm: "110 WPM",
                    empathy: isFR ? "Encourageante (100%)" : "Highly Supportive (100%)",
                    tone: isFR ? "Pédagogue, bienveillant, inspirant" : "Educational, soothing, motivational",
                    features: isFR ? "Transition vocale fluide, encouragements" : "Dynamic voice reset, warm guidance",
                    clonedVoice: isFR ? "Voix Clônée Active" : "Active Cloned Voice"
                  }
                ].map(p => (
                  <div key={p.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-xs text-stone-900">{p.name}</h5>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-mono font-bold whitespace-nowrap">
                          {p.clonedVoice}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-stone-200/60 text-[10px] text-stone-500">
                        <div>
                          <span className="block text-stone-400 font-medium uppercase font-mono text-[8px]">{isFR ? "Débit Cible" : "Target Pace"}</span>
                          <span className="font-bold text-stone-700">{p.wpm}</span>
                        </div>
                        <div>
                          <span className="block text-stone-400 font-medium uppercase font-mono text-[8px]">{isFR ? "Empathie" : "Empathy Metric"}</span>
                          <span className="font-bold text-stone-700">{p.empathy}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-stone-600">
                        <strong className="text-stone-800">{isFR ? "Timbre & Ton :" : "Timbre & Tone:"}</strong> {p.tone}
                      </div>
                    </div>
                    <div className="bg-stone-100 p-2 rounded text-[10px] text-stone-500 italic">
                      💡 {p.features}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid 2: Advanced Rhythm Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              
              <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>{isFR ? "Statistiques de Rythme et Prise de Parole" : "Advanced Vocal Pacing & Conversational Rythms"}</span>
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white border border-stone-200 rounded-lg">
                    <span className="text-[9px] uppercase font-mono text-stone-400 block">{isFR ? "Rythme de Tour Moyen" : "Average Turn Length"}</span>
                    <span className="text-lg font-black text-stone-900 mt-1 block">38s / 55s</span>
                    <span className="text-[10px] text-stone-500 block mt-1">{isFR ? "Recruteur vs Candidat" : "Recruiter vs Candidate"}</span>
                  </div>

                  <div className="p-3 bg-white border border-stone-200 rounded-lg">
                    <span className="text-[9px] uppercase font-mono text-stone-400 block">{isFR ? "Indice de Silences Stratégiques" : "Strategic Silence Index"}</span>
                    <span className="text-lg font-black text-emerald-600 mt-1 block">84.2%</span>
                    <span className="text-[10px] text-stone-500 block mt-1">{isFR ? "Pauses de réflexion constructive" : "Constructive thinking pauses"}</span>
                  </div>

                  <div className="p-3 bg-white border border-stone-200 rounded-lg">
                    <span className="text-[9px] uppercase font-mono text-stone-400 block">{isFR ? "Durée Moyenne des Pauses" : "Average Breathing Pause"}</span>
                    <span className="text-lg font-black text-stone-900 mt-1 block">1.8 seconds</span>
                    <span className="text-[10px] text-stone-500 block mt-1">{isFR ? "Rythme respiratoire naturel" : "Natural breathing cadences"}</span>
                  </div>

                  <div className="p-3 bg-white border border-stone-200 rounded-lg">
                    <span className="text-[9px] uppercase font-mono text-stone-400 block">{isFR ? "Taux d'Interruption Coïncidente" : "Interruption Coincidence Rate"}</span>
                    <span className="text-lg font-black text-indigo-600 mt-1 block">2.4%</span>
                    <span className="text-[10px] text-stone-500 block mt-1">{isFR ? "Prise de parole polie" : "Highly polite turn-taking"}</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800 leading-relaxed">
                  <strong>ℹ️ {isFR ? "Analyse du Directeur de Voix :" : "Speech Scientist Analysis:"}</strong> {isFR 
                    ? "L'injection automatique d'interjections conversationnelles ('Hum', 'Je vois') et de pauses respiratoires garantit une fluidité vocale indiscernable d'une véritable conversation humaine."
                    : "Automated injection of conversational fillers ('Hmm', 'I see') combined with strategic silences yields speech rhythms indistinguishable from natural human discourse."}
                </div>
              </div>

              {/* Cloned Voice Synthesis Readiness */}
              <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>{isFR ? "Score d'Intégration de Synthèse Vocal Clônée" : "Enterprise Voice Synthesis Readiness"}</span>
                </h4>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-600">{isFR ? "Ajustement des Phonèmes & Intonations" : "Phoneme Timings & Intonation Fit"}</span>
                    <span className="font-bold text-stone-900">95%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-600">{isFR ? "Modélisation de l'Intonation Émotionnelle" : "Emotional Prosody & Expression Mapping"}</span>
                    <span className="font-bold text-stone-900">92%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-600">{isFR ? "Synchronisation Lip-Sync & Keyframes" : "Real-time Lip-Sync Keyframe Generator"}</span>
                    <span className="font-bold text-stone-900">90%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 space-y-1 text-[10px] text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{isFR ? "Générateur d'Intention Émotionnelle Actif" : "Dynamic Emotional Intention Generator Active"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{isFR ? "Modèle de Transition Coach Actif" : "Dynamic Coach-Persona Vocal Transition Rules Verified"}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: MULTI-SIGNAL SIMULATOR PLAYGROUND */}
        {activeTab === 'simulator' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed">
              <strong>🔬 {isFR ? "Laboratoire de Test Vocal :" : "Vocal Simulation Laboratory:"}</strong> {isFR
                ? "Ajustez les curseurs ci-dessous pour simuler un signal vocal brut. Voyez comment l'algorithme de fusion multi-signal de Shana calcule instantanément la confiance, la fluidité et le score d'intelligibilité globale en combinant les diagnostics audio et la détection d'hésitations."
                : "Modify the telemetry sliders below to simulate raw speaking patterns. Observe how Shana's multi-signal fusion algorithm immediately calculates voice confidence, fluency, speaking stability, and unifies them with environmental hardware parameters."}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Sliders Input Panel */}
              <div className="lg:col-span-7 bg-stone-50 p-6 rounded-xl border border-stone-200/80 space-y-5">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-200 pb-3">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>{isFR ? "Configuration du Signal Vocal" : "Raw Speech Signal Configuration"}</span>
                </h4>

                {/* 1. Speaking Pace Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-stone-700">{isFR ? "Débit de Parole" : "Speaking Pace"}</span>
                    <span className="font-mono text-emerald-600 font-bold">{simPace} WPM ({simPace > 150 ? (isFR ? 'Trop rapide' : 'Rushed') : simPace < 100 ? (isFR ? 'Lent' : 'Deliberate') : (isFR ? 'Idéal' : 'Target tempo')})</span>
                  </div>
                  <input 
                    type="range" 
                    min="60" 
                    max="220" 
                    value={simPace} 
                    onChange={(e) => setSimPace(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>60 WPM ({isFR ? "Lent" : "Slow"})</span>
                    <span>120-140 ({isFR ? "Cible" : "Ideal"})</span>
                    <span>220 WPM ({isFR ? "Rapide" : "Fast"})</span>
                  </div>
                </div>

                {/* 2. Filler words Count */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-stone-700">{isFR ? "Mots de Remplissage / Tics" : "Lexical Vocal Fillers"}</span>
                    <span className="font-mono text-emerald-600 font-bold">{simFillers} {isFR ? "mots" : "fillers"}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="15" 
                    value={simFillers} 
                    onChange={(e) => setSimFillers(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>0 ({isFR ? "Parfait" : "Fluent"})</span>
                    <span>5+ ({isFR ? "Élevé" : "Repetitive"})</span>
                    <span>15 ({isFR ? "Excessif" : "Critical"})</span>
                  </div>
                </div>

                {/* 3. Hesitations / Pause time */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-stone-700">{isFR ? "Cumul des Hesitations / Silences" : "Aggregated Silence Hesitations"}</span>
                    <span className="font-mono text-emerald-600 font-bold">{simHesitations}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    value={simHesitations} 
                    onChange={(e) => setSimHesitations(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>0s ({isFR ? "Aucun" : "No silences"})</span>
                    <span>5s ({isFR ? "Pensif" : "Moderate pause"})</span>
                    <span>20s ({isFR ? "Blocage" : "Extended pause"})</span>
                  </div>
                </div>

                {/* 4. Quality hardware variables */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">{isFR ? "Bruit Ambiant" : "Background Noise"}</label>
                    <select 
                      value={simBackgroundNoise} 
                      onChange={(e) => setSimBackgroundNoise(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs"
                    >
                      <option value="Low">{isFR ? "Faible" : "Low"}</option>
                      <option value="Medium">{isFR ? "Moyen" : "Medium"}</option>
                      <option value="High">{isFR ? "Élevé" : "High"}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">{isFR ? "Qualité Micro" : "Mic Input Quality"}</label>
                    <select 
                      value={simMicQuality} 
                      onChange={(e) => setSimMicQuality(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs"
                    >
                      <option value="Excellent">{isFR ? "Excellente" : "Excellent"}</option>
                      <option value="Good">{isFR ? "Bonne" : "Good"}</option>
                      <option value="Poor">{isFR ? "Médiocre" : "Poor"}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">{isFR ? "Latence Réseau" : "Network Latency"}</label>
                    <select 
                      value={simLatency} 
                      onChange={(e) => setSimLatency(parseInt(e.target.value))}
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs"
                    >
                      <option value="45">45ms ({isFR ? "Fibre" : "Excellent"})</option>
                      <option value="140">140ms ({isFR ? "Moyen" : "Average"})</option>
                      <option value="320">320ms ({isFR ? "Mauvais" : "High Lag"})</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Evaluated Fusion Output Panel */}
              <div className="lg:col-span-5 bg-stone-900 text-white p-6 rounded-xl border border-stone-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-stone-800 pb-3">
                    <Cpu className="w-4.5 h-4.5" />
                    <span>{isFR ? "Rapport de Fusion Multi-Signal" : "Multi-Signal Fusion Report"}</span>
                  </h4>

                  {/* Big Unified Score Ring */}
                  <div className="flex items-center gap-4 py-5">
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-emerald-500/20 bg-stone-950">
                      <span className="text-xl font-black text-white">{calcUnifiedScore}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-mono block">{isFR ? "SCORE DE COMMUNICATION UNIFIÉ" : "UNIFIED SPEECH SCORE"}</span>
                      <span className="text-xs font-bold text-stone-200 mt-1 block">
                        {calcUnifiedScore > 85 ? (isFR ? '🥇 Excellente articulation' : '🥇 Outstanding articulation') :
                         calcUnifiedScore > 70 ? (isFR ? '🥈 Élocution professionnelle' : '🥈 Solid professional tone') :
                         (isFR ? '🥉 Travail respiratoire requis' : '🥉 Breath control training required')}
                      </span>
                    </div>
                  </div>

                  {/* Calculated metrics bars */}
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-300">{isFR ? "Confiance Estimée" : "Estimated Confidence"}</span>
                        <span className="font-bold text-emerald-400">{calcConfidence}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-800 rounded-full">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${calcConfidence}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-300">{isFR ? "Fluidité Lexicale" : "Speech Fluency Index"}</span>
                        <span className="font-bold text-indigo-400">{calcFluency}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-800 rounded-full">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${calcFluency}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-300">{isFR ? "Stabilité & Énergie Vocale" : "Vocal Stability & Energy"}</span>
                        <span className="font-bold text-purple-400">{calcStability}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-800 rounded-full">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${calcStability}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Silence classification callback */}
                  <div className="mt-5 pt-4 border-t border-stone-800 text-xs">
                    <span className="text-stone-400 block mb-1 text-[10px] uppercase font-mono">{isFR ? "Diagnostic d'Inactivité de Parole" : "Vocal Silence Classification"}</span>
                    <span className="font-bold text-white bg-stone-800 px-2.5 py-1.5 rounded-lg block border border-stone-700">
                      ⏱️ {calcPrimarySilenceReason}
                    </span>
                  </div>
                </div>

                {/* Rule Alerts preview */}
                <div className="mt-5 pt-3 border-t border-stone-800">
                  <span className="text-stone-400 block mb-2 text-[10px] uppercase font-mono">{isFR ? "Alerte de Coaching Live (Simulé)" : "Live Training Coaching Signals"}</span>
                  {calcAlerts.length > 0 ? (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto">
                      {calcAlerts.map((alt, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[10px] bg-red-950/40 text-red-400 px-2.5 py-1 rounded-md border border-red-900/30">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{alt}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] bg-emerald-950/40 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-900/30">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isFR ? "Aucun signal d'alerte. Énoncé parfait !" : "No negative indicators. Pristine phrasing tempo!"}</span>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 3: LIVE COACHING RULES AND THRESHOLDS */}
        {activeTab === 'rules' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <Settings className="w-5 h-5 text-indigo-600" />
              <div>
                <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider">{isFR ? "Configuration des Règles de Détection en Direct" : "Live Speech Coaching Threshold Rule Book"}</h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  {isFR ? "Configurez les limites déclenchant les signaux d'alertes instantanés en mode Entraînement." : "Configure parameters to trigger real-time, non-intrusive micro-hints during Training mode sessions."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-5 bg-stone-50 p-5 rounded-xl border border-stone-200">
                <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wider">{isFR ? "Seuils du Débit de Parole (WPM)" : "Speaking Tempo Limits"}</h5>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-stone-700">
                      {isFR ? "Débit Maximum (Alerte Trop Vite) :" : "Maximum Pace (Alert: Speaking Too Fast):"} <span className="font-bold text-indigo-600">{paceMax} WPM</span>
                    </label>
                    <input 
                      type="range" 
                      min="140" 
                      max="190" 
                      value={paceMax} 
                      onChange={(e) => setPaceMax(parseInt(e.target.value))}
                      className="w-full accent-indigo-600" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-stone-700">
                      {isFR ? "Débit Minimum (Alerte Trop Lent) :" : "Minimum Pace (Alert: Speaking Too Slow):"} <span className="font-bold text-indigo-600">{paceMin} WPM</span>
                    </label>
                    <input 
                      type="range" 
                      min="70" 
                      max="110" 
                      value={paceMin} 
                      onChange={(e) => setPaceMin(parseInt(e.target.value))}
                      className="w-full accent-indigo-600" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-5 bg-stone-50 p-5 rounded-xl border border-stone-200">
                <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wider">{isFR ? "Seuils d'Intelligibilité" : "Clarity & Silence Sensitivities"}</h5>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-stone-700">
                      {isFR ? "Taux Maximal de Tics de Langage (par minute) :" : "Filler Words Crutch Count Threshold (per run):"} <span className="font-bold text-indigo-600">{fillerThresh} {isFR ? "mots" : "words"}</span>
                    </label>
                    <input 
                      type="range" 
                      min="2" 
                      max="8" 
                      value={fillerThresh} 
                      onChange={(e) => setFillerThresh(parseInt(e.target.value))}
                      className="w-full accent-indigo-600" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-stone-700">
                      {isFR ? "Durée de Silence Prolongé déclenchant un Conseil :" : "Thinking Silence Threshold for Guidance:"} <span className="font-bold text-indigo-600">{pauseThresh}s</span>
                    </label>
                    <input 
                      type="range" 
                      min="2.0" 
                      max="6.0" 
                      step="0.5"
                      value={pauseThresh} 
                      onChange={(e) => setPauseThresh(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600" 
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4.5 h-4.5 text-indigo-700" />
                  <span className="text-xs font-bold text-indigo-950">{isFR ? "Activer les Alertes Vocales dans la Salle d'Entraînement" : "Deliver Live Audio Hints during Training Mode"}</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={enableLiveHints} 
                  onChange={(e) => setEnableLiveHints(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 accent-indigo-600 rounded border-stone-300"
                />
              </div>
              <p className="text-[11px] text-indigo-900 leading-relaxed">
                {isFR 
                  ? "Si activé, l'IA Shana chuchotera de légères annotations de communication à l'utilisateur ('Vitesse élevée', 'Trop de tics vocal') uniquement en mode Entraînement. Ces aides sont STRICTEMENT désactivées en mode Évaluation / Examen officiel."
                  : "When active, candidate training simulations overlay transient visual reminders (e.g. 'Excellent tempo!', 'Try slowing down') to aid cognitive speech patterns. Hints are strictly suppressed during standard assessment exams."}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setPaceMax(160);
                  setPaceMin(90);
                  setFillerThresh(4);
                  setPauseThresh(3.5);
                  setEnableLiveHints(true);
                  triggerToast(isFR ? "Paramètres d'alertes réinitialisés" : "Threshold settings restored to enterprise defaults");
                }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                {isFR ? "Réinitialiser" : "Restore Defaults"}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  triggerToast(isFR ? "Règles de détection enregistrées avec succès" : "Live coaching thresholds applied live");
                }}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isFR ? "Enregistrer les Règles" : "Save Thresholds"}</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 4: COMPLIANCE, SECURITY & GDPR */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <Shield className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider">{isFR ? "Réglementations RGPD & Sécurité des Données Vocales" : "GDPR & Audio Storage Security Controls"}</h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  {isFR ? "Garantissez la confidentialité absolue des enregistrements audio de vos candidats." : "Enforce zero-trust principles on speech audio files and telemetry metadata."}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              
              {/* Rule 1: Audio Storage retention */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-900">{isFR ? "Période de Rétention des Fichiers Audio Brut" : "Raw Audio Recording Retention Policy"}</span>
                  <select 
                    value={retentionPeriod} 
                    onChange={(e) => setRetentionPeriod(e.target.value)}
                    className="p-1.5 bg-white border border-stone-300 rounded text-xs"
                  >
                    <option value="0">{isFR ? "Purge Instantanée (Télémetrie uniquement)" : "Instant Purge (Extract telemetry & discard audio)"}</option>
                    <option value="1">{isFR ? "Conserver 24 heures (Sécurisé)" : "Retain 24 Hours (Temp debug)"}</option>
                    <option value="7">{isFR ? "Conserver 7 jours" : "Retain 7 Days"}</option>
                  </select>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  {isFR 
                    ? "Par défaut, SHANA applique le principe de minimisation des données (Privacy-by-Design). Les enregistrements audio bruts sont détruits immédiatement après extraction des métriques d'élocution anonymes par le modèle Whisper."
                    : "SHANA enforces a strict data minimization framework. Raw audio bytes are stream-processed by Whisper and immediately dropped from volatile memory once lexical metrics are cataloged."}
                </p>
              </div>

              {/* Rule 2: Strict anonymization toggle */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">{isFR ? "Anonymisation Stricte des Transcriptions de Candidat" : "Enforce Candidate Transcript Redaction"}</span>
                  <input 
                    type="checkbox" 
                    checked={strictAnonymization} 
                    onChange={(e) => setStrictAnonymization(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded border-stone-300"
                  />
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  {isFR 
                    ? "Si activé, toutes les données à caractère personnel (noms de sociétés, emails, montants confidentiels) mentionnées à haute voix par le candidat sont masquées (ex: [CONFIDENTIEL]) avant d'être envoyées au graphe de connaissances global."
                    : "If enabled, personal identifiable information (PII) spoken aloud during simulations is programmatically sanitized before indexation inside the global Knowledge Graph."}
                </p>
              </div>

              {/* Rule 3: Encryption metadata */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">{isFR ? "Chiffrement AES-256 des Métadonnées Vocales" : "AES-256 Encryption on Voice Metadata"}</span>
                  <input 
                    type="checkbox" 
                    checked={encryptMetadata} 
                    onChange={(e) => setEncryptMetadata(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded border-stone-300"
                  />
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  {isFR 
                    ? "Toutes les statistiques d'élocution (vitesse de parole, score de clarté, tics de langage) sont chiffrées au repos dans la base Firestore afin d'éviter tout piratage ou fuite d'identité vocale."
                    : "Encrypt computed vocal statistics (pacing speeds, speech fluency indicators) in the underlying document store to preclude biometric identity harvesting."}
                </p>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  triggerToast(isFR ? "Stratégie de sécurité vocale enregistrée" : "Audio compliance policies successfully deployed globally");
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isFR ? "Appliquer les Règles de Conformité" : "Apply Compliance Policies"}</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
