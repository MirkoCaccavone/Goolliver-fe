import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';

const DashboardPage = () => {
    const { t } = useTranslation();
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
                            message: t('dashboard.newContestAvailable', { title: contest.title }),
                            time: contest.created_at
                        });
                    }
                });

                // Attività: foto approvata
                photos.forEach(photo => {
                    if (photo.moderation_status === 'approved') {
                        activityArr.push({
                            type: 'success',
                            message: t('dashboard.photoApproved', { title: photo.title, contest: photo.contest?.title || photo.contest_id }),
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
                                {t('hello')}, {user?.name}! 👋
                            </h1>
                            <p className="lead text-muted">
                                {t('dashboard_welcome')}
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
                                            <p className="card-text text-muted small mb-0">{t('photos_uploaded')}</p>
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
                                            <p className="card-text text-muted small mb-0">{t('contests_won')}</p>
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
                                            <p className="card-text text-muted small mb-0">{t('votes_received')}</p>
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
                                            <p className="card-text text-muted small mb-0">{t('credits_available')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stato Pagamento Foto Caricate */}
                        <div className="card mb-5">
                            <div className="card-header">
                                <h5 className="card-title mb-0">{t('photo_payment_status')}</h5>
                            </div>
                            <div className="card-body">
                                {loadingPhotos ? (
                                    <div className="text-muted">{t('loading_photos')}</div>
                                ) : userPhotos.length === 0 ? (
                                    <div className="text-muted">{t('no_photos_uploaded')}</div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-bordered align-middle">
                                            <thead>
                                                <tr>
                                                    <th>{t('contest')}</th>
                                                    <th>{t('title')}</th>
                                                    <th>{t('payment_status')}</th>
                                                    <th>{t('payment_date')}</th>
                                                    <th>{t('amount')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userPhotos.map(photo => (
                                                    <tr key={photo.id}>
                                                        <td>{photo.contest?.title || photo.contest_id}</td>
                                                        <td>{photo.title}</td>
                                                        <td>
                                                            {photo.payment_status === 'completed' && <span className="badge bg-success">{t('completed')}</span>}
                                                            {photo.payment_status === 'pending' && <span className="badge bg-warning text-dark">{t('pending')}</span>}
                                                            {photo.payment_status === 'failed' && <span className="badge bg-danger">{t('failed')}</span>}
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
                                        <h5 className="card-title">{t('upload_new_photo')}</h5>
                                        <p className="card-text text-muted">
                                            {t('upload_new_photo_desc')}
                                        </p>
                                        <a href="/upload" className="btn btn-primary">
                                            {t('start_upload')}
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
                                        <h5 className="card-title">{t('explore_contests')}</h5>
                                        <p className="card-text text-muted">
                                            {t('explore_contests_desc')}
                                        </p>
                                        <a href="/contests" className="btn btn-outline-success">
                                            {t('see_contests')}
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
                                        <h5 className="card-title">{t('my_photos')}</h5>
                                        <p className="card-text text-muted">
                                            {t('my_photos_desc')}
                                        </p>
                                        <a href="/my-photos" className="btn btn-outline-info">
                                            {t('see_gallery')}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Recent Activity */}
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">{t('recent_activity')}</h5>
                            </div>
                            <div className="card-body">
                                {loadingStats ? (
                                    <div className="text-muted">{t('loading_activity')}</div>
                                ) : recentActivity.length === 0 ? (
                                    <div className="text-muted">{t('no_recent_activity')}</div>
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