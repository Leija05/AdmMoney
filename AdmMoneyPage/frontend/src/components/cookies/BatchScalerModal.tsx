import React, { useState, useEffect } from 'react';
import { Scale, X, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, Copy, Check } from 'lucide-react';
import { CookieProduct, BatchScaleResponse } from '../../lib/types';
import ApiService from '../../services/api.service';
import { Button } from '../ui/Button';

interface BatchScalerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cookies: CookieProduct[];
  initialCookieId?: number;
}

export const BatchScalerModal: React.FC<BatchScalerModalProps> = ({
  isOpen,
  onClose,
  cookies,
  initialCookieId
}) => {
  const [selectedCookieId, setSelectedCookieId] = useState<number>(initialCookieId || (cookies[0]?.id ?? 1));
  const [targetUnits, setTargetUnits] = useState<number>(48);
  const [wastePct, setWastePct] = useState<number>(2.0);
  const [result, setResult] = useState<BatchScaleResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialCookieId) setSelectedCookieId(initialCookieId);
  }, [initialCookieId]);

  useEffect(() => {
    if (!isOpen || !selectedCookieId) return;

    const calculate = async () => {
      setIsLoading(true);
      try {
        const data = await ApiService.getBatchScaler(selectedCookieId, targetUnits, wastePct);
        setResult(data);
      } catch (err) {
        console.error('Error calculando escalado:', err);
      } finally {
        setIsLoading(false);
      }
    };

    calculate();
  }, [isOpen, selectedCookieId, targetUnits, wastePct]);

  if (!isOpen) return null;

  const handleCopyKitchenList = () => {
    if (!result) return;
    const lines = [
      `📋 INGREDIENTES PARA HORNEAR - ${result.cookie_name.toUpperCase()}`,
      `Meta: ${result.target_units} unidades | Masa en tazón: ${result.waste_pct}% | Peso Total: ${(result.total_raw_weight_g / 1000).toFixed(2)} kg`,
      `----------------------------------------------`,
      ...result.items.map(
        (it) => `• ${it.name}: ${it.required_quantity} ${it.unit} ${!it.is_sufficient ? `[⚠️ FALTA: ${it.missing_quantity} ${it.unit}]` : '✓'}`
      ),
      `----------------------------------------------`,
      `Costo Ingredientes: $${result.estimated_total_cost} | Venta: $${result.projected_revenue} | Ganancia: $${result.projected_profit}`
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container batch-scaler-modal" style={{ maxWidth: '820px', background: 'var(--bg-card)' }}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge" style={{ background: 'var(--pastel-honey-bg)', color: 'var(--pastel-honey-text)' }}>
              <Scale size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Calculadora de Tandas & Pesos
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Calcula los gramos exactos de cada ingrediente según las piezas que vas a hornear
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Controls Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Selecciona Galleta / Postre
              </label>
              <select
                value={selectedCookieId}
                onChange={(e) => setSelectedCookieId(Number(e.target.value))}
                className="form-input"
                style={{ width: '100%' }}
              >
                {cookies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (${c.sale_price} c/u)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                ¿Cuántas piezas vas a hornear?
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={targetUnits}
                  onChange={(e) => setTargetUnits(Math.max(1, Number(e.target.value)))}
                  className="form-input"
                  style={{ width: '90px', textAlign: 'center', fontWeight: 'bold' }}
                />
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {[16, 32, 48, 64].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTargetUnits(n)}
                      style={{
                        padding: '0.4rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        background: targetUnits === n ? 'var(--pastel-blue-bg)' : 'var(--bg-tertiary)',
                        color: targetUnits === n ? 'var(--pastel-blue-text)' : 'var(--text-muted)',
                        border: '1px solid ' + (targetUnits === n ? 'var(--pastel-blue-border)' : 'var(--border-subtle)'),
                        cursor: 'pointer'
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                % Masa en Tazón (Paredes)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  value={wastePct}
                  onChange={(e) => setWastePct(Number(e.target.value))}
                  className="form-input"
                  style={{ width: '85px', textAlign: 'center', fontWeight: 'bold' }}
                />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>% estimado</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {result && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Masa en Báscula</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--pastel-blue-text)' }}>
                  {(result.total_raw_weight_g / 1000).toFixed(2)} kg
                </span>
              </div>
              <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Costo Ingredientes</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                  ${result.estimated_total_cost}
                </span>
              </div>
              <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Venta Total</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  ${result.projected_revenue}
                </span>
              </div>
              <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Ganancia Neta</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--pastel-purple-text)' }}>
                  +${result.projected_profit}
                </span>
              </div>
            </div>
          )}

          {/* Status Alert */}
          {result && !result.can_fulfill_from_stock && (
            <div style={{ padding: '0.8rem 1rem', background: 'var(--pastel-rose-bg)', border: '1px solid var(--pastel-rose-border)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--pastel-rose-text)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              <AlertTriangle size={18} />
              <span>Te faltan algunos ingredientes en despensa para esta cantidad. Revisa los renglones en rojo.</span>
            </div>
          )}

          {/* Scale Table */}
          <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.7rem 0.9rem', fontWeight: 700 }}>Ingrediente</th>
                  <th style={{ padding: '0.7rem 0.9rem', textAlign: 'right', fontWeight: 700 }}>Pesar en Báscula</th>
                  <th style={{ padding: '0.7rem 0.9rem', textAlign: 'right', fontWeight: 700 }}>Costo Estimado</th>
                  <th style={{ padding: '0.7rem 0.9rem', textAlign: 'right', fontWeight: 700 }}>Disponible en Almacén</th>
                  <th style={{ padding: '0.7rem 0.9rem', textAlign: 'center', fontWeight: 700 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {result?.items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: it.is_sufficient ? 'transparent' : 'var(--pastel-rose-bg)' }}>
                    <td style={{ padding: '0.65rem 0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{it.name}</td>
                    <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right', fontWeight: 800, color: 'var(--pastel-blue-text)' }}>
                      {it.required_quantity} {it.unit}
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      ${it.total_cost}
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right', color: it.is_sufficient ? 'var(--text-muted)' : 'var(--accent-rose)', fontWeight: 600 }}>
                      {it.stock_available} {it.unit}
                    </td>
                    <td style={{ padding: '0.65rem 0.9rem', textAlign: 'center' }}>
                      {it.is_sufficient ? (
                        <span style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          <CheckCircle2 size={15} /> Suficiente
                        </span>
                      ) : (
                        <span style={{ color: 'var(--accent-rose)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          <AlertTriangle size={15} /> Falta {it.missing_quantity} {it.unit}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <Button
            variant="secondary"
            onClick={handleCopyKitchenList}
            icon={copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
          >
            {copied ? '¡Copiado a Portapapeles!' : 'Copiar Hoja de Báscula'}
          </Button>

          <Button variant="primary" onClick={onClose}>
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
};
