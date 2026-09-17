import { parseISO } from "date-fns";
import { scoreGameResult } from "@/lib/rating";
import type {
  ClubState,
  Game,
  LeaderboardPeriod,
  LeaderboardRow,
  Player,
} from "@/types";

export function getCurrentUser(state: ClubState) {
  const user = state.users.find((item) => item.id === state.currentUserId);
  if (!user) throw new Error("Current user is missing");
  const player = state.players.find((item) => item.id === user.playerId);
  return { user, player, role: player?.role ?? user.role };
}

export function getGamePlayers(state: ClubState, gameId: string): Player[] {
  const ids = state.participants
    .filter((item) => item.gameId === gameId)
    .map((item) => item.playerId);
  return ids
    .map((id) => state.players.find((player) => player.id === id))
    .filter((player): player is Player => Boolean(player));
}

export function isSignedUp(state: ClubState, gameId: string, playerId: string): boolean {
  return state.participants.some(
    (item) => item.gameId === gameId && item.playerId === playerId
  );
}

export function getWinner(state: ClubState, gameId: string): Player | undefined {
  const winner = state.results.find((item) => item.gameId === gameId && item.isWinner);
  if (!winner) return undefined;
  return state.players.find((player) => player.id === winner.playerId);
}

export function getGamePot(state: ClubState, game: Game): number {
  const fromResults = state.results.filter((item) => item.gameId === game.id);
  if (fromResults.length > 0) {
    return fromResults.reduce((sum, item) => sum + item.payout, 0);
  }
  const count = state.participants.filter((item) => item.gameId === game.id).length;
  return game.buyIn * count;
}

export function upcomingGames(state: ClubState): Game[] {
  return [...state.games]
    .filter((game) => game.status === "open" || game.status === "full" || game.status === "live")
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
}

export function nextGame(state: ClubState): Game | undefined {
  const live = state.games.find((game) => game.status === "live");
  if (live) return live;
  return upcomingGames(state)[0];
}

export function completedGames(state: ClubState): Game[] {
  return [...state.games]
    .filter((game) => game.status === "completed")
    .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
}

export function rankedPlayers(state: ClubState): Player[] {
  return [...state.players].sort(
    (a, b) => b.rating - a.rating || b.wins - a.wins || a.name.localeCompare(b.name, "ru")
  );
}

export function playerRank(state: ClubState, playerId: string): number {
  return rankedPlayers(state).findIndex((player) => player.id === playerId) + 1;
}

export function mostActivePlayer(state: ClubState): Player | undefined {
  return [...state.players].sort(
    (a, b) => b.gamesPlayed - a.gamesPlayed || b.rating - a.rating
  )[0];
}

export function averagePot(state: ClubState): number {
  const done = completedGames(state);
  if (done.length === 0) return 0;
  const total = done.reduce((sum, game) => sum + getGamePot(state, game), 0);
  return Math.round(total / done.length);
}

function inPeriod(date: string, period: LeaderboardPeriod, seasonStart: string): boolean {
  if (period === "all") return true;
  if (period === "season") return date >= seasonStart;
  const from = new Date("2026-09-17");
  from.setDate(from.getDate() - 30);
  return parseISO(date) >= from;
}

export function buildLeaderboard(
  state: ClubState,
  period: LeaderboardPeriod
): LeaderboardRow[] {
  const current = periodRows(state, period);
  const previous = periodRows(state, period, true);
  return current.map((row) => {
    const prev = previous.find((item) => item.player.id === row.player.id);
    const previousRank = prev?.rank ?? row.rank;
    return {
      ...row,
      previousRank,
      rankChange: previousRank - row.rank,
    };
  });
}

function periodRows(
  state: ClubState,
  period: LeaderboardPeriod,
  excludeLatest = false
): LeaderboardRow[] {
  let games = completedGames(state).filter((game) =>
    inPeriod(game.date, period, state.settings.seasonStart)
  );
  if (excludeLatest && games.length > 0) {
    games = games.slice(1);
  }
  const gameIds = new Set(games.map((game) => game.id));
  const rows = state.players.map((player) => {
    const playerResults = state.results.filter(
      (item) => item.playerId === player.id && gameIds.has(item.gameId)
    );
    const gamesPlayed = playerResults.length;
    const wins = playerResults.filter((item) => item.isWinner).length;
    const rating =
      1000 + playerResults.reduce((sum, item) => sum + item.ratingDelta, 0);
    const ratingDelta = playerResults.reduce((sum, item) => sum + item.ratingDelta, 0);
    const averageResult =
      gamesPlayed === 0
        ? 0
        : Math.round(
            playerResults.reduce((sum, item) => {
              const game = state.games.find((g) => g.id === item.gameId);
              return sum + (item.payout - (game?.buyIn ?? 0));
            }, 0) / gamesPlayed
          );
    return {
      player,
      rank: 0,
      previousRank: 0,
      rankChange: 0,
      rating,
      ratingDelta,
      gamesPlayed,
      wins,
      winRate: gamesPlayed === 0 ? 0 : wins / gamesPlayed,
      averageResult,
      bestStreak: player.bestStreak,
    };
  });

  return rows
    .sort(
      (a, b) =>
        b.rating - a.rating || b.wins - a.wins || a.player.name.localeCompare(b.player.name, "ru")
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function gamesByMonth(state: ClubState): { month: string; games: number }[] {
  const map = new Map<string, number>();
  state.games
    .filter((game) => game.status === "completed")
    .forEach((game) => {
      const key = game.date.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, games]) => ({ month, games }));
}

export function ratingSeriesForPlayer(state: ClubState, playerId: string) {
  return state.ratingHistory
    .filter((item) => item.playerId === playerId)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .map((item) => ({
      date: item.recordedAt.slice(0, 10),
      rating: item.rating,
      delta: item.delta,
    }));
}

export function monthlyActivityForPlayer(state: ClubState, playerId: string) {
  const map = new Map<string, number>();
  state.results
    .filter((item) => item.playerId === playerId)
    .forEach((item) => {
      const game = state.games.find((g) => g.id === item.gameId);
      if (!game) return;
      const key = game.date.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, games]) => ({ month, games }));
}

export function playerGameHistory(state: ClubState, playerId: string) {
  return state.results
    .filter((item) => item.playerId === playerId)
    .map((result) => {
      const game = state.games.find((item) => item.id === result.gameId);
      return { result, game };
    })
    .filter((item) => item.game)
    .sort((a, b) => `${b.game!.date}`.localeCompare(`${a.game!.date}`));
}

export function expectedScore(place: number, fieldSize: number, isWinner: boolean) {
  return scoreGameResult(place, fieldSize, isWinner);
}
