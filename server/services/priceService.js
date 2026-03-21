const axios = require('axios');
const { dbAsync } = require('../config/database');

class PriceService {
  constructor() {
    this.coinGeckoUrl = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
    this.updateInterval = 30000; // 30 seconds
    this.isRunning = false;
    
    // Extended coin list similar to Binance top coins
    this.coinMap = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'binancecoin': 'BNB',
      'solana': 'SOL',
      'cardano': 'ADA',
      'ripple': 'XRP',
      'polkadot': 'DOT',
      'chainlink': 'LINK',
      'litecoin': 'LTC',
      'stellar': 'XLM',
      'dogecoin': 'DOGE',
      'avalanche-2': 'AVAX',
      'polygon': 'MATIC',
      'uniswap': 'UNI',
      'cosmos': 'ATOM',
      'algorand': 'ALGO',
      'vechain': 'VET',
      'filecoin': 'FIL',
      'tron': 'TRX',
      'ethereum-classic': 'ETC'
    };
  }

  async updatePrices() {
    try {
      console.log('🔄 Updating cryptocurrency prices...');
      
      const coinIds = Object.keys(this.coinMap).join(',');
      const response = await axios.get(
        `${this.coinGeckoUrl}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
        { timeout: 15000 }
      );

      const prices = response.data;
      console.log(`📊 Fetched prices for ${Object.keys(prices).length} coins`);

      let updatedCount = 0;
      for (const [coinId, symbol] of Object.entries(this.coinMap)) {
        if (prices[coinId] && prices[coinId].usd) {
          await dbAsync.run(
            'UPDATE coins SET current_price = ? WHERE symbol = ?',
            [prices[coinId].usd, symbol]
          );
          updatedCount++;
        }
      }

      console.log(`✅ Updated ${updatedCount} coin prices in database`);
      return prices;
    } catch (error) {
      console.error('❌ Price update failed:', error.message);
      
      // Fallback: try to get prices from a different endpoint
      try {
        console.log('🔄 Trying fallback price source...');
        const fallbackResponse = await axios.get(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1',
          { timeout: 10000 }
        );
        
        const fallbackPrices = {};
        fallbackResponse.data.forEach(coin => {
          const symbol = this.coinMap[coin.id];
          if (symbol) {
            fallbackPrices[coin.id] = {
              usd: coin.current_price,
              usd_24h_change: coin.price_change_percentage_24h,
              usd_market_cap: coin.market_cap
            };
          }
        });
        
        console.log(`📊 Fallback: Got prices for ${Object.keys(fallbackPrices).length} coins`);
        return fallbackPrices;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError.message);
        return null;
      }
    }
  }

  startPriceUpdates() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Starting price update service...');
    
    // Initial update
    this.updatePrices();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.updatePrices();
    }, this.updateInterval);
  }

  stopPriceUpdates() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      console.log('🛑 Price update service stopped');
    }
  }

  async getLatestPrices() {
    try {
      const coins = await dbAsync.all(
        'SELECT symbol, name, current_price FROM coins WHERE symbol != "USD" ORDER BY symbol'
      );
      return coins;
    } catch (error) {
      console.error('Error fetching latest prices:', error);
      return [];
    }
  }

  // Get live prices directly from API (for immediate display)
  async getLivePrices() {
    try {
      const coinIds = Object.keys(this.coinMap).join(',');
      const response = await axios.get(
        `${this.coinGeckoUrl}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching live prices:', error);
      return {};
    }
  }
}

module.exports = new PriceService();