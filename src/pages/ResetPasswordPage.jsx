import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';

const ResetPasswordPage = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { resetPassword } = useAuthStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const watchPassword = watch('password');

    // Estrai email e token dai parametri URL
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    useEffect(() => {
        if (!email || !token) {
            setError(t('resetPassword.invalidLink')); // translation key
        }
    }, [email, token, t]);

    const onSubmit = async (data) => {
        if (!email || !token) {
            setError(t('resetPassword.invalidLinkShort'));
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await resetPassword(email, token, data.password, data.password_confirmation);

            if (result.success) {
                setSuccess(result.message);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(result.error || t('resetPassword.resetError'));
            }
        } catch (err) {
            setError(t('resetPassword.connectionError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="reset-password-page min-vh-100 d-flex align-items-center py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow">
                            <div className="card-body p-5">
                                <div className="reset-password-header text-center mb-4">
                                    <div className="reset-password-logo logo-circle mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                                        <span>G</span>
                                    </div>
                                    <h2 className="reset-password-title h3 fw-bold text-dark">{t('resetPassword.title')}</h2>
                                    <p className="reset-password-subtitle text-muted">
                                        {t('resetPassword.subtitle', { email })}
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-3">
                                        <div className="reset-password-error alert alert-danger d-flex align-items-center" role="alert">
                                            <i className="reset-password-error-icon bi bi-exclamation-triangle-fill me-2"></i>
                                            <div className="reset-password-error-text">{error}</div>
                                        </div>
                                        {error.includes(t('resetPassword.invalidLinkShort')) && (
                                            <div className="text-center mt-3">
                                                <Link to="/forgot-password" className="btn btn-primary">
                                                    {t('resetPassword.requestNewReset')}
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {success && (
                                    <div className="mb-3">
                                        <div className="reset-password-success alert alert-success d-flex align-items-center" role="alert">
                                            <i className="reset-password-success-icon bi bi-check-circle-fill me-2"></i>
                                            <div className="reset-password-success-text">{success}</div>
                                        </div>
                                        <div className="alert alert-info text-center">
                                            <i className="bi bi-info-circle me-2"></i>
                                            {t('resetPassword.redirectLoginInfo')}
                                        </div>
                                    </div>
                                )}

                                {!success && email && token && (
                                    <form className="reset-password-form" onSubmit={handleSubmit(onSubmit)}>
                                        <div className="reset-password-field mb-3">
                                            <label htmlFor="password" className="reset-password-field-label form-label">{t('resetPassword.newPassword')}</label>
                                            <input
                                                {...register('password', {
                                                    required: t('resetPassword.passwordRequired'),
                                                    minLength: {
                                                        value: 8,
                                                        message: t('resetPassword.passwordMinLength')
                                                    }
                                                })}
                                                type="password"
                                                className={`reset-password-field-input form-control ${errors.password ? 'reset-password-field-input-error is-invalid' : ''}`}
                                                placeholder={t('resetPassword.newPasswordPlaceholder')}
                                                autoFocus
                                            />
                                            {errors.password && (
                                                <div className="reset-password-field-error invalid-feedback">{errors.password.message}</div>
                                            )}
                                        </div>

                                        <div className="reset-password-field mb-4">
                                            <label htmlFor="password_confirmation" className="reset-password-field-label form-label">{t('resetPassword.confirmPassword')}</label>
                                            <input
                                                {...register('password_confirmation', {
                                                    required: t('resetPassword.confirmPasswordRequired'),
                                                    validate: value =>
                                                        value === watchPassword || t('resetPassword.passwordsDontMatch')
                                                })}
                                                type="password"
                                                className={`reset-password-field-input form-control ${errors.password_confirmation ? 'reset-password-field-input-error is-invalid' : ''}`}
                                                placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                                            />
                                            {errors.password_confirmation && (
                                                <div className="reset-password-field-error invalid-feedback">{errors.password_confirmation.message}</div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={`reset-password-button btn btn-primary w-100 py-3 fw-medium mb-3 ${isLoading ? 'reset-password-button-loading' : ''}`}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="reset-password-loading-spinner spinner-border spinner-border-sm me-2" role="status">
                                                        <span className="visually-hidden">{t('resetPassword.loading')}</span>
                                                    </div>
                                                    {t('resetPassword.updating')}
                                                </>
                                            ) : (
                                                t('resetPassword.updatePassword')
                                            )}
                                        </button>
                                    </form>
                                )}

                                <div className="text-center">
                                    <Link to="/login" className="reset-password-back-link text-primary text-decoration-none">
                                        <i className="bi bi-arrow-left me-1"></i>
                                        {t('resetPassword.backToLogin')}
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

export default ResetPasswordPage;