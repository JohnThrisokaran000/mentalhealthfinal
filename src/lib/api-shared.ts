// Server+client shared error type. (src/lib/api.ts holds the client fetcher;
// this file is dependency-free so server code can import it safely.)

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function jsonError(message: string, status = 400, code?: string) {
  return Response.json({ error: message, code }, { status });
}

// Route-handler wrapper: converts thrown ApiRequestError into a proper
// JSON Response with its status code. Without this, Next.js turns any thrown
// Error into a 500 — which would hide 401/403/404/422 from clients and break
// RBAC enforcement at the API boundary.
export function apiRoute<A extends unknown[]>(
  fn: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ApiRequestError) return jsonError(e.message, e.status, e.code);
      console.error("[api] unhandled error:", e);
      return jsonError(
        e instanceof Error ? e.message : "Internal server error",
        500,
      );
    }
  };
}
