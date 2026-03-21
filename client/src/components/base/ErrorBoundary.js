import React from 'react';

/**
 * Enhanced ErrorBoundary - Professional error boundary component system
 * Provides graceful error handling for the trading platform with specialized error types
 */

// Error logging utility
const logError = (error, errorInfo, context = 'general') => {
  const errorData = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    errorInfo,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
  
  console.error('Trading Platform Error:', errorData);
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, errorData);
  }
};

// Base ErrorBoundary class with enhanced functionality
class BaseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    logError(error, errorInfo, this.props.context || 'general');
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { 
        fallback: CustomFallback, 
        title = "Something went wrong",
        message = "We're sorry, but something unexpected happened.",
        showRetry = true,
        showRefresh = true,
        compact = false
      } = this.props;

      if (CustomFallback) {
        return (
          <CustomFallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onRefresh={this.handleRefresh}
            retryCount={this.state.retryCount}
          />
        );
      }

      const containerClass = compact 
        ? "flex items-center justify-center p-4 bg-neutral-50 rounded-lg border border-neutral-200"
        : "min-h-screen flex items-center justify-center bg-neutral-50";

      return (
        <div className={containerClass}>
          <div className={`card ${compact ? 'max-w-sm' : 'max-w-md'} text-center`}>
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className={`font-semibold text-neutral-900 mb-2 ${compact ? 'text-lg' : 'text-xl'}`}>
              {title}
            </h2>
            <p className={`text-neutral-600 mb-6 ${compact ? 'text-sm' : ''}`}>
              {message}
            </p>
            <div className="flex gap-3 justify-center">
              {showRetry && (
                <button
                  onClick={this.handleRetry}
                  className="btn-secondary"
                  disabled={this.state.retryCount >= 3}
                >
                  {this.state.retryCount >= 3 ? 'Max Retries' : 'Try Again'}
                </button>
              )}
              {showRefresh && (
                <button
                  onClick={this.handleRefresh}
                  className="btn-primary"
                >
                  Refresh Page
                </button>
              )}
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-neutral-500">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-neutral-600 bg-neutral-100 p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main ErrorBoundary (backward compatibility)
class ErrorBoundary extends BaseErrorBoundary {
  render() {
    return super.render();
  }
}

// Specialized Chart Error Boundary
class ChartErrorBoundary extends BaseErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="chart-error-container p-6 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
          <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Chart Unavailable
          </h3>
          <p className="text-neutral-600 mb-4 text-sm">
            Unable to load chart data. This may be due to a temporary network issue.
          </p>
          <button
            onClick={this.handleRetry}
            className="btn-secondary btn-sm"
            disabled={this.state.retryCount >= 3}
          >
            {this.state.retryCount >= 3 ? 'Service Unavailable' : 'Reload Chart'}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Trading Interface Error Boundary
class TradingErrorBoundary extends BaseErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="trading-error-container p-6 bg-error-50 rounded-lg border border-error-200 text-center">
          <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-error-900 mb-2">
            Trading Interface Error
          </h3>
          <p className="text-error-700 mb-4 text-sm">
            The trading interface encountered an error. Please refresh to continue trading safely.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={this.handleRetry}
              className="btn-secondary btn-sm"
              disabled={this.state.retryCount >= 2}
            >
              {this.state.retryCount >= 2 ? 'Contact Support' : 'Try Again'}
            </button>
            <button
              onClick={this.handleRefresh}
              className="btn-primary btn-sm"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Network Error Boundary with automatic retry
class NetworkErrorBoundary extends BaseErrorBoundary {
  constructor(props) {
    super(props);
    this.retryTimer = null;
  }

  componentDidCatch(error, errorInfo) {
    super.componentDidCatch(error, errorInfo);
    
    // Auto-retry for network errors
    if (this.isNetworkError(error) && this.state.retryCount < 3) {
      this.retryTimer = setTimeout(() => {
        this.handleRetry();
      }, Math.pow(2, this.state.retryCount) * 1000); // Exponential backoff
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  isNetworkError = (error) => {
    return error.message.includes('fetch') || 
           error.message.includes('network') || 
           error.message.includes('Failed to load');
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.isNetworkError(this.state.error);
      
      return (
        <div className="network-error-container p-4 bg-warning-50 rounded-lg border border-warning-200 text-center">
          <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <h4 className="font-semibold text-warning-900 mb-2">
            {isNetworkError ? 'Connection Issue' : 'Data Loading Error'}
          </h4>
          <p className="text-warning-700 text-sm mb-3">
            {isNetworkError 
              ? 'Checking connection and retrying automatically...'
              : 'Unable to load data. Please try again.'
            }
          </p>
          {this.state.retryCount < 3 && isNetworkError && (
            <div className="flex items-center justify-center gap-2 text-xs text-warning-600">
              <div className="animate-spin w-4 h-4 border-2 border-warning-300 border-t-warning-600 rounded-full"></div>
              Retry attempt {this.state.retryCount + 1} of 3
            </div>
          )}
          {(!isNetworkError || this.state.retryCount >= 3) && (
            <button
              onClick={this.handleRetry}
              className="btn-secondary btn-sm"
            >
              Try Again
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Data Processing Error Boundary
class DataErrorBoundary extends BaseErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="data-error-container p-4 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
          <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="font-semibold text-neutral-900 mb-2 text-sm">
            Data Processing Error
          </h4>
          <p className="text-neutral-600 text-xs mb-3">
            Unable to process the data. Using cached information where available.
          </p>
          <button
            onClick={this.handleRetry}
            className="btn-secondary btn-sm text-xs"
          >
            Refresh Data
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
export { 
  BaseErrorBoundary,
  ChartErrorBoundary, 
  TradingErrorBoundary, 
  NetworkErrorBoundary, 
  DataErrorBoundary 
};