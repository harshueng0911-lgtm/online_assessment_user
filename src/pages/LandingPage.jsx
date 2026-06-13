import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Timer,
  BarChart3,
  Users,
  Globe2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme.js";
import { Moon, Sun } from "lucide-react";
import { ROUTES } from "../constants/index.js";

const features = [
  {
    icon: ShieldCheck,
    title: "Secure Proctoring",
    desc: "Tab-switch detection, full-screen lock and anti-cheat heuristics.",
    span: "lg:col-span-2",
  },
  {
    icon: Timer,
    title: "Real-time Timer",
    desc: "Server-synced countdown with auto-submit on expiry.",
    span: "",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    desc: "Section-wise scoring, percentile and skill heatmaps.",
    span: "",
  },
  {
    icon: Users,
    title: "Bulk Hiring",
    desc: "Invite thousands of candidates and shortlist instantly.",
    span: "",
  },
  {
    icon: Globe2,
    title: "Multi-region CDN",
    desc: "Globally distributed test delivery with sub-100ms latency.",
    span: "",
  },
  {
    icon: Sparkles,
    title: "AI Question Bank",
    desc: "Curated MCQ, coding and psychometric questions out of the box.",
    span: "lg:col-span-2",
  },
];

const brands = ["TCS", "Infosys", "Wipro", "Accenture", "Capgemini", "Cognizant", "TechM", "HCL"];

