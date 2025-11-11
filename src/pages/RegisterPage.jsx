import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import './RegisterPage.css';

const RegisterPage = () => {
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
                                    <h2 className="register-title h3 fw-bold text-dark">Crea il tuo account</h2>
                                    <p className="register-subtitle text-muted">Unisciti alla community di Goolliver</p>
                                </div>

                                {serverError && (
                                    <div className="register-error alert alert-danger">
                                        <i className="register-error-icon bi bi-exclamation-triangle me-2"></i>
                                        <span className="register-error-text">{serverError}</span>
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
                                            {socialLoading === 'google' ? 'Connessione...' : 'Continua con Google'}
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
                                            {socialLoading === 'facebook' ? 'Connessione...' : 'Continua con Facebook'}
                                        </span>
                                    </button>
                                </div>

                                <div className="register-divider d-flex align-items-center mb-4">
                                    <hr className="register-divider-line flex-grow-1" />
                                    <span className="register-divider-text px-3 text-muted small">oppure</span>
                                    <hr className="register-divider-line flex-grow-1" />
                                </div>

                                <form className="register-form" onSubmit={handleSubmit(onSubmit)}>
                                    <div className="register-field mb-3">
                                        <label htmlFor="name" className="register-field-label form-label">Nome completo</label>
                                        <input
                                            type="text"
                                            className={`register-field-input form-control ${errors.name ? 'register-field-input-error is-invalid' : ''}`}
                                            id="name"
                                            placeholder="Inserisci il tuo nome"
                                            {...registerForm('name', {
                                                required: 'Il nome è obbligatorio',
                                                minLength: {
                                                    value: 2,
                                                    message: 'Il nome deve avere almeno 2 caratteri'
                                                },
                                                maxLength: {
                                                    value: 255,
                                                    message: 'Il nome non può superare i 255 caratteri'
                                                }
                                            })}
                                        />
                                        {errors.name && <div className="register-field-error invalid-feedback">{errors.name.message}</div>}
                                    </div>

                                    <div className="register-field mb-3">
                                        <label htmlFor="email" className="register-field-label form-label">Email</label>
                                        <input
                                            type="email"
                                            className={`register-field-input form-control ${errors.email ? 'register-field-input-error is-invalid' : ''}`}
                                            id="email"
                                            placeholder="esempio@email.com"
                                            {...registerForm('email', {
                                                required: 'L\'email è obbligatoria',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: 'Inserisci un indirizzo email valido'
                                                }
                                            })}
                                        />
                                        {errors.email && <div className="register-field-error invalid-feedback">{errors.email.message}</div>}
                                        {!errors.email && (
                                            <div className="register-field-help form-text">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Useremo questa email per comunicazioni importanti
                                            </div>
                                        )}
                                    </div>

                                    <div className="register-field mb-3">
                                        <label htmlFor="phone" className="register-field-label form-label">Telefono <span className="text-muted">(opzionale)</span></label>
                                        <input
                                            type="tel"
                                            className={`register-field-input form-control ${errors.phone ? 'register-field-input-error is-invalid' : ''}`}
                                            id="phone"
                                            placeholder="+39 123 456 7890"
                                            {...registerForm('phone', {
                                                pattern: {
                                                    value: /^[\+]?[0-9\s\-\(\)]+$/,
                                                    message: 'Inserisci un numero di telefono valido'
                                                }
                                            })}
                                        />
                                        {errors.phone && <div className="register-field-error invalid-feedback">{errors.phone.message}</div>}
                                    </div>

                                    <div className="register-field mb-3">
                                        <label htmlFor="password" className="register-field-label form-label">Password</label>
                                        <input
                                            type="password"
                                            className={`register-field-input form-control ${errors.password ? 'register-field-input-error is-invalid' : ''}`}
                                            id="password"
                                            placeholder="Crea una password sicura"
                                            {...registerForm('password', {
                                                required: 'La password è obbligatoria',
                                                minLength: {
                                                    value: 8,
                                                    message: 'La password deve avere almeno 8 caratteri'
                                                },
                                                pattern: {
                                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                                                    message: 'La password deve contenere almeno: 1 maiuscola, 1 minuscola, 1 numero e 1 simbolo'
                                                }
                                            })}
                                        />
                                        {errors.password && <div className="register-field-error invalid-feedback">{errors.password.message}</div>}
                                        <div className="register-field-help form-text">
                                            <i className="bi bi-shield-check me-1"></i>
                                            {errors.password ? (
                                                <span className="text-danger">Deve contenere almeno 8 caratteri: maiuscole, minuscole, numeri e simboli</span>
                                            ) : (
                                                <span className="text-muted">Minimum 8 caratteri con maiuscole, minuscole, numeri e simboli</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="register-field mb-4">
                                        <label htmlFor="password_confirmation" className="register-field-label form-label">Conferma password</label>
                                        <input
                                            type="password"
                                            className={`register-field-input form-control ${errors.password_confirmation ? 'register-field-input-error is-invalid' : ''}`}
                                            id="password_confirmation"
                                            placeholder="Ripeti la password"
                                            {...registerForm('password_confirmation', {
                                                required: 'La conferma password è obbligatoria',
                                                validate: value => value === password || 'Le password non coincidono'
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
                                                Registrazione in corso...
                                            </>
                                        ) : (
                                            'Crea account'
                                        )}
                                    </button>
                                </form>

                                <div className="register-footer text-center mt-4">
                                    <p className="register-footer-text text-muted mb-0">
                                        Hai già un account?{' '}
                                        <Link to="/login" className="register-login-link text-primary text-decoration-none fw-medium">
                                            Accedi qui
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