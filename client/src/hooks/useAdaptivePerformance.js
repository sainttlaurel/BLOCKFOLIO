/**
 * useAdaptivePerformance Hook
 * 
 * React hook for adaptive performance optimization
 * Automatically adjusts quality settings based on device capabilities and performance
 */

import { useState, useEffect, useRef } from 'react';
import {
  AdaptivePerformanceManager,
  detectBrowserEngine,
  BrowserEngine
} from '../utils/browserEngineOptimization';

/**
 * Hook for adaptive performance management
 * @param {Object} options - Configuration options
 * @returns {Object} Performance settings and utilities
 */
export const useAdaptivePerformance = (options = {}) => {
  const {
    enableAutoAdjust = true,
    initialQuality = null
  } = options;

  const [settings, setSettings] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [engine, setEngine] = useState('unknown');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const managerRef = useRef(null);

  useEffect(() => {
    // Detect browser engine
    const detectedEngine = detectBrowserEngine();
    setEngine(detectedEngine);

    // Initialize performance manager
    const initializeManager = async () => {
      managerRef.current = new AdaptivePerformanceManager();
      
      const initialSettings = await managerRef.current.initialize();
      
      // Override with initial quality if provided
      if (initialQuality) {
        initialSettings.quality = initialQuality;
      }
      
      setSettings(initialSettings);
      setCapabilities(managerRef.current.deviceCapabilities);
      setIsInitialized(true);

      // Subscribe to settings changes
      if (enableAutoAdjust) {
        managerRef.current.subscribe((newSettings) => {
          setSettings(newSettings);
        });
      }
    };

    initializeManager();

    // Cleanup
    return () => {
      if (managerRef.current) {
        managerRef.current.cleanup();
      }
    };
  }, [enableAutoAdjust, initialQuality]);

  /**
   * Manually set quality level
   */
  const setQuality = (quality) => {
    if (!managerRef.current || !settings) return;

    settings.quality = quality;
    
    if (quality === 'low') {
      managerRef.current.applyLowQuality();
    } else if (quality === 'medium') {
      managerRef.current.applyMediumQuality();
    } else if (quality === 'high') {
      managerRef.current.applyHighQuality();
    }
    
    setSettings({ ...settings });
  };

  /**
   * Get CSS variables for current settings
   */
  const getCSSVariables = () => {
    if (!settings) return {};

    return {
      '--animation-duration': `${settings.animations.duration}ms`,
      '--backdrop-blur': `${settings.effects.backdropBlur}px`,
      '--shadow-intensity': settings.effects.shadows === 'full' ? '1' : 
                           settings.effects.shadows === 'simple' ? '0.5' : '0'
    };
  };

  /**
   * Get optimized animation props
   */
  const getAnimationProps = () => {
    if (!settings) return { duration: 300 };

    return {
      duration: settings.animations.duration,
      enabled: settings.animations.enabled,
      complexity: settings.animations.complexity
    };
  };

  /**
   * Get optimized chart settings
   */
  const getChartSettings = () => {
    if (!settings) return { maxDataPoints: 1000 };

    return {
      maxDataPoints: settings.charts.maxDataPoints,
      antialiasing: settings.charts.antialiasing,
      animations: settings.charts.animations
    };
  };

  /**
   * Check if feature should be enabled based on current quality
   */
  const shouldEnableFeature = (feature) => {
    if (!settings) return true;

    const featureRequirements = {
      'backdrop-blur': settings.effects.backdropBlur > 0,
      'shadows': settings.effects.shadows !== 'none',
      'gradients': settings.effects.gradients,
      'animations': settings.animations.enabled,
      'chart-animations': settings.charts.animations,
      'antialiasing': settings.charts.antialiasing,
      'gpu-acceleration': settings.rendering.useGPU
    };

    return featureRequirements[feature] !== undefined ? featureRequirements[feature] : true;
  };

  /**
   * Get engine-specific optimizations
   */
  const getEngineOptimizations = () => {
    const optimizations = {
      useFlexbox: true,
      useGrid: true,
      useBackdropFilter: true,
      useWillChange: true,
      useTransform3D: true
    };

    if (engine === BrowserEngine.WEBKIT) {
      optimizations.useBackdropFilter = settings?.effects.backdropBlur <= 8;
      optimizations.preferHardwareAcceleration = true;
    } else if (engine === BrowserEngine.GECKO) {
      optimizations.useFlexbox = true; // Gecko's flexbox is highly optimized
      optimizations.useNativeScrollbar = true;
    } else if (engine === BrowserEngine.CHROMIUM) {
      optimizations.useAggressiveCaching = true;
      optimizations.useGPUAcceleration = true;
    }

    return optimizations;
  };

  /**
   * Apply performance optimizations to an element
   */
  const optimizeElement = (element) => {
    if (!element || !settings) return;

    // Apply GPU acceleration if enabled
    if (settings.rendering.useGPU) {
      element.style.transform = 'translateZ(0)';
      element.style.willChange = 'transform, opacity';
    }

    // Apply engine-specific optimizations
    if (engine === BrowserEngine.WEBKIT) {
      element.style.webkitOverflowScrolling = 'touch';
      element.style.webkitTapHighlightColor = 'transparent';
    }
  };

  /**
   * Downsample data based on current settings
   */
  const downsampleData = (data) => {
    if (!settings || !data) return data;

    const maxPoints = settings.charts.maxDataPoints;
    if (data.length <= maxPoints) return data;

    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, index) => index % step === 0);
  };

  return {
    // State
    settings,
    capabilities,
    engine,
    isInitialized,
    
    // Methods
    setQuality,
    getCSSVariables,
    getAnimationProps,
    getChartSettings,
    shouldEnableFeature,
    getEngineOptimizations,
    optimizeElement,
    downsampleData,
    
    // Utilities
    isLowEnd: capabilities?.tier === 'low',
    isMediumEnd: capabilities?.tier === 'medium',
    isHighEnd: capabilities?.tier === 'high',
    isChromium: engine === BrowserEngine.CHROMIUM,
    isGecko: engine === BrowserEngine.GECKO,
    isWebKit: engine === BrowserEngine.WEBKIT
  };
};

