import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CookieProduct, Promotion } from '../../lib/types';
import {
  Tag,
  Plus,
  ShoppingBag,
  Percent,
  DollarSign,
  Flame,
  Power,
  Edit2,
  Trash2,
  Sparkles,
  Calculator,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PromotionsManagerProps {
  promotions: Promotion[];
  cookies: CookieProduct[];
  onOpenCreate: () => void;
  onEditPromo: (promo: Promotion) => void;
  onTogglePromo: (id: number) => Promise<void>;
  onDeletePromo: (id: number) => Promise<void>;
}

export const PromotionsManager: React.FC<PromotionsManagerProps> = ({
  promotions,
  cookies,
  onOpenCreate,
  onEditPromo,
  onTogglePromo,
  onDeletePromo
}) => {
  // Simulator State
  const [simulatorPromoId, setSimulatorPromoId] = useState<number>(
    promotions[0]?.id || 1
  );
  const [simCart, setSimCart] = useState<Array<{ cookieId: number; qty: number }>>([
    { cookieId: cookies[0]?.id || 1, qty: 3 }
  ]);

  const activeCount = promotions.filter((p) => p.is_active).length;

  // Simulator calculations
  const currentPromo = promotions.find((p) => p.id === simulatorPromoId);

  const rawSubtotal = simCart.reduce((acc, item) => {
    const c = cookies.find((ck) => ck.id === item.cookieId);
    return acc + (c ? c.sale_price * item.qty : 35 * item.qty);
  }, 0);

  const totalSimUnits = simCart.reduce((acc, item) => acc + item.qty, 0);

  // Eligible items in simulator
  const eligibleUnits = simCart.reduce((acc, item) => {
    if (!currentPromo) return acc;
    if (currentPromo.target_type === 'all_products' || currentPromo.target_type === 'order_total') {
      return acc + item.qty;
    }
    if (currentPromo.target_type === 'specific_products') {
      const match = (currentPromo.target_product_ids || []).includes(item.cookieId);
      return match ? acc + item.qty : acc;
    }
    return acc;
  }, 0);

  let simDiscount = 0;
  let isSimApplicable = false;
  let simReason = '';

  if (currentPromo && currentPromo.is_active) {
    if (rawSubtotal < currentPromo.min_order_amount) {
      simReason = `Monto mínimo de compra: $${currentPromo.min_order_amount.toFixed(2)}`;
    } else if (eligibleUnits < currentPromo.min_quantity) {
      simReason = `Faltan ${currentPromo.min_quantity - eligibleUnits} galletas participantes para activar`;
    } else {
      isSimApplicable = true;
      if (currentPromo.promo_type === 'combo_fixed_price') {
        const combos = Math.floor(eligibleUnits / currentPromo.min_quantity);
        const normalComboPrice = (rawSubtotal / totalSimUnits) * currentPromo.min_quantity;
        const discountPerCombo = Math.max(0, normalComboPrice - currentPromo.discount_value);
        simDiscount = combos * discountPerCombo;
      } else if (currentPromo.promo_type === 'percentage') {
        simDiscount = rawSubtotal * (currentPromo.discount_value / 100);
      } else if (currentPromo.promo_type === 'fixed_amount') {
        simDiscount = Math.min(rawSubtotal, currentPromo.discount_value);
      } else if (currentPromo.promo_type === 'two_for_one') {
        const freeUnits = Math.floor(eligibleUnits / 2);
        const avgPrice = rawSubtotal / (totalSimUnits || 1);
        simDiscount = freeUnits * avgPrice;
      }
    }
  } else {
    simReason = 'Esta promoción está pausada';
  }

  const finalSimTotal = Math.max(0, rawSubtotal - simDiscount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        <Card className="metric-card" style={{ background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Promociones Totales
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: 'var(--accent-subtle)' }}>
              <Tag size={18} color="var(--accent-color)" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem' }}>
            {promotions.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Configuradas en tu negocio
          </div>
        </Card>

        <Card className="metric-card" style={{ background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Promociones Activas
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: '#10B98120' }}>
              <Sparkles size={18} color="#10B981" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: '#10B981' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Disponibles en punto de venta y pedidos
          </div>
        </Card>

        <Card
          className="metric-card"
          style={{
            background: 'var(--card-bg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            cursor: 'pointer'
          }}
          onClick={onOpenCreate}
        >
          <Button variant="primary" icon={<Plus size={16} />} onClick={onOpenCreate} style={{ width: '100%' }}>
            Crear Nueva Promoción
          </Button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Combos, 2x1, % descuento y más
          </span>
        </Card>
      </div>

      {/* Promotions List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              Catálogo de Promociones & Ofertas
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Define descuentos que apliquen a productos específicos, combos o pedidos enteros.
            </p>
          </div>
          <Button variant="secondary" icon={<Plus size={15} />} onClick={onOpenCreate}>
            + Nueva Promoción
          </Button>
        </div>

        {promotions.length === 0 ? (
          <Card style={{ padding: '3rem', textAlign: 'center' }}>
            <Tag size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Aún no has creado promociones</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
              Crea combos como 3x$90, descuentos por docena o 2x1 para atraer más clientes e incrementar tus ventas.
            </p>
            <Button variant="primary" icon={<Plus size={16} />} onClick={onOpenCreate}>
              Crear mi primera promoción
            </Button>
          </Card>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {promotions.map((promo) => {
              const color = promo.color_tag || '#F59E0B';
              return (
                <Card
                  key={promo.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden',
                    border: promo.is_active ? `1px solid ${color}40` : '1px solid var(--border-color)',
                    opacity: promo.is_active ? 1 : 0.7,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Color Accent Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      backgroundColor: promo.is_active ? color : 'var(--text-muted)'
                    }}
                  />

                  {/* Header: Title + Badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: `${color}20`,
                          color: color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {promo.promo_type === 'combo_fixed_price' && <ShoppingBag size={18} />}
                        {promo.promo_type === 'percentage' && <Percent size={18} />}
                        {promo.promo_type === 'fixed_amount' && <DollarSign size={18} />}
                        {promo.promo_type === 'two_for_one' && <Flame size={18} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{promo.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {promo.promo_type === 'combo_fixed_price' && 'Combo Precio Fijo'}
                          {promo.promo_type === 'percentage' && `${promo.discount_value}% de Descuento`}
                          {promo.promo_type === 'fixed_amount' && `-$${promo.discount_value} Descuento en Dinero`}
                          {promo.promo_type === 'two_for_one' && '2x1 (Paga 1 Lleva 2)'}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        backgroundColor: promo.is_active ? color : 'var(--text-muted)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: '0.3px',
                        boxShadow: promo.is_active ? `0 2px 6px ${color}40` : 'none'
                      }}
                    >
                      {promo.badge_text || 'PROMO'}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: '0.4rem 0 1rem', flex: 1 }}>
                    {promo.description || 'Sin descripción adicional.'}
                  </p>

                  {/* Details pills */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                      padding: '0.6rem',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-subtle)',
                      marginBottom: '1rem',
                      fontSize: '0.75rem'
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Aplica a:</span>
                    <strong style={{ color: 'var(--text-main)' }}>
                      {promo.target_type === 'all_products' && 'Todo el Menú'}
                      {promo.target_type === 'specific_products' && `${promo.target_product_ids?.length || 0} Galletas Específicas`}
                      {promo.target_type === 'order_total' && 'Total del Pedido'}
                    </strong>
                    {promo.min_quantity > 1 && (
                      <>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>• Mínimo:</span>
                        <strong style={{ color: 'var(--text-main)' }}>{promo.min_quantity} piezas</strong>
                      </>
                    )}
                    {promo.min_order_amount > 0 && (
                      <>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>• Compra:</span>
                        <strong style={{ color: 'var(--text-main)' }}>${promo.min_order_amount} MXN</strong>
                      </>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => onTogglePromo(promo.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: promo.is_active ? '#10B981' : 'var(--text-muted)'
                      }}
                      title={promo.is_active ? 'Pausar promoción' : 'Activar promoción'}
                    >
                      <Power size={14} color={promo.is_active ? '#10B981' : 'var(--text-muted)'} />
                      {promo.is_active ? 'Activa' : 'Pausada'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Button
                        variant="secondary"
                        icon={<Edit2 size={13} />}
                        onClick={() => onEditPromo(promo)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        Editar
                      </Button>
                      <button
                        type="button"
                        onClick={() => onDeletePromo(promo.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.4rem 0.55rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'transparent',
                          color: '#EF4444',
                          cursor: 'pointer'
                        }}
                        title="Eliminar promoción"
                      >
                        <Trash2 size={13} color="#EF4444" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Simulator: Probador Interactivo de Promociones */}
      <Card style={{ padding: '1.5rem', border: '1px dashed var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Calculator size={18} color="var(--accent-color)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
            Simulador de Promociones (Calculadora en Vivo)
          </h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
          Prueba cómo se calculan los descuentos en tiempo real cuando un cliente realiza una compra.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Selector de Promoción y Cantidades */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Selecciona la Promoción a probar:
              </label>
              <select
                className="custom-input"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px' }}
                value={simulatorPromoId}
                onChange={(e) => setSimulatorPromoId(parseInt(e.target.value, 10))}
              >
                {promotions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.badge_text}) {p.is_active ? '' : '— [Pausada]'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Piezas en el Carrito:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {[1, 2, 3, 6, 12].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setSimCart([{ cookieId: cookies[0]?.id || 1, qty }])}
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: totalSimUnits === qty ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                      backgroundColor: totalSimUnits === qty ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                      fontWeight: totalSimUnits === qty ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {qty} {qty === 1 ? 'pza' : 'pzas'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resultado de la simulación */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '14px',
              backgroundColor: isSimApplicable ? '#10B98110' : 'var(--bg-subtle)',
              border: isSimApplicable ? '1px solid #10B98140' : '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Precio Regular:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>${rawSubtotal.toFixed(2)} MXN</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: isSimApplicable ? '#10B981' : 'var(--text-muted)' }}>
                  Descuento ({currentPromo?.badge_text || 'Promo'}):
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isSimApplicable ? '#10B981' : 'var(--text-muted)' }}>
                  -${simDiscount.toFixed(2)} MXN
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-color)',
                  marginTop: '0.5rem'
                }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>Total a Cobrar:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-color)' }}>
                  ${finalSimTotal.toFixed(2)} MXN
                </span>
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {isSimApplicable ? (
                <>
                  <CheckCircle2 size={16} color="#10B981" />
                  <span style={{ color: '#10B981', fontWeight: 600 }}>¡Promoción válida y aplicada con éxito!</span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} color="#EF4444" />
                  <span style={{ color: '#EF4444' }}>{simReason}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
