/**
 * Example: Monitoring System Integration
 * 
 * This file demonstrates how to integrate the monitoring and logging
 * system into your React components and API calls.
 */

import React, { useEffect, useState } from 'react';
import logger from '../utils/logger';
import performanceMonitor from '../utils/performanceMonitor';
import connectionMonitor from '../utils/connectionMonitor';

/**
 * Example 1: Basic Component with Logging
 */
export const ComponentWithLogging = () => {
  useEffect(() => {
    logger.info('ComponentWithLogging mounted');
    
    return () => {
      logger.info('ComponentWithLogging unmounted');
    };
  }, []);

  const handleClick = () => {
    logger.info('Button clicked', { component: 'ComponentWithLogging' });
  };

  return (
    <button onClick={handleClick}>
      Click Me
    </button>
  );
};

/**
 * Example 2: API Call with Performance Tracking
 */
export const useApiWithMonitoring = () => {
  const fetchData = async (endpoint) => {
    const startTime = performance.now();
    
    try {
      logger.info(`API call started: ${endpoint}`);
      
      const response = await fetch(endpoint);
      const duration = performance.now() - startTime;
      
      // Track API performance
      performanceMonitor.trackApiCall('GET', endpoint, duration, response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      logger.info(`API call successful: ${endpoint}`, { duration: `${duration}ms` });
      
      // Update connection monitor
      connectionMonitor.updateDataTimestamp();
      
      return data;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.error(`API call failed: ${endpoint}`, {
        error: error.message,
        duration: `${duration}ms`
      });
      
      performanceMonitor.trackApiCall('GET', endpoint, duration, 0);
      
      throw error;
    }
  };

  return { fetchData };
};

/**
 * Example 3: Trading Operation with Logging
 */
export const useTradingWithLogging = () => {
  const executeTrade = async (type, coin, amount, price) => {
    logger.logTrade(type, {
      coin,
      amount,
      price,
      total: amount * price
    });

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, coin, amount, price })
      });

      if (!response.ok) {
        throw new Error('Trade execution failed');
      }

      const result = await response.json();
      
      logger.info('Trade executed successfully', {
        type,
        coin,
        amount,
        transactionId: result.id
      });

      return result;
    } catch (error) {
      logger.error('Trade execution failed', {
        type,
        coin,
        amount,
        error: error.message
      });
      
      throw error;
    }
  };

  return { executeTrade };
};

/**
 * Example 4: Component with Performance Monitoring
 */
export const PerformanceMonitoredComponent = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Measure component initialization
    const startTime = performance.now();
    
    // Simulate data loading
    setTimeout(() => {
      const duration = performance.now() - startTime;
      performanceMonitor.trackInteraction('component-init', 'PerformanceMonitoredComponent', duration);
      
      setData({ loaded: true });
    }, 100);
  }, []);

  const handleExpensiveOperation = () => {
    const startTime = performance.now();
    
    // Simulate expensive operation
    for (let i = 0; i < 1000000; i++) {
      // Heavy computation
    }
    
    const duration = performance.now() - startTime;
    performanceMonitor.trackInteraction('expensive-operation', 'button-click', duration);
    
    logger.info('Expensive operation completed', { duration: `${duration}ms` });
  };

  return (
    <div>
      <h3>Performance Monitored Component</h3>
      <button onClick={handleExpensiveOperation}>
        Run Expensive Operation
      </button>
      {data && <p>Data loaded</p>}
    </div>
  );
};

/**
 * Example 5: Connection Status Integration
 */
export const ConnectionAwareComponent = () => {
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    // Subscribe to connection changes
    const unsubscribe = connectionMonitor.subscribe((event, status) => {
      setConnectionStatus(status);
      
      if (event === 'offline') {
        logger.warn('Connection lost - switching to offline mode');
      } else if (event === 'online') {
        logger.info('Connection restored - syncing data');
      }
    });

    // Get initial status
    setConnectionStatus(connectionMonitor.getStatus());

    return () => {
      unsubscribe();
    };
  }, []);

  if (!connectionStatus) return null;

  return (
    <div>
      <h3>Connection Status</h3>
      <p>Status: {connectionStatus.isOnline ? 'Online' : 'Offline'}</p>
      <p>Quality: {connectionStatus.quality}</p>
      <p>Data Fresh: {connectionStatus.dataFresh ? 'Yes' : 'No'}</p>
    </div>
  );
};

/**
 * Example 6: Error Boundary with Logging
 */
export class ErrorBoundaryWithLogging extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Component error caught by boundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

/**
 * Example 7: Initialize Monitoring in App
 */
export const initializeMonitoring = () => {
  // Initialize performance monitoring
  performanceMonitor.init();
  logger.info('Performance monitoring initialized');

  // Initialize connection monitoring
  connectionMonitor.init();
  logger.info('Connection monitoring initialized');

  // Log application start
  logger.info('Application started', {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language
  });
};

/**
 * Usage in App.js:
 * 
 * import { initializeMonitoring } from './examples/MonitoringIntegration';
 * import MonitoringDashboard from './components/MonitoringDashboard';
 * import ConnectionStatusIndicator from './components/ConnectionStatusIndicator';
 * 
 * function App() {
 *   useEffect(() => {
 *     initializeMonitoring();
 *   }, []);
 * 
 *   return (
 *     <div className="App">
 *       <ConnectionStatusIndicator />
 *       <YourComponents />
 *       <MonitoringDashboard />
 *     </div>
 *   );
 * }
 */
