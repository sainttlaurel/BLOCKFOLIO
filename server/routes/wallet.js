const express = require('express');
const { dbAsync } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateQueryParams } = require('../middleware/inputValidation');
const { logDataAccess } = require('../middleware/securityAudit');

const router = express.Router();

// Get user wallet
router.get('/', authenticateToken, logDataAccess, async (req, res) => {
  try {
    // Get all wallet holdings
    const walletData = await dbAsync.all(`
      SELECT 
        w.amount,
        c.symbol,
        c.name,
        c.current_price,
        (w.amount * c.current_price) as value
      FROM wallets w
      JOIN coins c ON w.coin_id = c.id
      WHERE w.user_id = ? AND w.amount > 0
      ORDER BY value DESC
    `, [req.user.userId]);

    // Get USD balance (coin_id = 1 is USD)
    const usdWallet = await dbAsync.get(`
      SELECT amount FROM wallets 
      WHERE user_id = ? AND coin_id = 1
    `, [req.user.userId]);

    const usdBalance = parseFloat(usdWallet?.amount) || 10000; // Default starting balance

    // Calculate total portfolio value (USD + crypto holdings)
    const cryptoValue = walletData.reduce((sum, coin) => sum + parseFloat(coin.value || 0), 0);
    const totalValue = usdBalance + cryptoValue;

    // Format holdings data
    const holdings = walletData.map(holding => ({
      symbol: holding.symbol,
      name: holding.name,
      amount: parseFloat(holding.amount),
      current_price: parseFloat(holding.current_price),
      value: parseFloat(holding.value)
    }));

    res.json({
      usd_balance: usdBalance,
      portfolio_value: totalValue,
      holdings_count: holdings.length,
      totalValue: totalValue.toFixed(2),
      holdings: holdings
    });
  } catch (error) {
    console.error('Wallet fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch wallet',
      usd_balance: 10000,
      portfolio_value: 10000,
      holdings_count: 0,
      totalValue: '10000.00',
      holdings: []
    });
  }
});

// Get wallet history for charts
router.get('/history', authenticateToken, validateQueryParams, logDataAccess, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Get transaction history to calculate portfolio value over time
    const transactions = await dbAsync.all(`
      SELECT 
        DATE(t.created_at) as date,
        SUM(CASE WHEN t.type = 'buy' THEN t.amount * t.price ELSE -t.amount * t.price END) as daily_change
      FROM transactions t
      WHERE t.user_id = ? AND t.created_at >= date('now', '-' || ? || ' days')
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `, [req.user.userId, days]);

    // Calculate cumulative portfolio value
    let cumulativeValue = 10000; // Starting balance
    const portfolioHistory = transactions.map(day => {
      cumulativeValue += parseFloat(day.daily_change);
      return {
        date: day.date,
        value: cumulativeValue.toFixed(2)
      };
    });

    res.json(portfolioHistory);
  } catch (error) {
    console.error('Wallet history error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet history' });
  }
});

module.exports = router;