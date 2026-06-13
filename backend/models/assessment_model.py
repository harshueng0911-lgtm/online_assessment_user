"""Pydantic assessment model placeholder."""
from pydantic import BaseModel
from typing import List, Optional


class Assessment(BaseModel):
    id: Optional[str] = None
    title: str
    company: str
    category: str
    difficulty: str
    duration_min: int
    sections: List[str] = []
    question_count: int = 0
    description: Optional[str] = None
