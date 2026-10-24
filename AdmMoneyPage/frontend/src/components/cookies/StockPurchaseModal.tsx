import React, { useState, useEffect } from 'react';
import { PackagePlus, X, Calculator, ArrowRight, Receipt, Building2 } from 'lucide-react';
import { Ingredient, IngredientPurchasePayload } from '../../lib/types';
import { Button } from '../ui/Button';

interface StockPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  initialIngredientId?: number;
  onRecordPurchase: (ingredientId: number, data: IngredientPurchasePayload) => Promise<void>;
}

export const StockPurchaseModal: React.FC<StockPurchaseModalProps> = ({
  isOpen,
  onClose,
  ingredients,
  initialIngredientId,
  onRecordPurchase
}) => {
  const [ingredientId, setIngredientId] = useState<number>(initialIngredientId || (ingredients[0]?.id ?? 1));
  const [quantity, setQuantity] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [createExpense, setCreateExpense] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialIngredientId) {
      setIngredientId(initialIngredientId);
    }
  }, [initialIngredientId]);

  if (!isOpen) return null;

  const currentIng = ingredients.find((i) => i.id === ingredientId);

  // Live CPP calculation preview
  const prevStock = currentIng?.stock_quantity || 0;
  const prevCpp = currentIng?.cost_per_unit || 0;
  const numQty = parseFloat(quantity) || 0;
  const numCost = parseFloat(totalCost) || 0;

  const newStock = prevStock + numQty;
  const prevVal = prevStock * prevCpp;
  const newCpp = newStock > 0 ? (prevVal + numCost) / newStock : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientId || numQty <= 0 || numCost <= 0) return;

    setIsSubmitting(true);
    try {
      await onRecordPurchase(ingredientId, {
        quantity: numQty,
        total_cost: numCost,
        supplier: supplier.trim(),
        create_expense_record: createExpense
      });
      onClose();
    } catch (err) {
      console.error('Error recording stock purchase:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container" style={{ maxWidth: '600px', background: 'var(--bg-card)' }}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge" style={{ background: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)' }}>
              <PackagePlus size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Registrar Compra de Ingredientes
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Suma la cantidad a tu despensa y calcula automáticamente el nuevo costo promedio
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', maxHeight: '72vh', overflowY: 'auto' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Ingrediente o Material
              </label>
              <select
                value={ingredientId}
                onChange={(e) => setIngredientId(Number(e.target.value))}
                className="form-input"
                style={{ width: '100%' }}
              >
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} (Tienes: {ing.stock_quantity} {ing.unit} | Costo actual: ${ing.cost_per_unit}/{ing.unit})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Cantidad Comprada ({currentIng?.unit || 'u'})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="form-input"
                  placeholder="Ej. 5.0"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Total Pagado en Ticket ($ MXN)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="form-input"
                  placeholder="Ej. 925.00"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Lugar de Compra (Tienda o Proveedor)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="form-input"
                  placeholder="Ej. Costco, Central de Abastos, Walmart"
                  style={{ width: '100%', paddingLeft: '2.3rem' }}
                />
                <Building2 size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Simulación en vivo de Costo Promedio */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 700 }}>
                <Calculator size={16} color="var(--accent-emerald)" />
                <span>Nuevo Costo Promedio Estimado</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Antes de comprar</span>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{prevStock} {currentIng?.unit}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${prevCpp.toFixed(2)} / {currentIng?.unit}</div>
                </div>

                <ArrowRight size={18} color="var(--text-muted)" />

                <div style={{ padding: '0.65rem 0.85rem', background: 'var(--pastel-mint-bg)', border: '1px solid var(--pastel-mint-border)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--pastel-mint-text)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Nuevo Stock y Costo</span>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--pastel-mint-text)' }}>{newStock.toFixed(2)} {currentIng?.unit}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--pastel-mint-text)', fontWeight: 700 }}>${newCpp.toFixed(2)} / {currentIng?.unit}</div>
                </div>
              </div>
            </div>

            {/* Auto Expense toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={createExpense}
                onChange={(e) => setCreateExpense(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Receipt size={15} color="var(--accent-amber)" />
                Anotar también en la lista de Gastos
              </span>
            </label>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Compra'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
