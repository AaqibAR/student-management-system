import { NextResponse } from "next/server";
import { clearSession, jsonError, readSession } from "@/lib/server-auth";

export async function GET() {
  const result = await readSession();
  if (result.state === "authenticated") {
    return NextResponse.json(result.session, { headers: { "Cache-Control": "no-store" } });
  }
  if (result.state === "unavailable") return jsonError(503, "The service is temporarily unavailable. Please try again.");
  return clearSession(jsonError(401, "Your session has ended. Please sign in again."));
}
