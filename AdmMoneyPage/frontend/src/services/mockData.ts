import {
  Expense,
  Ingredient,
  CookieProduct,
  CookieSale,
  ReceiptScanResult,
  OverallSummary,
  Promotion,
  PromoCalculationRequest,
  PromoCalculationResult
} from '../lib/types';

// Fechas dinámicas
const todayStr = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

export const INITIAL_MOCK_INGREDIENTS: Ingredient[] = [
  {
    id: 1,
    name: 'Mantequilla sin Sal Gloria',
    unit: 'kg',
    package_cost: 185.0,
    package_quantity: 1.0,
    cost_per_unit: 0.185,
    stock_quantity: 4.0,
    supplier: 'Costco Wholesale',
    updated_at: todayStr,
  },
  {
    id: 2,
    name: 'Azúcar Mascabado',
    unit: 'kg',
    package_cost: 38.0,
    package_quantity: 1.0,
    cost_per_unit: 0.038,
    stock_quantity: 6.0,
    supplier: 'Central de Abastos',
    updated_at: todayStr,
  },
  {
    id: 3,
    name: 'Azúcar Estándar',
    unit: 'kg',
    package_cost: 30.0,
    package_quantity: 1.0,
    cost_per_unit: 0.03,
    stock_quantity: 8.0,
    supplier: 'Walmart',
    updated_at: todayStr,
  },
  {
    id: 4,
    name: 'Huevo Fresco',
    unit: 'pza',
    package_cost: 85.0,
    package_quantity: 30.0,
    cost_per_unit: 2.833,
    stock_quantity: 45.0,
    supplier: 'Supermercado Local',
    updated_at: todayStr,
  },
  {
    id: 5,
    name: 'Extracto de Vainilla Natural',
    unit: 'ml',
    package_cost: 95.0,
    package_quantity: 250.0,
    cost_per_unit: 0.38,
    stock_quantity: 250.0,
    supplier: 'La Comer Gourmet',
    updated_at: todayStr,
  },
  {
    id: 6,
    name: 'Harina de Trigo Especial',
    unit: 'kg',
    package_cost: 32.0,
    package_quantity: 1.0,
    cost_per_unit: 0.032,
    stock_quantity: 12.0,
    supplier: 'Costco Wholesale',
    updated_at: todayStr,
  },
  {
    id: 7,
    name: 'Polvo para Hornear',
    unit: 'kg',
    package_cost: 85.0,
    package_quantity: 0.5,
    cost_per_unit: 0.17,
    stock_quantity: 1.0,
    supplier: 'Materias Primas',
    updated_at: todayStr,
  },
  {
    id: 8,
    name: 'Bicarbonato de Sodio',
    unit: 'kg',
    package_cost: 25.0,
    package_quantity: 0.5,
    cost_per_unit: 0.05,
    stock_quantity: 1.0,
    supplier: 'Farmacia París',
    updated_at: todayStr,
  },
  {
    id: 9,
    name: 'Maizena (Fécula de Maíz)',
    unit: 'kg',
    package_cost: 50.0,
    package_quantity: 1.0,
    cost_per_unit: 0.05,
    stock_quantity: 2.0,
    supplier: 'Central de Abastos',
    updated_at: todayStr,
  },
  {
    id: 10,
    name: 'Sal Fina de Mesa',
    unit: 'kg',
    package_cost: 20.0,
    package_quantity: 1.0,
    cost_per_unit: 0.02,
    stock_quantity: 1.0,
    supplier: 'Walmart',
    updated_at: todayStr,
  },
  {
    id: 11,
    name: 'Galletas Oreo Clásicas',
    unit: 'pza',
    package_cost: 57.0,
    package_quantity: 30.0,
    cost_per_unit: 1.9,
    stock_quantity: 90.0,
    supplier: "Sam's Club",
    updated_at: todayStr,
  },
  {
    id: 12,
    name: 'Chispas Chocolate Callebaut 54%',
    unit: 'kg',
    package_cost: 250.0,
    package_quantity: 1.0,
    cost_per_unit: 0.25,
    stock_quantity: 5.0,
    supplier: 'Materias Primas Gourmet',
    updated_at: todayStr,
  },
  {
    id: 13,
    name: 'Empaque Individual con Ventana',
    unit: 'pza',
    package_cost: 145.0,
    package_quantity: 50.0,
    cost_per_unit: 2.9,
    stock_quantity: 180.0,
    supplier: 'Empaques Monterrey',
    updated_at: todayStr,
  },
];

// Receta maestra: 16 galletas por tanda
// Costo de ingredientes por tanda: $108.38 MXN ($6.77 por galleta)
// Costo de empaque individual: $2.90 MXN
// Costo total unitario empaquetado: $9.67 MXN
const OREO_RECIPE_INGREDIENTS = [
  { name: 'Mantequilla sin Sal (180g)', quantity: 180, unit: 'g', cost: 33.3 },
  { name: 'Azúcar Mascabado (120g)', quantity: 120, unit: 'g', cost: 4.56 },
  { name: 'Azúcar Estándar (80g)', quantity: 80, unit: 'g', cost: 2.4 },
  { name: 'Huevo Fresco (2 pzas)', quantity: 2, unit: 'pza', cost: 5.66 },
  { name: 'Extracto de Vainilla (10ml)', quantity: 10, unit: 'ml', cost: 3.8 },
  { name: 'Harina de Trigo (280g)', quantity: 280, unit: 'g', cost: 8.96 },
  { name: 'Polvo para Hornear (5g)', quantity: 5, unit: 'g', cost: 0.85 },
  { name: 'Bicarbonato de Sodio (4g)', quantity: 4, unit: 'g', cost: 0.2 },
  { name: 'Maizena Fécula (15g)', quantity: 15, unit: 'g', cost: 0.75 },
  { name: 'Sal Fina (3g)', quantity: 3, unit: 'g', cost: 0.1 },
  { name: 'Galletas Oreo Troceadas (12 pzas)', quantity: 12, unit: 'pza', cost: 22.8 },
  { name: 'Chispas de Chocolate (100g)', quantity: 100, unit: 'g', cost: 25.0 },
  { name: 'Empaque Individual Kraft', quantity: 1, unit: 'pza', cost: 2.9 },
];

