"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listApplications,
  type Application,
  type ListParams,
} from "./applications";

export function useApplications(params: ListParams = {}) {
  const key = JSON.stringify(params);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setApplications(await listApplications(JSON.parse(key) as ListParams));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  return { applications, loading, error, refresh };
}