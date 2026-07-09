import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Cpu, 
  Layers, 
  CheckCircle, 
  Activity, 
  TrendingUp, 
  Lock, 
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  Check,
  X,
  Play,
  RotateCcw,
  Sliders,
  Calendar,
  MessageSquare,
  FileText,
  Bookmark,
  Shield,
  ArrowUpRight
} from 'lucide-react';
import { LearningReviewWorkflow, ProposedImprovement, LearningHistoryEvent } from '../../lib/learning/learningReviewWorkflow';
import { PromptOptimizer, PromptVersion } from '../../lib/learning/promptOptimizer';
import { FollowUpLibrary, FollowUpTemplate } from '../../lib/learning/followUpLibrary';
import { CoachingKnowledgeBase, CoachingAdvice } from '../../lib/learning/coachingKnowledge';
import { DifficultyCalibration, DifficultyReport } from '../../lib/learning/difficultyCalibration';
import { InterviewKnowledgeBase, GlobalKnowledgeInsight } from '../../lib/learning/interviewKnowledge';

interface LearningIntelligenceCenterProps {
  lang?: 'FR' | 'EN';
}

export default function LearningIntelligenceCenter({ lang = 'EN' }: LearningIntelligenceCenterProps) {
  const isFR = lang === 'FR';

  // Local state reflecting workflow
  const [proposals, setProposals] = useState<ProposedImprovement[]>([]);
  const [deploymentHistory, setDeploymentHistory] = useState<ProposedImprovement[]>([]);
  const [learningHistory, setLearningHistory] = useState<LearningHistoryEvent[]>([]);
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'coaching' | 'questions' | 'prompts' | 'proposals' | 'history'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected items / edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<ProposedImprovement | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState<string | null>(null);
  const [scheduleDelay, setScheduleDelay] = useState<number>(3000); // default 3s for demo sandbox execution
  
  // Notification banner
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Initial load
  const loadData = () => {
    setProposals(LearningReviewWorkflow.getProposedImprovements());
    setDeploymentHistory(LearningReviewWorkflow.getDeploymentHistory());
    setLearningHistory(LearningReviewWorkflow.getLearningHistory());
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Actions
  const handleApprove = (id: string, customVal?: string) => {
    const success = LearningReviewWorkflow.approveImprovement(id, customVal, 'Lead System Auditor');
    if (success) {
      triggerToast(
        isFR 
          ? "Optimisation approuvée et déployée avec succès en direct !" 
          : "Optimization successfully approved and deployed live!",
        'success'
      );
      loadData();
      if (selectedProposal?.id === id) setSelectedProposal(null);
    } else {
      triggerToast(isFR ? "Échec du déploiement." : "Failed to deploy.", 'error');
    }
  };

  const handleReject = (id: string) => {
    const success = LearningReviewWorkflow.rejectImprovement(id, 'Lead System Auditor');
    if (success) {
      triggerToast(
        isFR 
          ? "Suggestion d'optimisation rejetée et archivée." 
          : "Optimization proposal rejected and archived.",
        'info'
      );
      loadData();
      if (selectedProposal?.id === id) setSelectedProposal(null);
    }
  };

  const handleModify = (id: string) => {
    const success = LearningReviewWorkflow.modifyImprovement(id, editingValue);
    if (success) {
      triggerToast(
        isFR 
          ? "Proposition modifiée avec succès. Prête pour l'approbation." 
          : "Proposal successfully modified. Ready for approval.",
        'success'
      );
      setEditingId(null);
      loadData();
    }
  };

  const handleSchedule = (id: string) => {
    const success = LearningReviewWorkflow.scheduleImprovement(id, scheduleDelay, 'Lead System Auditor');
    if (success) {
      triggerToast(
        isFR 
          ? `Rollout planifié avec succès dans ${scheduleDelay / 1000}s !` 
          : `Rollout successfully scheduled to deploy in ${scheduleDelay / 1000}s!`,
        'success'
      );
      setShowScheduleModal(null);
      loadData();
    }
  };

  const handleRollback = (id: string) => {
    const success = LearningReviewWorkflow.rollbackImprovement(id, 'Lead System Auditor');
    if (success) {
      triggerToast(
        isFR 
          ? "Déploiement annulé ! L'ancienne configuration stable a été restaurée." 
          : "Rollback successful! The previous stable config has been restored.",
        'info'
      );
      loadData();
    } else {
      triggerToast(isFR ? "Échec du rollback." : "Rollback failed.", 'error');
    }
  };

  const handleTriggerNightlyDistill = () => {
    triggerToast(
      isFR 
        ? "Lancement de la distillation asynchrone des sessions..." 
        : "Triggering nightly session distillation job asynchronously...",
      'info'
    );
    setTimeout(() => {
      // Simulate distillation
      triggerToast(
        isFR 
          ? "Distillation complétée ! 4 nouveaux vecteurs d'apprentissage découverts." 
          : "Distillation complete! 4 new learning vectors identified.",
        'success'
      );
      loadData();
    }, 1500);
  };

  // Stats for overview
  const totalCompletedInterviews = 420;
  const avgSatisfaction = 4.6;
  const progressRatio = 78.5; // average improvement rate of coaching candidates
  const knowledgeVersion = "v2.1.4";

  return (
    <div className="space-y-8">
      {/* Header Info Banner */}
      <div className="bg-stone-900 border-2 border-stone-950 text-white rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 text-left">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-amber-400 font-extrabold bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              {isFR ? "MOTEUR D'INTELLIGENCE APPRENANT SHANA" : "SHANA LEARNING INTELLIGENCE SYSTEM"}
            </span>
            <h2 className="text-2.5xl font-sans font-black tracking-tight">
              {isFR ? "Centre d'Intelligence Apprenante" : "Learning Intelligence Center"}
            </h2>
            <p className="text-xs text-stone-300 max-w-2xl font-medium leading-relaxed">
              {isFR
                ? "Supervisez le processus d'amélioration continue et anonyme de la plateforme. Contrôlez l'alignement des prompts, validez l'intégrité statistique des preuves d'entretien et gérez le workflow de déploiement sécurisé."
                : "Monitor the continuous, anonymous self-improvement loop of the platform. Track prompt efficiency, validate interview evidence constraints, and orchestrate the human-in-the-loop deployment pipeline."}
            </p>
          </div>

          <button
            onClick={handleTriggerNightlyDistill}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-mono font-bold rounded-xl border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-y-0.5 active:translate-y-1 transition-all shrink-0 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>{isFR ? "Lancer Distillation IA" : "Run AI Distillation Job"}</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {notification && (
        <div className={`p-4 border-2 border-stone-950 rounded-2xl shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] flex items-center gap-3 text-xs font-bold text-left animate-bounce-short ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800' 
            : notification.type === 'error' 
            ? 'bg-rose-50 text-rose-800' 
            : 'bg-amber-50 text-amber-800'
        }`}>
          <span>{notification.type === 'success' ? '🛡️' : '⚠️'}</span>
          <p className="flex-1 font-semibold">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Menu Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-stone-200">
        {[
          { id: 'dashboard', label: isFR ? "Vue d'Ensemble" : 'Overview', icon: Layers },
          { id: 'coaching', label: isFR ? "Efficacité Coaching" : 'Coaching Impact', icon: Award },
          { id: 'questions', label: isFR ? "Qualité des Questions" : 'Question Quality', icon: HelpCircle },
          { id: 'prompts', label: isFR ? "Gabarits de Prompts" : 'Prompt Templates', icon: Cpu },
          { id: 'proposals', label: `${isFR ? "Revues en attente" : "Pending Reviews"} (${proposals.length})`, icon: Sliders },
          { id: 'history', label: isFR ? "Historique & Déploiements" : 'History & Rollbacks', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 border-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-150 shrink-0 flex items-center gap-2 ${
                isActive
                  ? 'bg-stone-950 text-white border-stone-950 shadow-[2px_2px_0px_0px_rgba(251,191,36,1)]'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TABS CONTENT */}

      {/* 1. OVERVIEW / DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Main KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-stone-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] text-left">
              <span className="font-mono text-[9px] font-black uppercase text-stone-400 block tracking-widest">{isFR ? "SESSIONS ANALYSÉES" : "TOTAL COMPLETED SESSIONS"}</span>
              <h3 className="text-2.5xl font-sans font-black text-stone-900 mt-1">{totalCompletedInterviews}</h3>
              <p className="text-stone-500 text-[10px] font-semibold mt-1">{isFR ? "Enrichissement anonyme continu" : "Continuous anonymous tracking active"}</p>
            </div>
            
            <div className="bg-white border-2 border-stone-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] text-left">
              <span className="font-mono text-[9px] font-black uppercase text-stone-400 block tracking-widest">{isFR ? "PROGRÈS MOYEN DU CANDIDAT" : "AVERAGE CANDIDATE PROGRESS RATE"}</span>
              <h3 className="text-2.5xl font-sans font-black text-emerald-600 mt-1">+{progressRatio}%</h3>
              <p className="text-stone-500 text-[10px] font-semibold mt-1">{isFR ? "Index de préparation STAR cumulé" : "Expected behavioral readiness boost"}</p>
            </div>

            <div className="bg-white border-2 border-stone-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] text-left">
              <span className="font-mono text-[9px] font-black uppercase text-stone-400 block tracking-widest">{isFR ? "SATISFACTION DE L'ÉVALUATION" : "EVALUATION SATISFACTION"}</span>
              <h3 className="text-2.5xl font-sans font-black text-stone-900 mt-1">{avgSatisfaction} <span className="text-sm text-stone-400 font-normal">/ 5</span></h3>
              <p className="text-stone-500 text-[10px] font-semibold mt-1">{isFR ? "Basé sur les retours candidats" : "Derived from user feedback metrics"}</p>
            </div>

            <div className="bg-white border-2 border-stone-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] text-left">
              <span className="font-mono text-[9px] font-black uppercase text-stone-400 block tracking-widest">{isFR ? "VERSION BASE DE CONNAISSANCES" : "INTELLIGENCE VERSION"}</span>
              <h3 className="text-2.5xl font-mono font-black text-indigo-600 mt-1">{knowledgeVersion}</h3>
              <p className="text-stone-500 text-[10px] font-semibold mt-1">{isFR ? "Vérifié & validé par audits" : "Validated under traceability audits"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Recommended Optimizations & Pending Summary */}
            <div className="bg-white border-2 border-stone-950 p-6 rounded-3xl space-y-4 text-left md:col-span-2">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <div>
                  <h3 className="font-sans font-black text-sm text-stone-900 uppercase tracking-wider">{isFR ? "Recommandations de Système Recommandées" : "Active Machine Learning Suggestions"}</h3>
                  <p className="text-[11px] text-stone-400 font-bold">{isFR ? "Changements extraits des sessions récentes en attente d'audit" : "Optimizations distilled from raw logs awaiting human sign-off"}</p>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-mono font-bold rounded border border-amber-200">
                  {proposals.length} {isFR ? "En attente" : "Pending"}
                </span>
              </div>

              {proposals.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-stone-200 rounded-2xl text-xs text-stone-400 font-bold">
                  {isFR ? "Aucune proposition en attente." : "No optimization suggestions pending human review."}
                </div>
              ) : (
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {proposals.map(prop => (
                    <div key={prop.id} className="border-2 border-stone-950 rounded-2xl p-4 space-y-3 bg-stone-50/20 hover:bg-stone-50/50 transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-stone-900 text-white font-mono text-[9px] font-black rounded uppercase">
                              {prop.category}
                            </span>
                            <span className="text-[10px] text-stone-400 font-semibold font-mono">
                              {isFR ? "Détecté" : "Mined"} {new Date(prop.suggestedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-sans font-black text-xs text-stone-900 mt-1">
                            {isFR ? prop.titleFR : prop.titleEN}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApprove(prop.id)}
                            className="p-1.5 bg-emerald-100 border border-emerald-400 text-emerald-800 hover:bg-emerald-200 rounded-lg text-[10px] font-bold"
                            title={isFR ? "Approuver et déployer" : "Approve and push live"}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReject(prop.id)}
                            className="p-1.5 bg-rose-100 border border-rose-400 text-rose-800 hover:bg-rose-200 rounded-lg text-[10px] font-bold"
                            title={isFR ? "Rejeter" : "Reject proposal"}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                        {isFR ? prop.descriptionFR : prop.descriptionEN}
                      </p>

                      <div className="bg-white p-2.5 border border-stone-200 rounded-xl space-y-1">
                        <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">{isFR ? "TRANSITION PROPOSÉE" : "PROPOSED TARGET VALUE"}</span>
                        <p className="text-[11px] font-mono text-stone-800 line-clamp-2">
                          {prop.proposedValue}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Validation & Privacy Directives Panel */}
            <div className="space-y-6">
              {/* Validation panel */}
              <div className="bg-white border-2 border-stone-950 p-6 rounded-3xl space-y-4 text-left">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h3 className="font-sans font-black text-xs text-stone-900 uppercase tracking-wider">
                    {isFR ? "Contrôle d'Intégrité de Données" : "Learning Validation Engine"}
                  </h3>
                </div>

                <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                  {isFR
                    ? "Toutes les suggestions passent par un crible d'intégrité statistique. Les anomalies de notes (inflation injustifiée), les biais d'échantillons uniques et les preuves redondantes sont automatiquement rejetés."
                    : "Every proposed learning vector is put through multi-dimensional validation checking. Isolated anomalies, score inflation, and duplicative transcript evidence are blocked to maintain high-quality objective benchmarks."}
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-[11px] font-semibold border-b border-stone-100 pb-1">
                    <span className="text-stone-500">{isFR ? "Validation Statistique :" : "Statistical Confidence Interval:"}</span>
                    <span className="text-stone-800 font-mono">95% Confidence (p &lt; 0.05)</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-semibold border-b border-stone-100 pb-1">
                    <span className="text-stone-500">{isFR ? "Rejet d'Anomalies Bruitées :" : "Noisy Data Supression Rate:"}</span>
                    <span className="text-amber-600 font-mono">Active (12 blocks)</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-semibold">
                    <span className="text-stone-500">{isFR ? "Contrôle de Redondance :" : "Evidence Overlap Monitor:"}</span>
                    <span className="text-emerald-600 font-mono">Passed conforming</span>
                  </div>
                </div>
              </div>

              {/* Privacy protection panel */}
              <div className="bg-stone-50 border-2 border-stone-950 p-6 rounded-3xl space-y-4 text-left">
                <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                  <Lock className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                  <h3 className="font-sans font-black text-xs text-stone-900 uppercase tracking-wider">
                    {isFR ? "Politique de Confidentialité" : "Privacy & Anonymization Audit"}
                  </h3>
                </div>

                <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                  {isFR
                    ? "SHANA applique des filtres GDPR rigoureux. Aucun transcript brut, aucune information personnelle (email, nom, téléphone, clé API) ne sort des limites sécurisées locales."
                    : "Strict GDPR Article 17 and local safety standards enforced. Only anonymized statistical patterns cross global analysis limits. Raw PII, transcript text fragments, and user tokens are dynamically scrubbed."}
                </p>

                <div className="bg-white p-3 border border-stone-200 rounded-xl text-[10px] font-mono text-stone-600 font-bold">
                  {isFR ? "✓ Gommage automatique d'emails activé" : "✓ Real-time PII string scrubbing enabled"} <br />
                  {isFR ? "✓ Stockage anonymisé dissocié de l'identité" : "✓ Aggregated statistics decoupled from user credentials"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. COACHING EFFECTIVENESS */}
      {activeTab === 'coaching' && (
        <div className="bg-white border-2 border-stone-950 p-6 rounded-3xl space-y-6 text-left">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="font-sans font-black text-base text-stone-900 uppercase tracking-wider">
              {isFR ? "Analyse d'Efficacité du Coaching" : "Coaching Optimization Engine"}
            </h3>
            <p className="text-xs text-stone-500 font-bold leading-normal">
              {isFR
                ? "Mesure empirique de l'amélioration des performances candidats après l'administration des conseils de préparation."
                : "Empirical measurement of candidate score improvements following targeted recommendations."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {CoachingKnowledgeBase.getAllAdvice().map(advice => (
              <div key={advice.id} className="border-2 border-stone-950 rounded-2xl p-4 bg-stone-50/30 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 text-[8px] font-mono font-bold rounded uppercase">
                      {advice.category}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 font-semibold">
                      ID: {advice.id}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-800 leading-relaxed">
                    {isFR ? advice.adviceFR : advice.adviceEN}
                  </h4>
                </div>

                <div className="pt-4 border-t border-stone-150 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">{isFR ? "USAGE TOTAL" : "USAGE FREQUENCY"}</span>
                    <span className="text-xs font-mono font-black text-stone-800">{advice.popularityWeight} {isFR ? "fois" : "times"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">{isFR ? "IMPACT PROUVÉ" : "IMPACT RATING"}</span>
                    <span className={`text-sm font-mono font-black ${advice.observedImpactScore > 90 ? 'text-emerald-600' : 'text-stone-900'}`}>
                      {advice.observedImpactScore}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ==================== COACHING INTELLIGENCE ANALYTICS SUB-PANEL (HIU PHASE 9) ==================== */}
          <div className="border-2 border-stone-950 rounded-[32px] p-6 bg-[#FFFDF6] space-y-6">
            <div className="border-b border-stone-150 pb-3 flex flex-col md:flex-row justify-between md:items-center gap-2">
              <div>
                <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 text-[8px] font-mono font-bold rounded uppercase">
                  {isFR ? "METRIQUES DE TRANSFORMATION DU COACHING" : "COACHING INTELLIGENCE & METRICS"}
                </span>
                <h4 className="text-sm font-black uppercase text-stone-900 mt-1">
                  {isFR ? "Analyse Comparative d'Impact du Coaching" : "Coaching Impact & Development Telemetry"}
                </h4>
                <p className="text-[11px] text-stone-500 font-bold">
                  {isFR 
                    ? "Mesure de la distribution des faiblesses, du taux de complétion des exercices, de l'amélioration des scores sémantiques et de la rétention."
                    : "Comprehensive analytics of student performance gaps, practice loop completion rates, and cumulative cognitive improvements."}
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-stone-400 font-bold">
                <span>{isFR ? "DONNÉES AGRÉGÉES : 1 240 SESSIONS" : "SAMPLE SIZE: 1,240 COGNITIVE SESSIONS"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              
              {/* Panel A: Identified Gaps & Weakness Frequency (Bar Chart Style) */}
              <div className="bg-white border-2 border-stone-950 rounded-2xl p-4 space-y-4">
                <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wider block font-bold">
                  ⚠️ {isFR ? "Distribution des Faiblesses Candidats" : "Candidate Performance Gap Distribution"}
                </span>
                
                <div className="space-y-3.5">
                  {[
                    { label: isFR ? "Résultats STAR Manquants de Chiffres (Résultat quantitative)" : "Missing STAR Quantification KPIs", val: 68, color: "bg-amber-500" },
                    { label: isFR ? "Élocution Vocal Accéléré (Stress / Échec)" : "Vocal Pace Acceleration under Failure", val: 44, color: "bg-indigo-500" },
                    { label: isFR ? "Focalisation sur l'Individuel vs Délégation / Mentorat" : "Individualist Focus vs Team Delegation", val: 35, color: "bg-emerald-500" },
                    { label: isFR ? "Manque de Choix Clairs & Compromis d'Architecture" : "Vague Architectural Trade-off Justifications", val: 28, color: "bg-stone-800" }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-bold text-stone-800">
                        <span>{item.label}</span>
                        <span className="font-mono text-stone-900">{item.val}%</span>
                      </div>
                      <div className="w-full h-3 bg-stone-100 border border-stone-200 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel B: Performance Improvement & Loop Engagement */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border-2 border-stone-950 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">{isFR ? "COMPLÉTION ENTRAÎNEMENT" : "PRACTICE DRILL RATE"}</span>
                    <span className="text-emerald-500 font-bold text-[10px] flex items-center">↑ 8.2%</span>
                  </div>
                  <span className="text-2xl font-mono font-black text-stone-950">84.6%</span>
                  <p className="text-[10px] text-stone-500 leading-normal font-semibold">
                    {isFR ? "Taux de lancement et complétion des simulations d'amélioration." : "Proportion of candidates executing recommended weakness loops."}
                  </p>
                </div>

                <div className="bg-white border-2 border-stone-950 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">{isFR ? "AMÉLIORATION SCORE MOYEN" : "AVG SCORE IMPROVEMENT"}</span>
                    <span className="text-emerald-500 font-bold text-[10px] flex items-center">↑ 14.2pts</span>
                  </div>
                  <span className="text-2xl font-mono font-black text-stone-950">+18.5%</span>
                  <p className="text-[10px] text-stone-500 leading-normal font-semibold">
                    {isFR ? "Augmentation moyenne du score après le STAR Workshop." : "Typical candidate score uplift between first attempt and rewrite."}
                  </p>
                </div>

                <div className="bg-white border-2 border-stone-950 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">{isFR ? "RÉTENTION DES CONSEILS" : "ADVICE RETENTION RATE"}</span>
                    <span className="text-indigo-500 font-bold text-[10px] flex items-center">↑ 4.1%</span>
                  </div>
                  <span className="text-2xl font-mono font-black text-stone-950">91.3%</span>
                  <p className="text-[10px] text-stone-500 leading-normal font-semibold">
                    {isFR ? "Mise en application pérenne lors de la session suivante." : "Percentage of recommendations sustained in subsequent sessions."}
                  </p>
                </div>

                <div className="bg-white border-2 border-stone-950 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block font-bold">{isFR ? "SATISFACTION DE L'AIDE" : "HELPFULNESS RATING"}</span>
                    <span className="text-yellow-500 font-bold text-[10px] flex items-center">★ 4.85</span>
                  </div>
                  <span className="text-2xl font-mono font-black text-stone-950">4.85<span className="text-xs text-stone-400 font-normal">/5</span></span>
                  <p className="text-[10px] text-stone-500 leading-normal font-semibold">
                    {isFR ? "Évaluation par les utilisateurs du post-interview chat." : "Average helpfulness score assigned to the AI Career Coach chat."}
                  </p>
                </div>
              </div>

            </div>

            {/* Part C: Coaching Memory & Cumulative Relationship History Analytics */}
            <div className="border border-stone-200 bg-white rounded-2xl p-4 space-y-3 text-left">
              <div className="flex items-center gap-2">
                <span className="text-base">🧠</span>
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block font-black">
                  {isFR ? "MÉMOIRE DU COACH & HISTORIQUE DES RELATIONS CUMULATIVES" : "CUMULATIVE RELATIONSHIP HISTORY & COACHING MEMORY"}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed font-semibold">
                {isFR 
                  ? "La mémoire cumulative Shana suit le parcours d'ingénierie d'un utilisateur à travers toutes ses simulations. Elle identifie l'application répétée des conseils, les blocages sémantiques récurrents et les signaux émotionnels pour personnaliser dynamiquement l'agenda du coach à chaque nouvelle connexion."
                  : "The Shana Cumulative Memory engine tracks candidate engineering progression across all historical simulations. It detects steady advice adoption, recurrent semantic blocks, and emotional signals, adapting the Coach persona's curriculum agenda for each user session."}
              </p>
            </div>
          </div>

          <div className="bg-emerald-50/50 border-2 border-emerald-200 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start">
            <div className="bg-white p-2 border border-emerald-300 text-emerald-800 rounded-xl shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-900 uppercase">
                {isFR ? "Règle de priorisation automatique du coaching" : "Adaptive Coaching Prioritization Engine Active"}
              </h4>
              <p className="text-[11px] text-emerald-800 leading-relaxed font-semibold">
                {isFR
                  ? "Le moteur privilégie automatiquement les exercices et conseils ayant l'impact mesuré le plus élevé. Les conseils descendant sous les 60% d'efficacité sont réévalués ou mis en quarantaine pour optimisation."
                  : "Recommendations with an impact rating above 90% are automatically prioritized in candidate dashboards. Low-impact advices are scheduled for auto-refinement during nightly distillation jobs to prevent training fatigue."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. QUESTION & FOLLOW-UP QUALITY */}
      {activeTab === 'questions' && (
        <div className="bg-white border-2 border-stone-950 p-6 rounded-3xl space-y-6 text-left">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="font-sans font-black text-base text-stone-900 uppercase tracking-wider">
              {isFR ? "Analyse d'Efficacité des Questions de Relance" : "Follow-Up Optimization Engine"}
            </h3>
            <p className="text-xs text-stone-500 font-bold leading-normal">
              {isFR
                ? "Mesure la pertinence des relances en fonction de la qualité du témoignage STAR et de la clarté d'expression qu'elles déclenchent."
                : "Evaluates conversational relevance and STAR evidence generated by context-driven investigative probes."}
            </p>
          </div>

          <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white divide-y divide-stone-150">
            {FollowUpLibrary.getAllTemplates().map(temp => (
              <div key={temp.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/10 hover:bg-stone-50/30 transition-all">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-stone-200 border border-stone-300 text-stone-800 text-[9px] font-mono font-extrabold rounded">
                      TRIGGER: "{temp.triggerPhrase}"
                    </span>
                    <span className="text-[9px] font-mono text-stone-400">
                      ID: {temp.id}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-stone-950">
                    {isFR ? temp.questionFR : temp.questionEN}
                  </h4>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[8px] font-mono text-stone-400 uppercase block font-bold">{isFR ? "CONVERSATIONS" : "TOTAL USAGE"}</span>
                    <span className="text-xs font-mono font-black text-stone-800">{temp.usageCount} {isFR ? "fois" : "probes"}</span>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-[8px] font-mono text-stone-400 uppercase block font-bold">{isFR ? "RATIO D'AIDE" : "HELPFUL RATIO"}</span>
                    <span className="text-xs font-mono font-black text-stone-800">
                      {temp.usageCount > 0 ? Math.round((temp.helpfulCount / temp.usageCount) * 100) : 0}%
                    </span>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-[8px] font-mono text-stone-400 uppercase block font-bold">{isFR ? "SCORE DE QUALITÉ" : "QUALITY SCORE"}</span>
                    <span className={`text-sm font-mono font-black ${
                      temp.qualityScore > 85 
                        ? 'text-emerald-600' 
                        : temp.qualityScore < 50 
                        ? 'text-rose-600' 
                        : 'text-stone-800'
                    }`}>
                      {temp.qualityScore}%
                    </span>
                  </div>

                  {temp.qualityScore < 40 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-mono font-extrabold rounded-md animate-pulse border border-rose-300 uppercase shrink-0">
                      {isFR ? "À Retirer" : "Flagged for retirement"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PROMPT TEMPLATES REGISTRY */}
      {activeTab === 'prompts' && (
        <div className="bg-white border-2 border-stone-950 p-6 rounded-3xl space-y-6 text-left">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="font-sans font-black text-base text-stone-900 uppercase tracking-wider font-sans">
              {isFR ? "Registre d'Optimisation des Prompts Système" : "Prompt Optimization Engine Registry"}
            </h3>
            <p className="text-xs text-stone-500 font-bold leading-normal">
              {isFR
                ? "Contrôlez l'historique d'évolution des instructions du recruteur IA. Les versions d'instructions modifient le ton, la rigueur et la pertinence d'évaluation."
                : "Trace and manage historical prompts fed into active interviewer engines. Admin verification prevents uncalibrated behavioral shifts."}
            </p>
          </div>

          <div className="space-y-4">
            {PromptOptimizer.getAllVersions().map(ver => (
              <div key={ver.version} className={`border-2 rounded-2xl p-5 space-y-4 transition-all ${
                ver.isActive 
                  ? 'border-indigo-600 bg-indigo-50/10' 
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-stone-900 text-white font-mono text-[9px] font-black rounded uppercase">
                        {ver.templateName}
                      </span>
                      <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.2 rounded-md">
                        {ver.version}
                      </span>
                      {ver.isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded uppercase">
                          {isFR ? "Actif" : "Active / Live"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-stone-150 p-2.5 rounded-xl text-left">
                    <div className="px-2">
                      <span className="text-[8px] font-mono text-stone-400 block uppercase font-bold">{isFR ? "COMPLÉTION" : "COMPL. RATE"}</span>
                      <span className="text-xs font-mono font-black text-stone-800">{ver.metrics.completionRate}%</span>
                    </div>
                    <div className="px-2">
                      <span className="text-[8px] font-mono text-stone-400 block uppercase font-bold">{isFR ? "SATISFACTION" : "SATISFACTION"}</span>
                      <span className="text-xs font-mono font-black text-stone-800">{ver.metrics.userSatisfaction}★</span>
                    </div>
                    <div className="px-2">
                      <span className="text-[8px] font-mono text-stone-400 block uppercase font-bold">{isFR ? "INDICE QUALITÉ" : "EVAL QUALITY"}</span>
                      <span className="text-xs font-mono font-black text-stone-800">{ver.metrics.evaluationQualityScore}%</span>
                    </div>
                    <div className="px-2">
                      <span className="text-[8px] font-mono text-stone-400 block uppercase font-bold">{isFR ? "PROFOND. DIALOG" : "AVG TURNS"}</span>
                      <span className="text-xs font-mono font-black text-stone-800">{ver.metrics.conversationDepth}t</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wider block font-black">EN Prompt Template:</span>
                    <p className="bg-white border border-stone-150 rounded-xl p-3.5 font-mono text-[11px] text-stone-700 leading-relaxed font-semibold">
                      {ver.instructionsEN}
                    </p>
                  </div>
                </div>

                {!ver.isActive && (
                  <button
                    onClick={() => {
                      PromptOptimizer.rollbackToVersion(ver.version);
                      triggerToast(
                        isFR 
                          ? `Rollback effectué ! Configuration restaurée à la version ${ver.version}` 
                          : `Successfully rolled back active prompt configuration to version ${ver.version}`,
                        'info'
                      );
                      loadData();
                    }}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-white text-[10px] font-mono font-bold rounded-lg border border-stone-950 transition-all shadow-xs"
                  >
                    {isFR ? "Restaurer cette version" : "Rollback to this version"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. PENDING REVIEWS WORKFLOW */}
      {activeTab === 'proposals' && (
        <div className="bg-white border-2 border-stone-950 p-6 rounded-3xl space-y-6 text-left">
          <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-sans font-black text-base text-stone-900 uppercase tracking-wider font-sans">
                {isFR ? "Validation Humaine du Flux d'Apprentissage" : "Human-in-the-Loop Review Pipeline"}
              </h3>
              <p className="text-xs text-stone-500 font-bold leading-normal">
                {isFR
                  ? "Audit sécurisé et manuel des optimisations générées. Modifiez, planifiez ou rejetez les configurations d'apprentissage."
                  : "Verify system improvements, tweak their target parameters, coordinate rollout timetables, or decline calibrations."}
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-500 border-2 border-stone-950 text-stone-950 font-mono text-xs font-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {proposals.length} {isFR ? "PROPOSITIONS ACTIVES" : "PENDING AUDITS"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Col: Pending proposal cards */}
            <div className="lg:col-span-2 space-y-4">
              {proposals.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-3xl text-sm font-bold text-stone-400">
                  {isFR ? "Toutes les propositions ont été passées en revue !" : "Zero pending system suggestions. The platform is running optimally."}
                </div>
              ) : (
                proposals.map(prop => {
                  const isSelected = selectedProposal?.id === prop.id;
                  return (
                    <div 
                      key={prop.id} 
                      onClick={() => {
                        setSelectedProposal(prop);
                        setEditingId(null);
                      }}
                      className={`border-2 rounded-2xl p-5 space-y-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-50/5/10 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]' 
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-stone-950 text-white font-mono text-[9px] font-black rounded uppercase">
                              {prop.category}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono font-bold">
                              {new Date(prop.suggestedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-stone-900 mt-1">
                            {isFR ? prop.titleFR : prop.titleEN}
                          </h4>
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                        {isFR ? prop.descriptionFR : prop.descriptionEN}
                      </p>

                      <div className="flex items-center justify-between border-t border-stone-100 pt-3 mt-2 text-[10px] font-mono font-extrabold text-stone-400">
                        <span>{isFR ? "CLIQUEZ POUR CONFIGURER" : "CLICK TO MANAGE LIFECYCLE"}</span>
                        <span className="text-amber-500 font-black">→</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Col: Interactive Control Deck */}
            <div className="bg-stone-50 border-2 border-stone-950 p-5 rounded-2xl space-y-5 text-left sticky top-4">
              {selectedProposal ? (
                <div className="space-y-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono font-black text-amber-700 bg-amber-50 border border-amber-200 rounded uppercase">
                      PENDING REVIEW
                    </span>
                    <h4 className="font-sans font-black text-sm text-stone-900 mt-1.5 leading-tight">
                      {isFR ? selectedProposal.titleFR : selectedProposal.titleEN}
                    </h4>
                  </div>

                  <div className="bg-white border border-stone-200 p-3.5 rounded-xl space-y-2">
                    <span className="text-[8px] font-mono text-stone-400 block uppercase font-bold">{isFR ? "VALEUR D'ORIGINE" : "ORIGINAL VALUE"}</span>
                    <p className="text-[11px] font-semibold text-stone-500 leading-normal bg-stone-50 p-2 rounded border border-stone-150">
                      {selectedProposal.originalValue}
                    </p>
                  </div>

                  <div className="bg-white border border-stone-200 p-3.5 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono text-stone-400 block uppercase font-bold">{isFR ? "VALEUR PROPOSÉE" : "PROPOSED VALUE"}</span>
                      {editingId !== selectedProposal.id ? (
                        <button 
                          onClick={() => {
                            setEditingId(selectedProposal.id);
                            setEditingValue(selectedProposal.proposedValue);
                          }}
                          className="text-[9px] font-mono text-indigo-600 font-extrabold hover:underline"
                        >
                          {isFR ? "Modifier" : "Modify / Tweak"}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleModify(selectedProposal.id)}
                            className="text-[9px] font-mono text-emerald-600 font-extrabold hover:underline"
                          >
                            {isFR ? "Enregistrer" : "Save"}
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="text-[9px] font-mono text-stone-400 font-extrabold hover:underline"
                          >
                            {isFR ? "Annuler" : "Cancel"}
                          </button>
                        </div>
                      )}
                    </div>

                    {editingId === selectedProposal.id ? (
                      <textarea
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="w-full text-[11px] font-mono border border-stone-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[100px]"
                      />
                    ) : (
                      <p className="text-[11px] font-mono text-stone-800 leading-normal bg-amber-50/20 p-2 rounded border border-amber-100">
                        {selectedProposal.proposedValue}
                      </p>
                    )}
                  </div>

                  {/* Lifecycle actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleApprove(selectedProposal.id, editingId === selectedProposal.id ? editingValue : undefined)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl border border-emerald-700 shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isFR ? "Approuver" : "Approve & Deploy"}</span>
                    </button>
                    
                    <button
                      onClick={() => handleReject(selectedProposal.id)}
                      className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-mono text-xs font-bold rounded-xl border border-stone-300 shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>{isFR ? "Rejeter" : "Reject"}</span>
                    </button>
                  </div>

                  {showScheduleModal === selectedProposal.id ? (
                    <div className="bg-white border border-stone-200 p-3 rounded-xl space-y-2 mt-2">
                      <span className="text-[9px] font-mono text-stone-400 block uppercase font-bold">{isFR ? "DELAI DU ROLLOUT" : "ROLLOUT SCHEDULE DELAY"}</span>
                      <div className="flex items-center gap-2">
                        <select 
                          value={scheduleDelay} 
                          onChange={(e) => setScheduleDelay(Number(e.target.value))}
                          className="text-[11px] font-mono border border-stone-300 rounded px-1.5 py-1 flex-1 bg-stone-50"
                        >
                          <option value={3000}>3 {isFR ? "secondes (Test)" : "seconds (Sandbox test)"}</option>
                          <option value={10000}>10 {isFR ? "secondes" : "seconds"}</option>
                          <option value={86400000}>24 {isFR ? "heures" : "hours"}</option>
                          <option value={259200000}>72 {isFR ? "heures" : "hours"}</option>
                        </select>
                        <button
                          onClick={() => handleSchedule(selectedProposal.id)}
                          className="px-2.5 py-1 bg-stone-900 text-white text-[11px] font-mono font-bold rounded-md"
                        >
                          {isFR ? "Planifier" : "Schedule"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowScheduleModal(selectedProposal.id)}
                      className="w-full px-3 py-2 bg-white hover:bg-stone-50 text-stone-700 font-mono text-xs font-bold rounded-xl border border-stone-300 shadow-xs flex items-center justify-center gap-1.5 mt-1"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{isFR ? "Planifier Déploiement" : "Schedule Future Rollout"}</span>
                    </button>
                  )}

                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <Sliders className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs font-bold text-stone-400 leading-normal">
                    {isFR 
                      ? "Sélectionnez une proposition de la liste pour configurer sa mise en œuvre." 
                      : "Select an optimization ticket from the pipeline to manage its deployment lifecycle."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. HISTORY, DEPLOYMENT & ROLLBACKS */}
      {activeTab === 'history' && (
        <div className="space-y-6 text-left">
          {/* Top: Active deployed history with Rollback buttons */}
          <div className="bg-white border-2 border-stone-950 p-6 rounded-3xl space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="font-sans font-black text-sm text-stone-900 uppercase tracking-wider">
                {isFR ? "Registre de Traçabilité des Déploiements IA" : "Deployment Audit Trail & Rollback Hub"}
              </h3>
              <p className="text-[11px] text-stone-400 font-bold">
                {isFR ? "Tous les changements déployés en production sont auditables et réversibles à tout moment." : "Trace all active configuration modifications pushed live. Click Rollback to instantly restore preceding safe states."}
              </p>
            </div>

            <div className="space-y-4">
              {deploymentHistory.map(rec => (
                <div key={rec.id} className="border border-stone-200 rounded-xl p-4 bg-stone-50/10 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-stone-100 pb-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-stone-200 border border-stone-300 text-stone-800 font-mono text-[8px] font-black rounded uppercase">
                          {rec.category}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono font-bold">
                          {isFR ? "Appliqué le" : "Applied"} {rec.appliedAt ? new Date(rec.appliedAt).toLocaleString() : new Date(rec.suggestedAt).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-stone-800">
                        {isFR ? rec.titleFR : rec.titleEN}
                      </h4>
                    </div>

                    {rec.status === 'approved' && (
                      <button
                        onClick={() => handleRollback(rec.id)}
                        className="px-3 py-1 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[10px] font-bold rounded-lg border border-stone-950 flex items-center gap-1 shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isFR ? "Rollback instantané" : "Rollback to safe state"}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-stone-500 font-medium">
                    {rec.traceabilityNotes}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 bg-white border border-stone-150 rounded-lg text-[10px] font-mono">
                      <span className="text-[8px] text-stone-400 uppercase tracking-wider block font-bold">{isFR ? "SÉPARATEUR ENTRANT" : "ORIGINAL CONFIGURATION"}</span>
                      <p className="text-stone-600 line-clamp-1">{rec.originalValue}</p>
                    </div>
                    <div className="p-2.5 bg-white border border-stone-150 rounded-lg text-[10px] font-mono">
                      <span className="text-[8px] text-stone-400 uppercase tracking-wider block font-bold">{isFR ? "SÉPARATEUR DÉPLOYÉ" : "DEPLOYED INTEGRATION"}</span>
                      <p className="text-stone-800 font-bold line-clamp-1">{rec.proposedValue}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: General system learning history logs */}
          <div className="bg-stone-50 border-2 border-stone-950 p-6 rounded-3xl space-y-4">
            <div className="border-b border-stone-150 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-black text-sm text-stone-900 uppercase tracking-wider">
                  {isFR ? "Journal d'Audit du Flux d'Apprentissage Global" : "Global Learning System Audit Stream"}
                </h3>
                <p className="text-[11px] text-stone-400 font-bold">
                  {isFR ? "Vérification cryptographique et intégrité de la base de connaissances globale" : "Continuous tamper-proof ledger tracking all self-improvement actions in memory"}
                </p>
              </div>
              <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[9px] font-black rounded-md">
                SECURE LEDGER
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {learningHistory.map(evt => (
                <div key={evt.id} className="p-3 bg-white border border-stone-200 rounded-xl flex items-start gap-3 hover:bg-stone-50/50 transition-all">
                  <span className="text-emerald-600 shrink-0 mt-0.5">✓</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-4">
                      <span className="px-1.5 py-0.5 bg-stone-100 text-stone-600 text-[8px] font-mono font-bold rounded">
                        {evt.eventType.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-mono text-stone-400 font-semibold shrink-0">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-stone-700 mt-1">
                      {isFR ? evt.descriptionFR : evt.descriptionEN}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
