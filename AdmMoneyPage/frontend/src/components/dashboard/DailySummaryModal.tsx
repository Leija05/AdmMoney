import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Package,
  Receipt,
  ArrowRightLeft,
  FileText,
  Share2,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { DailySummary } from '../../lib/types';
import { ApiService } from '../../services/api.service';

interface DailySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: DailySummary;
  businessName?: string;
}

export const DailySummaryModal: React.FC<DailySummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  businessName = 'Lucky Cookies'
}) => {
  const handleShareWhatsApp = () => {
    const lines = [
      `RESUMEN DEL DÍA - ${businessName.toUpperCase()}`,
      `Fecha: ${summary.date}`,
      '----------------------------------------',
      `Ventas Totales: $${summary.total_revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
      `Ganancia Neta: $${summary.net_profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (${summary.profit_margin_pct.toFixed(1)}%)`,
      `Piezas Vendidas: ${summary.total_units_sold} piezas`,
      `Tickets Cobrados: ${summary.sales_count}`,
      `Ticket Promedio: $${summary.average_ticket.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
      '',
      'MÉTODOS DE PAGO:',
      `• Efectivo: $${summary.cash_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
      `• Transferencia: $${summary.transfer_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
    ];

    if (summary.expenses_cash > 0) {
      lines.push(
        `• Gastos en efectivo: -$${summary.expenses_cash.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
        `• Balance en efectivo: $${summary.cash_balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
      );
    }

    if (summary.products && summary.products.length > 0) {
      lines.push('', 'PRODUCTOS VENDIDOS:');
      for (const p of summary.products) {
        lines.push(`• ${p.quantity}x ${p.name}: $${p.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      }
    }

    lines.push('----------------------------------------', 'Generado desde Adm Money');

    const msg = lines.join('\n');
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleOpenPdf = () => {
    const pdfUrl = ApiService.getDailySummaryPdfUrl(summary.date);
    window.open(pdfUrl, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resumen del Día"
      maxWidth="680px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '0.8rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <Button variant="secondary" icon={<FileText size={16} />} onClick={handleOpenPdf}>
              Ver Ticket PDF
            </Button>
            <Button variant="primary" icon={<Share2 size={16} />} onClick={handleShareWhatsApp}>
              Compartir por WhatsApp
            </Button>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {/* Subheader info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Fecha de registro</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{summary.date}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
            <CheckCircle2 size={14} />
            <span>{summary.sales_count} {summary.sales_count === 1 ? 'venta realizada' : 'ventas realizadas'}</span>
          </div>
        </div>

        {/* KPIs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
          <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              <DollarSign size={14} color="#10B981" />
              <span>Ventas Totales</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ${summary.total_revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              <TrendingUp size={14} color="#10B981" />
              <span>Ganancia Neta</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>
              ${summary.net_profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              <PieChart size={14} color="#F59E0B" />
              <span>Margen</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {summary.profit_margin_pct.toFixed(1)}%
            </div>
          </div>

          <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              <Package size={14} color="#38BDF8" />
              <span>Piezas Vendidas</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {summary.total_units_sold}
            </div>
          </div>
        </div>

        {/* MÉTODOS DE PAGO (SOLO EFECTIVO O TRANSFERENCIA) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
            <Receipt size={16} color="var(--primary-color)" />
            <span>Métodos de Pago</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                <DollarSign size={15} color="#10B981" />
                <span>Efectivo</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${summary.cash_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                <ArrowRightLeft size={15} color="#38BDF8" />
                <span>Transferencia</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${summary.transfer_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {summary.expenses_cash > 0 && (
            <div style={{ marginTop: '0.6rem', padding: '0.75rem 0.9rem', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Gastos registrados en efectivo hoy:</span>
                <span style={{ color: '#EF4444', fontWeight: 600 }}>-${summary.expenses_cash.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-color)', fontWeight: 700 }}>
                <span style={{ color: 'var(--text-primary)' }}>Balance en efectivo:</span>
                <span style={{ color: '#10B981' }}>${summary.cash_balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>

        {/* PRODUCTOS VENDIDOS */}
        {summary.products && summary.products.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
              <Layers size={16} color="#F59E0B" />
              <span>Productos Vendidos</span>
            </div>

            <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
              {summary.products.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.7rem 0.9rem',
                    borderBottom: idx < summary.products.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.quantity} {item.quantity === 1 ? 'pieza' : 'piezas'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ${item.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#10B981' }}>
                      +${item.profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })} neta
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
