import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, ShieldCheck, Check, Sparkles, X, ChevronRight, ShoppingBag, Landmark, Smartphone, Wallet } from 'lucide-react';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';

export interface ProductInfo {
  id: string;
  nameEN: string;
  nameFR: string;
  price: number;
  descriptionEN: string;
  descriptionFR: string;
  featuresEN: string[];
  featuresFR: string[];
}

export const MONETIZATION_PRODUCTS: ProductInfo[] = [
  {
    id: 'pack_starter',
    nameEN: 'Starter Pack',
    nameFR: 'Pack Starter',
    price: 3.99,
    descriptionEN: 'Perfect for light preparation and discovering SHANA.',
    descriptionFR: 'Idéal pour une préparation légère et découvrir SHANA.',
    featuresEN: ['3 Audio Training Sessions', 'No expiration date', 'Repurchase anytime'],
    featuresFR: ['3 Sessions d’Entraînement Vocal', 'Sans date d’expiration', 'Rachetable à tout moment']
  },
  {
    id: 'pack_premium',
    nameEN: 'Premium Pack',
    nameFR: 'Pack Premium',
    price: 7.99,
    descriptionEN: 'For serious candidates aiming for standard corporate roles.',
    descriptionFR: 'Pour les candidats sérieux visant des postes de niveau intermédiaire.',
    featuresEN: ['5 Audio Training Sessions', '1 Full Mirror Evaluation', 'No expiration date', 'Repurchase anytime'],
    featuresFR: ['5 Sessions d’Entraînement Vocal', '1 Évaluation Miroir Complète', 'Sans date d’expiration', 'Rachetable à tout moment']
  },
  {
    id: 'sub_ultra',
    nameEN: 'Ultra Unlimited',
    nameFR: 'Ultra Illimité',
    price: 39.99,
    descriptionEN: 'Unlimited practice room access for executive-level confidence.',
    descriptionFR: 'Accès illimité pour une confiance absolue de niveau exécutif.',
    featuresEN: ['Unlimited Audio Training Sessions', 'Unlimited Mirror Evaluations', 'Monthly auto-renewal', 'Cancel anytime'],
    featuresFR: ['Sessions d’Entraînement Vocal Illimitées', 'Évaluations Miroir Illimitées', 'Renouvellement mensuel', 'Annulation à tout moment']
  },
  {
    id: 'topup_1_audio',
    nameEN: '+1 Audio Session',
    nameFR: '+1 Session Audio',
    price: 1.49,
    descriptionEN: 'Quick booster for one training.',
    descriptionFR: 'Recharge rapide pour un entraînement.',
    featuresEN: ['1 Audio Training Session', 'Never expires'],
    featuresFR: ['1 Session d’Entraînement Vocal', 'Sans expiration']
  },
  {
    id: 'topup_3_audio',
    nameEN: '+3 Audio Sessions',
    nameFR: '+3 Sessions Audio',
    price: 3.49,
    descriptionEN: 'Optimized training top-up.',
    descriptionFR: 'Recharge d’entraînement optimisée.',
    featuresEN: ['3 Audio Training Sessions', 'Never expires'],
    featuresFR: ['3 Sessions d’Entraînement Vocal', 'Sans expiration']
  },
  {
    id: 'topup_1_mirror',
    nameEN: '+1 Mirror Session',
    nameFR: '+1 Session Miroir',
    price: 2.99,
    descriptionEN: 'Add an extra assessment block.',
    descriptionFR: 'Ajoutez un bloc d’évaluation supplémentaire.',
    featuresEN: ['1 Mirror Evaluation Session', 'Never expires'],
    featuresFR: ['1 Évaluation Miroir', 'Sans expiration']
  }
];

interface CheckoutModalProps {
  productId: string;
  userId: string;
  lang: 'FR' | 'EN';
  onClose: () => void;
  onSuccess: (updatedMonetization: any) => void;
}

