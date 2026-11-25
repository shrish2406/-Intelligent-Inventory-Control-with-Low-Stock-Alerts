"""Pydantic schemas for Product endpoints."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    """Shared product fields and validation rules."""

    name: str = Field(..., min_length=1, max_length=150)
    sku: str = Field(..., min_length=1, max_length=64)
    category: str = Field(..., min_length=1, max_length=100)
    minimum_stock: int = Field(default=0, ge=0)

    @field_validator("name", "sku", "category")
    @classmethod
    def strip_non_empty(cls, value: str) -> str:
        """Trim whitespace and ensure string fields are not blank."""
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be blank")
        return cleaned

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str) -> str:
        """Normalize SKUs to uppercase for consistent uniqueness checks."""
        return value.upper()


class ProductCreate(ProductBase):
    """Payload for creating a new product."""
    pass


class ProductUpdate(BaseModel):
    """Payload for updating an existing product."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    sku: Optional[str] = Field(default=None, min_length=1, max_length=64)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    minimum_stock: Optional[int] = Field(default=None, ge=0)

    @field_validator("name", "sku", "category")
    @classmethod
    def strip_non_empty(cls, value: Optional[str]) -> Optional[str]:
        """Trim whitespace when a field is provided."""
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be blank")
        return cleaned

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: Optional[str]) -> Optional[str]:
        """Normalize SKUs to uppercase when provided."""
        return value.upper() if value is not None else None


class ProductResponse(ProductBase):
    """Serialized product returned by the API."""

    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
