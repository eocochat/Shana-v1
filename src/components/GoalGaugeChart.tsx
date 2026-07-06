import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { StorageService } from '../lib/storage';
import { Language, UserProfile, SessionHistoryItem } from '../types';
import { Target, Trophy, Flame, ChevronRight, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface GoalGaugeChartProps {
  user: UserProfile;
  history: SessionHistoryItem[];
  lang: Language;
}

export default function GoalGaugeChart({ user, history, lang }: GoalGaugeChartProps) {
  const session = StorageService.getSession();
  const userId = session?.user?.id || 'guest';
  
  // 1. Target progress state (manual input/slider, persisted in local storage)
  const [targetProgress, setTargetProgress] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`shana_target_progress_${userId}`);
      return saved ? parseInt(saved, 10) : 75; // default target to 75%
    } catch {
      return 75;
    }
  });

  // 2. Actual progress state calculated live
  const [actualProgress, setActualProgress] = useState<number>(0);
  const [steps, setSteps] = useState<{ label: string; completed: boolean }[]>([]);

  useEffect(() => {
    const calculateProgress = () => {
      const isFrench = lang === 'FR';
      const hasCV = !!StorageService.getAnalysis(userId);
      const voiceTrainingCount = StorageService.getVoiceSessionsCount(userId);
      const hasAssess = history.some((item) => item.type === 'ASSESS');
      
      const currentSession = StorageService.getSession();
      const hasProfile = !!(currentSession?.profile?.onboardingCompleted && currentSession?.profile?.targetRole);

      const items = [
        { label: isFrench ? "Profil" : "Profile Setup", completed: hasProfile },
        { label: isFrench ? "CV Analysé" : "CV Analyzed", completed: hasCV },
        { label: isFrench ? "Entraînement" : "Voice Training", completed: voiceTrainingCount > 0 },
        { label: isFrench ? "Évaluation" : "Assessment", completed: hasAssess }
      ];

      const completedCount = items.filter(s => s.completed).length;
      setActualProgress(completedCount * 25);
      setSteps(items);
    };

    calculateProgress();

    // Re-run on progress update events
    window.addEventListener('shana_progress_update', calculateProgress);
    return () => {
      window.removeEventListener('shana_progress_update', calculateProgress);
    };
  }, [userId, lang, history, user]);

  // Handle manual goal change
  const handleTargetChange = (val: number) => {
    setTargetProgress(val);
    try {
      localStorage.setItem(`shana_target_progress_${userId}`, val.toString());
      // Trigger update event
      window.dispatchEvent(new Event('shana_progress_update'));
    } catch (e) {
      console.warn(e);
    }
  };

  // Prepare data for Recharts semi-circle Gauges
  // Actual Progress semi-circle Pie data
  const actualPieData = [
    { value: actualProgress, color: actualProgress >= targetProgress ? '#10B981' : '#F59E0B' }, // Emerald or Amber
    { value: 100 - actualProgress, color: '#F3F4F6' } // Light gray track
  ];

  // Target Progress semi-circle Pie data
  const targetPieData = [
    { value: targetProgress, color: '#1A2B3C' }, // Deep Navy slate representation
    { value: 100 - targetProgress, color: '#E5E7EB' } // Gray track
  ];

  const diff = actualProgress - targetProgress;
  const isGoalMet = diff >= 0;

  return (
    <div 
      id="goal-gauge-card" 
      className="bg-white border border-[#E5E7EB] rounded-[32px] p-6 shadow-sm hover:border-[#1A2B3C]/10 transition-all space-y-6 select-none"
    >
      {/* Header and description */}
      <div className="flex justify-between items-start border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="p-1 bg-[#FFF5D6] rounded-md text-[#B7791F] border border-[#FFE8A3]">
              <Target className="w-4 h-4" />
            </span>
            <span className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">
              {lang === 'FR' ? "OBJECTIFS DE PRÉPARATION" : "PREPARATION GOALS"}
            </span>
          </div>
          <h3 className="font-sans font-black text-base text-stone-900 uppercase tracking-tight">
            {lang === 'FR' ? "Cible Quotidienne & Hebdomadaire" : "Daily & Weekly Targets"}
          </h3>
          <p className="text-[11px] text-stone-500 font-medium leading-relaxed mt-0.5 max-w-md">
            {lang === 'FR' 
              ? "Fixez manuellement vos objectifs de préparation et évaluez votre avancement réel d'entretien."
              : "Manually set your preparation milestone targets and visually evaluate your training flow."}
          </p>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase border tracking-wider flex items-center gap-1.5 ${
          isGoalMet 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {isGoalMet ? <Trophy className="w-3 h-3" /> : <Flame className="w-3 h-3" />}
          {isGoalMet 
            ? (lang === 'FR' ? "OBJECTIF ATTEINT" : "GOAL ACHIEVED") 
            : (lang === 'FR' ? "EN COURS" : "IN PROGRESS")}
        </div>
      </div>

      {/* Main interactive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Column: Recharts dual gauge chart */}
        <div className="flex flex-col items-center justify-center relative h-48 bg-stone-50/50 rounded-2xl border border-stone-100 p-4">
          <div className="w-full h-full relative" style={{ minHeight: '130px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* Outer Ring: Target Progress */}
                <Pie
                  data={targetPieData}
                  cx="50%"
                  cy="90%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={72}
                  outerRadius={84}
                  dataKey="value"
                  stroke="none"
                >
                  {targetPieData.map((entry, index) => (
                    <Cell key={`cell-target-${index}`} fill={entry.color} />
                  ))}
                </Pie>

                {/* Inner Ring: Actual Progress */}
                <Pie
                  data={actualPieData}
                  cx="50%"
                  cy="90%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={56}
                  outerRadius={68}
                  dataKey="value"
                  stroke="none"
                >
                  {actualPieData.map((entry, index) => (
                    <Cell key={`cell-actual-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Readout in the middle of the semi-circle */}
            <div className="absolute inset-0 flex flex-col justify-end items-center pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                {lang === 'FR' ? "AVANCEMENT ACTUEL" : "ACTUAL"}
              </span>
              <span className="text-3xl font-sans font-black text-stone-900 tracking-tight leading-none mt-1">
                {actualProgress}%
              </span>
              <span className="text-[10px] font-mono font-bold text-stone-500 mt-1">
                {lang === 'FR' ? `Cible : ${targetProgress}%` : `Target: ${targetProgress}%`}
              </span>
            </div>
          </div>

          {/* Indicator legend labels */}
          <div className="flex justify-center gap-4 text-[9px] font-mono font-black uppercase tracking-wider pt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#1A2B3C] border border-stone-300"></span>
              <span className="text-stone-500">{lang === 'FR' ? "CIBLE" : "TARGET"} ({targetProgress}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded border ${
                actualProgress >= targetProgress ? 'bg-emerald-500 border-emerald-300' : 'bg-amber-500 border-amber-300'
              }`}></span>
              <span className="text-stone-500">{lang === 'FR' ? "RÉALISÉ" : "ACTUAL"} ({actualProgress}%)</span>
            </div>
          </div>
        </div>

        {/* Right Column: interactive slider & controls */}
        <div className="space-y-5">
          {/* Target adjustment slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-stone-700">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-stone-500" />
                {lang === 'FR' ? "Ajuster l'Objectif de Préparation" : "Adjust Preparation Target"}
              </span>
              <span className="font-mono text-[13px] font-black text-[#1A2B3C] bg-stone-100 px-2.5 py-0.5 rounded border border-stone-200">
                {targetProgress}%
              </span>
            </div>

            <div className="relative pt-2">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={targetProgress}
                onChange={(e) => handleTargetChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#1A2B3C] border border-stone-250/50"
              />
              <div className="flex justify-between text-[9px] font-mono text-stone-400 font-bold px-1 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-mono font-black text-stone-400 uppercase tracking-wider block">
              {lang === 'FR' ? "Raccourcis d'Objectifs" : "Target Presets"}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[25, 50, 75, 100].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleTargetChange(preset)}
                  className={`py-1.5 rounded-lg border text-[10px] font-mono font-black tracking-wider transition-all cursor-pointer ${
                    targetProgress === preset
                      ? 'bg-[#1A2B3C] text-white border-[#1A2B3C] shadow-sm'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          {/* Performance summary explanation panel */}
          <div className="bg-stone-50 border border-stone-150 p-4 rounded-2xl">
            <div className="flex items-start gap-2.5">
              <Award className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-black uppercase text-stone-400 tracking-wider">
                  {lang === 'FR' ? "ANALYSE DE COMPARAISON" : "COMPARISON INSIGHT"}
                </span>
                <p className="text-xs text-stone-700 leading-relaxed font-semibold">
                  {actualProgress === 0 ? (
                    lang === 'FR'
                      ? "Bienvenue sur SHANA ! Avançons pas à pas et à votre rythme. Déposez votre CV pour commencer l'aventure en toute sérénité !"
                      : "Welcome to SHANA! Let's take it step-by-step at your own pace. Upload your CV to begin your journey with ease!"
                  ) : isGoalMet ? (
                    lang === 'FR' 
                      ? `Félicitations ! Vous surpassez votre cible de ${diff}%. Votre régularité est excellente.`
                      : `Superb work! You are pacing ${diff}% ahead of your target. Your training momentum is stellar.`
                  ) : (
                    lang === 'FR'
                      ? `Vous êtes actuellement à ${Math.abs(diff)}% de votre cible idéale. Complétez la prochaine action conseillée.`
                      : `You are currently ${Math.abs(diff)}% behind your target. Complete the next recommended action below to catch up.`
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      {/* Step checklist details */}
      <div className="pt-4 border-t border-stone-100">
        <span className="text-[9px] font-mono font-black text-stone-400 uppercase tracking-wider block mb-2.5">
          {lang === 'FR' ? "VÉRIFICATION DE L'INDICE" : "MILESTONE MATRIX CHECK"}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {steps.map((st, idx) => (
            <div 
              key={idx} 
              className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                st.completed 
                  ? 'bg-emerald-50/40 border-emerald-200/60 text-emerald-800' 
                  : 'bg-stone-50/50 border-stone-150 text-stone-400'
              }`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black font-mono ${
                st.completed ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-500'
              }`}>
                {st.completed ? "✓" : idx + 1}
              </div>
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wide truncate">
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
