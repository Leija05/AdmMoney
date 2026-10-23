import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Cookie,
  Plus,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Trash2,
  CheckCircle2,
  PieChart,
  Tag,
  Scale,
  PackagePlus,
  Box,
  AlertTriangle,
  Edit2
} from 'lucide-react';
import { CookieProduct, CookieSale, Ingredient, Promotion } from '../lib/types';
import { PromotionsManager } from '../components/promotions/PromotionsManager';

interface CookiesPageProps {
  cookies: CookieProduct[];
  sales: CookieSale[];
  ingredients: Ingredient[];
  promotions: Promotion[];
  onOpenNewRecipe: () => void;
  onOpenNewSale: (cookieId?: number) => void;
  onOpenNewIngredient: () => void;
  onOpenScaler?: (cookieId?: number) => void;
  onOpenCapacity?: () => void;
  onOpenStockPurchase?: (ingredientId?: number) => void;
  onEditCookie?: (cookie: CookieProduct) => void;
  onDeleteCookie: (id: number) => Promise<void>;
  onDeleteIngredient: (id: number) => Promise<void>;
  onOpenCreatePromo: () => void;
  onEditPromo: (promo: Promotion) => void;
  onTogglePromo: (id: number) => Promise<void>;
  onDeletePromo: (id: number) => Promise<void>;
}

