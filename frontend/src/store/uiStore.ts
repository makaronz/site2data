import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // Theme
  darkMode: boolean;
  
  // Language
  language: 'en' | 'pl';
  
  // UI state
  sidebarOpen: boolean;
  activeSection: string;
  
  // Notifications
  notifications: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    timestamp: number;
  }[];
  
  // Actions
  setDarkMode: (darkMode: boolean) => void;
  setLanguage: (language: 'en' | 'pl') => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveSection: (section: string) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      language: navigator.language.startsWith('pl') ? 'pl' : 'en',
      sidebarOpen: true,
      activeSection: 'dashboard',
      notifications: [],
      
      // Actions
      setDarkMode: (darkMode) => set({ darkMode }),
      setLanguage: (language) => set({ language }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setActiveSection: (activeSection) => set({ activeSection }),
      addNotification: (notification) => set((state) => ({
        notifications: [
          ...state.notifications,
          {
            ...notification,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now()
          }
        ]
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),
      clearNotifications: () => set({ notifications: [] })
    }),
    { name: 'ui-store' }
  )
);
