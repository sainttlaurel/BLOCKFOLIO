/**
 * Fallback Manager Service
 * 
 * Provides intelligent fallback mechanisms for connection failures,
 * including HTTP polling, cached data serving, and graceful degradation
 * to ensure continuous operation even during network issues.
 */

import { EventEmitter } from 'events';
import dataManager from './dataManager';
import cacheService from './cacheService';
import offlineService from './offlineService';

class FallbackManager extends EventEmitter {
  constructor() {
    super();
    
    this.fallbackStrategies = {
      websocket: [
        'http_polling',
        'server_sent_events',
        'cached_data',
        'offline_mode'
      ],
      http: [
        'retry_with_backoff',
        'alternative_endpoints',
        'cached_data',
        'offline_mode'
      ]
    };
    
    this.currentStrategy = {
      websocket: 'websocket',
      http: 'http'
    };
    
    this.fallbackState = {
      websocket: {
        active: false,
        strategy: null,
        startTime: null,
        attempts: 0,
        lastSuccess: null
      },
      http: {
        active: false,
        strategy: null,
        startTime: null,
        attempts: 0,
        lastSuccess: null
      }
    };
    
    // HTTP polling configuration
    this.pollingConfig = {
      intervals: {
        prices: 5000,      // 5 seconds
        marketData: 10000, // 10 seconds
        portfolio: 15000   // 15 seconds
      },
      maxInterval: 60000,  // 1 minute max
      backoffMultiplier: 1.5,
      activePollers: new Map()
    };
    
    // Alternative endpoints configuration
    this.alternativeEndpoints = {
      primary: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      fallback1: process.env.REACT_APP_FALLBACK_API_1,
      fallback2: process.env.REACT_APP_FALLBACK_API_2,
      cdn: process.env.REACT_APP_CDN_API
    };
    
    this.currentEndpoint = 'primary';
    
    // Server-Sent Events configuration
    this.sseConfig = {
      url: process.env.REACT_APP_SSE_URL || 'http://localhost:5000/events',
      eventSource: null,
      reconnectDelay: 3000,
      maxReconnectAttempts: 10
    };
    
    // Fallback metrics
    this.metrics = {
      totalFallbacks: 0,
      successfulFallbacks: 0,
      fallbackDuration: 0,
      strategiesUsed: {},
      endpointSwitches: 0,
      pollingRequests: 0,
      cacheHits: 0
    };
    
    this.initialize();
  }

  /**
   * Initialize fallback manager
   */
  initialize() {
    // Listen for connection failures
    this.setupConnectionListeners();
    
    // Initialize offline service integration
    this.setupOfflineIntegration();
    
    console.log('Fallback manager initialized');
  }

  /**
   * Setup connection event listeners
   */
  setupConnectionListeners() {
    // WebSocket connection events
    window.addEventListener('websocket_disconnected', () => {
      this.handleConnectionFailure('websocket');
    });
    
    window.addEventListener('websocket_connected', () => {
      this.handleConnectionRestored('websocket');
    });
    
    // HTTP connection events
    window.addEventListener('http_error', (event) => {
      this.handleConnectionFailure('http', event.detail);
    });
    
    window.addEventListener('online', () => {
      this.handleNetworkRestored();
    });
    
    window.addEventListener('offline', () => {
      this.handleNetworkLost();
    });
  }

  /**
   * Setup offline service integration
   */
  setupOfflineIntegration() {
    offlineService.on('dataRequested', (dataType) => {
      this.handleOfflineDataRequest(dataType);
    });
    
    offlineService.on('syncRequired', () => {
      this.handleSyncRequired();
    });
  }

  /**
   * Handle connection failure and activate fallback
   */
  async handleConnectionFailure(connectionType, error = null) {
    console.log(`Connection failure detected for ${connectionType}:`, error);
    
    const state = this.fallbackState[connectionType];
    
    if (state.active) {
      // Already in fallback mode, try next strategy
      await this.tryNextStrategy(connectionType);
    } else {
      // Activate first fallback strategy
      await this.activateFallback(connectionType);
    }
    
    this.emit('fallbackActivated', connectionType, state.strategy);
  }

  /**
   * Handle connection restored
   */
  handleConnectionRestored(connectionType) {
    console.log(`Connection restored for ${connectionType}`);
    
    const state = this.fallbackState[connectionType];
    
    if (state.active) {
      this.deactivateFallback(connectionType);
      this.emit('fallbackDeactivated', connectionType);
    }
  }

  /**
   * Handle network lost (offline)
   */
  handleNetworkLost() {
    console.log('Network connection lost - activating offline mode');
    
    // Activate offline fallback for all connection types
    Object.keys(this.fallbackState).forEach(connectionType => {
      this.activateOfflineMode(connectionType);
    });
    
    this.emit('offlineModeActivated');
  }

