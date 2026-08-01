import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../lib/api";

export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState("signup"); // "signup" | "otp"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
``
  // Step 1 — submit signup, trigger OTP email
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.signup(form.name, form.email, form.password);
      setSuccess(`OTP sent to ${form.email}. Check your inbox.`);
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP
const handleVerify = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    await authApi.verifyOTP(form.email, otp);

    // Remove any existing login
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirect to Sign In page
    navigate("/sign-in", {
      replace: true,
      state: {
        email: form.email,
        message: "Email verified successfully. Please sign in.",
      },
    });

  } catch (err) {
    setError(err.response?.data?.detail || "Invalid or expired OTP.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-700 text-base font-bold text-white">
              GS
            </span>
            <span className="text-xl font-bold text-slate-900">GyanSetu</span>
          </Link>
          <h1 className="mt-6 text-2xl font-extrabold text-slate-900">
            {step === "signup" ? "Create your account" : "Verify your email"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === "signup"
              ? "Begin your spiritual journey today"
              : `We sent a 6-digit code to ${form.email}`}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* ── Step 1: Signup form ── */}
          {step === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-900 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
              >
                {loading ? "Sending OTP…" : "Create Account"}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP verification ── */}
          {step === "otp" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Enter OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit code"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl font-bold tracking-widest text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full rounded-xl bg-indigo-900 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Verify & Sign In"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("signup"); setError(""); setSuccess(""); setOtp(""); }}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
              >
                ← Back to signup
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/sign-in" className="font-medium text-indigo-700 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}