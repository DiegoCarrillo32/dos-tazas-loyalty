import type { ApiError } from "@/types";

/**
 * Thin fetch wrapper for the app's own /api routes.
 *
 * Every handler answers with either the payload or `{ error, message }`, where
 * `message` is already Spanish copy written for a customer. Surfacing that
 * message directly is the point: the callers never invent their own wording
 * for a failure the server already described.
 */
export class ApiRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
  }
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const err = (data ?? {}) as Partial<ApiError>;
    throw new ApiRequestError(
      err.error ?? "server_error",
      err.message ?? "Algo salió mal. Intentá de nuevo."
    );
  }

  return data as T;
}
