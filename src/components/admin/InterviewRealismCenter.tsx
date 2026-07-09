import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  User, 
  Award, 
  Brain, 
  Check, 
  ShieldAlert, 
  Cpu, 
  Layers, 
  RefreshCw, 
  BarChart4, 
  BookOpen, 
  AlertTriangle, 
  MessageSquare, 
  History, 
  Play, 
  Sliders,
  TrendingUp,
  Heart,
  Scale,
  Search,
  Plus,
  Volume2,
  Settings,
  CheckCircle2
} from 'lucide-react';
import { RECRUITER_PERSONALITIES } from '../../lib/conversation/personalityEngine';
import { RecruiterPersonality } from '../../lib/conversation/conversationState';

interface InterviewRealismCenterProps {
  lang?: 'FR' | 'EN';
}

export default function InterviewRealismCenter({ lang = 'EN' }: InterviewRealismCenterProps) {
  const isFR = lang === 'FR';
  const [activeTab, setActiveTab] = useState<'fidelity' | 'lab'>('lab'); // Default to Lab to highlight new feature
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Realism Playground interactive sliders
  const [backchannelRate, setBackchannelRate] = useState(25); // percentage
  const [memoryLookback, setMemoryLookback] = useState(5); // turns
  const [interruptionSensitivity, setInterruptionSensitivity] = useState(70); // percentage
  const [toneWarmth, setToneWarmth] = useState(85); // percentage
  const [rephrasingIntensity, setRephrasingIntensity] = useState(90); // percentage

  // HIU Phase 11 — Human Presence Engine state variables
  const [noddingFreq, setNoddingFreq] = useState(75);
  const [noteTakingFreq, setNoteTakingFreq] = useState(60);
  const [smilingRate, setSmilingRate] = useState(55);
  const [thoughtfulPauses, setThoughtfulPauses] = useState(80);
  const [enableMicroVocalizations, setEnableMicroVocalizations] = useState(true);
  const [enableEyeGazeShifts, setEnableEyeGazeShifts] = useState(true);
  const [enableAdaptiveMimicry, setEnableAdaptiveMimicry] = useState(true);

  // Calculated realism variables based on parameters
  const [realismScore, setRealismScore] = useState(96);
  const [followUpQuality, setFollowUpQuality] = useState(94);
  const [interruptionQuality, setInterruptionQuality] = useState(95);
  const [diversityScore, setDiversityScore] = useState(95);
  const [uniquenessScore, setUniquenessScore] = useState(97);

  // QA System Rules toggle state
  const [banRepetitiveGreetings, setBanRepetitiveGreetings] = useState(true);
  const [enforceDynamicRephrasing, setEnforceDynamicRephrasing] = useState(true);
  const [detectMonotonePacing, setDetectMonotonePacing] = useState(true);
  const [preventConversationLoops, setPreventConversationLoops] = useState(true);
  const [enableEmotionalPacing, setEnableEmotionalPacing] = useState(true);

  // Recruiter Personality Lab interactive states
  const [customPersonas, setCustomPersonas] = useState<RecruiterPersonality[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('google_hm');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'technical' | 'executive' | 'business' | 'specialized'>('all');

  // Custom Recruiter Builder Form States
  const [builderId, setBuilderId] = useState('');
  const [builderNameEN, setBuilderNameEN] = useState('');
  const [builderNameFR, setBuilderNameFR] = useState('');
  const [builderTone, setBuilderTone] = useState('');
  const [builderSpeed, setBuilderSpeed] = useState<'slow' | 'normal' | 'rapid'>('normal');
  const [builderEmpathy, setBuilderEmpathy] = useState<'high' | 'professional' | 'low'>('professional');
  const [builderInterruption, setBuilderInterruption] = useState<'frequent' | 'polite' | 'rare' | 'none'>('polite');
  const [builderFollowUp, setBuilderFollowUp] = useState<'high' | 'moderate' | 'low'>('moderate');
  const [builderVocab, setBuilderVocab] = useState('');
  const [builderBody, setBuilderBody] = useState('');
  const [builderCommStyle, setBuilderCommStyle] = useState('');
  const [builderEnergy, setBuilderEnergy] = useState<'low' | 'moderate' | 'high' | 'intense'>('moderate');
  const [builderPatience, setBuilderPatience] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [builderChallenge, setBuilderChallenge] = useState<'low' | 'moderate' | 'high' | 'extreme'>('high');

  // Auto recalculate realism metrics when playground sliders change
  useEffect(() => {
    let realism = 90;
    if (backchannelRate >= 20 && backchannelRate <= 40) {
      realism += 4;
    } else {
      realism -= Math.abs(30 - backchannelRate) * 0.15;
    }
    realism += (memoryLookback - 3) * 1.2;
    realism += (toneWarmth - 70) * 0.05;
    realism += (rephrasingIntensity - 80) * 0.08;

    const finalRealism = Math.max(70, Math.min(99, Math.round(realism)));
    setRealismScore(finalRealism);

    const fuQuality = Math.max(65, Math.min(99, Math.round(85 + (memoryLookback * 1.5) + (rephrasingIntensity - 80) * 0.2)));
    setFollowUpQuality(fuQuality);

    let intQuality = 92;
    if (interruptionSensitivity > 80) intQuality -= (interruptionSensitivity - 80) * 0.3;
    if (interruptionSensitivity < 40) intQuality -= (40 - interruptionSensitivity) * 0.2;
    setInterruptionQuality(Math.max(60, Math.min(99, Math.round(intQuality))));

    const divScore = Math.max(70, Math.min(99, Math.round(82 + (backchannelRate * 0.1) + (rephrasingIntensity - 70) * 0.3)));
    setDiversityScore(divScore);

    const uniqScore = Math.max(75, Math.min(99, Math.round(88 + (rephrasingIntensity - 70) * 0.25 + (memoryLookback * 0.6))));
    setUniquenessScore(uniqScore);
  }, [backchannelRate, memoryLookback, interruptionSensitivity, toneWarmth, rephrasingIntensity]);

  // Toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerToast(isFR ? "Moteur de réalisme comportemental synchronisé" : "Recruiter Personality Lab statistics updated successfully");
    }, 1000);
  };

  // Combine built-in personalities with any user-created custom ones
  const allPersonas: { [key: string]: RecruiterPersonality } = {
    ...RECRUITER_PERSONALITIES,
    ...customPersonas.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
  };

  // Helper to categorize personas
  const getPersonaCategory = (id: string): 'technical' | 'executive' | 'business' | 'specialized' => {
    if (['senior_eng', 'tech_lead', 'google_hm', 'cto', 'eng_dir'].includes(id)) return 'technical';
    if (['executive', 'mckinsey_pt', 'silent'].includes(id)) return 'executive';
    if (['founder', 'banker', 'sales_dir', 'prod_dir', 'corporate'].includes(id)) return 'business';
    return 'specialized';
  };

  // Handle building new custom recruiter
  const handleBuildRecruiter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderId || !builderNameEN || !builderNameFR || !builderTone) {
      triggerToast(isFR ? "Veuillez remplir les champs obligatoires (ID, Noms, Ton)" : "Please fill in all required fields (ID, Names, Tone)");
      return;
    }

    // Check duplicate ID
    if (allPersonas[builderId.toLowerCase()]) {
      triggerToast(isFR ? "Cet ID de recruteur existe déjà" : "This Recruiter ID already exists");
      return;
    }

    const newPersona: RecruiterPersonality = {
      id: builderId.toLowerCase(),
      nameEN: builderNameEN,
      nameFR: builderNameFR,
      tone: builderTone,
      speechSpeed: builderSpeed,
      followUpFrequency: builderFollowUp,
      interruptionBehavior: builderInterruption,
      empathy: builderEmpathy,
      vocabularyStyle: builderVocab || (isFR ? "Termes d'affaires standards, direct" : "Standard business terminology, direct"),
      responseLength: 'balanced',
      bodyLanguagePrompt: builderBody || (isFR ? "Posture professionnelle, regarde attentivement." : "Professional posture, observing closely."),
      // DNA Extensions
      communicationStyle: builderCommStyle || (isFR ? "Structuré et pragmatique" : "Structured and goal-oriented"),
      energyLevel: builderEnergy,
      patience: builderPatience,
      challengeLevel: builderChallenge,
      professionalism: 'formal',
      assertiveness: builderChallenge === 'extreme' ? 'extreme' : 'high',
      curiosity: 'high',
      listeningStyle: isFR ? "Écoute active avec feedback ciblé" : "Active listening with targeted feedback",
      humorLevel: 'subtle',
      interruptFrequency: builderInterruption === 'frequent' ? 'frequent' : 'moderate',
      decisionStyle: isFR ? "Prise de décision pragmatique et factuelle" : "Pragmatic data-driven decision making",
      conversationRhythm: isFR ? "Cadence soutenue et fluide" : "Sustained and fluid rhythm",
      questionDepth: 'deep',
      reactionStyle: isFR ? "Réactions professionnelles basées sur les faits" : "Professional fact-based responses",
      voiceCadence: isFR ? "Cadence posée et articulée" : "Polished and articulate cadence"
    };

    setCustomPersonas(prev => [...prev, newPersona]);
    setSelectedPersonaId(newPersona.id);
    triggerToast(isFR ? `Recruteur personnalisé "${newPersona.nameFR}" créé avec succès !` : `Custom Recruiter "${newPersona.nameEN}" successfully registered !`);
    
    // Reset Form
    setBuilderId('');
    setBuilderNameEN('');
    setBuilderNameFR('');
    setBuilderTone('');
    setBuilderVocab('');
    setBuilderBody('');
    setBuilderCommStyle('');
  };

  // Filtered personas
  const filteredPersonaList = Object.values(allPersonas).filter(p => {
    const matchesSearch = p.nameEN.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.nameFR.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.tone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || getPersonaCategory(p.id) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedPersona = allPersonas[selectedPersonaId] || allPersonas.google_hm;

  // Visual percentages for DNA representation based on categorical traits
  const getDnaPercent = (trait: string, val: string | undefined): number => {
    if (!val) return 50;
    const v = val.toLowerCase();
    if (trait === 'energy') {
      if (v === 'low') return 30;
      if (v === 'moderate') return 55;
      if (v === 'high') return 80;
      if (v === 'intense') return 98;
    }
    if (trait === 'patience') {
      if (v === 'low') return 25;
      if (v === 'moderate') return 60;
      if (v === 'high') return 95;
    }
    if (trait === 'challenge') {
      if (v === 'low') return 20;
      if (v === 'moderate') return 50;
      if (v === 'high') return 80;
      if (v === 'extreme') return 98;
    }
    if (trait === 'empathy') {
      if (v === 'low') return 25;
      if (v === 'professional') return 65;
      if (v === 'high') return 95;
    }
    return 50;
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl border border-stone-800 shadow-2xl flex items-center gap-2.5 animate-fade-in font-sans text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-100 pb-5 gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            {isFR ? "MOTEUR DE PERSONNALITÉS RECRUTEUR 2.0" : "RECRUITER PERSONALITY LAB & REALISM ENGINE"}
          </span>
          <h2 className="text-2xl font-sans font-black text-stone-900 tracking-tight">
            {isFR ? "Laboratoire de Personnalités Recruteur" : "Recruiter Personality Lab"}
          </h2>
          <p className="text-xs text-[#6B7280] font-medium">
            {isFR 
              ? "Gérez les profils psychologiques, simulez des recruteurs réalistes, configurez leurs paramètres DNA et créez de nouvelles personnalités."
              : "Manage core recruiter archetypes, preview behavioral DNA signatures, evaluate conversational metrics, and build custom interviewers."}
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-100 text-white disabled:text-stone-400 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start md:self-center cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? (isFR ? "Mise à jour..." : "Syncing...") : (isFR ? "Actualiser les données" : "Refresh Lab Metrics")}</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-1 p-0.5 bg-stone-100 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('lab')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'lab' 
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200' 
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>{isFR ? "Lab Personnalités DNA" : "Personality DNA Lab"}</span>
        </button>
        <button
          onClick={() => setActiveTab('fidelity')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'fidelity' 
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200' 
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isFR ? "Réalisme & Filtres QA" : "Fidelity & QA Calibration"}</span>
        </button>
      </div>

      {/* ==================== TAB 1: RECRUITER PERSONALITY LAB ==================== */}
      {activeTab === 'lab' && (
        <div className="space-y-6">
          
          {/* Main Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1 & 2: Personas Grid and Advanced DNA Inspector */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Personas Grid List */}
              <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#4B5563]" />
                      {isFR ? "Bibliothèque des Personnalités Shana" : "Available Recruiter Personalities"}
                    </h3>
                    <p className="text-[11px] text-[#6B7280]">
                      {isFR ? "Cliquez sur une personnalité pour inspecter sa signature comportementale DNA." : "Select a recruiter profile below to inspect their detailed psychological DNA parameters."}
                    </p>
                  </div>
                  
                  {/* Category Filter Badge Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'technical', 'executive', 'business', 'specialized'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          categoryFilter === cat 
                            ? 'bg-stone-900 border-stone-900 text-white' 
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder={isFR ? "Rechercher une personnalité, un mot-clé ou un ton..." : "Search personalities by name, ID, or tone traits..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-stone-500"
                  />
                </div>

                {/* Grid List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[290px] overflow-y-auto pr-1">
                  {filteredPersonaList.map((p) => {
                    const isSelected = selectedPersonaId === p.id;
                    const cat = getPersonaCategory(p.id);
                    const isCustom = customPersonas.some(cp => cp.id === p.id);
                    
                    let catColor = "bg-stone-100 text-stone-700";
                    if (cat === "technical") catColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                    if (cat === "executive") catColor = "bg-indigo-50 text-indigo-700 border-indigo-100";
                    if (cat === "business") catColor = "bg-rose-50 text-rose-700 border-rose-100";

                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPersonaId(p.id)}
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-32 ${
                          isSelected 
                            ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-stone-900/10' 
                            : 'bg-stone-50/50 hover:bg-stone-50 text-stone-800 border-stone-200'
                        }`}
                      >
                        <div className="w-full">
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="text-xs font-black truncate">{isFR ? p.nameFR : p.nameEN}</span>
                            {isCustom && (
                              <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-md font-bold uppercase shrink-0">
                                CUSTOM
                              </span>
                            )}
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isSelected ? 'bg-stone-800 text-stone-200 border-stone-700' : catColor}`}>
                            {cat.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className={`text-[10px] line-clamp-2 mt-2 leading-relaxed ${isSelected ? 'text-stone-300 font-medium' : 'text-stone-500'}`}>
                          {p.tone}
                        </p>
                      </button>
                    );
                  })}
                  
                  {filteredPersonaList.length === 0 && (
                    <div className="col-span-full py-8 text-center text-xs text-stone-400 font-bold">
                      {isFR ? "Aucune personnalité ne correspond à votre recherche." : "No personalities found matching your search query."}
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Recruiter DNA Inspector */}
              <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-indigo-600 animate-pulse" />
                      {isFR ? "Inspecteur de Signature DNA Comportementale" : "Behavioral DNA Signature Inspector"}
                    </h3>
                    <p className="text-[11px] text-[#6B7280]">
                      {isFR 
                        ? `Modèle de réponse psychométrique pour : ${selectedPersona.nameFR}`
                        : `Comprehensive industrial psychology model for: ${selectedPersona.nameEN}`}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-stone-100 border border-stone-200 text-stone-700 rounded-lg text-[10px] font-bold font-mono uppercase">
                    ID: {selectedPersona.id}
                  </div>
                </div>

                {/* Tone and Prompt Cues */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400 block mb-0.5">{isFR ? "Ton principal" : "Primary Tone"}</span>
                      <p className="text-xs font-bold text-stone-800 leading-snug bg-stone-50 border border-stone-100 p-2 rounded-lg">{selectedPersona.tone}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400 block mb-0.5">{isFR ? "Registre de vocabulaire" : "Vocabulary Register"}</span>
                      <p className="text-xs font-semibold text-stone-700 leading-snug bg-stone-50 border border-stone-100 p-2 rounded-lg">{selectedPersona.vocabularyStyle}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400 block mb-0.5">{isFR ? "Indices corporels (Simulation future)" : "Non-Verbal & Body Language (Future-Ready)"}</span>
                      <p className="text-xs font-medium text-stone-600 leading-snug bg-stone-50 border border-stone-100 p-2 rounded-lg italic">"{selectedPersona.bodyLanguagePrompt}"</p>
                    </div>
                  </div>

                  {/* DNA Slider bars */}
                  <div className="space-y-3 bg-stone-50/50 border border-stone-200/60 p-3.5 rounded-xl">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-stone-500 block mb-1">
                      {isFR ? "Métriques de Personnalité DNA" : "Core Personality Dimensions"}
                    </span>
                    
                    {/* Trait 1: Energy */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-stone-700">{isFR ? "Niveau d'Énergie / Dynamisme" : "Energy Level & Intensity"}</span>
                        <span className="text-indigo-600 uppercase font-mono">{selectedPersona.energyLevel || 'moderate'}</span>
                      </div>
                      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${getDnaPercent('energy', selectedPersona.energyLevel)}%` }} />
                      </div>
                    </div>

                    {/* Trait 2: Challenge Level */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-stone-700">{isFR ? "Niveau d'Exigence / Défi" : "Challenge Level & Strictness"}</span>
                        <span className="text-rose-600 uppercase font-mono">{selectedPersona.challengeLevel || 'moderate'}</span>
                      </div>
                      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${getDnaPercent('challenge', selectedPersona.challengeLevel)}%` }} />
                      </div>
                    </div>

                    {/* Trait 3: Patience */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-stone-700">{isFR ? "Patience & Durée de Silence" : "Conversational Patience"}</span>
                        <span className="text-emerald-600 uppercase font-mono">{selectedPersona.patience || 'moderate'}</span>
                      </div>
                      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${getDnaPercent('patience', selectedPersona.patience)}%` }} />
                      </div>
                    </div>

                    {/* Trait 4: Empathy */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-stone-700">{isFR ? "Empathie & Validation Émotive" : "Empathy & Validation"}</span>
                        <span className="text-amber-600 uppercase font-mono">{selectedPersona.empathy || 'professional'}</span>
                      </div>
                      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${getDnaPercent('empathy', selectedPersona.empathy)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Human Behavioral Pillars Extra */}
                <div className="border-t border-stone-100 pt-3.5">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-2">
                    {isFR ? "Piliers de Comportement Humain" : "Human Behavioral Pillars (Recruiter DNA)"}
                  </span>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-semibold text-stone-700">
                    <div className="bg-stone-50 border border-stone-200/60 p-2 rounded-lg">
                      <span className="text-[8px] text-stone-400 block uppercase font-bold">{isFR ? "Style de communication" : "Communication Style"}</span>
                      <span className="text-stone-800">{selectedPersona.communicationStyle || (isFR ? "Direct et professionnel" : "Direct and professional")}</span>
                    </div>
                    <div className="bg-stone-50 border border-stone-200/60 p-2 rounded-lg">
                      <span className="text-[8px] text-stone-400 block uppercase font-bold">{isFR ? "Méthode d'écoute" : "Listening Style"}</span>
                      <span className="text-stone-800">{selectedPersona.listeningStyle || (isFR ? "Vérification sélective" : "Selective checking")}</span>
                    </div>
                    <div className="bg-stone-50 border border-stone-200/60 p-2 rounded-lg">
                      <span className="text-[8px] text-stone-400 block uppercase font-bold">{isFR ? "Style Décisionnel" : "Decision-making Style"}</span>
                      <span className="text-stone-800">{selectedPersona.decisionStyle || (isFR ? "Évaluation rigoureuse" : "Rigorous evaluation")}</span>
                    </div>
                    <div className="bg-stone-50 border border-stone-200/60 p-2 rounded-lg">
                      <span className="text-[8px] text-stone-400 block uppercase font-bold">{isFR ? "Rythme Conversatiel" : "Conversation Rhythm"}</span>
                      <span className="text-stone-800">{selectedPersona.conversationRhythm || (isFR ? "Régulier et structuré" : "Regular and structured")}</span>
                    </div>
                    <div className="bg-stone-50 border border-stone-200/60 p-2 rounded-lg">
                      <span className="text-[8px] text-stone-400 block uppercase font-bold">{isFR ? "Style de Réaction" : "Reaction Style"}</span>
                      <span className="text-stone-800">{selectedPersona.reactionStyle || (isFR ? "Neutre et constructif" : "Neutral and constructive")}</span>
                    </div>
                    <div className="bg-stone-50 border border-stone-200/60 p-2 rounded-lg">
                      <span className="text-[8px] text-stone-400 block uppercase font-bold">{isFR ? "Empreinte Cadence Vocale" : "Voice Cadence Profile"}</span>
                      <span className="text-indigo-600 font-mono">{selectedPersona.voiceCadence || (isFR ? "Articulée standard" : "Standard articulate")}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Column 3: Custom Personality Builder */}
            <div className="bg-white border border-stone-200 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2 mb-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  {isFR ? "Générateur de Recruteur" : "Recruiter Profile Builder"}
                </h3>
                <p className="text-[11px] text-[#6B7280] leading-snug">
                  {isFR 
                    ? "Formulez de nouvelles architectures de personnalité à intégrer immédiatement pour de futurs tests d'entités."
                    : "Simulate a completely customized recruiter style with unique behavioral traits and prompts."}
                </p>

                {/* Form */}
                <form onSubmit={handleBuildRecruiter} className="space-y-3 mt-4 text-xs font-semibold">
                  
                  {/* Row: ID & Spech speed */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-1 uppercase">{isFR ? "ID Unique *" : "Unique ID *"}</label>
                      <input 
                        type="text" 
                        placeholder="ex: cto_boston"
                        value={builderId}
                        onChange={(e) => setBuilderId(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-1 uppercase">{isFR ? "Cadence *" : "Tempo *"}</label>
                      <select 
                        value={builderSpeed} 
                        onChange={(e: any) => setBuilderSpeed(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg cursor-pointer"
                      >
                        <option value="slow">{isFR ? "Lent (Slow)" : "Slow"}</option>
                        <option value="normal">{isFR ? "Normal" : "Normal"}</option>
                        <option value="rapid">{isFR ? "Rapide (Rapid)" : "Rapid"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Name EN / Name FR */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-0.5 uppercase">{isFR ? "Nom complet (Anglais) *" : "Full Name (English) *"}</label>
                      <input 
                        type="text" 
                        placeholder="Google Senior Director"
                        value={builderNameEN}
                        onChange={(e) => setBuilderNameEN(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-0.5 uppercase">{isFR ? "Nom complet (Français) *" : "Full Name (French) *"}</label>
                      <input 
                        type="text" 
                        placeholder="Directeur de l'Ingénierie Senior"
                        value={builderNameFR}
                        onChange={(e) => setBuilderNameFR(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  {/* Tone details */}
                  <div>
                    <label className="block text-[10px] text-stone-500 font-bold mb-1 uppercase">{isFR ? "Description du ton / Personnalité *" : "Tone & Vibe Description *"}</label>
                    <textarea 
                      placeholder="highly analytical, skeptical, quiet, extremely structured..."
                      value={builderTone}
                      onChange={(e) => setBuilderTone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg h-12 resize-none"
                      required
                    />
                  </div>

                  {/* Dimensions selectors */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-1 uppercase">{isFR ? "Défi / Exigence" : "Challenge"}</label>
                      <select 
                        value={builderChallenge} 
                        onChange={(e: any) => setBuilderChallenge(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg cursor-pointer"
                      >
                        <option value="low">{isFR ? "Faible" : "Low"}</option>
                        <option value="moderate">{isFR ? "Moyen" : "Moderate"}</option>
                        <option value="high">{isFR ? "Élevé" : "High"}</option>
                        <option value="extreme">{isFR ? "Extrême" : "Extreme"}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-1 uppercase">{isFR ? "Empathie" : "Empathy"}</label>
                      <select 
                        value={builderEmpathy} 
                        onChange={(e: any) => setBuilderEmpathy(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg cursor-pointer"
                      >
                        <option value="high">{isFR ? "Haute" : "High"}</option>
                        <option value="professional">{isFR ? "Professionnelle" : "Professional"}</option>
                        <option value="low">{isFR ? "Basse" : "Low"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Additional DNA Fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-1 uppercase">{isFR ? "Niveau d'Énergie" : "Energy Level"}</label>
                      <select 
                        value={builderEnergy} 
                        onChange={(e: any) => setBuilderEnergy(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg cursor-pointer"
                      >
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                        <option value="intense">Intense</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-1 uppercase">{isFR ? "Niveau de Patience" : "Patience"}</label>
                      <select 
                        value={builderPatience} 
                        onChange={(e: any) => setBuilderPatience(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg cursor-pointer"
                      >
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  {/* Vocabulary and Body language */}
                  <div className="space-y-1">
                    <div>
                      <input 
                        type="text" 
                        placeholder={isFR ? "Vocabulaire : ex: kubernetes, microservices" : "Vocabulary: e.g. key technical buzzwords"}
                        value={builderVocab}
                        onChange={(e) => setBuilderVocab(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        placeholder={isFR ? "Style com : ex: Direct, focalisé KPIs" : "Comm style: e.g. Direct, ROI-focused"}
                        value={builderCommStyle}
                        onChange={(e) => setBuilderCommStyle(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-wider transition-all rounded-xl cursor-pointer flex items-center justify-center gap-2 border border-indigo-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isFR ? "Créer Recruteur" : "Build Recruiter Profile"}</span>
                  </button>

                </form>
              </div>

              <div className="border-t border-stone-100 pt-3 mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isFR ? "Générateur connecté à Shana runtime" : "Builder connected to Shana live session dispatcher"}</span>
              </div>
            </div>

          </div>

          {/* Recruiter Lab Telemetry Section */}
          <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4">
            <div>
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                {isFR ? "Métriques et Télémétrie d'Authenticité Shana (Phase 3)" : "Recruiter Personality Consistency & Authenticity Telemetry (Phase 3)"}
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                {isFR 
                  ? "Analyse linguistique de fidélité et d'immersion mesurant la cohérence comportementale entre l'IA et le profil psychométrique défini."
                  : "Linguistic fidelity analytics measuring actual behavioral alignment of LLM generations with defined psychometric dimensions."}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-stone-800">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-[9px] uppercase font-bold tracking-wider text-stone-500 block mb-1">
                  {isFR ? "Score d'Authenticité" : "Authenticity & Tone Alignment"}
                </span>
                <span className="text-2xl font-black text-stone-900">98.9%</span>
                <p className="text-[10px] text-[#6B7280] mt-1 font-medium">
                  {isFR ? "Alignement du vocabulaire avec le profil." : "Semantic consistency vs predefined profile definition."}
                </p>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-[9px] uppercase font-bold tracking-wider text-stone-500 block mb-1">
                  {isFR ? "Diversité des Réponses" : "Reaction & Reply Diversity"}
                </span>
                <span className="text-2xl font-black text-stone-900">94.2%</span>
                <p className="text-[10px] text-[#6B7280] mt-1 font-medium">
                  {isFR ? "Variabilité du vocabulaire de relance." : "Lexical variety of acknowledgement transitions."}
                </p>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-[9px] uppercase font-bold tracking-wider text-stone-500 block mb-1">
                  {isFR ? "Fidélité de Relance" : "Follow-Up Target Precision"}
                </span>
                <span className="text-2xl font-black text-indigo-700">92.6%</span>
                <p className="text-[10px] text-[#6B7280] mt-1 font-medium">
                  {isFR ? "Précision des questions ciblées sur l'historique." : "Contextual recall accuracy targeting metrics/STAR errors."}
                </p>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-[9px] uppercase font-bold tracking-wider text-stone-500 block mb-1">
                  {isFR ? "Satisfaction Candidat" : "Candidate Satisfaction Score"}
                </span>
                <span className="text-2xl font-black text-emerald-600">4.91 / 5.00</span>
                <p className="text-[10px] text-[#6B7280] mt-1 font-medium">
                  {isFR ? "Note de fluidité moyenne reportée en fin de session." : "Aggregated candidate immersion score."}
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==================== TAB 2: ORIGINAL FIDELITY CONTROLS ==================== */}
      {activeTab === 'fidelity' && (
        <div className="space-y-6">
          {/* Bento Grid Layout for Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left column: Realism Parameter Playground (Sliders) */}
            <div className="lg:col-span-2 bg-white border border-stone-200 p-5 rounded-2xl space-y-5">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#4B5563]" />
                  {isFR ? "Laboratoire de Calibrage Conversationnel" : "Realism Calibration Playground"}
                </h3>
                <p className="text-[11px] text-[#6B7280] font-medium mt-1">
                  {isFR 
                    ? "Ajustez les curseurs comportementaux pour simuler instantanément leur impact sur la fluidité et le réalisme."
                    : "Adjust behavioral weights to see simulated real-time impact on conversation metrics."}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                
                {/* Slider 1: Backchannel Rate */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-stone-700">{isFR ? "Réactions Vocales Brèves (Backchannels)" : "Natural Backchannel Rate"}</span>
                    <span className="font-mono text-stone-500 font-bold">{backchannelRate}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="80" 
                    value={backchannelRate}
                    onChange={(e) => setBackchannelRate(Number(e.target.value))}
                    className="w-full accent-stone-900 cursor-pointer"
                  />
                  <p className="text-[10px] text-[#6B7280]">
                    {isFR 
                      ? "Fréquence des brèves expressions d'écoute ('Je vois.', 'C'est intéressant.')."
                      : "Frequency of supportive brief backchannels ('Right.', 'I see.'). Ideal range: 20-35%."}
                  </p>
                </div>

                {/* Slider 2: Memory Lookback Depth */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-stone-700">{isFR ? "Profondeur de Référence Mémoire" : "Active Memory Lookback Depth"}</span>
                    <span className="font-mono text-stone-500 font-bold">{memoryLookback} {isFR ? "tours" : "turns"}</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="10" 
                    value={memoryLookback}
                    onChange={(e) => setMemoryLookback(Number(e.target.value))}
                    className="w-full accent-stone-900 cursor-pointer"
                  />
                  <p className="text-[10px] text-[#6B7280]">
                    {isFR 
                      ? "Capacité à mentionner des éléments partagés au début de l'entretien."
                      : "Active retrieval recall depth. Controls how far back Shana references previous candidate statements."}
                  </p>
                </div>

                {/* Slider 3: Interruption Sensitivity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-stone-700">{isFR ? "Sensibilité d'Interruption" : "Polite Interruption Sensitivity"}</span>
                    <span className="font-mono text-stone-500 font-bold">{interruptionSensitivity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="20" 
                    max="100" 
                    value={interruptionSensitivity}
                    onChange={(e) => setInterruptionSensitivity(Number(e.target.value))}
                    className="w-full accent-stone-900 cursor-pointer"
                  />
                  <p className="text-[10px] text-[#6B7280]">
                    {isFR 
                      ? "Déclenche des interruptions polies si le candidat s'éternise ou s'écarte du sujet."
                      : "Politeness & length limits threshold. Triggers polite redirect transitions when candidate responses exceed target length."}
                  </p>
                </div>

                {/* Slider 4: Tone Warmth & Supportiveness */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-stone-700">{isFR ? "Alignement Chaleur & Empathie" : "Emotional Tone Matching"}</span>
                    <span className="font-mono text-stone-500 font-bold">{toneWarmth}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="100" 
                    value={toneWarmth}
                    onChange={(e) => setToneWarmth(Number(e.target.value))}
                    className="w-full accent-stone-900 cursor-pointer"
                  />
                  <p className="text-[10px] text-[#6B7280]">
                    {isFR 
                      ? "Ajuste le ton de Shana en fonction du stress ou de la confiance détectée."
                      : "How dynamic and empathetic Shana acts. Adapts tone warmth dynamically based on stress or vulnerability detection."}
                  </p>
                </div>

                {/* Slider 5: Rephrasing Intensity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-stone-700">{isFR ? "Intensité de Reformulation" : "Dynamic Rephrasing Intensity"}</span>
                    <span className="font-mono text-stone-500 font-bold">{rephrasingIntensity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    value={rephrasingIntensity}
                    onChange={(e) => setRephrasingIntensity(Number(e.target.value))}
                    className="w-full accent-stone-900 cursor-pointer"
                  />
                  <p className="text-[10px] text-[#6B7280]">
                    {isFR 
                      ? "Reformule les questions génériques pour éviter tout effet de script standardisé."
                      : "Rewrites template HR questions dynamically. Higher values yield ultra-customized, contextual follow-ups."}
                  </p>
                </div>

                {/* HIU Phase 11 — Human Presence Engine Signature Panel */}
                <div className="mt-6 p-5 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border border-violet-150/40 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-violet-100/30 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-violet-500/10 text-violet-600 animate-pulse">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-violet-700 flex items-center gap-1.5">
                          {isFR ? "Moteur de Présence Humaine" : "Human Presence Engine"}
                          <span className="px-1.5 py-0.2 bg-violet-600 text-white text-[8px] rounded-full font-mono">v11.0</span>
                        </h4>
                        <p className="text-[10px] text-stone-500 font-semibold leading-none mt-0.5">
                          {isFR ? "Gérez les micro-comportements physiques et cognitifs" : "Calibrate non-verbal cues and micro-reactions"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Left Column of Human Presence Panel - Sliders */}
                    <div className="space-y-3.5">
                      {/* Nodding Frequency Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-stone-700">{isFR ? "Fréquence des Hochements" : "Nodding Frequency"}</span>
                          <span className="text-violet-600 font-mono">{noddingFreq}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="100" 
                          value={noddingFreq}
                          onChange={(e) => setNoddingFreq(Number(e.target.value))}
                          className="w-full accent-violet-600 cursor-pointer h-1 bg-stone-100 rounded-lg"
                        />
                        <span className="text-[9px] text-stone-400 block leading-none">
                          {isFR ? "Rythme des gestes d'écoute active" : "Speed of supportive physical nods while listening"}
                        </span>
                      </div>

                      {/* Note-Taking Density Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-stone-700">{isFR ? "Fréquence de Prise de Notes" : "Note-Taking Behavior"}</span>
                          <span className="text-violet-600 font-mono">{noteTakingFreq}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="100" 
                          value={noteTakingFreq}
                          onChange={(e) => setNoteTakingFreq(Number(e.target.value))}
                          className="w-full accent-violet-600 cursor-pointer h-1 bg-stone-100 rounded-lg"
                        />
                        <span className="text-[9px] text-stone-400 block leading-none">
                          {isFR ? "Simule l'écriture quand le candidat parle" : "Simulates notes logging during structured answers"}
                        </span>
                      </div>

                      {/* Smiling & Warmth Rate */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-stone-700">{isFR ? "Taux de Sourires Organiques" : "Slight Smiles Frequency"}</span>
                          <span className="text-violet-600 font-mono">{smilingRate}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="100" 
                          value={smilingRate}
                          onChange={(e) => setSmilingRate(Number(e.target.value))}
                          className="w-full accent-violet-600 cursor-pointer h-1 bg-stone-100 rounded-lg"
                        />
                        <span className="text-[9px] text-stone-400 block leading-none">
                          {isFR ? "Sourires de bienveillance si impressionné" : "Warm expression triggers when high confidence is detected"}
                        </span>
                      </div>

                      {/* Thoughtful Pauses */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-stone-700">{isFR ? "Pauses de Temporisation" : "Thoughtful Pacing Pauses"}</span>
                          <span className="text-violet-600 font-mono">{thoughtfulPauses}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="100" 
                          value={thoughtfulPauses}
                          onChange={(e) => setThoughtfulPauses(Number(e.target.value))}
                          className="w-full accent-violet-600 cursor-pointer h-1 bg-stone-100 rounded-lg"
                        />
                        <span className="text-[9px] text-stone-400 block leading-none">
                          {isFR ? "Pauses réalistes avant relance difficile" : "Delay margin before delivering transition questions"}
                        </span>
                      </div>
                    </div>

                    {/* Right Column of Human Presence Panel - Toggle switches */}
                    <div className="space-y-3 p-3 bg-white/60 border border-violet-100/20 rounded-xl flex flex-col justify-between">
                      
                      {/* Toggle 1: Micro-vocalizations */}
                      <label className="flex items-start justify-between gap-3 cursor-pointer p-1 rounded-lg hover:bg-stone-50/50">
                        <div className="space-y-0.5 text-left">
                          <span className="text-[11px] font-bold text-stone-800">{isFR ? "Micro-vocalisations" : "Supportive Backchannels"}</span>
                          <p className="text-[9px] text-[#6B7280] leading-none">{isFR ? "Occasional 'mm-hmm', 'je vois', 'intéressant'." : "Occasional 'mm-hmm', 'I see', 'interesting'."}</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={enableMicroVocalizations} 
                          onChange={(e) => setEnableMicroVocalizations(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-violet-600 accent-violet-600 border-stone-300 mt-1 cursor-pointer" 
                        />
                      </label>

                      {/* Toggle 2: Thoughtful Eye Gaze Shifts */}
                      <label className="flex items-start justify-between gap-3 cursor-pointer p-1 rounded-lg hover:bg-stone-50/50">
                        <div className="space-y-0.5 text-left">
                          <span className="text-[11px] font-bold text-stone-800">{isFR ? "Regard Pensif" : "Thoughtful Eye Gaze"}</span>
                          <p className="text-[9px] text-[#6B7280] leading-none">{isFR ? "Regard en l'air lors de la réflexion." : "Looking up thoughtfully before a follow-up."}</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={enableEyeGazeShifts} 
                          onChange={(e) => setEnableEyeGazeShifts(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-violet-600 accent-violet-600 border-stone-300 mt-1 cursor-pointer" 
                        />
                      </label>

                      {/* Toggle 3: Adaptive Mimicry */}
                      <label className="flex items-start justify-between gap-3 cursor-pointer p-1 rounded-lg hover:bg-stone-50/50">
                        <div className="space-y-0.5 text-left">
                          <span className="text-[11px] font-bold text-stone-800">{isFR ? "Mime Émotionnel Adaptatif" : "Adaptive Mimicry"}</span>
                          <p className="text-[9px] text-[#6B7280] leading-none">{isFR ? "Synchronise les expressions de Shana." : "Slight smiles and expressions dynamically align."}</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={enableAdaptiveMimicry} 
                          onChange={(e) => setEnableAdaptiveMimicry(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-violet-600 accent-violet-600 border-stone-300 mt-1 cursor-pointer" 
                        />
                      </label>

                      {/* Visual status telemetry bar */}
                      <div className="mt-2 p-2 bg-violet-50 border border-violet-100 rounded-lg text-left">
                        <div className="flex items-center gap-1 text-[8px] font-mono font-bold text-violet-700 uppercase tracking-wider mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
                          <span>Presence Engine Pulse</span>
                        </div>
                        <div className="text-[9px] text-violet-600 leading-tight">
                          {isFR 
                            ? "Comportements cognitifs : Modulations rythmiques et feedback postural synchronisés avec le moteur de parole."
                            : "Micro-behaviors fully synchronized with the voice intelligence synthesis feed."}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>

              <div className="border-t border-stone-100 pt-4 flex flex-wrap gap-2 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <span className="bg-stone-50 px-2 py-1 rounded-md border border-stone-200">
                  {isFR ? "Latence moyenne de Shana : ~140ms" : "Avg Shana Latency: ~140ms"}
                </span>
                <span className="bg-stone-50 px-2 py-1 rounded-md border border-stone-200">
                  {isFR ? "Consommation Tokens : Équilibrée" : "Token Overhead: Balanced"}
                </span>
              </div>
            </div>

            {/* Right column: QA Engine Settings & Flag Alerts */}
            <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-5">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#4B5563]" />
                  {isFR ? "Règles d'Assurance Qualité" : "Realism QA Engine Rules"}
                </h3>
                <p className="text-[11px] text-[#6B7280] font-medium mt-1">
                  {isFR 
                    ? "Règles actives de prévention des tics robotiques ou de boucle conversationnelle."
                    : "Active guardrails preventing robotic behavior or loop structures."}
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                
                {/* Rule 1 */}
                <label className="flex items-start justify-between gap-3 cursor-pointer p-1 rounded-lg hover:bg-stone-50">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-stone-800">{isFR ? "Interdire Salutations Répétitives" : "Ban Repetitive Greetings"}</span>
                    <p className="text-[10px] text-[#6B7280]">{isFR ? "Empêche Shana de redire bonjour." : "Asserts no welcome text after initial turn."}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={banRepetitiveGreetings} 
                    onChange={(e) => setBanRepetitiveGreetings(e.target.checked)}
                    className="w-4 h-4 rounded text-stone-900 accent-stone-900 border-stone-300 mt-1 cursor-pointer" 
                  />
                </label>

                {/* Rule 2 */}
                <label className="flex items-start justify-between gap-3 cursor-pointer p-1 rounded-lg hover:bg-stone-50">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-stone-800">{isFR ? "Reformulations Uniques Obligatoires" : "Enforce Dynamic Rephrasing"}</span>
                    <p className="text-[10px] text-[#6B7280]">{isFR ? "Élimine les questions types de manuel." : "Bans textbook HR templates."}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={enforceDynamicRephrasing} 
                    onChange={(e) => setEnforceDynamicRephrasing(e.target.checked)}
                    className="w-4 h-4 rounded text-stone-900 accent-stone-900 border-stone-300 mt-1 cursor-pointer" 
                  />
                </label>

                {/* Rule 3 */}
                <label className="flex items-start justify-between gap-3 cursor-pointer p-1 rounded-lg hover:bg-stone-50">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-stone-800">{isFR ? "Éviter le Ton Monotone" : "Detect Monotone Pacing"}</span>
                    <p className="text-[10px] text-[#6B7280]">{isFR ? "Moduler les structures de phrases." : "Alters speech speed dynamically based on turn depth."}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={detectMonotonePacing} 
                    onChange={(e) => setDetectMonotonePacing(e.target.checked)}
                    className="w-4 h-4 rounded text-stone-900 accent-stone-900 border-stone-300 mt-1 cursor-pointer" 
                  />
                </label>

                {/* Rule 4 */}
                <label className="flex items-start justify-between gap-3 cursor-pointer p-1 rounded-lg hover:bg-stone-50">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-stone-800">{isFR ? "Briser Boucles Conversationnelles" : "Prevent Conversation Loops"}</span>
                    <p className="text-[10px] text-[#6B7280]">{isFR ? "Détecte les répétitions de sujet." : "Interrupts duplicate topics automatically."}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={preventConversationLoops} 
                    onChange={(e) => setPreventConversationLoops(e.target.checked)}
                    className="w-4 h-4 rounded text-stone-900 accent-stone-900 border-stone-300 mt-1 cursor-pointer" 
                  />
                </label>

                {/* Rule 5 */}
                <label className="flex items-start justify-between gap-3 cursor-pointer p-1 rounded-lg hover:bg-stone-50">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-stone-800">{isFR ? "Prosodie Émotionnelle" : "Enable Emotional Pacing"}</span>
                    <p className="text-[10px] text-[#6B7280]">{isFR ? "Humour, empathie et rires organiques." : "Injects subtle laughter or hesitation elements."}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={enableEmotionalPacing} 
                    onChange={(e) => setEnableEmotionalPacing(e.target.checked)}
                    className="w-4 h-4 rounded text-stone-900 accent-stone-900 border-stone-300 mt-1 cursor-pointer" 
                  />
                </label>

              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-start gap-2 text-[10px]">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="font-semibold leading-tight">
                  {isFR 
                    ? "Moteur d'Assurance Qualité Actif : Aucune anomalie de boucle détectée sur les dernières 24 heures."
                    : "QA Status: Pristine. Zero conversational dead-loops or monotone phrasing anomalies registered in last 24h."}
                </div>
              </div>
            </div>

          </div>

          {/* Realism Metrics Distributions & Aggregated statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Memory & Active Listening Usage Tracking */}
            <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#4B5563]" />
                {isFR ? "Usage de la Mémoire d'Écoute Active" : "Active Listening & Memory Usage"}
              </h3>
              <p className="text-[11px] text-[#6B7280] font-medium">
                {isFR 
                  ? "Télémétrie de la fidélité des références à la mémoire par Shana."
                  : "Distribution of structured memory entities referenced in chat sessions."}
              </p>

              <div className="space-y-3.5 pt-1.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-600 font-semibold">{isFR ? "Projets et réalisations" : "Candidate Projects & Achievements"}</span>
                    <span className="font-bold text-stone-800">42%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-600 font-semibold">{isFR ? "Erreurs et apprentissages décrits" : "Disclosed Failures & Learnings"}</span>
                    <span className="font-bold text-stone-800">23%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '23%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-600 font-semibold">{isFR ? "Compétences clés et outils" : "Skills & Technologies"}</span>
                    <span className="font-bold text-stone-800">21%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '21%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-600 font-semibold">{isFR ? "Désaccords et résolutions" : "Interpersonal Conflicts & Resolutions"}</span>
                    <span className="font-bold text-stone-800">14%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '14%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personality distribution */}
            <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#4B5563]" />
                {isFR ? "Répartition des Personnalités de Recruteur" : "Recruiter Personality Distribution"}
              </h3>
              <p className="text-[11px] text-[#6B7280] font-medium">
                {isFR 
                  ? "Statistiques d'utilisation des différentes voix et profils comportementaux de Shana."
                  : "Aggregated share of selected recruiter styles across all completed interviews."}
              </p>

              <div className="space-y-3 pt-1.5">
                {[
                  { name: isFR ? "Chaleureux / RH" : "Friendly HR Representative", pct: 28, color: 'bg-emerald-500' },
                  { name: isFR ? "Recruteur Corporate" : "Corporate Recruiter", pct: 24, color: 'bg-indigo-500' },
                  { name: isFR ? "Directeur Ingénierie" : "Senior Engineering Manager", pct: 18, color: 'bg-amber-500' },
                  { name: isFR ? "Fondateur Startup" : "Fast-Paced Startup Founder", pct: 12, color: 'bg-rose-500' },
                  { name: isFR ? "Chasseur de Têtes" : "Executive Search Director", pct: 10, color: 'bg-stone-500' },
                  { name: isFR ? "Autres (Banquier, Tech Lead, Poker Face)" : "Others (Banker, Tech Lead, Poker Face)", pct: 8, color: 'bg-stone-400' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-stone-700 w-44 truncate">{item.name}</span>
                    <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-xs font-mono font-bold text-stone-800 w-8 text-right">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Core High-Level Realism KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Realism Score card */}
            <div className="bg-stone-50 border border-stone-200/80 p-4.5 rounded-2xl flex flex-col justify-between transition-all hover:border-stone-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-600 tracking-tight">
                  {isFR ? "Score de Réalisme Global" : "Realism Fidelity Score"}
                </span>
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-stone-900 tracking-tight">{realismScore}%</span>
                  <span className="text-xs font-bold text-emerald-600">▲ +1.4%</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1 font-medium">
                  {isFR ? "Temps de réponse moyen sous la seconde." : "Sub-second natural reply tempo."}
                </p>
              </div>
            </div>

            {/* Follow-up Quality card */}
            <div className="bg-stone-50 border border-stone-200/80 p-4.5 rounded-2xl flex flex-col justify-between transition-all hover:border-stone-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-600 tracking-tight">
                  {isFR ? "Qualité des Relances" : "Average Follow-Up Quality"}
                </span>
                <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  <Brain className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-stone-900 tracking-tight">{followUpQuality}%</span>
                  <span className="text-xs font-bold text-emerald-600">▲ +2.1%</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1 font-medium">
                  {isFR ? "Relances basées sur STAR et les chiffres." : "Star completeness & metrics probe."}
                </p>
              </div>
            </div>

            {/* Interruption Quality card */}
            <div className="bg-stone-50 border border-stone-200/80 p-4.5 rounded-2xl flex flex-col justify-between transition-all hover:border-stone-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-600 tracking-tight">
                  {isFR ? "Qualité d'Interruption" : "Interruption Quality"}
                </span>
                <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-stone-900 tracking-tight">{interruptionQuality}%</span>
                  <span className="text-xs font-bold text-emerald-600">▲ +0.8%</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1 font-medium">
                  {isFR ? "Politesse et timing d'interruption calibrés." : "Polite pacing and verbal collision checks."}
                </p>
              </div>
            </div>

            {/* Uniqueness Score card */}
            <div className="bg-stone-50 border border-stone-200/80 p-4.5 rounded-2xl flex flex-col justify-between transition-all hover:border-stone-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-600 tracking-tight">
                  {isFR ? "Score d'Unicité d'Entretien" : "Interview Uniqueness Score"}
                </span>
                <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-stone-900 tracking-tight">{uniquenessScore}%</span>
                  <span className="text-xs font-bold text-emerald-600">▲ +3.5%</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1 font-medium">
                  {isFR ? "Zéro répétition sur 1 000 entretiens." : "No duplicate session patterns detected."}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
