// ─────────────────────────────────────────────────────────────────────────────
// BUGS FIXED IN THIS FILE
//
//  BUG B — Timer fired onExpire() immediately when initialized with 0 seconds
//    Old: the useEffect ran `if (left <= 0) { onExpire?.(); return; }` on
//    every render including the very first one. So if `remaining` was
//    calculated as 0 (due to the timezone bug in AssessmentInterface), the
//    timer called onExpire() and submitted the assessment instantly on mount.
//
//    Fix 1: only call onExpire when `left` transitions FROM a positive value
//    TO zero — not when it starts at zero. We track this with a `hasStarted`
//    ref that is set to true only after the first tick from a positive value.
//
//    Fix 2: wrap onExpire in a ref so the callback is always current and
//    we never capture a stale closure. This also prevents the effect from
//    re-running every render just because the parent re-created the function.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { Timer as TimerIcon } from "lucide-react";

export default function Timer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);

  // Sync if the parent passes a new `seconds` value (e.g. after data loads)
  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);

  // BUG B FIX 1 — track whether the timer has ever been positive so we don't
  // fire onExpire when it is initialised at 0.
  const hasStartedRef = useRef(seconds > 0);

  // BUG B FIX 2 — keep onExpire in a ref so the interval never captures a
  // stale closure and the effect doesn't restart every render.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    // Update hasStarted the first time we see a positive value
    if (left > 0) {
      hasStartedRef.current = true;
    }

    // Only fire onExpire when the timer genuinely counts DOWN to zero —
    // not when it starts at zero (which was a symptom of the timezone bug).
    if (left <= 0) {
      if (hasStartedRef.current) {
        onExpireRef.current?.();
      }
      return; // no interval needed
    }

    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [left]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const danger = left < 60;

  return (
    <div
      className={
        "flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-sm " +
        (danger
          ? "bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 animate-pulse"
          : "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-200")
      }
    >
      <TimerIcon className="h-4 w-4" />
      {mm}:{ss}
    </div>
  );
}
