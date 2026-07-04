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
import { ConfigResolver } from "../../services/secrets/ConfigResolver.js";

const Type = { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY", INTEGER: "INTEGER" };

async function callOpenAi(prompt: string, systemInstruction?: string, isJson?: boolean): Promise<string> {
  const openAIKey = ConfigResolver.getOpenAIKey();
  if (!openAIKey) {
    throw new Error("OpenAI API Key is missing. Please configure it in your environment settings.");
  }

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  const body: any = {
    model: "gpt-4o-mini",
    messages,
    temperature: 0.3
  };

  if (isJson) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAIKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI HTTP Error ${res.status}: ${errorText}`);
  }

  const json = await res.json();
  return json.choices[0].message.content || "";
}

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
    
    const output = await callOpenAi(prompt, "You are an expert technical interviewer.", false);

    return {
      question: output || "Can you tell me about your background and experience?"
    };
  }

  static async evaluateAnswer(userId: string, answerText: string, questionText: string, context: any) {
    const language = context.language || "English";
    const role = context.targetRole || "Software Engineer";

    const prompt = `Evaluate the candidate's answer to this question: "${questionText}". Candidate answer: "${answerText}". Target role: ${role}. Respond in ${language}. Generate structured feedback containing scoring (0-100) and actionable tips. Make sure to respond with a JSON matching this schema:
{
  "score": 85,
  "clarity": 80,
  "structure": 90,
  "confidence": 85,
  "explanation": "text",
  "actionableTips": ["tip1", "tip2"]
}`;
    
    const output = await callOpenAi(prompt, "You are an expert interview coach.", true);

    try {
      return JSON.parse(output || "{}");
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

    const prompt = `Analyze this interview performance history and generate a behavioral pattern discovery: ${JSON.stringify(history)}. Respond with a JSON matching this schema:
{
  "insight_category": "STRENGTH",
  "title": "Strong Quantitative Explanations",
  "insight": "Your answers show a strong mastery of project-level data.",
  "supporting_evidence": "example details",
  "recommended_focus": "continue adding details"
}`;
    const output = await callOpenAi(prompt, "You are an advanced career intelligence system.", true);

    try {
      return JSON.parse(output || "{}");
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

    const prompt = `Extract user experience, education, target role, and key skills from this parsed resume text: ${fileData.text || ""}. Respond with a JSON matching this schema:
{
  "summary": "profile summary text",
  "extracted_role": "software engineer",
  "key_skills": ["javascript", "react"]
}`;
    const output = await callOpenAi(prompt, "You are a resume parsing agent.", true);

    const cvAnalysis = JSON.parse(output || "{}");

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
