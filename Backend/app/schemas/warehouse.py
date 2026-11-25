"""Pydantic schemas for Warehouse endpoints."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class WarehouseBase(BaseModel):
    """Shared warehouse fields and validation rules."""

    name: str = Field(..., min_length=1, max_length=150)
    location: str = Field(..., min_length=1, max_length=255)

    @field_validator("name", "location")
    @classmethod
    def strip_non_empty(cls, value: str) -> str:
        """Trim whitespace and ensure string fields are not blank."""
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be blank")
        return cleaned


class WarehouseCreate(WarehouseBase):
    """Payload for creating a new warehouse."""
    pass


class WarehouseUpdate(BaseModel):
    """Payload for updating an existing warehouse."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    location: Optional[str] = Field(default=None, min_length=1, max_length=255)

    @field_validator("name", "location")
    @classmethod
    def strip_non_empty(cls, value: Optional[str]) -> Optional[str]:
        """Trim whitespace when a field is provided."""
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be blank")
        return cleaned


class WarehouseResponse(WarehouseBase):
    """Serialized warehouse returned by the API."""

    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
