"""Pydantic user model placeholder."""
from pydantic import BaseModel, EmailStr
from typing import Literal, Optional


class User(BaseModel):
    id: Optional[str] = None
    name: str
    email: EmailStr
    role: Literal["candidate", "admin"] = "candidate"
