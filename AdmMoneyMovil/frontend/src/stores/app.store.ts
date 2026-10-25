import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as FileSystem from 'expo-file-system';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
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
import { checkAndSendOrderDeliveryNotification } from '../services/notificationService';
import { triggerSaleCelebration } from './celebration.store';

const customStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        let val = typeof window !== 'undefined' ? window.localStorage.getItem(name) : null;
        if (!val && name === 'admmoney_mobile_settings_v2' && typeof window !== 'undefined') {
          val = window.localStorage.getItem('admmoney_mobile_settings_v1');
        }
        return val;
      } catch {
        return null;
      }
    }
    try {
      if (!FileSystem.documentDirectory) return null;
      const fileUri = `${FileSystem.documentDirectory}${name}.json`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        if (name === 'admmoney_mobile_settings_v2') {
          const oldUri = `${FileSystem.documentDirectory}admmoney_mobile_settings_v1.json`;
          const oldInfo = await FileSystem.getInfoAsync(oldUri);
          if (oldInfo.exists) {
            return await FileSystem.readAsStringAsync(oldUri);
          }
        }
        return null;
      }
      return await FileSystem.readAsStringAsync(fileUri);
    } catch (e) {
      console.warn('Storage read error:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(name, value);
        }
      } catch {}
      return;
    }
    try {
      if (!FileSystem.documentDirectory) return;
      const fileUri = `${FileSystem.documentDirectory}${name}.json`;
      await FileSystem.writeAsStringAsync(fileUri, value);
    } catch (e) {
      console.warn('Storage write error:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(name);
        }
      } catch {}
      return;
    }
    try {
      if (!FileSystem.documentDirectory) return;
      const fileUri = `${FileSystem.documentDirectory}${name}.json`;
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (e) {
      console.warn('Storage delete error:', e);
    }
  },
};

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
  theme: 'light' | 'dark';
  currency: string;
  swipeEnabled: boolean;
  hapticsEnabled: boolean;
  highPrecisionOcr: boolean;
  dailyClosingReminder: boolean;
  stockAlertsEnabled: boolean;
  orderRemindersEnabled: boolean;
  businessName: string;
  ticketFooterText: string;
  privacyMode: boolean;
  autoCategorizeAi: boolean;
  monthlyGoal: number;
  whatsappPhone1: string;
  whatsappPhone2: string;
  whatsappLabel1: string;
  whatsappLabel2: string;
  defaultQrPhone: 'phone1' | 'phone2';

  setCurrency: (currency: string) => void;
  setSwipeEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setHighPrecisionOcr: (enabled: boolean) => void;
  setDailyClosingReminder: (enabled: boolean) => void;
  setStockAlertsEnabled: (enabled: boolean) => void;
  setOrderRemindersEnabled: (enabled: boolean) => void;
  setBusinessName: (name: string) => void;
  setTicketFooterText: (text: string) => void;
  setPrivacyMode: (enabled: boolean) => void;
  setAutoCategorizeAi: (enabled: boolean) => void;
  setMonthlyGoal: (goal: number) => void;
  setWhatsappPhone1: (phone: string) => void;
  setWhatsappPhone2: (phone: string) => void;
  setWhatsappLabel1: (label: string) => void;
  setWhatsappLabel2: (label: string) => void;
  setDefaultQrPhone: (choice: 'phone1' | 'phone2') => void;
  saveWhatsAppSettings: (settings: {
    phone1: string;
    phone2: string;
    label1?: string;
    label2?: string;
    defaultQrPhone?: 'phone1' | 'phone2';
  }) => void;

  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
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
  updateCookieSale: (id: number, data: Partial<CookieSale>) => Promise<CookieSale>;
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
  deleteScannedTicket: (id: string | number) => void;
  updateScannedTicket: (id: string | number, data: Partial<ScannedTicket>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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
  theme: 'light',
  currency: 'MXN',
  swipeEnabled: true,
  hapticsEnabled: true,
  highPrecisionOcr: true,
  dailyClosingReminder: true,
  stockAlertsEnabled: true,
  orderRemindersEnabled: true,
  businessName: 'Lucky Cookies',
  ticketFooterText: '¡Gracias por endulzar tu día con nosotros!',
  privacyMode: false,
  autoCategorizeAi: true,
  monthlyGoal: 15000,
  whatsappPhone1: '',
  whatsappPhone2: '',
  whatsappLabel1: 'Pedidos Línea 1',
  whatsappLabel2: 'Pedidos Línea 2',
  defaultQrPhone: 'phone1',

  setCurrency: (currency: string) => set({ currency }),
  setSwipeEnabled: (swipeEnabled: boolean) => set({ swipeEnabled }),
  setHapticsEnabled: (hapticsEnabled: boolean) => set({ hapticsEnabled }),
  setHighPrecisionOcr: (highPrecisionOcr: boolean) => set({ highPrecisionOcr }),
  setDailyClosingReminder: (dailyClosingReminder: boolean) => set({ dailyClosingReminder }),
  setStockAlertsEnabled: (stockAlertsEnabled: boolean) => set({ stockAlertsEnabled }),
  setOrderRemindersEnabled: (orderRemindersEnabled: boolean) => {
    set({ orderRemindersEnabled });
    if (orderRemindersEnabled) {
      checkAndSendOrderDeliveryNotification(get().orders, true).catch(() => {});
    }
  },
  setBusinessName: (businessName: string) => set({ businessName }),
  setTicketFooterText: (ticketFooterText: string) => set({ ticketFooterText }),
  setPrivacyMode: (privacyMode: boolean) => set({ privacyMode }),
  setAutoCategorizeAi: (autoCategorizeAi: boolean) => set({ autoCategorizeAi }),
  setMonthlyGoal: (monthlyGoal: number) => set({ monthlyGoal }),
  setWhatsappPhone1: (whatsappPhone1: string) => set({ whatsappPhone1 }),
  setWhatsappPhone2: (whatsappPhone2: string) => set({ whatsappPhone2 }),
  setWhatsappLabel1: (whatsappLabel1: string) => set({ whatsappLabel1 }),
  setWhatsappLabel2: (whatsappLabel2: string) => set({ whatsappLabel2 }),
  setDefaultQrPhone: (defaultQrPhone: 'phone1' | 'phone2') => set({ defaultQrPhone }),
  saveWhatsAppSettings: ({ phone1, phone2, label1, label2, defaultQrPhone }) => {
    set((state) => ({
      whatsappPhone1: phone1.trim(),
      whatsappPhone2: phone2.trim(),
      whatsappLabel1: label1 && label1.trim() ? label1.trim() : (state.whatsappLabel1 || 'Pedidos Línea 1'),
      whatsappLabel2: label2 && label2.trim() ? label2.trim() : (state.whatsappLabel2 || 'Pedidos Línea 2'),
      defaultQrPhone: defaultQrPhone || state.defaultQrPhone || 'phone1',
    }));
  },

  setTheme: (theme: 'light' | 'dark') => {
    try {
      if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch {}
    set({ theme });
  },
  toggleTheme: () => {
    try {
      if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch {}
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
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

        set({
          expenses: exp || [],
          cookies: cks || [],
          ingredients: ings || [],
          sales: sls || [],
          summary: summ || null,
          promotions: prms || [],
          orders: ords || [],
          customers: custs || [],
          isOnline: true,
        });

        if (ords && ords.length > 0) {
          checkAndSendOrderDeliveryNotification(ords, get().orderRemindersEnabled).catch(() => {});
        }
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
    triggerSaleCelebration(created.total_revenue, '¡Venta Registrada! 🍪', `${data.quantity} galletas cobradas exitosamente`);
    return created;
  },

  deleteCookieSale: async (id: number) => {
    await MobileApiService.deleteSale(id);
    set((state) => ({ sales: state.sales.filter((s) => s.id !== id) }));
    get().loadAllData();
  },

  updateCookieSale: async (id: number, data: Partial<CookieSale>) => {
    const updated = await MobileApiService.updateSale(id, data);
    set((state) => ({
      sales: state.sales.map((s) => (s.id === id ? updated : s)),
    }));
    get().loadAllData();
    return updated;
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
    if (data.payment_status === 'Pagado') {
      triggerSaleCelebration(created.total_amount, '¡Pedido Pagado! 💵', `Cobraste el pedido de ${created.customer_name}`);
    }
    return created;
  },

  updateOrder: async (id: number, data: Partial<Order>) => {
    const updated = await MobileApiService.updateOrder(id, data);
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? updated : o)),
    }));
    await get().loadAllData();
    if (data.payment_status === 'Pagado') {
      triggerSaleCelebration(updated.total_amount, '¡Pedido Pagado! 💵', `Cobraste el pedido de ${updated.customer_name}`);
    }
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

  deleteScannedTicket: (id: string | number) => {
    const sId = String(id);
    set((state) => ({
      scannedTickets: state.scannedTickets.filter((t) => String(t.id) !== sId && `exp-${t.id}` !== sId),
    }));
  },

  updateScannedTicket: (id: string | number, data: Partial<ScannedTicket>) => {
    const sId = String(id);
    set((state) => ({
      scannedTickets: state.scannedTickets.map((t) =>
        String(t.id) === sId || `exp-${t.id}` === sId ? { ...t, ...data } : t
      ),
    }));
  },
    }),
    {
      name: 'admmoney_mobile_settings_v2',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        theme: state.theme,
        currency: state.currency,
        swipeEnabled: state.swipeEnabled,
        hapticsEnabled: state.hapticsEnabled,
        highPrecisionOcr: state.highPrecisionOcr,
        dailyClosingReminder: state.dailyClosingReminder,
        stockAlertsEnabled: state.stockAlertsEnabled,
        businessName: state.businessName,
        ticketFooterText: state.ticketFooterText,
        privacyMode: state.privacyMode,
        autoCategorizeAi: state.autoCategorizeAi,
        scannedTickets: state.scannedTickets,
        backendUrl: state.backendUrl,
        monthlyGoal: state.monthlyGoal,
        whatsappPhone1: state.whatsappPhone1,
        whatsappPhone2: state.whatsappPhone2,
        whatsappLabel1: state.whatsappLabel1,
        whatsappLabel2: state.whatsappLabel2,
        defaultQrPhone: state.defaultQrPhone,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.backendUrl) {
          setApiHost(state.backendUrl);
        }
      },
    }
  )
);
