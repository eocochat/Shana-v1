import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  GitBranch, 
  Search, 
  CheckCircle, 
  Activity, 
  Database, 
  TrendingUp, 
  Users, 
  Cpu, 
  BookOpen, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { KnowledgeGraph } from '../../lib/knowledge/knowledgeGraph';
import { GraphNode } from '../../lib/knowledge/graphTypes';

interface KnowledgeIntelligencePanelProps {
  lang?: 'FR' | 'EN';
}

export default function KnowledgeIntelligencePanel({ lang = 'EN' }: KnowledgeIntelligencePanelProps) {
  const [analytics, setAnalytics] = useState(KnowledgeGraph.getAnalytics());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [exploredData, setExploredData] = useState<any>(null);

  // Load and refresh stats
  const refreshStats = () => {
    setAnalytics(KnowledgeGraph.getAnalytics());
  };

  // Perform search
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = KnowledgeGraph.search(searchQuery, 6);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Explore selected node
  useEffect(() => {
    if (selectedNodeId) {
      const detail = KnowledgeGraph.Explorer.exploreNode(selectedNodeId);
      setExploredData(detail);
    } else {
      setExploredData(null);
    }
  }, [selectedNodeId]);

  // Default explorer to Leadership competency on mount
  useEffect(() => {
    setSelectedNodeId('comp_leadership');
  }, []);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* Header section */}
      <div className="border-b border-stone-200 pb-5">
        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#1e40af] font-bold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-150 mb-2">
          <Globe className="w-3 h-3 text-[#1e40af]" />
          {lang === 'FR' ? "MOTEUR DE GRAPHE DE CONNAISSANCES SHANA" : "SHANA KNOWLEDGE GRAPH CORE ENGINE"}
        </span>
        <h2 className="text-2xl font-sans font-black text-stone-900 tracking-tight">
          {lang === 'FR' ? "Intelligence Core & Génome d'Entretien" : "Knowledge Intelligence & Interview Genome"}
        </h2>
        <p className="text-xs text-[#6B7280] font-medium leading-normal">
          {lang === 'FR'
            ? "Pilotez le graphe sémantique de SHANA. Suivez l'évolution du génome d'entretien global, les liens inter-compétences et les stratégies pédagogiques les plus performantes, tout en garantissant un anonymat absolu."
            : "Supervise SHANA's cognitive database and interview patterns. Watch competency networks, coaching paths, and semantic hophs evolve dynamically from aggregated, privacy-safe telemetry."}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Graph size */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">
              {lang === 'FR' ? "TAILLE DU GRAPHE" : "GRAPH VOLUME"}
            </span>
            <div className="p-2 bg-stone-150 rounded-xl text-stone-800">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2.5xl font-sans font-black text-stone-900">{analytics.nodeCount}</h3>
              <span className="text-[10px] font-mono text-stone-400 font-bold">{lang === 'FR' ? "Noeuds" : "Nodes"}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-stone-500 font-bold">
              <span>{analytics.edgeCount} {lang === 'FR' ? "relations" : "edges"}</span>
            </div>
          </div>
        </div>

        {/* Genome Growth */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">
              {lang === 'FR' ? "CROISSANCE GÉNOME" : "GENOME UPDATES"}
            </span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2.5xl font-sans font-black text-stone-900">100%</h3>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">+{lang === 'FR' ? "Automatique" : "Auto"}</span>
            </div>
            <p className="text-stone-400 text-[10px] font-semibold">
              {lang === 'FR' ? "Chaque entretien enrichit le graphe" : "Updated asynchronously post-session"}
            </p>
          </div>
        </div>

        {/* Health */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">
              {lang === 'FR' ? "SANTÉ DU GRAPHE" : "GRAPH HEALTH"}
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2.5xl font-sans font-black text-emerald-600">100%</h3>
            </div>
            <p className="text-stone-400 text-[10px] font-semibold">
              {lang === 'FR' ? "Cohérence sémantique vérifiée" : "Self-healing & connection balanced"}
            </p>
          </div>
        </div>

        {/* Version */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">
              {lang === 'FR' ? "VERSION DU GRAPHE" : "GRAPH ENGINE VERSION"}
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2.5xl font-mono font-black text-stone-900">v{analytics.graphVersion}</h3>
            </div>
            <p className="text-stone-400 text-[10px] font-semibold">
              {lang === 'FR' ? "Dernier patch enregistré" : "State tracking active"}
            </p>
          </div>
        </div>

      </div>

      {/* Advanced Insights Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Competency Insights (Most assessed & toughest) */}
        <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6">
          <div className="space-y-0.5">
            <h3 className="font-sans font-black text-base text-stone-900">
              {lang === 'FR' ? "Couverture des Compétences" : "Cognitive Competency Gaps"}
            </h3>
            <p className="text-[#6B7280] text-xs font-semibold leading-normal">
              {lang === 'FR' ? "Compétences les plus évaluées et difficultés" : "Most scrutinized skills vs. biggest learning gaps"}
            </p>
          </div>

          {/* Most Assessed */}
          <div className="space-y-3">
            <span className="font-mono text-[9.5px] font-black uppercase text-stone-400 block tracking-wider">
              🏆 {lang === 'FR' ? "LES PLUS SÉLECTIONNÉES" : "MOST SCRUTINIZED DIMENSIONS"}
            </span>
            <div className="space-y-2">
              {analytics.mostAssessedCompetencies.map((comp, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-stone-50 pb-1.5">
                  <span className="font-bold text-stone-800">{comp.competency}</span>
                  <span className="font-mono font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded text-[10px]">{comp.count} times</span>
                </div>
              ))}
            </div>
          </div>

          {/* Toughest */}
          <div className="space-y-3">
            <span className="font-mono text-[9.5px] font-black uppercase text-stone-400 block tracking-wider">
              🔥 {lang === 'FR' ? "AXES LES PLUS DIFFICILES" : "COMMON LEARNER WEAKNESSES"}
            </span>
            <div className="space-y-3">
              {analytics.toughestCompetencies.map((comp, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-stone-700">
                    <span>{comp.competency}</span>
                    <span className="font-mono text-rose-600">{comp.avgScore}% avg readiness</span>
                  </div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${comp.avgScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Column 2: Industry & Company Distribution */}
        <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6">
          <div className="space-y-0.5">
            <h3 className="font-sans font-black text-base text-stone-900">
              {lang === 'FR' ? "Cartographie des Domaines" : "Market & Corporate Intelligence"}
            </h3>
            <p className="text-[#6B7280] text-xs font-semibold leading-normal">
              {lang === 'FR' ? "Secteurs d'activité et entreprises cibles" : "Industry allocations and benchmarked corporate structures"}
            </p>
          </div>

          {/* Industry trend */}
          <div className="space-y-3">
            <span className="font-mono text-[9.5px] font-black uppercase text-stone-400 block tracking-wider">
              🌐 {lang === 'FR' ? "INDUSTRIES REPRÉSENTÉES" : "INDUSTRY VOLUME TRENDS"}
            </span>
            <div className="space-y-3">
              {analytics.industryTrendCounts.slice(0, 4).map((ind, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-stone-700">
                    <span>{ind.industry}</span>
                    <span className="font-mono text-stone-500">{ind.count} sessions</span>
                  </div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(ind.count / 80) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company insights */}
          <div className="space-y-3">
            <span className="font-mono text-[9.5px] font-black uppercase text-stone-400 block tracking-wider">
              🏢 {lang === 'FR' ? "CIBLES DE RECRUTEMENT" : "TARGETED COMPANIES"}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {analytics.companyDistribution.slice(0, 4).map((co, idx) => (
                <div key={idx} className="bg-stone-50 border border-stone-150 p-2.5 rounded-xl text-center">
                  <span className="text-xs font-bold text-stone-800 block truncate">{co.company}</span>
                  <span className="font-mono text-[10px] text-stone-400 font-extrabold">{co.count} candidates</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Column 3: Coaching Strategies & RAG Outcomes */}
        <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6">
          <div className="space-y-0.5">
            <h3 className="font-sans font-black text-base text-stone-900">
              {lang === 'FR' ? "Impact des Accompagnements" : "Coaching Loop Effectiveness"}
            </h3>
            <p className="text-[#6B7280] text-xs font-semibold leading-normal">
              {lang === 'FR' ? "Parcours d'apprentissage les plus efficaces" : "Performance deltas from interactive coaching interventions"}
            </p>
          </div>

          <div className="space-y-4">
            <span className="font-mono text-[9.5px] font-black uppercase text-stone-400 block tracking-wider">
              🚀 {lang === 'FR' ? "AMÉLIORATION MOYENNE PAR MÉTHODE" : "SUCCESSFUL COACHING METHODS"}
            </span>
            
            <div className="space-y-3">
              {analytics.coachingSuccessRates.map((method, idx) => (
                <div key={idx} className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-150">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-stone-850 truncate max-w-[170px]">{method.strategy}</span>
                    <span className="font-mono text-emerald-600 font-bold">+{method.avgDelta}% gain</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(method.avgDelta / 20) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Interactive Semantic Graph Search & Explorer */}
      <div className="bg-white border border-stone-200 p-6 rounded-3xl text-left space-y-6">
        <div className="border-b border-stone-100 pb-4">
          <h3 className="font-sans font-black text-lg text-stone-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            {lang === 'FR' ? "Explorateur de Graphe & Recherche Sémantique" : "Live Graph Explorer & Semantic Query Core"}
          </h3>
          <p className="text-stone-400 text-xs font-semibold mt-1">
            {lang === 'FR' 
              ? "Recherchez des nœuds dans le graphe et explorez leurs dépendances sémantiques en temps réel." 
              : "Search nodes using concept synonyms or taxonomy terms and trace their neighboring edge connections."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left search pane */}
          <div className="space-y-4">
            <span className="font-mono text-[9.5px] font-black uppercase text-stone-400 block tracking-wider">
              🔍 {lang === 'FR' ? "RECHERCHE SÉMANTIQUE (TF-IDF & HOP)" : "HYBRID RETRIEVAL CORE"}
            </span>

            {/* Input wrapper */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'FR' ? "Saisissez un concept (ex: lead, code, stress)..." : "Type a concept (e.g. lead, code, stress)..."}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 text-stone-900 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white"
              />
            </div>

            {/* Results */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {searchResults.length === 0 && searchQuery.trim().length > 0 ? (
                <p className="text-xs text-stone-400 italic py-2">{lang === 'FR' ? "Aucune relation trouvée." : "No semantic matches found."}</p>
              ) : searchQuery.trim().length === 0 ? (
                // Seed suggestions
                <div className="space-y-1">
                  <span className="text-[10px] text-stone-400 font-bold block mb-1">{lang === 'FR' ? "Concepts populaires :" : "Popular concepts to search:"}</span>
                  {['leadership', 'conflict', 'technical', 'google', 'amazon'].map(term => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="inline-block bg-stone-50 hover:bg-stone-100 border border-stone-200 px-2 py-1 rounded-md text-[10.5px] font-bold text-stone-700 mr-1.5 mb-1.5 cursor-pointer transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              ) : (
                searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedNodeId(res.node.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col space-y-1 cursor-pointer ${
                      selectedNodeId === res.node.id
                        ? 'bg-stone-950 border-stone-950 text-white shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="truncate">{res.node.label}</span>
                      <span className="font-mono text-[9px] uppercase opacity-75">{res.node.type}</span>
                    </div>
                    <span className="text-[10px] opacity-80 leading-normal line-clamp-1">{res.matchExplanation}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Middle/Right: explored node details */}
          <div className="lg:col-span-2 bg-stone-50 border border-stone-150 rounded-2xl p-5 space-y-5">
            {exploredData ? (
              <div className="space-y-5">
                
                {/* Node Main Title */}
                <div className="flex items-start justify-between border-b border-stone-200 pb-3">
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-black uppercase">
                      {exploredData.node.type}
                    </span>
                    <h4 className="text-lg font-sans font-black text-stone-900 tracking-tight">{exploredData.node.label}</h4>
                  </div>
                  <span className="font-mono text-[10.5px] text-stone-400 font-bold">ID: {exploredData.node.id}</span>
                </div>

                {/* Node Metadata content */}
                <div className="bg-white border border-stone-200 rounded-xl p-4 text-xs space-y-2 shadow-2xs">
                  <span className="font-mono text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                    {lang === 'FR' ? "MÉTA-DONNÉES DU NOEUD" : "NODE PROPERTIES"}
                  </span>
                  {Object.entries(exploredData.node.data).map(([key, val]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:justify-between border-b border-stone-50 pb-1 mt-1">
                      <span className="text-stone-400 font-bold text-[10px] uppercase truncate">{key}</span>
                      <span className="text-stone-800 font-semibold truncate sm:max-w-md">
                        {Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Neighbor connections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Incoming dependencies */}
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] font-black uppercase text-stone-400 block tracking-wider">
                      📥 {lang === 'FR' ? "RELATIONS ENTRANTES" : "INBOUND LINKS"}
                    </span>
                    {exploredData.incoming.length === 0 ? (
                      <p className="text-[11px] text-stone-400 italic">{lang === 'FR' ? "Aucun lien entrant." : "No incoming links."}</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {exploredData.incoming.map((inc: any, i: number) => (
                          <div 
                            key={i} 
                            onClick={() => setSelectedNodeId(inc.node.id)}
                            className="bg-white border border-stone-200 px-3 py-2 rounded-lg flex justify-between items-center text-xs hover:border-indigo-400 cursor-pointer transition-all"
                          >
                            <span className="font-bold text-stone-800 truncate max-w-[130px]">{inc.node.label}</span>
                            <span className="font-mono text-[9px] bg-stone-100 px-1 py-0.5 rounded text-stone-500 font-extrabold">{inc.edge.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Outgoing dependencies */}
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] font-black uppercase text-stone-400 block tracking-wider">
                      📤 {lang === 'FR' ? "RELATIONS SORTANTES" : "OUTBOUND DEPENDENCIES"}
                    </span>
                    {exploredData.outgoing.length === 0 ? (
                      <p className="text-[11px] text-stone-400 italic">{lang === 'FR' ? "Aucun lien sortant." : "No outgoing links."}</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {exploredData.outgoing.map((out: any, i: number) => (
                          <div 
                            key={i} 
                            onClick={() => setSelectedNodeId(out.node.id)}
                            className="bg-white border border-stone-200 px-3 py-2 rounded-lg flex justify-between items-center text-xs hover:border-indigo-400 cursor-pointer transition-all"
                          >
                            <span className="font-bold text-stone-800 truncate max-w-[130px]">{out.node.label}</span>
                            <span className="font-mono text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-1 py-0.5 rounded font-extrabold">{out.edge.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-stone-400 italic text-xs">
                {lang === 'FR' ? "Sélectionnez un noeud pour commencer l'exploration." : "Select any node from results or suggestions to explore."}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Privacy guarantee block */}
      <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start">
        <div className="bg-white p-2.5 rounded-xl border border-stone-200 text-[#1e40af] shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider">
            {lang === 'FR' ? "Cadre de Confidentialité & Apprentissage Anonyme" : "Anonymous Learning & Privacy Hardened Vault"}
          </h4>
          <p className="text-xs text-[#6B7280] font-medium leading-relaxed">
            {lang === 'FR'
              ? "Le graphe sémantique global de SHANA n'enregistre jamais de données d'identification personnelles. Les noms, courriels, informations financières et documents originaux restent isolés au sein de profils chiffrés. Seules les corrélations de progression cognitives, les forces de preuvesSTAR et les méta-données de questions contribuent au graphe global."
              : "SHANA's knowledge graph operates on a strict, identity-isolated schema. Candidate identity fields, financial data, and raw conversation text are entirely pruned. Only anonymized, aggregated, STAR evidence weights and cognitive metrics enrich our core models."}
          </p>
        </div>
      </div>

    </div>
  );
}
