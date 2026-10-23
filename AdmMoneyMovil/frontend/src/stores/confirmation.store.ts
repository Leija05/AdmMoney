import { create } from 'zustand';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
}

interface ConfirmationState {
  isOpen: boolean;
  options: ConfirmationOptions | null;
  isLoading: boolean;
  openConfirm: (options: ConfirmationOptions) => void;
  closeConfirm: () => void;
  executeConfirm: () => Promise<void>;
}

export const useConfirmationStore = create<ConfirmationState>((set, get) => ({
  isOpen: false,
  options: null,
  isLoading: false,
  openConfirm: (options) => set({ isOpen: true, options, isLoading: false }),
  closeConfirm: () => {
    const { options } = get();
    options?.onCancel?.();
    set({ isOpen: false, options: null, isLoading: false });
  },
  executeConfirm: async () => {
    const { options } = get();
    if (!options) return;
    try {
      set({ isLoading: true });
      await options.onConfirm();
      set({ isOpen: false, options: null, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },
}));

export const confirmAction = (options: ConfirmationOptions) => {
  useConfirmationStore.getState().openConfirm(options);
};
