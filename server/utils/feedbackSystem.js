/**
 * User Feedback Collection and Response System
 * Collects, categorizes, and manages user feedback
 */

const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class FeedbackSystem {
  constructor() {
    this.feedback = [];
    this.categories = new Set(['bug', 'feature', 'improvement', 'question', 'other']);
    this.statuses = new Set(['new', 'reviewing', 'planned', 'in_progress', 'completed', 'declined']);
    this.feedbackFile = path.join(__dirname, '../../logs/feedback.log');
    this.maxFeedbackInMemory = 1000;
    
    // Load recent feedback
    this.loadRecentFeedback();
  }

  /**
   * Load recent feedback from file
   */
  loadRecentFeedback() {
    try {
      if (fs.existsSync(this.feedbackFile)) {
        const content = fs.readFileSync(this.feedbackFile, 'utf8');
        const lines = content.trim().split('\n').slice(-this.maxFeedbackInMemory);
        
        this.feedback = lines
          .map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        
        logger.info('Feedback loaded', { count: this.feedback.length });
      }
    } catch (error) {
      logger.error('Failed to load feedback', { error: error.message });
    }
  }

  /**
   * Submit new feedback
   */
  submitFeedback(data) {
    const feedback = {
      id: this.generateId(),
      userId: data.userId || 'anonymous',
      sessionId: data.sessionId || null,
      category: this.validateCategory(data.category),
      subject: data.subject || '',
      message: data.message || '',
      rating: this.validateRating(data.rating),
      metadata: {
        userAgent: data.userAgent || '',
        url: data.url || '',
        viewport: data.viewport || {},
        ...data.metadata
      },
      status: 'new',
      priority: this.calculatePriority(data),
      tags: data.tags || [],
      attachments: data.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: []
    };

    // Add to memory
    this.feedback.push(feedback);
    
    // Trim if exceeds max
    if (this.feedback.length > this.maxFeedbackInMemory) {
      this.feedback.shift();
    }

    // Write to file
    this.writeFeedback(feedback);

    // Log submission
    logger.info('Feedback submitted', {
      id: feedback.id,
      userId: feedback.userId,
      category: feedback.category,
      priority: feedback.priority
    });

    // Send notifications for high priority feedback
    if (feedback.priority === 'high' || feedback.priority === 'critical') {
      this.notifyTeam(feedback);
    }

    return feedback;
  }

  /**
   * Get feedback by ID
   */
  getFeedback(feedbackId) {
    return this.feedback.find(f => f.id === feedbackId);
  }

  /**
   * Get all feedback with filters
   */
  getAllFeedback(filters = {}) {
    let results = [...this.feedback];

    // Filter by category
    if (filters.category) {
      results = results.filter(f => f.category === filters.category);
    }

    // Filter by status
    if (filters.status) {
      results = results.filter(f => f.status === filters.status);
    }

    // Filter by priority
    if (filters.priority) {
      results = results.filter(f => f.priority === filters.priority);
    }

    // Filter by user
    if (filters.userId) {
      results = results.filter(f => f.userId === filters.userId);
    }

    // Filter by date range
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      results = results.filter(f => new Date(f.createdAt).getTime() >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      results = results.filter(f => new Date(f.createdAt).getTime() <= end);
    }

    // Sort
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    
    results.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      data: results.slice(start, end),
      pagination: {
        page,
        limit,
        total: results.length,
        pages: Math.ceil(results.length / limit)
      }
    };
  }

  /**
   * Update feedback status
   */
  updateStatus(feedbackId, status, updatedBy = 'system') {
    if (!this.statuses.has(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const feedback = this.getFeedback(feedbackId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    const oldStatus = feedback.status;
    feedback.status = status;
    feedback.updatedAt = new Date().toISOString();
    feedback.updatedBy = updatedBy;

    logger.info('Feedback status updated', {
      id: feedbackId,
      oldStatus,
      newStatus: status,
      updatedBy
    });

    // Write update to file
    this.writeFeedback(feedback);

    return feedback;
  }

  /**
   * Add response to feedback
   */
  addResponse(feedbackId, response) {
    const feedback = this.getFeedback(feedbackId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    const responseObj = {
      id: this.generateId(),
      message: response.message,
      respondedBy: response.respondedBy || 'system',
      isPublic: response.isPublic !== false,
      createdAt: new Date().toISOString()
    };

    feedback.responses.push(responseObj);
    feedback.updatedAt = new Date().toISOString();

    logger.info('Response added to feedback', {
      feedbackId,
      responseId: responseObj.id,
      respondedBy: responseObj.respondedBy
    });

    // Write update to file
    this.writeFeedback(feedback);

    return responseObj;
  }

  /**
   * Update feedback priority
   */
  updatePriority(feedbackId, priority, updatedBy = 'system') {
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      throw new Error(`Invalid priority: ${priority}`);
    }

    const feedback = this.getFeedback(feedbackId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    feedback.priority = priority;
    feedback.updatedAt = new Date().toISOString();
    feedback.updatedBy = updatedBy;

    logger.info('Feedback priority updated', {
      id: feedbackId,
      priority,
      updatedBy
    });

    this.writeFeedback(feedback);
    return feedback;
  }

  /**
   * Add tags to feedback
   */
  addTags(feedbackId, tags) {
    const feedback = this.getFeedback(feedbackId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    tags.forEach(tag => {
      if (!feedback.tags.includes(tag)) {
        feedback.tags.push(tag);
      }
    });

    feedback.updatedAt = new Date().toISOString();
    this.writeFeedback(feedback);

    return feedback;
  }

  /**
   * Get feedback statistics
   */
  getStatistics(timeRange = 2592000000) { // Default: 30 days
    const cutoff = Date.now() - timeRange;
    const recentFeedback = this.feedback.filter(
      f => new Date(f.createdAt).getTime() >= cutoff
    );

    const stats = {
      total: recentFeedback.length,
      byCategory: {},
      byStatus: {},
      byPriority: {},
      avgRating: 0,
      responseRate: 0,
      avgResponseTime: 0
    };

    let totalRating = 0;
    let ratingCount = 0;
    let respondedCount = 0;
    let totalResponseTime = 0;

    recentFeedback.forEach(feedback => {
      // Count by category
      stats.byCategory[feedback.category] = 
        (stats.byCategory[feedback.category] || 0) + 1;

      // Count by status
      stats.byStatus[feedback.status] = 
        (stats.byStatus[feedback.status] || 0) + 1;

      // Count by priority
      stats.byPriority[feedback.priority] = 
        (stats.byPriority[feedback.priority] || 0) + 1;

      // Calculate average rating
      if (feedback.rating) {
        totalRating += feedback.rating;
        ratingCount++;
      }

      // Calculate response metrics
      if (feedback.responses.length > 0) {
        respondedCount++;
        
        const firstResponse = feedback.responses[0];
        const responseTime = new Date(firstResponse.createdAt).getTime() - 
                           new Date(feedback.createdAt).getTime();
        totalResponseTime += responseTime;
      }
    });

    if (ratingCount > 0) {
      stats.avgRating = (totalRating / ratingCount).toFixed(2);
    }

    if (recentFeedback.length > 0) {
      stats.responseRate = ((respondedCount / recentFeedback.length) * 100).toFixed(2);
    }

    if (respondedCount > 0) {
      stats.avgResponseTime = Math.round(totalResponseTime / respondedCount / 1000 / 60); // minutes
    }

    return stats;
  }

  /**
   * Get trending topics
   */
  getTrendingTopics(limit = 10) {
    const topics = {};

    this.feedback.forEach(feedback => {
      // Extract keywords from subject and message
      const text = `${feedback.subject} ${feedback.message}`.toLowerCase();
      const words = text.match(/\b\w{4,}\b/g) || [];

      words.forEach(word => {
        topics[word] = (topics[word] || 0) + 1;
      });

      // Count tags
      feedback.tags.forEach(tag => {
        topics[tag] = (topics[tag] || 0) + 2; // Weight tags higher
      });
    });

    // Sort by frequency
    return Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([topic, count]) => ({ topic, count }));
  }

  /**
   * Get user feedback history
   */
  getUserFeedback(userId, limit = 50) {
    return this.feedback
      .filter(f => f.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  /**
   * Validate category
   */
  validateCategory(category) {
    if (!category || !this.categories.has(category)) {
      return 'other';
    }
    return category;
  }

  /**
   * Validate rating
   */
  validateRating(rating) {
    if (!rating) return null;
    
    const num = parseInt(rating);
    if (isNaN(num) || num < 1 || num > 5) {
      return null;
    }
    
    return num;
  }

  /**
   * Calculate priority based on feedback data
   */
  calculatePriority(data) {
    let score = 0;

    // Category weights
    const categoryWeights = {
      bug: 3,
      feature: 1,
      improvement: 1,
      question: 0,
      other: 0
    };

    score += categoryWeights[data.category] || 0;

    // Rating weights (low ratings = higher priority)
    if (data.rating) {
      score += (6 - data.rating); // 1 star = +5, 5 stars = +1
    }

    // Determine priority
    if (score >= 7) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Write feedback to file
   */
  writeFeedback(feedback) {
    try {
      const logEntry = JSON.stringify(feedback) + '\n';
      fs.appendFileSync(this.feedbackFile, logEntry);
    } catch (error) {
      logger.error('Failed to write feedback', { error: error.message });
    }
  }

  /**
   * Notify team of high priority feedback
   */
  notifyTeam(feedback) {
    logger.warn('High priority feedback received', {
      id: feedback.id,
      category: feedback.category,
      priority: feedback.priority,
      subject: feedback.subject
    });

    // Could integrate with notification systems here
    // Example: send email, Slack notification, etc.
  }

  /**
   * Export feedback data
   */
  exportData(format = 'json', filters = {}) {
    const data = this.getAllFeedback(filters);

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    if (format === 'csv') {
      return this.convertToCSV(data.data);
    }

    return data;
  }

  /**
   * Convert feedback to CSV format
   */
  convertToCSV(feedback) {
    const headers = ['ID', 'User ID', 'Category', 'Subject', 'Status', 'Priority', 'Rating', 'Created At'];
    const rows = feedback.map(f => [
      f.id,
      f.userId,
      f.category,
      f.subject,
      f.status,
      f.priority,
      f.rating || '',
      f.createdAt
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }
}

// Create singleton instance
const feedbackSystem = new FeedbackSystem();

module.exports = feedbackSystem;
