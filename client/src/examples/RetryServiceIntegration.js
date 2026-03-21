/**
 * Retry Service Integration Examples
 * 
 * Demonstrates how to integrate the enhanced retry service with exponential backoff,
 * circuit breaker pattern, and user feedback into various application scenarios.
 */

import React, { useState, useEffect } from 'react';
import retryService from '../services/retryService';
import dataManager from '../services/dataManager';
import RetryStatusIndicator from '../components/RetryStatusIndicator';
import RetryUserFeedback from '../components/RetryUserFeedback';

const RetryServiceIntegration = () => {
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    // Update metrics periodically
    const interval = setInterval(() => {
      setMetrics(retryService.getMetrics());
      setAnalytics(retryService.getRetryAnalytics());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Example 1: Critical Trading Operation
  const handleCriticalTrade = async () => {
    try {
      addTestResult('Starting critical trade operation...');
      
      const result = await dataManager.executeTrade('buy', 'BTC', 0.001);
      
      addTestResult('✅ Critical trade completed successfully', 'success');
      return result;
    } catch (error) {
      addTestResult(`❌ Critical trade failed: ${error.message}`, 'error');
      throw error;
    }
  };

  // Example 2: Normal Data Fetch with Retry
  const handleDataFetch = async () => {
    try {
      addTestResult('Fetching market data...');
      
      const prices = await dataManager.getPrices(true, {
        priority: 'normal',
        operationType: 'data',
        userFeedback: true
      });
      
      addTestResult('✅ Market data fetched successfully', 'success');
      return prices;
    } catch (error) {
      addTestResult(`❌ Data fetch failed: ${error.message}`, 'error');
      throw error;
    }
  };

  // Example 3: Low Priority Background Operation
  const handleBackgroundOperation = async () => {
    try {
      addTestResult('Starting background operation...');
      
      // Simulate a low-priority API call
      const mockRequest = () => {
        return new Promise((resolve, reject) => {
          // Simulate random failures for demonstration
          if (Math.random() < 0.3) {
            reject(new Error('Simulated network error'));
          } else {
            resolve({ data: 'Background operation completed' });
          }
        });
      };

      const result = await retryService.executeWithRetry(mockRequest, {
        endpoint: 'background-operation',
        priority: 'low',
        operationType: 'data',
        userFeedback: false, // No user feedback for background operations
        customConfig: {
          maxRetries: 2,
          baseDelay: 3000
        }
      });
      
      addTestResult('✅ Background operation completed', 'success');
      return result;
    } catch (error) {
      addTestResult(`❌ Background operation failed: ${error.message}`, 'error');
      throw error;
    }
  };

  // Example 4: Test Circuit Breaker
  const testCircuitBreaker = async () => {
    try {
      addTestResult('Testing circuit breaker pattern...');
      
      // Create a failing request to trigger circuit breaker
      const failingRequest = () => Promise.reject(new Error('Simulated server error'));
      
      // Make multiple failing requests to open circuit breaker
      for (let i = 0; i < 6; i++) {
        try {
          await retryService.executeWithRetry(failingRequest, {
            endpoint: 'test-circuit-breaker',
            customConfig: { maxRetries: 0 },
            userFeedback: true
          });
        } catch (error) {
          addTestResult(`Attempt ${i + 1} failed (expected)`, 'warning');
        }
      }
      
      // Check circuit breaker status
      const cbStatus = retryService.getCircuitBreakerStatus('test-circuit-breaker');
      addTestResult(`Circuit breaker state: ${cbStatus.state}`, 'info');
      
    } catch (error) {
      addTestResult(`Circuit breaker test error: ${error.message}`, 'error');
    }
  };

  // Example 5: Custom Retry Configuration
  const handleCustomRetryConfig = async () => {
    try {
      addTestResult('Testing custom retry configuration...');
      
      const mockRequest = () => {
        return new Promise((resolve, reject) => {
          if (Math.random() < 0.7) {
            reject(new Error('Simulated intermittent error'));
          } else {
            resolve({ data: 'Custom retry success' });
          }
        });
      };

      const result = await retryService.executeWithRetry(mockRequest, {
        endpoint: 'custom-retry-test',
        priority: 'critical',
        operationType: 'trading',
        userFeedback: true,
        customConfig: {
          maxRetries: 4,
          baseDelay: 500,
          maxDelay: 8000,
          backoffMultiplier: 1.8,
          jitterFactor: 0.2
        }
      });
      
      addTestResult('✅ Custom retry configuration successful', 'success');
      return result;
    } catch (error) {
      addTestResult(`❌ Custom retry failed: ${error.message}`, 'error');
      throw error;
    }
  };

  const addTestResult = (message, type = 'info') => {
    setTestResults(prev => [{
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 20));
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const resetMetrics = () => {
    retryService.resetMetrics();
    setMetrics(retryService.getMetrics());
    setAnalytics(retryService.getRetryAnalytics());
    addTestResult('Metrics reset', 'info');
  };

  return (
    <div className="retry-integration-demo" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Retry Service Integration Demo</h1>
      
      {/* Retry Status Indicator */}
      <RetryStatusIndicator showDetails={true} position="top-right" />
      
      {/* User Feedback Component */}
      <RetryUserFeedback position="top-center" autoHide={true} />
      
      {/* Test Controls */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Test Scenarios</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button onClick={handleCriticalTrade} style={buttonStyle}>
            Critical Trade (High Priority)
          </button>
          <button onClick={handleDataFetch} style={buttonStyle}>
            Data Fetch (Normal Priority)
          </button>
          <button onClick={handleBackgroundOperation} style={buttonStyle}>
            Background Op (Low Priority)
          </button>
          <button onClick={testCircuitBreaker} style={buttonStyle}>
            Test Circuit Breaker
          </button>
          <button onClick={handleCustomRetryConfig} style={buttonStyle}>
            Custom Retry Config
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={clearResults} style={{ ...buttonStyle, background: '#6b7280' }}>
            Clear Results
          </button>
          <button onClick={resetMetrics} style={{ ...buttonStyle, background: '#ef4444' }}>
            Reset Metrics
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Test Results</h3>
        <div style={{ 
          background: '#f9fafb', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '15px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {testResults.length === 0 ? (
            <p style={{ color: '#6b7280', margin: 0 }}>No test results yet. Click a test button to start.</p>
          ) : (
            testResults.map(result => (
              <div key={result.id} style={{ 
                marginBottom: '8px', 
                padding: '8px',
                background: getResultBackground(result.type),
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                <span style={{ color: '#6b7280', marginRight: '10px' }}>
                  {result.timestamp}
                </span>
                <span>{result.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Metrics Display */}
      {metrics && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Retry Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <MetricCard title="Total Retries" value={metrics.totalRetries} />
            <MetricCard title="Success Rate" value={metrics.successRate} />
            <MetricCard title="Active Retries" value={metrics.activeRetries} />
            <MetricCard title="Circuit Breaker Trips" value={metrics.circuitBreakerTrips} />
            <MetricCard title="Average Recovery Time" value={`${metrics.averageRecoveryTime}ms`} />
            <MetricCard title="Average Delay/Retry" value={`${metrics.averageDelayPerRetry}ms`} />
          </div>
        </div>
      )}

      {/* Analytics Display */}
      {analytics && (
        <div>
          <h3>Retry Analytics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            {/* Performance Impact */}
            <div style={cardStyle}>
              <h4>Performance Impact</h4>
              <p><strong>User Experience Impact:</strong> {analytics.performance.impactOnUserExperience}</p>
              <p><strong>Total Delay Time:</strong> {analytics.performance.totalDelayTime}ms</p>
              <p><strong>Max Delay Encountered:</strong> {analytics.performance.maxDelayEncountered}ms</p>
            </div>

            {/* Recommendations */}
            <div style={cardStyle}>
              <h4>Optimization Recommendations</h4>
              {analytics.recommendations.length === 0 ? (
                <p style={{ color: '#10b981' }}>✅ No optimization recommendations</p>
              ) : (
                analytics.recommendations.map((rec, index) => (
                  <div key={index} style={{ 
                    marginBottom: '10px', 
                    padding: '8px',
                    background: rec.priority === 'high' ? '#fef2f2' : '#fefce8',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    <strong>{rec.type}:</strong> {rec.message}
                  </div>
                ))
              )}
            </div>

            {/* Circuit Breaker Status */}
            <div style={cardStyle}>
              <h4>Circuit Breaker Status</h4>
              {metrics.circuitBreakers.map((cb, index) => (
                <div key={index} style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <strong>{cb.endpoint}:</strong> 
                  <span style={{ 
                    marginLeft: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: cb.isHealthy ? '#dcfce7' : '#fef2f2',
                    color: cb.isHealthy ? '#166534' : '#dc2626'
                  }}>
                    {cb.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const MetricCard = ({ title, value }) => (
  <div style={cardStyle}>
    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>{title}</h4>
    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{value}</p>
  </div>
);

// Styles
const buttonStyle = {
  background: '#3b82f6',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500'
};

const cardStyle = {
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
};

const getResultBackground = (type) => {
  switch (type) {
    case 'success': return '#dcfce7';
    case 'error': return '#fef2f2';
    case 'warning': return '#fefce8';
    default: return '#f3f4f6';
  }
};

export default RetryServiceIntegration;