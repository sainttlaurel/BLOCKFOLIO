/**
 * Enhanced Data Manager Tests
 * 
 * Tests for the enhanced data manager with intelligent caching integration,
 * background refresh, cache warming, and performance optimization.
 */

import dataManager from '../dataManager';
import cacheService from '../cacheService';

// Mock axios
jest.mock('axios');

// Mock cache service
jest.mock('../cacheService', () => ({
  get: jest.fn(),
  set: jest.fn(),
  getMetrics: jest.fn(),
  getAnalytics: jest.fn(),
  getHealthStatus: jest.fn(),
  optimizeConfiguration: jest.fn(),
  warmCache: jest.fn(),
  clear: jest.fn()
}));

// Mock retry service
jest.mock('../retryService', () => ({
  executeWithRetry: jest.fn(),
  getMetrics: jest.fn(() => ({
    totalRetries: 0,
    successRate: 100,
    activeRetries: 0,
    circuitBreakerTrips: 0
  }))
}));

describe('Enhanced Data Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock returns
    cacheService.getMetrics.mockReturnValue({
      hitRate: '85%',
      memoryUsageMB: '25.5',
      compressionRatio: '15%',
      backgroundRefreshes: 10,
      cacheWarmings: 5,
      cacheEfficiencyScore: 85
    });
    
    cacheService.getAnalytics.mockReturnValue({
      accessPatterns: {},
      volatilityTracking: {},
      compressionEffectiveness: { totalSavings: 1024 }
    });
    
    cacheService.getHealthStatus.mockReturnValue({
      status: 'healthy',
      issues: [],
      recommendations: []
    });
  });

  describe('Cache Integration', () => {
    test('should initialize cache integration on startup', () => {
      // Verify event listeners are set up
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      // Create new instance to trigger initialization
      const testManager = new (require('../dataManager').default.constructor)();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('cacheBackgroundRefresh', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('cacheWarming', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('cacheWarmingRequested', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    test('should handle background refresh events', async () => {
      const mockExecuteHttpRequest = jest.spyOn(dataManager, 'executeHttpRequest')
        .mockResolvedValue({ prices: [{ symbol: 'BTC', price: 50000 }] });
      
      // Simulate background refresh event
      await dataManager.handleBackgroundRefresh({
        key: 'prices_current_prices'
      });
      
      expect(mockExecuteHttpRequest).toHaveBeenCalledWith('/coins/prices', { method: 'GET' });
      expect(cacheService.set).toHaveBeenCalledWith(
        'prices',
        'current_prices',
        expect.any(Object),
        null,
        'high'
      );
      
      mockExecuteHttpRequest.mockRestore();
    });

    test('should handle cache warming events', async () => {
      const mockExecuteHttpRequest = jest.spyOn(dataManager, 'executeHttpRequest')
        .mockResolvedValue({ marketData: { totalMarketCap: 2000000000000 } });
      
      // Simulate cache warming event
      await dataManager.handleCacheWarming({
        key: 'marketData_market_overview'
      });
      
      expect(mockExecuteHttpRequest).toHaveBeenCalledWith('/coins/market/data', {
        method: 'GET',
        timeout: 8000
      });
      
      mockExecuteHttpRequest.mockRestore();
    });

    test('should warm critical data on startup', async () => {
      const mockPreload = jest.spyOn(cacheService, 'preload')
        .mockResolvedValue({ success: true });
      
      await dataManager.warmCriticalData();
      
      // Should attempt to warm critical data types
      expect(mockPreload).toHaveBeenCalledTimes(3); // prices, marketData, portfolio
      
      mockPreload.mockRestore();
    });
  });

  describe('Enhanced Request Method', () => {
    test('should use volatility information from endpoint configuration', async () => {
      const mockExecuteHttpRequest = jest.spyOn(dataManager, 'executeHttpRequest')
        .mockResolvedValue({ data: 'test' });
      
      await dataManager.request('/coins/prices', {
        cacheNamespace: 'prices',
        cacheKey: 'test',
        useCache: true
      });
      
      // Should set cache with high volatility for prices endpoint
      expect(cacheService.set).toHaveBeenCalledWith(
        'prices',
        'test',
        { data: 'test' },
        null,
        'high' // Volatility from endpoint config
      );
      
      mockExecuteHttpRequest.mockRestore();
    });

    test('should handle cache hits efficiently', async () => {
      cacheService.get.mockReturnValue({ cached: 'data' });
      
      const result = await dataManager.request('/test', {
        cacheNamespace: 'test',
        cacheKey: 'cached_item',
        useCache: true
      });
      
      expect(result).toEqual({ cached: 'data' });
      expect(cacheService.get).toHaveBeenCalledWith('test', 'cached_item');
    });
  });

  describe('Performance Optimization', () => {
    test('should monitor cache performance and trigger optimization', () => {
      // Mock poor performance metrics
      cacheService.getMetrics.mockReturnValue({
        hitRate: '65%', // Below 70% threshold
        memoryUsageMB: '45.0',
        compressionRatio: '10%'
      });
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      dataManager.optimizeCachePerformance();
      
      expect(cacheService.optimizeConfiguration).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cache hit rate below threshold')
      );
      
      consoleLogSpy.mockRestore();
    });

    test('should emit performance metrics events', () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
      
      dataManager.optimizeCachePerformance();
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cachePerformanceUpdate'
        })
      );
      
      dispatchEventSpy.mockRestore();
    });
  });

  describe('Background Refresh Methods', () => {
    test('should refresh prices in background without blocking UI', async () => {
      const mockExecuteHttpRequest = jest.spyOn(dataManager, 'executeHttpRequest')
        .mockResolvedValue([{ symbol: 'BTC', price: 51000 }]);
      
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
      
      await dataManager.refreshPricesInBackground();
      
      expect(mockExecuteHttpRequest).toHaveBeenCalledWith('/coins/prices', { method: 'GET' });
      expect(cacheService.set).toHaveBeenCalledWith(
        'prices',
        'current_prices',
        expect.any(Array),
        null,
        'high'
      );
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'backgroundDataUpdate'
        })
      );
      
      mockExecuteHttpRequest.mockRestore();
      dispatchEventSpy.mockRestore();
    });

    test('should handle background refresh failures gracefully', async () => {
      const mockExecuteHttpRequest = jest.spyOn(dataManager, 'executeHttpRequest')
        .mockRejectedValue(new Error('Network error'));
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Should not throw
      await expect(dataManager.refreshPricesInBackground()).resolves.toBeUndefined();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Background price refresh failed:',
        expect.any(Error)
      );
      
      mockExecuteHttpRequest.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Cache Warming Methods', () => {
    test('should warm cache with optimized timeouts', async () => {
      const mockExecuteHttpRequest = jest.spyOn(dataManager, 'executeHttpRequest')
        .mockResolvedValue({ portfolio: { totalValue: 100000 } });
      
      await dataManager.warmPortfolioCache();
      
      expect(mockExecuteHttpRequest).toHaveBeenCalledWith('/wallet', {
        method: 'GET',
        timeout: 10000 // Optimized timeout for warming
      });
      
      mockExecuteHttpRequest.mockRestore();
    });

    test('should warm specific data by namespace and identifier', async () => {
      const mockWarmPricesCache = jest.spyOn(dataManager, 'warmPricesCache')
        .mockResolvedValue();
      
      await dataManager.warmSpecificData('prices', 'current_prices');
      
      expect(mockWarmPricesCache).toHaveBeenCalled();
      
      mockWarmPricesCache.mockRestore();
    });
  });

  describe('Cache Health Monitoring', () => {
    test('should provide cache health status', () => {
      const health = dataManager.getCacheHealth();
      
      expect(health).toEqual({
        status: 'healthy',
        issues: [],
        recommendations: []
      });
      expect(cacheService.getHealthStatus).toHaveBeenCalled();
    });

    test('should provide cache analytics', () => {
      const analytics = dataManager.getCacheAnalytics();
      
      expect(analytics).toHaveProperty('accessPatterns');
      expect(analytics).toHaveProperty('volatilityTracking');
      expect(cacheService.getAnalytics).toHaveBeenCalled();
    });

    test('should optimize cache configuration', () => {
      dataManager.optimizeCacheConfiguration();
      
      expect(cacheService.optimizeConfiguration).toHaveBeenCalled();
    });
  });

  describe('Integration with Existing Methods', () => {
    test('should enhance getPrices with intelligent caching', async () => {
      const mockRequest = jest.spyOn(dataManager, 'request')
        .mockResolvedValue([{ symbol: 'BTC', price: 50000 }]);
      
      const result = await dataManager.getPrices();
      
      expect(mockRequest).toHaveBeenCalledWith('/coins/prices', {
        cacheNamespace: 'prices',
        cacheKey: 'current_prices',
        cacheTTL: expect.any(Number),
        customRetryConfig: {}
      });
      
      mockRequest.mockRestore();
    });

    test('should enhance getMarketData with medium volatility', async () => {
      const mockRequest = jest.spyOn(dataManager, 'request')
        .mockResolvedValue({ totalMarketCap: 2000000000000 });
      
      await dataManager.getMarketData();
      
      expect(mockRequest).toHaveBeenCalledWith('/coins/market/data', {
        cacheNamespace: 'marketData',
        cacheKey: 'market_overview',
        cacheTTL: expect.any(Number),
        customRetryConfig: {}
      });
      
      mockRequest.mockRestore();
    });

    test('should enhance getPortfolioData with background refresh support', async () => {
      const mockRequest = jest.spyOn(dataManager, 'request')
        .mockResolvedValue({ totalValue: 100000, holdings: [] });
      
      await dataManager.getPortfolioData();
      
      expect(mockRequest).toHaveBeenCalledWith('/wallet', {
        cacheNamespace: 'portfolioData',
        cacheKey: 'user_portfolio',
        cacheTTL: expect.any(Number),
        customRetryConfig: {}
      });
      
      mockRequest.mockRestore();
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle cache warming failures without affecting main functionality', async () => {
      const mockExecuteHttpRequest = jest.spyOn(dataManager, 'executeHttpRequest')
        .mockRejectedValue(new Error('Warming failed'));
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Should handle multiple warming requests
      await dataManager.handleCacheWarmingRequest({
        keys: [
          { namespace: 'prices', identifier: 'current_prices' },
          { namespace: 'marketData', identifier: 'market_overview' }
        ]
      });
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      
      mockExecuteHttpRequest.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    test('should prevent concurrent background refresh operations', async () => {
      dataManager.backgroundRefreshActive = true;
      
      const mockExecuteHttpRequest = jest.spyOn(dataManager, 'executeHttpRequest');
      
      await dataManager.handleBackgroundRefresh({ key: 'prices_current_prices' });
      
      // Should not execute request when already active
      expect(mockExecuteHttpRequest).not.toHaveBeenCalled();
      
      mockExecuteHttpRequest.mockRestore();
    });

    test('should prevent concurrent cache warming operations', async () => {
      dataManager.cacheWarmingActive = true;
      
      const mockExecuteHttpRequest = jest.spyOn(dataManager, 'executeHttpRequest');
      
      await dataManager.handleCacheWarming({ key: 'marketData_market_overview' });
      
      // Should not execute request when already active
      expect(mockExecuteHttpRequest).not.toHaveBeenCalled();
      
      mockExecuteHttpRequest.mockRestore();
    });
  });
});