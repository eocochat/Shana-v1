export interface InterruptionTrigger {
  triggered: boolean;
  reason: 'too_long' | 'no_metrics' | 'off_topic' | 'repetition' | 'excessive_filler' | 'none';
  prefaceEN: string;
  prefaceFR: string;
}

export class InterruptionEngine {
  /**
   * Evaluates if the candidate's answer should be politely interrupted
   */
  static evaluate(userInput: string, elapsedSeconds: number = 0): InterruptionTrigger {
    const text = userInput.trim();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // 1. Check for excessive length (e.g., candidate going on and on)
    if (wordCount > 220 || text.length > 1100) {
      return {
        triggered: true,
        reason: 'too_long',
        prefaceEN: "I'll stop you right there to make sure we stay on track. Can you summarize your main point in a few sentences, focusing on your direct contribution?",
        prefaceFR: "Je vous arrête là une seconde pour nous assurer de garder le cap. Pouvez-vous résumer votre point principal en quelques mots, en vous concentrant sur votre contribution directe ?"
      };
    }

    // 2. Check for filler word repetition
    const fillersEN = ['like', 'you know', 'actually', 'basically', 'um', 'uh', 'so yeah'];
    const fillersFR = ['du coup', 'en fait', 'genre', 'voilà', 'euh', 'tu sais', 'en gros'];
    let fillerCount = 0;

    fillersEN.forEach(f => {
      const regex = new RegExp(`\\b${f}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) fillerCount += matches.length;
    });
    fillersFR.forEach(f => {
      const regex = new RegExp(`\\b${f}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) fillerCount += matches.length;
    });

    if (fillerCount >= 6 && wordCount > 50) {
      return {
        triggered: true,
        reason: 'excessive_filler',
        prefaceEN: "Thank you, let's zoom in a bit. Could you re-explain the core of that action more crisply, moving past the high-level details?",
        prefaceFR: "Merci, recentrons-nous un peu. Pouvez-vous m'expliquer le cœur de cette action de manière plus directe, en allant droit au but ?"
      };
    }

    // 3. Repetition check (vague, circular answers repeating the same keywords)
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    if (wordCount > 60 && (uniqueWords.size / wordCount) < 0.45) {
      return {
        triggered: true,
        reason: 'repetition',
        prefaceEN: "Let's pivot here to dig into the details. What was the exact technical or strategic action you took, specifically?",
        prefaceFR: "Pivotons un instant pour entrer dans les détails concrets. Quelle a été l'action technique ou stratégique exacte que vous avez menée ?"
      };
    }

    // Default: No interruption needed
    return {
      triggered: false,
      reason: 'none',
      prefaceEN: "",
      prefaceFR: ""
    };
  }
}
