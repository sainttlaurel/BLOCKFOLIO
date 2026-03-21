/**
 * Feature Fallbacks
 * 
 * Provides fallback implementations for unsupported browser features
 * Ensures graceful degradation when modern features are unavailable
 * 
 * Features covered:
 * - IntersectionObserver: Immediate loading fallback
 * - ResizeObserver: Window resize event fallback
 * - WebSocket: Polling fallback
 * - Vibration API: Silent fallback
 * - Service Worker: No offline support
 * - localStorage: In-memory storage fallback
 * - CSS features: Handled via CSS @supports
 */

import { checkFeatureSupport, detectBrowser } from './browserDetection';

/**
 * IntersectionObserver Fallback
 * Falls back to immediate execution if IntersectionObserver is not available
 */
export class IntersectionObserverFallback {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.options = options;
    this.observedElements = new Set();
    
    // Check if native IntersectionObserver is available
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(callback, options);
      this.isNative = true;
    } else {
      this.observer = null;
      this.isNative = false;
      console.warn('IntersectionObserver not supported. Using immediate loading fallback.');
    }
  }
  
  observe(element) {
    if (this.isNative) {
      this.observer.observe(element);
    } else {
      // Fallback: Immediately trigger callback as if element is visible
      this.observedElements.add(element);
      this.callback([{
        target: element,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: element.getBoundingClientRect(),
        intersectionRect: element.getBoundingClientRect(),
        rootBounds: null,
        time: Date.now()
      }], this);
    }
  }
  
  unobserve(element) {
    if (this.isNative) {
      this.observer.unobserve(element);
    } else {
      this.observedElements.delete(element);
    }
  }
  
  disconnect() {
    if (this.isNative) {
      this.observer.disconnect();
    } else {
      this.observedElements.clear();
    }
  }
}

/**
 * ResizeObserver Fallback
 * Falls back to window resize events if ResizeObserver is not available
 */
export class ResizeObserverFallback {
  constructor(callback) {
    this.callback = callback;
    this.observedElements = new Map();
    this.resizeHandler = null;
    
    // Check if native ResizeObserver is available
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(callback);
      this.isNative = true;
    } else {
      this.observer = null;
      this.isNative = false;
      this.setupFallback();
      console.warn('ResizeObserver not supported. Using window resize event fallback.');
    }
  }
  
  setupFallback() {
    let resizeTimeout;
    this.resizeHandler = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const entries = [];
        this.observedElements.forEach((lastSize, element) => {
          const rect = element.getBoundingClientRect();
          const contentRect = {
            width: rect.width,
            height: rect.height,
            top: 0,
            left: 0,
            right: rect.width,
            bottom: rect.height,
            x: 0,
            y: 0
          };
          
          // Only trigger if size actually changed
          if (lastSize.width !== rect.width || lastSize.height !== rect.height) {
            entries.push({
              target: element,
              contentRect,
              borderBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
              contentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
              devicePixelContentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }]
            });
            
            this.observedElements.set(element, { width: rect.width, height: rect.height });
          }
        });
        
        if (entries.length > 0) {
          this.callback(entries, this);
        }
      }, 100); // Debounce resize events
    };
    
    window.addEventListener('resize', this.resizeHandler);
  }
  
  observe(element) {
    if (this.isNative) {
      this.observer.observe(element);
    } else {
      const rect = element.getBoundingClientRect();
      this.observedElements.set(element, { width: rect.width, height: rect.height });
      
      // Trigger initial callback
      this.callback([{
        target: element,
        contentRect: {
          width: rect.width,
          height: rect.height,
          top: 0,
          left: 0,
          right: rect.width,
          bottom: rect.height,
          x: 0,
          y: 0
        },
        borderBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
        contentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
        devicePixelContentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }]
      }], this);
    }
  }
  
  unobserve(element) {
    if (this.isNative) {
      this.observer.unobserve(element);
    } else {
      this.observedElements.delete(element);
    }
  }
  
  disconnect() {
    if (this.isNative) {
      this.observer.disconnect();
    } else {
      this.observedElements.clear();
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }
    }
  }
}

