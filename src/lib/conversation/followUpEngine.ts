import { ContextMemoryState } from './conversationState';

export type FollowUpCategory =
  | 'Clarification'
  | 'Deep dive'
  | 'Technical challenge'
  | 'Behavioural challenge'
  | 'Leadership'
  | 'Conflict resolution'
  | 'Decision making'
  | 'Metrics'
  | 'STAR completion'
  | 'Reflection';

export interface FollowUpStrategy {
  category: FollowUpCategory;
  directiveEN: string;
  directiveFR: string;
}

export class FollowUpEngine {
  /**
   * Evaluates candidate response to decide the best structural follow-up strategy
   */
  static analyzeResponse(userInput: string, memory: ContextMemoryState): FollowUpStrategy {
    const text = userInput.toLowerCase();
    
    // Rule 1: No metrics/numbers detection
    const hasNumbers = /\b\d+(?:%|\s*percent|k|m|b|x)?\b/.test(text) || 
                       text.includes('pourcent') || 
                       text.includes('dollars') || 
                       text.includes('euros');
    if (userInput.length > 50 && !hasNumbers) {
      return {
        category: 'Metrics',
        directiveEN: "Follow up directly on the LACK OF METRICS in their previous answer. Push them to provide exact quantitative indicators (e.g., scale, savings, growth percentage, latency reduction, user base).",
        directiveFR: "Faites un suivi direct sur l'ABSENCE DE CHIFFRES OU MESURES (metrics) dans leur réponse précédente. Demandez-leur des indicateurs quantitatifs précis (ex: pourcentages, gains de performance, budget, croissance)."
      };
    }

    // Rule 2: Incomplete STAR check (Situation, Task, Action, Result)
    // If they talk about actions but don't mention results or impact
    const resultKeywords = ['result', 'outcome', 'impact', 'achieved', 'consequence', 'finally', 'concl', 'résultat', 'impact', 'abouti', 'réussi'];
    const hasResultIndicator = resultKeywords.some(w => text.includes(w));
    if (userInput.length > 50 && !hasResultIndicator) {
      return {
        category: 'STAR completion',
        directiveEN: "The candidate described an action but did not cover the RESULT or business impact. Ask them to clearly state the concrete final outcome of their actions in that situation.",
        directiveFR: "Le candidat a décrit une action mais n'a pas mentionné le RÉSULTAT ou l'impact business. Demandez-lui de formuler clairement l'aboutissement final concret de ses actions."
      };
    }

    // Rule 3: High-level leadership mention
    const leadershipKeywords = ['team', 'lead', 'manage', 'delegate', 'align', 'hire', 'fire', 'stakeholder', 'client', 'équipe', 'dirigé', 'géré', 'partie prenante'];
    if (leadershipKeywords.some(w => text.includes(w))) {
      return {
        category: 'Leadership',
        directiveEN: "Deep dive into the LEADERSHIP or stakeholder alignment aspect they mentioned. Challenge them on how they motivated the team, handled resistance, or delegated tasks under pressure.",
        directiveFR: "Creusez l'aspect LEADERSHIP ou alignement des parties prenantes mentionné. Interrogez-les sur comment ils ont motivé l'équipe, géré les résistances ou délégué les tâches sous pression."
      };
    }

    // Rule 4: Technical architecture, coding, or complex tools mention
    const technicalKeywords = ['database', 'server', 'react', 'api', 'backend', 'frontend', 'kubernetes', 'docker', 'code', 'refactor', 'infrastructure', 'cloud', 'architecture', 'algorithm'];
    if (technicalKeywords.some(w => text.includes(w))) {
      return {
        category: 'Technical challenge',
        directiveEN: "Pose a deep TECHNICAL CHALLENGE. Probe their design choices, trade-offs (e.g., consistency vs. availability), bottlenecks, or how their architecture handles edge cases/scaling limits.",
        directiveFR: "Posez un défi TECHNIQUE pointu. Interrogez-les sur leurs choix d'architecture, les compromis (ex: cohérence vs disponibilité), les goulots d'étranglement ou la gestion des cas limites."
      };
    }

    // Rule 5: Conflicts or emotional difficulty indicators
    const conflictKeywords = ['disagree', 'argument', 'conflict', 'difficult', 'tough', 'refuse', 'late', 'delay', 'désaccord', 'conflit', 'difficile', 'tendu', 'retard'];
    if (conflictKeywords.some(w => text.includes(w))) {
      return {
        category: 'Conflict resolution',
        directiveEN: "Explore the CONFLICT RESOLUTION or interpersonal friction. Ask how they managed the disagreement, maintained psychological safety, and arrived at an objective compromise.",
        directiveFR: "Explorez la RÉSOLUTION DE CONFLIT ou la friction interpersonnelle. Demandez comment ils ont géré le désaccord, maintenu la cohésion et abouti à un compromis objectif."
      };
    }

    // Rule 6: Trade-offs & Decision making
    const decisionKeywords = ['choose', 'decide', 'select', 'alternative', 'option', 'trade-off', 'compromis', 'choisir', 'décider', 'sélectionner', 'option'];
    if (decisionKeywords.some(w => text.includes(w))) {
      return {
        category: 'Decision making',
        directiveEN: "Drill down into their DECISION-MAKING matrix. Why did they choose this specific option over alternative solutions? What were the hidden costs or technical trade-offs?",
        directiveFR: "Creusez leur matrice de DÉCISION. Pourquoi ont-ils choisi cette option spécifique plutôt que des alternatives ? Quels étaient les coûts cachés ou les compromis techniques ?"
      };
    }

    // Default: Deep dive on the content
    return {
      category: 'Deep dive',
      directiveEN: "Execute an immersive, professional DEEP DIVE. Ask them to zoom in on their specific contribution or to elaborate on the execution step-by-step to prove hands-on ownership.",
      directiveFR: "Procédez à un DEEP DIVE professionnel. Demandez-leur de zoomer sur leur contribution personnelle exacte ou de détailler la mise en œuvre étape par étape pour prouver leur rôle actif."
    };
  }
}
