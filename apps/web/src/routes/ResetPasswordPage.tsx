import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AppLogo } from "@/components/AppLogo";
import { isDemoMode } from "@/lib/demo-data";
import { supabaseConfigured } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";

/** Reads `#error_description=...` that Supabase appends when a recovery link is invalid/expired. */
function hashError(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const desc = params.get("error_description") ?? params.get("error");
  return desc ? desc.replace(/\+/g, " ") : null;
}

export function ResetPasswordPage() {
  const { session, loading, updatePassword } = useSession();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(() => hashError());
  const [graceElapsed, setGraceElapsed] = useState(false);

  // Supabase parses the recovery token from the URL hash asynchronously after
  // load, so give it a short window before declaring the link invalid.
  useEffect(() => {
    const t = setTimeout(() => setGraceElapsed(true), 2500);
    return () => clearTimeout(t);
  }, []);

  if (!supabaseConfigured || isDemoMode) {
    return <Navigate to="/auth" replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  };

  const verifying = !linkError && !session && (loading || !graceElapsed);

  return (
    <div className="auth-page">
      <div className="auth-page__card card">
        <AppLogo size="lg" className="auth-page__logo" />
        <h1 className="sr-only">Reset password</h1>

        {done ? (
          <>
            <p className="auth-page__demo-title">Password updated</p>
            <p className="muted-text">You can now use your new password to sign in.</p>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => navigate("/log", { replace: true })}
            >
              Continue to Today →
            </button>
          </>
        ) : verifying ? (
          <p className="muted-text">Verifying your reset link…</p>
        ) : session ? (
          <>
            <p className="muted-text">Choose a new password for your account.</p>
            <form className="auth-form" onSubmit={submit}>
              <label className="field">
                <span>New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  autoFocus
                />
              </label>
              <label className="field">
                <span>Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              {error && <p className="auth-form__error">{error}</p>}
              <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
                {busy ? "Saving…" : "Update password"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-page__demo-title">Reset link invalid</p>
            <p className="muted-text">
              {linkError ?? "This password reset link has expired or has already been used."} Request a new
              one to continue.
            </p>
            <Link to="/auth" className="btn btn--primary btn--block">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
