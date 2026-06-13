// ─────────────────────────────────────────────────────────────────────────────
// BUGS FIXED IN THIS FILE
//
//  BUG A — Root cause: started_at timezone parsing (the auto-submit bug)
//    The `started_at` value stored in Supabase is a UTC timestamp WITHOUT a
//    timezone suffix, e.g. "2026-06-12T12:43:47.378". When JavaScript's
//    `new Date()` sees a string with no suffix it treats it as LOCAL time in
//    most browsers (Chrome, Edge, Safari). You are in IST (UTC+5:30), so JS
//    read 12:43 as IST, which is actually 07:13 UTC — 5.5 hours earlier than
//    intended. With a 15-minute duration, examEnd was computed 5h 15min in
//    the past, giving DIFF MS: -18904474 and remaining = 0 immediately.
//    FIX: always append "Z" to the stored timestamp before parsing so JS
//    treats it as UTC regardless of the user's local timezone.
//
//  BUG B — Timer component called onExpire() on mount when left starts at 0
//    Because remaining = 0 (from Bug A), the Timer component mounted with
//    `left = 0`, immediately entered its `left <= 0` branch, and called
//    `onExpire()` before the user had answered a single question.
//    FIX: guard inside Timer — only fire onExpire when `left` transitions TO
//    zero from a positive value, not when it starts at zero.
//
//  BUG C — onExpire callback read a stale closure value of remainingSeconds
//    The onExpire arrow function captured `remainingSeconds` from the render
//    when it was first created. It checked `if (remainingSeconds > 0) return`
//    but `remainingSeconds` was always the initial value (0), so the guard
//    never worked. Even if Bug A and B were fixed, this would still cause
//    phantom submits.
//    FIX: the onExpire callback no longer checks remainingSeconds at all.
//    The Timer component is responsible for only calling onExpire once, at
//    actual expiry. The callback just calls submit() directly.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Flag, ChevronLeft, ChevronRight, Eraser, Send } from "lucide-react";
import Timer from "../../components/common/Timer.jsx";
import QuestionCard from "../../components/assessment/QuestionCard.jsx";
import QuestionPalette from "../../components/assessment/QuestionPalette.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { assessmentApi } from "../../api/assessmentApi";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { seededShuffle } from "../../utils/helpers.js";

