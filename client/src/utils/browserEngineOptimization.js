/**
 * Browser Engine-Specific Performance Optimizations
 * 
 * Optimizes performance across different browser engines:
 * - Chromium (Chrome, Edge): V8 engine, Blink rendering
 * - Gecko (Firefox): SpiderMonkey engine, Gecko rendering
 * - WebKit (Safari): JavaScriptCore engine, WebKit rendering
 * 
 * Implements adaptive performance strategies based on device capabilities
 * and browser engine characteristics.
 */

import { detectBrowser } from './browserDetection';

/**
 * Browser Engine Types
 */
export const BrowserEngine = {
  CHROMIUM: 'chromium',
  GECKO: 'gecko',
  WEBKIT: 'webkit',
  UNKNOWN: 'unknown'
};

/**
 * Detect browser engine
 * @returns {string} Browser engine type
 */
export const detectBrowserEngine = () => {
  const browser = detectBrowser();
  
  if (browser.name === 'Chrome' || browser.name === 'Edge') {
    return BrowserEngine.CHROMIUM;
  } else if (browser.name === 'Firefox') {
    return BrowserEngine.GECKO;
  } else if (browser.name === 'Safari') {
    return BrowserEngine.WEBKIT;
  }
  
  return BrowserEngine.UNKNOWN;
};

/**
 * FPS Counter
 * Monitors frame rate in real-time
 */
export class FPSCounter {
  constructor() {
    this.fps = 0;
    this.frames = 0;
    this.lastTime = performance.now();
    this.animationId = null;
    this.callbacks = new Set();
    this.history = [];
    this.maxHistory = 60; // Keep 60 samples
  }

  start() {
    const measure = (currentTime) => {
      this.frames++;
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
        this.history.push(this.fps);
        
        if (this.history.length > this.maxHistory) {
          this.history.shift();
        }
        
        this.callbacks.forEach(callback => callback(this.fps));
        this.frames = 0;
        this.lastTime = currentTime;
      }
      
      this.animationId = requestAnimationFrame(measure);
    };
    
    this.animationId = requestAnimationFrame(measure);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  getFPS() {
    return this.fps;
  }

  getAverageFPS() {
    if (this.history.length === 0) return 0;
    return Math.round(this.history.reduce((a, b) => a + b, 0) / this.history.length);
  }

  getMinFPS() {
    if (this.history.length === 0) return 0;
    return Math.min(...this.history);
  }

  subscribe(callback) {
    this.callbacks.add(callback);
  }

  unsubscribe(callback) {
    this.callbacks.delete(callback);
  }
}

/**
 * Memory Usage Tracker
 * Monitors JavaScript heap memory usage
 */
export class MemoryTracker {
  constructor() {
    this.history = [];
    this.maxHistory = 60;
    this.intervalId = null;
  }

  start(interval = 1000) {
    this.intervalId = setInterval(() => {
      const usage = this.getMemoryUsage();
      if (usage) {
        this.history.push({
          ...usage,
          timestamp: Date.now()
        });
        
        if (this.history.length > this.maxHistory) {
          this.history.shift();
        }
      }
    }, interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
        percentage: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100)
      };
    }
    return null;
  }

  getHistory() {
    return this.history;
  }

  getAverageUsage() {
    if (this.history.length === 0) return null;
    
    const avgUsed = this.history.reduce((sum, item) => sum + item.used, 0) / this.history.length;
    const avgPercentage = this.history.reduce((sum, item) => sum + item.percentage, 0) / this.history.length;
    
    return {
      used: Math.round(avgUsed),
      percentage: Math.round(avgPercentage)
    };
  }

  detectMemoryLeak() {
    if (this.history.length < 10) return false;
    
    // Check if memory is consistently increasing
    const recent = this.history.slice(-10);
    let increasing = 0;
    
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].used > recent[i - 1].used) {
        increasing++;
      }
    }
    
    // If memory increased in 8 out of 10 samples, potential leak
    return increasing >= 8;
  }
}

/**
 * Long Task Detector
 * Detects tasks that block the main thread for >50ms
 */
export class LongTaskDetector {
  constructor() {
    this.longTasks = [];
    this.observer = null;
    this.callbacks = new Set();
  }

  start() {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const task = {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
            timestamp: Date.now()
          };
          
          this.longTasks.push(task);
          this.callbacks.forEach(callback => callback(task));
          
          // Keep only last 50 tasks
          if (this.longTasks.length > 50) {
            this.longTasks.shift();
          }
        }
      });
      
      this.observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('Long task detection not supported:', error);
    }
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  getLongTasks() {
    return this.longTasks;
  }

  subscribe(callback) {
    this.callbacks.add(callback);
  }

  unsubscribe(callback) {
    this.callbacks.delete(callback);
  }
}

