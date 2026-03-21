import React from 'react';
import NavigationBar from './NavigationBar';
import DashboardLayout from './DashboardLayout';
import ErrorBoundary from './ErrorBoundary';

/**
 * TradingPlatform - Root component for the professional trading platform
 * Implements the main layout structure and error boundaries
 */
const TradingPlatform = ({ children }) => {
  return (
    <ErrorBoundary>
      <div className="trading-platform-layout min-h-screen bg-neutral-50">
        <NavigationBar />
        <main className="flex-1">
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default TradingPlatform;