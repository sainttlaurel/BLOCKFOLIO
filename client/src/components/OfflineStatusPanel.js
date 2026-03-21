/**
 * Comprehensive Offline Status Panel Component
 * 
 * Provides detailed offline mode information including data freshness,
 * available features, limitations, and user guidance for optimal offline experience.
 */

import React, { useState, useEffect } from 'react';
import { 
  WifiOff, 
  Wifi, 
  Database, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  BarChart3,
  Settings,
  FileText,
  TrendingUp,
  Activity,
  Zap,
  Shield
} from 'lucide-react';
import { useOfflineMode, useDataAge, useOfflineFeatures } from '../hooks/useOfflineMode';

const OfflineStatusPanel = ({ className = "", isOpen = false, onToggle = null }) => {
  const {
    isOffline,
    offlineStartTime,
    lastOnlineTime,
    availableFeatures,
    disabledFeatures,
    pendingActions,
    retryConnection
  } = useOfflineMode();
  
  const { getAllDataAges } = useDataAge();
  const { getFeatureStatus } = useOfflineFeatures();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isRetrying, setIsRetrying] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState(null);

  // Get comprehensive offline status
  useEffect(() => {
    if (isOffline && window.offlineService) {
      const status = window.offlineService.getComprehensiveOfflineStatus();
      setOfflineStatus(status);
    }
  }, [isOffline]);

  if (!isOffline) {
    return null;
  }

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      const result = await retryConnection();
      console.log('Connection retry result:', result);
    } catch (error) {
      console.error('Connection retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const getOfflineDuration = () => {
    if (!offlineStartTime) return null;
    
    const duration = Date.now() - offlineStartTime;
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(duration / 3600000);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '<1m';
    }
  };

  const formatDataAge = (ageMs) => {
    if (!ageMs) return 'Unknown';
    
    const minutes = Math.floor(ageMs / 60000);
    const hours = Math.floor(ageMs / 3600000);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const getDataQualityIcon = (dataType, age) => {
    if (!age) return <XCircle className="h-4 w-4 text-gray-400" />;
    
    const maxAge = offlineStatus?.dataQuality ? 300000 : 300000; // 5 minutes default
    
    if (age <= maxAge * 0.5) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (age <= maxAge) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const dataAges = getAllDataAges();
  const offlineDuration = getOfflineDuration();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'data', label: 'Data Status', icon: Database },
    { id: 'features', label: 'Features', icon: Zap },
    { id: 'guidance', label: 'Guidance', icon: Info },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <WifiOff className="h-5 w-5 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Offline Mode</h3>
            <p className="text-sm text-gray-600">
              {offlineDuration ? `Offline for ${offlineDuration}` : 'Currently offline'}
            </p>
          </div>
        </div>
        
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
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
            offlineStatus={offlineStatus}
            pendingActions={pendingActions}
            dataAges={dataAges}
            onRetry={handleRetryConnection}
            isRetrying={isRetrying}
          />
        )}

        {activeTab === 'data' && (
          <DataStatusTab
            dataAges={dataAges}
            offlineStatus={offlineStatus}
            formatDataAge={formatDataAge}
            getDataQualityIcon={getDataQualityIcon}
          />
        )}

        {activeTab === 'features' && (
          <FeaturesTab
            availableFeatures={availableFeatures}
            disabledFeatures={disabledFeatures}
            offlineStatus={offlineStatus}
          />
        )}

        {activeTab === 'guidance' && (
          <GuidanceTab
            offlineStatus={offlineStatus}
            onRetry={handleRetryConnection}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            offlineStatus={offlineStatus}
            offlineDuration={offlineDuration}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ offlineStatus, pendingActions, dataAges, onRetry, isRetrying }) => (
  <div className="space-y-4">
    {/* Status Summary */}
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-red-50 p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <WifiOff className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-red-800">Offline</span>
        </div>
        <p className="text-xs text-red-600 mt-1">No internet connection</p>
      </div>
      
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            {Object.keys(dataAges).length} Data Sources
          </span>
        </div>
        <p className="text-xs text-blue-600 mt-1">Cached data available</p>
      </div>
    </div>

    {/* Quick Stats */}
    <div className="grid grid-cols-3 gap-3 text-center">
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-lg font-semibold text-gray-900">
          {offlineStatus?.availableFeatures?.length || 0}
        </div>
        <div className="text-xs text-gray-600">Available Features</div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-lg font-semibold text-gray-900">{pendingActions}</div>
        <div className="text-xs text-gray-600">Queued Actions</div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-lg font-semibold text-gray-900">
          {offlineStatus?.dataQuality?.fresh?.size || 0}
        </div>
        <div className="text-xs text-gray-600">Fresh Data</div>
      </div>
    </div>

    {/* Action Button */}
    <button
      onClick={onRetry}
      disabled={isRetrying}
      className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
        isRetrying
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
      <span>{isRetrying ? 'Retrying...' : 'Retry Connection'}</span>
    </button>
  </div>
);

