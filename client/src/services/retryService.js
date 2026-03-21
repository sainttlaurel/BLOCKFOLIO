/**
 * Retry Service for Professional Trading Platform
 * 
 * Implements robust retry mechanisms with exponential backoff, circuit breaker pattern,
 * and intelligent retry strategies based on error types. Provides comprehensive
 * retry configuration and user feedback for failed data requests.
 * 
 * Features:
 * - Exponential backoff with jitter
 * - Circuit breaker pattern for persistent failures
 * - Error type-based retry strategies
 * - Retry status indicators and metrics
 * - Integration with caching and data management
 */

class RetryService {
  constructor() {
    this.retryConfig = {
      // Base retry configuration
      maxRetries: 5,
      baseDelay: 1000,        // 1 second base delay
      maxDelay: 30000,        // 30 seconds maximum delay
      backoffMultiplier: 2,   // Exponential backoff multiplier
      jitterFactor: 0.1,      // Random jitter to prevent thundering herd
      
      // Error type specific configurations
      errorStrategies: {
        network: {
          maxRetries: 5,
          baseDelay: 1000,
          retryableStatuses: ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_REFUSED']
        },
        server: {
          maxRetries: 3,
          baseDelay: 2000,
          retryableStatuses: [500, 502, 503, 504, 'INTERNAL_SERVER_ERROR']
        },
        client: {
          maxRetries: 1,
          baseDelay: 500,
          retryableStatuses: [408, 429] // Request timeout, rate limiting
        },
        authentication: {
          maxRetries: 2,
          baseDelay: 1000,
          retryableStatuses: [401, 403]
        },
        // New: Critical vs non-critical operation policies
        critical: {
          maxRetries: 7,
          baseDelay: 500,
          maxDelay: 60000,
          backoffMultiplier: 1.5,
          retryableStatuses: [408, 429, 500, 502, 503, 504, 'NETWORK_ERROR', 'TIMEOUT']
        },
        nonCritical: {
          maxRetries: 2,
          baseDelay: 2000,
          maxDelay: 15000,
          backoffMultiplier: 2.5,
          retryableStatuses: [500, 502, 503, 504, 'NETWORK_ERROR']
        }
      }
    };
    
    // Circuit breaker configuration
    this.circuitBreakerConfig = {
      failureThreshold: 5,      // Number of failures before opening circuit
      recoveryTimeout: 30000,   // Time to wait before attempting recovery
      successThreshold: 3,      // Successful requests needed to close circuit
      monitoringWindow: 60000,  // Time window for failure counting
      // Enhanced circuit breaker settings
      halfOpenMaxRequests: 3,   // Max requests allowed in half-open state
      degradationThreshold: 10, // Failures before entering degraded mode
      degradationTimeout: 120000 // Time in degraded mode before recovery attempt
    };
    
    // Circuit breaker state per endpoint
    this.circuitBreakers = new Map();
    
    // Retry metrics and status tracking
    this.retryMetrics = {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      circuitBreakerTrips: 0,
      averageRetryDelay: 0,
      retrysByErrorType: {
        network: 0,
        server: 0,
        client: 0,
        authentication: 0,
        critical: 0,
        nonCritical: 0
      },
      // Enhanced metrics
      retrysByEndpoint: new Map(),
      failurePatterns: new Map(),
      recoveryTimes: [],
      performanceImpact: {
        totalDelayTime: 0,
        averageDelayPerRetry: 0,
        maxDelayEncountered: 0
      }
    };
    
    // Active retry operations tracking
    this.activeRetries = new Map();
    
    // Event listeners for retry status updates
    this.statusListeners = new Set();
    
    // Initialize retry status monitoring
    this.initializeStatusMonitoring();
  }

  /**
   * Initialize retry status monitoring and cleanup
   */
  initializeStatusMonitoring() {
    // Clean up completed retry operations every 30 seconds
    setInterval(() => {
      this.cleanupCompletedRetries();
    }, 30000);
    
    // Reset circuit breakers that have been in recovery for too long
    setInterval(() => {
      this.checkCircuitBreakerRecovery();
    }, 10000);
  }

