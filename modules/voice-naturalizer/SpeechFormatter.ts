export class SpeechFormatter {
  private static englishFormalReplacements: Array<{ pattern: RegExp; replacement: string }> = [
    // Next question / proceed transitions
    { pattern: /\b(let's proceed to the next question in your interview|let's move on to the next question of your interview|let's move on to the next question|let's proceed to the next question|we will now proceed to the next question)\b/gi, replacement: "Alright... next question." },
    { pattern: /\b(let's move to the next phase|moving to the next phase)\b/gi, replacement: "Next question." },
    
    // Questions / Elaboration requests
    { pattern: /\b(could you please describe|would you please describe|can you please describe|please describe|can you describe)\b/gi, replacement: "Tell me about" },
    { pattern: /\b(could you please explain|would you please explain|can you please explain|please explain|can you explain)\b/gi, replacement: "Explain to me" },
    { pattern: /\b(could you please elaborate|can you please elaborate|can you elaborate|could you elaborate)\b/gi, replacement: "Tell me more about" },
    { pattern: /\b(could you please share|can you please share|please share|can you share)\b/gi, replacement: "Tell me about" },
    
    // Meta / AI sentences
    { pattern: /\b(as an ai recruiter|as an ai career coach|as shana|as an elite ai|as a career strategy coach)\b/gi, replacement: "" },
    { pattern: /\b(in this coaching session|in this interview training|in this audio training session|in this voice training mode)\b/gi, replacement: "" },
    { pattern: /\b(let's tackle how you lead|let's check how you|let's dive into|let's deep dive into)\b/gi, replacement: "" },
    
    // Robotic closing remarks
    { pattern: /\b(thank you for your detailed response|thank you for sharing that answer)\b/gi, replacement: "Understood." }
  ];

  private static frenchFormalReplacements: Array<{ pattern: RegExp; replacement: string }> = [
    // Next question / proceed transitions
    { pattern: /\b(passons maintenant à la question suivante de votre entretien|passons à la question suivante de votre entraînement|passons à la question suivante|passons maintenant à la question suivante|nous allons maintenant passer à la question suivante)\b/gi, replacement: "D'accord... question suivante." },
    { pattern: /\b(passons à la phase suivante|nous passons à l'étape suivante)\b/gi, replacement: "Question suivante." },
    
    // Questions / Elaboration requests
    { pattern: /\b(pourriez-vous s'il vous plaît décrire|pourriez-vous décrire|pouvez-vous s'il vous plaît décrire|pouvez-vous décrire|veuillez décrire)\b/gi, replacement: "Parlez-moi de" },
    { pattern: /\b(pourriez-vous s'il vous plaît expliquer|pourriez-vous expliquer|pouvez-vous s'il vous plaît expliquer|pouvez-vous expliquer|veuillez expliquer)\b/gi, replacement: "Expliquez-moi" },
    { pattern: /\b(pourriez-vous s'il vous plaît détailler|pourriez-vous détailler|pouvez-vous s'il vous plaît détailler|pouvez-vous détailler|veuillez détailler)\b/gi, replacement: "Dites-m'en plus sur" },
    { pattern: /\b(pourriez-vous s'il vous plaît partager|pouvez-vous partager|veuillez partager)\b/gi, replacement: "Parlez-moi de" },
    
    // Meta / AI sentences
    { pattern: /\b(en tant que coach de carrière ia|en tant que shana|en tant qu'ia|en tant que recruteur ia|en tant que simulateur)\b/gi, replacement: "" },
    { pattern: /\b(dans cette session de coaching|dans cet entraînement audio|dans ce mode d'entraînement|dans ce simulateur)\b/gi, replacement: "" },
    { pattern: /\b(abordons maintenant comment vous|voyons comment vous|plongeons dans|faisons un zoom sur)\b/gi, replacement: "" },
    
    // Robotic closing remarks
    { pattern: /\b(merci pour votre réponse détaillée|merci d'avoir partagé cette réponse)\b/gi, replacement: "Entendu." }
  ];

  /**
   * Translates written formal text into natural spoken recruiter script.
   */
  public static formatToSpeech(text: string, isFrench: boolean = false): string {
    if (!text) return "";

    let formatted = text;
    const replacements = isFrench ? this.frenchFormalReplacements : this.englishFormalReplacements;

    for (const item of replacements) {
      formatted = formatted.replace(item.pattern, item.replacement);
    }

    // Post-processing cleanup
    formatted = formatted
      .replace(/\s+/g, " ")
      .trim();

    // Clean up trailing/leading punctuations or double sentence dots
    formatted = formatted
      .replace(/\.\.+/g, "...")
      .replace(/\.\s+\./g, ".")
      .replace(/\s*,\s*,/g, ",")
      .trim();

    return formatted;
  }
}
