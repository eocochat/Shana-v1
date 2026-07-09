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
  | 'Reflection'
  | 'Steer conversation';

export interface FollowUpStrategy {
  category: FollowUpCategory;
  directiveEN: string;
  directiveFR: string;
}

export class FollowUpEngine {
  /**
   * Evaluates candidate response to decide the best structural follow-up strategy
   */
  static analyzeResponse(
    userInput: string, 
    memory: ContextMemoryState, 
    state?: any, 
    targetRole?: string, 
    industry?: string
  ): FollowUpStrategy {
    const text = userInput.toLowerCase();
    const wordCount = userInput.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    let baseStrategy: FollowUpStrategy;

    // Rule 1: Steer/redirect if candidate is repeating themselves or rambling
    if (wordCount > 160) {
      baseStrategy = {
        category: 'Steer conversation',
        directiveEN: "The candidate's answer was very long and detailed. Politeness is key: acknowledge their main point briefly and transition immediately to a new question or polite redirection to keep the momentum of the interview.",
        directiveFR: "La réponse du candidat a été très longue. Ayez une réaction polie mais ferme : accusez réception de leur point clé très brièvement et relancez immédiatement sur un autre aspect ou un nouveau sujet pour garder le rythme de l'entretien."
      };
    }
    // Rule 2: Extreme brevity / lack of detail
    else if (wordCount > 0 && wordCount < 15) {
      baseStrategy = {
        category: 'Clarification',
        directiveEN: "The candidate's answer was extremely brief. Show professional curiosity: ask them to unpack their thought process, provide a concrete example, or expand on the 'how' and 'why' of this statement.",
        directiveFR: "La réponse du candidat est extrêmement succincte. Faites preuve d'une curiosité bienveillante : demandez-lui de détailler son raisonnement, de donner un exemple concret ou d'expliciter le 'comment' et le 'pourquoi' de sa pensée."
      };
    }
    // Rule 3: No metrics/numbers detection
    else if (userInput.length > 50 && !(/\b\d+(?:%|\s*percent|k|m|b|x)?\b/.test(text) || text.includes('pourcent') || text.includes('dollars') || text.includes('euros') || text.includes(' %'))) {
      baseStrategy = {
        category: 'Metrics',
        directiveEN: "Follow up directly on the LACK OF METRICS in their previous answer. Push them to provide exact quantitative indicators (e.g., scale, savings, growth percentage, latency reduction, user base) to back up their claims.",
        directiveFR: "Faites un suivi direct sur l'ABSENCE DE CHIFFRES OU MESURES (metrics) dans leur réponse précédente. Demandez-leur des indicateurs quantitatifs précis (ex: pourcentages, gains de performance, budget, croissance) pour appuyer leur exemple."
      };
    }
    // Rule 4: Incomplete STAR check (Situation, Task, Action, Result)
    else if (userInput.length > 50 && !(['result', 'outcome', 'impact', 'achieved', 'consequence', 'finally', 'concl', 'résultat', 'impact', 'abouti', 'réussi'].some(w => text.includes(w)))) {
      baseStrategy = {
        category: 'STAR completion',
        directiveEN: "The candidate described an action but did not cover the RESULT or business impact. Ask them to clearly state the concrete final outcome of their actions in that situation.",
        directiveFR: "Le candidat a décrit une action mais n'a pas mentionné le RÉSULTAT ou l'impact business. Demandez-lui de formuler clairement l'aboutissement final concret de ses actions."
      };
    }
    // Rule 5: High-level leadership mention
    else if (['team', 'lead', 'manage', 'delegate', 'align', 'hire', 'fire', 'stakeholder', 'client', 'équipe', 'dirigé', 'géré', 'partie prenante', 'collaborat'].some(w => text.includes(w))) {
      baseStrategy = {
        category: 'Leadership',
        directiveEN: "Deep dive into the LEADERSHIP or stakeholder alignment aspect they mentioned. Challenge them on how they motivated the team, handled resistance, or delegated tasks under pressure.",
        directiveFR: "Creusez l'aspect LEADERSHIP ou alignement des parties prenantes mentionné. Interrogez-les sur comment ils ont motivé l'équipe, géré les résistances ou délégué les tâches sous pression."
      };
    }
    // Rule 6: Technical architecture, coding, or complex tools mention
    else if (['database', 'server', 'react', 'api', 'backend', 'frontend', 'kubernetes', 'docker', 'code', 'refactor', 'infrastructure', 'cloud', 'architecture', 'algorithm', 'système', 'données'].some(w => text.includes(w))) {
      baseStrategy = {
        category: 'Technical challenge',
        directiveEN: "Pose a deep TECHNICAL CHALLENGE. Probe their design choices, trade-offs (e.g., consistency vs. availability), bottlenecks, or how their architecture handles edge cases/scaling limits.",
        directiveFR: "Posez un défi TECHNIQUE pointu. Interrogez-les sur leurs choix d'architecture, les compromis (ex: cohérence vs disponibilité), les goulots d'étranglement ou la gestion des cas limites."
      };
    }
    // Rule 7: Conflicts or emotional difficulty indicators
    else if (['disagree', 'argument', 'conflict', 'difficult', 'tough', 'refuse', 'late', 'delay', 'désaccord', 'conflit', 'difficile', 'tendu', 'retard', 'friction'].some(w => text.includes(w))) {
      baseStrategy = {
        category: 'Conflict resolution',
        directiveEN: "Explore the CONFLICT RESOLUTION or interpersonal friction. Ask how they managed the disagreement, maintained psychological safety, and arrived at an objective compromise.",
        directiveFR: "Explorez la RÉSOLUTION DE CONFLIT ou la friction interpersonnelle. Demandez comment ils ont géré le désaccord, maintenu la cohésion et abouti à un compromis objectif."
      };
    }
    // Rule 8: Trade-offs & Decision making
    else if (['choose', 'decide', 'select', 'alternative', 'option', 'trade-off', 'compromis', 'choisir', 'décider', 'sélectionner', 'option'].some(w => text.includes(w))) {
      baseStrategy = {
        category: 'Decision making',
        directiveEN: "Drill down into their DECISION-MAKING matrix. Why did they choose this specific option over alternative solutions? What were the hidden costs or technical trade-offs?",
        directiveFR: "Creusez leur matrice de DÉCISION. Pourquoi ont-ils choisi cette option spécifique plutôt que des alternatives ? Quels étaient les coûts cachés ou les compromis techniques ?"
      };
    }
    // Default: Deep dive
    else {
      baseStrategy = {
        category: 'Deep dive',
        directiveEN: "Execute an immersive, professional DEEP DIVE. Ask them to zoom in on their specific contribution or to elaborate on the execution step-by-step to prove hands-on ownership.",
        directiveFR: "Procédez à un DEEP DIVE professionnel. Demandez-leur de zoomer sur leur contribution personnelle exacte ou de détailler la mise en œuvre étape par étape pour prouver leur rôle actif."
      };
    }

    // Now supercharge the strategy with Role, Personality, and Memory context if available
    let roleDirectiveEN = "";
    let roleDirectiveFR = "";
    let personalityDirectiveEN = "";
    let personalityDirectiveFR = "";
    let memoryDirectiveEN = "";
    let memoryDirectiveFR = "";

    // 1. Role-specific context enrichment
    if (targetRole) {
      const roleLower = targetRole.toLowerCase();
      if (roleLower.includes('engineer') || roleLower.includes('developer') || roleLower.includes('architect') || roleLower.includes('tech')) {
        roleDirectiveEN = ` [Engineering context: Press them on architectural trade-offs, performance, code health, or scale constraints.]`;
        roleDirectiveFR = ` [Contexte Technique: Interrogez-les sur les arbitrages d'architecture, la performance globale, la santé du code ou les limites de l'échelle.]`;
      } else if (roleLower.includes('product') || roleLower.includes('pm')) {
        roleDirectiveEN = ` [Product Management context: Probe their prioritization matrix, user validation methodologies, or telemetry/KPI alignment.]`;
        roleDirectiveFR = ` [Contexte Produit: Sondez leur grille de priorisation, leurs méthodes de validation utilisateur ou la définition de leurs indicateurs clés.]`;
      } else if (roleLower.includes('sales') || roleLower.includes('account') || roleLower.includes('business development')) {
        roleDirectiveEN = ` [Sales context: Ask for sales pipeline details, key conversion rates, objection strategies, or quota achievements.]`;
        roleDirectiveFR = ` [Contexte Commercial: Demandez des détails sur leur cycle de vente, leurs taux de conversion clés ou la gestion des objections complexes.]`;
      } else if (roleLower.includes('hr') || roleLower.includes('human') || roleLower.includes('talent') || roleLower.includes('recruiter')) {
        roleDirectiveEN = ` [HR context: Focus on corporate culture fit, employee engagement loops, or dispute management frameworks.]`;
        roleDirectiveFR = ` [Contexte RH: Concentrez-vous sur l'adéquation culturelle, les processus d'engagement des collaborateurs ou la gestion de désaccords complexes.]`;
      } else if (roleLower.includes('consult')) {
        roleDirectiveEN = ` [Consulting context: Force a structured MECE breakdown, stakeholder management plan, or cost-benefit reasoning.]`;
        roleDirectiveFR = ` [Contexte Conseil: Imposez une structure d'analyse rigoureuse (type MECE), un plan d'alignement client ou un arbitrage coûts-bénéfices.]`;
      } else if (roleLower.includes('executive') || roleLower.includes('director') || roleLower.includes('leader') || roleLower.includes('head')) {
        roleDirectiveEN = ` [Leadership context: Investigate organizational scale, multi-year strategic risk, board coordination, or change management impacts.]`;
        roleDirectiveFR = ` [Contexte Exécutif: Examinez la gestion du changement à grande échelle, la stratégie de risque pluriannuelle ou la coordination avec la gouvernance.]`;
      }
    }

    // 2. Personality-specific context enrichment
    if (state && state.personality) {
      const persId = state.personality.id;
      if (persId === 'friendly') {
        personalityDirectiveEN = ` Keep your response extremely warm, supportive, and use positive reinforcement. Validate their feelings before probing.`;
        personalityDirectiveFR = ` Formulez votre réponse de façon très chaleureuse et encourageante, avec beaucoup de bienveillance envers le candidat.`;
      } else if (persId === 'senior_eng') {
        personalityDirectiveEN = ` Keep it direct, dry, pragmatic, and heavily detail-oriented. Push deep into edge cases or system designs.`;
        personalityDirectiveFR = ` Soyez direct, pragmatique et focalisé sur les détails techniques pointus. Testez les cas limites ou les détails d'implémentation.`;
      } else if (persId === 'founder') {
        personalityDirectiveEN = ` Be fast-paced, highly demanding, casual but intense. Challenge their speed of execution and MVP choices.`;
        personalityDirectiveFR = ` Adoptez un rythme rapide, exigeant et direct. Challengez leur rapidité d'exécution et leurs choix d'arbitrage MVP.`;
      } else if (persId === 'banker') {
        personalityDirectiveEN = ` Be laser-focused, demanding, focusing on quantitative metrics, ROI, and delivery pressure.`;
        personalityDirectiveFR = ` Soyez ultra-précis, focalisé sur le retour sur investissement chiffré, les indicateurs et la capacité à livrer sous pression.`;
      } else if (persId === 'silent') {
        personalityDirectiveEN = ` Be quiet, sparse, asking brief but highly powerful questions that force deep introspection.`;
        personalityDirectiveFR = ` Soyez sobre, économe de vos mots, en posant une question courte mais percutante qui pousse à une profonde réflexion.`;
      }
    }

    // 3. Memory & Active listening linkage (Phase 33 Memory Continuity)
    if (memory) {
      const companies = memory.companiesMentioned || [];
      const projects = memory.projects || [];
      const experiences = memory.experiences || [];

      if (companies.length > 0 && Math.random() > 0.4) {
        const lastCompany = companies[companies.length - 1];
        memoryDirectiveEN = ` [ACTIVE LISTENING MEMORY: Reference their previous statement about working at "${lastCompany}" if it naturally aligns with this follow-up context.]`;
        memoryDirectiveFR = ` [ÉCOUTE ACTIVE MÉMOIRE : Liez explicitement votre relance à leur précédente mention de leur expérience chez "${lastCompany}" si le contexte s'y prête.]`;
      } else if (projects.length > 0 && Math.random() > 0.4) {
        const lastProj = projects[projects.length - 1];
        memoryDirectiveEN = ` [ACTIVE LISTENING MEMORY: Reference the project "${lastProj}" they mentioned earlier in the session to create a continuous conversational thread.]`;
        memoryDirectiveFR = ` [ÉCOUTE ACTIVE MÉMOIRE : Faites une passerelle avec le projet "${lastProj}" qu'ils ont évoqué plus tôt pour démontrer une mémoire continue.]`;
      } else if (experiences.length > 0 && Math.random() > 0.4) {
        const lastExp = experiences[experiences.length - 1];
        memoryDirectiveEN = ` [ACTIVE LISTENING MEMORY: Connect this question back to the experience of "${lastExp}" they brought up previously.]`;
        memoryDirectiveFR = ` [ÉCOUTE ACTIVE MÉMOIRE : Reliez cette question à l'expérience de "${lastExp}" qu'ils ont mentionnée précédemment.]`;
      }
    }

    // Assemble final supecharged directives
    return {
      category: baseStrategy.category,
      directiveEN: `${baseStrategy.directiveEN}${roleDirectiveEN}${personalityDirectiveEN}${memoryDirectiveEN}`,
      directiveFR: `${baseStrategy.directiveFR}${roleDirectiveFR}${personalityDirectiveFR}${memoryDirectiveFR}`
    };
  }
}
