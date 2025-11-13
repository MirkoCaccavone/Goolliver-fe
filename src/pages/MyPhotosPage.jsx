import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { photoAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const MyPhotosPage = () => {
    const { user } = useAuthStore();
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedContest, setSelectedContest] = useState('all');

    // Query per ottenere le foto dell'utente
    const {
        data: photosData,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['user-photos', selectedStatus, selectedContest],
        queryFn: () => {
            const params = {};
            if (selectedStatus !== 'all') params.status = selectedStatus;
            if (selectedContest !== 'all') params.contest_id = selectedContest;
            return photoAPI.getUserPhotos(params);
        },
        enabled: !!user
    });

    // Query per ottenere i crediti dell'utente
    const { data: creditsData } = useQuery({
        queryKey: ['userCredits'],
        queryFn: photoAPI.getUserCredits,
        enabled: !!user
    });

    const photos = photosData?.data?.entries || [];
    const credits = creditsData?.data?.credits || 0;



    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-warning text-dark',
            pending_review: 'bg-warning text-dark',
            approved: 'bg-success',
            rejected: 'bg-danger',
            published: 'bg-primary'
        };
        const labels = {
            pending: 'In Moderazione',
            pending_review: 'In Moderazione',
            approved: 'Approvato',
            rejected: 'Rifiutato',
            published: 'Pubblicato'
        };

        return (
            <span className={`badge ${badges[status] || 'bg-secondary'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="container my-5">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Caricamento...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container my-5">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="h2 mb-0">Le mie Foto</h1>
                        <div className="d-flex align-items-center gap-3">
                            <div className="badge bg-primary fs-6">
                                <i className="bi bi-coin me-2"></i>
                                {credits} crediti
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtri */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label htmlFor="statusFilter" className="form-label">
                                        <i className="bi bi-funnel me-2"></i>
                                        Filtra per stato
                                    </label>
                                    <select
                                        id="statusFilter"
                                        className="form-select"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                    >
                                        <option value="all">Tutti gli stati</option>
                                        <option value="pending">In Moderazione</option>
                                        <option value="approved">Approvato</option>
                                        <option value="rejected">Rifiutato</option>
                                        <option value="published">Pubblicato</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="contestFilter" className="form-label">
                                        <i className="bi bi-trophy me-2"></i>
                                        Filtra per contest
                                    </label>
                                    <select
                                        id="contestFilter"
                                        className="form-select"
                                        value={selectedContest}
                                        onChange={(e) => setSelectedContest(e.target.value)}
                                    >
                                        <option value="all">Tutti i contest</option>
                                        {/* Qui potresti aggiungere una lista dinamica dei contest */}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Foto Grid */}
            {photos.length > 0 ? (
                <div className="row g-4">
                    {photos.map((photo) => (
                        <div key={photo.id} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm">
                                {/* Immagine */}
                                <div className="position-relative">
                                    <img
                                        src={photo.photo_url || '/placeholder-image.jpg'}
                                        alt={photo.title}
                                        className="card-img-top"
                                        style={{ height: '200px', objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300x200?text=Foto+Non+Disponibile';
                                        }}
                                    />
                                    <div className="position-absolute top-0 end-0 m-2">
                                        {getStatusBadge(photo.moderation_status)}
                                    </div>
                                </div>

                                <div className="card-body">
                                    <h5 className="card-title">{photo.title}</h5>
                                    {photo.description && (
                                        <p className="card-text text-muted small">
                                            {photo.description}
                                        </p>
                                    )}

                                    <div className="mb-3">
                                        <small className="text-muted">
                                            <i className="bi bi-trophy me-1"></i>
                                            Contest: {photo.contest?.title || 'N/A'}
                                        </small>
                                        <br />
                                        <small className="text-muted">
                                            <i className="bi bi-calendar me-1"></i>
                                            {formatDate(photo.created_at)}
                                        </small>
                                    </div>

                                    {photo.moderation_status === 'rejected' && photo.rejection_reason && (
                                        <div className="alert alert-danger py-2">
                                            <small>
                                                <strong>Motivo rifiuto:</strong> {photo.rejection_reason}
                                            </small>
                                        </div>
                                    )}
                                </div>

                                {/* Footer con azioni */}
                                <div className="card-footer bg-transparent">
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-sm btn-outline-primary flex-fill"
                                            onClick={() => window.open(photo.photo_url, '_blank')}
                                        >
                                            <i className="bi bi-eye me-1"></i>
                                            Visualizza
                                        </button>
                                        {photo.moderation_status === 'rejected' && (
                                            <button
                                                className="btn btn-sm btn-outline-success flex-fill"
                                                disabled={credits <= 0}
                                                title={credits <= 0 ? "Crediti insufficienti" : "Ricarica foto con crediti"}
                                            >
                                                <i className="bi bi-arrow-repeat me-1"></i>
                                                Riprova
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-5">
                    <div className="mb-4">
                        <i className="bi bi-camera display-1 text-muted"></i>
                    </div>
                    <h3 className="text-muted mb-3">Nessuna foto trovata</h3>
                    <p className="text-muted mb-4">
                        {selectedStatus !== 'all' || selectedContest !== 'all'
                            ? 'Prova a modificare i filtri per vedere più risultati.'
                            : 'Non hai ancora caricato nessuna foto. Partecipa a un contest per iniziare!'
                        }
                    </p>
                    <a href="/contests" className="btn btn-primary">
                        <i className="bi bi-plus-lg me-2"></i>
                        Partecipa a un Contest
                    </a>
                </div>
            )}

            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Errore nel caricamento delle foto: {error.message}
                </div>
            )}
        </div>
    );
};

export default MyPhotosPage;