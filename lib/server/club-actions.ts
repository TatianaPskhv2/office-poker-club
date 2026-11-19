import { scoreGameResult } from "@/lib/rating";
import type { ClubState, CreateGameInput, Player, SaveResultsInput, User, UserRole } from "@/types";
import { nextId, stamp } from "@/lib/server/ids";

function requireAdmin(actor: User) {
  if (actor.role !== "admin") throw new Error("Недостаточно прав");
}

export function enrollPlayers(state: ClubState, gameId: string, playerIds: string[]) {
  const game = state.games.find((item) => item.id === gameId);
  if (!game || game.status === "cancelled" || game.status === "completed" || game.status === "live") {
    return state;
  }
  const joinedAt = stamp();
  let added = 0;
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
}

export function applyClubAction(
  state: ClubState,
  actor: User,
  action: string,
  payload: Record<string, unknown>
): ClubState {
  switch (action) {
    case "createGame": {
      requireAdmin(actor);
      const input = payload as unknown as CreateGameInput;
      const createdAt = stamp();
      const venueName = (input.venueName || "").trim() || "Место уточняется";
      state.games.push({
        id: nextId("g"),
        title: input.title,
        date: input.date,
        startTime: input.startTime,
        duration: input.duration,
        venueId: "",
        venueName,
        address: (input.address || "").trim(),
        organizerId: actor.playerId || "p-tanya",
        participantLimit: input.participantLimit,
        buyIn: input.buyIn,
        currency: input.currency,
        status: "open",
        notes: input.notes,
        allowLateJoin: input.allowLateJoin,
        notifyParticipants: input.notifyParticipants,
        createdAt,
        updatedAt: createdAt,
      });
      return state;
    }
    case "updateGame": {
      requireAdmin(actor);
      const game = state.games.find((item) => item.id === payload.gameId);
      if (!game) return state;
      const input = (payload.input ?? payload) as Partial<CreateGameInput>;
      Object.assign(game, {
        ...input,
        venueId: "",
        venueName: input.venueName?.trim() || game.venueName,
        address: input.address !== undefined ? input.address.trim() : game.address,
        updatedAt: stamp(),
      });
      return state;
    }
    case "cancelGame": {
      requireAdmin(actor);
      const game = state.games.find((item) => item.id === payload.gameId);
      if (!game || game.status === "completed") return state;
      game.status = "cancelled";
      game.updatedAt = stamp();
      return state;
    }
    case "deleteGame": {
      requireAdmin(actor);
      const gameId = String(payload.gameId);
      state.games = state.games.filter((item) => item.id !== gameId);
      state.participants = state.participants.filter((item) => item.gameId !== gameId);
      state.results = state.results.filter((item) => item.gameId !== gameId);
      return state;
    }
    case "joinGame": {
      const playerId = actor.role === "admin" && payload.playerId
        ? String(payload.playerId)
        : actor.playerId;
      if (!playerId || actor.role === "viewer") throw new Error("Недостаточно прав");
      if (actor.role !== "admin" && !state.players.some((item) => item.id === playerId)) {
        throw new Error("Сначала заполните профиль игрока");
      }
      return enrollPlayers(state, String(payload.gameId), [playerId]);
    }
    case "joinPlayers": {
      requireAdmin(actor);
      return enrollPlayers(state, String(payload.gameId), payload.playerIds as string[]);
    }
    case "leavePlayers": {
      requireAdmin(actor);
      const game = state.games.find((item) => item.id === payload.gameId);
      if (!game || game.status === "live") return state;
      const drop = new Set(payload.playerIds as string[]);
      state.participants = state.participants.filter(
        (item) => !(item.gameId === game.id && drop.has(item.playerId))
      );
      if (game.status === "completed") {
        state.results = state.results.filter(
          (item) => !(item.gameId === game.id && drop.has(item.playerId))
        );
      }
      game.updatedAt = stamp();
      return state;
    }
    case "leaveGame": {
      const game = state.games.find((item) => item.id === payload.gameId);
      if (!game || game.status === "completed" || game.status === "live") return state;
      const pid = actor.role === "admin" && payload.playerId ? String(payload.playerId) : actor.playerId;
      state.participants = state.participants.filter(
        (item) => !(item.gameId === game.id && item.playerId === pid)
      );
      game.updatedAt = stamp();
      return state;
    }
    case "markLive": {
      requireAdmin(actor);
      const game = state.games.find((item) => item.id === payload.gameId);
      if (!game || game.status === "completed" || game.status === "cancelled") return state;
      game.status = "live";
      game.updatedAt = stamp();
      return state;
    }
    case "cancelLive": {
      requireAdmin(actor);
      const game = state.games.find((item) => item.id === payload.gameId);
      if (!game || game.status !== "live") return state;
      game.status = "open";
      game.updatedAt = stamp();
      state.results = state.results.filter((item) => item.gameId !== game.id);
      return state;
    }
    case "saveResults": {
      requireAdmin(actor);
      const input = payload as unknown as SaveResultsInput;
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
      return state;
    }
    case "addPlayer": {
      requireAdmin(actor);
      const input = payload as {
        name: string;
        department?: string;
        jobTitle?: string;
        email?: string;
        phone?: string;
        notes?: string;
        role: UserRole;
      };
      const playerId = nextId("p");
      const userId = nextId("u");
      const player: Player = {
        id: playerId,
        userId,
        name: input.name.trim(),
        department: input.department?.trim() ?? "",
        jobTitle: input.jobTitle?.trim() ?? "",
        email: input.email?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
        role: input.role === "admin" ? "member" : input.role,
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
        role: player.role,
      });
      return state;
    }
    case "updatePlayer": {
      const playerId = String(payload.playerId);
      if (actor.role !== "admin" && actor.playerId !== playerId) {
        throw new Error("Недостаточно прав");
      }
      const player = state.players.find((item) => item.id === playerId);
      if (!player) return state;
      const input = payload.input as {
        name: string;
        department?: string;
        jobTitle?: string;
        email?: string;
        phone?: string;
        notes?: string;
        role: UserRole;
      };
      player.name = input.name.trim();
      player.department = input.department?.trim() ?? "";
      player.jobTitle = input.jobTitle?.trim() ?? "";
      player.email = input.email?.trim() || undefined;
      player.phone = input.phone?.trim() || undefined;
      player.notes = input.notes?.trim() || undefined;
      if (actor.role === "admin") player.role = input.role === "admin" ? "member" : input.role;
      const user = state.users.find((item) => item.playerId === playerId);
      if (user) {
        user.name = player.name;
        user.email = player.email || user.email;
        if (actor.role === "admin" && user.role !== "admin") user.role = player.role;
      }
      return state;
    }
    case "updateSettings": {
      requireAdmin(actor);
      state.settings = { ...state.settings, ...(payload as ClubState["settings"]) };
      return state;
    }
    case "reset": {
      requireAdmin(actor);
      throw new Error("RESET");
    }
    default:
      throw new Error("Неизвестное действие");
  }
}
