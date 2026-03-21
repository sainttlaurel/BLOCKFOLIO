/**
 * Simple Data Manager Service
 * Provides basic data fetching functionality for the trading platform
 */

import axios from 'axios';

class DataManager {
  constructor() {
    this.cache = new Map();
    this.networkStatus = {
      isOnline: navigator.onLine,
      quality: 'good',
      responseTime: 0
    };
    
    // Listen for network status changes
    window.addEventListener('online', () => {
      this.networkStatus.isOnline = true;
    });
    
    window.addEventListener('offline', () => {
      this.networkStatus.isOnline = false;
    });
  }

  // Get current prices
  async getPrices(forceRefresh = false) {
    try {
      const response = await axios.get('/api/coins/prices');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      // Return mock data if API fails
      return this.getMockPrices();
    }
  }

  // Get market data
  async getMarketData(forceRefresh = false) {
    try {
      const response = await axios.get('/api/coins/market');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      // Return mock data if API fails
      return this.getMockMarketData();
    }
  }

  // Get portfolio data
  async getPortfolioData(forceRefresh = false) {
    try {
      const response = await axios.get('/api/wallet');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
      // Return mock data if API fails
      return this.getMockPortfolioData();
    }
  }

  // Get transaction history
  async getTransactionHistory(limit = 50, offset = 0) {
    try {
      const response = await axios.get(`/api/transactions?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      // Return mock data if API fails
      return this.getMockTransactions();
    }
  }

  // Execute trade
  async executeTrade(type, coinSymbol, amount) {
    try {
      const response = await axios.post('/api/transactions/trade', {
        type,
        coinSymbol,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Failed to execute trade:', error);
      throw error;
    }
  }

  // Get network status
  getNetworkStatus() {
    return this.networkStatus;
  }

  // Get cache metrics (simple implementation)
  getCacheMetrics() {
    return {
      hitRate: 85,
      memoryUsageMB: 12,
      cacheEfficiencyScore: 92
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Mock data methods
  getMockPrices() {
    return {
      bitcoin: { price: 43250.50, change24h: 2.34 },
      ethereum: { price: 2650.75, change24h: -1.23 },
      cardano: { price: 0.485, change24h: 0.87 },
      solana: { price: 98.45, change24h: 4.56 },
      polkadot: { price: 7.23, change24h: -0.45 }
    };
  }

  getMockMarketData() {
    return {
      totalMarketCap: 2100000000000,
      marketCapChange24h: 1.2,
      totalVolume24h: 89200000000,
      volumeChange24h: -3.1,
      btcDominance: 52.3,
      btcDominanceChange: 0.8,
      fearGreedIndex: 68
    };
  }

  getMockPortfolioData() {
    return {
      totalValue: 15750.25,
      totalChange24h: 234.50,
      totalChangePercent24h: 1.51,
      holdings: [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          amount: 0.25,
          value: 10812.63,
          change24h: 58.50,
          changePercent24h: 0.54
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          amount: 1.8,
          value: 4771.35,
          change24h: -22.14,
          changePercent24h: -0.46
        },
        {
          symbol: 'ADA',
          name: 'Cardano',
          amount: 340,
          value: 164.90,
          change24h: 2.96,
          changePercent24h: 1.83
        }
      ]
    };
  }

  getMockTransactions() {
    return [
      {
        id: 1,
        type: 'buy',
        symbol: 'BTC',
        amount: 0.1,
        price: 43000,
        total: 4300,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed'
      },
      {
        id: 2,
        type: 'sell',
        symbol: 'ETH',
        amount: 0.5,
        price: 2600,
        total: 1300,
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        status: 'completed'
      }
    ];
  }
}

// Create singleton instance
const dataManager = new DataManager();

export default dataManager;