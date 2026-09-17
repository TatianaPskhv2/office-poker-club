"use client";

import { useEffect } from "react";
import { useClub } from "@/hooks/use-club";
import { abortLiveSession, fetchLiveSession } from "@/lib/live/client";

export function LiveRevert() {
  const { state, isHydrated, actions } = useClub();

  useEffect(() => {
    if (!isHydrated) return;
    const liveGames = state.games.filter((game) => game.status === "live");
    if (liveGames.length === 0) return;

    let cancelled = false;
    void (async () => {
      for (const game of liveGames) {
        const session = await fetchLiveSession(game.id);
        if (cancelled) return;
        if (!session) {
          actions.cancelLive(game.id);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, state.games, actions]);

  return null;
}

export async function abortAndRevert(
  gameId: string,
  cancelLive: (gameId: string) => void
) {
  await abortLiveSession(gameId);
  cancelLive(gameId);
}
