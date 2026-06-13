# ─────────────────────────────────────────────────────────────────────────────
# FIXES APPLIED IN THIS FILE
#
#  #6  All assessment routes were completely unauthenticated
#      Old: no Depends(require_user) on any route, so any anonymous caller
#      could list assessments, fetch questions, or submit arbitrary answers.
#      Fix: every route handler now declares `current_user: dict =
#      Depends(require_user)`. The middleware validates the Bearer token and
#      injects the decoded user payload; a missing or invalid token raises 401
#      before the handler body runs.
# ─────────────────────────────────────────────────────────────────────────────

"""Assessment routes — list, fetch, attempt, submit."""

from fastapi import APIRouter, Depends
from controllers import assessment_controller

# FIX #6 – import the auth dependency
from middleware.auth_middleware import require_user

router = APIRouter()


# ── GET /api/assessments/ ─────────────────────────────────────────────────────
@router.get("/")
async def list_assessments(
    # FIX #6 – require a valid token; 401 if missing or invalid
    current_user: dict = Depends(require_user),
):
    """List all assessments visible to the authenticated user."""
    return await assessment_controller.list_all()


# ── GET /api/assessments/:id ──────────────────────────────────────────────────
@router.get("/{assessment_id}")
async def get_assessment(
    assessment_id: str,
    current_user: dict = Depends(require_user),  # FIX #6
):
    return await assessment_controller.get(assessment_id)


# ── GET /api/assessments/:id/questions ───────────────────────────────────────
@router.get("/{assessment_id}/questions")
async def get_questions(
    assessment_id: str,
    current_user: dict = Depends(require_user),  # FIX #6
):
    return await assessment_controller.get_questions(assessment_id)


# ── POST /api/assessments/:id/start ──────────────────────────────────────────
@router.post("/{assessment_id}/start")
async def start_attempt(
    assessment_id: str,
    payload: dict,
    current_user: dict = Depends(require_user),  # FIX #6
):
    return await assessment_controller.start_attempt(assessment_id, payload)


# ── POST /api/assessments/:id/submit ─────────────────────────────────────────
@router.post("/{assessment_id}/submit")
async def submit_attempt(
    assessment_id: str,
    payload: dict,
    # FIX #6 – pass current_user through to the controller/service so it can
    # verify that the submitting user owns the attempt (see FIX #7 below)
    current_user: dict = Depends(require_user),
):
    return await assessment_controller.submit_attempt(
        assessment_id, payload, current_user
    )


# ── GET /api/assessments/:id/answer-key ──────────────────────────────────────
@router.get("/{assessment_id}/answer-key")
async def get_answer_key(
    assessment_id: str,
    current_user: dict = Depends(require_user),
):
    return await assessment_controller.get_answer_key(assessment_id, current_user)
