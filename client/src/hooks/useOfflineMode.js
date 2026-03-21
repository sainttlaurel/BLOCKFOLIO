/**
 * React Hook for Offline Mode Integration
 * 
 * Provides comprehensive offline mode functionality with cached data fallback,
 * feature availability checking, and offline state management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import offlineService from '../services/offlineService';
import dataManager from '../services/dataManager';

/**
 * Main hook for offline mode functionality
 */
export const useOfflineMode = () => {
  const [offlineStatus, setOfflineStatus] = useState(offlineService.getOfflineStatus());
  const [notifications, setNotifications] = useState([]);
  const listenerRef = useRef(null);

  // Handle offline service events
  const handleOfflineEvent = useCallback((event, data) => {
    switch (event) {
      case 'offline_mode_activated':
      case 'online_mode_restored':
      case 'network_status_updated':
      case 'sync_completed':
      case 'sync_failed':
        setOfflineStatus(offlineService.getOfflineStatus());
        break;
        
      case 'show_notification':
        setNotifications(prev => [...prev, { ...data, id: Date.now() }]);
        break;
        
      case 'data_age_updated':
        setOfflineStatus(prev => ({
          ...prev,
          dataAge: data.dataAge
        }));
        break;
    }
  }, []);

  // Setup event listener
  useEffect(() => {
    listenerRef.current = handleOfflineEvent;
    offlineService.addListener(handleOfflineEvent);
    
    return () => {
      if (listenerRef.current) {
        offlineService.removeListener(listenerRef.current);
      }
    };
  }, [handleOfflineEvent]);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Check if feature is available
  const isFeatureAvailable = useCallback((feature) => {
    return offlineService.isFeatureAvailable(feature);
  }, []);

  // Queue action for offline execution
  const queueAction = useCallback((type, data) => {
    return offlineService.queuePendingAction(type, data);
  }, []);

  // Force retry connection
  const retryConnection = useCallback(async () => {
    return await offlineService.forceRetryConnection();
  }, []);

  return {
    ...offlineStatus,
    notifications,
    dismissNotification,
    isFeatureAvailable,
    queueAction,
    retryConnection
  };
};

/**
 * Hook for accessing cached data in offline mode
 */
export const useOfflineData = (dataType) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOffline } = useOfflineMode();

  useEffect(() => {
    if (!isOffline) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const offlineData = offlineService.getOfflineData(dataType);
      setData(offlineData);
      
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dataType, isOffline]);

  return { data, loading, error };
};

/**
 * Hook for offline-aware data fetching
 */
export const useOfflineAwareData = (dataType, fetcher, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const { isOffline } = useOfflineMode();
  
  const {
    fallbackToCached = true,
    maxCacheAge = 300000, // 5 minutes default
    onCacheFallback = null
  } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsFromCache(false);
      
      if (isOffline) {
        if (fallbackToCached) {
          try {
            const cachedData = offlineService.getOfflineData(dataType);
            
            if (cachedData.age <= maxCacheAge || !cachedData.isStale) {
              setData(cachedData);
              setIsFromCache(true);
              
              if (onCacheFallback) {
                onCacheFallback(cachedData);
              }
              
              return;
            }
          } catch (cacheError) {
            console.warn(`No suitable cached data for ${dataType}:`, cacheError);
          }
        }
        
        throw new Error(`No fresh data available offline for ${dataType}`);
      }
      
      // Online mode - fetch fresh data
      const freshData = await fetcher();
      setData(freshData);
      
    } catch (err) {
      setError(err);
      
      // Try cache fallback even if online fetch fails
      if (fallbackToCached) {
        try {
          const cachedData = offlineService.getOfflineData(dataType);
          setData(cachedData);
          setIsFromCache(true);
          
          if (onCacheFallback) {
            onCacheFallback(cachedData);
          }
        } catch (cacheError) {
          // No cache fallback available
        }
      }
    } finally {
      setLoading(false);
    }
  }, [dataType, fetcher, isOffline, fallbackToCached, maxCacheAge, onCacheFallback]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    isFromCache,
    refresh
  };
};

/**
 * Hook for managing offline trading actions
 */
export const useOfflineTrading = () => {
  const { isOffline, queueAction } = useOfflineMode();
  const [pendingTrades, setPendingTrades] = useState([]);

  // Execute trade with offline support
  const executeTrade = useCallback(async (type, coinSymbol, amount) => {
    if (isOffline) {
      // Queue trade for execution when back online
      const actionId = queueAction('trade', { type, coinSymbol, amount });
      
      const pendingTrade = {
        id: actionId,
        type,
        coinSymbol,
        amount,
        timestamp: Date.now(),
        status: 'queued'
      };
      
      setPendingTrades(prev => [...prev, pendingTrade]);
      
      return {
        success: false,
        queued: true,
        actionId,
        message: 'Trade queued for execution when connection is restored'
      };
    }
    
    // Online mode - execute immediately
    try {
      const result = await dataManager.executeTrade(type, coinSymbol, amount);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [isOffline, queueAction]);

  // Check if trading is available
  const isTradingAvailable = useCallback(() => {
    return !isOffline && offlineService.isFeatureAvailable('real_time_trading');
  }, [isOffline]);

  return {
    executeTrade,
    isTradingAvailable,
    pendingTrades,
    isOffline
  };
};

/**
 * Hook for offline feature availability
 */
export const useOfflineFeatures = () => {
  const { isOffline, availableFeatures, disabledFeatures } = useOfflineMode();

  const checkFeature = useCallback((feature) => {
    return {
      available: offlineService.isFeatureAvailable(feature),
      reason: isOffline && disabledFeatures.includes(feature) 
        ? 'disabled_offline' 
        : 'available'
    };
  }, [isOffline, availableFeatures, disabledFeatures]);

  const getFeatureStatus = useCallback(() => {
    return {
      isOffline,
      availableFeatures,
      disabledFeatures,
      totalAvailable: availableFeatures.length,
      totalDisabled: disabledFeatures.length
    };
  }, [isOffline, availableFeatures, disabledFeatures]);

  return {
    checkFeature,
    getFeatureStatus,
    isOffline
  };
};

/**
 * Hook for data age monitoring in offline mode
 */
export const useDataAge = () => {
  const { isOffline, dataAge } = useOfflineMode();

  const getDataAge = useCallback((dataType) => {
    if (!isOffline || !dataAge[dataType]) {
      return null;
    }
    
    const age = dataAge[dataType];
    const ageInMinutes = Math.floor(age / 60000);
    const ageInHours = Math.floor(age / 3600000);
    
    return {
      milliseconds: age,
      minutes: ageInMinutes,
      hours: ageInHours,
      isStale: age > 300000, // 5 minutes
      isVeryStale: age > 1800000, // 30 minutes
      formatted: formatDataAge(age)
    };
  }, [isOffline, dataAge]);

  const getAllDataAges = useCallback(() => {
    if (!isOffline) {
      return {};
    }
    
    const ages = {};
    Object.keys(dataAge).forEach(dataType => {
      ages[dataType] = getDataAge(dataType);
    });
    
    return ages;
  }, [isOffline, dataAge, getDataAge]);

  return {
    getDataAge,
    getAllDataAges,
    isOffline
  };
};

/**
 * Format data age for display
 */
function formatDataAge(ageMs) {
  const minutes = Math.floor(ageMs / 60000);
  const hours = Math.floor(ageMs / 3600000);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
}