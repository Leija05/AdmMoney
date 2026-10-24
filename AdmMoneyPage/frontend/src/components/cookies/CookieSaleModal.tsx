import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CookieProduct, Promotion } from '../../lib/types';
import { Minus, Plus, ShoppingBag, Sparkles, Tag, Percent, Flame } from 'lucide-react';
import { PAYMENT_METHODS } from '../../lib/constants';

interface CookieSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  cookies: CookieProduct[];
  promotions?: Promotion[];
  onRegisterSale: (saleData: {
    cookie_id: number;
    quantity: number;
    unit_price?: number;
    customer_name?: string;
    payment_method?: string;
    notes?: string;
    promotion_id?: number;
    promotion_name?: string;
    discount_amount?: number;
  }) => Promise<void>;
  preselectedCookieId?: number;
}

export const CookieSaleModal: React.FC<CookieSaleModalProps> = ({
  isOpen,
  onClose,
  cookies,
  promotions = [],
  onRegisterSale,
  preselectedCookieId
}) => {
  const [selectedCookieId, setSelectedCookieId] = useState<number>(
    preselectedCookieId || (cookies.length > 0 ? cookies[0].id : 1)
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string>('Cliente Mostrador');
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCookie = cookies.find((c) => c.id === selectedCookieId) || cookies[0];
  const unitCost = selectedCookie ? selectedCookie.recipe_cost : 9.67;
  const standardPrice = selectedCookie ? selectedCookie.sale_price : 35.0;

  // Active promotions applicable to this cookie
  const activePromos = promotions.filter((p) => {
    if (!p.is_active) return false;
    if (p.target_type === 'all_products' || p.target_type === 'order_total') return true;
    if (p.target_type === 'specific_products') {
      return (p.target_product_ids || []).includes(selectedCookieId);
    }
    return true;
  });

  const selectedPromo = activePromos.find((p) => p.id === selectedPromoId) || null;

  // Calculate promotion discount
  const rawSubtotal = standardPrice * quantity;
  let discountAmount = 0;
  let isPromoEligible = false;

  if (selectedPromo) {
    if (quantity >= selectedPromo.min_quantity && rawSubtotal >= selectedPromo.min_order_amount) {
      isPromoEligible = true;
      if (selectedPromo.promo_type === 'combo_fixed_price') {
        const combos = Math.floor(quantity / selectedPromo.min_quantity);
        const normalComboVal = standardPrice * selectedPromo.min_quantity;
        const savingsPerCombo = Math.max(0, normalComboVal - selectedPromo.discount_value);
        discountAmount = combos * savingsPerCombo;
      } else if (selectedPromo.promo_type === 'percentage') {
        discountAmount = rawSubtotal * (selectedPromo.discount_value / 100);
      } else if (selectedPromo.promo_type === 'fixed_amount') {
        discountAmount = Math.min(rawSubtotal, selectedPromo.discount_value);
      } else if (selectedPromo.promo_type === 'two_for_one') {
        const freeUnits = Math.floor(quantity / 2);
        discountAmount = freeUnits * standardPrice;
      }
    }
  }

  discountAmount = Math.round(discountAmount * 100) / 100;
  const totalRevenue = Math.max(0, rawSubtotal - discountAmount);
  const effectiveUnitPrice = quantity > 0 ? totalRevenue / quantity : standardPrice;
  const totalCost = unitCost * quantity;
  const netProfit = totalRevenue - totalCost;
  const roiPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  const handleSelectPromo = (promo: Promotion | null) => {
    if (!promo) {
      setSelectedPromoId(null);
      return;
    }
    setSelectedPromoId(promo.id);
    if (quantity < promo.min_quantity) {
      setQuantity(promo.min_quantity);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCookieId || quantity <= 0) return;

    try {
      setIsSubmitting(true);
      const defaultNote = selectedPromo && isPromoEligible
        ? `${selectedPromo.name} (${selectedPromo.badge_text}) • Descuento: -$${discountAmount.toFixed(2)}`
        : `Venta Individual (${quantity} pza a $${effectiveUnitPrice.toFixed(2)} c/u)`;

      await onRegisterSale({
        cookie_id: selectedCookieId,
        quantity,
        unit_price: Number(effectiveUnitPrice.toFixed(2)),
        customer_name: customerName.trim(),
        payment_method: paymentMethod,
        notes: notes.trim() || defaultNote,
        promotion_id: selectedPromo?.id,
        promotion_name: selectedPromo?.name,
        discount_amount: discountAmount
      });
      onClose();
      // Reset
      setQuantity(1);
      setSelectedPromoId(null);
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Venta de Galletas"
      maxWidth="580px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button
            variant="amber"
            onClick={handleSubmit}
            disabled={isSubmitting || quantity <= 0}
            icon={<ShoppingBag size={16} />}
            type="submit"
          >
            {isSubmitting ? 'Registrando...' : `Cobrar $${totalRevenue.toFixed(2)} MXN`}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Selecciona la Galleta</label>
          <select
            className="form-select"
            value={selectedCookieId}
            onChange={(e) => setSelectedCookieId(parseInt(e.target.value))}
          >
            {cookies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — ${c.sale_price.toFixed(2)} (Costo lote: ${c.recipe_cost.toFixed(2)} • Ganas +${c.profit_per_unit.toFixed(2)} c/u)
              </option>
            ))}
          </select>
        </div>

        {/* Selector Dinámico de Promociones */}
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label className="form-label" style={{ margin: 0 }}>Promoción / Oferta</label>
            {selectedPromo && isPromoEligible && (
              <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>
                ¡Ahorro: -${discountAmount.toFixed(2)} MXN!
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
            {/* Opción Sin Promo */}
            <button
              type="button"
              onClick={() => handleSelectPromo(null)}
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: '12px',
                border: selectedPromoId === null ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                background: selectedPromoId === null ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Precio Normal</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                ${standardPrice.toFixed(2)} c/u
              </div>
            </button>

            {/* Opciones de Promociones Activas */}
            {activePromos.map((promo) => {
              const isSelected = selectedPromoId === promo.id;
              const color = promo.color_tag || '#F59E0B';
              return (
                <button
                  key={promo.id}
                  type="button"
                  onClick={() => handleSelectPromo(promo)}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '12px',
                    border: isSelected ? `2px solid ${color}` : '1px solid var(--border-color)',
                    background: isSelected ? `${color}18` : 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{promo.name}</span>
                    <span
                      style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '10px',
                        backgroundColor: color,
                        color: '#fff',
                        fontSize: '0.68rem',
                        fontWeight: 800
                      }}
                    >
                      {promo.badge_text}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {promo.min_quantity > 1 ? `Min. ${promo.min_quantity} pzas` : 'Aplica directo'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity Stepper */}
        <div className="form-group" style={{ textAlign: 'center', margin: '1.25rem 0' }}>
          <label className="form-label">Cantidad de Galletas</label>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.35rem' }}>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus size={18} />
            </button>
            <span className="stepper-number">{quantity}</span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus size={18} />
            </button>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
            Precio unitario efectivo: <strong>${effectiveUnitPrice.toFixed(2)} MXN c/u</strong>
            {selectedPromo && !isPromoEligible && (
              <span style={{ display: 'block', color: '#EF4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                (Agrega {selectedPromo.min_quantity - quantity} galleta(s) más para activar {selectedPromo.badge_text})
              </span>
            )}
          </div>
        </div>

        {/* Live Sale Breakdown Card */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
            border: '1px solid var(--border-highlight)',
            borderRadius: '1.25rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Cobrado al Cliente
            </div>
            <div style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>
              ${totalRevenue.toFixed(2)} MXN
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Costo total: ${totalCost.toFixed(2)} MXN
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
              Tu Ganancia Neta Libre
            </div>
            <div style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
              +${netProfit.toFixed(2)} MXN
            </div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, marginTop: '0.2rem' }}>
              Rendimiento: ~{roiPct.toFixed(2)}%
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Cliente o Destino</label>
            <input
              type="text"
              className="form-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ej. Café, Mariana, Mostrador"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Forma de Pago</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notas de la Venta (Opcional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Promoción 3 x $90, entrega especial..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
