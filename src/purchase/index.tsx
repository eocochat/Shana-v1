import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MONETIZATION_PRODUCTS, ProductInfo } from '../components/CheckoutModal';
import { StorageService } from '../lib/storage';
import { PurchaseFlowService, PaymentState } from '../services/commerce/PurchaseFlowService';
import { RecoveryManager } from '../modules/upgrade/RecoveryManager';
import { RestorePurchaseService } from '../services/commerce/RestorePurchaseService';
import { 
  CreditCard, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  X, 
  ChevronRight, 
  ShoppingBag, 
  ArrowRight,
  RefreshCcw,
  AlertTriangle,
  Play,
  Flame,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

interface PurchaseViewProps {
  userId: string;
  lang: 'FR' | 'EN';
  onNavigateTab: (tab: any) => void;
  onSuccessClose?: () => void;
}

export default function PurchaseView({ userId, lang, onNavigateTab, onSuccessClose }: PurchaseViewProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo>(MONETIZATION_PRODUCTS[1]); // Premium pack default
  const [checkoutStep, setCheckoutStep] = useState<'selection' | 'summary' | 'checkout' | 'success'>('selection');
  
  // Payment states
  const [paymentState, setPaymentState] = useState<PaymentState>('pending');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Recovery transaction
  const [recoverableTx, setRecoverableTx] = useState<any>(null);

  // Loaded candidate balance
  const [monetization, setMonetization] = useState<any>(null);

  useEffect(() => {
    setMonetization(StorageService.getCandidateMonetization(userId));
    
    // Check Stripe configuration status from Express backend
    fetch('/api/commerce/stripe/status')
      .then(res => res.json())
      .then(data => {
        setIsStripeConfigured(!!data.configured);
      })
      .catch(err => {
        console.warn("Failed to retrieve Stripe status, defaulting to simulator:", err);
        setIsStripeConfigured(false);
      });

    // Check for failed payments to recover
    const faileds = RecoveryManager.getRecoverablePayments(userId);
    if (faileds.length > 0) {
      setRecoverableTx(faileds[0]);
    }
    
    const handleFailedPaymentsUpdate = () => {
      const updatedFaileds = RecoveryManager.getRecoverablePayments(userId);
      setRecoverableTx(updatedFaileds.length > 0 ? updatedFaileds[0] : null);
    };
    
    window.addEventListener('shana_failed_payments_updated', handleFailedPaymentsUpdate);
    return () => window.removeEventListener('shana_failed_payments_updated', handleFailedPaymentsUpdate);
  }, [userId]);

  // Listen for Stripe popup messages
  useEffect(() => {
    const handleStripeMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      
      if (event.data?.type === 'STRIPE_PAYMENT_SUCCESS') {
        const { productId: pId, userId: uId } = event.data;
        if (pId === selectedProduct.id && uId === userId) {
          try {
            const updated = StorageService.addCandidatePurchase(userId, selectedProduct.id);
            setMonetization(updated);
            setCheckoutStep('success');
            
            // Also save to Cloud Backup for restore safety
            RestorePurchaseService.saveToCloudBackup(StorageService.getUser(userId)?.email || '', {
              id: 'pur_c_' + Math.random().toString(36).substring(3, 11),
              productId: selectedProduct.id,
              nameEN: selectedProduct.nameEN,
              nameFR: selectedProduct.nameFR,
              price: selectedProduct.price,
              date: new Date().toISOString()
            });
          } catch (err: any) {
            console.error("Error finalizing Stripe payment:", err);
            setPaymentError(err.message || "Failed to finalize payment.");
          }
        }
      } else if (event.data?.type === 'STRIPE_PAYMENT_CANCEL') {
        setCheckoutStep('summary');
      }
    };
    
    window.addEventListener('message', handleStripeMessage);
    return () => window.removeEventListener('message', handleStripeMessage);
  }, [selectedProduct, userId, lang]);

  const handleLaunchStripeCheckout = () => {
    setCheckoutStep('checkout');
    setPaymentState('processing');
    setPaymentError(null);

    const currentOrigin = window.location.origin;
    const checkoutUrl = `/api/commerce/stripe/checkout?productId=${encodeURIComponent(selectedProduct.id)}&userId=${encodeURIComponent(userId)}&origin=${encodeURIComponent(currentOrigin)}`;

    const authWindow = window.open(
      checkoutUrl,
      'stripe_checkout_popup',
      'width=600,height=750,status=yes,resizable=yes'
    );

    if (!authWindow) {
      alert(lang === 'FR' 
        ? "Le bloqueur de popups a bloqué l'écran de paiement Stripe. Veuillez autoriser les popups pour ce site." 
        : "The popup blocker blocked the Stripe payment screen. Please allow popups for this site."
      );
      setCheckoutStep('summary');
    }
  };

  const handleSimulatePayment = async (forceSimulateFailure = false) => {
    setCheckoutStep('checkout');
    setPaymentError(null);
    
    const method = forceSimulateFailure ? 'card_failed_sim' : 'card_simulated_success';
    
    try {
      const updated = await PurchaseFlowService.processPurchase(
        userId,
        selectedProduct.id,
        method,
        (state, err) => {
          setPaymentState(state);
          if (err) setPaymentError(err);
        }
      );
      
      setMonetization(updated);
      setCheckoutStep('success');
      
      // Also save to Cloud Backup for restore safety
      RestorePurchaseService.saveToCloudBackup(StorageService.getUser(userId)?.email || '', {
        id: 'pur_c_' + Math.random().toString(36).substring(3, 11),
        productId: selectedProduct.id,
        nameEN: selectedProduct.nameEN,
        nameFR: selectedProduct.nameFR,
        price: selectedProduct.price,
        date: new Date().toISOString()
      });
      
    } catch (err: any) {
      console.warn("Payment workflow simulation error:", err);
    }
  };

  const triggerRecoveryRetry = async () => {
    if (!recoverableTx) return;
    setCheckoutStep('checkout');
    setPaymentError(null);
    
    try {
      const prod = MONETIZATION_PRODUCTS.find(p => p.id === recoverableTx.productId);
      if (prod) setSelectedProduct(prod);

      const updated = await RecoveryManager.retryFailedPayment(
        userId,
        recoverableTx.id,
        'card_recovered_success',
        (state, err) => {
          setPaymentState(state);
          if (err) setPaymentError(err);
        }
      );
      
      setMonetization(updated);
      setCheckoutStep('success');
      setRecoverableTx(null);
      
    } catch (err: any) {
      console.warn("Recovery failed:", err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 font-sans" id="purchase-center-container">
      
      {/* Recovery Banner */}
      <AnimatePresence>
        {recoverableTx && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-amber-50 border-2 border-stone-950 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]"
            id="recoverable-payments-banner"
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-stone-950 text-stone-950 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="font-mono font-black text-[10px] uppercase tracking-wider text-stone-500">
                  {lang === 'FR' ? "PAIEMENT ÉCHOUÉ RETROUVÉ" : "RECOVERABLE TRANSACTION DETECTED"}
                </p>
                <p className="text-[11px] text-stone-850 font-bold leading-relaxed">
                  {lang === 'FR' 
                    ? `Votre précédente tentative d'achat du "${MONETIZATION_PRODUCTS.find(p => p.id === recoverableTx.productId)?.nameFR}" a échoué. Reprenez là où vous vous étiez arrêté.` 
                    : `Your last checkout attempt for "${MONETIZATION_PRODUCTS.find(p => p.id === recoverableTx.productId)?.nameEN}" was interrupted. Resume now with zero friction.`}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={() => RecoveryManager.dismissRecovery(userId, recoverableTx.id)}
                className="px-4 py-2 border-2 border-stone-950 text-stone-800 hover:bg-stone-50 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer flex-1 md:flex-initial"
              >
                {lang === 'FR' ? "Ignorer" : "Dismiss"}
              </button>
              
              <button
                onClick={triggerRecoveryRetry}
                className="px-5 py-2 bg-[#EDC154] hover:bg-[#ffdf7e] border-2 border-stone-950 text-stone-950 font-black text-xs uppercase rounded-xl transition-all cursor-pointer flex-1 md:flex-initial flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>{lang === 'FR' ? "Réessayer" : "Retry Payment"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: PRODUCT SELECTION */}
        {checkoutStep === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
            id="purchase-selection-step"
          >
            <div className="text-left space-y-2">
              <h2 className="text-2xl font-black text-stone-950 uppercase tracking-tight">
                {lang === 'FR' ? "Propulsez votre préparation" : "Elevate Your Interview Readiness"}
              </h2>
              <p className="text-xs text-stone-500 font-semibold">
                {lang === 'FR' 
                  ? "Sélectionnez le pack ou l'abonnement adapté à vos objectifs d'entretien professionnels." 
                  : "Select the premium preparation pack or subscription aligned with your professional career milestones."}
              </p>
            </div>

            {/* Grid display of Products */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MONETIZATION_PRODUCTS.filter(p => !p.id.startsWith('topup')).map((prod) => {
                const isSelected = selectedProduct.id === prod.id;
                const isUltra = prod.id === 'sub_ultra';
                
                return (
                  <div
                    key={prod.id}
                    onClick={() => setSelectedProduct(prod)}
                    className={`relative rounded-[32px] p-6 border-[3px] text-left transition-all cursor-pointer flex flex-col justify-between h-[380px] select-none ${
                      isSelected 
                        ? 'border-stone-950 bg-stone-50/50 shadow-[5px_5px_0px_0px_rgba(17,17,17,1)] scale-[1.01]' 
                        : 'border-stone-950 bg-white hover:bg-stone-50/20 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] hover:shadow-[5px_5px_0px_0px_rgba(17,17,17,1)]'
                    }`}
                  >
                    {isUltra && (
                      <span className="absolute -top-3 left-6 px-3 py-1 bg-[#FF7E5F] border-2 border-stone-950 text-stone-950 text-[8px] font-black uppercase rounded-full tracking-widest shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 animate-pulse text-stone-950" />
                        <span>POPULAR / RECOMMENDED</span>
                      </span>
                    )}

                    <div className="space-y-3.5">
                      <div>
                        <h4 className="text-base font-black text-stone-950 uppercase tracking-tight">
                          {lang === 'FR' ? prod.nameFR : prod.nameEN}
                        </h4>
                        <p className="text-[9px] uppercase font-black tracking-widest text-stone-400 font-mono mt-0.5">
                          {isUltra ? (lang === 'FR' ? "MENSUELE" : "MONTHLY SUBSCRIPTION") : (lang === 'FR' ? "RECHARGE UNIQUE" : "ONE-TIME RECHARGE")}
                        </p>
                      </div>

                      <p className="text-xs text-stone-600 font-bold leading-relaxed">
                        {lang === 'FR' ? prod.descriptionFR : prod.descriptionEN}
                      </p>

                      <ul className="space-y-1.5 pt-1 border-t border-stone-200">
                        {(lang === 'FR' ? prod.featuresFR : prod.featuresEN).map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-[11px] text-stone-850 font-bold leading-tight">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t-2 border-stone-950 flex justify-between items-baseline">
                      <span className="text-2xl font-black text-stone-950 font-mono">{prod.price.toFixed(2)}€</span>
                      <span className={`text-[10px] font-mono font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-[#FF7E5F]' : 'text-stone-400'}`}>
                        {isSelected ? (lang === 'FR' ? "Sélectionné ✓" : "Selected ✓") : (lang === 'FR' ? "Choisir" : "Choose")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top-ups Section */}
            <div className="bg-stone-50 border-2 border-stone-950 rounded-[32px] p-6 space-y-4 text-left shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
              <div>
                <h4 className="text-sm font-black text-stone-950 uppercase tracking-tight">
                  {lang === 'FR' ? "Besoin de sessions supplémentaires uniquement ?" : "Looking for micro sessions only?"}
                </h4>
                <p className="text-[11px] text-stone-500 font-bold">
                  {lang === 'FR' ? "Rechargez votre console à l'unité en fonction de vos besoins immédiats." : "Top-up your active candidate sandbox balance on-demand with no expiration constraints."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MONETIZATION_PRODUCTS.filter(p => p.id.startsWith('topup')).map((prod) => {
                  const isSelected = selectedProduct.id === prod.id;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod)}
                      className={`p-4 rounded-2xl border-2 border-stone-950 text-left flex justify-between items-center cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-[#A7F3D0]/20 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]' 
                          : 'bg-white hover:bg-stone-50 border-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-stone-950 uppercase tracking-tight">{lang === 'FR' ? prod.nameFR : prod.nameEN}</p>
                        <p className="text-[10px] text-stone-500 font-bold font-mono">{prod.price.toFixed(2)}€</p>
                      </div>
                      <span className={`w-4 h-4 rounded-full border-2 border-stone-950 flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#A7F3D0]' : 'bg-white'}`}>
                        {isSelected && <span className="w-1.5 h-1.5 bg-stone-950 rounded-full" />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation to Summary */}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setCheckoutStep('summary')}
                className="px-6 py-4 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 border-2 border-stone-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] cursor-pointer flex items-center gap-1.5"
                id="to-summary-btn"
              >
                <span>{lang === 'FR' ? "Récapitulatif de la commande" : "Review Summary"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: SUMMARY & SECURE BILLING GATEWAY */}
        {checkoutStep === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left font-sans"
            id="purchase-summary-step"
          >
            {/* Left side: Benefit Checklist */}
            <div className="md:col-span-2 space-y-5">
              <div className="space-y-1">
                <button
                  onClick={() => setCheckoutStep('selection')}
                  className="text-stone-600 hover:text-stone-950 hover:underline font-black text-[10px] font-mono uppercase flex items-center gap-1 cursor-pointer"
                  id="back-to-catalog-btn"
                >
                  ← {lang === 'FR' ? "Retour au catalogue" : "Back to catalog"}
                </button>
                <h3 className="text-2xl font-black text-stone-950 uppercase tracking-tight">
                  {lang === 'FR' ? "Détails de votre commande" : "Your Purchase Overview"}
                </h3>
              </div>

              {/* High-fidelity summary card */}
              <div className="border-2 border-stone-950 bg-white rounded-[32px] p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                <div className="flex justify-between items-start pb-4 border-b-2 border-stone-950">
                  <div className="space-y-1">
                    <p className="font-black text-stone-950 uppercase tracking-tight text-sm">
                      {lang === 'FR' ? selectedProduct.nameFR : selectedProduct.nameEN}
                    </p>
                    <p className="text-xs text-stone-600 font-bold leading-relaxed">
                      {lang === 'FR' ? selectedProduct.descriptionFR : selectedProduct.descriptionEN}
                    </p>
                  </div>
                  <span className="text-xl font-black text-stone-950 font-mono shrink-0">
                    {selectedProduct.price.toFixed(2)}€
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-mono font-black uppercase tracking-widest text-stone-500">
                    {lang === 'FR' ? "AVANTAGES ET LIVRABLES INCLUS" : "WHAT IS INSTANTLY PROVISIONED"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(lang === 'FR' ? selectedProduct.featuresFR : selectedProduct.featuresEN).map((feat, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start p-3 bg-stone-50 border-2 border-stone-950 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[3]" />
                        <span className="text-[11px] text-stone-800 font-bold leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secure lock information */}
              <div className="p-4 bg-emerald-50/30 border-2 border-stone-950 rounded-2xl flex gap-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-stone-950 uppercase font-mono tracking-wider">
                    {lang === 'FR' ? "Paiement 100% Chiffré et Sécurisé" : "Military-grade SSL Secure Layer"}
                  </p>
                  <p className="text-[10.5px] text-stone-600 leading-relaxed font-bold">
                    {lang === 'FR'
                      ? "Vos informations bancaires ne transitent jamais sur nos serveurs. Transactions sécurisées et chiffrées en direct via la plateforme officielle de Stripe."
                      : "We employ end-to-end encrypted tunnels. Your private card details go directly to Stripe and never touch our servers."}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: Pay Panel */}
            <div className="space-y-5">
              <div className="bg-white border-2 border-stone-950 rounded-[32px] p-6 space-y-5 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                <h4 className="font-mono text-[9px] uppercase tracking-widest font-black text-stone-400">
                  {lang === 'FR' ? "MÉTHODE DE PAIEMENT" : "SECURE BILLING OUTLET"}
                </h4>

                <div className="space-y-4">
                  {isStripeConfigured ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-[#A7F3D0]/20 border-2 border-stone-950 rounded-xl flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-[10px] font-mono font-black text-stone-950 uppercase tracking-widest">
                          {lang === 'FR' ? "Stripe Live Connecté" : "Stripe Gateway Online"}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-stone-600 leading-relaxed">
                        {lang === 'FR'
                          ? "Cliquez ci-dessous pour ouvrir la page de paiement officielle et ultra-sécurisée hébergée par Stripe."
                          : "Press pay below to complete your checkout using Stripe's official secure platform."}
                      </p>

                      <button
                        type="button"
                        onClick={handleLaunchStripeCheckout}
                        className="w-full py-4 bg-[#FF7E5F] hover:bg-[#ff9075] border-2 border-stone-950 text-stone-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] cursor-pointer text-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-2"
                        id="pay-stripe-btn"
                      >
                        <ShoppingBag className="w-4 h-4 text-stone-950" />
                        <span>{lang === 'FR' ? "Payer avec Stripe" : "Pay securely with Stripe"}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Configuration missing notification */}
                      <div className="p-4 bg-[#EDC154]/15 border-2 border-stone-950 rounded-2xl space-y-2">
                        <div className="flex gap-2">
                          <AlertTriangle className="w-4 h-4 text-stone-955 shrink-0 mt-0.5" />
                          <span className="text-[10px] font-mono font-black uppercase text-stone-950 tracking-wider">
                            {lang === 'FR' ? "MODE DÉVELOPPEUR ACTIF" : "SANDBOX MODE DETECTED"}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-700 leading-relaxed font-bold">
                          {lang === 'FR'
                            ? "STRIPE_SECRET_KEY n'est pas configuré. Vous pouvez tester le comportement de la plateforme en simulant un succès ou un échec ci-dessous."
                            : "STRIPE_SECRET_KEY missing in environment variables. You can easily test our application flows using the sandbox simulators below."}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSimulatePayment(false)}
                          className="w-full py-3 bg-[#A7F3D0] hover:bg-[#86efac] border-2 border-stone-950 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] cursor-pointer text-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-1.5"
                          id="simulate-success-btn"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{lang === 'FR' ? "Simuler Succès (Test)" : "Simulate Success"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSimulatePayment(true)}
                          className="w-full py-3 bg-rose-100 hover:bg-rose-200 border-2 border-stone-950 text-rose-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] cursor-pointer text-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-1.5"
                          id="simulate-failure-btn"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>{lang === 'FR' ? "Simuler Échec (Test)" : "Simulate Failure"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: LOADING GATEWAY STATE */}
        {checkoutStep === 'checkout' && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[300px] flex flex-col justify-center items-center p-8 text-center space-y-4"
            id="purchase-checkout-step"
          >
            {paymentState === 'pending' || paymentState === 'processing' ? (
              <>
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 border-t-4 border-r-4 border-stone-950 rounded-full animate-spin"></div>
                  <ShoppingBag className="w-5 h-5 text-stone-950 animate-pulse" />
                </div>
                <div className="space-y-1 pt-2">
                  <p className="font-black uppercase font-mono tracking-widest text-[9px] text-stone-400">
                    {paymentState === 'pending' ? (lang === 'FR' ? "CONSTITUTION DU DOSSIER..." : "INITIATING SECURE HANDSHAKE...") : (lang === 'FR' ? "TRANSMISSION CRYPTÉE SSL EN COURS..." : "PROCESSING ENCRYPTED CLEARANCE...")}
                  </p>
                  <h4 className="text-lg font-black text-stone-950 uppercase tracking-tight">
                    {lang === 'FR' ? "Traitement de votre transaction en cours" : "Processing your secure checkout"}
                  </h4>
                  <p className="text-xs text-stone-500 font-bold">
                    {lang === 'FR' ? "Ne fermez pas cette fenêtre et n'actualisez pas." : "Please hold. Do not refresh or close this tab."}
                  </p>
                </div>
              </>
            ) : paymentState === 'failed' ? (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="w-16 h-16 bg-rose-100 border-2 border-stone-950 text-rose-950 rounded-full flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] animate-bounce">
                  <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest bg-rose-200 border-2 border-stone-950 text-rose-950 px-2.5 py-1 rounded font-black shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                    {lang === 'FR' ? "PAIEMENT REFUSÉ" : "CHECKOUT FAILED"}
                  </span>
                  <h3 className="font-black text-xl text-stone-950 uppercase tracking-tight">
                    {lang === 'FR' ? "Transaction non complétée" : "Transaction Declined"}
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed font-bold">
                    {paymentError || (lang === 'FR' 
                      ? "La simulation de transaction a été rejetée. Votre solde de préparation n'a pas été débité." 
                      : "The payment gateway rejected the transaction token. Your active balance was not charged.")}
                  </p>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setCheckoutStep('summary')}
                    className="px-5 py-3 border-2 border-stone-950 text-stone-850 hover:bg-stone-50 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    id="retry-edit-btn"
                  >
                    {lang === 'FR' ? "Retour au récapitulatif" : "Back to summary"}
                  </button>
                  <button
                    onClick={() => handleSimulatePayment(false)}
                    className="px-5 py-3 bg-stone-950 hover:bg-stone-850 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] cursor-pointer"
                    id="retry-success-btn"
                  >
                    {lang === 'FR' ? "Réessayer avec carte valide" : "Try Again Safely"}
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* STEP 4: SUCCESS & BALANCE UNVEILING */}
        {checkoutStep === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white border-2 border-stone-950 rounded-[32px] p-8 max-w-xl mx-auto space-y-6 text-center shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden"
            id="purchase-success-step"
          >
            {/* Confetti decoration top strip */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#A7F3D0] via-[#EDC154] to-[#FF7E5F]" />
            
            <div className="w-16 h-16 bg-[#A7F3D0] border-2 border-stone-950 text-stone-950 rounded-full flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[9px] uppercase tracking-widest bg-[#A7F3D0] border-2 border-stone-950 text-stone-950 px-2.5 py-1 rounded-md font-black shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                {lang === 'FR' ? "COMMANDE CONFIRMÉE" : "CHECKOUT SECURED & COMPLETE"}
              </span>
              <h2 className="text-2xl font-black text-stone-950 uppercase tracking-tight">
                {lang === 'FR' ? "Merci pour votre achat !" : "Activation Successful!"}
              </h2>
              <p className="text-xs text-stone-600 font-bold max-w-sm mx-auto">
                {lang === 'FR' 
                  ? "Vos crédits ont été alloués à votre compte instantanément. Vous pouvez débuter votre préparation dès maintenant !" 
                  : "We have updated your active preparation balances in real time. Inspect your refreshed console below."}
              </p>
            </div>

            {/* Balances Display Card */}
            {monetization && (
              <div className="bg-stone-50 border-2 border-stone-950 p-5 rounded-2xl text-left space-y-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                <p className="text-[9px] font-mono font-black uppercase tracking-widest text-stone-400 border-b-2 border-stone-200 pb-1.5">
                  {lang === 'FR' ? "Nouveau solde disponible" : "UPDATED CONSOLE BALANCES"}
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                  <div className="space-y-1">
                    <p className="text-stone-500 uppercase text-[9px] tracking-wider">{lang === 'FR' ? "Entraînements Audio" : "Voice Sessions"}</p>
                    <p className="text-lg font-black text-stone-950 font-mono">
                      {monetization.ultraActive ? (
                        <span className="text-[#FF7E5F]">∞ (Ultra Unlimited)</span>
                      ) : (
                        <span>{monetization.freeAudio + monetization.packAudio + monetization.topUpAudio}</span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-stone-500 uppercase text-[9px] tracking-wider">{lang === 'FR' ? "Évaluations Miroir" : "Mirror Evaluations"}</p>
                    <p className="text-lg font-black text-stone-950 font-mono">
                      {monetization.ultraActive ? (
                        <span className="text-[#FF7E5F]">∞ (Ultra Unlimited)</span>
                      ) : (
                        <span>{monetization.freeMirror + monetization.packMirror + monetization.topUpMirror}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Recommended Actions */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FF7E5F]">
                {lang === 'FR' ? "QUE VOULEZ-VOUS FAIRE ENSUITE ?" : "NEXT RECOMMENDED PRACTICE CHANNELS"}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    onNavigateTab('train');
                    if (onSuccessClose) onSuccessClose();
                  }}
                  className="flex-1 py-3.5 bg-[#A7F3D0] hover:bg-[#86efac] border-2 border-stone-950 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                  id="success-start-train-btn"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-stone-950" />
                  <span>{lang === 'FR' ? "S'entraîner" : "Start Training"}</span>
                </button>

                <button
                  onClick={() => {
                    onNavigateTab('assessment');
                    if (onSuccessClose) onSuccessClose();
                  }}
                  className="flex-1 py-3.5 bg-[#EDC154] hover:bg-[#ffdf7e] border-2 border-stone-950 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                  id="success-use-mirror-btn"
                >
                  <Flame className="w-3.5 h-3.5 text-stone-950" />
                  <span>{lang === 'FR' ? "Évaluation Miroir" : "Use Mirror"}</span>
                </button>

                <button
                  onClick={() => {
                    onNavigateTab('home');
                    if (onSuccessClose) onSuccessClose();
                  }}
                  className="flex-1 py-3.5 bg-white hover:bg-stone-50 border-2 border-stone-950 text-stone-800 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                  id="success-continue-btn"
                >
                  {lang === 'FR' ? "Retour Accueil" : "Continue Sandbox"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