/**
 * WebSocket Fallback
 * Falls back to HTTP polling if WebSocket is not available
 */
export class WebSocketFallback {
  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = 0; // CONNECTING
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this.pollingInterval = null;
    this.pollingDelay = 5000; // 5 seconds
    
    // Check if native WebSocket is available
    if (typeof WebSocket !== 'undefined') {
      this.socket = new WebSocket(url, protocols);
      this.isNative = true;
      this.setupNativeHandlers();
    } else {
      this.socket = null;
      this.isNative = false;
      this.setupPollingFallback();
      console.warn('WebSocket not supported. Using HTTP polling fallback.');
    }
  }
  
  setupNativeHandlers() {
    this.socket.onopen = (event) => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen(event);
    };
    
    this.socket.onclose = (event) => {
      this.readyState = 3; // CLOSED
      if (this.onclose) this.onclose(event);
    };
    
    this.socket.onerror = (event) => {
      if (this.onerror) this.onerror(event);
    };
    
    this.socket.onmessage = (event) => {
      if (this.onmessage) this.onmessage(event);
    };
  }
  
  setupPollingFallback() {
    // Convert WebSocket URL to HTTP URL
    const httpUrl = this.url.replace('ws://', 'http://').replace('wss://', 'https://');
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen({ type: 'open', target: this });
      }
      
      // Start polling
      this.startPolling(httpUrl);
    }, 100);
  }
  
  startPolling(url) {
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (this.onmessage && this.readyState === 1) {
          this.onmessage({
            type: 'message',
            data: JSON.stringify(data),
            target: this
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (this.onerror) {
          this.onerror({ type: 'error', error, target: this });
        }
      }
    }, this.pollingDelay);
  }
  
  send(data) {
    if (this.isNative) {
      this.socket.send(data);
    } else {
      console.warn('WebSocket fallback: send() not supported in polling mode');
      // Could implement POST request here if needed
    }
  }
  
  close(code, reason) {
    if (this.isNative) {
      this.socket.close(code, reason);
    } else {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
      this.readyState = 3; // CLOSED
      if (this.onclose) {
        this.onclose({ type: 'close', code, reason, target: this });
      }
    }
  }
}

/**
 * Vibration API Fallback
 * Silent fallback for browsers that don't support vibration
 */
export const vibrateFallback = (pattern) => {
  if (typeof navigator.vibrate !== 'undefined') {
    return navigator.vibrate(pattern);
  }
  // Silent fallback - do nothing
  return false;
};

/**
 * localStorage Fallback
 * In-memory storage for browsers without localStorage support
 */
class LocalStorageFallback {
  constructor() {
    this.storage = new Map();
    this.isNative = false;
  }
  
  getItem(key) {
    return this.storage.get(key) || null;
  }
  
  setItem(key, value) {
    this.storage.set(key, String(value));
  }
  
  removeItem(key) {
    this.storage.delete(key);
  }
  
  clear() {
    this.storage.clear();
  }
  
  key(index) {
    const keys = Array.from(this.storage.keys());
    return keys[index] || null;
  }
  
  get length() {
    return this.storage.size;
  }
}

/**
 * Get storage with fallback
 * @returns {Storage|LocalStorageFallback} Storage implementation
 */
export const getStorageWithFallback = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      // Test if localStorage is actually accessible
      localStorage.setItem('__test__', 'test');
      localStorage.removeItem('__test__');
      return localStorage;
    }
  } catch (e) {
    console.warn('localStorage not available. Using in-memory fallback.');
  }
  
  return new LocalStorageFallback();
};

/**
 * Service Worker Fallback
 * No-op fallback for browsers without Service Worker support
 */
