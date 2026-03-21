// CRACO Configuration for Production Build Optimization
const path = require('path');
const { whenProd, when } = require('@craco/craco');

// Webpack plugins (will be installed)
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  webpack: {
    // Production optimizations
    configure: (webpackConfig, { env, paths }) => {
      // Enable production optimizations
      if (env === 'production') {
        // Code splitting optimization
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          
          // Split chunks for better caching
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              // React and core libraries (changes rarely)
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
                name: 'react-vendor',
                chunks: 'all',
                priority: 40,
                enforce: true,
                reuseExistingChunk: true
              },
              // Chart libraries (heavy, lazy load)
              charts: {
                test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|d3)[\\/]/,
                name: 'charts-vendor',
                chunks: 'async',
                priority: 30,
                enforce: true,
                reuseExistingChunk: true
              },
              // Icon libraries
              icons: {
                test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
                name: 'icons-vendor',
                chunks: 'all',
                priority: 25,
                enforce: true,
                reuseExistingChunk: true
              },
              // Other vendor libraries
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendor',
                chunks: 'all',
                priority: 10,
                enforce: true,
                reuseExistingChunk: true
              },
              // Common code shared between chunks
              common: {
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true,
                enforce: true
              }
            },
            // Minimum size for chunk splitting (20KB)
            minSize: 20000,
            // Maximum async requests
            maxAsyncRequests: 30,
            // Maximum initial requests
            maxInitialRequests: 30
          },
          
          // Runtime chunk for better long-term caching
          runtimeChunk: {
            name: entrypoint => `runtime-${entrypoint.name}`
          },
          
          // Minification
          minimize: true,
          minimizer: [
            // JavaScript minification with Terser
            new TerserPlugin({
              terserOptions: {
                parse: {
                  ecma: 8
                },
                compress: {
                  ecma: 5,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                  drop_console: process.env.DROP_CONSOLE === 'true',
                  drop_debugger: true,
                  pure_funcs: process.env.DROP_CONSOLE === 'true' 
                    ? ['console.log', 'console.info', 'console.debug'] 
                    : []
                },
                mangle: {
                  safari10: true
                },
                output: {
                  ecma: 5,
                  comments: false,
                  ascii_only: true
                }
              },
              parallel: true,
              extractComments: false
            }),
            // CSS minification
            new CssMinimizerPlugin({
              minimizerOptions: {
                preset: [
                  'default',
                  {
                    discardComments: { removeAll: true },
                    normalizeWhitespace: true,
                    colormin: true,
                    minifyFontValues: true,
                    minifyGradients: true
                  }
                ]
              }
            })
          ],
          
          // Module IDs for better caching
          moduleIds: 'deterministic',
          
          // Chunk IDs for better caching
          chunkIds: 'deterministic'
        };
        
        // Add compression plugins
        webpackConfig.plugins.push(
          // Gzip compression
          new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240, // Only compress files > 10KB
            minRatio: 0.8,
            deleteOriginalAssets: false
          }),
          // Brotli compression (better than gzip)
          new CompressionPlugin({
            filename: '[path][base].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg)$/,
            compressionOptions: {
              level: 11 // Maximum compression
            },
            threshold: 10240,
            minRatio: 0.8,
            deleteOriginalAssets: false
          })
        );
        
        // Bundle analyzer (only if ANALYZE_BUNDLE is set)
        if (process.env.ANALYZE_BUNDLE === 'true') {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: 'bundle-report.html',
              openAnalyzer: false,
              generateStatsFile: true,
              statsFilename: 'bundle-stats.json'
            })
          );
        }
        
        // Performance hints
        webpackConfig.performance = {
          hints: 'warning',
          maxEntrypointSize: 512000, // 500KB
          maxAssetSize: 512000, // 500KB
          assetFilter: function(assetFilename) {
            return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
          }
        };
        
        // Source maps for production debugging
        if (process.env.GENERATE_SOURCEMAP === 'true') {
          webpackConfig.devtool = 'source-map';
        } else {
          webpackConfig.devtool = false;
        }
        
        // Tree shaking optimization
        webpackConfig.optimization.usedExports = true;
        webpackConfig.optimization.sideEffects = true;
        
        // Module concatenation (scope hoisting)
        webpackConfig.optimization.concatenateModules = true;
      }
      
      // Resolve optimizations
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        // Module resolution caching
        cache: true,
        // Alias for faster resolution
        alias: {
          ...webpackConfig.resolve.alias,
          '@': path.resolve(__dirname, 'src'),
          '@components': path.resolve(__dirname, 'src/components'),
          '@utils': path.resolve(__dirname, 'src/utils'),
          '@hooks': path.resolve(__dirname, 'src/hooks'),
          '@services': path.resolve(__dirname, 'src/services'),
          '@contexts': path.resolve(__dirname, 'src/contexts')
        }
      };
      
      // Cache configuration for faster rebuilds
      webpackConfig.cache = {
        type: 'filesystem',
        cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
        buildDependencies: {
          config: [__filename]
        }
      };
      
      return webpackConfig;
    }
  },
  
  // Babel configuration for optimization
  babel: {
    plugins: [
      // Remove PropTypes in production
      ...whenProd(
        () => [
          ['transform-react-remove-prop-types', { removeImport: true }]
        ],
        []
      )
    ],
    loaderOptions: (babelLoaderOptions, { env }) => {
      if (env === 'production') {
        // Enable loose mode for smaller bundle
        babelLoaderOptions.compact = true;
      }
      return babelLoaderOptions;
    }
  },
  
  // Development server configuration
  devServer: {
    compress: true,
    hot: true,
    client: {
      overlay: {
        errors: true,
        warnings: false
      }
    }
  }
};
