export class ResponseShortener {
  /**
   * Shortens the response according to rules:
   * - Questions -> 1 sentence
   * - Feedback/Confirmations -> max 1-2 short sentences
   * - Never long paragraphs
   */
  public static shorten(text: string, isFrench: boolean = false): string {
    if (!text || !text.trim()) return "";

    // Normalize whitespace and clean up markdown
    let cleanText = text
      .replace(/\*\*/g, "") // Remove bold markdown
      .replace(/\*/g, "")   // Remove bullet markdown
      .replace(/_/g, "")    // Remove italics markdown
      .replace(/`+/g, "")   // Remove backticks
      .replace(/\s+/g, " ")
      .trim();

    // Split text into sentences, preserving the punctuation and handling decimals/abbreviations robustly
    const sentences = this.splitIntoSentences(cleanText);

    const questions: string[] = [];
    const feedback: string[] = [];

    for (const sentence of sentences) {
      if (sentence.endsWith("?")) {
        questions.push(sentence);
      } else {
        feedback.push(sentence);
      }
    }

    // Limit feedback to max 1-2 short sentences
    let finalFeedback = "";
    if (feedback.length > 0) {
      // Pick the first 1 or 2 feedback sentences and ensure they are short
      const selectedFeedback = feedback.slice(0, 2);
      finalFeedback = selectedFeedback
        .map(s => this.truncateLongSentence(s, 28)) // limit to a natural 28 words to avoid cutting sentences mid-thought
        .join(" ");
    }

    // Limit questions to exactly 1 sentence
    let finalQuestion = "";
    if (questions.length > 0) {
      // Take the last or most prominent question
      finalQuestion = questions[questions.length - 1];
    } else if (sentences.length > 0 && !sentences[sentences.length - 1].endsWith("?")) {
      // If no question marks, but the last sentence sounds like a prompt, keep it
      const last = sentences[sentences.length - 1];
      if (last.toLowerCase().includes("tell me") || last.toLowerCase().includes("parlez-moi") || last.toLowerCase().includes("expliquez")) {
        finalQuestion = last;
      }
    }

    // Assemble back
    if (finalFeedback && finalQuestion) {
      return `${finalFeedback} ${finalQuestion}`;
    } else if (finalQuestion) {
      return finalQuestion;
    } else if (finalFeedback) {
      return finalFeedback;
    }

    return cleanText;
  }

  /**
   * Helper to split text into sentences without breaking on decimals (e.g. 3.5) or common abbreviations.
   */
  public static splitIntoSentences(text: string): string[] {
    if (!text || !text.trim()) return [];

    let placeholderText = text;

    // Protect decimals (e.g. "3.5" -> "3_DECIMAL_POINT_5")
    placeholderText = placeholderText.replace(/(\d)\.(\d)/g, "$1_DECIMAL_POINT_$2");

    // Protect abbreviations (case-insensitive)
    const abbreviations = [
      "e.g.", "i.e.", "u.s.", "u.k.", "dr.", "mr.", "ms.", "mrs.", "vs.", "prof.", "sr.", "jr.", "etc."
    ];

    for (const abbr of abbreviations) {
      const escaped = abbr.replace(/\./g, "\\.");
      const regex = new RegExp(`\\b${escaped}`, "gi");
      const placeholder = abbr.replace(/\./g, "_DOT_");
      placeholderText = placeholderText.replace(regex, placeholder);
    }

    // Split using sentence punctuation
    const sentenceRegex = /[^.!?]+[.!?]+(?:\s+|$)/g;
    const matches = placeholderText.match(sentenceRegex) || [placeholderText];

    // Restore protected patterns
    return matches.map(s => {
      let restored = s.trim();
      restored = restored.replace(/_DECIMAL_POINT_/g, ".");
      restored = restored.replace(/_DOT_/g, ".");
      return restored;
    });
  }

  private static truncateLongSentence(sentence: string, maxWords: number): string {
    const words = sentence.split(/\s+/);
    if (words.length <= maxWords) return sentence;
    
    // Truncate and add a smooth ending
    const punc = sentence.slice(-1);
    const hasPunc = [".", "!", "?"].includes(punc);
    const endChar = hasPunc ? punc : ".";
    return words.slice(0, maxWords).join(" ") + endChar;
  }
}
