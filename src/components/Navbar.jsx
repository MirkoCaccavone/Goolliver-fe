import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
            <div className="container">
                {/* Brand */}
                <Link to="/" className="navbar-brand d-flex align-items-center">
                    <div className="logo-circle me-2">
                        <span>G</span>
                    </div>
                    <span className="fw-bold fs-4 text-dark">Goolliver</span>
                </Link>

                {/* Mobile toggle button */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Navigation Links */}
                <div className="collapse navbar-collapse" id="navbarNav">
                    <div className="navbar-nav ms-auto">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="nav-link text-secondary me-3"
                                >
                                    Dashboard
                                </Link>

                                {user?.role === 'admin' && (
                                    <Link
                                        to="/admin"
                                        className="nav-link text-secondary me-3"
                                    >
                                        Admin
                                    </Link>
                                )}

                                {/* User dropdown */}
                                <div className="nav-item dropdown">
                                    <a
                                        className="nav-link dropdown-toggle d-flex align-items-center"
                                        href="#"
                                        role="button"
                                        data-bs-toggle="dropdown"
                                    >
                                        <div className="bg-secondary rounded-circle me-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                            <span className="text-white small fw-medium">
                                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <span className="text-dark">{user?.name}</span>
                                    </a>
                                    <ul className="dropdown-menu">
                                        <li><Link className="dropdown-item" to="/profile">Il mio Profilo</Link></li>
                                        <li><Link className="dropdown-item" to="/settings">Impostazioni</Link></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button
                                                className="dropdown-item"
                                                onClick={handleLogout}
                                            >
                                                Logout
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="nav-link text-secondary me-2"
                                >
                                    Accedi
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary"
                                >
                                    Registrati
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;