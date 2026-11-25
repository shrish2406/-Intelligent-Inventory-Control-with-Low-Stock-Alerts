"""Stock Movement REST API endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from alert_service.detector import evaluate_inventory_alerts
from app.database import get_db
from app.routes.alerts import serialize_alert
from app.schemas.movement import MovementType, StockMovementCreate, StockMovementResponse
from app.services import movement_service
from app.websocket_manager import ws_manager

router = APIRouter(prefix="/api/movements", tags=["Stock Movements"])


@router.get("", response_model=List[StockMovementResponse])
def get_movements(
    product_id: Optional[int] = Query(default=None, gt=0),
    warehouse_id: Optional[int] = Query(default=None, gt=0),
    movement_type: Optional[MovementType] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> List[StockMovementResponse]:
    """List stock movement history."""
    return movement_service.list_movements(
        db,
        product_id=product_id,
        warehouse_id=warehouse_id,
        movement_type=movement_type,
        limit=limit,
    )


@router.post("", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED)
async def create_movement(
    payload: StockMovementCreate,
    db: Session = Depends(get_db),
) -> StockMovementResponse:
    """Record a stock IN or OUT movement, evaluate alerts, and broadcast WebSocket events."""
    movement_response, inventory_response = movement_service.record_stock_movement(db, payload)
    created_alerts, resolved_alerts = evaluate_inventory_alerts(
        db,
        movement_response.inventory_id,
    )

    # Broadcast only after database commits succeed.
    await ws_manager.broadcast("inventory_updated", inventory_response.model_dump(mode="json"))
    await ws_manager.broadcast("stock_movement_created", movement_response.model_dump(mode="json"))

    for alert in created_alerts:
        serialized = serialize_alert(alert)
        await ws_manager.broadcast("low_stock_alert", serialized.model_dump(mode="json"))

    for alert in resolved_alerts:
        serialized = serialize_alert(alert)
        await ws_manager.broadcast("alert_resolved", serialized.model_dump(mode="json"))

    return movement_response
