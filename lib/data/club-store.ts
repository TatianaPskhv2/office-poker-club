"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { LEGACY_STORAGE_KEYS, SEED_REVISION, STORAGE_KEY } from "@/lib/constants";
import { createSeedState, recomputeClubState } from "@/lib/data/seed";
import { getCurrentUser } from "@/lib/data/selectors";
import { durationInHours } from "@/lib/format";
import { scoreGameResult } from "@/lib/rating";
import type {
  ClubState,
  CreateGameInput,
  Player,
  SaveResultsInput,
  UserRole,
} from "@/types";

type Listener = () => void;

const listeners = new Set<Listener>();
const seed = createSeedState();
let memoryState: ClubState = seed;
let loaded = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(state: ClubState) {
  memoryState = state;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  emit();
}

function clearLegacyStorage() {
  if (typeof window === "undefined") return;
  LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
}

function migrateState(state: ClubState): ClubState {
  return {
    ...state,
    games: state.games.map((game) => ({
      ...game,
      duration: durationInHours(game.duration),
      venueId: "",
    })),
    players: state.players.map((player) => {
      const isTanya =
        player.id === "p-tanya" || player.name === "Татьяна Посохова";
      if (!isTanya) return player;
      return {
        ...player,
        jobTitle:
          player.jobTitle === "Product Manager" || !player.jobTitle
            ? "Администратор"
            : player.jobTitle,
        department: player.department === "Product" ? "" : player.department,
        email: player.email || "romanenko-1007@mail.ru",
      };
    }),
    users: state.users.map((user) =>
      user.id === "u-tanya"
        ? { ...user, name: "Татьяна Посохова", email: user.email || "romanenko-1007@mail.ru" }
        : user
    ),
  };
}

function readStorage(): ClubState {
  if (typeof window === "undefined") return seed;
  try {
    clearLegacyStorage();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as ClubState;
    if ((parsed.settings?.dataRevision ?? 0) < SEED_REVISION) {
      return seed;
    }
    return recomputeClubState(migrateState({ ...seed, ...parsed }));
  } catch {
    return seed;
  }
}

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  memoryState = readStorage();
}

function subscribe(listener: Listener) {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  ensureLoaded();
  return memoryState;
}

function getServerSnapshot() {
  return seed;
}

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function stamp() {
  return new Date().toISOString();
}

function update(mutator: (state: ClubState) => ClubState) {
  const next = recomputeClubState(mutator(structuredClone(getSnapshot())));
  persist(next);
  return next;
}

function enrollPlayers(gameId: string, playerIds: string[]) {
  let added = 0;
  update((state) => {
    const game = state.games.find((item) => item.id === gameId);
    if (!game || game.status === "cancelled" || game.status === "completed" || game.status === "live") {
      return state;
    }
    const joinedAt = stamp();
    playerIds.forEach((pid) => {
      if (!pid) return;
      const already = state.participants.some(
        (item) => item.gameId === gameId && item.playerId === pid
      );
      if (already) return;
      const count = state.participants.filter((item) => item.gameId === gameId).length;
      if (count >= game.participantLimit && !game.allowLateJoin) return;
      state.participants.push({
        id: nextId("gp"),
        gameId,
        playerId: pid,
        joinedAt,
      });
      added += 1;
    });
    if (added > 0) game.updatedAt = joinedAt;
    return state;
  });
  return added;
}

