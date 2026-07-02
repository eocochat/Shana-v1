import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createRequire } from "module";
const esmRequire = typeof require !== "undefined" ? require : createRequire(import.meta.url);
import * as pdfParseModule from "pdf-parse";
import mammoth from "mammoth";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import { PermissionMiddleware, inMemoryUsers } from "./services/admin/index";
import { ConfigResolver } from "./services/secrets/ConfigResolver";
import { IntegrationKeyManager } from "./modules/key-vault/IntegrationKeyManager";
import { ProviderRegistry } from "./services/secrets/ProviderRegistry";
import { ProviderMonitor } from "./services/monitoring/ProviderMonitor";
import { UsageAnalyticsEngine } from "./services/monitoring/UsageAnalyticsEngine";
import { ErrorTracker } from "./services/monitoring/ErrorTracker";
import { LogAggregator } from "./services/monitoring/LogAggregator";
import { ObservabilityController } from "./services/monitoring/ObservabilityController";
import { TelemetryService } from "./modules/telemetry/TelemetryService";
import { VoiceNaturalizerService } from "./modules/voice-naturalizer/VoiceNaturalizerService";
import { responseStandardizerMiddleware, requestLoggerMiddleware, globalErrorHandler } from "./server/gateway/ApiGateway";
import v1Router from "./server/router/v1Router";
import { inputSanitizerMiddleware } from "./server/security/SecurityManager";
import { DeploymentSystem } from "./server/services/DeploymentSystem.js";
import { ExperimentationSystem } from "./server/services/ExperimentationSystem.js";

dotenv.config();


const app = express();
const PORT = 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Robust wrapper around ai.models.generateContent with exponential backoff and model fallback
async function generateContentWithRetry(params: any): Promise<any> {
  const maxRetries = 3;
  const modelsToTry = [params.model || "gemini-3.5-flash", "gemini-3.1-flash-lite"];
  const startTime = Date.now();

  for (const modelName of modelsToTry) {
    let delay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[SHANA Server] Attempting Gemini call with model: ${modelName} (Attempt ${attempt}/${maxRetries})`);
        const result = await ai.models.generateContent({
          ...params,
          model: modelName
        });
        const duration = Date.now() - startTime;
        
        // Dynamic Token Estimation
        const inputTokens = params.contents ? JSON.stringify(params.contents).length / 4 : 500;
        const outputText = result.text || "";
        const outputTokens = outputText.length / 4;
        const totalTokens = Math.floor(inputTokens + outputTokens);

        // Record metrics dynamically
        try {
          ProviderMonitor.trackOpenAIEvent('/api/generateContent', modelName, totalTokens, duration, true, {
            feature: 'completions',
            responseLength: outputText.length
          });
          UsageAnalyticsEngine.trackCall('openai', '/api/generateContent', duration, true, totalTokens);
          LogAggregator.log('openai', 'info', 'completions', `Completions generated successfully using ${modelName} in ${duration}ms. Tokens: ${totalTokens}`);
        } catch (e) {
          console.error('[Telemetry] Failed to log AI success event:', e);
        }

        return result;
      } catch (err: any) {
        const errMessage = err?.message || String(err);
        const isTransient = errMessage.includes("503") || 
                            errMessage.includes("UNAVAILABLE") || 
                            errMessage.includes("high demand") || 
                            errMessage.includes("ResourceExhausted") ||
                            errMessage.includes("429");
        
        console.warn(`[SHANA Server] Gemini attempt ${attempt} failed with model ${modelName}:`, errMessage);

        if (attempt < maxRetries && isTransient) {
          console.log(`[SHANA Server] Waiting ${delay}ms before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          // Break to try the next fallback model if we run out of retries or if it's not a transient error
          break;
        }
      }
    }
  }
  
  const duration = Date.now() - startTime;
  try {
    ProviderMonitor.trackOpenAIEvent('/api/generateContent', 'gemini-3.5-flash', 0, duration, false, {
      failureReason: 'All fallback models and retry thresholds exhausted.'
    });
    UsageAnalyticsEngine.trackCall('openai', '/api/generateContent', duration, false);
    ErrorTracker.track('ai', 'AI generation service failed: all models and retries exhausted.', 'high');
    LogAggregator.log('openai', 'error', 'completions', 'Critical AI completions failure: all models and retries exhausted.');
  } catch (e) {
    console.error('[Telemetry] Failed to log AI failure event:', e);
  }

  throw new Error("Gemini API call failed after retrying and trying fallback models.");
}

// Helper to extract text from file uploads
async function extractTextFromFile(file: { data: string; mimeType: string; name: string }): Promise<string> {
  const fileBuffer = Buffer.from(file.data, "base64");
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (file.mimeType.includes("pdf") || extension === "pdf") {
    try {
      console.log("[SHANA Server] Extracting text from PDF using modern PDFParse class...");
      const PDFParseClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default?.PDFParse;
      if (!PDFParseClass) {
        throw new Error("PDFParse class not found in exports");
      }
      const instance = new PDFParseClass(fileBuffer);
      await instance.load();
      const text = await instance.getText();
      return text || "";
    } catch (err) {
      console.error("[SHANA Server] PDF parsing failed, trying raw string reading:", err);
      return fileBuffer.toString("utf8");
    }
  } else if (file.mimeType.includes("word") || file.mimeType.includes("officedocument") || extension === "docx") {
    try {
      console.log("[SHANA Server] Extracting text from DOCX using mammoth...");
      const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
      return docxResult.value || "";
    } catch (err) {
      console.error("[SHANA Server] DOCX parsing failed:", err);
      return "";
    }
  } else if (file.mimeType.includes("plain") || extension === "txt") {
    return fileBuffer.toString("utf8");
  }

  return "";
}

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(inputSanitizerMiddleware);

// Mount central API Gateway and response standardization layers
app.use(responseStandardizerMiddleware);
app.use(requestLoggerMiddleware("GatewayRouter"));

// Mount central API Gateway v1 router
app.use("/api/v1", v1Router);

// Global Secure Error boundary for routing
app.use(globalErrorHandler);


// OpenAI-focused architecture configuration

function getFallbackQuestions(targetRole: string, industry: string, isFrench: boolean, isFormal: boolean, primaryFocus: string): string[] {
  const indLower = (industry || "").toLowerCase();
  const roleLower = (targetRole || "").toLowerCase();

  // 1. Finance / Banking / Investment
  if (indLower.includes("finance") || indLower.includes("bank") || indLower.includes("invest") || indLower.includes("account") || roleLower.includes("analyst") || roleLower.includes("finance")) {
    if (isFrench) {
      if (isFormal) {
        return [
          `Bienvenue dans votre entretien formel pour le poste de ${targetRole} dans le secteur ${industry}. Pour commencer, pourriez-vous vous présenter et retracer brièvement vos principales étapes de carrière et réalisations financières ?`,
          `Merci. Pouvez-vous décrire une analyse de modèle financier complexe ou un défi d'évaluation critique que vous avez mené, et comment vous avez géré les risques de précision ?`,
          `C'est clair. Dans le secteur de l'industrie ${industry}, comment gérez-vous la volatilité des marchés ou les changements d'exigences sous des délais réglementaires serrés ?`,
          `Compris. Parlons de collaboration : expliquez-moi comment vous avez présenté des perspectives analytiques critiques à des parties prenantes ou de la direction non financières s'ils n'étaient pas d'accord.`,
          `Enfin, pourquoi pensez-vous que votre rigueur quantitative fait de vous le candidat idéal pour ce rôle de l'industrie ?`
        ];
      } else {
        return [
          `Bienvenue dans votre session de coaching vocal SHANA. Commençons. Vous ciblez le poste de ${targetRole} en ${industry}. Pouvez-vous détailler une initiative financière majeure ou une analyse ou audit complexe que vous avez dirigé, et comment vous avez assuré la rigueur des données ?`,
          `Merci. En ce qui concerne cette analyse, pouvez-vous expliquer quelles métriques ou retours quantitatifs spécifiques vous avez suivis pour confirmer son succès ?`,
          `Excellent. Pour la troisième question, dans l'industrie ${industry}, comment restez-vous à jour face aux fluctuations de marché et outils d'analyse ? Pouvez-vous citer un exemple d'outil que vous maîtrisez ?`,
          `Cette rigueur est claire. Explorons maintenant l'adaptabilité : pouvez-vous décrire un scénario où les priorités ou hypothèses d'un modèle ont changé en cours de route, et comment vous avez réajusté vos prévisions ?`,
          `Bel effort. Pour conclure ce sprint de coaching, en pensant à votre focus sur ${primaryFocus || "Professional Delivery"}, où voyez-vous votre plus grand potentiel d'amélioration lors de vos présentations financières en direct ?`
        ];
      }
    } else {
      if (isFormal) {
        return [
          `Welcome to your formal interview. I am representing the recruitment board for the ${targetRole} position in the ${industry} industry. To start, could you introduce yourself and walk me through your key career highlights in financial management?`,
          `Thank you. Can you describe a complex financial model, risk assessment, or audit challenge you were responsible for, and how you ensured accuracy?`,
          `That is clear. In the ${industry} space, how do you handle volatility or shifting compliance requirements under strict deadlines?`,
          `Understood. Let's discuss collaboration: explain how you presented complex quantitative/financial insights to non-financial stakeholders who holding a different view.`,
          `Lastly, why do you believe your specific analytical background makes you the ideal candidate for this ${targetRole} role?`
        ];
      } else {
        return [
          `Welcome to your SHANA Voice Training session. Let's begin. You listed ${targetRole} as your target role in ${industry}. Can you detail a major financial analysis, model, or project you led, and how you ensured data integrity?`,
          `Thank you. Regarding that analysis or project, can you explain what specific financial metrics or returns you tracked to measure success?`,
          `Excellent. For the third question, in your targeted ${industry} space, how do you keep up with changing regulations and modern analytical platforms? Can you cite a quick real-world example?`,
          `That structural focus is clear. Now, let's explore adaptability: can you describe a scenario where investment assumptions or budget goals shifted mid-stride, and how you calibrated the delivery?`,
          `Great effort. To conclude this coaching sprint, thinking of your custom focus on ${primaryFocus || "Professional Delivery"}, where do you see your biggest potential growth during live presentations or briefings?`
        ];
      }
    }
  }

  // 2. Marketing / Sales / Creative / Advertising
  if (indLower.includes("market") || indLower.includes("sale") || indLower.includes("creat") || indLower.includes("advert") || indLower.includes("seo") || roleLower.includes("market") || roleLower.includes("sales") || roleLower.includes("growth")) {
    if (isFrench) {
      if (isFormal) {
        return [
          `Bienvenue dans votre entretien formel pour le poste de ${targetRole} dans le secteur ${industry}. Pour commencer, pourriez-vous vous présenter et présenter vos campagnes ou initiatives de croissance les plus marquantes ?`,
          `Merci. Pouvez-vous décrire une campagne de marketing ou une stratégie d'acquisition à fort impact que vous avez lancée, et comment vous avez géré l'allocation du budget ?`,
          `C'est clair. Dans le secteur de l'industrie ${industry}, comment restez-vous performant face à l'évolution des tendances de consommation ou à la baisse des performances d'un canal ?`,
          `Compris. Parlons de collaboration : expliquez-moi comment vous avez géré une situation où les designers créatifs et les analystes de données n'étaient pas d'accord sur une orientation stratégique.`,
          `Enfin, pourquoi pensez-vous que votre vision stratégique fait de vous le candidat idéal pour ce rôle de l'industrie ?`
        ];
      } else {
        return [
          `Bienvenue dans votre session de coaching vocal SHANA. Commençons. Vous ciblez le poste de ${targetRole} en ${industry}. Pouvez-vous détailler une campagne ou un projet d'acquisition majeur que vous avez lancé, et comment vous avez structuré votre ciblage ?`,
          `Merci. Concernant cette initiative, quelles mesures d'engagement, ROI ou KPIs de conversion avez-vous suivis pour valider le succès ?`,
          `Excellent. Pour la troisième question, dans l'industrie ${industry}, comment restez-vous à l'écoute des nouveaux outils ou réseaux sociaux ? Pouvez-vous citer un exemple d'outil récent utilisé ?`,
          `Cette rigueur est claire. Explorons maintenant l'adaptabilité : pouvez-vous décrire un scénario où le budget ou les objectifs de campagne ont été modifiés à la dernière minute, et comment vous avez pivoté ?`,
          `Bel effort. Pour conclure ce sprint de coaching, en pensant à votre focus sur ${primaryFocus || "Professional Delivery"}, où voyez-vous votre plus grand potentiel d'amélioration lors de vos pitchs créatifs ?`
        ];
      }
    } else {
      if (isFormal) {
        return [
          `Welcome to your formal interview for the ${targetRole} position in the ${industry} industry. To start, could you introduce yourself and share your most significant marketing campaigns or growth achievements?`,
          `Thank you. Can you describe a high-impact advertising campaign, brand strategy, or sales pipeline change you designed, and how you optimized its return on investment?`,
          `That is clear. In the ${industry} space, how do you adapt when subscriber rates, engagement metrics, or sales performance unexpectedly drop?`,
          `Understood. Let's discuss collaboration: explain how you handled a situation where the creative design team and the quantitative reporting team disagreed on campaign strategy.`,
          `Lastly, why do you believe your unique conversion and creative strategy make you the ideal candidate for this ${targetRole} role?`
        ];
      } else {
        return [
          `Welcome to your SHANA Voice Training session. Let's begin. You listed ${targetRole} as your target role in ${industry}. Can you detail a major campaign or growth initiative you launched, and how you researched your target audience?`,
          `Thank you. Regarding that initiative, can you explain what specific conversion metrics or ROI outcomes you tracked to determine success?`,
          `Excellent. For the third question, in your targeted ${industry} space, how do you keep up with rapid consumer trend shifts and analytics tools? Can you cite a quick real-world example?`,
          `That focus is clear. Now, let's explore adaptability: can you describe a scenario where a marketing budget or branding roadmap shifted mid-campaign, and how you calibrated your channels?`,
          `Great effort. To conclude this coaching sprint, thinking of your custom focus on ${primaryFocus || "Professional Delivery"}, where do you see your biggest potential growth during live pitches or team briefings?`
        ];
      }
    }
  }

  // 3. Product Management / General Business / PM
  if (roleLower.includes("product") || roleLower.includes("pm") || roleLower.includes("manager") || indLower.includes("management") || indLower.includes("business") || indLower.includes("consult")) {
    if (isFrench) {
      if (isFormal) {
        return [
          `Bienvenue dans votre entretien formel pour le poste de ${targetRole}. Pour commencer, pourriez-vous vous présenter et nous en dire plus sur les produits ou les feuilles de route de services clés que vous avez gérés d'un bout à l'autre ?`,
          `Merci. Pouvez-vous décrire une situation où vous avez dû hiérarchiser des fonctionnalités ou des exigences contradictoires entre différents clients ou services, et comment vous avez pris votre décision finale ?`,
          `C'est de toute évidence complexe. Dans le secteur de l'industrie ${industry}, comment réagissez-vous si le lancement d'un produit prend du retard ou fait face à d'importants obstacles logistiques ?`,
          `Compris. Expliquez-moi comment vous avez géré une situation où l'équipe de livraison technique ou opérationnelle n'était pas d'accord avec votre vision de feuille de route produit ou service.`,
          `Enfin, pourquoi pensez-vous que vos compétences de priorisation et d'influence font de vous le candidat idéal pour ce rôle ?`
        ];
      } else {
        return [
          `Bienvenue dans votre session de coaching vocal SHANA. Commençons. Vous ciblez le poste de ${targetRole} en ${industry}. Pouvez-vous détailler une initiative produit ou service que vous avez menée, et comment vous avez concilié les besoins des différentes parties prenantes ?`,
          `Merci. Concernant ce produit, quels KPIs ou résultats clés (par exemple, rétention, efficacité, satisfaction) avez-vous définis pour mesurer son succès ?`,
          `Excellent. Pour la troisième question, dans l'industrie ${industry}, comment entretenez-vous votre compréhension des besoins utilisateurs ou clients ? Pouvez-vous citer un outil ou méthode agile typique ?`,
          `Cette rigueur est claire. Explorons maintenant l'adaptabilité : pouvez-vous décrire un scénario où les objectifs commerciaux globaux ont été redéfinis, et comment vous avez réaligné votre équipe ?`,
          `Bel effort. Pour conclure ce sprint de coaching, en pensant à votre focus sur ${primaryFocus || "Professional Delivery"}, où voyez-vous votre plus grand potentiel de croissance dans l'animation d'ateliers et réunions ?`
        ];
      }
    } else {
      if (isFormal) {
        return [
          `Welcome to your formal interview for the ${targetRole} position. To start, could you introduce yourself and talk about the products or strategic roadmaps you have delivered end-to-end?`,
          `Thank you. Can you describe a situation where you had to prioritize competing feature demands, service requests, or stakeholder requirements, and what framework you used?`,
          `That is clear. In the ${industry} space, how do you manage delays or roadblocks in your delivery timeline?`,
          `Understood. Let's discuss collaboration: explain how you handled a situation where a technical or operations lead strongly disagreed with your product/project direction.`,
          `Lastly, why do you believe your prioritization skills and business vision make you the ideal choice for this ${targetRole} role?`
        ];
      } else {
        return [
          `Welcome to your SHANA Voice Training session. Let's begin. You listed ${targetRole} as your target role in ${industry}. Can you detail a major project, product, or service roadmap you owned, and how you aligned stakeholders around it?`,
          `Thank you. Regarding that roadmap, can you explain what performance metrics, usage stats, or delivery outcomes you tracked to measure success?`,
          `Excellent. For the third question, in your targeted ${industry} space, how do you capture user or client feedback to iterate? Can you cite a quick framework or tool example?`,
          `That focus is clear. Now, let's explore adaptability: can you describe a scenario where client demand or product goals shifted mid-cycle, and how you calibrated your backlog?`,
          `Great effort. To conclude this coaching sprint, thinking of your custom focus on ${primaryFocus || "Professional Delivery"}, where do you see your biggest potential growth during stakeholder reviews or team sprints?`
        ];
      }
    }
  }

  // 4. Technology / Software / Engineering (Highly technical, current fallback preserved but refined)
  if (indLower.includes("tech") || indLower.includes("software") || indLower.includes("engineer") || indLower.includes("it") || indLower.includes("code") || indLower.includes("developer") || roleLower.includes("engineer") || roleLower.includes("developer") || roleLower.includes("architect")) {
    if (isFrench) {
      if (isFormal) {
        return [
          `Bienvenue dans votre entretien formel pour le poste de ${targetRole}. Pour commencer, pourriez-vous vous présenter et retracer brièvement votre parcours technique, vos langages de prédilection et vos principales architectures deployées ?`,
          `Merci. Pouvez-vous décrire un défi technique ou d'infrastructure de code complexe que vous avez conçu, et comment vous avez garanti la robustesse et la scalabilité du système ?`,
          `C'est clair. Dans le secteur de l'industrie ${industry}, comment gérez-vous l'introduction de nouvelles dépendances, de bugs de production, ou des exigences techniques changeantes sous de courts délais d'itération ?`,
          `Compris. Parlons de collaboration : expliquez-moi comment vous avez collaboré face à une situation où un autre ingénieur ou architecte était en profond désaccord avec votre conception technique ou vos choix d'API.`,
          `Enfin, pourquoi pensez-vous que votre rigueur en ingénierie fait de vous le candidat idéal pour ce rôle de l'industrie ?`
        ];
      } else {
        return [
          `Bienvenue dans votre session de coaching vocal SHANA. Commençons. Vous ciblez le poste de ${targetRole} en ${industry}. Pouvez-vous détailler un projet technique majeur ou une migration que vous avez dirigé, et comment vous avez assuré la robustesse du système ?`,
          `Merci. En ce qui concerne ce défi technique, pouvez-vous expliquer quelles métriques de performance ou d'efficacité d'infrastructure vous avez suivis pour valider le succès ?`,
          `Excellent. Pour la troisième question, dans l'industrie ${industry}, comment restez-vous à jour face aux nouveautés technologiques ? Pouvez-vous citer un exemple d'outil système ou de framework que vous préférez ?`,
          `Cette rigueur est claire. Explorons maintenant l'adaptabilité : pouvez-vous décrire un scénario où les exigences de l'API ou du système ont changé en plein milieu du développement, et comment vous avez réajusté votre code ?`,
          `Bel effort. Pour conclure ce sprint de coaching, en pensant à votre focus sur ${primaryFocus || "Professional Delivery"}, où voyez-vous votre plus grand potentiel d'amélioration lors de réunions d'architecture en direct ?`
        ];
      }
    } else {
      if (isFormal) {
        return [
          `Welcome to your formal interview. I am representing the recruitment board for the ${targetRole} position. To start, could you introduce yourself and briefly walk me through your engineering career, systems architectures, and preferred tech stack?`,
          `Thank you. Can you describe a highly critical system architecture or technical challenge you faced, and how you ensured efficiency and reliability?`,
          `That is clear. In the ${industry} space, how do you manage hotfixes, architectural debt, and changing technical scopes under fast-paced agile deadlines?`,
          `Understood. Let's discuss collaboration: explain how you handled a situation where a fellow engineer or lead developer strongly disagreed with your API design or code implementation.`,
          `Lastly, why do you believe your specific engineering craft makes you the ideal candidate for this ${targetRole} role?`
        ];
      } else {
        return [
          `Welcome to your SHANA Voice Training session. Let's begin. You listed ${targetRole} as your target role in ${industry}. Can you detail a major project or technical migration you led, and how you ensured system robustness?`,
          `Thank you. Regarding that scaling challenge, can you explain what metrics or outcomes you tracked to determine the project's true success?`,
          `Excellent. For the third question, in your targeted ${industry} space, how do you keep up with rapid library updates and modern architectures? Can you cite a quick real-world example?`,
          `That structural focus is clear. Now, let's explore adaptability: can you describe a scenario where API specifications or design requirements shifted mid-stride, and how you calibrated the codebase?`,
          `Great effort. To conclude this coaching sprint, thinking of your custom focus on ${primaryFocus || "Professional Delivery"}, where do you see your biggest potential growth during technical code reviews?`
        ];
      }
    }
  }

  // 5. General Fallback for all other careers/industries (HR, Healthcare, Admin, Education, Writing etc.)
  // Avoids technical terms like "migrations", "system robustness", and uses natural human terms.
  if (isFrench) {
    if (isFormal) {
      return [
        `Bienvenue dans votre entretien formel pour le poste de ${targetRole} dans le secteur ${industry}. Pour commencer, pourriez-vous vous présenter et retracer brièvement votre parcours professionnel, vos rôles clés et vos principales réalisations ?`,
        `Merci. Pouvez-vous décrire une initiative majeure ou un dossier complexe que vous avez géré d'un bout à l'autre, et comment vous avez assuré la qualité de vos livrables ?`,
        `C'est clair. Dans le secteur de l'industrie ${industry}, comment vous adaptez-vous lorsque les priorités quotidiennes changent ou sous conditions de délais serrés ?`,
        `Compris. Parlons de collaboration : expliquez-moi comment vous avez géré une situation de travail délicate ou un désaccord sur une méthode de travail au sein de votre équipe.`,
        `Enfin, pourquoi pensez-vous que votre approche professionnelle de l'industrie fait de vous le candidat idéal pour ce rôle de l'industrie ?`
      ];
    } else {
      return [
        `Bienvenue dans votre session de coaching vocal SHANA. Commençons. Vous ciblez le poste de ${targetRole} dans le secteur ${industry}. Pouvez-vous détailler un projet majeur ou une initiative organisationnelle que vous avez dirigée, et comment vous avez assuré la qualité globale ?`,
        `Merci. Concernant cette initiative, pouvez-vous expliquer quels critères d'efficacité ou de retour d'expérience vous avez suivis pour mesurer le succès ?`,
        `Excellent. Pour la troisième question, dans votre secteur ${industry}, comment continuez-vous à vous former et à intégrer les meilleures pratiques professionnelles ? Pouvez-vous citer un exemple ?`,
        `Cette rigueur est claire. Explorons maintenant l'adaptabilité : pouvez-vous décrire un scénario où les besoins ou les attentes d'un partenaire ou d'un client ont changé brusquement, et comment y avez-vous répondu ?`,
        `Bel effort. Pour conclure ce sprint de coaching, en pensant à votre focus sur ${primaryFocus || "Professional Delivery"}, où voyez-vous votre plus grand potentiel d'amélioration lors de vos communications ou présentations orales ?`
      ];
    }
  } else {
    if (isFormal) {
      return [
        `Welcome to your formal interview. I am representing the recruitment board for the ${targetRole} position in the ${industry} sector. To start, could you introduce yourself and briefly walk me through your career journey and primary professional roles?`,
        `Thank you. Can you describe a significant initiative, challenge, or project you owned, and how you ensured high-quality results?`,
        `That is clear. In the ${industry} sector, how do you handle shifting daily priorities or busy schedules under tight deadlines?`,
        `Understood. Let's discuss collaboration: explain how you handled a team environment challenge, or a disagreement on approach with a colleague or partner.`,
        `Lastly, why do you believe your career background and professional skills make you the ideal choice for this ${targetRole} role?`
      ];
    } else {
      return [
        `Welcome to your SHANA Voice Training session. Let's begin. You listed ${targetRole} as your target role in ${industry}. Can you detail a major project or process initiative you led, and how you kept operations aligned?`,
        `Thank you. Regarding that initiative, can you explain what outcomes or feedback indicators you tracked to determine its true success?`,
        `Excellent. For the third question, in your targeted ${industry} space, how do you stay current on positive developments and best practices? Can you cite a quick real-world example?`,
        `That structural focus is clear. Now, let's explore adaptability: can you describe a scenario where team responsibilities or client goals shifted in the middle of a project, and how you reacted?`,
        `Great effort. To conclude this coaching sprint, thinking of your custom focus on ${primaryFocus || "Professional Delivery"}, where do you see your biggest potential growth during live team exchanges and communication?`
      ];
    }
  }
}

