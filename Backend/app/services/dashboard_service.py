"""Dashboard aggregation queries against PostgreSQL."""

from datetime import datetime, timedelta, timezone
from typing import List

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from alert_service import alert_repository
from app.models.alert import Alert
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.warehouse import Warehouse
from app.routes.alerts import serialize_alert
from app.schemas.dashboard import (
    DashboardStatsResponse,
    MovementTrendPoint,
    WarehouseDistributionItem,
)
from app.services import movement_service


def get_dashboard_stats(db: Session) -> DashboardStatsResponse:
    """Compute live KPI totals, recent movements, and active alerts from PostgreSQL."""
    total_products = int(db.query(func.count(Product.id)).scalar() or 0)
    total_warehouses = int(db.query(func.count(Warehouse.id)).scalar() or 0)
    total_inventory_units = int(
        db.query(func.coalesce(func.sum(Inventory.quantity), 0)).scalar() or 0
    )

    low_stock_count = int(
        db.query(func.count(Inventory.id))
        .join(Inventory.product)
        .filter(Inventory.quantity > 0, Inventory.quantity <= Product.minimum_stock)
        .scalar()
        or 0
    )

    out_of_stock_count = int(
        db.query(func.count(Inventory.id))
        .filter(Inventory.quantity == 0)
        .scalar()
        or 0
    )

    active_alerts_count = int(
        db.query(func.count(Alert.id))
        .filter(Alert.status == "ACTIVE")
        .scalar()
        or 0
    )

    recent_movements = movement_service.list_movements(db, limit=10)
    active_alerts = [
        serialize_alert(a)
        for a in alert_repository.list_alerts(db, status="ACTIVE")[:10]
    ]

    return DashboardStatsResponse(
        total_products=total_products,
        total_warehouses=total_warehouses,
        total_inventory_units=total_inventory_units,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        active_alerts_count=active_alerts_count,
        recent_movements=recent_movements,
        active_alerts=active_alerts,
    )


def get_movement_trends(db: Session, days: int = 14) -> List[MovementTrendPoint]:
    """Return daily inbound/outbound totals over the past N days."""
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=days - 1)
    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)

    date_expr = func.date(StockMovement.created_at)
    rows = (
        db.query(
            date_expr.label("day"),
            func.coalesce(
                func.sum(
                    case(
                        (StockMovement.movement_type == "IN", StockMovement.quantity),
                        else_=0,
                    )
                ),
                0,
            ).label("inbound"),
            func.coalesce(
                func.sum(
                    case(
                        (StockMovement.movement_type == "OUT", StockMovement.quantity),
                        else_=0,
                    )
                ),
                0,
            ).label("outbound"),
        )
        .filter(StockMovement.created_at >= start_dt)
        .group_by(date_expr)
        .order_by(date_expr.asc())
        .all()
    )

    by_day = {str(row.day): (int(row.inbound), int(row.outbound)) for row in rows}
    points: List[MovementTrendPoint] = []
    for offset in range(days):
        day_str = (start_date + timedelta(days=offset)).isoformat()
        inbound, outbound = by_day.get(day_str, (0, 0))
        points.append(MovementTrendPoint(date=day_str, inbound=inbound, outbound=outbound))
    return points


def get_inventory_distribution(db: Session) -> List[WarehouseDistributionItem]:
    """Return inventory totals grouped by warehouse."""
    rows = (
        db.query(
            Warehouse.id.label("warehouse_id"),
            Warehouse.name.label("warehouse_name"),
            func.coalesce(func.sum(Inventory.quantity), 0).label("total_units"),
            func.count(Inventory.id).label("product_count"),
            func.coalesce(
                func.sum(
                    case(
                        (Inventory.quantity <= Product.minimum_stock, 1),
                        else_=0,
                    )
                ),
                0,
            ).label("low_stock_count"),
        )
        .outerjoin(Inventory, Inventory.warehouse_id == Warehouse.id)
        .outerjoin(Product, Product.id == Inventory.product_id)
        .group_by(Warehouse.id, Warehouse.name)
        .order_by(Warehouse.name.asc())
        .all()
    )

    return [
        WarehouseDistributionItem(
            warehouse_id=row.warehouse_id,
            warehouse_name=row.warehouse_name,
            total_units=int(row.total_units or 0),
            product_count=int(row.product_count or 0),
            low_stock_count=int(row.low_stock_count or 0),
        )
        for row in rows
    ]
