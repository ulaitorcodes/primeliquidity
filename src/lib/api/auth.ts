import { apiFetch } from "./http";
import {
  clearSession,
  saveSession,
  saveTokens,
  updateSessionUser,
  type SessionUser,
} from "./session";

// Re-exported so existing imports (e.g. use-session.ts) keep working
export {
  subscribeSession,
  getSessionSnapshot,
  parseSession,
} from "./session";
export type { Role, SessionUser } from "./session";

interface AuthResponse {
  user: SessionUser;
  access: string;
  refresh: string;
}

export async function login(email: string, password: string) {
  const data = await apiFetch<AuthResponse>("/auth/login/", {
    method: "POST",
    body: { email: email.trim().toLowerCase(), password },
    auth: "none",
  });
  saveSession(data.user, data.access, data.refresh);
  return data.user;
}

export async function register(name: string, email: string, password: string) {
  const data = await apiFetch<AuthResponse>("/auth/register/", {
    method: "POST",
    body: { name: name.trim(), email: email.trim().toLowerCase(), password },
    auth: "none",
  });
  saveSession(data.user, data.access, data.refresh);
  return data.user;
}

export async function logout() {
  clearSession();
}

/** Re-reads the current user from the server and updates the stored session. */
export async function fetchMe() {
  const user = await apiFetch<SessionUser>("/auth/me/");
  updateSessionUser(user);
  return user;
}

/**
 * The server revokes every old refresh token and returns a new pair,
 * so the stored tokens are replaced here.
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await apiFetch<{ detail: string; access?: string; refresh?: string }>(
    "/auth/change-password/",
    { method: "POST", body: { currentPassword, newPassword } }
  );
  if (res.access && res.refresh) saveTokens(res.access, res.refresh);
  return res;
}

/** Always 200 with a generic message: never reveals whether the email exists. */
export function forgotPassword(email: string) {
  return apiFetch<{ detail: string }>("/auth/forgot-password/", {
    method: "POST",
    body: { email: email.trim().toLowerCase() },
    auth: "none",
  });
}

export function resetPassword(uid: string, token: string, newPassword: string) {
  return apiFetch<{ detail: string }>("/auth/reset-password/", {
    method: "POST",
    body: { uid, token, newPassword },
    auth: "none",
  });
}