/**
 * Browser Compatibility Integration Example
 * 
 * This example shows how to integrate browser detection and compatibility
 * checking into your React application.
 */

import React, { useEffect, useState } from 'react';
import { 
  initBrowserCompatibility, 
  checkCompatibility,
  getPerformanceRecommendations 
} from '../utils/browserDetection';

/**
 * Browser Compatibility Notice Component
 * Displays warnings and recommendations based on browser compatibility
 */
const BrowserCompatibilityNotice = () => {
  const [compatibility, setCompatibility] = useState(null);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    // Initialize browser compatibility check on mount
    const compat = initBrowserCompatibility();
    setCompatibility(compat);
    
    // Show notice if browser is not fully compatible
    if (!compat.isCompatible || compat.warnings.length > 0) {
      setShowNotice(true);
    }
  }, []);

  if (!showNotice || !compatibility) {
    return null;
  }

  const highSeverityWarnings = compatibility.warnings.filter(w => w.severity === 'high');
  const mediumSeverityWarnings = compatibility.warnings.filter(w => w.severity === 'medium');

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b-2 border-yellow-400 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Browser Compatibility Notice
            </h3>
            
            {highSeverityWarnings.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-red-800 mb-1">Critical Issues:</p>
                <ul className="list-disc list-inside space-y-1">
                  {highSeverityWarnings.map((warning, index) => (
                    <li key={index} className="text-sm text-red-700">
                      {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {mediumSeverityWarnings.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-yellow-800 mb-1">Warnings:</p>
                <ul className="list-disc list-inside space-y-1">
                  {mediumSeverityWarnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-700">
                      {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {compatibility.recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Recommendations:</p>
                <ul className="list-disc list-inside space-y-1">
                  {compatibility.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-700">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowNotice(false)}
            className="ml-4 text-yellow-900 hover:text-yellow-700 font-medium"
            aria-label="Dismiss notice"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Browser Info Display Component
 * Shows detailed browser information (for development/debugging)
 */
const BrowserInfoDisplay = () => {
  const [compatibility, setCompatibility] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const compat = checkCompatibility();
    setCompatibility(compat);
  }, []);

  if (!compatibility) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Browser Information
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Browser:</span>
          <span className="text-sm font-medium text-gray-900">
            {compatibility.browser.name} {compatibility.browser.version}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`text-sm font-medium ${
            compatibility.isCompatible ? 'text-green-600' : 'text-red-600'
          }`}>
            {compatibility.isCompatible ? '✅ Compatible' : '❌ Not Compatible'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Device:</span>
          <span className="text-sm font-medium text-gray-900">
            {compatibility.browser.isMobile ? 'Mobile' : 'Desktop'}
            {compatibility.browser.isIOS && ' (iOS)'}
            {compatibility.browser.isAndroid && ' (Android)'}
          </span>
        </div>

        {showDetails && (
          <>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Feature Support
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(compatibility.features).map(([feature, supported]) => (
                  <div key={feature} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className={supported ? 'text-green-600' : 'text-red-600'}>
                      {supported ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                User Agent
              </h4>
              <p className="text-xs text-gray-600 break-all">
                {compatibility.browser.userAgent}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Performance Optimizations Component
 * Applies browser-specific performance optimizations
 */
const PerformanceOptimizations = ({ children }) => {
  const [optimizations, setOptimizations] = useState(null);

  useEffect(() => {
    const opts = getPerformanceRecommendations();
    setOptimizations(opts);

    // Apply optimizations to body element
    if (opts.reduceBlur) {
      document.body.classList.add('reduce-blur');
    }
    if (opts.simplifyAnimations) {
      document.body.classList.add('simplify-animations');
    }
    if (opts.disableHaptics) {
      document.body.classList.add('disable-haptics');
    }
    if (opts.optimizeCharts) {
      document.body.classList.add('optimize-charts');
    }

    return () => {
      // Cleanup on unmount
      document.body.classList.remove('reduce-blur', 'simplify-animations', 'disable-haptics', 'optimize-charts');
    };
  }, []);

  return <>{children}</>;
};

/**
 * Example App Component
 * Shows how to integrate browser compatibility checking
 */
const BrowserCompatibilityExample = () => {
  return (
    <PerformanceOptimizations>
      <div className="min-h-screen bg-gray-50">
        <BrowserCompatibilityNotice />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Browser Compatibility Example
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BrowserInfoDisplay />
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Integration Instructions
              </h3>
              
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    1. Initialize on App Startup
                  </h4>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
{`import { initBrowserCompatibility } from './utils/browserDetection';

useEffect(() => {
  initBrowserCompatibility();
}, []);`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    2. Show Compatibility Notice
                  </h4>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
{`<BrowserCompatibilityNotice />`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    3. Apply Performance Optimizations
                  </h4>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
{`<PerformanceOptimizations>
  <App />
</PerformanceOptimizations>`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    4. Check Features at Runtime
                  </h4>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
{`const features = checkFeatureSupport();
if (features.backdropFilter) {
  // Use glass morphism
} else {
  // Use fallback styles
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              📚 Documentation
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              For complete browser compatibility information, refer to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
              <li>
                <code className="bg-blue-100 px-1 rounded">BROWSER_COMPATIBILITY.md</code> - 
                Technical compatibility details
              </li>
              <li>
                <code className="bg-blue-100 px-1 rounded">BROWSER_TESTING_GUIDE.md</code> - 
                Testing procedures
              </li>
              <li>
                <code className="bg-blue-100 px-1 rounded">BROWSER_COMPATIBILITY_SUMMARY.md</code> - 
                Implementation summary
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PerformanceOptimizations>
  );
};

export default BrowserCompatibilityExample;
export {
  BrowserCompatibilityNotice,
  BrowserInfoDisplay,
  PerformanceOptimizations
};
