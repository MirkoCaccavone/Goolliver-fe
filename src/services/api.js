import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: false,
});

// Interceptor per gestire errori globali
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token scaduto o non valido
            localStorage.removeItem('goolliver-auth');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Funzioni helper per le API
export const authAPI = {
    login: (credentials) => api.post('/login', credentials),
    register: (userData) => api.post('/register', userData),
    logout: () => api.post('/logout'),
    getUser: () => api.get('/user'),
};

export const contestAPI = {
    getAll: () => api.get('/contests'),
    getById: (id) => api.get(`/contests/${id}`),
    getEntries: (id) => api.get(`/contests/${id}/entries`),
    create: (contestData) => api.post('/contests', contestData),
    update: (id, contestData) => api.put(`/contests/${id}`, contestData),
    delete: (id) => api.delete(`/contests/${id}`),
};

export const photoAPI = {
    upload: (formData) => api.post('/photos/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    getUserPhotos: () => api.get('/photos/user/my-photos'),
    getUserCredits: () => api.get('/photos/user/credits'),
    getGallery: (contestId) => api.get(`/photos/contest/${contestId}/gallery`),
    getModerationStatus: (entryId) => api.get(`/photos/${entryId}/moderation-status`),
    update: (entryId, data) => api.put(`/photos/${entryId}`, data),
    delete: (entryId) => api.delete(`/photos/${entryId}`),
};

export const voteAPI = {
    getLeaderboard: (contestId) => api.get(`/votes/contests/${contestId}/leaderboard`),
    getUserVoteStatus: (contestId) => api.get(`/votes/contests/${contestId}/user-vote-status`),
    toggleLike: (entryId) => api.post(`/votes/entries/${entryId}/like`),
    getVoteStats: (entryId) => api.get(`/votes/entries/${entryId}/stats`),
    vote: (voteData) => api.post('/votes', voteData),
};

export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getUsers: () => api.get('/admin/users'),
    updateUserRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),
    toggleUserStatus: (userId) => api.patch(`/admin/users/${userId}/status`),
    getModeration: () => api.get('/admin/moderation/entries'),
    moderateEntry: (entryId, action, reason) => api.patch(`/admin/moderation/entries/${entryId}/moderate`, {
        action,
        reason
    }),
    getContests: () => api.get('/admin/contests'),
    getContestDetails: (contestId) => api.get(`/admin/contests/${contestId}/details`),
    getCreditAnalytics: () => api.get('/admin/credits/analytics'),
};

export default api;