/**
 * Client-side logging utility
 * Provides structured logging with different levels
 */

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Format log message with timestamp
   */
  formatMessage(level, message, data = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  /**
   * Store log in memory
   */
  storeLog(logEntry) {
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Send logs to server (for critical errors)
   */
  async sendToServer(logEntry) {
    try {
      // Only send errors and critical warnings to server
      if (logEntry.level === 'error' || logEntry.level === 'critical') {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        }).catch(() => {
          // Silently fail if server is unavailable
        });
      }
    } catch (error) {
      // Don't log errors from logging itself
    }
  }

  /**
   * Log error message
   */
  error(message, data = {}) {
    const logEntry = this.formatMessage('error', message, data);
    console.error(`[ERROR] ${message}`, data);
    this.storeLog(logEntry);
    this.sendToServer(logEntry);
  }

  /**
   * Log warning message
   */
  warn(message, data = {}) {
    const logEntry = this.formatMessage('warn', message, data);
    console.warn(`[WARN] ${message}`, data);
    this.storeLog(logEntry);
  }

  /**
   * Log info message
   */
  info(message, data = {}) {
    const logEntry = this.formatMessage('info', message, data);
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data);
    }
    this.storeLog(logEntry);
  }

  /**
   * Log debug message (only in development)
   */
  debug(message, data = {}) {
    if (this.isDevelopment) {
      const logEntry = this.formatMessage('debug', message, data);
      console.log(`[DEBUG] ${message}`, data);
      this.storeLog(logEntry);
    }
  }

  /**
   * Log trading operation
   */
  logTrade(operation, data) {
    const logEntry = this.formatMessage('trade', `Trade: ${operation}`, data);
    console.log(`[TRADE] ${operation}`, data);
    this.storeLog(logEntry);
  }

  /**
   * Log API call
   */
  logApiCall(method, url, duration, status) {
    const logEntry = this.formatMessage('api', `API ${method} ${url}`, {
      method,
      url,
      duration,
      status
    });
    
    if (this.isDevelopment) {
      console.log(`[API] ${method} ${url} - ${status} (${duration}ms)`);
    }
    
    this.storeLog(logEntry);
  }

  /**
   * Log performance metric
   */
  logPerformance(metric, value, data = {}) {
    const logEntry = this.formatMessage('performance', `Performance: ${metric}`, {
      metric,
      value,
      ...data
    });
    
    if (this.isDevelopment) {
      console.log(`[PERFORMANCE] ${metric}: ${value}`, data);
    }
    
    this.storeLog(logEntry);
    
    // Warn on poor performance
    if (metric === 'loadTime' && value > 2000) {
      this.warn('Slow page load detected', { loadTime: value });
    }
  }

  /**
   * Get all logs
   */
  getLogs(level = null) {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get logs summary
   */
  getSummary() {
    const summary = {
      total: this.logs.length,
      byLevel: {}
    };

    this.logs.forEach(log => {
      summary.byLevel[log.level] = (summary.byLevel[log.level] || 0) + 1;
    });

    return summary;
  }
}

// Create singleton instance
const logger = new Logger();

// Setup global error handler
window.addEventListener('error', (event) => {
  logger.error('Uncaught error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.stack
  });
});

// Setup unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
    promise: event.promise
  });
});

export default logger;
