const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, '../../database');
const fs = require('fs');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'coinnova.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database with tables
const initializeDatabase = () => {
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  // Create tables
  const createTables = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Coins table
    CREATE TABLE IF NOT EXISTS coins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        current_price REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Wallets table
    CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        coin_id INTEGER NOT NULL,
        amount REAL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE,
        UNIQUE(user_id, coin_id)
    );

    -- Transactions table
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        coin_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('buy', 'sell')) NOT NULL,
        amount REAL NOT NULL,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE
    );

    -- AI Predictions table (optional)
    CREATE TABLE IF NOT EXISTS ai_predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coin_id INTEGER NOT NULL,
        predicted_price REAL NOT NULL,
        confidence_score REAL DEFAULT 0.5,
        prediction_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE
    );
  `;

  db.exec(createTables, (err) => {
    if (err) {
      console.error('Error creating tables:', err.message);
    } else {
      console.log('✅ Database tables created successfully');
      insertInitialData();
    }
  });
};

// Insert initial coin data
const insertInitialData = () => {
  const coins = [
    ['USD', 'US Dollar', 1.00],
    ['BTC', 'Bitcoin', 45000.00],
    ['ETH', 'Ethereum', 3000.00],
    ['BNB', 'Binance Coin', 300.00],
    ['SOL', 'Solana', 100.00],
    ['ADA', 'Cardano', 0.50],
    ['XRP', 'Ripple', 0.60],
    ['DOT', 'Polkadot', 7.00],
    ['LINK', 'Chainlink', 15.00],
    ['LTC', 'Litecoin', 70.00],
    ['XLM', 'Stellar', 0.12],
    ['DOGE', 'Dogecoin', 0.08],
    ['AVAX', 'Avalanche', 35.00],
    ['MATIC', 'Polygon', 0.90],
    ['UNI', 'Uniswap', 6.50],
    ['ATOM', 'Cosmos', 12.00],
    ['ALGO', 'Algorand', 0.25],
    ['VET', 'VeChain', 0.03],
    ['FIL', 'Filecoin', 5.50],
    ['TRX', 'TRON', 0.10],
    ['ETC', 'Ethereum Classic', 25.00]
  ];

  const insertCoin = db.prepare('INSERT OR IGNORE INTO coins (symbol, name, current_price) VALUES (?, ?, ?)');
  
  coins.forEach(coin => {
    insertCoin.run(coin, (err) => {
      if (err && !err.message.includes('UNIQUE constraint failed')) {
        console.error('Error inserting coin:', err.message);
      }
    });
  });
  
  insertCoin.finalize();
  console.log('✅ Initial coin data inserted (20 cryptocurrencies)');
};

// Promisify database operations
const dbAsync = {
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

module.exports = { db, dbAsync };