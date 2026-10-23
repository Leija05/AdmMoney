import React from 'react';
import { Heart, RefreshCw } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';

interface BackendStatusBannerProps {
  isMockMode?: boolean;
  isOnline: boolean;
  onToggleMockMode?: () => void;
  onRefresh?: () => void;
  customMessage?: string;
}

export const BackendStatusBanner: React.FC<BackendStatusBannerProps> = ({
  isOnline,
  onRefresh,
  customMessage,
}) => {
  const displayText = customMessage
    ? customMessage
    : isOnline
    ? APP_CONFIG.BACKEND_STATUS_MESSAGE_ONLINE
    : APP_CONFIG.BACKEND_STATUS_MESSAGE_OFFLINE;

  return (
    <>
      <style>{`
        @keyframes heartPulse {
          0% {
            transform: scale(1);
          }
          14% {
            transform: scale(1.35);
          }
          28% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.22);
          }
          70% {
            transform: scale(1);
          }
          100% {
            transform: scale(1);
          }
        }
        .beating-heart-icon {
          animation: heartPulse 1.6s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          transform-origin: center;
        }
        .backend-heartbeat-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.38rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid ${isOnline ? 'rgba(74, 222, 128, 0.4)' : 'rgba(244, 63, 94, 0.4)'};
          background: ${isOnline ? 'rgba(34, 197, 94, 0.12)' : 'rgba(244, 63, 94, 0.12)'};
          color: ${isOnline ? '#10B981' : '#F43F5E'};
          box-shadow: 0 1px 4px ${isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'};
        }
        .backend-heartbeat-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 8px ${isOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'};
        }
      `}</style>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <button
          onClick={onRefresh}
          className="backend-heartbeat-btn"
          title={`Estado: ${displayText}. Clic para probar conectividad.`}
        >
          <Heart
            size={14}
            className="beating-heart-icon"
            fill={isOnline ? '#10B981' : '#F43F5E'}
            stroke={isOnline ? '#10B981' : '#F43F5E'}
          />
          <span>{displayText}</span>
        </button>

        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Verificar conexión en vivo con MongoDB Atlas"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'transparent',
              border: '1px solid var(--border-subtle, #E5E7EB)',
              color: 'var(--text-muted, #5E6472)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>
    </>
  );
};
