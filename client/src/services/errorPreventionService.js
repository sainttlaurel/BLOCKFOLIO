/**
 * Error Prevention Service
 * 
 * Proactively prevents errors through predictive analysis, user guidance,
 * and system monitoring to reduce error occurrence and improve user experience.
 */

import { EventEmitter } from 'events';
import errorMessageService from './errorMessageService';
import retryService from './retryService';
import gracefulDegradationService from './gracefulDegradation';
import offlineService from './offlineService';

class ErrorPreventionService extends EventEmitter {
  constructor() {
    super();
    
    // Prevention strategies configuration
    this.preventionStrategies = {
      proactive_warnings: {
        enabled: true,
        thresholds: {
          connection_quality: 0.7,
          error_frequency: 3,
          response_time: 5000,
          memory_usage: 0.8
        }
      },
      
      input_validation: {
        enabled: true,
        real_time: true,
        show_suggestions: true,
        prevent_submission: true
      },
      
      system_monitoring: {
        enabled: true,
        check_interval: 30000, // 30 seconds
        metrics: ['connection', 'performance', 'memory', 'errors']
      },
      
      user_guidance: {
        enabled: true,
        show_tips: true,
        contextual_help: true,
        progressive_disclosure: true
      },
      
      predictive_caching: {
        enabled: true,
        preload_critical_data: true,
        anticipate_user_actions: true,
        cache_fallbacks: true
      }
    };
    
    // Error patterns and predictions
    this.errorPatterns = {
      frequency: new Map(),
      sequences: [],
      triggers: new Map(),
      predictions: new Map()
    };
    
    // User behavior tracking
    this.userBehavior = {
      actions: [],
      patterns: new Map(),
      preferences: {},
      riskFactors: new Set()
    };
    
    // System health metrics
    this.systemHealth = {
      connection: { quality: 1.0, stability: 1.0 },
      performance: { responseTime: 0, memoryUsage: 0 },
      errors: { frequency: 0, severity: 'low' },
      lastCheck: Date.now()
    };
    
    // Prevention warnings and tips
    this.activeWarnings = new Map();
    this.preventionTips = new Map();
    
    this.initialize();
  }

  /**
   * Initialize error prevention service
   */
  initialize() {
    // Setup system monitoring
    this.setupSystemMonitoring();
    
    // Setup user behavior tracking
    this.setupUserBehaviorTracking();
    
    // Setup error pattern analysis
    this.setupErrorPatternAnalysis();
    
    // Setup proactive warnings
    this.setupProactiveWarnings();
    
    console.log('Error Prevention Service initialized');
  }

  /**
   * Setup system health monitoring
   */
  setupSystemMonitoring() {
    if (!this.preventionStrategies.system_monitoring.enabled) return;
    
    setInterval(() => {
      this.checkSystemHealth();
    }, this.preventionStrategies.system_monitoring.check_interval);
    
    // Listen to system events
    this.setupSystemEventListeners();
  }

  /**
   * Setup system event listeners
   */
  setupSystemEventListeners() {
    // Connection quality changes
    gracefulDegradationService.on('networkQualityChanged', (data) => {
      this.updateConnectionHealth(data);
    });
    
    // Error occurrences
    errorMessageService.on('errorProcessed', (errorResponse) => {
      this.analyzeErrorPattern(errorResponse);
    });
    
    // Retry failures
    retryService.addStatusListener((event, data) => {
      if (event === 'RETRY_FAILED') {
        this.handleRetryFailure(data);
      }
    });
    
    // Offline mode changes
    offlineService.addListener((event, data) => {
      if (event === 'offline_mode_activated') {
        this.handleOfflineMode(data);
      }
    });
  }

  /**
   * Check overall system health
   */
  async checkSystemHealth() {
    const health = {
      connection: await this.checkConnectionHealth(),
      performance: await this.checkPerformanceHealth(),
      memory: await this.checkMemoryHealth(),
      errors: await this.checkErrorHealth()
    };
    
    this.systemHealth = {
      ...health,
      lastCheck: Date.now()
    };
    
    // Analyze health and generate warnings
    this.analyzeSystemHealth(health);
    
    this.emit('systemHealthUpdated', this.systemHealth);
  }

