import { User, Profile, CVAnalysis, InterviewBlueprint, UserPreferences } from '../types';
import { getBrowserLanguageLabel } from '../utils';
import { DbSyncManager } from './dbSync';

const USERS_KEY = 'shana_users';
const PROFILES_KEY = 'shana_profiles';
const SESSION_KEY = 'shana_session';
const PASSWORDS_KEY = 'shana_passwords'; // Mock hashed password storage in localStorage
const ANALYSES_KEY = 'shana_analyses';
const BLUEPRINTS_KEY = 'shana_blueprints';

function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Error reading key from localStorage:', key, e);
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing key to localStorage:', key, e);
  }
}

let _sessionUserId: string | null = null;

export const StorageService = {
  // --- USER API ---
  getUsers(): User[] {
    // Self-seeding block to provide accounts for Admin track verification
    if (typeof window !== 'undefined' && localStorage.getItem('shana_seeded_v1') !== 'true') {
      const initialUsers: User[] = [
        { id: 'usr_candidate', firstName: 'Jean', lastName: 'Candidat', email: 'candidate@shana.com', createdAt: new Date().toISOString(), role: 'candidate', status: 'enabled' },
        { id: 'usr_admin', firstName: 'Alice', lastName: 'Admin', email: 'admin@shana.com', createdAt: new Date().toISOString(), role: 'admin', status: 'enabled' },
        { id: 'usr_superadmin', firstName: 'Marc', lastName: 'Super', email: 'superadmin@shana.com', createdAt: new Date().toISOString(), role: 'super_admin', status: 'enabled' },
        { id: 'usr_disabled', firstName: 'René', lastName: 'Désactivé', email: 'disabled@shana.com', createdAt: new Date().toISOString(), role: 'candidate', status: 'disabled' }
      ];
      const initialPasswords = {
        'usr_candidate': 'candidate123',
        'usr_admin': 'admin123',
        'usr_superadmin': 'super123',
        'usr_disabled': 'disabled123'
      };
      const initialProfiles: Profile[] = [
        { userId: 'usr_candidate', targetRole: 'Software Engineer', experienceYears: 3, industry: 'Technology', language: 'French', onboardingCompleted: true },
        { userId: 'usr_admin', targetRole: 'HR Manager', experienceYears: 7, industry: 'Human Resources', language: 'French', onboardingCompleted: true },
        { userId: 'usr_superadmin', targetRole: 'Platform Lead', experienceYears: 12, industry: 'Information Technology', language: 'French', onboardingCompleted: true },
        { userId: 'usr_disabled', targetRole: 'Data Analyst', experienceYears: 2, industry: 'Finance', language: 'French', onboardingCompleted: true }
      ];

      // Merge with any existing users to preserve working candidate content if any
      const currentList = safeGetItem<User[]>(USERS_KEY, []);
      initialUsers.forEach(u => {
        if (!currentList.some(cu => cu.email.toLowerCase() === u.email.toLowerCase())) {
          currentList.push(u);
        }
      });
      safeSetItem(USERS_KEY, currentList);

      const currentPasswords = safeGetItem<Record<string, string>>(PASSWORDS_KEY, {});
      Object.assign(currentPasswords, initialPasswords);
      safeSetItem(PASSWORDS_KEY, currentPasswords);

      const currentProfiles = safeGetItem<Profile[]>(PROFILES_KEY, []);
      initialProfiles.forEach(p => {
        if (!currentProfiles.some(cp => cp.userId === p.userId)) {
          currentProfiles.push(p);
        }
      });
      safeSetItem(PROFILES_KEY, currentProfiles);

      localStorage.setItem('shana_seeded_v1', 'true');
    }

    const list = safeGetItem<User[]>(USERS_KEY, []);
    let mutated = false;
    const sanitized = list.map(u => {
      const clean = u.email ? u.email.trim().toLowerCase() : '';
      let localMutated = false;
      let updatedUser = { ...u };
      if (!updatedUser.role) {
        updatedUser.role = 'candidate';
        localMutated = true;
      }
      if (!updatedUser.status) {
        updatedUser.status = 'enabled';
        localMutated = true;
      }
      if (updatedUser.email !== clean) {
        updatedUser.email = clean;
        localMutated = true;
      }
      if (localMutated) {
        mutated = true;
        return updatedUser;
      }
      return u;
    });
    if (mutated) {
      safeSetItem(USERS_KEY, sanitized);
    }
    return sanitized;
  },

  getUser(userId: string | null): User | null {
    if (!userId) return null;
    const users = this.getUsers();
    return users.find(u => u.id === userId) || null;
  },

  saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    safeSetItem(USERS_KEY, users);

    // Sync to Firestore
    const profile = this.getProfile(user.id);
    const analysis = this.getAnalysis(user.id);
    if (profile) {
      DbSyncManager.saveUserAndProfile(user, profile, analysis);
    }

    try {
      window.dispatchEvent(new Event('shana_progress_update'));
    } catch (e) {}
  },

  createUser(user: Omit<User, 'id' | 'createdAt'>, password: string): { user: User; profile: Profile } {
    const users = this.getUsers();
    const passwords = safeGetItem<Record<string, string>>(PASSWORDS_KEY, {});

    const cleanEmail = user.email.toLowerCase().trim();

    // Check if user already exists
    if (users.some(u => u.email.toLowerCase().trim() === cleanEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    const userId = 'usr_' + Math.random().toString(36).substring(2, 11);
    const newUser: User = {
      id: userId,
      firstName: user.firstName.trim(),
      lastName: user.lastName.trim(),
      email: cleanEmail,
      createdAt: new Date().toISOString(),
      role: 'candidate',
      status: 'enabled',
    };

    // Store credentials
    users.push(newUser);
    passwords[newUser.id] = password;

    // Create corresponding profile
    const profiles = this.getProfiles();
    const newProfile: Profile = {
      userId,
      targetRole: '',
      experienceYears: '',
      industry: '',
      language: getBrowserLanguageLabel(),
      onboardingCompleted: false,
    };
    profiles.push(newProfile);

    // Persist
    safeSetItem(USERS_KEY, users);
    safeSetItem(PASSWORDS_KEY, passwords);
    safeSetItem(PROFILES_KEY, profiles);

    // Sync to Firestore
    DbSyncManager.saveUserAndProfile(newUser, newProfile);

    return { user: newUser, profile: newProfile };
  },

  // --- PROFILE API ---
  getProfiles(): Profile[] {
    return safeGetItem<Profile[]>(PROFILES_KEY, []);
  },

  getProfile(userId: string | null): Profile | null {
    if (!userId) return null;
    const profiles = this.getProfiles();
    return profiles.find(p => p.userId === userId) || null;
  },

  saveProfile(profile: Profile): void {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.userId === profile.userId);
    if (index !== -1) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    safeSetItem(PROFILES_KEY, profiles);

    // Sync to Firestore
    const user = this.getUser(profile.userId);
    const analysis = this.getAnalysis(profile.userId);
    if (user) {
      DbSyncManager.saveUserAndProfile(user, profile, analysis);
    }

    try {
      window.dispatchEvent(new Event('shana_progress_update'));
    } catch (e) {}
  },

  // --- AUTHENTICATION API ---
  authenticate(email: string, authPass: string): { user: User; profile: Profile } {
    const users = this.getUsers();
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!targetUser) {
      throw new Error('Account not found. Please review your email or register a new account.');
    }

    if (targetUser.status === 'disabled') {
      throw new Error('This account has been disabled by administrators.');
    }

    const passwords = safeGetItem<Record<string, string>>(PASSWORDS_KEY, {});
    if (passwords[targetUser.id] !== authPass) {
      throw new Error('Incorrect password. Please verify your typing and try again.');
    }

    const profile = this.getProfile(targetUser.id);
    if (!profile) {
      // Auto heal missing profile structure
      const newProfile: Profile = {
        userId: targetUser.id,
        targetRole: '',
        experienceYears: '',
        industry: '',
        language: getBrowserLanguageLabel(),
        onboardingCompleted: false,
      };
      this.saveProfile(newProfile);
      return { user: targetUser, profile: newProfile };
    }

    return { user: targetUser, profile };
  },

  simulatePasswordReset(email: string): void {
    const users = this.getUsers();
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!exists) {
      throw new Error('Account not found with this email.');
    }
  },

  // --- SESSION API ---
  setSessionInMemory(userId: string | null): void {
    _sessionUserId = userId;
  },

  setSession(userId: string | null): void {
    _sessionUserId = userId;
    // Clear legacy local session key to avoid any local session leakage
    localStorage.removeItem(SESSION_KEY);

    if (userId) {
      // Trigger cloud-to-local synchronization
      DbSyncManager.syncCloudToLocal(userId);

      fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      }).catch(err => console.error('[SHANA Storage] Failed to register server cookie session:', err));
    } else {
      fetch('/api/auth/logout', {
        method: 'POST',
      }).catch(err => console.error('[SHANA Storage] Failed to clear server cookie session:', err));
    }
  },

  getSession(): { user: User; profile: Profile } | null {
    if (!_sessionUserId) return null;

    const user = this.getUser(_sessionUserId);
    const profile = this.getProfile(_sessionUserId);

    if (user && profile) {
      return { user, profile };
    }

    return null;
  },

  // --- CV ANALYSIS API ---
  saveAnalysis(analysis: CVAnalysis): void {
    const list = safeGetItem<CVAnalysis[]>(ANALYSES_KEY, []);
    const idx = list.findIndex(a => a.userId === analysis.userId);
    if (idx !== -1) {
      list[idx] = analysis;
    } else {
      list.push(analysis);
    }
    safeSetItem(ANALYSES_KEY, list);

    // Sync to Firestore profiles table
    const profile = this.getProfile(analysis.userId);
    const user = this.getUser(analysis.userId);
    if (profile && user) {
      DbSyncManager.saveUserAndProfile(user, profile, analysis);
    }

    try {
      window.dispatchEvent(new Event('shana_progress_update'));
    } catch (e) {}
  },

  getAnalysis(userId: string | null): CVAnalysis | null {
    if (!userId) return null;
    const list = safeGetItem<CVAnalysis[]>(ANALYSES_KEY, []);
    return list.find(a => a.userId === userId) || null;
  },

  // --- INTERVIEW BLUEPRINT API ---
  saveBlueprint(blueprint: InterviewBlueprint): void {
    const list = safeGetItem<InterviewBlueprint[]>(BLUEPRINTS_KEY, []);
    const idx = list.findIndex(b => b.userId === blueprint.userId);
    if (idx !== -1) {
      list[idx] = blueprint;
    } else {
      list.push(blueprint);
    }
    safeSetItem(BLUEPRINTS_KEY, list);
    try {
      window.dispatchEvent(new Event('shana_progress_update'));
    } catch (e) {}
  },

  getBlueprint(userId: string | null): InterviewBlueprint | null {
    if (!userId) return null;
    const list = safeGetItem<InterviewBlueprint[]>(BLUEPRINTS_KEY, []);
    return list.find(b => b.userId === userId) || null;
  },

  deleteAnalysisAndBlueprint(userId: string): void {
    const analyses = safeGetItem<CVAnalysis[]>(ANALYSES_KEY, []);
    safeSetItem(ANALYSES_KEY, analyses.filter(a => a.userId !== userId));

    const blueprints = safeGetItem<InterviewBlueprint[]>(BLUEPRINTS_KEY, []);
    safeSetItem(BLUEPRINTS_KEY, blueprints.filter(b => b.userId !== userId));
    try {
      window.dispatchEvent(new Event('shana_progress_update'));
    } catch (e) {}
  },

  getHistory(userId: string): any[] {
    const key = `shana_history_${userId}`;
    return safeGetItem<any[]>(key, []);
  },

  saveHistory(userId: string, history: any[]): void {
    const key = `shana_history_${userId}`;
    safeSetItem(key, history);

    // Sync latest interview session to Firestore
    if (history && history.length > 0) {
      const latestSession = history[0];
      DbSyncManager.saveSessionToCloud(userId, latestSession);
    }

    try {
      window.dispatchEvent(new Event('shana_progress_update'));
    } catch (e) {}
  },

  // --- USER PREFERENCES API ---
  getUserPreferences(userId: string): UserPreferences | null {
    const key = `shana_prefs_${userId}`;
    return safeGetItem<UserPreferences | null>(key, null);
  },

  saveUserPreferences(userId: string, prefs: UserPreferences): void {
    const key = `shana_prefs_${userId}`;
    safeSetItem(key, prefs);
  },

  // --- DYNAMIC VOICE TRAINING PROGRESS ATTACHMENT ---
  saveVoiceSession(userId: string, session: any): void {
    try {
      const key = `shana_voice_sessions_${userId}`;
      const existing: any[] = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(session);
      localStorage.setItem(key, JSON.stringify(existing));
      window.dispatchEvent(new Event('shana_progress_update'));
    } catch (err) {
      console.warn("Storage save failed:", err);
    }
  },

  getVoiceSessionsCount(userId: string): number {
    try {
      const key = `shana_voice_sessions_${userId}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved).length : 0;
    } catch (e) {
      return 0;
    }
  },

  // --- ADMINISTRATIVE RESET ALL COUNTERS FOR ALL USERS ---
  resetAllUserCounters(): void {
    try {
      const users = this.getUsers();
      users.forEach(user => {
        localStorage.removeItem(`shana_history_${user.id}`);
        localStorage.removeItem(`shana_voice_sessions_${user.id}`);
        localStorage.removeItem(`shana_candidate_monetization_${user.id}`);
      });
      // Broadcast update event to instantly refresh the active dashboard
      window.dispatchEvent(new Event('shana_progress_update'));
    } catch (e) {
      console.error("Failed to reset all user counters:", e);
    }
  },

  // --- CANDIDATE MONETIZATION ENGINE ---
  getCandidateMonetization(userId: string): any {
    const key = `shana_candidate_monetization_${userId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.ultraActive && parsed.ultraExpiresAt) {
          if (new Date(parsed.ultraExpiresAt) < new Date()) {
            parsed.ultraActive = false;
            localStorage.setItem(key, JSON.stringify(parsed));
          }
        }
        return parsed;
      } catch (e) {
        console.error("Error parsing candidate monetization:", e);
      }
    }
    
    // Seed default: 2 FREE AUDIO TRAINING SESSIONS
    const seeded = {
      userId,
      freeAudio: 2,
      packAudio: 0,
      topUpAudio: 0,
      freeMirror: 0,
      packMirror: 0,
      topUpMirror: 0,
      ultraActive: false,
      ultraExpiresAt: null,
      purchases: []
    };
    localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  },

  saveCandidateMonetization(userId: string, data: any): void {
    const key = `shana_candidate_monetization_${userId}`;
    localStorage.setItem(key, JSON.stringify(data));
    try {
      window.dispatchEvent(new Event('shana_progress_update'));
    } catch (e) {}
  },

  consumeCandidateCredit(userId: string, type: 'AUDIO' | 'MIRROR'): { success: boolean; errorEN?: string; errorFR?: string } {
    const monetization = this.getCandidateMonetization(userId);
    
    if (type === 'AUDIO') {
      if (monetization.freeAudio > 0) {
        monetization.freeAudio -= 1;
      } else if (monetization.packAudio > 0) {
        monetization.packAudio -= 1;
      } else if (monetization.topUpAudio > 0) {
        monetization.topUpAudio -= 1;
      } else if (monetization.ultraActive) {
        // Ultra is unlimited, do not deduct
      } else {
        return {
          success: false,
          errorEN: "You have used all your audio sessions. Buy a pack or activate Ultra.",
          errorFR: "Vous avez utilisé toutes vos sessions audio. Achetez un pack ou activez Ultra."
        };
      }
    } else if (type === 'MIRROR') {
      if (monetization.freeMirror > 0) {
        monetization.freeMirror -= 1;
      } else if (monetization.packMirror > 0) {
        monetization.packMirror -= 1;
      } else if (monetization.topUpMirror > 0) {
        monetization.topUpMirror -= 1;
      } else if (monetization.ultraActive) {
        // Ultra is unlimited, do not deduct
      } else {
        return {
          success: false,
          errorEN: "You have used all your mirror assessment sessions. Buy a pack or activate Ultra.",
          errorFR: "Vous avez utilisé toutes vos évaluations miroir. Achetez un pack ou activez Ultra."
        };
      }
    }
    
    this.saveCandidateMonetization(userId, monetization);
    return { success: true };
  },

  addCandidatePurchase(userId: string, productId: string): any {
    const monetization = this.getCandidateMonetization(userId);
    const date = new Date().toISOString();
    const purchaseId = 'pur_' + Math.random().toString(36).substring(3, 11);
    
    let nameEN = '';
    let nameFR = '';
    let price = 0;
    
    if (productId === 'pack_starter') {
      nameEN = 'Starter Pack (3 Audio Sessions)';
      nameFR = 'Pack Starter (3 Sessions Audio)';
      price = 3.99;
      monetization.packAudio += 3;
    } else if (productId === 'pack_premium') {
      nameEN = 'Premium Pack (5 Audio + 1 Mirror)';
      nameFR = 'Pack Premium (5 Audio + 1 Miroir)';
      price = 7.99;
      monetization.packAudio += 5;
      monetization.packMirror += 1;
    } else if (productId === 'sub_ultra') {
      nameEN = 'Ultra Subscription (1 Month)';
      nameFR = 'Abonnement Ultra (1 Mois)';
      price = 39.99;
      monetization.ultraActive = true;
      
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + 30);
      monetization.ultraExpiresAt = endsAt.toISOString();
    } else if (productId === 'topup_1_audio') {
      nameEN = '+1 Audio Session';
      nameFR = '+1 Session Audio';
      price = 1.49;
      monetization.topUpAudio += 1;
    } else if (productId === 'topup_3_audio') {
      nameEN = '+3 Audio Sessions';
      nameFR = '+3 Sessions Audio';
      price = 3.49;
      monetization.topUpAudio += 3;
    } else if (productId === 'topup_1_mirror') {
      nameEN = '+1 Mirror Session';
      nameFR = '+1 Session Miroir';
      price = 2.99;
      monetization.topUpMirror += 1;
    } else {
      throw new Error(`Unknown product: ${productId}`);
    }
    
    monetization.purchases.unshift({
      id: purchaseId,
      productId,
      nameEN,
      nameFR,
      price,
      date
    });
    
    this.saveCandidateMonetization(userId, monetization);
    return monetization;
  }
};
