import React, { useState } from 'react';
import { useQuery as useRQ } from '@tanstack/react-query';
import { notificationAPI } from '../services/notificationApi';
import AdminNotifications from '../components/AdminNotifications';
import { SystemStatusBox, SystemNotifications } from '../components/SystemStatus';
import QuickActions from '../components/QuickActions';
import '../style/componentsStyle/SystemStatus.css';
import TrendChart from '../components/TrendChart';
import { useNavigate } from 'react-router-dom';
// ...existing code...
import { useQuery } from '@tanstack/react-query';
import { adminAPI, contestAPI } from '../services/api';
import '../style/pagesStyle/AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, type: '', contest: null });
    // Funzione elimina contest
    const handleDeleteContest = async (contest) => {
        setActionLoading(true);
        try {
            await contestAPI.delete(contest.id);
            setConfirmModal({ show: false, type: '', contest: null });
            refetch();
            refetchContests();
        } catch (err) {
            alert("Errore durante l'eliminazione del contest.");
        }
        setActionLoading(false);
    };

    // Notifiche amministrative (tutte)
    const { data: notificationsData, isLoading: loadingNotifications } = useRQ({
        queryKey: ['admin-all-notifications'],
        queryFn: notificationAPI.getAll,
        select: (response) => response.data?.data || [],
        refetchInterval: 60000,
    });

    // Funzione chiudi contest
    const handleCloseContest = async (contest) => {
        setActionLoading(true);
        try {
            await contestAPI.update(contest.id, { status: 'ended' });
            setConfirmModal({ show: false, type: '', contest: null });
            refetch();
            refetchContests();
        } catch (err) {
            alert("Errore durante la chiusura del contest.");
        }
        setActionLoading(false);
    };

    // Selettore periodo trend
    const [trendDays, setTrendDays] = useState(30);
    const trendOptions = [7, 30, 90, 365];


    // Query dati dashboard parametrica
    const { data: dashboard, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-dashboard', trendDays],
        queryFn: () => adminAPI.getDashboard(trendDays),
        select: (response) => response.data || {},
        staleTime: 2 * 60 * 1000,
        refetchInterval: 30000, // Polling automatico ogni 30 secondi
    });

    // Query stato sistema e notifiche
    const { data: systemStatus, isLoading: loadingStatus } = useQuery({
        queryKey: ['admin-system-status'],
        queryFn: adminAPI.getSystemStatus,
        select: (response) => response.data || {},
        staleTime: 60 * 1000,
        refetchInterval: 60000,
    });

    // Filtri ultimi eventi
    const [eventFilter, setEventFilter] = useState('all');
    const eventTypes = [
        { type: 'all', label: 'Tutti' },
        { type: 'user', label: 'Utenti' },
        { type: 'contest', label: 'Contest' },
        { type: 'entry', label: 'Foto' },
        { type: 'credit', label: 'Crediti' },
    ];

    return (
        <div className="admin-dashboard-wrapper">
            <h1>Dashboard Admin</h1>

            {/* Notifiche amministrative suddivise */}
            {!loadingNotifications && notificationsData && (
                <div className="admin-notifications-section">
                    <div className="admin-notifications-group">
                        <h2 className="admin-notifications-title">Da leggere ({notificationsData.filter(n => !n.read_at).length})</h2>
                        <AdminNotifications
                            notifications={notificationsData.filter(n => !n.read_at)}
                            onMarkAsRead={async (id) => {
                                await notificationAPI.markAsRead(id);
                                window.location.reload();
                            }}
                            onDelete={async (id) => {
                                await notificationAPI.delete(id);
                                window.location.reload();
                            }}
                        />
                    </div>
                    <div className="admin-notifications-group">
                        <h2 className="admin-notifications-title">Già lette ({notificationsData.filter(n => n.read_at).length})</h2>
                        <AdminNotifications
                            notifications={notificationsData.filter(n => n.read_at)}
                            onMarkAsRead={async (id) => {
                                await notificationAPI.markAsRead(id);
                                window.location.reload();
                            }}
                            onDelete={async (id) => {
                                await notificationAPI.delete(id);
                                window.location.reload();
                            }}
                        />
                    </div>
                </div>
            )}


            {/* Azioni rapide */}
            <QuickActions />

            {/* Notifiche di sistema */}
            {!loadingStatus && systemStatus?.notifiche && (
                <SystemNotifications notifiche={systemStatus.notifiche} />
            )}
            {/* Stato servizi */}
            {!loadingStatus && systemStatus?.servizi && (
                <SystemStatusBox servizi={systemStatus.servizi} />
            )}

            {isLoading && <div className="admin-dashboard-loading">Caricamento...</div>}
            {error && (
                <div className="admin-dashboard-error">
                    Errore: {error.message}
                    <button onClick={() => refetch()}>Riprova</button>
                </div>
            )}
            {/* DEBUG: Mostra la risposta API grezza */}
            {!isLoading && dashboard && (
                <>
                    <div className="admin-dashboard-grid">
                        <div className="admin-dashboard-widget" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/contests')}>
                            <h2>Contest totali</h2>
                            <div className="admin-dashboard-value">{dashboard.stats?.contests?.total ?? '-'}</div>
                            <div style={{ fontSize: '0.9em', color: '#007bff', marginTop: '0.5rem' }}>Clicca per gestire i contest</div>
                        </div>
                        <div className="admin-dashboard-widget" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/users')}>
                            <h2>Utenti registrati</h2>
                            <div className="admin-dashboard-value">{dashboard.stats?.users?.total ?? '-'}</div>
                            <div style={{ fontSize: '0.9em', color: '#007bff', marginTop: '0.5rem' }}>Clicca per vedere gli utenti</div>
                        </div>
                        <div className="admin-dashboard-widget">
                            <h2>Foto in moderazione</h2>
                            <div className="admin-dashboard-value">{dashboard.stats?.entries?.pending ?? '-'}</div>
                        </div>
                        <div className="admin-dashboard-widget" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/credits')}>
                            <h2>Crediti distribuiti</h2>
                            <div className="admin-dashboard-value">{dashboard.stats?.credits?.total_credits_distributed ?? '-'}</div>
                            <div style={{ fontSize: '0.9em', color: '#007bff', marginTop: '0.5rem' }}>Clicca per vedere i crediti</div>
                        </div>
                    </div>

                    {/* Sezione Grafici Trend */}
                    {dashboard.trendData && (
                        <div className="admin-dashboard-trends" style={{ margin: '2.5rem 0 2rem 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18, gap: 16 }}>
                                <h2 style={{ fontSize: '1.2rem', color: '#333', margin: 0 }}>Trend ultimi {trendDays} giorni</h2>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {trendOptions.map(opt => (
                                        <button
                                            key={opt}
                                            className={trendDays === opt ? 'active' : ''}
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: 6,
                                                border: trendDays === opt ? '2px solid #007bff' : '1px solid #ccc',
                                                background: trendDays === opt ? '#eaf4ff' : '#f8f9fa',
                                                color: trendDays === opt ? '#007bff' : '#333',
                                                fontWeight: trendDays === opt ? 600 : 400,
                                                cursor: 'pointer',
                                                fontSize: 14
                                            }}
                                            onClick={() => setTrendDays(opt)}
                                        >
                                            {opt}g
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                                <TrendChart
                                    title="Iscrizioni utenti"
                                    trend={dashboard.trendData.user_registrations}
                                    color="#007bff"
                                    yLabel="Utenti"
                                    days={trendDays}
                                />
                                <TrendChart
                                    title="Foto caricate"
                                    trend={dashboard.trendData.entries_uploaded}
                                    color="#ffc107"
                                    yLabel="Foto"
                                    days={trendDays}
                                />
                                <TrendChart
                                    title="Foto moderate"
                                    trend={dashboard.trendData.entries_moderated}
                                    color="#28a745"
                                    yLabel="Moderate"
                                    days={trendDays}
                                />
                                <TrendChart
                                    title="Crediti distribuiti (totale utenti)"
                                    trend={dashboard.trendData.credits_distributed}
                                    color="#17a2b8"
                                    yLabel="Crediti"
                                    days={trendDays}
                                />
                            </div>
                        </div>
                    )}
                    {/* Sezione Ultimi Eventi */}
                    <div className="admin-dashboard-latest-events">
                        <h2 style={{ marginTop: '2rem' }}>Ultimi eventi</h2>
                        <div className="admin-dashboard-event-filters">
                            {eventTypes.map((et) => (
                                <button
                                    key={et.type}
                                    className={eventFilter === et.type ? 'active' : ''}
                                    onClick={() => setEventFilter(et.type)}
                                    style={{ marginRight: 8, marginBottom: 8 }}
                                >
                                    {et.label}
                                </button>
                            ))}
                        </div>
                        {dashboard.latestEvents && dashboard.latestEvents.length > 0 ? (
                            <ul className="admin-dashboard-events-list" style={{ maxHeight: 350, overflowY: 'auto' }}>
                                {dashboard.latestEvents
                                    .filter(ev => eventFilter === 'all' ? true : ev.type === eventFilter)
                                    .slice(0, 7)
                                    .map((event, idx) => {
                                        let icon = '';
                                        switch (event.type) {
                                            case 'user': icon = '👤'; break;
                                            case 'contest': icon = '🏆'; break;
                                            case 'entry': icon = '🖼️'; break;
                                            case 'credit': icon = '💳'; break;
                                            default: icon = '🔔';
                                        }
                                        return (
                                            <li key={idx} className="admin-dashboard-event-item">
                                                <span className={`event-type ${event.type}`}>{icon} {event.type.charAt(0).toUpperCase() + event.type.slice(1)}</span>
                                                <span className="event-desc">{event.description}</span>
                                                <span className="event-date">{event.date ? new Date(event.date).toLocaleString() : ''}</span>
                                            </li>
                                        );
                                    })}
                            </ul>
                        ) : (
                            <div style={{ color: '#888', marginTop: '1rem' }}>Nessun evento recente.</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
