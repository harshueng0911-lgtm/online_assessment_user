# ─────────────────────────────────────────────────────────────────────────────
# FIXES APPLIED IN THIS FILE
#
#  #7  submit_attempt now forwards current_user so the service can verify
#      that the submitting user owns the attempt (FIX #7 in assessment_service).
# ─────────────────────────────────────────────────────────────────────────────

"""Assessment controller."""

from services import assessment_service


async def list_all():
    return assessment_service.list_assessments()


async def get(assessment_id: str):
    return assessment_service.get_assessment(assessment_id)


async def get_questions(assessment_id: str):
    return assessment_service.get_assessment_questions(assessment_id)


async def start_attempt(assessment_id: str, payload: dict):
    # Stub — a real implementation would create the attempt row here
    # (currently handled client-side in AssessmentInstructions.jsx)
    return {"attempt_id": "stub-attempt-id", "assessment_id": assessment_id}


async def submit_attempt(
    assessment_id: str,
    payload: dict,
    # FIX #7 – receive the authenticated user from the route
    current_user: dict,
):
    user_id = current_user.get("sub") or current_user.get("id")
    # FIX #7 – forward user_id so the service can verify ownership
    return assessment_service.submit_attempt(assessment_id, payload, user_id)


async def get_answer_key(assessment_id: str, current_user: dict):
    from fastapi import HTTPException
    user_id = current_user.get("sub") or current_user.get("id")
    try:
        return assessment_service.get_answer_key(assessment_id, user_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
