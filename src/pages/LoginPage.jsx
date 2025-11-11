import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';

const LoginPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuthStore();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError('');

        try {
            const result = await login(data);

            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.error || 'Errore durante il login');
            }
        } catch (err) {
            setError('Errore di connessione. Riprova più tardi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow">
                            <div className="card-body p-5">
                                {/* Logo */}
                                <div className="text-center mb-4">
                                    <div className="logo-circle mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                                        <span>G</span>
                                    </div>
                                    <h2 className="h3 fw-bold text-dark">Accedi al tuo account</h2>
                                    <p className="text-muted">
                                        Non hai un account?{' '}
                                        <Link to="/register" className="text-primary text-decoration-none fw-medium">
                                            Registrati qui
                                        </Link>
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)}>
                                    {error && (
                                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                            <div>{error}</div>
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label">Email</label>
                                        <input
                                            {...register('email', {
                                                required: 'Email richiesta',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: 'Email non valida'
                                                }
                                            })}
                                            type="email"
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            placeholder="inserisci la tua email"
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback">{errors.email.message}</div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="password" className="form-label">Password</label>
                                        <input
                                            {...register('password', {
                                                required: 'Password richiesta',
                                                minLength: {
                                                    value: 6,
                                                    message: 'Password deve avere almeno 6 caratteri'
                                                }
                                            })}
                                            type="password"
                                            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                            placeholder="inserisci la tua password"
                                        />
                                        {errors.password && (
                                            <div className="invalid-feedback">{errors.password.message}</div>
                                        )}
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="remember"
                                            />
                                            <label className="form-check-label text-muted" htmlFor="remember">
                                                Ricordami
                                            </label>
                                        </div>
                                        <Link to="#" className="text-primary text-decoration-none small">
                                            Password dimenticata?
                                        </Link>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn btn-primary w-100 py-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Accesso in corso...
                                            </>
                                        ) : (
                                            'Accedi'
                                        )}
                                    </button>

                                    <div className="text-center my-4">
                                        <span className="text-muted small">Oppure continua con</span>
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => window.location.href = 'http://127.0.0.1:8000/api/auth/google/redirect'}
                                        >
                                            <i className="bi bi-google me-2"></i>
                                            Google
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => window.location.href = 'http://127.0.0.1:8000/api/auth/github/redirect'}
                                        >
                                            <i className="bi bi-github me-2"></i>
                                            GitHub
                                        </button>
                                    </div>
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