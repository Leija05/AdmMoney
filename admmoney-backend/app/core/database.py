from typing import Optional
from pymongo import MongoClient, ReturnDocument
from pymongo.database import Database

from .config import MONGO_URL, MONGO_DB_NAME

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
    Inicializa colecciones e índices en MongoDB Atlas.
    """
    db = get_db()

    # Índices únicos por ID numérico para cada colección
    for coll_name in ["expenses", "cookie_ingredients", "cookie_products", "cookie_sales", "receipt_scans", "orders", "promotions"]:
        db[coll_name].create_index("id", unique=True)

    # Índice por fecha para optimizar consultas de gastos, ventas y pedidos
    db.expenses.create_index([("date", -1), ("id", -1)])
    db.cookie_sales.create_index([("sale_date", -1), ("id", -1)])
    db.orders.create_index([("delivery_date", 1), ("status", 1)])

    print("[Mongo Init] Conexión establecida. Índices verificados. MongoDB Atlas es la fuente de verdad.")

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
