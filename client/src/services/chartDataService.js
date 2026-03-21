/**
 * Chart Data Service
 * Provides historical price data and chart utilities for the trading platform
 */

class ChartDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate sample OHLCV data for demonstration
   * In production, this would fetch from a real API
   */
  generateSampleOHLCVData(symbol, timeframe, periods = 100) {
    const cacheKey = `${symbol}-${timeframe}-${periods}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const data = [];
    let basePrice = this.getBasePriceForSymbol(symbol);
    const now = new Date();
    
    // Calculate time interval based on timeframe
    const intervals = {
      '1H': 60 * 60 * 1000,      // 1 hour
      '4H': 4 * 60 * 60 * 1000,  // 4 hours
      '1D': 24 * 60 * 60 * 1000, // 1 day
      '1W': 7 * 24 * 60 * 60 * 1000, // 1 week
      '1M': 30 * 24 * 60 * 60 * 1000 // 1 month (approximate)
    };
    
    const interval = intervals[timeframe] || intervals['1D'];
    
    for (let i = periods - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * interval);
      
      // Generate realistic price movement
      const volatility = this.getVolatilityForSymbol(symbol);
      const trend = this.getTrendForSymbol(symbol, i, periods);
      const randomChange = (Math.random() - 0.5) * volatility + trend;
      
      const open = basePrice;
      const close = basePrice * (1 + randomChange);
      
      // Generate high and low based on intraday volatility
      const intradayVolatility = volatility * 0.5;
      const high = Math.max(open, close) * (1 + Math.random() * intradayVolatility);
      const low = Math.min(open, close) * (1 - Math.random() * intradayVolatility);
      
      // Generate volume with some correlation to price movement
      const baseVolume = this.getBaseVolumeForSymbol(symbol);
      const volumeMultiplier = 1 + Math.abs(randomChange) * 2; // Higher volume on bigger moves
      const volume = baseVolume * volumeMultiplier * (0.5 + Math.random());
      
      data.push({
        x: this.formatTimestamp(timestamp, timeframe),
        timestamp: timestamp,
        o: parseFloat(open.toFixed(2)),
        h: parseFloat(high.toFixed(2)),
        l: parseFloat(low.toFixed(2)),
        c: parseFloat(close.toFixed(2)),
        v: Math.round(volume)
      });
      
      basePrice = close;
    }
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }

  /**
   * Get base price for different symbols
   */
  getBasePriceForSymbol(symbol) {
    const basePrices = {
      'BTC': 45000,
      'ETH': 2800,
      'SOL': 120,
      'ADA': 0.45,
      'DOT': 8.5,
      'LINK': 15.2,
      'LTC': 95,
      'XLM': 0.12
    };
    
    return basePrices[symbol.toUpperCase()] || 100;
  }

  /**
   * Get volatility factor for different symbols
   */
  getVolatilityForSymbol(symbol) {
    const volatilities = {
      'BTC': 0.03,   // 3% daily volatility
      'ETH': 0.04,   // 4% daily volatility
      'SOL': 0.06,   // 6% daily volatility
      'ADA': 0.05,   // 5% daily volatility
      'DOT': 0.05,   // 5% daily volatility
      'LINK': 0.06,  // 6% daily volatility
      'LTC': 0.04,   // 4% daily volatility
      'XLM': 0.07    // 7% daily volatility
    };
    
    return volatilities[symbol.toUpperCase()] || 0.05;
  }

  /**
   * Get base volume for different symbols
   */
  getBaseVolumeForSymbol(symbol) {
    const baseVolumes = {
      'BTC': 1000000000,   // 1B
      'ETH': 800000000,    // 800M
      'SOL': 200000000,    // 200M
      'ADA': 150000000,    // 150M
      'DOT': 100000000,    // 100M
      'LINK': 80000000,    // 80M
      'LTC': 120000000,    // 120M
      'XLM': 60000000      // 60M
    };
    
    return baseVolumes[symbol.toUpperCase()] || 50000000;
  }

  /**
   * Generate trend component for more realistic price movement
   */
  getTrendForSymbol(symbol, index, totalPeriods) {
    // Create different trend patterns for different symbols
    const trendPatterns = {
      'BTC': Math.sin(index / totalPeriods * Math.PI * 2) * 0.001, // Cyclical
      'ETH': (index / totalPeriods - 0.5) * 0.002, // Linear trend
      'SOL': Math.cos(index / totalPeriods * Math.PI * 3) * 0.002, // Higher frequency
      'ADA': 0, // No trend
      'DOT': Math.sin(index / totalPeriods * Math.PI) * 0.001, // Half cycle
      'LINK': (Math.random() - 0.5) * 0.001, // Random walk
      'LTC': Math.sin(index / totalPeriods * Math.PI * 1.5) * 0.0015,
      'XLM': Math.cos(index / totalPeriods * Math.PI * 2.5) * 0.0018
    };
    
    return trendPatterns[symbol.toUpperCase()] || 0;
  }

  /**
   * Format timestamp based on timeframe
   */
  formatTimestamp(timestamp, timeframe) {
    const date = new Date(timestamp);
    
    switch (timeframe) {
      case '1H':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case '4H':
        return date.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit' 
        });
      case '1D':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case '1W':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case '1M':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: '2-digit' 
        });
      default:
        return date.toLocaleDateString();
    }
  }

  /**
   * Get real-time price update (simulated)
   */
  getRealtimeUpdate(symbol, lastPrice) {
    const volatility = this.getVolatilityForSymbol(symbol);
    const change = (Math.random() - 0.5) * volatility * 0.1; // Smaller changes for real-time
    
    return {
      price: lastPrice * (1 + change),
      volume: this.getBaseVolumeForSymbol(symbol) * (0.8 + Math.random() * 0.4),
      timestamp: new Date()
    };
  }

  /**
   * Calculate support and resistance levels
   */
  calculateSupportResistance(data, lookback = 20) {
    if (!data || data.length < lookback * 2) {
      return { support: [], resistance: [] };
    }

    const support = [];
    const resistance = [];

    for (let i = lookback; i < data.length - lookback; i++) {
      const current = data[i];
      let isSupport = true;
      let isResistance = true;

      // Check if current low is a support level
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && data[j].l < current.l) {
          isSupport = false;
          break;
        }
      }

      // Check if current high is a resistance level
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && data[j].h > current.h) {
          isResistance = false;
          break;
        }
      }

      if (isSupport) {
        support.push({
          index: i,
          level: current.l,
          timestamp: current.timestamp
        });
      }

      if (isResistance) {
        resistance.push({
          index: i,
          level: current.h,
          timestamp: current.timestamp
        });
      }
    }

    return { support, resistance };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export default new ChartDataService();