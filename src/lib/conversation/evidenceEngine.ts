import { ConversationState, EvidenceRecord } from './conversationState';

export class EvidenceEngine {
  /**
   * Safe getter for existing evidence list
   */
  static getOrInitializeEvidence(state: ConversationState): EvidenceRecord[] {
    return state.evidenceRecords || [];
  }

  /**
   * Scans user input to capture concrete evidence records of competencies
   */
  static extractEvidence(state: ConversationState, userInput: string): EvidenceRecord[] {
    const existing = this.getOrInitializeEvidence(state);
    const text = userInput.trim();
    const textLower = text.toLowerCase();
    
    const newRecords: EvidenceRecord[] = [];

    // Helper regex patterns for evidence detection
    const teamRegex = /(led|managed|coordinated|supervised)\s+(a\s+team|[\d+]\s+(engineers|developers|people|person|members))/i;
    const metricRegex = /(\d+%\s*(improvement|decrease|increase|growth|boost|reduction|saved|faster))|((saved|reduced|increased|boosted)\s+\w*\s*\d+%)/i;
    const productionRegex = /(production|prod|resolved|fixed|outage|incident|downtime|critical\s+bug)/i;
    const mentorRegex = /(mentor|mentored|guided|coached|trained)\s+(junior|juniors|new\s+hire|intern|interns)/i;
    const techDesignRegex = /(designed|architected|restructured|migrated|built\s+from\s+scratch)\s+(the\s+)?(system|platform|architecture|database|pipeline|microservice)/i;

    // Pattern 1: Leadership & Coordination
    if (teamRegex.test(text)) {
      const match = text.match(teamRegex);
      newRecords.push({
        competency: "Leadership",
        description: `Candidate explicitly detailed experience: "${match ? match[0] : 'coordinating or leading a team'}"`,
        confidence: 0.90
      });
    }

    // Pattern 2: Quantitative Business Impact
    if (metricRegex.test(text)) {
      const match = text.match(metricRegex);
      newRecords.push({
        competency: "Decision Making",
        description: `Quantified impact evidence: "${match ? match[0] : 'saving or improving performance metric'}"`,
        confidence: 0.85
      });
    }

    // Pattern 3: Technical Problem Solving Under Pressure
    if (productionRegex.test(textLower)) {
      newRecords.push({
        competency: "Stress Resistance",
        description: `Production incident / high-stress mitigation mentioned.`,
        confidence: 0.82
      });
    }

    // Pattern 4: Mentoring / Teaching
    if (mentorRegex.test(textLower)) {
      newRecords.push({
        competency: "Leadership",
        description: `Mentoring and professional guidance evidence: "${text.match(mentorRegex)?.[0] || 'mentored juniors'}"`,
        confidence: 0.88
      });
    }

    // Pattern 5: System Architecture Design
    if (techDesignRegex.test(textLower)) {
      newRecords.push({
        competency: "Technical",
        description: `Architectural design/system creation evidence: "${text.match(techDesignRegex)?.[0] || 'architected core platform'}"`,
        confidence: 0.91
      });
    }

    // Fallback: If no explicit regex patterns are matched, but candidate gave a comprehensive answer (>100 characters)
    if (newRecords.length === 0 && text.length > 120) {
      // Create a logical fallback evidence note based on the verified competency from recruiter brain
      const lastTurnBrain = state.recruiterBrainTurns?.[state.recruiterBrainTurns.length - 1];
      const comp = lastTurnBrain?.competencyVerified || "Communication";
      
      let description = `Candidate explained behavioral details regarding ${comp.toLowerCase()} style.`;
      if (textLower.includes("problem") || textLower.includes("challenge")) {
        description = `Detailed a problem-solving workflow within a team setting.`;
      }

      newRecords.push({
        competency: comp,
        description,
        confidence: 0.70
      });
    }

    // Combine and limit duplicates
    const combined = [...existing];
    for (const rec of newRecords) {
      const isDup = combined.some(item => 
        item.competency === rec.competency && 
        item.description.toLowerCase() === rec.description.toLowerCase()
      );
      if (!isDup) {
        combined.push(rec);
      }
    }

    return combined;
  }
}
