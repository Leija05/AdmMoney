import {
  Expense,
  Ingredient,
  CookieProduct,
  CookieSale,
  Order,
  BakingSheetResponse,
  BatchScaleResponse,
  ProductionCapacityResponse,
  IngredientPurchasePayload,
  ReceiptScanResult,
  OverallSummary,
  Promotion,
  PromoCalculationRequest,
  PromoCalculationResult
} from "../lib/types";
import { APP_CONFIG, isMockDataEnabled, setMockDataEnabled } from "../config/appConfig";
import { mockRepository } from "./mockData";

class ApiService {
  private static get apiBase(): string {
    return APP_CONFIG.API_BASE_URL;
  }

  // --- MOCK MODE DETECTION & CONTROL ---
  public static isMockActive(): boolean {
    return isMockDataEnabled();
  }

  public static toggleMockMode(enabled?: boolean): boolean {
    const nextVal = enabled !== undefined ? enabled : !isMockDataEnabled();
    setMockDataEnabled(nextVal);
    return nextVal;
  }

  public static resetMockData(): void {
    mockRepository.resetToDefaults();
  }

  // --- HTTP REQUEST HELPER FOR REAL BACKEND ---
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers || {})
        },
        ...options
      });

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errData = await response.json();
          errorDetail = typeof errData.detail === 'string'
            ? errData.detail
            : Array.isArray(errData.detail)
            ? errData.detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join(', ')
            : JSON.stringify(errData);
        } catch {
          errorDetail = response.statusText;
        }
        const err = new Error(errorDetail || `HTTP ${response.status}: ${response.statusText}`);
        (err as any).status = response.status;
        (err as any).endpoint = endpoint;
        throw err;
      }

      if (response.status === 204) {
        return null as T;
      }
      const text = await response.text();
      if (!text || text.trim() === '') {
        return null as T;
      }
      return JSON.parse(text);
    } catch (err) {
      console.warn(`Request failed to ${endpoint}:`, err);
      throw err;
    }
  }

  // --- HEALTH & STATUS ---
  static async checkHealth(): Promise<boolean> {
    if (this.isMockActive()) {
      return true;
    }
    try {
      const res = await fetch(`${this.apiBase}/health`, { method: "GET" });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- GASTOS GENERALES ---
  static async getExpenses(category?: string, search?: string): Promise<Expense[]> {
    if (this.isMockActive()) {
      return mockRepository.getExpenses(category, search);
    }

    let url = "/expenses";
    const params = new URLSearchParams();
    if (category && category !== "Todas") params.append("category", category);
    if (search) params.append("search", search);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    return this.request<Expense[]>(url);
  }

  static async createExpense(data: Partial<Expense>): Promise<Expense> {
    if (this.isMockActive()) {
      return mockRepository.createExpense(data);
    }

    return this.request<Expense>("/expenses", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async deleteExpense(id: number): Promise<{ message: string }> {
    if (this.isMockActive()) {
      return mockRepository.deleteExpense(id);
    }

    return this.request<{ message: string }>(`/expenses/${id}`, {
      method: "DELETE"
    });
  }

  // --- ESCÁNER DE TICKETS ---
  static async scanReceipt(file: File | string): Promise<ReceiptScanResult> {
    if (this.isMockActive()) {
      const filename = typeof file === 'string' ? file : file.name;
      return mockRepository.scanReceipt(filename);
    }

    if (typeof file === 'string') {
      return mockRepository.scanReceipt(file);
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${this.apiBase}/scanner/upload`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error("Error al procesar el ticket en el backend");
    }

    return await res.json();
  }

  static async confirmReceiptAsExpense(data: Partial<Expense>): Promise<Expense> {
    if (this.isMockActive()) {
      return mockRepository.createExpense(data);
    }

    return this.request<Expense>("/scanner/confirm", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  // --- NEGOCIO DE GALLETAS: INSUMOS & SMART INVENTORY ---
  static async getIngredients(type?: string): Promise<Ingredient[]> {
    if (this.isMockActive()) {
      return mockRepository.getIngredients();
    }
    const endpoint = type ? `/cookies/ingredients?type=${type}` : "/cookies/ingredients";
    return this.request<Ingredient[]>(endpoint);
  }

  static async getStockAlerts(): Promise<Ingredient[]> {
    if (this.isMockActive()) {
      return mockRepository.getIngredients().filter(i => (i.stock_quantity || 0) <= (i.min_stock_alert || 5));
    }
    return this.request<Ingredient[]>("/cookies/stock-alerts");
  }

  static async createIngredient(data: Partial<Ingredient>): Promise<Ingredient> {
    if (this.isMockActive()) {
      return mockRepository.createIngredient(data);
    }

    return this.request<Ingredient>("/cookies/ingredients", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async recordStockPurchase(ingredientId: number, data: IngredientPurchasePayload): Promise<Ingredient> {
    if (this.isMockActive()) {
      return mockRepository.recordStockPurchase(ingredientId, data);
    }

    return this.request<Ingredient>(`/cookies/ingredients/${ingredientId}/purchase`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async updateIngredient(id: number, data: Partial<Ingredient>): Promise<Ingredient> {
    if (this.isMockActive()) {
      return mockRepository.createIngredient({ ...data, id });
    }

    return this.request<Ingredient>(`/cookies/ingredients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  static async deleteIngredient(id: number): Promise<{ message: string }> {
    if (this.isMockActive()) {
      return mockRepository.deleteIngredient(id);
    }

    return this.request<{ message: string }>(`/cookies/ingredients/${id}`, {
      method: "DELETE"
    });
  }

  // --- NEGOCIO DE GALLETAS: PRODUCTOS & RECETAS ---
  static async getCookies(category?: string): Promise<CookieProduct[]> {
    if (this.isMockActive()) {
      return mockRepository.getCookies();
    }
    const endpoint = category ? `/cookies/products?category=${encodeURIComponent(category)}` : "/cookies/products";
    return this.request<CookieProduct[]>(endpoint);
  }

  static async createCookie(data: Partial<CookieProduct>): Promise<CookieProduct> {
    if (this.isMockActive()) {
      return mockRepository.createCookie(data);
    }

    return this.request<CookieProduct>("/cookies/products", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async updateCookie(id: number, data: Partial<CookieProduct>): Promise<CookieProduct> {
    if (this.isMockActive()) {
      return mockRepository.createCookie({ ...data, id });
    }

    return this.request<CookieProduct>(`/cookies/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  static async deleteCookie(id: number): Promise<{ message: string }> {
    if (this.isMockActive()) {
      return mockRepository.deleteCookie(id);
    }

    return this.request<{ message: string }>(`/cookies/products/${id}`, {
      method: "DELETE"
    });
  }

  // --- HERRAMIENTAS: BATCH SCALER & CAPACIDAD ---
  static async getBatchScaler(productId: number, targetUnits: number, wastePct?: number): Promise<BatchScaleResponse> {
    if (this.isMockActive()) {
      return mockRepository.getBatchScaler(productId, targetUnits, wastePct);
    }
    let url = `/cookies/batch-scaler?product_id=${productId}&target_units=${targetUnits}`;
    if (wastePct !== undefined) url += `&waste_pct=${wastePct}`;
    return this.request<BatchScaleResponse>(url);
  }

  static async getProductionCapacity(): Promise<ProductionCapacityResponse> {
    if (this.isMockActive()) {
      return mockRepository.getProductionCapacity();
    }
    return this.request<ProductionCapacityResponse>("/cookies/production-capacity");
  }

  // --- PEDIDOS & PIPELINE DE PRODUCCIÓN ---
  static async getOrders(status?: string, deliveryDate?: string, customerName?: string): Promise<Order[]> {
    if (this.isMockActive()) {
      return mockRepository.getOrders();
    }
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (deliveryDate) params.append("delivery_date", deliveryDate);
    if (customerName) params.append("customer_name", customerName);
    const qs = params.toString();
    return this.request<Order[]>(`/orders${qs ? `?${qs}` : ''}`);
  }

  static async createOrder(data: Partial<Order>): Promise<Order> {
    if (this.isMockActive()) {
      return mockRepository.createOrder(data);
    }
    return this.request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
    if (this.isMockActive()) {
      return mockRepository.updateOrder(id, data);
    }
    return this.request<Order>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  static async updateOrderStatus(id: number, status: string): Promise<Order> {
    if (this.isMockActive()) {
      return mockRepository.updateOrder(id, { status });
    }
    return this.request<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  }

  static async deleteOrder(id: number): Promise<{ message: string }> {
    if (this.isMockActive()) {
      mockRepository.deleteOrder(id);
      return { message: "Pedido eliminado" };
    }
    return this.request<{ message: string }>(`/orders/${id}`, {
      method: "DELETE"
    });
  }

  static async getBakingSheet(fromDate?: string, toDate?: string): Promise<BakingSheetResponse> {
    if (this.isMockActive()) {
      return mockRepository.getBakingSheet();
    }
    const params = new URLSearchParams();
    if (fromDate) params.append("from_date", fromDate);
    if (toDate) params.append("to_date", toDate);
    const qs = params.toString();
    return this.request<BakingSheetResponse>(`/orders/baking-sheet${qs ? `?${qs}` : ''}`);
  }

  // --- VENTAS DE MOSTRADOR ---
  static async getSales(): Promise<CookieSale[]> {
    if (this.isMockActive()) {
      return mockRepository.getSales();
    }
    return this.request<CookieSale[]>("/cookies/sales");
  }

  static async registerSale(data: {
    cookie_id: number;
    quantity: number;
    unit_price?: number;
    sale_date?: string;
    customer_name?: string;
    payment_method?: string;
    notes?: string;
    promotion_id?: number;
    promotion_name?: string;
    discount_amount?: number;
  }): Promise<CookieSale> {
    if (this.isMockActive()) {
      return mockRepository.registerSale(data);
    }

    return this.request<CookieSale>("/cookies/sales", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  // --- PROMOCIONES Y COMBOS ---
  static async getPromotions(activeOnly?: boolean): Promise<Promotion[]> {
    if (this.isMockActive()) {
      return mockRepository.getPromotions(activeOnly);
    }
    const qs = activeOnly ? '?active_only=true' : '';
    return this.request<Promotion[]>(`/promotions${qs}`);
  }

  static async getPromotion(id: number): Promise<Promotion> {
    if (this.isMockActive()) {
      const p = mockRepository.getPromotions().find(x => x.id === id);
      if (!p) throw new Error('Promoción no encontrada');
      return p;
    }
    return this.request<Promotion>(`/promotions/${id}`);
  }

  static async createPromotion(data: Partial<Promotion>): Promise<Promotion> {
    if (this.isMockActive()) {
      return mockRepository.createPromotion(data);
    }
    return this.request<Promotion>('/promotions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updatePromotion(id: number, data: Partial<Promotion>): Promise<Promotion> {
    if (this.isMockActive()) {
      return mockRepository.updatePromotion(id, data);
    }
    return this.request<Promotion>(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async togglePromotion(id: number): Promise<Promotion> {
    if (this.isMockActive()) {
      return mockRepository.togglePromotion(id);
    }
    return this.request<Promotion>(`/promotions/${id}/toggle`, {
      method: 'PATCH'
    });
  }

  static async deletePromotion(id: number): Promise<void> {
    if (this.isMockActive()) {
      mockRepository.deletePromotion(id);
      return;
    }
    return this.request<void>(`/promotions/${id}`, {
      method: 'DELETE'
    });
  }

  static async calculatePromotion(request: PromoCalculationRequest): Promise<PromoCalculationResult> {
    if (this.isMockActive()) {
      return mockRepository.calculatePromotion(request);
    }
    return this.request<PromoCalculationResult>('/promotions/calculate', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  // --- ANALÍTICA GENERAL V2.0 ---
  static async getOverallSummary(): Promise<OverallSummary> {
    if (this.isMockActive()) {
      return mockRepository.getOverallSummary();
    }
    return this.request<OverallSummary>("/analytics/summary");
  }
}

export { ApiService };
export default ApiService;
