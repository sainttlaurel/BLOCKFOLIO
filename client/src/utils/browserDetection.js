/**
 * Browser Detection and Compatibility Utilities
 * 
 * Detects browser type, version, and feature support
 * Provides warnings for outdated browsers
 */

/**
 * Detect browser information
 * @returns {Object} Browser information
 */
export const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  const vendor = navigator.vendor;
  
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let isSupported = false;
  
  // Chrome
  if (/Chrome/.test(userAgent) && /Google Inc/.test(vendor)) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) {
      browserVersion = parseInt(match[1], 10);
      isSupported = browserVersion >= 90;
    }
  }
  // Edge (Chromium)
  else if (/Edg/.test(userAgent)) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    if (match) {
      browserVersion = parseInt(match[1], 10);
      isSupported = browserVersion >= 90;
    }
  }
  // Firefox
  else if (/Firefox/.test(userAgent)) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    if (match) {
      browserVersion = parseInt(match[1], 10);
      isSupported = browserVersion >= 88;
    }
  }
  // Safari
  else if (/Safari/.test(userAgent) && /Apple Computer/.test(vendor)) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    if (match) {
      browserVersion = parseInt(match[1], 10);
      isSupported = browserVersion >= 14;
    }
  }
  
  // Detect mobile
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/.test(userAgent);
  
  // Detect iOS
  const isIOS = /iPhone|iPad|iPod/.test(userAgent);
  
  // Detect Android
  const isAndroid = /Android/.test(userAgent);
  
  return {
    name: browserName,
    version: browserVersion,
    isSupported,
    isMobile,
    isIOS,
    isAndroid,
    userAgent
  };
};

/**
 * Check if specific CSS feature is supported
 * @param {string} property - CSS property to check
 * @param {string} value - CSS value to check
 * @returns {boolean} Whether feature is supported
 */
export const supportsCSS = (property, value) => {
  if (typeof CSS !== 'undefined' && CSS.supports) {
    return CSS.supports(property, value);
  }
  
  // Fallback for older browsers
  const element = document.createElement('div');
  element.style[property] = value;
  return element.style[property] === value;
};

/**
 * Check browser feature support
 * @returns {Object} Feature support status
 */
export const checkFeatureSupport = () => {
  return {
    // CSS Features
    backdropFilter: supportsCSS('backdrop-filter', 'blur(10px)') || 
                    supportsCSS('-webkit-backdrop-filter', 'blur(10px)'),
    cssGrid: supportsCSS('display', 'grid'),
    cssCustomProperties: supportsCSS('--custom', 'property'),
    clamp: supportsCSS('font-size', 'clamp(1rem, 2vw, 2rem)'),
    scrollSnap: supportsCSS('scroll-snap-type', 'x mandatory'),
    
    // JavaScript Features
    asyncAwait: typeof (async () => {})().then === 'function',
    promises: typeof Promise !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    resizeObserver: typeof ResizeObserver !== 'undefined',
    
    // Web APIs
    vibrate: typeof navigator.vibrate !== 'undefined',
    touchEvents: 'ontouchstart' in window,
    serviceWorker: 'serviceWorker' in navigator,
    webSocket: typeof WebSocket !== 'undefined',
    localStorage: typeof Storage !== 'undefined',
    
    // Media Queries
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersColorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersContrast: window.matchMedia('(prefers-contrast: high)').matches
  };
};

/**
 * Get minimum supported browser versions
 * @returns {Object} Minimum versions
 */
export const getMinimumVersions = () => {
  return {
    Chrome: 90,
    Edge: 90,
    Firefox: 88,
    Safari: 14
  };
};

/**
 * Check if browser meets minimum requirements
 * @returns {Object} Compatibility status
 */
export const checkCompatibility = () => {
  const browser = detectBrowser();
  const features = checkFeatureSupport();
  const minimumVersions = getMinimumVersions();
  
  const isVersionSupported = browser.isSupported;
  const criticalFeaturesSupported = 
    features.cssGrid && 
    features.fetch && 
    features.promises;
  
  return {
    browser,
    features,
    isCompatible: isVersionSupported && criticalFeaturesSupported,
    warnings: getCompatibilityWarnings(browser, features),
    recommendations: getRecommendations(browser, features)
  };
};

/**
 * Get compatibility warnings
 * @param {Object} browser - Browser information
 * @param {Object} features - Feature support
 * @returns {Array} List of warnings
 */
const getCompatibilityWarnings = (browser, features) => {
  const warnings = [];
  
  if (!browser.isSupported) {
    warnings.push({
      severity: 'high',
      message: `Your browser (${browser.name} ${browser.version}) is outdated. Please update to the latest version for the best experience.`,
      action: 'Update browser'
    });
  }
  
  if (!features.backdropFilter) {
    warnings.push({
      severity: 'low',
      message: 'Your browser does not support backdrop filters. Some visual effects may appear different.',
      action: 'Update browser for full visual effects'
    });
  }
  
  if (!features.intersectionObserver) {
    warnings.push({
      severity: 'medium',
      message: 'Your browser does not support Intersection Observer. Lazy loading may not work optimally.',
      action: 'Update browser for better performance'
    });
  }
  
  if (!features.webSocket) {
    warnings.push({
      severity: 'high',
      message: 'Your browser does not support WebSockets. Real-time price updates will not work.',
      action: 'Update browser immediately'
    });
  }
  
  return warnings;
};

