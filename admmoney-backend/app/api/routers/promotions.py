from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from ...core.database import get_db, get_next_sequence
from ...models.schemas import (
    PromotionCreate,
    PromotionUpdate,
    PromotionResponse,
    PromoCalculationRequest,
    PromoCalculationResponse
)

router = APIRouter(prefix="/api/promotions", tags=["Promociones"])

def normalize_promo_doc(promo: dict) -> dict:
    if not promo:
        return promo

    # Harmonize min units / quantity
    min_units = promo.get("min_quantity") or promo.get("min_units") or 1
    promo["min_quantity"] = int(min_units)
    promo["min_units"] = int(min_units)

    # Harmonize discount value / promo price / amount / pct
    val = None
    for field in ("discount_value", "promo_price", "discount_amount", "discount_pct"):
        if promo.get(field) is not None:
            try:
                val = float(promo[field])
                break
            except Exception:
                pass
    if val is None:
        name_lower = str(promo.get("name", "")).lower()
        if "90" in name_lower:
            val = 90.0
        elif "30" in name_lower:
            val = 30.0
        elif "15" in name_lower:
            val = 15.0
        else:
            val = 0.0

    promo["discount_value"] = val
    if promo.get("promo_price") is None:
        promo["promo_price"] = val
    if promo.get("discount_amount") is None:
        promo["discount_amount"] = val
    if promo.get("discount_pct") is None:
        promo["discount_pct"] = val

    # Harmonize target_type / scope
    target_type = promo.get("target_type") or promo.get("scope") or "all_products"
    promo["target_type"] = target_type
    promo["scope"] = target_type

    # Harmonize product ids
    prods = promo.get("target_product_ids") or promo.get("applicable_product_ids") or []
    promo["target_product_ids"] = prods
    promo["applicable_product_ids"] = prods

    # Harmonize badge_text
    if not promo.get("badge_text"):
        name_str = str(promo.get("name", ""))
        if "3 x $90" in name_str or "90" in name_str:
            promo["badge_text"] = "3 x $90"
        elif "15%" in name_str:
            promo["badge_text"] = "15% OFF"
        elif "30" in name_str:
            promo["badge_text"] = "-$30 MXN"
        elif "2x1" in name_str:
            promo["badge_text"] = "2x1"
        else:
            promo["badge_text"] = "PROMO"

    # Color tag
    if not promo.get("color_tag"):
        promo["color_tag"] = "#F59E0B"

    return promo

@router.get("", response_model=List[PromotionResponse])
def get_promotions(active_only: bool = False):
    """
    Obtiene todas las promociones configuradas.
    Permite filtrar por activas para el menú de ventas y pedidos.
    """
    db = get_db()
    query = {"is_active": True} if active_only else {}
    cursor = db.promotions.find(query, {"_id": 0}).sort("id", -1)
    return [normalize_promo_doc(doc) for doc in cursor]

@router.get("/{promo_id}", response_model=PromotionResponse)
def get_promotion(promo_id: int):
    db = get_db()
    promo = db.promotions.find_one({"id": promo_id}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=404, detail="Promoción no encontrada")
    return normalize_promo_doc(promo)

@router.post("", response_model=PromotionResponse, status_code=201)
def create_promotion(data: PromotionCreate):
    """
    Crea una nueva promoción con alcance y reglas personalizadas por el usuario.
    """
    db = get_db()
    promo_id = get_next_sequence("promotions")
    now_str = datetime.utcnow().isoformat()
    
    doc = data.model_dump()
    normalize_promo_doc(doc)
    doc["id"] = promo_id
    doc["created_at"] = now_str
    
    db.promotions.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.put("/{promo_id}", response_model=PromotionResponse)
