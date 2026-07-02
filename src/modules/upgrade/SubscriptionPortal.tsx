import React, { useState, useEffect } from 'react';
import { StorageService } from '../../lib/storage';
import { UpgradeEngine } from './UpgradeEngine';
import { Shield, Sparkles, Check, X, Calendar, RefreshCcw, Power, AlertTriangle } from 'lucide-react';

interface SubscriptionPortalProps {
  userId: string;
  lang: 'FR' | 'EN';
  onUpdate?: () => void;
}

export default function SubscriptionPortal({ userId, lang, onUpdate }: SubscriptionPortalProps) {
  const [monetization, setMonetization] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMonetization(StorageService.getCandidateMonetization(userId));
    
    const handleUpdate = () => {
      setMonetization(StorageService.getCandidateMonetization(userId));
    };
    window.addEventListener('shana_progress_update', handleUpdate);
    return () => window.removeEventListener('shana_progress_update', handleUpdate);
  }, [userId]);

  if (!monetization) return null;

  const handleCancelRenewal = () => {
    setLoading(true);
    setTimeout(() => {
      const updated = { ...monetization, ultraRenewalCancelled: true };
      StorageService.saveCandidateMonetization(userId, updated);
      setMonetization(updated);
      setLoading(false);
      
      // Notify
      const event = new CustomEvent('shana_notification', {
        detail: { trigger: 'Ultra ending soon', status: 'cancelled' }
      });
      window.dispatchEvent(event);
      
      if (onUpdate) onUpdate();
    }, 800);
  };

  const handleResumeRenewal = () => {
    setLoading(true);
    setTimeout(() => {
      const updated = { ...monetization, ultraRenewalCancelled: false };
      StorageService.saveCandidateMonetization(userId, updated);
      setMonetization(updated);
      setLoading(false);
      
      if (onUpdate) onUpdate();
    }, 800);
  };

  const handleSimulateExpiration = () => {
    setLoading(true);
    setTimeout(() => {
      const updated = UpgradeEngine.downgradeFromUltra(userId);
      setMonetization(updated);
      setLoading(false);
      
      if (onUpdate) onUpdate();
    }, 800);
  };

  const isUltra = monetization.ultraActive;
  const endsDateStr = monetization.ultraExpiresAt 
    ? new Date(monetization.ultraExpiresAt).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[32px] overflow-hidden shadow-xs p-6 md:p-8 space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-100">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 font-bold">
            {lang === 'FR' ? "MON ABONNEMENT" : "MY SUBSCRIPTION"}
          </span>
          <h3 className="text-lg font-black text-[#1A2B3C] tracking-tight mt-2 flex items-center gap-1.5 font-sans">
            <Shield className="w-5 h-5 text-indigo-600" />
            <span>SHANA Ultra Unlimited</span>
          </h3>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider ${
          isUltra 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
            : 'bg-stone-50 text-stone-500 border border-stone-200'
        }`}>
          {isUltra ? (lang === 'FR' ? "● ULTRA ACTIF" : "● ULTRA ACTIVE") : (lang === 'FR' ? "○ INACTIF" : "○ INACTIVE")}
        </span>
      </div>

      {isUltra ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50/20 border border-indigo-100/50 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>{lang === 'FR' ? "Période de Validité" : "Validity Period"}</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed font-semibold">
                {lang === 'FR' 
                  ? `Votre accès illimité Ultra est actif et expire le ${endsDateStr}.` 
                  : `Your Ultra Unlimited access is active and will expire on ${endsDateStr}.`}
              </p>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-100 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-[#1A2B3C] font-bold text-xs">
                <RefreshCcw className="w-4 h-4 text-[#1A2B3C]" />
                <span>{lang === 'FR' ? "Statut du Renouvellement" : "Renewal Status"}</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed font-semibold">
                {monetization.ultraRenewalCancelled ? (
                  <span className="text-amber-700 font-bold">
                    {lang === 'FR' 
                      ? "Le renouvellement est annulé. L'accès s'arrêtera à la fin de la période."
                      : "Auto-renewal is cancelled. Access will end at the period date."}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold">
                    {lang === 'FR' 
                      ? `Renouvellement automatique actif le ${endsDateStr} (39,99€/mois).`
                      : `Auto-renews automatically on ${endsDateStr} (€39.99/mo).`}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Frozen credits overview to prove rule 4 is working */}
          {monetization.frozenCredits && (
            <div className="p-4 bg-indigo-50/40 border border-indigo-100/80 rounded-2xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-left space-y-1">
                <p className="text-xs font-bold text-indigo-950">
                  {lang === 'FR' ? "Crédits Gelés Préservés" : "Preserved Frozen Credits"}
                </p>
                <p className="text-[10.5px] text-indigo-800 leading-relaxed font-semibold">
                  {lang === 'FR'
                    ? `Vos crédits restants (${monetization.frozenCredits.packAudio + monetization.frozenCredits.freeAudio} Entraînements, ${monetization.frozenCredits.packMirror} Miroirs) sont précieusement sauvegardés et seront dégelés après l'expiration de votre abonnement Ultra.`
                    : `Your remaining balances (${monetization.frozenCredits.packAudio + monetization.frozenCredits.freeAudio} Practice Sessions, ${monetization.frozenCredits.packMirror} Mirror sessions) are preserved and will safely unfreeze once your Ultra term concludes.`}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {monetization.ultraRenewalCancelled ? (
              <button
                onClick={handleResumeRenewal}
                disabled={loading}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {lang === 'FR' ? "Réactiver le renouvellement" : "Resume Auto-Renewal"}
              </button>
            ) : (
              <button
                onClick={handleCancelRenewal}
                disabled={loading}
                className="px-5 py-3 border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {lang === 'FR' ? "Annuler l'abonnement" : "Cancel Auto-Renewal"}
              </button>
            )}

            {/* Test helper simulator button to unfreeze and complete recovery scenario */}
            <button
              onClick={handleSimulateExpiration}
              disabled={loading}
              className="px-5 py-3 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
              title={lang === 'FR' ? "Simuler l'expiration pour retester le dégel des crédits" : "Simulate expiration to retest credit unfreezing"}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{lang === 'FR' ? "Simuler Expiration (Test)" : "Simulate Expiration (Test)"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-stone-50 border border-stone-100 rounded-2xl text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-stone-400 mx-auto" />
          <div className="space-y-1">
            <h4 className="font-bold text-stone-900 text-sm">
              {lang === 'FR' ? "Aucun abonnement Ultra actif" : "No active Ultra Subscription"}
            </h4>
            <p className="text-stone-500 text-xs leading-relaxed max-w-md mx-auto font-semibold">
              {lang === 'FR' 
                ? "Passez à Ultra pour un entraînement illimité. Les sessions vocales et évaluations miroir illimitées vous permettront d'être prêt à 100%."
                : "Pass to Ultra for unlimited voice training sessions and full mirror simulations."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
