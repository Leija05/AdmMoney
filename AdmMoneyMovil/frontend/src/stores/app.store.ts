import { create } from 'zustand';
import {
  Expense,
  CookieProduct,
  Ingredient,
  CookieSale,
  Order,
  Promotion,
  OverallSummary,
  Customer,
  ScannedTicket
} from '../lib/types';
import { MobileApiService, setApiHost } from '../services/api';
import { APP_CONFIG } from '../config/appConfig';

interface AppState {
  expenses: Expense[];
  cookies: CookieProduct[];
  ingredients: Ingredient[];
  sales: CookieSale[];
  promotions: Promotion[];
  orders: Order[];
  customers: Customer[];
  scannedTickets: ScannedTicket[];
  summary: OverallSummary | null;
  isOnline: boolean;
  backendUrl: string;
  isLoading: boolean;
  useMockData: boolean;
  theme: 'light' | 'dark';

  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
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
    order_id?: number;
    sale_date?: string;
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
  addCustomer: (data: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: number) => Promise<void>;
  addScannedTicket: (ticket: ScannedTicket) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  expenses: [],
  cookies: [],
  ingredients: [],
  sales: [],
  promotions: [],
  orders: [],
  customers: [],
  scannedTickets: [],
  summary: null,
  isOnline: false,
  backendUrl: APP_CONFIG.DEFAULT_API_HOST,
  isLoading: false,
  useMockData: false,
  theme: 'light',

  setTheme: (theme: 'light' | 'dark') => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  setUseMockData: (_enabled: boolean) => {
    set({ useMockData: false });
    get().loadAllData();
  },

  resetMockData: () => {
    get().loadAllData();
  },

  setBackendUrl: (url: string) => {
    setApiHost(url);
    set({ backendUrl: url });
    get().checkConnection();
  },

  checkConnection: async () => {
    const online = await MobileApiService.checkHealth();
    set({ isOnline: online });
    return online;
  },

