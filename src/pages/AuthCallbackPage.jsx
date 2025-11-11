import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import './AuthCallbackPage.css';

const AuthCallbackPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(true);

    const setAuth = useAuthStore(state => state.setAuth);

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Controlla se c'è un errore
                if (searchParams.get('error') === 'true') {
                    const errorMessage = searchParams.get('message') || 'Errore durante l\'autenticazione';
                    setError(errorMessage);
                    setIsProcessing(false);
                    return;
                }

                // Controlla se l'autenticazione è riuscita
                if (searchParams.get('success') === 'true') {
                    const token = searchParams.get('token');
                    const userEncoded = searchParams.get('user');
                    const provider = searchParams.get('provider');

                    if (token && userEncoded) {
                        try {
                            // Decodifica i dati utente
                            const user = JSON.parse(atob(userEncoded));

                            // Imposta l'autenticazione nello store
                            setAuth(user, token);

                            // Redirect alla dashboard
                            setTimeout(() => {
                                navigate('/dashboard');
                            }, 2000);

                            setIsProcessing(false);
                            return;
                        } catch (decodeError) {
                            console.error('Errore decodifica dati:', decodeError);
                            setError('Errore durante la decodifica dei dati utente');
                        }
                    } else {
                        setError('Dati di autenticazione mancanti');
                    }
                }

                setError('Parametri di callback non validi');
                setIsProcessing(false);
            } catch (error) {
                console.error('Errore callback:', error);
                setError('Errore interno durante l\'autenticazione');
                setIsProcessing(false);
            }
        };

        processCallback();
    }, [searchParams, navigate, setAuth]);

    if (isProcessing) {
        return (
            <div className="auth-callback-page min-vh-100 d-flex align-items-center justify-content-center">
                <div className="auth-callback-container text-center">
                    <div className="auth-callback-loading">
                        <div className="auth-callback-spinner spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <h3 className="auth-callback-title h5 mb-2">Completamento accesso...</h3>
                        <p className="auth-callback-subtitle text-muted">
                            Stiamo finalizzando il tuo login, attendi un momento.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="auth-callback-page min-vh-100 d-flex align-items-center justify-content-center">
                <div className="auth-callback-container text-center">
                    <div className="auth-callback-error">
                        <div className="auth-callback-error-icon text-danger mb-3">
                            <i className="bi bi-exclamation-triangle" style={{ fontSize: '3rem' }}></i>
                        </div>
                        <h3 className="auth-callback-title h5 mb-2 text-danger">Errore di Autenticazione</h3>
                        <p className="auth-callback-error-message text-muted mb-4">{error}</p>
                        <div className="auth-callback-actions">
                            <button
                                className="auth-callback-retry-button btn btn-primary me-2"
                                onClick={() => navigate('/login')}
                            >
                                Torna al Login
                            </button>
                            <button
                                className="auth-callback-home-button btn btn-outline-secondary"
                                onClick={() => navigate('/')}
                            >
                                Homepage
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    return (
        <div className="auth-callback-page min-vh-100 d-flex align-items-center justify-content-center">
            <div className="auth-callback-container text-center">
                <div className="auth-callback-success">
                    <div className="auth-callback-success-icon text-success mb-3">
                        <i className="bi bi-check-circle" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h3 className="auth-callback-title h5 mb-2 text-success">Accesso Completato!</h3>
                    <p className="auth-callback-subtitle text-muted">
                        Verrai reindirizzato alla dashboard tra pochi secondi...
                    </p>
                    <div className="auth-callback-progress mt-3">
                        <div className="progress" style={{ height: '4px' }}>
                            <div className="progress-bar bg-success" style={{ width: '100%', animationDuration: '2s' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthCallbackPage;