import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Trophy,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Calendar,
  BookOpen,
  AlertCircle,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAuth } from "../../hooks/useAuth.js";
import { supabase } from "../../lib/supabase.js";
import { assessmentApi } from "../../api/assessmentApi.js";
import { ROUTES } from "../../constants/index.js";
import AnalyticsCard from "../../components/common/AnalyticsCard.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(dtRaw) {
  if (!dtRaw) return "—";
  try {
    return new Date(String(dtRaw).replace(" ", "T")).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function fmtShort(dtRaw) {
  if (!dtRaw) return "";
  try {
    return new Date(String(dtRaw).replace(" ", "T")).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "";
  }
}

function calcStatus(a) {
  if (!a.is_published) return "draft";
  const now = Date.now();
  const start = a.start_datetime ? new Date(String(a.start_datetime).replace(" ", "T")).getTime() : null;
  const end = a.end_datetime ? new Date(String(a.end_datetime).replace(" ", "T")).getTime() : null;
  if (start && now < start) return "upcoming";
  if (end && now > end) return "expired";
  return "live";
}

// ── Status badge colours ────────────────────────────────────────────────────
const statusStyle = {
  upcoming: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  live:     "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  expired:  "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  draft:    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

// ── Empty states ────────────────────────────────────────────────────────────
function EmptyCard({ message }) {
  return (
    <div className="card-elev rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-center text-slate-400">
      <FileText className="h-8 w-8 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── Custom chart tooltip ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="card-elev rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{p.title}</p>
      <p className="text-slate-500 mt-0.5">{p.date}</p>
      <p className="mt-1 font-mono font-bold text-brand-600">{p.score}%</p>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function CandidateDashboard() {
  const { user } = useAuth();

  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]); // raw attempt rows
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      try {
        setLoading(true);

        // 1. All published assessments
        const allAssessments = await assessmentApi.getAssessments();

        // 2. This user's attempts (status + score)
        const { data: attemptRows, error: attErr } = await supabase
          .from("assessment_attempts")
          .select("assessment_id, status, score, submitted_at, answers")
          .eq("user_id", user.id)
          .order("submitted_at", { ascending: false });

        if (attErr) throw attErr;

        setAssessments(allAssessments || []);
        setAttempts(attemptRows || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.id]);

  // ── Derived data ─────────────────────────────────────────────────────────

  // Map assessment_id → attempt
  const attemptMap = {};
  attempts.forEach((a) => { attemptMap[a.assessment_id] = a; });

  // Assessments enriched with live status
  const enriched = assessments.map((a) => ({
    ...a,
    _status: calcStatus(a),
    _attempt: attemptMap[a.id] || null,
  }));

  // Upcoming = not yet started AND user hasn't completed them
  const upcoming = enriched
    .filter((a) => a._status === "upcoming" || a._status === "live")
    .filter((a) => !a._attempt || a._attempt.status !== "completed")
    .slice(0, 3);

  // Completed attempts (with assessment info merged)
  const completedAttempts = attempts
    .filter((att) => att.status === "completed")
    .map((att) => {
      const assessment = assessments.find((a) => a.id === att.assessment_id);
      return { ...att, assessment };
    })
    .filter((att) => att.assessment); // skip if assessment deleted

  const recentAttempts = completedAttempts.slice(0, 5);

  const completedCount = attempts.filter((a) => a.status === "completed").length;

  // Avg score across completed attempts (score is count of correct answers,
  // so we compute percentage using the assessment's question count from
  // the attempt's answers object as a proxy when total_questions isn't stored)
  const scoredAttempts = completedAttempts
    .map((att) => {
      const total = att.answers ? Object.keys(att.answers).length : 0;
      if (!total) return null;
      return {
        ...att,
        total,
        pct: Math.round((att.score / total) * 100),
      };
    })
    .filter(Boolean);

  const avgScore =
    scoredAttempts.length === 0
      ? 0
      : Math.round(scoredAttempts.reduce((sum, a) => sum + a.pct, 0) / scoredAttempts.length);

  const bestScore = scoredAttempts.length === 0 ? 0 : Math.max(...scoredAttempts.map((a) => a.pct));

  // Chart data: chronological order, oldest -> newest, last 8 attempts
  const chartData = [...scoredAttempts]
    .filter((a) => a.submitted_at)
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
    .slice(-8)
    .map((a) => ({
      title: a.assessment?.title || a.assessment?.assessment_type || "Assessment",
      date: fmtShort(a.submitted_at),
      score: a.pct,
    }));

  // Trend: compare last two scores
  const trend =
    chartData.length >= 2 ? chartData[chartData.length - 1].score - chartData[chartData.length - 2].score : 0;

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Candidate";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 text-white p-8 shadow-xl shadow-brand-900/20"
      >
        <div className="absolute inset-0 bg-grid-dark bg-[size:32px_32px] opacity-30" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-accent-400/20 blur-3xl animate-float-delay" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-white/70 text-sm flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Welcome back, {displayName} 👋
            </h1>
            <p className="mt-2 text-white/80 max-w-xl">
              {loading
                ? "Loading your assessments…"
                : upcoming.length > 0
                ? `You have ${upcoming.length} upcoming assessment${upcoming.length > 1 ? "s" : ""}. Keep your streak going.`
                : completedCount > 0
                ? `You've completed ${completedCount} assessment${completedCount > 1 ? "s" : ""}. Great work!`
                : "No assessments scheduled yet. Browse available ones below."}
            </p>
          </div>
          <Link
            to={ROUTES.ASSESSMENTS}
            className="btn bg-white text-brand-700 hover:bg-slate-100 hover:-translate-y-0.5 shrink-0 rounded-xl shadow-lg"
          >
            Browse assessments <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stats cards ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <AnalyticsCard
          icon={Clock}
          label="Upcoming"
          value={loading ? "…" : upcoming.length}
          hint="Next 30 days"
          accent="brand"
        />
        <AnalyticsCard
          icon={CheckCircle2}
          label="Completed"
          value={loading ? "…" : completedCount}
          hint="All-time"
          accent="emerald"
        />
        <AnalyticsCard
          icon={Trophy}
          label="Avg. Score"
          value={loading ? "…" : completedCount === 0 ? "—" : `${avgScore}%`}
          hint={
            loading || chartData.length < 2
              ? "Across attempts"
              : trend > 0
              ? `▲ ${trend}% vs last attempt`
              : trend < 0
              ? `▼ ${Math.abs(trend)}% vs last attempt`
              : "No change vs last attempt"
          }
          accent="amber"
        />
        <AnalyticsCard
          icon={TrendingUp}
          label="Best Score"
          value={loading ? "…" : completedCount === 0 ? "—" : `${bestScore}%`}
          hint={`${attempts.length} total attempt${attempts.length !== 1 ? "s" : ""}`}
          accent="rose"
        />
      </div>

      {/* ── Score trend chart ── */}
      <div className="card-elev rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-500" />
            Score trend
          </h2>
          {chartData.length > 0 && (
            <span className="text-xs text-slate-500">Last {chartData.length} attempts</span>
          )}
        </div>

        {loading ? (
          <div className="h-56 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
        ) : chartData.length === 0 ? (
          <EmptyCard message="Complete an assessment to see your score trend." />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-slate-400"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-slate-400"
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fill="url(#scoreFill)"
                  dot={{ r: 3, stroke: "#2563EB", strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Upcoming assessments ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-500" />
              Upcoming assessments
            </h2>
            <Link
              to={ROUTES.ASSESSMENTS}
              className="text-sm text-brand-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-elev rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyCard message="No upcoming assessments right now. Check back later." />
          ) : (
            upcoming.map((a) => {
              const attempt = a._attempt;
              const isLive = a._status === "live";
              const canEnter =
                isLive ||
                (a._status === "upcoming" &&
                  a.start_datetime &&
                  new Date(String(a.start_datetime).replace(" ", "T")).getTime() - Date.now() <
                    15 * 60 * 1000);

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-elev rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.assessment_type && (
                        <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                          {a.assessment_type}
                        </span>
                      )}
                      {a.unit && (
                        <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {a.unit}
                        </span>
                      )}
                      <span className={`badge ${statusStyle[a._status] || statusStyle.draft}`}>
                        {isLive ? "Live now" : a._status}
                      </span>
                    </div>

                    <h3 className="mt-2 font-semibold truncate">
                      {a.title || `${a.assessment_type} — ${a.subject_id || ""}`}
                    </h3>

                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      {a.duration_minutes && (
                        <span>{a.duration_minutes} min</span>
                      )}
                      {a.year && <span>Year {a.year} · Sem {a.semester}</span>}
                      {a.department && <span>{a.department}</span>}
                      <span>Starts {fmt(a.start_datetime)}</span>
                    </div>

                    {attempt?.status === "in_progress" && (
                      <p className="mt-1 text-xs text-amber-600 font-medium">
                        In progress — resume where you left off
                      </p>
                    )}
                  </div>

                  {attempt?.status === "in_progress" ? (
                    <Link
                      to={`/assessments/${a.id}/attempt`}
                      className="btn-primary shrink-0 text-sm rounded-xl"
                    >
                      Resume
                    </Link>
                  ) : canEnter ? (
                    <Link
                      to={`/assessments/${a.id}/instructions`}
                      className="btn-primary shrink-0 text-sm rounded-xl"
                    >
                      Start
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400 shrink-0">
                      Opens {fmt(a.start_datetime)}
                    </span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* ── Recent activity ── */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-500" />
            Recent activity
          </h2>

          {loading ? (
            <div className="card-elev rounded-2xl p-5 space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          ) : recentAttempts.length === 0 ? (
            <EmptyCard message="Complete an assessment to see your results here." />
          ) : (
            <div className="card-elev rounded-2xl p-5 space-y-4">
              {recentAttempts.map((att) => {
                const total = att.answers ? Object.keys(att.answers).length : 0;
                const pct = total > 0 ? Math.round((att.score / total) * 100) : 0;
                const title =
                  att.assessment?.title ||
                  att.assessment?.assessment_type ||
                  "Assessment";

                return (
                  <div key={att.assessment_id}>
                    <div className="flex items-center justify-between text-sm gap-2">
                      <span className="font-medium truncate">{title}</span>
                      <span className="font-mono font-bold text-brand-600 shrink-0">
                        {att.score}/{total}
                        <span className="text-slate-400 font-normal ml-1">
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <ProgressBar value={pct} className="mt-2" />
                    {att.submitted_at && (
                      <p className="text-xs text-slate-400 mt-1">
                        Submitted {fmt(att.submitted_at)}
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Link
                        to={`/results/${att.assessment_id}`}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Result
                      </Link>
                      <span className="text-slate-300">·</span>
                      <Link
                        to={`/results/${att.assessment_id}/key`}
                        className="text-xs text-slate-500 hover:underline"
                      >
                        Answer Key
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── All assessments summary ── */}
          {!loading && enriched.length > 0 && (
            <div className="card-elev rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Assessment overview
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total published</span>
                  <span className="font-semibold">{enriched.filter(a => a.is_published).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Live now</span>
                  <span className="font-semibold text-emerald-600">
                    {enriched.filter(a => a._status === "live").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Upcoming</span>
                  <span className="font-semibold text-blue-600">
                    {enriched.filter(a => a._status === "upcoming").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Completed by you</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {completedCount}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
