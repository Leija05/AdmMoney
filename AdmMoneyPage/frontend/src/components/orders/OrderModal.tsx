import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Plus, Trash2, Calendar, Phone, User, DollarSign, Edit3, Tag, Sparkles, Percent, Flame } from 'lucide-react';
import { CookieProduct, Order, OrderItem, Promotion } from '../../lib/types';
import { Button } from '../ui/Button';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cookies: CookieProduct[];
  promotions?: Promotion[];
  onSaveOrder: (data: Partial<Order>) => Promise<void>;
  onUpdateOrder?: (orderId: number, data: Partial<Order>) => Promise<void>;
  editingOrder?: Order | null;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  cookies,
  promotions = [],
  onSaveOrder,
  onUpdateOrder,
  editingOrder
}) => {
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(tomorrowStr);
  const [paymentMethod, setPaymentMethod] = useState('Transferencia');
  const [paymentStatus, setPaymentStatus] = useState<'Pagado' | 'Pendiente' | 'Anticipo'>('Pendiente');
  const [depositAmount, setDepositAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);
  const [items, setItems] = useState<OrderItem[]>([
    {
      product_id: cookies[0]?.id || 1,
      product_name: cookies[0]?.name || 'Galleta Artesanal',
      quantity: 6,
      unit_price: cookies[0]?.sale_price || 35.0,
      unit_cost: cookies[0]?.recipe_cost || 9.67,
      subtotal: (cookies[0]?.sale_price || 35.0) * 6,
      notes: ''
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editingOrder) {
      setCustomerName(editingOrder.customer_name || '');
      setCustomerPhone(editingOrder.customer_phone || '');
      setDeliveryDate(editingOrder.delivery_date || tomorrowStr);
      setPaymentMethod(editingOrder.payment_method || 'Transferencia');
      setPaymentStatus(editingOrder.payment_status as any || 'Pendiente');
      setDepositAmount(String(editingOrder.deposit_amount || 0));
      setNotes(editingOrder.notes || '');
      if (editingOrder.items && editingOrder.items.length > 0) {
        setItems(editingOrder.items);
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryDate(tomorrowStr);
      setPaymentMethod('Transferencia');
      setPaymentStatus('Pendiente');
      setDepositAmount('0');
      setNotes('');
      if (cookies.length > 0) {
        setItems([
          {
            product_id: cookies[0].id,
            product_name: cookies[0].name,
            quantity: 6,
            unit_price: cookies[0].sale_price,
            unit_cost: cookies[0].recipe_cost,
            subtotal: cookies[0].sale_price * 6,
            notes: ''
          }
        ]);
      }
    }
  }, [editingOrder, isOpen, cookies, tomorrowStr]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const firstCookie = cookies[0];
    if (!firstCookie) return;
    setItems((prev) => [
      ...prev,
      {
        product_id: firstCookie.id,
        product_name: firstCookie.name,
        quantity: 3,
        unit_price: firstCookie.sale_price,
        unit_cost: firstCookie.recipe_cost,
        subtotal: firstCookie.sale_price * 3,
        notes: ''
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'product_id') {
        const prod = cookies.find((c) => c.id === Number(val));
        if (prod) {
          item.product_id = prod.id;
          item.product_name = prod.name;
          item.unit_price = prod.sale_price;
          item.unit_cost = prod.recipe_cost;
          item.subtotal = prod.sale_price * item.quantity;
        }
      } else if (field === 'quantity') {
        const q = Math.max(1, Number(val));
        item.quantity = q;
        item.subtotal = item.unit_price * q;
      } else if (field === 'unit_price') {
        const p = Math.max(0, Number(val));
        item.unit_price = p;
        item.subtotal = p * item.quantity;
      } else {
        (item as any)[field] = val;
      }

      updated[index] = item;
      return updated;
    });
  };

  const rawTotal = items.reduce((acc, it) => acc + it.subtotal, 0);
  const totalUnits = items.reduce((acc, it) => acc + it.quantity, 0);

  const activePromos = promotions.filter((p) => p.is_active);
  const selectedPromo = activePromos.find((p) => p.id === selectedPromoId) || null;

  let discountAmount = 0;
  let isPromoEligible = false;

  if (selectedPromo) {
    const eligibleItems = items.filter((it) => {
      if (selectedPromo.target_type === 'all_products' || selectedPromo.target_type === 'order_total') return true;
      if (selectedPromo.target_type === 'specific_products') {
        return (selectedPromo.target_product_ids || []).includes(it.product_id);
      }
      return true;
    });

    const eligibleUnits = eligibleItems.reduce((acc, it) => acc + it.quantity, 0);
    const eligibleSubtotal = eligibleItems.reduce((acc, it) => acc + it.subtotal, 0);

    if (rawTotal >= selectedPromo.min_order_amount && eligibleUnits >= selectedPromo.min_quantity) {
      isPromoEligible = true;
      if (selectedPromo.promo_type === 'combo_fixed_price') {
        const combos = Math.floor(eligibleUnits / selectedPromo.min_quantity);
        const avgEligiblePrice = eligibleUnits > 0 ? eligibleSubtotal / eligibleUnits : 35;
        const normalComboVal = avgEligiblePrice * selectedPromo.min_quantity;
        const savingsPerCombo = Math.max(0, normalComboVal - selectedPromo.discount_value);
        discountAmount = combos * savingsPerCombo;
      } else if (selectedPromo.promo_type === 'percentage') {
        discountAmount = eligibleSubtotal * (selectedPromo.discount_value / 100);
      } else if (selectedPromo.promo_type === 'fixed_amount') {
        discountAmount = Math.min(rawTotal, selectedPromo.discount_value);
      } else if (selectedPromo.promo_type === 'two_for_one') {
        const freeUnits = Math.floor(eligibleUnits / 2);
        const minPrice = eligibleItems.length > 0 ? Math.min(...eligibleItems.map((i) => i.unit_price)) : 35;
        discountAmount = freeUnits * minPrice;
      }
    }
  }

  discountAmount = Math.round(discountAmount * 100) / 100;
  const finalTotalAmount = Math.max(0, rawTotal - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<Order> = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        delivery_date: deliveryDate,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        deposit_amount: parseFloat(depositAmount) || 0,
        items,
        total_amount: finalTotalAmount,
        promotion_id: selectedPromo?.id,
        promotion_name: selectedPromo?.name,
        discount_amount: discountAmount,
        notes: notes.trim()
      };

      if (editingOrder && onUpdateOrder) {
        await onUpdateOrder(editingOrder.id, payload);
      } else {
        await onSaveOrder(payload);
      }
      onClose();
    } catch (err) {
      console.error('Error al guardar pedido:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge" style={{ background: editingOrder ? 'var(--pastel-purple-bg)' : 'var(--pastel-blue-bg)', color: editingOrder ? 'var(--pastel-purple-text)' : 'var(--pastel-blue-text)' }}>
              {editingOrder ? <Edit3 size={20} /> : <ShoppingBag size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {editingOrder ? `Editar Pedido #${editingOrder.id}` : 'Nuevo Pedido de Cliente'}
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {editingOrder
                  ? 'Modifica los datos del cliente, fecha de entrega, productos o notas'
                  : 'Programa fecha de entrega, calcula totales y genera enlace directo a WhatsApp'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar ventana">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Customer Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Nombre del Cliente *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="form-input"
                    placeholder="Ej. Sofía Morales, Café Roma"
                    style={{ width: '100%', paddingLeft: '2.3rem' }}
                  />
                  <User size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Teléfono / WhatsApp (10 dígitos)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="form-input"
                    placeholder="Ej. 5512345678"
                    style={{ width: '100%', paddingLeft: '2.3rem' }}
                  />
                  <Phone size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>

            {/* Delivery Date & Payments */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Día de Entrega *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.2rem' }}
                  />
                  <Calendar size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Estado de Cobro
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Anticipo">Anticipo</option>
                  <option value="Pagado">Pagado Total</option>
                </select>
              </div>
            </div>

            {/* Order Items List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Galletas / Productos del Pedido
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: 'var(--pastel-blue-bg)',
                    color: 'var(--pastel-blue-text)',
                    border: '1px solid var(--pastel-blue-border)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-pill)',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} />
                  Agregar variedad
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.8fr 75px 95px 85px 32px',
                      gap: '0.55rem',
                      alignItems: 'center',
                      background: '#F8FAFC',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <select
                      value={it.product_id}
                      onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                      className="form-input"
                      style={{ padding: '0.45rem', fontSize: '0.82rem', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                    >
                      {cookies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="form-input"
                      placeholder="Cant"
                      style={{ padding: '0.45rem', textAlign: 'center', fontSize: '0.82rem', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                    />

                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>$</span>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        value={it.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        className="form-input"
                        style={{ padding: '0.45rem 0.4rem 0.45rem 1.3rem', fontSize: '0.82rem', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                      />
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-emerald)', textAlign: 'right' }}>
                      ${it.subtotal.toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: items.length === 1 ? 'var(--text-muted)' : 'var(--accent-rose)',
                        cursor: items.length === 1 ? 'default' : 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Eliminar producto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Notas de Entrega o Personalización
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                rows={2}
                placeholder="Ej. Cajas decoradas con listón rojo, entregar antes de las 3pm..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* Selector de Promoción */}
            {activePromos.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Aplicar Promoción u Oferta
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPromoId(null)}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      border: selectedPromoId === null ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                      backgroundColor: selectedPromoId === null ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                      fontSize: '0.8rem',
                      fontWeight: selectedPromoId === null ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    Sin Promoción
                  </button>

                  {activePromos.map((promo) => {
                    const isSelected = selectedPromoId === promo.id;
                    const color = promo.color_tag || '#F59E0B';
                    return (
                      <button
                        key={promo.id}
                        type="button"
                        onClick={() => setSelectedPromoId(promo.id)}
                        style={{
                          padding: '0.45rem 0.75rem',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${color}` : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? `${color}20` : 'var(--bg-subtle)',
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <span>{promo.name}</span>
                        <span
                          style={{
                            padding: '0.1rem 0.4rem',
                            borderRadius: '10px',
                            backgroundColor: color,
                            color: '#fff',
                            fontSize: '0.68rem',
                            fontWeight: 800
                          }}
                        >
                          {promo.badge_text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total Summary */}
            <div style={{ background: 'var(--pastel-mint-bg)', border: '1px solid var(--pastel-mint-border)', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--pastel-mint-text)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                  Total del Pedido ({totalUnits} piezas)
                  {discountAmount > 0 && ` • Ahorro: -$${discountAmount.toFixed(2)} MXN`}
                </span>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--pastel-mint-text)' }}>
                  ${finalTotalAmount.toFixed(2)} MXN
                </span>
                {discountAmount > 0 && (
                  <span style={{ fontSize: '0.8rem', textDecoration: 'line-through', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    ${rawTotal.toFixed(2)}
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--pastel-mint-text)', fontWeight: 600 }}>
                <span>WhatsApp automático se generará con 1 clic</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (editingOrder ? 'Guardar Cambios' : 'Crear Pedido')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
