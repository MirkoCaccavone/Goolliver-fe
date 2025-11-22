import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';

const AdminCreditsPage = () => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-credits-analytics'],
        queryFn: adminAPI.getCreditAnalytics,
        select: (response) => response.data.analytics || {},
        staleTime: 2 * 60 * 1000,
    });

    // Flat movimenti: ogni movimento è una riga
    const [filter, setFilter] = React.useState("");
    let flatMovements = [];
    if (data && data.recent_movements) {
        data.recent_movements.forEach(user => {
            const movements = user.all_movements && user.all_movements.length > 0 ? user.all_movements : user.recent_movements || [];
            movements.forEach(mov => {
                // Estrai data e descrizione se in formato "YYYY-MM-DD HH:mm:ss: descrizione"
                let date = user.last_update;
                let desc = mov;
                const match = mov.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}): (.+)$/);
                if (match) {
                    date = match[1];
                    desc = match[2];
                }
                flatMovements.push({
                    user_name: user.user_name,
                    email: user.email,
                    current_credits: user.current_credits,
                    date,
                    desc
                });
            });
        });
        // Ordina per data decrescente
        flatMovements.sort((a, b) => (b.date > a.date ? 1 : -1));
    }

    const filteredMovements = flatMovements.filter(mov =>
        mov.user_name?.toLowerCase().includes(filter.toLowerCase()) ||
        mov.email?.toLowerCase().includes(filter.toLowerCase()) ||
        mov.desc?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="container mt-4">
            <h2>Crediti distribuiti</h2>
            {isLoading && <div>Caricamento dati crediti...</div>}
            {error && <div className="alert alert-danger">Errore: {error.message}</div>}
            {data && (
                <>
                    <div className="card mb-4">
                        <div className="card-body">
                            <p><b>Totale crediti distribuiti:</b> {data.general_stats?.total_credits_distributed ?? '-'}</p>
                            <p><b>Utenti con crediti:</b> {data.general_stats?.users_with_credits ?? '-'}</p>
                            <p><b>Media crediti per utente:</b> {data.general_stats?.average_credits_per_user?.toFixed(2) ?? '-'}</p>
                            <p><b>Max crediti singolo utente:</b> {data.general_stats?.max_credits_single_user ?? '-'}</p>
                        </div>
                    </div>

                    <h4>Storico movimenti crediti</h4>
                    <div className="mb-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Filtra per utente, email o descrizione..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            style={{ maxWidth: 350 }}
                        />
                    </div>
                    {filteredMovements.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table table-sm table-striped" style={{ minWidth: 900 }}>
                                <thead>
                                    <tr>
                                        <th>Utente</th>
                                        <th>Email</th>
                                        <th>Crediti attuali</th>
                                        <th>Data movimento</th>
                                        <th>Descrizione</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMovements.map((mov, idx) => (
                                        <tr key={idx}>
                                            <td>{mov.user_name}</td>
                                            <td>{mov.email}</td>
                                            <td>{mov.current_credits}</td>
                                            <td>{mov.date ? new Date(mov.date).toLocaleString() : '-'}</td>
                                            <td>{mov.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div>Nessun movimento crediti</div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminCreditsPage;