  /**
   * Check connection health
   */
  async checkConnectionHealth() {
    try {
      const start = Date.now();
      const response = await fetch('/api/ping', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      const responseTime = Date.now() - start;
      const quality = response.ok ? Math.max(0, 1 - (responseTime / 5000)) : 0;
      
      return {
        quality,
        responseTime,
        stability: this.calculateConnectionStability(),
        isOnline: response.ok
      };
    } catch (error) {
      return {
        quality: 0,
        responseTime: 5000,
        stability: 0,
        isOnline: false
      };
    }
  }

  /**
   * Check performance health
   */
  async checkPerformanceHealth() {
    const start = performance.now();
    
    // Simulate performance test
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const responseTime = performance.now() - start;
    
    return {
      responseTime,
      score: Math.max(0, 1 - (responseTime / 100))
    };
  }

  /**
   * Check memory health
   */
  async checkMemoryHealth() {
    if (!performance.memory) {
      return { usage: 0, score: 1 };
    }
    
    const usage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    
    return {
      usage,
      score: Math.max(0, 1 - usage)
    };
  }

  /**
   * Check error health
   */
  async checkErrorHealth() {
    const stats = errorMessageService.getErrorStatistics();
    const frequency = stats.total24h / 24; // errors per hour
    
    return {
      frequency,
      score: Math.max(0, 1 - (frequency / 10)) // 10 errors per hour = 0 score
    };
  }

  /**
   * Calculate connection stability based on recent history
   */
  calculateConnectionStability() {
    // This would analyze connection history over time
    // For now, return a mock value
    return 0.9;
  }

  /**
   * Analyze system health and generate warnings
   */
  analyzeSystemHealth(health) {
    const thresholds = this.preventionStrategies.proactive_warnings.thresholds;
    
    // Check connection quality
    if (health.connection.quality < thresholds.connection_quality) {
      this.generateProactiveWarning('connection_degraded', {
        severity: 'warning',
        message: 'Connection quality is degrading. Consider switching to offline mode or checking your internet connection.',
        actions: ['check_connection', 'use_offline_mode'],
        quality: health.connection.quality
      });
    }
    
    // Check response time
    if (health.connection.responseTime > thresholds.response_time) {
      this.generateProactiveWarning('slow_response', {
        severity: 'info',
        message: 'Server response times are slower than usual. Some operations may take longer.',
        actions: ['wait_and_retry', 'use_cached_data'],
        responseTime: health.connection.responseTime
      });
    }
    
    // Check memory usage
    if (health.memory.usage > thresholds.memory_usage) {
      this.generateProactiveWarning('high_memory', {
        severity: 'warning',
        message: 'High memory usage detected. Consider refreshing the page to improve performance.',
        actions: ['refresh_page', 'close_unused_tabs'],
        memoryUsage: health.memory.usage
      });
    }
    
    // Check error frequency
    if (health.errors.frequency > thresholds.error_frequency) {
      this.generateProactiveWarning('high_error_rate', {
        severity: 'error',
        message: 'Frequent errors detected. The system may be experiencing issues.',
        actions: ['contact_support', 'use_offline_mode', 'refresh_page'],
        errorRate: health.errors.frequency
      });
    }
  }

  /**
   * Generate proactive warning
   */
  generateProactiveWarning(warningId, warningData) {
    // Check if warning already exists and is recent
    const existing = this.activeWarnings.get(warningId);
    if (existing && (Date.now() - existing.timestamp) < 300000) { // 5 minutes
      return;
    }
    
    const warning = {
      id: warningId,
      timestamp: Date.now(),
      ...warningData
    };
    
    this.activeWarnings.set(warningId, warning);
    
    this.emit('proactiveWarning', warning);
    
    // Auto-remove warning after timeout
    setTimeout(() => {
      this.activeWarnings.delete(warningId);
    }, 600000); // 10 minutes
  }

  /**
   * Setup user behavior tracking
   */
  setupUserBehaviorTracking() {
    // Track user actions
    document.addEventListener('click', (event) => {
      this.trackUserAction('click', {
        target: event.target.tagName,
        className: event.target.className,
        timestamp: Date.now()
      });
    });
    
    // Track form submissions
    document.addEventListener('submit', (event) => {
      this.trackUserAction('submit', {
        form: event.target.id || event.target.className,
        timestamp: Date.now()
      });
    });
    
    // Track navigation
    window.addEventListener('popstate', () => {
      this.trackUserAction('navigate', {
        path: window.location.pathname,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Track user action for pattern analysis
   */
  trackUserAction(type, data) {
    const action = { type, ...data };
    
    this.userBehavior.actions.push(action);
    
    // Limit action history
    if (this.userBehavior.actions.length > 100) {
      this.userBehavior.actions = this.userBehavior.actions.slice(-50);
    }
    
    // Analyze for risk patterns
    this.analyzeUserRiskPatterns(action);
  }

  /**
   * Analyze user behavior for risk patterns
   */
  analyzeUserRiskPatterns(action) {
    // Detect rapid clicking (potential frustration)
    if (action.type === 'click') {
      const recentClicks = this.userBehavior.actions
        .filter(a => a.type === 'click' && (Date.now() - a.timestamp) < 5000)
        .length;
      
      if (recentClicks > 5) {
        this.userBehavior.riskFactors.add('rapid_clicking');
        this.generatePreventionTip('slow_down', {
          message: 'Take a moment - rapid clicking may cause issues. Try waiting for operations to complete.',
          priority: 'medium'
        });
      }
    }
    
    // Detect repeated form submissions
    if (action.type === 'submit') {
      const recentSubmissions = this.userBehavior.actions
        .filter(a => a.type === 'submit' && (Date.now() - a.timestamp) < 10000)
        .length;
      
      if (recentSubmissions > 2) {
        this.userBehavior.riskFactors.add('repeated_submissions');
        this.generatePreventionTip('avoid_double_submit', {
          message: 'Avoid submitting forms multiple times. Wait for confirmation before trying again.',
          priority: 'high'
        });
      }
    }
  }

  /**
   * Generate prevention tip
   */
  generatePreventionTip(tipId, tipData) {
    const existing = this.preventionTips.get(tipId);
    if (existing && (Date.now() - existing.timestamp) < 600000) { // 10 minutes
      return;
    }
    
    const tip = {
      id: tipId,
      timestamp: Date.now(),
      ...tipData
    };
    
    this.preventionTips.set(tipId, tip);
    
    this.emit('preventionTip', tip);
    
    // Auto-remove tip after timeout
    setTimeout(() => {
      this.preventionTips.delete(tipId);
    }, 1800000); // 30 minutes
  }

  /**
   * Setup error pattern analysis
   */
  setupErrorPatternAnalysis() {
    errorMessageService.on('errorProcessed', (errorResponse) => {
      this.analyzeErrorPattern(errorResponse);
    });
  }

  /**
   * Analyze error patterns for prediction
   */
  analyzeErrorPattern(errorResponse) {
    const errorKey = `${errorResponse.type}_${errorResponse.category}`;
    
    // Update frequency tracking
    const frequency = this.errorPatterns.frequency.get(errorKey) || 0;
    this.errorPatterns.frequency.set(errorKey, frequency + 1);
    
    // Track error sequences
    this.errorPatterns.sequences.push({
      key: errorKey,
      timestamp: errorResponse.timestamp,
      context: errorResponse.context
    });
    
    // Limit sequence history
    if (this.errorPatterns.sequences.length > 50) {
      this.errorPatterns.sequences = this.errorPatterns.sequences.slice(-25);
    }
    
    // Analyze for predictable patterns
    this.predictFutureErrors(errorKey, errorResponse);
  }

  /**
   * Predict future errors based on patterns
   */
  predictFutureErrors(errorKey, errorResponse) {
    // Look for recurring patterns
    const recentSimilar = this.errorPatterns.sequences
      .filter(seq => seq.key === errorKey && (Date.now() - seq.timestamp) < 3600000) // 1 hour
      .length;
    
    if (recentSimilar >= 3) {
      // High likelihood of recurring error
      this.errorPatterns.predictions.set(errorKey, {
        likelihood: 'high',
        nextOccurrence: Date.now() + 600000, // 10 minutes
        preventionActions: this.getPreventionActions(errorKey)
      });
      
      this.generatePreventionWarning(errorKey, recentSimilar);
    }
  }

  /**
   * Get prevention actions for error type
   */
  getPreventionActions(errorKey) {
    const actions = {
      'network_network': ['check_connection', 'use_offline_mode'],
      'server_server': ['wait_and_retry', 'check_status_page'],
      'authentication_authentication': ['refresh_session', 'clear_cache'],
      'trading_trading': ['check_balance', 'verify_market_hours'],
      'data_data': ['use_cached_data', 'refresh_data']
    };
    
    return actions[errorKey] || ['retry_request', 'contact_support'];
  }

  /**
   * Generate prevention warning for predicted errors
   */
  generatePreventionWarning(errorKey, frequency) {
    this.generateProactiveWarning(`predicted_${errorKey}`, {
      severity: 'info',
      message: `We've detected a pattern that may lead to ${errorKey.replace('_', ' ')} errors. Consider taking preventive action.`,
      actions: this.getPreventionActions(errorKey),
      frequency,
      type: 'prediction'
    });
  }

  /**
   * Setup proactive warnings system
   */
  setupProactiveWarnings() {
    if (!this.preventionStrategies.proactive_warnings.enabled) return;
    
    // Monitor for warning conditions
    setInterval(() => {
      this.checkWarningConditions();
    }, 60000); // Check every minute
  }

  /**
   * Check for warning conditions
   */
  checkWarningConditions() {
    // Check for potential issues before they become errors
    this.checkPotentialNetworkIssues();
    this.checkPotentialPerformanceIssues();
    this.checkPotentialUserIssues();
  }

  /**
   * Check for potential network issues
   */
  checkPotentialNetworkIssues() {
    const connectionHealth = this.systemHealth.connection;
    
    if (connectionHealth.quality < 0.8 && connectionHealth.quality > 0.5) {
      this.generateProactiveWarning('network_degrading', {
        severity: 'info',
        message: 'Network quality is declining. Consider saving your work and preparing for potential connectivity issues.',
        actions: ['save_work', 'enable_offline_mode'],
        quality: connectionHealth.quality
      });
    }
  }

  /**
   * Check for potential performance issues
   */
  checkPotentialPerformanceIssues() {
    const performanceHealth = this.systemHealth.performance;
    
    if (performanceHealth.responseTime > 2000) {
      this.generateProactiveWarning('performance_degrading', {
        severity: 'info',
        message: 'System performance is slower than usual. Consider reducing activity or refreshing the page.',
        actions: ['reduce_activity', 'refresh_page'],
        responseTime: performanceHealth.responseTime
      });
    }
  }

  /**
   * Check for potential user issues
   */
  checkPotentialUserIssues() {
    // Check for risk factors in user behavior
    if (this.userBehavior.riskFactors.has('rapid_clicking')) {
      this.generatePreventionTip('patience_tip', {
        message: 'Taking your time with interactions can help prevent errors and improve your experience.',
        priority: 'low'
      });
    }
  }

  /**
   * Validate user input proactively
   */
  validateInput(input, context = {}) {
    if (!this.preventionStrategies.input_validation.enabled) {
      return { isValid: true };
    }
    
    const validation = {
      isValid: true,
      warnings: [],
      suggestions: [],
      errors: []
    };
    
    // Validate based on context
    switch (context.type) {
      case 'trading':
        return this.validateTradingInput(input, validation);
      case 'authentication':
        return this.validateAuthInput(input, validation);
      case 'search':
        return this.validateSearchInput(input, validation);
      default:
        return this.validateGenericInput(input, validation);
    }
  }

  /**
   * Validate trading input
   */
  validateTradingInput(input, validation) {
    if (input.amount) {
      const amount = parseFloat(input.amount);
      
      if (isNaN(amount) || amount <= 0) {
        validation.errors.push('Amount must be a positive number');
        validation.isValid = false;
      }
      
      if (amount < 0.01) {
        validation.warnings.push('Very small amounts may not be processed');
      }
      
      if (amount > 10000) {
        validation.warnings.push('Large amounts may require additional verification');
      }
    }
    
    return validation;
  }

  /**
   * Validate authentication input
   */
  validateAuthInput(input, validation) {
    if (input.password) {
      if (input.password.length < 8) {
        validation.suggestions.push('Consider using a longer password for better security');
      }
    }
    
    if (input.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        validation.errors.push('Please enter a valid email address');
        validation.isValid = false;
      }
    }
    
    return validation;
  }

  /**
   * Validate search input
   */
  validateSearchInput(input, validation) {
    if (input.query) {
      if (input.query.length < 2) {
        validation.suggestions.push('Try entering at least 2 characters for better results');
      }
      
      if (input.query.length > 100) {
        validation.warnings.push('Very long search queries may not return optimal results');
      }
    }
    
    return validation;
  }

  /**
   * Validate generic input
   */
  validateGenericInput(input, validation) {
    // Basic validation for any input
    Object.entries(input).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length > 1000) {
        validation.warnings.push(`${key} is very long and may cause issues`);
      }
    });
    
    return validation;
  }

  /**
   * Get prevention recommendations
   */
  getPreventionRecommendations() {
    const recommendations = [];
    
    // Based on system health
    if (this.systemHealth.connection.quality < 0.8) {
      recommendations.push({
        type: 'connection',
        priority: 'high',
        title: 'Improve Connection Reliability',
        description: 'Enable offline mode or check your internet connection',
        actions: ['enable_offline_mode', 'check_connection']
      });
    }
    
    // Based on error patterns
    const frequentErrors = Array.from(this.errorPatterns.frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    frequentErrors.forEach(([errorKey, frequency]) => {
      if (frequency > 2) {
        recommendations.push({
          type: 'error_pattern',
          priority: 'medium',
          title: `Prevent ${errorKey.replace('_', ' ')} Errors`,
          description: `This error has occurred ${frequency} times recently`,
          actions: this.getPreventionActions(errorKey)
        });
      }
    });
    
    // Based on user behavior
    if (this.userBehavior.riskFactors.size > 0) {
      recommendations.push({
        type: 'user_behavior',
        priority: 'low',
        title: 'Improve Usage Patterns',
        description: 'Adjust your interaction patterns to prevent issues',
        actions: ['slow_down_interactions', 'wait_for_responses']
      });
    }
    
    return recommendations;
  }

  /**
   * Get active warnings and tips
   */
  getActiveWarningsAndTips() {
    return {
      warnings: Array.from(this.activeWarnings.values()),
      tips: Array.from(this.preventionTips.values()),
      recommendations: this.getPreventionRecommendations()
    };
  }

  /**
   * Clear warning or tip
   */
  clearWarningOrTip(id, type = 'warning') {
    if (type === 'warning') {
      this.activeWarnings.delete(id);
    } else {
      this.preventionTips.delete(id);
    }
    
    this.emit('warningCleared', { id, type });
  }

  /**
   * Get prevention statistics
   */
  getPreventionStatistics() {
    return {
      systemHealth: this.systemHealth,
      errorPatterns: {
        totalTracked: this.errorPatterns.frequency.size,
        mostFrequent: Array.from(this.errorPatterns.frequency.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
        predictions: this.errorPatterns.predictions.size
      },
      userBehavior: {
        actionsTracked: this.userBehavior.actions.length,
        riskFactors: Array.from(this.userBehavior.riskFactors),
        patterns: this.userBehavior.patterns.size
      },
      activeWarnings: this.activeWarnings.size,
      activeTips: this.preventionTips.size
    };
  }
}

// Create singleton instance
const errorPreventionService = new ErrorPreventionService();

export default errorPreventionService;