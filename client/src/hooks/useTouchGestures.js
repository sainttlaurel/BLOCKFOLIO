import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Touch Gesture Hook for Mobile Trading
 * 
 * Provides touch gesture detection and haptic feedback for mobile trading interactions
 * Supports swipe gestures, long press, and touch feedback
 */

const SWIPE_THRESHOLD = 50; // Minimum distance for swipe detection (px)
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity for swipe (px/ms)
const LONG_PRESS_DURATION = 500; // Duration for long press (ms)
const TAP_THRESHOLD = 10; // Maximum movement for tap detection (px)

export const useTouchGestures = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onTap,
    enableHaptic = true,
    swipeThreshold = SWIPE_THRESHOLD,
    longPressDuration = LONG_PRESS_DURATION
  } = options;

  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  // Haptic feedback utility
  const triggerHaptic = useCallback((type = 'light') => {
    if (!enableHaptic || !navigator.vibrate) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 100, 50],
      warning: [20, 50, 20]
    };

    navigator.vibrate(patterns[type] || patterns.light);
  }, [enableHaptic]);

  // Calculate swipe distance and velocity
  const calculateSwipe = useCallback((start, end) => {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const deltaTime = end.time - start.time;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    return {
      deltaX,
      deltaY,
      distance,
      velocity,
      angle: Math.atan2(deltaY, deltaX) * (180 / Math.PI)
    };
  }, []);

  // Determine swipe direction
  const getSwipeDirection = useCallback((swipeData) => {
    const { deltaX, deltaY, distance, velocity } = swipeData;

    if (distance < swipeThreshold || velocity < SWIPE_VELOCITY_THRESHOLD) {
      return null;
    }

    // Determine primary direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, [swipeThreshold]);

  // Handle touch start
  const handleTouchStart = useCallback((event) => {
    const touch = event.touches[0];
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    touchEndRef.current = null;
    setIsSwiping(false);

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        setIsLongPressing(true);
        triggerHaptic('medium');
        onLongPress(event);
      }, longPressDuration);
    }
  }, [onLongPress, longPressDuration, triggerHaptic]);

  // Handle touch move
  const handleTouchMove = useCallback((event) => {
    if (!touchStartRef.current) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Cancel long press if moved too much
    if ((deltaX > TAP_THRESHOLD || deltaY > TAP_THRESHOLD) && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      setIsLongPressing(false);
    }

    // Detect swipe in progress
    if (deltaX > swipeThreshold || deltaY > swipeThreshold) {
      setIsSwiping(true);
    }
  }, [swipeThreshold]);

  // Handle touch end
  const handleTouchEnd = useCallback((event) => {
    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Calculate swipe
    const swipeData = calculateSwipe(touchStartRef.current, touchEndRef.current);
    const direction = getSwipeDirection(swipeData);

    if (direction) {
      // Trigger swipe callback
      triggerHaptic('light');
      
      switch (direction) {
        case 'left':
          onSwipeLeft?.(event, swipeData);
          break;
        case 'right':
          onSwipeRight?.(event, swipeData);
          break;
        case 'up':
          onSwipeUp?.(event, swipeData);
          break;
        case 'down':
          onSwipeDown?.(event, swipeData);
          break;
        default:
          break;
      }
    } else if (swipeData.distance < TAP_THRESHOLD && !isLongPressing) {
      // Trigger tap callback
      triggerHaptic('light');
      onTap?.(event);
    }

    // Reset state
    touchStartRef.current = null;
    touchEndRef.current = null;
    setIsLongPressing(false);
    setIsSwiping(false);
  }, [calculateSwipe, getSwipeDirection, isLongPressing, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, triggerHaptic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Touch event handlers
  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  };

  return {
    touchHandlers,
    isLongPressing,
    isSwiping,
    triggerHaptic
  };
};

export default useTouchGestures;
