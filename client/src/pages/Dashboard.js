import React, { Suspense } from 'react';
import { createLazyComponent, useRenderTime } from '../utils/performanceOptimization';
import DashboardLayout, { PortfolioColumn, MarketColumn, TradingColumn } from '../components/DashboardLayout';

// Lazy load dashboard sections for progressive loading
const PortfolioSection = createLazyComponent(
  () => import('../components/PortfolioSection'),
  <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
);

const MarketSection = createLazyComponent(
  () => import('../components/MarketSection'),
  <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
);

const TradingSection = createLazyComponent(
  () => import('../components/TradingSection'),
  <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
);

const Dashboard = () => {
  // Track dashboard render performance
  useRenderTime('Dashboard');

  return (
    <DashboardLayout>
      {/* Left Column - Portfolio Overview (25%) - Load first for above-the-fold content */}
      <PortfolioColumn>
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
          <PortfolioSection />
        </Suspense>
      </PortfolioColumn>

      {/* Center Column - Market Data and Charts (50%) - Load second */}
      <MarketColumn>
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
          <MarketSection />
        </Suspense>
      </MarketColumn>

      {/* Right Column - Trading Interface (25%) - Load last as it's less critical for initial view */}
      <TradingColumn>
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
          <TradingSection />
        </Suspense>
      </TradingColumn>
    </DashboardLayout>
  );
};

export default Dashboard;