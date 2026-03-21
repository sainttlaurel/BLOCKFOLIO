/**
 * Connection Status Monitor Component
 * 
 * Displays real-time connection status for WebSocket and HTTP connections
 * with automatic reconnection capabilities and detailed metrics.
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { useWebSocket, useConnectionMonitor } from '../hooks/useWebSocket';
import { useNetworkStatus } from '../hooks/useDataCache';

const ConnectionStatusMonitor = ({ 
  position = 'top-right',
  showDetails = false,
  autoHide = true,
  hideDelay = 3000
}) => {
  const { connectionStatus, latency, reconnect } = useWebSocket();
  const { connectionHistory, alerts, connectionQuality } = useConnectionMonitor();
  const networkStatus = useNetworkStatus();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShow, setShouldShow] = useState(true);
  const [hideTimer, setHideTimer] = useState(null);

  // Auto-hide logic
  useEffect(() => {
    if (autoHide && connectionStatus.isConnected && !isExpanded) {
      if (hideTimer) clearTimeout(hideTimer);
      
      const timer = setTimeout(() => {
        setShouldShow(false);
      }, hideDelay);
      
      setHideTimer(timer);
    } else {
      setShouldShow(true);
      if (hideTimer) {
        clearTimeout(hideTimer);
        setHideTimer(null);
      }
    }

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [connectionStatus.isConnected, isExpanded, autoHide, hideDelay, hideTimer]);

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Connection status indicator
  const getStatusIndicator = () => {
    if (!networkStatus.isOnline) {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        status: 'Offline',
        description: 'No internet connection'
      };
    }

    switch (connectionStatus.state) {
      case 'connected':
        return {
          icon: connectionQuality === 'excellent' ? Zap : CheckCircle,
          color: connectionQuality === 'poor' ? 'text-yellow-500' : 'text-green-500',
          bgColor: connectionQuality === 'poor' ? 'bg-yellow-50' : 'bg-green-50',
          borderColor: connectionQuality === 'poor' ? 'border-yellow-200' : 'border-green-200',
          status: 'Connected',
          description: `${connectionQuality} connection (${latency || 0}ms)`
        };
      case 'connecting':
        return {
          icon: Clock,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          status: 'Connecting',
          description: 'Establishing connection...'
        };
      case 'disconnected':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          status: 'Disconnected',
          description: connectionStatus.reconnectAttempts > 0 
            ? `Reconnecting... (${connectionStatus.reconnectAttempts} attempts)`
            : 'Connection lost'
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          status: 'Unknown',
          description: 'Connection status unknown'
        };
    }
  };

  const statusInfo = getStatusIndicator();
  const StatusIcon = statusInfo.icon;

  if (!shouldShow && !isExpanded) {
    return null;
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 transition-all duration-300`}>
      {/* Compact Status Indicator */}
      <div
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg border shadow-lg cursor-pointer
          ${statusInfo.bgColor} ${statusInfo.borderColor} hover:shadow-xl transition-all duration-200
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
        <span className="text-sm font-medium text-gray-700">
          {statusInfo.status}
        </span>
        {latency && connectionStatus.isConnected && (
          <span className="text-xs text-gray-500">
            {latency}ms
          </span>
        )}
      </div>

      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className="mt-2 bg-white rounded-lg border border-gray-200 shadow-xl p-4 min-w-80">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Connection Status</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Current Status */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {statusInfo.status}
                </div>
                <div className="text-xs text-gray-500">
                  {statusInfo.description}
                </div>
              </div>
            </div>

            {/* Connection Metrics */}
            {connectionStatus.isConnected && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-gray-500">Latency</div>
                  <div className="font-medium">{latency || 0}ms</div>
                </div>
                <div>
                  <div className="text-gray-500">Quality</div>
                  <div className="font-medium capitalize">{connectionQuality}</div>
                </div>
                <div>
                  <div className="text-gray-500">Subscriptions</div>
                  <div className="font-medium">{connectionStatus.subscriptions?.length || 0}</div>
                </div>
                <div>
                  <div className="text-gray-500">Reconnects</div>
                  <div className="font-medium">{connectionStatus.reconnectAttempts}</div>
                </div>
              </div>
            )}

            {/* Network Status */}
            <div className="border-t pt-3">
              <div className="text-xs text-gray-500 mb-2">Network Status</div>
              <div className="flex items-center space-x-2">
                <Wifi className={`h-4 w-4 ${networkStatus.isOnline ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm">
                  {networkStatus.isOnline ? 'Online' : 'Offline'}
                </span>
                {networkStatus.quality && (
                  <span className="text-xs text-gray-500">
                    ({networkStatus.quality})
                  </span>
                )}
              </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-xs text-gray-500 mb-2">Alerts</div>
                <div className="space-y-1">
                  {alerts.slice(0, 3).map((alert, index) => (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded ${
                        alert.type === 'error' 
                          ? 'bg-red-50 text-red-700' 
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-3 flex space-x-2">
              {!connectionStatus.isConnected && (
                <button
                  onClick={reconnect}
                  className="flex-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  Reconnect
                </button>
              )}
              {showDetails && (
                <button
                  onClick={() => {/* Open detailed metrics modal */}}
                  className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                >
                  Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatusMonitor;