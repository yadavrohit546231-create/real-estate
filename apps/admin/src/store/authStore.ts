import { create } from 'zustand';
import { UserRole } from '@real-estate/types';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AdminUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem('admin_token');
  const savedUser = localStorage.getItem('admin_user');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken,
    isAuthenticated: !!savedToken,
    setAuth: (user, token) => {
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
