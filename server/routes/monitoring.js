/**
 * Monitoring and analytics API routes
 * Provides endpoints for real-time monitoring, analytics, and alerting
 */

const express = require('express');
const router = express.Router();
const performanceMonitor = require('../utils/performanceMonitor');
const realtimeMonitor = require('../utils/realtimeMonitor');
const analyticsTracker = require('../utils/analyticsTracker');
const alertingSystem = require('../utils/alertingSystem');
const feedbackSystem = require('../utils/feedbackSystem');
const logger = require('../utils/logger');

/**
 * GET /api/monitoring/metrics
 * Get current performance metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics'
    });
  }
});

/**
 * GET /api/monitoring/health
 * Get system health status
 */
router.get('/health', (req, res) => {
  try {
    const health = performanceMonitor.getHealthStatus();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Failed to get health status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve health status'
    });
  }
});

/**
 * GET /api/monitoring/system
 * Get system information
 */
router.get('/system', (req, res) => {
  try {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const systemInfo = {
      uptime: Math.round(process.uptime()),
      memory: {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    };

    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    logger.error('Failed to get system info', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system information'
    });
  }
});

/**
 * POST /api/monitoring/logs
 * Receive client-side logs
 */
router.post('/logs', (req, res) => {
  try {
    const { level, message, data } = req.body;

    if (!level || !message) {
      return res.status(400).json({
        success: false,
        error: 'Level and message are required'
      });
    }

    // Log based on level
    switch (level) {
      case 'error':
        logger.error(`[Client] ${message}`, data);
        break;
      case 'warn':
        logger.warn(`[Client] ${message}`, data);
        break;
      case 'info':
        logger.info(`[Client] ${message}`, data);
        break;
      default:
        logger.debug(`[Client] ${message}`, data);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to process client log', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process log'
    });
  }
});

/**
 * GET /api/monitoring/realtime
 * Get real-time metrics (for polling)
 */
router.get('/realtime', (req, res) => {
  try {
    const metrics = realtimeMonitor.collectMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get realtime metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve realtime metrics'
    });
  }
});

/**
 * Analytics endpoints
 */

/**
 * POST /api/monitoring/analytics/session/start
 * Start user session tracking
 */
router.post('/analytics/session/start', (req, res) => {
  try {
    const { sessionId, userId, metadata } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const session = analyticsTracker.startSession(sessionId, userId, metadata);

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Failed to start session', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to start session'
    });
  }
});

/**
 * POST /api/monitoring/analytics/session/end
 * End user session tracking
 */
router.post('/analytics/session/end', (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const session = analyticsTracker.endSession(sessionId);

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Failed to end session', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
});

/**
 * POST /api/monitoring/analytics/event
 * Track analytics event
 */
router.post('/analytics/event', (req, res) => {
  try {
    const { sessionId, eventType, data } = req.body;

    if (!sessionId || !eventType) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and event type are required'
      });
    }

    analyticsTracker.trackEvent(sessionId, eventType, data);

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to track event', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to track event'
    });
  }
});

/**
 * POST /api/monitoring/analytics/feature
 * Track feature usage
 */
router.post('/analytics/feature', (req, res) => {
  try {
    const { sessionId, feature, action, metadata } = req.body;

    if (!feature || !action) {
      return res.status(400).json({
        success: false,
        error: 'Feature and action are required'
      });
    }

    analyticsTracker.trackFeatureUsage(sessionId, feature, action, metadata);

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to track feature usage', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to track feature usage'
    });
  }
});

/**
 * GET /api/monitoring/analytics/summary
 * Get analytics summary
 */
router.get('/analytics/summary', (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange) || 3600000; // Default: 1 hour
    const summary = analyticsTracker.getAnalyticsSummary(timeRange);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Failed to get analytics summary', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics summary'
    });
  }
});

/**
 * GET /api/monitoring/analytics/features
 * Get feature usage report
 */
router.get('/analytics/features', (req, res) => {
  try {
    const report = analyticsTracker.getFeatureUsageReport();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Failed to get feature usage report', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feature usage report'
    });
  }
});

/**
 * GET /api/monitoring/analytics/engagement/:userId
 * Get user engagement report
 */
router.get('/analytics/engagement/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const report = analyticsTracker.getUserEngagementReport(userId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'User engagement data not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Failed to get user engagement', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user engagement'
    });
  }
});

/**
 * Alerting endpoints
 */

/**
 * GET /api/monitoring/alerts
 * Get active alerts
 */
router.get('/alerts', (req, res) => {
  try {
    const { severity } = req.query;
    const alerts = alertingSystem.getActiveAlerts(severity);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('Failed to get alerts', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts'
    });
  }
});

