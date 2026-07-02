export class ConversationToneController {
  private static englishReplacements: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /\b(great job|excellent work|fantastic|awesome|wonderful|amazing|congratulations|superb|perfecto)\b/gi, replacement: "Understood" },
    { pattern: /\b(you are doing great|you're doing great|you're doing amazing|keep it up|very good start|excellent start)\b/gi, replacement: "Alright" },
    { pattern: /\b(very interesting answer|that is a very interesting answer)\b/gi, replacement: "Good" },
    { pattern: /\b(thank you for sharing that|thanks for sharing|thank you for your answer)\b/gi, replacement: "Got it" },
    { pattern: /\b(glad to hear that|nice to hear)\b/gi, replacement: "Alright" }
  ];

  private static frenchReplacements: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /\b(excellent début|très bon début|c'est un excellent début|bravo|félicitations|superbe réponse|excellent travail|fantastique|génial|parfait|parfaitement)\b/gi, replacement: "D'accord" },
    { pattern: /\b(vous vous en sortez très bien|vous faites du super boulot|continuez comme ça|très bonne réponse)\b/gi, replacement: "D'accord" },
    { pattern: /\b(c'est une réponse très intéressante|réponse très intéressante)\b/gi, replacement: "Très bien" },
    { pattern: /\b(merci de partager cela|merci d'avoir partagé|merci pour votre réponse)\b/gi, replacement: "Entendu" },
    { pattern: /\b(ravi d'entendre cela|c'est un plaisir d'entendre)\b/gi, replacement: "D'accord" }
  ];

  /**
   * Adjusts the tone of the sentence to match a professional, neutral recruiter.
   * Replaces robotic or overly hyper-supportive/motivational phrases.
   */
  public static adjustTone(text: string, isFrench: boolean = false): string {
    if (!text) return "";

    let adjusted = text;
    const replacements = isFrench ? this.frenchReplacements : this.englishReplacements;

    for (const item of replacements) {
      adjusted = adjusted.replace(item.pattern, item.replacement);
    }

    // Clean up duplicate confirmations if we replaced multiple back-to-back
    // E.g., "Alright. Alright." -> "Alright."
    if (isFrench) {
      adjusted = adjusted
        .replace(/\bD'accord\.\s+D'accord\./gi, "D'accord.")
        .replace(/\bEntendu\.\s+Entendu\./gi, "Entendu.")
        .replace(/\bD'accord\.\s+Entendu\./gi, "Entendu.")
        .replace(/\bEntendu\.\s+D'accord\./gi, "D'accord.");
    } else {
      adjusted = adjusted
        .replace(/\bAlright\.\s+Alright\./gi, "Alright.")
        .replace(/\bUnderstood\.\s+Understood\./gi, "Understood.")
        .replace(/\bAlright\.\s+Understood\./gi, "Understood.")
        .replace(/\bUnderstood\.\s+Alright\./gi, "Alright.");
    }

    return adjusted;
  }
}
