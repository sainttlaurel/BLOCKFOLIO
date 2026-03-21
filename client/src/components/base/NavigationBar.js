import React from 'react';
import ConnectionStatusIndicator from '../ConnectionStatusIndicator';

/**
 * NavigationBar - Professional trading platform navigation
 * Contains logo, navigation links, search bar, and user menu
 */
const NavigationBar = () => {
  return (
    <nav className="nav-sticky-top bg-white border-b border-neutral-200 px-6 py-4">
      <div className="flex-between-center max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CT</span>
          </div>
          <span className="text-xl font-semibold text-neutral-900">CryptoTrade</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#portfolio" className="text-neutral-700 hover:text-brand-600 font-medium transition-colors">
            Portfolio
          </a>
          <a href="#markets" className="text-neutral-700 hover:text-brand-600 font-medium transition-colors">
            Markets
          </a>
          <a href="#trading" className="text-neutral-700 hover:text-brand-600 font-medium transition-colors">
            Trading
          </a>
        </div>

        {/* Search Bar */}
        <div className="hidden lg:flex items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              className="input-field w-64 pl-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Connection Status Indicator */}
          <ConnectionStatusIndicator className="hidden sm:flex" />
          
          <button className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12h5v12z" />
            </svg>
          </button>
          <div className="w-8 h-8 bg-neutral-200 rounded-full"></div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;