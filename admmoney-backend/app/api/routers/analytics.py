from fastapi import APIRouter
from ...services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary")
def get_overall_summary():
    return AnalyticsService.get_overall_summary()
