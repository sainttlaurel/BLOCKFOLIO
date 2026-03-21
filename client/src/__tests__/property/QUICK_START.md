# Property-Based Testing Quick Start Guide

## What is Property-Based Testing?

Instead of writing specific test cases, you define **properties** that should always be true, and the testing library generates hundreds of random test cases automatically.

### Traditional Testing
```javascript
test('portfolio value calculation', () => {
  const holdings = [{ value: 100 }, { value: 200 }];
  expect(calculatePortfolioValue(holdings)).toBe(300);
});
```

### Property-Based Testing
```javascript
test('portfolio value is always non-negative', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({ value: fc.float({ min: 0, max: 1000000 }) })),
      (holdings) => {
        const total = calculatePortfolioValue(holdings);
        expect(total).toBeGreaterThanOrEqual(0);
      }
    ),
    { numRuns: 100 } // Tests 100 random cases!
  );
});
```

## Quick Commands

```bash
# Install dependencies
npm install

# Run all property tests
npm test -- --testPathPattern=property

# Run specific test file
npm test -- financialCalculations.property.test.js

# Run with coverage
npm test -- --coverage --testPathPattern=property

# Run in watch mode
npm test -- --watch --testPathPattern=property
```

## Test Files Overview

| File | Purpose | Key Properties |
|------|---------|----------------|
| `financialCalculations.property.test.js` | Financial math | Allocations sum to 100%, costs = base + fees |
| `uiConsistency.property.test.js` | UI rendering | Color coding, sorting, filtering consistency |
| `performance.property.test.js` | Speed & memory | Operations < 16.67ms, O(n) complexity |
| `accessibility.property.test.js` | A11y compliance | ARIA labels, keyboard nav, contrast ratios |
| `security.property.test.js` | Security | XSS prevention, data sanitization |

## Common Generators

### Numbers
```javascript
fc.float({ min: 0.01, max: 100000, noNaN: true })  // Prices
fc.integer({ min: 1, max: 100 })                    // Counts
```

### Strings
```javascript
fc.string({ minLength: 1, maxLength: 10 })          // Symbols
fc.string({ minLength: 1, maxLength: 50 })          // Names
```

### Arrays
```javascript
fc.array(fc.record({ value: fc.float() }), { minLength: 1, maxLength: 50 })
```

### Objects
```javascript
fc.record({
  symbol: fc.string({ minLength: 1, maxLength: 10 }),
  price: fc.float({ min: 0.01, max: 100000, noNaN: true }),
  amount: fc.float({ min: 0.001, max: 1000, noNaN: true })
})
```

## Writing Your First Property Test

### Step 1: Identify a Property

Think about what should **always** be true:
- "Allocation percentages must sum to 100%"
- "Positive values are green, negative values are red"
- "Sorting doesn't lose data"

### Step 2: Create a Generator

```javascript
const holdingGenerator = fc.record({
  symbol: fc.string({ minLength: 1, maxLength: 10 }),
  value: fc.float({ min: 0, max: 1000000, noNaN: true })
});
```

### Step 3: Write the Property

```javascript
test('my property description', () => {
  fc.assert(
    fc.property(
      fc.array(holdingGenerator, { minLength: 1, maxLength: 20 }),
      (holdings) => {
        // Your test logic here
        const result = myFunction(holdings);
        expect(result).toBeSomething();
      }
    ),
    { numRuns: 100 }
  );
});
```

## Common Patterns

### Testing Mathematical Properties

```javascript
// Commutativity: a + b = b + a
test('addition is commutative', () => {
  fc.assert(
    fc.property(fc.float(), fc.float(), (a, b) => {
      expect(a + b).toBeCloseTo(b + a);
    })
  );
});

// Identity: x + 0 = x
test('zero is identity element', () => {
  fc.assert(
    fc.property(fc.float(), (x) => {
      expect(x + 0).toBeCloseTo(x);
    })
  );
});
```

### Testing Data Transformations

```javascript
test('transformation preserves length', () => {
  fc.assert(
    fc.property(
      fc.array(fc.anything()),
      (data) => {
        const transformed = data.map(x => transform(x));
        expect(transformed.length).toBe(data.length);
      }
    )
  );
});
```

### Testing Invariants

