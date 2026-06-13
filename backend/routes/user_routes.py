"""User routes — profile and admin candidate management (placeholders)."""
from fastapi import APIRouter
from controllers import user_controller

router = APIRouter()


@router.get("/me")
async def get_me():
    return await user_controller.get_me()


@router.get("/")
async def list_users():
    return await user_controller.list_users()
