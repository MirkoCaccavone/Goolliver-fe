import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';

const HomePage = () => {
    const { isAuthenticated } = useAuthStore();
    const { t } = useTranslation();

    return (
        <div className="min-vh-100">
            {/* Hero Section */}
            <section className="hero-gradient py-5">
                <div className="container py-5">
                    <div className="row">
                        <div className="col-lg-8 mx-auto text-center">
                            <h1 className="display-3 fw-bold text-dark mb-4 hero-title">
                                {t('welcome')} <span className="text-primary-custom">Goolliver</span>
                            </h1>
                            <p className="lead text-secondary mb-5">
                                {t('homepage_subtitle')}
                            </p>

                            <div className="d-flex gap-3 justify-content-center flex-wrap">
                                {isAuthenticated ? (
                                    <Link
                                        to="/dashboard"
                                        className="btn btn-primary btn-lg px-4"
                                    >
                                        {t('go_to_dashboard')}
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            to="/register"
                                            className="btn btn-primary btn-lg px-4"
                                        >
                                            {t('get_started')}
                                        </Link>
                                        <Link
                                            to="/login"
                                            className="btn btn-outline-secondary btn-lg px-4"
                                        >
                                            {t('login')}
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-5">
                <div className="container py-4">
                    <div className="row">
                        <div className="col-lg-8 mx-auto text-center mb-5">
                            <h2 className="display-5 fw-bold text-dark">{t('how_it_works')}</h2>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="text-center h-100">
                                <div className="bg-primary-custom bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
                                    <i className="bi bi-camera text-primary-custom" style={{ fontSize: '2rem' }}></i>
                                </div>
                                <h3 className="h4 fw-semibold text-dark mb-3">
                                    {t('upload_photos')}
                                </h3>
                                <p className="text-secondary">
                                    {t('upload_photos_desc')}
                                </p>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="text-center h-100">
                                <div className="bg-primary-custom bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
                                    <i className="bi bi-heart-fill text-primary-custom" style={{ fontSize: '2rem' }}></i>
                                </div>
                                <h3 className="h4 fw-semibold text-dark mb-3">
                                    {t('vote_and_participate')}
                                </h3>
                                <p className="text-secondary">
                                    {t('vote_and_participate_desc')}
                                </p>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="text-center h-100">
                                <div className="bg-primary-custom bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
                                    <i className="bi bi-trophy-fill text-primary-custom" style={{ fontSize: '2rem' }}></i>
                                </div>
                                <h3 className="h4 fw-semibold text-dark mb-3">
                                    {t('win_prizes')}
                                </h3>
                                <p className="text-secondary">
                                    {t('win_prizes_desc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="bg-light py-5">
                <div className="container py-4">
                    <div className="row g-4 text-center">
                        <div className="col-6 col-md-3">
                            <div className="stats-card">
                                <div className="display-4 fw-bold text-primary-custom mb-2">1000+</div>
                                <div className="text-secondary">{t('photos_uploaded')}</div>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="stats-card">
                                <div className="display-4 fw-bold text-primary-custom mb-2">50+</div>
                                <div className="text-secondary">{t('active_contests')}</div>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="stats-card">
                                <div className="display-4 fw-bold text-primary-custom mb-2">500+</div>
                                <div className="text-secondary">{t('active_users')}</div>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="stats-card">
                                <div className="display-4 fw-bold text-primary-custom mb-2">10k+</div>
                                <div className="text-secondary">{t('votes_cast')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;