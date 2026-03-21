/**
 * Performance monitoring utility
 * Tracks system metrics and API performance
 */

const logger = require('./logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCalls: {},
      errors: {},
      responseTime: [],
      memoryUsage: []
    };
    
    this.startTime = Date.now();
  }

  /**
   * Track API call metrics
   */
  trackApiCall(endpoint, duration, status) {
    if (!this.metrics.apiCalls[endpoint]) {
      this.metrics.apiCalls[endpoint] = {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errors: 0
      };
    }

    const metric = this.metrics.apiCalls[endpoint];
    metric.count++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.count;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    
    if (status >= 400) {
      metric.errors++;
    }

    // Keep last 100 response times
    this.metrics.responseTime.push({ endpoint, duration, timestamp: Date.now() });
    if (this.metrics.responseTime.length > 100) {
      this.metrics.responseTime.shift();
    }
  }

  /**
   * Track error occurrences
   */
  trackError(type, message) {
    if (!this.metrics.errors[type]) {
      this.metrics.errors[type] = {
        count: 0,
        lastOccurrence: null,
        messages: []
      };
    }

    this.metrics.errors[type].count++;
    this.metrics.errors[type].lastOccurrence = new Date().toISOString();
    this.metrics.errors[type].messages.push({
      message,
      timestamp: new Date().toISOString()
    });

    // Keep only last 10 error messages
    if (this.metrics.errors[type].messages.length > 10) {
      this.metrics.errors[type].messages.shift();
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage() {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    });

    // Keep only last 60 readings (1 hour if recorded every minute)
    if (this.metrics.memoryUsage.length > 60) {
      this.metrics.memoryUsage.shift();
    }

    // Log warning if memory usage is high
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
      logger.warn('High memory usage detected', {
        heapUsedMB: heapUsedMB.toFixed(2),
        heapTotalMB: (usage.heapTotal / 1024 / 1024).toFixed(2)
      });
    }
  }

  /**
   * Get current metrics summary
   */
  getMetrics() {
    return {
      uptime: Date.now() - this.startTime,
      apiCalls: this.metrics.apiCalls,
      errors: this.metrics.errors,
      recentResponseTimes: this.metrics.responseTime.slice(-10),
      currentMemory: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1],
      averageResponseTime: this.calculateAverageResponseTime()
    };
  }

  /**
   * Calculate average response time across all endpoints
   */
  calculateAverageResponseTime() {
    if (this.metrics.responseTime.length === 0) return 0;
    
    const total = this.metrics.responseTime.reduce((sum, item) => sum + item.duration, 0);
    return (total / this.metrics.responseTime.length).toFixed(2);
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const avgResponseTime = parseFloat(this.calculateAverageResponseTime());
    const errorCount = Object.values(this.metrics.errors).reduce((sum, e) => sum + e.count, 0);
    const totalCalls = Object.values(this.metrics.apiCalls).reduce((sum, e) => sum + e.count, 0);
    const errorRate = totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0;

    let status = 'healthy';
    const issues = [];

    if (avgResponseTime > 1000) {
      status = 'degraded';
      issues.push('High average response time');
    }

    if (errorRate > 5) {
      status = 'unhealthy';
      issues.push('High error rate');
    }

    const currentMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    if (currentMemory) {
      const heapUsedMB = currentMemory.heapUsed / 1024 / 1024;
      if (heapUsedMB > 500) {
        status = 'degraded';
        issues.push('High memory usage');
      }
    }

    return {
      status,
      issues,
      metrics: {
        avgResponseTime: `${avgResponseTime}ms`,
        errorRate: `${errorRate.toFixed(2)}%`,
        totalCalls,
        errorCount
      }
    };
  }

  /**
   * Start periodic monitoring
   */
  startMonitoring(intervalMs = 60000) {
    // Record memory usage periodically
    this.monitoringInterval = setInterval(() => {
      this.recordMemoryUsage();
      
      // Log health status every 5 minutes
      if (Date.now() % 300000 < intervalMs) {
        const health = this.getHealthStatus();
        logger.info('System health check', health);
      }
    }, intervalMs);

    logger.info('Performance monitoring started', {
      interval: `${intervalMs}ms`
    });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      logger.info('Performance monitoring stopped');
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
