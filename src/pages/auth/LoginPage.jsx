import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import AuthShell from "../../components/auth/AuthShell.jsx";
import SocialButtons from "../../components/auth/SocialButtons.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { ROUTES } from "../../constants/index.js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill all fields");
    setLoading(true);
    try {
      const profile = await login({
        email,
        password,
      });
      toast.success("Welcome back!");
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      toast.error(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your assessments"
      footer={
        <>
          New to Assesso?{" "}
          <Link to={ROUTES.SIGNUP} className="text-brand-600 font-semibold hover:underline">
            Create account
          </Link>
        </>
      }
    >
      <SocialButtons />
      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        OR CONTINUE WITH EMAIL
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              autoComplete="email"
              className="input pl-9"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Password</label>
            <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-brand-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="input pl-9 pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" className="rounded border-slate-300" defaultChecked />
          Remember me for 30 days
        </label>
        <button disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
