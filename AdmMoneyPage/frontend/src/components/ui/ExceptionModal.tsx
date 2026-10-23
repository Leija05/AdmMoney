import React, { useState, useEffect } from 'react';
import { AlertOctagon, X, ChevronDown, ChevronUp, Copy, Check, RefreshCw, Terminal } from 'lucide-react';

export interface ExceptionData {
  title: string;
  message: string;
  technicalDetail?: string;
  code?: string | number;
  onRetry?: () => void;
  actionLabel?: string;
}

interface ExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExceptionData | null;
}

export const ExceptionModal: React.FC<ExceptionModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
      setShowTechnical(false);
      setCopied(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const handleCopy = () => {
    const textToCopy = `[EXCEPCIÓN ADM-MONEY]
Fecha: ${new Date().toISOString()}
Título: ${data.title}
Mensaje: ${data.message}
Código: ${data.code || 'N/A'}
Detalle Técnico:
${data.technicalDetail || 'Sin stack trace disponible.'}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="exception-backdrop" onClick={onClose}>
      <div
        className="exception-card"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        {/* Top Eyebrow Header */}
        <div className="exception-header">
          <div className="exception-eyebrow">
            <span className="exception-pulse-dot" />
            <span>PROTOCOLO EXCEPCIÓN // ADM-MONEY</span>
            {data.code && (
              <span className="exception-code-badge">HTTP {data.code}</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="exception-close-btn"
            title="Cerrar ventana de excepción"
          >
            <X size={16} />
          </button>
        </div>

        {/* Hero Visual & Core Description */}
        <div className="exception-body">
          <div className="exception-icon-row">
            <div className="exception-orb">
              <AlertOctagon size={28} />
            </div>

            <div className="exception-headings">
              <h2 className="exception-title">{data.title}</h2>
              <p className="exception-subtitle">{data.message}</p>
            </div>
          </div>

          {/* Technical Diagnostics Accordion */}
          {data.technicalDetail && (
            <div className="exception-tech-container">
              <button
                type="button"
                className="exception-tech-toggle"
                onClick={() => setShowTechnical(!showTechnical)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Terminal size={14} color="var(--pastel-rose-text)" />
                  <span>Diagnóstico Técnico del Servidor</span>
                </div>
                {showTechnical ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showTechnical && (
                <div className="exception-tech-details">
                  <div className="exception-tech-header">
                    <span>STACK TRACE / PAYLOAD RAW</span>
                    <button
                      type="button"
                      className="exception-copy-btn"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <>
                          <Check size={12} color="#10b981" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copiar Trazabilidad</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="exception-code-block">
                    <code>{data.technicalDetail}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="exception-footer">
          {data.onRetry && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                data.onRetry?.();
                onClose();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} />
              <span>{data.actionLabel || 'Reintentar Operación'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-rose"
            onClick={onClose}
            style={{ fontWeight: 700 }}
          >
            Entendido, Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
