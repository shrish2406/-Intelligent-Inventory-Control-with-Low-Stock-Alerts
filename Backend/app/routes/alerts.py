"""Alert REST API endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from alert_service import alert_repository
from app.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertStatus
from app.websocket_manager import ws_manager

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


def serialize_alert(alert: Alert) -> AlertResponse:
    """Convert an Alert ORM object with loaded inventory relations into AlertResponse."""
    inv = alert.inventory
    return AlertResponse(
        id=alert.id,
        inventory_id=alert.inventory_id,
        product_id=inv.product_id,
        product_name=inv.product.name,
        product_sku=inv.product.sku,
        warehouse_id=inv.warehouse_id,
        warehouse_name=inv.warehouse.name,
        alert_type=alert.alert_type,
        message=alert.message,
        status=alert.status,
        created_at=alert.created_at,
    )


@router.get("", response_model=List[AlertResponse])
def get_alerts(
    status: Optional[AlertStatus] = Query(default=None, description="Filter by ACTIVE or RESOLVED"),
    alert_type: Optional[str] = Query(default=None, description="Filter by alert type"),
    warehouse_id: Optional[int] = Query(default=None, gt=0),
    product_id: Optional[int] = Query(default=None, gt=0),
    db: Session = Depends(get_db),
) -> List[AlertResponse]:
    """List persisted stock alerts."""
    alerts = alert_repository.list_alerts(
        db,
        status=status,
        alert_type=alert_type,
        warehouse_id=warehouse_id,
        product_id=product_id,
    )
    return [serialize_alert(a) for a in alerts]


@router.patch("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(alert_id: int, db: Session = Depends(get_db)) -> AlertResponse:
    """Mark an alert as RESOLVED and broadcast the update."""
    alert = alert_repository.resolve_alert_by_id(db, alert_id)
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with id {alert_id} not found",
        )
    serialized = serialize_alert(alert)
    await ws_manager.broadcast("alert_resolved", serialized.model_dump(mode="json"))
    return serialized
