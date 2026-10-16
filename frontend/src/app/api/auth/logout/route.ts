import { NextRequest, NextResponse } from "next/server";
import { clearSession, hasSameOrigin, jsonError } from "@/lib/server-auth";

export function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return jsonError(403, "Reload the page and try again.");
  return clearSession(new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } }));
}
