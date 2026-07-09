import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Check, 
  Loader2, 
  Cpu, 
  Brain,
  MessageSquare, 
  User, 
  Square,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Camera,
  CameraOff,
  Video,
  Clock,
  Pause,
  Plus,
  Timer,
  PhoneOff,
  Subtitles,
  Wifi,
  Users,
  Maximize2,
  Minimize2,
  Sparkles,
  X,
  LockKeyhole
} from 'lucide-react';
import { User as UserType, Profile as ProfileType, InterviewBlueprint } from '../types';
import { StorageService } from '../lib/storage';
import { InterviewVoiceManager } from '../lib/InterviewVoiceManager';
import { useMilestoneTracker } from './Toast';
import { LiveSessionTracker, StatsRepository } from '../services/admin/metrics';
import { SerendipityService } from '../lib/serendipity';
import { ShanaInsightEngine } from '../lib/insightEngine';
import { InterviewDirector } from '../lib/director';
import ShanaIntelligenceCenter from './ShanaIntelligenceCenter';
import CheckoutModal from './CheckoutModal';

interface InterviewSimulatorProps {
  currentUser: UserType;
  currentProfile: ProfileType;
  blueprint: InterviewBlueprint | null;
  cvAnalysis?: any;
  history?: any[];
  onBack: () => void;
  onNavigateTab?: (tab: string) => void;
  surpriseConfig?: any;
}

interface Message {
  role: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export default function InterviewSimulator({ currentUser, currentProfile, blueprint, cvAnalysis, history, onBack, onNavigateTab, surpriseConfig }: InterviewSimulatorProps) {
  // Monetization and credit states
  const [monetization, setMonetization] = useState(() => StorageService.getCandidateMonetization(currentUser.id));
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<string | null>(null);
  
  const hasMirrorCredits = monetization.ultraActive || (monetization.freeMirror + monetization.packMirror + monetization.topUpMirror) > 0;
  const isFrench = currentProfile.language === 'French';

  // Configured states
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const { checkMilestones } = useMilestoneTracker(currentUser.id);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Camera stream states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showChatSidebar, setShowChatSidebar] = useState(false);

  const toggleCamera = async () => {
    if (isCameraOn) {
      stopCamera();
      setIsCameraOn(false);
    } else {
      setIsCameraOn(true);
      await startCamera();
    }
  };

  // Running simulation states
  const [isInitialized, setIsInitialized] = useState(false);

  // Live Serendipity tracking states (MODE 2)
  const [interruptionCount, setInterruptionCount] = useState(0);
  const [fillerWordsCount, setFillerWordsCount] = useState(0);
  const [hesitationSeconds, setHesitationSeconds] = useState(0);
  const [answerSeconds, setAnswerSeconds] = useState(0);
  const [liveHint, setLiveHint] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Timer states
  const [seconds, setSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [questionTimeLimit, setQuestionTimeLimit] = useState(90);
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(90);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  
  // Production Insight Engine states
  const [activeInsight, setActiveInsight] = useState<any | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  
  // Real-time Conversation Director State (Phase 22.1)
  const [conversationState, setConversationState] = useState<any>(null);
  
  // Speech Recognition & Synthesis references
  const recognitionRef = useRef<any>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);
  
  // Hands-free automated voice tracking references
  const silenceTimeoutRef = useRef<any>(null);
  const currentTranscriptRef = useRef<string>("");
  const isCurrentlySubmitting = useRef<boolean>(false);
  const liveSessionIdRef = useRef<string | null>(null);

  // Before Session Serendipity Suggestion
  const [beforeSuggestion, setBeforeSuggestion] = useState<string | null>(null);

  // HIU Phase 11 - Human Presence Engine State
  const [presenceState, setPresenceState] = useState<{
    behavior: 'idle' | 'blinking' | 'nodding' | 'note-taking' | 'smiling' | 'looking-up' | 'pausing' | 'backchannel';
    subtextEN: string;
    subtextFR: string;
    backchannelWord?: string;
  }>({
    behavior: 'idle',
    subtextEN: 'Active focus, breathing naturally',
    subtextFR: 'Focalisation active, respiration naturelle'
  });

  useEffect(() => {
    let interval: any = null;

    if (isLoading) {
      // Recruiter is thinking / formulating question
      setPresenceState({
        behavior: 'looking-up',
        subtextEN: 'Looking up thoughtfully to frame a highly structured follow-up question...',
        subtextFR: 'Regard pensif, structuration d\'une relance ciblée...'
      });

      // After 2.5 seconds of thinking, show a natural pause/deep breath behavior
      interval = setTimeout(() => {
        setPresenceState({
          behavior: 'pausing',
          subtextEN: 'Natural pause before delivering a difficult question...',
          subtextFR: 'Pause de temporisation naturelle avant de formuler la question...'
        });
      }, 2500);

    } else if (isListening) {
      // Candidate is speaking (recruiter is listening)
      setPresenceState({
        behavior: 'nodding',
        subtextEN: 'Nodding along in active listening...',
        subtextFR: 'Hochements de tête d\'approbation et d\'écoute active...'
      });

      let turnCount = 0;
      interval = setInterval(() => {
        turnCount++;
        const index = turnCount % 4;
        if (index === 0) {
          setPresenceState({
            behavior: 'note-taking',
            subtextEN: 'Taking brief notes on your key arguments...',
            subtextFR: 'Prise de notes rapide sur vos arguments clés...'
          });
        } else if (index === 1) {
          const backchannelsEN = ["mm-hmm", "I see", "interesting", "okay"];
          const backchannelsFR = ["hm-hm", "je vois", "intéressant", "d'accord"];
          const word = currentProfile?.language === 'English' 
            ? backchannelsEN[Math.floor(Math.random() * backchannelsEN.length)]
            : backchannelsFR[Math.floor(Math.random() * backchannelsFR.length)];
          
          setPresenceState({
            behavior: 'backchannel',
            subtextEN: `Active backchannel: "${word}"...`,
            subtextFR: `Interjection d'écoute active : "${word}"...`,
            backchannelWord: word
          });
        } else if (index === 2) {
          setPresenceState({
            behavior: 'smiling',
            subtextEN: 'Slightly smiling, feeling impressed by your structural clarity...',
            subtextFR: 'Sourire bienveillant, réceptif à votre clarté structurale...'
          });
        } else {
          setPresenceState({
            behavior: 'idle',
            subtextEN: 'Maintaining steady, calm eye contact...',
            subtextFR: 'Maintien d\'un contact visuel calme et serein...'
          });
        }
      }, 4000);

    } else if (isPlayingVoice) {
      // Recruiter is speaking
      setPresenceState({
        behavior: 'idle',
        subtextEN: 'Communicating with natural posture and vocal pacing...',
        subtextFR: 'Expression orale naturelle avec débit et posture maîtrisés...'
      });

      let turnCount = 0;
      interval = setInterval(() => {
        turnCount++;
        if (turnCount % 2 === 0) {
          setPresenceState({
            behavior: 'smiling',
            subtextEN: 'Smiling warmly to encourage you...',
            subtextFR: 'Sourire chaleureux d\'encouragement...'
          });
        } else {
          setPresenceState({
            behavior: 'nodding',
            subtextEN: 'Communicating with natural gestures...',
            subtextFR: 'Hochements naturels de ponctuation d\'idées...'
          });
        }
      }, 5000);

    } else {
      // Idle / waiting
      setPresenceState({
        behavior: 'idle',
        subtextEN: 'Recruiter sitting comfortably, waiting for your cue...',
        subtextFR: 'Le recruteur est confortablement installé, en attente de votre signal...'
      });
    }

    return () => {
      if (interval) {
        clearInterval(interval);
        clearTimeout(interval);
      }
    };
  }, [isLoading, isListening, isPlayingVoice, currentProfile?.language]);

  useEffect(() => {
    if (currentUser?.id) {
      const activeHistory = history || StorageService.getHistory(currentUser.id);
      const sug = SerendipityService.getBeforeSessionSuggestion(currentUser.id, activeHistory);
      if (sug) {
        setBeforeSuggestion(sug.text);
      }
    }
  }, [currentUser, history]);

  // Sync real-time session progress with admin panel
  useEffect(() => {
    if (isInitialized && !isFinished && liveSessionIdRef.current && seconds > 0) {
      const currentPhase = chatHistory.length < 3 
        ? 'Introduction' 
        : (chatHistory.length < 8 ? 'Questions Techniques' : 'Clôture & Feedback');
      
      const calcProgress = Math.min(95, 5 + chatHistory.length * 10);
      LiveSessionTracker.updateSessionProgress(liveSessionIdRef.current, seconds, currentPhase, calcProgress);
    }
  }, [seconds, isInitialized, isFinished, chatHistory.length]);

