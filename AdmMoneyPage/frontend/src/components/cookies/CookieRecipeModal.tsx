import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CookieProduct, RecipeIngredientItem, Ingredient } from '../../lib/types';
import { Plus, Trash2, Calculator, Sparkles, ChefHat } from 'lucide-react';

interface CookieRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cookieData: Partial<CookieProduct>) => Promise<void>;
  onUpdate?: (id: number, cookieData: Partial<CookieProduct>) => Promise<void>;
  availableIngredients: Ingredient[];
  initialData?: Partial<CookieProduct> | null;
  editingCookie?: CookieProduct | null;
}

export const CookieRecipeModal: React.FC<CookieRecipeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  availableIngredients,
  initialData,
  editingCookie
}) => {
  const currentTarget = editingCookie || initialData;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Galletas Artesanales');
  const [description, setDescription] = useState('');
  const [salePrice, setSalePrice] = useState<string>('35');
  const [batchYield, setBatchYield] = useState<number>(16);
  const [wastePct, setWastePct] = useState<number>(2.0);
  const [imageUrl, setImageUrl] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientItem[]>([]);

  // Add ingredient inputs
  const [selectedStockIngId, setSelectedStockIngId] = useState<string>('custom');
  const [newIngName, setNewIngName] = useState('');
  const [newIngQty, setNewIngQty] = useState('');
  const [newIngUnit, setNewIngUnit] = useState('g');
  const [newIngCost, setNewIngCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever editing target or modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (currentTarget) {
      setName(currentTarget.name || '');
      setCategory(currentTarget.category || 'Galletas Artesanales');
      setDescription(currentTarget.description || '');
      setSalePrice(currentTarget.sale_price !== undefined ? String(currentTarget.sale_price) : '35');
      setBatchYield(currentTarget.batch_yield || 16);
      setWastePct(currentTarget.waste_pct !== undefined ? currentTarget.waste_pct : 2.0);
      setImageUrl(currentTarget.image_url || 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=500&q=80');
      setRecipeIngredients(currentTarget.ingredients ? [...currentTarget.ingredients] : []);
    } else {
      setName('');
      setCategory('Galletas Artesanales');
      setDescription('');
      setSalePrice('35');
      setBatchYield(16);
      setWastePct(2.0);
      setImageUrl('https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=500&q=80');
      setRecipeIngredients([
        { name: 'Harina de Trigo Especial', quantity: 40, unit: 'g', cost: 1.28 },
        { name: 'Mantequilla sin Sal Gloria', quantity: 25, unit: 'g', cost: 4.62 },
        { name: 'Chispas Chocolate Callebaut 54%', quantity: 25, unit: 'g', cost: 6.00 },
        { name: 'Bolsas Kraft & Listón de Presentación', quantity: 1, unit: 'pza', cost: 0.90 }
      ]);
    }
  }, [currentTarget, isOpen]);

  // Calculations in real time
  const totalRawCost = recipeIngredients.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
  const adjustedTotalBatchCost = totalRawCost * (1 + (wastePct / 100));
  const costPerCookie = batchYield > 0 ? adjustedTotalBatchCost / batchYield : 0;
  const parsedSalePrice = parseFloat(salePrice) || 0;
  const profitPerCookie = parsedSalePrice - costPerCookie;
  const marginPct = parsedSalePrice > 0 ? (profitPerCookie / parsedSalePrice) * 100 : 0;

  const handleStockIngSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedStockIngId(val);
    if (val === 'custom') {
      setNewIngName('');
      setNewIngUnit('g');
      setNewIngCost('');
    } else {
      const ing = availableIngredients.find((i) => i.id === Number(val));
      if (ing) {
        setNewIngName(ing.name);
        setNewIngUnit(ing.unit);
        if (newIngQty) {
          const q = parseFloat(newIngQty) || 0;
          setNewIngCost((q * (ing.cost_per_unit || 0)).toFixed(2));
        }
      }
    }
  };

  const handleQtyChange = (val: string) => {
    setNewIngQty(val);
    if (selectedStockIngId !== 'custom') {
      const ing = availableIngredients.find((i) => i.id === Number(selectedStockIngId));
      if (ing) {
        const q = parseFloat(val) || 0;
        setNewIngCost((q * (ing.cost_per_unit || 0)).toFixed(2));
      }
    }
  };

  const handleAddIngredient = () => {
    if (!newIngName.trim() || !newIngQty || !newIngCost) return;
    const qty = parseFloat(newIngQty) || 0;
    const cost = parseFloat(newIngCost) || 0;

    const ingObj = availableIngredients.find((i) => i.id === Number(selectedStockIngId));

    setRecipeIngredients([
      ...recipeIngredients,
      {
        name: newIngName.trim(),
        quantity: qty,
        unit: newIngUnit,
        cost,
        ingredient_id: ingObj ? ingObj.id : undefined
      }
    ]);

    setSelectedStockIngId('custom');
    setNewIngName('');
    setNewIngQty('');
    setNewIngCost('');
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || parsedSalePrice <= 0 || batchYield <= 0) return;

    try {
      setIsSubmitting(true);
      const payload: Partial<CookieProduct> = {
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        sale_price: parsedSalePrice,
        batch_yield: batchYield,
        waste_pct: wastePct,
        ingredients: recipeIngredients,
        image_url: imageUrl
      };

      if (currentTarget?.id && onUpdate) {
        await onUpdate(currentTarget.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(currentTarget?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Receta: ${name || 'Galleta / Postre'}` : 'Nueva Receta de Galleta / Postre'}
      maxWidth="760px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button
            variant="amber"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim() || !salePrice}
            type="submit"
          >
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Receta' : 'Guardar Receta')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              Nombre de la Galleta o Postre *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Red Velvet Cheesecake, Chispas NY Style"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              Categoría
            </label>
            <select
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Galletas Artesanales">Galletas Artesanales</option>
              <option value="Postres de Especialidad">Postres de Especialidad</option>
              <option value="Cheesecakes">Cheesecakes</option>
              <option value="Brownies & Blondies">Brownies & Blondies</option>
              <option value="Tartas & Pasteles">Tartas & Pasteles</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
            Descripción Comercial / Resumen de Ingredientes
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Ej. Masa de mantequilla dorada, trozos de oreo y chispas semi-amargas 54%."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              Precio de Venta Unitario ($ MXN) *
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              className="form-input"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              Rendimiento por Tanda (pzas) *
            </label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={batchYield}
              onChange={(e) => setBatchYield(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              Pérdida en Tazón (% paredes)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="20"
              className="form-input"
              value={wastePct}
              onChange={(e) => setWastePct(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Live Unit Economics Metrics Preview */}
        <div
          style={{
            background: 'var(--pastel-honey-bg)',
            border: '1px solid var(--pastel-honey-border)',
            borderRadius: '14px',
            padding: '1.1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--pastel-honey-text)', fontWeight: 800, textTransform: 'uppercase' }}>
              Costo Lote ({batchYield} pzas)
            </div>
            <div style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--pastel-honey-text)', marginTop: '0.2rem' }}>
              ${adjustedTotalBatchCost.toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--pastel-honey-text)', fontWeight: 800, textTransform: 'uppercase' }}>
              Costo por Pieza
            </div>
            <div style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '0.2rem' }}>
              ${costPerCookie.toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--pastel-honey-text)', fontWeight: 800, textTransform: 'uppercase' }}>
              Ganancia por Pieza
            </div>
            <div style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
              +${profitPerCookie.toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--pastel-honey-text)', fontWeight: 800, textTransform: 'uppercase' }}>
              Margen de Utilidad
            </div>
            <div style={{ marginTop: '0.35rem' }}>
              <Badge variant="emerald">
                {marginPct.toFixed(2)}% margen
              </Badge>
            </div>
          </div>
        </div>

        {/* Ingredients in Recipe */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Ingredientes de la Receta (para {batchYield} piezas)
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {recipeIngredients.length} ingredientes agregados
            </span>
          </div>

          <div style={{ maxHeight: '190px', overflowY: 'auto', marginBottom: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {recipeIngredients.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: 600 }}>
                    ({item.quantity} {item.unit})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{ fontWeight: 800, color: 'var(--accent-amber)', fontSize: '0.9rem' }}>
                    ${Number(item.cost).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '3px', display: 'flex', alignItems: 'center' }}
                    title="Quitar ingrediente"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add ingredient row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 80px 70px 90px auto', gap: '0.45rem', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <select
              className="form-input"
              value={selectedStockIngId}
              onChange={handleStockIngSelect}
              style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'var(--bg-card)' }}
            >
              <option value="custom">✏️ Ingrediente manual...</option>
              {availableIngredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} (${ing.cost_per_unit}/{ing.unit})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Ingrediente"
              className="form-input"
              value={newIngName}
              onChange={(e) => setNewIngName(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'var(--bg-card)' }}
            />

            <input
              type="number"
              placeholder="Cant."
              className="form-input"
              value={newIngQty}
              onChange={(e) => handleQtyChange(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.5rem', textAlign: 'center', background: 'var(--bg-card)' }}
            />

            <select
              className="form-input"
              value={newIngUnit}
              onChange={(e) => setNewIngUnit(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'var(--bg-card)' }}
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="pza">pza</option>
              <option value="ml">ml</option>
            </select>

            <input
              type="number"
              step="0.01"
              placeholder="Costo $"
              className="form-input"
              value={newIngCost}
              onChange={(e) => setNewIngCost(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.5rem', textAlign: 'right', background: 'var(--bg-card)' }}
            />

            <Button
              variant="secondary"
              type="button"
              onClick={handleAddIngredient}
              style={{ padding: '0.5rem 0.75rem' }}
              title="Agregar ingrediente"
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
