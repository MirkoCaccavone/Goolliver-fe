import React from 'react';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
    return (
        <div className="min-vh-100 d-flex align-items-center py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow">
                            <div className="card-body p-5 text-center">
                                <div className="logo-circle mx-auto mb-3" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                                    <span>G</span>
                                </div>
                                <h2 className="h3 fw-bold text-dark mb-4">Registrazione</h2>

                                <div className="alert alert-info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Pagina registrazione in sviluppo
                                </div>

                                <p className="text-muted">
                                    Hai già un account?{' '}
                                    <Link to="/login" className="text-primary text-decoration-none fw-medium">
                                        Accedi qui
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;