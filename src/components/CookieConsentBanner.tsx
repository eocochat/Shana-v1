import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Settings, Check, X, Info } from 'lucide-react';
import { getConsent, setConsent } from '../lib/cookies';

interface CookieConsentBannerProps {
  onConsentChange?: () => void;
  lang?: 'EN' | 'FR';
}

export default function CookieConsentBanner({ onConsentChange, lang = 'EN' }: CookieConsentBannerProps) {
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [prefs, setPrefs] = useState({
    essential: true,
    preferences: true,
  });

  useEffect(() => {
    const existingConsent = getConsent();
    if (!existingConsent) {
      // Small timeout to let page render before slide-in
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = { essential: true, preferences: true };
    setConsent(consent);
    setVisible(false);
    if (onConsentChange) onConsentChange();
  };

  const handleEssentialOnly = () => {
    const consent = { essential: true, preferences: false };
    setConsent(consent);
    setVisible(false);
    if (onConsentChange) onConsentChange();
  };

  const handleSavePreferences = () => {
    setConsent(prefs);
    setVisible(false);
    if (onConsentChange) onConsentChange();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <div 
        id="cookie-banner-wrapper" 
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-50"
      >
        <motion.div
          initial={{ y: 120, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 120, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="bg-white border-2 border-stone-950 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] rounded-2xl p-5 md:p-6 text-stone-950 space-y-4 font-sans"
        >
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#EDC154] border-2 border-stone-950 text-stone-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-sans font-black uppercase tracking-wide">
                {lang === 'FR' ? "Cookies & Confidentialité" : "Cookies & Confidentiality"}
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed font-bold">
                {lang === 'FR' 
                  ? "SHANA utilise des cookies essentiels pour assurer le bon fonctionnement de votre compte et de votre expérience."
                  : "SHANA uses essential cookies to keep your account and experience working."}
              </p>
            </div>
          </div>

          {/* Expanded Preferences Settings */}
          {managing && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="border-t-2 border-stone-950 pt-4 mt-2 space-y-3 overflow-hidden text-left"
            >
              <h5 className="text-[10px] font-mono tracking-widest text-stone-500 uppercase font-black">
                {lang === 'FR' ? "CATÉGORIES DE COOKIES" : "COOKIE CATEGORIES"}
              </h5>

              {/* Essential Category */}
              <div className="p-3 bg-[#FAF7F2] rounded-xl border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] flex items-start gap-3 text-stone-950">
                <div className="mt-0.5 w-5 h-5 rounded border-2 border-stone-950 bg-stone-950 text-[#EDC154] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[4px]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wide">
                      {lang === 'FR' ? "1. Essentiels (Requis)" : "1. Essential (Required)"}
                    </span>
                    <span className="text-[8px] font-mono bg-[#EDC154] border border-stone-950 text-stone-950 px-1.5 py-0.5 rounded font-black">
                      {lang === 'FR' ? "OBLIGATOIRE" : "ALWAYS ON"}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-600 font-bold mt-0.5">
                    {lang === 'FR'
                      ? "Gère la connexion, les sessions sécurisées, la sécurité et la langue."
                      : "Handles auth authentication, secure sessions, security measures, and language."}
                  </p>
                </div>
              </div>

              {/* Preferences Category */}
              <div 
                onClick={() => setPrefs(p => ({ ...p, preferences: !p.preferences }))}
                className="p-3 bg-[#FAF7F2] hover:bg-white rounded-xl border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] flex items-start gap-3 cursor-pointer select-none transition-all text-stone-950"
              >
                <div className={`mt-0.5 w-5 h-5 rounded border-2 border-stone-950 flex items-center justify-center shrink-0 transition-all ${prefs.preferences ? 'bg-stone-950 text-[#EDC154]' : 'bg-white'}`}>
                  {prefs.preferences && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wide">
                      {lang === 'FR' ? "2. Préférences (Optionnel)" : "2. Preferences (Optional)"}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-600 font-bold mt-0.5">
                    {lang === 'FR'
                      ? "Sauvegarde votre thème, l'état d'onboarding et d'autres préférences graphiques."
                      : "Saves visual theme, onboarding completed state, and layout specs."}
                  </p>
                </div>
              </div>

              {/* Forbidden items list */}
              <div className="flex items-center gap-1.5 text-[10px] text-stone-700 bg-[#EDC154]/20 border border-stone-950 px-2 py-1.5 rounded-lg font-bold">
                <Info className="w-3.5 h-3.5 flex-shrink-0 text-stone-950" />
                <span>
                  {lang === 'FR' ? "Pas de publicités, traceurs ou outils de marketing." : "Strictly Forbidden: No ads, analytical trackers, or marketing."}
                </span>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            {!managing ? (
              <div className="flex gap-2">
                <button
                  id="cookie-btn-manage"
                  onClick={() => setManaging(true)}
                  className="flex-1 px-4 py-2.5 bg-white hover:bg-stone-50 border-2 border-stone-950 text-stone-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-1.5 text-center"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? "Gérer" : "Manage"}</span>
                </button>
                <button
                  id="cookie-btn-accept-all"
                  onClick={handleAcceptAll}
                  className="flex-1 px-4 py-2.5 bg-[#18633F] hover:bg-[#1f7c50] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] text-center"
                >
                  {lang === 'FR' ? "Accepter Tout" : "Accept All"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  id="cookie-btn-essential"
                  onClick={handleEssentialOnly}
                  className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 border-2 border-stone-950 text-red-950 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]"
                >
                  {lang === 'FR' ? "Essentiels Seuls" : "Essential Only"}
                </button>
                <button
                  id="cookie-btn-save-prefs"
                  onClick={handleSavePreferences}
                  className="flex-1 px-4 py-2 bg-[#18633F] hover:bg-[#1f7c50] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] text-center"
                >
                  {lang === 'FR' ? "Enregistrer" : "Save"}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
