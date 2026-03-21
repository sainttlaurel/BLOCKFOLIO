/**
 * Offline Mode Service for Professional Trading Platform
 * 
 * Provides comprehensive offline functionality with cached data fallback,
 * automatic mode switching, data synchronization, and offline-capable features.
 * 
 * Features:
 * - Automatic offline detection and mode switching
 * - Cached data fallback for critical trading platform features
 * - Offline indicators and user notifications
 * - Data synchronization when connection is restored
 * - Offline-capable features and limitations management
 * - Integration with existing caching, retry, and status systems
 */

import cacheService from './cacheService';
import dataManager from './dataManager';
import retryService from './retryService';

class OfflineService {
  constructor() {
    this.isOffline = !navigator.onLine;
    this.offlineStartTime = null;
    this.lastOnlineTime = Date.now();
    this.offlineCapabilities = new Set();
    this.pendingActions = [];
    this.syncQueue = [];
    
    // Offline mode configuration
    this.config = {
      // Data freshness thresholds for offline mode (in milliseconds)
      dataFreshness: {
        prices: 300000,        // 5 minutes - critical for trading decisions
        marketData: 600000,    // 10 minutes - market overview data
        portfolioData: 900000, // 15 minutes - portfolio information
        globalStats: 1800000,  // 30 minutes - global market statistics
        historicalData: 3600000, // 1 hour - historical price data
        chartData: 1800000,    // 30 minutes - chart data
        transactionHistory: 86400000, // 24 hours - transaction history
        userSettings: 604800000 // 7 days - user settings and preferences
      },
      
      // Enhanced features available in offline mode
      offlineFeatures: [
        'portfolio_view',
        'portfolio_analytics',
        'holdings_analysis',
        'price_history_view',
        'market_data_view',
        'transaction_history',
        'cached_charts',
        'performance_metrics',
        'historical_charts',
        'portfolio_allocation',
        'profit_loss_analysis',
        'settings_management',
        'cached_market_stats',
        'offline_search',
        'data_export'
      ],
      
      // Features disabled in offline mode
      disabledFeatures: [
        'real_time_trading',
        'live_price_updates',
        'order_execution',
        'market_orders',
        'real_time_charts',
        'live_notifications',
        'order_book',
        'live_market_depth',
        'real_time_alerts',
        'social_features',
        'news_feed',
        'live_chat_support'
      ],
      
      // Offline capabilities configuration
      capabilities: {
        maxCachedItems: 1000,
        maxHistoryDays: 30,
        enableDataCompression: true,
        enablePredictiveCaching: true,
        enableOfflineSearch: true,
        enableDataExport: true,
        enableOfflineAnalytics: true
      },
      
      // Notification settings
      notifications: {
        showOfflineIndicator: true,
        showDataAgeWarnings: true,
        showFeatureLimitations: true,
        showSyncProgress: true,
        autoHideDelay: 10000, // 10 seconds
        showOfflineTips: true,
        showDataFreshness: true
      },
      
      // Sync configuration
      sync: {
        autoSyncOnReconnect: true,
        syncRetryAttempts: 3,
        syncRetryDelay: 5000,
        priorityDataTypes: ['portfolioData', 'prices', 'marketData'],
        backgroundSyncEnabled: true,
        conflictResolution: 'server_wins' // server_wins, client_wins, merge
      }
    };
    
    // Enhanced offline state tracking
    this.offlineState = {
      mode: this.isOffline ? 'offline' : 'online',
      dataAge: {},
      availableData: new Set(),
      limitedFeatures: new Set(),
      lastSyncAttempt: null,
      syncStatus: 'idle', // idle, syncing, success, failed
      offlineDuration: 0,
      cachedDataSizes: {},
      syncProgress: {
        total: 0,
        completed: 0,
        failed: 0,
        current: null
      },
      userGuidance: {
        tips: [],
        limitations: [],
        availableActions: []
      },
      dataQuality: {
        fresh: new Set(),
        stale: new Set(),
        veryStale: new Set()
      }
    };
    
    // Event listeners for offline mode changes
    this.listeners = new Set();
    
    // Initialize offline mode monitoring
    this.initializeOfflineMonitoring();
    
    // Initialize data age tracking
    this.initializeDataAgeTracking();
    
    // Setup periodic sync attempts
    this.setupPeriodicSync();
  }

