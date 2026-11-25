"""Product SQLAlchemy model."""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    """Represents a catalog product tracked across warehouses."""

    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("minimum_stock >= 0", name="ck_products_minimum_stock_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    minimum_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    inventory_items = relationship(
        "Inventory",
        back_populates="product",
        cascade="all, delete-orphan",
    )
