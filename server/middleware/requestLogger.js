/**
 * Request logging middleware
 * Tracks API performance and logs all requests
 */

const logger = require('../utils/logger');

/**
 * Middleware to log all HTTP requests with timing information
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logRequest(req, res, duration);
    
    // Track slow requests
    if (duration > 1000) {
      logger.warn('Slow API request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`
      });
    }
  });
  
  next();
}

/**
 * Middleware to track API endpoint performance
 */
function performanceTracker(endpointName) {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.performance(endpointName, duration, {
        method: req.method,
        status: res.statusCode
      });
    });
    
    next();
  };
}

module.exports = {
  requestLogger,
  performanceTracker
};
