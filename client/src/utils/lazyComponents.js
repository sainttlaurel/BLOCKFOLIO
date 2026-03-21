/**
 * Lazy Loading Components Configuration
 * 
 * Implements lazy loading for non-critical components to optimize initial load time.
 * Components are loaded on-demand when needed, reducing the initial bundle size.
 */

import React from 'react';
import { createLazyComponent } from './performanceOptimization';

// Loading fallback components
const ComponentLoadingFallback = ({ height = 'h-32' }) => (
  <div className={`animate-pulse bg-gray-200 ${height} rounded-lg flex items-center justify-center`}>
    <div className="text-gray-500 text-sm">Loading...</div>
  </div>
);

const ChartLoadingFallback = () => (
  <div className="animate-pulse bg-gray-200 h-64 rounded-lg flex items-center justify-center">
    <div className="text-gray-500 text-sm">Loading chart...</div>
  </div>
);

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  </div>
);

// Lazy loaded components - Non-critical components that can be loaded on demand
export const LazyComponents = {
  // Chart components (loaded when user navigates to charts)
  CandlestickChart: createLazyComponent(
    () => import('../components/CandlestickChart'),
    <ChartLoadingFallback />
  ),
  
  InteractivePriceChart: createLazyComponent(
    () => import('../components/InteractivePriceChart'),
    <ChartLoadingFallback />
  ),
  
  TechnicalIndicatorChart: createLazyComponent(
    () => import('../components/TechnicalIndicatorChart'),
    <ChartLoadingFallback />
  ),
  
  PortfolioPerformanceChart: createLazyComponent(
    () => import('../components/PortfolioPerformanceChart'),
    <ChartLoadingFallback />
  ),
  
  PortfolioAllocationChart: createLazyComponent(
    () => import('../components/PortfolioAllocationChart'),
    <ChartLoadingFallback />
  ),
  
  // Modal components (loaded when user opens modals)
  CoinDetailModal: createLazyComponent(
    () => import('../components/CoinDetailModal'),
    <ModalLoadingFallback />
  ),
  
  // Trading components (loaded when user navigates to trading)
  OrderBook: createLazyComponent(
    () => import('../components/OrderBook'),
    <ComponentLoadingFallback />
  ),
  
  OrderHistory: createLazyComponent(
    () => import('../components/OrderHistory'),
    <ComponentLoadingFallback />
  ),
  
  TrendLineDrawingTool: createLazyComponent(
    () => import('../components/TrendLineDrawingTool'),
    <ComponentLoadingFallback />
  ),
  
  SupportResistanceOverlay: createLazyComponent(
    () => import('../components/SupportResistanceOverlay'),
    <ComponentLoadingFallback />
  ),
  
  // Analytics components (loaded when user views analytics)
  PortfolioAnalytics: createLazyComponent(
    () => import('../components/PortfolioAnalytics'),
    <ComponentLoadingFallback />
  ),
  
  // Demo and monitoring components (loaded on demand)
  ChartOptimizationDemo: createLazyComponent(
    () => import('../components/ChartOptimizationDemo'),
    <ComponentLoadingFallback />
  ),
  
  ProgressiveLoadingDemo: createLazyComponent(
    () => import('../components/ProgressiveLoadingDemo'),
    <ComponentLoadingFallback />
  ),
  
  CacheDemo: createLazyComponent(
    () => import('../components/CacheDemo'),
    <ComponentLoadingFallback />
  ),
  
  PerformanceMonitor: createLazyComponent(
    () => import('../components/PerformanceMonitor'),
    <ComponentLoadingFallback />
  ),
  
  ChartPerformanceMonitor: createLazyComponent(
    () => import('../components/ChartPerformanceMonitor'),
    <ComponentLoadingFallback />
  ),
  
  CacheMonitor: createLazyComponent(
    () => import('../components/CacheMonitor'),
    <ComponentLoadingFallback />
  )
};

