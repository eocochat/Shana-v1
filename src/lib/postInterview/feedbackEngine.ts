import { ExperienceRating } from './reviewState';

class FeedbackEngine {
  public submitRating(sessionId: string, rating: number, category: string, feedbackText?: string): ExperienceRating {
    const ratingObj: ExperienceRating = {
      rating,
      mostHelpfulCategory: category,
      feedbackText,
      timestamp: new Date().toISOString()
    };

    // Store in localStorage for persistence and audit
    localStorage.setItem(`shana_feedback_rating_${sessionId}`, JSON.stringify(ratingObj));

    // Also update the general post-interview state
    const cached = localStorage.getItem(`shana_post_interview_${sessionId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        parsed.ratings = ratingObj;
        localStorage.setItem(`shana_post_interview_${sessionId}`, JSON.stringify(parsed));
      } catch (e) {}
    }

    return ratingObj;
  }

  public getMostHelpfulChoices(isFR: boolean) {
    return [
      { id: 'conversation', label: isFR ? "Coaching Conversationnel" : "Post-Interview Coaching" },
      { id: 'replay', label: isFR ? "Recruiter Replay (Timeline)" : "Recruiter Replay (Timeline)" },
      { id: 'feedback', label: isFR ? "Détails Behind the Decision" : "Behind the Decision™ Details" },
      { id: 'voice', label: isFR ? "Évaluation Vocale Locale" : "High-Fidelity Voice Interview" },
      { id: 'practice', label: isFR ? "Entraînement des Points Faibles" : "Practice Weak Areas Sessions" },
      { id: 'other', label: isFR ? "Autre élément d'assistance" : "Other" }
    ];
  }
}

export const feedbackEngine = new FeedbackEngine();
