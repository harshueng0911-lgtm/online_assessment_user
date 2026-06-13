// ─────────────────────────────────────────────────────────────────────────────
// FIXES APPLIED IN THIS FILE
//
//  #10 submitAttempt had a random-score mock fallback in production code
//      Old: if the API call failed, the service silently returned a fake score
//      (Math.random() * 40 + 60). A transient network error would therefore
//      record a completely fabricated result without the user knowing.
//      Fix: the fallback is removed entirely. Errors now propagate so the
//      calling component can show a real error message to the user.
//
//  #9  Mixed data layers / dead listFromDb alias
//      Old: listFromDb was a duplicate of list() with no difference in
//      behaviour — it just called the same API method. Removed to avoid
//      confusion about which method callers should use.
// ─────────────────────────────────────────────────────────────────────────────

import { assessmentApi } from "../api/assessmentApi.js";

export const assessmentService = {
  // List all assessments visible to the current user.
  list: async () => assessmentApi.getAssessments(),

  // Fetch a single assessment by ID.
  get: async (id) => assessmentApi.getAssessment(id),

  // Submit answers for an assessment attempt.
  // FIX #10 – no mock fallback. If this throws, let it propagate so the UI
  // can show a proper error message rather than recording a fake score.
  submitAttempt: async (assessmentId, answers) =>
    assessmentApi.submitAssessment(assessmentId, answers),

  // Start a new attempt (creates the server-side attempt record).
  startAttempt: async (assessmentId) =>
    assessmentApi.startAttempt(assessmentId),
};
