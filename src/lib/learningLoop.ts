/**
 * SHANA — PHASE 5
 * LEARNING VALIDATION LOOP
 *
 * Ensures that SHANA's adaptive, director, and serendipity systems are actually helping
 * users improve over time. Every system action is tracked before/after and validated.
 */

import { IPSResult } from './ips';

export interface ActionMetrics {
  ips: number;
  clarity: number;
  structure: number;
  confidence: number;
  relevance: number;
  conciseness: number;
}

export interface ValidationLog {
  actionId: string;
  userId: string;
  system: 'Adaptive' | 'Director' | 'Serendipity';
  inputContext: string;
  actionApplied: string;
  beforeMetrics: ActionMetrics;
  afterMetrics: ActionMetrics | null;
  outcomeScore: number; // After IPS - Before IPS
  successFlag: boolean;
  createdAt: string;
}

const VALIDATION_KEY = 'shana_learning_validation';

export const LearningValidationLoop = {
  /**
   * Retrieves all validation logs from persistent local storage.
   */
  getLogs(userId: string): ValidationLog[] {
    try {
      const data = localStorage.getItem(VALIDATION_KEY);
      if (!data) return [];
      const logs: ValidationLog[] = JSON.parse(data);
      return logs.filter(l => l.userId === userId);
    } catch (e) {
      console.error('Error fetching Shana learning logs:', e);
      return [];
    }
  },

  /**
   * Saves validation logs back to persistent storage.
   */
  saveLogs(logs: ValidationLog[]): void {
    try {
      const data = localStorage.getItem(VALIDATION_KEY);
      let allLogs: ValidationLog[] = data ? JSON.parse(data) : [];
      
      // Merge: replace existing or append new
      logs.forEach(newLog => {
        const idx = allLogs.findIndex(l => l.actionId === newLog.actionId);
        if (idx !== -1) {
          allLogs[idx] = newLog;
        } else {
          allLogs.push(newLog);
        }
      });

      localStorage.setItem(VALIDATION_KEY, JSON.stringify(allLogs));
      
      // Dispatch custom event to notify React UI to re-render
      window.dispatchEvent(new Event('shana_learning_update'));
    } catch (e) {
      console.error('Error writing Shana learning logs:', e);
    }
  },

  /**
   * Commits/creates a new validation log BEFORE an action is applied.
   */
  logActionBefore(
    userId: string,
    system: 'Adaptive' | 'Director' | 'Serendipity',
    inputContext: string,
    actionApplied: string,
    beforeMetrics: ActionMetrics
  ): string {
    const actionId = 'act_' + Math.random().toString(36).substr(2, 9);
    const newLog: ValidationLog = {
      actionId,
      userId,
      system,
      inputContext,
      actionApplied,
      beforeMetrics,
      afterMetrics: null,
      outcomeScore: 0,
      successFlag: false,
      createdAt: new Date().toISOString()
    };

    const userLogs = this.getLogs(userId);
    userLogs.push(newLog);
    this.saveLogs(userLogs);

    return actionId;
  },

  /**
   * Updates/finalizes the validation log with AFTER metrics following user performance.
   */
  logActionAfter(
    userId: string,
    actionId: string,
    afterMetrics: ActionMetrics
  ): ValidationLog | null {
    const logs = this.getLogs(userId);
    const log = logs.find(l => l.actionId === actionId);
    
    if (!log) return null;

    log.afterMetrics = afterMetrics;
    log.outcomeScore = afterMetrics.ips - log.beforeMetrics.ips;
    log.successFlag = log.outcomeScore > 0;

    this.saveLogs(logs);
    return log;
  },

  /**
   * Automatically pairs the most recent pending actions for a system and resolves them.
   */
  autoResolvePendingActions(userId: string, currentIPS: IPSResult): void {
    const logs = this.getLogs(userId);
    const pending = logs.filter(l => l.afterMetrics === null);

    if (pending.length === 0) return;

    const afterMetrics: ActionMetrics = {
      ips: currentIPS.ips,
      clarity: currentIPS.breakdown.clarity,
      structure: currentIPS.breakdown.structure,
      confidence: currentIPS.breakdown.confidence,
      relevance: currentIPS.breakdown.relevance,
      conciseness: currentIPS.breakdown.conciseness
    };

    pending.forEach(log => {
      log.afterMetrics = afterMetrics;
      log.outcomeScore = afterMetrics.ips - log.beforeMetrics.ips;
      log.successFlag = log.outcomeScore > 0;
    });

    this.saveLogs(logs);
  },

  /**
   * Learning feedback: Tells us whether an action or system actually helped.
   */
  evaluateActionSuccess(userId: string, actionId: string): { helped: boolean; margin: number; reason: string } {
    const logs = this.getLogs(userId);
    const log = logs.find(l => l.actionId === actionId);

    if (!log || !log.afterMetrics) {
      return {
        helped: false,
        margin: 0,
        reason: "Validation metrics pending or session was interrupted."
      };
    }

    const margin = log.outcomeScore;
    const helped = margin > 0;

    let reason = "";
    if (helped) {
      reason = `The application of "${log.actionApplied}" by ${log.system} resulted in a positive score progression of +${margin} IPS points.`;
    } else if (margin === 0) {
      reason = `The application of "${log.actionApplied}" by ${log.system} preserved performance baseline with no direct score impact.`;
    } else {
      reason = `The application of "${log.actionApplied}" by ${log.system} resulted in a performance variance of ${margin} IPS points. Consider fine-tuning parameters.`;
    }

    return { helped, margin, reason };
  },

  /**
   * Self-improvement recommendations: Suggests which actions should be promoted/suppressed.
   */
  getSystemOptimizationGuide(userId: string): { promote: string[]; suppress: string[]; recoveryRequired: boolean } {
    const logs = this.getLogs(userId);
    const resolvedLogs = logs.filter(l => l.afterMetrics !== null);

    const successfulActions = new Map<string, number>();
    const failedActions = new Map<string, number>();

    resolvedLogs.forEach(log => {
      if (log.successFlag) {
        successfulActions.set(log.actionApplied, (successfulActions.get(log.actionApplied) || 0) + 1);
      } else {
        failedActions.set(log.actionApplied, (failedActions.get(log.actionApplied) || 0) + 1);
      }
    });

    const promote: string[] = [];
    const suppress: string[] = [];

    successfulActions.forEach((count, action) => {
      const fails = failedActions.get(action) || 0;
      if (count > fails) {
        promote.push(action);
      }
    });

    failedActions.forEach((count, action) => {
      const wins = successfulActions.get(action) || 0;
      if (count > wins) {
        suppress.push(action);
      }
    });

    // Determine if user performance is unstable (unstable metrics trigger system complexity reduction / fallback)
    const recentScores = resolvedLogs.slice(-3).map(l => l.outcomeScore);
    const repeatedFailures = recentScores.length >= 2 && recentScores.every(s => s < -5);

    return {
      promote,
      suppress,
      recoveryRequired: repeatedFailures
    };
  }
};
