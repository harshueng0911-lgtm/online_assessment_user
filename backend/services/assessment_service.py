# ─────────────────────────────────────────────────────────────────────────────
# FIXES APPLIED IN THIS FILE
#
#  #7  submit_attempt did not verify the submitting user owns the attempt
#      Old: the service accepted any answers for any assessment_id without
#      checking that the caller had an active attempt. A bad actor could submit
#      on behalf of another user.
#      Fix: submit_attempt now accepts user_id, queries assessment_attempts for
#      a matching in_progress row owned by that user, and raises a clear error
#      if none is found. It also marks the attempt as completed on success.
#
#  #14 Questions fetched from Google Drive on every in-memory cache miss
#      Old: the cache was module-level dict (or similar) that resets on restart
#      or with multiple Gunicorn workers — Drive was hit repeatedly in prod.
#      Fix: after parsing, questions are written back to Supabase
#      (assessment_uploads.questions_cache column). On the next request the DB
#      row is checked first; Drive is only called if the column is NULL.
#      NOTE: this requires a nullable JSONB column `questions_cache` on the
#      assessment_uploads table. Run:
#        ALTER TABLE assessment_uploads ADD COLUMN IF NOT EXISTS
#          questions_cache JSONB DEFAULT NULL;
# ─────────────────────────────────────────────────────────────────────────────

from database import supabase

from services.drive_service import download_excel
from services.excel_parser import parse_excel

from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Status helper
# ─────────────────────────────────────────────────────────────────────────────

def calculate_status(assessment: dict) -> str:
    now = datetime.now(timezone.utc)

    if not assessment.get("is_published"):
        return "draft"

    start_raw = assessment.get("start_datetime")
    end_raw   = assessment.get("end_datetime")

    start = (
        datetime.fromisoformat(start_raw.replace("Z", "+00:00"))
        if start_raw else None
    )
    end = (
        datetime.fromisoformat(end_raw.replace("Z", "+00:00"))
        if end_raw else None
    )

    if start and now < start:
        return "upcoming"
    if start and end and start <= now <= end:
        return "active"
    if end and now > end:
        return "expired"

    return "active"


# ─────────────────────────────────────────────────────────────────────────────
# Assessments
# ─────────────────────────────────────────────────────────────────────────────

def list_assessments() -> list:
    try:
        res = supabase.table("assessment_uploads").select("*").execute()
        data = res.data or []
        for item in data:
            item["status"] = calculate_status(item)
        return data
    except Exception as e:
        print("LIST ERROR:", e)
        return []


def get_assessment(assessment_id: str) -> dict | None:
    try:
        res = (
            supabase.table("assessment_uploads")
            .select("*")
            .eq("id", assessment_id)
            .execute()
        )
        if not res.data:
            return None
        assessment = res.data[0]
        assessment["status"] = calculate_status(assessment)
        return assessment
    except Exception as e:
        print("GET ERROR:", repr(e))
        raise


# ─────────────────────────────────────────────────────────────────────────────
# Questions  (FIX #14 — persistent DB cache)
# ─────────────────────────────────────────────────────────────────────────────

def get_assessment_questions(assessment_id: str) -> list:
    """
    Returns parsed questions for the assessment.

    Cache strategy (FIX #14):
      1. Check the `questions_cache` JSONB column on the assessment row.
         If populated, return it immediately — no Drive call.
      2. Otherwise download the Excel from Drive, parse it, write the result
         back to `questions_cache`, then return it.
    This cache survives server restarts and works across Gunicorn workers
    because it lives in Supabase, not process memory.
    """
    assessment = get_assessment(assessment_id)
    if not assessment:
        raise ValueError("Assessment not found")

    # FIX #14 – check the persistent DB cache first
    cached = assessment.get("questions_cache")
    if cached:
        return cached

    file_id = assessment.get("google_drive_file_id")
    if not file_id:
        raise ValueError("Missing Google Drive File ID")

    file_stream = download_excel(file_id)
    questions   = parse_excel(file_stream)

    # FIX #14 – persist parsed questions to Supabase so future requests
    # (on any worker) skip the Drive download entirely
    try:
        supabase.table("assessment_uploads").update(
            {"questions_cache": questions}
        ).eq("id", assessment_id).execute()
    except Exception as e:
        # Non-fatal: still return the questions even if the cache write fails
        print("CACHE WRITE WARNING:", e)

    return questions


# ─────────────────────────────────────────────────────────────────────────────
# Scoring
# ─────────────────────────────────────────────────────────────────────────────

_OPTION_MAP = {1: "A", 2: "B", 3: "C", 4: "D",
               "1": "A", "2": "B", "3": "C", "4": "D"}


