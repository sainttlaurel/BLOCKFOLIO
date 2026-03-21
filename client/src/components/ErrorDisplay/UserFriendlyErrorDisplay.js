/**
 * User-Friendly Error Display Component
 * 
 * Displays comprehensive error messages with recovery options,
 * contextual guidance, and progressive error handling.
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  RefreshCw, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Copy,
  X
} from 'lucide-react';
import errorMessageService from '../../services/errorMessageService';

const UserFriendlyErrorDisplay = ({ 
  error, 
  onRetry = null, 
  onDismiss = null,
  showDetails = false,
  compact = false,
  className = ""
}) => {
  const [errorResponse, setErrorResponse] = useState(null);
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [executingAction, setExecutingAction] = useState(null);
  const [actionResults, setActionResults] = useState({});

  useEffect(() => {
    if (error) {
      const response = errorMessageService.processError(error, {
        currentPage: window.location.pathname,
        retryFunction: onRetry
      });
      setErrorResponse(response);
    }
  }, [error, onRetry]);

  if (!errorResponse) {
    return null;
  }

  const handleRecoveryAction = async (actionKey) => {
    setExecutingAction(actionKey);
    
    try {
      const result = await errorMessageService.executeRecoveryAction(
        actionKey, 
        errorResponse
      );
      
      setActionResults(prev => ({
        ...prev,
        [actionKey]: result
      }));
      
      if (result.success && actionKey === 'retry_request' && onRetry) {
        onRetry();
      }
    } catch (error) {
      setActionResults(prev => ({
        ...prev,
        [actionKey]: { success: false, message: error.message }
      }));
    } finally {
      setExecutingAction(null);
    }
  };

  const copyErrorDetails = () => {
    const details = {
      id: errorResponse.id,
      timestamp: new Date(errorResponse.timestamp).toISOString(),
      type: errorResponse.type,
      message: errorResponse.message,
      context: errorResponse.context
    };
    
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
  };

  const getSeverityConfig = () => {
    const configs = {
      critical: {
        icon: AlertTriangle,
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600'
      },
      error: {
        icon: AlertCircle,
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600'
      },
      warning: {
        icon: AlertTriangle,
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600'
      },
      info: {
        icon: Info,
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600'
      }
    };
    
    return configs[errorResponse.severity] || configs.error;
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`
        flex items-center space-x-3 p-3 rounded-lg border
        ${config.bgColor} ${config.borderColor} ${className}
      `}>
        <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {errorResponse.title}
          </p>
          <p className={`text-sm ${config.textColor} opacity-90`}>
            {errorResponse.message}
          </p>
        </div>
        
        {errorResponse.recoveryOptions.length > 0 && (
          <button
            onClick={() => handleRecoveryAction(errorResponse.recoveryOptions[0].key)}
            disabled={executingAction}
            className={`
              px-3 py-1 text-sm font-medium rounded-md transition-colors
              ${executingAction 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : `bg-${config.color}-100 text-${config.color}-700 hover:bg-${config.color}-200`
              }
            `}
          >
            {executingAction ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              errorResponse.recoveryOptions[0].label
            )}
          </button>
        )}
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`
      rounded-lg border shadow-sm ${config.bgColor} ${config.borderColor} ${className}
    `}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <Icon className={`h-6 w-6 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${config.textColor}`}>
                {errorResponse.title}
              </h3>
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <p className={`mt-1 text-sm ${config.textColor} opacity-90`}>
              {errorResponse.message}
            </p>
            
            {/* Metadata */}
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
              <span>Error ID: {errorResponse.id.slice(-8)}</span>
              <span>
                {new Date(errorResponse.timestamp).toLocaleTimeString()}
              </span>
              {errorResponse.metadata.estimatedRecoveryTime && (
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Est. recovery: {errorResponse.metadata.estimatedRecoveryTime}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recovery Actions */}
      {errorResponse.recoveryOptions.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className={`text-sm font-medium ${config.textColor} mb-3`}>
            What you can do:
          </h4>
          
          <div className="space-y-2">
            {errorResponse.recoveryOptions.slice(0, 3).map((option) => (
              <RecoveryActionButton
                key={option.key}
                option={option}
                isExecuting={executingAction === option.key}
                result={actionResults[option.key]}
                onExecute={() => handleRecoveryAction(option.key)}
                severity={errorResponse.severity}
              />
            ))}
          </div>
          
          {errorResponse.recoveryOptions.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`mt-2 text-sm font-medium ${config.textColor} hover:opacity-80 flex items-center space-x-1`}
            >
              <span>
                {isExpanded ? 'Show fewer options' : `Show ${errorResponse.recoveryOptions.length - 3} more options`}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Additional Recovery Options */}
          {errorResponse.recoveryOptions.length > 3 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Additional Options:
              </h5>
              <div className="space-y-2">
                {errorResponse.recoveryOptions.slice(3).map((option) => (
                  <RecoveryActionButton
                    key={option.key}
                    option={option}
                    isExecuting={executingAction === option.key}
                    result={actionResults[option.key]}
                    onExecute={() => handleRecoveryAction(option.key)}
                    severity={errorResponse.severity}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* Affected Features */}
          {errorResponse.metadata.affectedFeatures?.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Affected Features:
              </h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {errorResponse.metadata.affectedFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Details */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Technical Details:
            </h5>
            <div className="bg-gray-50 rounded-md p-3 text-xs font-mono text-gray-600">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div>Type: {errorResponse.type}</div>
                  <div>Category: {errorResponse.category}</div>
                  {errorResponse.originalError?.response?.status && (
                    <div>Status: {errorResponse.originalError.response.status}</div>
                  )}
                </div>
                <button
                  onClick={copyErrorDetails}
                  className="text-gray-400 hover:text-gray-600"
                  title="Copy error details"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Recovery Action Button Component
const RecoveryActionButton = ({ 
  option, 
  isExecuting, 
  result, 
  onExecute, 
  severity,
  compact = false 
}) => {
  const getButtonStyle = () => {
    if (!option.available) {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    }
    
    if (isExecuting) {
      return 'bg-gray-100 text-gray-600 cursor-wait';
    }
    
    const styles = {
      high: 'bg-blue-600 text-white hover:bg-blue-700',
      medium: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      low: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    };
    
    return styles[option.priority] || styles.medium;
  };

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <button
        onClick={onExecute}
        disabled={!option.available || isExecuting}
        className={`
          w-full flex items-center justify-between p-3 rounded-md font-medium transition-colors
          ${getButtonStyle()}
        `}
      >
        <div className="flex items-center space-x-3">
          {isExecuting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <div className={`w-2 h-2 rounded-full ${
              option.priority === 'high' ? 'bg-green-500' :
              option.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
            }`} />
          )}
          
          <div className="text-left">
            <div className="font-medium">{option.label}</div>
            {!compact && (
              <div className="text-xs opacity-75">{option.description}</div>
            )}
          </div>
        </div>
        
        {option.estimated && !compact && (
          <div className="text-xs opacity-75">
            {option.estimated}
          </div>
        )}
      </button>
      
      {/* Action Result */}
      {result && (
        <div className={`text-xs p-2 rounded ${
          result.success 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center space-x-1">
            {result.success ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            <span>{result.message}</span>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      {!compact && option.instructions && option.instructions.length > 0 && (
        <div className="text-xs text-gray-600 ml-7">
          <div className="font-medium mb-1">Steps:</div>
          <ol className="space-y-0.5">
            {option.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-gray-400">{index + 1}.</span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default UserFriendlyErrorDisplay;