"""Validation helpers — placeholder."""
import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_email(value: str) -> bool:
    return bool(EMAIL_RE.match(value or ""))


def is_strong_password(value: str) -> bool:
    return bool(value and len(value) >= 6)
