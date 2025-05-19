import { create } from 'zustand';

/**
 * Global store for ai_CineHub frontend
 * 
 * This store manages shared state across components including:
 * - User role selection
 * - Selected scene/character/location
 * - UI preferences
 * - Filter states
 */
export interface GlobalState {
  // User role
  userRole: 'Director' | 'Producer' | '1st AD' | 'Production Manager' | 'Designer' | 'Screenwriter' | 'Operator';
  
  // Selected items
  selectedScene: any | null;
  selectedCharacter: any | null;
  selectedLocation: any | null;
  
  // UI preferences
  darkMode: boolean;
  highContrast: boolean;
  
  // Filter states
  filters: {
    location: string | null;
    mood: string | null;
    riskLevel: 'low' | 'medium' | 'high' | null;
    character: string | null;
    timeOfDay: 'day' | 'night' | null;
  };
  
  // Actions
  setUserRole: (role: GlobalState['userRole']) => void;
  setSelectedScene: (scene: any | null) => void;
  setSelectedCharacter: (character: any | null) => void;
  setSelectedLocation: (location: any | null) => void;
  toggleDarkMode: () => void;
  toggleHighContrast: () => void;
  setFilter: (key: keyof GlobalState['filters'], value: any) => void;
  resetFilters: () => void;
}

/**
 * Global store implementation using Zustand
 */
const useGlobalStore = create<GlobalState>((set) => ({
  // Initial state
  userRole: 'Director',
  selectedScene: null,
  selectedCharacter: null,
  selectedLocation: null,
  darkMode: false,
  highContrast: true, // Default to high contrast based on user preference
  filters: {
    location: null,
    mood: null,
    riskLevel: null,
    character: null,
    timeOfDay: null,
  },
  
  // Actions
  setUserRole: (role) => set({ userRole: role }),
  
  setSelectedScene: (scene) => set({ selectedScene: scene }),
  
  setSelectedCharacter: (character) => set({ selectedCharacter: character }),
  
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
  
  setFilter: (key, value) => set((state) => ({
    filters: {
      ...state.filters,
      [key]: value
    }
  })),
  
  resetFilters: () => set({
    filters: {
      location: null,
      mood: null,
      riskLevel: null,
      character: null,
      timeOfDay: null,
    }
  })
}));

export default useGlobalStore;