  /**
   * Initialize offline mode monitoring and event handling
   */
  initializeOfflineMonitoring() {
    // Listen to browser online/offline events
    window.addEventListener('online', () => {
      this.handleOnlineEvent();
    });
    
    window.addEventListener('offline', () => {
      this.handleOfflineEvent();
    });
    
    // Listen to network status changes from dataManager
    window.addEventListener('networkStatusChange', (event) => {
      this.handleNetworkStatusChange(event.detail);
    });
    
    // Listen to retry service events for connection issues
    retryService.addStatusListener((event, data) => {
      this.handleRetryServiceEvent(event, data);
    });
    
    // Initial offline state assessment
    this.assessOfflineCapabilities();
  }

  /**
   * Handle browser online event
   */
  handleOnlineEvent() {
    console.log('OfflineService: Browser reports online');
    
    if (this.isOffline) {
      this.isOffline = false;
      this.lastOnlineTime = Date.now();
      this.offlineState.mode = 'online';
      
      // Start connection restoration process
      this.initiateConnectionRestoration();
    }
  }

  /**
   * Handle browser offline event
   */
  handleOfflineEvent() {
    console.log('OfflineService: Browser reports offline');
    
    if (!this.isOffline) {
      this.isOffline = true;
      this.offlineStartTime = Date.now();
      this.offlineState.mode = 'offline';
      
      // Activate offline mode
      this.activateOfflineMode();
    }
  }

  /**
   * Handle network status changes from dataManager
   */
  handleNetworkStatusChange(networkStatus) {
    const wasOffline = this.isOffline;
    const isCurrentlyOffline = !networkStatus.isOnline;
    
    if (wasOffline !== isCurrentlyOffline) {
      if (isCurrentlyOffline) {
        this.handleOfflineEvent();
      } else {
        this.handleOnlineEvent();
      }
    }
    
    // Update connection quality information
    this.offlineState.connectionQuality = networkStatus.quality;
    this.offlineState.responseTime = networkStatus.responseTime;
    
    this.notifyListeners('network_status_updated', {
      networkStatus,
      offlineState: this.offlineState
    });
  }

  /**
   * Handle retry service events for connection monitoring
   */
  handleRetryServiceEvent(event, data) {
    switch (event) {
      case 'CIRCUIT_BREAKER_OPENED':
        // Circuit breaker opened indicates persistent connection issues
        if (!this.isOffline) {
          console.log('OfflineService: Circuit breaker opened, considering offline mode');
          this.considerOfflineMode(data);
        }
        break;
        
      case 'RETRY_FAILED':
        // Multiple retry failures might indicate offline condition
        this.handleRetryFailure(data);
        break;
        
      case 'RETRY_SUCCESS':
        // Successful retry after failures indicates connection restoration
        if (this.isOffline) {
          this.handleConnectionRestoration(data);
        }
        break;
    }
  }

  /**
   * Consider switching to offline mode based on connection issues
   */
  considerOfflineMode(data) {
    // Check if we should switch to offline mode based on circuit breaker trips
    const circuitBreakerTrips = retryService.getMetrics().circuitBreakerTrips;
    
    if (circuitBreakerTrips >= 3) {
      console.log('OfflineService: Multiple circuit breaker trips, activating offline mode');
      this.activateOfflineMode();
    }
  }

  /**
   * Handle retry failures for offline mode consideration
   */
  handleRetryFailure(data) {
    // Track consecutive failures
    if (!this.consecutiveFailures) {
      this.consecutiveFailures = 0;
    }
    this.consecutiveFailures++;
    
    // Switch to offline mode after multiple consecutive failures
    if (this.consecutiveFailures >= 5 && !this.isOffline) {
      console.log('OfflineService: Multiple consecutive failures, activating offline mode');
      this.activateOfflineMode();
    }
  }

  /**
   * Handle connection restoration after offline period
   */
  handleConnectionRestoration(data) {
    this.consecutiveFailures = 0;
    
    if (this.isOffline) {
      console.log('OfflineService: Connection restored, initiating sync');
      this.initiateConnectionRestoration();
    }
  }

