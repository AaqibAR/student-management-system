"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiError } from "@/lib/api";
import type { Session } from "@/lib/types";

interface AuthContextValue {
  user: Session["user"];
  isAdmin: boolean;
  signingOut: boolean;
  signOutError: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
export const AUTH_CHANNEL = "student-management-auth";

export function announceAuthChange(message: "signed-in" | "signed-out") {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage(message);
  channel.close();
}

export default function AuthProvider({ session, children }: { session: Session; children: ReactNode }) {
  const router = useRouter();
  const [active, setActive] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const verifying = useRef(false);

  const endSession = useCallback((reason: "expired" | "logout") => {
    setActive(false);
    router.replace(reason === "expired" ? "/login?reason=expired" : "/login");
    router.refresh();
  }, [router]);

  useEffect(() => {
    const expired = () => endSession("expired");
    const timer = window.setTimeout(expired, Math.max(0, session.expiresAt - Date.now()));
    async function verify() {
      if (verifying.current || document.visibilityState !== "visible") return;
      verifying.current = true;
      try {
        const current = await apiRequest<Session>("/api/auth/session");
        if (current.user.id !== session.user.id || current.expiresAt !== session.expiresAt) router.refresh();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) expired();
      } finally {
        verifying.current = false;
      }
    }
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(AUTH_CHANNEL);
    if (channel) channel.onmessage = (event) => {
      if (event.data === "signed-out") endSession("logout");
      if (event.data === "signed-in") router.refresh();
    };
    window.addEventListener("auth:expired", expired);
    window.addEventListener("focus", verify);
    document.addEventListener("visibilitychange", verify);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("auth:expired", expired);
      window.removeEventListener("focus", verify);
      document.removeEventListener("visibilitychange", verify);
      channel?.close();
    };
  }, [endSession, router, session.expiresAt, session.user.id]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      await apiRequest<void>("/api/auth/logout", { method: "POST" });
      announceAuthChange("signed-out");
      endSession("logout");
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : "Unable to sign out. Please try again.");
      setSigningOut(false);
    }
  }

  if (!active) return <main className="session-transition" role="status">Returning to sign in…</main>;
  return <AuthContext.Provider value={{ user: session.user, isAdmin: session.user.role === "ADMIN", signingOut, signOutError, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