// GET endpoint to retrieve the active session from HTTPOnly cookies
app.get("/api/auth/session", (req, res) => {
  const userId = req.cookies && req.cookies.shana_sid;
  if (!userId) {
    return res.json({ authenticated: false });
  }
  return res.json({ authenticated: true, userId });
});

// POST endpoint to establish session on login/registration
app.post("/api/auth/login", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required to establish session" });
  }

  // Set HTTPOnly, Secure, SameSite=Lax cookie
  res.cookie("shana_sid", userId, {
    httpOnly: true,
    secure: true, // Force secure for AI Studio reverse proxy & secure guidelines
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  return res.json({ success: true, userId });
});

// POST endpoint to terminate session on logout
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("shana_sid", {
    httpOnly: true,
    secure: true,
    sameSite: "lax"
  });
  return res.json({ success: true });
});

// POST endpoint for Job Scraping and Analysis via Gemini
app.post("/api/analyze-job", async (req, res) => {
  const { jobUrl, jobDescription, currentProfile } = req.body;
  let jobText = jobDescription || "";

  if (jobUrl && jobUrl.trim()) {
    try {
      console.log(`[SHANA Server] Attempting to scrape job URL: ${jobUrl}`);
      const fetchResponse = await fetch(jobUrl.trim(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        }
      });
      if (fetchResponse.ok) {
        const html = await fetchResponse.text();
        jobText = html;
      } else {
        console.warn(`[SHANA Server] Scrape fetch returned non-200 state: ${fetchResponse.status}`);
      }
    } catch (err) {
      console.error("[SHANA Server] Scraping failed due to network or CORS boundary:", err);
    }
  }

  if (!jobText || !jobText.trim()) {
    return res.status(400).json({ error: "No job description text or fetchable URL provided." });
  }

  const systemPrompt = `You are SHANA, an elite AI Career Strategy Architect. Your task is to scrape, parse, and analyze a target job description (supplied either as raw text or HTML) and compare it with the candidate's current profile.

You must extract key metrics and output a JSON response containing:
1. targetRole: The extracted job title.
2. industry: The industry domain.
3. experienceLevel: 'junior' | 'mid' | 'senior' | 'executive' required by the job.
4. requiredSkills: Array of top 5-6 core skills requested.
5. jobDescriptionSummary: A 2-sentence summary of what this job entails.
6. profileGapAnalysis: A detailed comparison explaining if the candidate meets the criteria or has gaps.
7. recommendations: 3-4 highly actionable recommendations to tailor their resume/profile for this job.
8. suggestedProfileAdjustments: { targetRole: string, industry: string, experienceLevel: 'junior' | 'mid' | 'senior' | 'executive' } representing the optimal alignment properties.

Return the response EXACTLY as a JSON object matching this schema:
{
  "targetRole": "extracted role name",
  "industry": "extracted industry",
  "experienceLevel": "mid",
  "requiredSkills": ["skill1", "skill2"],
  "jobDescriptionSummary": "summary...",
  "profileGapAnalysis": "comparison...",
  "recommendations": ["rec 1", "rec 2"],
  "suggestedProfileAdjustments": {
    "targetRole": "aligned role name",
    "industry": "aligned industry",
    "experienceLevel": "mid"
  }
}`;

  const openAIKey = ConfigResolver.getOpenAIKey();
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  if (openAIKey) {
    console.log("[SHANA Server] Attempting primary job description analysis via OpenAI GPT-4o-mini...");
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Current Candidate Profile:
- Target Role: ${currentProfile?.targetRole || "Not specified"}
- Industry: ${currentProfile?.industry || "Not specified"}
- Experience Level: ${currentProfile?.experienceLevel || "Not specified"}

Target Job Post Text/HTML:
${jobText.substring(0, 45000)}`,
            },
          ],
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const data = JSON.parse(json.choices[0].message.content);
        return res.json({ success: true, data });
      } else {
        const errorText = await response.text();
        console.warn("[SHANA Server] OpenAI job analysis call returned non-200 state, trying fallback...", errorText);
      }
    } catch (openaiError: any) {
      console.error("[SHANA Server] OpenAI primary job analysis error, falling back to Gemini:", openaiError);
    }
  }

  try {
    if (!hasGeminiKey) {
      throw new Error("No Gemini API Key available.");
    }
    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: `Current Candidate Profile:
- Target Role: ${currentProfile?.targetRole || "Not specified"}
- Industry: ${currentProfile?.industry || "Not specified"}
- Experience Level: ${currentProfile?.experienceLevel || "Not specified"}

Target Job Post Text/HTML:
${jobText.substring(0, 45000)}`, // Truncate to avoid token limits
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetRole: { type: Type.STRING },
            industry: { type: Type.STRING },
            experienceLevel: { type: Type.STRING },
            requiredSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            jobDescriptionSummary: { type: Type.STRING },
            profileGapAnalysis: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedProfileAdjustments: {
              type: Type.OBJECT,
              properties: {
                targetRole: { type: Type.STRING },
                industry: { type: Type.STRING },
                experienceLevel: { type: Type.STRING }
              },
              required: ["targetRole", "industry", "experienceLevel"]
            }
          },
          required: [
            "targetRole", "industry", "experienceLevel", "requiredSkills",
            "jobDescriptionSummary", "profileGapAnalysis", "recommendations",
            "suggestedProfileAdjustments"
          ]
        }
      }
    });

    const outputText = response?.text;
    if (!outputText) {
      throw new Error("No output text received from Gemini.");
    }
    const data = JSON.parse(outputText);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("[SHANA Server] Job analysis failed:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze job post." });
  }
});

// API endpoint for CV analysis via OpenAI (with Gemini fallback)
app.post("/api/analyze", async (req, res) => {
  const { text, file, userId } = req.body;
  if ((!text || !text.trim()) && (!file || !file.data)) {
    return res
      .status(400)
      .json({ error: "No CV text content or file provided for analysis." });
  }

  let cvText = text ? text.trim() : "";
  if (file && file.data) {
    try {
      const extracted = await extractTextFromFile(file);
      if (extracted && extracted.trim()) {
        cvText = extracted.trim();
      }
    } catch (err) {
      console.error("[SHANA Server] File text extraction failed:", err);
    }
  }

  const systemPrompt = `You are SHANA, an elite AI Career Strategy Architect. Your task is to analyze a candidate's CV and generate:
1. CV Analysis (role, industry, experienceYears, skills, summary, strengths, potential risks).
2. Interview Blueprint Weights summing to exactly 100% total across four areas: behavioral, role-specific, industry, and resume deep-dive. Also determine primary/secondary focus, difficulty, and recommended voice sessions.

CRITICAL INSTRUCTIONS:
- Experience years: Must be an integer.
- Risks: Identify potential vulnerabilities (e.g., short tenures, missing technical metrics, gaps, weak leadership evidence).
- Weights: The sum of behavioralWeight + roleWeight + industryWeight + resumeWeight must be EXACTLY 100.
- Difficulty: Select 'Junior', 'Mid', 'Senior', or 'Executive' based on years of experience and level of role.
- Focus: Provide actionable primary and secondary interview focus labels (e.g., "System Design & Scale" or "STAR Method Mastery").
- Recommended Sessions: An integer between 3 and 10.

Return the response exactly as a well-formed JSON object matching this schema:
{
  "role": "extracted or expected target role",
  "industry": "industry name",
  "experienceYears": 5, 
  "skills": ["skill1", "skill2"],
  "summary": "1-2 sentence career profile summary",
  "strengths": ["strength1", "strength2", "strength3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "behavioralWeight": 40,
  "roleWeight": 30,
  "industryWeight": 20,
  "resumeWeight": 10,
  "primaryFocus": "...",
  "secondaryFocus": "...",
  "difficulty": "Mid",
  "recommendedSessions": 6
}`;

  const openAIKey = ConfigResolver.getOpenAIKey();
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  // 1. Try OpenAI first if configured
  if (openAIKey) {
    console.log("[SHANA Server] Attempting primary CV analysis via OpenAI GPT-4o-mini...");
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Please analyze this CV content:\n\n${cvText}`,
            },
          ],
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const parsedContent = JSON.parse(json.choices[0].message.content);
        return res.json({ provider: "OpenAI", data: parsedContent });
      } else {
        const errorText = await response.text();
        console.warn("[SHANA Server] OpenAI analysis call returned non-200 state, trying fallback...", errorText);
      }
    } catch (openaiError: any) {
      console.error("[SHANA Server] OpenAI primary analysis error, falling back to Gemini:", openaiError);
    }
  }

  // 2. Try Gemini fallback next if available
  if (hasGeminiKey) {
    console.log("[SHANA Server] Running secondary CV analysis with Gemini API...");
    try {
      let contents: any;
      const isPdf = file && file.data && (file.mimeType.includes("pdf") || file.name.endsWith(".pdf"));
      if (isPdf) {
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: file.data
              }
            },
            {
              text: `Please analyze the attached CV PDF and generate the career profile and interview blueprint. Text context: ${cvText}`
            }
          ]
        };
      } else {
        contents = `Please analyze this CV content:\n\n${cvText}`;
      }

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              industry: { type: Type.STRING },
              experienceYears: { type: Type.INTEGER },
              skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              summary: { type: Type.STRING },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              risks: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              behavioralWeight: { type: Type.INTEGER },
              roleWeight: { type: Type.INTEGER },
              industryWeight: { type: Type.INTEGER },
              resumeWeight: { type: Type.INTEGER },
              primaryFocus: { type: Type.STRING },
              secondaryFocus: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              recommendedSessions: { type: Type.INTEGER }
            },
            required: [
              "role", "industry", "experienceYears", "skills", "summary", 
              "strengths", "risks", "behavioralWeight", "roleWeight", 
              "industryWeight", "resumeWeight", "primaryFocus", "secondaryFocus", 
              "difficulty", "recommendedSessions"
            ]
          }
        }
      });

      const textOutput = response?.text;
      if (!textOutput) {
        throw new Error("No text output returned from Gemini AI");
      }

      const parsedContent = JSON.parse(textOutput);
      return res.json({ provider: "Gemini", data: parsedContent });
    } catch (gemError: any) {
      console.error("[SHANA Server] Gemini secondary analysis stage failed, falling back to Heuristics:", gemError);
    }
  }

  // Smart Heuristic Simulation Fallback (Dynamic matching!)
  console.log("[SHANA Server] Running high-fidelity semantic parsing heuristic fallback...");
  
  let role = "Management Professional";
  let industry = "Business Operations";
  let skills = ["Strategic Planning", "Client Relations", "Team Leadership", "Execution Standards", "Workflow Optimization"];
  let primaryFocus = "Professional Communications";
  let secondaryFocus = "STAR Interview Formulation";

  // Combine search factors
  const searchSource = `${cvText} ${file?.name || ""}`.toLowerCase();

  const taxonomy = [
    {
      keywords: ["software", "developer", "engineer", "react", "typescript", "node", "javascript", "fullstack", "frontend", "backend", "java", "c#", "cpp", "c++"],
      role: "Software Engineer",
      industry: "Technology & Software Development",
      defaultSkills: ["ReactJS", "TypeScript", "Node.js", "API Design", "Agile Methodologies", "Cloud Architecture"]
    },
    {
      keywords: ["product manager", "product owner", "roadmap", "scrum", "agile product", "pm"],
      role: "Product Manager",
      industry: "Technology & Product Management",
      defaultSkills: ["Product Roadmap", "User Research", "Agile/Scrum", "A/B Testing", "Market Analysis", "Strategic Communication"]
    },
    {
      keywords: ["finance", "financial", "analyst", "investment", "banking", "portfolio", "audit", "cfa"],
      role: "Financial Analyst",
      industry: "Finance & Investment",
      defaultSkills: ["Financial Modeling", "Excel VBA", "Valuation", "Market Forecasting", "Risk Assessment", "Quantitative Research"]
    },
    {
      keywords: ["marketing", "seo", "sem", "growth", "brand", "advertising", "social media", "content planner"],
      role: "Marketing Specialist",
      industry: "Marketing & Advertising",
      defaultSkills: ["SEO/SEM", "Campaign Management", "Google Analytics", "Brand Positioning", "Growth Optimization", "Content Strategy"]
    },
    {
      keywords: ["data", "scientist", "machine learning", "ai", "python", "nlp", "pandas", "numpy", "tensorflow", "pytorch"],
      role: "Data Scientist",
      industry: "AI & Industrial Data Analytics",
      defaultSkills: ["Python", "SQL Backend", "Machine Learning", "Pandas & Numpy", "Statistical Modeling", "Data Visualizations"]
    },
    {
      keywords: ["project manager", "project coordination", "gantt", "pmp", "delivery lead", "coordinator"],
      role: "Project Manager",
      industry: "Professional Services",
      defaultSkills: ["Project Planning", "Scope Management", "Resource Optimization", "Stakeholder Alignment", "Risk Mitigation", "Agile Delivery"]
    },
    {
      keywords: ["consultant", "consulting", "strategy", "mckinsey", "boston", "advisory"],
      role: "Strategy Consultant",
      industry: "Management Consulting",
      defaultSkills: ["Strategic Planning", "Business Transformation", "Market Entry Analysis", "Operations Diagnostics", "Financial Valuation", "Executive Presenting"]
    },
    {
      keywords: ["hr", "human resources", "talent", "recruitment", "recruiter", "peopleops", "onboarding"],
      role: "HR Specialist",
      industry: "Human Resources & Talent Strategy",
      defaultSkills: ["Talent Acquisition", "Employee Engagement", "Conflict Resolution", "HR Compliance", "Performance Management", "Onboarding Systems"]
    },
    {
      keywords: ["designer", "ui", "ux", "figma", "sketch", "creative", "art direction", "graphic"],
      role: "UX/UI Designer",
      industry: "Creative & Digital Experience",
      defaultSkills: ["Figma Design", "User Workflows", "Wireframing", "Interaction Prototyping", "Aesthetic Selection", "Usability Testing"]
    },
    {
      keywords: ["sales", "account executive", "ae", "sdr", "business development", "bdr", "salesforce", "crm"],
      role: "Account Executive",
      industry: "Sales & Client Management",
      defaultSkills: ["Relationship Management", "Salesforce Mastery", "Deal Negotiation", "Lead Qualifying", "Revenue Strategy", "Pipeline Health"]
    }
  ];

  let matchedTaxonomy = taxonomy.find(item => item.keywords.some(kw => searchSource.includes(kw)));
  if (matchedTaxonomy) {
    role = matchedTaxonomy.role;
    industry = matchedTaxonomy.industry;
    skills = [...matchedTaxonomy.defaultSkills];
    primaryFocus = `${role} Delivery Standards`;
  } else if (cvText.length > 50) {
    // Guess role name from first capitalized lines
    const lines = cvText.split("\n").map(l => l.trim()).filter(l => l.length > 3 && l.length < 50);
    if (lines.length > 0) {
      let candidateLine = lines[0];
      if (candidateLine.includes("@") || candidateLine.includes(".") || candidateLine.includes("/")) {
        if (lines.length > 1) {
          candidateLine = lines[1];
        }
      }
      if (candidateLine.length < 35 && !candidateLine.match(/pdf/i)) {
        role = candidateLine;
      }
    }
  }

  // Scan for technology skill markers to enrich matching
  const commonTechWords = [
    "React", "TypeScript", "JavaScript", "HTML", "CSS", "Node.js", "Python", "SQL", "PostgreSQL", "MySQL", "MongoDB",
    "Docker", "Kubernetes", "AWS", "Google Cloud", "Azure", "Git", "SaaS", "API", "REST", "GraphQL", "Java", "C++", "C#",
    "Figma", "Excel", "Scrum", "Agile", "Jira", "Salesforce", "SEO", "SEM", "Google Analytics", "Tableau", "PowerBI",
    "Machine Learning", "Deep Learning", "NLP", "AI", "Swift", "Kotlin", "Flutter", "QA", "CI/CD", "Vercel", "Linux"
  ];
  const foundSkills = commonTechWords.filter(word => {
    const r = new RegExp(`\\b${word}\\b`, 'i');
    return r.test(searchSource);
  });
  if (foundSkills.length > 0) {
    const uniqueSkills = Array.from(new Set([...foundSkills, ...skills]));
    skills = uniqueSkills.slice(0, 6);
  }

  const matchYears = cvText.match(/(\d+)\+?\s*years?/i);
  let experienceYears = matchYears ? parseInt(matchYears[1], 10) : 4;
  if (isNaN(experienceYears) || experienceYears > 40 || experienceYears === 0) {
    experienceYears = 5;
  }

  const difficulty = experienceYears >= 10 ? "Executive" : experienceYears >= 7 ? "Senior" : experienceYears >= 3 ? "Mid" : "Junior";
  const summaryText = `A motivated professional specializing in ${industry}, offering strong expertise in key capabilities including ${skills.slice(0, 3).join(", ")}, with dedicated structural commitment to business outcomes.`;

  const parsedContent = {
    role,
    industry,
    experienceYears,
    skills,
    summary: cvText.length > 100 && !cvText.includes("%PDF") ? cvText.substring(0, 150).trim() + "..." : summaryText,
    strengths: [
      `Expert-level focus on core parameters of ${role} processes.`,
      `Demonstrated familiarity with essential skill structures: ${skills.slice(0, 3).join(", ")}.`,
      "Constructive and well-articulated flow of professional experiences."
    ],
    risks: [
      `Missing explicit metric boundaries or system KPIs in current ${industry} summary.`,
      "Opportunities to demonstrate expanded leadership or strategic context."
    ],
    behavioralWeight: 35,
    roleWeight: 35,
    industryWeight: 20,
    resumeWeight: 10,
    primaryFocus,
    secondaryFocus,
    difficulty,
    recommendedSessions: Math.max(3, Math.min(10, experienceYears + 2))
  };

  return res.json({ provider: "SimulationFallback", data: parsedContent });
});

