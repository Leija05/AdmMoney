from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import HTMLResponse

from ...services.ticket_token_service import resolve_ticket_by_token
from ...services.pdf_service import create_order_ticket_pdf, create_sale_ticket_pdf

router = APIRouter(prefix="", tags=["Secure Tickets"])

EXPIRED_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Comprobante Expirado — Lucky Cookies</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #07080A;
      color: #F1F5F9;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      background: #151923;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 24px;
      max-width: 440px;
      width: 100%;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .cookie-badge {
      display: inline-block;
      font-size: 46px;
      margin-bottom: 8px;
    }
    .security-pill {
      display: inline-block;
      padding: 5px 14px;
      background: rgba(245, 158, 11, 0.14);
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 999px;
      color: #FBBF24;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 14px;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 10px 0;
      color: #F8FAFC;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #94A3B8;
      margin: 0 0 20px 0;
    }
    .brand-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 18px;
      margin-top: 8px;
      font-size: 12px;
      color: #64748B;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="cookie-badge">🍪🔒</div>
    <div>
      <span class="security-pill">Vigencia Segura (30 Días)</span>
    </div>
    <h1>Comprobante Temporal Expirado</h1>
    <p>
      Por políticas de privacidad y protección de datos, este enlace temporal de descarga ha caducado tras 30 días de emisión.
    </p>
    <p style="font-size: 13px; color: #CBD5E1;">
      Si requieres una copia actualizada de tu comprobante, por favor contacta directamente a <strong>Lucky Cookies</strong>.
    </p>
    <div class="brand-footer">
      Lucky Cookies Galletas y Postres • Adm Money
    </div>
  </div>
</body>
</html>
"""

@router.get("/tickets/{token}")
@router.get("/t/{token}")
def get_secure_ticket_pdf(token: str, note: Optional[str] = Query(None)):
    """
    Ruta pública segura para visualización y descarga de comprobantes en PDF.
    - Utiliza tokens criptográficos únicos e impredecibles de 24 caracteres.
    - Oculta el ID numérico interno y la estructura de la base de datos.
    - Expiración automática a los 30 días para proteger la privacidad.
    """
    ticket_type, doc, is_expired = resolve_ticket_by_token(token)

    if not ticket_type or not doc:
        raise HTTPException(status_code=404, detail="Comprobante no encontrado o enlace inválido.")

    if is_expired:
        return HTMLResponse(content=EXPIRED_HTML_TEMPLATE, status_code=410)

    filename_prefix = f"comprobante_{token[:8]}"

    if ticket_type == "order":
        pdf_bytes = create_order_ticket_pdf(doc, note=note)
        filename = f"{filename_prefix}_pedido_{doc.get('id', '')}.pdf"
    else:
        pdf_bytes = create_sale_ticket_pdf(doc, note=note)
        filename = f"{filename_prefix}_venta_{doc.get('id', '')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={filename}",
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff"
        }
    )

@router.get("/tickets/{token}/status")
def get_secure_ticket_status(token: str):
    """
    Verifica el estado de un token de comprobante sin descargar el PDF binario.
    """
    ticket_type, doc, is_expired = resolve_ticket_by_token(token)
    if not ticket_type or not doc:
        return {"exists": False, "valid": False, "expired": False}

    return {
        "exists": True,
        "valid": not is_expired,
        "expired": is_expired,
        "type": ticket_type,
        "customer_name": doc.get("customer_name"),
        "date": doc.get("created_at") or doc.get("order_date") or doc.get("sale_date")
    }
