"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api";

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(path));

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError("");
    try { setData(await apiFetch<T>(path)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Impossible de charger les données."); }
    finally { setLoading(false); }
  }, [path]);

  useEffect(() => {
    const task = window.setTimeout(() => { void reload(); }, 0);
    return () => window.clearTimeout(task);
  }, [reload]);
  return { data, error, loading, reload, setData };
}
