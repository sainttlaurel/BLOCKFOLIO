/**
 * Offline Mode Indicator Component
 * 
 * Displays comprehensive offline status with cached data information,
 * feature limitations, and connection restoration controls.
 */

import React, { useState } from 'react';
import { 
  WifiOff, 
  Wifi, 
  Database, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useOfflineMode, useDataAge, useOfflineFeatures } from '../hooks/useOfflineMode';

const OfflineIndicator = ({ className = "", showDetails = false, position = "top-right" }) => {
  const {
    isOffline,
    offlineStartTime,
    lastOnlineTime,
    availableFeatures,
    disabledFeatures,
    pendingActions,
    retryConnection
  } = useOfflineMode();
  
  const { getAllDataAges } = useDataAge();
  const { getFeatureStatus } = useOfflineFeatures();
  
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [isRetrying, setIsRetrying] = useState(false);

  // Don't render if online and not showing details
  if (!isOffline && !showDetails) {
    return null;
  }

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      const result = await retryConnection();
      console.log('Connection retry result:', result);
    } catch (error) {
      console.error('Connection retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const getOfflineDuration = () => {
    if (!offlineStartTime) return null;
    
    const duration = Date.now() - offlineStartTime;
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(duration / 3600000);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '<1m';
    }
  };

  const getStatusConfig = () => {
    if (isOffline) {
      return {
        icon: WifiOff,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        text: 'Offline',
        description: 'Using cached data'
      };
    } else {
      return {
        icon: Wifi,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        text: 'Online',
        description: 'Real-time data'
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const dataAges = getAllDataAges();
  const featureStatus = getFeatureStatus();
  const offlineDuration = getOfflineDuration();

  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'inline': 'relative'
  };

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      {/* Main Status Indicator */}
      <div className={`
        flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm
        ${statusConfig.bgColor} ${statusConfig.borderColor}
        transition-all duration-300 cursor-pointer
        ${isExpanded ? 'rounded-b-none' : ''}
      `}
      onClick={() => setIsExpanded(!isExpanded)}>
        
        {/* Status Icon and Text */}
        <div className="flex items-center space-x-2">
          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
          <div>
            <span className={`text-sm font-semibold ${statusConfig.color}`}>
              {statusConfig.text}
            </span>
            {isOffline && offlineDuration && (
              <span className="text-xs text-gray-500 ml-2">
                {offlineDuration}
              </span>
            )}
          </div>
        </div>

        {/* Pending Actions Badge */}
        {pendingActions > 0 && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 rounded-full">
            <Clock className="h-3 w-3 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700">
              {pendingActions}
            </span>
          </div>
        )}

        {/* Expand/Collapse Icon */}
        {isOffline && (
          <div className="ml-auto">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        )}
      </div>

      {/* Expanded Details Panel */}
      {isExpanded && isOffline && (
        <div className={`
          border-t-0 rounded-b-lg border shadow-lg backdrop-blur-sm
          ${statusConfig.bgColor} ${statusConfig.borderColor}
          p-4 space-y-4 min-w-80
        `}>
          
          {/* Offline Status Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Offline Duration
              </span>
              <span className="text-sm text-gray-600">
                {offlineDuration || 'Unknown'}
              </span>
            </div>
            
            {lastOnlineTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Last Online
                </span>
                <span className="text-sm text-gray-600">
                  {new Date(lastOnlineTime).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {/* Data Freshness */}
          {Object.keys(dataAges).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <Database className="h-4 w-4 mr-1" />
                Cached Data
              </h4>
              
              <div className="space-y-1">
                {Object.entries(dataAges).map(([dataType, age]) => (
                  <div key={dataType} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 capitalize">
                      {dataType.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <div className="flex items-center space-x-1">
                      {age?.isVeryStale ? (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      ) : age?.isStale ? (
                        <Clock className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                      <span className={`text-xs ${
                        age?.isVeryStale ? 'text-red-600' :
                        age?.isStale ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {age?.formatted || 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature Availability */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">
              Feature Status
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-green-700">
                  {featureStatus.totalAvailable} Available
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <XCircle className="h-3 w-3 text-red-500" />
                <span className="text-red-700">
                  {featureStatus.totalDisabled} Limited
                </span>
              </div>
            </div>
          </div>

          {/* Pending Actions */}
          {pendingActions > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Pending Actions
              </h4>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {pendingActions} action{pendingActions !== 1 ? 's' : ''} queued
                </span>
                <span className="text-xs text-yellow-600">
                  Will execute when online
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2 border-t border-gray-200">
            <button
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className={`
                flex-1 flex items-center justify-center space-x-1 px-3 py-2 
                text-xs font-medium rounded-md transition-colors
                ${isRetrying 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }
              `}
            >
              <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying...' : 'Retry Connection'}</span>
            </button>
            
            <button
              onClick={() => setIsExpanded(false)}
              className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact offline indicator for use in navigation or status bars
 */
export const CompactOfflineIndicator = ({ className = "" }) => {
  const { isOffline, pendingActions } = useOfflineMode();

  if (!isOffline) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 rounded-full">
        <WifiOff className="h-3 w-3 text-red-600" />
        <span className="text-xs font-medium text-red-700">Offline</span>
      </div>
      
      {pendingActions > 0 && (
        <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 rounded-full">
          <Clock className="h-3 w-3 text-yellow-600" />
          <span className="text-xs font-medium text-yellow-700">
            {pendingActions}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Offline notification banner for full-width display
 */
export const OfflineBanner = ({ className = "", onDismiss = null }) => {
  const { isOffline, availableFeatures, disabledFeatures } = useOfflineMode();

  if (!isOffline) {
    return null;
  }

  return (
    <div className={`
      bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}
    `}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-yellow-400" />
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Offline Mode Active
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              You're currently offline. {availableFeatures.length} features are available 
              using cached data, while {disabledFeatures.length} features are temporarily limited.
            </p>
          </div>
        </div>
        
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;