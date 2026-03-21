const express = require('express');
const { db, dbAsync } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateTrade, validateQueryParams } = require('../middleware/inputValidation');
const { logTradingActivity } = require('../middleware/securityAudit');

const router = express.Router();

// Buy cryptocurrency
router.post('/buy', authenticateToken, validateTrade, logTradingActivity, async (req, res) => {
  try {
    const { coinSymbol, amount } = req.body;
    const userId = req.user.userId;

    if (!coinSymbol || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid coin symbol or amount' });
    }

    // Get coin info
    const coin = await dbAsync.get(
      'SELECT id, current_price FROM coins WHERE symbol = ?',
      [coinSymbol.toUpperCase()]
    );

    if (!coin) {
      return res.status(404).json({ error: 'Coin not found' });
    }

    const totalCost = amount * coin.current_price;

    // Check USD balance (assuming coin_id = 1 is USD)
    const usdWallet = await dbAsync.get(
      'SELECT amount FROM wallets WHERE user_id = ? AND coin_id = 1',
      [userId]
    );

    if (!usdWallet || usdWallet.amount < totalCost) {
      return res.status(400).json({ error: 'Insufficient USD balance' });
    }

    // Start transaction
    db.serialize(async () => {
      try {
        // Deduct USD
        await dbAsync.run(
          'UPDATE wallets SET amount = amount - ? WHERE user_id = ? AND coin_id = 1',
          [totalCost, userId]
        );

        // Add cryptocurrency to wallet
        const existingWallet = await dbAsync.get(
          'SELECT amount FROM wallets WHERE user_id = ? AND coin_id = ?',
          [userId, coin.id]
        );

        if (existingWallet) {
          await dbAsync.run(
            'UPDATE wallets SET amount = amount + ? WHERE user_id = ? AND coin_id = ?',
            [amount, userId, coin.id]
          );
        } else {
          await dbAsync.run(
            'INSERT INTO wallets (user_id, coin_id, amount) VALUES (?, ?, ?)',
            [userId, coin.id, amount]
          );
        }

        // Record transaction
        await dbAsync.run(
          'INSERT INTO transactions (user_id, coin_id, type, amount, price, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
          [userId, coin.id, 'buy', amount, coin.current_price]
        );

        res.json({
          message: 'Purchase successful',
          transaction: {
            type: 'buy',
            coin: coinSymbol,
            amount,
            price: coin.current_price,
            total: totalCost
          }
        });
      } catch (error) {
        console.error('Buy transaction error:', error);
        res.status(500).json({ error: 'Transaction failed' });
      }
    });

  } catch (error) {
    console.error('Buy transaction error:', error);
    res.status(500).json({ error: 'Transaction failed' });
  }
});

// Sell cryptocurrency
router.post('/sell', authenticateToken, validateTrade, logTradingActivity, async (req, res) => {
  try {
    const { coinSymbol, amount } = req.body;
    const userId = req.user.userId;

    if (!coinSymbol || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid coin symbol or amount' });
    }

    // Get coin info
    const coin = await dbAsync.get(
      'SELECT id, current_price FROM coins WHERE symbol = ?',
      [coinSymbol.toUpperCase()]
    );

    if (!coin) {
      return res.status(404).json({ error: 'Coin not found' });
    }

    const totalValue = amount * coin.current_price;

    // Check coin balance
    const coinWallet = await dbAsync.get(
      'SELECT amount FROM wallets WHERE user_id = ? AND coin_id = ?',
      [userId, coin.id]
    );

    if (!coinWallet || coinWallet.amount < amount) {
      return res.status(400).json({ error: 'Insufficient coin balance' });
    }

    // Start transaction
    db.serialize(async () => {
      try {
        // Deduct cryptocurrency
        await dbAsync.run(
          'UPDATE wallets SET amount = amount - ? WHERE user_id = ? AND coin_id = ?',
          [amount, userId, coin.id]
        );

        // Add USD to wallet
        const usdWallet = await dbAsync.get(
          'SELECT amount FROM wallets WHERE user_id = ? AND coin_id = 1',
          [userId]
        );

        if (usdWallet) {
          await dbAsync.run(
            'UPDATE wallets SET amount = amount + ? WHERE user_id = ? AND coin_id = 1',
            [totalValue, userId]
          );
        } else {
          await dbAsync.run(
            'INSERT INTO wallets (user_id, coin_id, amount) VALUES (?, ?, ?)',
            [userId, 1, totalValue]
          );
        }

        // Record transaction
        await dbAsync.run(
          'INSERT INTO transactions (user_id, coin_id, type, amount, price, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
          [userId, coin.id, 'sell', amount, coin.current_price]
        );

        res.json({
          message: 'Sale successful',
          transaction: {
            type: 'sell',
            coin: coinSymbol,
            amount,
            price: coin.current_price,
            total: totalValue
          }
        });
      } catch (error) {
        console.error('Sell transaction error:', error);
        res.status(500).json({ error: 'Transaction failed' });
      }
    });

  } catch (error) {
    console.error('Sell transaction error:', error);
    res.status(500).json({ error: 'Transaction failed' });
  }
});

// Get transaction history
router.get('/history', authenticateToken, validateQueryParams, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const transactions = await dbAsync.all(`
      SELECT 
        t.id,
        t.type,
        t.amount,
        t.price,
        t.created_at,
        c.symbol,
        c.name,
        (t.amount * t.price) as total_value
      FROM transactions t
      JOIN coins c ON t.coin_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.userId, parseInt(limit), parseInt(offset)]);

    res.json(transactions);
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

module.exports = router;