/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const { generateCSRFToken, validateCSRFToken } = require('../utils/security');
const logger = require('../utils/logger');

// Store CSRF tokens in memory (in production, use Redis or session store)
const csrfTokens = new Map();

// Token expiration time (1 hour)
const TOKEN_EXPIRATION = 60 * 60 * 1000;

/**
 * Generate and attach CSRF token to session
 */
function generateToken(req, res, next) {
  try {
    // Generate token
    const token = generateCSRFToken();
    
    // Store with user ID or session ID
    const userId = req.user?.userId || req.sessionID || req.ip;
    
    csrfTokens.set(userId, {
      token,
      createdAt: Date.now()
    });
    
    // Attach to response
    res.locals.csrfToken = token;
    
    // Clean up expired tokens periodically
    cleanupExpiredTokens();
    
    next();
  } catch (error) {
    logger.error('CSRF token generation error', { error: error.message });
    next(error);
  }
}

/**
 * Validate CSRF token from request
 */
function validateToken(req, res, next) {
  try {
    // Skip validation for GET, HEAD, OPTIONS (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Get token from header or body
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    
    if (!token) {
      logger.warn('CSRF token missing', {
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      return res.status(403).json({ error: 'CSRF token missing' });
    }
    
    // Get stored token
    const userId = req.user?.userId || req.sessionID || req.ip;
    const stored = csrfTokens.get(userId);
    
    if (!stored) {
      logger.warn('CSRF token not found in store', {
        userId,
        method: req.method,
        path: req.path
      });
      return res.status(403).json({ error: 'CSRF token invalid' });
    }
    
    // Check expiration
    if (Date.now() - stored.createdAt > TOKEN_EXPIRATION) {
      csrfTokens.delete(userId);
      logger.warn('CSRF token expired', { userId });
      return res.status(403).json({ error: 'CSRF token expired' });
    }
    
    // Validate token
    if (!validateCSRFToken(token, stored.token)) {
      logger.warn('CSRF token validation failed', {
        userId,
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      return res.status(403).json({ error: 'CSRF token invalid' });
    }
    
    next();
  } catch (error) {
    logger.error('CSRF validation error', { error: error.message });
    res.status(500).json({ error: 'CSRF validation failed' });
  }
}

/**
 * Get CSRF token endpoint
 */
function getTokenEndpoint(req, res) {
  try {
    const token = generateCSRFToken();
    const userId = req.user?.userId || req.sessionID || req.ip;
    
    csrfTokens.set(userId, {
      token,
      createdAt: Date.now()
    });
    
    res.json({ csrfToken: token });
  } catch (error) {
    logger.error('CSRF token endpoint error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  
  for (const [userId, data] of csrfTokens.entries()) {
    if (now - data.createdAt > TOKEN_EXPIRATION) {
      csrfTokens.delete(userId);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredTokens, 10 * 60 * 1000);

module.exports = {
  generateToken,
  validateToken,
  getTokenEndpoint
};
