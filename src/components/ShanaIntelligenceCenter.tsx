import React, { useState } from 'react';
import { Sparkles, Brain, Award, ShieldCheck, UserCheck, AlertCircle, FileText, CheckCircle, TrendingUp, HelpCircle, Heart } from 'lucide-react';

interface ShanaIntelligenceCenterProps {
  conversationState: any;
  language: string;
}

export default function ShanaIntelligenceCenter({ conversationState, language }: ShanaIntelligenceCenterProps) {
  const [activeTab, setActiveTab] = useState<'brain' | 'twin' | 'evidence' | 'eq'>('brain');
  const isEng = language === 'English';

  if (!conversationState) {
    return (
      <div className="cyber-card p-5 rounded-3xl bg-slate-950/40 border border-slate-850 text-left space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400 animate-pulse" />
          <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-300">
            {isEng ? "SHANA PROPRIETARY INTELLIGENCE" : "INTELLIGENCE PROPRIÉTAIRE SHANA"}
          </h4>
        </div>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          {isEng
            ? "Awaiting your first spoken or written response to calibrate SHANA's five real-time proprietary intelligence layers."
            : "En attente de votre première réponse orale ou écrite pour calibrer les cinq couches d'intelligence propriétaire de SHANA."}
        </p>
      </div>
    );
  }

  const { recruiterBrainTurns, digitalTwin, evidenceRecords, competenciesStatus, recruiterDecision } = conversationState;
  const lastBrainTurn = recruiterBrainTurns && recruiterBrainTurns.length > 0 
    ? recruiterBrainTurns[recruiterBrainTurns.length - 1] 
    : null;

  // Render a clean character block-bar for percentages
  const renderBlockBar = (percentage: number) => {
    const totalBlocks = 10;
    const filledBlocks = Math.round((percentage / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    const barStr = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
    return (
      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
        <span className="text-violet-400 font-bold">{barStr}</span>
        <span className="text-white font-extrabold">{percentage}%</span>
      </div>
    );
  };

  return (
    <div className="cyber-card p-5 rounded-3xl bg-slate-950/50 border border-slate-800 text-left space-y-4 shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-white">
            {isEng ? "INTELLIGENCE LAYER ACTIVE" : "COUCHES D'INTELLIGENCE ACTIVES"}
          </h4>
        </div>
        <div className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-violet-950/60 border border-violet-800 text-violet-300 font-bold">
          5 LAYERS LIVE
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-4 gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-850">
        <button
          onClick={() => setActiveTab('brain')}
          className={`py-1.5 px-2 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'brain' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Brain className="w-3 h-3" />
          <span>{isEng ? "Brain" : "Cerveau"}</span>
        </button>
        <button
          onClick={() => setActiveTab('twin')}
          className={`py-1.5 px-2 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'twin' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <UserCheck className="w-3 h-3" />
          <span>{isEng ? "Twin" : "Double"}</span>
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`py-1.5 px-2 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'evidence' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Award className="w-3 h-3" />
          <span>{isEng ? "Evidence" : "Preuves"}</span>
        </button>
        <button
          onClick={() => setActiveTab('eq')}
          className={`py-1.5 px-2 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'eq' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-850/40'
          }`}
        >
          <Heart className="w-3 h-3 text-rose-400" />
          <span>{isEng ? "EQ" : "QE"}</span>
        </button>
      </div>

      {/* Tab 1: Recruiter Brain & Decision Engine */}
      {activeTab === 'brain' && (
        <div className="space-y-3.5 animate-fade-in text-xs">
          {lastBrainTurn ? (
            <div className="space-y-3">
              {/* Internal Thoughts */}
              <div className="space-y-2">
                <span className="text-[8px] font-mono uppercase text-slate-500 font-extrabold block">
                  {isEng ? "LAYER 1 — RECRUITER BRAIN REASONING" : "COUCHE 1 — RAISONNEMENT RECRUTEUR"}
                </span>
                
                <div className="bg-slate-900/40 border border-slate-850 p-2.5 rounded-xl space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-mono italic leading-relaxed">
                    <strong className="text-violet-300 not-italic uppercase text-[8px] tracking-wider block mb-0.5">
                      {isEng ? "What SHANA Learned:" : "Ce que SHANA a appris :"}
                    </strong>
                    "{lastBrainTurn.learnedSummary}"
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-slate-800 pt-1.5">
                    <span className="text-[9px] font-mono text-slate-500">
                      {isEng ? "Do I believe this answer?" : "Est-ce crédible ?"}
                    </span>
                    <span className={`text-[9px] font-mono font-extrabold ${lastBrainTurn.credibilityScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {lastBrainTurn.credibilityScore >= 70 
                        ? (isEng ? `Yes (Confidence: ${lastBrainTurn.credibilityScore}%)` : `Oui (Confiance : ${lastBrainTurn.credibilityScore}%)`)
                        : (isEng ? `Skeptical (Confidence: ${lastBrainTurn.credibilityScore}%)` : `Sceptique (Confiance : ${lastBrainTurn.credibilityScore}%)`)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-500">
                      {isEng ? "Verified Competency:" : "Compétence validée :"}
                    </span>
                    <span className="text-[9px] font-mono text-violet-300 font-bold">
                      {lastBrainTurn.competencyVerified}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-500">
                      {isEng ? "Tactical Stance:" : "Posture tactique :"}
                    </span>
                    <span className={`text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      lastBrainTurn.stance === 'challenge' ? 'bg-amber-950 text-amber-400 border border-amber-805' : 'bg-emerald-950 text-emerald-400 border border-emerald-805'
                    }`}>
                      {lastBrainTurn.stance}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recruiter Decision Engine */}
              {recruiterDecision && (
                <div className="border-t border-slate-850 pt-3 space-y-2">
                  <span className="text-[8px] font-mono uppercase text-slate-500 font-extrabold block">
                    {isEng ? "LAYER 5 — RECRUITER DECISION ENGINE" : "COUCHE 5 — MOTEUR DE DÉCISION"}
                  </span>
                  <div className="bg-slate-900/30 border border-slate-850 p-2.5 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold">{isEng ? "Recommendation:" : "Recommandation :"}</span>
                      <span className={`text-[10px] font-mono font-black uppercase ${
                        recruiterDecision.recommendation === 'Strong Hire' || recruiterDecision.recommendation === 'Hire'
                          ? 'text-emerald-400'
                          : recruiterDecision.recommendation === 'No Hire'
                            ? 'text-red-400'
                            : 'text-amber-400'
                      }`}>
                        {recruiterDecision.recommendation}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-mono uppercase text-slate-500 block font-bold">
                        {isEng ? "PRIMARY JUSTIFICATION" : "JUSTIFICATION PRINCIPALE"}
                      </span>
                      <p className="text-[10px] text-slate-300 leading-relaxed font-normal">
                        {recruiterDecision.reasons[0] || (isEng ? "Evaluating candidate competencies dynamically." : "Évaluation des compétences en cours.")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">
              {isEng ? "Answer the current question to populate the brain." : "Répondez à la question pour calibrer le cerveau."}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Candidate Digital Twin */}
      {activeTab === 'twin' && (
        <div className="space-y-3.5 animate-fade-in text-xs">
          <span className="text-[8px] font-mono uppercase text-slate-500 font-extrabold block">
            {isEng ? "LAYER 2 — CANDIDATE DIGITAL TWIN PROFILE" : "COUCHE 2 — PROFIL DOUBLE NUMÉRIQUE"}
          </span>

          {digitalTwin ? (
            <div className="space-y-2.5 bg-slate-900/30 p-3 rounded-xl border border-slate-850">
              {Object.entries(digitalTwin).map(([key, value]) => {
                if (typeof value !== 'number') return null;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-medium text-slate-300">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                    {renderBlockBar(value)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">
              {isEng ? "Digital Twin is aligning..." : "Double numérique en cours d'alignement..."}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Evidence Log & Competency Coverage */}
      {activeTab === 'evidence' && (
        <div className="space-y-3.5 animate-fade-in text-xs">
          {/* Key Competencies status */}
          <div className="space-y-2">
            <span className="text-[8px] font-mono uppercase text-slate-500 font-extrabold block">
              {isEng ? "LAYER 4 — COMPETENCY COVERAGE ENGINE" : "COUCHE 4 — COUVERTURE DES COMPÉTENCES"}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {Array.isArray(competenciesStatus) ? (
                competenciesStatus.map((status: any) => (
                  <div key={status.competency} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/40 border border-slate-850">
                    <div className="shrink-0">
                      {status.isSufficient ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono capitalize truncate block text-slate-300">
                        {status.competency}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 block">
                        {status.isSufficient ? (isEng ? "Covered" : "Couvert") : (isEng ? "Missing" : "Manquant")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-slate-500 text-[10px] py-2">
                  {isEng ? "Assessing key requirements..." : "Évaluation des exigences..."}
                </div>
              )}
            </div>
          </div>

          {/* Evidence Records extracted */}
          <div className="space-y-2 border-t border-slate-850 pt-3">
            <span className="text-[8px] font-mono uppercase text-slate-500 font-extrabold block">
              {isEng ? "LAYER 3 — EXTRACTED EVIDENCE RECORDS" : "COUCHE 3 — ÉLÉMENTS DE PREUVE EXTRAITS"}
            </span>

            {evidenceRecords && evidenceRecords.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {evidenceRecords.slice(-4).map((rec: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-850 p-2 rounded-xl text-[10px] leading-relaxed space-y-1 font-semibold text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-950 border border-violet-800 text-violet-300 font-mono uppercase tracking-wider font-extrabold">
                        {rec.competency}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono">
                        {isEng ? `Conf: ${rec.confidence}%` : `Conf : ${rec.confidence}%`}
                      </span>
                    </div>
                    <p className="italic font-normal">"{rec.description}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-[10px] italic">
                {isEng ? "No specific objective evidence extracted yet." : "Aucun élément de preuve objectif extrait pour le moment."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Emotional Intelligence (EQ Layer) */}
      {activeTab === 'eq' && (
        <div className="space-y-3.5 animate-fade-in text-xs text-left">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono uppercase text-slate-500 font-extrabold block">
              {isEng ? "LAYER 1.5 — SHANA REAL-TIME QE ENGINE" : "COUCHE 1.5 — MOTEUR QE EN TEMPS RÉEL SHANA"}
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-800 text-rose-300 font-extrabold uppercase tracking-wider">
              {conversationState.emotionState?.primaryVibe || 'neutral'}
            </span>
          </div>

          {conversationState.emotionState ? (
            <div className="space-y-3.5">
              {/* Dynamic Vibe Description */}
              <div className="bg-slate-900/60 border border-slate-850 p-2.5 rounded-xl space-y-1">
                <span className="text-[8px] font-mono uppercase text-slate-500 block font-bold">
                  {isEng ? "DYNAMIC COGNITIVE RESONANCE" : "RÉSONANCE COGNITIVE DYNAMIQUE"}
                </span>
                <p className="text-[10px] text-slate-300 leading-relaxed font-normal">
                  {isEng 
                    ? `Estimated primary conversational state is "${conversationState.emotionState.primaryVibe || 'neutral'}". Shana has dynamically aligned her recruiter tone, prosody pacing, and query complexity constraints.`
                    : `L'état conversationnel estimé est "${conversationState.emotionState.primaryVibe || 'neutral'}". Shana a aligné dynamiquement son ton, son rythme prosodique et la complexité de ses relances.`
                  }
                </p>
              </div>

              {/* Psychological Vectors */}
              <div className="space-y-2.5 bg-slate-900/30 p-3 rounded-xl border border-slate-850">
                <span className="text-[8px] font-mono uppercase text-slate-500 block font-bold mb-1">
                  {isEng ? "PSYCHOLOGICAL VECTORS" : "VECTEURS PSYCHOLOGIQUES"}
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-slate-400 font-medium">{isEng ? "Composure" : "Calme / Aplomb"}</span>
                    {renderBlockBar(conversationState.emotionState.composure ?? 50)}
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-slate-400 font-medium">{isEng ? "Cognitive Load" : "Charge Cognitive"}</span>
                    {renderBlockBar(conversationState.emotionState.cognitiveLoad ?? 30)}
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-slate-400 font-medium">{isEng ? "Imposter Syndrome" : "Syndrome d'Imposteur"}</span>
                    {renderBlockBar(conversationState.emotionState.imposterIndex ?? 20)}
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-slate-400 font-medium">{isEng ? "Defensiveness" : "Défensive"}</span>
                    {renderBlockBar(conversationState.emotionState.defensiveness ?? 10)}
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-slate-400 font-medium">{isEng ? "Flow State Rating" : "Niveau de Flow"}</span>
                    {renderBlockBar(conversationState.emotionState.flowStateRating ?? 50)}
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-slate-400 font-medium">{isEng ? "Stress Level" : "Niveau de Stress"}</span>
                    {renderBlockBar(conversationState.emotionState.stress ?? 40)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">
              {isEng ? "EQ engine is calibrating..." : "Calibrage du QE..."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
