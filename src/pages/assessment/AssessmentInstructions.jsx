// ─────────────────────────────────────────────────────────────────────────────
// FIXES APPLIED IN THIS FILE
//
//  #2  isActive window unreachable during grace period
//      Old: isUpcoming was true while now < entryTime (5 min before start),
//      which kept the Start button disabled during that window even though
//      users should be able to enter. Now the button condition uses entryTime
//      (not startTime) so the 5-min grace window unlocks entry correctly.
//
//  #1  Duplicate Supabase query in startAssessment()
//      Old: startAssessment() re-fetched assessment_attempts from Supabase even
//      though loadAssessment() already fetched it and stored the result in the
//      `attempt` state. Now we reuse the cached `attempt` state directly.
//
//  #3  startAssessment() silently swallowed errors
//      Old: the catch block only called console.error(), so a Supabase insert
//      failure would silently navigate the user to a broken attempt page.
//      Now we track an `error` state and render a visible error message.
//
//  #11 rules array recreated on every render
//      Old: the array was declared inside the component body, reallocated on
//      every render, and used array-index keys. Moved outside the component.
//
//  #12 Loading / not-found states used bare unstyled divs
//      Old: <div>Loading...</div> and <div>Assessment not found</div>.
//      Now uses the existing Loader and EmptyState components.
//
//  #13 Timer re-rendered the entire page every second
//      Old: setCurrentTime lived in AssessmentInstructions, causing the whole
//      tree to re-render every second. Extracted into a standalone
//      AssessmentCountdown component so only the clock re-renders.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Clock, ListChecks, ShieldAlert, ArrowRight } from "lucide-react";
import { assessmentApi } from "../../api/assessmentApi";

// FIX #12 – import the existing shared components instead of bare divs
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";

// ─── FIX #11 ────────────────────────────────────────────────────────────────
// Move the static rules array outside the component so it is only created once
// (not on every render) and never needs a key based on a shifting index.
const ASSESSMENT_RULES = [
  "Once started, the timer cannot be paused.",
  "Switching tabs or exiting full-screen will be flagged.",
  "All questions are mandatory unless marked optional.",
  "Use of external tools, mobile phones or notes is strictly prohibited.",
  "Your responses are auto-saved every 5 seconds.",
  "The test will auto-submit when the timer reaches zero.",
];

// ─── FIX #13 ────────────────────────────────────────────────────────────────
// Isolated countdown component. Only this component re-renders every second;
// the parent AssessmentInstructions stays completely still.
function AssessmentCountdown({ targetTime }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(targetTime - now, 0);
  const hours   = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (diff <= 0) return null;

  return (
    <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
      <p className="font-semibold text-amber-700">Assessment starts in</p>
      <p className="text-2xl font-bold mt-1">
        {String(hours).padStart(2, "0")}:
        {String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AssessmentInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [alreadyAttempted, setAlreadyAttempted] = useState(false);

  // FIX #1 – we keep attempt in state so startAssessment() can reuse it
  const [attempt, setAttempt] = useState(null);

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);

  // FIX #3 – surface errors to the user
  const [startError, setStartError] = useState(null);

  // ── Derived time values ────────────────────────────────────────────────────
  // No useState for currentTime here – the parent no longer owns the clock.
  // We only need a snapshot of "now" for the initial status labels; the
  // countdown component handles its own ticking internally.
  const now = new Date();

  const startTime = assessment?.start_datetime
    ? new Date(assessment.start_datetime)
    : null;

  const endTime = assessment?.end_datetime
    ? new Date(assessment.end_datetime)
    : null;

  // FIX #2 – entryTime is 5 minutes before startTime
  const entryTime = startTime
    ? new Date(startTime.getTime() - 5 * 60 * 1000)
    : null;

  // FIX #2 – isUpcoming only while we are before the entry window
  const isUpcoming = entryTime && now < entryTime;

  // FIX #2 – isInEntryWindow covers the 5-min grace period before start
  const isInEntryWindow =
    entryTime && startTime && now >= entryTime && now < startTime;

  const isActive =
    startTime && endTime && now >= startTime && now <= endTime;

  const isExpired = endTime && now > endTime;

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadAssessment() {
      try {
        const data = await assessmentApi.getAssessment(id);
        setAssessment(data);

        const { data: existingAttempt } = await supabase
          .from("assessment_attempts")
          .select("*")
          .eq("assessment_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingAttempt?.status === "completed") {
          setAlreadyAttempted(true);
        }

        // FIX #1 – store the result so startAssessment() can use it
        setAttempt(existingAttempt);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) loadAssessment();
  }, [id, user?.id]);

  // ── Start assessment ───────────────────────────────────────────────────────
  const startAssessment = async () => {
    setStartError(null);
    try {
      // FIX #1 – reuse the `attempt` already in state; no second DB round-trip
      if (!attempt) {
        const { error } = await supabase
          .from("assessment_attempts")
          .insert([
            {
              user_id: user.id,
              assessment_id: id,
              status: "in_progress",
              started_at: new Date().toISOString(),
              answers: {},
            },
          ]);

        // FIX #3 – throw so the catch block can surface it to the user
        if (error) throw error;
      }

      navigate(`/assessments/${id}/attempt`);
    } catch (err) {
      // FIX #3 – show the error instead of silently swallowing it
      console.error(err);
      setStartError("Failed to start the assessment. Please try again.");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  // FIX #12 – use the shared Loader component
  if (loading) return <Loader label="Loading assessment…" />;

  // FIX #12 – use the shared EmptyState component
  if (!assessment) {
    return (
      <EmptyState
        title="Assessment not found"
        description="This assessment doesn't exist or you don't have access to it."
        action={
          <Link to="/assessments" className="btn-primary px-4 py-2 text-sm">
            Back to assessments
          </Link>
        }
      />
    );
  }

  // FIX #2 – the Start button should be enabled during the entry window too
  const canEnter = isInEntryWindow || isActive;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/assessments"
          className="text-sm text-brand-600 hover:underline"
        >
          ← Back to assessments
        </Link>

        <h1 className="mt-3 text-3xl font-display font-bold">
          {assessment.title}
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Year {assessment.year} · Semester {assessment.semester}
        </p>

        {alreadyAttempted && (
          <div className="mt-3 inline-flex items-center rounded-lg bg-green-100 px-3 py-1 text-green-700 font-medium">
            ✓ Assessment Already Completed
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card-elev p-5">
          <Clock className="h-5 w-5 text-brand-500" />
          <p className="mt-3 text-xs text-slate-500 uppercase">
            Assessment Type
          </p>
          <p className="text-xl font-bold">{assessment.assessment_type}</p>
        </div>

        <div className="card-elev p-5">
          <ListChecks className="h-5 w-5 text-brand-500" />
          <p className="mt-3 text-xs text-slate-500 uppercase">Unit</p>
          <p className="text-xl font-bold">{assessment.unit}</p>
        </div>

        <div className="card-elev p-5">
          <ShieldAlert className="h-5 w-5 text-brand-500" />
          <p className="mt-3 text-xs text-slate-500 uppercase">Status</p>
          <p className="text-xl font-bold">
            {isUpcoming
              ? "Upcoming"
              : isInEntryWindow
              ? "Starting soon"
              : isActive
              ? "Active"
              : isExpired
              ? "Expired"
              : assessment.status}
          </p>
        </div>
      </div>

      {/* Rules */}
      <div className="card-elev p-6">
        <h2 className="font-semibold text-lg">Rules and instructions</h2>
        {/* FIX #11 – ASSESSMENT_RULES is defined outside; use rule text as key */}
        <ul className="mt-4 space-y-3 text-sm">
          {ASSESSMENT_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>

      {/* Schedule */}
      <div className="card-elev p-5">
        <h3 className="font-semibold mb-3">Assessment Schedule</h3>

        {/* FIX #13 – countdown is now isolated in its own component */}
        {startTime && now < startTime && (
          <AssessmentCountdown targetTime={startTime.getTime()} />
        )}

        <div className="space-y-2 text-sm mt-3">
          <p>
            <strong>Starts:</strong>{" "}
            {new Date(assessment.start_datetime).toLocaleString()}
          </p>
          <p>
            <strong>Ends:</strong>{" "}
            {new Date(assessment.end_datetime).toLocaleString()}
          </p>
          <p>
            <strong>Duration:</strong> {assessment.duration_minutes} Minutes
          </p>
        </div>
      </div>

      {/* Agreement checkbox */}
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        I have read and agree to the rules listed above.
      </label>

      {/* FIX #3 – render the error message if start failed */}
      {startError && (
        <p className="text-sm text-red-600 text-right">{startError}</p>
      )}

      {/* CTA button */}
      <div className="flex justify-end">
        {alreadyAttempted ? (
          <button
            onClick={() => navigate(`/results/${assessment.id}`)}
            className="btn-primary text-base px-6 py-3"
          >
            View Result
          </button>
        ) : isExpired ? (
          <button
            disabled
            className="btn-outline text-base px-6 py-3 opacity-60"
          >
            Assessment Expired
          </button>
        ) : isUpcoming ? (
          // FIX #2 – disabled only while before the entry window
          <button
            disabled
            className="btn-outline text-base px-6 py-3 opacity-60"
          >
            Starts At {startTime.toLocaleString()}
          </button>
        ) : (
          // FIX #2 – button is active during entry window AND active window
          <button
            disabled={!agreed || !canEnter}
            onClick={startAssessment}
            className="btn-primary text-base px-6 py-3 inline-flex items-center gap-2"
          >
            Start Assessment
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
