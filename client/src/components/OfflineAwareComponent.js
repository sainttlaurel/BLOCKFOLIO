/**
 * Offline-Aware Component Wrapper
 * 
 * Higher-order component that automatically handles offline states,
 * provides cached data fallbacks, and shows appropriate offline messaging.
 */

import React, { useState, useEffect } from 'react';
import { 
  WifiOff, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Database,
  Info
} from 'lucide-react';
import { useOfflineMode, useOfflineAwareData } from '../hooks/useOfflineMode';

/**
 * Higher-order component for offline awareness
 */
export const withOfflineAwareness = (WrappedComponent, options = {}) => {
  const {
    dataType = null,
    dataFetcher = null,
    fallbackComponent = null,
    showOfflineIndicator = true,
    showDataAge = true,
    enableCacheFallback = true,
    maxCacheAge = 300000, // 5 minutes
    offlineMessage = 'This feature is using cached data while offline'
  } = options;

  return function OfflineAwareComponent(props) {
    const { isOffline, isFeatureAvailable } = useOfflineMode();
    const [showOfflineNotice, setShowOfflineNotice] = useState(false);

    // Use offline-aware data fetching if dataType and fetcher provided
    const { 
      data, 
      loading, 
      error, 
      isFromCache, 
      refresh 
    } = useOfflineAwareData(dataType, dataFetcher, {
      fallbackToCached: enableCacheFallback,
      maxCacheAge,
      onCacheFallback: () => setShowOfflineNotice(true)
    });

    // Show offline notice when using cached data
    useEffect(() => {
      if (isOffline && isFromCache) {
        setShowOfflineNotice(true);
      } else {
        setShowOfflineNotice(false);
      }
    }, [isOffline, isFromCache]);

    // If component requires online functionality and we're offline
    if (isOffline && !isFeatureAvailable(dataType)) {
      if (fallbackComponent) {
        return React.createElement(fallbackComponent, { ...props, isOffline: true });
      }
      
      return (
        <OfflineComponentFallback 
          message="This feature is not available offline"
          showRetry={true}
        />
      );
    }

    return (
      <div className="relative">
        {/* Offline Notice */}
        {showOfflineNotice && showOfflineIndicator && (
          <OfflineDataNotice 
            message={offlineMessage}
            showDataAge={showDataAge}
            dataAge={data?.age}
            onDismiss={() => setShowOfflineNotice(false)}
          />
        )}
        
        {/* Wrapped Component */}
        <WrappedComponent 
          {...props}
          data={data}
          loading={loading}
          error={error}
          isOffline={isOffline}
          isFromCache={isFromCache}
          refresh={refresh}
        />
      </div>
    );
  };
};

/**
 * Offline Component Fallback
 */
const OfflineComponentFallback = ({ 
  message = "This feature is not available offline",
  showRetry = false,
  onRetry = null
}) => {
  const { retryConnection } = useOfflineMode();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
      } else {
        await retryConnection();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <WifiOff className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Offline Mode</h3>
      <p className="text-gray-600 text-center mb-4">{message}</p>
      
      {showRetry && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
            isRetrying
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying...' : 'Retry Connection'}</span>
        </button>
      )}
    </div>
  );
};

/**
 * Offline Data Notice
 */
const OfflineDataNotice = ({ 
  message, 
  showDataAge = true, 
  dataAge = null, 
  onDismiss = null 
}) => {
  const formatAge = (age) => {
    if (!age) return '';
    
    const minutes = Math.floor(age / 60000);
    const hours = Math.floor(age / 3600000);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const getAgeColor = (age) => {
    if (!age) return 'text-blue-600';
    
    if (age > 1800000) return 'text-red-600'; // > 30 minutes
    if (age > 600000) return 'text-yellow-600'; // > 10 minutes
    return 'text-blue-600';
  };

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
        
        <div className="flex-1">
          <p className="text-sm text-blue-800">{message}</p>
          
          {showDataAge && dataAge && (
            <div className="flex items-center mt-1">
              <Clock className="h-3 w-3 text-blue-600 mr-1" />
              <span className={`text-xs ${getAgeColor(dataAge)}`}>
                Last updated {formatAge(dataAge)}
              </span>
            </div>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 text-blue-600 hover:text-blue-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Offline Data Display Component
 */
export const OfflineDataDisplay = ({ 
  data, 
  isFromCache = false, 
  dataAge = null,
  children,
  className = ""
}) => {
  const { isOffline } = useOfflineMode();

  const formatAge = (age) => {
    if (!age) return 'Unknown';
    
    const minutes = Math.floor(age / 60000);
    const hours = Math.floor(age / 3600000);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const getDataQualityIndicator = () => {
    if (!isOffline || !isFromCache) return null;
    
    const age = dataAge || 0;
    let color = 'text-green-600';
    let icon = <Database className="h-3 w-3" />;
    let label = 'Fresh';
    
    if (age > 1800000) { // > 30 minutes
      color = 'text-red-600';
      icon = <AlertTriangle className="h-3 w-3" />;
      label = 'Very Stale';
    } else if (age > 600000) { // > 10 minutes
      color = 'text-yellow-600';
      icon = <Clock className="h-3 w-3" />;
      label = 'Stale';
    }
    
    return (
      <div className={`flex items-center space-x-1 text-xs ${color}`}>
        {icon}
        <span>{label} - {formatAge(age)}</span>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Data Quality Indicator */}
      {isOffline && isFromCache && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-md px-2 py-1 border border-gray-200">
            {getDataQualityIndicator()}
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};

/**
 * Offline Feature Guard Component
 */
export const OfflineFeatureGuard = ({ 
  feature, 
  children, 
  fallback = null,
  showMessage = true 
}) => {
  const { isOffline, isFeatureAvailable } = useOfflineMode();

  if (isOffline && !isFeatureAvailable(feature)) {
    if (fallback) {
      return fallback;
    }
    
    if (showMessage) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Feature Limited</h4>
              <p className="text-sm text-yellow-700">
                This feature is not available in offline mode.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  }

  return children;
};

/**
 * Offline Action Button Component
 */
export const OfflineActionButton = ({ 
  action,
  onlineAction,
  offlineAction = null,
  children,
  className = "",
  ...props
}) => {
  const { isOffline, queueAction } = useOfflineMode();
  const [isQueued, setIsQueued] = useState(false);

  const handleClick = async (e) => {
    if (isOffline) {
      if (offlineAction) {
        await offlineAction(e);
      } else {
        // Queue action for when back online
        queueAction(action.type, action.data);
        setIsQueued(true);
        
        // Reset queued state after 3 seconds
        setTimeout(() => setIsQueued(false), 3000);
      }
    } else {
      await onlineAction(e);
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      className={`${className} ${isQueued ? 'bg-yellow-100 text-yellow-800' : ''}`}
    >
      {isQueued ? (
        <span className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>Queued</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default {
  withOfflineAwareness,
  OfflineComponentFallback,
  OfflineDataNotice,
  OfflineDataDisplay,
  OfflineFeatureGuard,
  OfflineActionButton
};