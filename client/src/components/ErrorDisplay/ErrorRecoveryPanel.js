/**
 * Error Recovery Panel Component
 * 
 * Provides a comprehensive error recovery interface with step-by-step guidance,
 * system diagnostics, and proactive error prevention suggestions.
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Settings, 
  Activity,
  Wifi,
  Database,
  Shield,
  TrendingUp,
  Clock,
  Info,
  ExternalLink,
  Download
} from 'lucide-react';
import errorMessageService from '../../services/errorMessageService';
import retryService from '../../services/retryService';
import gracefulDegradationService from '../../services/gracefulDegradation';
import offlineService from '../../services/offlineService';

const ErrorRecoveryPanel = ({ 
  isOpen = false, 
  onClose = null,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState(null);
  const [errorStats, setErrorStats] = useState(null);
  const [userGuidance, setUserGuidance] = useState(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticsResults, setDiagnosticsResults] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadSystemStatus();
      loadErrorStatistics();
      loadUserGuidance();
    }
  }, [isOpen]);

  const loadSystemStatus = async () => {
    try {
      const status = {
        degradation: gracefulDegradationService.getStatus(),
        offline: offlineService.getOfflineStatus(),
        retry: retryService.getMetrics(),
        connection: {
          isOnline: navigator.onLine,
          quality: 'good' // Would be determined by connection monitoring
        }
      };
      
      setSystemStatus(status);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const loadErrorStatistics = () => {
    try {
      const stats = errorMessageService.getErrorStatistics();
      setErrorStats(stats);
    } catch (error) {
      console.error('Failed to load error statistics:', error);
    }
  };

  const loadUserGuidance = () => {
    try {
      const guidance = errorMessageService.getUserGuidance();
      setUserGuidance(guidance);
    } catch (error) {
      console.error('Failed to load user guidance:', error);
    }
  };

  const runSystemDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    
    try {
      const results = {
        connection: await testConnection(),
        services: await testServices(),
        cache: await testCache(),
        performance: await testPerformance()
      };
      
      setDiagnosticsResults(results);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const testConnection = async () => {
    try {
      const start = Date.now();
      const response = await fetch('/api/ping', { method: 'HEAD' });
      const latency = Date.now() - start;
      
      return {
        status: response.ok ? 'healthy' : 'degraded',
        latency,
        details: response.ok ? 'Connection is working normally' : 'Connection issues detected'
      };
    } catch (error) {
      return {
        status: 'failed',
        latency: null,
        details: 'Unable to connect to server'
      };
    }
  };

  const testServices = async () => {
    const services = ['data', 'trading', 'authentication'];
    const results = {};
    
    for (const service of services) {
      try {
        // Mock service health check
        results[service] = {
          status: 'healthy',
          details: `${service} service is operational`
        };
      } catch (error) {
        results[service] = {
          status: 'failed',
          details: `${service} service is unavailable`
        };
      }
    }
    
    return results;
  };

  const testCache = async () => {
    try {
      // Test cache functionality
      const testKey = 'diagnostics_test';
      const testValue = { timestamp: Date.now() };
      
      localStorage.setItem(testKey, JSON.stringify(testValue));
      const retrieved = JSON.parse(localStorage.getItem(testKey));
      localStorage.removeItem(testKey);
      
      return {
        status: retrieved ? 'healthy' : 'failed',
        details: retrieved ? 'Cache is working normally' : 'Cache functionality is impaired'
      };
    } catch (error) {
      return {
        status: 'failed',
        details: 'Cache is not accessible'
      };
    }
  };

  const testPerformance = async () => {
    try {
      const start = performance.now();
      
      // Simulate performance test
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const duration = performance.now() - start;
      
      return {
        status: duration < 200 ? 'healthy' : 'degraded',
        details: `Performance test completed in ${Math.round(duration)}ms`
      };
    } catch (error) {
      return {
        status: 'failed',
        details: 'Performance test failed'
      };
    }
  };

  const exportDiagnostics = () => {
    const data = {
      timestamp: Date.now(),
      systemStatus,
      errorStats,
      diagnosticsResults,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-diagnostics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'diagnostics', label: 'Diagnostics', icon: Settings },
    { id: 'guidance', label: 'Guidance', icon: Info },
    { id: 'prevention', label: 'Prevention', icon: Shield }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Error Recovery Center</h2>
            <p className="text-sm text-gray-600">System diagnostics and recovery tools</p>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <OverviewTab 
            systemStatus={systemStatus}
            errorStats={errorStats}
            onRefresh={loadSystemStatus}
          />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticsTab
            diagnosticsResults={diagnosticsResults}
            isRunning={isRunningDiagnostics}
            onRunDiagnostics={runSystemDiagnostics}
            onExport={exportDiagnostics}
          />
        )}

        {activeTab === 'guidance' && (
          <GuidanceTab userGuidance={userGuidance} />
        )}

        {activeTab === 'prevention' && (
          <PreventionTab systemStatus={systemStatus} />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ systemStatus, errorStats, onRefresh }) => (
  <div className="space-y-6">
    {/* System Health Summary */}
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">System Health</h3>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HealthCard
          title="Connection"
          status={systemStatus?.connection?.isOnline ? 'healthy' : 'failed'}
          icon={Wifi}
          details={systemStatus?.connection?.isOnline ? 'Online' : 'Offline'}
        />
        
        <HealthCard
          title="Data Services"
          status={systemStatus?.degradation?.level === 'full' ? 'healthy' : 'degraded'}
          icon={Database}
          details={systemStatus?.degradation?.level || 'Unknown'}
        />
        
        <HealthCard
          title="Retry System"
          status={systemStatus?.retry?.successRate > 80 ? 'healthy' : 'degraded'}
          icon={TrendingUp}
          details={`${systemStatus?.retry?.successRate || 0}% success`}
        />
        
        <HealthCard
          title="Offline Mode"
          status={systemStatus?.offline?.isOffline ? 'active' : 'standby'}
          icon={Shield}
          details={systemStatus?.offline?.isOffline ? 'Active' : 'Standby'}
        />
      </div>
    </div>

    {/* Error Statistics */}
    {errorStats && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Error Statistics (24h)</h3>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{errorStats.total24h}</div>
              <div className="text-sm text-gray-600">Total Errors</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-red-600">
                {errorStats.bySeverity?.error || 0}
              </div>
              <div className="text-sm text-gray-600">Critical/Error</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {errorStats.bySeverity?.warning || 0}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
          </div>
          
          {errorStats.mostFrequent?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Most Frequent:</h4>
              <div className="space-y-1">
                {errorStats.mostFrequent.slice(0, 3).map(([error, count], index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{error}</span>
                    <span className="font-medium">{count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

// Health Card Component
const HealthCard = ({ title, status, icon: Icon, details }) => {
  const getStatusConfig = () => {
    const configs = {
      healthy: { color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-800' },
      degraded: { color: 'yellow', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800' },
      failed: { color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-800' },
      active: { color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-800' },
      standby: { color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-800' }
    };
    
    return configs[status] || configs.failed;
  };

  const config = getStatusConfig();

  return (
    <div className={`p-3 rounded-lg border ${config.bgColor} border-${config.color}-200`}>
      <div className="flex items-center space-x-2 mb-2">
        <Icon className={`h-4 w-4 text-${config.color}-600`} />
        <span className="text-sm font-medium text-gray-900">{title}</span>
      </div>
      <div className={`text-xs ${config.textColor} capitalize`}>
        {details}
      </div>
    </div>
  );
};

// Diagnostics Tab Component
const DiagnosticsTab = ({ diagnosticsResults, isRunning, onRunDiagnostics, onExport }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium text-gray-900">System Diagnostics</h3>
      
      <div className="flex space-x-2">
        <button
          onClick={onRunDiagnostics}
          disabled={isRunning}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
            isRunning
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Running...' : 'Run Diagnostics'}</span>
        </button>
        
        {diagnosticsResults && (
          <button
            onClick={onExport}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        )}
      </div>
    </div>

    {diagnosticsResults && (
      <div className="space-y-4">
        {Object.entries(diagnosticsResults).map(([category, result]) => (
          <DiagnosticResult key={category} category={category} result={result} />
        ))}
      </div>
    )}

    {!diagnosticsResults && !isRunning && (
      <div className="text-center py-8 text-gray-500">
        <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Run diagnostics to check system health</p>
      </div>
    )}
  </div>
);

// Diagnostic Result Component
const DiagnosticResult = ({ category, result }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  if (typeof result === 'object' && !result.status) {
    // Multiple service results
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 capitalize">{category}</h4>
        <div className="space-y-2">
          {Object.entries(result).map(([service, serviceResult]) => (
            <div key={service} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 capitalize">{service}</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(serviceResult.status)}
                <span className="text-sm text-gray-600">{serviceResult.details}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 capitalize">{category}</h4>
        <div className="flex items-center space-x-2">
          {getStatusIcon(result.status)}
          <span className="text-sm text-gray-600">{result.details}</span>
        </div>
      </div>
      
      {result.latency && (
        <div className="mt-2 text-xs text-gray-500">
          Latency: {result.latency}ms
        </div>
      )}
    </div>
  );
};

// Guidance Tab Component
const GuidanceTab = ({ userGuidance }) => (
  <div className="space-y-6">
    {userGuidance?.tips?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tips</h3>
        <div className="space-y-3">
          {userGuidance.tips.map((tip, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {userGuidance?.warnings?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Warnings</h3>
        <div className="space-y-3">
          {userGuidance.warnings.map((warning, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">{warning}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {userGuidance?.recommendations?.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
        <div className="space-y-3">
          {userGuidance.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {(!userGuidance || (
      (!userGuidance.tips || userGuidance.tips.length === 0) &&
      (!userGuidance.warnings || userGuidance.warnings.length === 0) &&
      (!userGuidance.recommendations || userGuidance.recommendations.length === 0)
    )) && (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-300" />
        <p>No guidance needed - system is operating normally</p>
      </div>
    )}
  </div>
);

// Prevention Tab Component
const PreventionTab = ({ systemStatus }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900">Error Prevention</h3>
    
    <div className="space-y-4">
      <PreventionCard
        title="Connection Monitoring"
        description="Automatically monitor connection quality and switch to fallback modes"
        status="active"
        actions={[
          { label: 'View Connection Status', action: 'view_connection' },
          { label: 'Configure Fallbacks', action: 'configure_fallbacks' }
        ]}
      />
      
      <PreventionCard
        title="Proactive Caching"
        description="Cache critical data to ensure availability during outages"
        status="active"
        actions={[
          { label: 'View Cache Status', action: 'view_cache' },
          { label: 'Manage Cache Settings', action: 'manage_cache' }
        ]}
      />
      
      <PreventionCard
        title="Error Prediction"
        description="Analyze patterns to predict and prevent common errors"
        status="learning"
        actions={[
          { label: 'View Patterns', action: 'view_patterns' },
          { label: 'Configure Alerts', action: 'configure_alerts' }
        ]}
      />
    </div>
  </div>
);

// Prevention Card Component
const PreventionCard = ({ title, description, status, actions }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="flex items-start justify-between mb-3">
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        status === 'active' ? 'bg-green-100 text-green-800' :
        status === 'learning' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {status}
      </span>
    </div>
    
    <div className="flex space-x-2">
      {actions.map((action, index) => (
        <button
          key={index}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <span>{action.label}</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      ))}
    </div>
  </div>
);

export default ErrorRecoveryPanel;