import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";
import AuthShell from "../../components/auth/AuthShell.jsx";

export default function ResetPasswordPage() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be 6+ characters");
    if (pw !== confirm) return toast.error("Passwords do not match");
    toast.success("Password reset. Sign in again.");
    navigate("/login");
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password you don't reuse elsewhere"
      footer={
        <Link to="/login" className="text-brand-600 font-semibold hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {[
          ["New password", pw, setPw],
          ["Confirm password", confirm, setConfirm],
        ].map(([label, val, setter]) => (
          <div key={label}>
            <label className="text-sm font-medium">{label}</label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={show ? "text" : "password"}
                className="input pl-9 pr-10"
                placeholder="••••••••"
                value={val}
                onChange={(e) => setter(e.target.value)}
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
        ))}
        <button className="btn-primary w-full py-3">Reset password</button>
      </form>
    </AuthShell>
  );
}
