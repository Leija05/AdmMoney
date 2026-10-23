import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Receipt,
  ScanLine,
  Plus,
  Search,
  Trash2,
  Filter,
  FileText,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import { Expense } from '../lib/types';
import { EXPENSE_CATEGORIES } from '../lib/constants';

interface ExpensesPageProps {
  expenses: Expense[];
  onOpenNewExpense: () => void;
  onOpenScanner: () => void;
  onDeleteExpense: (id: number) => Promise<void>;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses,
  onOpenNewExpense,
  onOpenScanner,
  onDeleteExpense
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const filteredExpenses = expenses.filter((e) => {
    const matchesCategory = selectedCategory === 'Todas' || e.category === selectedCategory;
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalSum = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case 'Insumos Galletas':
        return 'amber';
      case 'Empaques y Envíos':
        return 'purple';
      case 'Servicios y Luz':
        return 'cyan';
      default:
        return 'emerald';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <Receipt size={14} /> Registro de Egresos
          </div>
          <h1 className="page-title">Pestaña de Gastos Generales</h1>
          <p className="page-subtitle">
            Administra tus gastos personales y compras de insumos para el negocio con suma automática.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" icon={<ScanLine size={16} />} onClick={onOpenScanner}>
            Escanear Ticket con Foto
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={onOpenNewExpense}>
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Overview Stat Box */}
      <div className="grid-bento-hero" style={{ marginBottom: '1.5rem' }}>
        <div className="col-8">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="stat-label">Suma de Gastos Filtrados</span>
                <div className="stat-value" style={{ color: 'var(--accent-rose-light)', marginTop: '0.35rem' }}>
                  ${totalSum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                </div>
              </div>
              <Badge variant="rose" icon={<TrendingDown size={14} />}>
                {filteredExpenses.length} movimientos
              </Badge>
            </div>
          </Card>
        </div>

        <div className="col-4">
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span className="stat-label">Escanear Foto de Ticket</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Toma una foto de tu ticket de Costco o super y se sumará automáticamente.
              </p>
              <Button
                variant="secondary"
                icon={<ScanLine size={14} />}
                onClick={onOpenScanner}
                style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
              >
                Abrir Escáner
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '240px' }}>
            <Search size={18} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Buscar gasto por concepto, ticket o nota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ padding: '0.6rem 0.9rem' }}
            />
          </div>

          {/* Category Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className={`badge ${selectedCategory === 'Todas' ? 'badge-brand' : 'badge-gray'}`}
              style={{ cursor: 'pointer', border: 'none', padding: '0.4rem 0.75rem' }}
              onClick={() => setSelectedCategory('Todas')}
            >
              Todas
            </button>
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`badge ${selectedCategory === cat ? 'badge-brand' : 'badge-gray'}`}
                style={{ cursor: 'pointer', border: 'none', padding: '0.4rem 0.75rem' }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Expenses Table */}
      <Card>
        <div className="expenses-table-wrapper">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto / Comercio</th>
                <th>Categoría</th>
                <th>Forma de Pago</th>
                <th>Notas / Recibo</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {expense.date}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{expense.title}</div>
                    </td>
                    <td>
                      <Badge variant={getCategoryBadgeVariant(expense.category)}>
                        {expense.category}
                      </Badge>
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      {expense.payment_method}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {expense.notes || '—'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="expense-amount-cell">
                        -${expense.amount.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        title="Eliminar gasto"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#fb7185',
                          cursor: 'pointer',
                          padding: '0.35rem',
                          borderRadius: 'var(--radius-pill)',
                          transition: 'background 0.2s'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron gastos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
