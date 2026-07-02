import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Compass, 
  Lightbulb, 
  TrendingUp, 
  Bookmark, 
  Archive, 
  ArrowLeft, 
  CheckCircle2, 
  Settings, 
  HelpCircle, 
  ShieldAlert,
  Sliders,
  ChevronRight,
  Flame,
  Volume2,
  Lock,
  Play,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { SerendipityService, DiscoveryItem, PatternMetrics, Experiment } from '../lib/serendipity';
import { SessionHistoryItem, UserProfile, Language } from '../types';
import { useToast } from './Toast';

interface DiscoveriesViewProps {
  user: UserProfile;
  lang: Language;
  history: SessionHistoryItem[];
  onStartSurpriseInterview: (config: any) => void;
}

export default function DiscoveriesView({ user, lang, history, onStartSurpriseInterview }: DiscoveriesViewProps) {
  const { addToast } = useToast();
  const [discoveries, setDiscoveries] = useState<DiscoveryItem[]>([]);
  const [metrics, setMetrics] = useState<PatternMetrics | null>(null);
  const [blindSpot, setBlindSpot] = useState<{ area: string; explanation: string } | null>(null);
  const [personality, setPersonality] = useState<any>(null);
  const [scoreData, setScoreData] = useState<any>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);

  // Filters & Tabs
  const [filterType, setFilterType] = useState<'all' | 'favorited' | 'archived'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timeline' | 'experiments' | 'settings'>('dashboard');
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);

  // Load serendipity data on mount/update
  const refreshData = () => {
    const userId = user.id || 'usr_candidate';
    const discList = SerendipityService.getDiscoveries(userId);
    const patMetrics = SerendipityService.getPatternMetrics(userId, history);
    const bs = SerendipityService.getBlindSpot(userId, history);
    const pers = SerendipityService.getPersonalityProfile(userId, history);
    const sc = SerendipityService.getSerendipityScore(userId, history);
    const exps = SerendipityService.getExperiments(userId);
    const sett = SerendipityService.getSettings(userId);
    const rec = SerendipityService.getSmartRecommendation(userId, history);

    setDiscoveries(discList);
    setMetrics(patMetrics);
    setBlindSpot(bs);
    setPersonality(pers);
    setScoreData(sc);
    setExperiments(exps);
    setSettings(sett);
    setRecommendation(rec);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('shana_serendipity_update', refreshData);
    return () => window.removeEventListener('shana_serendipity_update', refreshData);
  }, [user.id, history]);

  const handleFavoriteToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = user.id || 'usr_candidate';
    SerendipityService.toggleFavorite(userId, id);
    addToast({
      title: lang === 'FR' ? "Découverte mise à jour" : "Discovery Updated",
      description: lang === 'FR' ? "Statut favori modifié" : "Favorited status toggled",
      type: "info"
    });
  };

  const handleArchiveToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = user.id || 'usr_candidate';
    SerendipityService.toggleArchive(userId, id);
    addToast({
      title: lang === 'FR' ? "Découverte archivée" : "Discovery Archived",
      description: lang === 'FR' ? "Statut archive mis à jour" : "Archive status modified",
      type: "info"
    });
  };

  const handleFrequencyChange = (freq: 'auto' | 'minimal' | 'off') => {
    const userId = user.id || 'usr_candidate';
    const updated = { 
      ...settings, 
      frequency: freq, 
      enabled: freq !== 'off' 
    };
    SerendipityService.saveSettings(userId, updated);
    addToast({
      title: lang === 'FR' ? "Mode de Sérendipité" : "Serendipity Frequency Mode",
      description: freq === 'auto' 
        ? (lang === 'FR' ? "Mode Automatique activé !" : "Automatic mode activated!")
        : freq === 'minimal'
          ? (lang === 'FR' ? "Mode Minimaliste activé" : "Minimal mode activated")
          : (lang === 'FR' ? "Module désactivé" : "Module completely disabled"),
      type: "success"
    });
  };

  const handleTogglePrivate = () => {
    const userId = user.id || 'usr_candidate';
    const updated = { ...settings, privateMode: !settings.privateMode };
    SerendipityService.saveSettings(userId, updated);
    addToast({
      title: lang === 'FR' ? "Mode Privé" : "Private Mode",
      description: updated.privateMode 
        ? (lang === 'FR' ? "Masquage des rapports tiers activé" : "Hiding third-party reports enabled")
        : (lang === 'FR' ? "Partage de rapports réactivé" : "Sharing reports re-enabled"),
      type: "info"
    });
  };

  const handleReset = () => {
    if (confirm(lang === 'FR' ? "Êtes-vous sûr de vouloir réinitialiser toutes vos découvertes ?" : "Are you sure you want to reset all discoveries?")) {
      const userId = user.id || 'usr_candidate';
      SerendipityService.resetDiscoveries(userId);
      addToast({
        title: lang === 'FR' ? "Données Réinitialisées" : "Data Purged",
        description: lang === 'FR' ? "Toutes les découvertes ont été supprimées." : "All discoveries have been cleared.",
        type: "warning"
      });
    }
  };

  // Launch surprise interview
  const handleLaunchSurprise = () => {
    // Random elements builder
    const personalities = [
      { id: 'friendly', nameEN: 'Warm & Supportive Partner', nameFR: 'Partenaire Chaleureux' },
      { id: 'fast', nameEN: 'Rapid-fire Speed-dater', nameFR: 'Intervieweur Rapide & Direct' },
      { id: 'silent', nameEN: 'Silent & Poker-faced Expert', nameFR: 'Expert Silencieux & Impassible' },
      { id: 'pressure', nameEN: 'High-pressure Inquisitor', nameFR: 'Recruteur Strict sous Pression' }
    ];

    const styles = [
      { id: 'trick', nameEN: 'Trick/Lateral Thinking Questions', nameFR: 'Questions Pièges et Latérales' },
      { id: 'scenario', nameEN: 'Crisis Situations & Scenarios', nameFR: 'Scénarios de Crises Réels' },
      { id: 'technical', nameEN: 'Deep System Technical Dive', nameFR: 'Plongée Technique Profonde' },
      { id: 'competency', nameEN: 'Value-driven Competency Drill', nameFR: 'Évaluation des Compétences Clés' }
    ];

    const industries = ['FinTech', 'HealthTech', 'Aerospace', 'Venture Capital', 'SaaS Enterprise', 'E-commerce'];
    const formats = ['Voice Call', 'Mirror Video Diagnostic'];

    const chosenPers = personalities[Math.floor(Math.random() * personalities.length)];
    const chosenStyle = styles[Math.floor(Math.random() * styles.length)];
    const chosenIndustry = industries[Math.floor(Math.random() * industries.length)];
    const chosenFormat = formats[Math.floor(Math.random() * formats.length)];
    
    // Difficulty is current + 1 level if available
    const difficultyMap: Record<string, string> = { 'junior': 'Mid', 'mid': 'Senior', 'senior': 'Executive', 'executive': 'Executive' };
    const currentDiff = user.experienceLevel || 'mid';
    const chosenDiff = difficultyMap[currentDiff] || 'Mid';

    const surpriseConfig = {
      isSurprise: true,
      personality: chosenPers,
      style: chosenStyle,
      industry: chosenIndustry,
      format: chosenFormat,
      difficulty: chosenDiff
    };

    onStartSurpriseInterview(surpriseConfig);
  };

  const handleStartExp = (exp: Experiment) => {
    const userId = user.id || 'usr_candidate';
    SerendipityService.startExperiment(userId, exp.id);
    addToast({
      title: lang === 'FR' ? "Expérience Activée" : "Experiment Active",
      description: lang === 'FR' 
        ? `L'expérience "${exp.name}" a été démarrée.` 
        : `Experiment "${exp.name}" is now running.`,
      type: "success"
    });
    // Launch a tailored surprise interview with this variable
    onStartSurpriseInterview({
      isSurprise: true,
      experimentId: exp.id,
      experimentVariable: exp.variable,
      personality: { id: 'friendly', nameEN: 'Friendly Scientist', nameFR: 'Scientifique Amical' },
      style: { id: 'scenario', nameEN: 'Experiment Protocols', nameFR: 'Protocoles de Test' },
      industry: 'Human Behavior Research',
      format: exp.variable === 'audio_only' ? 'Voice Call' : 'Mirror Video Diagnostic',
      difficulty: 'Mid'
    });
  };

  if (!settings) return null;

  // Filter discoveries
  const displayedDiscoveries = discoveries.filter(item => {
    if (filterType === 'favorited' && !item.favorited) return false;
    if (filterType === 'archived' && !item.archived) return false;
    if (filterType === 'all' && item.archived) return false; // hide archived by default in all
    
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    return true;
  });

  return (
    <div id="serendipity-engine-root" className="max-w-5xl mx-auto space-y-8 pb-12 font-sans">
      
      {/* Header Banner */}
      <div className="bg-stone-900 text-white rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md border border-stone-850">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <span className="font-mono text-[10px] tracking-widest text-amber-400 uppercase font-bold">
              {lang === 'FR' ? "MODULE SÉRENDIPITÉ PRO" : "SERENDIPITY DISCOVERY LAYER"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            {lang === 'FR' ? "Espace de Découvertes SHANA" : "SHANA Discovery Suite"}
          </h1>
          <p className="text-stone-300 text-xs leading-relaxed max-w-xl font-medium">
            {lang === 'FR' 
              ? "Accédez aux analyses comportementales, détectez vos angles morts et testez vos forces à travers des simulations imprévisibles." 
              : "Analyze hidden behavioral patterns, uncover cognitive blind spots, and run real-time micro-experiments to optimize retention."}
          </p>
        </div>

        <button
          onClick={handleLaunchSurprise}
          disabled={!settings.enabled}
          className={`px-5 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer border border-amber-400`}
        >
          <Sparkles className="w-4 h-4 text-stone-950" />
          <span>{lang === 'FR' ? "Entretien Surprise" : "Surprise Me!"}</span>
        </button>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'dashboard' 
              ? 'border-stone-900 text-stone-950 font-extrabold' 
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          {lang === 'FR' ? "Tableau d'Analyse" : "Coaching Analytics"}
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'timeline' 
              ? 'border-stone-900 text-stone-950 font-extrabold' 
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          {lang === 'FR' ? "Mes Découvertes" : "My Discoveries"}
        </button>
        <button
          onClick={() => setActiveTab('experiments')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'experiments' 
              ? 'border-stone-900 text-stone-950 font-extrabold' 
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          {lang === 'FR' ? "Laboratoire d'Expériences" : "Experiments Lab"}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'settings' 
              ? 'border-stone-900 text-stone-950 font-extrabold' 
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          {lang === 'FR' ? "Paramètres" : "Settings"}
        </button>
      </div>

      {/* TAB Content Rendering */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Card 1: Serendipity Score & Level (Feature 9) */}
          <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <span className="font-mono text-[9px] font-bold text-stone-400 block uppercase tracking-widest">
                {lang === 'FR' ? "INDEX D'ADAPTABILITÉ COGNITIVE" : "SERENDIPITY METRIC INDEX"}
              </span>
              <h3 className="font-sans font-bold text-base text-stone-900">
                {lang === 'FR' ? "Score de Découverte" : "Discovery Score"}
              </h3>
              
              <div className="py-6 flex flex-col items-center justify-center relative">
                <div className="w-28 h-28 rounded-full border-4 border-stone-100 flex items-center justify-center shadow-inner">
                  <div className="text-center">
                    <span className="text-3xl font-black text-stone-900">{scoreData?.score}</span>
                    <span className="text-stone-400 text-xs font-bold">/100</span>
                  </div>
                </div>
                
                <span className="mt-4 px-3 py-1 bg-stone-900 text-white font-mono text-[10px] font-bold rounded-full uppercase tracking-wider">
                  {scoreData?.level}
                </span>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-4 space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-stone-500 font-mono">
                <span>{lang === 'FR' ? "Prochain Niveau :" : "Next Badge :"} {scoreData?.nextLevel}</span>
                <span>{scoreData?.progressToNext}%</span>
              </div>
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${scoreData?.progressToNext}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 2: Interview Personality Map (Feature 7) */}
          <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <span className="font-mono text-[9px] font-bold text-stone-400 block uppercase tracking-widest">
                {lang === 'FR' ? "PROFIL INTERACTIF DÉTECTÉ" : "INTERVIEW COGNITIVE PAIRING"}
              </span>
              <div>
                <h3 className="font-sans font-black text-lg text-stone-900">
                  {personality?.title}
                </h3>
                <span className="text-[10px] font-bold text-amber-600 uppercase font-mono tracking-wider block mt-0.5">
                  {personality?.subtitle}
                </span>
              </div>

              <p className="text-[#6B7280] text-xs leading-relaxed font-semibold">
                {personality?.description}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {personality?.traits.map((trait: string, idx: number) => (
                  <span key={idx} className="bg-stone-50 border border-stone-200 px-2 py-1 text-[10px] font-bold text-stone-700 rounded-lg">
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-stone-100 pt-3 flex items-center justify-between text-[9px] text-stone-400 font-mono">
              <span>{lang === 'FR' ? "MIS À JOUR APRÈS CHAQUE RUN" : "AUTO-UPDATED ON RUN"}</span>
              <UserCheck className="w-4 h-4 text-stone-400" />
            </div>
          </div>

          {/* Card 3: Smart Recommendation & Insights (Feature 4) */}
          <div className="bg-white border border-stone-200 rounded-[32px] p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <span className="font-mono text-[9px] font-bold text-stone-400 block uppercase tracking-widest">
                {lang === 'FR' ? "PLAN D'ACTION SUIVANT" : "NEXT ACTION DIRECTIVE"}
              </span>
              <h3 className="font-sans font-bold text-base text-stone-900 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{lang === 'FR' ? "Action Recommandée" : "Smart Action"}</span>
              </h3>

              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-stone-900 leading-snug">
                  "{recommendation?.text}"
                </p>
                <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
                  {recommendation?.why}
                </p>
              </div>

              {/* Explaining feature (Feature 11) */}
              <button
                onClick={() => {
                  alert(lang === 'FR' 
                    ? `Explication : Cette recommandation de préparation est générée à l'aide de l'analyse comportementale de vos logs d'entraînement (${history.length} sessions). Elle vise à équilibrer vos WPM par rapport aux exigences du poste de ${user.targetRole || 'Professional'}.`
                    : `Explanation: This targeted training directive is automatically compiled from your speech metrics database across ${history.length} active sessions. It is designed to balance your vocal velocity (WPM) with the core hiring standards of a ${user.targetRole || 'Professional'} role.`
                  );
                }}
                className="text-[10px] text-amber-700 hover:text-amber-800 font-mono font-bold tracking-wide flex items-center gap-1 underline cursor-pointer"
              >
                {lang === 'FR' ? "Pourquoi cette recommandation ?" : "Why am I seeing this?"}
              </button>
            </div>

            <div className="border-t border-stone-100 pt-3 text-[9px] text-[#9CA3AF] font-bold font-mono">
              {lang === 'FR' ? "LIMITE : UN SEUL CONSEIL STRATÉGIQUE" : "CONSTRAINT: SINGLE HIGH-IMPACT ADVICE"}
            </div>
          </div>

          {/* Blind Spot Detector Row (Feature 8) */}
          {blindSpot && (
            <div className="md:col-span-3 bg-red-50/40 border border-red-150 rounded-[32px] p-6 shadow-xs flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 border border-red-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-grow">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] font-black text-red-800 tracking-wider bg-red-100 border border-red-200 px-2 py-0.5 rounded-md uppercase">
                    {lang === 'FR' ? "ANGLE MORT COMPORTEMENTAL" : "COGNITIVE BLIND SPOT TARGET"}
                  </span>
                  <span className="font-mono text-[9px] text-stone-400 font-bold">
                    {lang === 'FR' ? "⚠ Piste de réflexion" : "⚠ Exploration Node"}
                  </span>
                </div>
                <h4 className="text-xs font-black text-stone-900 uppercase tracking-wide">
                  {blindSpot.area}
                </h4>
                <p className="text-[11px] text-stone-600 leading-relaxed font-semibold">
                  {blindSpot.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Behavioral Patterns Panel (Feature 3) */}
          <div className="md:col-span-3 bg-[#F9FAFB]/50 border border-stone-200 rounded-[32px] p-6 space-y-6">
            <div className="border-b border-stone-200/55 pb-3">
              <h3 className="font-sans font-black text-xs text-stone-900 uppercase tracking-widest">
                {lang === 'FR' ? "Signaux Comportementaux Détectés" : "Biometric behavioral patterns"}
              </h3>
              <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold mt-0.5">
                {lang === 'FR' ? "Indicateurs collectés par l'analyse adaptative" : "Dynamic metric streams parsed from active voice simulations"}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[9px] font-mono text-stone-400 font-bold block uppercase">{lang === 'FR' ? "ÉLOCUTION" : "SPEAKING SPEED"}</span>
                <span className="text-xl font-black text-stone-900 block mt-1">{metrics?.speakingSpeed} WPM</span>
                <span className="text-[9px] text-stone-500 font-medium block mt-0.5">
                  {metrics && metrics.speakingSpeed > 140 ? (lang === 'FR' ? "Cadence accélérée" : "Accelerated flow") : (lang === 'FR' ? "Vitesse idéale" : "Optimal cadence")}
                </span>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[9px] font-mono text-stone-400 font-bold block uppercase">{lang === 'FR' ? "MÉMOIRE TRANSCRIPTION" : "AVERAGE TRANSCRIPT"}</span>
                <span className="text-xl font-black text-stone-900 block mt-1">{metrics?.avgAnswerLength} {lang === 'FR' ? "mots" : "words"}</span>
                <span className="text-[9px] text-stone-500 font-medium block mt-0.5">
                  {lang === 'FR' ? "Par réponse" : "Per response statement"}
                </span>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[9px] font-mono text-stone-400 font-bold block uppercase">{lang === 'FR' ? "DURÉE DES PAUSES" : "SILENCE LATENCY"}</span>
                <span className="text-xl font-black text-stone-900 block mt-1">{metrics?.pauseDuration}s</span>
                <span className="text-[9px] text-stone-500 font-medium block mt-0.5">
                  {lang === 'FR' ? "Avant formulation" : "Response pre-formulation pause"}
                </span>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[9px] font-mono text-stone-400 font-bold block uppercase">{lang === 'FR' ? "SUCCÈS GLOBAL" : "SESSION COMPLETION"}</span>
                <span className="text-xl font-black text-stone-900 block mt-1">{metrics?.completionRate}%</span>
                <span className="text-[9px] text-stone-500 font-medium block mt-0.5">
                  {lang === 'FR' ? "Taux de rétention" : "Challenge finishing index"}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-t border-stone-200/55 pt-4">
              <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-stone-500">
                {lang === 'FR' ? "Analyses Comportementales :" : "Pattern Diagnostics:"}
              </span>
              <ul className="space-y-2">
                {metrics?.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-stone-950 mt-0.5 shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50 border border-stone-200 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                  filterType === 'all' ? 'bg-stone-950 text-white' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {lang === 'FR' ? "Toutes" : "All Discoveries"}
              </button>
              <button
                onClick={() => setFilterType('favorited')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                  filterType === 'favorited' ? 'bg-stone-950 text-white' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {lang === 'FR' ? "Favorites" : "Favorites Only"}
              </button>
              <button
                onClick={() => setFilterType('archived')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                  filterType === 'archived' ? 'bg-stone-950 text-white' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {lang === 'FR' ? "Archivées" : "Archived Logs"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase">
                {lang === 'FR' ? "Catégorie :" : "Focus Area :"}
              </span>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="bg-white border border-stone-200 rounded-lg text-xs font-bold p-1 px-2 text-stone-800"
              >
                <option value="all">{lang === 'FR' ? "Toutes" : "All Category types"}</option>
                <option value="strength">{lang === 'FR' ? "Forces" : "Strengths"}</option>
                <option value="pattern">{lang === 'FR' ? "Patterns" : "Patterns"}</option>
                <option value="method">{lang === 'FR' ? "Méthodologie" : "Methodologies"}</option>
                <option value="opportunity">{lang === 'FR' ? "Opportunités" : "Opportunities"}</option>
              </select>
            </div>
          </div>

          {/* Discovery List Timeline (Feature 5) */}
          {displayedDiscoveries.length === 0 ? (
            <div className="py-16 text-center bg-white border border-stone-200 rounded-[32px] p-6 shadow-2xs text-stone-400 font-mono text-xs font-bold">
              {lang === 'FR' ? "Aucune découverte ne correspond aux filtres actuels." : "No active discoveries found matching the selected parameters."}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedDiscoveries.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white border border-stone-200 hover:border-stone-450 transition-all rounded-[24px] p-5 shadow-2xs space-y-3 relative group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[9px] text-[#9CA3AF] font-bold">
                          {item.date}
                        </span>
                        <span className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold rounded border ${
                          item.category === 'strength' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : (item.category === 'pattern' ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-indigo-50 text-indigo-800 border-indigo-100')
                        }`}>
                          {item.category}
                        </span>
                        {item.experimentId && (
                          <span className="bg-indigo-600 text-white font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded border border-indigo-700 shadow-sm">
                            🔬 EXPERIMENT TARGET
                          </span>
                        )}
                        <span className="text-[10px] text-stone-500 font-medium">
                          {lang === 'FR' ? "Via" : "Extracted from"} <strong className="font-bold">{item.exerciseName}</strong>
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-bold text-stone-900 leading-snug">
                        💡 {item.text}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleFavoriteToggle(item.id, e)}
                        className={`p-2 border rounded-xl hover:bg-stone-50 transition-all cursor-pointer ${
                          item.favorited ? 'border-amber-400 bg-amber-50/50 text-amber-600' : 'border-stone-200 text-stone-400 hover:text-stone-700'
                        }`}
                        title="Favorite"
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={(e) => handleArchiveToggle(item.id, e)}
                        className={`p-2 border rounded-xl hover:bg-stone-50 transition-all cursor-pointer ${
                          item.archived ? 'border-stone-900 bg-stone-50 text-stone-900' : 'border-stone-200 text-stone-400 hover:text-stone-700'
                        }`}
                        title="Archive"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Why/Explanation (Feature 11 / Feature 5) */}
                  <div className="pt-3 border-t border-stone-100/75 flex justify-between items-center gap-4">
                    <button
                      onClick={() => setExplainingId(explainingId === item.id ? null : item.id)}
                      className="text-[10px] text-stone-500 hover:text-stone-800 font-mono font-bold tracking-wide flex items-center gap-1 cursor-pointer"
                    >
                      <span>{explainingId === item.id ? (lang === 'FR' ? "Masquer explication" : "Hide explanation") : (lang === 'FR' ? "Pourquoi cette découverte ?" : "Explain Discovery Factors")}</span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${explainingId === item.id ? 'rotate-90' : ''}`} />
                    </button>
                    
                    <span className="text-[10px] font-mono font-extrabold text-stone-600">
                      {lang === 'FR' ? "SCORE : " : "SCORE INDICES : "} {item.score}/100
                    </span>
                  </div>

                  {explainingId === item.id && (
                    <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 leading-relaxed font-medium animate-slide-up mt-2">
                      {item.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {activeTab === 'experiments' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-indigo-50/55 border border-indigo-150 rounded-[32px] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-700" />
              <h3 className="font-sans font-black text-sm text-stone-950 uppercase tracking-widest">
                {lang === 'FR' ? "Laboratoire de Micro-Expériences IA" : "AI Micro Experiments Lab"}
              </h3>
            </div>
            <p className="text-[#6B7280] text-xs leading-relaxed font-semibold max-w-xl">
              {lang === 'FR'
                ? "L'IA de SHANA peut lancer de courts tests isolés lors de vos prochaines simulations pour mesurer précisément comment la pression temporelle ou l'affichage de texte impactent vos performances cognitives."
                : "Initiate micro-experiments to isolate variables like stress, prompting cues, or timing caps to analyze what structural parameters generate your absolute peak scores."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {experiments.map((exp) => (
              <div 
                key={exp.id}
                className="bg-white border border-stone-200 rounded-[24px] p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-1 rounded-full font-mono text-[9px] uppercase font-bold tracking-wider border ${
                      exp.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : (exp.status === 'active' ? 'bg-indigo-50 text-indigo-800 border-indigo-200 animate-pulse' : 'bg-stone-50 text-stone-600 border-stone-200')
                    }`}>
                      {exp.status === 'completed' ? (lang === 'FR' ? "Complétée" : "Completed") : (exp.status === 'active' ? (lang === 'FR' ? "En cours" : "Active Run") : (lang === 'FR' ? "Disponible" : "Ready to Launch"))}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-bold text-stone-900 leading-snug">
                    {exp.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
                    {exp.description}
                  </p>
                </div>

                {exp.status === 'completed' && exp.result && (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[10px] text-emerald-800 leading-relaxed font-bold font-mono">
                    ✓ {exp.result}
                  </div>
                )}

                <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
                  <span className="text-[10px] text-stone-400 font-mono font-medium">
                    VARIABLE: {exp.variable.toUpperCase()}
                  </span>
                  
                  {exp.status !== 'completed' && (
                    <button
                      onClick={() => handleStartExp(exp)}
                      className={`px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer ${
                        exp.status === 'active'
                          ? 'bg-stone-150 border border-stone-300 text-stone-600 hover:bg-stone-200'
                          : 'bg-stone-900 text-white hover:bg-stone-850'
                      }`}
                    >
                      {exp.status === 'active' ? (lang === 'FR' ? "Relancer" : "Restart") : (lang === 'FR' ? "Démarrer" : "Launch Lab")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white border border-stone-200 rounded-[32px] p-6 space-y-6 animate-fade-in">
          <div className="border-b border-stone-200/55 pb-3">
            <h3 className="font-sans font-black text-xs text-stone-900 uppercase tracking-widest">
              {lang === 'FR' ? "Contrôle de Sérendipité et Confidentialité" : "User Discovery control center"}
            </h3>
            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold mt-0.5">
              {lang === 'FR' ? "Gérez vos préférences d'analyse et de protection des données" : "Configure telemetry pipelines, reset local memory, and private constraints"}
            </p>
          </div>

          <div className="space-y-4">
            {/* Discovery Frequency Selector (Automatic, Minimal, Off) */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200/55">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-stone-900">
                  {lang === 'FR' ? "Contrôle d'Intensité Sérendipité" : "Serendipity Frequency & Trigger Level"}
                </h4>
                <p className="text-[10px] text-stone-500 leading-relaxed font-semibold">
                  {lang === 'FR' 
                    ? "Choisissez l'intensité d'accompagnement de l'IA lors de vos simulations" 
                    : "Select the frequency level of real-time AI nudges, discoveries, and adaptive triggers"}
                </p>
              </div>

              <div className="flex gap-1.5 self-start sm:self-center">
                {([
                  { id: 'auto', labelEN: 'Automatic', labelFR: 'Automatique' },
                  { id: 'minimal', labelEN: 'Minimal', labelFR: 'Minimaliste' },
                  { id: 'off', labelEN: 'Off', labelFR: 'Désactivé' }
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleFrequencyChange(opt.id)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border cursor-pointer transition-all ${
                      (settings.frequency === opt.id || (!settings.frequency && opt.id === (settings.enabled ? 'auto' : 'off')))
                        ? 'bg-stone-900 border-stone-900 text-white'
                        : 'bg-white border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-400'
                    }`}
                  >
                    {lang === 'FR' ? opt.labelFR : opt.labelEN}
                  </button>
                ))}
              </div>
            </div>

            {/* Private mode */}
            <div className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-200/55">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-stone-900">
                  {lang === 'FR' ? "Mode Privé Sécurisé" : "Private telemetry mode"}
                </h4>
                <p className="text-[10px] text-stone-500 leading-relaxed font-semibold">
                  {lang === 'FR' ? "Vos découvertes comportementales restent locales et ne sont pas incluses dans les rapports PDF d'évaluation" : "Prevents raw discovery metrics or cognitive blind spots from compiling into shared PDF reports"}
                </p>
              </div>

              <button
                onClick={handleTogglePrivate}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg border cursor-pointer ${
                  settings.privateMode 
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                    : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {settings.privateMode ? (lang === 'FR' ? "ACTIF" : "ON") : (lang === 'FR' ? "INACTIF" : "OFF")}
              </button>
            </div>

            {/* Reset discoveries */}
            <div className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-200/55">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-stone-900">
                  {lang === 'FR' ? "Réinitialiser toutes les Découvertes" : "Reset discoveries & telemetry"}
                </h4>
                <p className="text-[10px] text-stone-500 leading-relaxed font-semibold">
                  {lang === 'FR' ? "Supprime l'intégralité de l'historique des découvertes de votre profil" : "Purges all local history tables and logs. This actions is irreversible."}
                </p>
              </div>

              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 cursor-pointer"
              >
                {lang === 'FR' ? "RÉINITIALISER" : "RESET DATA"}
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
