"""Auth controller — orchestrates auth service calls (placeholder)."""
from services import auth_service


async def login(payload):
    # TODO: validate, call auth_service.authenticate(), return JWT
    return {"access_token": "stub-token", "user": {"email": payload.get("email")}}


async def signup(payload):
    return {"access_token": "stub-token", "user": payload}


async def forgot_password(payload):
    return {"ok": True, "message": "OTP sent (stub)"}


async def reset_password(payload):
    return {"ok": True}
