"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getSessionSnapshot,
  parseSession,
  subscribeSession,
} from "@/lib/api/auth";

export function useSession() {
  // `undefined` on the server = "still loading"
  const raw = useSyncExternalStore<string | null | undefined>(
    subscribeSession,
    getSessionSnapshot,
    () => undefined
  );

  const user = useMemo(
    () => (raw === undefined ? null : parseSession(raw)),
    [raw]
  );

  return { user, loading: raw === undefined };
}