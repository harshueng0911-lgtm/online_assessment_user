import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import AuthShell from "../../components/auth/AuthShell.jsx";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email");
    toast.success("OTP sent to " + email);
    navigate("/verify-otp", { state: { email } });
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a 6-digit verification code"
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              className="input pl-9"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <button className="btn-primary w-full py-3">Send OTP</button>
      </form>
    </AuthShell>
  );
}
