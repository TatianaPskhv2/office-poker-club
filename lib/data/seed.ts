import { STARTING_RATING, scoreGameResult } from "@/lib/rating";
import { BADGES } from "@/lib/constants";
import type {
  BadgeKind,
  ClubState,
  GameResult,
  GameStatus,
  Player,
  RatingHistory,
} from "@/types";

type PlayerSeed = Omit<
  Player,
  | "rating"
  | "gamesPlayed"
  | "wins"
  | "losses"
  | "winRate"
  | "averagePosition"
  | "averageResult"
  | "bestPosition"
  | "bestResult"
  | "currentStreak"
  | "bestStreak"
  | "badges"
>;

const payoutShare = [0.5, 0.25, 0.15, 0.1];

function potFor(buyIn: number, count: number): number {
  return buyIn * count;
}

function payoutsFor(pot: number, field: number): number[] {
  return Array.from({ length: field }, (_, index) => {
    const share = payoutShare[index] ?? 0;
    return Math.round(pot * share);
  });
}

function emptyPlayer(seed: PlayerSeed): Player {
  return {
    ...seed,
    rating: STARTING_RATING,
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
    badges: [],
  };
}

export function recomputeClubState(state: ClubState): ClubState {
  const players = state.players.map((player) => emptyPlayer(player));
  const byId = new Map(players.map((player) => [player.id, player]));
  const completed = [...state.games]
    .filter((item) => item.status === "completed")
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));

  const results: GameResult[] = [];
  const ratingHistory: RatingHistory[] = players.map((player) => ({
    id: `rh-start-${player.id}`,
    playerId: player.id,
    rating: STARTING_RATING,
    delta: 0,
    recordedAt: `${player.joinedAt}T09:00:00.000Z`,
  }));

  completed.forEach((gameItem) => {
    const seated = state.participants.filter((item) => item.gameId === gameItem.id);
    const existing = state.results.filter((item) => item.gameId === gameItem.id);
    const ordered =
      existing.length > 0
        ? [...existing].sort((a, b) => a.place - b.place).map((item) => item.playerId)
        : seated.map((item) => item.playerId);
    const field = ordered.length;
    const pot =
      existing.length > 0
        ? existing.reduce((sum, item) => sum + item.payout, 0)
        : potFor(gameItem.buyIn, field);
    const payouts =
      existing.length > 0
        ? ordered.map(
            (playerId) => existing.find((item) => item.playerId === playerId)?.payout ?? 0
          )
        : payoutsFor(pot, field);

    ordered.forEach((playerId, index) => {
      const place = index + 1;
      const isWinner = place === 1;
      const delta = scoreGameResult(place, field, isWinner);
      const payout = payouts[index] ?? 0;
      const player = byId.get(playerId);
      if (!player) return;

      player.rating += delta;
      player.gamesPlayed += 1;
      if (isWinner) {
        player.wins += 1;
        player.currentStreak = player.currentStreak > 0 ? player.currentStreak + 1 : 1;
      } else {
        player.losses += 1;
        player.currentStreak = player.currentStreak < 0 ? player.currentStreak - 1 : -1;
      }
      player.bestStreak = Math.max(player.bestStreak, player.currentStreak);
      const profit = payout - gameItem.buyIn;
      player.bestResult = player.gamesPlayed === 1 ? profit : Math.max(player.bestResult, profit);
      player.bestPosition =
        player.gamesPlayed === 1 ? place : Math.min(player.bestPosition || place, place);

      results.push({
        id: `gr-${gameItem.id}-${playerId}`,
        gameId: gameItem.id,
        playerId,
        place,
        payout,
        ratingDelta: delta,
        isWinner,
      });

      ratingHistory.push({
        id: `rh-${gameItem.id}-${playerId}`,
        playerId,
        gameId: gameItem.id,
        rating: player.rating,
        delta,
        recordedAt: `${gameItem.date}T${gameItem.startTime}:00.000Z`,
      });
    });
  });

  const derivedPlayers = players.map((player) => {
    const playerResults = results.filter((item) => item.playerId === player.id);
    const gamesPlayed = playerResults.length;
    const avgPosition =
      gamesPlayed === 0
        ? 0
        : playerResults.reduce((sum, item) => sum + item.place, 0) / gamesPlayed;
    const avgResult =
      gamesPlayed === 0
        ? 0
        : playerResults.reduce((sum, item) => {
            const gameItem = state.games.find((g) => g.id === item.gameId);
            return sum + (item.payout - (gameItem?.buyIn ?? 0));
          }, 0) / gamesPlayed;
    return {
      ...player,
      winRate: gamesPlayed === 0 ? 0 : player.wins / gamesPlayed,
      averagePosition: Number(avgPosition.toFixed(2)),
      averageResult: Math.round(avgResult),
    };
  });

  const ranked = [...derivedPlayers].sort(
    (a, b) => b.rating - a.rating || b.wins - a.wins || a.name.localeCompare(b.name, "ru")
  );
  const mostActiveId = [...derivedPlayers]
    .filter((player) => player.gamesPlayed > 0)
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed || b.rating - a.rating)[0]?.id;

  const withBadges = derivedPlayers.map((player) => {
    const badges: BadgeKind[] = [];
    if (ranked[0]?.id === player.id && player.gamesPlayed > 0) badges.push("leader");
    if (player.id === mostActiveId) badges.push("most-active");
    if (player.currentStreak >= 2) badges.push("win-streak");
    if (player.gamesPlayed > 0 && player.gamesPlayed <= 3) badges.push("rookie");
    if (player.winRate >= 0.35 && player.gamesPlayed >= 5) badges.push("shark");
    if (player.averagePosition > 0 && player.averagePosition <= 3 && player.gamesPlayed >= 5) {
      badges.push("consistent");
    }
    return { ...player, badges };
  });

  const gamesWithStatus = state.games.map((gameItem) => {
    if (gameItem.status === "completed" || gameItem.status === "cancelled" || gameItem.status === "live") {
      return gameItem;
    }
    const count = state.participants.filter((item) => item.gameId === gameItem.id).length;
    const status: GameStatus = count >= gameItem.participantLimit ? "full" : "open";
    return {
      ...gameItem,
      status,
    };
  });

  return {
    ...state,
    players: withBadges,
    games: gamesWithStatus,
    results,
    ratingHistory,
  };
}

export function createSeedState(): ClubState {
  const admin = emptyPlayer({
    id: "p-tanya",
    userId: "u-tanya",
    name: "Татьяна Посохова",
    department: "",
    jobTitle: "Администратор",
    email: "romanenko-1007@mail.ru",
    role: "admin",
    joinedAt: "2025-01-10",
  });

  return recomputeClubState({
    users: [
      {
        id: "u-tanya",
        playerId: "p-tanya",
        email: "romanenko-1007@mail.ru",
        name: "Татьяна Посохова",
        role: "admin",
      },
    ],
    currentUserId: "u-tanya",
    players: [admin],
    venues: [],
    games: [],
    participants: [],
    results: [],
    ratingHistory: [],
    notifications: [],
    settings: {
      teamName: "Office Poker Club",
      defaultCurrency: "₽",
      defaultVenueId: "",
      seasonStart: "2026-01-01",
      notifyByDefault: true,
      dataMode: "mock",
    },
  });
}

export { BADGES };
