import { 
  PlatformConfig, 
  DEFAULT_PLATFORM_CONFIG, 
  AIConfiguration, 
  InterviewConfiguration, 
  PlatformContent, 
  MaintenanceMode 
} from '../../modules/admin-config';

const ACTIVE_CONFIG_KEY = 'shana_active_platform_config';

export const ConfigurationService = {
  /**
   * Returns the current active configuration
   */
  getActiveConfig(): PlatformConfig {
    try {
      const activeStr = localStorage.getItem(ACTIVE_CONFIG_KEY);
      if (activeStr) {
        return JSON.parse(activeStr) as PlatformConfig;
      }
    } catch (e) {
      console.error('Error reading active platform config:', e);
    }
    
    // Seed default if empty
    localStorage.setItem(ACTIVE_CONFIG_KEY, JSON.stringify(DEFAULT_PLATFORM_CONFIG));
    return DEFAULT_PLATFORM_CONFIG;
  },

  /**
   * Retrieves active AI configurations
   */
  getAIConfig(): AIConfiguration {
    const config = this.getActiveConfig();
    return config.aiConfig || DEFAULT_PLATFORM_CONFIG.aiConfig;
  },

  /**
   * Retrieves active Interview configurations
   */
  getInterviewConfig(): InterviewConfiguration {
    const config = this.getActiveConfig();
    return config.interviewConfig || DEFAULT_PLATFORM_CONFIG.interviewConfig;
  },

  /**
   * Retrieves active content texts (with fallback support)
   */
  getContent(): PlatformContent {
    const config = this.getActiveConfig();
    return config.content || DEFAULT_PLATFORM_CONFIG.content;
  },

  /**
   * Retrieves current Maintenance Mode
   */
  getMaintenanceMode(): MaintenanceMode {
    const config = this.getActiveConfig();
    return config.maintenanceMode || 'normal';
  },

  /**
   * Quick check: is system fully offline for normal candidates?
   */
  isMaintenanceActive(): boolean {
    return this.getMaintenanceMode() === 'maintenance';
  },

  /**
   * Quick check: is system in read-only mode?
   */
  isReadOnlyActive(): boolean {
    return this.getMaintenanceMode() === 'read-only';
  },

  /**
   * Multilingual text getter with robust fallbacks
   */
  getText(category: keyof PlatformContent, lang: 'FR' | 'EN', subkey?: string): string {
    const content = this.getContent();
    try {
      const cat = content[category] as any;
      if (!cat) return '';

      // For system banners which are just { FR, EN, enabled }
      if (category === 'systemBanners') {
        if (!cat.enabled) return '';
        return cat[lang] || cat['FR'] || '';
      }

      // For structures like homeTexts, emptyStates, interviewMessages, buttonLabels
      const langGroup = cat[lang] || cat['FR'];
      if (!langGroup) return '';

      if (subkey) {
        return langGroup[subkey] || '';
      }
      return langGroup.text || '';
    } catch (e) {
      console.warn(`Could not fetch text for ${category}.${lang}.${subkey || ''}:`, e);
      return '';
    }
  }
};
