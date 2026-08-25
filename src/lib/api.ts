"use client";

import type { ApiError } from "./types";
import { useApp } from "./store";

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface Opts extends RequestInit {
  json?: unknown;
  expectBlob?: boolean;
}

async function request<T>(path: string, opts: Opts = {}): Promise<T> {
  const { json, headers, expectBlob, ...rest } = opts;
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    ...rest,
  });

  if (res.status === 401) {
    useApp.getState().setUser(null);
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    let code: string | undefined;
    try {
      const err = (await res.json()) as ApiError;
      msg = err.error || msg;
      code = err.code;
    } catch {
      /* ignore */
    }
    throw new ApiRequestError(msg, res.status, code);
  }

  if (expectBlob) return res as unknown as T;
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, opts?: Opts) => request<T>(path, { method: "GET", ...opts }),
  post: <T>(path: string, body?: unknown, opts?: Opts) =>
    request<T>(path, { method: "POST", json: body, ...opts }),
  put: <T>(path: string, body?: unknown, opts?: Opts) =>
    request<T>(path, { method: "PUT", json: body, ...opts }),
  del: <T>(path: string, opts?: Opts) => request<T>(path, { method: "DELETE", ...opts }),
  upload: <T>(path: string, formData: FormData, opts?: Opts) =>
    request<T>(path, { method: "POST", body: formData, ...opts }),
  blob: (path: string, opts?: Opts) =>
    request<Response>(path, { method: "GET", expectBlob: true, ...opts }),
};
