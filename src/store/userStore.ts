import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  name: string;
  email: string;
  rank?: number;
  category?: string;
  preferredBranch?: string;
  district?: string;
  source?: string;
  isProfileComplete: boolean;
  joinedAt?: string;
}

export interface SavedPrediction {
  id: string;
  rank: number;
  category: string;
  quota: string;
  focus: string;
  timestamp: number;
}

interface Preferences {
  darkMode: boolean;
  emailAlerts: boolean;
}

interface UserState {
  user: UserProfile | null;
  favorites: string[]; // Store institute names or specific IDs
  savedPredictions: SavedPrediction[];
  preferences: Preferences;
  login: (user: Partial<UserProfile>) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  toggleFavorite: (institute: string) => void;
  savePrediction: (prediction: Omit<SavedPrediction, 'id' | 'timestamp'>) => void;
  updatePreferences: (prefs: Partial<Preferences>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      favorites: [],
      savedPredictions: [],
      preferences: { darkMode: true, emailAlerts: false },
      login: (userData) => 
        set({ 
          user: { 
            name: userData.name || '', 
            email: userData.email || '', 
            isProfileComplete: userData.isProfileComplete || false,
            joinedAt: userData.joinedAt || new Date().toISOString()
          } as UserProfile 
        }),
      logout: () => set({ user: null, favorites: [], savedPredictions: [] }),
      updateProfile: (data) => 
        set((state) => ({
          user: state.user ? { ...state.user, ...data, isProfileComplete: true } : null
        })),
      toggleFavorite: (institute) =>
        set((state) => {
          const isFav = state.favorites.includes(institute);
          return {
            favorites: isFav
              ? state.favorites.filter((fav) => fav !== institute)
              : [...state.favorites, institute]
          };
        }),
      savePrediction: (prediction) =>
        set((state) => ({
          savedPredictions: [
            { ...prediction, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() },
            ...state.savedPredictions
          ]
        })),
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs }
        })),
    }),
    {
      name: 'wbjee-user-storage',
    }
  )
);
