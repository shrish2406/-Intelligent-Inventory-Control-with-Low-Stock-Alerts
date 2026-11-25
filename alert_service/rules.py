"""Pure rule-based alert evaluation functions.

Keeping rules stateless and decoupled from HTTP routes and ORM persistence
allows future ML-based depletion forecasting rules to be plugged in cleanly.
"""

from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class AlertEvaluationInput:
    """Snapshot of inventory state and recent outbound velocity for rule evaluation."""

    inventory_id: int
    product_name: str
    product_sku: str
    warehouse_name: str
    current_quantity: int
    minimum_stock: int
    recent_outbound_total: int
    window_hours: int
    fast_depletion_ratio: float


@dataclass(frozen=True)
class TriggeredAlert:
    """Represents an alert rule that fired during evaluation."""

    alert_type: str
    message: str


def evaluate_out_of_stock(data: AlertEvaluationInput) -> TriggeredAlert | None:
    """Trigger when available quantity reaches zero."""
    if data.current_quantity == 0:
        return TriggeredAlert(
            alert_type="OUT_OF_STOCK",
            message=(
                f"{data.product_name} ({data.product_sku}) is out of stock "
                f"at {data.warehouse_name}."
            ),
        )
    return None


def evaluate_low_stock(data: AlertEvaluationInput) -> TriggeredAlert | None:
    """Trigger when stock is above zero but at or below minimum threshold."""
    if 0 < data.current_quantity <= data.minimum_stock:
        return TriggeredAlert(
            alert_type="LOW_STOCK",
            message=(
                f"{data.product_name} ({data.product_sku}) at {data.warehouse_name} "
                f"is low ({data.current_quantity} units left, minimum {data.minimum_stock})."
            ),
        )
    return None


def evaluate_fast_depletion(data: AlertEvaluationInput) -> TriggeredAlert | None:
    """
    Trigger when recent outbound volume depletes a large share of available stock.

    Uses the ratio: recent_outbound / (current_quantity + recent_outbound).
    """
    if data.recent_outbound_total <= 0:
        return None

    starting_estimate = data.current_quantity + data.recent_outbound_total
    depletion_ratio = data.recent_outbound_total / starting_estimate
    min_significant_outbound = max(data.minimum_stock, 5)

    if (
        depletion_ratio >= data.fast_depletion_ratio
        and data.recent_outbound_total >= min_significant_outbound
    ):
        pct = round(depletion_ratio * 100)
        return TriggeredAlert(
            alert_type="FAST_DEPLETION",
            message=(
                f"Fast depletion detected for {data.product_name} ({data.product_sku}) "
                f"at {data.warehouse_name}: {data.recent_outbound_total} units shipped "
                f"in the last {data.window_hours}h ({pct}% depletion)."
            ),
        )
    return None


def evaluate_all_rules(data: AlertEvaluationInput) -> List[TriggeredAlert]:
    """Run all configured stock alert rules and return triggered alerts."""
    rules = (
        evaluate_out_of_stock,
        evaluate_low_stock,
        evaluate_fast_depletion,
    )
    triggered: List[TriggeredAlert] = []
    for rule in rules:
        result = rule(data)
        if result is not None:
            triggered.append(result)
    return triggered
