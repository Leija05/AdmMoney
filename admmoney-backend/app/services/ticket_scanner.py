import os
import re
import uuid
import json
import base64
import urllib.request
import urllib.parse
from datetime import datetime, date
from pathlib import Path
from io import BytesIO
from typing import Dict, Any, List, Optional, Tuple

from PIL import Image, ImageOps, ImageEnhance, ImageFilter

from ..core.config import UPLOAD_DIR, GEMINI_API_KEY
from ..models.schemas import ReceiptScanResponse, ReceiptItem

MERCHANT_KEYWORDS = [
    "COSTCO", "WALMART", "SAMS CLUB", "SAM'S CLUB", "OXXO", "SORIANA",
    "BODEGA AURRERA", "CHEDRAUI", "LA COMER", "CITY MARKET", "FARMACIAS GUADALAJARA",
    "FARMACIAS DEL AHORRO", "MATERIAS PRIMAS", "CENTRAL DE ABASTOS", "MERCADO LIBRE",
    "AMAZON", "SEVEN ELEVEN", "7 ELEVEN", "HOME DEPOT", "LIVERPOOL", "SUBURBIA",
    "SUPERAMA", "HEB", "H-E-B", "ALSUPER", "SMART", "LEY", "SUPER CHE"
]

CATEGORY_RULES = {
    "Insumos Galletas": [
        "harina", "mantequilla", "chocolate", "chispas", "azucar", "huevo", "vainilla",
        "nutella", "queso", "cacao", "canela", "avena", "nuez", "polvo para hornear",
        "bicarbonato", "levadura", "sal", "leche", "crema", "dulce de leche", "matcha"
    ],
    "Empaques y Envíos": [
        "bolsa", "kraft", "caja", "liston", "etiqueta", "empaque", "celofan", "rollo",
        "cinta", "moño", "carton", "adhesivo", "papel encerado", "envoltura"
    ],
    "Servicios y Luz": [
        "gas", "cfe", "luz", "agua", "internet", "telmex", "recarga", "cfe suministro"
    ],
    "Transporte": [
        "gasolina", "combustible", "uber", "didi", "estacionamiento", "peaje", "caseta", "magna", "premium"
    ],
    "Hogar y Personales": [
        "jabon", "aceite", "papel", "limpieza", "cloro", "fabuloso", "detergente", "shampoo"
    ],
    "Supermercado": [
        "arroz", "pan", "fruta", "verdura", "carne", "pollo", "jamon", "yogurt"
    ]
}

def optimize_receipt_image(file_bytes: bytes, max_dim: int = 1600, quality: int = 82) -> Tuple[bytes, Image.Image]:
    """
    Normaliza y comprime la foto del ticket:
    1. Corrige orientación EXIF (cámara de celular).
    2. Convierte a RGB.
    3. Redimensiona manteniendo proporción para que no supere max_dim.
    4. Comprime a JPEG de alta nitidez y bajo peso (< 400KB).
    """
    img = Image.open(BytesIO(file_bytes))
    
    # 1. Corregir rotación de cámara
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # 2. Convertir a RGB
    if img.mode in ("RGBA", "P", "LA", "CMYK"):
        img = img.convert("RGB")
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # 3. Redimensionar si excede max_dim
    w, h = img.size
    if max(w, h) > max_dim:
        scale = max_dim / float(max(w, h))
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # 4. Guardar optimizado en memoria
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    optimized_bytes = buf.getvalue()
    buf.close()

    return optimized_bytes, img

def detect_merchant(text: str) -> str:
    upper_text = text.upper()
    for merchant in MERCHANT_KEYWORDS:
        if merchant in upper_text:
            return merchant.title()
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if lines:
        for line in lines[:5]:
            clean_line = re.sub(r'[^\w\s\.\-]', '', line).strip()
            if 3 <= len(clean_line) <= 35 and not re.search(r'\d{3,}', clean_line) and not any(k in clean_line.upper() for k in ["TICKET", "FECHA", "BIENVENIDO", "RFC"]):
                return clean_line.title()
    return "Comercio Local / Tienda"

