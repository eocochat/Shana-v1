import { db, auth } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  writeBatch
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { User, Profile, SessionHistoryItem } from '../types';

export async function ensureFirebaseAuth(email: string, id: string): Promise<void> {
  if (!auth) return;
  if (auth.currentUser && auth.currentUser.email?.toLowerCase() === email.toLowerCase()) {
    return;
  }
  const passwords = JSON.parse(localStorage.getItem('shana_passwords') || '{}');
  const password = passwords[id] || 'DefaultSecurePassword123!';
  
  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
    console.log('[SHANA Firebase] Successfully authenticated to Firebase Auth.');
  } catch (err: any) {
    if (
      err.code === 'auth/user-not-found' || 
      err.code === 'auth/invalid-credential' || 
      err.code === 'auth/invalid-email' || 
      err.code === 'auth/wrong-password' ||
      err.message?.includes('user-not-found') ||
      err.message?.includes('invalid-credential')
    ) {
      try {
        await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
        console.log('[SHANA Firebase] Successfully registered new account in Firebase Auth.');
      } catch (regErr: any) {
        console.error('[SHANA Firebase] Failed to auto-register Firebase Auth user:', regErr);
      }
    } else {
      console.error('[SHANA Firebase] Firebase Auth auto-login failed:', err);
    }
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  const stringified = JSON.stringify(errInfo);
  console.error('Firestore Error: ', stringified);
  throw new Error(stringified);
}

function isPermissionError(err: unknown): boolean {
  const str = err instanceof Error ? err.message : String(err);
  return str.toLowerCase().includes('permission') || str.toLowerCase().includes('insufficient');
}

function isOfflineError(err: unknown): boolean {
  const str = err instanceof Error ? err.message : String(err);
  const lower = str.toLowerCase();
  return lower.includes('offline') || 
         lower.includes('network') || 
         lower.includes('failed to get document') ||
         lower.includes('could not reach') ||
         lower.includes('unavailable');
}

