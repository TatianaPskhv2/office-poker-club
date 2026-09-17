import { scoreGameResult } from "@/lib/rating";
import type { CreateLiveInput, LiveHand, LivePlayer, LiveSession } from "@/types";

const PAYOUT_SHARE = [0.5, 0.25, 0.15, 0.1];

function now() {
  return new Date().toISOString();
}

function handId() {
  return `h-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function compareActive(a: LivePlayer, b: LivePlayer) {
  return b.stack - a.stack || b.handsWon - a.handsWon || a.name.localeCompare(b.name, "ru");
}

export function estimatedPlace(session: LiveSession, player: LivePlayer): number {
  if (player.place) return player.place;
  const active = session.players.filter((item) => item.status === "active").sort(compareActive);
  const index = active.findIndex((item) => item.playerId === player.playerId);
  return index >= 0 ? index + 1 : session.fieldSize;
}

export function refreshPreviews(session: LiveSession): LiveSession {
  const field = session.fieldSize;
  const players = session.players.map((player) => {
    const place = estimatedPlace(session, player);
    return {
      ...player,
      ratingPreview: scoreGameResult(place, field, place === 1),
    };
  });
  return { ...session, players };
}

export function createLiveSession(input: CreateLiveInput): LiveSession {
  const startedAt = now();
  const players: LivePlayer[] = input.players.map((player) => ({
    playerId: player.playerId,
    name: player.name,
    stack: input.buyIn,
    handsWon: 0,
    potsWon: 0,
    status: "active",
    ratingPreview: 0,
  }));
  return refreshPreviews({
    id: input.id,
    title: input.title,
    venueName: input.venueName,
    date: input.date,
    buyIn: input.buyIn,
    currency: input.currency,
    fieldSize: players.length,
    status: "live",
    startedAt,
    updatedAt: startedAt,
    players,
    hands: [],
  });
}

export function recordHand(session: LiveSession, winnerId: string, pot = 0): LiveSession {
  if (session.status !== "live") return session;
  const winner = session.players.find((player) => player.playerId === winnerId);
  if (!winner || winner.status !== "active") return session;
  const amount = Math.max(0, Math.round(pot) || 0);
  winner.handsWon += 1;
  winner.potsWon += amount;
  const hand: LiveHand = {
    id: handId(),
    winnerId,
    winnerName: winner.name,
    pot: amount,
    createdAt: now(),
  };
  session.hands.unshift(hand);
  session.updatedAt = hand.createdAt;
  return refreshPreviews(session);
}

export function bustPlayer(session: LiveSession, playerId: string): LiveSession {
  if (session.status !== "live") return session;
  const player = session.players.find((item) => item.playerId === playerId);
  if (!player || player.status !== "active") return session;
  const activeCount = session.players.filter((item) => item.status === "active").length;
  player.status = "eliminated";
  player.place = activeCount;
  player.stack = 0;
  session.updatedAt = now();

  const remaining = session.players.filter((item) => item.status === "active");
  if (remaining.length === 1) {
    remaining[0].place = 1;
    session.status = "closed";
    session.closedAt = session.updatedAt;
  } else if (remaining.length === 0) {
    session.status = "closed";
    session.closedAt = session.updatedAt;
  }
  return refreshPreviews(session);
}

export function setStack(session: LiveSession, playerId: string, stack: number): LiveSession {
  if (session.status !== "live") return session;
  const player = session.players.find((item) => item.playerId === playerId);
  if (!player || player.status !== "active") return session;
  const next = Math.max(0, Math.round(stack));
  player.stack = next;
  session.updatedAt = now();
  if (next === 0) return bustPlayer(session, playerId);
  return refreshPreviews(session);
}

export function closeTable(session: LiveSession): LiveSession {
  if (session.status !== "live") return session;
  const remaining = session.players
    .filter((player) => player.status === "active")
    .sort(compareActive);
  remaining.forEach((player, index) => {
    player.place = index + 1;
  });
  session.status = "closed";
  session.closedAt = now();
  session.updatedAt = session.closedAt;
  return refreshPreviews(session);
}

export function prizePool(session: LiveSession): number {
  return session.buyIn * session.fieldSize;
}

export function payoutForPlace(session: LiveSession, place: number): number {
  const share = PAYOUT_SHARE[place - 1] ?? 0;
  return Math.round(prizePool(session) * share);
}

export function liveResultEntries(session: LiveSession) {
  return [...session.players]
    .map((player) => ({
      playerId: player.playerId,
      place: player.place ?? estimatedPlace(session, player),
      payout: payoutForPlace(session, player.place ?? estimatedPlace(session, player)),
    }))
    .sort((a, b) => a.place - b.place);
}
