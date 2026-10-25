import { create } from 'zustand';
import { Vibration } from 'react-native';
import { useAppStore } from './app.store';

interface CelebrationPayload {
  title?: string;
  amount?: number;
  subtitle?: string;
}

interface CelebrationStore {
  isOpen: boolean;
  payload: CelebrationPayload | null;
  triggerCelebration: (payload?: CelebrationPayload) => void;
  closeCelebration: () => void;
}

export const useCelebrationStore = create<CelebrationStore>((set) => ({
  isOpen: false,
  payload: null,
  triggerCelebration: (payload = {}) => {
    // Check if user has haptics enabled
    try {
      const hapticsEnabled = useAppStore.getState().hapticsEnabled;
      if (hapticsEnabled) {
        // Luxury double pulse vibration
        Vibration.vibrate([0, 35, 45, 40]);
      }
    } catch {}

    set({
      isOpen: true,
      payload: {
        title: payload.title || '¡Venta Registrada!',
        amount: payload.amount,
        subtitle: payload.subtitle || 'Ingreso sumado a tu Bóveda de Liquidez',
      },
    });
  },
  closeCelebration: () => set({ isOpen: false, payload: null }),
}));

export const triggerSaleCelebration = (amount?: number, title?: string, subtitle?: string) => {
  useCelebrationStore.getState().triggerCelebration({ amount, title, subtitle });
};
