/**
 * Input Validation and Edge Cases Tests
 * 
 * Tests for input validation, sanitization, and edge case handling
 * including zero values, negative numbers, extreme values, and
 * boundary conditions for trading operations.
 */

describe('Input Validation and Edge Cases', () => {
  describe('Trading Amount Validation', () => {
    const validateTradingAmount = (amount) => {
      if (amount === null || amount === undefined) {
        return { valid: false, error: 'Amount is required' };
      }
      
      const numAmount = Number(amount);
      
      if (isNaN(numAmount)) {
        return { valid: false, error: 'Amount must be a valid number' };
      }
      
      if (numAmount <= 0) {
        return { valid: false, error: 'Amount must be greater than zero' };
      }
      
      if (numAmount > Number.MAX_SAFE_INTEGER) {
        return { valid: false, error: 'Amount exceeds maximum allowed value' };
      }
      
      if (!Number.isFinite(numAmount)) {
        return { valid: false, error: 'Amount must be a finite number' };
      }
      
      return { valid: true, value: numAmount };
    };

    test('should accept valid positive numbers', () => {
      const validAmounts = [1, 0.5, 100, 1000.50, 0.00000001];
      
      validAmounts.forEach(amount => {
        const result = validateTradingAmount(amount);
        expect(result.valid).toBe(true);
        expect(result.value).toBe(amount);
      });
    });

    test('should reject zero', () => {
      const result = validateTradingAmount(0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('greater than zero');
    });

    test('should reject negative numbers', () => {
      const negativeAmounts = [-1, -0.5, -100, -0.00001];
      
      negativeAmounts.forEach(amount => {
        const result = validateTradingAmount(amount);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('greater than zero');
      });
    });

    test('should reject null and undefined', () => {
      expect(validateTradingAmount(null).valid).toBe(false);
      expect(validateTradingAmount(undefined).valid).toBe(false);
    });

    test('should reject non-numeric strings', () => {
      const invalidInputs = ['abc', 'not a number', '', '  '];
      
      invalidInputs.forEach(input => {
        const result = validateTradingAmount(input);
        expect(result.valid).toBe(false);
      });
    });

    test('should accept numeric strings', () => {
      const numericStrings = ['1', '0.5', '100.50'];
      
      numericStrings.forEach(str => {
        const result = validateTradingAmount(str);
        expect(result.valid).toBe(true);
        expect(typeof result.value).toBe('number');
      });
    });

    test('should reject Infinity', () => {
      const result = validateTradingAmount(Infinity);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('finite');
    });

    test('should reject -Infinity', () => {
      const result = validateTradingAmount(-Infinity);
      expect(result.valid).toBe(false);
    });

    test('should reject NaN', () => {
      const result = validateTradingAmount(NaN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid number');
    });

    test('should reject values exceeding MAX_SAFE_INTEGER', () => {
      const result = validateTradingAmount(Number.MAX_SAFE_INTEGER + 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('maximum');
    });

    test('should accept very small positive decimals', () => {
      const result = validateTradingAmount(0.00000001);
      expect(result.valid).toBe(true);
    });

    test('should handle scientific notation', () => {
      const result = validateTradingAmount(1e-8);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(0.00000001);
    });
  });

  describe('Price Validation', () => {
    const validatePrice = (price) => {
      if (price === null || price === undefined) {
        return { valid: false, error: 'Price is required' };
      }
      
      const numPrice = Number(price);
      
      if (isNaN(numPrice)) {
        return { valid: false, error: 'Price must be a valid number' };
      }
      
      if (numPrice < 0) {
        return { valid: false, error: 'Price cannot be negative' };
      }
      
      if (!Number.isFinite(numPrice)) {
        return { valid: false, error: 'Price must be a finite number' };
      }
      
      return { valid: true, value: numPrice };
    };

    test('should accept valid positive prices', () => {
      const validPrices = [1, 100, 43250.50, 0.00001];
      
      validPrices.forEach(price => {
        const result = validatePrice(price);
        expect(result.valid).toBe(true);
      });
    });

    test('should accept zero price', () => {
      const result = validatePrice(0);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(0);
    });

    test('should reject negative prices', () => {
      const result = validatePrice(-100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('negative');
    });

    test('should reject Infinity', () => {
      const result = validatePrice(Infinity);
      expect(result.valid).toBe(false);
    });

    test('should handle very large prices', () => {
      const result = validatePrice(1000000000);
      expect(result.valid).toBe(true);
    });

    test('should handle very small prices', () => {
      const result = validatePrice(0.00000001);
      expect(result.valid).toBe(true);
    });
  });

  describe('Cryptocurrency Symbol Validation', () => {
    const validateSymbol = (symbol) => {
      if (!symbol || typeof symbol !== 'string') {
        return { valid: false, error: 'Symbol is required and must be a string' };
      }
      
      const trimmed = symbol.trim().toUpperCase();
      
      if (trimmed.length === 0) {
        return { valid: false, error: 'Symbol cannot be empty' };
      }
      
      if (trimmed.length > 10) {
        return { valid: false, error: 'Symbol is too long' };
      }
      
      if (!/^[A-Z0-9]+$/.test(trimmed)) {
        return { valid: false, error: 'Symbol must contain only letters and numbers' };
      }
      
      return { valid: true, value: trimmed };
    };

    test('should accept valid symbols', () => {
      const validSymbols = ['BTC', 'ETH', 'ADA', 'USDT', 'BNB'];
      
      validSymbols.forEach(symbol => {
        const result = validateSymbol(symbol);
        expect(result.valid).toBe(true);
      });
    });

    test('should convert to uppercase', () => {
      const result = validateSymbol('btc');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('BTC');
    });

    test('should trim whitespace', () => {
      const result = validateSymbol('  BTC  ');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('BTC');
    });

    test('should reject empty strings', () => {
      const result = validateSymbol('');
      expect(result.valid).toBe(false);
    });

    test('should reject whitespace-only strings', () => {
      const result = validateSymbol('   ');
      expect(result.valid).toBe(false);
    });

    test('should reject symbols with special characters', () => {
      const invalidSymbols = ['BTC!', 'ETH@', 'ADA#', 'BTC-USD'];
      
      invalidSymbols.forEach(symbol => {
        const result = validateSymbol(symbol);
        expect(result.valid).toBe(false);
      });
    });

    test('should reject symbols that are too long', () => {
      const result = validateSymbol('VERYLONGSYMBOL');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should reject null and undefined', () => {
      expect(validateSymbol(null).valid).toBe(false);
      expect(validateSymbol(undefined).valid).toBe(false);
    });

    test('should reject non-string types', () => {
      expect(validateSymbol(123).valid).toBe(false);
      expect(validateSymbol({}).valid).toBe(false);
      expect(validateSymbol([]).valid).toBe(false);
    });

    test('should accept symbols with numbers', () => {
      const result = validateSymbol('USDT1');
      expect(result.valid).toBe(true);
    });
  });

  describe('Percentage Validation', () => {
    const validatePercentage = (percentage) => {
      if (percentage === null || percentage === undefined) {
        return { valid: false, error: 'Percentage is required' };
      }
      
      const numPercentage = Number(percentage);
      
      if (isNaN(numPercentage)) {
        return { valid: false, error: 'Percentage must be a valid number' };
      }
      
      if (numPercentage < -100 || numPercentage > 100) {
        return { valid: false, error: 'Percentage must be between -100 and 100' };
      }
      
      return { valid: true, value: numPercentage };
    };

    test('should accept valid percentages', () => {
      const validPercentages = [0, 50, -50, 100, -100, 25.5, -75.3];
      
      validPercentages.forEach(pct => {
        const result = validatePercentage(pct);
        expect(result.valid).toBe(true);
      });
    });

    test('should accept zero', () => {
      const result = validatePercentage(0);
      expect(result.valid).toBe(true);
    });

    test('should accept boundary values', () => {
      expect(validatePercentage(100).valid).toBe(true);
      expect(validatePercentage(-100).valid).toBe(true);
    });

    test('should reject values above 100', () => {
      const result = validatePercentage(101);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('between -100 and 100');
    });

    test('should reject values below -100', () => {
      const result = validatePercentage(-101);
      expect(result.valid).toBe(false);
    });

    test('should accept decimal percentages', () => {
      const result = validatePercentage(0.5);
      expect(result.valid).toBe(true);
    });

    test('should handle very small decimals', () => {
      const result = validatePercentage(0.0001);
      expect(result.valid).toBe(true);
    });
  });

  describe('Date/Timestamp Validation', () => {
    const validateTimestamp = (timestamp) => {
      if (timestamp === null || timestamp === undefined) {
        return { valid: false, error: 'Timestamp is required' };
      }
      
      const date = new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        return { valid: false, error: 'Invalid timestamp' };
      }
      
      const now = Date.now();
      const minDate = new Date('2009-01-03').getTime(); // Bitcoin genesis block
      
      if (date.getTime() < minDate) {
        return { valid: false, error: 'Timestamp is too old' };
      }
      
      if (date.getTime() > now + 86400000) { // 1 day in future
        return { valid: false, error: 'Timestamp cannot be in the future' };
      }
      
      return { valid: true, value: date };
    };

    test('should accept valid timestamps', () => {
      const validTimestamps = [
        Date.now(),
        new Date().toISOString(),
        '2024-01-01T00:00:00Z',
        1704067200000
      ];
      
      validTimestamps.forEach(ts => {
        const result = validateTimestamp(ts);
        expect(result.valid).toBe(true);
      });
    });

    test('should reject timestamps before Bitcoin genesis', () => {
      const result = validateTimestamp('2008-01-01');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too old');
    });

    test('should reject future timestamps', () => {
      const futureDate = new Date(Date.now() + 2 * 86400000);
      const result = validateTimestamp(futureDate);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('future');
    });

    test('should reject invalid date strings', () => {
      const result = validateTimestamp('not a date');
      expect(result.valid).toBe(false);
    });

    test('should accept current timestamp', () => {
      const result = validateTimestamp(Date.now());
      expect(result.valid).toBe(true);
    });
  });

  describe('Balance Validation', () => {
    const validateBalance = (balance, requiredAmount) => {
      if (balance === null || balance === undefined) {
        return { valid: false, error: 'Balance is required' };
      }
      
      const numBalance = Number(balance);
      const numRequired = Number(requiredAmount);
      
      if (isNaN(numBalance)) {
        return { valid: false, error: 'Balance must be a valid number' };
      }
      
      if (numBalance < 0) {
        return { valid: false, error: 'Balance cannot be negative' };
      }
      
      if (requiredAmount !== undefined && numBalance < numRequired) {
        return { 
          valid: false, 
          error: 'Insufficient balance',
          shortfall: numRequired - numBalance
        };
      }
      
      return { valid: true, value: numBalance };
    };

    test('should accept sufficient balance', () => {
      const result = validateBalance(1000, 500);
      expect(result.valid).toBe(true);
    });

    test('should reject insufficient balance', () => {
      const result = validateBalance(500, 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient');
      expect(result.shortfall).toBe(500);
    });

    test('should accept zero balance when no amount required', () => {
      const result = validateBalance(0);
      expect(result.valid).toBe(true);
    });

    test('should reject negative balance', () => {
      const result = validateBalance(-100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('negative');
    });

    test('should handle exact balance match', () => {
      const result = validateBalance(1000, 1000);
      expect(result.valid).toBe(true);
    });

    test('should handle floating point precision', () => {
      const result = validateBalance(0.1 + 0.2, 0.3);
      expect(result.valid).toBe(true);
    });
  });

  describe('Extreme Value Handling', () => {
    test('should handle Number.MAX_VALUE', () => {
      const value = Number.MAX_VALUE;
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    });

    test('should handle Number.MIN_VALUE', () => {
      const value = Number.MIN_VALUE;
      expect(value).toBeGreaterThan(0);
      expect(Number.isFinite(value)).toBe(true);
    });

    test('should handle Number.EPSILON', () => {
      const value = Number.EPSILON;
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(1);
    });

    test('should handle very large numbers', () => {
      const largeNumber = 1e308;
      expect(Number.isFinite(largeNumber)).toBe(true);
    });

    test('should handle very small numbers', () => {
      const smallNumber = 1e-308;
      expect(smallNumber).toBeGreaterThan(0);
      expect(Number.isFinite(smallNumber)).toBe(true);
    });

    test('should detect overflow to Infinity', () => {
      const overflow = Number.MAX_VALUE * 2;
      expect(overflow).toBe(Infinity);
      expect(Number.isFinite(overflow)).toBe(false);
    });

    test('should detect underflow to zero', () => {
      const underflow = Number.MIN_VALUE / 2;
      expect(underflow).toBe(0);
    });
  });

  describe('Floating Point Precision', () => {
    test('should handle 0.1 + 0.2 precision issue', () => {
      const result = 0.1 + 0.2;
      expect(result).toBeCloseTo(0.3, 10);
      expect(result).not.toBe(0.3);
    });

    test('should handle decimal multiplication precision', () => {
      const result = 0.1 * 0.2;
      expect(result).toBeCloseTo(0.02, 10);
    });

    test('should handle decimal division precision', () => {
      const result = 1 / 3;
      expect(result).toBeCloseTo(0.333333, 5);
    });

    test('should handle large number precision loss', () => {
      const large = 9007199254740992; // 2^53
      expect(large + 1).toBe(large + 1);
      expect(large + 2).toBe(large + 2);
    });

    test('should detect precision loss beyond MAX_SAFE_INTEGER', () => {
      const unsafe = Number.MAX_SAFE_INTEGER + 1;
      expect(unsafe + 1).toBe(unsafe + 2); // Precision lost
    });
  });

  describe('Special Number Values', () => {
    test('should identify NaN', () => {
      expect(Number.isNaN(NaN)).toBe(true);
      expect(Number.isNaN(0 / 0)).toBe(true);
      expect(Number.isNaN(parseInt('abc'))).toBe(true);
    });

    test('should identify Infinity', () => {
      expect(Number.isFinite(Infinity)).toBe(false);
      expect(Number.isFinite(-Infinity)).toBe(false);
      expect(Infinity > Number.MAX_VALUE).toBe(true);
    });

    test('should handle division by zero', () => {
      expect(1 / 0).toBe(Infinity);
      expect(-1 / 0).toBe(-Infinity);
      expect(0 / 0).toBe(NaN);
    });

    test('should handle negative zero', () => {
      const negZero = -0;
      expect(negZero).toBe(0);
      expect(Object.is(negZero, 0)).toBe(false);
      expect(1 / negZero).toBe(-Infinity);
    });
  });

  describe('String to Number Conversion Edge Cases', () => {
    test('should handle leading zeros', () => {
      expect(Number('007')).toBe(7);
      expect(Number('0.007')).toBe(0.007);
    });

    test('should handle leading/trailing whitespace', () => {
      expect(Number('  42  ')).toBe(42);
      expect(Number('\t100\n')).toBe(100);
    });

    test('should handle plus/minus signs', () => {
      expect(Number('+42')).toBe(42);
      expect(Number('-42')).toBe(-42);
    });

    test('should handle scientific notation strings', () => {
      expect(Number('1e3')).toBe(1000);
      expect(Number('1.5e-2')).toBe(0.015);
    });

    test('should return NaN for invalid strings', () => {
      expect(Number.isNaN(Number('abc'))).toBe(true);
      expect(Number.isNaN(Number('12.34.56'))).toBe(true);
      expect(Number.isNaN(Number('$100'))).toBe(true);
    });

    test('should handle empty string', () => {
      expect(Number('')).toBe(0);
      expect(Number('   ')).toBe(0);
    });
  });

  describe('Array and Object Edge Cases', () => {
    test('should handle empty arrays', () => {
      const emptyArray = [];
      expect(emptyArray.length).toBe(0);
      expect(emptyArray.reduce((sum, val) => sum + val, 0)).toBe(0);
    });

    test('should handle arrays with null/undefined', () => {
      const array = [1, null, 3, undefined, 5];
      const filtered = array.filter(x => x != null);
      expect(filtered).toEqual([1, 3, 5]);
    });

    test('should handle sparse arrays', () => {
      const sparse = [1, , 3, , 5];
      expect(sparse.length).toBe(5);
      expect(sparse[1]).toBeUndefined();
    });

    test('should handle objects with missing properties', () => {
      const obj = { a: 1 };
      expect(obj.b).toBeUndefined();
      expect(obj.b?.c).toBeUndefined();
    });

    test('should handle null prototype objects', () => {
      const obj = Object.create(null);
      obj.value = 100;
      expect(obj.value).toBe(100);
      expect(obj.toString).toBeUndefined();
    });
  });
});
