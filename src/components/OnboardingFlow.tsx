import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getBrowserLanguage } from '../utils';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Volume2, 
  Briefcase, 
  Target, 
  ChevronRight,
  ShieldCheck,
  Star,
  GraduationCap,
  Sparkle,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { StorageService } from '../lib/storage';

interface OnboardingFlowProps {
  onBackToLanding: () => void;
  onComplete: (profile: { firstName: string; lastName: string; targetRole: string; lang: 'EN' | 'FR' }) => void;
}

export default function OnboardingFlow({ onBackToLanding, onComplete }: OnboardingFlowProps) {
  // Screen sequence: 1 (Welcome), 2 (Position), 3 (Experience), 4 (Goals), 5 (Profile Form), 6 (Checklist), 7 (Final Welcome)
  const [screen, setScreen] = useState<number>(1);
  const [lang, setLang] = useState<'EN' | 'FR'>(getBrowserLanguage);
  
  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  // Controls
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Submission final flow
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeChecklistIndex, setActiveChecklistIndex] = useState(0);
  const [showFinalWelcome, setShowFinalWelcome] = useState(false);

  // Field touch trackers for live validation markers
  const [touchedFields, setTouchedFields] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    targetRole: false
  });

  // Load auto-saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('shana_draft_onboarding_flow_form');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.targetRole) setTargetRole(parsed.targetRole);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.password) setPassword(parsed.password);
        if (parsed.lang) setLang(parsed.lang);
        if (parsed.screen) {
          // If the draft was completed or on checklist/welcome, default back to safe step
          if (parsed.screen > 5) {
            setScreen(5);
          } else {
            setScreen(parsed.screen);
          }
        }
        if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
        if (parsed.selectedGoals) setSelectedGoals(parsed.selectedGoals);
      }
    } catch (e) {
      console.warn("Failed to load onboarding flow form draft", e);
    }
  }, []);

  // Save draft whenever values change
  useEffect(() => {
    try {
      if (firstName || lastName || targetRole || email || screen > 1) {
        localStorage.setItem('shana_draft_onboarding_flow_form', JSON.stringify({
          firstName,
          lastName,
          targetRole,
          email,
          password,
          lang,
          screen,
          experienceLevel,
          selectedGoals
        }));
      }
    } catch (e) {
      console.warn("Failed to save onboarding flow form draft", e);
    }
  }, [firstName, lastName, targetRole, email, password, lang, screen, experienceLevel, selectedGoals]);

  // Checklist sequence timer (lasts ~2.5 seconds, then auto-transitions to screen 7)
  useEffect(() => {
    if (isCompleted) {
      setActiveChecklistIndex(0);
      const interval = setInterval(() => {
        setActiveChecklistIndex(prev => {
          if (prev < 4) {
            return prev + 1;
          } else {
            clearInterval(interval);
            setTimeout(() => {
              setShowFinalWelcome(true);
            }, 600);
            return prev;
          }
        });
      }, 550);
      return () => clearInterval(interval);
    }
  }, [isCompleted]);

  // Live validators
  const validators = {
    firstName: firstName.trim().length > 0,
    lastName: lastName.trim().length > 0,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    password: password.length >= 6,
    targetRole: targetRole.trim().length > 0
  };

  // Translations Dictionary matching the high-end vision
  const dict = {
    EN: {
      screen1: {
        greeting: "Hi.",
        intro: "I'm SHANA.",
        headline: "Let's prepare your next interview.",
        sub: "A highly customized, conversational AI coaching experience designed to build genuine speaking muscle memory.",
        btnStart: "Start"
      },
      screen2: {
        headline: "What position are you preparing for?",
        placeholder: "e.g., Senior Software Engineer",
        popular: "Popular Prep Targets",
        feedback: "Perfect. I'll adapt every interview to this position."
      },
      screen3: {
        headline: "What is your seniority level?",
        feedback: "Great. I'll adjust the interview difficulty.",
        levels: [
          { key: "student", label: "Student / Graduate", desc: "Exploring first internships or graduate programs." },
          { key: "junior", label: "Junior", desc: "1–2 years of experience. Developing core execution." },
          { key: "intermediate", label: "Intermediate", desc: "3–5 years of experience. Scaling autonomous impact." },
          { key: "senior", label: "Senior", desc: "6+ years of experience. Leading projects, code or strategy." }
        ]
      },
      screen4: {
        headline: "What are your primary goals?",
        desc: "Select one or more targets to optimize your feedback profile.",
        goals: [
          { key: "get_hired", label: "Get Hired", desc: "Ace the pipeline & secure offer", icon: "💼" },
          { key: "confidence", label: "Confidence", desc: "Master voice stress & pacing", icon: "🧠" },
          { key: "speaking", label: "Practice Speaking", desc: "Eradicate filler words and stutters", icon: "🎙️" },
          { key: "leadership", label: "Leadership Play", desc: "Structure high-level vision & fit", icon: "🚀" },
          { key: "behavioral", label: "Behavioral Fits", desc: "Perfect STAR response formats", icon: "💬" },
          { key: "technical", label: "Technical Drills", desc: "Solve technical and design cases", icon: "💻" }
        ]
      },
      screen5: {
        headline: "Before we begin",
        sub: "Create your profile to personalize your preparation.",
        firstNameLabel: "First Name",
        lastNameLabel: "Last Name",
        emailLabel: "Email Address",
        passwordLabel: "Password (6+ chars)",
        cta: "Create Account",
        errorRequire: "All fields are strictly required.",
        errorPassword: "Security check: Password must be at least 6 characters."
      },
      screen6: {
        steps: [
          "Creating your profile",
          "Preparing your interview coach",
          "Personalizing questions",
          "Building your learning plan",
          "Ready"
        ]
      },
      screen7: {
        welcome: "Welcome,",
        subtitle: "Your AI interview coach is ready.",
        objective: "Today's objective",
        objectiveDesc: "Build confidence for {role} interviews.",
        cta: "Start my first interview"
      },
      nav: {
        back: "Back",
        exit: "Exit",
        continue: "Continue"
      }
    },
    FR: {
      screen1: {
        greeting: "Bonjour.",
        intro: "Je suis SHANA.",
        headline: "Préparons votre prochain entretien.",
        sub: "Un accompagnement conversationnel par IA sur-mesure pour forger de vrais réflexes face aux recruteurs.",
        btnStart: "Commencer"
      },
      screen2: {
        headline: "Quel poste préparez-vous ?",
        placeholder: "ex: Développeur Fullstack",
        popular: "Métiers recherchés",
        feedback: "Parfait. J'adapterai chaque entretien à ce poste."
      },
      screen3: {
        headline: "Quel est votre niveau d'expérience ?",
        feedback: "Parfait. J'ajusterai la difficulté de l'entretien.",
        levels: [
          { key: "student", label: "Étudiant / Jeune Diplômé", desc: "Recherche de stages ou de premiers jobs." },
          { key: "junior", label: "Junior", desc: "1-2 ans d'expérience. Consolidation des bases techniques." },
          { key: "intermediate", label: "Intermédiaire", desc: "3-5 ans d'expérience. Impact autonome de premier plan." },
          { key: "senior", label: "Senior", desc: "6 ans et + d'expérience. Leadership, encadrement et vision." }
        ]
      },
      screen4: {
        headline: "Quels sont vos objectifs principaux ?",
        desc: "Sélectionnez vos axes de travail prioritaires.",
        goals: [
          { key: "get_hired", label: "Décrocher le poste", desc: "Briller aux yeux des décideurs", icon: "💼" },
          { key: "confidence", label: "Gagner en assurance", desc: "Gérer le stress et fluidifier le rythme", icon: "🧠" },
          { key: "speaking", label: "Mieux s'exprimer", desc: "Bannir les tics et tics verbaux", icon: "🎙️" },
          { key: "leadership", label: "Développer son leadership", desc: "Affirmer sa posture managériale", icon: "🚀" },
          { key: "behavioral", label: "Entretiens comportementaux", desc: "Maîtriser la méthode STAR", icon: "💬" },
          { key: "technical", label: "Entretiens techniques", desc: "Savoir expliquer ses choix de conception", icon: "💻" }
        ]
      },
      screen5: {
        headline: "Avant de commencer",
        sub: "Créez votre profil pour personnaliser votre préparation.",
        firstNameLabel: "Prénom",
        lastNameLabel: "Nom",
        emailLabel: "Adresse E-mail",
        passwordLabel: "Mot de passe (6+ caract.)",
        cta: "Créer mon compte",
        errorRequire: "Tous les champs sont requis.",
        errorPassword: "Sécurité : Le mot de passe doit faire au moins 6 caractères."
      },
      screen6: {
        steps: [
          "Création de votre profil",
          "Préparation de votre coach personnel",
          "Personnalisation des questions",
          "Élaboration de votre plan d'entraînement",
          "Prêt"
        ]
      },
      screen7: {
        welcome: "Bienvenue,",
        subtitle: "Votre coach IA est prêt.",
        objective: "Objectif du jour",
        objectiveDesc: "Développer votre assurance pour vos entretiens de {role}.",
        cta: "Démarrer mon premier entretien"
      },
      nav: {
        back: "Retour",
        exit: "Quitter",
        continue: "Continuer"
      }
    }
  }[lang];

  const handleNext = () => {
    if (screen < 5) {
      setScreen(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (screen > 1) {
      setScreen(prev => prev - 1);
    } else {
      onBackToLanding();
    }
  };

  const handleSelectExperience = (level: string) => {
    setExperienceLevel(level);
  };

  const handleToggleGoal = (goalKey: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalKey) 
        ? prev.filter(g => g !== goalKey) 
        : [...prev, goalKey]
    );
  };

  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    // Mark all fields as touched for final visual check
    setTouchedFields({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      targetRole: true
    });

    if (!firstName.trim() || !lastName.trim() || !targetRole.trim() || !email.trim() || !password) {
      setErrorMsg(dict.screen5.errorRequire);
      return;
    }
    
    if (password.length < 6) {
      setErrorMsg(dict.screen5.errorPassword);
      return;
    }
    
    try {
      // 1. Register User and create corresponding Profile
      const { user, profile } = StorageService.createUser(
        { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() },
        password
      );

      // 2. Populate customizable fields during onboarding
      const updatedProfile = {
        ...profile,
        targetRole: targetRole.trim(),
        experienceYears: experienceLevel || '',
        industry: selectedGoals.join(', '),
        language: (lang === 'FR' ? 'French' : 'English') as 'French' | 'English'
      };
      
      StorageService.saveProfile(updatedProfile);
      StorageService.setSession(user.id);
      
      setIsCompleted(true);
      setScreen(6); // Set screen to checklist animation step
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'EN' ? 'An unexpected error occurred.' : 'Une erreur inattendue est survenue.'));
    }
  };

  const handleFinishOnboarding = () => {
    try {
      localStorage.removeItem('shana_draft_onboarding_flow_form');
    } catch (e) {}
    onComplete({
      firstName,
      lastName,
      targetRole,
      lang
    });
  };

  // Preset job roles popular list for screen 2
  const popularRoles = lang === 'FR' 
    ? ["Product Manager", "Développeur Fullstack", "Commercial B2B", "Consultant Stratégie"]
    : ["Product Manager", "Software Engineer", "Sales Executive", "Management Consultant"];

  // Progress Bar Value Calculations
  const getProgressPercentage = () => {
    if (showFinalWelcome) return 100;
    if (isCompleted) return 98;
    switch(screen) {
      case 1: return 15;
      case 2: return 35;
      case 3: return 55;
      case 4: return 75;
      case 5: return 92;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col font-sans relative z-10 antialiased selection:bg-[#F4C542] selection:text-[#111111] overflow-hidden">
      
      {/* =========================================
          PREMIUM BACKGROUND ELEMENTS
         ========================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-white">
        {/* Subtle noise/grain texture with 2% opacity */}
        <div className="absolute inset-0 bg-[radial-gradient(#111111_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.02]" />
        
        {/* Left slow pulsing warm blob */}
        <motion.div 
          className="absolute top-[15%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#F4C542] opacity-[0.035] filter blur-[100px]"
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Right slow pulsing indigo/neutral blob */}
        <motion.div 
          className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-slate-300 opacity-[0.04] filter blur-[120px]"
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
            scale: [1, 1.08, 1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
        />
      </div>

      {/* =========================================
          TOP THIN ANIMATED PROGRESS LINE
         ========================================= */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-slate-100 z-50">
        <motion.div 
          className="h-full bg-[#F4C542]"
          initial={{ width: "0%" }}
          animate={{ width: `${getProgressPercentage()}%` }}
          transition={{ type: 'spring', stiffness: 70, damping: 15 }}
        />
      </div>

      {/* =========================================
          MINIMALIST HEADER (NAVBAR)
         ========================================= */}
      {!showFinalWelcome && (
        <header className="h-20 border-b border-[#E5E7EB]/40 bg-white/60 backdrop-blur-md flex items-center shrink-0 relative z-40">
          <div className="max-w-4xl w-full mx-auto px-6 sm:px-8 flex justify-between items-center">
            
            {/* Elegant Minimalist Back Button */}
            {screen <= 5 ? (
              <button
                id="onboarding-back-btn"
                onClick={handleBack}
                className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B7280] hover:text-[#111111] transition-all cursor-pointer py-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-[#6B7280] group-hover:text-[#111111] transition-transform group-hover:-translate-x-0.5" />
                <span>{screen > 1 ? dict.nav.back : dict.nav.exit}</span>
              </button>
            ) : (
              <div className="w-20" /> /* placeholder to balance layout */
            )}

            {/* Brand Logo and Subtext */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#111111] text-[#FFFFFF] rounded-lg flex items-center justify-center font-black text-xs shadow-sm">
                S
              </div>
              <span className="font-sans font-extrabold text-sm tracking-tight text-[#111111]">
                SHANA<span className="text-[#F4C542]">.</span>
              </span>
            </div>

            {/* Language Toggle */}
            <div className="flex bg-[#FAFAFA] border border-[#E5E7EB]/60 p-1.5 rounded-xl text-xs gap-1 shadow-2xs">
              <button
                onClick={() => setLang('EN')}
                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer font-mono ${
                  lang === 'EN' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('FR')}
                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer font-mono ${
                  lang === 'FR' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                FR
              </button>
            </div>

          </div>
        </header>
      )}

      {/* =========================================
          MAIN STAGE CONTENT
         ========================================= */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 sm:px-8 py-10 flex flex-col justify-center relative z-20">
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: WELCOME SCREEN */}
          {screen === 1 && (
            <motion.div
              key="screen-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="max-w-2xl mx-auto w-full text-center space-y-8"
            >
              {/* Abstract Google-Style Geometric Artwork */}
              <div className="py-2">
                <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto drop-shadow-xs">
                  {/* Outer delicate guidelines */}
                  <motion.circle 
                    cx="120" 
                    cy="120" 
                    r="85" 
                    stroke="#E5E7EB" 
                    strokeWidth="1" 
                    strokeDasharray="4 6"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.circle 
                    cx="120" 
                    cy="120" 
                    r="65" 
                    stroke="#E5E7EB" 
                    strokeWidth="1" 
                    strokeDasharray="2 3"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  />
                  {/* Central premium blurred shape */}
                  <motion.circle 
                    cx="110" 
                    cy="110" 
                    r="35" 
                    fill="#FAFAFA" 
                    stroke="#E5E7EB" 
                    strokeWidth="1.5"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Overlapping yellow accented circle with low opacity */}
                  <motion.circle 
                    cx="140" 
                    cy="130" 
                    r="25" 
                    fill="#F4C542" 
                    fillOpacity="0.12" 
                    stroke="#F4C542" 
                    strokeWidth="1.5"
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  />
                  {/* Crisp white floating pill for speech simulation */}
                  <motion.rect 
                    x="65" 
                    y="142" 
                    width="110" 
                    height="28" 
                    rx="14" 
                    fill="white" 
                    stroke="#E5E7EB" 
                    strokeWidth="1.5"
                    className="shadow-xs"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Live speech waveform indicators */}
                  <g opacity="0.85">
                    <rect x="90" y="152" width="2" height="8" rx="1" fill="#111111" />
                    <rect x="96" y="149" width="2" height="14" rx="1" fill="#111111" />
                    <rect x="102" y="151" width="2" height="10" rx="1" fill="#F4C542" />
                    <rect x="108" y="148" width="2" height="16" rx="1" fill="#111111" />
                    <rect x="114" y="154" width="2" height="4" rx="1" fill="#111111" />
                    <rect x="120" y="150" width="2" height="12" rx="1" fill="#111111" />
                    <rect x="126" y="151" width="2" height="10" rx="1" fill="#F4C542" />
                    <rect x="132" y="149" width="2" height="14" rx="1" fill="#111111" />
                    <rect x="138" y="153" width="2" height="6" rx="1" fill="#111111" />
                  </g>
                  {/* Minimal accent dots */}
                  <motion.circle 
                    cx="155" 
                    cy="80" 
                    r="4" 
                    fill="#F4C542"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <circle cx="80" cy="90" r="3" fill="#E5E7EB" />
                </svg>
              </div>

              {/* Text Layout */}
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#111111] leading-[1.05] whitespace-pre-line select-none">
                  {dict.screen1.greeting}
                  <br />
                  {dict.screen1.intro}
                </h1>
                <p className="text-xl sm:text-2xl font-semibold text-[#111111] tracking-tight">
                  {dict.screen1.headline}
                </p>
                <p className="text-sm.5 text-[#6B7280] max-w-md mx-auto leading-relaxed">
                  {dict.screen1.sub}
                </p>
              </div>

              {/* Start Button */}
              <div className="pt-4">
                <button
                  id="onboarding-start-btn"
                  onClick={handleNext}
                  className="px-10 py-4 bg-[#F4C542] hover:bg-[#E9B800] text-[#111111] font-extrabold text-sm uppercase tracking-wider rounded-full transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-98 flex items-center gap-2 mx-auto"
                >
                  <span>{dict.screen1.btnStart}</span>
                  <ChevronRight className="w-4 h-4 text-[#111111]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: POSITION CONVERSATION */}
          {screen === 2 && (
            <motion.div
              key="screen-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-2xl mx-auto w-full space-y-10"
            >
              {/* Question Headline */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider font-mono">SHANA</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
                  "{dict.screen2.headline}"
                </h2>
              </div>

              {/* Input field with minimal clean line and glow */}
              <div className="relative group">
                <input
                  id="target-role-input"
                  type="text"
                  placeholder={dict.screen2.placeholder}
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-[#E5E7EB] focus:border-[#F4C542] py-4 text-xl sm:text-2xl font-bold text-[#111111] placeholder:text-[#E5E7EB] outline-none transition-all duration-300"
                  autoComplete="off"
                  autoFocus
                />
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F4C542] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300" />
              </div>

              {/* Inline dynamic feedback message */}
              <AnimatePresence>
                {targetRole.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#F4C542] shrink-0 animate-pulse" />
                    <p className="text-xs.5 font-bold text-[#111111]">
                      {dict.screen2.feedback}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Popular suggestions */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">
                  {dict.screen2.popular}
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className={`px-4 py-2 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                        targetRole === role
                          ? "bg-[#111111] border-[#111111] text-white"
                          : "bg-[#FAFAFA] border-[#E5E7EB] text-[#6B7280] hover:border-[#111111] hover:text-[#111111]"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Action */}
              <div className="pt-6 border-t border-[#E5E7EB]/40 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!targetRole.trim()}
                  className="px-8 py-3.5 bg-[#111111] disabled:bg-slate-200 disabled:text-[#6B7280] hover:bg-[#F4C542] hover:text-[#111111] text-white font-extrabold text-xs uppercase tracking-widest rounded-full shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
                >
                  <span>{dict.nav.continue}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: EXPERIENCE LEVELS */}
          {screen === 3 && (
            <motion.div
              key="screen-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-2xl mx-auto w-full space-y-10"
            >
              {/* Question Headline */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider font-mono">SHANA</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
                  "{dict.screen3.headline}"
                </h2>
              </div>

              {/* Large, sleek responsive selection cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dict.screen3.levels.map((lvl) => {
                  const isSelected = experienceLevel === lvl.key;
                  return (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => handleSelectExperience(lvl.key)}
                      className={`p-6 text-left border rounded-3xl bg-[#FAFAFA] transition-all duration-300 relative group cursor-pointer ${
                        isSelected 
                          ? "border-[#111111] bg-white ring-1 ring-[#111111] shadow-xs" 
                          : "border-[#E5E7EB] hover:border-[#6B7280] hover:bg-white"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-extrabold text-sm.5 text-[#111111]">{lvl.label}</h4>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? "bg-[#111111] border-[#111111]" : "border-[#E5E7EB]"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                          </div>
                        </div>
                        <p className="text-xs font-medium text-[#6B7280] leading-relaxed pr-2">
                          {lvl.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Fading in feedback message */}
              <AnimatePresence>
                {experienceLevel && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#F4C542] shrink-0 animate-pulse" />
                    <p className="text-xs.5 font-bold text-[#111111]">
                      {dict.screen3.feedback}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Action */}
              <div className="pt-6 border-t border-[#E5E7EB]/40 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!experienceLevel}
                  className="px-8 py-3.5 bg-[#111111] disabled:bg-slate-200 disabled:text-[#6B7280] hover:bg-[#F4C542] hover:text-[#111111] text-white font-extrabold text-xs uppercase tracking-widest rounded-full shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
                >
                  <span>{dict.nav.continue}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 4: GOALS CHIPS */}
          {screen === 4 && (
            <motion.div
              key="screen-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-2xl mx-auto w-full space-y-10"
            >
              {/* Question Headline */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider font-mono">SHANA</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
                  "{dict.screen4.headline}"
                </h2>
                <p className="text-xs.5 text-[#6B7280] font-semibold">
                  {dict.screen4.desc}
                </p>
              </div>

              {/* Large cards representing objectives */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dict.screen4.goals.map((goal) => {
                  const isSelected = selectedGoals.includes(goal.key);
                  return (
                    <button
                      key={goal.key}
                      type="button"
                      onClick={() => handleToggleGoal(goal.key)}
                      className={`p-5 text-left border rounded-3xl bg-[#FAFAFA] transition-all duration-300 relative group cursor-pointer ${
                        isSelected 
                          ? "border-[#111111] bg-white ring-1 ring-[#111111] scale-[1.02] shadow-xs" 
                          : "border-[#E5E7EB] hover:border-[#6B7280] hover:bg-white"
                      }`}
                    >
                      <div className="flex gap-4 items-start">
                        {/* Circle container for emoji */}
                        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shrink-0 transition-all ${
                          isSelected ? "bg-[#111111]/5 border-[#111111]/10" : "bg-white border-[#E5E7EB]"
                        }`}>
                          <span>{goal.icon}</span>
                        </div>
                        
                        <div className="space-y-1 flex-1 min-w-0 pr-2">
                          <h4 className="font-extrabold text-xs.5 text-[#111111] truncate">{goal.label}</h4>
                          <p className="text-[11px] font-semibold text-[#6B7280] leading-normal">
                            {goal.desc}
                          </p>
                        </div>

                        {/* Tick circle */}
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 self-center transition-all ${
                          isSelected ? "bg-[#111111] border-[#111111]" : "border-[#E5E7EB]"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Action */}
              <div className="pt-6 border-t border-[#E5E7EB]/40 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={selectedGoals.length === 0}
                  className="px-8 py-3.5 bg-[#111111] disabled:bg-slate-200 disabled:text-[#6B7280] hover:bg-[#F4C542] hover:text-[#111111] text-white font-extrabold text-xs uppercase tracking-widest rounded-full shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
                >
                  <span>{dict.nav.continue}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 5: REGISTRATION PROFILE FORM */}
          {screen === 5 && (
            <motion.div
              key="screen-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-2xl mx-auto w-full space-y-8"
            >
              {/* Headline */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider font-mono">SHANA PROFILE</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
                  {dict.screen5.headline}
                </h2>
                <p className="text-sm.5 text-[#6B7280] font-semibold">
                  {dict.screen5.sub}
                </p>
              </div>

              {/* Error Box */}
              {errorMsg && (
                <div id="onboarding-reg-error" className="p-4 bg-red-50/60 border border-red-200 text-red-900 text-xs font-bold rounded-2xl flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Minimal Clean Form with Floating Labels & Large Spacing */}
              <form onSubmit={handleCreateAccountSubmit} className="space-y-6">
                
                {/* Names horizontal row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="relative group">
                    <input
                      id="onboarding-firstname"
                      type="text"
                      placeholder=" "
                      required
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setTouchedFields(prev => ({ ...prev, firstName: true }));
                      }}
                      className="peer w-full bg-[#FAFAFA] border border-[#E5E7EB] px-4 pt-6 pb-2.5 rounded-2xl text-xs.5 font-bold text-[#111111] outline-none transition-all duration-200 focus:bg-white focus:border-[#111111] placeholder-transparent"
                    />
                    <label
                      htmlFor="onboarding-firstname"
                      className="absolute left-4 top-2 text-[10px] uppercase tracking-wider font-mono font-bold text-[#6B7280] transition-all select-none pointer-events-none
                                 peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs.5 peer-placeholder-shown:font-extrabold peer-placeholder-shown:font-sans
                                 peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-mono peer-focus:font-bold peer-focus:text-[#111111]"
                    >
                      {dict.screen5.firstNameLabel}
                    </label>
                    {/* Inline checkmark indicator */}
                    {touchedFields.firstName && validators.firstName && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#F4C542]" />
                      </div>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="relative group">
                    <input
                      id="onboarding-lastname"
                      type="text"
                      placeholder=" "
                      required
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setTouchedFields(prev => ({ ...prev, lastName: true }));
                      }}
                      className="peer w-full bg-[#FAFAFA] border border-[#E5E7EB] px-4 pt-6 pb-2.5 rounded-2xl text-xs.5 font-bold text-[#111111] outline-none transition-all duration-200 focus:bg-white focus:border-[#111111] placeholder-transparent"
                    />
                    <label
                      htmlFor="onboarding-lastname"
                      className="absolute left-4 top-2 text-[10px] uppercase tracking-wider font-mono font-bold text-[#6B7280] transition-all select-none pointer-events-none
                                 peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs.5 peer-placeholder-shown:font-extrabold peer-placeholder-shown:font-sans
                                 peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-mono peer-focus:font-bold peer-focus:text-[#111111]"
                    >
                      {dict.screen5.lastNameLabel}
                    </label>
                    {/* Inline checkmark indicator */}
                    {touchedFields.lastName && validators.lastName && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#F4C542]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Email address */}
                <div className="relative group">
                  <input
                    id="onboarding-email"
                    type="email"
                    placeholder=" "
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setTouchedFields(prev => ({ ...prev, email: true }));
                    }}
                    className="peer w-full bg-[#FAFAFA] border border-[#E5E7EB] px-4 pt-6 pb-2.5 rounded-2xl text-xs.5 font-bold text-[#111111] outline-none transition-all duration-200 focus:bg-white focus:border-[#111111] placeholder-transparent"
                  />
                  <label
                    htmlFor="onboarding-email"
                    className="absolute left-4 top-2 text-[10px] uppercase tracking-wider font-mono font-bold text-[#6B7280] transition-all select-none pointer-events-none
                               peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs.5 peer-placeholder-shown:font-extrabold peer-placeholder-shown:font-sans
                               peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-mono peer-focus:font-bold peer-focus:text-[#111111]"
                  >
                    {dict.screen5.emailLabel}
                  </label>
                  {/* Inline checkmark indicator */}
                  {touchedFields.email && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full transition-all ${validators.email ? "bg-[#F4C542]" : "bg-red-350 opacity-0"}`} />
                    </div>
                  )}
                </div>

                {/* Password field with dynamic eye indicator */}
                <div className="relative group">
                  <input
                    id="onboarding-password"
                    type={showPassword ? "text" : "password"}
                    placeholder=" "
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setTouchedFields(prev => ({ ...prev, password: true }));
                    }}
                    className="peer w-full bg-[#FAFAFA] border border-[#E5E7EB] px-4 pt-6 pr-12 pb-2.5 rounded-2xl text-xs.5 font-bold text-[#111111] outline-none transition-all duration-200 focus:bg-white focus:border-[#111111] placeholder-transparent"
                  />
                  <label
                    htmlFor="onboarding-password"
                    className="absolute left-4 top-2 text-[10px] uppercase tracking-wider font-mono font-bold text-[#6B7280] transition-all select-none pointer-events-none
                               peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs.5 peer-placeholder-shown:font-extrabold peer-placeholder-shown:font-sans
                               peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-mono peer-focus:font-bold peer-focus:text-[#111111]"
                  >
                    {dict.screen5.passwordLabel}
                  </label>
                  
                  {/* Password Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111111] transition-colors p-1 rounded-lg cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>

                {/* Confirm Account Submission Button */}
                <div className="pt-4">
                  <button
                    id="onboarding-submit-btn"
                    type="submit"
                    className="w-full py-4 bg-[#F4C542] hover:bg-[#E9B800] text-[#111111] font-extrabold text-xs uppercase tracking-wider rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  >
                    <span>{dict.screen5.cta}</span>
                    <Sparkles className="w-4 h-4 text-[#111111]" />
                  </button>
                </div>

              </form>
            </motion.div>
          )}

          {/* SCREEN 6: PROGRESSIVE PREPARATION CHECKLIST */}
          {screen === 6 && !showFinalWelcome && (
            <motion.div
              key="screen-6"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25 }}
              className="max-w-md mx-auto w-full space-y-8 py-8 text-center"
            >
              {/* Spinner/Pulse decorative icon */}
              <div className="flex justify-center relative">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-[#E5E7EB] flex items-center justify-center shadow-3xs">
                  <Sparkle className="w-6 h-6 text-[#F4C542] animate-spin" style={{ animationDuration: '4s' }} />
                </div>
              </div>

              {/* Title instructions */}
              <div className="space-y-2">
                <h3 className="font-sans font-extrabold text-xl text-[#111111]">
                  {lang === 'FR' ? "Initialisation de votre espace..." : "Initializing your coaching space..."}
                </h3>
              </div>

              {/* Sequential Checklist Stack */}
              <div className="space-y-3 bg-[#FAFAFA] border border-[#E5E7EB]/70 p-6 rounded-3xl text-left max-w-sm mx-auto shadow-3xs">
                {dict.screen6.steps.map((step, idx) => {
                  const isDone = activeChecklistIndex > idx;
                  const isActive = activeChecklistIndex === idx;
                  
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0.3, x: -5 }}
                      animate={{ 
                        opacity: isDone || isActive ? 1 : 0.25,
                        x: 0,
                        fontWeight: isActive ? "700" : "500"
                      }}
                      className="flex items-center justify-between py-1 text-xs font-semibold"
                    >
                      <div className="flex items-center gap-3">
                        {isDone ? (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4.5 h-4.5 rounded-full bg-[#F4C542] flex items-center justify-center shrink-0"
                          >
                            <Check className="w-3 h-3 text-[#111111] stroke-[3px]" />
                          </motion.div>
                        ) : isActive ? (
                          <div className="w-4.5 h-4.5 rounded-full bg-[#111111]/5 border border-[#111111]/10 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#111111] animate-ping" />
                          </div>
                        ) : (
                          <div className="w-4.5 h-4.5 rounded-full bg-transparent border border-slate-200 flex items-center justify-center shrink-0" />
                        )}
                        <span className={isDone ? "text-[#111111]/60 line-through" : "text-[#111111]"}>
                          {step}
                        </span>
                      </div>
                      
                      {isActive && (
                        <span className="font-mono text-[9px] text-[#F4C542] font-black tracking-widest uppercase animate-pulse">
                          SYNC
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* SCREEN 7: FINAL WELCOME PRESENTATION */}
          {showFinalWelcome && (
            <motion.div
              key="screen-7"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-xl mx-auto w-full text-center space-y-10 py-4"
            >
              {/* Giant Celebratory Badge */}
              <div className="relative justify-center flex">
                <div className="w-18 h-18 rounded-3xl bg-[#F4C542]/10 border border-[#F4C542]/20 flex items-center justify-center relative">
                  <ShieldCheck className="w-8 h-8 text-[#111111] stroke-[2]" />
                  {/* Subtle radiating waves */}
                  <span className="absolute inset-0 rounded-3xl border border-[#F4C542]/20 scale-125 animate-ping opacity-20" />
                </div>
              </div>

              {/* Headlines and greeting */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111111] leading-tight">
                  {dict.screen7.welcome} {firstName || "Candidat"}.
                </h1>
                <p className="text-lg sm:text-xl font-semibold text-[#6B7280]">
                  {dict.screen7.subtitle}
                </p>
              </div>

              {/* Dynamic objective capsule */}
              <div className="bg-[#FAFAFA] border border-[#E5E7EB] p-6 rounded-3xl max-w-sm mx-auto text-left space-y-1 shadow-3xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">
                  {dict.screen7.objective}
                </span>
                <p className="text-xs.5 font-bold text-[#111111] leading-relaxed">
                  {dict.screen7.objectiveDesc.replace('{role}', targetRole || 'Position')}
                </p>
              </div>

              {/* Launch Yellow CTA */}
              <div className="pt-2">
                <button
                  id="onboarding-complete-finish-btn"
                  onClick={handleFinishOnboarding}
                  className="px-10 py-4.5 bg-[#F4C542] hover:bg-[#E9B800] text-[#111111] font-extrabold text-sm uppercase tracking-wider rounded-full transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-98 flex items-center gap-2.5 mx-auto"
                >
                  <span>{dict.screen7.cta}</span>
                  <ArrowRight className="w-4 h-4 text-[#111111] stroke-[3]" />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}
