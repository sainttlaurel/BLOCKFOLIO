import React from 'react';
import { TrendingUp, TrendingDown, Award, AlertTriangle, DollarSign, Target } from 'lucide-react';
import AnimatedCounter from './base/AnimatedCounter';

/**
 * Portfolio Performance Summary Cards Component
 * 
 * Displays key portfolio metrics in professional card format with glass morphism styling.
 * Implements Requirements 1.1: Portfolio performance summary cards
 * Implements Requirements 1.2: Animated value updates with smooth transitions
 * 
 * Features:
 * - Key portfolio metrics: Total Return, Unrealized P&L, Today's Change, Best/Worst Performer
 * - Professional glass morphism card design
 * - Color-coded indicators (green/red for gains/losses)
 * - Smooth counter animation for numerical value changes
 * - Responsive design for different screen sizes
 * - Icons for visual clarity
 * - Integration with existing portfolio data structure
 * - Consistent styling with design system
 * - 60fps performance optimization with GPU acceleration
 * - Accessibility support (reduced motion)
 */
const PortfolioSummaryCards = ({ 
  portfolioData = {},
  holdings = [],
  isLoading = false,
  previousMetrics = null // Add previous metrics for animation
}) => {
  // Calculate portfolio metrics
  const calculateMetrics = () => {
    if (!holdings || holdings.length === 0) {
      return {
        totalReturn: 0,
        totalReturnPercentage: 0,
        unrealizedPnL: 0,
        todaysChange: 0,
        todaysChangePercentage: 0,
        bestPerformer: null,
        worstPerformer: null
      };
    }

    let totalInvested = 0;
    let totalCurrentValue = 0;
    let todaysChangeValue = 0;
    let bestPerformer = holdings[0];
    let worstPerformer = holdings[0];

    holdings.forEach(holding => {
      const currentValue = parseFloat(holding.value || 0);
      const amount = parseFloat(holding.amount || 0);
      const currentPrice = parseFloat(holding.currentPrice || 0);
      const averageBuyPrice = parseFloat(holding.averageBuyPrice || currentPrice);
      
      // Calculate invested amount
      const investedAmount = amount * averageBuyPrice;
      totalInvested += investedAmount;
      totalCurrentValue += currentValue;
      
      // Calculate today's change (assuming we have percentage change)
      const percentageChange = parseFloat(holding.percentageChange || 0);
      const todaysChangeForHolding = currentValue * (percentageChange / 100);
      todaysChangeValue += todaysChangeForHolding;
      
      // Find best and worst performers
      if (percentageChange > parseFloat(bestPerformer.percentageChange || 0)) {
        bestPerformer = holding;
      }
      if (percentageChange < parseFloat(worstPerformer.percentageChange || 0)) {
        worstPerformer = holding;
      }
    });

    const totalReturn = totalCurrentValue - totalInvested;
    const totalReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    const todaysChangePercentage = totalCurrentValue > 0 ? (todaysChangeValue / totalCurrentValue) * 100 : 0;

    return {
      totalReturn,
      totalReturnPercentage,
      unrealizedPnL: totalReturn, // Same as total return for unrealized gains/losses
      todaysChange: todaysChangeValue,
      todaysChangePercentage,
      bestPerformer: bestPerformer.percentageChange !== 0 ? bestPerformer : null,
      worstPerformer: worstPerformer.percentageChange !== 0 ? worstPerformer : null
    };
  };

  const metrics = calculateMetrics();

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage values
  const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Get color class for positive/negative values
  const getColorClass = (value) => {
    if (value > 0) return 'text-market-positive';
    if (value < 0) return 'text-market-negative';
    return 'text-neutral-500';
  };

  // Get background color class for positive/negative values
  const getBgColorClass = (value) => {
    if (value > 0) return 'bg-market-positive';
    if (value < 0) return 'bg-market-negative';
    return 'bg-neutral-100';
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="glass-card glass-card--portfolio glass-card--sm animate-pulse">
            <div className="h-4 bg-neutral-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-neutral-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-neutral-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  const summaryCards = [
    {
      id: 'total-return',
      title: 'Total Return',
      value: formatCurrency(metrics.totalReturn),
      rawValue: metrics.totalReturn,
      percentage: formatPercentage(metrics.totalReturnPercentage),
      rawPercentage: metrics.totalReturnPercentage,
      icon: DollarSign,
      colorValue: metrics.totalReturn,
      description: 'Overall portfolio performance'
    },
    {
      id: 'unrealized-pnl',
      title: 'Unrealized P&L',
      value: formatCurrency(metrics.unrealizedPnL),
      rawValue: metrics.unrealizedPnL,
      percentage: formatPercentage(metrics.totalReturnPercentage),
      rawPercentage: metrics.totalReturnPercentage,
      icon: Target,
      colorValue: metrics.unrealizedPnL,
      description: 'Unrealized gains and losses'
    },
    {
      id: 'todays-change',
      title: "Today's Change",
      value: formatCurrency(metrics.todaysChange),
      rawValue: metrics.todaysChange,
      percentage: formatPercentage(metrics.todaysChangePercentage),
      rawPercentage: metrics.todaysChangePercentage,
      icon: metrics.todaysChange >= 0 ? TrendingUp : TrendingDown,
      colorValue: metrics.todaysChange,
      description: '24-hour portfolio change'
    },
    {
      id: 'best-performer',
      title: 'Best Performer',
      value: metrics.bestPerformer ? metrics.bestPerformer.symbol : 'N/A',
      percentage: metrics.bestPerformer ? formatPercentage(parseFloat(metrics.bestPerformer.percentageChange)) : 'N/A',
      rawPercentage: metrics.bestPerformer ? parseFloat(metrics.bestPerformer.percentageChange) : 0,
      icon: Award,
      colorValue: metrics.bestPerformer ? parseFloat(metrics.bestPerformer.percentageChange) : 0,
      description: 'Top performing asset',
      isAsset: true
    },
    {
      id: 'worst-performer',
      title: 'Worst Performer',
      value: metrics.worstPerformer ? metrics.worstPerformer.symbol : 'N/A',
      percentage: metrics.worstPerformer ? formatPercentage(parseFloat(metrics.worstPerformer.percentageChange)) : 'N/A',
      rawPercentage: metrics.worstPerformer ? parseFloat(metrics.worstPerformer.percentageChange) : 0,
      icon: AlertTriangle,
      colorValue: metrics.worstPerformer ? parseFloat(metrics.worstPerformer.percentageChange) : 0,
      description: 'Lowest performing asset',
      isAsset: true
    }
  ];

  return (
    <div className="portfolio-summary-cards">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {summaryCards.map((card) => {
          const IconComponent = card.icon;
          const isPositive = card.colorValue > 0;
          const isNegative = card.colorValue < 0;
          const isNeutral = card.colorValue === 0;

          return (
            <div
              key={card.id}
              data-card-id={card.id}
              className="glass-card glass-card--portfolio glass-card--sm portfolio-summary-card"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${getBgColorClass(card.colorValue)} bg-opacity-10`}>
                  <IconComponent 
                    className={`h-5 w-5 ${getColorClass(card.colorValue)}`}
                    aria-hidden="true"
                  />
                </div>
                {!card.isAsset && (
                  <div className={`flex items-center space-x-1 ${getColorClass(card.colorValue)}`}>
                    {isPositive && <TrendingUp className="h-3 w-3" />}
                    {isNegative && <TrendingDown className="h-3 w-3" />}
                    <span className="text-xs font-medium">
                      {card.percentage}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="space-y-1">
                <h3 className="text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  {card.title}
                </h3>
                
                <div className="flex items-baseline justify-between">
                  {card.isAsset ? (
                    <span className="text-lg font-bold text-neutral-900">
                      {card.value}
                    </span>
                  ) : (
                    <AnimatedCounter
                      value={card.rawValue || 0}
                      previousValue={previousMetrics ? previousMetrics[card.id] : null}
                      type="currency"
                      className={`text-lg font-bold ${getColorClass(card.colorValue)}`}
                      onAnimationStart={() => {
                        // Add visual feedback during animation
                        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
                        if (cardElement) {
                          cardElement.classList.add('animate-card-update');
                        }
                      }}
                      onAnimationComplete={() => {
                        // Remove visual feedback after animation
                        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
                        if (cardElement) {
                          cardElement.classList.remove('animate-card-update');
                        }
                      }}
                    />
                  )}
                  
                  {card.isAsset && card.percentage !== 'N/A' && (
                    <AnimatedCounter
                      value={card.rawPercentage || 0}
                      previousValue={previousMetrics ? previousMetrics[`${card.id}_percentage`] : null}
                      type="percentage"
                      showSign={true}
                      className={`text-sm font-semibold ${getColorClass(card.colorValue)}`}
                    />
                  )}
                </div>
                
                <p className="text-xs text-neutral-500">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortfolioSummaryCards;