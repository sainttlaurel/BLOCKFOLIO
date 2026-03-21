/**
 * Graceful Degradation Service
 * 
 * Provides intelligent degradation strategies for network interruptions,
 * ensuring the application remains functional with reduced capabilities
 * when network connectivity is poor or unavailable.
 */

import { EventEmitter } from 'events';
import cacheService from './cacheService';
import offlineService from './offlineService';

class GracefulDegradationService extends EventEmitter {
  constructor() {
    super();
    
    this.degradationLevels = {
      FULL: 'full',           // Full functionality
      REDUCED: 'reduced',     // Reduced real-time updates
      MINIMAL: 'minimal',     // Basic functionality only
      OFFLINE: 'offline'      // Offline mode
    };
    
    this.currentLevel = this.degradationLevels.FULL;
    
    this.networkQuality = {
      excellent: { latency: 0, reliability: 100, bandwidth: 'high' },
      good: { latency: 200, reliability: 95, bandwidth: 'medium' },
      fair: { latency: 500, reliability: 85, bandwidth: 'low' },
      poor: { latency: 1000, reliability: 70, bandwidth: 'very_low' },
      offline: { latency: Infinity, reliability: 0, bandwidth: 'none' }
    };
    
    this.currentQuality = 'excellent';
    
    this.degradationStrategies = {
      [this.degradationLevels.FULL]: {
        realTimeUpdates: true,
        chartAnimations: true,
        autoRefresh: true,
        backgroundSync: true,
        highResolutionCharts: true,
        advancedFeatures: true,
        updateInterval: 5000
      },
      [this.degradationLevels.REDUCED]: {
        realTimeUpdates: true,
        chartAnimations: false,
        autoRefresh: true,
        backgroundSync: false,
        highResolutionCharts: false,
        advancedFeatures: true,
        updateInterval: 10000
      },
      [this.degradationLevels.MINIMAL]: {
        realTimeUpdates: false,
        chartAnimations: false,
        autoRefresh: false,
        backgroundSync: false,
        highResolutionCharts: false,
        advancedFeatures: false,
        updateInterval: 30000
      },
      [this.degradationLevels.OFFLINE]: {
        realTimeUpdates: false,
        chartAnimations: false,
        autoRefresh: false,
        backgroundSync: false,
        highResolutionCharts: false,
        advancedFeatures: false,
        updateInterval: null
      }
    };
    
    this.featureFlags = {
      animations: true,
      realTimeData: true,
      backgroundTasks: true,
      heavyCharts: true,
      autoSave: true,
      notifications: true
    };
    
    this.metrics = {
      degradationEvents: 0,
      totalDowntime: 0,
      lastDegradationTime: null,
      recoveryTime: 0,
      userExperience: 'excellent'
    };
    
    this.initialize();
  }

  /**
   * Initialize graceful degradation service
   */
  initialize() {
    this.setupNetworkMonitoring();
    this.setupPerformanceMonitoring();
    this.setupUserExperienceTracking();
    
    console.log('Graceful degradation service initialized');
  }