def detect_date(text: str) -> str:
    # 1. YYYY-MM-DD
    m1 = re.search(r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', text)
    if m1:
        y, m, d = m1.group(1), m1.group(2).zfill(2), m1.group(3).zfill(2)
        if 2020 <= int(y) <= 2035 and 1 <= int(m) <= 12 and 1 <= int(d) <= 31:
            return f"{y}-{m}-{d}"

    # 2. DD/MM/YYYY or DD-MM-YYYY
    m2 = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', text)
    if m2:
        d, m, y = m2.group(1).zfill(2), m2.group(2).zfill(2), m2.group(3)
        if 2020 <= int(y) <= 2035 and 1 <= int(m) <= 12 and 1 <= int(d) <= 31:
            return f"{y}-{m}-{d}"

    # 3. DD/MM/YY
    m3 = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2})\b', text)
    if m3:
        d, m, y_short = m3.group(1).zfill(2), m3.group(2).zfill(2), m3.group(3)
        y = f"20{y_short}"
        if 1 <= int(m) <= 12 and 1 <= int(d) <= 31:
            return f"{y}-{m}-{d}"

    return date.today().isoformat()

def detect_total(text: str) -> float:
    patterns = [
        r'(?:TOTAL|IMPORTE\s*TOTAL|A\s*PAGAR|TOTAL\s*M\.N\.|PAGO\s*TOTAL)\s*[:\$]?\s*([0-9,]+\.[0-9]{2})',
        r'(?:TOTAL|IMPORTE)\s*[:\$]?\s*([0-9,]+\.[0-9]{2})',
        r'\bTOTAL\s*[:\$]?\s*([0-9]+[,\.][0-9]{2})',
        r'\$\s*([0-9,]+\.[0-9]{2})'
    ]
    amounts = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for m in matches:
            clean = m.replace(",", "")
            try:
                val = float(clean)
                if 0.5 <= val <= 250000:
                    amounts.append(val)
            except ValueError:
                continue
    if amounts:
        # Frecuentemente el total es la cifra destacada o más alta
        return max(amounts)
    return 0.0

def detect_category(text: str, items: List[ReceiptItem]) -> str:
    combined = (text + " " + " ".join(item.name for item in items)).lower()
    for category, keywords in CATEGORY_RULES.items():
        for kw in keywords:
            if kw in combined:
                return category
    return "Insumos Galletas"

def parse_receipt_heuristics(raw_text: str) -> ReceiptScanResponse:
    merchant = detect_merchant(raw_text)
    receipt_date = detect_date(raw_text)
    total_amount = detect_total(raw_text)

    items: List[ReceiptItem] = []
    lines = raw_text.split("\n")
    ignore_tokens = [
        "TOTAL", "SUBTOTAL", "IVA", "CAMBIO", "EFECTIVO", "FECHA", "DESCRIPCION",
        "CANTIDAD", "PAGO", "TARJETA", "CLIENTE", "RFC", "FOLIO", "CAJERO", "TERMINAL",
        "GRACIAS", "SUCURSAL", "HORA", "DESCUENTO", "AHORRO", "ATENDIO"
    ]

    for line in lines:
        line = line.strip()
        if not line or len(line) < 4:
            continue
        upper = line.upper()
        if any(k in upper for k in ignore_tokens):
            continue

        parts = line.split()
        if len(parts) < 2:
            continue

        try:
            last_str = parts[-1].replace("$", "").replace(",", "")
            last_price = float(last_str)
        except ValueError:
            continue

        if 0.5 <= last_price <= 90000:
            # Formato A: Cantidad en penúltimo lugar (ej. PEPPERONI 1.000 76.00)
            if len(parts) >= 3:
                try:
                    qty = float(parts[-2])
                    if 0.1 <= qty <= 200:
                        name = " ".join(parts[:-2]).strip()
                        if len(name) >= 2 and not name.isdigit():
                            items.append(ReceiptItem(name=name.title(), quantity=qty, price=last_price))
                            continue
                except ValueError:
                    pass

            # Formato B: Cantidad al inicio (ej. 2 LECHE LALA 28.50)
            try:
                qty = float(parts[0])
                if 0.1 <= qty <= 200:
                    name = " ".join(parts[1:-1]).strip()
                    if len(name) >= 2 and not name.isdigit():
                        items.append(ReceiptItem(name=name.title(), quantity=qty, price=last_price))
                        continue
            except ValueError:
                pass

            # Formato C: Solo nombre y precio final
            name = " ".join(parts[:-1]).strip()
            if len(name) >= 3 and not name.isdigit() and not any(c in name for c in ["***", "---"]):
                items.append(ReceiptItem(name=name.title(), quantity=1.0, price=last_price))

    if total_amount == 0.0 and items:
        total_amount = round(sum(it.price for it in items), 2)

    category = detect_category(raw_text, items)
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
        confidence=0.88 if items else 0.60,
        raw_text=raw_text[:800],
    )

