import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contestAPI, photoAPI, voteAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import PhotoUpload from '../components/PhotoUpload/PhotoUpload';
import '../style/pagesStyle/ContestPage.css';

const ContestPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('gallery');
    const [entryExpired, setEntryExpired] = useState(false);
    // Stato loading per i like: oggetto { [entryId]: boolean }
    const [likeLoading, setLikeLoading] = useState({});

    // Handler per il like
    const handleLike = async (entryId, canLike) => {
        if (!canLike || likeLoading[entryId]) return;
        setLikeLoading(prev => ({ ...prev, [entryId]: true }));
        try {
            // Usa la nuova API: POST /votes con user_id e entry_id
            await voteAPI.vote({ user_id: user.id, entry_id: entryId });
            queryClient.invalidateQueries({ queryKey: ['contest-entries', id] });
            queryClient.invalidateQueries({ queryKey: ['contest-leaderboard', id] });
        } catch (e) {
            // TODO: mostrare errore toast
        } finally {
            setLikeLoading(prev => ({ ...prev, [entryId]: false }));
        }
    };

    // Effettua la chiamata a /api/entries/last quando si entra nella tab 'gallery'
    useEffect(() => {
        if (activeTab === 'gallery' && user && id) {
            // Chiamata API per triggerare la cancellazione automatica
            fetch(`/api/entries/last?user_id=${user.id}&contest_id=${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.expired) {
                        setEntryExpired(true);
                        // Invalida le query per aggiornare la UI
                        queryClient.invalidateQueries({ queryKey: ['contest-entries', id] });
                        queryClient.invalidateQueries({ queryKey: ['user-photos'] });
                        queryClient.invalidateQueries({ queryKey: ['contest-participation', id] });
                    } else {
                        setEntryExpired(false);
                    }
                })
                .catch(() => setEntryExpired(false));
        }
    }, [activeTab, user, id, queryClient]);

    // Query per il contest
    const {
        data: contest,
        isLoading: contestLoading,
        error: contestError
    } = useQuery({
        queryKey: ['contest', id],
        queryFn: () => contestAPI.getById(id),
        select: (response) => response.data,
    });

    // Query per la gallery del contest
    const {
        data: entries,
        isLoading: entriesLoading
    } = useQuery({
        queryKey: ['contest-entries', id],
        queryFn: () => contestAPI.getEntries(id),
        select: (response) => response.data || [],
        enabled: !!id,
    });

    // Query per la leaderboard, aggiorna ogni 5 minuti
    const {
        data: leaderboard,
        isLoading: leaderboardLoading
    } = useQuery({
        queryKey: ['contest-leaderboard', id],
        queryFn: () => voteAPI.getLeaderboard(id),
        select: (response) => response.data || [],
        enabled: !!id,
        refetchInterval: 300000, // 5 minuti in ms
    });

    // Query per verificare se l'utente ha già partecipato
    const {
        data: userPhotos,
        isLoading: userPhotosLoading
    } = useQuery({
        queryKey: ['user-photos'],
        queryFn: () => photoAPI.getUserPhotos(),
        select: (response) => response.data?.entries || [], // Fix: usa entries invece di data diretto
        enabled: !!user,
    });

    // Query specifica per controllare la partecipazione a questo contest
    const {
        data: contestParticipation,
        isLoading: participationLoading
    } = useQuery({
        queryKey: ['contest-participation', id, user?.id],
        queryFn: async () => {
            if (!user || !id) return null;
            const photos = await photoAPI.getUserPhotos();
            const userEntries = photos.data?.entries || []; // Fix: usa entries
            const userParticipation = userEntries.find(photo => photo.contest_id === parseInt(id));
            return userParticipation || null;
        },
        enabled: !!user && !!id,
    });

    // Usa la query specifica per la partecipazione
    const userParticipation = contestParticipation;



    // Gestisci i query parameters per il tab iniziale
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        const action = params.get('action');

        // Non procedere se stiamo ancora caricando i dati di partecipazione
        if (participationLoading) return;

        if (action === 'participate') {
            // Se l'utente ha cliccato "Partecipa", controlla prima se ha già partecipato
            if (!userParticipation) {
                setActiveTab('upload');
            } else {
                // Se ha già partecipato, mostra la gallery
                setActiveTab('gallery');
            }
        } else if (tab) {
            setActiveTab(tab);
        }
    }, [location.search, userParticipation, participationLoading]);

    // Determina lo status del contest
    const getContestStatus = () => {
        if (!contest) return 'upcoming';

        const now = new Date();
        const startDate = new Date(contest.start_date);
        const endDate = new Date(contest.end_date);

        if (now < startDate) return 'upcoming';
        if (now > endDate) return 'ended';
        return 'active';
    };

    // Formatta le date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calcola i giorni rimanenti
    const getDaysRemaining = () => {
        if (!contest?.end_date) return 0;

        const now = new Date();
        const endDate = new Date(contest.end_date);
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
    };

    // Gestisce la partecipazione
    const handleParticipate = () => {
        // Mostra il tab di upload
        setActiveTab('upload');
    };

    if (contestLoading) {
        return (
            <div className="contest-page-wrapper">
                <div className="contest-loading">
                    <div className="contest-spinner"></div>
                </div>
            </div>
        );
    }

    if (contestError || !contest) {
        return (
            <div className="contest-page-wrapper">
                <div className="contest-page-container">
                    <div className="alert alert-danger">
                        <h4>{t('contestPage.notFoundTitle')}</h4>
                        <p>{t('contestPage.notFoundText')}</p>
                        <Link to="/contests" className="btn btn-primary">
                            <i className="bi bi-arrow-left me-1"></i>
                            {t('contestPage.backToContests')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const status = contest.status;
    // DEBUG: log status
    console.log('DEBUG Contest status:', contest.status, 'Computed status:', status);
    const daysRemaining = getDaysRemaining();
    const canParticipate = status === 'active' && contest.current_participants < contest.max_participants;



    return (
        <div className="contest-page-wrapper">
            <div className="contest-page-container">
                {/* Messaggio pending_voting per partecipanti approvati */}
                {status === 'pending_voting' && userParticipation?.moderation_status === 'approved' && (
                    <div className="alert alert-info mb-3">
                        <i className="bi bi-hourglass-split me-2"></i>
                        A breve partirà la votazione! Riceverai una notifica quando potrai votare le foto degli altri partecipanti.
                    </div>
                )}
                {/* Header Contest */}
                <div className="contest-header">
                    <div className="contest-header-content">
                        {/* Breadcrumb */}
                        <div className="contest-breadcrumb">
                            <Link to="/contests" className="contest-breadcrumb-link">
                                <i className="bi bi-grid-3x3-gap me-1"></i>
                                {t('contestPage.contests')}
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <span>{contest.category || 'Generale'}</span>
                        </div>

                        {/* Status Badge */}
                        <div className={`contest-status-badge contest-status-${status}`}>
                            <i className={`bi ${status === 'active' ? 'bi-play-circle-fill' : status === 'upcoming' ? 'bi-clock-fill' : 'bi-check-circle-fill'}`}></i>
                            {status === 'active' && t('contestPage.active')}
                            {status === 'upcoming' && t('contestPage.upcoming')}
                            {status === 'ended' && t('contestPage.ended')}
                        </div>

                        {/* Title & Description */}
                        <h1 className="contest-title">{contest.title}</h1>
                        <p className="contest-description">{contest.description}</p>

                        {/* Meta Grid */}
                        <div className="contest-meta-grid">
                            <div className="contest-meta-item">
                                <div className="contest-meta-icon">
                                    <i className="bi bi-people-fill"></i>
                                </div>
                                <div className="contest-meta-value">{contest.current_participants || 0}</div>
                                <div className="contest-meta-label">{t('contestPage.participants')}</div>
                            </div>

                            <div className="contest-meta-item">
                                <div className="contest-meta-icon">
                                    <i className="bi bi-person-check-fill"></i>
                                </div>
                                <div className="contest-meta-value">{contest.max_participants}</div>
                                <div className="contest-meta-label">{t('contestPage.maxParticipants')}</div>
                            </div>

                            <div className="contest-meta-item">
                                <div className="contest-meta-icon">
                                    <i className="bi bi-calendar-event"></i>
                                </div>
                                <div className="contest-meta-value">{daysRemaining}</div>
                                <div className="contest-meta-label">{t('contestPage.daysRemaining')}</div>
                            </div>

                            <div className="contest-meta-item">
                                <div className="contest-meta-icon">
                                    <i className="bi bi-coin"></i>
                                </div>
                                <div className="contest-meta-value">€{contest.entry_fee}</div>
                                <div className="contest-meta-label">{t('contestPage.entryFee')}</div>
                            </div>
                        </div>

                        {/* Prize */}
                        {contest.prize && (
                            <div className="contest-prize">
                                <div className="contest-prize-icon">
                                    <i className="bi bi-trophy-fill"></i>
                                </div>
                                <div className="contest-prize-amount">{contest.prize}</div>
                                <div className="contest-prize-label">{t('contestPage.prize')}</div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="contest-actions">
                            {canParticipate ? (
                                <button
                                    onClick={handleParticipate}
                                    className="contest-action-button contest-action-primary"
                                >
                                    <i className="bi bi-camera-fill"></i>
                                    {t('contestPage.participateNow')}
                                </button>
                            ) : status === 'ended' ? (
                                <button className="contest-action-button contest-action-secondary" disabled>
                                    <i className="bi bi-check-circle"></i>
                                    {t('contestPage.contestEnded')}
                                </button>
                            ) : status === 'upcoming' ? (
                                <button className="contest-action-button contest-action-secondary" disabled>
                                    <i className="bi bi-clock"></i>
                                    {t('contestPage.comingSoon')}
                                </button>
                            ) : (
                                <button className="contest-action-button contest-action-secondary" disabled>
                                    <i className="bi bi-x-circle"></i>
                                    {t('contestPage.full')}
                                </button>
                            )}

                            <Link
                                to="/contests"
                                className="contest-action-button contest-action-secondary"
                            >
                                <i className="bi bi-arrow-left"></i>
                                Torna ai Contest
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="contest-content">
                    {/* Main Content */}
                    <div className="contest-main-content">
                        {/* Tab Navigation */}
                        <div className="nav nav-tabs mb-4">
                            <button
                                className={`nav-link ${activeTab === 'gallery' ? 'active' : ''}`}
                                onClick={() => setActiveTab('gallery')}
                            >
                                <i className="bi bi-images me-1"></i>
                                {t('contestPage.gallery')} ({entries?.length || 0})
                            </button>

                            {canParticipate && !participationLoading && !userParticipation && (
                                <button
                                    className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('upload')}
                                >
                                    <i className="bi bi-upload me-1"></i>
                                    {t('contestPage.participate')}
                                </button>
                            )}

                            {/* Permetti di partecipare di nuovo se rifiutato */}
                            {canParticipate && !participationLoading && userParticipation?.moderation_status === 'rejected' && (
                                <button
                                    className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('upload')}
                                >
                                    <i className="bi bi-upload me-1"></i>
                                    {t('contestPage.participateAgain')}
                                </button>
                            )}

                            {userParticipation && (
                                userParticipation.moderation_status !== 'rejected' && (
                                    <button
                                        className="nav-link"
                                        disabled
                                        style={{ cursor: 'not-allowed', opacity: 0.6 }}
                                    >
                                        <i className="bi bi-check-circle me-1"></i>
                                        {userParticipation.moderation_status === 'approved' ? t('contestPage.participating') :
                                            userParticipation.moderation_status === 'pending' ? t('contestPage.inReview') :
                                                userParticipation.moderation_status === 'pending_review' ? t('contestPage.inModeration') :
                                                    t('contestPage.rejected')}
                                    </button>
                                )
                            )}

                            {status === 'ended' && (
                                <button
                                    className={`nav-link ${activeTab === 'results' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('results')}
                                >
                                    <i className="bi bi-trophy me-1"></i>
                                    {t('contestPage.results')}
                                </button>
                            )}

                            <button
                                className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                                onClick={() => setActiveTab('details')}
                            >
                                <i className="bi bi-info-circle me-1"></i>
                                {t('contestPage.details')}
                            </button>
                        </div>

                        {/* Gallery Tab */}
                        {activeTab === 'gallery' && (
                            <div>
                                {entryExpired && (
                                    <div className="alert alert-warning mb-3">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        La tua foto in attesa di pagamento è scaduta. Carica nuovamente per partecipare!
                                    </div>
                                )}
                                <div className="section-header">
                                    <div className="section-icon">
                                        <i className="bi bi-images"></i>
                                    </div>
                                    <h3 className="section-title">{t('contestPage.participantPhotos')}</h3>
                                </div>

                                {entriesLoading ? (
                                    <div className="contest-loading">
                                        <div className="contest-spinner"></div>
                                    </div>
                                ) : entries?.length > 0 ? (


                                    <div className="contest-gallery">
                                        {entries.map(entry => {
                                            const isVoting = status === 'voting';
                                            const isUserParticipating = userParticipation && userParticipation.moderation_status === 'approved';
                                            const isOwnPhoto = user && entry.user_id === user.id;
                                            const alreadyVoted = entry.voted_by_user;
                                            const canLike = isVoting && isUserParticipating && !isOwnPhoto && !alreadyVoted;
                                            // ---
                                            return (
                                                <div key={entry.id} className="gallery-item">
                                                    <img
                                                        src={entry.thumbnail_url || entry.photo_url || '/placeholder-photo.jpg'}
                                                        alt={entry.title || 'Foto contest'}
                                                        className="gallery-image"
                                                    />
                                                    <div className="gallery-overlay">
                                                        <div className="gallery-votes">
                                                            <i className="bi bi-heart-fill"></i>
                                                            {entry.likes_count || 0}
                                                        </div>
                                                        {/* Pulsante Like */}
                                                        {isVoting && isUserParticipating && !isOwnPhoto ? (
                                                            <button
                                                                className="gallery-like-btn custom-like-btn"
                                                                disabled={!canLike || likeLoading[entry.id]}
                                                                onClick={() => handleLike(entry.id, canLike)}
                                                                title={
                                                                    alreadyVoted
                                                                        ? t('contestPage.alreadyVoted')
                                                                        : !canLike
                                                                            ? t('contestPage.cannotVote')
                                                                            : t('contestPage.likeThisPhoto')
                                                                }
                                                            >
                                                                <span className={`like-icon${alreadyVoted ? ' liked' : ''}`}>♥</span>
                                                                {likeLoading[entry.id] ? (
                                                                    <span className="like-spinner"></span>
                                                                ) : (
                                                                    <span className="like-label">{t('contestPage.like')}</span>
                                                                )}
                                                            </button>
                                                        ) : null}
                                                        {/* Messaggio se è la propria foto */}
                                                        {isVoting && isUserParticipating && isOwnPhoto && (
                                                            <div className="gallery-own-photo-msg">
                                                                {t('contestPage.cannotVoteOwnPhoto')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            <i className="bi bi-camera"></i>
                                        </div>
                                        <div className="empty-state-title">{t('contestPage.noPhotosYet')}</div>
                                        <div className="empty-state-text">
                                            {status === 'active'
                                                ? t('contestPage.beFirstParticipant')
                                                : t('contestPage.photosVisibleWhenActive')
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Upload Tab */}
                        {activeTab === 'upload' && canParticipate && !participationLoading && (!userParticipation || userParticipation.moderation_status === 'rejected') && (
                            <div>
                                <div className="section-header">
                                    <div className="section-icon">
                                        <i className="bi bi-upload"></i>
                                    </div>
                                    <h3 className="section-title">{t('contestPage.participateInContest')}</h3>
                                </div>

                                <div className="alert alert-info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    <strong>{t('contestPage.participationFlowTitle')}</strong><br />
                                    {t('contestPage.participationFlow1')}<br />
                                    {t('contestPage.participationFlow2')}<br />
                                    {t('contestPage.participationFlow3', { fee: contest.entry_fee })}<br />
                                    {t('contestPage.participationFlow4')}
                                </div>

                                <PhotoUpload
                                    contest={contest}
                                    onUploadSuccess={(uploadResult) => {
                                        // Invalida le query per aggiornare i dati
                                        queryClient.invalidateQueries({ queryKey: ['contest', id] });
                                        queryClient.invalidateQueries({ queryKey: ['contest-entries', id] });
                                        queryClient.invalidateQueries({ queryKey: ['user-photos'] });
                                        queryClient.invalidateQueries({ queryKey: ['contest-participation', id] });

                                        // Se foto è in pending_review, vai a MyPhotos con messaggio, altrimenti Gallery
                                        if (uploadResult.moderation_status === 'pending_review') {
                                            // Aggiungi parametro per mostrare messaggio di revisione
                                            navigate('/my-photos?status=pending_review&message=foto_in_revisione');
                                        } else {
                                            setActiveTab('gallery');
                                        }

                                        console.log('Upload completato:', uploadResult);
                                    }}
                                    onCancel={() => {
                                        // Torna alla gallery se l'utente cancella
                                        setActiveTab('gallery');
                                    }}
                                />
                            </div>
                        )}

                        {/* Results Tab */}
                        {activeTab === 'results' && status === 'ended' && (
                            <div>
                                <div className="section-header">
                                    <div className="section-icon">
                                        <i className="bi bi-trophy"></i>
                                    </div>
                                    <h3 className="section-title">{t('contestPage.finalResults')}</h3>
                                </div>

                                {leaderboard?.length > 0 ? (
                                    <div>
                                        <div className="alert alert-success mb-4">
                                            <i className="bi bi-trophy-fill me-2"></i>
                                            <strong>{t('contestPage.contestEndedTitle')}</strong> {t('contestPage.finalResultsText')}
                                        </div>

                                        <div className="results-podium mb-4">
                                            {leaderboard.slice(0, 3).map((entry, index) => (
                                                <div key={entry.id} className={`podium-position position-${index + 1} text-center p-4 mb-3 rounded ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-light' : 'bg-light'}`}>
                                                    <div className="podium-medal mb-2">
                                                        <i className={`bi ${index === 0 ? 'bi-trophy-fill text-warning' : index === 1 ? 'bi-award-fill text-secondary' : 'bi-award-fill text-dark'}`} style={{ fontSize: '2rem' }}></i>
                                                    </div>
                                                    <img
                                                        src={entry.thumbnail_url || entry.photo_url || '/placeholder-photo.jpg'}
                                                        alt="Foto vincitrice"
                                                        className="podium-photo rounded mb-2"
                                                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                                    />
                                                    <h5 className="mb-1">{index + 1}° Posto</h5>
                                                    <p className="mb-1 fw-bold">{entry.user?.name || 'Utente Anonimo'}</p>
                                                    <p className="mb-0 text-muted">{entry.likes_count || 0} voti</p>
                                                </div>
                                            ))}
                                        </div>

                                        <h5>{t('contestPage.fullRanking')}</h5>
                                        <div className="results-full-list">
                                            {leaderboard.map((entry, index) => (
                                                <div key={entry.id} className="leaderboard-item">
                                                    <div className="leaderboard-position">
                                                        {index + 1}
                                                    </div>
                                                    <img
                                                        src={entry.thumbnail_url || entry.photo_url || '/placeholder-photo.jpg'}
                                                        alt="Foto"
                                                        className="leaderboard-photo"
                                                    />
                                                    <div className="leaderboard-info">
                                                        <div className="leaderboard-user">
                                                            {entry.user?.name || 'Utente Anonimo'}
                                                        </div>
                                                        <div className="leaderboard-votes">
                                                            {entry.likes_count || 0} voti
                                                        </div>
                                                    </div>
                                                    {/* Nessun punteggio, solo like */}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            <i className="bi bi-trophy"></i>
                                        </div>
                                        <div className="empty-state-title">{t('contestPage.noResultsTitle')}</div>
                                        <div className="empty-state-text">{t('contestPage.noResultsText')}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Details Tab */}
                        {activeTab === 'details' && (
                            <div>
                                <div className="section-header">
                                    <div className="section-icon">
                                        <i className="bi bi-info-circle"></i>
                                    </div>
                                    <h3 className="section-title">{t('contestPage.contestDetails')}</h3>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <strong>{t('contestPage.startDate')}:</strong><br />
                                        {formatDate(contest.start_date)}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <strong>{t('contestPage.endDate')}:</strong><br />
                                        {formatDate(contest.end_date)}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <strong>{t('contestPage.category')}:</strong><br />
                                        {contest.category || t('contestPage.general')}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <strong>{t('contestPage.status')}:</strong><br />
                                        <span className={`badge bg-${status === 'active' ? 'success' : status === 'upcoming' ? 'warning' : 'secondary'}`}>
                                            {status === 'active' ? t('contestPage.active') : status === 'upcoming' ? t('contestPage.next') : t('contestPage.ended')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    {/* Sidebar: classifica visibile anche durante voting */}
                    {(status === 'voting' || status === 'ended') && (
                        <div className="contest-sidebar">
                            <div className="section-header">
                                <div className="section-icon" style={{ fontSize: '2rem' }}>
                                    🏆
                                </div>
                                <h3 className="section-title">{t('contestPage.ranking')}</h3>
                            </div>

                            {leaderboardLoading ? (
                                <div className="contest-loading">
                                    <div className="contest-spinner"></div>
                                </div>
                            ) : (() => {
                                // Supporta sia array diretto che oggetto con chiave leaderboard
                                const leaderboardArray = Array.isArray(leaderboard)
                                    ? leaderboard
                                    : Array.isArray(leaderboard?.leaderboard)
                                        ? leaderboard.leaderboard
                                        : [];
                                return leaderboardArray.length > 0 ? (
                                    <div>
                                        {leaderboardArray.slice(0, 10).map((entry, index) => (
                                            <div key={entry.id} className="leaderboard-item" style={{ border: '2px solid #e83e8c', background: '#fffbe6' }}>
                                                <div className="leaderboard-position" style={{ fontSize: '1.5rem' }}>
                                                    {index + 1} <span role="img" aria-label="medal">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}</span>
                                                </div>
                                                <img
                                                    src={entry.thumbnail_url || entry.photo_url || '/placeholder-photo.jpg'}
                                                    alt="Foto"
                                                    className="leaderboard-photo"
                                                />
                                                <div className="leaderboard-info">
                                                    <div className="leaderboard-user">
                                                        {entry.user?.name || 'Utente Anonimo'}
                                                    </div>
                                                    <div className="leaderboard-votes">
                                                        ❤️ {entry.likes_count || 0} voti
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            <span style={{ fontSize: '2rem' }}>🏆</span>
                                        </div>
                                        <div className="empty-state-title">{t('contestPage.noVotesYet')}</div>
                                        <div className="empty-state-text">{t('contestPage.rankingWillAppear')}</div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContestPage;