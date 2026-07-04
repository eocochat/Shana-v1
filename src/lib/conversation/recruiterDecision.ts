import { ConversationState, RecruiterDecision } from './conversationState';

export class RecruiterDecisionEngine {
  /**
   * Compiles the complete interview performance to render a professional hiring decision
   */
  static compileDecision(state: ConversationState): RecruiterDecision {
    const twin = state.digitalTwin || {
      communication: 70,
      leadership: 65,
      confidence: 70,
      decisionMaking: 65,
      star: 60,
      technical: 70,
      stressResistance: 65,
      storytelling: 60
    };

    // 1. Calculate Average Suitability Score
    const scores = [
      twin.communication,
      twin.leadership,
      twin.confidence,
      twin.decisionMaking,
      twin.star,
      twin.technical,
      twin.stressResistance,
      twin.storytelling
    ];
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // 2. Determine Decision Level and Recommendation Title
    let wouldHire: 'Yes' | 'Probably Yes' | 'Probably No' | 'No' = 'Probably Yes';
    let recommendation = "Proceed to the next round of technical interviews.";
    let confidence = avgScore;

    if (avgScore >= 85) {
      wouldHire = 'Yes';
      recommendation = "Strongly recommend hiring. Move immediately to offer stages or executive matching.";
    } else if (avgScore >= 70) {
      wouldHire = 'Probably Yes';
      recommendation = "Recommend proceeding to next stage with focused questions on decision ownership.";
    } else if (avgScore >= 55) {
      wouldHire = 'Probably No';
      recommendation = "Do not proceed. Resume pipeline matching for other junior roles if applicable.";
    } else {
      wouldHire = 'No';
      recommendation = "Reject candidacy. Provide polite general feedback regarding interview storytelling.";
    }

    // 3. Compile structural reasons
    const reasons: string[] = [];
    if (twin.technical >= 75) {
      reasons.push("Demonstrates solid technical foundations and clear engineering architectural principles.");
    }
    if (twin.leadership >= 75) {
      reasons.push("Strong evidence of leadership capability, mentorship, and team alignment ownership.");
    }
    if (twin.communication >= 75) {
      reasons.push("Excellent communication skills, concise structure, and professional cadence.");
    }
    if (twin.star >= 75) {
      reasons.push("Very structured storytelling format detailing clear situations, tasks, actions, and quantifiable results.");
    }

    // Fallbacks if reasons are empty
    if (reasons.length === 0) {
      if (avgScore >= 70) {
        reasons.push("Balanced professional performance showing steady competencies across all core vectors.");
      } else {
        reasons.push("Exhibits basic foundational skills suitable for smaller scope executions.");
      }
    }

    // 4. Compile weaknesses
    const weaknesses: string[] = [];
    if (twin.star < 65) {
      weaknesses.push("Behavioral answers lack structural STAR completeness (specific situations and measurable results).");
    }
    if (twin.stressResistance < 65) {
      weaknesses.push("Hesitates or displays notable stress response when faced with demanding crisis questions.");
    }
    if (twin.communication < 65) {
      weaknesses.push("Relies on mild conversational fillers or overly long narrative prefaces.");
    }
    if (twin.decisionMaking < 65) {
      weaknesses.push("Could provide more granular details regarding technical trade-offs and decision justifications.");
    }

    if (weaknesses.length === 0) {
      weaknesses.push("No major risks detected; could focus on more advanced scale-up experiences.");
    }

    return {
      wouldHire,
      confidence,
      reasons,
      weaknesses,
      recommendation
    };
  }
}
