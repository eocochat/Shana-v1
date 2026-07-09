import { PressureLevel, EmotionState } from './conversationState';

export class PressureEngine {
  /**
   * Calculates the next appropriate pressure level for the interview session
   */
  static calculatePressure(
    currentLevel: PressureLevel,
    emotionState: EmotionState,
    difficulty: 'Easy' | 'Mid' | 'Hard' | string = 'Mid',
    turnNumber: number
  ): PressureLevel {
    // Standard baseline mappings
    let score = 50; // Neutral baseline

    // Emotional state affects pressure
    score += (emotionState.confidence - 50) * 0.4;
    score -= (emotionState.stress - 50) * 0.3;
    score -= (emotionState.hesitation - 50) * 0.2;
    score += (emotionState.engagement - 50) * 0.1;

    // Advanced compound emotional parameters fine-tune the pressure level
    if (emotionState.cognitiveLoad && emotionState.cognitiveLoad > 65) {
      score -= (emotionState.cognitiveLoad - 50) * 0.35; // lower pressure if cognitively overloaded
    }
    if (emotionState.imposterIndex && emotionState.imposterIndex > 58) {
      score -= (emotionState.imposterIndex - 50) * 0.25; // lower pressure for self-minimizing strain
    }
    if (emotionState.defensiveness && emotionState.defensiveness > 50) {
      score -= (emotionState.defensiveness - 50) * 0.2; // lower pressure to de-escalate defensiveness
    }
    if (emotionState.flowStateRating && emotionState.flowStateRating > 72) {
      score += (emotionState.flowStateRating - 50) * 0.3; // increase pressure constructs if in peak flow state
    }

    // Difficulty baseline weighting
    if (difficulty === 'Easy') score -= 20;
    if (difficulty === 'Hard') score += 20;

    // Progression of the interview (mid-to-late turns are naturally more professional/demanding)
    if (turnNumber > 3) score += 10;
    if (turnNumber > 5) score += 10;

    // Map computed score to the 5 distinct pressure levels
    if (score < 30) {
      return 'Supportive';
    } else if (score >= 30 && score < 50) {
      return 'Neutral';
    } else if (score >= 50 && score < 70) {
      return 'Professional';
    } else if (score >= 70 && score < 85) {
      return 'Demanding';
    } else {
      return 'Stress'; // High-pressure / Skeptical
    }
  }

  /**
   * Generates systemic instructions for the AI prompt based on current pressure level
   */
  static getPressureDirective(level: PressureLevel, language: string = 'English'): string {
    const isEng = language === 'English' || language === 'EN';
    
    switch (level) {
      case 'Supportive':
        return isEng
          ? `[PRESSURE MODE: SUPPORTIVE]: The candidate seems slightly stressed or hesitant. Actively lower the tension. Acknowledge their efforts warmly, speak with a calm and encouraging demeanor, ask clear, bite-sized questions, and use conversational pacing to help them regain momentum.`
          : `[PRESSURE MODE: SUPPORTIVE]: Le candidat semble un peu stressé ou hésitant. Réduisez la tension. Encouragez-le chaleureusement, parlez d'un ton calme, posez des questions simples et courtes, et facilitez la reprise de confiance.`;
          
      case 'Neutral':
        return isEng
          ? `[PRESSURE MODE: NEUTRAL]: Maintain a comfortable, standard, conversational tone. Be polite and professional. Neither praise nor critique too intensely.`
          : `[PRESSURE MODE: NEUTRAL]: Maintenez un ton conversationnel confortable, standard et poli. Restez un recruteur agréable et professionnel.`;
          
      case 'Professional':
        return isEng
          ? `[PRESSURE MODE: PROFESSIONAL]: Standard executive recruitment setting. Keep a direct, polite, yet rigorous tone. Ask standard structured questions. Do not offer excessive affirmations.`
          : `[PRESSURE MODE: PROFESSIONAL]: Cadre de recrutement standard. Gardez un ton direct, poli et rigoureux. Posez des questions structurées professionnelles sans compliments superflus.`;
          
      case 'Demanding':
        return isEng
          ? `[PRESSURE MODE: DEMANDING]: Candidate is performing well. Increase rigor. Show mild professional skepticism, point out minor logical gaps, drill into details, and expect structured business reasoning (STAR format).`
          : `[PRESSURE MODE: DEMANDING]: Le candidat s'en sort bien. Augmentez la rigueur. Affichez un léger scepticisme professionnel, relevez les petites zones d'ombre, exigez des justifications et une structure logique (STAR).`;
          
      case 'Stress':
        return isEng
          ? `[PRESSURE MODE: STRESS INTERVIEW]: Execute a high-pressure stress-test scenario. Challenge their claims directly, ask about cost trade-offs, question their authority or metrics, and maintain a highly serious, intense, and demanding posture to test their composure.`
          : `[PRESSURE MODE: STRESS INTERVIEW]: Menez une simulation sous haute tension. Remettez en question leurs choix stratégiques, demandez des détails sur les coûts/compromis, contestez l'autorité ou les métriques partagées, et restez extrêmement sérieux et rigoureux pour tester leur résistance au stress.`;
          
      default:
        return "";
    }
  }
}