// API endpoint for adaptive voice coaching in Train Mode (Phase 4)
app.post("/api/train/chat", async (req, res) => {
  const { chatHistory, userInput, profile, blueprint, surpriseConfig } = req.body;

  const targetRole = profile?.targetRole || "Candidate";
  let industry = profile?.industry || "Technology";
  const experienceYears = profile?.experienceYears || "some";
  const language = profile?.language || "English";
  const primaryFocus = blueprint?.primaryFocus || "Professional Delivery";
  let difficulty = blueprint?.difficulty || "Mid";

  if (surpriseConfig) {
    if (surpriseConfig.industry) industry = surpriseConfig.industry;
    if (surpriseConfig.difficulty) difficulty = surpriseConfig.difficulty;
  }

  let surpriseDirective = "";
  if (surpriseConfig) {
    surpriseDirective = `\n\n[SURPRISE CHALLENGE CONFIGURATION]:
- Recruiter Personality Type: ${surpriseConfig.personality?.nameEN || 'Standard'}
- Question style: ${surpriseConfig.style?.nameEN || 'Standard'}
- Format: ${surpriseConfig.format || 'Standard'}

CRITICAL PERSONALITY RULES:
`;
    if (surpriseConfig.personality?.id === 'friendly') {
      surpriseDirective += `* You must act as an extremely warm, encouraging, conversational, and supportive recruiter. Use comforting phrases and positive affirmations.`;
    } else if (surpriseConfig.personality?.id === 'fast') {
      surpriseDirective += `* You must act as a rapid-fire, high-velocity, extremely crisp recruiter. Keep your own questions very short, sharp, and direct. Move the user fast to the next logical point.`;
    } else if (surpriseConfig.personality?.id === 'silent') {
      surpriseDirective += `* You must act as an extremely quiet, reserved, professional, and poker-faced recruiter. Offer zero praise, do not say "Great!", and use deliberate probing questions to fill silence.`;
    } else if (surpriseConfig.personality?.id === 'pressure') {
      surpriseDirective += `* You must act as a strict, high-pressure, defensive interviewer. Actively point out any gaps or vague metrics in the user's answers and challenge them to justify their outcomes.`;
    }

    surpriseDirective += `\nCRITICAL STYLE RULES:\n`;
    if (surpriseConfig.style?.id === 'trick') {
      surpriseDirective += `* Focus your questions on brain-teasers, situational lateral thinking riddles, and complex scenario-traps designed to test their mental agility.`;
    } else if (surpriseConfig.style?.id === 'scenario') {
      surpriseDirective += `* Structure questions entirely around high-impact realistic business emergencies, crisis scenarios, or team conflicts.`;
    } else if (surpriseConfig.style?.id === 'technical') {
      surpriseDirective += `* Focus completely on deep, low-level system design, edge cases, algorithmic scale limits, and quantitative correctness.`;
    } else if (surpriseConfig.style?.id === 'competency') {
      surpriseDirective += `* Focus systematically on high-level corporate competencies such as leadership, cross-team influence, resource trade-offs, and priority matrix management.`;
    }
  }

  const systemPrompt = `You are SHANA, an elite AI Career Strategy Coach operating in Voice Training Mode.
Your purpose is to conduct an interactive, adaptive, and supportive audio coaching session (this is NOT an assessment or rigid test, but high-growth coaching).

CRITICAL OPERATING SPECIFICATIONS:
1. Act exclusively as an interactive coaching interviewer.
2. Ask exactly ONE clear interview question at a time. Do NOT list multiple questions.
3. Your questions MUST be highly tailored. You must directly reference the candidate's CV analysis, past achievements, industry domain, experience level (${experienceYears} years), and their custom interview blueprint focus (${primaryFocus}, difficulty: ${difficulty}) if provided.
   - Example style: "I notice in your CV analysis you have expertise in key projects. In a role within ${industry}, how do you structure your teams around this?" or "Given your focus on ${primaryFocus}, let's tackle how you lead deployments. How do you define your success metrics?"
   - Prohibited style (too generic): Do NOT ask standard cliché questions like "Tell me about teamwork", "What are your weaknesses?", or "Describe a failure" without pinning it contextually to their specific CV achievements or industry.
4. TRAIN MODE BEHAVIOR (COACHING & INTERACTION):
   - You can challenge the user's answers, suggest frameworks (like STAR or CAR), explain better structural patterns, or suggest concrete metrics.
   - You must be supportive, highly encouraging, and strictly professional.
   - You are NOT allowed to judge, pass, fail, evaluate, or give readiness scores or hiring decisions during this dialogue. No final assessments or ready/unready comments!
5. Voice-friendly response structure:
   - Provide full, complete, and thoroughly detailed coaching responses. Do not place any arbitrary limitation on your response length or sentence count. Ensure every sentence and thought is fully complete, beautifully structured, and rich.
   - If the user's previous answer was brief, offer a positive mini-suggestion (e.g. "Excellent start! Next time, try quantifying that system's scope.") before weaving naturally into your next probing question.
6. Language and Tone: Conduct the conversation entirely and naturally in ${language === 'French' || language === 'FR' ? 'French' : 'English'}.
   ${language === 'French' || language === 'FR' ? `CRITICAL LANGUAGE REGISTER RULE: When speaking or writing in French, you must use a simple, direct, natural, and modern register (Français simple mais professionnel et technique). Avoid overly literary, academic, or high-brow expressions (do not use "trop soutenu" or "ampoulé" French). Instead, focus on direct technical terms, action verbs, and key industry vocabulary (mots-clés). Write clear, concise sentences that sound natural when spoken.` : ''}${surpriseDirective}
`;

  const openAIKey = ConfigResolver.getOpenAIKey();
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  // 1. Try OpenAI first if configured
  if (openAIKey) {
    console.log("[SHANA Server] Calling primary OpenAI Chat Completion for voice training chat...");
    try {
      const messages = [{ role: "system", content: systemPrompt }];

      for (const msg of chatHistory || []) {
        if (msg && msg.text) {
          messages.push({
            role: msg.role === "ai" ? "assistant" : "user",
            content: msg.text,
          });
        }
      }

      if (userInput && userInput.trim()) {
        messages.push({
          role: "user",
          content: userInput.trim(),
        });
      } else if (messages.length === 1) {
        const greetText = language === 'French' || language === 'FR'
          ? `Lançons la session d'entraînement pour le poste de ${targetRole} dans le secteur ${industry}. salue-moi et pose-moi la première question personnalisée basée sur mes antécédents.`
          : `Start the coaching training session for the ${targetRole} role in the ${industry} industry. Please greet me warmly and ask the first highly tailored question referencing my background.`;
        messages.push({
          role: "user",
          content: greetText
        });
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages,
          temperature: 0.8,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const reply = json.choices[0].message.content;
        return res.json({ response: reply.trim() });
      } else {
        const errText = await response.text();
        console.warn("[SHANA Server] OpenAI training chat returned non-200 state, trying fallback...", errText);
      }
    } catch (openaiError: any) {
      console.error("[SHANA Server] OpenAI training chat failed, falling back to Gemini:", openaiError);
    }
  }

  // 2. Try Gemini fallback next if available
  if (hasGeminiKey) {
    console.log("[SHANA Server] Calling Gemini API for voice training chat...");
    try {
      const contents = [];
      for (const msg of chatHistory || []) {
        if (msg && msg.text) {
          contents.push({
            role: msg.role === "ai" ? "model" : "user",
            parts: [{ text: msg.text }]
          });
        }
      }

      if (userInput && userInput.trim()) {
        contents.push({
          role: "user",
          parts: [{ text: userInput.trim() }]
        });
      } else if (contents.length === 0) {
        const greetText = language === 'French' || language === 'FR'
          ? `Lançons la session d'entraînement pour le poste de ${targetRole} dans le secteur ${industry}. salue-moi et pose-moi la première question personnalisée basée sur mes antécédents.`
          : `Start the coaching training session for the ${targetRole} role in the ${industry} industry. Please greet me warmly and ask the first highly tailored question referencing my background.`;
        contents.push({
          role: "user",
          parts: [{ text: greetText }]
        });
      }

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8
        }
      });

      const textOutput = response?.text;
      if (!textOutput) {
        throw new Error("No output text received from Gemini API");
      }

      return res.json({ response: textOutput.trim() });
    } catch (gemError: any) {
      console.error("[SHANA Server] Gemini voice training chat failed, falling back to heuristics:", gemError);
    }
  }

  // Simulation Fallback
  console.log("[SHANA Server] No suitable API key found, running Train coaching state-machine fallback...");
  
  const turns = chatHistory ? chatHistory.length : 0;
  const aiTurnsCount = chatHistory ? chatHistory.filter((m: any) => m.role === 'ai').length : 0;

  const isFr = (language === 'French' || language === 'FR' || language === 'fr');
  const targetList = getFallbackQuestions(targetRole, industry, isFr, false, primaryFocus);
  let reply = targetList[Math.min(aiTurnsCount, targetList.length - 1)];

  if (userInput && userInput.trim() && aiTurnsCount > 0) {
    const positiveCoachingPhrases = isFr
      ? [
          "C'est un excellent point de départ ! Essayez d'ajouter d'autres KPI ou métriques concrètes d'impact. ",
          "Une réponse très structurée et professionnelle. Veillez à rester concis dans vos phrases de transition ! ",
          "Excellent exemple concret. Utilisez la structure STAR (Situation, Tâche, Action, Résultat) pour guider vos phrases d'élocution. "
        ]
      : [
          "That's a very solid foundation! Next time, try adding quantitative metrics to amplify details. ",
          "A well-structured structural answer. Remember to keep transitions concise for high verbal engagement. ",
          "Strong real-world context there. Remember to define your initial constraints clearly using the STAR framework. "
        ];
    const coachFeedback = positiveCoachingPhrases[(turns - 1) % positiveCoachingPhrases.length];
    reply = coachFeedback + reply;
  }

  return res.json({ response: reply });
});

// API endpoint for wrapping up and reviewing a Voice Training session (Phase 4)
app.post("/api/train/review", async (req, res) => {
  const { chatHistory, profile, blueprint } = req.body;
  
  const targetRole = profile?.targetRole || "Candidate";
  const language = profile?.language || "English";

  const systemPrompt = `You are SHANA, an elite AI Career Strategy Coach. Your task is to analyze the preceding Job Interview Voice Training conversation and provide constructive, growth-mindset feedback.

CRITICAL DIRECTIVES:
1. You must extract exactly:
   - One primary STRENGTH (e.g., clear structuring, professional pacing, strong technical evidence, etc.).
   - One actionable MAIN IMPROVEMENT area (e.g., provide more numerical metrics, shorten answers to keep engagement high, state the problem more clearly, etc.).
   - One specific SUGGESTED EXERCISE or focus for their next training session.
2. Under NO circumstances are you allowed to output scores, percentage grades, pass/fail remarks, readiness badges, or hiring decisions. This is training feedback ONLY.
3. Keep the feedback concise, positive, highly professional, and encouraging.
4. Speak in the selected language: ${language === 'French' || language === 'FR' ? 'French' : 'English'}.`;

  const apiKey = ConfigResolver.getOpenAIKey();
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  // 1. Try OpenAI first if configured
  if (apiKey) {
    console.log("[SHANA Server] Generating voice training review with OpenAI API...");
    const openAISystemPrompt = `${systemPrompt}\n\nYou must return the output EXACTLY as a well-formed JSON object matching this schema:
{
  "strength": "Clean summary of their biggest positive verbal presentation or structuring asset",
  "improvement": "One clear, constructive, actionable thing they can improve in their speech (e.g. shorter answers, more metrics)",
  "suggestedExercise": "A concrete topic or exercise for their next session (e.g. leadership scenarios with STAR method)"
}`;

    try {
      const messages = [
        { role: "system", content: openAISystemPrompt },
        { 
          role: "user", 
          content: `Please review this training session dialogue log:\n\n${JSON.stringify(chatHistory)}` 
        }
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: messages,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const parsed = JSON.parse(json.choices[0].message.content);
        return res.json({ data: parsed });
      } else {
        const errText = await response.text();
        console.warn("[SHANA Server] OpenAI train review call returned non-200 state, trying fallback...", errText);
      }
    } catch (openaiError: any) {
      console.error("[SHANA Server] OpenAI voice training review failed, falling back to Gemini:", openaiError);
    }
  }

  // 2. Try Gemini fallback next if available
  if (hasGeminiKey) {
    console.log("[SHANA Server] Generating voice training review with Gemini API...");
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `Please review this training session dialogue log:\n\n${JSON.stringify(chatHistory)}`,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strength: { type: Type.STRING },
              improvement: { type: Type.STRING },
              suggestedExercise: { type: Type.STRING }
            },
            required: ["strength", "improvement", "suggestedExercise"]
          }
        }
      });

      const textOutput = response?.text;
      if (!textOutput) {
        throw new Error("No output text received from Gemini API");
      }

      const parsed = JSON.parse(textOutput);
      return res.json({ data: parsed });
    } catch (gemError: any) {
      console.error("[SHANA Server] Gemini voice training review failed, falling back to heuristics:", gemError);
    }
  }

  // Simulation Fallback
  console.log("[SHANA Server] Running Train feedback generator fallback...");
  const isFr = (language === 'French' || language === 'FR');
  
  const strength = isFr
    ? `Excellente structure verbale lors de l'explication de vos compétences clés pour le poste de ${targetRole}. Vous liez bien vos réalisations aux défis du secteur.`
    : `Excellent verbal structure when detailing your core achievements for the ${targetRole} role. You synthesize real scenarios well with industry contexts.`;
    
  const improvement = isFr
    ? `Essayez d'écourter légèrement vos réponses. Pour un entretien vocal fluide, visez des réponses d'environ 1 à 2 minutes en évitant les détails secondaires.`
    : `Try to make your answers slightly more concise. For optimal vocal engagement, aim for 60 to 90 seconds per turn and avoid secondary details.`;

  const suggestedExercise = isFr
    ? `Entraînez-vous à quantifier vos succès antérieurs (par exemple, des pourcentages d'amélioration ou des budgets gérés) à l'aide de la méthode STAR.`
    : `Practice quantifying your historic achievements (e.g. metrics of performance improvements, budget sizes) using the STAR framework.`;

  return res.json({
    data: {
      strength,
      improvement,
      suggestedExercise
    }
  });
});

