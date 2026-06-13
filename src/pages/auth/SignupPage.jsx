import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import AuthShell from "../../components/auth/AuthShell.jsx";
import SocialButtons from "../../components/auth/SocialButtons.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { ROUTES } from "../../constants/index.js";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    studentId: "",
    department: "",
    year: "",
    semester: "",
    email: "",
    password: "",
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const semesterOptions = [1, 2];
  const { signup } = useAuth();
  const navigate = useNavigate();

  const change = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
  e.preventDefault();

  if (
    !form.name ||
    !form.studentId ||
    !form.department ||
    !form.year ||
    !form.semester ||
    !form.email ||
    form.password.length < 6
  ) {
    return toast.error(
      "Please fill all fields and use a 6+ character password"
    );
  }

  setLoading(true);

  try {
    await signup({
      name: form.name,
      student_id: form.studentId,
      department: form.department,
      year: Number(form.year),
      semester: Number(form.semester),
      email: form.email,
      password: form.password,
    });

    toast.success("Account created. Welcome to Assesso!");
    navigate(ROUTES.DASHBOARD);
  } catch (err) {
    toast.error(err.message || "Failed to create account");
  } finally {
    setLoading(false);
  }
};

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your first assessment in minutes"
      footer={
        <>
          Already have an account?{" "}
          <Link to={ROUTES.LOGIN} className="text-brand-600 font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SocialButtons />
      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        OR SIGN UP WITH EMAIL
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Full name</label>
          <div>
            <label className="text-sm font-medium">
              Roll Number / Student ID
            </label>
            <input
              className="input mt-1.5"
              placeholder="22CSE101"
              value={form.studentId}
              onChange={change("studentId")}
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Department
            </label>

            <select
              className="input mt-1.5"
              value={form.department}
              onChange={change("department")}
            >
              <option value="">
                Select Department
              </option>

              <option value="CSE">
                Computer Science
              </option>

              <option value="ECE">
                Electronics
              </option>

              <option value="EEE">
                Electrical
              </option>

              <option value="MECH">
                Mechanical
              </option>

              <option value="CIVIL">
                Civil
              </option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">
                Year
              </label>

              <select
                className="input mt-1.5"
                value={form.year}
                onChange={change("year")}
              >
                <option value="">
                  Select
                </option>

                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">
                Semester
              </label>

             <select
                className="input mt-1.5"
                value={form.semester}
                onChange={change("semester")}
               >

                <option value="">Select Semester</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>

          </div>
          <div className="relative mt-1.5">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Jane Doe" value={form.name} onChange={change("name")} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="email" className="input pl-9" placeholder="you@company.com" value={form.email} onChange={change("email")} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type={show ? "text" : "password"}
              className="input pl-9 pr-10"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={change("password")}
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
        <p className="text-xs text-slate-500">
          By creating an account you agree to our Terms and Privacy Policy.
        </p>
        <button disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
