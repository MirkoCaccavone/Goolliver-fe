import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';

const AdminUsersPage = () => {
    const { data: users, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-users-all'],
        queryFn: async () => {
            const res = await adminAPI.getUsers();
            console.log('API admin/users response:', res.data);
            return res.data;
        },
        staleTime: 2 * 60 * 1000,
    });

    return (
        <div className="container mt-5">
            <h2>Utenti Registrati</h2>
            {isLoading && <div>Caricamento utenti...</div>}
            {error && <div className="alert alert-danger">Errore: {error.message}</div>}
            <div className="table-responsive mt-4">
                <table className="table table-bordered table-hover">
                    <thead className="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Ruolo</th>
                            <th>Stato</th>
                            <th>Registrato il</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.users?.data?.length > 0 ? (
                            [...users.users.data].sort((a, b) => a.id - b.id).map(user => (
                                <tr key={user.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/admin/users/${user.id}`}>
                                    <td>{user.id}</td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                    <td>{user.is_active ? 'Attivo' : 'Disattivo'}</td>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center">Nessun utente trovato</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsersPage;
