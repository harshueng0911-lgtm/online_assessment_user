import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "../../hooks/useTheme.js";
import { useAuth } from "../../hooks/useAuth.js";
import { ROUTES } from "../../constants/index.js";
import NotificationBell from "./NotificationBell.jsx";

export default function Navbar({ onMenu }) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 glass border-b border-slate-200/60 dark:border-white/10">
      <div className="flex items-center gap-4 px-4 sm:px-6 h-16">
        <button
          onClick={onMenu}
          className="lg:hidden btn-ghost p-2 rounded-xl"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-600 grid place-items-center text-white shadow-md shadow-brand-600/20">
            A
          </span>
          <span className="hidden sm:inline">Assesso</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-6">
          {[
            ["Dashboard", ROUTES.DASHBOARD],
            ["Assessments", ROUTES.ASSESSMENTS],
          ].map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                "px-3 py-2 text-sm font-medium rounded-xl transition " +
                (isActive
                  ? "bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-500/10 dark:to-accent-500/10 text-brand-700 dark:text-brand-300"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <button onClick={toggle} className="btn-ghost p-2 rounded-xl" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-slate-200 dark:border-slate-700">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-600 grid place-items-center text-white text-sm font-semibold shadow-md shadow-brand-600/20">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate(ROUTES.LOGIN);
            }}
            className="btn-ghost p-2 rounded-xl"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
