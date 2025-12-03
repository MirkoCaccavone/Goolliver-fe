
import React, { useState } from 'react';
import api from '../services/api';

import notificationAPI from '../services/notificationApi';

const AdminStartVotingForm = ({ contestId, notificationId, onVotingStarted }) => {
    const [days, setDays] = useState(3);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [votingStarted, setVotingStarted] = useState(false);
    // contestStatus viene passato come prop

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Chiamata API per far partire la votazione con axios
            const res = await api.post(`/admin/contests/${contestId}/start-voting`, {
                voting_days: days
            });
            const data = res.data;
            if (data.success) {
                setVotingStarted(true);
                onVotingStarted && onVotingStarted();
            } else {
                setError(data.message || data.error || 'Errore avvio votazione');
            }
        } catch (err) {
            setError(err?.response?.data?.error || 'Errore di rete');
        }
        setLoading(false);
    };

    return (
        <form className="admin-start-voting-form" onSubmit={handleSubmit}>
            <label>
                Durata votazione (giorni):
                <input
                    type="number"
                    min={1}
                    max={14}
                    value={days}
                    onChange={e => setDays(Number(e.target.value))}
                    disabled={loading || votingStarted || (typeof contestStatus !== 'undefined' && contestStatus === 'voting')}
                />
            </label>
            <button
                type="submit"
                disabled={loading || votingStarted || (typeof contestStatus !== 'undefined' && contestStatus === 'voting')}
                className="btn btn-primary"
            >
                {(typeof contestStatus !== 'undefined' && contestStatus === 'voting')
                    ? 'Votazione avviata'
                    : votingStarted
                        ? 'Votazione avviata'
                        : loading
                            ? 'Avvio...'
                            : 'Fai partire votazione'}
            </button>
            {error && <div className="form-error">{error}</div>}
        </form>
    );
};

export default AdminStartVotingForm;
