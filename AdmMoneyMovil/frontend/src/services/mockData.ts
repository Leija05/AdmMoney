import {
  Expense,
  Ingredient,
  CookieProduct,
  CookieSale,
  Order,
  Promotion,
  ReceiptScanResult,
  OverallSummary
} from '../lib/types';

const todayStr = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

export const INITIAL_MOBILE_INGREDIENTS: Ingredient[] = [
  {
    id: 1,
    name: 'Mantequilla sin Sal Gloria',
    unit: 'kg',
    package_cost: 185.0,
    package_quantity: 1.0,
    cost_per_unit: 0.185,
    stock_quantity: 4.0,
    supplier: 'Costco Wholesale',
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
  },
];

const OREO_RECIPE_ITEMS = [
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

export const INITIAL_MOBILE_COOKIES: CookieProduct[] = [
  {
    id: 1,
    name: 'Galleta Artesanal Oreo & Chispas',
    description:
      'Receta neoyorquina artesanal con galletas Oreo, chispas de chocolate semi-amargo y mantequilla. Rendimiento: 16 galletas por tanda. Costo ingredientes $6.77 + Empaque $2.90 = $9.67.',
    sale_price: 35.0,
    recipe_cost: 9.67,
    profit_per_unit: 25.33,
    profit_margin_pct: 72.37,
    batch_yield: 16,
    ingredients: OREO_RECIPE_ITEMS,
    image_url:
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 2,
    name: 'Chispas Clásicas NY Style',
    description:
      'Masa de mantequilla dorada, azúcar mascabado y abundante chocolate belga semi-amargo 54%. Rendimiento: 16 piezas.',
    sale_price: 35.0,
    recipe_cost: 9.67,
    profit_per_unit: 25.33,
    profit_margin_pct: 72.37,
    batch_yield: 16,
    ingredients: OREO_RECIPE_ITEMS,
    image_url:
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
  {
    id: 3,
    name: 'Red Velvet Cheesecake',
    description:
      'Cacao fino, color rubí intenso y corazón horneado de cheesecake Philadelphia.',
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
    ingredients: OREO_RECIPE_ITEMS,
    image_url:
      'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?auto=format&fit=crop&w=600&q=80',
    is_active: true,
  },
];

export const INITIAL_MOBILE_SALES: CookieSale[] = [
  {
    id: 1,
    cookie_id: 1,
    cookie_name: 'Galleta Artesanal Oreo & Chispas',
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
    ticket_token: 'b1c2d3e4f5a60123456789cd',
  },
  {
    id: 2,
    cookie_id: 1,
    cookie_name: 'Galleta Artesanal Oreo & Chispas',
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
    ticket_token: 'c2d3e4f5a6b70123456789ef',
  },
  {
    id: 3,
    cookie_id: 1,
    cookie_name: 'Galleta Artesanal Oreo & Chispas',
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
    ticket_token: 'd3e4f5a6b7c80123456789ab',
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
    ticket_token: 'e4f5a6b7c8d90123456789bc',
  },
  {
    id: 5,
    cookie_id: 1,
    cookie_name: 'Galleta Artesanal Oreo & Chispas',
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
    ticket_token: 'f5a6b7c8d9e00123456789cd',
  },
  {
    id: 6,
    cookie_id: 1,
    cookie_name: 'Galleta Artesanal Oreo & Chispas',
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
    ticket_token: 'a6b7c8d9e0f10123456789de',
  },
];

export const INITIAL_MOBILE_EXPENSES: Expense[] = [
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

export const MOCK_MOBILE_RECEIPTS: Record<string, ReceiptScanResult> = {
  costco: {
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
    raw_text: 'COSTCO WHOLESALE DE MEXICO\nTICKET DE VENTA\nTOTAL: $1,687.80',
  },
  walmart: {
    merchant: 'Walmart Supercenter',
    date: todayStr,
    total_amount: 540.5,
    subtotal: 466.0,
    tax: 74.5,
    items: [
      { name: 'Huevos San Juan 30 Pzas', quantity: 1, price: 89.0 },
      { name: 'Papel Encerado Cocina', quantity: 2, price: 90.0 },
      { name: 'Azúcar Blanca 2Kg', quantity: 2, price: 65.0 },
      { name: 'Sal Marina Fina 1Kg', quantity: 1, price: 28.5 },
      { name: 'Detergente y Limpiador Taller', quantity: 1, price: 134.0 },
    ],
    suggested_category: 'Insumos Galletas',
    confidence: 0.96,
    raw_text: 'WALMART SUPERCENTER\nTOTAL: $540.50 MXN',
  },
  oxxo: {
    merchant: 'Cadena Comercial OXXO',
    date: todayStr,
    total_amount: 145.0,
    subtotal: 125.0,
    tax: 20.0,
    items: [
      { name: 'Bolsa Hielo 5Kg', quantity: 1, price: 45.0 },
      { name: 'Café Americano Andatti', quantity: 2, price: 64.0 },
      { name: 'Agua Embotellada 1.5L', quantity: 1, price: 18.0 },
      { name: 'Chicles Menta', quantity: 1, price: 18.0 },
    ],
    suggested_category: 'Otros Gastos',
    confidence: 0.95,
    raw_text: 'OXXO TIENDAS DE CONVENIENCIA\nTOTAL: $145.00 MXN',
  },
};

export function computeMobileSummary(
  expenses: Expense[],
  sales: CookieSale[]
): OverallSummary {
  const totalAllExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalPersonalExpenses = expenses
    .filter((e) => e.category === 'Hogar y Personales')
    .reduce((acc, e) => acc + e.amount, 0);
  const totalBusinessExpenses = totalAllExpenses - totalPersonalExpenses;

  const totalCookieRevenue = sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const totalCookieCost = sales.reduce((acc, s) => acc + s.total_cost, 0);
  const netCookieProfit = totalCookieRevenue - totalCookieCost;
  const overallNetBalance = totalCookieRevenue - totalAllExpenses;
  const cookieProfitMarginPct =
    totalCookieRevenue > 0 ? (netCookieProfit / totalCookieRevenue) * 100 : 0;
  const totalCookiesSold = sales.reduce((acc, s) => acc + s.quantity, 0);

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

  sales.forEach((s) => {
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
        item.revenue > 0 ? Number(((item.profit / item.revenue) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.units_sold - a.units_sold);

  const topSellingCookie =
    cookiePerformance[0]?.cookie_name || 'Galleta Artesanal Oreo & Chispas';

  const catMap: Record<string, { amount: number; count: number }> = {};
  expenses.forEach((e) => {
    if (!catMap[e.category]) catMap[e.category] = { amount: 0, count: 0 };
    catMap[e.category].amount += e.amount;
    catMap[e.category].count += 1;
  });

  const categoryBreakdown = Object.entries(catMap).map(([category, val]) => ({
    category,
    amount: Number(val.amount.toFixed(2)),
    count: val.count,
  }));

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
    cookie_profit_margin_pct: Number(cookieProfitMarginPct.toFixed(2)),
    total_cookies_sold: totalCookiesSold,
    top_selling_cookie: topSellingCookie,
    category_breakdown: categoryBreakdown,
    daily_trend: dailyTrend,
    cookie_performance: cookiePerformance,
  };
}

export const INITIAL_MOBILE_PROMOTIONS: Promotion[] = [
  {
    id: 1,
    name: 'Trío Dulce (3 Galletas x $90)',
    description: 'Lleva 3 galletas artesanales de cualquier sabor por un precio especial de $90.',
    promo_type: 'combo_fixed_price',
    discount_value: 90.0,
    target_type: 'all_products',
    target_product_ids: [],
    min_quantity: 3,
    min_order_amount: 0.0,
    is_active: true,
    badge_text: '3 x $90',
    icon: 'cookie',
    color_tag: '#F59E0B'
  },
  {
    id: 2,
    name: 'Docena Consentida (15% OFF)',
    description: '15% de descuento al llevar 12 o más galletas para compartir con la familia o equipo.',
    promo_type: 'percentage',
    discount_value: 15.0,
    target_type: 'all_products',
    target_product_ids: [],
    min_quantity: 12,
    min_order_amount: 0.0,
    is_active: true,
    badge_text: '15% OFF',
    icon: 'sparkles',
    color_tag: '#EC4899'
  },
  {
    id: 3,
    name: 'Descuento Especial en Carrito ($30 OFF)',
    description: 'Descuento directo de $30 MXN en pedidos o compras mayores a $250 MXN.',
    promo_type: 'fixed_amount',
    discount_value: 30.0,
    target_type: 'order_total',
    target_product_ids: [],
    min_quantity: 1,
    min_order_amount: 250.0,
    is_active: true,
    badge_text: '-$30 MXN',
    icon: 'gift',
    color_tag: '#10B981'
  },
  {
    id: 4,
    name: '2x1 en Chispas Clásicas NY',
    description: 'Lleva 2 galletas Chispas Clásicas NY y paga solo 1.',
    promo_type: 'two_for_one',
    discount_value: 1.0,
    target_type: 'specific_products',
    target_product_ids: [2],
    min_quantity: 2,
    min_order_amount: 0.0,
    is_active: true,
    badge_text: '2x1',
    icon: 'flame',
    color_tag: '#8B5CF6'
  }
];

export const INITIAL_MOBILE_ORDERS: Order[] = [
  {
    id: 1,
    customer_name: 'Mariana López (Corporativo)',
    customer_phone: '5512345678',
    delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    order_date: todayStr,
    status: 'En Preparación',
    payment_method: 'Transferencia',
    payment_status: 'Anticipo',
    deposit_amount: 250.0,
    items: [
      { product_id: 1, product_name: 'Galleta Artesanal Oreo & Chispas', quantity: 3, unit_price: 35.0, unit_cost: 9.67, subtotal: 105.0 },
      { product_id: 2, product_name: 'Chispas Clásicas NY Style', quantity: 5, unit_price: 35.0, unit_cost: 9.67, subtotal: 175.0 },
      { product_id: 4, product_name: 'Nutella Stuffed Bomb', quantity: 5, unit_price: 48.0, unit_cost: 14.20, subtotal: 240.0 }
    ],
    total_amount: 520.0,
    total_cost: 148.36,
    net_profit: 371.64,
    notes: 'Entrega en corporativo 14:00 hrs',
    whatsapp_message: 'Hola Mariana López, tu pedido está confirmado.',
    whatsapp_url: '',
    ticket_token: 'a9b8e7c6d5f40123456789ab',
    stock_deducted: false
  }
];
