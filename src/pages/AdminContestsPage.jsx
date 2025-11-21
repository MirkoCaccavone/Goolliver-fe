import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contestAPI } from '../services/api';
import AdminCreateContestButton from '../components/AdminCreateContestButton';

const AdminContestsPage = () => {
    const navigate = useNavigate();
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, type: '', contest: null });
    const { data: contestsData, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-contests-all'],
        queryFn: async () => {
            const res = await contestAPI.getAll();
            return res.data;
        },
        staleTime: 2 * 60 * 1000,
    });

    // Funzione elimina contest
    const handleDeleteContest = async (contest) => {
        setActionLoading(true);
        try {
            await contestAPI.delete(contest.id);
            setConfirmModal({ show: false, type: '', contest: null });
            refetch();
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
        } catch (err) {
            alert("Errore durante la chiusura del contest.");
        }
        setActionLoading(false);
    };

    return (
        <div className="container mt-5">
            <h2>Gestione Contest</h2>
            <div className="mb-4">
                <AdminCreateContestButton />
            </div>
            {isLoading && <div>Caricamento contest...</div>}
            {error && <div className="alert alert-danger">Errore: {error.message}</div>}
            <div className="table-responsive mt-4">
                <table className="table table-bordered table-hover">
                    <thead className="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Titolo</th>
                            <th>Stato</th>
                            <th>Partecipanti</th>
                            <th>Premio</th>
                            <th>Inizio</th>
                            <th>Fine</th>
                            <th>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contestsData?.length > 0 ? (
                            contestsData.map(contest => (
                                <tr key={contest.id}>
                                    <td>{contest.id}</td>
                                    <td>{contest.title}</td>
                                    <td>{contest.status}</td>
                                    <td>{contest.current_participants}/{contest.max_participants}</td>
                                    <td>{contest.prize ?? '-'}</td>
                                    <td>{new Date(contest.start_date).toLocaleDateString()}</td>
                                    <td>{new Date(contest.end_date).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => navigate(`/admin/contest/${contest.id}/edit`)}>Modifica</button>
                                        <button className="btn btn-sm btn-outline-danger me-1" onClick={() => setConfirmModal({ show: true, type: 'delete', contest })}>Elimina</button>
                                        {contest.status === 'active' && (
                                            <button className="btn btn-sm btn-outline-warning" onClick={() => setConfirmModal({ show: true, type: 'close', contest })}>Chiudi</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="text-center">Nessun contest trovato</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Modale conferma azione (fuori dal ciclo) */}
            {confirmModal.show && (
                <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 999, pointerEvents: 'auto' }}>
                    <div className="modal-dialog" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.15)', zIndex: 2000, minWidth: '320px', pointerEvents: 'auto' }}>
                        <h4 className="mb-3">{confirmModal.type === 'delete' ? 'Confermi di voler eliminare il contest?' : 'Confermi di voler chiudere il contest?'}</h4>
                        <div className="mb-3"><strong>{confirmModal.contest?.title}</strong></div>
                        <div className="d-flex justify-content-end">
                            <button className="btn btn-secondary me-2" disabled={actionLoading} onClick={() => setConfirmModal({ show: false, type: '', contest: null })}>Annulla</button>
                            {confirmModal.type === 'delete' ? (
                                <button className="btn btn-danger" disabled={actionLoading} onClick={() => handleDeleteContest(confirmModal.contest)}>
                                    {actionLoading ? 'Eliminazione...' : 'Elimina'}
                                </button>
                            ) : (
                                <button className="btn btn-warning" disabled={actionLoading} onClick={() => handleCloseContest(confirmModal.contest)}>
                                    {actionLoading ? 'Chiusura...' : 'Chiudi'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContestsPage;
