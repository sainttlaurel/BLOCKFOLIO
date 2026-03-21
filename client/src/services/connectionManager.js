/**
 * Connection Manager Service
 * 
 * Manages all connection types (WebSocket, HTTP) with intelligent monitoring,
 * automatic reconnection strategies, and connection health optimization.
 */

import { EventEmitter } from 'events';
import websocketService from './websocketService';
import dataManager from './dataManager';

class ConnectionManager extends EventEmitter {
  constructor() {
    super();
    
    this.connections = {
      websocket: websocketService,
      http: dataManager
    };
    
    this.connectionStates = {
      websocket: 'disconnected',
      http: 'unknown'
    };
    
    this.reconnectionStrategies = {
      websocket: {
        enabled: true,
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 1.5,
        jitterFactor: 0.2
      },
      http: {
        enabled: true,
        maxAttempts: 5,
        baseDelay: 2000,
        maxDelay: 15000,
        backoffMultiplier: 2,
        jitterFactor: 0.1
      }
    };
    
    this.healthChecks = {
      websocket: {
        interval: 30000, // 30 seconds
        timeout: 5000,
        enabled: true,
        lastCheck: null,
        consecutive_failures: 0
      },
      http: {
        interval: 60000, // 1 minute
        timeout: 10000,
        enabled: true,
        lastCheck: null,
        consecutive_failures: 0
      }
    };
    
    this.metrics = {
      websocket: {
        totalConnections: 0,
        totalDisconnections: 0,
        totalReconnections: 0,
        averageConnectionTime: 0,
        lastConnectedAt: null,
        lastDisconnectedAt: null,
        uptime: 0,
        reliability: 100
      },
      http: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastRequestAt: null,
        reliability: 100
      }
    };
    
    this.alertThresholds = {
      maxConsecutiveFailures: 3,
      maxReconnectionAttempts: 5,
      maxLatency: 2000,
      minReliability: 80
    };
    
    this.alerts = [];
    this.isMonitoring = false;
    
