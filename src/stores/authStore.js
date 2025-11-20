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
            isLoading: false,

            // Actions
            setAuth: (user, token) => {
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                });

                // Imposta il token per le future richieste
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            },

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
                    // Gestione errori specifici  
                    if (error.response) {
                        const status = error.response.status;
                        const data = error.response.data;

                        // Usa sempre il messaggio dal backend se disponibile
                        const backendMessage = data.message;

                        if (status === 422) {
                            // Errori di validazione
                            return {
                                success: false,
                                error: backendMessage || 'Dati non validi. Controlla i campi.',
                                validationErrors: data.errors
                            };
                        } else if (status === 401) {
                            // Credenziali errate
                            return {
                                success: false,
                                error: backendMessage || 'Email o password non corretti'
                            };
                        } else if (status === 400) {
                            // Account social o altri errori
                            return {
                                success: false,
                                error: backendMessage || 'Errore nella richiesta'
                            };
                        } else if (status === 429) {
                            // Too many attempts
                            return {
                                success: false,
                                error: 'Troppi tentativi di login. Riprova tra qualche minuto.'
                            };
                        } else {
                            return {
                                success: false,
                                error: backendMessage || 'Errore durante il login'
                            };
                        }
                    } else if (error.request) {
                        // Errore di rete
                        return {
                            success: false,
                            error: 'Errore di connessione. Controlla la tua connessione internet.'
                        };
                    } else {
                        return {
                            success: false,
                            error: 'Errore imprevisto durante il login'
                        };
                    }
                }
            },

            register: async (name, email, password, password_confirmation, phone) => {
                try {
                    const userData = {
                        name,
                        email,
                        password,
                        password_confirmation,
                        phone: phone || null
                    };

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

                    // Gestione errori specifici
                    if (error.response) {
                        const status = error.response.status;
                        const data = error.response.data;

                        if (status === 422) {
                            // Errori di validazione
                            let errorMessage = 'Errori nei dati inseriti:';

                            if (data.errors) {
                                const errorMessages = [];

                                if (data.errors.name) {
                                    errorMessages.push('Nome: ' + data.errors.name[0]);
                                }
                                if (data.errors.email) {
                                    errorMessages.push('Email: ' + data.errors.email[0]);
                                }
                                if (data.errors.password) {
                                    errorMessages.push('Password: ' + data.errors.password[0]);
                                }
                                if (data.errors.phone) {
                                    errorMessages.push('Telefono: ' + data.errors.phone[0]);
                                }

                                if (errorMessages.length > 0) {
                                    errorMessage = errorMessages.join(' • ');
                                }
                            }

                            return {
                                success: false,
                                error: errorMessage,
                                validationErrors: data.errors
                            };
                        } else if (status === 409) {
                            // Email già esistente
                            return {
                                success: false,
                                error: 'Questa email è già registrata. Prova ad accedere o usa un\'altra email.'
                            };
                        } else {
                            return {
                                success: false,
                                error: data.message || 'Errore durante la registrazione'
                            };
                        }
                    } else if (error.request) {
                        // Errore di rete
                        return {
                            success: false,
                            error: 'Errore di connessione. Controlla la tua connessione internet.'
                        };
                    } else {
                        return {
                            success: false,
                            error: 'Errore imprevisto durante la registrazione'
                        };
                    }
                }
            },

            // Social Login
            socialLogin: async (provider) => {
                try {
                    // Redirect alla URL di autorizzazione social
                    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
                    window.location.href = `${baseUrl}/auth/${provider}/redirect`;
                } catch (error) {
                    console.error(`${provider} login error:`, error);
                    return {
                        success: false,
                        error: `Errore durante l'accesso con ${provider}`
                    };
                }
            },

            handleSocialCallback: async (provider, code) => {
                try {
                    const response = await api.post(`/auth/${provider}/callback`, { code });
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
                    console.error(`${provider} callback error:`, error);
                    return {
                        success: false,
                        error: error.response?.data?.message || `Errore durante l'autorizzazione ${provider}`
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
                    const userData = response.data.user; // L'API risponde con { user: userData }

                    set({
                        user: userData,
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

            forgotPassword: async (email) => {
                try {
                    const response = await api.post('/forgot-password', { email });
                    return {
                        success: true,
                        message: response.data.message,
                        testResetUrl: response.data.test_reset_url
                    };
                } catch (error) {
                    console.error('Forgot password error:', error);

                    if (error.response) {
                        const status = error.response.status;
                        const data = error.response.data;

                        return {
                            success: false,
                            error: data.message || 'Errore durante la richiesta di reset',
                            validationErrors: data.errors
                        };
                    }

                    return {
                        success: false,
                        error: 'Errore di connessione. Riprova più tardi.'
                    };
                }
            },

            resetPassword: async (email, token, password, password_confirmation) => {
                try {
                    const response = await api.post('/reset-password', {
                        email,
                        token,
                        password,
                        password_confirmation
                    });

                    return {
                        success: true,
                        message: response.data.message
                    };
                } catch (error) {
                    console.error('Reset password error:', error);

                    if (error.response) {
                        const status = error.response.status;
                        const data = error.response.data;

                        return {
                            success: false,
                            error: data.message || 'Errore durante il reset della password',
                            validationErrors: data.errors
                        };
                    }

                    return {
                        success: false,
                        error: 'Errore di connessione. Riprova più tardi.'
                    };
                }
            },

            updateUser: (userData) => {
                set((state) => {
                    const updatedUser = { ...state.user, ...userData };
                    // Aggiorna anche lo storage persistente
                    localStorage.setItem('goolliver-auth', JSON.stringify({
                        state: {
                            ...state,
                            user: updatedUser
                        }
                    }));
                    return { user: updatedUser };
                });
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
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
            onRehydrateStorage: () => (state) => {
                // Quando lo store viene riidratato, controlla l'auth
                if (state && state.token && state.user) {
                    state.isAuthenticated = true;
                    state.isLoading = false;
                    // Imposta il token nell'API
                    api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
                } else {
                    state.isAuthenticated = false;
                    state.isLoading = false;
                }
            }
        }
    )
);

export { useAuthStore };