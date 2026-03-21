/**
 * Higher-Order Component for Error Boundary Wrapping
 * Provides easy error boundary integration for any component
 */

import React from 'react';
import { 
  BaseErrorBoundary, 
  ChartErrorBoundary, 
  TradingErrorBoundary, 
  NetworkErrorBoundary, 
  DataErrorBoundary 
} from './ErrorBoundary';
import { createErrorBoundaryConfig } from '../../utils/errorHandling';

// Error boundary type mapping
const ERROR_BOUNDARY_TYPES = {
  base: BaseErrorBoundary,
  chart: ChartErrorBoundary,
  trading: TradingErrorBoundary,
  network: NetworkErrorBoundary,
  data: DataErrorBoundary
};

/**
 * Higher-order component that wraps a component with an error boundary
 * 
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Object} options - Error boundary configuration
 * @param {string} options.type - Type of error boundary ('base', 'chart', 'trading', 'network', 'data')
 * @param {string} options.context - Context for error logging
 * @param {string} options.title - Custom error title
 * @param {string} options.message - Custom error message
 * @param {boolean} options.showRetry - Show retry button
 * @param {boolean} options.showRefresh - Show refresh button
 * @param {boolean} options.compact - Use compact error display
 * @param {number} options.maxRetries - Maximum retry attempts
 * @param {React.Component} options.fallback - Custom fallback component
 */
export const withErrorBoundary = (WrappedComponent, options = {}) => {
  const {
    type = 'base',
    context = WrappedComponent.displayName || WrappedComponent.name || 'Component',
    ...boundaryOptions
  } = options;

  const ErrorBoundaryComponent = ERROR_BOUNDARY_TYPES[type] || BaseErrorBoundary;
  const config = createErrorBoundaryConfig(context, boundaryOptions);

  const WithErrorBoundaryComponent = React.forwardRef((props, ref) => {
    return (
      <ErrorBoundaryComponent {...config}>
        <WrappedComponent {...props} ref={ref} />
      </ErrorBoundaryComponent>
    );
  });

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithErrorBoundaryComponent;
};

/**
 * Specialized HOCs for different error boundary types
 */

export const withChartErrorBoundary = (WrappedComponent, options = {}) => 
  withErrorBoundary(WrappedComponent, { type: 'chart', context: 'Chart', ...options });

export const withTradingErrorBoundary = (WrappedComponent, options = {}) => 
  withErrorBoundary(WrappedComponent, { type: 'trading', context: 'Trading', ...options });

export const withNetworkErrorBoundary = (WrappedComponent, options = {}) => 
  withErrorBoundary(WrappedComponent, { type: 'network', context: 'Network', ...options });

export const withDataErrorBoundary = (WrappedComponent, options = {}) => 
  withErrorBoundary(WrappedComponent, { type: 'data', context: 'Data', ...options });

/**
 * React Hook for error boundary context
 */
export const useErrorHandler = (context = 'Component') => {
  const [error, setError] = React.useState(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const handleError = React.useCallback((error, errorInfo) => {
    setError({ error, errorInfo });
    console.error(`Error in ${context}:`, error, errorInfo);
  }, [context]);

  const retry = React.useCallback(() => {
    setError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  const reset = React.useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  return {
    error,
    retryCount,
    handleError,
    retry,
    reset,
    hasError: !!error
  };
};

/**
 * Error boundary decorator for class components
 */
export const errorBoundary = (options = {}) => (target) => {
  return withErrorBoundary(target, options);
};

/**
 * Utility function to create error boundary wrapper components
 */
export const createErrorBoundaryWrapper = (type, defaultOptions = {}) => {
  return (WrappedComponent, options = {}) => {
    const mergedOptions = { type, ...defaultOptions, ...options };
    return withErrorBoundary(WrappedComponent, mergedOptions);
  };
};

// Pre-configured error boundary wrappers
export const ChartErrorWrapper = createErrorBoundaryWrapper('chart', {
  context: 'Chart',
  title: 'Chart Error',
  message: 'Unable to display chart data',
  compact: true
});

export const TradingErrorWrapper = createErrorBoundaryWrapper('trading', {
  context: 'Trading',
  title: 'Trading Error',
  message: 'Trading operation failed',
  maxRetries: 2
});

export const NetworkErrorWrapper = createErrorBoundaryWrapper('network', {
  context: 'Network',
  title: 'Connection Error',
  message: 'Network connection issue',
  compact: true
});

export const DataErrorWrapper = createErrorBoundaryWrapper('data', {
  context: 'Data',
  title: 'Data Error',
  message: 'Data processing failed',
  compact: true
});

export default withErrorBoundary;