    this.initialize();
  }

  /**
   * Initialize connection manager
   */
  initialize() {
    this.setupWebSocketListeners();
    this.setupHttpListeners();
    this.startMonitoring();
  }

  /**
   * Setup WebSocket event listeners
   */
  setupWebSocketListeners() {
    const ws = this.connections.websocket;
    
    ws.on('connectionStateChange', (state) => {
      this.connectionStates.websocket = state;
      this.emit('connectionStateChange', 'websocket', state);
      
      if (state === 'connected') {
        this.handleWebSocketConnected();
      } else if (state === 'disconnected') {
        this.handleWebSocketDisconnected();
      }
    });
    
    ws.on('error', (error) => {
      this.handleConnectionError('websocket', error);
    });
    
    ws.on('latencyUpdate', (latency) => {
      this.handleLatencyUpdate('websocket', latency);
    });
    
    ws.on('maxReconnectAttemptsReached', () => {
      this.handleMaxReconnectAttempts('websocket');
    });
  }

  /**
   * Setup HTTP event listeners
   */
  setupHttpListeners() {
    const http = this.connections.http;
    
    // Listen for network status changes
    window.addEventListener('online', () => {
      this.connectionStates.http = 'online';
      this.emit('connectionStateChange', 'http', 'online');
      this.handleHttpOnline();
    });
    
    window.addEventListener('offline', () => {
      this.connectionStates.http = 'offline';
      this.emit('connectionStateChange', 'http', 'offline');
      this.handleHttpOffline();
    });
    
    // Monitor HTTP requests through dataManager
    const originalRequest = http.request.bind(http);
    http.request = async (...args) => {
      const startTime = Date.now();
      this.metrics.http.totalRequests++;
      this.metrics.http.lastRequestAt = startTime;
      
      try {
        const result = await originalRequest(...args);
        const responseTime = Date.now() - startTime;
        this.handleHttpSuccess(responseTime);
        return result;
      } catch (error) {
        this.handleHttpError(error);
        throw error;
      }
    };
  }

  /**
   * Handle WebSocket connected event
   */
  handleWebSocketConnected() {
    const now = Date.now();
    this.metrics.websocket.totalConnections++;
    this.metrics.websocket.lastConnectedAt = now;
    this.healthChecks.websocket.consecutive_failures = 0;
    
    this.removeAlert('websocket_disconnected');
    this.addAlert('info', 'WebSocket connected successfully', 'websocket');
    
    console.log('WebSocket connection established');
  }

  /**
   * Handle WebSocket disconnected event
   */
  handleWebSocketDisconnected() {
    const now = Date.now();
    this.metrics.websocket.totalDisconnections++;
    this.metrics.websocket.lastDisconnectedAt = now;
    
    if (this.metrics.websocket.lastConnectedAt) {
      const connectionTime = now - this.metrics.websocket.lastConnectedAt;
      this.updateAverageConnectionTime(connectionTime);
      this.metrics.websocket.uptime += connectionTime;
    }
    
    this.addAlert('warning', 'WebSocket connection lost', 'websocket_disconnected');
    
    console.log('WebSocket connection lost');
  }

  /**
   * Handle HTTP online event
   */
  handleHttpOnline() {
    this.healthChecks.http.consecutive_failures = 0;
    this.removeAlert('http_offline');
    this.addAlert('info', 'Internet connection restored', 'http');
    
    console.log('HTTP connection restored');
  }

  /**
   * Handle HTTP offline event
   */
  handleHttpOffline() {
    this.addAlert('error', 'Internet connection lost', 'http_offline');
    
    console.log('HTTP connection lost');
  }

  /**
   * Handle HTTP request success
   */
  handleHttpSuccess(responseTime) {
    this.metrics.http.successfulRequests++;
    this.updateAverageResponseTime(responseTime);
    this.healthChecks.http.consecutive_failures = 0;
    
    // Check for high latency
    if (responseTime > this.alertThresholds.maxLatency) {
      this.addAlert('warning', `High HTTP latency: ${responseTime}ms`, 'http_latency');
    }
  }

  /**
   * Handle HTTP request error
   */
  handleHttpError(error) {
    this.metrics.http.failedRequests++;
    this.healthChecks.http.consecutive_failures++;
    
    if (this.healthChecks.http.consecutive_failures >= this.alertThresholds.maxConsecutiveFailures) {
      this.addAlert('error', `Multiple HTTP failures: ${this.healthChecks.http.consecutive_failures}`, 'http_failures');
    }
    
    console.error('HTTP request failed:', error);
  }

  /**
   * Handle connection error
   */
  handleConnectionError(type, error) {
    this.addAlert('error', `${type} connection error: ${error.message}`, `${type}_error`);
    
    console.error(`${type} connection error:`, error);
  }

  /**
   * Handle latency update
   */
  handleLatencyUpdate(type, latency) {
    if (latency > this.alertThresholds.maxLatency) {
      this.addAlert('warning', `High ${type} latency: ${latency}ms`, `${type}_latency`);
    } else {
      this.removeAlert(`${type}_latency`);
    }
  }

  /**
   * Handle max reconnection attempts reached
   */
  handleMaxReconnectAttempts(type) {
    this.addAlert('error', `${type} max reconnection attempts reached`, `${type}_max_reconnects`);
    
    // Try alternative connection strategy
    this.tryAlternativeStrategy(type);
  }

  /**
   * Try alternative connection strategy
   */
  tryAlternativeStrategy(type) {
    console.log(`Trying alternative strategy for ${type}`);
    
    if (type === 'websocket') {
      // Fall back to HTTP polling
      this.addAlert('info', 'Falling back to HTTP polling', 'websocket_fallback');
      // TODO: Implement HTTP polling fallback
    }
  }

  /**
   * Start connection monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Start health checks for each connection type
    Object.keys(this.healthChecks).forEach(type => {
      this.startHealthCheck(type);
    });
    
    // Start reliability monitoring
    this.startReliabilityMonitoring();
    
    console.log('Connection monitoring started');
  }

  /**
   * Stop connection monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    // Clear all health check intervals
    Object.keys(this.healthChecks).forEach(type => {
      const healthCheck = this.healthChecks[type];
      if (healthCheck.intervalId) {
        clearInterval(healthCheck.intervalId);
        healthCheck.intervalId = null;
      }
    });
    
    if (this.reliabilityIntervalId) {
      clearInterval(this.reliabilityIntervalId);
      this.reliabilityIntervalId = null;
    }
    
    console.log('Connection monitoring stopped');
  }

  /**
   * Start health check for connection type
   */
  startHealthCheck(type) {
    const healthCheck = this.healthChecks[type];
    if (!healthCheck.enabled) return;
    
    healthCheck.intervalId = setInterval(() => {
      this.performHealthCheck(type);
    }, healthCheck.interval);
  }

  /**
   * Perform health check for connection type
   */
  async performHealthCheck(type) {
    const healthCheck = this.healthChecks[type];
    const startTime = Date.now();
    
    try {
      let isHealthy = false;
      
      if (type === 'websocket') {
        isHealthy = this.connections.websocket.getConnectionStatus().isConnected;
      } else if (type === 'http') {
        // Perform a lightweight HTTP request
        isHealthy = await this.performHttpHealthCheck();
      }
      
      const responseTime = Date.now() - startTime;
      healthCheck.lastCheck = Date.now();
      
      if (isHealthy) {
        healthCheck.consecutive_failures = 0;
        this.removeAlert(`${type}_health_check_failed`);
      } else {
        healthCheck.consecutive_failures++;
        
        if (healthCheck.consecutive_failures >= this.alertThresholds.maxConsecutiveFailures) {
          this.addAlert('error', `${type} health check failed ${healthCheck.consecutive_failures} times`, `${type}_health_check_failed`);
        }
      }
      
      this.emit('healthCheckComplete', type, isHealthy, responseTime);
      
    } catch (error) {
      healthCheck.consecutive_failures++;
      this.addAlert('error', `${type} health check error: ${error.message}`, `${type}_health_check_error`);
      
      console.error(`Health check failed for ${type}:`, error);
    }
  }

  /**
   * Perform HTTP health check
   */
  async performHttpHealthCheck() {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(this.healthChecks.http.timeout)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start reliability monitoring
   */
  startReliabilityMonitoring() {
    this.reliabilityIntervalId = setInterval(() => {
      this.calculateReliability();
    }, 60000); // Every minute
  }

  /**
   * Calculate connection reliability
   */
  calculateReliability() {
    // WebSocket reliability
    const wsMetrics = this.metrics.websocket;
    if (wsMetrics.totalConnections > 0) {
      const successRate = (wsMetrics.totalConnections - wsMetrics.totalDisconnections) / wsMetrics.totalConnections;
      wsMetrics.reliability = Math.max(0, successRate * 100);
    }
    
    // HTTP reliability
    const httpMetrics = this.metrics.http;
    if (httpMetrics.totalRequests > 0) {
      const successRate = httpMetrics.successfulRequests / httpMetrics.totalRequests;
      httpMetrics.reliability = Math.max(0, successRate * 100);
    }
    
    // Check reliability thresholds
    Object.keys(this.metrics).forEach(type => {
      const reliability = this.metrics[type].reliability;
      if (reliability < this.alertThresholds.minReliability) {
        this.addAlert('warning', `Low ${type} reliability: ${reliability.toFixed(1)}%`, `${type}_low_reliability`);
      } else {
        this.removeAlert(`${type}_low_reliability`);
      }
    });
    
    this.emit('reliabilityUpdate', this.metrics);
  }

  /**
   * Update average connection time
   */
  updateAverageConnectionTime(connectionTime) {
    const metrics = this.metrics.websocket;
    if (metrics.averageConnectionTime === 0) {
      metrics.averageConnectionTime = connectionTime;
    } else {
      metrics.averageConnectionTime = (metrics.averageConnectionTime * 0.9) + (connectionTime * 0.1);
    }
  }

  /**
   * Update average response time
   */
  updateAverageResponseTime(responseTime) {
    const metrics = this.metrics.http;
    if (metrics.averageResponseTime === 0) {
      metrics.averageResponseTime = responseTime;
    } else {
      metrics.averageResponseTime = (metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
    }
  }

  /**
   * Add alert
   */
  addAlert(type, message, id) {
    // Remove existing alert with same ID
    this.removeAlert(id);
    
    const alert = {
      id,
      type,
      message,
      timestamp: Date.now()
    };
    
    this.alerts.push(alert);
    this.emit('alertAdded', alert);
    
    // Limit alerts to prevent memory issues
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  /**
   * Remove alert
   */
  removeAlert(id) {
    const index = this.alerts.findIndex(alert => alert.id === id);
    if (index !== -1) {
      const removedAlert = this.alerts.splice(index, 1)[0];
      this.emit('alertRemoved', removedAlert);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      states: { ...this.connectionStates },
      metrics: { ...this.metrics },
      alerts: [...this.alerts],
      healthChecks: Object.keys(this.healthChecks).reduce((acc, type) => {
        acc[type] = {
          enabled: this.healthChecks[type].enabled,
          lastCheck: this.healthChecks[type].lastCheck,
          consecutive_failures: this.healthChecks[type].consecutive_failures
        };
        return acc;
      }, {}),
      isMonitoring: this.isMonitoring
    };
  }

  /**
   * Force reconnection for all connections
   */
  reconnectAll() {
    console.log('Forcing reconnection for all connections');
    
    if (this.connections.websocket) {
      this.connections.websocket.reconnect();
    }
    
    // For HTTP, we can clear caches and reset retry counters
    if (this.connections.http) {
      this.connections.http.clearCache();
    }
  }

  /**
   * Update reconnection strategy
   */
  updateReconnectionStrategy(type, strategy) {
    if (this.reconnectionStrategies[type]) {
      this.reconnectionStrategies[type] = { ...this.reconnectionStrategies[type], ...strategy };
      console.log(`Updated reconnection strategy for ${type}:`, this.reconnectionStrategies[type]);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopMonitoring();
    this.removeAllListeners();
    this.alerts = [];
  }
}

// Create singleton instance
const connectionManager = new ConnectionManager();

export default connectionManager;