"""Independent Automated Stock Alerting Service."""

from alert_service.detector import AlertDetector, evaluate_inventory_alerts

__all__ = ["AlertDetector", "evaluate_inventory_alerts"]
