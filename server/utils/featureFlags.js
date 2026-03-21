/**
 * Feature Flag System
 * Enables gradual rollouts and A/B testing of new features
 */

const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class FeatureFlagSystem {
  constructor() {
    this.flags = new Map();
    this.configFile = path.join(__dirname, '../../config/feature-flags.json');
    this.userOverrides = new Map();
    this.rolloutStrategies = new Map();
    
    // Initialize default strategies
    this.initializeStrategies();
    
    // Load flags from config file
    this.loadFlags();
  }

  /**
   * Initialize rollout strategies
   */
  initializeStrategies() {
    // Percentage-based rollout
    this.rolloutStrategies.set('percentage', (flag, context) => {
      if (!flag.rolloutPercentage) return flag.enabled;
      
      // Use user ID for consistent rollout
      const userId = context.userId || context.sessionId || '';
      const hash = this.hashString(userId + flag.name);
      const userPercentage = hash % 100;
      
      return userPercentage < flag.rolloutPercentage;
    });

    // User whitelist strategy
    this.rolloutStrategies.set('whitelist', (flag, context) => {
      if (!flag.whitelist || flag.whitelist.length === 0) return flag.enabled;
      
      const userId = context.userId;
      return flag.whitelist.includes(userId);
    });

    // Environment-based strategy
    this.rolloutStrategies.set('environment', (flag, context) => {
      if (!flag.environments || flag.environments.length === 0) return flag.enabled;
      
      const env = process.env.NODE_ENV || 'development';
      return flag.environments.includes(env);
    });

    // Date-based strategy (scheduled rollout)
    this.rolloutStrategies.set('scheduled', (flag, context) => {
      if (!flag.startDate) return flag.enabled;
      
      const now = Date.now();
      const startDate = new Date(flag.startDate).getTime();
      const endDate = flag.endDate ? new Date(flag.endDate).getTime() : Infinity;
      
      return now >= startDate && now <= endDate;
    });

    // Custom condition strategy
    this.rolloutStrategies.set('custom', (flag, context) => {
      if (!flag.condition) return flag.enabled;
      
      try {
        // Evaluate custom condition function
        const conditionFn = new Function('context', `return ${flag.condition}`);
        return conditionFn(context);
      } catch (error) {
        logger.error('Error evaluating custom condition', {
          flag: flag.name,
          error: error.message
        });
        return false;
      }
    });
  }

  /**
   * Load flags from configuration file
   */
  loadFlags() {
    try {
      if (fs.existsSync(this.configFile)) {
        const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
        
        if (config.flags) {
          config.flags.forEach(flag => {
            this.addFlag(flag);
          });
        }
        
        logger.info('Feature flags loaded', {
          count: this.flags.size
        });
      } else {
        // Create default config file
        this.saveFlags();
        logger.info('Created default feature flags configuration');
      }
    } catch (error) {
      logger.error('Failed to load feature flags', {
        error: error.message
      });
    }
  }

  /**
   * Save flags to configuration file
   */
  saveFlags() {
    try {
      const config = {
        lastUpdated: new Date().toISOString(),
        flags: Array.from(this.flags.values())
      };
      
      // Ensure config directory exists
      const configDir = path.dirname(this.configFile);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      
      logger.info('Feature flags saved', {
        count: this.flags.size
      });
    } catch (error) {
      logger.error('Failed to save feature flags', {
        error: error.message
      });
    }
  }

  /**
   * Add or update feature flag
   */
  addFlag(flag) {
    if (!flag.name) {
      throw new Error('Flag name is required');
    }

    const fullFlag = {
      name: flag.name,
      description: flag.description || '',
      enabled: flag.enabled !== undefined ? flag.enabled : false,
      strategy: flag.strategy || 'percentage',
      rolloutPercentage: flag.rolloutPercentage || 0,
      whitelist: flag.whitelist || [],
      environments: flag.environments || [],
      startDate: flag.startDate || null,
      endDate: flag.endDate || null,
      condition: flag.condition || null,
      metadata: flag.metadata || {},
      createdAt: flag.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.flags.set(flag.name, fullFlag);
    
    logger.info('Feature flag added/updated', {
      name: flag.name,
      enabled: fullFlag.enabled,
      strategy: fullFlag.strategy
    });

    return fullFlag;
  }

  /**
   * Remove feature flag
   */
  removeFlag(flagName) {
    const removed = this.flags.delete(flagName);
    
    if (removed) {
      logger.info('Feature flag removed', { name: flagName });
      this.saveFlags();
    }
    
    return removed;
  }

  /**
   * Check if feature is enabled for context
   */
  isEnabled(flagName, context = {}) {
    // Check user override first
    const userOverride = this.getUserOverride(context.userId, flagName);
    if (userOverride !== null) {
      return userOverride;
    }

    const flag = this.flags.get(flagName);
    
    // If flag doesn't exist, default to false
    if (!flag) {
      logger.debug('Feature flag not found', { name: flagName });
      return false;
    }

    // If flag is globally disabled, return false
    if (!flag.enabled) {
      return false;
    }

    // Apply rollout strategy
    const strategy = this.rolloutStrategies.get(flag.strategy);
    if (!strategy) {
      logger.warn('Unknown rollout strategy', {
        flag: flagName,
        strategy: flag.strategy
      });
      return flag.enabled;
    }

    try {
      const result = strategy(flag, context);
      
      // Log flag evaluation for analytics
      this.logEvaluation(flagName, context, result);
      
      return result;
    } catch (error) {
      logger.error('Error evaluating feature flag', {
        flag: flagName,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get feature flag details
   */
  getFlag(flagName) {
    return this.flags.get(flagName);
  }

  /**
   * Get all feature flags
   */
  getAllFlags() {
    return Array.from(this.flags.values());
  }

  /**
   * Update flag enabled status
   */
  setEnabled(flagName, enabled) {
    const flag = this.flags.get(flagName);
    if (!flag) {
      throw new Error(`Flag not found: ${flagName}`);
    }

    flag.enabled = enabled;
    flag.updatedAt = new Date().toISOString();
    
    logger.info('Feature flag enabled status updated', {
      name: flagName,
      enabled
    });

    this.saveFlags();
    return flag;
  }

  /**
   * Update flag rollout percentage
   */
  setRolloutPercentage(flagName, percentage) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }

    const flag = this.flags.get(flagName);
    if (!flag) {
      throw new Error(`Flag not found: ${flagName}`);
    }

    flag.rolloutPercentage = percentage;
    flag.updatedAt = new Date().toISOString();
    
    logger.info('Feature flag rollout percentage updated', {
      name: flagName,
      percentage
    });

    this.saveFlags();
    return flag;
  }

  /**
   * Set user override for specific flag
   */
  setUserOverride(userId, flagName, enabled) {
    if (!this.userOverrides.has(userId)) {
      this.userOverrides.set(userId, new Map());
    }

    this.userOverrides.get(userId).set(flagName, enabled);
    
    logger.info('User override set', {
      userId,
      flag: flagName,
      enabled
    });
  }

  /**
   * Get user override
   */
  getUserOverride(userId, flagName) {
    if (!userId || !this.userOverrides.has(userId)) {
      return null;
    }

    const userFlags = this.userOverrides.get(userId);
    return userFlags.has(flagName) ? userFlags.get(flagName) : null;
  }

  /**
   * Clear user override
   */
  clearUserOverride(userId, flagName) {
    if (!userId || !this.userOverrides.has(userId)) {
      return false;
    }

    const userFlags = this.userOverrides.get(userId);
    const removed = userFlags.delete(flagName);
    
    if (removed) {
      logger.info('User override cleared', {
        userId,
        flag: flagName
      });
    }
    
    return removed;
  }

  /**
   * Get flags enabled for user
   */
  getEnabledFlags(context = {}) {
    const enabled = [];
    
    this.flags.forEach((flag, name) => {
      if (this.isEnabled(name, context)) {
        enabled.push(name);
      }
    });
    
    return enabled;
  }

  /**
   * Log flag evaluation for analytics
   */
  logEvaluation(flagName, context, result) {
    // Could integrate with analytics system here
    logger.debug('Feature flag evaluated', {
      flag: flagName,
      userId: context.userId,
      result
    });
  }

  /**
   * Hash string for consistent percentage rollout
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get flag statistics
   */
  getStatistics() {
    const stats = {
      total: this.flags.size,
      enabled: 0,
      disabled: 0,
      byStrategy: {},
      byEnvironment: {}
    };

    this.flags.forEach(flag => {
      if (flag.enabled) {
        stats.enabled++;
      } else {
        stats.disabled++;
      }

      // Count by strategy
      stats.byStrategy[flag.strategy] = (stats.byStrategy[flag.strategy] || 0) + 1;

      // Count by environment
      if (flag.environments && flag.environments.length > 0) {
        flag.environments.forEach(env => {
          stats.byEnvironment[env] = (stats.byEnvironment[env] || 0) + 1;
        });
      }
    });

    return stats;
  }

  /**
   * Export configuration
   */
  exportConfig() {
    return {
      flags: Array.from(this.flags.values()),
      statistics: this.getStatistics()
    };
  }

  /**
   * Import configuration
   */
  importConfig(config) {
    if (!config.flags || !Array.isArray(config.flags)) {
      throw new Error('Invalid configuration format');
    }

    this.flags.clear();
    
    config.flags.forEach(flag => {
      this.addFlag(flag);
    });

    this.saveFlags();
    
    logger.info('Feature flags imported', {
      count: this.flags.size
    });
  }
}

// Create singleton instance
const featureFlagSystem = new FeatureFlagSystem();

module.exports = featureFlagSystem;
