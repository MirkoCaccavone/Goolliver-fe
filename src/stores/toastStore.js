import { create } from 'zustand';

export const useToastStore = create((set) => ({
    toast: { message: '', type: 'info', visible: false, duration: 4000 },
    showToast: (message, type = 'info', duration = 4000) =>
        set({ toast: { message, type, visible: true, duration } }),
    hideToast: () => set((state) => ({ toast: { ...state.toast, visible: false } })),
}));