/**
 * Get browser recommendations
 * @param {Object} browser - Browser information
 * @param {Object} features - Feature support
 * @returns {Array} List of recommendations
 */
const getRecommendations = (browser, features) => {
  const recommendations = [];
  
  if (browser.name === 'Safari' && browser.version < 15) {
    recommendations.push('Update Safari to version 15+ for improved performance and features.');
  }
  
  if (browser.name === 'Firefox' && browser.version < 100) {
    recommendations.push('Update Firefox to version 100+ for better CSS support.');
  }
  
  if (!features.serviceWorker) {
    recommendations.push('Your browser does not support Service Workers. Offline functionality will be limited.');
  }
  
  if (features.prefersReducedMotion) {
    recommendations.push('Reduced motion is enabled. Animations are minimized for your comfort.');
  }
  
  return recommendations;
};

/**
 * Show browser update notice
 * @param {Object} compatibility - Compatibility status
 */
export const showBrowserUpdateNotice = (compatibility) => {
  if (!compatibility.isCompatible) {
    // Add class to body to show notice
    document.body.classList.add('outdated-browser');
    
    // Create notice element if it doesn't exist
    let notice = document.querySelector('.browser-update-notice');
    if (!notice) {
      notice = document.createElement('div');
      notice.className = 'browser-update-notice';
      notice.innerHTML = `
        <strong>Browser Update Required</strong>
        <p>Your browser (${compatibility.browser.name} ${compatibility.browser.version}) is outdated. 
        Please update to the latest version for the best experience.</p>
        <button onclick="this.parentElement.style.display='none'">Dismiss</button>
      `;
      document.body.insertBefore(notice, document.body.firstChild);
    }
  }
};

/**
 * Log browser information to console
 * @param {Object} compatibility - Compatibility status
 */
export const logBrowserInfo = (compatibility) => {
  console.group('🌐 Browser Compatibility Check');
  console.log('Browser:', compatibility.browser.name, compatibility.browser.version);
  console.log('Supported:', compatibility.isCompatible ? '✅ Yes' : '❌ No');
  console.log('Mobile:', compatibility.browser.isMobile ? 'Yes' : 'No');
  
  if (compatibility.warnings.length > 0) {
    console.group('⚠️ Warnings');
    compatibility.warnings.forEach(warning => {
      console.warn(`[${warning.severity}] ${warning.message}`);
    });
    console.groupEnd();
  }
  
  if (compatibility.recommendations.length > 0) {
    console.group('💡 Recommendations');
    compatibility.recommendations.forEach(rec => {
      console.info(rec);
    });
    console.groupEnd();
  }
  
  console.group('🔧 Feature Support');
  Object.entries(compatibility.features).forEach(([feature, supported]) => {
    console.log(`${feature}:`, supported ? '✅' : '❌');
  });
  console.groupEnd();
  
  console.groupEnd();
};

/**
 * Initialize browser compatibility check
 * Should be called on app startup
 */
export const initBrowserCompatibility = () => {
  const compatibility = checkCompatibility();
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    logBrowserInfo(compatibility);
  }
  
  // Show notice if browser is not compatible
  if (!compatibility.isCompatible) {
    showBrowserUpdateNotice(compatibility);
  }
  
  // Add browser class to body for CSS targeting
  document.body.classList.add(`browser-${compatibility.browser.name.toLowerCase()}`);
  document.body.classList.add(`browser-version-${compatibility.browser.version}`);
  
  if (compatibility.browser.isMobile) {
    document.body.classList.add('is-mobile');
  }
  
  if (compatibility.browser.isIOS) {
    document.body.classList.add('is-ios');
  }
  
  if (compatibility.browser.isAndroid) {
    document.body.classList.add('is-android');
  }
  
  // Add feature support classes
  Object.entries(compatibility.features).forEach(([feature, supported]) => {
    if (supported) {
      document.body.classList.add(`supports-${feature.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
    } else {
      document.body.classList.add(`no-${feature.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
    }
  });
  
  return compatibility;
};

/**
 * Get browser-specific performance recommendations
 * @returns {Object} Performance recommendations
 */
export const getPerformanceRecommendations = () => {
  const browser = detectBrowser();
  const recommendations = {
    reduceBlur: false,
    simplifyAnimations: false,
    disableHaptics: false,
    optimizeCharts: false
  };
  
  // Safari on older iOS devices
  if (browser.isIOS && browser.version < 15) {
    recommendations.reduceBlur = true;
    recommendations.simplifyAnimations = true;
  }
  
  // Firefox on older versions
  if (browser.name === 'Firefox' && browser.version < 100) {
    recommendations.optimizeCharts = true;
  }
  
  // Mobile devices in general
  if (browser.isMobile) {
    recommendations.reduceBlur = true;
    recommendations.simplifyAnimations = true;
  }
  
  // iOS doesn't support vibration
  if (browser.isIOS) {
    recommendations.disableHaptics = true;
  }
  
  return recommendations;
};

export default {
  detectBrowser,
  supportsCSS,
  checkFeatureSupport,
  checkCompatibility,
  initBrowserCompatibility,
  showBrowserUpdateNotice,
  logBrowserInfo,
  getPerformanceRecommendations
};
