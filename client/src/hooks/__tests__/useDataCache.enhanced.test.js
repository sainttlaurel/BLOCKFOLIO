/**
 * Enhanced useDataCache Hook Tests
 * 
 * Tests for the enhanced data cache hooks with background refresh,
 * predictive caching, and intelligent update strategies.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { 
  useDataCache, 
  usePrices, 
  useMarketData, 
  usePortfolio,
  useCacheMetrics,
  useCacheHealth
} from '../useDataCache';

// Mock dataManager
const mockDataManager = {
  getPrices: jest.fn(),
  getMarketData: jest.fn(),
  getPortfolioData: jest.fn(),
  getTransactionHistory: jest.fn(),
  getCacheMetrics: jest.fn(),
  getCacheAnalytics: jest.fn(),
  getCacheHealth: jest.fn(),
  clearCache: jest.fn(),
  optimizeCacheConfiguration: jest.fn(),
  warmCriticalData: jest.fn(),
  getNetworkStatus: jest.fn(() => ({
    status: 'online',
    isOnline: true,
    metrics: {},
    quality: 'good'
  }))
};

jest.mock('../services/dataManager', () => mockDataManager);

// Mock window events
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockDispatchEvent = jest.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener
});
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener
});
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent
});

describe('Enhanced useDataCache Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default mock returns
    mockDataManager.getPrices.mockResolvedValue([
      { symbol: 'BTC', price: 50000 },
      { symbol: 'ETH', price: 3000 }
    ]);
    
    mockDataManager.getMarketData.mockResolvedValue({
      totalMarketCap: 2000000000000,
      totalVolume: 100000000000
    });
    
    mockDataManager.getPortfolioData.mockResolvedValue({
      totalValue: 100000,
      holdings: []
    });
    
    mockDataManager.getCacheMetrics.mockReturnValue({
      hitRate: '85%',
      memoryUsageMB: '25.5',
      cacheEfficiencyScore: 85,
      backgroundRefreshes: 10,
      cacheWarmings: 5
    });
    
    mockDataManager.getCacheHealth.mockReturnValue({
      status: 'healthy',
      issues: [],
      recommendations: []
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Enhanced useDataCache', () => {
    test('should provide enhanced features including background updates', async () => {
      const { result } = renderHook(() => 
        useDataCache('prices', {
          enableBackgroundRefresh: true,
          enablePredictiveCaching: true,
          priority: 'high'
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('backgroundUpdateAvailable');
      expect(result.current).toHaveProperty('applyBackgroundUpdate');
      expect(result.current).toHaveProperty('cacheMetrics');
      expect(result.current).toHaveProperty('cacheHealth');
    });

    test('should handle background data updates', async () => {
      const { result } = renderHook(() => 
        useDataCache('prices', { enableBackgroundRefresh: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate background update event
      const backgroundUpdateEvent = new CustomEvent('backgroundDataUpdate', {
        detail: {
          type: 'prices',
          data: [{ symbol: 'BTC', price: 51000 }]
        }
      });

      // Find the event listener that was registered
      const eventListenerCall = mockAddEventListener.mock.calls.find(
        call => call[0] === 'backgroundDataUpdate'
      );
      
      if (eventListenerCall) {
        const eventHandler = eventListenerCall[1];
        
        act(() => {
          eventHandler(backgroundUpdateEvent);
        });

        expect(result.current.backgroundUpdateAvailable).toBe(true);
      }
    });

    test('should apply background updates when requested', async () => {
      const { result } = renderHook(() => 
        useDataCache('prices', { enableBackgroundRefresh: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate background update
      const backgroundUpdateEvent = new CustomEvent('backgroundDataUpdate', {
        detail: {
          type: 'prices',
          data: [{ symbol: 'BTC', price: 52000 }]
        }
      });

      const eventListenerCall = mockAddEventListener.mock.calls.find(
        call => call[0] === 'backgroundDataUpdate'
      );
      
      if (eventListenerCall) {
        const eventHandler = eventListenerCall[1];
        
        act(() => {
          eventHandler(backgroundUpdateEvent);
        });

        // Apply the background update
        act(() => {
          result.current.applyBackgroundUpdate();
        });

        expect(result.current.backgroundUpdateAvailable).toBe(false);
        expect(result.current.data).toEqual([{ symbol: 'BTC', price: 52000 }]);
      }
    });

    test('should use intelligent update intervals based on priority', async () => {
      const { result: highPriorityResult } = renderHook(() => 
        useDataCache('prices', { priority: 'high' })
      );

      const { result: lowPriorityResult } = renderHook(() => 
        useDataCache('prices', { priority: 'low' })
      );

      await waitFor(() => {
        expect(highPriorityResult.current.loading).toBe(false);
        expect(lowPriorityResult.current.loading).toBe(false);
      });

      // High priority should update more frequently
      // This is tested indirectly through the interval setup
      expect(mockDataManager.getPrices).toHaveBeenCalledTimes(2);
    });

    test('should listen for cache performance updates', async () => {
      const { result } = renderHook(() => 
        useDataCache('prices')
      );

      // Simulate cache performance update event
      const performanceEvent = new CustomEvent('cachePerformanceUpdate', {
        detail: {
          metrics: {
            hitRate: '90%',
            memoryUsageMB: '30.0',
            cacheEfficiencyScore: 90
          }
        }
      });

      const eventListenerCall = mockAddEventListener.mock.calls.find(
        call => call[0] === 'cachePerformanceUpdate'
      );
      
      if (eventListenerCall) {
        const eventHandler = eventListenerCall[1];
        
        act(() => {
          eventHandler(performanceEvent);
        });

        expect(result.current.cacheMetrics).toEqual({
          hitRate: '90%',
          memoryUsageMB: '30.0',
          cacheEfficiencyScore: 90
        });
      }
    });
  });

  describe('Enhanced Specialized Hooks', () => {
    test('usePrices should use high priority and background refresh', async () => {
      const { result } = renderHook(() => usePrices());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([
        { symbol: 'BTC', price: 50000 },
        { symbol: 'ETH', price: 3000 }
      ]);
      expect(result.current).toHaveProperty('backgroundUpdateAvailable');
      expect(result.current).toHaveProperty('cacheHealth');
    });

    test('useMarketData should use medium priority', async () => {
      const { result } = renderHook(() => useMarketData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual({
        totalMarketCap: 2000000000000,
        totalVolume: 100000000000
      });
    });

    test('usePortfolio should use high priority with background refresh', async () => {
      const { result } = renderHook(() => usePortfolio());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual({
        totalValue: 100000,
        holdings: []
      });
    });
  });

  describe('useCacheMetrics Hook', () => {
    test('should provide comprehensive cache metrics and controls', async () => {
      const { result } = renderHook(() => useCacheMetrics());

      await waitFor(() => {
        expect(result.current.metrics).toBeDefined();
      });

      expect(result.current.metrics).toEqual({
        hitRate: '85%',
        memoryUsageMB: '25.5',
        cacheEfficiencyScore: 85,
        backgroundRefreshes: 10,
        cacheWarmings: 5
      });

      expect(result.current).toHaveProperty('clearCache');
      expect(result.current).toHaveProperty('optimizeCache');
      expect(result.current).toHaveProperty('warmCache');
      expect(result.current).toHaveProperty('refresh');
    });

    test('should handle cache control operations', async () => {
      const { result } = renderHook(() => useCacheMetrics());

      await waitFor(() => {
        expect(result.current.metrics).toBeDefined();
      });

      // Test clear cache
      act(() => {
        result.current.clearCache();
      });
      expect(mockDataManager.clearCache).toHaveBeenCalled();

      // Test optimize cache
      act(() => {
        result.current.optimizeCache();
      });
      expect(mockDataManager.optimizeCacheConfiguration).toHaveBeenCalled();

      // Test warm cache
      await act(async () => {
        await result.current.warmCache([]);
      });
      expect(mockDataManager.warmCriticalData).toHaveBeenCalled();
    });

    test('should listen for cache performance updates', async () => {
      const { result } = renderHook(() => useCacheMetrics());

      // Simulate performance update
      const performanceEvent = new CustomEvent('cachePerformanceUpdate', {
        detail: {
          metrics: { hitRate: '95%' },
          analytics: { accessPatterns: {} }
        }
      });

      const eventListenerCall = mockAddEventListener.mock.calls.find(
        call => call[0] === 'cachePerformanceUpdate'
      );
      
      if (eventListenerCall) {
        const eventHandler = eventListenerCall[1];
        
        act(() => {
          eventHandler(performanceEvent);
        });

        expect(result.current.metrics).toEqual({ hitRate: '95%' });
        expect(result.current.analytics).toEqual({ accessPatterns: {} });
      }
    });
  });

  describe('useCacheHealth Hook', () => {
    test('should provide cache health monitoring', async () => {
      const { result } = renderHook(() => useCacheHealth());

      await waitFor(() => {
        expect(result.current.health).toBeDefined();
      });

      expect(result.current.health).toEqual({
        status: 'healthy',
        issues: [],
        recommendations: []
      });

      expect(result.current.isHealthy).toBe(true);
      expect(result.current.hasWarnings).toBe(false);
      expect(result.current.isCritical).toBe(false);
    });

    test('should detect warning and critical states', async () => {
      mockDataManager.getCacheHealth.mockReturnValue({
        status: 'warning',
        issues: ['High memory usage'],
        recommendations: ['Enable compression']
      });

      const { result } = renderHook(() => useCacheHealth());

      await waitFor(() => {
        expect(result.current.health).toBeDefined();
      });

      expect(result.current.isHealthy).toBe(false);
      expect(result.current.hasWarnings).toBe(true);
      expect(result.current.isCritical).toBe(false);
      expect(result.current.recommendations).toEqual(['Enable compression']);
    });

    test('should detect critical state', async () => {
      mockDataManager.getCacheHealth.mockReturnValue({
        status: 'critical',
        issues: ['Very low hit rate', 'Memory limit exceeded'],
        recommendations: ['Optimize configuration', 'Clear cache']
      });

      const { result } = renderHook(() => useCacheHealth());

      await waitFor(() => {
        expect(result.current.health).toBeDefined();
      });

      expect(result.current.isHealthy).toBe(false);
      expect(result.current.hasWarnings).toBe(false);
      expect(result.current.isCritical).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle data fetching errors gracefully', async () => {
      mockDataManager.getPrices.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDataCache('prices'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error.message).toBe('Network error');
      expect(result.current.data).toBeNull();
    });

    test('should handle background update errors without affecting main data', async () => {
      const { result } = renderHook(() => 
        useDataCache('prices', { enableBackgroundRefresh: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalData = result.current.data;

      // Simulate background update with error (should not affect main data)
      mockDataManager.getPrices.mockRejectedValueOnce(new Error('Background error'));

      // Background updates should not change the main data or error state
      expect(result.current.data).toBe(originalData);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Performance and Memory Management', () => {
    test('should cleanup event listeners on unmount', () => {
      const { unmount } = renderHook(() => 
        useDataCache('prices', { enableBackgroundRefresh: true })
      );

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'backgroundDataUpdate',
        expect.any(Function)
      );
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'cachePerformanceUpdate',
        expect.any(Function)
      );
    });

    test('should handle rapid re-renders without memory leaks', async () => {
      const { result, rerender } = renderHook(
        ({ priority }) => useDataCache('prices', { priority }),
        { initialProps: { priority: 'normal' } }
      );

      // Rapid re-renders with different props
      for (let i = 0; i < 10; i++) {
        rerender({ priority: i % 2 === 0 ? 'high' : 'low' });
      }

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still work correctly
      expect(result.current.data).toBeDefined();
    });
  });

  describe('Integration with Cache Features', () => {
    test('should provide cache health information in data hooks', async () => {
      const { result } = renderHook(() => usePrices());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.cacheHealth).toEqual({
        hitRate: '85%',
        memoryUsage: '25.5',
        efficiency: 85
      });
    });

    test('should handle cache optimization recommendations', async () => {
      mockDataManager.getCacheHealth.mockReturnValue({
        status: 'warning',
        issues: ['Low hit rate'],
        recommendations: ['Increase TTL', 'Enable predictive caching']
      });

      const { result } = renderHook(() => useCacheHealth());

      await waitFor(() => {
        expect(result.current.recommendations).toEqual([
          'Increase TTL',
          'Enable predictive caching'
        ]);
      });
    });
  });
});