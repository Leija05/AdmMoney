from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

# ----------------- Gastos Generales & Operativos ----------------- #
class ExpenseBase(BaseModel):
    title: str
    amount: float = Field(..., gt=0)
    category: str
    date: str
    payment_method: Optional[str] = "Efectivo"
    notes: Optional[str] = ""
    receipt_url: Optional[str] = ""
    receipt_data: Optional[Dict[str, Any]] = {}
    expense_type: Optional[str] = "operational"  # "direct" (materia prima/empaque) | "operational" (fijo/indirecto)

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    receipt_url: Optional[str] = None
    receipt_data: Optional[Dict[str, Any]] = None
    expense_type: Optional[str] = None

class ExpenseResponse(ExpenseBase):
    id: int
    created_at: str

    class Config:
        from_attributes = True

# ----------------- Insumos de Galletas & Packaging (Smart Inventory) ----------------- #
class IngredientBase(BaseModel):
    name: str
    unit: str  # kg, g, pza, ml, l
    package_cost: float = Field(..., gt=0)
    package_quantity: float = Field(..., gt=0)
    stock_quantity: Optional[float] = 0.0
    supplier: Optional[str] = ""
    type: Optional[str] = "edible"  # "edible" (comestible) | "packaging" (cajas, bolsas, etiquetas)
    min_stock_alert: Optional[float] = 5.0  # Umbral mínimo de seguridad (Punto de Reorden)

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    package_cost: Optional[float] = None
    package_quantity: Optional[float] = None
    stock_quantity: Optional[float] = None
    supplier: Optional[str] = None
    type: Optional[str] = None
    min_stock_alert: Optional[float] = None

class IngredientPurchaseCreate(BaseModel):
    quantity: float = Field(..., gt=0)  # Cantidad comprada en la unidad del ingrediente
    total_cost: float = Field(..., gt=0)  # Costo total pagado
    supplier: Optional[str] = ""
    invoice_ref: Optional[str] = ""
    create_expense_record: Optional[bool] = True  # Si true, registra automáticamente el gasto en expenses

class IngredientResponse(IngredientBase):
    id: int
    cost_per_unit: float  # CPP: Costo Promedio Ponderado por unidad
    updated_at: str
    stock_status: Optional[str] = "ok"  # "ok" | "low" | "critical"

    class Config:
        from_attributes = True

# ----------------- Productos / Galletas (BOM & Merma) ----------------- #
class RecipeIngredientItem(BaseModel):
    name: str
    quantity: float
    unit: str
    cost: float
    ingredient_id: Optional[int] = None
    is_subrecipe: Optional[bool] = False

class CookieProductBase(BaseModel):
    name: str
    category: Optional[str] = "Galletas Artesanales"
    description: Optional[str] = ""
    sale_price: float = Field(..., gt=0)
    batch_yield: int = Field(default=16, gt=0)
    waste_pct: Optional[float] = Field(default=2.0, ge=0.0, le=50.0)  # Porcentaje de merma técnica (ej. 2% en tazón)
    base_recipe_weight_g: Optional[float] = 75.0  # Peso unitario de masa cruda en gramos
    ingredients: List[RecipeIngredientItem] = []
    image_url: Optional[str] = ""
    is_active: Optional[bool] = True

class CookieProductCreate(CookieProductBase):
    pass

class CookieProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    sale_price: Optional[float] = None
    batch_yield: Optional[int] = None
    waste_pct: Optional[float] = None
    base_recipe_weight_g: Optional[float] = None
    ingredients: Optional[List[RecipeIngredientItem]] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class CookieProductResponse(BaseModel):
    id: int
    name: str
    category: str
    description: str
    sale_price: float
    recipe_cost: float
    profit_per_unit: float
    profit_margin_pct: float
    batch_yield: int
    waste_pct: float
    base_recipe_weight_g: float
    ingredients: List[RecipeIngredientItem]
    image_url: str
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True

# ----------------- Escalador de Lotes (Batch Scaler) ----------------- #
class BatchScaleItem(BaseModel):
    name: str
    required_quantity: float
    unit: str
    unit_cost: float
    total_cost: float
    stock_available: float
    is_sufficient: bool
    missing_quantity: float

class BatchScaleResponse(BaseModel):
    cookie_id: int
    cookie_name: str
    target_units: int
    waste_pct: float
    total_raw_weight_g: float
    items: List[BatchScaleItem]
    estimated_total_cost: float
    estimated_unit_cost: float
    projected_revenue: float
    projected_profit: float
    can_fulfill_from_stock: bool