export const CookiesPage: React.FC<CookiesPageProps> = ({
  cookies,
  sales,
  ingredients,
  promotions,
  onOpenNewRecipe,
  onOpenNewSale,
  onOpenNewIngredient,
  onOpenScaler,
  onOpenCapacity,
  onOpenStockPurchase,
  onEditCookie,
  onDeleteCookie,
  onDeleteIngredient,
  onOpenCreatePromo,
  onEditPromo,
  onTogglePromo,
  onDeletePromo
}) => {
  const [subTab, setSubTab] = useState<'recipes' | 'promotions' | 'sales' | 'ingredients'>('recipes');
  const [ingFilter, setIngFilter] = useState<'all' | 'edible' | 'packaging'>('all');

  // Aggregates
  const totalUnitsSold = sales.reduce((acc, s) => acc + s.quantity, 0);
  const totalRevenue = sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.net_profit, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const filteredIngredients = ingredients.filter((ing) => {
    if (ingFilter === 'all') return true;
    return ing.type === ingFilter;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <Cookie size={14} /> Repostería & Negocio
          </div>
          <h1 className="page-title">Recetas, Galletas & Almacén</h1>
          <p className="page-subtitle">
            Calcula el costo de tus recetas, cuánto ganas por galleta y cuánto material tienes en tu despensa.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {onOpenCapacity && (
            <Button variant="secondary" icon={<Layers size={15} color="var(--pastel-blue-text)" />} onClick={onOpenCapacity}>
              ¿Cuánto puedo hornear?
            </Button>
          )}

          {onOpenScaler && (
            <Button variant="secondary" icon={<Scale size={15} color="#f97316" />} onClick={() => onOpenScaler()}>
              Calculadora de Tandas
            </Button>
          )}

          {onOpenStockPurchase && (
            <Button variant="secondary" icon={<PackagePlus size={15} color="#10b981" />} onClick={() => onOpenStockPurchase()}>
              + Registrar Compra
            </Button>
          )}

          <Button variant="amber" icon={<ShoppingBag size={16} />} onClick={() => onOpenNewSale()}>
            Venta Mostrador
          </Button>
        </div>
      </div>

      {/* Production & Pricing Architecture Callout Card */}
      <Card style={{ marginBottom: '1.5rem', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} color="var(--accent-amber)" />
              <h2 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Costos y Ganancias por Galleta
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Rendimiento habitual: <strong style={{ color: 'var(--text-main)' }}>16 galletas por tanda</strong> • Masa en paredes del tazón: <strong style={{ color: 'var(--pastel-blue-text)' }}>2.0%</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Badge variant="amber">Venta Individual: $35.00 MXN</Badge>
            <Badge variant="emerald">Promoción 3 x $90.00 MXN</Badge>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            padding: '1.25rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-inner)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Ingredientes por Galleta</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose-light)', fontFamily: 'Outfit', marginTop: '0.25rem' }}>
              $6.77 <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>MXN</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mantequilla, harina, chispas</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Empaque Individual</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'Outfit', marginTop: '0.25rem' }}>
              $2.90 <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>MXN</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bolsa Kraft con ventana</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Costo Total Unitario</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185', fontFamily: 'Outfit', marginTop: '0.25rem' }}>
              $9.67 <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>MXN</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ingredientes + Empaque</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Ganancia Neta / u</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'Outfit', marginTop: '0.25rem' }}>
              +$25.33 <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>MXN</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald-light)', fontWeight: 700 }}>
              72.4% margen bruto
            </div>
          </div>
        </div>
      </Card>

      {/* Subtabs Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button
          className={`nav-tab-btn ${subTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setSubTab('recipes')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          <Layers size={15} />
          Nuestras Recetas ({cookies.length})
        </button>
        <button
          className={`nav-tab-btn ${subTab === 'ingredients' ? 'active' : ''}`}
          onClick={() => setSubTab('ingredients')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          <Package size={15} />
          Ingredientes & Despensa ({ingredients.length})
        </button>
        <button
          className={`nav-tab-btn ${subTab === 'promotions' ? 'active' : ''}`}
          onClick={() => setSubTab('promotions')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          <Tag size={15} />
          Promociones & Combos ({promotions.length})
        </button>
        <button
          className={`nav-tab-btn ${subTab === 'sales' ? 'active' : ''}`}
          onClick={() => setSubTab('sales')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          <ShoppingBag size={15} />
          Ventas de Mostrador ({sales.length})
        </button>
      </div>

      {/* SUB-TAB 0: PROMOCIONES Y COMBOS */}
      {subTab === 'promotions' && (
        <PromotionsManager
          promotions={promotions}
          cookies={cookies}
          onOpenCreate={onOpenCreatePromo}
          onEditPromo={onEditPromo}
          onTogglePromo={onTogglePromo}
          onDeletePromo={onDeletePromo}
        />
      )}

      {/* SUB-TAB 1: RECETAS / PRODUCTOS */}
      {subTab === 'recipes' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {cookies.map((cookie) => (
              <Card key={cookie.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>
                        {cookie.category || 'Galleta Artesanal'}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-main)' }}>
                        {cookie.name}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span className="badge" style={{ background: 'var(--pastel-mint-bg)', color: 'var(--pastel-mint-text)', border: '1px solid var(--pastel-mint-border)', fontWeight: 700 }}>
                        {cookie.profit_margin_pct.toFixed(0)}% margen
                      </span>
                      {onEditCookie && (
                        <button
                          onClick={() => onEditCookie(cookie)}
                          title="Editar Receta"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--pastel-blue-text)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteCookie(cookie.id)}
                        title="Eliminar galleta / postre"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-rose)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.4' }}>
                    {cookie.description}
                  </p>

                  {/* Financial Breakdown */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      marginBottom: '1rem',
                      textAlign: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Costo Receta</div>
                      <div style={{ fontWeight: 700, color: '#fb7185', fontSize: '0.95rem' }}>${cookie.recipe_cost.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Precio Venta</div>
                      <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem' }}>${cookie.sale_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ganancia / u</div>
                      <div style={{ fontWeight: 800, color: '#34d399', fontSize: '0.95rem' }}>+${cookie.profit_per_unit.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Ingredients Tags */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                      Ingredientes ({cookie.ingredients?.length || 0} items | Pérdida en tazón {cookie.waste_pct || 2}%):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {cookie.ingredients?.slice(0, 5).map((ing, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.04)',
                            color: 'var(--text-secondary)',
                            border: '1px solid rgba(255,255,255,0.06)'
                          }}
                        >
                          {ing.name} ({ing.quantity}{ing.unit})
                        </span>
                      ))}
                      {cookie.ingredients && cookie.ingredients.length > 5 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          +{cookie.ingredients.length - 5} más
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  {onOpenScaler && (
                    <Button
                      variant="secondary"
                      icon={<Scale size={14} color="#f97316" />}
                      onClick={() => onOpenScaler(cookie.id)}
                      style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
                    >
                      Calcular Tanda
                    </Button>
                  )}

                  <Button
                    variant="amber"
                    icon={<ShoppingBag size={14} />}
                    onClick={() => onOpenNewSale(cookie.id)}
                    style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
                  >
                    Venta Rápida
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INVENTARIO & STOCK INTELIGENTE */}
      {subTab === 'ingredients' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Inventario de Ingredientes & Despensa</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Consulta cuánto tienes de cada ingrediente, su costo promedio y alertas cuando quede poco.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Filter */}
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setIngFilter('all')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    background: ingFilter === 'all' ? 'var(--btn-primary-bg)' : 'transparent',
                    color: ingFilter === 'all' ? '#FFFFFF' : 'var(--text-muted)'
                  }}
                >
                  Todos ({ingredients.length})
                </button>
                <button
                  onClick={() => setIngFilter('edible')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    background: ingFilter === 'edible' ? 'var(--btn-primary-bg)' : 'transparent',
                    color: ingFilter === 'edible' ? '#FFFFFF' : 'var(--text-muted)'
                  }}
                >
                  Ingredientes
                </button>
                <button
                  onClick={() => setIngFilter('packaging')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    background: ingFilter === 'packaging' ? 'var(--btn-primary-bg)' : 'transparent',
                    color: ingFilter === 'packaging' ? '#FFFFFF' : 'var(--text-muted)'
                  }}
                >
                  Cajas y Empaques
                </button>
              </div>

              {onOpenStockPurchase && (
                <Button variant="secondary" icon={<PackagePlus size={15} color="#10b981" />} onClick={() => onOpenStockPurchase()}>
                  + Registrar Compra
                </Button>
              )}

              <Button variant="primary" icon={<Plus size={15} />} onClick={onOpenNewIngredient}>
                Nuevo Ingrediente
              </Button>
            </div>
          </div>

          <div className="expenses-table-wrapper">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Tipo</th>
                  <th>Cantidad Actual</th>
                  <th>Aviso de Poco Stock</th>
                  <th>Costo Promedio</th>
                  <th>Comprado en</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map((ing) => {
                  const isLow = (ing.stock_quantity || 0) <= (ing.min_stock_alert || 5);
                  const isCrit = (ing.stock_quantity || 0) <= 0;
                  return (
                    <tr key={ing.id} style={{ background: isCrit ? 'var(--pastel-rose-bg)' : isLow ? 'var(--pastel-honey-bg)' : 'transparent' }}>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {ing.name}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: ing.type === 'packaging' ? 'var(--pastel-blue-bg)' : 'var(--bg-tertiary)',
                            color: ing.type === 'packaging' ? 'var(--pastel-blue-text)' : 'var(--text-muted)',
                            fontWeight: 600
                          }}
                        >
                          {ing.type === 'packaging' ? 'Empaque' : 'Comestible'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: isCrit ? '#ef4444' : isLow ? '#f59e0b' : 'var(--pastel-blue-text)' }}>
                        {ing.stock_quantity} {ing.unit}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {ing.min_stock_alert || 5} {ing.unit}
                      </td>
                      <td style={{ fontFamily: 'Outfit', fontWeight: 800, color: '#fbbf24' }}>
                        ${ing.cost_per_unit.toFixed(4)} / {ing.unit}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{ing.supplier || 'Local'}</td>
                      <td>
                        {isCrit ? (
                          <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={13} /> Agotado
                          </span>
                        ) : isLow ? (
                          <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={13} /> Comprar pronto
                          </span>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={13} /> Suficiente
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          {onOpenStockPurchase && (
                            <button
                              onClick={() => onOpenStockPurchase(ing.id)}
                              title="Registrar Compra"
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: '#10b981',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              + Compra
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteIngredient(ing.id)}
                            title="Eliminar ingrediente"
                            style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* SUB-TAB 3: VENTAS DE MOSTRADOR */}
      {subTab === 'sales' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Historial de Ventas en Mostrador</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Registro de tickets y entregas individuales inmediatas.
              </p>
            </div>
            <Button variant="amber" icon={<ShoppingBag size={15} />} onClick={() => onOpenNewSale()}>
              Registrar Venta
            </Button>
          </div>

          <div className="expenses-table-wrapper">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Galleta / Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Venta</th>
                  <th>Costo Lote</th>
                  <th>Total Cobrado</th>
                  <th>Ganancia Neta</th>
                  <th>Cliente</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{sale.sale_date}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{sale.cookie_name}</div>
                      {sale.notes ? (
                        <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>{sale.notes}</div>
                      ) : null}
                    </td>
                    <td>
                      <Badge variant={sale.quantity >= 3 ? 'emerald' : 'amber'}>
                        {sale.quantity} {sale.quantity === 1 ? 'pza' : 'piezas'}
                      </Badge>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>${sale.unit_price.toFixed(2)}</td>
                    <td style={{ color: 'var(--text-dim)' }}>${sale.unit_cost.toFixed(2)}</td>
                    <td style={{ fontFamily: 'Outfit', fontWeight: 800, color: '#fbbf24', fontSize: '1.05rem' }}>
                      ${sale.total_revenue.toFixed(2)}
                    </td>
                    <td style={{ fontFamily: 'Outfit', fontWeight: 800, color: '#34d399', fontSize: '1.05rem' }}>
                      +${sale.net_profit.toFixed(2)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {sale.customer_name || 'Mostrador'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
