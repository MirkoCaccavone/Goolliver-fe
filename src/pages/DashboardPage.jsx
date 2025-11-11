import React from 'react';
import { useAuthStore } from '../stores/authStore';

const DashboardPage = () => {
    const { user } = useAuthStore();

    return (
        <div className="min-vh-100 bg-light">
            <div className="container py-5">
                <div className="row">
                    <div className="col-12">
                        <div className="mb-5">
                            <h1 className="display-4 fw-bold text-dark">
                                Ciao, {user?.name}! 👋
                            </h1>
                            <p className="lead text-muted">
                                Benvenuto nella tua dashboard. Qui puoi gestire i tuoi contest e le tue foto.
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="row g-4 mb-5">
                            <div className="col-sm-6 col-lg-3">
                                <div className="card stats-card">
                                    <div className="card-body d-flex align-items-center">
                                        <div className="bg-primary bg-opacity-10 rounded p-3 me-3">
                                            <i className="bi bi-camera text-primary" style={{ fontSize: '1.5rem' }}></i>
                                        </div>
                                        <div>
                                            <h5 className="card-title h4 mb-0">12</h5>
                                            <p className="card-text text-muted small mb-0">Foto Caricate</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-sm-6 col-lg-3">
                                <div className="card stats-card">
                                    <div className="card-body d-flex align-items-center">
                                        <div className="bg-success bg-opacity-10 rounded p-3 me-3">
                                            <i className="bi bi-trophy text-success" style={{ fontSize: '1.5rem' }}></i>
                                        </div>
                                        <div>
                                            <h5 className="card-title h4 mb-0">8</h5>
                                            <p className="card-text text-muted small mb-0">Contest Vinti</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-sm-6 col-lg-3">
                                <div className="card stats-card">
                                    <div className="card-body d-flex align-items-center">
                                        <div className="bg-warning bg-opacity-10 rounded p-3 me-3">
                                            <i className="bi bi-star text-warning" style={{ fontSize: '1.5rem' }}></i>
                                        </div>
                                        <div>
                                            <h5 className="card-title h4 mb-0">156</h5>
                                            <p className="card-text text-muted small mb-0">Voti Ricevuti</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-sm-6 col-lg-3">
                                <div className="card stats-card">
                                    <div className="card-body d-flex align-items-center">
                                        <div className="bg-info bg-opacity-10 rounded p-3 me-3">
                                            <i className="bi bi-coin text-info" style={{ fontSize: '1.5rem' }}></i>
                                        </div>
                                        <div>
                                            <h5 className="card-title h4 mb-0">5</h5>
                                            <p className="card-text text-muted small mb-0">Crediti Disponibili</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Cards */}
                        <div className="row g-4 mb-5">
                            <div className="col-md-4">
                                <div className="card card-hover h-100">
                                    <div className="card-body text-center p-4">
                                        <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
                                            <i className="bi bi-plus-lg text-primary" style={{ fontSize: '2rem' }}></i>
                                        </div>
                                        <h5 className="card-title">Carica Nuova Foto</h5>
                                        <p className="card-text text-muted">
                                            Partecipa ai contest attivi caricando le tue migliori foto
                                        </p>
                                        <button className="btn btn-primary">
                                            Inizia Upload
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="card card-hover h-100">
                                    <div className="card-body text-center p-4">
                                        <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
                                            <i className="bi bi-grid-3x3 text-success" style={{ fontSize: '2rem' }}></i>
                                        </div>
                                        <h5 className="card-title">Esplora Contest</h5>
                                        <p className="card-text text-muted">
                                            Scopri i contest aperti e vota le foto che ti piacciono di più
                                        </p>
                                        <button className="btn btn-outline-success">
                                            Vedi Contest
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="card card-hover h-100">
                                    <div className="card-body text-center p-4">
                                        <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
                                            <i className="bi bi-person-circle text-info" style={{ fontSize: '2rem' }}></i>
                                        </div>
                                        <h5 className="card-title">Le Mie Foto</h5>
                                        <p className="card-text text-muted">
                                            Gestisci le tue foto caricate e monitora le performance
                                        </p>
                                        <button className="btn btn-outline-info">
                                            Vedi Galleria
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Attività Recente</h5>
                            </div>
                            <div className="card-body">
                                <div className="activity-item">
                                    <span className="activity-dot success"></span>
                                    <strong>La tua foto è stata approvata</strong> nel contest "Paesaggi d'Autunno"
                                    <small className="text-muted d-block">2 ore fa</small>
                                </div>

                                <div className="activity-item">
                                    <span className="activity-dot info"></span>
                                    <strong>Hai ricevuto 3 nuovi voti</strong> nella foto "Tramonto sul mare"
                                    <small className="text-muted d-block">5 ore fa</small>
                                </div>

                                <div className="activity-item">
                                    <span className="activity-dot warning"></span>
                                    <strong>Nuovo contest disponibile:</strong> "Ritratti Creativi"
                                    <small className="text-muted d-block">1 giorno fa</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;