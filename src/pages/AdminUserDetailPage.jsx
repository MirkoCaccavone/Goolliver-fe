import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';

const AdminUserDetailPage = () => {
    const [isDeleting, setIsDeleting] = useState(false);
    // Handler eliminazione utente con doppia conferma
    const handleDeleteUser = async () => {
        if (!window.confirm('Sei sicuro di voler eliminare questo utente? L\'operazione è irreversibile.')) return;
        if (!window.confirm('Conferma definitiva: eliminare l\'account?')) return;
        setIsDeleting(true);
        try {
            await adminAPI.deleteUser(user.id);
            alert('Utente eliminato con successo.');
            navigate('/admin/users');
        } catch (err) {
            alert('Errore durante l\'eliminazione: ' + (err?.response?.data?.error || err.message));
        } finally {
            setIsDeleting(false);
        }
    };
    const [modalPhoto, setModalPhoto] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-user-detail', id],
        queryFn: async () => {
            const res = await adminAPI.getUserDetail(id);
            return res.data;
        },
        enabled: !!id,
    });

    if (isLoading) return <div>Caricamento dati utente...</div>;
    if (error) return <div className="alert alert-danger">Errore: {error.message}</div>;
    if (!data) return <div>Nessun dato trovato</div>;

    const { user, contests, photos, photo_credits } = data;

    // Mappa contestId -> contestTitle per lookup veloce
    const contestMap = {};
    contests.forEach(contest => {
        contestMap[contest.id] = contest.title;
    });

    return (
        <div className="container mt-4">
            <button className="btn btn-link mb-3" onClick={() => navigate(-1)}>&larr; Torna alla lista utenti</button>
            <h2>Dettaglio utente: {user.name}</h2>
            <div className="card mb-4">
                <div className="card-body">
                    <p><b>ID:</b> {user.id}</p>
                    <p><b>Email:</b> {user.email}</p>
                    <p><b>Ruolo:</b> {user.role}</p>
                    <p><b>Stato:</b> {user.is_active ? 'Attivo' : 'Disattivo'}</p>
                    <p><b>Registrato il:</b> {new Date(user.created_at).toLocaleString()}</p>
                    <p><b>Crediti foto:</b> {photo_credits}</p>
                    <button className="btn btn-danger mt-3" onClick={handleDeleteUser} disabled={isDeleting}>
                        {isDeleting ? 'Eliminazione in corso...' : 'Elimina utente'}
                    </button>
                </div>
            </div>
            <h4>Contest a cui partecipa</h4>
            <ul>
                {contests.length === 0 && <li>Nessun contest trovato</li>}
                {contests.map(contest => (
                    <li key={contest.id}>{contest.title} (ID: {contest.id})</li>
                ))}
            </ul>
            <h4>Foto caricate</h4>
            <ul>
                {photos.length === 0 && <li>Nessuna foto trovata</li>}
                {photos.map(photo => (
                    <li key={photo.id} style={{ marginBottom: '1.5em', borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <img
                                src={photo.thumbnail_url || photo.photo_url}
                                alt={photo.title}
                                style={{ maxWidth: 80, maxHeight: 80, borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer' }}
                                onClick={() => setModalPhoto(photo)}
                            />
                            <div>
                                <b>{photo.title || 'Senza titolo'}</b> (ID: {photo.id})<br />
                                <span>Contest: {contestMap[photo.contest_id] || 'N/A'} (ID: {photo.contest_id})</span><br />
                                <span>Caricata il: {new Date(photo.created_at).toLocaleString()}</span><br />
                                <span>Metodo pagamento: {photo.payment_method}</span><br />
                                <span>Voti: {photo.votes_count} | Likes: {photo.likes_count} | Visualizzazioni: {photo.views_count}</span><br />
                                <span>Descrizione: {photo.description}</span><br />
                                <span>Location: {photo.location}</span>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Modal per ingrandire la foto */}
            {modalPhoto && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}
                    onClick={() => setModalPhoto(null)}
                >
                    <img
                        src={modalPhoto.photo_url || modalPhoto.thumbnail_url}
                        alt={modalPhoto.title}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            borderRadius: 8,
                            boxShadow: '0 2px 16px #0008',
                            background: '#fff',
                            padding: 8
                        }}
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminUserDetailPage;
