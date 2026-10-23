from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from ...models.schemas import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from ...services.expense_service import ExpenseService

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    month: Optional[str] = Query(None)
):
    return ExpenseService.get_all(category=category, search=search, month=month)

@router.get("/summary")
def get_expenses_summary():
    return ExpenseService.get_summary()

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int):
    expense = ExpenseService.get_by_id(expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return expense

@router.post("", response_model=ExpenseResponse, status_code=201)
def create_expense(data: ExpenseCreate):
    return ExpenseService.create(data)

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, data: ExpenseUpdate):
    updated = ExpenseService.update(expense_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return updated

@router.delete("/{expense_id}")
def delete_expense(expense_id: int):
    deleted = ExpenseService.delete(expense_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return {"message": "Gasto eliminado correctamente"}
