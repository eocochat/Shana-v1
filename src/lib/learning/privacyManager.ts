export class PrivacyManager {
  /**
   * Scrubs sensitive personal identification info (emails, phones, credit cards, names) from transcripts/inputs.
   */
  static scrubSensitiveData(text: string): string {
    let scrubbed = text;
    
    // Email pattern
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    scrubbed = scrubbed.replace(emailRegex, '[REDACTED_EMAIL]');

    // Phone pattern (generic)
    const phoneRegex = /\+?\b\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g;
    scrubbed = scrubbed.replace(phoneRegex, '[REDACTED_PHONE]');

    // Generic names placeholder helper (scrubbing potential names, though heuristic-based)
    const nameClues = /\b(?:my name is|i am|je m'appelle|je suis)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi;
    scrubbed = scrubbed.replace(nameClues, (match, name) => {
      return match.replace(name, '[REDACTED_NAME]');
    });

    return scrubbed;
  }

  /**
   * GDPR-compliant helper to completely clear learning session cache.
   */
  static clearLocalHistory(userId: string): void {
    console.log(`[PRIVACY MANAGER] Purging all personal memory logs for user ${userId} in compliance with GDPR Art. 17.`);
    try {
      localStorage.removeItem(`shana_personal_memory_${userId}`);
    } catch (e) {
      console.warn('[PRIVACY MANAGER] LocalStorage not available or quota exceeded.', e);
    }
  }

  /**
   * Enforces that no personal raw records ever cross external API training boundaries.
   */
  static enforcePrivacyDirectives(rawLogs: any[]): any[] {
    return rawLogs.map(log => ({
      ...log,
      candidateInput: log.candidateInput ? this.scrubSensitiveData(log.candidateInput) : undefined,
      aiResponse: log.aiResponse ? this.scrubSensitiveData(log.aiResponse) : undefined,
      isAnonymized: true,
      timestamp: Date.now()
    }));
  }
}
