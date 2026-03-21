/**
 * Real-time performance monitoring with WebSocket support
 * Provides live metrics streaming to connected clients
 */

const performanceMonitor = require('./performanceMonitor');
const logger = require('./logger');

class RealtimeMonitor {
  constructor() {
    this.clients = new Set();
    this.metricsInterval = null;
    this.alertThresholds = {
      responseTime: 1000, // ms
      errorRate: 5, // percentage
      memoryUsage: 500, // MB
      cpuUsage: 80 // percentage
    };
    this.alerts = [];
  }

  /**
   * Initialize WebSocket server
   */
  initialize(wss) {
    this.wss = wss;

    wss.on('connection', (ws) => {
      this.clients.add(ws);
      logger.info('Real-time monitoring client connected', {
        totalClients: this.clients.size
      });

      // Send initial metrics
      this.sendMetrics(ws);

      ws.on('close', () => {
        this.clients.delete(ws);
        logger.info('Real-time monitoring client disconnected', {
          totalClients: this.clients.size
        });
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error', { error: error.message });
        this.clients.delete(ws);
      });
    });

    // Start broadcasting metrics
    this.startBroadcasting();
    logger.info('Real-time monitoring initialized');
  }

  /**
   * Start broadcasting metrics to all connected clients
   */
  startBroadcasting(intervalMs = 5000) {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(() => {
      const metrics = this.collectMetrics();
      this.checkAlerts(metrics);
      this.broadcast(metrics);
    }, intervalMs);
  }

  /**
   * Collect comprehensive metrics
   */
  collectMetrics() {
    const baseMetrics = performanceMonitor.getMetrics();
    const health = performanceMonitor.getHealthStatus();
    const systemMetrics = this.getSystemMetrics();

    return {
      timestamp: Date.now(),
      health: health.status,
      issues: health.issues,
      performance: {
        avgResponseTime: parseFloat(baseMetrics.averageResponseTime),
        uptime: baseMetrics.uptime,
        apiCalls: this.summarizeApiCalls(baseMetrics.apiCalls),
        recentResponseTimes: baseMetrics.recentResponseTimes
      },
      system: systemMetrics,
      errors: this.summarizeErrors(baseMetrics.errors),
      alerts: this.getRecentAlerts()
    };
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(usage.rss / 1024 / 1024), // MB
        external: Math.round(usage.external / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: Math.round(process.uptime())
    };
  }

  /**
   * Summarize API call metrics
   */
  summarizeApiCalls(apiCalls) {
    const summary = {
      total: 0,
      avgDuration: 0,
      errorCount: 0,
      slowestEndpoint: null,
      fastestEndpoint: null
    };

    let maxDuration = 0;
    let minDuration = Infinity;

    Object.entries(apiCalls).forEach(([endpoint, metrics]) => {
      summary.total += metrics.count;
      summary.errorCount += metrics.errors;

      if (metrics.avgDuration > maxDuration) {
        maxDuration = metrics.avgDuration;
        summary.slowestEndpoint = { endpoint, avgDuration: metrics.avgDuration };
      }

      if (metrics.avgDuration < minDuration) {
        minDuration = metrics.avgDuration;
        summary.fastestEndpoint = { endpoint, avgDuration: metrics.avgDuration };
      }
    });

    if (summary.total > 0) {
      const totalDuration = Object.values(apiCalls).reduce(
        (sum, m) => sum + m.totalDuration,
        0
      );
      summary.avgDuration = Math.round(totalDuration / summary.total);
    }

    return summary;
  }

  /**
   * Summarize error metrics
   */
  summarizeErrors(errors) {
    const summary = {
      total: 0,
      byType: {},
      recent: []
    };

    Object.entries(errors).forEach(([type, data]) => {
      summary.total += data.count;
      summary.byType[type] = data.count;

      if (data.messages.length > 0) {
        summary.recent.push({
          type,
          message: data.messages[data.messages.length - 1].message,
          timestamp: data.lastOccurrence
        });
      }
    });

    // Keep only 5 most recent errors
    summary.recent = summary.recent
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    return summary;
  }

  /**
   * Check metrics against alert thresholds
   */
  checkAlerts(metrics) {
    const now = Date.now();

    // Check response time
    if (metrics.performance.avgResponseTime > this.alertThresholds.responseTime) {
      this.createAlert('high_response_time', 'warning', {
        current: metrics.performance.avgResponseTime,
        threshold: this.alertThresholds.responseTime
      });
    }

    // Check memory usage
    if (metrics.system.memory.heapUsed > this.alertThresholds.memoryUsage) {
      this.createAlert('high_memory_usage', 'warning', {
        current: metrics.system.memory.heapUsed,
        threshold: this.alertThresholds.memoryUsage
      });
    }

    // Check error rate
    const errorRate = metrics.performance.apiCalls.total > 0
      ? (metrics.errors.total / metrics.performance.apiCalls.total) * 100
      : 0;

    if (errorRate > this.alertThresholds.errorRate) {
      this.createAlert('high_error_rate', 'critical', {
        current: errorRate.toFixed(2),
        threshold: this.alertThresholds.errorRate
      });
    }

    // Check health status
    if (metrics.health === 'unhealthy') {
      this.createAlert('system_unhealthy', 'critical', {
        issues: metrics.issues
      });
    }

    // Clean old alerts (older than 1 hour)
    this.alerts = this.alerts.filter(alert => now - alert.timestamp < 3600000);
  }

  /**
   * Create alert
   */
  createAlert(type, severity, data) {
    const alert = {
      id: `${type}_${Date.now()}`,
      type,
      severity,
      data,
      timestamp: Date.now(),
      acknowledged: false
    };

    // Check if similar alert exists in last 5 minutes
    const recentSimilar = this.alerts.find(
      a => a.type === type && Date.now() - a.timestamp < 300000
    );

    if (!recentSimilar) {
      this.alerts.push(alert);
      logger.warn(`Performance alert: ${type}`, { severity, data });

      // Broadcast alert immediately
      this.broadcast({
        type: 'alert',
        alert
      });
    }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 10) {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      logger.info('Alert acknowledged', { alertId });
      return true;
    }
    return false;
  }

  /**
   * Send metrics to specific client
   */
  sendMetrics(ws) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(JSON.stringify({
          type: 'metrics',
          data: this.collectMetrics()
        }));
      } catch (error) {
        logger.error('Failed to send metrics', { error: error.message });
      }
    }
  }

  /**
   * Broadcast data to all connected clients
   */
  broadcast(data) {
    const message = JSON.stringify({
      type: 'metrics',
      data
    });

    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(message);
        } catch (error) {
          logger.error('Failed to broadcast to client', { error: error.message });
          this.clients.delete(client);
        }
      }
    });
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(thresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    logger.info('Alert thresholds updated', this.alertThresholds);
  }

  /**
   * Stop broadcasting
   */
  stop() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    this.clients.forEach(client => {
      try {
        client.close();
      } catch (error) {
        // Ignore errors during cleanup
      }
    });

    this.clients.clear();
    logger.info('Real-time monitoring stopped');
  }
}

// Create singleton instance
const realtimeMonitor = new RealtimeMonitor();

module.exports = realtimeMonitor;
