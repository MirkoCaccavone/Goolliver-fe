import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';

const ForgotPasswordPage = () => {
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
                setError(result.error || 'Errore durante la richiesta di reset');
            }
        } catch (err) {
            setError('Errore di connessione. Riprova più tardi.');
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
                                    <h2 className="forgot-password-title h3 fw-bold text-dark">Password dimenticata?</h2>
                                    <p className="forgot-password-subtitle text-muted">
                                        Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password.
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
                                                <strong>Link di test (solo sviluppo):</strong><br />
                                                <a href={testResetUrl} className="btn btn-sm btn-outline-primary mt-2">
                                                    Vai al reset password
                                                </a>
                                            </div>
                                        )}
                                        <div className="text-center mt-3">
                                            <Link to="/login" className="btn btn-primary">
                                                Torna al login
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {!success && (
                                    <form className="forgot-password-form" onSubmit={handleSubmit(onSubmit)}>
                                        <div className="forgot-password-field mb-3">
                                            <label htmlFor="email" className="forgot-password-field-label form-label">Email</label>
                                            <input
                                                {...register('email', {
                                                    required: 'Email richiesta',
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: 'Email non valida'
                                                    }
                                                })}
                                                type="email"
                                                className={`forgot-password-field-input form-control ${errors.email ? 'forgot-password-field-input-error is-invalid' : ''}`}
                                                placeholder="inserisci la tua email"
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
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    Invio in corso...
                                                </>
                                            ) : (
                                                'Invia email di reset'
                                            )}
                                        </button>
                                    </form>
                                )}

                                <div className="text-center">
                                    <Link to="/login" className="forgot-password-back-link text-primary text-decoration-none">
                                        <i className="bi bi-arrow-left me-1"></i>
                                        Torna al login
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