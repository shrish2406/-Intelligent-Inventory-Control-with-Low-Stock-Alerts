"""Alert SQLAlchemy model."""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Alert(Base):
    """Automated stock alert persisted in PostgreSQL."""

    __tablename__ = "alerts"
    __table_args__ = (
        CheckConstraint("status IN ('ACTIVE', 'RESOLVED')", name="ck_alerts_status"),
        Index(
            "uq_active_alert_inventory_type",
            "inventory_id",
            "alert_type",
            unique=True,
            postgresql_where=text("status = 'ACTIVE'"),
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    inventory_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("inventory.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    alert_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="ACTIVE", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    inventory = relationship("Inventory", back_populates="alerts")
