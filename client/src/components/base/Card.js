import React from 'react';

/**
 * Card - Professional glass morphism card component with consistent styling
 * Supports multiple variants for different use cases in the trading platform
 * Requirements: 7.5 - Visual consistency across all components and sections
 */
const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'md',
  interactive = false,
  disabled = false,
  selected = false,
  hover = false,
  header,
  footer,
  ...props 
}) => {
  const baseClasses = 'card';
  
  const variantClasses = {
    default: 'bg-white border border-neutral-200 shadow-sm',
    glass: 'glass-card',
    'glass-portfolio': 'glass-card glass-card--portfolio',
    'glass-market': 'glass-card glass-card--market',
    'glass-trading': 'glass-card glass-card--trading',
    'glass-chart': 'glass-card glass-card--chart',
    'glass-modal': 'glass-card glass-card--modal',
    gradient: 'bg-gradient-to-br from-white to-neutral-50'
  };

  const sizeClasses = {
    sm: 'glass-card--sm',
    md: 'glass-card--md',
    lg: 'glass-card--lg',
    xl: 'glass-card--xl'
  };

  const stateClasses = [];
  
  if (interactive || hover) {
    stateClasses.push('glass-card--interactive');
  }
  
  if (disabled) {
    stateClasses.push('glass-card--disabled');
  }
  
  if (selected) {
    stateClasses.push('glass-card--selected');
  }

  // Apply size classes only for glass variants
  const shouldApplySize = variant.includes('glass');
  const sizeClass = shouldApplySize ? sizeClasses[size] : '';

  const cardClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClass,
    ...stateClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {header && (
        <div className="glass-card__header">
          {header}
        </div>
      )}
      <div className="glass-card__body">
        {children}
      </div>
      {footer && (
        <div className="glass-card__footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;