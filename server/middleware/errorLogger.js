/**
 * Error logging middleware
 * Captures and logs all errors with context
 */

const logger = require('../utils/logger');

/**
 * Error logging middleware
 * Should be placed after all routes
 */
function errorLogger(err, req, res, next) {
  // Log the error with full context
  logger.error('Application error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Pass to next error handler
  next(err);
}

/**
 * Unhandled rejection handler
 */
function setupUnhandledRejectionHandler() {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason,
      promise: promise
    });
  });
}

/**
 * Uncaught exception handler
 */
function setupUncaughtExceptionHandler() {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });
    
    // Give time to write logs before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}

module.exports = {
  errorLogger,
  setupUnhandledRejectionHandler,
  setupUncaughtExceptionHandler
};
