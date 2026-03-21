import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * PortfolioValue Component
 * 
 * Displays the portfolio value as the largest, most prominent element on the interface.
 * Implements Requirements 1.1: Portfolio-First Visual Hierarchy
 * Implements Requirements 1.2: Animated value updates with smooth transitions
 * 
 * Features:
 * - Large, prominent typography (largest element on interface)
 * - Professional fintech styling with proper spacing and colors
 * - Responsive design for desktop, tablet, and mobile layouts
 * - Visual hierarchy with portfolio value as primary focus
 * - Color-coded percentage change indicators
 * - Smooth animated value transitions with counter animation
 * - Visual feedback effects (scale, color flash) for value changes
 * - 60fps performance optimization with GPU acceleration
 * - Accessibility support (reduced motion)
 */
const PortfolioValue = ({ 
  totalValue = 0, 
  percentageChange = 0, 
  timeframe = '24h',
  isLoading = false 
}) => {
  // State for animation management
  const [displayValue, setDisplayValue] = useState(totalValue);
  const [animationClass, setAnimationClass] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValueRef = useRef(totalValue);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(totalValue);

  // Animation configuration - Professional timing from design system
  const ANIMATION_DURATION = 600; // 600ms as specified in design
  const EASING_FUNCTION = (t) => {
    // Professional easing function: cubic-bezier(0.25, 0.46, 0.45, 0.94)
    // Enhanced smooth transition curve for fintech applications
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Enhanced animation states for better visual feedback
  const [scaleAnimation, setScaleAnimation] = useState(false);
  const [colorFlash, setColorFlash] = useState(false);

  // Enhanced smooth counter animation using requestAnimationFrame for 60fps
  const animateValue = (startValue, endValue, duration) => {
    if (startValue === endValue) return;

    setIsAnimating(true);
    setScaleAnimation(true);
    setColorFlash(true);
    startTimeRef.current = null;
    startValueRef.current = startValue;

    const animate = (currentTime) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = EASING_FUNCTION(progress);
      
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        
        // Enhanced cleanup with staggered timing for smooth visual feedback
        setTimeout(() => {
          setAnimationClass('');
          setScaleAnimation(false);
        }, 100);
        
        setTimeout(() => {
          setColorFlash(false);
        }, 200);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Enhanced value change detection and animation triggering
  useEffect(() => {
    const previousValue = previousValueRef.current;
    
    if (previousValue !== totalValue && !isLoading) {
      // Determine animation type based on value change
      const isIncrease = totalValue > previousValue;
      const changeAmount = Math.abs(totalValue - previousValue);
      const changePercentage = previousValue !== 0 ? (changeAmount / Math.abs(previousValue)) * 100 : 0;
      
      // Only animate if change is significant (> $0.01 or > 0.001%)
      if (changeAmount > 0.01 || changePercentage > 0.001) {
        // Set appropriate animation class for enhanced visual feedback
        const animationIntensity = changePercentage > 5 ? 'strong' : 'normal';
        const animationDirection = isIncrease ? 'increase' : 'decrease';
        
        setAnimationClass(`animate-value-${animationDirection} animate-${animationIntensity}`);
        
        // Start enhanced counter animation with smooth transitions
        animateValue(previousValue, totalValue, ANIMATION_DURATION);
      } else {
        // For small changes, just update without animation but with subtle feedback
        setDisplayValue(totalValue);
        setAnimationClass('animate-subtle-update');
        setTimeout(() => setAnimationClass(''), 300);
      }
    } else if (previousValue !== totalValue && isLoading) {
      // If loading, just set the value without animation
      setDisplayValue(totalValue);
    }

    previousValueRef.current = totalValue;
  }, [totalValue, isLoading]);

  // Initialize display value on mount
  useEffect(() => {
    setDisplayValue(totalValue);
    previousValueRef.current = totalValue;
  }, []);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Format the portfolio value with proper currency formatting
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(displayValue);

  // Format percentage change
  const formattedPercentage = Math.abs(percentageChange).toFixed(2);
  const isPositive = percentageChange >= 0;
  const isNeutral = percentageChange === 0;

  // Determine trend icon and colors - Enhanced for Requirements 1.4
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  // Professional fintech color coding with specific hex values as per requirements
  const trendColorClass = isNeutral 
    ? 'text-neutral-500' 
    : isPositive 
      ? 'text-percentage-positive' // #10b981 (green for gains)
      : 'text-percentage-negative'; // #ef4444 (red for losses)
  
  const percentageColorClass = isNeutral
    ? 'text-percentage-neutral' // neutral gray for zero change
    : isPositive
      ? 'text-percentage-positive' // #10b981 (green for gains)
      : 'text-percentage-negative'; // #ef4444 (red for losses)

  if (isLoading) {
    return (
      <div className="portfolio-value-container">
        <div className="text-center animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-48 mx-auto mb-4"></div>
          <div className="h-16 bg-neutral-200 rounded w-80 mx-auto mb-4"></div>
          <div className="h-6 bg-neutral-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-value-container">
      <div className="text-center">
        {/* Portfolio Value Label */}
        <p className="text-heading-xs text-neutral-600 mb-3 font-medium uppercase tracking-wider">
          Total Portfolio Value
        </p>
        
        {/* Main Portfolio Value - Largest Element with Enhanced Animation */}
        <div className={`portfolio-value-display ${animationClass} ${isAnimating ? 'animating' : ''} ${scaleAnimation ? 'scale-active' : ''} ${colorFlash ? 'color-flash' : ''}`}>
          <h1 className="text-display-2xl font-bold text-neutral-900 leading-none tracking-tight">
            {formattedValue}
          </h1>
        </div>
        
        {/* Enhanced Percentage Change Indicator with Color-Coded Display - Requirements 1.4 */}
        <div className={`flex items-center justify-center space-x-2 mt-2 ${animationClass ? 'animate-percentage-change' : ''}`}>
          {/* Trend Icon with Enhanced Visual Clarity */}
          <TrendIcon 
            className={`h-5 w-5 ${trendColorClass} transition-all duration-300 ${isAnimating ? 'animate-bounce-subtle' : ''}`} 
            aria-hidden="true"
          />
          
          {/* Percentage Value with Professional Formatting */}
          <span 
            className={`text-body-lg font-semibold ${percentageColorClass} transition-all duration-300`}
            aria-label={`Portfolio change: ${isPositive ? 'up' : isNeutral ? 'unchanged' : 'down'} ${formattedPercentage} percent`}
          >
            {isPositive ? '+' : isNeutral ? '' : '-'}{formattedPercentage}%
          </span>
          
          {/* Timeframe Label */}
          <span className="text-body-sm text-neutral-500 font-medium">
            {timeframe}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PortfolioValue;