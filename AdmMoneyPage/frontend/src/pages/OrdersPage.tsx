import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Calendar,
  MessageCircle,
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  DollarSign,
  Layers,
  ChevronDown,
  Trash2,
  ExternalLink,
  Edit2
} from 'lucide-react';
import { Order, BakingSheetResponse, CookieProduct } from '../lib/types';
import ApiService from '../services/api.service';
import { Button } from '../components/ui/Button';
import { useNotifications } from '../context/NotificationContext';

interface OrdersPageProps {
  cookies: CookieProduct[];
  onOpenNewOrder: () => void;
  onOpenScaler?: (cookieId?: number) => void;
  onEditOrder?: (order: Order) => void;
  refreshKey?: number;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  cookies,
  onOpenNewOrder,
  onOpenScaler,
  onEditOrder,
  refreshKey
}) => {
  const { notifySuccess, showException, showConfirm } = useNotifications();
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'baking'>('pipeline');
  const [orders, setOrders] = useState<Order[]>([]);
  const [bakingSheet, setBakingSheet] = useState<BakingSheetResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchOrdersAndSheet = async () => {
    setIsLoading(true);
    try {
      const [ordData, sheetData] = await Promise.all([
        ApiService.getOrders(statusFilter !== 'all' ? statusFilter : undefined, dateFilter || undefined),
        ApiService.getBakingSheet()
      ]);
      setOrders(ordData);
      setBakingSheet(sheetData);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndSheet();
  }, [statusFilter, dateFilter, refreshKey]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await ApiService.updateOrderStatus(orderId, newStatus);
      if (newStatus === 'Completado') {
        notifySuccess('¡Pedido Completado!', 'Insumos deducidos del inventario en tiempo real.');
      } else {
        notifySuccess('Estado Actualizado', `El pedido #${orderId} ahora está "${newStatus}".`);
      }
      await fetchOrdersAndSheet();
    } catch (err: any) {
      showException({
        title: 'Excepción al actualizar estado',
        message: 'No fue posible registrar el cambio de estado en el servidor.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    const ok = await showConfirm({
      title: '¿Eliminar este pedido permanentemente?',
      message: 'Esta acción cancelará la orden y revertirá las piezas de la matriz de horneado.',
      confirmText: 'Sí, Eliminar Pedido',
      type: 'danger'
    });
    if (!ok) return;

    try {
      await ApiService.deleteOrder(orderId);
      notifySuccess('Pedido Eliminado', `La orden #${orderId} fue removida con éxito.`);
      await fetchOrdersAndSheet();
    } catch (err: any) {
      showException({
        title: 'Excepción al eliminar pedido',
        message: 'No fue posible eliminar la orden en el servidor.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Pendiente':
        return { bg: 'var(--pastel-honey-bg)', text: 'var(--pastel-honey-text)', icon: <Clock size={13} /> };
      case 'En Preparación':
        return { bg: 'var(--pastel-blue-bg)', text: 'var(--pastel-blue-text)', icon: <Flame size={13} /> };
      case 'Listo':
        return { bg: 'var(--pastel-purple-bg)', text: 'var(--pastel-purple-text)', icon: <Truck size={13} /> };
      case 'Completado':
        return { bg: 'var(--pastel-mint-bg)', text: 'var(--pastel-mint-text)', icon: <CheckCircle2 size={13} /> };
      case 'Cancelado':
        return { bg: 'var(--pastel-rose-bg)', text: 'var(--pastel-rose-text)', icon: <AlertCircle size={13} /> };
    }
  };

  return (
    <div className="orders-page" style={{ paddingBottom: '3rem' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.3rem 0', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Control de Pedidos & Entregas
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Anota pedidos, genera ticket para WhatsApp y revisa qué galletas hornear cada día
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button variant="primary" icon={<Plus size={16} />} onClick={onOpenNewOrder}>
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* View Switcher Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveSubTab('pipeline')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-inner)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeSubTab === 'pipeline' ? 'var(--btn-primary-bg)' : 'var(--bg-card)',
              color: activeSubTab === 'pipeline' ? '#FFFFFF' : 'var(--text-muted)',
              border: '1px solid ' + (activeSubTab === 'pipeline' ? 'var(--btn-primary-bg)' : 'var(--border-subtle)'),
              boxShadow: activeSubTab === 'pipeline' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            <ShoppingBag size={16} />
            <span>Lista de Pedidos ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('baking')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-inner)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeSubTab === 'baking' ? 'var(--btn-primary-bg)' : 'var(--bg-card)',
              color: activeSubTab === 'baking' ? '#FFFFFF' : 'var(--text-muted)',
              border: '1px solid ' + (activeSubTab === 'baking' ? 'var(--btn-primary-bg)' : 'var(--border-subtle)'),
              boxShadow: activeSubTab === 'baking' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            <Flame size={16} />
            <span>¿Qué hornear hoy? ({bakingSheet?.total_all_units || 0} pzs)</span>
          </button>
        </div>

        {/* Filters */}
        {activeSubTab === 'pipeline' && (
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-select"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="all">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Preparación">En Preparación</option>
              <option value="Listo">Listo para entrega</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-text"
              style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', borderRadius: '8px' }}
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* VIEW A: PIPELINE DE PEDIDOS */}
      {activeSubTab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <ShoppingBag size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No hay pedidos registrados</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Crea el primer pedido para programar la entrega y enviar el ticket de WhatsApp.
              </p>
              <Button variant="primary" icon={<Plus size={16} />} onClick={onOpenNewOrder}>
                Registrar Pedido
              </Button>
            </div>
          ) : (
            orders.map((ord) => {
              const badge = getStatusBadge(ord.status);
              return (
                <div key={ord.id} className="double-bezel-card" style={{ marginBottom: '1.25rem' }}>
                  <div className="card-inner" style={{ padding: '1.4rem', gap: '1rem' }}>
                    {/* Top card row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'var(--pastel-blue-bg)',
                            color: 'var(--pastel-blue-text)',
                            border: '1px solid var(--pastel-blue-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontFamily: 'JetBrains Mono',
                            fontSize: '0.95rem'
                          }}
                        >
                          #{ord.id}
                        </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {ord.customer_name}
                          </h3>
                          {ord.customer_phone && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              ({ord.customer_phone})
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Calendar size={13} color="#f59e0b" />
                            Entrega: <strong>{ord.delivery_date}</strong>
                          </span>
                          <span>•</span>
                          <span>Pago: <strong>{ord.payment_method}</strong> ({ord.payment_status})</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill & Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <select
                        value={ord.status}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: 'var(--radius-pill)',
                          border: '1px solid ' + badge.text + '33',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: badge.bg,
                          color: badge.text,
                          outline: 'none'
                        }}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Preparación">En Preparación</option>
                        <option value="Listo">Listo</option>
                        <option value="Completado">Completado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>

                      {onEditOrder && (
                        <button
                          onClick={() => onEditOrder(ord)}
                          style={{
                            background: 'var(--pastel-blue-bg)',
                            border: '1px solid var(--pastel-blue-border)',
                            color: 'var(--pastel-blue-text)',
                            cursor: 'pointer',
                            padding: '0.45rem 0.8rem',
                            borderRadius: 'var(--radius-pill)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}
                          title="Editar datos del cliente y pedido"
                        >
                          <Edit2 size={13} />
                          Editar
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteOrder(ord.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '6px' }}
                        title="Eliminar pedido"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Middle: Items summary */}
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                      Detalle del Pedido
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {ord.items.map((it, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            fontSize: '0.82rem',
                            display: 'flex',
                            gap: '0.45rem',
                            alignItems: 'center'
                          }}
                        >
                          <strong style={{ color: 'var(--pastel-blue-text)' }}>{it.quantity}x</strong>
                          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{it.product_name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>(${it.subtotal.toFixed(2)})</span>
                        </div>
                      ))}
                    </div>

                    {ord.notes && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Nota: "{ord.notes}"
                      </div>
                    )}
                  </div>

                  {/* Bottom: Financial totals & WhatsApp button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'baseline' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total a Cobrar</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                          ${ord.total_amount.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Costo Insumos</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f59e0b' }}>
                          ${ord.total_cost.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Ganancia Neta</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#a855f7' }}>
                          +${ord.net_profit.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* WhatsApp Action Button */}
                    {ord.whatsapp_url ? (
                      <a
                        href={ord.whatsapp_url}
                        target="_blank"
                        rel="noreferrer"
                        className="whatsapp-ticket-btn"
                        style={{
                          padding: '0.6rem 1.15rem',
                          borderRadius: 'var(--radius-pill)',
                          boxShadow: '0 4px 14px rgba(37, 211, 102, 0.28)'
                        }}
                      >
                        <MessageCircle size={16} />
                        <span>Enviar Ticket WhatsApp</span>
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <button
                        disabled
                        style={{
                          padding: '0.55rem 0.9rem',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.8rem',
                          cursor: 'not-allowed'
                        }}
                      >
                        Sin teléfono registrado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      )}

      {/* VIEW B: CONSOLIDADO AUTOMÁTICO DE HORNEADO */}
      {activeSubTab === 'baking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Baking Sheet Table (PDF style) */}
          <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                  Matriz de Producción de Horneado por Día y Variedad
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Calcula de forma automática la cantidad de piezas a hornear por tanda
                </p>
              </div>

              <span style={{ padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-pill)', background: 'var(--pastel-honey-bg)', color: 'var(--pastel-honey-text)', fontWeight: 700, fontSize: '0.85rem', border: '1px solid var(--pastel-honey-border)' }}>
                Total: {bakingSheet?.total_all_units || 0} piezas
              </span>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'left' }}>Día / Fecha</th>
                    {bakingSheet?.product_columns.map((pName, idx) => (
                      <th key={idx} style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                        {pName.split(' ')[0]} {/* Corto para cabecera */}
                      </th>
                    ))}
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                      Total Galletas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bakingSheet?.days.map((day, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        <span style={{ color: 'var(--pastel-blue-text)' }}>{day.day_name}</span>{' '}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({day.delivery_date})</span>
                      </td>
                      {bakingSheet.product_columns.map((pName, pIdx) => {
                        const count = day.quantities_by_product[pName] || 0;
                        return (
                          <td key={pIdx} style={{ padding: '0.85rem 1rem', textAlign: 'center', color: count > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                            {count > 0 ? <strong style={{ color: 'var(--text-main)' }}>{count}</strong> : '-'}
                          </td>
                        );
                      })}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--pastel-mint-text)' }}>
                        {day.total_day_units} pcs
                      </td>
                    </tr>
                  ))}

                  {/* Gran Total row */}
                  <tr style={{ background: '#F9FAFB', fontWeight: 800, borderTop: '2px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-main)' }}>
                      Gran Total
                    </td>
                    {bakingSheet?.product_columns.map((pName, pIdx) => (
                      <td key={pIdx} style={{ padding: '1rem', textAlign: 'center', color: 'var(--pastel-honey-text)' }}>
                        {bakingSheet.grand_totals_by_product[pName] || 0}
                      </td>
                    ))}
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--pastel-mint-text)', fontSize: '1.05rem' }}>
                      {bakingSheet?.total_all_units || 0} pcs
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Consolidated Raw Ingredients Needed for this Production Run */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-outer)', padding: '1.4rem', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} color="var(--pastel-blue-text)" />
                  Ingredientes necesarios para hornear todo
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Total de ingredientes necesarios para las {bakingSheet?.total_all_units || 0} galletas programadas
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              {bakingSheet?.consolidated_ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-inner)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {ing.ingredient_name}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.65rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Necesario:</span>
                      <strong style={{ color: 'var(--pastel-blue-text)', fontSize: '1.05rem' }}>
                        {ing.total_required} {ing.unit}
                      </strong>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>En stock:</span>
                      <span style={{ fontSize: '0.85rem', color: ing.is_sufficient ? 'var(--pastel-mint-text)' : 'var(--pastel-rose-text)', fontWeight: 700 }}>
                        {ing.current_stock} {ing.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
