import React, { useState, useRef } from 'react';
import { UserProfile, Language } from '../types';
import { translations } from '../translations';
import { User, LogOut, ArrowRight, Shield, Globe, Award, Settings, Building, HelpCircle, Lock, Cookie, EyeOff, Save, Camera, Trash2, Image, Upload, Check, CheckCircle, Briefcase, Link, Sparkles, Wallet, Calendar, Coins, RefreshCcw } from 'lucide-react';
import { getConsent, setConsent } from '../lib/cookies';
import { useToast } from './Toast';
import { StorageService } from '../lib/storage';
import CheckoutModal from './CheckoutModal';
import { RestorePurchaseService } from '../services/commerce/RestorePurchaseService';
import SubscriptionPortal from '../modules/upgrade/SubscriptionPortal';

const AVATAR_PRESETS = [
  { id: 'gradient-blue', name: 'Blue Sky', className: 'bg-gradient-to-tr from-blue-500 to-indigo-600' },
  { id: 'gradient-emerald', name: 'Emerald Forest', className: 'bg-gradient-to-tr from-emerald-400 to-teal-600' },
  { id: 'gradient-sunset', name: 'Sunset Glow', className: 'bg-gradient-to-tr from-orange-400 to-rose-600' },
  { id: 'gradient-royal', name: 'Royal Purple', className: 'bg-gradient-to-tr from-purple-500 to-pink-600' },
  { id: 'gradient-dark', name: 'Midnight Charcoal', className: 'bg-gradient-to-tr from-[#1A2B3C] to-slate-900' }
];

interface ProfileViewProps {
  user: UserProfile;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onUpdateProfile: (data: { targetRole: string; industry: string; experienceLevel: 'junior' | 'mid' | 'senior' | 'executive'; avatarUrl?: string }) => void;
  onResetOnboarding: () => void;
  onLogout: () => void;
}

