import { SessionHistoryItem } from '../../types';

export interface MilestoneCelebration {
  title: string;
  badge: string;
  message: string;
  starsUnlocked: number;
}

class CelebrationEngine {
  public checkMilestones(session: SessionHistoryItem, history: SessionHistoryItem[], isFR: boolean): MilestoneCelebration | null {
    const totalCount = history.length;
    const score = session.score || 0;

    if (score >= 85) {
      return {
        title: isFR ? "Score d'Élite Obtenu !" : "Elite Score Achieved!",
        badge: "🏆",
        message: isFR
          ? `Exceptionnel ! Vous avez franchi la barre des 85% de préparation au poste de ${session.language === 'FR' ? 'Directeur / Expert' : 'Expert'}. Votre performance est jugée 'Hiring Ready' par notre algorithme de validation de présence.`
          : `Spectacular! You crossed the prestigious 85% readiness mark for the ${session.language === 'FR' ? 'Executive' : 'Expert'} track. Your delivery patterns are classified as fully ready for hiring.`,
        starsUnlocked: 5
      };
    }

    if (totalCount === 1) {
      return {
        title: isFR ? "Premier Diagnostic Réussi !" : "First Diagnostic Complete!",
        badge: "🚀",
        message: isFR
          ? "Félicitations pour avoir franchi le premier pas ! La vraie préparation commence maintenant. Nous avons mesuré votre élocution et conçu un plan de coaching personnalisé."
          : "Congratulations on taking the first step! Real interview confidence is built on structural iterations. We have mapped your baseline and unlocked your coaching journey.",
        starsUnlocked: 3
      };
    }

    // Check for progress relative to the previous session
    const prevSession = history.filter(h => h.id !== session.id)[0];
    if (prevSession && score > prevSession.score) {
      const diff = score - prevSession.score;
      return {
        title: isFR ? "Progression Confirmée !" : "Performance Jump!",
        badge: "📈",
        message: isFR
          ? `Excellent travail ! Vous avez progressé de +${diff}% par rapport à votre dernier entretien. Vos efforts sur la structure et le contrôle de l'élocution portent leurs fruits.`
          : `Amazing focus! You leaped by +${diff}% compared to your last session. Your focus on structural clarity and postural composure is actively paying off.`,
        starsUnlocked: 4
      };
    }

    return {
      title: isFR ? "Effort d'Entraînement Validé" : "Practice Run Logged",
      badge: "🌱",
      message: isFR
        ? "La régularité est la clé du succès. Chaque épreuve affine votre calme et renforce vos automatismes face aux questions pièges."
        : "Consistency is the ultimate competitive advantage. Every logged session calibrates your nervous system and reinforces automatic STAR responses.",
      starsUnlocked: 2
    };
  }
}

export const celebrationEngine = new CelebrationEngine();
