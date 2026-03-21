/**
 * Input Validation Middleware
 * Validates and sanitizes user inputs to prevent injection attacks
 */

const {
  sanitizeString,
  sanitizeCryptoSymbol,
  sanitizeNumber,
  isValidEmail,
  isValidSQLParam,
  validateTradingAmount,
  validatePrice,
  validateStringLength,
  createSafeErrorMessage
} = require('../utils/security');
const logger = require('../utils/logger');

/**
 * Validate registration input
 */
function validateRegistration(req, res, next) {
  try {
    const { username, email, password } = req.body;
    
    // Validate username
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const usernameValidation = validateStringLength(username, 50);
    if (!usernameValidation.valid) {
      return res.status(400).json({ error: usernameValidation.error });
    }
    
    // Sanitize username
    req.body.username = sanitizeString(username);
    
    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    
    req.body.email = email.toLowerCase().trim();
    
    // Validate password
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password too long' });
    }
    
    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return res.status(400).json({ 
        error: 'Password must contain uppercase, lowercase, and numbers' 
      });
    }
    
    next();
  } catch (error) {
    logger.error('Registration validation error', { error: error.message });
    res.status(500).json({ error: 'Validation failed' });
  }
}

/**
 * Validate login input
 */
function validateLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    
    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    
    req.body.email = email.toLowerCase().trim();
    
    // Validate password
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    if (password.length > 128) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    next();
  } catch (error) {
    logger.error('Login validation error', { error: error.message });
    res.status(500).json({ error: 'Validation failed' });
  }
}

/**
 * Validate trading input (buy/sell)
 */
function validateTrade(req, res, next) {
  try {
    const { coinSymbol, amount } = req.body;
    
    // Validate coin symbol
    if (!coinSymbol || typeof coinSymbol !== 'string') {
      return res.status(400).json({ error: 'Coin symbol is required' });
    }
    
    const sanitizedSymbol = sanitizeCryptoSymbol(coinSymbol);
    if (!sanitizedSymbol || sanitizedSymbol.length === 0) {
      return res.status(400).json({ error: 'Invalid coin symbol' });
    }
    
    if (sanitizedSymbol.length > 10) {
      return res.status(400).json({ error: 'Coin symbol too long' });
    }
    
    req.body.coinSymbol = sanitizedSymbol;
    
    // Validate amount
    const amountValidation = validateTradingAmount(amount);
    if (!amountValidation.valid) {
      return res.status(400).json({ error: amountValidation.error });
    }
    
    req.body.amount = amountValidation.value;
    
    // Additional SQL injection check
    if (!isValidSQLParam(coinSymbol) || !isValidSQLParam(amount)) {
      logger.warn('Potential SQL injection attempt', {
        coinSymbol,
        amount,
        userId: req.user?.userId,
        ip: req.ip
      });
      return res.status(400).json({ error: 'Invalid input detected' });
    }
    
    next();
  } catch (error) {
    logger.error('Trade validation error', { error: error.message });
    res.status(500).json({ error: 'Validation failed' });
  }
}

/**
 * Validate query parameters
 */
function validateQueryParams(req, res, next) {
  try {
    // Validate limit parameter
    if (req.query.limit) {
      const limit = sanitizeNumber(req.query.limit, { min: 1, max: 1000, allowNegative: false });
      if (limit === null) {
        return res.status(400).json({ error: 'Invalid limit parameter' });
      }
      req.query.limit = limit;
    }
    
    // Validate offset parameter
    if (req.query.offset) {
      const offset = sanitizeNumber(req.query.offset, { min: 0, max: 1000000, allowNegative: false });
      if (offset === null) {
        return res.status(400).json({ error: 'Invalid offset parameter' });
      }
      req.query.offset = offset;
    }
    
    // Validate days parameter
    if (req.query.days) {
      const days = sanitizeNumber(req.query.days, { min: 1, max: 365, allowNegative: false });
      if (days === null) {
        return res.status(400).json({ error: 'Invalid days parameter' });
      }
      req.query.days = days;
    }
    
    // Check for SQL injection in all query params
    for (const [key, value] of Object.entries(req.query)) {
      if (!isValidSQLParam(value)) {
        logger.warn('Potential SQL injection in query params', {
          key,
          value,
          userId: req.user?.userId,
          ip: req.ip
        });
        return res.status(400).json({ error: 'Invalid query parameter' });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Query validation error', { error: error.message });
    res.status(500).json({ error: 'Validation failed' });
  }
}

/**
 * Sanitize request body
 */
function sanitizeBody(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      // Recursively sanitize all string values
      req.body = sanitizeObject(req.body);
    }
    next();
  } catch (error) {
    logger.error('Body sanitization error', { error: error.message });
    res.status(500).json({ error: 'Request processing failed' });
  }
}

/**
 * Recursively sanitize object
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Don't sanitize password fields
      if (key.toLowerCase().includes('password')) {
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeString(value);
      }
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Validate content type
 */
function validateContentType(req, res, next) {
  // Only validate for POST, PUT, PATCH
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }
  
  const contentType = req.headers['content-type'];
  
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }
  
  next();
}

/**
 * Prevent parameter pollution
 */
function preventParameterPollution(req, res, next) {
  try {
    // Check for duplicate parameters
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        logger.warn('Parameter pollution attempt detected', {
          key,
          values: value,
          userId: req.user?.userId,
          ip: req.ip
        });
        return res.status(400).json({ error: 'Invalid request parameters' });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Parameter pollution check error', { error: error.message });
    res.status(500).json({ error: 'Request validation failed' });
  }
}

module.exports = {
  validateRegistration,
  validateLogin,
  validateTrade,
  validateQueryParams,
  sanitizeBody,
  validateContentType,
  preventParameterPollution
};