/**
 * Core Web Vitals Tracker
 * Tracks LCP, FID, CLS, FCP, TTFB
 */
export class CoreWebVitalsTracker {
  constructor() {
    this.vitals = {
      lcp: null,
      fid: null,
      cls: 0,
      fcp: null,
      ttfb: null
    };
    this.observers = [];
    this.callbacks = new Set();
  }

  start() {
    this.trackLCP();
    this.trackFID();
    this.trackCLS();
    this.trackFCP();
    this.trackTTFB();
  }

  trackLCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
        this.notifyCallbacks('lcp', this.vitals.lcp);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP tracking not supported:', error);
    }
  }

  trackFID() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.vitals.fid = entry.processingStart - entry.startTime;
          this.notifyCallbacks('fid', this.vitals.fid);
        }
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID tracking not supported:', error);
    }
  }

  trackCLS() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            this.vitals.cls += entry.value;
            this.notifyCallbacks('cls', this.vitals.cls);
          }
        }
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS tracking not supported:', error);
    }
  }

  trackFCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.vitals.fcp = entry.startTime;
            this.notifyCallbacks('fcp', this.vitals.fcp);
          }
        }
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP tracking not supported:', error);
    }
  }

  trackTTFB() {
    if (!performance.timing) return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.vitals.ttfb = navigation.responseStart - navigation.requestStart;
        this.notifyCallbacks('ttfb', this.vitals.ttfb);
      }
    });
  }

  stop() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  getVitals() {
    return { ...this.vitals };
  }

  getRatings() {
    return {
      lcp: this.rateLCP(this.vitals.lcp),
      fid: this.rateFID(this.vitals.fid),
      cls: this.rateCLS(this.vitals.cls),
      fcp: this.rateFCP(this.vitals.fcp),
      ttfb: this.rateTTFB(this.vitals.ttfb)
    };
  }

  rateLCP(value) {
    if (value === null) return 'unknown';
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  rateFID(value) {
    if (value === null) return 'unknown';
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  rateCLS(value) {
    if (value === null) return 'unknown';
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  rateFCP(value) {
    if (value === null) return 'unknown';
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  rateTTFB(value) {
    if (value === null) return 'unknown';
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  subscribe(callback) {
    this.callbacks.add(callback);
  }

  unsubscribe(callback) {
    this.callbacks.delete(callback);
  }

  notifyCallbacks(metric, value) {
    this.callbacks.forEach(callback => callback(metric, value));
  }
}

/**
 * Device Capability Detector
 * Detects device CPU, GPU, memory capabilities
 */
export class DeviceCapabilityDetector {
  constructor() {
    this.capabilities = null;
  }

  async detect() {
    const capabilities = {
      cpu: this.detectCPU(),
      memory: this.detectMemory(),
      gpu: await this.detectGPU(),
      connection: this.detectConnection(),
      screen: this.detectScreen(),
      tier: 'unknown'
    };

    // Calculate overall device tier
    capabilities.tier = this.calculateTier(capabilities);
    
    this.capabilities = capabilities;
    return capabilities;
  }

  detectCPU() {
    const cores = navigator.hardwareConcurrency || 2;
    
    return {
      cores,
      tier: cores >= 8 ? 'high' : cores >= 4 ? 'medium' : 'low'
    };
  }

  detectMemory() {
    const memory = navigator.deviceMemory || 4; // GB
    
    return {
      size: memory,
      tier: memory >= 8 ? 'high' : memory >= 4 ? 'medium' : 'low'
    };
  }

  async detectGPU() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return { vendor: 'unknown', renderer: 'unknown', tier: 'low' };
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
      
      // Detect GPU tier based on renderer string
      const tier = this.classifyGPU(renderer);
      
      return { vendor, renderer, tier };
    } catch (error) {
      return { vendor: 'unknown', renderer: 'unknown', tier: 'low' };
    }
  }

  classifyGPU(renderer) {
    const rendererLower = renderer.toLowerCase();
    
    // High-end GPUs
    if (rendererLower.includes('nvidia') || 
        rendererLower.includes('geforce') ||
        rendererLower.includes('radeon') ||
        rendererLower.includes('apple m1') ||
        rendererLower.includes('apple m2')) {
      return 'high';
    }
    
    // Integrated GPUs
    if (rendererLower.includes('intel') || 
        rendererLower.includes('integrated')) {
      return 'medium';
    }
    
    return 'low';
  }

  detectConnection() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
      return { type: 'unknown', effectiveType: 'unknown', tier: 'medium' };
    }

    const effectiveType = connection.effectiveType || 'unknown';
    const tier = effectiveType === '4g' ? 'high' : 
                 effectiveType === '3g' ? 'medium' : 'low';
    
    return {
      type: connection.type || 'unknown',
      effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData || false,
      tier
    };
  }

  detectScreen() {
    const width = window.screen.width;
    const height = window.screen.height;
    const dpr = window.devicePixelRatio || 1;
    
    return {
      width,
      height,
      dpr,
      tier: dpr >= 2 ? 'high' : 'medium'
    };
  }

  calculateTier(capabilities) {
    const scores = {
      high: 3,
      medium: 2,
      low: 1,
      unknown: 2
    };

    const cpuScore = scores[capabilities.cpu.tier];
    const memoryScore = scores[capabilities.memory.tier];
    const gpuScore = scores[capabilities.gpu.tier];
    const connectionScore = scores[capabilities.connection.tier];
    
    const avgScore = (cpuScore + memoryScore + gpuScore + connectionScore) / 4;
    
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }

  getCapabilities() {
    return this.capabilities;
  }
}

