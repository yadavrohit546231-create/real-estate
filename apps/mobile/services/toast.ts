import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  currentToast: ToastItem | null;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

let toastIdCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  currentToast: null,
  show: (message: string, type: ToastType = 'info') => {
    const newToast: ToastItem = {
      id: ++toastIdCounter,
      message,
      type,
    };
    set({ currentToast: newToast });
  },
  hide: () => {
    set({ currentToast: null });
  },
}));

export function showToast(message: string, type: ToastType = 'info') {
  useToastStore.getState().show(message, type);
}
