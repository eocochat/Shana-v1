import { ShanaEventTracker } from './events';
import { ContextPack } from './contextBuilder';

export interface QuestionResponse {
  question: string;
  question_type: string;
  expected_competency: string;
  difficulty_level: string;
  estimated_duration: string;
}

// Robust fallback question library that fully supports English & French and all requested types
export const STANDARD_QUESTION_LIBRARY: Record<string, Record<string, string[]>> = {
  English: {
    introduction: [
      "Could you please walk me through your professional background and highlight the key achievements that make you a great fit for this role?",
      "To start, could you introduce yourself and explain your main motivations for applying for this position?",
      "Could you summarize your career journey and explain how your experience aligns with the core requirements of this role?"
    ],
    behavioral: [
      "Tell me about a time you had to deal with a major conflict or disagreement within your team. How did you resolve it?",
      "Can you describe a high-pressure situation where you had to make a critical decision with limited information? What was the outcome?",
      "Share an experience where you had to manage a project with tight deadlines and competing priorities. How did you deliver?"
    ],
    technical: [
      "Can you describe a complex technical system or project you designed? What were the scaling challenges and how did you resolve them?",
      "What is your approach to technical risk mitigation, such as handling performance bottlenecks or architectural failures under load?",
      "How do you ensure code quality, test coverage, and continuous delivery reliability in a fast-paced environment?"
    ],
    follow_up: [
      "That is interesting. Can you expand on a specific technical challenge or business bottleneck you encountered in that situation and how you addressed it?",
      "Could you elaborate on the exact metrics or key results you used to measure the success of that project?",
      "Looking back, what is one thing you would have done differently in that project to improve the outcome?"
    ],
    pressure: [
      "Why should we hire you over other candidates who might have more specialized technical expertise or industry years?",
      "Tell me about a significant mistake or failure in your career. How did you handle the personal and professional fallout?",
      "If we were to ask your previous supervisor about your biggest professional weakness, what would they say and why?"
    ],
    reflective: [
      "How does this role fit into your long-term career trajectory, and what skills do you hope to master in the next few years?",
      "What does 'excellence' look like in this role, and how do you personally measure your own performance and growth?",
      "What type of team culture or leadership style enables you to perform at your absolute best?"
    ],
    clarification: [
      "Could you clarify your specific individual contribution to that project versus what was handled by the rest of the team?",
      "To make sure I fully understand, could you explain the architectural decision and why that specific technology was selected?",
      "Could you provide a more detailed breakdown of the steps you took to address that operational failure?"
    ]
  },
  French: {
    introduction: [
      "Pourriez-vous me présenter votre parcours et souligner les réalisations marquantes qui font de vous le candidat idéal ?",
      "Pour commencer, pouvez-vous vous présenter et expliquer vos principales motivations pour ce poste ?",
      "Pouvez-vous résumer votre parcours professionnel et expliquer comment votre expérience s'aligne avec les exigences du poste ?"
    ],
    behavioral: [
      "Parlez-moi d'une situation où vous avez dû gérer un conflit majeur ou un désaccord au sein de votre équipe. Comment l'avez-vous résolu ?",
      "Pouvez-vous décrire une situation de forte pression où vous avez dû prendre une décision critique avec peu d'informations ? Quel a été le résultat ?",
      "Partagez une expérience où vous avez dû mener un projet avec des délais serrés et des priorités contradictoires. Comment avez-vous assuré la livraison ?"
    ],
    technical: [
      "Pouvez-vous décrire une architecture technique complexe ou un projet que vous avez conçu ? Quels étaient les défis de mise à l'échelle ?",
      "Quelle est votre approche pour atténuer les risques techniques, comme la gestion des goulots d'étranglement ou des pannes d'architecture ?",
      "Comment garantissez-vous la qualité du code, la couverture des tests et la fiabilité du déploiement continu ?"
    ],
    follow_up: [
      "C'est un point intéressant. Pouvez-vous détailler un défi technique ou opérationnel précis dans ce contexte et comment vous l'avez surmonté ?",
      "Pourriez-vous préciser les indicateurs clés de performance ou métriques exactes qui ont servi à mesurer la réussite de ce projet ?",
      "Avec le recul, qu'auriez-vous fait différemment dans ce projet pour améliorer le résultat ?"
    ],
    pressure: [
      "Pourquoi devrions-nous vous embaucher plutôt qu'un autre candidat ayant potentiellement plus d'expertise ou d'années d'expérience ?",
      "Parlez-moi d'un échec ou d'une erreur marquante dans votre carrière. Comment avez-vous géré les conséquences ?",
      "Si nous demandions à votre précédent responsable quelle est votre plus grande faiblesse professionnelle, que répondrait-il et pourquoi ?"
    ],
    reflective: [
      "Comment ce poste s'inscrit-il dans votre plan de carrière à long terme, et quelles compétences espérez-vous maîtriser dans les prochaines années ?",
      "À quoi ressemble 'l'excellence' pour vous dans ce rôle, et comment évaluez-vous vos propres performances et votre progression ?",
      "Quel type de culture d'équipe ou de style de management vous permet de donner le meilleur de vous-même ?"
    ],
    clarification: [
      "Pourriez-vous clarifier votre contribution individuelle spécifique à ce projet par rapport à ce qui a été géré par le reste de l'équipe ?",
      "Afin d'être sûr de bien comprendre, pourriez-vous expliquer les raisons du choix de cette technologie ou de cette architecture spécifique ?",
      "Pourriez-vous nous donner une description plus détaillée des étapes que vous avez suivies pour résoudre cette panne opérationnelle ?"
    ]
  }
};

