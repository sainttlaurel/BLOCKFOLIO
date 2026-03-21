/**
 * Data Caching Service for Professional Trading Platform
 * 
 * Implements efficient caching for cryptocurrency prices, market data, and portfolio information
 * to minimize API requests while maintaining data freshness and responsiveness.
 * 
 * Features:
 * - Multi-level caching (memory + localStorage)
 * - Cache invalidation strategies
 * - Performance monitoring
 * - Network interruption handling
 */

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.compressionCache = new Map(); // For compressed data
    this.accessPatterns = new Map(); // Track access patterns for predictive caching
    this.backgroundRefreshQueue = new Set(); // Queue for background refresh
    this.cacheWarmingQueue = new Set(); // Queue for cache warming
    
    this.cacheConfig = {
      // Cache TTL (Time To Live) in milliseconds with intelligent expiration
      prices: 5000,           // 5 seconds for real-time prices
      marketData: 10000,      // 10 seconds for market statistics
      portfolioData: 15000,   // 15 seconds for portfolio data
      globalStats: 30000,     // 30 seconds for global market stats
      historicalData: 300000, // 5 minutes for historical data
      
      // Smart cache expiration based on data volatility
      volatilityMultipliers: {
        high: 0.5,    // Reduce TTL by 50% for high volatility data
        medium: 0.8,  // Reduce TTL by 20% for medium volatility
        low: 1.5      // Increase TTL by 50% for low volatility data
      },
      
      // Cache warming configuration
      warmingEnabled: true,
      warmingThreshold: 0.7, // Start warming when 70% of TTL has passed
      
      // Background refresh configuration
      backgroundRefreshEnabled: true,
      backgroundRefreshThreshold: 0.8, // Start background refresh at 80% of TTL
      
      // Predictive caching configuration
      predictiveCachingEnabled: true,
      accessPatternThreshold: 3, // Cache after 3 accesses
      
      // Compression configuration
      compressionEnabled: true,
      compressionThreshold: 1024, // Compress data larger than 1KB
      
      // Maximum cache size (number of entries)
      maxSize: 1000,
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB memory limit
      
      // Performance tracking
      enableMetrics: true,
      enableAnalytics: true
    };
    
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      errors: 0,
      compressionSavings: 0,
      backgroundRefreshes: 0,
      cacheWarmings: 0,
      predictiveCacheHits: 0,
      memoryUsage: 0,
      averageResponseTime: 0,
      hitRateHistory: []
    };
    
    this.analytics = {
      accessPatterns: new Map(),
      popularKeys: new Map(),
      timeBasedAccess: new Map(),
      volatilityTracking: new Map()
    };
    
    // Initialize enhanced storage and monitoring
    this.initializeStorage();
    this.startBackgroundProcesses();
  }

  /**
   * Initialize storage and clean up expired entries
   */
  initializeStorage() {
    try {
      // Clean up expired localStorage entries on startup
      this.cleanupExpiredStorage();
      
      // Set up periodic cleanup
      setInterval(() => {
        this.cleanupExpiredStorage();
      }, 60000); // Clean up every minute
      
      // Initialize cache warming on startup
      if (this.cacheConfig.warmingEnabled) {
        this.initializeCacheWarming();
      }
      
    } catch (error) {
      console.warn('Cache storage initialization failed:', error);
    }
  }

  /**
   * Start background processes for cache optimization
   */
  startBackgroundProcesses() {
    // Background refresh process
    if (this.cacheConfig.backgroundRefreshEnabled) {
      setInterval(() => {
        this.processBackgroundRefresh();
      }, 2000); // Check every 2 seconds
    }
    
    // Cache warming process
    if (this.cacheConfig.warmingEnabled) {
      setInterval(() => {
        this.processCacheWarming();
      }, 5000); // Check every 5 seconds
    }
    
    // Analytics and metrics collection
    if (this.cacheConfig.enableAnalytics) {
      setInterval(() => {
        this.updateAnalytics();
      }, 10000); // Update analytics every 10 seconds
    }
    
    // Memory usage monitoring
    setInterval(() => {
      this.monitorMemoryUsage();
    }, 30000); // Monitor memory every 30 seconds
  }

  /**
   * Initialize cache warming for critical data
   */
  initializeCacheWarming() {
    const criticalKeys = [
      { namespace: 'prices', identifier: 'current_prices' },
      { namespace: 'marketData', identifier: 'market_overview' },
      { namespace: 'portfolioData', identifier: 'user_portfolio' },
      { namespace: 'globalStats', identifier: 'global_market_stats' }
    ];
    
    criticalKeys.forEach(key => {
      this.cacheWarmingQueue.add(`${key.namespace}_${key.identifier}`);
    });
  }

  /**
   * Generate cache key with namespace
   */
  generateKey(namespace, identifier) {
    return `cache_${namespace}_${identifier}`;
  }

  /**
   * Get data from cache with intelligent strategies
   */
  get(namespace, identifier) {
    const key = this.generateKey(namespace, identifier);
    const startTime = performance.now();
    
    try {
      // Track access patterns for predictive caching
      this.trackAccess(namespace, identifier);
      
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        this.metrics.hits++;
        this.updateResponseTime(performance.now() - startTime);
        
        // Schedule background refresh if needed
        this.scheduleBackgroundRefresh(namespace, identifier, memoryEntry);
        
        // Return decompressed data if compressed
        return this.isCompressed(memoryEntry) ? 
          this.decompress(memoryEntry.data) : memoryEntry.data;
      }
      
      // Check compression cache
      const compressedEntry = this.compressionCache.get(key);
      if (compressedEntry && !this.isExpired(compressedEntry)) {
        const decompressedData = this.decompress(compressedEntry.data);
        
        // Promote to memory cache
        this.memoryCache.set(key, {
          ...compressedEntry,
          data: decompressedData,
          compressed: false
        });
        
        this.metrics.hits++;
        this.updateResponseTime(performance.now() - startTime);
        
        return decompressedData;
      }
      
      // Check localStorage cache
      const storageData = localStorage.getItem(key);
      if (storageData) {
        const entry = JSON.parse(storageData);
        if (!this.isExpired(entry)) {
          const data = this.isCompressed(entry) ? 
            this.decompress(entry.data) : entry.data;
          
          // Promote to memory cache
          this.memoryCache.set(key, {
            ...entry,
            data: data,
            compressed: false
          });
          
          this.metrics.hits++;
          this.updateResponseTime(performance.now() - startTime);
          
          return data;
        } else {
          // Remove expired entry
          localStorage.removeItem(key);
        }
      }
      
      this.metrics.misses++;
      this.updateResponseTime(performance.now() - startTime);
      
      // Schedule predictive caching if access pattern suggests it
      this.schedulePredictiveCaching(namespace, identifier);
      
      return null;
      
    } catch (error) {
      console.warn('Cache get error:', error);
      this.metrics.errors++;
      this.updateResponseTime(performance.now() - startTime);
      return null;
    }
  }

  /**
   * Set data in cache with intelligent compression and TTL
   */
  set(namespace, identifier, data, customTTL = null, volatility = 'medium') {
    const key = this.generateKey(namespace, identifier);
    const baseTTL = customTTL || this.cacheConfig[namespace] || 30000;
    
    // Apply intelligent TTL based on volatility
    const ttl = this.calculateIntelligentTTL(baseTTL, volatility);
    
    try {
      const dataSize = this.calculateDataSize(data);
      const shouldCompress = this.cacheConfig.compressionEnabled && 
        dataSize > this.cacheConfig.compressionThreshold;
      
      const entry = {
        data: shouldCompress ? this.compress(data) : data,
        timestamp: Date.now(),
        ttl,
        namespace,
        identifier,
        compressed: shouldCompress,
        originalSize: dataSize,
        volatility,
        accessCount: 0,
        lastAccessed: Date.now()
      };
      
      // Set in memory cache
      this.memoryCache.set(key, entry);
      
      // Set in compression cache if compressed
      if (shouldCompress) {
        this.compressionCache.set(key, entry);
        this.metrics.compressionSavings += dataSize - this.calculateDataSize(entry.data);
      }
      
      // Set in localStorage (with size limit check)
      try {
        localStorage.setItem(key, JSON.stringify(entry));
      } catch (storageError) {
        // Handle localStorage quota exceeded
        if (storageError.name === 'QuotaExceededError') {
          this.cleanupOldestStorage();
          try {
            localStorage.setItem(key, JSON.stringify(entry));
          } catch (retryError) {
            console.warn('localStorage still full after cleanup:', retryError);
          }
        }
      }
      
      // Enforce memory cache size limit
      if (this.memoryCache.size > this.cacheConfig.maxSize) {
        this.evictOldestMemoryEntries();
      }
      
      // Monitor memory usage
      this.updateMemoryUsage();
      
      this.metrics.sets++;
      
      // Track volatility for future intelligent TTL calculations
      this.trackVolatility(namespace, identifier, volatility);
      
    } catch (error) {
      console.warn('Cache set error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Check if cache entry is expired with grace period for background refresh
   */
  isExpired(entry, includeGracePeriod = false) {
    const age = Date.now() - entry.timestamp;
    const expiration = includeGracePeriod ? entry.ttl * 1.1 : entry.ttl; // 10% grace period
    return age > expiration;
  }

  /**
   * Calculate intelligent TTL based on data volatility and access patterns
   */
  calculateIntelligentTTL(baseTTL, volatility) {
    const multiplier = this.cacheConfig.volatilityMultipliers[volatility] || 1;
    return Math.floor(baseTTL * multiplier);
  }

  /**
   * Track access patterns for predictive caching
   */
  trackAccess(namespace, identifier) {
    if (!this.cacheConfig.predictiveCachingEnabled) return;
    
    const key = `${namespace}_${identifier}`;
    const now = Date.now();
    
    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, {
        count: 0,
        lastAccess: now,
        accessTimes: [],
        averageInterval: 0
      });
    }
    
    const pattern = this.accessPatterns.get(key);
    pattern.count++;
    
    if (pattern.lastAccess) {
      const interval = now - pattern.lastAccess;
      pattern.accessTimes.push(interval);
      
      // Keep only last 10 intervals for average calculation
      if (pattern.accessTimes.length > 10) {
        pattern.accessTimes.shift();
      }
      
      pattern.averageInterval = pattern.accessTimes.reduce((a, b) => a + b, 0) / pattern.accessTimes.length;
    }
    
    pattern.lastAccess = now;
    this.accessPatterns.set(key, pattern);
  }

  /**
   * Schedule background refresh for data nearing expiration
   */
  scheduleBackgroundRefresh(namespace, identifier, entry) {
    if (!this.cacheConfig.backgroundRefreshEnabled) return;
    
    const age = Date.now() - entry.timestamp;
    const refreshThreshold = entry.ttl * this.cacheConfig.backgroundRefreshThreshold;
    
    if (age > refreshThreshold && !this.isExpired(entry)) {
      const key = `${namespace}_${identifier}`;
      this.backgroundRefreshQueue.add(key);
    }
  }

  /**
   * Schedule predictive caching based on access patterns
   */
  schedulePredictiveCaching(namespace, identifier) {
    if (!this.cacheConfig.predictiveCachingEnabled) return;
    
    const key = `${namespace}_${identifier}`;
    const pattern = this.accessPatterns.get(key);
    
    if (pattern && pattern.count >= this.cacheConfig.accessPatternThreshold) {
      // Predict next access time and pre-warm cache
      const predictedNextAccess = pattern.lastAccess + pattern.averageInterval;
      const timeUntilPredicted = predictedNextAccess - Date.now();
      
      if (timeUntilPredicted > 0 && timeUntilPredicted < 60000) { // Within next minute
        setTimeout(() => {
          this.cacheWarmingQueue.add(key);
        }, Math.max(0, timeUntilPredicted - 5000)); // Pre-warm 5 seconds early
      }
    }
  }

  /**
   * Process background refresh queue
   */
  processBackgroundRefresh() {
    if (this.backgroundRefreshQueue.size === 0) return;
    
    // Process one item per cycle to avoid overwhelming the system
    const key = this.backgroundRefreshQueue.values().next().value;
    this.backgroundRefreshQueue.delete(key);
    
    // Emit event for data manager to handle refresh
    window.dispatchEvent(new CustomEvent('cacheBackgroundRefresh', {
      detail: { key, timestamp: Date.now() }
    }));
    
    this.metrics.backgroundRefreshes++;
  }

  /**
   * Process cache warming queue
   */
  processCacheWarming() {
    if (this.cacheWarmingQueue.size === 0) return;
    
    // Process one item per cycle
    const key = this.cacheWarmingQueue.values().next().value;
    this.cacheWarmingQueue.delete(key);
    
    // Emit event for data manager to handle warming
    window.dispatchEvent(new CustomEvent('cacheWarming', {
      detail: { key, timestamp: Date.now() }
    }));
    
    this.metrics.cacheWarmings++;
  }

  /**
   * Compress data for storage efficiency
   */
  compress(data) {
    try {
      // Simple JSON compression - in production, consider using a proper compression library
      const jsonString = JSON.stringify(data);
      
      // Basic compression by removing whitespace and using shorter keys
      const compressed = jsonString
        .replace(/\s+/g, '')
        .replace(/"timestamp":/g, '"t":')
        .replace(/"price":/g, '"p":')
        .replace(/"volume":/g, '"v":')
        .replace(/"marketCap":/g, '"m":')
        .replace(/"percentageChange":/g, '"c":');
      
      return {
        compressed: true,
        data: compressed,
        originalLength: jsonString.length,
        compressedLength: compressed.length
      };
    } catch (error) {
      console.warn('Compression failed:', error);
      return data;
    }
  }

  /**
   * Decompress data
   */
  decompress(compressedData) {
    try {
      if (!compressedData.compressed) return compressedData;
      
      // Reverse the compression
      const decompressed = compressedData.data
        .replace(/"t":/g, '"timestamp":')
        .replace(/"p":/g, '"price":')
        .replace(/"v":/g, '"volume":')
        .replace(/"m":/g, '"marketCap":')
        .replace(/"c":/g, '"percentageChange":');
      
      return JSON.parse(decompressed);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return compressedData.data;
    }
  }

  /**
   * Check if data is compressed
   */
  isCompressed(entry) {
    return entry.compressed === true || (entry.data && entry.data.compressed === true);
  }

  /**
   * Calculate data size in bytes
   */
  calculateDataSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }

  /**
   * Update memory usage metrics
   */
  updateMemoryUsage() {
    let totalSize = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      totalSize += this.calculateDataSize(entry);
    }
    
    this.metrics.memoryUsage = totalSize;
    
    // Trigger cleanup if memory usage is too high
    if (totalSize > this.cacheConfig.maxMemoryUsage) {
      this.evictLeastRecentlyUsed();
    }
  }

  /**
   * Monitor memory usage and trigger cleanup if needed
   */
  monitorMemoryUsage() {
    this.updateMemoryUsage();
    
    if (this.metrics.memoryUsage > this.cacheConfig.maxMemoryUsage * 0.8) {
      console.log('Cache memory usage high, triggering cleanup');
      this.evictLeastRecentlyUsed();
    }
  }

  /**
   * Evict least recently used entries
   */
  evictLeastRecentlyUsed() {
    const entries = Array.from(this.memoryCache.entries());
    
    // Sort by last accessed time
    entries.sort((a, b) => {
      const aAccess = a[1].lastAccessed || a[1].timestamp;
      const bAccess = b[1].lastAccessed || b[1].timestamp;
      return aAccess - bAccess;
    });
    
    // Remove oldest 25%
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
      this.compressionCache.delete(entries[i][0]);
    }
    
    this.updateMemoryUsage();
  }

  /**
   * Track volatility for intelligent TTL calculation
   */
  trackVolatility(namespace, identifier, volatility) {
    const key = `${namespace}_${identifier}`;
    
    if (!this.analytics.volatilityTracking.has(key)) {
      this.analytics.volatilityTracking.set(key, {
        history: [],
        current: volatility,
        lastUpdate: Date.now()
      });
    }
    
    const tracking = this.analytics.volatilityTracking.get(key);
    tracking.history.push({ volatility, timestamp: Date.now() });
    tracking.current = volatility;
    tracking.lastUpdate = Date.now();
    
    // Keep only last 50 volatility records
    if (tracking.history.length > 50) {
      tracking.history.shift();
    }
    
    this.analytics.volatilityTracking.set(key, tracking);
  }

  /**
   * Update response time metrics
   */
  updateResponseTime(responseTime) {
    if (this.metrics.averageResponseTime === 0) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      // Exponential moving average
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
    }
  }

  /**
   * Update analytics data
   */
  updateAnalytics() {
    // Update hit rate history
    const currentHitRate = this.metrics.hits + this.metrics.misses > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100)
      : 0;
    
    this.metrics.hitRateHistory.push({
      timestamp: Date.now(),
      hitRate: currentHitRate
    });
    
    // Keep only last 100 data points
    if (this.metrics.hitRateHistory.length > 100) {
      this.metrics.hitRateHistory.shift();
    }
    
    // Update popular keys analytics
    for (const [key, pattern] of this.accessPatterns.entries()) {
      this.analytics.popularKeys.set(key, pattern.count);
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(namespace, identifier) {
    const key = this.generateKey(namespace, identifier);
    
    try {
      this.memoryCache.delete(key);
      localStorage.removeItem(key);
      this.metrics.invalidations++;
    } catch (error) {
      console.warn('Cache invalidation error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Invalidate all entries in a namespace
   */
  invalidateNamespace(namespace) {
    try {
      // Clear memory cache entries
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.namespace === namespace) {
          this.memoryCache.delete(key);
          this.metrics.invalidations++;
        }
      }
      
      // Clear localStorage entries
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`cache_${namespace}_`)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        this.metrics.invalidations++;
      });
      
    } catch (error) {
      console.warn('Namespace invalidation error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Clear all cache data
   */
  clear() {
    try {
      this.memoryCache.clear();
      
      // Clear only cache entries from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Reset metrics
      this.metrics = {
        hits: 0,
        misses: 0,
        sets: 0,
        invalidations: 0,
        errors: 0
      };
      
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Clean up expired localStorage entries
   */
  cleanupExpiredStorage() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          try {
            const data = localStorage.getItem(key);
            const entry = JSON.parse(data);
            if (this.isExpired(entry)) {
              keysToRemove.push(key);
            }
          } catch (parseError) {
            // Remove corrupted entries
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`Cache cleanup: removed ${keysToRemove.length} expired entries`);
      }
      
    } catch (error) {
      console.warn('Storage cleanup error:', error);
    }
  }

  /**
   * Remove oldest localStorage entries to free space
   */
  cleanupOldestStorage() {
    try {
      const entries = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          try {
            const data = localStorage.getItem(key);
            const entry = JSON.parse(data);
            entries.push({ key, timestamp: entry.timestamp });
          } catch (parseError) {
            // Remove corrupted entries immediately
            localStorage.removeItem(key);
          }
        }
      }
      
      // Sort by timestamp and remove oldest 25%
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = Math.ceil(entries.length * 0.25);
      
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
      }
      
      console.log(`Cache cleanup: removed ${toRemove} oldest entries`);
      
    } catch (error) {
      console.warn('Oldest storage cleanup error:', error);
    }
  }

  /**
   * Evict oldest memory cache entries
   */
  evictOldestMemoryEntries() {
    try {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = Math.ceil(entries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
      
    } catch (error) {
      console.warn('Memory eviction error:', error);
    }
  }

  /**
   * Get comprehensive cache performance metrics and analytics
   */
  getMetrics() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100).toFixed(2)
      : 0;
    
    const compressionRatio = this.metrics.compressionSavings > 0 
      ? ((this.metrics.compressionSavings / (this.metrics.compressionSavings + this.getTotalCacheSize())) * 100).toFixed(2)
      : 0;
    
    return {
      // Basic metrics
      ...this.metrics,
      hitRate: `${hitRate}%`,
      memoryCacheSize: this.memoryCache.size,
      storageCacheSize: this.getStorageCacheSize(),
      compressionCacheSize: this.compressionCache.size,
      
      // Performance metrics
      compressionRatio: `${compressionRatio}%`,
      memoryUsageMB: (this.metrics.memoryUsage / (1024 * 1024)).toFixed(2),
      averageResponseTimeMs: this.metrics.averageResponseTime.toFixed(2),
      
      // Advanced analytics
      backgroundRefreshQueueSize: this.backgroundRefreshQueue.size,
      cacheWarmingQueueSize: this.cacheWarmingQueue.size,
      accessPatternsTracked: this.accessPatterns.size,
      
      // Cache efficiency
      cacheEfficiencyScore: this.calculateCacheEfficiency(),
      predictiveCacheHitRate: this.calculatePredictiveCacheHitRate(),
      
      // Recent performance
      recentHitRateHistory: this.metrics.hitRateHistory.slice(-10),
      
      // Popular data
      topAccessedKeys: this.getTopAccessedKeys(5),
      volatilityDistribution: this.getVolatilityDistribution()
    };
  }

  /**
   * Get detailed analytics for cache optimization
   */
  getAnalytics() {
    return {
      accessPatterns: Object.fromEntries(this.accessPatterns),
      popularKeys: Object.fromEntries(this.analytics.popularKeys),
      volatilityTracking: Object.fromEntries(this.analytics.volatilityTracking),
      memoryUsageTrend: this.getMemoryUsageTrend(),
      hitRateHistory: this.metrics.hitRateHistory,
      compressionEffectiveness: this.getCompressionEffectiveness(),
      backgroundRefreshEfficiency: this.getBackgroundRefreshEfficiency(),
      cacheWarmingEffectiveness: this.getCacheWarmingEffectiveness()
    };
  }

  /**
   * Calculate cache efficiency score (0-100)
   */
  calculateCacheEfficiency() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses))
      : 0;
    
    const memoryEfficiency = this.cacheConfig.maxMemoryUsage > 0 
      ? Math.max(0, 1 - (this.metrics.memoryUsage / this.cacheConfig.maxMemoryUsage))
      : 1;
    
    const responseTimeEfficiency = this.metrics.averageResponseTime > 0 
      ? Math.max(0, 1 - (this.metrics.averageResponseTime / 100)) // 100ms baseline
      : 1;
    
    const compressionEfficiency = this.metrics.compressionSavings > 0 ? 0.1 : 0;
    
    return Math.round((hitRate * 0.5 + memoryEfficiency * 0.3 + responseTimeEfficiency * 0.1 + compressionEfficiency) * 100);
  }

  /**
   * Calculate predictive cache hit rate
   */
  calculatePredictiveCacheHitRate() {
    if (this.metrics.predictiveCacheHits === 0) return 0;
    
    const totalPredictiveAttempts = this.metrics.cacheWarmings;
    return totalPredictiveAttempts > 0 
      ? ((this.metrics.predictiveCacheHits / totalPredictiveAttempts) * 100).toFixed(2)
      : 0;
  }

  /**
   * Get top accessed cache keys
   */
  getTopAccessedKeys(limit = 5) {
    const sorted = Array.from(this.analytics.popularKeys.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    
    return sorted.map(([key, count]) => ({ key, accessCount: count }));
  }

  /**
   * Get volatility distribution
   */
  getVolatilityDistribution() {
    const distribution = { high: 0, medium: 0, low: 0 };
    
    for (const [key, tracking] of this.analytics.volatilityTracking.entries()) {
      distribution[tracking.current] = (distribution[tracking.current] || 0) + 1;
    }
    
    return distribution;
  }

  /**
   * Get memory usage trend
   */
  getMemoryUsageTrend() {
    // This would typically store historical data, for now return current state
    return {
      current: this.metrics.memoryUsage,
      percentage: ((this.metrics.memoryUsage / this.cacheConfig.maxMemoryUsage) * 100).toFixed(2),
      trend: 'stable' // Would calculate based on historical data
    };
  }

  /**
   * Get compression effectiveness metrics
   */
  getCompressionEffectiveness() {
    const totalOriginalSize = this.getTotalOriginalSize();
    const totalCompressedSize = this.getTotalCompressedSize();
    
    return {
      totalSavings: this.metrics.compressionSavings,
      compressionRatio: totalOriginalSize > 0 
        ? ((totalCompressedSize / totalOriginalSize) * 100).toFixed(2)
        : 0,
      itemsCompressed: this.compressionCache.size
    };
  }

  /**
   * Get background refresh efficiency
   */
  getBackgroundRefreshEfficiency() {
    return {
      totalRefreshes: this.metrics.backgroundRefreshes,
      queueSize: this.backgroundRefreshQueue.size,
      averageQueueTime: 0 // Would track timing in production
    };
  }

  /**
   * Get cache warming effectiveness
   */
  getCacheWarmingEffectiveness() {
    return {
      totalWarmings: this.metrics.cacheWarmings,
      queueSize: this.cacheWarmingQueue.size,
      hitRate: this.calculatePredictiveCacheHitRate()
    };
  }

  /**
   * Get total cache size across all storage layers
   */
  getTotalCacheSize() {
    let total = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      total += this.calculateDataSize(entry);
    }
    
    return total;
  }

  /**
   * Get total original size before compression
   */
  getTotalOriginalSize() {
    let total = 0;
    
    for (const [key, entry] of this.compressionCache.entries()) {
      total += entry.originalSize || 0;
    }
    
    return total;
  }

  /**
   * Get total compressed size
   */
  getTotalCompressedSize() {
    let total = 0;
    
    for (const [key, entry] of this.compressionCache.entries()) {
      if (entry.data && entry.data.compressedLength) {
        total += entry.data.compressedLength;
      }
    }
    
    return total;
  }

  /**
   * Get localStorage cache size
   */
  getStorageCacheSize() {
    try {
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          count++;
        }
      }
      return count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if data should be refreshed based on cache age
   */
  shouldRefresh(namespace, identifier, refreshThreshold = 0.8) {
    const key = this.generateKey(namespace, identifier);
    const entry = this.memoryCache.get(key);
    
    if (!entry) return true;
    
    const age = Date.now() - entry.timestamp;
    const threshold = entry.ttl * refreshThreshold;
    
    return age > threshold;
  }

  /**
   * Enhanced preload with intelligent warming strategies
   */
  preload(namespace, identifier, dataFetcher, customTTL = null, priority = 'normal') {
    return new Promise(async (resolve, reject) => {
      try {
        const key = this.generateKey(namespace, identifier);
        
        // Check if data already exists and is fresh enough
        const cached = this.get(namespace, identifier);
        if (cached && !this.shouldRefresh(namespace, identifier, 0.3)) { // More aggressive for preload
          resolve(cached);
          return;
        }
        
        // Fetch fresh data with priority handling
        const startTime = performance.now();
        const data = await dataFetcher();
        const fetchTime = performance.now() - startTime;
        
        // Determine volatility based on fetch time and data type
        const volatility = this.determineVolatility(namespace, fetchTime, data);
        
        this.set(namespace, identifier, data, customTTL, volatility);
        
        // Track successful preload
        this.metrics.cacheWarmings++;
        
        resolve(data);
        
      } catch (error) {
        console.warn('Cache preload failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Warm cache with critical data
   */
  async warmCache(criticalKeys = []) {
    const defaultCriticalKeys = [
      { namespace: 'prices', identifier: 'current_prices' },
      { namespace: 'marketData', identifier: 'market_overview' },
      { namespace: 'portfolioData', identifier: 'user_portfolio' }
    ];
    
    const keysToWarm = criticalKeys.length > 0 ? criticalKeys : defaultCriticalKeys;
    
    for (const keyInfo of keysToWarm) {
      this.cacheWarmingQueue.add(`${keyInfo.namespace}_${keyInfo.identifier}`);
    }
    
    // Emit warming event for data manager
    window.dispatchEvent(new CustomEvent('cacheWarmingRequested', {
      detail: { keys: keysToWarm, timestamp: Date.now() }
    }));
  }

  /**
   * Determine data volatility based on various factors
   */
  determineVolatility(namespace, fetchTime, data) {
    // Base volatility on namespace
    const baseVolatility = {
      'prices': 'high',
      'marketData': 'medium',
      'portfolioData': 'medium',
      'globalStats': 'low',
      'historicalData': 'low'
    };
    
    let volatility = baseVolatility[namespace] || 'medium';
    
    // Adjust based on fetch time (slower = more volatile/unreliable)
    if (fetchTime > 2000) {
      volatility = 'high';
    } else if (fetchTime < 500) {
      volatility = volatility === 'high' ? 'medium' : 'low';
    }
    
    // Adjust based on data characteristics
    if (data && Array.isArray(data) && data.length > 100) {
      // Large datasets are less volatile
      volatility = volatility === 'high' ? 'medium' : 'low';
    }
    
    return volatility;
  }

  /**
   * Optimize cache configuration based on usage patterns
   */
  optimizeConfiguration() {
    const analytics = this.getAnalytics();
    const metrics = this.getMetrics();
    
    // Adjust TTL based on hit rates
    if (parseFloat(metrics.hitRate) < 70) {
      // Increase TTL for low hit rates
      Object.keys(this.cacheConfig).forEach(key => {
        if (typeof this.cacheConfig[key] === 'number' && key !== 'maxSize') {
          this.cacheConfig[key] = Math.min(this.cacheConfig[key] * 1.2, 600000); // Max 10 minutes
        }
      });
    } else if (parseFloat(metrics.hitRate) > 90) {
      // Decrease TTL for very high hit rates to ensure freshness
      Object.keys(this.cacheConfig).forEach(key => {
        if (typeof this.cacheConfig[key] === 'number' && key !== 'maxSize') {
          this.cacheConfig[key] = Math.max(this.cacheConfig[key] * 0.9, 1000); // Min 1 second
        }
      });
    }
    
    // Adjust compression threshold based on memory usage
    if (parseFloat(metrics.memoryUsageMB) > 40) {
      this.cacheConfig.compressionThreshold = Math.max(512, this.cacheConfig.compressionThreshold * 0.8);
    }
    
    console.log('Cache configuration optimized based on usage patterns');
  }

  /**
   * Get cache health status
   */
  getHealthStatus() {
    const metrics = this.getMetrics();
    const hitRate = parseFloat(metrics.hitRate);
    const memoryUsage = parseFloat(metrics.memoryUsageMB);
    const responseTime = parseFloat(metrics.averageResponseTimeMs);
    
    let status = 'healthy';
    const issues = [];
    
    if (hitRate < 60) {
      status = 'warning';
      issues.push('Low cache hit rate');
    }
    
    if (memoryUsage > 40) {
      status = 'warning';
      issues.push('High memory usage');
    }
    
    if (responseTime > 50) {
      status = 'warning';
      issues.push('Slow response times');
    }
    
    if (hitRate < 40 || memoryUsage > 45 || responseTime > 100) {
      status = 'critical';
    }
    
    return {
      status,
      issues,
      recommendations: this.getOptimizationRecommendations(hitRate, memoryUsage, responseTime)
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(hitRate, memoryUsage, responseTime) {
    const recommendations = [];
    
    if (hitRate < 60) {
      recommendations.push('Consider increasing TTL for frequently accessed data');
      recommendations.push('Enable predictive caching for better hit rates');
    }
    
    if (memoryUsage > 40) {
      recommendations.push('Enable compression for large data sets');
      recommendations.push('Reduce cache size or increase eviction frequency');
    }
    
    if (responseTime > 50) {
      recommendations.push('Optimize data serialization/deserialization');
      recommendations.push('Consider using background refresh for critical data');
    }
    
    if (this.backgroundRefreshQueue.size > 10) {
      recommendations.push('Background refresh queue is large - consider increasing refresh frequency');
    }
    
    return recommendations;
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;