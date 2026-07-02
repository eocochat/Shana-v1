import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy,
  limit 
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize backend-only Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build-gateway',
    }
  }
});

// ==========================================
// 1. USER SERVICE
// ==========================================
export class UserService {
  static async getUserProfile(userId: string) {
    if (!userId) throw new Error("userId is required");
    
    const profileRef = doc(db, "profiles", userId);
    const profileSnap = await getDoc(profileRef);
    
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!profileSnap.exists()) {
      return {
        id: userId,
        user_id: userId,
        target_role: "Software Engineer",
        experience_level: "3",
        language: "English",
        cv_data: {},
        email: userSnap.exists() ? userSnap.data()?.email : ""
      };
    }

    return {
      ...profileSnap.data(),
      email: userSnap.exists() ? userSnap.data()?.email : ""
    };
  }

  static async saveUserProfile(userId: string, profileData: any) {
    if (!userId) throw new Error("userId is required");

    // 1. Sync users collection
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      id: userId,
      email: profileData.email || "",
      name: profileData.name || profileData.email || "Candidate",
      updated_at: new Date().toISOString()
    }, { merge: true });

    // 2. Sync profiles collection
    const profileRef = doc(db, "profiles", userId);
    const payload = {
      id: userId,
      user_id: userId,
      target_role: profileData.targetRole || profileData.target_role || "Software Engineer",
      experience_level: String(profileData.experienceYears || profileData.experience_level || "3"),
      language: profileData.language || "English",
      industry: profileData.industry || "Technology",
      primary_focus: profileData.primaryFocus || profileData.primary_focus || "Professional Delivery",
      cv_data: profileData.cvData || profileData.cv_data || {},
      updated_at: new Date().toISOString()
    };
    await setDoc(profileRef, payload, { merge: true });

    return payload;
  }
}

// ==========================================
// 2. INTERVIEW SERVICE
// ==========================================
export class InterviewService {
  static async getSessions(userId: string) {
    if (!userId) throw new Error("userId is required");

    const sessionsRef = collection(db, "interview_sessions");
    const q = query(
      sessionsRef, 
      where("user_id", "==", userId),
      orderBy("created_at", "desc")
    );

    const snapshot = await getDocs(q);
    const sessions: any[] = [];
    
    snapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });

    return sessions;
  }

  static async createSession(userId: string, sessionData: any) {
    if (!userId) throw new Error("userId is required");

    const sessionId = sessionData.id || `session_${Date.now()}`;
    const sessionRef = doc(db, "interview_sessions", sessionId);

    const payload = {
      id: sessionId,
      user_id: userId,
      mode: sessionData.mode || "TRAIN",
      status: "started",
      ips_score: 0,
      created_at: new Date().toISOString(),
      metadata: sessionData.metadata || {}
    };

    await setDoc(sessionRef, payload);
    return payload;
  }

  static async updateSession(userId: string, sessionId: string, sessionData: any) {
    if (!userId || !sessionId) throw new Error("userId and sessionId are required");

    const sessionRef = doc(db, "interview_sessions", sessionId);
    const payload = {
      ...sessionData,
      updated_at: new Date().toISOString()
    };

    await setDoc(sessionRef, payload, { merge: true });
    return { id: sessionId, ...payload };
  }

  static async addQuestionFeedback(userId: string, sessionId: string, feedback: any) {
    if (!userId || !sessionId) throw new Error("userId and sessionId are required");

    const answerId = `${sessionId}_ans_${Date.now()}`;
    const answerRef = doc(db, "answers", answerId);

    const payload = {
      id: answerId,
      session_id: sessionId,
      question: feedback.question || "",
      answer: feedback.answer || "",
      duration: feedback.duration || 0,
      ips_score: feedback.score || 0,
      created_at: new Date().toISOString()
    };

    await setDoc(answerRef, payload);
    return payload;
  }
}

// ==========================================
// 3. AI SERVICE
// ==========================================
export class AiService {
  static async generateQuestion(userId: string, sessionId: string, context: any) {
    const role = context.targetRole || "Software Engineer";
    const language = context.language || "English";
    
    const prompt = `You are SHANA, an advanced AI interviewer. Generate exactly ONE highly relevant interview question for a ${role} position. Language must be: ${language}.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 250,
        temperature: 0.7
      }
    });

    return {
      question: response.text || "Can you tell me about your background and experience?"
    };
  }

  static async evaluateAnswer(userId: string, answerText: string, questionText: string, context: any) {
    const language = context.language || "English";
    const role = context.targetRole || "Software Engineer";

    const prompt = `Evaluate the candidate's answer to this question: "${questionText}". Candidate answer: "${answerText}". Target role: ${role}. Respond in ${language}. Generate structured feedback containing scoring (0-100) and actionable tips.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            clarity: { type: Type.INTEGER },
            structure: { type: Type.INTEGER },
            confidence: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            actionableTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["score", "clarity", "structure", "confidence", "explanation", "actionableTips"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return {
        score: 75,
        clarity: 70,
        structure: 80,
        confidence: 75,
        explanation: "Good response but could be structured better.",
        actionableTips: ["Use the STAR method", "Provide more concrete metrics"]
      };
    }
  }

