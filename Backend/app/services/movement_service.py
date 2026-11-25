"""Transaction-safe stock movement service with row-level locking."""

from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session, joinedload

from app.models.inventory import Inventory
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.warehouse import Warehouse
from app.schemas.inventory import InventoryResponse
from app.schemas.movement import StockMovementCreate, StockMovementResponse
from app.services.inventory_service import serialize_inventory


def serialize_movement(
    movement: StockMovement,
    new_quantity: Optional[int] = None,
) -> StockMovementResponse:
    """Convert a StockMovement ORM object into StockMovementResponse."""
    inv = movement.inventory
    return StockMovementResponse(
        id=movement.id,
        inventory_id=movement.inventory_id,
        product_id=inv.product_id,
        product_name=inv.product.name,
        product_sku=inv.product.sku,
        warehouse_id=inv.warehouse_id,
        warehouse_name=inv.warehouse.name,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        new_quantity=new_quantity,
        created_at=movement.created_at,
    )


def list_movements(
    db: Session,
    product_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    limit: int = 100,
) -> List[StockMovementResponse]:
    """Return stock movement history ordered by most recent first."""
    query = (
        db.query(StockMovement)
        .join(StockMovement.inventory)
        .options(
            joinedload(StockMovement.inventory).joinedload(Inventory.product),
            joinedload(StockMovement.inventory).joinedload(Inventory.warehouse),
        )
    )

    if product_id is not None:
        query = query.filter(Inventory.product_id == product_id)
    if warehouse_id is not None:
        query = query.filter(Inventory.warehouse_id == warehouse_id)
    if movement_type in ("IN", "OUT"):
        query = query.filter(StockMovement.movement_type == movement_type)

    movements = (
        query.order_by(StockMovement.created_at.desc(), StockMovement.id.desc())
        .limit(limit)
        .all()
    )
    return [serialize_movement(m) for m in movements]


def record_stock_movement(
    db: Session,
    payload: StockMovementCreate,
) -> Tuple[StockMovementResponse, InventoryResponse]:
    """
    Execute an inbound or outbound stock movement inside a database transaction.

    Uses PostgreSQL SELECT ... FOR UPDATE row-level locking on the target inventory row
    to prevent race conditions and negative inventory under concurrent requests.
    """
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {payload.product_id} not found",
        )

    warehouse = db.query(Warehouse).filter(Warehouse.id == payload.warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Warehouse with id {payload.warehouse_id} not found",
        )

    try:
        if payload.movement_type == "IN":
            # Ensure the (product_id, warehouse_id) row exists safely without race-condition duplicates.
            stmt = (
                pg_insert(Inventory)
                .values(
                    product_id=payload.product_id,
                    warehouse_id=payload.warehouse_id,
                    quantity=0,
                )
                .on_conflict_do_nothing(constraint="uq_inventory_product_warehouse")
            )
            db.execute(stmt)

        # Acquire an exclusive row lock until transaction commit/rollback.
        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.product_id == payload.product_id,
                Inventory.warehouse_id == payload.warehouse_id,
            )
            .with_for_update()
            .first()
        )

        if inventory is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient stock: no inventory exists for this product in the selected warehouse",
            )

        if payload.movement_type == "OUT":
            if inventory.quantity < payload.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient stock for outbound movement: "
                        f"available {inventory.quantity}, requested {payload.quantity}"
                    ),
                )
            inventory.quantity -= payload.quantity
        else:
            inventory.quantity += payload.quantity

        movement = StockMovement(
            inventory_id=inventory.id,
            movement_type=payload.movement_type,
            quantity=payload.quantity,
        )
        db.add(movement)
        db.commit()
        db.refresh(inventory)
        db.refresh(movement)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    # Reload relationships for clean serialization after commit.
    loaded_inventory = (
        db.query(Inventory)
        .options(joinedload(Inventory.product), joinedload(Inventory.warehouse))
        .filter(Inventory.id == inventory.id)
        .one()
    )
    loaded_movement = (
        db.query(StockMovement)
        .options(
            joinedload(StockMovement.inventory).joinedload(Inventory.product),
            joinedload(StockMovement.inventory).joinedload(Inventory.warehouse),
        )
        .filter(StockMovement.id == movement.id)
        .one()
    )

    return (
        serialize_movement(loaded_movement, new_quantity=loaded_inventory.quantity),
        serialize_inventory(loaded_inventory),
    )
