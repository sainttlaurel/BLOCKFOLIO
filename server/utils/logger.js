/**
 * Server-side logging utility using Winston
 * Provides structured logging with different levels and transports
 */

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log levels:
 * - error: Error events that might still allow the application to continue running
 * - warn: Warning events that indicate potential issues
 * - info: Informational messages that highlight progress
 * - http: HTTP request logging
 * - debug: Detailed information for debugging
 */

class Logger {
  constructor() {
    this.logFile = path.join(logsDir, 'app.log');
    this.errorFile = path.join(logsDir, 'error.log');
    this.performanceFile = path.join(logsDir, 'performance.log');
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}\n`;
  }

  writeToFile(file, content) {
    try {
      fs.appendFileSync(file, content);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  error(message, meta = {}) {
    const formatted = this.formatMessage('error', message, meta);
    console.error(formatted.trim());
    this.writeToFile(this.errorFile, formatted);
    this.writeToFile(this.logFile, formatted);
  }

  warn(message, meta = {}) {
    const formatted = this.formatMessage('warn', message, meta);
    console.warn(formatted.trim());
    this.writeToFile(this.logFile, formatted);
  }

  info(message, meta = {}) {
    const formatted = this.formatMessage('info', message, meta);
    console.log(formatted.trim());
    this.writeToFile(this.logFile, formatted);
  }

  http(message, meta = {}) {
    const formatted = this.formatMessage('http', message, meta);
    if (process.env.NODE_ENV === 'development') {
      console.log(formatted.trim());
    }
    this.writeToFile(this.logFile, formatted);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage('debug', message, meta);
      console.log(formatted.trim());
      this.writeToFile(this.logFile, formatted);
    }
  }

  performance(operation, duration, meta = {}) {
    const message = `${operation} completed in ${duration}ms`;
    const formatted = this.formatMessage('performance', message, meta);
    this.writeToFile(this.performanceFile, formatted);
    
    if (duration > 1000) {
      this.warn(`Slow operation detected: ${message}`, meta);
    }
  }

  // Log API requests
  logRequest(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    
    this.http(`${req.method} ${req.originalUrl} ${res.statusCode}`, meta);
  }

  // Log trading operations
  logTrade(userId, operation, data) {
    this.info(`Trade operation: ${operation}`, {
      userId,
      operation,
      ...data
    });
  }

  // Log authentication events
  logAuth(event, userId, success, meta = {}) {
    const message = `Auth ${event}: ${success ? 'SUCCESS' : 'FAILED'}`;
    this.info(message, { userId, event, success, ...meta });
  }

  // Log database operations
  logDatabase(operation, duration, meta = {}) {
    this.performance(`Database ${operation}`, duration, meta);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
