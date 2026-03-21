/**
 * Retry Status Indicator Component
 * 
 * Displays retry status, circuit breaker information, and network resilience
 * indicators to provide users with feedback about data request reliability.
 */

import React, { useState, useEffect } from 'react';
import dataManager from '../services/dataManager';
import './RetryStatusIndicator.css';

const RetryStatusIndicator = ({ 
  showDetails = false, 
  position = 'top-right',
  onStatusClick = null 
}) => {
  const [retryStatus, setRetryStatus] = useState({
    activeRetries: 0,
    totalRetries: 0,
    successRate: '100%',
    circuitBreakerTrips: 0,
    networkQuality: 'good',
    isOnline: true
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    // Initial status load
    updateRetryStatus();
    
    // Listen for retry status changes
    const handleRetryStatusChange = (event) => {
      const { status, data } = event.detail;
      updateRecentActivity(status, data);
      updateRetryStatus();
    };
    
    // Listen for network status changes
    const handleNetworkStatusChange = (event) => {
      updateRetryStatus();
    };
    
    // Listen for user feedback events
    const handleUserFeedback = (event) => {
      const { type, data } = event.detail;
      updateRecentActivity(`user_feedback_${type}`, data);
    };
    
    window.addEventListener('retryStatusChange', handleRetryStatusChange);
    window.addEventListener('networkStatusChange', handleNetworkStatusChange);
    window.addEventListener('retryUserFeedback', handleUserFeedback);
    
    // Periodic status updates
    const statusInterval = setInterval(updateRetryStatus, 10000);
    
    return () => {
      window.removeEventListener('retryStatusChange', handleRetryStatusChange);
      window.removeEventListener('networkStatusChange', handleNetworkStatusChange);
      window.removeEventListener('retryUserFeedback', handleUserFeedback);
      clearInterval(statusInterval);
    };
  }, []);

  const updateRetryStatus = () => {
    try {
      const networkStatus = dataManager.getNetworkStatus();
      const retryDetails = dataManager.getRetryStatus();
      
      setRetryStatus({
        activeRetries: retryDetails.metrics.activeRetries,
        totalRetries: retryDetails.metrics.totalRetries,
        successRate: retryDetails.metrics.successRate,
        circuitBreakerTrips: retryDetails.metrics.circuitBreakerTrips,
        networkQuality: networkStatus.quality,
        isOnline: networkStatus.isOnline,
        responseTime: networkStatus.responseTime,
        reliability: networkStatus.reliability
      });
      
      setLastUpdate(Date.now());
    } catch (error) {
      console.warn('Failed to update retry status:', error);
    }
  };

  const updateRecentActivity = (status, data) => {
    const activity = {
      id: Date.now(),
      status,
      data,
      timestamp: Date.now()
    };
    
    setRecentActivity(prev => {
      const updated = [activity, ...prev].slice(0, 10); // Keep last 10 activities
      return updated;
    });
  };

  const getStatusColor = () => {
    if (!retryStatus.isOnline) return 'red';
    if (retryStatus.activeRetries > 0) return 'orange';
    if (retryStatus.circuitBreakerTrips > 0) return 'yellow';
    if (retryStatus.networkQuality === 'poor') return 'orange';
    return 'green';
  };

  const getStatusText = () => {
    if (!retryStatus.isOnline) return 'Offline';
    if (retryStatus.activeRetries > 0) return `Retrying (${retryStatus.activeRetries})`;
    if (retryStatus.circuitBreakerTrips > 0) return 'Circuit Breaker Active';
    return 'Connected';
  };

  const getNetworkQualityIcon = () => {
    switch (retryStatus.networkQuality) {
      case 'excellent': return '📶';
      case 'good': return '📶';
      case 'fair': return '📶';
      case 'poor': return '📶';
      default: return '❓';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatActivityStatus = (status) => {
    switch (status) {
      case 'started': return 'Retry Started';
      case 'attempting': return 'Retrying...';
      case 'success': return 'Retry Success';
      case 'failed': return 'Retry Failed';
      case 'circuit_breaker_opened': return 'Circuit Breaker Opened';
      case 'circuit_breaker_closed': return 'Circuit Breaker Closed';
      case 'circuit_breaker_half_open': return 'Circuit Breaker Testing';
      case 'user_feedback_retry_started': return 'Connection Attempt';
      case 'user_feedback_retry_attempt': return 'Retrying Connection';
      case 'user_feedback_retry_success': return 'Connection Restored';
      case 'user_feedback_retry_failed': return 'Connection Failed';
      case 'user_feedback_circuit_breaker_blocked': return 'Service Unavailable';
      default: return status;
    }
  };

  const handleIndicatorClick = () => {
    if (onStatusClick) {
      onStatusClick(retryStatus);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`retry-status-indicator ${position}`}>
      {/* Main Status Indicator */}
      <div 
        className={`status-badge ${getStatusColor()}`}
        onClick={handleIndicatorClick}
        title={`Network Status: ${getStatusText()}`}
      >
        <span className="status-icon">
          {retryStatus.isOnline ? getNetworkQualityIcon() : '🔴'}
        </span>
        <span className="status-text">{getStatusText()}</span>
        {retryStatus.activeRetries > 0 && (
          <span className="retry-count">{retryStatus.activeRetries}</span>
        )}
      </div>

      {/* Detailed Status Panel */}
      {(showDetails || isExpanded) && (
        <div className="status-details">
          <div className="status-header">
            <h4>Network & Retry Status</h4>
            <button 
              className="close-button"
              onClick={() => setIsExpanded(false)}
            >
              ×
            </button>
          </div>
          
          <div className="status-metrics">
            <div className="metric">
              <span className="metric-label">Connection:</span>
              <span className={`metric-value ${retryStatus.isOnline ? 'online' : 'offline'}`}>
                {retryStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            <div className="metric">
              <span className="metric-label">Quality:</span>
              <span className={`metric-value quality-${retryStatus.networkQuality}`}>
                {retryStatus.networkQuality}
              </span>
            </div>
            
            {retryStatus.responseTime && (
              <div className="metric">
                <span className="metric-label">Response Time:</span>
                <span className="metric-value">{retryStatus.responseTime}ms</span>
              </div>
            )}
            
            <div className="metric">
              <span className="metric-label">Reliability:</span>
              <span className="metric-value">{retryStatus.reliability}%</span>
            </div>
            
            <div className="metric">
              <span className="metric-label">Success Rate:</span>
              <span className="metric-value">{retryStatus.successRate}</span>
            </div>
            
            <div className="metric">
              <span className="metric-label">Active Retries:</span>
              <span className="metric-value">{retryStatus.activeRetries}</span>
            </div>
            
            {retryStatus.circuitBreakerTrips > 0 && (
              <div className="metric">
                <span className="metric-label">Circuit Breaker Trips:</span>
                <span className="metric-value warning">{retryStatus.circuitBreakerTrips}</span>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="recent-activity">
              <h5>Recent Activity</h5>
              <div className="activity-list">
                {recentActivity.slice(0, 5).map(activity => (
                  <div key={activity.id} className="activity-item">
                    <span className="activity-time">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                    <span className="activity-status">
                      {formatActivityStatus(activity.status)}
                    </span>
                    {activity.data.endpoint && (
                      <span className="activity-endpoint">
                        {activity.data.endpoint}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="status-footer">
            <small>Last updated: {formatTimestamp(lastUpdate)}</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetryStatusIndicator;