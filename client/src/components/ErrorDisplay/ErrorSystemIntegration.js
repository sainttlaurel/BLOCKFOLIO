/**
 * Error System Integration Component
 * 
 * Integrates all error handling, messaging, and recovery systems into a
 * cohesive user experience with the existing trading platform infrastructure.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Settings, Activity } from 'lucide-react';
import ErrorNotificationSystem from './ErrorNotificationSystem';
import ErrorStatusDashboard from './ErrorStatusDashboard';
import ErrorRecoveryPanel from './ErrorRecoveryPanel';
import { EnhancedAppErrorBoundary } from './EnhancedErrorBoundary';
import errorMessageService from '../../services/errorMessageService';
import errorPreventionService from '../../services/errorPreventionService';

const ErrorSystemIntegration = ({ children }) => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [showRecoveryPanel, setShowRecoveryPanel] = useState(false);
  const [systemHealth, setSystemHealth] = useState('good');
  const [errorCount, setErrorCount] = useState(0);
  const [preventionWarnings, setPreventionWarnings] = useState(0);

  useEffect(() => {
    // Listen to error system events
    const handleErrorProcessed = (errorResponse) => {
      setErrorCount(prev => prev + 1);
      
      // Auto-open dashboard for critical errors
      if (errorResponse.severity === 'critical') {
        setShowDashboard(true);
      }
    };

    const handleSystemHealthUpdate = (health) => {
      setSystemHealth(getOverallHealthStatus(health));
    };

    const handleProactiveWarning = (warning) => {
      setPreventionWarnings(prev => prev + 1);
      
      // Auto-open dashboard for high-priority warnings
      if (warning.severity === 'error') {
        setShowDashboard(true);
      }
    };

    const handleRecoveryActionExecuted = (data) => {
      if (data.success) {
        setErrorCount(prev => Math.max(0, prev - 1));
      }
    };

    // Setup event listeners
    errorMessageService.on('errorProcessed', handleErrorProcessed);
    errorPreventionService.on('systemHealthUpdated', handleSystemHealthUpdate);
    errorPreventionService.on('proactiveWarning', handleProactiveWarning);
    errorMessageService.on('recoveryActionExecuted', handleRecoveryActionExecuted);

    return () => {
      errorMessageService.off('errorProcessed', handleErrorProcessed);
      errorPreventionService.off('systemHealthUpdated', handleSystemHealthUpdate);
      errorPreventionService.off('proactiveWarning', handleProactiveWarning);
      errorMessageService.off('recoveryActionExecuted', handleRecoveryActionExecuted);
    };
  }, []);

  const getOverallHealthStatus = (health) => {
    if (!health) return 'good';
    
    const connectionScore = health.connection?.quality || 1;
    const performanceScore = health.performance?.score || 1;
    const memoryScore = health.memory?.score || 1;
    const errorScore = health.errors?.score || 1;
    
    const overallScore = (connectionScore + performanceScore + memoryScore + errorScore) / 4;
    
    if (overallScore >= 0.8) return 'good';
    if (overallScore >= 0.6) return 'fair';
    return 'poor';
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <EnhancedAppErrorBoundary>
      {/* Main Application Content */}
      {children}

      {/* Error Notification System */}
      <ErrorNotificationSystem
        position="top-right"
        maxNotifications={3}
        autoHideDelay={5000}
        enableSound={true}
      />

      {/* System Health Indicator */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="flex items-center space-x-2">
          {/* Error Count Badge */}
          {errorCount > 0 && (
            <button
              onClick={() => setShowDashboard(true)}
              className="relative bg-red-100 text-red-700 px-3 py-2 rounded-lg shadow-lg hover:bg-red-200 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">{errorCount}</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </button>
          )}

          {/* Prevention Warnings Badge */}
          {preventionWarnings > 0 && (
            <button
              onClick={() => setShowDashboard(true)}
              className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg shadow-lg hover:bg-yellow-200 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">{preventionWarnings}</span>
              </div>
            </button>
          )}

          {/* System Health Indicator */}
          <button
            onClick={() => setShowDashboard(true)}
            className="bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            title={`System health: ${systemHealth}`}
          >
            <div className="flex items-center space-x-2">
              <Activity className={`h-4 w-4 ${getHealthColor(systemHealth)}`} />
              <span className={`text-sm font-medium capitalize ${getHealthColor(systemHealth)}`}>
                {systemHealth}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Error Status Dashboard */}
      {showDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-full overflow-hidden">
            <ErrorStatusDashboard
              isOpen={true}
              onClose={() => setShowDashboard(false)}
              className="max-h-full"
            />
          </div>
        </div>
      )}

      {/* Error Recovery Panel */}
      {showRecoveryPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-full overflow-hidden">
            <ErrorRecoveryPanel
              isOpen={true}
              onClose={() => setShowRecoveryPanel(false)}
              className="max-h-full"
            />
          </div>
        </div>
      )}

      {/* Global Error System Styles */}
      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        @keyframes pulse-error {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse-error {
          animation: pulse-error 2s infinite;
        }
        
        /* Error system color utilities */
        .text-error-50 { color: #fef2f2; }
        .text-error-100 { color: #fee2e2; }
        .text-error-200 { color: #fecaca; }
        .text-error-300 { color: #fca5a5; }
        .text-error-400 { color: #f87171; }
        .text-error-500 { color: #ef4444; }
        .text-error-600 { color: #dc2626; }
        .text-error-700 { color: #b91c1c; }
        .text-error-800 { color: #991b1b; }
        .text-error-900 { color: #7f1d1d; }
        
        .bg-error-50 { background-color: #fef2f2; }
        .bg-error-100 { background-color: #fee2e2; }
        .bg-error-200 { background-color: #fecaca; }
        .bg-error-300 { background-color: #fca5a5; }
        .bg-error-400 { background-color: #f87171; }
        .bg-error-500 { background-color: #ef4444; }
        .bg-error-600 { background-color: #dc2626; }
        .bg-error-700 { background-color: #b91c1c; }
        .bg-error-800 { background-color: #991b1b; }
        .bg-error-900 { background-color: #7f1d1d; }
        
        .border-error-200 { border-color: #fecaca; }
        .border-error-300 { border-color: #fca5a5; }
        .border-error-400 { border-color: #f87171; }
        .border-error-500 { border-color: #ef4444; }
        .border-error-600 { border-color: #dc2626; }
      `}</style>
    </EnhancedAppErrorBoundary>
  );
};

/**
 * Hook for accessing error system functionality
 */
export const useErrorSystem = () => {
  const [errorStats, setErrorStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [preventionData, setPreventionData] = useState(null);

  useEffect(() => {
    const updateStats = () => {
      setErrorStats(errorMessageService.getErrorStatistics());
      setPreventionData(errorPreventionService.getPreventionStatistics());
    };

    const handleSystemHealthUpdate = (health) => {
      setSystemHealth(health);
    };

    // Initial load
    updateStats();

    // Setup listeners
    errorPreventionService.on('systemHealthUpdated', handleSystemHealthUpdate);
    
    // Update stats periodically
    const interval = setInterval(updateStats, 30000); // 30 seconds

    return () => {
      errorPreventionService.off('systemHealthUpdated', handleSystemHealthUpdate);
      clearInterval(interval);
    };
  }, []);

  const processError = (error, context = {}) => {
    return errorMessageService.processError(error, context);
  };

  const executeRecoveryAction = (actionKey, errorResponse, options = {}) => {
    return errorMessageService.executeRecoveryAction(actionKey, errorResponse, options);
  };

  const validateInput = (input, context = {}) => {
    return errorPreventionService.validateInput(input, context);
  };

  const getPreventionRecommendations = () => {
    return errorPreventionService.getPreventionRecommendations();
  };

  return {
    errorStats,
    systemHealth,
    preventionData,
    processError,
    executeRecoveryAction,
    validateInput,
    getPreventionRecommendations
  };
};

/**
 * HOC for wrapping components with error system integration
 */
export const withErrorSystem = (Component) => {
  const WrappedComponent = React.forwardRef((props, ref) => (
    <ErrorSystemIntegration>
      <Component {...props} ref={ref} />
    </ErrorSystemIntegration>
  ));
  
  WrappedComponent.displayName = `withErrorSystem(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorSystemIntegration;