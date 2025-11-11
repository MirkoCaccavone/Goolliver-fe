import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import './LoginPage.css';

const LoginPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [socialLoading, setSocialLoading] = useState('');
    const { login, socialLogin } = useAuthStore();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm();



    const onSubmit = async (data) => {
        setIsLoading(true);
        setError(''); try {
            const result = await login(data);

            if (result && result.success) {
                navigate('/dashboard');
            } else {
                const errorMessage = result?.error || 'Errore durante il login';
                setError(errorMessage);
            }
        } catch (err) {
            setError('Errore di connessione. Riprova più tardi.');
        } finally {
            setIsLoading(false);
        }

        /* ORIGINALE COMMENTATO PER TEST
            try {
                const result = await login(data);
                console.log('📦 LoginPage: Risultato ricevuto da authStore:', result);
    
                if (result && result.success) {
                    console.log('✅ LoginPage: Login riuscito, navigating to dashboard');
                    // Temporaneamente disabilitato per debug
                    // navigate('/dashboard');
                } else {
                    const errorMessage = result?.error || 'Errore durante il login';
                    console.log('❌ LoginPage: Login fallito, mostrando errore:', errorMessage);
    
                    // Test diretto senza setTimeout
                    console.log('🎯 LoginPage: Impostando errore IMMEDIATAMENTE:', errorMessage);
                    setError(errorMessage);
                    console.log('🎯 LoginPage: Errore impostato, dovrebbe essere visibile ora');
                    
                    // BLOCCA TUTTO - non fare altro!
                    console.log('🛑 BLOCCANDO TUTTO - NON CONTINUARE');
                    return false;
                }
            } catch (err) {
                console.log('💥 LoginPage: Eccezione catturata:', err);
                setError('Errore di connessione. Riprova più tardi.');
                console.log('🛑 BLOCCANDO TUTTO DOPO ERRORE');
                return false;
            } finally {
                setIsLoading(false);
                console.log('🏁 LoginPage: Fine processo login');
            }
            */        // Previeni assolutamente qualsiasi reload
        return false;
    };

    const handleSocialLogin = async (provider) => {
        try {
            setError('');
            setSocialLoading(provider);
            await socialLogin(provider);
        } catch (error) {
            setError(`Errore durante l'accesso con ${provider}`);
        } finally {
            setSocialLoading('');
        }
    };

    return (
        <div className="login-page min-vh-100 d-flex align-items-center py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow">
                            <div className="card-body p-5">
                                <div className="login-header text-center mb-4">
                                    <div className="login-logo logo-circle mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                                        <span>G</span>
                                    </div>
                                    <h2 className="login-title h3 fw-bold text-dark">Accedi al tuo account</h2>
                                    <p className="login-subtitle text-muted">
                                        Non hai un account?{' '}
                                        <Link to="/register" className="login-register-link text-primary text-decoration-none fw-medium">
                                            Registrati qui
                                        </Link>
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-3">
                                        <div className="login-error alert alert-danger d-flex align-items-center" role="alert">
                                            <i className="login-error-icon bi bi-exclamation-triangle-fill me-2"></i>
                                            <div className="login-error-text">{error}</div>
                                        </div>
                                        {(error.includes('Email o password') || error.includes('Credenziali')) && (
                                            <div className="alert alert-info alert-sm">
                                                <i className="bi bi-lightbulb me-2"></i>
                                                <strong>Suggerimenti:</strong>
                                                <ul className="mb-0 mt-2">
                                                    <li>Verifica che l'email sia scritta correttamente</li>
                                                    <li>Controlla che il Caps Lock non sia attivo</li>
                                                    <li>Prova ad accedere con Google o Facebook</li>
                                                    <li>Se non ricordi la password, <Link to="/forgot-password" className="text-primary">richiedine una nuova</Link></li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="login-social-container mb-4">
                                    <button
                                        type="button"
                                        className="login-social-button login-google-button btn btn-outline-dark w-100 mb-3 py-3 d-flex align-items-center justify-content-center"
                                        onClick={() => handleSocialLogin('google')}
                                        disabled={socialLoading === 'google' || isLoading}
                                    >
                                        {socialLoading === 'google' ? (
                                            <span className="login-loading-spinner spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        ) : (
                                            <i className="login-social-icon bi bi-google me-2"></i>
                                        )}
                                        <span className="login-social-text">
                                            {socialLoading === 'google' ? 'Connessione...' : 'Continua con Google'}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        className="login-social-button login-facebook-button btn btn-primary w-100 mb-3 py-3 d-flex align-items-center justify-content-center"
                                        onClick={() => handleSocialLogin('facebook')}
                                        disabled={socialLoading === 'facebook' || isLoading}
                                        style={{ backgroundColor: '#1877f2', borderColor: '#1877f2' }}
                                    >
                                        {socialLoading === 'facebook' ? (
                                            <span className="login-loading-spinner spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        ) : (
                                            <i className="login-social-icon bi bi-facebook me-2"></i>
                                        )}
                                        <span className="login-social-text">
                                            {socialLoading === 'facebook' ? 'Connessione...' : 'Continua con Facebook'}
                                        </span>
                                    </button>
                                </div>

                                <div className="login-divider d-flex align-items-center mb-4">
                                    <hr className="login-divider-line flex-grow-1" />
                                    <span className="login-divider-text px-3 text-muted small">oppure</span>
                                    <hr className="login-divider-line flex-grow-1" />
                                </div>

                                <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
                                    <div className="login-field mb-3">
                                        <label htmlFor="email" className="login-field-label form-label">Email</label>
                                        <input
                                            {...register('email', {
                                                required: 'Email richiesta',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: 'Email non valida'
                                                }
                                            })}
                                            type="email"
                                            className={`login-field-input form-control ${errors.email ? 'login-field-input-error is-invalid' : ''}`}
                                            placeholder="inserisci la tua email"
                                        />
                                        {errors.email && (
                                            <div className="login-field-error invalid-feedback">{errors.email.message}</div>
                                        )}
                                    </div>

                                    <div className="login-field mb-4">
                                        <label htmlFor="password" className="login-field-label form-label">Password</label>
                                        <input
                                            {...register('password', {
                                                required: 'Password richiesta',
                                                minLength: {
                                                    value: 6,
                                                    message: 'Password deve avere almeno 6 caratteri'
                                                }
                                            })}
                                            type="password"
                                            className={`login-field-input form-control ${errors.password ? 'login-field-input-error is-invalid' : ''}`}
                                            placeholder="inserisci la tua password"
                                        />
                                        {errors.password && (
                                            <div className="login-field-error invalid-feedback">{errors.password.message}</div>
                                        )}
                                    </div>

                                    <div className="login-options d-flex justify-content-between align-items-center mb-4">
                                        <div className="form-check">
                                            <input
                                                className="login-remember-checkbox form-check-input"
                                                type="checkbox"
                                                id="remember"
                                            />
                                            <label className="login-remember-label form-check-label text-muted" htmlFor="remember">
                                                Ricordami
                                            </label>
                                        </div>
                                        <Link to="/forgot-password" className="login-forgot-password-link text-primary text-decoration-none small">
                                            Password dimenticata?
                                        </Link>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || socialLoading}
                                        className={`login-button btn btn-primary w-100 py-3 fw-medium ${isLoading ? 'login-button-loading' : ''}`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="login-loading-spinner spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Accesso in corso...
                                            </>
                                        ) : (
                                            'Accedi'
                                        )}
                                    </button>


                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;