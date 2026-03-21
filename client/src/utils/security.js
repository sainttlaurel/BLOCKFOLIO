/**
 * Client-Side Security Utilities
 * Input sanitization, XSS prevention, and secure data handling
 */

/**
 * Input Sanitization
 */

/**
 * Sanitize string to prevent XSS attacks
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
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
 * Sanitize HTML content
 * @param {string} html - HTML string
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
  if (typeof html !== 'string') return '';
  
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized;
}

/**
 * Sanitize cryptocurrency symbol
 * @param {string} symbol - Crypto symbol
 * @returns {string} Sanitized symbol
 */
export function sanitizeCryptoSymbol(symbol) {
  if (typeof symbol !== 'string') return '';
  return symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Validate and sanitize numeric input
 * @param {any} value - Numeric value
 * @param {object} options - Validation options
 * @returns {number|null} Validated number or null
 */
export function sanitizeNumber(value, options = {}) {
  const { min = -Infinity, max = Infinity, allowNegative = true, decimals = 8 } = options;
  
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
  
  // Round to specified decimals
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
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
 * Validate URL
 * @param {string} url - URL string
 * @returns {boolean} True if safe URL
 */
export function isValidURL(url) {
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
 * Data Protection
 */

/**
 * Mask sensitive data for display
 * @param {string} text - Text containing sensitive data
 * @returns {string} Masked text
 */
export function maskSensitiveData(text) {
  if (typeof text !== 'string') return '';
  
  let masked = text;
  
  // Mask email addresses
  masked = masked.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***');
  
  // Mask credit card numbers
  masked = masked.replace(/\b\d{16}\b/g, '****-****-****-****');
  
  // Mask phone numbers
  masked = masked.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '***-***-****');
  
  return masked;
}

/**
 * Create safe error message (no sensitive data)
 * @param {Error|string} error - Error object or message
 * @returns {string} Safe error message
 */
export function createSafeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  
  // Mask sensitive data
  const masked = maskSensitiveData(message);
  
  // Remove stack traces
  const withoutStack = masked.split('\n')[0];
  
  // Generic messages for common errors
  const genericMessages = {
    'Network Error': 'Unable to connect to server',
    'timeout': 'Request timeout',
    '401': 'Please log in to continue',
    '403': 'Access denied',
    '404': 'Resource not found',
    '500': 'Server error occurred',
  };
  
  for (const [key, value] of Object.entries(genericMessages)) {
    if (withoutStack.includes(key)) {
      return value;
    }
  }
  
  return withoutStack || 'An error occurred';
}

/**
 * Input Validation
 */

/**
 * Validate trading amount
 * @param {any} amount - Trading amount
 * @returns {object} Validation result
 */
export function validateTradingAmount(amount) {
  const num = sanitizeNumber(amount, { 
    min: 0.00000001, 
    max: 1000000000, 
    allowNegative: false,
    decimals: 8
  });
  
  if (num === null) {
    return { valid: false, error: 'Invalid trading amount' };
  }
  
  return { valid: true, value: num };
}

/**
 * Validate password strength
 * @param {string} password - Password string
 * @returns {object} Validation result
 */
export function validatePassword(password) {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase) {
    return { valid: false, error: 'Password must contain uppercase letters' };
  }
  
  if (!hasLowerCase) {
    return { valid: false, error: 'Password must contain lowercase letters' };
  }
  
  if (!hasNumber) {
    return { valid: false, error: 'Password must contain numbers' };
  }
  
  // Calculate strength
  let strength = 0;
  if (password.length >= 12) strength++;
  if (hasSpecial) strength++;
  if (/[A-Z].*[A-Z]/.test(password)) strength++;
  if (/[0-9].*[0-9]/.test(password)) strength++;
  
  return { 
    valid: true, 
    strength: strength >= 2 ? 'strong' : 'medium'
  };
}

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} maxLength - Maximum length
 * @returns {object} Validation result
 */
export function validateStringLength(str, maxLength = 1000) {
  if (typeof str !== 'string') {
    return { valid: false, error: 'Invalid input' };
  }
  
  if (str.length > maxLength) {
    return { valid: false, error: `Input too long (max ${maxLength} characters)` };
  }
  
  return { valid: true, value: str };
}

/**
 * CSRF Token Management
 */

let csrfToken = null;

/**
 * Get CSRF token from server
 * @returns {Promise<string>} CSRF token
 */
export async function getCSRFToken() {
  if (csrfToken) {
    return csrfToken;
  }
  
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }
    
    const data = await response.json();
    csrfToken = data.csrfToken;
    
    return csrfToken;
  } catch (error) {
    console.error('CSRF token error:', error);
    return null;
  }
}

/**
 * Add CSRF token to request headers
 * @param {object} headers - Request headers
 * @returns {object} Headers with CSRF token
 */
export async function addCSRFToken(headers = {}) {
  const token = await getCSRFToken();
  
  if (token) {
    headers['X-CSRF-Token'] = token;
  }
  
  return headers;
}

/**
 * Clear cached CSRF token
 */
export function clearCSRFToken() {
  csrfToken = null;
}

/**
 * Secure Storage
 */

/**
 * Securely store data in localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
export function secureStore(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error('Secure storage error:', error);
  }
}

/**
 * Securely retrieve data from localStorage
 * @param {string} key - Storage key
 * @returns {any} Retrieved value
 */
export function secureRetrieve(key) {
  try {
    const serialized = localStorage.getItem(key);
    if (!serialized) return null;
    
    return JSON.parse(serialized);
  } catch (error) {
    console.error('Secure retrieval error:', error);
    return null;
  }
}

/**
 * Securely remove data from localStorage
 * @param {string} key - Storage key
 */
export function secureRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Secure removal error:', error);
  }
}

/**
 * Content Security
 */

/**
 * Check if content is safe to render
 * @param {string} content - Content to check
 * @returns {boolean} True if safe
 */
export function isSafeContent(content) {
  if (typeof content !== 'string') return false;
  
  // Check for script tags
  if (/<script/i.test(content)) return false;
  
  // Check for event handlers
  if (/on\w+\s*=/i.test(content)) return false;
  
  // Check for javascript: protocol
  if (/javascript:/i.test(content)) return false;
  
  // Check for data: protocol
  if (/data:text\/html/i.test(content)) return false;
  
  return true;
}

/**
 * Escape HTML for safe rendering
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHTML(text) {
  if (typeof text !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Rate Limiting (Client-Side)
 */

const rateLimitMap = new Map();

/**
 * Check if action is rate limited
 * @param {string} action - Action name
 * @param {number} maxCalls - Maximum calls
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} True if allowed
 */
export function checkRateLimit(action, maxCalls = 10, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(action) || { calls: [], windowStart: now };
  
  // Remove old calls outside window
  record.calls = record.calls.filter(time => now - time < windowMs);
  
  // Check if limit exceeded
  if (record.calls.length >= maxCalls) {
    return false;
  }
  
  // Add current call
  record.calls.push(now);
  rateLimitMap.set(action, record);
  
  return true;
}

export default {
  sanitizeString,
  sanitizeHTML,
  sanitizeCryptoSymbol,
  sanitizeNumber,
  isValidEmail,
  isValidURL,
  maskSensitiveData,
  createSafeErrorMessage,
  validateTradingAmount,
  validatePassword,
  validateStringLength,
  getCSRFToken,
  addCSRFToken,
  clearCSRFToken,
  secureStore,
  secureRetrieve,
  secureRemove,
  isSafeContent,
  escapeHTML,
  checkRateLimit
};