```javascript
test('sorting maintains all elements', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer()),
      (data) => {
        const sorted = [...data].sort((a, b) => a - b);
        expect(sorted.length).toBe(data.length);
        data.forEach(item => {
          expect(sorted).toContain(item);
        });
      }
    )
  );
});
```

## Debugging Failed Tests

When a test fails, fast-check shows the failing case:

```
Property failed after 42 tests
Counterexample: [{"symbol":"BTC","value":-0.0001}]
Shrunk 5 time(s)
Got error: Expected 0 to be greater than or equal to 0
```

### Reproduce the Failure

```javascript
fc.assert(
  fc.property(/* ... */),
  { seed: 1234567890, path: "42:0" } // From error message
);
```

### Fix and Verify

1. Fix the bug in your code
2. Run the test again
3. Verify it passes with the same seed
4. Run with new random seeds

## Best Practices

### ✅ Do

- Test universal properties, not specific examples
- Use realistic data generators
- Set appropriate min/max bounds
- Handle edge cases (empty arrays, zero values)
- Document which design property you're testing
- Use tolerance for floating-point comparisons

### ❌ Don't

- Test implementation details
- Use too many iterations in development (slow feedback)
- Ignore counterexamples (they reveal bugs!)
- Test time-dependent behavior
- Forget to handle NaN and Infinity

## Floating-Point Comparisons

```javascript
// ❌ Bad - exact comparison
expect(result).toBe(expected);

// ✅ Good - with tolerance
expect(Math.abs(result - expected)).toBeLessThan(0.01);

// ✅ Good - using Jest matcher
expect(result).toBeCloseTo(expected, 2); // 2 decimal places
```

## Performance Tips

### Development (Fast Feedback)
```javascript
{ numRuns: 50 }  // Faster, good for development
```

### CI/CD (Thorough Testing)
```javascript
{ numRuns: 100 }  // Standard
```

### Pre-Release (Maximum Confidence)
```javascript
{ numRuns: 1000 }  // Thorough, slower
```

## Common Issues

### Issue: Test is Too Slow

**Solution**: Reduce iterations or optimize the tested function
```javascript
{ numRuns: 20 }  // Temporary for debugging
```

### Issue: Too Many False Positives

**Solution**: Add constraints to generators
```javascript
fc.float({ min: 0.01, max: 100000, noNaN: true })  // Exclude edge cases
```

### Issue: Flaky Tests

**Solution**: Use deterministic seeding
```javascript
{ seed: 42 }  // Same random sequence every time
```

## Examples from Our Tests

### Financial Calculations
```javascript
// Allocations must sum to 100%
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

### UI Consistency
```javascript
// Positive changes are green, negative are red
fc.assert(
  fc.property(
    fc.float({ min: -1000000, max: 1000000 }),
    (change) => {
      const color = getChangeColor(change);
      if (change > 0) expect(color).toBe('green');
      else if (change < 0) expect(color).toBe('red');
      else expect(color).toBe('gray');
    }
  )
);
```

### Performance
```javascript
// Operations complete within one frame (16.67ms)
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

## Next Steps

1. **Read the README**: Full documentation in `README.md`
2. **Explore Test Files**: See real examples in the test files
3. **Run the Tests**: `npm test -- --testPathPattern=property`
4. **Write Your Own**: Start with simple properties
5. **Learn More**: Check out the [fast-check docs](https://github.com/dubzzz/fast-check)

## Need Help?

- Check `README.md` for detailed documentation
- Review `IMPLEMENTATION_SUMMARY.md` for overview
- Look at existing test files for examples
- Read the [fast-check documentation](https://github.com/dubzzz/fast-check)

## Quick Reference Card

```javascript
// Import
import fc from 'fast-check';

// Basic structure
test('property description', () => {
  fc.assert(
    fc.property(
      fc.generator(),           // Data generator
      (data) => {               // Test function
        expect(result).toBe(expected);
      }
    ),
    { numRuns: 100 }           // Configuration
  );
});

// Common generators
fc.integer()                   // Any integer
fc.float()                     // Any float
fc.string()                    // Any string
fc.array(fc.integer())         // Array of integers
fc.record({ key: fc.string() }) // Object with properties

// Common options
{ numRuns: 100 }               // Number of test cases
{ seed: 42 }                   // Deterministic seed
{ timeout: 5000 }              // Timeout in ms
```

Happy property testing! 🚀
