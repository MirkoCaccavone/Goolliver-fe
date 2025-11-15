import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import './Navbar.css';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isActiveLink = (path) => {
        return location.pathname === path;
    };

    const getLinkClass = (path, baseClass = 'navbar-link nav-link text-secondary me-3') => {
        return isActiveLink(path)
            ? `${baseClass} navbar-link-active fw-medium text-primary`
            : baseClass;
    };

    return (
        <nav className="navbar-main navbar navbar-expand-lg navbar-light bg-white shadow-sm">
            <div className="navbar-container container">
                {/* Brand */}
                <Link to="/" className="navbar-brand-section navbar-brand d-flex align-items-center">
                    <div className="navbar-logo logo-circle me-2">
                        <span>G</span>
                    </div>
                    <span className="navbar-brand-text fw-bold fs-4 text-dark">Goolliver</span>
                </Link>

                {/* Mobile toggle button */}
                <button
                    className="navbar-toggle navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Navigation Links */}
                <div className="navbar-nav-container collapse navbar-collapse" id="navbarNav">
                    <div className="navbar-nav-items navbar-nav ms-auto">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className={getLinkClass('/dashboard', 'navbar-dashboard-link navbar-link nav-link text-secondary me-3')}
                                >
                                    <i className="bi bi-house-door me-1"></i>
                                    Dashboard
                                </Link>

                                <Link
                                    to="/contests"
                                    className={getLinkClass('/contests', 'navbar-link nav-link text-secondary me-3')}
                                >
                                    <i className="bi bi-trophy me-1"></i>
                                    Contest
                                </Link>

                                {user?.role === 'admin' && (
                                    <Link
                                        to="/admin"
                                        className={getLinkClass('/admin', 'navbar-admin-link navbar-link nav-link text-secondary me-3')}
                                    >
                                        <i className="bi bi-gear me-1"></i>
                                        Admin
                                    </Link>
                                )}
                                {(user?.role === 'moderator' || user?.role === 'admin') && (
                                    <Link
                                        to="/moderator"
                                        className={getLinkClass('/moderator', 'navbar-moderator-link navbar-link nav-link text-secondary me-3')}
                                    >
                                        <i className="bi bi-shield-check me-1"></i>
                                        Moderazione
                                    </Link>
                                )}

                                {/* User dropdown */}
                                <div className="navbar-user-dropdown nav-item dropdown">
                                    <a
                                        className="navbar-user-toggle nav-link dropdown-toggle d-flex align-items-center"
                                        href="#"
                                        role="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        <div className="navbar-user-avatar bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                            <span className="text-white small fw-medium">
                                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <span className="navbar-user-name text-dark d-none d-lg-inline">{user?.name}</span>
                                    </a>
                                    <ul className="navbar-dropdown-menu dropdown-menu">
                                        <li>
                                            <Link className="navbar-dropdown-item dropdown-item" to="/profile">
                                                <i className="bi bi-person me-2"></i>
                                                Il mio Profilo
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="navbar-dropdown-item dropdown-item" to="/my-photos">
                                                <i className="bi bi-images me-2"></i>
                                                Le mie Foto
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="navbar-dropdown-item dropdown-item" to="/settings">
                                                <i className="bi bi-gear me-2"></i>
                                                Impostazioni
                                            </Link>
                                        </li>
                                        <li><hr className="navbar-dropdown-divider dropdown-divider" /></li>
                                        <li>
                                            <button
                                                className="navbar-logout-button dropdown-item text-danger"
                                                onClick={handleLogout}
                                            >
                                                <i className="bi bi-box-arrow-right me-2"></i>
                                                Logout
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <div className="navbar-auth-links d-flex align-items-center">
                                <Link
                                    to="/login"
                                    className="navbar-login-link nav-link text-secondary me-2"
                                >
                                    <i className="bi bi-box-arrow-in-right me-1"></i>
                                    Accedi
                                </Link>
                                <Link
                                    to="/register"
                                    className="navbar-register-button btn btn-primary"
                                >
                                    <i className="bi bi-person-plus me-1"></i>
                                    Registrati
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