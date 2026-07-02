import React from 'react';
import { Sparkles, Mic, Video, Eye, Activity, Shield, Check, Volume2, Target, AlertCircle } from 'lucide-react';

interface HeroVisualProps {
  lang: 'EN' | 'FR';
}

export default function HeroVisual({ lang }: HeroVisualProps) {
  const isFR = lang === 'FR';
  const [interviewState, setInterviewState] = React.useState<'speaking' | 'mirroring'>('speaking');

  // Cycle the simulation states to represent the mirror interview feedback loops
  React.useEffect(() => {
    const timer = setInterval(() => {
      setInterviewState((prev) => (prev === 'speaking' ? 'mirroring' : 'speaking'));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div id="hero-visual-container" className="relative w-full max-w-[425px] h-[450px] flex items-center justify-center select-none font-sans">
      
      {/* Self-contained custom keyframe animations */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 12%; opacity: 0.1; }
          45%, 55% { opacity: 0.9; }
          50% { top: 88%; opacity: 0.9; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes point-jitter {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(0.5px, -0.5px) scale(1.1); }
          66% { transform: translate(-0.5px, 0.5px) scale(0.9); }
        }
      `}</style>

      {/* Radiant Ambient Background Orbs */}
      <div className="absolute w-[380px] h-[380px] bg-indigo-200/20 rounded-full filter blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 animate-pulse pointer-events-none" />
      <div className="absolute w-[280px] h-[280px] bg-violet-200/30 rounded-full filter blur-2xl top-1/4 left-1/3 opacity-50 pointer-events-none" />

      {/* Main Glassmorphic Screen Container mimicking Live Mirror Prep App Interface */}
      <div 
        id="mirror-interview-frame"
        className="relative w-full aspect-[4/3] max-w-[380px] bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-2.5 flex flex-col justify-between overflow-visible group transition-all duration-500 hover:shadow-indigo-500/15 hover:border-slate-700"
      >
        {/* Bezel Top Header with WebCam Indicator & System Badging */}
        <div className="h-7 flex items-center justify-between px-3 border-b border-slate-800 bg-slate-950/85 rounded-t-2xl">
          {/* Virtual window buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          {/* Active Status pill reflecting mirror concept */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase text-[#818CF8]">
            <span className={`w-1 h-1 rounded-full animate-ping ${interviewState === 'mirroring' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
            {interviewState === 'mirroring' 
              ? (isFR ? 'ANALYSE MIROIR ACTIVER' : 'LIVE SELF-MIRROR')
              : (isFR ? 'QUESTION EN COURS' : 'AI COACH SPEAKING')}
          </div>

          {/* Miniature Web-Cam physically centered on the bezel */}
          <div className="flex items-center gap-1 justify-end w-12">
            <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${interviewState === 'mirroring' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
            <span className="w-1 h-1 bg-indigo-500 rounded-full" />
          </div>
        </div>

        {/* The Live Interactive Viewport */}
        <div className="relative flex-1 bg-slate-950 rounded-b-2xl overflow-hidden flex items-center justify-center">
          
          {/* Candidate face layer */}
          <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop"
            alt="Candidate facing Mirror"
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full object-cover object-top filter contrast-[1.03] transition-all duration-700 ${
              interviewState === 'mirroring' 
                ? 'brightness-[0.95] saturate-[1.05]' 
                : 'brightness-[0.75] saturate-[0.85] blur-[1px]'
            }`}
          />

          {/* Live Gaze & Face Alignment Laser Scanner Line (Only moves during response state) */}
          {interviewState === 'mirroring' && (
            <div 
              className="absolute left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.8)] z-20 pointer-events-none"
              style={{ animation: 'scan 3.5s infinite ease-in-out' }}
            />
          )}

          {/* Cyberpunk grid mapping overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-indigo-950/15 pointer-events-none mix-blend-multiply" />

          {/* Mirror HUD Vector Graphics Overlay */}
          <svg viewBox="0 0 200 150" className="absolute inset-0 w-full h-full pointer-events-none z-10" fill="none">
            {/* Focal guide frame simulating webcam posture limits */}
            <circle 
              cx="100" 
              cy="65" 
              r="40" 
              stroke={interviewState === 'mirroring' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.1)'} 
              strokeWidth="1.2" 
              strokeDasharray="3 3"
              style={{ animation: 'pulse-ring 4s infinite ease-in-out' }}
            />
            
            {/* Calibration crosshairs pointing to corners */}
            <path d="M 12 18 L 12 12 L 18 12" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
            <path d="M 188 18 L 188 12 L 182 12" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
            <path d="M 12 132 L 12 138 L 18 138" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
            <path d="M 188 132 L 188 138 L 182 138" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />

            {/* EYE-TRACKING INTENT SIMULATION (Active during mirror assessment) */}
            {interviewState === 'mirroring' ? (
              <g className="transition-all duration-500 opacity-100">
                {/* Right Eye Node & Pupil trace vector */}
                <circle cx="86" cy="58" r="4" stroke="#10B981" strokeWidth="0.75" />
                <circle cx="86" cy="58" r="1.5" fill="#10B981" />
                <path d="M 86 52 L 86 46" stroke="#10B981" strokeWidth="0.5" />
                
                {/* Left Eye Node & Pupil trace vector */}
                <circle cx="114" cy="58" r="4" stroke="#10B981" strokeWidth="0.75" />
                <circle cx="114" cy="58" r="1.5" fill="#10B981" />
                <path d="M 114 52 L 114 46" stroke="#10B981" strokeWidth="0.5" />

                {/* Eye contact horizontal vector beam */}
                <line x1="90" y1="58" x2="110" y2="58" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="0.75" strokeDasharray="1 1" />
                
                {/* Real-time Facial Anchor Nodes */}
                <circle cx="100" cy="70" r="2" fill="#34D399" style={{ animation: 'point-jitter 2s infinite' }} /> {/* Nose */}
                <circle cx="82" cy="80" r="1.5" fill="#6EE7B7" /> {/* Jaw Left */}
                <circle cx="118" cy="80" r="1.5" fill="#6EE7B7" /> {/* Jaw Right */}
                <circle cx="100" cy="85" r="2" fill="#10B981" /> {/* Chin */}
                
                {/* Vocal/verbal projection vector pointing towards Shana */}
                <path d="M 90 84 Q 100 89 110 84" stroke="#34D399" strokeWidth="1" strokeLinecap="round" />
              </g>
            ) : (
              // Listen Mode: Eye components dim out, focusing on coaching voice signals
              <g className="transition-all duration-500 opacity-30">
                <circle cx="86" cy="58" r="3" stroke="#818CF8" strokeWidth="0.5" />
                <circle cx="114" cy="58" r="3" stroke="#818CF8" strokeWidth="0.5" />
              </g>
            )}

            {/* Dynamic Alignment feedback lines */}
            {interviewState === 'mirroring' && (
              <g className="text-emerald-500/30">
                <line x1="86" y1="58" x2="65" y2="35" stroke="currentColor" strokeWidth="0.75" />
                <line x1="114" y1="58" x2="135" y2="35" stroke="currentColor" strokeWidth="0.75" />
                <text x="50" y="30" fill="#34D399" fontSize="6" fontFamily="monospace" fontWeight="bold">LOCK TRK: R-EYE</text>
                <text x="120" y="30" fill="#34D399" fontSize="6" fontFamily="monospace" fontWeight="bold">LOCK TRK: L-EYE</text>
              </g>
            )}
          </svg>

          {/* TOP HUD ROW: Eye-Contact Lock Indicator Tag */}
          <div className="absolute top-2 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 flex items-center gap-1.5 pointer-events-none shadow-md transition-all duration-500 left-3">
            <Eye className={`w-3.5 h-3.5 transition-colors ${interviewState === 'mirroring' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="font-mono text-[7.5px] uppercase tracking-wider font-extrabold text-slate-300">
              {interviewState === 'mirroring' 
                ? (isFR ? 'ANALYSE DU REGARD : ACTIF' : 'EYE GAZE: PERFECT')
                : (isFR ? 'EN ATTENTE DE SOURIRE' : 'STANDBY MODE')}
            </span>
          </div>

          {/* TOP HUD RIGHT: Secure Local Encryption feed */}
          <div className="absolute top-2 right-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg px-2.5 py-1 flex items-center gap-1 pointer-events-none shadow-md">
            <Shield className="w-3 h-3 text-indigo-400" />
            <span className="font-mono text-[7px] text-slate-400 uppercase tracking-widest font-black">
              {isFR ? 'MIROIR PRIVÉ' : 'PRIVACY CALIBRATION'}
            </span>
          </div>

          {/* LOWER RUN-TIME TELEMETRY SYSTEM FOOTER */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-950/95 backdrop-blur-md border border-slate-800/85 rounded-xl p-2.5 flex items-center justify-between pointer-events-none shadow-xl transition-all duration-500">
            <div className="space-y-0.5">
              <span className="block font-mono text-[6.5px] text-slate-400 uppercase tracking-wider font-extrabold">
                {isFR ? 'SYMÉTRIE POSTURALE' : 'POSTURE SCORE'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${interviewState === 'mirroring' ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'}`} />
                <span className="text-[10.5px] font-mono font-black text-slate-200">
                  {interviewState === 'mirroring' ? '98.7%' : '00.0%'}
                </span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="space-y-0.5 text-center">
              <span className="block font-mono text-[6.5px] text-slate-400 uppercase tracking-wider font-extrabold">
                {isFR ? 'CADENCE VERBALE' : 'WORDS MINUTE'}
              </span>
              <span className="text-[10.5px] font-mono font-black text-slate-200">
                {interviewState === 'mirroring' ? '142 WPM' : '0 WPM'}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="space-y-0.5 text-right">
              <span className="block font-mono text-[6.5px] text-slate-400 uppercase tracking-wider font-extrabold">
                {isFR ? 'ALIGNEMENT DE LA TÊTE' : 'HEAD POSITION'}
              </span>
              <span className={`text-[10.5px] font-mono font-black ${interviewState === 'mirroring' ? 'text-emerald-400' : 'text-slate-400'}`}>
                {interviewState === 'mirroring' ? (isFR ? 'CENTRÉ' : 'CENTERED') : 'CALIBRATING'}
              </span>
            </div>
          </div>
        </div>

        {/* FLOATING GLASS COACH WIDGET (REPRESENTING SHANA VOICE COMPONENT) */}
        <div 
          id="shana-floating-wave"
          className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl shadow-indigo-100/40 border border-indigo-50/70 max-w-[215px] absolute -left-[50px] top-[105px] z-20 transition-all duration-500 hover:scale-105"
          style={{ animation: 'subtle-float 4s infinite ease-in-out' }}
        >
          <div className="flex items-center gap-1.5 text-indigo-600 font-extrabold text-[8.5px] tracking-wider uppercase font-mono">
            <div className={`w-2 h-2 rounded-full flex items-center justify-center shrink-0 ${interviewState === 'speaking' ? 'bg-indigo-600 animate-ping' : 'bg-slate-400'}`} />
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            {isFR ? 'COACH VOCAL IA' : 'SHANA INTERVIEW AI'}
          </div>
          <p className="text-slate-700 text-[10.5px] font-sans font-bold leading-normal mt-1 text-left">
            {interviewState === 'speaking' ? (
              isFR 
                ? "S'il vous plaît, décrivez-moi une situation où vous avez influencé une décision clé."
                : "Describe a complex high-pressure scenario you solved using analytical skills."
            ) : (
              isFR
                ? "Je vous écoute. Évitez les hésitations comme (Euh/Bah)..."
                : "Active feedback: speak clearly, and maintain direct webcam eye-gaze."
            )}
          </p>
          
          {/* Animated active wave bands (only animates if AI is speaking) */}
          <div className="flex items-end gap-[1.5px] justify-center mt-3 h-6">
            {[5, 12, 18, 8, 24, 11, 15, 28, 11, 22, 7, 14, 9, 17, 4, 10, 4, 8].map((h, i) => (
              <span 
                key={i} 
                className={`w-[1.8px] rounded-full transition-all duration-300 ${interviewState === 'speaking' ? 'bg-indigo-600' : 'bg-slate-300'}`} 
                style={{ 
                  height: `${interviewState === 'speaking' ? h : 4}px`,
                  animationName: interviewState === 'speaking' ? 'pulse' : 'none',
                  animationDuration: '1.3s',
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-in-out',
                  animationDelay: `${i * 0.04}s`
                }} 
              />
            ))}
          </div>
        </div>

        {/* FLOATING GLASS MIRROR STATE CONTROLLER (Self-Reflection validation tracker) */}
        <div 
          id="shana-floating-badge-1"
          className="bg-white/95 backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-indigo-50 max-w-[160px] absolute -right-[32px] top-[20px] z-20 transition-all duration-300 hover:scale-105 flex items-center gap-2"
        >
          <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 ${
            interviewState === 'mirroring' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
              : 'bg-indigo-50 text-indigo-500 border-indigo-100/50'
          }`}>
            <Video className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <h4 className="font-sans font-black text-[9.5px] text-slate-800 leading-none">
              {isFR ? 'Miroir Actif' : 'Mirrored Mode'}
            </h4>
            <p className="text-[7.5px] text-slate-400 mt-1 leading-none font-medium">
              {interviewState === 'mirroring' 
                ? (isFR ? 'Analyse en cours...' : 'Webcam recording...') 
                : (isFR ? 'IA parle...' : 'Coach talking...')}
            </p>
          </div>
        </div>

        {/* FLOATING GLASS PRESENCE / STATS GAIN TRACKING SCALE */}
        <div 
          id="shana-floating-stats"
          className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-indigo-50 max-w-[155px] absolute -right-[35px] bottom-[30px] z-20 transition-all duration-350 hover:scale-105"
        >
          <div className="text-left">
            <div className="flex justify-between items-center gap-1.5">
              <h4 className="font-sans font-black text-[9.5px] text-slate-800 leading-none">
                {isFR ? 'Indice de Stress' : 'Stress Index'}
              </h4>
              <span className={`text-[9.5px] font-mono font-black ${interviewState === 'mirroring' ? 'text-emerald-500' : 'text-slate-400'}`}>
                {interviewState === 'mirroring' ? '14%' : '0%'}
              </span>
            </div>
            <p className="text-[7.5px] text-slate-400 leading-none mt-1 font-medium">
              {isFR ? 'Stabilité dynamique' : 'Behavioral control'}
            </p>
            
            {/* Real responsive mini-chart updating based on active state */}
            <div className="mt-2.5 h-5 w-full flex items-end gap-[1.5px] overflow-hidden">
              {[12, 18, 15, 22, 10, 26, 15, 30, 22, 12].map((h, idx) => (
                <div 
                  key={idx}
                  className={`w-2.5 rounded-t-sm transition-all duration-1000 ${
                    interviewState === 'mirroring' ? 'bg-indigo-500' : 'bg-slate-200'
                  }`}
                  style={{ 
                    height: `${interviewState === 'mirroring' ? h : 4}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
