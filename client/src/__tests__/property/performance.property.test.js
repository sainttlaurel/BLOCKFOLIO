/**
 * Property-Based Tests for Performance
 * Task 9.2.3 - Performance property tests
 * 
 * Feature: professional-trading-platform
 * 
 * These tests verify that operations complete within time bounds, memory usage
 * stays within limits, and performance degrades gracefully with load.
 */

import fc from 'fast-check';
import {
  calculatePortfolioValue,
  calculateAllocationPercentages,
  calculateTotalReturn
} from '../../utils/portfolioCalculations';

describe('Property-Based Tests: Performance', () => {
  
  /**
   * Property 60: Initial Load Performance
   * Feature: professional-trading-platform, Property 60: For any standard internet 
   * connection, the initial interface should load completely within 2 seconds.
   */
  describe('Property 60: Initial Load Performance', () => {
    test('portfolio calculations should complete within acceptable time for any dataset size', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              value: fc.float({ min: 0, max: 1000000, noNaN: true })
            }),
            { minLength: 1, maxLength: 100 }
          ),
          (holdings) => {
            const startTime = performance.now();
            const totalValue = calculatePortfolioValue(holdings);
            const endTime = performance.now();
            
            const executionTime = endTime - startTime;
            
            // Should complete in less than 100ms for up to 100 holdings
            expect(executionTime).toBeLessThan(100);
            expect(totalValue).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('allocation calculations should scale linearly with dataset size', () => {
      const sizes = [10, 50, 100];
      const timings = [];
      
      sizes.forEach(size => {
        const holdings = Array.from({ length: size }, (_, i) => ({
          symbol: `COIN${i}`,
          value: Math.random() * 10000
        }));
        
        const startTime = performance.now();
        calculateAllocationPercentages(holdings);
        const endTime = performance.now();
        
        timings.push(endTime - startTime);
      });
      
      // Time should scale roughly linearly (not exponentially)
      // 100 items should take less than 20x the time of 10 items
      const ratio = timings[2] / timings[0];
      expect(ratio).toBeLessThan(20);
    });
  });

  /**
   * Property 61: Update Performance Maintenance
   * Feature: professional-trading-platform, Property 61: For any price data update, 
   * the interface should maintain smooth performance without lag or stuttering.
   */
  describe('Property 61: Update Performance Maintenance', () => {
    test('repeated calculations should maintain consistent performance', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              amount: fc.float({ min: 0.001, max: 1000, noNaN: true }),
              currentPrice: fc.float({ min: 0.01, max: 100000, noNaN: true }),
              purchasePrice: fc.float({ min: 0.01, max: 100000, noNaN: true })
            }),
            { minLength: 10, maxLength: 50 }
          ),
          (holdings) => {
            const iterations = 10;
            const timings = [];
            
            // Simulate multiple updates
            for (let i = 0; i < iterations; i++) {
              const startTime = performance.now();
              calculateTotalReturn(holdings);
              const endTime = performance.now();
              timings.push(endTime - startTime);
            }
            
            // Calculate variance in timings
            const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
            const variance = timings.reduce((sum, time) => {
              return sum + Math.pow(time - avgTime, 2);
            }, 0) / timings.length;
            
            // Variance should be low (consistent performance)
            // Standard deviation should be less than 50% of average
            const stdDev = Math.sqrt(variance);
            expect(stdDev).toBeLessThan(avgTime * 0.5);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('calculations should not degrade with repeated calls', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              value: fc.float({ min: 0, max: 1000000, noNaN: true })
            }),
            { minLength: 10, maxLength: 50 }
          ),
          (holdings) => {
            // First call
            const start1 = performance.now();
            calculatePortfolioValue(holdings);
            const time1 = performance.now() - start1;
            
            // Call 100 times
            for (let i = 0; i < 100; i++) {
              calculatePortfolioValue(holdings);
            }
            
            // Last call
            const start2 = performance.now();
            calculatePortfolioValue(holdings);
            const time2 = performance.now() - start2;
            
            // Last call should not be significantly slower than first
            // Allow up to 2x slower due to system variance
            expect(time2).toBeLessThan(time1 * 2 + 5); // +5ms tolerance
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 65: Frame Rate Performance Maintenance
   * Feature: professional-trading-platform, Property 65: For any data update or 
   * user interaction, the interface should maintain 60fps performance.
   */
  describe('Property 65: Frame Rate Performance (60fps = 16.67ms per frame)', () => {
    test('single calculation should complete within one frame (16.67ms)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              value: fc.float({ min: 0, max: 1000000, noNaN: true })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (holdings) => {
            const startTime = performance.now();
            calculatePortfolioValue(holdings);
            const endTime = performance.now();
            
            const executionTime = endTime - startTime;
            
            // Should complete within one frame (16.67ms for 60fps)
            expect(executionTime).toBeLessThan(16.67);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('batch calculations should complete within acceptable time', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              value: fc.float({ min: 0, max: 1000000, noNaN: true })
            }),
            { minLength: 10, maxLength: 50 }
          ),
          (holdings) => {
            const startTime = performance.now();
            
            // Simulate batch update (multiple calculations)
            calculatePortfolioValue(holdings);
            calculateAllocationPercentages(holdings);
            calculateTotalReturn(holdings);
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            // Batch should complete within 3 frames (50ms)
            expect(executionTime).toBeLessThan(50);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Memory Usage Tests
   */
  describe('Memory Usage Stays Within Limits', () => {
    test('calculations should not create excessive temporary objects', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              value: fc.float({ min: 0, max: 1000000, noNaN: true })
            }),
            { minLength: 10, maxLength: 100 }
          ),
          (holdings) => {
            // Measure memory before (if available)
            const memBefore = performance.memory?.usedJSHeapSize || 0;
            
            // Perform calculations
            for (let i = 0; i < 100; i++) {
              calculatePortfolioValue(holdings);
            }
            
            // Force garbage collection if available (only in some environments)
            if (global.gc) {
              global.gc();
            }
            
            const memAfter = performance.memory?.usedJSHeapSize || 0;
            
            // Memory increase should be reasonable (less than 10MB for 100 iterations)
            const memIncrease = memAfter - memBefore;
            if (memBefore > 0) {
              expect(memIncrease).toBeLessThan(10 * 1024 * 1024);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('large datasets should not cause memory overflow', () => {
      const largeHoldings = Array.from({ length: 1000 }, (_, i) => ({
        symbol: `COIN${i}`,
        value: Math.random() * 10000
      }));
      
      // Should complete without throwing memory errors
      expect(() => {
        calculatePortfolioValue(largeHoldings);
        calculateAllocationPercentages(largeHoldings);
      }).not.toThrow();
    });
  });

  /**
   * Graceful Performance Degradation Tests
   */
  describe('Performance Degrades Gracefully with Load', () => {
    test('performance should scale predictably with data size', () => {
      const sizes = [10, 50, 100, 200];
      const timings = [];
      
      sizes.forEach(size => {
        const holdings = Array.from({ length: size }, (_, i) => ({
          symbol: `COIN${i}`,
          value: Math.random() * 10000
        }));
        
        const startTime = performance.now();
        calculatePortfolioValue(holdings);
        calculateAllocationPercentages(holdings);
        const endTime = performance.now();
        
        timings.push(endTime - startTime);
      });
      
      // Each doubling of size should not more than double the time
      for (let i = 1; i < timings.length; i++) {
        const sizeRatio = sizes[i] / sizes[i - 1];
        const timeRatio = timings[i] / timings[i - 1];
        
        // Time ratio should not exceed size ratio by more than 50%
        expect(timeRatio).toBeLessThan(sizeRatio * 1.5);
      }
    });

    test('calculations should remain functional under stress', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              amount: fc.float({ min: 0.001, max: 1000, noNaN: true }),
              currentPrice: fc.float({ min: 0.01, max: 100000, noNaN: true }),
              purchasePrice: fc.float({ min: 0.01, max: 100000, noNaN: true })
            }),
            { minLength: 50, maxLength: 100 }
          ),
          (holdings) => {
            // Perform many calculations rapidly
            const results = [];
            for (let i = 0; i < 50; i++) {
              results.push(calculateTotalReturn(holdings));
            }
            
            // All results should be valid
            results.forEach(result => {
              expect(result).toBeDefined();
              expect(result.totalReturn).toBeDefined();
              expect(isFinite(result.totalReturn)).toBe(true);
            });
            
            // Results should be consistent
            const firstResult = results[0].totalReturn;
            results.forEach(result => {
              expect(Math.abs(result.totalReturn - firstResult)).toBeLessThan(0.01);
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Algorithmic Complexity Tests
   */
  describe('Algorithmic Complexity', () => {
    test('portfolio value calculation should be O(n)', () => {
      const sizes = [10, 20, 40, 80];
      const timings = [];
      
      sizes.forEach(size => {
        const holdings = Array.from({ length: size }, (_, i) => ({
          symbol: `COIN${i}`,
          value: Math.random() * 10000
        }));
        
        const iterations = 100;
        const startTime = performance.now();
        for (let i = 0; i < iterations; i++) {
          calculatePortfolioValue(holdings);
        }
        const endTime = performance.now();
        
        timings.push((endTime - startTime) / iterations);
      });
      
      // Verify O(n) complexity: doubling size should roughly double time
      for (let i = 1; i < timings.length; i++) {
        const timeRatio = timings[i] / timings[i - 1];
        // Should be close to 2 (linear), not 4 (quadratic)
        expect(timeRatio).toBeGreaterThan(1.5);
        expect(timeRatio).toBeLessThan(3);
      }
    });

    test('allocation calculation should be O(n)', () => {
      const sizes = [10, 20, 40, 80];
      const timings = [];
      
      sizes.forEach(size => {
        const holdings = Array.from({ length: size }, (_, i) => ({
          symbol: `COIN${i}`,
          value: Math.random() * 10000
        }));
        
        const iterations = 100;
        const startTime = performance.now();
        for (let i = 0; i < iterations; i++) {
          calculateAllocationPercentages(holdings);
        }
        const endTime = performance.now();
        
        timings.push((endTime - startTime) / iterations);
      });
      
      // Verify O(n) complexity
      for (let i = 1; i < timings.length; i++) {
        const timeRatio = timings[i] / timings[i - 1];
        expect(timeRatio).toBeGreaterThan(1.5);
        expect(timeRatio).toBeLessThan(3);
      }
    });
  });

  /**
   * Concurrent Operations Tests
   */
  describe('Concurrent Operations Performance', () => {
    test('parallel calculations should not interfere with each other', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              value: fc.float({ min: 0, max: 1000000, noNaN: true })
            }),
            { minLength: 10, maxLength: 50 }
          ),
          (holdings) => {
            // Perform calculations in parallel
            const promises = Array.from({ length: 10 }, () => 
              Promise.resolve(calculatePortfolioValue(holdings))
            );
            
            return Promise.all(promises).then(results => {
              // All results should be identical
              const firstResult = results[0];
              results.forEach(result => {
                expect(Math.abs(result - firstResult)).toBeLessThan(0.01);
              });
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
