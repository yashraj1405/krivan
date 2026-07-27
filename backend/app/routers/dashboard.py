from typing import Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.security.jwt import get_current_active_user
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get(
    "/",
    response_model=DashboardSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Dashboard Metrics & Summary Overview"
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user)
) -> DashboardSummaryResponse:
    """
    Retrieve aggregated counts for products, batches, dealers, QR codes, and recent scan logs.
    """
    service = DashboardService(db)
    return service.get_summary()
