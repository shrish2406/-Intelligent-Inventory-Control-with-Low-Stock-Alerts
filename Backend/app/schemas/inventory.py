"""Pydantic schemas for Inventory endpoints."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

StockStatus = Literal["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]


class InventoryResponse(BaseModel):
    """Inventory record enriched with product and warehouse metadata."""

    id: int
    product_id: int
    product_name: str
    product_sku: str
    product_category: str
    minimum_stock: int
    warehouse_id: int
    warehouse_name: str
    warehouse_location: str
    quantity: int
    status: StockStatus
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
