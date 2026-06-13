"""Auth routes — login, signup, password reset (placeholders)."""
from fastapi import APIRouter, HTTPException
from controllers import auth_controller

router = APIRouter()


@router.post("/login")
async def login(payload: dict):
    """POST /api/auth/login — { email, password } -> { access_token, user }"""
    return await auth_controller.login(payload)


@router.post("/signup")
async def signup(payload: dict):
    """POST /api/auth/signup — { name, email, password } -> { access_token, user }"""
    return await auth_controller.signup(payload)


@router.post("/forgot-password")
async def forgot(payload: dict):
    return await auth_controller.forgot_password(payload)


@router.post("/reset-password")
async def reset(payload: dict):
    return await auth_controller.reset_password(payload)
