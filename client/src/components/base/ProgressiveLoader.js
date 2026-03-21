import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * ProgressiveLoader - Multi-stage loading component for complex data operations
 * Provides step-by-step loading feedback for trading platform operations
 * Requirements: 7.6 - Loading states and skeleton screens for data fetching operations
 */
const ProgressiveLoader = ({
  stages = [],
  currentStage = 0,
  progress = 0,
  showProgress = true,
  showStageLabels = true,
  glassMorphism = false,
  className = '',
  onStageComplete,
  onAllComplete
}) => {
  const [completedStages, setCompletedStages] = useState(new Set());

  useEffect(() => {
    if (currentStage > 0 && !completedStages.has(currentStage - 1)) {
      const newCompleted = new Set(completedStages);
      newCompleted.add(currentStage - 1);
      setCompletedStages(newCompleted);
      
      if (onStageComplete) {
        onStageComplete(currentStage - 1);
      }
    }
    
    if (currentStage >= stages.length && onAllComplete) {
      onAllComplete();
    }
  }, [currentStage, completedStages, stages.length, onStageComplete, onAllComplete]);

  const containerClasses = [
    'progressive-loader',
    glassMorphism ? 'glass-card glass-card--loading p-6' : 'bg-surface-primary border border-primary rounded-lg p-6',
    'space-y-4',
    className
  ].filter(Boolean).join(' ');

  const getStageStatus = (index) => {
    if (completedStages.has(index)) return 'completed';
    if (index === currentStage) return 'active';
    if (index < currentStage) return 'completed';
    return 'pending';
  };

  const getStageIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 bg-market-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'active':
        return (
          <div className="w-6 h-6 bg-brand-primary-500 rounded-full flex items-center justify-center">
            <LoadingSpinner size="xs" color="white" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-neutral-300 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-neutral-500 rounded-full"></div>
          </div>
        );
    }
  };

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-secondary">
            <span>Loading Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar h-2">
            <div 
              className="progress-bar-fill h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Stage List */}
      {stages.length > 0 && (
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const status = getStageStatus(index);
            return (
              <div key={index} className="flex items-center space-x-3">
                {getStageIcon(status)}
                {showStageLabels && (
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      status === 'completed' ? 'text-market-green-600' :
                      status === 'active' ? 'text-brand-primary-600' :
                      'text-tertiary'
                    }`}>
                      {stage.label || `Stage ${index + 1}`}
                    </div>
                    {stage.description && (
                      <div className="text-xs text-tertiary mt-1">
                        {stage.description}
                      </div>
                    )}
                  </div>
                )}
                {status === 'active' && stage.estimatedTime && (
                  <div className="text-xs text-tertiary">
                    ~{stage.estimatedTime}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Current Stage Message */}
      {currentStage < stages.length && stages[currentStage] && (
        <div className="text-center p-4 bg-surface-secondary rounded-lg">
          <div className="text-sm font-medium text-primary mb-1">
            {stages[currentStage].label || `Stage ${currentStage + 1}`}
          </div>
          {stages[currentStage].message && (
            <div className="text-xs text-secondary">
              {stages[currentStage].message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Predefined progressive loaders for common trading platform operations
export const TradingPlatformInitLoader = (props) => {
  const stages = [
    {
      label: 'Connecting to Markets',
      description: 'Establishing secure connection to trading APIs',
      message: 'Connecting to cryptocurrency exchanges...',
      estimatedTime: '2s'
    },
    {
      label: 'Loading Portfolio Data',
      description: 'Fetching your current holdings and balances',
      message: 'Retrieving your portfolio information...',
      estimatedTime: '1s'
    },
    {
      label: 'Updating Market Prices',
      description: 'Getting latest cryptocurrency prices',
      message: 'Synchronizing real-time market data...',
      estimatedTime: '1s'
    },
    {
      label: 'Initializing Charts',
      description: 'Loading price history and technical indicators',
      message: 'Preparing interactive charts...',
      estimatedTime: '2s'
    }
  ];

  return (
    <ProgressiveLoader
      stages={stages}
      glassMorphism={true}
      {...props}
    />
  );
};

export const DataSyncLoader = (props) => {
  const stages = [
    {
      label: 'Validating Data',
      description: 'Checking data integrity and consistency',
      message: 'Validating market data...'
    },
    {
      label: 'Synchronizing Prices',
      description: 'Updating all cryptocurrency prices',
      message: 'Syncing latest prices...'
    },
    {
      label: 'Calculating Metrics',
      description: 'Computing portfolio performance metrics',
      message: 'Calculating performance data...'
    },
    {
      label: 'Updating Interface',
      description: 'Refreshing all visual components',
      message: 'Updating display...'
    }
  ];

  return (
    <ProgressiveLoader
      stages={stages}
      glassMorphism={true}
      {...props}
    />
  );
};

export const TradeExecutionLoader = (props) => {
  const stages = [
    {
      label: 'Validating Order',
      description: 'Checking order parameters and balances',
      message: 'Validating trade details...'
    },
    {
      label: 'Submitting to Exchange',
      description: 'Sending order to cryptocurrency exchange',
      message: 'Submitting order...'
    },
    {
      label: 'Awaiting Confirmation',
      description: 'Waiting for exchange confirmation',
      message: 'Processing trade...'
    },
    {
      label: 'Updating Portfolio',
      description: 'Refreshing balances and holdings',
      message: 'Updating your portfolio...'
    }
  ];

  return (
    <ProgressiveLoader
      stages={stages}
      glassMorphism={true}
      {...props}
    />
  );
};

export default ProgressiveLoader;