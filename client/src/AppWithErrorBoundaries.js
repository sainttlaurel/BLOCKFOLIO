/**
 * Enhanced App Component with Error Boundary Integration
 * Demonstrates how to integrate error boundaries throughout the trading platform
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Trading from './pages/Trading';
import Transactions from './pages/Transactions';
import ErrorBoundaryDemo from './components/ErrorBoundaryDemo';

// Import error boundary components
import ErrorBoundary, { 
  NetworkErrorBoundary, 
  TradingErrorBoundary 
} from './components/base/ErrorBoundary';
import { 
  withErrorBoundary, 
  withNetworkErrorBoundary, 
  withTradingErrorBoundary 
} from './components/base/withErrorBoundary';

// Enhanced components with error boundaries
const SafeNavbar = withNetworkErrorBoundary(Navbar, {
  title: 'Navigation Error',
  message: 'Navigation temporarily unavailable',
  compact: true
});

const SafeDashboard = withErrorBoundary(Dashboard, {
  context: 'Dashboard',
  title: 'Dashboard Error',
  message: 'Unable to load dashboard. Please refresh to try again.'
});

const SafePortfolio = withErrorBoundary(Portfolio, {
  context: 'Portfolio',
  title: 'Portfolio Error',
  message: 'Unable to load portfolio data. Please refresh to try again.'
});

const SafeTrading = withTradingErrorBoundary(Trading, {
  title: 'Trading Platform Error',
  message: 'Trading interface encountered an error. Please refresh for safe trading.'
});

const SafeTransactions = withErrorBoundary(Transactions, {
  context: 'Transactions',
  title: 'Transaction History Error',
  message: 'Unable to load transaction history. Please try again.'
});

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fintech-brand-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fintech-brand-600"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
}

function AppWithErrorBoundaries() {
  return (
    <ErrorBoundary context="Application Root">
      <AuthProvider>
        <NetworkErrorBoundary>
          <Router>
            <div className="min-h-screen bg-fintech-neutral-50">
              <SafeNavbar />
              <main className="px-4 py-6">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  
                  {/* Public Routes */}
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute>
                        <div className="container mx-auto">
                          <Login />
                        </div>
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      <PublicRoute>
                        <div className="container mx-auto">
                          <Register />
                        </div>
                      </PublicRoute>
                    } 
                  />
                  
                  {/* Protected Routes with Error Boundaries */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <SafeDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/portfolio" 
                    element={
                      <ProtectedRoute>
                        <div className="container mx-auto">
                          <SafePortfolio />
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/trading" 
                    element={
                      <ProtectedRoute>
                        <div className="container mx-auto">
                          <TradingErrorBoundary>
                            <SafeTrading />
                          </TradingErrorBoundary>
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/transactions" 
                    element={
                      <ProtectedRoute>
                        <div className="container mx-auto">
                          <SafeTransactions />
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Error Boundary Demo Route */}
                  <Route 
                    path="/error-demo" 
                    element={
                      <div className="container mx-auto">
                        <ErrorBoundaryDemo />
                      </div>
                    } 
                  />
                </Routes>
              </main>
              
              {/* Toast notifications with error boundary */}
              <ErrorBoundary 
                context="Notifications"
                compact={true}
                title="Notification Error"
                message="Notification system temporarily unavailable"
              >
                <Toaster position="top-right" />
              </ErrorBoundary>
            </div>
          </Router>
        </NetworkErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundaries;