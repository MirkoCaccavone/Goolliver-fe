import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { isAuthenticated, user, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-custom"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!allowedRoles.includes(user?.role)) {
            return (
                <div className="container-fluid d-flex justify-content-center align-items-center vh-100">
                    <div className="text-center">
                        <h1 className="display-1 fw-bold text-muted">403</h1>
                        <p className="fs-3 text-muted mb-4">
                            Accesso Negato
                        </p>
                        <p className="text-secondary mb-4">
                            Non hai i permessi necessari per accedere a questa pagina.
                        </p>
                        <Navigate to="/dashboard" replace />
                    </div>
                </div>
            );
        }
    }

    return children;
};

export default ProtectedRoute;