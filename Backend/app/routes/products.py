"""Product REST API endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services import product_service

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = Query(default=None, description="Search by name, SKU, or category"),
    category: Optional[str] = Query(default=None, description="Filter by exact category"),
    db: Session = Depends(get_db),
) -> List[ProductResponse]:
    """List all products."""
    return product_service.list_products(db, search=search, category=category)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> ProductResponse:
    """Create a new product."""
    return product_service.create_product(db, payload)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductResponse:
    """Get a single product by ID."""
    return product_service.get_product_or_404(db, product_id)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
) -> ProductResponse:
    """Update a product by ID."""
    return product_service.update_product(db, product_id, payload)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> Response:
    """Delete a product by ID."""
    product_service.delete_product(db, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