  /**
   * Execute request with comprehensive retry logic
   */
  async executeWithRetry(requestFn, options = {}) {
    const {
      endpoint = 'unknown',
      retryId = this.generateRetryId(),
      customConfig = {},
      onRetryAttempt = null,
      onRetrySuccess = null,
      onRetryFailure = null,
      priority = 'normal', // 'critical', 'normal', 'low'
      userFeedback = true,  // Whether to show user feedback
      operationType = 'data' // 'data', 'trading', 'authentication'
    } = options;
    
    // Determine retry strategy based on priority and operation type
    const retryStrategy = this.determineRetryStrategy(priority, operationType);
    
    // Merge custom configuration with strategy and defaults
    const config = { 
      ...this.retryConfig, 
      ...this.retryConfig.errorStrategies[retryStrategy],
      ...customConfig 
    };
    
    // Check circuit breaker status
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    if (circuitBreaker.state === 'OPEN') {
      const error = new Error(`Circuit breaker is OPEN for endpoint: ${endpoint}`);
      error.type = 'CIRCUIT_BREAKER_OPEN';
      error.nextAttemptTime = circuitBreaker.nextAttemptTime;
      
      if (userFeedback) {
        this.notifyUserFeedback('circuit_breaker_blocked', {
          endpoint,
          nextAttemptTime: circuitBreaker.nextAttemptTime,
          message: 'Service temporarily unavailable due to repeated failures'
        });
      }
      
      throw error;
    }
    
    // Initialize retry tracking
    const retryOperation = {
      id: retryId,
      endpoint,
      startTime: Date.now(),
      attempts: 0,
      maxAttempts: config.maxRetries + 1,
      status: 'IN_PROGRESS',
      errors: [],
      delays: [],
      strategy: retryStrategy,
      priority,
      operationType,
      userFeedback
    };
    
    this.activeRetries.set(retryId, retryOperation);
    this.notifyStatusChange('RETRY_STARTED', retryOperation);
    
    if (userFeedback && priority === 'critical') {
      this.notifyUserFeedback('retry_started', {
        endpoint,
        priority,
        message: 'Attempting to connect...'
      });
    }
    
    let lastError;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      retryOperation.attempts = attempt + 1;
      
      try {
        // Execute the request
        const result = await requestFn();
        
        // Success - update metrics and circuit breaker
        this.recordSuccess(endpoint, retryOperation);
        retryOperation.status = 'SUCCESS';
        retryOperation.endTime = Date.now();
        
        if (onRetrySuccess) {
          onRetrySuccess(retryOperation);
        }
        
        if (userFeedback && attempt > 0) {
          this.notifyUserFeedback('retry_success', {
            endpoint,
            attempts: attempt + 1,
            message: 'Connection restored successfully'
          });
        }
        
        this.notifyStatusChange('RETRY_SUCCESS', retryOperation);
        return result;
        
      } catch (error) {
        lastError = error;
        retryOperation.errors.push({
          attempt: attempt + 1,
          error: error.message,
          type: this.classifyError(error),
          timestamp: Date.now()
        });
        
        // Determine if we should retry this error
        const errorType = this.classifyError(error);
        const shouldRetry = this.shouldRetryError(error, errorType, attempt, config);
        
        if (!shouldRetry || attempt === config.maxRetries) {
          // Final failure - update circuit breaker and metrics
          this.recordFailure(endpoint, error);
          retryOperation.status = 'FAILED';
          retryOperation.endTime = Date.now();
          
          if (onRetryFailure) {
            onRetryFailure(retryOperation, error);
          }
          
          if (userFeedback) {
            this.notifyUserFeedback('retry_failed', {
              endpoint,
              attempts: attempt + 1,
              error: error.message,
              message: this.getUserFriendlyErrorMessage(error, errorType)
            });
          }
          
          this.notifyStatusChange('RETRY_FAILED', retryOperation);
          throw error;
        }
        
        // Calculate delay for next attempt
        const delay = this.calculateRetryDelay(attempt, errorType, config);
        retryOperation.delays.push(delay);
        
        if (onRetryAttempt) {
          onRetryAttempt(retryOperation, error, delay);
        }
        
        if (userFeedback) {
          this.notifyUserFeedback('retry_attempt', {
            endpoint,
            attempt: attempt + 1,
            maxAttempts: config.maxRetries + 1,
            nextAttemptIn: delay,
            error: error.message,
            message: `Retrying in ${Math.round(delay / 1000)} seconds...`
          });
        }
        
        this.notifyStatusChange('RETRY_ATTEMPT', {
          ...retryOperation,
          nextAttemptIn: delay,
          error: error.message,
          errorType
        });
        
        // Wait before next attempt
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Determine retry strategy based on priority and operation type
   */
  determineRetryStrategy(priority, operationType) {
    // Critical operations get aggressive retry strategy
    if (priority === 'critical' || operationType === 'trading') {
      return 'critical';
    }
    
    // Authentication operations use specific strategy
    if (operationType === 'authentication') {
      return 'authentication';
    }
    
    // Low priority operations get conservative strategy
    if (priority === 'low') {
      return 'nonCritical';
    }
    
    // Default strategy based on operation type
    switch (operationType) {
      case 'data':
        return 'network';
      case 'api':
        return 'server';
      default:
        return 'network';
    }
  }

  /**
   * Generate user-friendly error messages
   */
  getUserFriendlyErrorMessage(error, errorType) {
    switch (errorType) {
      case 'network':
        return 'Connection issue detected. Please check your internet connection.';
      case 'server':
        return 'Server temporarily unavailable. Our team has been notified.';
      case 'authentication':
        return 'Authentication failed. Please try logging in again.';
      case 'client':
        if (error.response?.status === 429) {
          return 'Too many requests. Please wait a moment before trying again.';
        }
        return 'Request could not be processed. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Notify user feedback for retry operations
   */
  notifyUserFeedback(type, data) {
    const event = new CustomEvent('retryUserFeedback', {
      detail: { type, data, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Classify error type for appropriate retry strategy
   */
  classifyError(error) {
    // Network errors
    if (error.code === 'NETWORK_ERROR' || 
        error.code === 'ECONNREFUSED' || 
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.message.includes('Network Error') ||
        error.message.includes('fetch')) {
      return 'network';
    }
    
    // HTTP status code based classification
    if (error.response && error.response.status) {
      const status = error.response.status;
      
      // Server errors (5xx)
      if (status >= 500 && status < 600) {
        return 'server';
      }
      
      // Authentication errors
      if (status === 401 || status === 403) {
        return 'authentication';
      }
      
      // Client errors that might be retryable
      if (status === 408 || status === 429) {
        return 'client';
      }
      
      // Other client errors (4xx) - generally not retryable
      if (status >= 400 && status < 500) {
        return 'client_non_retryable';
      }
    }
    
    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'network';
    }
    
    // Default to server error for unknown errors
    return 'server';
  }

  /**
   * Determine if an error should be retried
   */
  shouldRetryError(error, errorType, attempt, config) {
    // Check if error type is retryable
    const strategy = config.errorStrategies[errorType];
    if (!strategy) {
      return false;
    }
    
    // Check attempt limit for this error type
    if (attempt >= strategy.maxRetries) {
      return false;
    }
    
    // Check specific error conditions
    if (error.response && error.response.status) {
      const status = error.response.status;
      
      // Never retry certain client errors
      if (status === 400 || status === 404 || status === 422) {
        return false;
      }
      
      // Check if status is in retryable list
      if (strategy.retryableStatuses && 
          !strategy.retryableStatuses.includes(status)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  calculateRetryDelay(attempt, errorType, config) {
    const strategy = config.errorStrategies[errorType] || config;
    
    // Base exponential backoff
    let delay = strategy.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd problem
    const jitter = delay * config.jitterFactor * (Math.random() - 0.5);
    delay += jitter;
    
    // Ensure minimum delay
    delay = Math.max(delay, strategy.baseDelay);
    
    return Math.round(delay);
  }

  /**
   * Get or create circuit breaker for endpoint
   */
  getCircuitBreaker(endpoint) {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        lastFailureTime: null,
        nextAttemptTime: null,
        failureWindow: []
      });
    }
    
    return this.circuitBreakers.get(endpoint);
  }

  /**
   * Record successful request for circuit breaker
   */
  recordSuccess(endpoint, retryOperation) {
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    
    circuitBreaker.successes++;
    
    // If circuit was half-open and we got enough successes, close it
    if (circuitBreaker.state === 'HALF_OPEN' && 
        circuitBreaker.successes >= this.circuitBreakerConfig.successThreshold) {
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failures = 0;
      circuitBreaker.successes = 0;
      circuitBreaker.failureWindow = [];
      
      this.notifyStatusChange('CIRCUIT_BREAKER_CLOSED', { endpoint });
    }
    
    // Update retry metrics
    if (retryOperation.attempts > 1) {
      this.retryMetrics.successfulRetries++;
      this.retryMetrics.totalRetries++;
      
      // Track recovery time
      const recoveryTime = Date.now() - retryOperation.startTime;
      this.retryMetrics.recoveryTimes.push(recoveryTime);
      
      // Update endpoint-specific metrics
      if (!this.retryMetrics.retrysByEndpoint.has(endpoint)) {
        this.retryMetrics.retrysByEndpoint.set(endpoint, {
          total: 0,
          successful: 0,
          failed: 0,
          averageAttempts: 0
        });
      }
      
      const endpointMetrics = this.retryMetrics.retrysByEndpoint.get(endpoint);
      endpointMetrics.total++;
      endpointMetrics.successful++;
      endpointMetrics.averageAttempts = 
        (endpointMetrics.averageAttempts * (endpointMetrics.total - 1) + retryOperation.attempts) / endpointMetrics.total;
      
      // Update performance impact metrics
      const totalDelay = retryOperation.delays.reduce((sum, delay) => sum + delay, 0);
      this.retryMetrics.performanceImpact.totalDelayTime += totalDelay;
      this.retryMetrics.performanceImpact.maxDelayEncountered = 
        Math.max(this.retryMetrics.performanceImpact.maxDelayEncountered, Math.max(...retryOperation.delays));
      
      // Update strategy-specific metrics
      if (retryOperation.strategy && this.retryMetrics.retrysByErrorType[retryOperation.strategy] !== undefined) {
        this.retryMetrics.retrysByErrorType[retryOperation.strategy]++;
      }
    }
  }

  /**
   * Record failed request for circuit breaker
   */
  recordFailure(endpoint, error) {
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    const now = Date.now();
    
    circuitBreaker.failures++;
    circuitBreaker.lastFailureTime = now;
    circuitBreaker.successes = 0;
    
    // Add to failure window for monitoring
    circuitBreaker.failureWindow.push(now);
    
    // Clean old failures outside monitoring window
    const windowStart = now - this.circuitBreakerConfig.monitoringWindow;
    circuitBreaker.failureWindow = circuitBreaker.failureWindow.filter(
      time => time > windowStart
    );
    
    // Track failure patterns
    const errorType = this.classifyError(error);
    if (!this.retryMetrics.failurePatterns.has(endpoint)) {
      this.retryMetrics.failurePatterns.set(endpoint, {});
    }
    const endpointPatterns = this.retryMetrics.failurePatterns.get(endpoint);
    endpointPatterns[errorType] = (endpointPatterns[errorType] || 0) + 1;
    
    // Update endpoint-specific metrics
    if (!this.retryMetrics.retrysByEndpoint.has(endpoint)) {
      this.retryMetrics.retrysByEndpoint.set(endpoint, {
        total: 0,
        successful: 0,
        failed: 0,
        averageAttempts: 0
      });
    }
    
    const endpointMetrics = this.retryMetrics.retrysByEndpoint.get(endpoint);
    endpointMetrics.total++;
    endpointMetrics.failed++;
    
    // Check if we should open the circuit breaker
    if (circuitBreaker.state === 'CLOSED' && 
        circuitBreaker.failureWindow.length >= this.circuitBreakerConfig.failureThreshold) {
      circuitBreaker.state = 'OPEN';
      circuitBreaker.nextAttemptTime = now + this.circuitBreakerConfig.recoveryTimeout;
      
      this.retryMetrics.circuitBreakerTrips++;
      this.notifyStatusChange('CIRCUIT_BREAKER_OPENED', { endpoint, error: error.message });
    }
    
    // Update retry metrics
    this.retryMetrics.failedRetries++;
    this.retryMetrics.totalRetries++;
    
    const errorTypeClassified = this.classifyError(error);
    if (this.retryMetrics.retrysByErrorType[errorTypeClassified] !== undefined) {
      this.retryMetrics.retrysByErrorType[errorTypeClassified]++;
    }
  }

  /**
   * Check circuit breaker recovery and transition to half-open
   */
  checkCircuitBreakerRecovery() {
    const now = Date.now();
    
    for (const [endpoint, circuitBreaker] of this.circuitBreakers.entries()) {
      if (circuitBreaker.state === 'OPEN' && 
          circuitBreaker.nextAttemptTime && 
          now >= circuitBreaker.nextAttemptTime) {
        
        circuitBreaker.state = 'HALF_OPEN';
        circuitBreaker.successes = 0;
        circuitBreaker.nextAttemptTime = null;
        
        this.notifyStatusChange('CIRCUIT_BREAKER_HALF_OPEN', { endpoint });
      }
    }
  }

  /**
   * Generate unique retry operation ID
   */
  generateRetryId() {
    return `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up completed retry operations
   */
  cleanupCompletedRetries() {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    
    for (const [id, operation] of this.activeRetries.entries()) {
      if (operation.endTime && (now - operation.endTime) > maxAge) {
        this.activeRetries.delete(id);
      }
    }
  }

  /**
   * Add status change listener
   */
  addStatusListener(listener) {
    this.statusListeners.add(listener);
  }

  /**
   * Remove status change listener
   */
  removeStatusListener(listener) {
    this.statusListeners.delete(listener);
  }

  /**
   * Notify all listeners of status changes
   */
  notifyStatusChange(event, data) {
    this.statusListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.warn('Error in retry status listener:', error);
      }
    });
  }

  /**
   * Get current retry metrics
   */
  getMetrics() {
    const totalOperations = this.retryMetrics.totalRetries;
    const successRate = totalOperations > 0 
      ? (this.retryMetrics.successfulRetries / totalOperations * 100).toFixed(2)
      : 0;
    
    // Calculate average recovery time
    const avgRecoveryTime = this.retryMetrics.recoveryTimes.length > 0
      ? this.retryMetrics.recoveryTimes.reduce((sum, time) => sum + time, 0) / this.retryMetrics.recoveryTimes.length
      : 0;
    
    // Calculate average delay per retry
    const avgDelayPerRetry = totalOperations > 0
      ? this.retryMetrics.performanceImpact.totalDelayTime / totalOperations
      : 0;
    
    return {
      ...this.retryMetrics,
      successRate: `${successRate}%`,
      activeRetries: this.activeRetries.size,
      averageRecoveryTime: Math.round(avgRecoveryTime),
      averageDelayPerRetry: Math.round(avgDelayPerRetry),
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([endpoint, cb]) => ({
        endpoint,
        state: cb.state,
        failures: cb.failures,
        successes: cb.successes,
        nextAttemptTime: cb.nextAttemptTime,
        isHealthy: cb.state === 'CLOSED'
      })),
      endpointMetrics: Array.from(this.retryMetrics.retrysByEndpoint.entries()).map(([endpoint, metrics]) => ({
        endpoint,
        ...metrics,
        successRate: metrics.total > 0 ? ((metrics.successful / metrics.total) * 100).toFixed(2) + '%' : '0%'
      })),
      failurePatterns: Array.from(this.retryMetrics.failurePatterns.entries()).map(([endpoint, patterns]) => ({
        endpoint,
        patterns
      }))
    };
  }

  /**
   * Get detailed analytics for retry patterns
   */
  getRetryAnalytics() {
    const metrics = this.getMetrics();
    const now = Date.now();
    
    return {
      overview: {
        totalRetries: metrics.totalRetries,
        successRate: metrics.successRate,
        averageRecoveryTime: metrics.averageRecoveryTime,
        circuitBreakerTrips: metrics.circuitBreakerTrips
      },
      performance: {
        totalDelayTime: metrics.performanceImpact.totalDelayTime,
        averageDelayPerRetry: metrics.averageDelayPerRetry,
        maxDelayEncountered: metrics.performanceImpact.maxDelayEncountered,
        impactOnUserExperience: this.calculateUserExperienceImpact()
      },
      reliability: {
        endpointReliability: metrics.endpointMetrics,
        failurePatterns: metrics.failurePatterns,
        circuitBreakerHealth: metrics.circuitBreakers
      },
      recommendations: this.generateOptimizationRecommendations(metrics)
    };
  }

  /**
   * Calculate user experience impact score
   */
  calculateUserExperienceImpact() {
    const totalDelay = this.retryMetrics.performanceImpact.totalDelayTime;
    const totalRetries = this.retryMetrics.totalRetries;
    
    if (totalRetries === 0) return 'minimal';
    
    const avgDelayPerRetry = totalDelay / totalRetries;
    
    if (avgDelayPerRetry < 2000) return 'minimal';
    if (avgDelayPerRetry < 5000) return 'low';
    if (avgDelayPerRetry < 10000) return 'moderate';
    return 'high';
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(metrics) {
    const recommendations = [];
    
    // Check for high failure rates
    metrics.endpointMetrics.forEach(endpoint => {
      const successRate = parseFloat(endpoint.successRate);
      if (successRate < 80) {
        recommendations.push({
          type: 'endpoint_reliability',
          endpoint: endpoint.endpoint,
          message: `Endpoint ${endpoint.endpoint} has low success rate (${endpoint.successRate}). Consider investigating server issues.`,
          priority: 'high'
        });
      }
    });
    
    // Check for frequent circuit breaker trips
    if (metrics.circuitBreakerTrips > 5) {
      recommendations.push({
        type: 'circuit_breaker_tuning',
        message: 'Frequent circuit breaker trips detected. Consider adjusting failure thresholds or improving backend reliability.',
        priority: 'medium'
      });
    }
    
    // Check for high retry delays
    if (metrics.averageDelayPerRetry > 5000) {
      recommendations.push({
        type: 'retry_optimization',
        message: 'High average retry delays detected. Consider optimizing backoff strategy or reducing retry attempts.',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Get failure pattern analysis
   */
  getFailurePatternAnalysis() {
    const patterns = {};
    
    for (const [endpoint, endpointPatterns] of this.retryMetrics.failurePatterns.entries()) {
      const total = Object.values(endpointPatterns).reduce((sum, count) => sum + count, 0);
      patterns[endpoint] = {
        total,
        breakdown: Object.entries(endpointPatterns).map(([type, count]) => ({
          type,
          count,
          percentage: ((count / total) * 100).toFixed(1) + '%'
        }))
      };
    }
    
    return patterns;
  }

  /**
   * Get active retry operations
   */
  getActiveRetries() {
    return Array.from(this.activeRetries.values());
  }

  /**
   * Get circuit breaker status for endpoint
   */
  getCircuitBreakerStatus(endpoint) {
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    return {
      endpoint,
      state: circuitBreaker.state,
      failures: circuitBreaker.failures,
      successes: circuitBreaker.successes,
      nextAttemptTime: circuitBreaker.nextAttemptTime,
      isHealthy: circuitBreaker.state === 'CLOSED'
    };
  }

  /**
   * Reset circuit breaker for endpoint (manual recovery)
   */
  resetCircuitBreaker(endpoint) {
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    circuitBreaker.state = 'CLOSED';
    circuitBreaker.failures = 0;
    circuitBreaker.successes = 0;
    circuitBreaker.failureWindow = [];
    circuitBreaker.nextAttemptTime = null;
    
    this.notifyStatusChange('CIRCUIT_BREAKER_RESET', { endpoint });
  }

  /**
   * Update retry configuration
   */
  updateConfig(newConfig) {
    this.retryConfig = { ...this.retryConfig, ...newConfig };
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.retryMetrics = {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      circuitBreakerTrips: 0,
      averageRetryDelay: 0,
      retrysByErrorType: {
        network: 0,
        server: 0,
        client: 0,
        authentication: 0
      }
    };
  }
}

// Create singleton instance
const retryService = new RetryService();

export default retryService;