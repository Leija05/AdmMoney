from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from ...models.schemas import (
    OrderCreate, OrderUpdate, OrderResponse, BakingSheetResponse
)
from ...services.order_service import OrderService

router = APIRouter(prefix="/api/orders", tags=["Orders & Baking Pipeline"])

@router.get("", response_model=List[OrderResponse])
def get_orders(
    status: Optional[str] = Query(None),
    delivery_date: Optional[str] = Query(None),
    customer_name: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None)
):
    return OrderService.get_orders(
        status=status,
        delivery_date=delivery_date,
        customer_name=customer_name,
        payment_status=payment_status
    )

@router.get("/baking-sheet", response_model=BakingSheetResponse)
def get_baking_sheet(
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None)
):
    return OrderService.get_baking_sheet(from_date=from_date, to_date=to_date)

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int):
    order = OrderService.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order

@router.post("", response_model=OrderResponse, status_code=201)
def create_order(data: OrderCreate):
    return OrderService.create_order(data)

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, data: OrderUpdate):
    updated = OrderService.update_order(order_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return updated

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: int, status: str = Body(..., embed=True)):
    updated = OrderService.update_order_status(order_id, status)
    if not updated:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return updated

@router.delete("/{order_id}")
def delete_order(order_id: int):
    deleted = OrderService.delete_order(order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return {"message": "Pedido eliminado correctamente"}
