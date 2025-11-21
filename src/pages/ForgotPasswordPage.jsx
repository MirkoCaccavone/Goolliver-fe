import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';

const ForgotPasswordPage = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [testResetUrl, setTestResetUrl] = useState('');
    const { forgotPassword } = useAuthStore();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await forgotPassword(data.email);

            if (result.success) {
                setSuccess(result.message);
                if (result.testResetUrl) {
                    setTestResetUrl(result.testResetUrl);
                }
            } else {
                setError(result.error || t('forgotPassword.errorRequest'));
            }
        } catch (err) {
            setError(t('forgotPassword.connectionError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="forgot-password-page min-vh-100 d-flex align-items-center py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow">
                            <div className="card-body p-5">
                                <div className="forgot-password-header text-center mb-4">
                                    <div className="forgot-password-logo logo-circle mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                                        <span>G</span>
                                    </div>
                                    <h2 className="forgot-password-title h3 fw-bold text-dark">{t('forgotPassword.title')}</h2>
                                    <p className="forgot-password-subtitle text-muted">
                                        {t('forgotPassword.subtitle')}
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-3">
                                        <div className="forgot-password-error alert alert-danger d-flex align-items-center" role="alert">
                                            <i className="forgot-password-error-icon bi bi-exclamation-triangle-fill me-2"></i>
                                            <div className="forgot-password-error-text">{error}</div>
                                        </div>
                                    </div>
                                )}

                                {success && (
                                    <div className="mb-3">
                                        <div className="forgot-password-success alert alert-success d-flex align-items-center" role="alert">
                                            <i className="forgot-password-success-icon bi bi-check-circle-fill me-2"></i>
                                            <div className="forgot-password-success-text">{success}</div>
                                        </div>
                                        {testResetUrl && (
                                            <div className="alert alert-info">
                                                <i className="bi bi-gear me-2"></i>
                                                <strong>{t('forgotPassword.testLinkTitle')}</strong><br />
                                                <a href={testResetUrl} className="btn btn-sm btn-outline-primary mt-2">
                                                    {t('forgotPassword.goToReset')}
                                                </a>
                                            </div>
                                        )}
                                        <div className="text-center mt-3">
                                            <Link to="/login" className="btn btn-primary">
                                                {t('forgotPassword.backToLogin')}
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {!success && (
                                    <form className="forgot-password-form" onSubmit={handleSubmit(onSubmit)}>
                                        <div className="forgot-password-field mb-3">
                                            <label htmlFor="email" className="forgot-password-field-label form-label">{t('forgotPassword.email')}</label>
                                            <input
                                                {...register('email', {
                                                    required: t('forgotPassword.emailRequired'),
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: t('forgotPassword.emailInvalid')
                                                    }
                                                })}
                                                type="email"
                                                className={`forgot-password-field-input form-control ${errors.email ? 'forgot-password-field-input-error is-invalid' : ''}`}
                                                placeholder={t('forgotPassword.emailPlaceholder')}
                                                autoFocus
                                            />
                                            {errors.email && (
                                                <div className="forgot-password-field-error invalid-feedback">{errors.email.message}</div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={`forgot-password-button btn btn-primary w-100 py-3 fw-medium mb-3 ${isLoading ? 'forgot-password-button-loading' : ''}`}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="forgot-password-loading-spinner spinner-border spinner-border-sm me-2" role="status">
                                                        <span className="visually-hidden">{t('forgotPassword.loading')}</span>
                                                    </div>
                                                    {t('forgotPassword.sending')}
                                                </>
                                            ) : (
                                                t('forgotPassword.sendResetEmail')
                                            )}
                                        </button>
                                    </form>
                                )}

                                <div className="text-center">
                                    <Link to="/login" className="forgot-password-back-link text-primary text-decoration-none">
                                        <i className="bi bi-arrow-left me-1"></i>
                                        {t('forgotPassword.backToLogin')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;