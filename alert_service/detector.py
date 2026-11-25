"""Alert detector orchestrating rule evaluation and alert persistence."""

from dataclasses import dataclass
from typing import List, Tuple

from sqlalchemy.orm import Session

from alert_service import alert_repository
from alert_service.rules import AlertEvaluationInput, evaluate_all_rules
from app.config import get_settings
from app.models.alert import Alert


@dataclass
class AlertDetectionResult:
    """Result returned after evaluating an inventory record."""

    created_alerts: List[Alert]
    resolved_alerts: List[Alert]


class AlertDetector:
    """Evaluates stock rules for an inventory record and persists state changes."""

    def __init__(self, window_hours: int = 24, fast_depletion_ratio: float = 0.5) -> None:
        self.window_hours = window_hours
        self.fast_depletion_ratio = fast_depletion_ratio

    def evaluate(self, db: Session, inventory_id: int) -> AlertDetectionResult:
        """Run alert rules for the given inventory ID and sync ACTIVE/RESOLVED alerts."""
        inventory = alert_repository.get_inventory_with_relations(db, inventory_id)
        if inventory is None:
            return AlertDetectionResult(created_alerts=[], resolved_alerts=[])

        recent_outbound = alert_repository.get_recent_outbound_total(
            db,
            inventory_id=inventory.id,
            window_hours=self.window_hours,
        )

        eval_input = AlertEvaluationInput(
            inventory_id=inventory.id,
            product_name=inventory.product.name,
            product_sku=inventory.product.sku,
            warehouse_name=inventory.warehouse.name,
            current_quantity=inventory.quantity,
            minimum_stock=inventory.product.minimum_stock,
            recent_outbound_total=recent_outbound,
            window_hours=self.window_hours,
            fast_depletion_ratio=self.fast_depletion_ratio,
        )

        triggered = evaluate_all_rules(eval_input)
        triggered_types = {item.alert_type for item in triggered}

        created_alerts: List[Alert] = []
        for item in triggered:
            created = alert_repository.create_alert_if_not_active(
                db,
                inventory_id=inventory.id,
                alert_type=item.alert_type,
                message=item.message,
            )
            if created is not None:
                loaded = alert_repository.get_alert_by_id(db, created.id)
                if loaded is not None:
                    created_alerts.append(loaded)

        # Auto-resolve stock-level alerts when stock recovers.
        resolved_alerts: List[Alert] = []
        for clearable_type in ("OUT_OF_STOCK", "LOW_STOCK"):
            if clearable_type not in triggered_types:
                resolved = alert_repository.auto_resolve_alert(db, inventory.id, clearable_type)
                if resolved is not None:
                    loaded = alert_repository.get_alert_by_id(db, resolved.id)
                    if loaded is not None:
                        resolved_alerts.append(loaded)

        return AlertDetectionResult(
            created_alerts=created_alerts,
            resolved_alerts=resolved_alerts,
        )


def evaluate_inventory_alerts(db: Session, inventory_id: int) -> Tuple[List[Alert], List[Alert]]:
    """Convenience function configured from application settings."""
    settings = get_settings()
    detector = AlertDetector(
        window_hours=settings.FAST_DEPLETION_WINDOW_HOURS,
        fast_depletion_ratio=settings.FAST_DEPLETION_THRESHOLD_RATIO,
    )
    result = detector.evaluate(db, inventory_id)
    return result.created_alerts, result.resolved_alerts
