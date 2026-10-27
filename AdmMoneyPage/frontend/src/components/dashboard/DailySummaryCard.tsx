import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  TrendingUp,
  DollarSign,
  ArrowRightLeft,
  ChevronRight,
  Receipt
} from 'lucide-react';
import { CookieSale, Expense, DailySummary, DailySummaryProduct } from '../../lib/types';
import { DailySummaryModal } from './DailySummaryModal';

interface DailySummaryCardProps {
  sales: CookieSale[];
  expenses: Expense[];
  businessName?: string;
  currency?: string;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  sales,
  expenses,
  businessName = 'Lucky Cookies',
  currency = 'MXN'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const summary: DailySummary = useMemo(() => {
    const daySales = sales.filter((s) => s.sale_date === todayStr);
    const dayExpenses = expenses.filter((e) => e.date === todayStr);

    if (daySales.length === 0) {
      return {
        has_sales: false,
        date: todayStr,
        sales_count: 0,
        total_units_sold: 0,
        total_revenue: 0,
        total_cost: 0,
        net_profit: 0,
        profit_margin_pct: 0,
        average_ticket: 0,
        cash_total: 0,
        transfer_total: 0,
        expenses_total: 0,
        expenses_cash: 0,
        cash_balance: 0,
        net_balance_day: 0,
        products: []
      };
    }

    const totalUnitsSold = daySales.reduce((acc, s) => acc + (s.quantity || 0), 0);
    const totalRevenue = daySales.reduce((acc, s) => acc + (s.total_revenue || 0), 0);
    const totalCost = daySales.reduce((acc, s) => acc + (s.total_cost || 0), 0);
    const netProfit = daySales.reduce((acc, s) => acc + (s.net_profit || 0), 0);
    const profitMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const averageTicket = daySales.length > 0 ? totalRevenue / daySales.length : 0;

    const cashTotal = daySales
      .filter((s) => (s.payment_method || '').toLowerCase().includes('efectivo'))
      .reduce((acc, s) => acc + (s.total_revenue || 0), 0);

    const transferTotal = daySales
      .filter((s) => !(s.payment_method || '').toLowerCase().includes('efectivo'))
      .reduce((acc, s) => acc + (s.total_revenue || 0), 0);

    const expensesTotal = dayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const expensesCash = dayExpenses
      .filter((e) => (e.payment_method || '').toLowerCase().includes('efectivo'))
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    const cashBalance = cashTotal - expensesCash;
    const netBalanceDay = totalRevenue - expensesTotal;

    const prodMap: Record<string, DailySummaryProduct> = {};
    for (const s of daySales) {
      const name = s.cookie_name || 'Galleta';
      if (!prodMap[name]) {
        prodMap[name] = { name, quantity: 0, revenue: 0, profit: 0 };
      }
      prodMap[name].quantity += s.quantity || 0;
      prodMap[name].revenue += s.total_revenue || 0;
      prodMap[name].profit += s.net_profit || 0;
    }

    const products = Object.values(prodMap).sort((a, b) => b.quantity - a.quantity);

    return {
      has_sales: true,
      date: todayStr,
      sales_count: daySales.length,
      total_units_sold: totalUnitsSold,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_cost: Math.round(totalCost * 100) / 100,
      net_profit: Math.round(netProfit * 100) / 100,
      profit_margin_pct: Math.round(profitMarginPct * 10) / 10,
      average_ticket: Math.round(averageTicket * 100) / 100,
      cash_total: Math.round(cashTotal * 100) / 100,
      transfer_total: Math.round(transferTotal * 100) / 100,
      expenses_total: Math.round(expensesTotal * 100) / 100,
      expenses_cash: Math.round(expensesCash * 100) / 100,
      cash_balance: Math.round(cashBalance * 100) / 100,
      net_balance_day: Math.round(netBalanceDay * 100) / 100,
      products,
      sales: daySales
    };
  }, [sales, expenses, todayStr]);

  // CONDICIÓN ESTRICTA: SOLO SI HAY VENTAS
  if (!summary.has_sales || summary.sales_count === 0) {
    return null;
  }

  return (
    <>
      <Card
        style={{
          marginBottom: '1.2rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.02) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Receipt size={17} />
            </div>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Resumen del Día
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {summary.sales_count} {summary.sales_count === 1 ? 'venta hoy' : 'ventas hoy'} • {summary.total_units_sold} piezas
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            <span>Activo</span>
          </div>
        </div>

        {/* Figures Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '0.9rem' }}>
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>
              Ventas Totales
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              ${summary.total_revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}> {currency}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>
              Ganancia Neta
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#10B981' }}>
              +${summary.net_profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              <span style={{ fontSize: '0.82rem', fontWeight: 700, marginLeft: '0.35rem' }}>
                ({summary.profit_margin_pct.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.65rem 0.9rem',
            marginBottom: '0.85rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
            <DollarSign size={15} color="#10B981" />
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Efectivo:</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
              ${summary.cash_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div style={{ width: 1, height: 16, background: 'var(--border-color)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
            <ArrowRightLeft size={15} color="#38BDF8" />
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Transferencia:</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
              ${summary.transfer_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant="secondary"
          onClick={() => setIsModalOpen(true)}
          style={{ width: '100%', justifyContent: 'center' }}
          icon={<ChevronRight size={15} />}
        >
          Ver Resumen del Día
        </Button>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <DailySummaryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          summary={summary}
          businessName={businessName}
        />
      )}
    </>
  );
};
