import { User } from '../../types';
import { 
  PlatformConfig, 
  DEFAULT_PLATFORM_CONFIG, 
  ConfigHistoryEntry 
} from '../../modules/admin-config';
import { ConfigurationService } from './ConfigurationService';
import { AccessController } from '../admin';

const ACTIVE_CONFIG_KEY = 'shana_active_platform_config';
const DRAFT_CONFIG_KEY = 'shana_draft_platform_config';
const HISTORY_KEY = 'shana_config_history';

export const PlatformController = {
  /**
   * Retrieves the draft configuration. If no draft exists, returns the active configuration.
   */
  getDraftConfig(): PlatformConfig {
    try {
      const draftStr = localStorage.getItem(DRAFT_CONFIG_KEY);
      if (draftStr) {
        return JSON.parse(draftStr) as PlatformConfig;
      }
    } catch (e) {
      console.error('Error reading draft config:', e);
    }
    const active = ConfigurationService.getActiveConfig();
    localStorage.setItem(DRAFT_CONFIG_KEY, JSON.stringify(active));
    return active;
  },

  /**
   * Overwrites/Saves the working draft configuration
   */
  saveDraftConfig(config: PlatformConfig): void {
    localStorage.setItem(DRAFT_CONFIG_KEY, JSON.stringify(config));
  },

  /**
   * Discards any working draft changes, resetting to the currently active config.
   */
  discardDraft(): PlatformConfig {
    const active = ConfigurationService.getActiveConfig();
    localStorage.setItem(DRAFT_CONFIG_KEY, JSON.stringify(active));
    return active;
  },

  /**
   * Retrieves the publishing change logs history (newest first)
   */
  getHistory(): ConfigHistoryEntry[] {
    try {
      const histStr = localStorage.getItem(HISTORY_KEY);
      if (histStr) {
        return JSON.parse(histStr) as ConfigHistoryEntry[];
      }
    } catch (e) {
      console.error('Error reading configuration history:', e);
    }
    return [];
  },

  /**
   * Validates a configuration before publishing. Returns an array of error strings or empty array.
   */
  validateConfig(config: PlatformConfig): string[] {
    const errors: string[] = [];
    
    // Feature flags check
    if (!config.featureFlags) {
      errors.push('Feature flags object is missing.');
    }

    // AI Config checks
    if (config.aiConfig) {
      if (config.aiConfig.timeout < 10 || config.aiConfig.timeout > 120) {
        errors.push('AI silence timeout must be between 10 and 120 seconds.');
      }
    } else {
      errors.push('AI Configuration is missing.');
    }

    // Interview Config checks
    if (config.interviewConfig) {
      if (config.interviewConfig.maxDuration < 5 || config.interviewConfig.maxDuration > 120) {
        errors.push('Interview duration must be between 5 and 120 minutes.');
      }
      if (config.interviewConfig.questionCount < 1 || config.interviewConfig.questionCount > 20) {
        errors.push('Question count must be between 1 and 20.');
      }
    } else {
      errors.push('Interview Configuration is missing.');
    }

    // Content checks
    if (!config.content) {
      errors.push('Platform content templates are missing.');
    } else {
      const c = config.content;
      if (!c.homeTexts?.FR?.title || !c.homeTexts?.EN?.title) {
        errors.push('Multilingual Home titles cannot be blank.');
      }
      if (!c.interviewMessages?.FR?.welcome || !c.interviewMessages?.EN?.welcome) {
        errors.push('Welcome interview message cannot be blank.');
      }
    }

    return errors;
  },

  /**
   * Super Admins can publish draft configurations. Logs audit entries.
   */
  publishConfig(user: User, description: string): { success: boolean; errors?: string[] } {
    // 1. Check Permissions
    const isSuperAdmin = AccessController.hasRole(user.role, 'super_admin');
    if (!isSuperAdmin) {
      return { success: false, errors: ['Unauthorized: Only Super Administrators can publish platform modifications.'] };
    }

    // 2. Fetch and Validate Draft
    const draft = this.getDraftConfig();
    const validationErrors = this.validateConfig(draft);
    if (validationErrors.length > 0) {
      return { success: false, errors: validationErrors };
    }

    // 3. Keep History Trail
    const before = ConfigurationService.getActiveConfig();
    const after = { ...draft, version: `1.4.0-rev-${Math.random().toString(36).substring(2, 5).toUpperCase()}` };
    
    const historyEntry: ConfigHistoryEntry = {
      id: 'cfg_hist_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      performedBy: {
        id: user.id,
        email: user.email,
        role: user.role || 'super_admin'
      },
      description: description.trim() || 'Published configuration update.',
      before,
      after,
      canRollback: true
    };

    const history = this.getHistory();
    history.unshift(historyEntry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // 4. Overwrite active config
    localStorage.setItem(ACTIVE_CONFIG_KEY, JSON.stringify(after));
    
    // 5. Reset Draft to newly active config
    localStorage.setItem(DRAFT_CONFIG_KEY, JSON.stringify(after));

    // 6. Security Audit Logging
    AccessController.logAction(
      'SYSTEM',
      `Super Admin published platform configuration change: ${description.trim()}`,
      { id: user.id, email: user.email, role: user.role || 'super_admin' },
      undefined,
      `Config updated from ${before.version} to ${after.version}`
    );

    // 7. Dispatch Event for immediate state updates in UI
    window.dispatchEvent(new Event('shana_config_updated'));

    return { success: true };
  },

  /**
   * Super Admins can Rollback to a specific past configuration
   */
  rollback(user: User, entryId: string): { success: boolean; error?: string } {
    // 1. Check Permissions
    const isSuperAdmin = AccessController.hasRole(user.role, 'super_admin');
    if (!isSuperAdmin) {
      return { success: false, error: 'Unauthorized: Only Super Administrators can rollback configurations.' };
    }

    // 2. Locate entry
    const history = this.getHistory();
    const entryIndex = history.findIndex(h => h.id === entryId);
    if (entryIndex === -1) {
      return { success: false, error: 'Target history entry not found.' };
    }

    const entry = history[entryIndex];
    if (!entry.canRollback) {
      return { success: false, error: 'This entry is not eligible for rollbacks.' };
    }

    const currentActive = ConfigurationService.getActiveConfig();
    const targetConfig = entry.before; // Rollback restores the state PRIOR to this entry's publish

    // 3. Build a new History Log entry to record the rollback action itself
    const rollbackEntry: ConfigHistoryEntry = {
      id: 'cfg_hist_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      performedBy: {
        id: user.id,
        email: user.email,
        role: user.role || 'super_admin'
      },
      description: `Rollback triggered. Restored config from prior to version: ${entry.after.version}`,
      before: currentActive,
      after: targetConfig,
      canRollback: true
    };

    // Mark previous entry as rolled back/disable further cascading from that specific node if necessary,
    // but keep simple append for safety
    history.unshift(rollbackEntry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // 4. Apply config
    localStorage.setItem(ACTIVE_CONFIG_KEY, JSON.stringify(targetConfig));
    localStorage.setItem(DRAFT_CONFIG_KEY, JSON.stringify(targetConfig));

    // 5. Audit logs
    AccessController.logAction(
      'SYSTEM',
      `Super Admin rolled back configuration to state prior to entry ${entry.id}`,
      { id: user.id, email: user.email, role: user.role || 'super_admin' },
      undefined,
      `Rolled back from ${currentActive.version} to ${targetConfig.version}`
    );

    // 6. Broadcast update
    window.dispatchEvent(new Event('shana_config_updated'));

    return { success: true };
  }
};
