"use client";

import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { useEffect } from "react";

// The access token lives in module state rather than in a prop, so a refresh
// reaches every in-flight and future request at once. Passing it down as a
// prop meant a refreshed token could never reach an already-mounted component.
let accessToken = "";

export function setAccessToken(token: string) {
  accessToken = token;
}

/**
 * Seeds the in-memory access token from the one the server read out of the
 * cookie. Call it at the top of any client page that talks to the backend.
 */
export function useAccessToken(token: string | null | undefined) {
  const value = token ?? "";
  // Client components also render on the server, where module state is shared
  // across requests — seeding there would leak one user's token to another.
  if (typeof window !== "undefined") setAccessToken(value);
  useEffect(() => {
    setAccessToken(value);
  }, [value]);
}

/** Backend client with auth + refresh. Use this for everything except login/signup. */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_HOST,
  headers: { Accept: "*/*" },
});

/** Backend client without auth handling, for the login/signup endpoints. */
export const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_HOST,
  headers: { Accept: "*/*" },
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

class RefreshError extends Error {
  constructor(readonly status: number) {
    super(`Token refresh failed (${status})`);
    this.name = "RefreshError";
  }
}

// Concurrent 401s must share one refresh call. The backend rotates refresh
// tokens on every use, so parallel refreshes would invalidate each other.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  refreshPromise ??= fetch("/api/refresh", { method: "POST" })
    .then(async (response) => {
      if (!response.ok) throw new RefreshError(response.status);
      const { jwt } = await response.json();
      if (!jwt) throw new RefreshError(response.status);
      setAccessToken(jwt);
      return jwt as string;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.assign("/login");
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string }>) => {
    const config = error.config as RetriableConfig | undefined;
    if (error.response?.status !== 401 || !config || config._retry) {
      return Promise.reject(error);
    }

    // Only TOKEN_EXPIRED is recoverable; INVALID_TOKEN / UNAUTHORIZED mean the
    // token is not merely stale. A missing reason falls through to a refresh
    // attempt, which fails safely.
    const reason = error.response.data?.error;
    if (reason && reason !== "TOKEN_EXPIRED") {
      redirectToLogin();
      return Promise.reject(error);
    }

    config._retry = true;
    try {
      await refreshAccessToken();
      return await api(config);
    } catch (refreshError) {
      // 503 means the refresh endpoint was unreachable, not that the session
      // is dead — don't kick the user out over that.
      if (!(refreshError instanceof RefreshError) || refreshError.status !== 503) {
        redirectToLogin();
      }
      return Promise.reject(error);
    }
  },
);
