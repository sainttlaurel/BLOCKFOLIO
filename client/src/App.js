import React from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; 
import { Toaster } from 'react-hot-toast'; 
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HighContrastProvider } from './contexts/HighContrastContext'; 
 
// Simple page imports 
import Login from './pages/Login'; 
import Register from './pages/Register'; 
import Dashboard from './pages/Dashboard'; 
import Portfolio from './pages/Portfolio'; 
import Trading from './pages/Trading'; 
import Transactions from './pages/Transactions'; 
import Navbar from './components/Navbar'; 
 
function ProtectedRoute({ children }) { 
  const { user, loading } = useAuth(); 
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>; 
  return user ? children : <Navigate to="/login" />; 
} 
 
function PublicRoute({ children }) { 
  const { user, loading } = useAuth(); 
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>; 
  return user ? <Navigate to="/dashboard" /> : children; 
} 
 
function App() { 
  return ( 
    <AuthProvider>
      <HighContrastProvider>
        <Router> 
          <div className="min-h-screen bg-gray-50"> 
            <Navbar /> 
            <main className="px-4 py-6"> 
              <Routes> 
                <Route path="/" element={<Navigate to="/dashboard" />} /> 
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} /> 
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} /> 
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> 
                <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} /> 
                <Route path="/trading" element={<ProtectedRoute><Trading /></ProtectedRoute>} /> 
                <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} /> 
              </Routes> 
            </main> 
            <Toaster position="top-right" /> 
          </div> 
        </Router>
      </HighContrastProvider>
    </AuthProvider> 
  ); 
} 
 
export default App; 
