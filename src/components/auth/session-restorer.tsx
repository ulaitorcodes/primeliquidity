"use client";

import { useEffect } from "react";
import { fetchMe } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { clearSession, getAccessToken } from "@/lib/api/session";
import { useToast } from "@/components/ui/toast";

/** On page load, re-reads the user from /auth/me/. A suspended agent is logged out. */
export function SessionRestorer() {
  const toast = useToast();

  useEffect(() => {
    if (!getAccessToken()) return;
    fetchMe().catch((err) => {
      if (err instanceof ApiError && err.status === 403) {
        clearSession();
        toast.error(err.message);
      }
    });
  }, [toast]);

  return null;
}