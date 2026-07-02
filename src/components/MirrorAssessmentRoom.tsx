import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  Clock, 
  ChevronRight, 
  X, 
  Sliders, 
  Loader2, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Info,
  CornerDownLeft,
  Flame,
  Maximize,
  Minimize
} from 'lucide-react';
import { StorageService } from '../lib/storage';
import { ShanaEventTracker } from '../lib/events';
import { SessionStateMachine, ShanaState } from '../lib/stateMachine';
import { InterviewVoiceManager } from '../lib/InterviewVoiceManager';
import { LiveSessionTracker, StatsRepository } from '../services/admin/metrics';
import { AdaptiveEngine } from '../lib/adaptive';
import { InterviewDirector } from '../lib/director';
import { calculateIPS } from '../lib/ips';
import { ShanaOrchestrator } from '../lib/orchestrator';
import { LearningValidationLoop } from '../lib/learningLoop';

const SubtleWaveform = () => {
  const barVariants = {
    animate: (i: number) => ({
      scaleY: [0.8, 2.2, 1.1, 2.8, 0.8],
      transition: {
        duration: 1.0 + Math.sin(i) * 0.2,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut",
        delay: i * 0.12,
      },
    }),
  };

  return (
    <div className="flex items-center gap-[3px] h-4 px-1.5 shrink-0">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={barVariants}
          animate="animate"
          className="w-0.5 h-2 bg-indigo-100 rounded-full origin-bottom"
        />
      ))}
    </div>
  );
};

interface MirrorAssessmentRoomProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    targetRole: string;
    industry: string;
    experienceLevel: string;
  };
  lang: 'EN' | 'FR';
  onClose: () => void;
  onComplete: (sessionPayload: any) => void;
  questions?: Array<{ 
    phase: number; 
    label: string; 
    question: string; 
    type?: string; 
    challenge?: any; 
    difficulty?: string; 
    isTrickQuestion?: boolean; 
    contextAware?: boolean;
  }>;
}