export const ShanaQuestionEngine = {
  /**
   * Generates the next question using the server-side API or standard fallsbacks if the call fails.
   * Keeps track of requested types, follows difficulty control, and prevents question duplication.
   */
  async generateNextQuestion(contextPack: ContextPack): Promise<QuestionResponse> {
    const userId = contextPack.user_profile.target_role ? (contextPack.session_state.session_id.split('_')[0] || 'usr_candidate') : 'usr_candidate';
    const sessionId = contextPack.session_state.session_id;

    // 1. Emit question_generation_requested event
    ShanaEventTracker.logEvent(userId, sessionId, 'question_generation_requested', {
      timestamp: new Date().toISOString(),
      questionIndex: contextPack.session_state.question_index,
      requestedDifficulty: contextPack.director_state.selected_mode || contextPack.interview_context.active_difficulty
    });

    try {
      console.log(`[SHANA QUESTION ENGINE] Attempting server-side generation for session ${sessionId}...`);
      const response = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contextPack })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.questionPack && data.questionPack.question) {
          const generated: QuestionResponse = data.questionPack;
          
          // 2. Emit question_generated event
          ShanaEventTracker.logEvent(userId, sessionId, 'question_generated', {
            question: generated.question,
            question_type: generated.question_type,
            expected_competency: generated.expected_competency,
            difficulty_level: generated.difficulty_level,
            estimated_duration: generated.estimated_duration,
            generation_method: 'AI'
          });

          return generated;
        }
      }
      throw new Error('Empty or invalid response from server-side Question Generator.');
    } catch (err: any) {
      console.warn(`[SHANA QUESTION ENGINE] AI Generation failed, activating FAILSAFE rule:`, err);
      
      // FALLBACK TO STANDARD QUESTION LIBRARY (Failsafe Rule)
      const lang = contextPack.user_profile.language || 'English';
      const languageKey = (lang === 'French' || lang === 'FR' || lang === 'fr') ? 'French' : 'English';
      
      // Map requested style or stage to question type
      let type: string = 'behavioral';
      
      const qIndex = contextPack.session_state.question_index;
      if (qIndex === 0) {
        type = 'introduction';
      } else {
        const typesList = ['behavioral', 'technical', 'follow_up', 'pressure', 'reflective', 'clarification'];
        type = typesList[qIndex % typesList.length];
      }

      // Check for repetition using recent events or questions already asked
      const recentAskedQuestions = contextPack.recent_events
        .map(e => e.payload?.text)
        .filter(t => !!t);

      const candidateQuestions = STANDARD_QUESTION_LIBRARY[languageKey]?.[type] || STANDARD_QUESTION_LIBRARY[languageKey]?.['behavioral'];
      
      // Select the first question that hasn't been asked, otherwise default to rotational
      let selectedQuestion = candidateQuestions[0];
      for (const q of candidateQuestions) {
        if (!recentAskedQuestions.some((asked: string) => asked.toLowerCase().includes(q.toLowerCase().substring(0, 15)))) {
          selectedQuestion = q;
          break;
        }
      }

      // If still matching a recent question, use rotational modulo to ensure variety
      if (recentAskedQuestions.includes(selectedQuestion)) {
        selectedQuestion = candidateQuestions[qIndex % candidateQuestions.length];
      }

      const fallbackPack: QuestionResponse = {
        question: selectedQuestion,
        question_type: type,
        expected_competency: type === 'technical' ? 'systems_design' : 'leadership_and_communication',
        difficulty_level: contextPack.interview_context.active_difficulty || 'Normal',
        estimated_duration: '3 minutes'
      };

      // 2. Emit question_generated event for the fallback
      ShanaEventTracker.logEvent(userId, sessionId, 'question_generated', {
        question: fallbackPack.question,
        question_type: fallbackPack.question_type,
        expected_competency: fallbackPack.expected_competency,
        difficulty_level: fallbackPack.difficulty_level,
        estimated_duration: fallbackPack.estimated_duration,
        generation_method: 'standard_library_fallback'
      });

      return fallbackPack;
    }
  },

  /**
   * Simple tracker helper to emit the question_displayed event when the question is rendered
   */
  logQuestionDisplayed(userId: string, sessionId: string, question: string, questionIndex: number): void {
    ShanaEventTracker.logEvent(userId, sessionId, 'question_displayed', {
      timestamp: new Date().toISOString(),
      questionText: question,
      questionIndex: questionIndex,
      source: 'SHANA_APPLICATION_CLIENT'
    });
  }
};
