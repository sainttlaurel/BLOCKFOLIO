/**
 * React Hooks for Feature Fallbacks
 * 
 * Provides React hooks for using feature fallbacks
 * Automatically detects feature support and uses fallbacks when needed
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  IntersectionObserverFallback,
  ResizeObserverFallback,
  WebSocketFallback,
  vibrateFallback,
  getStorageWithFallback,
  getFallbackStatus
} from '../utils/featureFallbacks';

/**
 * Hook for IntersectionObserver with fallback
 * @param {Function} callback - Callback function
 * @param {Object} options - IntersectionObserver options
 * @returns {Object} Observer instance and observe function
 */
export const useIntersectionObserver = (callback, options = {}) => {
  const observerRef = useRef(null);
  
  useEffect(() => {
    observerRef.current = new IntersectionObserverFallback(callback, options);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);
  
  const observe = useCallback((element) => {
    if (observerRef.current && element) {
      observerRef.current.observe(element);
    }
  }, []);
  
  const unobserve = useCallback((element) => {
    if (observerRef.current && element) {
      observerRef.current.unobserve(element);
    }
  }, []);
  
  return { observe, unobserve, observer: observerRef.current };
};

/**
 * Hook for ResizeObserver with fallback
 * @param {Function} callback - Callback function
 * @returns {Object} Observer instance and observe function
 */
export const useResizeObserver = (callback) => {
  const observerRef = useRef(null);
  
  useEffect(() => {
    observerRef.current = new ResizeObserverFallback(callback);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback]);
  
  const observe = useCallback((element) => {
    if (observerRef.current && element) {
      observerRef.current.observe(element);
    }
  }, []);
  
  const unobserve = useCallback((element) => {
    if (observerRef.current && element) {
      observerRef.current.unobserve(element);
    }
  }, []);
  
  return { observe, unobserve, observer: observerRef.current };
};

/**
 * Hook for WebSocket with polling fallback
 * @param {string} url - WebSocket URL
 * @param {Object} options - WebSocket options
 * @returns {Object} WebSocket instance and connection state
 */
export const useWebSocket = (url, options = {}) => {
  const [readyState, setReadyState] = useState(0); // CONNECTING
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  
  useEffect(() => {
    if (!url) return;
    
    const socket = new WebSocketFallback(url, options.protocols);
    socketRef.current = socket;
    
    socket.onopen = (event) => {
      setReadyState(1); // OPEN
      setError(null);
      if (options.onOpen) options.onOpen(event);
    };
    
    socket.onclose = (event) => {
      setReadyState(3); // CLOSED
      if (options.onClose) options.onClose(event);
    };
    
    socket.onerror = (event) => {
      setError(event.error || 'WebSocket error');
      if (options.onError) options.onError(event);
    };
    
    socket.onmessage = (event) => {
      setLastMessage(event.data);
      if (options.onMessage) options.onMessage(event);
    };
    
    return () => {
      socket.close();
    };
  }, [url, options]);
  
  const send = useCallback((data) => {
    if (socketRef.current && readyState === 1) {
      socketRef.current.send(data);
    }
  }, [readyState]);
  
  return {
    socket: socketRef.current,
    readyState,
    lastMessage,
    error,
    send,
    isConnected: readyState === 1,
    isConnecting: readyState === 0,
    isClosed: readyState === 3
  };
};

/**
 * Hook for vibration with fallback
 * @returns {Function} Vibrate function
 */
export const useVibration = () => {
  const vibrate = useCallback((pattern) => {
    return vibrateFallback(pattern);
  }, []);
  
  return vibrate;
};

/**
 * Hook for localStorage with in-memory fallback
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value
 * @returns {Array} [value, setValue, removeValue]
 */
export const useLocalStorage = (key, initialValue) => {
  const storage = getStorageWithFallback();
  
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return initialValue;
    }
  });
  
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      storage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  }, [key, storedValue, storage]);
  
  const removeValue = useCallback(() => {
    try {
      storage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  }, [key, initialValue, storage]);
  
  return [storedValue, setValue, removeValue];
};

/**
 * Hook for feature fallback status
 * @returns {Object} Fallback status
 */
export const useFallbackStatus = () => {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    const fallbackStatus = getFallbackStatus();
    setStatus(fallbackStatus);
  }, []);
  
  return status;
};

/**
 * Hook for lazy loading with IntersectionObserver fallback
 * @param {Object} options - Options
 * @returns {Array} [ref, isVisible]
 */
export const useLazyLoad = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);
  
  const { observe } = useIntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (options.once !== false) {
          // Unobserve after first intersection
          if (observerRef.current) {
            observerRef.current.unobserve(entry.target);
          }
        }
      }
    });
  }, {
    threshold: options.threshold || 0.1,
    rootMargin: options.rootMargin || '50px'
  });
  
  const observerRef = useRef(null);
  
  useEffect(() => {
    if (elementRef.current) {
      observe(elementRef.current);
    }
  }, [observe]);
  
  return [elementRef, isVisible];
};

/**
 * Hook for element size tracking with ResizeObserver fallback
 * @returns {Array} [ref, size]
 */
export const useElementSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const elementRef = useRef(null);
  
  const { observe } = useResizeObserver((entries) => {
    entries.forEach(entry => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
  });
  
  useEffect(() => {
    if (elementRef.current) {
      observe(elementRef.current);
    }
  }, [observe]);
  
  return [elementRef, size];
};

/**
 * Hook for checking if feature is supported
 * @param {string} feature - Feature name
 * @returns {boolean} Whether feature is supported
 */
export const useFeatureSupport = (feature) => {
  const [isSupported, setIsSupported] = useState(true);
  
  useEffect(() => {
    const status = getFallbackStatus();
    const featureStatus = status.features[feature];
    setIsSupported(featureStatus ? featureStatus.native : true);
  }, [feature]);
  
  return isSupported;
};

export default {
  useIntersectionObserver,
  useResizeObserver,
  useWebSocket,
  useVibration,
  useLocalStorage,
  useFallbackStatus,
  useLazyLoad,
  useElementSize,
  useFeatureSupport
};
