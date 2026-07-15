import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Briefcase, 
  Calendar, 
  Globe, 
  Check, 
  ChevronRight, 
  LogOut, 
  AlertCircle, 
  Sparkles, 
  CheckCircle,
  FileText,
  BadgeAlert,
  ArrowRight,
  Mic,
  LockKeyhole,
  Flame
} from 'lucide-react';
import ShanaLogo from './ShanaLogo';
import { User as UserType, Profile as ProfileType, ActiveTab, SessionHistoryItem } from '../types';
import { StorageService } from '../lib/storage';
import { DbSyncManager } from '../lib/dbSync';
import { useMilestoneTracker, useToast } from './Toast';
import { setCookie, deleteCookie } from '../lib/cookies';
import CVPrepareFlow from './CVPrepareFlow';
import InterviewSimulator from './InterviewSimulator';
import VoiceTrainingFlow from './VoiceTrainingFlow';
import Navbar from './Navbar';
import DashboardView from './DashboardView';
import TrainView from './TrainView';
import AssessmentView from './AssessmentView';
import HistoryView from './HistoryView';
import ProfileView from './ProfileView';
import RoleGuard from './RoleGuard';
import DiscoveriesView from './DiscoveriesView';
import AdminView from './AdminView';
import EnterpriseCenter from './admin/enterprise/EnterpriseCenter';
import { ConfigurationService } from '../services/platform';
import PurchaseView from '../purchase';
import AICompanion from './AICompanion';
import CandidateBrainView from './CandidateBrainView';

