import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  TrendingUp,
  TrendingDown,
  Cookie,
  Receipt,
  ScanLine,
  Plus,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers,
  Percent,
  PackageCheck,
  ShieldCheck,
  Zap,
  Flame,
  Scale,
  PackagePlus,
  ArrowRight,
  Shield,
  Wallet
} from 'lucide-react';
import { OverallSummary, Expense, CookieSale } from '../lib/types';

interface DashboardPageProps {
  summary: OverallSummary | null;
  expenses: Expense[];
  sales: CookieSale[];
  onOpenScanner: () => void;
  onOpenNewExpense: () => void;
  onOpenNewSale: () => void;
  onOpenNewOrder?: () => void;
  onOpenScaler?: () => void;
  onOpenCapacity?: () => void;
  onOpenStockPurchase?: () => void;
  onNavigateTab: (tab: 'dashboard' | 'orders' | 'expenses' | 'cookies' | 'analytics') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  expenses,
  sales,
  onOpenScanner,
  onOpenNewExpense,
  onOpenNewSale,
  onOpenNewOrder,
  onOpenScaler,
  onOpenCapacity,
  onOpenStockPurchase,
  onNavigateTab
}) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const totalExpenses = summary?.total_all_expenses ?? expenses.reduce((acc, e) => acc + e.amount, 0);
  const cookieRevenue = summary?.total_cookie_revenue ?? sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const cookieProfit = summary?.gross_cookie_profit ?? summary?.net_cookie_profit ?? sales.reduce((acc, s) => acc + s.net_profit, 0);
  const reinvestmentFund = summary?.reinvestment_fund ?? summary?.total_cookie_cost ?? sales.reduce((acc, s) => acc + s.total_cost, 0);
  const operationalExpenses = summary?.total_operational_expenses ?? totalExpenses * 0.7;
  const cleanNetProfit = summary?.clean_net_profit ?? (cookieRevenue - (reinvestmentFund + operationalExpenses));
  const netBalance = cookieRevenue - totalExpenses;
  const marginPct = summary?.cookie_profit_margin_pct ?? (cookieRevenue > 0 ? (cookieProfit / cookieRevenue) * 100 : 0);
  const cookiesSold = summary?.total_cookies_sold ?? sales.reduce((acc, s) => acc + s.quantity, 0);

  const dailyTrendData = summary?.daily_trend && summary.daily_trend.length > 0
    ? summary.daily_trend
    : [
        { date: 'Lun', expenses: 400, cookie_revenue: 630, cookie_profit: 459 },
        { date: 'Mar', expenses: 650, cookie_revenue: 540, cookie_profit: 381 },
        { date: 'Mié', expenses: 380, cookie_revenue: 720, cookie_profit: 483 },
        { date: 'Jue', expenses: 890, cookie_revenue: 400, cookie_profit: 286 },
        { date: 'Vie', expenses: 350, cookie_revenue: 840, cookie_profit: 612 },
        { date: 'Sáb', expenses: 1420, cookie_revenue: 1200, cookie_profit: 850 },
        { date: 'Hoy', expenses: 400, cookie_revenue: 950, cookie_profit: 680 },
      ];

  const maxVal = Math.max(...dailyTrendData.map((d) => Math.max(d.expenses, d.cookie_revenue)), 1400);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <Zap size={13} /> Panel Principal de tu Negocio
          </div>
          <h1 className="page-title">Ventas, Pedidos & Ganancias</h1>
          <p className="page-subtitle">
            Control claro del dinero que entra, lo que apartas para comprar ingredientes y tu ganancia limpia.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {onOpenNewOrder && (
            <Button variant="primary" icon={<ShoppingBag size={16} />} onClick={onOpenNewOrder}>
              Nuevo Pedido
            </Button>
          )}
          <Button variant="secondary" icon={<ScanLine size={16} />} onClick={onOpenScanner}>
            Escanear Ticket
          </Button>
          <Button variant="amber" icon={<ShoppingBag size={16} />} onClick={onOpenNewSale}>
            Venta Mostrador
          </Button>
          <Button variant="secondary" icon={<Plus size={16} />} onClick={onOpenNewExpense}>
            Gasto
          </Button>
        </div>
      </div>

      {/* V2.0 ARCHITECTURE: 4 Core Financial Separation Cards (Pastel Editorial Architecture) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Card 1: Ventas Totales */}
        <div className="double-bezel-card animate-fade-up stagger-1">
          <div className="card-inner" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
              <span className="stat-label">
                1. Total Vendido (Entradas)
              </span>
              <span className="badge badge-blue">
                <span className="badge-dot" /> Ventas
              </span>
            </div>
            <div className="stat-value tabular-nums" style={{ fontSize: '2rem', color: 'var(--pastel-blue-text)' }}>
              ${cookieRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Pedidos entregados y ventas de mostrador ({cookiesSold} piezas entregadas)
            </p>
          </div>
        </div>

        {/* Card 2: Fondo de Re-inversión (Materia Prima Protegida) */}
        <div className="double-bezel-card animate-fade-up stagger-2">
          <div className="card-inner" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
              <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={13} color="var(--pastel-peach-text)" /> 2. Fondo Re-inversión
              </span>
              <span className="badge badge-amber">
                <span className="badge-dot" /> Materia Prima
              </span>
            </div>
            <div className="stat-value tabular-nums" style={{ fontSize: '2rem', color: 'var(--pastel-peach-text)' }}>
              ${reinvestmentFund.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Capital reservado para reposición de harina, mantequilla y empaques
            </p>
          </div>
        </div>

        {/* Card 3: Gastos Operativos Fijos */}
        <div className="double-bezel-card animate-fade-up stagger-3">
          <div className="card-inner" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
              <span className="stat-label">
                3. Gastos Operativos Fijos
              </span>
              <span className="badge badge-rose">
                <span className="badge-dot" /> Indirectos
              </span>
            </div>
            <div className="stat-value tabular-nums" style={{ fontSize: '2rem', color: 'var(--pastel-rose-text)' }}>
              ${operationalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Luz CFE, gas de horno, gasolina de reparto y publicidad
            </p>
          </div>
        </div>

        {/* Card 4: Ganancia Neta Limpia */}
        <div className="double-bezel-card animate-fade-up stagger-4">
          <div className="card-inner" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
              <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wallet size={13} color="var(--pastel-mint-text)" /> 4. Ganancia Neta Limpia
              </span>
              <span className="badge badge-mint">
                <span className="badge-dot" /> Beneficio Real
              </span>
            </div>
            <div
              className="stat-value tabular-nums"
              style={{
                fontSize: '2rem',
                color: cleanNetProfit >= 0 ? 'var(--pastel-mint-text)' : 'var(--pastel-rose-text)'
              }}
            >
              {cleanNetProfit >= 0 ? `+$${cleanNetProfit.toFixed(2)}` : `-$${Math.abs(cleanNetProfit).toFixed(2)}`}
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Ventas Totales menos (Costos Directos + Gastos Fijos)
            </p>
          </div>
        </div>
      </div>

      {/* Módulo 5 del Documento: Dashboard & Flujo de Trabajo Integrado */}
      <div className="double-bezel-card" style={{ marginBottom: '2rem' }}>
        <div className="card-inner" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span className="page-eyebrow" style={{ marginBottom: '0.3rem' }}>
                <Zap size={12} /> Ciclo Operativo Automatizado
              </span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', fontWeight: 800 }}>
                Flujo de Trabajo del Negocio en 4 Pasos
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {onOpenScaler && (
                <Button variant="secondary" icon={<Scale size={14} color="var(--pastel-peach-text)" />} onClick={() => onOpenScaler()}>
                  Calculadora de Tandas
                </Button>
              )}
              {onOpenCapacity && (
                <Button variant="secondary" icon={<Layers size={14} color="var(--pastel-blue-text)" />} onClick={onOpenCapacity}>
                  ¿Cuánto puedo hornear?
                </Button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Paso 1 */}
            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--pastel-blue-bg)', color: 'var(--pastel-blue-text)', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--pastel-blue-border)' }}>
                  1
                </span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Compras de Ingredientes</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                Sube foto del ticket o anota la compra ➔ Se suman al almacén y se calcula el costo promedio.
              </p>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={onOpenScanner}
                  style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'var(--pastel-blue-bg)', border: '1px solid var(--pastel-blue-border)', color: 'var(--pastel-blue-text)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                >
                  Escanear Ticket
                </button>
                {onOpenStockPurchase && (
                  <button
                    onClick={() => onOpenStockPurchase()}
                    style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'var(--pastel-mint-bg)', border: '1px solid var(--pastel-mint-border)', color: 'var(--pastel-mint-text)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    + Registrar Compra
                  </button>
                )}
              </div>
            </div>

            {/* Paso 2 */}
            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--pastel-peach-bg)', color: 'var(--pastel-peach-text)', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--pastel-peach-border)' }}>
                  2
                </span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Anotar Pedidos</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                Anota el cliente, fecha y galletas ➔ Genera el ticket para enviar por WhatsApp en 1 clic.
              </p>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {onOpenNewOrder && (
                  <button
                    onClick={onOpenNewOrder}
                    style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'var(--pastel-peach-bg)', border: '1px solid var(--pastel-peach-border)', color: 'var(--pastel-peach-text)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    + Nuevo Pedido
                  </button>
                )}
                <button
                  onClick={() => onNavigateTab('orders')}
                  style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Ver Pedidos
                </button>
              </div>
            </div>

            {/* Paso 3 */}
            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--pastel-mint-border)' }}>
                  3
                </span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Entrega & Descuento de Stock</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                Al marcar pedido como "Completado" ➔ Se descuentan automáticamente los ingredientes usados.
              </p>
              <button
                onClick={() => onNavigateTab('orders')}
                style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'var(--pastel-mint-bg)', border: '1px solid var(--pastel-mint-border)', color: 'var(--pastel-mint-text)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
              >
                Ver Lista de Pedidos
              </button>
            </div>

            {/* Paso 4 */}
            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--pastel-purple-bg)', color: 'var(--pastel-purple-text)', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--pastel-purple-border)' }}>
                  4
                </span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Ganancia Neta Real</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                Tu dinero separado con claridad: lo que guardas para comprar insumos vs tu ganancia limpia.
              </p>
              <button
                onClick={() => onNavigateTab('analytics')}
                style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'var(--pastel-purple-bg)', border: '1px solid var(--pastel-purple-border)', color: 'var(--pastel-purple-text)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
              >
                Ver Analítica Completa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Asymmetric Bento Hero Row: Balance General (Col-8) + Joya Artesanal (Col-4) */}
      <div className="grid-bento-hero">
        {/* Main Position Hero Card (Col-8) */}
        <div className="col-8">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="stat-label">Liquidez Neta en Caja</span>
                <div
                  className="stat-value tabular-nums"
                  style={{
                    color: netBalance >= 0 ? 'var(--pastel-mint-text)' : 'var(--pastel-rose-text)',
                    marginTop: '0.4rem',
                    fontSize: 'clamp(2.4rem, 4vw, 3.2rem)'
                  }}
                >
                  ${netBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span style={{ fontSize: '1rem', color: 'var(--text-dim)', marginLeft: '0.5rem', fontWeight: 700 }}>MXN</span>
                </div>
              </div>

              <Badge variant={netBalance >= 0 ? 'emerald' : 'rose'}>
                {netBalance >= 0 ? (
                  <>
                    <TrendingUp size={14} style={{ marginRight: 3 }} /> Superávit Financiero
                  </>
                ) : (
                  <>
                    <TrendingDown size={14} style={{ marginRight: 3 }} /> Déficit Temporal
                  </>
                )}
              </Badge>
            </div>

            {/* Micro Dual Ledger Indicators */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.25rem',
                marginTop: '1.75rem',
                padding: '1.25rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-inner)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                  Ingresos por Galletas
                </span>
                <div className="tabular-nums" style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: '1.4rem', color: 'var(--pastel-peach-text)', marginTop: '0.25rem' }}>
                  +${cookieRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--pastel-mint-text)', fontWeight: 700 }}>
                  +${cookieProfit.toFixed(2)} utilidad neta
                </span>
              </div>

              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1.25rem' }}>
                <span style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                  Egresos Operativos & Compras
                </span>
                <div className="tabular-nums" style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: '1.4rem', color: 'var(--pastel-rose-text)', marginTop: '0.25rem' }}>
                  -${totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {expenses.length} movimientos auditados
                </span>
              </div>
            </div>

            {/* Quick Action Pointers */}
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 10px var(--accent-emerald)' }} />
                <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Margen operativo consolidado: <strong style={{ color: 'var(--text-main)' }}>{marginPct.toFixed(1)}%</strong>
                </span>
              </div>

              <Button
                variant="secondary"
                hasArrow
                onClick={() => onNavigateTab('expenses')}
                style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
              >
                Auditar Todos los Gastos
              </Button>
            </div>
          </Card>
        </div>

        {/* Star Cookie Spotlight Card (Col-4) */}
        <div className="col-4">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span className="page-eyebrow" style={{ marginBottom: 0 }}>
                <Cookie size={13} /> Joya de la Casa
              </span>
              <Badge variant="amber">Top 1 Ventas</Badge>
            </div>

            <div style={{ textAlign: 'center', padding: '0.25rem 0' }}>
              <div
                style={{
                  width: '94px',
                  height: '94px',
                  borderRadius: '50%',
                  margin: '0 auto 1.25rem',
                  overflow: 'hidden',
                  border: '2px solid rgba(245, 158, 11, 0.4)',
                  boxShadow: '0 0 24px rgba(245, 158, 11, 0.2)'
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=300&q=80"
                  alt="Galleta Estrella"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {summary?.top_selling_cookie || 'Chispas Clásicas NY'}
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Receta insigne con chocolate belga y alta rotación.
              </p>

              {/* Unit Economics 3-column breakdown */}
              <div className="unit-economics-box" style={{ marginTop: '1.25rem' }}>
                <div className="unit-economics-item">
                  <div className="unit-economics-label">Costo Lote</div>
                  <div className="unit-economics-val" style={{ color: 'var(--accent-rose-light)' }}>$9.50</div>
                </div>
                <div className="unit-economics-item">
                  <div className="unit-economics-label">P. Venta</div>
                  <div className="unit-economics-val" style={{ color: 'var(--accent-amber-light)' }}>$35.00</div>
                </div>
                <div className="unit-economics-item">
                  <div className="unit-economics-label">Margen</div>
                  <div className="unit-economics-val" style={{ color: 'var(--accent-emerald-light)' }}>+$25.50</div>
                </div>
              </div>

              <Button
                variant="amber"
                icon={<ShoppingBag size={15} />}
                onClick={onOpenNewSale}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Vender Esta Galleta
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Second Row: Weekly Financial Rhythm (Col-7) + Efficiency Metrics (Col-5) */}
      <div className="grid-bento-hero">
        {/* Weekly Cash Flow & Sales Trend (Col-7) */}
        <div className="col-7">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  Flujo de Ventas vs Egresos por Jornada
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Comparativa de ingresos por lote y compras de insumos
                </p>
              </div>
              <Button
                variant="secondary"
                hasArrow
                onClick={() => onNavigateTab('analytics')}
                style={{ fontSize: '0.775rem', padding: '0.45rem 0.95rem' }}
              >
                Ver Métricas
              </Button>
            </div>

            {/* Interactive Dynamic Bar Chart with hover details */}
            <div className="chart-container">
              {dailyTrendData.map((item, idx) => {
                const revHeight = Math.min(100, Math.max(14, (item.cookie_revenue / maxVal) * 100));
                const expHeight = Math.min(100, Math.max(14, (item.expenses / maxVal) * 100));
                const isHovered = hoveredBar === idx;

                return (
                  <div
                    key={idx}
                    className="chart-bar-col"
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {isHovered && (
                      <div className="chart-tooltip-bubble">
                        <div style={{ color: 'var(--accent-emerald-light)', fontWeight: 800 }}>
                          Ventas: ${item.cookie_revenue.toFixed(0)} MXN
                        </div>
                        <div style={{ color: 'var(--accent-rose-light)', fontWeight: 700 }}>
                          Gastos: ${item.expenses.toFixed(0)} MXN
                        </div>
                      </div>
                    )}

                    <div className="chart-bars-wrap">
                      <div
                        className="chart-bar-single chart-bar-expense"
                        style={{
                          height: `${expHeight}%`,
                          opacity: isHovered ? 1 : 0.85
                        }}
                      />
                      <div
                        className="chart-bar-single chart-bar-revenue"
                        style={{
                          height: `${revHeight}%`,
                          opacity: isHovered ? 1 : 0.85
                        }}
                      />
                    </div>
                    <span className="chart-day-label">
                      {item.date.includes('-') ? item.date.slice(5) : item.date}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chart Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginTop: '1.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
                <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>Ventas Galletas</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--accent-rose)', boxShadow: '0 0 8px var(--accent-rose)' }} />
                <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>Gastos Registrados</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Efficiency & KPI Cards (Col-5) */}
        <div className="col-5">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  Rendimiento Operativo
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Indicadores clave de eficiencia y volumen
                </p>
              </div>
              <Badge variant="cyan">Tiempo Real</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.1rem 1.25rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-inner)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald-light)' }}>
                    <Percent size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Margen Neto Promedio</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Sobre precio cobrado al cliente</div>
                  </div>
                </div>
                <div className="tabular-nums" style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', color: 'var(--accent-emerald-light)' }}>
                  {marginPct.toFixed(1)}%
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.1rem 1.25rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-inner)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-amber-light)' }}>
                    <PackageCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Galletas Despachadas</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Unidades entregadas en el periodo</div>
                  </div>
                </div>
                <div className="tabular-nums" style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', color: 'var(--accent-amber-light)' }}>
                  {cookiesSold} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)' }}>pzas</span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.1rem 1.25rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-inner)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan-light)' }}>
                    <Cookie size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Catálogo Activo</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Recetas en producción continua</div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => onNavigateTab('cookies')}
                  style={{ fontSize: '0.775rem', padding: '0.4rem 0.9rem' }}
                >
                  Ver Recetas
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Third Row: Split Activity Ledgers */}
      <div className="grid-bento-hero">
        {/* Recent Cookie Sales (Col-6) */}
        <div className="col-6">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Cookie size={18} color="var(--accent-amber)" />
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  Últimas Ventas Registradas
                </h3>
              </div>
              <Button
                variant="secondary"
                hasArrow
                onClick={() => onNavigateTab('cookies')}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
              >
                Ver Todas
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sales.slice(0, 5).map((sale) => (
                <div
                  key={sale.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.95rem 1.25rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-inner)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-main)' }}>
                      {sale.quantity}x {sale.cookie_name}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                      {sale.customer_name} • {sale.sale_date}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="tabular-nums" style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--accent-amber-light)', fontSize: '1.15rem' }}>
                      ${sale.total_revenue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald-light)', fontWeight: 700 }}>
                      +${sale.net_profit.toFixed(2)} ganancia
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent General Expenses (Col-6) */}
        <div className="col-6">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Receipt size={18} color="var(--accent-rose)" />
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  Egresos y Compras Recientes
                </h3>
              </div>
              <Button
                variant="secondary"
                hasArrow
                onClick={() => onNavigateTab('expenses')}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
              >
                Ver Gastos
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {expenses.slice(0, 5).map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.95rem 1.25rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-inner)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-main)' }}>
                      {exp.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
                      <Badge variant="amber" style={{ fontSize: '0.675rem', padding: '0.15rem 0.5rem' }}>
                        {exp.category}
                      </Badge>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {exp.date}
                      </span>
                    </div>
                  </div>

                  <div className="tabular-nums" style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--accent-rose-light)', fontSize: '1.15rem' }}>
                    -${exp.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
