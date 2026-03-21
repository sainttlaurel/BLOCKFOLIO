# Property-Based Testing for Professional Trading Platform

This directory contains property-based tests for the professional trading platform using the `fast-check` library. Property-based testing verifies that certain properties hold true across all valid inputs, providing more comprehensive coverage than traditional example-based tests.

## Overview

Property-based testing uses random input generation to verify universal properties of the system. Instead of testing specific examples, we define properties that should always be true and let the testing library generate hundreds of test cases automatically.

## Test Files

### 1. Financial Calculations (`financialCalculations.property.test.js`)

**Task 9.2.1** - Tests mathematical properties of financial calculations

**Properties Tested:**
- **Property 5**: Allocation percentages always sum to 100%
- **Property 15**: Trade cost calculation accuracy (base + fees = total)
- **Property 31**: Profit/loss calculation and color coding consistency
- **Property 35**: Total return equals sum of individual profit/loss values

**Key Features:**
- Tests mathematical properties (commutativity, associativity, identity)
- Validates portfolio value calculations with random inputs
- Tests percentage change calculations
- Verifies profit/loss calculations
- Ensures calculations are accurate regardless of input

**Example Properties:**
```javascript
// Allocation percentages must sum to 100%
fc.assert(
  fc.property(
    fc.array(fc.record({ value: fc.float({ min: 0.01, max: 1000000 }) })),
    (holdings) => {
      const withAllocations = calculateAllocationPercentages(holdings);
      expect(verifyAllocationSum(withAllocations)).toBe(true);
    }
  )
);
```

### 2. UI Consistency (`uiConsistency.property.test.js`)

**Task 9.2.2** - Tests UI rendering consistency across different data sets

**Properties Tested:**
- **Property 4**: Color coding consistency (green for positive, red for negative)
- Sorting maintains data integrity
- Filtering doesn't lose data
- Pagination consistency

**Key Features:**
- Tests that UI renders consistently with different data sets
- Verifies sorting maintains all data elements
- Ensures filtering is reversible
- Validates pagination doesn't duplicate or lose items
- Tests data transformation consistency

**Example Properties:**
```javascript
// Sorting should preserve all data elements
fc.assert(
  fc.property(
    fc.array(fc.record({ symbol: fc.string(), price: fc.float() })),
    (data) => {
      const sorted = [...data].sort((a, b) => b.price - a.price);
      expect(sorted.length).toBe(data.length);
      // Verify no data loss
    }
  )
);
```

### 3. Performance (`performance.property.test.js`)

**Task 9.2.3** - Tests performance properties under varying conditions

**Properties Tested:**
- **Property 60**: Initial load performance (< 2 seconds)
- **Property 61**: Update performance maintenance (no lag)
- **Property 65**: Frame rate performance (60fps = 16.67ms per frame)

**Key Features:**
- Tests operations complete within time bounds
- Verifies memory usage stays within limits
- Ensures performance degrades gracefully with load
- Tests algorithmic complexity (O(n) verification)
- Validates concurrent operations don't interfere

**Example Properties:**
```javascript
// Calculations should complete within one frame (16.67ms for 60fps)
fc.assert(
  fc.property(
    fc.array(fc.record({ value: fc.float() })),
    (holdings) => {
      const start = performance.now();
      calculatePortfolioValue(holdings);
      const time = performance.now() - start;
      expect(time).toBeLessThan(16.67);
    }
  )
);
```

### 4. Accessibility (`accessibility.property.test.js`)

**Task 9.2.4** - Tests accessibility properties across all components

**Properties Tested:**
- **Property 66**: Keyboard navigation accessibility
- **Property 67**: Color contrast compliance (WCAG AA/AAA)
- **Property 68**: Screen reader support with ARIA labels
- **Property 70**: Alternative text for visual content

**Key Features:**
- Tests ARIA attributes are always present
- Verifies keyboard navigation always works
- Ensures focus management is consistent
- Tests screen reader compatibility
- Validates color contrast ratios

**Example Properties:**
```javascript
// All interactive elements should have tabIndex
fc.assert(
  fc.property(
    fc.array(fc.record({ label: fc.string() })),
    (buttons) => {
      const { container } = render(<Buttons buttons={buttons} />);
      const elements = container.querySelectorAll('button');
      elements.forEach(el => {
        expect(el.hasAttribute('tabIndex')).toBe(true);
      });
    }
  )
);
```

### 5. Security (`security.property.test.js`)

**Task 9.2.5** - Tests security properties for user data handling

**Properties Tested:**
- XSS prevention in all user inputs
- Data sanitization
- No sensitive data in logs
- Proper error message handling

**Key Features:**
- Tests XSS prevention with random attack vectors
- Verifies data sanitization for all input types
- Ensures sensitive data is masked in logs
- Tests error messages don't expose technical details
- Validates input validation prevents manipulation

