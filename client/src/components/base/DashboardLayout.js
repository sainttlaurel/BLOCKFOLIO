import React, { useState, useEffect } from 'react';
import { useResponsiveBreakpoints } from '../../hooks/useResponsiveBreakpoints';
import { useRenderTime } from '../../utils/performanceOptimization';
import Breadcrumb from './Breadcrumb';

/**
 * DashboardLayout - Responsive 3-column layout for trading platform
 * Adapts between desktop (25%-50%-25%), tablet, and mobile layouts
 * Implements progressive loading for optimal performance
 */
const DashboardLayout = ({ 
  children, 
  portfolioContent, 
  marketContent, 
  tradingContent,
  showBreadcrumbs = true,
  customBreadcrumbs = null 
}) => {
  const { isDesktop, isTablet, isMobile } = useResponsiveBreakpoints();
  const [loadingStage, setLoadingStage] = useState(0);
  
  // Track layout render performance
  useRenderTime('DashboardLayout');

  // Progressive loading stages for better perceived performance
  useEffect(() => {
    const stages = [
      () => setLoadingStage(1), // Load portfolio first (above-the-fold)
      () => setLoadingStage(2), // Load market data second
      () => setLoadingStage(3), // Load trading interface last
    ];

    stages.forEach((stage, index) => {
      setTimeout(stage, index * 100); // Stagger loading by 100ms
    });
  }, []);

  if (isMobile) {
    return (
      <div className="mobile-layout">
        {showBreadcrumbs && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <Breadcrumb customItems={customBreadcrumbs} />
          </div>
        )}
        <div className="mobile-grid-1">
          {loadingStage >= 1 && portfolioContent}
          {loadingStage >= 2 && marketContent}
          {loadingStage >= 3 && tradingContent}
          {children}
        </div>
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="tablet-layout">
        {showBreadcrumbs && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <Breadcrumb customItems={customBreadcrumbs} />
          </div>
        )}
        <div className="tablet-section-transition">
          {loadingStage >= 1 && portfolioContent}
        </div>
        <div className="tablet-grid-main">
          <div className="tablet-col-market">
            {loadingStage >= 2 && marketContent}
          </div>
          <div className="tablet-col-trading">
            {loadingStage >= 3 && tradingContent}
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Desktop layout with progressive loading
  return (
    <div className="min-h-screen bg-gray-50">
      {showBreadcrumbs && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb customItems={customBreadcrumbs} />
          </div>
        </div>
      )}
      <div className="desktop-grid-trading h-[calc(100vh-8rem)] max-w-7xl mx-auto px-6 py-6">
        <div className="desktop-col-portfolio portfolio-section">
          {loadingStage >= 1 && portfolioContent}
        </div>
        <div className="desktop-col-market market-section">
          {loadingStage >= 2 && marketContent}
        </div>
        <div className="desktop-col-trading trading-section">
          {loadingStage >= 3 && tradingContent}
        </div>
        {children}
      </div>
    </div>
  );
};

// Export column components for easier usage
export const PortfolioColumn = ({ children }) => <>{children}</>;
export const MarketColumn = ({ children }) => <>{children}</>;
export const TradingColumn = ({ children }) => <>{children}</>;

export default DashboardLayout;