export default function AssessmentInterface() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visited, setVisited] = useState({});
  const [marked, setMarked] = useState({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  const sections = ["Assessment"];
  const activeSection = questions[current]?.section || "Assessment";

  // Mark question as visited when navigating to it
  useEffect(() => {
    if (!questions.length) return;
    setVisited((v) => ({ ...v, [questions[current].id]: true }));
  }, [current, questions]);

  // Load assessment + attempt on mount
  useEffect(() => {
    async function loadAssessment() {
      if (!user?.id) return;
      try {
        setLoading(true);

        const { data: existingAttempt } = await supabase
          .from("assessment_attempts")
          .select("*")
          .eq("assessment_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existingAttempt) {
          toast.error("Please start the assessment from the instructions page");
          navigate(`/assessments/${id}/instructions`);
          return;
        }

        if (existingAttempt.status === "completed") {
          toast.error("You have already completed this assessment");
          navigate(`/results/${id}`);
          return;
        }

        const assessmentData = await assessmentApi.getAssessment(id);
        const now = new Date();
        const startTime = new Date(assessmentData.start_datetime);
        const endTime = new Date(assessmentData.end_datetime);

        if (now < startTime) {
          toast.error("Assessment has not started yet");
          navigate(`/assessments/${id}/instructions`);
          return;
        }

        // ── BUG A FIX (needed early too) ──────────────────────────────────
        const rawStartedAt = existingAttempt.started_at;
        const normalizedStartedAt = rawStartedAt.endsWith("Z")
          ? rawStartedAt
          : rawStartedAt + "Z";
        const startedAt = new Date(normalizedStartedAt);
        const examEndTime = new Date(
          startedAt.getTime() + assessmentData.duration_minutes * 60 * 1000
        );

        // If the attempt's own time window (started_at + duration) OR the
        // overall assessment window has already elapsed, auto-submit the
        // in-progress attempt with whatever answers were saved instead of
        // just bouncing the user away and leaving it stuck "in_progress".
        if (now > endTime || now >= examEndTime) {
          const savedAnswers = existingAttempt.answers || {};
          try {
            const submission = await assessmentApi.submitAssessment(
              id,
              savedAnswers
            );
            await supabase
              .from("assessment_attempts")
              .update({
                answers: savedAnswers,
                score: submission.score,
                total_questions: submission.total_questions,
                submitted_at: new Date().toISOString(),
                status: "completed",
              })
              .eq("assessment_id", id)
              .eq("user_id", user.id);
          } catch (submitErr) {
            console.error("Auto-submit on expiry failed", submitErr);
          }
          toast.error("Time is up. Your assessment was auto-submitted.");
          navigate(`/results/${id}`);
          return;
        }

        setAttempt(existingAttempt);

        if (existingAttempt?.answers) {
          setAnswers(existingAttempt.answers);
        }

        const remaining = Math.max(
          0,
          Math.floor((examEndTime.getTime() - now.getTime()) / 1000)
        );

        setRemainingSeconds(remaining);

        const questionData = await assessmentApi.getQuestions(id);
        const formattedQuestions = questionData.map((q) => ({
          id: q.id,
          section: "Assessment",
          text: q.question,
          options: [q.option_a, q.option_b, q.option_c, q.option_d],
        }));

        // Shuffle question order deterministically per user + assessment so
        // each candidate sees a different sequence, but the same candidate
        // always sees the same order if they reload or resume.
        const shuffledQuestions = seededShuffle(
          formattedQuestions,
          `${user.id}:${id}`
        );

        const formattedAssessment = {
          ...assessmentData,
          company: "Osmania University",
          title: assessmentData.title || assessmentData.file_name,
          durationMin: assessmentData.duration_minutes,
        };

        setAssessment(formattedAssessment);
        setQuestions(shuffledQuestions);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load assessment");
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [id, user?.id]);

  // Auto-save answers every 5 seconds
  useEffect(() => {
    if (!user?.id || !assessment?.id || Object.keys(answers).length === 0) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        await supabase
          .from("assessment_attempts")
          .update({ answers })
          .eq("assessment_id", assessment.id)
          .eq("user_id", user.id);
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [answers, assessment?.id, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Assessment...
      </div>
    );
  }

  if (!assessment || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No Questions Found
      </div>
    );
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const submission = await assessmentApi.submitAssessment(
        assessment.id,
        answers
      );

      const { score, total_questions: totalQuestions, percentage } = submission;

      const { error } = await supabase
        .from("assessment_attempts")
        .update({
          answers,
          score,
          total_questions: totalQuestions,
          submitted_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("assessment_id", assessment.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(`Score: ${score}/${totalQuestions} (${percentage}%)`);
      navigate(`/results/${assessment.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const setAnswer = (i) =>
    setAnswers((a) => ({
      ...a,
      [String(questions[current].id)]: i + 1,
    }));

  const jump = (i) => setCurrent(i);

  const clear = () =>
    setAnswers((a) => {
      const c = { ...a };
      delete c[questions[current].id];
      return c;
    });

  const mark = () =>
    setMarked((m) => ({
      ...m,
      [questions[current].id]: !m[questions[current].id],
    }));

  const next = () => setCurrent((c) => Math.min(c + 1, questions.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <header className="sticky top-0 z-30 glass border-b border-slate-200/60 dark:border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white font-bold">
            A
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 leading-none">{assessment.company}</p>
            <p className="font-semibold truncate text-sm">{assessment.title}</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {remainingSeconds !== null && (
              <Timer
                seconds={remainingSeconds}
                // BUG C FIX: onExpire simply calls submit().
                // No stale-closure check on remainingSeconds needed —
                // the fixed Timer component (below) only fires this once,
                // when the countdown genuinely reaches zero.
                onExpire={submit}
              />
            )}
            <button
              disabled={submitting}
              onClick={() => setConfirmSubmit(true)}
              className="btn-primary text-sm py-2"
            >
              <Send className="h-4 w-4" /> Submit
            </button>
          </div>
        </div>

        <nav className="border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-10 flex items-center gap-1 overflow-x-auto text-sm">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => {
                  const idx = questions.findIndex((q) => q.section === s);
                  if (idx >= 0) setCurrent(idx);
                }}
                className={
                  "px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition " +
                  (activeSection === s
                    ? "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")
                }
              >
                {s}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-5">
          <QuestionCard
            index={current}
            question={questions[current]}
            value={answers[String(questions[current].id)]}
            onChange={setAnswer}
          />
          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              <button onClick={prev} disabled={current === 0} className="btn-outline">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button onClick={clear} className="btn-ghost">
                <Eraser className="h-4 w-4" /> Clear
              </button>
              <button onClick={mark} className="btn-ghost">
                <Flag className="h-4 w-4" />{" "}
                {marked[questions[current].id] ? "Unmark" : "Mark for review"}
              </button>
            </div>
            <button
              onClick={next}
              disabled={current === questions.length - 1}
              className="btn-primary"
            >
              Save & Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <aside className="card-elev p-5 h-fit sticky top-32">
          <QuestionPalette
            questions={questions}
            current={current}
            answers={answers}
            visited={visited}
            marked={marked}
            onJump={jump}
          />
        </aside>
      </main>

      <ConfirmDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={() => !submitting && submit()}
        title="Submit assessment?"
        message={`You have answered ${Object.keys(answers).length} of ${questions.length} questions. Are you sure you want to submit?`}
        confirmLabel="Yes, submit"
      />
    </div>
  );
}
