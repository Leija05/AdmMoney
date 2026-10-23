import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Ingredient } from '../../lib/types';

interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ingredientData: Partial<Ingredient>) => Promise<void>;
  initialData?: Partial<Ingredient>;
}

export const IngredientModal: React.FC<IngredientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [unit, setUnit] = useState(initialData?.unit || 'kg');
  const [packageCost, setPackageCost] = useState<string>(initialData?.package_cost ? String(initialData.package_cost) : '');
  const [packageQuantity, setPackageQuantity] = useState<string>(initialData?.package_quantity ? String(initialData.package_quantity) : '1');
  const [stockQuantity, setStockQuantity] = useState<string>(initialData?.stock_quantity ? String(initialData.stock_quantity) : '5');
  const [supplier, setSupplier] = useState(initialData?.supplier || 'Costco');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cost = parseFloat(packageCost) || 0;
  const qty = parseFloat(packageQuantity) || 1;
  const costPerUnit = qty > 0 ? cost / qty : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || cost <= 0 || qty <= 0) return;

    try {
      setIsSubmitting(true);
      await onSave({
        name: name.trim(),
        unit,
        package_cost: cost,
        package_quantity: qty,
        stock_quantity: parseFloat(stockQuantity) || 0,
        supplier: supplier.trim()
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
      title={initialData?.id ? 'Editar Insumo de Galletas' : 'Registrar Compra de Insumo / Materia Prima'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim() || !packageCost}
            type="submit"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Insumo'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nombre del Insumo</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ej. Harina de Trigo, Chispas Callebaut, Bolsas Kraft"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Costo del Paquete ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              placeholder="Ej. 185.00"
              value={packageCost}
              onChange={(e) => setPackageCost(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unidad de Medida</label>
            <select
              className="form-select"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="kg">Kilogramos (kg)</option>
              <option value="g">Gramos (g)</option>
              <option value="pza">Piezas (pza)</option>
              <option value="l">Litros (l)</option>
              <option value="ml">Mililitros (ml)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Contenido por Paquete</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              placeholder="Ej. 1.0 (para 1kg)"
              value={packageQuantity}
              onChange={(e) => setPackageQuantity(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Proveedor / Comercio</label>
            <input
              type="text"
              className="form-input"
              placeholder="Costco, Sam's, Central de Abastos"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>
        </div>

        {/* Calculated Unit Cost Pill */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '0.85rem',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Costo calculado por {unit}:
          </span>
          <span style={{ fontFamily: 'Outfit', fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
            ${costPerUnit.toFixed(4)} / {unit}
          </span>
        </div>
      </form>
    </Modal>
  );
};
