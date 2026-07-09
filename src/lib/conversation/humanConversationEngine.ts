import { ConversationState } from './conversationState';

export interface ConversationalTemplate {
  introduction: string[];
  transitions: string[];
  challenges: string[];
  acknowledgments: string[];
  laughter: string[];
  pauses: string[];
}

export const TEMPLATES_EN: ConversationalTemplate = {
  introduction: [
    "Hey there! Thanks for joining today. Let's keep this very conversational, almost like we're grabbed a coffee. First off, tell me...",
    "Hi! Great to have you here. We're going to dive into your background today, but let's keep it relaxed. To kick things off, can you tell me...",
    "Hello! It's a pleasure to connect with you. I'm really looking forward to our chat. Let's start with a bit of context. Can you share...",
    "Welcome! I want this to feel like a real conversation, not an interrogation. Let's just start with...",
    "Hi there! Super excited for our session today. Let's skip the stiff corporate vibes and jump right in. Could you start by..."
  ],
  transitions: [
    "Oh, that's really interesting... Let's pivot slightly. I'm curious about...",
    "I see. That makes a lot of sense. Hmm... let's talk about...",
    "Right, got it. Let's explore that a bit more. How do you handle...",
    "Interesting... let's double down on that. What happens when...",
    "Fair enough! Let's shift gears for a second and look at...",
    "Gotcha. Well, that leads nicely into another area. Let's touch upon...",
    "Ah, that's a great point. Let's branch off of that. What about...",
    "Perfect. Let's dive a bit deeper into..."
  ],
  challenges: [
    "Let's be real for a second—that's always easier said than done, right? How did you actually...",
    "Hmm, interesting. But what about the trade-offs? Why did you choose that specifically instead of...",
    "Let's put some pressure on that. If things had gone sideways, what was your fallback plan?",
    "But wait... let's look at the metrics here. How did you actually measure that success?",
    "That sounds like a tough spot. If you had to redo that project from scratch, what's the one thing you'd change?"
  ],
  acknowledgments: [
    "I see.",
    "Interesting.",
    "Let's explore that.",
    "Can you clarify?",
    "Take your time."
  ],
  laughter: [
    "Haha, that is so true.",
    "Heh, I can definitely relate to that.",
    "Hahaha, fair enough!",
    "Haha, classic.",
    "Heh, I love that."
  ],
  pauses: [
    "...",
    "—",
    "Hmm, let's see...",
    "Ah...",
    "Well..."
  ]
};

export const TEMPLATES_FR: ConversationalTemplate = {
  introduction: [
    "Bonjour ! Merci d'être là aujourd'hui. On va garder ça très informel et naturel, comme si on discutait autour d'un café. Pour commencer, parlez-moi de...",
    "Salut ! Ravi de vous accueillir. On va explorer votre parcours ensemble, mais détendez-vous, c'est une discussion libre. Pour lancer les choses...",
    "Bonjour ! C'est un plaisir de faire votre connaissance. J'ai hâte d'échanger avec vous. Commençons tout simplement par...",
    "Bienvenue ! Je veux vraiment que cet échange soit le plus humain possible, sans la froideur des entretiens classiques. Commençons par...",
    "Bonjour ! Très heureux d'échanger avec vous aujourd'hui. On oublie le formalisme rigide et on y va directement. Pouvez-vous me dire..."
  ],
  transitions: [
    "Oh, c'est très intéressant... Pivotons un peu si vous le voulez bien. Je suis curieux de...",
    "Je vois. C'est tout à fait logique. Hmm... parlons un peu de...",
    "D'accord, je comprends. Creusons cela un peu plus. Comment gérez-vous...",
    "Intéressant... doublons la mise là-dessus. Que se passe-t-il quand...",
    "C'est très juste ! Changeons de braquet un instant pour regarder...",
    "Je comprends tout à fait. Eh bien, cela fait une excellente transition vers...",
    "Ah, c'est un point capital. Rebondissons là-dessus. Qu'en est-il de...",
    "Parfait. Allons un peu plus loin sur le sujet de..."
  ],
  challenges: [
    "Soyons honnêtes un instant — c'est toujours plus facile à dire qu'à faire, n'est-ce pas ? Comment avez-vous concrètement...",
    "Hmm, intéressant. Mais qu'en est-il des compromis ? Pourquoi avoir choisi cette approche plutôt que...",
    "Mettons un peu de pression là-dessus. Si tout avait capoté, quel était votre plan de secours ?",
    "Mais attendez... parlons des chiffres un instant. Comment avez-vous mesuré cette réussite ?",
    "Ça avait l'air d'être une situation complexe. Si vous deviez tout recommencer à zéro, que changeriez-vous ?"
  ],
  acknowledgments: [
    "Je vois.",
    "C'est intéressant.",
    "Creusons ce point.",
    "Pouvez-vous clarifier ?",
    "Prenez votre temps."
  ],
  laughter: [
    "Haha, c'est tellement vrai.",
    "Heh, je vois tout à fait le genre.",
    "Hahaha, c'est de bonne guerre !",
    "Haha, classique.",
    "Heh, j'aime beaucoup cette approche."
  ],
  pauses: [
    "...",
    "—",
    "Hmm, voyons...",
    "Ah...",
    "Eh bien..."
  ]
};