export const clubActions = {
  createGame(input: CreateGameInput) {
    const id = nextId("g");
    const createdAt = stamp();
    update((state) => {
      const { user } = getCurrentUser(state);
      const venueName = (input.venueName || "").trim() || "Место уточняется";
      const game = {
        id,
        title: input.title,
        date: input.date,
        startTime: input.startTime,
        duration: input.duration,
        venueId: "",
        venueName,
        address: (input.address || "").trim(),
        organizerId: user.playerId,
        participantLimit: input.participantLimit,
        buyIn: input.buyIn,
        currency: input.currency,
        status: "open" as const,
        notes: input.notes,
        allowLateJoin: input.allowLateJoin,
        notifyParticipants: input.notifyParticipants,
        createdAt,
        updatedAt: createdAt,
      };
      state.games.push(game);
      if (input.notifyParticipants) {
        state.notifications.unshift({
          id: nextId("n"),
          title: "Новая игра",
          body: `${game.title} — ${game.date}, ${game.venueName}`,
          createdAt,
          read: false,
          type: "game",
        });
      }
      return state;
    });
    return id;
  },

  updateGame(gameId: string, input: Partial<CreateGameInput>) {
    update((state) => {
      const game = state.games.find((item) => item.id === gameId);
      if (!game) return state;
      Object.assign(game, {
        ...input,
        venueId: "",
        venueName: input.venueName?.trim() || game.venueName,
        address: input.address !== undefined ? input.address.trim() : game.address,
        updatedAt: stamp(),
      });
      return state;
    });
  },

  cancelGame(gameId: string) {
    update((state) => {
      const game = state.games.find((item) => item.id === gameId);
      if (!game || game.status === "completed") return state;
      game.status = "cancelled";
      game.updatedAt = stamp();
      state.notifications.unshift({
        id: nextId("n"),
        title: "Игра отменена",
        body: `${game.title} больше не состоится.`,
        createdAt: stamp(),
        read: false,
        type: "game",
      });
      return state;
    });
  },

  deleteGame(gameId: string) {
    update((state) => {
      state.games = state.games.filter((item) => item.id !== gameId);
      state.participants = state.participants.filter((item) => item.gameId !== gameId);
      state.results = state.results.filter((item) => item.gameId !== gameId);
      return state;
    });
  },

  joinGame(gameId: string, playerId?: string) {
    const { user } = getCurrentUser(getSnapshot());
    return enrollPlayers(gameId, [playerId ?? user.playerId]);
  },

  joinPlayers(gameId: string, playerIds: string[]) {
    return enrollPlayers(gameId, playerIds);
  },

  leavePlayers(gameId: string, playerIds: string[]) {
    let removed = 0;
    update((state) => {
      const game = state.games.find((item) => item.id === gameId);
      if (!game || game.status === "completed" || game.status === "live") return state;
      const drop = new Set(playerIds);
      const before = state.participants.length;
      state.participants = state.participants.filter(
        (item) => !(item.gameId === gameId && drop.has(item.playerId))
      );
      removed = before - state.participants.length;
      if (removed > 0) game.updatedAt = stamp();
      return state;
    });
    return removed;
  },

  leaveGame(gameId: string, playerId?: string) {
    update((state) => {
      const { user } = getCurrentUser(state);
      const pid = playerId ?? user.playerId;
      const game = state.games.find((item) => item.id === gameId);
      if (!game || game.status === "completed" || game.status === "live") return state;
      state.participants = state.participants.filter(
        (item) => !(item.gameId === gameId && item.playerId === pid)
      );
      game.updatedAt = stamp();
      return state;
    });
  },

  markLive(gameId: string) {
    update((state) => {
      const game = state.games.find((item) => item.id === gameId);
      if (!game || game.status === "completed" || game.status === "cancelled") return state;
      game.status = "live";
      game.updatedAt = stamp();
      return state;
    });
  },

  cancelLive(gameId: string) {
    update((state) => {
      const game = state.games.find((item) => item.id === gameId);
      if (!game || game.status !== "live") return state;
      game.status = "open";
      game.updatedAt = stamp();
      state.results = state.results.filter((item) => item.gameId !== gameId);
      return state;
    });
  },

  saveResults(input: SaveResultsInput) {
    update((state) => {
      const game = state.games.find((item) => item.id === input.gameId);
      if (!game) return state;
      const field = input.entries.length;
      state.results = state.results.filter((item) => item.gameId !== input.gameId);
      input.entries.forEach((entry) => {
        const isWinner = entry.place === 1;
        state.results.push({
          id: nextId("gr"),
          gameId: game.id,
          playerId: entry.playerId,
          place: entry.place,
          payout: entry.payout,
          ratingDelta: scoreGameResult(entry.place, field, isWinner),
          isWinner,
        });
      });
      if (input.notes) {
        game.notes = [game.notes, input.notes].filter(Boolean).join("\n\n");
      }
      game.status = "completed";
      game.updatedAt = stamp();
      const winner = input.entries.find((item) => item.place === 1);
      const winnerName = state.players.find((item) => item.id === winner?.playerId)?.name;
      state.notifications.unshift({
        id: nextId("n"),
        title: "Результаты сохранены",
        body: winnerName
          ? `${winnerName} выиграл(а) «${game.title}».`
          : `Результаты «${game.title}» обновлены.`,
        createdAt: stamp(),
        read: false,
        type: "result",
      });
      return state;
    });
  },

  addPlayer(input: {
    name: string;
    department?: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
    notes?: string;
    role: UserRole;
  }) {
    const playerId = nextId("p");
    const userId = nextId("u");
    update((state) => {
      const player: Player = {
        id: playerId,
        userId,
        name: input.name.trim(),
        department: input.department?.trim() ?? "",
        jobTitle: input.jobTitle?.trim() ?? "",
        email: input.email?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
        role: input.role,
        rating: 1000,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        averagePosition: 0,
        averageResult: 0,
        bestPosition: 0,
        bestResult: 0,
        currentStreak: 0,
        bestStreak: 0,
        badges: ["rookie"],
        joinedAt: stamp().slice(0, 10),
      };
      state.players.push(player);
      state.users.push({
        id: userId,
        playerId,
        email: input.email?.trim() || `${playerId}@office.poker`,
        name: input.name.trim(),
        role: input.role,
      });
      return state;
    });
    return playerId;
  },

  updatePlayer(
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
    update((state) => {
      const player = state.players.find((item) => item.id === playerId);
      if (!player) return state;
      player.name = input.name.trim();
      player.department = input.department?.trim() ?? "";
      player.jobTitle = input.jobTitle?.trim() ?? "";
      player.email = input.email?.trim() || undefined;
      player.phone = input.phone?.trim() || undefined;
      player.notes = input.notes?.trim() || undefined;
      player.role = input.role;
      const user = state.users.find((item) => item.playerId === playerId);
      if (user) {
        user.name = player.name;
        user.email = player.email || user.email;
        user.role = input.role;
      }
      return state;
    });
  },

  setCurrentUser(userId: string) {
    update((state) => {
      state.currentUserId = userId;
      return state;
    });
  },

  setRole(role: UserRole) {
    update((state) => {
      const { user, player } = getCurrentUser(state);
      user.role = role;
      if (player) player.role = role;
      return state;
    });
  },

  updateSettings(patch: Partial<ClubState["settings"]>) {
    update((state) => {
      state.settings = { ...state.settings, ...patch };
      return state;
    });
  },

  reset() {
    persist(createSeedState());
  },
};

export function useClubStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const current = useMemo(() => getCurrentUser(state), [state]);
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  return {
    state,
    isHydrated,
    currentUser: current.user,
    currentPlayer: current.player,
    role: current.role,
    actions: clubActions,
    refresh: useCallback(() => emit(), []),
  };
}
