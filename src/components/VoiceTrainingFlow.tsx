import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Check, 
  Loader2, 
  Play, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Pause,
  ChevronRight,
  Flame,
  Award,
  Sparkles,
  Wallet,
  Coins,
  LockKeyhole
} from 'lucide-react';
import { User as UserType, Profile as ProfileType, InterviewBlueprint } from '../types';
import { StorageService } from '../lib/storage';
import { InterviewVoiceManager } from '../lib/InterviewVoiceManager';
import CheckoutModal from './CheckoutModal';
import { SerendipityService } from '../lib/serendipity';
import { TurnDetector } from '../lib/conversation/conversationDirector';

interface VoiceTrainingFlowProps {
  currentUser: UserType;
  currentProfile: ProfileType;
  blueprint: InterviewBlueprint | null;
  onBack: () => void;
  onSessionSaved: () => void;
  surpriseConfig?: any;
}

interface Message {
  role: 'ai' | 'user';
  text: string;
}

export default function VoiceTrainingFlow({ 
  currentUser, 
  currentProfile, 
  blueprint, 
  onBack,
  onSessionSaved,
  surpriseConfig
}: VoiceTrainingFlowProps) {
  
  // High-level steps: 'start' | 'active' | 'review'
  const [step, setStep] = useState<'start' | 'active' | 'review'>('start');

  // Candidate Monetization & Checkout States
  const [monetization, setMonetization] = useState(() => StorageService.getCandidateMonetization(currentUser.id));
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<string | null>(null);

  useEffect(() => {
    const handleProgressUpdate = () => {
      setMonetization(StorageService.getCandidateMonetization(currentUser.id));
    };
    window.addEventListener('shana_progress_update', handleProgressUpdate);
    return () => {
      window.removeEventListener('shana_progress_update', handleProgressUpdate);
    };
  }, [currentUser.id]);

  const hasAudioCredits = monetization.ultraActive || (monetization.freeAudio + monetization.packAudio + monetization.topUpAudio) > 0;
  
  // Speech volume or mute state
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Dialogue states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1);
  const totalQuestions = 5;
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Timer for session duration tracking
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef<any>(null);

  // Session resume states
  const [hasResumeableSession, setHasResumeableSession] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);

  // Before Session Serendipity Suggestion
  const [beforeSuggestion, setBeforeSuggestion] = useState<string | null>(null);

  // Live Serendipity tracking states (MODE 2)
  const [interruptionCount, setInterruptionCount] = useState(0);
  const [fillerWordsCount, setFillerWordsCount] = useState(0);
  const [hesitationSeconds, setHesitationSeconds] = useState(0);
  const [answerSeconds, setAnswerSeconds] = useState(0);
  const [liveHint, setLiveHint] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.id) {
      const history = StorageService.getHistory(currentUser.id);
      const sug = SerendipityService.getBeforeSessionSuggestion(currentUser.id, history);
      if (sug) {
        setBeforeSuggestion(sug.text);
      }
    }
  }, [currentUser]);

  // Load resumeable session on mount
  useEffect(() => {
    if (currentUser?.id) {
      try {
        const saved = localStorage.getItem(`shana_active_training_${currentUser.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.chatHistory && parsed.chatHistory.length > 0 && parsed.step === 'active') {
            setHasResumeableSession(true);
            setResumeData(parsed);
          }
        }
      } catch (e) {
        console.warn("Failed to load training draft", e);
      }
    }
  }, [currentUser]);

  // Save active voice training session draft
  useEffect(() => {
    if (step === 'active' && chatHistory.length > 0 && currentUser?.id) {
      try {
        localStorage.setItem(
          `shana_active_training_${currentUser.id}`,
          JSON.stringify({
            step,
            currentQuestionIndex,
            chatHistory,
            currentQuestion,
            secondsElapsed
          })
        );
      } catch (e) {
        console.warn("Failed to save training draft", e);
      }
    }
  }, [step, currentQuestionIndex, chatHistory, currentQuestion, secondsElapsed, currentUser]);

  const handleResumeSession = async () => {
    if (!resumeData) return;
    
    // Request microphone permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicPermissionDenied(false);
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setMicPermissionDenied(true);
      setStep('active'); // Still show active screen to display the beautiful mic blocker UI
      return;
    }

    setStep('active');
    setCurrentQuestionIndex(resumeData.currentQuestionIndex);
    setChatHistory(resumeData.chatHistory);
    setCurrentQuestion(resumeData.currentQuestion);
    setSecondsElapsed(resumeData.secondsElapsed);
    setHasResumeableSession(false);
    
    // Automatically play current question on resume
    setTimeout(() => {
      speakText(resumeData.currentQuestion);
    }, 500);
  };

  const handleStartFresh = () => {
    if (currentUser?.id) {
      try {
        localStorage.removeItem(`shana_active_training_${currentUser.id}`);
      } catch (e) {}
    }
    setHasResumeableSession(false);
    setResumeData(null);
    handleBegin();
  };
  
  // Speech synthesis and recognition references
  const recognitionRef = useRef<any>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isUtteredRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  
  // Final Review outcomes
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [reviewResult, setReviewResult] = useState<{
    strength: string;
    improvement: string;
    suggestedExercise: string;
  } | null>(null);

  // Web Audio Context for real-time microphone level visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [volumeHistory, setVolumeHistory] = useState<number[]>(Array(30).fill(2));
  const [showKeyboardFallback, setShowKeyboardFallback] = useState<boolean>(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);

  const isListeningRef = useRef(isListening);
  const isPausedRef = useRef(isPaused);
  const isLoadingRef = useRef(isLoading);
  const stepRef = useRef(step);
  const turnDetectorRef = useRef<TurnDetector | null>(null);
  const handleSubmitAnswerRef = useRef<() => void>(() => {});

  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => {
    turnDetectorRef.current = new TurnDetector({
      silenceThreshold: 10,
      silenceDurationThresholdMs: 1500, // 1.5 seconds pause
      minSpeechDurationMs: 1000,
      volumeVarianceThreshold: 2.0
    });
  }, []);

  // Initialize microphone volume tracking & fallback simulation
  useEffect(() => {
    let animationId: number;
    let fallbackTimer: any;
    
    const initMicAnalysis = async () => {
      if (step !== 'active') {
        cleanupMicAnalysis();
        return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        microphoneStreamRef.current = stream;
        setMicPermissionDenied(false); // Successfully acquired mic!
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          startSimulatedFeedback();
          return;
        }
        
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.5;
        analyserNodeRef.current = analyser;
        
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateLevel = () => {
          if (!analyserNodeRef.current) return;
          
          let level = 0;
          // Check if we should actively read from the microphone
          const isCurrentlyActive = (
            stepRef.current === 'active' && 
            !isPausedRef.current && 
            !isLoadingRef.current && 
            isListeningRef.current
          );

          if (isCurrentlyActive) {
            try {
              analyserNodeRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              level = Math.min(100, Math.round((average / 128) * 100));

              // Feed to our TurnDetector
              if (turnDetectorRef.current) {
                const shouldTransition = turnDetectorRef.current.feedVolumeSample(level);
                if (shouldTransition) {
                  console.log("[VoiceTrainingFlow] Silence-based Turn-Detection triggered. Submitting answer...");
                  handleSubmitAnswerRef.current?.();
                }
              }
            } catch (e) {
              console.warn("[VoiceTrainingFlow] Failed to get frequency data:", e);
            }
          }
          
          setMicVolume(level);
          setVolumeHistory(prev => {
            const next = [...prev.slice(1), Math.max(3, level * 0.8)];
            return next;
          });
          
          animationId = requestAnimationFrame(updateLevel);
        };
        
        updateLevel();
      } catch (err) {
        console.warn("Direct microphone analysis failed or permission denied. Falling back to simulated audio waveform feedback:", err);
        startSimulatedFeedback();
      }
    };

    const startSimulatedFeedback = () => {
      // In case mic permission is blocked or running in sandboxed iframe,
      // we generate a beautiful, responsive wave based on time + voice synthesis states
      // to keep the visual feedback lively and responsive!
      let angle = 0;
      const simulate = () => {
        angle += 0.15;
        // If listening, generate speech waveform ripples. Otherwise, stay flat/minimal.
        const isActiveState = (
          stepRef.current === 'active' && 
          isListeningRef.current && 
          !isPausedRef.current && 
          !isLoadingRef.current
        );
        const base = isActiveState ? 15 : 2;
        const noise = isActiveState ? Math.abs(Math.sin(angle) * 30 + Math.cos(angle * 2.3) * 12) : 0;
        const finalVal = Math.round(base + noise);
        
        setMicVolume(finalVal);
        setVolumeHistory(prev => {
          const next = [...prev.slice(1), Math.max(2, finalVal)];
          return next;
        });
        
        fallbackTimer = setTimeout(simulate, 50);
      };
      simulate();
    };
    
    if (step === 'active') {
      initMicAnalysis();
    } else {
      cleanupMicAnalysis();
      setVolumeHistory(Array(30).fill(2));
    }
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      // Clean up when leaving 'active' step or unmounting
      if (stepRef.current !== 'active') {
        cleanupMicAnalysis();
      }
    };
  }, [step]);

  const cleanupMicAnalysis = () => {
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(t => t.stop());
      microphoneStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserNodeRef.current = null;
    setMicVolume(0);
  };

  // Set up timer and live metrics ticking during training active session
  useEffect(() => {
    if (step === 'active' && !isPaused) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);

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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, isPaused, currentProfile?.language]);

  // Reset live metrics and session storage intervention indicators on every new question
  useEffect(() => {
    if (step === 'active') {
      setInterruptionCount(0);
      setFillerWordsCount(0);
      setHesitationSeconds(0);
      setAnswerSeconds(0);
      setLiveHint(null);
    }
  }, [currentQuestionIndex, step]);

  useEffect(() => {
    if (step === 'active' && currentUser?.id) {
      sessionStorage.removeItem(`shana_session_intervention_triggered_${currentUser.id}`);
    }
  }, [step, currentUser]);

  // Live Detection triggers (MODE 2)
  useEffect(() => {
    if (step === 'active' && currentUser?.id && !liveHint) {
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
  }, [step, currentUser?.id, fillerWordsCount, hesitationSeconds, answerSeconds, interruptionCount, liveHint]);

  useEffect(() => {
    if (step === 'active') {
      InterviewVoiceManager.acquireLock('VOICE_TRAINING');
    } else {
      InterviewVoiceManager.releaseLock('VOICE_TRAINING');
    }
  }, [step]);

  // Clean speech synthesis and HTML5 audio on unmount
  useEffect(() => {
    return () => {
      InterviewVoiceManager.releaseLock('VOICE_TRAINING');
      window.speechSynthesis?.cancel();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  // Web Speech synthesis / OpenAI TTS (speak SHANA's question)
  const speakText = (text: string) => {
    if (isMuted) {
      isUtteredRef.current = false;
      if (!isPaused && step === 'active') {
        startListening();
      }
      return;
    }
    
    // 1. Cancel any active local speech synthesis or audio playbacks via InterviewVoiceManager
    InterviewVoiceManager.stopAllActiveOutputs();
    if (currentAudioRef.current) {
      currentAudioRef.current = null;
    }

    // Remove markdown code brackets or symbols to make pronunciation natural, keeping single quotes and standard punctuation
    const cleanedText = text
      .replace(/[*#_\`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanedText) return;

    if (!InterviewVoiceManager.isAllowed('VOICE_TRAINING')) {
      console.warn("[VoiceTrainingFlow] Speech blocked because we do not own the voice lock.");
      return;
    }

    isUtteredRef.current = true;

    // 2. Play using OpenAI TTS via HTML5 Audio with fallback to local synthesis
    const audioUrl = `/api/interview/speak?text=${encodeURIComponent(cleanedText)}`;
    
    let fallbackTriggered = false;
    const triggerFallback = (reason: string) => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      console.warn(`[SHANA Client] ${reason}. Falling back to local SpeechSynthesis.`);
      
      InterviewVoiceManager.stopAllActiveOutputs();
      if (currentAudioRef.current) {
        currentAudioRef.current = null;
      }
      fallbackSpeakLocal(cleanedText);
    };

    const audio = InterviewVoiceManager.playServerAudio(
      audioUrl,
      'VOICE_TRAINING',
      () => {
        if (fallbackTriggered) return;
        isUtteredRef.current = false;
        currentAudioRef.current = null;
        if (!isPaused && step === 'active') {
          startListening();
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

  const fallbackSpeakLocal = (cleanedText: string) => {
    isUtteredRef.current = true;
    InterviewVoiceManager.speakLocal(
      cleanedText,
      currentProfile.language === 'French' ? 'fr-FR' : 'en-US',
      'VOICE_TRAINING',
      () => {
        isUtteredRef.current = false;
        if (!isPaused && step === 'active') {
          startListening();
        }
      }
    );
  };

  // Web Speech recognition (listen to user responses)
  const startListening = () => {
    if (isPaused) return;

    if (isUtteredRef.current) {
      setInterruptionCount(prev => prev + 1);
    }

    window.speechSynthesis?.cancel(); // stop SHANA if user interrupts speaking
    
    // Reset our silence-based Turn-Detector
    turnDetectorRef.current?.reset();
    
    // 1. Clear any old audio chunks
    audioChunksRef.current = [];

    // 2. Start recording real audio using MediaRecorder if stream is available
    if (microphoneStreamRef.current) {
      try {
        const options = { mimeType: 'audio/webm' };
        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(microphoneStreamRef.current, options);
        } catch (e) {
          recorder = new MediaRecorder(microphoneStreamRef.current);
        }

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start(250); // Record in 250ms chunks
        console.log("[VoiceTrainingFlow] MediaRecorder started successfully.");
      } catch (err) {
        console.error("[VoiceTrainingFlow] MediaRecorder initialization failed:", err);
      }
    }

    // 3. Set listening state
    setIsListening(true);
    setApiError(null);

    // 4. Start Web Speech as a live, streaming on-screen text feedback helper
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      // Stop current recognition if alive
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = currentProfile.language === 'French' ? 'fr-FR' : 'en-US';

      rec.onstart = () => {
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

        const voiceResult = finalTranscript + interimTranscript;
        setUserInput(voiceResult);
        
        // If candidate spoke anything, let the TurnDetector know immediately
        if (voiceResult.trim().length > 0) {
          turnDetectorRef.current?.setHasSpoken(true);
        }
      };

      rec.onerror = (event: any) => {
        console.warn("[VoiceTrainingFlow] Speech recognition error:", event.error);
      };

      rec.onend = () => {
        // Auto-restart WebSpeech if we are still active, recording, and not paused
        if (
          !isPaused && 
          !isLoading && 
          step === 'active' && 
          mediaRecorderRef.current && 
          mediaRecorderRef.current.state === 'recording'
        ) {
          try {
            rec.start();
            console.log("[VoiceTrainingFlow] Auto-restarted WebSpeech helper after silence end.");
          } catch (e) {}
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (e) {}
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        console.log("[VoiceTrainingFlow] MediaRecorder stopped.");
      } catch (e) {}
    }
    setIsListening(false);
  };

  // Step 1: Initiate actual session
  const handleBegin = async () => {
    // Request microphone permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicPermissionDenied(false);
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setMicPermissionDenied(true);
      setStep('active'); // Transition to active to show the custom blocker UI
      return;
    }

    setStep('active');
    setSecondsElapsed(0);
    setCurrentQuestionIndex(1);
    setChatHistory([]);
    setUserInput('');
    setApiError(null);
    
    // Boot first SHANA prompt
    setIsLoading(true);
    try {
      const response = await fetch('/api/train/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory: [],
          userInput: '',
          profile: currentProfile,
          blueprint: blueprint,
          surpriseConfig: surpriseConfig
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const json = await response.json();
      const firstQuestion = json.response;
      
      setCurrentQuestion(firstQuestion);
      setChatHistory([{ role: 'ai', text: firstQuestion }]);
      
      // Delay speech synthesis slightly for browser voice load compliance
      setTimeout(() => {
        speakText(firstQuestion);
      }, 500);

    } catch (err: any) {
      console.error(err);
      setApiError(currentProfile.language === 'French' 
        ? "Erreur lors du chargement de la première question. Veuillez vérifier votre clé API OpenAI."
        : "Failed to initialize standard first question. Please configure your OpenAI API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Answer (Proceeding through Step 2)
  const handleSubmitAnswer = async () => {
    if (isLoading) return;

    // First stop speech recognition & media recorder
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    let activeRecorder = mediaRecorderRef.current;
    if (activeRecorder && activeRecorder.state !== 'inactive') {
      const stopPromise = new Promise<void>((resolve) => {
        if (activeRecorder) {
          activeRecorder.onstop = () => {
            resolve();
          };
          try {
            activeRecorder.stop();
          } catch (e) {
            resolve();
          }
        } else {
          resolve();
        }
      });
      setIsLoading(true);
      await stopPromise;
    }

    setIsListening(false);

    let answer = userInput.trim();

    // 2. Transcribe voice using OpenAI Whisper if we recorded audio chunks
    if (audioChunksRef.current && audioChunksRef.current.length > 0) {
      setIsLoading(true);
      setApiError(currentProfile.language === 'French'
        ? "Analyse et transcription de votre voix par l'IA Whisper d'OpenAI..."
        : "Analyzing and transcribing your voice with OpenAI Whisper AI...");
      
      try {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(blob);

        const payload = {
          audio: base64,
          filename: "live_recording.webm",
          language: currentProfile.language === 'French' ? "French" : "English",
          targetRole: currentProfile.targetRole,
          industry: currentProfile.industry,
          textFallback: answer || undefined
        };

        const response = await fetch('/api/analyze-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const json = await response.json();
          if (json && json.transcript) {
            const whisperText = json.transcript.trim();
            // Ignore placeholders or empty speech messages
            if (whisperText && !whisperText.includes("[No voice") && !whisperText.includes("[Aucun signal")) {
              answer = whisperText;
              console.log("[VoiceTrainingFlow] Successfully transcribed answer using OpenAI Whisper:", answer);
            }
          }
        }
      } catch (whisperErr) {
        console.error("[VoiceTrainingFlow] Whisper transcription failed:", whisperErr);
      }
    }

    if (!answer) {
      if (!showKeyboardFallback) {
        setApiError(currentProfile.language === 'French'
          ? "Aucun signal vocal détecté. Si votre micro ne fonctionne pas dans ce navigateur, veuillez cliquer sur '⌨️ Saisir ma réponse par écrit' pour continuer par écrit."
          : "No speech detected. If your microphone is not working in this environment, please click '⌨️ Type response fallback' below to write your answer.");
        setIsLoading(false);
        return;
      } else {
        setApiError(currentProfile.language === 'French'
          ? "Veuillez saisir votre réponse avant de valider."
          : "Please enter your response before submitting.");
        setIsLoading(false);
        return;
      }
    }

    setApiError(null);
    setIsLoading(true);

    const updatedHistory = [
      ...chatHistory,
      { role: 'user' as const, text: answer }
    ];
    setChatHistory(updatedHistory);
    setUserInput('');

    // If we completed 5 responses already, let's trigger session compilation!
    if (currentQuestionIndex >= totalQuestions) {
      triggerSessionReview(updatedHistory);
      return;
    }

    try {
      const response = await fetch('/api/train/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory: updatedHistory,
          userInput: '',
          profile: currentProfile,
          blueprint: blueprint,
          surpriseConfig: surpriseConfig
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const json = await response.json();
      const nextQuestion = json.response;

      setCurrentQuestion(nextQuestion);
      setChatHistory([
        ...updatedHistory,
        { role: 'ai' as const, text: nextQuestion }
      ]);
      
      // Increment turn index
      setCurrentQuestionIndex(prev => prev + 1);
      
      // Play speech
      speakText(nextQuestion);

    } catch (err: any) {
      console.error(err);
      setApiError(currentProfile.language === 'French'
        ? "Une erreur est survenue lors de l'accès à SHANA."
        : "A communication error occurred contacting the Shana engine.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSubmitAnswerRef.current = handleSubmitAnswer;
  }, [handleSubmitAnswer]);

  // Replay voice question handle
  const handleReplay = () => {
    if (currentQuestion) {
      speakText(currentQuestion);
    }
  };

  // Hand-held pause state trigger
  const handleTogglePause = () => {
    setIsPaused(prev => {
      const targetState = !prev;
      if (targetState) {
        stopListening();
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }
        window.speechSynthesis?.pause();
      } else {
        if (currentAudioRef.current) {
          currentAudioRef.current.play().catch(err => console.warn(err));
        }
        window.speechSynthesis?.resume();
        // Resume listening if we weren't speaking
        if (!isUtteredRef.current) {
          startListening();
        }
      }
      return targetState;
    });
  };

  // Step 3: Trigger Feedback review generation
  const triggerSessionReview = async (finalHistory: Message[]) => {
    setIsGeneratingReview(true);
    setStep('review');
    
    // Clear draft training session when successfully compiled and moving to review screen
    if (currentUser?.id) {
      try {
        localStorage.removeItem(`shana_active_training_${currentUser.id}`);
      } catch (e) {}
    }

    window.speechSynthesis?.cancel();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    try {
      const response = await fetch('/api/train/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory: finalHistory,
          profile: currentProfile,
          blueprint: blueprint
        })
      });

      if (!response.ok) {
        throw new Error("Unable to analyze dialogue.");
      }

      const json = await response.json();
      const review = json.data;
      
      setReviewResult({
        strength: review.strength,
        improvement: review.improvement,
        suggestedExercise: review.suggestedExercise
      });

      // Persist the Completed Training Session as requested in database schema Guidelines!
      saveTrainingSessionToLocalStorage(review, finalHistory);

    } catch (e) {
      console.error(e);
      // Fallback fallback feedback review
      const isFr = currentProfile.language === 'French';
      setReviewResult({
        strength: isFr 
          ? "Excellente persévérance dans l'expression d'exemples de migration complexes." 
          : "Clear structures in sharing system migration scenarios.",
        improvement: isFr 
          ? "Travaillez sur la clarté et restez concis dans les transitions compliquées." 
          : "Enhance response summaries to be concise during technical transitions.",
        suggestedExercise: isFr 
          ? "Pratiquez le cadre d'élocution STAR sur vos compétences en leadership." 
          : "Execute leadership scenarios utilizing the STAR method."
      });
    } finally {
      setIsGeneratingReview(false);
    }
  };

  const saveTrainingSessionToLocalStorage = (review: any, finalHistory: Message[]) => {
    const formattedDuration = `${Math.floor(secondsElapsed / 60)}m ${secondsElapsed % 60}s`;
    
    // Extracted clean array of questions asked in session
    const questionsList = finalHistory
      .filter(m => m.role === 'ai')
      .map(m => m.text);

    const sessionPayload = {
      id: 'sess_' + Math.random().toString(36).substring(3, 11),
      userId: currentUser.id,
      blueprintId: blueprint ? 'blu_active' : 'blu_default',
      duration: formattedDuration,
      questions: questionsList,
      focusArea: blueprint?.primaryFocus || "Professional Vocal Delivery",
      strength: review.strength,
      improvement: review.improvement,
      createdAt: new Date().toISOString()
    };

    try {
      StorageService.saveVoiceSession(currentUser.id, sessionPayload);
      const updatedMonetization = StorageService.consumeCandidateCredit(currentUser.id, 'AUDIO');
      setMonetization(updatedMonetization);
      
      // Serendipity Activation Engine (Modes 3, 4, 5)
      const existingHistory = StorageService.getHistory(currentUser.id) || [];
      const lastSession = {
        id: sessionPayload.id,
        date: new Date().toLocaleDateString(),
        score: 85,
        confidenceScore: 85,
        communicationScore: 85,
        behavioralScore: 85,
        questionsFeedback: []
      } as any;

      // Breakthrough Check (MODE 5)
      const breakthrough = SerendipityService.checkBreakthrough(currentUser.id, lastSession, existingHistory);
      if (breakthrough) {
        SerendipityService.addDiscovery(currentUser.id, breakthrough.text, 'strength', "Voice Training", 95, breakthrough.explanation, surpriseConfig?.experimentId);
        SerendipityService.triggerNotification(currentUser.id, breakthrough.text);
      }

      // Default Discovery Check (MODE 3)
      const afterDiscovery = SerendipityService.checkAfterSessionDiscovery(currentUser.id, lastSession, existingHistory);
      if (afterDiscovery) {
        SerendipityService.addDiscovery(currentUser.id, afterDiscovery.text, afterDiscovery.category, "Voice Training", 88, afterDiscovery.explanation, surpriseConfig?.experimentId);
        SerendipityService.triggerNotification(currentUser.id, afterDiscovery.text);
      } else if (surpriseConfig) {
        // Fallback only if surprise run
        const text = isFrench
          ? `Vous vous êtes adapté avec succès au recruteur de style "${surpriseConfig.personality.nameFR}".`
          : `You successfully adapted your responses to the surprise "${surpriseConfig.personality.nameEN}" interviewer!`;
        SerendipityService.addDiscovery(currentUser.id, text, 'strength', "Voice Training", 88, isFrench ? "Découverte de simulation surprise." : "Surprise simulation discovery.", surpriseConfig?.experimentId);
      }

      // Weekly Insight Check (MODE 4)
      const weekly = SerendipityService.checkWeeklyInsight(currentUser.id, [lastSession, ...existingHistory]);
      if (weekly) {
        SerendipityService.addDiscovery(currentUser.id, weekly.text, 'method', "Voice Training", 90, weekly.explanation);
        SerendipityService.triggerNotification(currentUser.id, weekly.text);
      }

      window.dispatchEvent(new Event('shana_progress_update'));
    } catch (err) {
      console.warn("Storage save failed:", err);
    }
  };

  const handleFinish = () => {
    onSessionSaved();
    onBack();
  };

  // Helper values for display
  const isFrench = currentProfile.language === 'French';
  const formatSeconds = (sec: number) => {
    const mm = Math.floor(sec / 60).toString().padStart(2, '0');
    const ss = (sec % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return (
    <div className="max-w-3xl mx-auto py-1 animate-fade-in font-sans">
      
      {/* 1 === START SESSION SCREEN === */}
      {step === 'start' && (
        <div className="space-y-6">
          {/* Back button */}
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-stone-700 hover:text-stone-950 hover:underline cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{isFrench ? "Tableau de Bord" : "Dashboard"}</span>
          </button>

          {/* Intro Card */}
          <div className="bg-white border-[2.5px] border-stone-950 rounded-[28px] p-6 md:p-8 space-y-6 shadow-[5px_5px_0px_0px_#111111] hover:shadow-[7px_7px_0px_0px_#111111] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-stone-950 font-black bg-stone-150 px-2.5 py-1 rounded-md border border-stone-950 shadow-[1px_1px_0px_0px_#111111]">
                {isFrench ? "COACHING ACTIF" : "ACTIVE TRAINING MODE"}
              </span>
              <h1 className="text-2xl md:text-3xl font-sans font-black text-stone-950 tracking-tight mt-4">
                {isFrench ? "Studio d’Entraînement Vocal" : "SHANA Voice Training"}
              </h1>
              <p className="text-xs text-stone-600 mt-1.5 italic font-bold leading-relaxed">
                {isFrench 
                  ? "Améliorez votre structure d'expression orale à travers un dialogue adaptatif et bienveillant, calibré par l'IA."
                  : "Improve your oral interview mechanics through a highly adaptive, supportive, and safe coaching dialogue."}
              </p>
            </div>

            {/* Ingestion warning */}
            <div className="p-4 bg-indigo-50 border-2 border-stone-950 rounded-2xl flex items-start gap-3 shadow-[2.5px_2.5px_0px_0px_#111111]">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-indigo-900 tracking-wider font-mono">
                  {isFrench ? "REMARQUE SUR LE PROTOCOLE SHANA" : "SHANA DIRECTIVES"}
                </span>
                <p className="text-[11px] text-stone-700 font-bold leading-relaxed">
                  {isFrench 
                    ? "Ce mode est uniquement conçu pour le coaching vocal interactif. Aucun score éliminatoire ou pass/fail ne sera généré. La caméra et la transcription en direct sont désactivées."
                    : "This phase is strictly for high-yield voice training. No final hiring readiness score will be generated. Recording feeds, live transcripts, and evaluation widgets are locked."}
                </p>
              </div>
            </div>

            {/* Suggested Serendipity Experiment (MODE 1 — BEFORE INTERVIEW) */}
            {beforeSuggestion && (
              <div className="p-4 bg-[#FFFDEE] border-2 border-stone-950 rounded-2xl flex items-start gap-3 shadow-[2.5px_2.5px_0px_0px_#111111]">
                <span className="text-xl">💡</span>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black text-amber-900 tracking-wider font-mono">
                    {isFrench ? "DÉFI EXCLUSIF SUGGÉRÉ" : "SHANA RECOMMENDED EXPERIMENT"}
                  </span>
                  <p className="text-xs font-black text-stone-950 leading-relaxed">
                    {beforeSuggestion}
                  </p>
                  <p className="text-[10px] text-stone-600 font-bold">
                    {isFrench 
                      ? "Ce conseil adaptatif est suggéré selon vos indicateurs comportementaux passés pour briser vos routines."
                      : "This adaptive coaching recommendation is triggered based on your historical behavior patterns."}
                  </p>
                </div>
              </div>
            )}

            {/* Parameters list of Blueprint */}
            <div className="border-2 border-stone-950 p-5 rounded-3xl space-y-4 bg-stone-50 shadow-[3px_3px_0px_0px_#111111]">
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-stone-950 border-b border-stone-250 pb-2">
                {isFrench ? "Paramètres du Plan d’Entretien" : "Interview Blueprint Specifications"}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-xl border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_#111111]">
                  <span className="text-[9px] font-mono uppercase text-stone-500 block font-black">
                    {isFrench ? "Rôle Ciblé" : "Target Role"}
                  </span>
                  <span className="text-xs font-black text-stone-950 mt-1 block">
                    {currentProfile.targetRole || "Professional Candidate"}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_#111111]">
                  <span className="text-[9px] font-mono uppercase text-stone-500 block font-black">
                    {isFrench ? "Axe Majeur" : "Focus Area"}
                  </span>
                  <span className="text-xs font-black text-stone-950 mt-1 block truncate">
                    {blueprint?.primaryFocus || (isFrench ? "Communication Professionnelle" : "Professional Delivery")}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_#111111]">
                  <span className="text-[9px] font-mono uppercase text-stone-500 block font-black">
                    {isFrench ? "Durée Session" : "Duration Strategy"}
                  </span>
                  <span className="text-xs font-black text-stone-950 mt-1 block text-indigo-700">
                    5 Questions (~10m)
                  </span>
                </div>
              </div>
            </div>

            {!hasAudioCredits ? (
              <div className="p-5 border-2 border-dashed border-stone-950 bg-indigo-50/20 rounded-[24px] space-y-4 text-left animate-fade-in" id="training-credits-locked-card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white border-2 border-stone-950 text-stone-950 rounded-xl flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#111111]">
                    <LockKeyhole className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest bg-amber-200 border-2 border-stone-950 text-stone-950 px-2.5 py-0.5 rounded font-black shadow-[1px_1px_0px_0px_#111111]">
                      {isFrench ? "CRÉDITS ÉPUISÉS" : "PRACTICE LIMIT LOCKED"}
                    </span>
                    <h3 className="text-sm font-black text-stone-950 mt-2">
                      {isFrench ? "Plus d'heures d'entraînement vocal" : "Out of prepaid practice credits"}
                    </h3>
                    <p className="text-[11px] text-stone-600 font-bold leading-relaxed mt-0.5">
                      {isFrench 
                        ? "Veuillez vous abonner à Ultra Illimité ou recharger votre solde de sessions à la carte pour continuer à vous entraîner."
                        : "To continue practicing adaptive oral interview delivery, subscribe to Ultra Unlimited or top-up individual sessions."}
                    </p>
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Starter Pack Option */}
                  <div className="bg-white border-2 border-stone-950 p-4 rounded-xl flex flex-col justify-between shadow-[3px_3px_0px_0px_#111111]">
                    <div>
                      <span className="text-[10px] font-black text-stone-950 block uppercase tracking-wider">{isFrench ? "Pack Starter" : "Starter Pack"}</span>
                      <span className="text-xs font-bold text-stone-600 block mt-1 leading-relaxed">
                        {isFrench ? "3 Sessions d’Entraînement" : "3 Audio coaching sessions"}
                      </span>
                    </div>
                    <button
                      type="button"
                      id="training-buy-starter-btn"
                      onClick={() => setSelectedProductForCheckout('pack_starter')}
                      className="mt-4 w-full py-2.5 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 font-black border-2 border-stone-950 text-[10px] uppercase tracking-wider rounded-lg shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)] transition-all cursor-pointer text-center"
                    >
                      {isFrench ? "Acheter • 3.99€" : "Buy • 3.99€"}
                    </button>
                  </div>

                  {/* Top Up 1 Session Option */}
                  <div className="bg-white border-2 border-stone-950 p-4 rounded-xl flex flex-col justify-between shadow-[3px_3px_0px_0px_#111111]">
                    <div>
                      <span className="text-[10px] font-black text-stone-950 block uppercase tracking-wider">{isFrench ? "Recharge unitaire" : "Single Top-Up"}</span>
                      <span className="text-xs font-bold text-stone-600 block mt-1 leading-relaxed">
                        {isFrench ? "+1 Session d'Entraînement" : "+1 Audio coaching session"}
                      </span>
                    </div>
                    <button
                      type="button"
                      id="training-buy-topup-btn"
                      onClick={() => setSelectedProductForCheckout('topup_1_audio')}
                      className="mt-4 w-full py-2.5 bg-white hover:bg-stone-50 text-stone-950 font-black border-2 border-stone-950 text-[10px] uppercase tracking-wider rounded-lg shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)] transition-all cursor-pointer text-center"
                    >
                      {isFrench ? "Acheter • 1.49€" : "Buy • 1.49€"}
                    </button>
                  </div>
                </div>
              </div>
            ) : hasResumeableSession && resumeData ? (
              <div className="p-5 bg-[#FFFDEE] border-2 border-stone-950 rounded-3xl space-y-4 animate-fade-in shadow-[4px_4px_0px_0px_#111111]">
                <div className="flex items-start gap-3">
                  <Flame className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black text-amber-900 tracking-wider font-mono">
                      {isFrench ? "SESSION EN COURS DÉTECTÉE" : "ACTIVE SESSION DETECTED"}
                    </span>
                    <p className="text-xs text-stone-950 leading-relaxed font-black">
                      {isFrench 
                        ? `Vous avez quitté une session d'entraînement à la question ${resumeData.currentQuestionIndex}/${totalQuestions} (${formatSeconds(resumeData.secondsElapsed)}).`
                        : `You have an active voice training session at question ${resumeData.currentQuestionIndex}/${totalQuestions} (${formatSeconds(resumeData.secondsElapsed)}).`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <button
                    id="resume-training-btn"
                    onClick={handleResumeSession}
                    className="flex-grow py-3.5 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 font-black text-xs uppercase tracking-widest rounded-xl border-2 border-stone-950 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-stone-950 text-stone-950" />
                    <span>{isFrench ? "Reprendre la session" : "Resume Session"}</span>
                  </button>
                  <button
                    id="start-fresh-btn"
                    onClick={handleStartFresh}
                    className="py-3.5 px-6 bg-white hover:bg-stone-50 text-stone-950 border-2 border-stone-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isFrench ? "Recommencer à zéro" : "Start Fresh"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Start Button */
              <button
                id="begin-training-btn"
                onClick={handleBegin}
                className="w-full py-4 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 font-black text-xs uppercase tracking-widest rounded-xl border-2 border-stone-950 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-stone-950 text-stone-950" />
                <span>{isFrench ? "Commencer la session de coaching" : "Begin Training Session"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2 === ACTIVE DIALOGUE SIMULATION === */}
      {step === 'active' && (
        <div className="max-w-2xl mx-auto space-y-10 py-6 px-4 animate-fade-in">
          
          {/* Subtle Minimalist Header Line */}
          <div className="flex justify-between items-center text-[#9CA3AF] text-[10px] font-mono tracking-widest uppercase pb-2 border-b-2 border-stone-950">
            {/* Minimalist Step indicators */}
            <div className="flex items-center gap-2">
              <span className="font-black text-stone-950">
                {isFrench ? "ENTRAÎNEMENT" : "TRAINING"}
              </span>
              <div className="flex gap-1.5 items-center ml-2">
                {Array.from({ length: totalQuestions }).map((_, i) => (
                  <span 
                    key={i} 
                    className={`w-2 h-2 rounded-full transition-all duration-300 border border-stone-950 ${
                      i + 1 === currentQuestionIndex 
                        ? 'bg-stone-950 scale-125' 
                        : i + 1 < currentQuestionIndex 
                          ? 'bg-stone-400' 
                          : 'bg-white'
                    }`} 
                  />
                ))}
              </div>
            </div>

            {/* Time indicator */}
            <div className="font-mono font-bold bg-[#EDC154] border-2 border-stone-950 text-stone-950 px-2.5 py-0.5 rounded-lg shadow-[1.5px_1.5px_0px_0px_#111111] text-[11px]">
              {formatSeconds(secondsElapsed)}
            </div>

            {/* Quiet Abort Link */}
            <button
              onClick={() => {
                if (window.confirm(isFrench ? "Voulez-vous interrompre cet entraînement vocal ?" : "Are you sure you want to stop this training? All progress will be lost.")) {
                  onBack();
                }
              }}
              className="px-3.5 py-1 bg-[#FF7E5F] border-2 border-stone-950 text-stone-950 font-black uppercase tracking-wider rounded-lg shadow-[2px_2px_0px_0px_#111111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#111111] transition-all text-[9px] cursor-pointer"
            >
              {isFrench ? "quitter" : "abort"}
            </button>
          </div>

          {micPermissionDenied ? (
            <div className="bg-[#FF7E5F]/10 border-2 border-stone-950 rounded-3xl p-8 md:p-12 text-center space-y-6 max-w-xl mx-auto py-12 animate-fade-in shadow-[4px_4px_0px_0px_#111111] my-10" id="mic-blocker">
              <div className="w-16 h-16 bg-[#FF7E5F]/20 rounded-full border-2 border-stone-950 flex items-center justify-center mx-auto text-stone-950">
                <MicOff className="w-8 h-8" />
              </div>
              <div className="space-y-3">
                <h3 className="text-base font-black text-stone-950 tracking-tight uppercase font-mono">
                  {isFrench ? "Accès microphone obligatoire" : "Microphone Access Required"}
                </h3>
                <p className="text-sm text-stone-700 leading-relaxed max-w-md mx-auto font-sans font-bold">
                  {isFrench 
                    ? "SHANA est un coach de préparation d'entretien d'embauche 100% interactif à la voix. Pour vous entraîner et lui parler, vous devez impérativement autoriser l'accès au microphone dans votre navigateur." 
                    : "SHANA is a 100% interactive voice-first interview coach. To practice and speak with her, you must authorize microphone access in your browser."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  type="button"
                  id="mic-retry-btn"
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      stream.getTracks().forEach(t => t.stop());
                      setMicPermissionDenied(false);
                      setApiError(null);
                    } catch (err) {
                      console.error("Microphone permission retry failed:", err);
                      alert(isFrench 
                        ? "L'accès au microphone est toujours bloqué. Veuillez l'activer dans les paramètres de votre navigateur." 
                        : "Microphone access is still blocked. Please enable it in your browser settings.");
                    }
                  }}
                  className="px-6 py-3 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 border-2 border-stone-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] transition-all cursor-pointer"
                >
                  {isFrench ? "Autoriser le micro & Réessayer" : "Allow Mic & Retry"}
                </button>
                <button
                  type="button"
                  id="mic-keyboard-bypass"
                  onClick={() => {
                    setMicPermissionDenied(false);
                    setShowKeyboardFallback(true);
                  }}
                  className="px-6 py-3 bg-white hover:bg-stone-50 text-stone-950 border-2 border-stone-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] transition-all cursor-pointer"
                >
                  {isFrench ? "Continuer par Écrit" : "Bypass & Type Response"}
                </button>
                <button
                  type="button"
                  id="mic-abort-btn"
                  onClick={() => onBack()}
                  className="px-6 py-3 bg-[#FF7E5F] text-stone-950 border-2 border-stone-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] transition-all cursor-pointer"
                >
                  {isFrench ? "Quitter" : "Go Back"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Central Zen Arena */}
              <div className="bg-transparent text-stone-950 py-6 md:py-10 flex flex-col items-center justify-center space-y-12 relative">
            
            {/* Prompt/Question Card - Highly refined display typography with generous breathing room */}
            <div className="text-center space-y-6 max-w-xl mx-auto">
              {isLoading ? (
                <div className="h-24 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-5 h-5 text-stone-950 animate-spin" />
                  <p className="text-[11px] font-mono uppercase tracking-widest text-stone-950 animate-pulse font-black">
                    {isFrench ? "Shana formule la suite..." : "Shana is preparing prompt..."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-stone-950 bg-white px-2.5 py-1 rounded border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_#111111] font-black">
                    {isListening && !isPaused ? (isFrench ? "À VOUS DE PARLER" : "YOUR TURN") : (isFrench ? "ÉCOUTE DE LA QUESTION" : "LISTENING")}
                  </span>
                  
                  <p className="text-base md:text-lg font-sans font-black text-stone-900 leading-relaxed tracking-tight px-4 md:px-0">
                    {currentQuestion || (isFrench ? "Initialisation du coaching..." : "Initializing coaching conversation...")}
                  </p>
                </div>
              )}
            </div>

            {/* Live coaching hint (MODE 2 — DURING INTERVIEW) */}
            <AnimatePresence>
              {liveHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mx-auto max-w-sm p-4 bg-[#EDC154] border-2 border-stone-950 shadow-[4px_4px_0px_0px_#111111] rounded-2xl flex items-center gap-2.5 transition-all"
                >
                  <span className="text-lg">💡</span>
                  <div className="text-left">
                    <span className="text-[9px] font-mono font-black text-stone-950 uppercase tracking-wider block">
                      {isFrench ? "MICRO-CONSEIL SHANA" : "SHANA LIVE NUDGE"}
                    </span>
                    <p className="text-[11px] font-black text-stone-950 mt-0.5 leading-snug">
                      {isFrench ? (
                        liveHint === "Try letting the recruiter finish speaking, then answer." ? "Laissez le recruteur finir de parler avant de répondre." :
                        liveHint === "Try answering directly to improve your conciseness score." ? "Répondez plus directement pour améliorer votre score de concision." :
                        liveHint === "Try using a single structural example to get started." ? "Utilisez un seul exemple structuré pour commencer." :
                        liveHint === "Try taking a slight breath to reduce verbal fillers." ? "Respirez calmement pour réduire les tics de langage." :
                        liveHint
                      ) : liveHint}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Audio Level Indicator Arena - The requested visualizer */}
            <div className="flex flex-col items-center justify-center space-y-5 w-full py-4">
              
              {/* Dynamic waveform based on real mic volume history or simulated feedback */}
              <div className="flex items-center justify-center gap-1.5 h-14 w-full max-w-md px-10">
                {volumeHistory.map((vol, index) => {
                  // Center-aligned vertical bars for actual vocal dynamic wave effect
                  const barHeight = Math.max(3, (vol / 100) * 52);
                  const opacity = isListening && !isPaused && !isLoading
                    ? Math.max(0.15, (index / 30) * 0.85 + 0.15) // beautiful fade-in trailing tail
                    : 0.12; // static subtle background when quiet
                  
                  return (
                    <motion.div
                      key={index}
                      className={`w-1 rounded-full transition-colors duration-300 ${
                        isListening && !isPaused && !isLoading
                          ? 'bg-stone-950'
                          : 'bg-stone-400'
                      }`}
                      animate={{ height: barHeight }}
                      style={{ opacity }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                    />
                  );
                })}
              </div>

              {/* Minimalist Subtext State Indicator */}
              <div className="text-center">
                <p className="text-[9px] font-mono uppercase tracking-widest text-stone-500 font-black flex items-center justify-center gap-1.5">
                  {isListening && !isPaused && !isLoading ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-stone-700">{isFrench ? "MICROPHONE ACTIF • ENREGISTREMENT EN COURS" : "MICROPHONE ACTIVE • RECORDING"}</span>
                    </>
                  ) : isPaused ? (
                    <span>{isFrench ? "COACHING EN PAUSE" : "TRAINING PAUSED"}</span>
                  ) : isLoading ? (
                    <span>{isFrench ? "FORMULATION DE LA QUESTION" : "PREPARING QUESTION"}</span>
                  ) : (
                    <span className="flex flex-col items-center gap-2">
                      <span className="text-stone-500">{isFrench ? "DIFFUSION AUDIO DE SHANA" : "SHANA BROADCAST ACTIVE"}</span>
                      <button
                        type="button"
                        onClick={() => {
                          InterviewVoiceManager.stopAllActiveOutputs();
                          if (currentAudioRef.current) {
                            try {
                              currentAudioRef.current.pause();
                            } catch (e) {}
                            currentAudioRef.current = null;
                          }
                          isUtteredRef.current = false;
                          startListening();
                        }}
                        className="mt-2.5 px-4 py-2 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 font-black text-[10px] uppercase tracking-wider rounded-xl border-[1.5px] border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)] transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>🎙️</span>
                        <span>{isFrench ? "Parler maintenant" : "Speak Now"}</span>
                      </button>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Live Spoken Transcript Preview */}
            {!showKeyboardFallback && (
              <div className="w-full max-w-md mx-auto text-center space-y-2 px-4">
                <span className="text-[9px] font-mono uppercase tracking-widest text-stone-500 font-black block">
                  {isFrench ? "Votre réponse (dictée en direct)" : "Your response (live transcription)"}
                </span>
                <div className="min-h-[60px] w-full bg-white border-2 border-stone-950 rounded-2xl p-4 flex flex-col items-center justify-center text-xs text-stone-900 text-center shadow-[3px_3px_0px_0px_#111111]">
                  {userInput.trim() ? (
                    <span className="text-stone-950 font-bold block w-full break-words leading-relaxed">{userInput}</span>
                  ) : (
                    <div className="space-y-1 text-stone-500 font-bold">
                      {isListening && !isPaused && !isLoading ? (
                        <>
                          <p className="font-black text-stone-950 flex items-center justify-center gap-1">🎙️ {isFrench ? "Enregistrement en cours..." : "Recording in progress..."}</p>
                          <p className="text-[10px] text-stone-500 leading-relaxed font-bold">
                            {isFrench 
                              ? "Exprimez votre réponse à voix haute. L'IA Whisper d'OpenAI transcrira fidèlement vos propos au moment de valider." 
                              : "Speak your answer aloud. OpenAI Whisper AI will transcribe your voice with high fidelity when you submit."}
                          </p>
                        </>
                      ) : (
                        <p className="text-stone-400 italic font-black">
                          {isFrench ? "En attente du signal..." : "Waiting for audio..."}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Optional Keyboard Fallback Area */}
            <div className="w-full max-w-md">
              {!showKeyboardFallback ? (
                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyboardFallback(true)}
                    className="w-full py-3.5 bg-white hover:bg-stone-50 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-stone-950 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>⌨️</span>
                    <span>{isFrench ? "Saisir ma réponse par écrit / Clavier" : "Type my response / Keyboard"}</span>
                  </button>
                  <p className="text-[10px] text-stone-500 font-mono font-bold">
                    {isFrench 
                      ? "Recommandé si le microphone ne fonctionne pas ou ne capture pas votre voix." 
                      : "Recommended if your microphone is not working or not capturing your voice."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 bg-white p-4 rounded-2xl border-2 border-stone-950 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] animate-fade-in relative">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                    <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest font-black">
                      {isFrench ? "Saisie manuscrite de secours" : "Typewritten Response Backup"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowKeyboardFallback(false)}
                      className="text-[9px] font-mono text-[#FF7E5F] hover:text-red-700 cursor-pointer font-black border-none bg-transparent"
                    >
                      {isFrench ? "Masquer" : "Hide"}
                    </button>
                  </div>
                  
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={isFrench 
                      ? "Rédigez votre réponse ici si vous préférez l'écrit..." 
                      : "Type your response fallback here..."}
                    rows={2}
                    disabled={isPaused || isLoading}
                    className="w-full bg-white border-2 border-stone-950 rounded-xl px-3 py-2.5 text-xs outline-none text-stone-900 placeholder-stone-400 font-bold leading-relaxed resize-none"
                  />
                </div>
              )}

              {apiError && (
                <div className="text-[#FF7E5F] text-[10px] font-black text-center mt-3 italic animate-fade-in leading-relaxed max-w-sm mx-auto">
                  {apiError}
                </div>
              )}
            </div>

          </div>

          {/* Subdued Elegant Action Controllers at Bottom */}
          <div className="pt-5 border-t-2 border-stone-950 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Left group of helper tools */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
              {/* Voice Replay */}
              <button
                type="button"
                onClick={handleReplay}
                disabled={isLoading || isPaused}
                className="p-3 bg-white hover:bg-stone-50 border-2 border-stone-950 rounded-xl text-stone-950 font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
                title={isFrench ? "Réécouter la question" : "Replay prompt"}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isFrench ? "Réécouter" : "Replay"}</span>
              </button>

              {/* Pause/Resume */}
              <button
                type="button"
                onClick={handleTogglePause}
                disabled={isLoading}
                className="p-3 bg-white hover:bg-stone-50 border-2 border-stone-950 rounded-xl text-stone-950 font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-stone-950 fill-stone-950/10" />
                    <span>{isFrench ? "Reprendre" : "Resume"}</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-stone-950" />
                    <span>{isFrench ? "Pause" : "Pause"}</span>
                  </>
                )}
              </button>

              {/* Sound/Mute Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsMuted(prev => !prev);
                  if (!isMuted) window.speechSynthesis?.cancel();
                }}
                className={`p-3 border-2 border-stone-950 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)] ${
                  isMuted 
                    ? 'bg-[#FF7E5F] text-stone-950' 
                    : 'bg-white hover:bg-stone-50 text-stone-950'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isMuted ? (isFrench ? "Muet" : "Sourdine") : (isFrench ? "Son actif" : "Sound on")}</span>
              </button>
            </div>

            {/* Main Validation Button */}
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isLoading || isPaused}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 disabled:bg-stone-200 disabled:opacity-55 disabled:translate-x-0 disabled:shadow-none border-2 border-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[3.5px_3.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-4 h-4 text-stone-950 stroke-[2.5]" />
              )}
              <span>{isFrench ? "Valider la Réponse" : "Submit Answer"}</span>
            </button>

          </div>

        </>
      )}
    </div>
  )}

      {/* 3 === SESSION REVIEW FEEDBACK === */}
      {step === 'review' && (
        <div className="space-y-6">
          
          {/* Review Title */}
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-950 font-black bg-[#EDC154] px-2.5 py-1 rounded-md border-2 border-stone-950 shadow-[1px_1px_0px_0px_#111111]">
              {isFrench ? "DÉBRIEFING DE CRÉATION" : "COACHING BLUEPRINT COMPLETED"}
            </span>
            <h1 className="text-2xl md:text-3xl font-sans font-black text-stone-950 tracking-tight mt-3">
              {isFrench ? "Compte Rendu de Session" : "Training Session Feedback"}
            </h1>
            <p className="text-[10px] text-stone-500 mt-1 uppercase font-mono tracking-widest font-black">
              {isFrench ? "Amélioration stratégique sans score readiness" : "Qualitative feedback focuses on improvement"}
            </p>
          </div>

          <div className="bg-white border-[2.5px] border-stone-950 shadow-[5px_5px_0px_0px_#111111] rounded-[24px] p-6 md:p-8 space-y-6">
            
            {isGeneratingReview ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-10 h-10 text-stone-950 animate-spin" />
                <p className="text-xs text-stone-500 font-mono uppercase tracking-widest animate-pulse font-black">
                  {isFrench ? "Analyse constructive de votre élocution..." : "SHANA is writing your growth strategy..."}
                </p>
              </div>
            ) : reviewResult ? (
              <div className="space-y-6 animate-fade-in">
                
                {/* Strength block */}
                <div className="p-5 bg-emerald-50 border-2 border-stone-950 rounded-2xl shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] font-mono text-emerald-800 uppercase tracking-widest font-black">
                      {isFrench ? "VOTRE FORCE VÉCUE" : "CORE PRESENTATIVE STRENGTH"}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-black text-emerald-950 leading-relaxed font-sans mt-0.5">
                    {reviewResult.strength}
                  </p>
                </div>

                {/* Improvement block */}
                <div className="p-5 bg-[#FFFDEE] border-2 border-stone-950 rounded-2xl shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-[#FF7E5F]" />
                    <span className="text-[10px] font-mono text-[#FF7E5F] uppercase tracking-widest font-black">
                      {isFrench ? "AXE D’AMÉLIORATION CLÉ" : "ONE MAIN IMPROVEMENT"}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-black text-stone-900 leading-relaxed mt-0.5">
                    {reviewResult.improvement}
                  </p>
                </div>

                {/* Suggested Exercise block */}
                <div className="p-5 bg-stone-900 text-white rounded-2xl border-2 border-stone-950 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
                  <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-black block">
                    {isFrench ? "EXERCICE CONSEILLÉ POUR LA SUITE" : "RECOMMENDED NEXT WORKUP"}
                  </span>
                  <p className="text-xs text-stone-100 mt-2 italic font-bold leading-relaxed">
                    "{reviewResult.suggestedExercise}"
                  </p>
                </div>

              </div>
            ) : null}

          </div>

          {/* Bottom Actions */}
          {!isGeneratingReview && (
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleBegin}
                className="flex-1 px-6 py-4 bg-white border-2 border-stone-950 hover:bg-stone-50 text-stone-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isFrench ? "S’entraîner à Nouveau" : "Train Again"}</span>
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 px-6 py-4 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 font-black text-xs uppercase tracking-widest rounded-xl border-2 border-stone-950 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isFrench ? "Terminer et Enregistrer" : "Finish Training"}</span>
              </button>
            </div>
          )}

        </div>
      )}

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
