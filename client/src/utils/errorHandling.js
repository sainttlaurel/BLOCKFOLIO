/**
 * Error Handling Utilities for Professional Trading Platform
 * Provides comprehensive error classification, logging, and recovery mechanisms
 */

// Error Types Classification
export const ERROR_TYPES = {
  NETWORK: 'network',
  CHART: 'chart',
  TRADING: 'trading',
  DATA_PROCESSING: 'data_processing',
  AUTHENTICATION: 'authentication',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
};

// Error Severity Levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Classifies error type based on error message and context
 */
export const classifyError = (error, context = '') => {
  const message = error.message?.toLowerCase() || '';
  const stack = error.stack?.toLowerCase() || '';
  const contextLower = context.toLowerCase();

  // Network errors
  if (message.includes('fetch') || 
      message.includes('network') || 
      message.includes('failed to load') ||
      message.includes('connection') ||
      message.includes('timeout')) {
    return ERROR_TYPES.NETWORK;
  }

  // Chart/visualization errors
  if (contextLower.includes('chart') || 
      message.includes('canvas') ||
      message.includes('svg') ||
      stack.includes('chart')) {
    return ERROR_TYPES.CHART;
  }

  // Trading-specific errors
  if (contextLower.includes('trading') || 
      contextLower.includes('order') ||
      message.includes('balance') ||
      message.includes('trade')) {
    return ERROR_TYPES.TRADING;
  }

  // Data processing errors
  if (message.includes('parse') ||
      message.includes('json') ||
      message.includes('undefined') ||
      message.includes('null')) {
    return ERROR_TYPES.DATA_PROCESSING;
  }

  // Authentication errors
  if (message.includes('auth') ||
      message.includes('token') ||
      message.includes('unauthorized')) {
    return ERROR_TYPES.AUTHENTICATION;
  }

  // Validation errors
  if (message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required')) {
    return ERROR_TYPES.VALIDATION;
  }

  return ERROR_TYPES.UNKNOWN;
};

/**
 * Determines error severity based on type and context
 */
export const getErrorSeverity = (errorType, context = '') => {
  switch (errorType) {
    case ERROR_TYPES.TRADING:
      return ERROR_SEVERITY.CRITICAL;
    case ERROR_TYPES.AUTHENTICATION:
      return ERROR_SEVERITY.HIGH;
    case ERROR_TYPES.NETWORK:
      return ERROR_SEVERITY.MEDIUM;
    case ERROR_TYPES.CHART:
    case ERROR_TYPES.DATA_PROCESSING:
      return ERROR_SEVERITY.LOW;
    default:
      return ERROR_SEVERITY.MEDIUM;
  }
};

/**
 * Enhanced error logging with context and classification
 */
export const logError = (error, errorInfo, context = 'general') => {
  const errorType = classifyError(error, context);
  const severity = getErrorSeverity(errorType, context);
  
  const errorData = {
    timestamp: new Date().toISOString(),
    context,
    type: errorType,
    severity,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    errorInfo,
    userAgent: navigator.userAgent,
    url: window.location.href,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    sessionId: getSessionId(),
  };
  
  // Console logging with appropriate level
  const logLevel = severity === ERROR_SEVERITY.CRITICAL ? 'error' : 
                   severity === ERROR_SEVERITY.HIGH ? 'error' : 
                   severity === ERROR_SEVERITY.MEDIUM ? 'warn' : 'log';
  
  console[logLevel]('Trading Platform Error:', errorData);
  
  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    sendToErrorTracking(errorData);
  }
  
  return errorData;
};

/**
 * Get or create session ID for error tracking
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('trading_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('trading_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Send error data to tracking service (placeholder for production implementation)
 */