  /**
   * Activate offline mode with cached data fallback
   */
  activateOfflineMode() {
    this.isOffline = true;
    this.offlineStartTime = Date.now();
    this.offlineState.mode = 'offline';
    
    console.log('OfflineService: Offline mode activated');
    
    // Assess available cached data
    this.assessOfflineCapabilities();
    
    // Notify components about offline mode
    this.notifyListeners('offline_mode_activated', {
      offlineState: this.offlineState,
      availableFeatures: Array.from(this.offlineCapabilities),
      dataAge: this.offlineState.dataAge
    });
    
    // Show offline notification
    this.showOfflineNotification();
  }

  /**
   * Initiate connection restoration process
   */
  async initiateConnectionRestoration() {
    console.log('OfflineService: Initiating connection restoration');
    
    this.offlineState.syncStatus = 'syncing';
    this.offlineState.lastSyncAttempt = Date.now();
    
    try {
      // Test connection with a simple request
      await this.testConnection();
      
      // Connection confirmed, start data synchronization
      await this.synchronizeData();
      
      // Restore online mode
      this.restoreOnlineMode();
      
    } catch (error) {
      console.warn('OfflineService: Connection restoration failed:', error);
      this.offlineState.syncStatus = 'failed';
      
      // Stay in offline mode
      this.notifyListeners('sync_failed', {
        error: error.message,
        nextAttempt: this.getNextSyncAttempt()
      });
    }
  }

