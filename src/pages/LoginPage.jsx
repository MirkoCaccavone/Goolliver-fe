import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import { FaGoogle, FaFacebookF, FaExclamationCircle, FaInfoCircle, FaLock, FaEnvelope, FaUser, FaPhone } from "react-icons/fa";
import '../style/pagesStyle/LoginPage.css';

const LoginPage = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [socialLoading, setSocialLoading] = useState('');
    const { login, socialLogin } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const [showAccountDeleted, setShowAccountDeleted] = useState(params.get('accountDeleted') === '1');

    React.useEffect(() => {
        if (showAccountDeleted) {
            const timer = setTimeout(() => {
                setShowAccountDeleted(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showAccountDeleted]);

    const { register, handleSubmit, formState: { errors } } = useForm();



    const onSubmit = async (data) => {
        setIsLoading(true);
        setError('');
        try {
            const result = await login(data);
            if (result && result.success) {
                navigate('/');
            } else {
                const errorMessage = result?.error || t('login.errorLogin');
                setError(errorMessage);
            }
        } catch (err) {
            setError(t('login.connectionError'));
        } finally {
            setIsLoading(false);
        }
        return false;
    };

    const handleSocialLogin = async (provider) => {
        try {
            setError('');
            setSocialLoading(provider);
            await socialLogin(provider);
        } catch (error) {
            setError(t('login.socialError', { provider }));
        } finally {
            setSocialLoading('');
        }
    };

    return (

        <div className="login-container">

            {/* --- COLONNA SINISTRA: ILLUSTRAZIONE --- */}
            <div className="login-left">
                <div className='login-left-info'>
                    <h1 className="login-big-title">Bentornato su Goolly</h1>
                    <p className="login-big-subtitle">
                        Accedi per continuare a partecipare ai contest, votare le foto dei creator e vincere fantastici premi.
                    </p>
                </div>

                <div className="login-illustration"></div>
            </div>

            {/* --- COLONNA DESTRA: FORM --- */}
            <div className="login-right">
                <div className="login-page">
                    {/* --- MESSAGGIO ACCOUNT ELIMINATO --- */}
                    {showAccountDeleted && (
                        <div className='login-account-deleted'>
                            <div className="alert alert-success" role="alert">
                                {t('login.accountDeletedSuccess', 'Il tuo account è stato eliminato con successo.')}
                            </div>
                        </div>
                    )}

                    <div className="login-header">

                        {/* titolo e sottotitolo */}
                        <h2 className="login-title">{t('login.title')}</h2>
                        <p className="login-subtitle">
                            {t('login.noAccount')}{' '}
                            <Link to="/register" className="login-register-link text-primary text-decoration-none fw-medium">
                                {t('login.registerHere')}
                            </Link>
                        </p>
                    </div>

                    {error && (
                        <div className="login-error">
                            <div className="login-error-alert" role="alert">
                                <FaExclamationCircle className="login-error-icon" />
                                <div className="login-error-text">{error}</div>
                            </div>
                            {(error.includes(t('login.invalidEmailOrPassword')) || error.includes(t('login.invalidCredentials'))) && (
                                <div className="alert alert-info alert-sm">
                                    <i className="bi bi-lightbulb me-2"></i>
                                    <strong>{t('login.suggestionsTitle')}</strong>
                                    <ul className="mb-0 mt-2">
                                        <li>{t('login.suggestionCheckEmail')}</li>
                                        <li>{t('login.suggestionCheckCapsLock')}</li>
                                        <li>{t('login.suggestionTrySocial')}</li>
                                        <li>{t('login.suggestionForgotPassword', { link: <Link to="/forgot-password" className="text-primary">{t('login.suggestionForgotPasswordLink')}</Link> })}</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* registrazione tramite social */}
                    <div className="login-social-container">

                        {/* google button */}
                        <button
                            type="button"
                            className="login-social-button login-google-button"
                            onClick={() => handleSocialLogin('google')}
                            disabled={socialLoading === 'google' || isLoading}
                        >
                            {socialLoading === 'google' ? (
                                <span className="login-loading-spinner" role="status" aria-hidden="true"></span>
                            ) : (
                                <FaGoogle className="login-social-icon" />
                            )}
                            <span className="login-social-text">
                                {socialLoading === 'google' ? t('login.connecting') : t('login.continueWithGoogle')}
                            </span>
                        </button>

                        {/* facebook button */}
                        <button
                            type="button"
                            className="login-social-button login-facebook-button"
                            onClick={() => handleSocialLogin('facebook')}
                            disabled={socialLoading === 'facebook' || isLoading}
                        >
                            {socialLoading === 'facebook' ? (
                                <span className="login-loading-spinner" role="status" aria-hidden="true"></span>
                            ) : (
                                <FaFacebookF className="login-social-icon" />
                            )}
                            <span className="login-social-text">
                                {socialLoading === 'facebook' ? t('login.connecting') : t('login.continueWithFacebook')}
                            </span>
                        </button>

                        {/* messaggio per problema con facebook */}
                        <div className="alert alert-info">
                            <strong>{t('login.facebookOtherAccountTitle')}</strong><br />
                            {t('login.facebookOtherAccountDesc1')}<br />
                            {t('login.facebookOtherAccountDesc2')}
                        </div>
                    </div>

                    {/* divider line */}
                    <div className="login-divider">
                        <hr className="login-divider-line" />
                        <span className="login-divider-text">{t('login.or')}</span>
                        <hr className="login-divider-line" />
                    </div>

                    {/* form di registrazione */}
                    <form className="login-form" onSubmit={handleSubmit(onSubmit)}>

                        {/* email */}
                        <div className="login-field">
                            <label htmlFor="email" className="login-field-label form-label">
                                <FaEnvelope className="login-field-icon" /> {t('login.email')}

                            </label>
                            <input
                                {...register('email', {
                                    required: t('login.emailRequired'),
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: t('login.emailInvalid')
                                    }
                                })}
                                type="email"
                                className={`login-field-input form-control ${errors.email ? 'login-field-input-error is-invalid' : ''}`}
                                placeholder={t('login.emailPlaceholder')}
                            />
                            {errors.email && (
                                <div className="login-field-error invalid-feedback">{errors.email.message}</div>
                            )}
                        </div>

                        {/* password */}
                        <div className="login-field">
                            <label htmlFor="password" className="login-field-label form-label">
                                <FaLock className="login-field-icon" /> {t('login.password')}
                            </label>
                            <input
                                {...register('password', {
                                    required: t('login.passwordRequired'),
                                    minLength: {
                                        value: 6,
                                        message: t('login.passwordMinLength')
                                    }
                                })}
                                type="password"
                                className={`login-field-input form-control ${errors.password ? 'login-field-input-error is-invalid' : ''}`}
                                placeholder={t('login.passwordPlaceholder')}
                            />
                            {errors.password && (
                                <div className="login-field-error invalid-feedback">{errors.password.message}</div>
                            )}
                        </div>

                        {/* ricordami */}
                        <div className="login-options">
                            <div className="form-check">
                                <input
                                    className="login-remember-checkbox"
                                    type="checkbox"
                                    id="remember"
                                />
                                <label className="login-remember-label" htmlFor="remember">
                                    {t('login.rememberMe')}
                                </label>
                            </div>

                            {/* recupero password */}
                            <Link to="/forgot-password" className="login-forgot-password-link">
                                {t('login.forgotPassword')}
                            </Link>
                        </div>

                        {/* login button */}
                        <button
                            type="submit"
                            disabled={isLoading || socialLoading}
                            className={`login-button ${isLoading ? 'login-button-loading' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="login-loading-spinner" role="status">
                                        <span className="visually-hidden">{t('login.loading')}</span>
                                    </div>
                                    {t('login.loginButton')}
                                </>
                            ) : (
                                t('login.loginButton')
                            )}
                        </button>


                    </form>
                </div>
            </div>


        </div>

    );
};

export default LoginPage;