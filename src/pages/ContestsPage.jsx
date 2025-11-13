import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contestAPI, photoAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import ContestCard from '../components/ContestCard/ContestCard';
import './ContestsPage/ContestsPage.css';

const ContestsPage = () => {
    const [activeFilter, setActiveFilter] = useState('all');
    const { isAuthenticated } = useAuthStore();

    // Query per ottenere i contest
    const {
        data: contests,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['contests'],
        queryFn: () => contestAPI.getAll(),
        select: (response) => response.data || [],
        staleTime: 5 * 60 * 1000, // 5 minuti
    });

    // Query per ottenere le partecipazioni dell'utente
    const { data: userParticipations } = useQuery({
        queryKey: ['user-photos'],
        queryFn: () => photoAPI.getUserPhotos(),
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000, // 2 minuti
        select: (response) => response.data?.entries || []
    });

    // Filtra i contest in base al filtro attivo
    const filteredContests = contests?.filter(contest => {
        if (activeFilter === 'all') return true;

        const now = new Date();
        const startDate = new Date(contest.start_date);
        const endDate = new Date(contest.end_date);

        switch (activeFilter) {
            case 'active':
                return now >= startDate && now <= endDate;
            case 'upcoming':
                return now < startDate;
            case 'ended':
                return now > endDate;
            default:
                return true;
        }
    }) || [];

    // Funzione per trovare la partecipazione dell'utente per un contest
    const getUserParticipationForContest = (contestId) => {
        if (!userParticipations || !isAuthenticated) return null;
        return userParticipations.find(entry => entry.contest_id === contestId) || null;
    };

    // Opzioni di filtro
    const filterOptions = [
        { key: 'all', label: 'Tutti i Contest', icon: 'bi-grid' },
        { key: 'active', label: 'Attivi', icon: 'bi-play-circle' },
        { key: 'upcoming', label: 'Prossimi', icon: 'bi-clock' },
        { key: 'ended', label: 'Terminati', icon: 'bi-check-circle' }
    ];

    if (error) {
        return (
            <div className="contests-page-wrapper">
                <div className="contests-page-container">
                    <div className="contests-page-header">
                        <h1 className="contests-page-title">Contest Fotografici</h1>
                        <p className="contests-page-subtitle">
                            Partecipa ai nostri contest e vinci fantastici premi
                        </p>
                    </div>

                    <div className="contest-error-container">
                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            <div>
                                <strong>Errore nel caricamento dei contest</strong><br />
                                <small>{error.message}</small>
                            </div>
                            <button
                                className="btn btn-outline-danger ms-auto"
                                onClick={() => refetch()}
                            >
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Riprova
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="contests-page-wrapper">
            <div className="contests-page-container">
                {/* Header */}
                <div className="contests-page-header">
                    <h1 className="contests-page-title">Contest Fotografici</h1>
                    <p className="contests-page-subtitle">
                        Partecipa ai nostri contest, carica le tue foto migliori e vinci fantastici premi.
                        Ogni foto viene moderata per garantire la qualità della competizione.
                    </p>
                </div>

                {/* Filtri */}
                <div className="contests-page-filters">
                    {filterOptions.map(option => (
                        <button
                            key={option.key}
                            className={`contests-filter-button ${activeFilter === option.key ? 'active' : ''}`}
                            onClick={() => setActiveFilter(option.key)}
                        >
                            <i className={`${option.icon} me-1`}></i>
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="contests-page-loading">
                        <div className="contests-loading-spinner"></div>
                    </div>
                )}

                {/* Contest Grid */}
                {!isLoading && filteredContests.length > 0 && (
                    <div className="contests-page-grid">
                        {filteredContests.map(contest => (
                            <ContestCard
                                key={contest.id}
                                contest={contest}
                                userParticipation={getUserParticipationForContest(contest.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredContests.length === 0 && (
                    <div className="contests-page-empty">
                        <div className="contests-empty-icon">
                            <i className="bi bi-camera"></i>
                        </div>
                        <h3 className="contests-empty-title">
                            {activeFilter === 'all'
                                ? 'Nessun contest disponibile'
                                : `Nessun contest ${activeFilter === 'active' ? 'attivo' : activeFilter === 'upcoming' ? 'in arrivo' : 'terminato'}`
                            }
                        </h3>
                        <p className="contests-empty-text">
                            {activeFilter === 'all'
                                ? 'I contest fotografici saranno disponibili presto. Torna a trovarci!'
                                : 'Prova a cambiare il filtro per vedere altri contest.'
                            }
                        </p>
                        {activeFilter !== 'all' && (
                            <button
                                className="btn btn-primary mt-3"
                                onClick={() => setActiveFilter('all')}
                            >
                                Vedi tutti i contest
                            </button>
                        )}
                    </div>
                )}

                {/* Stats Footer */}
                {!isLoading && contests?.length > 0 && (
                    <div className="contests-page-stats mt-4 text-center">
                        <div className="row">
                            <div className="col-md-3">
                                <div className="stat-item">
                                    <div className="stat-number">{contests.length}</div>
                                    <div className="stat-label">Contest Totali</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="stat-item">
                                    <div className="stat-number">
                                        {contests.filter(c => {
                                            const now = new Date();
                                            const start = new Date(c.start_date);
                                            const end = new Date(c.end_date);
                                            return now >= start && now <= end;
                                        }).length}
                                    </div>
                                    <div className="stat-label">Contest Attivi</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="stat-item">
                                    <div className="stat-number">
                                        {contests.reduce((total, contest) => total + (contest.current_participants || 0), 0)}
                                    </div>
                                    <div className="stat-label">Partecipanti Totali</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="stat-item">
                                    <div className="stat-number">
                                        {contests.filter(c => c.prize).length}
                                    </div>
                                    <div className="stat-label">Con Premio</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContestsPage;