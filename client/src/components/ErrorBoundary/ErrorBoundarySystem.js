/**
 * Comprehensive Error Boundary System
 * 
 * Provides hierarchical error boundaries with different recovery strategies,
 * error reporting, and graceful degradation for different parts of the application.
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Base Error Boundary with comprehensive error handling
 */
export class BaseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isExpanded: false
    };
    
    this.maxRetries = props.maxRetries || 3;
    this.retryDelay = props.retryDelay || 1000;
    this.onError = props.onError;
    this.fallbackComponent = props.fallbackComponent;
    this.level = props.level || 'component';
    this.context = props.context || 'unknown';
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorDetails = {
      error,
      errorInfo,
      level: this.level,
      context: this.context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    };

    this.setState({ errorInfo });
    
    // Report error
    this.reportError(errorDetails);
    
    // Call custom error handler
    if (this.onError) {
      this.onError(errorDetails);
    }
    
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  getUserId() {
    // Get user ID from auth context or localStorage
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  getSessionId() {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  reportError(errorDetails) {
    // Report to error tracking service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: errorDetails.error.message,
        fatal: this.level === 'app',
        custom_map: {
          level: errorDetails.level,
          context: errorDetails.context,
          errorId: this.state.errorId
        }
      });
    }
    
    // Send to backend error reporting
    this.sendErrorReport(errorDetails);
  }

  async sendErrorReport(errorDetails) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...errorDetails,
          stack: errorDetails.error.stack,
          message: errorDetails.error.message,
          name: errorDetails.error.name
        })
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
      
      // Add delay before retry
      setTimeout(() => {
        // Force re-render
        this.forceUpdate();
      }, this.retryDelay);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isExpanded: false
    });
  };

  toggleExpanded = () => {
    this.setState(prevState => ({
      isExpanded: !prevState.isExpanded
    }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.fallbackComponent) {
        return React.createElement(this.fallbackComponent, {
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retry: this.handleRetry,
          reset: this.handleReset,
          canRetry: this.state.retryCount < this.maxRetries
        });
      }
      
      // Default error UI based on level
      return this.renderDefaultErrorUI();
    }

    return this.props.children;
  }

  renderDefaultErrorUI() {
    const { error, errorInfo, retryCount, isExpanded } = this.state;
    const canRetry = retryCount < this.maxRetries;
    
    const levelStyles = {
      app: 'min-h-screen bg-red-50',
      page: 'min-h-96 bg-red-50 rounded-lg',
      section: 'min-h-32 bg-red-50 rounded-md',
      component: 'min-h-16 bg-red-50 rounded'
    };
    
    const containerClass = levelStyles[this.level] || levelStyles.component;
    
    return (
      <div className={`${containerClass} flex flex-col items-center justify-center p-6 border border-red-200`}>
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            {this.getErrorTitle()}
          </h2>
          
          <p className="text-red-600 mb-4">
            {this.getErrorMessage()}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center mb-4">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry ({this.maxRetries - retryCount} left)
              </button>
            )}
            
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="text-left">
              <button
                onClick={this.toggleExpanded}
                className="flex items-center text-sm text-red-600 hover:text-red-800 mb-2"
              >
                <Bug className="h-4 w-4 mr-1" />
                Error Details
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </button>
              
              {isExpanded && (
                <div className="bg-red-100 p-3 rounded text-xs font-mono text-left overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {error?.message}
                  </div>
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{error?.stack}</pre>
                  </div>
                  {errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="text-xs text-red-500 mt-2">
            Error ID: {this.state.errorId}
          </div>
        </div>
      </div>
    );
  }

  getErrorTitle() {
    switch (this.level) {
      case 'app':
        return 'Application Error';
      case 'page':
        return 'Page Error';
      case 'section':
        return 'Section Error';
      default:
        return 'Component Error';
    }
  }

  getErrorMessage() {
    const contextMessages = {
      trading: 'There was an error with the trading interface. Your data is safe.',
      portfolio: 'There was an error loading your portfolio. Please try again.',
      charts: 'There was an error loading the charts. Market data may be temporarily unavailable.',
      market: 'There was an error loading market data. Please check your connection.',
      auth: 'There was an authentication error. Please try logging in again.'
    };
    
    return contextMessages[this.context] || 'Something went wrong. Please try again.';
  }
}

/**
 * App-level Error Boundary
 */
export class AppErrorBoundary extends BaseErrorBoundary {
  constructor(props) {
    super({
      ...props,
      level: 'app',
      context: 'app',
      maxRetries: 1
    });
  }

  handleAppError = () => {
    // Clear all local storage and reload
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  renderDefaultErrorUI() {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-lg">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            Application Error
          </h1>
          
          <p className="text-red-600 mb-6">
            The application encountered a critical error. We apologize for the inconvenience.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Reload Application
            </button>
            
            <button
              onClick={this.handleAppError}
              className="w-full flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home className="h-5 w-5 mr-2" />
              Reset & Reload
            </button>
          </div>
          
          <div className="mt-6 text-sm text-red-500">
            <p>Error ID: {this.state.errorId}</p>
            <p>If this problem persists, please contact support.</p>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Page-level Error Boundary
 */
export class PageErrorBoundary extends BaseErrorBoundary {
  constructor(props) {
    super({
      ...props,
      level: 'page',
      maxRetries: 2
    });
  }
}

/**
 * Section-level Error Boundary
 */
export class SectionErrorBoundary extends BaseErrorBoundary {
  constructor(props) {
    super({
      ...props,
      level: 'section',
      maxRetries: 3
    });
  }
}

/**
 * Component-level Error Boundary
 */
export class ComponentErrorBoundary extends BaseErrorBoundary {
  constructor(props) {
    super({
      ...props,
      level: 'component',
      maxRetries: 5
    });
  }
}

/**
 * Async Error Boundary for handling async errors
 */
export class AsyncErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidMount() {
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Report the error
    if (this.props.onAsyncError) {
      this.props.onAsyncError(event.reason);
    }
    
    // Optionally prevent the default browser behavior
    if (this.props.preventDefault) {
      event.preventDefault();
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">An async operation failed. Please try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping components with error boundaries
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = React.forwardRef((props, ref) => (
    <ComponentErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </ComponentErrorBoundary>
  ));
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Hook for handling errors in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);
  
  const handleError = React.useCallback((error) => {
    console.error('Error handled by useErrorHandler:', error);
    setError(error);
    
    // Report error
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }, []);
  
  // Throw error to be caught by error boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  return { handleError, resetError };
};

/**
 * Error reporting utilities
 */
export const ErrorReporter = {
  report: (error, context = {}) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };
    
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: context
      });
    }
    
    // Send to backend
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    }).catch(reportError => {
      console.error('Failed to report error:', reportError);
    });
  }
};

export default {
  BaseErrorBoundary,
  AppErrorBoundary,
  PageErrorBoundary,
  SectionErrorBoundary,
  ComponentErrorBoundary,
  AsyncErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
  ErrorReporter
};