/**
 * Hook for FPS monitoring
 */
export const useFPSMonitor = (callback) => {
  const [fps, setFps] = useState(0);
  const fpsCounterRef = useRef(null);

  useEffect(() => {
    const { FPSCounter } = require('../utils/browserEngineOptimization');
    
    fpsCounterRef.current = new FPSCounter();
    fpsCounterRef.current.subscribe((newFps) => {
      setFps(newFps);
      if (callback) callback(newFps);
    });
    fpsCounterRef.current.start();

    return () => {
      if (fpsCounterRef.current) {
        fpsCounterRef.current.stop();
      }
    };
  }, [callback]);

  return fps;
};

/**
 * Hook for memory monitoring
 */
export const useMemoryMonitor = (interval = 1000) => {
  const [memory, setMemory] = useState(null);
  const trackerRef = useRef(null);

  useEffect(() => {
    const { MemoryTracker } = require('../utils/browserEngineOptimization');
    
    trackerRef.current = new MemoryTracker();
    trackerRef.current.start(interval);

    const updateInterval = setInterval(() => {
      const usage = trackerRef.current.getMemoryUsage();
      setMemory(usage);
    }, interval);

    return () => {
      if (trackerRef.current) {
        trackerRef.current.stop();
      }
      clearInterval(updateInterval);
    };
  }, [interval]);

  return memory;
};

/**
 * Hook for Core Web Vitals monitoring
 */
export const useWebVitals = (callback) => {
  const [vitals, setVitals] = useState({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null
  });
  
  const trackerRef = useRef(null);

  useEffect(() => {
    const { CoreWebVitalsTracker } = require('../utils/browserEngineOptimization');
    
    trackerRef.current = new CoreWebVitalsTracker();
    trackerRef.current.subscribe((metric, value) => {
      setVitals(prev => {
        const updated = { ...prev, [metric]: value };
        if (callback) callback(updated);
        return updated;
      });
    });
    trackerRef.current.start();

    return () => {
      if (trackerRef.current) {
        trackerRef.current.stop();
      }
    };
  }, [callback]);

  return vitals;
};

export default useAdaptivePerformance;
