import React from 'react';
import '../style/componentsStyle/SystemStatus.css';

const statusColors = {
    ok: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    unknown: '#6c757d',
};

export function SystemStatusBox({ servizi }) {
    if (!servizi) return null;
    return (
        <div className="system-status-box">
            <h3>Stato servizi</h3>
            <div className="system-status-list">
                {Object.entries(servizi).map(([key, s]) => (
                    <div key={key} className="system-status-item">
                        <span
                            className="system-status-dot"
                            style={{ background: statusColors[s.status] || '#6c757d' }}
                            title={s.status}
                        />
                        <span className="system-status-label">{s.label}:</span>
                        <span className="system-status-message">{s.message}</span>
                        {s.percent !== undefined && (
                            <span className="system-status-percent">{s.percent}%</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SystemNotifications({ notifiche }) {
    if (!notifiche || notifiche.length === 0) return null;
    return (
        <div className="system-notifications">
            {notifiche.map((n, i) => (
                <div key={i} className={`system-notification ${n.type}`}>
                    {n.type === 'danger' && '⛔ '}
                    {n.type === 'warning' && '⚠️ '}
                    {n.type === 'info' && 'ℹ️ '}
                    {n.message}
                </div>
            ))}
        </div>
    );
}