const sendRealAndSimulatedEmail = (type: string, recipient: string, extraData: any) => {
  // First, dispatch the custom event in case any mounted components (like the simulator) are listening
  window.dispatchEvent(new CustomEvent('shana-trigger-email', {
    detail: { type, recipient, extraData }
  }));

  // Then make the real API call to /api/email/dispatch
  fetch('/api/email/dispatch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      recipient: recipient.trim(),
      extraData
    })
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      return res.json();
    })
    .then(result => {
      if (result.success) {
        // Save to shana_simulated_emails so that it immediately appears in the Email Simulator lists
        try {
          const saved = localStorage.getItem('shana_simulated_emails');
          const emails = saved ? JSON.parse(saved) : [];
          const newEmail = {
            id: `mail_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            sender: result.provider ? `SHANA Server (${result.provider})` : 'security@shana-platform.com',
            recipient: recipient.trim(),
            subject: result.subject || `${type.toUpperCase()} - SHANA System`,
            bodyHtml: result.html || `<p>${type} dispatched successfully</p>`,
            bodyText: result.text || `${type} dispatched successfully`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Real SMTP Dispatch)',
            actionType: type as any,
            isUnread: true,
            etherealUrl: result.etherealUrl,
            realStatus: `Verified: ${result.provider} (ID: ${result.messageId})`
          };
          localStorage.setItem('shana_simulated_emails', JSON.stringify([newEmail, ...emails]));
          window.dispatchEvent(new Event('storage'));
        } catch (e) {
          console.error('[Email Helper] Local sync error:', e);
        }
      }
    })
    .catch(err => {
      console.warn('[Email Helper] Direct SMTP dispatch failed, fallback active:', err);
    });
};

interface AuthScreensProps {
  initialView?: 'signup' | 'login' | 'forgot-password' | 'profile-creation' | 'home';
  prefilledUser?: { firstName: string; lastName: string; targetRole: string; lang: 'EN' | 'FR' } | null;
  onLogout: () => void;
  onCompleteAll?: () => void;
}

export default function AuthScreens({ initialView = 'login', prefilledUser, onLogout, onCompleteAll }: AuthScreensProps) {
  const [currentView, setCurrentView] = useState<'signup' | 'login' | 'forgot-password' | 'profile-creation' | 'home'>(() => {
    // Session persistence check on mount
    const session = StorageService.getSession();
    if (session) {
      if (!session.profile.onboardingCompleted) {
        return 'profile-creation';
      }
      return 'home';
    }
    return initialView;
  });

  // Active Session State
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    const session = StorageService.getSession();
    if (session?.user) {
      const email = session.user.email?.toLowerCase().trim();
      if (email === 'eocochat@gmail.com' || email === 'superadmin@shana.com' || email === 'admin@shana.com') {
        return { ...session.user, role: 'super_admin' };
      }
      return session.user;
    }
    return null;
  });
  const [currentProfile, setCurrentProfile] = useState<ProfileType | null>(() => StorageService.getSession()?.profile || null);
  const [isPreparingCV, setIsPreparingCV] = useState(false);
  const [isSimulatingInterview, setIsSimulatingInterview] = useState(false);
  const [isVoiceTrainingActive, setIsVoiceTrainingActive] = useState(false);
  const [surpriseConfig, setSurpriseConfig] = useState<any>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activeDrillId, setActiveDrillId] = useState<string | null>(null);
  const [cvVersions, setCvVersions] = useState<any[]>([]);
  const { addToast } = useToast();
  const { checkMilestones } = useMilestoneTracker(currentUser?.id || null);

  useEffect(() => {
    const handleShanaNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { trigger, count, error } = customEvent.detail || {};
      const isFr = currentProfile?.language === 'French';

      if (trigger === 'purchase success') {
        addToast({
          title: isFr ? "Achat Réussi !" : "Purchase Successful!",
          description: isFr 
            ? "Votre bloc de préparation sélectionné est entièrement actif." 
            : "Your selected prep block is fully active.",
          type: 'success'
        });
      } else if (trigger === 'payment failed') {
        addToast({
          title: isFr ? "Échec du Paiement !" : "Payment Failed!",
          description: isFr 
            ? "Votre carte bancaire a été déclinée. Veuillez réessayer." 
            : "Your credit card was declined. Please try again.",
          type: 'warning'
        });
      } else if (trigger === 'Ultra activated') {
        addToast({
          title: isFr ? "SHANA Ultra Activé !" : "Ultra Unlimited Activated!",
          description: isFr 
            ? "Vous avez débloqué l'accès illimité aux entraînements vocaux et évaluations miroir." 
            : "You have unlocked unlimited voice training and mirror simulations.",
          type: 'success'
        });
      } else if (trigger === 'Ultra ending soon') {
        addToast({
          title: isFr ? "Fin de l'accès Ultra" : "Ultra Term concluding",
          description: isFr 
            ? "Vos crédits précédemment gelés ont été débloqués avec succès." 
            : "Your previously preserved balances have been successfully unfrozen.",
          type: 'info'
        });
      } else if (trigger === 'restore completed') {
        addToast({
          title: isFr ? "Restauration Terminée !" : "Restore Complete!",
          description: isFr 
            ? `Récupération de ${count} achat(s) précédent(s) et synchronisation des soldes cloud.` 
            : `Successfully restored ${count} previous purchase(s) and synced cloud balances.`,
          type: 'success'
        });
      }
      setRefreshToggle(prev => !prev);
    };

    window.addEventListener('shana_notification', handleShanaNotification);
    
    const handleShanaChangeTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
      }
    };
    window.addEventListener('shana_change_tab', handleShanaChangeTab);

    return () => {
      window.removeEventListener('shana_notification', handleShanaNotification);
      window.removeEventListener('shana_change_tab', handleShanaChangeTab);
    };
  }, [addToast, currentProfile]);

  const syncSessionWithBackend = async (user: UserType) => {
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      await fetch('/api/admin/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || 'candidate',
          status: user.status || 'enabled'
        })
      });
    } catch (err) {
      console.warn('[SHANA Auth] Failed to sync session with backend server:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      syncSessionWithBackend(currentUser);
    }
  }, [currentUser]);

  // Fetch CV versions for history mapping dynamically
  useEffect(() => {
    if (currentUser) {
      fetch('/api/v1/cv/versions', {
        headers: { 'Authorization': `Bearer ${currentUser.id}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch CV versions');
      })
      .then(data => {
        const list = data.data || data || [];
        setCvVersions(Array.isArray(list) ? list : []);
      })
      .catch(err => console.warn('Error loading CV versions in AuthScreens:', err));
    } else {
      setCvVersions([]);
    }
  }, [currentUser, refreshToggle]);

  const getMergedHistory = (): SessionHistoryItem[] => {
    if (!currentUser) return [];
    
    // 1. Load formal assessments with associated timestamps
    const baseHistory: SessionHistoryItem[] = (StorageService.getHistory(currentUser.id) || []).map((it: any) => ({
      ...it,
      timestamp: it.createdAt ? Date.parse(it.createdAt) : (it.id.startsWith('session_') ? parseInt(it.id.replace('session_', '')) : Date.parse(it.date) || 0)
    }));
    
    // 2. Load voice training sessions with associated timestamps
    let voiceSessions: any[] = [];
    try {
      const key = `shana_voice_sessions_${currentUser.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        voiceSessions = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Error parsing voice sessions:", e);
    }
    
    const mappedVoiceHistory: SessionHistoryItem[] = voiceSessions.map((sess: any) => {
      const ts = sess.createdAt ? (typeof sess.createdAt === 'number' ? sess.createdAt : Date.parse(sess.createdAt)) : 0;
      return {
        id: sess.id || `voice_${sess.createdAt || Math.random().toString(36).substr(2, 9)}`,
        type: 'TRAIN' as const,
        date: sess.createdAt ? new Date(sess.createdAt).toLocaleDateString(currentProfile?.language === 'French' ? 'fr-FR' : 'en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'Now',
        score: 82, // High-quality voice session standard score
        weakness: sess.improvement || "Slight conversation pacing acceleration when under situational constraints.",
        recommendation: sess.strength || "Formulate response frameworks before dialog initiation.",
        language: currentProfile?.language === 'French' ? 'FR' : 'EN',
        timestamp: ts
      };
    });

    // 3. Load CV versions and map parsed ones to history
    const mappedCvHistory: SessionHistoryItem[] = cvVersions
      .filter((v: any) => v.status === 'parsed')
      .map((v: any) => {
        const parsedData = v.parsedOutput || {};
        const ts = v.uploadDate ? Date.parse(v.uploadDate) : 0;
        return {
          id: v.id || `cv_${v.uploadDate || Math.random().toString(36).substr(2, 9)}`,
          type: 'CV_PARSE' as const,
          date: v.uploadDate ? new Date(v.uploadDate).toLocaleDateString(currentProfile?.language === 'French' ? 'fr-FR' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Now',
          score: 100, // standard completed CV diagnostic indicator
          weakness: currentProfile?.language === 'French'
            ? `Fichier d'origine: ${v.fileName}. Profil professionnel extrait et coefficients d'entraînement vocal étalonnés.`
            : `Source file: ${v.fileName}. Professional profile successfully extracted and training weights calibrated.`,
          recommendation: currentProfile?.language === 'French'
            ? `Poste visé: ${parsedData.targetRole || currentProfile.targetRole || "Profil Professionnel"}. Secteur: ${parsedData.industry || currentProfile.industry || "Technologie / Restauration"}.`
            : `Target role: ${parsedData.targetRole || currentProfile.targetRole || "Professional Profile"}. Industry: ${parsedData.industry || currentProfile.industry || "Technology / Catering"}.`,
          language: currentProfile?.language === 'French' ? 'FR' : 'EN',
          timestamp: ts
        };
      });

    const combined = [...baseHistory, ...mappedVoiceHistory, ...mappedCvHistory];
    
    // Sort chronologically using absolute timestamps descending (newest first)
    return combined.sort((a, b) => {
      const tsA = a.timestamp || 0;
      const tsB = b.timestamp || 0;
      return tsB - tsA;
    });
  };

  // Retrieve completed voice sessions count dynamically
  const getTrainingSessionsCount = () => {
    if (!currentUser) return 0;
    try {
      const key = `shana_voice_sessions_${currentUser.id}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved).length : 0;
    } catch (e) {
      return 0;
    }
  };

  const hasCV = currentUser ? !!StorageService.getAnalysis(currentUser.id) : false;
  const hasBlueprint = currentUser ? !!StorageService.getBlueprint(currentUser.id) : false;

  // Error and Notification banners
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ---- FORM FIELDS ----

  // 1. SIGNUP FORM
  const [signupForm, setSignupForm] = useState({
    firstName: prefilledUser?.firstName || '',
    lastName: prefilledUser?.lastName || '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // 2. LOGIN FORM
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // 3. FORGOT PASSWORD
  const [forgotEmail, setForgotEmail] = useState('');

  // 4. PROFILE COMPLETION FORM
  const [profileForm, setProfileForm] = useState({
    targetRole: prefilledUser?.targetRole || currentProfile?.targetRole || '',
    experienceYears: currentProfile?.experienceYears || '',
    industry: currentProfile?.industry || '',
    language: (prefilledUser?.lang === 'FR' ? 'French' : 'English') as 'French' | 'English'
  });

  // Load profileForm draft on mount/user change
  useEffect(() => {
    if (currentUser) {
      try {
        const saved = localStorage.getItem(`shana_draft_profile_completion_${currentUser.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setProfileForm(prev => ({
            ...prev,
            ...parsed
          }));
        }
      } catch (e) {
        console.warn("Failed to load profile completion draft", e);
      }
    }
  }, [currentUser]);

  // Save profileForm draft on change
  useEffect(() => {
    if (currentUser && (profileForm.targetRole || profileForm.experienceYears || profileForm.industry)) {
      try {
        localStorage.setItem(
          `shana_draft_profile_completion_${currentUser.id}`,
          JSON.stringify(profileForm)
        );
      } catch (e) {
        console.warn("Failed to save profile completion draft", e);
      }
    }
  }, [profileForm, currentUser]);

  // Clean error alerts upon switching screens
  const navigateTo = (view: 'signup' | 'login' | 'forgot-password' | 'profile-creation' | 'home') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setCurrentView(view);
  };

  // ---- FORM ACTIONS ----

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const { firstName, lastName, email, password, confirmPassword } = signupForm;

    // Strict Validations
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMsg('All fields are strictly required.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Security mandate: Passwords must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Verification failed: Passwords do not match.');
      return;
    }

    try {
      // Register User and create corresponding Profile
      const { user, profile } = StorageService.createUser(
        { firstName, lastName, email },
        password
      );

      // Dispatch simulated custom secure signup welcome email
      sendRealAndSimulatedEmail('signup', email, { firstName, lastName });

      // Create pre-filled metadata if they came from Phase 1 onboarding
      const updatedProfile = {
        ...profile,
        targetRole: profileForm.targetRole || prefilledUser?.targetRole || '',
        language: profileForm.language || (prefilledUser?.lang === 'FR' ? 'French' : 'English')
      };
      
      StorageService.saveProfile(updatedProfile);
      StorageService.setSession(user.id);

      const userWithElevatedRole = { ...user };
      if (user.email?.toLowerCase().trim() === 'eocochat@gmail.com') {
        userWithElevatedRole.role = 'super_admin';
      }
      setCurrentUser(userWithElevatedRole);
      setCurrentProfile(updatedProfile);

      setSuccessMsg('Account registered successfully! A secure welcome email has been sent to your inbox.');
      setTimeout(() => {
        navigateTo('profile-creation');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during signup.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const { email, password } = loginForm;
    if (!email.trim() || !password) {
      setErrorMsg('Please input both your email and password.');
      return;
    }

    try {
      // Auto restore and sync data from Firestore if the user exists in cloud
      await DbSyncManager.syncUserByEmail(email);
    } catch (syncErr) {
      console.warn('[SHANA Login] Pre-auth cloud sync skipped or failed:', syncErr);
    }

    try {
      const { user, profile } = StorageService.authenticate(email, password);
      StorageService.setSession(user.id);
      
      const userWithElevatedRole = { ...user };
      if (user.email?.toLowerCase().trim() === 'eocochat@gmail.com') {
        userWithElevatedRole.role = 'super_admin';
      }
      setCurrentUser(userWithElevatedRole);
      setCurrentProfile(profile);

      // Dispatch simulated custom secure login authorization notification
      sendRealAndSimulatedEmail('login', email, { firstName: user.firstName, lastName: user.lastName });

      // Set default fields for profile completion if they log back in
      setProfileForm({
        targetRole: profile.targetRole || '',
        experienceYears: profile.experienceYears || '',
        industry: profile.industry || '',
        language: profile.language || 'English'
      });

      setSuccessMsg('Session verified. Core login email dispatched.');
      setTimeout(() => {
        if (!profile.onboardingCompleted) {
          navigateTo('profile-creation');
        } else {
          navigateTo('home');
        }
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication rejected. Please check credentials.');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!forgotEmail.trim()) {
      setErrorMsg('Please input your email address.');
      return;
    }

    try {
      StorageService.simulatePasswordReset(forgotEmail);

      // Dispatch simulated custom password reset security link email
      sendRealAndSimulatedEmail('reset-password', forgotEmail, {});

      setSuccessMsg(`A secure password reset link has been successfully dispatched to ${forgotEmail}. Please check your inbox.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Email not found.');
    }
  };

  const handleProfileCompletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const { targetRole, experienceYears, industry, language } = profileForm;
    if (!targetRole.trim() || !experienceYears.toString().trim() || !industry.trim()) {
      setErrorMsg('All profile fields are strictly required.');
      return;
    }

    if (!currentUser) {
      setErrorMsg('No active user session detected.');
      return;
    }

    try {
      const completedProfile: ProfileType = {
        userId: currentUser.id,
        targetRole: targetRole.trim(),
        experienceYears: isNaN(Number(experienceYears)) ? experienceYears : Number(experienceYears),
        industry: industry.trim(),
        language,
        onboardingCompleted: true
      };

      StorageService.saveProfile(completedProfile);
      setCurrentProfile(completedProfile);
      try {
        localStorage.removeItem(`shana_draft_profile_completion_${currentUser.id}`);
      } catch (e) {}
      setCookie('shana_onboarding', 'true');
      setCookie('shana_lang', completedProfile.language === 'French' ? 'FR' : 'EN');

      setSuccessMsg('Profile personalization complete. Setting up dashboard...');
      setTimeout(() => {
        navigateTo('home');
      }, 800);
    } catch (err: any) {
      setErrorMsg('Failed to persist profile configuration.');
    }
  };

  const handleLogoutAction = () => {
    StorageService.setSession(null);
    setCurrentUser(null);
    setCurrentProfile(null);
    onLogout();
  };

  if (isPreparingCV && currentUser) {
    return (
      <CVPrepareFlow
        currentUser={currentUser}
        onBackToHome={() => setIsPreparingCV(false)}
        onComplete={(analysis, blueprint) => {
          // Synchroniser le profil avec les données du CV analysé (rôle, secteur, expérience)
          const existingProfile = StorageService.getProfile(currentUser.id);
          const updatedProfile: ProfileType = {
            userId: currentUser.id,
            targetRole: analysis.role || 'Manager de Restaurant',
            industry: analysis.industry || 'Restauration & Hôtellerie',
            experienceYears: analysis.experienceYears || '3',
            language: existingProfile?.language || 'French',
            onboardingCompleted: true,
            avatarUrl: existingProfile?.avatarUrl
          };
          StorageService.saveProfile(updatedProfile);
          setCurrentProfile(updatedProfile);
          
          setIsPreparingCV(false);
          setRefreshToggle(prev => !prev);
        }}
      />
    );
  }

  if (isSimulatingInterview && currentUser && currentProfile) {
    const blueprint = StorageService.getBlueprint(currentUser.id);
    return (
      <InterviewSimulator
        currentUser={currentUser}
        currentProfile={currentProfile}
        blueprint={blueprint}
        cvAnalysis={StorageService.getAnalysis(currentUser.id)}
        history={getMergedHistory()}
        surpriseConfig={surpriseConfig}
        onBack={() => {
          setIsSimulatingInterview(false);
          setSurpriseConfig(null);
          setRefreshToggle(prev => !prev);
        }}
        onNavigateTab={(tab) => {
          setIsSimulatingInterview(false);
          setSurpriseConfig(null);
          setActiveTab(tab as any);
          setRefreshToggle(prev => !prev);
        }}
      />
    );
  }

  if (isVoiceTrainingActive && currentUser && currentProfile) {
    const blueprint = StorageService.getBlueprint(currentUser.id);
    return (
      <VoiceTrainingFlow
        currentUser={currentUser}
        currentProfile={currentProfile}
        blueprint={blueprint}
        surpriseConfig={surpriseConfig}
        onBack={() => {
          setIsVoiceTrainingActive(false);
          setSurpriseConfig(null);
          setRefreshToggle(prev => !prev);
        }}
        onSessionSaved={() => {
          setRefreshToggle(prev => !prev);
          setSurpriseConfig(null);
          checkMilestones({ isNewSession: true });
        }}
      />
    );
  }

  if (currentView === 'home' && currentUser && currentProfile) {
    const experienceLevelMapped = (() => {
      const yrs = parseInt((currentProfile.experienceYears || 0).toString());
      if (yrs <= 2) return 'junior';
      if (yrs <= 5) return 'mid';
      if (yrs <= 10) return 'senior';
      return 'executive';
    })();

    const isUserAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';
    const isMaintenance = ConfigurationService.isMaintenanceActive();
    const isReadOnly = ConfigurationService.isReadOnlyActive();

    // Critical Maintenance Lockdown Screen for candidates
    if (isMaintenance && !isUserAdmin) {
      const isFr = currentProfile.language === 'French';
      return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full bg-white border border-stone-200 p-8 rounded-[32px] space-y-6 shadow-xs">
            <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <LockKeyhole className="w-6 h-6" />
            </div>
            
            <div className="space-y-3">
              <span className="font-mono text-[9px] uppercase tracking-widest bg-amber-100 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-md font-bold">
                {isFr ? "MAINTENANCE SYSTEME" : "SYSTEM MAINTENANCE"}
              </span>
              <h2 className="text-xl font-sans font-black text-stone-900 tracking-tight mt-3">
                {isFr ? "Espace Temporairement Indisponible" : "System Temporarily Offline"}
              </h2>
              <p className="text-[#6B7280] text-xs leading-relaxed font-semibold">
                {isFr 
                  ? "SHANA fait l'objet d'une maintenance planifiée afin de mettre à jour le calibrage des scores IA. Nous serons de retour d'ici quelques instants."
                  : "SHANA is undergoing scheduled maintenance to upgrade our deep learning AI model scores. We will be back online shortly."}
              </p>
            </div>

            <div className="border-t border-stone-100 pt-4">
              <p className="text-[10px] text-stone-400 font-bold font-mono">
                {isFr ? "Merci pour votre patience !" : "Thank you for your understanding !"}
              </p>
            </div>
          </div>
        </div>
      );
    }

    const mappedUser = {
      id: currentUser.id,
      name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      email: currentUser.email,
      targetRole: currentProfile.targetRole || "Candidate",
      industry: currentProfile.industry || "Technology",
      experienceLevel: experienceLevelMapped as 'junior' | 'mid' | 'senior' | 'executive',
      avatarUrl: currentProfile.avatarUrl || ''
    };

    return (
      <div id="dashboard-layout-root" className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Top Navigation Panel */}
            <Navbar 
              activeTab={activeTab} 
              lang={currentProfile.language === 'French' ? 'FR' : 'EN'} 
              onTabChange={setActiveTab} 
            />
            
            <div id="main-content-workspace" className="pb-16 animate-fade-in">
              {activeTab === 'home' && (
                <DashboardView
                  user={mappedUser}
                  lang={currentProfile.language === 'French' ? 'FR' : 'EN'}
                  history={getMergedHistory()}
                  onChangeTab={setActiveTab}
                  onTriggerCVUpload={() => {
                    if (isReadOnly && !isUserAdmin) {
                      alert(currentProfile.language === 'French' ? "Mode lecture seule actif. Le téléversement de CV est désactivé." : "Read-only mode is active. CV upload is temporarily disabled.");
                      return;
                    }
                    setIsPreparingCV(true);
                  }}
                  onTriggerVoiceTraining={() => {
                    if (isReadOnly && !isUserAdmin) {
                      alert(currentProfile.language === 'French' ? "Mode lecture seule actif. L'entraînement vocal est désactivé." : "Read-only mode is active. Voice training is temporarily disabled.");
                      return;
                    }
                    setIsVoiceTrainingActive(true);
                  }}
                />
              )}

              {activeTab === 'candidate-brain' && (
                <CandidateBrainView
                  userId={currentUser.id}
                  lang={currentProfile.language === 'French' ? 'FR' : 'EN'}
                  onChangeTab={(tabArg) => {
                    if (tabArg && typeof tabArg === 'object') {
                      setActiveTab(tabArg.tab);
                      setActiveDrillId(tabArg.drillId);
                    } else {
                      setActiveTab(tabArg);
                      setActiveDrillId(null);
                    }
                  }}
                />
              )}
              
              {activeTab === 'train' && (
                <VoiceTrainingFlow
                  currentUser={currentUser}
                  currentProfile={currentProfile}
                  blueprint={StorageService.getBlueprint(currentUser.id)}
                  drillId={activeDrillId || undefined}
                  onBack={() => {
                    setActiveTab('home');
                    setActiveDrillId(null);
                  }}
                  onSessionSaved={() => {
                    setRefreshToggle(prev => !prev);
                    checkMilestones({ isNewSession: true });
                    setActiveTab('home');
                    setActiveDrillId(null);
                  }}
                />
              )}
              
              {activeTab === 'assessment' && (
                <>
                  {isReadOnly && !isUserAdmin ? (
                    <div className="max-w-2xl mx-auto py-12 text-center space-y-6 bg-white border border-[#E5E7EB] rounded-[32px] p-8 shadow-xs">
                      <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <LockKeyhole className="w-6 h-6" />
                      </div>
                      <div className="space-y-2 max-w-md mx-auto">
                        <span className="font-mono text-[9px] uppercase tracking-widest bg-amber-100 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-md font-bold">
                          {currentProfile.language === 'French' ? "MODE LECTURE SEULE" : "READ-ONLY MODE ACTIVE"}
                        </span>
                        <h3 className="font-sans font-bold text-xl text-[#1A2B3C] mt-2">
                          {currentProfile.language === 'French' ? "Évaluation temporairement verrouillée" : "Assessments Temporarily Locked"}
                        </h3>
                        <p className="text-[#6B7280] text-xs leading-relaxed font-semibold">
                          {currentProfile.language === 'French'
                            ? "La plateforme est actuellement en mode lecture seule. Les nouvelles évaluations sous caméra sont suspendues temporairement."
                            : "The platform is currently operating under a read-only state. Initiating new camera assessments is suspended."}
                        </p>
                      </div>
                    </div>
                  ) : !(hasCV && getTrainingSessionsCount() > 0) ? (
                    <div id="assessment-locked-flow-stage" className="max-w-2xl mx-auto py-8 text-center space-y-6 bg-white border border-[#E5E7EB] rounded-[32px] p-8 shadow-sm">
                      <div className="w-16 h-16 bg-neutral-100 text-zinc-550 border border-zinc-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <LockKeyhole className="w-6 h-6 text-zinc-500" />
                      </div>
                      <div className="space-y-2 max-w-sm mx-auto">
                        <span className="font-mono text-[9px] uppercase tracking-widest bg-zinc-200 border border-zinc-300 text-zinc-650 px-2.5 py-1 rounded font-bold">
                          ASSESSMENT STATUS: LOCKED
                        </span>
                        <h3 className="font-sans font-bold text-xl text-[#1A2B3C] mt-2">
                          {currentProfile.language === 'French' ? "Évaluation Miroir Verrouillée" : "Formal Assessment Evaluation Locked"}
                        </h3>
                        <p className="text-[#6B7280] text-xs leading-relaxed font-semibold">
                          {currentProfile.language === 'French' 
                            ? "Complete training before assessment. Vous devez d'abord compléter l'analyse de votre CV (Phase 3) et réaliser au moins un entraînement vocal (Phase 4) pour calibrer SHANA."
                            : "Complete training before assessment. You must first upload/analyze your CV and complete at least one Voice Training session to calibrate SHANA's baseline."}
                        </p>
                      </div>
                      
                      <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => {
                            if (isReadOnly && !isUserAdmin) {
                              alert(currentProfile.language === 'French' ? "Mode lecture seule actif. Le téléversement de CV est désactivé." : "Read-only mode is active. CV upload is temporarily disabled.");
                              return;
                            }
                            setIsPreparingCV(true);
                          }}
                          className="bg-white border border-[#E5E7EB] text-[#1A2B3C] font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl cursor-pointer hover:bg-neutral-50 font-sans"
                        >
                          {hasCV ? (currentProfile.language === 'French' ? "Modifier le CV" : "Update CV") : (currentProfile.language === 'French' ? "Déposer le CV" : "Upload CV")}
                        </button>
                        
                        <button
                          onClick={() => {
                            if (isReadOnly && !isUserAdmin) {
                              alert(currentProfile.language === 'French' ? "Mode lecture seule actif. L'entraînement vocal est désactivé." : "Read-only mode is active. Voice training is temporarily disabled.");
                              return;
                            }
                            setIsVoiceTrainingActive(true);
                          }}
                          className="bg-[#1A2B3C] hover:bg-[#2C3E50] text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl cursor-pointer shadow-md font-sans"
                        >
                          {currentProfile.language === 'French' ? "Démarrer l'Entraînement Vocal" : "Start Voice Training"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <AssessmentView
                      user={mappedUser}
                      lang={currentProfile.language === 'French' ? 'FR' : 'EN'}
                      onSessionComplete={(newSess) => {
                        const existingHistory = StorageService.getHistory(currentUser.id) || [];
                        StorageService.saveHistory(currentUser.id, [newSess, ...existingHistory]);
                        setRefreshToggle(prev => !prev);
                        checkMilestones({ score: newSess.score, isNewSession: true });
                      }}
                      onChangeTab={setActiveTab}
                    />
                  )}
                </>
              )}
              
              {activeTab === 'history' && (
                <HistoryView
                  history={getMergedHistory()}
                  lang={currentProfile.language === 'French' ? 'FR' : 'EN'}
                  user={mappedUser}
                />
              )}

              {activeTab === 'discoveries' && (
                <DiscoveriesView
                  user={mappedUser}
                  lang={currentProfile.language === 'French' ? 'FR' : 'EN'}
                  history={getMergedHistory()}
                  onStartSurpriseInterview={(config) => {
                    setSurpriseConfig(config);
                    if (config.format === 'Voice Call' || config.format === 'Voice Training') {
                      setIsVoiceTrainingActive(true);
                    } else {
                      setIsSimulatingInterview(true);
                    }
                  }}
                />
              )}
              
              {activeTab === 'purchase' && (
                <PurchaseView
                  userId={currentUser.id}
                  lang={currentProfile.language === 'French' ? 'FR' : 'EN'}
                  onNavigateTab={setActiveTab}
                />
              )}
              
              {activeTab === 'profile' && (
                <ProfileView
                  user={mappedUser}
                  lang={currentProfile.language === 'French' ? 'FR' : 'EN'}
                  onChangeLang={(langCode) => {
                    const updatedProfile = {
                      ...currentProfile,
                      language: langCode === 'FR' ? ('French' as const) : ('English' as const)
                    };
                    StorageService.saveProfile(updatedProfile);
                    setCurrentProfile(updatedProfile);
                    setCookie('shana_lang', langCode);
                    setRefreshToggle(prev => !prev);
                  }}
                  onUpdateProfile={(updatedData) => {
                    let yrs = currentProfile.experienceYears;
                    if (updatedData.experienceLevel === 'junior') yrs = 2;
                    else if (updatedData.experienceLevel === 'mid') yrs = 4;
                    else if (updatedData.experienceLevel === 'senior') yrs = 8;
                    else if (updatedData.experienceLevel === 'executive') yrs = 12;

                    const updatedProfile = {
                      ...currentProfile,
                      targetRole: updatedData.targetRole,
                      industry: updatedData.industry,
                      experienceYears: yrs,
                      avatarUrl: updatedData.avatarUrl !== undefined ? updatedData.avatarUrl : currentProfile.avatarUrl
                    };
                    StorageService.saveProfile(updatedProfile);
                    setCurrentProfile(updatedProfile);
                    setRefreshToggle(prev => !prev);
                  }}
                  onResetOnboarding={() => {
                    const updatedProfile = {
                      ...currentProfile,
                      onBoardingCompleted: false,
                      onboardingCompleted: false
                    };
                    StorageService.saveProfile(updatedProfile);
                    setCurrentProfile(updatedProfile);
                    deleteCookie('shana_onboarding');
                    setCurrentView('profile-creation');
                  }}
                  onLogout={handleLogoutAction}
                />
              )}

              {activeTab === 'admin' && currentUser && (
                <RoleGuard
                  user={currentUser}
                  allowedRoles={['admin', 'super_admin']}
                  lang={currentProfile.language === 'French' ? 'FR' : 'EN'}
                  onRedirect={() => setActiveTab('home')}
                >
                  <AdminView
                    currentUser={currentUser}
                    lang={currentProfile.language === 'French' ? 'FR' : 'EN'}
                    onNavigateTab={setActiveTab}
                  />
                </RoleGuard>
              )}

              {activeTab === 'recruiter-workspace' && currentUser && (
                <RoleGuard
                  user={currentUser}
                  allowedRoles={['admin', 'super_admin']}
                  lang={currentProfile.language === 'French' ? 'FR' : 'EN'}
                  onRedirect={() => setActiveTab('home')}
                >
                  <div className="bg-white border-2 border-stone-950 p-6 rounded-[32px] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] text-left">
                    <EnterpriseCenter
                      currentUser={currentUser}
                      lang={currentProfile.language === 'French' ? 'FR' : 'EN'}
                    />
                  </div>
                </RoleGuard>
              )}
            </div>
          </div>
        </div>
        {/* SHANA Interactive AI Floating Companion */}
        <AICompanion 
          user={mappedUser} 
          lang={currentProfile.language === 'French' ? 'FR' : 'EN'} 
          onTabChange={setActiveTab} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-950 flex flex-col font-sans select-none justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* BRAND HEADER DISPLAY */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8 flex flex-col items-center">
        <ShanaLogo size="md" showSlogan={true} className="mb-2" />
        <p className="font-mono text-[9px] uppercase tracking-widest text-stone-500 font-bold">Phase 2: Authentication Engine</p>
      </div>

      <div id="auth-container" className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-10 px-6 sm:px-10 border-2 border-stone-950 rounded-2xl shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden">

          {/* STATUS ALERTS */}
          {errorMsg && (
            <div id="auth-error-alert" className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-2xl flex items-start gap-3 text-red-950 text-xs font-black shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div id="auth-success-alert" className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex items-start gap-3 text-emerald-950 text-xs font-black shadow-[2px_2px_0px_0px_rgba(16,185,129,1)]">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ==================== 1. SIGNUP VIEW ==================== */}
          {currentView === 'signup' && (
            <div id="view-signup" className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-[#1A2B3C] tracking-tight">Create Account</h3>
                <p className="text-xs text-[#6B7280] font-medium">Define your master security credentials to lock your profile data.</p>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                      <input
                        id="signup-firstname-input"
                        type="text"
                        required
                        value={signupForm.firstName}
                        onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                        className="w-full bg-[#F3F4F6]/50 border border-[#E5E7EB] pl-10 pr-3.5 py-3 rounded-xl text-xs outline-none focus:border-[#1A2B3C] text-[#111827] font-medium"
                        placeholder="Marie"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                      <input
                        id="signup-lastname-input"
                        type="text"
                        required
                        value={signupForm.lastName}
                        onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                        className="w-full bg-[#F3F4F6]/50 border border-[#E5E7EB] pl-10 pr-3.5 py-3 rounded-xl text-xs outline-none focus:border-[#1A2B3C] text-[#111827] font-medium"
                        placeholder="Dubois"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      id="signup-email-input"
                      type="email"
                      required
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      className="w-full bg-[#F3F4F6]/50 border border-[#E5E7EB] pl-10 pr-3.5 py-3 rounded-xl text-xs outline-none focus:border-[#1A2B3C] text-[#111827] font-medium"
                      placeholder="marie.dubois@corporation.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                      <input
                        id="signup-password-input"
                        type="password"
                        required
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        className="w-full bg-[#F3F4F6]/50 border border-[#E5E7EB] pl-10 pr-3.5 py-3 rounded-xl text-xs outline-none focus:border-[#1A2B3C] text-[#111827] font-medium"
                        placeholder="Min 6 characters"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                      <input
                        id="signup-confirm-input"
                        type="password"
                        required
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                        className="w-full bg-[#F3F4F6]/50 border border-[#E5E7EB] pl-10 pr-3.5 py-3 rounded-xl text-xs outline-none focus:border-[#1A2B3C] text-[#111827] font-medium"
                        placeholder="Re-enter password"
                      />
                    </div>
                  </div>
                </div>

                <button
                  id="signup-submit-btn"
                  type="submit"
                  className="w-full py-4 bg-[#1A2B3C] hover:bg-[#2C3E50] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md mt-4 active:scale-[0.98] cursor-pointer text-center"
                >
                  Create Account
                </button>
              </form>

              <div className="pt-4 border-t border-[#F3F4F6] text-center text-xs text-[#6B7280]">
                <span>Already have an account? </span>
                <button 
                  id="signup-to-login-btn"
                  onClick={() => navigateTo('login')}
                  className="text-[#1A2B3C] font-bold hover:underline cursor-pointer"
                >
                  Log In
                </button>
              </div>
            </div>
          )}

          {/* ==================== 2. LOGIN VIEW ==================== */}
          {currentView === 'login' && (
            <div id="view-login" className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-[#1A2B3C] tracking-tight">Welcome back</h3>
                <p className="text-xs text-[#6B7280] font-medium">Enter your credentials to regain access to your console.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full bg-[#F3F4F6]/50 border border-[#E5E7EB] pl-10 pr-3.5 py-3 rounded-xl text-xs outline-none focus:border-[#1A2B3C] text-[#111827] font-medium"
                      placeholder="e.g. marie.dubois@corporation.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF]">Password</label>
                    <button
                      id="login-to-forgot-btn"
                      type="button"
                      onClick={() => navigateTo('forgot-password')}
                      className="text-[10px] font-bold text-[#6B7280] hover:text-[#1A2B3C] cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      id="login-password-input"
                      type="password"
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full bg-[#F3F4F6]/50 border border-[#E5E7EB] pl-10 pr-3.5 py-3 rounded-xl text-xs outline-none focus:border-[#1A2B3C] text-[#111827] font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  className="w-full py-4 bg-[#1A2B3C] hover:bg-[#2C3E50] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md mt-4 active:scale-[0.98] cursor-pointer text-center"
                >
                  Log In
                </button>
              </form>

              <div className="pt-4 border-t border-[#F3F4F6] text-center text-xs text-[#6B7280]">
                <span>New to SHANA? </span>
                <button 
                  id="login-to-signup-btn"
                  onClick={() => navigateTo('signup')}
                  className="text-[#1A2B3C] font-bold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* ==================== 3. FORGOT PASSWORD VIEW ==================== */}
          {currentView === 'forgot-password' && (
            <div id="view-forgot-password" className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-[#1A2B3C] tracking-tight font-sans">Reset Password</h3>
                <p className="text-xs text-[#6B7280] font-medium">Input your registered email. Shana will dispatch secure reset credentials.</p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      id="forgot-email-input"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-[#F3F4F6]/50 border border-[#E5E7EB] pl-10 pr-3.5 py-3 rounded-xl text-xs outline-none focus:border-[#1A2B3C] text-[#111827] font-medium"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <button
                  id="forgot-submit-btn"
                  type="submit"
                  className="w-full py-4 bg-[#1A2B3C] hover:bg-[#2C3E50] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md mt-2 active:scale-[0.98] cursor-pointer text-center"
                >
                  Send Reset Link
                </button>
              </form>

              <div className="pt-4 border-t border-[#F3F4F6] text-center text-xs text-[#6B7280]">
                <button 
                  id="forgot-to-login-btn"
                  onClick={() => navigateTo('login')}
                  className="text-[#1A2B3C] font-bold hover:underline cursor-pointer"
                >
                  Back to Log In
                </button>
              </div>
            </div>
          )}

          {/* ==================== 4. PROFILE COMPLETION VIEW ==================== */}
          {currentView === 'profile-creation' && (
            <div id="view-profile-completion" className="space-y-6">
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">ACCOUNT SECURED</span>
                <h3 className="text-2xl font-black text-[#1A2B3C] tracking-tight">Create Your Profile</h3>
                <p className="text-xs text-[#6B7280] font-medium">Add professional metrics to personalize your upcoming voice training.</p>
              </div>

              <form onSubmit={handleProfileCompletionSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">Target Role / Designation</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      id="profile-role-input"
                      type="text"
                      required
                      value={profileForm.targetRole}
                      onChange={(e) => setProfileForm({ ...profileForm, targetRole: e.target.value })}
                      className="w-full bg-[#F3F4F6]/50 border border-[#E5E7EB] pl-10 pr-3.5 py-3 rounded-xl text-xs outline-none focus:border-[#1A2B3C] text-[#111827] font-medium"
                      placeholder="e.g. Lead Devops Architect or VP Finance"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">Years Of Experience</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                      <input
                        id="profile-experience-input"
                        type="text"
                        required
                        value={profileForm.experienceYears}
                        onChange={(e) => setProfileForm({ ...profileForm, experienceYears: e.target.value })}
                        className="w-full bg-[#F3F4F6]/50 border border-[#E5E7EB] pl-10 pr-3.5 py-3 rounded-xl text-xs outline-none focus:border-[#1A2B3C] text-[#111827] font-medium"
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">Current Industry</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                      <input
                        id="profile-industry-input"
                        type="text"
                        required
                        value={profileForm.industry}
                        onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                        className="w-full bg-[#F3F4F6]/50 border border-[#E5E7EB] pl-10 pr-3.5 py-3 rounded-xl text-xs outline-none focus:border-[#1A2B3C] text-[#111827] font-medium"
                        placeholder="e.g. Biotech / SaaS"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] mb-1">Preferred Training Language</label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <button
                      id="profile-lang-en-btn"
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, language: 'English' })}
                      className={`p-3.5 text-center border rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs cursor-pointer ${
                        profileForm.language === 'English'
                          ? 'border-[#1A2B3C] bg-[#1A2B3C]/5 text-[#1A2B3C] ring-1 ring-[#1A2B3C]'
                          : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-zinc-300'
                      }`}
                    >
                      <span>🇬🇧 English</span>
                      {profileForm.language === 'English' && <Check className="w-3.5 h-3.5 text-[#1A2B3C]" />}
                    </button>

                    <button
                      id="profile-lang-fr-btn"
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, language: 'French' })}
                      className={`p-3.5 text-center border rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs cursor-pointer ${
                        profileForm.language === 'French'
                          ? 'border-[#1A2B3C] bg-[#1A2B3C]/5 text-[#1A2B3C] ring-1 ring-[#1A2B3C]'
                          : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-zinc-300'
                      }`}
                    >
                      <span>🇫🇷 Français</span>
                      {profileForm.language === 'French' && <Check className="w-3.5 h-3.5 text-[#1A2B3C]" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center gap-4">
                  <button
                    id="profile-signout-btn"
                    type="button"
                    onClick={handleLogoutAction}
                    className="px-4 py-3 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>

                  <button
                    id="profile-save-btn"
                    type="submit"
                    className="flex-1 py-4 bg-[#1A2B3C] hover:bg-[#2C3E50] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-center"
                  >
                    Complete Profile
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
