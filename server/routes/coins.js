const express = require('express');
const axios = require('axios');
const { dbAsync } = require('../config/database');
const priceService = require('../services/priceService');

const router = express.Router();

// Get real-time coin prices from CoinGecko
router.get('/prices', async (req, res) => {
  try {
    // Try to get live prices first
    const livePrices = await priceService.getLivePrices();
    
    if (Object.keys(livePrices).length > 0) {
      res.json(livePrices);
    } else {
      // Fallback to database prices
      const coins = await dbAsync.all(
        'SELECT symbol, name, current_price FROM coins WHERE symbol != "USD" ORDER BY symbol'
      );
      
      // Convert to CoinGecko format
      const fallbackPrices = {};
      const coinIdMap = {
        'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana',
        'ADA': 'cardano', 'XRP': 'ripple', 'DOT': 'polkadot', 'LINK': 'chainlink',
        'LTC': 'litecoin', 'XLM': 'stellar', 'DOGE': 'dogecoin', 'AVAX': 'avalanche-2',
        'MATIC': 'polygon', 'UNI': 'uniswap', 'ATOM': 'cosmos', 'ALGO': 'algorand',
        'VET': 'vechain', 'FIL': 'filecoin', 'TRX': 'tron', 'ETC': 'ethereum-classic'
      };
      
      coins.forEach(coin => {
        const coinId = coinIdMap[coin.symbol];
        if (coinId) {
          fallbackPrices[coinId] = {
            usd: coin.current_price,
            usd_24h_change: 0 // Default to 0 if no live data
          };
        }
      });
      
      res.json(fallbackPrices);
    }
  } catch (error) {
    console.error('Price fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Get all supported coins
router.get('/', async (req, res) => {
  try {
    const coins = await dbAsync.all(
      'SELECT id, symbol, name, current_price FROM coins ORDER BY symbol'
    );
    res.json(coins);
  } catch (error) {
    console.error('Get coins error:', error);
    res.status(500).json({ error: 'Failed to get coins' });
  }
});

// Get coin by symbol
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const coin = await dbAsync.get(
      'SELECT * FROM coins WHERE symbol = ?',
      [symbol.toUpperCase()]
    );

    if (!coin) {
      return res.status(404).json({ error: 'Coin not found' });
    }

    res.json(coin);
  } catch (error) {
    console.error('Get coin error:', error);
    res.status(500).json({ error: 'Failed to get coin' });
  }
});

// Get market data
router.get('/market/data', async (req, res) => {
  try {
    const coins = await priceService.getLatestPrices();
    res.json(coins);
  } catch (error) {
    console.error('Market data error:', error);
    res.status(500).json({ error: 'Failed to get market data' });
  }
});

// Debug endpoint to test price fetching
router.get('/debug/prices', async (req, res) => {
  try {
    console.log('🔍 Debug: Testing price fetch...');
    const livePrices = await priceService.getLivePrices();
    const dbCoins = await priceService.getLatestPrices();
    
    res.json({
      status: 'debug',
      livePricesCount: Object.keys(livePrices).length,
      livePrices: livePrices,
      dbCoinsCount: dbCoins.length,
      dbCoins: dbCoins,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

module.exports = router;