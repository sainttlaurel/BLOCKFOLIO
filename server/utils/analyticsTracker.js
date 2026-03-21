/**
 * User experience tracking and analytics
 * Tracks user behavior, feature usage, and engagement metrics
 */

const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class AnalyticsTracker {
  constructor() {
    this.sessions = new Map();
    this.events = [];
    this.featureUsage = {};
    this.userEngagement = {};
    this.analyticsFile = path.join(__dirname, '../../logs/analytics.log');
    this.maxEvents = 10000; // Keep last 10k events in memory
  }

  /**
   * Track user session start
   */
  startSession(sessionId, userId, metadata = {}) {
    const session = {
      sessionId,
      userId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: [],
      metadata
    };

    this.sessions.set(sessionId, session);
    this.trackEvent(sessionId, 'session_start', metadata);

    logger.info('User session started', { sessionId, userId });
    return session;
  }

  /**
   * Track user session end
   */
  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const duration = Date.now() - session.startTime;
    session.endTime = Date.now();
    session.duration = duration;

    this.trackEvent(sessionId, 'session_end', {
      duration,
      pageViews: session.pageViews,
      eventCount: session.events.length
    });

    // Update user engagement metrics
    this.updateEngagement(session.userId, session);

    logger.info('User session ended', {
      sessionId,
      userId: session.userId,
      duration,
      pageViews: session.pageViews
    });

    this.sessions.delete(sessionId);
    return session;
  }

  /**
   * Track page view
   */
  trackPageView(sessionId, page, metadata = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.pageViews++;
    session.lastActivity = Date.now();

    this.trackEvent(sessionId, 'page_view', {
      page,
      ...metadata
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(sessionId, feature, action, metadata = {}) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }

    // Update feature usage statistics
    if (!this.featureUsage[feature]) {
      this.featureUsage[feature] = {
        totalUses: 0,
        uniqueUsers: new Set(),
        actions: {}
      };
    }

    this.featureUsage[feature].totalUses++;
    if (session) {
      this.featureUsage[feature].uniqueUsers.add(session.userId);
    }

    if (!this.featureUsage[feature].actions[action]) {
      this.featureUsage[feature].actions[action] = 0;
    }
    this.featureUsage[feature].actions[action]++;

    this.trackEvent(sessionId, 'feature_usage', {
      feature,
      action,
      ...metadata
    });
  }

  /**
   * Track trading activity
   */
  trackTrade(sessionId, tradeType, coin, amount, metadata = {}) {
    this.trackEvent(sessionId, 'trade', {
      tradeType,
      coin,
      amount,
      ...metadata
    });

    this.trackFeatureUsage(sessionId, 'trading', tradeType, {
      coin,
      amount
    });
  }

  /**
   * Track user interaction
   */
  trackInteraction(sessionId, element, action, metadata = {}) {
    this.trackEvent(sessionId, 'interaction', {
      element,
      action,
      ...metadata
    });
  }

  /**
   * Track error encountered by user
   */
  trackError(sessionId, errorType, message, metadata = {}) {
    this.trackEvent(sessionId, 'error', {
      errorType,
      message,
      ...metadata
    });

    logger.warn('User encountered error', {
      sessionId,
      errorType,
      message
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(sessionId, metric, value, metadata = {}) {
    this.trackEvent(sessionId, 'performance', {
      metric,
      value,
      ...metadata
    });
  }

  /**
   * Track generic event
   */
  trackEvent(sessionId, eventType, data = {}) {
    const event = {
      id: `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      eventType,
      timestamp: Date.now(),
      data
    };

    const session = this.sessions.get(sessionId);
    if (session) {
      session.events.push(event);
      event.userId = session.userId;
    }

    this.events.push(event);

    // Trim events if exceeding max
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Write to analytics log
    this.writeToLog(event);
  }

  /**
   * Update user engagement metrics
   */
  updateEngagement(userId, session) {
    if (!this.userEngagement[userId]) {
      this.userEngagement[userId] = {
        totalSessions: 0,
        totalDuration: 0,
        totalPageViews: 0,
        totalEvents: 0,
        lastActive: null,
        features: new Set()
      };
    }

    const engagement = this.userEngagement[userId];
    engagement.totalSessions++;
    engagement.totalDuration += session.duration || 0;
    engagement.totalPageViews += session.pageViews;
    engagement.totalEvents += session.events.length;
    engagement.lastActive = session.endTime || Date.now();

    // Track features used
    session.events.forEach(event => {
      if (event.eventType === 'feature_usage' && event.data.feature) {
        engagement.features.add(event.data.feature);
      }
    });
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(timeRange = 3600000) { // Default: last hour
    const now = Date.now();
    const cutoff = now - timeRange;

    const recentEvents = this.events.filter(e => e.timestamp >= cutoff);
    const activeSessions = Array.from(this.sessions.values());

    // Calculate metrics
    const uniqueUsers = new Set(recentEvents.map(e => e.userId).filter(Boolean));
    const pageViews = recentEvents.filter(e => e.eventType === 'page_view').length;
    const trades = recentEvents.filter(e => e.eventType === 'trade').length;
    const errors = recentEvents.filter(e => e.eventType === 'error').length;

    // Feature usage summary
    const featureUsageSummary = {};
    Object.entries(this.featureUsage).forEach(([feature, data]) => {
      featureUsageSummary[feature] = {
        totalUses: data.totalUses,
        uniqueUsers: data.uniqueUsers.size,
        actions: data.actions
      };
    });

    // Top features
    const topFeatures = Object.entries(featureUsageSummary)
      .sort((a, b) => b[1].totalUses - a[1].totalUses)
      .slice(0, 10)
      .map(([feature, data]) => ({ feature, ...data }));

    return {
      timeRange: {
        start: cutoff,
        end: now,
        duration: timeRange
      },
      sessions: {
        active: activeSessions.length,
        total: recentEvents.filter(e => e.eventType === 'session_start').length
      },
      users: {
        unique: uniqueUsers.size
      },
      activity: {
        totalEvents: recentEvents.length,
        pageViews,
        trades,
        errors
      },
      features: {
        total: Object.keys(this.featureUsage).length,
        topFeatures
      },
      engagement: this.calculateEngagementMetrics(activeSessions)
    };
  }

  /**
   * Calculate engagement metrics
   */
  calculateEngagementMetrics(sessions) {
    if (sessions.length === 0) {
      return {
        avgSessionDuration: 0,
        avgPageViews: 0,
        avgEventsPerSession: 0
      };
    }

    const totalDuration = sessions.reduce((sum, s) => {
      return sum + (Date.now() - s.startTime);
    }, 0);

    const totalPageViews = sessions.reduce((sum, s) => sum + s.pageViews, 0);
    const totalEvents = sessions.reduce((sum, s) => sum + s.events.length, 0);

    return {
      avgSessionDuration: Math.round(totalDuration / sessions.length),
      avgPageViews: (totalPageViews / sessions.length).toFixed(2),
      avgEventsPerSession: (totalEvents / sessions.length).toFixed(2)
    };
  }

  /**
   * Get feature usage report
   */
  getFeatureUsageReport() {
    const report = {};

    Object.entries(this.featureUsage).forEach(([feature, data]) => {
      report[feature] = {
        totalUses: data.totalUses,
        uniqueUsers: data.uniqueUsers.size,
        actions: data.actions,
        popularity: this.calculatePopularity(data)
      };
    });

    return report;
  }

  /**
   * Calculate feature popularity score
   */
  calculatePopularity(featureData) {
    const totalUsers = Object.keys(this.userEngagement).length || 1;
    const adoptionRate = (featureData.uniqueUsers.size / totalUsers) * 100;
    const usageFrequency = featureData.totalUses / featureData.uniqueUsers.size || 0;

    return {
      adoptionRate: adoptionRate.toFixed(2),
      avgUsesPerUser: usageFrequency.toFixed(2),
      score: (adoptionRate * usageFrequency).toFixed(2)
    };
  }

  /**
   * Get user engagement report
   */
  getUserEngagementReport(userId) {
    const engagement = this.userEngagement[userId];
    if (!engagement) return null;

    return {
      userId,
      totalSessions: engagement.totalSessions,
      totalDuration: engagement.totalDuration,
      avgSessionDuration: Math.round(engagement.totalDuration / engagement.totalSessions),
      totalPageViews: engagement.totalPageViews,
      avgPageViewsPerSession: (engagement.totalPageViews / engagement.totalSessions).toFixed(2),
      totalEvents: engagement.totalEvents,
      featuresUsed: Array.from(engagement.features),
      lastActive: engagement.lastActive
    };
  }

  /**
   * Write event to analytics log file
   */
  writeToLog(event) {
    const logEntry = JSON.stringify({
      timestamp: new Date(event.timestamp).toISOString(),
      ...event
    }) + '\n';

    try {
      fs.appendFileSync(this.analyticsFile, logEntry);
    } catch (error) {
      logger.error('Failed to write analytics log', { error: error.message });
    }
  }

  /**
   * Clear old data
   */
  clearOldData(maxAge = 86400000) { // Default: 24 hours
    const cutoff = Date.now() - maxAge;

    // Clear old events
    this.events = this.events.filter(e => e.timestamp >= cutoff);

    logger.info('Old analytics data cleared', {
      eventsRemaining: this.events.length
    });
  }

  /**
   * Export analytics data
   */
  exportData(format = 'json') {
    const data = {
      exportTime: Date.now(),
      sessions: Array.from(this.sessions.values()),
      events: this.events,
      featureUsage: this.getFeatureUsageReport(),
      userEngagement: this.userEngagement,
      summary: this.getAnalyticsSummary()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    return data;
  }
}

// Create singleton instance
const analyticsTracker = new AnalyticsTracker();

module.exports = analyticsTracker;
