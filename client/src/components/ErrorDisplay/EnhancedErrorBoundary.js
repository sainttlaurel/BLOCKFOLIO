/**
 * Enhanced Error Boundary Component
 * 
 * Integrates with the error message service to provide user-friendly
 * error displays with recovery options and contextual guidance.
 */

import React from 'react';
import { BaseErrorBoundary } from '../ErrorBoundary/ErrorBoundarySystem';
import UserFriendlyErrorDisplay from './UserFriendlyErrorDisplay';
import errorMessageService from '../../services/errorMessageService';

export class EnhancedErrorBoundary extends BaseErrorBoundary {
  constructor(props) {
    super(props);
    
    this.state = {
      ...this.state,
      errorResponse: null,
      showRecoveryPanel: false
    };
  }

  componentDidCatch(error, errorInfo) {
    super.componentDidCatch(error, errorInfo);
    
    // Process error through error message service
    const errorResponse = errorMessageService.processError(error, {
      currentPage: window.location.pathname,
      userAction: this.props.context,
      componentStack: errorInfo.componentStack,
      retryFunction: this.handleRetry
    });
    
    this.setState({ errorResponse });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorResponse: null,
      retryCount: this.state.retryCount + 1
    });
  };

  handleShowRecoveryPanel = () => {
    this.setState({ showRecoveryPanel: true });
  };

  render() {
    if (this.state.hasError && this.state.errorResponse) {
      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        return React.createElement(this.props.fallbackComponent, {
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          errorResponse: this.state.errorResponse,
          retry: this.handleRetry,
          reset: this.handleReset,
          canRetry: this.state.retryCount < this.maxRetries
        });
      }
      
      // Use user-friendly error display
      return (
        <div className="min-h-64 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <UserFriendlyErrorDisplay
              error={this.state.error}
              onRetry={this.handleRetry}
              showDetails={this.props.showDetails}
              className="shadow-lg"
            />
            
            {this.props.showRecoveryPanel && (
              <div className="mt-4 text-center">
                <button
                  onClick={this.handleShowRecoveryPanel}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Open Recovery Center
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Enhanced App-level Error Boundary
 */
export class EnhancedAppErrorBoundary extends EnhancedErrorBoundary {
  constructor(props) {
    super({
      ...props,
      level: 'app',
      context: 'app',
      maxRetries: 1,
      showDetails: true,
      showRecoveryPanel: true
    });
  }

  render() {
    if (this.state.hasError && this.state.errorResponse) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
          <div className="max-w-2xl w-full space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Application Error
              </h1>
              <p className="text-gray-600">
                The application encountered a critical error. We apologize for the inconvenience.
              </p>
            </div>
            
            <UserFriendlyErrorDisplay
              error={this.state.error}
              onRetry={this.handleRetry}
              showDetails={true}
              className="shadow-xl"
            />
            
            <div className="text-center space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Reload Application
              </button>
              
              <button
                onClick={this.handleShowRecoveryPanel}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Open Recovery Center for Advanced Options
              </button>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>Error ID: {this.state.errorResponse?.id}</p>
              <p>If this problem persists, please contact support.</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Enhanced Trading Error Boundary
 */
export class EnhancedTradingErrorBoundary extends EnhancedErrorBoundary {
  constructor(props) {
    super({
      ...props,
      context: 'trading',
      maxRetries: 2,
      showDetails: false,
      showRecoveryPanel: true
    });
    
    this.state = {
      ...this.state,
      tradingSafetyMode: false
    };
  }

  componentDidCatch(error, errorInfo) {
    super.componentDidCatch(error, errorInfo);
    
    // Enable trading safety mode
    this.setState({ tradingSafetyMode: true });
    
    // Clear any pending trades
    this.clearPendingTrades();
    
    // Notify trading service
    this.notifyTradingService(error);
  }

  clearPendingTrades() {
    try {
      localStorage.removeItem('pendingTrade');
      localStorage.removeItem('tradeConfirmation');
    } catch (error) {
      console.error('Failed to clear pending trades:', error);
    }
  }

  notifyTradingService(error) {
    window.dispatchEvent(new CustomEvent('tradingError', {
      detail: { error, timestamp: Date.now() }
    }));
  }

  render() {
    if (this.state.hasError && this.state.errorResponse) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          {this.state.tradingSafetyMode && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center text-yellow-800">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2" />
                <span className="text-sm font-medium">Trading Safety Mode Active</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                All trading operations are temporarily disabled for your protection.
              </p>
            </div>
          )}
          
          <UserFriendlyErrorDisplay
            error={this.state.error}
            onRetry={this.handleRetry}
            showDetails={this.props.showDetails}
            className="bg-white"
          />
          
          <div className="mt-4 text-xs text-red-600 space-y-1">
            <p>• Your account balance is secure</p>
            <p>• No trades were executed during the error</p>
            <p>• Contact support if this persists</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Enhanced Chart Error Boundary
 */
export class EnhancedChartErrorBoundary extends EnhancedErrorBoundary {
  constructor(props) {
    super({
      ...props,
      context: 'charts',
      maxRetries: 3,
      showDetails: false
    });
    
    this.state = {
      ...this.state,
      fallbackMode: false,
      chartType: props.chartType || 'unknown'
    };
  }

  componentDidCatch(error, errorInfo) {
    super.componentDidCatch(error, errorInfo);
    
    // Enable fallback mode for simpler chart rendering
    this.setState({ fallbackMode: true });
    
    // Clear chart cache
    this.clearChartCache();
  }

  clearChartCache() {
    try {
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes('chart') || key.includes('Chart')
      );
      cacheKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear chart cache:', error);
    }
  }

  renderFallbackChart() {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-gray-400 text-xl">📊</span>
        </div>
        <h4 className="text-lg font-medium text-gray-600 mb-2">
          Chart Temporarily Unavailable
        </h4>
        <p className="text-gray-500 mb-4">
          The {this.state.chartType} chart is experiencing issues. Market data is still being updated.
        </p>
        <button
          onClick={this.handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry Chart
        </button>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.state.fallbackMode) {
        return this.renderFallbackChart();
      }
      
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <UserFriendlyErrorDisplay
            error={this.state.error}
            onRetry={this.handleRetry}
            compact={true}
            className="bg-white"
          />
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping components with enhanced error boundaries
 */
export const withEnhancedErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = React.forwardRef((props, ref) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </EnhancedErrorBoundary>
  ));
  
  WrappedComponent.displayName = `withEnhancedErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default EnhancedErrorBoundary;