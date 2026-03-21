import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { createLazyRoute, usePerformanceMonitor, preloadCriticalResources } from './utils/performanceOptimization';
import { LazyPages, ComponentPreloader } from './utils/lazyComponents';
import { useRoutePreloading, useUserBehaviorPreloading } from './hooks/useLazyComponents';
import { useGracefulDegradation } from './hooks/useGracefulDegradation';
import { useOfflineMode } from './hooks/useOfflineMode';
import Navbar from './components/Navbar';
import RetryStatusIndicator from './components/RetryStatusIndicator';
import OfflineIndicator from './components/OfflineIndicator';
import OfflineStatusPanel from './components/OfflineStatusPanel';
import OfflinePortfolioView from './components/OfflinePortfolioView';
import PerformanceMonitor from './components/PerformanceMonitor';
import gracefulDegradationService from './services/gracefulDegradation';
import offlineService from './services/offlineService';
import GracefulDegradationDemo from './components/GracefulDegradationDemo';
import ErrorSystemIntegration from './components/ErrorDisplay/ErrorSystemIntegration';
import ErrorSystemDemo from './examples/ErrorSystemDemo';

// Lazy load pages for better initial load performance
const Login = createLazyRoute(() => import('./pages/Login'));
const Register = createLazyRoute(() => import('./pages/Register'));
const Dashboard = createLazyRoute(() => import('./pages/Dashboard'));

