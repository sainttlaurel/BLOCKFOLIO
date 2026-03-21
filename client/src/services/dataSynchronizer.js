/**
 * Data Synchronization Service
 * 
 * Provides efficient data synchronization without interface lag using
 * techniques like debouncing, throttling, virtual scrolling, and
 * intelligent update batching to maintain smooth 60fps performance.
 */

import { memoryOptimization } from '../utils/performanceOptimization';

class DataSynchronizer {
  constructor() {
    this.updateQueue = new Map();
    this.batchProcessor = null;
    this.batchDelay = 16; // ~60fps
    this.maxBatchSize = 50;
    this.isProcessing = false;
    
    // Performance monitoring
    this.metrics = {
      totalUpdates: 0,
      batchedUpdates: 0,
      droppedUpdates: 0,
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      frameDrops: 0
    };
    
    // Update strategies
    this.strategies = {
      immediate: this.processImmediate.bind(this),
      debounced: this.processDebounced.bind(this),
      throttled: this.processThrottled.bind(this),
      batched: this.processBatched.bind(this),
      prioritized: this.processPrioritized.bind(this)
    };
    
    // Priority levels
    this.priorities = {
      critical: 1,    // Portfolio values, trade executions
      high: 2,        // Price updates for visible items
      medium: 3,      // Market data, charts
      low: 4,         // Background data, analytics
      background: 5   // Non-visible data
    };
    
    // Component update handlers
    this.updateHandlers = new Map();
    this.componentStates = new Map();
    
    // Visibility tracking
    this.visibilityObserver = null;
    this.visibleComponents = new Set();
    this.initializeVisibilityTracking();
    
    // Frame rate monitoring
    this.frameRateMonitor = {
      lastFrameTime: performance.now(),
      frameCount: 0,
      currentFPS: 60,
      targetFPS: 60
    };
    
    this.startFrameRateMonitoring();
  }

