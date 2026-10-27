from typing import Optional
from fastapi import APIRouter, Query, Response
from ...services.analytics_service import AnalyticsService
from ...services.pdf_service import create_daily_summary_pdf

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary")
def get_overall_summary():
    return AnalyticsService.get_overall_summary()

@router.get("/daily-summary")
def get_daily_summary(date: Optional[str] = Query(None, description="Fecha YYYY-MM-DD")):
    return AnalyticsService.get_daily_summary(date)

@router.get("/daily-summary/pdf")
def get_daily_summary_pdf(date: Optional[str] = Query(None, description="Fecha YYYY-MM-DD")):
    summary = AnalyticsService.get_daily_summary(date)
    pdf_bytes = create_daily_summary_pdf(summary)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=resumen_dia_{summary.get('date', 'hoy')}.pdf"}
    )