# ----------------- Capacidad de Producción & Cuello de Botella ----------------- #
class BottleneckInfo(BaseModel):
    ingredient_name: str
    unit: str
    available_stock: float
    required_per_unit: float
    max_units_possible: int

class ProductCapacityItem(BaseModel):
    product_id: int
    product_name: str
    max_producible_units: int
    limiting_ingredient: Optional[BottleneckInfo] = None
    all_ingredients_healthy: bool

class ProductionCapacityResponse(BaseModel):
    capacities: List[ProductCapacityItem]
    critical_alerts: List[str]
    packaging_capacities: List[Dict[str, Any]]

# ----------------- Pedidos y Producción (Sales & Order Pipeline) ----------------- #
class OrderItem(BaseModel):
    product_id: int
    product_name: str
    quantity: int = Field(..., gt=0)
    unit_price: float
    unit_cost: float
    subtotal: float
    notes: Optional[str] = ""

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: Optional[str] = ""
    delivery_date: str  # YYYY-MM-DD
    items: List[OrderItem]
    payment_method: Optional[str] = "Efectivo"  # Efectivo, Transferencia, Tarjeta, Pendiente
    payment_status: Optional[str] = "Pendiente"  # Pagado, Pendiente, Anticipo
    deposit_amount: Optional[float] = 0.0
    notes: Optional[str] = ""
    promotion_id: Optional[int] = None
    promotion_name: Optional[str] = None
    discount_amount: Optional[float] = 0.0

class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    delivery_date: Optional[str] = None
    status: Optional[str] = None  # Pendiente, En Preparación, Listo, Completado, Cancelado
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    deposit_amount: Optional[float] = None
    items: Optional[List[OrderItem]] = None
    notes: Optional[str] = None
    promotion_id: Optional[int] = None
    promotion_name: Optional[str] = None
    discount_amount: Optional[float] = None

class OrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_phone: str
    delivery_date: str
    order_date: str
    status: str  # Pendiente, En Preparación, Listo, Completado, Cancelado
    payment_method: str
    payment_status: str
    deposit_amount: float
    items: List[OrderItem]
    total_amount: float
    total_cost: float
    net_profit: float
    notes: str
    whatsapp_message: str
    whatsapp_url: str
    stock_deducted: bool
    created_at: str
    promotion_id: Optional[int] = None
    promotion_name: Optional[str] = None
    discount_amount: Optional[float] = 0.0

    class Config:
        from_attributes = True

# ----------------- Consolidado de Horneado (Baking Sheet) ----------------- #
class BakingSheetDayRow(BaseModel):
    delivery_date: str
    day_name: str
    quantities_by_product: Dict[str, int]
    total_day_units: int

class BakingSheetConsolidatedItem(BaseModel):
    ingredient_name: str
    total_required: float
    unit: str
    current_stock: float
    is_sufficient: bool

class BakingSheetResponse(BaseModel):
    days: List[BakingSheetDayRow]
    product_columns: List[str]
    grand_totals_by_product: Dict[str, int]
    total_all_units: int
    consolidated_ingredients: List[BakingSheetConsolidatedItem]

# ----------------- Ventas Directas de Mostrador ----------------- #
class CookieSaleCreate(BaseModel):
    cookie_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Optional[float] = None
    sale_date: Optional[str] = None
    customer_name: Optional[str] = "Cliente Mostrador"
    payment_method: Optional[str] = "Efectivo"
    notes: Optional[str] = ""
    promotion_id: Optional[int] = None
    promotion_name: Optional[str] = None
    discount_amount: Optional[float] = 0.0

class CookieSaleResponse(BaseModel):
    id: int
    cookie_id: int
    cookie_name: str
    quantity: int
    unit_price: float
    unit_cost: float
    total_revenue: float
    total_cost: float
    net_profit: float
    sale_date: str
    customer_name: str
    payment_method: str
    notes: str
    created_at: str
    promotion_id: Optional[int] = None
    promotion_name: Optional[str] = None
    discount_amount: Optional[float] = 0.0

    class Config:
        from_attributes = True

