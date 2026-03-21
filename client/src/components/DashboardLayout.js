import React, { useState, useEffect } from 'react';
import { 
  TradingIcons, 
  PortfolioIcons, 
  UIIcons 
} from './icons/FinancialIcons';

const DashboardLayout = ({ children }) => {
  const [portfolioCollapsed, setPortfolioCollapsed] = useState(true);
  const [chartsExpanded, setChartsExpanded] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio'); // Mobile tab state
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're in tablet or mobile mode
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1200);
      setIsMobile(width < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Extract children components for tablet layout
  const portfolioChild = React.Children.toArray(children)[0];
  const marketChild = React.Children.toArray(children)[1];
  const tradingChild = React.Children.toArray(children)[2];

  return (
    <div className="trading-platform-layout">
      {/* Desktop Layout: 3-column grid (25%-50%-25%) */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 lg:h-[calc(100vh-8rem)]">
        {children}
      </div>
      
      {/* Tablet Layout (768px-1199px): Collapsible sections */}
      <div className="hidden md:block lg:hidden tablet-layout">
        {/* Top Section: Portfolio Overview (Collapsible) */}
        <div className="tablet-portfolio-section mb-6">
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <button
              onClick={() => setPortfolioCollapsed(!portfolioCollapsed)}
              className="collapsible-button group"
              aria-expanded={!portfolioCollapsed}
              aria-controls="portfolio-content"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <PortfolioIcons.Portfolio size="md" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-gray-900">Portfolio Overview</h2>
                  <p className="text-sm text-gray-500">
                    {portfolioCollapsed ? 'Tap to expand portfolio details' : 'Tap to collapse'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-400 hidden sm:block">
                  {portfolioCollapsed ? 'Expand' : 'Collapse'}
                </span>
                <div className={`collapsible-icon ${portfolioCollapsed ? '' : 'rotated'}`}>
                  {portfolioCollapsed ? (
                    <UIIcons.ChevronDown size="md" theme="muted" />
                  ) : (
                    <UIIcons.ChevronUp size="md" theme="muted" />
                  )}
                </div>
              </div>
            </button>
            
            <div 
              id="portfolio-content"
              className={`collapsible-content transition-all duration-500 ease-in-out overflow-hidden ${
                portfolioCollapsed 
                  ? 'max-h-0 opacity-0 mt-0' 
                  : 'max-h-[1000px] opacity-100 mt-4'
              }`}
            >
              <div className="pt-4 border-t border-blue-200">
                {portfolioChild}
              </div>
            </div>
          </div>
        </div>

        {/* Main Section: Market Data with Side-by-Side Trading Panel */}
        <div className="tablet-main-section mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Market Data (3/5 width) */}
            <div className="md:col-span-3">
              <div className="card bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TradingIcons.PriceUp size="sm" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Market Data</h3>
                </div>
                <div className="h-full min-h-[400px]">
                  {marketChild}
                </div>
              </div>
            </div>
            
            {/* Trading Panel (2/5 width) */}
            <div className="md:col-span-2">
              <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TradingIcons.Trade size="sm" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Quick Trade</h3>
                </div>
                <div className="h-full min-h-[400px]">
                  {tradingChild}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Expandable Detailed Charts */}
        <div className="tablet-charts-section">
          <div className="card bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <button
              onClick={() => setChartsExpanded(!chartsExpanded)}
              className="collapsible-button group"
              aria-expanded={chartsExpanded}
              aria-controls="charts-content"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <TradingIcons.Chart size="md" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-gray-900">Detailed Charts & Analysis</h2>
                  <p className="text-sm text-gray-500">
                    {chartsExpanded ? 'Advanced technical analysis tools' : 'Tap to view advanced charts'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-400 hidden sm:block">
                  {chartsExpanded ? 'Collapse' : 'Expand'}
                </span>
                <div className={`collapsible-icon ${chartsExpanded ? 'rotated' : ''}`}>
                  {chartsExpanded ? (
                    <UIIcons.ChevronUp size="md" theme="muted" />
                  ) : (
                    <UIIcons.ChevronDown size="md" theme="muted" />
                  )}
                </div>
              </div>
            </button>
            
            <div 
              id="charts-content"
              className={`collapsible-content transition-all duration-500 ease-in-out overflow-hidden ${
                chartsExpanded 
                  ? 'max-h-[800px] opacity-100 mt-4' 
                  : 'max-h-0 opacity-0 mt-0'
              }`}
            >
              <div className="pt-4 border-t border-purple-200">
                <div className="space-y-6">
                  {/* Advanced Chart Component */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Advanced Price Charts</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Timeframe:</span>
                        <div className="flex space-x-1">
                          {['1H', '4H', '1D', '1W', '1M'].map((timeframe) => (
                            <button
                              key={timeframe}
                              className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                            >
                              {timeframe}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-8 text-center border border-gray-200">
                      <TradingIcons.Chart size="3xl" theme="muted" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Interactive Chart View</h4>
                      <p className="text-gray-600 mb-4">Detailed technical analysis with candlestick patterns and volume indicators</p>
                      
                      {/* Chart Placeholder with Professional Styling */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="h-48 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <TradingIcons.Chart size="xl" theme="muted" />
                            <p className="text-sm text-gray-500">Chart will render here</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Technical Indicators Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">RSI (14)</h4>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">68.5</div>
                      <div className="text-sm text-yellow-600 font-medium">Neutral</div>
                      <div className="mt-2 bg-gray-100 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{width: '68.5%'}}></div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">MACD</h4>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="text-2xl font-bold text-success-600 mb-1">+0.12</div>
                      <div className="text-sm text-success-600 font-medium">Bullish</div>
                      <div className="mt-2 flex items-center space-x-1">
                        <TradingIcons.PriceUp size="xs" />
                        <span className="text-xs text-gray-500">Signal Line Cross</span>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Volume</h4>
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">2.1M</div>
                      <div className="text-sm text-success-600 font-medium">+15.3%</div>
                      <div className="mt-2 text-xs text-gray-500">Above average</div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Volatility</h4>
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">24.8%</div>
                      <div className="text-sm text-orange-600 font-medium">Moderate</div>
                      <div className="mt-2 text-xs text-gray-500">30-day average</div>
                    </div>
                  </div>

                  {/* Market Sentiment Section */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Market Sentiment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Fear & Greed Index</span>
                          <span className="text-sm text-gray-500">Today</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl font-bold text-orange-600">68</div>
                          <div>
                            <div className="text-sm font-medium text-orange-600">Greed</div>
                            <div className="text-xs text-gray-500">Moderate risk</div>
                          </div>
                        </div>
                        <div className="mt-3 bg-gray-100 rounded-full h-2">
                          <div className="bg-orange-400 h-2 rounded-full" style={{width: '68%'}}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Market Dominance</span>
                          <span className="text-sm text-gray-500">BTC</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl font-bold text-blue-600">52.3%</div>
                          <div>
                            <div className="text-sm font-medium text-success-600">+0.8%</div>
                            <div className="text-xs text-gray-500">24h change</div>
                          </div>
                        </div>
                        <div className="mt-3 bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-400 h-2 rounded-full" style={{width: '52.3%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Layout: Tab-based navigation with stacked vertical layout */}
      <div className="block md:hidden mobile-layout">
        {/* Mobile Portfolio Summary at Top */}
        <div className="mobile-portfolio-summary bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 mb-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Portfolio Value</h2>
              <div className="text-2xl font-bold">$24,567.89</div>
              <div className="text-sm text-blue-100 flex items-center space-x-1">
                <TradingIcons.PriceUp size="xs" theme="inverse" />
                <span>+5.67% (24h)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                <PortfolioIcons.Portfolio size="lg" theme="inverse" />
              </div>
              <div className="text-xs text-blue-100">3 Assets</div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="mobile-tab-navigation bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'portfolio'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <PortfolioIcons.Portfolio size="sm" />
                <span>Portfolio</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('market')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'market'
                  ? 'bg-green-50 text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <TradingIcons.PriceUp size="sm" />
                <span>Market</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('trading')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'trading'
                  ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <TradingIcons.Trade size="sm" />
                <span>Trade</span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Tab Content */}
        <div className="mobile-tab-content">
          {/* Portfolio Tab */}
          <div className={`mobile-tab-panel ${activeTab === 'portfolio' ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PortfolioIcons.Portfolio size="sm" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Portfolio Details</h3>
              </div>
              <div className="mobile-content-wrapper">
                {portfolioChild}
              </div>
            </div>
          </div>

          {/* Market Tab */}
          <div className={`mobile-tab-panel ${activeTab === 'market' ? 'block' : 'hidden'}`}>
            <div className="space-y-4">
              {/* Swipeable Market Data Cards */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <TradingIcons.PriceUp size="sm" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Market Data</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">Live</span>
                  </div>
                </div>
                
                {/* Market Overview Cards - Swipeable */}
                <div className="mobile-market-cards overflow-x-auto pb-2 mb-4">
                  <div className="flex space-x-3" style={{ width: 'max-content' }}>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 min-w-[140px]">
                      <div className="text-xs text-blue-600 font-medium mb-1">Market Cap</div>
                      <div className="text-lg font-bold text-gray-900">$2.1T</div>
                      <div className="text-xs text-green-600 flex items-center">
                        <TradingIcons.PriceUp size="xs" />
                        +2.4%
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 min-w-[140px]">
                      <div className="text-xs text-purple-600 font-medium mb-1">24h Volume</div>
                      <div className="text-lg font-bold text-gray-900">$89.2B</div>
                      <div className="text-xs text-green-600 flex items-center">
                        <TradingIcons.PriceUp size="xs" />
                        +8.1%
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 min-w-[140px]">
                      <div className="text-xs text-orange-600 font-medium mb-1">BTC Dominance</div>
                      <div className="text-lg font-bold text-gray-900">52.3%</div>
                      <div className="text-xs text-red-600 flex items-center">
                        <TradingIcons.PriceDown size="xs" />
                        -0.8%
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-3 min-w-[140px]">
                      <div className="text-xs text-teal-600 font-medium mb-1">Fear & Greed</div>
                      <div className="text-lg font-bold text-gray-900">68</div>
                      <div className="text-xs text-orange-600">Greed</div>
                    </div>
                  </div>
                </div>
                
                <div className="mobile-content-wrapper">
                  {marketChild}
                </div>
              </div>
            </div>
          </div>

          {/* Trading Tab */}
          <div className={`mobile-tab-panel ${activeTab === 'trading' ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TradingIcons.Trade size="sm" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Quick Trade</h3>
              </div>
              <div className="mobile-content-wrapper">
                {tradingChild}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Sheet for Advanced Features */}
        <div className="mobile-bottom-sheet mt-6">
          <div className="bg-white rounded-t-2xl shadow-lg border-t border-gray-200 p-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <div className="text-center mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Advanced Features</h4>
              <p className="text-xs text-gray-500">Swipe up for detailed charts and analysis</p>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2">
                <TradingIcons.Chart size="sm" theme="inverse" />
                <span>Charts</span>
              </button>
              <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-3 text-sm font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2">
                <TradingIcons.Activity size="sm" theme="inverse" />
                <span>Analysis</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Layout column components for semantic structure
export const PortfolioColumn = ({ children }) => (
  <div className="lg:col-span-3 portfolio-section">
    <div className="h-full overflow-y-auto">
      {children}
    </div>
  </div>
);

export const MarketColumn = ({ children }) => (
  <div className="lg:col-span-6 market-section">
    <div className="h-full overflow-y-auto">
      {children}
    </div>
  </div>
);

export const TradingColumn = ({ children }) => (
  <div className="lg:col-span-3 trading-section">
    <div className="h-full overflow-y-auto">
      {children}
    </div>
  </div>
);

export default DashboardLayout;