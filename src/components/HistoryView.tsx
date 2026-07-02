import React, { useState, useMemo } from 'react';
import { SessionHistoryItem, Language, UserProfile } from '../types';
import { translations } from '../translations';
import { generateReportPDF } from '../utils/pdfGenerator';
import CalendarScheduler from './CalendarScheduler';
import { 
  Clock, 
  MessageSquare, 
  Video, 
  ArrowUpRight, 
  TrendingUp, 
  Calendar, 
  ShieldAlert, 
  Award, 
  FileText, 
  Download, 
  CheckCircle, 
  Loader2, 
  Play, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronUp,
  X,
  LayoutGrid,
  List,
  Search,
  Sparkles,
  Flame,
  Check
} from 'lucide-react';

interface HistoryViewProps {
  history: SessionHistoryItem[];
  lang: Language;
  user?: UserProfile;
}

export default function HistoryView({ history, lang, user }: HistoryViewProps) {
  const t = translations[lang];
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [activeQuestionTabs, setActiveQuestionTabs] = useState<{ [itemId: string]: number }>({});
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportSuccessId, setExportSuccessId] = useState<string | null>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  
  // Interactive Controls State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'assess' | 'train'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const defaultUser: UserProfile = {
    name: "SHANA Candidate",
    email: "candidate@shana.ai",
    targetRole: "Professional",
    industry: "Industry",
    experienceLevel: "senior"
  };

  const detailTranslations = {
    EN: {
      detailsTitle: "Question-by-Question Deep Diagnostic",
      detailsSub: "Click phases to inspect detailed metrics",
      promptedQuestion: "PROMPTED QUESTION",
      speakingTempo: "Speaking Tempo",
      verbalClarity: "Verbal Clarity",
      aiReadiness: "AI Readiness Index",
      keyPositive: "Key Strengths",
      improvementTip: "Development Area",
      downloadPdf: "Download PDF Report",
      downloading: "Generating PDF...",
      pdfSuccess: "PDF Export Completed!",
      viewReport: "Expand Analysis & Reviews",
      hideReport: "Collapse Analysis",
      noDetails: "No detailed question-by-question metrics recorded for this voice drill. Complete a formal 5-phase Assessment to log multi-axis indicators.",
      phaseLabel: "Phase",
      score: "Score",
      tempo: "Tempo",
      clarity: "Clarity",
      readiness: "Readiness",
      secScores: "Multi-Axis Performance Calibration",
      resume: "Resume Fit",
      industry: "Industry Match",
      comms: "Voice Fluency",
      poise: "Confidence Poise",
      adapt: "Adaptability",
      behavior: "Behavioral",
      
      // New dashboard translations
      statsOverview: "Progression KPIs",
      avgScoreLabel: "Average Competency",
      totalSessionsLabel: "Completed Sessions",
      bestScoreLabel: "Peak Performance",
      searchPlaceholder: "Search by date, directive or keyword...",
      allFilter: "All Formats",
      assessFilter: "Mock Assessments",
      trainFilter: "Voice Drills",
      layoutGrid: "Grid Mode",
      layoutList: "List Mode"
    },
    FR: {
      detailsTitle: "Diagnostic Approfondi Question par Question",
      detailsSub: "Cliquez sur une phase pour inspecter",
      promptedQuestion: "QUESTION POSÉE",
      speakingTempo: "Tempo d'élocution",
      verbalClarity: "Clarté de la voix",
      aiReadiness: "Indice d'Éligibilité IA",
      keyPositive: "Points Forts Marquants",
      improvementTip: "Axe d'Amélioration Recommandé",
      downloadPdf: "Télécharger le Rapport PDF",
      downloading: "Génération du PDF...",
      pdfSuccess: "Rapport PDF Téléchargé !",
      viewReport: "Analyser l'Entretien",
      hideReport: "Masquer l'Analyse",
      noDetails: "Aucune télémétrie approfondie disponible pour cet exercice d'élocution. Effectuez une évaluation complète en 5 phases pour indexer des indicateurs multi-axes.",
      phaseLabel: "Phase",
      score: "Score",
      tempo: "Tempo",
      clarity: "Clarté",
      readiness: "Éligibilité",
      secScores: "Calibrage de Performance Multi-Axes",
      resume: "CV / Expérience",
      industry: "Expertise Métier",
      comms: "Fluence Vocale",
      poise: "Posture de Confiance",
      adapt: "Adaptabilité",
      behavior: "Comportemental",
      
      // New dashboard translations
      statsOverview: "KPIs de Progression",
      avgScoreLabel: "Éligibilité Moyenne",
      totalSessionsLabel: "Entretiens Validés",
      bestScoreLabel: "Score Culminant",
      searchPlaceholder: "Rechercher une date, une directive...",
      allFilter: "Tous formats",
      assessFilter: "Mises en situation",
      trainFilter: "Entraînements Vocaux",
      layoutGrid: "Mode Grille",
      layoutList: "Mode Liste"
    }
  }[lang];

  // Calculate high value aggregate stats for the candidate
  const statistics = useMemo(() => {
    if (history.length === 0) return { avg: 0, max: 0, count: 0 };
    const scores = history.map(h => h.score || 0);
    const sum = scores.reduce((acc, s) => acc + s, 0);
    return {
      avg: Math.round(sum / history.length),
      max: Math.max(...scores),
      count: history.length
    };
  }, [history]);

  // Filter and search history items
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      // 1. Format Filter
      if (filterType === 'assess' && item.type !== 'ASSESS') return false;
      if (filterType === 'train' && item.type !== 'TRAIN') return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const dateMatch = item.date.toLowerCase().includes(query);
        const langMatch = (item.language || '').toLowerCase().includes(query);
        const weaknessMatch = (item.weakness || '').toLowerCase().includes(query);
        const recommendationMatch = (item.recommendation || '').toLowerCase().includes(query);
        return dateMatch || langMatch || weaknessMatch || recommendationMatch;
      }

      return true;
    });
  }, [history, filterType, searchQuery]);

  const handleDownloadPDF = (it: SessionHistoryItem) => {
    setExportingId(it.id);
    setTimeout(() => {
      try {
        generateReportPDF(user || defaultUser, it, lang);
        setExportSuccessId(it.id);
        setTimeout(() => setExportSuccessId(null), 3000);
      } catch (err) {
        console.error("Failed to generate PDF inside HistoryView:", err);
      } finally {
        setExportingId(null);
      }
    }, 1000);
  };

  const toggleExpand = (itemId: string) => {
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
    } else {
      setExpandedItemId(itemId);
      if (activeQuestionTabs[itemId] === undefined) {
        setActiveQuestionTabs(prev => ({ ...prev, [itemId]: 0 }));
      }
    }
  };

  return (
    <div id="history-view" className="max-w-4xl mx-auto py-6 animate-fade-in space-y-8 relative z-10 selection:bg-[#18633F]/20">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#A7F3D0] border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <Clock className="w-3.5 h-3.5 text-stone-950" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-950 font-black">
              {lang === 'EN' ? "CHRONOLOGICAL TELEMETRY" : "HISTORIQUE D'ÉVALUATIONS"}
            </span>
          </div>
          <h1 id="history-title" className="text-3xl md:text-4xl font-extrabold text-[#111111] tracking-tight">
            {t.history.title}
          </h1>
          <p id="history-subtitle" className="text-xs md:text-sm font-medium text-stone-500 tracking-wide">
            {lang === 'EN' 
              ? "Inspect your entire oral progress timeline, review answers section-by-section, and download certification reports."
              : "Consultez l'historique complet de votre progression vocale, examinez vos réponses phase par phase, et téléchargez vos bilans certifiés."}
          </p>
        </div>

        {/* Quick Header Scheduler Trigger Button */}
        <button
          onClick={() => setIsSchedulerOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#EDC154] hover:bg-[#f3cf6f] text-stone-950 text-xs font-mono uppercase font-black tracking-wider rounded-xl border-2 border-stone-950 transition-all shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-2 cursor-pointer shrink-0 active:translate-y-0.5"
        >
          <Calendar className="w-4 h-4" />
          <span>{lang === 'EN' ? "Plan Next Session" : "Planifier l'agenda"}</span>
        </button>
      </div>

      {/* Aggregate Competency Statistics Cards */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Average Score KPI */}
          <div className="bg-white border-2 border-stone-950 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-stone-400 font-bold uppercase tracking-wider block">
                {detailTranslations.avgScoreLabel}
              </span>
              <h3 className="text-2xl font-black text-stone-950 font-sans">
                {statistics.avg}%
              </h3>
            </div>
            <div className="relative w-11 h-11 flex items-center justify-center bg-emerald-50 rounded-full border border-stone-950">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          {/* Peak Performance KPI */}
          <div className="bg-white border-2 border-stone-950 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-stone-400 font-bold uppercase tracking-wider block">
                {detailTranslations.bestScoreLabel}
              </span>
              <h3 className="text-2xl font-black text-stone-950 font-sans">
                {statistics.max}/100
              </h3>
            </div>
            <div className="relative w-11 h-11 flex items-center justify-center bg-[#EDC154]/20 rounded-full border border-stone-950">
              <Award className="w-5 h-5 text-[#c79c29]" />
            </div>
          </div>

          {/* Total Counts KPI */}
          <div className="bg-white border-2 border-stone-950 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-stone-400 font-bold uppercase tracking-wider block">
                {detailTranslations.totalSessionsLabel}
              </span>
              <h3 className="text-2xl font-black text-stone-950 font-sans">
                {statistics.count}
              </h3>
            </div>
            <div className="relative w-11 h-11 flex items-center justify-center bg-indigo-50 rounded-full border border-stone-950">
              <Flame className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

        </div>
      )}

      {/* Dynamic Scheduling Integration CTA */}
      <div className="bg-stone-900 text-stone-100 border-[2.5px] border-stone-950 p-5 rounded-[24px] shadow-[4px_4px_0px_0px_#111111] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-3">
          <div className="p-2.5 bg-stone-800 rounded-xl border border-stone-700 flex-shrink-0">
            <Calendar className="w-5 h-5 text-[#EDC154]" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-black uppercase tracking-wider text-white">
              {lang === 'EN' ? "Consistency & Habits Calibration" : "Planification & Habitudes Vocales"}
            </h4>
            <p className="text-[11px] text-stone-300 font-medium leading-relaxed mt-0.5 max-w-xl">
              {lang === 'EN' 
                ? "The secret to fluency is regular spaced repetition. Secure your progress by scheduling your next simulations directly into your calendar."
                : "Le secret de l'élocution réside dans la régularité. Sécurisez votre progression en planifiant vos prochaines sessions d'entraînement."}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsSchedulerOpen(true)}
          className="w-full md:w-auto px-4 py-2.5 bg-[#EDC154] hover:bg-[#f3cf6f] text-stone-950 text-xs font-mono uppercase font-black tracking-wider rounded-xl border-2 border-stone-950 transition-all shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
        >
          <Calendar className="w-4 h-4" />
          <span>{lang === 'EN' ? "Open AI Scheduler" : "Ouvrir l'agenda IA"}</span>
        </button>
      </div>

      {/* Interactive Controls Bar: Filters, Search, and Layout Toggles */}
      {history.length > 0 && (
        <div className="bg-stone-100 border-2 border-stone-950 p-4 rounded-2xl shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* 1. Format Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase font-black rounded-lg border border-stone-950 transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-stone-950 text-white shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]'
                  : 'bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {detailTranslations.allFilter}
            </button>
            <button
              onClick={() => setFilterType('assess')}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase font-black rounded-lg border border-stone-950 transition-all cursor-pointer ${
                filterType === 'assess'
                  ? 'bg-[#FF7E5F] text-stone-950 font-bold shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]'
                  : 'bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {detailTranslations.assessFilter}
            </button>
            <button
              onClick={() => setFilterType('train')}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase font-black rounded-lg border border-stone-950 transition-all cursor-pointer ${
                filterType === 'train'
                  ? 'bg-[#EDC154] text-stone-950 font-bold shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]'
                  : 'bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {detailTranslations.trainFilter}
            </button>
          </div>

          {/* 2. Interactive Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-stone-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={detailTranslations.searchPlaceholder}
              className="w-full pl-9 pr-4 py-1.5 bg-white border-2 border-stone-950 text-xs font-mono font-bold text-stone-900 rounded-xl focus:outline-none focus:ring-0 placeholder:text-stone-400"
            />
          </div>

          {/* 3. View Switcher Mode */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-stone-950 self-start md:self-auto shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
            <button
              onClick={() => setViewMode('grid')}
              title={detailTranslations.layoutGrid}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#A7F3D0] text-stone-950 border border-stone-950'
                  : 'text-stone-500 hover:text-stone-950'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title={detailTranslations.layoutList}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#A7F3D0] text-stone-950 border border-stone-950'
                  : 'text-stone-500 hover:text-stone-950'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* History Timeline/Grid list container */}
      <div className="space-y-6">
        {filteredHistory.length === 0 ? (
          <div id="history-empty" className="text-center py-12 flex flex-col items-center justify-center space-y-4 bg-white border-[2.5px] border-stone-950 rounded-[24px] shadow-[6px_6px_0px_0px_#111111]">
            <Clock className="w-10 h-10 text-stone-400 stroke-[1.5]" />
            <p className="text-stone-600 text-xs font-bold leading-relaxed max-w-xs px-4">
              {history.length === 0 
                ? t.history.noSessions 
                : (lang === 'EN' ? "No sessions match your current query or filter tags." : "Aucune session ne correspond à vos critères de recherche.")}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-5"}>
            {filteredHistory.map((it) => {
              const isExpanded = expandedItemId === it.id;
              const activeTabIdx = activeQuestionTabs[it.id] || 0;
              const hasDetailedFeedback = it.questionsFeedback && it.questionsFeedback.length > 0;

              return (
                <div 
                  key={it.id} 
                  id={`history-item-${it.id}`}
                  className={`bg-white border-2 border-stone-950 rounded-[24px] p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5.5px_5.5px_0px_0px_rgba(17,17,17,1)] transition-all ${
                    viewMode === 'list' ? 'relative pl-6 border-l-[6px] border-l-stone-950' : ''
                  }`}
                >
                  
                  {/* Top Header Card Info */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 text-[8px] font-mono tracking-widest font-black rounded-md uppercase border border-stone-950 shadow-[1px_1px_0px_0px_#111111] ${
                          it.type === 'TRAIN' 
                            ? 'bg-[#EDC154] text-stone-950' 
                            : 'bg-[#FF7E5F] text-stone-950'
                        }`}>
                          {it.type}
                        </span>
                        <span className="text-[9px] text-stone-500 font-mono font-bold">
                          {it.date}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-stone-950 uppercase tracking-tight line-clamp-1">
                        {it.type === 'TRAIN' 
                          ? (lang === 'EN' ? "Voice Simulator Assessment" : "Simulation d'entraînement vocal")
                          : (lang === 'EN' ? "Mirror Focus Evaluation" : "Évaluation miroir de pression")}
                      </h4>
                      <span className="text-[9px] text-stone-400 font-mono font-bold block">
                        {it.language === 'EN' ? "English Context" : "Contexte Français"}
                      </span>
                    </div>

                    {/* Radial score gauge style */}
                    <div className="flex flex-col items-center justify-center p-2.5 bg-stone-50 border border-stone-950 rounded-xl shadow-[1.5px_1.5px_0px_0px_#111111] shrink-0 text-center">
                      <span className="text-[8px] font-mono text-stone-500 font-black uppercase block tracking-wider leading-none">SCORE</span>
                      <span className="text-sm font-black text-stone-950 mt-1">
                        {it.score}%
                      </span>
                    </div>
                  </div>

                  {/* Multi-axis dynamic diagnostic indicators */}
                  {it.type === 'ASSESS' && it.resumeScore !== undefined && (
                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-[9px] font-mono">
                      <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-center">
                        <span className="text-stone-400 block uppercase tracking-tight text-[7.5px] font-bold truncate">{detailTranslations.resume}</span>
                        <span className="font-sans font-black text-stone-850">{it.resumeScore}%</span>
                      </div>
                      <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-center">
                        <span className="text-stone-400 block uppercase tracking-tight text-[7.5px] font-bold truncate">{detailTranslations.industry}</span>
                        <span className="font-sans font-black text-stone-850">{it.industryScore}%</span>
                      </div>
                      <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-center">
                        <span className="text-stone-400 block uppercase tracking-tight text-[7.5px] font-bold truncate">{detailTranslations.comms}</span>
                        <span className="font-sans font-black text-stone-850">{it.communicationScore}%</span>
                      </div>
                      <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-center">
                        <span className="text-stone-400 block uppercase tracking-tight text-[7.5px] font-bold truncate">{detailTranslations.poise}</span>
                        <span className="font-sans font-black text-stone-850">{it.confidenceScore}%</span>
                      </div>
                      <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-center">
                        <span className="text-stone-400 block uppercase tracking-tight text-[7.5px] font-bold truncate">{detailTranslations.adapt}</span>
                        <span className="font-sans font-black text-stone-850">{it.adaptabilityScore}%</span>
                      </div>
                      <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-center">
                        <span className="text-stone-400 block uppercase tracking-tight text-[7.5px] font-bold truncate">{detailTranslations.behavior}</span>
                        <span className="font-sans font-black text-stone-850">{it.behavioralScore}%</span>
                      </div>
                    </div>
                  )}

                  {/* Highlights Summary Block */}
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div>
                      <span className="font-mono text-[8.5px] text-stone-400 uppercase tracking-widest font-black block mb-0.5">
                        {t.train.weakness}
                      </span>
                      <p className="text-stone-800 font-bold leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-[10px] min-h-[3.2rem] line-clamp-3">
                        {it.weakness}
                      </p>
                    </div>

                    <div>
                      <span className="font-mono text-[8.5px] text-stone-400 uppercase tracking-widest font-black block mb-0.5">
                        {lang === 'EN' ? "Advisory Directive" : "Directive de Révision"}
                      </span>
                      <p className="text-stone-600 leading-relaxed font-bold bg-stone-50 p-2.5 rounded-xl border border-stone-200 italic text-[10px] min-h-[3.2rem] line-clamp-3">
                        "{it.recommendation}"
                      </p>
                    </div>
                  </div>

                  {/* ACTION TRIGGERS BAR */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-stone-100">
                    
                    {/* 1. Examine full feedback toggle trigger */}
                    <button
                      onClick={() => toggleExpand(it.id)}
                      className="px-3.5 py-1.5 border-2 border-stone-950 hover:bg-stone-50 text-stone-950 text-[9px] font-mono uppercase font-black tracking-wider rounded-xl transition-all shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] flex items-center gap-1.5 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-stone-950" />
                          <span>{detailTranslations.hideReport}</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-stone-950" />
                          <span>{detailTranslations.viewReport}</span>
                        </>
                      )}
                    </button>

                    {/* 2. Download cert summary PDF */}
                    {exportSuccessId === it.id ? (
                      <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-800 text-[9px] font-mono uppercase font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(16,185,129,0.3)]">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{detailTranslations.pdfSuccess}</span>
                      </div>
                    ) : (
                      <button
                        disabled={exportingId === it.id}
                        onClick={() => handleDownloadPDF(it)}
                        className="px-3.5 py-1.5 bg-[#A7F3D0] border-2 border-stone-950 hover:bg-[#c2f9df] text-stone-950 text-[9px] font-mono uppercase font-black tracking-wider rounded-xl transition-all shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {exportingId === it.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{detailTranslations.downloading}</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5 text-stone-950" />
                            <span>{detailTranslations.downloadPdf}</span>
                          </>
                        )}
                      </button>
                    )}

                  </div>

                  {/* EXPANDED SECTION-BY-SECTION ANALYSIS & PROGRESSION ADVICE */}
                  {isExpanded && (
                    <div className="pt-4 mt-2 border-t-2 border-stone-150 animate-fade-in space-y-4">
                      {hasDetailedFeedback ? (
                        <div className="space-y-4 text-left">
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-2">
                            <div>
                              <h3 className="font-mono font-black text-xs text-stone-950 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-stone-950" />
                                <span>{detailTranslations.detailsTitle}</span>
                              </h3>
                              <p className="text-[9px] text-stone-400 font-mono font-bold uppercase tracking-wider mt-0.5">
                                {detailTranslations.detailsSub}
                              </p>
                            </div>
                            <span className="font-mono text-[9px] bg-stone-950 text-white px-2 py-0.5 rounded uppercase font-black self-start sm:self-auto">
                              {it.questionsFeedback!.length} {it.questionsFeedback!.length > 1 ? 'PHASES' : 'PHASE'}
                            </span>
                          </div>

                          {/* Phase Navigation Tabs */}
                          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                            {it.questionsFeedback!.map((q, qidx) => (
                              <button
                                key={qidx}
                                onClick={() => setActiveQuestionTabs(prev => ({ ...prev, [it.id]: qidx }))}
                                className={`px-2.5 py-1.5 text-[9px] font-mono uppercase font-black rounded-lg border-2 border-stone-950 transition-all cursor-pointer whitespace-nowrap ${
                                  activeTabIdx === qidx
                                    ? 'bg-[#EDC154] text-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] translate-x-[0.5px] translate-y-[0.5px]'
                                    : 'bg-stone-50 text-stone-700 hover:bg-stone-100 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px]'
                                }`}
                              >
                                {detailTranslations.phaseLabel} {qidx + 1}
                              </button>
                            ))}
                          </div>

                          {/* Question Details Render */}
                          {it.questionsFeedback![activeTabIdx] && (
                            <div className="bg-stone-50 border-2 border-stone-950 rounded-xl p-4 space-y-4 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                              
                              <div className="flex justify-between items-center gap-3 border-b border-stone-200 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[9px] uppercase font-black text-stone-900 bg-[#E5E7EB] px-1.5 py-0.5 rounded border border-stone-300">
                                    {it.questionsFeedback![activeTabIdx].phaseLabel}
                                  </span>
                                  {it.questionsFeedback![activeTabIdx].difficulty && (
                                    <span className="font-mono text-[8px] uppercase font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                      {it.questionsFeedback![activeTabIdx].difficulty}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 font-mono text-[9px] font-black uppercase text-stone-500">
                                  <span>{detailTranslations.score}:</span>
                                  <span className="text-stone-950 bg-white border border-stone-950 px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] text-xs">
                                    {it.questionsFeedback![activeTabIdx].score}%
                                  </span>
                                </div>
                              </div>

                              {/* Question text */}
                              <div className="space-y-1">
                                <span className="text-[8px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                                  {detailTranslations.promptedQuestion}
                                </span>
                                <p className="text-xs font-semibold italic text-stone-900 leading-relaxed bg-white p-2.5 rounded-lg border border-stone-200">
                                  "{it.questionsFeedback![activeTabIdx].questionText}"
                                </p>
                              </div>

                              {/* Metrics Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                
                                {/* speaking tempo */}
                                <div className="bg-white p-2.5 rounded-lg border border-stone-300 flex flex-col justify-between shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                                  <span className="text-[8px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                                    {detailTranslations.speakingTempo}
                                  </span>
                                  <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-[10px] font-black text-stone-950 font-mono">
                                      {it.questionsFeedback![activeTabIdx].pace}
                                    </span>
                                    <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.2 bg-[#E8F5E9] border border-[#A5D6A7] text-emerald-800 rounded">
                                      {it.questionsFeedback![activeTabIdx].paceRating}
                                    </span>
                                  </div>
                                </div>

                                {/* verbal clarity */}
                                <div className="bg-white p-2.5 rounded-lg border border-stone-300 flex flex-col justify-between shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                                  <span className="text-[8px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                                    {detailTranslations.verbalClarity}
                                  </span>
                                  <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-[10px] font-black text-stone-950 font-mono">
                                      {it.questionsFeedback![activeTabIdx].clarity}%
                                    </span>
                                    <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.2 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded">
                                      {it.questionsFeedback![activeTabIdx].clarity >= 80 ? "Optimal" : "Fair"}
                                    </span>
                                  </div>
                                </div>

                                {/* AI Readiness */}
                                <div className="bg-white p-2.5 rounded-lg border border-stone-300 flex flex-col justify-between shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                                  <span className="text-[8px] font-mono text-stone-400 font-bold uppercase tracking-wider block">
                                    {detailTranslations.aiReadiness}
                                  </span>
                                  <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-[10px] font-black text-stone-950 font-mono">
                                      {it.questionsFeedback![activeTabIdx].score}%
                                    </span>
                                    <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded">
                                      {it.questionsFeedback![activeTabIdx].score >= 80 ? "Certified" : "Developing"}
                                    </span>
                                  </div>
                                </div>

                              </div>

                              {/* Strengths and tips */}
                              <div className="space-y-2 pt-2 border-t border-stone-200">
                                <div>
                                  <span className="text-[8px] font-mono text-stone-400 font-bold uppercase tracking-wider block mb-0.5">
                                    {detailTranslations.keyPositive}
                                  </span>
                                  <p className="text-[10px] font-semibold text-stone-800 leading-relaxed bg-white p-2 rounded-lg border border-stone-200">
                                    {it.questionsFeedback![activeTabIdx].keyPositive}
                                  </p>
                                </div>

                                <div>
                                  <span className="text-[8px] font-mono text-stone-400 font-bold uppercase tracking-wider block mb-0.5">
                                    {detailTranslations.improvementTip}
                                  </span>
                                  <p className="text-[10px] font-semibold text-[#FF5A5F] leading-relaxed bg-red-50/40 p-2 rounded-lg border border-red-200">
                                    {it.questionsFeedback![activeTabIdx].improvementTip}
                                  </p>
                                </div>
                              </div>

                            </div>
                          )}

                        </div>
                      ) : (
                        <div className="bg-stone-50 border-2 border-dashed border-stone-400 rounded-xl p-6 text-center text-xs text-stone-500 font-bold leading-relaxed flex items-center gap-2 justify-center">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{detailTranslations.noDetails}</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scheduling Modal Backdrop */}
      {isSchedulerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white border-[3px] border-stone-950 rounded-[32px] shadow-[10px_10px_0px_0px_#111111] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-scale-up">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b-2 border-stone-950 p-6 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#A7F3D0] rounded-xl border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                  <Calendar className="w-5 h-5 text-stone-950" />
                </div>
                <div>
                  <h2 className="text-lg font-mono font-black uppercase text-stone-950 tracking-wider">
                    {lang === 'EN' ? "AI Session Scheduler" : "Agenda d'Entraînement IA"}
                  </h2>
                  <p className="text-[10px] text-stone-500 font-mono font-black uppercase tracking-wider mt-0.5">
                    {lang === 'EN' ? "Plan and manage upcoming voice training goals" : "Planifiez et gérez vos objectifs d'élocution"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSchedulerOpen(false)}
                className="p-2 border-2 border-stone-950 rounded-xl hover:bg-stone-100 transition-all shadow-[2.5px_2.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
              >
                <X className="w-5 h-5 text-stone-950" />
              </button>
            </div>

            {/* Modal Body with Scheduler */}
            <div className="p-6 md:p-8 bg-stone-50">
              <CalendarScheduler user={user} history={history} lang={lang} />
            </div>

            {/* Modal Footer */}
            <div className="border-t-2 border-stone-950 p-5 bg-white flex justify-end">
              <button
                onClick={() => setIsSchedulerOpen(false)}
                className="px-6 py-2.5 bg-stone-950 text-white font-mono uppercase font-black tracking-wider text-xs rounded-xl hover:bg-stone-850 active:translate-y-0.5 border-2 border-stone-950 cursor-pointer shadow-[3px_3px_0px_0px_rgba(17,17,17,0.15)]"
              >
                {lang === 'EN' ? "Close Scheduler" : "Fermer l'agenda"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
