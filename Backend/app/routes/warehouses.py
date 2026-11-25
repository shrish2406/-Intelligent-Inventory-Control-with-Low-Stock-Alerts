"""Warehouse REST API endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.warehouse import WarehouseCreate, WarehouseResponse, WarehouseUpdate
from app.services import warehouse_service

router = APIRouter(prefix="/api/warehouses", tags=["Warehouses"])


@router.get("", response_model=List[WarehouseResponse])
def get_warehouses(
    search: Optional[str] = Query(default=None, description="Search by name or location"),
    db: Session = Depends(get_db),
) -> List[WarehouseResponse]:
    """List all warehouses."""
    return warehouse_service.list_warehouses(db, search=search)


@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(
    payload: WarehouseCreate,
    db: Session = Depends(get_db),
) -> WarehouseResponse:
    """Create a new warehouse."""
    return warehouse_service.create_warehouse(db, payload)


@router.put("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: int,
    payload: WarehouseUpdate,
    db: Session = Depends(get_db),
) -> WarehouseResponse:
    """Update a warehouse by ID."""
    return warehouse_service.update_warehouse(db, warehouse_id, payload)


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db)) -> Response:
    """Delete a warehouse by ID."""
    warehouse_service.delete_warehouse(db, warehouse_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
