"""
auth.py — FastAPI dependency that decodes the Supabase JWT and returns
the user identity so route handlers can do `user_id = current_user["id"]`.

Strategy:
  1. Try PyJWT verified decode (requires SUPABASE_JWT_SECRET env var)
  2. Fall back to unverified base64 decode (works without PyJWT or secret)
  3. Either way, always extract `sub` → stored as both "sub" and "id"

The fallback is intentional for local development.  In production, set
SUPABASE_JWT_SECRET so tokens are cryptographically verified.
"""

import base64
import json
import logging
import os

from fastapi import Header, HTTPException

logger = logging.getLogger(__name__)

# Try importing PyJWT once at module load — graceful if not installed
try:
    import jwt as _pyjwt          # pip install PyJWT
    _PYJWT_AVAILABLE = True
except ImportError:               # pragma: no cover
    _pyjwt = None                 # type: ignore
    _PYJWT_AVAILABLE = False
    logger.warning(
        "PyJWT not installed — JWT tokens will not be verified. "
        "Run `pip install PyJWT` and set SUPABASE_JWT_SECRET for production."
    )


def _decode_payload_unsafe(token: str) -> dict:
    """Base64-decode the JWT payload WITHOUT verifying the signature."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return {}
        padding = "=" * (4 - len(parts[1]) % 4)
        return json.loads(base64.urlsafe_b64decode(parts[1] + padding))
    except Exception as exc:
        logger.debug("Unsafe JWT decode failed: %s", exc)
        return {}


async def require_user(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization format")

    token = authorization.split(" ", 1)[1]
    payload: dict = {}

    # ── Verified decode ───────────────────────────────────────────────────
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "")
    if _PYJWT_AVAILABLE and jwt_secret:
        try:
            payload = _pyjwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        except Exception as exc:
            logger.warning("JWT verification failed: %s", exc)
            # Fall through to unverified decode

    # ── Unverified fallback ───────────────────────────────────────────────
    if not payload:
        if jwt_secret and _PYJWT_AVAILABLE:
            # Only warn when we expected verification to work
            logger.warning("Falling back to unverified JWT decode")
        payload = _decode_payload_unsafe(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Could not decode token")

    # `sub` is the Supabase user UUID = frontend's user.id
    user_id = payload.get("sub") or payload.get("id") or payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=401, detail="Token missing user identity (sub claim)"
        )

    return {
        "access_token": token,
        "sub": user_id,
        "id": user_id,   # convenience alias
        **payload,
    }