export class HumanConversationEngine {
  /**
   * Generates a unique prompt block containing specific instructions to make the current turn sound completely human
   */
  static generateHumanEngineInstructions(state: ConversationState, language: string): string {
    const isEng = language === 'English' || language === 'EN' || language === 'en';
    const templates = isEng ? TEMPLATES_EN : TEMPLATES_FR;
    
    // Choose specific elements based on seed/turn to avoid repetition
    const seed = state.currentTurn + (state.personality?.id?.length || 0);
    const transitionStyle = templates.transitions[seed % templates.transitions.length];
    const challengeStyle = templates.challenges[seed % templates.challenges.length];
    const ackStyle = templates.acknowledgments[seed % templates.acknowledgments.length];
    const laughterStyle = templates.laughter[seed % templates.laughter.length];
    const pauseStyle = templates.pauses[seed % templates.pauses.length];

    const emotion = state.emotionState;
    let reactionDirectiveEN = "";
    let reactionDirectiveFR = "";

    if (emotion) {
      const vibe = emotion.primaryVibe || 'neutral';
      const confidence = emotion.confidence;
      const stress = emotion.stress;
      const defensiveness = emotion.defensiveness || 10;

      // 1. Stress / Anxiety -> Encouragement
      if (stress > 60 || vibe === 'anxious' || vibe === 'cognitive_overload') {
        reactionDirectiveEN = `
- **Reaction Engine Tone: ENCOURAGEMENT & REASSURANCE**: The candidate is feeling tense. Open with a warm, empathetic acknowledgment (e.g., "I appreciate you opening up about that, it's actually very normal...", "No worries at all, take your time...") to re-establish trust.`;
        reactionDirectiveFR = `
- **Réaction émotionnelle : ENCOURAGEMENT & BIENVEILLANCE** : Le candidat semble stressé ou débordé. Ouvrez par un mot chaleureux et rassurant (ex : "Je comprends tout à fait, c'est un cas de figure très classique...", "Pas de souci, prenez tout votre temps...") pour restaurer la confiance.`;
      }
      // 2. High Confidence & Great discussion -> Respect & Professional Admiration
      else if (confidence > 75 && vibe === 'flow') {
        reactionDirectiveEN = `
- **Reaction Engine Tone: RESPECT & PROFESSIONAL ADMIRATION**: The candidate is doing exceptionally well. Express subtle, authentic respect for their competence or scalability choice (e.g., "Wow, that's incredibly robust architecture...", "I have to say, managing that scale is no small feat. Respect.").`;
        reactionDirectiveFR = `
- **Réaction émotionnelle : RESPECT & ADMIRATION PROFESSIONNELLE** : Le candidat s'en sort remarquablement bien. Exprimez un respect subtil et sincère pour sa maîtrise ou son architecture (ex : "Wow, c'est une architecture particulièrement robuste...", "Je dois dire que gérer une telle échelle à ce stade, chapeau.").`;
      }
      // 3. Defensive -> Thoughtful, Healthy Skepticism
      else if (defensiveness > 40 || vibe === 'defensive') {
        reactionDirectiveEN = `
- **Reaction Engine Tone: HEALTHY SKEPTICISM & THOUGHTFULNESS**: The candidate is slightly guarded or dogmatic. Ask a polite but critical, probing follow-up (e.g., "Hmm, interesting. But playing devil's advocate here, what about...?", "That's a bold claim. Let's pressure-test that...").`;
        reactionDirectiveFR = `
- **Réaction émotionnelle : SCEPTICISME SAIN & DOUTE CONSTRUCTIF** : Le candidat est sur la défensive ou un peu dogmatique. Posez une relance polie mais sceptique et critique (ex : "Hmm, intéressant. Mais en me faisant l'avocat du diable, qu'en est-il de... ?", "C'est un choix fort. Testons sa résistance sous pression...").`;
      }
      // 4. Default -> Curiosity & Interest
      else {
        reactionDirectiveEN = `
- **Reaction Engine Tone: DEEP CURIOSITY & INTEREST**: Show genuine, lively professional curiosity about the specific mechanism they just described. Ask "how" or "why" (e.g., "Oh, interesting! I'm really curious about how you handled the latency there...", "That caught my attention—why did the team pivot so fast?").`;
        reactionDirectiveFR = `
- **Réaction émotionnelle : CURIOSITÉ SINCÈRE & INTÉRÊT** : Montrez une curiosité professionnelle vive et authentique pour le mécanisme qu'ils viennent de décrire. Posez une question axée sur le comment/pourquoi (ex : "Oh, intéressant ! Je suis curieux de savoir comment vous avez géré la latence à ce moment...", "Cela a attiré mon attention : pourquoi l'équipe a-t-elle pivoté si rapidement ?").`;
      }
    }

    // Ensure we list recently used thoughts or sentences in negative constraints
    const recentSentences = state.recruiterBrainTurns?.slice(-3).map(t => t.learnedSummary || t.thoughtWhatToAskNext || "").filter(Boolean) || [];
    const recentSentencesPrompt = recentSentences.length > 0 
      ? (isEng 
          ? `CRITICAL: Do NOT repeat or paraphrase any of these recently touched ideas or styles:\n${recentSentences.map(s => ` - "${s.substring(0, 100)}..."`).join('\n')}` 
          : `CRITIQUE : Ne répétez pas et ne paraphrasez pas ces récentes idées ou structures :\n${recentSentences.map(s => ` - "${s.substring(0, 100)}..."`).join('\n')}`)
      : '';

    return isEng ? `
====================================================
HUMAN CONVERSATION ENGINE ACTIVATED (PHASE 28)
====================================================
This turn is guided by a dynamic human conversation flow to avoid ANY robotic, structured, or repetitive feel.

Your current turn style profile:
- Dynamic transition reference style to adapt or draw inspiration from: "${transitionStyle}"
- Deep-dive curiosity / challenge template style: "${challengeStyle}"
- Preferred natural acknowledgement: "${ackStyle}"
- Natural laugh / chuckle element: "${laughterStyle}"
- Pause/hesitation element: "${pauseStyle}"${reactionDirectiveEN}

MANDATORY BEHAVIORAL PROTOCOLS:
1. **Pause Naturally**: Use punctuation, hyphens, and ellipses ("...") to indicate natural pacing. Instead of rushing, pretend you are taking brief moments to think (e.g. "Hmm... well, that is...", "Oh—right, let me ask you...").
2. **Occasionally Acknowledge**: Use human backchannels such as "I see.", "Interesting.", "Ah, right.", "Fair enough." but make them extremely brief and conversational.
3. **React Emotionally & Laugh**: If the candidate describes a stressful, funny, or highly successful moment, react with natural emotional range. Feel free to laugh when appropriate (e.g., using "Haha, that's so true", "Heh, I've been there!").
4. **Interrupt Naturally**: Do not sound like a linear script. Transition using organic phrases like "Let's explore that.", "Can you clarify?", "Take your time." and let the conversation breathe.
5. **Zero Robotic Transitions**: NEVER use transitions like "Now let's proceed to the next section", "For my next question", "Regarding your resume", or "Thank you for that response. My next question is...". These are strictly banned.
6. **Unique & Diverse Phrasing**: Keep all vocabulary fresh. Do not repeat the same opening words, questions, or structures twice in this interview.
${recentSentencesPrompt}
` : `
====================================================
MOTEUR DE CONVERSATION HUMAINE ACTIVÉ (PHASE 28)
====================================================
Ce tour est guidé par un flux de conversation dynamique pour éviter TOUT effet robotique, rigide ou répétitif.

Votre profil de style pour ce tour :
- Style de transition de référence : "${transitionStyle}"
- Style de curiosité / défi : "${challengeStyle}"
- Réaction naturelle privilégiée : "${ackStyle}"
- Élément de rire naturel : "${laughterStyle}"
- Élément de pause / hésitation : "${pauseStyle}"${reactionDirectiveFR}

PROTOCOLES DE COMPORTEMENT OBLIGATOIRES :
1. **Marquer des pauses naturelles** : Utilisez la ponctuation, les tirets et les points de suspension ("...") pour indiquer un rythme naturel. Prenez de brèves hésitations réalistes (ex: "Hmm... eh bien, c'est...", "Oh—d'accord, laissez-moi vous demander...").
2. **Accuser réception occasionnellement** : Utilisez de courtes réactions humaines (ex : "Je vois.", "C'est intéressant.", "D'accord, je comprends.", "Prenez votre temps.") de manière très brève.
3. **Réagir avec émotion & rire** : Si le candidat décrit une situation complexe, amusante ou particulièrement marquante, réagissez de manière vivante. N'hésitez pas à rire naturellement (ex : "Haha, c'est tellement vrai !", "Heh, je connais bien cette situation...").
4. **Interrompre ou relancer naturellement** : Ne suivez pas un script linéaire. Relancez en cours de route avec des expressions comme "Creusons ce point.", "Pouvez-vous clarifier ?", "Prenez votre temps.".
5. **Pas de transitions robotiques** : Ne dites JAMAIS de phrases comme "Passons maintenant à la question suivante", "Pour ma prochaine question", "En ce qui concerne votre CV", "Merci pour votre réponse. Ma prochaine question est...". Ces formulations sont strictement interdites.
6. **Formulation unique et variée** : Renouvelez constamment votre vocabulaire. Ne répétez jamais les mêmes expressions, accroches ou structures de questions deux fois dans l'entretien.
${recentSentencesPrompt}
`;
  }
}
