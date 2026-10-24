import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Cookie,
  DollarSign,
  Award,
  Sparkles
} from 'lucide-react';
import { OverallSummary, CookieProduct, Expense } from '../lib/types';

interface AnalyticsPageProps {
  summary: OverallSummary | null;
  cookies: CookieProduct[];
  expenses: Expense[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ summary, cookies, expenses }) => {
  // Aggregate data for category breakdown
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const totalExp = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;

  const categoryColors: Record<string, string> = {
    'Insumos Galletas': '#f59e0b',
    'Empaques y Envíos': '#8b5cf6',
    'Servicios y Luz': '#06b6d4',
    'Transporte': '#3b82f6',
    'Marketing y Redes': '#ec4899',
    'Hogar y Personales': '#10b981',
    'Otros Gastos': '#64748b'
  };

  const performance = summary?.cookie_performance || [
    { cookie_id: 1, cookie_name: 'Chispas Clásicas NY', units_sold: 42, revenue: 1470, profit: 1071, avg_price: 35, avg_cost: 9.5, margin_pct: 72.8 },
    { cookie_id: 3, cookie_name: 'Nutella Stuffed Bomb', units_sold: 15, revenue: 720, profit: 483, avg_price: 48, avg_cost: 15.8, margin_pct: 67.1 },
    { cookie_id: 2, cookie_name: 'Red Velvet Cheesecake', units_sold: 12, revenue: 540, profit: 381.6, avg_price: 45, avg_cost: 13.2, margin_pct: 70.6 },
    { cookie_id: 5, cookie_name: 'Avena con Canela & Nueces', units_sold: 14, revenue: 448, profit: 323.4, avg_price: 32, avg_cost: 8.9, margin_pct: 72.2 },
    { cookie_id: 4, cookie_name: 'Doble Chocolate Fudge', units_sold: 10, revenue: 400, profit: 286, avg_price: 40, avg_cost: 11.4, margin_pct: 71.5 }
  ];

  const maxUnits = Math.max(...performance.map((p) => p.units_sold), 1);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <BarChart3 size={14} /> Reportes & Rendimiento
          </div>
          <h1 className="page-title">Reportes y Gráficas de Ganancias</h1>
          <p className="page-subtitle">
            Descubre cuáles son tus galletas más vendidas y en qué estás gastando tu dinero.
          </p>
        </div>
      </div>

      {/* Grid 1: Ranking & Margin breakdown */}
      <div className="grid-bento-hero">
        {/* Cookie Sales & Margin Performance */}
        <div className="col-8">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Rentabilidad & Ventas por Tipo de Galleta</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Comparativa de unidades vendidas y ganancia neta generada
                </p>
              </div>
              <Badge variant="amber" icon={<Award size={14} />}>
                Top Rendimiento
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {performance.map((item, idx) => {
                const percentageOfMax = (item.units_sold / maxUnits) * 100;
                return (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '1.15rem', borderRadius: 'var(--radius-inner)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--text-dim)', fontSize: '1rem' }}>
                          #{idx + 1}
                        </span>
                        <span style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>
                          {item.cookie_name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Badge variant="emerald">
                          {item.margin_pct.toFixed(2)}% margen
                        </Badge>
                        <span style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--accent-emerald-light)', fontSize: '1rem' }}>
                          +${item.profit.toFixed(2)} neta
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Units */}
                    <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percentageOfMax}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #0284C7 0%, #38BDF8 65%, #10B981 100%)',
                          boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
                          borderRadius: '9999px',
                          transition: 'width 0.8s var(--ease-spring)'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                      <span>{item.units_sold} galletas vendidas</span>
                      <span>Total cobrado: ${item.revenue.toFixed(2)} MXN</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Expense Category Donut / Ring Visual */}
        <div className="col-4">
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Distribución de Gastos</h3>
              <PieIcon size={18} color="#06b6d4" />
            </div>

            {/* Custom SVG Donut Chart */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
              <svg width="180" height="180" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="70" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="22" />
                {Object.entries(categoryTotals).map(([cat, amount], idx, arr) => {
                  const pct = amount / totalExp;
                  const strokeDash = pct * 440; // 2 * pi * 70 = ~440
                  const prevPcts = arr.slice(0, idx).reduce((acc, curr) => acc + (curr[1] / totalExp), 0);
                  const strokeOffset = -prevPcts * 440;
                  const color = categoryColors[cat] || '#10b981';

                  return (
                    <circle
                      key={cat}
                      cx="90"
                      cy="90"
                      r="70"
                      fill="transparent"
                      stroke={color}
                      strokeWidth="22"
                      strokeDasharray={`${strokeDash} 440`}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      style={{ transition: 'all 0.5s ease' }}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Category breakdown legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
              {Object.entries(categoryTotals).map(([cat, amount]) => {
                const pct = ((amount / totalExp) * 100).toFixed(2);
                const color = categoryColors[cat] || '#10b981';
                return (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{cat}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>
                      ${amount.toFixed(2)} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Grid 2: Unit Economics Comparison Matrix */}
      <Card>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Matriz de Costo Unitario vs Ganancia por Galleta</h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            ¿Cuánto cuesta producir cada pieza versus el retorno directo en bolsillo?
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {cookies.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '1.25rem',
                padding: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <img
                  src={c.image_url}
                  alt={c.name}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{c.name}</h4>
                  <Badge variant="emerald" style={{ fontSize: '0.65rem' }}>
                    {c.profit_margin_pct.toFixed(2)}% Margen
                  </Badge>
                </div>
              </div>

              {/* Stacked Cost vs Profit Visual Bar */}
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#fb7185' }}>Gasto: ${c.recipe_cost.toFixed(2)}</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>Ganas: +${c.profit_per_unit.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', height: '10px', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(c.recipe_cost / c.sale_price) * 100}%`,
                      background: '#fb7185'
                    }}
                    title="Costo de producción"
                  />
                  <div
                    style={{
                      width: `${(c.profit_per_unit / c.sale_price) * 100}%`,
                      background: '#10b981'
                    }}
                    title="Ganancia neta"
                  />
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  Precio al público: ${c.sale_price.toFixed(2)} MXN
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