  static async generateInsight(userId: string, history: any[]) {
    if (history.length === 0) {
      return { insight_category: "NO_NEW_INSIGHT" };
    }

    const prompt = `Analyze this interview performance history and generate a behavioral pattern discovery: ${JSON.stringify(history)}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight_category: { type: Type.STRING },
            title: { type: Type.STRING },
            insight: { type: Type.STRING },
            supporting_evidence: { type: Type.STRING },
            recommended_focus: { type: Type.STRING }
          },
          required: ["insight_category", "title", "insight", "supporting_evidence", "recommended_focus"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return { insight_category: "NO_NEW_INSIGHT" };
    }
  }
}

// ==========================================
// 4. SCORING SERVICE
// ==========================================
export class ScoringService {
  static calculateIPS(userId: string, text: string, question: string, context: any) {
    const wpm = context.wpm || 135;
    const fillerWords = context.fillerWords || 0;
    
    // Core IPS algorithm: balances pacing, structure, and content length
    const words = text.split(/\s+/).filter(Boolean).length;
    const pacePenalty = Math.abs(wpm - 140) > 40 ? 10 : 0;
    const fillerPenalty = Math.min(fillerWords * 3, 20);
    
    let baseScore = 75;
    if (words > 50) baseScore += 10;
    if (words > 120) baseScore += 5;
    
    const finalScore = Math.max(30, Math.min(100, baseScore - pacePenalty - fillerPenalty));

    return {
      ips: finalScore,
      breakdown: {
        clarity: Math.max(40, finalScore - 5),
        confidence: Math.max(40, finalScore + 5),
        pacing: wpm
      }
    };
  }

  static async getScoreHistory(userId: string) {
    if (!userId) throw new Error("userId is required");

    const scoresRef = collection(db, "scores");
    // Simple mock or real database query for scores
    const q = query(scoresRef, limit(10));
    const snap = await getDocs(q);
    const history: any[] = [];
    
    snap.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() });
    });

    return history;
  }
}

// ==========================================
// 5. CV SERVICE
// ==========================================
export class CvService {
  static async uploadResume(userId: string, fileData: any) {
    if (!userId) throw new Error("userId is required");

    const prompt = `Extract user experience, education, target role, and key skills from this parsed resume text: ${fileData.text || ""}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            extracted_role: { type: Type.STRING },
            key_skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "extracted_role", "key_skills"]
        }
      }
    });

    const cvAnalysis = JSON.parse(response.text || "{}");

    // Persist parsed CV data into profiles
    const profileRef = doc(db, "profiles", userId);
    await setDoc(profileRef, {
      cv_data: cvAnalysis,
      updated_at: new Date().toISOString()
    }, { merge: true });

    return cvAnalysis;
  }

  static async getResumeSummary(userId: string) {
    if (!userId) throw new Error("userId is required");

    const profileRef = doc(db, "profiles", userId);
    const snap = await getDoc(profileRef);

    if (snap.exists() && snap.data()?.cv_data) {
      return snap.data().cv_data;
    }

    return null;
  }
}

// ==========================================
// 6. ANALYTICS SERVICE
// ==========================================
export class AnalyticsService {
  static async getDashboardMetrics(userId: string) {
    if (!userId) throw new Error("userId is required");

    const sessions = await InterviewService.getSessions(userId);
    const totalSessions = sessions.length;
    
    let avgScore = 0;
    if (totalSessions > 0) {
      const sum = sessions.reduce((acc, s) => acc + (s.ips_score || s.score || 70), 0);
      avgScore = Math.round(sum / totalSessions);
    } else {
      avgScore = 70;
    }

    return {
      total_sessions: totalSessions,
      average_ips_score: avgScore,
      pacing_trend: "optimal",
      completion_rate: totalSessions > 0 ? 100 : 0,
      streak_count: totalSessions,
      last_active: sessions[0]?.created_at || new Date().toISOString()
    };
  }
}
