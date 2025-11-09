import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  setAuthenticated: (authenticated: boolean, userId?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,
  setAuthenticated: (authenticated: boolean, userId?: string) =>
    set({ isAuthenticated: authenticated, userId: userId || null }),
  clearAuth: () => set({ isAuthenticated: false, userId: null }),
}));
