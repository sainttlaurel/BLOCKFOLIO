/**
 * React Hook for Lazy Component Loading
 * 
 * Provides utilities for lazy loading components with performance monitoring
 * and intelligent preloading based on user behavior patterns.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ComponentPreloader, lazyLoadingMonitor } from '../utils/lazyComponents';

/**
 * Hook for managing lazy component loading with performance tracking
 */
export const useLazyComponents = () => {
  const [loadedComponents, setLoadedComponents] = useState(new Set());
  const [loadingComponents, setLoadingComponents] = useState(new Set());
  const [failedComponents, setFailedComponents] = useState(new Set());
  const preloadTimeouts = useRef(new Map());

  /**
   * Load a component lazily with performance tracking
   */
  const loadComponent = useCallback(async (componentName, importFunction) => {
    if (loadedComponents.has(componentName) || loadingComponents.has(componentName)) {
      return;
    }

    setLoadingComponents(prev => new Set([...prev, componentName]));
    const startTime = performance.now();

    try {
      await importFunction();
      const loadTime = performance.now() - startTime;
      
      lazyLoadingMonitor.trackComponentLoad(componentName, loadTime);
      
      setLoadedComponents(prev => new Set([...prev, componentName]));
      setLoadingComponents(prev => {
        const newSet = new Set(prev);
        newSet.delete(componentName);
        return newSet;
      });
      
    } catch (error) {
      lazyLoadingMonitor.trackFailedLoad(componentName, error);
      
      setFailedComponents(prev => new Set([...prev, componentName]));
      setLoadingComponents(prev => {
        const newSet = new Set(prev);
        newSet.delete(componentName);
        return newSet;
      });
      
      console.error(`Failed to load component ${componentName}:`, error);
    }
  }, [loadedComponents, loadingComponents]);

  /**
   * Preload components with delay to avoid blocking initial load
   */
  const preloadComponent = useCallback((componentName, importFunction, delay = 0) => {
    if (preloadTimeouts.current.has(componentName)) {
      clearTimeout(preloadTimeouts.current.get(componentName));
    }

    const timeoutId = setTimeout(() => {
      loadComponent(componentName, importFunction);
      preloadTimeouts.current.delete(componentName);
    }, delay);

    preloadTimeouts.current.set(componentName, timeoutId);
  }, [loadComponent]);

  /**
   * Preload components based on route
   */
  const preloadForRoute = useCallback((route) => {
    ComponentPreloader.preloadForRoute(route);
  }, []);

  /**
   * Preload components on hover with debouncing
   */
  const preloadOnHover = useCallback((componentName) => {
    ComponentPreloader.preloadOnHover(componentName);
  }, []);

  /**
   * Get loading status for a component
   */
  const getComponentStatus = useCallback((componentName) => {
    if (loadedComponents.has(componentName)) return 'loaded';
    if (loadingComponents.has(componentName)) return 'loading';
    if (failedComponents.has(componentName)) return 'failed';
    return 'not-loaded';
  }, [loadedComponents, loadingComponents, failedComponents]);

  /**
   * Cleanup timeouts on unmount
   */
  useEffect(() => {
    return () => {
      preloadTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
      preloadTimeouts.current.clear();
    };
  }, []);

  return {
    loadComponent,
    preloadComponent,
    preloadForRoute,
    preloadOnHover,
    getComponentStatus,
    loadedComponents: Array.from(loadedComponents),
    loadingComponents: Array.from(loadingComponents),
    failedComponents: Array.from(failedComponents),
    metrics: lazyLoadingMonitor.getMetrics()
  };
};

/**
 * Hook for intersection observer based lazy loading
 */
export const useIntersectionLazyLoad = (componentName, options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef();
  const observerRef = useRef();

  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    
    if (!element || hasLoaded) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          if (triggerOnce) {
            setHasLoaded(true);
            observerRef.current?.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasLoaded]);

  return {
    elementRef,
    isVisible,
    hasLoaded
  };
};

/**
 * Hook for route-based preloading
 */
export const useRoutePreloading = () => {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const { preloadForRoute } = useLazyComponents();

  useEffect(() => {
    const handleRouteChange = () => {
      const newRoute = window.location.pathname;
      setCurrentRoute(newRoute);
      preloadForRoute(newRoute);
    };

    // Listen for route changes (works with React Router)
    window.addEventListener('popstate', handleRouteChange);
    
    // Also listen for pushstate/replacestate (for programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleRouteChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleRouteChange();
    };

    // Preload for current route
    preloadForRoute(currentRoute);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [currentRoute, preloadForRoute]);

  return { currentRoute };
};

/**
 * Hook for hover-based preloading
 */
export const useHoverPreloading = () => {
  const { preloadOnHover } = useLazyComponents();
  const hoverTimeouts = useRef(new Map());

  const handleMouseEnter = useCallback((componentName, delay = 200) => {
    // Clear any existing timeout
    if (hoverTimeouts.current.has(componentName)) {
      clearTimeout(hoverTimeouts.current.get(componentName));
    }

    // Set new timeout for preloading
    const timeoutId = setTimeout(() => {
      preloadOnHover(componentName);
      hoverTimeouts.current.delete(componentName);
    }, delay);

    hoverTimeouts.current.set(componentName, timeoutId);
  }, [preloadOnHover]);

  const handleMouseLeave = useCallback((componentName) => {
    // Cancel preloading if user leaves before delay
    if (hoverTimeouts.current.has(componentName)) {
      clearTimeout(hoverTimeouts.current.get(componentName));
      hoverTimeouts.current.delete(componentName);
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup all timeouts
      hoverTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
      hoverTimeouts.current.clear();
    };
  }, []);

  return {
    handleMouseEnter,
    handleMouseLeave
  };
};

/**
 * Hook for user behavior based preloading
 */
export const useUserBehaviorPreloading = () => {
  const { preloadComponent } = useLazyComponents();
  const [userPreferences, setUserPreferences] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userPreferences') || '{}');
    } catch {
      return {};
    }
  });

  /**
   * Track user interaction with features
   */
  const trackFeatureUsage = useCallback((featureName) => {
    setUserPreferences(prev => {
      const updated = {
        ...prev,
        frequentlyUsedFeatures: [
          ...(prev.frequentlyUsedFeatures || []).filter(f => f !== featureName),
          featureName
        ].slice(-10) // Keep only last 10 features
      };
      
      localStorage.setItem('userPreferences', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Preload based on user's frequent features
   */
  useEffect(() => {
    if (userPreferences.frequentlyUsedFeatures?.length > 0) {
      // Preload most frequently used features after a delay
      setTimeout(() => {
        userPreferences.frequentlyUsedFeatures.forEach((feature, index) => {
          ComponentPreloader.preloadOnHover(feature);
        });
      }, 3000); // Wait 3 seconds after initial load
    }
  }, [userPreferences.frequentlyUsedFeatures, preloadComponent]);

  return {
    trackFeatureUsage,
    userPreferences
  };
};

export default {
  useLazyComponents,
  useIntersectionLazyLoad,
  useRoutePreloading,
  useHoverPreloading,
  useUserBehaviorPreloading
};