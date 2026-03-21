import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { optimizeBundle } from './utils/performanceOptimization';
import { initPolyfills } from './utils/polyfillLoader';

// Initialize polyfills before app starts
const polyfillsPromise = initPolyfills({
  mode: 'auto', // Smart loading based on browser
  logResults: process.env.NODE_ENV === 'development'
});

// Preload critical resources before app initialization
optimizeBundle.preloadCriticalResources();

// Wait for polyfills to load before rendering app
polyfillsPromise.then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  // Register service worker after app renders
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Register for background sync
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          registration.sync.register('background-sync-prices');
        }
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  }
}).catch(error => {
  console.error('Failed to initialize polyfills:', error);
  // Render app anyway - polyfills are for enhancement
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});