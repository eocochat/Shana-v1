import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Language, SessionHistoryItem } from '../types';
import { translations } from '../translations';
import { Mic, Volume2, ShieldAlert, CheckCircle, Flame, ArrowRight, Play, Square, Award, MessageSquareOff, RotateCcw, Video, VideoOff, MicOff, PhoneOff, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import PreSessionWarning from './PreSessionWarning';

interface TrainViewProps {
  user: UserProfile;
  lang: Language;
  onSessionComplete: (session: SessionHistoryItem) => void;
  onChangeTab: (tab: 'home' | 'train' | 'assessment' | 'history' | 'profile') => void;
}

export default function TrainView({ user, lang, onSessionComplete, onChangeTab }: TrainViewProps) {
  const t = translations[lang];
  
  // States: 'idle' | 'simulating' | 'completed'
  const [status, setStatus] = useState<'idle' | 'simulating' | 'completed'>('idle');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [currentMockQuestionIndex, setCurrentMockQuestionIndex] = useState(0);
  
  // Post-session outcome state
  const [sessionResult, setSessionResult] = useState<{
    score: number;
    weakness: string;
    recommendation: string;
  } | null>(null);

  // Video call environment simulation states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);

  const toggleCamera = () => {
    if (microphoneStreamRef.current) {
      const videoTracks = microphoneStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraEnabled(prev => !prev);
    }
  };

  const toggleMute = () => {
    if (microphoneStreamRef.current) {
      const audioTracks = microphoneStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  };

  const mockQuestions = lang === 'EN' ? [
    `"Can you describe your background in ${user.industry} and your preparation for the ${user.targetRole} role?"`,
    `"What are the biggest delivery challenges you've faced as a ${user.experienceLevel} professional?"`,
  ] : [
    `"Pouvez-vous décrire votre parcours dans le secteur ${user.industry} et votre motivation pour le poste de ${user.targetRole} ?"`,
    `"Quels sont les plus grands défis opérationnels auxquels vous avez dû faire face dans votre carrière ?"`,
  ];

  // Web Audio Context for real-time microphone level tracking
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [volumeHistory, setVolumeHistory] = useState<number[]>(Array(35).fill(3));
  const voiceActivityDetected = useRef<boolean>(false);

  useEffect(() => {
    let animationId: number;
    let fallbackInterval: any;

    const initMic = async () => {
      if (status !== 'simulating') return;
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: true
          });
          setIsCameraEnabled(true);
          setCameraError(false);
        } catch (videoErr) {
          console.warn("Could not acquire video stream, falling back to audio-only getUserMedia:", videoErr);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: false
          });
          setIsCameraEnabled(false);
          setCameraError(true);
        }
        
        microphoneStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          startFallback();
          return;
        }

        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.4;
        analyserNodeRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const update = () => {
          if (!analyserNodeRef.current) return;
          analyserNodeRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const level = Math.min(100, Math.round((average / 128) * 100));
          if (level > 8) {
            voiceActivityDetected.current = true;
          }

          setMicVolume(level);
          setVolumeHistory(prev => {
            const next = [...prev.slice(1), Math.max(3, level * 0.9)];
            return next;
          });

          animationId = requestAnimationFrame(update);
        };

        update();
      } catch (err) {
        console.warn("Could not access direct microphone, using responsive wave simulation:", err);
        setIsCameraEnabled(false);
        setCameraError(true);
        startFallback();
      }
    };

    const startFallback = () => {
      let angle = 0;
      fallbackInterval = setInterval(() => {
        angle += 0.2;
        // Generate a lifelike vocal frequency movement
        const base = 12;
        const wave = Math.abs(Math.sin(angle) * 25 + Math.cos(angle * 2.7) * 10);
        const finalVal = Math.round(base + wave);

        setMicVolume(finalVal);
        setVolumeHistory(prev => {
          const next = [...prev.slice(1), Math.max(3, finalVal)];
          return next;
        });
      }, 60);
    };

    if (status === 'simulating') {
      initMic();
    } else {
      cleanupMic();
      setVolumeHistory(Array(35).fill(3));
    }

    return () => {
      cleanupMic();
      if (animationId) cancelAnimationFrame(animationId);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [status]);

  const cleanupMic = () => {
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

  // Tick timer during simulation
  useEffect(() => {
    let interval: any = null;
    if (status === 'simulating') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Assign camera stream to video element
  useEffect(() => {
    if (status === 'simulating' && videoRef.current && microphoneStreamRef.current) {
      const videoTracks = microphoneStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0 && videoTracks[0].enabled) {
        try {
          videoRef.current.srcObject = microphoneStreamRef.current;
        } catch (err) {
          console.warn("Could not assign video source stream:", err);
        }
      }
    }
  }, [status, isCameraEnabled, cameraError]);

  const handleStart = () => {
    setStatus('simulating');
    voiceActivityDetected.current = false;
    setCurrentMockQuestionIndex(Math.floor(Math.random() * mockQuestions.length));
  };

  const handleStop = () => {
    // Check if the user was silent during active mic stream sessions
    const isSilent = !cameraError && !voiceActivityDetected.current;

    // Generate simulated high-fidelity metrics according to specs
    let randScore = Math.floor(Math.random() * 15) + 75; // 75-90
    let weakness = lang === 'EN' 
      ? 'Tendency to speed up during technical/system explanations.' 
      : 'Tendance à accélérer le débit lors des explications techniques compliquées.';
    let recommendation = lang === 'EN' 
      ? `Include structural pauses of 1.5 seconds. Re-anchor your breathing on strategic transitions fitting a ${user.experienceLevel} standard.`
      : `Intégrez des pauses structurées de 1,5 seconde. Rythmez votre respiration lors des transitions importantes conformément aux attentes d'un profil ${user.experienceLevel}.`;

    if (isSilent) {
      randScore = 0;
      weakness = lang === 'EN'
        ? "No speech detected. The practice turn was completed in complete silence or your microphone level was too low."
        : "Aucune parole détectée. L'entraînement s'est déroulé dans un silence complet ou le volume de votre microphone était trop faible.";
      recommendation = lang === 'EN'
        ? "Ensure your microphone is allowed and active, then speak clearly during the countdown simulation."
        : "Assurez-vous que votre microphone est autorisé et actif, puis parlez clairement pendant la simulation.";
    }

    const newSession: SessionHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'TRAIN',
      date: new Date().toLocaleDateString(lang === 'EN' ? 'en-US' : 'fr-FR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      score: randScore,
      weakness,
      recommendation,
      language: lang
    };

    setSessionResult({
      score: randScore,
      weakness,
      recommendation
    });
    
    // Save to global history
    onSessionComplete(newSession);
    setStatus('completed');
  };

  // Check for auto-complete time limit safely outside render update triggers
  useEffect(() => {
    if (status === 'simulating' && seconds >= 25) {
      handleStop();
    }
  }, [seconds, status]);

  const handleTrainAgain = () => {
    setStatus('idle');
    setSessionResult(null);
  };

  return (
    <div id="train-view" className="max-w-2xl mx-auto py-4 animate-fade-in space-y-6">
      
      {/* View Header - Hidden in focus/simulating mode to avoid clutter */}
      {status !== 'simulating' && (
        <div className="text-left">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-950 font-black bg-[#EDC154] px-3 py-1 rounded-md border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] inline-block">
            {lang === 'EN' ? "TRAIN PROTOCOL" : "PROTOCOLE D’ENTRAÎNEMENT"}
          </span>
          <h1 id="train-title" className="text-2xl md:text-3xl font-sans font-black text-stone-950 tracking-tight mt-3 uppercase">
            {t.train.title}
          </h1>
          <p id="train-subtitle" className="text-[10px] text-stone-500 mt-1 uppercase font-mono tracking-widest font-black block leading-none">
            {t.train.subtitle}
          </p>
        </div>
      )}

      {/* STRICT RULES BANNER - Hidden in focus/simulating mode */}
      {status !== 'simulating' && (
        <div id="train-warnings" className="bg-white border-2 border-stone-950 rounded-2xl p-5 flex items-start gap-3.5 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
          <div className="p-1.5 bg-[#A5B4FC] border border-stone-950 rounded-lg text-stone-950">
            <MessageSquareOff className="w-5 h-5 shrink-0" />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="text-[11px] font-black text-stone-950 uppercase tracking-widest">
              {lang === 'EN' ? "STRICT VOICE INTERFACE PROTOCOLS" : "PROTOCOLE AUDIO RECRUTEUR STRICT"}
            </h4>
            <p className="text-[#6B7280] text-xs leading-relaxed font-semibold">
              {t.train.warningCamera}
            </p>
          </div>
        </div>
      )}

      {/* ACTIVE DISPLAY SECTION */}
      {status === 'idle' && (
        <div id="train-panel-idle" className="bg-white border-2 border-stone-950 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] rounded-[32px] p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 bg-stone-50 border-2 border-stone-950 flex items-center justify-center rounded-full text-stone-950 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
            <Mic className="w-6 h-6 stroke-[2.5]" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-sans font-black text-xl text-stone-950 uppercase tracking-tight">
              {lang === 'EN' ? "Ready to simulate?" : "Prêt à simuler l'entretien ?"}
            </h3>
            <p className="text-stone-500 text-xs max-w-sm mx-auto leading-relaxed font-semibold">
              {lang === 'EN' 
                ? `SHANA will generate specific questions tuned to the ${user.targetRole} role within your industry domain.` 
                : `SHANA générera des questions spécifiques liées à votre rôle de ${user.targetRole} dans le secteur ${user.industry}.`}
            </p>
          </div>

          <button
            id="train-btn-start"
            onClick={() => setShowWarningModal(true)}
            className="px-8 py-4 bg-[#18633F] hover:bg-[#1f7c50] text-white font-black text-xs uppercase tracking-widest rounded-xl border-2 border-stone-950 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white stroke-none" />
            {t.train.startBtn}
          </button>
        </div>
      )}

      {status === 'simulating' && (
        <div id="train-panel-simulating" className="w-full max-w-4xl mx-auto py-2 animate-fade-in space-y-6">
          {/* Top Info Strip: Call status indicator & session time */}
          <div className="flex justify-between items-center bg-[#EDC154] text-stone-950 px-5 py-3 rounded-2xl border-2 border-stone-950 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0 border border-stone-950" />
              <span className="text-[10px] sm:text-xs font-mono font-black tracking-wider uppercase">
                {lang === 'EN' ? "LIVE INTERVIEW CALL PROTOCOL" : "ENTRETIEN EN DIRECT D'ENTRAÎNEMENT"}
              </span>
            </div>
            
            <div className="font-mono text-xs sm:text-sm font-black bg-white border-2 border-stone-950 px-3 py-1 rounded-lg">
              {lang === 'EN' ? "DURATION" : "DURÉE"} : {seconds}s
            </div>
          </div>

          {/* Real-Call Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Interviewer Frame (SHANA) */}
            <div className="bg-zinc-950 border-2 border-stone-950 rounded-3xl p-5 aspect-video relative flex flex-col items-center justify-center overflow-hidden shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] group">
              {/* Radial gradient background to look modern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,196,48,0.15)_0%,transparent_70%)] pointer-events-none" />
              
              {/* Interviewer Avatar */}
              <div className="relative flex items-center justify-center">
                {/* Ripple waves effect */}
                <span className="absolute w-24 h-24 rounded-full border-2 border-[#EDC154]/20 animate-ping opacity-60 pointer-events-none" />
                <span className="absolute w-18 h-18 rounded-full border-2 border-[#EDC154]/30 animate-pulse pointer-events-none" />
                
                <div className="w-16 h-16 rounded-full bg-[#1A2B3C] border-2 border-stone-950 text-white flex items-center justify-center shadow-lg relative z-10 font-black text-lg">
                  S
                </div>
              </div>

              {/* Speaking waveform visual aid */}
              <div className="mt-4 flex gap-1.5 h-5 items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className="w-1.5 bg-[#EDC154] rounded-full border border-stone-950 animate-pulse"
                    style={{
                      height: `${Math.max(4, Math.sin(seconds * 1.5 + i) * 16 + 8)}px`,
                      animationDelay: `${i * 150}ms`
                    }}
                  />
                ))}
              </div>

              <div className="mt-2 text-center z-10">
                <span className="text-xs font-black text-zinc-300 block">SHANA</span>
                <span className="text-[10px] text-yellow-400 font-mono tracking-wider uppercase block mt-0.5 font-bold">
                  {lang === 'EN' ? "Interviewer" : "Recruteuse AI"}
                </span>
              </div>

              {/* Feed overlay badge */}
              <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1 rounded-full border border-zinc-800 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 bg-emerald-500 rounded-full border border-stone-950" />
                <span className="text-[9px] font-mono font-bold text-white uppercase tracking-wider">
                  {lang === 'EN' ? "AI FEED ACTIVE" : "FLUX AI ACTIF"}
                </span>
              </div>
            </div>

            {/* 2. Candidate Frame (You) */}
            <div className="bg-zinc-950 border-2 border-stone-950 rounded-3xl aspect-video relative flex flex-col items-center justify-center overflow-hidden shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] group">
              {isCameraEnabled && !cameraError ? (
                <>
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  />
                  
                  {/* Camera overlay gradient to make label visible */}
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </>
              ) : (
                <div className="text-center p-4 space-y-3 z-10">
                  <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-400 border border-zinc-700 font-bold text-sm">
                    {user.name.split(' ').map(n => n[0]).join('') || 'C'}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-300 block">
                      {user.name}
                    </span>
                    <span className="text-[9px] text-zinc-500 block font-mono">
                      {cameraError 
                        ? (lang === 'EN' ? "Camera disabled/unavailable" : "Caméra désactivée/indisponible") 
                        : (lang === 'EN' ? "Camera Feed Off" : "Flux vidéo coupé")}
                    </span>
                  </div>
                </div>
              )}

              {/* Mini Microphone Volume Waveform overlay on user card */}
              <div className="absolute bottom-4 right-4 bg-black/80 px-2.5 py-1.5 rounded-xl border border-zinc-800 flex items-center gap-2 shadow-sm z-20">
                <div className="flex gap-0.5 h-3 items-end">
                  {[...Array(4)].map((_, i) => {
                    const level = isMuted ? 3 : Math.max(3, (micVolume / 100) * 12 * (0.5 + Math.random() * 0.5));
                    return (
                      <span
                        key={i}
                        className={`w-1 rounded-full transition-all duration-75 border border-stone-950 ${isMuted ? 'bg-red-400' : 'bg-[#A7F3D0]'}`}
                        style={{ height: `${level}px` }}
                      />
                    );
                  })}
                </div>
                <span className="text-[9px] font-mono font-bold text-white">
                  {isMuted ? (lang === 'EN' ? "MUTED" : "MUET") : `${micVolume}%`}
                </span>
              </div>

              {/* Feed overlay badge */}
              <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1 rounded-full border border-zinc-800 flex items-center gap-1.5 shadow-sm">
                <span className={`w-2 h-2 rounded-full border border-stone-950 ${isMuted ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span className="text-[9px] font-mono font-bold text-white uppercase tracking-wider">
                  {lang === 'EN' ? "CANDIDATE FEED" : "FLUX CANDIDAT"}
                </span>
              </div>
            </div>

          </div>

          {/* Subtitles / Closed Captions bar overlay */}
          {showCaptions && (
            <div className="bg-stone-50 p-4 rounded-2xl border-2 border-stone-950 text-left max-w-2xl mx-auto shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
              <span className="text-[9px] font-mono tracking-widest uppercase text-stone-950 font-black block mb-1">
                {lang === 'EN' ? "CLOSED CAPTIONS (LIVE TRANSCRIPT)" : "SOUS-TITRES (TRANSCRIPTION EN DIRECT)"}
              </span>
              <p className="text-sm font-sans font-semibold text-stone-900 leading-relaxed">
                <strong className="text-stone-950 font-black">SHANA: </strong> 
                {mockQuestions[currentMockQuestionIndex]}
              </p>
            </div>
          )}

          {/* Google Meet / Teams Styled Control Dock */}
          <div className="flex flex-col items-center justify-center space-y-4 pt-4">
            
            {/* Round floating dock buttons */}
            <div className="flex items-center gap-4 bg-white border-2 border-stone-950 px-6 py-3 rounded-full shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
              {/* Mic Toggle Button */}
              <button
                type="button"
                onClick={toggleMute}
                className={`p-3 rounded-full border-2 border-stone-950 cursor-pointer transition-all active:scale-95 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] ${
                  isMuted 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-white text-stone-950 hover:bg-stone-100'
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                id="call-mic-toggle"
              >
                {isMuted ? <MicOff className="w-5 h-5 stroke-[2.5]" /> : <Mic className="w-5 h-5 stroke-[2.5]" />}
              </button>

              {/* Camera Toggle Button */}
              <button
                type="button"
                onClick={toggleCamera}
                className={`p-3 rounded-full border-2 border-stone-950 cursor-pointer transition-all active:scale-95 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] ${
                  !isCameraEnabled || cameraError
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-white text-stone-950 hover:bg-stone-100'
                }`}
                title={isCameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
                disabled={cameraError}
                id="call-camera-toggle"
              >
                {!isCameraEnabled || cameraError ? <VideoOff className="w-5 h-5 stroke-[2.5]" /> : <Video className="w-5 h-5 stroke-[2.5]" />}
              </button>

              {/* Closed Captions Toggle */}
              <button
                type="button"
                onClick={() => setShowCaptions(prev => !prev)}
                className={`p-3 rounded-full border-2 border-stone-950 cursor-pointer transition-all active:scale-95 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] ${
                  showCaptions 
                    ? 'bg-[#A5B4FC] text-stone-950 hover:bg-[#818cf8]' 
                    : 'bg-white text-stone-950 hover:bg-stone-100'
                }`}
                title={showCaptions ? "Hide Captions" : "Show Captions"}
                id="call-captions-toggle"
              >
                <MessageSquareOff className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Red End Call Button */}
              <button
                type="button"
                onClick={handleStop}
                className="p-3.5 bg-red-600 text-white rounded-full border-2 border-stone-950 hover:bg-red-700 transition-all active:scale-95 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] cursor-pointer"
                title={lang === 'EN' ? "End Call & Generate Feedback" : "Raccrocher et Évaluer"}
                id="call-end-btn"
              >
                <PhoneOff className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <p className="text-[10px] text-stone-500 font-mono tracking-wider uppercase font-black flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-stone-700 stroke-[2.5]" />
              <span>{lang === 'EN' ? "Simulated Professional call environment" : "Environnement de téléconférence professionnelle simulée"}</span>
            </p>
          </div>
        </div>
      )}

      {status === 'completed' && sessionResult && (
        <div id="train-panel-completed" className="space-y-6 animate-fade-in">
          
          {/* Main Results Card */}
          <div className="bg-white border-2 border-stone-950 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] rounded-[32px] p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b-2 border-stone-950 pb-4">
              <h2 id="train-results-title" className="text-xs font-sans font-black text-stone-950 tracking-widest uppercase flex items-center gap-1.5">
                <CheckCircle className="w-5 h-5 text-[#18633F] stroke-[2.5]" />
                {t.train.outputTitle}
              </h2>
              <span className="font-mono text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest">
                {lang === 'EN' ? "YIELD REPORT" : "RAPPORT GÉNÉRÉ"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Score Metric */}
              <div id="metric-score" className="p-4 bg-stone-50 border-2 border-stone-950 rounded-2xl flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider font-black">{t.train.score}</span>
                <span id="evaluated-score" className="text-3xl font-sans font-black text-stone-950 mt-2 block">
                  {sessionResult.score}/100
                </span>
                <span className="text-[9px] text-stone-400 mt-1 font-mono font-black">{lang === 'EN' ? "VOICE DELIVERY" : "ÉLOCUTION AUDIO"}</span>
              </div>

              {/* Weakness Alert Box */}
              <div id="metric-weakness" className="p-4 bg-[#EDC154]/10 border-2 border-stone-950 rounded-2xl col-span-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                <span className="text-[10px] font-mono text-amber-850 uppercase tracking-widest font-black">{t.train.weakness}</span>
                <p id="evaluated-weakness" className="text-xs font-bold text-stone-950 mt-2 leading-relaxed">
                  {sessionResult.weakness}
                </p>
              </div>

            </div>

            {/* Recommendation block */}
            <div id="metric-recommendation" className="p-5 bg-stone-950 text-white rounded-2xl shadow-inner border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
              <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest font-black block">{sessionResult.score === 100 ? "Advice" : t.train.recommendation}</span>
              <p id="evaluated-recommendation" className="text-xs text-slate-200 leading-relaxed mt-2 italic font-semibold">
                "{sessionResult.recommendation}"
              </p>
            </div>
          </div>

          {/* Double Mandatory outcomes: Train Again OR Ready for Assessment */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              id="train-btn-retry"
              onClick={handleTrainAgain}
              className="flex-1 px-6 py-4 bg-white border-2 border-stone-950 hover:bg-stone-50 text-stone-950 font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              {t.train.trainAgain}
            </button>

            <button
              id="train-btn-goto-assess"
              onClick={() => onChangeTab('assessment')}
              className="flex-1 px-6 py-4 bg-[#18633F] hover:bg-[#1f7c50] text-white font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]"
            >
              {t.train.readyForAssess}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      <PreSessionWarning
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={() => {
          setShowWarningModal(false);
          handleStart();
        }}
        lang={lang}
      />
    </div>
  );
}
