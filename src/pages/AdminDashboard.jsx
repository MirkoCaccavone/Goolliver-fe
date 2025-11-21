import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// ...existing code...
import { useQuery } from '@tanstack/react-query';
import { adminAPI, contestAPI } from '../services/api';
import './AdminDashboard.css';

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
    // Query dati dashboard
    const { data: dashboard, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: adminAPI.getDashboard,
        select: (response) => response.data || {},
        staleTime: 2 * 60 * 1000,
        refetchInterval: 30000, // Polling automatico ogni 30 secondi
    });

    return (
        <div className="admin-dashboard-wrapper">
            <h1>Dashboard Admin</h1>
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
                        <div className="admin-dashboard-widget">
                            <h2>Crediti distribuiti</h2>
                            <div className="admin-dashboard-value">{dashboard.stats?.credits?.total_credits_distributed ?? '-'}</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