export default function ProfileView({ user, lang, onChangeLang, onUpdateProfile, onResetOnboarding, onLogout }: ProfileViewProps) {
  const t = translations[lang];
  const { addToast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedRole, setEditedRole] = useState(user.targetRole);
  const [editedIndustry, setEditedIndustry] = useState(user.industry);
  const [editedExp, setEditedExp] = useState(user.experienceLevel);

  // Candidate Monetization & Checkout States
  const session = StorageService.getSession();
  const uId = user.id || session?.user?.id || 'usr_candidate';
  const [monetization, setMonetization] = useState(() => StorageService.getCandidateMonetization(uId));
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const result = await RestorePurchaseService.restore(uId);
      setMonetization(result.monetization);
      addToast({
        title: lang === 'FR' ? "Restauration Réussie !" : "Restore Successful!",
        description: lang === 'FR' 
          ? `Vos achats et crédits ont été restaurés. ${result.restoredCount} pack(s) récupéré(s).`
          : `Receipt verification succeeded. Restored ${result.restoredCount} pack(s).`,
        type: "success"
      });
      window.dispatchEvent(new Event('shana_progress_update'));
    } catch (err: any) {
      addToast({
        title: lang === 'FR' ? "Erreur de Restauration" : "Restore Error",
        description: err.message || "Failed to process receipt recovery.",
        type: "error"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // React on progress updates (like admin resets)
  React.useEffect(() => {
    const handleProgressUpdate = () => {
      setMonetization(StorageService.getCandidateMonetization(uId));
    };
    window.addEventListener('shana_progress_update', handleProgressUpdate);
    return () => {
      window.removeEventListener('shana_progress_update', handleProgressUpdate);
    };
  }, [uId]);

  const handlePurchaseSuccess = (updatedData: any) => {
    setMonetization(updatedData);
    setSelectedProductForCheckout(null);
  };

  const handleCancelSubscription = () => {
    const confirmCancel = window.confirm(
      lang === 'FR' 
        ? "Êtes-vous sûr de vouloir annuler votre abonnement Ultra ? Vous perdrez l'accès illimité à la fin du mois de facturation."
        : "Are you sure you want to cancel your Ultra subscription? You will lose unlimited access at the end of the billing period."
    );
    if (confirmCancel) {
      const updated = { ...monetization, ultraActive: false, ultraExpiresAt: null };
      StorageService.saveCandidateMonetization(uId, updated);
      setMonetization(updated);
      addToast({
        title: lang === 'FR' ? "Abonnement Résilié" : "Subscription Cancelled",
        description: lang === 'FR' 
          ? "Votre abonnement Ultra a été annulé avec succès." 
          : "Your Ultra subscription has been successfully cancelled.",
        type: "success"
      });
    }
  };

  // States for target job analysis / alignment
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  const [jobAnalysisResult, setJobAnalysisResult] = useState<any>(null);
  const [jobAnalysisError, setJobAnalysisError] = useState('');

  React.useEffect(() => {
    setEditedRole(user.targetRole);
    setEditedIndustry(user.industry);
    setEditedExp(user.experienceLevel);
  }, [user]);

  const handleSaveProfileDetails = () => {
    if (!editedRole.trim() || !editedIndustry.trim()) {
      addToast({
        title: lang === 'FR' ? "Erreur" : "Validation Error",
        description: lang === 'FR' 
          ? "Le rôle et le secteur d'activité ne peuvent pas être vides." 
          : "Role and Industry fields cannot be blank.",
        type: "error"
      });
      return;
    }
    onUpdateProfile({
      targetRole: editedRole,
      industry: editedIndustry,
      experienceLevel: editedExp
    });
    setIsEditing(false);
    addToast({
      title: lang === 'FR' ? "Profil Mis à Jour" : "Profile Updated",
      description: lang === 'FR' 
        ? "Vos informations professionnelles ont été mises à jour avec succès." 
        : "Your career details have been updated successfully.",
      type: "success"
    });
  };

  const handleAnalyzeJob = async () => {
    if (!jobUrl.trim() && !jobDescription.trim()) {
      addToast({
        title: lang === 'FR' ? "Données manquantes" : "Missing Input",
        description: lang === 'FR' 
          ? "Veuillez fournir une URL d'offre d'emploi ou coller la description de poste." 
          : "Please provide either a job post URL or paste the job description text.",
        type: "error"
      });
      return;
    }

    setIsAnalyzingJob(true);
    setJobAnalysisResult(null);
    setJobAnalysisError('');

    try {
      const response = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobUrl,
          jobDescription,
          currentProfile: user
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || (lang === 'FR' ? "Erreur de traitement de l'offre" : "Failed to analyze target job."));
      }

      setJobAnalysisResult(resData.data);
      addToast({
        title: lang === 'FR' ? "Analyse réussie !" : "Job Analyzed Successfully!",
        description: lang === 'FR' 
          ? "Offre analysée avec succès. Comparez et optimisez vos paramètres !" 
          : "Target job analyzed successfully. See results and align your profile!",
        type: "success"
      });
    } catch (err: any) {
      console.error(err);
      setJobAnalysisError(err.message || "An unexpected error occurred.");
      addToast({
        title: lang === 'FR' ? "Échec de l'analyse" : "Analysis Failed",
        description: err.message || "Could not analyze the job details.",
        type: "error"
      });
    } finally {
      setIsAnalyzingJob(false);
    }
  };

  const handleApplyAlignment = () => {
    if (!jobAnalysisResult || !jobAnalysisResult.suggestedProfileAdjustments) return;

    const adjustments = jobAnalysisResult.suggestedProfileAdjustments;
    onUpdateProfile({
      targetRole: adjustments.targetRole,
      industry: adjustments.industry,
      experienceLevel: adjustments.experienceLevel as any,
      avatarUrl: user.avatarUrl
    });

    addToast({
      title: lang === 'FR' ? "Profil aligné !" : "Profile Aligned!",
      description: lang === 'FR' 
        ? `Vos paramètres cibles ont été mis à jour avec succès.` 
        : `Your target career parameters have been aligned with the job requirement.`,
      type: "success"
    });
  };

  const [prefs, setPrefs] = useState(() => {
    const consent = getConsent();
    return {
      essential: true,
      preferences: consent ? consent.preferences : true,
    };
  });

  const handleSaveConsent = (updatedPrefs: typeof prefs) => {
    setConsent(updatedPrefs);
    setPrefs(updatedPrefs);
    addToast({
      title: lang === 'FR' ? "Préférences Enregistrées" : "Cookie Preferences Saved",
      description: lang === 'FR' 
        ? "Vos préférences de confidentialité SHANA ont été mises à jour avec succès dans vos cookies." 
        : "Your SHANA privacy and cookie configurations have been updated successfully.",
      type: "success"
    });
  };

  const handleAcceptAll = () => {
    const allOn = { essential: true, preferences: true };
    handleSaveConsent(allOn);
  };

  const handleEssentialOnly = () => {
    const essentialOnly = { essential: true, preferences: false };
    handleSaveConsent(essentialOnly);
  };


  return (
    <div id="profile-view" className="max-w-3xl mx-auto py-6 animate-fade-in space-y-8 relative z-10 selection:bg-[#18633F]/20">
      
      {/* Page Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#A7F3D0] border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
          <Settings className="w-3.5 h-3.5 text-stone-950" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-950 font-black">
            {lang === 'EN' ? "ACCOUNT SPECIFICATIONS" : "AJUSTEMENT DE CONFIGURATION"}
          </span>
        </div>
        <h1 id="profile-title" className="text-3xl md:text-4xl font-extrabold text-[#111111] tracking-tight">
          {t.profile.title}
        </h1>
        <p id="profile-subtitle" className="text-xs md:text-sm font-medium text-stone-500 tracking-wide">
          {t.profile.subtitle}
        </p>
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white border-[2.5px] border-stone-950 shadow-[6px_6px_0px_0px_#111111] rounded-[24px] p-6 md:p-8 space-y-8">
        
        {/* User Identity Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 pb-6 border-b-2 border-stone-950">
          {/* Avatar Area with hidden input and absolute hover badges */}
          <div className="relative group shrink-0 w-16 h-16">
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              id="avatar-file-upload-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  addToast({
                    title: lang === 'FR' ? "Image trop volumineuse" : "Image Too Large",
                    description: lang === 'FR' ? "Veuillez choisir une image de moins de 2 Mo." : "Please select an image smaller than 2MB.",
                    type: "error"
                  });
                  return;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                  onUpdateProfile({
                    targetRole: user.targetRole,
                    industry: user.industry,
                    experienceLevel: user.experienceLevel,
                    avatarUrl: reader.result as string
                  });
                  addToast({
                    title: lang === 'FR' ? "Photo mise à jour" : "Photo Updated",
                    description: lang === 'FR' ? "Votre avatar a été mis à jour." : "Your avatar was successfully updated.",
                    type: "success"
                  });
                };
                reader.readAsDataURL(file);
              }}
            />
            
            {/* Render current avatar */}
            {(() => {
              const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
              if (user.avatarUrl && user.avatarUrl.startsWith('preset:')) {
                const presetId = user.avatarUrl.replace('preset:', '');
                const preset = AVATAR_PRESETS.find(p => p.id === presetId) || AVATAR_PRESETS[0];
                return (
                  <div className={`w-16 h-16 ${preset.className} border-2 border-stone-950 flex items-center justify-center rounded-2xl text-white font-extrabold text-lg uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]`}>
                    {initials}
                  </div>
                );
              }
              if (user.avatarUrl) {
                return (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    className="w-16 h-16 object-cover rounded-2xl border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                    referrerPolicy="no-referrer"
                  />
                );
              }
              return (
                <div className="w-16 h-16 bg-stone-100 border-2 border-stone-950 flex items-center justify-center rounded-2xl text-stone-900 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  <User className="w-6 h-6" />
                </div>
              );
            })()}

            {/* Change Avatar button overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 bg-[#EDC154] text-stone-950 rounded-lg hover:bg-[#ffdf7e] border-2 border-stone-950 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] cursor-pointer"
              title={lang === 'FR' ? "Téléverser une photo" : "Upload photo"}
              id="avatar-upload-trigger-btn"
            >
              <Camera className="w-3.5 h-3.5 text-stone-950" />
            </button>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="profile-user-name" className="text-base font-black text-stone-900 leading-tight uppercase">
                {user.name}
              </h3>
              
              {/* Reset photo button */}
              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({
                      targetRole: user.targetRole,
                      industry: user.industry,
                      experienceLevel: user.experienceLevel,
                      avatarUrl: ''
                    });
                    addToast({
                      title: lang === 'FR' ? "Photo réinitialisée" : "Photo Reset",
                      description: lang === 'FR' ? "Votre avatar a été réinitialisé." : "Your avatar was successfully reset.",
                      type: "success"
                    });
                  }}
                  className="text-[10px] font-bold text-red-650 hover:text-red-750 flex items-center gap-0.5 ml-2 cursor-pointer transition-colors"
                  title={lang === 'FR' ? "Supprimer la photo" : "Remove Photo"}
                  id="avatar-delete-btn"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{lang === 'FR' ? "Supprimer" : "Remove"}</span>
                </button>
              )}
            </div>

            <p id="profile-user-email" className="text-xs text-stone-500 font-mono font-bold">
              {user.email}
            </p>

            {/* Switch preset avatar trigger */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="text-[10px] text-stone-950 font-black transition-all cursor-pointer bg-[#A7F3D0] hover:bg-[#86efac] px-2.5 py-1 rounded border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
                id="avatar-choose-preset-btn"
              >
                {showPresets 
                  ? (lang === 'FR' ? "Masquer les thèmes" : "Hide theme choices") 
                  : (lang === 'FR' ? "Choisir un thème de couleur" : "Choose color theme")}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-stone-950 font-black transition-all cursor-pointer bg-white hover:bg-stone-50 px-2.5 py-1 rounded border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
                id="avatar-custom-file-btn"
              >
                {lang === 'FR' ? "Charger une image" : "Upload picture"}
              </button>
            </div>

            {/* Preset selector drawer */}
            {showPresets && (
              <div className="flex gap-2.5 pt-2 animate-fade-in flex-wrap items-center">
                <span className="text-[10px] font-mono text-stone-500 uppercase font-black">
                  {lang === 'FR' ? "Thèmes :" : "Themes:"}
                </span>
                {AVATAR_PRESETS.map((p) => {
                  const isActive = user.avatarUrl === `preset:${p.id}`;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onUpdateProfile({
                          targetRole: user.targetRole,
                          industry: user.industry,
                          experienceLevel: user.experienceLevel,
                          avatarUrl: `preset:${p.id}`
                        });
                        addToast({
                          title: lang === 'FR' ? "Thème appliqué" : "Theme Applied",
                          description: lang === 'FR' ? `Thème ${p.name} activé.` : `${p.name} theme activated successfully.`,
                          type: "success"
                        });
                      }}
                      className={`w-6 h-6 rounded-lg ${p.className} transition-all relative cursor-pointer hover:scale-110 border border-stone-950 shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] ${
                        isActive ? 'ring-2 ring-stone-950 scale-105' : 'opacity-85'
                      }`}
                      title={p.name}
                      id={`avatar-preset-btn-${p.id}`}
                    >
                      {isActive && <span className="text-[8px] text-white font-extrabold">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Global Language Option - Instant Switcher */}
        <div id="settings-language" className="space-y-3">
          <label className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-stone-500" />
            <span>{t.profile.languageLabel}</span>
          </label>
          
          <div className="flex bg-white p-1 rounded-xl border-2 border-stone-950 max-w-xs shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <button
              id="profile-lang-en"
              type="button"
              onClick={() => onChangeLang('EN')}
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                lang === 'EN'
                  ? 'bg-stone-950 text-white shadow-sm font-black'
                  : 'text-stone-500 hover:text-stone-900 font-bold'
              }`}
            >
              ENGLISH (EN)
            </button>
            
            <button
              id="profile-lang-fr"
              type="button"
              onClick={() => onChangeLang('FR')}
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                lang === 'FR'
                  ? 'bg-stone-950 text-white shadow-sm font-black'
                  : 'text-stone-500 hover:text-stone-900 font-bold'
              }`}
            >
              FRANÇAIS (FR)
            </button>
          </div>
        </div>

        {/* User Career Context Display & Edit block */}
        <div className="space-y-4 pt-4 border-t-2 border-stone-950">
          <div className="flex justify-between items-center">
            <h4 className="text-[11px] font-mono font-black uppercase tracking-widest text-stone-500">
              {lang === 'EN' ? "YOUR CURRENT CAREER CONTEXT" : "CONTEXTE PROFESSIONNEL EN COURS"}
            </h4>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-950 border-2 border-stone-950 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
                id="edit-career-context-btn"
              >
                {lang === 'EN' ? "Edit Details" : "Modifier"}
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-stone-50 border-2 border-stone-950 rounded-2xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block font-black">{t.profile.roleLabel}</span>
                <span id="label-role" className="text-xs font-black text-stone-950 mt-1 block truncate uppercase">
                  {user.targetRole}
                </span>
              </div>

              <div className="p-4 bg-stone-50 border-2 border-stone-950 rounded-2xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block font-black">{t.profile.industryLabel}</span>
                <span id="label-industry" className="text-xs font-black text-stone-950 mt-1 block truncate uppercase">
                  {user.industry}
                </span>
              </div>

              <div className="p-4 bg-stone-50 border-2 border-stone-950 rounded-2xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block font-black">{t.profile.expLabel}</span>
                <span id="label-experience" className="text-xs font-black text-stone-950 mt-1 block capitalize">
                  {user.experienceLevel}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-stone-50 border-2 border-stone-950 p-5 rounded-[20px] animate-fade-in text-left shadow-[3.5px_3.5px_0px_0px_rgba(17,17,17,1)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Role input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-black block">
                    {t.profile.roleLabel}
                  </label>
                  <input
                    type="text"
                    value={editedRole}
                    onChange={(e) => setEditedRole(e.target.value)}
                    className="w-full bg-white border-2 border-stone-950 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]"
                    id="edit-role-input"
                  />
                </div>

                {/* Industry input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-black block">
                    {t.profile.industryLabel}
                  </label>
                  <input
                    type="text"
                    value={editedIndustry}
                    onChange={(e) => setEditedIndustry(e.target.value)}
                    className="w-full bg-white border-2 border-stone-950 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]"
                    id="edit-industry-input"
                  />
                </div>
              </div>

              {/* Experience Level select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-black block">
                  {t.profile.expLabel}
                </label>
                <select
                  value={editedExp}
                  onChange={(e) => setEditedExp(e.target.value as any)}
                  className="w-full bg-white border-2 border-stone-950 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]"
                  id="edit-exp-select"
                >
                  <option value="junior">{lang === 'FR' ? "Junior (0-2 ans)" : "Junior (0-2 yrs)"}</option>
                  <option value="mid">{lang === 'FR' ? "Intermédiaire (2-5 ans)" : "Mid-Level (2-5 yrs)"}</option>
                  <option value="senior">{lang === 'FR' ? "Senior (5-10 ans)" : "Senior (5-10 yrs)"}</option>
                  <option value="executive">{lang === 'FR' ? "Cadre / Direction (10+ ans)" : "Executive (10+ yrs)"}</option>
                </select>
              </div>

              {/* Action Buttons for inline edit */}
              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditedRole(user.targetRole);
                    setEditedIndustry(user.industry);
                    setEditedExp(user.experienceLevel);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-white border-2 border-stone-950 rounded-xl text-xs font-black uppercase tracking-wider text-stone-700 hover:text-stone-900 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
                  id="cancel-edit-career-btn"
                >
                  {lang === 'FR' ? "Annuler" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfileDetails}
                  className="px-4 py-2 bg-[#EDC154] text-stone-950 border-2 border-stone-950 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#ffdf7e] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
                  id="save-career-details-btn"
                >
                  {lang === 'FR' ? "Enregistrer" : "Save Details"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Target Job Scraper & Alignment section */}
        <div className="pt-6 border-t-2 border-stone-950 space-y-4 text-left">
          <div>
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-stone-500" />
              <span>{lang === 'FR' ? "ASSISTANT D'ALIGNEMENT DE POSTE CIBLE" : "TARGET JOB ALIGNMENT ASSISTANT"}</span>
            </span>
            <h4 className="text-sm font-black text-stone-950 uppercase tracking-tight mt-1.5">
              {lang === 'FR' ? "Scraper et Optimiser Votre Profil" : "Scrape & Optimize Your Profile"}
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              {lang === 'FR'
                ? "Collez l'URL d'une offre d'emploi ou sa description brute pour que SHANA analyse le poste et aligne instantanément vos compétences."
                : "Paste a target job posting URL or the raw description, and let SHANA extract specifications and instantly calibrate your profile."}
            </p>
          </div>

          <div className="space-y-4 bg-stone-50 border-2 border-stone-950 p-5 rounded-[20px] shadow-[3.5px_3.5px_0px_0px_rgba(17,17,17,1)]">
            {/* Input URL */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-black block">
                {lang === 'FR' ? "URL de l'offre d'emploi (Optionnel)" : "Job Posting URL (Optional)"}
              </label>
              <div className="relative flex items-center">
                <Link className="absolute left-3 w-3.5 h-3.5 text-stone-500" />
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="w-full bg-white border-2 border-stone-950 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] placeholder:text-stone-400"
                  id="target-job-url-input"
                />
              </div>
            </div>

            {/* Input Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-black block">
                {lang === 'FR' ? "Description brute du poste / Mots-clés" : "Raw Job Description / Keywords"}
              </label>
              <textarea
                rows={4}
                placeholder={lang === 'FR' ? "Collez la description ou les pré-requis du poste ici..." : "Paste the responsibilities, qualifications, or requirements of the job here..."}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full bg-white border-2 border-stone-950 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-stone-950 placeholder:text-stone-400 resize-y shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]"
                id="target-job-desc-input"
              />
            </div>

            {/* Submit button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAnalyzeJob}
                disabled={isAnalyzingJob}
                className="px-4 py-2.5 bg-[#18633F] hover:bg-[#1f7c50] disabled:bg-stone-200 disabled:cursor-not-allowed text-white border-2 border-stone-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
                id="analyze-target-job-btn"
              >
                {isAnalyzingJob ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{lang === 'FR' ? "Analyse en cours..." : "Analyzing Post..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{lang === 'FR' ? "Analyser le Poste Cible" : "Analyze Target Job"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Error state */}
            {jobAnalysisError && (
              <div className="p-3.5 bg-red-100 border-2 border-stone-950 rounded-xl text-xs text-red-950 font-black shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                {jobAnalysisError}
              </div>
            )}

            {/* Analysis Result Display */}
            {jobAnalysisResult && (
              <div className="mt-4 border-t-2 border-stone-950 pt-4 space-y-4 animate-fade-in text-left">
                <div className="flex items-center gap-2 text-xs font-black text-stone-950 bg-[#A7F3D0] border-2 border-stone-950 px-3 py-2.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {lang === 'FR' 
                      ? "Analyse terminée ! Vos recommandations sur-mesure sont prêtes." 
                      : "Analysis complete! Tailored recommendations are ready below."}
                  </span>
                </div>

                {/* Job Specs summary block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white p-5 border-2 border-stone-950 rounded-2xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                  <div>
                    <span className="text-[9px] font-mono text-stone-500 uppercase font-black">{lang === 'FR' ? "Rôle Cible Détecté" : "Detected Job Title"}</span>
                    <span className="text-xs font-black text-stone-950 uppercase block mt-0.5">{jobAnalysisResult.targetRole}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-stone-500 uppercase font-black">{lang === 'FR' ? "Secteur d'Activité" : "Industry Domain"}</span>
                    <span className="text-xs font-black text-stone-950 uppercase block mt-0.5">{jobAnalysisResult.industry}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-stone-500 uppercase font-black">{lang === 'FR' ? "Expérience Attendue" : "Required Experience"}</span>
                    <span className="text-xs font-black text-stone-950 uppercase block mt-0.5 capitalize">{jobAnalysisResult.experienceLevel}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-stone-500 uppercase font-black">{lang === 'FR' ? "Compétences Clés Réclammées" : "Demanded Core Skills"}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {jobAnalysisResult.requiredSkills?.map((skill: string, idx: number) => (
                        <span key={idx} className="text-[9px] font-mono bg-[#EDC154] text-stone-950 px-1.5 py-0.5 rounded border border-stone-950 font-black shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Gap Analysis and Summary */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-black block">
                    {lang === 'FR' ? "Analyse d'Écart de Profil" : "Profile Gap Analysis"}
                  </span>
                  <div className="bg-white p-4 border-2 border-stone-950 rounded-2xl text-xs text-stone-800 leading-relaxed shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
                    <p className="font-black text-stone-950 mb-1.5">{jobAnalysisResult.jobDescriptionSummary}</p>
                    <p className="font-bold">{jobAnalysisResult.profileGapAnalysis}</p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-black block">
                    {lang === 'FR' ? "Recommandations Stratégiques" : "Strategic Action Items"}
                  </span>
                  <ul className="space-y-2 bg-stone-50 border-2 border-stone-950 p-4 rounded-2xl shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
                    {jobAnalysisResult.recommendations?.map((rec: string, idx: number) => (
                      <li key={idx} className="text-xs text-stone-800 font-bold flex items-start gap-2 leading-relaxed">
                        <span className="text-red-600 font-black mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Apply Alignments CTA */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#A7F3D0] border-2 border-stone-950 p-4 rounded-2xl shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
                  <div className="text-left space-y-0.5">
                    <h5 className="text-xs font-black text-stone-950 uppercase">
                      {lang === 'FR' ? "Optimiser mes paramètres de recherche ?" : "Align profile target values?"}
                    </h5>
                    <p className="text-[11px] text-stone-800 font-bold">
                      {lang === 'FR'
                        ? `Ajuster instantanément votre titre (${jobAnalysisResult.suggestedProfileAdjustments?.targetRole}) et secteur.`
                        : `Instantly update role target to (${jobAnalysisResult.suggestedProfileAdjustments?.targetRole}) and adjust scope.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyAlignment}
                    className="w-full sm:w-auto px-4 py-2.5 bg-stone-950 hover:bg-stone-800 text-white border border-transparent rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                    id="apply-job-alignment-btn"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === 'FR' ? "Aligner mon Profil" : "Align My Profile"}</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* SECTION 1 to 5: BILLING, SUBSCRIPTION & CREDIT ENGINE */}
        <div className="pt-6 border-t-2 border-stone-950 space-y-6 text-left" id="monetization-billing-section">
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <span className="text-[11px] font-mono font-black uppercase tracking-widest text-stone-950 bg-[#A7F3D0] px-2.5 py-1.5 rounded-lg border-2 border-stone-950 flex items-center gap-1.5 w-fit shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]">
                  <Wallet className="w-3.5 h-3.5 text-stone-950" />
                  <span>{lang === 'FR' ? "ABONNEMENTS & CRÉDITS" : "BILLING & SUBSCRIPTIONS"}</span>
                </span>
                <h4 className="text-sm font-black text-stone-950 uppercase mt-3">
                  {lang === 'FR' ? "Gestion de votre Plan de Monétisation" : "Monetization Control Center"}
                </h4>
              </div>
              
              <button
                type="button"
                id="restore-purchases-profile-btn"
                disabled={isRestoring}
                onClick={handleRestorePurchases}
                className="px-3.5 py-2 bg-white hover:bg-stone-50 border-2 border-stone-950 disabled:bg-stone-100 disabled:text-stone-400 rounded-xl text-[10px] font-black uppercase tracking-wider text-stone-950 flex items-center gap-1.5 cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px]"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin text-stone-400' : 'text-stone-950'}`} />
                <span>{isRestoring ? (lang === 'FR' ? "Vérification..." : "Verifying...") : (lang === 'FR' ? "Restaurer mes Achats" : "Restore Purchases")}</span>
              </button>
            </div>

            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed font-bold">
              {lang === 'FR' 
                ? "Gérez vos abonnements, achetez des packs de sessions d’entraînement vocal et des évaluations miroir complètes."
                : "Manage your premium prep resources, purchase training packs, or top-up individual oral feedback sessions."}
            </p>
          </div>

          {/* Credits Balance Display Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Audio Session Balance */}
            <div className="bg-[#18633F] text-white p-5 rounded-[20px] border-2 border-stone-950 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] group">
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight" id="balance-audio-credits">
                  {monetization.ultraActive ? "∞" : (monetization.freeAudio + monetization.packAudio + monetization.topUpAudio)}
                </span>
                <span className="text-xs text-emerald-100 font-bold uppercase">
                  {lang === 'FR' ? "Sessions" : "Credits"}
                </span>
                {monetization.ultraActive && (
                  <span className="ml-2 text-[9px] font-mono bg-emerald-500/40 border border-emerald-300 text-emerald-200 px-1.5 py-0.5 rounded font-black tracking-wide uppercase shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                    ULTRA ACTIVE
                  </span>
                )}
              </div>
              
              {/* Detailed Breakdown */}
              <div className="mt-4 pt-3 border-t border-emerald-500 flex justify-between text-[10px] font-mono text-emerald-100">
                <div>{lang === 'FR' ? "Gratuit" : "Free"}: <span className="font-bold text-white">{monetization.freeAudio}</span></div>
                <div>{lang === 'FR' ? "Packs" : "Packs"}: <span className="font-bold text-white">{monetization.packAudio}</span></div>
                <div>{lang === 'FR' ? "Recharges" : "Top Ups"}: <span className="font-bold text-white">{monetization.topUpAudio}</span></div>
              </div>
            </div>

            {/* Mirror Sessions Balance */}
            <div className="bg-white border-2 border-stone-950 p-5 rounded-[20px] relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] group">
              <div className="absolute right-3 top-3 opacity-15 group-hover:scale-110 transition-transform duration-300 text-stone-950">
                <Award className="w-14 h-14" />
              </div>
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-stone-500">
                {lang === 'FR' ? "ÉVALUATIONS MIROIR RESTANTES" : "MIRROR ASSESSMENT BALANCES"}
              </span>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-stone-950" id="balance-mirror-credits">
                  {monetization.ultraActive ? "∞" : (monetization.freeMirror + monetization.packMirror + monetization.topUpMirror)}
                </span>
                <span className="text-xs text-stone-500 font-bold uppercase">
                  {lang === 'FR' ? "Miroirs" : "Evaluations"}
                </span>
                {monetization.ultraActive && (
                  <span className="ml-2 text-[9px] font-mono bg-stone-100 border border-stone-300 text-stone-700 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                    ULTRA ACTIVE
                  </span>
                )}
              </div>
              
              {/* Detailed Breakdown */}
              <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between text-[10px] font-mono text-stone-500">
                <div>{lang === 'FR' ? "Gratuit" : "Free"}: <span className="font-bold text-stone-950">{monetization.freeMirror}</span></div>
                <div>{lang === 'FR' ? "Packs" : "Packs"}: <span className="font-bold text-stone-950">{monetization.packMirror}</span></div>
                <div>{lang === 'FR' ? "Recharges" : "Top Ups"}: <span className="font-bold text-stone-950">{monetization.topUpMirror}</span></div>
              </div>
            </div>
          </div>

          {/* Usage Priority Rule Explanation */}
          <div className="p-4 bg-[#EDC154]/15 border-2 border-stone-950 rounded-2xl flex items-start gap-2.5 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]" id="monetization-rule-card">
            <Sparkles className="w-4 h-4 text-stone-950 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-black text-stone-950 tracking-wider font-mono">
                {lang === 'FR' ? "RÈGLE DE PRIORITÉ DE CONSOMMATION" : "USAGE CONSUMPTION PRIORITY RULE"}
              </span>
              <p className="text-[11px] text-stone-850 leading-relaxed font-bold">
                {lang === 'FR'
                  ? "Les sessions sont consommées dans cet ordre strict : Sessions Gratuites ➔ Packs d'Heures ➔ Recharges Individuelles ➔ Ultra Illimité."
                  : "Credits are applied in sequence: Free Welcome Credits ➔ Purchased Packs ➔ Individual Top Ups ➔ Ultra Subscription."}
              </p>
            </div>
          </div>

          {/* Subscription Self-Service Portal */}
          <SubscriptionPortal 
            userId={uId} 
            lang={lang} 
            onUpdate={() => {
              setMonetization(StorageService.getCandidateMonetization(uId));
              window.dispatchEvent(new Event('shana_progress_update'));
            }} 
          />

          {/* Available Pricing Options & Subscription */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-500">
              {lang === 'FR' ? "CATALOGUE DES PRODUITS SHANA" : "SHANA PURCHASE CATALOGUE"}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Starter Pack */}
              <div className="border-2 border-stone-950 rounded-2xl p-4 flex flex-col justify-between bg-white hover:translate-y-[-1px] transition-all shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
                <div>
                  <h5 className="font-black text-xs text-stone-950 uppercase tracking-wider">{lang === 'FR' ? "Pack Starter" : "Starter Pack"}</h5>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-xl font-extrabold text-stone-950">3.99€</span>
                    <span className="text-[10px] text-stone-500 ml-1 font-bold">/{lang === 'FR' ? "unitaire" : "once"}</span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-2 font-bold leading-relaxed">
                    {lang === 'FR' ? "Comprend 3 sessions d’entraînement vocal audio. Aucune expiration." : "Includes 3 Audio voice sessions. No expiration. Great for quick checks."}
                  </p>
                </div>
                <button
                  type="button"
                  id="buy-starter-pack-btn"
                  onClick={() => setSelectedProductForCheckout('pack_starter')}
                  className="mt-4 w-full py-2.5 bg-[#A7F3D0] hover:bg-[#86efac] text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
                >
                  {lang === 'FR' ? "Acheter" : "Buy Pack"}
                </button>
              </div>

              {/* Premium Pack */}
              <div className="border-2 border-stone-950 rounded-2xl p-4 flex flex-col justify-between bg-[#A7F3D0]/10 hover:translate-y-[-1px] transition-all relative shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
                <span className="absolute -top-3 right-3 text-[8px] font-mono uppercase bg-[#FF7E5F] border-2 border-stone-950 text-stone-950 px-2 py-0.5 rounded-full font-black tracking-widest shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
                  {lang === 'FR' ? "RECOMMANDÉ" : "POPULAR"}
                </span>
                <div>
                  <h5 className="font-black text-xs text-stone-950 uppercase tracking-wider">{lang === 'FR' ? "Pack Premium" : "Premium Pack"}</h5>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-xl font-extrabold text-stone-950">7.99€</span>
                    <span className="text-[10px] text-stone-500 ml-1 font-bold">/{lang === 'FR' ? "unitaire" : "once"}</span>
                  </div>
                  <p className="text-[11px] text-stone-700 mt-2 font-bold leading-relaxed">
                    {lang === 'FR' ? "Comprend 5 sessions d'entraînement vocal + 1 Évaluation Miroir vidéo." : "Includes 5 Audio sessions + 1 Full Camera Evaluation. Ultimate prep package."}
                  </p>
                </div>
                <button
                  type="button"
                  id="buy-premium-pack-btn"
                  onClick={() => setSelectedProductForCheckout('pack_premium')}
                  className="mt-4 w-full py-2.5 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
                >
                  {lang === 'FR' ? "Acheter" : "Buy Pack"}
                </button>
              </div>

              {/* Ultra Subscription */}
              <div className="border-2 border-stone-950 rounded-2xl p-4 flex flex-col justify-between bg-white hover:translate-y-[-1px] transition-all shadow-[3px_3px_0px_0px_rgba(17,17,17,1)]">
                <div>
                  <h5 className="font-black text-xs text-stone-950 uppercase tracking-wider">{lang === 'FR' ? "Abonnement Ultra" : "Ultra Subscription"}</h5>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-xl font-extrabold text-stone-950">39.99€</span>
                    <span className="text-[10px] text-stone-500 ml-1 font-bold">/{lang === 'FR' ? "mois" : "month"}</span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-2 font-bold leading-relaxed">
                    {lang === 'FR' ? "Sessions audio & Évaluations miroir illimitées en continu. Résiliable à tout moment." : "Unlimited continuous voice coaching & video assessments. Cancel anytime."}
                  </p>
                </div>
                {monetization.ultraActive ? (
                  <button
                    type="button"
                    id="cancel-ultra-sub-btn"
                    onClick={handleCancelSubscription}
                    className="mt-4 w-full py-2.5 bg-red-100 hover:bg-red-200 text-red-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border-2 border-stone-950 shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)]"
                  >
                    {lang === 'FR' ? "Résilier" : "Cancel Ultra"}
                  </button>
                ) : (
                  <button
                    type="button"
                    id="subscribe-ultra-btn"
                    onClick={() => setSelectedProductForCheckout('sub_ultra')}
                    className="mt-4 w-full py-2.5 bg-[#FF7E5F] hover:bg-[#ff9075] text-stone-950 border-2 border-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
                  >
                    {lang === 'FR' ? "S'abonner" : "Subscribe Now"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Individual Top Ups */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-500">
              {lang === 'FR' ? "RECHARGES INDIVIDUELLES À LA CARTE" : "INDIVIDUAL A LA CARTE TOP-UPS"}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                id="topup-1-audio-btn"
                onClick={() => setSelectedProductForCheckout('topup_1_audio')}
                className="p-3 bg-white border-2 border-stone-950 hover:bg-stone-50 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]"
              >
                <div>
                  <div className="text-xs font-black text-stone-950 uppercase">{lang === 'FR' ? "+1 Session Audio" : "+1 Audio Session"}</div>
                  <div className="text-[10px] text-stone-500 font-bold">{lang === 'FR' ? "S'ajoute à vos crédits" : "Adds to active credits"}</div>
                </div>
                <span className="font-extrabold text-xs text-stone-950 font-mono">1.49€</span>
              </button>

              <button
                type="button"
                id="topup-3-audio-btn"
                onClick={() => setSelectedProductForCheckout('topup_3_audio')}
                className="p-3 bg-white border-2 border-stone-950 hover:bg-stone-50 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]"
              >
                <div>
                  <div className="text-xs font-black text-stone-950 uppercase">{lang === 'FR' ? "+3 Sessions Audio" : "+3 Audio Sessions"}</div>
                  <div className="text-[10px] text-stone-500 font-bold">{lang === 'FR' ? "Pack de recharge rapide" : "Quick top-up booster"}</div>
                </div>
                <span className="font-extrabold text-xs text-stone-950 font-mono">3.49€</span>
              </button>

              <button
                type="button"
                id="topup-1-mirror-btn"
                onClick={() => setSelectedProductForCheckout('topup_1_mirror')}
                className="p-3 bg-white border-2 border-stone-950 hover:bg-stone-50 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]"
              >
                <div>
                  <div className="text-xs font-black text-stone-950 uppercase">{lang === 'FR' ? "+1 Session Miroir" : "+1 Mirror Evaluation"}</div>
                  <div className="text-[10px] text-stone-500 font-bold">{lang === 'FR' ? "S'ajoute aux évaluations" : "Adds to video evaluations"}</div>
                </div>
                <span className="font-extrabold text-xs text-stone-950 font-mono">2.99€</span>
              </button>
            </div>
          </div>

          {/* Purchases History */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>{lang === 'FR' ? "HISTORIQUE D'ACHATS ET TRANSACTIONS" : "TRANSACTION HISTORY"}</span>
            </span>

            {monetization.purchases && monetization.purchases.length > 0 ? (
              <div className="border-2 border-stone-950 rounded-2xl overflow-hidden bg-white shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse" id="candidate-purchases-table">
                  <thead>
                    <tr className="bg-stone-50 border-b-2 border-stone-950 font-mono text-[9px] uppercase tracking-wider text-stone-500 font-black">
                      <th className="p-3 pl-4">{lang === 'FR' ? "ID REÇU" : "RECEIPT ID"}</th>
                      <th className="p-3">{lang === 'FR' ? "PRODUIT" : "PRODUCT"}</th>
                      <th className="p-3">{lang === 'FR' ? "DATE" : "DATE"}</th>
                      <th className="p-3 text-right pr-4">{lang === 'FR' ? "MONTANT" : "AMOUNT"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-bold text-stone-700">
                    {monetization.purchases.map((p: any) => (
                      <tr key={p.id} className="hover:bg-neutral-50/50">
                        <td className="p-3 pl-4 font-mono text-[10px] text-stone-400">#{p.id}</td>
                        <td className="p-3 text-stone-950 font-black uppercase">{lang === 'FR' ? p.nameFR : p.nameEN}</td>
                        <td className="p-3 text-stone-500">
                          {new Date(p.date).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-3 text-right pr-4 font-black text-stone-950">{p.price.toFixed(2)}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-stone-300 rounded-2xl bg-stone-50/50 space-y-1">
                <p className="text-xs font-black text-stone-600">
                  {lang === 'FR' ? "Aucune transaction enregistrée" : "No purchase history registered"}
                </p>
                <p className="text-[10px] text-stone-400 font-bold">
                  {lang === 'FR' 
                    ? "Les achats de packs ou de recharges apparaîtront instantanément ici." 
                    : "Packs, top-ups, and subscription events will be documented in real-time."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Privacy -> Cookie Preferences */}
        <div className="pt-6 border-t-2 border-stone-950 space-y-4 text-left">
          <div>
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-stone-500" />
              <span>{lang === 'FR' ? "PROFIL ET CONFIDENTIALITÉ" : "PROFILE & PRIVACY"}</span>
            </span>
            <h4 className="text-sm font-black text-stone-950 uppercase mt-1.5">
              {lang === 'FR' ? "Préférences de Cookies SHANA" : "SHANA Cookie Preferences"}
            </h4>
            <p className="text-xs text-stone-500 mt-0.5 font-bold">
              {lang === 'FR' 
                ? "Gérez comment SHANA conserve l'information sur votre appareil. Nous n'utilisons aucun traceur publicitaire ou tiers."
                : "Manage how SHANA stores information on your device. We use absolutely no marketing or tracking systems."}
            </p>
          </div>

          <div className="space-y-3">
            {/* Category 1 - Essential Cookies */}
            <div className="p-4 bg-stone-50 border-2 border-stone-950 rounded-2xl flex items-start gap-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
              <div id="check-essential-icon" className="mt-0.5">
                <input 
                  type="checkbox" 
                  checked={true} 
                  disabled 
                  className="w-4 h-4 text-stone-950 border-2 border-stone-950 rounded focus:ring-stone-950 accent-stone-950 cursor-not-allowed"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-950">
                    {lang === 'FR' ? "1. Cookies Essentiels (Obligatoire)" : "1. Essential Cookies (Required)"}
                  </span>
                  <span className="text-[9px] font-mono bg-[#A7F3D0] border-2 border-stone-950 text-stone-950 px-1.5 py-0.5 rounded font-black uppercase">
                    {lang === 'FR' ? "ACTIF" : "ALWAYS ACTIVE"}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1 pr-2 font-bold leading-relaxed">
                  {lang === 'FR' 
                    ? "Requis pour sécuriser votre authentification, maintenir votre session utilisateur et vos choix linguistiques immédiats."
                    : "Required to keep you logged in securely, maintain active application session data, and preserve language preferences."}
                </p>
              </div>
            </div>

            {/* Category 2 - Preferences Cookies */}
            <div 
              id="pref-cookie-card"
              onClick={() => setPrefs(p => ({ ...p, preferences: !p.preferences }))}
              className="p-4 bg-white border-2 border-stone-950 hover:bg-stone-50 rounded-2xl flex items-start gap-3 cursor-pointer select-none transition-all duration-250 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]"
            >
              <div className="mt-0.5">
                <input 
                  type="checkbox" 
                  checked={prefs.preferences}
                  onChange={() => {}} // Controlled by outer element click
                  className="w-4 h-4 text-stone-950 border-2 border-stone-950 rounded focus:ring-stone-950 accent-stone-950 pointer-events-none"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-950">
                    {lang === 'FR' ? "2. Préférences Applicatives (Optionnel)" : "2. Experience & Preferences (Optional)"}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1 pr-2 font-bold leading-relaxed">
                  {lang === 'FR'
                    ? "Permet d'enregistrer vos réglages visuels de thème, vos configurations de rythme audio ainsi que l'état d'avancement de votre onboarding."
                    : "Allows local persistence of visual theme choices, audio pacing calibrations, and onboarding completed milestones."}
                </p>
              </div>
            </div>
          </div>

          {/* Cookie preference actions */}
          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              id="cookie-settings-btn-accept"
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-[#18633F] hover:bg-[#1f7c50] text-white border-2 border-stone-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
            >
              {lang === 'FR' ? "Accepter Tout" : "Accept All"}
            </button>
            <button
              id="cookie-settings-btn-essential"
              onClick={handleEssentialOnly}
              className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 border-2 border-stone-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
            >
              {lang === 'FR' ? "Essentiels Uniquement" : "Essential Only"}
            </button>
            <button
              id="cookie-settings-btn-save"
              onClick={() => handleSaveConsent(prefs)}
              className="ml-auto px-4 py-2 bg-[#EDC154] hover:bg-[#ffdf7e] text-stone-950 border-2 border-stone-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_0px_rgba(17,17,17,1)]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{lang === 'FR' ? "Enregistrer" : "Save"}</span>
            </button>
          </div>
        </div>

        {/* Notifications & Platform Banners */}
        <div className="pt-6 border-t-2 border-stone-950 space-y-3.5 text-left">
          <div>
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-stone-500 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-stone-500" />
              <span>{lang === 'FR' ? "NOTIFICATIONS ET ALERTES" : "NOTIFICATIONS & ALERTS"}</span>
            </span>
            <h4 className="text-sm font-black text-stone-950 uppercase mt-1.5">
              {lang === 'FR' ? "Bandeaux d'Information du Tableau de Bord" : "Dashboard Information Banners"}
            </h4>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed font-bold">
              {lang === 'FR'
                ? "Gérez l'affichage des bandeaux d'information temporaires sur votre tableau de bord."
                : "Manage the display of temporary info panels on your dashboard."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('shana_notifications_banner_dismissed');
                window.dispatchEvent(new Event('shana_progress_update'));
                addToast({
                  title: lang === 'FR' ? "Bandeau Réinitialisé" : "Banner Restored",
                  description: lang === 'FR'
                    ? "Le bandeau de notification jaune est à nouveau visible sur votre tableau de bord."
                    : "The yellow notification banner has been restored to your dashboard.",
                  type: "success"
                });
              }}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all border-2 border-stone-950 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px]"
              id="restore-notification-banner-btn"
            >
              <span>{lang === 'FR' ? "Réafficher le bandeau jaune" : "Show Yellow Banner Again"}</span>
            </button>
          </div>
        </div>

        {/* Administrative Controls / Danger Zone */}
        <div className="pt-6 border-t-2 border-red-500 bg-red-50/10 p-5 rounded-2xl border-stone-950 space-y-3.5 text-left">
          <div>
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-red-600 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-red-500" />
              <span>{lang === 'FR' ? "CONTRÔLE ADMINISTRATIF / ZONE DE DANGER" : "ADMINISTRATIVE CONTROLS / DANGER ZONE"}</span>
            </span>
            <h4 className="text-sm font-black text-red-950 uppercase mt-1.5">
              {lang === 'FR' ? "Réinitialisation des Compteurs Plateforme" : "Global Counters Reset"}
            </h4>
            <p className="text-xs text-red-900 mt-0.5 leading-relaxed font-bold">
              {lang === 'FR'
                ? "Remet instantanément à zéro toutes les statistiques, scores de préparation et historiques de tous les utilisateurs présents sur l'application."
                : "Instantly resets all progress indicators, session counts, and history entries to zero for all registered users on the platform."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const confirmReset = window.confirm(
                lang === 'FR'
                  ? "Êtes-vous sûr de vouloir réinitialiser TOUS les compteurs et historiques de TOUS les utilisateurs ? Cette action est irréversible."
                  : "Are you sure you want to reset ALL counters and session histories for ALL users? This action cannot be undone."
              );
              if (confirmReset) {
                StorageService.resetAllUserCounters();
                addToast({
                  title: lang === 'FR' ? "Remise à Zéro Terminée" : "Counters Reset Complete",
                  description: lang === 'FR'
                    ? "Tous les compteurs ont été remis à zéro avec succès."
                    : "All platform progress statistics have been successfully reset to zero.",
                  type: "success"
                });
              }
            }}
            className="w-full sm:w-auto px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-black border-2 border-stone-950 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px]"
            id="admin-reset-all-counters-btn"
          >
            <Trash2 className="w-4 h-4" />
            <span>{lang === 'FR' ? "Réinitialiser tous les compteurs (À ZÉRO)" : "Reset all user counters (TO ZERO)"}</span>
          </button>
        </div>

        {/* System parameters and authentication token info */}
        <div className="pt-4 border-t-2 border-stone-950 space-y-2">
          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest font-black block">
            {t.profile.mockAccountInfo}
          </span>
          <div className="p-3.5 bg-stone-50 border-2 border-stone-950 rounded-xl flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <span className="font-mono text-[9px] text-stone-500 uppercase font-black">SHA256::PRECISE_LOCAL_MEM_TOKEN</span>
            <span className="font-mono text-[9px] bg-[#A7F3D0] text-stone-950 border-2 border-stone-950 px-2 py-0.5 rounded font-black">ACTIVE</span>
          </div>
        </div>

        {/* Action Triggers Grid - MAX 3 ACTIONS per mobile-first constraint */}
        <div className="pt-6 border-t-2 border-stone-950 flex flex-col sm:flex-row gap-3">
          <button
            id="profile-btn-reset"
            onClick={onResetOnboarding}
            className="flex-1 px-4 py-3.5 bg-white hover:bg-stone-50 border-2 border-stone-950 text-stone-950 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all text-center"
          >
            {t.profile.onboardingResetBtn}
          </button>

          <button
            id="profile-btn-logout"
            onClick={onLogout}
            className="px-6 py-3.5 bg-red-100 hover:bg-red-200 text-red-950 border-2 border-stone-950 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(17,17,17,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {t.profile.logoutBtn}
          </button>
        </div>

      </div>

      {/* Checkout Modal Overlay */}
      {selectedProductForCheckout && (
        <CheckoutModal
          productId={selectedProductForCheckout}
          userId={uId}
          lang={lang}
          onClose={() => setSelectedProductForCheckout(null)}
          onSuccess={(updated) => {
            handlePurchaseSuccess(updated);
            window.dispatchEvent(new Event('shana_progress_update'));
          }}
        />
      )}

    </div>
  );
}
