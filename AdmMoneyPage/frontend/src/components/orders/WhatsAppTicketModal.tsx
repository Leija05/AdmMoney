import React, { useState } from 'react';
import { MessageCircle, FileText, Check, X, ExternalLink, Download, Sparkles, ShieldCheck } from 'lucide-react';
import { Order, CookieSale } from '../../lib/types';
import { Button } from '../ui/Button';
import { APP_CONFIG } from '../../config/appConfig';

interface WhatsAppTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  sale?: CookieSale | null;
}

export const WhatsAppTicketModal: React.FC<WhatsAppTicketModalProps> = ({
  isOpen,
  onClose,
  order,
  sale,
}) => {
  const [includePdf, setIncludePdf] = useState(true);
  const [customNote, setCustomNote] = useState('');

  const extractDigits = (raw: string) => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('52') && digits.length > 10) {
      digits = digits.slice(2);
    }
    return digits.slice(0, 10);
  };

  // Customer phone initialization (10 digits)
  const initialPhone = order?.customer_phone || '';
  const [phoneDigits, setPhoneDigits] = useState(extractDigits(initialPhone));

  if (!isOpen || (!order && !sale)) return null;

  const isOrder = !!order;
  const targetId = isOrder ? order!.id : sale!.id;
  const customerName = isOrder ? order!.customer_name : sale!.customer_name || 'Cliente';
  const deliveryDate = isOrder ? order!.delivery_date : sale!.sale_date;
  const totalAmount = isOrder ? order!.total_amount : sale!.total_revenue;

  // Items string
  let itemsSummary = '';
  if (isOrder && order?.items) {
    itemsSummary = order.items.map((i) => `• ${i.quantity}x ${i.product_name || (i as any).cookie_name || 'Galleta'}`).join('\n');
  } else if (sale) {
    itemsSummary = `• ${sale.quantity}x ${sale.cookie_name}`;
  }

  // PDF endpoint URL (Secure Cryptographic Token)
  const rootDomain = APP_CONFIG.API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  const encodedNote = customNote.trim() ? `?note=${encodeURIComponent(customNote.trim())}` : '';
  const token = isOrder ? order?.ticket_token : sale?.ticket_token;
  const pdfUrl = token
    ? `${rootDomain}/tickets/${token}${encodedNote}`
    : isOrder
    ? `${rootDomain}/api/orders/${targetId}/pdf${encodedNote}`
    : `${rootDomain}/api/cookies/sales/${targetId}/pdf${encodedNote}`;

  const paymentText = isOrder
    ? `${order?.payment_method || 'Efectivo'}`
    : `${sale?.payment_method || 'Efectivo'}`;

  // Build clean, detailed, and easy-to-read formatted message
  const lines: string[] = [
    `🍪 *Lucky Cookies • Galletas y Postres* 🍪\n`,
    `¡Hola *${customerName}*! Muchas gracias por tu compra. Te compartimos el comprobante de tu ${isOrder ? 'pedido' : 'venta'}:\n`,
    `📋 *Comprobante Oficial • Ticket #${targetId}*`,
    `📅 *Fecha: ${deliveryDate}*`,
    `🍪 *Detalle del Pedido:* ${isOrder && order?.items ? order.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ') : itemsSummary.replace(/^[•\s]+/g, '')}`,
    `💰 *Total a Cobrar:* $${totalAmount.toFixed(2)} MXN`,
    `💳 *Método de Pago:* ${paymentText}`,
  ];

  if (customNote.trim()) {
    lines.push(`\n📝 *Nota:* ${customNote.trim()}`);
  }

  if (includePdf) {
    lines.push(`\n📄 *Descarga tu comprobante oficial en PDF con logo:*\n${pdfUrl}`);
  }

  lines.push(`\n✨ ¡Muchas gracias por tu preferencia y que disfrutes mucho tus galletas! ❤️🍪`);

  const fullMessage = lines.join('\n');

  const handleSendWhatsApp = () => {
    const cleanPhoneDigits = phoneDigits.replace(/\D/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length === 0) {
      alert('⚠️ Por favor ingresa el número de WhatsApp del cliente para poder enviar el ticket.');
      return;
    }
    if (cleanPhoneDigits.length < 10) {
      alert('⚠️ Por favor ingresa los 10 dígitos completos del número telefónico (ej. 55 1234 5678).');
      return;
    }
    const cleanPhone = `52${cleanPhoneDigits}`;
    const encoded = encodeURIComponent(fullMessage);
    const target = `https://wa.me/${cleanPhone}?text=${encoded}`;
    const win = window.open(target, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = target;
    }
    onClose();
  };

  const handleDownloadPdf = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '94%',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '20px',
          background: 'var(--bg-card, #1A1D24)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          padding: '1.5rem',
          color: 'var(--text-main, #FFFFFF)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="/lucky_cookies_logo.png"
              alt="Logo Lucky Cookies"
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #F59E0B' }}
            />
            <div>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#F59E0B', fontWeight: 800, letterSpacing: '0.8px' }}>
                lucky cookies Galletas y postres
              </span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #FFFFFF)' }}>
                Enviar Ticket por WhatsApp
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94A3B8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Phone input with +52 prefix */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #94A3B8)', marginBottom: '0.35rem' }}>
              Número de Teléfono o WhatsApp (10 Dígitos) *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary, #242936)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(37, 211, 102, 0.15)', borderRight: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', fontWeight: 800, fontSize: '0.9rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>+52</span>
              </div>
              <input
                type="text"
                value={phoneDigits}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  if (cleaned.startsWith('52') && cleaned.length > 10) {
                    setPhoneDigits(cleaned.slice(2).slice(0, 10));
                  } else {
                    setPhoneDigits(cleaned.slice(0, 10));
                  }
                }}
                placeholder="55 1234 5678 (10 dígitos)"
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main, #FFFFFF)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim, #64748B)', marginTop: '0.25rem', display: 'block' }}>
              Ingresa el número a 10 dígitos con su lada correspondiente.
            </span>
          </div>

          {/* Toggle PDF Checkbox */}
          <div
            onClick={() => setIncludePdf(!includePdf)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: includePdf ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-tertiary, #242936)',
              border: `1px solid ${includePdf ? '#10B981' : 'var(--border-subtle, rgba(255,255,255,0.1))'}`,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={20} color={includePdf ? '#10B981' : 'var(--text-muted, #94A3B8)'} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: includePdf ? '#10B981' : 'var(--text-main, #FFFFFF)' }}>
                  Generar e Incluir Ticket PDF Oficial
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim, #64748B)' }}>
                  Con logo de Lucky Cookies, desglose y folio único
                </div>
              </div>
            </div>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '6px',
                backgroundColor: includePdf ? '#10B981' : 'transparent',
                border: `2px solid ${includePdf ? '#10B981' : 'var(--border-color, #475569)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {includePdf && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
            </div>
          </div>

          {/* Security Badge Token info */}
          {includePdf && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                color: '#93C5FD',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={16} color="#3B82F6" style={{ flexShrink: 0 }} />
              <span>Enlace Criptográfico Seguro (Token 24 car. • Vigencia 30 días)</span>
            </div>
          )}

          {/* Optional Note Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #94A3B8)', marginBottom: '0.35rem' }}>
              Mensaje Adicional u Opcional
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Escribe agradecimiento, instrucciones o detalles de entrega..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                background: 'var(--bg-tertiary, #242936)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
                color: 'var(--text-main, #FFFFFF)',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* WhatsApp Message Preview Bubble */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #94A3B8)' }}>
                Vista Previa del Mensaje
              </span>
              <button
                type="button"
                onClick={handleDownloadPdf}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3B82F6',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Download size={13} /> Probar Descarga PDF
              </button>
            </div>
            <div
              style={{
                padding: '1rem',
                borderRadius: '14px',
                background: 'rgba(5, 94, 81, 0.22)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                color: '#E2E8F0',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                maxHeight: '160px',
                overflowY: 'auto',
              }}
            >
              {fullMessage}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', paddingTop: '1rem' }}>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60A5FA',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Download size={15} /> Ver PDF
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: '#25D366',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
            }}
          >
            <MessageCircle size={17} /> Confirmar & Enviar WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
