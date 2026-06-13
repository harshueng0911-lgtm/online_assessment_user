import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  X,
} from "lucide-react";
import { ROUTES } from "../../constants/index.js";

const links = [
  { to: ROUTES.DASHBOARD, label: "Overview", icon: LayoutDashboard },
  { to: ROUTES.ASSESSMENTS, label: "Assessments", icon: FileText },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div
        className={
          "fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden " +
          (open ? "block" : "hidden")
        }
        onClick={onClose}
      />
      <aside
        className={
          "fixed lg:sticky top-0 z-50 lg:z-10 h-screen w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-transform lg:translate-x-0 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <span className="font-display font-bold text-lg">Assesso</span>
          <button
            onClick={onClose}
            className="lg:hidden btn-ghost p-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onClose}
              className={({ isActive }) =>
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition " +
                (isActive
                  ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/20"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
            <p className="text-sm font-semibold">Upgrade to Pro</p>
            <p className="mt-1 text-xs text-white/80">
              Unlimited assessments & analytics.
            </p>
            <button className="mt-3 w-full rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold py-2 transition">
              Learn more
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