  /**
   * Handle network restored (online)
   */
  handleNetworkRestored() {
    console.log('Network connection restored');
    
    // Attempt to restore normal connections
    Object.keys(this.fallbackState).forEach(connectionType => {
      if (this.fallbackState[connectionType].strategy === 'offline_mode') {
        this.attemptConnectionRestore(connectionType);
      }
    });
    
    this.emit('networkRestored');
  }

  /**
   * Activate fallback for connection type
   */
  async activateFallback(connectionType) {
    const strategies = this.fallbackStrategies[connectionType];
    const state = this.fallbackState[connectionType];
    
    state.active = true;
    state.startTime = Date.now();
    state.attempts = 0;
    
    this.metrics.totalFallbacks++;
    
    // Try first strategy
    await this.tryStrategy(connectionType, strategies[0]);
  }

  /**
   * Try next fallback strategy
   */
  async tryNextStrategy(connectionType) {
    const strategies = this.fallbackStrategies[connectionType];
    const state = this.fallbackState[connectionType];
    
    state.attempts++;
    
    const currentIndex = strategies.indexOf(state.strategy);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < strategies.length) {
      await this.tryStrategy(connectionType, strategies[nextIndex]);
    } else {
      // All strategies exhausted, use offline mode
      await this.activateOfflineMode(connectionType);
    }
  }

  /**
   * Try specific fallback strategy
   */
  async tryStrategy(connectionType, strategy) {
    console.log(`Trying fallback strategy: ${strategy} for ${connectionType}`);
    
    const state = this.fallbackState[connectionType];
    state.strategy = strategy;
    
    if (!this.metrics.strategiesUsed[strategy]) {
      this.metrics.strategiesUsed[strategy] = 0;
    }
    this.metrics.strategiesUsed[strategy]++;
    
    try {
      switch (strategy) {
        case 'http_polling':
          await this.activateHttpPolling(connectionType);
          break;
        case 'server_sent_events':
          await this.activateServerSentEvents();
          break;
case 'retry_with_backoff':
          await this.activateRetryWithBackoff(connectionType);
          break;
        case 'alternative_endpoints':
          await this.activateAlternativeEndpoints();
          break;
        case 'cached_data':
          await this.activateCachedDataMode(connectionType);
          break;
        case 'offline_mode':
          await this.activateOfflineMode(connectionType);
          break;
        default:
          throw new Error(`Unknown fallback strategy: ${strategy}`);
      }
      
      this.metrics.successfulFallbacks++;
      console.log(`Fallback strategy ${strategy} activated successfully`);
      
    } catch (error) {
      console.error(`Fallback strategy ${strategy} failed:`, error);
      await this.tryNextStrategy(connectionType);
    }
  }

  /**
   * Activate HTTP polling fallback
   */
  async activateHttpPolling(connectionType) {
    if (connectionType !== 'websocket') {
      throw new Error('HTTP polling only available for WebSocket fallback');
    }
    
    console.log('Activating HTTP polling fallback');
    
    // Start polling for different data types
    const dataTypes = ['prices', 'marketData', 'portfolio'];
    
    dataTypes.forEach(dataType => {
      this.startPolling(dataType);
    });
    
    this.emit('httpPollingActivated');
  }

  /**
   * Start polling for specific data type
   */
  startPolling(dataType) {
    if (this.pollingConfig.activePollers.has(dataType)) {
      return; // Already polling
    }
    
    const interval = this.pollingConfig.intervals[dataType];
    let currentInterval = interval;
    let consecutiveErrors = 0;
    
    const poll = async () => {
      try {
        let data;
        
        switch (dataType) {
          case 'prices':
            data = await dataManager.getPrices(true);
            break;
          case 'marketData':
            data = await dataManager.getMarketData(true);
            break;
          case 'portfolio':
            data = await dataManager.getPortfolioData(true);
            break;
        }
        
        // Emit data update event
        this.emit('pollingDataUpdate', dataType, data);
        
        // Reset interval on success
        currentInterval = interval;
        consecutiveErrors = 0;
        this.metrics.pollingRequests++;
        
      } catch (error) {
        console.warn(`Polling failed for ${dataType}:`, error);
        consecutiveErrors++;
        
        // Increase interval on consecutive errors
        if (consecutiveErrors > 2) {
          currentInterval = Math.min(
            currentInterval * this.pollingConfig.backoffMultiplier,
            this.pollingConfig.maxInterval
          );
        }
      }
      
      // Schedule next poll
      const pollerId = setTimeout(poll, currentInterval);
      this.pollingConfig.activePollers.set(dataType, pollerId);
    };
    
    // Start initial poll
    poll();
  }

  /**
   * Stop polling for specific data type
   */
  stopPolling(dataType) {
    const pollerId = this.pollingConfig.activePollers.get(dataType);
    if (pollerId) {
      clearTimeout(pollerId);
      this.pollingConfig.activePollers.delete(dataType);
    }
  }

  /**
   * Stop all polling
   */
  stopAllPolling() {
    this.pollingConfig.activePollers.forEach((pollerId, dataType) => {
      clearTimeout(pollerId);
    });
    this.pollingConfig.activePollers.clear();
  }

  /**
   * Activate Server-Sent Events fallback
   */
  async activateServerSentEvents() {
    console.log('Activating Server-Sent Events fallback');
    
    if (this.sseConfig.eventSource) {
      this.sseConfig.eventSource.close();
    }
    
    try {
      this.sseConfig.eventSource = new EventSource(this.sseConfig.url);
      
      this.sseConfig.eventSource.onopen = () => {
        console.log('SSE connection established');
        this.emit('sseConnected');
      };
      
      this.sseConfig.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('sseDataUpdate', data.type, data.payload);
        } catch (error) {
          console.error('SSE message parsing error:', error);
        }
      };
      
      this.sseConfig.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.handleSSEError();
      };
      
    } catch (error) {
      throw new Error(`Failed to establish SSE connection: ${error.message}`);
    }
  }

  /**
   * Handle SSE connection error
   */
  handleSSEError() {
    if (this.sseConfig.eventSource) {
      this.sseConfig.eventSource.close();
      this.sseConfig.eventSource = null;
    }
    
    // Try to reconnect after delay
    setTimeout(() => {
      if (this.fallbackState.websocket.strategy === 'server_sent_events') {
        this.activateServerSentEvents().catch(() => {
          // If SSE fails, try next strategy
          this.tryNextStrategy('websocket');
        });
      }
    }, this.sseConfig.reconnectDelay);
  }

  /**
   * Activate retry with backoff fallback
   */
  async activateRetryWithBackoff(connectionType) {
    console.log(`Activating retry with backoff for ${connectionType}`);
    
    // This strategy is handled by the existing retry mechanisms
    // in dataManager and websocketService, so we just need to
    // ensure they're configured properly
    
    if (connectionType === 'http') {
      // Increase retry attempts for HTTP requests
      dataManager.updateRetryConfig({
        maxRetries: 10,
        baseDelay: 2000,
        maxDelay: 30000
      });
    }
    
    this.emit('retryWithBackoffActivated', connectionType);
  }

  /**
   * Activate alternative endpoints fallback
   */
  async activateAlternativeEndpoints() {
    console.log('Activating alternative endpoints fallback');
    
    const endpoints = Object.keys(this.alternativeEndpoints);
    const currentIndex = endpoints.indexOf(this.currentEndpoint);
    
    // Try next endpoint
    for (let i = 1; i < endpoints.length; i++) {
      const nextIndex = (currentIndex + i) % endpoints.length;
      const nextEndpoint = endpoints[nextIndex];
      const endpointUrl = this.alternativeEndpoints[nextEndpoint];
      
      if (!endpointUrl) continue;
      
      try {
        // Test endpoint availability
        const response = await fetch(`${endpointUrl}/health`, {
          method: 'HEAD',
          timeout: 5000
        });
        
        if (response.ok) {
          this.switchToEndpoint(nextEndpoint, endpointUrl);
          return;
        }
      } catch (error) {
        console.warn(`Alternative endpoint ${nextEndpoint} failed:`, error);
      }
    }
    
    throw new Error('No alternative endpoints available');
  }

  /**
   * Switch to alternative endpoint
   */
  switchToEndpoint(endpointName, endpointUrl) {
    console.log(`Switching to endpoint: ${endpointName} (${endpointUrl})`);
    
    this.currentEndpoint = endpointName;
    this.metrics.endpointSwitches++;
    
    // Update dataManager base URL
    dataManager.baseURL = endpointUrl;
    
    this.emit('endpointSwitched', endpointName, endpointUrl);
  }

  /**
   * Activate cached data mode
   */
  async activateCachedDataMode(connectionType) {
    console.log(`Activating cached data mode for ${connectionType}`);
    
    // Serve data from cache when available
    const cachedDataTypes = ['prices', 'marketData', 'portfolio'];
    
    cachedDataTypes.forEach(dataType => {
      const cachedData = this.getCachedData(dataType);
      if (cachedData) {
        this.emit('cachedDataServed', dataType, cachedData);
        this.metrics.cacheHits++;
      }
    });
    
    this.emit('cachedDataModeActivated', connectionType);
  }

  /**
   * Get cached data for data type
   */
  getCachedData(dataType) {
    switch (dataType) {
      case 'prices':
        return cacheService.get('prices', 'current_prices');
      case 'marketData':
        return cacheService.get('marketData', 'market_overview');
      case 'portfolio':
        return cacheService.get('portfolioData', 'user_portfolio');
      default:
        return null;
    }
  }

  /**
   * Activate offline mode
   */
  async activateOfflineMode(connectionType) {
    console.log(`Activating offline mode for ${connectionType}`);
    
    // Enable offline service
    await offlineService.enable();
    
    // Serve offline data
    const offlineData = await offlineService.getOfflineData();
    if (offlineData) {
      Object.keys(offlineData).forEach(dataType => {
        this.emit('offlineDataServed', dataType, offlineData[dataType]);
      });
    }
    
    this.emit('offlineModeActivated', connectionType);
  }

  /**
   * Deactivate fallback and restore normal operation
   */
  deactivateFallback(connectionType) {
    console.log(`Deactivating fallback for ${connectionType}`);
    
    const state = this.fallbackState[connectionType];
    
    if (state.active) {
      // Calculate fallback duration
      const duration = Date.now() - state.startTime;
      this.metrics.fallbackDuration += duration;
      
      // Cleanup based on strategy
      this.cleanupStrategy(connectionType, state.strategy);
      
      // Reset state
      state.active = false;
      state.strategy = null;
      state.startTime = null;
      state.attempts = 0;
      state.lastSuccess = Date.now();
    }
  }

  /**
   * Cleanup strategy-specific resources
   */
  cleanupStrategy(connectionType, strategy) {
    switch (strategy) {
      case 'http_polling':
        this.stopAllPolling();
        break;
      case 'server_sent_events':
        if (this.sseConfig.eventSource) {
          this.sseConfig.eventSource.close();
          this.sseConfig.eventSource = null;
        }
        break;
      case 'offline_mode':
        offlineService.disable();
        break;
    }
  }

  /**
   * Attempt to restore normal connection
   */
  async attemptConnectionRestore(connectionType) {
    console.log(`Attempting to restore ${connectionType} connection`);
    
    try {
      if (connectionType === 'websocket') {
        // Try to reconnect WebSocket
        const websocketService = await import('./websocketService');
        websocketService.default.reconnect();
      } else if (connectionType === 'http') {
        // Test HTTP connectivity
        const response = await fetch('/api/health', { method: 'HEAD' });
        if (response.ok) {
          this.handleConnectionRestored(connectionType);
        }
      }
    } catch (error) {
      console.warn(`Failed to restore ${connectionType} connection:`, error);
    }
  }

  /**
   * Handle offline data request
   */
  async handleOfflineDataRequest(dataType) {
    // Try to serve from cache first
    const cachedData = this.getCachedData(dataType);
    if (cachedData) {
      return cachedData;
    }
    
    // Fallback to offline service
    return await offlineService.getData(dataType);
  }

  /**
   * Handle sync required event
   */
  async handleSyncRequired() {
    console.log('Sync required - attempting to restore connections');
    
    // Try to restore all connections
    Object.keys(this.fallbackState).forEach(connectionType => {
      this.attemptConnectionRestore(connectionType);
    });
  }

  /**
   * Get fallback status
   */
  getFallbackStatus() {
    return {
      states: { ...this.fallbackState },
      currentStrategies: Object.keys(this.fallbackState).reduce((acc, type) => {
        acc[type] = this.fallbackState[type].strategy || 'normal';
        return acc;
      }, {}),
      currentEndpoint: this.currentEndpoint,
      metrics: this.getMetrics(),
      activePollers: Array.from(this.pollingConfig.activePollers.keys()),
      sseConnected: this.sseConfig.eventSource?.readyState === EventSource.OPEN
    };
  }

  /**
   * Get fallback metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      averageFallbackDuration: this.metrics.totalFallbacks > 0 
        ? this.metrics.fallbackDuration / this.metrics.totalFallbacks 
        : 0,
      fallbackSuccessRate: this.metrics.totalFallbacks > 0 
        ? (this.metrics.successfulFallbacks / this.metrics.totalFallbacks * 100).toFixed(2) + '%'
        : '100%'
    };
  }

  /**
   * Force fallback activation (for testing)
   */
  forceFallback(connectionType, strategy = null) {
    if (strategy) {
      this.tryStrategy(connectionType, strategy);
    } else {
      this.activateFallback(connectionType);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopAllPolling();
    
    if (this.sseConfig.eventSource) {
      this.sseConfig.eventSource.close();
    }
    
    this.removeAllListeners();
  }
}

// Create singleton instance
const fallbackManager = new FallbackManager();

export default fallbackManager;