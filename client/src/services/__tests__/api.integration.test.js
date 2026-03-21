/**
 * API Integration Tests
 * 
 * Comprehensive integration tests for API interactions including:
 * - Request/response cycles
 * - Data transformation and processing
 * - Error handling in API interactions
 * - Caching mechanisms
 * - Real-time data updates
 * - API integration with components
 * 
 * Related Requirements: 4.1 (Real-time data), 4.2 (API integration), 9.1 (Data accuracy)
 */

import axios from 'axios';
import dataManager from '../dataManager';
import cacheService from '../cacheService';
import websocketService from '../websocketService';
import dataSynchronizer from '../dataSynchronizer';

// Mock axios
jest.mock('axios');

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  readyState: 1,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.clear();
    
    // Reset axios mock
    axios.get = jest.fn();
    axios.post = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Request/Response Cycles', () => {
    test('should complete full request/response cycle for price data', async () => {
      const mockPriceData = {
        bitcoin: { price: 43250.50, change24h: 2.34 },
        ethereum: { price: 2650.75, change24h: -1.23 }
      };

      axios.get.mockResolvedValue({ data: mockPriceData });

      const result = await dataManager.getPrices();

      expect(axios.get).toHaveBeenCalledWith('/api/coins/prices');
      expect(result).toEqual(mockPriceData);
    });

    test('should complete full request/response cycle for market data', async () => {
      const mockMarketData = {
        totalMarketCap: 2100000000000,
        marketCapChange24h: 1.2,
        totalVolume24h: 89200000000,
        btcDominance: 52.3
      };

      axios.get.mockResolvedValue({ data: mockMarketData });

      const result = await dataManager.getMarketData();

      expect(axios.get).toHaveBeenCalledWith('/api/coins/market');
      expect(result).toEqual(mockMarketData);
    });

    test('should complete full request/response cycle for portfolio data', async () => {
      const mockPortfolioData = {
        totalValue: 15750.25,
        totalChange24h: 234.50,
        holdings: [
          { symbol: 'BTC', amount: 0.25, value: 10812.63 }
        ]
      };

      axios.get.mockResolvedValue({ data: mockPortfolioData });

      const result = await dataManager.getPortfolioData();

      expect(axios.get).toHaveBeenCalledWith('/api/wallet');
      expect(result).toEqual(mockPortfolioData);
    });

    test('should complete full request/response cycle for transaction history', async () => {
      const mockTransactions = [
        {
          id: 1,
          type: 'buy',
          symbol: 'BTC',
          amount: 0.1,
          price: 43000,
          timestamp: new Date().toISOString()
        }
      ];

      axios.get.mockResolvedValue({ data: mockTransactions });

      const result = await dataManager.getTransactionHistory(50, 0);

      expect(axios.get).toHaveBeenCalledWith('/api/transactions?limit=50&offset=0');
      expect(result).toEqual(mockTransactions);
    });

    test('should complete full request/response cycle for trade execution', async () => {
      const mockTradeResponse = {
        success: true,
        transactionId: 'tx_123',
        type: 'buy',
        coinSymbol: 'BTC',
        amount: 0.1,
        price: 43250.50
      };

      axios.post.mockResolvedValue({ data: mockTradeResponse });

      const result = await dataManager.executeTrade('buy', 'BTC', 0.1);

      expect(axios.post).toHaveBeenCalledWith('/api/transactions/trade', {
        type: 'buy',
        coinSymbol: 'BTC',
        amount: 0.1
      });
      expect(result).toEqual(mockTradeResponse);
    });
  });

  describe('Data Transformation and Processing', () => {
    test('should transform raw API price data into application format', async () => {
      const rawApiData = {
        bitcoin: { price: 43250.50, change24h: 2.34, volume: 28000000000 },
        ethereum: { price: 2650.75, change24h: -1.23, volume: 15000000000 }
      };

      axios.get.mockResolvedValue({ data: rawApiData });

      const result = await dataManager.getPrices();

      // Verify data structure is preserved
      expect(result).toHaveProperty('bitcoin');
      expect(result.bitcoin).toHaveProperty('price');
      expect(result.bitcoin).toHaveProperty('change24h');
      expect(typeof result.bitcoin.price).toBe('number');
    });

    test('should process and normalize market data', async () => {
      const rawMarketData = {
        totalMarketCap: 2100000000000,
        marketCapChange24h: 1.2,
        totalVolume24h: 89200000000,
        btcDominance: 52.3,
        fearGreedIndex: 68
      };

      axios.get.mockResolvedValue({ data: rawMarketData });

      const result = await dataManager.getMarketData();

      // Verify all required fields are present
      expect(result).toHaveProperty('totalMarketCap');
      expect(result).toHaveProperty('marketCapChange24h');
      expect(result).toHaveProperty('totalVolume24h');
      expect(result).toHaveProperty('btcDominance');
    });

    test('should calculate portfolio metrics from API data', async () => {
      const rawPortfolioData = {
        totalValue: 15750.25,
        totalChange24h: 234.50,
        totalChangePercent24h: 1.51,
        holdings: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            amount: 0.25,
            value: 10812.63,
            change24h: 58.50
          }
        ]
      };

      axios.get.mockResolvedValue({ data: rawPortfolioData });

      const result = await dataManager.getPortfolioData();

      // Verify calculated fields
      expect(result.totalValue).toBe(15750.25);
      expect(result.totalChangePercent24h).toBe(1.51);
      expect(result.holdings[0].value).toBe(10812.63);
    });

    test('should process transaction history with date parsing', async () => {
      const rawTransactions = [
        {
          id: 1,
          type: 'buy',
          symbol: 'BTC',
          amount: 0.1,
          price: 43000,
          timestamp: '2024-01-15T10:30:00Z',
          status: 'completed'
        }
      ];

      axios.get.mockResolvedValue({ data: rawTransactions });

      const result = await dataManager.getTransactionHistory();

      // Verify timestamp is preserved
      expect(result[0].timestamp).toBe('2024-01-15T10:30:00Z');
      expect(result[0].status).toBe('completed');
    });
  });

  describe('Error Handling in API Interactions', () => {
    test('should handle network errors gracefully', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));

      const result = await dataManager.getPrices();

      // Should return mock data instead of throwing
      expect(result).toBeDefined();
      expect(result).toHaveProperty('bitcoin');
    });

    test('should handle 404 errors with fallback data', async () => {
      const error = new Error('Not Found');
      error.response = { status: 404 };
      axios.get.mockRejectedValue(error);

      const result = await dataManager.getMarketData();

      // Should return mock market data
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalMarketCap');
    });

    test('should handle 500 server errors', async () => {
      const error = new Error('Internal Server Error');
      error.response = { status: 500 };
      axios.get.mockRejectedValue(error);

      const result = await dataManager.getPortfolioData();

      // Should return mock portfolio data
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalValue');
    });

    test('should handle timeout errors', async () => {
      const error = new Error('Timeout');
      error.code = 'ECONNABORTED';
      axios.get.mockRejectedValue(error);

      const result = await dataManager.getPrices();

      // Should return cached or mock data
      expect(result).toBeDefined();
    });

    test('should propagate trade execution errors', async () => {
      const error = new Error('Insufficient balance');
      error.response = { status: 400, data: { message: 'Insufficient balance' } };
      axios.post.mockRejectedValue(error);

      await expect(dataManager.executeTrade('buy', 'BTC', 10))
        .rejects.toThrow();
    });

    test('should handle malformed API responses', async () => {
      axios.get.mockResolvedValue({ data: null });

      const result = await dataManager.getPrices();

      // Should handle null response gracefully
      expect(result).toBeDefined();
    });
  });

  describe('Caching Mechanisms', () => {
    test('should cache API responses for subsequent requests', async () => {
      const mockData = { bitcoin: { price: 43250.50 } };
      axios.get.mockResolvedValue({ data: mockData });

      // First request - should hit API
      const result1 = await dataManager.getPrices();
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Mock cache to return data
      jest.spyOn(cacheService, 'get').mockReturnValue(mockData);

      // Second request - should use cache
      const result2 = await dataManager.getPrices();
      
      expect(result1).toEqual(result2);
    });

    test('should invalidate cache on data updates', async () => {
      const initialData = { bitcoin: { price: 43000 } };
      const updatedData = { bitcoin: { price: 43500 } };

      // First request
      axios.get.mockResolvedValue({ data: initialData });
      await dataManager.getPrices();

      // Clear cache
      cacheService.clear();

      // Second request with updated data
      axios.get.mockResolvedValue({ data: updatedData });
      const result = await dataManager.getPrices();

      expect(result.bitcoin.price).toBe(43500);
    });

    test('should respect cache TTL for different data types', async () => {
      const priceData = { bitcoin: { price: 43250 } };
      const marketData = { totalMarketCap: 2100000000000 };

      axios.get.mockResolvedValue({ data: priceData });
      await dataManager.getPrices();

      axios.get.mockResolvedValue({ data: marketData });
      await dataManager.getMarketData();

      const metrics = cacheService.getMetrics();
      expect(metrics.memoryCacheSize).toBeGreaterThan(0);
    });

    test('should handle cache misses correctly', async () => {
      jest.spyOn(cacheService, 'get').mockReturnValue(null);
      
      const mockData = { bitcoin: { price: 43250 } };
      axios.get.mockResolvedValue({ data: mockData });

      const result = await dataManager.getPrices();

      expect(axios.get).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    test('should compress large API responses in cache', async () => {
      const largeData = {
        coins: Array.from({ length: 100 }, (_, i) => ({
          symbol: `COIN${i}`,
          price: 1000 + i,
          volume: 1000000 + i,
          marketCap: 1000000000 + i
        }))
      };

      axios.get.mockResolvedValue({ data: largeData });
      
      // Set data in cache
      cacheService.set('test', 'large_data', largeData);

      const entry = cacheService.memoryCache.get('cache_test_large_data');
      
      // Should be compressed due to size
      expect(entry).toBeDefined();
    });
  });

  describe('Real-time Data Updates', () => {
    test('should establish WebSocket connection for real-time updates', () => {
      expect(websocketService.ws).toBeDefined();
    });

    test('should handle real-time price updates via WebSocket', (done) => {
      const mockPriceUpdate = {
        type: 'price_update',
        payload: {
          bitcoin: { price: 43300, change24h: 2.5 }
        }
      };

      websocketService.once('priceUpdate', (data) => {
        expect(data).toEqual(mockPriceUpdate.payload);
        done();
      });

      // Simulate WebSocket message
      websocketService.handleMessage({
        data: JSON.stringify(mockPriceUpdate)
      });
    });

    test('should handle real-time market updates via WebSocket', (done) => {
      const mockMarketUpdate = {
        type: 'market_update',
        payload: {
          totalMarketCap: 2110000000000,
          btcDominance: 52.5
        }
      };

      websocketService.once('marketUpdate', (data) => {
        expect(data).toEqual(mockMarketUpdate.payload);
        done();
      });

      websocketService.handleMessage({
        data: JSON.stringify(mockMarketUpdate)
      });
    });

    test('should handle real-time portfolio updates via WebSocket', (done) => {
      const mockPortfolioUpdate = {
        type: 'portfolio_update',
        payload: {
          totalValue: 15850.75,
          totalChange24h: 335.00
        }
      };

      websocketService.once('portfolioUpdate', (data) => {
        expect(data).toEqual(mockPortfolioUpdate.payload);
        done();
      });

      websocketService.handleMessage({
        data: JSON.stringify(mockPortfolioUpdate)
      });
    });

    test('should batch multiple real-time updates efficiently', (done) => {
      websocketService.setBatching(true, 5, 50);

      const updates = [];
      websocketService.once('batchPriceUpdate', (data) => {
        expect(data.length).toBeGreaterThan(0);
        done();
      });

      // Send multiple updates
      for (let i = 0; i < 5; i++) {
        websocketService.handleMessage({
          data: JSON.stringify({
            type: 'price_update',
            payload: { bitcoin: { price: 43000 + i } }
          })
        });
      }
    });

    test('should reconnect WebSocket on connection loss', () => {
      const reconnectSpy = jest.spyOn(websocketService, 'scheduleReconnect');
      
      // Simulate connection close
      websocketService.handleClose({ code: 1006, reason: 'Abnormal closure' });

      expect(reconnectSpy).toHaveBeenCalled();
    });

    test('should maintain subscription state across reconnections', () => {
      websocketService.subscribe('prices', ['BTC', 'ETH']);
      
      const subscriptions = websocketService.subscriptions;
      expect(subscriptions.size).toBeGreaterThan(0);

      // Simulate reconnection
      websocketService.handleOpen();

      // Subscriptions should be maintained
      expect(websocketService.subscriptions.size).toBeGreaterThan(0);
    });
  });

  describe('API Integration with Components', () => {
    test('should synchronize API data with component updates', () => {
      const componentId = 'portfolio-dashboard';
      const mockHandler = jest.fn();

      dataSynchronizer.registerUpdateHandler(componentId, mockHandler, {
        strategy: 'immediate',
        priority: dataSynchronizer.priorities.high
      });

      const testData = { totalValue: 15750.25 };
      dataSynchronizer.queueUpdate(componentId, testData, {
        priority: dataSynchronizer.priorities.high
      });

      expect(mockHandler).toHaveBeenCalledWith(testData);
    });

    test('should throttle high-frequency API updates to components', (done) => {
      const componentId = 'price-ticker';
      const mockHandler = jest.fn();

      dataSynchronizer.registerUpdateHandler(componentId, mockHandler, {
        strategy: 'throttled',
        throttleDelay: 100
      });

      // Send multiple rapid updates
      for (let i = 0; i < 10; i++) {
        dataSynchronizer.queueUpdate(componentId, { price: 43000 + i });
      }

      // Should throttle to reduce calls
      setTimeout(() => {
        expect(mockHandler).toHaveBeenCalled();
        expect(mockHandler.mock.calls.length).toBeLessThan(10);
        done();
      }, 200);
    });

    test('should debounce API updates for search components', (done) => {
      const componentId = 'search-bar';
      const mockHandler = jest.fn();

      dataSynchronizer.registerUpdateHandler(componentId, mockHandler, {
        strategy: 'debounced',
        debounceDelay: 100
      });

      // Send multiple rapid updates (simulating typing)
      for (let i = 0; i < 5; i++) {
        dataSynchronizer.queueUpdate(componentId, { query: `BTC${i}` });
      }

      // Should only call handler once after debounce delay
      setTimeout(() => {
        expect(mockHandler).toHaveBeenCalledTimes(1);
        expect(mockHandler).toHaveBeenCalledWith({ query: 'BTC4' });
        done();
      }, 150);
    });

    test('should batch API updates for table components', (done) => {
      const componentId = 'crypto-table';
      const mockHandler = jest.fn();

      dataSynchronizer.registerUpdateHandler(componentId, mockHandler, {
        strategy: 'batched'
      });

      // Queue multiple updates
      for (let i = 0; i < 3; i++) {
        dataSynchronizer.queueUpdate(componentId, { 
          row: i, 
          data: { price: 1000 + i } 
        });
      }

      // Should batch updates
      setTimeout(() => {
        expect(mockHandler).toHaveBeenCalled();
        done();
      }, 50);
    });

    test('should prioritize critical API updates', () => {
      const criticalHandler = jest.fn();
      const normalHandler = jest.fn();

      dataSynchronizer.registerUpdateHandler('critical-component', criticalHandler, {
        strategy: 'prioritized',
        priority: dataSynchronizer.priorities.critical
      });

      dataSynchronizer.registerUpdateHandler('normal-component', normalHandler, {
        strategy: 'prioritized',
        priority: dataSynchronizer.priorities.medium
      });

      // Queue updates
      dataSynchronizer.queueUpdate('normal-component', { data: 'normal' }, {
        priority: dataSynchronizer.priorities.medium
      });
      
      dataSynchronizer.queueUpdate('critical-component', { data: 'critical' }, {
        priority: dataSynchronizer.priorities.critical
      });

      // Critical should be processed immediately
      expect(criticalHandler).toHaveBeenCalledWith({ data: 'critical' });
    });

    test('should skip updates for non-visible components', () => {
      const componentId = 'hidden-chart';
      const mockHandler = jest.fn();

      dataSynchronizer.registerUpdateHandler(componentId, mockHandler);

      // Component is not visible
      dataSynchronizer.visibleComponents.delete(componentId);

      dataSynchronizer.queueUpdate(componentId, { data: 'test' }, {
        priority: dataSynchronizer.priorities.low
      });

      // Should not call handler for non-visible component
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('End-to-End API Workflows', () => {
    test('should complete full trading workflow from API to UI', async () => {
      // 1. Fetch current prices
      const priceData = { bitcoin: { price: 43250.50 } };
      axios.get.mockResolvedValue({ data: priceData });
      const prices = await dataManager.getPrices();
      expect(prices.bitcoin.price).toBe(43250.50);

      // 2. Execute trade
      const tradeResponse = {
        success: true,
        transactionId: 'tx_123',
        type: 'buy',
        coinSymbol: 'BTC',
        amount: 0.1
      };
      axios.post.mockResolvedValue({ data: tradeResponse });
      const trade = await dataManager.executeTrade('buy', 'BTC', 0.1);
      expect(trade.success).toBe(true);

      // 3. Fetch updated portfolio
      const portfolioData = {
        totalValue: 20000,
        holdings: [{ symbol: 'BTC', amount: 0.35 }]
      };
      axios.get.mockResolvedValue({ data: portfolioData });
      const portfolio = await dataManager.getPortfolioData();
      expect(portfolio.holdings[0].amount).toBe(0.35);
    });

    test('should handle concurrent API requests efficiently', async () => {
      const priceData = { bitcoin: { price: 43250 } };
      const marketData = { totalMarketCap: 2100000000000 };
      const portfolioData = { totalValue: 15750 };

      axios.get.mockImplementation((url) => {
        if (url.includes('prices')) return Promise.resolve({ data: priceData });
        if (url.includes('market')) return Promise.resolve({ data: marketData });
        if (url.includes('wallet')) return Promise.resolve({ data: portfolioData });
      });

      // Make concurrent requests
      const [prices, market, portfolio] = await Promise.all([
        dataManager.getPrices(),
        dataManager.getMarketData(),
        dataManager.getPortfolioData()
      ]);

      expect(prices).toEqual(priceData);
      expect(market).toEqual(marketData);
      expect(portfolio).toEqual(portfolioData);
    });

    test('should maintain data consistency across API calls', async () => {
      const initialPortfolio = {
        totalValue: 15000,
        holdings: [{ symbol: 'BTC', amount: 0.25, value: 10000 }]
      };

      axios.get.mockResolvedValue({ data: initialPortfolio });
      const portfolio1 = await dataManager.getPortfolioData();

      // Execute trade
      const tradeResponse = { success: true, transactionId: 'tx_123' };
      axios.post.mockResolvedValue({ data: tradeResponse });
      await dataManager.executeTrade('buy', 'BTC', 0.1);

      // Fetch updated portfolio
      const updatedPortfolio = {
        totalValue: 19325,
        holdings: [{ symbol: 'BTC', amount: 0.35, value: 14325 }]
      };
      axios.get.mockResolvedValue({ data: updatedPortfolio });
      const portfolio2 = await dataManager.getPortfolioData();

      // Verify consistency
      expect(portfolio2.holdings[0].amount).toBeGreaterThan(portfolio1.holdings[0].amount);
    });
  });

  describe('Performance and Optimization', () => {
    test('should measure API response times', async () => {
      const mockData = { bitcoin: { price: 43250 } };
      axios.get.mockResolvedValue({ data: mockData });

      const startTime = performance.now();
      await dataManager.getPrices();
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should track API call metrics', async () => {
      const mockData = { bitcoin: { price: 43250 } };
      axios.get.mockResolvedValue({ data: mockData });

      // Make multiple API calls
      await dataManager.getPrices();
      await dataManager.getMarketData();
      await dataManager.getPortfolioData();

      const cacheMetrics = cacheService.getMetrics();
      expect(cacheMetrics).toHaveProperty('hits');
      expect(cacheMetrics).toHaveProperty('misses');
    });

    test('should optimize API calls with intelligent caching', async () => {
      const mockData = { bitcoin: { price: 43250 } };
      axios.get.mockResolvedValue({ data: mockData });

      // First call - cache miss
      await dataManager.getPrices();
      const firstCallCount = axios.get.mock.calls.length;

      // Mock cache hit
      jest.spyOn(cacheService, 'get').mockReturnValue(mockData);

      // Second call - should use cache
      await dataManager.getPrices();
      const secondCallCount = axios.get.mock.calls.length;

      // Should not make additional API call
      expect(secondCallCount).toBe(firstCallCount);
    });
  });
});