# ----------------- Promociones & Descuentos Dinámicos ----------------- #
class PromotionBase(BaseModel):
    name: str  # Ej. "Paquete Trío (3 x $90)", "Viernes Dulce 15% OFF"
    description: Optional[str] = ""
    promo_type: str = "combo_fixed_price"  # "combo_fixed_price" | "percentage" | "fixed_amount" | "two_for_one" | "fixed_combo"
    scope: Optional[str] = "all_products"  # "all_products" | "specific_products" | "specific_category" | "order_total"
    target_type: Optional[str] = "all_products"
    target_category: Optional[str] = None
    applicable_product_ids: Optional[List[int]] = []
    target_product_ids: Optional[List[int]] = []
    min_units: Optional[int] = 1
    min_quantity: Optional[int] = 1
    min_order_amount: Optional[float] = 0.0
    discount_value: Optional[float] = None
    promo_price: Optional[float] = None
    discount_pct: Optional[float] = None
    discount_amount: Optional[float] = None
    badge_text: Optional[str] = None
    icon: Optional[str] = "pricetag"
    color_tag: Optional[str] = "#F59E0B"
    is_active: Optional[bool] = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None

    class Config:
        extra = "allow"

class PromotionCreate(PromotionBase):
    pass

class PromotionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    promo_type: Optional[str] = None
    scope: Optional[str] = None
    target_type: Optional[str] = None
    target_category: Optional[str] = None
    applicable_product_ids: Optional[List[int]] = None
    target_product_ids: Optional[List[int]] = None
    min_units: Optional[int] = None
    min_quantity: Optional[int] = None
    min_order_amount: Optional[float] = None
    discount_value: Optional[float] = None
    promo_price: Optional[float] = None
    discount_pct: Optional[float] = None
    discount_amount: Optional[float] = None
    badge_text: Optional[str] = None
    icon: Optional[str] = None
    color_tag: Optional[str] = None
    is_active: Optional[bool] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

    class Config:
        extra = "allow"

class PromotionResponse(PromotionBase):
    id: int
    created_at: str

    class Config:
        from_attributes = True
        extra = "allow"

class PromoCalculationItem(BaseModel):
    product_id: int
    product_name: Optional[str] = "Producto"
    quantity: int
    unit_price: float
    category: Optional[str] = None

class PromoCalculationRequest(BaseModel):
    items: List[PromoCalculationItem]
    promotion_id: Optional[int] = None
    order_subtotal: Optional[float] = None

class PromoCalculationResponse(BaseModel):
    promotion_applied: Optional[PromotionResponse] = None
    original_subtotal: float
    discount_total: float
    final_total: float
    message: str
    items_breakdown: List[Dict[str, Any]] = []

# ----------------- Escáner de Tickets ----------------- #
class ReceiptItem(BaseModel):
    name: str
    quantity: float = 1.0
    price: float

class ReceiptScanResponse(BaseModel):
    merchant: str
    date: str
    total_amount: float
    subtotal: Optional[float] = 0.0
    tax: Optional[float] = 0.0
    items: List[ReceiptItem] = []
    suggested_category: str
    confidence: float
    raw_text: str
    image_url: Optional[str] = None

# ----------------- Analítica Financiera V2.0 (Separación Real) ----------------- #
class FinancialSummaryResponse(BaseModel):
    # Ingresos y Ventas Reales
    total_cookie_revenue: float  # Ventas Totales de pedidos completados y ventas
    total_orders_completed: int
    total_cookies_sold: int

    # Fondo de Re-inversión (Costo Directo / Materia Prima Protegida)
    total_cookie_cost: float  # Fondo de reposición de materia prima
    reinvestment_fund: float  # = total_cookie_cost

    # Ganancias
    gross_cookie_profit: float  # Ingresos - Fondo de Re-inversión
    cookie_profit_margin_pct: float

    # Gastos y Ganancia Limpia
    total_operational_expenses: float  # Gastos Operativos (Luz, Gas, Gasolina, etc.)
    total_direct_expenses: float  # Gastos directos registrados
    total_all_expenses: float  # Suma total de egresos

    clean_net_profit: float  # Ganancia Neta Limpia: Ventas Totales - (Costos Directos + Gastos Fijos)
    overall_net_balance: float  # Flujo de caja neto en periodo

    # Operativo y Alertas
    pending_orders_count: int
    pending_orders_amount: float
    stock_alerts_count: int
    top_selling_cookie: Optional[str]
    category_breakdown: List[Dict[str, Any]]
    daily_trend: List[Dict[str, Any]]
    cookie_performance: List[Dict[str, Any]]
