import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Trash2, 
  Upload, 
  Mic, 
  FileAudio, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Loader2, 
  ArrowRight,
  TrendingUp,
  Volume2,
  ListFilter,
  Layers,
  HelpCircle,
  Download
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { jsPDF } from 'jspdf';
import { StorageService } from '../lib/storage';
import { useMilestoneTracker } from './Toast';

interface AudioAnalyzerProps {
  lang: Language;
  profile: UserProfile;
}

interface AnalysisResult {
  transcript: string;
  toneAnalysis: string;
  clarityAnalysis: string;
  keywordAnalysis: string;
  score: number;
  actionableTips: string[];
  method: string;
}

export default function AudioAnalyzer({ lang, profile }: AudioAnalyzerProps) {
  const isFr = lang === 'FR';
  const session = StorageService.getSession();
  const { checkMilestones } = useMilestoneTracker(session?.user?.id || null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  // File upload states
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Optional manual text feedback fallback
  const [textFallback, setTextFallback] = useState('');

  // API Call States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Web Audio Context & Animation refs for Waveform Visualizer
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 1.8;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height * 0.9;
        if (barHeight < 3) barHeight = 3;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#10B981');
        gradient.addColorStop(0.5, '#34D399');
        gradient.addColorStop(1, '#1A2B3C');

        ctx.fillStyle = gradient;

        const yPos = (height - barHeight) / 2;
        
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(x, yPos, Math.max(1.5, barWidth - 2), barHeight, 3);
        } else {
          ctx.rect(x, yPos, Math.max(1.5, barWidth - 2), barHeight);
        }
        ctx.fill();

        x += barWidth;
      }
    };

    draw();
  };

  // Local storage logs of user assessments
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // Load analysis history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`shana_vocal_analysis_logs_${profile.email || 'common'}`);
      if (stored) {
        setHistoryLogs(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not load analysis records", e);
    }
  }, [profile.email]);

  // Handle timer for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Clean elements on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Live recording management
  const handleStartRecording = async () => {
    try {
      chunksRef.current = [];
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const options = { mimeType: 'audio/webm' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream); // fallback for standard browser support
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        try {
          const base64 = await blobToBase64(blob);
          setAudioBase64(base64);
        } catch (base64Err) {
          console.error("Base64 audio encoding failed:", base64Err);
        }

        // Clean up tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Cessation of real-time visualizer loops
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (audioCtxRef.current) {
          if (audioCtxRef.current.state !== 'closed') {
            audioCtxRef.current.close().catch(() => {});
          }
          audioCtxRef.current = null;
        }
        analyserRef.current = null;
      };

      // Set up real-time voice signal Web Audio Analyser
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64; // Responsive bar count for voice speech
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioCtxRef.current = audioCtx;
          analyserRef.current = analyser;

          setTimeout(() => {
            drawWaveform();
          }, 60);
        }
      } catch (audioCtxError) {
        console.warn("Could not set up Web Audio analyser:", audioCtxError);
      }

      mediaRecorderRef.current = recorder;
      recorder.start(250); // capture audio data frequently
      setIsRecording(true);
      setRecordingSeconds(0);
      setAudioUrl(null);
      setAudioBlob(null);
      setAudioBase64(null);
      setUploadedFileName(null);
      setApiError(null);
    } catch (err: any) {
      console.error("Media Device acquisition failed:", err);
      setApiError(isFr 
        ? "Impossible d'accéder au micro. Veuillez vérifier vos autorisations ou charger un fichier audio directement."
        : "Microphone access denied or unavailable. Please review permissions or upload a file.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  };

  // Manual File Upload management
  const processUploadedFile = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      setApiError(isFr 
        ? "Seuls les fichiers audio (.webm, .wav, .mp3, .m4a) sont acceptés."
        : "Invalid format. Please supply an audio file (.webm, .wav, .mp3, or .m4a).");
      return;
    }

    setApiError(null);
    setUploadedFileName(file.name);
    setAudioUrl(URL.createObjectURL(file));
    setAudioBlob(file);

    try {
      const base64 = await blobToBase64(file);
      setAudioBase64(base64);
    } catch (base64Err) {
      console.error("Failed to convert file to Base64:", base64Err);
      setApiError(isFr ? "Erreur de conversion audio." : "Audio file processing failed.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setAudioBase64(null);
    setUploadedFileName(null);
    setRecordingSeconds(0);
    setApiError(null);
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    try {
      const doc = new jsPDF();
      
      // Document Metadata
      doc.setProperties({
        title: isFr ? "SHANA Rapport de Performance Vocale" : "SHANA Speech Competence Assessment",
        subject: "Interview Performance Evaluation",
        author: "SHANA Cognitive Engine"
      });

      let y = 20;
      const marginX = 20;
      const maxW = 170;
      const primaryColor = [26, 43, 60]; // slate dark #1A2B3C
      const accentColor = [16, 185, 129]; // emerald #10B981
      const textColor = [75, 85, 99]; // gray #4B5563

      const addWrappedText = (text: string, x: number, currY: number, lineH: number): number => {
        const lines = doc.splitTextToSize(text, maxW);
        let currentY = currY;
        for (let i = 0; i < lines.length; i++) {
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(lines[i], x, currentY);
          currentY += lineH;
        }
        return currentY;
      };

      // 1. Header Banner Box
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, 15, 180, 28, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(isFr ? "RAPPORT D'ASSESSMENT VOCAL SHANA" : "SHANA COGNITIVE SPEECH ASSESSMENT", 20, 26);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      const timestamp = new Date().toLocaleString(isFr ? 'fr-FR' : 'en-US');
      doc.text(`${isFr ? "Généré le" : "Generated on"} ${timestamp} | ${isFr ? "Sécurisé" : "Secure"} HTTPS`, 20, 33);

      // Meta credentials block
      y = 52;
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(isFr ? "ID PROFIL CANDIDAT :" : "CANDIDATE CONTEXT PROFILE:", marginX, y);
      
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`${isFr ? "Rôle Visé :" : "Target Role:"} ${profile.targetRole || "Candidate"}`, marginX, y);
      doc.text(`${isFr ? "Secteur :" : "Industry:"} ${profile.industry || "Corporate"}`, 110, y);
      
      y += 5;
      doc.text(`${isFr ? "Email Associé :" : "Profile Email:"} ${profile.email || "common@shana.ai"}`, marginX, y);
      doc.text(`${isFr ? "Langue d'évaluation :" : "Language Evaluation:"} ${isFr ? "Français" : "English"}`, 110, y);

      // 2. Score Badge callout
      y += 12;
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(15, y, 180, 20, 3, 3, 'F');
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(isFr ? "INDICATEUR DE COMPÉTENCE DU DISCOURS :" : "VOCAL COMPETENCE INDEX SCORE:", 20, y + 12);
      
      doc.setFontSize(18);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(`${result.score}%`, 160, y + 13);

      // 3. Oral Transcript Section
      y += 30;
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(isFr ? "TRANSCRIPTION DE VOTRE ÉPISODE VOCAL" : "TRANSCRIBED VOCAL UTTERANCE:", marginX, y);
      
      y += 7;
      doc.setFont("helvetica", "oblique");
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const trans = result.transcript || (isFr ? "[Aucune transcription saisie]" : "[No vocal transcript parsed]");
      y = addWrappedText(`"${trans}"`, marginX, y, 5);

      // 4. Detailed Facet breakdowns
      y += 10;
      if (y > 250) { doc.addPage(); y = 20; }
      
      // Category 1: Tone
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(marginX, y, 3, 5, 'F');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(isFr ? "1. ANALYSE DU TON & DE LA VOLUBILITÉ" : "1. TONE & VOCAL DELIVERY REVIEW", marginX + 6, y + 4);
      
      y += 9;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      y = addWrappedText(result.toneAnalysis, marginX, y, 5);

      // Category 2: Clarity
      y += 8;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(marginX, y, 3, 5, 'F');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(isFr ? "2. CLARTÉ DE L'ÉLOCUTION & MOTS SUPPLETIFS" : "2. SPEECH CLARITY & FLOW DENSITY", marginX + 6, y + 4);
      
      y += 9;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      y = addWrappedText(result.clarityAnalysis, marginX, y, 5);

      // Category 3: Keywords
      y += 8;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFillColor(67, 56, 202); // indigo
      doc.rect(marginX, y, 3, 5, 'F');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(isFr ? "3. INTÉGRATION TERMINOLOGIQUE & MÉTHODE STAR" : "3. KEYWORD DENSITY & STRUCTURAL FORMULATION (STAR)", marginX + 6, y + 4);
      
      y += 9;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      y = addWrappedText(result.keywordAnalysis, marginX, y, 5);

      // Category 4: Actionable Tips
      if (result.actionableTips && result.actionableTips.length > 0) {
        y += 10;
        if (y > 240) { doc.addPage(); y = 20; }
        
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(isFr ? "CONSEILS DE PERFECTIONNEMENT PRATIQUES :" : "STRATEGIC RECOMMENDATIONS FOR IMPROVEMENT:", marginX, y);
        
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        result.actionableTips.forEach((tip, index) => {
          if (y > 275) { doc.addPage(); y = 20; }
          y = addWrappedText(`[${index + 1}] ${tip}`, marginX, y, 5);
          y += 3;
        });
      }

      // Elegant Footer across bottom
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("SHANA COGNITIVE EVALUATION SUITE  •  CONFIDENTIAL AND PERSONALIZED FOR SUITE SUBSCRIBERS", marginX, 287);

      doc.save(`shana_vocal_report_${profile.targetRole?.replace(/\s+/g, '_') || 'candidate'}.pdf`);
      checkMilestones({ isDownload: true });
    } catch (pdfErr) {
      console.error("PDF generation aborted:", pdfErr);
      setApiError(isFr 
        ? "Impossible de générer le fichier PDF. Essayez à nouveau." 
        : "Failed to assemble PDF document. Please retry.");
    }
  };

  // Launch AI speech evaluation call
  const handleAnalyze = async () => {
    if (isAnalyzing) return;
    if (!audioBase64 && !textFallback.trim()) {
      setApiError(isFr 
        ? "Veuillez enregistrer votre voix, charger un fichier audio ou entrer un texte d'évaluation."
        : "Please record your voice, upload an audio clip, or type some answers first.");
      return;
    }

    setIsAnalyzing(true);
    setApiError(null);

    try {
      const payload = {
        audio: audioBase64,
        filename: uploadedFileName || (audioBlob ? "live_recording.webm" : null),
        language: lang,
        targetRole: profile.targetRole,
        industry: profile.industry,
        textFallback: textFallback.trim() || undefined
      };

      const response = await fetch('/api/analyze-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const json = await response.json();
      setResult(json);
      checkMilestones({ score: json.score });

      // Save to tracking history list
      const savedItem = {
        id: 'ana_' + Math.random().toString(36).substring(3, 11),
        date: new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        role: profile.targetRole,
        score: json.score,
        transcriptSnippet: json.transcript ? json.transcript.substring(0, 65) + '...' : 'Speech verified'
      };

      const updatedLogs = [savedItem, ...historyLogs].slice(0, 5); // keep last 5
      setHistoryLogs(updatedLogs);
      localStorage.setItem(`shana_vocal_analysis_logs_${profile.email || 'common'}`, JSON.stringify(updatedLogs));

    } catch (err: any) {
      console.error(err);
      setApiError(isFr 
        ? "Une erreur est survenue lors de l'analyse du signal audio. Veuillez réessayer."
        : "Speech evaluation failed. Please verify API configuration and retry.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="audio-analyzer-module" className="bg-white border border-[#E5E7EB] rounded-[32px] p-6 shadow-sm space-y-6 hover:border-[#1A2B3C]/10 transition-all">
      
      {/* Module Title Section */}
      <div className="flex justify-between items-start border-b border-[#F3F4F6] pb-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A2B3C] font-bold bg-[#1A2B3C]/5 px-2 py-0.5 rounded border border-[#1A2B3C]/15 leading-tight inline-block mb-1">
            {isFr ? "ENGINE D'ANALYSE VOCALE" : "VOCAL ANALYSIS COGNITIVE ENGINE"}
          </span>
          <h3 className="text-sm font-sans font-black text-[#1A2B3C] uppercase tracking-wide flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#10B981] animate-pulse" />
            {isFr ? "Évaluateur de Ton, Clarté & Mots-Clés" : "Speech Tone, Clarity & Keyword Analyzer"}
          </h3>
          <p className="text-[10.5px] text-[#6B7280] font-medium leading-relaxed">
            {isFr 
              ? "Enregistrez-vous ou téléversez un audio pour évaluer immédiatement l'impact de votre élocution."
              : "Upload an audio file or record speech to instantly evaluate confidence metrics and structural vocabulary."}
          </p>
        </div>
      </div>

      {/* Primary Split interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Input controls (Live Record or File Upload) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Section Subtitle */}
          <span className="text-[10px] font-mono text-[#9CA3AF] uppercase tracking-widest font-extrabold block">
            {isFr ? "Étape 1 : Saisie de la voix" : "Step 1: Capture Voice Input"}
          </span>

          {/* Interactive Recording Panel */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-4">
            
            {/* Live Recorder View */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1A2B3C] uppercase tracking-wide flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-rose-500" />
                {isFr ? "Enregistrement Microphone" : "Direct Vocal Capture"}
              </span>

              {isRecording && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-150 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 block" />
                  <span className="font-mono text-[10px] font-extrabold text-rose-700">{formatTime(recordingSeconds)}</span>
                </div>
              )}
            </div>

            {/* Real-time Web Audio Visualizer Wave Canvas */}
            {isRecording && (
              <div className="bg-[#1A2B3C]/5 border border-[#1A2B3C]/10 rounded-xl p-3 flex flex-col items-center justify-center space-y-2 animate-fade-in">
                <canvas 
                  ref={canvasRef} 
                  width={340} 
                  height={50} 
                  className="w-full h-12 rounded-lg"
                />
                
                {/* Simulated CSS bars backup in case Canvas drawing has quiet/permission restriction */}
                <div className="flex items-center justify-center gap-1 h-3">
                  <span className="w-1 h-3.5 bg-[#10B981] rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-1 h-3 bg-[#34D399] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-4 bg-[#10B981] rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="w-1 h-3 bg-[#34D399] rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="w-1 h-2 bg-[#1A2B3C]/30 rounded-full mx-1" />
                  <span className="text-[9px] font-mono font-bold text-[#1A2B3C] uppercase tracking-widest leading-none">
                    {isFr ? "SIGNAL ACTIF" : "SIGNAL CAPTURING"}
                  </span>
                  <span className="w-1 h-2 bg-[#1A2B3C]/30 rounded-full mx-1" />
                  <span className="w-1 h-3 bg-[#10B981] rounded-full animate-bounce [animation-delay:0.5s]" />
                  <span className="w-1 h-4 bg-[#34D399] rounded-full animate-bounce [animation-delay:0.6s]" />
                  <span className="w-1 h-3 bg-[#10B981] rounded-full animate-bounce [animation-delay:0.7s]" />
                  <span className="w-1 h-3.5 bg-[#34D399] rounded-full animate-bounce [animation-delay:0.8s]" />
                </div>
              </div>
            )}

            {/* Recorder Buttons Controller */}
            <div className="flex gap-2.5 items-center">
              {!isRecording ? (
                <button
                  id="btn-voice-start-record"
                  type="button"
                  onClick={handleStartRecording}
                  disabled={isAnalyzing}
                  className="flex-1 py-3 px-4 bg-[#1A2B3C] text-white hover:bg-slate-800 disabled:opacity-50 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Mic className="w-3.5 h-3.5 text-[#10B981]" />
                  {isFr ? "Démarrer" : "Start Live Record"}
                </button>
              ) : (
                <button
                  id="btn-voice-stop-record"
                  type="button"
                  onClick={handleStopRecording}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm animate-pulse"
                >
                  <Square className="w-3.5 h-3.5" />
                  {isFr ? "Arrêter" : "Stop Recording"}
                </button>
              )}

              {audioUrl && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-3 bg-white hover:bg-rose-50 text-[#6B7280] hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer active:scale-95"
                  title={isFr ? "Réinitialiser" : "Clear Source"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Micro Timer & playback elements */}
            {audioUrl && (
              <div className="pt-2 border-t border-slate-200/60 space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 block">
                  {isFr ? "AUDIO ENREGISTRÉ (ÉCOUTE) :" : "CAPTURED AUDIO PLAYBACK:"}
                </span>
                <audio src={audioUrl} controls className="w-full h-8 outline-none" />
              </div>
            )}
          </div>

          {/* Drag & Drop File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all relative ${
              isDragging 
                ? 'border-[#10B981] bg-[#10B981]/5' 
                : uploadedFileName 
                  ? 'border-[#1A2B3C] bg-indigo-50/10' 
                  : 'border-[#E5E7EB] hover:border-slate-400 bg-white'
            }`}
          >
            <input
              type="file"
              accept="audio/*"
              id="audio-file-input"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={handleFileChange}
              disabled={isRecording || isAnalyzing}
            />

            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-500">
                <Upload className="w-5 h-5 text-[#6B7280]" />
              </div>

              {uploadedFileName ? (
                <div>
                  <span className="text-xs font-black text-[#1A2B3C] tracking-wide block truncate max-w-[200px]">
                    {uploadedFileName}
                  </span>
                  <p className="text-[9px] font-mono text-[#10B981] mt-0.5 font-bold uppercase">
                    {isFr ? "Fichier Audio Chargé" : "Audio File Stage Ready"}
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-bold text-[#1F2937] tracking-tight block">
                    {isFr ? "Glissez un fichier ou cliquez ici" : "Drag & Drop Audio Files Here"}
                  </span>
                  <p className="text-[9px] font-mono text-[#9CA3AF] mt-0.5 font-bold uppercase">
                    {isFr ? "Format standard audio (mp3, wav, webm)" : "Supports standard audio layouts"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Text input backup description */}
          <div className="space-y-1">
            <label className="text-[9.5px] font-mono text-[#6B7280] uppercase tracking-wide block font-bold">
              {isFr ? "Saisie Complémentaire / Secours (Optionnel)" : "Manual Transcript Fallback (Optional)"}
            </label>
            <textarea
              value={textFallback}
              onChange={(e) => setTextFallback(e.target.value)}
              placeholder={isFr 
                ? "Saisissez ou collez votre argumentaire ici..." 
                : "Type or paste your oral response draft if microphone behaves poorly..."}
              className="w-full text-xs p-3 border border-[#E5E7EB] rounded-xl focus:border-[#1A2B3C] focus:ring-1 focus:ring-[#1A2B3C]/20 bg-white placeholder:text-gray-400 h-20 outline-none resize-none"
            />
          </div>

          {/* Launch Trigger Button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || isRecording || (!audioBase64 && !textFallback.trim())}
            className="w-full py-3.5 bg-[#10B981] hover:bg-emerald-600 disabled:bg-[#9CA3AF] disabled:opacity-50 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl shadow-sm text-center flex items-center justify-center gap-2 cursor-pointer border-none transition-all active:scale-95"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{isFr ? "Analyse en Cours (IA)..." : "Analyzing Signal..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>{isFr ? "Lancer l'Analyse IA" : "Evaluate Spoken Speech"}</span>
              </>
            )}
          </button>

          {apiError && (
            <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl flex gap-2 text-rose-700 text-[10.5px] font-semibold leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
              <p>{apiError}</p>
            </div>
          )}

          {/* Quick Logs list */}
          {historyLogs.length > 0 && (
            <div className="pt-3 border-t border-[#F3F4F6] space-y-1.5">
              <span className="text-[9px] font-mono text-[#9CA3AF] uppercase block font-extrabold tracking-widest">
                {isFr ? "Historique des Analyses" : "Recent Evaluations History"}
              </span>
              <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1">
                {historyLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center bg-[#F9FAFB] p-1.5 rounded-lg border border-[#E5E7EB] text-[10px]">
                    <span className="text-[#6B7280] font-mono leading-tight font-semibold block truncate max-w-[130px]">{log.date}</span>
                    <span className="font-mono text-[#1A2B3C] font-black">{log.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right column: Results Visualization Panel */}
        <div className="lg:col-span-7">
          <div className="bg-slate-50/50 rounded-2xl border border-slate-150 p-5 min-h-[460px] flex flex-col justify-between">
            {result ? (
              <div className="space-y-5 animate-fade-in">
                
                {/* Result Heading Metric */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-4">
                  <div>
                    <span className="text-[9.5px] font-mono text-[#10B981] uppercase tracking-wider font-extrabold block">
                      {isFr ? "ANALYSE COGNITIVE COMPLÈTE" : "COGNITIVE OUTCOMES SCORE CARD"}
                    </span>
                    <h4 className="text-xs font-black text-[#1A2B3C] uppercase tracking-tight mt-0.5">
                      {isFr ? "Indice de Qualité Orale" : "Vocal Impact Competence Index"}
                    </h4>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto">
                    {/* Download PDF button */}
                    <button
                      id="btn-download-pdf-report"
                      type="button"
                      onClick={handleDownloadPDF}
                      className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-[#4338CA] text-[10.5px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      title={isFr ? "Télécharger le rapport PDF" : "Download PDF summary report"}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isFr ? "PDF" : "Download PDF"}</span>
                    </button>

                    {/* High contrast score circle indicator */}
                    <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                      <span className="font-mono text-xl font-black text-[#1A2B3C] tracking-tighter">
                        {result.score}%
                      </span>
                      <div className="w-6 h-6 rounded-full border-2 border-[#10B981] flex items-center justify-center font-mono text-[9px] font-black text-[#10B981]">
                        {result.score >= 80 ? 'A+' : result.score >= 70 ? 'B' : 'C'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main evaluated facets stack */}
                <div className="space-y-4">
                  
                  {/* Transcript parsed section */}
                  {result.transcript && (
                    <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl space-y-1">
                      <span className="text-[9px] font-mono font-extrabold tracking-wider text-slate-400 block uppercase">
                        {isFr ? "Transcription Textuelle" : "Speech Transcript Checked"}
                      </span>
                      <p className="text-[11px] text-[#4B5563] italic leading-relaxed font-medium">
                        "{result.transcript}"
                      </p>
                    </div>
                  )}

                  {/* 1. Tone Feedback */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[#1A2B3C]">
                      <Volume2 className="w-4 h-4 text-[#1A2B3C]" />
                      <span className="text-[10px] font-sans font-black uppercase tracking-wide">
                        {isFr ? "Analyse du Ton & Volubilité" : "Speech Tone & Vocal Delivery"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4B5563] font-medium leading-relaxed bg-white p-3 rounded-xl border border-[#E5E7EB]">
                      {result.toneAnalysis}
                    </p>
                  </div>

                  {/* 2. Clarity Feedback */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[#10B981]">
                      <CheckCircle className="w-4 h-4 text-[#10B981]" />
                      <span className="text-[10px] font-sans font-black uppercase tracking-wide">
                        {isFr ? "Clarté de l'Élocution & Hesitations" : "Clarity, Speed & Fillers"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4B5563] font-medium leading-relaxed bg-white p-3 rounded-xl border border-[#E5E7EB]">
                      {result.clarityAnalysis}
                    </p>
                  </div>

                  {/* 3. Keyword feedback */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[#4338CA]">
                      <Layers className="w-4 h-4 text-[#4338CA]" />
                      <span className="text-[10px] font-sans font-black uppercase tracking-wide">
                        {isFr ? "Intégration Terminologique & Méthode STAR" : "Keyword Density & STAR Formulation"}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#4B5563] font-medium leading-relaxed bg-white p-3 rounded-xl border border-[#E5E7EB] space-y-2">
                      <p>{result.keywordAnalysis}</p>
                      
                      {/* Interactive Keyword badging tags based on content */}
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                        {['star', 'situation', 'task', 'action', 'result', 'impact', 'metric', 'kpi'].map((k) => {
                          const hasKw = new RegExp(k, 'i').test(result.transcript || '');
                          return (
                            <span 
                              key={k} 
                              className={`text-[8.5px] font-mono uppercase px-1.5 py-0.5 rounded font-extrabold border leading-none ${
                                hasKw 
                                  ? 'bg-[#10B981]/5 border-[#10B981]/25 text-[#10B981]' 
                                  : 'bg-gray-50 border-gray-150 text-gray-400'
                              }`}
                            >
                              {k} {hasKw ? '✔' : '✖'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 4. Actionable tips list */}
                  {result.actionableTips && result.actionableTips.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-[#9CA3AF] uppercase tracking-wider font-extrabold block">
                        {isFr ? "Conseils de Perfectionnement" : "Actionable Spoken Improvements"}
                      </span>
                      <ul className="space-y-1 pl-1">
                        {result.actionableTips.map((tip, index) => (
                          <li key={index} className="text-[10.5px] font-semibold text-[#4B5563] flex gap-2 items-start">
                            <span className="font-mono text-[#10B981] font-black select-none">[{index + 1}]</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-3">
                <div className="p-4 bg-white border border-[#E5E7EB] rounded-full text-slate-400 shadow-sm">
                  <FileAudio className="w-8 h-8 text-[#1A2B3C]/50" />
                </div>
                <div className="space-y-1 max-w-[280px]">
                  <h4 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider">
                    {isFr ? "Aucune analyse en attente" : "Analyze Spoken Delivery"}
                  </h4>
                  <p className="text-[10.5px] text-[#6B7280] leading-relaxed font-semibold">
                    {isFr 
                      ? "Enregistrez votre réponse ou importez un audio standard pour voir le rapport détaillé."
                      : "Record an oral response block. SHANA will parse and assess grammar flow, confidence, fillers, and STAR key metrics."}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono font-medium">
              <span>{isFr ? "MOTEUR COGNITIF : WHISPER & GPT" : "COGNITIVE MOTOR: WHISPER & GPT"}</span>
              <span>{isFr ? "SÉCURISÉ HTTPS" : "HTTPS SECURE"}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
