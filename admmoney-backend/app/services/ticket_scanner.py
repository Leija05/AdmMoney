import os
import re
import uuid
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Any, List
from PIL import Image, ImageEnhance, ImageFilter
from ..core.config import UPLOAD_DIR
from ..models.schemas import ReceiptScanResponse, ReceiptItem

MERCHANT_KEYWORDS = [
    "COSTCO", "WALMART", "SAMS CLUB", "SAM'S CLUB", "OXXO", "SORIANA",
    "BODEGA AURRERA", "CHEDRAUI", "LA COMER", "CITY MARKET", "FARMACIAS GUADALAJARA",
    "MATERIAS PRIMAS", "CENTRAL DE ABASTOS", "MERCADO LIBRE", "AMAZON", "SEVEN ELEVEN", "7 ELEVEN"
]

CATEGORY_RULES = {
    "Insumos Galletas": ["harina", "mantequilla", "chocolate", "chispas", "azucar", "huevo", "vainilla", "nutella", "queso", "cacao", "canela", "avena", "nuez", "polvo para hornear", "bicarbonato"],
    "Empaques y Envíos": ["bolsa", "kraft", "caja", "liston", "etiqueta", "empaque", "celofan", "rollo", "cinta"],
    "Servicios y Luz": ["gas", "cfe", "luz", "agua", "internet", "telmex", "recarga"],
    "Transporte": ["gasolina", "combustible", "uber", "didi", "estacionamiento", "peaje", "caseta"],
    "Supermercado": ["leche", "jabon", "aceite", "papel", "arroz", "pan", "fruta", "verdura"]
}

def preprocess_image(image_path: Path) -> Image.Image:
    img = Image.open(image_path)
    # Convert to grayscale and improve contrast
    img = img.convert("L")
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    img = img.filter(ImageFilter.SHARPEN)
    return img

def detect_merchant(text: str) -> str:
    upper_text = text.upper()
    for merchant in MERCHANT_KEYWORDS:
        if merchant in upper_text:
            return merchant.title()
    # Default fallback to first non-empty line
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if lines:
        first_line = lines[0]
        if len(first_line) <= 30 and not re.search(r'\d{3,}', first_line):
            return first_line.title()
    return "Comercio Local / Tienda"

def detect_date(text: str) -> str:
    # Match dates like DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    match = re.search(r'(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})', text)
    if match:
        raw_date = match.group(1).replace("-", "/")
        parts = raw_date.split("/")
        if len(parts[0]) == 4:
            return f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
        else:
            return f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
    return date.today().isoformat()

def detect_total(text: str) -> float:
    # Match patterns like TOTAL: $450.50, TOTAL 450.50, IMPORTE 1,200.00
    patterns = [
        r'(?:TOTAL|IMPORTE|A PAGAR|MONTO|PAGO)\s*[:\$]?\s*([0-9]+[,\.][0-9]{2})',
        r'(?:TOTAL|IMPORTE)\s*[:\$]?\s*([0-9,]+\.[0-9]{2})',
        r'\$\s*([0-9]+[,\.][0-9]{2})'
    ]
    amounts = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for m in matches:
            clean = m.replace(",", "")
            try:
                val = float(clean)
                if val > 0:
                    amounts.append(val)
            except ValueError:
                continue
    if amounts:
        # The total is usually the largest amount on the receipt
        return max(amounts)
    return 0.0

def detect_category(text: str, items: List[ReceiptItem]) -> str:
    combined = (text + " " + " ".join(item.name for item in items)).lower()
    for category, keywords in CATEGORY_RULES.items():
        for kw in keywords:
            if kw in combined:
                return category
    return "Supermercado"
async def scan_receipt_image(file_bytes: bytes, filename: str) -> ReceiptScanResponse:
    import base64
    import urllib.request
    import urllib.parse
    import json

    ext = Path(filename).suffix.lower() or ".jpg"
    unique_name = f"receipt_{uuid.uuid4().hex[:12]}{ext}"
    saved_path = UPLOAD_DIR / unique_name

    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    # Perform parsing with real OCR
    raw_text = ""

    # 1. Try OCR.Space free API (reliable cloud OCR for Spanish & English receipts)
    try:
        mime = "image/png" if ext == ".png" else "image/jpeg"
        b64_img = f"data:{mime};base64,{base64.b64encode(file_bytes).decode('utf-8')}"
        post_data = urllib.parse.urlencode({
            'apikey': 'K88346086088957',
            'base64Image': b64_img,
            'language': 'spa',
            'isOverlayRequired': False,
            'isTable': True
        }).encode('utf-8')

        req = urllib.request.Request('https://api.ocr.space/parse/image', data=post_data)
        req.add_header('User-Agent', 'AdmMoneyOCR/1.0')
        with urllib.request.urlopen(req, timeout=14) as resp:
            ocr_res = json.loads(resp.read().decode('utf-8'))
            if ocr_res.get('ParsedResults'):
                parsed_text = ocr_res['ParsedResults'][0].get('ParsedText', '').strip()
                if parsed_text:
                    raw_text = parsed_text
    except Exception as e:
        print(f"OCR.Space error: {e}")

    # 2. Try local pytesseract if cloud OCR was empty
    if not raw_text:
        try:
            import pytesseract
            processed = preprocess_image(saved_path)
            raw_text = pytesseract.image_to_string(processed, lang="spa+eng")
        except Exception:
            pass

    # Extract data from detected text
    merchant = detect_merchant(raw_text) if raw_text else "Ticket Registrado"
    receipt_date = detect_date(raw_text) if raw_text else date.today().isoformat()
    total_amount = detect_total(raw_text) if raw_text else 0.0

    # Extract line items
    items: List[ReceiptItem] = []
    if raw_text:
        lines = raw_text.split("\n")
        for line in lines:
            line_match = re.search(r'(\d+)?\s*([A-Za-z\s]+?)\s+\$?([0-9]+[\.,][0-9]{2})', line)
            if line_match:
                qty_str, item_name, price_str = line_match.groups()
                name_clean = item_name.strip()
                if len(name_clean) > 2 and name_clean.upper() not in ["TOTAL", "SUBTOTAL", "IVA", "CAMBIO", "EFECTIVO", "FECHA", "PAGO", "TARJETA"]:
                    try:
                        qty = float(qty_str) if qty_str else 1.0
                        price = float(price_str.replace(",", ""))
                        items.append(ReceiptItem(name=name_clean.title(), quantity=qty, price=price))
                    except ValueError:
                        continue

    category = detect_category(raw_text, items) if raw_text else "Insumos Galletas"
    subtotal = round(total_amount / 1.16, 2) if total_amount > 0 else 0.0
    tax = round(total_amount - subtotal, 2) if total_amount > 0 else 0.0

    return ReceiptScanResponse(
        merchant=merchant,
        date=receipt_date,
        total_amount=round(total_amount, 2),
        subtotal=subtotal,
        tax=tax,
        items=items,
        suggested_category=category,
        confidence=0.92 if raw_text else 0.50,
        raw_text=raw_text or "No se pudo extraer texto claro del ticket. Puedes ingresar el monto manualmente.",
    )
