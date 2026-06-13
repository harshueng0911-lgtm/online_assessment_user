import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark bg-[size:32px_32px] opacity-30" />
        <Link to="/" className="relative flex items-center gap-2 font-display font-bold text-lg">
          <span className="w-8 h-8 rounded-lg bg-white/15 grid place-items-center">A</span>
          Assesso
        </Link>
        <div className="relative">
          <h2 className="text-3xl font-display font-bold leading-tight max-w-md">
            "Assesso helped us screen 12,000 graduates in two weeks — without compromising on fairness."
          </h2>
          <p className="mt-4 text-white/80 text-sm">— Head of Talent, Fortune 100 IT services firm</p>
        </div>
        <div className="relative text-xs text-white/60">SOC 2 · ISO 27001 · GDPR ready</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="lg:hidden flex items-center gap-2 font-display font-bold text-lg mb-8">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white">A</span>
            Assesso
          </Link>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-slate-500">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}