// Use enhanced lazy loading for non-critical pages
const { Portfolio, Trading, Transactions } = LazyPages;

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { isFeatureEnabled } = useGracefulDegradation();
  
  if (loading) {
    const shouldAnimate = isFeatureEnabled('animations');
    const spinnerClass = shouldAnimate 
      ? "animate-spin rounded-full h-12 w-12 border-b-2 border-fintech-brand-600"
      : "rounded-full h-12 w-12 border-2 border-fintech-brand-600 border-t-transparent";
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={spinnerClass}></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const { isFeatureEnabled } = useGracefulDegradation();
  
  if (loading) {
    const shouldAnimate = isFeatureEnabled('animations');
    const spinnerClass = shouldAnimate 
      ? "animate-spin rounded-full h-12 w-12 border-b-2 border-fintech-brand-600"
      : "rounded-full h-12 w-12 border-2 border-fintech-brand-600 border-t-transparent";
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={spinnerClass}></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
}

function App() {
  const performanceMonitor = usePerformanceMonitor();
  const { degradationLevel, networkQuality, isFeatureEnabled } = useGracefulDegradation();
  const { 
    isOffline, 
    offlineStartTime, 
    availableFeatures, 
    disabledFeatures,
    notifications,
    dismissNotification 
  } = useOfflineMode();
  
  // Enhanced lazy loading hooks
  useRoutePreloading();
  const { trackFeatureUsage } = useUserBehaviorPreloading();

  // State for offline status panel
  const [showOfflinePanel, setShowOfflinePanel] = React.useState(false);

  // Preload critical resources on app initialization
  React.useEffect(() => {
    preloadCriticalResources();
    
    // Preload critical components after initial load
    ComponentPreloader.preloadCriticalComponents();
    
    // Track app initialization time
    const initStartTime = performance.now();
    const initEndTime = performance.now();
    performanceMonitor.trackRenderTime('App', initEndTime - initStartTime);

    // Make offline service globally available for components
    window.offlineService = offlineService;
    
    // Load offline demo utilities in development
    if (process.env.NODE_ENV === 'development') {
      import('../utils/offlineDemo').then(demo => {
        console.log('🛠️ Offline demo utilities loaded');
        console.log('📖 Try: window.offlineDemo.run() to start the offline demo');
      });
    }
  }, [performanceMonitor]);

  // Handle graceful degradation events
  React.useEffect(() => {
    const handleDegradationChange = (event) => {
      console.log('App: Degradation level changed to', event.current);
      
      // Show user notification for significant degradation
      if (event.current === 'minimal' || event.current === 'offline') {
        console.log('Reduced functionality due to network conditions');
      }
    };

    const handleNetworkQualityChange = (event) => {
      console.log('App: Network quality changed to', event.current);
    };

    gracefulDegradationService.on('degradationLevelChanged', handleDegradationChange);
    gracefulDegradationService.on('networkQualityChanged', handleNetworkQualityChange);

    return () => {
      gracefulDegradationService.off('degradationLevelChanged', handleDegradationChange);
      gracefulDegradationService.off('networkQualityChanged', handleNetworkQualityChange);
    };
  }, []);

  // Handle offline mode changes
  React.useEffect(() => {
    const handleOfflineModeChange = (event, data) => {
      console.log('App: Offline mode event:', event, data);
      
      // Auto-show offline panel when going offline
      if (event === 'offline_mode_activated') {
        setShowOfflinePanel(true);
      } else if (event === 'online_mode_restored') {
        setShowOfflinePanel(false);
      }
    };

    offlineService.addListener(handleOfflineModeChange);

    return () => {
      offlineService.removeListener(handleOfflineModeChange);
    };
  }, []);

  // Track navigation for user behavior analysis
  const handleNavigation = React.useCallback((feature) => {
    trackFeatureUsage(feature);
  }, [trackFeatureUsage]);

  // Determine loading spinner based on degradation level
  const getLoadingSpinner = () => {
    const shouldAnimate = isFeatureEnabled('animations');
    const spinnerClass = shouldAnimate 
      ? "animate-spin rounded-full h-12 w-12 border-b-2 border-fintech-brand-600"
      : "rounded-full h-12 w-12 border-2 border-fintech-brand-600 border-t-transparent";
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={spinnerClass}></div>
        {degradationLevel === 'offline' && (
          <p className="ml-4 text-fintech-neutral-600">Working offline...</p>
        )}
      </div>
    );
  };

  return (
    <ErrorSystemIntegration>
      <AuthProvider>
      <Router>
        <div className="min-h-screen bg-fintech-neutral-50">
          <Navbar />
          <main className="px-4 py-6">
            <Suspense fallback={getLoadingSpinner()}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <div className="container mx-auto">
                        <Login />
                      </div>
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <PublicRoute>
                      <div className="container mx-auto">
                        <Register />
                      </div>
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/portfolio" 
                  element={
                    <ProtectedRoute>
                      <div className="container mx-auto" onClick={() => handleNavigation('portfolio')}>
                        <Portfolio />
                      </div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/trading" 
                  element={
                    <ProtectedRoute>
                      <div className="container mx-auto" onClick={() => handleNavigation('trading')}>
                        <Trading />
                      </div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/transactions" 
                  element={
                    <ProtectedRoute>
                      <div className="container mx-auto" onClick={() => handleNavigation('transactions')}>
                        <Transactions />
                      </div>
                    </ProtectedRoute>
                  } 
                />
                {/* Demo routes - only available in development */}
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <Route 
                      path="/degradation-demo" 
                      element={
                        <ProtectedRoute>
                          <div className="container mx-auto">
                            <GracefulDegradationDemo />
                          </div>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/offline-demo" 
                      element={
                        <ProtectedRoute>
                          <div className="container mx-auto">
                            <OfflinePortfolioView />
                          </div>
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/error-demo" 
                      element={
                        <ProtectedRoute>
                          <ErrorSystemDemo />
                        </ProtectedRoute>
                      } 
                    />
                  </>
                )}
              </Routes>
            </Suspense>
          </main>
          
          {/* Global Status Components */}
          <RetryStatusIndicator position="top-right" showDetails={false} />
          <OfflineIndicator 
            position="top-right" 
            showDetails={false}
            onClick={() => setShowOfflinePanel(!showOfflinePanel)}
          />
          
          {/* Enhanced Offline Status Panel */}
          {isOffline && showOfflinePanel && (
            <div className="fixed top-16 right-4 w-96 z-50">
              <OfflineStatusPanel 
                isOpen={showOfflinePanel}
                onToggle={() => setShowOfflinePanel(!showOfflinePanel)}
              />
            </div>
          )}
          
          {/* Offline Notifications */}
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md"
            >
              <div className={`p-4 rounded-lg shadow-lg border ${
                notification.type === 'offline' ? 'bg-red-50 border-red-200' :
                notification.type === 'online' ? 'bg-green-50 border-green-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`font-medium ${
                      notification.type === 'offline' ? 'text-red-800' :
                      notification.type === 'online' ? 'text-green-800' :
                      'text-blue-800'
                    }`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      notification.type === 'offline' ? 'text-red-700' :
                      notification.type === 'online' ? 'text-green-700' :
                      'text-blue-700'
                    }`}>
                      {notification.message}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="ml-3 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <Toaster position="top-right" />
          
          {/* Performance Monitor - only show in development */}
          <PerformanceMonitor showMetrics={process.env.NODE_ENV === 'development'} />
        </div>
      </Router>
      </AuthProvider>
    </ErrorSystemIntegration>
  );
}

export default App;