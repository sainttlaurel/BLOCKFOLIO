import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Professional Trading Platform Responsive Breakpoint Hook
 * 
 * Manages responsive breakpoints with smooth transitions and professional
 * fintech user experience during layout changes.
 * 
 * Breakpoints:
 * - Mobile: < 768px
 * - Tablet: 768px - 1199px  
 * - Desktop: >= 1200px
 */

const BREAKPOINTS = {
  mobile: 767,
  tablet: 768,
  tabletMax: 1199,
  desktop: 1200
};

const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet', 
  DESKTOP: 'desktop'
};

const TRANSITION_STATES = {
  IDLE: 'idle',
  TRANSITIONING: 'transitioning',
  COMPLETE: 'complete'
};

export const useResponsiveBreakpoints = () => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [deviceType, setDeviceType] = useState(DEVICE_TYPES.DESKTOP);
  const [previousDeviceType, setPreviousDeviceType] = useState(null);
  const [transitionState, setTransitionState] = useState(TRANSITION_STATES.IDLE);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const resizeTimeoutRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  
  // Determine device type based on window width
  const getDeviceType = useCallback((width) => {
    if (width < BREAKPOINTS.tablet) {
      return DEVICE_TYPES.MOBILE;
    } else if (width >= BREAKPOINTS.tablet && width <= BREAKPOINTS.tabletMax) {
      return DEVICE_TYPES.TABLET;
    } else {
      return DEVICE_TYPES.DESKTOP;
    }
  }, []);
  
  // Handle smooth transitions between breakpoints
  const handleBreakpointTransition = useCallback((newDeviceType, oldDeviceType) => {
    if (newDeviceType === oldDeviceType) return;
    
    setIsTransitioning(true);
    setTransitionState(TRANSITION_STATES.TRANSITIONING);
    
    // Clear any existing transition timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    // Complete transition after animation duration (400ms)
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
      setTransitionState(TRANSITION_STATES.COMPLETE);
      
      // Reset to idle after a brief delay
      setTimeout(() => {
        setTransitionState(TRANSITION_STATES.IDLE);
      }, 100);
    }, 400);
  }, []);
  
  // Debounced resize handler for smooth performance
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    
    resizeTimeoutRef.current = setTimeout(() => {
      const newWidth = window.innerWidth;
      const newDeviceType = getDeviceType(newWidth);
      
      setWindowWidth(newWidth);
      
      if (newDeviceType !== deviceType) {
        setPreviousDeviceType(deviceType);
        setDeviceType(newDeviceType);
        handleBreakpointTransition(newDeviceType, deviceType);
      }
    }, 100); // 100ms debounce for smooth performance
  }, [deviceType, getDeviceType, handleBreakpointTransition]);
  
  // Initialize and setup resize listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initialDeviceType = getDeviceType(window.innerWidth);
    setDeviceType(initialDeviceType);
    setWindowWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [handleResize, getDeviceType]);
  
  // Breakpoint check utilities
  const isMobile = deviceType === DEVICE_TYPES.MOBILE;
  const isTablet = deviceType === DEVICE_TYPES.TABLET;
  const isDesktop = deviceType === DEVICE_TYPES.DESKTOP;
  
  // Responsive utilities
  const isMobileOrTablet = isMobile || isTablet;
  const isTabletOrDesktop = isTablet || isDesktop;
  
  // Transition direction detection
  const getTransitionDirection = useCallback(() => {
    if (!previousDeviceType || !deviceType) return null;
    
    const deviceOrder = [DEVICE_TYPES.MOBILE, DEVICE_TYPES.TABLET, DEVICE_TYPES.DESKTOP];
    const prevIndex = deviceOrder.indexOf(previousDeviceType);
    const currentIndex = deviceOrder.indexOf(deviceType);
    
    if (currentIndex > prevIndex) {
      return 'expanding'; // Mobile -> Tablet -> Desktop
    } else if (currentIndex < prevIndex) {
      return 'contracting'; // Desktop -> Tablet -> Mobile
    }
    return null;
  }, [previousDeviceType, deviceType]);
  
  // CSS class generators for smooth transitions
  const getLayoutClasses = useCallback(() => {
    const baseClasses = ['responsive-container', 'layout-transition'];
    
    // Add device-specific classes
    baseClasses.push(`${deviceType}-layout`);
    
    // Add transition state classes
    if (isTransitioning) {
      baseClasses.push('transitioning');
      const direction = getTransitionDirection();
      if (direction) {
        baseClasses.push(`transition-${direction}`);
      }
    }
    
    return baseClasses.join(' ');
  }, [deviceType, isTransitioning, getTransitionDirection]);
  
  // Component-specific class generators
  const getComponentClasses = useCallback((component) => {
    const baseClasses = ['layout-transition'];
    
    switch (component) {
      case 'portfolio':
        baseClasses.push(`${deviceType}-portfolio`);
        if (isTransitioning) baseClasses.push('portfolio-transitioning');
        break;
      case 'market':
        baseClasses.push(`${deviceType}-market`);
        if (isTransitioning) baseClasses.push('market-transitioning');
        break;
      case 'trading':
        baseClasses.push(`${deviceType}-trading`);
        if (isTransitioning) baseClasses.push('trading-transitioning');
        break;
      case 'collapsible':
        baseClasses.push('collapsible-content');
        break;
      case 'tab':
        baseClasses.push('mobile-tab-panel');
        break;
      default:
        baseClasses.push('professional-card');
    }
    
    return baseClasses.join(' ');
  }, [deviceType, isTransitioning]);
  
  // Animation utilities
  const triggerLayoutAnimation = useCallback((element, animationType = 'fade') => {
    if (!element) return;
    
    element.classList.remove('fade-in', 'slide-in-left', 'slide-in-right', 'slide-in-up');
    
    // Force reflow
    element.offsetHeight;
    
    switch (animationType) {
      case 'slide-left':
        element.classList.add('slide-in-left');
        break;
      case 'slide-right':
        element.classList.add('slide-in-right');
        break;
      case 'slide-up':
        element.classList.add('slide-in-up');
        break;
      default:
        element.classList.add('fade-in');
    }
  }, []);
  
  // Performance optimization utilities
  const shouldRenderComponent = useCallback((componentBreakpoints) => {
    if (!componentBreakpoints) return true;
    
    if (Array.isArray(componentBreakpoints)) {
      return componentBreakpoints.includes(deviceType);
    }
    
    return componentBreakpoints === deviceType;
  }, [deviceType]);
  
  // Accessibility utilities
  const getAriaAttributes = useCallback(() => {
    return {
      'aria-label': `Current layout: ${deviceType}`,
      'aria-live': isTransitioning ? 'polite' : 'off',
      'aria-busy': isTransitioning
    };
  }, [deviceType, isTransitioning]);
  
  // Debug utilities (development only)
  const getDebugInfo = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return {
      windowWidth,
      deviceType,
      previousDeviceType,
      transitionState,
      isTransitioning,
      transitionDirection: getTransitionDirection(),
      breakpoints: BREAKPOINTS
    };
  }, [windowWidth, deviceType, previousDeviceType, transitionState, isTransitioning, getTransitionDirection]);
  
  return {
    // Device type information
    deviceType,
    previousDeviceType,
    windowWidth,
    
    // Breakpoint checks
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
    isTabletOrDesktop,
    
    // Transition state
    isTransitioning,
    transitionState,
    transitionDirection: getTransitionDirection(),
    
    // CSS class utilities
    getLayoutClasses,
    getComponentClasses,
    
    // Animation utilities
    triggerLayoutAnimation,
    
    // Performance utilities
    shouldRenderComponent,
    
    // Accessibility utilities
    getAriaAttributes,
    
    // Constants
    BREAKPOINTS,
    DEVICE_TYPES,
    TRANSITION_STATES,
    
    // Debug (development only)
    debugInfo: getDebugInfo()
  };
};

export default useResponsiveBreakpoints;