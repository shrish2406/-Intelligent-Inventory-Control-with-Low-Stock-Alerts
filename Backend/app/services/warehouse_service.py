"""Warehouse CRUD business logic."""

from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.warehouse import Warehouse
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate


def list_warehouses(db: Session, search: Optional[str] = None) -> List[Warehouse]:
    """Return warehouses optionally filtered by name or location."""
    query = db.query(Warehouse)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Warehouse.name.ilike(pattern),
                Warehouse.location.ilike(pattern),
            )
        )
    return query.order_by(Warehouse.created_at.desc(), Warehouse.id.desc()).all()


def get_warehouse_or_404(db: Session, warehouse_id: int) -> Warehouse:
    """Fetch a warehouse by ID or raise 404."""
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Warehouse with id {warehouse_id} not found",
        )
    return warehouse


def create_warehouse(db: Session, payload: WarehouseCreate) -> Warehouse:
    """Create a new warehouse."""
    warehouse = Warehouse(name=payload.name, location=payload.location)
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


def update_warehouse(db: Session, warehouse_id: int, payload: WarehouseUpdate) -> Warehouse:
    """Update an existing warehouse."""
    warehouse = get_warehouse_or_404(db, warehouse_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(warehouse, field, value)

    db.commit()
    db.refresh(warehouse)
    return warehouse


def delete_warehouse(db: Session, warehouse_id: int) -> None:
    """Delete a warehouse and its cascaded inventory/movement/alert records."""
    warehouse = get_warehouse_or_404(db, warehouse_id)
    db.delete(warehouse)
    db.commit()
