/**
 * Error Message Service for Professional Trading Platform
 * 
 * Provides comprehensive user-friendly error messaging and recovery options
 * that integrate with existing error handling, retry mechanisms, graceful
 * degradation, and offline mode systems.
 * 
 * Features:
 * - Categorized error messages with clear, non-technical language
 * - Contextual error messages based on user action and system state
 * - Actionable recovery suggestions and step-by-step guidance
 * - Progressive error handling with escalating severity
 * - Smart error aggregation to prevent message spam
 * - Integration with existing error boundaries and services
 */

import { EventEmitter } from 'events';
import retryService from './retryService';
import gracefulDegradationService from './gracefulDegradation';
import offlineService from './offlineService';
import fallbackManager from './fallbackManager';

class ErrorMessageService extends EventEmitter {
  constructor() {
    super();
    
    // Error categories with user-friendly messaging
    this.errorCategories = {
      network: {
        name: 'Connection Issues',
        icon: 'wifi-off',
        color: 'orange',
        priority: 'medium'
      },
      server: {
        name: 'Server Problems',
        icon: 'server',
        color: 'red',
        priority: 'high'
      },
      client: {
        name: 'Request Issues',
        icon: 'alert-circle',
        color: 'yellow',
        priority: 'low'
      },
      authentication: {
        name: 'Authentication',
        icon: 'lock',
        color: 'purple',
        priority: 'high'
      },
      trading: {
        name: 'Trading Operations',
        icon: 'trending-up',
        color: 'red',
        priority: 'critical'
      },
      data: {
        name: 'Data Loading',
        icon: 'database',
        color: 'blue',
        priority: 'medium'
      },
      validation: {
        name: 'Input Validation',
        icon: 'alert-triangle',
        color: 'yellow',
        priority: 'low'
      }
    };
    
    // User-friendly error messages with context
    this.errorMessages = {
      // Network errors
      'NETWORK_ERROR': {
        title: 'Connection Problem',
        message: 'Unable to connect to our servers. Please check your internet connection.',
        category: 'network',
        severity: 'warning',
        userActions: ['check_connection', 'retry_request', 'use_offline_mode']
      },
      'TIMEOUT': {
        title: 'Request Timed Out',
        message: 'The request is taking longer than expected. This might be due to a slow connection.',
        category: 'network',
        severity: 'warning',
        userActions: ['retry_request', 'check_connection', 'wait_and_retry']
      },
      'CONNECTION_REFUSED': {
        title: 'Connection Refused',
        message: 'Our servers are temporarily unavailable. We\'re working to restore service.',
        category: 'server',
        severity: 'error',
        userActions: ['wait_and_retry', 'check_status_page', 'use_offline_mode']
      },
      
      // Server errors
      'INTERNAL_SERVER_ERROR': {
        title: 'Server Error',
        message: 'Something went wrong on our end. Our team has been notified and is working on a fix.',
        category: 'server',
        severity: 'error',
        userActions: ['retry_request', 'wait_and_retry', 'contact_support']
      },
      'SERVICE_UNAVAILABLE': {
        title: 'Service Temporarily Unavailable',
        message: 'Our servers are currently under maintenance or experiencing high load.',
        category: 'server',
        severity: 'error',
        userActions: ['wait_and_retry', 'check_status_page', 'use_offline_mode']
      },
      'BAD_GATEWAY': {
        title: 'Gateway Error',
        message: 'There\'s a temporary issue with our server infrastructure. Please try again in a moment.',
        category: 'server',
        severity: 'error',
        userActions: ['retry_request', 'wait_and_retry']
      }
    };
    
    // Authentication errors
    this.errorMessages['UNAUTHORIZED'] = {
      title: 'Authentication Required',
      message: 'You need to log in to access this feature. Your session may have expired.',
      category: 'authentication',
      severity: 'warning',
      userActions: ['login_again', 'refresh_session', 'contact_support']
    };
    
    this.errorMessages['FORBIDDEN'] = {
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action. Contact support if you believe this is an error.',
      category: 'authentication',
      severity: 'error',
      userActions: ['check_permissions', 'contact_support', 'login_again']
    };
    
    // Trading errors
    this.errorMessages['INSUFFICIENT_BALANCE'] = {
      title: 'Insufficient Balance',
      message: 'You don\'t have enough funds to complete this trade. Please check your available balance.',
      category: 'trading',
      severity: 'warning',
      userActions: ['check_balance', 'adjust_amount', 'add_funds']
    };
    
    this.errorMessages['MARKET_CLOSED'] = {
      title: 'Market Closed',
      message: 'Trading is currently unavailable. Markets may be closed or under maintenance.',
      category: 'trading',
      severity: 'info',
      userActions: ['check_market_hours', 'queue_order', 'set_alert']
    };
    
    this.errorMessages['INVALID_ORDER'] = {
      title: 'Invalid Order',
      message: 'The order details are not valid. Please check the amount and try again.',
      category: 'trading',
      severity: 'warning',
      userActions: ['check_order_details', 'adjust_amount', 'contact_support']
    };
    
    // Data errors
    this.errorMessages['DATA_UNAVAILABLE'] = {
      title: 'Data Temporarily Unavailable',
      message: 'We\'re having trouble loading the latest data. You can view cached information instead.',
      category: 'data',
      severity: 'warning',
      userActions: ['use_cached_data', 'retry_request', 'refresh_page']
    };
    
    this.errorMessages['STALE_DATA'] = {
      title: 'Data May Be Outdated',
      message: 'The information shown may not be current due to connection issues.',
      category: 'data',
      severity: 'info',
      userActions: ['refresh_data', 'check_timestamp', 'use_offline_mode']
    };
    
    // Validation errors
    this.errorMessages['VALIDATION_ERROR'] = {
      title: 'Invalid Input',
      message: 'Please check your input and make sure all required fields are filled correctly.',
      category: 'validation',
      severity: 'warning',
      userActions: ['check_input', 'clear_form', 'see_examples']
    };
    
    this.errorMessages['RATE_LIMITED'] = {
      title: 'Too Many Requests',
      message: 'You\'re making requests too quickly. Please wait a moment before trying again.',
      category: 'client',
      severity: 'warning',
      userActions: ['wait_and_retry', 'slow_down_requests']
    };
    
    // Recovery actions with detailed instructions
    this.recoveryActions = {
      check_connection: {
        label: 'Check Connection',
        description: 'Verify your internet connection',
        icon: 'wifi',
        instructions: [
          'Check if other websites are loading',
          'Try refreshing the page',
          'Check your WiFi or mobile data connection',
          'Contact your internet provider if issues persist'
        ],
        automated: false,
        priority: 'high'
      },
      
      retry_request: {
        label: 'Try Again',
        description: 'Retry the failed operation',
        icon: 'refresh-cw',
        instructions: [
          'Click the retry button to attempt the operation again',
          'The system will automatically retry with improved settings'
        ],
        automated: true,
        priority: 'high'
      },
      
      use_offline_mode: {
        label: 'Use Offline Mode',
        description: 'Switch to cached data',
        icon: 'database',
        instructions: [
          'View your portfolio using cached data',
          'Access historical information',
          'Queue trades for when connection returns',
          'Export data for offline analysis'
        ],
        automated: true,
        priority: 'medium'
      },
      
      wait_and_retry: {
        label: 'Wait & Retry',
        description: 'Wait a moment and try again',
        icon: 'clock',
        instructions: [
          'Wait 30 seconds to 2 minutes',
          'The system will automatically retry',
          'Check our status page for updates'
        ],
        automated: true,
        priority: 'medium'
      },
      
      login_again: {
        label: 'Log In Again',
        description: 'Refresh your authentication',
        icon: 'log-in',
        instructions: [
          'Click the login button',
          'Enter your credentials',
          'Enable "Remember me" to stay logged in longer'
        ],
        automated: false,
        priority: 'high'
      },
      
      check_balance: {
        label: 'Check Balance',
        description: 'Review your available funds',
        icon: 'dollar-sign',
        instructions: [
          'Go to your portfolio page',
          'Check available balance for the selected currency',
          'Consider the trading fees in your calculation'
        ],
        automated: false,
        priority: 'high'
      },
      
      contact_support: {
        label: 'Contact Support',
        description: 'Get help from our team',
        icon: 'help-circle',
        instructions: [
          'Click the support button',
          'Describe what you were trying to do',
          'Include any error codes or messages',
          'Our team will respond within 24 hours'
        ],
        automated: false,
        priority: 'low'
      },
      
      refresh_page: {
        label: 'Refresh Page',
        description: 'Reload the application',
        icon: 'rotate-ccw',
        instructions: [
          'Press F5 or click the refresh button',
          'Wait for the page to fully load',
          'Your data will be restored from the server'
        ],
        automated: false,
        priority: 'medium'
      },
      
      use_cached_data: {
        label: 'View Cached Data',
        description: 'See previously loaded information',
        icon: 'archive',
        instructions: [
          'Switch to cached data view',
          'Check the data timestamp',
          'Note that information may be outdated'
        ],
        automated: true,
        priority: 'medium'
      }
    };
    
    // Error context tracking
    this.errorContext = {
      currentPage: null,
      userAction: null,
      systemState: null,
      recentErrors: [],
      errorFrequency: new Map(),
      suppressedErrors: new Set()
    };
    
    // Error aggregation settings
    this.aggregationConfig = {
      maxRecentErrors: 10,
      suppressDuplicateWindow: 30000, // 30 seconds
      escalationThreshold: 3,
      cooldownPeriod: 300000 // 5 minutes
    };
    
    // Initialize service
    this.initialize();
  }

