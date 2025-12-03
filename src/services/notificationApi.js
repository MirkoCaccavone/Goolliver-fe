import api from './api';

// Recupera tutte le notifiche dell'admin
export const notificationAPI = {
    getAll: () => api.get('/admin/notifications'),
    getUnread: () => api.get('/admin/notifications?unread_only=1'),
    markAsRead: (id) => api.patch(`/admin/notifications/${id}/read`),
    delete: (id) => api.delete(`/admin/notifications/${id}`),
};

export default notificationAPI;