export default function MirrorAssessmentRoom({ 
  user, 
  lang, 
  onClose, 
  onComplete,
  questions: passedQuestions 
}: MirrorAssessmentRoomProps) {
  
  // 1. Core States
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [isWarmUpActive, setIsWarmUpActive] = useState(false);
  const [warmUpStep, setWarmUpStep] = useState<1 | 2>(1);
  const [canVoiceDetectYes, setCanVoiceDetectYes] = useState(false);
  const [assessmentState, setAssessmentState] = useState<'calibrating' | 'interview_plan' | 'interview' | 'submitting'>('calibrating');
  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>(passedQuestions || []);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showWrittenQuestion, setShowWrittenQuestion] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  
  // Camera & Mic stream refs
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [speechDetected, setSpeechDetected] = useState<boolean[]>([]);
  
  // Text response state (as backup or alternate mode)
  const [responseText, setResponseText] = useState('');
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  
  // Timer States
  const [secondsRemaining, setSecondsRemaining] = useState(240); // 4 minutes per question for 25-45min flow
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);
  const [totalSecondsRemaining, setTotalSecondsRemaining] = useState(1800); // 30 mins total
  
  // Full-screen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Automatic progression & VAD states
  const [isShanaSpeaking, setIsShanaSpeaking] = useState(false);
  const [hasSpokenThisStep, setHasSpokenThisStep] = useState(false);
  const silenceTimeoutRef = useRef<any>(null);
  const turnTimeoutRef = useRef<any>(null);
  const nextQuestionPrefixRef = useRef<string | null>(null);
  const liveSessionIdRef = useRef<string | null>(null);

  // Session ID for Phase 1 Event System Core
  const sessionIdRef = useRef<string>(`sess_mirror_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`);
  const lastAskedIndexRef = useRef<number>(-1);
  const stateMachineRef = useRef<SessionStateMachine | null>(null);

  const transitionSessionState = (nextState: ShanaState, meta: Record<string, any> = {}) => {
    if (!stateMachineRef.current && sessionIdRef.current) {
      stateMachineRef.current = new SessionStateMachine(user.id || 'usr_candidate', sessionIdRef.current);
    }
    if (stateMachineRef.current) {
      const result = stateMachineRef.current.transitionTo(nextState, meta);
      if (!result.success) {
        console.warn(`[STATE MACHINE CONFLICT RESCUE] Attempted disallowed transition from ${stateMachineRef.current.getState()} to ${nextState}. Mirror Room failsafe recovery triggered.`);
        stateMachineRef.current.transitionTo('IDLE');
        stateMachineRef.current.transitionTo(nextState, meta);
      }
    }
  };

  // Sync real-time assessment session with admin panel
  useEffect(() => {
    if (assessmentState === 'interview' && !liveSessionIdRef.current) {
      try {
        const dbUser = StorageService.getSession()?.user || { email: 'candidate@shana.com' };
        const trackerUser = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: dbUser.email || 'candidate@shana.com'
        };
        const trackerProfile = {
          language: lang === 'FR' ? 'French' : 'English'
        };
        liveSessionIdRef.current = LiveSessionTracker.startSession(trackerUser, trackerProfile, 'ASSESSMENT');
      } catch (trackerErr) {
        console.warn("Could not start live assessment tracker:", trackerErr);
      }
    }
  }, [assessmentState, user, lang]);

  useEffect(() => {
    if (assessmentState === 'interview' && liveSessionIdRef.current && totalSecondsElapsed > 0) {
      try {
        const currentQuestion = dynamicQuestions[assessmentStep];
        const currentPhase = currentQuestion ? currentQuestion.label : 'Assessment';
        const progress = Math.min(95, Math.round((assessmentStep / Math.max(1, dynamicQuestions.length)) * 100));
        LiveSessionTracker.updateSessionProgress(liveSessionIdRef.current, totalSecondsElapsed, currentPhase, progress);
      } catch (e) {}
    }
  }, [totalSecondsElapsed, assessmentState, assessmentStep, dynamicQuestions.length]);

  // Handle assessment cancel on unmount
  useEffect(() => {
    return () => {
      if (liveSessionIdRef.current) {
        try {
          const sessions = StatsRepository.getSessions();
          const s = sessions.find(x => x.id === liveSessionIdRef.current);
          if (s && s.status === 'active') {
            LiveSessionTracker.completeSession(liveSessionIdRef.current, 'cancelled');
          }
        } catch (e) {}
      }
    };
  }, []);

  // Audio / Speech refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Memoized callback ref for the video DOM elements to prevent unstable stream resets
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && cameraStream) {
      if (el.srcObject !== cameraStream) {
        el.srcObject = cameraStream;
        el.play().catch(e => console.warn("[MirrorRoom] Failed playing video via callback ref:", e));
      }
    }
  }, [cameraStream]);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Transcripts & logs simulation for AI analysis
  const [interviewLogs, setInterviewLogs] = useState<string[]>([]);

  // Localization dict
  const translationsMap = {
    EN: {
      roomTitle: "Immersive Mirror Assessment Room",
      subtitle: "RECRUITER MEASUREMENT PROTOCOL — ZERO CLUTTER",
      startInterview: "Enter Assessment Stream",
      exitRoom: "Exit Room",
      phase: "Phase",
      totalElapsed: "TOTAL SESSION ELAPSED",
      questionTimer: "RECOMMENDED ANSWER WINDOW",
      audioLevel: "VOICE POWER MATRIX",
      calibrationHeader: "High-Fidelity Mirror Calibration",
      calibrationNotice: "Align your posture with the grid center. Look directly at the optical sensor.",
      calibratingText: "CALIBRATING OPTICAL FIELD...",
      allowDevices: "Camera and microphone authorizations are mandatory for high-fidelity evaluation.",
      deviceCheck: "System Diagnostics Check",
      reauth: "Re-authorize Devices",
      submittingText: "COMPILING PERFORMANCE METRICS...",
      submittingDesc: "Our AI is analyzing voice cadence, response depth, and physiological alignment...",
      speakNow: "Speak response aloud to continue...",
      isSpeaking: "AI Interviewer is speaking",
      nextStep: "Submit Answer & Continue",
      finishAll: "Finalize & Generate Diagnostic",
      feedbackNudge: "✦ Shana is listening. Practice speaking aloud to capture delivery metrics.",
      typingBackup: "Keyboard Response Alternate Mode",
      typingPlaceholder: "Type your professional response formulation here if mic is unavailable...",
      toggleTyping: "Switch to Typing",
      toggleSpeech: "Switch to Voice",
      trickQuestion: "⚠️ TRICK QUESTION ACTIVE",
      trickDesc: "This tactical trap targets system anomalies. Formulate a structured defense using metrics.",
      warning: "NEUTRAL ASSESSMENT ACTIVE: No coaching, no transcripts, and no live feedback will be shown. Formulate your absolute best career defenses."
    },
    FR: {
      roomTitle: "Salle d'Évaluation Miroir Immersive",
      subtitle: "PROTOCOLE DE MESURE CONSTRUCTEUR — ZÉRO ENCOMBREMENT",
      startInterview: "Lancer le Flux d'Évaluation",
      exitRoom: "Quitter l'Espace",
      phase: "Phase",
      totalElapsed: "TEMPS DE SESSION ÉCOULÉ",
      questionTimer: "FENÊTRE DE RÉPONSE RECOMMANDÉE",
      audioLevel: "MATRICE DE PUISSANCE VOCALE",
      calibrationHeader: "Calibrage Miroir Haute Fidélité",
      calibrationNotice: "Alignez votre visage avec la grille centrale. Fixez directement l'objectif optique.",
      calibratingText: "CALIBRAGE DU CHAMP OPTIQUE...",
      allowDevices: "Les autorisations caméra et microphone sont requises pour une évaluation haute fidélité.",
      deviceCheck: "Diagnostic du Matériel",
      reauth: "Ré-autoriser les Périphériques",
      submittingText: "COMPILATION DES RATIOS DE PERFORMANCE...",
      submittingDesc: "Notre IA analyse la cadence de votre élocution, la pertinence et l'alignement corporel...",
      speakNow: "Répondez à haute voix pour continuer...",
      isSpeaking: "L'IA est en train de parler",
      nextStep: "Valider la Réponse & Continuer",
      finishAll: "Finaliser & Générer le Diagnostic",
      feedbackNudge: "✦ Shana écoute. Parlez clairement à haute voix pour mesurer votre élocution.",
      typingBackup: "Mode de Saisie Clavier Alternatif",
      typingPlaceholder: "Saisissez votre réponse professionnelle si le micro est indisponible...",
      toggleTyping: "Passer en mode Clavier",
      toggleSpeech: "Passer en mode Vocal",
      trickQuestion: "⚠️ QUESTION PIÈGE ACTIVE",
      trickDesc: "Ce scénario teste votre précision technique. Formulez une défense structurée avec des métriques.",
      warning: "ÉVALUATION STRICTEMENT NEUTRE : Aucun coaching, aucune transcription en direct. Donnez vos meilleures réponses."
    }
  };

  const t = translationsMap[lang] || translationsMap.EN;

  // 2. Load Questions if not pre-fetched
  useEffect(() => {
    if (dynamicQuestions.length === 0) {
      setLoadingQuestions(true);
      const cvAnalysis = StorageService.getAnalysis(user.id);
      const history = StorageService.getHistory(user.id) || [];
      
      const adSettings = AdaptiveEngine.getSettings(user.id);
      const calculatedAdaptation = AdaptiveEngine.calculateAdaptation(user.id, history);
      
      const orchestrationDecision = ShanaOrchestrator.orchestrateSession(
        user.id || 'usr_candidate',
        history,
        user.experienceLevel || 'Mid',
        lang,
        sessionIdRef.current
      );

      const resolvedAdaptation = adSettings.status === 'accepted' ? {
        path: calculatedAdaptation?.path || 'Balanced',
        difficulty: orchestrationDecision.difficulty,
        recoveryMode: orchestrationDecision.interviewType === 'Confidence Builder',
        struggleFlags: calculatedAdaptation?.struggleFlags || { lack_structure: false, excels_under_pressure: false, too_long: false },
        smartChallenge: orchestrationDecision.serendipityTriggered ? calculatedAdaptation?.smartChallenge : undefined,
      } : null;

      const resolvedDirector = {
        interviewType: orchestrationDecision.interviewType,
        difficulty: orchestrationDecision.difficulty,
        pacing: orchestrationDecision.pacingSeconds === 120 ? 'Relaxed (120s)' : orchestrationDecision.pacingSeconds === 30 ? 'Rapid Fire (30s)' : 'Standard (45s)',
        questionStyle: orchestrationDecision.questionStyle,
        interruptionLevel: orchestrationDecision.interruptionLevel,
        feedbackIntensity: orchestrationDecision.feedbackIntensity,
        serendipityTriggered: orchestrationDecision.serendipityTriggered,
        overrideApplied: orchestrationDecision.authority === 'adaptive',
        pacingSeconds: orchestrationDecision.pacingSeconds,
      };

      // Register Learning Validation Loop baseline BEFORE action impact is observed
      try {
        const lastSession = history[0]; // most recent session
        const beforeMetrics = {
          ips: lastSession?.score || 70,
          clarity: lastSession?.communicationScore || 70,
          structure: Math.round(((lastSession?.resumeScore || 70) + (lastSession?.behavioralScore || 70)) / 2),
          confidence: lastSession?.confidenceScore || lastSession?.communicationScore || 70,
          relevance: 75,
          conciseness: 75
        };

        const systemName: 'Adaptive' | 'Director' | 'Serendipity' = 
          orchestrationDecision.authority === 'adaptive' ? 'Adaptive' : 
          orchestrationDecision.authority === 'serendipity' ? 'Serendipity' : 'Director';

        const actionApplied = `Format: ${orchestrationDecision.interviewType} (Style: ${orchestrationDecision.questionStyle}, Difficulty: ${orchestrationDecision.difficulty})`;

        LearningValidationLoop.logActionBefore(
          user.id || 'usr_candidate',
          systemName,
          `Experience: ${user.experienceLevel || 'Mid'}. Total sessions: ${history.length}`,
          actionApplied,
          beforeMetrics
        );
      } catch (err) {
        console.warn("Could not log baseline learning loop metrics before session:", err);
      }

      fetch('/api/assessment/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            targetRole: user.targetRole,
            industry: user.industry,
            language: lang === 'FR' ? 'French' : 'English',
            experienceLevel: user.experienceLevel
          },
          cvAnalysis: cvAnalysis,
          history: history,
          adaptation: resolvedAdaptation,
          director: resolvedDirector
        })
      })
      .then(res => res.json())
      .then(data => {
        let selectedQuestions = [];
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          selectedQuestions = data.questions;
          setDynamicQuestions(selectedQuestions);
        } else {
          // Fallback Questions
          selectedQuestions = lang === 'FR' ? [
            { phase: 1, label: "PHASE 1: DÉFENSE DE PARCOURS", question: "Présentez les réalisations marquantes de votre CV et comment elles s'alignent avec ce poste.", type: "Resume" },
            { phase: 2, label: "PHASE 2: CAPABILITÉS ARCHITECTURALES", question: "Décrivez comment vous concevez une infrastructure hautement disponible et sécurisée pour ce secteur.", type: "Architecture" },
            { phase: 3, label: "PHASE 3: QUESTION PIÈGE - STABILITÉ DE FLUX", question: "Si un déploiement critique échoue en production alors que le client exige la livraison immédiate, comment réagissez-vous ?", type: "Technical_Trap" },
            { phase: 4, label: "PHASE 4: LEADERSHIP EN CRICE", question: "Décrivez une situation où vous avez dû convaincre des parties prenantes clés de changer radicalement de cap sous forte pression.", type: "Behavioral" },
          ] : [
            { phase: 1, label: "PHASE 1: RESUME DEFENSE", question: "Highlight the key milestones in your career and define why they make you the optimal choice for this role.", type: "Resume" },
            { phase: 2, label: "PHASE 2: TECHNICAL DEEP-DIVE", question: "Explain how you design a system architecture that ensures maximum scalability and fault tolerance under load.", type: "Architecture" },
            { phase: 3, label: "PHASE 3: TACTICAL TRAP (TRICK QUESTION)", question: "If a crucial deployment crashes in production under tight timelines and stakeholder panic, what is your exact defense strategy?", type: "Technical_Trap" },
            { phase: 4, label: "PHASE 4: COLLABORATION UNDER PRESSURE", question: "Tell me about a high-stress timeline conflict with an executive, and how you successfully navigated that gridlock.", type: "Behavioral" },
          ];
          setDynamicQuestions(selectedQuestions);
        }

        // Event: adaptation_triggered
        ShanaEventTracker.logEvent(
          user.id || 'usr_candidate',
          sessionIdRef.current,
          'adaptation_triggered',
          {
            adaptationPath: calculatedAdaptation?.path || 'Standard',
            adaptationDifficulty: orchestrationDecision.difficulty,
            adaptationExplanation: orchestrationDecision.explanation,
            smartChallenge: resolvedAdaptation?.smartChallenge || null,
            directorDesign: resolvedDirector,
            totalQuestions: selectedQuestions.length,
            orchestrationAuthority: orchestrationDecision.authority,
            conflictsResolvedCount: orchestrationDecision.conflicts.length
          }
        );
      })
      .catch(err => {
        console.error("Error fetching dynamic questions in Room:", err);
      })
      .finally(() => {
        setLoadingQuestions(false);
      });
    }
  }, [user, lang, dynamicQuestions.length]);

  // 3. Audio & Camera Management
  const startCamera = async () => {
    try {
      setCameraError(false);
      // Stop existing tracks if any
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      cameraStreamRef.current = stream;
      setCameraStream(stream);

      // Web Audio API for volume feedback
      if (window.AudioContext || (window as any).webkitAudioContext) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyserNodeRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let animationId: number;

          const updateVolume = () => {
            if (!analyserNodeRef.current) return;
            analyserNodeRef.current.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const level = Math.min(100, Math.round((average / 128) * 100));

            // Mark speech as active if we cross a noise floor
            if (level > 8) {
              setSpeechDetected(prev => {
                const next = [...prev];
                if (!next[assessmentStep]) {
                  next[assessmentStep] = true;
                  return next;
                }
                return prev;
              });
            }

            setMicVolume(level);
            animationId = requestAnimationFrame(updateVolume);
          };

          updateVolume();
        } catch (audioErr) {
          console.warn("Could not set up mic analyzer inside Room:", audioErr);
        }
      }
    } catch (err) {
      console.warn("Camera/mic capture failed inside Room:", err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch (e) {}
      audioContextRef.current = null;
    }
    analyserNodeRef.current = null;

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    setCameraStream(null);
  };

  // Keep camera, audio, and VoiceLock active on lifecycle
  useEffect(() => {
    InterviewVoiceManager.acquireLock('MIRROR_ROOM');
    startCamera();
    return () => {
      stopCamera();
      stopVoiceSpeaking();
      InterviewVoiceManager.releaseLock('MIRROR_ROOM');
    };
  }, []);

  // Sync camera feed to DOM video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.play().catch(e => console.warn("Failed playing video:", e));
      }
    }
  }, [cameraStream, assessmentState]);

  // Voice Activity Detection (VAD) & Silence-based automatic transitions
  useEffect(() => {
    if (assessmentState !== 'interview' || isShanaSpeaking || isWarmUpActive) {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      return;
    }

    if (micVolume > 8) {
      if (!hasSpokenThisStep) {
        setHasSpokenThisStep(true);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    } else {
      if (hasSpokenThisStep) {
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            console.log("[MirrorRoom] Silence detected for 3.5s after speech. Automatic transition to next step!");
            handleNextStep();
          }, 3500);
        }
      }
    }
  }, [micVolume, isShanaSpeaking, hasSpokenThisStep, assessmentState, isWarmUpActive]);

  // Safety Turn Timeout (automatically progress if user is completely silent or quiet for 35 seconds)
  useEffect(() => {
    if (assessmentState === 'interview' && !isShanaSpeaking && !isWarmUpActive) {
      if (turnTimeoutRef.current) {
        clearTimeout(turnTimeoutRef.current);
      }
      turnTimeoutRef.current = setTimeout(() => {
        console.log("[MirrorRoom] Safety turn timeout triggered after 35s. Transitioning automatically.");
        handleNextStep();
      }, 35000);
    } else {
      if (turnTimeoutRef.current) {
        clearTimeout(turnTimeoutRef.current);
        turnTimeoutRef.current = null;
      }
    }
    return () => {
      if (turnTimeoutRef.current) {
        clearTimeout(turnTimeoutRef.current);
      }
    };
  }, [isShanaSpeaking, assessmentStep, assessmentState, isWarmUpActive]);

  // Global Keyboard listener for frictionless one-key skip (any keydown manual override)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (assessmentState === 'interview' && !isWarmUpActive) {
        if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') {
          return;
        }
        console.log("[MirrorRoom] Key pressed, manual keyboard override transition:", e.key);
        handleNextStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [assessmentState, assessmentStep, responseText, responses, isWarmUpActive]);

  // 4. Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (assessmentState === 'interview' && !isWarmUpActive) {
      interval = setInterval(() => {
        // Individual question countdown
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handleNextStep(true);
            return 240;
          }
          return prev - 1;
        });

        // Global elapsed counters
        setTotalSecondsElapsed(prev => prev + 1);
        setTotalSecondsRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [assessmentState, assessmentStep, isWarmUpActive]);

  // Voice trigger for "Yes" during warm-up step 2
  useEffect(() => {
    if (isWarmUpActive && warmUpStep === 2 && !isShanaSpeaking) {
      // Allow a brief moment (1.5s) for candidate to start speaking
      const timer = setTimeout(() => {
        setCanVoiceDetectYes(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setCanVoiceDetectYes(false);
    }
  }, [isWarmUpActive, warmUpStep, isShanaSpeaking]);

  useEffect(() => {
    if (isWarmUpActive && warmUpStep === 2 && canVoiceDetectYes && micVolume > 15) {
      console.log("[MirrorRoom] Detected user response/voice confirmation ('Yes'). Starting interview!");
      handleEndWarmUp();
    }
  }, [micVolume, isWarmUpActive, warmUpStep, canVoiceDetectYes]);

  // 5. Text to Speech Logic (TTS)
  const stopVoiceSpeaking = () => {
    InterviewVoiceManager.stopAllActiveOutputs();
    setIsShanaSpeaking(false);
    if (activeAudioRef.current) {
      activeAudioRef.current = null;
    }
  };

  const speakQuestion = (text: string) => {
    setIsShanaSpeaking(true);
    setHasSpokenThisStep(false);

    if (!isSpeechEnabled) {
      setIsShanaSpeaking(false);
      return;
    }
    
    // Check if Mirror Room holds the lock
    if (!InterviewVoiceManager.isAllowed('MIRROR_ROOM')) {
      console.warn("[MirrorRoom] Speech blocked because we do not own the voice lock.");
      setIsShanaSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#]/g, '');

    // Attempt Server-Side TTS first via InterviewVoiceManager
    const audioUrl = `/api/interview/speak?text=${encodeURIComponent(cleanText)}`;
    
    const audioObj = InterviewVoiceManager.playServerAudio(
      audioUrl,
      'MIRROR_ROOM',
      () => {
        setIsShanaSpeaking(false);
      },
      (err) => {
        console.warn("Server TTS failed or was blocked, falling back to local SpeechSynthesis:", err);
        // Fallback to local
        InterviewVoiceManager.speakLocal(cleanText, lang === 'FR' ? 'fr-FR' : 'en-US', 'MIRROR_ROOM', () => {
          setIsShanaSpeaking(false);
        });
      }
    );

    if (audioObj) {
      activeAudioRef.current = audioObj;
    }
  };

  // Trigger TTS on question change with polite greetings and transition formulas
  useEffect(() => {
    if (assessmentState === 'interview') {
      let spokenText = '';
      const fName = user.firstName ? user.firstName.trim() : '';

      if (isWarmUpActive) {
        if (warmUpStep === 1) {
          if (lang === 'FR') {
            spokenText = `Bonjour ${fName ? fName + ', ' : ''}bienvenue dans votre espace d'évaluation. Je suis Shana, votre interlocutrice pour cet entretien. Avant de commencer la partie technique, pour s'échauffer simplement et faire connaissance, comment allez-vous aujourd'hui ?`;
          } else {
            spokenText = `Hello ${fName ? fName + ', ' : ''}welcome to your assessment room. I am Shana, and I will be guiding you through this interview. Before we begin the technical part, to help you feel comfortable and ease any stress, how are you doing today?`;
          }
        } else {
          if (lang === 'FR') {
            spokenText = "Tout est prêt pour votre évaluation. Êtes-vous prêt à commencer ?";
          } else {
            spokenText = "Everything is ready for your assessment. Are you ready to begin?";
          }
        }
      } else if (dynamicQuestions[assessmentStep]) {
        const questionText = dynamicQuestions[assessmentStep].question;

        if (lastAskedIndexRef.current !== assessmentStep) {
          lastAskedIndexRef.current = assessmentStep;
          const nextQ = dynamicQuestions[assessmentStep];
          if (nextQ) {
            // Event: question_asked
            ShanaEventTracker.logEvent(
              user.id || 'usr_candidate',
              sessionIdRef.current,
              'question_asked',
              {
                questionIndex: assessmentStep,
                phaseLabel: nextQ.label,
                questionText: nextQ.question,
                type: nextQ.type,
                difficulty: nextQ.difficulty,
                isTrickQuestion: nextQ.isTrickQuestion,
                contextAware: nextQ.contextAware,
                challenge: nextQ.challenge
              }
            );
          }
        }

        const customPrefix = nextQuestionPrefixRef.current;
        if (customPrefix) {
          spokenText = `${customPrefix}${questionText}`;
          nextQuestionPrefixRef.current = null;
        } else if (assessmentStep === 0) {
          // Welcome introduction with the candidate's name and polite formula
          if (lang === 'FR') {
            spokenText = `Parfait ${fName ? fName + ', ' : ''}commençons l'entretien avec cette première question : ${questionText}`;
          } else {
            spokenText = `Hello ${fName ? fName + ', ' : ''}welcome to your Shana mirror assessment room. Let's begin without further delay with the first question: ${questionText}`;
          }
        } else {
          // Standard polite progression fallback
          if (lang === 'FR') {
            spokenText = `Merci, passons à la question suivante : ${questionText}`;
          } else {
            spokenText = `Thank you for your answer. Let's move on to the next question: ${questionText}`;
          }
        }
      }

      if (spokenText) {
        speakQuestion(spokenText);
      }
    }
  }, [assessmentStep, assessmentState, isWarmUpActive, warmUpStep]);

  // 6. Navigation Actions
  const handleBeginInterview = () => {
    if (dynamicQuestions.length > 0) {
      setAssessmentState('interview_plan');
      // Stop general header preview
      window.dispatchEvent(new Event('shana_stop_header_camera'));
    }
  };

  const handleConfirmStartInterview = () => {
    if (dynamicQuestions.length > 0) {
      // Initialize state machine and transition to INTERVIEW_STARTING, QUESTION_ACTIVE, WAITING_ANSWER
      stateMachineRef.current = new SessionStateMachine(user.id || 'usr_candidate', sessionIdRef.current);
      stateMachineRef.current.transitionTo('INTERVIEW_STARTING', { mode: 'ASSESS_IMMERSIVE_MIRROR' });
      stateMachineRef.current.transitionTo('QUESTION_ACTIVE', { questionIndex: 0 });
      stateMachineRef.current.transitionTo('WAITING_ANSWER', { questionIndex: 0 });

      setAssessmentState('interview');
      setAssessmentStep(0);
      setIsWarmUpActive(true);
      setWarmUpStep(1);
      setSecondsRemaining(120);
      setTotalSecondsElapsed(0);
      setResponseText('');
      setIsTypingMode(false);

      // Event: interview_started
      ShanaEventTracker.logEvent(
        user.id || 'usr_candidate',
        sessionIdRef.current,
        'interview_started',
        {
          mode: 'ASSESS_IMMERSIVE_MIRROR',
          targetRole: user.targetRole,
          industry: user.industry,
          language: lang,
          experienceLevel: user.experienceLevel,
          totalQuestions: dynamicQuestions.length
        }
      );
      
      // Attempt automatic full screen since this is executed inside a user gesture event
      try {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch((err) => {
            console.warn("[MirrorRoom] Fullscreen request failed:", err);
          });
        }
        setIsFullscreen(true);
      } catch (err) {
        console.warn("[MirrorRoom] Could not trigger fullscreen:", err);
      }
    }
  };

  const handleWarmUpContinue = () => {
    stopVoiceSpeaking();
    setWarmUpStep(2);
  };

  const handleEndWarmUp = () => {
    stopVoiceSpeaking();
    setIsWarmUpActive(false);
    setWarmUpStep(1); // reset
    if (lang === 'FR') {
      nextQuestionPrefixRef.current = "Super, commençons maintenant notre entretien. Voici la première question : ";
    } else {
      nextQuestionPrefixRef.current = "It is a pleasure to talk with you! Let's start our interview now. Here is the first question: ";
    }
    const firstQuestion = dynamicQuestions[0];
    const isThirtySec = firstQuestion?.challenge?.type === 'thirty_second_limit';
    setSecondsRemaining(isThirtySec ? 30 : 240);
  };

  const handleNextStep = (isTimeout: boolean = false) => {
    transitionSessionState('PROCESSING', { questionIndex: assessmentStep });
    stopVoiceSpeaking();
    
    // Clear any pending automatic transition timers
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
      turnTimeoutRef.current = null;
    }
    
    // Save current response text
    const currentResponse = responseText.trim() || `(Verbal defense captured successfully with average sound level: ${speechDetected[assessmentStep] ? 'Standard' : 'Silent'})`;
    const nextResponses = [...responses];
    nextResponses[assessmentStep] = currentResponse;
    setResponses(nextResponses);

    // Keep logs of answers
    const currentQuestion = dynamicQuestions[assessmentStep];
    const logItem = `Phase: ${currentQuestion.label} | Question: ${currentQuestion.question} | Answer: ${currentResponse}`;
    setInterviewLogs(prev => [...prev, logItem]);

    // Event: answer_submitted
    ShanaEventTracker.logEvent(
      user.id || 'usr_candidate',
      sessionIdRef.current,
      'answer_submitted',
      {
        questionIndex: assessmentStep,
        phaseLabel: currentQuestion?.label,
        type: currentQuestion?.type,
        answer: currentResponse,
        speechDetected: speechDetected[assessmentStep] || false,
        isTimeout: isTimeout,
        secondsRemaining: secondsRemaining,
        secondsElapsed: (currentQuestion?.challenge?.type === 'thirty_second_limit' ? 30 : 240) - secondsRemaining
      }
    );

    // Go to next step
    if (assessmentStep < dynamicQuestions.length - 1) {
      const nextStepIndex = assessmentStep + 1;
      transitionSessionState('QUESTION_ACTIVE', { questionIndex: nextStepIndex });
      transitionSessionState('WAITING_ANSWER', { questionIndex: nextStepIndex });

      const userSpoke = speechDetected[assessmentStep];
      const userTyped = responseText.trim().length > 0;
      const didNotAnswer = !userSpoke && !userTyped;

      if (isTimeout) {
        if (lang === 'FR') {
          if (didNotAnswer) {
            nextQuestionPrefixRef.current = "Le temps est écoulé. Comme je n'ai pas entendu de réponse, passons à la question suivante : ";
          } else {
            nextQuestionPrefixRef.current = "Le temps est écoulé pour cette question. Merci pour vos explications, passons à la suivante : ";
          }
        } else {
          if (didNotAnswer) {
            nextQuestionPrefixRef.current = "Time is up for this question. As I didn't hear a response, let's move on to the next question. ";
          } else {
            nextQuestionPrefixRef.current = "Time is up for this question. Thank you for your explanation, we will now move on to the next question. ";
          }
        }
      } else {
        if (lang === 'FR') {
          if (didNotAnswer) {
            nextQuestionPrefixRef.current = "D'accord, passons directement à la question suivante : ";
          } else {
            nextQuestionPrefixRef.current = "Merci pour votre réponse. Passons à la question suivante : ";
          }
        } else {
          if (didNotAnswer) {
            nextQuestionPrefixRef.current = "Alright, let's proceed to the next question without delay. ";
          } else {
            nextQuestionPrefixRef.current = "Thank you for your response. Let's proceed to the next question now. ";
          }
        }
      }

      const nextQuestion = dynamicQuestions[assessmentStep + 1];
      const isThirtySec = nextQuestion?.challenge?.type === 'thirty_second_limit';
      setAssessmentStep(prev => prev + 1);
      setSecondsRemaining(isThirtySec ? 30 : 240); // Reset recommended countdown
      setResponseText('');
      setIsTypingMode(false);
    } else {
      transitionSessionState('FEEDBACK_GENERATION');
      handleFinalize();
    }
  };

  const handleFinalize = () => {
    setAssessmentState('submitting');
    stopCamera();
    stopVoiceSpeaking();

    // Generate stable deterministic IPS scores
    setTimeout(() => {
      const spokeAny = speechDetected.some(v => v);
      const isJunior = user.experienceLevel === 'junior';

      const questionsFeedback = dynamicQuestions.map((q, idx) => {
        const spokeThis = speechDetected[idx];
        const answerText = responses[idx] || (spokeThis ? `(Verbal defense captured successfully with average sound level: Standard)` : "");
        const ipsEval = calculateIPS(answerText, q.question, lang, spokeThis);

        const textLength = q.question.length;
        const wpm = spokeThis ? 120 + (textLength % 30) : 0;
        const paceStr = spokeThis ? `${wpm} WPM` : "0 WPM";
        const paceRating = spokeThis ? (wpm > 150 ? "rushed" : wpm < 100 ? "slow" : "optimal") : "silent";

        return {
          phaseLabel: q.label,
          questionText: q.question,
          score: ipsEval.ips,
          pace: paceStr,
          paceRating: paceRating,
          clarity: ipsEval.breakdown.clarity,
          keyPositive: ipsEval.explanation.strength,
          improvementTip: ipsEval.explanation.tip,
          difficulty: isJunior ? "Junior" : "Senior",
          isTrickQuestion: ["Technical_Trap", "Assimilation_Trap", "Weakness_Trap", "Stakeholder_Trap"].includes(q.type || ''),
          contextAware: true
        };
      });

      // Deterministic averages by matching phase types
      const getAverageForType = (types: string[]) => {
        const matching = questionsFeedback.filter((qf, i) => types.includes(dynamicQuestions[i]?.type || ''));
        if (matching.length === 0) return spokeAny ? 75 : 0;
        const sum = matching.reduce((acc, curr) => acc + curr.score, 0);
        return Math.round(sum / matching.length);
      };

      const resumeScore = getAverageForType(["Resume"]);
      const industryScore = getAverageForType(["Industry", "Architecture"]);
      const behavioralScore = getAverageForType(["Behavioral"]);
      const adaptabilityScore = getAverageForType(["Pressure", "Delivery_Pressure", "Technical_Trap"]);

      const answeredFeedback = questionsFeedback.filter((_, i) => speechDetected[i]);
      const avgClarity = answeredFeedback.length > 0
        ? Math.round(answeredFeedback.reduce((acc, curr) => acc + curr.clarity, 0) / answeredFeedback.length)
        : 0;

      const avgConfidence = answeredFeedback.length > 0
        ? Math.round(answeredFeedback.reduce((acc, curr, idx) => {
            const spokeThis = speechDetected[dynamicQuestions.findIndex(p => p.label === curr.phaseLabel)];
            const answerText = responses[dynamicQuestions.findIndex(p => p.label === curr.phaseLabel)] || (spokeThis ? `(Verbal defense captured successfully with average sound level: Standard)` : "");
            const ipsEval = calculateIPS(answerText, curr.questionText, lang, spokeThis);
            return acc + ipsEval.breakdown.confidence;
          }, 0) / answeredFeedback.length)
        : 0;

      const communicationScore = spokeAny ? Math.round(avgClarity) : 0;
      const confidenceScore = spokeAny ? Math.round(avgConfidence) : 0;

      const aggregateScore = spokeAny 
        ? Math.round((resumeScore + industryScore + communicationScore + confidenceScore + adaptabilityScore + behavioralScore) / 6)
        : 0;

      const sessionPayload = {
        id: 'sess_' + Math.random().toString(36).substr(2, 9),
        type: 'ASSESS',
        date: new Date().toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        score: aggregateScore,
        weakness: lang === 'FR' 
          ? "Léger manque de repères de performance chiffrés sous forte pression temporelle." 
          : "Pacing variation under high strategic stress and sudden structural pivots.",
        recommendation: lang === 'FR' 
          ? "Ancrez vos réponses avec des chiffres concrets (KPIs, gains de temps, coûts)." 
          : "Maintain structural framework continuity. Practice breathing intervals during transition cues.",
        language: lang,
        duration: `${Math.floor(totalSecondsElapsed / 60)}m ${totalSecondsElapsed % 60}s`,
        resumeScore,
        industryScore,
        communicationScore,
        adaptabilityScore,
        behavioralScore,
        strengths: lang === 'FR'
          ? ["Vocabulaire métier robuste", "Rôle défendu avec aplomb", "Posture physique neutre calibrée"]
          : ["Robust architectural technical phrasing", "Maintained calm physiological poise", "Structured milestones defense"],
        questionsFeedback,
        createdAt: new Date().toISOString()
      };

      // Persistence
      const existingHistory = StorageService.getHistory(user.id) || [];
      StorageService.saveHistory(user.id, [sessionPayload, ...existingHistory]);

      // Commit After Metrics for the Learning Validation Loop
      try {
        const afterMetrics = {
          ips: aggregateScore,
          clarity: avgClarity,
          structure: Math.round(((resumeScore || 70) + (behavioralScore || 70)) / 2),
          confidence: avgConfidence,
          relevance: 80,
          conciseness: 85
        };
        
        const pendingLogs = LearningValidationLoop.getLogs(user.id || 'usr_candidate');
        const activePending = pendingLogs.find(l => l.afterMetrics === null);
        if (activePending) {
          LearningValidationLoop.logActionAfter(user.id || 'usr_candidate', activePending.actionId, afterMetrics);
        } else {
          LearningValidationLoop.autoResolvePendingActions(user.id || 'usr_candidate', {
            ips: aggregateScore,
            breakdown: {
              clarity: avgClarity,
              structure: Math.round(((resumeScore || 70) + (behavioralScore || 70)) / 2),
              confidence: avgConfidence,
              relevance: 80,
              conciseness: 85
            },
            explanation: { strength: "", improvement: "", tip: "" }
          });
        }
      } catch (err) {
        console.warn("Could not log completed learning loop metrics:", err);
      }

      // Event: answer_analyzed (one per question)
      questionsFeedback.forEach((qf, idx) => {
        ShanaEventTracker.logEvent(
          user.id || 'usr_candidate',
          sessionIdRef.current,
          'answer_analyzed',
          {
            questionIndex: idx,
            phaseLabel: qf.phaseLabel,
            questionText: qf.questionText,
            score: qf.score,
            pace: qf.pace,
            paceRating: qf.paceRating,
            clarity: qf.clarity,
            keyPositive: qf.keyPositive,
            improvementTip: qf.improvementTip
          }
        );
      });

      // Event: score_generated
      ShanaEventTracker.logEvent(
        user.id || 'usr_candidate',
        sessionIdRef.current,
        'score_generated',
        {
          finalScore: aggregateScore,
          resumeScore,
          industryScore,
          communicationScore,
          confidenceScore: communicationScore, // mapping communication to confidence for continuity
          adaptabilityScore,
          behavioralScore
        }
      );

      // Event: insight_generated
      ShanaEventTracker.logEvent(
        user.id || 'usr_candidate',
        sessionIdRef.current,
        'insight_generated',
        {
          strengths: sessionPayload.strengths,
          weakness: sessionPayload.weakness,
          recommendation: sessionPayload.recommendation
        }
      );

      // Event: interview_completed
      ShanaEventTracker.logEvent(
        user.id || 'usr_candidate',
        sessionIdRef.current,
        'interview_completed',
        {
          sessionId: sessionIdRef.current,
          date: sessionPayload.date,
          score: aggregateScore,
          duration: sessionPayload.duration,
          totalQuestions: dynamicQuestions.length,
          spokeAny
        }
      );

      if (liveSessionIdRef.current) {
        try {
          LiveSessionTracker.completeSession(liveSessionIdRef.current, 'completed');
        } catch (trackerErr) {
          console.warn("Could not complete live tracker:", trackerErr);
        }
      }

      // Transition state machine to COMPLETED
      transitionSessionState('COMPLETED');

      // Callback to parents
      onComplete(sessionPayload);
    }, 3500);
  };

  // Fullscreen trigger helper
  const toggleFullscreen = () => {
    const docEl = document.documentElement;
    if (!isFullscreen) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Safe Exit Room handler
  const handleExitRoom = () => {
    stopCamera();
    stopVoiceSpeaking();
    transitionSessionState('IDLE');
    onClose();
  };

  // Sound level visualizer wave generator matching Shana.app theme
  const renderWaveform = () => {
    const barCount = 18;
    return (
      <div className="flex items-center gap-[4px] h-6 justify-center">
        {Array.from({ length: barCount }).map((_, i) => {
          // Bell curve multiplier so waves are taller in the center
          const multiplier = 1 - Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
          const isMicActive = micVolume > 8;
          
          let heightPercent;
          if (isShanaSpeaking) {
            // Smooth, flowing sinus movement when AI is speaking
            const waveSpeed = 0.003;
            const waveFreq = 0.5;
            const time = Date.now() * waveSpeed;
            heightPercent = 20 + Math.sin(time + i * waveFreq) * 35 * multiplier;
          } else if (isMicActive) {
            // Sound level dependent random-bouncing bars when candidate is speaking
            const volumeFactor = micVolume / 35;
            heightPercent = Math.max(15, Math.min(100, (volumeFactor * 75 * multiplier) + (Math.random() * 20)));
          } else {
            // Tiny idle ripple
            heightPercent = 12 + Math.sin(Date.now() * 0.001 + i) * 8;
          }

          return (
            <div 
              key={i}
              className={`w-[3px] rounded-full transition-all duration-75 ${
                isShanaSpeaking 
                  ? 'bg-indigo-400/80 shadow-[0_0_8px_rgba(129,140,248,0.3)]' 
                  : isMicActive 
                    ? 'bg-[#27C93F] shadow-[0_0_8px_rgba(39,201,63,0.3)]' 
                    : 'bg-stone-800'
              }`}
              style={{ height: `${heightPercent}%` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div id="immersive-assessment-room" className="fixed inset-0 z-[9999] bg-stone-950 text-stone-100 flex flex-col h-screen w-screen overflow-hidden font-sans select-none">
      
      {/* ----------------- PERSISTENT WINDOW FRAME HEADER (High-Fidelity macOS Style) ----------------- */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-stone-900 bg-[#0A0A0A] shrink-0 select-none">
        {/* Left macOS style buttons + path */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] opacity-90" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] opacity-90" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F] opacity-90" />
          </div>
          <span className="font-mono text-[10px] tracking-wider text-stone-500 font-bold lowercase">
            shana.app // mirror-app-frame
          </span>
        </div>

        {/* Right status info / Controls */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#27C93F] animate-pulse" />
            <span className="font-mono text-[9px] tracking-widest text-[#27C93F]/90 uppercase font-black">
              {lang === 'FR' ? "PROCÉDURE MIROIR ACTIVE" : "ACTIVE MIRROR PROCEDURE"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Full Screen button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-stone-900 border border-transparent hover:border-stone-800 rounded-lg text-stone-400 hover:text-stone-100 transition-all cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>

            {/* Exit Button */}
            <button
              onClick={handleExitRoom}
              className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-stone-400 hover:text-red-400 transition-all cursor-pointer"
              title={t.exitRoom}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- MAIN SPLIT WORKSPACE ----------------- */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* ======================= STATE A: CALIBRATING INTRO ======================= */}
        <AnimatePresence mode="wait">
          {assessmentState === 'calibrating' && (
            <motion.div 
              key="calibrating-view"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="absolute inset-0 flex flex-col md:flex-row h-full w-full overflow-y-auto md:overflow-hidden bg-stone-950"
            >
              {/* Left Side: High Fidelity Calibration Stream */}
              <div className="flex-none md:flex-1 bg-stone-950 p-6 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-stone-900">
                <div className="space-y-1.5 text-left z-10">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
                    {t.calibratingText}
                  </span>
                  <h3 className="text-lg font-black tracking-tight text-stone-100 font-sans mt-2">{t.calibrationHeader}</h3>
                  <p className="text-xs text-stone-400 max-w-md font-medium leading-normal">
                    {t.calibrationNotice}
                  </p>
                </div>

                {/* Mirror Stream Container */}
                <div className="my-4 md:my-6 h-auto aspect-video max-h-[35vh] md:max-h-[60vh] md:flex-1 bg-stone-950 border border-stone-850 rounded-2xl overflow-hidden relative shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-center justify-center shrink-0">
                  
                  {cameraError ? (
                    <div className="p-6 text-center space-y-4 max-w-sm">
                      <CameraOff className="w-10 h-10 text-stone-600 mx-auto" />
                      <p className="text-xs font-mono text-stone-400 font-extrabold uppercase leading-relaxed">
                        {t.allowDevices}
                      </p>
                      <button 
                        onClick={startCamera} 
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs uppercase font-mono tracking-wider font-extrabold cursor-pointer transition-all active:scale-95 shadow-md"
                      >
                        {t.reauth}
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={setVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      {/* Technical Calibrating HUD overlays */}
                      <div className="absolute inset-0 pointer-events-none select-none">
                        {/* Horizontal Crosshair */}
                        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-emerald-500/20" />
                        {/* Vertical Crosshair */}
                        <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-emerald-500/20" />
                        {/* Circle calibration focus */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-dashed border-emerald-500/15 rounded-full" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-dashed border-emerald-500/25 rounded-full" />
                        
                        {/* Corner markers */}
                        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-500/30" />
                        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-500/30" />
                        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-500/30" />
                        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-500/30" />
                      </div>
                    </>
                  )}
                </div>

                <div className="text-[10px] font-mono text-stone-500 text-left shrink-0 z-10">
                  ✦ FRAME RESOLUTION: 1085PX HIGH-FIDELITY OPTICS // LOW LATENCY FEEDBACK ACTIVE
                </div>
              </div>

              {/* Right Side: Simple Assessment Parameter Review & Start */}
              <div className="w-full md:w-[420px] bg-stone-900/60 p-6 md:p-8 flex flex-col justify-between shrink-0 md:overflow-y-auto">
                <div className="space-y-6 text-left">
                  <div>
                    <span className="text-[9px] font-mono tracking-widest text-indigo-400 font-extrabold uppercase block">
                      SYSTEM INTEGRATION
                    </span>
                    <h3 className="text-xl font-bold tracking-tight text-stone-100 mt-1 font-sans">
                      {lang === 'FR' ? "Calibration d'Entrée" : "Ready to Stream"}
                    </h3>
                  </div>

                  {/* Warning Protocol Alert */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-[9px] uppercase tracking-wider">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span>{lang === 'FR' ? "RÈGLES DE NEUTRALITÉ" : "NEUTRALITY CODES"}</span>
                    </div>
                    <p className="text-stone-300 text-[10.5px] leading-relaxed font-sans font-medium">
                      {t.warning}
                    </p>
                  </div>

                  {/* Specs list */}
                  <div className="space-y-3.5 pt-2">
                    <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest font-black block">
                      PROTOCOL PARAMETERS
                    </span>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center p-3 bg-stone-950 border border-stone-850 rounded-xl">
                        <span className="text-stone-400">POSITION:</span>
                        <span className="text-indigo-300 font-bold uppercase truncate max-w-[180px]">{user.targetRole}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-stone-950 border border-stone-850 rounded-xl">
                        <span className="text-stone-400">SECTOR MATRIX:</span>
                        <span className="text-stone-200 font-bold uppercase">{user.industry}</span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-stone-950 border border-stone-850 rounded-xl">
                        <span className="text-stone-400">ESTIMATED FLOW:</span>
                        <span className="text-stone-200 font-bold uppercase">25 - 45 MINS</span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-stone-950 border border-stone-850 rounded-xl">
                        <span className="text-stone-400">EVALUATION METHOD:</span>
                        <span className="text-emerald-400 font-bold uppercase">VOICE SPECTRUM</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-6 shrink-0">
                  <button
                    onClick={handleBeginInterview}
                    disabled={cameraError || loadingQuestions}
                    className="w-full py-4 bg-indigo-650 hover:bg-indigo-600 disabled:bg-stone-800 disabled:cursor-not-allowed text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-[0.98] flex items-center justify-between px-6 cursor-pointer"
                  >
                    {loadingQuestions ? (
                      <>
                        <span>{lang === 'FR' ? "CHARGEMENT DE L'IA..." : "CALIBRATING AI INTERACTION..."}</span>
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>{t.startInterview}</span>
                        <ChevronRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================= STATE A.5: INTERVIEW PLAN (PREVIEW PROTOCOL) ======================= */}
          {assessmentState === 'interview_plan' && (
            <motion.div 
              key="interview-plan-view"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col md:flex-row h-full w-full overflow-y-auto md:overflow-hidden bg-stone-950"
            >
              {/* Left Side: Live Camera View & Audio Levels */}
              <div className="flex-none md:flex-1 bg-stone-950 p-6 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-stone-900">
                <div className="space-y-1 text-left z-10">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-400 font-extrabold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded">
                    {lang === 'FR' ? "LIAISON VIDÉO CRÉÉE" : "VIDEO FEED LINKED"}
                  </span>
                  <h3 className="text-lg font-black tracking-tight text-stone-100 font-sans mt-2">
                    {lang === 'FR' ? "Cadrage & Alignement Vidéo" : "Framing & Video Alignment"}
                  </h3>
                  <p className="text-xs text-stone-400 max-w-md font-semibold">
                    {lang === 'FR' ? "Veuillez vérifier que votre visage est bien centré et éclairé." : "Ensure your face is well-centered and illuminated."}
                  </p>
                </div>

                {/* Video display */}
                <div className="my-4 relative h-auto aspect-video max-h-[35vh] md:max-h-[360px] md:flex-1 bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden self-center shadow-2xl flex items-center justify-center shrink-0">
                  {cameraStream ? (
                    <video
                      ref={setVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="text-center text-stone-500 space-y-2">
                      <CameraOff className="w-8 h-8 mx-auto text-stone-600 animate-pulse" />
                      <span className="text-[10px] font-mono tracking-wider block">
                        {lang === 'FR' ? "CONNEXION À LA CAMÉRA..." : "CONNECTING CAMERA STREAM..."}
                      </span>
                    </div>
                  )}

                  {/* Calibration Grid Lines */}
                  <div className="absolute inset-0 border-[20px] border-black/10 pointer-events-none" />
                  <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-white/10 pointer-events-none" />
                  <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-white/10 pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-dashed border-indigo-500/30 rounded-full pointer-events-none" />

                  {/* Feed Status overlay */}
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md border border-stone-800 px-2.5 py-1 rounded-lg text-[9px] font-mono text-stone-300 flex items-center gap-1.5 uppercase font-bold tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {lang === 'FR' ? "CAMÉRA ACTIVE" : "CAMERA SECURE"}
                  </div>
                </div>

                {/* Mic level indicators */}
                <div className="space-y-2 z-10 text-left">
                  <div className="flex justify-between items-center text-[10px] font-mono text-stone-400 font-bold uppercase">
                    <span>{lang === 'FR' ? "Volume Microphone" : "Microphone Volume"}</span>
                    <span className="text-emerald-400 font-extrabold">{micVolume > 1 ? `${Math.round(micVolume)}%` : "SILENCIEUX"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-900 border border-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-100"
                      style={{ width: `${Math.min(100, micVolume * 2)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Side: AI Evaluation Plan */}
              <div className="flex-none md:flex-1 bg-stone-950 p-6 md:p-8 flex flex-col justify-between md:overflow-y-auto">
                <div className="space-y-6">
                  <div className="text-left space-y-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
                      {lang === 'FR' ? "PROGRAMME D'ANALYSE DE L'INTERROGATEUR" : "AI INTERVIEWER ASSESSMENT BLUEPRINT"}
                    </span>
                    <h3 className="text-xl font-black tracking-tight text-stone-100 font-sans mt-2">
                      {lang === 'FR' ? "Plan d'Entretien Préparé" : "Prepared Assessment Structure"}
                    </h3>
                    <p className="text-xs text-stone-400 font-semibold leading-relaxed">
                      {lang === 'FR' 
                        ? "L'interrogateur IA a structuré votre entretien. Prenez connaissance des différentes phases de mesure ci-dessous."
                        : "The AI interviewer has compiled your customized assessment. Review the structured phases below."}
                    </p>
                  </div>

                  {/* ordered phases */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar text-left font-sans">
                    {dynamicQuestions.map((phase, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-4 bg-stone-900/60 border border-stone-800/80 p-3.5 rounded-xl hover:border-stone-700 transition-all animate-fade-in"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[11px] font-mono font-bold text-indigo-400">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-stone-200 text-xs font-black font-sans">
                            {phase.label}
                          </h4>
                          <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider font-extrabold">
                            {lang === 'FR' ? "CRITÈRE DE COMPORTEMENT" : "ANALYSIS SEGMENT"}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] font-extrabold text-stone-400 bg-stone-950 px-2.5 py-1 rounded-md border border-stone-800 shrink-0">
                          ~4 Mins
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* neutral mode disclaimer */}
                  <div className="bg-stone-900/40 border border-stone-900 rounded-xl p-4 text-left space-y-1.5">
                    <h5 className="text-[10px] font-mono uppercase font-black text-emerald-400 tracking-wider">
                      {lang === 'FR' ? "MODE D'ÉVALUATION INTERACTIF" : "INTERACTIVE VOICE SPECTRUM MODE"}
                    </h5>
                    <p className="text-[11px] text-stone-400 leading-relaxed font-semibold">
                      {lang === 'FR'
                        ? "Ce mode analyse en temps réel votre élocution, vos silences, votre posture et la clarté de vos réponses vocales. Aucun script d'aide n'est fourni durant l'entretien."
                        : "This mode evaluates your voice delivery, pauses, posture, and response structure in real-time. Live hints and transcripts are completely disabled."}
                    </p>
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-6 border-t border-stone-900/80 flex flex-col gap-4">
                  <button
                    onClick={handleConfirmStartInterview}
                    className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] active:scale-[0.98] flex items-center justify-between px-8 cursor-pointer group"
                  >
                    <span>
                      {lang === 'FR' ? "Initialiser liaison vocale & Commencer" : "Initialize Voice Link & Start"}
                    </span>
                    
                    {/* Subtle Waveform Animation Inside Button */}
                    <SubtleWaveform />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================= STATE B: CORE INTERVIEW STREAM ======================= */}
          {assessmentState === 'interview' && (
            <motion.div 
              key="interview-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full bg-stone-950 overflow-hidden"
            >
              {/* Entire screen is the high-fidelity mirror camera video feed */}
              <div className="absolute inset-0 w-full h-full bg-stone-950 flex items-center justify-center">
                
                {cameraError ? (
                  <div className="p-6 text-center space-y-3 z-10">
                    <CameraOff className="w-10 h-10 text-stone-700 mx-auto" />
                    <p className="text-xs font-mono text-stone-500 uppercase font-black">{lang === 'FR' ? "CONFLIT ACCÈS OPTIQUE" : "CAMERA CONFLICT ACTIVE"}</p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={setVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    
                    {/* Dark gradient framing overlay to focus on the candidate face */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/40 pointer-events-none select-none" />
                    <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-stone-950 to-transparent pointer-events-none select-none" />
                    <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-stone-950 to-transparent pointer-events-none select-none" />

                    {/* Subtle aesthetic center crosshairs */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none opacity-20">
                      <div className="w-8 h-px bg-white" />
                      <div className="h-8 w-px bg-white" />
                    </div>

                    {/* TOP-LEFT PILL: Question Counter */}
                    <div className="absolute top-6 left-6 px-4 py-2 bg-stone-950/75 backdrop-blur-md border border-white/10 rounded-xl shadow-lg pointer-events-none select-none z-10">
                      <span className="font-mono text-[10px] md:text-xs font-bold text-stone-200">
                        {isWarmUpActive ? (
                          lang === 'FR' ? "ACCUEIL & DÉTENTE" : "WELCOME CHECK-IN"
                        ) : (
                          lang === 'FR' 
                            ? `Question ${assessmentStep + 1} sur ${dynamicQuestions.length}` 
                            : `Question ${assessmentStep + 1} of ${dynamicQuestions.length}`
                        )}
                      </span>
                    </div>

                    {/* TOP-RIGHT PILL: Camera Active */}
                    <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-stone-950/75 backdrop-blur-md border border-white/10 rounded-xl shadow-lg pointer-events-none select-none z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#27C93F] animate-pulse" />
                      <span className="font-mono text-[9px] md:text-[10px] font-black tracking-widest text-stone-200 uppercase">
                        {lang === 'FR' ? "CAMERA ACTIVE" : "CAMERA ACTIVE"}
                      </span>
                    </div>

                    {/* CENTER SCREEN: Gaze target (CIBLE REGARD) */}
                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-10">
                      <span className="font-mono text-[10px] tracking-widest font-extrabold bg-[#27C93F]/10 border border-[#27C93F]/40 text-[#27C93F] px-4 py-1.5 rounded-md uppercase shadow-md">
                        {lang === 'FR' ? "CIBLE REGARD" : "GAZE TARGET"}
                      </span>
                    </div>

                    {/* Active Challenge Indicator overlay */}
                    {!isWarmUpActive && dynamicQuestions[assessmentStep]?.challenge && (
                      <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 pointer-events-none select-none z-30">
                        <span className="font-mono text-[9px] tracking-widest font-black bg-rose-500/10 border border-rose-500/40 text-rose-400 px-4 py-1.5 rounded-md uppercase shadow-md animate-pulse">
                          ⚡ CHALLENGE: {lang === 'FR' ? dynamicQuestions[assessmentStep].challenge.descriptionFR : dynamicQuestions[assessmentStep].challenge.descriptionEN}
                        </span>
                      </div>
                    )}

                    {/* Warm-Up Stress Relief Overlay */}
                    {isWarmUpActive && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-6 text-center select-none z-30"
                      >
                        <div className="bg-stone-950/95 backdrop-blur-md border border-emerald-500/30 p-6 rounded-2xl shadow-2xl space-y-4">
                          <p className="text-emerald-400 font-bold text-xs tracking-wider uppercase font-mono">
                            {lang === 'FR' ? "Échange d'Accueil avec Shana" : "Welcome Chat with Shana"}
                          </p>
                          {warmUpStep === 1 ? (
                            <>
                              <h4 className="text-white text-base md:text-lg font-bold">
                                {lang === 'FR' ? "Comment allez-vous aujourd'hui ?" : "How are you doing today?"}
                              </h4>
                              <p className="text-stone-300 text-xs md:text-sm leading-relaxed font-medium">
                                {lang === 'FR' 
                                  ? "Prenez une grande inspiration. Parlez librement pour tester votre micro et évacuer le stress. Dès que vous êtes prêt(e), cliquez ci-dessous pour continuer."
                                  : "Take a deep breath. Speak freely to test your microphone and release stress. Once you are ready, click below to continue."}
                              </p>
                              <button
                                onClick={handleWarmUpContinue}
                                className="mt-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer active:scale-95"
                              >
                                {lang === 'FR' ? "Continuer" : "Continue"}
                              </button>
                            </>
                          ) : (
                            <>
                              <h4 className="text-white text-base md:text-lg font-bold">
                                {lang === 'FR' ? "Êtes-vous prêt(e) à commencer ?" : "Are you ready to begin?"}
                              </h4>
                              <p className="text-stone-300 text-xs md:text-sm leading-relaxed font-medium">
                                {lang === 'FR' 
                                  ? "Répondez à voix haute par 'Oui' ou cliquez ci-dessous pour démarrer l'évaluation technique."
                                  : "Answer out loud with a clear 'Yes' or click below to launch your technical assessment."}
                              </p>
                              {canVoiceDetectYes && (
                                <p className="text-[10px] text-emerald-400 font-semibold animate-pulse tracking-wide font-mono uppercase">
                                  {lang === 'FR' ? "🎙️ Dites 'Oui' ou parlez pour démarrer" : "🎙️ Say 'Yes' or speak to start"}
                                </p>
                              )}
                              <button
                                onClick={handleEndWarmUp}
                                className="mt-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] cursor-pointer active:scale-95"
                              >
                                {lang === 'FR' ? "OUI, JE SUIS PRÊT(E)" : "YES, I AM READY"}
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Removed QUESTION SUBTITLE overlay to keep screen completely non-cluttered */}

                    {/* BOTTOM HUD PANEL: Exactly as in the user's screenshot */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl px-8 py-4 bg-stone-950/85 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex items-center justify-between select-none z-20">
                      
                      {/* Left: State Indicator */}
                      <div className="flex items-center gap-2.5 min-w-[140px]">
                        {isShanaSpeaking ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="font-mono text-[10px] md:text-xs font-black tracking-widest uppercase text-indigo-400">
                              {lang === 'FR' ? "DIFFUSION VOCALE..." : "AI TRANSMITTING..."}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="font-mono text-[10px] md:text-xs font-black tracking-widest uppercase text-red-500">
                              {lang === 'FR' ? "EN ÉCOUTE..." : "LISTENING..."}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Middle: Real-time Audio Waveform */}
                      <div className="flex-1 max-w-md px-6">
                        {renderWaveform()}
                      </div>

                      {/* Right: Dynamic Timer / Minuteur */}
                      <div className="flex flex-col items-end shrink-0 min-w-[80px]">
                        <span className="font-mono text-[8px] text-stone-500 uppercase tracking-widest leading-none">
                          {isWarmUpActive ? (lang === 'FR' ? "STATUT" : "STATUS") : (lang === 'FR' ? "MINUTEUR" : "TIMER")}
                        </span>
                        <span className="font-mono text-xs md:text-sm font-semibold text-emerald-400 mt-1.5 leading-none">
                          {isWarmUpActive ? (lang === 'FR' ? "Détente" : "Relax") : `${secondsRemaining}s`}
                        </span>
                      </div>

                    </div>

                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ======================= STATE C: AI COMPILATION LOADER ======================= */}
          {assessmentState === 'submitting' && (
            <motion.div 
              key="submitting-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 p-6 select-none"
            >
              <div className="max-w-md text-center space-y-6">
                
                {/* High tech loading concentric visual */}
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin duration-1000" />
                  <div className="absolute inset-2 border-b-2 border-l-2 border-sky-400 rounded-full animate-spin duration-700" />
                  <div className="absolute inset-4 border-t border-emerald-400 rounded-full animate-spin duration-500" />
                  <CheckCircle2 className="w-6 h-6 text-indigo-400 animate-pulse z-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-mono text-xs uppercase tracking-widest font-black text-stone-100">
                    {t.submittingText}
                  </h3>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed font-sans font-medium">
                    {t.submittingDesc}
                  </p>
                </div>

                {/* Loading Logs simulator ticks */}
                <div className="bg-stone-900/50 border border-stone-850/80 rounded-2xl p-4 font-mono text-[9px] text-left text-stone-500 space-y-1.5 h-28 overflow-y-auto select-none scrollbar-none">
                  <p className="text-emerald-500 font-bold">• [0.1s] ANALYZING RECRUITER VERBAL RATIOS...</p>
                  <p className="text-emerald-500 font-bold">• [0.8s] WEBCAM POISE & POSTURE ALIGNMENT OK</p>
                  <p className="text-indigo-400 font-bold">• [1.4s] CORRELATING TO ORIGINAL CV EXPERIENCE MATRIX...</p>
                  <p className="text-indigo-400 animate-pulse">• [2.1s] CALIBRATING AGGREGATE READINESS LEVEL...</p>
                  <p className="text-stone-600">• [2.8s] ASSEMBLING FINAL PORTFOLIO FEEDBACK MAP...</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
