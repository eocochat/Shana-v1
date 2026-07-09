import React, { useState, useEffect } from 'react';
import { UserProfile, SessionHistoryItem, ActiveTab, Language } from '../types';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';
const PerformanceRadar = React.lazy(() => import('./PerformanceRadar'));
const ProgressChart = React.lazy(() => import('./ProgressChart'));
import LearningValidationAudit from './LearningValidationAudit';
import CalendarScheduler from './CalendarScheduler';
import Tips from './Tips';
import { 
  ArrowRight, 
  Award, 
  Activity, 
  Bell, 
  BellOff, 
  Briefcase, 
  Calendar, 
  Check, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  FileText, 
  HelpCircle, 
  Mic, 
  Play, 
  Sparkles, 
  TrendingUp, 
  Upload, 
  User, 
  Video, 
  Zap,
  Target,
  Flame,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardViewProps {
  user: UserProfile;
  lang: Language;
  history: SessionHistoryItem[];
  onChangeTab: (tab: ActiveTab) => void;
  onTriggerCVUpload?: () => void;
  onTriggerVoiceTraining?: () => void;
}

export default function DashboardView({ 
  user, 
  lang, 
  history, 
  onChangeTab, 
  onTriggerCVUpload, 
  onTriggerVoiceTraining 
}: DashboardViewProps) {
  const { addToast } = useToast();
  
  // Local notification toggling state with local storage persistence
  const [notificationsActive, setNotificationsActive] = useState(() => {
    return localStorage.getItem('shana_notifications_active') === 'true';
  });

  // Track monetization settings
  const [monetization, setMonetization] = useState(() => {
    return StorageService.getCandidateMonetization(user.id || 'usr_candidate');
  });

  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    const handleProgressUpdate = () => {
      setMonetization(StorageService.getCandidateMonetization(user.id || 'usr_candidate'));
    };
    window.addEventListener('shana_progress_update', handleProgressUpdate);
    return () => {
      window.removeEventListener('shana_progress_update', handleProgressUpdate);
    };
  }, [user.id]);

  // Handle Notifications Switch
  const handleToggleNotifications = () => {
    if (notificationsActive) {
      localStorage.setItem('shana_notifications_active', 'false');
      setNotificationsActive(false);
      addToast({
        title: lang === 'EN' ? "Notifications Paused" : "Notifications en pause",
        description: lang === 'EN' 
          ? "You will no longer receive platform alerts or progress updates." 
          : "Vous ne recevrez plus d'alertes de la plateforme ou de suivi.",
        type: 'info'
      });
    } else {
      localStorage.setItem('shana_notifications_active', 'true');
      setNotificationsActive(true);
      addToast({
        title: lang === 'EN' ? "Notifications Enabled" : "Notifications activées",
        description: lang === 'EN' 
          ? "Interactive system recommendations and milestone alerts are now live." 
          : "Les recommandations interactives et les alertes de progression sont actives.",
        type: 'success'
      });
    }
  };

  // Check if CV is uploaded
  const hasCV = user.id ? !!StorageService.getAnalysis(user.id) : false;
  
  // Completed voice training counter
  const getTrainingSessionsCount = () => {
    if (!user.id) return 0;
    try {
      const key = `shana_voice_sessions_${user.id}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved).length : 0;
    } catch (e) {
      return 0;
    }
  };
  const voiceTrainingCount = getTrainingSessionsCount();

  // Filter assessment logs and find latest score
  const assessSessions = history.filter(item => item.type === 'ASSESS');
  const latestReadiness = assessSessions.length > 0 ? assessSessions[0].score : 0;

  // Next action logic
  let nextActionCTA = '';
  let nextActionType = '';
  let nextActionHandler = () => {};

  if (!hasCV) {
    nextActionCTA = lang === 'EN' ? "Align Profile & Upload CV" : "Calibrer le profil & Déposer mon CV";
    nextActionType = lang === 'EN' ? "Profile Calibration" : "Calibration du Profil";
    nextActionHandler = () => {
      if (onTriggerCVUpload) onTriggerCVUpload();
    };
  } else if (voiceTrainingCount === 0) {
    nextActionCTA = lang === 'EN' ? "Start Verbal Simulation" : "Démarrer l'Entraînement Vocal";
    nextActionType = lang === 'EN' ? "Interactive Voice Training" : "Entraînement Vocal Interactif";
    nextActionHandler = () => {
      if (onTriggerVoiceTraining) onTriggerVoiceTraining();
    };
  } else {
    nextActionCTA = lang === 'EN' ? "Begin Mirror Stress Test" : "Lancer le Stress Test Miroir";
    nextActionType = lang === 'EN' ? "Mirror Assessment Video" : "Évaluation Vidéo Miroir";
    nextActionHandler = () => {
      onChangeTab('assessment');
    };
  }

  const isFr = lang === 'FR';

  // Natural Dynamic Greeting
  const currentHour = new Date().getHours();
  let greetingWord = "";
  if (isFr) {
    greetingWord = currentHour >= 18 ? "Bonsoir" : "Bonjour";
  } else {
    if (currentHour < 12) greetingWord = "Good morning";
    else if (currentHour < 17) greetingWord = "Good afternoon";
    else greetingWord = "Good evening";
  }

  const userFirstName = user.name ? user.name.split(' ')[0] : (isFr ? "Candidat" : "Candidate");

  // Dynamic daily subtext reflecting progress state
  const getDailySubtext = () => {
    if (history.length === 0) {
      return isFr 
        ? "Prêt pour votre préparation d'aujourd'hui ? Commençons par calibrer votre profil." 
        : "Ready for today's interview preparation? Let's start by calibrating your profile.";
    } else if (latestReadiness >= 85) {
      return isFr
        ? "Excellente progression. Vous approchez de votre objectif de maîtrise."
        : "Exceptional progression. You are closing in on your mastery goals.";
    } else {
      return isFr
        ? "Votre défi d'aujourd'hui est prêt. Continuons à forger vos réflexes."
        : "Today's challenge is ready. Let's keep building your verbal reflexes.";
    }
  };

  // Translations object
  const d = {
    EN: {
      primaryTag: "TODAY'S HIGHLIGHTED OBJECTIVE",
      estimatedDuration: "Estimated duration",
      interviewType: "Interview Type",
      difficulty: "Difficulty",
      rolePlaceholder: "Target Role Context",
      minutesText: "15 mins",
      difficultySenior: "Senior Level Challenge",
      difficultyJunior: "Foundational Practice",
      practiceButton: "Practice Now",
      progressTitle: "Preparation Overview",
      completedTitle: "Interviews Completed",
      goalTitle: "Weekly Practice Goal",
      goalText: "of 5 sessions complete",
      streakTitle: "Consistency Streak",
      streakText: "day streak",
      confidenceTitle: "Last Readiness Score",
      confidenceText: "To calibrate",
      coachFocusTitle: "AI Coach Focus",
      recentTitle: "Recent Activity Timeline",
      noActivityTitle: "Your journey starts here.",
      noActivitySub: "Begin your first simulation to build muscle memory and unlock custom analysis.",
      calibrateTag: "To calibrate",
      tokensLeft: "Tokens Left",
      tokensUnlimited: "Unlimited Practice Access",
      upgradeLink: "Upgrade",
      activeTabLabel: "Simulation Active",
      historyTabLabel: "History Logs",
      notificationActive: "Platform notifications enabled.",
      notificationInactive: "Notifications paused."
    },
    FR: {
      primaryTag: "OBJECTIF RECOMMANDÉ DU JOUR",
      estimatedDuration: "Durée estimée",
      interviewType: "Type d'entretien",
      difficulty: "Difficulté",
      rolePlaceholder: "Poste Cible",
      minutesText: "15 min",
      difficultySenior: "Niveau Avancé / Senior",
      difficultyJunior: "Bases & Entraînement",
      practiceButton: "S'entraîner maintenant",
      progressTitle: "Suivi de Préparation",
      completedTitle: "Entretiens réalisés",
      goalTitle: "Objectif Hebdomadaire",
      goalText: "sur 5 sessions complétées",
      streakTitle: "Série d'assiduité",
      streakText: "jours d'affilée",
      confidenceTitle: "Dernier score d'assurance",
      confidenceText: "À calibrer",
      coachFocusTitle: "Conseil du Coach IA",
      recentTitle: "Historique d'Activité",
      noActivityTitle: "Votre aventure commence ici.",
      noActivitySub: "Lancez votre premier entretien pour forger vos réflexes et débloquer vos analyses personnalisées.",
      calibrateTag: "À calibrer",
      tokensLeft: "Crédits Restants",
      tokensUnlimited: "Accès Entraînement Illimité",
      upgradeLink: "Abonnement",
      activeTabLabel: "Simulation Active",
      historyTabLabel: "Historique",
      notificationActive: "Notifications activées.",
      notificationInactive: "Notifications désactivées."
    }
  }[lang];

  // Mock consistency streak logic
  const getStreakCount = () => {
    if (history.length === 0) return 0;
    const uniqueDates = Array.from(new Set(history.map(item => item.date)));
    return Math.min(uniqueDates.length, 4) || 1;
  };

  // Progress goals complete logic
  const getCompletedThisWeek = () => {
    return Math.min(history.length, 5);
  };

  // Dedicated custom dynamic AI Focus recommendation based on real history
  const getCoachFocus = () => {
    // 1. If there is absolutely no history
    if (history.length === 0) {
      return {
        focus: isFr ? "Calibrer votre CV" : "Establish Professional Baseline",
        desc: isFr 
          ? "Déposez votre CV pour que SHANA puisse cartographier vos compétences et personnaliser les simulations d'entretien."
          : "Upload your CV to let SHANA analyze your background and custom-craft behavioral scenarios tailored to your target industry.",
        action: isFr ? "Déposer mon CV" : "Align CV now",
        handler: () => onTriggerCVUpload && onTriggerCVUpload()
      };
    }

    // 2. Look for the latest ACTUAL evaluation (TRAIN or ASSESS)
    const latestEval = history.find(item => item.type === 'TRAIN' || item.type === 'ASSESS');

    if (latestEval) {
      let focusTitle = "";
      let detailedAdvice = "";
      let hasDynamicSource = false;

      // Check if we have specific questionsFeedback with detailed scores and tips
      if (latestEval.questionsFeedback && latestEval.questionsFeedback.length > 0) {
        // Sort to find the lowest-scoring phase in this session to highlight as priority
        const evaluatedQuestions = [...latestEval.questionsFeedback].sort((a, b) => (a.score || 0) - (b.score || 0));
        const lowestQ = evaluatedQuestions[0];
        
        if (lowestQ && lowestQ.score < 90) {
          hasDynamicSource = true;
          const phaseName = lowestQ.phaseLabel || "";
          const scoreVal = lowestQ.score || 0;
          const qText = lowestQ.questionText || "";
          const tipText = lowestQ.improvementTip || "";
          
          if (isFr) {
            focusTitle = `Axe prioritaire : ${phaseName.split(':')[0] || "Structure du discours"}`;
            detailedAdvice = `Lors de votre dernière évaluation, la phase « ${phaseName} » a obtenu un score de ${scoreVal}%. Sur la question : « ${qText} », l'IA a relevé l'opportunité d'amélioration suivante : « ${tipText} ». Concentrez-vous aujourd'hui sur l'articulation méthodique de la méthode STAR.`;
          } else {
            focusTitle = `Critical path: ${phaseName.split(':')[0] || "Response Structure"}`;
            detailedAdvice = `In your latest session, the section "${phaseName}" scored ${scoreVal}%. On the question: "${qText}", Shana identified this key growth area: "${tipText}". Focus today on the rigid application of the STAR framework.`;
          }
        }
      }

      // If no question feedback, check sub-scores for the lowest competency category
      if (!hasDynamicSource) {
        const scores = [
          { name: isFr ? "Alignement du CV" : "Resume Defense", val: latestEval.resumeScore, cat: "resume" },
          { name: isFr ? "Maîtrise sectorielle" : "Industry Expertise", val: latestEval.industryScore, cat: "industry" },
          { name: isFr ? "Clarté d'élocution" : "Communication Clarity", val: latestEval.communicationScore, cat: "comm" },
          { name: isFr ? "Posture de leadership" : "Executive Confidence", val: latestEval.confidenceScore, cat: "confidence" },
          { name: isFr ? "Résilience au stress" : "Pressure Adaptability", val: latestEval.adaptabilityScore, cat: "adapt" },
          { name: isFr ? "Structure comportementale" : "Behavioral Structure", val: latestEval.behavioralScore, cat: "behavioral" },
        ].filter(s => s.val !== undefined && s.val > 0);

        if (scores.length > 0) {
          scores.sort((a, b) => a.val! - b.val!);
          const lowestScore = scores[0];

          if (lowestScore && lowestScore.val! < 90) {
            hasDynamicSource = true;
            if (isFr) {
              focusTitle = `Renforcer : ${lowestScore.name}`;
              detailedAdvice = `Votre dernière simulation a révélé un point de blocage sur la compétence « ${lowestScore.name} » (${lowestScore.val}%). Conseil de Shana : Intégrez systématiquement des indicateurs d'impact financier et des justifications d'arbitrage claires aujourd'hui.`;
            } else {
              focusTitle = `Leverage area: ${lowestScore.name}`;
              detailedAdvice = `Your last mock run showed room for growth in "${lowestScore.name}" (${lowestScore.val}%). Coach tip: Solidify this metric today by focusing on explicit architectural justifications and quantifiable business outcomes.`;
            }
          }
        }
      }

      // If we have weakness text in the history item, make sure it's NOT a generic "completed successfully" string
      if (!hasDynamicSource && latestEval.weakness) {
        const weaknessText = latestEval.weakness.trim();
        const lowerW = weaknessText.toLowerCase();
        
        const isGenericSuccessMsg = lowerW.includes("terminée avec succès") || 
                                    lowerW.includes("completed successfully") ||
                                    lowerW.includes("simulation d'entretien") ||
                                    lowerW.includes("completed standard");

        if (!isGenericSuccessMsg && weaknessText.length > 10) {
          hasDynamicSource = true;
          if (isFr) {
            focusTitle = "Ajuster l'impact";
            detailedAdvice = `Votre dernière évaluation a relevé l'axe d'amélioration suivant : « ${weaknessText} ». Concentrez-vous sur la formulation rigoureuse de vos actions (méthode STAR) et de votre impact business aujourd'hui.`;
          } else {
            focusTitle = "Refine Presentation Quality";
            detailedAdvice = `Your latest assessment highlighted this critical area: "${weaknessText}". Practice structuring your answers to directly mitigate this pattern today.`;
          }
        }
      }

      // Fallback: if we still don't have a dynamic source (or latest weakness was a generic success message), 
      // custom-craft a hyper-personalized, realistic, industry-specific advice based on targetRole and industry!
      if (!hasDynamicSource) {
        const role = user.targetRole || (isFr ? "Leader" : "Executive Leader");
        const ind = user.industry || "Technology";
        
        if (isFr) {
          focusTitle = `GOUVERNANCE : ${role.toUpperCase()}`;
          detailedAdvice = `Pour cibler un poste de ${role} dans le secteur de la/du ${ind}, votre élocution doit projeter une autorité tranquille. Préparez des récits d'entretiens articulant comment vous pilotez la performance opérationnelle et mesurez l'impact en appliquant strictement la structure STAR.`;
        } else {
          focusTitle = `EXECUTIVE IMPACT: ${role.toUpperCase()}`;
          detailedAdvice = `Targeting a ${role} position within the ${ind} industry requires pristine delivery. Practice structuring your operational and strategic milestones under the STAR framework, focusing on hard KPIs and cost/time resource savings.`;
        }
      }

      return {
        focus: focusTitle,
        desc: detailedAdvice,
        action: isFr ? "S'entraîner à nouveau" : "Practice now",
        handler: nextActionHandler
      };
    }

    // 3. If they have parsed their CV but not yet performed any actual practice session
    const hasCvParsed = history.some(item => item.type === 'CV_PARSE');
    if (hasCvParsed) {
      return {
        focus: isFr ? "Lancer votre premier test" : "Launch Your First Vocal Test",
        desc: isFr
          ? "Votre CV a été analysé et cartographié avec succès ! Pour calibrer votre score d'assurance et obtenir vos premiers axes d'amélioration, lancez votre première simulation d'entretien maintenant."
          : "Your CV has been successfully mapped! To calibrate your initial readiness score and detect specific speech patterns, launch your first mock interview practice now.",
        action: isFr ? "S'entraîner maintenant" : "Start training",
        handler: nextActionHandler
      };
    }

    // 4. Default fallback
    return {
      focus: isFr ? "S'exercer aux imprévus" : "Pacing & Transitions Focus",
      desc: isFr
        ? "Vos bases vocales sont solides. Entraînez-vous à maintenir un rythme régulier sous stress (cible à 130-150 mots par minute)."
        : "Your baseline speech parameters look robust. Practice maintaining composed breathing and smooth transition pauses under high load.",
      action: isFr ? "Lancer une session" : "Practice now",
      handler: nextActionHandler
    };
  };

  const coachFocus = getCoachFocus();

  const session = StorageService.getSession();
  const userEmail = session?.user?.email?.toLowerCase().trim() || '';
  const currentUserRole = session?.user?.role || 'candidate';
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin' || userEmail === 'eocochat@gmail.com' || userEmail === 'superadmin@shana.com' || userEmail === 'admin@shana.com';

  return (
    <div id="dashboard-view" className="py-2 max-w-5xl mx-auto space-y-10 text-[#111111] font-sans antialiased relative z-10 selection:bg-[#18633F]/20">
      
      {/* =========================================
          ADMIN ACCESS BANNER FOR EASY DISCOVERABILITY
         ========================================= */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#EDFDF5] border-2 border-[#18633F]/30 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(24,99,63,0.15)] relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20 cursor-pointer hover:border-[#18633F]/50 transition-all group"
          onClick={() => onChangeTab('admin')}
        >
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-[#18633F]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#18633F]/10 rounded-xl border border-[#18633F]/20 text-[#18633F] group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest bg-[#D1FAE5] text-[#065F46] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                  {isFr ? "Accès Administrateur Détecté" : "Administrator Access Detected"}
                </span>
              </div>
              <h3 className="text-base font-black text-stone-900 mt-1.5 leading-tight">
                {isFr ? "Tableau de bord de Contrôle Admin" : "Admin Command Center"}
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xl">
                {isFr 
                  ? "Accédez aux statistiques globales, logs système, gestion des utilisateurs et simulateur d'emails."
                  : "Access global audience analytics, audit logs, system-wide config variables, and simulated email mailboxes."}
              </p>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChangeTab('admin');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#18633F] hover:bg-[#124d31] text-white font-black text-xs uppercase tracking-wider border-2 border-stone-950 transition-all cursor-pointer shadow-[3px_3px_0px_0px_#111111] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1px_1px_0px_0px_#111111]"
          >
            {isFr ? "Ouvrir l'Administration" : "Open Admin Panel"}
          </button>
        </motion.div>
      )}

      {/* =========================================
          PREMIUM MINIMAL BACKGROUND GRADIENT BLOBS
         ========================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft elegant warm neutral aura */}
        <div className="absolute top-[-10%] right-[15%] w-[380px] h-[380px] rounded-full bg-[#18633F] opacity-[0.01] filter blur-[100px]" />
        <div className="absolute bottom-[20%] left-[5%] w-[320px] h-[320px] rounded-full bg-stone-200 opacity-[0.03] filter blur-[120px]" />
      </div>

      {/* =========================================
          AREA 1: HEADER & GREETING
         ========================================= */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-stone-100/60 pb-8 relative z-10"
      >
        <div className="space-y-1.5 max-w-xl">
          <h1 id="dashboard-title" className="text-3xl md:text-4.5xl font-extrabold tracking-tight text-[#111111] leading-none select-none">
            {greetingWord}, <span className="text-[#111111]">{userFirstName}</span>.
          </h1>
          <p id="dashboard-subtitle" className="text-xs.5 md:text-sm font-medium text-stone-500 tracking-wide">
            {getDailySubtext()}
          </p>
        </div>

        {/* Minimal Controls Frame */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Interactive Custom Notifications Bell */}
          <button
            onClick={handleToggleNotifications}
            className={`p-3 rounded-full border-2 border-stone-950 transition-all cursor-pointer flex items-center justify-center ${
              notificationsActive 
                ? "bg-[#FF7E5F] text-stone-950 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]" 
                : "bg-white text-stone-700 hover:bg-stone-50 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]"
            }`}
            title={notificationsActive ? d.notificationActive : d.notificationInactive}
          >
            {notificationsActive ? (
              <Bell className="w-4 h-4 text-stone-950 animate-bounce" style={{ animationIterationCount: 1, animationDuration: '0.8s' }} />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>

          {/* Premium Token / Access Badge */}
          <div className="bg-white border-2 border-stone-950 py-2 px-4 rounded-[16px] flex items-center gap-3 shadow-[3.5px_3.5px_0px_0px_rgba(17,17,17,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(17,17,17,1)] transition-all">
            <div className="w-2.5 h-2.5 rounded-full bg-[#18633F] border border-stone-950" />
            <div className="text-left">
              <span className="text-[9px] font-mono font-black text-stone-500 uppercase tracking-widest block leading-none">
                {lang === 'FR' ? "ABONNEMENT" : "PREP MEMBERSHIP"}
              </span>
              <span className="text-[11px] font-black text-[#111111] mt-0.5 block leading-none">
                {monetization.ultraActive ? d.tokensUnlimited : `${monetization.freeAudio + monetization.packAudio + monetization.topUpAudio} ${d.tokensLeft}`}
              </span>
            </div>
            
            {/* Minimal Link Button to Trigger Upgrade Tab */}
            <button
              onClick={() => onChangeTab('purchase')}
              className="ml-2 px-3 py-1.5 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 border border-stone-950 font-black text-[9px] uppercase tracking-wider rounded-[8px] transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
            >
              {d.upgradeLink}
            </button>
          </div>

        </div>
      </motion.div>

      {/* =========================================
          AREA 2: MAIN CONTENT (HERO TODAY'S INTERVIEW)
         ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
        className="relative z-10"
      >
        <div className="bg-[#18633F] text-white rounded-[28px] md:rounded-[36px] p-8 md:p-11 relative overflow-hidden group border-[2.5px] border-stone-950 shadow-[6px_6px_0px_0px_#111111] hover:shadow-[8px_8px_0px_0px_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-300">
          
          {/* Accent decoration inside forest green card - highly minimalist */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/[0.04] to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-6 flex-1">
              
              {/* Card Label Tag - Beautiful Neo-brutalist Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#A7F3D0] border border-stone-950 shadow-[2px_2px_0px_0px_#111111]">
                <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-stone-955">
                  {d.primaryTag}
                </span>
              </div>

              {/* Target Role & Profile calibration */}
              <div className="space-y-2.5">
                <h2 className="text-2.5xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight uppercase">
                  {user.targetRole || d.rolePlaceholder}
                </h2>
                <p className="text-emerald-100/90 text-xs.5 md:text-sm font-medium max-w-xl leading-relaxed">
                  {!hasCV 
                    ? (isFr ? "Commençons par harmoniser SHANA avec votre parcours professionnel afin de personnaliser l'ensemble de vos simulations." : "Begin by aligning SHANA with your unique career milestones to customize all future verbal challenges.")
                    : voiceTrainingCount === 0
                    ? (isFr ? "Entraînez-vous sans pression pour calibrer votre intonation, votre clarté verbale et éradiquer vos hésitations." : "Initiate a private verbal warmup to let SHANA gauge your response rhythm, vocabulary patterns, and core pacing.")
                    : (isFr ? "Un ensemble complet de cas comportementaux et techniques adaptés à votre profil est configuré." : "Your customized matrix of situational STAR formats and critical design drills is primed.")}
                </p>
              </div>

              {/* Grid metadata info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-3 border-t border-white/10 max-w-lg">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-black text-emerald-200/60 uppercase tracking-widest block">{d.difficulty}</span>
                  <span className="text-xs font-black text-white block">
                    {user.experienceLevel === 'senior' || user.experienceLevel === 'executive' ? d.difficultySenior : d.difficultyJunior}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-black text-emerald-200/60 uppercase tracking-widest block">{d.estimatedDuration}</span>
                  <span className="text-xs font-black text-white block">{d.minutesText}</span>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[9px] font-mono font-black text-emerald-200/60 uppercase tracking-widest block">{d.interviewType}</span>
                  <span className="text-xs font-black text-white block">{nextActionType}</span>
                </div>
              </div>

            </div>

            {/* Right Side: High-contrast massive tactile Button */}
            <div className="w-full md:w-auto shrink-0">
              <button
                onClick={nextActionHandler}
                className="w-full md:w-auto px-8 py-4 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 font-black text-xs uppercase tracking-widest rounded-2xl border-[2px] border-stone-950 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all cursor-pointer flex items-center justify-center gap-3.5"
              >
                <span>{nextActionCTA}</span>
                <ArrowRight className="w-4 h-4 text-stone-950" />
              </button>
            </div>

          </div>
        </div>
      </motion.div>

      {/* =========================================
          AREA 3: SECONDARY CONTENT (TWO-COLUMN GRID)
         ========================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* COLUMN 1: PROGRESS & DYNAMIC RECOMMENDATIONS (Col span 5) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* A. Dynamic Progress Indicators (Under 5-sec read) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
            className="bg-white border-[2.5px] border-stone-950 rounded-[24px] p-6 space-y-6 shadow-[5px_5px_0px_0px_#111111] hover:shadow-[7px_7px_0px_0px_#111111] hover:translate-x-[-1.5px] hover:translate-y-[-1.5px] transition-all"
          >
            <div className="flex justify-between items-center pb-3.5 border-b-2 border-stone-950">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-4.5 rounded-sm bg-[#18633F] border border-stone-950 shrink-0" />
                <h3 className="text-xs.5 font-mono font-black uppercase tracking-wider text-[#111111]">
                  {d.progressTitle}
                </h3>
              </div>
              <TrendingUp className="w-4 h-4 text-[#18633F]" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              
              {/* Interviews Completed count */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-black text-stone-500 uppercase tracking-widest block leading-none">{d.completedTitle}</span>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-3xl font-black text-stone-950">{history.length}</span>
                </div>
              </div>

              {/* Consistency Streak */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-black text-stone-500 uppercase tracking-widest block leading-none">{d.streakTitle}</span>
                <div className="flex items-baseline gap-1 pt-1 text-orange-600">
                  <span className="text-3xl font-black text-stone-950">{getStreakCount()}</span>
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{d.streakText}</span>
                </div>
              </div>

              {/* Last Readiness Score */}
              <div className="space-y-1 col-span-2">
                <div className="flex justify-between items-center text-[10px] font-mono font-black text-stone-500 uppercase tracking-widest">
                  <span>{d.confidenceTitle}</span>
                  <span className="font-black text-stone-950">
                    {latestReadiness > 0 ? `${latestReadiness}%` : d.calibrateTag}
                  </span>
                </div>
                
                {/* Thick retro progress bar */}
                <div className="h-4.5 w-full bg-stone-100 border-[2px] border-stone-950 rounded-lg overflow-hidden mt-1.5 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${latestReadiness > 0 ? latestReadiness : 0}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="h-full bg-[#FF7E5F] border border-stone-950 rounded-[4px]"
                  />
                </div>
              </div>

              {/* Weekly Goal percentage bar */}
              <div className="space-y-1 col-span-2">
                <div className="flex justify-between items-center text-[10px] font-mono font-black text-stone-500 uppercase tracking-widest">
                  <span>{d.goalTitle}</span>
                  <span className="font-black text-stone-950">
                    {getCompletedThisWeek()}/5 {isFr ? "sessions" : "completed"}
                  </span>
                </div>
                
                {/* Thick progress bar */}
                <div className="h-4.5 w-full bg-stone-100 border-[2px] border-stone-950 rounded-lg overflow-hidden mt-1.5 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(getCompletedThisWeek() / 5) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    className="h-full bg-[#5363F1] border border-stone-950 rounded-[4px]"
                  />
                </div>
              </div>

            </div>
          </motion.div>

          {/* B. Dynamic Personalized AI Recommendations (MUSTARD GOLD NEO-POP CARD) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#EDC154] text-stone-950 border-[2.5px] border-stone-950 rounded-[24px] p-6.5 space-y-5.5 relative overflow-hidden group shadow-[5px_5px_0px_0px_#111111] hover:shadow-[7px_7px_0px_0px_#111111] hover:translate-x-[-1.5px] hover:translate-y-[-1.5px] transition-all"
          >
            {/* Ambient decorative background pattern */}
            <div className="absolute top-[-20%] right-[-20%] w-48 h-48 rounded-full bg-white/10 blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
            
            <div className="flex justify-between items-center pb-3.5 border-b-2 border-stone-950 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-950 opacity-85" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-stone-950" />
                </span>
                <h3 className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-950">
                  {d.coachFocusTitle}
                </h3>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950 border border-stone-950 text-[#EDC154] group-hover:rotate-12 transition-transform duration-300 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-2.5 relative z-10">
              <h4 className="font-extrabold text-lg tracking-tight leading-tight uppercase">
                {coachFocus.focus}
              </h4>
              <p className="text-xs font-semibold text-stone-900 leading-relaxed">
                {coachFocus.desc}
              </p>
            </div>

            <div className="pt-2 relative z-10">
              <button
                onClick={coachFocus.handler}
                className="group/btn w-full py-3.5 px-5 bg-stone-950 hover:bg-stone-900 text-[#EDC154] font-black text-xs uppercase tracking-widest rounded-2xl border-2 border-stone-950 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.15)] transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>{coachFocus.action}</span>
                <ArrowRight className="w-4 h-4 text-[#EDC154] transition-transform group-hover/btn:translate-x-1.5" />
              </button>
            </div>
          </motion.div>

          {/* Contextual Interview Tips Component */}
          <Tips targetRole={user.targetRole || ''} lang={lang === 'FR' ? 'FR' : 'EN'} />

        </div>

        {/* COLUMN 2: RECENT ACTIVITY TIMELINE (Col span 7) */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.2 }}
            className="bg-white border-[2.5px] border-stone-950 rounded-[24px] p-6 sm:p-8 space-y-6 shadow-[5px_5px_0px_0px_#111111] hover:shadow-[7px_7px_0px_0px_#111111] hover:translate-x-[-1.5px] hover:translate-y-[-1.5px] transition-all"
          >
            <div className="pb-3.5 border-b-2 border-stone-950 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-4.5 rounded-sm bg-emerald-500 border border-stone-950 shrink-0" />
                <h3 className="text-xs.5 font-mono font-black uppercase tracking-wider text-[#111111]">
                  {d.recentTitle}
                </h3>
              </div>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>

            {history.length === 0 ? (
              
              /* Redesigned Minimal Encouraging Empty State */
              <div className="py-14 text-center space-y-6 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto border-[2px] border-stone-950 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
                  <Layout className="w-6 h-6 text-stone-700 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm.5 text-[#111111] uppercase">
                    {d.noActivityTitle}
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed font-semibold">
                    {d.noActivitySub}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={nextActionHandler}
                    className="px-5 py-2.5 bg-stone-950 hover:bg-stone-900 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border-2 border-stone-950 shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,0.15)] active:translate-x-[2px] active:translate-y-[2px]"
                  >
                    {isFr ? "Commencer mon premier entretien" : "Launch first simulation"}
                  </button>
                </div>
              </div>

            ) : (

              /* Timeline of activities */
              <div className="relative pl-6 border-l-2 border-stone-950 space-y-8 py-2">
                {history.slice(0, 4).map((item) => {
                  const isAssess = item.type === 'ASSESS';
                  return (
                    <div key={item.id} className="relative space-y-2.5 group">
                      
                      {/* Timeline Dot with micro scale interaction on group hover */}
                      <div className="absolute -left-[32px] top-1 w-5 h-5 rounded-full border-[2px] border-stone-950 bg-[#FF7E5F] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#5363F1] shadow-[1px_1px_0px_0px_#111111]">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-950" />
                      </div>

                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div className="space-y-1.5">
                          {/* Item Meta */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-black text-stone-500 uppercase tracking-widest">
                              {item.date}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-stone-950" />
                            <span className="text-[9px] font-mono font-black uppercase bg-white border border-stone-950 px-2 py-0.5 rounded text-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                              {item.type === 'CV_PARSE' 
                                ? (isFr ? "ANALYSE DE CV" : "CV ANALYSIS")
                                : isAssess 
                                  ? (isFr ? "VIDÉO MIROIR" : "MIRROR VIDEO") 
                                  : (isFr ? "VOIX INTERACTIVE" : "VOICE ONLY")
                              }
                            </span>
                          </div>
                          
                          <h4 className="font-extrabold text-sm text-[#111111] pt-0.5 uppercase">
                            {user.targetRole || "Product Manager"}
                          </h4>
                        </div>

                        {/* Performance Score Badge */}
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 bg-stone-950 border border-stone-950 text-white text-xs font-black rounded-lg font-mono shadow-[2.5px_2.5px_0px_0px_rgba(17,17,17,1)]">
                            {item.score}/100
                          </span>
                        </div>
                      </div>

                      {/* Brief human review / feedback summary */}
                      <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-950 group-hover:bg-stone-100/60 transition-colors duration-250 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                        <p className="text-xs text-stone-700 leading-relaxed font-semibold">
                          {item.weakness ? (
                            <span>
                              <strong className="text-stone-950 font-black">
                                {item.type === 'CV_PARSE'
                                  ? (isFr ? "Statut de l'analyse : " : "Analysis status: ")
                                  : (isFr ? "Faiblesse relevée : " : "Improvement area: ")
                                }
                              </strong>
                              {item.weakness}
                            </span>
                          ) : (
                            <span>{isFr ? "Performance robuste et fluide enregistrée lors de la session." : "Verbal consistency and delivery structure fully approved under load."}</span>
                          )}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>

            )}
          </motion.div>
        </div>

      </div>

      {/* =========================================
          AREA 3.5: AI CONSISTENCY CALENDAR SCHEDULER (FULL WIDTH)
         ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.22 }}
        className="relative z-10 my-4"
      >
        <CalendarScheduler user={user} history={history} lang={lang} />
      </motion.div>

      {/* =========================================
          AREA 4: DETAILED PERFORMANCE ANALYTICS & ACTIVE AUDITING (BENTO GRID)
         ========================================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.25 }}
        className="space-y-8 relative z-10 pt-4 border-t border-stone-100/60"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-5.5 rounded-sm bg-[#5363F1] border border-stone-950 shrink-0" />
            <div>
              <h3 className="text-sm font-mono font-black uppercase tracking-wider text-[#111111]">
                {isFr ? "Analyses et Diagnostic de Parole" : "Speech & Competency Analytics"}
              </h3>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">
                {isFr ? "Évaluation en temps réel des performances orales" : "Live feedback of physical and cognitive delivery"}
              </p>
            </div>
          </div>

          {/* Toggle for Advanced Machine Learning Log */}
          <button
            onClick={() => setShowAudit(!showAudit)}
            className={`px-4 py-2 text-[10px] font-mono font-black uppercase tracking-wider rounded-xl border-2 border-stone-950 transition-all cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] ${
              showAudit 
                ? 'bg-stone-950 text-white shadow-none translate-x-[1.5px] translate-y-[1.5px]' 
                : 'bg-white text-stone-950 hover:bg-stone-50'
            }`}
          >
            {showAudit 
              ? (isFr ? "Masquer Log d'Audit" : "Hide Technical Audit") 
              : (isFr ? "Log d'Auto-Optimisation IA" : "View AI Self-Optimization Log")}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {showAudit ? (
            <motion.div
              key="audit-view"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <LearningValidationAudit userId={user.id || 'usr_candidate'} lang={lang} />
            </motion.div>
          ) : (
            <motion.div
              key="charts-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Radar Chart Card */}
              <div className="lg:col-span-5 flex flex-col">
                <React.Suspense fallback={<div className="h-[300px] flex items-center justify-center text-xs font-mono text-stone-400 bg-stone-50 border border-dashed border-stone-200 rounded-xl">Loading performance radar...</div>}>
                  <PerformanceRadar history={history} lang={lang} />
                </React.Suspense>
              </div>

              {/* Progress Line Chart Card */}
              <div className="lg:col-span-7 flex flex-col">
                <React.Suspense fallback={<div className="h-[300px] flex items-center justify-center text-xs font-mono text-stone-400 bg-stone-50 border border-dashed border-stone-200 rounded-xl">Loading progress chart...</div>}>
                  <ProgressChart history={history} lang={lang} />
                </React.Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
