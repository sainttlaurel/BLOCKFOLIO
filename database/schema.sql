-- CoinNova Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS coinnova;
USE coinnova;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Coins table
CREATE TABLE coins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    current_price DECIMAL(20, 8) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_symbol (symbol)
);

-- Wallets table
CREATE TABLE wallets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    coin_id INT NOT NULL,
    amount DECIMAL(20, 8) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_coin (user_id, coin_id),
    INDEX idx_user_id (user_id)
);

-- Transactions table
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    coin_id INT NOT NULL,
    type ENUM('buy', 'sell') NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- AI Predictions table (optional)
CREATE TABLE ai_predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coin_id INT NOT NULL,
    predicted_price DECIMAL(20, 8) NOT NULL,
    confidence_score DECIMAL(5, 4) DEFAULT 0.5000,
    prediction_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE,
    INDEX idx_coin_date (coin_id, prediction_date)
);

-- Insert initial coins
INSERT INTO coins (symbol, name, current_price) VALUES
('USD', 'US Dollar', 1.00),
('BTC', 'Bitcoin', 45000.00),
('ETH', 'Ethereum', 3000.00),
('SOL', 'Solana', 100.00),
('ADA', 'Cardano', 0.50),
('DOT', 'Polkadot', 7.00),
('LINK', 'Chainlink', 15.00),
('LTC', 'Litecoin', 70.00),
('XLM', 'Stellar', 0.12);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, created_at);
CREATE INDEX idx_wallets_user_amount ON wallets(user_id, amount);

-- Create view for portfolio summary
CREATE VIEW portfolio_summary AS
SELECT 
    u.id as user_id,
    u.username,
    SUM(w.amount * c.current_price) as total_value,
    COUNT(DISTINCT w.coin_id) as coin_count
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
LEFT JOIN coins c ON w.coin_id = c.id
WHERE w.amount > 0
GROUP BY u.id, u.username;