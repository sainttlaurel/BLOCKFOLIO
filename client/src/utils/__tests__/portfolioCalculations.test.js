/**
 * Unit Tests for Portfolio Calculation Functions
 * 
 * Tests cover:
 * - Portfolio value calculations
 * - Profit/loss calculations with color coding
 * - Allocation percentage calculations
 * - Trading cost calculations including fees
 * - Edge cases and boundary conditions
 */

import {
  calculatePortfolioValue,
  calculateProfitLoss,
  calculateAllocationPercentages,
  verifyAllocationSum,
  calculateTradingCost,
  calculateUnrealizedGains,
  calculateUnrealizedLosses,
  calculateTotalReturn,
  getProfitLossColor
} from '../portfolioCalculations';

describe('Portfolio Calculation Functions', () => {
  
  describe('calculatePortfolioValue', () => {
    test('calculates total portfolio value correctly', () => {
      const holdings = [
        { value: 10000 },
        { value: 5000 },
        { value: 2500 }
      ];
      
      expect(calculatePortfolioValue(holdings)).toBe(17500);
    });

    test('handles empty holdings array', () => {
      expect(calculatePortfolioValue([])).toBe(0);
    });

    test('handles undefined or null input', () => {
      expect(calculatePortfolioValue(undefined)).toBe(0);
      expect(calculatePortfolioValue(null)).toBe(0);
    });

    test('handles holdings with missing value property', () => {
      const holdings = [
        { value: 10000 },
        { name: 'BTC' }, // missing value
        { value: 5000 }
      ];
      
      expect(calculatePortfolioValue(holdings)).toBe(15000);
    });

    test('handles string values and converts them', () => {
      const holdings = [
        { value: '10000' },
        { value: '5000.50' }
      ];
      
      expect(calculatePortfolioValue(holdings)).toBe(15000.50);
    });

    test('handles negative values', () => {
      const holdings = [
        { value: 10000 },
        { value: -1000 }
      ];
      
      expect(calculatePortfolioValue(holdings)).toBe(9000);
    });

    test('handles very large values', () => {
      const holdings = [
        { value: 1000000000 },
        { value: 500000000 }
      ];
      
      expect(calculatePortfolioValue(holdings)).toBe(1500000000);
    });

    test('handles decimal precision', () => {
      const holdings = [
        { value: 10000.123 },
        { value: 5000.456 }
      ];
      
      expect(calculatePortfolioValue(holdings)).toBeCloseTo(15000.579, 2);
    });
  });

  describe('calculateProfitLoss', () => {
    test('calculates profit correctly', () => {
      const holding = {
        amount: 10,
        currentPrice: 50000,
        purchasePrice: 40000
      };
      
      const result = calculateProfitLoss(holding);
      
      expect(result.profitLoss).toBe(100000); // 10 * (50000 - 40000)
      expect(result.profitLossPercent).toBe(25); // (100000 / 400000) * 100
    });

    test('calculates loss correctly', () => {
      const holding = {
        amount: 5,
        currentPrice: 30000,
        purchasePrice: 40000
      };
      
      const result = calculateProfitLoss(holding);
      
      expect(result.profitLoss).toBe(-50000); // 5 * (30000 - 40000)
      expect(result.profitLossPercent).toBe(-25); // (-50000 / 200000) * 100
    });

    test('handles zero profit/loss', () => {
      const holding = {
        amount: 10,
        currentPrice: 50000,
        purchasePrice: 50000
      };
      
      const result = calculateProfitLoss(holding);
      
      expect(result.profitLoss).toBe(0);
      expect(result.profitLossPercent).toBe(0);
    });

    test('handles missing purchasePrice (uses currentPrice)', () => {
      const holding = {
        amount: 10,
        currentPrice: 50000
      };
      
      const result = calculateProfitLoss(holding);
      
      expect(result.profitLoss).toBe(0);
      expect(result.profitLossPercent).toBe(0);
    });

    test('handles invalid holding object', () => {
      const result = calculateProfitLoss(null);
      
      expect(result.profitLoss).toBe(0);
      expect(result.profitLossPercent).toBe(0);
    });

    test('handles string values', () => {
      const holding = {
        amount: '10',
        currentPrice: '50000',
        purchasePrice: '40000'
      };
      
      const result = calculateProfitLoss(holding);
      
      expect(result.profitLoss).toBe(100000);
      expect(result.profitLossPercent).toBe(25);
    });

    test('handles decimal amounts and prices', () => {
      const holding = {
        amount: 0.5,
        currentPrice: 50000.50,
        purchasePrice: 40000.25
      };
      
      const result = calculateProfitLoss(holding);
      
      expect(result.profitLoss).toBeCloseTo(5000.125, 2);
    });
  });

  describe('calculateAllocationPercentages', () => {
    test('calculates allocation percentages correctly', () => {
      const holdings = [
        { symbol: 'BTC', value: 10000 },
        { symbol: 'ETH', value: 5000 },
        { symbol: 'ADA', value: 2500 }
      ];
      
      const result = calculateAllocationPercentages(holdings);
      
      expect(result[0].allocationPercentage).toBeCloseTo(57.14, 1); // 10000/17500 * 100
      expect(result[1].allocationPercentage).toBeCloseTo(28.57, 1); // 5000/17500 * 100
      expect(result[2].allocationPercentage).toBeCloseTo(14.29, 1); // 2500/17500 * 100
    });

    test('allocation percentages sum to 100%', () => {
      const holdings = [
        { value: 10000 },
        { value: 5000 },
        { value: 2500 }
      ];
      
      const result = calculateAllocationPercentages(holdings);
      const sum = result.reduce((total, h) => total + h.allocationPercentage, 0);
      
      expect(sum).toBeCloseTo(100, 1);
    });

    test('handles empty holdings array', () => {
      const result = calculateAllocationPercentages([]);
      
      expect(result).toEqual([]);
    });

    test('handles single holding (100% allocation)', () => {
      const holdings = [{ value: 10000 }];
      
      const result = calculateAllocationPercentages(holdings);
      
      expect(result[0].allocationPercentage).toBe(100);
    });

    test('handles zero total value', () => {
      const holdings = [
        { value: 0 },
        { value: 0 }
      ];
      
      const result = calculateAllocationPercentages(holdings);
      
      expect(result[0].allocationPercentage).toBe(0);
      expect(result[1].allocationPercentage).toBe(0);
    });

    test('uses provided totalPortfolioValue', () => {
      const holdings = [
        { value: 5000 },
        { value: 5000 }
      ];
      
      const result = calculateAllocationPercentages(holdings, 20000);
      
      expect(result[0].allocationPercentage).toBe(25); // 5000/20000 * 100
      expect(result[1].allocationPercentage).toBe(25);
    });

    test('preserves original holding properties', () => {
      const holdings = [
        { symbol: 'BTC', value: 10000, amount: 0.5 }
      ];
      
      const result = calculateAllocationPercentages(holdings);
      
      expect(result[0].symbol).toBe('BTC');
      expect(result[0].amount).toBe(0.5);
      expect(result[0].allocationPercentage).toBe(100);
    });
  });

  describe('verifyAllocationSum', () => {
    test('returns true when allocations sum to 100%', () => {
      const holdings = [
        { allocationPercentage: 50 },
        { allocationPercentage: 30 },
        { allocationPercentage: 20 }
      ];
      
      expect(verifyAllocationSum(holdings)).toBe(true);
    });

    test('returns true for empty holdings', () => {
      expect(verifyAllocationSum([])).toBe(true);
    });

    test('returns false when allocations do not sum to 100%', () => {
      const holdings = [
        { allocationPercentage: 50 },
        { allocationPercentage: 30 }
      ];
      
      expect(verifyAllocationSum(holdings)).toBe(false);
    });

    test('handles floating-point precision with tolerance', () => {
      const holdings = [
        { allocationPercentage: 33.333333 },
        { allocationPercentage: 33.333333 },
        { allocationPercentage: 33.333334 }
      ];
      
      expect(verifyAllocationSum(holdings)).toBe(true);
    });

    test('handles missing allocationPercentage property', () => {
      const holdings = [
        { allocationPercentage: 50 },
        { symbol: 'BTC' } // missing allocationPercentage
      ];
      
      expect(verifyAllocationSum(holdings)).toBe(false);
    });
  });

  describe('calculateTradingCost', () => {
    test('calculates trading cost with default fee', () => {
      const result = calculateTradingCost(1, 50000);
      
      expect(result.baseAmount).toBe(50000);
      expect(result.fees).toBe(250); // 0.5% of 50000
      expect(result.total).toBe(50250);
    });

    test('calculates trading cost with custom fee', () => {
      const result = calculateTradingCost(1, 50000, 1.0);
      
      expect(result.baseAmount).toBe(50000);
      expect(result.fees).toBe(500); // 1% of 50000
      expect(result.total).toBe(50500);
    });

    test('handles decimal amounts', () => {
      const result = calculateTradingCost(0.5, 50000, 0.5);
      
      expect(result.baseAmount).toBe(25000);
      expect(result.fees).toBe(125);
      expect(result.total).toBe(25125);
    });

    test('handles zero fee', () => {
      const result = calculateTradingCost(1, 50000, 0);
      
      expect(result.baseAmount).toBe(50000);
      expect(result.fees).toBe(0);
      expect(result.total).toBe(50000);
    });

    test('handles string inputs', () => {
      const result = calculateTradingCost('1', '50000', '0.5');
      
      expect(result.baseAmount).toBe(50000);
      expect(result.fees).toBe(250);
      expect(result.total).toBe(50250);
    });

    test('handles invalid inputs', () => {
      const result = calculateTradingCost(null, undefined, 'invalid');
      
      expect(result.baseAmount).toBe(0);
      expect(result.fees).toBe(0);
      expect(result.total).toBe(0);
    });

    test('handles large trading amounts', () => {
      const result = calculateTradingCost(100, 50000, 0.5);
      
      expect(result.baseAmount).toBe(5000000);
      expect(result.fees).toBe(25000);
      expect(result.total).toBe(5025000);
    });

    test('calculates fees with high precision', () => {
      const result = calculateTradingCost(0.123, 45678.90, 0.75);
      
      expect(result.baseAmount).toBeCloseTo(5618.5047, 2);
      expect(result.fees).toBeCloseTo(42.1388, 2);
      expect(result.total).toBeCloseTo(5660.6435, 2);
    });
  });

  describe('calculateUnrealizedGains', () => {
    test('calculates total unrealized gains', () => {
      const holdings = [
        { amount: 1, currentPrice: 50000, purchasePrice: 40000 }, // +10000
        { amount: 2, currentPrice: 30000, purchasePrice: 25000 }, // +10000
        { amount: 1, currentPrice: 20000, purchasePrice: 25000 }  // -5000 (ignored)
      ];
      
      expect(calculateUnrealizedGains(holdings)).toBe(20000);
    });

    test('returns 0 for empty holdings', () => {
      expect(calculateUnrealizedGains([])).toBe(0);
    });

    test('returns 0 when all holdings have losses', () => {
      const holdings = [
        { amount: 1, currentPrice: 30000, purchasePrice: 40000 },
        { amount: 1, currentPrice: 20000, purchasePrice: 25000 }
      ];
      
      expect(calculateUnrealizedGains(holdings)).toBe(0);
    });
  });

  describe('calculateUnrealizedLosses', () => {
    test('calculates total unrealized losses', () => {
      const holdings = [
        { amount: 1, currentPrice: 30000, purchasePrice: 40000 }, // -10000
        { amount: 1, currentPrice: 20000, purchasePrice: 25000 }, // -5000
        { amount: 1, currentPrice: 50000, purchasePrice: 40000 }  // +10000 (ignored)
      ];
      
      expect(calculateUnrealizedLosses(holdings)).toBe(15000);
    });

    test('returns 0 for empty holdings', () => {
      expect(calculateUnrealizedLosses([])).toBe(0);
    });

    test('returns 0 when all holdings have gains', () => {
      const holdings = [
        { amount: 1, currentPrice: 50000, purchasePrice: 40000 },
        { amount: 1, currentPrice: 30000, purchasePrice: 25000 }
      ];
      
      expect(calculateUnrealizedLosses(holdings)).toBe(0);
    });
  });

  describe('calculateTotalReturn', () => {
    test('calculates positive total return', () => {
      const holdings = [
        { amount: 1, currentPrice: 50000, purchasePrice: 40000 },
        { amount: 2, currentPrice: 30000, purchasePrice: 25000 }
      ];
      
      const result = calculateTotalReturn(holdings);
      
      expect(result.totalReturn).toBe(20000); // (50000 - 40000) + 2*(30000 - 25000)
      expect(result.totalReturnPercent).toBeCloseTo(22.22, 1); // 20000 / 90000 * 100
    });

    test('calculates negative total return', () => {
      const holdings = [
        { amount: 1, currentPrice: 30000, purchasePrice: 40000 },
        { amount: 1, currentPrice: 20000, purchasePrice: 25000 }
      ];
      
      const result = calculateTotalReturn(holdings);
      
      expect(result.totalReturn).toBe(-15000);
      expect(result.totalReturnPercent).toBeCloseTo(-23.08, 1);
    });

    test('handles zero return', () => {
      const holdings = [
        { amount: 1, currentPrice: 50000, purchasePrice: 50000 }
      ];
      
      const result = calculateTotalReturn(holdings);
      
      expect(result.totalReturn).toBe(0);
      expect(result.totalReturnPercent).toBe(0);
    });

    test('returns 0 for empty holdings', () => {
      const result = calculateTotalReturn([]);
      
      expect(result.totalReturn).toBe(0);
      expect(result.totalReturnPercent).toBe(0);
    });

    test('uses currentPrice as purchasePrice when missing', () => {
      const holdings = [
        { amount: 1, currentPrice: 50000 }
      ];
      
      const result = calculateTotalReturn(holdings);
      
      expect(result.totalReturn).toBe(0);
      expect(result.totalReturnPercent).toBe(0);
    });
  });

  describe('getProfitLossColor', () => {
    test('returns green for positive values', () => {
      expect(getProfitLossColor(100)).toBe('green');
      expect(getProfitLossColor(0.01)).toBe('green');
      expect(getProfitLossColor(1000000)).toBe('green');
    });

    test('returns red for negative values', () => {
      expect(getProfitLossColor(-100)).toBe('red');
      expect(getProfitLossColor(-0.01)).toBe('red');
      expect(getProfitLossColor(-1000000)).toBe('red');
    });

    test('returns gray for zero', () => {
      expect(getProfitLossColor(0)).toBe('gray');
    });

    test('handles string inputs', () => {
      expect(getProfitLossColor('100')).toBe('green');
      expect(getProfitLossColor('-100')).toBe('red');
      expect(getProfitLossColor('0')).toBe('gray');
    });

    test('handles invalid inputs', () => {
      expect(getProfitLossColor(null)).toBe('gray');
      expect(getProfitLossColor(undefined)).toBe('gray');
      expect(getProfitLossColor('invalid')).toBe('gray');
    });
  });

  // Edge Cases and Boundary Conditions
  describe('Edge Cases', () => {
    test('handles very small decimal values', () => {
      const holdings = [
        { value: 0.00001 },
        { value: 0.00002 }
      ];
      
      expect(calculatePortfolioValue(holdings)).toBeCloseTo(0.00003, 5);
    });

    test('handles mixed positive and negative values in portfolio', () => {
      const holdings = [
        { value: 10000 },
        { value: -1000 },
        { value: 5000 }
      ];
      
      expect(calculatePortfolioValue(holdings)).toBe(14000);
    });

    test('handles allocation calculation with very small holdings', () => {
      const holdings = [
        { value: 0.001 },
        { value: 0.002 }
      ];
      
      const result = calculateAllocationPercentages(holdings);
      const sum = result.reduce((total, h) => total + h.allocationPercentage, 0);
      
      expect(sum).toBeCloseTo(100, 1);
    });

    test('handles profit/loss with zero purchase price', () => {
      const holding = {
        amount: 10,
        currentPrice: 50000,
        purchasePrice: 0
      };
      
      const result = calculateProfitLoss(holding);
      
      // When purchase price is 0, percentage is 0 to avoid division by zero
      expect(result.profitLossPercent).toBe(0);
    });

    test('handles trading cost with zero amount', () => {
      const result = calculateTradingCost(0, 50000, 0.5);
      
      expect(result.baseAmount).toBe(0);
      expect(result.fees).toBe(0);
      expect(result.total).toBe(0);
    });

    test('handles trading cost with zero price', () => {
      const result = calculateTradingCost(10, 0, 0.5);
      
      expect(result.baseAmount).toBe(0);
      expect(result.fees).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});
