import { create } from 'zustand';
import {
  Expense,
  CookieProduct,
  Ingredient,
  CookieSale,
  Order,
  Promotion,
  OverallSummary
} from '../lib/types';
import { MobileApiService, setApiHost, getApiHost } from '../services/api';
import {
  isMobileMockDataEnabled,
  setMobileMockDataEnabled,
  APP_CONFIG
} from '../config/appConfig';
import {
  INITIAL_MOBILE_COOKIES,
  INITIAL_MOBILE_EXPENSES,
  INITIAL_MOBILE_INGREDIENTS,
  INITIAL_MOBILE_SALES,
  INITIAL_MOBILE_PROMOTIONS,
  INITIAL_MOBILE_ORDERS,
  computeMobileSummary
} from '../services/mockData';

interface AppState {
  expenses: Expense[];
  cookies: CookieProduct[];
  ingredients: Ingredient[];
  sales: CookieSale[];
  promotions: Promotion[];
  orders: Order[];
  summary: OverallSummary | null;
  isOnline: boolean;
  backendUrl: string;
  isLoading: boolean;
  useMockData: boolean;

  setUseMockData: (enabled: boolean) => void;
  resetMockData: () => void;
  setBackendUrl: (url: string) => void;
  checkConnection: () => Promise<boolean>;
  loadAllData: () => Promise<void>;
  addExpense: (data: Partial<Expense>) => Promise<Expense>;
  updateExpense: (id: number, data: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: number) => Promise<void>;
  addCookieSale: (data: {
    cookie_id: number;
    quantity: number;
    unit_price?: number;
    customer_name?: string;
    payment_method?: string;
    notes?: string;
    promotion_id?: number;
    promotion_name?: string;
    discount_amount?: number;
  }) => Promise<CookieSale>;
  deleteCookieSale: (id: number) => Promise<void>;
  addCookieProduct: (data: Partial<CookieProduct>) => Promise<CookieProduct>;
  updateCookieProduct: (id: number, data: Partial<CookieProduct>) => Promise<CookieProduct>;
  deleteCookieProduct: (id: number) => Promise<void>;
  addIngredient: (data: Partial<Ingredient>) => Promise<Ingredient>;
  updateIngredient: (id: number, data: Partial<Ingredient>) => Promise<Ingredient>;
  deleteIngredient: (id: number) => Promise<void>;
  addPromotion: (data: Partial<Promotion>) => Promise<Promotion>;
  updatePromotion: (id: number, data: Partial<Promotion>) => Promise<Promotion>;
  togglePromotion: (id: number) => Promise<Promotion>;
  deletePromotion: (id: number) => Promise<void>;
  addOrder: (data: Partial<Order>) => Promise<Order>;
  updateOrder: (id: number, data: Partial<Order>) => Promise<Order>;
  deleteOrder: (id: number) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  expenses: [...INITIAL_MOBILE_EXPENSES],
  cookies: [...INITIAL_MOBILE_COOKIES],
  ingredients: [...INITIAL_MOBILE_INGREDIENTS],
  sales: [...INITIAL_MOBILE_SALES],
  promotions: [...INITIAL_MOBILE_PROMOTIONS],
  orders: [...INITIAL_MOBILE_ORDERS],
  summary: computeMobileSummary(INITIAL_MOBILE_EXPENSES, INITIAL_MOBILE_SALES),
  isOnline: false,
  backendUrl: APP_CONFIG.DEFAULT_API_HOST,
  isLoading: false,
  useMockData: isMobileMockDataEnabled(),

  setUseMockData: (enabled: boolean) => {
    setMobileMockDataEnabled(enabled);
    set({ useMockData: enabled });
    get().loadAllData();
  },

  resetMockData: () => {
    const expenses = [...INITIAL_MOBILE_EXPENSES];
    const cookies = [...INITIAL_MOBILE_COOKIES];
    const ingredients = [...INITIAL_MOBILE_INGREDIENTS];
    const sales = [...INITIAL_MOBILE_SALES];
    const promotions = [...INITIAL_MOBILE_PROMOTIONS];
    const orders = [...INITIAL_MOBILE_ORDERS];
    const summary = computeMobileSummary(expenses, sales);
    set({ expenses, cookies, ingredients, sales, promotions, orders, summary });
  },