  /**
   * Initialize visibility tracking for components
   */
  initializeVisibilityTracking() {
    if ('IntersectionObserver' in window) {
      this.visibilityObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const componentId = entry.target.dataset.componentId;
            if (componentId) {
              if (entry.isIntersecting) {
                this.visibleComponents.add(componentId);
              } else {
                this.visibleComponents.delete(componentId);
              }
            }
          });
        },
        { threshold: 0.1 }
      );
    }
  }

  /**
   * Register component for visibility tracking
   */
  registerComponent(componentId, element) {
    if (this.visibilityObserver && element) {
      element.dataset.componentId = componentId;
      this.visibilityObserver.observe(element);
    }
  }

  /**
   * Unregister component from visibility tracking
   */
  unregisterComponent(componentId, element) {
    if (this.visibilityObserver && element) {
      this.visibilityObserver.unobserve(element);
      this.visibleComponents.delete(componentId);
    }
  }

  /**
   * Start frame rate monitoring
   */
  startFrameRateMonitoring() {
    const measureFrameRate = (currentTime) => {
      this.frameRateMonitor.frameCount++;
      
      if (currentTime - this.frameRateMonitor.lastFrameTime >= 1000) {
        this.frameRateMonitor.currentFPS = this.frameRateMonitor.frameCount;
        this.frameRateMonitor.frameCount = 0;
        this.frameRateMonitor.lastFrameTime = currentTime;
        
        // Adjust batch delay based on frame rate
        this.adjustBatchDelay();
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  /**
   * Adjust batch delay based on current frame rate
   */
  adjustBatchDelay() {
    const { currentFPS, targetFPS } = this.frameRateMonitor;
    
    if (currentFPS < targetFPS * 0.9) {
      // Frame rate is low, increase batch delay to reduce load
      this.batchDelay = Math.min(this.batchDelay * 1.2, 33); // Max 30fps
      this.metrics.frameDrops++;
    } else if (currentFPS > targetFPS * 0.95) {
      // Frame rate is good, can reduce batch delay
      this.batchDelay = Math.max(this.batchDelay * 0.9, 8); // Min ~120fps
    }
  }

  /**
   * Register update handler for a component
   */
  registerUpdateHandler(componentId, handler, options = {}) {
    const {
      strategy = 'batched',
      priority = this.priorities.medium,
      debounceDelay = 100,
      throttleDelay = 16,
      maxUpdatesPerSecond = 60
    } = options;

    this.updateHandlers.set(componentId, {
      handler,
      strategy,
      priority,
      debounceDelay,
      throttleDelay,
      maxUpdatesPerSecond,
      lastUpdate: 0,
      pendingUpdate: null,
      updateCount: 0
    });
  }

  /**
   * Unregister update handler
   */
  unregisterUpdateHandler(componentId) {
    const handlerInfo = this.updateHandlers.get(componentId);
    if (handlerInfo && handlerInfo.pendingUpdate) {
      clearTimeout(handlerInfo.pendingUpdate);
    }
    this.updateHandlers.delete(componentId);
    this.componentStates.delete(componentId);
  }

  /**
   * Queue data update for processing
   */
  queueUpdate(componentId, data, options = {}) {
    const {
      priority = this.priorities.medium,
      strategy = null,
      force = false
    } = options;

    this.metrics.totalUpdates++;

    const handlerInfo = this.updateHandlers.get(componentId);
    if (!handlerInfo) {
      console.warn(`No update handler registered for component: ${componentId}`);
      return;
    }

    // Skip updates for non-visible components unless forced or critical
    if (!force && priority > this.priorities.critical && !this.visibleComponents.has(componentId)) {
      this.metrics.droppedUpdates++;
      return;
    }

    const updateStrategy = strategy || handlerInfo.strategy;
    const updateData = {
      componentId,
      data,
      priority,
      timestamp: performance.now(),
      handler: handlerInfo.handler
    };

    // Process update based on strategy
    this.strategies[updateStrategy](updateData, handlerInfo);
  }

  /**
   * Process immediate updates (for critical data)
   */
  processImmediate(updateData) {
    const startTime = performance.now();
    
    try {
      updateData.handler(updateData.data);
      this.updateComponentState(updateData.componentId, updateData.data);
    } catch (error) {
      console.error(`Error in immediate update for ${updateData.componentId}:`, error);
    }
    
    this.trackProcessingTime(performance.now() - startTime);
  }

  /**
   * Process debounced updates
   */
  processDebounced(updateData, handlerInfo) {
    if (handlerInfo.pendingUpdate) {
      clearTimeout(handlerInfo.pendingUpdate);
    }

    handlerInfo.pendingUpdate = setTimeout(() => {
      this.processImmediate(updateData);
      handlerInfo.pendingUpdate = null;
    }, handlerInfo.debounceDelay);
  }

  /**
   * Process throttled updates
   */
  processThrottled(updateData, handlerInfo) {
    const now = performance.now();
    const timeSinceLastUpdate = now - handlerInfo.lastUpdate;

    if (timeSinceLastUpdate >= handlerInfo.throttleDelay) {
      this.processImmediate(updateData);
      handlerInfo.lastUpdate = now;
    } else {
      // Schedule for next available slot
      if (!handlerInfo.pendingUpdate) {
        const delay = handlerInfo.throttleDelay - timeSinceLastUpdate;
        handlerInfo.pendingUpdate = setTimeout(() => {
          this.processImmediate(updateData);
          handlerInfo.lastUpdate = performance.now();
          handlerInfo.pendingUpdate = null;
        }, delay);
      }
    }
  }

  /**
   * Process batched updates
   */
  processBatched(updateData) {
    const key = `${updateData.componentId}_${updateData.priority}`;
    this.updateQueue.set(key, updateData);

    if (!this.batchProcessor) {
      this.batchProcessor = setTimeout(() => {
        this.processBatch();
      }, this.batchDelay);
    }
  }

  /**
   * Process prioritized updates
   */
  processPrioritized(updateData) {
    // High priority updates go through immediately
    if (updateData.priority <= this.priorities.high) {
      this.processImmediate(updateData);
    } else {
      this.processBatched(updateData);
    }
  }

  /**
   * Process batch of queued updates
   */
  processBatch() {
    if (this.isProcessing || this.updateQueue.size === 0) {
      this.batchProcessor = null;
      return;
    }

    this.isProcessing = true;
    const startTime = performance.now();
    
    try {
      // Sort updates by priority
      const updates = Array.from(this.updateQueue.values())
        .sort((a, b) => a.priority - b.priority)
        .slice(0, this.maxBatchSize);

      // Group updates by component for efficient processing
      const componentUpdates = new Map();
      updates.forEach(update => {
        if (!componentUpdates.has(update.componentId)) {
          componentUpdates.set(update.componentId, []);
        }
        componentUpdates.get(update.componentId).push(update);
      });

      // Process updates for each component
      componentUpdates.forEach((updates, componentId) => {
        try {
          // Use the latest update for each component
          const latestUpdate = updates[updates.length - 1];
          latestUpdate.handler(latestUpdate.data);
          this.updateComponentState(componentId, latestUpdate.data);
          
          // Remove processed updates from queue
          updates.forEach(update => {
            const key = `${update.componentId}_${update.priority}`;
            this.updateQueue.delete(key);
          });
          
        } catch (error) {
          console.error(`Error in batch update for ${componentId}:`, error);
        }
      });

      this.metrics.batchedUpdates += updates.length;
      
    } finally {
      this.isProcessing = false;
      this.batchProcessor = null;
      
      // Schedule next batch if there are remaining updates
      if (this.updateQueue.size > 0) {
        this.batchProcessor = setTimeout(() => {
          this.processBatch();
        }, this.batchDelay);
      }
    }
    
    this.trackProcessingTime(performance.now() - startTime);
  }

  /**
   * Update component state tracking
   */
  updateComponentState(componentId, data) {
    this.componentStates.set(componentId, {
      data,
      lastUpdate: performance.now()
    });
  }

  /**
   * Get current state for a component
   */
  getComponentState(componentId) {
    return this.componentStates.get(componentId);
  }

  /**
   * Track processing time metrics
   */
  trackProcessingTime(processingTime) {
    if (processingTime > this.metrics.maxProcessingTime) {
      this.metrics.maxProcessingTime = processingTime;
    }
    
    // Update average processing time (exponential moving average)
    if (this.metrics.averageProcessingTime === 0) {
      this.metrics.averageProcessingTime = processingTime;
    } else {
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime * 0.9) + (processingTime * 0.1);
    }
    
    // Log warning for slow processing
    if (processingTime > 16) { // More than one frame at 60fps
      console.warn(`Slow data synchronization: ${processingTime.toFixed(2)}ms`);
    }
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory() {
    // Clean up old component states
    const now = performance.now();
    const maxAge = 60000; // 1 minute
    
    for (const [componentId, state] of this.componentStates.entries()) {
      if (now - state.lastUpdate > maxAge) {
        this.componentStates.delete(componentId);
      }
    }
    
    // Clear old queued updates
    for (const [key, update] of this.updateQueue.entries()) {
      if (now - update.timestamp > maxAge) {
        this.updateQueue.delete(key);
      }
    }
    
    // Trigger garbage collection if available
    memoryOptimization.cleanup();
  }

  /**
   * Get synchronization metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.updateQueue.size,
      registeredComponents: this.updateHandlers.size,
      visibleComponents: this.visibleComponents.size,
      currentFPS: this.frameRateMonitor.currentFPS,
      batchDelay: this.batchDelay,
      memoryUsage: memoryOptimization.getMemoryUsage(),
      efficiency: this.calculateEfficiency()
    };
  }

  /**
   * Calculate synchronization efficiency
   */
  calculateEfficiency() {
    const { totalUpdates, droppedUpdates, batchedUpdates } = this.metrics;
    
    if (totalUpdates === 0) return 100;
    
    const processedUpdates = totalUpdates - droppedUpdates;
    const batchEfficiency = batchedUpdates > 0 ? (batchedUpdates / processedUpdates) * 100 : 0;
    const dropRate = (droppedUpdates / totalUpdates) * 100;
    
    return Math.max(0, 100 - dropRate + (batchEfficiency * 0.1));
  }

  /**
   * Force process all pending updates
   */
  flush() {
    if (this.batchProcessor) {
      clearTimeout(this.batchProcessor);
      this.batchProcessor = null;
    }
    
    this.processBatch();
  }

  /**
   * Pause data synchronization
   */
  pause() {
    if (this.batchProcessor) {
      clearTimeout(this.batchProcessor);
      this.batchProcessor = null;
    }
    
    this.isProcessing = false;
  }

  /**
   * Resume data synchronization
   */
  resume() {
    if (this.updateQueue.size > 0 && !this.batchProcessor) {
      this.batchProcessor = setTimeout(() => {
        this.processBatch();
      }, this.batchDelay);
    }
  }

  /**
   * Clear all pending updates
   */
  clear() {
    this.updateQueue.clear();
    
    if (this.batchProcessor) {
      clearTimeout(this.batchProcessor);
      this.batchProcessor = null;
    }
    
    // Clear pending timeouts in handlers
    this.updateHandlers.forEach(handlerInfo => {
      if (handlerInfo.pendingUpdate) {
        clearTimeout(handlerInfo.pendingUpdate);
        handlerInfo.pendingUpdate = null;
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.clear();
    
    if (this.visibilityObserver) {
      this.visibilityObserver.disconnect();
    }
    
    this.updateHandlers.clear();
    this.componentStates.clear();
    this.visibleComponents.clear();
  }
}

// Create singleton instance
const dataSynchronizer = new DataSynchronizer();

export default dataSynchronizer;