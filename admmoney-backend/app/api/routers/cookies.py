from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from ...models.schemas import (
    IngredientCreate, IngredientUpdate, IngredientPurchaseCreate, IngredientResponse,
    CookieProductCreate, CookieProductUpdate, CookieProductResponse,
    CookieSaleCreate, CookieSaleUpdate, CookieSaleResponse,
    BatchScaleResponse, ProductionCapacityResponse
)
from ...services.cookie_service import CookieService

router = APIRouter(prefix="/api/cookies", tags=["Cookies & Inventory"])

# ----------------- INSUMOS / INGREDIENTES & SMART INVENTORY ----------------- #
@router.get("/ingredients", response_model=List[IngredientResponse])
def get_ingredients(type: Optional[str] = Query(None, description="edible or packaging")):
    return CookieService.get_ingredients(ing_type=type)

@router.get("/stock-alerts", response_model=List[IngredientResponse])
def get_stock_alerts():
    return CookieService.get_stock_alerts()

@router.post("/ingredients", response_model=IngredientResponse, status_code=201)
def create_ingredient(data: IngredientCreate):
    return CookieService.create_ingredient(data)

@router.post("/ingredients/{ingredient_id}/purchase", response_model=IngredientResponse)
def record_stock_purchase(ingredient_id: int, data: IngredientPurchaseCreate):
    updated = CookieService.record_stock_purchase(ingredient_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    return updated

@router.put("/ingredients/{ingredient_id}", response_model=IngredientResponse)
def update_ingredient(ingredient_id: int, data: IngredientUpdate):
    updated = CookieService.update_ingredient(ingredient_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    return updated

@router.delete("/ingredients/{ingredient_id}")
def delete_ingredient(ingredient_id: int):
    deleted = CookieService.delete_ingredient(ingredient_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    return {"message": "Ingrediente eliminado"}

# ----------------- PRODUCTOS / RECETAS / ESCALADO ----------------- #
@router.get("/products", response_model=List[CookieProductResponse])
def get_cookie_products(category: Optional[str] = Query(None)):
    return CookieService.get_cookies(category=category)

@router.get("/products/{cookie_id}", response_model=CookieProductResponse)
def get_cookie_product(cookie_id: int):
    cookie = CookieService.get_cookie_by_id(cookie_id)
    if not cookie:
        raise HTTPException(status_code=404, detail="Galleta no encontrada")
    return cookie

@router.post("/products", response_model=CookieProductResponse, status_code=201)
def create_cookie_product(data: CookieProductCreate):
    return CookieService.create_cookie(data)

@router.put("/products/{cookie_id}", response_model=CookieProductResponse)
def update_cookie_product(cookie_id: int, data: CookieProductUpdate):
    updated = CookieService.update_cookie(cookie_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Galleta no encontrada")
    return updated

@router.delete("/products/{cookie_id}")
def delete_cookie_product(cookie_id: int):
    deleted = CookieService.delete_cookie(cookie_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Galleta no encontrada")
    return {"message": "Galleta desactivada"}

# ----------------- HERRAMIENTAS: BATCH SCALER & CAPACIDAD ----------------- #
@router.get("/batch-scaler", response_model=BatchScaleResponse)
def scale_cookie_batch(
    product_id: int = Query(..., description="ID del producto a escalar"),
    target_units: int = Query(..., ge=1, description="Meta de producción en piezas"),
    waste_pct: Optional[float] = Query(None, description="Porcentaje de merma personalizado")
):
    result = CookieService.scale_batch(product_id, target_units, custom_waste_pct=waste_pct)
    if not result:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return result

@router.get("/production-capacity", response_model=ProductionCapacityResponse)
def get_production_capacity():
    return CookieService.calculate_production_capacity()

# ----------------- VENTAS DE MOSTRADOR ----------------- #
@router.get("/sales", response_model=List[CookieSaleResponse])
def get_cookie_sales(limit: int = Query(50, ge=1, le=200)):
    return CookieService.get_sales(limit=limit)

@router.post("/sales", response_model=CookieSaleResponse, status_code=201)
def register_cookie_sale(data: CookieSaleCreate):
    try:
        return CookieService.register_sale(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/sales/{sale_id}", response_model=CookieSaleResponse)
def update_cookie_sale(sale_id: int, data: CookieSaleUpdate):
    updated = CookieService.update_sale(sale_id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return updated

@router.delete("/sales/{sale_id}")
def delete_cookie_sale(sale_id: int):
    deleted = CookieService.delete_sale(sale_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return {"message": "Venta eliminada"}

@router.get("/sales/{sale_id}/pdf")
def get_sale_ticket_pdf(sale_id: int, note: Optional[str] = Query(None)):
    from fastapi import Response
    from ...core.database import get_db
    from ...services.pdf_service import create_sale_ticket_pdf
    db = get_db()
    sale = db.cookie_sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    pdf_bytes = create_sale_ticket_pdf(sale, note=note)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=ticket_venta_{sale_id}.pdf"}
    )

# ----------------- ANALÍTICA DE GALLETAS ----------------- #
@router.get("/analytics")
def get_cookie_analytics():
    return CookieService.get_cookie_analytics()
