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
  Calendar,
  AlertOctagon,
  LifeBuoy
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
  
  // Payment inputs
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  
  // Recovery transaction
  const [recoverableTx, setRecoverableTx] = useState<any>(null);

  // Loaded candidate balance
  const [monetization, setMonetization] = useState<any>(null);

  useEffect(() => {
    setMonetization(StorageService.getCandidateMonetization(userId));
    
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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setCardExpiry(val);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 4));
  };

  const triggerProcessPayment = async (forceSimulateFailure = false) => {
    setCheckoutStep('checkout');
    setPaymentError(null);
    
    if (!forceSimulateFailure) {
      setPaymentState('processing');
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
      return;
    }

    const method = 'card_failed_sim';
    
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
      console.warn("Payment workflow error:", err);
      // Stays on checkout screen displaying error details
    }
  };

  const triggerRecoveryRetry = async () => {
    if (!recoverableTx) return;
    setCheckoutStep('checkout');
    setPaymentError(null);
    
    try {
      // Find the actual product to bind it as selected
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
    <div className="w-full max-w-4xl mx-auto space-y-8 font-sans">
      
      {/* Recovery Banner */}
      <AnimatePresence>
        {recoverableTx && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left shadow-xs"
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="font-extrabold text-xs uppercase tracking-wider text-amber-900">
                  {lang === 'FR' ? "PAIEMENT ÉCHOUÉ RETROUVÉ" : "RECOVERABLE TRANSACTION DETECTED"}
                </p>
                <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                  {lang === 'FR' 
                    ? `Votre précédente tentative d'achat du "${MONETIZATION_PRODUCTS.find(p => p.id === recoverableTx.productId)?.nameFR}" a échoué. Reprenez là où vous vous étiez arrêté.` 
                    : `Your last checkout attempt for "${MONETIZATION_PRODUCTS.find(p => p.id === recoverableTx.productId)?.nameEN}" was interrupted. Resume now with zero friction.`}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={() => RecoveryManager.dismissRecovery(userId, recoverableTx.id)}
                className="px-4 py-2 border border-amber-200 text-amber-700 hover:bg-amber-100 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer flex-1 md:flex-initial"
              >
                {lang === 'FR' ? "Ignorer" : "Dismiss"}
              </button>
              
              <button
                onClick={triggerRecoveryRetry}
                className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer flex-1 md:flex-initial flex items-center justify-center gap-1.5 shadow-sm"
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
          >
            <div className="text-left space-y-2">
              <h2 className="text-2xl font-black text-[#1A2B3C] tracking-tight">
                {lang === 'FR' ? "Propulsez votre préparation" : "Elevate Your Interview Readiness"}
              </h2>
              <p className="text-xs text-stone-500 font-semibold">
                {lang === 'FR' 
                  ? "Sélectionnez le pack adapté à vos objectifs d'entretien professionnels." 
                  : "Select the optimized preparation block aligned with your professional career milestones."}
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
                    className={`relative rounded-[32px] p-6 border text-left transition-all cursor-pointer flex flex-col justify-between h-[360px] select-none ${
                      isSelected 
                        ? 'border-indigo-600 bg-white ring-2 ring-indigo-600 shadow-lg scale-[1.02]' 
                        : 'border-neutral-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    {isUltra && (
                      <span className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-[9px] font-extrabold uppercase rounded-full tracking-wider shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3 animate-pulse" />
                        <span>POPULAR / RECOMMENDED</span>
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-black text-[#1A2B3C] tracking-tight">
                          {lang === 'FR' ? prod.nameFR : prod.nameEN}
                        </h4>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 mt-0.5">
                          {isUltra ? (lang === 'FR' ? "MENSUELE" : "MONTHLY SUBSCRIPTION") : (lang === 'FR' ? "RECHARGE UNIQUE" : "ONE-TIME RECHARGE")}
                        </p>
                      </div>

                      <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                        {lang === 'FR' ? prod.descriptionFR : prod.descriptionEN}
                      </p>

                      <ul className="space-y-2 pt-2">
                        {(lang === 'FR' ? prod.featuresFR : prod.featuresEN).map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-[11px] text-stone-700 font-bold leading-none">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex justify-between items-baseline">
                      <span className="text-2xl font-black text-[#1A2B3C]">{prod.price.toFixed(2)}€</span>
                      <span className={`text-[11px] font-bold uppercase transition-colors ${isSelected ? 'text-indigo-600' : 'text-stone-400'}`}>
                        {isSelected ? (lang === 'FR' ? "Sélectionné ✓" : "Selected ✓") : (lang === 'FR' ? "Choisir" : "Choose")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top-ups Section */}
            <div className="bg-stone-50 border border-stone-150 rounded-[32px] p-6 space-y-4 text-left">
              <div>
                <h4 className="text-sm font-black text-[#1A2B3C]">
                  {lang === 'FR' ? "Besoin de sessions supplémentaires uniquement ?" : "Looking for micro sessions only?"}
                </h4>
                <p className="text-[11px] text-stone-500 font-semibold">
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
                      className={`p-4 rounded-2xl border text-left flex justify-between items-center cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-600 bg-white ring-1 ring-indigo-600 shadow-sm' 
                          : 'border-neutral-200 bg-white hover:border-indigo-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-[#1A2B3C]">{lang === 'FR' ? prod.nameFR : prod.nameEN}</p>
                        <p className="text-[10px] text-stone-500 font-semibold">{prod.price.toFixed(2)}€</p>
                      </div>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-stone-300'}`}>
                        {isSelected && <span className="w-2 h-2 bg-indigo-600 rounded-full" />}
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
                className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>{lang === 'FR' ? "Récapitulatif de la commande" : "Review Summary"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: SUMMARY & BILLING SCHEMAS */}
        {checkoutStep === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
          >
            {/* Left side: Benefit Checklist */}
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-1.5">
                <button
                  onClick={() => setCheckoutStep('selection')}
                  className="text-indigo-600 hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  ← {lang === 'FR' ? "Retour aux produits" : "Back to catalog"}
                </button>
                <h3 className="text-2xl font-black text-[#1A2B3C] tracking-tight">
                  {lang === 'FR' ? "Détails de votre commande" : "Your Purchase Overview"}
                </h3>
              </div>

              {/* High-fidelity summary card */}
              <div className="border border-stone-200/80 bg-white rounded-[32px] p-6 space-y-4">
                <div className="flex justify-between items-start pb-4 border-b border-stone-100">
                  <div className="space-y-1">
                    <p className="font-extrabold text-[#1A2B3C] text-sm">
                      {lang === 'FR' ? selectedProduct.nameFR : selectedProduct.nameEN}
                    </p>
                    <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                      {lang === 'FR' ? selectedProduct.descriptionFR : selectedProduct.descriptionEN}
                    </p>
                  </div>
                  <span className="text-xl font-black text-[#1A2B3C] shrink-0">
                    {selectedProduct.price.toFixed(2)}€
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#9CA3AF]">
                    {lang === 'FR' ? "AVANTAGES ET LIVRABLES INCLUS" : "WHAT YOU RECEIVE IN REAL-TIME"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(lang === 'FR' ? selectedProduct.featuresFR : selectedProduct.featuresEN).map((feat, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start p-3 bg-stone-50 border border-stone-100 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-stone-700 font-bold leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secure lock information */}
              <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-emerald-950">
                    {lang === 'FR' ? "Paiement 100% Chiffré et Sécurisé" : "Military-grade 256-bit Secure Layer"}
                  </p>
                  <p className="text-[10.5px] text-emerald-800 leading-relaxed font-semibold">
                    {lang === 'FR'
                      ? "Vos informations bancaires ne transitent jamais sur nos serveurs. Transactions sécurisées via protocole SSL standard."
                      : "We employ end-to-end encrypted tunnels. Your private card tokens are fully protected and never persist in clean state."}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: Pay Panel */}
            <div className="space-y-6">
              <div className="bg-stone-900 text-white rounded-[32px] p-6 space-y-6">
                <h4 className="font-mono text-[10px] uppercase tracking-wider font-extrabold text-stone-400">
                  {lang === 'FR' ? "SÉLECTIONNER LE MOYEN DE PAIEMENT" : "SECURE CHECKOUT INPUT"}
                </h4>

                <form className="space-y-4 text-xs" onSubmit={(e) => { e.preventDefault(); triggerProcessPayment(false); }}>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                      {lang === 'FR' ? "Nom complet sur la carte" : "CARDHOLDER FULL NAME"}
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Marie Dubois"
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3.5 py-3 text-xs outline-none text-white placeholder-stone-500 font-medium font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                      {lang === 'FR' ? "Numéro de carte bancaire" : "CARD NUMBER"}
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-stone-800 border border-stone-700 pl-10 pr-3.5 py-3 rounded-xl text-xs outline-none text-white placeholder-stone-500 font-medium font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                        {lang === 'FR' ? "Expiration" : "EXP DATE"}
                      </label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3.5 py-3 text-xs outline-none text-white placeholder-stone-500 font-medium font-mono text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                        CVC
                      </label>
                      <input
                        type="text"
                        required
                        value={cardCvc}
                        onChange={handleCvcChange}
                        placeholder="123"
                        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3.5 py-3 text-xs outline-none text-white placeholder-stone-500 font-medium font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      type="submit"
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center text-xs"
                    >
                      {lang === 'FR' ? "Payer maintenant" : "Pay Securely"}
                    </button>

                    {/* Simulation recovery trigger trigger */}
                    <button
                      type="button"
                      onClick={() => triggerProcessPayment(true)}
                      className="w-full py-3 bg-red-950/40 border border-red-900/60 text-red-400 hover:bg-red-950/60 font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer text-center text-[10px]"
                      title={lang === 'FR' ? "Simuler un échec de paiement pour tester la récupération" : "Simulate payment failure to test recovery engine"}
                    >
                      ⚠️ {lang === 'FR' ? "Simuler échec (Test)" : "Simulate Failure (Test)"}
                    </button>
                  </div>
                </form>
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
          >
            {paymentState === 'pending' || paymentState === 'processing' ? (
              <>
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 border-t-2 border-r-2 border-indigo-600 rounded-full animate-spin"></div>
                  <ShoppingBag className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold uppercase font-mono tracking-widest text-[10px] text-stone-500">
                    {paymentState === 'pending' ? (lang === 'FR' ? "CONSTITUTION DU DOSSIER..." : "INITIATING PROTOCOL...") : (lang === 'FR' ? "TRANSMISSION BANCAIRE SSL SÉCURISÉE..." : "SECURE ENCRYPTED CLEARANCE...")}
                  </p>
                  <h4 className="text-lg font-black text-[#1A2B3C] font-sans">
                    {lang === 'FR' ? "Traitement de votre transaction en cours" : "Processing your secure checkout"}
                  </h4>
                  <p className="text-xs text-stone-400 font-semibold">
                    {lang === 'FR' ? "Ne fermez pas cette fenêtre et n'actualisez pas." : "Please hold. Do not refresh or exit."}
                  </p>
                </div>
              </>
            ) : paymentState === 'failed' ? (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest bg-red-100 border border-red-200 text-red-800 px-2.5 py-1 rounded font-bold">
                    {lang === 'FR' ? "PAIEMENT REFUSÉ" : "CHECKOUT FAILED"}
                  </span>
                  <h3 className="font-sans font-black text-xl text-[#1A2B3C]">
                    {lang === 'FR' ? "Transaction non complétée" : "Transaction Declined"}
                  </h3>
                  <p className="text-stone-500 text-xs leading-relaxed font-semibold">
                    {paymentError || (lang === 'FR' 
                      ? "La passerelle de paiement a retourné une erreur. Veuillez revérifier vos informations de carte." 
                      : "The payment gateway rejected the simulation token. Your active balance was not charged.")}
                  </p>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setCheckoutStep('summary')}
                    className="px-5 py-3 border border-stone-200 text-[#1A2B3C] hover:bg-neutral-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    {lang === 'FR' ? "Modifier les informations" : "Edit Details"}
                  </button>
                  <button
                    onClick={() => triggerProcessPayment(false)}
                    className="px-5 py-3 bg-[#1A2B3C] hover:bg-[#2C3E50] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
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
            className="bg-white border border-stone-200/80 rounded-[32px] p-8 max-w-xl mx-auto space-y-6 text-center shadow-md relative overflow-hidden"
          >
            {/* Confetti simulation overlay */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500" />
            
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[9px] uppercase tracking-widest bg-emerald-100 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-md font-bold">
                {lang === 'FR' ? "COMMANDE CONFIRMÉE" : "CHECKOUT SECURED & COMPLETE"}
              </span>
              <h2 className="text-2xl font-black text-[#1A2B3C] tracking-tight">
                {lang === 'FR' ? "Merci pour votre achat !" : "Activation Successful!"}
              </h2>
              <p className="text-xs text-stone-500 font-semibold max-w-sm mx-auto">
                {lang === 'FR' 
                  ? "Vos crédits ont été alloués à votre compte instantanément. Vous pouvez débuter votre préparation." 
                  : "We have updated your preparation balances. Check your real-time console below."}
              </p>
            </div>

            {/* Balances Display Card */}
            {monetization && (
              <div className="bg-stone-50 border border-stone-150 p-5 rounded-2xl text-left space-y-3">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#9CA3AF] border-b border-stone-200 pb-1.5">
                  {lang === 'FR' ? "Nouveau solde disponible" : "UPDATED CONSOLE BALANCES"}
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-stone-500 font-bold">{lang === 'FR' ? "Entraînements Audio" : "Voice Sessions"}</p>
                    <p className="text-lg font-black text-[#1A2B3C]">
                      {monetization.ultraActive ? (
                        <span className="text-indigo-600">∞ (Ultra Unlimited)</span>
                      ) : (
                        <span>{monetization.freeAudio + monetization.packAudio + monetization.topUpAudio}</span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-stone-500 font-bold">{lang === 'FR' ? "Évaluations Miroir" : "Mirror Evaluations"}</p>
                    <p className="text-lg font-black text-[#1A2B3C]">
                      {monetization.ultraActive ? (
                        <span className="text-indigo-600">∞ (Ultra Unlimited)</span>
                      ) : (
                        <span>{monetization.freeMirror + monetization.packMirror + monetization.topUpMirror}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Recommended Actions (Phase 2 Rule: No Forced Navigation) */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600">
                {lang === 'FR' ? "QUE VOULEZ-VOUS FAIRE ENSUITE ?" : "NEXT RECOMMENDED PREPARATION CHANNELS"}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    onNavigateTab('train');
                    if (onSuccessClose) onSuccessClose();
                  }}
                  className="flex-1 py-3 bg-[#1A2B3C] hover:bg-[#2C3E50] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{lang === 'FR' ? "S'entraîner à haute voix" : "Start Training"}</span>
                </button>

                <button
                  onClick={() => {
                    onNavigateTab('assessment');
                    if (onSuccessClose) onSuccessClose();
                  }}
                  className="flex-1 py-3 border border-stone-200 text-[#1A2B3C] hover:bg-neutral-50 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5 text-[#1A2B3C]" />
                  <span>{lang === 'FR' ? "Faire Évaluation Miroir" : "Use Mirror"}</span>
                </button>

                <button
                  onClick={() => {
                    onNavigateTab('home');
                    if (onSuccessClose) onSuccessClose();
                  }}
                  className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95"
                >
                  {lang === 'FR' ? "Retour au tableau de bord" : "Continue Practice"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
