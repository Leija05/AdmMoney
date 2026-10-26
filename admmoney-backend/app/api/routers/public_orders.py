import os
import random
import urllib.parse
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from ...core.database import get_db, get_next_sequence
from ...models.schemas import PublicOrderCreate, PublicOrderResponse

router = APIRouter(tags=["Portal Web de Pedidos QR"])

def generate_unique_folio() -> str:
    """Genera un folio único irrepetible con prefijo LK, ej: #LK-7482"""
    num = random.randint(1000, 9999)
    return f"#LK-{num}"

@router.get("/api/public/menu")
def get_public_menu():
    """Retorna el catálogo público de galletas activas para la web del cliente"""
    db = get_db()
    cookies = list(db.cookie_products.find({"is_active": True}, {"_id": 0}))
    return cookies

@router.get("/api/public/promotions")
def get_public_promotions():
    """Retorna las promociones activas para aplicarlas automáticamente en la web"""
    db = get_db()
    promos = list(db.promotions.find({"is_active": True}, {"_id": 0}))
    return promos

@router.get("/api/public/blacklist")
def get_public_blacklist():
    """Retorna la lista de números bloqueados para la app móvil"""
    db = get_db()
    blocked = list(db.blacklisted_phones.find({}, {"_id": 0}))
    return blocked

