import React from 'react';
import { Link } from 'react-router-dom';
import './ContestCard.css';

const ContestCard = ({ contest }) => {
    // Determina lo status del contest
    const getContestStatus = () => {
        const now = new Date();
        const startDate = new Date(contest.start_date);
        const endDate = new Date(contest.end_date);

        if (now < startDate) return 'upcoming';
        if (now > endDate) return 'ended';
        return 'active';
    };

    // Formatta le date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Calcola i giorni rimanenti
    const getDaysRemaining = () => {
        const now = new Date();
        const endDate = new Date(contest.end_date);
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 0;
        return diffDays;
    };

    const status = getContestStatus();
    const daysRemaining = getDaysRemaining();
    const canParticipate = status === 'active' && contest.current_participants < contest.max_participants;

    // Determina l'icona basata sul tipo di contest
    const getContestIcon = () => {
        switch (contest.category?.toLowerCase()) {
            case 'natura': return 'bi-tree';
            case 'ritratti': return 'bi-person';
            case 'paesaggi': return 'bi-mountain';
            case 'street': return 'bi-building';
            case 'macro': return 'bi-zoom-in';
            default: return 'bi-camera';
        }
    };

    return (
        <div className="contest-card-container">
            {/* Status Badge */}
            <div className={`contest-card-status-badge contest-status-${status}`}>
                {status === 'active' && 'Attivo'}
                {status === 'upcoming' && 'Prossimo'}
                {status === 'ended' && 'Terminato'}
            </div>

            {/* Header con icona */}
            <div className="contest-card-header">
                <i className={`${getContestIcon()} contest-card-icon`}></i>
            </div>

            {/* Body del card */}
            <div className="contest-card-body">
                {/* Titolo e descrizione */}
                <h3 className="contest-card-title">{contest.title}</h3>
                <p className="contest-card-description">{contest.description}</p>

                {/* Statistiche */}
                <div className="contest-card-stats">
                    <div className="contest-stat-item">
                        <span className="contest-stat-value">{contest.current_participants || 0}</span>
                        <span className="contest-stat-label">Partecipanti</span>
                    </div>
                    <div className="contest-stat-item">
                        <span className="contest-stat-value">{contest.max_participants}</span>
                        <span className="contest-stat-label">Max</span>
                    </div>
                    <div className="contest-stat-item">
                        <span className="contest-stat-value">{daysRemaining}</span>
                        <span className="contest-stat-label">Giorni</span>
                    </div>
                </div>

                {/* Meta informazioni */}
                <div className="contest-card-meta">
                    <div className="contest-meta-item">
                        <i className="bi bi-calendar-event contest-meta-icon"></i>
                        <span>Inizio: {formatDate(contest.start_date)}</span>
                    </div>
                    <div className="contest-meta-item">
                        <i className="bi bi-calendar-x contest-meta-icon"></i>
                        <span>Fine: {formatDate(contest.end_date)}</span>
                    </div>
                </div>

                {/* Premio */}
                {contest.prize && (
                    <div className="contest-card-prize">
                        <div className="contest-prize-label">Premio</div>
                        <div className="contest-prize-amount">
                            <i className="bi bi-trophy-fill"></i>
                            {contest.prize}
                        </div>
                    </div>
                )}

                {/* Azioni */}
                <div className="contest-card-actions">
                    {canParticipate ? (
                        <>
                            <Link
                                to={`/contest/${contest.id}`}
                                className="contest-action-button contest-action-primary"
                            >
                                <i className="bi bi-upload"></i>
                                Partecipa
                            </Link>
                            <Link
                                to={`/contest/${contest.id}/gallery`}
                                className="contest-action-button contest-action-secondary"
                            >
                                <i className="bi bi-images"></i>
                                Galleria
                            </Link>
                        </>
                    ) : status === 'ended' ? (
                        <>
                            <Link
                                to={`/contest/${contest.id}/results`}
                                className="contest-action-button contest-action-primary"
                            >
                                <i className="bi bi-trophy"></i>
                                Risultati
                            </Link>
                            <Link
                                to={`/contest/${contest.id}/gallery`}
                                className="contest-action-button contest-action-secondary"
                            >
                                <i className="bi bi-images"></i>
                                Galleria
                            </Link>
                        </>
                    ) : status === 'upcoming' ? (
                        <button className="contest-action-button contest-action-disabled">
                            <i className="bi bi-clock"></i>
                            Prossimamente
                        </button>
                    ) : (
                        <button className="contest-action-button contest-action-disabled">
                            <i className="bi bi-x-circle"></i>
                            Completo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContestCard;