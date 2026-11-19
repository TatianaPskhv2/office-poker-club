"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { STORAGE_KEY } from "@/lib/constants";
import { createSeedState } from "@/lib/data/seed";
import { getCurrentUser } from "@/lib/data/selectors";
import type { ClubState, CreateGameInput, SaveResultsInput, UserRole } from "@/types";

type Listener = () => void;

const listeners = new Set<Listener>();
const seed = createSeedState();
let memoryState: ClubState = seed;
let ready = false;
let signedIn = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(state: ClubState) {
  memoryState = state;
  ready = true;
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return memoryState;
}

function getServerSnapshot() {
  return seed;
}

function getReadySnapshot() {
  return ready;
}

function getSignedInSnapshot() {
  return signedIn;
}

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await response.json().catch(() => ({}))) as {
    state?: ClubState;
    error?: string;
  };
  if (!response.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

async function bootstrap() {
  const me = await fetch("/api/auth/me");
  if (!me.ok) {
    signedIn = false;
    ready = true;
    emit();
    return;
  }
  signedIn = true;
  await loadFromServer();
}

async function loadFromServer() {
  const data = await requestJson("/api/club");
  if (data.state) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const local = JSON.parse(raw) as ClubState;
        const localDone = local.games?.filter((game) => game.status === "completed").length ?? 0;
        const serverDone = data.state.games.filter((game) => game.status === "completed").length;
        if (localDone > serverDone) {
          const imported = await requestJson("/api/club", {
            method: "PUT",
            body: JSON.stringify({ state: local }),
          });
          if (imported.state) {
            setState(imported.state);
            return;
          }
        }
      }
    } catch {
      /* keep server */
    }
    setState(data.state);
  }
}

async function run(action: string, payload?: Record<string, unknown>) {
  const data = await requestJson("/api/club/actions", {
    method: "POST",
    body: JSON.stringify({ action, payload }),
  });
  if (data.state) setState(data.state);
  return data.state;
}

export const clubActions = {
  async createGame(input: CreateGameInput) {
    await run("createGame", input as unknown as Record<string, unknown>);
    return memoryState.games.at(-1)?.id ?? "";
  },
  async updateGame(gameId: string, input: Partial<CreateGameInput>) {
    await run("updateGame", { gameId, input });
  },
  async cancelGame(gameId: string) {
    await run("cancelGame", { gameId });
  },
  async deleteGame(gameId: string) {
    await run("deleteGame", { gameId });
  },
  async joinGame(gameId: string, playerId?: string) {
    await run("joinGame", { gameId, playerId });
  },
  async joinPlayers(gameId: string, playerIds: string[]) {
    await run("joinPlayers", { gameId, playerIds });
  },
  async leavePlayers(gameId: string, playerIds: string[]) {
    const before = memoryState.participants.length + memoryState.results.length;
    await run("leavePlayers", { gameId, playerIds });
    return Math.max(0, before - memoryState.participants.length - memoryState.results.length) || playerIds.length;
  },
  async leaveGame(gameId: string, playerId?: string) {
    await run("leaveGame", { gameId, playerId });
  },
  async markLive(gameId: string) {
    await run("markLive", { gameId });
  },
  async cancelLive(gameId: string) {
    await run("cancelLive", { gameId });
  },
  async saveResults(input: SaveResultsInput) {
    await run("saveResults", input as unknown as Record<string, unknown>);
  },
  async addPlayer(input: {
    name: string;
    department?: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
    notes?: string;
    role: UserRole;
  }) {
    await run("addPlayer", input);
    return memoryState.players.at(-1)?.id ?? "";
  },
  async updatePlayer(
    playerId: string,
    input: {
      name: string;
      department?: string;
      jobTitle?: string;
      email?: string;
      phone?: string;
      notes?: string;
      role: UserRole;
    }
  ) {
    await run("updatePlayer", { playerId, input });
  },
  async setCurrentUser(_userId: string) {
    return;
  },
  async setRole(_role: UserRole) {
    return;
  },
  async updateSettings(patch: Partial<ClubState["settings"]>) {
    await run("updateSettings", patch);
  },
  async reset() {
    await run("reset");
  },
};

export function useClubStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isHydrated = useSyncExternalStore(
    subscribe,
    getReadySnapshot,
    () => false
  );
  const isSignedIn = useSyncExternalStore(
    subscribe,
    getSignedInSnapshot,
    () => false
  );
  const current = useMemo(() => {
    try {
      return getCurrentUser(state);
    } catch {
      return {
        user: state.users[0] ?? {
          id: "anon",
          playerId: "",
          email: "",
          name: "Гость",
          role: "viewer" as const,
        },
        player: undefined,
        role: "viewer" as const,
      };
    }
  }, [state]);

  useEffect(() => {
    void bootstrap().catch(() => {
      signedIn = false;
      ready = true;
      emit();
    });
  }, []);

  return {
    state,
    isHydrated,
    isSignedIn,
    currentUser: current.user,
    currentPlayer: current.player,
    role: current.role,
    actions: clubActions,
    refresh: useCallback(() => {
      void bootstrap();
    }, []),
  };
}
