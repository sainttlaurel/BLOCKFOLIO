/**
 * Error Status Dashboard Component
 * 
 * Provides a comprehensive overview of system health, error patterns,
 * prevention status, and recovery options in a unified dashboard interface.
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Shield,
  Wifi,
  Database,
  Settings,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import errorMessageService from '../../services/errorMessageService';
import errorPreventionService from '../../services/errorPreventionService';
import retryService from '../../services/retryService';
import gracefulDegradationService from '../../services/gracefulDegradation';
import offlineService from '../../services/offlineService';
import ErrorRecoveryPanel from './ErrorRecoveryPanel';

const ErrorStatusDashboard = ({ 
  isOpen = false, 
  onClose = null,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState(null);
  const [errorStats, setErrorStats] = useState(null);
  const [preventionData, setPreventionData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRecoveryPanel, setShowRecoveryPanel] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadDashboardData();
      
      // Setup auto-refresh
      let refreshInterval;
      if (autoRefresh) {
        refreshInterval = setInterval(loadDashboardData, 30000); // 30 seconds
      }
      
      return () => {
        if (refreshInterval) clearInterval(refreshInterval);
      };
    }
  }, [isOpen, autoRefresh]);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    
    try {
      // Load system status
      const status = {
        degradation: gracefulDegradationService.getStatus(),
        offline: offlineService.getOfflineStatus(),
        retry: retryService.getMetrics(),
        connection: {
          isOnline: navigator.onLine,
          quality: 'good' // Would be from connection monitoring
        }
      };
      
      // Load error statistics
      const stats = errorMessageService.getErrorStatistics();
      
      // Load prevention data
      const prevention = {
        statistics: errorPreventionService.getPreventionStatistics(),
        warningsAndTips: errorPreventionService.getActiveWarningsAndTips()
      };
      
      setSystemStatus(status);
      setErrorStats(stats);
      setPreventionData(prevention);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportDashboardData = () => {
    const data = {
      timestamp: Date.now(),
      systemStatus,
      errorStats,
      preventionData,
      exportedBy: 'ErrorStatusDashboard'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-dashboard-${new Date().toISOString().split('T')[0]}.json`;
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
    { id: 'health', label: 'System Health', icon: CheckCircle },
    { id: 'errors', label: 'Error Analysis', icon: AlertTriangle },
    { id: 'prevention', label: 'Prevention', icon: Shield },
    { id: 'recovery', label: 'Recovery', icon: Settings }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Error Status Dashboard</h2>
            <p className="text-sm text-gray-600">
              System monitoring and error management center
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-md transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-600'
            }`}
            title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          >
            {autoRefresh ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          
          <button
            onClick={loadDashboardData}
            disabled={isRefreshing}
            className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={exportDashboardData}
            className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            title="Export data"
          >
            <Download className="h-4 w-4" />
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'overview' && (
          <OverviewTab 
            systemStatus={systemStatus}
            errorStats={errorStats}
            preventionData={preventionData}
          />
        )}

        {activeTab === 'health' && (
          <SystemHealthTab systemStatus={systemStatus} />
        )}

        {activeTab === 'errors' && (
          <ErrorAnalysisTab errorStats={errorStats} />
        )}

        {activeTab === 'prevention' && (
          <PreventionTab preventionData={preventionData} />
        )}

        {activeTab === 'recovery' && (
          <RecoveryTab onOpenRecoveryPanel={() => setShowRecoveryPanel(true)} />
        )}
      </div>

      {/* Recovery Panel Modal */}
      {showRecoveryPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full mx-4">
            <ErrorRecoveryPanel
              isOpen={true}
              onClose={() => setShowRecoveryPanel(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ systemStatus, errorStats, preventionData }) => (
  <div className="space-y-6">
    {/* System Status Summary */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatusCard
        title="System Health"
        value={getOverallHealthScore(systemStatus)}
        icon={Activity}
        color={getHealthColor(getOverallHealthScore(systemStatus))}
        subtitle="Overall score"
      />
      
      <StatusCard
        title="Active Errors"
        value={errorStats?.total24h || 0}
        icon={AlertTriangle}
        color={errorStats?.total24h > 5 ? 'red' : errorStats?.total24h > 0 ? 'yellow' : 'green'}
        subtitle="Last 24 hours"
      />
      
      <StatusCard
        title="Prevention Score"
        value={preventionData?.statistics?.systemHealth?.connection?.quality * 100 || 0}
        icon={Shield}
        color="blue"
        subtitle="Prevention effectiveness"
        format="percentage"
      />
      
      <StatusCard
        title="Recovery Rate"
        value={systemStatus?.retry?.successRate || 0}
        icon={TrendingUp}
        color="green"
        subtitle="Successful recoveries"
        format="percentage"
      />
    </div>

    {/* Quick Status Indicators */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Status</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <QuickStatusItem
          label="Connection"
          status={systemStatus?.connection?.isOnline ? 'healthy' : 'failed'}
          icon={Wifi}
        />
        
        <QuickStatusItem
          label="Data Services"
          status={systemStatus?.degradation?.level === 'full' ? 'healthy' : 'degraded'}
          icon={Database}
        />
        
        <QuickStatusItem
          label="Error Prevention"
          status={preventionData?.statistics?.activeWarnings > 0 ? 'active' : 'monitoring'}
          icon={Shield}
        />
      </div>
    </div>

    {/* Recent Activity */}
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h3>
      <div className="space-y-2">
        {getRecentActivity(systemStatus, errorStats, preventionData).map((activity, index) => (
          <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
            <div className={`w-2 h-2 rounded-full ${
              activity.type === 'error' ? 'bg-red-500' :
              activity.type === 'warning' ? 'bg-yellow-500' :
              activity.type === 'recovery' ? 'bg-green-500' : 'bg-blue-500'
            }`} />
            <span className="text-sm text-gray-700">{activity.message}</span>
            <span className="text-xs text-gray-500 ml-auto">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// System Health Tab Component
const SystemHealthTab = ({ systemStatus }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900">System Health Metrics</h3>
    
    {/* Health Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <HealthMetricCard
        title="Connection Health"
        metrics={[
          { label: 'Status', value: systemStatus?.connection?.isOnline ? 'Online' : 'Offline' },
          { label: 'Quality', value: systemStatus?.connection?.quality || 'Unknown' },
          { label: 'Degradation Level', value: systemStatus?.degradation?.level || 'Unknown' }
        ]}
        icon={Wifi}
        color="blue"
      />
      
      <HealthMetricCard
        title="Performance Health"
        metrics={[
          { label: 'Retry Success Rate', value: `${systemStatus?.retry?.successRate || 0}%` },
          { label: 'Circuit Breakers', value: systemStatus?.retry?.circuitBreakerTrips || 0 },
          { label: 'Active Retries', value: systemStatus?.retry?.activeRetries || 0 }
        ]}
        icon={TrendingUp}
        color="green"
      />
    </div>

    {/* Offline Status */}
    {systemStatus?.offline?.isOffline && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Offline Mode Active</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>Duration: {formatDuration(systemStatus.offline.offlineDuration)}</p>
          <p>Available Features: {systemStatus.offline.availableFeatures?.length || 0}</p>
          <p>Pending Actions: {systemStatus.offline.pendingActions || 0}</p>
        </div>
      </div>
    )}
  </div>
);

// Error Analysis Tab Component
const ErrorAnalysisTab = ({ errorStats }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900">Error Analysis</h3>
    
    {/* Error Statistics */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-red-600">{errorStats?.total24h || 0}</div>
        <div className="text-sm text-red-700">Total Errors (24h)</div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-yellow-600">
          {errorStats?.bySeverity?.warning || 0}
        </div>
        <div className="text-sm text-yellow-700">Warnings</div>
      </div>
      
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-red-600">
          {errorStats?.bySeverity?.error || 0}
        </div>
        <div className="text-sm text-red-700">Critical Errors</div>
      </div>
    </div>

    {/* Error Categories */}
    {errorStats?.byCategory && Object.keys(errorStats.byCategory).length > 0 && (
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Errors by Category</h4>
        <div className="space-y-2">
          {Object.entries(errorStats.byCategory).map(([category, count]) => (
            <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700 capitalize">{category}</span>
              <span className="text-sm font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Most Frequent Errors */}
    {errorStats?.mostFrequent?.length > 0 && (
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Most Frequent Errors</h4>
        <div className="space-y-2">
          {errorStats.mostFrequent.slice(0, 5).map(([error, count], index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">{error}</span>
              <span className="text-sm font-medium text-gray-900">{count}x</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Prevention Tab Component
const PreventionTab = ({ preventionData }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900">Error Prevention Status</h3>
    
    {/* Prevention Statistics */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 p-3 rounded-lg text-center">
        <div className="text-lg font-bold text-blue-600">
          {preventionData?.statistics?.activeWarnings || 0}
        </div>
        <div className="text-xs text-blue-700">Active Warnings</div>
      </div>
      
      <div className="bg-green-50 p-3 rounded-lg text-center">
        <div className="text-lg font-bold text-green-600">
          {preventionData?.statistics?.activeTips || 0}
        </div>
        <div className="text-xs text-green-700">Prevention Tips</div>
      </div>
      
      <div className="bg-purple-50 p-3 rounded-lg text-center">
        <div className="text-lg font-bold text-purple-600">
          {preventionData?.statistics?.errorPatterns?.predictions || 0}
        </div>
        <div className="text-xs text-purple-700">Predictions</div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-lg text-center">
        <div className="text-lg font-bold text-gray-600">
          {preventionData?.statistics?.userBehavior?.riskFactors?.length || 0}
        </div>
        <div className="text-xs text-gray-700">Risk Factors</div>
      </div>
    </div>

    {/* Active Warnings */}
    {preventionData?.warningsAndTips?.warnings?.length > 0 && (
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Active Warnings</h4>
        <div className="space-y-2">
          {preventionData.warningsAndTips.warnings.map((warning) => (
            <div key={warning.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">{warning.message}</p>
                  <div className="text-xs text-yellow-600 mt-1">
                    {new Date(warning.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Prevention Tips */}
    {preventionData?.warningsAndTips?.tips?.length > 0 && (
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Prevention Tips</h4>
        <div className="space-y-2">
          {preventionData.warningsAndTips.tips.map((tip) => (
            <div key={tip.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800">{tip.message}</p>
                  <div className="text-xs text-blue-600 mt-1">
                    Priority: {tip.priority}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Recovery Tab Component
const RecoveryTab = ({ onOpenRecoveryPanel }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900">Recovery Options</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        onClick={onOpenRecoveryPanel}
        className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
      >
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <div>
            <h4 className="font-medium text-blue-900">Open Recovery Center</h4>
            <p className="text-sm text-blue-700">Advanced diagnostics and recovery tools</p>
          </div>
        </div>
      </button>
      
      <button
        onClick={() => window.location.reload()}
        className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-6 w-6 text-gray-600" />
          <div>
            <h4 className="font-medium text-gray-900">Refresh Application</h4>
            <p className="text-sm text-gray-700">Reload the page to reset the application</p>
          </div>
        </div>
      </button>
    </div>
  </div>
);

// Helper Components
const StatusCard = ({ title, value, icon: Icon, color, subtitle, format = 'number' }) => {
  const formatValue = (val) => {
    if (format === 'percentage') {
      return `${Math.round(val)}%`;
    }
    return val;
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <Icon className={`h-4 w-4 text-${color}-600`} />
        <span className="text-sm font-medium text-gray-900">{title}</span>
      </div>
      <div className={`text-2xl font-bold text-${color}-600`}>
        {formatValue(value)}
      </div>
      <div className="text-xs text-gray-600">{subtitle}</div>
    </div>
  );
};

const QuickStatusItem = ({ label, status, icon: Icon }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'active': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Icon className={`h-4 w-4 ${getStatusColor(status)}`} />
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className={`text-xs capitalize ${getStatusColor(status)}`}>{status}</div>
      </div>
    </div>
  );
};

const HealthMetricCard = ({ title, metrics, icon: Icon, color }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <div className="flex items-center space-x-2 mb-3">
      <Icon className={`h-5 w-5 text-${color}-600`} />
      <h4 className="font-medium text-gray-900">{title}</h4>
    </div>
    <div className="space-y-2">
      {metrics.map((metric, index) => (
        <div key={index} className="flex justify-between text-sm">
          <span className="text-gray-600">{metric.label}</span>
          <span className="font-medium text-gray-900">{metric.value}</span>
        </div>
      ))}
    </div>
  </div>
);

// Helper Functions
const getOverallHealthScore = (systemStatus) => {
  if (!systemStatus) return 0;
  
  let score = 0;
  let factors = 0;
  
  if (systemStatus.connection?.isOnline) {
    score += 25;
  }
  factors++;
  
  if (systemStatus.degradation?.level === 'full') {
    score += 25;
  }
  factors++;
  
  if (systemStatus.retry?.successRate > 80) {
    score += 25;
  }
  factors++;
  
  if (!systemStatus.offline?.isOffline) {
    score += 25;
  }
  factors++;
  
  return Math.round(score);
};

const getHealthColor = (score) => {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
};

const getRecentActivity = (systemStatus, errorStats, preventionData) => {
  const activities = [];
  
  if (errorStats?.total24h > 0) {
    activities.push({
      type: 'error',
      message: `${errorStats.total24h} errors in the last 24 hours`,
      time: 'Recent'
    });
  }
  
  if (preventionData?.statistics?.activeWarnings > 0) {
    activities.push({
      type: 'warning',
      message: `${preventionData.statistics.activeWarnings} active prevention warnings`,
      time: 'Active'
    });
  }
  
  if (systemStatus?.retry?.successfulRetries > 0) {
    activities.push({
      type: 'recovery',
      message: `${systemStatus.retry.successfulRetries} successful recoveries`,
      time: 'Recent'
    });
  }
  
  return activities.slice(0, 5);
};

const formatDuration = (ms) => {
  if (!ms) return '0m';
  
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
};

export default ErrorStatusDashboard;