/**
 * Fallback Status Indicator
 * 
 * Displays information about active feature fallbacks
 * Shows users when features are degraded and what functionality is affected
 */

import React, { useState, useEffect } from 'react';
import { useFallbackStatus } from '../hooks/useFallbacks';
import './FallbackStatusIndicator.css';

const FallbackStatusIndicator = ({ showDetails = false, position = 'bottom-right' }) => {
  const status = useFallbackStatus();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  useEffect(() => {
    // Check if user has dismissed the indicator
    const dismissed = localStorage.getItem('fallback-indicator-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);
  
  if (!status || isDismissed) return null;
  
  // Count active fallbacks
  const activeFallbacks = Object.entries(status.features)
    .filter(([_, info]) => info.fallback !== null);
  
  // Don't show if no fallbacks are active
  if (activeFallbacks.length === 0) return null;
  
  // Check if any high-impact fallbacks are active
  const hasHighImpact = activeFallbacks.some(([_, info]) => info.impact === 'high');
  
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('fallback-indicator-dismissed', 'true');
  };
  
  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return 'ℹ️';
    }
  };
  
  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };
  
  const getFallbackDescription = (feature, fallback) => {
    const descriptions = {
      'intersectionObserver': {
        fallback: 'immediate-loading',
        description: 'Images and content load immediately instead of lazily',
        userImpact: 'Slightly slower initial page load'
      },
      'resizeObserver': {
        fallback: 'window-resize-events',
        description: 'Layout updates on window resize only',
        userImpact: 'Minor layout adjustment delays'
      },
      'webSocket': {
        fallback: 'http-polling',
        description: 'Price updates via polling instead of real-time',
        userImpact: 'Prices update every 5 seconds instead of instantly'
      },
      'vibrate': {
        fallback: 'silent',
        description: 'No haptic feedback on touch gestures',
        userImpact: 'No vibration on interactions'
      },
      'localStorage': {
        fallback: 'in-memory',
        description: 'Settings stored in memory only',
        userImpact: 'Settings reset when you close the browser'
      },
      'serviceWorker': {
        fallback: 'no-offline',
        description: 'No offline support available',
        userImpact: 'App requires internet connection'
      },
      'backdropFilter': {
        fallback: 'solid-background',
        description: 'Solid backgrounds instead of glass effect',
        userImpact: 'Different visual appearance'
      },
      'cssGrid': {
        fallback: 'flexbox',
        description: 'Flexbox layout instead of CSS Grid',
        userImpact: 'Slightly different layout'
      },
      'clamp': {
        fallback: 'fixed-sizes',
        description: 'Fixed font sizes instead of fluid typography',
        userImpact: 'Less responsive text sizing'
      }
    };
    
    return descriptions[feature] || {
      fallback,
      description: 'Using alternative implementation',
      userImpact: 'Some features may work differently'
    };
  };
  
  return (
    <div 
      className={`fallback-status-indicator fallback-status-indicator--${position} ${isExpanded ? 'expanded' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="fallback-status-indicator__header">
        <button
          className="fallback-status-indicator__toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse compatibility info' : 'Expand compatibility info'}
        >
          <span className="fallback-status-indicator__icon">
            {hasHighImpact ? '⚠️' : 'ℹ️'}
          </span>
          <span className="fallback-status-indicator__title">
            {activeFallbacks.length} feature{activeFallbacks.length !== 1 ? 's' : ''} using fallback
          </span>
          <span className="fallback-status-indicator__arrow">
            {isExpanded ? '▼' : '▲'}
          </span>
        </button>
        <button
          className="fallback-status-indicator__dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss compatibility info"
        >
          ✕
        </button>
      </div>
      
      {isExpanded && (
        <div className="fallback-status-indicator__content">
          <div className="fallback-status-indicator__browser">
            <strong>Browser:</strong> {status.browser.name} {status.browser.version}
            {!status.browser.isSupported && (
              <span className="fallback-status-indicator__warning">
                (Outdated - please update)
              </span>
            )}
          </div>
          
          <div className="fallback-status-indicator__features">
            {activeFallbacks.map(([feature, info]) => {
              const desc = getFallbackDescription(feature, info.fallback);
              return (
                <div 
                  key={feature}
                  className="fallback-status-indicator__feature"
                  style={{ borderLeftColor: getImpactColor(info.impact) }}
                >
                  <div className="fallback-status-indicator__feature-header">
                    <span className="fallback-status-indicator__feature-icon">
                      {getImpactIcon(info.impact)}
                    </span>
                    <span className="fallback-status-indicator__feature-name">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <div className="fallback-status-indicator__feature-description">
                    {desc.description}
                  </div>
                  <div className="fallback-status-indicator__feature-impact">
                    <strong>Impact:</strong> {desc.userImpact}
                  </div>
                </div>
              );
            })}
          </div>
          
          {hasHighImpact && (
            <div className="fallback-status-indicator__recommendation">
              <strong>Recommendation:</strong> Update your browser to the latest version for the best experience.
            </div>
          )}
          
          {showDetails && (
            <div className="fallback-status-indicator__details">
              <button
                className="fallback-status-indicator__details-button"
                onClick={() => console.log('Fallback Status:', status)}
              >
                View Technical Details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FallbackStatusIndicator;