export const registerServiceWorkerWithFallback = async (scriptURL, options) => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(scriptURL, options);
      return { success: true, registration, fallback: false };
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return { success: false, error, fallback: true };
    }
  } else {
    console.warn('Service Worker not supported. Offline functionality will be limited.');
    return {
      success: false,
      error: 'Service Worker not supported',
      fallback: true,
      message: 'Your browser does not support offline functionality'
    };
  }
};

/**
 * Check if feature has fallback available
 * @param {string} feature - Feature name
 * @returns {boolean} Whether fallback is available
 */
export const hasFallback = (feature) => {
  const fallbacks = {
    intersectionObserver: true,
    resizeObserver: true,
    webSocket: true,
    vibrate: true,
    localStorage: true,
    serviceWorker: true,
    backdropFilter: true, // CSS fallback
    cssGrid: true, // CSS fallback
    clamp: true, // CSS fallback
    scrollSnap: false // Degrades gracefully without fallback
  };
  
  return fallbacks[feature] || false;
};

/**
 * Get fallback status for all features
 * @returns {Object} Fallback status
 */
export const getFallbackStatus = () => {
  const features = checkFeatureSupport();
  const browser = detectBrowser();
  
  return {
    browser: {
      name: browser.name,
      version: browser.version,
      isSupported: browser.isSupported
    },
    features: {
      intersectionObserver: {
        native: features.intersectionObserver,
        fallback: !features.intersectionObserver ? 'immediate-loading' : null,
        impact: 'medium'
      },
      resizeObserver: {
        native: features.resizeObserver,
        fallback: !features.resizeObserver ? 'window-resize-events' : null,
        impact: 'low'
      },
      webSocket: {
        native: features.webSocket,
        fallback: !features.webSocket ? 'http-polling' : null,
        impact: 'high'
      },
      vibrate: {
        native: features.vibrate,
        fallback: !features.vibrate ? 'silent' : null,
        impact: 'low'
      },
      localStorage: {
        native: features.localStorage,
        fallback: !features.localStorage ? 'in-memory' : null,
        impact: 'medium'
      },
      serviceWorker: {
        native: features.serviceWorker,
        fallback: !features.serviceWorker ? 'no-offline' : null,
        impact: 'medium'
      },
      backdropFilter: {
        native: features.backdropFilter,
        fallback: !features.backdropFilter ? 'solid-background' : null,
        impact: 'low'
      },
      cssGrid: {
        native: features.cssGrid,
        fallback: !features.cssGrid ? 'flexbox' : null,
        impact: 'low'
      },
      clamp: {
        native: features.clamp,
        fallback: !features.clamp ? 'fixed-sizes' : null,
        impact: 'low'
      }
    }
  };
};

/**
 * Initialize all fallbacks
 * @returns {Object} Initialization results
 */
export const initFallbacks = () => {
  const status = getFallbackStatus();
  const activeFallbacks = [];
  
  // Log active fallbacks
  Object.entries(status.features).forEach(([feature, info]) => {
    if (info.fallback) {
      activeFallbacks.push({
        feature,
        fallback: info.fallback,
        impact: info.impact
      });
    }
  });
  
  if (activeFallbacks.length > 0 && process.env.NODE_ENV === 'development') {
    console.group('🔄 Active Feature Fallbacks');
    activeFallbacks.forEach(({ feature, fallback, impact }) => {
      const icon = impact === 'high' ? '⚠️' : impact === 'medium' ? '⚡' : 'ℹ️';
      console.log(`${icon} ${feature}: ${fallback} (${impact} impact)`);
    });
    console.groupEnd();
  }
  
  return {
    status,
    activeFallbacks,
    count: activeFallbacks.length
  };
};

export default {
  IntersectionObserverFallback,
  ResizeObserverFallback,
  WebSocketFallback,
  vibrateFallback,
  getStorageWithFallback,
  registerServiceWorkerWithFallback,
  hasFallback,
  getFallbackStatus,
  initFallbacks
};
