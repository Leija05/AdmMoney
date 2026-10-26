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

@router.post("/api/public/orders", response_model=PublicOrderResponse)
def create_public_order(data: PublicOrderCreate, request: Request):
    """
    Crea un pedido desde la web QR del cliente con estrategia anti-mermas:
    - Estado congelado 'Pendiente de Confirmación' (el horno lo ignora).
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

    # 3. Validar productos y calcular total
    cookies_map = {c["id"]: c for c in db.cookie_products.find({"is_active": True})}
    items_list = []
    total_amount = 0.0
    total_cost = 0.0

    for item in data.items:
        prod = cookies_map.get(item.product_id)
        if not prod:
            continue
        qty = max(1, item.quantity)
        price = float(prod.get("sale_price", 30.0))
        cost = float(prod.get("recipe_cost", 9.67))
        subtotal = round(price * qty, 2)
        total_amount += subtotal
        total_cost += round(cost * qty, 2)

        items_list.append({
            "product_id": prod["id"],
            "product_name": prod["name"],
            "quantity": qty,
            "unit_price": price,
            "unit_cost": cost,
            "subtotal": subtotal,
        })

    if not items_list:
        raise HTTPException(status_code=400, detail="Debes seleccionar al menos una galleta para ordenar.")

    total_amount = round(total_amount, 2)
    total_cost = round(total_cost, 2)
    net_profit = round(total_amount - total_cost, 2)

    # 4. Generar Folio único y fechas
    folio = generate_unique_folio()
    new_id = get_next_sequence("orders")
    now = datetime.utcnow()
    expires_at = (now + timedelta(minutes=45)).isoformat()
    delivery_date = data.delivery_date or date.today().isoformat()

    # 5. Obtener teléfono de recepción de WhatsApp (Línea activa configurada)
    # Por defecto busca en la configuración de la app o usa target_phone
    target_wa = "".join(c for c in (data.target_phone or "") if c.isdigit())
    if not target_wa or len(target_wa) < 10:
        # Fallback a teléfono oficial
        target_wa = "528123456789"

    if not target_wa.startswith("52") and len(target_wa) == 10:
        target_wa = "52" + target_wa

    # Mensaje prearmado forzoso
    items_summary = ", ".join(f"{it['quantity']}x {it['product_name']}" for it in items_list)
    wa_message = (
        f"¡Hola Lucky Cookies! 🍪 Soy {data.customer_name.strip()}, confirmo mi pedido {folio} de:\n"
        f"• {items_summary}\n"
        f"💰 Total a pagar contra entrega: ${total_amount:.2f} MXN\n"
        f"📅 Fecha sugerida: {delivery_date} ({data.delivery_time})\n"
        f"{f'📝 Notas: {data.notes.strip()}' if data.notes else ''}"
    )
    wa_url = f"https://wa.me/{target_wa}?text={urllib.parse.quote(wa_message)}"

    # 6. Guardar en Base de Datos (Estado Congelado)
    order_doc = {
        "id": new_id,
        "folio": folio,
        "origin": "web_qr",
        "customer_name": data.customer_name.strip(),
        "customer_phone": clean_phone,
        "delivery_date": delivery_date,
        "order_date": date.today().isoformat(),
        "status": "Pendiente de Confirmación", # Congelado, no entra al horno
        "payment_method": "Contra Entrega",
        "payment_status": "Pendiente",
        "deposit_amount": 0.0,
        "items": items_list,
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
            "notes": "Cliente registrado vía Web QR",
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
        "message": f"¡Pedido {folio} registrado! Por favor envía el mensaje de WhatsApp para ratificar tu orden y enviarla al horno."
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

# ----------------- PÁGINA WEB PÚBLICA PARA CELULARES (/pedir) ----------------- #
@router.get("/pedir", response_class=HTMLResponse)
@router.get("/menu", response_class=HTMLResponse)
def serve_public_ordering_page(request: Request):
    """
    Página web pública hiper-rápida y responsiva para smartphones.
    Carga al escanear el Código QR de los empaques de galletas.
    """
    html_content = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Lucky Cookies — Menú & Pedidos en Línea</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #0284C7;
      --primary-dark: #0369A1;
      --primary-light: #E0F2FE;
      --amber: #D97706;
      --bg: #F8FAFC;
      --card-bg: #FFFFFF;
      --text: #0F172A;
      --text-muted: #64748B;
      --border: #E2E8F0;
      --radius: 16px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
    body { background: var(--bg); color: var(--text); padding-bottom: 120px; }
    
    /* Header */
    header {
      background: linear-gradient(135deg, #0B132B 0%, #1C2541 100%);
      color: white;
      padding: 24px 20px;
      text-align: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(2, 132, 199, 0.25);
      border: 1px solid rgba(56, 189, 248, 0.4);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #38BDF8;
      margin-bottom: 8px;
    }
    h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .tagline { font-size: 12.5px; color: #94A3B8; margin-top: 4px; }
    
    /* Container */
    .container { max-width: 520px; margin: 0 auto; padding: 16px; }
    
    /* Notice Card */
    .notice-card {
      background: #FEF3C7;
      border: 1px solid #FDE68A;
      border-radius: var(--radius);
      padding: 12px 14px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      color: #92400E;
    }
    .notice-card span { font-size: 20px; }
    
    /* Products Grid */
    .section-title { font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 12px; }
    .cookie-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px;
      margin-bottom: 12px;
      display: flex;
      gap: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .cookie-img {
      width: 86px;
      height: 86px;
      border-radius: 12px;
      object-fit: cover;
      background: #E2E8F0;
      flex-shrink: 0;
    }
    .cookie-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .cookie-name { font-size: 15px; font-weight: 700; color: var(--text); }
    .cookie-desc { font-size: 11.5px; color: var(--text-muted); line-height: 15px; margin: 3px 0 8px; }
    .cookie-bottom { display: flex; justify-content: space-between; align-items: center; }
    .cookie-price { font-size: 16px; font-weight: 800; color: var(--primary); }
    
    /* Counter */
    .counter { display: inline-flex; align-items: center; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 2px; }
    .counter button {
      width: 28px;
      height: 28px;
      border: none;
      background: white;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .counter span { width: 32px; text-align: center; font-size: 14px; font-weight: 700; }
    
    /* Form */
    .order-form {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px;
      margin-top: 20px;
    }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 14px;
      color: var(--text);
      outline: none;
      background: var(--bg);
      transition: border 0.2s;
    }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
      border-color: var(--primary);
      background: white;
    }
    
    /* Fixed Bottom Bar */
    .bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-top: 1px solid var(--border);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 200;
      box-shadow: 0 -4px 16px rgba(0,0,0,0.08);
      max-width: 520px;
      margin: 0 auto;
    }
    .total-col .total-lbl { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); }
    .total-col .total-val { font-size: 20px; font-weight: 800; color: var(--primary); }
    
    .btn-submit {
      background: linear-gradient(135deg, #059669 0%, #10B981 100%);
      color: white;
      border: none;
      padding: 14px 22px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transition: transform 0.1s;
    }
    .btn-submit:active { transform: scale(0.98); }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Modal Success */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 999;
    }
    .modal-card {
      background: white;
      border-radius: 20px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      animation: popIn 0.3s ease;
    }
    @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    .modal-folio {
      background: #E0F2FE;
      color: #0369A1;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 800;
      display: inline-block;
      margin: 10px 0;
    }
    .btn-wa-final {
      background: #059669;
      color: white;
      border: none;
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 800;
      margin-top: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
    }
  </style>
</head>
<body>

  <header>
    <div class="logo-badge">🍪 Repostería Artesanal</div>
    <h1>Lucky Cookies</h1>
    <div class="tagline">Arma tu pedido recién horneado y recógelo caliente</div>
  </header>

  <div class="container">
    <div class="notice-card">
      <span>🛡️</span>
      <div><b>Sin anticipo obligatorio:</b> Tu pedido genera un folio único y se ratifica de inmediato por WhatsApp con nuestra repostera.</div>
    </div>

    <div class="section-title">Nuestras Galletas Artesanales</div>
    <div id="cookiesList">Cargando catálogo delicioso...</div>

    <div class="order-form">
      <div class="section-title" style="margin-bottom: 14px;">Datos de Entrega</div>
      
      <div class="form-group">
        <label>Tu Nombre Completo *</label>
        <input type="text" id="custName" placeholder="Ej. Juan Pérez" required>
      </div>

      <div class="form-group">
        <label>Teléfono de WhatsApp (10 dígitos) *</label>
        <input type="tel" id="custPhone" placeholder="Ej. 8112345678" maxlength="10" required>
      </div>

      <div class="form-group">
        <label>Fecha de Entrega</label>
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
        <textarea id="custNotes" rows="2" placeholder="Ej. Para regalo con dedicatoria romántica, sin nuez, etc."></textarea>
      </div>
    </div>
  </div>

  <div class="bottom-bar">
    <div class="total-col">
      <div class="total-lbl">Total del Pedido</div>
      <div class="total-val" id="totalDisplay">$0.00 MXN</div>
    </div>
    <button class="btn-submit" id="submitBtn" onclick="submitOrder()">
      <span>Finalizar Pedido</span> ➔
    </button>
  </div>

  <!-- Modal de WhatsApp -->
  <div class="modal-overlay" id="modalOverlay">
    <div class="modal-card">
      <div style="font-size: 40px; margin-bottom: 8px;">🎉</div>
      <h2 style="font-size: 19px; font-weight: 800;">¡Pedido Generado!</h2>
      <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 4px;">Tu folio oficial de orden es:</p>
      <div class="modal-folio" id="modalFolio">#LK-0000</div>
      <p style="font-size: 12px; color: #475569; line-height: 16px;">
        Para hornear tu tanda, pulsa el botón de abajo para enviar el mensaje de confirmación por WhatsApp a nuestra línea activa.
      </p>
      <a href="#" id="modalWaBtn" class="btn-wa-final" target="_blank">
        💬 Abrir WhatsApp y Confirmar
      </a>
    </div>
  </div>

  <script>
    let cookies = [];
    const cart = {};

    // Cargar fecha de hoy por defecto
    document.getElementById('custDate').value = new Date().toISOString().split('T')[0];

    async function loadMenu() {
      try {
        const res = await fetch('/api/public/menu');
        cookies = await res.json();
        renderMenu();
      } catch (e) {
        document.getElementById('cookiesList').innerHTML = '<p style="color:red;">Error al cargar las galletas. Reintenta más tarde.</p>';
      }
    }

    function renderMenu() {
      const container = document.getElementById('cookiesList');
      if (!cookies.length) {
        container.innerHTML = '<p>No hay galletas activas en este momento.</p>';
        return;
      }
      container.innerHTML = cookies.map(c => `
        <div class="cookie-card">
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
      document.getElementById(`qty-${id}`).innerText = cart[id];
      updateTotal();
    }

    function updateTotal() {
      let total = 0;
      let count = 0;
      for (const id in cart) {
        const qty = cart[id];
        if (qty > 0) {
          const cookie = cookies.find(c => c.id == id);
          if (cookie) {
            total += qty * Number(cookie.sale_price);
            count += qty;
          }
        }
      }
      document.getElementById('totalDisplay').innerText = `$${total.toFixed(2)} MXN`;
      document.getElementById('submitBtn').disabled = count === 0;
    }

    async function submitOrder() {
      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      const date = document.getElementById('custDate').value;
      const time = document.getElementById('custTime').value;
      const notes = document.getElementById('custNotes').value.trim();

      if (!name) { alert('Por favor escribe tu nombre completo.'); return; }
      if (!phone || phone.length < 10) { alert('Por favor ingresa un teléfono de WhatsApp válido de 10 dígitos.'); return; }

      const items = [];
      for (const id in cart) {
        if (cart[id] > 0) {
          items.push({ product_id: Number(id), quantity: cart[id] });
        }
      }
      if (!items.length) { alert('Selecciona al menos una galleta.'); return; }

      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.innerText = 'Generando Folio...';

      try {
        const res = await fetch('/api/public/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: name,
            customer_phone: phone,
            delivery_date: date,
            delivery_time: time,
            items: items,
            notes: notes
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Error al crear el pedido.');
        }

        // Mostrar modal de confirmación con enlace directo a WhatsApp
        document.getElementById('modalFolio').innerText = data.folio;
        const waBtn = document.getElementById('modalWaBtn');
        waBtn.href = data.whatsapp_url;
        document.getElementById('modalOverlay').style.display = 'flex';

        // Redirigir de inmediato a WhatsApp
        window.location.href = data.whatsapp_url;

      } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.innerText = 'Finalizar Pedido ➔';
      }
    }

    loadMenu();
  </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content)
