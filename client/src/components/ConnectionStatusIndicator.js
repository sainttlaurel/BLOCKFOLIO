/**
 * Connection Status Indicator Component
 * Displays real-time connection status and data freshness
 */

import React, { useState, useEffect } from 'react';
import connectionMonitor from '../utils/connectionMonitor';
import '../styles/ConnectionStatusIndicator.css';

const ConnectionStatusIndicator = () => {
  const [status, setStatus] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Initialize connection monitor
    connectionMonitor.init();

    // Subscribe to connection changes
    const unsubscribe = connectionMonitor.subscribe((event, statusData) => {
      setStatus(statusData);
    });

    // Initial status
    setStatus(connectionMonitor.getStatus());

    return () => {
      unsubscribe();
    };
  }, []);

  if (!status) return null;

  const getStatusColor = () => {
    if (!status.isOnline) return '#ef4444';
    if (status.quality === 'poor') return '#f97316';
    if (status.quality === 'fair') return '#eab308';
    return '#10b981';
  };

  const getStatusIcon = () => {
    if (!status.isOnline) return '⚠️';
    if (status.quality === 'poor') return '📶';
    if (status.quality === 'fair') return '📶';
    return '✓';
  };

  const getStatusText = () => {
    if (!status.isOnline) return 'Offline';
    if (status.quality === 'poor') return 'Poor Connection';
    if (status.quality === 'fair') return 'Fair Connection';
    return 'Connected';
  };

  return (
    <div className="connection-status-indicator">
      <div
        className="status-badge"
        onClick={() => setShowDetails(!showDetails)}
        style={{ backgroundColor: getStatusColor() }}
        role="button"
        tabIndex={0}
        aria-label={`Connection status: ${getStatusText()}`}
      >
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
      </div>

      {showDetails && (
        <div className="status-details-popup">
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className="detail-value">{status.isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Quality:</span>
            <span className="detail-value">{status.quality}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Data Fresh:</span>
            <span className="detail-value">{status.dataFresh ? 'Yes' : 'No'}</span>
          </div>
          {status.dataAge !== null && (
            <div className="detail-row">
              <span className="detail-label">Data Age:</span>
              <span className="detail-value">{status.dataAge}s ago</span>
            </div>
          )}
          {status.lastUpdate && (
            <div className="detail-row">
              <span className="detail-label">Last Update:</span>
              <span className="detail-value">
                {new Date(status.lastUpdate).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
