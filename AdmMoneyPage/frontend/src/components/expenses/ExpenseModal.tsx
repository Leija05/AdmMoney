import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../lib/constants';
import { Expense } from '../../lib/types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Partial<Expense>) => Promise<void>;
  initialData?: Partial<Expense>;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState<string>(initialData?.amount ? String(initialData.amount) : '');
  const [category, setCategory] = useState(initialData?.category || EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [items, setItems] = useState<Array<{ name: string; price: number; quantity?: number }>>(() => {
    const raw = initialData?.receipt_data?.items;
    return Array.isArray(raw) ? raw.map((it: any) => ({ name: it.name || '', price: Number(it.price || 0), quantity: it.quantity ? Number(it.quantity) : 1 })) : [];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { name: '', price: 0, quantity: 1 }]);
  };

  const handleUpdateItem = (idx: number, field: string, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSumItemsToTotal = () => {
    if (items.length === 0) return;
    const total = items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
    setAmount(total.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      setIsSubmitting(true);
      const cleanedItems = items.filter((it) => it.name.trim().length > 0 || it.price > 0);
      await onSave({
        title: title.trim(),
        amount: parsedAmount,
        category,
        date,
        payment_method: paymentMethod,
        notes: notes.trim(),
        receipt_data: {
          ...(initialData?.receipt_data || {}),
          items: cleanedItems
        }
      });
      onClose();
      // Reset form
      setTitle('');
      setAmount('');
      setNotes('');
      setItems([]);
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
      title={initialData?.id ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !amount}
            type="submit"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Concepto o Descripción</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ej. Harina y Mantequilla Costco, Gas para Horno"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Monto Total ($ MXN)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fecha del Gasto</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Método de Pago</label>
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

        {/* Breakdown of ticket items */}
        <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Artículos Desglosados del Ticket ({items.length})
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleSumItemsToTotal}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--pastel-green-bg, rgba(16, 185, 129, 0.1))',
                    color: 'var(--pastel-green-text, #10B981)',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Sumar al Total
                </button>
              )}
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--pastel-blue-bg, rgba(59, 130, 246, 0.1))',
                  color: 'var(--pastel-blue-text, #3B82F6)',
                  cursor: 'pointer'
                }}
              >
                + Artículo
              </button>
            </div>
          </div>

          {items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--bg-card, rgba(255,255,255,0.05))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.35rem 0.6rem'
                  }}
                >
                  <input
                    type="text"
                    placeholder="Nombre artículo"
                    className="form-input"
                    style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}
                    value={item.name}
                    onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cant:</span>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      style={{ width: '50px', padding: '0.3rem 0.4rem', fontSize: '0.82rem', textAlign: 'center' }}
                      value={item.quantity || 1}
                      onChange={(e) => handleUpdateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="form-input"
                      style={{ width: '80px', padding: '0.3rem 0.4rem', fontSize: '0.82rem', textAlign: 'right' }}
                      value={item.price > 0 || item.price === 0 ? item.price : ''}
                      onChange={(e) => handleUpdateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--pastel-red-text, #EF4444)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0 0.25rem'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Notas o Referencia (Opcional)</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="No. de ticket, proveedor o detalle adicional..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