export default function LandingPage() {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-3 z-30 px-4">
        <div className="max-w-7xl mx-auto rounded-2xl nav-glass">
          <div className="h-16 px-4 sm:px-6 flex items-center">
            <Link to={ROUTES.LANDING} className="flex items-center gap-2 font-display font-bold text-lg">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-600 grid place-items-center text-white shadow-md shadow-brand-600/30">
                A
              </span>
              Assesso
            </Link>
            <nav className="ml-8 hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
              <a href="#brands" className="hover:text-brand-600 transition-colors">Customers</a>
              <a href="#cta" className="hover:text-brand-600 transition-colors">Pricing</a>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={toggle} className="btn-ghost p-2 rounded-xl">
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Link to={ROUTES.LOGIN} className="btn-ghost rounded-xl">Log in</Link>
              <Link
                to={ROUTES.SIGNUP}
                className="btn bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-600/25 hover:shadow-xl hover:shadow-accent-600/30 hover:-translate-y-0.5 rounded-xl"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-light dark:bg-grid-dark bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
        <div className="absolute inset-0 bg-hero-glow-light dark:bg-hero-glow-dark" />

        {/* ambient floating shapes */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-brand-500/20 blur-3xl animate-float" />
        <div className="absolute top-40 -right-24 w-80 h-80 rounded-full bg-accent-500/20 blur-3xl animate-float-delay" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-500/10 dark:to-accent-500/10 text-brand-700 dark:text-brand-300 ring-1 ring-inset ring-brand-200/60 dark:ring-white/10">
              <Sparkles className="h-3 w-3" /> Built for enterprise hiring
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight">
              The assessment platform{" "}
              <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
                top IT companies
              </span>{" "}
              trust.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl">
              Assesso powers technical, aptitude and psychometric assessments at scale —
              with secure proctoring, real-time analytics and a candidate experience
              that doesn't feel like 2010.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to={ROUTES.SIGNUP}
                className="btn bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-xl shadow-brand-600/25 hover:shadow-2xl hover:shadow-accent-600/30 hover:-translate-y-0.5 text-base px-6 py-3 rounded-xl"
              >
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to={ROUTES.LOGIN} className="btn-outline text-base px-6 py-3 rounded-xl">
                Sign in
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 text-amber-500">★★★★★ <span className="text-slate-500 dark:text-slate-400">4.9/5 rating</span></span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-brand-500" /> SOC 2 Type II</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent-500" /> ISO 27001</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-gradient-to-tr from-brand-500/30 via-accent-500/20 to-fuchsia-500/10 blur-3xl rounded-3xl" />

            {/* main assessment card */}
            <div className="relative card-elev p-6 rounded-2xl shadow-xl shadow-slate-900/5 dark:shadow-black/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Quantitative Aptitude
                  </p>
                  <h3 className="font-display font-semibold mt-1 text-lg">Section 1 of 3</h3>
                </div>
                <div className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  Auto-saved
                </div>
              </div>
              <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-sm font-medium">
                  A train 150m long passes a pole in 15 seconds. What is its speed?
                </p>
                <div className="mt-3 space-y-2">
                  {["30 km/h", "36 km/h", "45 km/h", "54 km/h"].map((o, i) => (
                    <div
                      key={o}
                      className={
                        "flex items-center gap-3 rounded-lg border p-2.5 text-sm transition-colors " +
                        (i === 1
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-500/20"
                          : "border-slate-200 dark:border-slate-700")
                      }
                    >
                      <span
                        className={
                          "w-4 h-4 rounded-full border " +
                          (i === 1
                            ? "border-brand-500 bg-brand-500"
                            : "border-slate-300 dark:border-slate-600")
                        }
                      />
                      {o}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Question 4 / 20</span>
                <span className="font-mono font-bold text-brand-600">12:48</span>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full w-1/5 rounded-full bg-gradient-to-r from-brand-500 to-accent-500" />
              </div>
            </div>

            {/* floating analytics widget - top right */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-8 -right-6 hidden sm:block card-elev rounded-xl px-4 py-3 shadow-lg shadow-slate-900/5 dark:shadow-black/40"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 grid place-items-center text-white">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Percentile</p>
                  <p className="text-sm font-bold font-display">94.6%</p>
                </div>
              </div>
            </motion.div>

            {/* floating analytics widget - bottom left */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-8 -left-6 hidden sm:block card-elev rounded-xl px-4 py-3 shadow-lg shadow-slate-900/5 dark:shadow-black/40"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-600 grid place-items-center text-white">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Candidates live</p>
                  <p className="text-sm font-bold font-display">2,481</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted companies */}
      <section id="brands" className="py-12 border-y border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-8">
            Trusted by hiring teams at
          </p>
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)] dark:[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex w-max animate-marquee gap-16">
              {[...brands, ...brands].map((b, i) => (
                <span
                  key={b + i}
                  className="font-display font-bold text-2xl tracking-tight text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors whitespace-nowrap"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features - Bento grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-1 ring-inset ring-brand-200/60 dark:ring-white/10">
            Platform
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
            Everything you need for fair, fast hiring.
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg">
            From aptitude rounds to coding tests and personality inventories —
            Assesso ships with all of it.
          </p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className={`group gradient-border ${f.span} hover:shadow-2xl hover:shadow-brand-500/10 transition-shadow duration-300`}
            >
              <div className="gradient-border-inner bento-card group-hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute inset-0 rounded-[1.25rem] bg-gradient-to-br from-brand-50/0 via-transparent to-accent-50/0 group-hover:from-brand-50/60 group-hover:to-accent-50/40 dark:group-hover:from-brand-500/5 dark:group-hover:to-accent-500/5 transition-colors duration-300 pointer-events-none" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-white grid place-items-center shadow-lg shadow-brand-600/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <f.icon className="h-5.5 w-5.5" />
                  </div>
                  <h3 className="mt-5 font-display font-semibold text-lg">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="max-w-7xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-brand-700 via-brand-600 to-accent-600 p-10 lg:p-16 text-white shadow-2xl shadow-brand-900/30"
        >
          <div className="absolute inset-0 bg-grid-dark bg-[size:32px_32px] opacity-30" />
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-float" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-accent-400/20 blur-3xl animate-float-delay" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight max-w-2xl">
              Hire smarter. Start your first assessment in under 5 minutes.
            </h2>
            <p className="mt-4 text-white/80 text-lg max-w-xl">
              Free for the first 50 candidates. No credit card required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={ROUTES.SIGNUP}
                className="btn bg-white text-brand-700 hover:bg-slate-100 hover:-translate-y-0.5 shadow-xl px-6 py-3 text-base rounded-xl font-semibold"
              >
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={ROUTES.LOGIN}
                className="btn border border-white/30 text-white hover:bg-white/10 px-6 py-3 text-base rounded-xl backdrop-blur-sm"
              >
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to={ROUTES.LANDING} className="flex items-center gap-2 font-display font-bold text-base">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-accent-600 grid place-items-center text-white text-sm">
              A
            </span>
            Assesso
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Assesso. Built for modern enterprise hiring.
          </p>
        </div>
      </footer>
    </div>
  );
}
