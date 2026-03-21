import React from 'react';

/**
 * SkeletonScreen - Professional skeleton loading component
 * Provides comprehensive placeholder content during data loading
 * Requirements: 7.6 - Loading states and skeleton screens for data fetching operations
 */
const SkeletonScreen = ({ 
  variant = 'default',
  lines = 3, 
  height = 'h-4', 
  className = '',
  animate = true,
  glassMorphism = false,
  rounded = 'rounded'
}) => {
  const baseClasses = [
    animate ? 'skeleton' : 'bg-neutral-200',
    glassMorphism ? 'bg-glass-light' : 'bg-neutral-200',
    rounded,
    className
  ].filter(Boolean).join(' ');

  const skeletonClasses = `${baseClasses} ${height}`;

  // Card Skeleton
  if (variant === 'card') {
    return (
      <div className={`${glassMorphism ? 'glass-card glass-card--loading' : 'bg-surface-primary border border-primary rounded-lg'} p-6 space-y-4`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 ${baseClasses} rounded-full`}></div>
          <div className="flex-1 space-y-2">
            <div className={`h-4 ${baseClasses} w-3/4`}></div>
            <div className={`h-3 ${baseClasses} w-1/2`}></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className={`h-3 ${baseClasses}`}></div>
          <div className={`h-3 ${baseClasses} w-5/6`}></div>
          <div className={`h-3 ${baseClasses} w-4/6`}></div>
        </div>
      </div>
    );
  }

  // Portfolio Card Skeleton
  if (variant === 'portfolio-card') {
    return (
      <div className={`${glassMorphism ? 'glass-card glass-card--portfolio' : 'bg-surface-primary border border-primary rounded-lg'} p-6 space-y-4`}>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className={`h-6 ${baseClasses} w-32`}></div>
            <div className={`h-8 ${baseClasses} w-24`}></div>
          </div>
          <div className={`w-16 h-8 ${baseClasses} rounded-full`}></div>
        </div>
        <div className={`h-24 ${baseClasses} rounded`}></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <div className={`h-4 ${baseClasses} w-16 mx-auto`}></div>
            <div className={`h-3 ${baseClasses} w-12 mx-auto`}></div>
          </div>
          <div className="text-center space-y-1">
            <div className={`h-4 ${baseClasses} w-16 mx-auto`}></div>
            <div className={`h-3 ${baseClasses} w-12 mx-auto`}></div>
          </div>
          <div className="text-center space-y-1">
            <div className={`h-4 ${baseClasses} w-16 mx-auto`}></div>
            <div className={`h-3 ${baseClasses} w-12 mx-auto`}></div>
          </div>
        </div>
      </div>
    );
  }

  // Market Data Table Row Skeleton
  if (variant === 'table-row') {
    return (
      <tr className="border-b border-primary">
        <td className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${baseClasses} rounded-full`}></div>
            <div className="space-y-1">
              <div className={`h-4 ${baseClasses} w-16`}></div>
              <div className={`h-3 ${baseClasses} w-12`}></div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className={`h-4 ${baseClasses} w-20`}></div>
        </td>
        <td className="px-6 py-4">
          <div className={`h-4 ${baseClasses} w-16`}></div>
        </td>
        <td className="px-6 py-4">
          <div className={`h-6 ${baseClasses} w-24 rounded`}></div>
        </td>
        <td className="px-6 py-4">
          <div className={`h-8 ${baseClasses} w-20 rounded`}></div>
        </td>
      </tr>
    );
  }

  // Chart Skeleton
  if (variant === 'chart') {
    return (
      <div className={`${glassMorphism ? 'glass-card glass-card--chart' : 'bg-surface-primary border border-primary rounded-lg'} p-6 space-y-4`}>
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className={`h-5 ${baseClasses} w-32`}></div>
            <div className={`h-3 ${baseClasses} w-24`}></div>
          </div>
          <div className="flex space-x-2">
            <div className={`h-8 ${baseClasses} w-12 rounded`}></div>
            <div className={`h-8 ${baseClasses} w-12 rounded`}></div>
            <div className={`h-8 ${baseClasses} w-12 rounded`}></div>
          </div>
        </div>
        <div className={`h-64 ${baseClasses} rounded`}></div>
        <div className="flex justify-center space-x-4">
          <div className={`h-6 ${baseClasses} w-16 rounded`}></div>
          <div className={`h-6 ${baseClasses} w-16 rounded`}></div>
          <div className={`h-6 ${baseClasses} w-16 rounded`}></div>
        </div>
      </div>
    );
  }

  // Trading Panel Skeleton
  if (variant === 'trading-panel') {
    return (
      <div className={`${glassMorphism ? 'glass-card glass-card--trading' : 'bg-surface-primary border border-primary rounded-lg'} p-6 space-y-6`}>
        <div className="space-y-2">
          <div className={`h-5 ${baseClasses} w-24`}></div>
          <div className={`h-8 ${baseClasses} w-full rounded`}></div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className={`h-4 ${baseClasses} w-16`}></div>
            <div className={`h-10 ${baseClasses} w-full rounded`}></div>
          </div>
          <div className="space-y-2">
            <div className={`h-4 ${baseClasses} w-20`}></div>
            <div className={`h-10 ${baseClasses} w-full rounded`}></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`h-12 ${baseClasses} rounded`}></div>
          <div className={`h-12 ${baseClasses} rounded`}></div>
        </div>
        <div className="space-y-2">
          <div className={`h-3 ${baseClasses} w-32`}></div>
          <div className={`h-3 ${baseClasses} w-28`}></div>
        </div>
      </div>
    );
  }

  // Holdings List Skeleton
  if (variant === 'holdings-list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="flex items-center justify-between p-4 border border-primary rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${baseClasses} rounded-full`}></div>
              <div className="space-y-1">
                <div className={`h-4 ${baseClasses} w-20`}></div>
                <div className={`h-3 ${baseClasses} w-16`}></div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className={`h-4 ${baseClasses} w-24`}></div>
              <div className={`h-3 ${baseClasses} w-16`}></div>
            </div>
            <div className={`w-20 h-8 ${baseClasses} rounded`}></div>
          </div>
        ))}
      </div>
    );
  }

  // Navigation Skeleton
  if (variant === 'navigation') {
    return (
      <div className="flex space-x-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={`h-6 ${baseClasses} w-16 rounded`}></div>
        ))}
      </div>
    );
  }

  // Avatar Skeleton
  if (variant === 'avatar') {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    };
    const size = className.includes('w-') ? '' : sizeClasses.md;
    return <div className={`${baseClasses} ${size} rounded-full`}></div>;
  }

  // Button Skeleton
  if (variant === 'button') {
    return <div className={`h-10 ${baseClasses} w-24 rounded`}></div>;
  }

  // Input Skeleton
  if (variant === 'input') {
    return <div className={`h-10 ${baseClasses} w-full rounded`}></div>;
  }

  // Text Block Skeleton
  if (variant === 'text-block') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div 
            key={index}
            className={skeletonClasses}
            style={{ 
              width: index === lines - 1 ? '75%' : '100%' 
            }}
          />
        ))}
      </div>
    );
  }

  // Default Text Lines Skeleton
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className={skeletonClasses}
          style={{ 
            width: index === lines - 1 ? '75%' : '100%' 
          }}
        />
      ))}
    </div>
  );
};

export default SkeletonScreen;