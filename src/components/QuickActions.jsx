import React, { useState } from 'react';

export default function QuickActions({ onSuccess, onError }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSendTestEmail = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await import('../services/api').then(m => m.adminAPI.sendTestEmail());
            setResult({ type: 'success', message: res.data.message });
            if (onSuccess) onSuccess(res.data.message);
        } catch (err) {
            const msg = err?.response?.data?.error || 'Errore generico';
            setResult({ type: 'error', message: msg });
            if (onError) onError(msg);
        }
        setLoading(false);
    };

    return (
        <div className="quick-actions-box" style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 18, marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: '1.08rem', color: '#333' }}>Azioni rapide</h3>
            <button
                onClick={handleSendTestEmail}
                disabled={loading}
                style={{
                    marginTop: 10,
                    padding: '7px 18px',
                    borderRadius: 7,
                    border: '1px solid #007bff',
                    background: loading ? '#eaf4ff' : '#007bff',
                    color: loading ? '#007bff' : '#fff',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                }}
            >
                {loading ? 'Invio in corso...' : 'Invia email di test'}
            </button>
            {result && (
                <div style={{
                    marginTop: 10,
                    color: result.type === 'success' ? '#28a745' : '#c82333',
                    background: result.type === 'success' ? '#eafbe7' : '#ffeaea',
                    border: result.type === 'success' ? '1px solid #b7e4c7' : '1px solid #f5c6cb',
                    borderRadius: 6,
                    padding: '7px 12px',
                    fontSize: 14
                }}>
                    {result.message}
                </div>
            )}
        </div>
    );
}
