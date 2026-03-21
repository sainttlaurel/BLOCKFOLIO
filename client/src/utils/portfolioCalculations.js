/**
 * Portfolio Calculation Utilities
 * 
 * This module provides financial calculation functions for portfolio management,
 * including portfolio value, profit/loss, allocation percentages, and trading costs.
 */

/**
 * Calculate total portfolio value from holdings
 * @param {Array} holdings - Array of holding objects with value property
 * @returns {number} Total portfolio value
 */
export const calculatePortfolioValue = (holdings = []) => {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return 0;
  }

  return holdings.reduce((sum, holding) => {
    const value = parseFloat(holding.value || 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
};

/**
 * Calculate profit/loss for a single holding
 * @param {Object} holding - Holding object with amount, currentPrice, and purchasePrice
 * @returns {Object} Object with profitLoss amount and percentage
 */
export const calculateProfitLoss = (holding) => {
  if (!holding || typeof holding !== 'object') {
    return { profitLoss: 0, profitLossPercent: 0 };
  }

  const amount = parseFloat(holding.amount || 0);
  const currentPrice = parseFloat(holding.currentPrice || 0);
  const purchasePrice = parseFloat(holding.purchasePrice || currentPrice);

  if (isNaN(amount) || isNaN(currentPrice) || isNaN(purchasePrice)) {
    return { profitLoss: 0, profitLossPercent: 0 };
  }

  const currentValue = amount * currentPrice;
  const purchaseValue = amount * purchasePrice;
  const profitLoss = currentValue - purchaseValue;
  const profitLossPercent = purchaseValue > 0 ? (profitLoss / purchaseValue) * 100 : 0;

  return {
    profitLoss,
    profitLossPercent
  };
};

/**
 * Calculate allocation percentage for each holding
 * @param {Array} holdings - Array of holding objects with value property
 * @param {number} totalPortfolioValue - Total portfolio value (optional, will be calculated if not provided)
 * @returns {Array} Array of holdings with allocationPercentage added
 */
export const calculateAllocationPercentages = (holdings = [], totalPortfolioValue = null) => {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return [];
  }

  const totalValue = totalPortfolioValue !== null 
    ? totalPortfolioValue 
    : calculatePortfolioValue(holdings);

  if (totalValue === 0) {
    return holdings.map(holding => ({
      ...holding,
      allocationPercentage: 0
    }));
  }

  return holdings.map(holding => {
    const value = parseFloat(holding.value || 0);
    const allocationPercentage = isNaN(value) ? 0 : (value / totalValue) * 100;

    return {
      ...holding,
      allocationPercentage
    };
  });
};

/**
 * Verify that allocation percentages sum to 100%
 * @param {Array} holdings - Array of holdings with allocationPercentage property
 * @returns {boolean} True if allocations sum to 100% (within tolerance)
 */
export const verifyAllocationSum = (holdings = []) => {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return true; // Empty portfolio is valid
  }

  const sum = holdings.reduce((total, holding) => {
    const allocation = parseFloat(holding.allocationPercentage || 0);
    return total + (isNaN(allocation) ? 0 : allocation);
  }, 0);

  // Allow small floating-point tolerance (0.01%)
  const tolerance = 0.01;
  return Math.abs(sum - 100) < tolerance;
};

/**
 * Calculate trading cost including fees
 * @param {number} amount - Amount of cryptocurrency to trade
 * @param {number} price - Price per unit
 * @param {number} feePercent - Fee percentage (default 0.5%)
 * @returns {Object} Object with baseAmount, fees, and total
 */
export const calculateTradingCost = (amount, price, feePercent = 0.5) => {
  const parsedAmount = parseFloat(amount || 0);
  const parsedPrice = parseFloat(price || 0);
  const parsedFeePercent = parseFloat(feePercent || 0);

  if (isNaN(parsedAmount) || isNaN(parsedPrice) || isNaN(parsedFeePercent)) {
    return { baseAmount: 0, fees: 0, total: 0 };
  }

  const baseAmount = parsedAmount * parsedPrice;
  const fees = baseAmount * (parsedFeePercent / 100);
  const total = baseAmount + fees;

  return {
    baseAmount,
    fees,
    total
  };
};

/**
 * Calculate unrealized gains from holdings
 * @param {Array} holdings - Array of holding objects
 * @returns {number} Total unrealized gains
 */
export const calculateUnrealizedGains = (holdings = []) => {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return 0;
  }

  return holdings.reduce((sum, holding) => {
    const { profitLoss } = calculateProfitLoss(holding);
    return sum + (profitLoss > 0 ? profitLoss : 0);
  }, 0);
};

/**
 * Calculate unrealized losses from holdings
 * @param {Array} holdings - Array of holding objects
 * @returns {number} Total unrealized losses (positive number)
 */
export const calculateUnrealizedLosses = (holdings = []) => {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return 0;
  }

  return holdings.reduce((sum, holding) => {
    const { profitLoss } = calculateProfitLoss(holding);
    return sum + (profitLoss < 0 ? Math.abs(profitLoss) : 0);
  }, 0);
};

/**
 * Calculate total return for portfolio
 * @param {Array} holdings - Array of holding objects
 * @returns {Object} Object with totalReturn amount and percentage
 */
export const calculateTotalReturn = (holdings = []) => {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return { totalReturn: 0, totalReturnPercent: 0 };
  }

  const totalCurrentValue = holdings.reduce((sum, holding) => {
    const amount = parseFloat(holding.amount || 0);
    const currentPrice = parseFloat(holding.currentPrice || 0);
    return sum + (amount * currentPrice);
  }, 0);

  const totalPurchaseValue = holdings.reduce((sum, holding) => {
    const amount = parseFloat(holding.amount || 0);
    const purchasePrice = parseFloat(holding.purchasePrice || holding.currentPrice || 0);
    return sum + (amount * purchasePrice);
  }, 0);

  const totalReturn = totalCurrentValue - totalPurchaseValue;
  const totalReturnPercent = totalPurchaseValue > 0 
    ? (totalReturn / totalPurchaseValue) * 100 
    : 0;

  return {
    totalReturn,
    totalReturnPercent
  };
};

/**
 * Get profit/loss color coding
 * @param {number} value - Profit/loss value
 * @returns {string} Color class name ('green' for gains, 'red' for losses, 'gray' for neutral)
 */
export const getProfitLossColor = (value) => {
  const numValue = parseFloat(value || 0);
  
  if (isNaN(numValue) || numValue === 0) {
    return 'gray';
  }
  
  return numValue > 0 ? 'green' : 'red';
};
