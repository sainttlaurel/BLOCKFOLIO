/**
 * Chart-specific Error Boundary
 * 
 * Handles errors in chart components with fallback to simpler
 * chart types and data recovery strategies.
 */

import React from 'react';
import { BarChart3, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { ComponentErrorBoundary } from './ErrorBoundarySystem';

export class ChartErrorBoundary extends ComponentErrorBoundary {
  constructor(props) {
    super({
      ...props,
      context: 'charts',
      maxRetries: 3
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
      // Clear chart-related cache entries
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes('chart') || key.includes('Chart')
      );
      cacheKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear chart cache:', error);
    }
  }

  handleChartRetry = () => {
    // Reset fallback mode and retry
    this.setState({ fallbackMode: false });
    this.handleRetry();
  };

  renderFallbackChart() {
    const { chartType } = this.state;
    
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-600 mb-2">
          Chart Temporarily Unavailable
        </h4>
        <p className="text-gray-500 mb-4">
          The {chartType} chart is experiencing issues. Market data is still being updated.
        </p>
        <button
          onClick={this.handleChartRetry}
          className="flex items-center justify-center mx-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Chart
        </button>
      </div>
    );
  }

  renderDefaultErrorUI() {
    const { error, retryCount, fallbackMode, chartType } = this.state;
    const canRetry = retryCount < this.maxRetries;
    
    if (fallbackMode) {
      return this.renderFallbackChart();
    }
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-blue-500 mx-auto mb-3" />
          
          <h4 className="text-md font-semibold text-blue-800 mb-2">
            Chart Loading Error
          </h4>
          
          <p className="text-blue-600 text-sm mb-4">
            Unable to load the {chartType} chart. Market data may be temporarily unavailable.
          </p>
          
          <div className="space-y-2">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry ({this.maxRetries - retryCount} left)
              </button>
            )}
            
            <button
              onClick={() => this.setState({ fallbackMode: true })}
              className="w-full flex items-center justify-center px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Show Fallback Chart
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ChartErrorBoundary;