export type Role = "user" | "agent" | "admin";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const SESSION_KEY = "pl_session";
const ACCESS_KEY = "pl_access";
const REFRESH_KEY = "pl_refresh";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/* ---- external store helpers (used by useSession) ---- */

export function subscribeSession(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function getSessionSnapshot(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function parseSession(raw: string | null): SessionUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

/* ---- tokens ---- */

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function saveAccessToken(access: string) {
  localStorage.setItem(ACCESS_KEY, access);
}

/** Replace both tokens (e.g. after a password change revokes the old refresh tokens). */
export function saveTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

/* ---- session ---- */

export function saveSession(user: SessionUser, access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  emit();
}

/** Refresh the stored user (e.g. after /auth/me/) without touching tokens. */
export function updateSessionUser(user: SessionUser) {
  const next = JSON.stringify(user);
  if (localStorage.getItem(SESSION_KEY) === next) return;
  localStorage.setItem(SESSION_KEY, next);
  emit();
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(SESSION_KEY);
  emit();
}