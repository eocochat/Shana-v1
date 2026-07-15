import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { ConfigResolver } from "../../services/secrets/ConfigResolver.js";
import { ProviderMonitor } from "../../services/monitoring/ProviderMonitor.js";
import { AISessionManager, AISessionState } from "./AISessionManager.js";

export interface AICompletionParams {
  userId?: string;
  sessionId?: string;
  category?: 'greeting' | 'basic_question' | 'followup_question' | 'behavioral_reasoning' | 'deep_coaching' | 'premium_evaluation' | 'detailed_report' | 'audio_interview' | 'mirror_interview' | string;
  contents: any; // prompt string, or systemInstruction inside config
  config?: {
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
  };
}

export class AIOrchestrator {
  /**
   * Centralized Entry Point for any OpenAI requests.
   */
  static async generateCompletion(params: AICompletionParams): Promise<{ text: string; modelUsed: string }> {
    const startTime = Date.now();
    const openAIKey = ConfigResolver.getOpenAIKey();
    if (!openAIKey) {
      throw new Error("OpenAI API Key is missing. Please configure it in your environment settings.");
    }

    const { userId, sessionId, category, contents, config } = params;

    // 1. Resolve User Subscription Tier
    const userTier = userId ? await this.getUserTier(userId) : 'free';

    // 2. Select Model based on User Tier & Category & Cost Optimization
    const modelUsed = this.selectModel(userTier, category, contents, config);

    // 3. Build Rich Context (Context Builder)
    const richContextPrompt = await this.buildContext(userId, sessionId, params);

    // 4. Update the active session details
    if (sessionId) {
      await AISessionManager.updateSession(sessionId, {
        userId,
        activeModel: modelUsed,
        conversationState: this.mapCategoryToConversationState(category)
      });
    }

    // Assemble systemInstruction & userPrompt
    let systemInstruction = config?.systemInstruction || "You are an elite AI Career Strategy Coach named SHANA.";
    
    // Inject Context Builder details into the system instruction!
    if (richContextPrompt) {
      systemInstruction = `${systemInstruction}\n\n[CONTEXT SYSTEM INFORMATION]\n${richContextPrompt}\n[END CONTEXT SYSTEM INFORMATION]`;
    }

    // Handle response formats
    if (config?.responseMimeType === "application/json" && !systemInstruction.toLowerCase().includes("json")) {
      systemInstruction += "\n\nCRITICAL: Your response must be a valid, well-formed JSON object.";
    }

    // Determine the main user content or messages array
    let apiMessages: any[] = [];
    let userContentLog = "";
    if (Array.isArray(contents) && contents.length > 0 && typeof contents[0] === 'object' && 'role' in contents[0]) {
      apiMessages = [
        { role: "system", content: systemInstruction },
        ...contents
      ];
      userContentLog = JSON.stringify(contents);
    } else {
      let userContent = "";
      if (typeof contents === "string") {
        userContent = contents;
      } else if (contents && Array.isArray(contents.parts)) {
        const textParts = contents.parts.filter((p: any) => p.text).map((p: any) => p.text);
        userContent = textParts.join("\n");
      } else if (contents && typeof contents === "object") {
        userContent = JSON.stringify(contents);
      }
      apiMessages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: userContent }
      ];
      userContentLog = userContent;
    }

    const maxRetries = 3;
    let delay = 1000;
    let retryCount = 0;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AI Orchestrator] Routing ${category || 'general'} request using ${modelUsed} (Attempt ${attempt}/${maxRetries})`);
        
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAIKey}`,
          },
          body: JSON.stringify({
            model: modelUsed,
            messages: apiMessages,
            temperature: config?.temperature ?? 0.3,
            ...(config?.responseMimeType === "application/json" ? { response_format: { type: "json_object" } } : {})
          }),
        });

        const durationMs = Date.now() - startTime;

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI HTTP Error ${response.status}: ${errorText}`);
        }

        const json = await response.json();
        const outputText = json.choices[0].message.content || "";

        // Tokens and Cost estimation
        const promptTokens = json.usage?.prompt_tokens || Math.floor(systemInstruction.length / 4 + userContentLog.length / 4);
        const completionTokens = json.usage?.completion_tokens || Math.floor(outputText.length / 4);
        const totalTokens = promptTokens + completionTokens;

        // GPT-5.5 / GPT-5.5 mini costing
        const costEstimated = this.calculateCost(modelUsed, promptTokens, completionTokens);

        // Track Metrics / AI Observability
        try {
          // Log to existing ProviderMonitor
          ProviderMonitor.trackOpenAIEvent(
            `/api/${category || 'completions'}`,
            modelUsed,
            totalTokens,
            durationMs,
            true,
            {
              feature: category || 'completions',
              responseLength: outputText.length,
              promptTokens,
              completionTokens,
              retryCount: attempt - 1,
              fallbackUsage: attempt > 1,
              fallbackModel: attempt > 1 ? 'gpt-5.5-mini' : undefined
            }
          );
        } catch (e) {
          console.error('[Telemetry] Failed to log AI success event:', e);
        }

        // Save session stats using AISessionManager
        if (sessionId) {
          await AISessionManager.recordUsage(
            sessionId,
            promptTokens,
            completionTokens,
            costEstimated,
            durationMs,
            false
          );
        }

        return {
          text: outputText,
          modelUsed
        };

      } catch (err: any) {
        retryCount++;
        console.warn(`[AI Orchestrator] Attempt ${attempt} failed with error:`, err?.message || String(err));
        
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          // If all attempts failed, try a fallback model (gpt-5.5-mini if it wasn't already used)
          if (modelUsed !== 'gpt-5.5-mini') {
            try {
              console.log(`[AI Orchestrator] Triggering Fallover/Fallback to gpt-5.5-mini...`);
              const fallbackResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${openAIKey}`,
                },
                body: JSON.stringify({
                  model: "gpt-5.5-mini",
                  messages: apiMessages,
                  temperature: config?.temperature ?? 0.3,
                  ...(config?.responseMimeType === "application/json" ? { response_format: { type: "json_object" } } : {})
                }),
              });

              if (fallbackResponse.ok) {
                const jsonFallback = await fallbackResponse.json();
                const outputTextFallback = jsonFallback.choices[0].message.content || "";
                const durationMsFallback = Date.now() - startTime;

                const promptTokens = jsonFallback.usage?.prompt_tokens || 1000;
                const completionTokens = jsonFallback.usage?.completion_tokens || 500;
                const costFallback = this.calculateCost('gpt-5.5-mini', promptTokens, completionTokens);

                ProviderMonitor.trackOpenAIEvent(
                  `/api/${category || 'completions'}`,
                  'gpt-5.5-mini',
                  promptTokens + completionTokens,
                  durationMsFallback,
                  true,
                  {
                    feature: category || 'completions',
                    responseLength: outputTextFallback.length,
                    promptTokens,
                    completionTokens,
                    retryCount,
                    fallbackUsage: true,
                    fallbackModel: 'gpt-5.5-mini'
                  }
                );

                if (sessionId) {
                  await AISessionManager.recordUsage(
                    sessionId,
                    promptTokens,
                    completionTokens,
                    costFallback,
                    durationMsFallback,
                    false
                  );
                }

                return {
                  text: outputTextFallback,
                  modelUsed: "gpt-5.5-mini"
                };
              }
            } catch (fallbackError) {
              console.error("[AI Orchestrator] Fallback to gpt-5.5-mini failed:", fallbackError);
            }
          }

          if (sessionId) {
            await AISessionManager.recordUsage(sessionId, 0, 0, 0, Date.now() - startTime, true);
          }
          throw err;
        }
      }
    }

    throw new Error("AI Orchestrator failed to process request.");
  }

  /**
   * Dynamic model selection heuristic (Cost Optimization + User Subscriptions)
   */
  private static selectModel(userTier: 'free' | 'premium', category?: string, contents?: any, config?: any): string {
    if (!category) {
      // Heuristic fallback based on keywords/length
      const sys = (config?.systemInstruction || "").toLowerCase();
      if (sys.includes("eval") || sys.includes("report") || sys.includes("coaching")) {
        return "gpt-5.5";
      }
      return "gpt-5.5-mini";
    }

    const cat = category.toLowerCase();

    // 1. Simple Operations & Low Latency -> gpt-5.5-mini
    if (
      cat === 'greeting' || 
      cat === 'basic_question' || 
      cat === 'followup_question' ||
      cat === 'voice_interview' ||
      cat === 'audio_interview'
    ) {
      // If Premium User, upgrade followup or audio interviews for supreme fidelity
      if (userTier === 'premium' && (cat === 'followup_question' || cat === 'audio_interview')) {
        return "gpt-5.5";
      }
      return "gpt-5.5-mini";
    }

    // 2. High Rigor & Evaluation & Deep Reasoning -> gpt-5.5
    if (
      cat === 'mirror_interview' ||
      cat === 'premium_evaluation' ||
      cat === 'deep_coaching' ||
      cat === 'detailed_report' ||
      cat === 'behavioral_reasoning' ||
      cat === 'job-description-analysis' ||
      cat === 'relationship-insight'
    ) {
      return "gpt-5.5";
    }

    // Default fallback
    return userTier === 'premium' ? 'gpt-5.5' : 'gpt-5.5-mini';
  }

  /**
   * Get User Tier by querying Firestore
   */
  private static async getUserTier(userId: string): Promise<'free' | 'premium'> {
    try {
      const monetizationRef = doc(db, 'monetization', userId);
      const mSnap = await getDoc(monetizationRef);
      if (mSnap.exists()) {
        const data = mSnap.data();
        let isUltra = data.ultraActive === true;
        if (isUltra && data.ultraExpiresAt) {
          if (new Date(data.ultraExpiresAt).getTime() < Date.now()) {
            isUltra = false;
          }
        }
        if (isUltra || (data.packMirror && data.packMirror > 0) || (data.purchases && data.purchases.length > 0)) {
          return 'premium';
        }
      }
    } catch (e) {
      console.warn("[AIOrchestrator] Error checking user tier, defaulting to free:", e);
    }
    return 'free';
  }

  /**
   * Maps UI category to active session conversation state
   */
  private static mapCategoryToConversationState(category?: string): AISessionState['conversationState'] {
    if (!category) return 'idle';
    const cat = category.toLowerCase();
    if (cat === 'greeting') return 'introduction';
    if (cat === 'basic_question' || cat === 'audio_interview' || cat === 'voice_interview') return 'questioning';
    if (cat === 'followup_question') return 'followup';
    if (cat === 'deep_coaching') return 'coaching';
    if (cat === 'premium_evaluation' || cat === 'detailed_report') return 'completed';
    return 'questioning';
  }

  /**
   * Calculates OpenAI cost estimation based on model used
   */
  private static calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const isMini = model.toLowerCase().includes('mini');
    const inputRate = isMini ? 0.00000015 : 0.000003; // Mini: $0.15/1M, Standard: $3.00/1M
    const outputRate = isMini ? 0.0000006 : 0.000009; // Mini: $0.60/1M, Standard: $9.00/1M
    
    const cost = (promptTokens * inputRate) + (completionTokens * outputRate);
    return parseFloat(cost.toFixed(6));
  }

  /**
   * Context Builder: Assembles full context automatically before every AI request
   */
  private static async buildContext(userId?: string, sessionId?: string, params?: AICompletionParams): Promise<string> {
    let contextParts: string[] = [];

    // 1. Fetch Session Config/Details if sessionId is provided
    let sessionState: AISessionState | null = null;
    if (sessionId && userId) {
      try {
        sessionState = await AISessionManager.getOrCreateSession(sessionId, userId);
      } catch (e) {
        console.warn("[ContextBuilder] Failed to load session details:", e);
      }
    }

    // 2. Fetch User Profile
    let userProfile: any = null;
    if (userId) {
      try {
        const profileRef = doc(db, "profiles", userId);
        const pSnap = await getDoc(profileRef);
        if (pSnap.exists()) {
          userProfile = pSnap.data();
        }
      } catch (e) {
        console.warn("[ContextBuilder] Failed to load user profile:", e);
      }
    }

    // 3. Assemble components
    
    // CV Data
    const cvText = userProfile?.cv_text || userProfile?.cv_data?.text || sessionState?.candidateCv || "";
    if (cvText) {
      contextParts.push(`- Candidate CV: ${cvText.substring(0, 1500)}`);
    }

    // Target Role & Experience Level
    const targetRole = userProfile?.target_role || userProfile?.targetRole || (sessionState as any)?.targetRole || "Software Engineer";
    const experienceLevel = userProfile?.experience_level || "3";
    contextParts.push(`- Target Role: ${targetRole}`);
    contextParts.push(`- Experience Level: ${experienceLevel} years`);

    // Job Description & Company Info
    const jobDescription = sessionState?.jobDescription || userProfile?.jobDescription || "";
    if (jobDescription) {
      contextParts.push(`- Job Description: ${jobDescription.substring(0, 1000)}`);
    }
    const companyInfo = sessionState?.companyInfo || "";
    if (companyInfo) {
      contextParts.push(`- Company Info: ${companyInfo.substring(0, 500)}`);
    }

    // Previous Interview History & Scores
    if (userId) {
      try {
        const scoresRef = collection(db, "scores");
        const q = query(scoresRef, where("userId", "==", userId), orderBy("timestamp", "desc"), limit(3));
        const sSnap = await getDocs(q);
        const prevScores: any[] = [];
        sSnap.forEach(d => prevScores.push(d.data()?.ipsScore || d.data()?.score));
        if (prevScores.length > 0) {
          contextParts.push(`- Previous Scores: ${prevScores.join(", ")}`);
        }
      } catch (e) {
        // Suppress order-by errors if index is missing
      }
    }

    // Conversation Memory & Objectives
    const objectives = sessionState?.interviewObjectives || "Evaluate core competencies and situational fit.";
    contextParts.push(`- Interview Objectives: ${objectives}`);

    const progress = sessionState?.interviewProgress || 0;
    contextParts.push(`- Interview Progress: ${progress}% completed`);

    const difficulty = sessionState?.difficulty || "medium";
    contextParts.push(`- Interview Difficulty: ${difficulty}`);

    // Recruiter Personality
    if (sessionState?.currentRecruiterPersona) {
      const persona = sessionState.currentRecruiterPersona;
      contextParts.push(`- Recruiter Persona: ${persona.name} (${persona.personality} style, tone: ${persona.tone})`);
    }

    // If context was constructed, return it styled elegantly
    if (contextParts.length > 0) {
      return `AUTOMATICALLY CONSTRUCTED INTERVIEW CONTEXT:\n${contextParts.join("\n")}`;
    }

    return "";
  }
}
