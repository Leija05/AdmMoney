import json
import sqlite3
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any, List
from pymongo import MongoClient, ReturnDocument
from pymongo.database import Database

from .config import MONGO_URL, MONGO_DB_NAME, DB_PATH

_client: Optional[MongoClient] = None

def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URL)
    return _client

def get_db() -> Database:
    client = get_mongo_client()
    return client[MONGO_DB_NAME]

def get_next_sequence(name: str) -> int:
    """
    Genera un ID numérico autoincrementable compatible con el frontend y esquemas existentes.
    """
    db = get_db()
    ret = db.counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return int(ret["seq"])

def sync_counter(name: str, current_max: int):
    """
    Asegura que el contador sea al menos current_max.
    """
    db = get_db()
    counter = db.counters.find_one({"_id": name})
    if not counter or counter.get("seq", 0) < current_max:
        db.counters.update_one(
            {"_id": name},
            {"$set": {"seq": current_max}},
            upsert=True
        )

def init_db():
    """
    Inicializa colecciones, índices y realiza migración o seeding inicial en MongoDB.
    """
    db = get_db()

    # Índices únicos por ID numérico para cada colección
    for coll_name in ["expenses", "cookie_ingredients", "cookie_products", "cookie_sales", "receipt_scans", "orders", "promotions"]:
        db[coll_name].create_index("id", unique=True)

    # Índice por fecha para optimizar consultas de gastos, ventas y pedidos
    db.expenses.create_index([("date", -1), ("id", -1)])
    db.cookie_sales.create_index([("sale_date", -1), ("id", -1)])
    db.orders.create_index([("delivery_date", 1), ("status", 1)])

    # Comprobar si las colecciones están vacías
    ingredients_count = db.cookie_ingredients.count_documents({})
    products_count = db.cookie_products.count_documents({})
    expenses_count = db.expenses.count_documents({})

    if ingredients_count == 0 and products_count == 0 and expenses_count == 0:
        # Intentar migrar desde admmoney.db (SQLite) si existe
        migrated = False
        if DB_PATH.exists():
            try:
                migrated = migrate_from_sqlite(db)
            except Exception as e:
                print(f"[Mongo Init] Advertencia al migrar SQLite: {e}. Se usarán datos semilla.")

        if not migrated:
            seed_initial_data(db)

    # Si la colección de pedidos está vacía, sembrar pedidos de muestra para el pipeline de horneado
    if db.orders.count_documents({}) == 0:
        seed_sample_orders(db)

    # Si la colección de promociones está vacía, sembrar promociones por defecto
    if db.promotions.count_documents({}) == 0:
        seed_sample_promotions(db)

    # Sincronizar contadores a los valores máximos actuales
    for name, coll in [
        ("expenses", db.expenses),
        ("cookie_ingredients", db.cookie_ingredients),
        ("cookie_products", db.cookie_products),
        ("cookie_sales", db.cookie_sales),
        ("receipt_scans", db.receipt_scans),
        ("orders", db.orders),
        ("promotions", db.promotions),
    ]:
        last_doc = coll.find_one(sort=[("id", -1)])
        max_id = int(last_doc["id"]) if last_doc and "id" in last_doc else 0
        sync_counter(name, max_id)

