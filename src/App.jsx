import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ContestPage from './pages/ContestPage';
import AdminPage from './pages/AdminPage';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minuti
    },
  },
});

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-custom"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-vh-100 bg-light">
          <Navbar />

          <main>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
              />
              <Route
                path="/register"
                element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}
              />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contest/:id"
                element={
                  <ProtectedRoute>
                    <ContestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