  loadAllData: async () => {
    set({ isLoading: true });
    try {
      const online = await get().checkConnection();
      if (online) {
        const [exp, cks, ings, sls, summ, prms, ords, custs] = await Promise.all([
          MobileApiService.getExpenses().catch(() => []),
          MobileApiService.getCookies().catch(() => []),
          MobileApiService.getIngredients().catch(() => []),
          MobileApiService.getSales().catch(() => []),
          MobileApiService.getSummary().catch(() => null),
          MobileApiService.getPromotions().catch(() => []),
          MobileApiService.getOrders().catch(() => []),
          MobileApiService.getCustomers().catch(() => []),
        ]);

        let mergedCustomers: Customer[] = custs && custs.length > 0 ? [...custs] : [];
        if (ords && ords.length > 0) {
          const existingNames = new Set(mergedCustomers.map((c) => c.name.trim().toLowerCase()));
          ords.forEach((o) => {
            const clean = (o.customer_name || '').trim();
            if (clean && !existingNames.has(clean.toLowerCase())) {
              mergedCustomers.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                name: clean,
                phone: o.customer_phone || '',
                total_orders: 1,
                last_order_date: o.delivery_date,
              });
              existingNames.add(clean.toLowerCase());
            }
          });
        }

        set({
          expenses: exp || [],
          cookies: cks || [],
          ingredients: ings || [],
          sales: sls || [],
          summary: summ || null,
          promotions: prms || [],
          orders: ords || [],
          customers: mergedCustomers,
          isOnline: true,
        });
      } else {
        set({ isOnline: false });
      }
    } catch (err) {
      console.warn('Store load error:', err);
      set({ isOnline: false });
    } finally {
      set({ isLoading: false });
    }
  },

  addExpense: async (data: Partial<Expense>) => {
    const created = await MobileApiService.createExpense(data);
    set((state) => ({ expenses: [created, ...state.expenses] }));
    get().loadAllData();
    return created;
  },

  updateExpense: async (id: number, data: Partial<Expense>) => {
    const updated = await MobileApiService.updateExpense(id, data);
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
    }));
    get().loadAllData();
    return updated;
  },

  deleteExpense: async (id: number) => {
    await MobileApiService.deleteExpense(id);
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
    get().loadAllData();
  },

  addCookieSale: async (data) => {
    const created = await MobileApiService.registerSale(data);
    set((state) => ({ sales: [created, ...state.sales] }));
    get().loadAllData();
    return created;
  },

  deleteCookieSale: async (id: number) => {
    await MobileApiService.deleteSale(id);
    set((state) => ({ sales: state.sales.filter((s) => s.id !== id) }));
    get().loadAllData();
  },

  addCookieProduct: async (data: Partial<CookieProduct>) => {
    const created = await MobileApiService.createCookie(data);
    set((state) => ({ cookies: [...state.cookies, created] }));
    get().loadAllData();
    return created;
  },

  updateCookieProduct: async (id: number, data: Partial<CookieProduct>) => {
    const updated = await MobileApiService.updateCookie(id, data);
    set((state) => ({
      cookies: state.cookies.map((c) => (c.id === id ? updated : c)),
    }));
    get().loadAllData();
    return updated;
  },

  deleteCookieProduct: async (id: number) => {
    await MobileApiService.deleteCookie(id);
    set((state) => ({ cookies: state.cookies.filter((c) => c.id !== id) }));
    get().loadAllData();
  },

  addIngredient: async (data: Partial<Ingredient>) => {
    const created = await MobileApiService.createIngredient(data);
    set((state) => ({ ingredients: [...state.ingredients, created] }));
    get().loadAllData();
    return created;
  },

  updateIngredient: async (id: number, data: Partial<Ingredient>) => {
    const updated = await MobileApiService.updateIngredient(id, data);
    set((state) => ({
      ingredients: state.ingredients.map((i) => (i.id === id ? updated : i)),
    }));
    get().loadAllData();
    return updated;
  },

  deleteIngredient: async (id: number) => {
    await MobileApiService.deleteIngredient(id);
    set((state) => ({ ingredients: state.ingredients.filter((i) => i.id !== id) }));
    get().loadAllData();
  },

  addPromotion: async (data: Partial<Promotion>) => {
    const created = await MobileApiService.createPromotion(data);
    set((state) => ({ promotions: [created, ...state.promotions] }));
    get().loadAllData();
    return created;
  },

  updatePromotion: async (id: number, data: Partial<Promotion>) => {
    const updated = await MobileApiService.updatePromotion(id, data);
    set((state) => ({
      promotions: state.promotions.map((p) => (p.id === id ? updated : p)),
    }));
    get().loadAllData();
    return updated;
  },

  togglePromotion: async (id: number) => {
    const updated = await MobileApiService.togglePromotion(id);
    set((state) => ({
      promotions: state.promotions.map((p) => (p.id === id ? updated : p)),
    }));
    get().loadAllData();
    return updated;
  },

  deletePromotion: async (id: number) => {
    await MobileApiService.deletePromotion(id);
    set((state) => ({ promotions: state.promotions.filter((p) => p.id !== id) }));
    get().loadAllData();
  },

  addOrder: async (data: Partial<Order>) => {
    const created = await MobileApiService.createOrder(data);
    set((state) => ({ orders: [created, ...state.orders] }));
    await get().loadAllData();
    return created;
  },

  updateOrder: async (id: number, data: Partial<Order>) => {
    const updated = await MobileApiService.updateOrder(id, data);
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? updated : o)),
    }));
    await get().loadAllData();
    return updated;
  },

  deleteOrder: async (id: number) => {
    await MobileApiService.deleteOrder(id);
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
      sales: state.sales.filter((s) => (s as any).order_id !== id && (!s.notes || !s.notes.includes(`Pedido #${id}`))),
    }));
    await get().loadAllData();
  },

  addCustomer: async (data: Partial<Customer>) => {
    try {
      const created = await MobileApiService.createCustomer(data);
      set((state) => {
        const filtered = state.customers.filter((c) => c.name.toLowerCase() !== (data.name || '').toLowerCase());
        return { customers: [created, ...filtered] };
      });
      return created;
    } catch (err) {
      const fallback: Customer = {
        id: Date.now(),
        name: data.name || '',
        phone: data.phone || '',
        notes: data.notes || '',
        total_orders: 1,
        created_at: new Date().toISOString(),
      };
      set((state) => {
        const filtered = state.customers.filter((c) => c.name.toLowerCase() !== (data.name || '').toLowerCase());
        return { customers: [fallback, ...filtered] };
      });
      return fallback;
    }
  },

  deleteCustomer: async (id: number) => {
    try {
      await MobileApiService.deleteCustomer(id);
    } catch (e) {
      // Ignore
    }
    set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
  },

  addScannedTicket: (ticket: ScannedTicket) => {
    set((state) => {
      const exists = state.scannedTickets.some((t) => t.id === ticket.id || (t.uri && t.uri === ticket.uri));
      if (exists) return state;
      return { scannedTickets: [ticket, ...state.scannedTickets] };
    });
  },
}));
