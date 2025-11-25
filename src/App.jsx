import AdminCreditsPage from './pages/AdminCreditsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import React, { useEffect, useState } from 'react';
import i18n from './i18n';
import './style/pagesStyle/SettingsPage.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ContestPage from './pages/ContestPage';
import ContestsPage from './pages/ContestsPage';
import ProfilePage from './pages/ProfilePage';
import MyPhotosPage from './pages/MyPhotosPage';
import SettingsPage from './pages/SettingsPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AdminPage from './pages/AdminPage';
import AdminDashboard from './pages/AdminDashboard';
import EditContestPage from './pages/EditContestPage';
import AdminContestsPage from './pages/AdminContestsPage';
import ModerationPage from './pages/ModerationPage';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Toast from './components/Toast.jsx';
import { useToastStore } from './stores/toastStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minuti
    },
  },
});

function App() {
  // Forza re-render globale al cambio lingua
  const [currentLang, setCurrentLang] = useState(i18n.language);
  useEffect(() => {
    const onLangChange = (lng) => setCurrentLang(lng);
    i18n.on('languageChanged', onLangChange);
    return () => i18n.off('languageChanged', onLangChange);
  }, []);
  const { isAuthenticated, isLoading, token, checkAuth } = useAuthStore();

  const { toast, hideToast } = useToastStore();

  useEffect(() => {
    // Se c'è un token nel localStorage ma non siamo autenticati, 
    // proviamo a verificare l'autenticazione
    if (token && !isAuthenticated) {
      checkAuth();
    }
  }, [token, isAuthenticated, checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Forza re-render su cambio lingua */}
      <React.Fragment key={currentLang}>
        <Router>
          {/* Il tema viene gestito dal body tramite SettingsPage.css */}
          <Navbar />

          {/* Toast globale */}
          {toast.visible && (
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={hideToast}
            />
          )}

          <main>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
              />
              <Route
                path="/register"
                element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />}
              />
              <Route
                path="/forgot-password"
                element={isAuthenticated ? <Navigate to="/" /> : <ForgotPasswordPage />}
              />
              <Route
                path="/reset-password"
                element={isAuthenticated ? <Navigate to="/" /> : <ResetPasswordPage />}
              />

              {/* Auth callback route */}
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* Protected routes */}
              {/* DashboardPage per tutti gli utenti autenticati tranne admin */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contests"
                element={
                  <ProtectedRoute>
                    <ContestsPage />
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
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-photos"
                element={
                  <ProtectedRoute>
                    <MyPhotosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
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


              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/credits"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminCreditsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/contests"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminContestsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/contest/:id/edit"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <EditContestPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/users/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminUserDetailPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/moderator"
                element={
                  <ProtectedRoute requiredRole={["admin", "moderator"]}>
                    <ModerationPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

        </Router>
      </React.Fragment>
    </QueryClientProvider>
  );
}

export default App;