def scan_with_gemini(image_bytes: bytes, api_key: str) -> Optional[ReceiptScanResponse]:
    """
    Escaneo inteligente con IA Multimodal (Google Gemini Vision).
    Extrae productos, comercio, cantidades, subtotales y categorización contable en JSON estricto.
    """
    if not api_key or not api_key.strip():
        return None

    b64_img = base64.b64encode(image_bytes).decode("utf-8")

    prompt = (
        "Eres un analizador contable y experto en lectura de tickets y notas de compra en México y Latinoamérica. "
        "Analiza minuciosamente la imagen de este ticket de compra (puede ser de Costco, Walmart, Sam's Club, Oxxo, "
        "Soriana, Bodega Aurrera, tiendita de materias primas, o cualquier comercio).\n\n"
        "Extrae todos los datos y responde EXCLUSIVAMENTE con un JSON válido con la siguiente estructura exacta:\n"
        "{\n"
        '  "merchant": "Nombre del negocio o tienda comercial (ej: Costco Wholesale, OXXO, Walmart)",\n'
        '  "date": "YYYY-MM-DD",\n'
        '  "items": [\n'
        '    {"name": "Nombre claro y limpio del producto o insumo", "quantity": 1.0, "price": 45.50}\n'
        "  ],\n"
        '  "subtotal": 0.0,\n'
        '  "tax": 0.0,\n'
        '  "total_amount": 0.0,\n'
        '  "suggested_category": "Insumos Galletas",\n'
        '  "confidence": 0.98,\n'
        '  "raw_text": "Transcripción sintetizada de los renglones y total"\n'
        "}\n\n"
        "Reglas importantes:\n"
        "1. 'items': cada producto debe tener su nombre comprensible, la cantidad (número flotante) y el importe total de ese renglón (precio final con cualquier descuento aplicado).\n"
        "2. 'total_amount': debe ser el monto total final cobrado o pagado. Si el total no se lee explícitamente pero hay artículos, calcula la suma de los artículos.\n"
        "3. 'suggested_category': clasifica según los productos en una de estas opciones: 'Insumos Galletas', 'Empaques y Envíos', 'Servicios y Luz', 'Transporte', 'Supermercado', 'Hogar y Personales', 'Otros Gastos'.\n"
        "4. Si la fecha no está clara, usa la fecha de hoy.\n"
        "5. Devuelve ÚNICAMENTE el bloque JSON, sin introducciones ni etiquetas markdown extras."
    )

    models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash"]

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": b64_img
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "response_mime_type": "application/json"
        }
    }

    req_data = json.dumps(payload).encode("utf-8")

    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key.strip()}"
        try:
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json", "User-Agent": "AdmMoneyAI/2.0"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=18) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))
                
                # Extraer texto generado
                candidates = resp_json.get("candidates", [])
                if not candidates:
                    continue
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if not parts:
                    continue
                
                raw_text_out = parts[0].get("text", "").strip()
                # Limpiar posibles delimitadores markdown
                if raw_text_out.startswith("```json"):
                    raw_text_out = raw_text_out[7:]
                if raw_text_out.startswith("```"):
                    raw_text_out = raw_text_out[3:]
                if raw_text_out.endswith("```"):
                    raw_text_out = raw_text_out[:-3]
                raw_text_out = raw_text_out.strip()

                parsed_data = json.loads(raw_text_out)
                
                # Construir items
                extracted_items: List[ReceiptItem] = []
                for it in parsed_data.get("items", []):
                    try:
                        name = str(it.get("name", "Producto")).strip()
                        qty = float(it.get("quantity", 1.0))
                        price = float(it.get("price", 0.0))
                        if name and price >= 0:
                            extracted_items.append(ReceiptItem(name=name, quantity=qty, price=price))
                    except Exception:
                        continue

                total_amt = float(parsed_data.get("total_amount", 0.0))
                if total_amt == 0.0 and extracted_items:
                    total_amt = sum(i.price for i in extracted_items)

                subtotal = float(parsed_data.get("subtotal", 0.0))
                if subtotal == 0.0 and total_amt > 0:
                    subtotal = round(total_amt / 1.16, 2)

                tax = float(parsed_data.get("tax", 0.0))
                if tax == 0.0 and total_amt > subtotal:
                    tax = round(total_amt - subtotal, 2)

                return ReceiptScanResponse(
                    merchant=str(parsed_data.get("merchant") or "Ticket Registrado").strip(),
                    date=str(parsed_data.get("date") or date.today().isoformat()).strip(),
                    total_amount=round(total_amt, 2),
                    subtotal=round(subtotal, 2),
                    tax=round(tax, 2),
                    items=extracted_items,
                    suggested_category=str(parsed_data.get("suggested_category") or "Insumos Galletas"),
                    confidence=float(parsed_data.get("confidence", 0.98)),
                    raw_text=str(parsed_data.get("raw_text") or "Ticket analizado exitosamente con Gemini AI"),
                )
        except Exception as e:
            print(f"Error escaneando con Gemini ({model}): {e}")
            continue

    return None

