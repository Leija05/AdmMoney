export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  payment_method: string;
  notes: string;
  receipt_url?: string;
  receipt_data?: Record<string, any>;
  expense_type?: 'direct' | 'operational';
  created_at?: string;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  package_cost: number;
  package_quantity: number;
  cost_per_unit: number;
  stock_quantity: number;
  supplier: string;
  type?: 'edible' | 'packaging';
  min_stock_alert?: number;
  stock_status?: 'ok' | 'low' | 'critical';
  updated_at?: string;
}

export interface IngredientPurchasePayload {
  quantity: number;
  total_cost: number;
  supplier?: string;
  invoice_ref?: string;
  create_expense_record?: boolean;
}

export interface RecipeIngredientItem {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  ingredient_id?: number;
  is_subrecipe?: boolean;
}

export interface CookieProduct {
  id: number;
  name: string;
  category?: string;
  description: string;
  sale_price: number;
  recipe_cost: number;
  profit_per_unit: number;
  profit_margin_pct: number;
  batch_yield: number;
  cost_per_cookie?: number;
  packaging_cost?: number;
  waste_pct?: number;
  base_recipe_weight_g?: number;
  ingredients: RecipeIngredientItem[];
  image_url: string;
  is_active: boolean;
  is_unit_recipe?: boolean;
  stock_vitrina?: number;
  created_at?: string;
}

export interface CookieSale {
  id: number;
  cookie_id: number;
  cookie_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total_revenue: number;
  total_cost: number;
  net_profit: number;
  sale_date: string;
  customer_name: string;
  payment_method: string;
  notes: string;
  promotion_id?: number;
  promotion_name?: string;
  discount_amount?: number;
  order_id?: number;
  ticket_token?: string;
  created_at?: string;
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: number;
  folio?: string;
  origin?: 'app' | 'web_qr';
  customer_name: string;
  customer_phone: string;
  delivery_date: string;
  order_date: string;
  status: 'Pendiente de Confirmación' | 'Pendiente' | 'En Preparación' | 'Listo' | 'Completado' | 'Cancelado';
  payment_method: string;
  payment_status: 'Pagado' | 'Pendiente' | 'Anticipo';
  deposit_amount: number;
  items: OrderItem[];
  total_amount: number;
  total_cost: number;
  net_profit: number;
  notes: string;
  promotion_id?: number;
  promotion_name?: string;
  discount_amount?: number;
  whatsapp_message: string;
  whatsapp_url: string;
  stock_deducted: boolean;
  sale_registered?: boolean;
  ticket_token?: string;
  expires_at?: string;
  created_at?: string;
}

export interface BakingSheetDayRow {
  delivery_date: string;
  day_name: string;
  quantities_by_product: Record<string, number>;
  total_day_units: number;
}

export interface BakingSheetConsolidatedItem {
  ingredient_name: string;
  total_required: number;
  unit: string;
  current_stock: number;
  is_sufficient: boolean;
}

export interface BakingSheetResponse {
  days: BakingSheetDayRow[];
  product_columns: string[];
  grand_totals_by_product: Record<string, number>;
  total_all_units: number;
  consolidated_ingredients: BakingSheetConsolidatedItem[];
}

export interface BatchScaleItem {
  name: string;
  required_quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  stock_available: number;
  is_sufficient: boolean;
  missing_quantity: number;
}

export interface BatchScaleResponse {
  cookie_id: number;
  cookie_name: string;
  target_units: number;
  waste_pct: number;
  total_raw_weight_g: number;
  items: BatchScaleItem[];
  estimated_total_cost: number;
  estimated_unit_cost: number;
  projected_revenue: number;
  projected_profit: number;
  can_fulfill_from_stock: boolean;
}

export interface BottleneckInfo {
  ingredient_name: string;
  unit: string;
  available_stock: number;
  required_per_unit: number;
  max_units_possible: number;
}

export interface ProductCapacityItem {
  product_id: number;
  product_name: string;
  max_producible_units: number;
  limiting_ingredient?: BottleneckInfo;
  all_ingredients_healthy: boolean;
}

export interface ProductionCapacityResponse {
  capacities: ProductCapacityItem[];
  critical_alerts: string[];
  packaging_capacities: Array<{
    name: string;
    stock_quantity: number;
    unit: string;
    status: string;
  }>;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ReceiptScanResult {
  merchant: string;
  date: string;
  total_amount: number;
  subtotal: number;
  tax: number;
  items: ReceiptItem[];
  suggested_category: string;
  payment_method?: string;
  confidence: number;
  raw_text: string;
  image_url?: string;
}

export interface OverallSummary {
  total_cookie_revenue: number;
  total_orders_completed?: number;
  total_cookies_sold: number;
  total_cookie_cost: number;
  reinvestment_fund?: number;
  gross_cookie_profit?: number;
  net_cookie_profit?: number;
  cookie_profit_margin_pct: number;
  total_personal_expenses?: number;
  total_business_expenses?: number;
  total_operational_expenses?: number;
  total_direct_expenses?: number;
  total_all_expenses: number;
  clean_net_profit?: number;
  overall_net_balance: number;
  pending_orders_count?: number;
  pending_orders_amount?: number;
  pending_payment_amount?: number;
  pending_payment_count?: number;
  stock_alerts_count?: number;
  top_selling_cookie: string | null;
  category_breakdown: Array<{ category: string; amount: number; count: number }>;
  daily_trend: Array<{ date: string; expenses: number; cookie_revenue: number; cookie_profit: number }>;
  cookie_performance: Array<{
    cookie_id: number;
    cookie_name: string;
    units_sold: number;
    revenue: number;
    profit: number;
    avg_price: number;
    avg_cost: number;
    margin_pct: number;
  }>;
}

export type PromoType = 'combo_fixed_price' | 'percentage' | 'fixed_amount' | 'two_for_one';
export type PromoScope = 'all_products' | 'specific_products' | 'order_total' | 'category';

export interface Promotion {
  id: number;
  name: string;
  description: string;
  promo_type: PromoType;
  discount_value: number;
  target_type: PromoScope;
  target_product_ids?: number[];
  target_category?: string;
  min_quantity: number;
  min_order_amount: number;
  is_active: boolean;
  badge_text: string;
  icon?: string;
  color_tag?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

export interface PromoCalculationRequest {
  promotion_id: number;
  items: Array<{
    product_id: number;
    product_name?: string;
    quantity: number;
    unit_price: number;
  }>;
  order_subtotal?: number;
}

export interface PromoCalculationResult {
  promotion_id: number;
  promotion_name: string;
  is_applicable: boolean;
  reason?: string;
  original_subtotal: number;
  discount_amount: number;
  final_total: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  notes?: string;
  total_orders?: number;
  last_order_date?: string;
  created_at?: string;
}

export interface ScannedTicket {
  id: string | number;
  uri: string;
  merchant: string;
  amount: number;
  date: string;
  category?: string;
  scanResult?: ReceiptScanResult;
}

