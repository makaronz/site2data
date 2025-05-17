import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SessionState {
  // Authentication
  isAuthenticated: boolean;
  token: string | null;
  user: {
    id: string;
    username: string;
    email: string;
  } | null;
  
  // Session status
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (token: string, user: SessionState['user']) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    (set) => ({
      // Initial state
      isAuthenticated: false,
      token: null,
      user: null,
      loading: false,
      error: null,
      
      // Actions
      login: (token, user) => set({ 
        isAuthenticated: true, 
        token, 
        user,
        error: null 
      }),
      logout: () => set({ 
        isAuthenticated: false, 
        token: null, 
        user: null 
      }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null })
    }),
    { name: 'session-store' }
  )
);
