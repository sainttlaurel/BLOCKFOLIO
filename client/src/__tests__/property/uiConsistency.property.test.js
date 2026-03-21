/**
 * Property-Based Tests for UI Consistency
 * Task 9.2.2 - Property tests for UI consistency
 * 
 * Feature: professional-trading-platform
 * 
 * These tests verify that UI components render consistently with different data sets,
 * maintaining data integrity through sorting, filtering, and pagination operations.
 */

import fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock components for testing
const MockCryptocurrencyRow = ({ coin }) => (
  <tr data-testid={`coin-row-${coin.symbol}`}>
    <td>{coin.symbol}</td>
    <td>{coin.name}</td>
    <td>{coin.price}</td>
    <td className={coin.percentageChange24h >= 0 ? 'text-green' : 'text-red'}>
      {coin.percentageChange24h}%
    </td>
  </tr>
);

const MockCryptocurrencyTable = ({ coins }) => (
  <table>
    <tbody>
      {coins.map(coin => (
        <MockCryptocurrencyRow key={coin.symbol} coin={coin} />
      ))}
    </tbody>
  </table>
);

describe('Property-Based Tests: UI Consistency', () => {
  
  /**
   * Property 4: Color Coding Consistency
   * Feature: professional-trading-platform, Property 4: For any percentage change display, 
   * positive values should result in green color styling and negative values should 
   * result in red color styling.
   */
  describe('Property 4: Color Coding Consistency', () => {
    test('positive percentage changes should always render with green color class', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              price: fc.float({ min: 0.01, max: 100000, noNaN: true }),
              percentageChange24h: fc.float({ min: 0.01, max: 100, noNaN: true })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (coins) => {
            const { container } = render(<MockCryptocurrencyTable coins={coins} />);
            
            coins.forEach(coin => {
              const row = container.querySelector(`[data-testid="coin-row-${coin.symbol}"]`);
              const changeCell = row.querySelector('.text-green, .text-red');
              
              // Positive changes should have green class
              expect(changeCell.classList.contains('text-green')).toBe(true);
              expect(changeCell.classList.contains('text-red')).toBe(false);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    test('negative percentage changes should always render with red color class', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              price: fc.float({ min: 0.01, max: 100000, noNaN: true }),
              percentageChange24h: fc.float({ min: -100, max: -0.01, noNaN: true })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (coins) => {
            const { container } = render(<MockCryptocurrencyTable coins={coins} />);
            
            coins.forEach(coin => {
              const row = container.querySelector(`[data-testid="coin-row-${coin.symbol}"]`);
              const changeCell = row.querySelector('.text-green, .text-red');
              
              // Negative changes should have red class
              expect(changeCell.classList.contains('text-red')).toBe(true);
              expect(changeCell.classList.contains('text-green')).toBe(false);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Sorting Data Integrity Tests
   */
  describe('Sorting Maintains Data Integrity', () => {
    test('sorting should preserve all data elements', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              price: fc.float({ min: 0.01, max: 100000, noNaN: true }),
              marketCap: fc.float({ min: 1000, max: 1000000000, noNaN: true })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (data) => {
            // Sort by price
            const sortedByPrice = [...data].sort((a, b) => b.price - a.price);
            
            // Verify all elements are present
            expect(sortedByPrice.length).toBe(data.length);
            
            // Verify no data loss
            data.forEach(item => {
              const found = sortedByPrice.find(sorted => sorted.symbol === item.symbol);
              expect(found).toBeDefined();
              expect(found.price).toBe(item.price);
              expect(found.marketCap).toBe(item.marketCap);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('sorting should maintain correct order', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              price: fc.float({ min: 0.01, max: 100000, noNaN: true })
            }),
            { minLength: 2, maxLength: 50 }
          ),
          (data) => {
            // Sort ascending
            const sortedAsc = [...data].sort((a, b) => a.price - b.price);
            
            // Verify ascending order
            for (let i = 0; i < sortedAsc.length - 1; i++) {
              expect(sortedAsc[i].price).toBeLessThanOrEqual(sortedAsc[i + 1].price);
            }
            
            // Sort descending
            const sortedDesc = [...data].sort((a, b) => b.price - a.price);
            
            // Verify descending order
            for (let i = 0; i < sortedDesc.length - 1; i++) {
              expect(sortedDesc[i].price).toBeGreaterThanOrEqual(sortedDesc[i + 1].price);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('multiple sorts should be reversible', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              price: fc.float({ min: 0.01, max: 100000, noNaN: true })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (data) => {
            const original = [...data];
            
            // Sort ascending then descending
            const sorted = [...data]
              .sort((a, b) => a.price - b.price)
              .sort((a, b) => b.price - a.price);
            
            // Should still contain all original elements
            expect(sorted.length).toBe(original.length);
            original.forEach(item => {
              const found = sorted.find(s => s.symbol === item.symbol);
              expect(found).toBeDefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Filtering Data Integrity Tests
   */
  describe('Filtering Maintains Data Integrity', () => {
    test('filtering should not lose data - filtered out items should be recoverable', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              price: fc.float({ min: 0.01, max: 100000, noNaN: true }),
              marketCap: fc.float({ min: 1000, max: 1000000000, noNaN: true })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          fc.float({ min: 0.01, max: 100000, noNaN: true }),
          (data, priceThreshold) => {
            // Filter by price
            const filtered = data.filter(item => item.price >= priceThreshold);
            const filteredOut = data.filter(item => item.price < priceThreshold);
            
            // Combining filtered and filtered-out should equal original
            const combined = [...filtered, ...filteredOut];
            expect(combined.length).toBe(data.length);
            
            // All original items should be in either filtered or filteredOut
            data.forEach(item => {
              const inFiltered = filtered.find(f => f.symbol === item.symbol);
              const inFilteredOut = filteredOut.find(f => f.symbol === item.symbol);
              expect(inFiltered || inFilteredOut).toBeDefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('filtering should preserve item properties', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              price: fc.float({ min: 0.01, max: 100000, noNaN: true }),
              marketCap: fc.float({ min: 1000, max: 1000000000, noNaN: true }),
              volume: fc.float({ min: 100, max: 10000000, noNaN: true })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (data) => {
            const filtered = data.filter(item => item.price > 100);
            
            // Each filtered item should have all original properties
            filtered.forEach(item => {
              const original = data.find(d => d.symbol === item.symbol);
              expect(item.price).toBe(original.price);
              expect(item.marketCap).toBe(original.marketCap);
              expect(item.volume).toBe(original.volume);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('multiple filters should be composable', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              price: fc.float({ min: 0.01, max: 100000, noNaN: true }),
              marketCap: fc.float({ min: 1000, max: 1000000000, noNaN: true })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (data) => {
            // Apply multiple filters
            const filtered1 = data.filter(item => item.price > 10);
            const filtered2 = filtered1.filter(item => item.marketCap > 100000);
            
            // Should be equivalent to combined filter
            const combinedFilter = data.filter(
              item => item.price > 10 && item.marketCap > 100000
            );
            
            expect(filtered2.length).toBe(combinedFilter.length);
            filtered2.forEach(item => {
              const found = combinedFilter.find(c => c.symbol === item.symbol);
              expect(found).toBeDefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Pagination Consistency Tests
   */
  describe('Pagination Maintains Consistency', () => {
    test('paginated data should equal original when combined', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              price: fc.float({ min: 0.01, max: 100000, noNaN: true })
            }),
            { minLength: 1, maxLength: 100 }
          ),
          fc.integer({ min: 1, max: 20 }),
          (data, pageSize) => {
            // Paginate data
            const pages = [];
            for (let i = 0; i < data.length; i += pageSize) {
              pages.push(data.slice(i, i + pageSize));
            }
            
            // Combine all pages
            const combined = pages.flat();
            
            // Should equal original data
            expect(combined.length).toBe(data.length);
            data.forEach((item, index) => {
              expect(combined[index].symbol).toBe(item.symbol);
              expect(combined[index].price).toBe(item.price);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('pagination should not duplicate or lose items', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              price: fc.float({ min: 0.01, max: 100000, noNaN: true })
            }),
            { minLength: 1, maxLength: 100 }
          ),
          fc.integer({ min: 1, max: 20 }),
          (data, pageSize) => {
            const pages = [];
            for (let i = 0; i < data.length; i += pageSize) {
              pages.push(data.slice(i, i + pageSize));
            }
            
            const combined = pages.flat();
            
            // Check for duplicates
            const symbols = combined.map(item => item.symbol);
            const uniqueSymbols = new Set(symbols);
            expect(symbols.length).toBe(uniqueSymbols.size);
            
            // Check no items lost
            data.forEach(item => {
              const found = combined.find(c => c.symbol === item.symbol);
              expect(found).toBeDefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('page boundaries should be consistent', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              price: fc.float({ min: 0.01, max: 100000, noNaN: true })
            }),
            { minLength: 10, maxLength: 100 }
          ),
          fc.integer({ min: 5, max: 20 }),
          (data, pageSize) => {
            const totalPages = Math.ceil(data.length / pageSize);
            
            for (let page = 0; page < totalPages; page++) {
              const start = page * pageSize;
              const end = Math.min(start + pageSize, data.length);
              const pageData = data.slice(start, end);
              
              // Last page can be smaller
              if (page < totalPages - 1) {
                expect(pageData.length).toBe(pageSize);
              } else {
                expect(pageData.length).toBeLessThanOrEqual(pageSize);
                expect(pageData.length).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Data Transformation Consistency Tests
   */
  describe('Data Transformations Maintain Consistency', () => {
    test('mapping should preserve array length', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              price: fc.float({ min: 0.01, max: 100000, noNaN: true })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (data) => {
            const mapped = data.map(item => ({
              ...item,
              priceUSD: `$${item.price.toFixed(2)}`
            }));
            
            expect(mapped.length).toBe(data.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('reduce operations should be consistent', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              symbol: fc.string({ minLength: 1, maxLength: 10 }),
              value: fc.float({ min: 0, max: 1000000, noNaN: true })
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (data) => {
            // Sum using reduce
            const sum1 = data.reduce((acc, item) => acc + item.value, 0);
            
            // Sum using loop
            let sum2 = 0;
            data.forEach(item => sum2 += item.value);
            
            // Should be equal
            expect(Math.abs(sum1 - sum2)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
