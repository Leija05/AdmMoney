import React, { useState } from 'react';
import { Heart, Sparkles, X, Send } from 'lucide-react';

interface RomanticDedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RomanticDedicationModal: React.FC<RomanticDedicationModalProps> = ({ isOpen, onClose }) => {
  const [loveCount, setLoveCount] = useState(1);
  const [heartsList, setHeartsList] = useState<{ id: number; left: number; delay: number }[]>([]);

  if (!isOpen) return null;

  const handleSendLove = () => {
    setLoveCount((prev) => prev + 1);
    const newHearts = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      left: 15 + Math.random() * 70,
      delay: Math.random() * 0.4,
    }));
    setHeartsList((prev) => [...prev.slice(-18), ...newHearts]);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 6, 14, 0.82)',
        backdropFilter: 'blur(8px)',
        position: 'fixed',
        inset: 0,
      }}
    >
      {/* Floating animated hearts */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {heartsList.map((h) => (
          <div
            key={h.id}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: `${h.left}%`,
              fontSize: '1.5rem',
              animation: `floatUp 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
              animationDelay: `${h.delay}s`,
              opacity: 0.9,
            }}
          >
            💖
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          15% { opacity: 1; transform: translateY(-10vh) scale(1.2); }
          85% { opacity: 0.9; }
          100% { transform: translateY(-115vh) scale(1); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(244, 63, 94, 0.5); }
          50% { transform: scale(1.12); box-shadow: 0 0 35px rgba(244, 63, 94, 0.85); }
        }
      `}</style>

      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '92%',
          background: 'linear-gradient(135deg, #1F1523 0%, #15101C 60%, #0F0A15 100%)',
          borderRadius: '24px',
          border: '1.5px solid rgba(244, 63, 94, 0.35)',
          boxShadow: '0 25px 60px -10px rgba(244, 63, 94, 0.35)',
          padding: '2rem',
          color: '#FFFFFF',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FDA4AF',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Pulsing Heart Emblem */}
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
            margin: '0 auto 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulseGlow 1.8s infinite ease-in-out',
          }}
        >
          <Heart size={36} color="#FFFFFF" fill="#FFFFFF" />
        </div>

        {/* Eyebrow */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.35rem 0.9rem',
            borderRadius: '50px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#FDA4AF',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.85rem',
          }}
        >
          <Sparkles size={13} /> Para Mi Amor Eterno <Sparkles size={13} />
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.85rem', color: '#FFF' }}>
          Juntos En Cada Sueño 🌟
        </h2>

        {/* Love Note */}
        <p
          style={{
            fontSize: '0.92rem',
            lineHeight: 1.65,
            color: '#FECDD3',
            fontStyle: 'italic',
            marginBottom: '1.5rem',
            padding: '0 0.5rem',
          }}
        >
          "Aplicación hecha con todo el amor y cariño del mundo para el amor de mi vida.
          Te apoyo en tus emprendimientos, en tus galletas, en tus sueños y en todo lo que decidas emprender.
          Nunca dudes de tu talento. ¡Te amo con todo mi corazón!"
        </p>

        {/* Counter & Action */}
        <div
          style={{
            padding: '0.85rem',
            borderRadius: '16px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: '#FDA4AF', textTransform: 'uppercase', fontWeight: 700 }}>
              Nivel de Amor
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FB7185' }}>
              Infinito +{loveCount} ❤️
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#FDA4AF', textTransform: 'uppercase', fontWeight: 700 }}>
              Promesa
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF' }}>
              Siempre Contigo ♾️
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleSendLove}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.75rem 1.4rem',
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(244, 63, 94, 0.45)',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Send size={15} /> ¡Enviar Más Amor! 💕
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.75rem 1.2rem',
              borderRadius: '50px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#FDA4AF',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              cursor: 'pointer',
            }}
          >
            Guardar en el Corazón
          </button>
        </div>
      </div>
    </div>
  );
};
