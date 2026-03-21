/**
 * Monitoring Dashboard Component
 * Displays system health, performance metrics, and connection status
 */

import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import performanceMonitor from '../utils/performanceMonitor';
import connectionMonitor from '../utils/connectionMonitor';
import '../styles/MonitoringDashboard.css';

const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initialize monitoring
    performanceMonitor.init();
    connectionMonitor.init();

    // Subscribe to connection changes
    const unsubscribe = connectionMonitor.subscribe((event, status) => {
      setConnectionStatus(status);
    });

    // Update metrics periodically
    const interval = setInterval(() => {
      updateMetrics();
    }, 5000);

    // Initial update
    updateMetrics();

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const updateMetrics = () => {
    setConnectionStatus(connectionMonitor.getStatus());
    setPerformanceData(performanceMonitor.getSummary());
    setLogs(logger.getLogs().slice(-10));
  };

  const fetchServerMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/metrics');
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      logger.error('Failed to fetch server metrics', { error: error.message });
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'gray';
    if (!status.isOnline) return 'red';
    if (status.quality === 'poor') return 'orange';
    if (status.quality === 'fair') return 'yellow';
    return 'green';
  };

  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    if (!status.isOnline) return 'Offline';
    if (status.quality === 'poor') return 'Poor Connection';
    if (status.quality === 'fair') return 'Fair Connection';
    return 'Connected';
  };

  if (!isVisible) {
    return (
      <button
        className="monitoring-toggle"
        onClick={() => setIsVisible(true)}
        aria-label="Show monitoring dashboard"
      >
        📊
      </button>
    );
  }

  return (
    <div className="monitoring-dashboard">
      <div className="monitoring-header">
        <h2>System Monitoring</h2>
        <button
          className="monitoring-close"
          onClick={() => setIsVisible(false)}
          aria-label="Close monitoring dashboard"
        >
          ✕
        </button>
      </div>

      <div className="monitoring-content">
        {/* Connection Status */}
        <div className="monitoring-section">
          <h3>Connection Status</h3>
          {connectionStatus && (
            <div className="status-card">
              <div className="status-indicator">
                <span
                  className="status-dot"
                  style={{ backgroundColor: getStatusColor(connectionStatus) }}
                />
                <span className="status-text">{getStatusText(connectionStatus)}</span>
              </div>
              <div className="status-details">
                <div className="status-item">
                  <span className="label">Quality:</span>
                  <span className="value">{connectionStatus.quality}</span>
                </div>
                <div className="status-item">
                  <span className="label">Data Age:</span>
                  <span className="value">
                    {connectionStatus.dataAge ? `${connectionStatus.dataAge}s` : 'N/A'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="label">Data Fresh:</span>
                  <span className="value">
                    {connectionStatus.dataFresh ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="monitoring-section">
          <h3>Performance</h3>
          {performanceData && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Page Load</div>
                <div className="metric-value">
                  {performanceData.pageLoadTime
                    ? `${performanceData.pageLoadTime}ms`
                    : 'N/A'}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Avg FPS</div>
                <div className="metric-value">{performanceData.averageFPS}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Avg API Time</div>
                <div className="metric-value">{performanceData.averageApiTime}ms</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">API Calls</div>
                <div className="metric-value">{performanceData.totalApiCalls}</div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Logs */}
        <div className="monitoring-section">
          <h3>Recent Logs</h3>
          <div className="logs-container">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className={`log-entry log-${log.level}`}>
                  <span className="log-time">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="log-level">{log.level.toUpperCase()}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            ) : (
              <div className="no-logs">No logs available</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="monitoring-actions">
          <button onClick={fetchServerMetrics} className="action-button">
            Fetch Server Metrics
          </button>
          <button onClick={updateMetrics} className="action-button">
            Refresh
          </button>
          <button
            onClick={() => {
              logger.clearLogs();
              setLogs([]);
            }}
            className="action-button"
          >
            Clear Logs
          </button>
        </div>

        {/* Server Metrics (if loaded) */}
        {metrics && (
          <div className="monitoring-section">
            <h3>Server Metrics</h3>
            <div className="server-metrics">
              <pre>{JSON.stringify(metrics, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard;
