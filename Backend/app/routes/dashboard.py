"""Dashboard analytics REST API endpoints."""

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.dashboard import (
    DashboardStatsResponse,
    MovementTrendPoint,
    WarehouseDistributionItem,
)
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_stats(db: Session = Depends(get_db)) -> DashboardStatsResponse:
    """Get top-level KPI metrics, recent movements, and active alerts."""
    return dashboard_service.get_dashboard_stats(db)


@router.get("/movements", response_model=List[MovementTrendPoint])
def get_movement_trends(
    days: int = Query(default=14, ge=1, le=90),
    db: Session = Depends(get_db),
) -> List[MovementTrendPoint]:
    """Get daily inbound and outbound stock movement trends."""
    return dashboard_service.get_movement_trends(db, days=days)


@router.get("/inventory-distribution", response_model=List[WarehouseDistributionItem])
def get_inventory_distribution(
    db: Session = Depends(get_db),
) -> List[WarehouseDistributionItem]:
    """Get inventory unit distribution across warehouses."""
    return dashboard_service.get_inventory_distribution(db)