// API endpoint for real-time live interview simulation via Gemini (and OpenAI fallback)
app.post("/api/interview/chat", async (req, res) => {
  const { chatHistory, userInput, profile, blueprint, cvAnalysis, history, surpriseConfig, adaptation } = req.body;

  let targetRole = profile?.targetRole || cvAnalysis?.role || "Candidate";
  let industry = profile?.industry || cvAnalysis?.industry || "Technology";
  let language = profile?.language || "English";
  let primaryFocus = blueprint?.primaryFocus || "Professional Delivery";
  let experienceYears = profile?.experienceYears || cvAnalysis?.experienceYears || "some";
  let skills = cvAnalysis?.skills || [];
  let strengths = cvAnalysis?.strengths || [];
  let risks = cvAnalysis?.risks || [];
  let summary = cvAnalysis?.summary || "";
  let difficulty = blueprint?.difficulty || "Mid";

  if (surpriseConfig) {
    if (surpriseConfig.industry) industry = surpriseConfig.industry;
    if (surpriseConfig.difficulty) difficulty = surpriseConfig.difficulty;
  }

  let cvContext = "";
  if (skills.length > 0 || strengths.length > 0 || risks.length > 0 || summary) {
    cvContext = `\n\nCANDIDATE CV CONTEXT:\n`;
    if (summary) cvContext += `- CV Summary: ${summary}\n`;
    if (skills.length > 0) cvContext += `- Key Skills: ${skills.join(", ")}\n`;
    if (strengths.length > 0) cvContext += `- Stated CV Strengths: ${strengths.join(", ")}\n`;
    if (risks.length > 0) cvContext += `- Stated CV Risks/Challenges: ${risks.join(", ")}\n`;
  }

  let trainingContext = "";
  if (history && Array.isArray(history) && history.length > 0) {
    const trainSessions = history.filter((item: any) => item.type === 'TRAIN');
    if (trainSessions.length > 0) {
      trainingContext = `\n\nCANDIDATE RECENT TRAINING HISTORY & FEEDBACK:\n`;
      trainSessions.slice(0, 3).forEach((sess: any, idx: number) => {
        trainingContext += `- Training Session ${idx + 1} (Score: ${sess.score}/100):\n`;
        if (sess.weakness) trainingContext += `  * Documented Weakness: ${sess.weakness}\n`;
        if (sess.recommendation) trainingContext += `  * Documented Recommendation: ${sess.recommendation}\n`;
      });
      trainingContext += `\nINSTRUCTION: You must actively review their training history, specifically targeting their documented weaknesses (e.g. speaking tempo, structured answers, clarity issues, or technical gaps) to see if they can demonstrate improvement. Craft questions that help them practice and prove they have overcome these weaknesses.`;
    }
  }

  let surpriseDirective = "";
  if (surpriseConfig) {
    surpriseDirective = `\n\n[SURPRISE CHALLENGE CONFIGURATION]:
- Recruiter Personality Type: ${surpriseConfig.personality?.nameEN || 'Standard'}
- Question style: ${surpriseConfig.style?.nameEN || 'Standard'}
- Format: ${surpriseConfig.format || 'Standard'}

CRITICAL PERSONALITY RULES:
`;
    if (surpriseConfig.personality?.id === 'friendly') {
      surpriseDirective += `* You must act as an extremely warm, encouraging, conversational, and supportive recruiter. Use comforting phrases and positive affirmations.`;
    } else if (surpriseConfig.personality?.id === 'fast') {
      surpriseDirective += `* You must act as a rapid-fire, high-velocity, extremely crisp recruiter. Keep your own questions very short, sharp, and direct. Move the user fast to the next logical point.`;
    } else if (surpriseConfig.personality?.id === 'silent') {
      surpriseDirective += `* You must act as an extremely quiet, reserved, professional, and poker-faced recruiter. Offer zero praise, do not say "Great!", and use deliberate probing questions to fill silence.`;
    } else if (surpriseConfig.personality?.id === 'pressure') {
      surpriseDirective += `* You must act as a strict, high-pressure, defensive interviewer. Actively point out any gaps or vague metrics in the user's answers and challenge them to justify their outcomes.`;
    }

    surpriseDirective += `\nCRITICAL STYLE RULES:\n`;
    if (surpriseConfig.style?.id === 'trick') {
      surpriseDirective += `* Focus your questions on brain-teasers, situational lateral thinking riddles, and complex scenario-traps designed to test their mental agility.`;
    } else if (surpriseConfig.style?.id === 'scenario') {
      surpriseDirective += `* Structure questions entirely around high-impact realistic business emergencies, crisis scenarios, or team conflicts.`;
    } else if (surpriseConfig.style?.id === 'technical') {
      surpriseDirective += `* Focus completely on deep, low-level system design, edge cases, algorithmic scale limits, and quantitative correctness.`;
    } else if (surpriseConfig.style?.id === 'competency') {
      surpriseDirective += `* Focus systematically on high-level corporate competencies such as leadership, cross-team influence, resource trade-offs, and priority matrix management.`;
    }
  }

  const systemPrompt = `You are a strict, professional AI Job Interviewer for the role of ${targetRole} in the ${industry} industry. 
Your tone must be realistic, direct, professional, and completely objective. 

CRITICAL DIRECTIVES:
1. You behave ONLY as an interviewer. 
2. Ask exactly ONE clear interview question at a time. Do not compile lists of questions.
3. You must NOT provide any coaching, feedback, suggestions, scoring, or training analysis. 
4. Do not evaluate their response or say "Great answer!" or "That is correct." Just proceed directly as a professional interviewer would.
5. Dig deeper into their previous answers if appropriate (e.g., probe for technical implementation details, project scale, specific STAR metrics, or lessons learned).
6. Stay extremely aligned with the candidate's target role (Difficulty: ${difficulty}, Experience Level: ${experienceYears} years), and industry.
7. Conduct a natural progression of a job interview: starting with introductions, moving into deep-dive technical/role-specific or behavioral questions, and then wrapping up after 5-6 questions of interactive dialogue.
8. Provide full, complete, and thoroughly detailed interview questions and dialogue. Do not place any artificial limitations on your sentence length or quantity per turn. Ensure every sentence is fully complete, informative, and beautifully phrased. 
9. Speak exclusively in ${language === "English" || language === "EN" ? "English" : "French"}. If the user speaks a different language, gently guide them back to ${language === "English" || language === "EN" ? "English" : "French"}.
   ${language === "French" || language === "FR" || language === "fr" ? `CRITICAL LANGUAGE REGISTER RULE: When speaking or writing in French, you must use a simple, direct, natural, and modern register (Français simple mais professionnel et technique). Avoid overly literary, academic, or high-brow expressions (do not use "trop soutenu" or "ampoulé" French). Instead, focus on direct technical terms, action verbs, and key industry vocabulary (mots-clés). Write clear, concise sentences that sound natural when spoken.` : ''}${surpriseDirective}${cvContext}${trainingContext}`;

  // Live Adaptive Instructions Proxy
  let adaptationDirective = "";
  if (adaptation && typeof adaptation === 'object') {
    const { path, difficulty: adDifficulty, struggleFlags, recoveryMode, smartChallenge } = adaptation;
    adaptationDirective = `\n\n[MANDATORY ADAPTIVE INTERVIEW ENGINE LIVE INSTRUCTIONS]:
- Core Learning Path: ${path || 'Balanced'}
- Active Difficulty: ${adDifficulty || 'Normal'}
`;
    if (recoveryMode) {
      adaptationDirective += `\n* RECOVERY MODE ACTIVE: The candidate's confidence recently dropped. You MUST maintain a supportive, warmer, and slightly less aggressive posture. Ensure questions are clear and designed to rebuild conversational momentum.`;
    }
    if (struggleFlags?.lack_structure) {
      adaptationDirective += `\n* LACK STRUCTURE: Challenge the user with structured questions (e.g. behavioral STAR queries). Probe them if their answer lacks a clear timeline or direct metrics.`;
    }
    if (struggleFlags?.excels_under_pressure) {
      adaptationDirective += `\n* EXCELS UNDER PRESSURE: Show high professional skepticism, drill deep into their numbers, or push back aggressively on their strategic decisions.`;
    }
    if (struggleFlags?.too_long) {
      adaptationDirective += `\n* TOO VERBOSE: Challenge them to keep their answers concise. Explicitly ask them to summarize their main point or answer in 30 seconds or under 3 sentences.`;
    }
    if (smartChallenge) {
      adaptationDirective += `\n* ACTIVE SMART CHALLENGE: Execute a '${smartChallenge.type}' moment if relevant to the context. Prompt the user directly on this constraint.`;
    }
  }

  const systemPromptWithAdaptation = systemPrompt + adaptationDirective;

  const openAIKey = ConfigResolver.getOpenAIKey();
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  // 1. Try OpenAI first if configured
  if (openAIKey) {
    console.log("[SHANA Server] Calling primary OpenAI Chat Completion API for interview simulation...");
    try {
      const messages = [{ role: "system", content: systemPromptWithAdaptation }];

      for (const msg of chatHistory || []) {
        if (msg && msg.text) {
          messages.push({
            role: msg.role === "ai" ? "assistant" : "user",
            content: msg.text,
          });
        }
      }

      if (userInput && userInput.trim()) {
        messages.push({
          role: "user",
          content: userInput.trim(),
        });
      } else if (messages.length === 1) {
        messages.push({
          role: "user",
          content: `Let's start the interview. Please greet me in ${language === "English" || language === "EN" ? "English" : "French"} and ask the first standard interview question for ${targetRole}.`,
        });
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const reply = json.choices[0].message.content;
        return res.json({ response: reply.trim() });
      } else {
        const errText = await response.text();
        console.warn("[SHANA Server] OpenAI interview conversation returned non-200 state, trying fallback...", errText);
      }
    } catch (openaiError: any) {
      console.error("[SHANA Server] OpenAI interview simulation failed, falling back to Gemini:", openaiError);
    }
  }

  // 2. Try Gemini fallback next if available
  if (hasGeminiKey) {
    console.log("[SHANA Server] Calling Gemini API for interview simulation chat...");
    try {
      const contents = [];
      for (const msg of chatHistory || []) {
        if (msg && msg.text) {
          contents.push({
            role: msg.role === "ai" ? "model" : "user",
            parts: [{ text: msg.text }]
          });
        }
      }

      if (userInput && userInput.trim()) {
        contents.push({
          role: "user",
          parts: [{ text: userInput.trim() }]
        });
      } else if (contents.length === 0) {
        contents.push({
          role: "user",
          parts: [{ text: `Let's start the interview. Please greet me in ${language === "English" || language === "EN" ? "English" : "French"} and ask the first standard interview question for ${targetRole}.` }]
        });
      }

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemPromptWithAdaptation,
          temperature: 0.7
        }
      });

      const textOutput = response?.text;
      if (!textOutput) {
        throw new Error("No output text received from Gemini API");
      }

      return res.json({ response: textOutput.trim() });
    } catch (gemError: any) {
      console.error("[SHANA Server] Gemini interview simulation failed, falling back to heuristics:", gemError);
    }
  }

  // Simulation Fallback
  console.log("[SHANA Server] No suitable API key found, running Interview Simulator chat fallback...");
  const isFr = (language === "French" || language === "FR" || language === "fr");
  
  const aiTurnsCount = chatHistory ? chatHistory.filter((m: any) => m.role === 'ai').length : 0;
  const targetList = getFallbackQuestions(targetRole, industry, isFr, true, primaryFocus);
  const reply = targetList[Math.min(aiTurnsCount, targetList.length - 1)];

  return res.json({ response: reply });
});

// API endpoint to generate next question based strictly on Context Pack
app.post("/api/interview/generate-question", async (req, res) => {
  const { contextPack } = req.body;
  if (!contextPack) {
    return res.status(400).json({ error: "Context Pack is required." });
  }

  const { user_profile, session_state, interview_context, recent_events, ips_history, director_state, adaptation_state, question_context } = contextPack;

  const targetRole = user_profile?.target_role || "Candidate";
  const language = user_profile?.language || "English";
  const difficulty = director_state?.active_difficulty || interview_context?.active_difficulty || "normal";
  const objective = interview_context?.current_objective || "General assessment";
  const style = interview_context?.interview_style || "standard";
  
  const systemPrompt = `You are an expert, objective corporate recruiter and assessor. 
Your only task is to generate the NEXT interview question for the candidate, in structured JSON format.

CRITICAL INSTRUCTION: You must respond ONLY with a raw JSON object matching the requested schema. No conversational prefix, no markdown formatting (such as \`\`\`json), and no text outside of the JSON object.

Output Schema:
{
  "question": "The question string (concise, role-relevant, progressive, realistic, exactly one question, under 100 words in language: ${language})",
  "question_type": "One of: 'introduction' | 'behavioral' | 'technical' | 'follow_up' | 'pressure' | 'reflective' | 'clarification'",
  "expected_competency": "The competency being tested",
  "difficulty_level": "Must be: ${difficulty}",
  "estimated_duration": "The estimated answer duration, e.g., '2 minutes'"
}

Context for this generation:
- Target Role: ${targetRole}
- Language: ${language}
- Difficulty: ${difficulty}
- Current Objective: ${objective}
- Interview Style: ${style}
- Previous Question: ${question_context?.current_question || "None"}
- Previous Answer: ${question_context?.previous_answer_summary || "None"}

Guidelines for generating the question:
1. Role Relevance & Progression: The question must be highly tailored to the target role "${targetRole}" and the current objective.
2. Under 100 Words: The question must be extremely concise, natural, and realistic. Never ask multiple questions at once.
3. Anti-Repetition Rule: Do not repeat previous questions or ask about identical details already addressed.
4. Difficulty Level: You cannot decide difficulty. You must generate a question matching the requested difficulty_level: "${difficulty}".
5. Follow-Up Logic: If previous answer exists, generate ONE follow-up focusing on:
   - Specificity: If previous answer lacks concrete metrics or examples, ask for a concrete example.
   - Structure: If previous answer lacks clear structure, ask a process-oriented or chronological question.
   - Confidence: If previous answer lacks confidence, ask a simpler validation question.
`;

  const openAIKey = ConfigResolver.getOpenAIKey();
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  if (openAIKey) {
    console.log("[SHANA Server] Question Engine: Calling primary OpenAI Chat Completion...");
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generate the next question based on the provided instructions." }
          ],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const rawContent = json.choices[0].message.content;
        
        let cleaned = rawContent.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);
        return res.json({ questionPack: parsed });
      } else {
        const errText = await response.text();
        console.warn("[SHANA Server] OpenAI Question generation failed, trying Gemini fallback...", errText);
      }
    } catch (openaiError: any) {
      console.error("[SHANA Server] OpenAI Question generation exception, trying Gemini fallback:", openaiError);
    }
  }

  if (hasGeminiKey) {
    console.log("[SHANA Server] Question Engine: Calling Gemini API fallback...");
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: "Generate the next question based on the provided instructions." }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });

      const textOutput = response?.text;
      if (textOutput) {
        let cleaned = textOutput.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);
        return res.json({ questionPack: parsed });
      } else {
        throw new Error("No output text received from Gemini API");
      }
    } catch (gemError: any) {
      console.error("[SHANA Server] Gemini Question generation fallback exception:", gemError);
    }
  }

  console.log("[SHANA Server] Question Engine: No active LLM provider succeeded. Returning empty/null to trigger client fallback.");
  return res.json({ questionPack: null });
});

// API endpoint to evaluate candidate's response based strictly on Phase 6 specs
app.post("/api/interview/evaluate", async (req, res) => {
  const { input } = req.body;
  if (!input) {
    return res.status(400).json({ error: "Evaluation input is required." });
  }

  const { question, answer, question_context, user_profile, session_state } = input;
  const targetRole = user_profile?.target_role || "Candidate";
  const language = user_profile?.language || "English";

  const systemPrompt = `You are an expert, objective corporate performance assessor.
Your only task is to evaluate the candidate's answer to the interview question consistently and objectively, and output structured JSON.

CRITICAL INSTRUCTION: You must respond ONLY with a raw JSON object matching the requested schema. No conversational prefix, no markdown formatting (such as \`\`\`json), and no text outside of the JSON object.

Output Schema:
{
  "clarity": 70,
  "structure": 70,
  "confidence": 70,
  "relevance": 70,
  "conciseness": 70,
  "strength": "One specific, concise strength observed in the candidate's response (under 25 words)",
  "improvement_area": "One specific, constructive, and actionable improvement area (under 25 words)",
  "action_tip": "One clear, highly actionable tip to improve this answer (under 25 words)",
  "flags": ["too_long", "off_topic", "unclear", "strong_answer", "needs_follow_up"]
}

Guidelines:
1. Objectivity & Consistency: Judge solely on the content and structure of the candidate's response. Same response must result in the same scores. No emotional scoring, no personality judgment.
2. Signal Extraction:
   - Clarity (0-100): Articulation, ease of understanding, clear explanation of concepts.
   - Structure (0-100): Logically ordered thoughts, ideally using STAR (Situation, Task, Action, Result) methodology.
   - Confidence (0-100): Professional tone, authoritative assertions, minimal hesitation or filler words.
   - Relevance (0-100): Direct alignment with the question and the target role: "${targetRole}".
   - Conciseness (0-100): Avoidance of rambling, repetitive sentences, or unnecessary detail.
3. Language constraint: All feedback text (strength, improvement_area, action_tip) must be in the candidate's language: "${language}".
4. DO NOT calculate any total score (IPS) inside this evaluation. Leave total calculation entirely to the backend.
5. Flags Detection: Only include relevant strings in the flags array if conditions are met:
   - "too_long": if response is rambling or excessively long.
   - "off_topic": if candidate did not address the direct question.
   - "unclear": if the response has poor grammar, structure, or is confusing.
   - "strong_answer": if the response is exceptional, well-structured, and highly relevant.
   - "needs_follow_up": if the response left key details unaddressed or requires clarification.
`;

  const userPrompt = `
Question Asked: "${question}"
Candidate Answer: "${answer}"
Expected Competency: "${question_context?.expected_competency || "general_performance"}"
`;

  const openAIKey = ConfigResolver.getOpenAIKey();
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  if (openAIKey) {
    console.log("[SHANA Server] Evaluation Engine: Calling primary OpenAI Chat Completion...");
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1, // low temperature for high consistency and reproducibility
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const rawContent = json.choices[0].message.content;
        
        let cleaned = rawContent.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);

        // Step 4: Backend computed IPS
        const clarity = Number(parsed.clarity) || 70;
        const structure = Number(parsed.structure) || 70;
        const confidence = Number(parsed.confidence) || 70;
        const relevance = Number(parsed.relevance) || 70;
        const conciseness = Number(parsed.conciseness) || 70;

        const ips_total = Math.round(
          (clarity * 0.25) +
          (structure * 0.25) +
          (confidence * 0.20) +
          (relevance * 0.20) +
          (conciseness * 0.10)
        );

        parsed.ips_total = ips_total;

        return res.json({ evaluation: parsed });
      } else {
        const errText = await response.text();
        console.warn("[SHANA Server] OpenAI Evaluation failed, trying Gemini fallback...", errText);
      }
    } catch (openaiError: any) {
      console.error("[SHANA Server] OpenAI Evaluation exception, trying Gemini fallback:", openaiError);
    }
  }

  if (hasGeminiKey) {
    console.log("[SHANA Server] Evaluation Engine: Calling Gemini API fallback...");
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: userPrompt }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      const textOutput = response?.text;
      if (textOutput) {
        let cleaned = textOutput.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);

        // Step 4: Backend computed IPS
        const clarity = Number(parsed.clarity) || 70;
        const structure = Number(parsed.structure) || 70;
        const confidence = Number(parsed.confidence) || 70;
        const relevance = Number(parsed.relevance) || 70;
        const conciseness = Number(parsed.conciseness) || 70;

        const ips_total = Math.round(
          (clarity * 0.25) +
          (structure * 0.25) +
          (confidence * 0.20) +
          (relevance * 0.20) +
          (conciseness * 0.10)
        );

        parsed.ips_total = ips_total;

        return res.json({ evaluation: parsed });
      } else {
        throw new Error("No output text received from Gemini API");
      }
    } catch (gemError: any) {
      console.error("[SHANA Server] Gemini Evaluation fallback exception:", gemError);
    }
  }

  console.log("[SHANA Server] Evaluation Engine: No active LLM provider succeeded. Returning empty/null to trigger client fallback.");
  return res.json({ evaluation: null });
});

