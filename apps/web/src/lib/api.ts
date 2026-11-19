import type { ApiErrorBody, AuthResponse } from '@careerradar/shared';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (t: string | null) => {
    accessToken = t;
  },
  onExpired: (cb: () => void) => {
    onSessionExpired = cb;
  },
};

let refreshing: Promise<AuthResponse | null> | null = null;

const postRefresh = () => fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });

/**
 * Single-flight refresh using the httpOnly refresh cookie. A cross-tab lock makes tabs
 * rotate one at a time, so a second tab sends the already-rotated cookie instead of
 * replaying the old one (which the API treats as token theft).
 */
export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= (
    typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('cr-refresh', postRefresh)
      : postRefresh()
  )
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as AuthResponse;
      accessToken = data.accessToken;
      return data;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip the automatic refresh-and-retry on 401. */
  noRetry?: boolean;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, noRetry, headers, ...rest } = opts;
  const doFetch = () =>
    fetch(`${BASE}${path}`, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch();
  if (res.status === 401 && accessToken && !noRetry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await doFetch();
    } else {
      accessToken = null;
      onSessionExpired?.();
    }
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? `Request failed (${res.status})`,
      err?.details as never,
    );
  }
  return data as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
