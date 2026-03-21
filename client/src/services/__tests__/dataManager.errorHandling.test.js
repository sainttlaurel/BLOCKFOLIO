/**
 * Data Manager Error Handling Tests
 * 
 * Tests error handling scenarios for the data manager service including:
 * - Network failures and timeouts
 * - Invalid API responses
 * - Malformed data handling
 * - Graceful degradation with fallback data
 * - Error recovery mechanisms
 */

import axios from 'axios';
import dataManager from '../dataManager';

// Mock axios
jest.mock('axios');

describe('DataManager Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dataManager.clearCache();
  });

  describe('Network Error Handling', () => {
    test('should handle network timeout errors gracefully', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      axios.get.mockRejectedValue(timeoutError);

      const result = await dataManager.getPrices();

      expect(result).toBeDefined();
      expect(result.bitcoin).toBeDefined();
      expect(result.bitcoin.price).toBeGreaterThan(0);
    });

    test('should handle connection refused errors', async () => {
      const connectionError = new Error('connect ECONNREFUSED');
      connectionError.code = 'ECONNREFUSED';
      axios.get.mockRejectedValue(connectionError);

      const result = await dataManager.getMarketData();

      expect(result).toBeDefined();
      expect(result.totalMarketCap).toBeGreaterThan(0);
    });

    test('should handle DNS resolution failures', async () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND');
      dnsError.code = 'ENOTFOUND';
      axios.get.mockRejectedValue(dnsError);

      const result = await dataManager.getPortfolioData();

      expect(result).toBeDefined();
      expect(result.holdings).toBeInstanceOf(Array);
    });

    test('should handle network disconnection', async () => {
      const networkError = new Error('Network Error');
      axios.get.mockRejectedValue(networkError);

      const result = await dataManager.getPrices();

      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });
  });

  describe('API Error Response Handling', () => {
    test('should handle 500 Internal Server Error', async () => {
      const serverError = new Error('Internal Server Error');
      serverError.response = { status: 500, data: { error: 'Server error' } };
      axios.get.mockRejectedValue(serverError);

      const result = await dataManager.getMarketData();

      expect(result).toBeDefined();
      expect(result.totalMarketCap).toBeDefined();
    });

    test('should handle 503 Service Unavailable', async () => {
      const serviceError = new Error('Service Unavailable');
      serviceError.response = { status: 503 };
      axios.get.mockRejectedValue(serviceError);

      const result = await dataManager.getPrices();

      expect(result).toBeDefined();
    });

    test('should handle 429 Rate Limit Exceeded', async () => {
      const rateLimitError = new Error('Too Many Requests');
      rateLimitError.response = { 
        status: 429, 
        headers: { 'retry-after': '60' } 
      };
      axios.get.mockRejectedValue(rateLimitError);

      const result = await dataManager.getMarketData();

      expect(result).toBeDefined();
    });

    test('should handle 404 Not Found', async () => {
      const notFoundError = new Error('Not Found');
      notFoundError.response = { status: 404 };
      axios.get.mockRejectedValue(notFoundError);

      const result = await dataManager.getPortfolioData();

      expect(result).toBeDefined();
    });

    test('should handle 401 Unauthorized', async () => {
      const authError = new Error('Unauthorized');
      authError.response = { status: 401 };
      axios.get.mockRejectedValue(authError);

      const result = await dataManager.getPortfolioData();

      expect(result).toBeDefined();
    });
  });

  describe('Invalid Data Handling', () => {
    test('should handle null response data', async () => {
      axios.get.mockResolvedValue({ data: null });

      const result = await dataManager.getPrices();

      expect(result).toBeNull();
    });

    test('should handle undefined response data', async () => {
      axios.get.mockResolvedValue({ data: undefined });

      const result = await dataManager.getMarketData();

      expect(result).toBeUndefined();
    });

    test('should handle empty response data', async () => {
      axios.get.mockResolvedValue({ data: {} });

      const result = await dataManager.getPrices();

      expect(result).toEqual({});
    });

    test('should handle malformed JSON response', async () => {
      const parseError = new Error('Unexpected token in JSON');
      parseError.name = 'SyntaxError';
      axios.get.mockRejectedValue(parseError);

      const result = await dataManager.getMarketData();

      expect(result).toBeDefined();
    });
  });

  describe('Trading Error Handling', () => {
    test('should throw error for insufficient balance', async () => {
      const balanceError = new Error('Insufficient balance');
      balanceError.response = { 
        status: 400, 
        data: { error: 'INSUFFICIENT_BALANCE' } 
      };
      axios.post.mockRejectedValue(balanceError);

      await expect(
        dataManager.executeTrade('buy', 'BTC', 10)
      ).rejects.toThrow('Insufficient balance');
    });

    test('should throw error for invalid trade amount', async () => {
      const validationError = new Error('Invalid amount');
      validationError.response = { 
        status: 400, 
        data: { error: 'INVALID_AMOUNT' } 
      };
      axios.post.mockRejectedValue(validationError);

      await expect(
        dataManager.executeTrade('buy', 'BTC', -1)
      ).rejects.toThrow('Invalid amount');
    });

    test('should throw error for unsupported cryptocurrency', async () => {
      const symbolError = new Error('Unsupported symbol');
      symbolError.response = { 
        status: 400, 
        data: { error: 'INVALID_SYMBOL' } 
      };
      axios.post.mockRejectedValue(symbolError);

      await expect(
        dataManager.executeTrade('buy', 'INVALID', 1)
      ).rejects.toThrow('Unsupported symbol');
    });

    test('should throw error for market closed', async () => {
      const marketError = new Error('Market closed');
      marketError.response = { 
        status: 400, 
        data: { error: 'MARKET_CLOSED' } 
      };
      axios.post.mockRejectedValue(marketError);

      await expect(
        dataManager.executeTrade('buy', 'BTC', 1)
      ).rejects.toThrow('Market closed');
    });
  });

  describe('Edge Cases', () => {
    test('should handle extremely large numbers in price data', async () => {
      axios.get.mockResolvedValue({
        data: {
          bitcoin: { price: Number.MAX_SAFE_INTEGER, change24h: 0 }
        }
      });

      const result = await dataManager.getPrices();

      expect(result.bitcoin.price).toBe(Number.MAX_SAFE_INTEGER);
    });

    test('should handle zero values in market data', async () => {
      axios.get.mockResolvedValue({
        data: {
          totalMarketCap: 0,
          totalVolume24h: 0,
          btcDominance: 0
        }
      });

      const result = await dataManager.getMarketData();

      expect(result.totalMarketCap).toBe(0);
      expect(result.totalVolume24h).toBe(0);
    });

    test('should handle negative percentage changes', async () => {
      axios.get.mockResolvedValue({
        data: {
          bitcoin: { price: 40000, change24h: -15.5 }
        }
      });

      const result = await dataManager.getPrices();

      expect(result.bitcoin.change24h).toBe(-15.5);
    });

    test('should handle very small decimal values', async () => {
      axios.get.mockResolvedValue({
        data: {
          shiba: { price: 0.00000001, change24h: 0.01 }
        }
      });

      const result = await dataManager.getPrices();

      expect(result.shiba.price).toBe(0.00000001);
    });

    test('should handle empty holdings array', async () => {
      axios.get.mockResolvedValue({
        data: {
          totalValue: 0,
          holdings: []
        }
      });

      const result = await dataManager.getPortfolioData();

      expect(result.holdings).toEqual([]);
      expect(result.totalValue).toBe(0);
    });

    test('should handle missing optional fields', async () => {
      axios.get.mockResolvedValue({
        data: {
          bitcoin: { price: 43000 } // missing change24h
        }
      });

      const result = await dataManager.getPrices();

      expect(result.bitcoin.price).toBe(43000);
      expect(result.bitcoin.change24h).toBeUndefined();
    });
  });

  describe('Concurrent Request Handling', () => {
    test('should handle multiple simultaneous failed requests', async () => {
      const networkError = new Error('Network Error');
      axios.get.mockRejectedValue(networkError);

      const promises = [
        dataManager.getPrices(),
        dataManager.getMarketData(),
        dataManager.getPortfolioData()
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    test('should handle mixed success and failure requests', async () => {
      axios.get
        .mockResolvedValueOnce({ data: { bitcoin: { price: 43000 } } })
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ data: { totalValue: 10000 } });

      const results = await Promise.all([
        dataManager.getPrices(),
        dataManager.getMarketData(),
        dataManager.getPortfolioData()
      ]);

      expect(results[0].bitcoin.price).toBe(43000);
      expect(results[1]).toBeDefined(); // Should use fallback
      expect(results[2].totalValue).toBe(10000);
    });
  });

  describe('Network Status Handling', () => {
    test('should detect offline status', () => {
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const status = dataManager.getNetworkStatus();

      expect(status.isOnline).toBe(false);
    });

    test('should detect online status', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      const status = dataManager.getNetworkStatus();

      expect(status.isOnline).toBe(true);
    });
  });

  describe('Fallback Data Quality', () => {
    test('should provide valid mock prices on error', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));

      const result = await dataManager.getPrices();

      expect(result).toBeDefined();
      expect(result.bitcoin).toBeDefined();
      expect(result.bitcoin.price).toBeGreaterThan(0);
      expect(typeof result.bitcoin.change24h).toBe('number');
    });

    test('should provide valid mock market data on error', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));

      const result = await dataManager.getMarketData();

      expect(result.totalMarketCap).toBeGreaterThan(0);
      expect(result.totalVolume24h).toBeGreaterThan(0);
      expect(result.btcDominance).toBeGreaterThan(0);
      expect(result.btcDominance).toBeLessThanOrEqual(100);
    });

    test('should provide valid mock portfolio data on error', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));

      const result = await dataManager.getPortfolioData();

      expect(result.totalValue).toBeGreaterThan(0);
      expect(result.holdings).toBeInstanceOf(Array);
      expect(result.holdings.length).toBeGreaterThan(0);
      
      result.holdings.forEach(holding => {
        expect(holding.symbol).toBeDefined();
        expect(holding.amount).toBeGreaterThan(0);
        expect(holding.value).toBeGreaterThan(0);
      });
    });
  });
});
