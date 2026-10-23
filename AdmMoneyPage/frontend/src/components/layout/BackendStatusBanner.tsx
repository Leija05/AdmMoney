import React from 'react';
import { Sparkles, Database, Wifi, WifiOff } from 'lucide-react';

interface BackendStatusBannerProps {
  isMockMode: boolean;
  isOnline: boolean;
  onToggleMockMode: () => void;
  onRefresh?: () => void;
}

export const BackendStatusBanner: React.FC<BackendStatusBannerProps> = ({
  isMockMode,
  isOnline,
  onToggleMockMode,
  onRefresh,
}) => {
  const bg = isMockMode ? '#FEF3C7' : isOnline ? '#DCFCE7' : '#FFE4E6';
  const text = isMockMode ? '#92400E' : isOnline ? '#15803D' : '#BE123C';
  const border = isMockMode ? '#FDE68A' : isOnline ? '#BBF7D0' : '#FECDD3';
  const dotColor = isMockMode ? '#D97706' : isOnline ? '#16A34A' : '#E11D48';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      {/* Mode Pill Toggle */}
      <button
        onClick={onToggleMockMode}
        title={
          isMockMode
            ? "Modo Datos de Prueba activo (Demo local). Clic para alternar a MongoDB Atlas en Vivo."
            : "Conectado a MongoDB Atlas en Vivo. Clic para alternar a Modo Demo local."
        }
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.4rem 0.85rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          background: bg,
          color: text,
          border: `1px solid ${border}`,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: dotColor,
          }}
        />

        {isMockMode ? (
          <>
            <Sparkles size={13} />
            <span>Datos Demo</span>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px',
                background: 'rgba(0, 0, 0, 0.06)',
                color: text,
                marginLeft: '0.2rem',
              }}
            >
              Mock
            </span>
          </>
        ) : (
          <>
            <Database size={13} />
            <span>MongoDB Atlas</span>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px',
                background: 'rgba(0, 0, 0, 0.06)',
                color: text,
                marginLeft: '0.2rem',
              }}
            >
              {isOnline ? 'En Vivo' : 'Offline'}
            </span>
          </>
        )}
      </button>

      {/* Sync / Refresh Button if in real mode */}
      {!isMockMode && onRefresh && (
        <button
          onClick={onRefresh}
          title="Verificar conexión con MongoDB Atlas / FastAPI"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            color: '#5E6472',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
        >
          {isOnline ? <Wifi size={13} color="#15803D" /> : <WifiOff size={13} color="#BE123C" />}
        </button>
      )}
    </div>
  );
};
