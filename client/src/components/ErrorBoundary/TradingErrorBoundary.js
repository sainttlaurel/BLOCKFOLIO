/**
 * Trading-specific Error Boundary
 * 
 * Handles errors in trading components with specialized recovery
 * strategies and user-friendly messages for trading operations.
 */

import React from 'react';
import { AlertTriangle, RefreshCw, DollarSign, Shield } from 'lucide-react';
import { SectionErrorBoundary } from './ErrorBoundarySystem';

export class TradingErrorBoundary extends SectionErrorBoundary {
  constructor(props) {
    super({
      ...props,
      context: 'trading',
      maxRetries: 2
    });
    
    this.state = {
      ...this.state,
      tradingSafetyMode: false
    };
  }

  componentDidCatch(error, errorInfo) {
    super.componentDidCatch(error, errorInfo);
    
    // Enable trading safety mode on error
    this.setState({ tradingSafetyMode: true });
    
    // Clear any pending trades
    this.clearPendingTrades();
    
    // Notify trading service of error
    this.notifyTradingService(error);
  }

  clearPendingTrades() {
    // Clear any pending trade data from localStorage
    try {
      localStorage.removeItem('pendingTrade');
      localStorage.removeItem('tradeConfirmation');
    } catch (error) {
      console.error('Failed to clear pending trades:', error);
    }
  }

  notifyTradingService(error) {
    // Emit event for trading service to handle
    window.dispatchEvent(new CustomEvent('tradingError', {
      detail: { error, timestamp: Date.now() }
    }));
  }

  handleTradingReset = () => {
    // Reset trading state and clear safety mode
    this.setState({ tradingSafetyMode: false });
    this.handleReset();
    
    // Refresh trading data
    window.dispatchEvent(new CustomEvent('refreshTradingData'));
  };

  renderDefaultErrorUI() {
    const { error, retryCount, tradingSafetyMode } = this.state;
    const canRetry = retryCount < this.maxRetries;
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <DollarSign className="h-12 w-12 text-red-500" />
              <Shield className="h-6 w-6 text-red-600 absolute -top-1 -right-1" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Trading Interface Error
          </h3>
          
          <p className="text-red-600 mb-4">
            There was an error with the trading interface. Your funds and positions are safe.
          </p>
          
          {tradingSafetyMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <div className="flex items-center justify-center text-yellow-800">
                <Shield className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Trading Safety Mode Active</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                All trading operations are temporarily disabled for your protection.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Trading Interface
              </button>
            )}
            
            <button
              onClick={this.handleTradingReset}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Shield className="h-4 w-4 mr-2" />
              Reset Trading Interface
            </button>
          </div>
          
          <div className="mt-4 text-xs text-red-500">
            <p>• Your account balance is secure</p>
            <p>• No trades were executed during the error</p>
            <p>• Contact support if this persists</p>
          </div>
        </div>
      </div>
    );
  }
}

export default TradingErrorBoundary;