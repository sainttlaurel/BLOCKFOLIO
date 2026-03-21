/**
 * Client-side performance monitoring utility
 * Tracks page load times, frame rates, and user interactions
 */

import logger from './logger';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: null,
      firstContentfulPaint: null,
      timeToInteractive: null,
      frameRates: [],
      apiCalls: [],
      userInteractions: []
    };
    
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.isMonitoring = false;
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    this.measurePageLoad();
    this.startFrameRateMonitoring();
    this.setupPerformanceObserver();
    
    logger.info('Performance monitoring initialized');
  }

  /**
   * Measure page load performance
   */
  measurePageLoad() {
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
          const firstPaint = timing.responseStart - timing.navigationStart;

          this.metrics.pageLoadTime = loadTime;
          
          logger.logPerformance('pageLoad', loadTime, {
            domReady,
            firstPaint
          });

          // Warn if load time exceeds 2 seconds
          if (loadTime > 2000) {
            logger.warn('Page load time exceeds target', {
              loadTime: `${loadTime}ms`,
              target: '2000ms'
            });
          }
        }, 0);
      });
    }
  }

  /**
   * Setup Performance Observer for Web Vitals
   */
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        // Observe First Contentful Paint
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
              logger.logPerformance('firstContentfulPaint', entry.startTime);
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });

        // Observe Long Tasks (tasks taking > 50ms)
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            logger.warn('Long task detected', {
              duration: `${entry.duration}ms`,
              startTime: entry.startTime
            });
          }
        });
        
        if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
          longTaskObserver.observe({ entryTypes: ['longtask'] });
        }
      } catch (error) {
        logger.debug('Performance Observer setup failed', { error: error.message });
      }
    }
  }

  /**
   * Start monitoring frame rate
   */
  startFrameRateMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorFrame();
    
    // Calculate average FPS every 5 seconds
    this.fpsInterval = setInterval(() => {
      this.calculateAverageFPS();
    }, 5000);
  }

  /**
   * Monitor individual frames
   */
  monitorFrame() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime > 0) {
      const fps = 1000 / deltaTime;
      this.frameRates.push(fps);
      
      // Keep only last 300 frames (5 seconds at 60fps)
      if (this.frameRates.length > 300) {
        this.frameRates.shift();
      }
      
      // Warn if FPS drops below 30
      if (fps < 30) {
        logger.warn('Low frame rate detected', {
          fps: fps.toFixed(2),
          deltaTime: `${deltaTime.toFixed(2)}ms`
        });
      }
    }
    
    this.lastFrameTime = currentTime;
    this.frameCount++;
    
    requestAnimationFrame(() => this.monitorFrame());
  }

  /**
   * Calculate average FPS
   */
  calculateAverageFPS() {
    if (this.frameRates.length === 0) return 0;
    
    const sum = this.frameRates.reduce((a, b) => a + b, 0);
    const avg = sum / this.frameRates.length;
    
    this.metrics.averageFPS = avg;
    
    logger.logPerformance('averageFPS', avg.toFixed(2));
    
    // Warn if average FPS is below 60
    if (avg < 60) {
      logger.warn('Average FPS below target', {
        current: avg.toFixed(2),
        target: 60
      });
    }
    
    return avg;
  }

  /**
   * Track API call performance
   */
  trackApiCall(method, url, duration, status) {
    const apiCall = {
      method,
      url,
      duration,
      status,
      timestamp: Date.now()
    };
    
    this.metrics.apiCalls.push(apiCall);
    
    // Keep only last 100 API calls
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls.shift();
    }
    
    logger.logApiCall(method, url, duration, status);
    
    // Warn on slow API calls
    if (duration > 1000) {
      logger.warn('Slow API call detected', {
        method,
        url,
        duration: `${duration}ms`
      });
    }
  }

  /**
   * Track user interaction performance
   */
  trackInteraction(type, target, duration) {
    const interaction = {
      type,
      target,
      duration,
      timestamp: Date.now()
    };
    
    this.metrics.userInteractions.push(interaction);
    
    // Keep only last 50 interactions
    if (this.metrics.userInteractions.length > 50) {
      this.metrics.userInteractions.shift();
    }
    
    // Warn on slow interactions
    if (duration > 100) {
      logger.warn('Slow user interaction', {
        type,
        target,
        duration: `${duration}ms`
      });
    }
  }

  /**
   * Measure component render time
   */
  measureRender(componentName, callback) {
    const startTime = performance.now();
    const result = callback();
    const duration = performance.now() - startTime;
    
    logger.logPerformance(`render_${componentName}`, duration);
    
    if (duration > 16.67) { // More than one frame at 60fps
      logger.warn('Slow component render', {
        component: componentName,
        duration: `${duration.toFixed(2)}ms`
      });
    }
    
    return result;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      currentFPS: this.frameRates.length > 0 
        ? this.frameRates[this.frameRates.length - 1].toFixed(2)
        : 0,
      averageFPS: this.calculateAverageFPS().toFixed(2),
      recentApiCalls: this.metrics.apiCalls.slice(-10),
      recentInteractions: this.metrics.userInteractions.slice(-10)
    };
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const avgApiTime = this.metrics.apiCalls.length > 0
      ? this.metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0) / this.metrics.apiCalls.length
      : 0;

    return {
      pageLoadTime: this.metrics.pageLoadTime,
      averageFPS: this.calculateAverageFPS().toFixed(2),
      averageApiTime: avgApiTime.toFixed(2),
      totalApiCalls: this.metrics.apiCalls.length,
      totalInteractions: this.metrics.userInteractions.length
    };
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
    }
    logger.info('Performance monitoring stopped');
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