  setBackendUrl: (url: string) => {
    setApiHost(url);
    set({ backendUrl: url });
    get().checkConnection();
  },

  checkConnection: async () => {
    if (get().useMockData) {
      set({ isOnline: true });
      return true;
    }
    const online = await MobileApiService.checkHealth();
    set({ isOnline: online });
    return online;
  },

  loadAllData: async () => {
    set({ isLoading: true });
    try {
      if (get().useMockData) {
        const state = get();
        const expenses = state.expenses.length > 0 ? state.expenses : [...INITIAL_MOBILE_EXPENSES];
        const cookies = state.cookies.length > 0 ? state.cookies : [...INITIAL_MOBILE_COOKIES];
        const ingredients = state.ingredients.length > 0 ? state.ingredients : [...INITIAL_MOBILE_INGREDIENTS];
        const sales = state.sales.length > 0 ? state.sales : [...INITIAL_MOBILE_SALES];
        const promotions = state.promotions.length > 0 ? state.promotions : [...INITIAL_MOBILE_PROMOTIONS];
        const orders = state.orders.length > 0 ? state.orders : [...INITIAL_MOBILE_ORDERS];
        const summary = computeMobileSummary(expenses, sales);

        set({
          expenses,
          cookies,
          ingredients,
          sales,
          promotions,
          orders,
          summary,
          isOnline: true,
        });
      } else {
        const online = await get().checkConnection();
        if (online) {
          const [exp, cks, ings, sls, summ, prms, ords] = await Promise.all([
            MobileApiService.getExpenses(),
            MobileApiService.getCookies(),
            MobileApiService.getIngredients(),
            MobileApiService.getSales(),
            MobileApiService.getSummary(),
            MobileApiService.getPromotions(),
            MobileApiService.getOrders(),
          ]);
          set({
            expenses: exp,
            cookies: cks,
            ingredients: ings,
            sales: sls,
            summary: summ,
            promotions: prms,
            orders: ords,
          });
        }
      }
    } catch (err) {
      console.warn('Store load error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addExpense: async (data: Partial<Expense>) => {
    if (get().useMockData) {
      const newExp: Expense = {
        id: Date.now(),
        title: data.title || 'Nuevo Gasto',
        amount: Number(data.amount) || 0,
        category: data.category || 'Otros Gastos',
        date: data.date || new Date().toISOString().split('T')[0],
        payment_method: data.payment_method || 'Efectivo',
        notes: data.notes || '',
        receipt_url: data.receipt_url || '',
        created_at: new Date().toISOString(),
      };
      const updatedExpenses = [newExp, ...get().expenses];
      const updatedSummary = computeMobileSummary(updatedExpenses, get().sales);
      set({ expenses: updatedExpenses, summary: updatedSummary });
      return newExp;
    }

    try {
      const created = await MobileApiService.createExpense(data);
      set((state) => ({ expenses: [created, ...state.expenses] }));
      get().loadAllData();
      return created;
    } catch {
      // Local optimistic fallback
      const mock: Expense = {
        id: Date.now(),
        title: data.title || 'Nuevo Gasto',
        amount: data.amount || 0,
        category: data.category || 'Otros Gastos',
        date: data.date || new Date().toISOString().split('T')[0],
        payment_method: data.payment_method || 'Efectivo',
        notes: data.notes || '',
      };
      const updatedExpenses = [mock, ...get().expenses];
      const updatedSummary = computeMobileSummary(updatedExpenses, get().sales);
      set({ expenses: updatedExpenses, summary: updatedSummary });
      return mock;
    }
  },

  updateExpense: async (id: number, data: Partial<Expense>) => {
    if (get().useMockData) {
      const updatedExpenses = get().expenses.map((e) =>
        e.id === id ? { ...e, ...data, amount: data.amount !== undefined ? Number(data.amount) : e.amount } : e
      );
      const updatedSummary = computeMobileSummary(updatedExpenses, get().sales);
      set({ expenses: updatedExpenses, summary: updatedSummary });
      const found = updatedExpenses.find((e) => e.id === id);
      return found!;
    }
    try {
      const updated = await MobileApiService.updateExpense(id, data);
      const updatedExpenses = get().expenses.map((e) => (e.id === id ? updated : e));
      const updatedSummary = computeMobileSummary(updatedExpenses, get().sales);
      set({ expenses: updatedExpenses, summary: updatedSummary });
      return updated;
    } catch {
      const updatedExpenses = get().expenses.map((e) =>
        e.id === id ? { ...e, ...data } : e
      );
      set({ expenses: updatedExpenses });
      return updatedExpenses.find((e) => e.id === id)!;
    }
  },

  deleteExpense: async (id: number) => {
    if (get().useMockData) {
      const updatedExpenses = get().expenses.filter((e) => e.id !== id);
      const updatedSummary = computeMobileSummary(updatedExpenses, get().sales);
      set({ expenses: updatedExpenses, summary: updatedSummary });
      return;
    }

    try {
      await MobileApiService.deleteExpense(id);
    } catch (err) {
      console.warn(err);
    }
    const updatedExpenses = get().expenses.filter((e) => e.id !== id);
    const updatedSummary = computeMobileSummary(updatedExpenses, get().sales);
    set({ expenses: updatedExpenses, summary: updatedSummary });
  },

  addCookieSale: async (data) => {
    const targetCookie = get().cookies.find((c) => c.id === data.cookie_id);
    const unitPrice = data.unit_price || targetCookie?.sale_price || 35;
    const unitCost = targetCookie?.recipe_cost || 9.5;
    const qty = data.quantity || 1;
    const totalRev = unitPrice * qty;
    const totalCst = unitCost * qty;

    const newSale: CookieSale = {
      id: Date.now(),
      cookie_id: data.cookie_id,
      cookie_name: targetCookie?.name || 'Galleta Artesanal',
      quantity: qty,
      unit_price: unitPrice,
      unit_cost: unitCost,
      total_revenue: totalRev,
      total_cost: totalCst,
      net_profit: totalRev - totalCst,
      sale_date: new Date().toISOString().split('T')[0],
      customer_name: data.customer_name || 'Cliente Mostrador',
      payment_method: data.payment_method || 'Efectivo',
      notes: data.notes || '',
      promotion_id: data.promotion_id,
      promotion_name: data.promotion_name,
      discount_amount: data.discount_amount,
    };

    if (get().useMockData) {
      const updatedSales = [newSale, ...get().sales];
      const updatedSummary = computeMobileSummary(get().expenses, updatedSales);
      set({ sales: updatedSales, summary: updatedSummary });
      return newSale;
    }

    try {
      const created = await MobileApiService.registerSale(data);
      set((state) => ({ sales: [created, ...state.sales] }));
      get().loadAllData();
      return created;
    } catch {
      const updatedSales = [newSale, ...get().sales];
      const updatedSummary = computeMobileSummary(get().expenses, updatedSales);
      set({ sales: updatedSales, summary: updatedSummary });
      return newSale;
    }
  },

  addCookieProduct: async (data: Partial<CookieProduct>) => {
    const salePrice = Number(data.sale_price) || 35.0;
    const recipeCost = Number(data.recipe_cost) || 9.5;
    const profit = Math.max(0, salePrice - recipeCost);
    const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

    const newCookie: CookieProduct = {
      id: Date.now(),
      name: data.name || 'Nueva Galleta',
      description: data.description || '',
      sale_price: salePrice,
      recipe_cost: recipeCost,
      profit_per_unit: Number(profit.toFixed(2)),
      profit_margin_pct: Number(margin.toFixed(2)),
      batch_yield: data.batch_yield || 12,
      ingredients: data.ingredients || [],
      image_url:
        data.image_url ||
        'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
      is_active: true,
    };

    if (get().useMockData) {
      set((state) => ({ cookies: [...state.cookies, newCookie] }));
      return newCookie;
    }

    try {
      const created = await MobileApiService.createCookie(data);
      set((state) => ({ cookies: [...state.cookies, created] }));
      get().loadAllData();
      return created;
    } catch {
      set((state) => ({ cookies: [...state.cookies, newCookie] }));
      return newCookie;
    }
  },

  addIngredient: async (data: Partial<Ingredient>) => {
    const pkgCost = Number(data.package_cost) || 0;
    const pkgQty = Number(data.package_quantity) || 1;
    const unitCost = pkgQty > 0 ? pkgCost / pkgQty : 0;

    const newIng: Ingredient = {
      id: Date.now(),
      name: data.name || 'Nuevo Insumo',
      unit: data.unit || 'kg',
      package_cost: pkgCost,
      package_quantity: pkgQty,
      cost_per_unit: Number(unitCost.toFixed(4)),
      stock_quantity: Number(data.stock_quantity) || 0,
      supplier: data.supplier || 'Proveedor',
    };

    if (get().useMockData) {
      set((state) => ({ ingredients: [...state.ingredients, newIng] }));
      return newIng;
    }

    try {
      const created = await MobileApiService.createIngredient(data);
      set((state) => ({ ingredients: [...state.ingredients, created] }));
      get().loadAllData();
      return created;
    } catch {
      set((state) => ({ ingredients: [...state.ingredients, newIng] }));
      return newIng;
    }
  },

  deleteCookieSale: async (id: number) => {
    if (get().useMockData) {
      const updatedSales = get().sales.filter((s) => s.id !== id);
      const updatedSummary = computeMobileSummary(get().expenses, updatedSales);
      set({ sales: updatedSales, summary: updatedSummary });
      return;
    }
    try {
      await MobileApiService.deleteSale(id);
    } catch (err) {
      console.warn(err);
    }
    const updatedSales = get().sales.filter((s) => s.id !== id);
    const updatedSummary = computeMobileSummary(get().expenses, updatedSales);
    set({ sales: updatedSales, summary: updatedSummary });
  },

  updateCookieProduct: async (id: number, data: Partial<CookieProduct>) => {
    if (get().useMockData) {
      const updatedCookies = get().cookies.map((c) => (c.id === id ? { ...c, ...data } : c));
      set({ cookies: updatedCookies });
      return updatedCookies.find((c) => c.id === id)!;
    }
    try {
      const updated = await MobileApiService.updateCookie(id, data);
      const updatedCookies = get().cookies.map((c) => (c.id === id ? updated : c));
      set({ cookies: updatedCookies });
      return updated;
    } catch {
      const updatedCookies = get().cookies.map((c) => (c.id === id ? { ...c, ...data } : c));
      set({ cookies: updatedCookies });
      return updatedCookies.find((c) => c.id === id)!;
    }
  },

  deleteCookieProduct: async (id: number) => {
    if (get().useMockData) {
      const updatedCookies = get().cookies.filter((c) => c.id !== id);
      set({ cookies: updatedCookies });
      return;
    }
    try {
      await MobileApiService.deleteCookie(id);
    } catch (err) {
      console.warn(err);
    }
    const updatedCookies = get().cookies.filter((c) => c.id !== id);
    set({ cookies: updatedCookies });
  },

  updateIngredient: async (id: number, data: Partial<Ingredient>) => {
    if (get().useMockData) {
      const updated = get().ingredients.map((i) => (i.id === id ? { ...i, ...data } : i));
      set({ ingredients: updated });
      return updated.find((i) => i.id === id)!;
    }
    try {
      const updated = await MobileApiService.updateIngredient(id, data);
      const updatedList = get().ingredients.map((i) => (i.id === id ? updated : i));
      set({ ingredients: updatedList });
      return updated;
    } catch {
      const updated = get().ingredients.map((i) => (i.id === id ? { ...i, ...data } : i));
      set({ ingredients: updated });
      return updated.find((i) => i.id === id)!;
    }
  },

  deleteIngredient: async (id: number) => {
    if (get().useMockData) {
      const updated = get().ingredients.filter((i) => i.id !== id);
      set({ ingredients: updated });
      return;
    }
    try {
      await MobileApiService.deleteIngredient(id);
    } catch (err) {
      console.warn(err);
    }
    const updated = get().ingredients.filter((i) => i.id !== id);
    set({ ingredients: updated });
  },

  // --- PROMOCIONES ---
  addPromotion: async (data: Partial<Promotion>) => {
    if (get().useMockData) {
      const newPromo: Promotion = {
        id: Date.now(),
        name: data.name || 'Nueva Promo',
        description: data.description || '',
        promo_type: data.promo_type || 'percentage',
        discount_value: Number(data.discount_value || 0),
        target_type: data.target_type || 'all_products',
        target_product_ids: data.target_product_ids || [],
        min_quantity: Number(data.min_quantity || 1),
        min_order_amount: Number(data.min_order_amount || 0),
        is_active: data.is_active !== undefined ? data.is_active : true,
        badge_text: data.badge_text || 'PROMO',
        color_tag: data.color_tag || '#F59E0B',
        created_at: new Date().toISOString()
      };
      set({ promotions: [newPromo, ...get().promotions] });
      return newPromo;
    }
    const created = await MobileApiService.createPromotion(data);
    set({ promotions: [created, ...get().promotions] });
    return created;
  },

  updatePromotion: async (id: number, data: Partial<Promotion>) => {
    if (get().useMockData) {
      const updated = get().promotions.map((p) => (p.id === id ? { ...p, ...data } : p));
      set({ promotions: updated });
      return updated.find((p) => p.id === id)!;
    }
    const updated = await MobileApiService.updatePromotion(id, data);
    set({ promotions: get().promotions.map((p) => (p.id === id ? updated : p)) });
    return updated;
  },

  togglePromotion: async (id: number) => {
    if (get().useMockData) {
      const updated = get().promotions.map((p) =>
        p.id === id ? { ...p, is_active: !p.is_active } : p
      );
      set({ promotions: updated });
      return updated.find((p) => p.id === id)!;
    }
    const updated = await MobileApiService.togglePromotion(id);
    set({ promotions: get().promotions.map((p) => (p.id === id ? updated : p)) });
    return updated;
  },

  deletePromotion: async (id: number) => {
    if (get().useMockData) {
      set({ promotions: get().promotions.filter((p) => p.id !== id) });
      return;
    }
    await MobileApiService.deletePromotion(id);
    set({ promotions: get().promotions.filter((p) => p.id !== id) });
  },

  // --- PEDIDOS ---
  addOrder: async (data: Partial<Order>) => {
    if (get().useMockData) {
      const newOrder: Order = {
        id: Date.now(),
        customer_name: data.customer_name || 'Cliente',
        customer_phone: data.customer_phone || '',
        delivery_date: data.delivery_date || new Date().toISOString().split('T')[0],
        order_date: new Date().toISOString().split('T')[0],
        status: (data.status as any) || 'Pendiente',
        payment_method: data.payment_method || 'Transferencia',
        payment_status: (data.payment_status as any) || 'Pendiente',
        deposit_amount: Number(data.deposit_amount || 0),
        items: data.items || [],
        total_amount: Number(data.total_amount || 0),
        total_cost: Number(data.total_cost || 0),
        net_profit: Number(data.net_profit || 0),
        notes: data.notes || '',
        whatsapp_message: '',
        whatsapp_url: '',
        stock_deducted: false
      };
      set({ orders: [newOrder, ...get().orders] });
      return newOrder;
    }
    const created = await MobileApiService.createOrder(data);
    set({ orders: [created, ...get().orders] });
    return created;
  },

  updateOrder: async (id: number, data: Partial<Order>) => {
    if (get().useMockData) {
      const updated = get().orders.map((o) => (o.id === id ? { ...o, ...data } : o));
      set({ orders: updated });
      return updated.find((o) => o.id === id)!;
    }
    const updated = await MobileApiService.updateOrder(id, data);
    set({ orders: get().orders.map((o) => (o.id === id ? updated : o)) });
    return updated;
  },

  deleteOrder: async (id: number) => {
    if (get().useMockData) {
      set({ orders: get().orders.filter((o) => o.id !== id) });
      return;
    }
    await MobileApiService.deleteOrder(id);
    set({ orders: get().orders.filter((o) => o.id !== id) });
  },
}));
