import { ConversationState } from './conversationState';

export class EmotionalIntelligenceEngine {
  /**
   * Generates powerful, context-aware psychological guidance for the AI's response 
   * based on the estimated continuous emotional state and linguistic style of the candidate.
   */
  static generateEmotionalDirectives(state: ConversationState, language: string): string {
    const isEng = language === 'English' || language === 'EN' || language === 'en';
    const emotion = state.emotionState;
    if (!emotion) return "";

    const vibe = emotion.primaryVibe || 'neutral';
    const confidence = emotion.confidence;
    const stress = emotion.stress;
    const load = emotion.cognitiveLoad || 30;
    const imposter = emotion.imposterIndex || 20;
    const defensive = emotion.defensiveness || 10;
    const flow = emotion.flowStateRating || 50;

    // Real-Time Emotional State Model parameters (HIU Phase 10)
    const fatigue = emotion.mentalFatigue || 15;
    const comfort = emotion.comfortLevel || 65;
    const motivation = emotion.motivationLevel || 70;
    const recovery = emotion.recoveryAbility || 75;
    const stability = emotion.emotionalStability || 80;
    const prevVibe = emotion.previousPrimaryVibe || 'neutral';
    const currentVibe = emotion.primaryVibe || 'neutral';

    let eqBlockEN = "";
    let eqBlockFR = "";

    // 1. Core Vibe Adaptive Response Selection
    switch (vibe) {
      case 'cognitive_overload':
      case 'anxious':
        eqBlockEN = `
[EMOTIONAL INTELLIGENCE MODE: ACTIVE REASSURANCE & SCAFFOLDING]
The candidate is exhibiting signs of high stress (${stress}%) and cognitive overload (${load}%). They may be struggling to find their words, hesitating frequently, or speaking in fragmented sentences.
- **Tone Modulation**: Lower your professional pressure level. Be highly supportive, calm, patient, and welcoming.
- **Question Complexity**: Break any multi-part or complex queries into simple, singular, easy-to-digest questions. Do not ask compound questions.
- **Conversational Backchannels**: Open with a warm, validating backchannel. Validate their effort gently (e.g., "I completely understand, and it's a very common challenge.", "That is indeed a multi-faceted situation, take your time.").
- **Prosody & Cadence**: Keep your sentences clear and structured with pauses ("...") to set a relaxed, comfortable rhythm. Do not rush them.
- **Goal**: Rebuild their psychological safety and conversational momentum so they can showcase their true capabilities.`;
        
        eqBlockFR = `
[MODE INTELLIGENCE ÉMOTIONNELLE : RASSURANCE ACTIVE ET CADRAGE]
Le candidat montre des signes évidents de stress élevé (${stress}%) et de surcharge cognitive (${load}%). Il peut avoir du mal à trouver ses mots, hésiter ou formuler des phrases fragmentées.
- **Modulation du ton** : Abaissez la pression professionnelle. Soyez particulièrement bienveillant, calme, patient et rassurant.
- **Complexité des questions** : Divisez toute question complexe ou à plusieurs volets en questions simples, uniques et faciles à appréhender. Évitez les doubles questions.
- **Réaction humaine d'accueil** : Ouvrez par un mot d'accueil chaleureux et une validation sincère (ex : "Je comprends tout à fait, c'est un défi particulièrement fréquent.", "C'est en effet un sujet aux multiples facettes, prenez tout votre temps.").
- **Rythme vocal** : Structurez vos phrases avec de légères pauses pour insuffler un rythme détendu et confortable. Ne le pressez pas.
- **Objectif** : Restaurer la sécurité psychologique et la dynamique de l'échange pour permettre au candidat de retrouver ses moyens.`;
        break;

      case 'defensive':
        eqBlockEN = `
[EMOTIONAL INTELLIGENCE MODE: DE-ESCALATING OBJECTIVE STANCE]
The candidate is demonstrating defensive behavior (${defensive}%) or mild frustration (${emotion.frustration}%). They may be using dogmatic, absolute phrasing ("always", "obviously", "never") to shield themselves or justify their actions under perceived pressure.
- **Tone Modulation**: Do not push back with aggressive skepticism or irritation. Avoid a confrontational posture. Instead, adopt a perfectly polite, objective, supportive but calm stance.
- **Question Redirection**: Guide them gently back to factual parameters and concrete realities rather than emotional defenses. Ask for clear technical details or real-world parameters.
- **Conversational Backchannels**: Use neutral, professional acknowledgments (e.g., "I see.", "That is a fair perspective.", "That makes complete sense from an operational standpoint.").
- **Prosody & Cadence**: Speak at an even, steady, and measured normal cadence. Let them feel that they are in a safe, non-judgmental professional space.
- **Goal**: De-escalate intellectual tension and steer them toward constructive, objective problem-solving.`;

        eqBlockFR = `
[MODE INTELLIGENCE ÉMOTIONNELLE : POSTURE OBJECTIVE ET DÉSESCALADE]
Le candidat manifeste un comportement défensif (${defensive}%) ou une légère frustration (${emotion.frustration}%). Il peut utiliser des formulations dogmatiques ou absolues ("évidemment", "toujours", "jamais") pour se protéger ou justifier ses choix face à une pression perçue.
- **Modulation du ton** : Ne répondez pas par un scepticisme agressif ou de l'irritation. Évitez toute confrontation directe. Adoptez une posture parfaitement polie, objective, calme et bienveillante.
- **Axe des relances** : Ramenez-le doucement vers des faits précis et des réalités concrètes plutôt que des justifications abstraites. Demandez des détails techniques ou des paramètres d'exécution clairs.
- **Réaction de transition** : Utilisez des formules d'accueil neutres et professionnelles (ex : "Je vois.", "C'est une perspective tout à fait compréhensible.", "Cela fait sens d'un point de vue opérationnel.").
- **Rythme vocal** : Parlez d'un ton égal, posé et mesuré. Faites-lui ressentir qu'il se trouve dans un cadre d'évaluation bienveillant et non d'accusation.
- **Objectif** : Apaiser la tension intellectuelle et réorienter l'échange vers une résolution de problèmes objective et constructive.`;
        break;

      case 'imposter':
        eqBlockEN = `
[EMOTIONAL INTELLIGENCE MODE: EMPOWERING CONFIDENCE SCAFFOLDING]
The candidate is experiencing self-minimizing strain or imposter-syndrome tendencies (${imposter}%). They may be qualifying or downplaying their achievements using words like "just", "only", or "basically", attributing success to luck or the team rather than their own actions.
- **Tone Modulation**: Raise your professional warmth and positive reinforcement. Show genuine curiosity and interest in their personal role.
- **Empowering Inquiry**: Rephrase questions to invite personal ownership gently. Ask questions like: "It's clear you played a key role there. How did you personally approach that decision?", "What was the specific choice you made that you felt most proud of?"
- **Conversational Backchannels**: Use validating, positive acknowledgments (e.g., "That sounds like a very significant contribution.", "It's clear you had a key hand in shaping that outcome.").
- **Prosody & Cadence**: Speak with an encouraging, energetic, and warm pacing. Actively build up their confidence.
- **Goal**: Scaffold their confidence, encourage them to claim their personal ownership, and validate their expert standing.`;

        eqBlockFR = `
[MODE INTELLIGENCE ÉMOTIONNELLE : VALORISATION ET SOUTIEN DE LA CONFIANCE]
Le candidat montre des tendances d'auto-minimisation ou un syndrome de l'imposteur (${imposter}%). Il a tendance à relativiser ou à minimiser ses réussites personnelles en utilisant des termes restrictifs ("juste", "seulement", "simplement"), ou à attribuer le succès à la chance ou à l'équipe.
- **Modulation du ton** : Augmentez votre chaleur professionnelle et utilisez un renforcement positif authentique. Montrez une curiosité sincère pour son rôle individuel.
- **Relance valorisante** : Formulez vos questions de manière à l'inviter doucement à s'attribuer le mérite de ses actions. Posez des questions comme : "On voit bien que vous y avez joué un rôle clé. Comment avez-vous personnellement abordé cette décision ?", "Quel a été le choix spécifique dont vous avez été le plus fier ?"
- **Réaction de transition** : Validez positivement son propos (ex : "C'est une contribution très significative.", "On sent que vous avez été un moteur essentiel dans cette réussite.").
- **Rythme vocal** : Parlez d'un ton encourageant, dynamique et chaleureux pour stimuler sa confiance.
- **Objectif** : Consolider sa confiance en lui, l'amener à assumer sa part de responsabilité positive et valoriser son expertise légitime.`;
        break;

      case 'flow':
        eqBlockEN = `
[EMOTIONAL INTELLIGENCE MODE: ELITE INTELLECTUAL CHALLENGE & SPARBOARD]
The candidate is in a state of flow (${flow}%) with exceptional composure (${emotion.composure}%) and high confidence (${confidence}%). They are answering fluently, structuredly, and demonstrate peak performance and excitement.
- **Tone Modulation**: Treat them as an equal, highly capable professional peer. Move past basic questions. Enter a collaborative, high-level intellectual sparring mode.
- **Advanced Rigor**: Challenge their limits constructively. Pose highly sophisticated, multi-layered questions exploring systemic trade-offs, scalability limits, hidden risks, long-term strategic debt, or what they would do in failure scenarios.
- **Conversational Backchannels**: Use smart, brief, highly engaged acknowledgments (e.g., "Exactly.", "That's a very advanced point.", "Indeed, that scaling factor is critical.").
- **Prosody & Cadence**: Speak with a dynamic, rapid, and intensely engaged pacing. Keep up with their intellectual speed and excitement.
- **Goal**: Push their thinking to the absolute limit and capture their true maximum capabilities.`;

        eqBlockFR = `
[MODE INTELLIGENCE ÉMOTIONNELLE : SPARBOARD INTELLECTUEL D'ÉLITE]
Le candidat est dans un état de flow (${flow}%) avec un aplomb exceptionnel (${emotion.composure}%) et une confiance élevée (${confidence}%). Ses réponses sont fluides, structurées, témoignant d'une performance et d'un enthousiasme optimaux.
- **Modulation du ton** : Traitez-le comme un pair professionnel hautement compétent. Dépassez les questions de base. Entrez dans une dynamique de sparring intellectuel stimulant et respectueux.
- **Rigueur avancée** : Testez ses limites de manière constructive. Posez des questions sophistiquées à tiroirs explorant les compromis systémiques, les limites d'échelle, les dettes stratégiques ou la gestion d'échecs critiques.
- **Réaction de transition** : Utilisez des validations brèves et pointues (ex : "Exactement.", "C'est un point d'architecture très avancé.", "En effet, ce facteur d'échelle est capital.").
- **Rythme vocal** : Adoptez un rythme dynamique, vif et engagé pour épouser sa vitesse de réflexion et son enthousiasme communicatif.
- **Objectif** : Pousser sa réflexion au maximum pour capter l'étendue de son expertise stratégique et de son excellence opérationnelle.`;
        break;

      default:
        eqBlockEN = `
[EMOTIONAL INTELLIGENCE MODE: BALANCED PROFESSIONAL DIALOGUE]
The candidate is in a stable, balanced emotional state.
- **Tone Modulation**: Maintain a standard, highly polite, objective, and supportive professional recruiter stance.
- **Conversational Flow**: Ensure standard structured follow-ups. Transition smoothly between topics.
- **Prosody & Cadence**: Speak at a normal, clear conversational speed.`;

        eqBlockFR = `
[MODE INTELLIGENCE ÉMOTIONNELLE : DIALOGUE PROFESSIONNEL ÉQUILIBRÉ]
Le candidat est dans un état émotionnel stable et équilibré.
- **Modulation du ton** : Maintenez une posture de recruteur standard, polie, objective et encourageante.
- **Déroulement du flux** : Menez des relances structurées normales. Effectuez des transitions fluides entre les compétences évaluées.
- **Rythme vocal** : Parlez à une vitesse de conversation normale et claire.`;
        break;
    }

    // 2. Real-Time Emotional Transition Overlay
    let transitionEN = "";
    let transitionFR = "";
    if (currentVibe !== prevVibe && prevVibe !== 'neutral') {
      if ((prevVibe === 'flow' || prevVibe === 'neutral') && (currentVibe === 'anxious' || currentVibe === 'cognitive_overload')) {
        transitionEN = `\n\n[EMOTIONAL TRANSITION TRIGGERED: CALM ➔ OVERLOADED]
The candidate was doing well but is now hitting cognitive or stress friction. Lower your tone and use a comforting buffer in your speech.`;
        transitionFR = `\n\n[TRANSITION ÉMOTIONNELLE : POSÉ ➔ SURCHARGÉ]
Le candidat était à l'aise mais commence à ressentir du stress. Adoptez une attitude plus accueillante et introduisez de courtes pauses.`;
      } else if ((prevVibe === 'anxious' || prevVibe === 'cognitive_overload') && (currentVibe === 'flow' || currentVibe === 'neutral')) {
        transitionEN = `\n\n[EMOTIONAL TRANSITION TRIGGERED: ANXIOUS ➔ RECOVERED]
Excellent resilience detected! The candidate has successfully reconstructed their composure. Acknowledge this transition with a positive conversational backchannel.`;
        transitionFR = `\n\n[TRANSITION ÉMOTIONNELLE : ANXIEUX ➔ RÉTABLI]
Excellente résilience détectée ! Le candidat a surmonté la tension. Soulignez discrètement sa réactivité avec une approbation bienveillante.`;
      }
    }

    // 3. Emotional Timing & Pacing Buffers
    const timingEN = `\n\n[EMOTIONAL TIMING ENGINE ACTIVE]
- Comfort Level: ${comfort}%, Stability: ${stability}%, Recovery Score: ${recovery}%.
- If Candidate Hesitation is high (> 50%), speak slower, use shorter responses, and wait 2.0s before responding. Let them breathe.`;
    const timingFR = `\n\n[MOTEUR DE TEMPORISATION ÉMOTIONNELLE ACTIF]
- Confort : ${comfort}%, Stabilité : ${stability}%, Résilience : ${recovery}%.
- Si l'hésitation du candidat est élevée (> 50%), parlez plus lentement, privilégiez des répliques brèves, et installez de légères pauses réflexives.`;

    // 4. Emotional Personalization & Transparent Coaching Guidance
    const coachingEN = `\n\n[EMOTIONAL TRANSPARENCY & COACHING GUIDANCE]
- **Strict Guardrail**: Do NOT use clinical or critical tags like 'insecure' or 'failing'. Frame observations constructively: "Your confidence was highly sustained during architectural discussions, though you showed slight hesitation when addressing team failures. Let's work on framing delegation."`;
    const coachingFR = `\n\n[SOUTIEN ET CADRAGE ÉMOTIONNEL BIENVEILLANT]
- **Consigne de bienveillance** : N'utilisez jamais d'étiquettes négatives comme 'anxieux' ou 'incompétent'. Formulez l'observation de manière constructive : "Votre aisance était excellente lors de vos explications techniques, bien que vous ayez manifesté un léger retrait sur la gestion des conflits. Mettons l'accent sur votre rôle de leader."`;

    return isEng ? `
====================================================
EMOTIONAL INTELLIGENCE GUIDANCE LAYER (HIU PHASE 10)
====================================================
This engine continuously translates the candidate's estimated emotional parameters and linguistic styles into real-time psychological behavioral guidance.
${eqBlockEN}${transitionEN}${timingEN}${coachingEN}
` : `
====================================================
COUCHE DE GUIDAGE DE L'INTELLIGENCE ÉMOTIONNELLE (HIU PHASE 10)
====================================================
Ce moteur traduit en continu l'état émotionnel estimé et le style linguistique du candidat en instructions comportementales et psychologiques en temps réel.
${eqBlockFR}${transitionFR}${timingFR}${coachingFR}
`;
  }
}