def update_promotion(promo_id: int, data: PromotionUpdate):
    """
    Actualiza los valores, alcance o vigencia de una promoción.
    """
    db = get_db()
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="No se enviaron datos para actualizar")
    
    normalize_promo_doc(update_data)
    try:
        int_id = int(promo_id)
    except Exception:
        int_id = promo_id
    res = db.promotions.update_one({"$or": [{"id": int_id}, {"id": str(promo_id)}]}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Promoción no encontrada")
    
    updated = db.promotions.find_one({"$or": [{"id": int_id}, {"id": str(promo_id)}]}, {"_id": 0})
    return normalize_promo_doc(updated)

@router.patch("/{promo_id}/toggle", response_model=PromotionResponse)
def toggle_promotion_status(promo_id: int):
    """
    Activa o desactiva rápidamente una promoción (Switch on/off).
    """
    db = get_db()
    try:
        int_id = int(promo_id)
    except Exception:
        int_id = promo_id
    promo = db.promotions.find_one({"$or": [{"id": int_id}, {"id": str(promo_id)}]})
    if not promo:
        raise HTTPException(status_code=404, detail="Promoción no encontrada")
    
    new_status = not promo.get("is_active", True)
    db.promotions.update_one({"$or": [{"id": int_id}, {"id": str(promo_id)}]}, {"$set": {"is_active": new_status}})
    
    updated = db.promotions.find_one({"$or": [{"id": int_id}, {"id": str(promo_id)}]}, {"_id": 0})
    return normalize_promo_doc(updated)

@router.delete("/{promo_id}")
def delete_promotion(promo_id: int):
    """
    Elimina una promoción del catálogo.
    """
    db = get_db()
    try:
        int_id = int(promo_id)
    except Exception:
        int_id = promo_id
    res = db.promotions.delete_one({"$or": [{"id": int_id}, {"id": str(promo_id)}]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promoción no encontrada")
    return {"message": "Promoción eliminada correctamente", "id": promo_id}

@router.post("/calculate", response_model=PromoCalculationResponse)
def calculate_promotion(request: PromoCalculationRequest):
    """
    Calcula el impacto financiero y descuento exacto de una promoción dada
    una lista de galletas/productos y cantidades.
    """
    db = get_db()
    
    # Calcular subtotal base
    original_subtotal = sum(it.quantity * it.unit_price for it in request.items)
    total_units = sum(it.quantity for it in request.items)
    
    if not request.promotion_id:
        return PromoCalculationResponse(
            promotion_applied=None,
            original_subtotal=original_subtotal,
            discount_total=0.0,
            final_total=original_subtotal,
            message="Sin promoción aplicada",
            items_breakdown=[{"product_id": it.product_id, "discount": 0.0} for it in request.items]
        )
    
    promo = db.promotions.find_one({"id": request.promotion_id, "is_active": True}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=404, detail="Promoción no encontrada o inactiva")
    
    # Evaluar condiciones mínimas
    min_units = promo.get("min_quantity") or promo.get("min_units") or 1
    min_order_amount = promo.get("min_order_amount") or 0.0
    
    if total_units < min_units:
        return PromoCalculationResponse(
            promotion_applied=PromotionResponse(**promo),
            original_subtotal=original_subtotal,
            discount_total=0.0,
            final_total=original_subtotal,
            message=f"Requiere al menos {min_units} piezas (tienes {total_units})"
        )
    
    if original_subtotal < min_order_amount:
        return PromoCalculationResponse(
            promotion_applied=PromotionResponse(**promo),
            original_subtotal=original_subtotal,
            discount_total=0.0,
            final_total=original_subtotal,
            message=f"Requiere una compra mínima de ${min_order_amount:.2f} MXN"
        )
    
    promo_type = promo.get("promo_type", "combo_fixed_price")
    scope = promo.get("target_type") or promo.get("scope") or "all_products"
    applicable_ids = set(promo.get("target_product_ids") or promo.get("applicable_product_ids") or [])
    target_category = promo.get("target_category")
    
    discount_total = 0.0
    
    # Filtrar items aplicables según scope
    applicable_items = []
    for it in request.items:
        applies = False
        if scope in ("all_products", "order_total"):
            applies = True
        elif scope == "specific_products" and it.product_id in applicable_ids:
            applies = True
        elif scope in ("category", "specific_category") and target_category and it.category == target_category:
            applies = True
        
        if applies:
            applicable_items.append(it)
    
    app_units = sum(it.quantity for it in applicable_items)
    app_subtotal = sum(it.quantity * it.unit_price for it in applicable_items)
    
    if promo_type in ("combo_fixed_price", "fixed_combo"):
        # Paquete cerrado (ej: 3 galletas por $90)
        combo_units = promo.get("min_quantity") or promo.get("min_units") or 3
        combo_price = promo.get("discount_value") or promo.get("promo_price") or 90.0
        if app_units >= combo_units and combo_units > 0:
            num_combos = app_units // combo_units
            
            # Promedio de precio unitario aplicable
            avg_unit_price = app_subtotal / app_units if app_units > 0 else 35.0
            regular_combo_cost = combo_units * avg_unit_price
            savings_per_combo = max(0.0, regular_combo_cost - combo_price)
            discount_total = round(num_combos * savings_per_combo, 2)
            
    elif promo_type in ("percentage", "percentage_discount"):
        # Descuento porcentual (ej. 15%)
        pct_val = promo.get("discount_value") or promo.get("discount_pct") or 10.0
        pct = pct_val / 100.0
        discount_total = round(app_subtotal * pct, 2)
        
    elif promo_type in ("fixed_amount", "fixed_discount"):
        # Descuento fijo en dinero (ej. $30)
        fixed_amt = promo.get("discount_value") or promo.get("discount_amount") or 30.0
        discount_total = min(original_subtotal, fixed_amt)
        
    elif promo_type in ("two_for_one", "buy_x_get_y"):
        # Ej. 2x1
        min_u = promo.get("min_quantity") or promo.get("min_units") or 2
        if app_units >= min_u:
            free_units = app_units // min_u
            unit_prices = []
            for it in applicable_items:
                unit_prices.extend([it.unit_price] * it.quantity)
            unit_prices.sort()
            discount_total = sum(unit_prices[:free_units])
            
    final_total = max(0.0, round(original_subtotal - discount_total, 2))
    
    return PromoCalculationResponse(
        promotion_applied=PromotionResponse(**promo),
        original_subtotal=original_subtotal,
        discount_total=discount_total,
        final_total=final_total,
        message=f"¡Promoción '{promo.get('name')}' aplicada! Ahorro de ${discount_total:.2f} MXN"
    )
