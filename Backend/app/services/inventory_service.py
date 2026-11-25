"""Inventory query and status calculation logic."""

from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.inventory import Inventory
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.schemas.inventory import InventoryResponse, StockStatus


def compute_stock_status(quantity: int, minimum_stock: int) -> StockStatus:
    """Determine stock status from current quantity and product minimum threshold."""
    if quantity <= 0:
        return "OUT_OF_STOCK"
    if quantity <= minimum_stock:
        return "LOW_STOCK"
    return "IN_STOCK"


def serialize_inventory(item: Inventory) -> InventoryResponse:
    """Convert an Inventory ORM object with loaded relations into InventoryResponse."""
    return InventoryResponse(
        id=item.id,
        product_id=item.product_id,
        product_name=item.product.name,
        product_sku=item.product.sku,
        product_category=item.product.category,
        minimum_stock=item.product.minimum_stock,
        warehouse_id=item.warehouse_id,
        warehouse_name=item.warehouse.name,
        warehouse_location=item.warehouse.location,
        quantity=item.quantity,
        status=compute_stock_status(item.quantity, item.product.minimum_stock),
        updated_at=item.updated_at,
    )


def list_inventory(
    db: Session,
    search: Optional[str] = None,
    product_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    stock_status: Optional[StockStatus] = None,
) -> List[InventoryResponse]:
    """List inventory records with optional search and filters."""
    query = (
        db.query(Inventory)
        .join(Inventory.product)
        .join(Inventory.warehouse)
        .options(joinedload(Inventory.product), joinedload(Inventory.warehouse))
    )

    if product_id is not None:
        query = query.filter(Inventory.product_id == product_id)
    if warehouse_id is not None:
        query = query.filter(Inventory.warehouse_id == warehouse_id)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(pattern),
                Product.sku.ilike(pattern),
                Product.category.ilike(pattern),
                Warehouse.name.ilike(pattern),
                Warehouse.location.ilike(pattern),
            )
        )

    items = query.order_by(Inventory.updated_at.desc(), Inventory.id.desc()).all()
    responses = [serialize_inventory(item) for item in items]

    if stock_status is not None:
        responses = [item for item in responses if item.status == stock_status]

    return responses


def get_inventory_or_404(db: Session, inventory_id: int) -> InventoryResponse:
    """Fetch a single inventory record by ID or raise 404."""
    item = (
        db.query(Inventory)
        .options(joinedload(Inventory.product), joinedload(Inventory.warehouse))
        .filter(Inventory.id == inventory_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory record with id {inventory_id} not found",
        )
    return serialize_inventory(item)