  /**
   * Test connection with a lightweight request
   */
  async testConnection() {
    try {
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Synchronize data when connection is restored
   */
  async synchronizeData() {
    console.log('OfflineService: Starting data synchronization');
    
    const syncPromises = [];
    
    // Sync critical data types
    const criticalDataTypes = ['prices', 'portfolioData', 'marketData'];
    
    for (const dataType of criticalDataTypes) {
      syncPromises.push(this.syncDataType(dataType));
    }
    
    // Execute sync operations
    const results = await Promise.allSettled(syncPromises);
    
    // Process sync results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`OfflineService: Sync completed - ${successful} successful, ${failed} failed`);
    
    if (failed > 0) {
      console.warn('OfflineService: Some sync operations failed:', 
        results.filter(r => r.status === 'rejected').map(r => r.reason)
      );
    }
    
    // Process pending actions
    await this.processPendingActions();
    
    this.offlineState.syncStatus = 'success';
    
    this.notifyListeners('sync_completed', {
      successful,
      failed,
      totalOperations: results.length
    });
  }

  /**
   * Sync specific data type
   */
  async syncDataType(dataType) {
    try {
      let data;
      
      switch (dataType) {
        case 'prices':
          data = await dataManager.getPrices(true);
          break;
        case 'portfolioData':
          data = await dataManager.getPortfolioData(true);
          break;
        case 'marketData':
          data = await dataManager.getMarketData(true);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      console.log(`OfflineService: Successfully synced ${dataType}`);
      return data;
      
    } catch (error) {
      console.error(`OfflineService: Failed to sync ${dataType}:`, error);
      throw error;
    }
  }

  /**
   * Process pending actions that were queued during offline mode
   */
  async processPendingActions() {
    if (this.pendingActions.length === 0) {
      return;
    }
    
    console.log(`OfflineService: Processing ${this.pendingActions.length} pending actions`);
    
    const results = [];
    
    for (const action of this.pendingActions) {
      try {
        const result = await this.executePendingAction(action);
        results.push({ action, result, status: 'success' });
      } catch (error) {
        console.error('OfflineService: Failed to execute pending action:', error);
        results.push({ action, error: error.message, status: 'failed' });
      }
    }
    
    // Clear processed actions
    this.pendingActions = [];
    
    this.notifyListeners('pending_actions_processed', { results });
  }

  /**
   * Execute a pending action
   */
  async executePendingAction(action) {
    switch (action.type) {
      case 'trade':
        return await dataManager.executeTrade(
          action.data.type,
          action.data.coinSymbol,
          action.data.amount
        );
      
      case 'data_refresh':
        return await dataManager[action.data.method](...action.data.args);
      
      default:
        throw new Error(`Unknown pending action type: ${action.type}`);
    }
  }

  /**
   * Restore online mode after successful connection restoration
   */
  restoreOnlineMode() {
    this.isOffline = false;
    this.offlineStartTime = null;
    this.lastOnlineTime = Date.now();
    this.offlineState.mode = 'online';
    this.offlineState.syncStatus = 'idle';
    this.consecutiveFailures = 0;
    
    console.log('OfflineService: Online mode restored');
    
    // Clear offline capabilities and limitations
    this.offlineCapabilities.clear();
    this.offlineState.limitedFeatures.clear();
    
    // Notify components about online mode restoration
    this.notifyListeners('online_mode_restored', {
      offlineDuration: Date.now() - (this.offlineStartTime || Date.now()),
      offlineState: this.offlineState
    });
    
    // Show online notification
    this.showOnlineNotification();
  }

  /**
   * Assess available offline capabilities based on cached data
   */
  assessOfflineCapabilities() {
    this.offlineCapabilities.clear();
    this.offlineState.availableData.clear();
    this.offlineState.limitedFeatures.clear();
    
    // Check available cached data and its freshness
    const dataTypes = ['prices', 'marketData', 'portfolioData', 'globalStats'];
    
    for (const dataType of dataTypes) {
      const cached = this.getCachedDataWithAge(dataType);
      
      if (cached.data) {
        this.offlineState.availableData.add(dataType);
        this.offlineState.dataAge[dataType] = cached.age;
        
        // Determine if data is fresh enough for offline use
        const maxAge = this.config.dataFreshness[dataType];
        if (cached.age <= maxAge) {
          this.offlineCapabilities.add(`${dataType}_view`);
        } else {
          this.offlineState.limitedFeatures.add(`${dataType}_stale`);
        }
      }
    }
    
    // Add always-available offline features
    this.offlineCapabilities.add('transaction_history');
    this.offlineCapabilities.add('cached_charts');
    this.offlineCapabilities.add('portfolio_analysis');
    
    console.log('OfflineService: Offline capabilities assessed:', {
      capabilities: Array.from(this.offlineCapabilities),
      availableData: Array.from(this.offlineState.availableData),
      limitedFeatures: Array.from(this.offlineState.limitedFeatures)
    });
  }

  /**
   * Get cached data with age information
   */
  getCachedDataWithAge(dataType) {
    const cacheKeys = {
      prices: 'current_prices',
      marketData: 'market_overview',
      portfolioData: 'user_portfolio',
      globalStats: 'global_market_stats'
    };
    
    const cacheKey = cacheKeys[dataType];
    if (!cacheKey) {
      return { data: null, age: Infinity };
    }
    
    const data = cacheService.get(dataType, cacheKey);
    if (!data) {
      return { data: null, age: Infinity };
    }
    
    // Calculate data age
    const cacheEntry = cacheService.memoryCache.get(
      cacheService.generateKey(dataType, cacheKey)
    );
    
    const age = cacheEntry ? Date.now() - cacheEntry.timestamp : Infinity;
    
    return { data, age };
  }

  /**
   * Initialize data age tracking
   */
  initializeDataAgeTracking() {
    // Update data age every 30 seconds
    setInterval(() => {
      if (this.isOffline) {
        this.updateDataAge();
      }
    }, 30000);
  }

  /**
   * Update data age tracking
   */
  updateDataAge() {
    const dataTypes = ['prices', 'marketData', 'portfolioData', 'globalStats'];
    
    for (const dataType of dataTypes) {
      const cached = this.getCachedDataWithAge(dataType);
      if (cached.data) {
        this.offlineState.dataAge[dataType] = cached.age;
      }
    }
    
    // Notify listeners of data age updates
    this.notifyListeners('data_age_updated', {
      dataAge: this.offlineState.dataAge
    });
  }

  /**
   * Setup periodic sync attempts when offline
   */
  setupPeriodicSync() {
    setInterval(async () => {
      if (this.isOffline && this.offlineState.syncStatus === 'idle') {
        try {
          await this.initiateConnectionRestoration();
        } catch (error) {
          // Sync attempt failed, will try again next interval
          console.log('OfflineService: Periodic sync attempt failed');
        }
      }
    }, 60000); // Try every minute
  }

  /**
   * Get next sync attempt time
   */
  getNextSyncAttempt() {
    return Date.now() + 60000; // Next attempt in 1 minute
  }

  /**
   * Show offline notification
   */
  showOfflineNotification() {
    const notification = {
      type: 'offline',
      title: 'Offline Mode Active',
      message: 'Using cached data. Some features may be limited.',
      duration: this.config.notifications.autoHideDelay,
      actions: [
        {
          label: 'View Available Features',
          action: 'show_offline_features'
        },
        {
          label: 'Retry Connection',
          action: 'retry_connection'
        }
      ]
    };
    
    this.notifyListeners('show_notification', notification);
  }

  /**
   * Show online notification
   */
  showOnlineNotification() {
    const offlineDuration = this.offlineStartTime ? 
      Date.now() - this.offlineStartTime : 0;
    
    const notification = {
      type: 'online',
      title: 'Connection Restored',
      message: `Back online. Data synchronized successfully.`,
      duration: 5000,
      metadata: {
        offlineDuration: Math.round(offlineDuration / 1000) // in seconds
      }
    };
    
    this.notifyListeners('show_notification', notification);
  }

  /**
   * Queue action for execution when back online
   */
  queuePendingAction(type, data) {
    const action = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now()
    };
    
    this.pendingActions.push(action);
    
    console.log(`OfflineService: Queued pending action: ${type}`);
    
    this.notifyListeners('action_queued', {
      action,
      queueLength: this.pendingActions.length
    });
    
    return action.id;
  }

  /**
   * Check if feature is available in offline mode
   */
  isFeatureAvailable(feature) {
    if (!this.isOffline) {
      return true; // All features available when online
    }
    
    return this.offlineCapabilities.has(feature) && 
           !this.config.disabledFeatures.includes(feature);
  }

  /**
   * Get offline mode status
   */
  getOfflineStatus() {
    return {
      isOffline: this.isOffline,
      offlineStartTime: this.offlineStartTime,
      lastOnlineTime: this.lastOnlineTime,
      offlineState: this.offlineState,
      availableFeatures: Array.from(this.offlineCapabilities),
      disabledFeatures: this.config.disabledFeatures,
      pendingActions: this.pendingActions.length,
      dataAge: this.offlineState.dataAge
    };
  }

  /**
   * Get cached data for offline use
   */
  getOfflineData(dataType) {
    if (!this.isOffline) {
      throw new Error('getOfflineData should only be called in offline mode');
    }
    
    const cached = this.getCachedDataWithAge(dataType);
    
    if (!cached.data) {
      throw new Error(`No cached data available for ${dataType}`);
    }
    
    return {
      data: cached.data,
      age: cached.age,
      isStale: cached.age > this.config.dataFreshness[dataType],
      lastUpdate: new Date(Date.now() - cached.age)
    };
  }

  /**
   * Force retry connection
   */
  async forceRetryConnection() {
    if (!this.isOffline) {
      return { success: true, message: 'Already online' };
    }
    
    try {
      await this.initiateConnectionRestoration();
      return { success: true, message: 'Connection restored successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Add event listener for offline mode changes
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove event listener
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of offline mode events
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.warn('OfflineService: Error in event listener:', error);
      }
    });
  }

  /**
   * Enhanced offline mode methods for comprehensive functionality
   */

  /**
   * Get comprehensive offline status with detailed information
   */
  getComprehensiveOfflineStatus() {
    const offlineDuration = this.offlineStartTime ? 
      Date.now() - this.offlineStartTime : 0;

    return {
      ...this.getOfflineStatus(),
      offlineDuration,
      capabilities: this.config.capabilities,
      dataQuality: this.assessDataQuality(),
      userGuidance: this.generateUserGuidance(),
      syncProgress: this.offlineState.syncProgress,
      recommendations: this.getOfflineRecommendations()
    };
  }

  /**
   * Assess data quality for offline mode
   */
  assessDataQuality() {
    const dataQuality = {
      fresh: new Set(),
      stale: new Set(),
      veryStale: new Set(),
      missing: new Set()
    };

    const dataTypes = Object.keys(this.config.dataFreshness);
    
    for (const dataType of dataTypes) {
      const cached = this.getCachedDataWithAge(dataType);
      const maxAge = this.config.dataFreshness[dataType];
      
      if (!cached.data) {
        dataQuality.missing.add(dataType);
      } else if (cached.age <= maxAge * 0.5) {
        dataQuality.fresh.add(dataType);
      } else if (cached.age <= maxAge) {
        dataQuality.stale.add(dataType);
      } else {
        dataQuality.veryStale.add(dataType);
      }
    }

    this.offlineState.dataQuality = dataQuality;
    return dataQuality;
  }

  /**
   * Generate user guidance for offline mode
   */
  generateUserGuidance() {
    const guidance = {
      tips: [],
      limitations: [],
      availableActions: []
    };

    // Generate tips based on available data
    if (this.offlineState.dataQuality.fresh.size > 0) {
      guidance.tips.push('You have fresh cached data for portfolio and market analysis');
    }
    
    if (this.offlineState.dataQuality.stale.size > 0) {
      guidance.tips.push('Some data may be outdated - check timestamps before making decisions');
    }

    // Generate limitations
    guidance.limitations = this.config.disabledFeatures.map(feature => ({
      feature,
      reason: 'Requires real-time connection',
      alternative: this.getFeatureAlternative(feature)
    }));

    // Generate available actions
    guidance.availableActions = this.config.offlineFeatures.filter(feature => 
      this.isFeatureAvailable(feature)
    ).map(feature => ({
      feature,
      description: this.getFeatureDescription(feature),
      dataAge: this.getFeatureDataAge(feature)
    }));

    this.offlineState.userGuidance = guidance;
    return guidance;
  }

  /**
   * Get alternative for disabled feature
   */
  getFeatureAlternative(feature) {
    const alternatives = {
      'real_time_trading': 'View portfolio and queue trades for when connection returns',
      'live_price_updates': 'View cached price data with timestamps',
      'order_execution': 'Queue orders for execution when back online',
      'real_time_charts': 'View cached historical chart data',
      'live_notifications': 'Check cached transaction history'
    };
    
    return alternatives[feature] || 'Feature will be available when connection is restored';
  }

  /**
   * Get feature description
   */
  getFeatureDescription(feature) {
    const descriptions = {
      'portfolio_view': 'View your portfolio value and holdings',
      'portfolio_analytics': 'Analyze portfolio performance and allocation',
      'holdings_analysis': 'Review individual asset performance',
      'price_history_view': 'View historical price data',
      'market_data_view': 'Browse cached market information',
      'transaction_history': 'Review past transactions',
      'cached_charts': 'View historical price charts',
      'performance_metrics': 'Analyze portfolio performance metrics',
      'settings_management': 'Manage app settings and preferences',
      'data_export': 'Export cached data for analysis'
    };
    
    return descriptions[feature] || 'Feature available offline';
  }

  /**
   * Get data age for feature
   */
  getFeatureDataAge(feature) {
    const featureDataMapping = {
      'portfolio_view': 'portfolioData',
      'portfolio_analytics': 'portfolioData',
      'holdings_analysis': 'portfolioData',
      'price_history_view': 'prices',
      'market_data_view': 'marketData',
      'cached_charts': 'chartData',
      'performance_metrics': 'portfolioData'
    };
    
    const dataType = featureDataMapping[feature];
    return dataType ? this.offlineState.dataAge[dataType] : null;
  }

  /**
   * Get offline recommendations
   */
  getOfflineRecommendations() {
    const recommendations = [];
    
    if (this.offlineState.dataQuality.veryStale.size > 0) {
      recommendations.push({
        type: 'warning',
        message: 'Some data is very outdated. Consider waiting for connection to restore for accurate information.',
        action: 'retry_connection'
      });
    }
    
    if (this.pendingActions.length > 0) {
      recommendations.push({
        type: 'info',
        message: `You have ${this.pendingActions.length} queued actions that will execute when connection returns.`,
        action: 'view_pending_actions'
      });
    }
    
    if (this.offlineState.dataQuality.fresh.size > 3) {
      recommendations.push({
        type: 'success',
        message: 'You have good cached data available for offline analysis.',
        action: 'explore_offline_features'
      });
    }

    return recommendations;
  }

  /**
   * Enhanced data synchronization with progress tracking
   */
  async synchronizeDataWithProgress() {
    console.log('OfflineService: Starting enhanced data synchronization');
    
    this.offlineState.syncStatus = 'syncing';
    this.offlineState.lastSyncAttempt = Date.now();
    
    const dataTypes = this.config.sync.priorityDataTypes;
    this.offlineState.syncProgress = {
      total: dataTypes.length,
      completed: 0,
      failed: 0,
      current: null
    };

    const results = [];
    
    for (const dataType of dataTypes) {
      this.offlineState.syncProgress.current = dataType;
      
      this.notifyListeners('sync_progress', {
        progress: this.offlineState.syncProgress,
        currentDataType: dataType
      });
      
      try {
        const result = await this.syncDataTypeWithRetry(dataType);
        results.push({ dataType, status: 'success', result });
        this.offlineState.syncProgress.completed++;
      } catch (error) {
        console.error(`OfflineService: Failed to sync ${dataType}:`, error);
        results.push({ dataType, status: 'failed', error: error.message });
        this.offlineState.syncProgress.failed++;
      }
    }
    
    this.offlineState.syncProgress.current = null;
    this.offlineState.syncStatus = this.offlineState.syncProgress.failed === 0 ? 'success' : 'partial';
    
    // Process pending actions
    await this.processPendingActions();
    
    this.notifyListeners('sync_completed_with_progress', {
      results,
      progress: this.offlineState.syncProgress
    });
    
    return results;
  }

  /**
   * Sync data type with retry logic
   */
  async syncDataTypeWithRetry(dataType) {
    const maxRetries = this.config.sync.syncRetryAttempts;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.syncDataType(dataType);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          console.log(`OfflineService: Retry ${attempt}/${maxRetries} for ${dataType} in ${this.config.sync.syncRetryDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, this.config.sync.syncRetryDelay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Search cached data offline
   */
  searchOfflineData(query, options = {}) {
    if (!this.config.capabilities.enableOfflineSearch) {
      throw new Error('Offline search is not enabled');
    }
    
    const {
      dataTypes = ['portfolioData', 'marketData', 'transactionHistory'],
      maxResults = 50,
      includeStale = false
    } = options;
    
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const dataType of dataTypes) {
      const cached = this.getCachedDataWithAge(dataType);
      
      if (!cached.data) continue;
      
      const maxAge = this.config.dataFreshness[dataType];
      if (!includeStale && cached.age > maxAge) continue;
      
      // Search within the cached data
      const searchResults = this.searchInData(cached.data, queryLower, dataType);
      results.push(...searchResults);
    }
    
    return results.slice(0, maxResults);
  }

  /**
   * Search within specific data
   */
  searchInData(data, query, dataType) {
    const results = [];
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (this.itemMatchesQuery(item, query)) {
          results.push({
            dataType,
            item,
            index,
            relevance: this.calculateRelevance(item, query)
          });
        }
      });
    } else if (typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        if (this.itemMatchesQuery(value, query) || key.toLowerCase().includes(query)) {
          results.push({
            dataType,
            key,
            item: value,
            relevance: this.calculateRelevance(value, query)
          });
        }
      });
    }
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Check if item matches search query
   */
  itemMatchesQuery(item, query) {
    if (typeof item === 'string') {
      return item.toLowerCase().includes(query);
    }
    
    if (typeof item === 'object' && item !== null) {
      return Object.values(item).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(query)
      );
    }
    
    return false;
  }

  /**
   * Calculate search relevance score
   */
  calculateRelevance(item, query) {
    let score = 0;
    
    if (typeof item === 'string') {
      const index = item.toLowerCase().indexOf(query);
      if (index === 0) score += 10; // Starts with query
      else if (index > 0) score += 5; // Contains query
    }
    
    if (typeof item === 'object' && item !== null) {
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === 'string') {
          const index = value.toLowerCase().indexOf(query);
          if (index === 0) score += 8;
          else if (index > 0) score += 3;
        }
        
        if (key.toLowerCase().includes(query)) {
          score += 6;
        }
      });
    }
    
    return score;
  }

  /**
   * Export cached data for offline analysis
   */
  exportCachedData(options = {}) {
    if (!this.config.capabilities.enableDataExport) {
      throw new Error('Data export is not enabled');
    }
    
    const {
      dataTypes = Object.keys(this.config.dataFreshness),
      format = 'json',
      includeMetadata = true
    } = options;
    
    const exportData = {
      exportTimestamp: Date.now(),
      offlineMode: this.isOffline,
      dataTypes: {}
    };
    
    for (const dataType of dataTypes) {
      const cached = this.getCachedDataWithAge(dataType);
      
      if (cached.data) {
        exportData.dataTypes[dataType] = {
          data: cached.data,
          age: cached.age,
          lastUpdate: new Date(Date.now() - cached.age),
          isStale: cached.age > this.config.dataFreshness[dataType]
        };
        
        if (includeMetadata) {
          exportData.dataTypes[dataType].metadata = {
            cacheKey: this.getCacheKeyForDataType(dataType),
            dataSize: JSON.stringify(cached.data).length,
            compressionRatio: this.getCompressionRatio(dataType)
          };
        }
      }
    }
    
    if (format === 'csv') {
      return this.convertToCSV(exportData);
    }
    
    return exportData;
  }

  /**
   * Get cache key for data type
   */
  getCacheKeyForDataType(dataType) {
    const cacheKeys = {
      prices: 'current_prices',
      marketData: 'market_overview',
      portfolioData: 'user_portfolio',
      globalStats: 'global_market_stats',
      chartData: 'chart_data',
      transactionHistory: 'transaction_history'
    };
    
    return cacheKeys[dataType] || dataType;
  }

  /**
   * Get compression ratio for data type
   */
  getCompressionRatio(dataType) {
    // This would integrate with the cache service compression metrics
    return cacheService.getCompressionRatio ? 
      cacheService.getCompressionRatio(dataType) : 1.0;
  }

  /**
   * Convert export data to CSV format
   */
  convertToCSV(exportData) {
    // Simple CSV conversion for basic data types
    let csv = 'DataType,LastUpdate,Age(ms),IsStale,DataSize\n';
    
    Object.entries(exportData.dataTypes).forEach(([dataType, info]) => {
      csv += `${dataType},${info.lastUpdate},${info.age},${info.isStale},${info.metadata?.dataSize || 0}\n`;
    });
    
    return csv;
  }

  /**
   * Get offline analytics
   */
  getOfflineAnalytics() {
    if (!this.config.capabilities.enableOfflineAnalytics) {
      return null;
    }
    
    const analytics = {
      offlineSessionDuration: this.offlineStartTime ? Date.now() - this.offlineStartTime : 0,
      dataQuality: this.assessDataQuality(),
      featureUsage: this.trackOfflineFeatureUsage(),
      userBehavior: this.analyzeOfflineUserBehavior(),
      cacheEfficiency: this.analyzeCacheEfficiency()
    };
    
    return analytics;
  }

  /**
   * Track offline feature usage
   */
  trackOfflineFeatureUsage() {
    // This would track which offline features are being used
    return {
      mostUsedFeatures: this.config.offlineFeatures.slice(0, 5),
      leastUsedFeatures: this.config.offlineFeatures.slice(-3),
      totalFeatureAccess: this.config.offlineFeatures.length
    };
  }

  /**
   * Analyze offline user behavior
   */
  analyzeOfflineUserBehavior() {
    return {
      sessionLength: this.offlineStartTime ? Date.now() - this.offlineStartTime : 0,
      actionsQueued: this.pendingActions.length,
      dataAccessPatterns: this.getDataAccessPatterns(),
      preferredFeatures: this.getPreferredOfflineFeatures()
    };
  }

  /**
   * Get data access patterns
   */
  getDataAccessPatterns() {
    // This would track which data types are accessed most in offline mode
    return Array.from(this.offlineState.availableData).map(dataType => ({
      dataType,
      accessCount: 1, // Would be tracked in real implementation
      lastAccess: Date.now()
    }));
  }

  /**
   * Get preferred offline features
   */
  getPreferredOfflineFeatures() {
    return this.config.offlineFeatures.filter(feature => 
      this.isFeatureAvailable(feature)
    );
  }

  /**
   * Analyze cache efficiency
   */
  analyzeCacheEfficiency() {
    return {
      hitRate: 85, // Would get from cache service
      dataFreshness: this.calculateAverageDataFreshness(),
      storageUtilization: this.calculateStorageUtilization()
    };
  }

  /**
   * Calculate average data freshness
   */
  calculateAverageDataFreshness() {
    const ages = Object.values(this.offlineState.dataAge);
    if (ages.length === 0) return 0;
    
    const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    const maxAge = Math.max(...Object.values(this.config.dataFreshness));
    
    return Math.max(0, 100 - (averageAge / maxAge) * 100);
  }

  /**
   * Calculate storage utilization
   */
  calculateStorageUtilization() {
    // This would calculate how much of the available storage is being used
    return {
      used: Object.keys(this.offlineState.dataAge).length,
      available: this.config.capabilities.maxCachedItems,
      percentage: (Object.keys(this.offlineState.dataAge).length / this.config.capabilities.maxCachedItems) * 100
    };
  }
}
}

// Create singleton instance
const offlineService = new OfflineService();

export default offlineService;