/**
 * WebSocket Service for Real-time Data Updates
 * 
 * Provides WebSocket connections for real-time price updates, market data,
 * and portfolio changes with automatic reconnection, connection monitoring,
 * and efficient data synchronization.
 */

import { EventEmitter } from 'events';

class WebSocketService extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.url = process.env.REACT_APP_WS_URL || 'ws://localhost:5001/ws';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    this.isConnecting = false;
    this.isManuallyDisconnected = false;
    this.subscriptions = new Set();
    this.messageQueue = [];
    this.connectionState = 'disconnected';
    this.lastPingTime = null;
    this.latency = null;
    
    // Connection metrics
    this.metrics = {
      totalConnections: 0,
      totalReconnections: 0,
      totalMessages: 0,
      totalErrors: 0,
      averageLatency: 0,
      connectionUptime: 0,
      lastConnectedAt: null,
      lastDisconnectedAt: null
    };
    
    // Data compression settings
    this.compressionEnabled = true;
    this.batchingEnabled = true;
    this.batchSize = 10;
    this.batchTimeout = 100; // ms
    this.pendingBatch = [];
    this.batchTimer = null;
    
    // Initialize connection
    this.connect();
  }

  /**
   * Establish WebSocket connection
   */
  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    this.isManuallyDisconnected = false;
    this.connectionState = 'connecting';
    this.emit('connectionStateChange', 'connecting');

    try {
      console.log(`Connecting to WebSocket: ${this.url}`);
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleConnectionFailure();
    }
  }

  /**
   * Handle WebSocket connection open
   */
  handleOpen() {
    console.log('WebSocket connected successfully');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.connectionState = 'connected';
    this.metrics.totalConnections++;
    this.metrics.lastConnectedAt = Date.now();
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Process queued messages
    this.processMessageQueue();
    
    // Resubscribe to previous subscriptions
    this.resubscribe();
    
    this.emit('connectionStateChange', 'connected');
    this.emit('connected');
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(event) {
    try {
      this.metrics.totalMessages++;
      
      let data;
      if (this.compressionEnabled && event.data instanceof Blob) {
        // Handle compressed data (if implemented on server)
        this.handleCompressedMessage(event.data);
        return;
      } else {
        data = JSON.parse(event.data);
      }
      
      // Handle different message types
      switch (data.type) {
        case 'pong':
          this.handlePong(data);
          break;
        case 'price_update':
          this.handlePriceUpdate(data);
          break;
        case 'market_update':
          this.handleMarketUpdate(data);
          break;
        case 'portfolio_update':
          this.handlePortfolioUpdate(data);
          break;
        case 'batch_update':
          this.handleBatchUpdate(data);
          break;
        case 'error':
          this.handleServerError(data);
          break;
        case 'subscription_confirmed':
          this.handleSubscriptionConfirmed(data);
          break;
        default:
          console.warn('Unknown message type:', data.type);
      }
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.metrics.totalErrors++;
    }
  }

  /**
   * Handle WebSocket connection close
   */
  handleClose(event) {
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.connectionState = 'disconnected';
    this.metrics.lastDisconnectedAt = Date.now();
    
    if (this.metrics.lastConnectedAt) {
      this.metrics.connectionUptime += Date.now() - this.metrics.lastConnectedAt;
    }
    
    this.stopHeartbeat();
    this.emit('connectionStateChange', 'disconnected');
    this.emit('disconnected', { code: event.code, reason: event.reason });
    
    // Attempt reconnection if not manually disconnected
    if (!this.isManuallyDisconnected && event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket errors
   */
  handleError(error) {
    console.error('WebSocket error:', error);
    this.metrics.totalErrors++;
    this.emit('error', error);
    this.handleConnectionFailure();
  }

  /**
   * Handle connection failure and schedule reconnect
   */
  handleConnectionFailure() {
    this.isConnecting = false;
    this.connectionState = 'disconnected';
    this.emit('connectionStateChange', 'disconnected');
    
    if (!this.isManuallyDisconnected) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    this.metrics.totalReconnections++;
    
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    this.emit('reconnectScheduled', { attempt: this.reconnectAttempts, delay });
    
    setTimeout(() => {
      if (!this.isManuallyDisconnected) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        this.send({ type: 'ping', timestamp: this.lastPingTime });
        
        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout - connection may be stale');
          this.ws.close(1000, 'Heartbeat timeout');
        }, 5000);
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop heartbeat mechanism
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Handle pong response
   */
  handlePong(data) {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
    
    if (this.lastPingTime && data.timestamp) {
      this.latency = Date.now() - data.timestamp;
      this.updateAverageLatency(this.latency);
      this.emit('latencyUpdate', this.latency);
    }
  }

  /**
   * Update average latency calculation
   */
  updateAverageLatency(newLatency) {
    if (this.metrics.averageLatency === 0) {
      this.metrics.averageLatency = newLatency;
    } else {
      // Exponential moving average
      this.metrics.averageLatency = (this.metrics.averageLatency * 0.9) + (newLatency * 0.1);
    }
  }

  /**
   * Handle price updates
   */
  handlePriceUpdate(data) {
    if (this.batchingEnabled) {
      this.addToBatch('price_update', data);
    } else {
      this.emit('priceUpdate', data.payload);
    }
  }

  /**
   * Handle market updates
   */
  handleMarketUpdate(data) {
    if (this.batchingEnabled) {
      this.addToBatch('market_update', data);
    } else {
      this.emit('marketUpdate', data.payload);
    }
  }

  /**
   * Handle portfolio updates
   */
  handlePortfolioUpdate(data) {
    // Portfolio updates are always immediate (not batched)
    this.emit('portfolioUpdate', data.payload);
  }

  /**
   * Handle batch updates
   */
  handleBatchUpdate(data) {
    const { updates } = data.payload;
    
    updates.forEach(update => {
      switch (update.type) {
        case 'price_update':
          this.emit('priceUpdate', update.data);
          break;
        case 'market_update':
          this.emit('marketUpdate', update.data);
          break;
        default:
          console.warn('Unknown batch update type:', update.type);
      }
    });
  }

  /**
   * Handle server errors
   */
  handleServerError(data) {
    console.error('Server error:', data.payload);
    this.emit('serverError', data.payload);
  }

  /**
   * Handle subscription confirmation
   */
  handleSubscriptionConfirmed(data) {
    console.log('Subscription confirmed:', data.payload);
    this.emit('subscriptionConfirmed', data.payload);
  }

  /**
   * Handle compressed messages (placeholder for future implementation)
   */
  handleCompressedMessage(blob) {
    // TODO: Implement decompression if server supports it
    console.log('Received compressed message:', blob.size, 'bytes');
  }

  /**
   * Add update to batch
   */
  addToBatch(type, data) {
    this.pendingBatch.push({ type, data: data.payload, timestamp: Date.now() });
    
    if (this.pendingBatch.length >= this.batchSize) {
      this.processBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchTimeout);
    }
  }

  /**
   * Process pending batch
   */
  processBatch() {
    if (this.pendingBatch.length === 0) return;
    
    const batch = [...this.pendingBatch];
    this.pendingBatch = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Group by type for efficient processing
    const groupedUpdates = batch.reduce((acc, update) => {
      if (!acc[update.type]) acc[update.type] = [];
      acc[update.type].push(update.data);
      return acc;
    }, {});
    
    // Emit grouped updates
    Object.entries(groupedUpdates).forEach(([type, updates]) => {
      switch (type) {
        case 'price_update':
          this.emit('batchPriceUpdate', updates);
          break;
        case 'market_update':
          this.emit('batchMarketUpdate', updates);
          break;
      }
    });
  }

  /**
   * Send message to server
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later sending
      this.messageQueue.push(message);
    }
  }

  /**
   * Process queued messages
   */
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  /**
   * Subscribe to data updates
   */
  subscribe(type, symbols = []) {
    const subscription = { type, symbols, timestamp: Date.now() };
    this.subscriptions.add(subscription);
    
    this.send({
      type: 'subscribe',
      payload: subscription
    });
    
    console.log(`Subscribed to ${type}:`, symbols);
  }

  /**
   * Unsubscribe from data updates
   */
  unsubscribe(type, symbols = []) {
    // Remove from local subscriptions
    this.subscriptions.forEach(sub => {
      if (sub.type === type && JSON.stringify(sub.symbols) === JSON.stringify(symbols)) {
        this.subscriptions.delete(sub);
      }
    });
    
    this.send({
      type: 'unsubscribe',
      payload: { type, symbols }
    });
    
    console.log(`Unsubscribed from ${type}:`, symbols);
  }

  /**
   * Resubscribe to all previous subscriptions
   */
  resubscribe() {
    this.subscriptions.forEach(subscription => {
      this.send({
        type: 'subscribe',
        payload: subscription
      });
    });
    
    console.log('Resubscribed to', this.subscriptions.size, 'subscriptions');
  }

  /**
   * Manually disconnect
   */
  disconnect() {
    this.isManuallyDisconnected = true;
    this.stopHeartbeat();
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
    }
  }

  /**
   * Manually reconnect
   */
  reconnect() {
    this.disconnect();
    setTimeout(() => {
      this.reconnectAttempts = 0;
      this.connect();
    }, 1000);
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      state: this.connectionState,
      isConnected: this.ws && this.ws.readyState === WebSocket.OPEN,
      reconnectAttempts: this.reconnectAttempts,
      latency: this.latency,
      subscriptions: Array.from(this.subscriptions),
      metrics: this.getMetrics()
    };
  }

  /**
   * Get connection metrics
   */
  getMetrics() {
    const currentUptime = this.metrics.lastConnectedAt && this.connectionState === 'connected'
      ? Date.now() - this.metrics.lastConnectedAt
      : 0;
    
    return {
      ...this.metrics,
      currentUptime,
      totalUptime: this.metrics.connectionUptime + currentUptime,
      successRate: this.metrics.totalConnections > 0 
        ? ((this.metrics.totalConnections - this.metrics.totalErrors) / this.metrics.totalConnections * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Enable/disable data compression
   */
  setCompression(enabled) {
    this.compressionEnabled = enabled;
    console.log('Data compression', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Enable/disable message batching
   */
  setBatching(enabled, batchSize = 10, batchTimeout = 100) {
    this.batchingEnabled = enabled;
    this.batchSize = batchSize;
    this.batchTimeout = batchTimeout;
    
    console.log('Message batching', enabled ? 'enabled' : 'disabled', 
      enabled ? `(size: ${batchSize}, timeout: ${batchTimeout}ms)` : '');
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.disconnect();
    this.removeAllListeners();
    this.subscriptions.clear();
    this.messageQueue = [];
    this.pendingBatch = [];
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;