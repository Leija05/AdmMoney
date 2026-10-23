import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ToastContainer, ToastItem } from '../components/ui/ToastContainer';
import { ExceptionModal, ExceptionData } from '../components/ui/ExceptionModal';
import { ConfirmDialog, ConfirmData } from '../components/ui/ConfirmDialog';

interface NotificationContextValue {
  notifySuccess: (title: string, message?: string, duration?: number) => void;
  notifyError: (title: string, message?: string, duration?: number) => void;
  notifyWarning: (title: string, message?: string, duration?: number) => void;
  notifyInfo: (title: string, message?: string, duration?: number) => void;
  showException: (data: ExceptionData) => void;
  showConfirm: (data: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [exceptionData, setExceptionData] = useState<ExceptionData | null>(null);
  const [isExceptionOpen, setIsExceptionOpen] = useState(false);

  const [confirmData, setConfirmData] = useState<ConfirmData | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);

  // --- TOAST ACTIONS ---
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastItem['type'], title: string, message?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastItem = { id, type, title, message, duration };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }, [dismissToast]);

  const notifySuccess = useCallback((title: string, message?: string, duration?: number) => {
    addToast('success', title, message, duration);
  }, [addToast]);

  const notifyError = useCallback((title: string, message?: string, duration?: number) => {
    addToast('error', title, message, duration);
  }, [addToast]);

  const notifyWarning = useCallback((title: string, message?: string, duration?: number) => {
    addToast('warning', title, message, duration);
  }, [addToast]);

  const notifyInfo = useCallback((title: string, message?: string, duration?: number) => {
    addToast('info', title, message, duration);
  }, [addToast]);

  // --- EXCEPTION MODAL ACTIONS ---
  const showException = useCallback((data: ExceptionData) => {
    setExceptionData(data);
    setIsExceptionOpen(true);
  }, []);

  const closeException = useCallback(() => {
    setIsExceptionOpen(false);
  }, []);

  // --- CONFIRM DIALOG ACTIONS ---
  const showConfirm = useCallback((data: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmData({
        ...data,
        onConfirm: () => {
          if (confirmResolverRef.current) {
            confirmResolverRef.current(true);
            confirmResolverRef.current = null;
          }
          setIsConfirmOpen(false);
        },
        onCancel: () => {
          if (confirmResolverRef.current) {
            confirmResolverRef.current(false);
            confirmResolverRef.current = null;
          }
          setIsConfirmOpen(false);
        }
      });
      setIsConfirmOpen(true);
    });
  }, []);

  const closeConfirm = useCallback(() => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(false);
      confirmResolverRef.current = null;
    }
    setIsConfirmOpen(false);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyInfo,
        showException,
        showConfirm
      }}
    >
      {children}

      {/* Global Custom Portals */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ExceptionModal isOpen={isExceptionOpen} onClose={closeException} data={exceptionData} />
      <ConfirmDialog isOpen={isConfirmOpen} onClose={closeConfirm} data={confirmData} />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};