/**
 * Adaptive Performance Manager
 * Adjusts quality settings based on device capabilities and performance
 */
export class AdaptivePerformanceManager {
  constructor() {
    this.deviceCapabilities = null;
    this.currentSettings = null;
    this.fpsCounter = new FPSCounter();
    this.memoryTracker = new MemoryTracker();
    this.engine = detectBrowserEngine();
    this.callbacks = new Set();
  }

  async initialize() {
    const detector = new DeviceCapabilityDetector();
    this.deviceCapabilities = await detector.detect();
    this.currentSettings = this.getOptimalSettings();
    
    // Start monitoring
    this.fpsCounter.start();
    this.memoryTracker.start();
    
    // Subscribe to FPS changes
    this.fpsCounter.subscribe((fps) => {
      if (fps < 50) {
        this.degradeQuality();
      } else if (fps >= 58 && this.currentSettings.quality !== 'high') {
        this.improveQuality();
      }
    });
    
    return this.currentSettings;
  }

  getOptimalSettings() {
    const tier = this.deviceCapabilities?.tier || 'medium';
    const engine = this.engine;
    
    const settings = {
      quality: tier,
      animations: {
        enabled: true,
        duration: 300,
        complexity: 'full'
      },
      effects: {
        backdropBlur: 12,
        shadows: 'full',
        gradients: true
      },
      charts: {
        maxDataPoints: 1000,
        antialiasing: true,
        animations: true
      },
      rendering: {
        useGPU: true,
        useOffscreenCanvas: true,
        throttleUpdates: false
      }
    };

    // Adjust based on device tier
    if (tier === 'low') {
      settings.animations.duration = 200;
      settings.animations.complexity = 'simple';
      settings.effects.backdropBlur = 6;
      settings.effects.shadows = 'simple';
      settings.charts.maxDataPoints = 500;
      settings.charts.antialiasing = false;
      settings.rendering.throttleUpdates = true;
    } else if (tier === 'medium') {
      settings.animations.duration = 250;
      settings.effects.backdropBlur = 8;
      settings.charts.maxDataPoints = 750;
    }

    // Engine-specific adjustments
    if (engine === BrowserEngine.WEBKIT) {
      // Safari: Reduce backdrop blur for better performance
      settings.effects.backdropBlur = Math.min(settings.effects.backdropBlur, 8);
      settings.rendering.useOffscreenCanvas = false; // Limited support
    } else if (engine === BrowserEngine.GECKO) {
      // Firefox: Different rendering optimizations
      settings.charts.antialiasing = true; // Firefox handles this well
    }

    return settings;
  }

  degradeQuality() {
    if (!this.currentSettings) return;

    const current = this.currentSettings.quality;
    
    if (current === 'high') {
      this.currentSettings.quality = 'medium';
      this.applyMediumQuality();
    } else if (current === 'medium') {
      this.currentSettings.quality = 'low';
      this.applyLowQuality();
    }
    
    this.notifyCallbacks();
  }

  improveQuality() {
    if (!this.currentSettings) return;

    const current = this.currentSettings.quality;
    const deviceTier = this.deviceCapabilities?.tier || 'medium';
    
    if (current === 'low' && deviceTier !== 'low') {
      this.currentSettings.quality = 'medium';
      this.applyMediumQuality();
    } else if (current === 'medium' && deviceTier === 'high') {
      this.currentSettings.quality = 'high';
      this.applyHighQuality();
    }
    
    this.notifyCallbacks();
  }