export default function CheckoutModal({ productId, userId, lang, onClose, onSuccess }: CheckoutModalProps) {
  const { addToast } = useToast();
  const product = MONETIZATION_PRODUCTS.find(p => p.id === productId);
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile' | 'invoice' | 'wallet'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'checkout' | 'success'>('checkout');
  const [receipt, setReceipt] = useState<any>(null);

  if (!product) return null;

  // Listen for Stripe popup messages
  useEffect(() => {
    const handleStripeMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      
      if (event.data?.type === 'STRIPE_PAYMENT_SUCCESS') {
        const { productId: pId, userId: uId } = event.data;
        if (pId === productId && uId === userId) {
          try {
            const updated = StorageService.addCandidatePurchase(userId, productId);
            const newReceipt = updated.purchases[0];
            setReceipt(newReceipt);
            setCheckoutStep('success');
            setIsProcessing(false);
            addToast({
              title: lang === 'FR' ? "Achat Réussi (Stripe) !" : "Purchase Successful (Stripe)!",
              description: lang === 'FR' 
                ? `Le produit "${product.nameFR}" a été activé via Stripe.` 
                : `Product "${product.nameEN}" was activated via Stripe.`,
              type: "success"
            });
            onSuccess(updated);
          } catch (err: any) {
            setIsProcessing(false);
            addToast({
              title: "Error",
              description: err.message || "Failed to update purchase records.",
              type: "error"
            });
          }
        }
      } else if (event.data?.type === 'STRIPE_PAYMENT_CANCEL') {
        setIsProcessing(false);
        addToast({
          title: lang === 'FR' ? "Paiement annulé" : "Payment Cancelled",
          description: lang === 'FR' ? "Vous avez annulé la transaction Stripe." : "You have cancelled the Stripe transaction.",
          type: "warning"
        });
      }
    };
    
    window.addEventListener('message', handleStripeMessage);
    return () => window.removeEventListener('message', handleStripeMessage);
  }, [productId, userId, product, lang, onSuccess, addToast]);

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

  const handleProcessPayment = () => {
    if (paymentMethod === 'card' || paymentMethod === 'mobile') {
      setIsProcessing(true);
      const currentOrigin = window.location.origin;
      const checkoutUrl = `/api/commerce/stripe/checkout?productId=${encodeURIComponent(productId)}&userId=${encodeURIComponent(userId)}&origin=${encodeURIComponent(currentOrigin)}`;

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
        setIsProcessing(false);
      }
      return;
    }

    setIsProcessing(true);

    // Simulate Payment Gateway Delay for fallback wallet/invoice payments
    setTimeout(() => {
      try {
        const updated = StorageService.addCandidatePurchase(userId, productId);
        const newReceipt = updated.purchases[0];
        setReceipt(newReceipt);
        setCheckoutStep('success');
        setIsProcessing(false);
        addToast({
          title: lang === 'FR' ? "Achat Réussi !" : "Purchase Successful!",
          description: lang === 'FR' 
            ? `Le produit "${product.nameFR}" a été activé avec succès.` 
            : `Product "${product.nameEN}" was activated successfully.`,
          type: "success"
        });
        onSuccess(updated);
      } catch (err: any) {
        setIsProcessing(false);
        addToast({
          title: lang === 'FR' ? "Erreur" : "Error",
          description: err.message || "Failed to process purchase.",
          type: "error"
        });
      }
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-[#1A2B3C]/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-white border border-[#E5E7EB] shadow-2xl rounded-[32px] w-full max-w-lg overflow-hidden relative"
      >
        {/* Header decoration bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 w-full" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#9CA3AF] hover:text-[#1A2B3C] hover:bg-neutral-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {checkoutStep === 'checkout' ? (
            <motion.div 
              key="checkout"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="p-6 md:p-8 space-y-6 text-left"
            >
              {/* Product Info Block */}
              <div className="space-y-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 font-bold">
                  {lang === 'FR' ? "PAIEMENT SÉCURISÉ" : "SECURE CHECKOUT"}
                </span>
                <div className="flex justify-between items-baseline mt-2">
                  <h2 className="text-xl md:text-2xl font-sans font-extrabold text-[#1A2B3C]">
                    {lang === 'FR' ? product.nameFR : product.nameEN}
                  </h2>
                  <span className="text-2xl font-black text-indigo-600">
                    {product.price.toFixed(2)}€
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] font-medium leading-relaxed">
                  {lang === 'FR' ? product.descriptionFR : product.descriptionEN}
                </p>
              </div>

              {/* Payment Methods Tabs */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#9CA3AF]">
                  {lang === 'FR' ? "MÉTHODE DE PAIEMENT" : "PAYMENT METHOD"}
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === 'card' 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold' 
                        : 'border-neutral-200 bg-white text-stone-500 hover:bg-neutral-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-mono uppercase tracking-wider">{lang === 'FR' ? "CARTE" : "CARD"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === 'mobile' 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold' 
                        : 'border-neutral-200 bg-white text-stone-500 hover:bg-neutral-50'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-mono uppercase tracking-wider">{lang === 'FR' ? "MOBILE" : "MOBILE"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('invoice')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === 'invoice' 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold' 
                        : 'border-neutral-200 bg-white text-stone-500 hover:bg-neutral-50'
                    }`}
                  >
                    <Landmark className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-mono uppercase tracking-wider">{lang === 'FR' ? "FACTURÉ" : "NET 30"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === 'wallet' 
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold' 
                        : 'border-neutral-200 bg-white text-stone-500 hover:bg-neutral-50'
                    }`}
                  >
                    <Wallet className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-mono uppercase tracking-wider">{lang === 'FR' ? "PORTEFEUILLE" : "WALLET"}</span>
                  </button>
                </div>
              </div>

              {/* Secure Inputs Block */}
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-5 rounded-2xl space-y-4">
                {paymentMethod === 'card' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A2B3C] block">
                        {lang === 'FR' ? "NOM SUR LA CARTE" : "CARDHOLDER NAME"}
                      </label>
                      <input 
                        type="text" 
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Jean Candidat"
                        className="w-full bg-white border border-[#E5E7EB] focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl px-4 py-2 text-xs outline-none font-medium text-stone-900 placeholder-[#9CA3AF]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A2B3C] block">
                        {lang === 'FR' ? "NUMÉRO DE CARTE" : "CARD NUMBER"}
                      </label>
                      <input 
                        type="text" 
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="•••• •••• •••• ••••"
                        className="w-full bg-white border border-[#E5E7EB] focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl px-4 py-2 text-xs outline-none font-medium font-mono text-stone-900 placeholder-[#9CA3AF]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A2B3C] block">
                          {lang === 'FR' ? "EXPIRATION" : "EXPIRY DATE"}
                        </label>
                        <input 
                          type="text" 
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          className="w-full bg-white border border-[#E5E7EB] focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl px-4 py-2 text-xs outline-none font-medium font-mono text-stone-900 placeholder-[#9CA3AF]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A2B3C] block">
                          CVC / CVV
                        </label>
                        <input 
                          type="password" 
                          value={cardCvc}
                          onChange={handleCvcChange}
                          placeholder="•••"
                          className="w-full bg-white border border-[#E5E7EB] focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl px-4 py-2 text-xs outline-none font-medium font-mono text-stone-900 placeholder-[#9CA3AF]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'mobile' && (
                  <div className="py-4 text-center space-y-3 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full border border-[#E5E7EB] shadow-xs text-stone-900">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-stone-800">
                      {lang === 'FR' 
                        ? "Paiement en un clic avec Apple Pay / Google Pay" 
                        : "One-click Checkout with Apple Pay / Google Pay"}
                    </p>
                    <p className="text-[10px] text-[#6B7280] max-w-xs mx-auto">
                      {lang === 'FR' 
                        ? "Double-cliquez pour confirmer l'empreinte biométrique ou le mot de passe." 
                        : "Double-click to confirm biometric touchID or facial recognition."}
                    </p>
                  </div>
                )}

                {paymentMethod === 'invoice' && (
                  <div className="py-4 text-center space-y-3 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full border border-[#E5E7EB] shadow-xs text-stone-900">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-stone-800">
                      {lang === 'FR' 
                        ? "Facturation différée Net 30" 
                        : "Deferred Corporate Invoice (Net 30)"}
                    </p>
                    <p className="text-[10px] text-[#6B7280] max-w-xs mx-auto">
                      {lang === 'FR' 
                        ? "La facture sera envoyée directement au service RH ou achats de votre entreprise." 
                        : "Invoice receipt will be forwarded automatically to your corporate human resources or procurement dashboard."}
                    </p>
                  </div>
                )}

                {paymentMethod === 'wallet' && (
                  <div className="py-4 text-center space-y-3 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full border border-[#E5E7EB] shadow-xs text-stone-900">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-stone-800">
                      {lang === 'FR' 
                        ? "Déduire du solde de crédits de l'entreprise" 
                        : "Deduct from allocated corporate balance"}
                    </p>
                    <p className="text-[10px] text-[#6B7280] max-w-xs mx-auto">
                      {lang === 'FR' 
                        ? "Déduit instantanément de l'allocation budgétaire de votre espace équipe." 
                        : "Instantly deducted from the organizational team credits assigned by your platform manager."}
                    </p>
                  </div>
                )}

                {/* Secure Trust Info */}
                <div className="flex items-center gap-2.5 text-[#6B7280]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[10px] font-semibold leading-none">
                    {lang === 'FR' 
                      ? "Paiement crypté SSL 256-bit hautement sécurisé." 
                      : "AES 256-bit banking grade SSL encrypted secure tunnel."}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="w-1/3 py-3.5 border border-neutral-200 text-stone-500 hover:bg-neutral-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 cursor-pointer text-center"
                >
                  {lang === 'FR' ? "Annuler" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                  className="w-2/3 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{lang === 'FR' ? "Traitement..." : "Processing..."}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {lang === 'FR' 
                          ? `Payer ${product.price.toFixed(2)}€` 
                          : `Pay ${product.price.toFixed(2)}€`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 md:p-8 text-center space-y-6 animate-fade-in"
            >
              {/* Confetti Ripple */}
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-600 shadow-inner">
                <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-500 animate-pulse" />
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-sans font-black text-[#1A2B3C]">
                  {lang === 'FR' ? "Paiement Confirmé !" : "Payment Confirmed!"}
                </h2>
                <p className="text-xs text-[#6B7280] font-semibold max-w-sm mx-auto leading-relaxed">
                  {lang === 'FR' 
                    ? `Votre achat de "${product.nameFR}" a été traité avec succès et vos crédits ont été mis à jour.` 
                    : `Your purchase of "${product.nameEN}" was finalized successfully and your credits are ready to use.`}
                </p>
              </div>

              {/* Receipt info */}
              {receipt && (
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-4 text-left text-xs font-medium space-y-2 text-[#4B5563]">
                  <div className="flex justify-between border-b border-[#F3F4F6] pb-2 text-[10px] font-mono text-[#9CA3AF] uppercase font-bold">
                    <span>{lang === 'FR' ? "Reçu de paiement" : "Receipt statement"}</span>
                    <span>#{receipt.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang === 'FR' ? "Produit" : "Product"}</span>
                    <span className="font-bold text-[#1A2B3C]">{lang === 'FR' ? product.nameFR : product.nameEN}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang === 'FR' ? "Date" : "Date"}</span>
                    <span>{new Date(receipt.date).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#F3F4F6] pt-2 font-bold text-stone-900">
                    <span>{lang === 'FR' ? "Total Facturé" : "Total Charged"}</span>
                    <span className="text-indigo-600">{product.price.toFixed(2)}€</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-[#1A2B3C] hover:bg-[#2C3E50] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <span>{lang === 'FR' ? "Continuer l'expérience SHANA" : "Proceed with SHANA"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