// Data Status Tab Component
const DataStatusTab = ({ dataAges, offlineStatus, formatDataAge, getDataQualityIcon }) => (
  <div className="space-y-4">
    <h4 className="font-medium text-gray-900">Cached Data Status</h4>
    
    <div className="space-y-3">
      {Object.entries(dataAges).map(([dataType, age]) => (
        <div key={dataType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {getDataQualityIcon(dataType, age?.milliseconds)}
            <div>
              <div className="text-sm font-medium text-gray-900 capitalize">
                {dataType.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {formatDataAge(age?.milliseconds)}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-xs font-medium ${
              age?.isVeryStale ? 'text-red-600' :
              age?.isStale ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {age?.isVeryStale ? 'Very Stale' :
               age?.isStale ? 'Stale' : 'Fresh'}
            </div>
          </div>
        </div>
      ))}
    </div>

    {Object.keys(dataAges).length === 0 && (
      <div className="text-center py-8 text-gray-500">
        <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No cached data available</p>
      </div>
    )}
  </div>
);

// Features Tab Component
const FeaturesTab = ({ availableFeatures, disabledFeatures, offlineStatus }) => (
  <div className="space-y-4">
    {/* Available Features */}
    <div>
      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
        Available Features ({availableFeatures.length})
      </h4>
      
      <div className="grid grid-cols-1 gap-2">
        {availableFeatures.map((feature) => (
          <div key={feature} className="flex items-center p-2 bg-green-50 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
            <span className="text-sm text-green-800 capitalize">
              {feature.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Disabled Features */}
    <div>
      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
        <XCircle className="h-4 w-4 text-red-500 mr-2" />
        Limited Features ({disabledFeatures.length})
      </h4>
      
      <div className="grid grid-cols-1 gap-2">
        {disabledFeatures.map((feature) => (
          <div key={feature} className="flex items-center p-2 bg-red-50 rounded-lg">
            <XCircle className="h-4 w-4 text-red-500 mr-3" />
            <span className="text-sm text-red-800 capitalize">
              {feature.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Guidance Tab Component
const GuidanceTab = ({ offlineStatus, onRetry }) => (
  <div className="space-y-4">
    {/* Tips */}
    {offlineStatus?.userGuidance?.tips && (
      <div>
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Info className="h-4 w-4 text-blue-500 mr-2" />
          Tips
        </h4>
        
        <div className="space-y-2">
          {offlineStatus.userGuidance.tips.map((tip, index) => (
            <div key={index} className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Recommendations */}
    {offlineStatus?.recommendations && (
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
        
        <div className="space-y-2">
          {offlineStatus.recommendations.map((rec, index) => (
            <div key={index} className={`p-3 rounded-lg ${
              rec.type === 'warning' ? 'bg-yellow-50' :
              rec.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
            }`}>
              <p className={`text-sm ${
                rec.type === 'warning' ? 'text-yellow-800' :
                rec.type === 'success' ? 'text-green-800' : 'text-blue-800'
              }`}>
                {rec.message}
              </p>
              
              {rec.action === 'retry_connection' && (
                <button
                  onClick={onRetry}
                  className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  Retry Now
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Analytics Tab Component
const AnalyticsTab = ({ offlineStatus, offlineDuration }) => (
  <div className="space-y-4">
    <h4 className="font-medium text-gray-900">Offline Session Analytics</h4>
    
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm font-medium text-gray-900">Session Duration</div>
        <div className="text-lg font-semibold text-gray-700">{offlineDuration || '0m'}</div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm font-medium text-gray-900">Data Quality</div>
        <div className="text-lg font-semibold text-gray-700">
          {offlineStatus?.dataQuality ? 
            `${Math.round((offlineStatus.dataQuality.fresh.size / 
              (offlineStatus.dataQuality.fresh.size + offlineStatus.dataQuality.stale.size + offlineStatus.dataQuality.veryStale.size)) * 100)}%` 
            : 'N/A'}
        </div>
      </div>
    </div>

    {/* Feature Usage */}
    {offlineStatus?.analytics && (
      <div>
        <h5 className="text-sm font-medium text-gray-900 mb-2">Feature Usage</h5>
        <div className="space-y-2">
          {offlineStatus.analytics.featureUsage?.mostUsedFeatures?.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700 capitalize">{feature.replace(/_/g, ' ')}</span>
              <span className="text-xs text-gray-500">Available</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default OfflineStatusPanel;