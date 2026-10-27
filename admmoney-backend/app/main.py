import os
import traceback
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import CORS_ORIGINS, UPLOAD_DIR
from .core.database import init_db
from .api.routers.expenses import router as expenses_router
from .api.routers.cookies import router as cookies_router
from .api.routers.orders import router as orders_router
from .api.routers.scanner import router as scanner_router
from .api.routers.analytics import router as analytics_router
from .api.routers.promotions import router as promotions_router
from .api.routers.customers import router as customers_router
from .api.routers.tickets import router as tickets_router
from .api.routers.public_orders import router as public_orders_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seeds
    init_db()
    yield
    # Shutdown

app = FastAPI(
    title="Adm Money API",
    description="Backend API para administración de gastos generales, escaneo de tickets y mini negocio de galletas y repostería.",
    version="2.1.0",
    lifespan=lifespan
)

# CORS configuration: allow_origin_regex matches any http/https origin (localhost, Expo, Render, Vercel)
# without triggering browser violations of credential wildcards
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global exception handler ensures 500 errors always return CORS headers so browsers don't report 'CORS Missing Allow Origin'
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "error": "InternalServerError"},
        headers={
            "Access-Control-Allow-Origin": origin if origin else "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Static files for receipt uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include Routers
app.include_router(expenses_router)
app.include_router(cookies_router)
app.include_router(orders_router)
app.include_router(scanner_router)
app.include_router(analytics_router)
app.include_router(promotions_router)
app.include_router(customers_router)
app.include_router(tickets_router)
app.include_router(public_orders_router)

@app.get("/api/health", tags=["Health"])
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Adm Money API",
        "version": "2.1.0"
    }

# Root aliases for legacy or direct PDF endpoints without /api prefix
@app.get("/orders/{order_id}/pdf", tags=["Orders & Baking Pipeline"])
def get_order_ticket_pdf_alias(order_id: int, note: Optional[str] = None):
    from .api.routers.orders import get_order_ticket_pdf
    return get_order_ticket_pdf(order_id=order_id, note=note)

@app.get("/cookies/sales/{sale_id}/pdf", tags=["Cookies & Inventory"])
def get_cookie_sale_ticket_pdf_alias(sale_id: int, note: Optional[str] = None):
    from .api.routers.cookies import get_cookie_sale_ticket_pdf
    return get_cookie_sale_ticket_pdf(sale_id=sale_id, note=note)

@app.get("/analytics/daily-summary/pdf", tags=["Analytics"])
def get_daily_summary_pdf_alias(date: Optional[str] = None):
    from .api.routers.analytics import get_daily_summary_pdf
    return get_daily_summary_pdf(date=date)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)

