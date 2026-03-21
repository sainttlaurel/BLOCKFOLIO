/**
 * Connection status monitoring utility
 * Tracks network connectivity and data freshness
 */

import logger from './logger';

class ConnectionMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.lastDataUpdate = null;
    this.connectionQuality = 'good';
    this.listeners = [];
    this.pingInterval = null;
    this.dataFreshnessThreshold = 10000; // 10 seconds
  }

  /**
   * Initialize connection monitoring
   */
  init() {
    this.setupEventListeners();
    this.startPingMonitoring();
    logger.info('Connection monitoring initialized', {
      initialStatus: this.isOnline ? 'online' : 'offline'
    });
  }

  /**
   * Setup online/offline event listeners
   */
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Monitor connection quality using Network Information API
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      connection.addEventListener('change', () => {
        this.updateConnectionQuality();
      });
      
      this.updateConnectionQuality();
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    this.isOnline = true;
    logger.info('Connection restored');
    this.notifyListeners('online');
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    logger.warn('Connection lost');
    this.notifyListeners('offline');
  }

  /**
   * Update connection quality based on Network Information API
   */
  updateConnectionQuality() {
    if (!('connection' in navigator)) return;

    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;

    // Map effective type to quality
    const qualityMap = {
      'slow-2g': 'poor',
      '2g': 'poor',
      '3g': 'fair',
      '4g': 'good'
    };

    const newQuality = qualityMap[effectiveType] || 'good';
    
    if (newQuality !== this.connectionQuality) {
      this.connectionQuality = newQuality;
      logger.info('Connection quality changed', {
        quality: newQuality,
        effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });
      this.notifyListeners('quality-change', { quality: newQuality });
    }
  }

  /**
   * Start periodic ping monitoring
   */
  startPingMonitoring() {
    // Ping server every 30 seconds to verify connection
    this.pingInterval = setInterval(() => {
      this.pingServer();
    }, 30000);
  }

  /**
   * Ping server to check connectivity
   */
  async pingServer() {
    try {
      const startTime = performance.now();
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache'
      });
      const duration = performance.now() - startTime;

      if (response.ok) {
        logger.debug('Server ping successful', { duration: `${duration.toFixed(2)}ms` });
        
        // Update connection quality based on response time
        if (duration > 1000) {
          this.connectionQuality = 'poor';
        } else if (duration > 500) {
          this.connectionQuality = 'fair';
        } else {
          this.connectionQuality = 'good';
        }
      } else {
        logger.warn('Server ping failed', { status: response.status });
      }
    } catch (error) {
      logger.error('Server ping error', { error: error.message });
      this.handleOffline();
    }
  }

  /**
   * Update last data update timestamp
   */
  updateDataTimestamp() {
    this.lastDataUpdate = Date.now();
  }

  /**
   * Check if data is fresh
   */
  isDataFresh() {
    if (!this.lastDataUpdate) return false;
    return (Date.now() - this.lastDataUpdate) < this.dataFreshnessThreshold;
  }

  /**
   * Get data age in seconds
   */
  getDataAge() {
    if (!this.lastDataUpdate) return null;
    return Math.floor((Date.now() - this.lastDataUpdate) / 1000);
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      quality: this.connectionQuality,
      dataFresh: this.isDataFresh(),
      dataAge: this.getDataAge(),
      lastUpdate: this.lastDataUpdate ? new Date(this.lastDataUpdate).toISOString() : null
    };
  }

  /**
   * Subscribe to connection events
   */
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data = {}) {
    this.listeners.forEach(callback => {
      try {
        callback(event, { ...this.getStatus(), ...data });
      } catch (error) {
        logger.error('Connection listener error', { error: error.message });
      }
    });
  }

  /**
   * Get connection info for display
   */
  getConnectionInfo() {
    const status = this.getStatus();
    
    let statusText = 'Connected';
    let statusColor = 'green';
    
    if (!status.isOnline) {
      statusText = 'Offline';
      statusColor = 'red';
    } else if (status.quality === 'poor') {
      statusText = 'Poor Connection';
      statusColor = 'orange';
    } else if (status.quality === 'fair') {
      statusText = 'Fair Connection';
      statusColor = 'yellow';
    }
    
    return {
      statusText,
      statusColor,
      dataAge: status.dataAge,
      dataFresh: status.dataFresh
    };
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    logger.info('Connection monitoring stopped');
  }
}

// Create singleton instance
const connectionMonitor = new ConnectionMonitor();

export default connectionMonitor;
