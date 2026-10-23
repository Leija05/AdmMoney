import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CookieProduct, Promotion, PromoType, PromoScope } from '../../lib/types';
import { Tag, Sparkles, DollarSign, Percent, Flame, ShoppingBag, Check, Layers } from 'lucide-react';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cookies: CookieProduct[];
  editingPromo?: Promotion | null;
  onSavePromo: (promoData: Partial<Promotion>) => Promise<void>;
}

const COLOR_OPTIONS = [
  { name: 'Dorado Caramelo', hex: '#F59E0B' },
  { name: 'Rosa Pastel', hex: '#EC4899' },
  { name: 'Menta Fresca', hex: '#10B981' },
  { name: 'Lavanda Dulce', hex: '#8B5CF6' },
  { name: 'Cielo Pastel', hex: '#3B82F6' }
];

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  cookies,
  editingPromo,
  onSavePromo
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promoType, setPromoType] = useState<PromoType>('combo_fixed_price');
  const [discountValue, setDiscountValue] = useState<string>('90');
  const [targetType, setTargetType] = useState<PromoScope>('all_products');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [minQuantity, setMinQuantity] = useState<string>('3');
  const [minOrderAmount, setMinOrderAmount] = useState<string>('0');
  const [badgeText, setBadgeText] = useState('3 x $90');
  const [colorTag, setColorTag] = useState('#F59E0B');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editingPromo) {
      setName(editingPromo.name || '');
      setDescription(editingPromo.description || '');
      setPromoType(editingPromo.promo_type || 'combo_fixed_price');
      setDiscountValue(String(editingPromo.discount_value ?? 90));
      setTargetType(editingPromo.target_type || 'all_products');
      setSelectedProductIds(editingPromo.target_product_ids || []);
      setMinQuantity(String(editingPromo.min_quantity ?? 1));
      setMinOrderAmount(String(editingPromo.min_order_amount ?? 0));
      setBadgeText(editingPromo.badge_text || 'PROMO');
      setColorTag(editingPromo.color_tag || '#F59E0B');
      setIsActive(editingPromo.is_active !== undefined ? editingPromo.is_active : true);
    } else {
      setName('Combo 3 Galletas');
      setDescription('Lleva 3 galletas artesanales por un precio especial de $90.');
      setPromoType('combo_fixed_price');
      setDiscountValue('90');
      setTargetType('all_products');
      setSelectedProductIds([]);
      setMinQuantity('3');
      setMinOrderAmount('0');
      setBadgeText('3 x $90');
      setColorTag('#F59E0B');
      setIsActive(true);
    }
  }, [editingPromo, isOpen]);

  // Adjust defaults when changing promoType
  const handleTypeChange = (type: PromoType) => {
    setPromoType(type);
    if (type === 'combo_fixed_price') {
      setDiscountValue('90');
      setMinQuantity('3');
      setBadgeText('3 x $90');
    } else if (type === 'percentage') {
      setDiscountValue('15');
      setMinQuantity('1');
      setBadgeText('15% OFF');
    } else if (type === 'fixed_amount') {
      setDiscountValue('30');
      setMinQuantity('1');
      setMinOrderAmount('250');
      setBadgeText('-$30 MXN');
    } else if (type === 'two_for_one') {
      setDiscountValue('1');
      setMinQuantity('2');
      setBadgeText('2x1');
    }
  };

  const handleToggleProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onSavePromo({
        name: name.trim(),
        description: description.trim(),
        promo_type: promoType,
        discount_value: parseFloat(discountValue) || 0,
        target_type: targetType,
        target_product_ids: targetType === 'specific_products' ? selectedProductIds : [],
        min_quantity: parseInt(minQuantity, 10) || 1,
        min_order_amount: parseFloat(minOrderAmount) || 0,
        badge_text: badgeText.trim() || 'PROMO',
        color_tag: colorTag,
        is_active: isActive
      });
      onClose();
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
      title={editingPromo ? 'Editar Promoción' : 'Nueva Promoción u Oferta'}
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Banner Preview */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '16px',
            backgroundColor: `${colorTag}15`,
            border: `1px solid ${colorTag}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: colorTag,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${colorTag}50`
              }}
            >
              {promoType === 'combo_fixed_price' && <ShoppingBag size={20} />}
              {promoType === 'percentage' && <Percent size={20} />}
              {promoType === 'fixed_amount' && <DollarSign size={20} />}
              {promoType === 'two_for_one' && <Flame size={20} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                {name || 'Título de la Promoción'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {description || 'Escribe la descripción de la oferta para tus clientes.'}
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              backgroundColor: colorTag,
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.8rem',
              letterSpacing: '0.3px',
              boxShadow: `0 2px 8px ${colorTag}40`
            }}
          >
            {badgeText || 'PROMO'}
          </span>
        </div>

        {/* 1. Nombre & Descripción */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Nombre de la Promoción *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Trío Dulce, Docena Consentida..."
              className="custom-input"
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Texto de Etiqueta (Badge) *
            </label>
            <input
              type="text"
              required
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="Ej: 3 x $90, 15% OFF, 2x1..."
              className="custom-input"
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Descripción para el Cliente
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Lleva 3 galletas de cualquier sabor por solo $90 MXN"
            className="custom-input"
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px' }}
          />
        </div>

        {/* 2. Tipo de Promoción */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            ¿Qué tipo de oferta es?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => handleTypeChange('combo_fixed_price')}
              style={{
                padding: '0.85rem 0.5rem',
                borderRadius: '12px',
                border: promoType === 'combo_fixed_price' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                backgroundColor: promoType === 'combo_fixed_price' ? 'var(--accent-subtle)' : 'var(--card-bg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <ShoppingBag size={20} color={promoType === 'combo_fixed_price' ? 'var(--accent-color)' : 'var(--text-muted)'} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Combo Precio</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ej. 3 x $90</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('percentage')}
              style={{
                padding: '0.85rem 0.5rem',
                borderRadius: '12px',
                border: promoType === 'percentage' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                backgroundColor: promoType === 'percentage' ? 'var(--accent-subtle)' : 'var(--card-bg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <Percent size={20} color={promoType === 'percentage' ? 'var(--accent-color)' : 'var(--text-muted)'} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Porcentaje %</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ej. 15% OFF</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('fixed_amount')}
              style={{
                padding: '0.85rem 0.5rem',
                borderRadius: '12px',
                border: promoType === 'fixed_amount' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                backgroundColor: promoType === 'fixed_amount' ? 'var(--accent-subtle)' : 'var(--card-bg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <DollarSign size={20} color={promoType === 'fixed_amount' ? 'var(--accent-color)' : 'var(--text-muted)'} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Monto en $</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ej. -$30 MXN</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('two_for_one')}
              style={{
                padding: '0.85rem 0.5rem',
                borderRadius: '12px',
                border: promoType === 'two_for_one' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                backgroundColor: promoType === 'two_for_one' ? 'var(--accent-subtle)' : 'var(--card-bg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <Flame size={20} color={promoType === 'two_for_one' ? 'var(--accent-color)' : 'var(--text-muted)'} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>2x1</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lleva 2 paga 1</span>
            </button>
          </div>
        </div>

        {/* 3. Valor de la promo & Requisitos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              {promoType === 'combo_fixed_price' && 'Precio del Combo ($)'}
              {promoType === 'percentage' && 'Porcentaje (%)'}
              {promoType === 'fixed_amount' && 'Monto a descontar ($)'}
              {promoType === 'two_for_one' && 'Multiplicador'}
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              disabled={promoType === 'two_for_one'}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="custom-input"
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Piezas Mínimas
            </label>
            <input
              type="number"
              min="1"
              required
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              className="custom-input"
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Compra Mínima ($ MXN)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              className="custom-input"
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px' }}
            />
          </div>
        </div>

        {/* 4. Alcance: Afecta a todo lo que el usuario decida */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.45rem' }}>
            ¿A qué productos aplica esta promoción?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setTargetType('all_products')}
              style={{
                padding: '0.65rem',
                borderRadius: '10px',
                border: targetType === 'all_products' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                backgroundColor: targetType === 'all_products' ? 'var(--accent-subtle)' : 'var(--card-bg)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: targetType === 'all_products' ? 700 : 500
              }}
            >
              🍪 Todo el Menú
            </button>

            <button
              type="button"
              onClick={() => setTargetType('specific_products')}
              style={{
                padding: '0.65rem',
                borderRadius: '10px',
                border: targetType === 'specific_products' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                backgroundColor: targetType === 'specific_products' ? 'var(--accent-subtle)' : 'var(--card-bg)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: targetType === 'specific_products' ? 700 : 500
              }}
            >
              🎯 Galletas Específicas
            </button>

            <button
              type="button"
              onClick={() => setTargetType('order_total')}
              style={{
                padding: '0.65rem',
                borderRadius: '10px',
                border: targetType === 'order_total' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                backgroundColor: targetType === 'order_total' ? 'var(--accent-subtle)' : 'var(--card-bg)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: targetType === 'order_total' ? 700 : 500
              }}
            >
              🛒 Total del Carrito
            </button>
          </div>

          {targetType === 'specific_products' && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                maxHeight: '160px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Selecciona las galletas o postres participantes:
              </div>
              {cookies.map((cookie) => {
                const isSelected = selectedProductIds.includes(cookie.id);
                return (
                  <label
                    key={cookie.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.45rem 0.6rem',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'var(--card-bg)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleProduct(cookie.id)}
                    />
                    <span style={{ fontWeight: isSelected ? 600 : 400 }}>{cookie.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ${cookie.sale_price.toFixed(2)} MXN
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Color y Estado Activo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Color del distintivo:</span>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColorTag(c.hex)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: c.hex,
                  border: colorTag === c.hex ? '2px solid #000' : 'none',
                  cursor: 'pointer',
                  transform: colorTag === c.hex ? 'scale(1.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title={c.name}
              />
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Promoción Activa
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : editingPromo ? 'Guardar Cambios' : 'Crear Promoción'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
