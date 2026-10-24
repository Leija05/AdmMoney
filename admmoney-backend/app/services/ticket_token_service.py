import secrets
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, Tuple
from ..core.database import get_db

TOKEN_EXPIRATION_DAYS = 30

def generate_ticket_token() -> str:
    """
    Genera un token criptográfico único, impredecible y URL-safe de 24 caracteres hexadecimales.
    2^96 combinaciones posibles: matemáticamente imposible de adivinar o iterar.
    """
    return secrets.token_hex(12)

def ensure_ticket_token(doc: Dict[str, Any], collection_name: str) -> str:
    """
    Garantiza que un registro de pedido o venta tenga asignado su ticket_token único.
    Si ya lo tiene, lo devuelve. Si no, lo genera y lo persiste en la base de datos.
    """
    if doc.get("ticket_token") and len(str(doc["ticket_token"]).strip()) >= 16:
        return doc["ticket_token"]

    db = get_db()
    token = generate_ticket_token()
    doc["ticket_token"] = token

    try:
        if "id" in doc:
            db[collection_name].update_one({"id": doc["id"]}, {"$set": {"ticket_token": token}})
    except Exception:
        pass

    return token

def parse_iso_datetime(date_str: Optional[str]) -> Optional[datetime]:
    if not date_str:
        return None
    try:
        # Intenta formato ISO con hora (YYYY-MM-DDTHH:MM:SS)
        return datetime.fromisoformat(date_str.replace("Z", "+00:00").split("+")[0])
    except Exception:
        pass
    try:
        # Intenta formato de solo fecha (YYYY-MM-DD)
        d = date.fromisoformat(date_str[:10])
        return datetime(d.year, d.month, d.day)
    except Exception:
        return None

def is_ticket_expired(created_at_str: Optional[str], max_days: int = TOKEN_EXPIRATION_DAYS) -> bool:
    """
    Verifica si un ticket ha superado el periodo de vigencia seguro (por defecto 30 días).
    """
    dt = parse_iso_datetime(created_at_str)
    if not dt:
        return False  # Si no hay fecha legible, no bloqueamos por defecto
    
    elapsed = datetime.utcnow() - dt
    return elapsed > timedelta(days=max_days)

def resolve_ticket_by_token(token: str) -> Tuple[Optional[str], Optional[Dict[str, Any]], bool]:
    """
    Busca un ticket a partir de su token criptográfico en orders y cookie_sales.
    Retorna: (tipo ['order'|'sale'|None], documento, expirado [bool])
    """
    if not token or len(token.strip()) < 10:
        return None, None, False

    clean_token = token.strip()
    db = get_db()

    # 1. Buscar en orders
    order = db.orders.find_one({"ticket_token": clean_token}, {"_id": 0})
    if order:
        ref_date = order.get("created_at") or order.get("order_date")
        expired = is_ticket_expired(ref_date)
        return "order", order, expired

    # 2. Buscar en cookie_sales
    sale = db.cookie_sales.find_one({"ticket_token": clean_token}, {"_id": 0})
    if sale:
        ref_date = sale.get("created_at") or sale.get("sale_date")
        expired = is_ticket_expired(ref_date)
        return "sale", sale, expired

    return None, None, False
