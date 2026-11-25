"""Inventory REST API endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.inventory import InventoryResponse, StockStatus
from app.services import inventory_service

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@router.get("", response_model=List[InventoryResponse])
def get_inventory(
    search: Optional[str] = Query(default=None, description="Search by product, SKU, or warehouse"),
    product_id: Optional[int] = Query(default=None, gt=0),
    warehouse_id: Optional[int] = Query(default=None, gt=0),
    status: Optional[StockStatus] = Query(default=None, description="Filter by stock status"),
    db: Session = Depends(get_db),
) -> List[InventoryResponse]:
    """List inventory records across products and warehouses."""
    return inventory_service.list_inventory(
        db,
        search=search,
        product_id=product_id,
        warehouse_id=warehouse_id,
        stock_status=status,
    )


@router.get("/{inventory_id}", response_model=InventoryResponse)
def get_inventory_item(inventory_id: int, db: Session = Depends(get_db)) -> InventoryResponse:
    """Get a single inventory record by ID."""
    return inventory_service.get_inventory_or_404(db, inventory_id)
