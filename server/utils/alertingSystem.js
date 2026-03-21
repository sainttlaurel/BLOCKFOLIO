/**
 * Alerting system for performance degradation and critical issues
 * Supports multiple notification channels and alert rules
 */

const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class AlertingSystem {
  constructor() {
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.notificationChannels = new Map();
    this.alertFile = path.join(__dirname, '../../logs/alerts.log');
    this.maxHistorySize = 1000;

    // Initialize default alert rules
    this.initializeDefaultRules();
  }

  /**
   * Initialize default alert rules
   */
  initializeDefaultRules() {
    // High response time alert
    this.addRule({
      id: 'high_response_time',
      name: 'High API Response Time',
      condition: (metrics) => metrics.performance?.avgResponseTime > 1000,
      severity: 'warning',
      cooldown: 300000, // 5 minutes
      message: (metrics) => 
        `Average response time is ${metrics.performance.avgResponseTime}ms (threshold: 1000ms)`
    });

    // High error rate alert
    this.addRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      condition: (metrics) => {
        const total = metrics.performance?.apiCalls?.total || 0;
        const errors = metrics.errors?.total || 0;
        return total > 0 && (errors / total) * 100 > 5;
      },
      severity: 'critical',
      cooldown: 300000,
      message: (metrics) => {
        const total = metrics.performance.apiCalls.total;
        const errors = metrics.errors.total;
        const rate = ((errors / total) * 100).toFixed(2);
        return `Error rate is ${rate}% (threshold: 5%)`;
      }
    });

    // High memory usage alert
    this.addRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      condition: (metrics) => metrics.system?.memory?.heapUsed > 500,
      severity: 'warning',
      cooldown: 600000, // 10 minutes
      message: (metrics) => 
        `Memory usage is ${metrics.system.memory.heapUsed}MB (threshold: 500MB)`
    });

    // System unhealthy alert
    this.addRule({
      id: 'system_unhealthy',
      name: 'System Unhealthy',
      condition: (metrics) => metrics.health === 'unhealthy',
      severity: 'critical',
      cooldown: 300000,
      message: (metrics) => 
        `System health is unhealthy. Issues: ${metrics.issues?.join(', ') || 'Unknown'}`
    });

    // Database connection alert
    this.addRule({
      id: 'database_error',
      name: 'Database Connection Issues',
      condition: (metrics) => {
        const dbErrors = metrics.errors?.byType?.database || 0;
        return dbErrors > 5;
      },
      severity: 'critical',
      cooldown: 300000,
      message: (metrics) => 
        `Database errors detected: ${metrics.errors.byType.database} errors`
    });

    // API rate limit alert
    this.addRule({
      id: 'api_rate_limit',
      name: 'API Rate Limit Approaching',
      condition: (metrics) => {
        const rateLimitErrors = metrics.errors?.byType?.rate_limit || 0;
        return rateLimitErrors > 10;
      },
      severity: 'warning',
      cooldown: 600000,
      message: (metrics) => 
        `API rate limit errors: ${metrics.errors.byType.rate_limit}`
    });

    // Slow endpoint alert
    this.addRule({
      id: 'slow_endpoint',
      name: 'Slow Endpoint Detected',
      condition: (metrics) => {
        const slowest = metrics.performance?.apiCalls?.slowestEndpoint;
        return slowest && slowest.avgDuration > 2000;
      },
      severity: 'warning',
      cooldown: 600000,
      message: (metrics) => {
        const slowest = metrics.performance.apiCalls.slowestEndpoint;
        return `Slow endpoint: ${slowest.endpoint} (${slowest.avgDuration}ms)`;
      }
    });
  }

  /**
   * Add alert rule
   */
  addRule(rule) {
    if (!rule.id || !rule.condition) {
      throw new Error('Alert rule must have id and condition');
    }

    const fullRule = {
      name: rule.name || rule.id,
      condition: rule.condition,
      severity: rule.severity || 'info',
      cooldown: rule.cooldown || 300000, // Default 5 minutes
      message: rule.message || (() => `Alert: ${rule.id}`),
      enabled: true,
      lastTriggered: null
    };

    this.alertRules.set(rule.id, fullRule);
    logger.info('Alert rule added', { ruleId: rule.id, name: fullRule.name });
  }

  /**
   * Remove alert rule
   */
  removeRule(ruleId) {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      logger.info('Alert rule removed', { ruleId });
    }
    return removed;
  }

  /**
   * Enable/disable alert rule
   */
  toggleRule(ruleId, enabled) {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      logger.info('Alert rule toggled', { ruleId, enabled });
      return true;
    }
    return false;
  }

  /**
   * Check metrics against all alert rules
   */
  checkAlerts(metrics) {
    const triggeredAlerts = [];

    this.alertRules.forEach((rule, ruleId) => {
      if (!rule.enabled) return;

      // Check cooldown period
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered;
        if (timeSinceLastTrigger < rule.cooldown) {
          return; // Still in cooldown
        }
      }

      // Evaluate condition
      try {
        if (rule.condition(metrics)) {
          const alert = this.triggerAlert(ruleId, rule, metrics);
          triggeredAlerts.push(alert);
        }
      } catch (error) {
        logger.error('Error evaluating alert rule', {
          ruleId,
          error: error.message
        });
      }
    });

    return triggeredAlerts;
  }

  /**
   * Trigger alert
   */
  triggerAlert(ruleId, rule, metrics) {
    const alert = {
      id: `${ruleId}_${Date.now()}`,
      ruleId,
      name: rule.name,
      severity: rule.severity,
      message: typeof rule.message === 'function' ? rule.message(metrics) : rule.message,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
      metrics: this.extractRelevantMetrics(metrics)
    };

    // Update rule last triggered time
    rule.lastTriggered = Date.now();

    // Store active alert
    this.activeAlerts.set(alert.id, alert);

    // Add to history
    this.alertHistory.push(alert);
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.shift();
    }

    // Log alert
    this.logAlert(alert);

    // Send notifications
    this.sendNotifications(alert);

    logger.warn('Alert triggered', {
      alertId: alert.id,
      ruleId,
      severity: alert.severity,
      message: alert.message
    });

    return alert;
  }

  /**
   * Extract relevant metrics for alert
   */
  extractRelevantMetrics(metrics) {
    return {
      health: metrics.health,
      avgResponseTime: metrics.performance?.avgResponseTime,
      errorCount: metrics.errors?.total,
      memoryUsage: metrics.system?.memory?.heapUsed,
      uptime: metrics.performance?.uptime
    };
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId, acknowledgedBy = 'system') {
    const alert = this.activeAlerts.get(alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = Date.now();

      logger.info('Alert acknowledged', {
        alertId,
        acknowledgedBy
      });

      return true;
    }
    return false;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId, resolvedBy = 'system', resolution = '') {
    const alert = this.activeAlerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = Date.now();
      alert.resolution = resolution;

      // Remove from active alerts
      this.activeAlerts.delete(alertId);

      logger.info('Alert resolved', {
        alertId,
        resolvedBy,
        duration: alert.resolvedAt - alert.timestamp
      });

      return true;
    }
    return false;
  }

  /**
   * Auto-resolve alerts based on current metrics
   */
  autoResolveAlerts(metrics) {
    const resolved = [];

    this.activeAlerts.forEach((alert, alertId) => {
      const rule = this.alertRules.get(alert.ruleId);
      if (!rule) return;

      // Check if condition is no longer met
      try {
        if (!rule.condition(metrics)) {
          this.resolveAlert(alertId, 'auto', 'Condition no longer met');
          resolved.push(alertId);
        }
      } catch (error) {
        logger.error('Error auto-resolving alert', {
          alertId,
          error: error.message
        });
      }
    });

    return resolved;
  }

  /**
   * Add notification channel
   */
  addNotificationChannel(name, handler) {
    this.notificationChannels.set(name, handler);
    logger.info('Notification channel added', { name });
  }

  /**
   * Send notifications through all channels
   */
  sendNotifications(alert) {
    this.notificationChannels.forEach((handler, name) => {
      try {
        handler(alert);
      } catch (error) {
        logger.error('Failed to send notification', {
          channel: name,
          alertId: alert.id,
          error: error.message
        });
      }
    });
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(severity = null) {
    let alerts = Array.from(this.activeAlerts.values());

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100, severity = null) {
    let history = [...this.alertHistory];

    if (severity) {
      history = history.filter(a => a.severity === severity);
    }

    return history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(timeRange = 86400000) { // Default: 24 hours
    const cutoff = Date.now() - timeRange;
    const recentAlerts = this.alertHistory.filter(a => a.timestamp >= cutoff);

    const stats = {
      total: recentAlerts.length,
      active: this.activeAlerts.size,
      bySeverity: {
        critical: 0,
        warning: 0,
        info: 0
      },
      byRule: {},
      avgResolutionTime: 0,
      acknowledgedRate: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;
    let acknowledgedCount = 0;

    recentAlerts.forEach(alert => {
      // Count by severity
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;

      // Count by rule
      stats.byRule[alert.ruleId] = (stats.byRule[alert.ruleId] || 0) + 1;

      // Calculate resolution time
      if (alert.resolved && alert.resolvedAt) {
        totalResolutionTime += alert.resolvedAt - alert.timestamp;
        resolvedCount++;
      }

      // Count acknowledged
      if (alert.acknowledged) {
        acknowledgedCount++;
      }
    });

    if (resolvedCount > 0) {
      stats.avgResolutionTime = Math.round(totalResolutionTime / resolvedCount);
    }

    if (recentAlerts.length > 0) {
      stats.acknowledgedRate = ((acknowledgedCount / recentAlerts.length) * 100).toFixed(2);
    }

    return stats;
  }

  /**
   * Log alert to file
   */
  logAlert(alert) {
    const logEntry = JSON.stringify({
      timestamp: new Date(alert.timestamp).toISOString(),
      ...alert
    }) + '\n';

    try {
      fs.appendFileSync(this.alertFile, logEntry);
    } catch (error) {
      logger.error('Failed to write alert log', { error: error.message });
    }
  }

  /**
   * Clear old alerts from history
   */
  clearOldAlerts(maxAge = 604800000) { // Default: 7 days
    const cutoff = Date.now() - maxAge;
    const initialLength = this.alertHistory.length;

    this.alertHistory = this.alertHistory.filter(a => a.timestamp >= cutoff);

    const removed = initialLength - this.alertHistory.length;
    if (removed > 0) {
      logger.info('Old alerts cleared', { removed, remaining: this.alertHistory.length });
    }
  }

  /**
   * Export alert configuration
   */
  exportConfiguration() {
    const rules = {};
    this.alertRules.forEach((rule, id) => {
      rules[id] = {
        name: rule.name,
        severity: rule.severity,
        cooldown: rule.cooldown,
        enabled: rule.enabled
      };
    });

    return {
      rules,
      channels: Array.from(this.notificationChannels.keys())
    };
  }
}

// Create singleton instance
const alertingSystem = new AlertingSystem();

// Add default console notification channel
alertingSystem.addNotificationChannel('console', (alert) => {
  const prefix = alert.severity === 'critical' ? '🚨' : '⚠️';
  console.log(`${prefix} [${alert.severity.toUpperCase()}] ${alert.name}: ${alert.message}`);
});

module.exports = alertingSystem;
