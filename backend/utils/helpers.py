"""Generic helper functions."""
from datetime import datetime


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def percent(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return round(100.0 * numerator / denominator, 2)