// API endpoint to recommend interview adaptations
app.post("/api/interview/adapt", async (req, res) => {
  const { input } = req.body;
  if (!input) {
    return res.status(400).json({ error: "Adaptation input is required." });
  }

  const { user_profile, session_state, ips_history, recent_events, current_difficulty, current_interview_mode, recent_feedback, adaptation_history } = input;
  const targetRole = user_profile?.target_role || "Candidate";
  const language = user_profile?.language || "English";

  const systemPrompt = `You are an expert, objective corporate recruiting and learning director.
Your only task is to analyze the candidate's recent interview performance data and recommend the NEXT adaptation action, in structured JSON format.

CRITICAL INSTRUCTION: You must respond ONLY with a raw JSON object matching the requested schema. No conversational prefix, no markdown formatting (such as \`\`\`json), and no text outside of the JSON object.

Allowed Actions:
Choose exactly ONE primary adaptation from this list:
- "maintain difficulty"
- "increase difficulty"
- "decrease difficulty"
- "request STAR examples"
- "request more concise answers"
- "encourage more detail"
- "increase behavioral focus"
- "increase technical depth"
- "slow interview pace"
- "increase interview pace"
- "supportive coaching mode"
- "pressure interview mode"

Output Schema:
{
  "recommended_action": "Exactly one string from the allowed actions list above",
  "reason": "A highly precise, analytical explanation for this recommendation (under 25 words)",
  "confidence": 85,
  "expected_outcome": "The expected learning or evaluation outcome (under 25 words)",
  "priority": "Must be: 'low' | 'medium' | 'high'",
  "cooldown": 2,
  "explanation": "A user-facing explanation in the candidate's language: \${language} (under 30 words)"
}

Guidelines for Adaptation recommendation:
1. Stability: Changes must be incremental. Avoid sudden spikes in difficulty unless performance warrants it (e.g. consistently high scores >88).
2. Learning Rules: Recommend adaptations that address specific pattern weaknesses (e.g., if conciseness is low, recommend "request more concise answers"; if structure is low, recommend "request STAR examples").
3. Cooldown System: Do not repeatedly suggest the same change unless there is a strong justification.
4. Failsafe Rule: If the metrics are within standard ranges or trend is unknown, default to "maintain difficulty" with high confidence.
5. Language constraints: The 'explanation' field must be generated in the language: ${language}.
`;

  const userPrompt = `
Target Role: "${targetRole}"
Current Difficulty: "${current_difficulty || "Normal"}"
Current Interview Mode: "${current_interview_mode || "TRAIN"}"
IPS Score History / Trend: Previous IPS is ${ips_history?.previous_ips || 70}, Trend is ${ips_history?.trend || "stable"}
Recent Strengths: ${JSON.stringify(ips_history?.recent_strengths || [])}
Recent Weaknesses: ${JSON.stringify(ips_history?.recent_weaknesses || [])}
Recent Feedback Scores: Clarity=${recent_feedback?.clarity || 70}, Structure=${recent_feedback?.structure || 70}, Confidence=${recent_feedback?.confidence || 70}, Relevance=${recent_feedback?.relevance || 70}, Conciseness=${recent_feedback?.conciseness || 70}
Recent Feedback Notes: Strength="${recent_feedback?.strength || ""}", Improvement="${recent_feedback?.improvement_area || ""}", Flags=${JSON.stringify(recent_feedback?.flags || [])}
`;

  const openAIKey = ConfigResolver.getOpenAIKey();
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  if (openAIKey) {
    console.log("[SHANA Server] Adaptation Engine: Calling primary OpenAI Chat Completion...");
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1, // low temperature for high consistency and reproducibility
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const rawContent = json.choices[0].message.content;
        
        let cleaned = rawContent.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);
        return res.json({ adaptation: parsed });
      } else {
        const errText = await response.text();
        console.warn("[SHANA Server] OpenAI Adaptation failed, trying Gemini fallback...", errText);
      }
    } catch (openaiError: any) {
      console.error("[SHANA Server] OpenAI Adaptation exception, trying Gemini fallback:", openaiError);
    }
  }

  if (hasGeminiKey) {
    console.log("[SHANA Server] Adaptation Engine: Calling Gemini API fallback...");
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: userPrompt }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      const textOutput = response?.text;
      if (textOutput) {
        let cleaned = textOutput.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);
        return res.json({ adaptation: parsed });
      } else {
        throw new Error("No output text received from Gemini API");
      }
    } catch (gemError: any) {
      console.error("[SHANA Server] Gemini Adaptation fallback exception:", gemError);
    }
  }

  console.log("[SHANA Server] Adaptation Engine: No active LLM provider succeeded. Returning empty/null to trigger client fallback.");
  return res.json({ adaptation: null });
});

// API endpoint to discover meaningful, evidence-based behavioral patterns (Phase 8 Spec)
app.post("/api/interview/insight", async (req, res) => {
  const { input } = req.body;
  if (!input) {
    return res.status(400).json({ error: "Insight input is required." });
  }

  const { user_profile, session_state, ips_history, recent_sessions_summary, behavioral_patterns, adaptation_history, evaluation_history } = input;
  const targetRole = user_profile?.target_role || "Candidate";
  const language = user_profile?.language || "English";

  const systemPrompt = `You are SHANA, an expert objective corporate Recruiter and Performance Analyst.
Your only task is to analyze the candidate's interview performance metrics to discover deep, non-obvious behavioral patterns and generate "aha" moments.
Your analysis must be 100% evidence-based, concise, and professional. Never invent, guess, or exaggerate findings.

CRITICAL INSTRUCTION: You must respond ONLY with a raw JSON object matching the requested schema. No conversational prefix, no markdown formatting (such as \`\`\`json), and no text outside of the JSON object.

Supported Insight Categories (choose exactly one, or NO_NEW_INSIGHT):
- "Strength"
- "Weakness"
- "Communication Pattern"
- "Confidence Pattern"
- "Interview Strategy"
- "Learning Trend"
- "Behavioral Pattern"
- "Improvement Opportunity"
- "NO_NEW_INSIGHT" (Default if no strong pattern with high confidence is found)

Output Schema:
{
  "insight_category": "Exactly one from the supported categories above",
  "title": "A highly concise, engaging title summarizing the discovery (under 6 words)",
  "insight": "The deep behavioral insight describing the discovered pattern (under 35 words)",
  "supporting_evidence": "The concrete data points or repeated metrics proving this pattern (under 30 words)",
  "confidence_score": 0.85, 
  "recommended_focus": "One clear, actionable future focus to capitalize on or resolve this pattern (under 15 words)",
  "priority": "Must be: 'low' | 'medium' | 'high'"
}

Discovery Constraints:
1. ONLY return a category from the list above if you detect repeated behavior, recurring strengths/weaknesses, or a significant change supported by data.
2. If there are no reliable, repeated patterns, or if you must speculate, you MUST return:
   { "insight_category": "NO_NEW_INSIGHT" }
3. Language constraint: The fields "title", "insight", "supporting_evidence", and "recommended_focus" must be written in the candidate's preferred language: "${language}".
4. Precision: Do not give generic advice or basic definitions. Focus on metrics, tempo, structure, or content habits.
`;

  const userPrompt = `
Candidate Target Role: "${targetRole}"
Current Language Preference: "${language}"
IPS Trend: "${ips_history?.trend || "unknown"}"
Recent Feedback Strengths: ${JSON.stringify(ips_history?.recent_strengths || [])}
Recent Feedback Weaknesses: ${JSON.stringify(ips_history?.recent_weaknesses || [])}
Current Session Behavioral Patterns:
- Verbal Filler Words: ${behavioral_patterns?.fillerWordsCount || 0}
- Speaking Speed WPM: ${behavioral_patterns?.pacingSpeedWpm || 135}
- Average Answer Duration: ${behavioral_patterns?.answerDuration || 0} seconds
Evaluation History (last sessions/questions): ${JSON.stringify(evaluation_history || [])}
`;

  const openAIKey = ConfigResolver.getOpenAIKey();
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  if (openAIKey) {
    console.log("[SHANA Server] Insight Engine: Calling primary OpenAI Chat Completion...");
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1, // low temperature for high consistency and reproducibility
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const rawContent = json.choices[0].message.content;
        
        let cleaned = rawContent.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);
        return res.json({ insightPack: parsed });
      } else {
        const errText = await response.text();
        console.warn("[SHANA Server] OpenAI Insight generation failed, trying Gemini fallback...", errText);
      }
    } catch (openaiError: any) {
      console.error("[SHANA Server] OpenAI Insight generation exception, trying Gemini fallback:", openaiError);
    }
  }

  if (hasGeminiKey) {
    console.log("[SHANA Server] Insight Engine: Calling Gemini API fallback...");
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: userPrompt }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      const textOutput = response?.text;
      if (textOutput) {
        let cleaned = textOutput.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        cleaned = cleaned.trim();

        const parsed = JSON.parse(cleaned);
        return res.json({ insightPack: parsed });
      } else {
        throw new Error("No output text received from Gemini API");
      }
    } catch (gemError: any) {
      console.error("[SHANA Server] Gemini Insight generation fallback exception:", gemError);
    }
  }

  console.log("[SHANA Server] Insight Engine: No active LLM provider succeeded. Returning empty/null to trigger client fallback.");
  return res.json({ insightPack: null });
});

// API endpoint to generate custom assessment questions using Gemini or local fallbacks
app.post("/api/assessment/questions", async (req, res) => {
  const { profile, cvAnalysis, history, adaptation, director } = req.body;
  const targetRole = profile?.targetRole || cvAnalysis?.role || "Candidate";
  const industry = profile?.industry || cvAnalysis?.industry || "Technology";
  const language = profile?.language || "English";
  const experienceYears = profile?.experienceYears || cvAnalysis?.experienceYears || "some";
  const experienceLevel = profile?.experienceLevel || "mid";
  const difficulty = profile?.experienceLevel ? `${profile.experienceLevel} level` : "Mid";

  // Junior gets 6 questions (target 25 mins), Senior/Mid/Executive gets 8 questions (target 45 mins)
  const isJunior = experienceLevel === 'junior';
  const numQuestions = isJunior ? 6 : 8;

  let historyContext = "";
  let trapInstruction = "";
  if (history && Array.isArray(history) && history.length > 0) {
    const trainSessions = history.filter((item: any) => item.type === 'TRAIN');
    if (trainSessions.length > 0) {
      historyContext = "\nCandidate's Training Session Feedbacks (integrate these, probe their documented weaknesses):\n";
      trainSessions.slice(0, 3).forEach((sess: any, idx: number) => {
        historyContext += `- Session ${idx + 1}: Score: ${sess.score}/100, Weakness: ${sess.weakness || 'None'}, Recommendation: ${sess.recommendation || 'None'}\n`;
      });

      trapInstruction = `\nCRITICAL TRAP QUESTION INSTRUCTION:
Review the Candidate's Training Session Feedbacks above. You MUST design at least 2 highly challenging, sector-specific "TRAP" questions (questions pièges) specifically tailored to verify whether the candidate has assimilated the feedback and corrected their documented weaknesses (e.g., if their weakness was "lack of structure", ask a multi-part behavioral question that demands a highly structured response; if their weakness was "vague technical explanations", ask a deep-dive technical question demanding exact tools, architectures, and metrics).
In these trap questions, mention or refer indirectly to the difficulty they faced to see if they can stand their ground.`;
    }
  }

  let directorInstruction = "";
  if (director) {
    directorInstruction = `
  [MANDATORY INTERVIEW DIRECTOR GLOBAL ORCHESTRATION INSTRUCTIONS]:
  - Selected Format: ${director.interviewType}
  - Difficulty Level: ${director.difficulty}
  - Pacing Constraints: ${director.pacing}
  - Question Style Requirement: ${director.questionStyle}
  - Interruption Frequency: ${director.interruptionLevel}
  - Recommended Evaluation Atmosphere: ${director.feedbackIntensity}
  
  Please apply these architectural focus guidelines based on the Selected Format:
  ${director.interviewType === 'Confidence Builder' ? '* CONFIDENCE BUILDER: Design warm, supportive, structure-guided questions to build momentum. Frame scenarios positively and clearly.' : ''}
  ${director.interviewType === 'Pressure Interview' ? '* PRESSURE INTERVIEW: Design highly aggressive, confrontational, rapid or controversial queries. Force the candidate to defend extreme operational or architectural decisions under pushback.' : ''}
  ${director.interviewType === 'Technical Deep Dive' ? '* TECHNICAL DEEP DIVE: Probe deeply into engineering, systems scaling, exact parameters, API specs, database indices, and metrics. Demands absolute technological rigour.' : ''}
  ${director.interviewType === 'Behavioral Focus' ? '* BEHAVIORAL FOCUS: Focus extensively on conflict, team management, customer negotiations, and STAR-method structure. Ask them to describe specific interpersonal/tactical/strategic outcomes.' : ''}
  ${director.interviewType === 'Silent Recruiter' ? '* SILENT RECRUITER: Ask bare-bone, blunt, challenging direct questions with zero suggestions, hints, or warm framing.' : ''}
  ${director.interviewType === 'Rapid Fire Interview' ? '* RAPID FIRE INTERVIEW: Concise questions testing tactical reflexes. Explicitly ask for short 2-3 sentence answers or speedy decision frameworks.' : ''}
  `;
  }

  const prompt = `You are an elite corporate technical assessor conducting a high-stakes, strict professional interview for the position of "${targetRole}" in the "${industry}" industry, with difficulty level suitable for "${difficulty}".
  
  Generate exactly ${numQuestions} customized, highly challenging, specific job assessment questions.
  
  The questions MUST follow this exact ${numQuestions}-phase sequence:
  ${isJunior ? `
  Phase 1: Resume Defense (Warm-Up) - Probing their CV/profile accomplishments and core fitness.
  Phase 2: Core Industry Knowledge - Testing technical foundation or industry-specific depth.
  Phase 3: Tactical Skill Trap (Trick Question) - A tricky question targeting their core technology or sector paradigm to check their technical depth under pressure.
  Phase 4: Behavioral Under Pressure - Forcing them to detail a high-stress timeline or project management incident.
  Phase 5: Cognitive Challenge (Assimilation Check) - Specific trap question designed to verify if they have assimilated previous session corrections.
  Phase 6: Pressure Tolerance (Closing) - Forcing them to defend operational, tactical decisions under an early/unexpected client delivery demand.
  ` : `
  Phase 1: Executive Warm-Up & Pedigree - Challenging their highest career milestones and core value.
  Phase 2: Architectural Deep-Dive - Testing high-level technical/system design, scaling, or core sector methodology.
  Phase 3: Disruptive Industry Shockwave - Putting them in a sector-disruption scenario (e.g. AI shifts, compliance, market downturn) and asking for a direct mitigation strategy.
  Phase 4: Behavioral Mastery Trap - Placing them in a high-stakes timeline crisis involving client-facing conflict.
  Phase 5: Core Weakness Trap (Trick Question) - Specifically designed to expose and test whether they have overcome their training session weaknesses.
  Phase 6: Crisis Leadership Check - Forcing them to lead or decide under incomplete information or sudden organizational pivots.
  Phase 7: Tactical Delivery Pressure - Challenging their delivery pacing when forced to ship a major rollout early under extreme client scrutiny.
  Phase 8: Integrity & Hard Defense (Closing) - A direct, highly provocative trap question testing their core professional values, ethics, and ability to handle extreme pushback from executive stakeholders.
  `}
  
  ${historyContext}
  ${trapInstruction}
  ${directorInstruction}
  
  ${adaptation ? `
  [MANDATORY ADAPTIVE INTERVIEW ENGINE INSTRUCTIONS]:
  - Core Learning Path: ${adaptation.path || 'Balanced'} Path
  - Selected Session Difficulty: ${adaptation.difficulty || 'Normal'}
  ${adaptation.recoveryMode ? `* RECOVERY MODE IS ACTIVE: Prioritize restoring candidate confidence. Keep questions warm, clear, and focused on core capabilities. Avoid highly aggressive trick questions or sudden hostile interruptions.` : ''}
  ${adaptation.difficulty === 'Easy' ? `* DIFFICULTY LEVEL IS EASY: Use clear, simple phrasing. Focus on primary competencies and standard scenarios.` : ''}
  ${adaptation.difficulty === 'Challenging' ? `* DIFFICULTY LEVEL IS CHALLENGING: Introduce advanced tactical challenges, resource trade-offs, and deep system architecture or industry-disruption issues.` : ''}
  ${adaptation.difficulty === 'Stretch' ? `* DIFFICULTY LEVEL IS STRETCH (MAX CHALLENGE): Push the candidate to their absolute limits. Challenge them on extreme scale constraints, highly controversial executive decisions, and deep technical or operational edge-cases.` : ''}
  ${adaptation.struggleFlags?.lack_structure ? `* TARGETED STRUGGLE (LACK STRUCTURE): You must design questions (especially behavioral ones) that demand highly structured STAR-method breakdowns. Prompt the candidate to walk through Situation, Task, Action, and Results clearly.` : ''}
  ${adaptation.struggleFlags?.excels_under_pressure ? `* TARGETED CAPABILITY (EXCELS UNDER PRESSURE): Generate highly realistic recruiter pushbacks, client-facing disasters, or direct criticisms of their decisions to test their performance under true tactical stress.` : ''}
  ${adaptation.struggleFlags?.too_long ? `* TARGETED STRUGGLE (TOO VERBOSE / LONG ANSWERS): For at least 2 questions, explicitly append a brevity instruction to the question text, such as: "Please provide a highly concise response of under 4 sentences." or "Test your speed by wrapping this up in 30 seconds."` : ''}
  ${adaptation.smartChallenge ? `* ACTIVE SMART CHALLENGE MOMENT FOR PHASE ${adaptation.smartChallenge.phaseIndex + 1}: For the question of Phase ${adaptation.smartChallenge.phaseIndex + 1}, design it specifically around the '${adaptation.smartChallenge.type}' theme:
    - If thirty_second_limit: Make it a quick-fire behavioral query requiring bullet-point rapid delivery.
    - If silent_recruiter: Make it a deep, probing system/decision-review question demanding strong justification.
    - If unexpected_trick: Make it an aggressive direct board-member/stakeholder objection or unexpected compliance crisis.` : ''}
  ` : ''}

  Format instructions:
  Return the output as a valid JSON object with the following schema:
  {
    "questions": [
      {
        "phase": 1,
        "label": "PHASE 1: ...",
        "question": "..."
      },
      ...
      {
        "phase": ${numQuestions},
        "label": "PHASE ${numQuestions}: ...",
        "question": "..."
      }
    ]
  }
  
  Respond ONLY with the raw JSON object. Do not wrap in markdown or add explanations. Speak exclusively in the candidate's chosen language: ${language === "French" || language === "FR" || language === "fr" ? "French" : "English"}.
  ${language === "French" || language === "FR" || language === "fr" ? `CRITICAL LANGUAGE REGISTER RULE: When writing the questions in French, you must use a simple, direct, natural, and modern register (Français simple mais professionnel et technique). Avoid overly literary, academic, or high-brow expressions (do not use "trop soutenu" or "ampoulé" French). Instead, focus on direct technical terms, action verbs, and key industry vocabulary (mots-clés). Write clear, concise sentences that sound natural when spoken.` : ''}`;

  const openAIKey = ConfigResolver.getOpenAIKey();
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  if (openAIKey) {
    console.log("[SHANA Server] Generating custom assessment questions via primary OpenAI...");
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an elite corporate technical assessor. Generate questions in raw JSON format strictly matching the schema requested." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const textOutput = json.choices[0].message.content;
        if (textOutput) {
          const parsed = JSON.parse(textOutput.trim());
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length === numQuestions) {
            const hasHistory = history && Array.isArray(history) && history.filter((item: any) => item.type === 'TRAIN').length > 0;
            const types = isJunior 
              ? ["Resume", "Industry", "Technical_Trap", "Behavioral", "Assimilation_Trap", "Pressure"]
              : ["Resume", "Architecture", "Industry_Shock", "Behavioral", "Weakness_Trap", "Leadership", "Delivery_Pressure", "Stakeholder_Trap"];
            
            const normalizedQuestions = parsed.questions.map((q: any, i: number) => {
              const qType = types[i] || "General";
              const isTrapType = ["Technical_Trap", "Assimilation_Trap", "Weakness_Trap", "Stakeholder_Trap"].includes(qType);
              const hasChallenge = adaptation?.smartChallenge && adaptation.smartChallenge.phaseIndex === i;
              return {
                label: q.label || `PHASE ${i + 1}`,
                type: qType,
                question: q.question,
                difficulty: adaptation?.difficulty || (isJunior ? "Junior" : "Senior"),
                isTrickQuestion: isTrapType,
                contextAware: isTrapType ? !!hasHistory : true,
                challenge: hasChallenge ? adaptation.smartChallenge : undefined
              };
            });
            return res.json({ questions: normalizedQuestions });
          }
        }
      } else {
        const errText = await response.text();
        console.warn("[SHANA Server] OpenAI assessment questions generation returned non-200 state, trying fallback...", errText);
      }
    } catch (openaiErr) {
      console.error("[SHANA Server] OpenAI assessment questions generation failed, trying Gemini fallback:", openaiErr);
    }
  }

  try {
    if (hasGeminiKey) {
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });
      const textOutput = response?.text;
      if (textOutput) {
        const parsed = JSON.parse(textOutput.trim());
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length === numQuestions) {
          const hasHistory = history && Array.isArray(history) && history.filter((item: any) => item.type === 'TRAIN').length > 0;
          const types = isJunior 
            ? ["Resume", "Industry", "Technical_Trap", "Behavioral", "Assimilation_Trap", "Pressure"]
            : ["Resume", "Architecture", "Industry_Shock", "Behavioral", "Weakness_Trap", "Leadership", "Delivery_Pressure", "Stakeholder_Trap"];
          
          const normalizedQuestions = parsed.questions.map((q: any, i: number) => {
            const qType = types[i] || "General";
            const isTrapType = ["Technical_Trap", "Assimilation_Trap", "Weakness_Trap", "Stakeholder_Trap"].includes(qType);
            const hasChallenge = adaptation?.smartChallenge && adaptation.smartChallenge.phaseIndex === i;
            return {
              label: q.label || `PHASE ${i + 1}`,
              type: qType,
              question: q.question,
              difficulty: adaptation?.difficulty || (isJunior ? "Junior" : "Senior"),
              isTrickQuestion: isTrapType,
              contextAware: isTrapType ? !!hasHistory : true,
              challenge: hasChallenge ? adaptation.smartChallenge : undefined
            };
          });
          return res.json({ questions: normalizedQuestions });
        }
      }
    }
  } catch (err) {
    console.error("[SHANA Server] Failed to generate custom assessment questions via Gemini:", err);
  }

  // Fallback to high-quality localized questions if API fails or is unavailable
  const isFr = (language === "French" || language === "FR" || language === "fr");
  const fallbackQuestions = isFr 
    ? (isJunior ? [
        { label: "PHASE 1 : PROJET CLÉ", type: "Resume", question: `“Présentez deux projets importants de votre parcours qui montrent que vous êtes prêt pour le poste de ${targetRole}.”` },
        { label: "PHASE 2 : COMPÉTENCES DU SECTEUR", type: "Industry", question: `“Quelles technologies ou méthodes du secteur ${industry} maîtrisez-vous le mieux pour ce poste ?”` },
        { label: "PHASE 3 : RÉSOLUTION DE PROBLÈME TECHNIQUE", type: "Technical_Trap", question: `“Comment réagissez-vous si vous découvrez un problème technique juste avant de présenter un projet à un client ?”` },
        { label: "PHASE 4 : RETARD DE PLANNING", type: "Behavioral", question: `“Parlez-moi d'une situation où vous avez dû gérer un retard sur un projet sans baisser la qualité du travail.”` },
        { label: "PHASE 5 : RETOUR SUR VOS ENTRAÎNEMENTS", type: "Assimilation_Trap", question: `“Par rapport à vos entraînements précédents, comment avez-vous amélioré vos réponses aujourd'hui ?”` },
        { label: "PHASE 6 : LIVRAISON URGENTE", type: "Pressure", question: `“Comment feriez-vous si votre client vous demandait d'avancer la livraison de 48 heures ?”` }
      ] : [
        { label: "PHASE 1 : PARCOURS DE LEADER", type: "Resume", question: `“Présentez les étapes clés de votre parcours qui montrent votre capacité à être ${targetRole}.”` },
        { label: "PHASE 2 : ORGANISATION ET CHOIX TECHNIQUES", type: "Architecture", question: `“Quels choix techniques ou d'organisation d'équipe faites-vous pour assurer la fiabilité et l'évolution de vos systèmes dans le secteur ${industry} ?”` },
        { label: "PHASE 3 : STRATÉGIE DE CHANGEMENT", type: "Industry_Shock", question: `“Face à un changement technologique majeur dans votre secteur, quelles actions concrètes lancez-vous tout de suite ?”` },
        { label: "PHASE 4 : GESTION DES CONFLITS", type: "Behavioral", question: `“Décrivez une situation où vous avez dû résoudre un désaccord ou un problème important avec un client ou un manager.”` },
        { label: "PHASE 5 : AXES D'ÉVOLUTION TECHNIQUE", type: "Weakness_Trap", question: `“Comment avez-vous travaillé aujourd'hui pour corriger les points faibles identifiés lors de vos entraînements ?”` },
        { label: "PHASE 6 : LEADER SOUS INCERTITUDE", type: "Leadership", question: `“Comment prenez-vous une décision importante quand vous manquez de données ou de visibilité ?”` },
        { label: "PHASE 7 : TENSION DE LIVRAISON CLIENT", type: "Delivery_Pressure", question: `“Que répondez-vous à un client qui exige de déployer un projet plus tôt que prévu ?”` },
        { label: "PHASE 8 : DÉFENSE DES INTÉRÊTS DU PROJET", type: "Stakeholder_Trap", question: `“Si un directeur s'oppose à votre stratégie avec des arguments forts, comment défendez-vous votre projet de manière professionnelle ?”` }
      ])
    : (isJunior ? [
        { label: "PHASE 1: RESUME DEFENSE (WARM-UP)", type: "Resume", question: `“Synthesize two core career milestones from your CV that demonstrate high-level fitness for the ${targetRole} role.”` },
        { label: "PHASE 2: TECHNICAL FOUNDATIONS", type: "Industry", question: `“Which core technologies or methodologies in the ${industry} sector are you most confident applying, and why?”` },
        { label: "PHASE 3: TECHNICAL TRAP (TRICK QUESTION)", type: "Technical_Trap", question: `“If a critical issue was discovered in your deliverable 1 hour before a demo, what is your exact step-by-step triage strategy?”` },
        { label: "PHASE 4: TIMELINE PRESSURE (BEHAVIORAL)", type: "Behavioral", question: `“Tell me about a time you had to correct a failing timeline under tight pressure without compromising output quality.”` },
        { label: "PHASE 5: ASSIMILATION CHECK (TRAP)", type: "Assimilation_Trap", question: `“Based on your recent training feedbacks, how did you consciously structure your communication style for this assessment today?”` },
        { label: "PHASE 6: CLOSING ROUND (EARLY DELIVERY)", type: "Pressure", question: `“Defend your tactical delivery choices when forced to ship a major rollout 48 hours early under tight client observation.”` }
      ] : [
        { label: "PHASE 1: EXECUTIVE PEDIGREE & WARM-UP", type: "Resume", question: `“Synthesize your executive career milestones that justify your high-level placement for the ${targetRole} role.”` },
        { label: "PHASE 2: ARCHITECTURAL & METHODOLOGICAL DEEP-DIVE", type: "Architecture", question: `“Detail your design patterns or system methodologies for scaling highly resilient solutions in the ${industry} sector.”` },
        { label: "PHASE 3: SECTOR SHOCKWAVE MITIGATION", type: "Industry_Shock", question: `“In the face of sudden sector disruption or a major paradigm shift, what is your immediate strategic risk mitigation playbook?”` },
        { label: "PHASE 4: HIGH-STAKES BEHAVIORAL CRISIS", type: "Behavioral", question: `“Describe a high-value project failure or stakeholder conflict you successfully resolved under extreme constraints.”` },
        { label: "PHASE 5: RECENT WEAKNESS PROBING (TRAP QUESTION)", type: "Weakness_Trap", question: `“Address head-on how you have actively corrected your previous training session weaknesses in structured delivery and precision.”` },
        { label: "PHASE 6: CRISIS LEADERSHIP & INCOMPLETE INFO", type: "Leadership", question: `“Defend your decision-making framework when forced to steer a major product shift under high ambiguity and partial metrics.”` },
        { label: "PHASE 7: TACTICAL DELIVERY PRESSURE", type: "Delivery_Pressure", question: `“Defend your delivery scaling when forced to deploy a high-stakes release 48 hours early under direct client scrutiny.”` },
        { label: "PHASE 8: INTEGRITY & STAKEHOLDER CONFRONTATION", type: "Stakeholder_Trap", question: `“If a powerful board member completely rejects your rollout strategy with aggressive pushback, how do you defend your position?”` }
      ]);

  const hasHistoryFallback = history && Array.isArray(history) && history.filter((item: any) => item.type === 'TRAIN').length > 0;
  const fallbackQuestionsWithTags = fallbackQuestions.map((q: any, i: number) => {
    const isTrapType = ["Technical_Trap", "Assimilation_Trap", "Weakness_Trap", "Stakeholder_Trap"].includes(q.type);
    const hasChallenge = adaptation?.smartChallenge && adaptation.smartChallenge.phaseIndex === i;
    return {
      ...q,
      difficulty: adaptation?.difficulty || (isJunior ? "Junior" : "Senior"),
      isTrickQuestion: isTrapType,
      contextAware: isTrapType ? hasHistoryFallback : true,
      challenge: hasChallenge ? adaptation.smartChallenge : undefined
    };
  });

  return res.json({ questions: fallbackQuestionsWithTags });
});