**Example Properties:**
```javascript
// Should prevent script injection in any user input
fc.assert(
  fc.property(
    fc.string(),
    (userInput) => {
      const { container } = render(<UserInput value={userInput} />);
      const innerHTML = container.innerHTML;
      expect(innerHTML.toLowerCase()).not.toMatch(/<script[^>]*>/);
    }
  )
);
```

## Running the Tests

### Run All Property-Based Tests
```bash
npm test -- --testPathPattern=property
```

### Run Specific Test File
```bash
npm test -- financialCalculations.property.test.js
npm test -- uiConsistency.property.test.js
npm test -- performance.property.test.js
npm test -- accessibility.property.test.js
npm test -- security.property.test.js
```

### Run with Coverage
```bash
npm test -- --coverage --testPathPattern=property
```

### Run in Watch Mode
```bash
npm test -- --watch --testPathPattern=property
```

## Configuration

### Test Iterations

Each property test runs 100 iterations by default (50 for UI tests to reduce rendering overhead). You can adjust this in the test files:

```javascript
fc.assert(
  fc.property(/* ... */),
  { numRuns: 100 } // Adjust number of iterations
);
```

### Custom Generators

The tests use custom generators for realistic data:

```javascript
// Cryptocurrency data generator
fc.record({
  symbol: fc.string({ minLength: 1, maxLength: 10 }),
  price: fc.float({ min: 0.01, max: 100000, noNaN: true }),
  percentageChange24h: fc.float({ min: -100, max: 100, noNaN: true })
})

// Portfolio holdings generator
fc.array(
  fc.record({
    amount: fc.float({ min: 0.001, max: 1000, noNaN: true }),
    currentPrice: fc.float({ min: 0.01, max: 100000, noNaN: true }),
    purchasePrice: fc.float({ min: 0.01, max: 100000, noNaN: true })
  }),
  { minLength: 1, maxLength: 50 }
)
```

## Understanding Property-Based Testing

### What is a Property?

A property is a characteristic that should hold true for all valid inputs. For example:

- **Mathematical Property**: `a + b = b + a` (commutativity)
- **Business Property**: "Allocation percentages must sum to 100%"
- **UI Property**: "Positive values are always green, negative values are always red"

### Benefits

1. **Comprehensive Coverage**: Tests hundreds of cases automatically
2. **Edge Case Discovery**: Finds edge cases you didn't think of
3. **Regression Prevention**: Properties remain true across refactoring
4. **Documentation**: Properties serve as executable specifications
5. **Confidence**: Higher confidence in correctness across all inputs

### When to Use Property-Based Testing

✅ **Good for:**
- Mathematical calculations
- Data transformations
- Parsing and serialization
- Sorting and filtering algorithms
- Security validations
- Performance characteristics

❌ **Not ideal for:**
- Specific business workflows
- Integration with external APIs
- UI interaction sequences
- Time-dependent behavior

## Debugging Failed Tests

When a property test fails, fast-check provides a minimal failing example:

```
Property failed after 42 tests
{ seed: 1234567890, path: "42:0", endOnFailure: true }
Counterexample: [{"symbol":"BTC","value":-0.0001}]
```

To reproduce the failure:

```javascript
fc.assert(
  fc.property(/* ... */),
  { seed: 1234567890, path: "42:0" }
);
```

## Integration with CI/CD

These tests are designed to run in CI/CD pipelines:

```yaml
# .github/workflows/test.yml
- name: Run Property-Based Tests
  run: npm test -- --testPathPattern=property --ci --coverage
```

### Performance Considerations

- Property tests take longer than unit tests (100+ iterations)
- Consider running them in a separate CI job
- Use `numRuns: 50` for faster feedback in development
- Use `numRuns: 1000` for thorough testing before releases

## Best Practices

1. **Keep Properties Simple**: Each test should verify one property
2. **Use Realistic Generators**: Match production data patterns
3. **Set Appropriate Bounds**: Use `min`/`max` to avoid unrealistic values
4. **Handle Edge Cases**: Test with empty arrays, zero values, etc.
5. **Document Properties**: Reference design document properties
6. **Fast Feedback**: Start with fewer iterations during development

## Maintenance

### Adding New Properties

1. Identify a universal property from requirements
2. Create appropriate data generators
3. Write the property test
4. Reference the design document property number
5. Run with high iteration count to verify

### Updating Generators

When data models change, update the generators:

```javascript
// Old
fc.record({ symbol: fc.string() })

// New - with validation
fc.record({ 
  symbol: fc.string({ minLength: 1, maxLength: 10 })
    .filter(s => /^[A-Z]+$/.test(s))
})
```

## Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://fsharpforfunandprofit.com/posts/property-based-testing/)
- [Design Document](.kiro/specs/professional-trading-platform/design.md)
- [Requirements Document](.kiro/specs/professional-trading-platform/requirements.md)

## Support

For questions or issues with property-based tests:
1. Check the test output for counterexamples
2. Review the property definition in the design document
3. Verify generators produce realistic data
4. Check for floating-point precision issues (use tolerance)

## License

These tests are part of the professional trading platform project.
