import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import './RegisterPage.css';

const RegisterPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const register = useAuthStore(state => state.register);
    const socialLogin = useAuthStore(state => state.socialLogin);
    const isLoading = useAuthStore(state => state.isLoading);
    const [serverError, setServerError] = useState('');
    const [socialLoading, setSocialLoading] = useState('');

    const {
        register: registerForm,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm();

    const password = watch('password');

    const onSubmit = async (data) => {
        setServerError('');

        const result = await register(data.name, data.email, data.password, data.password_confirmation, data.phone);

        if (result.success) {
            // Registrazione riuscita, vai alla dashboard
            navigate('/dashboard');
        } else {
            // Mostra errore di registrazione con dettagli specifici
            if (result.validationErrors) {
                // Se ci sono errori di validazione specifici dal server
                setServerError(result.error);
            } else {
                // Errore generico
                setServerError(result.error || 'Errore durante la registrazione');
            }
        }
    };

    const handleSocialLogin = async (provider) => {
        try {
            setServerError('');
            setSocialLoading(provider);
            await socialLogin(provider);
        } catch (error) {
            setServerError(`Errore durante l'accesso con ${provider}`);
        } finally {
            setSocialLoading('');
        }
    }; return (
        <div className="register-page min-vh-100 d-flex align-items-center py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow">
                            <div className="card-body p-5">
                                <div className="register-header text-center mb-4">
                                    <div className="register-logo logo-circle mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                                        <span>G</span>
                                    </div>
                                    <h2 className="register-title h3 fw-bold text-dark">{t('create_account')}</h2>
                                    <p className="register-subtitle text-muted">{t('join_community')}</p>
                                </div>

                                {serverError && (
                                    <div className="register-error alert alert-danger">
                                        <i className="register-error-icon bi bi-exclamation-triangle me-2"></i>
                                        <span className="register-error-text">{t(serverError)}</span>
                                    </div>
                                )}

                                <div className="register-social-container mb-4">
                                    <button
                                        type="button"
                                        className="register-social-button register-google-button btn btn-outline-dark w-100 mb-3 py-3 d-flex align-items-center justify-content-center"
                                        onClick={() => handleSocialLogin('google')}
                                        disabled={socialLoading === 'google' || isLoading}
                                    >
                                        {socialLoading === 'google' ? (
                                            <span className="register-loading-spinner spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        ) : (
                                            <i className="register-social-icon bi bi-google me-2"></i>
                                        )}
                                        <span className="register-social-text">
                                            {socialLoading === 'google' ? t('connecting') : t('continue_with_google')}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        className="register-social-button register-facebook-button btn btn-primary w-100 mb-3 py-3 d-flex align-items-center justify-content-center"
                                        onClick={() => handleSocialLogin('facebook')}
                                        disabled={socialLoading === 'facebook' || isLoading}
                                        style={{ backgroundColor: '#1877f2', borderColor: '#1877f2' }}
                                    >
                                        {socialLoading === 'facebook' ? (
                                            <span className="register-loading-spinner spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        ) : (
                                            <i className="register-social-icon bi bi-facebook me-2"></i>
                                        )}
                                        <span className="register-social-text">
                                            {socialLoading === 'facebook' ? t('connecting') : t('continue_with_facebook')}
                                        </span>
                                    </button>
                                </div>

                                <div className="register-divider d-flex align-items-center mb-4">
                                    <hr className="register-divider-line flex-grow-1" />
                                    <span className="register-divider-text px-3 text-muted small">{t('or')}</span>
                                    <hr className="register-divider-line flex-grow-1" />
                                </div>

                                <form className="register-form" onSubmit={handleSubmit(onSubmit)}>
                                    <div className="register-field mb-3">
                                        <label htmlFor="name" className="register-field-label form-label">{t('full_name')}</label>
                                        <input
                                            type="text"
                                            className={`register-field-input form-control ${errors.name ? 'register-field-input-error is-invalid' : ''}`}
                                            id="name"
                                            placeholder={t('enter_your_name')}
                                            {...registerForm('name', {
                                                required: t('name_required'),
                                                minLength: {
                                                    value: 2,
                                                    message: t('name_min_length')
                                                },
                                                maxLength: {
                                                    value: 255,
                                                    message: t('name_max_length')
                                                }
                                            })}
                                        />
                                        {errors.name && <div className="register-field-error invalid-feedback">{errors.name.message}</div>}
                                    </div>

                                    <div className="register-field mb-3">
                                        <label htmlFor="email" className="register-field-label form-label">{t('email')}</label>
                                        <input
                                            type="email"
                                            className={`register-field-input form-control ${errors.email ? 'register-field-input-error is-invalid' : ''}`}
                                            id="email"
                                            placeholder={t('email_example')}
                                            {...registerForm('email', {
                                                required: t('email_required'),
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: t('email_invalid')
                                                }
                                            })}
                                        />
                                        {errors.email && <div className="register-field-error invalid-feedback">{errors.email.message}</div>}
                                        {!errors.email && (
                                            <div className="register-field-help form-text">
                                                <i className="bi bi-info-circle me-1"></i>
                                                {t('email_usage_info')}
                                            </div>
                                        )}
                                    </div>

                                    <div className="register-field mb-3">
                                        <label htmlFor="phone" className="register-field-label form-label">{t('phone')} <span className="text-muted">({t('optional')})</span></label>
                                        <input
                                            type="tel"
                                            className={`register-field-input form-control ${errors.phone ? 'register-field-input-error is-invalid' : ''}`}
                                            id="phone"
                                            placeholder={t('phone_example')}
                                            {...registerForm('phone', {
                                                pattern: {
                                                    value: /^[\+]?[0-9\s\-\(\)]+$/,
                                                    message: t('phone_invalid')
                                                }
                                            })}
                                        />
                                        {errors.phone && <div className="register-field-error invalid-feedback">{errors.phone.message}</div>}
                                    </div>

                                    <div className="register-field mb-3">
                                        <label htmlFor="password" className="register-field-label form-label">{t('password')}</label>
                                        <input
                                            type="password"
                                            className={`register-field-input form-control ${errors.password ? 'register-field-input-error is-invalid' : ''}`}
                                            id="password"
                                            placeholder={t('create_secure_password')}
                                            {...registerForm('password', {
                                                required: t('password_required'),
                                                minLength: {
                                                    value: 8,
                                                    message: t('password_min_length')
                                                },
                                                pattern: {
                                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                                                    message: t('password_pattern')
                                                }
                                            })}
                                        />
                                        {errors.password && <div className="register-field-error invalid-feedback">{errors.password.message}</div>}
                                        <div className="register-field-help form-text">
                                            <i className="bi bi-shield-check me-1"></i>
                                            {errors.password ? (
                                                <span className="text-danger">{t('password_help_error')}</span>
                                            ) : (
                                                <span className="text-muted">{t('password_help')}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="register-field mb-4">
                                        <label htmlFor="password_confirmation" className="register-field-label form-label">{t('confirm_password')}</label>
                                        <input
                                            type="password"
                                            className={`register-field-input form-control ${errors.password_confirmation ? 'register-field-input-error is-invalid' : ''}`}
                                            id="password_confirmation"
                                            placeholder={t('repeat_password')}
                                            {...registerForm('password_confirmation', {
                                                required: t('confirm_password_required'),
                                                validate: value => value === password || t('passwords_do_not_match')
                                            })}
                                        />
                                        {errors.password_confirmation && <div className="register-field-error invalid-feedback">{errors.password_confirmation.message}</div>}
                                    </div>

                                    <button
                                        type="submit"
                                        className={`register-button btn btn-primary w-100 py-3 fw-medium ${isLoading ? 'register-button-loading' : ''}`}
                                        disabled={isLoading || socialLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="register-loading-spinner spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                {t('registering')}
                                            </>
                                        ) : (
                                            t('create_account')
                                        )}
                                    </button>
                                </form>

                                <div className="register-footer text-center mt-4">
                                    <p className="register-footer-text text-muted mb-0">
                                        {t('already_have_account')} {' '}
                                        <Link to="/login" className="register-login-link text-primary text-decoration-none fw-medium">
                                            {t('login_here')}
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;