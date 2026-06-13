import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  LayoutGrid,
  CalendarDays,
  ArrowUpDown,
  X,
} from "lucide-react";
import { assessmentService } from "../../services/assessmentService.js";
import EmptyState from "../../components/common/EmptyState.jsx";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

const statusOptions = ["All", "active", "upcoming", "expired", "draft"];
const sortOptions = [
  { value: "start_asc", label: "Start date (soonest)" },
  { value: "start_desc", label: "Start date (latest)" },
  { value: "title_asc", label: "Title (A-Z)" },
];

const statusColor = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  expired: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function fmtDate(d) {
  return new Date(d).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayKey(d) {
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AssessmentList() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("start_asc");
  const [view, setView] = useState("grid"); // "grid" | "calendar"
  const [assessments, setAssessments] = useState([]);
  const { user } = useAuth();

  const [attempts, setAttempts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await assessmentService.list();
        setAssessments(data || []);

        if (user?.id) {
          const { data: attemptRows } = await supabase
            .from("assessment_attempts")
            .select("assessment_id, status")
            .eq("user_id", user.id);

          const map = {};
          (attemptRows || []).forEach((a) => {
            map[a.assessment_id] = a.status;
          });
          setAttempts(map);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.id]);

  // Distinct assessment types for the type filter
  const typeOptions = useMemo(() => {
    const types = new Set();
    assessments.forEach((a) => a.assessment_type && types.add(a.assessment_type));
    return ["All", ...Array.from(types)];
  }, [assessments]);

  // Apply search + filters
  const filtered = useMemo(() => {
    let list = assessments.filter((a) => a.start_datetime && a.end_datetime);

    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(term) ||
          a.assessment_type?.toLowerCase().includes(term) ||
          a.unit?.toLowerCase().includes(term) ||
          a.department?.toLowerCase().includes(term)
      );
    }

    if (status !== "All") {
      list = list.filter((a) => a.status === status);
    }

    if (type !== "All") {
      list = list.filter((a) => a.assessment_type === type);
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sort === "start_asc") return new Date(a.start_datetime) - new Date(b.start_datetime);
      if (sort === "start_desc") return new Date(b.start_datetime) - new Date(a.start_datetime);
      if (sort === "title_asc") return (a.title || "").localeCompare(b.title || "");
      return 0;
    });

    return list;
  }, [assessments, q, status, type, sort]);

  // Group by day for calendar view
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((a) => {
      const key = dayKey(a.start_datetime);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    });
    return Array.from(map.entries()).sort(
      (a, b) => new Date(a[1][0].start_datetime) - new Date(b[1][0].start_datetime)
    );
  }, [filtered]);

  const activeFilterCount = (status !== "All" ? 1 : 0) + (type !== "All" ? 1 : 0) + (q.trim() ? 1 : 0);

  function clearFilters() {
    setQ("");
    setStatus("All");
    setType("All");
    setSort("start_asc");
  }

  function renderActionButton(a) {
    const now = currentTime;
    const startTime = new Date(a.start_datetime);
    const assessmentExpired = now > new Date(a.end_datetime);
    const examEndTime = new Date(a.end_datetime);
    const allowEntry =
      now >= new Date(startTime.getTime() - 5 * 60 * 1000) && now <= examEndTime;

    if (attempts[a.id] === "completed") {
      return (
        <div className="flex items-center gap-2">
          <Link to={`/results/${a.id}`} className="btn-outline text-xs rounded-lg">Result</Link>
          <Link to={`/results/${a.id}/key`} className="btn-primary text-xs rounded-lg">Key</Link>
        </div>
      );
    }
    if (attempts[a.id] === "in_progress") {
      if (assessmentExpired) {
        return (
          <div className="flex items-center gap-2">
            <Link to={`/results/${a.id}`} className="btn-outline text-xs rounded-lg">Result</Link>
            <Link to={`/results/${a.id}/key`} className="btn-primary text-xs rounded-lg">Key</Link>
          </div>
        );
      }
      return (
        <Link to={`/assessments/${a.id}/attempt`} className="btn-primary text-xs rounded-lg">
          Resume
        </Link>
      );
    }
    if (assessmentExpired) {
      return (
        <button disabled className="btn-outline text-xs rounded-lg opacity-60">
          Expired
        </button>
      );
    }
    if (allowEntry) {
      return (
        <Link to={`/assessments/${a.id}/instructions`} className="btn-primary text-xs rounded-lg">
          Start
        </Link>
      );
    }
    return (
      <button disabled className="btn-outline text-xs rounded-lg opacity-60">
        Available 5 Min Before
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Assessments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and start your upcoming hiring assessments.
          </p>
        </div>

        {/* View toggle */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setView("grid")}
            className={
              "px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition " +
              (view === "grid"
                ? "bg-white dark:bg-slate-950 shadow-sm text-brand-700 dark:text-brand-300"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")
            }
          >
            <LayoutGrid className="h-4 w-4" /> Grid
          </button>
          <button
            onClick={() => setView("calendar")}
            className={
              "px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition " +
              (view === "calendar"
                ? "bg-white dark:bg-slate-950 shadow-sm text-brand-700 dark:text-brand-300"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")
            }
          >
            <CalendarDays className="h-4 w-4" /> Calendar
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="card-elev p-4 flex flex-col lg:flex-row gap-3 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9 rounded-xl"
            placeholder="Search by title, unit, or type..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
          <select className="input w-auto rounded-xl" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All statuses" : s}
              </option>
            ))}
          </select>
          <select className="input w-auto rounded-xl" value={type} onChange={(e) => setType(e.target.value)}>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t === "All" ? "All types" : t}
              </option>
            ))}
          </select>
          <div className="relative">
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <select
              className="input w-auto rounded-xl pl-7"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="btn-ghost text-xs rounded-xl flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-slate-500">
          Showing {filtered.length} of {assessments.length} assessment{assessments.length !== 1 ? "s" : ""}
        </p>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-elev p-5 rounded-2xl animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No assessments found"
          description="Try changing your filters or search query."
          action={
            activeFilterCount > 0 && (
              <button onClick={clearFilters} className="btn-outline text-sm rounded-xl">
                Clear filters
              </button>
            )
          }
        />
      ) : view === "grid" ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="group gradient-border hover:shadow-xl hover:shadow-brand-500/10 transition-shadow"
              >
                <div className="gradient-border-inner p-5 flex flex-col h-full rounded-[1.25rem] group-hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex items-center justify-between">
                    <span className={"badge " + (statusColor[a.status] || statusColor.draft)}>{a.status}</span>
                    <span className="text-xs text-slate-500">Osmania University</span>
                  </div>
                  <h3 className="mt-3 font-display font-semibold text-lg">{a.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {a.assessment_type} • Year {a.year} • Semester {a.semester}
                  </p>
                  <div className="mt-4 flex items-center gap-2 flex-wrap text-xs">
                    <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {a.unit}
                    </span>
                    <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {a.assessment_type}
                    </span>
                    <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Year {a.year} · Sem {a.semester}
                    </span>
                  </div>

                  <div className="mt-auto pt-4 mt-5 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between gap-3">
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>Unit: {a.unit}</p>
                      <p>Starts: {fmtDate(a.start_datetime)}</p>
                      <p>Ends: {fmtDate(a.end_datetime)}</p>
                    </div>
                    {renderActionButton(a)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-white grid place-items-center shrink-0">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <h3 className="font-display font-semibold">{day}</h3>
                <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {items.length} assessment{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-3 ml-1 pl-[1.125rem] border-l border-slate-200 dark:border-slate-800">
                {items.map((a) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card-elev p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 relative -ml-[1.125rem] pl-[1.5rem] sm:pl-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={"badge " + (statusColor[a.status] || statusColor.draft)}>{a.status}</span>
                        <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {a.assessment_type}
                        </span>
                      </div>
                      <h4 className="font-semibold truncate">{a.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {fmtDate(a.start_datetime)} → {fmtDate(a.end_datetime)}
                      </p>
                    </div>
                    {renderActionButton(a)}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
