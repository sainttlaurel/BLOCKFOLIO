/**
 * Error Message Service Tests
 * 
 * Tests the error message service functionality including error processing,
 * recovery actions, and user-friendly message generation.
 */

import errorMessageService from '../errorMessageService';

// Mock dependencies
jest.mock('../retryService', () => ({
  addStatusListener: jest.fn(),
  executeWithRetry: jest.fn()
}));

jest.mock('../gracefulDegradation', () => ({
  on: jest.fn(),
  currentLevel: 'full'
}));

jest.mock('../offlineService', () => ({
  addListener: jest.fn(),
  isOffline: false
}));

jest.mock('../fallbackManager', () => ({
  on: jest.fn()
}));

describe('ErrorMessageService', () => {
  beforeEach(() => {
    // Reset service state
    errorMessageService.errorContext.recentErrors = [];
    errorMessageService.errorContext.errorFrequency.clear();
  });

  describe('processError', () => {
    it('should process network errors correctly', () => {
      const error = new Error('Network Error');
      error.code = 'NETWORK_ERROR';
      
      const result = errorMessageService.processError(error, {
        currentPage: '/trading'
      });
      
      expect(result).toBeDefined();
      expect(result.type).toBe('network');
      expect(result.category).toBe('network');
      expect(result.title).toBe('Connection Problem');
      expect(result.recoveryOptions).toHaveLength(3);
      expect(result.recoveryOptions[0].key).toBe('check_connection');
    });

    it('should process authentication errors correctly', () => {
      const error = new Error('Unauthorized');
      error.response = { status: 401 };
      
      const result = errorMessageService.processError(error);
      
      expect(result.type).toBe('authentication');
      expect(result.title).toBe('Authentication Required');
      expect(result.recoveryOptions.some(option => option.key === 'login_again')).toBe(true);
    });

    it('should process trading errors correctly', () => {
      const error = new Error('Insufficient balance');
      error.code = 'INSUFFICIENT_BALANCE';
      
      const result = errorMessageService.processError(error, {
        currentPage: '/trading'
      });
      
      expect(result.type).toBe('trading');
      expect(result.title).toBe('Insufficient Balance');
      expect(result.recoveryOptions.some(option => option.key === 'check_balance')).toBe(true);
    });

    it('should suppress duplicate errors within time window', () => {
      const error = new Error('Network Error');
      error.code = 'NETWORK_ERROR';
      
      // Process same error twice quickly
      const result1 = errorMessageService.processError(error);
      const result2 = errorMessageService.processError(error);
      
      expect(result1).toBeDefined();
      expect(result2).toBeNull(); // Should be suppressed
    });

    it('should contextualize messages based on current page', () => {
      const error = new Error('Network Error');
      error.code = 'NETWORK_ERROR';
      
      const result = errorMessageService.processError(error, {
        currentPage: '/trading'
      });
      
      expect(result.message).toContain('This may affect your ability to place new trades');
    });
  });

  describe('classifyError', () => {
    it('should classify network errors correctly', () => {
      const error = new Error('fetch failed');
      const type = errorMessageService.classifyError(error);
      expect(type).toBe('network');
    });

    it('should classify HTTP status codes correctly', () => {
      const error401 = { response: { status: 401 } };
      const error500 = { response: { status: 500 } };
      const error429 = { response: { status: 429 } };
      
      expect(errorMessageService.classifyError(error401)).toBe('authentication');
      expect(errorMessageService.classifyError(error500)).toBe('server');
      expect(errorMessageService.classifyError(error429)).toBe('client');
    });

    it('should classify trading errors correctly', () => {
      const error = { code: 'TRADING_ERROR' };
      const type = errorMessageService.classifyError(error);
      expect(type).toBe('trading');
    });
  });

  describe('generateRecoveryOptions', () => {
    it('should generate appropriate recovery options for network errors', () => {
      const messageConfig = {
        userActions: ['check_connection', 'retry_request', 'use_offline_mode']
      };
      const error = { code: 'NETWORK_ERROR' };
      
      const options = errorMessageService.generateRecoveryOptions(messageConfig, error, {});
      
      expect(options).toHaveLength(3);
      expect(options[0].key).toBe('check_connection');
      expect(options[0].available).toBe(true);
    });

    it('should add contextual recovery options', () => {
      const messageConfig = { userActions: ['retry_request'] };
      const error = { code: 'INSUFFICIENT_BALANCE' };
      
      const options = errorMessageService.generateRecoveryOptions(messageConfig, error, {
        currentPage: '/trading'
      });
      
      expect(options.some(option => option.key === 'add_funds')).toBe(true);
    });

    it('should sort options by priority and availability', () => {
      const messageConfig = {
        userActions: ['contact_support', 'retry_request', 'check_connection']
      };
      const error = { code: 'NETWORK_ERROR' };
      
      const options = errorMessageService.generateRecoveryOptions(messageConfig, error, {});
      
      // High priority options should come first
      expect(options[0].priority).toBe('high');
    });
  });

  describe('executeRecoveryAction', () => {
    it('should execute refresh page action', async () => {
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });
      
      const errorResponse = { id: 'test', originalError: new Error('test') };
      const result = await errorMessageService.executeRecoveryAction('refresh_page', errorResponse);
      
      expect(result.success).toBe(true);
      expect(mockReload).toHaveBeenCalled();
    });

    it('should execute login redirect action', async () => {
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      });
      
      const errorResponse = { id: 'test', originalError: new Error('test') };
      const result = await errorMessageService.executeRecoveryAction('login_again', errorResponse);
      
      expect(result.success).toBe(true);
      expect(window.location.href).toBe('/login');
    });
  });

  describe('canRetry', () => {
    it('should allow retry for network errors', () => {
      const error = { code: 'NETWORK_ERROR' };
      const canRetry = errorMessageService.canRetry(error, 'network');
      expect(canRetry).toBe(true);
    });

    it('should not allow retry for 400 errors', () => {
      const error = { response: { status: 400 } };
      const canRetry = errorMessageService.canRetry(error, 'client');
      expect(canRetry).toBe(false);
    });

    it('should allow retry for authentication errors', () => {
      const error = { response: { status: 401 } };
      const canRetry = errorMessageService.canRetry(error, 'authentication');
      expect(canRetry).toBe(true);
    });
  });

  describe('getErrorStatistics', () => {
    it('should return error statistics', () => {
      // Add some test errors
      errorMessageService.trackError('NETWORK_ERROR', {
        timestamp: Date.now(),
        severity: 'warning'
      });
      errorMessageService.trackError('SERVER_ERROR', {
        timestamp: Date.now(),
        severity: 'error'
      });
      
      const stats = errorMessageService.getErrorStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.total24h).toBeGreaterThan(0);
      expect(stats.bySeverity).toBeDefined();
      expect(stats.mostFrequent).toBeDefined();
    });
  });

  describe('getUserGuidance', () => {
    it('should provide guidance based on error patterns', () => {
      // Simulate frequent network errors
      for (let i = 0; i < 5; i++) {
        errorMessageService.errorContext.errorFrequency.set('NETWORK_ERROR', 5);
      }
      
      const guidance = errorMessageService.getUserGuidance();
      
      expect(guidance.warnings).toContain('Frequent connection issues detected. Consider checking your internet connection.');
      expect(guidance.recommendations).toContain('Switch to offline mode to continue working with cached data.');
    });

    it('should provide guidance for authentication errors', () => {
      errorMessageService.errorContext.errorFrequency.set('UNAUTHORIZED', 2);
      
      const guidance = errorMessageService.getUserGuidance();
      
      expect(guidance.warnings).toContain('Multiple authentication failures detected.');
    });
  });
});

describe('Error Message Integration', () => {
  it('should integrate with existing error boundaries', () => {
    // Test that error boundaries can use the service
    const error = new Error('Test error');
    const result = errorMessageService.processError(error, {
      componentStack: 'TestComponent'
    });
    
    expect(result).toBeDefined();
    expect(result.context.componentStack).toBe('TestComponent');
  });

  it('should provide recovery options for different error contexts', () => {
    const tradingError = { code: 'INSUFFICIENT_BALANCE' };
    const networkError = { code: 'NETWORK_ERROR' };
    
    const tradingResult = errorMessageService.processError(tradingError, {
      currentPage: '/trading'
    });
    const networkResult = errorMessageService.processError(networkError);
    
    expect(tradingResult.recoveryOptions.some(opt => opt.key === 'check_balance')).toBe(true);
    expect(networkResult.recoveryOptions.some(opt => opt.key === 'check_connection')).toBe(true);
  });
});