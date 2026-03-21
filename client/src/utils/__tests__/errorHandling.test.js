/**
 * Error Handling Utilities Tests
 * 
 * Tests for error classification, severity determination, logging,
 * and recovery strategies including edge cases and boundary conditions.
 */

import {
  ERROR_TYPES,
  ERROR_SEVERITY,
  classifyError,
  getErrorSeverity,
  logError,
  networkErrorRecovery,
  errorRecoveryStrategies,
  getUserFriendlyMessage,
  createErrorBoundaryConfig
} from '../errorHandling';

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    sessionStorage.clear();
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('classifyError', () => {
    test('should classify network errors correctly', () => {
      const errors = [
        new Error('fetch failed'),
        new Error('Network Error'),
        new Error('Failed to load resource'),
        new Error('Connection timeout'),
        new Error('ECONNREFUSED')
      ];

      errors.forEach(error => {
        expect(classifyError(error)).toBe(ERROR_TYPES.NETWORK);
      });
    });

    test('should classify chart errors correctly', () => {
      const chartError = new Error('Canvas rendering failed');
      expect(classifyError(chartError, 'chart')).toBe(ERROR_TYPES.CHART);

      const svgError = new Error('SVG element not found');
      expect(classifyError(svgError)).toBe(ERROR_TYPES.CHART);
    });

    test('should classify trading errors correctly', () => {
      const tradingError = new Error('Insufficient balance');
      expect(classifyError(tradingError, 'trading')).toBe(ERROR_TYPES.TRADING);

      const orderError = new Error('Order failed');
      expect(classifyError(orderError, 'order')).toBe(ERROR_TYPES.TRADING);
    });

    test('should classify data processing errors correctly', () => {
      const errors = [
        new Error('JSON parse error'),
        new Error('Cannot read property of undefined'),
        new Error('null is not an object')
      ];

      errors.forEach(error => {
        expect(classifyError(error)).toBe(ERROR_TYPES.DATA_PROCESSING);
      });
    });

    test('should classify authentication errors correctly', () => {
      const errors = [
        new Error('Unauthorized'),
        new Error('Invalid token'),
        new Error('Authentication failed')
      ];

      errors.forEach(error => {
        expect(classifyError(error)).toBe(ERROR_TYPES.AUTHENTICATION);
      });
    });

    test('should classify validation errors correctly', () => {
      const errors = [
        new Error('Validation failed'),
        new Error('Invalid input'),
        new Error('Required field missing')
      ];

      errors.forEach(error => {
        expect(classifyError(error)).toBe(ERROR_TYPES.VALIDATION);
      });
    });

    test('should classify unknown errors as UNKNOWN', () => {
      const unknownError = new Error('Something went wrong');
      expect(classifyError(unknownError)).toBe(ERROR_TYPES.UNKNOWN);
    });

    test('should handle errors without message', () => {
      const error = new Error();
      expect(classifyError(error)).toBe(ERROR_TYPES.UNKNOWN);
    });

    test('should handle null or undefined errors', () => {
      expect(classifyError(null)).toBe(ERROR_TYPES.UNKNOWN);
      expect(classifyError(undefined)).toBe(ERROR_TYPES.UNKNOWN);
    });

    test('should be case-insensitive', () => {
      const error = new Error('NETWORK ERROR');
      expect(classifyError(error)).toBe(ERROR_TYPES.NETWORK);
    });
  });

  describe('getErrorSeverity', () => {
    test('should assign CRITICAL severity to trading errors', () => {
      expect(getErrorSeverity(ERROR_TYPES.TRADING)).toBe(ERROR_SEVERITY.CRITICAL);
    });

    test('should assign HIGH severity to authentication errors', () => {
      expect(getErrorSeverity(ERROR_TYPES.AUTHENTICATION)).toBe(ERROR_SEVERITY.HIGH);
    });

    test('should assign MEDIUM severity to network errors', () => {
      expect(getErrorSeverity(ERROR_TYPES.NETWORK)).toBe(ERROR_SEVERITY.MEDIUM);
    });

    test('should assign LOW severity to chart errors', () => {
      expect(getErrorSeverity(ERROR_TYPES.CHART)).toBe(ERROR_SEVERITY.LOW);
    });

    test('should assign LOW severity to data processing errors', () => {
      expect(getErrorSeverity(ERROR_TYPES.DATA_PROCESSING)).toBe(ERROR_SEVERITY.LOW);
    });

    test('should assign MEDIUM severity to unknown errors', () => {
      expect(getErrorSeverity(ERROR_TYPES.UNKNOWN)).toBe(ERROR_SEVERITY.MEDIUM);
    });
  });

  describe('logError', () => {
    test('should log error with correct structure', () => {
      const error = new Error('Test error');
      const errorInfo = { componentStack: 'TestComponent' };

      const result = logError(error, errorInfo, 'test-context');

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('context', 'test-context');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('sessionId');
    });

    test('should use console.error for critical errors', () => {
      const error = new Error('Trading failed');
      logError(error, {}, 'trading');

      expect(console.error).toHaveBeenCalled();
    });

    test('should use console.warn for medium severity errors', () => {
      const error = new Error('Network timeout');
      logError(error, {}, 'network');

      expect(console.warn).toHaveBeenCalled();
    });

    test('should include viewport information', () => {
      const error = new Error('Test error');
      const result = logError(error, {});

      expect(result.viewport).toHaveProperty('width');
      expect(result.viewport).toHaveProperty('height');
    });

    test('should generate and persist session ID', () => {
      const error = new Error('Test error');
      const result1 = logError(error, {});
      const result2 = logError(error, {});

      expect(result1.sessionId).toBe(result2.sessionId);
    });

    test('should store errors in localStorage', () => {
      const error = new Error('Test error');
      logError(error, {});

      const stored = JSON.parse(localStorage.getItem('trading_errors') || '[]');
      expect(stored.length).toBeGreaterThan(0);
    });

    test('should limit stored errors to 50', () => {
      for (let i = 0; i < 60; i++) {
        logError(new Error(`Error ${i}`), {});
      }

      const stored = JSON.parse(localStorage.getItem('trading_errors') || '[]');
      expect(stored.length).toBeLessThanOrEqual(50);
    });
  });

  describe('networkErrorRecovery', () => {
    describe('retryWithBackoff', () => {
      test('should succeed on first attempt', async () => {
        const fn = jest.fn().mockResolvedValue('success');
        
        const result = await networkErrorRecovery.retryWithBackoff(fn);

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
      });

      test('should retry on failure and eventually succeed', async () => {
        const fn = jest.fn()
          .mockRejectedValueOnce(new Error('Fail 1'))
          .mockRejectedValueOnce(new Error('Fail 2'))
          .mockResolvedValue('success');

        const result = await networkErrorRecovery.retryWithBackoff(fn, 3);

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(3);
      });

      test('should throw after max retries', async () => {
        const fn = jest.fn().mockRejectedValue(new Error('Persistent failure'));

        await expect(
          networkErrorRecovery.retryWithBackoff(fn, 2)
        ).rejects.toThrow('Persistent failure');

        expect(fn).toHaveBeenCalledTimes(2);
      });

      test('should use exponential backoff delays', async () => {
        const fn = jest.fn()
          .mockRejectedValueOnce(new Error('Fail'))
          .mockResolvedValue('success');

        const startTime = Date.now();
        await networkErrorRecovery.retryWithBackoff(fn, 3, 100);
        const duration = Date.now() - startTime;

        expect(duration).toBeGreaterThanOrEqual(100);
      });

      test('should handle zero retries', async () => {
        const fn = jest.fn().mockRejectedValue(new Error('Fail'));

        await expect(
          networkErrorRecovery.retryWithBackoff(fn, 0)
        ).rejects.toThrow('Fail');
      });
    });

    describe('checkConnectivity', () => {
      test('should return true when online', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true });

        const result = await networkErrorRecovery.checkConnectivity();

        expect(result).toBe(true);
      });

      test('should return false when offline', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

        const result = await networkErrorRecovery.checkConnectivity();

        expect(result).toBe(false);
      });

      test('should return false on non-ok response', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: false });

        const result = await networkErrorRecovery.checkConnectivity();

        expect(result).toBe(false);
      });
    });

    describe('getCachedData', () => {
      test('should return cached data when available', () => {
        const testData = { value: 'test' };
        localStorage.setItem('cache_test', JSON.stringify(testData));

        const result = networkErrorRecovery.getCachedData('test');

        expect(result).toEqual(testData);
      });

      test('should return null when cache is empty', () => {
        const result = networkErrorRecovery.getCachedData('nonexistent');

        expect(result).toBeNull();
      });

      test('should return null on parse error', () => {
        localStorage.setItem('cache_test', 'invalid json');

        const result = networkErrorRecovery.getCachedData('test');

        expect(result).toBeNull();
      });
    });

    describe('setCachedData', () => {
      test('should cache data successfully', () => {
        const testData = { value: 'test' };
        
        networkErrorRecovery.setCachedData('test', testData);

        const cached = JSON.parse(localStorage.getItem('cache_test'));
        expect(cached.data).toEqual(testData);
        expect(cached.timestamp).toBeDefined();
        expect(cached.ttl).toBeDefined();
      });

      test('should handle cache write failures gracefully', () => {
        // Fill localStorage to cause quota exceeded
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

        expect(() => {
          networkErrorRecovery.setCachedData('test', { data: 'test' });
        }).not.toThrow();
      });
    });
  });

  describe('errorRecoveryStrategies', () => {
    test('should have strategy for all error types', () => {
      Object.values(ERROR_TYPES).forEach(errorType => {
        expect(errorRecoveryStrategies[errorType]).toBeDefined();
      });
    });

    test('should not auto-retry trading errors', () => {
      const strategy = errorRecoveryStrategies[ERROR_TYPES.TRADING];
      expect(strategy.autoRetry).toBe(false);
      expect(strategy.maxRetries).toBe(0);
    });

    test('should auto-retry network errors', () => {
      const strategy = errorRecoveryStrategies[ERROR_TYPES.NETWORK];
      expect(strategy.autoRetry).toBe(true);
      expect(strategy.maxRetries).toBeGreaterThan(0);
    });

    test('should have user messages for all strategies', () => {
      Object.values(errorRecoveryStrategies).forEach(strategy => {
        expect(strategy.userMessage).toBeDefined();
        expect(typeof strategy.userMessage).toBe('string');
      });
    });
  });

  describe('getUserFriendlyMessage', () => {
    test('should return appropriate message for network errors', () => {
      const error = new Error('Network timeout');
      const message = getUserFriendlyMessage(error);

      expect(message).toContain('connection');
    });

    test('should return appropriate message for trading errors', () => {
      const error = new Error('Insufficient balance');
      const message = getUserFriendlyMessage(error, 'trading');

      expect(message).toContain('Trading');
    });

    test('should return appropriate message for authentication errors', () => {
      const error = new Error('Unauthorized');
      const message = getUserFriendlyMessage(error);

      expect(message).toContain('Authentication');
    });

    test('should return generic message for unknown errors', () => {
      const error = new Error('Unknown error');
      const message = getUserFriendlyMessage(error);

      expect(message).toBeDefined();
      expect(message.length).toBeGreaterThan(0);
    });

    test('should handle null errors', () => {
      const message = getUserFriendlyMessage(null);

      expect(message).toBeDefined();
    });
  });

  describe('createErrorBoundaryConfig', () => {
    test('should create config with default values', () => {
      const config = createErrorBoundaryConfig('test');

      expect(config.context).toBe('test');
      expect(config.title).toBeDefined();
      expect(config.message).toBeDefined();
      expect(config).toHaveProperty('showRetry');
      expect(config).toHaveProperty('showRefresh');
    });

    test('should merge custom options', () => {
      const config = createErrorBoundaryConfig('test', {
        title: 'Custom Title',
        compact: true
      });

      expect(config.title).toBe('Custom Title');
      expect(config.compact).toBe(true);
    });

    test('should use strategy-based retry settings', () => {
      const networkConfig = createErrorBoundaryConfig('network');
      const tradingConfig = createErrorBoundaryConfig('trading');

      expect(networkConfig.showRetry).toBe(true);
      expect(tradingConfig.showRetry).toBe(false);
    });

    test('should handle unknown contexts', () => {
      const config = createErrorBoundaryConfig('unknown-context');

      expect(config).toBeDefined();
      expect(config.context).toBe('unknown-context');
    });
  });

  describe('Edge Cases', () => {
    test('should handle errors with circular references', () => {
      const error = new Error('Test');
      error.circular = error;

      expect(() => {
        logError(error, {});
      }).not.toThrow();
    });

    test('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new Error(longMessage);

      const result = logError(error, {});

      expect(result.error.message).toBe(longMessage);
    });

    test('should handle errors with special characters', () => {
      const error = new Error('Error: <script>alert("xss")</script>');

      const result = logError(error, {});

      expect(result.error.message).toContain('<script>');
    });

    test('should handle errors with unicode characters', () => {
      const error = new Error('错误: 网络连接失败 🚫');

      const result = logError(error, {});

      expect(result.error.message).toContain('错误');
    });

    test('should handle errors without stack trace', () => {
      const error = { message: 'Error without stack' };

      const result = logError(error, {});

      expect(result.error.stack).toBeUndefined();
    });

    test('should handle extremely nested error info', () => {
      const deepErrorInfo = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value'
              }
            }
          }
        }
      };

      expect(() => {
        logError(new Error('Test'), deepErrorInfo);
      }).not.toThrow();
    });

    test('should handle concurrent error logging', () => {
      const errors = Array.from({ length: 100 }, (_, i) => 
        new Error(`Error ${i}`)
      );

      errors.forEach(error => {
        logError(error, {});
      });

      const stored = JSON.parse(localStorage.getItem('trading_errors') || '[]');
      expect(stored.length).toBeLessThanOrEqual(50);
    });

    test('should handle errors when localStorage is unavailable', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      expect(() => {
        logError(new Error('Test'), {});
      }).not.toThrow();
    });

    test('should handle errors when sessionStorage is unavailable', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('sessionStorage unavailable');
      });

      expect(() => {
        logError(new Error('Test'), {});
      }).not.toThrow();
    });
  });

  describe('Boundary Conditions', () => {
    test('should handle zero-length error messages', () => {
      const error = new Error('');
      const result = classifyError(error);

      expect(result).toBe(ERROR_TYPES.UNKNOWN);
    });

    test('should handle maximum safe integer values', () => {
      const error = new Error(`Error code: ${Number.MAX_SAFE_INTEGER}`);
      
      expect(() => {
        logError(error, {});
      }).not.toThrow();
    });

    test('should handle negative numbers in error context', () => {
      const error = new Error('Balance: -1000');
      const result = classifyError(error, 'trading');

      expect(result).toBe(ERROR_TYPES.TRADING);
    });

    test('should handle floating point precision issues', () => {
      const error = new Error(`Price: ${0.1 + 0.2}`);
      
      expect(() => {
        logError(error, {});
      }).not.toThrow();
    });

    test('should handle empty context strings', () => {
      const error = new Error('Test');
      const result = classifyError(error, '');

      expect(result).toBeDefined();
    });

    test('should handle whitespace-only context strings', () => {
      const error = new Error('Test');
      const result = classifyError(error, '   ');

      expect(result).toBeDefined();
    });
  });
});
