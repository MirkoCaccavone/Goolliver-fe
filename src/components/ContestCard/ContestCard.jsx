import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    BiCalendar,     // calendario inizio
    BiCalendarX,         // calendario fine
    BiTrophy,            // trofeo premio
    BiTimeFive,    // clessidra
    BiHeart,             // cuore
    BiImage,            // galleria
    BiUpload,            // upload
    BiXCircle,           // cerchio X
    BiCheckCircle,   // check pieno
    BiInfoCircle,        // info
    BiCamera,
    BiLeaf,
    BiUser,
    BiLandscape,
    BiBuilding,
    BiZoomIn,
} from "react-icons/bi";
import '../../style/componentsStyle/ContestCard.css';

const ContestCard = ({ contest, userParticipation = null, variant, photos = [] }) => {
    // Usa direttamente lo status dal backend
    const status = contest.status;

    // Formatta le date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Calcola i giorni rimanenti (solo se end_date esiste)
    const getDaysRemaining = () => {
        if (!contest.end_date) return null;
        const now = new Date();
        const endDate = new Date(contest.end_date);
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 0;
        return diffDays;
    };

    const daysRemaining = getDaysRemaining();
    const canParticipate = status === 'active' && contest.current_participants < contest.max_participants;

    // Determina l'icona basata sul tipo di contest
    const getContestIcon = () => {
        switch (contest.category?.toLowerCase()) {
            case 'natura':
                return <BiLeaf className="contest-card-icon" />;
            case 'ritratti':
                return <BiUser className="contest-card-icon" />;
            case 'paesaggi':
                return <BiLandscape className="contest-card-icon" />;
            case 'street':
                return <BiBuilding className="contest-card-icon" />;
            case 'macro':
                return <BiZoomIn className="contest-card-icon" />;
            default:
                return <BiCamera className="contest-card-icon" />;
        }
    };

    // Stato per carosello background
    const [bgIndex, setBgIndex] = useState(0);
    const photosLenRef = useRef(photos.length);

    useEffect(() => {
        photosLenRef.current = photos.length;
    }, [photos.length]);

    useEffect(() => {
        if (variant === 'home' && Array.isArray(photos) && photos.length > 1) {
            const interval = setInterval(() => {
                setBgIndex(idx => {
                    const len = photosLenRef.current;
                    return len > 0 ? (idx + 1) % len : 0;
                });
            }, 3000);
            return () => clearInterval(interval);
        } else {
            setBgIndex(0);
        }
    }, [variant, photos.length]);

    // Calcola stile background dinamico
    const cardStyle = (variant === 'home' && photos.length > 0)
        ? {
            backgroundImage: `url('${photos[bgIndex]?.photo_url}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transition: 'background-image 0.7s cubic-bezier(0.4,0,0.2,1)'
        }
        : {};

    const cardClass = variant === 'home'
        ? `contest-card-home contest-card-bg-carousel${photos.length === 0 ? ' no-photos' : ''}`
        : 'contest-card-container';

    return (
        <div className={cardClass} style={cardStyle}>
            {/* Overlay per rendere leggibile il testo sopra il background */}
            {variant === 'home' && photos.length > 0 && (
                <div className="contest-card-bg-overlay" />
            )}
            {/* Status Badge */}
            <div className={`contest-card-status-badge contest-status-${status}`}>
                {status === 'active' && 'Attivo'}
                {status === 'upcoming' && 'Prossimo'}
                {status === 'ended' && 'Terminato'}
                {status === 'voting' && 'In votazione'}
            </div>

            {/* Header con icona */}
            {/* <div className="contest-card-header">
                {getContestIcon()}
            </div> */}

            {/* Body del card */}
            <div className="contest-card-body">
                {/* Titolo */}
                <h3 className="contest-card-title">{contest.title}</h3>

                {/* Indicatori carosello immagini (solo home) */}
                {variant === 'home' && Array.isArray(photos) && photos.length > 1 && (
                    <div className="contest-card-bg-indicators">
                        {photos.map((_, idx) => (
                            <span
                                key={idx}
                                className={idx === bgIndex ? 'active' : ''}
                            />
                        ))}
                    </div>
                )}


                {/* Descrizione */}
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
                    {/* <div className="contest-stat-item">
                        <span className="contest-stat-value">{daysRemaining}</span>
                        <span className="contest-stat-label">Giorni</span>
                    </div> */}
                </div>

                {/* Meta informazioni */}
                <div className="contest-card-meta">
                    <div className="contest-meta-item">
                        <BiCalendar className="contest-meta-icon" />
                        <span>Inizio: {formatDate(contest.start_date)}</span>
                    </div>
                    {/* <div className="contest-meta-item">
                        <BiCalendarX className="contest-meta-icon" />
                        <span>Fine: {formatDate(contest.end_date)}</span>
                    </div> */}
                </div>

                {/* Premio */}
                {contest.prize && (
                    <div className="contest-card-prize">
                        <div className="contest-prize-label">
                            <BiTrophy className="contest-prize-icon" />
                            Premio
                        </div>
                        <div className="contest-prize-amount">
                            {contest.prize}
                        </div>
                    </div>
                )}

                {/* Azioni */}
                <div className="contest-card-actions">
                    {userParticipation ? (
                        // Utente già partecipante
                        <>
                            {userParticipation.moderation_status === 'approved' && status === 'pending_voting' ? (
                                <div className="contest-action-button contest-action-pending-voting">
                                    <BiTimeFive />
                                    In attesa votazione
                                </div>
                            ) : userParticipation.moderation_status === 'approved' && status === 'voting' ? (
                                <>
                                    <Link
                                        to={`/contest/${contest.id}?tab=gallery`}
                                        className="contest-action-button contest-action-primary"
                                    >
                                        <BiHeart />
                                        Vota ora
                                    </Link>
                                    <Link
                                        to={`/contest/${contest.id}?tab=gallery`}
                                        className="contest-action-button contest-action-secondary"
                                    >
                                        <BiImage />
                                        Galleria
                                    </Link>
                                </>
                            ) : userParticipation.moderation_status === 'approved' ? (
                                <div className="contest-action-button contest-action-participating">
                                    <BiCheckCircle />
                                    Partecipando
                                </div>
                            ) : null}
                            {(userParticipation.moderation_status === 'pending' || userParticipation.moderation_status === 'pending_review') && (
                                <div className="contest-action-button contest-action-moderation">
                                    <BiTimeFive />
                                    In Moderazione
                                </div>
                            )}
                            {userParticipation.moderation_status === 'rejected' && (
                                <Link
                                    to={`/contest/${contest.id}?action=participate`}
                                    className="contest-action-button contest-action-rejected"
                                >
                                    <BiXCircle />
                                    Rifiutato - Partecipa di nuovo
                                </Link>
                            )}
                            {/* Mostra sempre Galleria se non già mostrato sopra */}
                            {!(userParticipation.moderation_status === 'approved' && status === 'voting') && (
                                <Link
                                    to={`/contest/${contest.id}?tab=gallery`}
                                    className="contest-action-button contest-action-secondary"
                                >
                                    <BiImage />
                                    Galleria
                                </Link>
                            )}
                        </>
                    ) : canParticipate ? (
                        // Può partecipare
                        <>
                            <Link
                                to={`/contest/${contest.id}?action=participate`}
                                className="contest-action-button contest-action-primary"
                            >
                                <BiUpload />
                                Partecipa
                            </Link>
                            <Link
                                to={`/contest/${contest.id}?tab=gallery`}
                                className="contest-action-button contest-action-secondary"
                            >
                                <BiImage />
                                Galleria
                            </Link>
                        </>
                    ) : status === 'ended' ? (
                        <>
                            <Link
                                to={`/contest/${contest.id}?tab=results`}
                                className="contest-action-button contest-action-primary"
                            >
                                <BiTrophy />
                                Risultati
                            </Link>
                            <Link
                                to={`/contest/${contest.id}?tab=gallery`}
                                className="contest-action-button contest-action-secondary"
                            >
                                <BiImage />
                                Galleria
                            </Link>
                        </>
                    ) : status === 'upcoming' ? (
                        <Link
                            to={`/contest/${contest.id}?tab=details`}
                            className="contest-action-button contest-action-secondary"
                        >
                            <BiInfoCircle />
                            Dettagli
                        </Link>
                    ) : status === 'voting' ? (
                        <>
                            <button className="contest-action-button contest-action-disabled">
                                <BiXCircle />
                                Completo
                            </button>
                            <Link
                                to={`/contest/${contest.id}?tab=gallery`}
                                className="contest-action-button contest-action-secondary"
                            >
                                <BiImage />
                                Galleria
                            </Link>
                        </>
                    ) : (
                        <>
                            <button className="contest-action-button contest-action-disabled">
                                <BiXCircle />
                                Completo
                            </button>
                            <Link
                                to={`/contest/${contest.id}?tab=gallery`}
                                className="contest-action-button contest-action-secondary"
                            >
                                <BiImage />
                                Galleria
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContestCard;