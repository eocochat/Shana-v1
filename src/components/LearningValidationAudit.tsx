import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LearningValidationLoop, ValidationLog } from '../lib/learningLoop';
import { 
  CheckCircle, 
  XCircle, 
  ArrowUpRight, 
  Cpu, 
  Sparkles, 
  ListRestart, 
  Activity, 
  TrendingUp, 
  Lock, 
  AlertCircle,
  TrendingDown,
  Info
} from 'lucide-react';
import { Language } from '../types';

interface LearningValidationAuditProps {
  userId: string;
  lang: Language;
}

export default function LearningValidationAudit({ userId, lang }: LearningValidationAuditProps) {
  const [logs, setLogs] = React.useState<ValidationLog[]>(() => LearningValidationLoop.getLogs(userId));
  const [expandedActionId, setExpandedActionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleUpdate = () => {
      setLogs(LearningValidationLoop.getLogs(userId));
    };
    window.addEventListener('shana_learning_update', handleUpdate);
    window.addEventListener('shana_progress_update', handleUpdate);
    return () => {
      window.removeEventListener('shana_learning_update', handleUpdate);
      window.removeEventListener('shana_progress_update', handleUpdate);
    };
  }, [userId]);

  const guide = LearningValidationLoop.getSystemOptimizationGuide(userId);
  const totalActions = logs.length;
  const successfulActions = logs.filter(l => l.successFlag).length;
  const successRate = totalActions > 0 ? Math.round((successfulActions / totalActions) * 100) : 0;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[32px] p-6 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#F3F4F6] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
            <h3 className="font-sans font-black text-sm text-[#1A2B3C] uppercase tracking-wider">
              {lang === 'EN' ? "SHANA Learning Validation Loop" : "Boucle de Validation d'Apprentissage SHANA"}
            </h3>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF] mt-0.5 font-bold">
            {lang === 'EN' ? "Active Self-Optimization and Audit Log" : "Auto-Optimisation Active et Log d'Audit"}
          </p>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {guide.recoveryRequired ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-mono font-bold text-red-700 bg-red-50 border border-red-200 rounded-full">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              {lang === 'EN' ? "FALLBACK MODE (STABILITY ASSURED)" : "MODE SÉCURITÉ (STABILITÉ ACTIVÉE)"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              {lang === 'EN' ? "OPTIMIZING ON VALIDATED OUTCOMES" : "OPTIMISATION SUR IMPACTS PROUVÉS"}
            </span>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-stone-50 border border-stone-200/50 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono font-bold uppercase text-[#9CA3AF] block">
              {lang === 'EN' ? "Tracked Decisions" : "Décisions Mesurées"}
            </span>
            <span className="font-sans font-black text-xl text-stone-900 mt-0.5 block">{totalActions}</span>
          </div>
          <Activity className="w-7 h-7 text-stone-300" />
        </div>

        <div className="p-4 bg-stone-50 border border-stone-200/50 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono font-bold uppercase text-[#9CA3AF] block">
              {lang === 'EN' ? "Proven Success Rate" : "Taux de Progrès Prouvé"}
            </span>
            <span className={`font-sans font-black text-xl mt-0.5 block ${successRate >= 60 ? 'text-emerald-600' : 'text-stone-900'}`}>
              {successRate}%
            </span>
          </div>
          <TrendingUp className="w-7 h-7 text-stone-300" />
        </div>

        <div className="p-4 bg-stone-50 border border-stone-200/50 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono font-bold uppercase text-[#9CA3AF] block">
              {lang === 'EN' ? "Decisions Suppressed" : "Décisions Bloquées (Risque)"}
            </span>
            <span className="font-sans font-black text-xl text-stone-900 mt-0.5 block">
              {guide.suppress.length}
            </span>
          </div>
          <Lock className="w-7 h-7 text-stone-300" />
        </div>
      </div>

      {/* Optimizer Directives Panel */}
      <div className="p-4 bg-amber-50/20 border border-amber-100/60 rounded-2xl space-y-3">
        <div className="flex items-center gap-1.5 border-b border-amber-100/30 pb-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-mono font-extrabold text-[#1A2B3C] uppercase tracking-wider">
            {lang === 'EN' ? "Under the hood: Self-Improvement Policy" : "Sous le capot : Politique d'Auto-Amélioration"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-extrabold text-emerald-700 uppercase block tracking-wider">
              ▲ {lang === 'EN' ? "Reinforcing Successful Patterns" : "Renforcement des Modèles Positifs"}
            </span>
            {guide.promote.length === 0 ? (
              <p className="text-[#6B7280] italic font-semibold">
                {lang === 'EN' ? "Gathering performance baseline..." : "Collecte des données initiales..."}
              </p>
            ) : (
              <ul className="list-disc pl-4 space-y-1 font-bold text-stone-800">
                {guide.promote.map((p, idx) => (
                  <li key={idx} className="truncate">{p}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-mono font-extrabold text-red-700 uppercase block tracking-wider">
              ▼ {lang === 'EN' ? "Suppressed/Adjusted Failure Modes" : "Ajustement ou Retrait des Échecs"}
            </span>
            {guide.suppress.length === 0 ? (
              <p className="text-[#6B7280] italic font-semibold">
                {lang === 'EN' ? "No negative performance drops detected." : "Aucune baisse significative détectée."}
              </p>
            ) : (
              <ul className="list-disc pl-4 space-y-1 font-bold text-stone-800">
                {guide.suppress.map((s, idx) => (
                  <li key={idx} className="truncate">{s}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono font-bold uppercase text-[#9CA3AF] tracking-wider block">
          {lang === 'EN' ? "Audit Logs (Before vs. After Impact)" : "Journaux d'Audit (Impact Avant / Après)"}
        </span>

        {logs.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-stone-200 rounded-2xl text-xs text-[#9CA3AF] font-bold font-mono">
            {lang === 'EN' 
              ? "No validation records yet. Complete an interactive mirror session to start validating." 
              : "Aucun enregistrement d'audit. Terminez une évaluation miroir pour démarrer la validation."}
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.slice().reverse().map((log) => {
              const isExpanded = expandedActionId === log.actionId;
              const hasAfter = log.afterMetrics !== null;
              const isPositive = log.successFlag;
              const evaluation = LearningValidationLoop.evaluateActionSuccess(userId, log.actionId);

              return (
                <div 
                  key={log.actionId} 
                  className={`border rounded-2xl transition-all ${
                    isExpanded ? 'border-stone-400 bg-stone-50/10' : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* Summary row */}
                  <div 
                    onClick={() => setExpandedActionId(isExpanded ? null : log.actionId)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 text-[#1F2937] font-mono text-[9px] font-bold rounded-md">
                          {log.system.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono font-semibold">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="font-sans font-black text-xs text-stone-900 truncate">
                        {log.actionApplied}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {hasAfter ? (
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 text-xs font-mono font-black ${
                            isPositive ? 'text-emerald-600' : log.outcomeScore === 0 ? 'text-stone-500' : 'text-red-500'
                          }`}>
                            {isPositive ? '▲' : log.outcomeScore === 0 ? '●' : '▼'}{' '}
                            {log.outcomeScore > 0 ? `+${log.outcomeScore}` : log.outcomeScore} IPS
                          </span>
                          <span className="block text-[8px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                            {lang === 'EN' ? "Outcome" : "Résultat"}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[8px] font-mono font-black text-amber-700 bg-amber-50 border border-amber-200 rounded">
                          {lang === 'EN' ? "PENDING..." : "EN COURS..."}
                        </span>
                      )}

                      <div className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center bg-white shadow-xs">
                        <span className="text-[10px] text-stone-500">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-stone-200/65 bg-stone-50/50 p-4 space-y-4 text-xs text-stone-800"
                      >
                        {/* Context & Actions info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3.5 border border-stone-200/50 rounded-xl">
                          <div>
                            <span className="text-[8px] font-mono font-bold text-stone-400 uppercase block tracking-wider">
                              {lang === 'EN' ? "Input Signal & Context" : "Signal d'Entrée & Contexte"}
                            </span>
                            <p className="font-bold text-stone-700 mt-0.5">{log.inputContext}</p>
                          </div>
                          <div>
                            <span className="text-[8px] font-mono font-bold text-stone-400 uppercase block tracking-wider">
                              {lang === 'EN' ? "Applied Strategy" : "Stratégie Appliquée"}
                            </span>
                            <p className="font-bold text-stone-700 mt-0.5">{log.actionApplied}</p>
                          </div>
                        </div>

                        {/* Detailed Metrics Comparison */}
                        <div>
                          <span className="text-[8px] font-mono font-bold text-stone-400 uppercase block tracking-widest mb-2">
                            {lang === 'EN' ? "BEFORE vs. AFTER PERFORMANCE BREAKDOWN" : "COMPARAISON DES VECTEURS DE PERFORMANCE"}
                          </span>
                          
                          <div className="space-y-2">
                            {[
                              { label: lang === 'EN' ? "IPS Score" : "Score IPS", before: log.beforeMetrics.ips, after: log.afterMetrics?.ips },
                              { label: lang === 'EN' ? "Clarity" : "Clarté", before: log.beforeMetrics.clarity, after: log.afterMetrics?.clarity },
                              { label: lang === 'EN' ? "Structure" : "Structure", before: log.beforeMetrics.structure, after: log.afterMetrics?.structure },
                              { label: lang === 'EN' ? "Confidence" : "Assurance", before: log.beforeMetrics.confidence, after: log.afterMetrics?.confidence },
                            ].map((m, idx) => {
                              const diff = m.after !== undefined ? m.after - m.before : null;

                              return (
                                <div key={idx} className="flex justify-between items-center p-2.5 bg-white border border-stone-150 rounded-xl">
                                  <span className="font-bold text-stone-700">{m.label}</span>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-stone-400 font-mono text-[10px]">{m.before}</span>
                                      <span className="text-stone-300">→</span>
                                      <span className="font-mono font-black text-stone-800">
                                        {m.after !== undefined ? m.after : '--'}
                                      </span>
                                    </div>
                                    {diff !== null && (
                                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold rounded ${
                                        diff > 0 ? 'text-emerald-700 bg-emerald-50' : diff === 0 ? 'text-stone-500 bg-stone-100' : 'text-red-700 bg-red-50'
                                      }`}>
                                        {diff > 0 ? `+${diff}` : diff}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Verdict / AI Summary */}
                        <div className="p-3.5 bg-stone-900 text-white rounded-2xl flex items-start gap-3">
                          <Info className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[8px] font-mono font-bold text-amber-400 uppercase block tracking-wider">
                              {lang === 'EN' ? "SHANA Core Loop Verdict" : "Verdict de la Boucle SHANA"}
                            </span>
                            <p className="font-sans font-bold text-stone-100 leading-relaxed mt-0.5">
                              {evaluation.reason}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
