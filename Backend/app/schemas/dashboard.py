"""Pydantic schemas for Dashboard endpoints."""

from typing import List

from pydantic import BaseModel

from app.schemas.alert import AlertResponse
from app.schemas.movement import StockMovementResponse


class DashboardStatsResponse(BaseModel):
    """Top-level KPI counts for the dashboard."""

    total_products: int
    total_warehouses: int
    total_inventory_units: int
    low_stock_count: int
    out_of_stock_count: int
    active_alerts_count: int
    recent_movements: List[StockMovementResponse]
    active_alerts: List[AlertResponse]


class MovementTrendPoint(BaseModel):
    """Daily aggregated inbound and outbound stock movement totals."""

    date: str
    inbound: int
    outbound: int


class WarehouseDistributionItem(BaseModel):
    """Inventory distribution aggregated by warehouse."""

    warehouse_id: int
    warehouse_name: str
    total_units: int
    product_count: int
    low_stock_count: int
