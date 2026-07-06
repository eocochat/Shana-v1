import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, ShieldCheck, Check, Sparkles, X, ChevronRight, ShoppingBag, AlertTriangle, Play, Flame } from 'lucide-react';
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
  
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'checkout' | 'success'>('checkout');
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    // Check Stripe configuration status from Express backend
    fetch('/api/commerce/stripe/status')
      .then(res => res.json())
      .then(data => {
        setIsStripeConfigured(!!data.configured);
      })
      .catch(err => {
        console.warn("Failed to retrieve Stripe configuration status, defaulting to simulator:", err);
        setIsStripeConfigured(false);
      });
  }, []);

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
              title: lang === 'FR' ? "Achat Réussi !" : "Purchase Successful!",
              description: lang === 'FR' 
                ? `Le produit "${product?.nameFR}" a été activé via Stripe.` 
                : `Product "${product?.nameEN}" was activated via Stripe.`,
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

  if (!product) return null;

  const handleLaunchStripeCheckout = () => {
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
  };

  const handleSimulatePayment = (success: boolean) => {
    setIsProcessing(true);
    setTimeout(() => {
      if (success) {
        try {
          const updated = StorageService.addCandidatePurchase(userId, productId);
          const newReceipt = updated.purchases[0];
          setReceipt(newReceipt);
          setCheckoutStep('success');
          setIsProcessing(false);
          addToast({
            title: lang === 'FR' ? "Achat Réussi (Simulation) !" : "Purchase Successful (Simulated)!",
            description: lang === 'FR' 
              ? `Le produit "${product.nameFR}" a été activé avec succès.` 
              : `Product "${product.nameEN}" was activated successfully.`,
            type: "success"
          });
          onSuccess(updated);
        } catch (err: any) {
          setIsProcessing(false);
          addToast({
            title: "Error",
            description: err.message || "Failed to process simulation.",
            type: "error"
          });
        }
      } else {
        setIsProcessing(false);
        addToast({
          title: lang === 'FR' ? "Paiement Échoué (Simulation)" : "Payment Failed (Simulated)",
          description: lang === 'FR' ? "Simulation d'un échec de paiement pour tester la résilience." : "Simulated a failed credit card payment.",
          type: "error"
        });
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 font-sans" id="stripe-checkout-modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-white border-[3px] border-stone-950 shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] rounded-[32px] w-full max-w-lg overflow-hidden relative"
        id="stripe-checkout-modal-box"
      >
        {/* Header decoration bar */}
        <div className="h-2 bg-gradient-to-r from-[#A7F3D0] via-[#EDC154] to-[#FF7E5F] w-full" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-500 hover:text-stone-950 hover:bg-stone-100 rounded-full transition-colors z-10 border-2 border-transparent hover:border-stone-950 cursor-pointer"
          id="checkout-close-btn"
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
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md border-2 border-stone-950 font-black ${
                    isStripeConfigured ? 'bg-[#A7F3D0] text-stone-950' : 'bg-[#EDC154] text-stone-950'
                  }`}>
                    {isStripeConfigured 
                      ? (lang === 'FR' ? "STRIPE DIRECT LIVE" : "STRIPE SECURE CONNECTED")
                      : (lang === 'FR' ? "PASSERELLE DE TEST" : "DEVELOPER SANDBOX MODE")
                    }
                  </span>
                </div>
                <div className="flex justify-between items-baseline mt-2.5">
                  <h2 className="text-xl md:text-2xl font-black text-stone-950 uppercase tracking-tight">
                    {lang === 'FR' ? product.nameFR : product.nameEN}
                  </h2>
                  <span className="text-2xl font-black text-stone-950 font-mono">
                    {product.price.toFixed(2)}€
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-bold leading-relaxed pt-1">
                  {lang === 'FR' ? product.descriptionFR : product.descriptionEN}
                </p>
              </div>

              {/* Bullet Features Block */}
              <div className="bg-stone-50 border-2 border-stone-950 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-500 block mb-1">
                  {lang === 'FR' ? "AVANTAGES ET LIVRABLES INCLUS" : "WHAT IS INSTANTLY ALLOCATED"}
                </span>
                <ul className="space-y-1.5">
                  {(lang === 'FR' ? product.featuresFR : product.featuresEN).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-stone-850 font-bold">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Secure Trust Info / Config Guide */}
              {!isStripeConfigured ? (
                <div className="p-4 bg-[#EDC154]/15 border-2 border-stone-950 rounded-2xl space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-stone-950 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-mono font-black text-stone-950 uppercase tracking-wider text-[10px]">
                        {lang === 'FR' ? "CLÉ API STRIPE MANQUANTE" : "STRIPE API KEY SEALED"}
                      </p>
                      <p className="text-stone-850 font-bold leading-relaxed">
                        {lang === 'FR'
                          ? "Pour activer de vrais paiements par carte, configurez STRIPE_SECRET_KEY dans les Secrets AI Studio. En attendant, utilisez les boutons de simulation ci-dessous."
                          : "Configure your STRIPE_SECRET_KEY inside Google AI Studio secrets for genuine checkouts. You can test the sandbox simulator below."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#A7F3D0]/10 border-2 border-stone-950 rounded-2xl flex gap-2.5 items-start">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold text-stone-950">
                      {lang === 'FR' ? "Paiement 100% Chiffré et Sécurisé" : "Military-Grade SSL Security Layer"}
                    </p>
                    <p className="text-stone-600 font-semibold leading-relaxed">
                      {lang === 'FR'
                        ? "Vos informations de carte bancaire ne transitent jamais sur nos serveurs. Transactions directes et chiffrées via Stripe."
                        : "Encrypted directly through Stripe's certified servers. We do not inspect or store credit card details."}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                {isStripeConfigured ? (
                  <button
                    type="button"
                    onClick={handleLaunchStripeCheckout}
                    disabled={isProcessing}
                    className="w-full py-4 bg-[#FF7E5F] hover:bg-[#ff9075] border-2 border-stone-950 text-stone-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] cursor-pointer text-center active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
                        <span>{lang === 'FR' ? "Redirection..." : "Redirecting..."}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>{lang === 'FR' ? "Procéder au paiement Stripe" : "Secure Checkout with Stripe"}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment(true)}
                      disabled={isProcessing}
                      className="w-full py-3.5 bg-[#A7F3D0] hover:bg-[#86efac] border-2 border-stone-950 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] cursor-pointer text-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-1.5"
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>{lang === 'FR' ? "Simuler Succès (Test)" : "Simulate Success"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulatePayment(false)}
                      disabled={isProcessing}
                      className="w-full py-3.5 bg-rose-100 hover:bg-rose-200 border-2 border-stone-950 text-rose-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] cursor-pointer text-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>{lang === 'FR' ? "Simuler Échec" : "Simulate Failure"}</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="w-full py-3 border-2 border-stone-950 text-stone-700 hover:bg-stone-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 cursor-pointer text-center"
                >
                  {lang === 'FR' ? "Annuler" : "Cancel"}
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
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-[#A7F3D0] border-[3px] border-stone-950 rounded-full text-stone-950 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
                <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-stone-950 animate-pulse" />
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-black text-stone-950 uppercase tracking-tight">
                  {lang === 'FR' ? "Paiement Confirmé !" : "Payment Confirmed!"}
                </h2>
                <p className="text-xs text-stone-600 font-bold max-w-sm mx-auto leading-relaxed">
                  {lang === 'FR' 
                    ? `Votre achat de "${product.nameFR}" a été traité avec succès et vos crédits ont été mis à jour dans votre console.` 
                    : `Your purchase of "${product.nameEN}" was finalized successfully and your credits are ready to use in your console.`}
                </p>
              </div>

              {/* Receipt info */}
              {receipt && (
                <div className="bg-stone-50 border-2 border-stone-950 rounded-2xl p-4 text-left text-xs font-bold space-y-2 text-stone-850 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  <div className="flex justify-between border-b-2 border-stone-950 pb-2 text-[10px] font-mono text-stone-500 uppercase font-black">
                    <span>{lang === 'FR' ? "Reçu de paiement" : "Receipt statement"}</span>
                    <span>#{receipt.id}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>{lang === 'FR' ? "Produit" : "Product"}</span>
                    <span className="font-black text-stone-950">{lang === 'FR' ? product.nameFR : product.nameEN}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang === 'FR' ? "Date" : "Date"}</span>
                    <span>{new Date(receipt.date).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-stone-950 pt-2 font-black text-stone-950">
                    <span>{lang === 'FR' ? "Total Facturé" : "Total Charged"}</span>
                    <span className="text-stone-950 text-sm">{product.price.toFixed(2)}€</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 bg-[#EDC154] hover:bg-[#ffdf7e] border-2 border-stone-950 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] flex items-center justify-center gap-2 cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]"
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