// Route-based lazy loading for pages
export const LazyPages = {
  Trading: createLazyComponent(
    () => import('../pages/Trading'),
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  ),
  
  Portfolio: createLazyComponent(
    () => import('../pages/Portfolio'),
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  ),
  
  Transactions: createLazyComponent(
    () => import('../pages/Transactions'),
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
};

// Component preloading utilities
export const ComponentPreloader = {
  // Preload components based on user behavior
  preloadOnHover: (componentName) => {
    const preloadMap = {
      'trading': () => {
        import('../components/OrderBook');
        import('../components/OrderHistory');
        import('../pages/Trading');
      },
      'charts': () => {
        import('../components/CandlestickChart');
        import('../components/InteractivePriceChart');
        import('../components/TechnicalIndicatorChart');
      },
      'portfolio': () => {
        import('../components/PortfolioAnalytics');
        import('../components/PortfolioPerformanceChart');
        import('../components/PortfolioAllocationChart');
        import('../pages/Portfolio');
      },
      'transactions': () => {
        import('../pages/Transactions');
      }
    };
    
    const preloader = preloadMap[componentName];
    if (preloader) {
      preloader();
    }
  },
  
  // Preload components based on route
  preloadForRoute: (route) => {
    const routePreloadMap = {
      '/trading': () => {
        import('../components/OrderBook');
        import('../components/OrderHistory');
        import('../components/CandlestickChart');
        import('../components/InteractivePriceChart');
      },
      '/portfolio': () => {
        import('../components/PortfolioAnalytics');
        import('../components/PortfolioPerformanceChart');
        import('../components/PortfolioAllocationChart');
      },
      '/transactions': () => {
        import('../components/OrderHistory');
      }
    };
    
    const preloader = routePreloadMap[route];
    if (preloader) {
      preloader();
    }
  },
  
  // Preload critical components after initial load
  preloadCriticalComponents: () => {
    // Delay preloading to not interfere with initial load
    setTimeout(() => {
      import('../components/CoinDetailModal');
      import('../components/OrderBook');
      import('../components/CandlestickChart');
    }, 2000);
  },
  
  // Preload components based on user interaction patterns
  preloadBasedOnUsage: () => {
    // Check localStorage for user preferences
    const userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    
    if (userPreferences.frequentlyUsedFeatures) {
      userPreferences.frequentlyUsedFeatures.forEach(feature => {
        this.preloadOnHover(feature);
      });
    }
  }
};

// Intersection Observer for lazy loading
export class LazyLoadObserver {
  constructor() {
    this.observer = null;
    this.loadedComponents = new Set();
    this.init();
  }
  
  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const componentName = entry.target.dataset.lazyComponent;
              if (componentName && !this.loadedComponents.has(componentName)) {
                this.loadComponent(componentName);
                this.loadedComponents.add(componentName);
                this.observer.unobserve(entry.target);
              }
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before component comes into view
          threshold: 0.1
        }
      );
    }
  }
  
  observe(element, componentName) {
    if (this.observer && element) {
      element.dataset.lazyComponent = componentName;
      this.observer.observe(element);
    }
  }
  
  loadComponent(componentName) {
    ComponentPreloader.preloadOnHover(componentName);
  }
  
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// React hook for lazy loading
export const useLazyLoading = (componentName, ref) => {
  const [observer] = React.useState(() => new LazyLoadObserver());
  
  React.useEffect(() => {
    if (ref.current) {
      observer.observe(ref.current, componentName);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [observer, componentName, ref]);
  
  return observer;
};

// Bundle splitting utilities
export const BundleSplitter = {
  // Split vendor libraries
  splitVendorLibraries: () => {
    return {
      charts: () => import('chart.js'),
      utilities: () => Promise.resolve({}), // Simplified - no lodash dependency
      dates: () => Promise.resolve({}) // Simplified - no date-fns dependency
    };
  },
  
  // Split by feature
  splitByFeature: () => {
    return {
      trading: () => Promise.resolve({}), // Simplified - no feature modules
      portfolio: () => Promise.resolve({}), // Simplified - no feature modules
      analytics: () => Promise.resolve({}) // Simplified - no feature modules
    };
  }
};

// Performance monitoring for lazy loading
export class LazyLoadingMonitor {
  constructor() {
    this.metrics = {
      componentsLoaded: 0,
      totalLoadTime: 0,
      averageLoadTime: 0,
      failedLoads: 0,
      cacheHits: 0
    };
  }
  
  trackComponentLoad(componentName, loadTime, fromCache = false) {
    this.metrics.componentsLoaded++;
    this.metrics.totalLoadTime += loadTime;
    this.metrics.averageLoadTime = this.metrics.totalLoadTime / this.metrics.componentsLoaded;
    
    if (fromCache) {
      this.metrics.cacheHits++;
    }
    
    console.log(`Lazy loaded: ${componentName} in ${loadTime}ms ${fromCache ? '(cached)' : ''}`);
  }
  
  trackFailedLoad(componentName, error) {
    this.metrics.failedLoads++;
    console.error(`Failed to lazy load ${componentName}:`, error);
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.componentsLoaded > 0 
        ? (this.metrics.cacheHits / this.metrics.componentsLoaded * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

// Global lazy loading monitor instance
export const lazyLoadingMonitor = new LazyLoadingMonitor();

// Export default configuration
export default {
  LazyComponents,
  LazyPages,
  ComponentPreloader,
  LazyLoadObserver,
  useLazyLoading,
  BundleSplitter,
  LazyLoadingMonitor,
  lazyLoadingMonitor
};