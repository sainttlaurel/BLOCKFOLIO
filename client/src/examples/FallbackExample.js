/**
 * Feature Fallbacks Example
 * 
 * Demonstrates how to use feature fallbacks in a React component
 * Shows best practices for graceful degradation
 */

import React, { useState, useEffect } from 'react';
import {
  useIntersectionObserver,
  useResizeObserver,
  useWebSocket,
  useVibration,
  useLocalStorage,
  useFallbackStatus,
  useLazyLoad,
  useElementSize,
  useFeatureSupport
} from '../hooks/useFallbacks';

/**
 * Example 1: Lazy Loading Images with IntersectionObserver Fallback
 */
export const LazyImageExample = ({ src, alt }) => {
  const [ref, isVisible] = useLazyLoad({ threshold: 0.1, once: true });
  
  return (
    <div ref={ref} style={{ minHeight: '200px', background: '#f0f0f0' }}>
      {isVisible ? (
        <img src={src} alt={alt} style={{ width: '100%' }} />
      ) : (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading...
        </div>
      )}
    </div>
  );
};

/**
 * Example 2: Responsive Chart with ResizeObserver Fallback
 */
export const ResponsiveChartExample = () => {
  const [ref, size] = useElementSize();
  
  return (
    <div ref={ref} style={{ width: '100%', border: '1px solid #ccc', padding: '20px' }}>
      <h3>Responsive Chart</h3>
      <p>Container size: {Math.round(size.width)}px × {Math.round(size.height)}px</p>
      <div style={{ 
        width: '100%', 
        height: '200px', 
        background: '#e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Chart renders at {Math.round(size.width)}px width
      </div>
    </div>
  );
};

/**
 * Example 3: Real-time Prices with WebSocket Fallback
 */
export const RealTimePricesExample = () => {
  const [prices, setPrices] = useState({});
  const hasWebSocket = useFeatureSupport('webSocket');
  
  const { lastMessage, isConnected } = useWebSocket(
    'wss://api.example.com/prices',
    {
      onMessage: (event) => {
        try {
          const data = JSON.parse(event.data);
          setPrices(data);
        } catch (error) {
          console.error('Failed to parse price data:', error);
        }
      }
    }
  );
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h3>Real-time Prices</h3>
      <div style={{ marginBottom: '10px' }}>
        <strong>Connection:</strong>{' '}
        <span style={{ color: isConnected ? 'green' : 'red' }}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </span>
        {!hasWebSocket && (
          <span style={{ marginLeft: '10px', color: '#f59e0b' }}>
            (Using polling fallback - updates every 5s)
          </span>
        )}
      </div>
      <div>
        <strong>Last Update:</strong> {lastMessage ? new Date().toLocaleTimeString() : 'Waiting...'}
      </div>
      {Object.keys(prices).length > 0 && (
        <div style={{ marginTop: '10px' }}>
          {Object.entries(prices).map(([symbol, price]) => (
            <div key={symbol}>
              {symbol}: ${price}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Example 4: Touch Gestures with Vibration Fallback
 */
export const TouchGestureExample = () => {
  const vibrate = useVibration();
  const hasVibration = useFeatureSupport('vibrate');
  const [tapCount, setTapCount] = useState(0);
  
  const handleTap = () => {
    vibrate(50); // Light tap
    setTapCount(prev => prev + 1);
  };
  
  const handleLongPress = () => {
    vibrate([100, 50, 100]); // Pattern
    alert('Long press detected!');
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h3>Touch Gestures</h3>
      {!hasVibration && (
        <div style={{ 
          padding: '10px', 
          background: '#fef2f2', 
          border: '1px solid #fecaca',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          ℹ️ Haptic feedback not supported on this device
        </div>
      )}
      <button
        onClick={handleTap}
        onContextMenu={(e) => {
          e.preventDefault();
          handleLongPress();
        }}
        style={{
          padding: '20px 40px',
          fontSize: '16px',
          cursor: 'pointer',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px'
        }}
      >
        Tap Me! (Count: {tapCount})
      </button>
      <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '10px' }}>
        Tap for light vibration, long-press for pattern
      </p>
    </div>
  );
};

/**
 * Example 5: Settings with localStorage Fallback
 */
export const SettingsExample = () => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [language, setLanguage] = useLocalStorage('language', 'en');
  const hasLocalStorage = useFeatureSupport('localStorage');
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h3>User Settings</h3>
      {!hasLocalStorage && (
        <div style={{ 
          padding: '10px', 
          background: '#fef2f2', 
          border: '1px solid #fecaca',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          ⚠️ Settings will not persist after page reload (localStorage not available)
        </div>
      )}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Theme:</strong>
        </label>
        <select 
          value={theme} 
          onChange={(e) => setTheme(e.target.value)}
          style={{ padding: '8px', fontSize: '14px' }}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Language:</strong>
        </label>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          style={{ padding: '8px', fontSize: '14px' }}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </div>
      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        background: '#f9fafb',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        Current: {theme} theme, {language} language
      </div>
    </div>
  );
};

/**
 * Example 6: Fallback Status Display
 */
export const FallbackStatusExample = () => {
  const status = useFallbackStatus();
  
  if (!status) {
    return <div>Loading status...</div>;
  }
  
  const activeFallbacks = Object.entries(status.features)
    .filter(([_, info]) => info.fallback !== null);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h3>Fallback Status</h3>
      <div style={{ marginBottom: '15px' }}>
        <strong>Browser:</strong> {status.browser.name} {status.browser.version}
        {!status.browser.isSupported && (
          <span style={{ color: '#ef4444', marginLeft: '10px' }}>
            (Outdated)
          </span>
        )}
      </div>
      
      {activeFallbacks.length === 0 ? (
        <div style={{ 
          padding: '15px', 
          background: '#f0fdf4', 
          border: '1px solid #86efac',
          borderRadius: '4px',
          color: '#15803d'
        }}>
          ✅ All features supported natively!
        </div>
      ) : (
        <div>
          <div style={{ 
            padding: '10px', 
            background: '#fef2f2', 
            border: '1px solid #fecaca',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            ⚠️ {activeFallbacks.length} feature{activeFallbacks.length !== 1 ? 's' : ''} using fallback
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeFallbacks.map(([feature, info]) => (
              <div 
                key={feature}
                style={{ 
                  padding: '12px', 
                  background: '#f9fafb',
                  borderLeft: `3px solid ${
                    info.impact === 'high' ? '#ef4444' : 
                    info.impact === 'medium' ? '#f59e0b' : 
                    '#3b82f6'
                  }`,
                  borderRadius: '4px'
                }}
              >
                <div style={{ fontWeight: '500', marginBottom: '5px' }}>
                  {feature.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Fallback: {info.fallback}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px' }}>
                  Impact: {info.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Complete Example Component
 */
const FallbackExample = () => {
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1>Feature Fallbacks Examples</h1>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        These examples demonstrate graceful degradation when modern features are unavailable.
      </p>
      
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <LazyImageExample 
          src="https://via.placeholder.com/400x300" 
          alt="Example image"
        />
        
        <ResponsiveChartExample />
        
        <RealTimePricesExample />
        
        <TouchGestureExample />
        
        <SettingsExample />
        
        <FallbackStatusExample />
      </div>
      
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: '#f9fafb',
        borderRadius: '8px'
      }}>
        <h2>Testing Fallbacks</h2>
        <p>Open browser console and run:</p>
        <pre style={{ 
          background: '#1f2937', 
          color: '#f9fafb', 
          padding: '15px',
          borderRadius: '4px',
          overflow: 'auto'
        }}>
{`// Delete native APIs to test fallbacks
delete window.IntersectionObserver;
delete window.ResizeObserver;
delete window.WebSocket;
delete navigator.vibrate;

// Reload page
location.reload();`}
        </pre>
      </div>
    </div>
  );
};

export default FallbackExample;
