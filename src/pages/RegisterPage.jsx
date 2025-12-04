import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { FaGoogle, FaFacebookF, FaExclamationCircle, FaInfoCircle, FaLock, FaEnvelope, FaUser, FaPhone } from "react-icons/fa";
import '../style/pagesStyle/RegisterPage.css';

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
            navigate('/');
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
        <div className="register-layout">

            {/* Lato sinistro – Branding */}
            <div className="register-left">
                <div className='register-left-info'>
                    <h1 className="register-big-title">Unisciti a Goolly</h1>
                    <p className="register-big-subtitle">
                        Partecipa ai contest, vota e vinci premi. Entra nella community dei creator.
                    </p>
                </div>

                <div className="register-illustration"></div>
            </div>

            {/* Lato destro con form */}
            <div className="register-right">
                <div className="register-page">
                    <div className="register-header">

                        {/* titolo e sottotitolo */}
                        <h2 className="register-title">{t('create_account')}</h2>
                        <p className="register-subtitle">{t('join_community')}</p>
                    </div>

                    {serverError && (
                        <div className="register-error">
                            <FaExclamationCircle className="register-error-icon" />
                            <span className="register-error-text">{t(serverError)}</span>
                        </div>
                    )}

                    {/* registrazione tramite social */}
                    <div className="register-social-container">

                        {/* google button */}
                        <button
                            type="button"
                            className="register-social-button register-google-button"
                            onClick={() => handleSocialLogin('google')}
                            disabled={socialLoading === 'google' || isLoading}
                        >
                            {socialLoading === 'google' ? (
                                <span className="register-loading-spinner" role="status" aria-hidden="true"></span>
                            ) : (
                                <FaGoogle className="register-social-icon" />
                            )}
                            <span className="register-social-text">
                                {socialLoading === 'google' ? t('connecting') : t('continue_with_google')}
                            </span>
                        </button>

                        {/* facebook button */}
                        <button
                            type="button"
                            className="register-social-button register-facebook-button"
                            onClick={() => handleSocialLogin('facebook')}
                            disabled={socialLoading === 'facebook' || isLoading}
                        >
                            {socialLoading === 'facebook' ? (
                                <span className="register-loading-spinner" role="status" aria-hidden="true"></span>
                            ) : (
                                <FaFacebookF className="register-social-icon" />
                            )}
                            <span className="register-social-text">
                                {socialLoading === 'facebook' ? t('connecting') : t('continue_with_facebook')}
                            </span>
                        </button>
                    </div>

                    {/* divider line */}
                    <div className="register-divider">
                        <hr className="register-divider-line" />
                        <span className="register-divider-text">{t('login.or')}</span>
                        <hr className="register-divider-line" />
                    </div>

                    {/* form di registrazione */}
                    <form className="register-form" onSubmit={handleSubmit(onSubmit)}>

                        {/* name */}
                        <div className="register-field">
                            <label htmlFor="name" className="register-field-label form-label">
                                <FaUser className="register-field-icon" /> {t('full_name')}
                            </label>

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

                        {/* email */}
                        <div className="register-field">
                            <label htmlFor="email" className="register-field-label form-label">
                                <FaEnvelope className="register-field-icon" /> {t('email')}
                            </label>
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
                            {/* {!errors.email && (
                                <div className="register-field-help form-text">
                                    <FaExclamationCircle className="register-error-icon" />
                                    {t('email_usage_info')}
                                </div>
                            )} */}
                        </div>

                        {/* phone */}
                        <div className="register-field">
                            <label htmlFor="phone" className="register-field-label form-label">
                                <FaPhone className="register-field-icon" /> {t('phone')}
                                <span className="text-muted"> ({t('optional')})</span></label>
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

                        {/* password */}
                        <div className="register-field">
                            <label htmlFor="password" className="register-field-label form-label">
                                <FaLock className="register-field-icon" /> {t('password')}
                            </label>
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
                                <FaExclamationCircle className="register-error-icon" />
                                {errors.password ? (
                                    <span className="text-danger">{t('password_help_error')}</span>
                                ) : (
                                    <span className="text-muted">{t('password_help')}</span>
                                )}
                            </div>
                        </div>

                        {/* confirm password */}
                        <div className="register-field">
                            <label htmlFor="password_confirmation" className="register-field-label form-label">
                                <FaLock className="register-field-icon" /> {t('confirm_password')}
                            </label>
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

                        {/* create button */}
                        <button
                            type="submit"
                            className={`register-button ${isLoading ? 'register-button-loading' : ''}`}
                            disabled={isLoading || socialLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="register-loading-spinner" role="status" aria-hidden="true"></span>
                                    {t('registering')}
                                </>
                            ) : (
                                t('create_account')
                            )}
                        </button>
                    </form>

                    {/* login link */}
                    <div className="register-footer">
                        <p className="register-footer-text">
                            {t('already_have_account')} {' '}
                            <Link to="/login" className="register-login-link">
                                {t('login_here')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

        </div>

    );
};

export default RegisterPage;