/**
 * GET /api/monitoring/alerts/history
 * Get alert history
 */
router.get('/alerts/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const { severity } = req.query;
    const history = alertingSystem.getAlertHistory(limit, severity);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Failed to get alert history', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alert history'
    });
  }
});

/**
 * GET /api/monitoring/alerts/statistics
 * Get alert statistics
 */
router.get('/alerts/statistics', (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange) || 86400000; // Default: 24 hours
    const stats = alertingSystem.getAlertStatistics(timeRange);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get alert statistics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alert statistics'
    });
  }
});

/**
 * POST /api/monitoring/alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
router.post('/alerts/:alertId/acknowledge', (req, res) => {
  try {
    const { alertId } = req.params;
    const { acknowledgedBy } = req.body;

    const success = alertingSystem.acknowledgeAlert(alertId, acknowledgedBy);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert not found or already acknowledged'
      });
    }
  } catch (error) {
    logger.error('Failed to acknowledge alert', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert'
    });
  }
});

/**
 * POST /api/monitoring/alerts/:alertId/resolve
 * Resolve an alert
 */
router.post('/alerts/:alertId/resolve', (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolvedBy, resolution } = req.body;

    const success = alertingSystem.resolveAlert(alertId, resolvedBy, resolution);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert not found or already resolved'
      });
    }
  } catch (error) {
    logger.error('Failed to resolve alert', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert'
    });
  }
});

/**
 * GET /api/monitoring/alerts/rules
 * Get alert rules configuration
 */
router.get('/alerts/rules', (req, res) => {
  try {
    const config = alertingSystem.exportConfiguration();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Failed to get alert rules', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alert rules'
    });
  }
});

/**
 * POST /api/monitoring/alerts/rules/:ruleId/toggle
 * Enable/disable alert rule
 */
router.post('/alerts/rules/:ruleId/toggle', (req, res) => {
  try {
    const { ruleId } = req.params;
    const { enabled } = req.body;

    const success = alertingSystem.toggleRule(ruleId, enabled);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert rule not found'
      });
    }
  } catch (error) {
    logger.error('Failed to toggle alert rule', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to toggle alert rule'
    });
  }
});

module.exports = router;

/**
 * Feedback endpoints
 */

/**
 * POST /api/monitoring/feedback
 * Submit user feedback
 */
router.post('/feedback', (req, res) => {
  try {
    const feedback = feedbackSystem.submitFeedback(req.body);

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Failed to submit feedback', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

/**
 * GET /api/monitoring/feedback
 * Get all feedback with filters
 */
router.get('/feedback', (req, res) => {
  try {
    const result = feedbackSystem.getAllFeedback(req.query);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to get feedback', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback'
    });
  }
});

/**
 * GET /api/monitoring/feedback/:feedbackId
 * Get specific feedback
 */
router.get('/feedback/:feedbackId', (req, res) => {
  try {
    const { feedbackId } = req.params;
    const feedback = feedbackSystem.getFeedback(feedbackId);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Failed to get feedback', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback'
    });
  }
});

/**
 * PUT /api/monitoring/feedback/:feedbackId/status
 * Update feedback status
 */
router.put('/feedback/:feedbackId/status', (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status, updatedBy } = req.body;

    const feedback = feedbackSystem.updateStatus(feedbackId, status, updatedBy);

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Failed to update feedback status', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/monitoring/feedback/:feedbackId/response
 * Add response to feedback
 */
router.post('/feedback/:feedbackId/response', (req, res) => {
  try {
    const { feedbackId } = req.params;
    const response = feedbackSystem.addResponse(feedbackId, req.body);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Failed to add response', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/monitoring/feedback/:feedbackId/priority
 * Update feedback priority
 */
router.put('/feedback/:feedbackId/priority', (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { priority, updatedBy } = req.body;

    const feedback = feedbackSystem.updatePriority(feedbackId, priority, updatedBy);

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Failed to update feedback priority', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/feedback/statistics
 * Get feedback statistics
 */
router.get('/feedback/statistics', (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange) || 2592000000; // 30 days
    const stats = feedbackSystem.getStatistics(timeRange);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get feedback statistics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback statistics'
    });
  }
});

/**
 * GET /api/monitoring/feedback/trending
 * Get trending feedback topics
 */
router.get('/feedback/trending', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topics = feedbackSystem.getTrendingTopics(limit);

    res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    logger.error('Failed to get trending topics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trending topics'
    });
  }
});

/**
 * GET /api/monitoring/feedback/user/:userId
 * Get user's feedback history
 */
router.get('/feedback/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const feedback = feedbackSystem.getUserFeedback(userId, limit);

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Failed to get user feedback', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user feedback'
    });
  }
});

module.exports = router;
