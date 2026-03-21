import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import { ChartErrorBoundary } from './ErrorBoundary';
import { withChartErrorBoundary } from './withErrorBoundary';

/**
 * BaseChart - Base chart component wrapper with error boundary integration
 * Provides common chart functionality, loading states, and error handling
 */
const BaseChart = ({ 
  children, 
  loading = false, 
  error = null,
  title,
  height = 'h-64',
  className = '',
  onRetry,
  enableErrorBoundary = true
}) => {
  if (loading) {
    return (
      <div className={`chart-container ${height} ${className}`}>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`chart-container ${height} ${className}`}>
        <div className="flex items-center justify-center h-full text-neutral-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mb-2">Chart data unavailable</p>
            {onRetry && (
              <button 
                onClick={onRetry}
                className="btn-secondary btn-sm"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const chartContent = (
    <div className={`chart-container ${height} ${className}`}>
      {title && (
        <div className="chart-header mb-2">
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        </div>
      )}
      <div className="chart-content h-full">
        {children}
      </div>
    </div>
  );

  // Wrap with error boundary if enabled
  if (enableErrorBoundary) {
    return (
      <ChartErrorBoundary>
        {chartContent}
      </ChartErrorBoundary>
    );
  }

  return chartContent;
};

// Enhanced BaseChart with HOC error boundary
export const SafeBaseChart = withChartErrorBoundary(BaseChart, {
  title: 'Chart Error',
  message: 'Unable to render chart. This may be due to invalid data or a rendering issue.',
  compact: true
});

export default BaseChart;