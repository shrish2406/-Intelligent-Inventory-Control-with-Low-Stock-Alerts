"""Pydantic schemas for Stock Movement endpoints."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MovementType = Literal["IN", "OUT"]


class StockMovementCreate(BaseModel):
    """Payload for recording an inbound or outbound stock movement."""

    product_id: int = Field(..., gt=0)
    warehouse_id: int = Field(..., gt=0)
    movement_type: MovementType
    quantity: int = Field(..., gt=0, description="Movement quantity must be greater than zero")


class StockMovementResponse(BaseModel):
    """Serialized stock movement with product and warehouse details."""

    id: int
    inventory_id: int
    product_id: int
    product_name: str
    product_sku: str
    warehouse_id: int
    warehouse_name: str
    movement_type: MovementType
    quantity: int
    new_quantity: int | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
