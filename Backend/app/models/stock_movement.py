"""StockMovement SQLAlchemy model."""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StockMovement(Base):
    """Immutable audit log of inbound (IN) and outbound (OUT) stock movements."""

    __tablename__ = "stock_movements"
    __table_args__ = (
        CheckConstraint("movement_type IN ('IN', 'OUT')", name="ck_stock_movements_type"),
        CheckConstraint("quantity > 0", name="ck_stock_movements_quantity_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    inventory_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("inventory.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    movement_type: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    inventory = relationship("Inventory", back_populates="movements")