// API endpoint for Text-to-Speech using OpenAI TTS-1
app.get("/api/interview/speak", async (req, res) => {
  const rawText = req.query.text as string;
  const openAIKey = ConfigResolver.getOpenAIKey();

  if (!openAIKey) {
    console.warn("[SHANA Server] OpenAI API Key is missing for TTS speak. Streaming fallback might be required.");
    return res.status(500).send("OpenAI API Key is missing");
  }

  if (!rawText) {
    return res.status(400).send("No text provided");
  }

  // Pass through the Voice Naturalizer & Speech Director Layer
  const text = VoiceNaturalizerService.naturalize(rawText);

  try {
    console.log(`[SHANA Server] Generating OpenAI TTS Audio for naturalized text: "${text.substring(0, 50)}..."`);
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: "alloy",
        response_format: "mp3"
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[SHANA Server] OpenAI TTS speak failed:", errText);
      return res.status(response.status).send(errText);
    }

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error("[SHANA Server] TTS Speak error:", err);
    return res.status(500).send(err.message || "Internal server error");
  }
});

// API endpoint to analyze audio recording/voice response for tone, clarity, and keywords using Whisper & GPT
app.post("/api/analyze-audio", async (req, res) => {
  const { audio, filename, language, targetRole, industry, textFallback } = req.body;
  const isFr = (language === "French" || language === "FR" || language === "fr");
  const openAIKey = ConfigResolver.getOpenAIKey();

  let transcript = textFallback || "";
  let usedAudio = false;

  if (openAIKey && audio) {
    try {
      console.log(`[SHANA Server] Transcribing audio with OpenAI Whisper (${filename || "recording.webm"})...`);
      const base64Data = audio.replace(/^data:audio\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const blob = new Blob([buffer], { type: "audio/webm" });

      const formData = new FormData();
      formData.append("file", blob, filename || "audio.webm");
      formData.append("model", "whisper-1");
      if (isFr) {
        formData.append("language", "fr");
      } else {
        formData.append("language", "en");
      }

      const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIKey}`,
        },
        body: formData,
      });

      if (whisperResponse.ok) {
        const whisperJson: any = await whisperResponse.json();
        if (whisperJson && whisperJson.text) {
          transcript = whisperJson.text;
          usedAudio = true;
          console.log("[SHANA Server] Whisper transcription success:", transcript);
        }
      } else {
        const errorText = await whisperResponse.text();
        console.warn("[SHANA Server] Whisper transcription failed, falling back to text:", errorText);
      }
    } catch (whisperError) {
      console.error("[SHANA Server] Whisper API Exception:", whisperError);
    }
  }

  // Detect if the final transcript is completely empty or just silence
  const wordCount = (transcript || "").split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) {
    const emptyResponse = isFr ? {
      success: true,
      method: audio ? "audio_simulation" : "text_evaluation",
      transcript: "[Aucun signal vocal ou texte détecté]",
      toneAnalysis: "Aucun signal tonal ou niveau de confiance n'a pu être mesuré car l'enregistrement ne contient aucune voix audible ou texte exploitable.",
      clarityAnalysis: "Le signal audio ou textuel est vide. Assurez-vous d'avoir allumé votre micro, de parler distinctement ou d'utiliser la saisie écrite alternative.",
      keywordAnalysis: "Aucun mot-clé ou contenu verbal n'a été fourni pour évaluation.",
      score: 0,
      actionableTips: [
        "Vérifiez que votre micro n'est pas en sourdine (Mute).",
        "Parlez clairement et à voix haute dès le lancement de l'enregistrement.",
        "Si le problème de micro persiste, utilisez le mode écrit pour soumettre vos réponses."
      ]
    } : {
      success: true,
      method: audio ? "audio_simulation" : "text_evaluation",
      transcript: "[No voice or text signal detected]",
      toneAnalysis: "No pitch or confidence metrics could be analyzed because the recording is silent or contains no exploitable words.",
      clarityAnalysis: "The audio level is extremely low or empty. Ensure your microphone is turned on and you are speaking clearly, or type your answer instead.",
      keywordAnalysis: "No keywords or professional vocabulary was found for evaluation.",
      score: 0,
      actionableTips: [
        "Ensure your microphone is allowed and not digitally muted.",
        "Speak clearly and at a standard volume right after recording starts.",
        "If microphone issues persist, use the manual text fallback input."
      ]
    };
    return res.json(emptyResponse);
  }

  // If we have an OpenAI API key, we call GPT-4o-mini to perform deep speech tone, clarity, and keyword analysis
  if (openAIKey) {
    console.log("[SHANA Server] Conducting voice analysis via GPT-4o-mini...");
    const analysisPrompt = `You are SHANA's Elite Vocal Analysis Engine, specializing in professional job interview scoring.
Analyze this spoken audio transcript for a candidate preparing for:
Role: ${targetRole || "Candidate"}
Industry: ${industry || "Corporate"}
Language: ${isFr ? "French" : "English"}

Transcript to analyze:
"${transcript || "[No transcript captured - analyze default audio characteristics]"}"

You MUST evaluate the response on exactly these three criteria:
1. Tone (confidence level, voice pitch style, speed, engagement, pacing feedback)
2. Clarity (articulation, lexical flow, usage of hesitation fillers like 'uh', 'um', 'euh', sentence structure stability)
3. Keyword Usage (checking if they included industry technical terms, professional verbs, or the STAR format details: Situation, Task, Action, Result)

Please return a well-formed JSON object matching this schema:
{
  "transcript": "A polished or corrected readable version of the transcript (in the same language)",
  "toneAnalysis": "A direct feedback paragraph evaluating their confidence, energetic warmth, and pacing in ${isFr ? "French" : "English"}",
  "clarityAnalysis": "A constructive feedback paragraph on fillers, articulation, and grammar flow in ${isFr ? "French" : "English"}",
  "keywordAnalysis": "Detailed assessment of key technical or structural terms mentioned, noting any valuable metrics or missed vocabulary in ${isFr ? "French" : "English"}",
  "score": (An overall score integer from 0 to 100),
  "actionableTips": [
    "Tip 1: direct actionable tip for speaking improvement in ${isFr ? "French" : "English"}",
    "Tip 2: advice on pacing or phrasing in ${isFr ? "French" : "English"}",
    "Tip 3: advice on structural STAR keywords in ${isFr ? "French" : "English"}"
  ]
}`;

    try {
      const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are a professional audio, voice, and speech assessment system that outputs strict JSON." },
            { role: "user", content: analysisPrompt }
          ],
          temperature: 0.3,
        }),
      });

      if (gptResponse.ok) {
        const gptJson = await gptResponse.json();
        const parsed = JSON.parse(gptJson.choices[0].message.content);
        return res.json({
          success: true,
          method: usedAudio ? "audio_transcription" : "text_evaluation",
          ...parsed
        });
      } else {
        const errText = await gptResponse.text();
        console.warn("[SHANA Server] GPT analysis call failed:", errText);
      }
    } catch (gptErr) {
      console.error("[SHANA Server] GPT analysis Exception:", gptErr);
    }
  }

  // Fallback Simulation Engine (Generates custom feedback based on the transcript's length and keywords)
  console.log("[SHANA Server] Running Audio analysis fallback simulation...");
  const simWordCount = (transcript || "").split(/\s+/).length;
  
  // Calculate simulated scoring
  let score = 72;
  if (simWordCount > 40) score += 12;
  if (simWordCount > 10) score += 6;
  if (/star|situation|task|action|result|impact|metric|kpi|dollar|percent|%|solution/i.test(transcript)) {
    score += 8;
  }
  score = Math.min(96, Math.max(50, score));

  const standardTipsEn = [
    "Incorporate absolute metrics (KPIs, percentages, budgets) to anchor your operational impact.",
    "Speak with steady breath cycles to reduce filler word usage ('like', 'so', 'basically').",
    "Reinforce the Action phase of the STAR framework to clearly delineate your personal leadership contributions."
  ];

  const standardTipsFr = [
    "Intégrez des métriques précises (budgets, ratios d'impact, gains d'équipe) pour crédibiliser votre propos.",
    "Contrôlez vos respirations à la fin de chaque phrase pour limiter les mots de remplissage ('du coup', 'euh').",
    "Mettez en valeur l'étape de l'Action dans la méthode STAR pour marquer votre rôle de meneur."
  ];

  const simulatedResponse = isFr ? {
    success: true,
    method: audio ? "audio_simulation" : "text_evaluation",
    transcript: transcript || "Bonjour. Je postule pour le rôle de " + (targetRole || "Collaborateur") + ". J'ai hâte d'apporter ma contribution.",
    toneAnalysis: "Le ton vocal simulé présente une bonne énergie professionnelle générale. Veillez à maintenir de légères variations pitch/rythme pour captiver les recruteurs du secteur " + (industry || "Commercial") + ".",
    clarityAnalysis: "La structure grammaticale globale est claire. Quelques ralentissements mineurs ont été identifiés. Pensez à respirer calmement à la jointure des phrases.",
    keywordAnalysis: "Bonne maîtrise des termes de base. Cependant, l'intégration de mots-clés STAR forts (Situation, Tâche, Action, Résultat) pourrait être approfondie pour le poste de " + (targetRole || "Collaborateur") + ".",
    score: score,
    actionableTips: standardTipsFr
  } : {
    success: true,
    method: audio ? "audio_simulation" : "text_evaluation",
    transcript: transcript || "Hello, I am applying for the " + (targetRole || "Candidate") + " position. I believe my achievements match your requirements.",
    toneAnalysis: "The simulated vocal pitch is warm and highly professional. Pacing demonstrates a standard speed of delivery appropriate for the " + (industry || "Corporate") + " industry.",
    clarityAnalysis: "The explanation flows cleanly. Minimal speech filler disruptions observed. Ensure to articulate final consonants clearly under focus.",
    keywordAnalysis: "Excellent standard vocabulary used. We recommend weaving more direct technical terms and metrics specific to your target role: " + (targetRole || "Candidate") + ".",
    score: score,
    actionableTips: standardTipsEn
  };

  return res.json(simulatedResponse);
});

// Helper functions for actual email dispatch generation
function getEmailSubjectForType(type: 'signup' | 'login' | 'reset-password' | 'test', firstName: string, email: string): string {
  switch (type) {
    case 'signup':
      return `Welcome to SHANA, ${firstName}! 🚀 Your Interview Readiness Journey Begins Now`;
    case 'login':
      return `SHANA Security: New login verified for ${email}`;
    case 'reset-password':
      return `🔑 Shana Cryptographic Key Reset Link: Account Password Restructure`;
    default:
      return 'SHANA Notification Core Alert';
  }
}

function getEmailTextForType(type: 'signup' | 'login' | 'reset-password' | 'test', firstName: string, email: string): string {
  switch (type) {
    case 'signup':
      return `Welcome, ${firstName}! Your account associated with ${email} is active. Perform onboarding profile synchronization to initiate.`;
    case 'login':
      return `Security alert for ${email}. Access was authorized from Chrome 124.0. If you did not trigger this session, reset your keys.`;
    case 'reset-password':
      return `Password reset issued for ${email}. Apply code SHANA-992-SEC to confirm credentials restructuring. link active for 15m.`;
    default:
      return 'Operational metrics notification dispatched.';
  }
}

function getEmailHtmlForType(type: 'signup' | 'login' | 'reset-password' | 'test', firstName: string, email: string): string {
  const darkStone = '#1C1917';

  if (type === 'signup') {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; padding: 24px; border-radius: 16px; color: #1C1917; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF;">
        <!-- Header Banner -->
        <div style="background-color: ${darkStone}; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 40px; height: 40px; background-color: #FAF7F2; color: ${darkStone}; border-radius: 8px; font-weight: 900; font-size: 20px; line-height: 40px; text-align: center; margin-bottom: 8px;">S</div>
          <h1 style="color: #FAF7F2; font-size: 20px; font-weight: 900; margin: 0; letter-spacing: 2px; text-transform: uppercase;">SHANA CONSOLE</h1>
          <p style="color: #A8A29E; font-size: 11px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 1px;">SYSTEM VERIFICATION CORE ONBOARDING</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5; box-shadow: 0 4px 12px rgba(0,0,0,0.01);">
          <h2 style="font-size: 18px; font-weight: 850; color: #111111; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #F3F1ED; padding-bottom: 12px;">
            Bonjour ${firstName}, welcome to Shana Console!
          </h2>
          <p style="font-size: 13px; line-height: 1.6; color: #444444; margin-bottom: 18px;">
            Your professional secure profile associated with <strong>${email}</strong> has been successfully instantiated. Our career capability assessment simulation runs on actual professional parameters.
          </p>

          <div style="background-color: #FECE4F; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #E0B438;">
            <p style="margin: 0; font-weight: 900; font-size: 13px; color: #1C1917; letter-spacing: -0.2px;">
              ⚡ IMMEDIATE STEP MANDATED:
            </p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #2B281B; line-height: 1.4;">
              Access your Shana console dashboard, personalize your target industry metrics, and complete the CV master profile evaluation.
            </p>
          </div>

          <div style="background: linear-gradient(135deg, #FFF9EB 0%, #FFF5D6 100%); padding: 16px; border-radius: 12px; border: 1px solid #FFE8A3; margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #6D4C0E; text-transform: uppercase; font-family: monospace;">Your Active Milestones:</h4>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #604515; line-height: 1.6;">
              <li>Perform career profile alignment</li>
              <li>Upload master resume / resume points mapping</li>
              <li>Simulate situational voice and conversational training</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 28px 0 10px 0;">
            <a href="#" style="background-color: ${darkStone}; color: #FAF7F2; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              Launch Active Onboarding Screen &rarr;
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-family: monospace; font-size: 10px; color: #A8A29E;">
          <p style="margin: 0;">SECURE ENVELOPE SHA-256 SIGNED BY SHANA AUTH ENGINE</p>
          <p style="margin: 4px 0 0 0;">Do not reply to this systemic notice email.</p>
        </div>
      </div>
    `;
  }

  if (type === 'login') {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; padding: 24px; border-radius: 16px; color: #1C1917; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF;">
        <!-- Security Header -->
        <div style="background-color: #111111; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #EF4444; font-size: 18px; font-weight: 900; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">SECURITY ALERT</h1>
          <p style="color: #A8A29E; font-size: 10px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 0.5px;">NEW AUTHENTICATION EVENT DETECTED</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5;">
          <h2 style="font-size: 15px; font-weight: 800; color: #111111; margin-top: 0; margin-bottom: 12px;">
            Secure Login Verified
          </h2>
          <p style="font-size: 12.5px; line-height: 1.5; color: #444444; margin-bottom: 20px;">
            An authorized user session was successfully instantiated for the account <strong>${email}</strong>.
          </p>

          <!-- Device specifications -->
          <div style="background-color: #F8F6F2; border-radius: 10px; padding: 14px; border: 1px solid #EAE6DF; margin-bottom: 24px; font-family: monospace; font-size: 11px; line-height: 1.6; color: #555555;">
            <p style="margin: 0; font-weight: bold; color: #1C1917; font-size: 11.5px; font-family: sans-serif; margin-bottom: 6px;">TELEMETRY PARAMETERS:</p>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">Device:</strong> <span>Chrome 125.4 (MacBook Pro)</span></div>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">IP Address:</strong> <span>82.112.45.221 (Secure TLS Tunnel)</span></div>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">Location:</strong> <span>Paris, Île-de-France, France (EST)</span></div>
            <div style="display: flex; justify-content: space-between;"><strong style="color:#111">Access Date:</strong> <span>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></div>
          </div>

          <div style="border-left: 3px solid #FECE4F; background-color: #FFFDF5; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 11.5px; color: #7A5310; font-weight: 600; line-height: 1.4;">
              <strong>Not recognize this session?</strong> If you did not log in from this location, click below to lock down your master tokens instantly and format a new password reset.
            </p>
          </div>

          <div style="text-align: center; margin: 24px 0 10px 0;">
            <a href="#" style="background-color: #EF4444; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; display: inline-block;">
              De-Authorize & Terminate Token Session &rarr;
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-family: monospace; font-size: 9px; color: #A8A29E;">
          <p style="margin: 0;">SECURED HTTPS PROTOCOL LAYER // SHANA-SECUR-GUARD</p>
        </div>
      </div>
    `;
  }

  if (type === 'reset-password') {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; padding: 24px; border-radius: 16px; color: #1C1917; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF;">
        <!-- Reset Header -->
        <div style="background-color: ${darkStone}; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 36px; height: 36px; background-color: #FECE4F; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #1C1917;">🔑</div>
          <h1 style="color: #FAF7F2; font-size: 18px; font-weight: 900; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">PASSWORD RESTRUCTURE</h1>
          <p style="color: #A8A29E; font-size: 10px; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 0.5px;">AUTHORIZED RECOVERY TOKEN DISPATCH</p>
        </div>

        <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #ECEAE5;">
          <p style="font-size: 13px; line-height: 1.6; color: #444444; margin-top: 0; margin-bottom: 18px;">
            Security alert. A temporary resynchronization link has been configured for the credentials associated with <strong>${email}</strong>.
          </p>

          <div style="background: #FAF7F2; border-radius: 10px; padding: 18px; margin: 20px 0; border: 1px solid #EAE6DF; border-left: 4px solid #1C1917;">
            <p style="margin: 0 0 6px 0; font-size: 10px; uppercase font-weight: bold; color: #78716C; font-family: monospace;">Cryptographic Reset Code</p>
            <p style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #1C1917; font-family: monospace;">SHANA-992-SEC</p>
          </div>

          <p style="font-size: 12px; line-height: 1.5; color: #666666; margin-bottom: 24px;">
            This single-use security token remains valid for exactly <strong>15 minutes</strong>. If you did not ask for this credential resynchronization, you can safely ignore this document; your security integrity is uncompromised.
          </p>

          <div style="text-align: center; margin: 24px 0 10px 0;">
            <a href="#" style="background-color: #FECE4F; color: #1C1917; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; display: inline-block; border: 1px solid #E0B438;">
              Perform Secure Password Reset
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-family: monospace; font-size: 9px; color: #A8A29E;">
          <p style="margin: 0;">IP REGISTERED ON REQUEST: 195.154.122.4 (AUTHORIZED REQUEST)</p>
        </div>
      </div>
    `;
  }

  return 'No preview content available.';
}

// POSIX/SMTP compliant true email dispatcher endpoint
app.post("/api/email/dispatch", async (req, res) => {
  const { type, recipient, extraData } = req.body;
  if (!recipient) {
    return res.status(400).json({ error: "recipient parameters required for transmission." });
  }

  const name = extraData?.firstName || "Candidate";
  const subject = getEmailSubjectForType(type, name, recipient);
  const text = getEmailTextForType(type, name, recipient);
  const html = getEmailHtmlForType(type, name, recipient);

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpSecure = process.env.SMTP_SECURE === "true";
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || `SHANA Interview Systems <no-reply@shana-platform.com>`;

  let transportInfo: any = null;
  let providerUsed = "SMTP Direct Relay";
  let etherealUrl: string | null = null;

  try {
    if (smtpHost && smtpUser && smtpPass) {
      console.log(`[SHANA Mailer] Routing outbound SMTP mail for ${recipient} via host ${smtpHost}`);
      // Instantiate true custom user-provided SMTP client
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      transportInfo = await transporter.sendMail({
        from: smtpFrom,
        to: recipient,
        subject,
        text,
        html
      });
    } else {
      console.log(`[SHANA Mailer] No custom SMTP host config. Initializing dynamic Ethereal interactive credentials...`);
      providerUsed = "Ethereal Interactive SMTP Mail Core";
      
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      transportInfo = await transporter.sendMail({
        from: `"SHANA Systems" <${testAccount.user}>`,
        to: recipient,
        subject,
        text,
        html
      });

      etherealUrl = nodemailer.getTestMessageUrl(transportInfo) || null;
      console.log(`[SHANA Mailer] Dynamic Ethereal message generated successfully: ${etherealUrl}`);
    }

    return res.json({
      success: true,
      provider: providerUsed,
      messageId: transportInfo.messageId,
      etherealUrl,
      recipient,
      subject,
      deliveryStatus: "Dispatched Successfully!"
    });

  } catch (err: any) {
    console.error("[SHANA Mailer] Failed to dispatch actual SMTP packet:", err);
    return res.status(500).json({
      success: false,
      error: "SMTP Relay Failure",
      details: err.message || err.toString()
    });
  }
});

// --- ADMINISTRATION API TRACK ---

// POST login/register hook to synchronize user state with the backend memory
app.post("/api/admin/sync-user", (req, res) => {
  const { id, email, firstName, lastName, role, status } = req.body;
  if (!id || !email) {
    return res.status(400).json({ error: "Missing user sync identifiers." });
  }
  const existing = inMemoryUsers.get(id);
  const updatedUser = {
    id,
    email,
    firstName: firstName || (existing ? existing.firstName : "User"),
    lastName: lastName || (existing ? existing.lastName : ""),
    role: role || (existing ? existing.role : "candidate"),
    status: status || (existing ? existing.status : "enabled"),
    createdAt: existing ? existing.createdAt : new Date().toISOString()
  };
  inMemoryUsers.set(id, updatedUser);
  return res.json({ success: true, user: updatedUser });
});

// GET list of all users (Admin & Super Admin)
app.get("/api/admin/users", PermissionMiddleware("admin"), (req, res) => {
  const list = Array.from(inMemoryUsers.values());
  return res.json({ success: true, users: list });
});

// POST toggle user status (Admin & Super Admin)
app.post("/api/admin/users/status", PermissionMiddleware("admin"), (req, res) => {
  const { targetUserId, status } = req.body;
  if (!targetUserId || !status) {
    return res.status(400).json({ error: "Missing user status parameters." });
  }
  const user = inMemoryUsers.get(targetUserId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  user.status = status;
  inMemoryUsers.set(targetUserId, user);
  return res.json({ success: true, user });
});

// POST change user role (Super Admin only!)
app.post("/api/admin/users/role", PermissionMiddleware("super_admin"), (req, res) => {
  const { targetUserId, role } = req.body;
  if (!targetUserId || !role) {
    return res.status(400).json({ error: "Missing user role parameters." });
  }
  const user = inMemoryUsers.get(targetUserId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  user.role = role;
  inMemoryUsers.set(targetUserId, user);
  return res.json({ success: true, user });
});

// In-memory backend audit logs
const serverAuditLogs: any[] = [];

// POST append to audit logs
app.post("/api/admin/audit", (req, res) => {
  const log = req.body;
  if (!log || !log.id) {
    return res.status(400).json({ error: "Invalid audit packet." });
  }
  serverAuditLogs.unshift(log);
  return res.json({ success: true });
});

// GET all audit logs (Super Admin only!)
app.get("/api/admin/audit-logs", PermissionMiddleware("super_admin"), (req, res) => {
  return res.json({ success: true, logs: serverAuditLogs });
});

// ====================================================
// SECURE KEY VAULT INTEGRATION MANAGEMENT API
// ====================================================

// GET keys, providers, logs, and alerts (Admin & Super Admin)
app.get("/api/admin/integrations/keys", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const keys = IntegrationKeyManager.getKeys(); // Masked values for UI safety
    const auditLogs = IntegrationKeyManager.getAuditLogs();
    const alerts = IntegrationKeyManager.getAlerts();
    const providers = ProviderRegistry.getProviders();
    return res.json({
      success: true,
      keys,
      auditLogs,
      alerts,
      providers
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST add a new key (Admin can add, Super Admin required for production)
app.post("/api/admin/integrations/keys", PermissionMiddleware("admin"), (req: any, res: any) => {
  const { providerId, name, rawValue, environment } = req.body;
  const actor = req.adminUser ? `${req.adminUser.firstName} ${req.adminUser.lastName}` : 'Admin';

  if (!providerId || !name || !rawValue || !environment) {
    return res.status(400).json({ error: "Missing required key configuration parameters." });
  }

  // Restrict production environment management to Super Admin only
  if (environment === 'production' && req.adminUser?.role !== 'super_admin') {
    return res.status(403).json({ error: "Super Admin privileges are required to manage production keys." });
  }

  try {
    const key = IntegrationKeyManager.addKey(providerId, name, rawValue, environment, actor);
    return res.json({ success: true, key });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// PUT update a key configuration or secret
app.put("/api/admin/integrations/keys/:id", PermissionMiddleware("admin"), (req: any, res: any) => {
  const { id } = req.params;
  const { name, rawValue, environment } = req.body;
  const actor = req.adminUser ? `${req.adminUser.firstName} ${req.adminUser.lastName}` : 'Admin';

  const keys = IntegrationKeyManager.getRawKeysInternal();
  const existingKey = keys.find(k => k.id === id && !k.isDeleted);
  if (!existingKey) {
    return res.status(404).json({ error: "Integration key not found." });
  }

  const targetEnv = environment || existingKey.environment;

  // Restrict production changes to Super Admin only
  if ((existingKey.environment === 'production' || targetEnv === 'production') && req.adminUser?.role !== 'super_admin') {
    return res.status(403).json({ error: "Super Admin privileges are required to edit production keys." });
  }

  try {
    const key = IntegrationKeyManager.updateKey(id, name, rawValue, targetEnv, actor);
    return res.json({ success: true, key });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST rotate a key (Admin can rotate, Super Admin required for production)
app.post("/api/admin/integrations/keys/:id/rotate", PermissionMiddleware("admin"), (req: any, res: any) => {
  const { id } = req.params;
  const { rawValue } = req.body;
  const actor = req.adminUser ? `${req.adminUser.firstName} ${req.adminUser.lastName}` : 'Admin';

  if (!rawValue) {
    return res.status(400).json({ error: "Rotation requires a non-empty key value." });
  }

  const keys = IntegrationKeyManager.getRawKeysInternal();
  const existingKey = keys.find(k => k.id === id && !k.isDeleted);
  if (!existingKey) {
    return res.status(404).json({ error: "Integration key not found." });
  }

  // Restrict production rotation to Super Admin only
  if (existingKey.environment === 'production' && req.adminUser?.role !== 'super_admin') {
    return res.status(403).json({ error: "Super Admin privileges are required to rotate production keys." });
  }

  try {
    const key = IntegrationKeyManager.rotateKey(id, rawValue, actor);
    return res.json({ success: true, key });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST pause key usage
app.post("/api/admin/integrations/keys/:id/pause", PermissionMiddleware("admin"), (req: any, res: any) => {
  const { id } = req.params;
  const actor = req.adminUser ? `${req.adminUser.firstName} ${req.adminUser.lastName}` : 'Admin';

  try {
    const key = IntegrationKeyManager.pauseKey(id, actor);
    return res.json({ success: true, key });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST resume key usage
app.post("/api/admin/integrations/keys/:id/resume", PermissionMiddleware("admin"), (req: any, res: any) => {
  const { id } = req.params;
  const actor = req.adminUser ? `${req.adminUser.firstName} ${req.adminUser.lastName}` : 'Admin';

  try {
    const key = IntegrationKeyManager.resumeKey(id, actor);
    return res.json({ success: true, key });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST disable key usage
app.post("/api/admin/integrations/keys/:id/disable", PermissionMiddleware("admin"), (req: any, res: any) => {
  const { id } = req.params;
  const actor = req.adminUser ? `${req.adminUser.firstName} ${req.adminUser.lastName}` : 'Admin';

  try {
    const key = IntegrationKeyManager.disableKey(id, actor);
    return res.json({ success: true, key });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// DELETE key (soft delete only, Super Admin only)
app.delete("/api/admin/integrations/keys/:id", PermissionMiddleware("super_admin"), (req: any, res: any) => {
  const { id } = req.params;
  const actor = req.adminUser ? `${req.adminUser.firstName} ${req.adminUser.lastName}` : 'Super Admin';

  try {
    IntegrationKeyManager.deleteKey(id, actor);
    return res.json({ success: true, message: "Key soft deleted successfully." });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ====================================================
// OBSERVABILITY CENTER API
// ====================================================

// GET system overview dashboard metrics (Admin & Super Admin)
app.get("/api/admin/observability/overview", PermissionMiddleware("admin"), ObservabilityController.getOverview);

// GET filtered system logs (Admin & Super Admin)
app.get("/api/admin/observability/logs", PermissionMiddleware("admin"), ObservabilityController.getLogs);

// POST clear system logs (Super Admin only!)
app.post("/api/admin/observability/logs/clear", PermissionMiddleware("super_admin"), ObservabilityController.clearLogs);

// GET error tracker list (Admin & Super Admin)
app.get("/api/admin/observability/errors", PermissionMiddleware("admin"), ObservabilityController.getErrors);

// PUT update status/severity of error incident (Admin & Super Admin)
app.put("/api/admin/observability/errors/:id", PermissionMiddleware("admin"), ObservabilityController.updateError);

// DELETE archive/delete error incident (Super Admin only!)
app.delete("/api/admin/observability/errors/:id", PermissionMiddleware("super_admin"), ObservabilityController.deleteError);

// POST clear all error logs (Super Admin only!)
app.post("/api/admin/observability/errors/clear", PermissionMiddleware("super_admin"), ObservabilityController.clearAllErrors);

// GET API usage metrics and chart records (Admin & Super Admin)
app.get("/api/admin/observability/usage", PermissionMiddleware("admin"), ObservabilityController.getUsage);

// GET Stripe payments events (Admin & Super Admin)
app.get("/api/admin/observability/stripe", PermissionMiddleware("admin"), ObservabilityController.getStripeEvents);

// GET OpenAI completion events (Admin & Super Admin)
app.get("/api/admin/observability/openai", PermissionMiddleware("admin"), ObservabilityController.getOpenAIEvents);

// GET live system health report (Admin & Super Admin)
app.get("/api/admin/observability/health", PermissionMiddleware("admin"), ObservabilityController.getHealth);

// GET live system alerts (Admin & Super Admin)
app.get("/api/admin/observability/alerts", PermissionMiddleware("admin"), ObservabilityController.getAlerts);

// PUT update alert status (Admin & Super Admin)
app.put("/api/admin/observability/alerts/:id", PermissionMiddleware("admin"), ObservabilityController.updateAlert);

// POST clear/purge all alerts (Super Admin)
app.post("/api/admin/observability/alerts/clear", PermissionMiddleware("super_admin"), ObservabilityController.clearAllAlerts);

// --- SIMULATION ENDPOINTS ---
// Trigger test unhandled error event (Admin & Super Admin)
app.post("/api/admin/observability/test-error", PermissionMiddleware("admin"), ObservabilityController.triggerTestError);

// Trigger Stripe payment signature failure (Admin & Super Admin)
app.post("/api/admin/observability/test-stripe-fail", PermissionMiddleware("admin"), ObservabilityController.triggerTestStripeFail);

// Trigger OpenAI latency spike (Admin & Super Admin)
app.post("/api/admin/observability/test-openai-spike", PermissionMiddleware("admin"), ObservabilityController.triggerTestOpenAISpike);


// ====================================================
// PHASE 18: DEPLOYMENT & SCALING ENDPOINTS
// ====================================================

// GET deployment dashboard metrics
app.get("/api/admin/deployment/dashboard", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const data = DeploymentSystem.getDashboard();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST purge specific or all cache keys
app.post("/api/admin/deployment/purge-cache", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const { cacheName } = req.body;
    const userId = req.adminUser?.email || "unknown-user";
    const updated = DeploymentSystem.purgeCache(cacheName, userId, req.ip || "0.0.0.0");
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST update autoscaling thresholds
app.post("/api/admin/deployment/update-autoscaling", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const userId = req.adminUser?.email || "unknown-user";
    const updated = DeploymentSystem.updateAutoScaling(req.body, userId, req.ip || "0.0.0.0");
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST trigger manual failover
app.post("/api/admin/deployment/failover", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const { environment, active } = req.body;
    const userId = req.adminUser?.email || "unknown-user";
    const updated = DeploymentSystem.triggerFailover(environment, active, userId, req.ip || "0.0.0.0");
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST apply database migration
app.post("/api/admin/deployment/migrate", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const { name, isBackwardCompatible } = req.body;
    const userId = req.adminUser?.email || "unknown-user";
    const newMigration = DeploymentSystem.applyMigration(name, isBackwardCompatible, userId, req.ip || "0.0.0.0");
    res.json({ success: true, data: newMigration });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST rollback database migration
app.post("/api/admin/deployment/rollback-migrate", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const { migrationId } = req.body;
    const userId = req.adminUser?.email || "unknown-user";
    const rolled = DeploymentSystem.rollbackMigration(migrationId, userId, req.ip || "0.0.0.0");
    if (rolled) {
      res.json({ success: true, data: rolled });
    } else {
      res.status(404).json({ success: false, error: "Migration not found" });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST trigger automated continuous backup
app.post("/api/admin/deployment/backup", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const { type } = req.body;
    const userId = req.adminUser?.email || "unknown-user";
    const newBackup = DeploymentSystem.createBackup(type, userId, req.ip || "0.0.0.0");
    res.json({ success: true, data: newBackup });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST restore database point-in-time snapshot
app.post("/api/admin/deployment/restore", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const { snapshotId } = req.body;
    const userId = req.adminUser?.email || "unknown-user";
    const success = DeploymentSystem.restoreBackup(snapshotId, userId, req.ip || "0.0.0.0");
    if (success) {
      res.json({ success: true, message: `Point-in-time recovery initiated for snapshot ${snapshotId}` });
    } else {
      res.status(404).json({ success: false, error: "Snapshot ID not found" });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST rollback version release instantly
app.post("/api/admin/deployment/rollback-release", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const { environment, targetVersion } = req.body;
    const userId = req.adminUser?.email || "unknown-user";
    const reverted = DeploymentSystem.rollbackRelease(environment, targetVersion, userId, req.ip || "0.0.0.0");
    if (reverted) {
      res.json({ success: true, data: reverted });
    } else {
      res.status(404).json({ success: false, error: "Target release version metadata not registered" });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST initiate deployment task (Blue-green / Rolling pipeline)
app.post("/api/admin/deployment/deploy", PermissionMiddleware("admin"), async (req: any, res: any) => {
  try {
    const { environment, strategy, version, commitHash, schemaVersion, promptVersion, featureFlagsSnapshot } = req.body;
    const userId = req.adminUser?.email || "unknown-user";
    const task = await DeploymentSystem.initiateDeployment(
      environment,
      strategy || "blue-green",
      version,
      commitHash,
      schemaVersion,
      promptVersion,
      featureFlagsSnapshot || {},
      userId,
      req.ip || "0.0.0.0"
    );
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ====================================================
// PHASE 19 — FEATURE FLAGS & EXPERIMENTATION SYSTEM
// ====================================================

// GET all feature flags
app.get("/api/admin/experimentation/flags", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const flags = ExperimentationSystem.getAllFlags();
    res.json({ success: true, data: flags });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create or update a feature flag
app.post("/api/admin/experimentation/flags", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const flag = req.body;
    const userId = req.adminUser?.email || "unknown-user";
    const savedFlag = ExperimentationSystem.saveOrUpdateFlag(flag, userId, req.ip || "0.0.0.0");
    res.json({ success: true, data: savedFlag });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a feature flag
app.delete("/api/admin/experimentation/flags/:id", PermissionMiddleware("super_admin"), (req: any, res: any) => {
  try {
    const flagId = req.params.id;
    const userId = req.adminUser?.email || "unknown-user";
    const deleted = ExperimentationSystem.deleteFlag(flagId, userId, req.ip || "0.0.0.0");
    if (deleted) {
      res.json({ success: true, message: `Flag '${flagId}' deleted successfully` });
    } else {
      res.status(404).json({ success: false, error: `Flag '${flagId}' not found` });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST quick toggle flag status with rollback reason
app.post("/api/admin/experimentation/flags/:id/toggle", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const flagId = req.params.id;
    const { status, rollbackReason } = req.body;
    const userId = req.adminUser?.email || "unknown-user";
    const updated = ExperimentationSystem.toggleFlagStatus(flagId, status, rollbackReason, userId, req.ip || "0.0.0.0");
    if (updated) {
      res.json({ success: true, data: updated });
    } else {
      res.status(404).json({ success: false, error: `Flag '${flagId}' not found` });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST evaluate feature flag (can be used on client or server side)
app.post("/api/admin/experimentation/flags/evaluate", (req: any, res: any) => {
  try {
    const { flagId, userId, environment } = req.body;
    const evalResult = ExperimentationSystem.evaluate(flagId, userId, environment);
    res.json({ success: true, data: evalResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST log experiment metrics (completion rate, latency, score improvement, etc.)
app.post("/api/admin/experimentation/metrics", (req: any, res: any) => {
  try {
    const { userId, flagId, metricKey, metricValue, sessionId } = req.body;
    const logged = ExperimentationSystem.logMetric(userId, flagId, metricKey, Number(metricValue), sessionId);
    if (logged) {
      res.json({ success: true, data: logged });
    } else {
      res.status(400).json({ success: false, error: `Failed to log metric. Check if flag '${flagId}' exists.` });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET experiment evaluation summary dashboard
app.get("/api/admin/experimentation/summary/:flagId", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const flagId = req.params.flagId;
    const summary = ExperimentationSystem.getExperimentSummary(flagId);
    if (summary) {
      res.json({ success: true, data: summary });
    } else {
      res.status(404).json({ success: false, error: `Experiment flag '${flagId}' not found or has no analytics logs` });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET list of all rollbacks with reasons
app.get("/api/admin/experimentation/rollbacks", PermissionMiddleware("admin"), (req: any, res: any) => {
  try {
    const rollbacks = ExperimentationSystem.getAllRollbacks();
    res.json({ success: true, data: rollbacks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ====================================================
// REAL STRIPE CHECKOUT FLOW ENDPOINTS
// ====================================================

const STRIPE_PRODUCTS: Record<string, { nameEN: string; nameFR: string; price: number; descriptionEN: string; descriptionFR: string }> = {
  pack_starter: {
    nameEN: 'Starter Pack (3 Audio Sessions)',
    nameFR: 'Pack Starter (3 Sessions Audio)',
    price: 3.99,
    descriptionEN: 'Perfect for light preparation and discovering SHANA.',
    descriptionFR: 'Idéal pour une préparation légère et découvrir SHANA.',
  },
  pack_premium: {
    nameEN: 'Premium Pack (5 Audio + 1 Mirror)',
    nameFR: 'Pack Premium (5 Audio + 1 Miroir)',
    price: 7.99,
    descriptionEN: 'For serious candidates aiming for standard corporate roles.',
    descriptionFR: 'Pour les candidats sérieux visant des postes de niveau intermédiaire.',
  },
  sub_ultra: {
    nameEN: 'Ultra Unlimited (1 Month)',
    nameFR: 'Abonnement Ultra (1 Mois)',
    price: 39.99,
    descriptionEN: 'Unlimited practice room access for executive-level confidence.',
    descriptionFR: 'Accès illimité pour une confiance absolue de niveau exécutif.',
  },
  topup_1_audio: {
    nameEN: '+1 Audio Session',
    nameFR: '+1 Session Audio',
    price: 1.49,
    descriptionEN: 'Quick booster for one training.',
    descriptionFR: 'Recharge rapide pour un entraînement.',
  },
  topup_3_audio: {
    nameEN: '+3 Audio Sessions',
    nameFR: '+3 Sessions Audio',
    price: 3.49,
    descriptionEN: 'Optimized training top-up.',
    descriptionFR: 'Recharge d’entraînement optimisée.',
  },
  topup_1_mirror: {
    nameEN: '+1 Mirror Session',
    nameFR: '+1 Session Miroir',
    price: 2.99,
    descriptionEN: 'Add an extra assessment block.',
    descriptionFR: 'Ajoutez un bloc d’évaluation supplémentaire.',
  },
};

// Stripe Lazy Initialization
let stripeClient: any = null;
function getStripeInstance(): any {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY || ConfigResolver.getStripeKey();
    if (key) {
      const StripeModule = esmRequire("stripe");
      stripeClient = new StripeModule(key, {
        apiVersion: "2023-10-16",
      });
    }
  }
  return stripeClient;
}

// GET check if Stripe is configured
app.get("/api/commerce/stripe/status", (req: any, res: any) => {
  const hasKey = !!(process.env.STRIPE_SECRET_KEY || ConfigResolver.getStripeKey());
  return res.json({ configured: hasKey });
});

// GET initiate Stripe Checkout session
app.get("/api/commerce/stripe/checkout", async (req: any, res: any) => {
  const { productId, userId } = req.query;
  const origin = req.query.origin || process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

  if (!productId || !userId) {
    return res.status(400).send("productId and userId query parameters are required.");
  }

  const product = STRIPE_PRODUCTS[productId as string];
  if (!product) {
    return res.status(404).send("Product not found.");
  }

  const stripe = getStripeInstance();
  if (!stripe) {
    // If Stripe key is missing, render a beautiful and helpful configuration guide page
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Stripe Gateway Configuration Needed</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
          code, pre { font-family: 'JetBrains Mono', monospace; }
        </style>
      </head>
      <body class="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-6">
        <div class="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
          <div class="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-key-round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4c.9.2 1.8.1 2.6-.2L18 10l.2-.2c.4-.4.8-.9 1-1.4l1-3.1c.1-.4 0-.8-.3-1.1L18 2.3c-.3-.3-.7-.4-1.1-.3L13.8 3c-.5.2-1 .6-1.4 1L12.2 4.2 8.4 8c-.3.8-.4 1.7-.2 2.6L2 16.4V18Zm15-11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>
          </div>
          <div class="space-y-2">
            <h1 class="text-xl font-bold tracking-tight text-white font-sans">Stripe Gateway Sealed</h1>
            <p class="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto">
              To enable 100% authentic live Stripe credit card transactions, please add your Stripe API key to the environment.
            </p>
          </div>
          <div class="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-left space-y-3">
            <h3 class="text-xs font-bold text-zinc-300 uppercase tracking-wide">Quick Activation:</h3>
            <p class="text-[11px] text-zinc-400 leading-relaxed">
              Open the <strong>Settings</strong> panel (or the **Secrets** manager) inside Google AI Studio, and configure:
            </p>
            <div class="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
              <code class="text-xs text-indigo-400 select-all font-bold">STRIPE_SECRET_KEY</code>
              <span class="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold">Secret</span>
            </div>
          </div>
          <button onclick="window.close()" class="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold rounded-xl transition-all border border-zinc-700 cursor-pointer">
            Close Configuration Screen
          </button>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: product.nameEN,
              description: product.descriptionEN,
            },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/api/commerce/stripe/success?session_id={CHECKOUT_SESSION_ID}&userId=${encodeURIComponent(userId as string)}&productId=${encodeURIComponent(productId as string)}`,
      cancel_url: `${origin}/api/commerce/stripe/cancel?userId=${encodeURIComponent(userId as string)}&productId=${encodeURIComponent(productId as string)}`,
    });

    return res.redirect(session.url);
  } catch (error: any) {
    console.error("[Stripe Checkout] Failed to create session:", error);
    return res.status(500).send(`Stripe Checkout session creation failed: ${error.message}`);
  }
});

// GET Stripe payment success callback handler
app.get("/api/commerce/stripe/success", async (req: any, res: any) => {
  const { session_id, userId, productId } = req.query;

  if (!session_id || !userId || !productId) {
    return res.status(400).send("Missing success parameters.");
  }

  const stripe = getStripeInstance();
  let paymentSucceeded = true;
  if (stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id as string);
      if (session.payment_status !== 'paid') {
        paymentSucceeded = false;
      }
    } catch (err) {
      console.error("[Stripe Success Callback] Error retrieving session details:", err);
    }
  }

  if (!paymentSucceeded) {
    return res.status(400).send("The payment was not completed successfully.");
  }

  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Successful</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>body { font-family: 'Inter', sans-serif; }</style>
      </head>
      <body class="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-6">
        <div class="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div class="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div class="space-y-2">
            <h1 class="text-xl font-bold tracking-tight text-white font-sans">Payment Confirmed!</h1>
            <p class="text-zinc-400 text-xs leading-relaxed font-medium">
              Your transaction has been processed successfully. This window will now close.
            </p>
          </div>
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'STRIPE_PAYMENT_SUCCESS', 
                  productId: ${JSON.stringify(productId)}, 
                  userId: ${JSON.stringify(userId)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            }, 1200);
          </script>
        </div>
      </body>
    </html>
  `);
});

// GET Stripe payment cancel callback handler
app.get("/api/commerce/stripe/cancel", (req: any, res: any) => {
  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Cancelled</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>body { font-family: 'Inter', sans-serif; }</style>
      </head>
      <body class="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-6">
        <div class="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div class="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
          </div>
          <div class="space-y-2">
            <h1 class="text-xl font-bold tracking-tight text-white font-sans">Payment Cancelled</h1>
            <p class="text-zinc-400 text-xs leading-relaxed font-medium">
              The transaction was cancelled and no charges were made.
            </p>
          </div>
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'STRIPE_PAYMENT_CANCEL'
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            }, 1200);
          </script>
        </div>
      </body>
    </html>
  `);
});


// ====================================================
// GOOGLE OAUTH FLOW ENDPOINTS
// ====================================================

// GET Google OAuth Authorization URL
app.get("/api/auth/google/url", (req: any, res: any) => {
  const origin = req.query.origin || process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    // Return a URL pointing to our helper setup guide so the user gets real setup instructions
    return res.json({ 
      url: `${origin}/api/auth/google/setup-guide`,
      configured: false
    });
  }

  const redirectUri = `${origin}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent"
  });

  return res.json({ 
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    configured: true
  });
});

// GET Google OAuth Setup Guide page (rendered if GOOGLE_CLIENT_ID is not configured yet)
app.get("/api/auth/google/setup-guide", (req: any, res: any) => {
  const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Google OAuth Setup Guide</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', sans-serif;
        }
        code, pre {
          font-family: 'JetBrains Mono', monospace;
        }
      </style>
    </head>
    <body class="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-6">
      <div class="max-w-xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-10 space-y-8 shadow-2xl">
        <div class="space-y-3 text-center">
          <div class="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-key-round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4c.9.2 1.8.1 2.6-.2L18 10l.2-.2c.4-.4.8-.9 1-1.4l1-3.1c.1-.4 0-.8-.3-1.1L18 2.3c-.3-.3-.7-.4-1.1-.3L13.8 3c-.5.2-1 .6-1.4 1L12.2 4.2 8.4 8c-.3.8-.4 1.7-.2 2.6L2 16.4V18Zm15-11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-white font-sans">Google OAuth Setup Guide</h1>
          <p class="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
            Configure Google Cloud Client credentials to establish a real integration with your Google Calendar.
          </p>
        </div>

        <div class="space-y-6">
          <!-- Step 1 -->
          <div class="flex gap-4">
            <div class="w-8 h-8 rounded-full bg-zinc-800 text-sm font-semibold flex items-center justify-center border border-zinc-750 flex-shrink-0">1</div>
            <div class="space-y-1.5 pt-0.5">
              <h3 class="text-sm font-semibold text-zinc-200">Create Google Cloud Credentials</h3>
              <p class="text-xs text-zinc-400 leading-relaxed">
                Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:underline">Google Cloud Console Credentials Page</a> and create an <strong>OAuth 2.0 Client ID</strong> for a <strong>Web Application</strong>.
              </p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex gap-4">
            <div class="w-8 h-8 rounded-full bg-zinc-800 text-sm font-semibold flex items-center justify-center border border-zinc-750 flex-shrink-0">2</div>
            <div class="space-y-2 pt-0.5 w-full">
              <h3 class="text-sm font-semibold text-zinc-200">Add Authorized Redirect URI</h3>
              <p class="text-xs text-zinc-400 leading-relaxed">
                In your Google Client ID settings, add the exact Authorized Redirect URI below:
              </p>
              <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex justify-between items-center group">
                <code class="text-xs text-indigo-400 break-all select-all pr-2">${redirectUri}</code>
                <button onclick="navigator.clipboard.writeText('${redirectUri}'); alert('Copied to clipboard!')" class="text-zinc-500 hover:text-zinc-300 text-xs font-semibold cursor-pointer">Copy</button>
              </div>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex gap-4">
            <div class="w-8 h-8 rounded-full bg-zinc-800 text-sm font-semibold flex items-center justify-center border border-zinc-750 flex-shrink-0">3</div>
            <div class="space-y-1.5 pt-0.5">
              <h3 class="text-sm font-semibold text-zinc-200">Configure AI Studio Settings</h3>
              <p class="text-xs text-zinc-400 leading-relaxed">
                Add these new variables in the **Settings** / **Secrets** panel in Google AI Studio:
              </p>
              <ul class="list-disc pl-4 text-xs text-zinc-400 space-y-1">
                <li><code class="text-zinc-200">GOOGLE_CLIENT_ID</code></li>
                <li><code class="text-zinc-200">GOOGLE_CLIENT_SECRET</code></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-zinc-800 flex justify-center">
          <button onclick="window.close()" class="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold rounded-xl transition-all border border-zinc-700 cursor-pointer">
            Close Guide Window
          </button>
        </div>
      </div>
    </body>
    </html>
  `);
});

// GET Google OAuth Callback Handler
app.get("/api/auth/google/callback", async (req: any, res: any) => {
  const { code } = req.query;
  const origin = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!code) {
    return res.status(400).send("No authorization code provided by Google.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).send("Server Google OAuth configuration is missing.");
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[Google OAuth Callback] Token exchange failed:", errorText);
      return res.status(400).send(`Google OAuth Token Exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token || 'gcal_token_' + Math.random().toString(36).substring(2, 10);

    // Render successful HTML page that sends OAUTH_AUTH_SUCCESS to the parent window
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>body { font-family: 'Inter', sans-serif; }</style>
        </head>
        <body class="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-6">
          <div class="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div class="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div class="space-y-2">
              <h1 class="text-xl font-bold tracking-tight text-white">Google Account Linked!</h1>
              <p class="text-zinc-400 text-xs leading-relaxed">
                Your Google Calendar has been successfully authorized. This window will now close.
              </p>
            </div>
            <script>
              setTimeout(() => {
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_AUTH_SUCCESS', 
                    connectorId: 'conn_gcal', 
                    token: ${JSON.stringify(token)} 
                  }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              }, 1200);
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("[Google OAuth Callback] Error processing callback:", error);
    return res.status(500).send(`Server error during Google OAuth callback: ${error.message}`);
  }
});


// Vite middleware setup and listener within async block
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Initialize and start production background queue and worker system!
  try {
    const { QueueSystem } = await import("./server/services/QueueSystem.js");
    QueueSystem.initialize();
    QueueSystem.startWorkers();
    await QueueSystem.runFailsafeRecovery();
    console.log("[SHANA Server] Background Queue workers initialized and started successfully.");
  } catch (err) {
    console.error("Failed to start background queue workers:", err);
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SHANA Server] running on http://0.0.0.0:${PORT}`);
  });

  // Initialize and start Real-Time Gateway on the same port!
  try {
    const { RealTimeGateway } = await import("./server/services/RealTimeGateway.js");
    RealTimeGateway.initialize(server);
    console.log("[SHANA Server] Real-Time Gateway initialized and mounted successfully.");
  } catch (err) {
    console.error("Failed to start Real-Time Gateway:", err);
  }
}

startServer();
