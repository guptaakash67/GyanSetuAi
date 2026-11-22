import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../lib/api";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [resetForm, setResetForm] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [flow, setFlow] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // After login, go back to where they came from (or home)
  const from = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      login(res.data.token, res.data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await authApi.requestPasswordReset(form.email);
      setFlow("reset");
      setSuccess(
        "If an account with that email exists, a reset code has been sent."
      );
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to request a reset code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(form.email, resetForm.otp, resetForm.newPassword);
      setFlow("signin");
      setForm((current) => ({ ...current, password: "" }));
      setResetForm({ otp: "", newPassword: "", confirmPassword: "" });
      setSuccess("Password reset successfully. You can now sign in.");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to reset your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const showSignin = () => {
    setFlow("signin");
    setError("");
    setSuccess("");
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
            {flow === "signin"
              ? "Welcome back"
              : flow === "forgot"
                ? "Reset your password"
                : "Choose a new password"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {flow === "signin"
              ? "Sign in to continue your journey"
              : flow === "forgot"
                ? "We’ll email you a code to verify your account"
                : `Enter the reset code sent to ${form.email}`}
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

          {flow === "signin" && (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setFlow("forgot");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-sm font-medium text-indigo-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-900 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          )}

          {flow === "forgot" && (
            <form onSubmit={handleRequestReset} className="space-y-4">
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
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-900 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
              >
                {loading ? "Sending code…" : "Send Reset Code"}
              </button>
              <button
                type="button"
                onClick={showSignin}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
              >
                Back to sign in
              </button>
            </form>
          )}

          {flow === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Reset code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  minLength={6}
                  maxLength={6}
                  value={resetForm.otp}
                  onChange={(e) =>
                    setResetForm({
                      ...resetForm,
                      otp: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="6-digit code"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-semibold tracking-widest text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  maxLength={72}
                  value={resetForm.newPassword}
                  onChange={(e) =>
                    setResetForm({ ...resetForm, newPassword: e.target.value })
                  }
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Confirm new password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  maxLength={72}
                  value={resetForm.confirmPassword}
                  onChange={(e) =>
                    setResetForm({
                      ...resetForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Enter your new password again"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <button
                type="submit"
                disabled={loading || resetForm.otp.length !== 6}
                className="w-full rounded-xl bg-indigo-900 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
              >
                {loading ? "Updating password…" : "Reset Password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFlow("forgot");
                  setError("");
                  setSuccess("");
                  setResetForm({ otp: "", newPassword: "", confirmPassword: "" });
                }}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
              >
                Request another code
              </button>
            </form>
          )}

          {flow === "signin" && (
            <p className="mt-5 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                to="/sign-up"
                className="font-medium text-indigo-700 hover:underline"
              >
                Sign Up
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}