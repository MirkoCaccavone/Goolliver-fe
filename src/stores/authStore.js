import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
    persist(
        (set, get) => ({
            // State
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,

            // Actions
            login: async (credentials) => {
                try {
                    const response = await api.post('/login', credentials);
                    const { user, token } = response.data;

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    // Imposta il token per le future richieste
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    return { success: true, user };
                } catch (error) {
                    console.error('Login error:', error);
                    return {
                        success: false,
                        error: error.response?.data?.message || 'Errore durante il login'
                    };
                }
            },

            register: async (userData) => {
                try {
                    const response = await api.post('/register', userData);
                    const { user, token } = response.data;

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    return { success: true, user };
                } catch (error) {
                    console.error('Register error:', error);
                    return {
                        success: false,
                        error: error.response?.data?.message || 'Errore durante la registrazione'
                    };
                }
            },

            logout: async () => {
                try {
                    await api.post('/logout');
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });

                    delete api.defaults.headers.common['Authorization'];
                }
            },

            checkAuth: async () => {
                const { token } = get();

                if (!token) {
                    set({ isLoading: false });
                    return;
                }

                try {
                    // Imposta il token per la verifica
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    // Verifica se il token è ancora valido facendo una richiesta di test
                    const response = await api.get('/user');
                    const user = response.data;

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    console.error('Auth check error:', error);
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                    delete api.defaults.headers.common['Authorization'];
                }
            },

            updateUser: (userData) => {
                set((state) => ({
                    user: { ...state.user, ...userData }
                }));
            },

            // Initialize store
            initialize: () => {
                get().checkAuth();
            },
        }),
        {
            name: 'goolliver-auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                token: state.token,
                user: state.user
            }),
        }
    )
);

export { useAuthStore };