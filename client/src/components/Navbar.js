import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, User, LogOut, BarChart3, CreditCard, History } from 'lucide-react';
import KeyboardShortcutsHelp from './base/KeyboardShortcutsHelp';
import HighContrastToggle from './HighContrastToggle';
import MobileNavigation from './MobileNavigation';
import { useDefaultShortcuts } from '../hooks/useKeyboardShortcuts';
import { useHoverPreloading } from '../hooks/useLazyComponents';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { handleMouseEnter, handleMouseLeave } = useHoverPreloading();
  
  // Enable default keyboard shortcuts
  useDefaultShortcuts();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2" aria-label="CoinNova home">
              <TrendingUp className="h-8 w-8 text-primary-600" aria-hidden="true" />
              <span className="text-xl font-bold text-gray-900">CoinNova</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-8" role="menubar" aria-label="Primary navigation">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                role="menuitem"
                aria-label="Dashboard - Keyboard shortcut Command 1"
                aria-current={isActive('/dashboard') ? 'page' : undefined}
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                <span>Dashboard</span>
                <kbd className="ml-2 px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded" aria-label="Keyboard shortcut">⌘1</kbd>
              </Link>
              
              <Link
                to="/portfolio"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/portfolio')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onMouseEnter={() => handleMouseEnter('portfolio')}
                onMouseLeave={() => handleMouseLeave('portfolio')}
                role="menuitem"
                aria-label="Portfolio - Keyboard shortcut Command 2"
                aria-current={isActive('/portfolio') ? 'page' : undefined}
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                <span>Portfolio</span>
                <kbd className="ml-2 px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded" aria-label="Keyboard shortcut">⌘2</kbd>
              </Link>
              
              <Link
                to="/trading"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/trading')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onMouseEnter={() => handleMouseEnter('trading')}
                onMouseLeave={() => handleMouseLeave('trading')}
                role="menuitem"
                aria-label="Trading - Keyboard shortcut Command 3"
                aria-current={isActive('/trading') ? 'page' : undefined}
              >
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                <span>Trading</span>
                <kbd className="ml-2 px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded" aria-label="Keyboard shortcut">⌘3</kbd>
              </Link>
              
              <Link
                to="/transactions"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/transactions')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onMouseEnter={() => handleMouseEnter('transactions')}
                onMouseLeave={() => handleMouseLeave('transactions')}
                role="menuitem"
                aria-label="Transaction History - Keyboard shortcut Command 4"
                aria-current={isActive('/transactions') ? 'page' : undefined}
              >
                <History className="h-4 w-4" aria-hidden="true" />
                <span>History</span>
                <kbd className="ml-2 px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded" aria-label="Keyboard shortcut">⌘4</kbd>
              </Link>
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {user && <HighContrastToggle />}
            {user && <div className="hidden md:block"><KeyboardShortcutsHelp /></div>}
            {user ? (
              <>
                <div className="hidden md:flex items-center space-x-3" role="group" aria-label="User account">
                  <div className="flex items-center space-x-2" aria-label={`Logged in as ${user.username}`}>
                    <User className="h-5 w-5 text-gray-600" aria-hidden="true" />
                    <span className="text-sm font-medium text-gray-700">
                      {user.username}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors min-h-[44px]"
                    aria-label="Logout from account"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>Logout</span>
                  </button>
                </div>
                {/* Mobile Navigation */}
                <MobileNavigation />
              </>
            ) : (
              <div className="flex items-center space-x-4" role="group" aria-label="Authentication">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 min-h-[44px] flex items-center px-3"
                  aria-label="Login to your account"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm min-h-[44px] flex items-center"
                  aria-label="Sign up for a new account"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;