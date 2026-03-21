import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import SkeletonScreen from './SkeletonScreen';

/**
 * LoadingState - Comprehensive loading state management component
 * Provides unified loading experience across the trading platform
 * Requirements: 7.6 - Loading states and skeleton screens for data fetching operations
 */
const LoadingState = ({
  type = 'spinner',
  variant = 'default',
  size = 'md',
  color = 'brand',
  message = 'Loading...',
  showMessage = false,
  overlay = false,
  glassMorphism = false,
  fullScreen = false,
  inline = false,
  className = '',
  children,
  ...props
}) => {
  // Container classes based on display type
  const getContainerClasses = () => {
    const baseClasses = ['loading-state'];
    
    if (fullScreen) {
      baseClasses.push('fixed inset-0 z-50 flex items-center justify-center');
      if (glassMorphism) {
        baseClasses.push('bg-glass-medium backdrop-blur-strong');
      } else {
        baseClasses.push('bg-surface-overlay');
      }
    } else if (overlay) {
      baseClasses.push('absolute inset-0 z-10 flex items-center justify-center');
      if (glassMorphism) {
        baseClasses.push('bg-glass-light backdrop-blur-medium');
      } else {
        baseClasses.push('bg-surface-overlay');
      }
    } else if (inline) {
      baseClasses.push('inline-flex items-center');
    } else {
      baseClasses.push('flex items-center justify-center p-4');
    }
    
    if (className) {
      baseClasses.push(className);
    }
    
    return baseClasses.join(' ');
  };

  // Render loading content based on type
  const renderLoadingContent = () => {
    switch (type) {
      case 'skeleton':
        return (
          <SkeletonScreen
            variant={variant}
            glassMorphism={glassMorphism}
            {...props}
          />
        );
      
      case 'spinner':
        return (
          <LoadingSpinner
            size={size}
            color={color}
            variant={variant}
            label={message}
            showLabel={showMessage}
            glassMorphism={glassMorphism}
            {...props}
          />
        );
      
      case 'custom':
        return children;
      
      default:
        return (
          <LoadingSpinner
            size={size}
            color={color}
            variant={variant}
            label={message}
            showLabel={showMessage}
            glassMorphism={glassMorphism}
            {...props}
          />
        );
    }
  };

  return (
    <div className={getContainerClasses()} role="status" aria-live="polite">
      {renderLoadingContent()}
    </div>
  );
};

// Predefined loading state components for common use cases
export const PortfolioLoadingState = (props) => (
  <LoadingState
    type="skeleton"
    variant="portfolio-card"
    glassMorphism={true}
    {...props}
  />
);

export const MarketDataLoadingState = (props) => (
  <LoadingState
    type="skeleton"
    variant="table-row"
    glassMorphism={true}
    {...props}
  />
);

export const ChartLoadingState = (props) => (
  <LoadingState
    type="skeleton"
    variant="chart"
    glassMorphism={true}
    {...props}
  />
);

export const TradingPanelLoadingState = (props) => (
  <LoadingState
    type="skeleton"
    variant="trading-panel"
    glassMorphism={true}
    {...props}
  />
);

export const HoldingsLoadingState = (props) => (
  <LoadingState
    type="skeleton"
    variant="holdings-list"
    glassMorphism={true}
    lines={5}
    {...props}
  />
);

export const NavigationLoadingState = (props) => (
  <LoadingState
    type="skeleton"
    variant="navigation"
    inline={true}
    {...props}
  />
);

export const ButtonLoadingState = (props) => (
  <LoadingState
    type="spinner"
    variant="dots"
    size="sm"
    inline={true}
    {...props}
  />
);

export const OverlayLoadingState = (props) => (
  <LoadingState
    type="spinner"
    variant="ring"
    size="lg"
    color="brand"
    message="Loading data..."
    showMessage={true}
    overlay={true}
    glassMorphism={true}
    {...props}
  />
);

export const FullScreenLoadingState = (props) => (
  <LoadingState
    type="spinner"
    variant="default"
    size="xl"
    color="brand"
    message="Initializing trading platform..."
    showMessage={true}
    fullScreen={true}
    glassMorphism={true}
    {...props}
  />
);

export default LoadingState;