import React from 'react';
import { CheckCircle2, AlertTriangle, Info, AlertOctagon, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-portal-root" aria-live="polite">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isWarning = t.type === 'warning';
        const isError = t.type === 'error';

        const bg = isSuccess
          ? 'var(--pastel-mint-bg)'
          : isWarning
          ? 'var(--pastel-honey-bg)'
          : isError
          ? 'var(--pastel-rose-bg)'
          : 'var(--pastel-blue-bg)';

        const text = isSuccess
          ? 'var(--pastel-mint-text)'
          : isWarning
          ? 'var(--pastel-honey-text)'
          : isError
          ? 'var(--pastel-rose-text)'
          : 'var(--pastel-blue-text)';

        const border = isSuccess
          ? 'var(--pastel-mint-border)'
          : isWarning
          ? 'var(--pastel-honey-border)'
          : isError
          ? 'var(--pastel-rose-border)'
          : 'var(--pastel-blue-border)';

        const Icon = isSuccess
          ? CheckCircle2
          : isWarning
          ? AlertTriangle
          : isError
          ? AlertOctagon
          : Info;

        return (
          <div
            key={t.id}
            className="toast-custom-card"
            style={{
              borderColor: border,
              boxShadow: `0 8px 24px -4px ${border}88, 0 2px 6px rgba(0, 0, 0, 0.04)`
            }}
          >
            {/* Ambient icon badge */}
            <div
              className="toast-icon-badge"
              style={{ background: bg, color: text, borderColor: border }}
            >
              <Icon size={18} />
            </div>

            {/* Content text */}
            <div className="toast-text-content">
              <div className="toast-title" style={{ color: 'var(--text-main)' }}>
                {t.title}
              </div>
              {t.message && (
                <div className="toast-message" style={{ color: 'var(--text-muted)' }}>
                  {t.message}
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => onDismiss(t.id)}
              className="toast-dismiss-btn"
              title="Cerrar notificación"
            >
              <X size={14} />
            </button>

            {/* Micro timer countdown line */}
            <div
              className="toast-countdown-bar"
              style={{
                background: text,
                animationDuration: `${t.duration || 4000}ms`
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
