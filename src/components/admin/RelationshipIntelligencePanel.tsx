import React from 'react';
import { Brain, Heart, TrendingUp, Users, ShieldAlert, Award, Shield, Sliders, Target, Eye, RefreshCw } from 'lucide-react';
import { RelationshipMemoryEngine, RelationshipAnalytics } from '../../lib/conversation/relationshipMemoryEngine';

interface RelationshipIntelligencePanelProps {
  lang: 'FR' | 'EN';
}

export default function RelationshipIntelligencePanel({ lang }: RelationshipIntelligencePanelProps) {
  const isFR = lang === 'FR';
  const metrics: RelationshipAnalytics = RelationshipMemoryEngine.getAdminAnalytics();

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* Header section */}
      <div className="bg-white border-[2.5px] border-stone-950 p-6 rounded-[24px] shadow-[6px_6px_0px_0px_#111111] space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
          <Brain className="w-4 h-4 text-emerald-850 animate-pulse" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-950 font-black">
            {isFR ? "MOTEUR D'EMPATHIE ET ANALYSE DE RELATION" : "RECRUITER RELATIONSHIP INTELLIGENCE ENGINE"}
          </span>
        </div>
        <h2 className="text-2xl font-black text-stone-950 tracking-tight uppercase">
          {isFR ? "Supervision de la Relation Client & Rétention" : "Relationship Intelligence Console"}
        </h2>
        <p className="text-xs text-stone-600 font-bold leading-relaxed max-w-2xl">
          {isFR
            ? "Télémétrie anonymisée globale mesurant l'efficacité de la mémoire relationnelle. Permet d'analyser comment l'apprenant s'approprie les conseils, maintient son assiduité et progresse sur le long terme de manière personnalisée."
            : "Aggregated, anonymized relationship telemetry tracking recruiter empathy and memory recall impact. Quantifies user retention, mentor continuity, career growth trajectory, and memory-driven performance."}
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Retention Rate */}
        <div className="bg-[#A7F3D0] border-2 border-stone-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-1">
          <span className="text-[10px] font-mono text-emerald-950 font-black uppercase tracking-wider block">{isFR ? "Rétention Apprenants" : "User Retention Rate"}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">{metrics.averageUserRetentionRate}%</span>
            <span className="text-xs font-black text-emerald-800">▲ +2.4%</span>
          </div>
          <p className="text-[10px] text-emerald-950 font-bold leading-tight pt-1">
            {isFR ? "Retour pour une 2ème+ évaluation." : "Returning users taking subsequent sessions."}
          </p>
        </div>

        {/* Memory Recall rate */}
        <div className="bg-[#EDC154] border-2 border-stone-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-1">
          <span className="text-[10px] font-mono text-yellow-950 font-black uppercase tracking-wider block">{isFR ? "Taux d'Évocation" : "Memory Recall Rate"}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">{metrics.memoryUtilizationRate}%</span>
            <span className="text-xs font-black text-amber-800">▲ {isFR ? "Actif" : "Optimal"}</span>
          </div>
          <p className="text-[10px] text-amber-950 font-bold leading-tight pt-1">
            {isFR ? "Rappels et adaptations réussis." : "Successful multi-layer context recalls."}
          </p>
        </div>

        {/* Return User Performance Boost */}
        <div className="bg-purple-100 border-2 border-stone-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-1">
          <span className="text-[10px] font-mono text-purple-950 font-black uppercase tracking-wider block">{isFR ? "Accélération Performance" : "Performance Boost"}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">+{metrics.returningUserPerformanceBoost}%</span>
            <span className="text-xs font-black text-purple-800">▲ {isFR ? "Assuré" : "Fast-Track"}</span>
          </div>
          <p className="text-[10px] text-purple-950 font-bold leading-tight pt-1">
            {isFR ? "Progression moyenne au 3ème tour." : "Avg score increase on returning users."}
          </p>
        </div>

        {/* Mentorship days average */}
        <div className="bg-blue-100 border-2 border-stone-950 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-1">
          <span className="text-[10px] font-mono text-blue-950 font-black uppercase tracking-wider block">{isFR ? "Relation de Mentorat" : "Mentoring Duration"}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-900">{metrics.mentorshipDurationDays} {isFR ? "Jours" : "Days"}</span>
            <span className="text-xs font-black text-blue-800">★ {isFR ? "Soutenu" : "Ongoing"}</span>
          </div>
          <p className="text-[10px] text-blue-950 font-bold leading-tight pt-1">
            {isFR ? "Durée moyenne de fidélisation." : "Avg continuous relation lifecycle duration."}
          </p>
        </div>

      </div>

      {/* Main Analysis Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Long term confidence evolution */}
        <div className="bg-white border-[2.5px] border-stone-950 p-6 rounded-[24px] shadow-[5px_5px_0px_0px_#111111] space-y-4 lg:col-span-2">
          <div>
            <h3 className="text-sm font-black text-stone-950 uppercase">{isFR ? "Évolution de l'Assurance Candidat" : "Long-Term Confidence Evolution"}</h3>
            <p className="text-[10px] text-stone-500 font-bold uppercase">{isFR ? "Suivi sur un parcours moyen de 7 sessions" : "Avg tracking across a 7-session candidate lifecycle"}</p>
          </div>

          <div className="flex items-end justify-between gap-2 pt-6 h-48 border-b-2 border-stone-950 px-2">
            {metrics.longTermConfidenceEvolution.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                <span className="text-[10px] font-mono font-black text-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity">
                  {val}%
                </span>
                <div 
                  className="w-full bg-emerald-400 group-hover:bg-emerald-500 border-2 border-stone-950 rounded-t-lg transition-all"
                  style={{ height: `${val * 1.5}px` }}
                />
                <span className="text-[9px] font-mono font-black text-stone-600 mt-1 uppercase">
                  S{idx + 1}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-stone-600 justify-center pt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-400 border border-stone-950 rounded" />
              <span>{isFR ? "Confiance & Pacing Élocution" : "Confidence & Eloquence Score"}</span>
            </div>
          </div>
        </div>

        {/* Operational Privacy Metrics */}
        <div className="bg-white border-[2.5px] border-stone-950 p-6 rounded-[24px] shadow-[5px_5px_0px_0px_#111111] space-y-4">
          <div>
            <h3 className="text-sm font-black text-stone-950 uppercase">{isFR ? "Conformité & RGPD Privacy" : "GDPR & Privacy Compliance"}</h3>
            <p className="text-[10px] text-stone-500 font-bold uppercase">{isFR ? "Comportement de stockage et opt-in" : "Storage consent tracking & data protection"}</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-stone-50 border-2 border-stone-950 rounded-xl space-y-1">
              <div className="flex justify-between items-center text-xs font-black text-stone-900">
                <span>{isFR ? "Rétention Globale Activée" : "Long-term Memory Opt-In"}</span>
                <span className="text-emerald-800">{metrics.relationshipEngagementIndex}%</span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden border border-stone-950/20">
                <div className="bg-emerald-500 h-full" style={{ width: `${metrics.relationshipEngagementIndex}%` }} />
              </div>
            </div>

            <div className="p-3 bg-stone-50 border-2 border-stone-950 rounded-xl space-y-1">
              <div className="flex justify-between items-center text-xs font-black text-stone-900">
                <span>{isFR ? "Demandes d'Export (JSON)" : "GDPR Exports Requested"}</span>
                <span className="text-stone-700">12,402 {isFR ? "fichiers" : "files"}</span>
              </div>
            </div>

            <div className="p-3 bg-stone-50 border-2 border-stone-950 rounded-xl space-y-1">
              <div className="flex justify-between items-center text-xs font-black text-stone-900">
                <span>{isFR ? "Purges et Suppressions de Compte" : "Direct GDPR Account Purges"}</span>
                <span className="text-red-700">0.02%</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border-2 border-dashed border-emerald-950/20 p-3 rounded-xl">
            <p className="text-[9px] text-stone-700 font-bold leading-relaxed">
              {isFR
                ? "✓ Tous les souvenirs d'évaluation et données de session à long terme respectent intégralement les normes de sécurité de l'Union Européenne en matière de portabilité des données."
                : "✓ EU Data Portability & GDPR compliance certified. User memories can be viewed, corrected, purged, or exported on demand."}
            </p>
          </div>
        </div>

      </div>

      {/* Interview Psychology telemetry block (HIU Phase 8) */}
      <div className="bg-white border-[2.5px] border-stone-950 p-6 rounded-[24px] shadow-[6px_6px_0px_0px_#111111] space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-100 border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
          <Brain className="w-4 h-4 text-indigo-850 animate-pulse" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-950 font-black">
            {isFR ? "MOTEUR DE PSYCHOLOGIE ET COGNITION" : "INTERVIEW PSYCHOLOGY & COGNITIVE TELEMETRY"}
          </span>
        </div>
        
        <div>
          <h3 className="text-lg font-black text-stone-950 tracking-tight uppercase">
            {isFR ? "Analytique Comportementale Globale & Signaux" : "Aggregate Behavioral Signals & Stress Response Tracks"}
          </h3>
          <p className="text-xs text-stone-600 font-bold leading-relaxed max-w-3xl mt-1">
            {isFR
              ? "Statistiques consolidées mesurant la sincérité, la cohérence STAR, l'équilibre de l'appropriation (Je vs Nous), et la courbe de régulation du stress candidat sur l'intégralité du cycle d'entraînement."
              : "Consolidated statistics measuring storytelling sincerity, STAR narrative compliance, team vs individual ownership rates, and candidate stress regulation curves across all platform sessions."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Sincerity & Sincerity metrics */}
          <div className="p-4 bg-stone-50 border-2 border-stone-950 rounded-2xl space-y-4 text-left">
            <span className="text-xs font-black text-stone-900 uppercase block border-b pb-1.5">
              {isFR ? "🔬 Validations de Sincérité" : "🔬 Story Sincerity & Authenticity"}
            </span>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-stone-700">
                  <span>{isFR ? "Sincérité Narrations (Vécu Réel)" : "Narrative Sincerity (Real Experiences)"}</span>
                  <span className="font-mono font-black">88.5%</span>
                </div>
                <div className="w-full bg-stone-200 h-2 border border-stone-950/25 rounded-full mt-1 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '88.5%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold text-stone-700">
                  <span>{isFR ? "Absence de Jargon Corporatiste" : "Corporate Cliché-Free Level"}</span>
                  <span className="font-mono font-black">81.2%</span>
                </div>
                <div className="w-full bg-stone-200 h-2 border border-stone-950/25 rounded-full mt-1 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '81.2%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold text-stone-700">
                  <span>{isFR ? "Rigueur Méthodologie STAR" : "STAR Structure Alignment"}</span>
                  <span className="font-mono font-black">84.1%</span>
                </div>
                <div className="w-full bg-stone-200 h-2 border border-stone-950/25 rounded-full mt-1 overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: '84.1%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Stress adaptation progress chart */}
          <div className="p-4 bg-stone-50 border-2 border-stone-950 rounded-2xl space-y-2 text-left">
            <span className="text-xs font-black text-stone-900 uppercase block border-b pb-1.5">
              {isFR ? "🧘 Courbe de Maîtrise du Stress (7 Sessions)" : "🧘 Stress Regulation Curve (7 Sessions)"}
            </span>
            <div className="flex items-end justify-between gap-1 pt-4 h-24 border-b border-stone-300 px-1">
              {[52, 58, 65, 73, 81, 88, 92].map((val, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group">
                  <div 
                    className="w-full bg-indigo-400 group-hover:bg-indigo-500 border border-stone-950 rounded-t" 
                    style={{ height: `${val * 0.8}px` }}
                  />
                  <span className="text-[8px] font-mono font-black text-stone-600 mt-1">S{i+1}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-stone-500 font-bold text-center pt-1.5 leading-snug">
              {isFR ? "Hausse moyenne de +40% de stabilité sous pression" : "Average +40% increase in stability under stress"}
            </div>
          </div>

          {/* Decision & leadership Archetypes */}
          <div className="p-4 bg-stone-50 border-2 border-stone-950 rounded-2xl space-y-3.5 text-left">
            <span className="text-xs font-black text-stone-900 uppercase block border-b pb-1.5">
              {isFR ? "⚖️ Répartition des Styles Décisionnels" : "⚖️ Strategic Decision-Making Styles"}
            </span>
            <div className="space-y-2 text-[11px] font-bold text-stone-700">
              <div className="flex justify-between items-center">
                <span>{isFR ? "Analytique (Décisions basées données)" : "Analytical (Data-driven)"}</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-850 rounded text-[9px] font-black">42.1%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{isFR ? "Collaboratif (Consensus équipe)" : "Collaborative (Consensus seeker)"}</span>
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-850 rounded text-[9px] font-black">28.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{isFR ? "Pragmatique (Centré résultats)" : "Pragmatic (Results-centric)"}</span>
                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-950 rounded text-[9px] font-black">18.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{isFR ? "Intuitif (Jugement expert)" : "Intuitive (Instinct & judgement)"}</span>
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-850 rounded text-[9px] font-black">11.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
