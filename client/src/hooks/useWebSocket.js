/**
 * React Hook for WebSocket Integration
 * 
 * Provides easy-to-use React hooks for WebSocket connections with
 * automatic subscription management, connection status monitoring,
 * and real-time data updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocketService';

/**
 * Main WebSocket hook for connection management
 */
export const useWebSocket = (options = {}) => {
  const {
    autoConnect = true,
    enableBatching = true,
    batchSize = 10,
    batchTimeout = 100
  } = options;

  const [connectionStatus, setConnectionStatus] = useState(websocketService.getConnectionStatus());
  const [latency, setLatency] = useState(null);
  const [metrics, setMetrics] = useState(websocketService.getMetrics());
  const mountedRef = useRef(true);

  // Update connection status
  const updateConnectionStatus = useCallback(() => {
    if (mountedRef.current) {
      setConnectionStatus(websocketService.getConnectionStatus());
      setMetrics(websocketService.getMetrics());
    }
  }, []);

  // Handle connection state changes
  useEffect(() => {
    const handleConnectionStateChange = (state) => {
      if (mountedRef.current) {
        updateConnectionStatus();
      }
    };

    const handleLatencyUpdate = (newLatency) => {
      if (mountedRef.current) {
        setLatency(newLatency);
      }
    };

    websocketService.on('connectionStateChange', handleConnectionStateChange);
    websocketService.on('latencyUpdate', handleLatencyUpdate);
    websocketService.on('connected', updateConnectionStatus);
    websocketService.on('disconnected', updateConnectionStatus);
    websocketService.on('error', updateConnectionStatus);

    return () => {
      websocketService.off('connectionStateChange', handleConnectionStateChange);
      websocketService.off('latencyUpdate', handleLatencyUpdate);
      websocketService.off('connected', updateConnectionStatus);
      websocketService.off('disconnected', updateConnectionStatus);
      websocketService.off('error', updateConnectionStatus);
    };
  }, [updateConnectionStatus]);

  // Configure batching
  useEffect(() => {
    websocketService.setBatching(enableBatching, batchSize, batchTimeout);
  }, [enableBatching, batchSize, batchTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const connect = useCallback(() => {
    websocketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    websocketService.reconnect();
  }, []);

  return {
    connectionStatus,
    latency,
    metrics,
    connect,
    disconnect,
    reconnect,
    isConnected: connectionStatus.isConnected,
    isConnecting: connectionStatus.state === 'connecting'
  };
};

/**
 * Hook for real-time price updates
 */
export const usePriceUpdates = (symbols = [], options = {}) => {
  const {
    enableBatching = true,
    onUpdate = null,
    onBatchUpdate = null
  } = options;

  const [prices, setPrices] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const mountedRef = useRef(true);
  const subscriptionRef = useRef(false);

  // Handle individual price updates
  const handlePriceUpdate = useCallback((data) => {
    if (!mountedRef.current) return;
    
    setPrices(prev => ({
      ...prev,
      [data.symbol]: {
        ...data,
        timestamp: Date.now()
      }
    }));
    
    setLastUpdate(Date.now());
    
    if (onUpdate) {
      onUpdate(data);
    }
  }, [onUpdate]);

  // Handle batch price updates
  const handleBatchPriceUpdate = useCallback((updates) => {
    if (!mountedRef.current) return;
    
    const newPrices = {};
    updates.forEach(update => {
      newPrices[update.symbol] = {
        ...update,
        timestamp: Date.now()
      };
    });
    
    setPrices(prev => ({ ...prev, ...newPrices }));
    setLastUpdate(Date.now());
    
    if (onBatchUpdate) {
      onBatchUpdate(updates);
    }
  }, [onBatchUpdate]);

  // Subscribe to price updates
  useEffect(() => {
    if (symbols.length > 0 && !subscriptionRef.current) {
      websocketService.subscribe('prices', symbols);
      subscriptionRef.current = true;
    }

    const eventName = enableBatching ? 'batchPriceUpdate' : 'priceUpdate';
    const handler = enableBatching ? handleBatchPriceUpdate : handlePriceUpdate;
    
    websocketService.on(eventName, handler);

    return () => {
      websocketService.off(eventName, handler);
      if (subscriptionRef.current && symbols.length > 0) {
        websocketService.unsubscribe('prices', symbols);
        subscriptionRef.current = false;
      }
    };
  }, [symbols, enableBatching, handlePriceUpdate, handleBatchPriceUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    prices,
    lastUpdate,
    getPriceForSymbol: (symbol) => prices[symbol] || null
  };
};

/**
 * Hook for real-time market data updates
 */
export const useMarketUpdates = (options = {}) => {
  const {
    enableBatching = true,
    onUpdate = null,
    onBatchUpdate = null
  } = options;

  const [marketData, setMarketData] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const mountedRef = useRef(true);
  const subscriptionRef = useRef(false);

  // Handle individual market updates
  const handleMarketUpdate = useCallback((data) => {
    if (!mountedRef.current) return;
    
    setMarketData(prev => ({
      ...prev,
      ...data,
      timestamp: Date.now()
    }));
    
    setLastUpdate(Date.now());
    
    if (onUpdate) {
      onUpdate(data);
    }
  }, [onUpdate]);

  // Handle batch market updates
  const handleBatchMarketUpdate = useCallback((updates) => {
    if (!mountedRef.current) return;
    
    const mergedData = updates.reduce((acc, update) => ({ ...acc, ...update }), {});
    
    setMarketData(prev => ({
      ...prev,
      ...mergedData,
      timestamp: Date.now()
    }));
    
    setLastUpdate(Date.now());
    
    if (onBatchUpdate) {
      onBatchUpdate(updates);
    }
  }, [onBatchUpdate]);

  // Subscribe to market updates
  useEffect(() => {
    if (!subscriptionRef.current) {
      websocketService.subscribe('market');
      subscriptionRef.current = true;
    }

    const eventName = enableBatching ? 'batchMarketUpdate' : 'marketUpdate';
    const handler = enableBatching ? handleBatchMarketUpdate : handleMarketUpdate;
    
    websocketService.on(eventName, handler);

    return () => {
      websocketService.off(eventName, handler);
      if (subscriptionRef.current) {
        websocketService.unsubscribe('market');
        subscriptionRef.current = false;
      }
    };
  }, [enableBatching, handleMarketUpdate, handleBatchMarketUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    marketData,
    lastUpdate
  };
};

/**
 * Hook for real-time portfolio updates
 */
export const usePortfolioUpdates = (options = {}) => {
  const { onUpdate = null } = options;

  const [portfolioData, setPortfolioData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const mountedRef = useRef(true);
  const subscriptionRef = useRef(false);

  // Handle portfolio updates
  const handlePortfolioUpdate = useCallback((data) => {
    if (!mountedRef.current) return;
    
    setPortfolioData(data);
    setLastUpdate(Date.now());
    
    if (onUpdate) {
      onUpdate(data);
    }
  }, [onUpdate]);

  // Subscribe to portfolio updates
  useEffect(() => {
    if (!subscriptionRef.current) {
      websocketService.subscribe('portfolio');
      subscriptionRef.current = true;
    }

    websocketService.on('portfolioUpdate', handlePortfolioUpdate);

    return () => {
      websocketService.off('portfolioUpdate', handlePortfolioUpdate);
      if (subscriptionRef.current) {
        websocketService.unsubscribe('portfolio');
        subscriptionRef.current = false;
      }
    };
  }, [handlePortfolioUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    portfolioData,
    lastUpdate
  };
};

/**
 * Hook for WebSocket connection monitoring
 */
export const useConnectionMonitor = () => {
  const { connectionStatus, latency, metrics } = useWebSocket();
  const [connectionHistory, setConnectionHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Track connection history
  useEffect(() => {
    const newEntry = {
      timestamp: Date.now(),
      state: connectionStatus.state,
      latency: latency,
      reconnectAttempts: connectionStatus.reconnectAttempts
    };

    setConnectionHistory(prev => [...prev.slice(-99), newEntry]); // Keep last 100 entries
  }, [connectionStatus.state, latency, connectionStatus.reconnectAttempts]);

  // Generate alerts based on connection quality
  useEffect(() => {
    const newAlerts = [];

    if (connectionStatus.state === 'disconnected') {
      newAlerts.push({
        type: 'error',
        message: 'WebSocket connection lost',
        timestamp: Date.now()
      });
    }

    if (latency && latency > 1000) {
      newAlerts.push({
        type: 'warning',
        message: `High latency detected: ${latency}ms`,
        timestamp: Date.now()
      });
    }

    if (connectionStatus.reconnectAttempts > 3) {
      newAlerts.push({
        type: 'warning',
        message: `Multiple reconnection attempts: ${connectionStatus.reconnectAttempts}`,
        timestamp: Date.now()
      });
    }

    setAlerts(newAlerts);
  }, [connectionStatus, latency]);

  return {
    connectionStatus,
    latency,
    metrics,
    connectionHistory,
    alerts,
    connectionQuality: latency ? (latency < 200 ? 'excellent' : latency < 500 ? 'good' : latency < 1000 ? 'fair' : 'poor') : 'unknown'
  };
};

/**
 * Hook for managing WebSocket subscriptions
 */
export const useWebSocketSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);

  const subscribe = useCallback((type, symbols = []) => {
    websocketService.subscribe(type, symbols);
    setSubscriptions(prev => [...prev, { type, symbols, timestamp: Date.now() }]);
  }, []);

  const unsubscribe = useCallback((type, symbols = []) => {
    websocketService.unsubscribe(type, symbols);
    setSubscriptions(prev => prev.filter(sub => 
      !(sub.type === type && JSON.stringify(sub.symbols) === JSON.stringify(symbols))
    ));
  }, []);

  const unsubscribeAll = useCallback(() => {
    subscriptions.forEach(sub => {
      websocketService.unsubscribe(sub.type, sub.symbols);
    });
    setSubscriptions([]);
  }, [subscriptions]);

  return {
    subscriptions,
    subscribe,
    unsubscribe,
    unsubscribeAll
  };
};

export default {
  useWebSocket,
  usePriceUpdates,
  useMarketUpdates,
  usePortfolioUpdates,
  useConnectionMonitor,
  useWebSocketSubscriptions
};