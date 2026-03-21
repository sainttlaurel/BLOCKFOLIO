import React from 'react';

/**
 * LoadingSpinner - Professional loading spinner component
 * Implements fintech-grade loading indicators with glass morphism integration
 * Requirements: 7.6 - Loading states and skeleton screens for data fetching operations
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'brand', 
  variant = 'default',
  label = 'Loading...',
  showLabel = false,
  className = '',
  overlay = false,
  glassMorphism = false
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16'
  };

  const colorClasses = {
    brand: 'text-brand-primary-600',
    neutral: 'text-neutral-600',
    white: 'text-white',
    success: 'text-market-green-600',
    error: 'text-market-red-600',
    warning: 'text-warning-600'
  };

  const labelSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  const containerClasses = [
    'flex items-center justify-center',
    showLabel ? 'flex-col space-y-2' : '',
    overlay ? 'fixed inset-0 z-50' : '',
    glassMorphism ? 'glass-card glass-card--loading' : '',
    overlay && glassMorphism ? 'bg-glass-medium backdrop-blur-strong' : '',
    overlay && !glassMorphism ? 'bg-surface-overlay' : '',
    className
  ].filter(Boolean).join(' ');

  const SpinnerSVG = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`flex space-x-1 ${sizeClasses[size]}`}>
            <div className={`w-2 h-2 rounded-full ${colorClasses[color].replace('text-', 'bg-')} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-2 h-2 rounded-full ${colorClasses[color].replace('text-', 'bg-')} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-2 h-2 rounded-full ${colorClasses[color].replace('text-', 'bg-')} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} ${colorClasses[color].replace('text-', 'bg-')} rounded-full animate-pulse`}></div>
        );
      
      case 'ring':
        return (
          <div className={`${sizeClasses[size]} relative`}>
            <div className={`absolute inset-0 rounded-full border-2 border-current opacity-25 ${colorClasses[color]}`}></div>
            <div className={`absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin ${colorClasses[color]}`}></div>
          </div>
        );
      
      case 'bars':
        return (
          <div className={`flex space-x-1 ${sizeClasses[size]}`}>
            <div className={`w-1 bg-current ${colorClasses[color]} animate-pulse`} style={{ height: '100%', animationDelay: '0ms' }}></div>
            <div className={`w-1 bg-current ${colorClasses[color]} animate-pulse`} style={{ height: '80%', animationDelay: '150ms' }}></div>
            <div className={`w-1 bg-current ${colorClasses[color]} animate-pulse`} style={{ height: '60%', animationDelay: '300ms' }}></div>
            <div className={`w-1 bg-current ${colorClasses[color]} animate-pulse`} style={{ height: '80%', animationDelay: '450ms' }}></div>
            <div className={`w-1 bg-current ${colorClasses[color]} animate-pulse`} style={{ height: '100%', animationDelay: '600ms' }}></div>
          </div>
        );
      
      default:
        return (
          <svg 
            className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]}`}
            fill="none" 
            viewBox="0 0 24 24"
            role="img"
            aria-label={label}
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
    }
  };

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <SpinnerSVG />
      {showLabel && (
        <span className={`text-secondary font-medium ${labelSizeClasses[size]}`}>
          {label}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;