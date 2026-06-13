import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth.js";
import { supabase } from "../lib/supabase.js";
import { assessmentApi } from "../api/assessmentApi.js";

const READ_KEY = "assesso_read_notifications";

function loadReadIds() {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(set) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

function toDate(v) {
  if (!v) return null;
  const d = new Date(String(v).replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

function fmtRelative(date) {
  if (!date) return "";
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const abs = Math.abs(diffMin);

  if (abs < 1) return "just now";
  if (abs < 60) return diffMin > 0 ? `in ${abs} min` : `${abs} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return diffHr > 0 ? `in ${diffHr} hr` : `${Math.abs(diffHr)} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  return diffDay > 0 ? `in ${diffDay} day${diffDay !== 1 ? "s" : ""}` : `${Math.abs(diffDay)} day${Math.abs(diffDay) !== 1 ? "s" : ""} ago`;
}

/**
 * Derives a notification feed from existing assessments + attempt data —
 * no dedicated notifications table required.
 *
 * Notification types:
 *  - "starting_soon": a live/upcoming assessment the user can enter soon
 *  - "deadline": an in-progress attempt whose assessment is closing soon
 *  - "result": a recently completed attempt with its score
 *  - "new": a newly published assessment the user hasn't attempted
 */
export function useNotifications() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [readIds, setReadIds] = useState(loadReadIds);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      try {
        setLoading(true);
        const [allAssessments, attemptRes] = await Promise.all([
          assessmentApi.getAssessments().catch(() => []),
          supabase
            .from("assessment_attempts")
            .select("assessment_id, status, score, submitted_at, answers")
            .eq("user_id", user.id),
        ]);

        if (!active) return;
        setAssessments(allAssessments || []);
        setAttempts(attemptRes?.data || []);
      } catch (err) {
        console.error("Notifications load error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const notifications = useMemo(() => {
    const now = Date.now();
    const attemptMap = {};
    attempts.forEach((a) => {
      attemptMap[a.assessment_id] = a;
    });

    const items = [];

    assessments.forEach((a) => {
      const attempt = attemptMap[a.id];
      const start = toDate(a.start_datetime);
      const end = toDate(a.end_datetime);
      const title = a.title || `${a.assessment_type || "Assessment"} — ${a.unit || ""}`;

      // Result ready
      if (attempt?.status === "completed" && attempt.submitted_at) {
        const submitted = toDate(attempt.submitted_at);
        const total = attempt.answers ? Object.keys(attempt.answers).length : 0;
        const pct = total > 0 ? Math.round((attempt.score / total) * 100) : null;
        items.push({
          id: `result-${a.id}`,
          type: "result",
          title: `Result available: ${title}`,
          body: pct !== null ? `You scored ${attempt.score}/${total} (${pct}%)` : "Your result is ready to view.",
          time: submitted,
          link: `/results/${a.id}`,
          priority: 2,
        });
        return;
      }

      // Deadline approaching for in-progress attempts
      if (attempt?.status === "in_progress" && end && end.getTime() > now) {
        const minsLeft = (end.getTime() - now) / 60000;
        if (minsLeft <= 60) {
          items.push({
            id: `deadline-${a.id}`,
            type: "deadline",
            title: `Closing soon: ${title}`,
            body: `This assessment closes ${fmtRelative(end)}. Resume to finish in time.`,
            time: end,
            link: `/assessments/${a.id}/attempt`,
            priority: 0,
          });
          return;
        }
      }

      // Skip if already completed/handled
      if (attempt?.status === "completed") return;

      // Starting soon / live now
      if (start) {
        const minsToStart = (start.getTime() - now) / 60000;
        if (end && end.getTime() < now) return; // expired, nothing to notify

        if (minsToStart <= 0 && (!end || end.getTime() > now)) {
          items.push({
            id: `live-${a.id}`,
            type: "starting_soon",
            title: `Live now: ${title}`,
            body: "This assessment is open — start it before it closes.",
            time: start,
            link: `/assessments/${a.id}/instructions`,
            priority: 1,
          });
        } else if (minsToStart > 0 && minsToStart <= 24 * 60) {
          items.push({
            id: `soon-${a.id}`,
            type: "starting_soon",
            title: `Starting soon: ${title}`,
            body: `Opens ${fmtRelative(start)}.`,
            time: start,
            link: `/assessments`,
            priority: 3,
          });
        } else if (a.is_published && minsToStart > 24 * 60) {
          // Newly published, further out
          items.push({
            id: `new-${a.id}`,
            type: "new",
            title: `New assessment: ${title}`,
            body: `Scheduled for ${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}.`,
            time: start,
            link: `/assessments`,
            priority: 4,
          });
        }
      }
    });

    // Sort: priority first (urgent on top), then soonest time
    items.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      const at = a.time ? a.time.getTime() : 0;
      const bt = b.time ? b.time.getTime() : 0;
      return Math.abs(at - now) - Math.abs(bt - now);
    });

    return items.slice(0, 12).map((item) => ({
      ...item,
      timeLabel: fmtRelative(item.time),
      read: readIds.has(item.id),
    }));
  }, [assessments, attempts, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  };

  const markAllAsRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveReadIds(next);
      return next;
    });
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
