# ─────────────────────────────────────────────────────────────────────────────
# FIXES APPLIED IN THIS FILE
#
#  #5  CORS wildcard allow_origins combined with allow_credentials=True
#      Old: allow_origins=["*"] is both insecure and technically invalid when
#      allow_credentials=True. Browsers reject credentialed requests to wildcard
#      origins per the CORS spec, so cookies/auth headers would silently fail.
#      Fix: read the allowed origins from the CORS_ORIGINS environment variable
#      (comma-separated list). Falls back to localhost for local development.
#      Set CORS_ORIGINS=https://yourapp.com in production.
# ─────────────────────────────────────────────────────────────────────────────

"""Assesso backend — FastAPI entrypoint.

Run locally:
    uvicorn main:app --reload --port 8000
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import auth_routes, assessment_routes, user_routes

app = FastAPI(title="Assesso API", version="0.1.0")

# ─── FIX #5 ──────────────────────────────────────────────────────────────────
# Read allowed origins from the environment so production can lock this down to
# the real frontend domain(s) without touching code.
#
# Example .env entry:
#   CORS_ORIGINS=https://assesso.example.com,https://www.assesso.example.com
#
# For local development the default is http://localhost:8082 (Vite default).
_raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:8082,http://127.0.0.1:8082,https://online-assessment-user.vercel.app"
)

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in _raw_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    # FIX #5 – explicit list; never "*" when credentials are involved
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_routes.router,       prefix="/api/auth",        tags=["auth"])
app.include_router(assessment_routes.router, prefix="/api/assessments", tags=["assessments"])
app.include_router(user_routes.router,       prefix="/api/users",       tags=["users"])


@app.get("/")
def root():
    return {"name": "Assesso API", "status": "ok"}