@router.post("/api/public/orders", response_model=PublicOrderResponse)
def create_public_order(data: PublicOrderCreate, request: Request):
    """
    Crea un pedido desde la web QR del cliente con estrategia anti-mermas y promociones automáticas:
    - Aplica promociones y descuentos activos automáticamente al calcular el total.
    - Estado 'Pendiente de Confirmación' (visible en app con badge y confirmable con 1 toque).
    - Genera folio único inviolable (#LK-XXXX).
    - Rate limiting estricto: máximo 2 pedidos activos sin confirmar por teléfono.
    - Bloqueo de números en lista negra.
    - Expiración a 45 minutos si no se envía el WhatsApp.
    """
    db = get_db()
    clean_phone = "".join(c for c in data.customer_phone if c.isdigit())
    if len(clean_phone) < 10:
        raise HTTPException(status_code=400, detail="Por favor ingresa un número de WhatsApp válido (mínimo 10 dígitos).")

    # 1. Verificar Lista Negra de Clientes Bromistas
    is_blocked = db.blacklisted_phones.find_one({"phone": clean_phone})
    if is_blocked:
        raise HTTPException(
            status_code=403,
            detail="No es posible procesar pedidos para esta línea en este momento. Por favor comunícate directamente con la sucursal."
        )

    # 2. Rate Limiting: Máximo 2 pedidos activos 'Pendiente de Confirmación' por teléfono
    active_pending = db.orders.count_documents({
        "customer_phone": {"$regex": clean_phone[-10:]},
        "status": "Pendiente de Confirmación"
    })
    if active_pending >= 2:
        raise HTTPException(
            status_code=429,
            detail="Ya tienes pedidos pendientes de confirmación. Por favor envía el mensaje de WhatsApp de tus pedidos anteriores antes de generar uno nuevo."
        )

    # 3. Validar productos y calcular subtotal bruto
    cookies_map = {c["id"]: c for c in db.cookie_products.find({"is_active": True})}
    items_list = []
    raw_subtotal = 0.0
    total_cost = 0.0
    total_units = 0

    for item in data.items:
        prod = cookies_map.get(item.product_id)
        if not prod:
            continue
        qty = max(1, item.quantity)
        price = float(prod.get("sale_price", 30.0))
        cost = float(prod.get("recipe_cost", 9.67))
        item_sub = round(price * qty, 2)
        raw_subtotal += item_sub
        total_cost += round(cost * qty, 2)
        total_units += qty

        items_list.append({
            "product_id": prod["id"],
            "product_name": prod["name"],
            "quantity": qty,
            "unit_price": price,
            "unit_cost": cost,
            "subtotal": item_sub,
        })

    if not items_list:
        raise HTTPException(status_code=400, detail="Debes seleccionar al menos una galleta para ordenar.")

    raw_subtotal = round(raw_subtotal, 2)
    total_cost = round(total_cost, 2)

    # 4. Evaluación y Aplicación Automática de Promociones
    active_promos = list(db.promotions.find({"is_active": True}))
    applied_promo_id: Optional[int] = None
    applied_promo_name: Optional[str] = None
    applied_discount: float = 0.0
    avg_price = (raw_subtotal / total_units) if total_units > 0 else 0.0

    # Si el cliente ya especificó una promoción válida, verificarla primero
    if data.promotion_id:
        matching_promo = next((p for p in active_promos if p.get("id") == data.promotion_id), None)
        if matching_promo:
            ptype = matching_promo.get("promo_type", "combo_fixed_price")
            min_q = int(matching_promo.get("min_quantity") or matching_promo.get("min_units") or 1)
            min_amt = float(matching_promo.get("min_order_amount") or 0.0)

            if total_units >= min_q and raw_subtotal >= min_amt:
                if ptype == "combo_fixed_price":
                    promo_price = float(matching_promo.get("promo_price") or matching_promo.get("discount_value") or 0.0)
                    bundles = total_units // min_q if min_q > 0 else 1
                    normal_cost = bundles * min_q * avg_price
                    promo_cost = bundles * promo_price
                    if promo_price > 0 and normal_cost > promo_cost:
                        applied_discount = round(normal_cost - promo_cost, 2)
                        applied_promo_id = matching_promo["id"]
                        applied_promo_name = matching_promo["name"]
                elif ptype == "percentage":
                    pct = float(matching_promo.get("discount_pct") or matching_promo.get("discount_value") or 0.0)
                    if pct > 0:
                        applied_discount = round(raw_subtotal * (pct / 100.0), 2)
                        applied_promo_id = matching_promo["id"]
                        applied_promo_name = matching_promo["name"]
                elif ptype == "fixed_amount":
                    fix_disc = float(matching_promo.get("discount_amount") or matching_promo.get("discount_value") or 0.0)
                    if fix_disc > 0:
                        applied_discount = min(raw_subtotal, round(fix_disc, 2))
                        applied_promo_id = matching_promo["id"]
                        applied_promo_name = matching_promo["name"]

    # Si no tiene promo o no fue válida, evaluar automáticamente todas las promos activas y elegir el mayor ahorro
    if applied_discount <= 0:
        best_saving = 0.0
        best_promo = None

        for p in active_promos:
            ptype = p.get("promo_type", "combo_fixed_price")
            min_q = int(p.get("min_quantity") or p.get("min_units") or 1)
            min_amt = float(p.get("min_order_amount") or 0.0)

            if total_units >= min_q and raw_subtotal >= min_amt:
                calc_disc = 0.0
                if ptype == "combo_fixed_price":
                    combo_price = float(p.get("promo_price") or p.get("discount_value") or 0.0)
                    bundles = total_units // min_q if min_q > 0 else 1
                    normal_cost = bundles * min_q * avg_price
                    promo_cost = bundles * combo_price
                    if combo_price > 0 and normal_cost > promo_cost:
                        calc_disc = round(normal_cost - promo_cost, 2)
                elif ptype == "percentage":
                    pct = float(p.get("discount_pct") or p.get("discount_value") or 0.0)
                    if pct > 0:
                        calc_disc = round(raw_subtotal * (pct / 100.0), 2)
                elif ptype == "fixed_amount":
                    fix_disc = float(p.get("discount_amount") or p.get("discount_value") or 0.0)
                    if fix_disc > 0:
                        calc_disc = min(raw_subtotal, round(fix_disc, 2))

                if calc_disc > best_saving:
                    best_saving = calc_disc
                    best_promo = p

        if best_promo and best_saving > 0:
            applied_discount = best_saving
            applied_promo_id = best_promo["id"]
            applied_promo_name = best_promo["name"]

    total_amount = max(0.0, round(raw_subtotal - applied_discount, 2))
    net_profit = round(total_amount - total_cost, 2)

    # 5. Generar Folio único y fechas
    folio = generate_unique_folio()
    new_id = get_next_sequence("orders")
    now = datetime.utcnow()
    expires_at = (now + timedelta(minutes=45)).isoformat()
    delivery_date = data.delivery_date or date.today().isoformat()

    # 6. Obtener teléfono de recepción de WhatsApp (Línea activa configurada)
    target_wa = "".join(c for c in (data.target_phone or "") if c.isdigit())
    if not target_wa or len(target_wa) < 10:
        settings_doc = db.app_settings.find_one({"key": "whatsapp_settings"})
        if settings_doc:
            default_line = settings_doc.get("defaultQrPhone", "phone1")
            target_wa = "".join(c for c in str(settings_doc.get(default_line, "")) if c.isdigit())
    if not target_wa or len(target_wa) < 10:
        target_wa = "528123456789"

    if not target_wa.startswith("52") and len(target_wa) == 10:
        target_wa = "52" + target_wa

    # 7. Mensaje estructurado, limpio, profesional - Cero emojis
    items_lines = "\n".join(f"  - {it['quantity']}x {it['product_name']} (${it['unit_price']:.2f} c/u)" for it in items_list)
    promo_block = f"\nPromocion aplicada: {applied_promo_name} (-${applied_discount:.2f} MXN)" if applied_discount > 0 else ""
    notes_block = f"\nNotas: {data.notes.strip()}" if data.notes and data.notes.strip() else ""

    wa_message = (
        f"LUCKY COOKIES - PEDIDO EN LINEA\n"
        f"Confirmacion de Orden: {folio}\n\n"
        f"Cliente: {data.customer_name.strip()}\n"
        f"Telefono: {clean_phone}\n\n"
        f"DETALLE DEL PEDIDO:\n"
        f"{items_lines}\n\n"
        f"RESUMEN DE CUENTA:\n"
        f"Subtotal: ${raw_subtotal:.2f} MXN"
        f"{promo_block}\n"
        f"Total a pagar contra entrega: ${total_amount:.2f} MXN\n\n"
        f"ENTREGA PROGRAMADA:\n"
        f"Fecha: {delivery_date}\n"
        f"Horario sugerido: {data.delivery_time}"
        f"{notes_block}\n\n"
        f"Favor de confirmar este mensaje para hornear tu pedido."
    )
    wa_url = f"https://wa.me/{target_wa}?text={urllib.parse.quote(wa_message)}"

    # 8. Guardar en Base de Datos (Estado 'Pendiente de Confirmación')
    order_doc = {
        "id": new_id,
        "folio": folio,
        "origin": "web_qr",
        "customer_name": data.customer_name.strip(),
        "customer_phone": clean_phone,
        "delivery_date": delivery_date,
        "order_date": date.today().isoformat(),
        "status": "Pendiente de Confirmación",
        "payment_method": "Contra Entrega",
        "payment_status": "Pendiente",
        "deposit_amount": 0.0,
        "items": items_list,
        "raw_subtotal": raw_subtotal,
        "promotion_id": applied_promo_id,
        "promotion_name": applied_promo_name,
        "discount_amount": applied_discount,
        "total_amount": total_amount,
        "total_cost": total_cost,
        "net_profit": net_profit,
        "notes": f"Pedido Web QR ({data.delivery_time}). {data.notes or ''}".strip(),
        "whatsapp_message": wa_message,
        "whatsapp_url": wa_url,
        "stock_deducted": False,
        "expires_at": expires_at,
        "created_at": now.isoformat()
    }
    db.orders.insert_one(order_doc)

    # Registrar cliente en directorio si no existe
    existing_cust = db.customers.find_one({"name": {"$regex": f"^{data.customer_name.strip()}$", "$options": "i"}})
    if not existing_cust:
        cust_id = get_next_sequence("customers")
        db.customers.insert_one({
            "id": cust_id,
            "name": data.customer_name.strip(),
            "phone": clean_phone,
            "notes": "Cliente registrado via Web QR",
            "created_at": now.isoformat()
        })

    return {
        "folio": folio,
        "order_id": new_id,
        "customer_name": data.customer_name.strip(),
        "total_amount": total_amount,
        "status": "Pendiente de Confirmación",
        "whatsapp_url": wa_url,
        "whatsapp_message": wa_message,
        "expires_at": expires_at,
        "message": f"Pedido {folio} registrado. Por favor confirma tu orden por WhatsApp para hornearla de inmediato."
    }

