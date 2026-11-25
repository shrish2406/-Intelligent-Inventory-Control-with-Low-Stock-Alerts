"""Pydantic schemas for Alert endpoints."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

AlertStatus = Literal["ACTIVE", "RESOLVED"]


class AlertResponse(BaseModel):
    """Serialized alert with product and warehouse context."""

    id: int
    inventory_id: int
    product_id: int
    product_name: str
    product_sku: str
    warehouse_id: int
    warehouse_name: str
    alert_type: str
    message: str
    status: AlertStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
