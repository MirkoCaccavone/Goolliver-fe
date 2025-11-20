import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contestAPI, photoAPI, voteAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import PhotoUpload from '../components/PhotoUpload/PhotoUpload';
import './ContestPage/ContestPage.css';

const ContestPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('gallery');
    const [entryExpired, setEntryExpired] = useState(false);
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

    // Query per la leaderboard
    const {
        data: leaderboard,
        isLoading: leaderboardLoading
    } = useQuery({
        queryKey: ['contest-leaderboard', id],
        queryFn: () => voteAPI.getLeaderboard(id),
        select: (response) => response.data || [],
        enabled: !!id,
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
                        <h4>Contest non trovato</h4>
                        <p>Il contest che stai cercando non esiste o è stato rimosso.</p>
                        <Link to="/contests" className="btn btn-primary">
                            <i className="bi bi-arrow-left me-1"></i>
                            Torna ai Contest
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const status = getContestStatus();
    const daysRemaining = getDaysRemaining();
    const canParticipate = status === 'active' && contest.current_participants < contest.max_participants;



    return (
        <div className="contest-page-wrapper">
            <div className="contest-page-container">
                {/* Header Contest */}
                <div className="contest-header">
                    <div className="contest-header-content">
                        {/* Breadcrumb */}
                        <div className="contest-breadcrumb">
                            <Link to="/contests" className="contest-breadcrumb-link">
                                <i className="bi bi-grid-3x3-gap me-1"></i>
                                Contest
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <span>{contest.category || 'Generale'}</span>
                        </div>

                        {/* Status Badge */}
                        <div className={`contest-status-badge contest-status-${status}`}>
                            <i className={`bi ${status === 'active' ? 'bi-play-circle-fill' : status === 'upcoming' ? 'bi-clock-fill' : 'bi-check-circle-fill'}`}></i>
                            {status === 'active' && 'Contest Attivo'}
                            {status === 'upcoming' && 'Prossimamente'}
                            {status === 'ended' && 'Terminato'}
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
                                <div className="contest-meta-label">Partecipanti</div>
                            </div>

                            <div className="contest-meta-item">
                                <div className="contest-meta-icon">
                                    <i className="bi bi-person-check-fill"></i>
                                </div>
                                <div className="contest-meta-value">{contest.max_participants}</div>
                                <div className="contest-meta-label">Max Partecipanti</div>
                            </div>

                            <div className="contest-meta-item">
                                <div className="contest-meta-icon">
                                    <i className="bi bi-calendar-event"></i>
                                </div>
                                <div className="contest-meta-value">{daysRemaining}</div>
                                <div className="contest-meta-label">Giorni Rimanenti</div>
                            </div>

                            <div className="contest-meta-item">
                                <div className="contest-meta-icon">
                                    <i className="bi bi-coin"></i>
                                </div>
                                <div className="contest-meta-value">€{contest.entry_fee}</div>
                                <div className="contest-meta-label">Quota Partecipazione</div>
                            </div>
                        </div>

                        {/* Prize */}
                        {contest.prize && (
                            <div className="contest-prize">
                                <div className="contest-prize-icon">
                                    <i className="bi bi-trophy-fill"></i>
                                </div>
                                <div className="contest-prize-amount">{contest.prize}</div>
                                <div className="contest-prize-label">Premio in Palio</div>
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
                                    Partecipa Ora
                                </button>
                            ) : status === 'ended' ? (
                                <button className="contest-action-button contest-action-secondary" disabled>
                                    <i className="bi bi-check-circle"></i>
                                    Contest Terminato
                                </button>
                            ) : status === 'upcoming' ? (
                                <button className="contest-action-button contest-action-secondary" disabled>
                                    <i className="bi bi-clock"></i>
                                    Prossimamente
                                </button>
                            ) : (
                                <button className="contest-action-button contest-action-secondary" disabled>
                                    <i className="bi bi-x-circle"></i>
                                    Completo
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
                                Gallery ({entries?.length || 0})
                            </button>

                            {canParticipate && !participationLoading && !userParticipation && (
                                <button
                                    className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('upload')}
                                >
                                    <i className="bi bi-upload me-1"></i>
                                    Partecipa
                                </button>
                            )}

                            {/* Permetti di partecipare di nuovo se rifiutato */}
                            {canParticipate && !participationLoading && userParticipation?.moderation_status === 'rejected' && (
                                <button
                                    className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('upload')}
                                >
                                    <i className="bi bi-upload me-1"></i>
                                    Partecipa di nuovo
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
                                        {userParticipation.moderation_status === 'approved' ? 'Partecipando' :
                                            userParticipation.moderation_status === 'pending' ? 'In Revisione' :
                                                userParticipation.moderation_status === 'pending_review' ? 'In Moderazione' :
                                                    'Rifiutato'}
                                    </button>
                                )
                            )}

                            {status === 'ended' && (
                                <button
                                    className={`nav-link ${activeTab === 'results' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('results')}
                                >
                                    <i className="bi bi-trophy me-1"></i>
                                    Risultati
                                </button>
                            )}

                            <button
                                className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                                onClick={() => setActiveTab('details')}
                            >
                                <i className="bi bi-info-circle me-1"></i>
                                Dettagli
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
                                    <h3 className="section-title">Foto Partecipanti</h3>
                                </div>

                                {entriesLoading ? (
                                    <div className="contest-loading">
                                        <div className="contest-spinner"></div>
                                    </div>
                                ) : entries?.length > 0 ? (
                                    <div className="contest-gallery">
                                        {entries.map(entry => (
                                            <div key={entry.id} className="gallery-item">
                                                <img
                                                    src={entry.thumbnail_url || entry.photo_url || '/placeholder-photo.jpg'}
                                                    alt={entry.title || 'Foto contest'}
                                                    className="gallery-image"
                                                />
                                                <div className="gallery-overlay">
                                                    <div className="gallery-votes">
                                                        <i className="bi bi-heart-fill"></i>
                                                        {entry.votes_count || 0}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            <i className="bi bi-camera"></i>
                                        </div>
                                        <div className="empty-state-title">Nessuna foto ancora</div>
                                        <div className="empty-state-text">
                                            {status === 'active'
                                                ? 'Sii il primo a partecipare a questo contest!'
                                                : 'Le foto verranno visualizzate quando il contest sarà attivo.'
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
                                    <h3 className="section-title">Partecipa al Contest</h3>
                                </div>

                                <div className="alert alert-info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    <strong>Flusso di Partecipazione:</strong><br />
                                    1. Carica la tua foto<br />
                                    2. Moderazione AI automatica<br />
                                    3. Pagamento (€{contest.entry_fee})<br />
                                    4. Foto pubblicata e votabile
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
                                    <h3 className="section-title">Risultati Finali</h3>
                                </div>

                                {leaderboard?.length > 0 ? (
                                    <div>
                                        <div className="alert alert-success mb-4">
                                            <i className="bi bi-trophy-fill me-2"></i>
                                            <strong>Contest Terminato!</strong> Ecco i risultati finali.
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
                                                    <p className="mb-0 text-muted">{entry.votes_count || 0} voti</p>
                                                </div>
                                            ))}
                                        </div>

                                        <h5>Classifica Completa</h5>
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
                                                            {entry.votes_count || 0} voti
                                                        </div>
                                                    </div>
                                                    <div className="leaderboard-score">
                                                        {entry.vote_score || 0}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">
                                            <i className="bi bi-trophy"></i>
                                        </div>
                                        <div className="empty-state-title">Nessun risultato disponibile</div>
                                        <div className="empty-state-text">Non ci sono stati partecipanti a questo contest.</div>
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
                                    <h3 className="section-title">Dettagli Contest</h3>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <strong>Data Inizio:</strong><br />
                                        {formatDate(contest.start_date)}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <strong>Data Fine:</strong><br />
                                        {formatDate(contest.end_date)}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <strong>Categoria:</strong><br />
                                        {contest.category || 'Generale'}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <strong>Status:</strong><br />
                                        <span className={`badge bg-${status === 'active' ? 'success' : status === 'upcoming' ? 'warning' : 'secondary'}`}>
                                            {status === 'active' ? 'Attivo' : status === 'upcoming' ? 'Prossimo' : 'Terminato'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="contest-sidebar">
                        <div className="section-header">
                            <div className="section-icon">
                                <i className="bi bi-trophy"></i>
                            </div>
                            <h3 className="section-title">Classifica</h3>
                        </div>

                        {leaderboardLoading ? (
                            <div className="contest-loading">
                                <div className="contest-spinner"></div>
                            </div>
                        ) : leaderboard?.length > 0 ? (
                            <div>
                                {leaderboard.slice(0, 10).map((entry, index) => (
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
                                                {entry.votes_count || 0} voti
                                            </div>
                                        </div>
                                        <div className="leaderboard-score">
                                            {entry.vote_score || 0}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <i className="bi bi-trophy"></i>
                                </div>
                                <div className="empty-state-title">Nessun voto ancora</div>
                                <div className="empty-state-text">La classifica apparirà quando inizieranno i voti!</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContestPage;