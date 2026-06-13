import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { assessmentApi } from "../../api/assessmentApi";

const OPTION_LABELS = ["A", "B", "C", "D"];

/**
 * Parse a date string that may come in Postgres format
 * ("2026-06-12 17:55:00+00") or ISO 8601 ("2026-06-12T17:55:00+00:00").
 * Returns a Date object, or null if parsing fails.
 */
function parseReleaseDt(raw) {
  if (!raw) return null;
  try {
    // Replace space with T so all JS engines can parse it
    const iso = String(raw).replace(" ", "T");
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function buildCountdown(releaseDt, now) {
  if (!releaseDt) return null;
  const diffMs = releaseDt.getTime() - now.getTime();
  if (diffMs <= 0) return null;
  const totalSec = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h > 0 ? `${h}h ` : ""}${m}m ${String(s).padStart(2, "0")}s`;
}

// ── Locked card ─────────────────────────────────────────────────────────────
function LockedCard({ releaseDt, now }) {
  const countdown = buildCountdown(releaseDt, now);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 text-white p-10 text-center"
    >
      <Clock className="h-12 w-12 mx-auto opacity-80" />
      <h1 className="mt-4 text-2xl sm:text-3xl font-display font-bold">
        Answer Key Not Published Yet
      </h1>
      <p className="mt-2 text-white/80">
        The answer key for this assessment hasn't been released by the
        organisation yet.
      </p>

      {releaseDt ? (
        <div className="mt-8 inline-flex flex-col items-center">
          <p className="text-sm text-white/70">Key will be published on</p>
          <p className="mt-1 text-xl sm:text-2xl font-semibold">
            {releaseDt.toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {countdown ? (
            <p className="mt-2 text-sm text-white/70">
              Available in{" "}
              <span className="font-mono font-semibold text-white">
                {countdown}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-emerald-300 font-medium">
              The key should be available now — try refreshing the page.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-6 text-sm text-white/60">
          No release time has been set by the organisation.
        </p>
      )}
    </motion.div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AssessmentKey() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [data, setData] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const result = await assessmentApi.getAnswerKey(id);
        setData(result);
      } catch (err) {
        console.error("getAnswerKey error:", err);
        setError(err.message || "Failed to load answer key");
        setErrorStatus(err.status ?? null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Live countdown — tick every second when key is not yet released
  useEffect(() => {
    const notReleased = (data && !data.released) || (!data && error);
    if (!notReleased) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [data, error]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="text-slate-500 animate-pulse">Loading answer key…</span>
      </div>
    );
  }

  // ── Hard error (not a "key not released" situation) ────────────────────
  if (error) {
    // 403 = user has no attempt yet — show a friendly note, no key details
    if (errorStatus === 403) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 text-white p-10 text-center"
          >
            <AlertCircle className="h-12 w-12 mx-auto opacity-80" />
            <h1 className="mt-4 text-2xl font-display font-bold">
              Assessment Not Completed
            </h1>
            <p className="mt-2 text-white/80">
              You need to complete this assessment before the answer key is
              available to you.
            </p>
          </motion.div>
          <div className="flex justify-end">
            <Link to="/assessments" className="btn-primary">
              Back to assessments <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      );
    }

    // Other errors (network, 500, etc.)
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-500/10 p-6 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">
              Could not load answer key
            </p>
            <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Link to="/assessments" className="btn-primary">
            Back to assessments <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Key not published yet ──────────────────────────────────────────────
  if (!data?.released) {
    const releaseDt = parseReleaseDt(data?.release_datetime);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <LockedCard releaseDt={releaseDt} now={now} />
        <div className="flex justify-end">
          <Link to="/assessments" className="btn-primary">
            Back to assessments <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Key published — full review ────────────────────────────────────────
  const { score, total_questions: totalQuestions, questions = [] } = data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-8 text-center"
      >
        <h1 className="text-2xl sm:text-3xl font-display font-bold">
          Answer Key
        </h1>
        <p className="mt-1 text-white/80">
          Your score:{" "}
          <span className="font-bold text-white text-xl">
            {score}/{totalQuestions}
          </span>
        </p>
      </motion.div>

      {questions.length === 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-500">
          Questions could not be loaded. Please try refreshing the page.
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const correctLetter = q.correct_option;
          const selectedLetter = q.selected_option;

          return (
            <div key={q.id} className="card-elev p-5 sm:p-6">
              {/* Question header */}
              <div className="flex items-center justify-between gap-3">
                <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Question {idx + 1}
                </span>
                {selectedLetter ? (
                  q.is_correct ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <CheckCircle2 className="h-4 w-4" /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                      <XCircle className="h-4 w-4" /> Incorrect
                    </span>
                  )
                ) : (
                  <span className="text-xs text-slate-400 font-medium">
                    Not answered
                  </span>
                )}
              </div>

              {/* Question text */}
              <h2 className="mt-3 text-base sm:text-lg font-semibold leading-relaxed">
                {q.question}
              </h2>

              {/* Options */}
              <div className="mt-4 space-y-2">
                {OPTION_LABELS.map((letter) => {
                  const optionText = q.options?.[letter] ?? "";
                  if (!optionText) return null;

                  const isCorrect = letter === correctLetter;
                  const isSelected = letter === selectedLetter;

                  let style =
                    "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";

                  if (isCorrect) {
                    style =
                      "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
                  } else if (isSelected) {
                    // User chose this wrong option
                    style =
                      "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300";
                  }

                  return (
                    <div
                      key={letter}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${style}`}
                    >
                      <span className="font-semibold w-5 shrink-0">{letter}.</span>
                      <span className="flex-1">{optionText}</span>

                      {isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      )}
                      {isSelected && !isCorrect && (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      {isSelected && (
                        <span className="text-xs font-medium opacity-70 shrink-0">
                          Your answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pb-8">
        <Link to="/assessments" className="btn-primary">
          Back to assessments <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
