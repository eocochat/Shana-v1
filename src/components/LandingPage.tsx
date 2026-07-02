import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Target, 
  Sparkles, 
  Brain, 
  ShieldCheck, 
  Star, 
  Volume2, 
  Mic, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  Check, 
  UserCheck, 
  ChevronRight, 
  Cpu, 
  AlertCircle,
  Play,
  Users,
  TrendingUp
} from 'lucide-react';

interface LandingPageProps {
  onStartOnboarding?: () => void;
  onStartLogin?: () => void;
  lang?: 'EN' | 'FR';
  onChangeLang?: (lang: 'EN' | 'FR') => void;
  onNavigatePage?: (page: string) => void;
}

export default function LandingPage({ 
  onStartOnboarding, 
  onStartLogin, 
  lang: controlledLang, 
  onChangeLang,
  onNavigatePage
}: LandingPageProps = {}) {
  // Local language state (with fallback)
  const [localLang, setLocalLang] = useState<'EN' | 'FR'>('FR');
  const lang = controlledLang || localLang;
  
  const setLang = (newLang: 'EN' | 'FR') => {
    if (onChangeLang) {
      onChangeLang(newLang);
    } else {
      setLocalLang(newLang);
    }
  };

  // State for Widget Action inputs
  const [targetRole, setTargetRole] = useState('');
  const [interviewType, setInterviewType] = useState<'RH' | 'TECH' | 'MOTIV' | 'ASSESSMENT'>('RH');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close dropdown and suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Preset job roles suggestions
  const popularRoles = {
    FR: [
      "Développeur Fullstack", 
      "Commercial B2B", 
      "Chef de Projet Digital", 
      "Product Manager", 
      "Responsable RH", 
      "Consultant Stratégie"
    ],
    EN: [
      "Fullstack Developer", 
      "B2B Sales Executive", 
      "Digital Project Manager", 
      "Product Manager", 
      "HR Business Partner", 
      "Management Consultant"
    ]
  };

  // Pre-fill selection
  const handleSelectRoleSuggestion = (role: string) => {
    setTargetRole(role);
    setShowSuggestions(false);
  };

  // Direct Submission - updates localStorage draft state & triggers onboarding
  const handleLaunchSimulation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Create prefill data for onboarding
    const finalRole = targetRole.trim() || (lang === 'FR' ? "Candidat" : "Candidate");
    
    // Save draft onboarding payload to match OnboardingFlow.tsx draft parser
    const savedDraft = localStorage.getItem('shana_draft_onboarding_flow_form');
    let draftObj: any = {};
    try {
      if (savedDraft) draftObj = JSON.parse(savedDraft);
    } catch (err) {}
    
    draftObj.targetRole = finalRole;
    draftObj.screen = 1; // Direct start on first step
    draftObj.lang = lang;
    
    localStorage.setItem('shana_draft_onboarding_flow_form', JSON.stringify(draftObj));
    sessionStorage.setItem('shana_prefilled_target_role', finalRole);
    sessionStorage.setItem('shana_prefilled_interview_type', interviewType);
    
    if (onStartOnboarding) {
      onStartOnboarding();
    }
  };

  // Select preset from Popular list below widget
  const handlePopularClick = (role: string) => {
    setTargetRole(role);
    // Smooth blink effect
    const inputEl = document.getElementById('target-role-input');
    if (inputEl) {
      inputEl.focus();
    }
  };

  // Dual language dictionary
  const dict = {
    FR: {
      brand: "Shana",
      navSim: "Simulation IA",
      navMeth: "Méthodologie",
      navAvis: "Avis Clients",
      navTarifs: "Tarifs",
      btnLogin: "Se connecter",
      btnStart: "Lancer mon entraînement",
      heroBadge: "🎯 L'INTELLIGENCE ARTIFICIELLE AU SERVICE DE VOTRE RÉUSSITE",
      heroHeadline: "Ne laissez plus un entretien ruiner votre carrière",
      heroSub: "Shana, votre coach IA, vous prépare en conditions réelles d'élocution et de stress pour décrocher le poste de vos rêves.",
      
      labelWhat: "Quel poste visez-vous ?",
      placeholderWhat: "ex: Développeur, Commercial, Chef de projet...",
      labelType: "Type d'entretien",
      typeRH: "Entretien RH & Culture",
      typeTech: "Test Technique & Code",
      typeMotiv: "Motivation & Fit",
      typeAssessment: "Assessment Center & Cas",
      btnLaunch: "Démarrer la simulation avec Shana 🚀",
      popSearches: "Préparations populaires :",
      
      catTitle: "Préparez-vous aux entretiens les plus redoutés",
      catSub: "Sélectionnez un format d'entraînement pour tester vos réflexes d'élocution face à Shana",
      scenarios: "scénarios d'entraînement",
      motivationName: "Questions Motivation",
      casName: "Cas Pratique",
      techName: "Test Technique",
      rhName: "Blind Test RH",
      
      methTitle: "Pourquoi s'entraîner avec Shana change la donne",
      methSub: "Une méthodologie scientifique combinant analyse du stress acoustique et questions comportementales.",
      meth1Title: "Feedback Instantané",
      meth1Desc: "Shana analyse la structure de votre discours en temps réel, évalue vos arguments clés et vous donne des correctifs constructifs immédiats.",
      meth2Title: "Analyse du Stress & de la Voix",
      meth2Desc: "Grâce à votre micro, notre IA mesure votre rythme d'élocution, vos micro-silences et traque vos tics verbaux (les 'euh...') pour vous forger une assurance à toute épreuve.",
      meth3Title: "Questions Sur-Mesure",
      meth3Desc: "Pas de questionnaire linéaire prévisible. Shana formule ses relances en direct en fonction de vos réponses précédentes, reproduisant fidèlement les recruteurs tenaces.",
      
      proofTitle: "Ils ont surmonté leurs peurs et ont décroché leur CDI",
      proofSub: "Découvrez les témoignages réels de candidats propulsés par notre simulateur vocal.",
      hiredAt: "Recruté chez",
      review1: "J'avais une peur panique des entretiens RH. M'entraîner 3 fois avec Shana m'a permis d'aborder mes échanges avec calme et d'obtenir deux propositions !",
      review2: "Le test technique interactif de Shana est redoutable. L'analyse des silences m'a montré exactement quand je perdais mes moyens.",
      review3: "Un outil indispensable pour structurer sa présentation. Shana m'a appris à couper mes phrases et à bannir les tics de langage.",
      
      footerCol1Title: "À propos de Shana",
      footerCol1Desc: "Shana combine le traitement de signal de pointe avec la psychologie de l'élocution pour aider les professionnels à libérer leur potentiel oral.",
      footerCol2Title: "Espace Candidats",
      footerCol3Title: "Espace Entreprises",
      footerCol4Title: "Mentions Légales",
      footerRights: "© 2026 Shana - Votre coach IA d'entretien. Tous droits réservés."
    },
    EN: {
      brand: "Shana",
      navSim: "AI Simulation",
      navMeth: "Methodology",
      navAvis: "Reviews",
      navTarifs: "Pricing",
      btnLogin: "Sign In",
      btnStart: "Start AI Training",
      heroBadge: "🎯 INTERACTIVE VOICE COACHING DRIVEN BY AI",
      heroHeadline: "Don't let a single interview ruin your career",
      heroSub: "Shana, your vocal AI coach, trains you under real-time acoustic stress conditions to unlock your dream job position.",
      
      labelWhat: "What job are you aiming for?",
      placeholderWhat: "e.g., Developer, Sales Executive, Project Manager...",
      labelType: "Interview Type",
      typeRH: "HR & Culture Interview",
      typeTech: "Technical Test & Code",
      typeMotiv: "Motivation & Fit",
      typeAssessment: "Assessment Center & Case",
      btnLaunch: "Start simulation with Shana 🚀",
      popSearches: "Popular prep paths:",
      
      catTitle: "Prepare for the most challenging interviews",
      catSub: "Select any training blueprint to test your speaking speed and vocal confidence",
      scenarios: "practice scenarios available",
      motivationName: "Motivation Questions",
      casName: "Business Cases",
      techName: "Technical Review",
      rhName: "HR Deep Screening",
      
      methTitle: "Why practicing with Shana is a game changer",
      methSub: "A scientific approach mapping behavioral analytics and voice stress metrics.",
      meth1Title: "Instant Expert Feedback",
      meth1Desc: "Shana dissects your spoken logic structure in real time, grades key industry answers, and highlights immediate steps for success.",
      meth2Title: "Voice & Speech Analysis",
      meth2Desc: "Using your mic, our AI measures speech rate, counts verbal fillers ('um', 'uh'), and helps you project authentic confidence.",
      meth3Title: "Tailored Dynamic Prompts",
      meth3Desc: "No boring static forms. Shana crafts custom follow-up questions live based on what you just said, replicating active interviewers.",
      
      proofTitle: "They mastered their anxiety and unlocked top-tier offers",
      proofSub: "Read real stories from candidates who trained with Shana's voice simulator.",
      hiredAt: "Hired at",
      review1: "I had terrible interview anxiety. Training with Shana three times gave me the structured calm I needed to secure two awesome offers!",
      review2: "Shana's interactive technical drill is amazing. The speech-rate tracking pointed out exactly when and why I was getting too nervous.",
      review3: "Essential tool to streamline pitches. Shana taught me how to pause constructively and eliminate distracting verbal fillers.",
      
      footerCol1Title: "About Shana",
      footerCol1Desc: "Shana merges state-of-the-art voice processing with speech psychology to empower candidates around the world.",
      footerCol2Title: "Candidate Hub",
      footerCol3Title: "Enterprise Space",
      footerCol4Title: "Legal & Terms",
      footerRights: "© 2026 Shana - Your AI Interview Coach. All rights reserved."
    }
  };

  const t = dict[lang];

  // Map category selection to dropdown state and pre-select
  const handleCategoryClick = (type: 'RH' | 'TECH' | 'MOTIV' | 'ASSESSMENT') => {
    setInterviewType(type);
    const widgetEl = document.getElementById('search-action-widget');
    if (widgetEl) {
      widgetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div id="shana-landing-root" className="min-h-screen bg-[#FAF7F2] text-stone-950 font-sans selection:bg-stone-950 selection:text-white relative z-10 antialiased overflow-x-hidden">
      
      {/* =========================================
          HEADER (Navbar)
         ========================================= */}
      <header id="shana-navbar" className="sticky top-0 z-40 bg-[#EDC154] border-b-2 border-stone-950 shadow-[0px_3px_0px_0px_rgba(17,17,17,1)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2">
          
          {/* Logo at Left */}
          <div 
            id="shana-brand-logo" 
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-xl bg-stone-950 flex items-center justify-center border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] group-hover:scale-105 transition-all shrink-0">
              <span className="font-sans font-black text-xl text-[#EDC154]">S</span>
            </div>
            <div className="flex items-center font-sans font-black text-xl sm:text-2xl tracking-tight text-stone-950 uppercase">
              <span>{t.brand}</span>
              <span className="text-stone-950 font-black text-2xl sm:text-3xl leading-none ml-0.5">.</span>
              <Mic className="inline w-4.5 h-4.5 text-stone-950 ml-1.5 shrink-0" />
            </div>
          </div>

          {/* Center Navigation Menu */}
          <nav id="navbar-links" className="hidden lg:flex items-center gap-8 font-sans font-black text-stone-950 uppercase text-xs tracking-wider">
            <a href="#categories-section" className="hover:underline transition-all">{t.navSim}</a>
            <a href="#methodology-section" className="hover:underline transition-all">{t.navMeth}</a>
            <a href="#social-proof-section" className="hover:underline transition-all">{t.navAvis}</a>
            <a 
              href="#footer-section" 
              onClick={(e) => {
                e.preventDefault();
                if (onNavigatePage) onNavigatePage('pricing');
              }}
              className="hover:underline transition-all"
            >
              {t.navTarifs}
            </a>
          </nav>

          {/* Right Actions Block */}
          <div id="navbar-actions" className="flex items-center gap-3 sm:gap-5 shrink-0">
            {/* Language Selector Capsule */}
            <div className="flex bg-white p-1 rounded-full border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] shrink-0">
              <button
                onClick={() => setLang('EN')}
                className={`px-3 py-1 text-[10px] sm:text-xs font-sans font-black rounded-full transition-all cursor-pointer ${
                  lang === 'EN' ? 'bg-stone-950 text-white' : 'text-stone-500 hover:text-stone-950'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('FR')}
                className={`px-3 py-1 text-[10px] sm:text-xs font-sans font-black rounded-full transition-all cursor-pointer ${
                  lang === 'FR' ? 'bg-stone-950 text-white' : 'text-stone-500 hover:text-stone-950'
                }`}
              >
                FR
              </button>
            </div>

            {/* Connection text simple */}
            <button
              onClick={() => onStartLogin && onStartLogin()}
              className="text-[10px] sm:text-xs font-sans font-black text-stone-950 hover:underline cursor-pointer shrink-0 uppercase tracking-wide"
            >
              <span>{t.btnLogin}</span>
            </button>
            
            {/* Outline Button -> Black pill button */}
            <button
              onClick={() => onStartOnboarding && onStartOnboarding()}
              className="px-4 py-2 sm:px-5 sm:py-3 bg-stone-950 hover:bg-stone-850 text-white border-2 border-stone-950 font-sans font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(237,193,84,0.4)] shrink-0 whitespace-nowrap"
            >
              {lang === 'FR' ? "Lancer mon entretien" : "Start my interview"}
            </button>
          </div>

        </div>
      </header>

      {/* =========================================
          UPGRADED HERO SECTION (Mockup Premium Layout)
         ========================================= */}
      <section id="hero-section" className="relative py-12 lg:py-20 overflow-hidden bg-white border-b-4 border-stone-950">
        
        {/* Subtle grid pattern & artistic yellow background paths */}
        <div className="absolute inset-0 bg-[radial-gradient(#111111_1px,transparent_1px)] [background-size:32px_32px] opacity-3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Core Headlines & Actions */}
            <div className="lg:col-span-6 space-y-6 md:space-y-8 text-left">
              
              {/* Google AI Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FFFDEE] border border-[#F3CD76] rounded-full text-[10px] md:text-[11px] font-sans font-extrabold text-stone-800 uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(17,17,17,0.1)]">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>{lang === 'FR' ? "L'intelligence artificielle au service de votre réussite" : "AI at the service of your career success"}</span>
              </div>

              {/* Big Punchy Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-[54px] font-sans font-black tracking-tight text-stone-950 uppercase leading-[1.12] max-w-xl">
                {lang === 'FR' ? (
                  <>
                    Ne laissez plus un entretien <span className="bg-[#EDC154] border-2 border-stone-950 px-4 py-1 rounded-2xl shadow-[4px_4px_0px_0px_#111111] inline-block rotate-[-1.5deg] mx-1 text-stone-950">ruiner</span> votre carrière
                  </>
                ) : (
                  <>
                    Don't let a single interview <span className="bg-[#EDC154] border-2 border-stone-950 px-4 py-1 rounded-2xl shadow-[4px_4px_0px_0px_#111111] inline-block rotate-[-1.5deg] mx-1 text-stone-950">ruin</span> your career
                  </>
                )}
              </h1>

              {/* Description Paragraph */}
              <p className="text-sm sm:text-base text-stone-600 font-bold max-w-xl leading-relaxed">
                {t.heroSub}
              </p>

              {/* Buttons and CTAs Group */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pt-2">
                
                {/* Yellow Rounded CTA */}
                <button
                  onClick={() => onStartOnboarding && onStartOnboarding()}
                  className="px-8 py-4 bg-[#EDC154] hover:bg-[#F3C966] text-stone-950 font-sans font-black text-xs uppercase tracking-widest rounded-full border-2 border-stone-950 shadow-[3.5px_3.5px_0px_0px_#111111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_0px_#111111] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <span>{lang === 'FR' ? "Démarrer la simulation" : "Start the simulation"}</span>
                  <span className="font-sans font-black text-sm">➔</span>
                </button>

                {/* Play Button video trigger link */}
                <button
                  onClick={() => {
                    const el = document.getElementById('methodology-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group flex items-center gap-3 font-sans font-black text-xs uppercase tracking-widest text-stone-950 hover:text-[#18633F] transition-colors cursor-pointer shrink-0"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-stone-950 bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#111111] group-hover:bg-[#FFFDEE] transition-all">
                    <Play className="w-3.5 h-3.5 text-stone-950 fill-current translate-x-[1px]" />
                  </div>
                  <span>{lang === 'FR' ? "Voir comment ça marche" : "See how it works"}</span>
                </button>

              </div>

              {/* Trust Indicators and Avatars */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-stone-100">
                {/* Overlapping candidate faces */}
                <div className="flex -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80"
                  ].map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Candidate face icon"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>

                {/* Rating & text */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <p className="text-[10px] md:text-[11px] text-stone-500 font-sans font-bold leading-tight">
                    <span className="text-stone-950 font-black">{lang === 'FR' ? "Rejoint par +50 000 candidats" : "Joined by +50,000 candidates"}</span>
                    <br />
                    {lang === 'FR' ? "qui ont amélioré leurs performances" : "who have boosted their performance"}
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column: Beautiful High-Fidelity Mockup Visual */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[380px] lg:min-h-[440px]">
              
              {/* Background curvy wave lines in yellow */}
              <svg className="absolute -inset-10 w-[120%] h-[120%] pointer-events-none select-none overflow-visible opacity-80 z-0" viewBox="0 0 500 400" fill="none">
                <path d="M 60 260 C 130 110, 240 40, 400 130 C 470 170, 450 310, 350 340 C 270 360, 200 310, 240 210" stroke="#EDC154" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 0" />
                <circle cx="400" cy="130" r="3.5" fill="#EDC154" />
                <circle cx="350" cy="340" r="4" fill="#EDC154" />
                <circle cx="240" cy="210" r="3" fill="#EDC154" />
              </svg>

              {/* Dotted yellow decorative grid */}
              <div className="absolute top-2 left-1/3 w-20 h-16 bg-[radial-gradient(#EDC154_2px,transparent_2px)] [background-size:12px_12px] opacity-40 z-0 pointer-events-none" />

              {/* Main Cutout Container of the Candidate Portrait with Silver Laptop */}
              <div className="relative w-[85%] max-w-[390px] aspect-[1/1] rounded-[48px] bg-stone-100 border-[3px] border-stone-950 overflow-hidden shadow-[10px_10px_0px_0px_#111111] z-10 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_#111111] transition-all duration-300">
                <img
                  src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=650&auto=format&fit=crop"
                  alt="Smiling professional on laptop"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top filter saturate-[1.02] contrast-[1.01]"
                />

                {/* Floating "S" brand sticker on the silver laptop back! */}
                <div className="absolute bottom-[24%] left-[54%] w-8 h-8 rounded-full bg-[#111111] border-2 border-stone-850 flex items-center justify-center shadow-lg transform rotate-[-8deg] hover:scale-110 transition-all z-20 select-none">
                  <span className="font-sans font-black text-xs text-[#EDC154]">S</span>
                </div>
              </div>

              {/* FLOATING CARD 1: Real-time feedback (Left-Center) */}
              <div className="absolute left-[-2%] top-[40%] sm:left-[2%] md:left-[-5%] lg:left-[-4%] z-20 transform -translate-y-1/2 hover:scale-105 transition-all duration-300">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border-2 border-stone-950 shadow-[5px_5px_0px_0px_#111111] flex items-center gap-3 max-w-[215px] text-left">
                  <div className="w-10 h-10 bg-[#EDC154] border-2 border-stone-950 rounded-xl flex items-center justify-center text-stone-950 shrink-0 shadow-[2px_2px_0px_0px_#111111]">
                    <UserCheck className="w-5 h-5 text-stone-950" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-sans font-black text-[10px] md:text-[11px] uppercase tracking-wider text-stone-950 leading-tight">
                      {lang === 'FR' ? "Feedback en temps réel" : "Real-time Feedback"}
                    </h4>
                    <p className="text-[9px] md:text-[10px] text-stone-600 font-bold leading-tight">
                      {lang === 'FR' ? "Améliorez vos réponses instantanément." : "Improve your responses instantly."}
                    </p>
                  </div>
                </div>
              </div>

              {/* FLOATING CARD 2: AI Preparation Score Ring (Top-Right) */}
              <div className="absolute right-[2%] top-[10%] sm:right-[5%] lg:right-[-2%] z-20 hover:scale-105 transition-all duration-300">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border-2 border-stone-950 shadow-[5px_5px_0px_0px_#111111] min-w-[150px] sm:min-w-[165px] space-y-2 text-left">
                  <h4 className="font-mono font-black text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-wider">
                    {lang === 'FR' ? "Préparation IA" : "AI Preparation"}
                  </h4>
                  <div className="flex items-center gap-3">
                    {/* SVG circular progress ring */}
                    <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="3"
                          strokeDasharray="100"
                          strokeDashoffset="22"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute font-sans font-black text-[10px] text-stone-950">78%</span>
                    </div>
                    <div className="leading-tight">
                      <p className="text-[8px] sm:text-[9px] text-stone-400 font-bold leading-none">
                        {lang === 'FR' ? "Niveau de préparation" : "Readiness Level"}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-emerald-600 font-sans font-black tracking-wide uppercase leading-none mt-1">
                        {lang === 'FR' ? "En progression" : "In Progress"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FLOATING CARD 3: Overall Progress Chart spline (Bottom-Right) */}
              <div className="absolute right-[-4%] bottom-[12%] sm:right-[1%] lg:right-[-4%] z-20 hover:scale-105 transition-all duration-300">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border-2 border-stone-950 shadow-[5px_5px_0px_0px_#111111] min-w-[165px] sm:min-w-[185px] space-y-1 text-left">
                  <h4 className="font-mono font-black text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-wider leading-none">
                    {lang === 'FR' ? "Progression globale" : "Global Progress"}
                  </h4>
                  <p className="text-[9px] sm:text-[10px] font-sans font-bold text-emerald-600 leading-none">
                    {lang === 'FR' ? "+24% cette semaine" : "+24% this week"}
                  </p>
                  
                  {/* Spline line graph chart */}
                  <svg className="w-full h-8 mt-1.5 overflow-visible" viewBox="0 0 100 30" fill="none">
                    <defs>
                      <linearGradient id="hero-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EDC154" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#EDC154" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 24 Q 22 27, 36 15 T 72 18 T 100 5" stroke="#EDC154" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 0 24 Q 22 27, 36 15 T 72 18 T 100 5 L 100 30 L 0 30 Z" fill="url(#hero-chart-gradient)" />
                    <circle cx="100" cy="5" r="3" fill="#EDC154" stroke="#111111" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

            </div>

          </div>

          {/* =========================================
              TRUST BRANDS SECTION ("Ils nous font confiance")
             ========================================= */}
          <div className="pt-16 pb-4 border-t border-stone-100">
            <p className="text-center text-[10px] md:text-xs font-sans font-black text-stone-400 uppercase tracking-[0.2em] mb-8">
              {lang === 'FR' ? "Ils nous font confiance" : "They trust our coaching"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
              
              {/* Google */}
              <div className="font-sans font-black text-stone-500 text-lg tracking-tighter select-none">
                Google
              </div>

              {/* Microsoft */}
              <div className="flex items-center gap-1.5 font-sans font-semibold text-stone-500 text-sm select-none">
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                  <div className="bg-stone-500 w-1.5 h-1.5" />
                  <div className="bg-stone-500 w-1.5 h-1.5" />
                  <div className="bg-stone-500 w-1.5 h-1.5" />
                  <div className="bg-stone-500 w-1.5 h-1.5" />
                </div>
                <span>Microsoft</span>
              </div>

              {/* Airbnb */}
              <div className="font-sans font-extrabold text-stone-500 text-sm tracking-tight select-none flex items-center gap-1">
                <span>airbnb</span>
              </div>

              {/* Deloitte */}
              <div className="font-sans font-black text-stone-500 text-sm tracking-wide select-none">
                Deloitte<span className="text-[#10B981] font-black">.</span>
              </div>

              {/* Amazon */}
              <div className="flex flex-col items-center select-none relative -top-1">
                <span className="font-sans font-black text-stone-500 text-sm tracking-tight leading-none">amazon</span>
                <svg className="w-10 h-1.5 text-stone-500" viewBox="0 0 100 15" fill="none">
                  <path d="M10 2 Q 50 15, 90 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Bpifrance */}
              <div className="font-sans font-bold text-stone-500 text-xs tracking-wide select-none">
                bpi<span className="font-black text-stone-500">france</span>
              </div>

              {/* L'Oreal */}
              <div className="font-sans font-medium text-stone-500 text-xs tracking-[0.25em] select-none">
                L'ORÉAL
              </div>

              {/* BNP Paribas */}
              <div className="flex items-center gap-1.5 font-sans font-black text-stone-500 text-xs tracking-wide select-none">
                <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2 L22 12 L12 22 L2 12 Z" />
                </svg>
                <span>BNP PARIBAS</span>
              </div>

            </div>
          </div>

          {/* =========================================
              FLOATING STATS / PILL METRICS BAR
             ========================================= */}
          <div className="mt-12 max-w-5xl mx-auto">
            <div className="bg-white rounded-[32px] p-6 border-[2.5px] border-stone-950 shadow-[5px_5px_0px_0px_#111111] grid grid-cols-2 md:grid-cols-5 gap-6 divide-y-2 md:divide-y-0 md:divide-x-2 divide-stone-100 items-center justify-center">
              
              {/* Stat 1: Candidates */}
              <div className="flex items-center gap-3 text-left pl-0 md:pl-2">
                <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center border-2 border-stone-950 shrink-0 shadow-[1.5px_1.5px_0px_0px_#111111]">
                  <Users className="w-4.5 h-4.5 text-stone-950" />
                </div>
                <div>
                  <h4 className="font-sans font-black text-base sm:text-lg text-stone-950 leading-none">50 000+</h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 font-sans font-bold leading-none mt-1">
                    {lang === 'FR' ? "Candidats accompagnés" : "Candidates coached"}
                  </p>
                </div>
              </div>

              {/* Stat 2: Simulations */}
              <div className="flex items-center gap-3 text-left pt-4 md:pt-0 pl-0 md:pl-6">
                <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center border-2 border-stone-950 shrink-0 shadow-[1.5px_1.5px_0px_0px_#111111]">
                  <Target className="w-4.5 h-4.5 text-stone-950" />
                </div>
                <div>
                  <h4 className="font-sans font-black text-base sm:text-lg text-stone-950 leading-none">1M+</h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 font-sans font-bold leading-none mt-1">
                    {lang === 'FR' ? "Entretiens simulés" : "Simulations run"}
                  </p>
                </div>
              </div>

              {/* Stat 3: Success rate */}
              <div className="flex items-center gap-3 text-left pt-4 md:pt-0 pl-0 md:pl-6">
                <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center border-2 border-stone-950 shrink-0 shadow-[1.5px_1.5px_0px_0px_#111111]">
                  <TrendingUp className="w-4.5 h-4.5 text-stone-950" />
                </div>
                <div>
                  <h4 className="font-sans font-black text-base sm:text-lg text-stone-950 leading-none">82%</h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 font-sans font-bold leading-none mt-1">
                    {lang === 'FR' ? "Taux de réussite amélioré" : "Higher success rate"}
                  </p>
                </div>
              </div>

              {/* Stat 4: Rating */}
              <div className="flex items-center gap-3 text-left pt-4 md:pt-0 pl-0 md:pl-6">
                <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center border-2 border-stone-950 shrink-0 shadow-[1.5px_1.5px_0px_0px_#111111]">
                  <Star className="w-4.5 h-4.5 text-amber-500 fill-current" />
                </div>
                <div>
                  <h4 className="font-sans font-black text-base sm:text-lg text-stone-950 leading-none">4.9/5</h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 font-sans font-bold leading-none mt-1">
                    {lang === 'FR' ? "Note moyenne" : "Average score rating"}
                  </p>
                </div>
              </div>

              {/* Stat 5: Security */}
              <div className="flex items-center gap-3 text-left pt-4 md:pt-0 pl-0 md:pl-6 col-span-2 md:col-span-1">
                <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center border-2 border-stone-950 shrink-0 shadow-[1.5px_1.5px_0px_0px_#111111]">
                  <ShieldCheck className="w-4.5 h-4.5 text-stone-950" />
                </div>
                <div>
                  <h4 className="font-sans font-black text-xs sm:text-sm text-stone-950 leading-tight">
                    {lang === 'FR' ? "Données sécurisées" : "Secured Data"}
                  </h4>
                  <p className="text-[9px] sm:text-[10px] text-stone-400 font-sans font-bold leading-tight mt-0.5">
                    {lang === 'FR' ? "Confidentialité garantie" : "Guaranteed privacy"}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================
          SECTION CATEGORIES (HelloWork activity sectors style)
         ========================================= */}
      <section id="categories-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b-4 border-stone-950 bg-stone-50">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-stone-950 uppercase">
            {t.catTitle}
          </h2>
          <p className="text-stone-700 text-sm font-bold max-w-xl mx-auto">
            {t.catSub}
          </p>
        </div>

        {/* 4 Cards Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {[
            { 
              id: 'MOTIV', 
              name: t.motivationName, 
              emoji: '🧠', 
              count: '+200'
            },
            { 
              id: 'TECH', 
              name: t.techName, 
              emoji: '💻', 
              count: '+150'
            },
            { 
              id: 'RH', 
              name: t.rhName, 
              emoji: '💬', 
              count: '+185'
            },
            { 
              id: 'ASSESSMENT', 
              name: t.casName, 
              emoji: '📊', 
              count: '+120'
            }
          ].map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id as any)}
              className={`p-6 bg-white rounded-2xl border-2 border-stone-950 transition-all cursor-pointer flex flex-col items-center text-center space-y-4 relative group hover:translate-x-[-1px] hover:translate-y-[-1px] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)]`}
            >
              {/* Neo-brutalist emoji container */}
              <div className="w-14 h-14 bg-[#EDC154]/20 border-2 border-stone-950 rounded-xl flex items-center justify-center text-3xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] transition-all duration-300 group-hover:scale-105">
                <span>{cat.emoji}</span>
              </div>

              {/* Title & Stats info */}
              <div className="space-y-1">
                <h3 className="font-sans font-black text-xs sm:text-sm text-stone-950 uppercase tracking-wide leading-snug">
                  {cat.name}
                </h3>
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  {cat.count} {t.scenarios}
                </p>
              </div>

              {/* Selection Indicator check badge */}
              {interviewType === cat.id && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#EDC154] border-2 border-stone-950 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                  <Check className="w-3 h-3 text-stone-950 stroke-[3.5px]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================
          SECTION METHODOLOGY (Comment ça marche)
         ========================================= */}
      <section id="methodology-section" className="py-24 bg-white border-b-4 border-stone-950 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs font-black uppercase tracking-widest text-stone-950 bg-[#EDC154] border-2 border-stone-950 px-3.5 py-1.5 rounded-md inline-block shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
              {lang === 'FR' ? "COACHING SCIENTIFIQUE" : "SCIENTIFIC COACHING"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-sans font-black text-stone-950 tracking-tight leading-tight uppercase">
              {t.methTitle}
            </h2>
            <p className="text-stone-700 text-sm sm:text-base font-bold max-w-xl mx-auto leading-relaxed">
              {t.methSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Block 1: Feedback Instantané */}
            <div className="p-8 bg-[#FAF7F2] rounded-3xl border-2 border-stone-950 flex flex-col justify-between space-y-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] transition-all text-left">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white text-stone-950 border-2 border-stone-950 rounded-xl flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  💬
                </div>
                <h3 className="font-sans font-black text-lg text-stone-950 uppercase">{t.meth1Title}</h3>
                <p className="text-xs.5 text-stone-600 leading-relaxed font-bold">{t.meth1Desc}</p>
              </div>
              <div className="pt-2 border-t-2 border-stone-950">
                <span className="text-[10px] font-mono font-black text-stone-950 uppercase tracking-wider block">ANALYSEUR LEXICAL V1.4</span>
              </div>
            </div>

            {/* Block 2: Analyse du Stress & Voix */}
            <div className="p-8 bg-[#FAF7F2] rounded-3xl border-2 border-stone-950 flex flex-col justify-between space-y-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] transition-all text-left">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white text-stone-950 border-2 border-stone-950 rounded-xl flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  🎙️
                </div>
                <h3 className="font-sans font-black text-lg text-stone-950 uppercase">{t.meth2Title}</h3>
                <p className="text-xs.5 text-stone-600 leading-relaxed font-bold">{t.meth2Desc}</p>
              </div>
              <div className="pt-2 border-t-2 border-stone-950">
                <span className="text-[10px] font-mono font-black text-stone-950 uppercase tracking-wider block">TRAITEMENT ACOUSTIQUE EN DIRECT</span>
              </div>
            </div>

            {/* Block 3: Questions Sur-Mesure */}
            <div className="p-8 bg-[#FAF7F2] rounded-3xl border-2 border-stone-950 flex flex-col justify-between space-y-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] transition-all text-left">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white text-stone-950 border-2 border-stone-950 rounded-xl flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  🧠
                </div>
                <h3 className="font-sans font-black text-lg text-stone-950 uppercase">{t.meth3Title}</h3>
                <p className="text-xs.5 text-stone-600 leading-relaxed font-bold">{t.meth3Desc}</p>
              </div>
              <div className="pt-2 border-t-2 border-stone-950">
                <span className="text-[10px] font-mono font-black text-stone-950 uppercase tracking-wider block">RÉPONSES ADAPTATIVES GEMINI API</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================
          SECTION SOCIAL PROOF (Témoignages Clients)
         ========================================= */}
      <section id="social-proof-section" className="py-24 bg-stone-50 border-b-4 border-stone-950 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
            <span className="font-mono text-xs font-black uppercase tracking-widest text-stone-950 bg-[#EDC154] border-2 border-stone-950 px-3.5 py-1.5 rounded-md inline-block shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
              {lang === 'FR' ? "SUCCÈS DE NOS CANDIDATS" : "CANDIDATE SUCCESS"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-sans font-black text-stone-950 tracking-tight leading-tight uppercase">
              {t.proofTitle}
            </h2>
            <p className="text-stone-700 text-sm font-bold">
              {t.proofSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Témoignage 1 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-stone-950 flex flex-col justify-between space-y-6 text-left shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] transition-all">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                </div>
                <p className="text-xs.5 text-stone-700 font-bold leading-relaxed italic">
                  "{t.review1}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t-2 border-stone-950">
                <div className="w-10 h-10 rounded-full bg-[#EDC154]/30 border-2 border-stone-950 flex items-center justify-center text-sm.5 font-black text-stone-950">
                  AL
                </div>
                <div>
                  <h4 className="text-xs font-black text-stone-950 uppercase">{lang === 'FR' ? "Aurélie Laurent" : "Aurelie Laurent"}</h4>
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    {t.hiredAt} <span className="text-stone-950 font-black underline">Decathlon</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Témoignage 2 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-stone-950 flex flex-col justify-between space-y-6 text-left shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] transition-all">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                </div>
                <p className="text-xs.5 text-stone-700 font-bold leading-relaxed italic">
                  "{t.review2}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t-2 border-stone-950">
                <div className="w-10 h-10 rounded-full bg-[#EDC154]/30 border-2 border-stone-950 flex items-center justify-center text-sm.5 font-black text-stone-950">
                  MD
                </div>
                <div>
                  <h4 className="text-xs font-black text-stone-950 uppercase">Maxime Dubois</h4>
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    {t.hiredAt} <span className="text-stone-950 font-black underline">Criteo</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Témoignage 3 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-stone-950 flex flex-col justify-between space-y-6 text-left shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] transition-all">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                  <Star className="w-4 h-4 fill-current animate-pulse" />
                </div>
                <p className="text-xs.5 text-stone-700 font-bold leading-relaxed italic">
                  "{t.review3}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t-2 border-stone-950">
                <div className="w-10 h-10 rounded-full bg-[#EDC154]/30 border-2 border-stone-950 flex items-center justify-center text-sm.5 font-black text-stone-950">
                  KC
                </div>
                <div>
                  <h4 className="text-xs font-black text-stone-950 uppercase">Karim Chebili</h4>
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    {t.hiredAt} <span className="text-stone-950 font-black underline">Capgemini</span>
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================
          FOOTER (Vibrant violet background)
         ========================================= */}
      <footer id="footer-section" className="bg-stone-950 text-stone-200 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800 text-left">
            
            {/* Column 1: Brand & Desc */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="w-9 h-9 rounded-xl bg-[#EDC154] text-stone-950 p-0.5 flex items-center justify-center font-sans font-black text-xl border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                  S
                </div>
                <span className="font-sans font-black tracking-tight text-white text-xl uppercase">{t.brand}</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed font-bold">
                {t.footerCol1Desc}
              </p>
            </div>

            {/* Column 2: Candidates */}
            <div className="space-y-4">
              <h4 className="font-sans font-black text-sm text-white uppercase tracking-wider">{t.footerCol2Title}</h4>
              <ul className="space-y-2.5 text-xs text-stone-400 font-bold uppercase tracking-wide">
                <li><button onClick={() => onStartOnboarding && onStartOnboarding()} className="hover:text-white hover:underline transition-colors cursor-pointer text-left">{lang === 'FR' ? "Lancer une simulation" : "Start a simulation"}</button></li>
                <li><button onClick={() => onStartOnboarding && onStartOnboarding()} className="hover:text-white hover:underline transition-colors cursor-pointer text-left">{lang === 'FR' ? "Diagnostic Micro & Cam" : "Check Mic & Webcam"}</button></li>
                <li><a href="#methodology-section" className="hover:text-white hover:underline transition-colors">{lang === 'FR' ? "Méthodologie vocale" : "Vocal methodology"}</a></li>
              </ul>
            </div>

            {/* Column 3: Enterprise */}
            <div className="space-y-4">
              <h4 className="font-sans font-black text-sm text-white uppercase tracking-wider">{t.footerCol3Title}</h4>
              <ul className="space-y-2.5 text-xs text-stone-400 font-bold uppercase tracking-wide">
                <li><a href="#footer-section" onClick={(e) => { e.preventDefault(); if (onNavigatePage) onNavigatePage('pricing'); }} className="hover:text-white hover:underline transition-colors">{lang === 'FR' ? "Abonnements Pro" : "Pro Subscriptions"}</a></li>
                <li><a href="#footer-section" onClick={(e) => { e.preventDefault(); if (onNavigatePage) onNavigatePage('how-it-works'); }} className="hover:text-white hover:underline transition-colors">{lang === 'FR' ? "Intégration Recruteur" : "Recruiter API Integration"}</a></li>
              </ul>
            </div>

            {/* Column 4: Legals */}
            <div className="space-y-4">
              <h4 className="font-sans font-black text-sm text-white uppercase tracking-wider">{t.footerCol4Title}</h4>
              <ul className="space-y-2.5 text-xs text-stone-400 font-bold uppercase tracking-wide">
                <li><a href="#footer-section" onClick={(e) => { e.preventDefault(); if (onNavigatePage) onNavigatePage('terms'); }} className="hover:text-white hover:underline transition-colors">{lang === 'FR' ? "Conditions Générales" : "Terms & Conditions"}</a></li>
                <li><a href="#footer-section" onClick={(e) => { e.preventDefault(); if (onNavigatePage) onNavigatePage('privacy'); }} className="hover:text-white hover:underline transition-colors">{lang === 'FR' ? "Politique de Confidentialité" : "Privacy Policy"}</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright Information */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-xs text-stone-500 font-bold uppercase tracking-wider">
            <p>{t.footerRights}</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
