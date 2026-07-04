import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Award, 
  Flame, 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  Mic, 
  ArrowRight, 
  Zap, 
  Target, 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  Shield, 
  UserCheck, 
  ChevronRight,
  TrendingDown,
  Activity,
  Heart,
  Briefcase,
  GraduationCap,
  Search,
  Building,
  DollarSign,
  MapPin,
  Calendar,
  CheckSquare,
  ListTodo,
  XCircle
} from 'lucide-react';
import { CandidateProfileService } from '../lib/candidate/candidateProfile';
import { CandidateState, DigitalTwinCompetency } from '../lib/candidate/candidateState';
import { motion } from 'motion/react';

interface CandidateBrainViewProps {
  userId: string;
  lang: 'EN' | 'FR';
  onChangeTab: (tab: any) => void;
}

export default function CandidateBrainView({ userId, lang, onChangeTab }: CandidateBrainViewProps) {
  const [profileState, setProfileState] = useState<CandidateState | null>(null);
  const [subTab, setSubTab] = useState<'cognitive' | 'career'>('cognitive');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('job_01');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('module_01');
  const [drillProgress, setDrillProgress] = useState<Record<string, 'not_started' | 'completed'>>({
    'drill_1_3': 'not_started',
    'drill_2_2': 'not_started',
    'drill_2_3': 'not_started',
    'drill_3_1': 'not_started',
    'drill_3_2': 'not_started'
  });
  const [simulationLoading, setSimulationLoading] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    const p = CandidateProfileService.getCandidateState(userId);
    setProfileState(p);
    if (p) {
      setSelectedTrack(p.memory.careerGoals || (lang === 'FR' ? 'Architecte Cloud / SRE' : 'Cloud Architect / SRE'));
    }

    // Synchronize updates
    const handleUpdate = () => {
      const updated = CandidateProfileService.getCandidateState(userId);
      setProfileState(updated);
    };

    window.addEventListener('shana_candidate_state_update', handleUpdate);
    window.addEventListener('shana_progress_update', handleUpdate);

    return () => {
      window.removeEventListener('shana_candidate_state_update', handleUpdate);
      window.removeEventListener('shana_progress_update', handleUpdate);
    };
  }, [userId]);

  if (!profileState) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-stone-200 rounded-3xl p-8 shadow-xs">
        <Brain className="w-12 h-12 text-stone-300 animate-pulse mb-4" />
        <p className="text-sm text-stone-500 font-medium">
          {lang === 'FR' 
            ? "Génération du dossier apprenant intelligent..." 
            : "Compiling smart learner intelligence profile..."}
        </p>
      </div>
    );
  }

  const isFr = lang === 'FR';
  const {
    digitalTwin,
    communication,
    confidence,
    stress,
    learning,
    behavioral,
    personality,
    readiness,
    coachingStrategy,
    improvementPlanner,
    memory,
    motivation,
    recommendations
  } = profileState;

  // Best competency
  const twinArray = Object.values(digitalTwin) as DigitalTwinCompetency[];
  const topCompetency = twinArray.length > 0 
    ? [...twinArray].sort((a, b) => b.score - a.score)[0] 
    : null;

  // Progress to targets
  const averageCompetencyScore = twinArray.length > 0 
    ? Math.round(twinArray.reduce((acc, curr) => acc + curr.score, 0) / twinArray.length) 
    : 0;

  // Unlocked milestones
  const unlockedCount = motivation.milestones.filter(m => m.unlockedAt).length;

  return (
    <div id="candidate-brain-workspace" className="py-2 max-w-5xl mx-auto space-y-8 text-[#111111] font-sans antialiased relative z-10 selection:bg-indigo-100">
      
      {/* Background elegant slow glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[20%] w-[350px] h-[350px] rounded-full bg-indigo-500 opacity-[0.02] filter blur-[90px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[300px] h-[300px] rounded-full bg-emerald-500 opacity-[0.02] filter blur-[100px]" />
      </div>

      {/* ================= HEADER SECTION ================= */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-stone-100 pb-6 relative z-10 text-left"
      >
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            {isFr ? "MON DOSSIER APPRENTANT LONG TERME" : "MY LONG-TERM LEARNER PROFILE"}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-950">
            {isFr ? "Cerveau de Carrière SHANA" : "SHANA Career Brain"}
          </h1>
          <p className="text-xs md:text-sm font-medium text-stone-500 max-w-2xl leading-relaxed">
            {isFr 
              ? "SHANA ne vous évalue pas de manière isolée. Chaque simulation enrichit cette carte cognitive interactive qui personnalise vos futurs parcours de coaching." 
              : "SHANA does not view you as isolated sessions. Every interaction enriches this interactive cognitive map, adaptive learning strategies, and speech diagnostics."}
          </p>
        </div>

        {/* Start practice CTA */}
        <button
          onClick={() => onChangeTab('train')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl border-2 border-stone-950 shadow-[4px_4px_0px_0px_#111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#111] transition-all cursor-pointer flex items-center gap-2"
        >
          <Mic className="w-4 h-4 text-white" />
          <span>{isFr ? "Lancer un Entraînement" : "Start Warm-up Practice"}</span>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </button>
      </motion.div>

      {/* Sub navigation bar */}
      <div className="flex border-b-2 border-stone-950 gap-2 relative z-10">
        <button
          id="shana-brain-tab-cognitive"
          onClick={() => setSubTab('cognitive')}
          className={`px-4 py-2.5 font-sans font-black text-[11px] uppercase tracking-wider border-t-2 border-l-2 border-r-2 border-stone-950 rounded-t-xl transition-all cursor-pointer ${
            subTab === 'cognitive'
              ? 'bg-white text-stone-950 border-b-2 border-b-white translate-y-[2px]'
              : 'bg-stone-50 text-stone-500 hover:text-stone-950 hover:bg-stone-100 border-b-2 border-b-stone-950'
          }`}
        >
          {isFr ? "🧠 Double Cognitif & Diagnostics" : "🧠 Cognitive Twin & Diagnostics"}
        </button>
        <button
          id="shana-brain-tab-career"
          onClick={() => setSubTab('career')}
          className={`px-4 py-2.5 font-sans font-black text-[11px] uppercase tracking-wider border-t-2 border-l-2 border-r-2 border-stone-950 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            subTab === 'career'
              ? 'bg-[#A7F3D0] text-[#111] border-b-2 border-b-[#A7F3D0] translate-y-[2px]'
              : 'bg-stone-50 text-stone-500 hover:text-stone-950 hover:bg-stone-100 border-b-2 border-b-stone-950'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{isFr ? "💼 Phase 28 : Career Intelligence" : "💼 Phase 28: Career Intelligence"}</span>
        </button>
      </div>

      {subTab === 'cognitive' ? (
        <>
          {/* ================= HIGH-LEVEL COGNITIVE STATE GRID ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 text-left">
            {/* Readiness index card */}
            <div className="bg-white border-2 border-stone-950 p-5 rounded-2xl space-y-2 shadow-[3px_3px_0px_0px_#111]">
              <span className="text-[9px] uppercase font-mono font-black tracking-widest text-stone-400 block">
                {isFr ? "Indice d'Embauche Global" : "Overall Hiring Readiness"}
              </span>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-3.5xl font-mono font-black text-indigo-700">{readiness.overallHiringReadiness.score}%</span>
                <span className="text-xs font-bold text-stone-500">{isFr ? "Prêt" : "Ready"}</span>
              </div>
              <div className="w-full bg-stone-100 h-2 border border-stone-950 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${readiness.overallHiringReadiness.score}%` }} />
              </div>
            </div>

            {/* Growth Rate card */}
            <div className="bg-white border-2 border-stone-950 p-5 rounded-2xl space-y-2 shadow-[3px_3px_0px_0px_#111]">
              <span className="text-[9px] uppercase font-mono font-black tracking-widest text-stone-400 block">
                {isFr ? "Taux d'Assimilation" : "Growth & Assimilation"}
              </span>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-3.5xl font-mono font-black text-emerald-600">+{averageCompetencyScore}%</span>
                <span className="text-xs font-bold text-stone-500">avg</span>
              </div>
              <div className="w-full bg-stone-100 h-2 border border-stone-950 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${averageCompetencyScore}%` }} />
              </div>
            </div>

            {/* Practice streak card */}
            <div className="bg-white border-2 border-stone-950 p-5 rounded-2xl space-y-2 shadow-[3px_3px_0px_0px_#111]">
              <span className="text-[9px] uppercase font-mono font-black tracking-widest text-stone-400 block">
                {isFr ? "Assiduité Actuelle" : "Consistency Streak"}
              </span>
              <div className="flex items-baseline gap-1.5 pt-1 text-amber-600">
                <Flame className="w-6 h-6 shrink-0 fill-amber-100" />
                <span className="text-3.5xl font-mono font-black text-stone-900">{motivation.streakCount}</span>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">{isFr ? "jours" : "days"}</span>
              </div>
              <p className="text-[10px] text-stone-500 font-bold">
                {isFr ? "Niveau d'implication hebdomadaire" : "Weekly consistency level"}
              </p>
            </div>

            {/* Milestones count card */}
            <div className="bg-white border-2 border-stone-950 p-5 rounded-2xl space-y-2 shadow-[3px_3px_0px_0px_#111]">
              <span className="text-[9px] uppercase font-mono font-black tracking-widest text-stone-400 block">
                {isFr ? "Badges Débloqués" : "Milestones Unlocked"}
              </span>
              <div className="flex items-baseline gap-1.5 pt-1 text-amber-500">
                <Trophy className="w-6 h-6 shrink-0 fill-amber-50" />
                <span className="text-3.5xl font-mono font-black text-stone-900">{unlockedCount}</span>
                <span className="text-xs font-bold text-stone-400">/ {motivation.milestones.length}</span>
              </div>
              <p className="text-[10px] text-stone-500 font-bold">
                {isFr ? "Médailles de réussite professionnelle" : "Platform career progress badges"}
              </p>
            </div>
          </div>

          {/* ================= TWO-COLUMN GRID FOR CORE BRAIN SYSTEMS ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 text-left">
            
            {/* COLUMN LEFT: CORE MATRICES (Col span 7) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* A. DIGITAL TWIN OF CORE COMPETENCIES */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-5">
                <div className="flex justify-between items-center border-b border-stone-150 pb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                      {isFr ? "Double Numérique des Compétences" : "Digital Twin of Competencies"}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-black bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded">
                    {isFr ? "TEMPS RÉEL" : "LIVE TELEMETRY"}
                  </span>
                </div>

                <div className="space-y-4">
                  {twinArray.slice(0, 6).map((comp) => (
                    <div key={comp.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-stone-700 uppercase tracking-wide text-[11px]">{comp.name}</span>
                        <span className="font-mono text-stone-900 font-black">{comp.score}/100</span>
                      </div>
                      <div className="w-full bg-stone-50 border border-stone-300 rounded-lg h-3 overflow-hidden p-0.5">
                        <div 
                          className={`h-full rounded-sm transition-all duration-500 ${
                            comp.score >= 80 ? 'bg-emerald-500' : comp.score >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                          }`} 
                          style={{ width: `${comp.score}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {topCompetency && (
                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                        {isFr ? "Point Fort Dominant" : "Dominant Strength Anchor"}
                      </p>
                      <p className="text-[11px] text-emerald-800 leading-relaxed font-semibold">
                        {isFr 
                          ? `Votre compétence la plus robuste est « ${topCompetency.name} » avec un score de ${topCompetency.score}%.`
                          : `Your highly advanced parameter is "${topCompetency.name}" holding an outstanding score of ${topCompetency.score}%.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* B. DETAILED HIRING READINESS SCORES */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-5">
                <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                    {isFr ? "Indicateurs d'Embauche & Cibles" : "Readiness Metrics & Targets"}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-500">{isFr ? "Aptitudes Comportementales" : "Behavioral Readiness"}</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-mono font-black text-indigo-600">{readiness.behavioralReadiness.score}%</span>
                    </div>
                    <p className="text-[10.5px] text-stone-600 leading-relaxed font-medium">{readiness.behavioralReadiness.explanation}</p>
                  </div>

                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-500">{isFr ? "Aptitudes Techniques" : "Technical Readiness"}</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-mono font-black text-emerald-600">{readiness.technicalReadiness.score}%</span>
                    </div>
                    <p className="text-[10.5px] text-stone-600 leading-relaxed font-medium">{readiness.technicalReadiness.explanation}</p>
                  </div>

                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-500">{isFr ? "Compétences de Leadership" : "Leadership Readiness"}</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-mono font-black text-indigo-600">{readiness.leadershipReadiness.score}%</span>
                    </div>
                    <p className="text-[10.5px] text-stone-600 leading-relaxed font-medium">{readiness.leadershipReadiness.explanation}</p>
                  </div>

                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-500">{isFr ? "Postures Exécutives" : "Executive Presentation"}</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-mono font-black text-purple-600">{readiness.executiveReadiness.score}%</span>
                    </div>
                    <p className="text-[10.5px] text-stone-600 leading-relaxed font-medium">{readiness.executiveReadiness.explanation}</p>
                  </div>
                </div>
              </div>

              {/* C. SPEECH & VERBAL COMMUNICATION METRICS */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-5">
                <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                  <Mic className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                    {isFr ? "Diagnostic de Parole & Clarté Vocale" : "Acoustic Speech Diagnostics"}
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wide font-black text-stone-400 block">{isFr ? "Vitesse de Parole" : "Speaking Speed"}</span>
                    <span className="text-lg font-mono font-black text-stone-900">{communication.averageSpeakingSpeed} wpm</span>
                    <span className="text-[8.5px] text-stone-500 block">{isFr ? "Cible : 130-150" : "Target: 130-150"}</span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wide font-black text-stone-400 block">{isFr ? "Richesse Lexicale" : "Vocabulary Index"}</span>
                    <span className="text-lg font-mono font-black text-stone-900">{communication.vocabularyRichness}%</span>
                    <span className="text-[8.5px] text-emerald-600 block">{isFr ? "Excellent" : "Robust"}</span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wide font-black text-stone-400 block">{isFr ? "Structure de Phrase" : "Structure Score"}</span>
                    <span className="text-lg font-mono font-black text-stone-900">{communication.sentenceStructure}%</span>
                    <span className="text-[8.5px] text-stone-500 block">{isFr ? "Méthode STAR" : "STAR compliant"}</span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wide font-black text-stone-400 block">{isFr ? "Clarté des Réponses" : "Answer Clarity"}</span>
                    <span className="text-lg font-mono font-black text-stone-900">{communication.answerClarity}%</span>
                    <span className="text-[8.5px] text-indigo-600 block">{isFr ? "Très précis" : "Highly coherent"}</span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wide font-black text-stone-400 block">{isFr ? "Concision & Focus" : "Conciseness Index"}</span>
                    <span className="text-lg font-mono font-black text-stone-900">{communication.conciseness}%</span>
                    <span className="text-[8.5px] text-stone-500 block">{isFr ? "Zéro digression" : "Direct & dense"}</span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wide font-black text-stone-400 block">{isFr ? "Mots de Remplissage" : "Filler Freq."}</span>
                    <span className="text-lg font-mono font-black text-rose-600">{communication.fillerWordFrequency} /100w</span>
                    <span className="text-[8.5px] text-stone-500 block">{isFr ? "Cible : < 2.0" : "Target: < 2.0"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* COLUMN RIGHT: STRATEGIES & PLANNING (Col span 5) */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* D. PERSONALIZED COACHING STRATEGY & IMPROVEMENT PLANNER */}
              <div className="bg-stone-950 text-stone-100 border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-5">
                <div className="flex justify-between items-center border-b border-stone-850 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-sans font-black uppercase tracking-wider text-white">
                      {isFr ? "Plan d'Amélioration & Stratégie" : "Adaptive Coaching Strategy"}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono font-black bg-amber-400 text-stone-950 px-2 py-0.5 rounded font-bold uppercase">
                    {coachingStrategy.activeTrack}
                  </span>
                </div>

                {/* Weekly Target Plan */}
                <div className="space-y-3 text-left">
                  <span className="text-[10px] uppercase font-mono font-black tracking-widest text-stone-400 block">
                    {isFr ? "Objectifs de la Semaine" : "Active Weekly Priorities"}
                  </span>
                  <ul className="space-y-2.5">
                    {coachingStrategy.weeklyPlan.map((plan, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start text-xs text-stone-300 font-semibold">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{plan}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Monthly milestones */}
                <div className="space-y-3 pt-3 border-t border-stone-800 text-left">
                  <span className="text-[10px] uppercase font-mono font-black tracking-widest text-stone-400 block">
                    {isFr ? "Objectifs Long Terme" : "Long Term Targets"}
                  </span>
                  <ul className="space-y-2">
                    {improvementPlanner.monthlyObjectives.map((obj, idx) => (
                      <li key={idx} className="flex gap-2 items-center text-xs text-stone-400 font-semibold">
                        <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* E. CONFIDENCE & STRESS RESILIENCE */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                    {isFr ? "Régulation du Stress & Confiance" : "Stress Resilience & Confidence"}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-stone-700">{isFr ? "Indice de Résilience" : "Resilience Index"}</span>
                      <span className="font-mono text-stone-950 font-black">{stress.stressResilienceIndex}/100</span>
                    </div>
                    <div className="w-full bg-stone-100 border border-stone-300 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${stress.stressResilienceIndex}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-stone-700">{isFr ? "Régulation sous Forte Pression" : "Confidence Under Pressure"}</span>
                      <span className="font-mono text-stone-950 font-black">{confidence.confidenceUnderPressure}/100</span>
                    </div>
                    <div className="w-full bg-stone-100 border border-stone-300 rounded-full h-2 overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${confidence.confidenceUnderPressure}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-stone-700">{isFr ? "Stabilité de Débit (Zéro panique)" : "Speaking Pace Stability"}</span>
                      <span className="font-mono text-stone-950 font-black">{stress.emotionalRecovery}/100</span>
                    </div>
                    <div className="w-full bg-stone-100 border border-stone-300 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stress.emotionalRecovery}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                  <div className="bg-stone-50 border border-stone-200 p-2 rounded-lg">
                    <span className="text-stone-400 block font-bold">{isFr ? "Hésitations" : "Hesitations"}</span>
                    <span className="text-stone-900 font-black">{stress.hesitations} / {isFr ? "réponse" : "answer"}</span>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 p-2 rounded-lg">
                    <span className="text-stone-400 block font-bold">{isFr ? "Pauses Longues" : "Long Pauses"}</span>
                    <span className="text-stone-900 font-black">{stress.longPauses} s</span>
                  </div>
                </div>
              </div>

              {/* F. ACHIEVEMENT MILESTONES */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                    {isFr ? "Défis & Badges Débloqués" : "Milestones & Achievements"}
                  </h3>
                </div>

                <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                  {motivation.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex gap-3 items-start border-b border-stone-100 pb-2.5 last:border-0 last:pb-0">
                      <div className={`p-2 rounded-xl border ${
                        milestone.unlockedAt 
                          ? 'bg-amber-50 border-amber-300 text-amber-600' 
                          : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
                      }`}>
                        <Trophy className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="space-y-0.5 text-left">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-black uppercase tracking-wide ${milestone.unlockedAt ? 'text-stone-900' : 'text-stone-400'}`}>
                            {milestone.title}
                          </p>
                          {milestone.unlockedAt && (
                            <span className="text-[8px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-1 py-0.2 rounded font-mono font-bold">
                              {isFr ? "ACQUIS" : "UNLOCKED"}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10.5px] leading-relaxed ${milestone.unlockedAt ? 'text-stone-600' : 'text-stone-400'}`}>
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* ================= GORGEOUS RECOMMENDATIONS & ADAPTIVE COACHING SUGGESTIONS ================= */}
          <div className="bg-indigo-50 border-2 border-stone-950 rounded-3xl p-6 sm:p-8 space-y-6 relative z-10 text-left">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-700" />
                <h3 className="text-sm font-sans font-black uppercase tracking-wider text-indigo-950">
                  {isFr ? "Recommandations de Pratique Prédictives" : "Custom Predictive Practice Tracks"}
                </h3>
              </div>
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md">
                {isFr ? "MOTEUR ACTIF" : "ADAPTIVE RADAR"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-stone-250 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                    <Target className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-xs uppercase tracking-wide text-stone-900">
                    {isFr ? "Sessions Conseillées" : "Target Practice"}
                  </h4>
                </div>
                <ul className="space-y-2">
                  {recommendations.practiceSessions.map((sess, idx) => (
                    <li key={idx} className="flex gap-2 items-center text-xs font-semibold text-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>{sess}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 bg-white p-5 rounded-2xl border border-stone-250 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-xs uppercase tracking-wide text-stone-900">
                    {isFr ? "Simulations de Postes" : "Company Contexts"}
                  </h4>
                </div>
                <ul className="space-y-2">
                  {recommendations.companySimulations.map((sim, idx) => (
                    <li key={idx} className="flex gap-2 items-center text-xs font-semibold text-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{sim}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 bg-white p-5 rounded-2xl border border-stone-250 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h4 className="font-black text-xs uppercase tracking-wide text-stone-900">
                    {isFr ? "Axes de Carrière" : "Strategic Paths"}
                  </h4>
                </div>
                <ul className="space-y-2">
                  {recommendations.careerPaths.map((path, idx) => (
                    <li key={idx} className="flex gap-2 items-center text-xs font-semibold text-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                      <span>{path}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 relative z-10 text-left animate-fade-in" id="career-intelligence-engine-workspace">
          {/* A. Dynamic simulation launch overlay loader */}
          {simulationLoading && (
            <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center z-50">
              <div className="bg-white border-2 border-stone-950 p-8 rounded-3xl max-w-sm text-center space-y-4 shadow-[6px_6px_0px_0px_#111]">
                <div className="w-12 h-12 rounded-2xl bg-[#A7F3D0] border-2 border-stone-950 flex items-center justify-center mx-auto text-stone-950 font-black animate-spin">
                  <Sparkles className="w-6 h-6 text-indigo-700" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans font-black text-sm uppercase text-stone-900">
                    {isFr ? "Chargement du Poste..." : "Configuring Company Persona..."}
                  </h4>
                  <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                    {isFr 
                      ? "Génération du plan de questionnement adaptatif Shana pour ce poste..."
                      : "Structuring predictive challenge vectors and custom company calibration metrics..."}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-stone-400">
                  {simulationLoading}
                </div>
              </div>
            </div>
          )}

          {/* Intro Card */}
          <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[4px_4px_0px_0px_#111] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <h3 className="font-sans font-black text-sm uppercase text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>{isFr ? "Phase 28 : Intelligence de Carrière Intégrée" : "Phase 28: Integrated Career Intelligence"}</span>
              </h3>
              <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                {isFr
                  ? "Planifiez votre avenir professionnel avec le planificateur long terme, découvrez votre compatibilité algorithmique avec des postes clés et lancez des entraînements hyper-ciblés."
                  : "Plan your strategic career projection, view direct match compatibilities computed from your live competency twin, and launch hyper-targeted simulation sprints."}
              </p>
            </div>
            <div className="bg-indigo-50 border border-indigo-150 px-3.5 py-2 rounded-2xl text-center shrink-0">
              <span className="font-mono text-[9px] text-indigo-700 font-black uppercase tracking-widest block">{isFr ? "MODÈLE DÉCISIONNEL" : "DECISION ENGINE"}</span>
              <span className="font-sans font-extrabold text-xs text-stone-900 uppercase">{isFr ? "Précision Active" : "Active Accuracy"}</span>
            </div>
          </div>

          {/* THREE CORE COMPONENT VIEWS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT / CENTER: CAREER PLANNING & LEARNING PATHS (Col span 7) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* 1. LONG-TERM CAREER PLANNING */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-6">
                <div className="flex justify-between items-center border-b border-stone-150 pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                      {isFr ? "1. Plan de Carrière & Horizon Stratégique" : "1. Long-Term Strategic Career Plan"}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono font-black bg-stone-100 border border-stone-250 text-stone-700 px-2 py-0.5 rounded uppercase">
                    {isFr ? "Horizon 3-5 ans" : "3-5 Year Horizon"}
                  </span>
                </div>

                {/* Selected Track Configurator */}
                <div className="bg-stone-50 border border-stone-150 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-mono font-black tracking-wider text-stone-500 block leading-none">
                      {isFr ? "Filière de Visée Actuelle" : "Target Career Path"}
                    </label>
                    <span className="text-[10px] font-mono text-indigo-600 font-extrabold block">
                      {isFr ? "Modifier" : "Toggle/Edit"}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    {[
                      isFr ? 'Architecte Cloud / SRE' : 'Cloud Architect / SRE',
                      isFr ? 'Développeur Front-End Senior' : 'Senior Front-End Dev',
                      isFr ? 'Directeur Technique / CTO' : 'CTO / Director'
                    ].map((trackName) => (
                      <button
                        key={trackName}
                        onClick={() => setSelectedTrack(trackName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedTrack === trackName
                            ? 'bg-indigo-950 text-white border border-indigo-950'
                            : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {trackName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Milestone Timeline Map */}
                <div className="space-y-6 relative pl-4 border-l-2 border-stone-200 pt-1 ml-2">
                  
                  {/* Step 1 */}
                  <div className="relative space-y-1">
                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-black text-xs text-stone-900 uppercase">
                        {isFr ? "Étape 1 : Expert Individuel (Actuel)" : "Stage 1: Senior Individual Contributor (Current)"}
                      </span>
                      <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 font-bold px-2 py-0.5 rounded">
                        {isFr ? "Acquis" : "Completed"}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                      {isFr
                        ? "Démontrer une diction parfaite, un format STAR robuste (80%+) et des compétences techniques impeccables."
                        : "Focusing on core engineering execution, stable speaking rate (130-150 WPM), and STAR story adherence."}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative space-y-1">
                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse" />
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-black text-xs text-stone-900 uppercase">
                        {isFr ? "Étape 2 : Lead Engineer / Leader d'Équipe" : "Stage 2: Tech Lead / Architect (1-2 Years)"}
                      </span>
                      <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded">
                        {isFr ? "Cible : 85% IPS" : "Target: 85% IPS"}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 font-semibold leading-relaxed">
                      {isFr
                        ? "Prendre la responsabilité des échecs d'équipe, structurer les post-mortems critiques et déléguer des tâches concrètes."
                        : "Developing team communication structures, crisis management, and explicit collaborative ownership frames."}
                    </p>
                    
                    {/* Skills to grow indicator for Stage 2 */}
                    <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl mt-2 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-mono tracking-wider text-stone-400 font-bold block">{isFr ? "Axe de progrès #" : "Priority skill #1"}</span>
                        <span className="font-bold text-stone-700">{isFr ? "Leadership & Délégation" : "Leadership & Delegation"}</span>
                        <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden mt-1">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${digitalTwin.leadership?.score || 55}%` }} />
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-mono tracking-wider text-stone-400 font-bold block">{isFr ? "Axe de progrès #" : "Priority skill #2"}</span>
                        <span className="font-bold text-stone-700">{isFr ? "Prise de Décision" : "Decision Making"}</span>
                        <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden mt-1">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${digitalTwin.decision_making?.score || 60}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative space-y-1">
                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full bg-stone-300 ring-4 ring-stone-100" />
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-black text-xs text-stone-400 uppercase">
                        {isFr ? "Étape 3 : Directeur Technique / CTO" : "Stage 3: Executive CTO / Director (3-5 Years)"}
                      </span>
                      <span className="font-mono text-[10px] text-stone-400 bg-stone-50 font-bold px-2 py-0.5 rounded">
                        {isFr ? "Cible : 95% IPS" : "Target: 95% IPS"}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-semibold leading-relaxed">
                      {isFr
                        ? "Négociation face à des parties prenantes hostiles, formulation de visions stratégiques globales, communication de crise devant le conseil."
                        : "Strategic organizational vision, board-level negotiation drills, and high-stakes media/crisis drills."}
                    </p>
                  </div>

                </div>

                {/* Target Practice Scenarios Required */}
                <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl space-y-3">
                  <h4 className="font-sans font-black text-[11px] text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-700" />
                    <span>{isFr ? "Simulations Shana Recommandées pour Franchir l'Étape" : "Required Milestone Simulations"}</span>
                  </h4>
                  <div className="space-y-2 text-xs text-indigo-900 font-semibold">
                    <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-indigo-100">
                      <span>{isFr ? "🚨 Simulation post-mortem de panne critique" : "🚨 Incident Post-Mortem & Stakeholder Response"}</span>
                      <button 
                        onClick={() => {
                          setSimulationLoading(isFr ? "Modèle Incident Post-Mortem..." : "Incident Post-Mortem Template...");
                          setTimeout(() => {
                            setSimulationLoading(null);
                            onChangeTab('train');
                          }, 1200);
                        }}
                        className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        {isFr ? "Lancer" : "Launch"}
                      </button>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-xl border border-indigo-100">
                      <span>{isFr ? "💼 Délégation stratégique face aux retards de projet" : "💼 Strategic Resource Delegation & Escalation"}</span>
                      <button 
                        onClick={() => {
                          setSimulationLoading(isFr ? "Modèle Gestion de crise..." : "Resource Delegation Template...");
                          setTimeout(() => {
                            setSimulationLoading(null);
                            onChangeTab('train');
                          }, 1200);
                        }}
                        className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        {isFr ? "Lancer" : "Launch"}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* 2. PERSONALIZED LEARNING PATHS */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-6">
                <div className="flex justify-between items-center border-b border-stone-150 pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                      {isFr ? "2. Parcours d'Apprentissage Ultra-Ciblés" : "2. Tailored Learning Paths"}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono font-black bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded">
                    {isFr ? "STYLE D'APPRENTISSAGE : " : "LEARNING STYLE: "}{profileState.learning.style.toUpperCase()}
                  </span>
                </div>

                {/* Sub Module Selector */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'module_01', label: isFr ? 'STAR & Métriques' : 'STAR Storytelling', progress: 66 },
                    { id: 'module_02', label: isFr ? 'Débit & Mots Remplissage' : 'Vocal & Fillers', progress: 33 },
                    { id: 'module_03', label: isFr ? 'Gestion Incidents SRE' : 'Incident Defense', progress: 0 }
                  ].map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setSelectedModuleId(mod.id)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        selectedModuleId === mod.id
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                          : 'bg-stone-50 border-stone-200 hover:border-stone-400 text-stone-700'
                      }`}
                    >
                      <p className="font-sans font-extrabold text-[10px] uppercase tracking-tight line-clamp-1">{mod.label}</p>
                      <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden mt-1.5">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${mod.progress}%` }} />
                      </div>
                      <span className="font-mono text-[8px] text-stone-400 mt-1 block">{mod.progress}% {isFr ? "fini" : "done"}</span>
                    </button>
                  ))}
                </div>

                {/* Selected Module Detail & Drills */}
                {selectedModuleId === 'module_01' && (
                  <div className="space-y-4 animate-fade-in text-xs font-semibold">
                    <div className="space-y-1">
                      <h4 className="font-sans font-black text-stone-900 text-xs uppercase">{isFr ? "Module 1 : STAR Storytelling & Structuration" : "Module 1: STAR Storytelling & Metrics"}</h4>
                      <p className="text-[11px] text-stone-500 leading-relaxed font-semibold font-medium">
                        {isFr 
                          ? "Maîtrisez la méthode STAR et forcez l'injection de données mesurables et d'impact financier dans vos récits d'architecture." 
                          : "Learn how to partition engineering challenges into clear steps and inject high-contrast data metrics into result phases."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 1.1 • Theoretical Foundation</span>
                          <span className="text-stone-700 font-bold">{isFr ? "L'Anatomie du STAR d'Ingénierie" : "Anatomy of an Engineering STAR story"}</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 1.2 • Practical Challenge</span>
                          <span className="text-stone-700 font-bold">{isFr ? "Quantifier le Succès d'un Incrément" : "Quantifying Complex Technical Outcomes"}</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 1.3 • Live Interactive simulation</span>
                          <span className="text-stone-700 font-bold">{isFr ? "Le Pitch de Projet Express (3 Minutes)" : "The 3-Minute STAR Elevator Pitch"}</span>
                        </div>
                        {drillProgress['drill_1_3'] === 'completed' ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 1.3..." : "Launching Drill 1.3...");
                              setTimeout(() => {
                                setDrillProgress(prev => ({ ...prev, 'drill_1_3': 'completed' }));
                                setSimulationLoading(null);
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedModuleId === 'module_02' && (
                  <div className="space-y-4 animate-fade-in text-xs font-semibold">
                    <div className="space-y-1">
                      <h4 className="font-sans font-black text-stone-900 text-xs uppercase">{isFr ? "Module 2 : Rythme Vocal & Suppression des Mots Parasites" : "Module 2: Pacing & Verbal Filler Eradication"}</h4>
                      <p className="text-[11px] text-stone-500 leading-relaxed font-semibold font-medium">
                        {isFr 
                          ? "Ajustez votre débit verbal pour qu'il soit stable et silencieux. Éradiquez les 'euh', 'du coup' ou 'genre' sous forte tension." 
                          : "Calibrate your acoustic cadence. Eliminate conversational pause traps (uhm, like, basically) by mastering comfortable strategic pauses."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 2.1 • Vocal Pace</span>
                          <span className="text-stone-700 font-bold">{isFr ? "Intégration du Silence Stratégique (1.5s)" : "Strategic 1.5s Silent Transitions"}</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 2.2 • Stress Tolerance</span>
                          <span className="text-stone-700 font-bold">{isFr ? "Évitement d'Hésitations sous Provocation" : "Avoid Filler Words under Direct Challenge"}</span>
                        </div>
                        {drillProgress['drill_2_2'] === 'completed' ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 2.2..." : "Launching Drill 2.2...");
                              setTimeout(() => {
                                setDrillProgress(prev => ({ ...prev, 'drill_2_2': 'completed' }));
                                setSimulationLoading(null);
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 2.3 • STAR Verbal Purity</span>
                          <span className="text-stone-700 font-bold">{isFr ? "Débit Purifié STAR sans Tic de Langage" : "Perfect STAR flow with Zero Fillers"}</span>
                        </div>
                        {drillProgress['drill_2_3'] === 'completed' ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 2.3..." : "Launching Drill 2.3...");
                              setTimeout(() => {
                                setDrillProgress(prev => ({ ...prev, 'drill_2_3': 'completed' }));
                                setSimulationLoading(null);
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedModuleId === 'module_03' && (
                  <div className="space-y-4 animate-fade-in text-xs font-semibold">
                    <div className="space-y-1">
                      <h4 className="font-sans font-black text-stone-900 text-xs uppercase">{isFr ? "Module 3 : Défense d'Incidents de Production SRE" : "Module 3: SRE Production Incident Defense"}</h4>
                      <p className="text-[11px] text-stone-500 leading-relaxed font-semibold font-medium">
                        {isFr 
                          ? "Spécialisation d'architecture. Apprenez à expliquer clairement une panne critique devant le conseil d'administration sans jargonner ou rejeter la faute." 
                          : "High-stakes scenario track. Learn how to explain complex multi-region outages to executive stakeholders while taking ownership and outlining mitigations."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 3.1 • Crisis Speech</span>
                          <span className="text-stone-700 font-bold">{isFr ? "Vulgariser un bug d'architecture" : "Translating Architecture Bugs to Business Metrics"}</span>
                        </div>
                        {drillProgress['drill_3_1'] === 'completed' ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 3.1..." : "Launching Drill 3.1...");
                              setTimeout(() => {
                                setDrillProgress(prev => ({ ...prev, 'drill_3_1': 'completed' }));
                                setSimulationLoading(null);
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>

                      <div className="p-3 bg-stone-50 border border-stone-150 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[8px] text-stone-400 uppercase tracking-wider block font-bold">Drill 3.2 • Ownership Check</span>
                          <span className="text-stone-700 font-bold">{isFr ? "Soutenir la Chronologie sous feu socratique" : "Defending Outage Timelines under Aggressive Probing"}</span>
                        </div>
                        {drillProgress['drill_3_2'] === 'completed' ? (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">{isFr ? "ACQUIS" : "COMPLETED"}</span>
                        ) : (
                          <button
                            onClick={() => {
                              setSimulationLoading(isFr ? "Lancement du Drill 3.2..." : "Launching Drill 3.2...");
                              setTimeout(() => {
                                setDrillProgress(prev => ({ ...prev, 'drill_3_2': 'completed' }));
                                setSimulationLoading(null);
                              }, 1500);
                            }}
                            className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-xl cursor-pointer"
                          >
                            {isFr ? "Pratiquer" : "Start Drill"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Academic AI Tutor Advisory Box */}
                <div className="bg-indigo-950 text-indigo-100 rounded-2xl p-4.5 space-y-2 border border-stone-900">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                    <span className="font-sans font-black text-[10px] uppercase tracking-wider text-emerald-400">{isFr ? "CONSEILLER ACADÉMIQUE SHANA" : "SHANA COGNITIVE ACADEMIC TUTOR"}</span>
                  </div>
                  
                  {(() => {
                    const style = profileState.learning.style;
                    let advisorTip = '';
                    if (style === 'Needs Confidence Building') {
                      advisorTip = isFr 
                        ? "Puisque votre style privilégie le soutien de la confiance, Shana a allégé les sanctions de débit. Concentrez-vous sur la validation des étapes 'Situation' et 'Action' de STAR, en respirant profondément entre chaque bloc de phrase."
                        : "Since your profile style requires confidence building, we have lowered speaking speed friction. Focus purely on declaring clean 'Situation' and 'Action' parameters, taking full breaths at sentence transitions.";
                    } else if (style === 'Fast Learner') {
                      advisorTip = isFr 
                        ? "Profil 'Fast Learner' détecté. L'analyse adaptative accélère votre cadence et va introduire des questions provocatrices d'échecs de production pour forcer votre régulation émotionnelle à s'ajuster en temps réel."
                        : "Fast Learner profile active. The simulator is configured to compress response timers, trigger unexpected failure-injection questions, and test real-time structural recovery under stress.";
                    } else if (style === 'Practice Oriented') {
                      advisorTip = isFr 
                        ? "Comme vous apprenez par la pratique directe, nous avons réduit la théorie de 70%. Chaque leçon est remplacée par des simulations courtes vocales de 2 minutes avec rétroaction acoustique immédiate."
                        : "As a highly simulation-oriented practitioner, cognitive lessons are replaced with live interactive voice drills. Complete 3 consecutive drills to unlock the SRE target scenarios.";
                    } else {
                      advisorTip = isFr 
                        ? "Style visuel/structuré actif. Vos rapports d'erreurs afficheront des décompositions syntaxiques exhaustives de vos réponses vocales pour vous permettre de recalibrer chaque composant de manière logique."
                        : "Structured analytic mode active. Review logs contain explicit sentence-reconstruction flows showing exactly where STAR compliance drifted, helping you optimize logically.";
                    }
                    return <p className="text-[11px] leading-relaxed text-indigo-200 font-semibold italic">"{advisorTip}"</p>;
                  })()}
                </div>

              </div>

            </div>

            {/* RIGHT COLUMN: JOB MATCHING SYSTEM (Col span 5) */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* 3. JOB MATCHING SYSTEM */}
              <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[5px_5px_0px_0px_#111] space-y-6">
                <div className="flex justify-between items-center border-b border-stone-150 pb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#18633F]" />
                    <h3 className="text-sm font-sans font-black uppercase tracking-wider text-stone-900">
                      {isFr ? "3. Système de Matching & Offres" : "3. Algorithmic Job Matching"}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono font-black bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded uppercase">
                    {isFr ? "Actif" : "Active Match"}
                  </span>
                </div>

                {/* Job Cards */}
                <div className="space-y-4">
                  {[
                    {
                      id: 'job_01',
                      title: isFr ? 'SRE Specialist' : 'SRE Specialist',
                      company: 'CloudCorp Inc.',
                      comp: isFr ? '145k€ - 175k€' : '$145k - $175k',
                      loc: isFr ? 'Paris / Hybride' : 'Paris / Hybrid',
                      match: Math.min(95, Math.max(45, averageCompetencyScore + 4)),
                      desc: isFr 
                        ? "Diriger une équipe de 6 ingénieurs gérant des grappes Kubernetes multi-régions sur GCP avec une SLA stricte de 99,99%." 
                        : "Leading high-concurrency cloud infrastructure migrations, SRE tooling, and incident response structures under high availability constraints.",
                      strengths: isFr 
                        ? ["Diction vocale extrêmement stable", "Structure STAR robuste sur les pannes"] 
                        : ["Outstanding speech stability (142 WPM)", "Highly structured post-mortem storytelling"],
                      gaps: isFr 
                        ? ["Formulation du travail collaboratif / délégation"] 
                        : ["Weak collaboration/delegation metrics (I vs We)"]
                    },
                    {
                      id: 'job_02',
                      title: isFr ? 'Architecte Plateforme Senior' : 'Lead Platform Architect',
                      company: 'FinTechScale',
                      comp: isFr ? '155k€ - 185k€' : '$155k - $185k',
                      loc: isFr ? 'Télétravail France' : 'Remote / France',
                      match: Math.min(95, Math.max(40, averageCompetencyScore - 5)),
                      desc: isFr 
                        ? "Concevoir des architectures transactionnelles hautement sécurisées sur Cloud Spanner et orchestrer les migrations de données." 
                        : "Designing secure ledger processing pipelines and migrating database infrastructures to globally distributed cloud environments.",
                      strengths: isFr 
                        ? ["Clarté des réponses conceptuelles", "Très faible taux de mots parasites"] 
                        : ["Clear conceptual responses", "Extremely low verbal filler density"],
                      gaps: isFr 
                        ? ["Score d'assurance sous provocations surprise"] 
                        : ["Needs confidence stabilization under rapid challenges"]
                    },
                    {
                      id: 'job_03',
                      title: 'Technical Product Manager',
                      company: 'ShanaGroup Logistics',
                      comp: isFr ? '110k€ - 130k€' : '$110k - $130k',
                      loc: isFr ? 'Marseille / Présentiel' : 'Marseille / Onsite',
                      match: Math.min(95, Math.max(30, Math.round(averageCompetencyScore * 0.7 + 10))),
                      desc: isFr 
                        ? "Gérer les feuilles de route produits logistiques et arbitrer les priorités avec 4 équipes d'ingénierie." 
                        : "Coordinating cross-functional schedules and translating business requests to precise engineering backlogs.",
                      strengths: isFr 
                        ? ["Compréhension globale du produit"] 
                        : ["Good conceptual product understanding"],
                      gaps: isFr 
                        ? ["Manque d'exemples chiffrés", "Trop de mots de remplissage"] 
                        : ["Absence of numeric KPIs in STAR answers", "High filler-word frequency"]
                    }
                  ].map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`p-4 rounded-3xl border transition-all text-left cursor-pointer space-y-3 ${
                        selectedJobId === job.id
                          ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                          : 'bg-white border-stone-200 hover:border-stone-400 text-stone-900'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <h4 className="font-sans font-black text-xs uppercase leading-snug">{job.title}</h4>
                          <p className={`text-[10px] font-bold ${selectedJobId === job.id ? 'text-stone-300' : 'text-stone-500'}`}>{job.company}</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-black text-sm block ${selectedJobId === job.id ? 'text-[#A7F3D0]' : 'text-indigo-600'}`}>{job.match}%</span>
                          <span className="text-[8px] uppercase tracking-wider text-stone-400 block font-bold leading-none">{isFr ? "COMPATIBILITÉ" : "COMPATIBILITY"}</span>
                        </div>
                      </div>

                      {/* Quick Meta */}
                      <div className="flex gap-3 text-[9px] font-mono uppercase font-bold text-stone-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.loc}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.comp}</span>
                      </div>

                      {/* Expanded Section if Selected */}
                      {selectedJobId === job.id && (
                        <div className="pt-3 border-t border-stone-800 space-y-3 animate-fade-in text-[11px] font-semibold">
                          <p className="text-stone-300 leading-relaxed font-semibold">
                            {job.desc}
                          </p>
                          
                          {/* Strengths & Gaps Analysis */}
                          <div className="space-y-2 pt-1">
                            <div className="space-y-1">
                              <span className="text-[8.5px] uppercase font-mono tracking-widest text-[#A7F3D0] block font-bold">{isFr ? "Points Forts Validés :" : "Verified Fit Strengths:"}</span>
                              <ul className="space-y-1 pl-2 text-stone-200 font-semibold">
                                {job.strengths.map((str, i) => (
                                  <li key={i} className="flex gap-1.5 items-start">
                                    <span className="text-emerald-400">✓</span>
                                    <span>{str}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-[8.5px] uppercase font-mono tracking-widest text-rose-300 block font-bold">{isFr ? "Axe de Recalibrage :" : "Missing / Gaps to close:"}</span>
                              <ul className="space-y-1 pl-2 text-stone-300 font-semibold">
                                {job.gaps.map((gap, i) => (
                                  <li key={i} className="flex gap-1.5 items-start">
                                    <span className="text-rose-400">✗</span>
                                    <span>{gap}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Launch button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSimulationLoading(isFr ? `Initialisation de la simulation pour ${job.company}...` : `Launching tailored simulation for ${job.company}...`);
                              setTimeout(() => {
                                setSimulationLoading(null);
                                onChangeTab('train');
                              }, 1500);
                            }}
                            className="w-full mt-2 py-2 bg-[#A7F3D0] hover:bg-[#86efac] text-stone-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>{isFr ? "Lancer l'Entretien Dédié" : "Launch Target Job Interview"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// Help sub-components
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
