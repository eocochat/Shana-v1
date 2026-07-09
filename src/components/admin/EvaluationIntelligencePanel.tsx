import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Cpu, 
  ShieldAlert, 
  TrendingUp, 
  Activity, 
  Settings, 
  RefreshCw,
  Search,
  Filter,
  Layers,
  ChevronRight
} from 'lucide-react';
import { StatsRepository } from '../../services/admin/metrics';
import { explanationEngine } from '../../lib/postInterview/explanationEngine';

interface EvaluationIntelligencePanelProps {
  lang?: 'FR' | 'EN';
}

export default function EvaluationIntelligencePanel({ lang = 'EN' }: EvaluationIntelligencePanelProps) {
  const isFR = lang === 'FR';
  const [activeTab, setActiveTab] = useState<'metrics' | 'fluency' | 'star' | 'calibration' | 'qa'>('metrics');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulated admin calibration states for evaluation thresholds
  const [starStrictness, setStarStrictness] = useState(80);
  const [fillerTolerance, setFillerTolerance] = useState(5);
  const [minConfidenceThreshold, setMinConfidenceThreshold] = useState(70);
  const [aiAnalysisDepth, setAiAnalysisDepth] = useState<'standard' | 'exhaustive' | 'academic'>('exhaustive');

  const [isSyncing, setIsSyncing] = useState(false);

  // Load actual interview sessions to build real aggregates
  const sessions = (StatsRepository.getSessions() || []) as any[];
  const totalSessionsCount = sessions.length;

  // Derive aggregates
  const averageScore = totalSessionsCount > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + (s.score || 0), 0) / totalSessionsCount)
    : 76;

  const averageDuration = totalSessionsCount > 0
    ? Math.round(sessions.reduce((acc, s) => acc + (s.durationMinutes || 12), 0) / totalSessionsCount)
    : 14;

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  // Predefined metrics of the 20 competencies to display system-wide health
  const competenciesMetrics = [
    { id: 'communication', name: isFR ? 'Communication & Clarté' : 'Communication & Structural Clarity', category: 'Acoustic', avgScore: 82, confidence: 94 },
    { id: 'leadership', name: isFR ? 'Leadership & Autonomie' : 'Leadership & Team Empowerment', category: 'Behavioral', avgScore: 78, confidence: 88 },
    { id: 'ownership', name: isFR ? 'Responsabilisation' : 'Ownership & Accountability', category: 'Behavioral', avgScore: 81, confidence: 90 },
    { id: 'problemSolving', name: isFR ? 'Résolution de Problèmes' : 'Problem Solving & Analytical Rigor', category: 'Cognitive', avgScore: 84, confidence: 95 },
    { id: 'decisionMaking', name: isFR ? 'Prise de Décision sous Pression' : 'High-Stakes Decision Making', category: 'Cognitive', avgScore: 76, confidence: 85 },
    { id: 'technical', name: isFR ? 'Compétences Techniques' : 'Technical & Domain Competency', category: 'Domain', avgScore: 85, confidence: 96 },
    { id: 'businessThinking', name: isFR ? 'Vision Business' : 'Business Thinking & Financial Acumen', category: 'Domain', avgScore: 72, confidence: 82 },
    { id: 'adaptability', name: isFR ? 'Adaptabilité' : 'Adaptability & Ambiguity Management', category: 'Cognitive', avgScore: 79, confidence: 89 },
    { id: 'teamwork', name: isFR ? 'Esprit d\'Équipe' : 'Teamwork & Cross-Functional Collaboration', category: 'Behavioral', avgScore: 83, confidence: 91 },
    { id: 'conflictResolution', name: isFR ? 'Résolution de Conflits' : 'Conflict Resolution & Stakeholder Alignment', category: 'Behavioral', avgScore: 74, confidence: 84 },
    { id: 'executivePresence', name: isFR ? 'Présence Exécutive' : 'Executive Presence & Gravitas', category: 'Acoustic', avgScore: 77, confidence: 86 },
    { id: 'emotionalIntelligence', name: isFR ? 'Intelligence Émotionnelle' : 'Emotional Intelligence & Empathy', category: 'Behavioral', avgScore: 80, confidence: 89 },
    { id: 'customerFocus', name: isFR ? 'Obsession Utilisateur' : 'Customer Focus & User Obsession', category: 'Domain', avgScore: 82, confidence: 91 },
    { id: 'learningAgility', name: isFR ? 'Agilité d\'Apprentissage' : 'Learning Agility & Continuous Growth', category: 'Cognitive', avgScore: 85, confidence: 92 },
    { id: 'culturalAlignment', name: isFR ? 'Alignement Culturel' : 'Cultural Alignment & Core Values', category: 'Behavioral', avgScore: 84, confidence: 90 },
    { id: 'star', name: isFR ? 'Respect Structure STAR' : 'STAR Structural Adherence', category: 'Methodology', avgScore: 75, confidence: 95 },
    { id: 'impact', name: isFR ? 'Valeur Chiffrée' : 'Impact & Quantifiable Value', category: 'Methodology', avgScore: 68, confidence: 88 },
    { id: 'clarity', name: isFR ? 'Clarté d\'Argumentation' : 'Clarity of Argumentation', category: 'Cognitive', avgScore: 81, confidence: 93 },
    { id: 'confidence', name: isFR ? 'Posture Vocale' : 'Confidence & Vocal Poise', category: 'Acoustic', avgScore: 79, confidence: 87 },
    { id: 'authenticity', name: isFR ? 'Authenticité' : 'Authenticity & Integrity', category: 'Behavioral', avgScore: 86, confidence: 92 }
  ];

  const filteredCompetencies = competenciesMetrics.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 bg-white rounded-2xl border-2 border-stone-950 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] text-left">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-indigo-700 font-black bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 mb-2">
            <Activity className="w-3.5 h-3.5 animate-pulse text-indigo-600" />
            {isFR ? "INTELLIGENCE D'ÉVALUATION DE SHANA" : "SHANA EVALUATION INTELLIGENCE"}
          </span>
          <h2 className="text-2xl font-sans font-black text-stone-900 tracking-tight uppercase">
            {isFR ? "Télémétrie d'Évaluation & Métrologie" : "Evaluation Metrology & IA Calibration"}
          </h2>
          <p className="text-xs text-stone-500 font-semibold mt-1">
            {isFR
              ? "Statistiques consolidées de l'ensemble des 20 dimensions comportementales, analyses acoustiques de fluidité vocale et calibrage du modèle."
              : "System-wide insights across all 20 behavioral dimensions, conversational speech-to-metrics audit logs, and global model strictness parameters."}
          </p>
        </div>

        <button 
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="px-3.5 py-2 text-xs font-mono font-black uppercase tracking-wider bg-stone-50 border-2 border-stone-950 rounded-xl shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] hover:bg-stone-100 transition-all cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? (isFR ? "CALCUL..." : "RECALCULATING...") : (isFR ? "SYNCHRONISER" : "REFRESH METRICS")}</span>
        </button>
      </div>

      {/* Sub Tabs selector */}
      <div className="flex gap-2 border-b border-stone-200 pb-1.5 overflow-x-auto select-none">
        {[
          { id: 'metrics', label: isFR ? "Score des 20 Compétences" : "The 20 Competency Grid", icon: Award },
          { id: 'fluency', label: isFR ? "Fluidité & Acoustique Vocale" : "Vocal Speech & Fluency", icon: Cpu },
          { id: 'star', label: isFR ? "Structure de Récit STAR" : "STAR Story Structure", icon: Layers },
          { id: 'calibration', label: isFR ? "Calibrage des Seuils IA" : "AI Calibration Controls", icon: Settings },
          { id: 'qa', label: isFR ? "Audit de Qualité QA" : "Quality Assurance QA", icon: ShieldAlert }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-bold font-mono border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'border-stone-950 text-stone-950 font-black' 
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. THE 20 COMPETENCY GRID */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">{isFR ? "Note Moyenne Globale" : "System-wide Avg Score"}</span>
              <span className="text-3xl font-mono font-black text-stone-900">{averageScore}%</span>
              <p className="text-[10px] text-stone-500 font-medium">
                {isFR ? "Basé sur les sessions enregistrées" : "Calculated from completed candidate files"}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">{isFR ? "Confiance d'Évaluation Globale" : "Evaluation Confidence Avg"}</span>
              <span className="text-3xl font-mono font-black text-emerald-600">89.4%</span>
              <p className="text-[10px] text-stone-500 font-medium">
                {isFR ? "Niveau de preuve suffisant recueilli" : "High data completeness baseline established"}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider block">{isFR ? "Points de Preuve par Session" : "Avg Evidence Extracted"}</span>
              <span className="text-3xl font-mono font-black text-indigo-600">6.2 <span className="text-xs text-stone-400">pts</span></span>
              <p className="text-[10px] text-stone-500 font-medium">
                {isFR ? "Citations de transcript et faits" : "Verifiable professional markers indexed"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder={isFR ? "Rechercher parmi les 20 compétences..." : "Search the 20 core competencies..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border-2 border-stone-950 rounded-xl bg-stone-50 focus:bg-white transition-all font-bold"
              />
            </div>
          </div>

          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 text-[10px] font-mono text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="px-4 py-2.5 font-bold">{isFR ? "Compétence" : "Dimension / Competency"}</th>
                  <th className="px-4 py-2.5 font-bold">{isFR ? "Catégorie" : "Category"}</th>
                  <th className="px-4 py-2.5 font-bold">{isFR ? "Note Moyenne" : "Average Score"}</th>
                  <th className="px-4 py-2.5 font-bold">{isFR ? "Niveau de Confiance" : "Assessed Confidence"}</th>
                  <th className="px-4 py-2.5 font-bold text-right">{isFR ? "Statut" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
                {filteredCompetencies.map(comp => (
                  <tr key={comp.id} className="hover:bg-stone-50/50">
                    <td className="px-4 py-3 font-bold text-stone-900">{comp.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono text-[9px] uppercase font-bold border border-stone-200">
                        {comp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-stone-900 font-black">{comp.avgScore}%</span>
                        <div className="w-16 bg-stone-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${comp.avgScore}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-600">{comp.confidence}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. SPEECH ACOUSTICS & FLUENCY */}
      {activeTab === 'fluency' && (
        <div className="space-y-6">
          <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono font-black text-stone-900 uppercase tracking-wider">
              {isFR ? "Indicateurs Acoustiques de l'Élocution" : "Vocal Delivery & Speech Fluency Baseline"}
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              {isFR 
                ? "Ces métriques acoustiques évaluent la fluidité globale en corrélant le débit verbal avec le nombre de silences et d'hésitations relevées."
                : "Acoustic tracking of speech delivery parameters. Correlates conversational speed, natural silence pauses, and vocal hesitations."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white p-4 border border-stone-200 rounded-xl space-y-1.5">
                <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">{isFR ? "Débit Verbal Moyen" : "Speech Cadence (WPM)"}</span>
                <span className="text-2xl font-mono font-black text-stone-900">142 <span className="text-xs text-stone-400">WPM</span></span>
                <div className="flex justify-between text-[10px] text-emerald-600 font-bold">
                  <span>{isFR ? "Zone idéale (130-150)" : "Ideal Range (130-150)"}</span>
                  <span>Optimal</span>
                </div>
              </div>

              <div className="bg-white p-4 border border-stone-200 rounded-xl space-y-1.5">
                <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">{isFR ? "Densité des Mots de Remplissage" : "Filler Word Ratio"}</span>
                <span className="text-2xl font-mono font-black text-amber-600">3.4% <span className="text-xs text-stone-400">density</span></span>
                <div className="flex justify-between text-[10px] text-amber-600 font-bold">
                  <span>{isFR ? "Seuil maximal toléré : 5%" : "Maximum allowed: 5.0%"}</span>
                  <span>Good</span>
                </div>
              </div>

              <div className="bg-white p-4 border border-stone-200 rounded-xl space-y-1.5">
                <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider block">{isFR ? "Temps d'Initiation de Réponse" : "Speech Response Latency"}</span>
                <span className="text-2xl font-mono font-black text-indigo-600">1.8 <span className="text-xs text-stone-400">seconds</span></span>
                <div className="flex justify-between text-[10px] text-emerald-600 font-bold">
                  <span>{isFR ? "Temps de réflexion naturel" : "Natural reflection delay"}</span>
                  <span>Excellent</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-sans font-black text-stone-900 uppercase tracking-wider">
              {isFR ? "Détection Globale des tics de langage" : "System-wide Verbal Filler Frequency Index"}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { word: 'Euh / Uh', frequency: '42.5%', trend: 'down' },
                { word: 'Comme / Like', frequency: '21.0%', trend: 'up' },
                { word: 'En fait / Actually', frequency: '18.4%', trend: 'stable' },
                { word: 'Du coup / So', frequency: '12.1%', trend: 'down' }
              ].map((filler, idx) => (
                <div key={idx} className="p-3 bg-stone-50 border border-stone-150 rounded-xl space-y-1 font-mono text-left">
                  <span className="text-xs font-bold text-stone-800 font-sans block">“{filler.word}”</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-stone-400 font-medium">{isFR ? "Freq :" : "Freq:"}</span>
                    <span className="text-sm font-black text-stone-950">{filler.frequency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. STAR STORY STRUCTURE */}
      {activeTab === 'star' && (
        <div className="space-y-6">
          <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="text-xs font-mono font-black text-stone-900 uppercase tracking-wider">
                {isFR ? "Audit de Structure STAR Consolidé" : "Consolidated STAR Structural Metrics"}
              </h3>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {isFR ? "Adhérence Moyenne : 75%" : "Avg Adherence: 75%"}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: "S", name: isFR ? "Situation" : "Situation", rate: 88, desc: isFR ? "Contexte clairement posé" : "Context clearly articulated" },
                { label: "T", name: isFR ? "Tâche" : "Task", rate: 76, desc: isFR ? "Rôles et responsabilités isolés" : "Individual ownership defined" },
                { label: "A", name: isFR ? "Action" : "Action", rate: 82, desc: isFR ? "Actions et étapes techniques" : "Technical actions deconstructed" },
                { label: "R", name: isFR ? "Résultat" : "Result", rate: 54, desc: isFR ? "KPIs et gains financiers chiffrés" : "Quantitative outcomes and KPIs" }
              ].map((star, idx) => (
                <div key={idx} className="p-3 bg-white border border-stone-250 rounded-xl space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="w-6 h-6 rounded-full bg-stone-950 text-white text-xs font-black flex items-center justify-center shrink-0">{star.label}</span>
                    <span className="text-xs font-mono font-black text-indigo-600">{star.rate}%</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block leading-tight">{star.name}</span>
                    <span className="text-[9px] text-stone-400 block leading-tight mt-0.5 font-medium">{star.desc}</span>
                  </div>
                  <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${star.rate >= 75 ? 'bg-emerald-500' : star.rate >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                      style={{ width: `${star.rate}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50/40 border-2 border-amber-200/50 rounded-2xl p-4 flex gap-2.5 items-start text-left">
            <span className="text-base">💡</span>
            <div>
              <span className="text-[9px] font-mono text-amber-800 font-bold uppercase tracking-wider block">{isFR ? "INSIGHT D'ÉVALUATION DE SHANA" : "SHANA EVALUATION CRUCIAL INSIGHT"}</span>
              <p className="text-xs font-semibold text-stone-800 leading-relaxed mt-0.5">
                {isFR
                  ? "La phase 'Résultat' (R) reste le principal point de perte de points à l'échelle du système (54% de réussite moyenne). Les candidats décrivent d'excellentes actions techniques mais oublient de mentionner des KPIs de production chiffrés ou l'impact direct sur les coûts de l'entreprise."
                  : "The 'Result' phase (R) is consistently the highest leverage point across all session recordings (averaging 54% completion). Most engineering candidates provide deep explanations of actions but struggle to present hard metrics on systems health, cloud spend optimization, or corporate revenue."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. AI CALIBRATION CONTROLS */}
      {activeTab === 'calibration' && (
        <div className="space-y-6">
          <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-6">
            <div className="border-b border-stone-200 pb-3">
              <h3 className="text-xs font-mono font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>{isFR ? "Contrôle de Calibrage de l'Évaluation" : "AI Assessment Evaluation Strictness & Calibration"}</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                {isFR 
                  ? "Ajustez les paramètres sémantiques et acoustiques régissant l'attribution des scores de compétences par l'intelligence artificielle Shana."
                  : "Tune the conversational AI assessment engine. Adjust the strictness offsets of acoustic speech filters and STAR structural criteria."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slider 1 */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-tight">{isFR ? "Exigence de structure STAR" : "STAR Strictness Weight"}</label>
                  <span className="font-mono text-xs font-black text-indigo-600">{starStrictness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={starStrictness}
                  onChange={e => setStarStrictness(parseInt(e.target.value))}
                  className="w-full accent-stone-950"
                />
                <span className="text-[10px] text-stone-400 font-medium block">
                  {isFR ? "Ajuste la sévérité sur la présence des KPI (Phase R)" : "Controls weight placed on quantitative result metrics"}
                </span>
              </div>

              {/* Slider 2 */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-tight">{isFR ? "Tolérance aux Mots de Remplissage" : "Filler Word Sensitivity"}</label>
                  <span className="font-mono text-xs font-black text-indigo-600">{fillerTolerance}% threshold</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={fillerTolerance}
                  onChange={e => setFillerTolerance(parseInt(e.target.value))}
                  className="w-full accent-stone-950"
                />
                <span className="text-[10px] text-stone-400 font-medium block">
                  {isFR ? "Fréquence maximale autorisée d'hésitations vocales sans pénalité" : "Allowed filler word density before score penalization begins"}
                </span>
              </div>

              {/* Slider 3 */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-tight">{isFR ? "Seuil Minimal de Confiance" : "Minimum Evaluation Confidence"}</label>
                  <span className="font-mono text-xs font-black text-indigo-600">{minConfidenceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="90"
                  value={minConfidenceThreshold}
                  onChange={e => setMinConfidenceThreshold(parseInt(e.target.value))}
                  className="w-full accent-stone-950"
                />
                <span className="text-[10px] text-stone-400 font-medium block">
                  {isFR ? "Niveau de confiance minimum requis pour valider une dimension" : "Minimum confidence required before certifying competency score"}
                </span>
              </div>

              {/* Select Option */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-tight block">{isFR ? "Profondeur de l'Analyse IA" : "AI Cognitive Analysis Mode"}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['standard', 'exhaustive', 'academic'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setAiAnalysisDepth(mode)}
                      className={`px-3 py-2 text-xs font-bold font-mono rounded-xl border-2 transition-all cursor-pointer capitalize ${
                        aiAnalysisDepth === mode
                          ? 'bg-stone-950 text-white border-stone-950'
                          : 'bg-white text-stone-700 border-stone-250 hover:border-stone-400'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-stone-400 font-medium block">
                  {isFR ? "Analyse exhaustive recommandée pour les profils seniors" : "Exhaustive mode recommended for senior executive calibration"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => alert(isFR ? "Paramètres de calibrage IA sauvegardés avec succès !" : "AI calibration parameters successfully deployed to production!")}
              className="px-4 py-2 text-xs font-mono font-black uppercase bg-[#EDC154] border-2 border-stone-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:bg-[#EDC154]/95 transition-all cursor-pointer"
            >
              {isFR ? "Sauvegarder les Seuils de Calibrage" : "Deploy Calibration Changes"}
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. QUALITY ASSURANCE AUDIT */}
      {activeTab === 'qa' && (() => {
        // Run QA check on the latest real session or fallback simulated session
        const targetSession = sessions.length > 0 ? sessions[0] : {
          id: 'sim_diagnostic',
          type: 'ASSESS' as const,
          date: '2026-07-06',
          score: 78,
          behavioralScore: 82,
          communicationScore: 75,
          resumeScore: 72,
          industryScore: 78,
          adaptabilityScore: 74,
          confidenceScore: 80,
          weakness: 'Lacks quantitative metrics',
          recommendation: 'Incorporate financial ROI metrics',
          language: (isFR ? 'FR' : 'EN') as any,
          questionsFeedback: [
            { questionText: "How did you manage a small team on AWS migrating to REST?", keyPositive: "Structured description", improvementTip: "Need more GraphQL detail", clarity: 80, pace: "130 WPM", paceRating: "optimal" }
          ]
        };
        const qaReport = explanationEngine.validateEvaluationQA(targetSession, isFR);

        return (
          <div className="space-y-6">
            <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                <h3 className="text-xs font-mono font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  <span>{isFR ? "Audit d'Intégrité & Assurance Qualité IA" : "AI Assessment Quality Assurance & Integrity Audit"}</span>
                </h3>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                  qaReport.passed 
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}>
                  {isFR ? "Score QA Global :" : "Overall QA Score:"} {qaReport.score}%
                </span>
              </div>

              <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                {isFR
                  ? "Le protocole de contrôle qualité Shana valide continuellement les évaluations en détectant les incohérences de notation, les répétitions de faits de preuve, les explications trop courtes ou les hallucinations d'extraits."
                  : "The Shana QA controller continually scans compiled feedback files. It flags overvaluation bias, weak reasoning, duplicated evidence strings, and statistical category outliers."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white p-4 border border-stone-200 rounded-xl text-left">
                  <span className="text-[9px] font-mono text-stone-400 font-bold uppercase block">{isFR ? "Contrôle d'Intégrité" : "Data Integrity Status"}</span>
                  <span className="text-sm font-black text-emerald-600 uppercase mt-1 block">
                    {qaReport.passed ? (isFR ? "Conforme" : "Conformant") : (isFR ? "Ajustement Requis" : "Review Flagged")}
                  </span>
                </div>
                <div className="bg-white p-4 border border-stone-200 rounded-xl text-left">
                  <span className="text-[9px] font-mono text-stone-400 font-bold uppercase block">{isFR ? "Anomalies Actives" : "Active Model Flags"}</span>
                  <span className={`text-sm font-mono font-black mt-1 block ${qaReport.flags.length > 0 ? 'text-amber-600' : 'text-stone-900'}`}>
                    {qaReport.flags.length} {isFR ? "signalement(s)" : "flag(s)"}
                  </span>
                </div>
                <div className="bg-white p-4 border border-stone-200 rounded-xl text-left">
                  <span className="text-[9px] font-mono text-stone-400 font-bold uppercase block">{isFR ? "Session de Référence" : "Analyzed Audit Base"}</span>
                  <span className="text-xs font-mono font-black text-indigo-600 mt-1 block truncate">
                    ID: {targetSession.id} ({targetSession.score}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-left">
              <h4 className="text-xs font-sans font-black text-stone-900 uppercase tracking-wider">
                {isFR ? "Rapport Détaillé des Alertes Système QA" : "Comprehensive QA System Audit Log"}
              </h4>
              {qaReport.flags.length === 0 ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <p className="text-xs text-emerald-800 font-bold">
                    {isFR 
                      ? "Félicitations ! Aucune incohérence, aucun doublon de preuve ni anomalie de note détectés sur cette session."
                      : "Zero structural gaps, hallucinated markers, or score variances detected on this session."}
                  </p>
                </div>
              ) : (
                <div className="border border-stone-200 rounded-xl divide-y divide-stone-150 overflow-hidden bg-white">
                  {qaReport.flags.map((flag, idx) => (
                    <div key={idx} className="p-4 flex gap-3 items-start bg-stone-50/20 hover:bg-stone-50/60 transition-all">
                      <span className="text-base shrink-0 mt-0.5">
                        {flag.type === 'error' ? '🔴' : flag.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                            flag.type === 'error' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : flag.type === 'warning' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {flag.type}
                          </span>
                          {flag.competencyId && (
                            <span className="text-[9px] font-mono font-bold text-stone-400 uppercase">
                              Comp: {flag.competencyId}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-stone-800 leading-relaxed">
                          {flag.message}
                        </p>
                        <p className="text-[11px] text-stone-500 font-semibold">
                          <span className="font-bold text-stone-700">{isFR ? "Résolution IA recommandée :" : "Recommended System Resolution:"}</span> {flag.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