def migrate_from_sqlite(db: Database) -> bool:
    """
    Migra datos existentes desde SQLite admmoney.db a MongoDB.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Verificar si SQLite tiene datos
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='cookie_ingredients';")
    if not cursor.fetchone():
        conn.close()
        return False

    cursor.execute("SELECT COUNT(*) as cnt FROM cookie_ingredients;")
    if cursor.fetchone()["cnt"] == 0:
        conn.close()
        return False

    # 1. Insumos
    cursor.execute("SELECT * FROM cookie_ingredients;")
    for row in cursor.fetchall():
        d = dict(row)
        db.cookie_ingredients.update_one({"id": d["id"]}, {"$set": d}, upsert=True)

    # 2. Productos / Galletas
    cursor.execute("SELECT * FROM cookie_products;")
    for row in cursor.fetchall():
        d = dict(row)
        try:
            d["ingredients"] = json.loads(d.get("ingredients_json") or "[]")
        except Exception:
            d["ingredients"] = []
        d["is_active"] = bool(d.get("is_active", 1))
        d.pop("ingredients_json", None)
        db.cookie_products.update_one({"id": d["id"]}, {"$set": d}, upsert=True)

    # 3. Ventas
    cursor.execute("SELECT * FROM cookie_sales;")
    for row in cursor.fetchall():
        d = dict(row)
        db.cookie_sales.update_one({"id": d["id"]}, {"$set": d}, upsert=True)

    # 4. Gastos
    cursor.execute("SELECT * FROM expenses;")
    for row in cursor.fetchall():
        d = dict(row)
        try:
            d["receipt_data"] = json.loads(d.get("receipt_data") or "{}")
        except Exception:
            d["receipt_data"] = {}
        db.expenses.update_one({"id": d["id"]}, {"$set": d}, upsert=True)

    # 5. Escaneos
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='receipt_scans';")
    if cursor.fetchone():
        cursor.execute("SELECT * FROM receipt_scans;")
        for row in cursor.fetchall():
            d = dict(row)
            try:
                d["parsed_items"] = json.loads(d.get("parsed_items_json") or "[]")
            except Exception:
                d["parsed_items"] = []
            d.pop("parsed_items_json", None)
            db.receipt_scans.update_one({"id": d["id"]}, {"$set": d}, upsert=True)

    conn.close()
    print("[Mongo Init] Datos migrados exitosamente de SQLite a MongoDB.")
    return True

def seed_initial_data(db: Database):
    """
    Semillas iniciales de negocio si la base de datos MongoDB está vacía.
    """
    now_str = datetime.utcnow().isoformat()
    today_str = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    twoDaysAgo = (date.today() - timedelta(days=2)).isoformat()

    # Insumos / Ingredientes
    ingredients = [
        {"id": 1, "name": "Mantequilla sin sal", "unit": "kg", "package_cost": 185.0, "package_quantity": 1.0, "cost_per_unit": 0.185, "stock_quantity": 4.0, "supplier": "Costco Wholesale", "updated_at": now_str},
        {"id": 2, "name": "Azúcar mascabado", "unit": "kg", "package_cost": 38.0, "package_quantity": 1.0, "cost_per_unit": 0.038, "stock_quantity": 5.0, "supplier": "Central de Abastos", "updated_at": now_str},
        {"id": 3, "name": "Azúcar estándar", "unit": "kg", "package_cost": 30.0, "package_quantity": 1.0, "cost_per_unit": 0.030, "stock_quantity": 5.0, "supplier": "Walmart", "updated_at": now_str},
        {"id": 4, "name": "Huevo fresco", "unit": "pza", "package_cost": 85.0, "package_quantity": 30.0, "cost_per_unit": 2.833, "stock_quantity": 45.0, "supplier": "Supermercado", "updated_at": now_str},
        {"id": 5, "name": "Extracto de vainilla natural", "unit": "ml", "package_cost": 95.0, "package_quantity": 250.0, "cost_per_unit": 0.380, "stock_quantity": 250.0, "supplier": "La Comer", "updated_at": now_str},
        {"id": 6, "name": "Harina de trigo especial", "unit": "kg", "package_cost": 32.0, "package_quantity": 1.0, "cost_per_unit": 0.032, "stock_quantity": 10.0, "supplier": "Costco Wholesale", "updated_at": now_str},
        {"id": 7, "name": "Polvo para hornear", "unit": "kg", "package_cost": 85.0, "package_quantity": 0.5, "cost_per_unit": 0.170, "stock_quantity": 0.5, "supplier": "Materias Primas", "updated_at": now_str},
        {"id": 8, "name": "Bicarbonato de sodio", "unit": "kg", "package_cost": 25.0, "package_quantity": 0.5, "cost_per_unit": 0.050, "stock_quantity": 0.5, "supplier": "Farmacia París", "updated_at": now_str},
        {"id": 9, "name": "Maizena (fécula de maíz)", "unit": "kg", "package_cost": 50.0, "package_quantity": 1.0, "cost_per_unit": 0.050, "stock_quantity": 2.0, "supplier": "Central de Abastos", "updated_at": now_str},
        {"id": 10, "name": "Sal fina de mesa", "unit": "kg", "package_cost": 20.0, "package_quantity": 1.0, "cost_per_unit": 0.020, "stock_quantity": 1.0, "supplier": "Walmart", "updated_at": now_str},
        {"id": 11, "name": "Galletas Oreo clásicas", "unit": "pza", "package_cost": 57.0, "package_quantity": 30.0, "cost_per_unit": 1.900, "stock_quantity": 90.0, "supplier": "Sam's Club", "updated_at": now_str},
        {"id": 12, "name": "Chispas de chocolate semi-amargo", "unit": "kg", "package_cost": 250.0, "package_quantity": 1.0, "cost_per_unit": 0.250, "stock_quantity": 5.0, "supplier": "Materias Primas", "updated_at": now_str},
        {"id": 13, "name": "Empaque individual con ventana", "unit": "pza", "package_cost": 145.0, "package_quantity": 50.0, "cost_per_unit": 2.900, "stock_quantity": 150.0, "supplier": "Empaques Monterrey", "updated_at": now_str},
    ]
    db.cookie_ingredients.insert_many(ingredients)

    # Recetas
    oreo_ingredients = [
        {"name": "Mantequilla sin sal", "quantity": 180, "unit": "g", "cost": 33.30},
        {"name": "Azúcar mascabado", "quantity": 120, "unit": "g", "cost": 4.56},
        {"name": "Azúcar estándar", "quantity": 80, "unit": "g", "cost": 2.40},
        {"name": "Huevo fresco", "quantity": 2, "unit": "pza", "cost": 5.66},
        {"name": "Extracto de vainilla", "quantity": 10, "unit": "ml", "cost": 3.80},
        {"name": "Harina de trigo", "quantity": 280, "unit": "g", "cost": 8.96},
        {"name": "Polvo para hornear", "quantity": 5, "unit": "g", "cost": 0.85},
        {"name": "Bicarbonato de sodio", "quantity": 4, "unit": "g", "cost": 0.20},
        {"name": "Maizena (fécula de maíz)", "quantity": 15, "unit": "g", "cost": 0.75},
        {"name": "Sal fina", "quantity": 3, "unit": "g", "cost": 0.10},
        {"name": "Galletas Oreo troceadas", "quantity": 12, "unit": "pza", "cost": 22.80},
        {"name": "Chispas de chocolate", "quantity": 100, "unit": "g", "cost": 25.00},
        {"name": "Empaque individual", "quantity": 1, "unit": "pza", "cost": 2.90}
    ]

    cookies = [
        {
            "id": 1,
            "name": "Galleta Artesanal Oreo & Chispas de Chocolate",
            "description": "Receta neoyorquina artesanal con galletas Oreo troceadas, chispas de chocolate semi-amargo y mantequilla. Rendimiento: 16 galletas por tanda. Costo ingredientes $6.77 + Empaque $2.90 = $9.67.",
            "sale_price": 35.0,
            "recipe_cost": 9.67,
            "profit_per_unit": 25.33,
            "profit_margin_pct": 72.37,
            "batch_yield": 16,
            "ingredients": oreo_ingredients,
            "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
            "is_active": True,
            "created_at": now_str
        },
        {
            "id": 2,
            "name": "Chispas Clásicas NY Style",
            "description": "Masa de mantequilla dorada, azúcar mascabado y abundante chocolate belga semi-amargo 54%. Rendimiento: 16 piezas.",
            "sale_price": 35.0,
            "recipe_cost": 9.67,
            "profit_per_unit": 25.33,
            "profit_margin_pct": 72.37,
            "batch_yield": 16,
            "ingredients": oreo_ingredients,
            "image_url": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80",
            "is_active": True,
            "created_at": now_str
        },
        {
            "id": 3,
            "name": "Red Velvet Cheesecake",
            "description": "Cacao fino, color rubí intenso y corazón cremoso de cheesecake Philadelphia.",
            "sale_price": 45.0,
            "recipe_cost": 12.50,
            "profit_per_unit": 32.50,
            "profit_margin_pct": 72.22,
            "batch_yield": 16,
            "ingredients": [
                {"name": "Harina & Cacao", "quantity": 38, "unit": "g", "cost": 1.80},
                {"name": "Mantequilla", "quantity": 20, "unit": "g", "cost": 3.70},
                {"name": "Queso Crema Philadelphia", "quantity": 30, "unit": "g", "cost": 4.10},
                {"name": "Empaque individual", "quantity": 1, "unit": "pza", "cost": 2.90}
            ],
            "image_url": "https://images.unsplash.com/photo-1618923834413-2770b904ee10?auto=format&fit=crop&w=600&q=80",
            "is_active": True,
            "created_at": now_str
        },
        {
            "id": 4,
            "name": "Nutella Stuffed Bomb",
            "description": "Galleta suave XXL rellena con 25g de Nutella cremosa líquida al centro.",
            "sale_price": 48.0,
            "recipe_cost": 14.20,
            "profit_per_unit": 33.80,
            "profit_margin_pct": 70.42,
            "batch_yield": 16,
            "ingredients": [
                {"name": "Masa Mantequilla", "quantity": 50, "unit": "g", "cost": 5.20},
                {"name": "Nutella Relleno", "quantity": 25, "unit": "g", "cost": 5.25},
                {"name": "Chispas", "quantity": 15, "unit": "g", "cost": 3.75},
                {"name": "Empaque individual", "quantity": 1, "unit": "pza", "cost": 2.90}
            ],
            "image_url": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80",
            "is_active": True,
            "created_at": now_str
        },
        {
            "id": 5,
            "name": "Avena con Canela & Nueces",
            "description": "Avena tostada con mantequilla, canela de Ceilán, nuez pecana troceada y azúcar morena.",
            "sale_price": 35.0,
            "recipe_cost": 9.67,
            "profit_per_unit": 25.33,
            "profit_margin_pct": 72.37,
            "batch_yield": 16,
            "ingredients": oreo_ingredients,
            "image_url": "https://images.unsplash.com/photo-1548365328-8c6db3220e4c?auto=format&fit=crop&w=600&q=80",
            "is_active": True,
            "created_at": now_str
        }
    ]
    db.cookie_products.insert_many(cookies)

    # Ventas de muestra
    sales = [
        {"id": 1, "cookie_id": 1, "cookie_name": "Galleta Artesanal Oreo & Chispas de Chocolate", "quantity": 1, "unit_price": 35.0, "unit_cost": 9.67, "total_revenue": 35.0, "total_cost": 9.67, "net_profit": 25.33, "sale_date": today_str, "customer_name": "Cliente Mostrador", "payment_method": "Efectivo", "notes": "Venta individual ($35.00 MXN)", "created_at": now_str},
        {"id": 2, "cookie_id": 1, "cookie_name": "Galleta Artesanal Oreo & Chispas de Chocolate", "quantity": 3, "unit_price": 30.0, "unit_cost": 9.67, "total_revenue": 90.0, "total_cost": 29.01, "net_profit": 60.99, "sale_date": today_str, "customer_name": "Café La Terraza Roma", "payment_method": "Transferencia", "notes": "Promoción 3 x $90.00 MXN ($30 c/u)", "created_at": now_str},
        {"id": 3, "cookie_id": 1, "cookie_name": "Galleta Artesanal Oreo & Chispas de Chocolate", "quantity": 6, "unit_price": 30.0, "unit_cost": 9.67, "total_revenue": 180.0, "total_cost": 58.02, "net_profit": 121.98, "sale_date": yesterday, "customer_name": "Boutique Petit", "payment_method": "Transferencia", "notes": "2x Paquetes Promoción 3 x $90", "created_at": now_str},
        {"id": 4, "cookie_id": 2, "cookie_name": "Chispas Clásicas NY Style", "quantity": 3, "unit_price": 30.0, "unit_cost": 9.67, "total_revenue": 90.0, "total_cost": 29.01, "net_profit": 60.99, "sale_date": yesterday, "customer_name": "Mariana López", "payment_method": "Efectivo", "notes": "Promoción 3 x $90.00 MXN", "created_at": now_str},
        {"id": 5, "cookie_id": 1, "cookie_name": "Galleta Artesanal Oreo & Chispas de Chocolate", "quantity": 1, "unit_price": 35.0, "unit_cost": 9.67, "total_revenue": 35.0, "total_cost": 9.67, "net_profit": 25.33, "sale_date": twoDaysAgo, "customer_name": "Carlos Mendoza", "payment_method": "Tarjeta Débito", "notes": "Venta individual ($35.00 MXN)", "created_at": now_str},
        {"id": 6, "cookie_id": 1, "cookie_name": "Galleta Artesanal Oreo & Chispas de Chocolate", "quantity": 3, "unit_price": 30.0, "unit_cost": 9.67, "total_revenue": 90.0, "total_cost": 29.01, "net_profit": 60.99, "sale_date": twoDaysAgo, "customer_name": "Gimnasio FitZone", "payment_method": "Transferencia", "notes": "Promoción 3 x $90.00 MXN", "created_at": now_str},
    ]
    db.cookie_sales.insert_many(sales)

    # Gastos generales de muestra
    expenses = [
        {"id": 1, "title": "Insumos Taller: Harina, Mantequilla y Galletas Oreo", "amount": 850.0, "category": "Insumos Galletas", "date": today_str, "payment_method": "Tarjeta Débito", "notes": "Ticket Insumos Receta", "receipt_url": "", "receipt_data": {}, "created_at": now_str},
        {"id": 2, "title": "Cajas de Empaque Kraft con Ventana Individual (100 pzas)", "amount": 290.0, "category": "Empaques y Envíos", "date": today_str, "payment_method": "Transferencia", "notes": "Empaque individual $2.90 c/u", "receipt_url": "", "receipt_data": {}, "created_at": now_str},
        {"id": 3, "title": "Recarga de Gas para Horno", "amount": 650.0, "category": "Servicios y Luz", "date": yesterday, "payment_method": "Efectivo", "notes": "Cilindro 30kg cocina", "receipt_url": "", "receipt_data": {}, "created_at": now_str},
        {"id": 4, "title": "Luz Eléctrica CFE Bimestral", "amount": 890.0, "category": "Servicios y Luz", "date": yesterday, "payment_method": "Transferencia", "notes": "Recibo Luz Taller", "receipt_url": "", "receipt_data": {}, "created_at": now_str},
        {"id": 5, "title": "Campañas Publicidad Instagram", "amount": 350.0, "category": "Marketing y Redes", "date": twoDaysAgo, "payment_method": "Tarjeta Crédito", "notes": "Promoción Oreo & Chispas 3x$90", "receipt_url": "", "receipt_data": {}, "created_at": now_str},
        {"id": 6, "title": "Gasolina para entregas locales", "amount": 400.0, "category": "Transporte", "date": twoDaysAgo, "payment_method": "Efectivo", "notes": "Ruta de reparto", "receipt_url": "", "receipt_data": {}, "created_at": now_str},
        {"id": 7, "title": "Supermercado Personal Semanal", "amount": 1250.0, "category": "Hogar y Personales", "date": twoDaysAgo, "payment_method": "Tarjeta Débito", "notes": "Despensa semanal", "receipt_url": "", "receipt_data": {}, "created_at": now_str},
    ]
    db.expenses.insert_many(expenses)
    print("[Mongo Init] Datos semilla iniciales insertados en MongoDB.")

def seed_sample_orders(db: Database):
    """
    Siembra pedidos de muestra para ilustrar el consolidado de horneado y WhatsApp ticket.
    """
    import urllib.parse
    today = date.today()
    # Calcular viernes y lunes próximos
    days_to_friday = (4 - today.weekday()) % 7
    if days_to_friday == 0:
        days_to_friday = 7
    friday = (today + timedelta(days=days_to_friday)).isoformat()
    monday = (today + timedelta(days=(days_to_friday + 3))).isoformat()
    now_str = datetime.utcnow().isoformat()

    orders_data = [
        {
            "id": 1,
            "customer_name": "Valeria Gómez",
            "customer_phone": "5512345678",
            "delivery_date": friday,
            "order_date": today.isoformat(),
            "status": "En Preparación",
            "payment_method": "Transferencia",
            "payment_status": "Pagado",
            "deposit_amount": 455.0,
            "items": [
                {"product_id": 1, "product_name": "Galleta Artesanal Oreo & Chispas de Chocolate", "quantity": 3, "unit_price": 35.0, "unit_cost": 9.67, "subtotal": 105.0, "notes": "Empaque individual"},
                {"product_id": 2, "product_name": "Chispas Clásicas NY Style", "quantity": 5, "unit_price": 35.0, "unit_cost": 9.67, "subtotal": 175.0, "notes": "Bien doraditas"},
                {"product_id": 4, "product_name": "Nutella Stuffed Bomb", "quantity": 5, "unit_price": 48.0, "unit_cost": 14.20, "subtotal": 240.0, "notes": "Caja decorada"}
            ],
            "total_amount": 520.0,
            "total_cost": 148.36,
            "net_profit": 371.64,
            "notes": "Entrega en oficina corporativa 14:00 hrs",
            "stock_deducted": False,
            "created_at": now_str
        },
        {
            "id": 2,
            "customer_name": "Café Bella Vista",
            "customer_phone": "5598765432",
            "delivery_date": monday,
            "order_date": today.isoformat(),
            "status": "Pendiente",
            "payment_method": "Transferencia",
            "payment_status": "Anticipo",
            "deposit_amount": 400.0,
            "items": [
                {"product_id": 1, "product_name": "Galleta Artesanal Oreo & Chispas de Chocolate", "quantity": 6, "unit_price": 30.0, "unit_cost": 9.67, "subtotal": 180.0, "notes": "Precio mayoreo"},
                {"product_id": 2, "product_name": "Chispas Clásicas NY Style", "quantity": 13, "unit_price": 30.0, "unit_cost": 9.67, "subtotal": 390.0, "notes": "Precio mayoreo"},
                {"product_id": 4, "product_name": "Nutella Stuffed Bomb", "quantity": 5, "unit_price": 42.0, "unit_cost": 14.20, "subtotal": 210.0, "notes": "Precio mayoreo"}
            ],
            "total_amount": 780.0,
            "total_cost": 254.75,
            "net_profit": 525.25,
            "notes": "Pedido semanal de cafetería",
            "stock_deducted": False,
            "created_at": now_str
        }
    ]

    for o in orders_data:
        items_text = ", ".join(f"{it['quantity']}x {it['product_name']}" for it in o["items"])
        msg = f"Hola {o['customer_name']}, tu pedido para el {o['delivery_date']} es: {items_text} - Total: ${o['total_amount']} MXN. ¡Muchas gracias por tu preferencia!"
        phone_clean = "".join(c for c in o["customer_phone"] if c.isdigit())
        o["whatsapp_message"] = msg
        o["whatsapp_url"] = f"https://wa.me/{phone_clean}?text={urllib.parse.quote(msg)}"
        db.orders.insert_one(o)

    print("[Mongo Init] Pedidos semilla para consolidado de producción insertados.")


def seed_sample_promotions(db: Database):
    """
    Semillas iniciales de promociones atractivas y flexibles para la panadería/pastelería.
    """
    now_str = datetime.utcnow().isoformat()
    promos = [
        {
            "id": 1,
            "name": "Trío Dulce (3 Galletas x $90)",
            "description": "Lleva 3 galletas artesanales de cualquier sabor por un precio especial de $90.",
            "promo_type": "combo_fixed_price",
            "discount_value": 90.0,
            "target_type": "all_products",
            "target_product_ids": [],
            "target_category": None,
            "min_quantity": 3,
            "min_order_amount": 0.0,
            "is_active": True,
            "badge_text": "3 x $90",
            "icon": "cookie",
            "color_tag": "#F59E0B",
            "start_date": None,
            "end_date": None,
            "created_at": now_str
        },
        {
            "id": 2,
            "name": "Docena Consentida (15% OFF)",
            "description": "15% de descuento al llevar 12 o más galletas para compartir con la familia o equipo.",
            "promo_type": "percentage",
            "discount_value": 15.0,
            "target_type": "all_products",
            "target_product_ids": [],
            "target_category": None,
            "min_quantity": 12,
            "min_order_amount": 0.0,
            "is_active": True,
            "badge_text": "15% OFF",
            "icon": "sparkles",
            "color_tag": "#EC4899",
            "start_date": None,
            "end_date": None,
            "created_at": now_str
        },
        {
            "id": 3,
            "name": "Descuento Especial en Carrito ($30 OFF)",
            "description": "Descuento directo de $30 MXN en pedidos o compras mayores a $250 MXN.",
            "promo_type": "fixed_amount",
            "discount_value": 30.0,
            "target_type": "order_total",
            "target_product_ids": [],
            "target_category": None,
            "min_quantity": 1,
            "min_order_amount": 250.0,
            "is_active": True,
            "badge_text": "-$30 MXN",
            "icon": "gift",
            "color_tag": "#10B981",
            "start_date": None,
            "end_date": None,
            "created_at": now_str
        },
        {
            "id": 4,
            "name": "2x1 en Chispas Clásicas NY",
            "description": "Lleva 2 galletas Chispas Clásicas NY y paga solo 1.",
            "promo_type": "two_for_one",
            "discount_value": 1.0,
            "target_type": "specific_products",
            "target_product_ids": [2],
            "target_category": None,
            "min_quantity": 2,
            "min_order_amount": 0.0,
            "is_active": True,
            "badge_text": "2x1",
            "icon": "flame",
            "color_tag": "#8B5CF6",
            "start_date": None,
            "end_date": None,
            "created_at": now_str
        }
    ]

    db.promotions.insert_many(promos)
    print("[Mongo Init] Promociones semilla insertadas.")


