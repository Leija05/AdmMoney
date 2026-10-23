from fastapi import APIRouter, UploadFile, File, HTTPException
from ...models.schemas import ReceiptScanResponse, ExpenseCreate, ExpenseResponse
from ...services.ticket_scanner import scan_receipt_image
from ...services.expense_service import ExpenseService

router = APIRouter(prefix="/api/scanner", tags=["Receipt Scanner"])

@router.post("/upload", response_model=ReceiptScanResponse)
async def upload_and_scan_receipt(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen válida (JPG, PNG, WEBP)")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="El archivo está vacío")

    result = await scan_receipt_image(content, file.filename or "receipt.jpg")
    return result

@router.post("/confirm", response_model=ExpenseResponse)
def confirm_scanned_receipt_as_expense(expense_data: ExpenseCreate):
    return ExpenseService.create(expense_data)
