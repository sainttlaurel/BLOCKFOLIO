/**
 * Polyfill Loader
 * 
 * Conditionally loads polyfills based on browser feature detection
 * Uses dynamic imports to avoid bloating the main bundle
 * Only loads polyfills when needed for graceful degradation
 */

import { checkFeatureSupport, detectBrowser } from './browserDetection';

/**
 * Polyfill configuration
 * Maps features to their polyfill loaders
 */
const POLYFILL_CONFIG = {
  intersectionObserver: {
    check: () => 'IntersectionObserver' in window,
    load: () => import('./polyfills/intersectionObserver.polyfill'),
    priority: 'high',
    size: '~5KB'
  },
  resizeObserver: {
    check: () => 'ResizeObserver' in window,
    load: () => import('./polyfills/resizeObserver.polyfill'),
    priority: 'high',
    size: '~4KB'
  },
  fetch: {
    check: () => 'fetch' in window,
    load: () => import('./polyfills/fetch.polyfill'),
    priority: 'critical',
    size: '~3KB'
  },
  promise: {
    check: () => typeof Promise !== 'undefined' && Promise.toString().indexOf('[native code]') !== -1,
    load: () => import('./polyfills/promise.polyfill'),
    priority: 'critical',
    size: '~6KB'
  },
  objectAssign: {
    check: () => typeof Object.assign === 'function',
    load: () => import('./polyfills/objectAssign.polyfill'),
    priority: 'medium',
    size: '~1KB'
  },
  arrayFrom: {
    check: () => typeof Array.from === 'function',
    load: () => import('./polyfills/arrayFrom.polyfill'),
    priority: 'medium',
    size: '~1KB'
  },
  arrayIncludes: {
    check: () => Array.prototype.includes,
    load: () => import('./polyfills/arrayIncludes.polyfill'),
    priority: 'low',
    size: '~0.5KB'
  },
  stringIncludes: {
    check: () => String.prototype.includes,
    load: () => import('./polyfills/stringIncludes.polyfill'),
    priority: 'low',
    size: '~0.5KB'
  },
  cssSupports: {
    check: () => typeof CSS !== 'undefined' && typeof CSS.supports === 'function',
    load: () => import('./polyfills/cssSupports.polyfill'),
    priority: 'low',
    size: '~1KB'
  },
  focusVisible: {
    check: () => {
      try {
        document.querySelector(':focus-visible');
        return true;
      } catch (e) {
        return false;
      }
    },
    load: () => import('./polyfills/focusVisible.polyfill'),
    priority: 'medium',
    size: '~2KB'
  }
};

/**
 * Track loaded polyfills
 */
const loadedPolyfills = new Set();
const failedPolyfills = new Set();

/**
 * Check which polyfills are needed
 * @returns {Array} List of needed polyfill names
 */
export const checkNeededPolyfills = () => {
  const needed = [];
  
  for (const [name, config] of Object.entries(POLYFILL_CONFIG)) {
    if (!config.check()) {
      needed.push({
        name,
        priority: config.priority,
        size: config.size
      });
    }
  }
  
  return needed;
};

/**
 * Load a single polyfill
 * @param {string} name - Polyfill name
 * @returns {Promise} Resolves when polyfill is loaded
 */
const loadPolyfill = async (name) => {
  if (loadedPolyfills.has(name)) {
    return { name, status: 'already-loaded' };
  }
  
  if (failedPolyfills.has(name)) {
    return { name, status: 'previously-failed' };
  }
  
  const config = POLYFILL_CONFIG[name];
  if (!config) {
    return { name, status: 'not-found' };
  }
  
  // Check if polyfill is still needed
  if (config.check()) {
    return { name, status: 'not-needed' };
  }
  
  try {
    const startTime = performance.now();
    await config.load();
    const loadTime = performance.now() - startTime;
    
    loadedPolyfills.add(name);
    
    return {
      name,
      status: 'loaded',
      loadTime: Math.round(loadTime),
      size: config.size
    };
  } catch (error) {
    failedPolyfills.add(name);
    console.error(`Failed to load polyfill: ${name}`, error);
    
    return {
      name,
      status: 'failed',
      error: error.message
    };
  }
};

/**
 * Load polyfills by priority
 * @param {string} priority - Priority level (critical, high, medium, low)
 * @returns {Promise} Resolves when all polyfills of that priority are loaded
 */
export const loadPolyfillsByPriority = async (priority) => {
  const polyfillsToLoad = Object.entries(POLYFILL_CONFIG)
    .filter(([_, config]) => config.priority === priority)
    .map(([name]) => name);
  
  const results = await Promise.allSettled(
    polyfillsToLoad.map(name => loadPolyfill(name))
  );
  
  return results.map((result, index) => ({
    name: polyfillsToLoad[index],
    ...result.value
  }));
};

/**
 * Load all needed polyfills
 * @param {Object} options - Loading options
 * @returns {Promise} Resolves when all polyfills are loaded
 */