# ----------------- BLOQUEO Y LISTA NEGRA ANTI-BROMISTAS ----------------- #
@router.post("/api/public/blacklist/{phone}")
def add_to_blacklist(phone: str, reason: Optional[str] = "Broma o pedido falso"):
    """Permite al repostero bloquear un número para evitar pedidos falsos futuros"""
    db = get_db()
    clean = "".join(c for c in phone if c.isdigit())
    db.blacklisted_phones.update_one(
        {"phone": clean},
        {"$set": {"phone": clean, "reason": reason, "blocked_at": datetime.utcnow().isoformat()}},
        upsert=True
    )
    return {"message": f"Número {clean} añadido a la lista negra."}

@router.delete("/api/public/blacklist/{phone}")
def remove_from_blacklist(phone: str):
    db = get_db()
    clean = "".join(c for c in phone if c.isdigit())
    db.blacklisted_phones.delete_one({"phone": clean})
    return {"message": f"Número {clean} desbloqueado."}

# ----------------- CONFIGURACIÓN WHATSAPP SYNC ----------------- #
@router.post("/api/public/settings/whatsapp")
def save_public_whatsapp_settings(data: Dict[str, Any]):
    """Guarda en BD los números y línea activa para que el portal web QR siempre sepa a qué chat mandar"""
    db = get_db()
    doc = {
        "key": "whatsapp_settings",
        "phone1": data.get("phone1", ""),
        "phone2": data.get("phone2", ""),
        "label1": data.get("label1", ""),
        "label2": data.get("label2", ""),
        "defaultQrPhone": data.get("defaultQrPhone", "phone1"),
        "updated_at": datetime.utcnow().isoformat()
    }
    db.app_settings.update_one({"key": "whatsapp_settings"}, {"$set": doc}, upsert=True)
    return {"message": "Configuración de WhatsApp guardada en la base de datos.", "settings": doc}

