/**
 * Security Audit Logging Middleware
 * Logs security-relevant events for monitoring and compliance
 */

const logger = require('../utils/logger');
const { maskSensitiveData } = require('../utils/security');

/**
 * Log authentication attempts
 */
function logAuthAttempt(req, res, next) {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    const success = res.statusCode === 200 || res.statusCode === 201;
    
    logger.info('Authentication attempt', {
      type: req.path.includes('login') ? 'login' : 'register',
      success,
      email: req.body.email ? maskSensitiveData(req.body.email) : undefined,
      username: req.body.username,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    
    return originalJson(data);
  };
  
  next();
}

/**
 * Log trading activity
 */
function logTradingActivity(req, res, next) {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    const success = res.statusCode === 200;
    
    logger.info('Trading activity', {
      type: req.path.includes('buy') ? 'buy' : 'sell',
      success,
      userId: req.user?.userId,
      coinSymbol: req.body.coinSymbol,
      amount: req.body.amount,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    return originalJson(data);
  };
  
  next();
}

/**
 * Log failed authentication attempts
 */
function logFailedAuth(req, res, next) {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.warn('Failed authentication', {
        path: req.path,
        method: req.method,
        email: req.body.email ? maskSensitiveData(req.body.email) : undefined,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      });
    }
    
    return originalJson(data);
  };
  
  next();
}

/**
 * Log suspicious activity
 */
function logSuspiciousActivity(type, details, req) {
  logger.warn('Suspicious activity detected', {
    type,
    details,
    userId: req.user?.userId,
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
}

/**
 * Log security events
 */
function logSecurityEvent(event, details, req) {
  logger.info('Security event', {
    event,
    details,
    userId: req.user?.userId,
    ip: req.ip,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}

/**
 * Monitor for brute force attempts
 */
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkBruteForce(req, res, next) {
  const identifier = req.body.email || req.ip;
  const now = Date.now();
  
  // Get or create attempt record
  let attempts = loginAttempts.get(identifier) || { count: 0, firstAttempt: now, blocked: false };
  
  // Reset if window expired
  if (now - attempts.firstAttempt > ATTEMPT_WINDOW) {
    attempts = { count: 0, firstAttempt: now, blocked: false };
  }
  
  // Check if blocked
  if (attempts.blocked) {
    const timeLeft = Math.ceil((ATTEMPT_WINDOW - (now - attempts.firstAttempt)) / 1000 / 60);
    
    logSuspiciousActivity('brute_force_blocked', {
      identifier: maskSensitiveData(identifier),
      attempts: attempts.count,
      timeLeft: `${timeLeft} minutes`
    }, req);
    
    return res.status(429).json({ 
      error: `Too many login attempts. Please try again in ${timeLeft} minutes.` 
    });
  }
  
  // Increment attempts
  attempts.count++;
  
  // Block if exceeded
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.blocked = true;
    
    logSuspiciousActivity('brute_force_detected', {
      identifier: maskSensitiveData(identifier),
      attempts: attempts.count
    }, req);
  }
  
  loginAttempts.set(identifier, attempts);
  
  // Cleanup old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupLoginAttempts();
  }
  
  next();
}

/**
 * Clean up old login attempt records
 */
function cleanupLoginAttempts() {
  const now = Date.now();
  
  for (const [identifier, attempts] of loginAttempts.entries()) {
    if (now - attempts.firstAttempt > ATTEMPT_WINDOW) {
      loginAttempts.delete(identifier);
    }
  }
}

/**
 * Log data access
 */
function logDataAccess(req, res, next) {
  // Log access to sensitive endpoints
  const sensitiveEndpoints = ['/api/wallet', '/api/transactions', '/api/auth/me'];
  
  if (sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    logger.info('Data access', {
      endpoint: req.path,
      method: req.method,
      userId: req.user?.userId,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

/**
 * Monitor for unusual patterns
 */
const requestCounts = new Map();
const RATE_WINDOW = 60 * 1000; // 1 minute
const UNUSUAL_THRESHOLD = 100; // requests per minute

function monitorUnusualPatterns(req, res, next) {
  const identifier = req.user?.userId || req.ip;
  const now = Date.now();
  
  // Get or create request record
  let record = requestCounts.get(identifier) || { count: 0, windowStart: now };
  
  // Reset if window expired
  if (now - record.windowStart > RATE_WINDOW) {
    record = { count: 0, windowStart: now };
  }
  
  record.count++;
  
  // Check for unusual activity
  if (record.count > UNUSUAL_THRESHOLD) {
    logSuspiciousActivity('unusual_request_pattern', {
      identifier: req.user?.userId || maskSensitiveData(req.ip),
      requestCount: record.count,
      timeWindow: '1 minute'
    }, req);
  }
  
  requestCounts.set(identifier, record);
  
  // Cleanup periodically
  if (Math.random() < 0.01) {
    cleanupRequestCounts();
  }
  
  next();
}

/**
 * Clean up old request count records
 */
function cleanupRequestCounts() {
  const now = Date.now();
  
  for (const [identifier, record] of requestCounts.entries()) {
    if (now - record.windowStart > RATE_WINDOW) {
      requestCounts.delete(identifier);
    }
  }
}

/**
 * Log password changes
 */
function logPasswordChange(req, res, next) {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    if (res.statusCode === 200) {
      logger.info('Password changed', {
        userId: req.user?.userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      });
    }
    
    return originalJson(data);
  };
  
  next();
}

/**
 * Log account deletions
 */
function logAccountDeletion(req, res, next) {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    if (res.statusCode === 200) {
      logger.info('Account deleted', {
        userId: req.user?.userId,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }
    
    return originalJson(data);
  };
  
  next();
}

module.exports = {
  logAuthAttempt,
  logTradingActivity,
  logFailedAuth,
  logSuspiciousActivity,
  logSecurityEvent,
  checkBruteForce,
  logDataAccess,
  monitorUnusualPatterns,
  logPasswordChange,
  logAccountDeletion
};
