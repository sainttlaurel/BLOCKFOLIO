/**
 * Performance Optimization Utilities
 * 
 * Collection of utilities to optimize application performance,
 * reduce bundle size, and improve loading times.
 */

import React from 'react';

// Lazy loading utilities
export const createLazyComponent = (importFunc, fallback = null) => {
  const LazyComponent = React.lazy(importFunc);
  
  return React.forwardRef((props, ref) => (
    <React.Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />}>
      <LazyComponent {...props} ref={ref} />
    </React.Suspense>
  ));
};

// Code splitting for routes
export const createLazyRoute = (importFunc) => {
  return createLazyComponent(
    importFunc,
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
};

// Bundle size optimization
export const optimizeBundle = {
  // Tree shaking helper - only import what's needed
  importOnlyUsed: (module, used) => {
    return Object.keys(used).reduce((acc, key) => {
      if (used[key]) {
        acc[key] = module[key];
      }
      return acc;
    }, {});
  },

  // Dynamic imports for heavy libraries
  loadChartLibrary: () => import('chart.js'),
  
  // Preload critical resources
  preloadCriticalResources: () => {
    // Preload critical CSS
    const criticalCSS = document.createElement('link');
    criticalCSS.rel = 'preload';
    criticalCSS.as = 'style';
    criticalCSS.href = '/critical.css';
    document.head.appendChild(criticalCSS);
    
    // Preload critical fonts
    const criticalFont = document.createElement('link');
    criticalFont.rel = 'preload';
    criticalFont.as = 'font';
    criticalFont.type = 'font/woff2';
    criticalFont.href = '/fonts/inter-var.woff2';
    criticalFont.crossOrigin = 'anonymous';
    document.head.appendChild(criticalFont);
  }
};

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    this.observers = [];
    this.init();
  }

  init() {
    // Monitor page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0];
        this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.reportMetrics();
      });

      // Monitor largest contentful paint
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Monitor cumulative layout shift
        const clsObserver = new PerformanceObserver((entryList) => {
          let clsValue = 0;
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

        // Monitor first input delay
        const fidObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            this.metrics.fid = entry.processingStart - entry.startTime;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      }
    }
  }

  // Track API call performance
  trackApiCall(url, duration, cached = false) {
    this.metrics.apiCalls++;
    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    // Store API performance data
    if (!this.metrics.apiPerformance) {
      this.metrics.apiPerformance = {};
    }
    if (!this.metrics.apiPerformance[url]) {
      this.metrics.apiPerformance[url] = [];
    }
    this.metrics.apiPerformance[url].push({ duration, cached, timestamp: Date.now() });
  }

  // Track component render time
  trackRenderTime(componentName, duration) {
    if (!this.metrics.componentRenders) {
      this.metrics.componentRenders = {};
    }
    if (!this.metrics.componentRenders[componentName]) {
      this.metrics.componentRenders[componentName] = [];
    }
    this.metrics.componentRenders[componentName].push({ duration, timestamp: Date.now() });
  }

  // Get performance report
  getReport() {
    const cacheHitRate = this.metrics.apiCalls > 0 
      ? (this.metrics.cacheHits / this.metrics.apiCalls * 100).toFixed(2)
      : 0;

    return {
      ...this.metrics,
      cacheHitRate: `${cacheHitRate}%`,
      webVitals: {
        lcp: this.metrics.lcp ? `${this.metrics.lcp.toFixed(2)}ms` : 'N/A',
        fid: this.metrics.fid ? `${this.metrics.fid.toFixed(2)}ms` : 'N/A',
        cls: this.metrics.cls ? this.metrics.cls.toFixed(3) : 'N/A'
      }
    };
  }

  // Report metrics to analytics
  reportMetrics() {
    const report = this.getReport();
    console.log('Performance Report:', report);
    
    // Send to analytics service (implement as needed)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metrics', {
        load_time: this.metrics.loadTime,
        cache_hit_rate: this.metrics.cacheHits / this.metrics.apiCalls,
        lcp: this.metrics.lcp,
        fid: this.metrics.fid,
        cls: this.metrics.cls
      });
    }
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React performance hooks
export const usePerformanceMonitor = () => {
  const [monitor] = React.useState(() => new PerformanceMonitor());
  
  React.useEffect(() => {
    return () => monitor.cleanup();
  }, [monitor]);
  
  return monitor;
};

// Component render time tracker
export const useRenderTime = (componentName) => {
  const monitor = usePerformanceMonitor();
  const startTime = React.useRef();
  
  React.useLayoutEffect(() => {
    startTime.current = performance.now();
  });
  
  React.useLayoutEffect(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      monitor.trackRenderTime(componentName, duration);
    }
  });
};

// Memory usage optimization
export const memoryOptimization = {
  // Cleanup unused objects
  cleanup: () => {
    if (typeof window !== 'undefined' && window.gc) {
      window.gc();
    }
  },

  // Monitor memory usage
  getMemoryUsage: () => {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      return {
        used: Math.round(window.performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(window.performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  },

  // Debounce expensive operations
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle high-frequency events
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Image optimization
export const imageOptimization = {
  // Lazy load images
  createLazyImage: (src, alt, className = '') => {
    const [loaded, setLoaded] = React.useState(false);
    const [inView, setInView] = React.useState(false);
    const imgRef = React.useRef();

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div ref={imgRef} className={`${className} ${!loaded ? 'bg-gray-200 animate-pulse' : ''}`}>
        {inView && (
          <img
            src={src}
            alt={alt}
            onLoad={() => setLoaded(true)}
            className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
      </div>
    );
  },

  // Optimize image format based on browser support
  getOptimizedImageUrl: (baseUrl, format = 'webp') => {
    if (typeof window === 'undefined') return baseUrl;
    
    const canvas = document.createElement('canvas');
    const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    const supportsAvif = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    
    if (supportsAvif && format === 'avif') {
      return baseUrl.replace(/\.(jpg|jpeg|png)$/i, '.avif');
    } else if (supportsWebP && format === 'webp') {
      return baseUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    
    return baseUrl;
  }
};

// Critical resource preloader
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return;
  
  // Preload critical API endpoints
  const criticalEndpoints = [
    '/api/coins/prices',
    '/api/wallet',
    '/api/market/global'
  ];
  
  criticalEndpoints.forEach(endpoint => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = endpoint;
    document.head.appendChild(link);
  });
  
  // Preload critical components
  import('../components/PortfolioSection');
  import('../components/CryptocurrencyTable');
  import('../components/GlobalMarketStats');
};

export default {
  createLazyComponent,
  createLazyRoute,
  optimizeBundle,
  PerformanceMonitor,
  usePerformanceMonitor,
  useRenderTime,
  memoryOptimization,
  imageOptimization,
  preloadCriticalResources
};