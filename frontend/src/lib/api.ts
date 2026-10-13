const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
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

  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${path}`, {
      ...options,
      headers,
      signal,
      cache: "no-store",
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

    throw new ApiError(
      response.status,
      messages[response.status] ?? "The request failed. Please try again.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}