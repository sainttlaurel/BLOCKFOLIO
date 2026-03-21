/**
 * Retry User Feedback Component
 * 
 * Displays user-friendly notifications for retry operations, providing
 * clear feedback about connection issues, retry attempts, and recovery status.
 */

import React, { useState, useEffect } from 'react';
import './RetryUserFeedback.css';

const RetryUserFeedback = ({ 
  position = 'top-center',
  autoHide = true,
  hideDelay = 5000 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    const handleUserFeedback = (event) => {
      const { type, data, timestamp } = event.detail;
      
      // Create notification based on feedback type
      const notification = createNotification(type, data, timestamp);
      if (notification) {
        addNotification(notification);
      }
    };

    window.addEventListener('retryUserFeedback', handleUserFeedback);
    
    return () => {
      window.removeEventListener('retryUserFeedback', handleUserFeedback);
    };
  }, []);

  const createNotification = (type, data, timestamp) => {
    const baseNotification = {
      id: nextId,
      timestamp,
      type,
      data
    };

    setNextId(prev => prev + 1);

    switch (type) {
      case 'retry_started':
        return {
          ...baseNotification,
          level: 'info',
          title: 'Connecting...',
          message: data.message || 'Attempting to establish connection',
          icon: '🔄',
          duration: autoHide ? 3000 : null
        };

      case 'retry_attempt':
        return {
          ...baseNotification,
          level: 'warning',
          title: `Retry ${data.attempt}/${data.maxAttempts}`,
          message: data.message || `Retrying in ${Math.round((data.nextAttemptIn || 0) / 1000)} seconds...`,
          icon: '⏳',
          duration: autoHide ? 4000 : null,
          showProgress: true,
          progressDuration: data.nextAttemptIn || 0
        };

      case 'retry_success':
        return {
          ...baseNotification,
          level: 'success',
          title: 'Connected',
          message: data.message || 'Connection restored successfully',
          icon: '✅',
          duration: autoHide ? 3000 : null
        };

      case 'retry_failed':
        return {
          ...baseNotification,
          level: 'error',
          title: 'Connection Failed',
          message: data.message || 'Unable to establish connection',
          icon: '❌',
          duration: autoHide ? 6000 : null,
          actions: [
            {
              label: 'Retry Now',
              action: () => window.location.reload()
            }
          ]
        };

      case 'circuit_breaker_blocked':
        return {
          ...baseNotification,
          level: 'error',
          title: 'Service Temporarily Unavailable',
          message: data.message || 'Service is temporarily unavailable due to repeated failures',
          icon: '🚫',
          duration: autoHide ? 8000 : null,
          actions: [
            {
              label: 'Check Status',
              action: () => console.log('Circuit breaker status:', data)
            }
          ]
        };

      default:
        return null;
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => {
      // Limit to 5 notifications max
      const updated = [notification, ...prev].slice(0, 5);
      return updated;
    });

    // Auto-hide notification if duration is set
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAction = (action, notificationId) => {
    if (action.action) {
      action.action();
    }
    removeNotification(notificationId);
  };

  const getNotificationClass = (level) => {
    return `notification notification-${level}`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`retry-feedback-container ${position}`}>
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={getNotificationClass(notification.level)}
        >
          <div className="notification-header">
            <span className="notification-icon">{notification.icon}</span>
            <span className="notification-title">{notification.title}</span>
            <button 
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
            >
              ×
            </button>
          </div>
          
          <div className="notification-content">
            <p className="notification-message">{notification.message}</p>
            
            {notification.showProgress && notification.progressDuration && (
              <div className="notification-progress">
                <div 
                  className="progress-bar"
                  style={{
                    animation: `progress ${notification.progressDuration}ms linear`
                  }}
                />
              </div>
            )}
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="notification-actions">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    className="notification-action"
                    onClick={() => handleAction(action, notification.id)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="notification-footer">
            <small>{formatTimestamp(notification.timestamp)}</small>
            {notification.data.endpoint && (
              <small className="notification-endpoint">
                {notification.data.endpoint}
              </small>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RetryUserFeedback;