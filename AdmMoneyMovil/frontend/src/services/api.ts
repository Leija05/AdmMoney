import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  Expense,
  CookieProduct,
  Ingredient,
  CookieSale,
  Order,
  Promotion,
  PromoCalculationRequest,
  PromoCalculationResult,
  ReceiptScanResult,
  OverallSummary,
  Customer,
  DailySummary
} from '../lib/types';

// Default backend host (supports Render URL, local network IP, or localhost)
const initialHost = process.env.EXPO_PUBLIC_API_URL
  ? (process.env.EXPO_PUBLIC_API_URL.endsWith('/api') ? process.env.EXPO_PUBLIC_API_URL : `${process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '')}/api`)
  : 'http://localhost:8000/api';

let API_HOST = initialHost;

export const setApiHost = (newHost: string) => {
  API_HOST = newHost.endsWith('/api') ? newHost : `${newHost}/api`;
};

export const getApiHost = () => API_HOST;

const COMMON_MERCHANTS = [
  'COSTCO', 'WALMART', "SAM'S CLUB", 'SAMS CLUB', 'OXXO', 'SORIANA',
  'BODEGA AURRERA', 'CHEDRAUI', 'LA COMER', 'CITY MARKET', 'FARMACIAS GUADALAJARA',
  'FARMACIAS DEL AHORRO', 'MATERIAS PRIMAS', 'CENTRAL DE ABASTOS', '7 ELEVEN',
  'SEVEN ELEVEN', 'HOME DEPOT', 'LIVERPOOL', 'SUBURBIA'
];

