import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AuthProvider from "@/components/AuthProvider";
import SessionUnavailable from "@/components/SessionUnavailable";
import { readSession } from "@/lib/server-auth";

export default async function ProtectedWorkspace({ children }: { children: ReactNode }) {
  const result = await readSession();
  if (result.state === "unavailable") return <SessionUnavailable />;
  if (result.state !== "authenticated") redirect(result.state === "expired" ? "/login?reason=expired" : "/login");
  const { session } = result;
  return <AuthProvider key={`${session.user.id}-${session.expiresAt}`} session={session}><AppShell>{children}</AppShell></AuthProvider>;
}
