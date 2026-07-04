import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LandingPage from './components/LandingPage';
import OnboardingFlow from './components/OnboardingFlow';
import AuthScreens from './components/AuthScreens';
import InfoPages from './components/InfoPages';
import { StorageService } from './lib/storage';
import { ToastProvider } from './components/Toast';
import CookieConsentBanner from './components/CookieConsentBanner';
import { getCookie } from './lib/cookies';
import { getBrowserLanguage } from './utils';
import CelebrationConfetti from './components/CelebrationConfetti';
import SparklineHeaderTrend from './components/SparklineHeaderTrend';
import { Sliders, X, RefreshCw, HelpCircle, Camera, Mic, Loader2, FlipHorizontal } from 'lucide-react';

const tooltipVariants = {
  rest: { opacity: 0, y: 10, scale: 0.95 },
  hover: { opacity: 1, y: 0, scale: 1 }
};

export default function App() {
  const [checkedSession, setCheckedSession] = useState(false);
  const [view, setView] = useState<'landing' | 'onboarding' | 'auth' | 'info'>('landing');
  const [activeInfoPage, setActiveInfoPage] = useState<string>('how-it-works');

  const [lang, setLang] = useState<'EN' | 'FR'>(() => {
    const activeLangCookie = getCookie('shana_lang');
    if (activeLangCookie === 'FR') return 'FR';
    if (activeLangCookie === 'EN') return 'EN';
    return getBrowserLanguage();
  });

  const [authInitialView, setAuthInitialView] = useState<'signup' | 'login' | 'forgot-password' | 'profile-creation' | 'home'>('login');

  const [prefilledUser, setPrefilledUser] = useState<{ firstName: string; lastName: string; targetRole: string; lang: 'EN' | 'FR' } | null>(null);

  // Global progress states
  const [progress, setProgress] = useState(0);
  const [progressSteps, setProgressSteps] = useState<{ label: string; completed: boolean; description: string }[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [showSubtleCelebration, setShowSubtleCelebration] = useState(false);
  const [activeMobileStepIdx, setActiveMobileStepIdx] = useState<number | null>(null);
  const prevProgressRef = useRef<number>(-1);

  // Diagnostic states
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<{
    browserSupportsMedia: boolean;
    cameraAccess: 'allowed' | 'blocked' | 'not-found' | 'error';
    micAccess: 'allowed' | 'blocked' | 'not-found' | 'error';
    cameraDevices: MediaDeviceInfo[];
    micDevices: MediaDeviceInfo[];
    errorDetails: string | null;
  } | null>(null);

  const runDiagnosticCheck = async () => {
    setIsDiagnosticModalOpen(true);
    setDiagnosticLoading(true);
    setDiagnosticResults(null);

    const results: {
      browserSupportsMedia: boolean;
      cameraAccess: 'allowed' | 'blocked' | 'not-found' | 'error';
      micAccess: 'allowed' | 'blocked' | 'not-found' | 'error';
      cameraDevices: MediaDeviceInfo[];
      micDevices: MediaDeviceInfo[];
      errorDetails: string | null;
    } = {
      browserSupportsMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      cameraAccess: 'blocked',
      micAccess: 'blocked',
      cameraDevices: [],
      micDevices: [],
      errorDetails: null,
    };

    if (!results.browserSupportsMedia) {
      setDiagnosticResults(results);
      setDiagnosticLoading(false);
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      results.cameraDevices = devices.filter(d => d.kind === 'videoinput');
      results.micDevices = devices.filter(d => d.kind === 'audioinput');
    } catch (e) {
      console.warn("Failed enumerating devices during diagnostics in App:", e);
    }

    // Test Camera
    if (results.cameraDevices.length === 0) {
      results.cameraAccess = 'not-found';
    } else {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        results.cameraAccess = 'allowed';
        camStream.getTracks().forEach(t => t.stop());
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          results.cameraAccess = 'blocked';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          results.cameraAccess = 'not-found';
        } else {
          results.cameraAccess = 'error';
          results.errorDetails = `Camera check error: ${err.message || err.name}`;
        }
      }
    }

    // Test Microphone
    if (results.micDevices.length === 0) {
      results.micAccess = 'not-found';
    } else {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        results.micAccess = 'allowed';
        micStream.getTracks().forEach(t => t.stop());
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          results.micAccess = 'blocked';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          results.micAccess = 'not-found';
        } else {
          results.micAccess = 'error';
          results.errorDetails = results.errorDetails 
            ? `${results.errorDetails} | Mic check error: ${err.message || err.name}`
            : `Mic check error: ${err.message || err.name}`;
        }
      }
    }

    setDiagnosticResults(results);
    setDiagnosticLoading(false);
  };

  // Live Camera Preview states
  const [headerCameraStream, setHeaderCameraStream] = useState<MediaStream | null>(null);
  const [isHeaderCameraActive, setIsHeaderCameraActive] = useState(false);
  const [isHeaderCameraMirrored, setIsHeaderCameraMirrored] = useState(true);
  const [headerCameraError, setHeaderCameraError] = useState<string | null>(null);
  const headerVideoRef = useRef<HTMLVideoElement | null>(null);

  const toggleHeaderCamera = async () => {
    if (isHeaderCameraActive) {
      if (headerCameraStream) {
        headerCameraStream.getTracks().forEach(track => track.stop());
        setHeaderCameraStream(null);
      }
      setIsHeaderCameraActive(false);
    } else {
      setHeaderCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 120, height: 120 },
          audio: false,
        });
        setHeaderCameraStream(stream);
        setIsHeaderCameraActive(true);
      } catch (err: any) {
        console.error("Error accessing camera for live preview:", err);
        setHeaderCameraError(err.name === 'NotAllowedError' ? 'Blocked' : 'Error');
        runDiagnosticCheck();
      }
    }
  };

  useEffect(() => {
    if (headerVideoRef.current && headerCameraStream) {
      headerVideoRef.current.srcObject = headerCameraStream;
    }
  }, [headerCameraStream, isHeaderCameraActive]);

  useEffect(() => {
    return () => {
      if (headerCameraStream) {
        headerCameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [headerCameraStream]);

  useEffect(() => {
    const handleStopHeaderCam = () => {
      if (headerCameraStream) {
        headerCameraStream.getTracks().forEach(track => track.stop());
        setHeaderCameraStream(null);
      }
      setIsHeaderCameraActive(false);
    };
    window.addEventListener('shana_stop_header_camera', handleStopHeaderCam);
    return () => {
      window.removeEventListener('shana_stop_header_camera', handleStopHeaderCam);
    };
  }, [headerCameraStream]);

  useEffect(() => {
    if (progress === 100 && !hasCelebrated) {
      setShowCelebration(true);
      setHasCelebrated(true);
    } else if (progress < 100) {
      setHasCelebrated(false);
    }

    const prevProgress = prevProgressRef.current;
    // Trigger subtle celebration when progress increases, but we are not yet at 100%,
    // and we had a valid initialized previous progress value.
    if (prevProgress >= 0 && progress > prevProgress && progress < 100) {
      setShowSubtleCelebration(true);
    }
    prevProgressRef.current = progress;
  }, [progress, hasCelebrated]);

  const calculateProgress = () => {
    const session = StorageService.getSession();
    if (!session) {
      setProgress(0);
      setProgressSteps([]);
      return;
    }

    const userId = session.user.id;
    const isFrench = session.profile.language === 'French' || lang === 'FR';

    const steps = [
      {
        label: isFrench ? "Profil" : "Profile Setup",
        completed: session.profile.onboardingCompleted && !!session.profile.targetRole,
        description: isFrench 
          ? "Remplissage du questionnaire initial et définition de votre poste ciblé pour adapter l'IA."
          : "Initial questionnaire filled and target job configured to customize the AI's prompts."
      },
      {
        label: isFrench ? "CV Analysé" : "CV Analyzed",
        completed: !!StorageService.getAnalysis(userId),
        description: isFrench
          ? "Votre Curriculum Vitae a été importé et ses compétences clés ont été extraites avec succès."
          : "Your Resume has been uploaded and analyzed to map out key professional strengths."
      },
      {
        label: isFrench ? "Voix Entraînée" : "Voice Training",
        completed: StorageService.getVoiceSessionsCount(userId) > 0,
        description: isFrench
          ? "Exercice pratique d'élocution à voix haute complété et mesuré par l'analyseur audio."
          : "Oral speech exercise completed and metrics captured via the real-time audio analyzer."
      },
      {
        label: isFrench ? "Évaluation" : "Assessment",
        completed: (StorageService.getHistory(userId) || []).some((item: any) => item.type === 'INTERVIEW' || item.type === 'ASSESSMENT'),
        description: isFrench
          ? "Simulation d'entretien finale complète réalisée, avec notation globale et feedback."
          : "Full simulation assessment completed, generating aggregate scores and deep feedback."
      }
    ];

    const completedCount = steps.filter(s => s.completed).length;
    setProgress(completedCount * 25);
    setProgressSteps(steps);
  };

  useEffect(() => {
    calculateProgress();

    const handleProgressUpdate = () => {
      calculateProgress();
    };

    window.addEventListener('shana_progress_update', handleProgressUpdate);
    return () => {
      window.removeEventListener('shana_progress_update', handleProgressUpdate);
    };
  }, [view, lang]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.userId) {
            StorageService.setSessionInMemory(data.userId);
            const user = StorageService.getUser(data.userId);
            const profile = StorageService.getProfile(data.userId);
            if (user && profile) {
              setView('auth');
              setAuthInitialView(profile.onboardingCompleted ? 'home' : 'profile-creation');
            }
          }
        }
      } catch (err) {
        console.error('[SHANA App] Session initial check error:', err);
      } finally {
        setCheckedSession(true);
      }
    };

    fetchSession();
  }, []);

  const handleStartOnboarding = () => {
    setPrefilledUser(null);
    setView('onboarding');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartLogin = () => {
    setAuthInitialView('login');
    setView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOnboardingComplete = (profile: { firstName: string; lastName: string; targetRole: string; lang: 'EN' | 'FR' }) => {
    const session = StorageService.getSession();
    if (session) {
      setAuthInitialView(session.profile.onboardingCompleted ? 'home' : 'profile-creation');
    } else {
      setPrefilledUser(profile);
      setAuthInitialView('signup');
    }
    setView('auth');
  };

  if (!checkedSession) {
    return (
      <div className="w-full h-screen bg-[#F3F4F6] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-r-2 border-[#1A2B3C] rounded-full animate-spin"></div>
          <span className="font-mono text-xs font-black tracking-widest text-[#1A2B3C] animate-pulse">S</span>
        </div>
        <p className="font-mono text-[9px] text-[#6B7280] uppercase tracking-widest font-bold tracking-tight">
          SECURE CREDENTIAL TRANSMISSION...
        </p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div 
        id="app-root" 
        className="w-full h-full min-h-screen premium-mesh-bg text-[#111111] font-sans antialiased relative"
      >
        {view === 'landing' && (
          <LandingPage 
            onStartOnboarding={handleStartOnboarding} 
            onStartLogin={handleStartLogin}
            lang={lang}
            onChangeLang={setLang}
            onNavigatePage={(p) => {
              setActiveInfoPage(p);
              setView('info');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
        
        {view === 'onboarding' && (
          <OnboardingFlow 
            onBackToLanding={handleBackToLanding}
            onComplete={handleOnboardingComplete}
          />
        )}

        {view === 'auth' && (
          <div className="flex flex-col min-h-screen">
            {/* Real-time celebration confetti canvas when reaching 100% progress */}
            <CelebrationConfetti active={showCelebration} onComplete={() => setShowCelebration(false)} />

            {/* Subtle burst animation when a single step completes */}
            <CelebrationConfetti active={showSubtleCelebration} variant="subtle" onComplete={() => setShowSubtleCelebration(false)} />

            {/* Real-time Global Progress Header Bar */}
            <motion.div 
              id="global-progress-header" 
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.1 }}
              className="bg-[#BAC9BE] text-stone-950 border-b-[2.5px] border-stone-950 px-4 py-2.5 text-xs font-sans select-none sticky top-0 z-50 transition-all duration-300"
            >
              <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 border border-stone-950 animate-pulse shrink-0" />
                  <span className="font-black tracking-wider uppercase text-[9px] bg-white border-[1.5px] border-stone-950 text-stone-950 px-2.5 py-1 rounded-md shadow-[1.5px_1.5px_0px_0px_#111111]">
                    {lang === 'FR' ? "AVANCEMENT" : "PROGRESS"} : {progress}%
                  </span>

                  {/* Elegant sparkline weekly trend */}
                  <SparklineHeaderTrend userId={StorageService.getSession()?.user?.id || 'guest'} lang={lang} />

                  {/* Global media diagnostic check trigger button */}
                  <button
                    onClick={runDiagnosticCheck}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-white hover:bg-stone-50 text-stone-950 border-[1.5px] border-stone-950 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#111111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_0px_#111111] font-sans"
                    title={lang === 'FR' ? "Lancer le diagnostic caméra & micro" : "Run camera & microphone diagnostic"}
                  >
                    <Sliders className="w-3 h-3 text-stone-950" />
                    <span>{lang === 'FR' ? "Diagnostic" : "Diagnostic Check"}</span>
                  </button>

                  {/* Circular 'Live Camera Preview' Toggle with 40x40 picture-in-picture window */}
                  <div className="inline-flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={toggleHeaderCamera}
                      className={`relative flex items-center justify-center w-6 h-6 rounded-md border-[1.5px] border-stone-950 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#111111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_0px_#111111] outline-none ${
                        isHeaderCameraActive 
                          ? 'bg-[#FF7E5F] text-stone-950 animate-pulse' 
                          : 'bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                      title={lang === 'FR' ? "Aperçu Caméra en Direct" : "Live Camera Preview"}
                    >
                      <Camera className="w-3 h-3" />
                      {isHeaderCameraActive && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                      )}
                    </button>

                    {isHeaderCameraActive && (
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-10 h-10 rounded-full border-2 border-emerald-500 overflow-hidden relative bg-black shadow-lg shrink-0 transition-all"
                          title={lang === 'FR' ? "Flux caméra actif (40x40)" : "Active camera feed (40x40)"}
                        >
                          <video
                            ref={headerVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover transition-transform duration-300 ${
                              isHeaderCameraMirrored ? 'scale-x-[-1]' : 'scale-x-100'
                            }`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        </div>

                        <button
                          id="header-camera-mirror-toggle"
                          onClick={() => setIsHeaderCameraMirrored(!isHeaderCameraMirrored)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200/60 transition-all cursor-pointer active:scale-95 shadow-2xs font-sans outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1"
                          title={lang === 'FR' ? "Activer/désactiver l'effet miroir de la vidéo" : "Toggle camera video mirror effect"}
                        >
                          <FlipHorizontal className={`w-3.5 h-3.5 text-slate-400 ${isHeaderCameraMirrored ? 'text-emerald-500' : ''}`} />
                          <span>{lang === 'FR' ? "Miroir" : "Mirror Video"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Premium Expert Badge */}
                  {progress === 100 && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.3 }}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-[0_2px_10px_rgba(245,158,11,0.2)] border border-amber-300/30 select-none animate-pulse font-sans"
                    >
                      ★ {lang === 'FR' ? "EXPERT" : "EXPERT"}
                    </motion.span>
                  )}
                  
                  {/* Delighting 100% completion manual replay button */}
                  {progress === 100 && (
                    <button
                      onClick={() => {
                        setShowCelebration(false);
                        // Brief timeout to let any active instances unmount and cleanly re-burst
                        setTimeout(() => setShowCelebration(true), 80);
                      }}
                      className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 shadow-xs transition-all cursor-pointer active:scale-95 font-sans outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1"
                      title={lang === 'FR' ? "Lancer l'animation de célébration !" : "Trigger the celebration animation!"}
                    >
                      🎉 {lang === 'FR' ? "Rejouer" : "Replay"}
                    </button>
                  )}
                </div>
                
                {/* Steps tracker indicator capsules */}
                <div className="flex items-center gap-2 overflow-x-auto sm:overflow-visible flex-nowrap sm:flex-wrap max-w-full pb-2.5 sm:pb-0 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                  {progressSteps.map((step, idx) => (
                    <motion.div 
                      key={idx} 
                      tabIndex={0}
                      role="button"
                      aria-label={`${step.label} step`}
                      initial="rest"
                      whileHover="hover"
                      onClick={() => {
                        // Toggle selected step details on mobile devices
                        setActiveMobileStepIdx(activeMobileStepIdx === idx ? null : idx);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveMobileStepIdx(activeMobileStepIdx === idx ? null : idx);
                        }
                      }}
                      className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-extrabold border transition-all cursor-pointer sm:cursor-help shrink-0 select-none font-sans outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1 ${
                        step.completed 
                          ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-600 shadow-xs' 
                          : 'bg-slate-50/50 border-slate-200/50 text-slate-400'
                      } ${activeMobileStepIdx === idx ? 'ring-1 ring-emerald-500/40 border-emerald-500/30' : ''}`}
                    >
                      <span className="text-[10px] leading-none">{step.completed ? '✓' : '○'}</span>
                      <span className="uppercase tracking-wide">{step.label}</span>

                      {/* Tooltip Card - Shown ONLY on desktop devices (hidden on mobile to prevent clipping) */}
                      <motion.div 
                        variants={tooltipVariants}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="hidden sm:block absolute top-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2.5 w-60 p-3 bg-white text-slate-600 rounded-xl border border-slate-200 shadow-lg z-50 text-left font-sans normal-case tracking-normal pointer-events-none"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
                          <span className="font-sans text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">{step.label}</span>
                          <span className={`font-sans text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            step.completed 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-155' 
                              : 'bg-slate-100 text-slate-400 border border-slate-200/40'
                          }`}>
                            {step.completed ? (lang === 'FR' ? "Complété" : "Completed") : (lang === 'FR' ? "À faire" : "Pending")}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[10px] leading-relaxed font-medium">
                          {step.description}
                        </p>
                        
                        {/* Little indicator tooltip arrow */}
                        <div className="absolute bottom-full right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-2 h-2 bg-white border-t border-l border-slate-200 rotate-45 translate-y-[5px]" />
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Mobile-only interactive step details banner */}
              <AnimatePresence>
                {activeMobileStepIdx !== null && progressSteps[activeMobileStepIdx] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="sm:hidden overflow-hidden border-t border-slate-100 mt-2.5 pt-2.5 w-full"
                  >
                    <div className="bg-white rounded-xl border border-slate-200/80 p-3 text-left shadow-2xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-sans text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
                          {progressSteps[activeMobileStepIdx].label}
                        </span>
                        <span className={`font-sans text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          progressSteps[activeMobileStepIdx].completed 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-155' 
                            : 'bg-slate-150 text-slate-400 border border-slate-200/40'
                        }`}>
                          {progressSteps[activeMobileStepIdx].completed ? (lang === 'FR' ? "Complété" : "Completed") : (lang === 'FR' ? "À faire" : "Pending")}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[10px] leading-relaxed font-medium font-sans">
                        {progressSteps[activeMobileStepIdx].description}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Thin glowing linear visual progress indicator */}
              <div 
                className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-indigo-500 via-emerald-500 to-emerald-400 shadow-[0_1px_4px_rgba(16,185,129,0.2)] transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </motion.div>

            <AuthScreens
              initialView={authInitialView}
              prefilledUser={prefilledUser}
              onLogout={handleBackToLanding}
              onCompleteAll={() => {
                alert('Congratulations! Phase 2 is fully complete and functional in the build preview.');
              }}
            />
          </div>
        )}

        {view === 'info' && (
          <InfoPages
            page={activeInfoPage}
            lang={lang}
            onChangeLang={setLang}
            onNavigateHome={handleBackToLanding}
            onNavigatePage={(p) => {
              setActiveInfoPage(p);
              setView('info');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onStartLogin={handleStartLogin}
            onStartOnboarding={handleStartOnboarding}
          />
        )}

        {/* Global Cookie Consent System Banner */}
        <CookieConsentBanner lang={lang} />

        {/* DEVICE DIAGNOSTIC MODAL */}
        <AnimatePresence>
          {isDiagnosticModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="bg-white border border-[#E5E7EB] w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-6 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#1A2B3C]/5 text-[#1A2B3C] rounded-xl flex items-center justify-center border border-[#E5E7EB]">
                      <Sliders className="w-4 h-4 text-[#1A2B3C]" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm font-extrabold text-[#1A2B3C] uppercase tracking-wide">
                        {lang === 'EN' ? "System Diagnostics" : "Diagnostic Matériel & Médias"}
                      </h2>
                      <p className="text-[10px] text-[#6B7280] font-mono tracking-wider">
                        {lang === 'EN' ? "WEBCAM & MICROPHONE VERIFICATION" : "VÉRIFICATION DE LA CAMÉRA & MICROPHONE"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDiagnosticModalOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-zinc-200/50 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                  
                  {/* Browser Support Row */}
                  <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-150 rounded-2xl">
                    <div className="space-y-0.5 text-left">
                      <p className="font-bold text-[#1A2B3C]">
                        {lang === 'EN' ? "Browser Media Capabilities" : "Compatibilité du Navigateur"}
                      </p>
                      <p className="text-[10.5px] text-[#6B7280]">
                        {lang === 'EN' ? "Detecting modern WebRTC standards" : "Détection des API standards WebRTC"}
                      </p>
                    </div>
                    {(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) ? (
                      <span className="px-2.5 py-1 bg-red-50 border border-red-100 text-red-700 rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider">
                        {lang === 'EN' ? "Unsupported" : "Incompatible"}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        {lang === 'EN' ? "Supported" : "Compatible"}
                      </span>
                    )}
                  </div>

                  {/* Diagnostics Status Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* CAMERA CARD */}
                    <div className="p-4 border border-zinc-150 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-50 text-indigo-650 rounded-lg">
                            <Camera className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-[#1A2B3C]">{lang === 'EN' ? "Camera" : "Caméra"}</span>
                        </div>
                        
                        {diagnosticLoading ? (
                          <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                        ) : diagnosticResults ? (
                          diagnosticResults.cameraAccess === 'allowed' ? (
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md font-mono text-[9px] font-bold uppercase">
                              {lang === 'EN' ? "Allowed" : "Autorisé"}
                            </span>
                          ) : diagnosticResults.cameraAccess === 'not-found' ? (
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-md font-mono text-[9px] font-bold uppercase">
                              {lang === 'EN' ? "No Hardware" : "Absent"}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-700 rounded-md font-mono text-[9px] font-bold uppercase">
                              {lang === 'EN' ? "Blocked" : "Bloqué"}
                            </span>
                          )
                        ) : (
                          <span className="text-zinc-400 font-mono text-[9px]">—</span>
                        )}
                      </div>

                      <div className="space-y-1 text-left">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 font-mono">
                          {lang === 'EN' ? "DETECTED WEBCAMS" : "APPAREILS DÉTECTÉS"}
                        </p>
                        {diagnosticLoading ? (
                          <p className="text-[10.5px] text-zinc-400 italic">{lang === 'EN' ? "Scanning..." : "Scan en cours..."}</p>
                        ) : diagnosticResults && diagnosticResults.cameraDevices.length > 0 ? (
                          <div className="space-y-1 max-h-[48px] overflow-y-auto">
                            {diagnosticResults.cameraDevices.map((dev, idx) => (
                              <p key={idx} className="text-[10.5px] font-semibold text-[#1A2B3C] truncate">
                                • {dev.label || `${lang === 'EN' ? "Camera" : "Caméra"} ${idx + 1}`}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10.5px] text-zinc-400 italic">
                            {lang === 'EN' ? "No cameras listed." : "Aucune caméra listée."}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* MICROPHONE CARD */}
                    <div className="p-4 border border-zinc-150 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-teal-50 text-teal-650 rounded-lg">
                            <Mic className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-[#1A2B3C]">{lang === 'EN' ? "Microphone" : "Microphone"}</span>
                        </div>
                        
                        {diagnosticLoading ? (
                          <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                        ) : diagnosticResults ? (
                          diagnosticResults.micAccess === 'allowed' ? (
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md font-mono text-[9px] font-bold uppercase">
                              {lang === 'EN' ? "Allowed" : "Autorisé"}
                            </span>
                          ) : diagnosticResults.micAccess === 'not-found' ? (
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-md font-mono text-[9px] font-bold uppercase">
                              {lang === 'EN' ? "No Hardware" : "Absent"}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-700 rounded-md font-mono text-[9px] font-bold uppercase">
                              {lang === 'EN' ? "Blocked" : "Bloqué"}
                            </span>
                          )
                        ) : (
                          <span className="text-zinc-400 font-mono text-[9px]">—</span>
                        )}
                      </div>

                      <div className="space-y-1 text-left">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 font-mono">
                          {lang === 'EN' ? "DETECTED MICROPHONES" : "MICROS DÉTECTÉS"}
                        </p>
                        {diagnosticLoading ? (
                          <p className="text-[10.5px] text-zinc-400 italic">{lang === 'EN' ? "Scanning..." : "Scan en cours..."}</p>
                        ) : diagnosticResults && diagnosticResults.micDevices.length > 0 ? (
                          <div className="space-y-1 max-h-[48px] overflow-y-auto">
                            {diagnosticResults.micDevices.map((dev, idx) => (
                              <p key={idx} className="text-[10.5px] font-semibold text-[#1A2B3C] truncate">
                                • {dev.label || `${lang === 'EN' ? "Microphone" : "Microphone"} ${idx + 1}`}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10.5px] text-zinc-400 italic">
                            {lang === 'EN' ? "No microphones listed." : "Aucun micro listé."}
                          </p>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* HELPFUL STEP-BY-STEP ACCESS RECOVERY INSTRUCTIONS */}
                  {diagnosticResults && (diagnosticResults.cameraAccess === 'blocked' || diagnosticResults.micAccess === 'blocked') && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-[24px] space-y-3 text-left">
                      <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
                        <HelpCircle className="w-4.5 h-4.5 text-amber-700" />
                        <h4 className="font-bold text-amber-900 uppercase font-mono text-[10px] tracking-wider">
                          {lang === 'EN' ? "How to Grant Browser Permissions" : "Comment Autoriser les Périphériques"}
                        </h4>
                      </div>

                      <div className="space-y-2.5 text-amber-950 text-[11px] leading-relaxed font-semibold">
                        <div>
                          <p className="font-bold text-[#1A2B3C]">
                            1. {lang === 'EN' ? "Google Chrome / Microsoft Edge" : "Google Chrome / Microsoft Edge"}
                          </p>
                          <p className="pl-3 mt-0.5 text-amber-800">
                            {lang === 'EN' 
                              ? "Look at the left of the address bar. Click the padlock or settings icon (⚙️ / 🔒), then toggle Camera and Microphone to 'Allow' and reload the page."
                              : "Regardez à gauche de la barre d'adresse URL. Cliquez sur l'icône de cadenas ou de réglages (⚙️ / 🔒), activez la Caméra et le Microphone sur 'Autoriser', puis actualisez la page."}
                          </p>
                        </div>

                        <div>
                          <p className="font-bold text-[#1A2B3C]">
                            2. {lang === 'EN' ? "Apple Safari (macOS & iOS)" : "Apple Safari (macOS & iOS)"}
                          </p>
                          <p className="pl-3 mt-0.5 text-amber-800">
                            {lang === 'EN'
                              ? "On macOS, go to the menu Safari -> Settings for This Website -> set Camera and Microphone to 'Allow'. On iOS, open Settings -> Safari -> Camera/Microphone -> set to 'Allow'."
                              : "Sur macOS, allez dans le menu Safari -> Réglages pour ce site -> réglez l'Appareil photo et le Microphone sur 'Autoriser'. Sur iOS, allez dans Réglages -> Safari -> Appareil photo/Microphone -> réglez sur 'Autoriser'."}
                          </p>
                        </div>

                        <div>
                          <p className="font-bold text-[#1A2B3C]">
                            3. {lang === 'EN' ? "Mozilla Firefox" : "Mozilla Firefox"}
                          </p>
                          <p className="pl-3 mt-0.5 text-amber-800">
                            {lang === 'EN'
                              ? "Click the small camera or microphone icon that appears just to the left of your URL bar. Click the 'X' next to 'Blocked' to clear the block, then reload."
                              : "Cliquez sur la petite icône de caméra/micro qui s'affiche à gauche de votre barre d'adresse. Retirez le statut 'Bloqué temporairement' en cliquant sur la croix, puis actualisez."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t border-[#F3F4F6] bg-[#F9FAFB] flex justify-between items-center gap-3">
                  <button
                    onClick={() => setIsDiagnosticModalOpen(false)}
                    className="px-5 py-3 border border-zinc-200 text-[#1A2B3C] hover:bg-zinc-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex-1 text-center font-sans"
                  >
                    {lang === 'EN' ? "Dismiss" : "Fermer"}
                  </button>
                  <button
                    onClick={runDiagnosticCheck}
                    disabled={diagnosticLoading}
                    className="px-5 py-3 bg-[#1A2B3C] hover:bg-[#2C3E50] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex-1 flex items-center justify-center gap-2 cursor-pointer shadow-md font-sans"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${diagnosticLoading ? 'animate-spin' : ''}`} />
                    <span>{lang === 'EN' ? "Scan & Try Again" : "Scanner à Nouveau"}</span>
                  </button>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastProvider>
  );
}
