/**
 * Simple Animated Counter Component
 * Displays numbers with optional animation
 */

import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({ 
  value, 
  previousValue, 
  formatter = (val) => val.toString(), 
  className = '', 
  animate = true,
  onAnimationStart,
  onAnimationEnd 
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (animate && previousValue !== undefined && previousValue !== value) {
      setIsAnimating(true);
      if (onAnimationStart) onAnimationStart();
      
      // Simple animation - just update after a short delay
      setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
        if (onAnimationEnd) onAnimationEnd();
      }, 300);
    } else {
      setDisplayValue(value);
    }
  }, [value, previousValue, animate, onAnimationStart, onAnimationEnd]);

  const animationClass = isAnimating ? 'animate-value-change' : '';
  const changeClass = previousValue !== undefined && previousValue !== value 
    ? (value > previousValue ? 'animate-price-flash-up' : 'animate-price-flash-down')
    : '';

  return (
    <span className={`${className} ${animationClass} ${changeClass}`}>
      {formatter(displayValue)}
    </span>
  );
};

export default AnimatedCounter;