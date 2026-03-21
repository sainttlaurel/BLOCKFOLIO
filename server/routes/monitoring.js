/**
 * Monitoring and logging API endpoints
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const performanceMonitor = require('../utils/performanceMonitor');

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
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
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
 * POST /api/monitoring/logs
 * Receive client-side logs
 */
router.post('/logs', (req, res) => {
  try {
    const { level, message, data } = req.body;
    
    // Log client-side errors on server
    if (level === 'error' || level === 'critical') {
      logger.error(`Client error: ${message}`, {
        clientData: data,
        userAgent: req.get('user-agent'),
        ip: req.ip
      });
    } else if (level === 'warn') {
      logger.warn(`Client warning: ${message}`, {
        clientData: data
      });
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
 * GET /api/monitoring/system
 * Get system information
 */
router.get('/system', (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    res.json({
      success: true,
      data: {
        uptime: process.uptime(),
        memory: {
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid
      }
    });
  } catch (error) {
    logger.error('Failed to get system info', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system information'
    });
  }
});

module.exports = router;
