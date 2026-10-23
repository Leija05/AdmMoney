import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react';

export interface ConfirmData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: ConfirmData | null;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  data
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        data?.onCancel?.();
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, data]);

  if (!isOpen || !data) return null;

  const isDanger = data.type === 'danger' || !data.type;
  const isWarning = data.type === 'warning';

  const iconBg = isDanger
    ? 'var(--pastel-rose-bg)'
    : isWarning
    ? 'var(--pastel-honey-bg)'
    : 'var(--pastel-blue-bg)';

  const iconText = isDanger
    ? 'var(--pastel-rose-text)'
    : isWarning
    ? 'var(--pastel-honey-text)'
    : 'var(--pastel-blue-text)';

  const iconBorder = isDanger
    ? 'var(--pastel-rose-border)'
    : isWarning
    ? 'var(--pastel-honey-border)'
    : 'var(--pastel-blue-border)';

  const Icon = isDanger ? Trash2 : isWarning ? AlertTriangle : HelpCircle;

  const handleConfirm = () => {
    data.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    data.onCancel?.();
    onClose();
  };

  return (
    <div className="confirm-backdrop" onClick={handleCancel}>
      <div
        className="confirm-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="confirm-header">
          <div className="confirm-eyebrow">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: iconText
              }}
            />
            <span>ACCIÓN CRÍTICA REQUERIDA</span>
          </div>

          <button
            onClick={handleCancel}
            className="confirm-close-btn"
            title="Cancelar y cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="confirm-body">
          <div className="confirm-icon-row">
            <div
              className="confirm-orb"
              style={{
                background: iconBg,
                color: iconText,
                borderColor: iconBorder
              }}
            >
              <Icon size={24} />
            </div>

            <div className="confirm-headings">
              <h3 className="confirm-title">{data.title}</h3>
              <p className="confirm-subtitle">{data.message}</p>
            </div>
          </div>
        </div>

        <div className="confirm-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
          >
            {data.cancelText || 'Cancelar'}
          </button>

          <button
            type="button"
            className={isDanger ? 'btn btn-rose' : 'btn btn-primary'}
            onClick={handleConfirm}
            style={{ fontWeight: 700 }}
          >
            {data.confirmText || (isDanger ? 'Sí, Eliminar' : 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
};
