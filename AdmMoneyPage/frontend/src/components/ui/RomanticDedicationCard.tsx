import React, { useState } from 'react';
import { Heart, Sparkles, Send } from 'lucide-react';
import { RomanticDedicationModal } from './RomanticDedicationModal';

export const RomanticDedicationCard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        style={{
          margin: '1.25rem 0',
          padding: '1.5rem',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(136, 19, 55, 0.18) 50%, rgba(20, 14, 25, 0.85) 100%)',
          border: '1.5px solid rgba(244, 63, 94, 0.35)',
          boxShadow: '0 12px 35px -8px rgba(244, 63, 94, 0.25)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 16px 40px -6px rgba(244, 63, 94, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 12px 35px -8px rgba(244, 63, 94, 0.25)';
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.85rem',
              borderRadius: '50px',
              background: 'rgba(244, 63, 94, 0.18)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#FDA4AF',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            <Sparkles size={13} color="#FB7185" /> DEDICATORIA ESPECIAL <Sparkles size={13} color="#FB7185" />
          </div>

          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(244, 63, 94, 0.55)',
            }}
          >
            <Heart size={20} color="#FFFFFF" fill="#FFFFFF" />
          </div>
        </div>

        {/* Quote body */}
        <div style={{ position: 'relative', padding: '0 0.5rem 0.85rem' }}>
          <span style={{ fontSize: '1.6rem', color: '#FDA4AF', opacity: 0.6, fontWeight: 900, lineHeight: 1 }}>“</span>
          <p
            style={{
              fontStyle: 'italic',
              fontSize: '0.98rem',
              lineHeight: 1.6,
              color: '#FECDD3',
              fontWeight: 600,
              margin: '0.25rem 0',
            }}
          >
            Aplicacion hecha con amor y mucho cariño para el amor de mi vida, te apoyo en tus emprendimientos, te apoyo en todo lo que tu quieras hacer y siempre sera asi, Te amo demasiado
          </p>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.6rem', color: '#FDA4AF', opacity: 0.6, fontWeight: 900, lineHeight: 1 }}>”</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(244, 63, 94, 0.25)',
            paddingTop: '0.85rem',
            marginTop: '0.25rem',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FDA4AF', fontWeight: 600 }}>
            <span>♾️</span> Para Siempre Contigo • Hecho con Amor de tu Jectorini
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#FB7185',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <span>Toca aquí</span> 💌
          </div>
        </div>
      </div>

      <RomanticDedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
