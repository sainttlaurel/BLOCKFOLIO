/**
 * Error Notification System Component
 * 
 * Manages error notifications with smart aggregation, progressive escalation,
 * and context-aware messaging to prevent notification spam while ensuring
 * important errors are communicated effectively.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Bell,
  BellOff
} from 'lucide-react';
import errorMessageService from '../../services/errorMessageService';
import UserFriendlyErrorDisplay from './UserFriendlyErrorDisplay';

const ErrorNotificationSystem = ({ 
  position = 'top-right',
  maxNotifications = 3,
  autoHideDelay = 5000,
  enableSound = false
}) => {
  const [notifications, setNotifications] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [aggregatedCount, setAggregatedCount] = useState(0);

  // Listen to error message service events
  useEffect(() => {
    const handleErrorProcessed = (errorResponse) => {
      if (!isPaused) {
        addNotification(errorResponse);
      }
    };

    const handleRetryStarted = (data) => {
      addSystemNotification('info', 'Retrying Connection', data.message);
    };

    const handleRetrySuccess = (data) => {
      addSystemNotification('success', 'Connection Restored', data.message);
    };

    const handleSystemDegraded = (data) => {
      addSystemNotification('warning', 'System Performance Reduced', data.message);
    };

    const handleSystemRestored = (data) => {
      addSystemNotification('success', 'System Performance Restored', data.message);
    };

    const handleOfflineModeActivated = (data) => {
      addSystemNotification('warning', 'Offline Mode Active', data.message);
    };

    const handleOnlineModeRestored = (data) => {
      addSystemNotification('success', 'Online Mode Restored', data.message);
    };

    errorMessageService.on('errorProcessed', handleErrorProcessed);
    errorMessageService.on('retryStarted', handleRetryStarted);
    errorMessageService.on('retrySuccess', handleRetrySuccess);
    errorMessageService.on('systemDegraded', handleSystemDegraded);
    errorMessageService.on('systemRestored', handleSystemRestored);
    errorMessageService.on('offlineModeActivated', handleOfflineModeActivated);
    errorMessageService.on('onlineModeRestored', handleOnlineModeRestored);

    return () => {
      errorMessageService.off('errorProcessed', handleErrorProcessed);
      errorMessageService.off('retryStarted', handleRetryStarted);
      errorMessageService.off('retrySuccess', handleRetrySuccess);
      errorMessageService.off('systemDegraded', handleSystemDegraded);
      errorMessageService.off('systemRestored', handleSystemRestored);
      errorMessageService.off('offlineModeActivated', handleOfflineModeActivated);
      errorMessageService.off('onlineModeRestored', handleOnlineModeRestored);
    };
  }, [isPaused]);

  const addNotification = useCallback((errorResponse) => {
    const notification = {
      id: errorResponse.id,
      type: 'error',
      errorResponse,
      timestamp: Date.now(),
      autoHide: errorResponse.severity !== 'critical'
    };

    setNotifications(prev => {
      // Check if we should aggregate similar notifications
      const similar = prev.find(n => 
        n.errorResponse?.category === errorResponse.category &&
        n.errorResponse?.type === errorResponse.type
      );

      if (similar && prev.length >= maxNotifications) {
        // Aggregate similar notifications
        setAggregatedCount(count => count + 1);
        return prev;
      }

      // Add new notification
      const updated = [notification, ...prev];
      
      // Limit to max notifications
      if (updated.length > maxNotifications) {
        const removed = updated.slice(maxNotifications);
        setAggregatedCount(count => count + removed.length);
        return updated.slice(0, maxNotifications);
      }

      return updated;
    });

    // Play sound if enabled
    if (enableSound && errorResponse.severity === 'critical') {
      playNotificationSound();
    }
  }, [maxNotifications, enableSound]);

  const addSystemNotification = useCallback((type, title, message) => {
    const notification = {
      id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      autoHide: type !== 'error'
    };

    setNotifications(prev => [notification, ...prev.slice(0, maxNotifications - 1)]);
  }, [maxNotifications]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setAggregatedCount(0);
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    } catch (error) {
      // Ignore audio errors
    }
  };

  // Auto-hide notifications
  useEffect(() => {
    const timers = notifications
      .filter(n => n.autoHide)
      .map(notification => {
        return setTimeout(() => {
          removeNotification(notification.id);
        }, autoHideDelay);
      });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, autoHideDelay, removeNotification]);

  const getPositionClasses = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };
    
    return positions[position] || positions['top-right'];
  };

  if (notifications.length === 0 && aggregatedCount === 0) {
    return null;
  }

  const notificationContainer = (
    <div className={`fixed ${getPositionClasses()} z-50 max-w-md w-full space-y-2`}>
      {/* Notification Controls */}
      {(notifications.length > 1 || aggregatedCount > 0) && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {notifications.length} active
              {aggregatedCount > 0 && `, ${aggregatedCount} more`}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title={isPaused ? 'Resume notifications' : 'Pause notifications'}
            >
              {isPaused ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title={isExpanded ? 'Collapse all' : 'Expand all'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            <button
              onClick={clearAllNotifications}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Clear all notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="space-y-2">
        {notifications.map((notification, index) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            isExpanded={isExpanded}
            onRemove={() => removeNotification(notification.id)}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          />
        ))}
      </div>

      {/* Aggregated Count Indicator */}
      {aggregatedCount > 0 && (
        <div className="bg-gray-100 rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-sm text-gray-600">
            {aggregatedCount} more notification{aggregatedCount !== 1 ? 's' : ''} hidden
          </p>
          <button
            onClick={() => {
              setAggregatedCount(0);
              setIsExpanded(true);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
          >
            Show all
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(notificationContainer, document.body);
};

// Individual Notification Item Component
const NotificationItem = ({ notification, isExpanded, onRemove, style }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSeverityConfig = (type, severity) => {
    if (type === 'error') {
      const configs = {
        critical: {
          icon: AlertTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        },
        error: {
          icon: AlertCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        },
        warning: {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600'
        }
      };
      
      return configs[severity] || configs.error;
    }

    const systemConfigs = {
      success: {
        icon: CheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-600'
      },
      warning: {
        icon: AlertTriangle,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600'
      },
      info: {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600'
      }
    };

    return systemConfigs[type] || systemConfigs.info;
  };

  if (notification.type === 'error' && notification.errorResponse) {
    return (
      <div 
        className="animate-slide-in-right"
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <UserFriendlyErrorDisplay
          error={notification.errorResponse.originalError}
          showDetails={isExpanded}
          compact={!isExpanded}
          onDismiss={onRemove}
          className="shadow-lg"
        />
      </div>
    );
  }

  // System notification
  const config = getSeverityConfig(notification.type);
  const Icon = config.icon;

  return (
    <div 
      className={`
        animate-slide-in-right rounded-lg border shadow-lg p-4
        ${config.bgColor} ${config.borderColor}
        transition-all duration-200 hover:shadow-xl
      `}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${config.textColor}`}>
            {notification.title}
          </h4>
          <p className={`text-sm ${config.textColor} opacity-90 mt-1`}>
            {notification.message}
          </p>
          
          <div className="mt-2 text-xs text-gray-500">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </div>
        </div>
        
        <button
          onClick={onRemove}
          className={`text-gray-400 hover:text-gray-600 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ErrorNotificationSystem;