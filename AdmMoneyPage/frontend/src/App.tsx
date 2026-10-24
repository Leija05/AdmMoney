import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { CookiesPage } from './pages/CookiesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

import { ExpenseModal } from './components/expenses/ExpenseModal';
import { ReceiptScannerModal } from './components/expenses/ReceiptScannerModal';
import { CookieRecipeModal } from './components/cookies/CookieRecipeModal';
import { CookieSaleModal } from './components/cookies/CookieSaleModal';
import { IngredientModal } from './components/cookies/IngredientModal';
import { OrderModal } from './components/orders/OrderModal';
import { BatchScalerModal } from './components/cookies/BatchScalerModal';
import { CapacityBottleneckModal } from './components/cookies/CapacityBottleneckModal';
import { StockPurchaseModal } from './components/cookies/StockPurchaseModal';
import { PromotionModal } from './components/promotions/PromotionModal';

import ApiService from './services/api.service';
import {
  Expense,
  CookieProduct,
  Ingredient,
  CookieSale,
  Order,
  IngredientPurchasePayload,
  OverallSummary,
  Promotion
} from './lib/types';

import './styles/index.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/features.css';

import { NotificationProvider, useNotifications } from './context/NotificationContext';

const AppContent: React.FC = () => {
  const { notifySuccess, notifyError, notifyWarning, showException, showConfirm } = useNotifications();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'expenses' | 'cookies' | 'analytics'>('dashboard');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isMockMode, setIsMockMode] = useState<boolean>(ApiService.isMockActive());

  // Dark Mode Theme State ("Medio Apagado" - soft charcoal slate)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('admmoney_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('admmoney_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Data States
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cookies, setCookies] = useState<CookieProduct[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [sales, setSales] = useState<CookieSale[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [summary, setSummary] = useState<OverallSummary | null>(null);

  // Modals States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isBatchScalerOpen, setIsBatchScalerOpen] = useState(false);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [isStockPurchaseModalOpen, setIsStockPurchaseModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  const [preselectedCookieId, setPreselectedCookieId] = useState<number | undefined>();
  const [selectedScalerCookieId, setSelectedScalerCookieId] = useState<number | undefined>();
  const [selectedPurchaseIngId, setSelectedPurchaseIngId] = useState<number | undefined>();

  // Editing state for Orders, Cookies, and Promotions
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingCookie, setEditingCookie] = useState<CookieProduct | null>(null);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState<number>(0);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const isOnline = await ApiService.checkHealth();
      setIsBackendOnline(isOnline);

      if (isOnline || ApiService.isMockActive()) {
        const [expData, cookiesData, ingsData, salesData, summaryData, promosData] = await Promise.all([
          ApiService.getExpenses(),
          ApiService.getCookies(),
          ApiService.getIngredients(),
          ApiService.getSales(),
          ApiService.getOverallSummary(),
          ApiService.getPromotions()
        ]);

        setExpenses(expData);
        setCookies(cookiesData);
        setIngredients(ingsData);
        setSales(salesData);
        setSummary(summaryData);
        setPromotions(promosData);
      }
    } catch (err) {
      console.warn('Backend sync failed, maintaining local state:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Mode Toggle Handler
  const handleToggleMockMode = async () => {
    const nextVal = ApiService.toggleMockMode();
    setIsMockMode(nextVal);
    notifyWarning('Modo de Datos Modificado', nextVal ? 'Operando con datos mock offline.' : 'Conectado a MongoDB Atlas en la nube.');
    await fetchData();
  };

  // Handlers with Custom Exception & Notification Integration
  const handleSaveExpense = async (data: Partial<Expense>) => {
    try {
      const newExp = await ApiService.createExpense(data);
      setExpenses((prev) => [newExp, ...prev]);
      notifySuccess('Gasto Registrado', `Se guardó "${newExp.title}" por $${newExp.amount.toFixed(2)} MXN.`);
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Excepción al registrar gasto',
        message: 'No fue posible guardar el egreso en la base de datos.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleDeleteExpense = async (id: number) => {
    const ok = await showConfirm({
      title: '¿Eliminar este registro de gasto?',
      message: 'El importe será deducido del balance acumulado de egresos.',
      confirmText: 'Sí, Eliminar Gasto',
      type: 'danger'
    });
    if (!ok) return;

    try {
      await ApiService.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      notifySuccess('Gasto Eliminado', 'El registro fue retirado exitosamente.');
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Excepción al eliminar gasto',
        message: 'El servidor rechazó la solicitud de eliminación.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleConfirmReceipt = async (expenseData: Partial<Expense>) => {
    try {
      const created = await ApiService.confirmReceiptAsExpense(expenseData);
      setExpenses((prev) => [created, ...prev]);
      notifySuccess('Ticket Registrado', `Gasto generado automáticamente por $${created.amount.toFixed(2)} MXN.`);
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Excepción al procesar ticket',
        message: 'Ocurrió un error al persistir los datos del ticket escaneado.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleRegisterSale = async (saleData: {
    cookie_id: number;
    quantity: number;
    unit_price?: number;
    customer_name?: string;
    payment_method?: string;
    notes?: string;
  }) => {
    try {
      const created = await ApiService.registerSale(saleData);
      setSales((prev) => [created, ...prev]);
      notifySuccess('Venta Registrada', `Cobro de $${created.total_revenue.toFixed(2)} con ganancia neta de +$${created.net_profit.toFixed(2)} MXN.`);
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Excepción en venta',
        message: 'No fue posible registrar la venta en el sistema.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleSaveCookieRecipe = async (cookieData: Partial<CookieProduct>) => {
    try {
      const created = await ApiService.createCookie(cookieData);
      setCookies((prev) => [...prev, created]);
      notifySuccess('Receta Guardada', `"${created.name}" está lista para producción.`);
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Excepción al guardar receta',
        message: 'Verifica los insumos e ingredientes de la receta.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleUpdateCookieRecipe = async (cookieId: number, cookieData: Partial<CookieProduct>) => {
    try {
      const updated = await ApiService.updateCookie(cookieId, cookieData);
      setCookies((prev) => prev.map((c) => (c.id === cookieId ? updated : c)));
      notifySuccess('¡Receta Actualizada!', `Los costos y rendimiento de "${updated.name}" fueron recalculados.`);
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Excepción al actualizar receta',
        message: 'Verifica los insumos e ingredientes de la receta.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleDeleteCookie = async (id: number) => {
    const ok = await showConfirm({
      title: '¿Dar de baja esta receta de galleta?',
      message: 'El producto dejará de estar disponible para nuevos pedidos y ventas en mostrador.',
      confirmText: 'Dar de baja',
      type: 'warning'
    });
    if (!ok) return;

    try {
      await ApiService.deleteCookie(id);
      setCookies((prev) => prev.filter((c) => c.id !== id));
      notifySuccess('Receta retirada', 'El producto ha sido dado de baja.');
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Excepción al dar de baja receta',
        message: 'No fue posible retirar el producto del catálogo.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  // --- PROMOTIONS HANDLERS ---
  const handleSavePromotion = async (data: Partial<Promotion>) => {
    try {
      if (editingPromo) {
        const updated = await ApiService.updatePromotion(editingPromo.id, data);
        setPromotions((prev) => prev.map((p) => (p.id === editingPromo.id ? updated : p)));
        notifySuccess('Promoción Actualizada', `"${updated.name}" guardada con éxito.`);
      } else {
        const created = await ApiService.createPromotion(data);
        setPromotions((prev) => [created, ...prev]);
        notifySuccess('Promoción Creada', `"${created.name}" está lista para usarse.`);
      }
      setIsPromoModalOpen(false);
      setEditingPromo(null);
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Excepción al guardar promoción',
        message: 'No fue posible guardar las reglas de la promoción.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleTogglePromotion = async (id: number) => {
    try {
      const updated = await ApiService.togglePromotion(id);
      setPromotions((prev) => prev.map((p) => (p.id === id ? updated : p)));
      notifySuccess(
        updated.is_active ? 'Promoción Activada' : 'Promoción Pausada',
        `"${updated.name}" ahora está ${updated.is_active ? 'disponible en ventas y pedidos' : 'pausada temporalmente'}.`
      );
    } catch (err: any) {
      showException({
        title: 'Excepción al cambiar estado de promoción',
        message: 'No fue posible actualizar la promoción.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleDeletePromotion = async (id: number) => {
    const ok = await showConfirm({
      title: '¿Eliminar esta promoción?',
      message: 'Los clientes ya no podrán aplicar esta oferta en mostrador ni en pedidos.',
      confirmText: 'Sí, Eliminar Oferta',
      type: 'danger'
    });
    if (!ok) return;

    try {
      await ApiService.deletePromotion(id);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      notifySuccess('Promoción Eliminada', 'La promoción ha sido retirada.');
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Excepción al eliminar promoción',
        message: 'No fue posible borrar la promoción.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleSaveIngredient = async (ingredientData: Partial<Ingredient>) => {
    try {
      const created = await ApiService.createIngredient(ingredientData);
      setIngredients((prev) => [...prev, created]);
      notifySuccess('Insumo Guardado', `"${created.name}" agregado con costo unitario de $${created.cost_per_unit.toFixed(2)}.`);
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Excepción al guardar insumo',
        message: 'Error al registrar el insumo en el almacén.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleRecordStockPurchase = async (ingId: number, data: IngredientPurchasePayload) => {
    try {
      await ApiService.recordStockPurchase(ingId, data);
      notifySuccess('¡Compra Guardada!', 'Se agregaron las existencias a tu despensa y se actualizó el costo.');
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Error al registrar compra',
        message: 'No pudimos registrar la compra en el sistema.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleDeleteIngredient = async (id: number) => {
    const ok = await showConfirm({
      title: '¿Eliminar este ingrediente de tu despensa?',
      message: 'Se removerá este elemento del almacén. Verifica que no lo utilices en recetas activas.',
      confirmText: 'Sí, Eliminar Ingrediente',
      type: 'danger'
    });
    if (!ok) return;

    try {
      await ApiService.deleteIngredient(id);
      setIngredients((prev) => prev.filter((i) => i.id !== id));
      notifySuccess('Ingrediente Eliminado', 'Se quitó el ingrediente de tu despensa.');
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Error al eliminar ingrediente',
        message: 'No fue posible eliminar el ingrediente del almacén.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleSaveOrder = async (orderData: Partial<Order>) => {
    try {
      await ApiService.createOrder(orderData);
      notifySuccess('¡Pedido Registrado!', 'El pedido fue guardado y añadido a lo que debes hornear hoy.');
      setOrdersRefreshKey((prev) => prev + 1);
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Error al registrar pedido',
        message: 'No fue posible guardar el pedido en el sistema.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleUpdateOrder = async (orderId: number, orderData: Partial<Order>) => {
    try {
      await ApiService.updateOrder(orderId, orderData);
      notifySuccess('¡Pedido Actualizado!', `La orden #${orderId} de "${orderData.customer_name || 'cliente'}" fue modificada con éxito.`);
      setOrdersRefreshKey((prev) => prev + 1);
      await fetchData();
    } catch (err: any) {
      showException({
        title: 'Excepción al actualizar pedido',
        message: 'No fue posible registrar los cambios en la base de datos.',
        technicalDetail: err.stack || err.message,
        code: err.status || 500
      });
    }
  };

  const handleOpenScaler = (cookieId?: number) => {
    setSelectedScalerCookieId(cookieId);
    setIsBatchScalerOpen(true);
  };

  const handleOpenStockPurchase = (ingId?: number) => {
    setSelectedPurchaseIngId(ingId);
    setIsStockPurchaseModalOpen(true);
  };

  return (
    <div className="app-root">
      {/* Background glow mesh */}
      <div className="ambient-glow" />

      {/* Floating Island Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isBackendOnline={isBackendOnline}
        isMockMode={isMockMode}
        onToggleMockMode={handleToggleMockMode}
        onRefreshBackend={fetchData}
        onOpenNewExpense={() => setIsExpenseModalOpen(true)}
        onOpenScanner={() => setIsScannerModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="main-container">
        {activeTab === 'dashboard' && (
          <DashboardPage
            summary={summary}
            expenses={expenses}
            sales={sales}
            onOpenScanner={() => setIsScannerModalOpen(true)}
            onOpenNewExpense={() => setIsExpenseModalOpen(true)}
            onOpenNewSale={() => {
              setPreselectedCookieId(undefined);
              setIsSaleModalOpen(true);
            }}
            onOpenNewOrder={() => setIsOrderModalOpen(true)}
            onOpenScaler={() => handleOpenScaler()}
            onOpenCapacity={() => setIsCapacityModalOpen(true)}
            onOpenStockPurchase={() => handleOpenStockPurchase()}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersPage
            cookies={cookies}
            onOpenNewOrder={() => {
              setEditingOrder(null);
              setIsOrderModalOpen(true);
            }}
            onOpenScaler={handleOpenScaler}
            onEditOrder={(order) => {
              setEditingOrder(order);
              setIsOrderModalOpen(true);
            }}
            refreshKey={ordersRefreshKey}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesPage
            expenses={expenses}
            onOpenNewExpense={() => setIsExpenseModalOpen(true)}
            onOpenScanner={() => setIsScannerModalOpen(true)}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'cookies' && (
          <CookiesPage
            cookies={cookies}
            sales={sales}
            ingredients={ingredients}
            promotions={promotions}
            onOpenNewRecipe={() => {
              setEditingCookie(null);
              setIsRecipeModalOpen(true);
            }}
            onEditCookie={(cookie) => {
              setEditingCookie(cookie);
              setIsRecipeModalOpen(true);
            }}
            onOpenNewSale={(cookieId) => {
              setPreselectedCookieId(cookieId);
              setIsSaleModalOpen(true);
            }}
            onOpenNewIngredient={() => setIsIngredientModalOpen(true)}
            onOpenScaler={handleOpenScaler}
            onOpenCapacity={() => setIsCapacityModalOpen(true)}
            onOpenStockPurchase={handleOpenStockPurchase}
            onDeleteCookie={handleDeleteCookie}
            onDeleteIngredient={handleDeleteIngredient}
            onOpenCreatePromo={() => {
              setEditingPromo(null);
              setIsPromoModalOpen(true);
            }}
            onEditPromo={(promo) => {
              setEditingPromo(promo);
              setIsPromoModalOpen(true);
            }}
            onTogglePromo={handleTogglePromotion}
            onDeletePromo={handleDeletePromotion}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage
            summary={summary}
            cookies={cookies}
            expenses={expenses}
          />
        )}
      </main>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
      />

      <ReceiptScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onConfirmExpense={handleConfirmReceipt}
      />

      <CookieRecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setEditingCookie(null);
        }}
        onSave={handleSaveCookieRecipe}
        onUpdate={handleUpdateCookieRecipe}
        availableIngredients={ingredients}
        editingCookie={editingCookie}
      />

      <CookieSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        cookies={cookies}
        promotions={promotions}
        onRegisterSale={handleRegisterSale}
        preselectedCookieId={preselectedCookieId}
      />

      <IngredientModal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        onSave={handleSaveIngredient}
      />

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
        }}
        cookies={cookies}
        promotions={promotions}
        onSaveOrder={handleSaveOrder}
        onUpdateOrder={handleUpdateOrder}
        editingOrder={editingOrder}
      />

      <BatchScalerModal
        isOpen={isBatchScalerOpen}
        onClose={() => setIsBatchScalerOpen(false)}
        cookies={cookies}
        initialCookieId={selectedScalerCookieId}
      />

      <CapacityBottleneckModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
        onOpenScaler={handleOpenScaler}
      />

      <StockPurchaseModal
        isOpen={isStockPurchaseModalOpen}
        onClose={() => setIsStockPurchaseModalOpen(false)}
        ingredients={ingredients}
        initialIngredientId={selectedPurchaseIngId}
        onRecordPurchase={handleRecordStockPurchase}
      />

      <PromotionModal
        isOpen={isPromoModalOpen}
        onClose={() => {
          setIsPromoModalOpen(false);
          setEditingPromo(null);
        }}
        cookies={cookies}
        editingPromo={editingPromo}
        onSavePromo={handleSavePromotion}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
};

export default App;
