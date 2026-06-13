import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Clock,
  AlarmClock,
  Trophy,
  Sparkles,
  Inbox,
} from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications.js";

const typeMeta = {
  starting_soon: { icon: Clock, color: "from-blue-500 to-blue-600" },
  deadline: { icon: AlarmClock, color: "from-rose-500 to-rose-600" },
  result: { icon: Trophy, color: "from-amber-500 to-amber-600" },
  new: { icon: Sparkles, color: "from-accent-500 to-accent-600" },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSelect(n) {
    markAsRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost p-2 relative rounded-xl"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[28rem] overflow-hidden card-elev rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/40 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="font-semibold text-sm">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center text-center gap-2 text-slate-400">
                  <Inbox className="h-8 w-8 opacity-40" />
                  <p className="text-sm">You're all caught up.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.map((n) => {
                    const meta = typeMeta[n.type] || typeMeta.new;
                    const Icon = meta.icon;
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => handleSelect(n)}
                          className={
                            "w-full text-left flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 " +
                            (!n.read ? "bg-brand-50/40 dark:bg-brand-500/5" : "")
                          }
                        >
                          <div
                            className={`w-8 h-8 rounded-lg grid place-items-center text-white bg-gradient-to-br ${meta.color} shrink-0`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug truncate">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                            {n.timeLabel && (
                              <p className="text-[11px] text-slate-400 mt-1">{n.timeLabel}</p>
                            )}
                          </div>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
