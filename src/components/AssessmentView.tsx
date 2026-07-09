import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Language, SessionHistoryItem, QuestionFeedbackItem } from '../types';
import { translations } from '../translations';
import { StorageService } from '../lib/storage';
import { ShanaEventTracker } from '../lib/events';
import { SessionStateMachine, ShanaState } from '../lib/stateMachine';
import { AdaptiveEngine } from '../lib/adaptive';
import { InterviewDirector, InterviewType, DirectorSessionDesign } from '../lib/director';
import { generateReportPDF } from '../utils/pdfGenerator';
import { calculateIPS } from '../lib/ips';
import { ShanaOrchestrator } from '../lib/orchestrator';
import MirrorAssessmentRoom from './MirrorAssessmentRoom';
import PreSessionWarning from './PreSessionWarning';
import PostInterviewCoachingView from './PostInterviewCoachingView';
import { InterviewVoiceManager } from '../lib/InterviewVoiceManager';
import { 
  Camera, 
  CameraOff, 
  Video, 
  ShieldCheck, 
  Home, 
  AlertCircle, 
  Play, 
  Square, 
  CheckCircle, 
  TrendingUp, 
  Compass, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  Mic, 
  LockKeyhole, 
  User, 
  Info,
  Award,
  Download,
  Check,
  FileText,
  Share2,
  Twitter,
  Link2,
  Sliders,
  X,
  RefreshCw,
  HelpCircle,
  Activity,
  UserCheck,
  ArrowRight,
  Coins,
  Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CheckoutModal from './CheckoutModal';

interface AssessmentViewProps {
  user: UserProfile;
  lang: Language;
  onSessionComplete: (session: SessionHistoryItem) => void;
  onChangeTab: (tab: 'home' | 'train' | 'assessment' | 'history' | 'profile') => void;
}

export default function AssessmentView({ user, lang, onSessionComplete, onChangeTab }: AssessmentViewProps) {
  const t = translations[lang];

  // Candidate Adaptive Engine States (Feature 8, 9)
  const [adaptationSettings, setAdaptationSettings] = useState(() => 
    AdaptiveEngine.getSettings(user.id || 'usr_candidate')
  );

  const calculatedAdaptation = React.useMemo(() => {
    const history = StorageService.getHistory(user.id || 'usr_candidate') || [];
    return AdaptiveEngine.calculateAdaptation(user.id || 'usr_candidate', history);
  }, [user.id]);

  // Interview Director (Phase 21 Orchestrator)
  const [directorSettings, setDirectorSettings] = useState(() => 
    InterviewDirector.getSettings(user.id || 'usr_candidate')
  );
  
  const [rerollSeed, setRerollSeed] = useState(0);

  const orchestratedSession = React.useMemo(() => {
    const history = StorageService.getHistory(user.id || 'usr_candidate') || [];
    
    const decision = ShanaOrchestrator.orchestrateSession(
      user.id || 'usr_candidate',
      history,
      user.experienceLevel || 'Mid',
      lang,
      'sess_preview'
    );

    const originalOrchestrate = InterviewDirector.orchestrateSession(
      user.id || 'usr_candidate',
      history,
      user.experienceLevel || 'Mid'
    );

    if (directorSettings.status === 'disabled') {
      decision.interviewType = 'Standard Interview';
      decision.difficulty = 'Normal';
      decision.pacingSeconds = 45;
      decision.questionStyle = 'structured';
      decision.interruptionLevel = 'Low';
      decision.feedbackIntensity = 'Analytical';
      decision.serendipityTriggered = false;
    }

    if (rerollSeed > 0) {
      const types: any[] = ['Standard Interview', 'Pressure Interview', 'Technical Deep Dive', 'Behavioral Focus', 'Confidence Builder', 'Silent Recruiter', 'Rapid Fire Interview'];
      const nextIndex = (types.indexOf(decision.interviewType) + rerollSeed) % types.length;
      decision.interviewType = types[nextIndex];
      
      const diffs: any[] = ['Easy', 'Normal', 'Challenging', 'Stretch'];
      const nextDiffIndex = (diffs.indexOf(decision.difficulty) + rerollSeed) % diffs.length;
      decision.difficulty = diffs[nextDiffIndex];
    }

    const design: DirectorSessionDesign = {
      interviewType: decision.interviewType as any,
      difficulty: decision.difficulty,
      questionStyle: decision.questionStyle,
      pacing: decision.pacingSeconds === 120 ? 'Relaxed (120s)' : decision.pacingSeconds === 30 ? 'Rapid Fire (30s)' : 'Standard (45s)',
      interruptionLevel: decision.interruptionLevel,
      feedbackIntensity: decision.feedbackIntensity,
      serendipityTriggered: decision.serendipityTriggered,
      overrideApplied: decision.authority === 'adaptive',
      overrideReason: decision.authority === 'adaptive' ? decision.explanation : undefined,
      pacingSeconds: decision.pacingSeconds,
    };

    return {
      design,
      state: originalOrchestrate.state
    };
  }, [user.id, user.experienceLevel, directorSettings, rerollSeed, lang]);

  // Candidate Monetization & Checkout States
  const [monetization, setMonetization] = useState(() => StorageService.getCandidateMonetization(user.id || 'usr_candidate'));
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<string | null>(null);

  useEffect(() => {
    const handleProgressUpdate = () => {
      setMonetization(StorageService.getCandidateMonetization(user.id || 'usr_candidate'));
    };
    window.addEventListener('shana_progress_update', handleProgressUpdate);
    return () => {
      window.removeEventListener('shana_progress_update', handleProgressUpdate);
    };
  }, [user.id]);

  const hasMirrorCredits = monetization.ultraActive || (monetization.freeMirror + monetization.packMirror + monetization.topUpMirror) > 0;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'mirror' | 'standard' | null>(null);
  
  // High-fidelity Flow Steps: 'intro' | 'loading_blueprint' | 'assessment_plan' | 'interview' | 'final_evaluation' | 'immersive_mirror'
  const [assessmentState, setAssessmentState] = useState<'intro' | 'loading_blueprint' | 'assessment_plan' | 'interview' | 'final_evaluation' | 'immersive_mirror'>('intro');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const stateMachineRef = useRef<SessionStateMachine | null>(null);

  const transitionSessionState = (nextState: ShanaState, meta: Record<string, any> = {}) => {
    if (!stateMachineRef.current && currentSessionId) {
      stateMachineRef.current = new SessionStateMachine(user.id || 'usr_candidate', currentSessionId);
    }
    if (stateMachineRef.current) {
      const result = stateMachineRef.current.transitionTo(nextState, meta);
      if (!result.success) {
        console.warn(`[STATE MACHINE CONFLICT RESCUE] Attempted disallowed transition from ${stateMachineRef.current.getState()} to ${nextState}. Standard failsafe recovery triggered.`);
        stateMachineRef.current.transitionTo('IDLE');
        stateMachineRef.current.transitionTo(nextState, meta);
      }
    }
  };
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const [assessmentStep, setAssessmentStep] = useState<number>(0);
  const assessmentStepRef = useRef<number>(0);
  useEffect(() => {
    assessmentStepRef.current = assessmentStep;
  }, [assessmentStep]);
  const [secondsRemaining, setSecondsRemaining] = useState(45);
  const [speechActive, setSpeechActive] = useState<boolean>(false);
  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>([]);
  
  // Overall elapsed timer states
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);
  const [showWrittenQuestion, setShowWrittenQuestion] = useState(false);

  // Web Audio Context for real-time microphone level tracking
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const [micVolume, setMicVolume] = useState<number>(0);

  const isJunior = user.experienceLevel === 'junior';
  const totalSteps = isJunior ? 6 : 8;
  const targetDurationMins = isJunior ? 25 : 45;

  const [speechDetectedPerStep, setSpeechDetectedPerStep] = useState<boolean[]>(() => Array(isJunior ? 6 : 8).fill(false));

  const defaultPhases = lang === 'EN' 
    ? (isJunior ? [
        { label: "PHASE 1: RESUME DEFENSE (WARM-UP)", type: "Resume", question: `“Synthesize two core career milestones from your CV that demonstrate high-level fitness for the ${user.targetRole} role.”` },
        { label: "PHASE 2: TECHNICAL FOUNDATIONS", type: "Industry", question: `“Which core technologies or methodologies in the ${user.industry} sector are you most confident applying, and why?”` },
        { label: "PHASE 3: TECHNICAL TRAP (TRICK QUESTION)", type: "Technical_Trap", question: `“If a critical issue was discovered in your deliverable 1 hour before a demo, what is your exact step-by-step triage strategy?”` },
        { label: "PHASE 4: TIMELINE PRESSURE (BEHAVIORAL)", type: "Behavioral", question: `“Tell me about a time you had to correct a failing timeline under tight pressure without compromising output quality.”` },
        { label: "PHASE 5: ASSIMILATION CHECK (TRAP)", type: "Assimilation_Trap", question: `“Based on your recent training feedbacks, how did you consciously structure your communication style for this assessment today?”` },
        { label: "PHASE 6: CLOSING ROUND (EARLY DELIVERY)", type: "Pressure", question: `“Defend your tactical delivery choices when forced to ship a major rollout 48 hours early under tight client observation.”` }
      ] : [
        { label: "PHASE 1: EXECUTIVE PEDIGREE & WARM-UP", type: "Resume", question: `“Synthesize your executive career milestones that justify your high-level placement for the ${user.targetRole} role.”` },
        { label: "PHASE 2: ARCHITECTURAL & METHODOLOGICAL DEEP-DIVE", type: "Architecture", question: `“Detail your design patterns or system methodologies for scaling highly resilient solutions in the ${user.industry} sector.”` },
        { label: "PHASE 3: SECTOR SHOCKWAVE MITIGATION", type: "Industry_Shock", question: `“In the face of sudden sector disruption or a major paradigm shift, what is your immediate strategic risk mitigation playbook?”` },
        { label: "PHASE 4: HIGH-STAKES BEHAVIORAL CRISIS", type: "Behavioral", question: `“Describe a high-value project failure or stakeholder conflict you successfully resolved under extreme constraints.”` },
        { label: "PHASE 5: RECENT WEAKNESS PROBING (TRAP QUESTION)", type: "Weakness_Trap", question: `“Address head-on how you have actively corrected your previous training session weaknesses in structured delivery and precision.”` },
        { label: "PHASE 6: CRISIS LEADERSHIP & INCOMPLETE INFO", type: "Leadership", question: `“Defend your decision-making framework when forced to steer a major product shift under high ambiguity and partial metrics.”` },
        { label: "PHASE 7: TACTICAL DELIVERY PRESSURE", type: "Delivery_Pressure", question: `“Defend your delivery scaling when forced to deploy a high-stakes release 48 hours early under direct client scrutiny.”` },
        { label: "PHASE 8: INTEGRITY & STAKEHOLDER CONFRONTATION", type: "Stakeholder_Trap", question: `“If a powerful board member completely rejects your rollout strategy with aggressive pushback, how do you defend your position?”` }
      ])
    : (isJunior ? [
        { label: "PHASE 1 : RÉALISATIONS PRO (RÉSUMÉ)", type: "Resume", question: `“Synthétisez deux accomplissements majeurs de votre parcours démontrant que vous êtes paré pour assumer le poste de ${user.targetRole}.”` },
        { label: "PHASE 2 : ANCRAGE SECTORIEL & TECHNIQUE", type: "Industry", question: `“Quelles technologies ou méthodologies clés du secteur ${user.industry} maîtrisez-vous le mieux pour ce poste ?”` },
        { label: "PHASE 3 : PIÈGE TECHNIQUE (SÉCURITÉ)", type: "Technical_Trap", question: `“Comment géreriez-vous une faille de sécurité mineure mais critique détectée juste avant une présentation client ?”` },
        { label: "PHASE 4 : GESTION DES DÉLAIS (COMPORTEMENTAL)", type: "Behavioral", question: `“Présentez un cas où vous avez dû corriger un calendrier de livraison défaillant sans sacrifier la qualité.”` },
        { label: "PHASE 5 : ACQUIS DES ENTRAÎNEMENTS (VIGILANCE)", type: "Assimilation_Trap", question: `“Lors de vos sessions précédentes, nous avons identifié des axes d'amélioration. Comment avez-vous adapté votre structure de réponse aujourd'hui ?”` },
        { label: "PHASE 6 : PRESSION FINALE (LIVRAISON HÂTIVE)", type: "Pressure", question: `“Défendez vos choix opérationnels face à une demande de livraison avancée de 48 heures par votre client.”` }
      ] : [
        { label: "PHASE 1 : SÉQUENCE ENTRÉE & PÉDIGRÉE", type: "Resume", question: `“Présentez les jalons clés de votre carrière de leader montrant votre aptitude pour le rôle de ${user.targetRole}.”` },
        { label: "PHASE 2 : ARCHITECTURE & CONCEPTION", type: "Architecture", question: `“Expliquez vos choix de conception de systèmes ou d'architectures d'équipe pour garantir la résilience et l'évolutivité dans le secteur ${user.industry}.”` },
        { label: "PHASE 3 : STRATÉGIE DE CRISE SECTORIELLE", type: "Industry_Shock", question: `“Face à une disruption technologique majeure, quelle stratégie d'atténuation des risques déploieriez-vous immédiatement ?”` },
        { label: "PHASE 4 : SCÉNARIO DE CRISE COMPORTEMENTALE", type: "Behavioral", question: `“Décrivez une situation où vous avez résolu un conflit critique impliquant des parties prenantes de haut niveau.”` },
        { label: "PHASE 5 : PIÈGE DES AXES D'ÉVOLUTION", type: "Weakness_Trap", question: `“Démontrez de façon concrète comment vous avez surmonté vos faiblesses d'élocution ou de précision technique issues de vos entraînements récents.”` },
        { label: "PHASE 6 : LEADERSHIP DE CRISE DÉCISIONNELLE", type: "Leadership", question: `“Comment arbitrez-vous une décision stratégique cruciale lorsque vous disposez d'informations incomplètes ou contradictoires ?”` },
        { label: "PHASE 7 : TACTIQUE ET LIVRAISON HÂTIVE", type: "Delivery_Pressure", question: `“Défendez votre planification face à un commandement de déploiement hâtif sous l'observation vigilante du client.”` },
        { label: "PHASE 8 : DÉFENSE INTÉGRITÉ ET RÉSISTANCE", type: "Stakeholder_Trap", question: `“Si un membre du comité exécutif s'oppose fermement et de manière agressive à votre plan stratégique, comment maintenez-vous votre position sans rompre l'alliance ?”` }
      ]);

  const evaluationPhases = dynamicQuestions.length > 0 ? dynamicQuestions : defaultPhases;

  // Finalized Session Telemetry Storage State
  const [evaluationData, setEvaluationData] = useState<SessionHistoryItem | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [activeQuestionTab, setActiveQuestionTab] = useState<number>(0);
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});
  const [showShareDropdown, setShowShareDropdown] = useState<boolean>(false);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

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
    network?: {
      latencyHistory: number[];
      avgLatency: number;
      jitter: number;
      packetLoss: number;
      quality: 'excellent' | 'good' | 'poor';
    };
  } | null>(null);

  // loading simulation text sequences
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const loadingLogs = lang === 'EN' ? [
    "SYNCHRONIZING CAREER RESUME AND UPLOADED VECTORS...",
    "CONSTRUCTING PERSONALIZED INTERVIEW BLUEPRINT MATRIX...",
    "MAPPING INDUSTRY TRENDS & DISRUPTIVE SECTOR METRICS...",
    "ALIGNING PRESENCE TELEMETRY & CAMERA CALIBRATION...",
    "ISOLATING CONTEXT: ACTIVATE STRICT EVALUATION PROTOCOL..."
  ] : [
    "SYNCHRONISATION DU PARCOURS CV ET DES CLÉS DE COMPÉTENCES...",
    "IMPORTATION DE LA MATRICE DE CARRIÈRE PROTOCOLE...",
    "CHRONOLOGIE DES FACTEURS COGNITIFS ET SECTORIELS...",
    "ÉVALUATION DE LA CALIBRATION MIROIR DE LA CAMÉRA LOCAL...",
    "CONTEXTE : INITIALISATION DU PROTOCOLE D'ÉVALUATION STRICT..."
  ];

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Premium Voice speech synthesis with natural local fallback
  const speakQuestionText = (text: string) => {
    stopVoiceSpeaking();
    
    if (!InterviewVoiceManager.isAllowed('ASSESSMENT_PRIMARY')) {
      console.warn("[AssessmentView] Speech blocked because we do not own the voice lock.");
      return;
    }

    setSpeechActive(true);

    const cleanText = text.replace(/[*#_\\`"“”‘]/g, '');
    if (!cleanText) return;

    const audioUrl = `/api/interview/speak?text=${encodeURIComponent(cleanText)}`;
    
    const audioObj = InterviewVoiceManager.playServerAudio(
      audioUrl,
      'ASSESSMENT_PRIMARY',
      () => {
        setSpeechActive(false);
      },
      (err) => {
        console.warn("[SHANA] Assessment server speak failed, falling back to local speech.", err);
        speakQuestionTextLocal(cleanText);
      }
    );

    if (audioObj) {
      currentAudioRef.current = audioObj;
    }
  };

  const speakQuestionTextLocal = (cleanText: string) => {
    setSpeechActive(true);
    InterviewVoiceManager.speakLocal(
      cleanText, 
      lang === 'FR' ? 'fr-FR' : 'en-US', 
      'ASSESSMENT_PRIMARY',
      () => {
        setSpeechActive(false);
      }
    );
  };

  // stop speaking synthetic voice on unmount or slide switch
  const stopVoiceSpeaking = () => {
    InterviewVoiceManager.stopAllActiveOutputs();
    if (currentAudioRef.current) {
      currentAudioRef.current = null;
    }
    setSpeechActive(false);
  };

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
      network?: {
        latencyHistory: number[];
        avgLatency: number;
        jitter: number;
        packetLoss: number;
        quality: 'excellent' | 'good' | 'poor';
      };
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
      // Enumerate existing devices to see if hardware is connected
      const devices = await navigator.mediaDevices.enumerateDevices();
      results.cameraDevices = devices.filter(d => d.kind === 'videoinput');
      results.micDevices = devices.filter(d => d.kind === 'audioinput');
    } catch (e) {
      console.warn("Failed enumerating devices during diagnostics:", e);
    }

    // Test Camera individually
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

    // Test Microphone individually
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

    // Test Network Latency, Jitter, and Packet Loss
    const latencyHistory: number[] = [];
    let lostPackets = 0;
    const totalPings = 5;

    for (let i = 0; i < totalPings; i++) {
      const startPing = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
        const res = await fetch(`/api/ping?t=${Date.now()}&i=${i}`, {
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const endPing = performance.now();
          latencyHistory.push(Math.round(endPing - startPing));
        } else {
          lostPackets++;
        }
      } catch (err) {
        lostPackets++;
      }
      // Brief delay between pings to simulate real sequential interval testing
      await new Promise(r => setTimeout(r, 120));
    }

    const avgLatency = latencyHistory.length > 0 
      ? Math.round(latencyHistory.reduce((sum, val) => sum + val, 0) / latencyHistory.length) 
      : 999;

    // Calculate RFC 1889 jitter
    let jitter = 0;
    if (latencyHistory.length > 1) {
      let sumDiff = 0;
      for (let i = 1; i < latencyHistory.length; i++) {
        sumDiff += Math.abs(latencyHistory[i] - latencyHistory[i - 1]);
      }
      jitter = Math.round(sumDiff / (latencyHistory.length - 1));
    }

    const packetLoss = Math.round((lostPackets / totalPings) * 100);

    let networkQuality: 'excellent' | 'good' | 'poor' = 'poor';
    if (packetLoss === 0 && avgLatency <= 80 && jitter <= 15) {
      networkQuality = 'excellent';
    } else if (packetLoss <= 20 && avgLatency <= 150 && jitter <= 30) {
      networkQuality = 'good';
    } else {
      networkQuality = 'poor';
    }

    results.network = {
      latencyHistory,
      avgLatency,
      jitter,
      packetLoss,
      quality: networkQuality
    };

    setDiagnosticResults(results);
    setDiagnosticLoading(false);

    // If both are allowed, clear any camera error and kick off startCamera()
    if (results.cameraAccess === 'allowed' && results.micAccess === 'allowed') {
      setCameraError(false);
      startCamera();
    }
  };

  // Request Camera Stream for True Mirror Calibration
  const startCamera = async () => {
    try {
      setCameraError(false);
      
      // Stop old context if any
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close().catch(() => {});
        } catch (e) {}
        audioContextRef.current = null;
      }
      analyserNodeRef.current = null;

      if (cameraStreamRef.current) {
        // Stream already active, make sure videoRef is bound and playing
        if (videoRef.current) {
          if (videoRef.current.srcObject !== cameraStreamRef.current) {
            videoRef.current.srcObject = cameraStreamRef.current;
          }
          videoRef.current.play().catch(e => console.warn("Failed playing active video element:", e));
        }
        return;
      }

      let stream: MediaStream;
      try {
        // Try user facing mode with ideal resolution first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (err) {
        console.warn("Failing strict facingMode user, attempting generic video/audio constraints:", err);
        try {
          // Try generic video and audio
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
        } catch (err2) {
          console.warn("Failing video/audio, attempting audio-only fallback:", err2);
          // Try audio only as absolute fallback
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
        }
      }

      cameraStreamRef.current = stream;
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Failed playing newly requested video stream:", e));
      }

      // Initialize real-time Web Audio API monitoring on the acquired stream
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && stream && stream.getAudioTracks().length > 0) {
        try {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.4;
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

            if (level > 8) {
              setSpeechDetectedPerStep(prev => {
                const stepIdx = assessmentStepRef ? assessmentStepRef.current : 0;
                if (!prev[stepIdx]) {
                  const next = [...prev];
                  next[stepIdx] = true;
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
          console.warn("Could not set up mic level analyzer in AssessmentView:", audioErr);
        }
      }

    } catch (err) {
      console.warn("Camera or mic authorization failed completely:", err);
      setCameraError(true);
    }
  };

  // Stop Camera Stream
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

  // Keep camera running on intro screen, plan screen and interview screen for alignment/assessment
  useEffect(() => {
    if (assessmentState === 'intro' || assessmentState === 'interview' || assessmentState === 'assessment_plan') {
      startCamera();
    } else if (assessmentState === 'loading_blueprint') {
      stopCamera();
    }

    if (assessmentState === 'interview') {
      InterviewVoiceManager.acquireLock('ASSESSMENT_PRIMARY');
    } else {
      InterviewVoiceManager.releaseLock('ASSESSMENT_PRIMARY');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentState]);

  // Clean up speaking and stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopVoiceSpeaking();
      InterviewVoiceManager.releaseLock('ASSESSMENT_PRIMARY');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bind camera stream if video element becomes available in assessing
  useEffect(() => {
    if ((assessmentState === 'interview' || assessmentState === 'assessment_plan') && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.warn("Failed playing video on bind:", e));
    }
  }, [assessmentState, cameraStream]);

  // Handle Step 2 Load Blueprint timer simulation
  useEffect(() => {
    let interval: any = null;
    if (assessmentState === 'loading_blueprint') {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev >= loadingLogs.length - 1) {
            clearInterval(interval);
            // transition to assessment_plan
            startCamera().then(() => {
              setAssessmentState('assessment_plan');
            });
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentState]);

  const getStepTimeLimit = (stepIndex: number) => {
    const q = evaluationPhases[stepIndex];
    if (q?.challenge?.type === 'thirty_second_limit') {
      return 30;
    }
    return orchestratedSession.design.pacingSeconds || 45;
  };

  // Handle Step 3 Pressure Countdown Timer
  useEffect(() => {
    let timer: any = null;
    if (assessmentState === 'interview') {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleNextStep();
            const nextIdx = assessmentStep + 1;
            return getStepTimeLimit(nextIdx < evaluationPhases.length ? nextIdx : assessmentStep);
          }
          return prev - 1;
        });
        setTotalSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentState, assessmentStep, evaluationPhases]);

  const handleBeginAssessmentAction = () => {
    const newSessionId = `sess_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    setCurrentSessionId(newSessionId);
    
    // Initialize SessionStateMachine for this session
    stateMachineRef.current = new SessionStateMachine(user.id || 'usr_candidate', newSessionId);
    stateMachineRef.current.transitionTo('INTERVIEW_STARTING', { mode: 'ASSESS_STANDARD' });

    setAssessmentState('loading_blueprint');
    setTotalSecondsElapsed(0);
    setShowWrittenQuestion(false);
    // Stop the header camera preview to free up resources immediately
    window.dispatchEvent(new Event('shana_stop_header_camera'));

    const cvAnalysis = StorageService.getAnalysis(user.id || '');
    const history = StorageService.getHistory(user.id || '');
    const adSettings = AdaptiveEngine.getSettings(user.id || '');
    const adaptationObj = adSettings.status === 'accepted' ? calculatedAdaptation : null;

    // Log the event: adaptation_triggered
    ShanaEventTracker.logEvent(
      user.id || 'usr_candidate',
      newSessionId,
      'adaptation_triggered',
      {
        adaptationPath: calculatedAdaptation?.path || 'Standard',
        adaptationDifficulty: calculatedAdaptation?.difficulty || 'Mid',
        adaptationExplanation: lang === 'EN' ? calculatedAdaptation?.explanationEN : calculatedAdaptation?.explanationFR,
        smartChallenge: calculatedAdaptation?.smartChallenge || null,
        directorDesign: orchestratedSession.design
      }
    );

    if (adSettings.status === 'skipped') {
      AdaptiveEngine.saveSettings(user.id || '', { status: 'accepted' });
      setAdaptationSettings({ status: 'accepted' });
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
        adaptation: adaptationObj,
        director: orchestratedSession.design
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        setDynamicQuestions(data.questions);
      }
    })
    .catch(err => console.error("Error fetching dynamic assessment questions:", err));
  };

  const handleStartFirstPhase = () => {
    transitionSessionState('QUESTION_ACTIVE', { questionIndex: 0 });
    transitionSessionState('WAITING_ANSWER', { questionIndex: 0 });

    setAssessmentState('interview');
    setAssessmentStep(0);
    setSecondsRemaining(getStepTimeLimit(0));

    // Event: interview_started
    ShanaEventTracker.logEvent(
      user.id || 'usr_candidate',
      currentSessionId,
      'interview_started',
      {
        mode: 'ASSESS_STANDARD',
        targetRole: user.targetRole,
        industry: user.industry,
        language: lang,
        experienceLevel: user.experienceLevel,
        totalQuestions: evaluationPhases.length,
        blueprint: orchestratedSession.design
      }
    );

    const firstQuestion = evaluationPhases[0];
    if (firstQuestion) {
      // Event: question_asked
      ShanaEventTracker.logEvent(
        user.id || 'usr_candidate',
        currentSessionId,
        'question_asked',
        {
          questionIndex: 0,
          phaseLabel: firstQuestion.label,
          questionText: firstQuestion.question,
          type: firstQuestion.type,
          difficulty: firstQuestion.difficulty,
          isTrickQuestion: firstQuestion.isTrickQuestion,
          contextAware: firstQuestion.contextAware,
          challenge: firstQuestion.challenge
        }
      );
    }

    if (evaluationPhases.length > 0 && evaluationPhases[0]?.question) {
      speakQuestionText(evaluationPhases[0].question);
    }
  };

  const handleNextStep = () => {
    transitionSessionState('PROCESSING', { questionIndex: assessmentStep });
    stopVoiceSpeaking();
    setShowWrittenQuestion(false);

    // Event: answer_submitted
    const wasSpeechDetected = speechDetectedPerStep[assessmentStep] || false;
    ShanaEventTracker.logEvent(
      user.id || 'usr_candidate',
      currentSessionId,
      'answer_submitted',
      {
        questionIndex: assessmentStep,
        phaseLabel: evaluationPhases[assessmentStep]?.label,
        type: evaluationPhases[assessmentStep]?.type,
        speechDetected: wasSpeechDetected,
        secondsRemaining: secondsRemaining,
        secondsElapsed: (evaluationPhases[assessmentStep]?.challenge?.type === 'thirty_second_limit' ? 30 : 45) - secondsRemaining
      }
    );

    if (assessmentStep < evaluationPhases.length - 1) {
      const nextStep = assessmentStep + 1;
      setAssessmentStep(nextStep);
      setSecondsRemaining(getStepTimeLimit(nextStep));

      transitionSessionState('QUESTION_ACTIVE', { questionIndex: nextStep });
      transitionSessionState('WAITING_ANSWER', { questionIndex: nextStep });

      const nextQuestion = evaluationPhases[nextStep];
      if (nextQuestion) {
        // Event: question_asked
        ShanaEventTracker.logEvent(
          user.id || 'usr_candidate',
          currentSessionId,
          'question_asked',
          {
            questionIndex: nextStep,
            phaseLabel: nextQuestion.label,
            questionText: nextQuestion.question,
            type: nextQuestion.type,
            difficulty: nextQuestion.difficulty,
            isTrickQuestion: nextQuestion.isTrickQuestion,
            contextAware: nextQuestion.contextAware,
            challenge: nextQuestion.challenge
          }
        );
      }

      speakQuestionText(evaluationPhases[nextStep].question);
    } else {
      transitionSessionState('FEEDBACK_GENERATION');
      handleFinalizeAssessment();
    }
  };

  const handleFinalizeAssessment = () => {
    stopCamera();
    stopVoiceSpeaking();

    const totalCount = evaluationPhases.length;
    const spokeCount = speechDetectedPerStep.filter((sp, i) => i < totalCount && sp).length;
    const spokeAny = spokeCount > 0;

    // Map scores based on whether they spoke on specific phase types
    const hasSpokeType = (type: string) => {
      const idx = evaluationPhases.findIndex(q => q.type === type);
      return idx !== -1 && speechDetectedPerStep[idx];
    };

    const questionsFeedback: QuestionFeedbackItem[] = evaluationPhases.map((qf, idx) => {
      const spoke = speechDetectedPerStep[idx];
      const answerText = spoke ? `(Verbal defense captured successfully with average sound level: Standard)` : "";
      const ipsEval = calculateIPS(answerText, qf.question, lang, spoke);

      // Deterministic WPM computation based on question and speech detection
      const textLength = qf.question.length;
      const wpm = spoke ? 120 + (textLength % 30) : 0;
      const paceStr = spoke ? `${wpm} WPM` : "0 WPM";
      const paceRating = spoke ? (wpm > 150 ? "rushed" : wpm < 100 ? "slow" : "optimal") : "silent";

      return {
        phaseLabel: qf.label,
        questionText: qf.question,
        score: ipsEval.ips,
        pace: paceStr,
        paceRating: paceRating,
        clarity: ipsEval.breakdown.clarity,
        keyPositive: ipsEval.explanation.strength,
        improvementTip: ipsEval.explanation.tip,
        difficulty: qf.difficulty,
        isTrickQuestion: qf.isTrickQuestion,
        contextAware: qf.contextAware
      };
    });

    // Deterministic averages by matching phase types
    const getAverageForType = (types: string[]) => {
      const matching = questionsFeedback.filter((qf, i) => types.includes(evaluationPhases[i]?.type || ''));
      if (matching.length === 0) return spokeAny ? 75 : 0;
      const sum = matching.reduce((acc, curr) => acc + curr.score, 0);
      return Math.round(sum / matching.length);
    };

    const resumeScore = getAverageForType(["Resume"]);
    const industryScore = getAverageForType(["Industry", "Architecture"]);
    const behavioralScore = getAverageForType(["Behavioral"]);
    const adaptabilityScore = getAverageForType(["Pressure", "Delivery_Pressure", "Technical_Trap"]);

    const answeredFeedback = questionsFeedback.filter((_, i) => speechDetectedPerStep[i]);
    const avgClarity = answeredFeedback.length > 0 
      ? Math.round(answeredFeedback.reduce((acc, curr) => acc + curr.clarity, 0) / answeredFeedback.length) 
      : 0;
    
    // Average confidence across answered phases
    const avgConfidence = answeredFeedback.length > 0
      ? Math.round(answeredFeedback.reduce((acc, curr, idx) => {
          const spoke = speechDetectedPerStep[evaluationPhases.findIndex(p => p.label === curr.phaseLabel)];
          const answerText = spoke ? `(Verbal defense captured successfully with average sound level: Standard)` : "";
          const ipsEval = calculateIPS(answerText, curr.questionText, lang, spoke);
          return acc + ipsEval.breakdown.confidence;
        }, 0) / answeredFeedback.length)
      : 0;

    const communicationScore = spokeAny ? Math.round(avgClarity) : 0;
    const confidenceScore = spokeAny ? Math.round(avgConfidence) : 0;

    const finalScore = spokeAny 
      ? Math.round((resumeScore + industryScore + communicationScore + confidenceScore + adaptabilityScore + behavioralScore) / 6)
      : 0;

    const strengths = spokeAny 
      ? (lang === 'EN' ? [
          hasSpokeType("Resume") ? "Clear articulation of professional achievements and CV milestones." : "Maintained posture focus during warm-up.",
          (hasSpokeType("Industry") || hasSpokeType("Architecture")) ? "Excellent awareness of disruptive sector trends and architectural scaling." : "Maintained eye baseline during technical prompts.",
          hasSpokeType("Behavioral") ? "Outstanding composure and delivery structure under tight timers." : "Steady ocular baseline facing high-pressure rounds."
        ] : [
          hasSpokeType("Resume") ? "Explication claire et structurée des réalisations professionnelles majeures." : "Maintien de la concentration posturale en phase d'introduction.",
          (hasSpokeType("Industry") || hasSpokeType("Architecture")) ? "Très bonne compréhension des vents contraires et architectures sectorielles." : "Maintien de l'alignement visuel face aux questions techniques.",
          hasSpokeType("Behavioral") ? "Sang-froid exceptionnel et excellente structure face aux contraintes temporelles." : "Expression corporelle stable face aux minuteurs de tension."
        ])
      : (lang === 'EN' ? ["Video feed was active.", "Composure and eye baseline tracked."] : ["Flux vidéo actif.", "Postures et baseline oculaire suivies."]);

    const weaknessList: string[] = [];
    if (!hasSpokeType("Resume")) weaknessList.push(lang === 'EN' ? "Warm-up resume defence was silent" : "La défense de CV d'échauffement est restée silencieuse");
    if (!hasSpokeType("Industry") && !hasSpokeType("Architecture")) weaknessList.push(lang === 'EN' ? "Industry or architecture deep-dive was silent" : "La phase technique d'ancrage sectoriel est restée silencieuse");
    if (!hasSpokeType("Behavioral")) weaknessList.push(lang === 'EN' ? "Behavioral pressure questions went unanswered" : "Les questions de mise sous pression comportementale sont restées sans réponse");
    if (!hasSpokeType("Pressure") && !hasSpokeType("Delivery_Pressure")) weaknessList.push(lang === 'EN' ? "Pressure tolerance closing round was silent" : "La séquence finale sous pression est restée silencieuse");
    
    if (weaknessList.length === 0 && spokeAny) {
      weaknessList.push(lang === 'EN' ? "Slight pacing acceleration under final complex behavioral constraints." : "Accélération du débit élocutoire sous contraintes complexes.");
    }

    const weakness = spokeAny
      ? weaknessList.join(". ")
      : (lang === 'EN'
        ? "No voice activity was detected. Your responses were completely silent."
        : "Aucune activité vocale n'a été détectée. Vos réponses étaient complètement silencieuses.");

    const recommendation = spokeAny
      ? (lang === 'EN'
        ? "Stabilize respiratory baseline at transition points. Practice speaking aloud continuously to improve conversational pacing."
        : "Stabilisez votre respiration au niveau des transitions de phrases clés. Entraînez-vous à parler en continu pour fluidifier le débit.")
      : (lang === 'EN'
        ? "Ensure your microphone is unmuted, verify your browser's audio permissions, and speak clearly when responding."
        : "Assurez-vous que votre micro est activé, validez les permissions de votre navigateur, et parlez à voix haute pour répondre.");

    const mins = Math.floor(totalSecondsElapsed / 60);
    const secs = totalSecondsElapsed % 60;
    const durationStr = `${mins}m ${secs}s`;

    const sessionPayload: SessionHistoryItem = {
      id: 'sess_' + Math.random().toString(36).substr(2, 9),
      type: 'ASSESS',
      date: new Date().toLocaleDateString(lang === 'EN' ? 'en-US' : 'fr-FR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      score: finalScore,
      resumeScore,
      industryScore,
      communicationScore,
      confidenceScore,
      adaptabilityScore,
      behavioralScore,
      weakness,
      recommendation,
      strengths,
      questionsFeedback,
      blueprintId: 'blu_active',
      duration: durationStr,
      language: lang,
      createdAt: new Date().toISOString()
    };

    setEvaluationData(sessionPayload);

    // Event: answer_analyzed (one per question)
    questionsFeedback.forEach((qf, idx) => {
      ShanaEventTracker.logEvent(
        user.id || 'usr_candidate',
        currentSessionId,
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
      currentSessionId,
      'score_generated',
      {
        finalScore,
        resumeScore,
        industryScore,
        communicationScore,
        confidenceScore,
        adaptabilityScore,
        behavioralScore
      }
    );

    // Event: insight_generated
    ShanaEventTracker.logEvent(
      user.id || 'usr_candidate',
      currentSessionId,
      'insight_generated',
      {
        strengths,
        weakness,
        recommendation
      }
    );

    // Event: interview_completed
    ShanaEventTracker.logEvent(
      user.id || 'usr_candidate',
      currentSessionId,
      'interview_completed',
      {
        sessionId: currentSessionId,
        date: sessionPayload.date,
        score: finalScore,
        duration: durationStr,
        totalQuestions: totalCount,
        spokeAny
      }
    );

    // Consume 1 MIRROR credit upon complete
    StorageService.consumeCandidateCredit(user.id || 'usr_candidate', 'MIRROR');
    window.dispatchEvent(new Event('shana_progress_update'));

    // Evaluate adaptation effectiveness (Learning Loop) before saving in history
    const previousHistory = StorageService.getHistory(user.id || '') || [];
    AdaptiveEngine.evaluateSession(user.id || '', sessionPayload, previousHistory);

    // Save session in History
    onSessionComplete(sessionPayload);
    transitionSessionState('COMPLETED');
    setAssessmentState('final_evaluation');
  };

  // Helper score rendering bands
  const getReadinessBand = (score: number) => {
    if (score >= 85) return { label: lang === 'EN' ? "Strong Candidate" : "Candidat Exceptionnel", color: "text-emerald-700 bg-emerald-50 border-emerald-100" };
    if (score >= 70) return { label: lang === 'EN' ? "Interview Ready" : "Prêt pour l'Entretien", color: "text-indigo-700 bg-indigo-50 border-indigo-100" };
    if (score >= 50) return { label: lang === 'EN' ? "Developing" : "En Développement", color: "text-amber-700 bg-amber-50 border-amber-100" };
    return { label: lang === 'EN' ? "Needs Preparation" : "Préparation Nécessaire", color: "text-red-700 bg-red-50 border-red-100" };
  };

  const handleMirrorRoomComplete = (sessionPayload: any) => {
    // Consume 1 MIRROR credit upon complete
    StorageService.consumeCandidateCredit(user.id || 'usr_candidate', 'MIRROR');
    window.dispatchEvent(new Event('shana_progress_update'));

    setEvaluationData(sessionPayload);

    // Evaluate adaptation effectiveness (Learning Loop) before saving in history
    const previousHistory = StorageService.getHistory(user.id || '') || [];
    AdaptiveEngine.evaluateSession(user.id || '', sessionPayload, previousHistory);

    onSessionComplete(sessionPayload);
    setAssessmentState('final_evaluation');
  };

  return (
    <div id="assessment-container" className="max-w-4xl mx-auto py-2 selection:bg-[#1A2B3C] selection:text-white">
      
      <AnimatePresence mode="wait">

        {/* ==================== IMMERSIVE MIRROR ROOM (FULL-SCREEN MODE) ==================== */}
        {assessmentState === 'immersive_mirror' && (
          <MirrorAssessmentRoom
            user={{
              id: user.id || 'usr_temp',
              firstName: user.name?.split(' ')[0] || 'Candidate',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              targetRole: user.targetRole,
              industry: user.industry,
              experienceLevel: user.experienceLevel
            }}
            lang={lang}
            onClose={() => setAssessmentState('intro')}
            onComplete={handleMirrorRoomComplete}
            questions={evaluationPhases}
          />
        )}
        
        {/* ==================== STEP 1 — MIRROR ASSESSMENT (INTRO SCREEN) ==================== */}
        {assessmentState === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Context Header */}
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-stone-950 font-black bg-[#EDC154] px-2.5 py-1 rounded-md border-2 border-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                {lang === 'EN' ? "STAGE 01 // FORMAL MEASUREMENT PROTOCOL" : "PHASE 01 // PROTOCOLE DE MESURE STRICT"}
              </span>
              <h1 id="assess-title" className="text-2xl md:text-3xl font-sans font-black text-stone-950 uppercase tracking-tight mt-3">
                {lang === 'EN' ? "SHANA Mirror Assessment" : "Évaluation Miroir SHANA"}
              </h1>
              <p className="text-[10px] text-[#6B7280] uppercase tracking-widest font-mono font-bold mt-1">
                {lang === 'EN' ? "Focus: Neutral poise & delivery analysis. Realistic interview conditions." : "Accent : Neutralité & analyse d'élocution. Conditions réelles d'entretien."}
              </p>
            </div>

            {/* Warning Rule Callout */}
            <div id="assess-rule-warning" className="bg-white border-2 border-stone-950 rounded-[24px] p-5 flex items-start gap-4 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
              <div className="w-10 h-10 bg-stone-50 text-stone-950 rounded-2xl flex items-center justify-center shrink-0 border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                <LockKeyhole className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="font-mono text-[8.5px] uppercase font-black text-red-655 bg-red-50 border-2 border-stone-950 px-1.5 py-0.5 rounded tracking-widest shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                  {lang === 'EN' ? "ASSESS MODE ACTIVE" : "MODE ÉVALUATION RECRUTEUR ACTIF"}
                </span>
                <h4 className="text-xs font-black text-stone-950 uppercase">
                  {lang === 'EN' ? "No assistance. No Coaching. Camera Required." : "Aucune aide. Aucun coaching. Caméra Requise."}
                </h4>
                <p className="text-[#6B7280] text-[11px] leading-relaxed font-semibold">
                  {lang === 'EN' 
                    ? "In ASSESS mode, SHANA conducts realistic diagnostic interviews. No transcripts, suggestions, or live scoring are provided. You will receive your complete Interview Readiness Score once finished."
                    : "En mode ASSESS, SHANA mène des évaluations rigoureuses. Aucun texte de suggestion ou rétroaction en direct n'est proposé. Vos statistiques complètes s'afficheront en fin de parcours."}
                </p>
              </div>
            </div>

            {/* Global Orchestration Engine — Interview Director Block (Feature 8) */}
            <div id="director-orchestrator-block" className="bg-stone-950 text-white rounded-[24px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] border-2 border-stone-950 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-stone-800 pb-4">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#EDC154] font-black bg-stone-900 border-2 border-stone-800 px-2 py-0.5 rounded">
                      {lang === 'EN' ? "SHANA Global Orchestration Engine (Phase 21)" : "Moteur d'Orchestration Globale SHANA (Phase 21)"}
                    </span>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    {lang === 'EN' ? "Interview Director Preview" : "Aperçu du Directeur d'Entretien"}
                  </h3>
                </div>
                
                {/* Journey Stage & Engagement Risk info */}
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1.5 bg-stone-900 border-2 border-stone-850 rounded-full px-3 py-1 text-[10px] font-mono font-black text-[#EDC154]">
                    <span className="font-bold">{lang === 'EN' ? "Journey Stage:" : "Niveau :"}</span>
                    <span>{orchestratedSession.state.currentStage}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 border-2 rounded-full px-3 py-1 text-[10px] font-mono font-black ${
                    orchestratedSession.state.engagementRisk === 'High' 
                      ? 'bg-red-950 border-red-500 text-red-400' 
                      : orchestratedSession.state.engagementRisk === 'Medium'
                      ? 'bg-amber-950 border-amber-500 text-amber-400'
                      : 'bg-emerald-950 border-emerald-500 text-emerald-400'
                  }`}>
                    <span className="font-bold">{lang === 'EN' ? "Engagement Health:" : "Santé d'Engagement :"}</span>
                    <span>{orchestratedSession.state.engagementRisk === 'High' ? (lang === 'EN' ? 'Low Resilience' : 'Fatigue Haute') : orchestratedSession.state.engagementRisk === 'Medium' ? (lang === 'EN' ? 'Moderate' : 'Moyenne') : (lang === 'EN' ? 'Optimal' : 'Optimale')}</span>
                  </div>
                </div>
              </div>

              {/* Central Information: Focus Format & Explanation */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-stone-900 border-2 border-stone-800 rounded-xl text-[#EDC154]">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-[#EDC154] uppercase tracking-wider font-black">
                        {lang === 'EN' ? "Target Format" : "Format d'Entretien"}
                      </div>
                      <div className="text-base font-bold text-white flex items-center gap-2">
                        {orchestratedSession.design.interviewType}
                        <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-stone-900 border-2 border-stone-800 text-[#EDC154]">
                          {orchestratedSession.design.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-stone-300 text-[11px] leading-relaxed font-bold">
                    {directorSettings.status === 'active' 
                      ? (lang === 'EN' 
                          ? `The Global Orchestrator has generated a highly personalized "${orchestratedSession.design.interviewType}" matching your progress level, current strength trends, and speech speed indicators.`
                          : `L'Orchestrateur Global a conçu un format personnalisé "${orchestratedSession.design.interviewType}" adapté à votre niveau de progression, vos tendances de score et votre débit de parole.`)
                      : directorSettings.status === 'custom'
                      ? (lang === 'EN' ? "Custom manual overrides applied. Automatic orchestration is partially bypassed." : "Ajustements manuels appliqués. L'orchestration automatique est partiellement suspendue.")
                      : (lang === 'EN' ? "Global Orchestration is completely disabled. Running generic non-adaptive standard assessments." : "L'orchestration globale est désactivée. Lancement d'évaluations standards génériques.")
                    }
                  </p>

                  {/* Adaptive Override Indicator */}
                  {orchestratedSession.design.overrideApplied && (
                    <div className="flex items-start gap-2 bg-stone-900 border-2 border-[#EDC154] rounded-xl p-3 text-[10px] text-[#EDC154] font-bold leading-relaxed">
                      <span className="shrink-0 text-amber-400 font-bold mt-0.5">⚠️ {lang === 'EN' ? "System Shield Active:" : "Bouclier Système Actif :"}</span>
                      <span>{orchestratedSession.design.overrideReason}</span>
                    </div>
                  )}

                  {/* Serendipity active notification */}
                  {orchestratedSession.design.serendipityTriggered && (
                    <div className="flex items-center gap-1.5 bg-stone-900 border-2 border-emerald-500 rounded-xl p-2 text-emerald-400 text-[10px] font-mono font-black animate-pulse">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                      <span>🌟 {lang === 'EN' ? "Serendipity Discovery Event Queued for this Session!" : "Événement de Découverte Fortuite programmé pour cette Session !"}</span>
                    </div>
                  )}
                </div>

                {/* Sub-Parameters pills */}
                <div className="lg:col-span-4 bg-stone-900 border-2 border-stone-800 rounded-xl p-4 grid grid-cols-2 gap-3 shadow-[2px_2px_0px_0px_rgba(237,193,84,1)]">
                  <div className="text-left">
                    <div className="text-[9px] font-mono text-stone-400 uppercase tracking-wider font-black">Pacing</div>
                    <div className="text-xs font-black text-white uppercase">{orchestratedSession.design.pacing}</div>
                  </div>
                  <div className="text-left">
                    <div className="text-[9px] font-mono text-stone-400 uppercase tracking-wider font-black">Style</div>
                    <div className="text-xs font-black text-white uppercase">{orchestratedSession.design.questionStyle}</div>
                  </div>
                  <div className="text-left">
                    <div className="text-[9px] font-mono text-stone-400 uppercase tracking-wider font-black">Interruption</div>
                    <div className="text-xs font-black text-white uppercase">{orchestratedSession.design.interruptionLevel}</div>
                  </div>
                  <div className="text-left">
                    <div className="text-[9px] font-mono text-stone-400 uppercase tracking-wider font-black">Feedback</div>
                    <div className="text-xs font-black text-white text-ellipsis overflow-hidden whitespace-nowrap uppercase">{orchestratedSession.design.feedbackIntensity}</div>
                  </div>
                </div>
              </div>

              {/* Configuration Controls (Feature 8) */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t-2 border-stone-800">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const settings = { status: 'active' as const };
                      InterviewDirector.saveSettings(user.id || '', settings);
                      setDirectorSettings(settings);
                      setRerollSeed(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-stone-950 ${
                      directorSettings.status === 'active' && rerollSeed === 0
                        ? 'bg-[#18633F] text-white shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]'
                        : 'bg-stone-900 text-stone-200 hover:bg-stone-850'
                    }`}
                  >
                    {lang === 'EN' ? "Orchestrated" : "Orchestré"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRerollSeed(prev => prev + 1);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black bg-stone-900 text-stone-200 hover:bg-stone-850 border-2 border-stone-800 uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {lang === 'EN' ? "Re-Roll Design" : "Re-Générer le Plan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const settings = { status: 'disabled' as const };
                      InterviewDirector.saveSettings(user.id || '', settings);
                      setDirectorSettings(settings);
                      setRerollSeed(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-2 border-stone-950 ${
                      directorSettings.status === 'disabled'
                        ? 'bg-stone-100 text-stone-900 shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]'
                        : 'bg-stone-900 text-stone-200 hover:bg-stone-850'
                    }`}
                  >
                    {lang === 'EN' ? "Skip to Standard" : "Sauter au Standard"}
                  </button>
                </div>

                {/* Dropdowns for direct Custom Focus manual override */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#EDC154] uppercase tracking-wider">
                    {lang === 'EN' ? "Manual Custom:" : "Ajustement Manuel :"}
                  </span>
                  <select
                    value={directorSettings.status === 'custom' ? (directorSettings.customType || '') : ''}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        const settings = { status: 'active' as const };
                        InterviewDirector.saveSettings(user.id || '', settings);
                        setDirectorSettings(settings);
                      } else {
                        const settings = { 
                          status: 'custom' as const, 
                          customType: e.target.value as InterviewType,
                          customDifficulty: directorSettings.customDifficulty || 'Normal'
                        };
                        InterviewDirector.saveSettings(user.id || '', settings);
                        setDirectorSettings(settings);
                      }
                    }}
                    className="bg-stone-900 border-2 border-stone-800 text-xs font-black text-white rounded-lg px-2 py-1 focus:outline-none focus:border-[#EDC154]"
                  >
                    <option value="">{lang === 'EN' ? "-- Auto Format --" : "-- Format Auto --"}</option>
                    <option value="Standard Interview">Standard Interview</option>
                    <option value="Pressure Interview">Pressure Interview</option>
                    <option value="Technical Deep Dive">Technical Deep Dive</option>
                    <option value="Behavioral Focus">Behavioral Focus</option>
                    <option value="Confidence Builder">Confidence Builder</option>
                    <option value="Silent Recruiter">Silent Recruiter</option>
                    <option value="Rapid Fire Interview">Rapid Fire Interview</option>
                  </select>

                  <select
                    value={directorSettings.status === 'custom' ? (directorSettings.customDifficulty || '') : ''}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        const settings = { status: 'active' as const };
                        InterviewDirector.saveSettings(user.id || '', settings);
                        setDirectorSettings(settings);
                      } else {
                        const settings = { 
                          status: 'custom' as const, 
                          customType: directorSettings.customType || 'Standard Interview',
                          customDifficulty: e.target.value as any
                        };
                        InterviewDirector.saveSettings(user.id || '', settings);
                        setDirectorSettings(settings);
                      }
                    }}
                    className="bg-stone-900 border-2 border-stone-800 text-xs font-black text-white rounded-lg px-2 py-1 focus:outline-none focus:border-[#EDC154]"
                  >
                    <option value="">{lang === 'EN' ? "-- Auto Diff --" : "-- Difficulté Auto --"}</option>
                    <option value="Easy">Easy / Facile</option>
                    <option value="Normal">Normal</option>
                    <option value="Challenging">Challenging / Défi</option>
                    <option value="Stretch">Stretch / Intense</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Primary Grid Layout: Setup Details & Live Webcam Calibration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Profile specifications parameters panel */}
              <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 space-y-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                
                <div className="space-y-4">
                  <h3 className="font-sans font-black text-sm text-stone-950 border-b-2 border-stone-950 pb-2.5 uppercase tracking-wide">
                    {lang === 'EN' ? "Assessment Specifications" : "Spécifications de l'Évaluation"}
                  </h3>

                  <div className="space-y-3 font-semibold text-xs text-[#111827]">
                    <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                      <span className="text-stone-500 font-mono text-[10px] uppercase font-black">{lang === 'EN' ? "Target Position" : "Poste Ciblé"}</span>
                      <span className="text-stone-950 font-black">{user.targetRole}</span>
                    </div>

                    <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                      <span className="text-stone-500 font-mono text-[10px] uppercase font-black">{lang === 'EN' ? "Industry Matrix" : "Secteur Actif"}</span>
                      <span className="text-stone-950 font-black">{user.industry}</span>
                    </div>

                    <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                      <span className="text-stone-500 font-mono text-[10px] uppercase font-black">{lang === 'EN' ? "Assessment Duration" : "Durée de l'Évaluation"}</span>
                      <span className="text-stone-950 font-black">{evaluationPhases.length} Questions / ~{Math.ceil((evaluationPhases.length * 45) / 60)} Mins</span>
                    </div>

                    <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                      <span className="text-stone-500 font-mono text-[10px] uppercase font-black">{lang === 'EN' ? "Pressure Limit" : "Limite Pression"}</span>
                      <span className="text-red-650 font-mono font-black">45s / Question</span>
                    </div>
                  </div>

                  {/* Curriculums sections monitored */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-stone-500 font-mono text-[9px] uppercase tracking-wider font-black block">
                      {lang === 'EN' ? "EVALUATION FIELDS" : "CRITÈRES DE MESURE"}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Resume Defense", "Industry Landscape", "Behavioral Maturity", "Pressure Response"].map((tag, idx) => (
                        <span key={idx} className="text-[10px] font-mono bg-[#A7F3D0] text-stone-950 border-2 border-stone-950 px-2.5 py-0.5 rounded-full font-black shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {!hasMirrorCredits ? (
                  <div className="p-4 border-2 border-dashed border-stone-950 bg-stone-50 rounded-2xl space-y-3.5 text-left animate-fade-in mt-4 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]" id="assessment-credits-locked-card">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 bg-[#EDC154] border-2 border-stone-950 text-stone-950 rounded-xl flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                        <LockKeyhole className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="font-mono text-[8px] uppercase tracking-widest bg-stone-900 border-2 border-stone-950 text-stone-100 px-2.5 py-0.5 rounded font-black shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                          {lang === 'FR' ? "ÉVALUATION VERROUILLÉE" : "EVALUATION LOCKED"}
                        </span>
                        <h4 className="text-xs font-black text-stone-950 uppercase mt-1">
                          {lang === 'FR' ? "Crédits d'évaluation épuisés" : "Out of prepaid evaluation credits"}
                        </h4>
                        <p className="text-[10px] text-stone-600 font-bold leading-relaxed mt-0.5">
                          {lang === 'FR' 
                            ? "Veuillez vous abonner à Ultra Illimité ou recharger un pack Premium pour lancer cette évaluation caméra."
                            : "Subscribe to Ultra Unlimited or buy a Premium pack to launch this live evaluation."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {/* Premium Pack Option (which has 1 mirror evaluation!) */}
                      <div className="bg-white border-2 border-stone-950 p-3 rounded-xl flex flex-col justify-between text-left shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                        <div>
                          <span className="text-[9px] font-black text-stone-950 block uppercase tracking-wider">{lang === 'FR' ? "Pack Premium" : "Premium Pack"}</span>
                          <span className="text-[10px] font-bold text-stone-500 block mt-0.5 leading-relaxed">
                            {lang === 'FR' ? "5 Audio + 1 Éval Miroir" : "5 Audio + 1 Mirror evaluation"}
                          </span>
                        </div>
                        <button
                          type="button"
                          id="assess-buy-premium-btn"
                          onClick={() => setSelectedProductForCheckout('pack_premium')}
                          className="mt-2.5 w-full py-2 bg-[#18633F] hover:bg-[#1f7c50] text-white font-black text-[9px] uppercase tracking-wider rounded-lg border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)] cursor-pointer text-center"
                        >
                          {lang === 'FR' ? "Acheter • 7.99€" : "Buy • 7.99€"}
                        </button>
                      </div>

                      {/* Top Up 1 Mirror Evaluation Option */}
                      <div className="bg-white border-2 border-stone-950 p-3 rounded-xl flex flex-col justify-between text-left shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                        <div>
                          <span className="text-[9px] font-black text-stone-950 block uppercase tracking-wider">{lang === 'FR' ? "Recharge Miroir" : "Mirror Top-Up"}</span>
                          <span className="text-[10px] font-bold text-stone-500 block mt-0.5 leading-relaxed">
                            {lang === 'FR' ? "+1 Évaluation Miroir" : "+1 Mirror simulation"}
                          </span>
                        </div>
                        <button
                          type="button"
                          id="assess-buy-topup-btn"
                          onClick={() => setSelectedProductForCheckout('topup_1_mirror')}
                          className="mt-2.5 w-full py-2 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 font-black text-[9px] uppercase tracking-wider rounded-lg border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)] cursor-pointer text-center"
                        >
                          {lang === 'FR' ? "Acheter • 4.99€" : "Buy • 4.99€"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      id="btn-begin-immersive-mirror"
                      onClick={() => {
                        setPendingAction('mirror');
                        setShowWarningModal(true);
                      }}
                      disabled={cameraError}
                      className="w-full mt-4 py-4 bg-[#18633F] hover:bg-[#1f7c50] disabled:bg-stone-450 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border-2 border-stone-950 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] flex items-center justify-between px-6 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-pulse text-indigo-200" />
                        <span>{lang === 'EN' ? "Launch Immersive Mirror Room" : "Salle Miroir Immersive (Plein Écran)"}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>

                    <button
                      id="btn-begin-assessment"
                      onClick={() => {
                        setPendingAction('standard');
                        setShowWarningModal(true);
                      }}
                      disabled={cameraError}
                      className="w-full mt-2.5 py-2.5 bg-white border-2 border-stone-950 hover:bg-stone-50 text-stone-950 disabled:bg-stone-100 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>{lang === 'EN' ? "Or run Standard Assessment" : "Ou lancer l'Évaluation Standard"}</span>
                    </button>
                  </>
                )}

              </div>

              {/* LIVE CAM CALIBRATION PREVIEW */}
              <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 space-y-4 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                
                <div>
                  <h3 className="font-sans font-black text-sm text-stone-950 border-b-2 border-stone-950 pb-2.5 uppercase tracking-wide flex items-center gap-2">
                    <Camera className="w-4 h-4 text-stone-950" />
                    <span>{lang === 'EN' ? "Poise & Alignment Calibration" : "Calibrage Posture & Alignement"}</span>
                  </h3>
                  <p className="text-stone-600 text-[11px] mt-1.5 leading-relaxed font-bold">
                    {lang === 'EN' 
                      ? "User sees only themselves. Camera feedback is used purely for presence simulation and interactive engagement metrics in your browser. Attractiveness, beauty filters, and recording playback are strictly disabled."
                      : "Le candidat ne voit que son propre retour. L'image sert uniquement à évaluer la posture et assurer la mise en situation réelle dans le navigateur. Pas de filtres de beauté ou d'évaluation d'apparence."}
                  </p>
                </div>

                {/* Video Area */}
                <div className="relative aspect-[4/3] bg-stone-950 border-2 border-stone-950 rounded-2xl overflow-hidden flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
                  
                  {cameraError ? (
                    <div id="camera-error-box" className="p-4 text-center space-y-4 flex flex-col items-center justify-center">
                      <CameraOff className="w-8 h-8 text-zinc-600" />
                      <p className="text-zinc-400 text-xs font-mono font-bold leading-relaxed max-w-xs">
                        {lang === 'EN' 
                          ? "Camera / Mic configuration required for Mirror evaluation." 
                          : "Configuration caméra / micro requise pour l'évaluation miroir."}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
                        <button 
                          onClick={startCamera} 
                          className="px-4 py-2 bg-[#18633F] hover:bg-[#1f7c50] text-white border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] rounded-xl text-[10px] uppercase font-mono tracking-wider font-black cursor-pointer transition-colors"
                        >
                          {lang === 'EN' ? "Re-authorize Devices" : "Ré-autoriser les Périphériques"}
                        </button>
                        <button 
                          onClick={runDiagnosticCheck} 
                          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] rounded-xl text-[10px] uppercase font-mono tracking-wider font-black cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>{lang === 'EN' ? "Diagnostic Check" : "Lancer le Diagnostic"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      
                      <div className="absolute top-3 left-3 bg-emerald-500 text-stone-950 border-2 border-stone-950 rounded-md px-2.5 py-0.5 font-mono text-[8px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span>{lang === 'EN' ? "CALIBRATING LIVE FEED" : "CALIBRAGE FLUX LOCALE ACTIVE"}</span>
                      </div>
                    </>
                  )}

                </div>

                <div className="pt-2 border-t-2 border-stone-950 flex flex-col items-center gap-2">
                  <div className="text-[10px] text-[#6B7280] font-mono italic text-center">
                    {lang === 'EN' ? "✦ Align your posture so eyes match the horizontal camera center." : "✦ Alignez votre posture faciale à hauteur du capteur optique."}
                  </div>
                  <button
                    onClick={runDiagnosticCheck}
                    className="mt-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-950 border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] rounded-xl text-[10px] uppercase font-mono tracking-wider font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-stone-950" />
                    <span>{lang === 'EN' ? "Device Diagnostic Check" : "Diagnostic Caméra & Micro"}</span>
                  </button>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* ==================== STEP 2 — LOADING BLUEPRINT (TRANSITION LOADING SCREEN) ==================== */}
        {assessmentState === 'loading_blueprint' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="min-h-[460px] bg-white border-2 border-stone-950 rounded-[32px] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-8 flex flex-col items-center justify-center space-y-8"
          >
            <div className="relative">
              <Loader2 className="w-16 h-16 text-stone-950 animate-spin stroke-[2]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-stone-950 animate-pulse" />
              </div>
            </div>

            <div className="text-center space-y-4 max-w-md w-full">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                {lang === 'EN' ? "CREATING SECURITY PROTOCOL CELLS" : "CRÉATION INTÉGRITÉ SÉCURISÉ"}
              </span>
              <h3 className="font-sans font-black text-lg text-stone-950 uppercase">
                {lang === 'EN' ? "Loading Formal Assessment Blueprint" : "Chargement du Plan d'Évaluation de Poste"}
              </h3>
              
              {/* Dynamic console sequence progress tracker */}
              <div className="p-4 bg-stone-50 border-2 border-stone-950 rounded-2xl text-left font-mono text-[9px] text-stone-600 space-y-1.5 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                {loadingLogs.slice(0, loadingStep + 1).map((log, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-3">
                    <span className="truncate">{log}</span>
                    <span className="text-emerald-600 font-bold shrink-0">{lang === 'EN' ? "✓ OK" : "✓ OK"}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== STEP 2.5 — ASSESSMENT PLAN (INTERVIEW BLUEPRINT PREVIEW) ==================== */}
        {assessmentState === 'assessment_plan' && (
          <motion.div
            key="assessment_plan"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="bg-white border-2 border-stone-950 rounded-[32px] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-6 md:p-8 space-y-8"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-stone-950 pb-5 gap-4">
              <div className="text-left space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-stone-950 bg-[#EDC154] px-2.5 py-1 rounded font-black border-2 border-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                  {lang === 'EN' ? "STAGE 02 // PRE-ASSESSMENT PREPARATION" : "PHASE 02 // PRÉPARATION AVANT ÉVALUATION"}
                </span>
                <h2 className="font-sans font-black text-2xl text-stone-950 uppercase tracking-tight mt-1">
                  {lang === 'EN' ? "Interviewer's Evaluation Blueprint" : "Plan de Mesure de l'Interrogateur"}
                </h2>
                <p className="text-xs text-[#6B7280] font-semibold">
                  {lang === 'EN' ? "Review the structure & protocols before launching." : "Examinez la structure et le protocole avant de commencer."}
                </p>
              </div>

              {/* Status capsule */}
              <div className="flex items-center gap-2 bg-[#A7F3D0] border-2 border-stone-950 text-stone-950 px-3.5 py-1.5 rounded-full shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
                  {lang === 'EN' ? "SYSTEM READY" : "SYSTÈME PRÊT"}
                </span>
              </div>
            </div>

            {/* Main content split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Timeline */}
              <div className="lg:col-span-7 space-y-5 text-left">
                <h3 className="font-sans font-black text-sm text-stone-950 uppercase tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-stone-950" />
                  {lang === 'EN' ? "Evaluation Timeline" : "Structure Chronologique"}
                </h3>

                <div className="relative pl-6 border-l-2 border-stone-950 space-y-6 py-2">
                  {evaluationPhases.map((phase, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#EDC154] border-2 border-stone-950 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />
                      </div>

                      <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-4 transition-all hover:bg-stone-100 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className="font-mono text-[9px] uppercase font-extrabold text-[#9CA3AF]">
                              {lang === 'EN' ? `Phase ${idx + 1}` : `Phase ${idx + 1}`}
                            </span>
                            <h4 className="font-sans font-black text-xs text-stone-950 uppercase">
                              {phase.label}
                            </h4>
                          </div>
                          <span className="shrink-0 font-mono text-[9.5px] font-black text-stone-950 bg-white border-2 border-stone-950 px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                            45s max
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Video Preview and Protocol Info */}
              <div className="lg:col-span-5 space-y-6 text-left">
                
                {/* Embedded Active Video Feed */}
                <div className="space-y-2">
                  <h3 className="font-sans font-black text-sm text-stone-950 uppercase tracking-wide flex items-center gap-2">
                    <Camera className="w-4 h-4 text-stone-950" />
                    {lang === 'EN' ? "Hardware Feed & Alignment" : "Vérification Alignement & Cadrage"}
                  </h3>
                  
                  <div className="relative aspect-video bg-stone-950 rounded-2xl overflow-hidden border-2 border-stone-950 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] group">
                    {cameraStream ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-stone-400 space-y-2">
                        <CameraOff className="w-8 h-8 text-stone-500 animate-pulse" />
                        <span className="text-[10px] font-mono tracking-wider">
                          {lang === 'EN' ? "INITIALIZING STREAM..." : "INITIALISATION DU FLUX VIDEO..."}
                        </span>
                      </div>
                    )}
                    
                    {/* Floating calibration overlays */}
                    <div className="absolute inset-0 border-[30px] border-black/10 pointer-events-none rounded-2xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-dashed border-white/20 rounded-full pointer-events-none" />
                    <div className="absolute bottom-3 left-3 bg-red-600 border-2 border-stone-950 px-2.5 py-1 rounded-lg text-[9px] font-mono text-white flex items-center gap-1.5 uppercase font-black tracking-wider shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      {lang === 'EN' ? "FEED ACTIVE" : "FLUX ACTIF"}
                    </div>
                  </div>
                </div>

                {/* Section 2: Neutrality Charter */}
                <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-5 space-y-4 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  <h4 className="font-sans font-black text-xs text-stone-950 uppercase tracking-wide flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    {lang === 'EN' ? "SHANA Assessment Charter" : "Protocole de Neutralité SHANA"}
                  </h4>
                  
                  <ul className="space-y-3 font-semibold text-[#4B5563] text-[11px]">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />
                      <span>{lang === 'EN' ? "Camera active" : "Caméra active"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />
                      <span>{lang === 'EN' ? "Microphone active" : "Microphone actif"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />
                      <span>{lang === 'EN' ? "No direct suggestions or transcripts" : "Aucun texte d'aide ou retour direct"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />
                      <span>{lang === 'EN' ? "AI remains strictly neutral" : "L'IA observe de manière neutre uniquement"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />
                      <span className="text-emerald-700 font-bold">{lang === 'EN' ? "Goal: evaluate your raw readiness" : "Objectif : évaluer vos compétences réelles"}</span>
                    </li>
                  </ul>
                </div>

                {/* Section 3: Interview Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-stone-50 border-2 border-stone-950 rounded-xl p-3 text-left shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                    <div className="text-[8px] font-mono uppercase font-black text-stone-400">
                      {lang === 'EN' ? "ESTIMATED DURATION" : "DURÉE ESTIMÉE"}
                    </div>
                    <div className="text-xs font-black text-stone-950 mt-0.5 font-mono uppercase">
                      ~{Math.ceil((evaluationPhases.length * 45) / 60)} {lang === 'EN' ? "Mins" : "Mins"}
                    </div>
                  </div>
                  <div className="bg-stone-50 border-2 border-stone-950 rounded-xl p-3 text-left shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                    <div className="text-[8px] font-mono uppercase font-black text-stone-400">
                      {lang === 'EN' ? "MEASUREMENT MODE" : "MODE DE MESURE"}
                    </div>
                    <div className="text-xs font-black text-stone-950 mt-0.5 font-mono truncate uppercase">
                      {lang === 'EN' ? "STRICT FORMAL" : "STRICT FORMEL"}
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Action Buttons Footer */}
            <div className="pt-4 border-t-2 border-stone-950 flex flex-col sm:flex-row justify-end items-center gap-4">
              <span className="text-[10px] font-mono text-stone-400 uppercase font-black tracking-wider text-center sm:text-left">
                {lang === 'EN' ? "By continuing, you agree to the formal protocol." : "En continuant, vous acceptez le protocole formel de mesure."}
              </span>
              <button
                onClick={handleStartFirstPhase}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#18633F] hover:bg-[#1f7c50] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border-2 border-stone-950 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{lang === 'EN' ? "Start Phase 1" : "Démarrer Phase 1"}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ==================== STEP 3 — ASSESSMENT (INTERVIEW ACTIVE SCREEN) ==================== */}
        {assessmentState === 'interview' && (
          <motion.div
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header info bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-stone-950 pb-4 gap-3 shrink-0">
              <div className="space-y-1 text-left">
                <span className="font-mono text-[9px] uppercase tracking-widest text-stone-950 bg-[#EDC154] px-2.5 py-1 rounded font-black border-2 border-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                  PHASE {assessmentStep + 1}/{evaluationPhases.length} // {evaluationPhases[assessmentStep]?.label}
                </span>
                <p className="text-[10px] text-stone-900 font-mono tracking-widest uppercase font-black mt-1">
                  ROLE: {user.targetRole}
                </p>
              </div>

              {/* Real-time overall elapsed clock */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex flex-col items-end shrink-0 text-right">
                  <span className="font-mono text-[8px] text-zinc-400 uppercase tracking-widest font-black">
                    {lang === 'EN' ? "TOTAL ELAPSED TIME" : "TEMPS ÉCOULÉ"}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-stone-950 animate-pulse" />
                    <span className="font-mono text-xs font-bold text-zinc-700">
                      {Math.floor(totalSecondsElapsed / 60).toString().padStart(2, '0')}:{(totalSecondsElapsed % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      / {targetDurationMins}:00
                    </span>
                  </div>
                </div>

                <div className="flex-1 sm:flex-initial flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
                  <span className="font-mono text-[9px] font-black text-stone-950 uppercase tracking-widest bg-red-400 py-1.5 px-3 border-2 border-stone-950 rounded-md shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                    {lang === 'EN' ? "LIVE EVALUATION" : "ÉVALUATION EN DIRECT"}
                  </span>
                </div>
              </div>
            </div>

            {/* Overall time progress bar */}
            <div className="h-3.5 w-full bg-stone-100 border-2 border-stone-950 rounded-full overflow-hidden shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
              <div 
                className="h-full bg-stone-950 transition-all duration-1000"
                style={{ width: `${Math.min(100, (totalSecondsElapsed / (targetDurationMins * 60)) * 100)}%` }}
              />
            </div>

            {/* Main Stage Grid: Mirror View Left, Text Area Right */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Camera Frame Column (Mirror View) */}
              <div className="md:col-span-3 space-y-4">
                <div className="relative aspect-[4/3] bg-stone-950 rounded-[32px] overflow-hidden border-2 border-stone-950 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                  
                  {cameraError ? (
                    <div id="camera-error-interview" className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-stone-900">
                      <CameraOff className="w-8 h-8 text-stone-600" />
                      <p className="text-stone-400 text-xs font-mono font-bold">
                        {t.assess.cameraAccessDenied}
                      </p>
                      <p className="text-[10px] text-stone-500 leading-relaxed font-sans max-w-xs mx-auto">
                        {lang === 'EN' 
                          ? "Mirrored feed is missing. Check camera permissions to verify alignment telemetry." 
                          : "Le retour miroir est inactif. Autorisez l'accès caméra pour calibrer la posture."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      
                      {/* Live visual overlays strictly inside mirror box */}
                      <div className="absolute top-4 left-4 bg-stone-950 border-2 border-[#EDC154] rounded-full px-3 py-1 flex items-center gap-2 font-mono text-[8px] font-black uppercase tracking-wider text-[#EDC154] shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-550 animate-pulse" />
                        <span>{lang === 'EN' ? "MIRROR PROTOCOL FEED" : "FLUX MIROIR LOCAL DIRECT"}</span>
                      </div>
                    </>
                  )}

                  {/* Horizontal Guideline Center Overlay */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-white/15 pointer-events-none" />
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-dashed border-white/15 pointer-events-none" />

                  {/* Pressure Bottom Countdown Timer bar */}
                  <div className="absolute bottom-0 inset-x-0 h-1.5 bg-stone-850">
                    <div 
                      className={`h-full transition-all duration-1000 ${secondsRemaining <= 10 ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${(secondsRemaining / (evaluationPhases[assessmentStep]?.challenge?.type === 'thirty_second_limit' ? 30 : 45)) * 100}%` }}
                    />
                  </div>

                  {/* Circle Overlay representation eye-level target box */}
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-white/20 rounded-full pointer-events-none flex items-center justify-center">
                    <span className="text-[8px] font-mono text-white/35 uppercase select-none tracking-widest">{lang === 'EN' ? "EYE LEVEL" : "CIBLE REGARD"}</span>
                  </div>

                  {/* Floating Seconds countdown overlay badge */}
                  <div className="absolute bottom-4 right-4 bg-white rounded-2xl p-3 border-2 border-stone-950 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] text-center flex flex-col justify-center min-w-[75px]">
                    <span className="text-[8.5px] block text-stone-400 font-mono tracking-widest font-black leading-none">{lang === 'EN' ? "TIME LIMIT" : "LIMITE"}</span>
                    <span className="text-xl font-mono font-black text-stone-950 mt-1.5 leading-none">{secondsRemaining}s</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-stone-50 border-2 border-stone-950 rounded-2xl p-3.5 px-4 font-mono text-[9px] text-stone-900 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold">
                  <span className="font-bold flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    {lang === 'EN' ? "MICROPHONE INPUT : ACTIVE" : "CANAL AUDIO CONSTANT : CONNECTÉ"}
                  </span>
                  <span>{lang === 'EN' ? "PRESENCE POISE ACTIVE" : "MOUVENEMENT ET POSTURE ACTIVES"}</span>
                </div>
              </div>

              {/* Spoken Question panel (No suggestions, no live scoring) */}
              <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                
                <div className="bg-white border-2 border-stone-950 rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b-2 border-stone-950 pb-3">
                      <span className="font-mono text-[10px] text-[#A1A1AA] uppercase tracking-widest font-bold">
                        {lang === 'EN' ? "SHANA RECRUITER SPEECH" : "VOIX RECRUTEUR SHANA"}
                      </span>
                      {speechActive ? (
                        <span className="font-mono text-[8px] text-stone-950 font-black bg-[#EDC154] border-2 border-stone-950 px-2.5 py-0.5 rounded animate-pulse shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                          {lang === 'EN' ? "AUDIO ACTIVE" : "VOIX ACTIVE"}
                        </span>
                      ) : (
                        <span className="font-mono text-[8px] text-stone-950 bg-stone-100 border-2 border-stone-950 px-2.5 py-0.5 rounded font-black">
                          {lang === 'EN' ? "SILENT / LISTENING" : "ÉCOUTE EN COURS"}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3.5 text-left">
                      <div className="space-y-1">
                        <h4 className="font-mono font-bold text-[10px] uppercase text-zinc-400 tracking-wider">
                          {evaluationPhases[assessmentStep]?.label}
                        </h4>
                        
                        {/* Enriched Trick Question, Difficulty, and Context-Aware Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {evaluationPhases[assessmentStep]?.difficulty && (
                            <span className={`font-mono text-[8.5px] uppercase font-black tracking-wider px-2 py-0.5 rounded border-2 border-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] ${
                              evaluationPhases[assessmentStep].difficulty === 'Junior'
                                ? 'bg-[#A7F3D0] text-stone-950'
                                : 'bg-[#A5B4FC] text-stone-950'
                            }`}>
                              🎯 {evaluationPhases[assessmentStep].difficulty} {lang === 'EN' ? 'Level' : 'Niveau'}
                            </span>
                          )}

                          {evaluationPhases[assessmentStep]?.isTrickQuestion && (
                            <span className="font-mono text-[8.5px] uppercase font-black tracking-wider px-2 py-0.5 rounded border-2 border-stone-950 bg-[#EDC154] text-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] flex items-center gap-1 animate-pulse">
                              ⚠️ {lang === 'EN' ? 'Trick Question Active' : 'Question Piège Active'}
                            </span>
                          )}

                          {evaluationPhases[assessmentStep]?.contextAware && (
                            <span className="font-mono text-[8.5px] uppercase font-black tracking-wider px-2 py-0.5 rounded border-2 border-stone-950 bg-[#A5F3FC] text-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                              🧠 {lang === 'EN' ? 'Profile Tailored' : 'Personnalisée'}
                            </span>
                          )}

                          {evaluationPhases[assessmentStep]?.challenge && (
                            <span className="font-mono text-[8.5px] uppercase font-black tracking-wider px-2 py-0.5 rounded border-2 border-stone-950 bg-[#FCA5A5] text-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] flex items-center gap-1 animate-pulse">
                              ⚡ CHALLENGE: {lang === 'EN' ? evaluationPhases[assessmentStep].challenge.descriptionEN : evaluationPhases[assessmentStep].challenge.descriptionFR}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {showWrittenQuestion ? (
                        <div className="space-y-3">
                          <p id="assessment-prompt-question" className="text-[#111827] text-md md:text-lg italic font-extrabold tracking-tight leading-snug">
                            {evaluationPhases[assessmentStep]?.question}
                          </p>

                          {evaluationPhases[assessmentStep]?.isTrickQuestion && (
                            <div className="p-3 bg-[#EDC154]/20 border-2 border-stone-950 rounded-xl text-left shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                              <p className="text-[9.5px] text-amber-800 leading-normal font-sans font-medium">
                                💡 <strong>{lang === 'EN' ? "TRICK QUESTION LOGIC:" : "LOGIQUE DE QUESTION PIÈGE :"}</strong>{" "}
                                {lang === 'EN' 
                                  ? "This is a non-obvious scenario designed to test your precision and depth of understanding under pressure. Avoid vague answers and defend your technical choices with explicit metrics." 
                                  : "Il s'agit d'un scénario non évident conçu pour tester votre précision et votre profondeur de compréhension sous pression. Évitez les réponses vagues et défendez vos choix techniques."}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-8 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-stone-950 rounded-2xl bg-stone-50 select-none shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                          <LockKeyhole className="w-8 h-8 text-stone-950 animate-pulse" />
                          <div className="text-center space-y-1">
                            <p className="font-mono text-[10px] font-black text-stone-950 uppercase tracking-widest">
                              {lang === 'EN' ? "AURAL PROTOCOL ACTIVE" : "PROTOCOLE MIROIR AUDITIF ACTIF"}
                            </p>
                            <p className="text-[10px] text-zinc-500 max-w-[200px] mx-auto leading-relaxed px-4">
                              {lang === 'EN' 
                                ? "Written questions are hidden. Listen to Shana's voice and speak aloud." 
                                : "Les questions écrites sont masquées. Écoutez la voix de Shana et parlez de vive voix."}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowWrittenQuestion(true)}
                            className="px-3.5 py-1.5 bg-white hover:bg-stone-50 text-stone-950 border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)] rounded-xl text-[9px] uppercase font-mono tracking-wider font-black cursor-pointer transition-all"
                          >
                            {lang === 'EN' ? "Reveal Written Question" : "Révéler la Question Écrite"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t-2 border-stone-950 space-y-4 text-left">
                    <div className="flex items-start gap-2 p-3 bg-stone-50 border-2 border-stone-950 rounded-xl font-mono text-[9.5px] leading-relaxed text-stone-700 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-semibold">
                      <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>{lang === 'EN' ? "STRICT REGULATION NOTICE" : "AVERTISSEMENT PROCÉDURE"}</strong>
                        <p className="mt-0.5">{lang === 'EN' ? "Answer aloud immediately. Live transcript feeds, suggested words, or guidance sheets are disabled." : "Répondez à haute voix maintenant. Les suggestions écrites ou guides textuels interactifs sont inactifs."}</p>
                      </div>
                    </div>

                    <button
                      id="btn-next-question"
                      onClick={handleNextStep}
                      className="w-full py-4 bg-[#18633F] hover:bg-[#1f7c50] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all border-2 border-stone-950 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>
                        {assessmentStep === evaluationPhases.length - 1 
                          ? (lang === 'EN' ? "Complete Evaluation" : "Terminer et Évaluer") 
                          : (lang === 'EN' ? "Next Question →" : "Question Suivante →")}
                      </span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* ==================== STEP 4 — FINAL EVALUATION (RESULT VIEW) ==================== */}
        {assessmentState === 'final_evaluation' && evaluationData && (
          <motion.div
            key="evaluation"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-8"
          >
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F3F4F6] pb-5">
              <div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {lang === 'EN' ? "OUTCOME REGISTERED" : "RÉSULTATS INDEXÉS"}
                </span>
                <h1 id="evaluated-readiness-title" className="text-2xl md:text-3xl font-sans font-extrabold text-[#1A2B3C] tracking-tight mt-3">
                  {lang === 'EN' ? "Post-Interview Coaching Platform" : "Plateforme d'Accompagnement Post-Entretien"}
                </h1>
                <p className="text-xs text-[#6B7280] font-semibold mt-1">
                  {lang === 'EN' 
                    ? "Interactive coaching journey and multi-dimensional readiness performance telemetry." 
                    : "Parcours d'accompagnement interactif et télémétrie de diagnostic de performance multidimensionnelle."}
                </p>
              </div>

              {/* Conclude Action */}
              <div>
                <button
                  onClick={() => {
                    transitionSessionState('IDLE');
                    onChangeTab('home');
                  }}
                  className="px-5 py-3 bg-[#18633F] hover:bg-[#1f7c50] text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <Home className="w-4 h-4 text-white" />
                  <span>{lang === 'EN' ? "Conclude & Go to Dashboard" : "Conclure & Voir le Tableau de Bord"}</span>
                </button>
              </div>
            </div>

            <PostInterviewCoachingView 
              user={user} 
              session={evaluationData} 
              history={StorageService.getHistory(user.id || 'usr_candidate') || []} 
              lang={lang} 
              onClose={() => { transitionSessionState('IDLE'); onChangeTab('home'); }} 
              onChangeTab={onChangeTab} 
            />
          </motion.div>
        )}

        {/* ==================== DEPRECATED STATIC VIEW FOR COMPLIANCE ==================== */}
        {false && assessmentState === 'final_evaluation' && evaluationData && (
          <motion.div
            key="evaluation"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-8"
          >
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F3F4F6] pb-5">
              <div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {lang === 'EN' ? "OUTCOME REGISTERED" : "RÉSULTATS INDEXÉS"}
                </span>
                <h1 id="evaluated-readiness-title" className="text-2xl md:text-3xl font-sans font-extrabold text-[#1A2B3C] tracking-tight mt-3">
                  {lang === 'EN' ? "SHANA Interview Report" : "Rapport d'Entretien SHANA"}
                </h1>
                <p className="text-xs text-[#6B7280] font-semibold mt-1">
                  {lang === 'EN' 
                    ? "Interactive, multi-dimensional readiness performance telemetry." 
                    : "Télémétrie interactive de diagnostic de performance multidimensionnelle."}
                </p>
              </div>

              {/* PDF Report Export & Share Actions */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {exportSuccess ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono uppercase font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'EN' ? "PDF Export Completed!" : "Export PDF Terminé !"}</span>
                  </motion.div>
                ) : (
                  <button
                    disabled={exporting}
                    onClick={() => {
                      if (!evaluationData) return;
                      setExporting(true);
                      setTimeout(() => {
                        try {
                          generateReportPDF(user, evaluationData, lang);
                          setExportSuccess(true);
                        } catch (err) {
                          console.error("PDF generation error:", err);
                        } finally {
                          setExporting(false);
                        }
                      }, 1200);
                    }}
                    className="px-4 py-2.5 bg-white border-2 border-stone-950 hover:bg-stone-50 text-stone-950 text-[10px] font-mono uppercase font-black tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{lang === 'EN' ? "Generating..." : "Génération..."}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>{lang === 'EN' ? "PDF Report" : "Rapport PDF"}</span>
                      </>
                    )}
                  </button>
                )}

                {/* Social Share Feature */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareDropdown(!showShareDropdown)}
                    className="px-4 py-2.5 bg-[#EDC154] text-stone-950 hover:bg-[#ebd085] text-[10px] font-mono uppercase font-black tracking-wider rounded-xl transition-all border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] flex items-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{lang === 'EN' ? "Share Result" : "Partager le Résultat"}</span>
                  </button>

                  <AnimatePresence>
                    {showShareDropdown && (
                      <>
                        {/* Backdrop for closing */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowShareDropdown(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-64 bg-white border-2 border-stone-950 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4 z-50 text-left space-y-3"
                        >
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                              {lang === 'EN' ? "Spread the Word" : "Partagez la nouvelle"}
                            </h4>
                            <p className="text-[11px] text-stone-600 font-medium leading-normal">
                              {lang === 'EN' 
                                ? "Showcase your Shana interview index with your network." 
                                : "Affichez votre indice de préparation Shana d'élite."}
                            </p>
                          </div>

                          <div className="border-t border-stone-100 my-2" />

                          <div className="space-y-1.5">
                            {/* LinkedIn Share */}
                            <a
                              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://ai.studio/build")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 rounded-xl transition-all"
                              onClick={() => setShowShareDropdown(false)}
                            >
                              <div className="w-6 h-6 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center text-[#0A66C2]">
                                <span className="font-sans font-black text-xs">in</span>
                              </div>
                              <span>{lang === 'EN' ? "Share on LinkedIn" : "Partager sur LinkedIn"}</span>
                            </a>

                            {/* Twitter / X Share */}
                            <a
                              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                lang === 'EN' 
                                  ? `🚀 Just hit an Overall Readiness Index of ${evaluationData?.score || 0}% on SHANA preparing for the ${user.targetRole || 'Expert'} role! Shana evaluates resume, posture, communication and STAR structure in real-time. Try it at https://ai.studio/build @GoogleAI`
                                  : `🚀 J'ai obtenu un score d'éligibilité de ${evaluationData?.score || 0}% sur SHANA en m'entraînant pour le poste de ${user.targetRole || 'Expert'} ! Analyse de CV, posture, élocution et structure STAR en direct. Essayez sur https://ai.studio/build @GoogleAI`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 rounded-xl transition-all"
                              onClick={() => setShowShareDropdown(false)}
                            >
                              <div className="w-6 h-6 rounded-lg bg-black/10 flex items-center justify-center text-black">
                                <Twitter className="w-3.5 h-3.5" />
                              </div>
                              <span>{lang === 'EN' ? "Post on X (Twitter)" : "Publier sur X (Twitter)"}</span>
                            </a>

                            {/* Copy Clipboard Link */}
                            <button
                              onClick={() => {
                                const shareText = lang === 'EN'
                                  ? `🚀 I just completed my Shana AI Interview Assessment for the ${user.targetRole || 'Expert'} role with an Overall Readiness Index of ${evaluationData?.score || 0}%!\n\nShana evaluated my Resume, Industry Knowledge, Communication, Confidence Poise, and STAR structure in real-time.\n\nCheck out SHANA here: https://ai.studio/build`
                                  : `🚀 Je viens de passer mon évaluation d'entretien Shana AI pour le poste de ${user.targetRole || 'Expert'} avec un score d'éligibilité global de ${evaluationData?.score || 0}% !\n\nShana a analysé mon CV, mes compétences métier, mon élocution, ma posture et ma structure STAR en temps réel.\n\nDécouvrez SHANA ici : https://ai.studio/build`;
                                
                                navigator.clipboard.writeText(shareText);
                                setCopiedShareLink(true);
                                setTimeout(() => setCopiedShareLink(false), 2000);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 rounded-xl transition-all text-left cursor-pointer"
                            >
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                                copiedShareLink ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-600'
                              }`}>
                                {copiedShareLink ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                              </div>
                              <span>{copiedShareLink ? (lang === 'EN' ? "Copied!" : "Copié !") : (lang === 'EN' ? "Copy custom post" : "Copier la publication")}</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* High-Fidelity Overview Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Box: Score Gauge & Benchmarking */}
              <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] lg:col-span-1 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-[#A1A1AA] uppercase tracking-widest">
                      {lang === 'EN' ? "Readiness Score" : "Indice de Préparation"}
                    </span>
                    <Award className="w-4.5 h-4.5 text-stone-950" />
                  </div>

                  <div className="py-2 text-center space-y-2">
                    <div className="relative inline-flex items-center justify-center">
                      {/* Beautiful circular progress track background */}
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="54" stroke="#F3F4F6" strokeWidth="8" fill="transparent" />
                        <motion.circle 
                          cx="64" 
                          cy="64" 
                          r="54" 
                          stroke="#18633F" 
                          strokeWidth="8" 
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 54}
                          initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - (evaluationData.score || 0) / 100) }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span id="attained-readiness" className="text-4xl font-sans font-black text-stone-950">
                          {evaluationData.score}%
                        </span>
                        <span className="text-[8px] font-mono text-stone-400 font-bold uppercase tracking-widest">Readiness</span>
                      </div>
                    </div>
                    
                    {/* Gauge range band mapping */}
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 border-2 border-stone-950 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] ${getReadinessBand(evaluationData.score).color}`}>
                        {getReadinessBand(evaluationData.score).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Benchmarked comparison to industry target */}
                <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-4 space-y-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  <span className="text-[9px] font-mono font-extrabold text-[#6B7280] uppercase tracking-widest block">
                    {lang === 'EN' ? "INDUSTRY BENCHMARK COMPARISON" : "COMPARAISON AUX COMPÉTENCES SECTORIELLES"}
                  </span>
                  
                  <div className="space-y-2.5 text-[11px] font-semibold">
                    {/* User Score Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-900 font-bold">{lang === 'EN' ? "Your Attained Level" : "Votre Niveau Obtenu"}</span>
                        <span className="font-mono text-stone-900 font-extrabold">{evaluationData.score}%</span>
                      </div>
                      <div className="h-3.5 bg-stone-100 border-2 border-stone-950 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-[#18633F] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${evaluationData.score}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                    </div>

                    {/* Standard Expected Level Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-500">{lang === 'EN' ? "Target Role Baseline" : "Niveau Recommandé pour le Poste"}</span>
                        <span className="font-mono text-stone-500 font-extrabold">75%</span>
                      </div>
                      <div className="h-3.5 bg-stone-100 border-2 border-stone-950 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-[#EDC154] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: "75%" }}
                          transition={{ duration: 1, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Box: 6 Key Sections Scores Breakdown */}
              <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] lg:col-span-2 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="font-sans font-bold text-xs text-[#1A2B3C] border-b border-[#F3F4F6] pb-3 uppercase tracking-wide flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-stone-950" />
                    <span>{lang === 'EN' ? "Dimensional Competency Map" : "Cartographie des Domaines de Compétences"}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    
                    {/* Competency Item 1 */}
                    <div className="p-3 bg-stone-50 border-2 border-stone-950 rounded-2xl flex flex-col justify-between space-y-2 hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#6B7280] font-mono text-[9px] uppercase tracking-wider font-bold">{lang === 'EN' ? "1. Resume Defense" : "1. Adéquation Résumé CV"}</span>
                        <span className="bg-[#EDC154] text-stone-950 px-2 py-0.5 rounded border-2 border-stone-950 font-black text-xs">{evaluationData.resumeScore}%</span>
                      </div>
                      <div className="h-3 bg-stone-100 border-2 border-stone-950 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-[#18633F]"
                          initial={{ width: 0 }}
                          animate={{ width: `${evaluationData.resumeScore}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Competency Item 2 */}
                    <div className="p-3 bg-stone-50 border-2 border-stone-950 rounded-2xl flex flex-col justify-between space-y-2 hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#6B7280] font-mono text-[9px] uppercase tracking-wider font-bold">{lang === 'EN' ? "2. Industry Knowledge" : "2. Alignement Métier"}</span>
                        <span className="bg-[#EDC154] text-stone-950 px-2 py-0.5 rounded border-2 border-stone-950 font-black text-xs">{evaluationData.industryScore}%</span>
                      </div>
                      <div className="h-3 bg-stone-100 border-2 border-stone-950 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-[#18633F]"
                          initial={{ width: 0 }}
                          animate={{ width: `${evaluationData.industryScore}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Competency Item 3 */}
                    <div className="p-3 bg-stone-50 border-2 border-stone-950 rounded-2xl flex flex-col justify-between space-y-2 hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#6B7280] font-mono text-[9px] uppercase tracking-wider font-bold">{lang === 'EN' ? "3. Communication" : "3. Structure Élocution"}</span>
                        <span className="bg-[#EDC154] text-stone-950 px-2 py-0.5 rounded border-2 border-stone-950 font-black text-xs">{evaluationData.communicationScore}%</span>
                      </div>
                      <div className="h-3 bg-stone-100 border-2 border-stone-950 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-[#18633F]"
                          initial={{ width: 0 }}
                          animate={{ width: `${evaluationData.communicationScore}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Competency Item 4 */}
                    <div className="p-3 bg-stone-50 border-2 border-stone-950 rounded-2xl flex flex-col justify-between space-y-2 hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#6B7280] font-mono text-[9px] uppercase tracking-wider font-bold">{lang === 'EN' ? "4. Confidence Poise" : "4. Pose et Comportement"}</span>
                        <span className="bg-[#EDC154] text-stone-950 px-2 py-0.5 rounded border-2 border-stone-950 font-black text-xs">{evaluationData.confidenceScore}%</span>
                      </div>
                      <div className="h-3 bg-stone-100 border-2 border-stone-950 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-[#18633F]"
                          initial={{ width: 0 }}
                          animate={{ width: `${evaluationData.confidenceScore}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Competency Item 5 */}
                    <div className="p-3 bg-stone-50 border-2 border-stone-950 rounded-2xl flex flex-col justify-between space-y-2 hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#6B7280] font-mono text-[9px] uppercase tracking-wider font-bold">{lang === 'EN' ? "5. Adaptability" : "5. Réflectivité Contextuelle"}</span>
                        <span className="bg-[#EDC154] text-stone-950 px-2 py-0.5 rounded border-2 border-stone-950 font-black text-xs">{evaluationData.adaptabilityScore}%</span>
                      </div>
                      <div className="h-3 bg-stone-100 border-2 border-stone-950 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-[#18633F]"
                          initial={{ width: 0 }}
                          animate={{ width: `${evaluationData.adaptabilityScore}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Competency Item 6 */}
                    <div className="p-3 bg-stone-50 border-2 border-stone-950 rounded-2xl flex flex-col justify-between space-y-2 hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#6B7280] font-mono text-[9px] uppercase tracking-wider font-bold">{lang === 'EN' ? "6. Behavioral Responses" : "6. Résistance Pression"}</span>
                        <span className="bg-[#EDC154] text-stone-950 px-2 py-0.5 rounded border-2 border-stone-950 font-black text-xs">{evaluationData.behavioralScore}%</span>
                      </div>
                      <div className="h-3 bg-stone-100 border-2 border-stone-950 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-[#18633F]"
                          initial={{ width: 0 }}
                          animate={{ width: `${evaluationData.behavioralScore}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* EVALUATION DISCLAIMER */}
                <div className="mt-2 pt-3 border-t border-[#F3F4F6] flex items-start gap-2.5 font-mono text-[9px] leading-relaxed text-[#71717A]">
                  <Info className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0 mt-0.5" />
                  <p>
                    <strong>{lang === 'EN' ? "EVALUATION DISCLAIMER" : "DISCLAIMER D’ENTRAÎNEMENT"}</strong> : {lang === 'EN' ? "This readout maps conversational delivery, posture composure, and contextual response variables strictly for coaching optimization. No definitive job market hiring predictions or outcomes are guaranteed or implied." : "Cette évaluation mesure d'articulabilité, la gestion du stress et la posture faciale pour améliorer vos performances d'entretien. Aucune décision de recrutement réelle n'est formulée."}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Section: Question-by-Question Diagnostic Inspector */}
            {evaluationData.questionsFeedback && evaluationData.questionsFeedback.length > 0 && (
              <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-stone-950 pb-3">
                  <h3 className="font-sans font-bold text-sm text-[#1A2B3C] uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stone-950" />
                    <span className="font-black text-stone-950">{lang === 'EN' ? "Question-by-Question Deep Diagnostic" : "Diagnostic Approfondi Question par Question"}</span>
                  </h3>
                  <span className="font-mono text-[9px] text-[#A1A1AA] uppercase font-black">
                    {lang === 'EN' ? "Click phases to inspect detailed metrics" : "Cliquez sur une phase pour inspecter"}
                  </span>
                </div>

                {/* Tabs Row for Phases */}
                <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                  {evaluationData.questionsFeedback.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveQuestionTab(idx)}
                      className={`px-4 py-2 text-[10px] font-mono uppercase font-black rounded-xl border-2 border-stone-950 transition-all cursor-pointer whitespace-nowrap ${
                        activeQuestionTab === idx
                          ? 'bg-[#EDC154] text-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] translate-x-[0.5px] translate-y-[0.5px]'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]'
                      }`}
                    >
                      Phase {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Selected Tab Detailed Display */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeQuestionTab}
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.15 }}
                    className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-5 space-y-5 text-left shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                  >
                    {/* Question Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-stone-950 pb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[9px] uppercase font-black text-stone-900">
                            {evaluationData.questionsFeedback[activeQuestionTab].phaseLabel}
                          </span>
                          
                          {/* Tags in Deep Diagnostic */}
                          {evaluationData.questionsFeedback[activeQuestionTab].difficulty && (
                            <span className={`font-mono text-[8.5px] uppercase font-black tracking-wider px-2 py-0.5 rounded border-2 border-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] ${
                              evaluationData.questionsFeedback[activeQuestionTab].difficulty === 'Junior'
                                ? 'bg-[#A7F3D0] text-stone-950'
                                : 'bg-[#A5B4FC] text-stone-950'
                            }`}>
                              {evaluationData.questionsFeedback[activeQuestionTab].difficulty}
                            </span>
                          )}

                          {evaluationData.questionsFeedback[activeQuestionTab].isTrickQuestion && (
                            <span className="font-mono text-[8.5px] uppercase font-black tracking-wider px-2 py-0.5 rounded border-2 border-stone-950 bg-[#EDC154] text-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                              {lang === 'EN' ? 'Trick Question' : 'Question Piège'}
                            </span>
                          )}

                          {evaluationData.questionsFeedback[activeQuestionTab].contextAware && (
                            <span className="font-mono text-[8.5px] uppercase font-black tracking-wider px-2 py-0.5 rounded border-2 border-stone-950 bg-[#A5F3FC] text-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                              {lang === 'EN' ? 'Profile Tailored' : 'Personnalisée'}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-black text-stone-950 mt-1">
                          {lang === 'EN' ? "STRESS TESTING UNDER TIMER" : "MESURE DES FACTEURS COGNITIFS"}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-stone-400 font-bold">SCORE:</span>
                        <span className="px-2.5 py-0.5 bg-[#18633F] text-white font-mono font-black text-xs rounded-md border-2 border-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                          {evaluationData.questionsFeedback[activeQuestionTab].score}%
                        </span>
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider">
                        {lang === 'EN' ? "PROMPTED QUESTION" : "QUESTION POSÉE"}
                      </span>
                      <p className="text-sm font-semibold italic text-[#111827] leading-relaxed">
                        {evaluationData.questionsFeedback[activeQuestionTab].questionText}
                      </p>
                    </div>

                    {/* Speech Diagnostics Metrics Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      {/* Metric 1 */}
                      <div className="bg-white p-3.5 rounded-xl border-2 border-stone-950 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                        <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider">
                          {lang === 'EN' ? "Speaking Tempo" : "Tempo d'élocution"}
                        </span>
                        <div className="flex items-baseline justify-between mt-1.5">
                          <span className="font-sans font-extrabold text-[#111827]">
                            {evaluationData.questionsFeedback[activeQuestionTab].pace}
                          </span>
                          <span className={`px-1.5 py-0.5 text-[8.5px] font-mono font-black uppercase rounded border-2 border-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] ${
                            evaluationData.questionsFeedback[activeQuestionTab].paceRating === 'optimal'
                              ? 'bg-[#A7F3D0] text-stone-950'
                              : 'bg-[#EDC154] text-stone-950'
                          }`}>
                            {evaluationData.questionsFeedback[activeQuestionTab].paceRating}
                          </span>
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div className="bg-white p-3.5 rounded-xl border-2 border-stone-950 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                        <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider">
                          {lang === 'EN' ? "Audio Clarity" : "Clarté Vocale"}
                        </span>
                        <div className="flex items-baseline justify-between mt-1.5">
                          <span className="font-sans font-extrabold text-[#111827]">
                            {evaluationData.questionsFeedback[activeQuestionTab].clarity}%
                          </span>
                          <span className="px-1.5 py-0.5 text-[8.5px] font-mono font-black uppercase rounded border-2 border-stone-950 bg-[#A7F3D0] text-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                            {lang === 'EN' ? "Excellent" : "Excellente"}
                          </span>
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div className="bg-white p-3.5 rounded-xl border-2 border-stone-950 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                        <span className="text-[9px] font-mono text-stone-400 font-bold uppercase tracking-wider">
                          {lang === 'EN' ? "Stress Tolerance" : "Gestion du Stress"}
                        </span>
                        <div className="flex items-baseline justify-between mt-1.5">
                          <span className="font-sans font-extrabold text-[#111827]">
                            {evaluationData.questionsFeedback[activeQuestionTab].score >= 80 ? '94%' : '81%'}
                          </span>
                          <span className="px-1.5 py-0.5 text-[8.5px] font-mono font-black uppercase rounded border-2 border-stone-950 bg-[#A5B4FC] text-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                            {lang === 'EN' ? "Stable" : "Stable"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tailored Strengths & Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="bg-emerald-50 border-2 border-stone-950 p-4 rounded-xl space-y-1 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                        <span className="text-[9px] font-mono text-emerald-800 font-bold uppercase tracking-widest block">
                          {lang === 'EN' ? "✓ EXCELLENT COGNITIVE STRENGTH" : "✓ POINT FORT DETECTÉ"}
                        </span>
                        <p className="text-[#111827] text-xs font-semibold leading-relaxed">
                          {evaluationData.questionsFeedback[activeQuestionTab].keyPositive}
                        </p>
                      </div>

                      <div className="bg-[#EDC154]/20 border-2 border-stone-950 p-4 rounded-xl space-y-1 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                        <span className="text-[9px] font-mono text-amber-800 font-bold uppercase tracking-widest block">
                          {lang === 'EN' ? "⚠ REVISION RECOMMENDATION" : "⚠ DIRECTIVE D'AMÉLIORATION"}
                        </span>
                        <p className="text-[#111827] text-xs font-semibold leading-relaxed">
                          {evaluationData.questionsFeedback[activeQuestionTab].improvementTip}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Interactive Panel: Action Plan Drill Checklist */}
            <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] space-y-4">
              <div className="border-b border-[#F3F4F6] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-sans font-bold text-sm text-[#1A2B3C] uppercase tracking-wide flex items-center gap-2">
                    <Check className="w-4 h-4 text-stone-950" />
                    <span className="font-black text-stone-950">{lang === 'EN' ? "Personalized Action Roadmap" : "Plan d'Action de Préparation"}</span>
                  </h3>
                  <p className="text-[#6B7280] text-[10px] font-semibold mt-0.5">
                    {lang === 'EN' 
                      ? "Interactive drills prescribed based on speech metrics. Clear items to practice before real interviews." 
                      : "Exercices d'entraînement prescrits d'après vos résultats de voix. Cochez-les au fur et à mesure."}
                  </p>
                </div>
                
                {/* Checklist completion tracker percentage badge */}
                <span className="px-3 py-1 bg-[#EDC154] border-2 border-stone-950 text-stone-950 text-[10px] font-mono font-black uppercase rounded-full shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                  {lang === 'EN' ? "Completed: " : "Complété : "}
                  {Object.values(completedActions).filter(Boolean).length} / 4
                </span>
              </div>

              {/* Action List Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  lang === 'EN' 
                    ? "Conduct 1 voice training exercise under 135 words per minute to regulate flow." 
                    : "Effectuer 1 exercice de rythme d'élocution sous la barre de 135 mots/minute.",
                  lang === 'EN' 
                    ? "Integrate structural metrics & key numbers in core CV achievement statements." 
                    : "Intégrer des indicateurs de volume ou de budget lors de la défense de vos accomplissements.",
                  lang === 'EN' 
                    ? "Maintain eye-level posture alignment for at least 6 seconds per question." 
                    : "Maintenir la posture du regard au centre de l'axe caméra pendant au moins 6 secondes.",
                  lang === 'EN' 
                    ? "Reduce verbal fillers (e.g. 'um', 'uh', 'du coup') by marking 1-second strategic pauses." 
                    : "Diminuer les bruits d'hésitation verbaux ('euh', 'du coup') en marquant de légères pauses."
                ].map((action, idx) => {
                  const isDone = !!completedActions[idx];
                  return (
                    <div 
                      key={idx}
                      onClick={() => setCompletedActions({ ...completedActions, [idx]: !isDone })}
                      className={`p-4 border-2 border-stone-950 rounded-2xl flex items-start gap-3 cursor-pointer select-none transition-all ${
                        isDone 
                          ? 'bg-stone-100 opacity-75 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] translate-x-[1px] translate-y-[1px]' 
                          : 'bg-white hover:bg-stone-50 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]'
                      }`}
                    >
                      <div className={`w-4.5 h-4.5 rounded border-2 border-stone-950 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isDone ? 'bg-stone-950 text-[#EDC154]' : 'bg-white'
                      }`}>
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={`text-xs font-semibold leading-relaxed ${isDone ? 'line-through text-stone-400' : 'text-[#111827]'}`}>
                        {action}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Standard Return Action Trigger */}
            <div className="pt-4 border-t border-[#F3F4F6] flex justify-end">
              <button
                id="assess-btn-finish"
                onClick={() => {
                  transitionSessionState('IDLE');
                  onChangeTab('home');
                }}
                className="px-8 py-4 bg-[#18633F] hover:bg-[#1f7c50] text-white font-black text-xs uppercase tracking-widest rounded-xl border-2 border-stone-950 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4 text-white" />
                <span>{lang === 'EN' ? "Conclude & Go to Dashboard" : "Conclure & Voir le Tableau de Bord"}</span>
              </button>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

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
              className="bg-white border-2 border-stone-950 w-full max-w-lg rounded-[24px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b-2 border-stone-950 flex justify-between items-center bg-[#EDC154]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white text-stone-950 rounded-xl flex items-center justify-center border-2 border-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-stone-950 uppercase tracking-wide">
                      {lang === 'EN' ? "System Diagnostics" : "Diagnostic Matériel & Médias"}
                    </h2>
                    <p className="text-[10px] text-stone-900 font-mono tracking-wider font-bold">
                      {lang === 'EN' ? "WEBCAM & MICROPHONE VERIFICATION" : "VÉRIFICATION DE LA CAMÉRA & MICROPHONE"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDiagnosticModalOpen(false)}
                  className="w-8 h-8 rounded-full border-2 border-stone-950 bg-white hover:bg-zinc-100 flex items-center justify-center text-stone-950 transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                
                {/* Browser Support Row */}
                <div className="flex items-center justify-between p-3.5 bg-stone-50 border-2 border-stone-950 rounded-2xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  <div className="space-y-0.5 text-left">
                    <div className="font-black text-stone-950 flex items-center gap-1.5 relative group">
                      <span>{lang === 'EN' ? "Browser Media Capabilities" : "Compatibilité du Navigateur"}</span>
                      <span className="relative inline-block cursor-help">
                        <Info className="w-3.5 h-3.5 text-stone-500 hover:text-stone-950 transition-colors" />
                        {/* Tooltip component */}
                        <span className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-72 p-3.5 bg-stone-900 border border-stone-950 text-stone-100 rounded-xl text-[10.5px] font-medium leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-xl z-50">
                          <span className="block font-black text-amber-400 mb-1.5 font-mono text-[9px] uppercase tracking-wider">
                            {lang === 'EN' ? "🔍 WEBRTC STANDARDS CHECKED" : "🔍 NORMES WEBRTC ANALYSÉES"}
                          </span>
                          <ul className="list-disc list-inside space-y-1.5 text-stone-300">
                            <li>
                              <strong>MediaDevices API:</strong> {lang === 'EN' ? "Checks available webcam and microphone input devices." : "Vérifie les caméras et microphones disponibles."}
                            </li>
                            <li>
                              <strong>getUserMedia():</strong> {lang === 'EN' ? "Verifies low-latency audio/video capture permission capability." : "Vérifie la capacité de capture audio/vidéo sécurisée."}
                            </li>
                            <li>
                              <strong>HD Audio/Video Codecs:</strong> {lang === 'EN' ? "Checks support for high-fidelity audio (Opus) and video encoding formats." : "Vérifie la compatibilité des formats Opus HD et vidéo."}
                            </li>
                          </ul>
                          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-stone-900" />
                        </span>
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#6B7280]">
                      {lang === 'EN' ? "Detecting modern WebRTC standards" : "Détection des API standards WebRTC"}
                    </p>
                  </div>
                  {(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) ? (
                    <span className="px-2.5 py-1 bg-red-100 border-2 border-stone-950 text-red-700 rounded-lg font-mono text-[9px] uppercase font-black tracking-wider shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                      {lang === 'EN' ? "Unsupported" : "Incompatible"}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-[#A7F3D0] border-2 border-stone-950 text-stone-950 rounded-lg font-mono text-[9px] uppercase font-black tracking-wider flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse border border-stone-950" />
                      {lang === 'EN' ? "Supported" : "Compatible"}
                    </span>
                  )}
                </div>

                {/* Diagnostics Status Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* CAMERA CARD */}
                  <div className="p-4 border-2 border-stone-950 rounded-2xl bg-white shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#A5B4FC] border border-stone-950 text-stone-950 rounded-lg">
                          <Camera className="w-4 h-4" />
                        </div>
                        <span className="font-black text-stone-950">{lang === 'EN' ? "Camera" : "Caméra"}</span>
                      </div>
                      
                      {diagnosticLoading ? (
                        <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                      ) : diagnosticResults ? (
                        diagnosticResults.cameraAccess === 'allowed' ? (
                          <span className="px-2 py-0.5 bg-[#A7F3D0] border-2 border-stone-950 text-stone-950 rounded-md font-mono text-[9px] font-black uppercase">
                            {lang === 'EN' ? "Allowed" : "Autorisé"}
                          </span>
                        ) : diagnosticResults.cameraAccess === 'not-found' ? (
                          <span className="px-2 py-0.5 bg-[#EDC154] border-2 border-stone-950 text-stone-950 rounded-md font-mono text-[9px] font-black uppercase">
                            {lang === 'EN' ? "No Hardware" : "Absent"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 border-2 border-stone-950 text-red-700 rounded-md font-mono text-[9px] font-black uppercase">
                            {lang === 'EN' ? "Blocked" : "Bloqué"}
                          </span>
                        )
                      ) : (
                        <span className="text-zinc-400 font-mono text-[9px]">—</span>
                      )}
                    </div>

                    <div className="space-y-1 text-left">
                      <p className="text-[10px] uppercase font-black tracking-wider text-stone-400 font-mono">
                        {lang === 'EN' ? "DETECTED WEBCAMS" : "APPAREILS DÉTECTÉS"}
                      </p>
                      {diagnosticLoading ? (
                        <p className="text-[10.5px] text-zinc-400 italic">{lang === 'EN' ? "Scanning..." : "Scan en cours..."}</p>
                      ) : diagnosticResults && diagnosticResults.cameraDevices.length > 0 ? (
                        <div className="space-y-1 max-h-[48px] overflow-y-auto">
                          {diagnosticResults.cameraDevices.map((dev, idx) => (
                            <p key={idx} className="text-[10.5px] font-semibold text-stone-900 truncate">
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
                  <div className="p-4 border-2 border-stone-950 rounded-2xl bg-white shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#A5F3FC] border border-stone-950 text-stone-950 rounded-lg">
                          <Mic className="w-4 h-4" />
                        </div>
                        <span className="font-black text-stone-950">{lang === 'EN' ? "Microphone" : "Microphone"}</span>
                      </div>
                      
                      {diagnosticLoading ? (
                        <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                      ) : diagnosticResults ? (
                        diagnosticResults.micAccess === 'allowed' ? (
                          <span className="px-2 py-0.5 bg-[#A7F3D0] border-2 border-stone-950 text-stone-950 rounded-md font-mono text-[9px] font-black uppercase">
                            {lang === 'EN' ? "Allowed" : "Autorisé"}
                          </span>
                        ) : diagnosticResults.micAccess === 'not-found' ? (
                          <span className="px-2 py-0.5 bg-[#EDC154] border-2 border-stone-950 text-stone-950 rounded-md font-mono text-[9px] font-black uppercase">
                            {lang === 'EN' ? "No Hardware" : "Absent"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 border-2 border-stone-950 text-red-700 rounded-md font-mono text-[9px] font-black uppercase">
                            {lang === 'EN' ? "Blocked" : "Bloqué"}
                          </span>
                        )
                      ) : (
                        <span className="text-zinc-400 font-mono text-[9px]">—</span>
                      )}
                    </div>

                    <div className="space-y-1 text-left">
                      <p className="text-[10px] uppercase font-black tracking-wider text-stone-400 font-mono">
                        {lang === 'EN' ? "DETECTED MICROPHONES" : "MICROS DÉTECTÉS"}
                      </p>
                      {diagnosticLoading ? (
                        <p className="text-[10.5px] text-zinc-400 italic">{lang === 'EN' ? "Scanning..." : "Scan en cours..."}</p>
                      ) : diagnosticResults && diagnosticResults.micDevices.length > 0 ? (
                        <div className="space-y-1 max-h-[48px] overflow-y-auto">
                          {diagnosticResults.micDevices.map((dev, idx) => (
                            <p key={idx} className="text-[10.5px] font-semibold text-stone-900 truncate">
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

                {/* Real-time Network Latency Check Section */}
                <div className="p-4 border-2 border-stone-950 rounded-2xl bg-stone-50 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] space-y-4 text-left">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#FED7AA] border border-stone-950 text-stone-950 rounded-lg">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="font-black text-stone-950">
                        {lang === 'EN' ? "Network Stability Check" : "Stabilité de la Connexion"}
                      </span>
                    </div>

                    {diagnosticLoading ? (
                      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase font-black text-stone-500">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                        <span>{lang === 'EN' ? "Testing Line..." : "Test de Ligne..."}</span>
                      </div>
                    ) : diagnosticResults?.network ? (
                      diagnosticResults.network.quality === 'excellent' ? (
                        <span className="px-2 py-0.5 bg-emerald-100 border-2 border-stone-950 text-emerald-800 rounded-md font-mono text-[9px] uppercase font-black tracking-wider flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse border border-stone-950" />
                          {lang === 'EN' ? "Excellent Connection" : "Connexion Excellente"}
                        </span>
                      ) : diagnosticResults.network.quality === 'good' ? (
                        <span className="px-2 py-0.5 bg-amber-100 border-2 border-stone-950 text-amber-800 rounded-md font-mono text-[9px] uppercase font-black tracking-wider flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse border border-stone-950" />
                          {lang === 'EN' ? "Good Connection" : "Connexion Stable"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 border-2 border-stone-950 text-red-700 rounded-md font-mono text-[9px] uppercase font-black tracking-wider flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse border border-stone-950" />
                          {lang === 'EN' ? "Unstable Connection" : "Connexion Instable"}
                        </span>
                      )
                    ) : (
                      <span className="text-zinc-400 font-mono text-[9px]">—</span>
                    )}
                  </div>

                  {/* Network stats row */}
                  <div className="grid grid-cols-3 gap-2 bg-white border-2 border-stone-950 p-3 rounded-xl shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                    <div className="text-center space-y-0.5 border-r border-stone-200">
                      <p className="text-[9px] uppercase font-mono text-stone-400 font-black">
                        {lang === 'EN' ? "LATENCY" : "LATENCE"}
                      </p>
                      {diagnosticLoading ? (
                        <p className="font-mono text-xs font-black text-stone-500 animate-pulse">...</p>
                      ) : diagnosticResults?.network ? (
                        <p className={`font-mono text-sm font-black ${
                          diagnosticResults.network.avgLatency < 80 ? 'text-emerald-600' :
                          diagnosticResults.network.avgLatency < 150 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {diagnosticResults.network.avgLatency}ms
                        </p>
                      ) : (
                        <p className="font-mono text-xs font-black text-stone-300">—</p>
                      )}
                    </div>

                    <div className="text-center space-y-0.5 border-r border-stone-200">
                      <p className="text-[9px] uppercase font-mono text-stone-400 font-black">
                        {lang === 'EN' ? "JITTER" : "GIGUE (JITTER)"}
                      </p>
                      {diagnosticLoading ? (
                        <p className="font-mono text-xs font-black text-stone-500 animate-pulse">...</p>
                      ) : diagnosticResults?.network ? (
                        <p className={`font-mono text-sm font-black ${
                          diagnosticResults.network.jitter <= 15 ? 'text-emerald-600' :
                          diagnosticResults.network.jitter <= 30 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {diagnosticResults.network.jitter}ms
                        </p>
                      ) : (
                        <p className="font-mono text-xs font-black text-stone-300">—</p>
                      )}
                    </div>

                    <div className="text-center space-y-0.5">
                      <p className="text-[9px] uppercase font-mono text-stone-400 font-black">
                        {lang === 'EN' ? "PACKET LOSS" : "PERTE DE PAQUETS"}
                      </p>
                      {diagnosticLoading ? (
                        <p className="font-mono text-xs font-black text-stone-500 animate-pulse">...</p>
                      ) : diagnosticResults?.network ? (
                        <p className={`font-mono text-sm font-black ${
                          diagnosticResults.network.packetLoss === 0 ? 'text-emerald-600' :
                          diagnosticResults.network.packetLoss <= 10 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {diagnosticResults.network.packetLoss}%
                        </p>
                      ) : (
                        <p className="font-mono text-xs font-black text-stone-300">—</p>
                      )}
                    </div>
                  </div>

                  {/* Recommendation block depending on quality */}
                  {diagnosticResults?.network && (
                    <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-1 text-[11px] leading-relaxed">
                      <p className="font-black text-stone-800">
                        {lang === 'EN' ? "Interview Suitability Analysis:" : "Analyse de Compatibilité d'Entretien :"}
                      </p>
                      <p className="text-stone-600 font-medium">
                        {diagnosticResults.network.quality === 'excellent' ? (
                          lang === 'EN' 
                            ? "Your connection quality is excellent. Bandwidth capability and ping stability are optimal for full-fidelity real-time audio synthesis and sub-second video processing."
                            : "Qualité de connexion exceptionnelle. La latence et la gigue sont optimales pour l'entretien vidéo HD interactif et la synchronisation vocale sub-seconde."
                        ) : diagnosticResults.network.quality === 'good' ? (
                          lang === 'EN'
                            ? "Your connection is stable and fully sufficient for video interviews. If possible, avoid heavy downloads or streaming activities on your network during the session."
                            : "Connexion stable et suffisante. Pour une expérience optimale, nous vous recommandons d'éviter les téléchargements ou le streaming en arrière-plan pendant l'entretien."
                        ) : (
                          lang === 'EN'
                            ? "Caution: High latency or packet loss detected. We strongly suggest connecting to a 5G/Fiber network or a wired connection (Ethernet), or moving closer to your Wi-Fi router."
                            : "Attention : Latence élevée ou perte de paquets détectée. Nous vous suggérons d'utiliser une connexion filaire (Ethernet), de vous rapprocher de votre borne Wi-Fi, ou de basculer sur un réseau 4G/5G stable."
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* HELPFUL STEP-BY-STEP ACCESS RECOVERY INSTRUCTIONS */}
                {diagnosticResults && (diagnosticResults.cameraAccess === 'blocked' || diagnosticResults.micAccess === 'blocked') && (
                  <div className="p-4 bg-[#EDC154]/20 border-2 border-stone-950 rounded-[20px] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] space-y-3">
                    <div className="flex items-center gap-2 border-b-2 border-stone-950 pb-2">
                      <HelpCircle className="w-4.5 h-4.5 text-stone-950" />
                      <h4 className="font-black text-stone-950 uppercase font-mono text-[10px] tracking-wider">
                        {lang === 'EN' ? "How to Grant Browser Permissions" : "Comment Autoriser les Périphériques"}
                      </h4>
                    </div>

                    <div className="space-y-2.5 text-stone-900 text-[11px] leading-relaxed font-semibold text-left">
                      <div>
                        <p className="font-black text-[#1A2B3C]">
                          1. {lang === 'EN' ? "Google Chrome / Microsoft Edge" : "Google Chrome / Microsoft Edge"}
                        </p>
                        <p className="pl-3 mt-0.5 text-stone-800 font-medium">
                          {lang === 'EN' 
                            ? "Look at the left of the address bar. Click the padlock or settings icon (⚙️ / 🔒), then toggle Camera and Microphone to 'Allow' and reload the page."
                            : "Regardez à gauche de la barre d'adresse URL. Cliquez sur l'icône de cadenas ou de réglages (⚙️ / 🔒), activez la Caméra et le Microphone sur 'Autoriser', puis actualisez la page."}
                        </p>
                      </div>

                      <div>
                        <p className="font-black text-[#1A2B3C]">
                          2. {lang === 'EN' ? "Apple Safari (macOS & iOS)" : "Apple Safari (macOS & iOS)"}
                        </p>
                        <p className="pl-3 mt-0.5 text-stone-800 font-medium">
                          {lang === 'EN'
                            ? "On macOS, go to the menu Safari -> Settings for This Website -> set Camera and Microphone to 'Allow'. On iOS, open Settings -> Safari -> Camera/Microphone -> set to 'Allow'."
                            : "Sur macOS, allez dans le menu Safari -> Réglages pour ce site -> réglez l'Appareil photo et le Microphone sur 'Autoriser'. Sur iOS, allez dans Réglages -> Safari -> Appareil photo/Microphone -> réglez sur 'Autoriser'."}
                        </p>
                      </div>

                      <div>
                        <p className="font-black text-[#1A2B3C]">
                          3. {lang === 'EN' ? "Mozilla Firefox" : "Mozilla Firefox"}
                        </p>
                        <p className="pl-3 mt-0.5 text-stone-800 font-medium">
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
              <div className="p-6 border-t-2 border-stone-950 bg-stone-50 flex justify-between items-center gap-4">
                <button
                  onClick={() => setIsDiagnosticModalOpen(false)}
                  className="px-5 py-3 border-2 border-stone-950 bg-white text-stone-950 hover:bg-stone-100 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex-1 text-center font-sans shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]"
                >
                  {lang === 'EN' ? "Dismiss" : "Fermer"}
                </button>
                <button
                  onClick={runDiagnosticCheck}
                  disabled={diagnosticLoading}
                  className="px-5 py-3 bg-[#18633F] hover:bg-[#1f7c50] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex-1 flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] font-sans border-2 border-stone-950"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${diagnosticLoading ? 'animate-spin' : ''}`} />
                  <span>{lang === 'EN' ? "Scan & Try Again" : "Scanner à Nouveau"}</span>
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PreSessionWarning
        isOpen={showWarningModal}
        onClose={() => {
          setShowWarningModal(false);
          setPendingAction(null);
        }}
        onConfirm={() => {
          setShowWarningModal(false);
          if (pendingAction === 'mirror') {
            setAssessmentState('immersive_mirror');
          } else if (pendingAction === 'standard') {
            handleBeginAssessmentAction();
          }
          setPendingAction(null);
        }}
        lang={lang}
      />

      {/* Checkout Modal Overlay */}
      {selectedProductForCheckout && (
        <CheckoutModal
          productId={selectedProductForCheckout}
          userId={user.id || 'usr_candidate'}
          lang={lang}
          onClose={() => setSelectedProductForCheckout(null)}
          onSuccess={(updated) => {
            setMonetization(updated);
            setSelectedProductForCheckout(null);
            window.dispatchEvent(new Event('shana_progress_update'));
          }}
        />
      )}

    </div>
  );
}
