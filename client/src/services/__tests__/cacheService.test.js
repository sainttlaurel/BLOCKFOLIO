/**
 * Enhanced Cache Service Tests
 * 
 * Tests for the intelligent caching system including compression,
 * background refresh, cache warming, and performance optimization.
 */

import cacheService from '../cacheService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now())
};

describe('Enhanced Cache Service', () => {
  beforeEach(() => {
    // Clear all mocks and cache
    jest.clearAllMocks();
    cacheService.clear();
    
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  describe('Basic Caching Functionality', () => {
    test('should store and retrieve data with compression', () => {
      const testData = {
        prices: Array.from({ length: 100 }, (_, i) => ({
          symbol: `BTC${i}`,
          price: 50000 + i,
          volume: 1000000 + i,
          marketCap: 1000000000 + i,
          percentageChange: Math.random() * 10 - 5
        }))
      };

      // Set data (should trigger compression due to size)
      cacheService.set('prices', 'large_dataset', testData, null, 'high');

      // Retrieve data
      const retrieved = cacheService.get('prices', 'large_dataset');

      expect(retrieved).toEqual(testData);
    });

    test('should handle intelligent TTL based on volatility', () => {
      const testData = { price: 50000 };

      // Set with high volatility (should reduce TTL)
      cacheService.set('prices', 'volatile_data', testData, 10000, 'high');
      
      // Set with low volatility (should increase TTL)
      cacheService.set('prices', 'stable_data', testData, 10000, 'low');

      const volatileEntry = cacheService.memoryCache.get('cache_prices_volatile_data');
      const stableEntry = cacheService.memoryCache.get('cache_prices_stable_data');

      // High volatility should have shorter TTL
      expect(volatileEntry.ttl).toBeLessThan(stableEntry.ttl);
    });

    test('should track access patterns for predictive caching', () => {
      const testData = { price: 50000 };
      
      cacheService.set('prices', 'tracked_data', testData);

      // Access multiple times to build pattern
      for (let i = 0; i < 5; i++) {
        cacheService.get('prices', 'tracked_data');
      }

      const pattern = cacheService.accessPatterns.get('prices_tracked_data');
      expect(pattern).toBeDefined();
      expect(pattern.count).toBe(5);
    });
  });

  describe('Performance Metrics', () => {
    test('should calculate cache efficiency score', () => {
      // Generate some cache activity
      const testData = { price: 50000 };
      
      cacheService.set('prices', 'test1', testData);
      cacheService.set('prices', 'test2', testData);
      
      // Generate hits and misses
      cacheService.get('prices', 'test1'); // hit
      cacheService.get('prices', 'test1'); // hit
      cacheService.get('prices', 'nonexistent'); // miss

      const metrics = cacheService.getMetrics();
      
      expect(metrics.cacheEfficiencyScore).toBeGreaterThan(0);
      expect(metrics.cacheEfficiencyScore).toBeLessThanOrEqual(100);
      expect(parseFloat(metrics.hitRate)).toBeGreaterThan(0);
    });

    test('should provide comprehensive analytics', () => {
      const testData = { price: 50000 };
      
      cacheService.set('prices', 'analytics_test', testData, null, 'medium');
      cacheService.get('prices', 'analytics_test');

      const analytics = cacheService.getAnalytics();
      
      expect(analytics).toHaveProperty('accessPatterns');
      expect(analytics).toHaveProperty('volatilityTracking');
      expect(analytics).toHaveProperty('compressionEffectiveness');
    });

    test('should monitor memory usage', () => {
      const largeData = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: `large_string_value_${i}`.repeat(10)
        }))
      };

      cacheService.set('test', 'memory_test', largeData);
      
      const metrics = cacheService.getMetrics();
      expect(parseFloat(metrics.memoryUsageMB)).toBeGreaterThan(0);
    });
  });

  describe('Background Refresh and Cache Warming', () => {
    test('should schedule background refresh for stale data', () => {
      const testData = { price: 50000 };
      
      // Set data with short TTL
      cacheService.set('prices', 'refresh_test', testData, 1000, 'high');
      
      // Simulate time passing to reach refresh threshold
      const entry = cacheService.memoryCache.get('cache_prices_refresh_test');
      entry.timestamp = Date.now() - 900; // 90% of TTL passed
      
      // Access should schedule background refresh
      cacheService.get('prices', 'refresh_test');
      
      expect(cacheService.backgroundRefreshQueue.size).toBeGreaterThan(0);
    });

    test('should process cache warming queue', () => {
      // Add items to warming queue
      cacheService.cacheWarmingQueue.add('prices_current_prices');
      cacheService.cacheWarmingQueue.add('marketData_market_overview');
      
      const initialSize = cacheService.cacheWarmingQueue.size;
      
      // Process warming (should emit events)
      const eventSpy = jest.spyOn(window, 'dispatchEvent');
      cacheService.processCacheWarming();
      
      expect(cacheService.cacheWarmingQueue.size).toBe(initialSize - 1);
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cacheWarming'
        })
      );
      
      eventSpy.mockRestore();
    });
  });

  describe('Cache Health and Optimization', () => {
    test('should provide health status assessment', () => {
      // Generate some cache activity for health assessment
      const testData = { price: 50000 };
      
      for (let i = 0; i < 10; i++) {
        cacheService.set('test', `item_${i}`, testData);
        cacheService.get('test', `item_${i}`);
      }
      
      // Add some misses
      for (let i = 0; i < 3; i++) {
        cacheService.get('test', `missing_${i}`);
      }

      const health = cacheService.getHealthStatus();
      
      expect(health).toHaveProperty('status');
      expect(['healthy', 'warning', 'critical']).toContain(health.status);
      expect(health).toHaveProperty('issues');
      expect(health).toHaveProperty('recommendations');
    });

    test('should optimize configuration based on usage patterns', () => {
      // Set up poor performance scenario
      cacheService.metrics.hits = 30;
      cacheService.metrics.misses = 70; // 30% hit rate
      
      const originalTTL = cacheService.cacheConfig.prices;
      
      cacheService.optimizeConfiguration();
      
      // Should increase TTL for low hit rate
      expect(cacheService.cacheConfig.prices).toBeGreaterThan(originalTTL);
    });

    test('should provide optimization recommendations', () => {
      // Simulate high memory usage
      cacheService.metrics.memoryUsage = 45 * 1024 * 1024; // 45MB
      
      const recommendations = cacheService.getOptimizationRecommendations(50, 45, 30);
      
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('compression'))).toBe(true);
    });
  });

  describe('Data Compression', () => {
    test('should compress large data automatically', () => {
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          timestamp: Date.now() + i,
          price: 50000 + i,
          volume: 1000000 + i,
          marketCap: 1000000000 + i,
          percentageChange: Math.random() * 10 - 5
        }))
      };

      cacheService.set('test', 'compression_test', largeData);
      
      const entry = cacheService.memoryCache.get('cache_test_compression_test');
      
      // Should be compressed due to size
      expect(entry.compressed).toBe(true);
      expect(entry.originalSize).toBeGreaterThan(0);
    });

    test('should decompress data correctly', () => {
      const originalData = {
        timestamp: Date.now(),
        price: 50000,
        volume: 1000000,
        marketCap: 1000000000,
        percentageChange: 2.5
      };

      const compressed = cacheService.compress(originalData);
      const decompressed = cacheService.decompress(compressed);
      
      expect(decompressed).toEqual(originalData);
    });

    test('should track compression savings', () => {
      const largeData = {
        data: 'x'.repeat(2000) // Force compression
      };

      cacheService.set('test', 'savings_test', largeData);
      
      const metrics = cacheService.getMetrics();
      expect(metrics.compressionSavings).toBeGreaterThan(0);
    });
  });

  describe('Predictive Caching', () => {
    test('should schedule predictive caching based on access patterns', () => {
      const testData = { price: 50000 };
      
      // Build access pattern
      for (let i = 0; i < 5; i++) {
        cacheService.trackAccess('prices', 'predictive_test');
      }
      
      // Should schedule predictive caching
      cacheService.schedulePredictiveCaching('prices', 'predictive_test');
      
      // Check if pattern was recorded
      const pattern = cacheService.accessPatterns.get('prices_predictive_test');
      expect(pattern.count).toBe(5);
    });

    test('should calculate predictive cache hit rate', () => {
      // Simulate some predictive cache activity
      cacheService.metrics.cacheWarmings = 10;
      cacheService.metrics.predictiveCacheHits = 7;
      
      const hitRate = cacheService.calculatePredictiveCacheHitRate();
      expect(parseFloat(hitRate)).toBe(70);
    });
  });

  describe('Memory Management', () => {
    test('should evict least recently used entries when memory limit exceeded', () => {
      // Fill cache beyond memory limit
      const largeData = 'x'.repeat(1000);
      
      for (let i = 0; i < 100; i++) {
        cacheService.set('test', `item_${i}`, { data: largeData });
      }
      
      // Simulate memory limit exceeded
      cacheService.metrics.memoryUsage = cacheService.cacheConfig.maxMemoryUsage + 1000;
      
      const initialSize = cacheService.memoryCache.size;
      cacheService.evictLeastRecentlyUsed();
      
      expect(cacheService.memoryCache.size).toBeLessThan(initialSize);
    });

    test('should monitor memory usage continuously', () => {
      const testData = { data: 'test' };
      
      cacheService.set('test', 'memory_monitor', testData);
      cacheService.updateMemoryUsage();
      
      expect(cacheService.metrics.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle localStorage quota exceeded gracefully', () => {
      // Mock localStorage quota exceeded error
      localStorageMock.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const testData = { price: 50000 };
      
      // Should not throw error
      expect(() => {
        cacheService.set('test', 'quota_test', testData);
      }).not.toThrow();
    });

    test('should handle compression errors gracefully', () => {
      // Mock compression failure
      const originalCompress = cacheService.compress;
      cacheService.compress = jest.fn(() => {
        throw new Error('Compression failed');
      });

      const testData = { price: 50000 };
      
      // Should fallback to uncompressed storage
      expect(() => {
        cacheService.set('test', 'compression_error', testData);
      }).not.toThrow();
      
      // Restore original method
      cacheService.compress = originalCompress;
    });

    test('should handle corrupted cache entries', () => {
      // Mock corrupted localStorage data
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const result = cacheService.get('test', 'corrupted');
      expect(result).toBeNull();
    });
  });
});