  /**
   * Initialize error message service
   */
  initialize() {
    // Listen to existing service events
    this.setupServiceIntegration();
    
    // Setup error context tracking
    this.setupContextTracking();
    
    // Setup error aggregation
    this.setupErrorAggregation();
    
    console.log('Error Message Service initialized');
  }

  /**
   * Setup integration with existing services
   */
  setupServiceIntegration() {
    // Listen to retry service events
    retryService.addStatusListener((event, data) => {
      this.handleRetryServiceEvent(event, data);
    });
    
    // Listen to graceful degradation events
    gracefulDegradationService.on('degradationLevelChanged', (data) => {
      this.handleDegradationChange(data);
    });
    
    // Listen to offline service events
    offlineService.addListener((event, data) => {
      this.handleOfflineServiceEvent(event, data);
    });
    
    // Listen to fallback manager events
    fallbackManager.on('fallbackActivated', (connectionType, strategy) => {
      this.handleFallbackActivated(connectionType, strategy);
    });
  }

  /**
   * Setup error context tracking
   */
  setupContextTracking() {
    // Track page changes
    window.addEventListener('popstate', () => {
      this.updateContext({ currentPage: window.location.pathname });
    });
    
    // Track user actions
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-action]')) {
        const action = event.target.closest('[data-action]').dataset.action;
        this.updateContext({ userAction: action });
      }
    });
  }

  /**
   * Setup error aggregation and suppression
   */
  setupErrorAggregation() {
    // Clean up old errors periodically
    setInterval(() => {
      this.cleanupOldErrors();
    }, 60000); // Every minute
    
    // Reset error frequency counters
    setInterval(() => {
      this.resetErrorFrequency();
    }, this.aggregationConfig.cooldownPeriod);
  }

  /**
   * Process and display user-friendly error message
   */
  processError(error, context = {}) {
    // Update error context
    this.updateContext(context);
    
    // Classify the error
    const errorType = this.classifyError(error);
    const errorKey = this.getErrorKey(error, errorType);
    
    // Check if error should be suppressed
    if (this.shouldSuppressError(errorKey)) {
      console.log('Error suppressed due to recent duplicate:', errorKey);
      return null;
    }
    
    // Get error message configuration
    const messageConfig = this.getErrorMessage(errorKey, error);
    
    // Generate recovery options
    const recoveryOptions = this.generateRecoveryOptions(messageConfig, error, context);
    
    // Create comprehensive error response
    const errorResponse = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: errorType,
      category: messageConfig.category,
      severity: messageConfig.severity,
      title: messageConfig.title,
      message: this.contextualizeMessage(messageConfig.message, context),
      originalError: error,
      context: { ...this.errorContext, ...context },
      recoveryOptions,
      metadata: {
        canRetry: this.canRetry(error, errorType),
        isTemporary: this.isTemporaryError(error, errorType),
        affectedFeatures: this.getAffectedFeatures(error, context),
        estimatedRecoveryTime: this.estimateRecoveryTime(error, errorType)
      }
    };
    
    // Track error for aggregation
    this.trackError(errorKey, errorResponse);
    
    // Emit error event
    this.emit('errorProcessed', errorResponse);
    
    return errorResponse;
  }
  /**
   * Classify error type for appropriate messaging
   */
  classifyError(error) {
    // Network errors
    if (error.code === 'NETWORK_ERROR' || 
        error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('fetch')) {
      return 'network';
    }
    
    // HTTP status code based classification
    if (error.response?.status) {
      const status = error.response.status;
      
      if (status >= 500) return 'server';
      if (status === 401 || status === 403) return 'authentication';
      if (status === 429) return 'client';
      if (status >= 400) return 'validation';
    }
    
    // Trading specific errors
    if (error.code?.includes('TRADING') || 
        error.code?.includes('BALANCE') ||
        error.code?.includes('ORDER')) {
      return 'trading';
    }
    
    // Data loading errors
    if (error.code?.includes('DATA') || 
        error.message?.includes('data')) {
      return 'data';
    }
    
    return 'client';
  }

  /**
   * Get error key for message lookup
   */
  getErrorKey(error, errorType) {
    // Use error code if available
    if (error.code) {
      return error.code;
    }
    
    // Use HTTP status code
    if (error.response?.status) {
      const statusMessages = {
        400: 'VALIDATION_ERROR',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        408: 'TIMEOUT',
        429: 'RATE_LIMITED',
        500: 'INTERNAL_SERVER_ERROR',
        502: 'BAD_GATEWAY',
        503: 'SERVICE_UNAVAILABLE',
        504: 'TIMEOUT'
      };
      
      return statusMessages[error.response.status] || 'UNKNOWN_ERROR';
    }
    
    // Fallback based on error type
    const typeDefaults = {
      network: 'NETWORK_ERROR',
      server: 'INTERNAL_SERVER_ERROR',
      authentication: 'UNAUTHORIZED',
      trading: 'TRADING_ERROR',
      data: 'DATA_UNAVAILABLE',
      validation: 'VALIDATION_ERROR',
      client: 'CLIENT_ERROR'
    };
    
    return typeDefaults[errorType] || 'UNKNOWN_ERROR';
  }

  /**
   * Get error message configuration
   */
  getErrorMessage(errorKey, error) {
    // Get predefined message or create default
    const predefined = this.errorMessages[errorKey];
    
    if (predefined) {
      return predefined;
    }
    
    // Create default message based on error type
    const errorType = this.classifyError(error);
    const category = this.errorCategories[errorType];
    
    return {
      title: category?.name || 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      category: errorType,
      severity: 'error',
      userActions: ['retry_request', 'refresh_page', 'contact_support']
    };
  }

  /**
   * Contextualize error message based on current state
   */
  contextualizeMessage(message, context) {
    let contextualMessage = message;
    
    // Add context based on current page
    if (context.currentPage) {
      const pageContexts = {
        '/trading': 'This may affect your ability to place new trades.',
        '/portfolio': 'Your portfolio data may not be up to date.',
        '/market': 'Market data may be temporarily unavailable.',
        '/settings': 'Some settings may not be saved properly.'
      };
      
      const pageContext = pageContexts[context.currentPage];
      if (pageContext) {
        contextualMessage += ` ${pageContext}`;
      }
    }
    
    // Add context based on system state
    if (gracefulDegradationService.currentLevel !== 'full') {
      contextualMessage += ' The system is currently in reduced functionality mode.';
    }
    
    if (offlineService.isOffline) {
      contextualMessage += ' You are currently offline - some features may be limited.';
    }
    
    return contextualMessage;
  }

  /**
   * Generate recovery options based on error and context
   */
  generateRecoveryOptions(messageConfig, error, context) {
    const options = [];
    
    // Add predefined recovery actions
    for (const actionKey of messageConfig.userActions || []) {
      const action = this.recoveryActions[actionKey];
      if (action) {
        options.push({
          ...action,
          key: actionKey,
          available: this.isActionAvailable(actionKey, error, context),
          estimated: this.estimateActionTime(actionKey, error)
        });
      }
    }
    
    // Add context-specific recovery options
    const contextualOptions = this.getContextualRecoveryOptions(error, context);
    options.push(...contextualOptions);
    
    // Sort by priority and availability
    return options.sort((a, b) => {
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }
      
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get contextual recovery options based on current state
   */
  getContextualRecoveryOptions(error, context) {
    const options = [];
    
    // Offline mode options
    if (offlineService.isOffline) {
      options.push({
        key: 'view_offline_features',
        label: 'View Available Features',
        description: 'See what you can do offline',
        icon: 'list',
        instructions: ['Open offline status panel', 'Review available features', 'Access cached data'],
        automated: false,
        priority: 'medium',
        available: true
      });
    }
    
    // Degraded mode options
    if (gracefulDegradationService.currentLevel !== 'full') {
      options.push({
        key: 'view_system_status',
        label: 'Check System Status',
        description: 'View current system capabilities',
        icon: 'activity',
        instructions: ['Open system status', 'Review available features', 'Check connection quality'],
        automated: false,
        priority: 'medium',
        available: true
      });
    }
    
    // Trading specific options
    if (context.currentPage === '/trading' && error.code === 'INSUFFICIENT_BALANCE') {
      options.push({
        key: 'add_funds',
        label: 'Add Funds',
        description: 'Deposit money to your account',
        icon: 'plus-circle',
        instructions: ['Go to deposit page', 'Choose payment method', 'Follow deposit instructions'],
        automated: false,
        priority: 'high',
        available: true
      });
    }
    
    // Network specific options
    if (this.classifyError(error) === 'network') {
      options.push({
        key: 'switch_to_mobile_data',
        label: 'Try Mobile Data',
        description: 'Switch from WiFi to mobile data',
        icon: 'smartphone',
        instructions: ['Turn off WiFi', 'Enable mobile data', 'Refresh the page'],
        automated: false,
        priority: 'medium',
        available: navigator.connection?.type !== 'cellular'
      });
    }
    
    return options;
  }

  /**
   * Check if recovery action is available
   */
  isActionAvailable(actionKey, error, context) {
    switch (actionKey) {
      case 'retry_request':
        return this.canRetry(error, this.classifyError(error));
      
      case 'use_offline_mode':
        return !offlineService.isOffline;
      
      case 'login_again':
        return error.response?.status === 401;
      
      case 'check_balance':
        return context.currentPage === '/trading';
      
      case 'use_cached_data':
        return Object.keys(offlineService.getOfflineStatus().dataAge || {}).length > 0;
      
      default:
        return true;
    }
  }

  /**
   * Estimate time for recovery action
   */
  estimateActionTime(actionKey, error) {
    const estimates = {
      retry_request: '5-10 seconds',
      check_connection: '1-2 minutes',
      wait_and_retry: '30 seconds - 2 minutes',
      login_again: '30 seconds',
      refresh_page: '10-15 seconds',
      contact_support: '24 hours',
      use_offline_mode: 'Immediate',
      use_cached_data: 'Immediate'
    };
    
    return estimates[actionKey] || 'Unknown';
  }

  /**
   * Check if error should be suppressed due to recent duplicates
   */
  shouldSuppressError(errorKey) {
    const now = Date.now();
    const recentErrors = this.errorContext.recentErrors;
    
    // Check for recent duplicate
    const recentDuplicate = recentErrors.find(err => 
      err.key === errorKey && 
      (now - err.timestamp) < this.aggregationConfig.suppressDuplicateWindow
    );
    
    if (recentDuplicate) {
      // Update frequency counter
      const frequency = this.errorContext.errorFrequency.get(errorKey) || 0;
      this.errorContext.errorFrequency.set(errorKey, frequency + 1);
      
      // Suppress if not escalated
      return frequency < this.aggregationConfig.escalationThreshold;
    }
    
    return false;
  }

  /**
   * Track error for aggregation and analysis
   */
  trackError(errorKey, errorResponse) {
    // Add to recent errors
    this.errorContext.recentErrors.unshift({
      key: errorKey,
      timestamp: errorResponse.timestamp,
      severity: errorResponse.severity
    });
    
    // Limit recent errors list
    if (this.errorContext.recentErrors.length > this.aggregationConfig.maxRecentErrors) {
      this.errorContext.recentErrors = this.errorContext.recentErrors.slice(0, this.aggregationConfig.maxRecentErrors);
    }
    
    // Update frequency counter
    const frequency = this.errorContext.errorFrequency.get(errorKey) || 0;
    this.errorContext.errorFrequency.set(errorKey, frequency + 1);
  }

  /**
   * Execute recovery action
   */
  async executeRecoveryAction(actionKey, errorResponse, options = {}) {
    console.log(`Executing recovery action: ${actionKey}`);
    
    try {
      switch (actionKey) {
        case 'retry_request':
          return await this.executeRetry(errorResponse, options);
        
        case 'use_offline_mode':
          return await this.activateOfflineMode();
        
        case 'refresh_page':
          return this.refreshPage();
        
        case 'login_again':
          return this.redirectToLogin();
        
        case 'use_cached_data':
          return await this.switchToCachedData();
        
        case 'contact_support':
          return this.openSupportDialog(errorResponse);
        
        default:
          console.warn(`Unknown recovery action: ${actionKey}`);
          return { success: false, message: 'Unknown recovery action' };
      }
    } catch (error) {
      console.error(`Recovery action ${actionKey} failed:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Execute retry with enhanced options
   */
  async executeRetry(errorResponse, options = {}) {
    const { originalError, context } = errorResponse;
    
    // Use retry service for automatic retry
    if (context.retryFunction) {
      try {
        const result = await retryService.executeWithRetry(
          context.retryFunction,
          {
            endpoint: context.endpoint || 'unknown',
            priority: errorResponse.severity === 'critical' ? 'critical' : 'normal',
            userFeedback: true,
            operationType: context.operationType || 'data'
          }
        );
        
        return { success: true, result };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
    
    // Fallback to page refresh
    return this.refreshPage();
  }

  /**
   * Activate offline mode
   */
  async activateOfflineMode() {
    try {
      await offlineService.activateOfflineMode();
      
      this.emit('recoveryActionExecuted', {
        action: 'use_offline_mode',
        success: true,
        message: 'Offline mode activated successfully'
      });
      
      return { success: true, message: 'Switched to offline mode' };
    } catch (error) {
      return { success: false, message: 'Failed to activate offline mode' };
    }
  }

  /**
   * Refresh page
   */
  refreshPage() {
    window.location.reload();
    return { success: true, message: 'Page refreshed' };
  }

  /**
   * Redirect to login
   */
  redirectToLogin() {
    window.location.href = '/login';
    return { success: true, message: 'Redirecting to login' };
  }

  /**
   * Switch to cached data mode
   */
  async switchToCachedData() {
    try {
      // Emit event to switch UI to cached data mode
      this.emit('switchToCachedData');
      
      return { success: true, message: 'Switched to cached data' };
    } catch (error) {
      return { success: false, message: 'Failed to switch to cached data' };
    }
  }

  /**
   * Open support dialog with error details
   */
  openSupportDialog(errorResponse) {
    const supportData = {
      errorId: errorResponse.id,
      timestamp: errorResponse.timestamp,
      errorType: errorResponse.type,
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: errorResponse.context
    };
    
    this.emit('openSupportDialog', supportData);
    
    return { success: true, message: 'Support dialog opened' };
  }
  /**
   * Handle retry service events
   */
  handleRetryServiceEvent(event, data) {
    switch (event) {
      case 'RETRY_STARTED':
        this.emit('retryStarted', {
          message: 'Attempting to reconnect...',
          data
        });
        break;
      
      case 'RETRY_SUCCESS':
        this.emit('retrySuccess', {
          message: 'Connection restored successfully',
          data
        });
        break;
      
      case 'RETRY_FAILED':
        this.processError(new Error('Retry failed'), {
          retryData: data,
          operationType: 'retry'
        });
        break;
      
      case 'CIRCUIT_BREAKER_OPENED':
        this.emit('circuitBreakerOpened', {
          message: 'Service temporarily unavailable due to repeated failures',
          data
        });
        break;
    }
  }

  /**
   * Handle graceful degradation changes
   */
  handleDegradationChange(data) {
    const { current, previous } = data;
    
    if (current !== 'full' && previous === 'full') {
      this.emit('systemDegraded', {
        message: 'System performance reduced due to connection issues',
        level: current,
        data
      });
    } else if (current === 'full' && previous !== 'full') {
      this.emit('systemRestored', {
        message: 'System performance restored to full capacity',
        data
      });
    }
  }

  /**
   * Handle offline service events
   */
  handleOfflineServiceEvent(event, data) {
    switch (event) {
      case 'offline_mode_activated':
        this.emit('offlineModeActivated', {
          message: 'You are now offline. Using cached data where available.',
          data
        });
        break;
      
      case 'online_mode_restored':
        this.emit('onlineModeRestored', {
          message: 'Connection restored. All features are now available.',
          data
        });
        break;
      
      case 'sync_failed':
        this.processError(new Error('Data synchronization failed'), {
          syncData: data,
          operationType: 'sync'
        });
        break;
    }
  }

  /**
   * Handle fallback manager events
   */
  handleFallbackActivated(connectionType, strategy) {
    this.emit('fallbackActivated', {
      message: `Switched to ${strategy} for ${connectionType} connection`,
      connectionType,
      strategy
    });
  }

  /**
   * Update error context
   */
  updateContext(newContext) {
    this.errorContext = { ...this.errorContext, ...newContext };
  }

  /**
   * Clean up old errors from tracking
   */
  cleanupOldErrors() {
    const now = Date.now();
    const maxAge = this.aggregationConfig.cooldownPeriod;
    
    this.errorContext.recentErrors = this.errorContext.recentErrors.filter(
      error => (now - error.timestamp) < maxAge
    );
  }

  /**
   * Reset error frequency counters
   */
  resetErrorFrequency() {
    this.errorContext.errorFrequency.clear();
  }

  /**
   * Check if error can be retried
   */
  canRetry(error, errorType) {
    // Never retry certain client errors
    if (error.response?.status === 400 || error.response?.status === 404) {
      return false;
    }
    
    // Always allow retry for network and server errors
    if (errorType === 'network' || errorType === 'server') {
      return true;
    }
    
    // Allow retry for authentication errors
    if (errorType === 'authentication') {
      return true;
    }
    
    return false;
  }

  /**
   * Check if error is temporary
   */
  isTemporaryError(error, errorType) {
    const temporaryTypes = ['network', 'server'];
    const temporaryStatuses = [408, 429, 500, 502, 503, 504];
    
    return temporaryTypes.includes(errorType) || 
           temporaryStatuses.includes(error.response?.status);
  }

  /**
   * Get features affected by error
   */
  getAffectedFeatures(error, context) {
    const features = [];
    
    if (this.classifyError(error) === 'network') {
      features.push('Real-time data updates', 'Trading operations', 'Live charts');
    }
    
    if (error.response?.status === 401) {
      features.push('Account access', 'Trading', 'Portfolio management');
    }
    
    if (context.currentPage === '/trading') {
      features.push('Order placement', 'Balance updates', 'Market data');
    }
    
    return features;
  }

  /**
   * Estimate recovery time based on error type
   */
  estimateRecoveryTime(error, errorType) {
    const estimates = {
      network: '1-5 minutes',
      server: '5-15 minutes',
      authentication: '30 seconds',
      trading: '1-2 minutes',
      data: '30 seconds - 2 minutes',
      validation: 'Immediate',
      client: '30 seconds'
    };
    
    return estimates[errorType] || 'Unknown';
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    const now = Date.now();
    const last24Hours = now - 86400000;
    
    const recent24h = this.errorContext.recentErrors.filter(
      error => error.timestamp > last24Hours
    );
    
    const byCategory = {};
    const bySeverity = {};
    
    recent24h.forEach(error => {
      const category = this.errorCategories[this.classifyError({ code: error.key })]?.name || 'Unknown';
      byCategory[category] = (byCategory[category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });
    
    return {
      total24h: recent24h.length,
      byCategory,
      bySeverity,
      mostFrequent: Array.from(this.errorContext.errorFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      currentFrequency: this.errorContext.errorFrequency.size
    };
  }

  /**
   * Get user guidance based on current errors
   */
  getUserGuidance() {
    const guidance = {
      tips: [],
      warnings: [],
      recommendations: []
    };
    
    // Check for frequent network errors
    const networkErrors = this.errorContext.errorFrequency.get('NETWORK_ERROR') || 0;
    if (networkErrors > 3) {
      guidance.warnings.push('Frequent connection issues detected. Consider checking your internet connection.');
      guidance.recommendations.push('Switch to offline mode to continue working with cached data.');
    }
    
    // Check for authentication errors
    const authErrors = this.errorContext.errorFrequency.get('UNAUTHORIZED') || 0;
    if (authErrors > 1) {
      guidance.warnings.push('Multiple authentication failures detected.');
      guidance.recommendations.push('Clear your browser cache and cookies, then log in again.');
    }
    
    // Check system state
    if (gracefulDegradationService.currentLevel !== 'full') {
      guidance.tips.push('System is in reduced performance mode to maintain stability.');
    }
    
    if (offlineService.isOffline) {
      guidance.tips.push('You are currently offline. Many features are still available using cached data.');
    }
    
    return guidance;
  }

  /**
   * Export error data for analysis
   */
  exportErrorData() {
    return {
      timestamp: Date.now(),
      errorContext: this.errorContext,
      statistics: this.getErrorStatistics(),
      systemState: {
        degradationLevel: gracefulDegradationService.currentLevel,
        isOffline: offlineService.isOffline,
        retryMetrics: retryService.getMetrics()
      }
    };
  }
}

// Create singleton instance
const errorMessageService = new ErrorMessageService();

export default errorMessageService;