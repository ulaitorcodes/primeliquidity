import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveAccessToken,
} from "./session";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://skunk-major-lemming.ngrok-free.app/api";

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;
  /** The raw JSON error body (e.g. { detail, transactionId } on a 409) */
  data: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string[]> = {},
    data: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.data = data;
  }
}

function normalizeFieldErrors(raw: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value)) out[key] = value.map(String);
    else if (typeof value === "string") out[key] = [value];
  }
  return out;
}

/** The first readable message inside a string, array or nested object. */
function firstMessage(value: unknown): string | null {
  if (typeof value === "string") return value || null;
  if (Array.isArray(value)) {
    for (const v of value) {
      const m = firstMessage(v);
      if (m) return m;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      const m = firstMessage(v);
      if (m) return m;
    }
  }
  return null;
}

function fallbackMessage(status: number) {
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "That wasn't found. It may have been moved or deleted.";
  if (status === 429) return "Too many attempts, try again later.";
  if (status >= 500) {
    return `The server ran into a problem (error ${status}). Please try again, and tell an admin if it keeps happening.`;
  }
  return "Something went wrong. Please try again.";
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try {
    const text = await res.text();
    if (text) {
      const parsed: unknown = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        body = parsed as Record<string, unknown>;
      } else {
        const m = firstMessage(parsed);
        if (m) body = { detail: m };
      }
    }
  } catch {
    // not JSON (for example an HTML error page): a status-based message is used below
  }

  // The standard shape is { detail, errors }. Plain DRF bodies like { field: ["msg"] } work too.
  const { detail, errors, ...rest } = body;
  let fieldErrors = normalizeFieldErrors(errors);
  if (Object.keys(fieldErrors).length === 0 && typeof detail !== "string") {
    fieldErrors = normalizeFieldErrors(rest);
  }

  const message =
    (typeof detail === "string" && detail) ||
    firstMessage(errors) ||
    firstMessage(rest) ||
    fallbackMessage(res.status);

  return new ApiError(message, res.status, fieldErrors, body);
}

/* ---- token refresh (shared so parallel 401s trigger only one refresh) ---- */

let refreshing: Promise<boolean> | null = null;

async function runRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { access: string };
    saveAccessToken(data.access);
    return true;
  } catch {
    return false;
  }
}

function refreshAccess(): Promise<boolean> {
  if (!refreshing) {
    refreshing = runRefresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

/* ---- main helper ---- */

interface Options {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** A plain object (sent as JSON) or FormData (sent as multipart) */
  body?: unknown;
  /**
   * "required": send token, log out on failure (protected endpoints)
   * "optional": send token if we have one, fall back to anonymous (public endpoints)
   * "none":     never send a token (login, register, programs)
   */
  auth?: "required" | "optional" | "none";
  /** Server-side cache time in seconds (Next.js only, ignored in the browser) */
  revalidate?: number;
  /** "blob" for images and files. Defaults to "json". */
  responseType?: "json" | "blob";
}

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const {
    method = "GET",
    body,
    auth = "required",
    revalidate,
    responseType = "json",
  } = options;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  async function send(useToken: boolean): Promise<Response> {
    const headers: Record<string, string> = {};
    // For FormData the browser sets the multipart boundary itself
    if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
    const token = useToken ? getAccessToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    let payload: BodyInit | undefined;
    if (body !== undefined) payload = isForm ? (body as FormData) : JSON.stringify(body);

    try {
      return await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: payload,
        ...(revalidate !== undefined ? { next: { revalidate } } : {}),
      });
    } catch {
      throw new ApiError(
        "Can't reach the server. Check your connection and try again.",
        0
      );
    }
  }

  let res = await send(auth !== "none");

  if (res.status === 401 && auth !== "none") {
    const refreshed = getRefreshToken() ? await refreshAccess() : false;
    if (refreshed) {
      res = await send(true);
    } else {
      clearSession();
      if (auth === "optional") res = await send(false);
    }
  }

  if (res.status === 401 && auth === "required") clearSession();

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  if (responseType === "blob") return (await res.blob()) as T;

  // An empty success body is fine (many POST actions reply with nothing).
  const text = await res.text();
  if (!text.trim()) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(
      "The server sent a response that couldn't be read. Check that the API address is correct.",
      res.status
    );
  }
}