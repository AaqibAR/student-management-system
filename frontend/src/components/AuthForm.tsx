"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import { announceAuthChange } from "@/components/AuthProvider";
import { apiRequest, ApiError } from "@/lib/api";
import type { Session } from "@/lib/types";

export default function AuthForm({ mode, expired = false }: { mode: "login" | "register"; expired?: boolean }) {
  const registering = mode === "register";
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const errorRef = useRef<HTMLParagraphElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setFields({});
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const invalid: Record<string, string> = {};
    if (registering && !name) invalid.name = "Enter your name.";
    if (!password.trim()) invalid.password = "Enter your password.";
    if (registering && password.length < 8) invalid.password = "Use at least 8 characters.";
    if (new TextEncoder().encode(password).length > 72) invalid.password = "That password is too long. Please use a shorter one.";
    if (registering && String(data.get("confirmation") ?? "") !== password) invalid.confirmation = "The passwords do not match.";
    if (Object.keys(invalid).length > 0) {
      setFields(invalid);
      setError("Check the highlighted fields.");
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setSaving(true);
    try {
      await apiRequest<Session>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password, ...(registering ? { name } : {}) }),
      });
      announceAuthChange("signed-in");
      router.replace("/dashboard");
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to sign in. Please try again.");
      if (failure instanceof ApiError) setFields({ ...failure.fields, ...(failure.fields.passwordWithinByteLimit ? { password: "That password is too long. Please use a shorter one." } : {}) });
      setSaving(false);
      window.requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  const fieldError = (field: string) => fields[field] ? <p className="auth-field-error" id={`${field}-error`}>{fields[field]}</p> : null;

  return <div className="auth-card reveal">
    <span className="auth-form-icon"><Icon name={registering ? "students" : "login"} width="23" height="23" /></span>
    <p className="page-eyebrow">{registering ? "LET’S GET STARTED" : "YOUR WORKSPACE IS WAITING"}</p>
    <h1>{registering ? "Create your account" : "Welcome back"}</h1>
    <p className="auth-subtitle">{registering ? "A clearer academic day starts here." : "Sign in to your Student Management workspace."}</p>
    {expired && !error && <p className="auth-notice" role="status">Your session has ended. Please sign in again.</p>}
    <form onSubmit={submit} className="auth-form" aria-busy={saving}>
      <fieldset disabled={saving}>
        <legend className="visually-hidden">{registering ? "Create account details" : "Sign in details"}</legend>
        {registering && <div className="auth-field">
          <label htmlFor="auth-name">Full name</label>
          <input id="auth-name" name="name" autoComplete="name" required maxLength={150} placeholder="Your full name" aria-invalid={!!fields.name} aria-describedby={fields.name ? "name-error" : undefined} />
          {fieldError("name")}
        </div>}
        <div className="auth-field">
          <label htmlFor="auth-email">Email address</label>
          <input id="auth-email" name="email" type="email" autoComplete={registering ? "email" : "username"} required maxLength={254} placeholder="you@example.com" aria-invalid={!!fields.email} aria-describedby={fields.email ? "email-error" : undefined} />
          {fieldError("email")}
        </div>
        <div className="auth-field">
          <label htmlFor="auth-password">Password</label>
          <div className="auth-password-field">
            <input id="auth-password" name="password" type={showPassword ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} required minLength={registering ? 8 : undefined} maxLength={72} aria-invalid={!!fields.password} aria-describedby={fields.password ? "password-error" : registering ? "password-help" : undefined} />
            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}><Icon name="eye" /></button>
          </div>
          {fieldError("password")}
          {registering && <p className="auth-field-help" id="password-help">Use at least 8 characters.</p>}
        </div>
        {registering && <div className="auth-field">
          <label htmlFor="auth-confirmation">Confirm password</label>
          <input id="auth-confirmation" name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" required maxLength={72} aria-invalid={!!fields.confirmation} aria-describedby={fields.confirmation ? "confirmation-error" : undefined} />
          {fieldError("confirmation")}
        </div>}
      </fieldset>
      {error && <p role="alert" tabIndex={-1} className="auth-error" ref={errorRef}>{error}</p>}
      <button type="submit" className="auth-submit" disabled={saving}>{saving ? registering ? "Creating account…" : "Signing in…" : registering ? "Create account" : "Sign in"}<Icon name={saving ? "refresh" : "arrow"} className={saving ? "refresh-spinning" : ""} width="18" height="18" /></button>
    </form>
    {registering && <p className="auth-access-note"><Icon name="lock" width="14" height="14" />New accounts can view students and courses.</p>}
    <p className="auth-switch">{registering ? "Already have an account?" : "New to this workspace?"}{" "}<Link href={registering ? "/login" : "/register"} aria-disabled={saving} tabIndex={saving ? -1 : undefined} className={saving ? "auth-link-disabled" : undefined}>{registering ? "Sign in" : "Create an account"}</Link></p>
  </div>;
}
