import React, { useState } from 'react';
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Settings, 
  Smile, 
  Timer, 
  Zap, 
  RefreshCw,
  Sliders,
  Award,
  AlertCircle
} from 'lucide-react';
import { StatsRepository } from '../../services/admin/metrics';

interface EmotionalIntelligencePanelProps {
  lang?: 'FR' | 'EN';
}

export default function EmotionalIntelligencePanel({ lang = 'EN' }: EmotionalIntelligencePanelProps) {
  const isFR = lang === 'FR';
  const [activeTab, setActiveTab] = useState<'analytics' | 'config' | 'ethics'>('analytics');
  const [isSyncing, setIsSyncing] = useState(false);

  // Calibration parameters for the Real-Time Emotional Adaptation Engine
  const [empathySensitivity, setEmpathySensitivity] = useState(85);
  const [stressThreshold, setStressThreshold] = useState(65);
  const [comfortBufferTime, setComfortBufferTime] = useState(1500); // ms
  const [adaptationIntensity, setAdaptationIntensity] = useState('High'); // Low, Balanced, High
  const [enableVocalProse, setEnableVocalProse] = useState(true);

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  // Simulated cumulative statistics based on the sample of 1,240 sessions
  const metrics = {
    avgConfidence: 74,
    stressAdaptation: 88,
    recoveryPerformance: 82,
    engagementTrend: 91,
    emotionalStability: 85,
    comfortProgression: 79,
    adaptiveAccuracy: 93.6,
  };

  return (
    <div className="space-y-8 p-6 bg-white rounded-2xl border-2 border-stone-950 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] text-left">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-emerald-700 font-black bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 mb-2">
            <Heart className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            {isFR ? "MOTEUR D'ADAPTATION ÉMOTIONNELLE TEMPS RÉEL" : "REAL-TIME EMOTIONAL ADAPTATION ENGINE"}
          </span>
          <h2 className="text-2xl font-sans font-black text-stone-900 tracking-tight uppercase">
            {isFR ? "Analyses d'Intelligence Émotionnelle (EQ)" : "Emotional Intelligence Analytics (EQ)"}
          </h2>
          <p className="text-xs text-stone-500 font-semibold mt-1">
            {isFR
              ? "Surveillez comment l'IA de Shana s'adapte en temps réel aux fluctuations de confiance, de stress, et d'énergie des candidats."
              : "Monitor how Shana's recruiter persona dynamically calibrates to candidates' real-time composure, anxiety, and verbal energy."}
          </p>
        </div>
        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="px-3.5 py-1.5 bg-stone-950 hover:bg-stone-900 text-white font-mono text-[10px] font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(237,193,84,1)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isFR ? "SYNCHRONISER" : "REFRESH TELEMETRY"}
        </button>
      </div>

      {/* Interactive Tabs */}
      <div className="flex border-b border-stone-100 gap-2 pb-1.5">
        {[
          { id: 'analytics', label: isFR ? 'Tableau de Bord EQ' : 'EQ Telemetry Dashboard', icon: Activity },
          { id: 'config', label: isFR ? 'Configuration Adaptative' : 'Adaptation Calibration', icon: Sliders },
          { id: 'ethics', label: isFR ? 'Éthique & Confidentialité' : 'Ethics & Guardrails', icon: ShieldCheck }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === tab.id 
                ? 'border-stone-950 text-stone-950' 
                : 'border-transparent text-stone-400 hover:text-stone-900'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Main EQ KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
              <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">
                📈 {isFR ? "Précision d'Adaptation" : "Adaptive Response Accuracy"}
              </span>
              <span className="text-3xl font-mono font-black text-stone-950">{metrics.adaptiveAccuracy}%</span>
              <p className="text-[10px] text-stone-500 font-semibold leading-tight">
                {isFR ? "Taux d'adéquation des directives du coach aux signaux émotionnels." : "Measures alignment of AI system responses with candidate sentiment changes."}
              </p>
              <div className="absolute right-3 bottom-3 text-emerald-500 text-xs font-bold font-mono">↑ 1.4%</div>
            </div>

            <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
              <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">
                🛡️ {isFR ? "Résilience & Récupération" : "Recovery Performance"}
              </span>
              <span className="text-3xl font-mono font-black text-stone-950">{metrics.recoveryPerformance}%</span>
              <p className="text-[10px] text-stone-500 font-semibold leading-tight">
                {isFR ? "Rapidité avec laquelle les candidats surmontent une question difficile." : "Rate of candidate composure reconstruction post structural challenge."}
              </p>
              <div className="absolute right-3 bottom-3 text-indigo-500 text-xs font-bold font-mono">↑ 2.1%</div>
            </div>

            <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
              <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">
                🎭 {isFR ? "Régulation du Stress" : "Stress Adaptation Rate"}
              </span>
              <span className="text-3xl font-mono font-black text-stone-950">{metrics.stressAdaptation}%</span>
              <p className="text-[10px] text-stone-500 font-semibold leading-tight">
                {isFR ? "Stabilisation du rythme vocal après modulation du ton de l'IA." : "Vocal stabilization speed when AI triggers support pacing buffers."}
              </p>
              <div className="absolute right-3 bottom-3 text-emerald-500 text-xs font-bold font-mono">↑ 4.2%</div>
            </div>

            <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
              <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">
                🎯 {isFR ? "Stabilité Émotionnelle" : "Emotional Stability Metric"}
              </span>
              <span className="text-3xl font-mono font-black text-stone-950">{metrics.emotionalStability}%</span>
              <p className="text-[10px] text-stone-500 font-semibold leading-tight">
                {isFR ? "Constance de l'assurance face aux relances de haut niveau." : "Consistency of delivery under progressive, high-stakes scenarios."}
              </p>
              <div className="absolute right-3 bottom-3 text-emerald-500 text-xs font-bold font-mono">↑ 0.8%</div>
            </div>

          </div>

          {/* Detailed Analytical Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Emotional Progression Analytics */}
            <div className="border-2 border-stone-950 rounded-[28px] p-5 bg-[#FFFDF6] space-y-4">
              <div className="border-b border-stone-150 pb-2 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  {isFR ? "Évolution Spatiotemporelle de la Confiance" : "Average Confidence & Comfort Evolution"}
                </h3>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-mono font-bold rounded uppercase">
                  {isFR ? "TEMPS RÉEL" : "LIVE SIMULATOR"}
                </span>
              </div>

              {/* Progress Chart Lines Simulation */}
              <div className="space-y-4 pt-2">
                {[
                  { label: isFR ? "Étape d'Ouverture (Icebreaker)" : "Icebreaker Stage (Turn 1)", val: 68, labelSub: isFR ? "Niveau de confort modéré" : "Moderate anxiety, high anticipation" },
                  { label: isFR ? "Évaluation STAR Standard" : "Core Competency Audit (Turn 2-3)", val: 74, labelSub: isFR ? "Assurance croissante" : "Structural adaptation, pacing stabilizes" },
                  { label: isFR ? "Phase de Défi Intense (Stress Test)" : "Intense Technical Challenge (Turn 4-5)", val: 58, labelSub: isFR ? "Friction élevée, baisse temporaire" : "Stress triggers speed spike, compensation active" },
                  { label: isFR ? "Atelier de Co-création STAR" : "Coaching Support Workshop (Turn 6-7)", val: 86, labelSub: isFR ? "Sentiment de sécurité rétabli" : "Confidence rebuilt via empathetic feedback" }
                ].map((step, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-stone-900 block">{step.label}</span>
                        <span className="text-[10px] text-stone-500 italic font-medium">{step.labelSub}</span>
                      </div>
                      <span className="font-mono font-black text-stone-950">{step.val}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-white border border-stone-300 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${step.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Dynamic Cognitive Signals Breakdown */}
            <div className="border-2 border-stone-950 rounded-[28px] p-5 bg-[#FFFDF6] space-y-4">
              <div className="border-b border-stone-150 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                  {isFR ? "Signaux Adaptatifs du Modèle de Recrutement" : "Dynamic Recruiter Persona Calibration"}
                </h3>
              </div>

              <div className="space-y-3.5">
                {[
                  { 
                    title: isFR ? "Modulation Supportive (Candidat Anxieux)" : "Active Supportive Scaffolding", 
                    desc: isFR ? "Réduction de 20% du rythme, simplification des questions composites, backchannels chaleureux." : "Triggers whenever stress exceeds 60% or confidence falls under 40%. Directs LLM to drop multi-part questions.", 
                    val: "84.2%" 
                  },
                  { 
                    title: isFR ? "Rigueur Accrue (Candidat Très Assuré)" : "Elite Sparring & Challenge Buffers", 
                    desc: isFR ? "Augmentation de la complexité, relances sur les compromis d'architecture avancés." : "Triggers when flow rating exceeds 75%. Injects deep-dive structural challenge and trade-off queries.", 
                    val: "91.5%" 
                  },
                  { 
                    title: isFR ? "Gestion des Pauses Réflexives" : "Reflective Silence & Breathing Buffer", 
                    desc: isFR ? "Délai de réponse augmenté à 2,5s après de longues silences pour éviter de couper le candidat." : "Deliberately holds conversational turn when candidate is in memory recall or emotional pause state.", 
                    val: "95.0%" 
                  }
                ].map((cal, idx) => (
                  <div key={idx} className="border border-stone-200 bg-white rounded-xl p-3 flex justify-between gap-4 items-start">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-tight text-stone-900 block">{cal.title}</span>
                      <p className="text-[10px] text-stone-500 leading-normal font-semibold">{cal.desc}</p>
                    </div>
                    <span className="px-2 py-1 bg-stone-900 text-white font-mono text-[10px] font-black rounded border border-stone-950 self-center shrink-0">
                      {cal.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="border-2 border-stone-950 rounded-2xl p-5 bg-stone-50 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              {isFR ? "Calibrage du Moteur d'Adaptation en Temps Réel" : "Real-Time Adaptation Fine-Tuning"}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {isFR 
                ? "Ajustez les seuils du modèle pour calibrer la façon dont l'intelligence de recrutement réagit aux émotions." 
                : "Tune the algorithmic thresholds that govern how Shana's AI interview partner adapts to candidate stress, hesitation, and posture."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-stone-700 flex justify-between">
                  <span>{isFR ? "Sensibilité Empathique Globale" : "Global Empathy Sensitivity"}</span>
                  <span className="font-mono text-stone-950 font-black">{empathySensitivity}%</span>
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  value={empathySensitivity} 
                  onChange={(e) => setEmpathySensitivity(Number(e.target.value))}
                  className="w-full accent-stone-950 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
                />
                <span className="text-[9px] text-stone-400 block font-semibold">
                  {isFR ? "Régule la réactivité de l'IA aux micro-hésitations et signaux négatifs." : "Governs how rapidly the AI adapts to minor vocal and linguistic fluctuations."}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-stone-700 flex justify-between">
                  <span>{isFR ? "Seuil de Surcharge Cognitive (Stress)" : "Cognitive Overload Threshold"}</span>
                  <span className="font-mono text-stone-950 font-black">{stressThreshold}%</span>
                </label>
                <input 
                  type="range" 
                  min="40" 
                  max="90" 
                  value={stressThreshold} 
                  onChange={(e) => setStressThreshold(Number(e.target.value))}
                  className="w-full accent-stone-950 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
                />
                <span className="text-[9px] text-stone-400 block font-semibold">
                  {isFR ? "Le niveau à partir duquel le recruteur passe en mode rassurant." : "Minimum stress percentage required to activate reassuring speech scaffolding."}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-stone-700 flex justify-between">
                  <span>{isFR ? "Délai Minimum de Pause Réflexive" : "Reflective Pause Hold Timer"}</span>
                  <span className="font-mono text-stone-950 font-black">{comfortBufferTime}ms</span>
                </label>
                <input 
                  type="range" 
                  min="500" 
                  max="3000" 
                  step="250"
                  value={comfortBufferTime} 
                  onChange={(e) => setComfortBufferTime(Number(e.target.value))}
                  className="w-full accent-stone-950 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
                />
                <span className="text-[9px] text-stone-400 block font-semibold">
                  {isFR ? "Temps d'attente additionnel avant de générer une réponse après un silence." : "Extra silence buffer window used to avoid interrupting candidates during deep thought."}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-stone-700 flex justify-between">
                  <span>{isFR ? "Intensité d'Adaptation" : "Adaptive Pacing Mode"}</span>
                  <span className="font-mono text-stone-950 font-black">{adaptationIntensity}</span>
                </label>
                <div className="flex gap-2">
                  {['Low', 'Balanced', 'High'].map(intensity => (
                    <button
                      key={intensity}
                      onClick={() => setAdaptationIntensity(intensity)}
                      className={`flex-1 py-1.5 border-2 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all ${
                        adaptationIntensity === intensity 
                          ? 'border-stone-950 bg-stone-950 text-white' 
                          : 'border-stone-200 bg-white text-stone-400 hover:text-stone-900 hover:border-stone-300'
                      }`}
                    >
                      {intensity}
                    </button>
                  ))}
                </div>
                <span className="text-[9px] text-stone-400 block font-semibold">
                  {isFR ? "Niveau de modulation du ton et de la structure du dialogue de l'IA." : "Scales the amplitude of AI behavioral tone adjustments during emotional swings."}
                </span>
              </div>

            </div>
          </div>

          <div className="border border-stone-200 bg-white rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-tight text-stone-900 block">
                {isFR ? "Prosodie Émotionnelle Vocale" : "Real-Time Speech Prosody Mapping"}
              </span>
              <p className="text-[10px] text-stone-500 font-semibold leading-normal">
                {isFR ? "Ajuste automatiquement le pitch, la vitesse et le volume du texte vocalisé." : "Dynamically controls vocal timbre, pitch, and speech speed when synthesizer is activated."}
              </p>
            </div>
            <button
              onClick={() => setEnableVocalProse(!enableVocalProse)}
              className={`px-3.5 py-1.5 font-mono text-[9px] font-black uppercase tracking-wider rounded-xl transition-all border-2 ${
                enableVocalProse 
                  ? 'border-stone-950 bg-[#E8F8F5] text-emerald-800 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]' 
                  : 'border-stone-200 bg-white text-stone-400'
              }`}
            >
              {enableVocalProse ? (isFR ? "ACTIF" : "ENABLED") : (isFR ? "INACTIF" : "DISABLED")}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'ethics' && (
        <div className="space-y-6">
          <div className="border-2 border-stone-950 rounded-2xl p-5 bg-[#FAFCFB] space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
              {isFR ? "Déclaration d'Éthique, de Sécurité & Non-Discrimination" : "EQ Privacy, Security & Ethical Mandate"}
            </h3>
            
            <div className="space-y-3.5 text-xs text-stone-700 font-semibold leading-relaxed">
              <p>
                {isFR 
                  ? "Le Moteur d'Adaptation Émotionnelle Shana est conçu exclusivement pour soutenir, motiver et optimiser la performance des candidats dans un cadre d'auto-apprentissage et d'entraînement bienveillant." 
                  : "The Shana Real-Time Emotional Adaptation Engine operates strictly as a developmental feedback and stress-mitigation loop to optimize applicant comfort."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {[
                  { 
                    title: isFR ? "❌ Pas de Diagnostic" : "❌ No Mental Health Diagnostics", 
                    desc: isFR ? "Le moteur n'infère ni ne diagnostique aucun trait clinique ou trouble de santé mentale." : "Our analytics only map momentary linguistic cues. They are never mapped to psychological profiles or health states." 
                  },
                  { 
                    title: isFR ? "❌ Pas de Profilage Permanent" : "❌ No Permanent Emotional Classification", 
                    desc: isFR ? "Les états d'esprit temporaires ne sont pas stockés comme étiquettes d'évaluation ou fiches permanentes." : "Momentary anxiety and stress scores do not impact overall candidate suitability evaluations in standard reports." 
                  },
                  { 
                    title: isFR ? "⚖️ Non-Discrimination Algorithmique" : "⚖️ Algorithmic Equity & Guardrails", 
                    desc: isFR ? "L'évaluation est basée uniquement sur la sémantique et la structure STAR des réponses, jamais sur le stress." : "Hiring scores derive purely from STAR structural correctness and evidence completeness, shielding users from bias." 
                  },
                  { 
                    title: isFR ? "🛡️ Opt-In & Transparence Totale" : "🛡️ Data Privacy & Opt-Out", 
                    desc: isFR ? "Toutes les analyses d'intonation et de rythmes sont locales et destinées à l'entraînement personnalisé." : "Candidates hold full autonomy to enable or disable acoustic, vocal, or video telemetry tracking layers." 
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-stone-200 rounded-xl p-3 space-y-1.5">
                    <span className="text-[11px] font-black uppercase text-stone-900 block">{item.title}</span>
                    <p className="text-[10px] text-stone-500 leading-relaxed font-semibold">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 items-start mt-4">
                <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-800 font-black uppercase block">{isFR ? "CONFORMITÉ RGPD & IA RESPONSABLE" : "GDPR & TRUSTED AI ALIGNMENT"}</span>
                  <p className="text-[10px] text-emerald-900 font-bold leading-normal">
                    {isFR 
                      ? "Nos modèles d'intelligence émotionnelle respectent la charte européenne sur l'IA et garantissent une anonymisation complète des descripteurs acoustiques." 
                      : "Shana emotional intelligence systems comply with standard GDPR clauses and regional AI acts, completely isolating acoustic descriptors from core user telemetry."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
