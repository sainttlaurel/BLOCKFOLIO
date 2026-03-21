/**
 * Error System Demonstration Component
 * 
 * Demonstrates the comprehensive error messaging and recovery system
 * with various error scenarios and recovery options.
 */

import React, { useState } from 'react';
import { AlertTriangle, Wifi, Database, TrendingUp, Settings } from 'lucide-react';
import ErrorSystemIntegration, { useErrorSystem } from '../components/ErrorDisplay/ErrorSystemIntegration';
import UserFriendlyErrorDisplay from '../components/ErrorDisplay/UserFriendlyErrorDisplay';
import ErrorStatusDashboard from '../components/ErrorDisplay/ErrorStatusDashboard';
import errorMessageService from '../services/errorMessageService';

const ErrorSystemDemo = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentError, setCurrentError] = useState(null);
  const { errorStats, systemHealth, validateInput } = useErrorSystem();

  // Demo error scenarios
  const errorScenarios = [
    {
      id: 'network',
      title: 'Network Connection Error',
      description: 'Simulate a network connectivity issue',
      error: () => {
        const error = new Error('Failed to fetch data from server');
        error.code = 'NETWORK_ERROR';
        return error;
      }
    },
    {
      id: 'authentication',
      title: 'Authentication Error',
      description: 'Simulate an authentication failure',
      error: () => {
        const error = new Error('Unauthorized access');
        error.response = { status: 401 };
        return error;
      }
    },
    {
      id: 'trading',
      title: 'Trading Error',
      description: 'Simulate insufficient balance for trading',
      error: () => {
        const error = new Error('Insufficient balance for trade');
        error.code = 'INSUFFICIENT_BALANCE';
        return error;
      }
    },
    {
      id: 'server',
      title: 'Server Error',
      description: 'Simulate a server-side error',
      error: () => {
        const error = new Error('Internal server error');
        error.response = { status: 500 };
        return error;
      }
    },
    {
      id: 'validation',
      title: 'Validation Error',
      description: 'Simulate input validation failure',
      error: () => {
        const error = new Error('Invalid input provided');
        error.response = { status: 400 };
        return error;
      }
    }
  ];

  const simulateError = (scenario) => {
    const error = scenario.error();
    const errorResponse = errorMessageService.processError(error, {
      currentPage: '/demo',
      userAction: 'demo_simulation',
      scenario: scenario.id
    });
    
    setCurrentError(errorResponse);
  };

  const handleRetry = () => {
    console.log('Retry action executed');
    setCurrentError(null);
  };

  const testInputValidation = () => {
    const testInputs = [
      { amount: '100', type: 'trading' },
      { amount: 'invalid', type: 'trading' },
      { email: 'test@example.com', type: 'authentication' },
      { email: 'invalid-email', type: 'authentication' }
    ];

    testInputs.forEach(input => {
      const validation = validateInput(input, { type: input.type });
      console.log(`Validation for ${JSON.stringify(input)}:`, validation);
    });
  };

  return (
    <ErrorSystemIntegration>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Error System Demonstration
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              This demo showcases the comprehensive error messaging and recovery system 
              with user-friendly error displays, contextual recovery options, and 
              proactive error prevention.
            </p>
          </div>

          {/* System Status Overview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <Wifi className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-blue-900">Connection</div>
                <div className="text-xs text-blue-700">Online</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-green-900">Data Services</div>
                <div className="text-xs text-green-700">Operational</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-purple-900">Error Rate</div>
                <div className="text-xs text-purple-700">
                  {errorStats?.total24h || 0} errors (24h)
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <Settings className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-900">Prevention</div>
                <div className="text-xs text-gray-700">Active</div>
              </div>
            </div>

            <button
              onClick={() => setShowDashboard(true)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Error Status Dashboard
            </button>
          </div>

          {/* Error Simulation */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Simulation</h2>
            <p className="text-gray-600 mb-6">
              Click on any scenario below to simulate different types of errors and see 
              how the system provides user-friendly messages and recovery options.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {errorScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => simulateError(scenario)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900">{scenario.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Error Display */}
          {currentError && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Error</h2>
              <UserFriendlyErrorDisplay
                error={currentError.originalError}
                onRetry={handleRetry}
                onDismiss={() => setCurrentError(null)}
                showDetails={true}
              />
            </div>
          )}

          {/* Input Validation Demo */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Input Validation</h2>
            <p className="text-gray-600 mb-4">
              The system provides proactive input validation to prevent errors before they occur.
            </p>
            
            <button
              onClick={testInputValidation}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Test Input Validation (Check Console)
            </button>
          </div>

          {/* Features Overview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Error Messaging</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Clear, non-technical language</li>
                  <li>• Contextual messages based on user action</li>
                  <li>• Categorized error types</li>
                  <li>• Localized error messages</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Recovery Options</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Actionable recovery buttons</li>
                  <li>• Automatic recovery suggestions</li>
                  <li>• Step-by-step guidance</li>
                  <li>• Alternative workflows</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Error Prevention</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Proactive warnings</li>
                  <li>• Input validation with feedback</li>
                  <li>• System status indicators</li>
                  <li>• Educational tooltips</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">System Integration</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Enhanced error boundaries</li>
                  <li>• Retry mechanism integration</li>
                  <li>• Graceful degradation support</li>
                  <li>• Offline mode compatibility</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Error Status Dashboard Modal */}
        {showDashboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="max-w-6xl w-full max-h-full overflow-hidden">
              <ErrorStatusDashboard
                isOpen={true}
                onClose={() => setShowDashboard(false)}
              />
            </div>
          </div>
        )}
      </div>
    </ErrorSystemIntegration>
  );
};

export default ErrorSystemDemo;