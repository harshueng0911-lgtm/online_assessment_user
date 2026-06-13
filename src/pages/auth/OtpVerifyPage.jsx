import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthShell from "../../components/auth/AuthShell.jsx";

export default function OtpVerifyPage() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputs = useRef([]);
  const navigate = useNavigate();
  const { state } = useLocation();

  const handle = (i, v) => {
    const val = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const verify = (e) => {
    e.preventDefault();
    if (digits.some((d) => !d)) return toast.error("Enter all 6 digits");
    toast.success("OTP verified");
    navigate("/reset-password");
  };

  return (
    <AuthShell
      title="Verify your identity"
      subtitle={state?.email ? `Code sent to ${state.email}` : "Enter the 6-digit code we sent you"}
      footer={
        <>
          Didn't get it?{" "}
          <Link to="/forgot-password" className="text-brand-600 font-semibold hover:underline">
            Resend code
          </Link>
        </>
      }
    >
      <form onSubmit={verify} className="space-y-6">
        <div className="flex gap-2 justify-between">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              value={d}
              onChange={(e) => handle(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !d && i > 0) inputs.current[i - 1]?.focus();
              }}
              maxLength={1}
              inputMode="numeric"
              className="input text-center text-xl font-bold w-12 h-14 px-0"
            />
          ))}
        </div>
        <button className="btn-primary w-full py-3">Verify OTP</button>
      </form>
    </AuthShell>
  );
}
