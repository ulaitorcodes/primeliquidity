"use client";

import { useEffect, useState } from "react";
import { getKycStatuses, type KycStatus } from "./kyc";

/** One call (chunked) to show a KYC badge on every row. Keys are lower-case emails. */
export function useKycStatuses(emails: string[], enabled = true) {
  const key = enabled
    ? Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)))
        .sort()
        .join(",")
    : "";
  const [state, setState] = useState<{ key: string; statuses: Record<string, KycStatus> }>({
    key: "",
    statuses: {},
  });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const list = key.split(",");
    const chunks: string[][] = [];
    for (let i = 0; i < list.length; i += 40) chunks.push(list.slice(i, i + 40));

    Promise.all(chunks.map((c) => getKycStatuses(c)))
      .then((parts) => {
        const merged: Record<string, KycStatus> = {};
        for (const part of parts) {
          for (const [email, status] of Object.entries(part)) merged[email.toLowerCase()] = status;
        }
        if (!cancelled) setState({ key, statuses: merged });
      })
      .catch(() => {
        if (!cancelled) setState({ key, statuses: {} });
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { statuses: state.statuses, ready: !key || state.key === key };
}