@router.get("/api/public/settings/whatsapp")
def get_public_whatsapp_settings():
    db = get_db()
    doc = db.app_settings.find_one({"key": "whatsapp_settings"}, {"_id": 0})
    return doc or {}

# ----------------- PÁGINA WEB PÚBLICA PARA CELULARES (/pedir) ----------------- #
@router.get("/pedir", response_class=HTMLResponse)
@router.get("/menu", response_class=HTMLResponse)
def serve_public_ordering_page(request: Request):
    """
    Página web pública de pedidos ultra moderna, responsiva y adaptable a cualquier smartphone.
    Soporta promociones automáticas en vivo y genera el mensaje formateado de WhatsApp.
    """
    html_content = r"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Lucky Cookies — Menú y Pedidos en Línea</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #FDFBF7;
      --card-bg: #FFFFFF;
      --text: #0F172A;
      --text-muted: #64748B;
      --border: #F1E8DC;
      --border-focus: #D97706;
      --primary: #D97706;
      --primary-hover: #B45309;
      --primary-soft: #FEF3C7;
      --emerald: #059669;
      --emerald-soft: #D1FAE5;
      --radius: 18px;
      --radius-sm: 12px;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-tap-highlight-color: transparent;
    }
    body {
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding-bottom: calc(110px + env(safe-area-inset-bottom, 20px));
      overflow-x: hidden;
    }

    /* Top Brand Bar */
    header {
      background: linear-gradient(135deg, #0B132B 0%, #1E293B 100%);
      color: #FFFFFF;
      padding: 24px 20px 22px;
      text-align: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 24px rgba(11, 19, 43, 0.2);
    }
    .brand-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(217, 119, 6, 0.18);
      border: 1px solid rgba(245, 158, 11, 0.4);
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #FBBF24;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    .brand-tagline {
      font-size: 13px;
      color: #94A3B8;
      margin-top: 4px;
    }

    /* Container */
    .container {
      max-width: 540px;
      margin: 0 auto;
      padding: 18px 16px;
    }

    /* Promos Banner Card */
    .promo-highlight-card {
      background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
      border: 1px solid #F59E0B;
      border-radius: var(--radius);
      padding: 14px 16px;
      margin-bottom: 18px;
      box-shadow: 0 4px 14px rgba(217, 119, 6, 0.12);
      animation: fadeIn 0.4s ease;
    }
    .promo-highlight-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
      font-weight: 800;
      color: #92400E;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .promo-pill-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
    }
    .promo-pill {
      background: #FFFFFF;
      border: 1px solid #FCD34D;
      color: #78350F;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
    }

    /* Section Headings */
    .section-title {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-muted);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Cookie Card */
    .cookie-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px;
      margin-bottom: 12px;
      display: flex;
      gap: 14px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    }
    .cookie-card.has-selected {
      border-color: var(--primary);
      box-shadow: 0 4px 16px rgba(217, 119, 6, 0.12);
    }
    .cookie-img {
      width: 88px;
      height: 88px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      background: #F1E8DC;
      flex-shrink: 0;
    }
    .cookie-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
    }
    .cookie-name {
      font-size: 15.5px;
      font-weight: 800;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cookie-desc {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 16px;
      margin: 3px 0 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .cookie-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .cookie-price {
      font-size: 16px;
      font-weight: 800;
      color: var(--primary);
    }

    /* Tactile Counter */
    .counter {
      display: inline-flex;
      align-items: center;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 3px;
    }
    .counter button {
      width: 32px;
      height: 32px;
      border: none;
      background: #FFFFFF;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 800;
      color: var(--primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      transition: background 0.1s, transform 0.08s;
      user-select: none;
    }
    .counter button:active {
      transform: scale(0.92);
      background: var(--primary-soft);
    }
    .counter span {
      width: 32px;
      text-align: center;
      font-size: 14.5px;
      font-weight: 800;
      color: var(--text);
    }

    /* Dynamic Promo Reward Banner */
    .live-promo-alert {
      background: var(--emerald-soft);
      border: 1px solid #A7F3D0;
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      margin-top: 14px;
      margin-bottom: 14px;
      display: none;
      align-items: center;
      justify-content: space-between;
      animation: popIn 0.25s ease;
    }
    .live-promo-text {
      font-size: 13px;
      font-weight: 700;
      color: #065F46;
      line-height: 17px;
    }
    .live-promo-saving {
      font-size: 12px;
      font-weight: 800;
      background: #059669;
      color: #FFFFFF;
      padding: 3px 8px;
      border-radius: 6px;
      white-space: nowrap;
      margin-left: 8px;
    }

    /* Form Styles */
    .order-form {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      margin-top: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    }
    .form-group {
      margin-bottom: 14px;
    }
    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 800;
      color: var(--text-muted);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      padding: 13px 14px;
      border: 1.5px solid #E2E8F0;
      border-radius: var(--radius-sm);
      font-size: 14.5px;
      color: var(--text);
      outline: none;
      background: #FAFAFA;
      transition: border-color 0.2s, background 0.2s;
    }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
      border-color: var(--border-focus);
      background: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15);
    }

    /* Sticky Bottom Action Bar */
    .bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #FFFFFF;
      border-top: 1px solid #E2E8F0;
      padding: 14px 20px calc(14px + env(safe-area-inset-bottom, 12px));
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      z-index: 200;
      box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.08);
      max-width: 540px;
      margin: 0 auto;
    }
    .total-col {
      flex: 1;
      min-width: 0;
    }
    .total-lbl {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 800;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }
    .total-val-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .total-val {
      font-size: 21px;
      font-weight: 800;
      color: var(--primary);
    }
    .total-orig {
      font-size: 13px;
      color: #94A3B8;
      text-decoration: line-through;
    }
    .total-promo-hint {
      font-size: 11px;
      font-weight: 700;
      color: var(--emerald);
      margin-top: 2px;
    }

    .btn-submit {
      background: linear-gradient(135deg, #059669 0%, #10B981 100%);
      color: #FFFFFF;
      border: none;
      padding: 14px 22px;
      border-radius: var(--radius-sm);
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      transition: transform 0.1s, opacity 0.2s;
      white-space: nowrap;
      min-height: 48px;
    }
    .btn-submit:active {
      transform: scale(0.97);
    }
    .btn-submit:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* Modal Overlay & Card */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(5px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 999;
    }
    .modal-card {
      background: #FFFFFF;
      border-radius: 24px;
      padding: 28px 24px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-badge-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }
    .modal-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--text);
    }
    .modal-sub {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .modal-folio-pill {
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FDE68A;
      padding: 8px 18px;
      border-radius: 12px;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      display: inline-block;
      margin: 14px 0;
    }
    .modal-desc {
      font-size: 13px;
      color: #475569;
      line-height: 18px;
      margin-bottom: 18px;
    }
    .btn-wa-confirm {
      background: linear-gradient(135deg, #059669 0%, #10B981 100%);
      color: #FFFFFF;
      text-decoration: none;
      width: 100%;
      padding: 15px;
      border-radius: var(--radius-sm);
      font-size: 15px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      border: none;
      cursor: pointer;
    }

    @keyframes popIn {
      0% { transform: scale(0.92); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(-4px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>

  <header>
    <div class="brand-eyebrow">Lucky Cookies &bull; Reposteria Artesanal</div>
    <h1>Galletas y Postres</h1>
    <div class="brand-tagline">Arma tu orden y recíbela recién horneada</div>
  </header>

  <div class="container">
    <!-- Active Promos Banner -->
    <div class="promo-highlight-card" id="promosBanner" style="display: none;">
      <div class="promo-highlight-header">Promociones Activas</div>
      <div class="promo-pill-list" id="promosList"></div>
    </div>

    <!-- Live Auto Promotion Activated Box -->
    <div class="live-promo-alert" id="livePromoAlert">
      <div class="live-promo-text" id="livePromoText">Promoción activa</div>
      <div class="live-promo-saving" id="livePromoSaving">Ahorras $0.00</div>
    </div>

    <div class="section-title">
      <span>Nuestras Galletas</span>
      <span id="unitsCount" style="font-size: 12px; color: var(--primary); font-weight: 800;">0 seleccionadas</span>
    </div>

    <div id="cookiesList">
      <p style="text-align: center; color: var(--text-muted); padding: 30px 0;">Cargando catálogo delicioso...</p>
    </div>

    <!-- Formulario de entrega -->
    <div class="order-form">
      <div class="section-title" style="margin-bottom: 16px;">Datos de Entrega</div>

      <div class="form-group">
        <label>Nombre y Apellido *</label>
        <input type="text" id="custName" placeholder="Ej. Juan Pérez" required autocomplete="name">
      </div>

      <div class="form-group">
        <label>Teléfono de WhatsApp (10 dígitos) *</label>
        <input type="tel" id="custPhone" placeholder="Ej. 8112345678" maxlength="10" required autocomplete="tel">
      </div>

      <div class="form-group">
        <label>Fecha de Entrega Sugerida</label>
        <input type="date" id="custDate">
      </div>

      <div class="form-group">
        <label>Horario Preferido</label>
        <select id="custTime">
          <option>Tarde (4:00 PM - 7:00 PM)</option>
          <option>Mediodía (12:00 PM - 3:00 PM)</option>
          <option>Mañana (9:00 AM - 12:00 PM)</option>
          <option>Lo antes posible (Consultar en WhatsApp)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Notas Especiales / Dedicatoria</label>
        <textarea id="custNotes" rows="2" placeholder="Ej. Para regalo, sin nuez, dedicatoria especial..."></textarea>
      </div>
    </div>
  </div>

  <!-- Sticky Bottom Bar -->
  <div class="bottom-bar">
    <div class="total-col">
      <div class="total-lbl">Total a pagar</div>
      <div class="total-val-row">
        <div class="total-val" id="totalDisplay">$0.00 MXN</div>
        <div class="total-orig" id="origDisplay" style="display: none;">$0.00</div>
      </div>
      <div class="total-promo-hint" id="promoHint" style="display: none;">Promoción aplicada</div>
    </div>
    <button class="btn-submit" id="submitBtn" onclick="submitOrder()" disabled>
      <span>Finalizar Pedido</span> &rarr;
    </button>
  </div>

  <!-- Modal de Éxito & Redirección a WhatsApp -->
  <div class="modal-overlay" id="modalOverlay">
    <div class="modal-card">
      <div class="modal-badge-icon">&#10004;</div>
      <h2 class="modal-title">¡Orden Registrada!</h2>
      <p class="modal-sub">Tu folio oficial de pedido es:</p>
      <div class="modal-folio-pill" id="modalFolio">#LK-0000</div>
      <p class="modal-desc">
        Tu pedido ha sido guardado. Pulsa el botón de abajo para enviar el mensaje de confirmación por WhatsApp y enviarlo directamente al horno.
      </p>
      <a href="#" id="modalWaBtn" class="btn-wa-confirm" target="_blank">
        Abrir WhatsApp y Confirmar
      </a>
    </div>
  </div>

  <script>
    let cookies = [];
    let promotions = [];
    const cart = {};
    let appliedPromo = null;

    // Detectar endpoint API base
    const API_BASE = window.location.origin.includes('localhost:8081') || window.location.protocol === 'file:'
      ? 'https://admmoney-backend.onrender.com'
      : '';

    // Cargar fecha de hoy por defecto
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('custDate').value = todayStr;
    document.getElementById('custDate').min = todayStr;

    async function init() {
      try {
        const [menuRes, promoRes] = await Promise.all([
          fetch(API_BASE + '/api/public/menu').then(r => r.json()).catch(() => []),
          fetch(API_BASE + '/api/public/promotions').then(r => r.json()).catch(() => [])
        ]);

        cookies = Array.isArray(menuRes) ? menuRes : (menuRes.cookies || []);
        promotions = Array.isArray(promoRes) ? promoRes : [];

        renderPromosBanner();
        renderMenu();
      } catch (err) {
        document.getElementById('cookiesList').innerHTML =
          '<p style="text-align:center; color:#DC2626; padding:20px;">No se pudo cargar el catálogo. Por favor recarga la página.</p>';
      }
    }

    function renderPromosBanner() {
      const banner = document.getElementById('promosBanner');
      const list = document.getElementById('promosList');
      if (!promotions || !promotions.length) {
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'block';
      list.innerHTML = promotions.map(p => {
        const badge = p.badge_text || p.name;
        return `<span class="promo-pill">${badge}</span>`;
      }).join('');
    }

    function renderMenu() {
      const container = document.getElementById('cookiesList');
      if (!cookies.length) {
        container.innerHTML = '<p style="text-align:center; padding:30px 0; color:var(--text-muted);">No hay galletas disponibles en este momento.</p>';
        return;
      }

      container.innerHTML = cookies.map(c => `
        <div class="cookie-card" id="card-${c.id}">
          <img class="cookie-img" src="${c.image_url || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=300&q=80'}" alt="${c.name}">
          <div class="cookie-info">
            <div>
              <div class="cookie-name">${c.name}</div>
              <div class="cookie-desc">${c.description || 'Deliciosa galleta artesanal horneada con mantequilla pura.'}</div>
            </div>
            <div class="cookie-bottom">
              <div class="cookie-price">$${Number(c.sale_price).toFixed(2)}</div>
              <div class="counter">
                <button type="button" onclick="updateQty(${c.id}, -1)">-</button>
                <span id="qty-${c.id}">0</span>
                <button type="button" onclick="updateQty(${c.id}, 1)">+</button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    }

    function updateQty(id, delta) {
      cart[id] = Math.max(0, (cart[id] || 0) + delta);
      const span = document.getElementById(`qty-${id}`);
      if (span) span.innerText = cart[id];

      const card = document.getElementById(`card-${id}`);
      if (card) {
        if (cart[id] > 0) card.classList.add('has-selected');
        else card.classList.remove('has-selected');
      }

      evaluateCart();
    }

    function evaluateCart() {
      let rawSubtotal = 0;
      let totalUnits = 0;

      for (const id in cart) {
        const qty = cart[id];
        if (qty > 0) {
          const cookie = cookies.find(c => c.id == id);
          if (cookie) {
            rawSubtotal += qty * Number(cookie.sale_price);
            totalUnits += qty;
          }
        }
      }

      // Evaluar promociones automáticas
      appliedPromo = null;
      let bestDiscount = 0;
      const avgPrice = totalUnits > 0 ? (rawSubtotal / totalUnits) : 0;

      if (promotions && promotions.length && totalUnits > 0) {
        for (const p of promotions) {
          const ptype = p.promo_type || 'combo_fixed_price';
          const minQ = Number(p.min_quantity || p.min_units || 1);
          const minAmt = Number(p.min_order_amount || 0);

          if (totalUnits >= minQ && rawSubtotal >= minAmt) {
            let disc = 0;
            if (ptype === 'combo_fixed_price') {
              const promoPrice = Number(p.promo_price || p.discount_value || 0);
              const bundles = minQ > 0 ? Math.floor(totalUnits / minQ) : 1;
              const normalCost = bundles * minQ * avgPrice;
              const promoCost = bundles * promoPrice;
              if (promoPrice > 0 && normalCost > promoCost) {
                disc = normalCost - promoCost;
              }
            } else if (ptype === 'percentage') {
              const pct = Number(p.discount_pct || p.discount_value || 0);
              if (pct > 0) disc = (rawSubtotal * pct) / 100.0;
            } else if (ptype === 'fixed_amount') {
              const fix = Number(p.discount_amount || p.discount_value || 0);
              if (fix > 0) disc = Math.min(rawSubtotal, fix);
            }

            if (disc > bestDiscount) {
              bestDiscount = disc;
              appliedPromo = { ...p, calculated_discount: disc };
            }
          }
        }
      }

      const finalTotal = Math.max(0, rawSubtotal - bestDiscount);

      // Actualizar UI
      document.getElementById('unitsCount').innerText = `${totalUnits} ${totalUnits === 1 ? 'galleta' : 'galletas'}`;
      document.getElementById('totalDisplay').innerText = `$${finalTotal.toFixed(2)} MXN`;

      const origEl = document.getElementById('origDisplay');
      const hintEl = document.getElementById('promoHint');
      const alertBox = document.getElementById('livePromoAlert');

      if (appliedPromo && bestDiscount > 0) {
        origEl.style.display = 'inline';
        origEl.innerText = `$${rawSubtotal.toFixed(2)}`;
        hintEl.style.display = 'block';
        hintEl.innerText = `Ahorras -$${bestDiscount.toFixed(2)} con "${appliedPromo.name}"`;

        alertBox.style.display = 'flex';
        document.getElementById('livePromoText').innerText = `Promoción activada: ${appliedPromo.name}`;
        document.getElementById('livePromoSaving').innerText = `Ahorras $${bestDiscount.toFixed(2)} MXN`;
      } else {
        origEl.style.display = 'none';
        hintEl.style.display = 'none';
        alertBox.style.display = 'none';
      }

      document.getElementById('submitBtn').disabled = totalUnits === 0;
    }

    async function submitOrder() {
      const btn = document.getElementById('submitBtn');
      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      const date = document.getElementById('custDate').value;
      const time = document.getElementById('custTime').value;
      const notes = document.getElementById('custNotes').value.trim();

      if (!name) {
        alert('Por favor escribe tu nombre y apellido.');
        document.getElementById('custName').focus();
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        alert('Por favor ingresa un teléfono de WhatsApp de 10 dígitos.');
        document.getElementById('custPhone').focus();
        return;
      }

      const items = [];
      for (const id in cart) {
        if (cart[id] > 0) {
          items.push({ product_id: Number(id), quantity: cart[id] });
        }
      }
      if (!items.length) {
        alert('Selecciona al menos una galleta para ordenar.');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const targetPhone = urlParams.get('phone') || '';

      btn.disabled = true;
      btn.innerText = 'Generando pedido...';

      try {
        const payload = {
          customer_name: name,
          customer_phone: cleanPhone,
          delivery_date: date,
          delivery_time: time,
          items: items,
          notes: notes,
          target_phone: targetPhone,
          promotion_id: appliedPromo ? appliedPromo.id : null,
          promotion_name: appliedPromo ? appliedPromo.name : null,
          discount_amount: appliedPromo ? appliedPromo.calculated_discount : 0.0
        };

        const res = await fetch(API_BASE + '/api/public/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Error al procesar el pedido.');
        }

        document.getElementById('modalFolio').innerText = data.folio;
        const waBtn = document.getElementById('modalWaBtn');
        waBtn.href = data.whatsapp_url;
        document.getElementById('modalOverlay').style.display = 'flex';

        // Redirección directa y suave a WhatsApp
        setTimeout(() => {
          window.location.href = data.whatsapp_url;
        }, 500);

      } catch (err) {
        alert(err.message || 'Ocurrió un error al procesar el pedido.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Finalizar Pedido</span> &rarr;';
      }
    }

    init();
  </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content)