def score_attempt(answers: dict, questions: list) -> dict:
    correct = sum(
        1
        for q in questions
        if _OPTION_MAP.get(answers.get(str(q["id"]))) == q["_correct"]
    )
    total = len(questions)
    return {
        "correct_answers": correct,
        "total_questions": total,
        "percentage": round(100 * correct / max(total, 1), 2),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Submit  (FIX #7 — ownership verification)
# ─────────────────────────────────────────────────────────────────────────────

def submit_attempt(assessment_id: str, payload: dict, user_id: str) -> dict:
    """
    Score and finalise an attempt.

    FIX #7: we now require user_id and verify that an in_progress attempt
    belonging to that user exists before accepting the submission.
    This prevents one user from submitting on behalf of another.
    """
    # FIX #7 – look up the attempt and confirm ownership
    attempt_res = (
        supabase.table("assessment_attempts")
        .select("id, status")
        .eq("assessment_id", assessment_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    # .data is always a list — grab the first row
    att_rows = attempt_res.data if attempt_res else []
    attempt = att_rows[0] if att_rows else None

    if not attempt:
        raise PermissionError(
            "No active attempt found for this user and assessment."
        )

    if attempt.get("status") == "completed":
        raise ValueError("This attempt has already been submitted.")

    # Score the answers
    questions = get_assessment_questions(assessment_id)
    answers   = payload.get("answers", {})
    result    = score_attempt(answers, questions)

    # FIX #7 – mark the attempt as completed and record the score
    # NOTE: only update columns that actually exist in assessment_attempts.
    # "total", "percentage", "questions_cache" do NOT exist — omit them.
    supabase.table("assessment_attempts").update(
        {
            "status":         "completed",
            "submitted_at":   datetime.now(timezone.utc).isoformat(),
            "score":          result["correct_answers"],
            "answers":        answers,
        }
    ).eq("id", attempt["id"]).execute()

    return {
        "submitted":       True,
        "score":           result["correct_answers"],
        "total_questions": result["total_questions"],
        "percentage":      result["percentage"],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Answer Key
# ─────────────────────────────────────────────────────────────────────────────

def get_answer_key(assessment_id: str, user_id: str) -> dict:
    """
    Return the answer key payload.  Always returns 200 — the `released` flag
    tells the frontend whether to show questions or the locked countdown.

    Raises PermissionError if the user has no attempt at all.
    Raises ValueError if the assessment doesn't exist.
    """
    # ── 1. Load assessment directly (avoid silent-fail wrapper) ───────────
    try:
        a_res = (
            supabase.table("assessment_uploads")
            .select("id, key_release_datetime")
            .eq("id", assessment_id)
            .limit(1)
            .execute()
        )
        a_rows = a_res.data if a_res else []
        assessment = a_rows[0] if a_rows else None
    except Exception as exc:
        logger.error("get_answer_key: assessment fetch error: %s", exc)
        assessment = None

    if not assessment:
        raise ValueError("Assessment not found")

    # ── 2. Verify user has any attempt (completed or in_progress) ─────────
    # Do NOT select "total" — that column does not exist in the DB.
    try:
        att_res = (
            supabase.table("assessment_attempts")
            .select("id, score, answers, status")
            .eq("assessment_id", assessment_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        att_rows = att_res.data if att_res else []
        attempt = att_rows[0] if att_rows else None
    except Exception as exc:
        logger.error("get_answer_key: attempt fetch error: %s", exc)
        attempt = None

    if not attempt:
        raise PermissionError(
            "No attempt found for this assessment. Complete the assessment first."
        )

    # ── 3. Normalise release datetime to ISO 8601 for JS compatibility ────
    # Postgres returns "2026-06-12 17:55:00+00" (space, not T).
    # JavaScript `new Date("2026-06-12 17:55:00+00")` returns Invalid Date.
    key_release_raw = assessment.get("key_release_datetime")
    release_iso: str | None = None
    if key_release_raw:
        release_iso = (
            str(key_release_raw)
            .replace(" ", "T")           # space → T
            .rstrip("Z")                 # strip any trailing Z first
        )
        # Ensure a UTC offset is present
        if "+" not in release_iso and release_iso[-6] != "+":
            release_iso += "Z"

    # ── 4. Check if key is released ───────────────────────────────────────
    now = datetime.now(timezone.utc)
    key_released = False
    if release_iso:
        try:
            release_dt = datetime.fromisoformat(
                release_iso.replace("Z", "+00:00")
            )
            key_released = now >= release_dt
        except Exception as exc:
            logger.error("get_answer_key: release_dt parse error: %s  raw=%s", exc, key_release_raw)

    score = attempt.get("score") or 0
    base_payload = {
        "released": key_released,
        "release_datetime": release_iso,   # normalised ISO string
        "score": score,
        "total_questions": 0,              # filled below once questions loaded
    }

    if not key_released:
        return base_payload

    # ── 5. Load questions ─────────────────────────────────────────────────
    try:
        questions = get_assessment_questions(assessment_id)
    except Exception as exc:
        logger.error("get_answer_key: questions fetch error: %s", exc)
        return {**base_payload, "questions": [], "total_questions": 0}

    base_payload["total_questions"] = len(questions)

    # ── 6. Build per-question review ───────────────────────────────────────
    user_answers = attempt.get("answers") or {}
    _OPT = {
        "1": "A", "2": "B", "3": "C", "4": "D",
        1: "A",   2: "B",   3: "C",   4: "D",
        "A": "A", "B": "B", "C": "C", "D": "D",
    }

    review = []
    for q in questions:
        q_id = str(q.get("id", ""))
        correct_letter = q.get("_correct", "")
        raw_selected = user_answers.get(q_id)
        selected_letter = _OPT.get(raw_selected) if raw_selected is not None else None

        review.append({
            "id": q_id,
            "question": q.get("question", ""),
            "options": {
                "A": q.get("option_a", ""),
                "B": q.get("option_b", ""),
                "C": q.get("option_c", ""),
                "D": q.get("option_d", ""),
            },
            "correct_option": correct_letter,
            "selected_option": selected_letter,
            "is_correct": bool(selected_letter and selected_letter == correct_letter),
        })

    return {**base_payload, "questions": review}
