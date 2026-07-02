import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Camera, Mic, Smartphone, Check, X, ShieldAlert } from 'lucide-react';

interface PreSessionWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lang: 'FR' | 'EN';
}

export const WARNING_TEXTS = {
  FR: {
    title: "Mise en Garde & Calibrage",
    subtitle: "Consignes de préparation indispensables avant chaque session",
    warningTitle: "ATTENTION : QUALITÉ DE L'ANALYSE",
    warningDesc: "La précision des analyses IA (vitesse d'élocution, détection de silences, expressions) dépend directement de vos conditions physiques de test. Un mauvais éclairage ou un environnement bruyant dégradera vos scores.",
    
    tip1Title: "1. Calibrage & Regard Caméra",
    tip1Desc: "Fixez directement l'objectif de la caméra (et non votre visage). Sur mobile, vous devez absolument cliquer sur le bouton vert 'CALIBRAGE DU CHAMP OPTIQUE' pour initialiser le suivi oculaire.",
    
    tip2Title: "2. Isolation Vocale & Bruits",
    tip2Desc: "Le système filtre activement les bruits de fond, mais exige une voix humaine claire. Installez-vous dans un endroit calme, sans voix tierces ou bruits métalliques continus à proximité.",
    
    tip3Title: "3. Stabilité & Éclairage de face",
    tip3Desc: "Ne tenez pas votre téléphone à la main : posez-le sur un support stable. Veillez à ce que votre visage soit bien éclairé de face pour permettre la détection optimale de vos expressions.",
    
    checkboxPlaceholder: "J'ai vérifié ce point de calibrage",
    buttonClose: "Annuler",
    buttonConfirm: "Je valide, démarrer la session",
    progressLabel: "Points de contrôle requis"
  },
  EN: {
    title: "Safety & Calibration Guidelines",
    subtitle: "Required preparation steps before launching any session",
    warningTitle: "WARNING: ANALYSIS ACCURACY",
    warningDesc: "The accuracy of AI metrics (speech rate, silence tracking, expression analysis) is highly dependent on physical conditions. Poor lighting or heavy ambient noise will artificially lower your scores.",
    
    tip1Title: "1. Camera Calibration & Eye Contact",
    tip1Desc: "Stare directly at your camera lens (not at your screen). On mobile, make sure to click the green 'CALIBRATE OPTICAL FIELD' button to properly initialize the visual tracking parameters.",
    
    tip2Title: "2. Audio Isolation & Ambient Noise",
    tip2Desc: "The system actively suppresses background noise, but requires a clear human voice. Choose a silent, isolated room free of metallic hums or overlapping voices.",
    
    tip3Title: "3. Device Stability & Face Lighting",
    tip3Desc: "Do not hold your mobile device in your hand: set it on a static dock. Stay facing a clear light source so the AI can accurately map your gestures and dynamic expressions.",
    
    checkboxPlaceholder: "I have verified this checkpoint",
    buttonClose: "Cancel",
    buttonConfirm: "I understand, launch session",
    progressLabel: "Required checkpoints"
  }
};

export default function PreSessionWarning({ isOpen, onClose, onConfirm, lang }: PreSessionWarningProps) {
  const t = WARNING_TEXTS[lang];
  const [checked, setChecked] = useState<boolean[]>([false, false, false]);

  const handleToggle = (index: number) => {
    const next = [...checked];
    next[index] = !next[index];
    setChecked(next);
  };

  const isAllChecked = checked.every(Boolean);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] my-8"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full bg-stone-850 hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="space-y-1 text-left">
            <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
              {t.progressLabel}
            </span>
            <h2 className="text-xl md:text-2xl font-sans font-extrabold text-white tracking-tight mt-3">
              {t.title}
            </h2>
            <p className="text-xs text-stone-400">
              {t.subtitle}
            </p>
          </div>

          {/* General Critical Warning */}
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 items-start text-left">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-400 tracking-wide font-mono uppercase">
                {t.warningTitle}
              </h4>
              <p className="text-[11px] text-amber-200/90 leading-relaxed font-medium">
                {t.warningDesc}
              </p>
            </div>
          </div>

          {/* 3 Checklist Items */}
          <div className="mt-6 space-y-4">
            
            {/* Advice 1 */}
            <div 
              onClick={() => handleToggle(0)}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer flex gap-3 items-start select-none ${
                checked[0] 
                  ? 'bg-stone-850/60 border-indigo-500/40 shadow-inner' 
                  : 'bg-stone-850/30 border-stone-800 hover:border-stone-700 hover:bg-stone-850/40'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  checked[0] 
                    ? 'bg-indigo-500 border-indigo-500 text-white' 
                    : 'border-stone-700 bg-stone-900 text-transparent'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Camera className={`w-3.5 h-3.5 ${checked[0] ? 'text-indigo-400' : 'text-stone-500'}`} />
                  <h4 className="text-xs font-bold text-stone-200">{t.tip1Title}</h4>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {t.tip1Desc}
                </p>
                <span className="text-[10px] text-indigo-400 font-mono block pt-1">
                  {t.checkboxPlaceholder}
                </span>
              </div>
            </div>

            {/* Advice 2 */}
            <div 
              onClick={() => handleToggle(1)}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer flex gap-3 items-start select-none ${
                checked[1] 
                  ? 'bg-stone-850/60 border-indigo-500/40 shadow-inner' 
                  : 'bg-stone-850/30 border-stone-800 hover:border-stone-700 hover:bg-stone-850/40'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  checked[1] 
                    ? 'bg-indigo-500 border-indigo-500 text-white' 
                    : 'border-stone-700 bg-stone-900 text-transparent'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Mic className={`w-3.5 h-3.5 ${checked[1] ? 'text-indigo-400' : 'text-stone-500'}`} />
                  <h4 className="text-xs font-bold text-stone-200">{t.tip2Title}</h4>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {t.tip2Desc}
                </p>
                <span className="text-[10px] text-indigo-400 font-mono block pt-1">
                  {t.checkboxPlaceholder}
                </span>
              </div>
            </div>

            {/* Advice 3 */}
            <div 
              onClick={() => handleToggle(2)}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer flex gap-3 items-start select-none ${
                checked[2] 
                  ? 'bg-stone-850/60 border-indigo-500/40 shadow-inner' 
                  : 'bg-stone-850/30 border-stone-800 hover:border-stone-700 hover:bg-stone-850/40'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  checked[2] 
                    ? 'bg-indigo-500 border-indigo-500 text-white' 
                    : 'border-stone-700 bg-stone-900 text-transparent'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Smartphone className={`w-3.5 h-3.5 ${checked[2] ? 'text-indigo-400' : 'text-stone-500'}`} />
                  <h4 className="text-xs font-bold text-stone-200">{t.tip3Title}</h4>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {t.tip3Desc}
                </p>
                <span className="text-[10px] text-indigo-400 font-mono block pt-1">
                  {t.checkboxPlaceholder}
                </span>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-stone-800 hover:bg-stone-750 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
            >
              {t.buttonClose}
            </button>
            <button
              onClick={() => {
                if (isAllChecked) {
                  onConfirm();
                }
              }}
              disabled={!isAllChecked}
              className={`flex-[2] py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                isAllChecked 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98]' 
                  : 'bg-stone-800 text-stone-500 border border-stone-800 cursor-not-allowed'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{t.buttonConfirm}</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
