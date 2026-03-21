/**
 * Property-Based Tests for Financial Calculations
 * Task 9.2.1 - Property tests for financial calculations
 * 
 * Feature: professional-trading-platform
 * 
 * These tests verify that financial calculations maintain mathematical properties
 * across all possible inputs, ensuring accuracy and consistency.
 */

import fc from 'fast-check';
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
} from '../../utils/portfolioCalculations';

describe('Property-Based Tests: Financial Calculations', () => {
  
  /**
   * Property 5: Allocation Percentage Accuracy
   * Feature: professional-trading-platform, Property 5: For any portfolio with holdings, 
   * the sum of all allocation percentages should equal 100% and each individual allocation 
   * should be correctly calculated based on holding value.
   */
  describe('Property 5: Allocation Percentage Accuracy', () => {
    test('allocation percentages should always sum to 100% for any valid portfolio', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              value: fc.float({ min: 0.01, max: 1000000, noNaN: true })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (holdings) => {
            const holdingsWithAllocations = calculateAllocationPercentages(holdings);
            const isValid = verifyAllocationSum(holdingsWithAllocations);
            
            // The sum should always be 100% (within floating-point tolerance)
            expect(isValid).toBe(true);
            
            // Each allocation should be proportional to its value
            const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
            holdingsWithAllocations.forEach((holding, index) => {
              const expectedAllocation = (holdings[index].value / totalValue) * 100;
              expect(Math.abs(holding.allocationPercentage - expectedAllocation)).toBeLessThan(0.01);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('allocation percentages should be non-negative for any valid holdings', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1 }),
              value: fc.float({ min: 0, max: 1000000, noNaN: true })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (holdings) => {
            const holdingsWithAllocations = calculateAllocationPercentages(holdings);
            holdingsWithAllocations.forEach(holding => {
              expect(holding.allocationPercentage).toBeGreaterThanOrEqual(0);
              expect(holding.allocationPercentage).toBeLessThanOrEqual(100);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15: Trade Cost Calculation Accuracy
   * Feature: professional-trading-platform, Property 15: For any trade amount and 
   * selected cryptocurrency, the estimated total cost calculation should include 
   * the correct base amount and applicable fees.
   */
  describe('Property 15: Trade Cost Calculation Accuracy', () => {
    test('total cost should always equal base amount plus fees', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0.001, max: 1000, noNaN: true }),
          fc.float({ min: 0.01, max: 100000, noNaN: true }),
          fc.float({ min: 0, max: 5, noNaN: true }),
          (amount, price, feePercent) => {
            const result = calculateTradingCost(amount, price, feePercent);
            
            // Total should equal base + fees
            expect(Math.abs(result.total - (result.baseAmount + result.fees))).toBeLessThan(0.01);
            
            // Base amount should equal amount * price
            expect(Math.abs(result.baseAmount - (amount * price))).toBeLessThan(0.01);
            
            // Fees should equal base * (feePercent / 100)
            expect(Math.abs(result.fees - (result.baseAmount * feePercent / 100))).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('trading cost should be commutative for amount and price', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0.001, max: 1000, noNaN: true }),
          fc.float({ min: 0.01, max: 100000, noNaN: true }),
          fc.float({ min: 0, max: 5, noNaN: true }),
          (amount, price, feePercent) => {
            const result1 = calculateTradingCost(amount, price, feePercent);
            const result2 = calculateTradingCost(price, amount, feePercent);
            
            // Base amounts should be equal (commutative property)
            expect(Math.abs(result1.baseAmount - result2.baseAmount)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('zero fee should result in total equal to base amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0.001, max: 1000, noNaN: true }),
          fc.float({ min: 0.01, max: 100000, noNaN: true }),
          (amount, price) => {
            const result = calculateTradingCost(amount, price, 0);
            
            // With zero fee, total should equal base amount (identity property)
            expect(Math.abs(result.total - result.baseAmount)).toBeLessThan(0.01);
            expect(result.fees).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 31: Profit/Loss Color Coding
   * Feature: professional-trading-platform, Property 31: For any holding profit/loss 
   * calculation, positive values should display in green and negative values should 
   * display in red with correct numerical accuracy.
   */
  describe('Property 31: Profit/Loss Calculation and Color Coding', () => {
    test('profit/loss should be calculated correctly for any holding', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0.001, max: 1000, noNaN: true }),
          fc.float({ min: 0.01, max: 100000, noNaN: true }),
          fc.float({ min: 0.01, max: 100000, noNaN: true }),
          (amount, currentPrice, purchasePrice) => {
            const holding = { amount, currentPrice, purchasePrice };
            const result = calculateProfitLoss(holding);
            
            const expectedProfitLoss = (amount * currentPrice) - (amount * purchasePrice);
            const expectedPercent = ((currentPrice - purchasePrice) / purchasePrice) * 100;
            
            expect(Math.abs(result.profitLoss - expectedProfitLoss)).toBeLessThan(0.01);
            expect(Math.abs(result.profitLossPercent - expectedPercent)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('color coding should be consistent with profit/loss sign', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1000000, max: 1000000, noNaN: true }),
          (profitLoss) => {
            const color = getProfitLossColor(profitLoss);
            
            if (profitLoss > 0) {
              expect(color).toBe('green');
            } else if (profitLoss < 0) {
              expect(color).toBe('red');
            } else {
              expect(color).toBe('gray');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 35: Financial Calculation Display Accuracy
   * Feature: professional-trading-platform, Property 35: For any portfolio display, 
   * total return and unrealized gains/losses should be calculated and displayed 
   * with correct mathematical precision.
   */
  describe('Property 35: Total Return and Unrealized Gains/Losses', () => {
    test('total return should equal sum of all individual profit/loss values', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1 }),
              amount: fc.float({ min: 0.001, max: 1000, noNaN: true }),
              currentPrice: fc.float({ min: 0.01, max: 100000, noNaN: true }),
              purchasePrice: fc.float({ min: 0.01, max: 100000, noNaN: true })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (holdings) => {
            const { totalReturn } = calculateTotalReturn(holdings);
            
            const sumOfIndividualProfitLoss = holdings.reduce((sum, holding) => {
              const { profitLoss } = calculateProfitLoss(holding);
              return sum + profitLoss;
            }, 0);
            
            expect(Math.abs(totalReturn - sumOfIndividualProfitLoss)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('unrealized gains plus losses should equal absolute total return', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1 }),
              amount: fc.float({ min: 0.001, max: 1000, noNaN: true }),
              currentPrice: fc.float({ min: 0.01, max: 100000, noNaN: true }),
              purchasePrice: fc.float({ min: 0.01, max: 100000, noNaN: true })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (holdings) => {
            const gains = calculateUnrealizedGains(holdings);
            const losses = calculateUnrealizedLosses(holdings);
            const { totalReturn } = calculateTotalReturn(holdings);
            
            // Gains - Losses should equal total return
            expect(Math.abs((gains - losses) - totalReturn)).toBeLessThan(0.01);
            
            // Gains and losses should be non-negative
            expect(gains).toBeGreaterThanOrEqual(0);
            expect(losses).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Mathematical Properties Tests
   */
  describe('Mathematical Properties', () => {
    test('portfolio value calculation should be associative', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1 }),
              value: fc.float({ min: 0, max: 1000000, noNaN: true })
            }),
            { minLength: 3, maxLength: 20 }
          ),
          (holdings) => {
            // Split holdings into groups and verify associativity
            const mid = Math.floor(holdings.length / 2);
            const group1 = holdings.slice(0, mid);
            const group2 = holdings.slice(mid);
            
            const total1 = calculatePortfolioValue(group1);
            const total2 = calculatePortfolioValue(group2);
            const combinedTotal = total1 + total2;
            
            const directTotal = calculatePortfolioValue(holdings);
            
            expect(Math.abs(combinedTotal - directTotal)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('portfolio value should have identity element (empty portfolio = 0)', () => {
      const emptyValue = calculatePortfolioValue([]);
      expect(emptyValue).toBe(0);
      
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1 }),
              value: fc.float({ min: 0, max: 1000000, noNaN: true })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (holdings) => {
            const value = calculatePortfolioValue(holdings);
            const valueWithEmpty = value + calculatePortfolioValue([]);
            
            // Adding empty portfolio should not change value (identity)
            expect(Math.abs(value - valueWithEmpty)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('percentage change calculations should be consistent', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0.01, max: 100000, noNaN: true }),
          fc.float({ min: 0.01, max: 100000, noNaN: true }),
          (purchasePrice, currentPrice) => {
            const holding = {
              amount: 1,
              currentPrice,
              purchasePrice
            };
            
            const { profitLossPercent } = calculateProfitLoss(holding);
            const expectedPercent = ((currentPrice - purchasePrice) / purchasePrice) * 100;
            
            expect(Math.abs(profitLossPercent - expectedPercent)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Edge Cases and Boundary Conditions
   */
  describe('Edge Cases', () => {
    test('should handle zero values gracefully', () => {
      expect(calculatePortfolioValue([])).toBe(0);
      expect(calculatePortfolioValue([{ value: 0 }])).toBe(0);
      
      const zeroHolding = { amount: 0, currentPrice: 100, purchasePrice: 50 };
      const result = calculateProfitLoss(zeroHolding);
      expect(result.profitLoss).toBe(0);
    });

    test('should handle very small values accurately', () => {
      const smallHolding = { amount: 0.00000001, currentPrice: 0.00000001, purchasePrice: 0.00000001 };
      const result = calculateProfitLoss(smallHolding);
      expect(result.profitLoss).toBe(0);
    });

    test('should handle very large values without overflow', () => {
      const largeHoldings = [
        { value: 999999999 },
        { value: 999999999 }
      ];
      const total = calculatePortfolioValue(largeHoldings);
      expect(total).toBeGreaterThan(0);
      expect(isFinite(total)).toBe(true);
    });

    test('should handle invalid inputs gracefully', () => {
      expect(calculatePortfolioValue(null)).toBe(0);
      expect(calculatePortfolioValue(undefined)).toBe(0);
      expect(calculatePortfolioValue('invalid')).toBe(0);
      
      const invalidHolding = { amount: 'invalid', currentPrice: 'invalid' };
      const result = calculateProfitLoss(invalidHolding);
      expect(result.profitLoss).toBe(0);
      expect(result.profitLossPercent).toBe(0);
    });
  });
});
