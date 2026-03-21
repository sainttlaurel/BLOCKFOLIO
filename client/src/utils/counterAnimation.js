import React from 'react';

/**
 * Counter Animation Utility
 * 
 * Provides smooth counter animation functionality for numerical value changes
 * Implements Requirements 1.2: Animated value updates with smooth transitions
 * 
 * Features:
 * - requestAnimationFrame for 60fps performance
 * - Professional easing function for smooth transitions
 * - 600ms duration as specified in design system
 * - Handles increasing and decreasing values
 * - Works for currency values, percentages, and regular numbers
 * - Accessibility support (respects reduced motion preferences)
 * - Configurable animation parameters
 */

/**
 * Professional easing function: cubic-bezier(0.25, 0.46, 0.45, 0.94)
 * Enhanced smooth transition curve for fintech applications
 */
export const PROFESSIONAL_EASING = (t) => {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Animation configuration constants
 */
export const ANIMATION_CONFIG = {
  DURATION: 600, // 600ms as specified in design system
  EASING: PROFESSIONAL_EASING,
  MIN_CHANGE_THRESHOLD: 0.01, // Minimum change to trigger animation ($0.01)
  MIN_PERCENTAGE_THRESHOLD: 0.001, // Minimum percentage change (0.001%)
  SIGNIFICANT_CHANGE_THRESHOLD: 5, // Percentage for "strong" animations
};

/**
 * Counter Animation Hook
 * 
 * @param {number} targetValue - The target value to animate to
 * @param {Object} options - Animation options
 * @param {number} options.duration - Animation duration in milliseconds
 * @param {Function} options.easing - Easing function
 * @param {Function} options.onStart - Callback when animation starts
 * @param {Function} options.onUpdate - Callback during animation with current value
 * @param {Function} options.onComplete - Callback when animation completes
 * @param {boolean} options.respectReducedMotion - Whether to respect prefers-reduced-motion
 * @returns {Object} Animation control object
 */
export const createCounterAnimation = (
  options = {}
) => {
  const {
    duration = ANIMATION_CONFIG.DURATION,
    easing = ANIMATION_CONFIG.EASING,
    onStart = () => {},
    onUpdate = () => {},
    onComplete = () => {},
    respectReducedMotion = true
  } = options;

  let animationFrameId = null;
  let startTime = null;
  let startValue = null;
  let isAnimating = false;

  /**
   * Check if user prefers reduced motion
   */
  const prefersReducedMotion = () => {
    if (!respectReducedMotion) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /**
   * Animate from current value to target value
   */
  const animate = (fromValue, toValue) => {
    if (fromValue === toValue) return;

    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion()) {
      onUpdate(toValue);
      onComplete(toValue);
      return;
    }

    isAnimating = true;
    startValue = fromValue;
    startTime = null;
    onStart(fromValue, toValue);

    const animateFrame = (currentTime) => {
      if (!startTime) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      
      const currentValue = startValue + (toValue - startValue) * easedProgress;
      onUpdate(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateFrame);
      } else {
        isAnimating = false;
        onUpdate(toValue);
        onComplete(toValue);
      }
    };

    animationFrameId = requestAnimationFrame(animateFrame);
  };

  /**
   * Cancel the current animation
   */
  const cancel = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
      isAnimating = false;
    }
  };

  /**
   * Check if animation should be triggered based on value change
   */
  const shouldAnimate = (oldValue, newValue) => {
    const changeAmount = Math.abs(newValue - oldValue);
    const changePercentage = oldValue !== 0 ? (changeAmount / Math.abs(oldValue)) * 100 : 0;
    
    return changeAmount > ANIMATION_CONFIG.MIN_CHANGE_THRESHOLD || 
           changePercentage > ANIMATION_CONFIG.MIN_PERCENTAGE_THRESHOLD;
  };

  /**
   * Get animation intensity based on change magnitude
   */
  const getAnimationIntensity = (oldValue, newValue) => {
    const changeAmount = Math.abs(newValue - oldValue);
    const changePercentage = oldValue !== 0 ? (changeAmount / Math.abs(oldValue)) * 100 : 0;
    
    return changePercentage > ANIMATION_CONFIG.SIGNIFICANT_CHANGE_THRESHOLD ? 'strong' : 'normal';
  };

  return {
    animate,
    cancel,
    shouldAnimate,
    getAnimationIntensity,
    isAnimating: () => isAnimating
  };
};

/**
 * Format number as currency
 */
export const formatCurrency = (value, options = {}) => {
  const {
    currency = 'USD',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};

/**
 * Format number as percentage
 */
export const formatPercentage = (value, options = {}) => {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSign = true
  } = options;

  const formatted = Math.abs(value).toFixed(maximumFractionDigits);
  const sign = showSign ? (value >= 0 ? '+' : '-') : '';
  
  return value === 0 ? `${formatted}%` : `${sign}${formatted}%`;
};

/**
 * Format regular number
 */
export const formatNumber = (value, options = {}) => {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};

/**
 * React Hook for Counter Animation
 * 
 * @param {number} value - Current value to display
 * @param {Object} options - Animation and formatting options
 * @returns {Object} Hook result with animated value and controls
 */
export const useAnimatedCounter = (value, options = {}) => {
  const [displayValue, setDisplayValue] = React.useState(value);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const previousValueRef = React.useRef(value);
  const animationRef = React.useRef(null);

  const {
    formatter = formatNumber,
    onAnimationStart = () => {},
    onAnimationComplete = () => {},
    ...animationOptions
  } = options;

  React.useEffect(() => {
    const previousValue = previousValueRef.current;
    
    if (previousValue !== value) {
      const animation = createCounterAnimation({
        ...animationOptions,
        onStart: (from, to) => {
          setIsAnimating(true);
          onAnimationStart(from, to);
        },
        onUpdate: (currentValue) => {
          setDisplayValue(currentValue);
        },
        onComplete: (finalValue) => {
          setDisplayValue(finalValue);
          setIsAnimating(false);
          onAnimationComplete(finalValue);
        }
      });

      if (animation.shouldAnimate(previousValue, value)) {
        animation.animate(previousValue, value);
        animationRef.current = animation;
      } else {
        setDisplayValue(value);
      }
    }

    previousValueRef.current = value;
  }, [value, animationOptions, onAnimationStart, onAnimationComplete]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, []);

  return {
    displayValue,
    formattedValue: formatter(displayValue),
    isAnimating
  };
};