  // Camera preview handles
  const startCamera = async () => {
    try {
      setCameraError(false);
      if (cameraStream) {
        if (videoRef.current) {
          if (videoRef.current.srcObject !== cameraStream) {
            videoRef.current.srcObject = cameraStream;
          }
          videoRef.current.play().catch(e => console.warn("Failed playing active video element:", e));
        }
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, 
          audio: false // keep voice handling to speech recognition API
        });
      } catch (err) {
        console.warn("Failing strict facingMode user, trying generic video constraint:", err);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
      }

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Failed playing newly requested video stream:", e));
      }
    } catch (err) {
      console.warn("Camera mirroring access failed completely:", err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Start camera and acquire voice lock on mount
  useEffect(() => {
    InterviewVoiceManager.acquireLock('INTERVIEW_SIMULATOR');
    // Stop the header camera preview so the simulator can obtain exclusive camera access immediately!
    window.dispatchEvent(new Event('shana_stop_header_camera'));
    startCamera();
    return () => {
      stopCamera();
      InterviewVoiceManager.releaseLock('INTERVIEW_SIMULATOR');
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (liveSessionIdRef.current) {
        try {
          const sessions = StatsRepository.getSessions();
          const sess = sessions.find(s => s.id === liveSessionIdRef.current);
          if (sess && sess.status === 'active') {
            LiveSessionTracker.completeSession(liveSessionIdRef.current, 'cancelled');
          }
        } catch (e) {}
      }
    };
  }, []);

  // Update video element binding on status changes
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
      }
      videoRef.current.play().catch(e => console.warn("Failed playing active video element on state change:", e));
    }
  }, [cameraStream, isInitialized]);

  // Initialize Speech Recognition on mount or mode switch
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      
      const langCode = currentProfile.language === 'French' ? 'fr-FR' : 'en-US';
      rec.lang = langCode;

      rec.onstart = () => {
        setIsListening(true);
        setApiError(null);
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const fullText = finalTranscript + interimTranscript;
        
        if (fullText.trim().length > 0 && isPlayingVoice) {
          setInterruptionCount(prev => prev + 1);
          stopVoiceSpeaking();
        }

        // Show real-time voice construction
        setUserInput(fullText);
        currentTranscriptRef.current = fullText;

        // Reset silence timer on every spoken word
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        if (fullText.trim().length > 0 && !isCurrentlySubmitting.current) {
          // Speak has content: If user remains silent for 2.2 seconds, automatically auto-submit to the AI! Full conversational turn.
          silenceTimeoutRef.current = setTimeout(() => {
            const answer = currentTranscriptRef.current.trim();
            if (answer && !isCurrentlySubmitting.current) {
              handleAdaptiveAutoSubmit(answer);
            }
          }, 2200);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        if (event.error === 'not-allowed') {
          setApiError(currentProfile.language === 'French' ? "L'autorisation d'accès au micro a été refusée. Veuillez l'activer dans vos paramètres pour parler." : "Microphone permission was denied. Please enable microphone authorization in your browser settings to proceed.");
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        
        // Recover or submit leftover speech if the API shut off early
        const leftover = currentTranscriptRef.current.trim();
        if (leftover && !isCurrentlySubmitting.current && !isLoading && !isPlayingVoice) {
          handleAdaptiveAutoSubmit(leftover);
        } else if (!isCurrentlySubmitting.current && !isLoading && !isPlayingVoice && !isFinished && mode === 'voice') {
          // Automatically restart to keep the hands-free conversational channel open
          try {
            rec.start();
          } catch (e) {
            // Already running
          }
        }
      };

      recognitionRef.current = rec;
    } else {
      console.warn('Speech recognition not supported in this browser.');
    }

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopVoiceSpeaking();
    };
  }, [currentProfile.language, mode]);

  // Handle timer
  useEffect(() => {
    if (isInitialized && !isFinished) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);

        // Per-question countdown decreases only if not loading
        if (!isLoading && !isTimerPaused) {
          setQuestionSecondsLeft(prev => {
            if (prev <= 1) {
              return 0;
            }
            return prev - 1;
          });
        }

        // Functional user input reader to avoid dependency resets
        setUserInput(currentInput => {
          const hasInput = !!currentInput.trim();
          if (hasInput) {
            setAnswerSeconds(a => a + 1);
            const fillers = currentProfile?.language === 'French'
              ? /\b(euh|bah|genre|du coup|alors|voilà|comme)\b/gi
              : /\b(um|uh|like|you know|actually|basically|so)\b/gi;
            const matches = currentInput.match(fillers);
            setFillerWordsCount(matches ? matches.length : 0);
          } else {
            setHesitationSeconds(h => h + 1);
          }
          return currentInput;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isInitialized, isFinished, isLoading, isTimerPaused, currentProfile?.language]);

  // Reset live metrics and session storage intervention indicators on every new question
  useEffect(() => {
    if (isInitialized && !isFinished) {
      setInterruptionCount(0);
      setFillerWordsCount(0);
      setHesitationSeconds(0);
      setAnswerSeconds(0);
      setLiveHint(null);
    }
  }, [chatHistory.length, isInitialized, isFinished]);

  useEffect(() => {
    if (isInitialized && currentUser?.id) {
      sessionStorage.removeItem(`shana_session_intervention_triggered_${currentUser.id}`);
    }
  }, [isInitialized, currentUser]);

  // Live Detection triggers (MODE 2)
  useEffect(() => {
    if (isInitialized && !isFinished && currentUser?.id && !liveHint) {
      const hint = SerendipityService.checkDuringSessionIntervention(currentUser.id, {
        fillerWordsCount,
        hesitationTime: hesitationSeconds,
        answerDuration: answerSeconds,
        interruptionCount
      });
      if (hint) {
        setLiveHint(hint);
        // Automatically clear hint after 7 seconds to keep it as a transient, non-fatiguing notification
        setTimeout(() => {
          setLiveHint(null);
        }, 7000);
      }
    }
  }, [isInitialized, isFinished, currentUser?.id, fillerWordsCount, hesitationSeconds, answerSeconds, interruptionCount, liveHint]);

  // Handle per-question timer expiration (auto-submit draft or pause input)
  useEffect(() => {
    if (questionSecondsLeft === 0 && isInitialized && !isFinished && !isLoading) {
      const draft = userInput.trim();
      if (draft.length > 0) {
        handleAdaptiveAutoSubmit(draft);
      } else {
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
      }
    }
  }, [questionSecondsLeft, isInitialized, isFinished, isLoading, userInput, isListening]);

  // Automatically reset question timer when a new question arrives from Shana AI
  useEffect(() => {
    if (chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      if (lastMessage.role === 'ai') {
        setQuestionSecondsLeft(questionTimeLimit);
        setIsTimerPaused(false); // unpause on new question
      }
    }
  }, [chatHistory.length, questionTimeLimit]);

  // Scroll to bottom helper
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  // Speech Helper - Text to speech speaking
  const speakVoice = (text: string) => {
    if (isMuted) {
      setIsPlayingVoice(false);
      if (mode === 'voice' && recognitionRef.current && !isLoading && !isFinished) {
        setUserInput('');
        currentTranscriptRef.current = "";
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already running
        }
      }
      return;
    }
    
    stopVoiceSpeaking();

    const cleanText = text.replace(/[*#_\\`]/g, ''); // strip markdown markup
    if (!cleanText) return;

    setIsPlayingVoice(true);

    if (!InterviewVoiceManager.isAllowed('INTERVIEW_SIMULATOR')) {
      console.warn("[InterviewSimulator] Speech blocked because we do not own the voice lock.");
      setIsPlayingVoice(false);
      return;
    }

    const recruiterId = conversationState?.personality?.id || surpriseConfig?.personality?.id || 'corporate';
    const currentTurn = conversationState?.currentTurn || 0;
    const isCoachTransition = cleanText.toLowerCase().includes("coaching") || cleanText.toLowerCase().includes("session d'entraînement") || cleanText.toLowerCase().includes("conclut") || cleanText.toLowerCase().includes("conseil");
    const stage = isCoachTransition ? 'coach_transition' : 
                  (currentTurn <= 1 ? 'welcome' : 
                   currentTurn >= 5 ? 'closing' : 
                   (currentTurn === 3 || currentTurn === 4) ? 'challenging' : 'core');
    const candidateMood = conversationState?.emotionState?.primaryVibe || 'neutral';
    const language = currentProfile?.language || 'English';

    // 1. Play using OpenAI TTS via HTML5 Audio with fallback to local synthesis
    const audioUrl = `/api/interview/speak?text=${encodeURIComponent(cleanText)}&recruiterId=${encodeURIComponent(recruiterId)}&stage=${encodeURIComponent(stage)}&candidateMood=${encodeURIComponent(candidateMood)}&language=${encodeURIComponent(language)}`;
    
    let fallbackTriggered = false;
    const triggerFallback = (reason: string) => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      console.warn(`[SHANA Client] ${reason}. Falling back to local SpeechSynthesis.`);
      
      InterviewVoiceManager.stopAllActiveOutputs();
      if (currentAudioRef.current) {
        currentAudioRef.current = null;
      }
      fallbackSpeakVoiceLocal(cleanText);
    };

    const audio = InterviewVoiceManager.playServerAudio(
      audioUrl,
      'INTERVIEW_SIMULATOR',
      () => {
        if (fallbackTriggered) return;
        setIsPlayingVoice(false);
        currentAudioRef.current = null;
        // Automatically unlock/activate the mic for hands-free bidirectional voice interactive turn-taking!
        if (mode === 'voice' && recognitionRef.current && !isLoading && !isFinished) {
          setUserInput('');
          currentTranscriptRef.current = "";
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Already running or permission issue handles
          }
        }
      },
      (err) => {
        triggerFallback("OpenAI TTS stream error");
      }
    );

    if (audio) {
      currentAudioRef.current = audio;

      // Fail safe timeout: If audio does not start playing within 2000ms, fallback immediately
      const playTimeout = setTimeout(() => {
        triggerFallback("Audio playback timeout (2.0s)");
      }, 2000);

      audio.onplay = () => {
        clearTimeout(playTimeout);
      };

      audio.onplaying = () => {
        clearTimeout(playTimeout);
      };
    } else {
      triggerFallback("Failed to initiate audio object");
    }
  };

  const fallbackSpeakVoiceLocal = (cleanText: string) => {
    setIsPlayingVoice(true);
    InterviewVoiceManager.speakLocal(
      cleanText,
      currentProfile.language === 'English' ? 'en-US' : 'fr-FR',
      'INTERVIEW_SIMULATOR',
      () => {
        setIsPlayingVoice(false);
        // Automatically unlock/activate the mic for hands-free bidirectional voice interactive turn-taking!
        if (mode === 'voice' && recognitionRef.current && !isLoading && !isFinished) {
          setUserInput('');
          currentTranscriptRef.current = "";
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Already running or permission issue handles
          }
        }
      }
    );
  };

  const stopVoiceSpeaking = () => {
    InterviewVoiceManager.stopAllActiveOutputs();
    setIsPlayingVoice(false);
    if (currentAudioRef.current) {
      currentAudioRef.current = null;
    }
  };

  // Toggle mic for Voice mode
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setApiError(currentProfile.language === 'French' ? "La reconnaissance vocale n'est pas supportée par ce navigateur. Veuillez utiliser Chrome de préférence." : "Speech Recognition is not supported by your current browser. Chrome browser is highly recommended.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      stopVoiceSpeaking();
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition', err);
      }
    }
  };

  // Formatting helper for timer
  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Shared automated turn-taking submit mechanism
  const handleAdaptiveAutoSubmit = async (finalAnswer: string) => {
    if (!finalAnswer.trim() || isLoading || isCurrentlySubmitting.current) return;
    
    isCurrentlySubmitting.current = true;
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    // Stop mic if on
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Suppress
      }
    }

    setUserInput('');
    currentTranscriptRef.current = "";
    setApiError(null);

    // Stop speaking interviewer question
    stopVoiceSpeaking();

    // Append User Answer to history
    const userMessage: Message = {
      role: 'user',
      text: finalAnswer.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatHistory: updatedHistory,
          userInput: finalAnswer.trim(),
          profile: currentProfile,
          blueprint: blueprint,
          cvAnalysis: cvAnalysis,
          history: history,
          surpriseConfig: surpriseConfig,
          conversationState: conversationState // Send preserved state
        })
      });

      let resJson;
      try {
        resJson = await response.json();
      } catch (err) {
        resJson = {};
      }

      if (!response.ok) {
        throw new Error(resJson.error || 'Simulation failed to generate response.');
      }

      // Preserve updated conversation state
      if (resJson.conversationState) {
        setConversationState(resJson.conversationState);
      }

      const interviewerResponse = resJson.response;

      const aiMessage: Message = {
        role: 'ai',
        text: interviewerResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory(prev => [...prev, aiMessage]);
      speakVoice(interviewerResponse);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Server API connection issue.');
      
      // Offline heuristic follow-up loops
      const fallbacksEN = [
        "That is interesting. Can you expand on a specific technical challenge or business bottleneck you encountered in that situation and how you addressed it?",
        "As an interviewer, I would like to know how you evaluated the trade-offs of that approach. What other alternatives did you rule out?",
        "Tell me about how you handled collaboration with stakeholders who did not agree with your method. How did you build consensus?",
        "Thank you for sharing. Lastly, do you have any objective questions for me about our organization or the target role?",
        "Thank you for your valuable details today. That concludes our standard job interview simulation. Your records are safely saved."
      ];

      const fallbacksFR = [
        "C'est un point intéressant. Pouvez-vous détailler un défi technique ou opérationnel précis dans ce contexte et comment vous l'avez surmonté ?",
        "En tant que recruteur, j'aimerais comprendre comment vous avez évalué les compromis de cette solution. Quelles autres options aviez-vous envisagées ?",
        "Comment s'est passée la collaboration avec les parties prenantes en désaccord avec votre stratégie ? Comment avez-vous trouvé un compromis ?",
        "Merci pour ces explications. Pour conclure, avez-vous des questions à me poser concernant notre organisation ou les aspects du poste ?",
        "Merci pour votre participation aujourd'hui. Cela met fin à notre simulation d'entretien d'embauche. Vos informations sont enregistrées."
      ];

      const isEng = currentProfile.language === 'English';
      const list = isEng ? fallbacksEN : fallbacksFR;
      
      const answeredCount = updatedHistory.filter(m => m.role === 'user').length;
      const nextIndex = Math.min(answeredCount - 1, list.length - 1);
      const fallbackResponse = list[nextIndex];

      const aiMessage: Message = {
        role: 'ai',
        text: fallbackResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory(prev => [...prev, aiMessage]);
      speakVoice(fallbackResponse);
    } finally {
      setIsLoading(false);
      isCurrentlySubmitting.current = false;
    }
  };

  // Start simulation action
  const handleInitiateInterview = async () => {
    // Enforce microphone access first if mode is voice
    if (mode === 'voice') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      } catch (err) {
        console.error("Microphone access is mandatory:", err);
        setApiError(currentProfile.language === 'French' 
          ? "L'autorisation d'accès au microphone est obligatoire pour interagir en mode Voix. Veuillez l'activer dans vos paramètres ou basculer en mode Texte ci-dessous." 
          : "Microphone access is mandatory to interact in Voice Mode. Please authorize microphone access in your browser settings or switch to Text Mode below.");
        return;
      }
    }

    setIsInitialized(true);
    setIsLoading(true);
    setApiError(null);

    // Initialize live monitoring track
    try {
      liveSessionIdRef.current = LiveSessionTracker.startSession(currentUser, currentProfile, 'TRAIN');
    } catch (trackerErr) {
      console.warn("Could not start live tracker session:", trackerErr);
    }

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatHistory: [],
          userInput: '',
          profile: currentProfile,
          blueprint: blueprint,
          cvAnalysis: cvAnalysis,
          history: history,
          surpriseConfig: surpriseConfig,
          conversationState: null // fresh start
        })
      });

      let resJson;
      try {
        resJson = await response.json();
      } catch (err) {
        resJson = {};
      }

      if (!response.ok) {
        throw new Error(resJson.error || 'Simulation endpoint failed to respond.');
      }

      // Preserve updated conversation state
      if (resJson.conversationState) {
        setConversationState(resJson.conversationState);
      }

      const initialQuestion = resJson.response;

      const welcomeMessage: Message = {
        role: 'ai',
        text: initialQuestion,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory([welcomeMessage]);
      speakVoice(initialQuestion);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Server API connection issue. Unable to connect to OpenAI.');
      
      const offlineMsg = currentProfile.language === 'French' 
        ? `Bonjour et bienvenue dans votre session d'entretien pour le poste de ${currentProfile.targetRole}. Pouvez-vous commencer par vous présenter brièvement ?`
        : `Welcome to your simulated interview context for the position of ${currentProfile.targetRole}. Let's begin: Could you briefly walk me through your background and interest in this role?`;
      
      const welcomeMessage: Message = {
        role: 'ai',
        text: offlineMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory([welcomeMessage]);
      speakVoice(offlineMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Answer action
  const handleSubmission = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    await handleAdaptiveAutoSubmit(userInput);
  };

  // Conclude interview session (no scoring, no feedback)
  const handleConcludeSimulation = () => {
    stopVoiceSpeaking();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Save mock telemetry to show progression logging
    const durationMinStr = formatTime(seconds);
    const mockSession = {
      id: Math.random().toString(36).substring(2, 11),
      type: 'TRAIN' as const,
      date: new Date().toLocaleDateString(currentProfile.language === 'English' ? 'en-US' : 'fr-FR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      score: 100, // standard complete flag
      weakness: currentProfile.language === 'English' ? `Live interview simulation of ${durationMinStr} completed successfully.` : `Simulation d'entretien en direct de ${durationMinStr} terminée avec succès.`,
      recommendation: currentProfile.language === 'English' ? "Completed standard professional interview. Keep training your delivery flow." : "Entretien professionnel standard complété. Continuez à vous entraîner.",
      language: currentProfile.language === 'English' ? 'EN' as const : 'FR' as const,
      conversationState: conversationState
    };

    // Save session in History via StorageService
    const existingHistory = StorageService.getHistory(currentUser.id) || [];
    StorageService.saveHistory(currentUser.id, [mockSession, ...existingHistory]);

    // Deduct 1 MIRROR credit upon complete
    StorageService.consumeCandidateCredit(currentUser.id, 'MIRROR');
    window.dispatchEvent(new Event('shana_progress_update'));

    // Breakthrough Check (MODE 5)
    const breakthrough = SerendipityService.checkBreakthrough(currentUser.id, mockSession, existingHistory);
    if (breakthrough) {
      SerendipityService.addDiscovery(currentUser.id, breakthrough.text, 'strength', "Mirror Assessment", 95, breakthrough.explanation, surpriseConfig?.experimentId);
      SerendipityService.triggerNotification(currentUser.id, breakthrough.text);
    }

    // Default Discovery Check (MODE 3)
    const afterDiscovery = SerendipityService.checkAfterSessionDiscovery(currentUser.id, mockSession, existingHistory);
    if (afterDiscovery) {
      SerendipityService.addDiscovery(currentUser.id, afterDiscovery.text, afterDiscovery.category, "Mirror Assessment", 90, afterDiscovery.explanation, surpriseConfig?.experimentId);
      SerendipityService.triggerNotification(currentUser.id, afterDiscovery.text);
    } else if (surpriseConfig) {
      // Fallback only if surprise run
      const text = currentProfile.language === 'English'
        ? `You adapted flawlessly to the ${surpriseConfig.personality.nameEN} recruiter using a ${surpriseConfig.style.nameEN} strategy!`
        : `Vous vous êtes adapté avec succès à la personnalité "${surpriseConfig.personality.nameFR}" sous contrainte de style "${surpriseConfig.style.nameFR}".`;
      const explanation = currentProfile.language === 'English'
        ? `Analyzed from your surprise session under randomized constraints (Format: ${surpriseConfig.format}, Persona: ${surpriseConfig.personality.nameEN}, Style: ${surpriseConfig.style.nameEN}).`
        : `Généré à partir de votre session d'entraînement surprise sous contraintes aléatoires (Format : ${surpriseConfig.format}, Personnalité : ${surpriseConfig.personality.nameFR}, Style : ${surpriseConfig.style.nameFR}).`;
      SerendipityService.addDiscovery(currentUser.id, text, 'strength', "Mirror Assessment", 90, explanation, surpriseConfig?.experimentId);
    }

    // Weekly Insight Check (MODE 4)
    const weekly = SerendipityService.checkWeeklyInsight(currentUser.id, [mockSession, ...existingHistory]);
    if (weekly) {
      SerendipityService.addDiscovery(currentUser.id, weekly.text, 'method', "Mirror Assessment", 90, weekly.explanation);
      SerendipityService.triggerNotification(currentUser.id, weekly.text);
    }

    if (liveSessionIdRef.current) {
      try {
        LiveSessionTracker.completeSession(liveSessionIdRef.current, 'completed');
      } catch (e) {}
    }

    // --- Phase 8: Production Insight Engine Integration governed by InterviewDirector ---
    const directorInsightDecision = InterviewDirector.shouldRunInsightEngine(currentUser.id, [mockSession, ...existingHistory], false);
    
    if (directorInsightDecision.authorized && !directorInsightDecision.hideInsight) {
      setIsGeneratingInsight(true);
      
      const wpm = existingHistory.length > 0 
        ? SerendipityService.getPatternMetrics(currentUser.id, existingHistory).speakingSpeed 
        : 135;

      const insightInput = {
        user_profile: {
          target_role: currentProfile.targetRole || "Candidate",
          experience_level: String(currentProfile.experienceYears || "mid"),
          language: currentProfile.language || "English",
          onboarding_summary: `Target Role is ${currentProfile.targetRole || "Candidate"}.`,
          cv_summary: cvAnalysis?.summary || "No resume uploaded."
        },
        session_state: {
          session_id: `${currentUser.id}_${mockSession.id}`,
          current_state: "completed",
          interview_mode: "TRAIN",
          question_index: 8,
          progress: 100
        },
        ips_history: {
          previous_ips: mockSession.score || 70,
          trend: 'stable' as const,
          recent_strengths: breakthrough ? [breakthrough.text] : [],
          recent_weaknesses: afterDiscovery ? [afterDiscovery.text] : []
        },
        recent_sessions_summary: [mockSession, ...existingHistory].map(h => ({
          sessionId: h.id,
          score: h.score || 70,
          date: h.date || new Date().toLocaleDateString()
        })),
        behavioral_patterns: {
          fillerWordsCount: fillerWordsCount || 0,
          answerDuration: answerSeconds || 0,
          pacingSpeedWpm: wpm
        },
        adaptation_history: {
          worked: [],
          failed: []
        },
        evaluation_history: [mockSession, ...existingHistory].map(h => ({
          clarity: h.score || 70,
          structure: h.score || 70,
          confidence: h.score || 70,
          relevance: h.score || 70,
          conciseness: h.score || 70
        })),
        constraints: {
          max_response_size: 'Exactly ONE clear interview question. Response under 100 words.',
          no_score_generation: true,
          no_memory_creation: true,
          follow_output_schema: true
        }
      };

      ShanaInsightEngine.generateInsight(insightInput)
        .then(res => {
          setIsGeneratingInsight(false);
          if (res && res.insight_category !== 'NO_NEW_INSIGHT') {
            setActiveInsight(res);
            ShanaInsightEngine.logInsightDisplayed(currentUser.id, `${currentUser.id}_${mockSession.id}`, res.title || 'Discovery');
          }
        })
        .catch(err => {
          setIsGeneratingInsight(false);
          console.error("Error generating insight:", err);
        });
    } else {
      console.log(`[SHANA DIRECTOR] Insight Engine execution delayed or disabled: ${directorInsightDecision.delayReason}`);
    }

    setIsFinished(true);
    checkMilestones({ isNewSession: true });
  };

  return (
    <div id="simulation-dashboard" className="max-w-5xl mx-auto py-4 animate-fade-in space-y-6 scanline-overlay text-slate-100">
      
      {/* Simulation Header Menu bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 border border-slate-800 hover:border-violet-500/40 bg-slate-950/60 hover:bg-slate-900 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white"
            id="simulation-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-violet-400 font-extrabold bg-violet-950/40 px-2.5 py-1 rounded border border-violet-800/40">
              SHANA STRESS OS // SIMULATOR ACTIVE
            </span>
            <h1 className="text-xl md:text-2xl font-sans font-black text-white tracking-tight mt-1.5">
              {currentProfile.language === 'English' ? "Live Simulation Mode" : "Simulation d'Entretien Réel"}
            </h1>
          </div>
        </div>

        {isInitialized && !isFinished && (
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-slate-950/80 text-white font-mono text-[11px] font-bold rounded-lg border border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span>TIME: {formatTime(seconds)}</span>
            </div>
            
            <button
              onClick={handleConcludeSimulation}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-lg"
              id="simulation-conclude-btn"
            >
              Conclude
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ===================== SETUP SCREEN ===================== */}
        {!isInitialized && (
          <motion.div
            key="setup-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="cyber-card rounded-[32px] p-6 md:p-10 space-y-8 bg-slate-950/40"
            id="simulation-setup-panel"
          >
            <div className="space-y-2 text-center max-w-2xl mx-auto">
              <div className="w-14 h-14 bg-violet-950/50 text-violet-400 rounded-2xl flex items-center justify-center border border-violet-800/30 mx-auto mb-4 shadow-lg animate-pulse">
                <Cpu className="w-7 h-7" />
              </div>
              <h2 className="font-sans font-black text-2xl text-white tracking-tight">
                {currentProfile.language === 'English' ? "Configure Live Interview Parameters" : "Configurer vos paramètres d'entretien"}
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                {currentProfile.language === 'English' 
                  ? "SHANA maps your target profile metrics automatically. In this phase, the system runs as a strict, direct professional interviewer. No suggestions or coaching will be triggered."
                  : "SHANA initialise automatiquement les paramètres de votre profil. Pendant cette simulation, le système agit uniquement comme un recruteur strict et réaliste. Aucun retour ou note ne sera émis."}
              </p>
            </div>

            {/* Suggested Serendipity Experiment (MODE 1 — BEFORE INTERVIEW) */}
            {beforeSuggestion && (
              <div className="p-5 bg-amber-950/30 border border-amber-500/25 rounded-[24px] flex items-start gap-3 max-w-3xl mx-auto">
                <span className="text-xl">💡</span>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider font-mono block">
                    {currentProfile.language === 'English' ? "SHANA RECOMMENDED EXPERIMENT" : "DÉFI EXCLUSIF SUGGÉRÉ"}
                  </span>
                  <p className="text-xs font-bold text-slate-250 leading-relaxed">
                    {beforeSuggestion}
                  </p>
                  <p className="text-[10px] text-amber-500/70 font-semibold leading-relaxed">
                    {currentProfile.language === 'English' 
                      ? "This adaptive coaching recommendation is triggered based on your historical behavior patterns."
                      : "Ce conseil adaptatif est suggéré selon vos indicateurs comportementaux passés pour briser vos routines."}
                  </p>
                </div>
              </div>
            )}

            {/* Parameter Review Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl">
              <div className="space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-extrabold block">TARGET ROLE</span>
                <span className="text-xs font-bold text-slate-200 block truncate">{currentProfile.targetRole}</span>
              </div>
              <div className="space-y-1 font-sans">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-extrabold block">INDUSTRY MATRIX</span>
                <span className="text-xs font-bold text-slate-200 block truncate">{currentProfile.industry}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-extrabold block">DIFFICULTY GRADE</span>
                <span className="text-xs font-bold text-slate-200 block">{blueprint?.difficulty || "Mid-level"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-extrabold block">LANGUAGE</span>
                <span className="text-xs font-bold text-slate-200 block">
                  {currentProfile.language === 'English' ? "🇬🇧 English" : "🇫🇷 Français"}
                </span>
              </div>
            </div>

            {/* Calibration & Active Mirroring */}
            <div className="space-y-5 max-w-xl mx-auto">
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-violet-400 text-center flex items-center justify-center gap-2">
                <Video className="w-4 h-4 text-violet-400 animate-pulse" />
                <span>
                  {currentProfile.language === 'English' ? "CAMERA MIRROR CALIBRATION" : "CALIBRATION DU MIROIR DE LA CAMÉRA"}
                </span>
              </h3>

              <div id="setup-camera-mirror" className="aspect-video bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
                {cameraError ? (
                  <div className="text-center p-6 space-y-2">
                    <CameraOff className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-400">
                      {currentProfile.language === 'English' 
                        ? "Camera stream offline or unauthorized" 
                        : "Flux caméra hors ligne ou non autorisé"}
                    </p>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
                      {currentProfile.language === 'English' 
                        ? "Ensure camera permissions are allowed in your browser settings to proceed with face-to-camera simulation." 
                        : "Vérifiez que les permissions d'accès à la caméra sont autorisées dans votre navigateur pour une immersion complète."}
                    </p>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-violet-500/20 flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      <span className="text-[9px] font-mono text-white font-extrabold tracking-wider uppercase">
                        {currentProfile.language === 'English' ? "ACTIVE MIRROR CALIBRATION" : "MIROIR DE CALIBRATION ACTIF"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <p className="text-center text-[10px] text-slate-400 leading-relaxed font-semibold max-w-md mx-auto">
                {currentProfile.language === 'English' 
                  ? "✓ Speeches and voice-interactive capability: Speaks recruiter prompts aloud automatically. Responses can be captured via speech dictation." 
                  : "✓ MODE AUDIO ET VISUEL INTERACTIF : Les questions sont énoncées à haute voix. Répondez de vive voix ou par écrit."}
              </p>
            </div>

            {/* Interactive Simulation Mode Selector */}
            <div className="space-y-3 max-w-xl mx-auto border-t border-slate-800/60 pt-5">
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-violet-400 text-center flex items-center justify-center gap-2">
                <span>
                  {currentProfile.language === 'English' ? "CHOOSE INTERVIEW INTERACTION MODE" : "MODE D'INTERACTION SOUHAITÉ"}
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setMode('voice');
                    setApiError(null);
                  }}
                  className={`p-4 rounded-2xl border text-left space-y-2 cursor-pointer transition-all duration-250 ${
                    mode === 'voice'
                      ? 'border-violet-500 bg-violet-950/20 text-white shadow-lg'
                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mic className={`w-4 h-4 ${mode === 'voice' ? 'text-violet-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold tracking-tight">
                      {currentProfile.language === 'English' ? "Voice + Camera Mode" : "Mode Voix + Caméra"}
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-400 font-semibold">
                    {currentProfile.language === 'English'
                      ? "Speaks prompts aloud. Dictation-based spoken answers."
                      : "Questions énoncées de vive voix, réponses dictées au micro."}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('text');
                    setApiError(null);
                  }}
                  className={`p-4 rounded-2xl border text-left space-y-2 cursor-pointer transition-all duration-250 ${
                    mode === 'text'
                      ? 'border-violet-500 bg-violet-950/20 text-white shadow-lg'
                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className={`w-4 h-4 ${mode === 'text' ? 'text-violet-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold tracking-tight">
                      {currentProfile.language === 'English' ? "Text Interactive Mode" : "Mode Écrit + Caméra"}
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-400 font-semibold">
                    {currentProfile.language === 'English'
                      ? "Silent mode. Read prompts and type responses directly."
                      : "Mode silencieux. Lisez les questions et saisissez par écrit."}
                  </p>
                </button>
              </div>
            </div>

            {apiError && (
              <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 text-xs font-semibold text-red-400 flex items-start gap-2 max-w-2xl mx-auto">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Launch CTA gated by credit availability */}
            {!hasMirrorCredits ? (
              <div className="p-4 border-2 border-dashed border-stone-950 bg-stone-50 rounded-2xl space-y-3.5 text-left animate-fade-in mt-4 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] max-w-xl mx-auto" id="simulator-credits-locked-card">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 bg-[#EDC154] border-2 border-stone-950 text-stone-950 rounded-xl flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                    <LockKeyhole className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-mono text-[8px] uppercase tracking-widest bg-stone-900 border-2 border-stone-950 text-stone-100 px-2.5 py-0.5 rounded font-black shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                      {isFrench ? "SIMULATION VERROUILLÉE" : "SIMULATION LOCKED"}
                    </span>
                    <h4 className="text-xs font-black text-stone-950 uppercase mt-1">
                      {isFrench ? "Plus de crédits de simulation miroir" : "Out of prepaid simulation credits"}
                    </h4>
                    <p className="text-[10px] text-stone-600 font-bold leading-relaxed mt-0.5">
                      {isFrench 
                        ? "Veuillez acheter un crédit à l'unité ou souscrire à l'abonnement Ultra Illimité pour démarrer votre simulation."
                        : "To start your formal face-to-camera mock interview, please buy a single mirror credit or subscribe to Ultra Unlimited."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Premium Pack Option (includes 1 Mirror Session) */}
                  <div className="bg-white border-2 border-stone-950 p-3 rounded-xl flex flex-col justify-between text-left shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                    <div>
                      <span className="text-[9px] font-black text-stone-950 block uppercase tracking-wider">{isFrench ? "Pack Premium" : "Premium Pack"}</span>
                      <span className="text-[10px] font-bold text-stone-500 block mt-0.5 leading-relaxed">
                        {isFrench ? "5 Sessions Audio + 1 Évaluation Miroir" : "5 Audio + 1 Mirror Evaluation"}
                      </span>
                    </div>
                    <button
                      type="button"
                      id="simulator-buy-premium-btn"
                      onClick={() => setSelectedProductForCheckout('pack_premium')}
                      className="mt-2.5 w-full py-2 bg-[#18633F] hover:bg-[#1f7c50] text-white font-black text-[9px] uppercase tracking-wider rounded-lg border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)] cursor-pointer text-center"
                    >
                      {isFrench ? "Acheter • 7.99€" : "Buy • 7.99€"}
                    </button>
                  </div>

                  {/* Top Up 1 Mirror Option */}
                  <div className="bg-white border-2 border-stone-950 p-3 rounded-xl flex flex-col justify-between text-left shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                    <div>
                      <span className="text-[9px] font-black text-stone-950 block uppercase tracking-wider">{isFrench ? "Recharge Miroir" : "Single Mirror Top-Up"}</span>
                      <span className="text-[10px] font-bold text-stone-500 block mt-0.5 leading-relaxed">
                        {isFrench ? "+1 Évaluation Miroir" : "+1 Mirror simulation"}
                      </span>
                    </div>
                    <button
                      type="button"
                      id="simulator-buy-topup-btn"
                      onClick={() => setSelectedProductForCheckout('topup_1_mirror')}
                      className="mt-2.5 w-full py-2 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 font-black text-[9px] uppercase tracking-wider rounded-lg border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)] cursor-pointer text-center"
                    >
                      {isFrench ? "Acheter • 2.99€" : "Buy • 2.99€"}
                    </button>
                  </div>
                </div>

                {onNavigateTab && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('purchase')}
                      className="text-[10px] font-mono font-bold text-stone-600 hover:text-stone-900 underline cursor-pointer"
                    >
                      {isFrench ? "Voir toutes les offres de packs" : "View all available packages"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-4 text-center">
                <button
                  onClick={handleInitiateInterview}
                  className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-mono font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer max-w-xs w-full"
                  id="simulation-launch-btn"
                >
                  {currentProfile.language === 'English' ? "Initiate Job Interview" : "Démarrer la Simulation"}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ===================== CHAT SIMULATOR RUNNING ===================== */}
        {isInitialized && !isFinished && (
          <motion.div
            key="running-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            id="simulation-running-panel"
          >
            {/* Visual Progress Indicator for Interview Stages */}
            <div className="lg:col-span-3 cyber-card rounded-3xl p-5 md:px-8 md:py-6 relative overflow-hidden bg-slate-950/40 border border-slate-850">
              {(() => {
                const isEng = currentProfile.language === 'English';
                const answeredCount = chatHistory.filter(m => m.role === 'user').length;
                const activeIndex = Math.min(answeredCount, 5);
                
                const stages = isEng ? [
                  { label: "Intro", title: "Introduction", desc: "Background overview" },
                  { label: "Experience", title: "Target Experience", desc: "Core milestones & past roles" },
                  { label: "Skills", title: "Technical Domain", desc: "Key competencies & tools" },
                  { label: "STAR Round", title: "Behavioral Round", desc: "Challenges, teamwork & focus" },
                  { label: "Strategy", title: "Situational Scenarios", desc: "Strategic vision & fit" },
                  { label: "Wrap-up", title: "Final Closing", desc: "Candidate questions & wrap-up" }
                ] : [
                  { label: "Intro", title: "Présentation", desc: "Parcours et introduction" },
                  { label: "Expérience", title: "Expérience Cible", desc: "Réalisations et jalons clés" },
                  { label: "Compétences", title: "Domaine Technique", desc: "Compétences clés et outils" },
                  { label: "Phase STAR", title: "Phase Comportementale", desc: "Gestion des défis et d'équipe" },
                  { label: "Mise en Situation", title: "Mises en Situation", desc: "Vision stratégique et cas" },
                  { label: "Synthèse", title: "Conclusion Finale", desc: "Synthèse et questions" }
                ];

                return (
                  <div className="space-y-4">
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                        <h3 className="font-mono text-[9px] font-extrabold uppercase tracking-widest text-violet-300">
                          {isEng ? "SYSTEM: STRESS TESTING PROCESS INITIATED" : "SYSTEME : PROCESSUS DE SIMULATION LANCE"}
                        </h3>
                      </div>
                      <div className="text-[10px] font-mono font-black text-violet-400">
                        {isEng ? `STAGE: ${activeIndex + 1}/6 // NODE: ${stages[activeIndex].title.toUpperCase()}` : `ÉTAPE : ${activeIndex + 1}/6 // MODULE : ${stages[activeIndex].title.toUpperCase()}`}
                      </div>
                    </div>

                    {/* Desktop Horizontal Progress Tracker */}
                    <div className="relative mt-2">
                      {/* Connecting Line background */}
                      <div className="absolute top-[20px] left-[5%] right-[5%] h-[2px] bg-slate-850 z-0 hidden sm:block rounded-full" />
                      {/* Active Fill connector */}
                      <div 
                        className="absolute top-[20px] left-[5%] h-[2px] bg-violet-500 z-0 transition-all duration-500 hidden sm:block rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                        style={{ width: `${(activeIndex / 5) * 90}%` }}
                      />

                      {/* Flex Stages */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10 gap-4 sm:gap-0">
                        {stages.map((stage, idx) => {
                          const isCompleted = idx < activeIndex;
                          const isActive = idx === activeIndex;

                          return (
                            <div key={idx} className="flex sm:flex-col items-center sm:text-center flex-1 w-full gap-3.5 sm:gap-0 select-none">
                              {/* Circle node representation */}
                              <div className="relative flex items-center justify-center">
                                {isCompleted ? (
                                  <div className="w-[34px] h-[34px] rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center justify-center shadow-md transition-colors duration-300">
                                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                  </div>
                                ) : isActive ? (
                                  <div className="w-[34px] h-[34px] rounded-full bg-violet-600 text-white border-2 border-violet-400 flex items-center justify-center font-mono font-black text-xs shadow-lg animate-pulse shadow-violet-500/30">
                                    {idx + 1}
                                  </div>
                                ) : (
                                  <div className="w-[34px] h-[34px] rounded-full bg-slate-950 text-slate-500 border border-slate-800 flex items-center justify-center font-mono font-semibold text-xs animate-fade-in">
                                    {idx + 1}
                                  </div>
                                )}
                              </div>

                              {/* Stage labels details */}
                              <div className="flex flex-col sm:items-center text-left sm:text-center mt-0 sm:mt-2.5">
                                <span className={`font-sans text-[11px] font-black tracking-tight ${
                                  isCompleted ? 'text-emerald-400' : isActive ? 'text-violet-300' : 'text-slate-500'
                                }`}>
                                  {stage.title}
                                </span>
                                <span className="text-[9px] text-slate-500 font-semibold max-w-[130px] hidden md:block mt-0.5 leading-tight">
                                  {stage.desc}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Left pane - Interactive Conversation Console */}
            <div className="lg:col-span-2 cyber-card rounded-3xl flex flex-col overflow-hidden h-[540px] bg-slate-950/40 border border-slate-850">
              
              {/* Active Header indicator */}
              <div className="bg-slate-900/30 border-b border-slate-850 p-4 shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-violet-400 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block font-black leading-none">SYSTEM TRANSMISSION MODE</span>
                    <span className="text-[10px] font-bold text-white font-sans block leading-none">SHANA AI agent screening active</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Speech synthesis speaker mute/unmute control */}
                  <button
                    onClick={() => {
                      const newMute = !isMuted;
                      setIsMuted(newMute);
                      if (newMute) stopVoiceSpeaking();
                    }}
                    className={`p-2 border rounded-lg transition-all cursor-pointer ${
                      isMuted ? 'border-red-800 bg-red-950/30 text-red-400' : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-900'
                    }`}
                    title={isMuted ? "Unmute Spoken Questions" : "Mute Spoken Questions"}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  <span className="font-mono text-[9px] uppercase tracking-wider text-violet-400 border border-violet-800/40 rounded px-1.5 py-0.5 select-none font-bold">
                    {mode === 'voice' ? "VOICE MODE" : "TEXT MODE"}
                  </span>
                </div>
              </div>

              {/* Live coaching hint (MODE 2 — DURING INTERVIEW) */}
              <AnimatePresence>
                {liveHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-amber-950/30 border-b border-amber-500/20"
                  >
                    <div className="p-3 flex items-center gap-2.5 max-w-xl mx-auto">
                      <span className="text-base shrink-0">💡</span>
                      <div className="text-left">
                        <span className="text-[8px] font-mono font-extrabold text-amber-400 uppercase tracking-wider block">
                          {currentProfile.language === 'French' ? "MICRO-CONSEIL SHANA" : "SHANA LIVE NUDGE"}
                        </span>
                        <p className="text-[10px] font-bold text-amber-200 mt-0.5 leading-snug">
                          {liveHint}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat timeline feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scroller" id="simulation-messages-container">
                {chatHistory.map((msg, idx) => {
                  const isAi = msg.role === 'ai';
                  return (
                    <div 
                      key={idx} 
                      className={`flex gap-3 max-w-[85%] ${isAi ? '' : 'ml-auto flex-row-reverse'}`}
                    >
                      {/* Avatar design */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border select-none ${
                        isAi ? 'bg-violet-950 border-violet-800/30 text-violet-400' : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}>
                        {isAi ? <Cpu className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      {/* Msg bubble container */}
                      <div className={`space-y-1 ${isAi ? '' : 'text-right'}`}>
                        <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans ${
                          isAi 
                            ? 'bg-slate-900/30 text-slate-100 border border-slate-800/60 shadow-inner' 
                            : 'bg-violet-600 text-white text-left font-semibold shadow-md shadow-violet-950/20'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <span className="text-[8px] font-mono text-slate-500 block px-1">
                          {isAi ? "INTERVIEWER" : "YOU"} • {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-xl bg-violet-950 border border-violet-800/30 text-violet-400 flex items-center justify-center shrink-0 animate-pulse">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                      <span className="text-xs text-slate-400 font-mono tracking-wide font-semibold">INTERVIEWER IS PROCESSING ANSWER...</span>
                    </div>
                  </div>
                )}

                {apiError && (
                  <div className="bg-red-950/20 border border-red-800/30 rounded-2xl p-4 text-xs font-semibold text-red-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{apiError}</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input Action Center */}
              <div className="p-4 border-t border-slate-850 shrink-0 bg-slate-900/20">
                
                {mode === 'voice' ? (
                  /* ================ Voice Response Interface ================ */
                  <div className="space-y-3.5 text-center p-3">
                    <div className="flex justify-center items-center gap-4">
                      {/* Big interactive pulsing mic key */}
                      <button
                        onClick={toggleListening}
                        className={`w-14 h-14 rounded-full flex items-center justify-center border shadow-lg transition-all duration-300 relative cursor-pointer active:scale-95 ${
                          isListening 
                            ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-red-950/20' 
                            : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                        }`}
                        id="simulation-mic-toggle-btn"
                        title={isListening ? "Stop listening and edit" : "Start speaking response"}
                      >
                        {isListening ? (
                          <div className="absolute inset-0 w-full h-full rounded-full border-4 border-red-300 animate-ping opacity-30" />
                        ) : null}
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>

                      {/* Standard text submission if they spoke and want to pass */}
                      {userInput.trim().length > 0 && !isListening && (
                        <button
                          onClick={() => handleSubmission()}
                          className="p-3 bg-violet-600 hover:bg-violet-500 text-white rounded-full transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center"
                          title="Submit response"
                          id="submit-voice-captured-btn"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                        {isListening ? "Microphone active — speak now" : "Click mic to dictate your response"}
                      </p>
                      
                      {userInput.trim().length > 0 && (
                        <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-300 italic max-h-20 overflow-y-auto text-left max-w-xl mx-auto font-medium">
                          <span className="font-mono text-[8px] font-bold uppercase text-violet-400 block not-italic select-none mb-1">REAL-TIME SPEECH DICTATION FEED:</span>
                          "{userInput}"
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ================ Standard Keyboard Input Interface ================ */
                  <form onSubmit={handleSubmission} className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="flex-1 bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-xs outline-none focus:border-violet-500 text-slate-200 font-semibold"
                      placeholder={currentProfile.language === 'English' ? "Type your interview response..." : "Saisissez votre réponse..."}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      disabled={isLoading}
                      id="simulation-text-input"
                    />

                    <button
                      type="submit"
                      disabled={isLoading || !userInput.trim()}
                      className="p-3.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-900 disabled:text-slate-600 text-white rounded-xl transition-all shadow-md active:scale-95 cursor-pointer max-w-sm font-bold text-xs"
                      id="simulation-text-submit-btn"
                    >
                      <Send className="w-4.5 h-4.5" />
                    </button>
                  </form>
                )}

              </div>
            </div>

            {/* Right Pane - Interview Checklist & Telemetry Specs */}
            <div className="space-y-6 animate-fade-in">
              
              {/* Live Candidate Mirror Feed */}
              <div className="bg-slate-950 border border-slate-850 rounded-3xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between aspect-video shadow-md">
                {cameraError ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
                    <CameraOff className="w-8 h-8 text-slate-600 mb-1" />
                    <span className="text-[10px] font-semibold text-slate-500">
                      {currentProfile.language === 'English' ? "Camera Feed Offline" : "Flux de caméra hors ligne"}
                    </span>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-violet-500/20 flex items-center gap-1.5 shadow">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      <span className="text-[8px] font-mono font-extrabold text-white tracking-widest uppercase">
                        {currentProfile.language === 'English' ? "LIVE ASSESS MIRROR" : "MIROIR ÉVALUATION DIRECTE"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Question Pacing & Duration Assistant Board */}
              <div className="cyber-card p-5 space-y-4 rounded-3xl bg-slate-950/40 border border-slate-850">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-2">
                    <Timer className={`w-4 h-4 ${isTimerPaused ? 'text-slate-500' : 'text-violet-400 animate-pulse'}`} />
                    <span className="font-mono text-[9px] font-black uppercase tracking-widest text-violet-300">
                      {currentProfile.language === 'English' ? "RESPONSE PACING ASSISTANT" : "CADENCE DE RÉPONSE"}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[60, 90, 120, 180].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setQuestionTimeLimit(t);
                          setQuestionSecondsLeft(t);
                        }}
                        className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                          questionTimeLimit === t
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
                        }`}
                        title={`Set recommended answer time to ${t}s`}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  {/* Big visual countdown status dial */}
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono transition-all duration-300 relative overflow-hidden text-center shadow-lg border ${
                        questionSecondsLeft === 0
                          ? 'bg-red-950/40 text-red-400 border-red-900/40'
                          : questionSecondsLeft <= 15
                            ? 'bg-red-600 text-white border-red-400 font-bold'
                            : questionSecondsLeft <= 30
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                              : 'bg-emerald-600 text-white border-emerald-500'
                      }`}
                    >
                      <span className="text-lg font-black leading-none">{questionSecondsLeft}</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider opacity-80 leading-none mt-1">
                        SEC
                      </span>
                    </div>

                    <div className="space-y-0.5 animate-fade-in text-left">
                      <span className="text-[9px] font-mono font-extrabold uppercase tracking-wide text-slate-500 block leading-none">
                        {isLoading 
                          ? (currentProfile.language === 'English' ? "WAITING FOR RECRUITER" : "RECRUTEUR EN REFLEXION")
                          : isTimerPaused 
                            ? (currentProfile.language === 'English' ? "TIMER PAUSED" : "TIMER EN PAUSE")
                            : (currentProfile.language === 'English' ? "PACING WINDOW" : "FENÊTRE DE CADENCE")}
                      </span>
                      <span className="text-xs font-bold text-slate-200 font-sans block leading-tight">
                        {isLoading ? (
                          currentProfile.language === 'English' ? "Processing answers" : "En cours de traitement"
                        ) : isTimerPaused ? (
                          currentProfile.language === 'English' ? "Press Play to resume" : "Lecture pour reprendre"
                        ) : questionSecondsLeft === 0 ? (
                          currentProfile.language === 'English' ? "Time reached! Auto-transmitting..." : "Temps écoulé ! Envoi..."
                        ) : questionSecondsLeft <= 15 ? (
                          currentProfile.language === 'English' ? "Conclude response now!" : "Concluez vite !"
                        ) : questionSecondsLeft <= 30 ? (
                          currentProfile.language === 'English' ? "Recommended wrapping phase" : "Recommandation de synthèse"
                        ) : (
                          currentProfile.language === 'English' ? "Structuring introduction" : "Structuration active"
                        )}
                      </span>
                      <p className="text-[9px] text-slate-500 font-medium leading-none">
                        {currentProfile.language === 'English' 
                          ? `Format: ${questionTimeLimit}s limit` 
                          : `Format: Limite ${questionTimeLimit}s`}
                      </p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 shrink-0">
                    {/* Add +30s */}
                    {!isLoading && (
                      <button
                        onClick={() => setQuestionSecondsLeft(prev => Math.min(prev + 30, 240))}
                        className="p-2 border border-slate-850 hover:border-violet-500/30 hover:bg-slate-900 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-[10px] font-bold text-slate-300"
                        title="Extend 30 seconds"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+30s</span>
                      </button>
                    )}

                    {/* Pause / Resume */}
                    {!isLoading && (
                      <button
                        onClick={() => setIsTimerPaused(!isTimerPaused)}
                        className={`p-2 border rounded-xl transition-all cursor-pointer ${
                          isTimerPaused 
                            ? 'border-emerald-800 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30' 
                            : 'border-slate-850 hover:border-violet-500/30 text-slate-300 hover:bg-slate-900'
                        }`}
                        title={isTimerPaused ? "Resume pacing countdown" : "Pause countdown"}
                      >
                        {isTimerPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar visual aid */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full transition-all duration-1000 rounded-full ${
                      questionSecondsLeft <= 15
                        ? 'bg-red-500 animate-pulse'
                        : questionSecondsLeft <= 30
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (questionSecondsLeft / questionTimeLimit) * 100)}%` }}
                  />
                </div>
              </div>

              {/* SHANA Human Presence Engine (HIU Phase 11) - Highly Expressive Recruiter Card */}
              <div className="cyber-card p-6 bg-slate-950/40 border border-slate-850 shadow-xl flex flex-col items-center text-center relative overflow-hidden rounded-3xl w-full">
                {/* Radial glow background aligned with active state & human warmth overlay */}
                <div className={`absolute -inset-10 opacity-30 blur-2xl transition-all duration-1000 pointer-events-none rounded-full ${
                  isLoading 
                    ? 'bg-amber-500/20' 
                    : isPlayingVoice 
                      ? 'bg-emerald-500/20' 
                      : isListening 
                        ? (presenceState.behavior === 'smiling' ? 'bg-pink-500/25' : 'bg-cyan-500/20')
                        : 'bg-violet-500/10'
                }`} />

                {/* Presence State Subtle HUD Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-800/80 text-[8px] font-mono font-black text-violet-400 uppercase tracking-widest">
                  <span className="w-1 h-1 rounded-full bg-violet-400 animate-ping" />
                  <span>HIU PRESENCE v11.0</span>
                </div>

                {/* Recruiter Presence Ring & Orb */}
                <div className="relative w-28 h-28 flex items-center justify-center mb-2 mt-2">
                  {/* Floating Backchannel Speech Bubble */}
                  <AnimatePresence>
                    {presenceState.behavior === 'backchannel' && presenceState.backchannelWord && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0, y: 10, x: 20 }}
                        animate={{ scale: 1, opacity: 1, y: -45, x: 35 }}
                        exit={{ scale: 0, opacity: 0, y: 5, x: 10 }}
                        className="absolute z-30 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-mono font-extrabold text-[10px] px-2.5 py-1 rounded-2xl rounded-bl-none shadow-[0_4px_12px_rgba(139,92,246,0.3)] border border-violet-400/30 shrink-0"
                      >
                        {presenceState.backchannelWord}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Concentric glowing pulse rings */}
                  <motion.div
                    animate={isLoading ? { scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] } : 
                             isPlayingVoice ? { scale: [1, 1.25, 0.95, 1.1, 1], opacity: [0.4, 0.8, 0.4] } :
                             isListening ? { scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] } :
                             { scale: [1, 1.02, 1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ repeat: Infinity, duration: isLoading ? 2 : isPlayingVoice ? 1.2 : isListening ? 1.8 : 4, ease: "easeInOut" }}
                    className={`absolute inset-0 rounded-full border transition-all duration-1000 ${
                      isLoading 
                        ? 'border-amber-500/30 bg-amber-500/5' 
                        : isPlayingVoice 
                          ? 'border-emerald-500/30 bg-emerald-500/5' 
                          : isListening 
                            ? (presenceState.behavior === 'smiling' ? 'border-pink-500/40 bg-pink-500/5' : 'border-cyan-500/30 bg-cyan-500/5')
                            : 'border-violet-500/10 bg-violet-500/2'
                    }`}
                  />
                  
                  {/* Main animated head-tilt and nod presence simulation block */}
                  <motion.div
                    animate={
                      presenceState.behavior === 'nodding'
                        ? { y: [0, -4, 2, -2, 0], scale: [1, 1.03, 0.99, 1.01, 1] }
                        : presenceState.behavior === 'note-taking'
                        ? { rotate: [0, 1.5, -1, 1, 0], y: [0, 2, 0, 1, 0] }
                        : presenceState.behavior === 'looking-up'
                        ? { y: [0, -3, -3, 0], scale: [1, 1.02, 1] }
                        : presenceState.behavior === 'smiling'
                        ? { scale: [1, 1.05, 1.02, 1.04, 1] }
                        : isLoading ? { scale: [1, 1.08, 1] } 
                        : isPlayingVoice ? { scale: [1, 1.18, 0.98, 1.08, 1] } 
                        : isListening ? { scale: [1, 1.05, 1] } 
                        : { scale: [1, 1.01, 1] }
                    }
                    transition={
                      presenceState.behavior === 'nodding'
                        ? { duration: 1.5, repeat: Infinity, repeatDelay: 1 }
                        : presenceState.behavior === 'note-taking'
                        ? { duration: 2, repeat: Infinity }
                        : { repeat: Infinity, duration: isLoading ? 1.5 : isPlayingVoice ? 1 : isListening ? 1.5 : 3, ease: "easeInOut" }
                    }
                    className={`absolute w-20 h-20 rounded-full border transition-all duration-1000 ${
                      isLoading 
                        ? 'border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                        : isPlayingVoice 
                          ? 'border-emerald-400/40 shadow-[0_0_25px_rgba(16,185,129,0.25)]' 
                          : isListening 
                            ? (presenceState.behavior === 'smiling' ? 'border-pink-400/50 shadow-[0_0_25px_rgba(244,63,94,0.3)]' : 'border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]')
                            : 'border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.1)]'
                    }`}
                  />

                  {/* The Core Glass Orb */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center relative z-10 backdrop-blur-md border shadow-lg transition-all duration-1000 ${
                    isLoading 
                      ? 'bg-amber-500/10 border-amber-400/50 text-amber-400' 
                      : isPlayingVoice 
                        ? 'bg-emerald-500/10 border-emerald-400/50 text-emerald-400' 
                        : isListening 
                          ? (presenceState.behavior === 'smiling' ? 'bg-pink-500/15 border-pink-400/60 text-pink-400' : 'bg-cyan-500/10 border-cyan-400/50 text-cyan-400')
                          : 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
                  }`}>
                    {/* Icon based on state */}
                    <AnimatePresence mode="wait">
                      {presenceState.behavior === 'note-taking' ? (
                        <motion.div key="writing" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center justify-center">
                          <span className="text-[10px] animate-pulse">✍️</span>
                        </motion.div>
                      ) : presenceState.behavior === 'smiling' ? (
                        <motion.div key="smiling" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="text-pink-400">
                          <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
                        </motion.div>
                      ) : presenceState.behavior === 'looking-up' ? (
                        <motion.div key="looking-up" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: -2 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                          <Brain className="w-5 h-5 text-amber-400 animate-pulse" />
                        </motion.div>
                      ) : isLoading ? (
                        <motion.div key="thinking" initial={{ opacity: 0, rotate: -45 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                          <Cpu className="w-5 h-5 animate-pulse" />
                        </motion.div>
                      ) : isPlayingVoice ? (
                        <motion.div key="speaking" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                          <Volume2 className="w-5 h-5" />
                        </motion.div>
                      ) : isListening ? (
                        <motion.div key="listening" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                          <Mic className="w-5 h-5 text-cyan-400" />
                        </motion.div>
                      ) : (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Recruiter state labeling */}
                <div className="space-y-1.5 text-center w-full z-10">
                  <h4 className="text-xs font-mono font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5">
                    {isLoading && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                    {isPlayingVoice && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    {isListening && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                    {!isLoading && !isPlayingVoice && !isListening && <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                    
                    {isLoading 
                      ? (currentProfile.language === 'English' ? "Recruiter is Thinking" : "Le recruteur réfléchit")
                      : isPlayingVoice 
                        ? (currentProfile.language === 'English' ? "Recruiter is Speaking" : "Le recruteur s'exprime")
                        : isListening 
                          ? (currentProfile.language === 'English' ? "Listening to Your Voice" : "Détection de votre voix")
                          : (currentProfile.language === 'English' ? "Interviewer Waiting" : "En attente")}
                  </h4>
                  
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto font-semibold leading-relaxed">
                    {isLoading 
                      ? (currentProfile.language === 'English' ? "Calibrating context-driven questions and active learning memory..." : "Calibrage des questions et traitement de la mémoire en cours...")
                      : isPlayingVoice 
                        ? (currentProfile.language === 'English' ? "The interviewer is sharing questions and feedback dynamically." : "Synthèse vocale adaptative en cours.")
                        : isListening 
                          ? (currentProfile.language === 'English' ? "Listening actively. Speak naturally. Your response is recorded." : "Parlez naturellement. Votre réponse est en cours de traitement.")
                          : (currentProfile.language === 'English' ? "Press the mic below or click to start speaking when ready." : "Appuyez sur le micro ci-dessous pour parler.")}
                  </p>

                  {/* Micro-Behavior Feed HUD */}
                  <div className="mt-3.5 pt-3 border-t border-slate-900/60 w-full flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono font-extrabold uppercase tracking-widest text-violet-400">
                      <span>{currentProfile.language === 'English' ? "Active Micro-Behavior:" : "Micro-comportement actif :"}</span>
                      <span className="px-1.5 py-0.5 rounded bg-violet-950/80 border border-violet-900/40 text-white flex items-center gap-1 font-bold">
                        {presenceState.behavior === 'idle' && (currentProfile.language === 'English' ? "Idle breathing" : "Respiration calme")}
                        {presenceState.behavior === 'blinking' && (currentProfile.language === 'English' ? "Blinking / Shift" : "Mise au point")}
                        {presenceState.behavior === 'nodding' && (currentProfile.language === 'English' ? "Nodding along" : "Hochements")}
                        {presenceState.behavior === 'note-taking' && (currentProfile.language === 'English' ? "Taking brief notes" : "Prise de notes")}
                        {presenceState.behavior === 'smiling' && (currentProfile.language === 'English' ? "Slightly smiling" : "Sourire discret")}
                        {presenceState.behavior === 'looking-up' && (currentProfile.language === 'English' ? "Thoughtful reflection" : "Réflexion")}
                        {presenceState.behavior === 'pausing' && (currentProfile.language === 'English' ? "Pacing pause" : "Temporisation")}
                        {presenceState.behavior === 'backchannel' && (currentProfile.language === 'English' ? "Backchannel" : "Interjection")}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-semibold italic max-w-xs text-center px-2">
                      "{currentProfile.language === 'English' ? presenceState.subtextEN : presenceState.subtextFR}"
                    </div>

                    {/* Miniature presence engine control panel / meters */}
                    <div className="grid grid-cols-3 gap-2 w-full mt-2 bg-slate-950/60 p-2 rounded-xl border border-slate-900/40">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[7px] font-mono uppercase text-slate-500 font-extrabold tracking-widest">{currentProfile.language === 'English' ? "Attention" : "Attention"}</span>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden relative">
                          <div 
                            className="h-full bg-cyan-400 transition-all duration-1000" 
                            style={{ width: isListening ? '95%' : isPlayingVoice ? '80%' : '60%' }} 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[7px] font-mono uppercase text-slate-500 font-extrabold tracking-widest">{currentProfile.language === 'English' ? "Empathy" : "Empathie"}</span>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden relative">
                          <div 
                            className="h-full bg-pink-500 transition-all duration-1000" 
                            style={{ width: presenceState.behavior === 'smiling' ? '98%' : isListening ? '85%' : '75%' }} 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[7px] font-mono uppercase text-slate-500 font-extrabold tracking-widest">{currentProfile.language === 'English' ? "Note density" : "Notes"}</span>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden relative">
                          <div 
                            className="h-full bg-violet-400 transition-all duration-1000 animate-pulse" 
                            style={{ width: presenceState.behavior === 'note-taking' ? '90%' : isListening ? '40%' : '15%' }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SHANA Real-time Recruiter Intelligence Center (Phase 22.1) */}
              <ShanaIntelligenceCenter 
                conversationState={conversationState}
                language={currentProfile.language}
              />

              {/* Strict protocols list (No scoring / Coaching) */}
              <div className="cyber-card p-5 space-y-4 rounded-3xl bg-slate-950/40 border border-slate-850 text-left">
                <h4 className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-slate-500">
                  {currentProfile.language === 'English' ? "SIMULATOR RULES REPORT" : "PROTOCOLE DE COMPORTEMENT"}
                </h4>

                <div className="space-y-3 font-semibold">
                  <div className="flex gap-2.5 items-start text-xs text-slate-300">
                    <Check className="w-4 object-contain text-emerald-400 shrink-0 mt-0.5 stroke-[3]" />
                    <span>{currentProfile.language === 'English' ? "Active Voice Telemetry Mode is running" : "Mode de télémétrie vocale actif"}</span>
                  </div>
                  <div className="flex gap-2.5 items-start text-xs text-slate-300 border-t border-slate-800/40 pt-2">
                    <Check className="w-4 object-contain text-emerald-400 shrink-0 mt-0.5 stroke-[3]" />
                    <span>{currentProfile.language === 'English' ? "Direct video-camera mirroring active" : "Retour miroir de la caméra actif"}</span>
                  </div>
                  <div className="flex gap-2.5 items-start text-xs text-slate-500 border-t border-slate-800/40 pt-2 italic">
                    <Check className="w-4 object-contain text-slate-500 shrink-0 mt-0.5 stroke-[3]" />
                    <span>{currentProfile.language === 'English' ? "COACHING DISABLED (Objective screening)" : "CONSEILS DÉSACTIVÉS (Évaluation pure)"}</span>
                  </div>
                  <div className="flex gap-2.5 items-start text-xs text-slate-500 border-t border-slate-800/40 pt-2 italic">
                    <Check className="w-4 object-contain text-slate-500 shrink-0 mt-0.5 stroke-[3]" />
                    <span>{currentProfile.language === 'English' ? "EVALUATION SCORING HELD (Until session end)" : "NOTE DE PERFORMANCE RETENUE (Jusqu'à la fin)"}</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ===================== CONCLUSION SCREEN ===================== */}
        {isFinished && (
          <motion.div
            key="conclusion-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="cyber-card rounded-[32px] p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto bg-slate-950/40 border border-slate-850"
            id="simulation-completed-panel"
          >
            <div className="w-16 h-16 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-800/40 shadow-inner">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="font-sans font-black text-2xl text-white tracking-tight">
                {currentProfile.language === 'English' ? "Interview Concluded Successfully" : "Entretien Terminé avec Succès"}
              </h2>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-md mx-auto">
                {currentProfile.language === 'English'
                  ? `Your standard ${formatTime(seconds)} interview session was executed. In compliance with active phase specifications, coaching feedback prompts were strictly muted to reflect actual live-test pressure.`
                  : `Votre entretien d'embauche de ${formatTime(seconds)} a été mené à terme. En conformité avec les spécifications de phase actives, aucun conseil ou score intermédiaire n'a été fourni afin de reproduire la pression réelle.`}
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl w-full max-w-sm text-center">
              <span className="text-[9px] font-mono uppercase text-slate-500 block font-extrabold">SESSION TELEMETRY LOGGED</span>
              <p className="text-xs font-bold text-slate-200 mt-1">
                Type: Live Simulation (Phase 4)
              </p>
              <p className="text-xs font-bold text-slate-400 mt-0.5 font-mono">
                Duration: {formatTime(seconds)}
              </p>
            </div>

            {/* Phase 22.1 — Layer 5 Recruiter Decision Card */}
            {conversationState?.recruiterDecision && (
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl w-full max-w-lg text-left space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-violet-400 animate-pulse" />
                    <span className="text-[10px] font-mono uppercase text-slate-300 font-extrabold">
                      {currentProfile.language === 'English' ? "RECRUITER HIRING DECISION" : "DÉCISION DE RECRUTEMENT SHANA"}
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-black uppercase px-2.5 py-0.5 rounded ${
                    conversationState.recruiterDecision.recommendation === 'Strong Hire' || conversationState.recruiterDecision.recommendation === 'Hire'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                      : conversationState.recruiterDecision.recommendation === 'No Hire'
                        ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                  }`}>
                    {conversationState.recruiterDecision.recommendation}
                  </span>
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono uppercase text-slate-500 font-extrabold block">
                      {currentProfile.language === 'English' ? "CORE RECOMMENDATION JUSTIFICATION" : "JUSTIFICATION PRINCIPALE"}
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300 font-semibold">
                      {conversationState.recruiterDecision.reasons.map((r: string, idx: number) => (
                        <li key={idx} className="font-medium text-slate-250">{r}</li>
                      ))}
                    </ul>
                  </div>

                  {conversationState.recruiterDecision.weaknesses?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono uppercase text-slate-500 font-extrabold block">
                        {currentProfile.language === 'English' ? "IDENTIFIED GAPS & DEVELOPMENT AREAS" : "LIMITES & AXES DE DÉVELOPPEMENT"}
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400">
                        {conversationState.recruiterDecision.weaknesses.map((w: string, idx: number) => (
                          <li key={idx} className="font-normal text-slate-400">{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- Phase 8: Production Insight Engine Display --- */}
            {isGeneratingInsight && (
              <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-3xl w-full max-w-lg text-center animate-pulse flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-extrabold">
                  {currentProfile.language === 'English' ? "SHANA ANALYSIS: DISCOVERING PATTERNS..." : "ANALYSE SHANA : DÉCOUVERTE DE COMPORTEMENTS..."}
                </span>
              </div>
            )}

            {activeInsight && activeInsight.insight_category !== 'NO_NEW_INSIGHT' && (
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white border border-slate-800 shadow-2xl rounded-[24px] p-6 text-left max-w-lg w-full relative overflow-hidden animate-fade-in space-y-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-violet-300 font-extrabold">
                      {currentProfile.language === 'English' ? `SHANA BEHAVIORAL DISCOVERY` : `DÉCOUVERTE SHANA`}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-violet-950 border border-violet-800 text-violet-300 font-bold">
                    {activeInsight.insight_category}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                    {activeInsight.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {activeInsight.insight}
                  </p>
                </div>

                {activeInsight.supporting_evidence && (
                  <div className="bg-slate-900/50 border border-slate-850 p-3 rounded-xl space-y-1">
                    <span className="text-[8px] font-mono uppercase text-slate-500 font-bold block">
                      {currentProfile.language === 'English' ? "SUPPORTING EVIDENCE" : "ÉLÉMENTS DE PREUVE"}
                    </span>
                    <p className="text-[11px] text-slate-450 italic leading-relaxed">
                      "{activeInsight.supporting_evidence}"
                    </p>
                  </div>
                )}

                {activeInsight.recommended_focus && (
                  <div className="flex items-start gap-2 pt-1">
                    <div className="w-4 h-4 rounded-full bg-indigo-950 border border-indigo-800/40 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[9px] font-mono uppercase text-indigo-300 font-bold block">
                        {currentProfile.language === 'English' ? "RECOMMENDED FOCUS" : "FOCUS RECOMMANDÉ"}
                      </span>
                      <p className="text-[11px] text-slate-300 font-semibold">
                        {activeInsight.recommended_focus}
                      </p>
                    </div>
                  </div>
                )}

                {/* Dismiss control */}
                <div className="flex justify-end pt-2 border-t border-slate-850">
                  <button
                    onClick={() => {
                      ShanaInsightEngine.logInsightDismissed(currentUser.id, `${currentUser.id}_${activeInsight.title}`, activeInsight.title || '');
                      setActiveInsight(null);
                    }}
                    className="text-[10px] font-mono uppercase text-slate-400 hover:text-white transition-colors cursor-pointer font-extrabold"
                  >
                    {currentProfile.language === 'English' ? "DISMISS DISCOVERY ×" : "IGNORER ×"}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={onBack}
              className="px-8 py-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-mono font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer max-w-xs w-full"
              id="simulation-return-btn"
            >
              {currentProfile.language === 'English' ? "Return to Dashboard" : "Retourner au Tableau de Bord"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal Overlay */}
      {selectedProductForCheckout && (
        <CheckoutModal
          productId={selectedProductForCheckout}
          userId={currentUser.id}
          lang={isFrench ? 'FR' : 'EN'}
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
