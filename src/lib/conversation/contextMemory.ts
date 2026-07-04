import { ContextMemoryState } from './conversationState';

export const INITIAL_CONTEXT_MEMORY: ContextMemoryState = {
  experiences: [],
  companiesMentioned: [],
  projects: [],
  skills: [],
  leadershipExamples: [],
  mistakes: [],
  strengths: [],
  weaknesses: [],
  previousPromises: [],
  topicsAlreadyDiscussed: []
};

export class ContextMemoryManager {
  static createInitialMemory(): ContextMemoryState {
    return { ...INITIAL_CONTEXT_MEMORY };
  }

  /**
   * Heuristically extract contextual elements from the candidate's response
   */
  static extractFromText(text: string, currentMemory: ContextMemoryState): ContextMemoryState {
    const memory = {
      experiences: [...currentMemory.experiences],
      companiesMentioned: [...currentMemory.companiesMentioned],
      projects: [...currentMemory.projects],
      skills: [...currentMemory.skills],
      leadershipExamples: [...currentMemory.leadershipExamples],
      mistakes: [...currentMemory.mistakes],
      strengths: [...currentMemory.strengths],
      weaknesses: [...currentMemory.weaknesses],
      previousPromises: [...currentMemory.previousPromises],
      topicsAlreadyDiscussed: [...currentMemory.topicsAlreadyDiscussed]
    };

    const lowerText = text.toLowerCase();

    // 1. Company Extraction Heuristics
    const targetCompanies = [
      'amazon', 'google', 'microsoft', 'apple', 'netflix', 'meta', 'facebook', 'stripe',
      'uber', 'airbnb', 'twitter', 'tesla', 'salesforce', 'adobe', 'oracle', 'spotify'
    ];
    targetCompanies.forEach(company => {
      const regex = new RegExp(`\\b${company}\\b`, 'i');
      if (regex.test(text) && !memory.companiesMentioned.includes(company)) {
        // Capitalize company name
        const cap = company.charAt(0).toUpperCase() + company.slice(1);
        memory.companiesMentioned.push(cap);
      }
    });

    // 2. Skills Extraction Heuristics
    const targetSkills = [
      'react', 'typescript', 'javascript', 'python', 'go', 'golang', 'rust', 'c++', 'java',
      'node', 'express', 'nextjs', 'docker', 'kubernetes', 'aws', 'gcp', 'cloud', 'sql',
      'postgresql', 'mongodb', 'graphql', 'system design', 'machine learning', 'ai', 'devops'
    ];
    targetSkills.forEach(skill => {
      const regex = new RegExp(`\\b${skill.replace('+', '\\+')}\\b`, 'i');
      if (regex.test(text) && !memory.skills.includes(skill)) {
        const matched = skill === 'aws' || skill === 'gcp' || skill === 'sql' || skill === 'ai'
          ? skill.toUpperCase()
          : skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        memory.skills.push(matched);
      }
    });

    // 3. Leadership Signal Extraction Heuristics
    const leadershipKeywords = [
      'led', 'managed', 'coached', 'steered', 'spearheaded', 'organized', 'director', 'lead',
      'manager', 'mentored', 'orchestrated', 'advocated', 'empowered', 'team size', 'delegated'
    ];
    const containsLeadership = leadershipKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(text);
    });
    if (containsLeadership) {
      // Extract a representative fragment around the leadership activity
      const sentences = text.split(/[.!?]+/);
      const matchingSentence = sentences.find(s => 
        leadershipKeywords.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(s))
      );
      if (matchingSentence && matchingSentence.trim().length > 10) {
        const cleanPhrase = matchingSentence.trim();
        if (!memory.leadershipExamples.includes(cleanPhrase)) {
          memory.leadershipExamples.push(cleanPhrase);
        }
      }
    }

    // 4. Mistake / Friction Signal Heuristics
    const mistakeKeywords = [
      'fail', 'failed', 'mistake', 'error', 'bug', 'bottleneck', 'regret', 'struggled',
      'crisis', 'conflict', 'issue', 'wrong', 'misunderstood', 'delay', 'dropped'
    ];
    const containsMistake = mistakeKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(text);
    });
    if (containsMistake) {
      const sentences = text.split(/[.!?]+/);
      const matchingSentence = sentences.find(s => 
        mistakeKeywords.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(s))
      );
      if (matchingSentence && matchingSentence.trim().length > 10) {
        const cleanPhrase = matchingSentence.trim();
        if (!memory.mistakes.includes(cleanPhrase)) {
          memory.mistakes.push(cleanPhrase);
        }
      }
    }

    // 5. Strengths / Highlights Extraction
    const strengthKeywords = [
      'succeeded', 'delivered', 'improved', 'increased', 'optimized', 'achieved', 'proud of',
      'strengths', 'excel', 'impact', 'solved', 'resolved', 'perfectly'
    ];
    const containsStrength = strengthKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(text);
    });
    if (containsStrength) {
      const sentences = text.split(/[.!?]+/);
      const matchingSentence = sentences.find(s => 
        strengthKeywords.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(s))
      );
      if (matchingSentence && matchingSentence.trim().length > 10) {
        const cleanPhrase = matchingSentence.trim();
        if (!memory.strengths.includes(cleanPhrase)) {
          memory.strengths.push(cleanPhrase);
        }
      }
    }

    return memory;
  }

  /**
   * Format the context memories into structured instruction text for the ResponsePlanner / LLM
   */
  static formatMemoryToPrompt(memory: ContextMemoryState, language: string = 'English'): string {
    const isEng = language === 'English' || language === 'EN';
    let output = isEng ? "\n[CONVERSATION CONTEXT MEMORY]:\n" : "\n[MÉMOIRE DU CONTEXTE DE CONVERSATION]:\n";

    if (memory.companiesMentioned.length > 0) {
      output += isEng
        ? `- Companies Candidate Worked At / Mentioned: ${memory.companiesMentioned.join(', ')}\n`
        : `- Entreprises mentionnées / d'expérience : ${memory.companiesMentioned.join(', ')}\n`;
    }

    if (memory.skills.length > 0) {
      output += isEng
        ? `- Extracted Technical/Core Skills: ${memory.skills.join(', ')}\n`
        : `- Compétences extraites : ${memory.skills.join(', ')}\n`;
    }

    if (memory.leadershipExamples.length > 0) {
      output += isEng
        ? `- Leadership / Team Management Instances: ${memory.leadershipExamples.map(e => `"${e}"`).join(' | ')}\n`
        : `- Exemples de Leadership / Gestion d'équipe : ${memory.leadershipExamples.map(e => `"${e}"`).join(' | ')}\n`;
    }

    if (memory.mistakes.length > 0) {
      output += isEng
        ? `- Failures / Mistakes / Challenges Discussed: ${memory.mistakes.map(e => `"${e}"`).join(' | ')}\n`
        : `- Échecs / Erreurs / Difficultés abordées : ${memory.mistakes.map(e => `"${e}"`).join(' | ')}\n`;
    }

    if (memory.strengths.length > 0) {
      output += isEng
        ? `- Strengths / Accomplishments Shared: ${memory.strengths.map(e => `"${e}"`).join(' | ')}\n`
        : `- Points forts / Succès partagés : ${memory.strengths.map(e => `"${e}"`).join(' | ')}\n`;
    }

    if (memory.topicsAlreadyDiscussed.length > 0) {
      output += isEng
        ? `- Topics / Themes Already Covered: ${memory.topicsAlreadyDiscussed.join(', ')}\n`
        : `- Sujets déjà abordés : ${memory.topicsAlreadyDiscussed.join(', ')}\n`;
    }

    output += isEng
      ? `INSTRUCTION: Feel free to refer back to these previous points to follow up, challenge, or ask deeper questions (e.g., "Earlier you mentioned X..."). Never ask duplicate questions on topics listed as already covered.`
      : `INSTRUCTION : N'hésitez pas à faire référence à ces points précédents pour creuser le sujet (ex: "Vous avez mentionné X plus tôt..."). Ne posez jamais deux fois la même question sur un sujet répertorié comme déjà abordé.`;

    return output;
  }
}