const sendToErrorTracking = (errorData) => {
  // Placeholder for error tracking service integration
  // Example: Sentry, LogRocket, Bugsnag, etc.
  
  try {
    // Example implementation:
    // if (window.Sentry) {
    //   window.Sentry.captureException(new Error(errorData.error.message), {
    //     tags: {
    //       context: errorData.context,
    //       type: errorData.type,
    //       severity: errorData.severity
    //     },
    //     extra: errorData
    //   });
    // }
    
    // For now, just store in localStorage for debugging
    const errors = JSON.parse(localStorage.getItem('trading_errors') || '[]');
    errors.push(errorData);
    
    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.splice(0, errors.length - 50);
    }
    
    localStorage.setItem('trading_errors', JSON.stringify(errors));
  } catch (e) {
    console.warn('Failed to send error to tracking service:', e);
  }
};

/**
 * Network error recovery utilities
 */
export const networkErrorRecovery = {
  /**
   * Retry with exponential backoff
   */
  retryWithBackoff: async (fn, maxRetries = 3, baseDelay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  /**
   * Check network connectivity
   */
  checkConnectivity: async () => {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get cached data fallback
   */
  getCachedData: (key) => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },

  /**
   * Set cached data
   */
  setCachedData: (key, data, ttl = 300000) => { // 5 minutes default TTL
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Failed to cache data:', e);
    }
  }
};

/**
 * Error recovery strategies by type
 */
export const errorRecoveryStrategies = {
  [ERROR_TYPES.NETWORK]: {
    autoRetry: true,
    maxRetries: 3,
    showFallback: true,
    userMessage: 'Connection issue detected. Retrying automatically...'
  },
  
  [ERROR_TYPES.CHART]: {
    autoRetry: true,
    maxRetries: 2,
    showFallback: true,
    userMessage: 'Chart temporarily unavailable. Please try again.'
  },
  
  [ERROR_TYPES.TRADING]: {
    autoRetry: false,
    maxRetries: 0,
    showFallback: false,
    userMessage: 'Trading error occurred. Please refresh and try again.'
  },
  
  [ERROR_TYPES.DATA_PROCESSING]: {
    autoRetry: true,
    maxRetries: 2,
    showFallback: true,
    userMessage: 'Data processing error. Using cached information.'
  },
  
  [ERROR_TYPES.AUTHENTICATION]: {
    autoRetry: false,
    maxRetries: 0,
    showFallback: false,
    userMessage: 'Authentication required. Please log in again.'
  }
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error, context = '') => {
  const errorType = classifyError(error, context);
  const strategy = errorRecoveryStrategies[errorType];
  
  if (strategy?.userMessage) {
    return strategy.userMessage;
  }
  
  // Fallback messages
  const fallbackMessages = {
    [ERROR_TYPES.NETWORK]: 'Network connection issue. Please check your internet connection.',
    [ERROR_TYPES.CHART]: 'Unable to display chart. Please try refreshing.',
    [ERROR_TYPES.TRADING]: 'Trading operation failed. Please try again.',
    [ERROR_TYPES.DATA_PROCESSING]: 'Data processing error. Some information may be outdated.',
    [ERROR_TYPES.AUTHENTICATION]: 'Authentication error. Please log in again.',
    [ERROR_TYPES.VALIDATION]: 'Invalid input. Please check your data and try again.',
    [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
  };
  
  return fallbackMessages[errorType] || 'Something went wrong. Please try again.';
};

/**
 * Error boundary configuration factory
 */
export const createErrorBoundaryConfig = (context, options = {}) => {
  const errorType = context.toLowerCase();
  const strategy = errorRecoveryStrategies[errorType] || errorRecoveryStrategies[ERROR_TYPES.UNKNOWN];
  
  return {
    context,
    title: options.title || `${context} Error`,
    message: options.message || getUserFriendlyMessage({ message: '' }, context),
    showRetry: options.showRetry !== false && strategy.autoRetry,
    showRefresh: options.showRefresh !== false,
    compact: options.compact || false,
    maxRetries: options.maxRetries || strategy.maxRetries,
    ...options
  };
};

const errorHandlingUtils = {
  ERROR_TYPES,
  ERROR_SEVERITY,
  classifyError,
  getErrorSeverity,
  logError,
  networkErrorRecovery,
  errorRecoveryStrategies,
  getUserFriendlyMessage,
  createErrorBoundaryConfig
};

export default errorHandlingUtils;