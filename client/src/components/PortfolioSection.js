import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { createLazyComponent, useRenderTime } from '../utils/performanceOptimization';

// Lazy load components for better performance
const PortfolioValue = createLazyComponent(
  () => import('./PortfolioValue'),
  <div className="animate-pulse bg-gray-200 h-20 rounded-lg" />
);

const PortfolioSummaryCards = createLazyComponent(
  () => import('./PortfolioSummaryCards'),
  <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
);

const HoldingsWithSparklines = createLazyComponent(
  () => import('./HoldingsWithSparklines'),
  <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
);

const PortfolioSection = () => {
  // Track component render performance
  useRenderTime('PortfolioSection');
  
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const response = await axios.get('/api/wallet');
      setWallet(response.data);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalValue = parseFloat(wallet?.totalValue || 0);
  const holdings = wallet?.holdings || [];

  return (
    <div className="space-y-6">
      {/* Portfolio Value - Prominent Display */}
      <div className="card">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-20 rounded-lg" />}>
          <PortfolioValue 
            totalValue={totalValue}
            percentageChange={2.4} // TODO: Calculate from actual data
            timeframe="24h"
            isLoading={loading}
          />
        </Suspense>
      </div>

      {/* Portfolio Performance Summary Cards */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded-lg" />}>
        <PortfolioSummaryCards 
          portfolioData={wallet}
          holdings={holdings}
          isLoading={loading}
        />
      </Suspense>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button className="w-full btn-primary">
            <DollarSign className="h-4 w-4 mr-2" />
            Buy Crypto
          </button>
          <button className="w-full btn-secondary">
            <TrendingDown className="h-4 w-4 mr-2" />
            Sell Holdings
          </button>
        </div>
      </div>

      {/* Enhanced Holdings with Sparklines */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
        <HoldingsWithSparklines 
          holdings={holdings}
          totalPortfolioValue={totalValue}
          isLoading={loading}
          onHoldingClick={(holding) => {
            console.log('Clicked holding:', holding);
            // TODO: Open holding detail modal
          }}
        />
      </Suspense>
    </div>
  );
};

export default PortfolioSection;