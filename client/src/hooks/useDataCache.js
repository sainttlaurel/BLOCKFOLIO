/**
 * React Hook for Enhanced Data Caching Integration
 * 
 * Provides easy-to-use React hooks for accessing cached data with
 * automatic updates, loading states, error handling, and intelligent
 * caching strategies including background refresh and predictive caching.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import dataManager from '../services/dataManager';

/**
 * Enhanced hook for managing cached data with intelligent strategies
 */
export const useDataCache = (dataType, options = {}) => {
  const {
    autoUpdate = true,
    updateInterval = null,
    onError = null,
    initialData = null,
    enableBackgroundRefresh = true,
    enablePredictiveCaching = true,
    priority = 'normal'
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheMetrics, setCacheMetrics] = useState(null);
  const [backgroundUpdateAvailable, setBackgroundUpdateAvailable] = useState(false);
  
  const mountedRef = useRef(true);
  const intervalRef = useRef(null);
  const backgroundUpdateRef = useRef(null);

  // Data fetchers for different types
  const dataFetchers = {
    prices: () => dataManager.getPrices(),
    marketData: () => dataManager.getMarketData(),
    portfolio: () => dataManager.getPortfolioData(),
    transactions: (limit, offset) => dataManager.getTransactionHistory(limit, offset)
  };

  /**
   * Fetch data with enhanced error handling and caching strategies
   */
  const fetchData = useCallback(async (forceRefresh = false, isBackgroundUpdate = false) => {
    if (!mountedRef.current) return;
    
    try {
      setError(null);
      if (forceRefresh && !isBackgroundUpdate) {
        setIsRefreshing(true);
      }
      
      const fetcher = dataFetchers[dataType];
      if (!fetcher) {
        throw new Error(`Unknown data type: ${dataType}`);
      }
      
      const result = await fetcher();
      
      if (mountedRef.current) {
        if (isBackgroundUpdate) {
          // Store background update for user to apply
          backgroundUpdateRef.current = result;
          setBackgroundUpdateAvailable(true);
        } else {
          setData(result);
          setLastUpdate(new Date());
          setLoading(false);
          setBackgroundUpdateAvailable(false);
        }
      }
      
    } catch (err) {
      console.error(`Failed to fetch ${dataType}:`, err);
      
      if (mountedRef.current) {
        setError(err);
        if (!isBackgroundUpdate) {
          setLoading(false);
        }
        
        if (onError) {
          onError(err);
        }
      }
    } finally {
      if (mountedRef.current && !isBackgroundUpdate) {
        setIsRefreshing(false);
      }
    }
  }, [dataType, onError]);

  /**
   * Apply background update to current data
   */
  const applyBackgroundUpdate = useCallback(() => {
    if (backgroundUpdateRef.current && mountedRef.current) {
      setData(backgroundUpdateRef.current);
      setLastUpdate(new Date());
      setBackgroundUpdateAvailable(false);
      backgroundUpdateRef.current = null;
    }
  }, []);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  /**
   * Listen for background data updates
   */
  useEffect(() => {
    if (!enableBackgroundRefresh) return;
    
    const handleBackgroundUpdate = (event) => {
      const { type, data: updatedData } = event.detail;
      
      // Map event types to our data types
      const typeMapping = {
        'prices': 'prices',
        'marketData': 'marketData',
        'portfolio': 'portfolio'
      };
      
      if (typeMapping[type] === dataType && mountedRef.current) {
        backgroundUpdateRef.current = updatedData;
        setBackgroundUpdateAvailable(true);
      }
    };
    
    window.addEventListener('backgroundDataUpdate', handleBackgroundUpdate);
    
    return () => {
      window.removeEventListener('backgroundDataUpdate', handleBackgroundUpdate);
    };
  }, [dataType, enableBackgroundRefresh]);

  /**
   * Listen for cache performance updates
   */
  useEffect(() => {
    const handleCachePerformanceUpdate = (event) => {
      if (mountedRef.current) {
        setCacheMetrics(event.detail.metrics);
      }
    };
    
    window.addEventListener('cachePerformanceUpdate', handleCachePerformanceUpdate);
    
    return () => {
      window.removeEventListener('cachePerformanceUpdate', handleCachePerformanceUpdate);
    };
  }, []);

  /**
   * Setup automatic updates with intelligent intervals
   */
  useEffect(() => {
    // Initial fetch
    fetchData();
    
    // Setup auto-update if enabled
    if (autoUpdate) {
      const interval = updateInterval || getIntelligentUpdateInterval(dataType, priority);
      
      intervalRef.current = setInterval(() => {
        // Use background refresh for non-critical updates
        if (enableBackgroundRefresh && priority !== 'high') {
          fetchData(false, true);
        } else {
          fetchData();
        }
      }, interval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, autoUpdate, updateInterval, dataType, priority, enableBackgroundRefresh]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdate,
    isRefreshing,
    refresh,
    networkStatus: dataManager.getNetworkStatus(),
    cacheMetrics,
    backgroundUpdateAvailable,
    applyBackgroundUpdate,
    cacheHealth: cacheMetrics ? {
      hitRate: cacheMetrics.hitRate,
      memoryUsage: cacheMetrics.memoryUsageMB,
      efficiency: cacheMetrics.cacheEfficiencyScore
    } : null
  };
};

/**
 * Enhanced hook specifically for price data with high-frequency updates
 */
export const usePrices = (options = {}) => {
  return useDataCache('prices', {
    updateInterval: 5000, // 5 seconds
    priority: 'high',
    enableBackgroundRefresh: true,
    enablePredictiveCaching: true,
    ...options
  });
};

/**
 * Enhanced hook specifically for market data with medium-frequency updates
 */
export const useMarketData = (options = {}) => {
  return useDataCache('marketData', {
    updateInterval: 10000, // 10 seconds
    priority: 'medium',
    enableBackgroundRefresh: true,
    enablePredictiveCaching: true,
    ...options
  });
};

/**
 * Enhanced hook specifically for portfolio data with intelligent refresh
 */
export const usePortfolio = (options = {}) => {
  return useDataCache('portfolio', {
    updateInterval: 15000, // 15 seconds
    priority: 'high',
    enableBackgroundRefresh: true,
    enablePredictiveCaching: true,
    ...options
  });
};

/**
 * Enhanced hook for cache performance monitoring with real-time metrics
 */
export const useCacheMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  
  const updateMetrics = useCallback(() => {
    const currentMetrics = dataManager.getCacheMetrics();
    const currentAnalytics = dataManager.getCacheAnalytics ? dataManager.getCacheAnalytics() : null;
    const health = dataManager.getCacheHealth ? dataManager.getCacheHealth() : null;
    
    setMetrics(currentMetrics);
    setAnalytics(currentAnalytics);
    setHealthStatus(health);
  }, []);

  useEffect(() => {
    updateMetrics();
    
    // Update metrics every 10 seconds
    const interval = setInterval(updateMetrics, 10000);
    
    // Listen for cache performance updates
    const handleCachePerformanceUpdate = (event) => {
      setMetrics(event.detail.metrics);
      setAnalytics(event.detail.analytics);
    };
    
    window.addEventListener('cachePerformanceUpdate', handleCachePerformanceUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('cachePerformanceUpdate', handleCachePerformanceUpdate);
    };
  }, [updateMetrics]);

  const clearCache = useCallback(() => {
    dataManager.clearCache();
    updateMetrics();
  }, [updateMetrics]);

  const optimizeCache = useCallback(() => {
    if (dataManager.optimizeCacheConfiguration) {
      dataManager.optimizeCacheConfiguration();
      updateMetrics();
    }
  }, [updateMetrics]);

  const warmCache = useCallback(async (criticalKeys = []) => {
    if (dataManager.warmCriticalData) {
      await dataManager.warmCriticalData(criticalKeys);
      updateMetrics();
    }
  }, [updateMetrics]);

  return {
    metrics,
    analytics,
    healthStatus,
    clearCache,
    optimizeCache,
    warmCache,
    refresh: updateMetrics
  };
};

/**
 * Hook for monitoring cache health and performance
 */
export const useCacheHealth = () => {
  const [health, setHealth] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  
  useEffect(() => {
    const updateHealth = () => {
      if (dataManager.getCacheHealth) {
        const healthStatus = dataManager.getCacheHealth();
        setHealth(healthStatus);
        setRecommendations(healthStatus.recommendations || []);
      }
    };
    
    updateHealth();
    
    // Update health status every 30 seconds
    const interval = setInterval(updateHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    health,
    recommendations,
    isHealthy: health?.status === 'healthy',
    hasWarnings: health?.status === 'warning',
    isCritical: health?.status === 'critical'
  };
};

/**
 * Get intelligent update interval based on data type and priority
 */
function getIntelligentUpdateInterval(dataType, priority = 'normal') {
  const baseIntervals = {
    prices: 5000,      // 5 seconds
    marketData: 10000, // 10 seconds
    portfolio: 15000,  // 15 seconds
    transactions: 30000 // 30 seconds
  };
  
  const priorityMultipliers = {
    high: 0.8,    // 20% faster updates
    normal: 1.0,  // Standard intervals
    low: 1.5      // 50% slower updates
  };
  
  const baseInterval = baseIntervals[dataType] || 30000;
  const multiplier = priorityMultipliers[priority] || 1.0;
  
  return Math.floor(baseInterval * multiplier);
}

/**
 * Hook for transaction history with pagination
 */
export const useTransactions = (limit = 50, offset = 0, options = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  const fetchTransactions = useCallback(async (reset = false) => {
    try {
      setError(null);
      if (reset) {
        setLoading(true);
      }
      
      const result = await dataManager.getTransactionHistory(limit, reset ? 0 : offset);
      
      if (reset) {
        setTransactions(result);
      } else {
        setTransactions(prev => [...prev, ...result]);
      }
      
      setHasMore(result.length === limit);
      setLoading(false);
      
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError(err);
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchTransactions(true);
  }, [fetchTransactions]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchTransactions(false);
    }
  }, [fetchTransactions, loading, hasMore]);

  const refresh = useCallback(() => {
    fetchTransactions(true);
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};

/**
 * Hook for executing trades with cache invalidation
 */
export const useTrade = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastTrade, setLastTrade] = useState(null);

  const executeTrade = useCallback(async (type, coinSymbol, amount) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await dataManager.executeTrade(type, coinSymbol, amount);
      
      setLastTrade({
        type,
        coinSymbol,
        amount,
        result,
        timestamp: new Date()
      });
      
      return result;
      
    } catch (err) {
      console.error('Trade execution failed:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    executeTrade,
    loading,
    error,
    lastTrade
  };
};

/**
 * Hook for network status monitoring
 */
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState(dataManager.getNetworkStatus());
  
  useEffect(() => {
    const updateStatus = () => {
      setNetworkStatus(dataManager.getNetworkStatus());
    };
    
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);
  
  return networkStatus;
};