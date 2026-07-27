import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Batches } from './pages/Batches';
import { Dealers } from './pages/Dealers';
import { Dispatch } from './pages/Dispatch';
import { QRCodes } from './pages/QRCodes';
import { Settings } from './pages/Settings';
import { Verification } from './pages/Verification';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage label="Authenticating session credentials..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify/:token" element={<Verification />} />

        {/* Protected Admin Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/batches"
          element={
            <ProtectedRoute>
              <Batches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dealers"
          element={
            <ProtectedRoute>
              <Dealers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dispatch"
          element={
            <ProtectedRoute>
              <Dispatch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qr-codes"
          element={
            <ProtectedRoute>
              <QRCodes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
