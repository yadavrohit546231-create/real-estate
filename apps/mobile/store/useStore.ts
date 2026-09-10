import { create } from 'zustand';
import { UserRole } from '@real-estate/types';
import { mobileApi, setApiAuthToken } from '../services/api';

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
  toggleFavorite: (propertyId: string) => Promise<boolean>;
  setFavorites: (propertyIds: string[]) => void;
  fetchFavorites: () => Promise<void>;
  updateDraft: (data: Record<string, any>) => void;
  clearDraft: () => void;
}

export const useStore = create<AppState>((set, get) => ({
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

    if (user) {
      get().fetchFavorites();
    } else {
      set({ favorites: [] });
    }
  },
  logout: () => {
    setApiAuthToken(null);
    set({ user: null, token: null, favorites: [] });
  },
  toggleFavorite: async (propertyId: string) => {
    const state = get();
    const isCurrentlyFav = state.favorites.includes(propertyId);
    const newFavorites = isCurrentlyFav
      ? state.favorites.filter((id) => id !== propertyId)
      : [...state.favorites, propertyId];

    // Optimistic UI update
    set({ favorites: newFavorites });

    // Sync with backend API if user is authenticated
    if (state.user) {
      try {
        if (isCurrentlyFav) {
          await mobileApi(`/favorites/${propertyId}`, { method: 'DELETE' });
        } else {
          await mobileApi(`/favorites/${propertyId}`, { method: 'POST' });
        }
        return !isCurrentlyFav;
      } catch (err) {
        console.error('Failed to sync favorite with server:', err);
        // Rollback on server error
        set({ favorites: state.favorites });
        throw err;
      }
    }

    return !isCurrentlyFav;
  },
  setFavorites: (propertyIds) => set({ favorites: propertyIds }),
  fetchFavorites: async () => {
    const { user } = get();
    if (!user) {
      set({ favorites: [] });
      return;
    }
    try {
      const res = await mobileApi('/favorites');
      if (res?.data && Array.isArray(res.data)) {
        const ids = res.data.map((item: any) => item.id).filter(Boolean);
        set({ favorites: ids });
      }
    } catch (err) {
      console.log('Error fetching user favorites:', err);
    }
  },
  updateDraft: (data) =>
    set((state) => ({
      postPropertyDraft: { ...state.postPropertyDraft, ...data },
    })),
  clearDraft: () => set({ postPropertyDraft: {} }),
}));
