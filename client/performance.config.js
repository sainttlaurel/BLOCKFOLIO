// Performance optimization configuration
module.exports = {
  // Bundle optimization settings
  bundleOptimization: {
    // Code splitting configuration
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          enforce: true
        },
        // Chart libraries (heavy components)
        charts: {
          test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|d3)[\\/]/,
          name: 'charts',
          chunks: 'all',
          priority: 20,
          enforce: true
        },
        // Icon libraries
        icons: {
          test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
          name: 'icons',
          chunks: 'all',
          priority: 15,
          enforce: true
        },
        // React and core libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 25,
          enforce: true
        }
      }
    },
    
    // Minimize configuration
    minimize: true,
    minimizer: {
      terser: {
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === 'production',
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info']
          },
          mangle: {
            safari10: true
          }
        }
      }
    }
  },

  // Lazy loading configuration
  lazyLoading: {
    // Components to lazy load
    components: [
      'PortfolioChartContainer',
      'PortfolioAnalytics', 
      'PortfolioAllocationChart',
      'GlobalMarketStats',
      'CryptocurrencyTable',
      'InteractivePriceChart',
      'TechnicalIndicatorChart',
      'QuickTradePanel',
      'OrderHistory',
      'OrderBook',
      'PriceAlert'
    ],
    
    // Preload strategy
    preloadStrategy: 'viewport', // 'immediate', 'viewport', 'interaction'
    
    // Intersection observer options for viewport loading
    intersectionOptions: {
      rootMargin: '50px',
      threshold: 0.1
    }
  },

  // Critical resource preloading
  criticalResources: {
    // CSS files to preload
    css: [
      '/critical.css',
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
    ],
    
    // API endpoints to prefetch
    apiEndpoints: [
      '/api/coins/prices',
      '/api/wallet',
      '/api/market/global'
    ],
    
    // DNS prefetch domains
    dnsPrefetch: [
      'api.coingecko.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ]
  },

  // Performance monitoring
  monitoring: {
    // Performance thresholds
    thresholds: {
      loadTime: 2000, // 2 seconds
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2500,
      firstInputDelay: 100,
      cumulativeLayoutShift: 0.1
    },
    
    // Metrics to track
    metrics: [
      'loadTime',
      'renderTime',
      'apiCalls',
      'cacheHits',
      'cacheMisses',
      'componentRenders'
    ],
    
    // Reporting configuration
    reporting: {
      console: process.env.NODE_ENV === 'development',
      analytics: process.env.NODE_ENV === 'production',
      interval: 30000 // 30 seconds
    }
  },

  // Caching strategy
  caching: {
    // Service worker configuration
    serviceWorker: {
      enabled: process.env.NODE_ENV === 'production',
      cacheFirst: [
        '/static/js/',
        '/static/css/',
        '/static/media/'
      ],
      networkFirst: [
        '/api/'
      ],
      staleWhileRevalidate: [
        '/api/coins/prices',
        '/api/market/global'
      ]
    },
    
    // Browser cache configuration
    browserCache: {
      maxAge: {
        static: 31536000, // 1 year
        api: 300, // 5 minutes
        images: 86400 // 1 day
      }
    }
  },

  // Progressive loading
  progressiveLoading: {
    // Loading stages with delays
    stages: [
      { name: 'portfolio', delay: 0 },
      { name: 'market', delay: 100 },
      { name: 'trading', delay: 200 }
    ],
    
    // Skeleton screen configuration
    skeletons: {
      enabled: true,
      animation: 'pulse', // 'pulse', 'wave', 'none'
      duration: 1500
    }
  },

  // Image optimization
  imageOptimization: {
    // Lazy loading for images
    lazyImages: true,
    
    // Format optimization
    formats: ['webp', 'avif'],
    
    // Responsive images
    responsive: true,
    
    // Placeholder strategy
    placeholder: 'blur' // 'blur', 'empty', 'skeleton'
  }
};