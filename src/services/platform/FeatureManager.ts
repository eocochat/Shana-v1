import { FeatureFlags, PlatformConfig, DEFAULT_PLATFORM_CONFIG } from '../../modules/admin-config';

const ACTIVE_CONFIG_KEY = 'shana_active_platform_config';

export const FeatureManager = {
  /**
   * Retrieves the currently active feature flags
   */
  getFlags(): FeatureFlags {
    try {
      const activeStr = localStorage.getItem(ACTIVE_CONFIG_KEY);
      if (activeStr) {
        const config = JSON.parse(activeStr) as PlatformConfig;
        if (config.featureFlags) {
          return config.featureFlags;
        }
      }
    } catch (e) {
      console.error('Error reading feature flags:', e);
    }
    return DEFAULT_PLATFORM_CONFIG.featureFlags;
  },

  /**
   * Check if a specific feature flag is enabled
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    const flags = this.getFlags();
    return !!flags[flag];
  },

  /**
   * Toggles a single feature flag immediately and persists safely.
   * If a user triggers this, it immediately updates the active config.
   */
  setFlag(flag: keyof FeatureFlags, value: boolean): FeatureFlags {
    try {
      const activeStr = localStorage.getItem(ACTIVE_CONFIG_KEY);
      let config: PlatformConfig = activeStr 
        ? JSON.parse(activeStr) 
        : { ...DEFAULT_PLATFORM_CONFIG };
      
      if (!config.featureFlags) {
        config.featureFlags = { ...DEFAULT_PLATFORM_CONFIG.featureFlags };
      }

      config.featureFlags[flag] = value;
      localStorage.setItem(ACTIVE_CONFIG_KEY, JSON.stringify(config));
      
      // Dispatch a storage update event for immediate live React rendering updates across views
      window.dispatchEvent(new Event('shana_config_updated'));
      
      return config.featureFlags;
    } catch (e) {
      console.error(`Failed to set feature flag ${flag}:`, e);
      return this.getFlags();
    }
  }
};
