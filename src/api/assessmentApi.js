// ─────────────────────────────────────────────────────────────────────────────
// FIXES APPLIED IN THIS FILE
//
//  #4  All fetch() calls sent no Authorization header
//      Old: every GET/POST to the FastAPI backend omitted the token, so the
//      backend's require_user middleware would reject them with 401.
//      Fix: added a getAuthHeader() helper that reads the current Supabase
//      session and injects `Authorization: Bearer <token>` on every request.
//
//  #9  Mixed data layers (fetch vs Supabase direct)
//      Old: getAssessment/getAssessments used raw fetch() against FastAPI
//      while submitAttempt called Supabase directly, making it unclear which
//      layer owns each resource.
//      Fix: all writes (submitAttempt / submitAssessment) now go through the
//      FastAPI backend so auth, validation, and business logic live in one
//      place. The Supabase client is only used here for the session token.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "../lib/supabase.js";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

// ─── FIX #4 ──────────────────────────────────────────────────────────────────
// Reads the active Supabase session and returns an Authorization header object.
// Throws if there is no session so callers fail fast with a clear message.
async function getAuthHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No active session – please log in again.");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
  
}

export const assessmentApi = {
  // ── GET /api/assessments/ ───────────────────────────────────────────────
  getAssessments: async () => {
    // FIX #4 – attach auth header
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/assessments/`, { headers });

    if (!res.ok) throw new Error("Failed to load assessments");
    return res.json();
  },

  // ── GET /api/assessments/:id ────────────────────────────────────────────
  getAssessment: async (id) => {
    // FIX #4 – attach auth header
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/assessments/${id}`, { headers });

    if (!res.ok) throw new Error("Failed to load assessment");
    return res.json();
  },

  // ── GET /api/assessments/:id/questions ──────────────────────────────────
  getQuestions: async (id) => {
    // FIX #4 – attach auth header
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/assessments/${id}/questions`, {
      headers,
    });

    if (!res.ok) throw new Error("Failed to load questions");
    return res.json();
  },

  // ── POST /api/assessments/:id/submit ────────────────────────────────────
  // FIX #9 – route the submission through FastAPI (not Supabase directly)
  // so that scoring, ownership checks, and auth all happen server-side.
  submitAssessment: async (assessmentId, answers) => {
    // FIX #4 – attach auth header
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers,
      body: JSON.stringify({ answers }),
    });

    if (!res.ok) throw new Error("Failed to submit assessment");
    return res.json();
  },

  // ── POST /api/assessments/:id/start ─────────────────────────────────────
  // FIX #9 – previously called Supabase directly from the service layer;
  // now goes through the backend so the server can own attempt creation.
  startAttempt: async (assessmentId) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/assessments/${assessmentId}/start`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });

    if (!res.ok) throw new Error("Failed to start attempt");
    return res.json();
  },

  // ── GET /api/assessments/:id/answer-key ─────────────────────────────────
  getAnswerKey: async (id) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/assessments/${id}/answer-key`, { headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = new Error(body.detail || "Failed to load answer key");
      err.status = res.status;
      throw err;
    }
    return res.json();
  },
};