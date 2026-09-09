import { create } from 'zustand';
import { Platform, ToastAndroid } from 'react-native';

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
    // Show native Android Toast if on Android
    if (Platform.OS === 'android') {
      try {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } catch {
        // Ignore native toast error if any
      }
    }

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
