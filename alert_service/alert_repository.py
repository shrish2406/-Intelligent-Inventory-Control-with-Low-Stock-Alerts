"""Persistence repository for automated stock alerts."""

from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

# pyrefly: ignore[missing-import]
from app.models.alert import Alert
# pyrefly: ignore[missing-import]
from app.models.inventory import Inventory
# pyrefly: ignore[missing-import]
from app.models.stock_movement import StockMovement


def get_inventory_with_relations(db: Session, inventory_id: int) -> Optional[Inventory]:
    """Fetch an inventory row along with its product and warehouse."""
    return (
        db.query(Inventory)
        .options(joinedload(Inventory.product), joinedload(Inventory.warehouse))
        .filter(Inventory.id == inventory_id)
        .first()
    )


def get_recent_outbound_total(db: Session, inventory_id: int, window_hours: int) -> int:
    """Sum outbound movement quantities for an inventory record within the lookback window."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=window_hours)
    total = (
        db.query(func.coalesce(func.sum(StockMovement.quantity), 0))
        .filter(
            StockMovement.inventory_id == inventory_id,
            StockMovement.movement_type == "OUT",
            StockMovement.created_at >= cutoff,
        )
        .scalar()
    )
    return int(total or 0)


def get_active_alert(db: Session, inventory_id: int, alert_type: str) -> Optional[Alert]:
    """Return an existing ACTIVE alert for the given inventory and alert type, if any."""
    return (
        db.query(Alert)
        .filter(
            Alert.inventory_id == inventory_id,
            Alert.alert_type == alert_type,
            Alert.status == "ACTIVE",
        )
        .first()
    )


def create_alert_if_not_active(
    db: Session,
    inventory_id: int,
    alert_type: str,
    message: str,
) -> Optional[Alert]:
    """
    Persist a new ACTIVE alert only if one is not already active for the same inventory/type.

    Returns the newly created Alert, or None if an active alert already exists.
    """
    existing = get_active_alert(db, inventory_id, alert_type)
    if existing is not None:
        return None

    alert = Alert(
        inventory_id=inventory_id,
        alert_type=alert_type,
        message=message,
        status="ACTIVE",
    )
    db.add(alert)
    try:
        db.commit()
        db.refresh(alert)
        return alert
    except IntegrityError:
        # Concurrent worker inserted the same ACTIVE alert first.
        db.rollback()
        return None


def auto_resolve_alert(db: Session, inventory_id: int, alert_type: str) -> Optional[Alert]:
    """Resolve an active alert when the underlying stock condition clears."""
    existing = get_active_alert(db, inventory_id, alert_type)
    if existing is None:
        return None
    existing.status = "RESOLVED"
    db.commit()
    db.refresh(existing)
    return existing


def list_alerts(
    db: Session,
    status: Optional[str] = None,
    alert_type: Optional[str] = None,
    warehouse_id: Optional[int] = None,
    product_id: Optional[int] = None,
) -> List[Alert]:
    """List alerts with product and warehouse context loaded."""
    query = (
        db.query(Alert)
        .join(Alert.inventory)
        .options(
            joinedload(Alert.inventory).joinedload(Inventory.product),
            joinedload(Alert.inventory).joinedload(Inventory.warehouse),
        )
    )
    if status:
        query = query.filter(Alert.status == status)
    if alert_type:
        query = query.filter(Alert.alert_type == alert_type)
    if warehouse_id is not None:
        query = query.filter(Inventory.warehouse_id == warehouse_id)
    if product_id is not None:
        query = query.filter(Inventory.product_id == product_id)

    return query.order_by(Alert.created_at.desc(), Alert.id.desc()).all()


def get_alert_by_id(db: Session, alert_id: int) -> Optional[Alert]:
    """Fetch a single alert with its inventory relations."""
    return (
        db.query(Alert)
        .options(
            joinedload(Alert.inventory).joinedload(Inventory.product),
            joinedload(Alert.inventory).joinedload(Inventory.warehouse),
        )
        .filter(Alert.id == alert_id)
        .first()
    )


def resolve_alert_by_id(db: Session, alert_id: int) -> Optional[Alert]:
    """Mark an alert as RESOLVED and return it."""
    alert = get_alert_by_id(db, alert_id)
    if alert is None:
        return None
    alert.status = "RESOLVED"
    db.commit()
    db.refresh(alert)
    return alert
