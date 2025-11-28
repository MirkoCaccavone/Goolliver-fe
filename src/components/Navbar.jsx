import React, { useState, useRef, useEffect } from 'react';
import { FaTachometerAlt, FaTrophy, FaChartBar, FaCog, FaUserShield, FaUser, FaImages, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaChevronDown } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import '../style/componentsStyle/Navbar.css';

const Navbar = () => {
    const { t } = useTranslation();
    const { isAuthenticated, user, logout } = useAuthStore();
    // Mostra avatar solo se è un URL valido
    const isValidAvatarUrl = user?.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/storage/'));
    const avatarUrl = isValidAvatarUrl
        ? (user.avatar.startsWith('/storage/')
            ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://127.0.0.1:8000'}${user.avatar}`
            : user.avatar)
        : null;
    const navigate = useNavigate();
    const location = useLocation();


    // Mobile menu state
    const [mobileOpen, setMobileOpen] = useState(false);
    // Dropdown user menu state
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    const isActiveLink = (path) => {
        return location.pathname === path;
    };

    const getLinkClass = (path, baseClass = 'navbar-link nav-link text-secondary me-3') => {
        return isActiveLink(path)
            ? `${baseClass} navbar-link-active fw-medium text-primary`
            : baseClass;
    };

    // Chiude il menu mobile dopo click su link
    const handleNavLinkClick = () => {
        if (mobileOpen) setMobileOpen(false);
    };

    return (
        <nav className="navbar-main">
            <div className="navbar-container">
                {/* Brand */}
                <Link to="/" className="navbar-brand-section">
                    <div className="navbar-logo">
                        <span>G</span>
                    </div>
                    <span className="navbar-brand-text">Goolly</span>
                </Link>

                {/* Mobile toggle button */}
                <button
                    className={`navbar-toggle${mobileOpen ? ' open' : ''}`}
                    type="button"
                    aria-label="Toggle navigation"
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen((v) => !v)}
                >
                    <span className="navbar-toggle-icon"></span>
                </button>

                {/* Navigation Links */}
                <div className={`navbar-nav-container${mobileOpen ? ' open' : ''}`} id="navbarNav">
                    <div className="navbar-nav-items">
                        {isAuthenticated ? (
                            <>
                                {/* MOBILE: Avatar, nome e menu riorganizzato SOLO se mobileOpen */}
                                {mobileOpen ? (
                                    <>
                                        <div className="navbar-mobile-menu-group">
                                            <div className="navbar-mobile-userinfo">
                                                <div className="navbar-user-avatar navbar-mobile-avatar">
                                                    {avatarUrl ? (
                                                        <img
                                                            src={avatarUrl}
                                                            alt="Avatar"
                                                            className="navbar-avatar-img navbar-mobile-avatar-img"
                                                        />
                                                    ) : (
                                                        <span className="navbar-avatar-placeholder navbar-mobile-avatar-placeholder">
                                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="navbar-user-name navbar-mobile-user-name">{user?.name}</span>
                                            </div>
                                            <div className="navbar-mobile-links">
                                                {user?.role !== 'admin' && (
                                                    <Link
                                                        to="/dashboard"
                                                        className={getLinkClass('/dashboard', 'navbar-link')}
                                                        onClick={handleNavLinkClick}
                                                    >
                                                        <FaTachometerAlt className="navbar-icon" />
                                                        Dashboard
                                                    </Link>
                                                )}
                                                <Link
                                                    to="/contests"
                                                    className={getLinkClass('/contests', 'navbar-link')}
                                                    onClick={handleNavLinkClick}
                                                >
                                                    <FaTrophy className="navbar-icon" />
                                                    {t('contests.label')}
                                                </Link>
                                                {user?.role === 'admin' && (
                                                    <>
                                                        <Link
                                                            to="/admin-dashboard"
                                                            className={getLinkClass('/admin-dashboard', 'navbar-admin-link navbar-link')}
                                                            onClick={handleNavLinkClick}
                                                        >
                                                            <FaChartBar className="navbar-icon" />
                                                            Dashboard Admin
                                                        </Link>
                                                        <Link
                                                            to="/admin"
                                                            className={getLinkClass('/admin', 'navbar-admin-link navbar-link')}
                                                            onClick={handleNavLinkClick}
                                                        >
                                                            <FaCog className="navbar-icon" />
                                                            {t('admin')}
                                                        </Link>
                                                    </>
                                                )}
                                                {(user?.role === 'moderator' || user?.role === 'admin') && (
                                                    <Link
                                                        to="/moderator"
                                                        className={getLinkClass('/moderator', 'navbar-moderator-link navbar-link')}
                                                        onClick={handleNavLinkClick}
                                                    >
                                                        <FaUserShield className="navbar-icon" />
                                                        {t('moderation')}
                                                    </Link>
                                                )}
                                                <Link className="navbar-dropdown-item" to="/profile" onClick={handleNavLinkClick}>
                                                    <FaUser className="navbar-icon" />
                                                    {t('my_profile')}
                                                </Link>
                                                <Link className="navbar-dropdown-item" to="/my-photos" onClick={handleNavLinkClick}>
                                                    <FaImages className="navbar-icon" />
                                                    {t('my_photos')}
                                                </Link>
                                                <Link className="navbar-dropdown-item" to="/settings" onClick={handleNavLinkClick}>
                                                    <FaCog className="navbar-icon" />
                                                    {t('settings')}
                                                </Link>
                                                <button className="navbar-logout-button navbar-dropdown-item" onClick={handleLogout}>
                                                    <FaSignOutAlt className="navbar-icon" />
                                                    {t('logout')}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* DESKTOP: come prima, avatar/nome/dropdown user */}
                                        {user?.role !== 'admin' && (
                                            <Link
                                                to="/dashboard"
                                                className={getLinkClass('/dashboard', 'navbar-link')}
                                                onClick={handleNavLinkClick}
                                            >
                                                <FaTachometerAlt className="navbar-icon" />
                                                Dashboard
                                            </Link>
                                        )}
                                        <Link
                                            to="/contests"
                                            className={getLinkClass('/contests', 'navbar-link')}
                                            onClick={handleNavLinkClick}
                                        >
                                            <FaTrophy className="navbar-icon" />
                                            {t('contests.label')}
                                        </Link>
                                        {user?.role === 'admin' && (
                                            <>
                                                <Link
                                                    to="/admin-dashboard"
                                                    className={getLinkClass('/admin-dashboard', 'navbar-admin-link navbar-link')}
                                                    onClick={handleNavLinkClick}
                                                >
                                                    <FaChartBar className="navbar-icon" />
                                                    Dashboard Admin
                                                </Link>
                                                <Link
                                                    to="/admin"
                                                    className={getLinkClass('/admin', 'navbar-admin-link navbar-link')}
                                                    onClick={handleNavLinkClick}
                                                >
                                                    <FaCog className="navbar-icon" />
                                                    {t('admin')}
                                                </Link>
                                            </>
                                        )}

                                        {(user?.role === 'moderator' || user?.role === 'admin') && (
                                            <Link
                                                to="/moderator"
                                                className={getLinkClass('/moderator', 'navbar-moderator-link navbar-link')}
                                                onClick={handleNavLinkClick}
                                            >
                                                <FaUserShield className="navbar-icon" />
                                                {t('moderation')}
                                            </Link>
                                        )}

                                        {/* User dropdown desktop */}
                                        <div className={`navbar-user-dropdown${dropdownOpen ? ' open' : ''}`} ref={dropdownRef}>
                                            <button
                                                className="navbar-user-toggle"
                                                type="button"
                                                aria-haspopup="true"
                                                aria-expanded={dropdownOpen}
                                                onClick={() => setDropdownOpen((v) => !v)}
                                            >
                                                <div className="navbar-user-avatar">
                                                    {avatarUrl ? (
                                                        <img
                                                            src={avatarUrl}
                                                            alt="Avatar"
                                                            className="navbar-avatar-img"
                                                            style={{ width: 32, height: 32, objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <span className="navbar-avatar-placeholder" style={{ width: 32, height: 32 }}>
                                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="navbar-user-name">{user?.name}</span>
                                                <FaChevronDown className="navbar-user-caret" aria-hidden="true" />
                                            </button>
                                            <ul className="navbar-dropdown-menu" style={{ display: dropdownOpen ? 'block' : 'none' }}>
                                                <li>
                                                    <Link className="navbar-dropdown-item" to="/profile" onClick={() => { setDropdownOpen(false); handleNavLinkClick(); }}>
                                                        <FaUser className="navbar-icon" />
                                                        {t('my_profile')}
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link className="navbar-dropdown-item" to="/my-photos" onClick={() => { setDropdownOpen(false); handleNavLinkClick(); }}>
                                                        <FaImages className="navbar-icon" />
                                                        {t('my_photos')}
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link className="navbar-dropdown-item" to="/settings" onClick={() => { setDropdownOpen(false); handleNavLinkClick(); }}>
                                                        <FaCog className="navbar-icon" />
                                                        {t('settings')}
                                                    </Link>
                                                </li>
                                                <li><hr className="navbar-dropdown-divider" /></li>
                                                <li>
                                                    <button
                                                        className="navbar-logout-button"
                                                        onClick={() => { setDropdownOpen(false); handleLogout(); }}
                                                    >
                                                        <FaSignOutAlt className="navbar-icon" />
                                                        {t('logout')}
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="navbar-auth-links">
                                <Link
                                    to="/login"
                                    className="navbar-login-link"
                                    onClick={handleNavLinkClick}
                                >
                                    <FaSignInAlt className="navbar-icon" />
                                    {t('login')}
                                </Link>
                                <Link
                                    to="/register"
                                    className="navbar-register-button"
                                    onClick={handleNavLinkClick}
                                >
                                    <FaUserPlus className="navbar-icon" />
                                    {t('register')}
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