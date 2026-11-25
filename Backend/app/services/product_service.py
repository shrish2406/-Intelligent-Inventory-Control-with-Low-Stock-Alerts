"""Product CRUD business logic."""

from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def list_products(
    db: Session,
    search: Optional[str] = None,
    category: Optional[str] = None,
) -> List[Product]:
    """Return products optionally filtered by search term or category."""
    query = db.query(Product)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(pattern),
                Product.sku.ilike(pattern),
                Product.category.ilike(pattern),
            )
        )
    if category:
        query = query.filter(Product.category == category.strip())
    return query.order_by(Product.created_at.desc(), Product.id.desc()).all()


def get_product_or_404(db: Session, product_id: int) -> Product:
    """Fetch a product by ID or raise 404."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )
    return product



    


def create_product(db: Session, payload: ProductCreate) -> Product:
    """Create a new product after enforcing unique SKU validation."""
    existing = db.query(Product).filter(Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A product with SKU '{payload.sku}' already exists",
        )

    product = Product(
        name=payload.name,
        sku=payload.sku,
        category=payload.category,
        minimum_stock=payload.minimum_stock,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, payload: ProductUpdate) -> Product:
    """Update an existing product while keeping SKUs unique."""
    product = get_product_or_404(db, product_id)
    updates = payload.model_dump(exclude_unset=True)

    if "sku" in updates and updates["sku"] != product.sku:
        duplicate = (
            db.query(Product)
            .filter(Product.sku == updates["sku"], Product.id != product_id)
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A product with SKU '{updates['sku']}' already exists",
            )

    for field, value in updates.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> None:
    """Delete a product and its cascaded inventory/movement/alert records."""
    product = get_product_or_404(db, product_id)
    db.delete(product)
    db.commit()
