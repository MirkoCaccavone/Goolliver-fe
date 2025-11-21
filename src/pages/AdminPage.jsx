import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminCreateContestButton from '../components/AdminCreateContestButton';

const AdminPage = () => {
    const { t } = useTranslation();
    // Funzione placeholder per la creazione contest
    const handleCreateContest = () => {
        alert('Azione: crea contest (da implementare)');
        // Qui puoi aprire una modale o fare redirect
    };

    return (
        <div className="min-vh-100 bg-light">
            <div className="container py-5">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <i className="bi bi-gear display-1 text-muted mb-4"></i>
                                <h1 className="h2 fw-bold text-dark mb-3">{t('adminPage.title')}</h1>
                                <p className="text-muted mb-4">
                                    {t('adminPage.subtitle')}
                                </p>
                                {/* Bottone crea contest */}
                                <div className="mb-3">
                                    <AdminCreateContestButton onClick={handleCreateContest} />
                                </div>
                                <div className="alert alert-warning d-inline-block">
                                    {t('adminPage.comingSoon')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;