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

    // Split text into sentences, preserving the punctuation
    const sentenceRegex = /[^.!?]+[.!?]+(\s|$)/g;
    const sentences = cleanText.match(sentenceRegex)?.map(s => s.trim()) || [cleanText];

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
        .map(s => this.truncateLongSentence(s, 15)) // limit to a few words
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

  private static truncateLongSentence(sentence: string, maxWords: number): string {
    const words = sentence.split(" ");
    if (words.length <= maxWords) return sentence;
    
    // Truncate and add a smooth ending
    const punc = sentence.slice(-1);
    const hasPunc = [".", "!", "?"].includes(punc);
    const endChar = hasPunc ? punc : ".";
    return words.slice(0, maxWords).join(" ") + endChar;
  }
}