// Let's create an elegant helper to push operations safely into Firestore
export const DbSyncManager = {
  /**
   * Pushes a local user and their profile to the remote cloud Firestore database.
   */
  async saveUserAndProfile(user: User, profile: Profile, cvData?: any) {
    if (!user || !user.id) return;

    await ensureFirebaseAuth(user.email, user.id);

    try {
      // 1. Create/Update core users collection document
      const userRef = doc(db, 'users', user.id);
      const passwords = JSON.parse(localStorage.getItem('shana_passwords') || '{}');
      const userPassword = passwords[user.id] || '';

      await setDoc(userRef, {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        created_at: user.createdAt || new Date().toISOString(),
        password: userPassword
      }, { merge: true });
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
      }
      if (isOfflineError(err)) {
        console.warn('[SHANA DbSync] User sync skipped (offline-first mode):', err);
      } else {
        console.error('[SHANA DbSync] Failed to sync user to cloud:', err);
      }
    }

    try {
      // 2. Create/Update core profiles collection document
      const profileRef = doc(db, 'profiles', user.id); // Map 1-to-1 document ID
      await setDoc(profileRef, {
        id: user.id,
        user_id: user.id,
        target_role: profile.targetRole || '',
        experience_level: String(profile.experienceYears || '0'),
        language: profile.language || 'English',
        cv_data: cvData || {}
      }, { merge: true });

      console.log(`[SHANA DbSync] User & Profile successfully persisted to cloud for: ${user.id}`);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `profiles/${user.id}`);
      }
      if (isOfflineError(err)) {
        console.warn('[SHANA DbSync] Profile sync skipped (offline-first mode):', err);
      } else {
        console.error('[SHANA DbSync] Failed to sync profile to cloud:', err);
      }
    }
  },

  /**
   * Pushes a completed interview session, its answers, and its evaluations/scores to cloud collections.
   */
  async saveSessionToCloud(userId: string, session: SessionHistoryItem) {
    if (!userId || !session || !session.id) return;

    // Get email
    const usersStr = localStorage.getItem('shana_users') || '[]';
    const users = JSON.parse(usersStr);
    const user = users.find((u: any) => u.id === userId);
    const userEmail = user?.email || '';

    // Auto-authenticate with Firebase Auth
    if (userEmail) {
      await ensureFirebaseAuth(userEmail, userId);
    }

    try {
      // 1. Save core interview_session
      const sessionRef = doc(db, 'interview_sessions', session.id);
      await setDoc(sessionRef, {
        id: session.id,
        user_id: userId,
        user_email: userEmail.toLowerCase().trim(),
        mode: session.type || 'TRAIN',
        status: 'completed',
        ips_score: session.score || 0,
        created_at: session.createdAt || new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `interview_sessions/${session.id}`);
      }
      if (isOfflineError(err)) {
        console.warn('[SHANA DbSync] Session sync skipped (offline-first mode):', err);
      } else {
        console.error('[SHANA DbSync] Failed to sync session to cloud:', err);
      }
    }

    try {
      // 2. Save core scores
      const scoreRef = doc(db, 'scores', session.id); // 1-to-1 session map
      await setDoc(scoreRef, {
        id: session.id,
        session_id: session.id,
        user_id: userId,
        user_email: userEmail.toLowerCase().trim(),
        clarity: session.communicationScore || session.score || 80,
        structure: session.resumeScore || 80,
        confidence: session.confidenceScore || 80,
        relevance: session.industryScore || 80,
        conciseness: 80, // Extensible placeholder
        ips_total: session.score || 0
      }, { merge: true });
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `scores/${session.id}`);
      }
      if (isOfflineError(err)) {
        console.warn('[SHANA DbSync] Scores sync skipped (offline-first mode):', err);
      } else {
        console.error('[SHANA DbSync] Failed to sync scores to cloud:', err);
      }
    }

    // 3. Save individual answers to answers collection
    if (session.questionsFeedback && session.questionsFeedback.length > 0) {
      for (let idx = 0; idx < session.questionsFeedback.length; idx++) {
        const q = session.questionsFeedback[idx];
        const answerId = `${session.id}_ans_${idx}`;
        try {
          const answerRef = doc(db, 'answers', answerId);
          await setDoc(answerRef, {
            id: answerId,
            session_id: session.id,
            user_id: userId,
            user_email: userEmail.toLowerCase().trim(),
            question: q.questionText || '',
            answer: q.keyPositive || 'No recorded response details',
            duration: 120, // default estimation or calculated duration
            ips_score: q.score || 0,
            created_at: session.createdAt || new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          if (isPermissionError(err)) {
            handleFirestoreError(err, OperationType.WRITE, `answers/${answerId}`);
          }
          if (isOfflineError(err)) {
            console.warn('[SHANA DbSync] Answer sync skipped (offline-first mode):', err);
          } else {
            console.error('[SHANA DbSync] Failed to sync answer to cloud:', err);
          }
        }
      }
    }

    console.log(`[SHANA DbSync] Session history item parsed and persisted to cloud: ${session.id}`);
  },

  /**
   * Pushes individual insight/discovery items.
   */
  async saveInsightToCloud(userId: string, discovery: any) {
    if (!userId || !discovery || !discovery.id) return;

    // Get email
    const usersStr = localStorage.getItem('shana_users') || '[]';
    const users = JSON.parse(usersStr);
    const user = users.find((u: any) => u.id === userId);
    const userEmail = user?.email || '';

    // Auto-authenticate with Firebase Auth
    if (userEmail) {
      await ensureFirebaseAuth(userEmail, userId);
    }

    try {
      const insightRef = doc(db, 'insights', discovery.id);
      await setDoc(insightRef, {
        id: discovery.id,
        user_id: userId,
        user_email: userEmail.toLowerCase().trim(),
        session_id: discovery.sessionId || '',
        type: discovery.category || 'discovery',
        content: discovery.text || '',
        confidence_score: discovery.score || 90,
        created_at: discovery.date || new Date().toISOString()
      }, { merge: true });

      console.log(`[SHANA DbSync] Discovery synced as Insight to cloud: ${discovery.id}`);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `insights/${discovery.id}`);
      }
      if (isOfflineError(err)) {
        console.warn('[SHANA DbSync] Insight sync skipped (offline-first mode):', err);
      } else {
        console.error('[SHANA DbSync] Failed to sync insight/discovery to cloud:', err);
      }
    }
  },

  /**
   * Pushes a candidate's monetization data to cloud.
   */
  async saveMonetizationToCloud(userId: string, monetization: any) {
    if (!userId || !monetization) return;

    // Get email
    const usersStr = localStorage.getItem('shana_users') || '[]';
    const users = JSON.parse(usersStr);
    const user = users.find((u: any) => u.id === userId);
    const userEmail = user?.email || '';

    // Auto-authenticate with Firebase Auth
    if (userEmail) {
      await ensureFirebaseAuth(userEmail, userId);
    }

    try {
      const monetizationRef = doc(db, 'monetization', userId);
      await setDoc(monetizationRef, {
        userId,
        user_email: userEmail.toLowerCase().trim(),
        freeAudio: monetization.freeAudio || 0,
        packAudio: monetization.packAudio || 0,
        topUpAudio: monetization.topUpAudio || 0,
        freeMirror: monetization.freeMirror || 0,
        packMirror: monetization.packMirror || 0,
        topUpMirror: monetization.topUpMirror || 0,
        ultraActive: monetization.ultraActive || false,
        ultraExpiresAt: monetization.ultraExpiresAt || null,
        ultraRenewalCancelled: monetization.ultraRenewalCancelled || false,
        frozenCredits: monetization.frozenCredits || null,
        purchases: monetization.purchases || []
      }, { merge: true });

      console.log(`[SHANA DbSync] Monetization data synced to cloud for user: ${userId}`);
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, `monetization/${userId}`);
      }
      if (isOfflineError(err)) {
        console.warn('[SHANA DbSync] Monetization sync skipped (offline-first mode):', err);
      } else {
        console.error('[SHANA DbSync] Failed to sync monetization to cloud:', err);
      }
    }
  },

  /**
   * Synchronizes data FROM cloud down to localStorage for a given userId.
   * This is called on system boot or active user login to ensure the cloud database acts as
   * the single source of truth (permanent memory layer), enabling multi-device sync and soft migration.
   */
  async syncCloudToLocal(userId: string): Promise<boolean> {
    if (!userId) return false;

    // Get email
    const usersStr = localStorage.getItem('shana_users') || '[]';
    const users = JSON.parse(usersStr);
    const user = users.find((u: any) => u.id === userId);
    const userEmail = user?.email || '';

    // Auto-authenticate with Firebase Auth
    if (userEmail) {
      await ensureFirebaseAuth(userEmail, userId);
    }

    try {
      console.log(`[SHANA DbSync] Beginning cloud synchronization for user: ${userId}`);
      let remoteProfile: any = null;

      // 1. Sync User info
      let userSnap;
      try {
        userSnap = await getDoc(doc(db, 'users', userId));
      } catch (err) {
        if (isPermissionError(err)) {
          handleFirestoreError(err, OperationType.GET, `users/${userId}`);
        }
        throw err;
      }
      
      let remoteUser: any = null;
      if (userSnap.exists()) {
        const data = userSnap.data();
        const localUsers = JSON.parse(localStorage.getItem('shana_users') || '[]');
        const idx = localUsers.findIndex((u: any) => u.id === userId);
        
        // Split name into firstName / lastName
        const parts = (data.name || '').split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        remoteUser = {
          id: data.id,
          firstName,
          lastName,
          email: data.email,
          createdAt: data.created_at || new Date().toISOString(),
          role: 'candidate',
          status: 'enabled'
        };

        if (idx !== -1) {
          localUsers[idx] = { ...localUsers[idx], ...remoteUser };
        } else {
          localUsers.push(remoteUser);
        }
        localStorage.setItem('shana_users', JSON.stringify(localUsers));

        if (data.password) {
          const localPasswords = JSON.parse(localStorage.getItem('shana_passwords') || '{}');
          localPasswords[userId] = data.password;
          localStorage.setItem('shana_passwords', JSON.stringify(localPasswords));
        }
      }

      // 2. Sync Profile
      let profileSnap;
      try {
        profileSnap = await getDoc(doc(db, 'profiles', userId));
      } catch (err) {
        if (isPermissionError(err)) {
          handleFirestoreError(err, OperationType.GET, `profiles/${userId}`);
        }
        throw err;
      }
      
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        const localProfiles = JSON.parse(localStorage.getItem('shana_profiles') || '[]');
        const idx = localProfiles.findIndex((p: any) => p.userId === userId);

        remoteProfile = {
          userId: data.user_id,
          targetRole: data.target_role || '',
          experienceYears: data.experience_level || '0',
          industry: '',
          language: data.language || 'English',
          onboardingCompleted: true
        };

        if (idx !== -1) {
          localProfiles[idx] = { ...localProfiles[idx], ...remoteProfile };
        } else {
          localProfiles.push(remoteProfile);
        }
        localStorage.setItem('shana_profiles', JSON.stringify(localProfiles));

        // If remote profile has cv_data, restore as analysis
        if (data.cv_data && Object.keys(data.cv_data).length > 0) {
          const localAnalyses = JSON.parse(localStorage.getItem('shana_analyses') || '[]');
          const aIdx = localAnalyses.findIndex((a: any) => a.userId === userId);
          if (aIdx !== -1) {
            localAnalyses[aIdx] = { ...localAnalyses[aIdx], ...data.cv_data };
          } else {
            localAnalyses.push({ userId, ...data.cv_data });
          }
          localStorage.setItem('shana_analyses', JSON.stringify(localAnalyses));
        }
      }

      // 3. Sync Interview Sessions (History)
      const sessionsQuery = query(
        collection(db, 'interview_sessions'), 
        where('user_email', '==', userEmail.toLowerCase().trim())
      );
      let sessionsSnap;
      try {
        sessionsSnap = await getDocs(sessionsQuery);
      } catch (err) {
        if (isPermissionError(err)) {
          handleFirestoreError(err, OperationType.GET, 'interview_sessions');
        }
        throw err;
      }
      
      if (!sessionsSnap.empty) {
        const sessionsList: any[] = [];
        
        for (const sessionDoc of sessionsSnap.docs) {
          const sData = sessionDoc.data();
          
          // Fetch corresponding scores and answers to reconstruct full history item
          let scoreSnap;
          try {
            scoreSnap = await getDoc(doc(db, 'scores', sData.id));
          } catch (err) {
            if (isPermissionError(err)) {
              handleFirestoreError(err, OperationType.GET, `scores/${sData.id}`);
            }
            throw err;
          }
          
          const answersQuery = query(
            collection(db, 'answers'), 
            where('session_id', '==', sData.id),
            where('user_email', '==', userEmail.toLowerCase().trim())
          );
          let answersSnap;
          try {
            answersSnap = await getDocs(answersQuery);
          } catch (err) {
            if (isPermissionError(err)) {
              handleFirestoreError(err, OperationType.GET, 'answers');
            }
            throw err;
          }

          const qFeedback: any[] = [];
          if (!answersSnap.empty) {
            answersSnap.docs.forEach((ansDoc, index) => {
              const aData = ansDoc.data();
              qFeedback.push({
                phaseLabel: `Question ${index + 1}`,
                questionText: aData.question || '',
                score: aData.ips_score || 0,
                pace: "130 WPM",
                paceRating: "optimal",
                clarity: aData.ips_score || 0,
                keyPositive: aData.answer || '',
                improvementTip: "Practice clear transition statements to maximize impact score."
              });
            });
          }

          const scData = scoreSnap.exists() ? scoreSnap.data() : {};

          sessionsList.push({
            id: sData.id,
            type: sData.mode || 'TRAIN',
            date: new Date(sData.created_at).toLocaleDateString(),
            score: sData.ips_score || 0,
            weakness: "Completed session verified via Firestore cloud ledger.",
            recommendation: "Focus on structured bullet points to increase delivery scores.",
            language: remoteProfile?.language === 'French' ? 'FR' : 'EN',
            duration: "15 min",
            resumeScore: scData.structure || 80,
            industryScore: scData.relevance || 80,
            communicationScore: scData.clarity || 80,
            adaptabilityScore: scData.confidence || 80,
            confidenceScore: scData.confidence || 80,
            behavioralScore: scData.structure || 80,
            strengths: ["Clear voice posture", "Cohesive answers"],
            questionsFeedback: qFeedback,
            createdAt: sData.created_at
          });
        }

        // Sort descending
        sessionsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        localStorage.setItem(`shana_history_${userId}`, JSON.stringify(sessionsList));
      }

      // 4. Sync Insights/Discoveries
      const insightsQuery = query(
        collection(db, 'insights'), 
        where('user_email', '==', userEmail.toLowerCase().trim())
      );
      let insightsSnap;
      try {
        insightsSnap = await getDocs(insightsQuery);
      } catch (err) {
        if (isPermissionError(err)) {
          handleFirestoreError(err, OperationType.GET, 'insights');
        }
        throw err;
      }
      
      if (!insightsSnap.empty) {
        const insightsList = insightsSnap.docs.map(docSnap => {
          const iData = docSnap.data();
          return {
            id: iData.id,
            date: new Date(iData.created_at).toLocaleDateString(),
            text: iData.content || '',
            category: iData.type || 'discovery',
            exerciseName: "Mirror Assessment",
            score: iData.confidence_score || 90,
            favorited: false,
            archived: false,
            explanation: "Insight retrieved from secure Firestore truth layer."
          };
        });
        localStorage.setItem(`shana_discoveries_${userId}`, JSON.stringify(insightsList));
      }

      // 5. Sync Monetization
      let monetizationSnap;
      try {
        monetizationSnap = await getDoc(doc(db, 'monetization', userId));
      } catch (err) {
        if (isPermissionError(err)) {
          handleFirestoreError(err, OperationType.GET, `monetization/${userId}`);
        }
        throw err;
      }

      if (monetizationSnap.exists()) {
        const mData = monetizationSnap.data();
        const key = `shana_candidate_monetization_${userId}`;
        const localMonetization = {
          userId: mData.userId,
          freeAudio: mData.freeAudio || 0,
          packAudio: mData.packAudio || 0,
          topUpAudio: mData.topUpAudio || 0,
          freeMirror: mData.freeMirror || 0,
          packMirror: mData.packMirror || 0,
          topUpMirror: mData.topUpMirror || 0,
          ultraActive: mData.ultraActive || false,
          ultraExpiresAt: mData.ultraExpiresAt || null,
          ultraRenewalCancelled: mData.ultraRenewalCancelled || false,
          frozenCredits: mData.frozenCredits || null,
          purchases: mData.purchases || []
        };
        localStorage.setItem(key, JSON.stringify(localMonetization));
      }

      // Dispatch event to instantly trigger UI rendering across all components
      window.dispatchEvent(new Event('shana_progress_update'));
      window.dispatchEvent(new Event('shana_serendipity_update'));
      window.dispatchEvent(new Event('shana_failed_payments_updated'));
      console.log(`[SHANA DbSync] Cloud sync complete! Locally loaded ${sessionsSnap?.size || 0} sessions.`);
      return true;
    } catch (err) {
      if (isOfflineError(err)) {
        console.warn('[SHANA DbSync] Cloud-to-local sync skipped (operating in offline-first mode):', err);
      } else {
        console.error('[SHANA DbSync] Error during cloud-to-local sync:', err);
      }
      return false;
    }
  },

  /**
   * Queries Firestore by email and triggers a cloud-to-local sync for that user if found.
   */
  async syncUserByEmail(email: string): Promise<string | null> {
    if (!email) return null;
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userDoc = snap.docs[0];
        const userId = userDoc.id;
        console.log(`[SHANA DbSync] Found user in cloud with ID: ${userId}, triggering sync...`);
        await this.syncCloudToLocal(userId);
        return userId;
      }
    } catch (err) {
      console.error('[SHANA DbSync] Failed to sync user by email:', err);
    }
    return null;
  }
};
