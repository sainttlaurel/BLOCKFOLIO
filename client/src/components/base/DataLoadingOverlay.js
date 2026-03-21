import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * DataLoadingOverlay - Specialized overlay for data fetching operations
 * Provides non-blocking loading states with contextual information
 * Requirements: 7.6 - Loading states and skeleton screens for data fetching operations
 */
const DataLoadingOverlay = ({
  isLoading = false,
  message = 'Loading data...',
  subMessage = '',
  variant = 'overlay',
  position = 'center',
  glassMorphism = true,
  showSpinner = true,
  spinnerSize = 'md',
  spinnerColor = 'brand',
  timeout = null,
  onTimeout = null,
  className = '',
  children
}) => {
  const [isVisible, setIsVisible] = React.useState(isLoading);
  const [hasTimedOut, setHasTimedOut] = React.useState(false);
  const timeoutRef = React.useRef(null);

  React.useEffect(() => {
    setIsVisible(isLoading);
    setHasTimedOut(false);

    if (isLoading && timeout) {
      timeoutRef.current = setTimeout(() => {
        setHasTimedOut(true);
        if (onTimeout) {
          onTimeout();
        }
      }, timeout);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, timeout, onTimeout]);

  if (!isVisible) {
    return children;
  }

  const getOverlayClasses = () => {
    const baseClasses = ['data-loading-overlay'];
    
    switch (variant) {
      case 'overlay':
        baseClasses.push('absolute inset-0 z-20');
        break;
      case 'inline':
        baseClasses.push('relative');
        break;
      case 'modal':
        baseClasses.push('fixed inset-0 z-50');
        break;
      default:
        baseClasses.push('absolute inset-0 z-20');
    }

    if (glassMorphism) {
      baseClasses.push('bg-glass-medium backdrop-blur-medium');
    } else {
      baseClasses.push('bg-surface-overlay');
    }

    return baseClasses.join(' ');
  };

  const getContentClasses = () => {
    const baseClasses = ['flex flex-col items-center justify-center h-full'];
    
    switch (position) {
      case 'top':
        baseClasses.push('justify-start pt-8');
        break;
      case 'bottom':
        baseClasses.push('justify-end pb-8');
        break;
      case 'center':
      default:
        baseClasses.push('justify-center');
    }

    if (glassMorphism) {
      baseClasses.push('glass-card glass-card--loading p-6 m-4 max-w-sm mx-auto');
    } else {
      baseClasses.push('bg-surface-elevated border border-primary rounded-lg p-6 m-4 max-w-sm mx-auto shadow-lg');
    }

    if (className) {
      baseClasses.push(className);
    }

    return baseClasses.join(' ');
  };

  return (
    <div className="relative">
      {children}
      <div className={getOverlayClasses()}>
        <div className={getContentClasses()}>
          {showSpinner && !hasTimedOut && (
            <LoadingSpinner
              size={spinnerSize}
              color={spinnerColor}
              variant="default"
              className="mb-4"
            />
          )}
          
          {hasTimedOut && (
            <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          )}

          <div className="text-center space-y-2">
            <div className={`font-medium ${hasTimedOut ? 'text-warning-700' : 'text-primary'}`}>
              {hasTimedOut ? 'Loading is taking longer than expected' : message}
            </div>
            
            {subMessage && !hasTimedOut && (
              <div className="text-sm text-secondary">
                {subMessage}
              </div>
            )}
            
            {hasTimedOut && (
              <div className="text-sm text-warning-600">
                Please check your connection and try again
              </div>
            )}
          </div>

          {hasTimedOut && onTimeout && (
            <button
              onClick={onTimeout}
              className="mt-4 px-4 py-2 bg-brand-primary-600 text-white rounded-lg hover:bg-brand-primary-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Predefined data loading overlays for common scenarios
export const PortfolioDataOverlay = (props) => (
  <DataLoadingOverlay
    message="Loading portfolio data..."
    subMessage="Fetching your holdings and performance metrics"
    spinnerColor="success"
    timeout={10000}
    {...props}
  />
);

export const MarketDataOverlay = (props) => (
  <DataLoadingOverlay
    message="Updating market data..."
    subMessage="Synchronizing latest cryptocurrency prices"
    spinnerColor="brand"
    timeout={8000}
    {...props}
  />
);

export const ChartDataOverlay = (props) => (
  <DataLoadingOverlay
    message="Loading chart data..."
    subMessage="Fetching price history and technical indicators"
    spinnerColor="info"
    position="center"
    timeout={15000}
    {...props}
  />
);

export const TradeDataOverlay = (props) => (
  <DataLoadingOverlay
    message="Processing trade..."
    subMessage="Executing your order on the exchange"
    spinnerColor="warning"
    variant="modal"
    timeout={30000}
    {...props}
  />
);

export const AuthenticationOverlay = (props) => (
  <DataLoadingOverlay
    message="Authenticating..."
    subMessage="Verifying your credentials"
    spinnerColor="brand"
    variant="modal"
    timeout={10000}
    {...props}
  />
);

export default DataLoadingOverlay;