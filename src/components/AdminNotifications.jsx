import React, { useState } from 'react';
import AdminStartVotingForm from './AdminStartVotingForm';

const AdminNotifications = ({ notifications, onMarkAsRead, onDelete }) => {
    if (!notifications || notifications.length === 0) {
        return <div className="admin-notifications-empty">Nessuna notifica</div>;
    }
    const [showVotingFormId, setShowVotingFormId] = useState(null);
    const [localNotifications, setLocalNotifications] = useState(notifications);

    React.useEffect(() => {
        setLocalNotifications(notifications);
    }, [notifications]);
    return (
        <div className="admin-notifications-list">
            {localNotifications.map((n) => (
                <div key={n.id} className={`admin-notification-item${n.read_at ? ' read' : ''}`}>
                    <div className="admin-notification-message">
                        <strong>{n.data?.title || 'Notifica'}</strong><br />
                        {n.data?.message}
                    </div>
                    {n.type === 'contest_pending_voting' ? (
                        <>
                            {showVotingFormId === n.id ? (
                                <AdminStartVotingForm
                                    contestId={n.data?.contest_id}
                                    notificationId={n.id}
                                    contestStatus={n.data?.contest_status}
                                    onVotingStarted={() => {
                                        setShowVotingFormId(null);
                                        onDelete(n.id);
                                    }}
                                />
                            ) : (
                                <button
                                    className="btn btn-success"
                                    onClick={() => setShowVotingFormId(n.id)}
                                    disabled={n.data?.contest_status !== 'pending_voting'}
                                >
                                    {n.data?.contest_status !== 'pending_voting' ? 'Contest non in stato pending_voting' : 'Fai partire votazione'}
                                </button>
                            )}
                        </>
                    ) : n.data?.url && (
                        <a href={n.data.url} className="admin-notification-link">Vai al contest</a>
                    )}
                    <div className="admin-notification-actions">
                        {!n.read_at && (
                            <button onClick={async () => {
                                await onMarkAsRead(n.id);
                                setLocalNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read_at: new Date().toISOString() } : notif));
                            }}>Segna come letta</button>
                        )}
                        <button onClick={() => onDelete(n.id)}>Elimina</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AdminNotifications;