  applyLowQuality() {
    this.currentSettings.animations.duration = 150;
    this.currentSettings.animations.complexity = 'minimal';
    this.currentSettings.effects.backdropBlur = 4;
    this.currentSettings.effects.shadows = 'none';
    this.currentSettings.effects.gradients = false;
    this.currentSettings.charts.maxDataPoints = 300;
    this.currentSettings.charts.antialiasing = false;
    this.currentSettings.charts.animations = false;
    this.currentSettings.rendering.throttleUpdates = true;
  }

  applyMediumQuality() {
    this.currentSettings.animations.duration = 250;
    this.currentSettings.animations.complexity = 'simple';
    this.currentSettings.effects.backdropBlur = 8;
    this.currentSettings.effects.shadows = 'simple';
    this.currentSettings.effects.gradients = true;
    this.currentSettings.charts.maxDataPoints = 750;
    this.currentSettings.charts.antialiasing = true;
    this.currentSettings.charts.animations = true;
    this.currentSettings.rendering.throttleUpdates = false;
  }

  applyHighQuality() {
    this.currentSettings.animations.duration = 300;
    this.currentSettings.animations.complexity = 'full';
    this.currentSettings.effects.backdropBlur = 12;
    this.currentSettings.effects.shadows = 'full';
    this.currentSettings.effects.gradients = true;
    this.currentSettings.charts.maxDataPoints = 1000;
    this.currentSettings.charts.antialiasing = true;
    this.currentSettings.charts.animations = true;
    this.currentSettings.rendering.throttleUpdates = false;
  }

  getSettings() {
    return this.currentSettings;
  }

  subscribe(callback) {
    this.callbacks.add(callback);
  }

  unsubscribe(callback) {
    this.callbacks.delete(callback);
  }

  notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.currentSettings));
  }

  cleanup() {
    this.fpsCounter.stop();
    this.memoryTracker.stop();
  }
}

/**
 * Engine-Specific Optimizations
 */
export const engineOptimizations = {
  /**
   * Chromium-specific optimizations
   */
  chromium: {
    // V8 engine optimizations
    optimizeHotPath: (fn) => {
      // Warm up function for V8 optimization
      for (let i = 0; i < 10; i++) {
        fn();
      }
    },
    
    // Use aggressive caching
    enableAggressiveCaching: () => {
      // Chromium has excellent cache support
      return true;
    },
    
    // GPU acceleration hints
    enableGPUAcceleration: (element) => {
      element.style.transform = 'translateZ(0)';
      element.style.willChange = 'transform, opacity';
    }
  },

  /**
   * Gecko-specific optimizations
   */
  gecko: {
    // SpiderMonkey engine optimizations
    optimizeForGecko: () => {
      // Firefox handles certain patterns better
      return {
        preferFlexbox: true, // Gecko's flexbox is very optimized
        useNativeScrollbar: true, // Better performance than custom
        avoidWillChange: false // Gecko handles will-change well
      };
    },
    
    // Optimize scrolling
    enableSmoothScrolling: (element) => {
      element.style.scrollBehavior = 'smooth';
    }
  },

  /**
   * WebKit-specific optimizations
   */
  webkit: {
    // JavaScriptCore engine optimizations
    optimizeForWebKit: () => {
      return {
        reduceBackdropBlur: true, // WebKit backdrop-filter is expensive
        useHardwareAcceleration: true,
        optimizeForMobile: true // Often on iOS
      };
    },
    
    // iOS-specific optimizations
    enableIOSOptimizations: (element) => {
      element.style.webkitOverflowScrolling = 'touch';
      element.style.webkitTapHighlightColor = 'transparent';
    },
    
    // Reduce backdrop blur for performance
    optimizeBackdropFilter: (element) => {
      const currentBlur = element.style.backdropFilter;
      if (currentBlur) {
        const match = currentBlur.match(/blur\((\d+)px\)/);
        if (match) {
          const blurValue = parseInt(match[1]);
          element.style.backdropFilter = `blur(${Math.min(blurValue, 8)}px)`;
          element.style.webkitBackdropFilter = `blur(${Math.min(blurValue, 8)}px)`;
        }
      }
    }
  }
};

/**
 * Apply engine-specific optimizations
 */
export const applyEngineOptimizations = () => {
  const engine = detectBrowserEngine();
  
  switch (engine) {
    case BrowserEngine.CHROMIUM:
      return engineOptimizations.chromium;
    case BrowserEngine.GECKO:
      return engineOptimizations.gecko;
    case BrowserEngine.WEBKIT:
      return engineOptimizations.webkit;
    default:
      return {};
  }
};

export default {
  BrowserEngine,
  detectBrowserEngine,
  FPSCounter,
  MemoryTracker,
  LongTaskDetector,
  CoreWebVitalsTracker,
  DeviceCapabilityDetector,
  AdaptivePerformanceManager,
  engineOptimizations,
  applyEngineOptimizations
};
