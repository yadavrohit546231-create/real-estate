import { create } from 'zustand';
import { UserRole } from '@real-estate/types';
import { setApiAuthToken } from '../services/api';

export interface MobileUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
}

interface AppState {
  user: MobileUser | null;
  token: string | null;
  selectedCity: string;
  userLocation: { latitude: number; longitude: number } | null;
  favorites: string[]; // array of property IDs
  postPropertyDraft: Record<string, any>;
  setCity: (city: string) => void;
  setUserLocation: (loc: { latitude: number; longitude: number } | null) => void;
  setUser: (user: MobileUser | null, token?: string | null) => void;
  logout: () => void;
  toggleFavorite: (propertyId: string) => void;
  setFavorites: (propertyIds: string[]) => void;
  updateDraft: (data: Record<string, any>) => void;
  clearDraft: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: null,
  selectedCity: 'All Cities',
  userLocation: null,
  favorites: [],
  postPropertyDraft: {},
  setCity: (city: string) => set({ selectedCity: city }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setUser: (user, token) => {
    if (token !== undefined) {
      setApiAuthToken(token);
      set({ user, token });
    } else {
      set((state) => ({ user, token: state.token }));
    }
  },
  logout: () => {
    setApiAuthToken(null);
    set({ user: null, token: null, favorites: [] });
  },
  toggleFavorite: (propertyId: string) =>
    set((state) => ({
      favorites: state.favorites.includes(propertyId)
        ? state.favorites.filter((id) => id !== propertyId)
        : [...state.favorites, propertyId],
    })),
  setFavorites: (propertyIds) => set({ favorites: propertyIds }),
  updateDraft: (data) =>
    set((state) => ({
      postPropertyDraft: { ...state.postPropertyDraft, ...data },
    })),
  clearDraft: () => set({ postPropertyDraft: {} }),
}));