export const INITIAL_MOCK_COOKIES: CookieProduct[] = [
  {
    id: 1,
    name: 'Galleta Artesanal Oreo & Chispas de Chocolate',
    description:
      'Receta neoyorquina artesanal con galletas Oreo troceadas, chispas de chocolate semi-amargo y mantequilla dorada. Rendimiento: 16 galletas por tanda. Costo ingredientes $6.77 + Empaque $2.90 = $9.67.',
    sale_price: 35.0,
    recipe_cost: 9.67,
    profit_per_unit: 25.33,
    profit_margin_pct: 72.37,
    batch_yield: 16,
    ingredients: OREO_RECIPE_INGREDIENTS,
    image_url:
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 2,
    name: 'Chispas Clásicas NY Style',
    description:
      'Masa de mantequilla dorada, azúcar mascabado y abundante chocolate belga semi-amargo 54%. Rendimiento: 16 piezas por tanda.',
    sale_price: 35.0,
    recipe_cost: 9.67,
    profit_per_unit: 25.33,
    profit_margin_pct: 72.37,
    batch_yield: 16,
    ingredients: OREO_RECIPE_INGREDIENTS,
    image_url:
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 3,
    name: 'Red Velvet Cheesecake',
    description:
      'Cacao fino, color rubí intenso y un corazón horneado de cheesecake Philadelphia.',
    sale_price: 45.0,
    recipe_cost: 12.5,
    profit_per_unit: 32.5,
    profit_margin_pct: 72.22,
    batch_yield: 16,
    ingredients: [
      { name: 'Harina & Cacao', quantity: 38, unit: 'g', cost: 1.8 },
      { name: 'Mantequilla Gloria', quantity: 20, unit: 'g', cost: 3.7 },
      { name: 'Queso Crema Philadelphia', quantity: 30, unit: 'g', cost: 4.1 },
      { name: 'Empaque Individual Kraft', quantity: 1, unit: 'pza', cost: 2.9 },
    ],
    image_url:
      'https://images.unsplash.com/photo-1618923834413-2770b904ee10?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 4,
    name: 'Nutella Stuffed Bomb',
    description:
      'Galleta suave XXL rellena con 25g de Nutella cremosa líquida al centro y chispas.',
    sale_price: 48.0,
    recipe_cost: 14.2,
    profit_per_unit: 33.8,
    profit_margin_pct: 70.42,
    batch_yield: 16,
    ingredients: [
      { name: 'Masa Mantequilla', quantity: 50, unit: 'g', cost: 5.2 },
      { name: 'Nutella Relleno Centro', quantity: 25, unit: 'g', cost: 5.25 },
      { name: 'Chispas Decoración', quantity: 15, unit: 'g', cost: 3.75 },
      { name: 'Empaque Individual Kraft', quantity: 1, unit: 'pza', cost: 2.9 },
    ],
    image_url:
      'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 5,
    name: 'Avena con Canela & Nueces',
    description:
      'Copos de avena tostada con mantequilla, canela de Ceilán, nuez pecana troceada y azúcar mascabado.',
    sale_price: 35.0,
    recipe_cost: 9.67,
    profit_per_unit: 25.33,
    profit_margin_pct: 72.37,
    batch_yield: 16,
    ingredients: OREO_RECIPE_INGREDIENTS,
    image_url:
      'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
];

// Ventas registradas combinando Esquema Individual ($35.00) y Esquema Promoción 3 x $90 ($30.00 c/u)
export const INITIAL_MOCK_SALES: CookieSale[] = [
  {
    id: 1,
    cookie_id: 1,
    cookie_name: 'Galleta Artesanal Oreo & Chispas de Chocolate',
    quantity: 1,
    unit_price: 35.0,
    unit_cost: 9.67,
    total_revenue: 35.0,
    total_cost: 9.67,
    net_profit: 25.33,
    sale_date: todayStr,
    customer_name: 'Cliente Mostrador',
    payment_method: 'Efectivo',
    notes: 'Venta Individual ($35.00 MXN) • Ganancia +$25.33',
  },
  {
    id: 2,
    cookie_id: 1,
    cookie_name: 'Galleta Artesanal Oreo & Chispas de Chocolate',
    quantity: 3,
    unit_price: 30.0,
    unit_cost: 9.67,
    total_revenue: 90.0,
    total_cost: 29.01,
    net_profit: 60.99,
    sale_date: todayStr,
    customer_name: 'Café La Terraza Roma',
    payment_method: 'Transferencia',
    notes: 'Promoción 3 x $90.00 MXN ($30 c/u) • Ganancia +$60.99',
  },
  {
    id: 3,
    cookie_id: 1,
    cookie_name: 'Galleta Artesanal Oreo & Chispas de Chocolate',
    quantity: 6,
    unit_price: 30.0,
    unit_cost: 9.67,
    total_revenue: 180.0,
    total_cost: 58.02,
    net_profit: 121.98,
    sale_date: yesterday,
    customer_name: 'Boutique Gourmet Petit',
    payment_method: 'Transferencia',
    notes: '2x Paquetes Promo 3 x $90 ($30 c/u)',
  },
  {
    id: 4,
    cookie_id: 2,
    cookie_name: 'Chispas Clásicas NY Style',
    quantity: 3,
    unit_price: 30.0,
    unit_cost: 9.67,
    total_revenue: 90.0,
    total_cost: 29.01,
    net_profit: 60.99,
    sale_date: yesterday,
    customer_name: 'Mariana López (Oficina)',
    payment_method: 'Efectivo',
    notes: 'Promoción 3 x $90.00 MXN',
  },
  {
    id: 5,
    cookie_id: 1,
    cookie_name: 'Galleta Artesanal Oreo & Chispas de Chocolate',
    quantity: 1,
    unit_price: 35.0,
    unit_cost: 9.67,
    total_revenue: 35.0,
    total_cost: 9.67,
    net_profit: 25.33,
    sale_date: twoDaysAgo,
    customer_name: 'Carlos Mendoza',
    payment_method: 'Tarjeta Débito',
    notes: 'Venta Individual ($35.00 MXN)',
  },
  {
    id: 6,
    cookie_id: 1,
    cookie_name: 'Galleta Artesanal Oreo & Chispas de Chocolate',
    quantity: 3,
    unit_price: 30.0,
    unit_cost: 9.67,
    total_revenue: 90.0,
    total_cost: 29.01,
    net_profit: 60.99,
    sale_date: twoDaysAgo,
    customer_name: 'Gimnasio FitZone Condesa',
    payment_method: 'Transferencia',
    notes: 'Promoción 3 x $90.00 MXN ($30 c/u)',
  },
];

export const INITIAL_MOCK_EXPENSES: Expense[] = [
  {
    id: 1,
    title: 'Insumos Taller: Harina, Mantequilla y Galletas Oreo',
    amount: 850.0,
    category: 'Insumos Galletas',
    date: todayStr,
    payment_method: 'Tarjeta Débito',
    notes: 'Ticket Insumos Receta 16 galletas',
  },
  {
    id: 2,
    title: 'Cajas de Empaque Kraft con Ventana Individual (100 pzas)',
    amount: 290.0,
    category: 'Empaques y Envíos',
    date: todayStr,
    payment_method: 'Transferencia',
    notes: 'Empaque individual a $2.90 por pieza',
  },
  {
    id: 3,
    title: 'Recarga de Gas para Horno Industrial',
    amount: 650.0,
    category: 'Servicios y Luz',
    date: yesterday,
    payment_method: 'Efectivo',
    notes: 'Cilindro 30kg cocina del taller',
  },
  {
    id: 4,
    title: 'Luz Eléctrica CFE Bimestral Taller',
    amount: 890.0,
    category: 'Servicios y Luz',
    date: yesterday,
    payment_method: 'Transferencia',
    notes: 'Recibo luz correspondiente al bimestre',
  },
  {
    id: 5,
    title: 'Campañas Publicidad Instagram & Meta Ads',
    amount: 350.0,
    category: 'Marketing y Redes',
    date: twoDaysAgo,
    payment_method: 'Tarjeta Crédito',
    notes: 'Promoción especial Galleta Oreo & Chispas 3x$90',
  },
  {
    id: 6,
    title: 'Gasolina para Entregas y Pedidos Locales',
    amount: 400.0,
    category: 'Transporte',
    date: twoDaysAgo,
    payment_method: 'Efectivo',
    notes: 'Ruta de reparto zona Roma / Condesa / Polanco',
  },
  {
    id: 7,
    title: 'Despensa Personal y Frutas Semanal',
    amount: 1250.0,
    category: 'Hogar y Personales',
    date: twoDaysAgo,
    payment_method: 'Tarjeta Débito',
    notes: 'Despensa familiar semanal',
  },
];

export const MOCK_RECEIPT_SCAN_SAMPLE: ReceiptScanResult = {
  merchant: 'Costco Wholesale México',
  date: todayStr,
  total_amount: 1687.8,
  subtotal: 1455.0,
  tax: 232.8,
  items: [
    { name: 'Harina Trigo Especial 10Kg', quantity: 1, price: 320.0 },
    { name: 'Mantequilla Gloria sin Sal 1Kg', quantity: 2, price: 370.0 },
    { name: 'Chispas Chocolate Callebaut 2Kg', quantity: 1, price: 480.0 },
    { name: 'Azúcar Mascabado 5Kg', quantity: 1, price: 190.0 },
    { name: 'Extracto Vainilla Natural 250ml', quantity: 1, price: 95.0 },
  ],
  suggested_category: 'Insumos Galletas',
  confidence: 0.98,
  raw_text: 'COSTCO WHOLESALE DE MEXICO\nSUCURSAL POLANCO\nFECHA: 2026-10-12\nTOTAL: $1,687.80\n¡GRACIAS POR SU COMPRA!',
};

/**
 * Repositorio Reactivo en Memoria para Modo de Prueba (Demo)
 */
class MockDataRepository {
  private ingredients: Ingredient[] = [...INITIAL_MOCK_INGREDIENTS];
  private cookies: CookieProduct[] = [...INITIAL_MOCK_COOKIES];
  private sales: CookieSale[] = [...INITIAL_MOCK_SALES];
  private expenses: Expense[] = [...INITIAL_MOCK_EXPENSES];

  constructor() {
    this.loadFromStorage();
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('admmoney_mock_ingredients_v2', JSON.stringify(this.ingredients));
      localStorage.setItem('admmoney_mock_cookies_v2', JSON.stringify(this.cookies));
      localStorage.setItem('admmoney_mock_sales_v2', JSON.stringify(this.sales));
      localStorage.setItem('admmoney_mock_expenses_v2', JSON.stringify(this.expenses));
    } catch {
      // ignore
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const ing = localStorage.getItem('admmoney_mock_ingredients_v2');
      const cks = localStorage.getItem('admmoney_mock_cookies_v2');
      const sls = localStorage.getItem('admmoney_mock_sales_v2');
      const exp = localStorage.getItem('admmoney_mock_expenses_v2');

      if (ing) this.ingredients = JSON.parse(ing);
      if (cks) this.cookies = JSON.parse(cks);
      if (sls) this.sales = JSON.parse(sls);
      if (exp) this.expenses = JSON.parse(exp);
    } catch {
      // ignore
    }
  }

  public resetToDefaults() {
    this.ingredients = [...INITIAL_MOCK_INGREDIENTS];
    this.cookies = [...INITIAL_MOCK_COOKIES];
    this.sales = [...INITIAL_MOCK_SALES];
    this.expenses = [...INITIAL_MOCK_EXPENSES];
    this.saveToStorage();
  }

  // --- Expenses ---
  public getExpenses(category?: string, search?: string): Expense[] {
    return this.expenses.filter((e) => {
      const matchesCat = !category || category === 'Todas' || e.category === category;
      const matchesSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }

  public createExpense(data: Partial<Expense>): Expense {
    const newExp: Expense = {
      id: Date.now(),
      title: data.title || 'Nuevo Gasto',
      amount: Number(data.amount) || 0,
      category: data.category || 'Otros Gastos',
      date: data.date || todayStr,
      payment_method: data.payment_method || 'Efectivo',
      notes: data.notes || '',
      receipt_url: data.receipt_url || '',
      created_at: new Date().toISOString(),
    };
    this.expenses = [newExp, ...this.expenses];
    this.saveToStorage();
    return newExp;
  }

  public deleteExpense(id: number): { message: string } {
    this.expenses = this.expenses.filter((e) => e.id !== id);
    this.saveToStorage();
    return { message: 'Gasto eliminado con éxito' };
  }

  // --- Cookies ---
  public getCookies(): CookieProduct[] {
    return [...this.cookies];
  }

  public createCookie(data: Partial<CookieProduct>): CookieProduct {
    const salePrice = Number(data.sale_price) || 35.0;
    const recipeCost = Number(data.recipe_cost) || 9.67;
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
      batch_yield: data.batch_yield || 16,
      ingredients: data.ingredients || OREO_RECIPE_INGREDIENTS,
      image_url:
        data.image_url ||
        'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.cookies = [...this.cookies, newCookie];
    this.saveToStorage();
    return newCookie;
  }

  public deleteCookie(id: number): { message: string } {
    this.cookies = this.cookies.filter((c) => c.id !== id);
    this.saveToStorage();
    return { message: 'Galleta dada de baja' };
  }

  // --- Ingredients ---
  public getIngredients(): Ingredient[] {
    return [...this.ingredients];
  }

  public createIngredient(data: Partial<Ingredient>): Ingredient {
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
      supplier: data.supplier || 'Proveedor Local',
      updated_at: todayStr,
    };
    this.ingredients = [...this.ingredients, newIng];
    this.saveToStorage();
    return newIng;
  }

  public deleteIngredient(id: number): { message: string } {
    this.ingredients = this.ingredients.filter((i) => i.id !== id);
    this.saveToStorage();
    return { message: 'Insumo eliminado' };
  }

  // --- Sales ---
  public getSales(): CookieSale[] {
    return [...this.sales];
  }

  public registerSale(data: {
    cookie_id: number;
    quantity: number;
    unit_price?: number;
    customer_name?: string;
    payment_method?: string;
    notes?: string;
  }): CookieSale {
    const cookie = this.cookies.find((c) => c.id === data.cookie_id);
    const unitCost = cookie?.recipe_cost || 9.67;
    const qty = data.quantity || 1;

    // Detectar si aplica precio de lista o promoción automática 3x$90
    let unitPrice = data.unit_price;
    if (!unitPrice) {
      if (qty % 3 === 0) {
        unitPrice = 30.0; // Promoción 3 x $90 ($30 c/u)
      } else {
        unitPrice = cookie?.sale_price || 35.0;
      }
    }

    const totalRev = unitPrice * qty;
    const totalCst = unitCost * qty;
    const netProfit = totalRev - totalCst;

    const newSale: CookieSale = {
      id: Date.now(),
      cookie_id: data.cookie_id,
      cookie_name: cookie?.name || 'Galleta Artesanal Oreo & Chispas',
      quantity: qty,
      unit_price: unitPrice,
      unit_cost: unitCost,
      total_revenue: Number(totalRev.toFixed(2)),
      total_cost: Number(totalCst.toFixed(2)),
      net_profit: Number(netProfit.toFixed(2)),
      sale_date: todayStr,
      customer_name: data.customer_name || 'Cliente Mostrador',
      payment_method: data.payment_method || 'Efectivo',
      notes:
        data.notes ||
        (qty === 3 && unitPrice === 30.0
          ? 'Promoción 3 x $90.00 MXN'
          : `Venta de ${qty} pzas a $${unitPrice.toFixed(2)} c/u`),
      created_at: new Date().toISOString(),
    };
    this.sales = [newSale, ...this.sales];
    this.saveToStorage();
    return newSale;
  }

  // --- Dynamic Overall Summary Calculation ---
  public getOverallSummary(): OverallSummary {
    const totalAllExpenses = this.expenses.reduce((acc, e) => acc + e.amount, 0);
    const totalPersonalExpenses = this.expenses
      .filter((e) => e.category === 'Hogar y Personales')
      .reduce((acc, e) => acc + e.amount, 0);
    const totalBusinessExpenses = totalAllExpenses - totalPersonalExpenses;

    const totalCookieRevenue = this.sales.reduce((acc, s) => acc + s.total_revenue, 0);
    const totalCookieCost = this.sales.reduce((acc, s) => acc + s.total_cost, 0);
    const netCookieProfit = totalCookieRevenue - totalCookieCost;
    const overallNetBalance = totalCookieRevenue - totalAllExpenses;
    const cookieProfitMarginPct =
      totalCookieRevenue > 0 ? (netCookieProfit / totalCookieRevenue) * 100 : 0;
    const totalCookiesSold = this.sales.reduce((acc, s) => acc + s.quantity, 0);

    // Cookie performance & Ranking
    const cookiePerfMap: Record<
      number,
      {
        cookie_id: number;
        cookie_name: string;
        units_sold: number;
        revenue: number;
        profit: number;
        cost: number;
      }
    > = {};

    this.sales.forEach((s) => {
      if (!cookiePerfMap[s.cookie_id]) {
        cookiePerfMap[s.cookie_id] = {
          cookie_id: s.cookie_id,
          cookie_name: s.cookie_name,
          units_sold: 0,
          revenue: 0,
          profit: 0,
          cost: 0,
        };
      }
      cookiePerfMap[s.cookie_id].units_sold += s.quantity;
      cookiePerfMap[s.cookie_id].revenue += s.total_revenue;
      cookiePerfMap[s.cookie_id].profit += s.net_profit;
      cookiePerfMap[s.cookie_id].cost += s.total_cost;
    });

    const cookiePerformance = Object.values(cookiePerfMap)
      .map((item) => ({
        cookie_id: item.cookie_id,
        cookie_name: item.cookie_name,
        units_sold: item.units_sold,
        revenue: Number(item.revenue.toFixed(2)),
        profit: Number(item.profit.toFixed(2)),
        avg_price: item.units_sold > 0 ? Number((item.revenue / item.units_sold).toFixed(2)) : 0,
        avg_cost: item.units_sold > 0 ? Number((item.cost / item.units_sold).toFixed(2)) : 0,
        margin_pct:
          item.revenue > 0 ? Number(((item.profit / item.revenue) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.units_sold - a.units_sold);

    const topSellingCookie =
      cookiePerformance[0]?.cookie_name ||
      'Galleta Artesanal Oreo & Chispas de Chocolate';

    // Category breakdown
    const catMap: Record<string, { amount: number; count: number }> = {};
    this.expenses.forEach((e) => {
      if (!catMap[e.category]) catMap[e.category] = { amount: 0, count: 0 };
      catMap[e.category].amount += e.amount;
      catMap[e.category].count += 1;
    });

    const categoryBreakdown = Object.entries(catMap).map(([category, val]) => ({
      category,
      amount: Number(val.amount.toFixed(2)),
      count: val.count,
    }));

    // Daily Trend
    const dailyTrend = [
      { date: 'Lun', expenses: 400, cookie_revenue: 350, cookie_profit: 253.3 },
      { date: 'Mar', expenses: 650, cookie_revenue: 540, cookie_profit: 381 },
      { date: 'Mié', expenses: 380, cookie_revenue: 630, cookie_profit: 440 },
      { date: 'Jue', expenses: 890, cookie_revenue: 400, cookie_profit: 280 },
      { date: 'Vie', expenses: 350, cookie_revenue: 720, cookie_profit: 506.6 },
      { date: 'Sáb', expenses: 850, cookie_revenue: 1200, cookie_profit: 850 },
      {
        date: 'Hoy',
        expenses: Number(totalAllExpenses.toFixed(2)),
        cookie_revenue: Number(totalCookieRevenue.toFixed(2)),
        cookie_profit: Number(netCookieProfit.toFixed(2)),
      },
    ];

    return {
      total_personal_expenses: Number(totalPersonalExpenses.toFixed(2)),
      total_business_expenses: Number(totalBusinessExpenses.toFixed(2)),
      total_all_expenses: Number(totalAllExpenses.toFixed(2)),
      total_cookie_revenue: Number(totalCookieRevenue.toFixed(2)),
      total_cookie_cost: Number(totalCookieCost.toFixed(2)),
      net_cookie_profit: Number(netCookieProfit.toFixed(2)),
      overall_net_balance: Number(overallNetBalance.toFixed(2)),
      cookie_profit_margin_pct: Number(cookieProfitMarginPct.toFixed(1)),
      total_cookies_sold: totalCookiesSold,
      top_selling_cookie: topSellingCookie,
      category_breakdown: categoryBreakdown,
      daily_trend: dailyTrend,
      cookie_performance: cookiePerformance,
    };
  }

  // --- Mock OCR Receipt Scanner ---
  public scanReceipt(fileOrName?: string): ReceiptScanResult {
    return {
      ...MOCK_RECEIPT_SCAN_SAMPLE,
      merchant:
        fileOrName && fileOrName.toLowerCase().includes('walmart')
          ? 'Walmart Supercenter'
          : fileOrName && fileOrName.toLowerCase().includes('oxxo')
          ? 'Cadena Comercial OXXO'
          : 'Costco Wholesale México',
      date: todayStr,
    };
  }

  // --- Mock V2.0 Orders & Baking Pipeline ---
  private mockOrders: any[] = [
    {
      id: 1,
      customer_name: "Valeria Gómez",
      customer_phone: "5512345678",
      delivery_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      order_date: todayStr,
      status: "En Preparación",
      payment_method: "Transferencia",
      payment_status: "Pagado",
      deposit_amount: 520.0,
      items: [
        { product_id: 1, product_name: "Galleta Artesanal Oreo & Chispas de Chocolate", quantity: 3, unit_price: 35.0, unit_cost: 9.67, subtotal: 105.0 },
        { product_id: 2, product_name: "Chispas Clásicas NY Style", quantity: 5, unit_price: 35.0, unit_cost: 9.67, subtotal: 175.0 },
        { product_id: 4, product_name: "Nutella Stuffed Bomb", quantity: 5, unit_price: 48.0, unit_cost: 14.20, subtotal: 240.0 }
      ],
      total_amount: 520.0,
      total_cost: 148.36,
      net_profit: 371.64,
      notes: "Entrega corporativa 14:00 hrs",
      whatsapp_message: "Hola Valeria Gómez, tu pedido es: 3x Oreo, 5x Chispas, 5x Nutella - Total: $520.0 MXN.",
      whatsapp_url: "https://wa.me/5512345678",
      stock_deducted: false,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      customer_name: "Café Bella Vista",
      customer_phone: "5598765432",
      delivery_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      order_date: todayStr,
      status: "Pendiente",
      payment_method: "Transferencia",
      payment_status: "Anticipo",
      deposit_amount: 400.0,
      items: [
        { product_id: 1, product_name: "Galleta Artesanal Oreo & Chispas de Chocolate", quantity: 6, unit_price: 30.0, unit_cost: 9.67, subtotal: 180.0 },
        { product_id: 2, product_name: "Chispas Clásicas NY Style", quantity: 13, unit_price: 30.0, unit_cost: 9.67, subtotal: 390.0 },
        { product_id: 4, product_name: "Nutella Stuffed Bomb", quantity: 5, unit_price: 42.0, unit_cost: 14.20, subtotal: 210.0 }
      ],
      total_amount: 780.0,
      total_cost: 254.75,
      net_profit: 525.25,
      notes: "Pedido semanal cafetería",
      whatsapp_message: "Hola Café Bella Vista, tu pedido es: 6x Oreo, 13x Chispas, 5x Nutella - Total: $780.0 MXN.",
      whatsapp_url: "https://wa.me/5598765432",
      stock_deducted: false,
      created_at: new Date().toISOString()
    }
  ];

  public getOrders(): any[] {
    return [...this.mockOrders];
  }

  public createOrder(data: any): any {
    const newId = this.mockOrders.length > 0 ? Math.max(...this.mockOrders.map(o => o.id)) + 1 : 1;
    const items = data.items || [];
    const total_amount = items.reduce((acc: number, it: any) => acc + (it.subtotal || it.unit_price * it.quantity), 0);
    const total_cost = items.reduce((acc: number, it: any) => acc + (it.unit_cost * it.quantity), 0);
    const order = {
      ...data,
      id: newId,
      total_amount,
      total_cost,
      net_profit: total_amount - total_cost,
      whatsapp_message: `Hola ${data.customer_name}, tu pedido para el ${data.delivery_date} es por $${total_amount} MXN.`,
      whatsapp_url: `https://wa.me/${(data.customer_phone || '').replace(/\D/g, '')}`,
      stock_deducted: false,
      created_at: new Date().toISOString()
    };
    this.mockOrders.unshift(order);
    return order;
  }

  public updateOrder(id: number, data: any): any {
    const idx = this.mockOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.mockOrders[idx] = { ...this.mockOrders[idx], ...data };
      return this.mockOrders[idx];
    }
    return null;
  }

  public deleteOrder(id: number): boolean {
    const len = this.mockOrders.length;
    this.mockOrders = this.mockOrders.filter(o => o.id !== id);
    return this.mockOrders.length < len;
  }

  public getBakingSheet(): any {
    const active = this.mockOrders.filter(o => ["Pendiente", "En Preparación", "Listo"].includes(o.status));
    const dayMap: Record<string, Record<string, number>> = {};
    const prods = ["Galleta Artesanal Oreo & Chispas de Chocolate", "Chispas Clásicas NY Style", "Nutella Stuffed Bomb"];

    active.forEach(o => {
      if (!dayMap[o.delivery_date]) dayMap[o.delivery_date] = {};
      o.items.forEach((it: any) => {
        dayMap[o.delivery_date][it.product_name] = (dayMap[o.delivery_date][it.product_name] || 0) + it.quantity;
      });
    });

    const days = Object.entries(dayMap).map(([d, pMap]) => ({
      delivery_date: d,
      day_name: new Date(d).toLocaleDateString('es-MX', { weekday: 'long' }),
      quantities_by_product: pMap,
      total_day_units: Object.values(pMap).reduce((a, b) => a + b, 0)
    }));

    return {
      days,
      product_columns: prods,
      grand_totals_by_product: {
        "Galleta Artesanal Oreo & Chispas de Chocolate": 9,
        "Chispas Clásicas NY Style": 18,
        "Nutella Stuffed Bomb": 10
      },
      total_all_units: 37,
      consolidated_ingredients: [
        { ingredient_name: "Mantequilla sin sal", total_required: 309.8, unit: "g", current_stock: 4000, is_sufficient: true },
        { ingredient_name: "Harina de trigo", total_required: 482.0, unit: "g", current_stock: 10000, is_sufficient: true },
        { ingredient_name: "Chispas de chocolate", total_required: 172.1, unit: "g", current_stock: 5000, is_sufficient: true },
        { ingredient_name: "Empaques individuales", total_required: 37, unit: "pza", current_stock: 150, is_sufficient: true }
      ]
    };
  }

  public getBatchScaler(productId: number, targetUnits: number, wastePct: number = 2.0): any {
    const cookie = this.cookies.find(c => c.id === productId) || this.cookies[0];
    const wasteFactor = 1.0 + (wastePct / 100);
    const items = (cookie.ingredients || []).map((ing: any) => {
      const scaled = Number(((ing.quantity / (cookie.batch_yield || 16)) * targetUnits * wasteFactor).toFixed(1));
      const cost = Number(((ing.cost / (cookie.batch_yield || 16)) * targetUnits * wasteFactor).toFixed(2));
      return {
        name: ing.name,
        required_quantity: scaled,
        unit: ing.unit || "g",
        unit_cost: 0.18,
        total_cost: cost,
        stock_available: 500,
        is_sufficient: 500 >= scaled,
        missing_quantity: Math.max(0, scaled - 500)
      };
    });

    const totalCost = items.reduce((a: number, b: any) => a + b.total_cost, 0);
    const rev = (cookie.sale_price || 35) * targetUnits;

    return {
      cookie_id: cookie.id,
      cookie_name: cookie.name,
      target_units: targetUnits,
      waste_pct: wastePct,
      total_raw_weight_g: targetUnits * 75 * wasteFactor,
      items,
      estimated_total_cost: Number(totalCost.toFixed(2)),
      estimated_unit_cost: Number((totalCost / targetUnits).toFixed(2)),
      projected_revenue: rev,
      projected_profit: Number((rev - totalCost).toFixed(2)),
      can_fulfill_from_stock: items.every((i: any) => i.is_sufficient)
    };
  }

  public getProductionCapacity(): any {
    return {
      capacities: this.cookies.map(c => ({
        product_id: c.id,
        product_name: c.name,
        max_producible_units: 48,
        limiting_ingredient: {
          ingredient_name: "Mantequilla sin sal",
          unit: "kg",
          available_stock: 4.0,
          required_per_unit: 0.08,
          max_units_possible: 48
        },
        all_ingredients_healthy: true
      })),
      critical_alerts: [],
      packaging_capacities: [
        { name: "Caja Kraft 6 pzas", stock_quantity: 45, unit: "pza", status: "ok" },
        { name: "Empaque individual", stock_quantity: 150, unit: "pza", status: "ok" }
      ]
    };
  }

  public recordStockPurchase(ingredientId: number, data: any): any {
    const ing = this.ingredients.find(i => i.id === ingredientId);
    if (ing) {
      const prevStock = ing.stock_quantity || 0;
      const prevCost = ing.cost_per_unit || 0;
      const newStock = prevStock + data.quantity;
      const newCpp = newStock > 0 ? (prevStock * prevCost + data.total_cost) / newStock : 0;
      ing.stock_quantity = newStock;
      ing.cost_per_unit = Number(newCpp.toFixed(4));
      return { ...ing };
    }
    return null;
  }

  // --- PROMOCIONES Y COMBOS ---
  private promotions: Promotion[] = [
    {
      id: 1,
      name: "Trío Dulce (3 Galletas x $90)",
      description: "Lleva 3 galletas artesanales de cualquier sabor por un precio especial de $90.",
      promo_type: "combo_fixed_price",
      discount_value: 90.0,
      target_type: "all_products",
      target_product_ids: [],
      min_quantity: 3,
      min_order_amount: 0.0,
      is_active: true,
      badge_text: "3 x $90",
      icon: "cookie",
      color_tag: "#F59E0B"
    },
    {
      id: 2,
      name: "Docena Consentida (15% OFF)",
      description: "15% de descuento al llevar 12 o más galletas para compartir con la familia o equipo.",
      promo_type: "percentage",
      discount_value: 15.0,
      target_type: "all_products",
      target_product_ids: [],
      min_quantity: 12,
      min_order_amount: 0.0,
      is_active: true,
      badge_text: "15% OFF",
      icon: "sparkles",
      color_tag: "#EC4899"
    },
    {
      id: 3,
      name: "Descuento Especial en Carrito ($30 OFF)",
      description: "Descuento directo de $30 MXN en pedidos o compras mayores a $250 MXN.",
      promo_type: "fixed_amount",
      discount_value: 30.0,
      target_type: "order_total",
      target_product_ids: [],
      min_quantity: 1,
      min_order_amount: 250.0,
      is_active: true,
      badge_text: "-$30 MXN",
      icon: "gift",
      color_tag: "#10B981"
    },
    {
      id: 4,
      name: "2x1 en Chispas Clásicas NY",
      description: "Lleva 2 galletas Chispas Clásicas NY y paga solo 1.",
      promo_type: "two_for_one",
      discount_value: 1.0,
      target_type: "specific_products",
      target_product_ids: [2],
      min_quantity: 2,
      min_order_amount: 0.0,
      is_active: true,
      badge_text: "2x1",
      icon: "flame",
      color_tag: "#8B5CF6"
    }
  ];

  public getPromotions(activeOnly: boolean = false): Promotion[] {
    return activeOnly ? this.promotions.filter(p => p.is_active) : [...this.promotions];
  }

  public createPromotion(data: Partial<Promotion>): Promotion {
    const nextId = this.promotions.length > 0 ? Math.max(...this.promotions.map(p => p.id)) + 1 : 1;
    const newPromo: Promotion = {
      id: nextId,
      name: data.name || 'Nueva Promoción',
      description: data.description || '',
      promo_type: data.promo_type || 'percentage',
      discount_value: Number(data.discount_value || 0),
      target_type: data.target_type || 'all_products',
      target_product_ids: data.target_product_ids || [],
      target_category: data.target_category,
      min_quantity: Number(data.min_quantity || 1),
      min_order_amount: Number(data.min_order_amount || 0),
      is_active: data.is_active !== undefined ? data.is_active : true,
      badge_text: data.badge_text || 'PROMO',
      icon: data.icon || 'tag',
      color_tag: data.color_tag || '#F59E0B',
      created_at: new Date().toISOString()
    };
    this.promotions.unshift(newPromo);
    return newPromo;
  }

  public updatePromotion(id: number, data: Partial<Promotion>): Promotion {
    const idx = this.promotions.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Promoción no encontrada');
    this.promotions[idx] = { ...this.promotions[idx], ...data };
    return this.promotions[idx];
  }

  public togglePromotion(id: number): Promotion {
    const promo = this.promotions.find(p => p.id === id);
    if (!promo) throw new Error('Promoción no encontrada');
    promo.is_active = !promo.is_active;
    return { ...promo };
  }

  public deletePromotion(id: number): boolean {
    const idx = this.promotions.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.promotions.splice(idx, 1);
      return true;
    }
    return false;
  }

  public calculatePromotion(req: PromoCalculationRequest): PromoCalculationResult {
    const promo = this.promotions.find(p => p.id === req.promotion_id);
    const subtotal = req.order_subtotal !== undefined
      ? req.order_subtotal
      : req.items.reduce((s, it) => s + (it.unit_price * it.quantity), 0);

    if (!promo || !promo.is_active) {
      return {
        promotion_id: req.promotion_id,
        promotion_name: promo?.name || 'Desconocida',
        is_applicable: false,
        reason: 'La promoción no está activa o no existe',
        original_subtotal: subtotal,
        discount_amount: 0,
        final_total: subtotal
      };
    }

    if (subtotal < promo.min_order_amount) {
      return {
        promotion_id: promo.id,
        promotion_name: promo.name,
        is_applicable: false,
        reason: `Monto mínimo de compra requerido: $${promo.min_order_amount}`,
        original_subtotal: subtotal,
        discount_amount: 0,
        final_total: subtotal
      };
    }

    // Filter applicable items
    const eligibleItems = req.items.filter(it => {
      if (promo.target_type === 'all_products' || promo.target_type === 'order_total') return true;
      if (promo.target_type === 'specific_products') {
        return (promo.target_product_ids || []).includes(it.product_id);
      }
      return true;
    });

    const totalEligibleUnits = eligibleItems.reduce((s, it) => s + it.quantity, 0);

    if (totalEligibleUnits < promo.min_quantity) {
      return {
        promotion_id: promo.id,
        promotion_name: promo.name,
        is_applicable: false,
        reason: `Requiere al menos ${promo.min_quantity} piezas aplicables (tienes ${totalEligibleUnits})`,
        original_subtotal: subtotal,
        discount_amount: 0,
        final_total: subtotal
      };
    }

    let discount = 0;
    if (promo.promo_type === 'combo_fixed_price') {
      const combosCount = Math.floor(totalEligibleUnits / promo.min_quantity);
      if (combosCount > 0) {
        const avgEligiblePrice = totalEligibleUnits > 0
          ? eligibleItems.reduce((s, it) => s + (it.unit_price * it.quantity), 0) / totalEligibleUnits
          : 35;
        const normalComboPrice = avgEligiblePrice * promo.min_quantity;
        const discountPerCombo = Math.max(0, normalComboPrice - promo.discount_value);
        discount = discountPerCombo * combosCount;
      }
    } else if (promo.promo_type === 'percentage') {
      const eligibleSubtotal = promo.target_type === 'order_total' || promo.target_type === 'all_products'
        ? subtotal
        : eligibleItems.reduce((s, it) => s + (it.unit_price * it.quantity), 0);
      discount = eligibleSubtotal * (promo.discount_value / 100);
    } else if (promo.promo_type === 'fixed_amount') {
      discount = Math.min(subtotal, promo.discount_value);
    } else if (promo.promo_type === 'two_for_one') {
      const freeUnits = Math.floor(totalEligibleUnits / 2);
      const minPrice = eligibleItems.length > 0 ? Math.min(...eligibleItems.map(i => i.unit_price)) : 35;
      discount = freeUnits * minPrice;
    }

    discount = Math.round(discount * 100) / 100;
    const finalTotal = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

    return {
      promotion_id: promo.id,
      promotion_name: promo.name,
      is_applicable: true,
      original_subtotal: subtotal,
      discount_amount: discount,
      final_total: finalTotal
    };
  }
}

export const mockRepository = new MockDataRepository();

