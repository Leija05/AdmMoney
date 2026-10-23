import React, { useState, useEffect } from 'react';
import { Layers, X, AlertTriangle, CheckCircle2, Box, Sparkles, RefreshCw } from 'lucide-react';
import { ProductionCapacityResponse } from '../../lib/types';
import { ApiService } from '../../services/api.service';
import { Button } from '../ui/Button';

interface CapacityBottleneckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScaler?: (productId: number) => void;
}

export const CapacityBottleneckModal: React.FC<CapacityBottleneckModalProps> = ({
  isOpen,
  onClose,
  onOpenScaler
}) => {
  const [data, setData] = useState<ProductionCapacityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCapacity = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.getProductionCapacity();
      setData(res);
    } catch (err) {
      console.error('Error fetching capacity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCapacity();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container" style={{ maxWidth: '820px', background: 'var(--bg-card)' }}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge" style={{ background: 'var(--pastel-blue-bg)', color: 'var(--pastel-blue-text)' }}>
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                ¿Cuántas galletas puedes hornear hoy?
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Revisión en tiempo real de tu despensa para saber qué ingrediente se te acabará primero.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={fetchCapacity}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
              title="Refrescar capacidad"
            >
              <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            </button>
            <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Critical Alerts Banner */}
          {data?.critical_alerts && data.critical_alerts.length > 0 && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.critical_alerts.map((alert, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--pastel-rose-bg)',
                    border: '1px solid var(--pastel-rose-border)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: 'var(--pastel-rose-text)',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  <AlertTriangle size={18} />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          )}

          {/* Product Capacities Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {data?.capacities.map((item) => (
              <div
                key={item.product_id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {item.product_name}
                    </h4>
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: item.all_ingredients_healthy ? 'var(--pastel-mint-bg)' : 'var(--pastel-rose-bg)',
                        color: item.all_ingredients_healthy ? 'var(--pastel-mint-text)' : 'var(--pastel-rose-text)',
                        border: '1px solid ' + (item.all_ingredients_healthy ? 'var(--pastel-mint-border)' : 'var(--pastel-rose-border)')
                      }}
                    >
                      {item.all_ingredients_healthy ? 'Stock Suficiente' : 'Limitado'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: item.max_producible_units > 10 ? 'var(--pastel-blue-text)' : 'var(--accent-rose)' }}>
                      {item.max_producible_units}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>piezas posibles con tu despensa</span>
                  </div>

                  {item.limiting_ingredient && (
                    <div style={{ padding: '0.75rem', background: 'var(--pastel-honey-bg)', border: '1px solid var(--pastel-honey-border)', borderRadius: '10px', fontSize: '0.82rem' }}>
                      <div style={{ color: 'var(--pastel-honey-text)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Se acabará primero
                      </div>
                      <div style={{ color: 'var(--pastel-honey-text)', fontWeight: 800, marginTop: '2px', fontSize: '0.9rem' }}>
                        {item.limiting_ingredient.ingredient_name}
                      </div>
                      <div style={{ color: 'var(--pastel-honey-text)', fontSize: '0.75rem', marginTop: '3px', opacity: 0.9 }}>
                        Tienes: <strong>{item.limiting_ingredient.available_stock} {item.limiting_ingredient.unit}</strong> (cada galleta lleva {item.limiting_ingredient.required_per_unit} {item.limiting_ingredient.unit})
                      </div>
                    </div>
                  )}
                </div>

                {onOpenScaler && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenScaler(item.product_id);
                    }}
                    style={{
                      marginTop: '1rem',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      background: 'var(--pastel-blue-bg)',
                      border: '1px solid var(--pastel-blue-border)',
                      color: 'var(--pastel-blue-text)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Sparkles size={14} />
                    Calcular Tanda para este Producto
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Packaging Section */}
          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Box size={15} />
              Cajas, Bolsas y Listones
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {data?.packaging_capacities.map((pkg, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{pkg.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pkg.stock_quantity} {pkg.unit}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-pill)',
                      background: pkg.status === 'ok' ? 'var(--pastel-mint-bg)' : 'var(--pastel-rose-bg)',
                      color: pkg.status === 'ok' ? 'var(--pastel-mint-text)' : 'var(--pastel-rose-text)',
                      border: '1px solid ' + (pkg.status === 'ok' ? 'var(--pastel-mint-border)' : 'var(--pastel-rose-border)')
                    }}
                  >
                    {pkg.status === 'ok' ? 'OK' : 'Bajo'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="primary" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
};
