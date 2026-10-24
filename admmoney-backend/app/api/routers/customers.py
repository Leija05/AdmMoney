from typing import List
from fastapi import APIRouter, HTTPException, status
from ...models.schemas import CustomerCreate, CustomerResponse
from ...services.customer_service import CustomerService

router = APIRouter(prefix="/api/customers", tags=["Customers Directory"])

@router.get("", response_model=List[CustomerResponse])
def get_customers():
    return CustomerService.get_customers()

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(data: CustomerCreate):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="El nombre del cliente es obligatorio")
    return CustomerService.create_customer(data)

@router.delete("/{customer_id}")
def delete_customer(customer_id: int):
    deleted = CustomerService.delete_customer(customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"message": "Cliente eliminado"}