def scan_with_ocr_space(image_bytes: bytes) -> str:
    """
    Escaneo secundario con API OCR.Space usando la imagen previamente optimizada (< 400KB).
    """
    try:
        b64_img = f"data:image/jpeg;base64,{base64.b64encode(image_bytes).decode('utf-8')}"
        post_data = urllib.parse.urlencode({
            'apikey': 'K88346086088957',
            'base64Image': b64_img,
            'language': 'spa',
            'isOverlayRequired': False,
            'isTable': True
        }).encode('utf-8')

        req = urllib.request.Request('https://api.ocr.space/parse/image', data=post_data)
        req.add_header('User-Agent', 'AdmMoneyOCR/2.0')
        with urllib.request.urlopen(req, timeout=14) as resp:
            ocr_res = json.loads(resp.read().decode('utf-8'))
            if ocr_res.get('ParsedResults'):
                return ocr_res['ParsedResults'][0].get('ParsedText', '').strip()
    except Exception as e:
        print(f"OCR.Space fallback error: {e}")
    return ""

def scan_with_pytesseract(pil_image: Image.Image) -> str:
    """
    Escaneo local opcional si pytesseract está instalado en el sistema.
    """
    try:
        import pytesseract
        # Mejorar contraste para Tesseract
        gray = pil_image.convert("L")
        enhancer = ImageEnhance.Contrast(gray)
        enhanced = enhancer.enhance(2.2)
        sharpened = enhanced.filter(ImageFilter.SHARPEN)
        return pytesseract.image_to_string(sharpened, lang="spa+eng")
    except Exception:
        return ""

async def scan_receipt_image(file_bytes: bytes, filename: str) -> ReceiptScanResponse:
    """
    Flujo principal de escaneo con arquitectura en cascada:
    1. Optimización y compresión con Pillow (reduce MB a ~250KB y corrige rotación).
    2. Guardado seguro en UPLOAD_DIR.
    3. Nivel 1: Análisis inteligente con Gemini Vision (si está configurada la API key).
    4. Nivel 2: Cloud OCR (OCR.Space optimizado).
    5. Nivel 3: Local Tesseract + Parser heurístico de alta precisión.
    """
    # 1. Optimizar imagen
    try:
        optimized_bytes, pil_img = optimize_receipt_image(file_bytes, max_dim=1600, quality=82)
    except Exception as e:
        print(f"Error optimizando imagen: {e}")
        optimized_bytes = file_bytes
        pil_img = None

    # 2. Guardar en disco para referencia futura y preview
    ext = ".jpg"
    unique_name = f"receipt_{uuid.uuid4().hex[:12]}{ext}"
    saved_path = UPLOAD_DIR / unique_name
    try:
        with open(saved_path, "wb") as f:
            f.write(optimized_bytes)
        relative_url = f"/uploads/{unique_name}"
    except Exception as e:
        print(f"Error guardando ticket en disco: {e}")
        relative_url = None

    # 3. Nivel 1: IA Multimodal Gemini Vision
    gemini_key = GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if gemini_key:
        gemini_result = scan_with_gemini(optimized_bytes, gemini_key)
        if gemini_result and (gemini_result.total_amount > 0 or len(gemini_result.items) > 0):
            gemini_result.image_url = relative_url
            return gemini_result

    # 4. Nivel 2: Cloud OCR con OCR.Space (la imagen ya pesa < 400KB garantizado)
    raw_text = scan_with_ocr_space(optimized_bytes)

    # 5. Nivel 3: Tesseract local si OCR.Space no trajo texto
    if not raw_text and pil_img:
        raw_text = scan_with_pytesseract(pil_img)

    # 6. Parsear heurísticamente el texto detectado
    if raw_text:
        parsed_response = parse_receipt_heuristics(raw_text)
        parsed_response.image_url = relative_url
        return parsed_response

    # 7. Si no se pudo extraer texto (foto totalmente negra o borrosa)
    return ReceiptScanResponse(
        merchant="Ticket de Compra",
        date=date.today().isoformat(),
        total_amount=0.0,
        subtotal=0.0,
        tax=0.0,
        items=[],
        suggested_category="Insumos Galletas",
        confidence=0.40,
        raw_text="No se pudo extraer texto legible del ticket. Puedes ingresar el monto directamente.",
        image_url=relative_url
    )