  /**
   * Setup network quality monitoring
   */
  setupNetworkMonitoring() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.handleNetworkChange('online');
    });
    
    window.addEventListener('offline', () => {
      this.handleNetworkChange('offline');
    });
    
    // Monitor connection quality through various indicators
    this.startConnectionQualityMonitoring();
  }

  /**
   * Start monitoring connection quality
   */
  startConnectionQualityMonitoring() {
    setInterval(() => {
      this.assessNetworkQuality();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Assess current network quality
   */
  async assessNetworkQuality() {
    if (!navigator.onLine) {
      this.updateNetworkQuality('offline');
      return;
    }
    
    try {
      const startTime = performance.now();
      
      // Perform lightweight network test
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      const latency = performance.now() - startTime;
      
      if (response.ok) {
        this.updateNetworkQuality(this.classifyLatency(latency));
      } else {
        this.updateNetworkQuality('poor');
      }
      
    } catch (error) {
      // Network request failed
      this.updateNetworkQuality('poor');
    }
  }

  /**
   * Classify network quality based on latency
   */
  classifyLatency(latency) {
    if (latency < 100) return 'excellent';
    if (latency < 300) return 'good';
    if (latency < 800) return 'fair';
    return 'poor';
  }

  /**
   * Update network quality and trigger degradation if needed
   */
  updateNetworkQuality(quality) {
    if (this.currentQuality !== quality) {
      const previousQuality = this.currentQuality;
      this.currentQuality = quality;
      
      console.log(`Network quality changed: ${previousQuality} -> ${quality}`);
      
      // Determine appropriate degradation level
      const newLevel = this.getDegradationLevelForQuality(quality);
      this.setDegradationLevel(newLevel);
      
      this.emit('networkQualityChanged', {
        previous: previousQuality,
        current: quality,
        degradationLevel: newLevel
      });
    }
  }

  /**
   * Get appropriate degradation level for network quality
   */
  getDegradationLevelForQuality(quality) {
    switch (quality) {
      case 'excellent':
      case 'good':
        return this.degradationLevels.FULL;
      case 'fair':
        return this.degradationLevels.REDUCED;
      case 'poor':
        return this.degradationLevels.MINIMAL;
      case 'offline':
        return this.degradationLevels.OFFLINE;
      default:
        return this.degradationLevels.FULL;
    }
  }

  /**
   * Set degradation level and apply strategies
   */
  setDegradationLevel(level) {
    if (this.currentLevel !== level) {
      const previousLevel = this.currentLevel;
      this.currentLevel = level;
      
      console.log(`Degradation level changed: ${previousLevel} -> ${level}`);
      
      // Track degradation metrics
      if (level !== this.degradationLevels.FULL) {
        this.metrics.degradationEvents++;
        this.metrics.lastDegradationTime = Date.now();
      } else if (previousLevel !== this.degradationLevels.FULL) {
        // Recovery from degradation
        if (this.metrics.lastDegradationTime) {
          this.metrics.recoveryTime += Date.now() - this.metrics.lastDegradationTime;
        }
      }
      
      // Apply degradation strategies
      this.applyDegradationStrategies(level);
      
      // Update user experience rating
      this.updateUserExperience(level);
      
      this.emit('degradationLevelChanged', {
        previous: previousLevel,
        current: level,
        strategies: this.degradationStrategies[level]
      });
    }
  }

  /**
   * Apply degradation strategies for the given level
   */
  applyDegradationStrategies(level) {
    const strategies = this.degradationStrategies[level];
    
    // Update feature flags
    this.featureFlags.animations = strategies.chartAnimations;
    this.featureFlags.realTimeData = strategies.realTimeUpdates;
    this.featureFlags.backgroundTasks = strategies.backgroundSync;
    this.featureFlags.heavyCharts = strategies.highResolutionCharts;
    this.featureFlags.autoSave = level !== this.degradationLevels.OFFLINE;
    
    // Apply specific strategies
    this.applyRealTimeUpdateStrategy(strategies);
    this.applyChartStrategy(strategies);
    this.applyBackgroundTaskStrategy(strategies);
    this.applyDataStrategy(strategies);
    
    console.log('Applied degradation strategies:', strategies);
  }

  /**
   * Apply real-time update strategy
   */
  applyRealTimeUpdateStrategy(strategies) {
    if (strategies.realTimeUpdates) {
      // Enable real-time updates with appropriate interval
      this.emit('enableRealTimeUpdates', {
        interval: strategies.updateInterval
      });
    } else {
      // Disable real-time updates
      this.emit('disableRealTimeUpdates');
    }
  }

  /**
   * Apply chart rendering strategy
   */
  applyChartStrategy(strategies) {
    const chartConfig = {
      animations: strategies.chartAnimations,
      highResolution: strategies.highResolutionCharts,
      simplifiedRendering: !strategies.advancedFeatures
    };
    
    this.emit('updateChartConfig', chartConfig);
  }

  /**
   * Apply background task strategy
   */
  applyBackgroundTaskStrategy(strategies) {
    if (strategies.backgroundSync) {
      this.emit('enableBackgroundTasks');
    } else {
      this.emit('disableBackgroundTasks');
    }
  }

  /**
   * Apply data loading strategy
   */
  applyDataStrategy(strategies) {
    if (this.currentLevel === this.degradationLevels.OFFLINE) {
      // Switch to offline mode
      this.enableOfflineMode();
    } else {
      // Configure online data loading
      this.configureOnlineDataLoading(strategies);
    }
  }

  /**
   * Enable offline mode
   */
  async enableOfflineMode() {
    console.log('Enabling offline mode');
    
    try {
      await offlineService.enable();
      
      // Serve cached data
      const cachedData = await this.getCachedData();
      this.emit('offlineDataAvailable', cachedData);
      
      // Show offline notification
      this.emit('showOfflineNotification');
      
    } catch (error) {
      console.error('Failed to enable offline mode:', error);
    }
  }

  /**
   * Configure online data loading based on strategies
   */
  configureOnlineDataLoading(strategies) {
    const config = {
      cacheFirst: !strategies.realTimeUpdates,
      batchRequests: !strategies.advancedFeatures,
      compressData: this.currentLevel !== this.degradationLevels.FULL,
      updateInterval: strategies.updateInterval
    };
    
    this.emit('configureDataLoading', config);
  }

  /**
   * Get cached data for offline mode
   */
  async getCachedData() {
    return {
      prices: cacheService.get('prices', 'current_prices'),
      marketData: cacheService.get('marketData', 'market_overview'),
      portfolio: cacheService.get('portfolioData', 'user_portfolio')
    };
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor frame rate
    this.startFrameRateMonitoring();
    
    // Monitor memory usage
    this.startMemoryMonitoring();
    
    // Monitor API response times
    this.startAPIMonitoring();
  }

  /**
   * Start frame rate monitoring
   */
  startFrameRateMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFrameRate = (currentTime) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        // Adjust degradation based on performance
        if (fps < 30 && this.currentLevel === this.degradationLevels.FULL) {
          console.log('Low FPS detected, reducing degradation level');
          this.setDegradationLevel(this.degradationLevels.REDUCED);
        } else if (fps > 50 && this.currentLevel === this.degradationLevels.REDUCED) {
          // Only upgrade if network quality supports it
          if (this.currentQuality === 'excellent' || this.currentQuality === 'good') {
            this.setDegradationLevel(this.degradationLevels.FULL);
          }
        }
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    setInterval(() => {
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        
        // If memory usage is high, reduce functionality
        if (memoryUsage > 0.8 && this.currentLevel === this.degradationLevels.FULL) {
          console.log('High memory usage detected, reducing degradation level');
          this.setDegradationLevel(this.degradationLevels.REDUCED);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start API monitoring
   */
  startAPIMonitoring() {
    // This would integrate with the existing dataManager to monitor response times
    window.addEventListener('apiResponse', (event) => {
      const { responseTime, success } = event.detail;
      
      if (!success || responseTime > 5000) {
        // Slow or failed API responses
        if (this.currentLevel === this.degradationLevels.FULL) {
          this.setDegradationLevel(this.degradationLevels.REDUCED);
        }
      }
    });
  }

  /**
   * Setup user experience tracking
   */
  setupUserExperienceTracking() {
    // Track user interactions and satisfaction
    this.trackUserInteractions();
  }

  /**
   * Track user interactions to assess experience quality
   */
  trackUserInteractions() {
    let interactionCount = 0;
    let slowInteractions = 0;
    
    const trackInteraction = (event) => {
      interactionCount++;
      
      // Measure interaction response time
      const startTime = performance.now();
      
      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTime;
        
        if (responseTime > 100) {
          slowInteractions++;
        }
        
        // Update user experience rating
        const satisfactionRate = 1 - (slowInteractions / interactionCount);
        this.updateUserExperienceFromInteractions(satisfactionRate);
      });
    };
    
    // Track clicks and key presses
    document.addEventListener('click', trackInteraction);
    document.addEventListener('keydown', trackInteraction);
  }

  /**
   * Update user experience rating from interactions
   */
  updateUserExperienceFromInteractions(satisfactionRate) {
    if (satisfactionRate > 0.9) {
      this.metrics.userExperience = 'excellent';
    } else if (satisfactionRate > 0.7) {
      this.metrics.userExperience = 'good';
    } else if (satisfactionRate > 0.5) {
      this.metrics.userExperience = 'fair';
    } else {
      this.metrics.userExperience = 'poor';
    }
  }

  /**
   * Update user experience based on degradation level
   */
  updateUserExperience(level) {
    switch (level) {
      case this.degradationLevels.FULL:
        this.metrics.userExperience = 'excellent';
        break;
      case this.degradationLevels.REDUCED:
        this.metrics.userExperience = 'good';
        break;
      case this.degradationLevels.MINIMAL:
        this.metrics.userExperience = 'fair';
        break;
      case this.degradationLevels.OFFLINE:
        this.metrics.userExperience = 'poor';
        break;
    }
  }

  /**
   * Handle network status changes
   */
  handleNetworkChange(status) {
    console.log(`Network status changed: ${status}`);
    
    if (status === 'online') {
      // Network restored, assess quality
      setTimeout(() => {
        this.assessNetworkQuality();
      }, 1000);
    } else {
      // Network lost, go offline
      this.updateNetworkQuality('offline');
    }
  }

  /**
   * Get current degradation status
   */
  getStatus() {
    return {
      level: this.currentLevel,
      networkQuality: this.currentQuality,
      strategies: this.degradationStrategies[this.currentLevel],
      featureFlags: { ...this.featureFlags },
      metrics: { ...this.metrics }
    };
  }

  /**
   * Get feature flag status
   */
  isFeatureEnabled(feature) {
    return this.featureFlags[feature] || false;
  }

  /**
   * Force degradation level (for testing)
   */
  forceDegradationLevel(level) {
    if (Object.values(this.degradationLevels).includes(level)) {
      this.setDegradationLevel(level);
    } else {
      console.error('Invalid degradation level:', level);
    }
  }

  /**
   * Get degradation metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      currentLevel: this.currentLevel,
      currentQuality: this.currentQuality,
      averageRecoveryTime: this.metrics.degradationEvents > 0 
        ? this.metrics.recoveryTime / this.metrics.degradationEvents 
        : 0
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.removeAllListeners();
  }
}

// Create singleton instance
const gracefulDegradationService = new GracefulDegradationService();

export default gracefulDegradationService;