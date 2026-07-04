export interface UserFeedbackRecord {
  id: string;
  sessionId: string;
  ratingScore: number; // 1 to 5
  tags: Array<'Helpful' | 'Not helpful' | 'Too strict' | 'Too easy' | 'Incorrect evaluation' | 'Confusing feedback' | string>;
  writtenComment?: string;
  timestamp: number;
}

export class FeedbackLearningEngine {
  private static feedbackLogs: UserFeedbackRecord[] = [
    {
      id: 'fb-1',
      sessionId: 'sess-abc',
      ratingScore: 5,
      tags: ['Helpful'],
      writtenComment: 'The STAR coaching was super actionable!',
      timestamp: Date.now() - 86400000
    },
    {
      id: 'fb-2',
      sessionId: 'sess-xyz',
      ratingScore: 2,
      tags: ['Too strict', 'Incorrect evaluation'],
      writtenComment: 'Recruiter was overly aggressive during the warm-up question.',
      timestamp: Date.now() - 43200000
    }
  ];

  /**
   * Registers a user feedback record safely.
   */
  static submitFeedback(record: Omit<UserFeedbackRecord, 'id' | 'timestamp'>): UserFeedbackRecord {
    const fullRecord: UserFeedbackRecord = {
      ...record,
      id: `fb-gen-${Date.now()}`,
      timestamp: Date.now()
    };

    this.feedbackLogs.push(fullRecord);
    console.log(`[FEEDBACK ENGINE] Registered structured rating of ${fullRecord.ratingScore}/5 for session ${fullRecord.sessionId}`);
    
    return fullRecord;
  }

  /**
   * Computes average rating and tags frequencies to provide actionable signals
   */
  static analyzeFeedbackSignals(): {
    averageRating: number;
    tagCounts: Record<string, number>;
    totalFeedbackCount: number;
  } {
    if (this.feedbackLogs.length === 0) {
      return { averageRating: 5.0, tagCounts: {}, totalFeedbackCount: 0 };
    }

    const total = this.feedbackLogs.length;
    const avg = this.feedbackLogs.reduce((acc, r) => acc + r.ratingScore, 0) / total;
    
    const tagCounts: Record<string, number> = {};
    this.feedbackLogs.forEach(r => {
      r.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });

    return {
      averageRating: parseFloat(avg.toFixed(2)),
      tagCounts,
      totalFeedbackCount: total
    };
  }

  /**
   * Clears old data (supporting the Privacy / GDPR guidelines if session matching occurs)
   */
  static purgeFeedbackForSession(sessionId: string): void {
    this.feedbackLogs = this.feedbackLogs.filter(f => f.sessionId !== sessionId);
  }

  /**
   * Returns all feedback records
   */
  static getAllFeedback(): UserFeedbackRecord[] {
    return [...this.feedbackLogs];
  }
}
