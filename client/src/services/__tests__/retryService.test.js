/**
 * Retry Service Test Suite
 * 
 * Comprehensive tests for retry mechanisms with exponential backoff,
 * circuit breaker pattern, and user feedback systems.
 */

import retryService from '../retryService';

// Mock timers for testing delays
jest.useFakeTimers();

describe('RetryService', () => {
  beforeEach(() => {
    // Reset service state before each test
    retryService.resetMetrics();
    retryService.activeRetries.clear();
    retryService.circuitBreakers.clear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Basic Retry Functionality', () => {
    test('should succeed on first attempt without retry', async () => {
      const mockRequest = jest.fn().mockResolvedValue('success');
      
      const result = await retryService.executeWithRetry(mockRequest, {
        endpoint: 'test-endpoint'
      });
      
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    test('should retry on network error and eventually succeed', async () => {
      const mockRequest = jest.fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue('success');
      
      const promise = retryService.executeWithRetry(mockRequest, {
        endpoint: 'test-endpoint',
        customConfig: { maxRetries: 2 }
      });
      
      // Fast-forward through the retry delay
      jest.advanceTimersByTime(1000);
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });

    test('should fail after max retries exceeded', async () => {
      const mockRequest = jest.fn().mockRejectedValue(new Error('Persistent Error'));
      
      const promise = retryService.executeWithRetry(mockRequest, {
        endpoint: 'test-endpoint',
        customConfig: { maxRetries: 2 }
      });
      
      // Fast-forward through all retry delays
      jest.advanceTimersByTime(10000);
      
      await expect(promise).rejects.toThrow('Persistent Error');
      expect(mockRequest).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Exponential Backoff', () => {
    test('should calculate exponential backoff delays correctly', () => {
      const config = {
        baseDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 30000,
        jitterFactor: 0
      };
      
      const delay1 = retryService.calculateRetryDelay(0, 'network', config);
      const delay2 = retryService.calculateRetryDelay(1, 'network', config);
      const delay3 = retryService.calculateRetryDelay(2, 'network', config);
      
      expect(delay1).toBe(1000);
      expect(delay2).toBe(2000);
      expect(delay3).toBe(4000);
    });

    test('should respect maximum delay limit', () => {
      const config = {
        baseDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 5000,
        jitterFactor: 0
      };
      
      const delay = retryService.calculateRetryDelay(10, 'network', config);
      expect(delay).toBe(5000);
    });

    test('should add jitter to prevent thundering herd', () => {
      const config = {
        baseDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 30000,
        jitterFactor: 0.1
      };
      
      const delays = [];
      for (let i = 0; i < 10; i++) {
        delays.push(retryService.calculateRetryDelay(1, 'network', config));
      }
      
      // With jitter, delays should vary
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('Error Classification', () => {
    test('should classify network errors correctly', () => {
      const networkError = new Error('Network Error');
      networkError.code = 'NETWORK_ERROR';
      
      expect(retryService.classifyError(networkError)).toBe('network');
    });

    test('should classify server errors correctly', () => {
      const serverError = new Error('Internal Server Error');
      serverError.response = { status: 500 };
      
      expect(retryService.classifyError(serverError)).toBe('server');
    });

    test('should classify authentication errors correctly', () => {
      const authError = new Error('Unauthorized');
      authError.response = { status: 401 };
      
      expect(retryService.classifyError(authError)).toBe('authentication');
    });

    test('should classify rate limiting errors correctly', () => {
      const rateLimitError = new Error('Too Many Requests');
      rateLimitError.response = { status: 429 };
      
      expect(retryService.classifyError(rateLimitError)).toBe('client');
    });
  });

  describe('Retry Strategy Selection', () => {
    test('should use critical strategy for critical operations', () => {
      const strategy = retryService.determineRetryStrategy('critical', 'data');
      expect(strategy).toBe('critical');
    });

    test('should use critical strategy for trading operations', () => {
      const strategy = retryService.determineRetryStrategy('normal', 'trading');
      expect(strategy).toBe('critical');
    });

    test('should use authentication strategy for auth operations', () => {
      const strategy = retryService.determineRetryStrategy('normal', 'authentication');
      expect(strategy).toBe('authentication');
    });

    test('should use non-critical strategy for low priority operations', () => {
      const strategy = retryService.determineRetryStrategy('low', 'data');
      expect(strategy).toBe('nonCritical');
    });
  });

  describe('Circuit Breaker Pattern', () => {
    test('should open circuit breaker after failure threshold', async () => {
      const mockRequest = jest.fn().mockRejectedValue(new Error('Server Error'));
      
      // Trigger multiple failures to open circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          const promise = retryService.executeWithRetry(mockRequest, {
            endpoint: 'failing-endpoint',
            customConfig: { maxRetries: 0 }
          });
          jest.advanceTimersByTime(1000);
          await promise;
        } catch (error) {
          // Expected to fail
        }
      }
      
      const circuitBreakerStatus = retryService.getCircuitBreakerStatus('failing-endpoint');
      expect(circuitBreakerStatus.state).toBe('OPEN');
    });

    test('should reject requests when circuit breaker is open', async () => {
      const mockRequest = jest.fn().mockRejectedValue(new Error('Server Error'));
      
      // Open the circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          const promise = retryService.executeWithRetry(mockRequest, {
            endpoint: 'failing-endpoint',
            customConfig: { maxRetries: 0 }
          });
          jest.advanceTimersByTime(1000);
          await promise;
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Now try to make a request with open circuit breaker
      await expect(
        retryService.executeWithRetry(mockRequest, {
          endpoint: 'failing-endpoint'
        })
      ).rejects.toThrow('Circuit breaker is OPEN');
    });

    test('should transition to half-open after recovery timeout', () => {
      // Manually set circuit breaker to open state
      const circuitBreaker = retryService.getCircuitBreaker('test-endpoint');
      circuitBreaker.state = 'OPEN';
      circuitBreaker.nextAttemptTime = Date.now() + 30000;
      
      // Fast-forward past recovery timeout
      jest.advanceTimersByTime(35000);
      
      // Trigger recovery check
      retryService.checkCircuitBreakerRecovery();
      
      expect(circuitBreaker.state).toBe('HALF_OPEN');
    });
  });

  describe('User Feedback', () => {
    test('should dispatch user feedback events', async () => {
      const mockRequest = jest.fn().mockRejectedValue(new Error('Network Error'));
      const feedbackEvents = [];
      
      // Listen for user feedback events
      const handleFeedback = (event) => {
        feedbackEvents.push(event.detail);
      };
      window.addEventListener('retryUserFeedback', handleFeedback);
      
      try {
        const promise = retryService.executeWithRetry(mockRequest, {
          endpoint: 'test-endpoint',
          customConfig: { maxRetries: 1 },
          userFeedback: true
        });
        jest.advanceTimersByTime(2000);
        await promise;
      } catch (error) {
        // Expected to fail
      }
      
      window.removeEventListener('retryUserFeedback', handleFeedback);
      
      expect(feedbackEvents.length).toBeGreaterThan(0);
      expect(feedbackEvents.some(event => event.type === 'retry_attempt')).toBe(true);
    });

    test('should generate user-friendly error messages', () => {
      const networkError = new Error('Network Error');
      networkError.code = 'NETWORK_ERROR';
      
      const message = retryService.getUserFriendlyErrorMessage(networkError, 'network');
      expect(message).toContain('Connection issue detected');
    });
  });

  describe('Metrics and Analytics', () => {
    test('should track retry metrics correctly', async () => {
      const mockRequest = jest.fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue('success');
      
      const promise = retryService.executeWithRetry(mockRequest, {
        endpoint: 'test-endpoint'
      });
      jest.advanceTimersByTime(2000);
      await promise;
      
      const metrics = retryService.getMetrics();
      expect(metrics.totalRetries).toBe(1);
      expect(metrics.successfulRetries).toBe(1);
      expect(metrics.successRate).toBe('100.00%');
    });

    test('should provide detailed analytics', async () => {
      const mockRequest = jest.fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue('success');
      
      const promise = retryService.executeWithRetry(mockRequest, {
        endpoint: 'test-endpoint'
      });
      jest.advanceTimersByTime(2000);
      await promise;
      
      const analytics = retryService.getRetryAnalytics();
      expect(analytics.overview).toBeDefined();
      expect(analytics.performance).toBeDefined();
      expect(analytics.reliability).toBeDefined();
      expect(analytics.recommendations).toBeDefined();
    });

    test('should track endpoint-specific metrics', async () => {
      const mockRequest = jest.fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValue('success');
      
      const promise = retryService.executeWithRetry(mockRequest, {
        endpoint: 'specific-endpoint'
      });
      jest.advanceTimersByTime(2000);
      await promise;
      
      const metrics = retryService.getMetrics();
      const endpointMetrics = metrics.endpointMetrics.find(
        m => m.endpoint === 'specific-endpoint'
      );
      
      expect(endpointMetrics).toBeDefined();
      expect(endpointMetrics.total).toBe(1);
      expect(endpointMetrics.successful).toBe(1);
    });
  });

  describe('Configuration Management', () => {
    test('should allow configuration updates', () => {
      const newConfig = {
        maxRetries: 10,
        baseDelay: 2000
      };
      
      retryService.updateConfig(newConfig);
      
      expect(retryService.retryConfig.maxRetries).toBe(10);
      expect(retryService.retryConfig.baseDelay).toBe(2000);
    });

    test('should reset metrics when requested', () => {
      // Add some metrics
      retryService.retryMetrics.totalRetries = 5;
      retryService.retryMetrics.successfulRetries = 3;
      
      retryService.resetMetrics();
      
      expect(retryService.retryMetrics.totalRetries).toBe(0);
      expect(retryService.retryMetrics.successfulRetries).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle mixed success and failure scenarios', async () => {
      const requests = [
        jest.fn().mockResolvedValue('success1'),
        jest.fn().mockRejectedValue(new Error('Network Error')),
        jest.fn().mockResolvedValue('success2')
      ];
      
      // Execute successful request
      await retryService.executeWithRetry(requests[0], {
        endpoint: 'endpoint1'
      });
      
      // Execute failing request
      try {
        const promise = retryService.executeWithRetry(requests[1], {
          endpoint: 'endpoint2',
          customConfig: { maxRetries: 1 }
        });
        jest.advanceTimersByTime(3000);
        await promise;
      } catch (error) {
        // Expected to fail
      }
      
      // Execute another successful request
      await retryService.executeWithRetry(requests[2], {
        endpoint: 'endpoint3'
      });
      
      const metrics = retryService.getMetrics();
      expect(metrics.totalRetries).toBe(1); // Only the failed request counted as retry
      expect(metrics.failedRetries).toBe(1);
    });
  });
});