import React from 'react';
import { useAuthStore } from '../stores/authStore';

const DashboardPage = () => {

    const { user } = useAuthStore();
    const [userPhotos, setUserPhotos] = React.useState([]);
    const [loadingPhotos, setLoadingPhotos] = React.useState(true);
    const [credits, setCredits] = React.useState(0);
    const [contestsWon, setContestsWon] = React.useState(0);
    const [votesReceived, setVotesReceived] = React.useState(0);
    const [loadingStats, setLoadingStats] = React.useState(true);
    const [recentActivity, setRecentActivity] = React.useState([]);

    React.useEffect(() => {
        setLoadingPhotos(true);
        setLoadingStats(true);
        import('../services/api').then(({ photoAPI, contestAPI }) => {
            Promise.all([
                photoAPI.getUserPhotos(),
                photoAPI.getUserCredits(),
                contestAPI.getAll(),
                photoAPI.getUserVotesSummary()
            ]).then(async ([photosRes, creditsRes, contestsRes, votesRes]) => {
                const photos = photosRes.data?.entries || [];
                setUserPhotos(photos);
                setCredits(creditsRes.data?.photo_credits ?? 0);

                // Contest vinti: filtra contest dove winner_id === user.id
                const contests = contestsRes.data?.contests || [];
                const won = contests.filter(c => c.winner_id === user?.id).length;
                setContestsWon(won);

                // Voti ricevuti: usa la nuova API ottimizzata
                setVotesReceived(votesRes.data?.total_votes ?? 0);

                // Attività: nuovi contest disponibili
                let activityArr = [];
                contests.forEach(contest => {
                    if (contest.status === 'open' && contest.created_at) {
                        activityArr.push({
                            type: 'warning',
                            message: `Nuovo contest disponibile: "${contest.title}"`,
                            time: contest.created_at
                        });
                    }
                });

                // Attività: foto approvata
                photos.forEach(photo => {
                    if (photo.moderation_status === 'approved') {
                        activityArr.push({
                            type: 'success',
                            message: `La tua foto "${photo.title}" è stata approvata nel contest "${photo.contest?.title || photo.contest_id}"`,
                            time: photo.moderated_at || photo.updated_at
                        });
                    }
                });

                // Ordina attività per data decrescente
                activityArr.sort((a, b) => new Date(b.time) - new Date(a.time));
                setRecentActivity(activityArr.slice(0, 5)); // Mostra solo le ultime 5

                setLoadingStats(false);
                setLoadingPhotos(false);
            }).catch(() => {
                setLoadingStats(false);
                setLoadingPhotos(false);
            });
        });
    }, [user]);

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
                                            <h5 className="card-title h4 mb-0">{loadingStats ? '--' : userPhotos.length}</h5>
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
                                            <h5 className="card-title h4 mb-0">{loadingStats ? '--' : contestsWon}</h5>
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
                                            <h5 className="card-title h4 mb-0">{loadingStats ? '--' : votesReceived}</h5>
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
                                            <h5 className="card-title h4 mb-0">{loadingStats ? '--' : credits}</h5>
                                            <p className="card-text text-muted small mb-0">Crediti Disponibili</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stato Pagamento Foto Caricate */}
                        <div className="card mb-5">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Stato Pagamento Foto Caricate</h5>
                            </div>
                            <div className="card-body">
                                {loadingPhotos ? (
                                    <div className="text-muted">Caricamento foto...</div>
                                ) : userPhotos.length === 0 ? (
                                    <div className="text-muted">Nessuna foto caricata.</div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-bordered align-middle">
                                            <thead>
                                                <tr>
                                                    <th>Contest</th>
                                                    <th>Titolo</th>
                                                    <th>Stato Pagamento</th>
                                                    <th>Data Pagamento</th>
                                                    <th>Importo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userPhotos.map(photo => (
                                                    <tr key={photo.id}>
                                                        <td>{photo.contest?.title || photo.contest_id}</td>
                                                        <td>{photo.title}</td>
                                                        <td>
                                                            {photo.payment_status === 'completed' && <span className="badge bg-success">Completato</span>}
                                                            {photo.payment_status === 'pending' && <span className="badge bg-warning text-dark">In attesa</span>}
                                                            {photo.payment_status === 'failed' && <span className="badge bg-danger">Fallito</span>}
                                                            {!photo.payment_status && <span className="badge bg-secondary">N/A</span>}
                                                        </td>
                                                        <td>{photo.paid_at ? new Date(photo.paid_at).toLocaleString() : '-'}</td>
                                                        <td>€{photo.payment_amount || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
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
                                        <a href="/upload" className="btn btn-primary">
                                            Inizia Upload
                                        </a>
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
                                        <a href="/contests" className="btn btn-outline-success">
                                            Vedi Contest
                                        </a>
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
                                        <a href="/my-photos" className="btn btn-outline-info">
                                            Vedi Galleria
                                        </a>
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
                                {loadingStats ? (
                                    <div className="text-muted">Caricamento attività...</div>
                                ) : recentActivity.length === 0 ? (
                                    <div className="text-muted">Nessuna attività recente.</div>
                                ) : (
                                    recentActivity.map((act, idx) => (
                                        <div className={`activity-item`} key={idx}>
                                            <span className={`activity-dot ${act.type}`}></span>
                                            <strong>{act.message}</strong>
                                            <small className="text-muted d-block">{act.time ? new Date(act.time).toLocaleString() : ''}</small>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;