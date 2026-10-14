"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { apiRequest } from "@/lib/api";

export default function SessionUnavailable() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return <main className="session-transition">
    <section className="session-problem" aria-labelledby="session-problem-heading">
      <p className="page-eyebrow">STUDENT MANAGEMENT</p>
      <h1 id="session-problem-heading">Your workspace is temporarily unavailable.</h1>
      <p>We couldn’t check your session. Please try again in a moment.</p>
      {error && <p role="alert" className="auth-error">{error}</p>}
      <div>
        <button className="ui-button ui-button-primary" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Checking…" : "Try again"}</button>
        <button className="ui-button ui-button-secondary" disabled={pending} onClick={() => startTransition(async () => {
          try {
            await apiRequest<void>("/api/auth/logout", { method: "POST" });
            router.replace("/login");
            router.refresh();
          } catch {
            setError("Unable to sign out. Please try again.");
          }
        })}>Back to sign in</button>
      </div>
    </section>
  </main>;
}
