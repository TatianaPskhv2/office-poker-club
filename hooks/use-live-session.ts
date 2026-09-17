"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchLiveSession, postLiveAction } from "@/lib/live/client";
import type { LiveSession } from "@/types";

export function useLiveSession(id: string) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchLiveSession(id);
      setSession(next);
      setError(next ? null : "Стол не найден. Сначала запустите его со страницы игры.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить стол");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const first = window.setTimeout(() => {
      void refresh();
    }, 0);
    const timer = window.setInterval(() => {
      void refresh();
    }, 2500);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const run = useCallback(
    async (body: Parameters<typeof postLiveAction>[1]) => {
      const next = await postLiveAction(id, body);
      setSession(next);
      return next;
    },
    [id]
  );

  return { session, error, loading, refresh, run };
}
