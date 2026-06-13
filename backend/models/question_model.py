"""Pydantic question model placeholder."""
from pydantic import BaseModel
from typing import List, Optional


class Question(BaseModel):
    id: Optional[str] = None
    assessment_id: str
    section: str
    text: str
    options: List[str]
    answer: int  # index of correct option
