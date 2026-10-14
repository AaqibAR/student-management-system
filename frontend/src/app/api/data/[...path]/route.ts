import { NextRequest } from "next/server";
import { backendRequest, clearSession, hasSameOrigin, jsonError, relayResponse, sessionToken } from "@/lib/server-auth";

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const collection = path.length === 1;
  if (!["students", "courses"].includes(path[0])
    || (path.length !== 1 && (path.length !== 2 || !/^[1-9]\d*$/.test(path[1])))) {
    return jsonError(404, "The requested endpoint could not be found.");
  }
  const method = request.method;
  if ((method === "POST" && !collection) || (["PUT", "DELETE"].includes(method) && collection)) {
    return jsonError(405, "This method is not available for this endpoint.");
  }
  if (method !== "GET" && !hasSameOrigin(request)) return jsonError(403, "Reload the page and try again.");
  const token = await sessionToken();
  if (!token) return clearSession(jsonError(401, "Your session has ended. Please sign in again."));
  if (["POST", "PUT"].includes(method) && !request.headers.get("content-type")?.startsWith("application/json")) {
    return jsonError(415, "Send the form as JSON.");
  }
  try {
    const body = ["POST", "PUT"].includes(method) ? await request.text() : undefined;
    if (body && body.length > 262144) return jsonError(413, "The submitted record is too large.");
    const response = await backendRequest(`/api/${path.join("/")}`, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body,
    });
    return await relayResponse(response);
  } catch {
    return jsonError(503, "The service is temporarily unavailable. Please try again.");
  }
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