export const loadAllPolyfills = async (options = {}) => {
  const {
    sequential = false,
    onProgress = null,
    priorities = ['critical', 'high', 'medium', 'low']
  } = options;
  
  const startTime = performance.now();
  const results = [];
  
  if (sequential) {
    // Load polyfills sequentially by priority
    for (const priority of priorities) {
      const priorityResults = await loadPolyfillsByPriority(priority);
      results.push(...priorityResults);
      
      if (onProgress) {
        onProgress({
          priority,
          results: priorityResults,
          totalLoaded: loadedPolyfills.size
        });
      }
    }
  } else {
    // Load all polyfills in parallel
    const allPolyfills = Object.keys(POLYFILL_CONFIG);
    const allResults = await Promise.allSettled(
      allPolyfills.map(name => loadPolyfill(name))
    );
    
    results.push(...allResults.map((result, index) => ({
      name: allPolyfills[index],
      ...result.value
    })));
  }
  
  const totalTime = performance.now() - startTime;
  
  return {
    results,
    totalTime: Math.round(totalTime),
    loaded: loadedPolyfills.size,
    failed: failedPolyfills.size,
    summary: generateSummary(results)
  };
};

/**
 * Generate loading summary
 * @param {Array} results - Loading results
 * @returns {Object} Summary statistics
 */
const generateSummary = (results) => {
  const summary = {
    total: results.length,
    loaded: 0,
    notNeeded: 0,
    failed: 0,
    alreadyLoaded: 0,
    totalLoadTime: 0,
    estimatedSize: 0
  };
  
  results.forEach(result => {
    switch (result.status) {
      case 'loaded':
        summary.loaded++;
        summary.totalLoadTime += result.loadTime || 0;
        summary.estimatedSize += parseFloat(result.size) || 0;
        break;
      case 'not-needed':
        summary.notNeeded++;
        break;
      case 'failed':
        summary.failed++;
        break;
      case 'already-loaded':
        summary.alreadyLoaded++;
        break;
    }
  });
  
  return summary;
};

/**
 * Initialize polyfills with smart loading strategy
 * @param {Object} options - Initialization options
 * @returns {Promise} Resolves when initialization is complete
 */
export const initPolyfills = async (options = {}) => {
  const {
    mode = 'auto', // 'auto', 'critical-only', 'all', 'none'
    logResults = process.env.NODE_ENV === 'development'
  } = options;
  
  if (mode === 'none') {
    return { mode, loaded: 0 };
  }
  
  const browser = detectBrowser();
  const features = checkFeatureSupport();
  
  // Determine loading strategy based on browser
  let priorities = [];
  
  switch (mode) {
    case 'critical-only':
      priorities = ['critical'];
      break;
    case 'all':
      priorities = ['critical', 'high', 'medium', 'low'];
      break;
    case 'auto':
    default:
      // Smart loading based on browser support
      if (!browser.isSupported) {
        // Older browsers need all polyfills
        priorities = ['critical', 'high', 'medium', 'low'];
      } else if (browser.isMobile) {
        // Mobile devices: critical and high priority only
        priorities = ['critical', 'high'];
      } else {
        // Modern browsers: critical and high priority
        priorities = ['critical', 'high'];
      }
      break;
  }
  
  const results = await loadAllPolyfills({
    sequential: true,
    priorities,
    onProgress: logResults ? (progress) => {
      console.log(`Loading ${progress.priority} priority polyfills...`, progress.results);
    } : null
  });
  
  if (logResults) {
    logPolyfillResults(results, browser, features);
  }
  
  return results;
};

/**
 * Log polyfill loading results
 * @param {Object} results - Loading results
 * @param {Object} browser - Browser information
 * @param {Object} features - Feature support
 */
const logPolyfillResults = (results, browser, features) => {
  console.group('🔧 Polyfill Loading Results');
  console.log('Browser:', browser.name, browser.version);
  console.log('Total Time:', results.totalTime + 'ms');
  console.log('Loaded:', results.summary.loaded);
  console.log('Not Needed:', results.summary.notNeeded);
  console.log('Failed:', results.summary.failed);
  console.log('Estimated Size:', results.summary.estimatedSize.toFixed(1) + 'KB');
  
  if (results.summary.loaded > 0) {
    console.group('✅ Loaded Polyfills');
    results.results
      .filter(r => r.status === 'loaded')
      .forEach(r => {
        console.log(`${r.name}: ${r.loadTime}ms (${r.size})`);
      });
    console.groupEnd();
  }
  
  if (results.summary.failed > 0) {
    console.group('❌ Failed Polyfills');
    results.results
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.error(`${r.name}: ${r.error}`);
      });
    console.groupEnd();
  }
  
  console.groupEnd();
};

/**
 * Get polyfill status
 * @returns {Object} Current polyfill status
 */
export const getPolyfillStatus = () => {
  return {
    loaded: Array.from(loadedPolyfills),
    failed: Array.from(failedPolyfills),
    available: Object.keys(POLYFILL_CONFIG),
    needed: checkNeededPolyfills()
  };
};

/**
 * Check if a specific polyfill is loaded
 * @param {string} name - Polyfill name
 * @returns {boolean} Whether polyfill is loaded
 */
export const isPolyfillLoaded = (name) => {
  return loadedPolyfills.has(name);
};

export default {
  initPolyfills,
  loadAllPolyfills,
  loadPolyfillsByPriority,
  checkNeededPolyfills,
  getPolyfillStatus,
  isPolyfillLoaded
};
