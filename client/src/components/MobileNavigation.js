import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, CreditCard, TrendingUp, History, Menu, X } from 'lucide-react';

/**
 * MobileNavigation - Mobile-optimized navigation with hamburger menu
 * Ensures 44x44px touch targets and mobile-friendly interactions
 */
const MobileNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const closeMenu = () => setIsMenuOpen(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/portfolio', label: 'Portfolio', icon: CreditCard },
    { path: '/trading', label: 'Trading', icon: TrendingUp },
    { path: '/transactions', label: 'History', icon: History },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-menu"
      >
        {isMenuOpen ? (
          <X className="h-6 w-6 text-gray-700" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" aria-hidden="true" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            id="mobile-menu"
            className="fixed top-16 left-0 right-0 bottom-0 bg-white z-50 md:hidden overflow-y-auto"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <nav className="p-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-4 py-4 rounded-lg mb-2 transition-colors min-h-[56px] ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-current={isActive(item.path) ? 'page' : undefined}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                    <span className="text-lg font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default MobileNavigation;
