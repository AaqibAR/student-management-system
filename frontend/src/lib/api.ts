export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined && options.body !== null) {
    headers.set("Content-Type", "application/json");
  }

  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
    : AbortSignal.timeout(15000);

  let response: Response;

  const localPath = /^\/api\/(students|courses)(\/\d+)?$/.test(path)
    ? path.replace("/api/", "/api/data/")
    : path;

  try {
    response = await fetch(localPath, {
      ...options,
      headers,
      signal,
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw error;
    }

    throw new Error(
      "Unable to reach the server. Check the backend connection and try again.",
    );
  }

  if (!response.ok) {
    const messages: Record<number, string> = {
      400: "Check the fields and enter valid values.",
      401: "Please sign in to continue.",
      403: "You do not have permission to perform this action.",
      404: "The requested record could not be found.",
      409: "A record with these identifying details already exists.",
    };

    let detail = messages[response.status] ?? "The request failed. Please try again.";
    const fields: Record<string, string> = {};
    try {
      const problem: unknown = await response.json();
      if (problem && typeof problem === "object") {
        const data = problem as { detail?: unknown; errors?: unknown };
        if (typeof data.detail === "string") detail = data.detail;
        if (data.errors && typeof data.errors === "object") {
          for (const [field, message] of Object.entries(data.errors)) {
            if (typeof message === "string") fields[field] = message;
          }
        }
      }
    } catch { /* Keep the status-specific message when the body is not JSON. */ }
    if (response.status === 401 && localPath.startsWith("/api/data/") && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:expired"));
    }
    throw new ApiError(response.status, detail, fields);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
