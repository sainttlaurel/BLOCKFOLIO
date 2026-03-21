/**
 * Security Utilities
 * Comprehensive security functions for data protection and validation
 */

const crypto = require('crypto');

/**
 * Input Sanitization
 */

/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Sanitize HTML to remove dangerous tags and attributes
 * @param {string} html - HTML string
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(html) {
  if (typeof html !== 'string') return '';
  
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized;
}

/**
 * Validate and sanitize cryptocurrency symbol
 * @param {string} symbol - Cryptocurrency symbol
 * @returns {string} Sanitized symbol (alphanumeric only)
 */
function sanitizeCryptoSymbol(symbol) {
  if (typeof symbol !== 'string') return '';
  return symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Validate and sanitize numeric input
 * @param {any} value - Numeric value
 * @param {object} options - Validation options
 * @returns {number|null} Validated number or null if invalid
 */
function sanitizeNumber(value, options = {}) {
  const { min = -Infinity, max = Infinity, allowNegative = true } = options;
  
  const num = parseFloat(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  if (!allowNegative && num < 0) {
    return null;
  }
  
  if (num < min || num > max) {
    return null;
  }
  
  return num;
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) return false;
  
  // Check for dangerous characters
  if (email.includes('<') || email.includes('>') || 
      email.includes('"') || email.includes("'") || 
      email.includes('\\')) {
    return false;
  }
  
  return true;
}

/**
 * Validate URL and prevent dangerous protocols
 * @param {string} url - URL string
 * @returns {boolean} True if safe URL
 */
function isValidURL(url) {
  if (typeof url !== 'string') return false;
  
  const lowerUrl = url.toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return false;
    }
  }
  
  // Only allow http and https
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    return false;
  }
  
  return true;
}

/**
 * Data Masking and Protection
 */

/**
 * Mask sensitive data in strings
 * @param {string} text - Text containing sensitive data
 * @returns {string} Text with masked sensitive data
 */
function maskSensitiveData(text) {
  if (typeof text !== 'string') return '';
  
  let masked = text;
  
  // Mask passwords
  masked = masked.replace(/password[=:]\s*\S+/gi, 'password=***');
  
  // Mask tokens
  masked = masked.replace(/token[=:]\s*\S+/gi, 'token=***');
  masked = masked.replace(/bearer\s+\S+/gi, 'bearer ***');
  
  // Mask API keys
  masked = masked.replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=***');
  
  // Mask credit card numbers (16 digits)
  masked = masked.replace(/\b\d{16}\b/g, '****-****-****-****');
  
  // Mask email addresses
  masked = masked.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***');
  
  // Mask JWT tokens (looks like xxx.yyy.zzz)
  masked = masked.replace(/\b[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g, '***.***.***.***');
  
  return masked;
}

/**
 * Create safe error message for users (no sensitive data)
 * @param {Error|string} error - Error object or message
 * @returns {string} Safe error message
 */
function createSafeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  
  // Mask any sensitive data
  const masked = maskSensitiveData(message);
  
  // Remove stack traces
  const withoutStack = masked.split('\n')[0];
  
  // Generic message for common errors
  const genericMessages = {
    'ECONNREFUSED': 'Service temporarily unavailable',
    'ETIMEDOUT': 'Request timeout',
    'ENOTFOUND': 'Service not found',
    'UNAUTHORIZED': 'Authentication required',
    'FORBIDDEN': 'Access denied',
  };
  
  for (const [key, value] of Object.entries(genericMessages)) {
    if (withoutStack.includes(key)) {
      return value;
    }
  }
  
  return withoutStack || 'An error occurred';
}

/**
 * CSRF Protection
 */

/**
 * Generate CSRF token
 * @returns {string} CSRF token
 */
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token
 * @param {string} token - Token to validate
 * @param {string} sessionToken - Token from session
 * @returns {boolean} True if valid
 */
function validateCSRFToken(token, sessionToken) {
  if (!token || !sessionToken) return false;
  
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken)
    );
  } catch (error) {
    return false;
  }
}

/**
 * SQL Injection Prevention
 */

/**
 * Validate SQL parameter to prevent injection
 * @param {any} param - SQL parameter
 * @returns {boolean} True if safe
 */
function isValidSQLParam(param) {
  if (param === null || param === undefined) return true;
  
  const str = String(param);
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|\;|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /('.*OR.*'.*=.*')/i,
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(str)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Rate Limiting Helpers
 */

/**
 * Create rate limit key for user
 * @param {string} userId - User ID
 * @param {string} action - Action name
 * @returns {string} Rate limit key
 */
function createRateLimitKey(userId, action) {
  return `ratelimit:${userId}:${action}`;
}

/**
 * Data Encryption
 */

/**
 * Encrypt sensitive data
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key
 * @returns {string} Encrypted data (iv:encrypted)
 */
function encryptData(data, key) {
  const algorithm = 'aes-256-cbc';
  const keyBuffer = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Encrypted data (iv:encrypted)
 * @param {string} key - Encryption key
 * @returns {string} Decrypted data
 */
function decryptData(encryptedData, key) {
  const algorithm = 'aes-256-cbc';
  const keyBuffer = crypto.createHash('sha256').update(key).digest();
  
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Session Security
 */

/**
 * Generate secure session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash data for comparison (e.g., for session validation)
 * @param {string} data - Data to hash
 * @returns {string} Hash
 */
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Input Validation
 */

/**
 * Validate trading amount
 * @param {any} amount - Trading amount
 * @returns {object} Validation result
 */
function validateTradingAmount(amount) {
  const num = sanitizeNumber(amount, { min: 0.00000001, max: 1000000000, allowNegative: false });
  
  if (num === null) {
    return { valid: false, error: 'Invalid trading amount' };
  }
  
  return { valid: true, value: num };
}

/**
 * Validate cryptocurrency price
 * @param {any} price - Price value
 * @returns {object} Validation result
 */
function validatePrice(price) {
  const num = sanitizeNumber(price, { min: 0.00000001, max: 10000000, allowNegative: false });
  
  if (num === null) {
    return { valid: false, error: 'Invalid price' };
  }
  
  return { valid: true, value: num };
}

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} maxLength - Maximum length
 * @returns {object} Validation result
 */
function validateStringLength(str, maxLength = 1000) {
  if (typeof str !== 'string') {
    return { valid: false, error: 'Invalid string' };
  }
  
  if (str.length > maxLength) {
    return { valid: false, error: `String too long (max ${maxLength} characters)` };
  }
  
  return { valid: true, value: str };
}

/**
 * Security Headers
 */

/**
 * Get recommended security headers
 * @returns {object} Security headers
 */
function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.coingecko.com",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
}

module.exports = {
  // Input Sanitization
  sanitizeString,
  sanitizeHTML,
  sanitizeCryptoSymbol,
  sanitizeNumber,
  isValidEmail,
  isValidURL,
  
  // Data Masking
  maskSensitiveData,
  createSafeErrorMessage,
  
  // CSRF Protection
  generateCSRFToken,
  validateCSRFToken,
  
  // SQL Injection Prevention
  isValidSQLParam,
  
  // Rate Limiting
  createRateLimitKey,
  
  // Data Encryption
  encryptData,
  decryptData,
  
  // Session Security
  generateSessionId,
  hashData,
  
  // Input Validation
  validateTradingAmount,
  validatePrice,
  validateStringLength,
  
  // Security Headers
  getSecurityHeaders
};