function parseReceiptText(rawText: string): ReceiptScanResult {
  const upper = rawText.toUpperCase();
  let merchant = 'Ticket de Compra';

  for (const m of COMMON_MERCHANTS) {
    if (upper.includes(m)) {
      merchant = m.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }

  if (merchant === 'Ticket de Compra') {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.length > 2 && line.length < 35 && !/^\d+$/.test(line) && !line.includes('$')) {
        merchant = line.replace(/[^\w\s]/gi, '').trim();
        break;
      }
    }
  }

  // Detect total: search for TOTAL, IMPORTE, A PAGAR, or largest dollar amount
  let total = 0;
  const totalMatches = rawText.match(/(?:TOTAL|IMPORTE|A PAGAR|PAGO|MONTO)\s*[:\$]?\s*([0-9]+[,\.][0-9]{2})/gi);
  if (totalMatches) {
    for (const match of totalMatches) {
      const numMatch = match.match(/([0-9]+[,\.][0-9]{2})/);
      if (numMatch) {
        const val = parseFloat(numMatch[1].replace(',', ''));
        if (val > total) total = val;
      }
    }
  }

  if (total === 0) {
    const allAmounts = rawText.match(/\$?\s*([0-9]+\.[0-9]{2})/g);
    if (allAmounts) {
      for (const a of allAmounts) {
        const val = parseFloat(a.replace('$', '').trim());
        if (val > total && val < 50000) total = val;
      }
    }
  }

  // Detect date
  let detectedDate = new Date().toISOString().split('T')[0];
  const dateMatch = rawText.match(/(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})/);
  if (dateMatch) {
    const clean = dateMatch[1].replace(/\//g, '-');
    const parts = clean.split('-');
    if (parts[0].length === 4) {
      detectedDate = clean;
    } else if (parts[2].length === 4) {
      detectedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  // Detect category
  let category = 'Insumos Galletas';
  const lower = rawText.toLowerCase();
  if (/(bolsa|caja|kraft|liston|etiqueta|empaque|cinta)/i.test(lower)) {
    category = 'Empaques y Envíos';
  } else if (/(gas|cfe|luz|agua|internet|telmex)/i.test(lower)) {
    category = 'Servicios y Luz';
  } else if (/(gasolina|combustible|uber|didi|estacionamiento)/i.test(lower)) {
    category = 'Transporte';
  } else if (/(despensa|super|jabon|papel|limpieza)/i.test(lower)) {
    category = 'Hogar y Personales';
  }

  // Extract items with intelligent multi-format POS column parser
  const items: Array<{ name: string; quantity: number; price: number }> = [];
  const lines = rawText.split('\n');

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    const upper = line.toUpperCase();
    if (['TOTAL', 'SUBTOTAL', 'IVA', 'CAMBIO', 'EFECTIVO', 'FECHA', 'DESCRIPCION', 'CANTIDAD', 'PAGO', 'TARJETA', 'CLIENTE'].some((k) => upper.includes(k))) {
      continue;
    }

    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;

    const lastStr = parts[parts.length - 1].replace('$', '').replace(',', '');
    const lastPrice = parseFloat(lastStr);

    if (!isNaN(lastPrice) && lastPrice > 0 && lastPrice < 90000) {
      // Formato A: Último es precio, penúltimo es cantidad (ej. PEPPERONI ORIGINAL 1.000 76.00)
      if (parts.length >= 3) {
        const secondLastQty = parseFloat(parts[parts.length - 2]);
        if (!isNaN(secondLastQty) && secondLastQty > 0 && secondLastQty <= 100) {
          const rawName = parts.slice(0, parts.length - 2).join(' ').trim();
          if (rawName.length >= 2) {
            const formattedName = rawName.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
            items.push({ name: formattedName, quantity: secondLastQty, price: lastPrice });
            continue;
          }
        }
      }

      // Formato B: Primero es cantidad, último es precio (ej. 2 LECHE LALA 28.50)
      const firstQty = parseFloat(parts[0]);
      if (!isNaN(firstQty) && firstQty > 0 && firstQty <= 100) {
        const rawName = parts.slice(1, parts.length - 1).join(' ').trim();
        if (rawName.length >= 2) {
          const formattedName = rawName.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
          items.push({ name: formattedName, quantity: firstQty, price: lastPrice });
          continue;
        }
      }

      // Formato C: Nombre directo y precio (ej. QUESO MANCHEGO 65.00)
      const rawName = parts.slice(0, parts.length - 1).join(' ').trim();
      if (rawName.length >= 3 && !/^\d+$/.test(rawName)) {
        const formattedName = rawName.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
        items.push({ name: formattedName, quantity: 1, price: lastPrice });
      }
    }
  }

  // Si no se detectó un total explícito pero hay productos, sumar los productos
  if (total === 0 && items.length > 0) {
    total = parseFloat(items.reduce((acc, it) => acc + it.price, 0).toFixed(2));
  }

  const subtotal = total > 0 ? parseFloat((total / 1.16).toFixed(2)) : 0;
  const tax = total > 0 ? parseFloat((total - subtotal).toFixed(2)) : 0;

  return {
    merchant: merchant || 'Ticket Registrado',
    date: detectedDate,
    total_amount: total,
    subtotal,
    tax,
    items,
    suggested_category: category,
    confidence: total > 0 ? 0.95 : 0.60,
    raw_text: rawText.slice(0, 1000)
  };
}

export class MobileApiService {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_HOST}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      ...options
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    if (res.status === 204) {
      return null as T;
    }
    const text = await res.text();
    if (!text || text.trim() === '') {
      return null as T;
    }
    return JSON.parse(text);
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_HOST}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- GASTOS ---
  static async getExpenses(): Promise<Expense[]> {
    return this.request<Expense[]>('/expenses');
  }

  static async createExpense(data: Partial<Expense>): Promise<Expense> {
    return this.request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateExpense(id: number, data: Partial<Expense>): Promise<Expense> {
    return this.request<Expense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteExpense(id: number): Promise<void> {
    await this.request(`/expenses/${id}`, { method: 'DELETE' });
  }

  // --- ESCÁNER DE TICKETS CON CÁMARA / FOTO ---
  static async scanReceipt(imageUri: string): Promise<ReceiptScanResult> {
    const fallbackResult: ReceiptScanResult = {
      merchant: 'Ticket de Compra',
      date: new Date().toISOString().split('T')[0],
      total_amount: 0.00,
      subtotal: 0.00,
      tax: 0.00,
      items: [],
      suggested_category: 'Insumos Galletas',
      confidence: 0.50,
      raw_text: 'Ticket capturado. Puedes ingresar o ajustar el monto directamente.'
    };

    // 1. Optimización y compresión previa en el dispositivo (reduce MB a ~250KB al instante)
    let optimizedUri = imageUri;
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1400 } }],
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG }
      );
      if (manipResult && manipResult.uri) {
        optimizedUri = manipResult.uri;
      }
    } catch (manipErr) {
      console.warn('ImageManipulator error, using original uri:', manipErr);
    }

    // Helper con timeout forzado para evitar bloqueos
    const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    // 2. Intentar enviar a backend principal (IA Gemini + Compresión Server) con timeout de 25 segundos
    try {
      const formData = new FormData();
      const filename = optimizedUri.split('/').pop() || 'ticket.jpg';
      const cleanUri = Platform.OS === 'ios' ? optimizedUri.replace('file://', '') : optimizedUri;

      formData.append('file', {
        uri: cleanUri,
        name: filename,
        type: 'image/jpeg'
      } as any);

      const res = await fetchWithTimeout(`${API_HOST}/scanner/upload`, {
        method: 'POST',
        body: formData,
      }, 25000);

      if (res && res.ok) {
        const json = await res.json();
        if (json && (json.total_amount > 0 || (json.items && json.items.length > 0) || json.merchant !== 'Ticket de Compra')) {
          if (json.image_url && typeof json.image_url === 'string' && json.image_url.startsWith('/')) {
            const baseHost = API_HOST.replace(/\/api\/?$/, '');
            json.image_url = `${baseHost}${json.image_url}`;
          }
          return json;
        }
      }
    } catch (backendErr) {
      console.warn('Backend OCR call timeout or error, trying direct cloud OCR fallback:', backendErr);
    }

    // 3. Fallback de OCR directo vía OCR.space usando la imagen ya comprimida (< 300KB)
    try {
      const ocrFormData = new FormData();
      ocrFormData.append('apikey', 'K88346086088957');
      ocrFormData.append('language', 'spa');
      ocrFormData.append('isOverlayRequired', 'false');
      ocrFormData.append('isTable', 'true');
      ocrFormData.append('file', {
        uri: optimizedUri,
        name: 'ticket.jpg',
        type: 'image/jpeg',
      } as any);

      const ocrRes = await fetchWithTimeout('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: ocrFormData,
      }, 15000);

      if (ocrRes && ocrRes.ok) {
        const data = await ocrRes.json();
        const rawText = data?.ParsedResults?.[0]?.ParsedText;
        if (rawText && rawText.trim().length > 3) {
          const parsed = parseReceiptText(rawText);
          if (parsed && (parsed.total_amount > 0 || parsed.items.length > 0 || parsed.merchant !== 'Ticket de Compra')) {
            return parsed;
          }
        }
      }
    } catch (ocrErr) {
      console.warn('Direct OCR fallback error:', ocrErr);
    }

    // 4. Si no hubo internet o no se extrajo texto legible, retornar estructura base lista
    return fallbackResult;
  }

  static async confirmReceipt(expenseData: Partial<Expense>): Promise<Expense> {
    return this.request<Expense>('/scanner/confirm', {
      method: 'POST',
      body: JSON.stringify(expenseData)
    });
  }

  // --- MINI NEGOCIO DE GALLETAS ---
  static async getCookies(): Promise<CookieProduct[]> {
    return this.request<CookieProduct[]>('/cookies/products');
  }

  static async createCookie(data: Partial<CookieProduct>): Promise<CookieProduct> {
    return this.request<CookieProduct>('/cookies/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateCookie(id: number, data: Partial<CookieProduct>): Promise<CookieProduct> {
    return this.request<CookieProduct>(`/cookies/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteCookie(id: number): Promise<void> {
    await this.request(`/cookies/products/${id}`, { method: 'DELETE' });
  }

  static async bakeCookieBatch(cookieId: number, batches: number = 1): Promise<{
    cookie_id: number;
    cookie_name: string;
    batches_baked: number;
    units_added: number;
    new_stock_vitrina: number;
    message: string;
  }> {
    return this.request(`/cookies/products/${cookieId}/bake`, {
      method: 'POST',
      body: JSON.stringify({ batches }),
    });
  }

  static async adjustCookieStock(cookieId: number, newStock: number): Promise<CookieProduct> {
    return this.request<CookieProduct>(`/cookies/products/${cookieId}/stock?new_stock=${newStock}`, {
      method: 'PATCH',
    });
  }

  static async blacklistPhone(phone: string, reason?: string): Promise<void> {
    await this.request(`/public/blacklist/${phone}?reason=${encodeURIComponent(reason || 'Pedido falso / broma')}`, {
      method: 'POST',
    });
  }

  static async getSales(): Promise<CookieSale[]> {
    return this.request<CookieSale[]>('/cookies/sales');
  }

  static async registerSale(data: {
    cookie_id: number;
    quantity: number;
    unit_price?: number;
    customer_name?: string;
    payment_method?: string;
    notes?: string;
    promotion_id?: number;
    promotion_name?: string;
    discount_amount?: number;
  }): Promise<CookieSale> {
    return this.request<CookieSale>('/cookies/sales', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateSale(id: number, data: Partial<CookieSale>): Promise<CookieSale> {
    return this.request<CookieSale>(`/cookies/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteSale(id: number): Promise<void> {
    await this.request(`/cookies/sales/${id}`, { method: 'DELETE' });
  }

  static async getIngredients(): Promise<Ingredient[]> {
    return this.request<Ingredient[]>('/cookies/ingredients');
  }

  static async createIngredient(data: Partial<Ingredient>): Promise<Ingredient> {
    return this.request<Ingredient>('/cookies/ingredients', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateIngredient(id: number, data: Partial<Ingredient>): Promise<Ingredient> {
    return this.request<Ingredient>(`/cookies/ingredients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteIngredient(id: number): Promise<void> {
    await this.request(`/cookies/ingredients/${id}`, { method: 'DELETE' });
  }

  static async getSummary(): Promise<OverallSummary> {
    return this.request<OverallSummary>('/analytics/summary');
  }

  // --- PROMOCIONES Y COMBOS ---
  static async getPromotions(activeOnly?: boolean): Promise<Promotion[]> {
    const qs = activeOnly ? '?active_only=true' : '';
    return this.request<Promotion[]>(`/promotions${qs}`);
  }

  static async createPromotion(data: Partial<Promotion>): Promise<Promotion> {
    return this.request<Promotion>('/promotions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updatePromotion(id: number, data: Partial<Promotion>): Promise<Promotion> {
    return this.request<Promotion>(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async togglePromotion(id: number): Promise<Promotion> {
    return this.request<Promotion>(`/promotions/${id}/toggle`, {
      method: 'PATCH'
    });
  }

  static async deletePromotion(id: number): Promise<void> {
    await this.request(`/promotions/${id}`, { method: 'DELETE' });
  }

  static async calculatePromotion(req: PromoCalculationRequest): Promise<PromoCalculationResult> {
    return this.request<PromoCalculationResult>('/promotions/calculate', {
      method: 'POST',
      body: JSON.stringify(req)
    });
  }

  // --- PEDIDOS Y HOJA DE HORNEADO ---
  static async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/orders');
  }

  static async createOrder(data: Partial<Order>): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
    return this.request<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteOrder(id: number): Promise<void> {
    await this.request(`/orders/${id}`, { method: 'DELETE' });
  }

  static async getBakingSheet(fromDate?: string, toDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    const qs = params.toString();
    return this.request<any>(`/orders/baking-sheet${qs ? `?${qs}` : ''}`);
  }

  // --- REGISTRO Y DIRECTORIO DE CLIENTES ---
  static async getCustomers(): Promise<Customer[]> {
    try {
      return await this.request<Customer[]>('/customers');
    } catch {
      // Fallback silencioso si Render aún no tiene desplegado el router /api/customers
      return [];
    }
  }

  static async createCustomer(data: Partial<Customer>): Promise<Customer> {
    try {
      return await this.request<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      // Generación local provisional si el backend remoto responde 404
      return {
        id: Date.now(),
        name: data.name || '',
        phone: data.phone || '',
        notes: data.notes || '',
        created_at: new Date().toISOString(),
      };
    }
  }

  static async deleteCustomer(id: number): Promise<void> {
    try {
      await this.request(`/customers/${id}`, { method: 'DELETE' });
    } catch {
      // Silencioso
    }
  }

  // --- LISTA NEGRA ANTI-BROMISTAS (PEDIDOS FALSOS) ---
  static async getBlacklist(): Promise<{ phone: string; reason?: string; blocked_at?: string }[]> {
    try {
      return await this.request('/public/blacklist');
    } catch {
      return [];
    }
  }

  static async addToBlacklist(phone: string, reason = 'Broma o pedido falso'): Promise<void> {
    const clean = phone.replace(/\D/g, '');
    if (!clean) return;
    await this.request(`/public/blacklist/${clean}?reason=${encodeURIComponent(reason)}`, {
      method: 'POST',
    });
  }

  static async removeFromBlacklist(phone: string): Promise<void> {
    const clean = phone.replace(/\D/g, '');
    if (!clean) return;
    await this.request(`/public/blacklist/${clean}`, {
      method: 'DELETE',
    });
  }

  // --- RESUMEN DEL DÍA (SOLO SI HAY VENTAS) ---
  static async getDailySummary(date?: string): Promise<DailySummary> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request<DailySummary>(`/analytics/daily-summary${query}`);
  }

  static getDailySummaryPdfUrl(date?: string): string {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return `${API_HOST}/analytics/daily-summary/pdf${query}`;
  }
}

